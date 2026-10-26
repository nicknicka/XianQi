import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'
import { FeedbackType, FeedbackTypeText, FeedbackStatus, FeedbackStatusText } from '@/utils/enums'

export interface UserFeedbackVO {
  feedbackId: number
  userId: number
  userNickname?: string
  userPhone?: string
  type: FeedbackType // 1-功能建议，2-Bug反馈，3-投诉，4-其他
  title?: string // 反馈标题
  content: string
  contact?: string
  images?: string[] // 或改为string类型后JSON.parse
  status: FeedbackStatus // 0-待处理，1-处理中，2-已处理，3-已驳回
  handlerId?: number // 处理人ID（管理员）
  handleNote?: string // 处理备注
  reply?: string
  createTime: string
  handleTime?: string
}

export interface FeedbackQueryParams extends PageParams {
  type?: FeedbackType
  status?: FeedbackStatus
  keyword?: string
  startTime?: string
  endTime?: string
}

/**
 * 获取反馈类型文字（使用统一枚举）
 */
export function getFeedbackTypeText(type: FeedbackType): string {
  return FeedbackTypeText[type] || '未知'
}

/**
 * 获取反馈状态文字（使用统一枚举）
 */
export function getFeedbackStatusText(status: FeedbackStatus): string {
  return FeedbackStatusText[status] || '未知'
}

export function getFeedbackList(params: FeedbackQueryParams) {
  return request<PageResponse<UserFeedbackVO>>({
    url: '/feedback/list',
    method: 'get',
    params,
  })
}

export function getFeedbackDetail(feedbackId: number) {
  return request<UserFeedbackVO>({
    url: `/feedback/${feedbackId}`,
    method: 'get',
  })
}

export function replyFeedback(feedbackId: number, reply: string) {
  return request<boolean>({
    url: '/feedback/handle',
    method: 'put',
    params: { id: feedbackId, result: reply },
  })
}

export function deleteFeedback(feedbackId: number) {
  return request<boolean>({
    url: `/feedback/${feedbackId}`,
    method: 'delete',
  })
}
