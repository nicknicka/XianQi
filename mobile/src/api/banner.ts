/**
 * 轮播图相关 API
 */
import { http } from '@/utils/request'

export interface Banner {
  bannerId: string
  title: string
  imageUrl: string
  linkType: number // 1-无，2-网页，3-商品详情，4-订单详情
  linkUrl?: string
  linkProductId?: string
  linkOrderId?: string
  sortOrder: number
  clickCount: number
  status: number
}

export const bannerApi = {
  /**
   * 获取启用的轮播图列表
   */
  getActiveBanners() {
    return http.get<Banner[]>('/banner')
  },

  /**
   * 增加轮播图点击次数
   */
  incrementClickCount(bannerId: string) {
    return http.post(`/banner/${bannerId}/click`)
  }
}

export default bannerApi
