/**
 * 日期时间工具类
 */

/**
 * 将日期字符串转换为 iOS 兼容的格式
 * iOS 不支持 "YYYY-MM-DD HH:mm:ss" 格式，只支持 "YYYY/MM/DD HH:mm:ss" 或 ISO 8601 格式
 */
function parseDate(date: Date | string | number): Date {
  if (!date) {
    return new Date() // 空值返回当前时间
  }
  if (typeof date === 'string') {
    // 处理空字符串
    if (!date.trim()) {
      return new Date()
    }

    let processedDate = date

    // 检查是否是 ISO 8601 格式（包含 T）
    if (date.includes('T')) {
      // ISO 8601 格式：YYYY-MM-DDTHH:mm:ss 或 YYYY-MM-DDTHH:mm:ss.sss
      // 这种格式在大多数现代浏览器中都支持，不需要转换
      const parsed = new Date(date)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
      // 如果解析失败，尝试转换为兼容格式
      processedDate = date.replace('T', ' ')
      // 替换所有的 - 为 /（除了时间部分）
      const parts = processedDate.split(' ')
      if (parts.length >= 2) {
        parts[0] = parts[0].replace(/-/g, '/')
        processedDate = parts.join(' ')
      }
    } else if (date.includes('-') && date.includes(':')) {
      // 格式：YYYY-MM-DD HH:mm:ss
      const parts = date.split(' ')
      if (parts.length >= 2) {
        // 只替换日期部分的 - 为 /
        parts[0] = parts[0].replace(/-/g, '/')
        processedDate = parts.join(' ')
      } else {
        // 只有日期，没有时间
        processedDate = date.replace(/-/g, '/')
      }
    }

    const parsed = new Date(processedDate)
    // 检查是否为无效日期
    if (isNaN(parsed.getTime())) {
      console.warn('[parseDate] 无效的日期格式:', date, '处理后:', processedDate)
      return new Date()
    }
    return parsed
  }
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) {
    console.warn('[parseDate] 无效的日期:', date)
    return new Date()
  }
  return parsed
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = parseDate(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期 (YYYY-MM-DD)
 */
export function formatDate(date: Date | string | number): string {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间 (HH:mm)
 */
export function formatTime(date: Date | string | number): string {
  return formatDateTime(date, 'HH:mm')
}

/**
 * 获取相对时间 (如: 刚刚、5分钟前、1小时前、昨天、前天、3天前)
 */
export function getRelativeTime(date: Date | string | number): string {
  const now = Date.now()
  const target = parseDate(date).getTime()
  const diff = now - target

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 2 * day) {
    return '昨天'
  } else if (diff < 3 * day) {
    return '前天'
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return formatDate(date)
  }
}

/**
 * 计算两个日期之间的天数差
 */
export function getDaysDiff(date1: Date | string | number, date2: Date | string | number): number {
  const d1 = parseDate(date1).getTime()
  const d2 = parseDate(date2).getTime()
  return Math.floor(Math.abs(d2 - d1) / (24 * 60 * 60 * 1000))
}

/**
 * 判断是否为今天
 */
export function isToday(date: Date | string | number): boolean {
  const d = parseDate(date)
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

/**
 * 判断是否为本周
 */
export function isThisWeek(date: Date | string | number): boolean {
  const d = parseDate(date)
  const today = new Date()
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
  return d >= firstDayOfWeek && d <= lastDayOfWeek
}

/**
 * 获取星期几
 */
export function getWeekDay(date: Date | string | number): string {
  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weeks[parseDate(date).getDay()]
}

/**
 * 时间戳转日期
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp)
}

/**
 * 日期转时间戳
 */
export function dateToTimestamp(date: Date | string | number): number {
  return new Date(date).getTime()
}

export default {
  formatDateTime,
  formatDate,
  formatTime,
  getRelativeTime,
  getDaysDiff,
  isToday,
  isThisWeek,
  getWeekDay,
  timestampToDate,
  dateToTimestamp
}
