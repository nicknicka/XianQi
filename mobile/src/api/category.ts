/**
 * 分类 API
 */
import { http } from '@/utils/request'
import type { IdLike } from '@/utils/id'
import { normalizeId } from '@/utils/id'

export interface Category {
  categoryId: string | number
  id?: string | number
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
  getCategoryDetail(id: IdLike) {
    return http.get<Category>(`/category/${normalizeId(id)}`)
  }
}

export default categoryApi
