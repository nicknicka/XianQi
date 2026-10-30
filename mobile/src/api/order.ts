/**
 * 订单相关 API
 */
import { http } from '@/utils/request'

/**
 * 订单信息。
 *
 * 字段名与后端 OrderVO 保持一致（见 ADR-0012：对外字段以后端视图对象为准）。
 * 展示所需的派生字段（price / buyerName / sellerName 等）由 normalizeOrder 统一补齐，
 * 页面不再自行兜底。
 */
interface Order {
  orderId: string  // 订单ID，使用 string 避免 JavaScript 大整数精度丢失
  orderNo: string
  productId: string
  productTitle: string
  productImage: string
  unitPrice: string
  totalPrice: string
  quantity: number
  buyerId: string
  buyerNickname: string
  buyerAvatar: string
  sellerId: string
  sellerNickname: string
  sellerAvatar: string
  status: number
  statusDesc?: string
  address: string
  contactPhone?: string
  contactName?: string
  remark: string
  createdAt: string
  updatedAt: string
  // ---- 派生展示字段（由 normalizeOrder 补，页面直接读）----
  price: number          // 展示用金额口径（取总价）
  productName: string     // 兼容展示名（等同 productTitle）
  buyerName: string       // 兼容展示名（等同 buyerNickname）
  sellerName: string      // 兼容展示名（等同 sellerNickname）
  // ---- 页面上下文字段（依赖当前登录用户，由页面自行补充）----
  isBuyer?: boolean
  isSeller?: boolean
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

/**
 * 归一化订单字段：把后端字段名映射成页面展示所需形状。
 * 页面不再各自兜底（原先散落在 list.vue / detail.vue）。
 */
function normalizeOrder(data: any): Order {
  // 展示口径为订单总价：unitPrice 是查询商品得到的当前价（非下单快照），
  // 商品改价后历史订单会显示错误金额；totalPrice 落库自订单金额，才是成交价。
  const totalPrice = Number(data?.totalPrice ?? 0)
  const unitPrice = Number(data?.unitPrice ?? 0)
  return {
    ...data,
    price: totalPrice || unitPrice,
    productName: data?.productTitle || data?.productName || '未知商品',
    buyerName: data?.buyerNickname || data?.buyerName || '',
    sellerName: data?.sellerNickname || data?.sellerName || ''
  }
}

function normalizeOrderPage(res: any) {
  const page = res?.data
  if (!page || typeof page !== 'object') return res
  return {
    ...res,
    data: {
      ...page,
      list: (page.list || page.records || []).map(normalizeOrder)
    }
  }
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
    return http.post<Order>('/order', data, { showLoading: true }).then(normalizeOrder)
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
    }>('/order', params).then(normalizeOrderPage)
  },

  /**
   * 获取订单详情
   */
  getOrderDetail(id: string) {
    return http.get<Order>(`/order/${id}`).then(res => ({
      ...res,
      data: normalizeOrder(res.data)
    }))
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
