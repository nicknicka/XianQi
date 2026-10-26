/**
 * 信用分数据转换工具
 * 处理前后端数据格式不一致问题
 */

/**
 * 转换后端返回的信用分详情数据
 * 处理 BigDecimal 字符串转数字的问题
 */
export function transformCreditDetail(data: any): any {
  if (!data) return null

  return {
    ...data,
    // 处理 BigDecimal 字段
    goodRate: parseNumber(data.goodRate),
    todayGain: parseNumber(data.todayGain),
    todayRemaining: parseNumber(data.todayRemaining),

    // 处理历史记录中的 BigDecimal
    scoreHistory: data.scoreHistory?.map((record: any) => ({
      ...record,
      scoreChange: parseNumber(record.scoreChange)
    })) || []
  }
}

/**
 * 安全解析数字
 * 处理字符串和 BigDecimal 返回的数字格式
 */
export function parseNumber(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // 移除可能的千位分隔符等
    const cleaned = value.replace(/,/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/**
 * 格式化分数变化显示
 */
export function formatScoreChange(scoreChange: number): string {
  if (scoreChange > 0) {
    return `+${scoreChange.toFixed(1)}`
  }
  return scoreChange.toFixed(1)
}

/**
 * 格式化好评率
 */
export function formatGoodRate(goodRate: number): string {
  return `${goodRate.toFixed(1)}%`
}

/**
 * 验证信用分数据完整性
 */
export function validateCreditDetail(data: any): boolean {
  if (!data) return false

  // 检查必需字段
  const requiredFields = [
    'creditScore',
    'creditLevel',
    'creditLevelText'
  ]

  for (const field of requiredFields) {
    if (data[field] === null || data[field] === undefined) {
      console.warn(`信用分数据缺少必需字段: ${field}`)
      return false
    }
  }

  // 检查信用分范围
  if (data.creditScore < 0 || data.creditScore > 100) {
    console.warn(`信用分超出有效范围: ${data.creditScore}`)
    return false
  }

  return true
}

/**
 * 获取默认信用分详情（用于空状态）
 */
export function getDefaultCreditDetail(): any {
  return {
    creditScore: 60,
    creditLevel: 'normal',
    creditLevelText: '一般',
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    totalEvaluations: 0,
    goodRate: 0,
    transactionCount: 0,
    scoreHistory: [],
    nextLevelGap: 10,
    todayGain: 0,
    todayRemaining: 3
  }
}
