import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

// ==================== 类型定义 ====================

/**
 * 黑名单记录 VO
 */
export interface BlacklistVO {
  blacklistId: string
  userId: string
  userNickname?: string
  userPhone?: string
  blockedUserId: string
  blockedUserNickname?: string
  blockedUserPhone?: string
  reason?: string
  createdAt: string
}

/**
 * 黑名单查询参数
 */
export interface BlacklistQueryParams extends PageParams {
  userId?: string
  blockedUserId?: string
  keyword?: string // 搜索用户昵称或手机号
  startTime?: string
  endTime?: string
}

// ==================== API 接口 ====================

/**
 * 分页查询黑名单列表
 */
export function getBlacklistList(params: BlacklistQueryParams) {
  return request<PageResponse<BlacklistVO>>({
    url: '/blacklist/list',
    method: 'get',
    params,
  })
}

/**
 * 获取黑名单详情
 */
export function getBlacklistDetail(blacklistId: string) {
  return request<BlacklistVO>({
    url: `/blacklist/${blacklistId}`,
    method: 'get',
  })
}

/**
 * 删除黑名单记录（解除拉黑）
 */
export function deleteBlacklist(blacklistId: string) {
  return request<boolean>({
    url: `/blacklist/${blacklistId}`,
    method: 'delete',
  })
}

/**
 * 批量删除黑名单记录
 */
export function batchDeleteBlacklist(blacklistIds: string[]) {
  return request<boolean>({
    url: '/blacklist/batch',
    method: 'delete',
    data: { blacklistIds },
  })
}

/**
 * 获取黑名单统计信息
 */
export interface BlacklistStatistics {
  totalCount: number
  todayCount: number
  weekCount: number
  monthCount: number
  topBlockedUsers: BlacklistVO[] // 被拉黑次数最多的用户
}

export function getBlacklistStatistics() {
  return request<BlacklistStatistics>({
    url: '/blacklist/statistics',
    method: 'get',
  })
}
