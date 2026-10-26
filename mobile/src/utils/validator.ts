/**
 * 表单验证工具类
 */

/**
 * 验证手机号
 */
export function isPhoneNumber(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱
 */
export function isEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
}

/**
 * 验证用户名 (2-20位字母数字下划线)
 */
export function isUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{2,20}$/.test(username)
}

/**
 * 验证密码 (6-20位)
 */
export function isPassword(password: string): boolean {
  return /^.{6,20}$/.test(password)
}

/**
 * 验证真实姓名 (中文姓名2-10个字符)
 */
export function isRealName(name: string): boolean {
  return /^[\u4e00-\u9fa5]{2,10}$/.test(name)
}

/**
 * 验证学号 (一般8-15位数字)
 */
export function isStudentId(studentId: string): boolean {
  return /^\d{8,15}$/.test(studentId)
}

/**
 * 验证身份证号
 */
export function isIdCard(idCard: string): boolean {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)
}

/**
 * 验证URL
 */
export function isUrl(url: string): boolean {
  return /^https?:\/\/.+/.test(url)
}

/**
 * 验证价格 (正数，最多两位小数)
 */
export function isPrice(price: string | number): boolean {
  return /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(price))
}

/**
 * 验证是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 验证图片文件类型
 */
export function isImageFile(fileName: string): boolean {
  const ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
}

/**
 * 验证文件大小 (单位: MB)
 */
export function isFileSizeValid(fileSize: number, maxSize: number = 5): boolean {
  return fileSize / 1024 / 1024 <= maxSize
}

export default {
  isPhoneNumber,
  isEmail,
  isUsername,
  isPassword,
  isRealName,
  isStudentId,
  isIdCard,
  isUrl,
  isPrice,
  isEmpty,
  isImageFile,
  isFileSizeValid
}
