import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

// ==================== 类型定义 ====================

/**
 * 举报记录 VO
 */
export interface ReportVO {
  reportId: number
  reporterId: number
  reporterNickname?: string
  reporterPhone?: string
  reportedUserId: number
  reportedUserNickname?: string
  reportedUserPhone?: string
  conversationId?: number
  messageId?: number
  reason: string
  description?: string
  evidenceImages?: string[]
  status: number // 0-待处理，1-已处理，2-已驳回
  adminNote?: string
  createTime: string
  handleTime?: string
}

/**
 * 举报查询参数
 */
export interface ReportQueryParams extends PageParams {
  reporterId?: number
  reportedUserId?: number
  status?: number
  reason?: string
  startTime?: string
  endTime?: string
}

/**
 * 举报处理参数
 */
export interface ReportHandleParams {
  reportId: number
  status: number // 1-已处理，2-已驳回
  adminNote?: string
}

/**
 * 举报统计信息
 */
export interface ReportStatistics {
  total: number
  statusStats: {
    pending: number
    processed: number
    rejected: number
  }
  todayCount: number
  weekCount?: number
  monthCount?: number
  reasonStats?: Array<{ reason: string; count?: number }>
}

// ==================== API 接口 ====================

/**
 * 分页查询举报列表
 */
export function getReportList(params: ReportQueryParams) {
  return request<PageResponse<ReportVO>>({
    url: '/report/list',
    method: 'get',
    params,
  })
}

/**
 * 获取举报详情
 */
export function getReportDetail(reportId: number) {
  return request<ReportVO>({
    url: `/report/${reportId}`,
    method: 'get',
  })
}

/**
 * 处理举报
 */
export function handleReport(data: ReportHandleParams) {
  return request<boolean>({
    url: data.status === 2 ? `/report/${data.reportId}/reject` : `/report/${data.reportId}/handle`,
    method: 'put',
    params: { adminNote: data.adminNote },
  })
}

/**
 * 获取举报统计信息
 */
export async function getReportStatistics(): Promise<ReportStatistics> {
  const result = await request<ReportStatistics>({
    url: '/report/statistics',
    method: 'get',
  })
  return result as unknown as ReportStatistics
}

/**
 * 批量处理举报
 */
export function batchHandleReports(data: { reportIds: number[]; status: number; adminNote?: string }) {
  if (data.status === 2) {
    return Promise.reject(new Error('当前后端暂不支持批量驳回举报'))
  }

  return request<boolean>({
    url: '/report/batch/handle',
    method: 'put',
    params: { adminNote: data.adminNote },
    data: data.reportIds,
  })
}

/**
 * 删除举报记录
 */
export function deleteReport(reportId: number) {
  return request<boolean>({
    url: `/report/${reportId}`,
    method: 'delete',
  })
}
