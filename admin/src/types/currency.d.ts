/**
 * 金额相关类型定义
 * 用于确保金额字段使用string类型，避免JavaScript精度问题
 */

/**
 * 金额类型（字符串）
 * 用于表示价格、金额等 monetary 值
 */
export type AmountString = string

/**
 * 可选金额类型
 */
export type OptionalAmountString = AmountString | undefined

/**
 * 价格类型
 */
export type PriceString = AmountString

/**
 * 货币代码
 */
export type CurrencyCode = 'CNY' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'HKD' | 'TWD' | 'KRW'

/**
 * 货币配置
 */
export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  decimals: number
  thousandsSeparator: boolean
}

/**
 * 支持的货币配置
 */
export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  CNY: { code: 'CNY', symbol: '¥', decimals: 2, thousandsSeparator: true },
  USD: { code: 'USD', symbol: '$', decimals: 2, thousandsSeparator: true },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, thousandsSeparator: true },
  JPY: { code: 'JPY', symbol: '¥', decimals: 0, thousandsSeparator: true },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, thousandsSeparator: true },
  HKD: { code: 'HKD', symbol: 'HK$', decimals: 2, thousandsSeparator: true },
  TWD: { code: 'TWD', symbol: 'NT$', decimals: 0, thousandsSeparator: true },
  KRW: { code: 'KRW', symbol: '₩', decimals: 0, thousandsSeparator: true },
}

/**
 * 金额范围
 */
export interface AmountRange {
  min?: AmountString
  max?: AmountString
}

/**
 * 金额统计
 */
export interface AmountStatistics {
  total: AmountString
  average: AmountString
  min: AmountString
  max: AmountString
}

/**
 * 带货币符号的金额显示
 */
export interface FormattedAmount {
  value: AmountString
  formatted: string
  symbol: string
  currency: CurrencyCode
}

/**
 * 金额验证结果
 */
export interface AmountValidationResult {
  valid: boolean
  error?: string
  value?: number
}
