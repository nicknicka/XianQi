import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_BASE_URL,
  timeout: 10000,
})

// 请求配置类型，扩展AxiosRequestConfig
export interface RequestConfig extends AxiosRequestConfig {
  skipErrorHandler?: boolean // 是否跳过全局错误处理
}

// 响应数据类型定义
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求日志
    console.log('🚀 [Request]', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      params: config.params,
      data: config.data,
      headers: {
        Authorization: config.headers.Authorization,
      },
    })

    return config
  },
  (error) => {
    console.error('❌ [Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 添加响应日志
    console.log('✅ [Response]', {
      status: response.status,
      statusText: response.statusText,
      data: res,
      url: response.config.url,
    })

    // 检查响应格式：如果有 code 字段，按标准格式处理
    // 如果没有 code 字段，直接返回数据（适用于分页数据等直接返回数据的接口）
    if (res.hasOwnProperty('code')) {
      // 如果code不是200，则判断为错误
      if (res.code !== 200) {
        console.error('❌ [Business Error]', {
          code: res.code,
          message: res.message,
          data: res.data,
        })
        ElMessage.error(res.message || '请求失败')

        // Token过期，跳转登录
        if (res.code === 401) {
          localStorage.removeItem('admin_token')
          window.location.href = '/admin/login'
        }

        return Promise.reject(new Error(res.message || '请求失败'))
      }

      // 处理长整型ID精度丢失问题：将 data 中的长整型字段转换为字符串
      const processedData = convertLongFields(res.data)

      // 标准格式返回处理后的 data
      return processedData
    }

    // 没有 code 字段，也递归转换业务 ID，覆盖直接返回数组或分页对象的接口
    return convertLongFields(res)
  },
  (error: AxiosError) => {
    // 添加错误日志
    console.error('❌ [Response Error]', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      config: {
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
      },
    })

    const status = error.response?.status

    // 处理 401 和 403 错误 - token过期或无权限
    if (status === 401 || status === 403) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('admin_token')

      // 延迟1.5秒后跳转，让用户看到提示信息
      setTimeout(() => {
        window.location.href = '/admin/login'
      }, 1500)

      return Promise.reject(error)
    }

    // 其他错误
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

/**
 * 转换长整型字段为字符串，避免精度丢失
 */
function convertLongFields(data: any): any {
  if (!data) return data

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => convertLongFields(item))
  }

  // 如果是对象，递归处理每个字段
  if (typeof data === 'object') {
    const converted: any = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // 将业务 ID 字段（如 sessionId、templateId、userIds 等）转换为字符串
        if (isIdField(key) && typeof data[key] === 'number') {
          converted[key] = String(data[key])
        } else if (isIdField(key) && Array.isArray(data[key])) {
          converted[key] = data[key].map((id: unknown) => typeof id === 'number' ? String(id) : id)
        } else {
          converted[key] = convertLongFields(data[key])
        }
      }
    }
    return converted
  }

  return data
}


function isIdField(key: string): boolean {
  return key === 'id' || key.endsWith('Id') || key.endsWith('Ids') || key.endsWith('_id') || key.endsWith('_ids')
}

export default service

// 导出一个类型安全的请求方法
export function request<T = any>(config: RequestConfig): Promise<T> {
  return service(config) as Promise<T>
}
