/**
 * 信用分相关 API
 */
import { http } from '@/utils/request'
import type { CreditDetail, CreditRules } from '@/types/credit'

export const creditApi = {
  /**
   * 获取用户信用分详情
   */
  getCreditDetail(userId: string) {
    return http.get<CreditDetail>(`/credit/detail/${userId}`)
  },

  /**
   * 获取当前用户的信用分详情
   */
  getMyCreditDetail() {
    return http.get<CreditDetail>('/credit/my')
  },

  /**
   * 获取信用分规则说明
   */
  getCreditRules() {
    return http.get<CreditRules>('/credit/rules')
  }
}

export default creditApi
