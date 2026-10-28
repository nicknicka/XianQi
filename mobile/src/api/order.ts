/**
 * 订单相关 API
 */
import { http } from '@/utils/request'

interface Order {
  id: string
  orderId: string  // 订单ID，使用 string 避免 JavaScript 大整数精度丢失
  orderNo: string
  productId: string
  productName: string
  productImage: string
  price: number
  quantity: number
  totalAmount: number
  buyerId: string
  buyerName: string
  buyerAvatar: string
  sellerId: string
  sellerName: string
  sellerAvatar: string
  status: number
  address: string
  remark: string
  createdAt: string
  updatedAt: string
}

/**
 * 订单操作日志
 */
export interface OrderLog {
  logId: string         // 后端返回 logId
  id: string            // 前端使用的别名（等同于 logId）
  orderId: string
  userId: string
  username: string      // 后端返回 username
  userName: string      // 前端使用的别名（等同于 username）
  action: string
  actionText: string
  description: string
  createdAt: string
}

export const orderApi = {
  /**
   * 创建订单
   */
  createOrder(data: {
    productId: string
    quantity: number
    address: string
    phone: string
    remark?: string
  }) {
    return http.post<Order>('/order', data, { showLoading: true })
  },

  /**
   * 获取订单列表
   * @param params 查询参数
   * @param params.status 订单状态（可选）
   * @param params.role 角色：0-买家 1-卖家（默认0）
   * @param params.page 页码（默认1）
   * @param params.size 每页数量（默认10）
   */
  getOrderList(params: {
    status?: number
    role?: number  // 0-买家 1-卖家，默认0
    page?: number
    size?: number  // 后端使用 size 参数，不是 pageSize
  }) {
    console.log('[getOrderList] 调用参数:', params)
    // request.ts 会自动过滤 undefined/null 参数
    return http.get<{
      list: Order[]
      total: number
    }>('/order', params)
  },

  /**
   * 获取订单详情
   */
  getOrderDetail(id: string) {
    return http.get<Order>(`/order/${id}`)
  },

  /**
   * 确认订单（卖家）
   */
  confirmOrder(id: string) {
    return http.put(`/order/${id}/confirm`, undefined, { showLoading: true })
  },

  /**
   * 取消订单（买家）
   */
  cancelOrder(id: string, reason?: string) {
    return http.put(`/order/${id}/cancel`, { reason }, { showLoading: true })
  },

  /**
   * 完成订单（买家）
   */
  completeOrder(id: string) {
    return http.put(`/order/${id}/complete`, undefined, { showLoading: true })
  },

  /**
   * 申请退款（买家）
   */
  refundOrder(id: string) {
    return http.put(`/order/${id}/refund-request`, undefined, { showLoading: true })
  },

  /**
   * 同意退款（卖家）
   */
  approveRefund(id: string) {
    return http.put(`/order/${id}/refund-approve`, undefined, { showLoading: true })
  },

  /**
   * 拒绝退款（卖家）
   */
  rejectRefund(id: string) {
    return http.put(`/order/${id}/refund-reject`, undefined, { showLoading: true })
  },

  /**
   * 获取订单操作日志
   */
  getOrderLogs(id: string) {
    return http.get<OrderLog[]>(`/order/${id}/logs`)
  }
}

export default orderApi
