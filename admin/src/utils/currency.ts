/**
 * 金额处理工具函数
 * 用于处理字符串类型的金额，避免JavaScript精度问题
 */

/**
 * 格式化金额显示
 * @param amount 金额字符串
 * @param decimals 小数位数，默认2位
 * @param symbol 货币符号，默认¥
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(
  amount: string | number,
  decimals: number = 2,
  symbol: string = '¥'
): string {
  // 如果是number类型，先转换为string
  const amountStr = typeof amount === 'number' ? amount.toString() : amount

  // 处理空值
  if (!amountStr || amountStr === '0' || amountStr === '0.00') {
    return `${symbol}0.00`
  }

  // 转换为数字进行格式化
  const num = parseFloat(amountStr)
  if (isNaN(num)) {
    return `${symbol}0.00`
  }

  // 格式化金额
  const formatted = num.toFixed(decimals)
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${symbol}${parts.join('.')}`
}

/**
 * 金额相加
 * @param amounts 金额数组
 * @returns 相加结果字符串
 */
export function addAmounts(...amounts: Array<string | number>): string {
  const sum = amounts.reduce((total, amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount || '0')
    return total + (isNaN(num) ? 0 : num)
  }, 0)

  return sum.toString()
}

/**
 * 金额相减
 * @param minuend 被减数
 * @param subtrahend 减数
 * @returns 相减结果字符串
 */
export function subtractAmounts(
  minuend: string | number,
  subtrahend: string | number
): string {
  const num1 = typeof minuend === 'number' ? minuend : parseFloat(minuend || '0')
  const num2 = typeof subtrahend === 'number' ? subtrahend : parseFloat(subtrahend || '0')

  if (isNaN(num1) || isNaN(num2)) {
    return '0'
  }

  return (num1 - num2).toString()
}

/**
 * 金额相乘
 * @param amount 金额
 * @param multiplier 乘数
 * @returns 相乘结果字符串
 */
export function multiplyAmount(
  amount: string | number,
  multiplier: number
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0')

  if (isNaN(num) || isNaN(multiplier)) {
    return '0'
  }

  return (num * multiplier).toString()
}

/**
 * 金额除法
 * @param amount 金额
 * @param divisor 除数
 * @param decimals 小数位数，默认2位
 * @returns 相除结果字符串
 */
export function divideAmount(
  amount: string | number,
  divisor: number,
  decimals: number = 2
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0')

  if (isNaN(num) || isNaN(divisor) || divisor === 0) {
    return '0'
  }

  return (num / divisor).toFixed(decimals)
}

/**
 * 比较金额大小
 * @param amount1 金额1
 * @param amount2 金额2
 * @returns 1: amount1 > amount2, 0: amount1 = amount2, -1: amount1 < amount2
 */
export function compareAmounts(
  amount1: string | number,
  amount2: string | number
): number {
  const num1 = typeof amount1 === 'number' ? amount1 : parseFloat(amount1 || '0')
  const num2 = typeof amount2 === 'number' ? amount2 : parseFloat(amount2 || '0')

  if (isNaN(num1) || isNaN(num2)) {
    return 0
  }

  if (num1 > num2) return 1
  if (num1 < num2) return -1
  return 0
}

/**
 * 验证金额格式
 * @param amount 金额字符串
 * @returns 是否有效
 */
export function isValidAmount(amount: string | number): boolean {
  if (typeof amount === 'number') {
    return !isNaN(amount) && amount >= 0
  }

  // 检查字符串格式：允许数字、小数点、逗号
  const regex = /^[0-9,.]+$/
  if (!regex.test(amount)) {
    return false
  }

  const num = parseFloat(amount.replace(/,/g, ''))
  return !isNaN(num) && num >= 0
}

/**
 * 将金额字符串转换为安全数字（用于计算）
 * @param amount 金额字符串
 * @returns number类型的金额
 */
export function toNumber(amount: string | number): number {
  if (typeof amount === 'number') {
    return amount
  }

  const num = parseFloat(amount?.replace(/,/g, '') || '0')
  return isNaN(num) ? 0 : num
}

/**
 * 格式化为分（用于API请求）
 * @param amount 元为单位的金额
 * @returns 分为单位的整数
 */
export function toCents(amount: string | number): number {
  const num = toNumber(amount)
  return Math.round(num * 100)
}

/**
 * 从分转换为元（用于API响应处理）
 * @param cents 分为单位的金额
 * @returns 元为单位的字符串
 */
export function fromCents(cents: number): string {
  return (cents / 100).toString()
}

/**
 * 金额范围验证
 * @param amount 金额
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在范围内
 */
export function isAmountInRange(
  amount: string | number,
  min: number = 0,
  max: number = Infinity
): boolean {
  const num = toNumber(amount)
  return num >= min && num <= max
}
