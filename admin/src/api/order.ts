import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

/**
 * 订单查询条件
 */
export interface OrderManageQueryParams extends PageParams {
  orderNo?: string // 订单号
  productTitle?: string // 商品标题
  buyerId?: string // 买家ID
  sellerId?: string // 卖家ID
  status?: number // 订单状态
}

/**
 * 订单管理VO
 */
export interface OrderManageVO {
  orderId: string
  orderNo: string
  buyerId?: string
  buyerNickname?: string
  buyerPhone?: string
  sellerId?: string
  sellerNickname?: string
  sellerPhone?: string
  productId?: string
  productTitle?: string
  productImage?: string
  productPrice: string // 商品价格 - 使用string避免精度问题
  totalAmount: string // 总金额 - 使用string避免精度问题
  status: number // 订单状态码
  statusDesc?: string // 订单状态描述
  refundStatus?: number // 退款状态码：0-无退款，1-退款中，2-退款成功，3-退款拒绝
  refundStatusDesc?: string // 退款状态描述
  remark?: string
  createTime: string
  updateTime?: string
  finishTime?: string
}

/**
 * 退款处理参数
 */
export interface OrderRefundProcessParams {
  orderId: string
  action: 'approve' | 'reject' // 同意或拒绝退款
  reason?: string
}

/**
 * 订单统计信息
 */
export interface OrderManageStatistics {
  totalCount: number
  pendingCount: number
  processingCount: number
  completedCount: number
  cancelledCount: number
  refundedCount: number
  totalAmount: string // 总金额 - 使用string避免精度问题
  todayCount: number
  todayAmount: string // 今日金额 - 使用string避免精度问题
}

/**
 * 分页查询订单列表
 */
export function getOrderList(params: OrderManageQueryParams) {
  return request<PageResponse<OrderManageVO>>({
    url: '/order/list',
    method: 'get',
    params,
  })
}

/**
 * 获取订单详情
 */
export function getOrderDetail(orderId: string) {
  return request<OrderManageVO>({
    url: `/order/${orderId}`,
    method: 'get',
  })
}

/**
 * 处理退款申请（管理员介入）
 */
export function processRefund(data: OrderRefundProcessParams) {
  return request<boolean>({
    url: '/order/refund/process',
    method: 'post',
    data,
  })
}

/**
 * 获取订单统计信息
 */
export function getOrderStatistics() {
  return request<OrderManageStatistics>({
    url: '/order/statistics',
    method: 'get',
  })
}
