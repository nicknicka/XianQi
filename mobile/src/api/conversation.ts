/**
 * 会话相关 API
 */
import { http } from '@/utils/request'

export interface Conversation {
  conversationId: string
  type: number // 1-单聊，2-群聊
  name?: string
  avatar?: string
  unreadCount: number
  lastMessage?: {
    content: string
    messageType: number
    sendTime: string
    senderId: string
    senderName: string
  }
  memberCount?: number
  isTop?: number // 0-未置顶，1-已置顶（注意：后端使用isTop字段）
  relatedProductId?: string
  relatedOrderId?: string
  relatedShareId?: string
  createTime: string
}

export interface Message {
  messageId: string
  conversationId: string
  fromUserId: string
  toUserId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  messageType: number // 1-文本，2-图片，3-商品卡片，4-订单卡片，5-引用消息，6-系统通知
  replyToMessageId?: number
  status: number // 1-发送中，2-发送成功，3-发送失败
  sendTime: string
  isRecalled?: boolean
  isMine?: boolean
}

function normalizeConversation(data: any): Conversation {
  return {
    conversationId: String(data?.conversationId || ''),
    type: Number(data?.conversationType ?? data?.type ?? 1),
    name: data?.name || data?.otherUserNickname,
    avatar: data?.avatar || data?.otherUserAvatar,
    unreadCount: data?.unreadCount ?? 0,
    lastMessage: data?.lastMessageContent ? {
      content: data.lastMessageContent,
      messageType: Number(data?.lastMessageType ?? 1),
      sendTime: data?.lastMessageTime || '',
      senderId: String(data?.otherUserId || ''),
      senderName: data?.otherUserNickname || ''
    } : undefined,
    memberCount: data?.memberCount,
    isTop: data?.isTop ?? 0,
    relatedProductId: data?.relatedProductId ? String(data.relatedProductId) : undefined,
    relatedOrderId: data?.relatedOrderId ? String(data.relatedOrderId) : undefined,
    relatedShareId: data?.relatedShareId ? String(data.relatedShareId) : undefined,
    createTime: data?.createTime || data?.lastMessageTime || ''
  }
}

function normalizeMessage(data: any): Message {
  return {
    messageId: String(data?.messageId || data?.id || ''),
    conversationId: String(data?.conversationId || ''),
    fromUserId: String(data?.fromUserId || data?.senderId || ''),
    toUserId: String(data?.toUserId || ''),
    senderId: String(data?.fromUserId || data?.senderId || ''),
    senderName: data?.fromUserNickname || data?.senderName || '',
    senderAvatar: data?.fromUserAvatar || data?.senderAvatar || '',
    content: data?.content || '',
    messageType: Number(data?.type ?? data?.messageType ?? 1),
    replyToMessageId: data?.parentMessageId ? Number(data.parentMessageId) : undefined,
    status: Number(data?.sendStatus ?? data?.status ?? 1),
    sendTime: data?.createTime || data?.sendTime || '',
    isRecalled: false,
    isMine: data?.isMine ?? data?.mine
  }
}

export const conversationApi = {
  /**
   * 获取会话列表
   */
  getConversationList(params?: { page?: number; pageSize?: number }) {
    const requestParams = {
      page: params?.page,
      size: params?.pageSize
    }
    return http.get<{
      list: Conversation[]
      total: number
    }>('/conversation', requestParams, { showError: false }).then((res: any) => ({
      ...res,
      data: {
        ...res.data,
        list: (res.data?.list || []).map(normalizeConversation)
      }
    }))
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
   * 创建会话
   */
  createConversation(data: {
    type: number
    targetUserId?: number
    name?: string
    memberIds?: string[]
  }) {
    if (data.type === 1 && data.targetUserId) {
      return http.post<number | string>(`/conversation/one-to-one?userId=${data.targetUserId}`).then((res: any) => ({
        ...res,
        data: {
          conversationId: String(res.data),
          type: 1,
          unreadCount: 0,
          createTime: ''
        }
      }))
    }

    return Promise.reject(new Error('当前后端仅支持单聊会话创建'))
  },

  /**
   * 获取会话消息列表
   */
  getMessages(params: {
    conversationId: string
    page?: number
    pageSize?: number
  }) {
    return http.get<{
      list: Message[]
      total: number
    }>(`/conversation/${params.conversationId}/messages`, {
      page: params.page,
      size: params.pageSize
    }).then((res: any) => ({
      ...res,
      data: {
        ...res.data,
        list: (res.data?.list || []).map(normalizeMessage)
      }
    }))
  },

  /**
   * 发送消息
   */
  sendMessage(data: {
    conversationId: string
    content: string
    messageType: number
    replyToMessageId?: number
  }) {
    return http.post<Message>('/conversation/message', {
      conversationId: data.conversationId,
      content: data.content,
      type: data.messageType,
      parentMessageId: data.replyToMessageId ? String(data.replyToMessageId) : undefined
    }).then((res: any) => ({
      ...res,
      data: normalizeMessage(res.data)
    }))
  },

  /**
   * 撤回消息
   */
  recallMessage(messageId: string) {
    return http.put(`/conversation/message/${messageId}/recall`)
  },

  /**
   * 标记会话已读
   */
  markAsRead(conversationId: string) {
    return http.put(`/conversation/${conversationId}/read`)
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

  /**
   * 删除会话
   */
  deleteConversation(conversationId: string) {
    return http.delete(`/conversation/${conversationId}`)
  }
}

export default conversationApi
