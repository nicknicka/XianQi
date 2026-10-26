/**
 * 系统配置和公告 API
 */
import { http } from '@/utils/request'

export interface SystemNotice {
  id?: string | number
  noticeId?: string | number
  notificationId?: string | number
  title: string
  content: string
  type: number
  linkType?: number
  linkUrl?: string
  linkProductId?: string | number
  linkOrderId?: string | number
  publishTime: string
  priority: number
}

export interface SystemConfig {
  [key: string]: any
}

export const systemApi = {
  /**
   * 获取首页公告
   */
  getHomeNotice() {
    return http.get<{
      notice?: SystemNotice | null
      notices?: SystemNotice[]
    }>('/public/home-notice')
  },

  /**
   * 获取公开的系统配置
   */
  getPublicConfig() {
    return http.get<SystemConfig>('/public/config')
  }
}

export default systemApi
