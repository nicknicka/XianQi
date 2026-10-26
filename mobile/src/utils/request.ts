/**
 * 增强的网络请求工具类
 * 基于 uni.request 封装
 * 集成缓存、错误处理、请求重试等功能
 */

import { CacheTTL, CacheKeys, requestCache as cache } from './cache'
import { errorHandler, ErrorCode } from './error-handler'
import { requestWithRetry } from './error-handler'
import { getSystemInfo } from './system-info'
import { extractUserIdFromToken } from './id'

interface RequestOptions {
  /** 请求地址 */
  url: string
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** 请求数据 */
  data?: any
  /** 请求头 */
  header?: any
  /** 超时时间 */
  timeout?: number
  /** 是否显示 loading */
  showLoading?: boolean
  /** loading 文字 */
  loadingText?: string
  /** 是否使用缓存 */
  useCache?: boolean
  /** 缓存过期时间 */
  cacheTTL?: number
  /** 自定义缓存键 */
  cacheKey?: string
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟 */
  retryDelay?: number
  /** 是否显示错误提示 */
  showError?: boolean
}

interface RequestResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp?: number
}

function hasAuthFailureMessage(message?: string): boolean {
  if (!message) return false
  return (
    message.includes('用户未登录') ||
    message.includes('未登录或Token无效') ||
    message.includes('登录已过期') ||
    message.includes('Token无效')
  )
}

function isAuthFailureResponse(response: Partial<RequestResponse<any>> | null | undefined): boolean {
  if (!response) return false
  return response.code === 401 || hasAuthFailureMessage(response.message)
}

/**
 * 适配后端分页数据格式
 * MyBatis-Plus 的 IPage 返回 { records, total, size, current }
 * 前端期望 { list, total }
 */
function adaptResponseData<T>(data: any): T {
  if (!data) return data

  // 检查是否是分页数据格式 (MyBatis-Plus IPage)
  // 使用更健壮的检查方式，避免原型链属性的影响
  if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'records')) {
    console.log('[adaptResponseData] 检测到分页数据格式，进行转换:', data)
    const adapted = {
      ...data,
      list: data.records,
      total: data.total
    }
    console.log('[adaptResponseData] 转换后的数据:', adapted)
    return adapted as T
  }

  return data
}

/**
 * 清理请求参数，移除 undefined 和 null 值
 * 避免将字符串 "undefined" 或 "null" 发送到后端
 */
function cleanParams(params: any): any {
  if (!params || typeof params !== 'object') {
    return params
  }

  const cleaned: any = {}
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key]
      // 只保留非 undefined 和非 null 的值
      if (value !== undefined && value !== null) {
        cleaned[key] = value
      }
    }
  }

  return cleaned
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 请求队列（用于防重复请求）
const pendingRequests = new Map<string, Promise<any>>()

// 请求拦截器
function request<T = any>(options: RequestOptions): Promise<RequestResponse<T>> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    timeout = 10000,
    showLoading = false,
    loadingText = '加载中...',
    useCache = false,
    cacheTTL = CacheTTL.MEDIUM,
    cacheKey,
    maxRetries = 0,
    retryDelay = 1000,
    showError = true
  } = options

  // 生成缓存键
  const generateCacheKey = () => {
    if (cacheKey) return cacheKey
    return `${method}:${url}:${JSON.stringify(data || {})}`
  }

  const finalCacheKey = generateCacheKey()

  // 检查缓存
  if (useCache && method === 'GET') {
    const cachedData = cache.get<RequestResponse<T>>(finalCacheKey)
    if (cachedData !== null) {
      return Promise.resolve(cachedData)
    }
  }

  // 检查是否有重复请求正在进行
  if (pendingRequests.has(finalCacheKey)) {
    return pendingRequests.get(finalCacheKey)!
  }

  // 创建请求 Promise
  const requestPromise = (async () => {
    try {
      // 检查 Token 是否即将过期，直接从 storage 读取避免循环依赖
      const currentToken = uni.getStorageSync('token')
      if (currentToken) {
        const expireTime = uni.getStorageSync('tokenExpireTime')
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (expireTime && (expireTime - now < fiveMinutes)) {
          console.log('[Request] Token 即将过期，尝试刷新')
          try {
            const refreshResponse = await executeRequest<{ token: string; refreshToken: string; expiresIn: number }>({
              url: '/auth/refresh',
              method: 'POST',
              data: {},
              header: {},
              timeout: 5000,
              showLoading: false,
              showError: false
            })

            if (refreshResponse.code === 200 && refreshResponse.data) {
              const { token: newToken, expiresIn } = refreshResponse.data
              uni.setStorageSync('token', newToken)
              uni.setStorageSync('tokenExpireTime', Date.now() + expiresIn * 1000)
              console.log('[Request] Token 刷新成功')
            } else {
              console.warn('[Request] Token 刷新失败，清除登录状态')
              await executeTokenExpiredCleanup()
              throw new Error('Token 已过期，请重新登录')
            }
          } catch (refreshError) {
            console.warn('[Request] Token 刷新异常:', refreshError)
            await executeTokenExpiredCleanup()
            throw new Error('Token 已过期，请重新登录')
          }
        }
      }

      // 对于 GET 请求，清理参数以避免发送 undefined/null 值
      let requestData = data
      if (method === 'GET') {
        requestData = cleanParams(data)
        // 检查清理后的数据是否为有效对象，再调用 Object.keys
        if (requestData && typeof requestData === 'object' && Object.keys(requestData).length === 0) {
          requestData = undefined // 如果没有有效参数，不发送 data
        }
      }

      // 执行真实API请求
      const result = await requestWithRetry(
        () => executeRequest<T>({
          url,
          method,
          data: requestData,
          header,
          timeout,
          showLoading,
          loadingText,
          showError
        }),
        maxRetries,
        retryDelay
      )

      // 缓存结果
      if (useCache && method === 'GET' && result.code === 200) {
        cache.set(finalCacheKey, result, cacheTTL)
      }

      return result
    } catch (error) {
      throw error // 重新抛出错误
    } finally {
      // 请求完成后移除队列
      pendingRequests.delete(finalCacheKey)
    }
  })()

  // 添加到请求队列
  pendingRequests.set(finalCacheKey, requestPromise)

  return requestPromise
}

// 执行请求
function executeRequest<T>(options: {
  url: string
  method: string
  data?: any
  header?: any
  timeout?: number
  showLoading?: boolean
  loadingText?: string
  showError?: boolean
}): Promise<RequestResponse<T>> {
  const {
    url,
    method,
    data,
    header = {},
    timeout = 10000,
    showLoading = false,
    loadingText = '加载中...',
    showError = true
  } = options

  return new Promise((resolve, reject) => {
    // 显示 loading
    if (showLoading) {
      uni.showLoading({
        title: loadingText,
        mask: true
      })
    }

    // 获取 token
    const token = uni.getStorageSync('token')
    const requestHeader: any = {
      'Content-Type': 'application/json',
      ...header
    }

    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`
    }

    const storedUserInfo = uni.getStorageSync('userInfo') || {}
    const requestUserId = extractUserIdFromToken(token) || storedUserInfo.userId || storedUserInfo.id
    if (requestUserId) {
      requestHeader['X-User-Id'] = String(requestUserId)
    }

    // 添加设备信息（使用新的 API，避免弃用警告）
    try {
      const systemInfo = getSystemInfo()
      requestHeader['X-Device-Id'] = systemInfo.deviceId || systemInfo.model || 'unknown'
      requestHeader['X-Platform'] = systemInfo.platform || 'unknown'
      requestHeader['X-System'] = systemInfo.system || 'unknown'
      requestHeader['X-Brand'] = systemInfo.brand || 'unknown'
    } catch (e) {
      console.warn('获取系统信息失败:', e)
      requestHeader['X-Device-Id'] = 'unknown'
      requestHeader['X-Platform'] = 'unknown'
      requestHeader['X-System'] = 'unknown'
      requestHeader['X-Brand'] = 'unknown'
    }
    requestHeader['X-App-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0'

    // 添加请求时间戳
    requestHeader['X-Request-Time'] = Date.now().toString()

    const startTime = Date.now()

    const requestUrl = BASE_URL + url
    console.log(`[Request] ==================== 开始请求 ====================`)
    console.log(`[Request] 请求方法: ${method}`)
    console.log(`[Request] 请求地址: ${requestUrl}`)
    console.log(`[Request] 请求参数:`, JSON.stringify(data))
    console.log(`[Request] 请求头:`, JSON.stringify(requestHeader))
    console.log(`[Request] 超时时间: ${timeout}ms`)

    uni.request({
      url: requestUrl,
      method: method as any,
      data,
      header: requestHeader,
      timeout,
      success: (res: any) => {
        if (showLoading) {
          uni.hideLoading()
        }

        const endTime = Date.now()
        const duration = endTime - startTime
        console.log(`[Request] ==================== 请求成功 ====================`)
        console.log(`[Request] 请求地址: ${requestUrl}`)
        console.log(`[Request] 响应状态: ${res.statusCode}`)
        console.log(`[Request] 响应耗时: ${duration}ms`)
        console.log(`[Request] 响应数据:`, JSON.stringify(res.data))

        // Check if response exists
        if (!res) {
          const error = new Error('服务器响应格式错误')
          reject(error)
          return
        }

        // Handle HTTP error status codes (403, 404, 500, etc.)
        if (res.statusCode >= 400) {
          let errorMessage = '请求失败'
          let errorCode = res.statusCode

          // Try to parse error response if available
          if (res.data && typeof res.data === 'string') {
            try {
              const errorData = JSON.parse(res.data)
              errorMessage = errorData.message || errorMessage
            } catch {
              // If not JSON, use status text
            }
          } else if (res.data && res.data.message) {
            errorMessage = res.data.message
          }

          // Map common HTTP status codes
          const statusMessages: Record<number, string> = {
            400: '请求参数错误',
            401: '登录已过期',
            403: '无权限访问',
            404: '资源不存在',
            500: '服务器内部错误',
            502: '网关错误',
            503: '服务不可用'
          }
          errorMessage = statusMessages[res.statusCode] || errorMessage

          // Handle 401 specially - token expired
          if (res.statusCode === 401) {
            handleTokenExpired()
          }

          // Handle 403 - permission denied or not logged in
          // 如果用户未登录且请求被拒绝，静默处理（避免在首页等地方频繁提示）
          if (res.statusCode === 403 && !token) {
            console.warn(`[Request] 403 Forbidden (未登录): ${requestUrl}`)
            // 不显示错误提示，静默拒绝
            const error = new Error(errorMessage)
            error.name = 'HttpError'
            reject(error)
            return
          }

          // 其他403错误（已登录但无权限）按正常流程处理
          const error = new Error(errorMessage)
          error.name = 'HttpError'
          reject(error)
          return
        }

        // Check if response data exists
        if (!res.data) {
          const error = new Error('服务器响应格式错误')
          reject(error)
          return
        }

        const response = res.data as RequestResponse<T>

        // 添加响应时间戳
        if (response) {
          response.timestamp = Date.now()
        }

        // 适配后端数据格式 (处理分页数据)
        if (response.data) {
          response.data = adaptResponseData<T>(response.data)
        }

        // Token 过期/未登录处理
        if (isAuthFailureResponse(response)) {
          handleTokenExpired()
          reject(new Error(response.message || '登录已过期'))
          return
        }

        // 业务错误处理
        if (response.code !== 200) {
          if (showError) {
            errorHandler.handle(response, true)
          }
          reject(new Error(response.message))
          return
        }

        resolve(response)
      },
      fail: (err) => {
        if (showLoading) {
          uni.hideLoading()
        }

        const endTime = Date.now()
        const duration = endTime - startTime
        console.log(`[Request] ==================== 请求失败 ====================`)
        console.log(`[Request] 请求地址: ${requestUrl}`)
        console.log(`[Request] 失败耗时: ${duration}ms`)
        console.log(`[Request] 错误信息:`, err)
        console.log(`[Request] 错误详情:`, JSON.stringify(err))

        // 处理网络错误
        if (showError) {
          errorHandler.handle(err, true)
        }

        // 提供更有意义的错误信息
        const errorMessage = err?.errMsg || err?.message || '网络请求失败，请检查网络连接'
        reject(new Error(errorMessage))
      }
    })
  })
}

async function executeTokenExpiredCleanup() {
  try {
    const { useUserStore } = await import('@/store/user')
    const userStore = useUserStore()
    userStore.clearAuthState()
  } catch (error) {
    console.warn('[Request] 清理 Pinia 登录态失败，回退到 storage 清理:', error)
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('tokenExpireTime')
    uni.removeStorageSync('refreshToken')
  }
}

// 处理 Token 过期
function handleTokenExpired() {
  executeTokenExpiredCleanup()

  // 跳转到登录页
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  // 如果当前不是登录页，才跳转
  if (currentPage && !currentPage.route.includes('login')) {
    uni.showModal({
      title: '提示',
      content: '登录已过期，请重新登录',
      showCancel: false,
      success: () => {
        uni.navigateTo({
          url: '/pages/login/index'
        })
      }
    })
  }
}

// 清除指定 URL 的缓存
function clearCache(url: string, method = 'GET', data?: any) {
  const cacheKey = `${method}:${url}:${JSON.stringify(data || {})}`
  cache.remove(cacheKey)
}

// 清除所有缓存
function clearAllCache() {
  cache.clear()
}

// 取消所有进行中的请求
function cancelAllRequests() {
  pendingRequests.clear()
}

// 导出增强的 HTTP 方法
export const http = {
  get: <T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'method'>>
  ) => {
    return request<T>({ url, method: 'GET', data, ...options })
  },

  post: <T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'method'>>
  ) => {
    return request<T>({ url, method: 'POST', data, ...options })
  },

  put: <T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'method'>>
  ) => {
    return request<T>({ url, method: 'PUT', data, ...options })
  },

  delete: <T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'method'>>
  ) => {
    return request<T>({ url, method: 'DELETE', data, ...options })
  },

  patch: <T = any>(
    url: string,
    data?: any,
    options?: Partial<Omit<RequestOptions, 'method'>>
  ) => {
    return request<T>({ url, method: 'PATCH', data, ...options })
  },

  // 带缓存的 GET 请求（快捷方法）
  cachedGet: <T = any>(
    url: string,
    data?: any,
    cacheTTL = CacheTTL.MEDIUM
  ) => {
    return request<T>({ url, method: 'GET', data, useCache: true, cacheTTL })
  },

  // 清除缓存
  clearCache,
  clearAllCache,

  // 取消请求
  cancelAll: cancelAllRequests
}

export default request
export type { RequestOptions, RequestResponse }
