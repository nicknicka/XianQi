/**
 * 评价相关 API
 */
import { http } from '@/utils/request'

function normalizePageParams(params?: { page?: number; pageSize?: number; size?: number }) {
  if (!params) return params

  const { pageSize, size, ...rest } = params

  return {
    ...rest,
    ...(size !== undefined ? { size } : {}),
    ...(size === undefined && pageSize !== undefined ? { size: pageSize } : {})
  }
}

export const evaluationApi = {
  /**
   * 创建评价
   */
  createEvaluation(data: {
    orderId: string
    productId: string
    rating: number
    tags?: string[] | string
    content?: string
    images?: string[]
  }) {
    return http.post('/evaluation', data, { showLoading: true })
  },

  /**
   * 追加评价
   */
  appendEvaluation(evalId: string, data: {
    content?: string
    images?: string[]
  }) {
    return http.post(`/evaluation/${evalId}/append`, data, { showLoading: true })
  },

  /**
   * 获取订单的评价
   */
  getEvaluationByOrder(orderId: string) {
    return http.get(`/evaluation/order/${orderId}`)
  },

  /**
   * 获取用户的评价列表
   */
  getEvaluationsByUser(userId: string, params: { page?: number; pageSize?: number; size?: number }) {
    return http.get<{
      list: any[]
      total: number
    }>(`/evaluation/user/${userId}`, normalizePageParams(params))
  },

  /**
   * 获取用户发出的评价列表
   */
  getSentEvaluationsByUser(userId: string, params: { page?: number; pageSize?: number; size?: number }) {
    return http.get<{
      list: any[]
      total: number
    }>(`/evaluation/user/${userId}/sent`, normalizePageParams(params))
  },

  /**
   * 获取用户的平均评分
   */
  getUserAverageRating(userId: string) {
    return http.get<number>(`/evaluation/user/${userId}/average-rating`)
  },

  /**
   * 获取商品的评价列表
   */
  getProductEvaluations(productId: string, params: { page?: number; pageSize?: number; size?: number }) {
    return http.get<{
      list: any[]
      total: number
      averageRating: number
      totalCount: number
    }>(`/evaluation/product/${productId}`, normalizePageParams(params))
  }
}

export default evaluationApi
