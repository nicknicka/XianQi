/**
 * 分类 API
 */
import { http } from '@/utils/request'
import { normalizeId } from '@/utils/id'

export interface Category {
  categoryId: string
  id?: string
  name: string
  code: string
  icon: string
  gradient: string
  sortOrder: number
}

export const categoryApi = {
  /**
   * 获取分类列表
   */
  getCategoryList() {
    return http.get<Category[]>('/category')
  },

  /**
   * 获取分类详情
   */
  getCategoryDetail(id: string) {
    return http.get<Category>(`/category/${normalizeId(id)}`)
  }
}

export default categoryApi
