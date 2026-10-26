/**
 * 举报相关 API
 */
import { http } from '@/utils/request'

export enum ReportType {
  USER = 1, // 举报用户
  PRODUCT = 2, // 举报商品
  MESSAGE = 3, // 举报消息
  CONVERSATION = 4 // 举报会话
}

export enum ReportReason {
  FRAUD = 1, // 欺诈
  PORNOGRAPHY = 2, // 色情
  VIOLENCE = 3, // 暴力
  SPAM = 4, // 垃圾信息
  OTHER = 5 // 其他
}

export interface ReportCreateParams {
  reportedUserId: string // 被举报用户ID
  targetType?: ReportType // 前端兼容字段，后端未使用
  targetId?: string // 前端兼容字段，后端未使用
  reason: ReportReason | string // 举报原因
  description?: string // 详细描述
  images?: string[] // 证据图片
  conversationId?: string
  messageId?: string
}

function normalizeReason(reason: ReportReason | string): string {
  if (typeof reason === 'string') {
    return reason
  }

  const reasonMap: Record<number, string> = {
    [ReportReason.FRAUD]: '欺诈',
    [ReportReason.PORNOGRAPHY]: '色情',
    [ReportReason.VIOLENCE]: '暴力',
    [ReportReason.SPAM]: '垃圾信息',
    [ReportReason.OTHER]: '其他'
  }

  return reasonMap[reason] || '其他'
}

export const reportApi = {
  /**
   * 创建举报
   */
  createReport(data: ReportCreateParams) {
    return http.post('/report', {
      reportedUserId: String(data.reportedUserId),
      conversationId: data.conversationId ? String(data.conversationId) : undefined,
      messageId: data.messageId ? String(data.messageId) : undefined,
      reason: normalizeReason(data.reason),
      description: data.description,
      evidenceImages: data.images?.length ? JSON.stringify(data.images) : undefined
    }, { showLoading: true })
  },

  /**
   * 获取我的举报列表
   */
  getMyReports(params: { page?: number; size?: number }) {
    return http.get('/report', params)
  }
}

export default reportApi
