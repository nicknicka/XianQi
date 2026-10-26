/**
 * 全局错误处理工具
 * 统一处理应用中的错误
 */

/**
 * 业务错误码
 */
export enum ErrorCode {
  // 用户相关 10000-19999
  USER_NOT_FOUND = 10001,
  USER_ALREADY_EXISTS = 10002,
  USER_PASSWORD_ERROR = 10003,
  USER_BANNED = 10004,
  USER_NOT_LOGIN = 10005,
  USER_PHONE_VERIFIED = 10006,

  // 商品相关 20000-29999
  PRODUCT_NOT_FOUND = 20001,
  PRODUCT_OFF_SHELF = 20002,
  PRODUCT_SOLD_OUT = 20003,
  PRODUCT_NO_PERMISSION = 20004,

  // 订单相关 30000-39999
  ORDER_NOT_FOUND = 30001,
  ORDER_STATUS_ERROR = 30002,
  ORDER_NO_PERMISSION = 30003,
  ORDER_TIMEOUT = 30004,

  // 聊天相关 40000-49999
  CONVERSATION_NOT_FOUND = 40001,
  MESSAGE_RECALLED = 40002,
  MESSAGE_NOT_FOUND = 40003,
  CONVERSATION_BLOCKED = 40004,

  // 内容相关 50000-59999
  SENSITIVE_WORD = 50001,
  IMAGE_REVIEW_FAILED = 50002,
  CONTENT_AUDIT_PENDING = 50003,

  // 系统相关 90000-99999
  SYSTEM_ERROR = 90001,
  NETWORK_ERROR = 90002,
  SERVER_ERROR = 90003,
  MAINTENANCE = 90004
}

/**
 * 错误消息映射
 */
const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.USER_ALREADY_EXISTS]: '用户已存在',
  [ErrorCode.USER_PASSWORD_ERROR]: '密码错误',
  [ErrorCode.USER_BANNED]: '账号已被封禁',
  [ErrorCode.USER_NOT_LOGIN]: '请先登录',
  [ErrorCode.USER_PHONE_VERIFIED]: '手机号已验证',
  [ErrorCode.PRODUCT_NOT_FOUND]: '商品不存在',
  [ErrorCode.PRODUCT_OFF_SHELF]: '商品已下架',
  [ErrorCode.PRODUCT_SOLD_OUT]: '商品已售出',
  [ErrorCode.PRODUCT_NO_PERMISSION]: '无权操作此商品',
  [ErrorCode.ORDER_NOT_FOUND]: '订单不存在',
  [ErrorCode.ORDER_STATUS_ERROR]: '订单状态错误',
  [ErrorCode.ORDER_NO_PERMISSION]: '无权操作此订单',
  [ErrorCode.ORDER_TIMEOUT]: '订单已超时',
  [ErrorCode.CONVERSATION_NOT_FOUND]: '会话不存在',
  [ErrorCode.MESSAGE_RECALLED]: '消息已撤回',
  [ErrorCode.MESSAGE_NOT_FOUND]: '消息不存在',
  [ErrorCode.CONVERSATION_BLOCKED]: '无法发送消息',
  [ErrorCode.SENSITIVE_WORD]: '内容包含敏感词',
  [ErrorCode.IMAGE_REVIEW_FAILED]: '图片审核未通过',
  [ErrorCode.CONTENT_AUDIT_PENDING]: '内容审核中',
  [ErrorCode.SYSTEM_ERROR]: '系统错误，请稍后重试',
  [ErrorCode.NETWORK_ERROR]: '网络连接失败',
  [ErrorCode.SERVER_ERROR]: '服务器错误',
  [ErrorCode.MAINTENANCE]: '系统维护中'
}

/**
 * 错误处理类
 */
class ErrorHandler {
  /**
   * 处理错误
   * @param error 错误对象
   * @param showMessage 是否显示错误提示，默认true
   * @returns 错误消息
   */
  handle(error: any, showMessage = true): string {
    let message = '操作失败，请稍后重试'
    let errorCode: ErrorCode | null = null

    // 处理API响应错误（直接从后端返回的响应对象）
    if (error?.code !== undefined && error?.message) {
      errorCode = error.code
      message = error.message || ErrorMessages[error.code] || message
    }
    // 处理axios风格的API错误
    else if (error?.response?.data) {
      const { code, message: msg } = error.response.data
      errorCode = code
      message = msg || ErrorMessages[code] || message
    }
    // 处理网络错误
    else if (error?.message?.includes('network')) {
      errorCode = ErrorCode.NETWORK_ERROR
      message = ErrorMessages[ErrorCode.NETWORK_ERROR]
    }
    // 处理超时错误
    else if (error?.message?.includes('timeout')) {
      errorCode = ErrorCode.SERVER_ERROR
      message = '请求超时，请稍后重试'
    }
    // 处理业务错误码
    else if (typeof error === 'number' && ErrorMessages[error]) {
      errorCode = error
      message = ErrorMessages[error]
    }
    // 处理字符串错误
    else if (typeof error === 'string') {
      message = error
    }
    // 处理Error对象
    else if (error instanceof Error) {
      message = error.message || message
    }

    // 显示错误提示
    if (showMessage) {
      this.showToast(message)
    }

    return message
  }

  /**
   * 显示错误提示
   * @param message 提示消息
   */
  private showToast(message: string): void {
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  }

  /**
   * 将错误上报到服务器
   * @param error 错误对象
   * @param errorCode 错误码
   */
  private async reportError(error: any, errorCode: ErrorCode | null): Promise<void> {
    // 实现错误上报逻辑
    // 例如：调用错误上报API
  }
}

// 创建单例实例
export const errorHandler = new ErrorHandler()

/**
 * 带重试的请求封装
 * @param requestFn 请求函数
 * @param maxRetries 最大重试次数，默认3次
 * @param delay 重试延迟（毫秒），默认1000ms
 * @returns Promise<T>
 */
export async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any

  // 如果 maxRetries 为 0 或负数，直接执行一次请求
  const actualRetries = Math.max(0, maxRetries)
  const shouldRetry = actualRetries > 0

  // 如果不重试，直接执行请求
  if (!shouldRetry) {
    return await requestFn()
  }

  // 重试逻辑
  for (let i = 0; i <= actualRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error

      // 如果是业务错误，不重试
      if (error?.response?.data?.code) {
        throw error
      }

      // 最后一次重试失败，抛出错误
      if (i === actualRetries) {
        throw error
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }

  // 这行理论上不会执行到，但为了类型安全
  throw lastError || new Error('请求失败')
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}
