import request from '@/utils/request'
import type { PageParams } from './statistics'

// ==================== 类型定义 ====================

/**
 * 轮播图管理VO
 */
export interface BannerManageVO {
  bannerId: string
  title: string
  imageUrl: string
  imageThumbnailUrl?: string
  linkType: number
  linkUrl?: string
  linkProductId?: string
  linkProductTitle?: string
  linkPagePath?: string
  sortOrder: number
  status: number
  startTime?: string
  endTime?: string
  clickCount?: number
  exposureCount?: number
  createTime: string
  updateTime: string
}

/**
 * 轮播图查询参数
 */
export interface BannerManageQueryParams extends PageParams {
  title?: string
  linkType?: number
  status?: number
}

/**
 * 创建轮播图参数
 */
export interface BannerCreateParams {
  title: string
  imageUrl: string
  imageThumbnailUrl?: string
  linkType: number
  linkUrl?: string
  linkProductId?: string
  linkPagePath?: string
  sortOrder?: number
  status: number
  startTime?: string
  endTime?: string
}

/**
 * 更新轮播图参数
 */
export interface BannerUpdateParams {
  bannerId: string
  title?: string
  imageUrl?: string
  imageThumbnailUrl?: string
  linkType?: number
  linkUrl?: string
  linkProductId?: string
  linkPagePath?: string
  sortOrder?: number
  status?: number
  startTime?: string
  endTime?: string
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// ==================== API 接口 ====================

/**
 * 分页查询轮播图列表
 */
export function getBannerList(params: BannerManageQueryParams) {
  return request<PageResponse<BannerManageVO>>({
    url: '/banner/list',
    method: 'get',
    params,
  })
}

/**
 * 获取轮播图详情
 */
export function getBannerDetail(bannerId: string) {
  return request<BannerManageVO>({
    url: `/banner/${bannerId}`,
    method: 'get',
  })
}

/**
 * 创建轮播图
 */
export function createBanner(data: BannerCreateParams) {
  return request<boolean>({
    url: '/banner',
    method: 'post',
    data,
  })
}

/**
 * 更新轮播图
 */
export function updateBanner(data: BannerUpdateParams) {
  return request<boolean>({
    url: '/banner',
    method: 'put',
    data,
  })
}

/**
 * 删除轮播图
 */
export function deleteBanner(bannerId: string) {
  return request<boolean>({
    url: `/banner/${bannerId}`,
    method: 'delete',
  })
}

/**
 * 启用/禁用轮播图
 */
export function updateBannerStatus(bannerId: string, status: number) {
  return request<boolean>({
    url: `/banner/${bannerId}/status`,
    method: 'put',
    params: { status },
  })
}
