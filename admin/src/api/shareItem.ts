import request from '@/utils/request'
import type { PageParams } from './statistics'

// ==================== 类型定义 ====================

/**
 * 共享物品管理VO
 */
export interface ShareItemManageVO {
  shareId: string
  title: string
  description?: string
  categoryId?: string
  categoryName?: string
  deposit: string // 押金 - 使用string避免精度问题
  dailyRent: string // 日租金 - 使用string避免精度问题
  coverImageId?: string
  coverImageUrl?: string
  imageCount?: number
  status: number
  availableTimes?: string
  ownerId: string
  ownerNickname?: string
  ownerPhone?: string
  createTime: string
  updateTime: string
  borrowCount?: number
  currentBorrowCount?: number
}

/**
 * 共享物品查询参数
 */
export interface ShareItemManageQueryParams extends PageParams {
  title?: string
  ownerId?: string
  categoryId?: string
  status?: number
}

/**
 * 共享物品状态更新参数
 */
export interface ShareItemStatusUpdateParams {
  shareId: string
  status: number
  remark?: string
}

/**
 * 共享物品统计信息
 */
export interface ShareItemManageStatistics {
  totalItems: number
  availableItems: number
  borrowedItems: number
  offlineItems: number
  todayNewItems: number
  weekNewItems: number
  monthNewItems: number
  totalBorrows: number
  totalDepositAmount: string // 总押金金额 - 使用string避免精度问题
  totalRentIncome: string // 总租金收入 - 使用string避免精度问题
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
 * 分页查询共享物品列表
 */
export function getShareItemList(params: ShareItemManageQueryParams) {
  return request<PageResponse<ShareItemManageVO>>({
    url: '/share-item/list',
    method: 'get',
    params,
  })
}

/**
 * 获取共享物品详情
 */
export function getShareItemDetail(shareId: string) {
  return request<ShareItemManageVO>({
    url: `/share-item/${shareId}`,
    method: 'get',
  })
}

/**
 * 更新共享物品状态
 */
export function updateShareItemStatus(data: ShareItemStatusUpdateParams) {
  return request<boolean>({
    url: '/share-item/status',
    method: 'put',
    data,
  })
}

/**
 * 获取共享物品统计信息
 */
export function getShareItemStatistics() {
  return request<ShareItemManageStatistics>({
    url: '/share-item/statistics',
    method: 'get',
  })
}
