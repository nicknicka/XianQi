/**
 * 活动/限时秒杀相关 API
 */
import { http } from '@/utils/request'
import type { Product } from '@/types'

// 秒杀场次信息
export interface FlashSaleSession {
  sessionId: number
  time: string // 格式: "HH:mm"
  progress?: number // 当前进度百分比
  startTime: string
  endTime: string
  // status 由前端根据时间计算，不在接口中返回
}

// 秒杀商品信息
export interface FlashSaleProduct {
  id: string
  title: string
  description: string
  image: string
  coverImage: string
  images: string[]
  seckillPrice: number // 秒杀价格
  originalPrice: number // 原价
  price: number
  discount: number // 折扣（如80表示8折）
  soldPercent: number // 已抢百分比
  stock: number // 库存
  soldCount: number // 已售数量
  // 场次关联
  sessionId: number // 所属场次ID
  // 商品基础信息
  categoryId: number
  categoryName: string
  condition: string
  location: string
  userId: string
  userName: string
  userAvatar: string
  creditLevel: string
  viewCount: number
  favoriteCount: number
  // 注意：场次的时间、状态等信息通过 sessionId 从 sessions 数组中获取
}

// 秒杀活动信息
export interface FlashSaleActivity {
  activityId: number
  title: string
  subtitle: string
  startTime: string
  endTime: string
  sessions: FlashSaleSession[]
}

export const activityApi = {
  /**
   * 获取当前秒杀活动信息
   */
  getCurrentActivity() {
    return http.get<FlashSaleSession[]>('/flash-sale/sessions').then((res: any) => {
      const sessions = res.data || []
      const now = Date.now()
      const currentSession = sessions.find((item: any) => {
        const start = new Date(item.startTime).getTime()
        const end = new Date(item.endTime).getTime()
        return start <= now && now <= end
      }) || sessions[0]

      return {
        ...res,
        data: {
          activityId: currentSession?.sessionId || 0,
          title: '限时秒杀',
          subtitle: '当前秒杀场次',
          startTime: currentSession?.startTime || '',
          endTime: currentSession?.endTime || '',
          sessions
        }
      }
    })
  },

  /**
   * 获取秒杀场次列表
   */
  getFlashSaleSessions() {
    return http.get<FlashSaleSession[]>('/flash-sale/sessions')
  },

  /**
   * 获取指定场次的秒杀商品
   */
  getFlashSaleProducts(sessionId: number, params: {
    page?: number
    pageSize?: number
  }) {
    return http.get<FlashSaleProduct[]>(`/flash-sale/sessions/${sessionId}/products`, params)
  },

  /**
   * 获取当前正在进行的秒杀商品（首页用）
   */
  getCurrentFlashSaleProducts(params: { limit?: number }) {
    return http.get<FlashSaleProduct[]>('/flash-sale/current/products', params)
  },

  /**
   * 秒杀抢购
   */
  seckillBuy(productId: string, data: {
    quantity?: number
    addressId?: string
    remark?: string
  }) {
    return http.post(`/flash-sale/${productId}/buy`, data, { showLoading: true })
  },

  /**
   * 获取秒杀商品详情
   */
  getFlashSaleDetail(productId: string) {
    return http.get<FlashSaleProduct>(`/flash-sale/product/${productId}/detail`)
  },

  /**
   * 检查是否可以参与秒杀（验证用户资格、库存等）
   */
  checkSeckillEligibility(productId: string) {
    return http.get<{
      canBuy: boolean
      reason?: string
      remainingStock: number
      userBuyLimit?: number
      userBoughtCount?: number
    }>(`/flash-sale/${productId}/check`)
  }
}

export default activityApi
