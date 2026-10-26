/**
 * 消息相关 API
 */
import { http } from '@/utils/request'

interface Conversation {
  conversationId: string
  otherUserId?: string
  otherUserNickname?: string
  otherUserAvatar?: string
  lastMessageContent?: string
  lastMessageTime?: string
  lastMessageType?: string // 消息类型：text、image、product、order、system、quote
  unreadCount?: number
  isTop?: number // 0-未置顶，1-已置顶（注意：后端使用isTop字段，不是isPinned）
  relatedProductId?: string
  relatedOrderId?: string
  relatedShareId?: string
}

interface Message {
  id: string
  conversationId: string
  fromUserId: string
  toUserId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  extraData?: string
  type: number // 1-文本，2-图片，3-商品卡片，4-订单卡片
  status: number
  createTime: string
  isMine?: boolean
}

function normalizeConversation(data: any): Conversation {
  return {
    conversationId: String(data?.conversationId || ''),
    otherUserId: data?.otherUserId ? String(data.otherUserId) : undefined,
    otherUserNickname: data?.otherUserNickname,
    otherUserAvatar: data?.otherUserAvatar,
    lastMessageContent: data?.lastMessageContent,
    lastMessageTime: data?.lastMessageTime,
    lastMessageType: data?.lastMessageType,
    unreadCount: data?.unreadCount ?? 0,
    isTop: data?.isTop ?? 0,
    relatedProductId: data?.relatedProductId ? String(data.relatedProductId) : undefined,
    relatedOrderId: data?.relatedOrderId ? String(data.relatedOrderId) : undefined,
    relatedShareId: data?.relatedShareId ? String(data.relatedShareId) : undefined
  }
}

function normalizeMessage(data: any): Message {
  return {
    id: String(data?.messageId || data?.id || ''),
    conversationId: String(data?.conversationId || ''),
    fromUserId: String(data?.fromUserId || data?.senderId || ''),
    toUserId: String(data?.toUserId || ''),
    senderId: String(data?.fromUserId || data?.senderId || ''),
    senderName: data?.fromUserNickname || data?.senderName || '',
    senderAvatar: data?.fromUserAvatar || data?.senderAvatar || '',
    content: data?.content || '',
    extraData: data?.extraData || '',
    type: Number(data?.type ?? data?.messageType ?? 1),
    status: Number(data?.sendStatus ?? data?.status ?? 1),
    createTime: data?.createTime || data?.sendTime || '',
    isMine: data?.isMine ?? data?.mine
  }
}

function normalizeConversationPage(res: any) {
  return {
    ...res,
    data: {
      ...res.data,
      list: (res.data?.list || []).map(normalizeConversation)
    }
  }
}

function normalizeMessagePage(res: any) {
  return {
    ...res,
    data: {
      ...res.data,
      list: (res.data?.list || []).map(normalizeMessage)
    }
  }
}

export const messageApi = {
  /**
   * 获取会话列表
   */
  getConversationList(params?: { page?: number; pageSize?: number }) {
    console.log('[getConversationList] 调用参数:', params)
    const requestParams = {
      page: params?.page,
      size: params?.pageSize
    }
    return http.get<{
      list: Conversation[]
      total: number
    }>('/conversation', requestParams, { showError: false }).then(normalizeConversationPage)
  },

  /**
   * 获取会话详情
   */
  getConversationDetail(id: string) {
    return http.get<Conversation>(`/conversation/${id}`).then((res: any) => ({
      ...res,
      data: normalizeConversation(res.data)
    }))
  },

  /**
   * 创建单聊会话
   */
  createOneToOneConversation(targetId: string) {
    return http.post<string>(`/conversation/one-to-one?userId=${encodeURIComponent(targetId)}`)
  },

  /**
   * 创建或获取会话
   * @param targetId 对方用户ID
   * @param productId 商品ID（可选）
   * @param orderId 订单ID（可选）
   * @param shareId 共享物品ID（可选）
   */
  createOrUpdateConversation(targetId: string, productId?: string, orderId?: string, shareId?: string) {
    console.log('[createOrUpdateConversation] 调用参数:', { targetId, productId, orderId, shareId })
    const data: any = { targetId }
    if (productId !== undefined && productId !== null && productId !== '') {
      data.relatedProductId = productId
    }
    if (orderId !== undefined && orderId !== null && orderId !== '') {
      data.relatedOrderId = orderId
    }
    if (shareId !== undefined && shareId !== null && shareId !== '') {
      data.relatedShareId = shareId
    }
    console.log('[createOrUpdateConversation] 最终请求数据:', data)
    return http.post<Conversation>('/conversation/create-or-update', data).then((res: any) => ({
      ...res,
      data: normalizeConversation(res.data)
    }))
  },

  /**
   * 根据用户ID和商品ID查找会话
   */
  findConversationByUserAndProduct(targetId: string, productId?: string, shareId?: string) {
    console.log('[findConversationByUserAndProduct] 调用参数:', { targetId, productId, shareId })
    const params: any = { targetId }
    if (productId !== undefined && productId !== null && productId !== '') {
      params.relatedProductId = productId
    }
    if (shareId !== undefined && shareId !== null && shareId !== '') {
      params.relatedShareId = shareId
    }
    console.log('[findConversationByUserAndProduct] 最终请求参数:', params)
    return http.get<Conversation | null>('/conversation/find', params, { showError: false }).then((res: any) => ({
      ...res,
      data: res.data ? normalizeConversation(res.data) : res.data
    }))
  },

  /**
   * 获取聊天记录
   */
  getMessageList(conversationId: string, params: { page?: number; pageSize?: number }) {
    console.log('[getMessageList] 调用参数:', { conversationId, params })
    const requestParams = {
      page: params?.page,
      size: params?.pageSize
    }
    return http.get<{
      list: Message[]
      total: number
    }>(`/conversation/${conversationId}/messages`, requestParams).then(normalizeMessagePage)
  },

  /**
   * 发送消息
   */
  sendMessage(data: {
    conversationId: string
    content: string
    type: number // 1-文本，2-图片，3-商品卡片，4-订单卡片
    quotedMessageId?: string
  }) {
    console.log('[sendMessage] 发送消息参数:', data)
    return http.post<Message>('/conversation/message', {
      conversationId: data.conversationId,
      content: data.content,
      type: data.type,
      parentMessageId: data.quotedMessageId ? String(data.quotedMessageId) : undefined
    }).then((res: any) => ({
      ...res,
      data: normalizeMessage(res.data)
    }))
  },

  /**
   * 标记消息已读
   */
  markAsRead(conversationId: string) {
    return http.put(`/conversation/${conversationId}/read`)
  },

  /**
   * 删除会话
   */
  deleteConversation(conversationId: string) {
    return http.delete(`/conversation/${conversationId}`, undefined, { showLoading: true })
  },

  /**
   * 清空聊天记录
   */
  clearMessages(conversationId: string) {
    return http.delete(`/conversation/${conversationId}/messages`, undefined, { showLoading: true })
  },

  /**
   * 撤回消息
   */
  recallMessage(messageId: string) {
    return http.put(`/conversation/message/${messageId}/recall`)
  },

  /**
   * 获取快捷回复
   */
  getQuickReplies() {
    return http.get<{
      records: Array<{
        replyId: string
        content: string
        category?: string
        userId: string
        isSystem: number
        createTime: string
      }>
      total: number
      size: number
      current: number
      pages: number
    }>('/quick-reply')
  },

  /**
   * 添加快捷回复
   */
  addQuickReply(data: { content: string; category?: string }) {
    return http.post('/quick-reply', data, { showLoading: true })
  },

  /**
   * 删除快捷回复
   */
  deleteQuickReply(id: string) {
    return http.delete(`/quick-reply/${id}`, undefined, { showLoading: true })
  },

  /**
   * 置顶会话
   */
  pinConversation(conversationId: string) {
    return http.put(`/conversation/${conversationId}/pin`, {}, { showLoading: true })
  },

  /**
   * 取消置顶会话
   */
  unpinConversation(conversationId: string) {
    return http.put(`/conversation/${conversationId}/unpin`, {}, { showLoading: true })
  },
}

export default messageApi
