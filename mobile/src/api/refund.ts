/**
 * 退款相关 API
 */
import { http } from '@/utils/request'

interface RefundItem {
  refundId: string
  refundNo: string
  orderId: string
  orderNo: string
  productId: string
  productName: string
  productSpec: string
  productImage: string
  buyerId: string
  buyerNickname: string
  sellerId: string
  sellerNickname: string
  refundAmount: number
  refundReason: string
  refundType: number
  refundTypeDesc: string
  status: number
  statusDesc: string
  rejectReason: string
  logisticsCompany: string
  logisticsNo: string
  logisticsTime: string
  evidenceImages: string[]
  remark: string
  createdAt: string
  updatedAt: string
  finishTime: string
}

interface RefundListResponse {
  list: RefundItem[]
  total: number
  current: number
  size: number
  pages: number
}

export const refundApi = {
  /**
   * 创建退款申请
   */
  createRefund(data: {
    orderId: string
    refundAmount: number
    refundReason: string
    refundType: number  // 1-仅退款 2-退货退款
    evidenceImages?: string[]
    remark?: string
  }) {
    return http.post<RefundItem>('/refund', data, { showLoading: true })
  },

  /**
   * 获取退款详情
   */
  getRefundDetail(refundId: string) {
    return http.get<RefundItem>(`/refund/${refundId}`)
  },

  /**
   * 分页查询买家的退款列表
   * @param params 查询参数
   * @param params.status 状态：0-待审核 1-已同意 2-已拒绝 3-退货中 4-已完成 5-已取消（可选）
   * @param params.page 页码（默认1）
   * @param params.size 每页数量（默认10）
   */
  getBuyerRefundList(params?: {
    status?: number
    page?: number
    size?: number
  }) {
    return http.get<RefundListResponse>('/refund/buyer', params)
  },

  /**
   * 分页查询卖家的退款列表
   * @param params 查询参数
   * @param params.status 状态：0-待审核 1-已同意 2-已拒绝 3-退货中 4-已完成 5-已取消（可选）
   * @param params.page 页码（默认1）
   * @param params.size 每页数量（默认10）
   */
  getSellerRefundList(params?: {
    status?: number
    page?: number
    size?: number
  }) {
    return http.get<RefundListResponse>('/refund/seller', params)
  },

  /**
   * 取消退款申请
   */
  cancelRefund(refundId: string) {
    return http.put<void>(`/refund/${refundId}/cancel`, {}, { showLoading: true })
  },

  /**
   * 同意退款申请（卖家）
   */
  approveRefund(refundId: string) {
    return http.put<void>(`/refund/${refundId}/approve`, {}, { showLoading: true })
  },

  /**
   * 拒绝退款申请（卖家）
   */
  rejectRefund(refundId: string, rejectReason?: string) {
    return http.put<void>(`/refund/${refundId}/reject`, { rejectReason }, { showLoading: true })
  },

  /**
   * 填写退货物流（买家）
   */
  fillLogistics(refundId: string, data: {
    logisticsCompany: string
    logisticsNo: string
  }) {
    return http.put<void>(`/refund/${refundId}/logistics`, data, { showLoading: true })
  },

  /**
   * 确认收货并完成退款（卖家）
   */
  confirmReturn(refundId: string) {
    return http.put<void>(`/refund/${refundId}/confirm-return`, {}, { showLoading: true })
  }
}

export default refundApi
