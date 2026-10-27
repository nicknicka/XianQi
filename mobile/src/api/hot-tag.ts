/**
 * 热门搜索标签 API
 */
import { http } from '@/utils/request'

export interface HotTag {
  id: string
  keyword: string
  searchCount: number
  sortOrder: number
}

export const hotTagApi = {
  /**
   * 获取热门搜索标签列表
   */
  getHotTags(params?: { limit?: number }) {
    return http.get<HotTag[]>('/public/hot-tags', params)
  }
}

export default hotTagApi
