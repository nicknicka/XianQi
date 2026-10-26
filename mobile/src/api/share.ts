/**
 * 共享物品相关 API
 */
import { http } from '@/utils/request'
import { normalizeImageUrl } from '@/utils/image'

// ===== 草稿相关类型定义 =====

/** 共享物品草稿保存请求 */
export interface ShareItemDraftDto {
  draftId?: string                    // 更新时传入
  title?: string                      // 物品标题
  description?: string                // 描述
  categoryId?: number                 // 分类ID
  deposit?: number                    // 押金
  dailyRent?: number                  // 日租金
  condition?: string                  // 成色字符串
  conditionLevel?: number             // 成色等级
  imageUrls?: string[]                // 图片URL列表
  availableTimes?: string             // 可借用时间段（JSON格式）
}

/** 共享物品草稿响应 */
export interface ShareItemDraftVo {
  draftId: string
  shareId: string
  title: string
  description: string
  categoryId: number
  categoryName: string
  deposit: number
  dailyRent: number
  condition?: string
  conditionLevel?: number
  conditionDesc?: string
  coverImage: string
  images: string[]
  imageCount: number
  availableTimes: string
  createTime: string
  updateTime: string
  completion: number                  // 完成度 0-100
  missingFields: string[]             // 缺少的必填字段
}

export interface ShareItem {
  id: string
  title: string
  description: string
  images: string[]
  coverImage: string
  dailyRent: number
  deposit: number
  categoryId?: string
  categoryName?: string
  condition?: string
  conditionLevel?: number
  conditionDesc?: string
  availableTime: string
  status: number
  userId: string
  userName: string
  userAvatar: string
  distance?: number
}

interface ShareItemListParams {
  status?: number
  page?: number
  size?: number
  categoryId?: number | string
  keyword?: string
}

function normalizeShareItem(data: any): ShareItem {
  return {
    id: String(data?.shareId || data?.id || ''),
    title: data?.title || '',
    description: data?.description || '',
    images: data?.imageUrls || data?.images || [],
    coverImage: data?.coverImageUrl || data?.coverImage || data?.imageUrls?.[0] || '',
    dailyRent: Number(data?.dailyRent || 0),
    deposit: Number(data?.deposit || 0),
    categoryId: data?.categoryId ? String(data.categoryId) : undefined,
    categoryName: data?.categoryName || '',
    condition: data?.condition || '',
    conditionLevel: data?.conditionLevel != null ? Number(data.conditionLevel) : undefined,
    conditionDesc: data?.conditionDesc || '',
    availableTime: data?.availableTimes || data?.availableTime || '',
    status: Number(data?.status ?? 0),
    userId: String(data?.ownerId || data?.userId || ''),
    userName: data?.ownerNickname || data?.userName || '',
    userAvatar: data?.ownerAvatar || data?.userAvatar || '',
    distance: data?.distance
  }
}

function normalizeSharePage(res: any) {
  return {
    ...res,
    data: {
      ...res.data,
      list: (res.data?.list || []).map(normalizeShareItem)
    }
  }
}

function getPageList(data: any): any[] {
  return data?.list || data?.records || []
}

function normalizeImageEntry(image: unknown): string {
  if (typeof image !== 'string') return ''
  return normalizeImageUrl(image)
}

function parseImageList(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.map(normalizeImageEntry).filter(Boolean)
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeImageEntry).filter(Boolean)
      }
    } catch {
      const normalized = normalizeImageEntry(images)
      return normalized ? [normalized] : []
    }
  }

  return []
}

function getBookingCoverImage(data: any): string {
  const imageUrls = parseImageList(data?.imageUrls)
  if (imageUrls.length > 0) return imageUrls[0]

  const images = parseImageList(data?.images)
  if (images.length > 0) return images[0]

  const shareImages = parseImageList(data?.shareItemImages)
  if (shareImages.length > 0) return shareImages[0]

  const shareItemCover = normalizeImageEntry(
    data?.shareItemCover ||
    data?.shareItemImage ||
    data?.coverImageUrl ||
    data?.coverImage ||
    data?.image ||
    ''
  )

  return shareItemCover || ''
}

function normalizeBooking(data: any) {
  return {
    ...data,
    id: String(data?.bookingId || data?.id || ''),
    bookingId: String(data?.bookingId || data?.id || ''),
    shareId: String(data?.shareId || data?.shareItemId || ''),
    shareItemId: String(data?.shareId || data?.shareItemId || ''),
    shareItemTitle: data?.shareItemTitle || data?.title || '',
    shareItemCover: getBookingCoverImage(data),
    startDate: data?.startDate || data?.startTime || '',
    endDate: data?.endDate || data?.endTime || '',
    totalRent: Number(data?.totalRent ?? 0),
    deposit: Number(data?.deposit ?? 0),
    totalAmount: Number(data?.totalAmount ?? 0),
    status: Number(data?.status ?? 0),
    paymentStatus: Number(data?.paymentStatus ?? 0),
    depositReturned: Number(data?.depositReturned ?? 0),
    payTime: data?.payTime || '',
    ownerAvatar: data?.ownerAvatar || data?.ownerInfo?.avatar || data?.owner?.avatar || '',
    borrowerAvatar: data?.borrowerAvatar || data?.borrowerInfo?.avatar || data?.borrower?.avatar || '',
    ownerNickname: data?.ownerNickname || data?.ownerInfo?.nickname || data?.owner?.nickname || '',
    borrowerNickname: data?.borrowerNickname || data?.borrowerInfo?.nickname || data?.borrower?.nickname || ''
  }
}

function normalizeBookingPage(res: any) {
  return {
    ...res,
    data: {
      ...res.data,
      list: getPageList(res.data).map(normalizeBooking)
    }
  }
}

function normalizeDepositRecord(data: any) {
  return {
    ...data,
    id: String(data?.recordId || data?.id || data?.bookingId || ''),
    recordId: String(data?.recordId || data?.id || ''),
    bookingId: String(data?.bookingId || ''),
    shareId: String(data?.shareId || data?.shareItemId || ''),
    shareItemId: String(data?.shareId || data?.shareItemId || ''),
    shareItemTitle: data?.shareItemTitle || data?.title || '',
    shareItemCover: getBookingCoverImage(data),
    depositAmount: Number(data?.depositAmount ?? data?.amount ?? data?.deposit ?? 0),
    status: Number(data?.status ?? 0)
  }
}

function normalizeDepositPage(res: any) {
  return {
    ...res,
    data: {
      ...res.data,
      list: getPageList(res.data).map(normalizeDepositRecord)
    }
  }
}

function normalizeTransferRecord(data: any) {
  const status = Number(data?.status ?? data?.acceptStatus ?? 0)
  return {
    ...data,
    id: String(data?.transferId || data?.id || ''),
    transferId: String(data?.transferId || data?.id || ''),
    shareId: String(data?.shareId || data?.shareItemId || ''),
    shareItemId: String(data?.shareId || data?.shareItemId || ''),
    shareItemTitle: data?.shareItemTitle || data?.title || '',
    shareItemCover: getBookingCoverImage(data),
    status,
    acceptStatus: status,
    message: data?.message || data?.transferNote || '',
    senderId: String(data?.senderId || data?.fromUserId || ''),
    receiverId: String(data?.receiverId || data?.toUserId || ''),
    senderInfo: data?.senderInfo || {
      nickname: data?.fromUserNickname || '',
      avatar: data?.fromUserAvatar || '',
      creditScore: data?.fromUserCreditScore || 0
    },
    receiverInfo: data?.receiverInfo || {
      nickname: data?.toUserNickname || '',
      avatar: data?.toUserAvatar || '',
      creditScore: data?.toUserCreditScore || 0
    }
  }
}

function normalizeTransferPage(res: any) {
  const data = res?.data || res || {}
  return {
    list: getPageList(data).map(normalizeTransferRecord),
    total: data.total || 0,
    current: data.current,
    size: data.size
  }
}

export const shareApi = {
  /**
   * 获取共享物品列表
   */
  getShareItemList(params: ShareItemListParams) {
    return http.get<{
      list: ShareItem[]
      total: number
    }>('/share-item', params).then(normalizeSharePage)
  },

  /**
   * 获取共享物品详情
   */
  getShareItemDetail(id: string) {
    return http.get<ShareItem>(`/share-item/${id}`).then((res: any) => ({
      ...res,
      data: {
        ...(res.data || {}),
        ...normalizeShareItem(res.data)
      }
    }))
  },

  /**
   * 发布共享物品
   */
  publishShareItem(data: {
    title: string
    description: string
    images?: string[]
    imageUrls?: string[]
    dailyRent: number
    deposit: number
    condition: string
    availableTime?: string
    availableTimes?: string
    categoryId: number
  }) {
    const imageUrls = data.images || data.imageUrls || []
    return http.post<ShareItem>('/share-item', {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      deposit: data.deposit,
      dailyRent: data.dailyRent,
      condition: data.condition,
      coverImageUrl: imageUrls[0] || '',
      imageUrls,
      availableTimes: data.availableTime || data.availableTimes
    }, { showLoading: true }).then((res: any) => ({
      ...res,
      data: normalizeShareItem(res.data)
    }))
  },

  /**
   * 更新共享物品
   */
  updateShareItem(id: string, data: Partial<ShareItem>) {
    const imageUrls = (data as any).images || (data as any).imageUrls || []
    return http.put<ShareItem>(`/share-item/${id}`, {
      ...data,
      coverImageUrl: data.coverImage || imageUrls[0],
      imageUrls,
      availableTimes: (data as any).availableTime || (data as any).availableTimes
    }, { showLoading: true }).then((res: any) => ({
      ...res,
      data: normalizeShareItem(res.data)
    }))
  },

  /**
   * 更新共享物品状态
   */
  updateShareItemStatus(id: string | number, status: number) {
    return http.put(`/share-item/${id}/status?status=${status}`, undefined, { showLoading: true })
  },

  /**
   * 删除共享物品
   */
  deleteShareItem(id: string) {
    return http.delete(`/share-item/${id}`, undefined, { showLoading: true })
  },

  /**
   * 我的共享物品
   */
  getMyShareItems(params: { status?: number; page?: number; size?: number }) {
    return http.get<{
      list: ShareItem[]
      total: number
    }>('/share-item/my', params).then(normalizeSharePage)
  },

  /**
   * 获取指定用户的共享物品
   */
  getUserShareItems(userId: string, params: { status?: number; page?: number; size?: number }) {
    return http.get<{
      list: ShareItem[]
      total: number
    }>(`/share-item/user/${userId}/items`, params).then(normalizeSharePage)
  },

  /**
   * 预约借用
   */
  bookShareItem(data: {
    shareId: string
    startDate: string
    endDate: string
    remark?: string
  }) {
    return http.post('/share-item-booking', data, { showLoading: true })
  },

  /**
   * 获取预约详情
   */
  getBookingDetail(bookingId: number) {
    return http.get(`/share-item-booking/${bookingId}`).then((res: any) => ({
      ...res,
      data: normalizeBooking(res.data)
    }))
  },

  /**
   * 获取我的预约列表
   */
  getMyBookings(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: any[]
      total: number
    }>('/share-item-booking/my', {
      page: params.page,
      size: params.pageSize
    }).then(normalizeBookingPage)
  },

  /**
   * 获取收到的预约列表
   */
  getReceivedBookings(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: any[]
      total: number
    }>('/share-item-booking/received', {
      page: params.page,
      size: params.pageSize
    }).then(normalizeBookingPage)
  },

  /**
   * 审批预约（同意或拒绝）
   */
  approveBooking(data: {
    bookingId: number
    status: number  // 1-批准，2-拒绝
    approveRemark?: string
  }) {
    return http.put('/share-item-booking/approve', data, { showLoading: true })
  },

  /**
   * 拒绝预约
   */
  rejectBooking(data: {
    bookingId: number
    approveRemark?: string
  }) {
    return http.put('/share-item-booking/approve', {
      bookingId: data.bookingId,
      status: 2,  // 2表示拒绝
      approveRemark: data.approveRemark
    }, { showLoading: true })
  },

  /**
   * 取消预约
   */
  cancelBooking(bookingId: number) {
    return http.put(`/share-item-booking/${bookingId}/cancel`, undefined, { showLoading: true })
  },

  /**
   * 确认归还
   */
  confirmReturn(data: {
    bookingId: number
    returnRemark?: string
  }) {
    return http.put('/share-item-booking/return', data, { showLoading: true })
  },

  /**
   * 退还押金
   */
  returnDeposit(bookingId: number) {
    return http.put(`/share-item-booking/${bookingId}/deposit-return`, undefined, { showLoading: true })
  },

  /**
   * 获取我发起的转赠列表
   */
  getSentTransfers(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: any[]
      total: number
    }>('/transfer/sent', {
      current: params.page,
      size: params.pageSize
    }).then(normalizeTransferPage)
  },

  /**
   * 获取我收到的转赠列表
   */
  getReceivedTransfers(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: any[]
      total: number
    }>('/transfer/received', {
      current: params.page,
      size: params.pageSize
    }).then(normalizeTransferPage)
  },

  /**
   * 发起转赠
   */
  initiateTransfer(data: {
    shareId: string
    toUserId: number | string
    transferNote?: string
  }) {
    return http.post('/transfer', data, { showLoading: true })
  },

  /**
   * 接受转赠
   */
  acceptTransfer(transferId: number) {
    return http.put('/transfer/respond', { transferId, status: 1 }, { showLoading: true })
  },

  /**
   * 拒绝转赠
   */
  rejectTransfer(transferId: number) {
    return http.put('/transfer/respond', { transferId, status: 2 }, { showLoading: true })
  },

  /**
   * 取消转赠
   */
  cancelTransfer(transferId: number) {
    return http.delete(`/transfer/${transferId}`, undefined, { showLoading: true })
  },

  // ===== 草稿相关方法 =====

  /**
   * 保存共享物品草稿
   */
  saveDraft(data: ShareItemDraftDto) {
    return http.post<ShareItemDraftVo>('/share-item/draft', data)
  },

  /**
   * 获取草稿列表
   */
  getDraftList(params: { page?: number; pageSize?: number }) {
    return http.get<{
      records: ShareItemDraftVo[]
      total: number
    }>('/share-item/draft', {
      page: params.page,
      size: params.pageSize
    })
  },

  /**
   * 获取草稿详情
   */
  getDraftDetail(id: string) {
    return http.get<ShareItemDraftVo>(`/share-item/draft/${id}`)
  },

  /**
   * 从草稿发布
   */
  publishFromDraft(id: string) {
    return http.post<ShareItem>(`/share-item/draft/${id}/publish`, undefined, { showLoading: true })
  },

  /**
   * 获取草稿数量
   */
  getDraftCount() {
    return http.get<{ count: number; maxCount: number }>('/share-item/draft/count')
  },

  /**
   * 删除草稿
   */
  deleteDraft(id: string) {
    return http.delete(`/share-item/draft/${id}`, undefined, { showLoading: true })
  },

  // ===== 押金相关方法 =====

  /**
   * 获取押金列表
   */
  getDepositList(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: any[]
      total: number
    }>('/deposit/my', {
      page: params.page,
      size: params.pageSize
    }).then(normalizeDepositPage)
  },

  /**
   * 兼容旧逻辑：保留 pay-deposit 路径，但不建议继续作为主入口使用
   */
  payDeposit(bookingId: number) {
    return http.post(`/share-item-booking/${bookingId}/pay-deposit`, undefined, { showLoading: true })
  },

  /**
   * 支付共享预约总金额（租金+押金）
   */
  payBooking(bookingId: number) {
    return http.post(`/share-item-booking/${bookingId}/pay`, undefined, { showLoading: true })
  }
}

export default shareApi
