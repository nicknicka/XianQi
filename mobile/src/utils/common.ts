/**
 * 通用工具函数库
 */

/**
 * 格式化日期时间
 * @param timestamp 时间戳或日期字符串
 * @param format 格式化模板
 */
export function formatTime(
  timestamp: string | number | Date,
  format: 'datetime' | 'date' | 'time' | 'relative' | 'full' = 'datetime'
): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 相对时间（刚刚、5分钟前等）
  if (format === 'relative') {
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (seconds < 60) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (months < 12) return `${months}个月前`
    return `${years}年前`
  }

  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hour}:${minute}:${second}`
    case 'datetime':
      return `${year}-${month}-${day} ${hour}:${minute}`
    case 'full':
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    default:
      return `${year}-${month}-${day} ${hour}:${minute}`
  }
}

/**
 * 格式化数字（千分位）
 * @param num 数字
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化金额
 * @param amount 金额
 * @param currency 货币符号
 */
export function formatAmount(amount: number, currency = '¥'): string {
  return `${currency}${formatNumber(amount)}`
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 格式化距离
 * @param meters 米数
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
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

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (obj instanceof Object) {
    const clonedObj: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * 对象合并（深合并）
 * @param target 目标对象
 * @param sources 源对象数组
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        deepMerge(target[key] as any, source[key] as any)
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return deepMerge(target, ...sources)
}

function isObject(item: any): item is object {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * 生成唯一ID
 * @param prefix 前缀
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 数组去重
 * @param arr 数组
 * @param key 对象数组的去重键
 */
export function unique<T>(arr: T[], key?: keyof T): T[] {
  if (!key) return Array.from(new Set(arr))
  const seen = new Set<any>()
  return arr.filter(item => {
    const k = item[key]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * 数组分组
 * @param arr 数组
 * @param key 分组键
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * 数组排序
 * @param arr 数组
 * @param key 排序键
 * @param order 排序方向
 */
export function sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * 数组分页
 * @param arr 数组
 * @param page 页码（从1开始）
 * @param pageSize 每页数量
 */
export function paginate<T>(arr: T[], page: number, pageSize: number): {
  data: T[]
  total: number
  currentPage: number
  totalPages: number
} {
  const total = arr.length
  const totalPages = Math.ceil(total / pageSize)
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const data = arr.slice(start, end)

  return { data, total, currentPage, totalPages }
}

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试函数
 * @param fn 要执行的函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1))
      }
    }
  }

  throw lastError
}

/**
 * 批量执行（并发控制）
 * @param tasks 任务数组
 * @param concurrency 并发数
 */
export async function batch<T, R>(
  tasks: Array<(item: T) => Promise<R>>,
  items: T[],
  concurrency = 5
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (const item of items) {
    const task = tasks[items.indexOf(item)]
    const promise = task(item).then(result => {
      results.push(result)
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      )
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * URL参数解析
 * @param url URL字符串
 */
export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  const queryString = url.split('?')[1]
  if (!queryString) return params

  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=')
    params[decodeURIComponent(key)] = decodeURIComponent(value || '')
  })

  return params
}

/**
 * 构建URL参数
 * @param params 参数对象
 */
export function buildUrlParams(params: Record<string, any>): string {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

/**
 * 获取随机数
 * @param min 最小值
 * @param max 最大值
 */
export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 获取随机数组元素
 * @param arr 数组
 */
export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 数组乱序
 * @param arr 数组
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 验证手机号
 * @param phone 手机号
 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱
 * @param email 邮箱
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 验证身份证号
 * @param idCard 身份证号
 */
export function isValidIdCard(idCard: string): boolean {
  return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(
    idCard
  )
}

/**
 * 隐藏手机号中间四位
 * @param phone 手机号
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 隐藏身份证号中间部分
 * @param idCard 身份证号
 */
export function maskIdCard(idCard: string): string {
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

/**
 * 复制到剪贴板
 * @param text 文本
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // uniapp 环境
    if (typeof uni !== 'undefined') {
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '复制成功', icon: 'success' })
        }
      })
      return true
    }
    // 浏览器环境
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

/**
 * 图片转Base64
 * @param file 文件对象
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Base64转Blob
 * @param base64 Base64字符串
 */
export function base64ToBlob(base64: string): Blob {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * 下载文件
 * @param url 文件URL
 * @param filename 文件名
 */
export function downloadFile(url: string, filename?: string): void {
  const link = document.createElement('a')
  link.href = url
  if (filename) {
    link.download = filename
  }
  link.click()
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

/**
 * 检查是否为图片文件
 * @param filename 文件名
 */
export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

/**
 * 获取对比色（黑色或白色）
 * @param hexColor 十六进制颜色
 */
export function getContrastColor(hexColor: string): '#000000' | '#ffffff' {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

/**
 * 颜色加深
 * @param color 颜色
 * @param percent 百分比
 */
export function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = (num >> 8 & 0x00FF) - amt
  const B = (num & 0x0000FF) - amt
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

/**
 * 触觉反馈
 * @param type 反馈类型
 */
export function vibrate(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium'): void {
  if (typeof uni !== 'undefined') {
    const typeMap: Record<string, any> = {
      light: 'light',
      medium: 'medium',
      heavy: 'heavy',
      success: [0, 50, 50, 50],
      warning: [0, 30, 50, 30],
      error: [0, 50, 30, 50, 30, 50]
    }
    uni.vibrateShort({ type: type === 'heavy' ? 'heavy' : typeMap[type] || 'medium' })
  }
}

/**
 * 打电话
 * @param phoneNumber 电话号码
 */
export function makePhoneCall(phoneNumber: string): void {
  if (typeof uni !== 'undefined') {
    uni.makePhoneCall({ phoneNumber })
  }
}

/**
 * 扫码
 */
export function scanCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof uni !== 'undefined') {
      uni.scanCode({
        success: (res: any) => resolve(res.result),
        fail: reject
      })
    } else {
      reject(new Error('不支持扫码'))
    }
  })
}

export default {
  formatTime,
  formatNumber,
  formatAmount,
  formatBytes,
  formatDistance,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  generateId,
  generateUUID,
  unique,
  groupBy,
  sortBy,
  paginate,
  sleep,
  retry,
  batch,
  parseUrlParams,
  buildUrlParams,
  random,
  randomItem,
  shuffle,
  isValidPhone,
  isValidEmail,
  isValidIdCard,
  maskPhone,
  maskIdCard,
  copyToClipboard,
  imageToBase64,
  base64ToBlob,
  downloadFile,
  getFileExtension,
  isImageFile,
  getContrastColor,
  darkenColor,
  vibrate,
  makePhoneCall,
  scanCode
}


/**
 * 格式化共享物品的可借用时间。
 *
 * 入参是共享物品的 availableTime 字段（JSON 字符串），形如
 * `{"rentalType":"days","rentalDays":3,"deliveryMethod":"both"}`。
 * 字段名已在 api 层归一（后端原名为 availableTimes）。
 * 解析失败或字段缺失时回退为原文或「随时可借用」。
 *
 * 原先在 share/index.vue、share/detail.vue、message/chat.vue 各有一份逐字相同的实现。
 */
export function formatAvailableTime(raw?: string | null): string {
  if (!raw) return '随时可借用'

  try {
    const obj = JSON.parse(raw)
    const parts: string[] = []

    if (obj.rentalType === 'days' && obj.rentalDays) {
      parts.push(`可借${obj.rentalDays}天`)
    } else if (obj.rentalType === 'hours' && obj.rentalHours) {
      parts.push(`可借${obj.rentalHours}小时`)
    }

    const deliveryMap: Record<string, string> = {
      self: '自取',
      mailing: '邮寄',
      both: '自取/邮寄'
    }

    if (obj.deliveryMethod) {
      parts.push(deliveryMap[obj.deliveryMethod] || obj.deliveryMethod)
    }

    return parts.length > 0 ? parts.join(' · ') : '随时可借用'
  } catch {
    return raw || '随时可借用'
  }
}
