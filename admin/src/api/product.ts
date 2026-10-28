import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

/**
 * 商品审核查询条件
 */
export interface ProductAuditQueryParams extends PageParams {
  keyword?: string // 商品标题
  sellerId?: string // 卖家ID
  categoryId?: string // 分类ID
  auditStatus?: number // 审核状态：0-待审核，1-审核通过，2-审核拒绝
  startTime?: string
  endTime?: string
}

/**
 * 商品审核VO
 */
export interface ProductAuditVO {
  productId: string
  title: string
  description?: string
  price: string // 使用string避免JavaScript精度问题
  originalPrice?: string // 原价
  condition?: number // 成色：1-全新，2-九成新，3-八成新，4-七成新，5-六成新及以下
  coverImage?: string
  images?: string[] // 商品图片列表
  imageCount?: number
  viewCount?: number
  favoriteCount?: number
  categoryId?: string
  categoryName?: string
  sellerId?: string
  sellerNickname?: string
  sellerPhone?: string
  location?: string // 位置
  status: number // 商品状态：0-下架，1-在售，2-已售
  auditStatus: number // 审核状态：0-待审核，1-已通过，2-已拒绝
  auditRemark?: string // 审核备注
  createdAt: string
  auditTime?: string
  auditorId?: string
}

/**
 * 商品审核参数
 */
export interface ProductAuditParams {
  productId: string
  auditStatus: number // 1-审核通过，2-审核拒绝
  auditRemark?: string // 审核备注（拒绝原因）
}

/**
 * 商品审核统计
 */
export interface ProductAuditStatistics {
  totalCount: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  todayAuditCount: number
}

/**
 * 分页查询商品审核列表
 */
export function getProductAuditList(params: ProductAuditQueryParams) {
  return request<PageResponse<ProductAuditVO>>({
    url: '/product-audit/list',
    method: 'get',
    params,
  })
}

/**
 * 分页查询待审核商品列表
 */
export function getPendingProductList(params: PageParams) {
  return request<PageResponse<ProductAuditVO>>({
    url: '/product-audit/pending',
    method: 'get',
    params,
  })
}

/**
 * 获取商品审核详情
 */
export function getProductAuditDetail(productId: string) {
  return request<ProductAuditVO>({
    url: `/product-audit/${productId}`,
    method: 'get',
  })
}

/**
 * 审核商品（通过/拒绝）
 */
export function auditProduct(data: ProductAuditParams) {
  return request<boolean>({
    url: '/product-audit/audit',
    method: 'post',
    data,
  })
}

/**
 * 获取商品审核统计信息
 */
export function getProductAuditStatistics() {
  return request<ProductAuditStatistics>({
    url: '/product-audit/statistics',
    method: 'get',
  })
}

/**
 * 获取所有商品审核列表
 */
export function getAllProductAuditList() {
  return request<PageResponse<ProductAuditVO>>({
    url: '/product-audit/list',
    method: 'get',
    params: {
      page: 1,
      size: 1000,
    },
  }).then((res: any) => res?.records || res?.data?.records || [])
}
