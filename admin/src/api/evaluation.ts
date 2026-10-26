import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

// ==================== 类型定义 ====================

/**
 * 评价 VO
 */
export interface EvaluationVO {
  evaluationId: number
  orderId: number
  orderNo?: string
  rating: number // 1-5星
  content?: string
  tags?: string // 评价标签（JSON字符串）
  evaluatorId: number // 评价人ID
  evaluatorNickname?: string // 评价人昵称
  evaluatorAvatar?: string // 评价人头像
  evaluatedUserId: number // 被评价人ID
  evaluatedUserNickname?: string // 被评价人昵称
  evaluatedUserAvatar?: string // 被评价人头像
  targetType?: number // 评价对象类型：1-评价卖家 2-评价买家
  productId?: number
  productTitle?: string
  productImage?: string
  createTime: string
}

/**
 * 解析标签JSON字符串
 */
export function parseTags(tagsStr?: string): string[] {
  if (!tagsStr) return []
  try {
    const parsed = JSON.parse(tagsStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 评价查询参数
 */
export interface EvaluationQueryParams extends PageParams {
  fromUserId?: number
  toUserId?: number
  orderId?: number
  score?: number // 评分筛选
  keyword?: string // 搜索内容
  startTime?: string
  endTime?: string
}

/**
 * 评价统计信息
 */
export interface EvaluationStatistics {
  totalCount: number
  averageScore: number // 平均评分
  fiveStarCount: number // 5星评价数
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
  todayCount: number
  weekCount: number
  monthCount: number
}

// ==================== API 接口 ====================

/**
 * 分页查询评价列表
 */
export function getEvaluationList(params: EvaluationQueryParams) {
  return request<PageResponse<EvaluationVO>>({
    url: '/evaluation/list',
    method: 'get',
    params,
  })
}

/**
 * 获取评价详情
 */
export function getEvaluationDetail(evalId: number) {
  return request<EvaluationVO>({
    url: `/evaluation/${evalId}`,
    method: 'get',
  })
}

/**
 * 删除评价
 */
export function deleteEvaluation(evalId: number) {
  return request<boolean>({
    url: `/evaluation/${evalId}`,
    method: 'delete',
  })
}

/**
 * 批量删除评价
 */
export function batchDeleteEvaluations(evalIds: number[]) {
  return request<boolean>({
    url: '/evaluation/batch',
    method: 'delete',
    data: { evalIds },
  })
}

/**
 * 获取评价统计信息
 */
export function getEvaluationStatistics() {
  return request<EvaluationStatistics>({
    url: '/evaluation/statistics',
    method: 'get',
  })
}
