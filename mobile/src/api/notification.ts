/**
 * 系统通知相关 API
 */
import { http } from '@/utils/request'

export enum NotificationType {
  SYSTEM = 1, // 系统公告
  ACTIVITY = 2, // 活动通知
  ACCOUNT = 3, // 账户提醒
  TRADE = 4 // 交易提醒
}

export interface NotificationItem {
  notificationId: string
  title: string
  content: string
  type: NotificationType
  typeDesc: string
  isRead: boolean
  linkType?: number
  linkUrl?: string
  linkProductId?: string
  linkOrderId?: string
  publishTime: string
  priority: number
}

export interface NotificationListResponse {
  list: NotificationItem[]
  total: number
  size: number
  current: number
  pages: number
}

export const notificationApi = {
  /**
   * 获取通知列表
   */
  getNotificationList(params?: { page?: number; size?: number; type?: NotificationType }) {
    return http.get<NotificationListResponse>('/notification', params, { showLoading: false })
  },

  /**
   * 获取通知详情（会自动标记为已读）
   */
  getNotificationDetail(notificationId: string) {
    return http.get<NotificationItem>(`/notification/${notificationId}`)
  },

  /**
   * 标记单个通知为已读
   */
  markAsRead(notificationId: string) {
    return http.put<void>(`/notification/${notificationId}/read`)
  },

  /**
   * 获取未读通知数量
   */
  getUnreadCount() {
    return http.get<number>('/notification/unread-count', undefined, { showLoading: false })
  },

  /**
   * 标记所有通知为已读
   */
  markAllAsRead() {
    return http.put<void>('/notification/read-all')
  },

  /**
   * 清空所有通知
   */
  clearAll() {
    return http.delete<void>('/notification/clear-all')
  }
}

export default notificationApi
