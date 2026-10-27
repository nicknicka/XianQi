import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

// ==================== 类型定义 ====================

/**
 * 举报对象类型
 */
export type ReportTargetType = 'user' | 'product' | 'message' | 'conversation'

/**
 * 举报记录 VO
 */
export interface ReportVO {
  reportId: string
  reporterId: string
  reporterNickname?: string
  reporterPhone?: string
  /** 举报对象类型：user/product/message/conversation */
  targetType: ReportTargetType
  /** 举报对象ID */
  targetId: string
  /** 被举报人ID（仅当举报对象为用户时由 targetId 派生） */
  reportedUserId?: string
  reportedUserNickname?: string
  reportedUserPhone?: string
  reason: string
  description?: string
  evidenceImages?: string[]
  /** 举报类型：0-其他 1-欺诈 2-色情 3-暴力 4-垃圾信息 */
  type?: number
  status: number // 0-待处理，1-已处理，2-已驳回
  handlerId?: string
  /** 处理备注 */
  handleNote?: string
  createdAt: string
  handleTime?: string
}

/**
 * 举报查询参数
 */
export interface ReportQueryParams extends PageParams {
  reporterId?: string
  status?: number
  reason?: string
  startTime?: string
  endTime?: string
}

/**
 * 举报处理参数
 */
export interface ReportHandleParams {
  reportId: string
  status: number // 1-已处理，2-已驳回
  handleNote?: string
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
export function getReportDetail(reportId: string) {
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
    params: { handleNote: data.handleNote },
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
export function batchHandleReports(data: { reportIds: string[]; status: number; handleNote?: string }) {
  if (data.status === 2) {
    return Promise.reject(new Error('当前后端暂不支持批量驳回举报'))
  }

  return request<boolean>({
    url: '/report/batch/handle',
    method: 'put',
    params: { handleNote: data.handleNote },
    data: data.reportIds,
  })
}

/**
 * 删除举报记录
 */
export function deleteReport(reportId: string) {
  return request<boolean>({
    url: `/report/${reportId}`,
    method: 'delete',
  })
}
