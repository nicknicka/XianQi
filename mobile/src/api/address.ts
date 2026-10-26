/**
 * 用户地址 API
 */
import { http } from '@/utils/request'

export interface UserAddress {
  addressId: number
  contactName: string
  contactPhone: string
  province: string
  city: string
  district: string
  detailAddress: string
  fullAddress: string
  postalCode: string
  tag: string
  isDefault: boolean
  longitude: number
  latitude: number
}

export const addressApi = {
  /**
   * 获取地址列表
   */
  getAddressList(params?: { page?: number; pageSize?: number }) {
    return http.get<{
      list: UserAddress[]
      total: number
    }>('/user/address', params)
  },

  /**
   * 获取默认地址
   */
  getDefaultAddress() {
    return http.get<UserAddress>('/user/address/default')
  },

  /**
   * 获取地址详情
   */
  getAddressDetail(id: string) {
    return http.get<UserAddress>(`/user/address/${id}`)
  },

  /**
   * 创建地址
   */
  createAddress(data: {
    contactName: string
    contactPhone: string
    province: string
    city: string
    district: string
    detailAddress: string
    postalCode?: string
    tag?: string
    isDefault?: boolean
    longitude?: number
    latitude?: number
  }) {
    return http.post<UserAddress>('/user/address', data, { showLoading: true })
  },

  /**
   * 更新地址
   */
  updateAddress(id: string, data: {
    contactName: string
    contactPhone: string
    province: string
    city: string
    district: string
    detailAddress: string
    postalCode?: string
    tag?: string
    isDefault?: boolean
    longitude?: number
    latitude?: number
  }) {
    return http.put<UserAddress>(`/user/address/${id}`, data, { showLoading: true })
  },

  /**
   * 删除地址
   */
  deleteAddress(id: string) {
    return http.delete(`/user/address/${id}`, undefined, { showLoading: true })
  },

  /**
   * 设置默认地址
   */
  setDefaultAddress(id: string) {
    return http.put(`/user/address/${id}/default`, {}, { showLoading: true })
  }
}

export default addressApi
