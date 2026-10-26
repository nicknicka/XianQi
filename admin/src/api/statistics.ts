import request from '@/utils/request'

/**
 * 分页查询参数
 */
export interface PageParams {
  pageNum: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 分页响应数据
 */
export interface PageResponse<T> {
  records: T[]
  total: number
  current: number
  size: number
}

// ==================== 数据统计 ====================

/**
 * 总览统计数据
 */
export interface OverviewStatistics {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalAmount: number
  todayNewUsers: number
  todayNewProducts: number
  todayNewOrders: number
  todayAmount: number
  monthAmount: number
  activeUsers: number
  onSaleProducts: number
  pendingOrders: number
  completedOrders: number
  pendingProducts: number
  pendingVerifications: number
  systemNotifications: number
  userFeedbacks: number
  pendingReports: number
}

/**
 * 用户统计数据
 */
export interface UserStatisticsData {
  totalUsers: number
  todayNewUsers: number
  weekNewUsers: number
  monthNewUsers: number
  activeUsers: number
  verifiedUsers: number
  bannedUsers: number
  registerTrend?: Array<{
    date: string
    count: number
  }>
}

/**
 * 商品统计数据
 */
export interface ProductStatisticsData {
  totalProducts: number
  onSaleProducts: number
  soldProducts: number
  offlineProducts: number
  todayNewProducts: number
  weekNewProducts: number
  monthNewProducts: number
  pendingProducts: number
  approvedProducts: number
  rejectedProducts: number
  publishTrend?: Array<{
    date: string
    count: number
  }>
}

/**
 * 订单统计数据
 */
export interface OrderStatisticsData {
  totalOrders: number
  pendingOrders: number
  inProgressOrders: number
  completedOrders: number
  cancelledOrders: number
  refundingOrders: number
  todayNewOrders: number
  weekNewOrders: number
  monthNewOrders: number
  totalAmount: number
  todayAmount: number
  weekAmount: number
  monthAmount: number
  orderTrend?: Array<{
    date: string
    count: number
  }>
  amountTrend?: Array<{
    date: string
    amount: number
  }>
}

/**
 * 获取总览统计数据
 */
export function getOverview() {
  return request<OverviewStatistics>({
    url: '/statistics/overview',
    method: 'get',
  })
}

/**
 * 获取用户统计数据
 */
export function getUserStatistics() {
  return request<UserStatisticsData>({
    url: '/statistics/users',
    method: 'get',
  })
}

/**
 * 获取商品统计数据
 */
export function getProductStatistics() {
  return request<ProductStatisticsData>({
    url: '/statistics/products',
    method: 'get',
  })
}

/**
 * 获取订单统计数据
 */
export function getOrderStatistics() {
  return request<OrderStatisticsData>({
    url: '/statistics/orders',
    method: 'get',
  })
}
