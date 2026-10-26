/**
 * 信用分相关类型定义
 */

/**
 * 信用分记录
 */
export interface CreditRecord {
  scoreChange: number          // 变化分数
  scoreAfter: number           // 变化后分数
  reason: string               // 原因
  reasonDetail?: string        // 原因详情
  createdAt: string            // 创建时间
}

/**
 * 信用分详情
 */
export interface CreditDetail {
  creditScore: number          // 当前信用分
  creditLevel: string          // 信用等级
  creditLevelText: string      // 信用等级文本
  positiveCount: number        // 好评数
  neutralCount: number         // 中评数
  negativeCount: number        // 差评数
  totalEvaluations: number     // 总评价数
  goodRate: number             // 好评率
  transactionCount: number     // 完成交易数
  scoreHistory: CreditRecord[] // 信用分变化记录
  nextLevelGap: number         // 距离下一等级所需分数
  todayGain: number            // 今日已获得分数
  todayRemaining: number       // 今日剩余可获分数
}

/**
 * 信用分规则
 */
export interface CreditRules {
  initialScore: number
  scoreRange: string
  dailyMaxGain: number
  weeklyMaxGain: number
  monthlyMaxGain: number
  gainRules: RuleItem[]
  lossRules: RuleItem[]
  decayRule: DecayRuleItem
}

/**
 * 规则项
 */
export interface RuleItem {
  title: string                // 标题
  description: string          // 描述
  limit: string                // 限制说明
  score: string                // 分数变化
}

/**
 * 衰减规则项
 */
export interface DecayRuleItem {
  title: string
  description: string
  limit: string
}

/**
 * 信用变化原因
 */
export enum CreditReason {
  TRANSACTION = 'transaction',                      // 完成交易
  EVALUATION_GOOD = 'evaluation_good',              // 收到好评
  EVALUATION_NEUTRAL = 'evaluation_neutral',        // 收到中评
  EVALUATION_BAD = 'evaluation_bad',                // 收到差评
  CANCEL_ORDER = 'cancel_order',                    // 取消订单
  AUTH_REAL_NAME = 'auth_real_name',                // 实名认证
  AUTH_STUDENT = 'auth_student',                    // 学生认证
  AUTH_PHONE = 'auth_phone',                        // 手机绑定
  DECAY = 'decay',                                  // 长期不活跃衰减
  PENALTY_VIOLATION = 'penalty_violation',          // 违规惩罚
  PENALTY_REPORT = 'penalty_report',                // 举报成立
  PENALTY_PRODUCT_REMOVED = 'penalty_product_removed', // 商品下架
  REPORT_ACCEPTED = 'report_accepted',              // 举报被采纳
  PRODUCT_PUBLISH = 'product_publish',              // 发布商品
  FEEDBACK = 'feedback',                            // 提交反馈
}

/**
 * 获取信用变化原因文本
 */
export function getCreditReasonText(reason: string): string {
  const map: Record<string, string> = {
    transaction: '完成交易',
    evaluation_good: '收到好评',
    evaluation_neutral: '收到中评',
    evaluation_bad: '收到差评',
    cancel_order: '取消订单',
    auth_real_name: '实名认证',
    auth_student: '学生认证',
    auth_phone: '手机绑定',
    decay: '长期不活跃衰减',
    penalty_violation: '违规惩罚',
    penalty_report: '举报成立',
    penalty_product_removed: '商品下架',
    report_accepted: '举报被采纳',
    product_publish: '发布商品',
    feedback: '提交反馈'
  }
  return map[reason] || reason
}
