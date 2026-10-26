/**
 * 收藏相关 API
 */
import { http } from '@/utils/request'

export const favoriteApi = {
  /**
   * 添加收藏
   */
  addFavorite(productId: string) {
    return http.post(`/favorite/${productId}`)
  },

  /**
   * 取消收藏
   */
  cancelFavorite(productId: string) {
    return http.delete(`/favorite/${productId}`)
  },

  /**
   * 检查是否收藏
   */
  checkFavorite(productId: string) {
    return http.get<boolean>(`/favorite/check/${productId}`)
  },

  /**
   * 获取收藏列表
   */
  getFavoriteList(params: { page?: number; pageSize?: number }) {
    return http.get('/favorite', params)
  }
}

export default favoriteApi
