/**
 * 黑名单相关 API
 */
import { http } from '@/utils/request'

export interface BlacklistUser {
  id: string
  userId: string
  blockedUserId: string
  reason: string
  createdAt: string
  // 用户信息
  username: string
  nickname: string
  avatar: string
}

export const blacklistApi = {
  /**
   * 添加黑名单
   */
  addToBlacklist(blockedUserId: string, reason?: string) {
    const suffix = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    return http.post(`/blacklist/${blockedUserId}${suffix}`, undefined, { showLoading: true })
  },

  /**
   * 移除黑名单
   */
  removeFromBlacklist(blacklistId: string) {
    return http.delete(`/blacklist/${blacklistId}`, undefined, { showLoading: true })
  },

  /**
   * 通过被拉黑用户ID移除黑名单
   */
  removeFromBlacklistByBlockedUserId(blockedUserId: string) {
    return http.delete(`/blacklist/blocked-user/${blockedUserId}`, undefined, { showLoading: true })
  },

  /**
   * 获取黑名单列表
   */
  getBlacklist(params: { page?: number; size?: number }) {
    return http.get<{
      list: BlacklistUser[]
      total: number
    }>('/blacklist', params)
  },

  /**
   * 检查用户是否在黑名单中
   */
  isInBlacklist(targetUserId: string) {
    return http.get<boolean>(`/blacklist/check/${targetUserId}`)
  },

  /**
   * 检查当前用户是否被对方拉黑
   */
  isBlockedBy(targetUserId: string) {
    return http.get<boolean>(`/blacklist/check-blocked-by/${targetUserId}`)
  }
}

export default blacklistApi
