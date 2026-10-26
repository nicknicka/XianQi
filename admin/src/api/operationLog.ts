import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

/**
 * 后端实际返回的操作日志 VO
 */
interface BackendOperationLogVO {
  logId: number
  userId: number
  username?: string
  module: string
  action: string
  description?: string
  requestMethod?: string
  requestUrl?: string
  requestParams?: string
  bizId?: number
  bizType?: string
  ipAddress?: string
  userAgent?: string
  status: number
  errorMessage?: string
  executeTime?: number
  createTime: string
}

/**
 * 前端使用的操作日志 VO（字段映射）
 */
export interface OperationLogVO {
  logId: number
  userId: number
  username?: string
  module: string
  action: string  // 后端的 action 字段
  operation: string  // 前端兼容：映射到 action
  description?: string
  requestMethod?: string  // 后端的 requestMethod 字段
  method: string  // 前端兼容：映射到 requestMethod
  requestUrl?: string
  requestParams?: string  // 后端的 requestParams 字段
  params: string  // 前端兼容：映射到 requestParams
  bizId?: number
  bizType?: string
  ipAddress?: string  // 后端的 ipAddress 字段
  ip: string  // 前端兼容：映射到 ipAddress
  userAgent?: string
  browser?: string  // 从 userAgent 提取
  os?: string  // 从 userAgent 提取
  status: number
  errorMessage?: string  // 后端的 errorMessage 字段
  errorMsg: string  // 前端兼容：映射到 errorMessage
  executeTime?: number  // 后端的 executeTime 字段
  costTime: number  // 前端兼容：映射到 executeTime
  createTime: string
  // 兼容 location 字段（暂时设为空，后续可实现IP地理位置查询）
  location?: string
}

/**
 * 操作日志查询参数
 */
export interface OperationLogQueryParams extends PageParams {
  userId?: number
  username?: string
  module?: string
  operation?: string  // 映射到后端的 action
  action?: string  // 后端使用的字段名
  status?: number
  startTime?: string
  endTime?: string
}

/**
 * 字段映射：将后端返回的数据转换为前端使用的格式
 */
function transformBackendToFrontend(backend: BackendOperationLogVO): OperationLogVO {
  return {
    ...backend,
    // 前端兼容字段
    operation: backend.action,
    method: backend.requestMethod || '',
    params: backend.requestParams || '',
    ip: backend.ipAddress || '',
    costTime: backend.executeTime || 0,
    errorMsg: backend.errorMessage || '',
    // 从 userAgent 提取浏览器信息
    browser: extractBrowser(backend.userAgent),
    os: extractOS(backend.userAgent),
    // location 暂时为空（后续可接入IP地理位置查询API）
    location: undefined,
  }
}

/**
 * 从 User-Agent 中提取浏览器信息
 */
function extractBrowser(userAgent?: string): string | undefined {
  if (!userAgent) return undefined
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Unknown'
}

/**
 * 从 User-Agent 中提取操作系统信息
 */
function extractOS(userAgent?: string): string | undefined {
  if (!userAgent) return undefined
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) return 'MacOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  return 'Unknown'
}

export function getOperationLogList(params: OperationLogQueryParams) {
  // 将前端的 operation 参数映射到后端的 action
  const requestParams: any = { ...params }
  if (params.operation) {
    requestParams.action = params.operation
    delete requestParams.operation
  }

  return request<PageResponse<BackendOperationLogVO>>({
    url: '/operation-log/list',
    method: 'get',
    params: requestParams,
  }).then((res: any) => {
    // 处理可能的不同响应格式
    const pageData = res.data || res
    // 转换后端返回的数据为前端格式
    return {
      ...pageData,
      records: pageData.records.map(transformBackendToFrontend),
    }
  })
}

export function deleteOperationLog(logId: number) {
  return request<boolean>({
    url: `/operation-log/${logId}`,
    method: 'delete',
  })
}

export function batchDeleteOperationLogs(logIds: number[]) {
  return request<boolean>({
    url: '/operation-log/batch',
    method: 'delete',
    data: { logIds },
  })
}

export function clearOperationLogs() {
  return request<boolean>({
    url: '/operation-log/clear',
    method: 'delete',
  })
}
