/**
 * 位置相关 API
 */
import { http } from '@/utils/request'
import { normalizeId } from '@/utils/id'

export interface LocationItem {
  locationId: string
  name: string
  code: string
  description: string
  sortOrder: number
  status: number
}

export const locationApi = {
  /**
   * 获取位置列表
   */
  getLocationList() {
    return http.get<LocationItem[]>('/location', undefined, { showLoading: false })
  },

  /**
   * 获取位置详情
   */
  getLocationDetail(id: string) {
    return http.get<LocationItem>(`/location/${normalizeId(id)}`)
  },

  /**
   * 根据代码获取位置
   */
  getLocationByCode(code: string) {
    return http.get<LocationItem>(`/location/code/${code}`)
  }
}

export default locationApi
