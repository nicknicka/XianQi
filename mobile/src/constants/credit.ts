/**
 * 信用分相关常量
 */

/**
 * 信用分配置
 */
export const CREDIT_CONFIG = {
  // 初始分数
  INITIAL_SCORE: 60,

  // 分数范围
  MIN_SCORE: 0,
  MAX_SCORE: 100,

  // 每日/周/月加分上限（防刷）
  DAILY_MAX_GAIN: 3,        // 每天最多+3分
  WEEKLY_MAX_GAIN: 15,      // 每周最多+15分
  MONTHLY_MAX_GAIN: 50,     // 每月最多+50分

  // 单次加分上限
  SINGLE_TRANSACTION_MAX: 2,  // 单次交易最多+2分

  // 衰减配置
  INACTIVE_DAYS: 90,       // 90天不活跃开始衰减
  DECAY_RATE: 0.5,         // 每30天衰减0.5分
  DECAY_MIN: 60,           // 衰减最低到60分
} as const

/**
 * 信用等级枚举
 */
export enum CreditLevel {
  EXCELLENT = 'excellent',  // 90-100 优秀
  GOOD = 'good',            // 80-89 良好
  NORMAL = 'normal',        // 70-79 一般
  POOR = 'poor'             // 0-69 较差
}

/**
 * 获取信用等级
 */
export function getCreditLevel(score: number): CreditLevel {
  if (score >= 90) return CreditLevel.EXCELLENT
  if (score >= 80) return CreditLevel.GOOD
  if (score >= 70) return CreditLevel.NORMAL
  return CreditLevel.POOR
}

/**
 * 获取信用等级文本
 */
export function getCreditLevelText(level: CreditLevel): string {
  const map = {
    [CreditLevel.EXCELLENT]: '优秀',
    [CreditLevel.GOOD]: '良好',
    [CreditLevel.NORMAL]: '一般',
    [CreditLevel.POOR]: '较差'
  }
  return map[level]
}

/**
 * 获取信用等级文本（根据分数）
 */
export function getCreditLevelTextByScore(score: number): string {
  return getCreditLevelText(getCreditLevel(score))
}

/**
 * 获取信用等级颜色
 */
export function getCreditLevelColor(level: CreditLevel): string {
  const map = {
    [CreditLevel.EXCELLENT]: '#52C41A',  // 绿色
    [CreditLevel.GOOD]: '#1890FF',       // 蓝色
    [CreditLevel.NORMAL]: '#FA8C16',     // 橙色
    [CreditLevel.POOR]: '#FF4D4F'        // 红色
  }
  return map[level]
}

/**
 * 获取信用等级背景色
 */
export function getCreditLevelBgColor(level: CreditLevel): string {
  const map = {
    [CreditLevel.EXCELLENT]: 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)',
    [CreditLevel.GOOD]: 'linear-gradient(135deg, #1890FF 0%, #096DD9 100%)',
    [CreditLevel.NORMAL]: 'linear-gradient(135deg, #FA8C16 0%, #D46B08 100%)',
    [CreditLevel.POOR]: 'linear-gradient(135deg, #FF4D4F 0%, #CF1322 100%)'
  }
  return map[level]
}

/**
 * 计算距离下一等级所需分数
 */
export function calculateNextLevelGap(score: number): number {
  if (score >= 90) return 0
  if (score >= 80) return 90 - score
  if (score >= 70) return 80 - score
  return 70 - score
}

/**
 * 计算进度百分比
 */
export function calculateProgressPercent(score: number): number {
  if (score >= 90) return 100
  if (score >= 80) return ((score - 80) / 10) * 100
  if (score >= 70) return ((score - 70) / 10) * 100
  return (score / 70) * 100
}
