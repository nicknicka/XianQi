/**
 * 优惠券 API
 */
import { http } from '@/utils/request'

export interface Coupon {
  couponId: string
  name: string
  description: string
  type: number
  typeDesc: string
  minAmount: number
  discountValue: number
  maxDiscount: number
  discountPercent: string
  totalCount: number
  receivedCount: number
  usedCount: number
  remainingCount: number
  limitPerUser: number
  userReceivedCount: number
  canReceive: boolean
  cannotReceiveReason: string
  imageUrl: string
  validFrom: string
  validTo: string
  status: number
  statusDesc: string
}

export interface UserCoupon {
  userCouponId: string
  couponId: string
  name: string
  description: string
  type: number
  typeDesc: string
  minAmount: number
  discountValue: number
  maxDiscount: number
  discountPercent: string
  imageUrl: string
  status: number
  statusDesc: string
  usedTime: string
  validFrom: string
  expireTime: string
  expiringSoon: boolean
}

export const couponApi = {
  /**
   * 获取可领取的优惠券列表
   */
  getAvailableCoupons(params?: { page?: number; pageSize?: number }) {
    return http.get<{
      list: Coupon[]
      total: number
    }>('/coupon/available', params)
  },

  /**
   * 领取优惠券
   */
  receiveCoupon(couponId: string) {
    return http.post(`/coupon/${couponId}/receive`, {}, { showLoading: true })
  },

  /**
   * 获取我的优惠券列表
   */
  getMyCoupons(params?: { status?: number; page?: number; pageSize?: number }) {
    return http.get<{
      list: UserCoupon[]
      total: number
    }>('/coupon/my', params)
  },

  /**
   * 获取优惠券详情
   */
  getCouponDetail(couponId: string) {
    return http.get<Coupon>(`/coupon/${couponId}`)
  }
}

export default couponApi
