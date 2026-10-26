/**
 * 消息服务
 * 整合 WebSocket 和消息管理功能
 */

import { wsClient } from '@/utils/websocket'
import { messageEventBus, MessageEvents } from '@/utils/message-bus'
import { messageApi } from '@/api/message'
import { notificationApi } from '@/api/notification'
import { userApi } from '@/api/user'
import { useAppStore } from '@/store/app'
import { updateMessageBadge } from '@/utils/tabbar'

// WebSocket 消息类型
interface WSMessage {
  type?: string  // 前端使用的格式
  event?: string  // 后端使用的格式
  data: any
  timestamp?: number
}

interface NotificationPreferences {
  messageEnabled: boolean
  soundEnabled: boolean
  vibrateEnabled: boolean
}

class MessageService {
  private wsUrl: string = ''
  private isConnected: boolean = false
  private reconnectTimer: number | null = null
  private currentConversationId: string = '' // 当前打开的会话ID
  private notificationPreferences: NotificationPreferences = {
    messageEnabled: true,
    soundEnabled: true,
    vibrateEnabled: true
  }

  /**
   * 初始化消息服务
   */
  init(): void {
    console.log('[MessageService] 初始化消息服务')
    this.loadCachedPreferences()
    void this.syncNotificationPreferences()
    this.setupWebSocket()
    this.setupEventListeners()
  }

  private loadCachedPreferences(): void {
    try {
      const cached = uni.getStorageSync('settings')
      if (cached) {
        this.notificationPreferences = {
          messageEnabled: cached.messageEnabled ?? true,
          soundEnabled: cached.soundEnabled ?? true,
          vibrateEnabled: cached.vibrateEnabled ?? true
        }
      }
    } catch (error) {
      console.warn('[MessageService] 读取本地通知设置失败:', error)
    }
  }

  private async syncNotificationPreferences(): Promise<void> {
    const token = uni.getStorageSync('token')
    if (!token) return

    try {
      const res: any = await userApi.getNotificationSettings({ showError: false })
      const data = res?.data || {}
      this.notificationPreferences = {
        messageEnabled: data.notificationEnabled ?? true,
        soundEnabled: data.soundEnabled ?? true,
        vibrateEnabled: data.vibrationEnabled ?? true
      }
      uni.setStorageSync('settings', { ...this.notificationPreferences })
    } catch (error) {
      console.warn('[MessageService] 同步通知设置失败，继续使用本地缓存:', error)
    }
  }

  /**
   * 设置 WebSocket
   */
  private setupWebSocket(): void {
    // 从环境变量或配置中获取 WebSocket 地址
    // #ifdef H5
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'
    this.wsUrl = baseUrl.replace('http', 'ws') + '/ws'
    // #endif

    // #ifdef MP-WEIXIN
    // 微信小程序必须使用 wss:// 协议和备案域名
    const wsUrl = import.meta.env.VITE_WS_BASE_URL
    if (wsUrl) {
      // 开发环境：保持 ws:// 协议（需要在开发者工具中勾选"不校验合法域名"）
      // 生产环境：必须使用 wss:// + 备案域名
      if (wsUrl.startsWith('ws://') && (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1') || wsUrl.match(/10\.|192\.168\.|172\./))) {
        // 本地或内网地址，开发环境，保持 ws://
        this.wsUrl = wsUrl
      } else {
        // 生产环境或外网地址，确保使用 wss://
        this.wsUrl = wsUrl.replace('ws://', 'wss://').replace('http://', 'https://').replace('https://', 'wss://')
      }
    } else {
      // 如果没有配置 WebSocket 地址，使用默认配置
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'
      this.wsUrl = baseUrl.replace('http://', 'wss://').replace('https://', 'wss://') + '/ws'
    }

    // 本地开发环境提示（仅在非生产环境输出）
    const isLocalAddress = this.wsUrl.includes('localhost') || this.wsUrl.includes('127.0.0.1') || this.wsUrl.match(/10\.\d+\.\d+\.\d+/) || this.wsUrl.match(/192\.168\.\d+\.\d+/) || this.wsUrl.match(/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/)
    if (isLocalAddress && import.meta.env.DEV) {
      console.log('[MessageService] 开发环境使用本地 WebSocket 地址')
    }
    // #endif

    console.log('[MessageService] WebSocket URL:', this.wsUrl)

    // 设置 WebSocket 事件监听
    wsClient.on('open', () => {
      console.log('[MessageService] WebSocket 已连接')
      this.isConnected = true
      // 连接成功后获取最新未读数
      this.refreshUnreadCount()
    })

    wsClient.on('message', (data: WSMessage) => {
      console.log('[MessageService] 收到消息:', data)
      this.handleWSMessage(data)
    })

    wsClient.on('close', () => {
      console.log('[MessageService] WebSocket 已断开')
      this.isConnected = false
    })

    wsClient.on('error', (error) => {
      console.error('[MessageService] WebSocket 错误:', error)
    })
  }

  /**
   * 连接 WebSocket
   */
  connect(): void {
    if (this.isConnected) {
      console.log('[MessageService] WebSocket 已连接，无需重复连接')
      return
    }

    const token = uni.getStorageSync('token')
    if (!token) {
      console.warn('[MessageService] 未登录，跳过 WebSocket 连接')
      return
    }

    console.log('[MessageService] 开始连接 WebSocket')
    wsClient.connect(this.wsUrl)
  }

  /**
   * 断开 WebSocket
   */
  disconnect(): void {
    console.log('[MessageService] 断开 WebSocket')
    wsClient.close()
    this.isConnected = false
  }

  /**
   * 设置当前打开的会话ID
   * @param conversationId 会话ID
   */
  setCurrentConversation(conversationId: string): void {
    this.currentConversationId = conversationId
  }

  /**
   * 清除当前会话
   */
  clearCurrentConversation(): void {
    this.currentConversationId = ''
  }

  /**
   * 处理 WebSocket 消息
   */
  private handleWSMessage(message: WSMessage): void {
    // 验证消息格式
    if (!message || typeof message !== 'object') {
      console.warn('[MessageService] 收到无效消息:', message)
      return
    }

    // 兼容两种消息格式：
    // 1. { type: 'xxx', data: {...} }
    // 2. { event: 'xxx', data: {...} }
    const messageType = message.type || message.event
    const { data } = message

    // 检查消息类型
    if (!messageType) {
      console.warn('[MessageService] 收到没有 type/event 字段的消息:', message)
      return
    }

    switch (messageType) {
      case 'new_message':
        this.handleNewMessage(data)
        break

      case 'message_read':
        this.handleMessageRead(data)
        break

      case 'message_recalled':
        this.handleMessageRecalled(data)
        break

      case 'unread_count':
        this.handleUnreadCountUpdate(data)
        break

      case 'typing':
        this.handleTyping(data)
        break

      case 'online_status':
        this.handleOnlineStatus(data)
        break

      case 'ping':
        // 心跳响应
        this.sendPong()
        break

      case 'pong':
        // 心跳响应，不需要处理
        console.log('[MessageService] 收到心跳响应')
        break

      case 'connected':
        // WebSocket 连接成功确认
        console.log('[MessageService] WebSocket 连接已确认:', data)
        break

      case 'system_notification':
        void this.handleSystemNotification(data)
        break

      default:
        console.warn('[MessageService] 未知消息类型:', messageType, '完整消息:', message)
    }
  }

  /**
   * 处理新消息
   */
  private handleNewMessage(data: any): void {
    const { conversationId, message, senderId } = data

    // 如果不是当前会话的消息，增加未读数
    if (conversationId !== this.currentConversationId) {
      const appStore = useAppStore()
      appStore.increaseUnreadMessageCount()
      this.updateBadge()

      // 播放提示音和震动
      this.playNotification()
    }

    // 触发新消息事件
    messageEventBus.emit(MessageEvents.NEW_MESSAGE, {
      conversationId,
      message,
      senderId,
      isCurrentConversation: conversationId === this.currentConversationId
    })
  }

  /**
   * 处理消息已读
   */
  private handleMessageRead(data: any): void {
    const { conversationId, userId } = data

    messageEventBus.emit(MessageEvents.MESSAGE_READ, {
      conversationId,
      userId
    })
  }

  /**
   * 处理消息撤回
   */
  private handleMessageRecalled(data: any): void {
    const { messageId, conversationId } = data

    messageEventBus.emit(MessageEvents.MESSAGE_RECALLED, {
      messageId,
      conversationId
    })
  }

  /**
   * 处理未读数更新
   */
  private handleUnreadCountUpdate(data: any): void {
    const { unreadCount, noticeCount } = data
    const appStore = useAppStore()

    if (typeof unreadCount === 'number') {
      appStore.setUnreadMessageCount(unreadCount)
    }
    if (typeof noticeCount === 'number') {
      appStore.setUnreadNoticeCount(noticeCount)
    }

    this.updateBadge()

    // 触发未读数更新事件
    messageEventBus.emit(MessageEvents.UNREAD_COUNT_UPDATE, {
      unreadCount: appStore.getTotalUnreadCount(),
      refreshNoticeList: false
    })
  }

  /**
   * 处理系统通知
   */
  private async handleSystemNotification(data: any): Promise<void> {
    this.playNotification()

    try {
      const unreadRes: any = await notificationApi.getUnreadCount()
      const appStore = useAppStore()
      appStore.setUnreadNoticeCount(unreadRes.data || 0)
      this.updateBadge()

      messageEventBus.emit(MessageEvents.UNREAD_COUNT_UPDATE, {
        unreadCount: appStore.getTotalUnreadCount(),
        refreshNoticeList: true,
        notification: data
      })
    } catch (error) {
      console.error('[MessageService] 刷新通知未读数失败:', error)
    }
  }

  /**
   * 处理正在输入
   */
  private handleTyping(data: any): void {
    const { conversationId, userId, isTyping } = data

    // 只通知当前会话的输入状态
    if (conversationId === this.currentConversationId) {
      messageEventBus.emit(MessageEvents.TYPING, {
        conversationId,
        userId,
        isTyping
      })
    }
  }

  /**
   * 处理在线状态变化
   */
  private handleOnlineStatus(data: any): void {
    const { userId, online } = data

    messageEventBus.emit(MessageEvents.ONLINE_STATUS_CHANGE, {
      userId,
      online
    })
  }

  /**
   * 发送 Pong 响应
   */
  private sendPong(): void {
    wsClient.send({ type: 'pong' })
  }

  /**
   * 刷新未读数
   */
  async refreshUnreadCount(): Promise<void> {
    try {
      const [conversationRes, noticeRes]: any[] = await Promise.all([
        messageApi.getConversationList(),
        notificationApi.getUnreadCount()
      ])
      const list = conversationRes.data?.list || []
      const unreadCount = list.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
      const noticeCount = noticeRes.data || 0

      const appStore = useAppStore()
      appStore.setUnreadMessageCount(unreadCount)
      appStore.setUnreadNoticeCount(noticeCount)
      this.updateBadge()
    } catch (error) {
      console.error('[MessageService] 刷新未读数失败:', error)
    }
  }

  /**
   * 更新 TabBar 徽章
   */
  private updateBadge(): void {
    const appStore = useAppStore()
    const totalUnread = appStore.getTotalUnreadCount()
    updateMessageBadge(totalUnread)
  }

  /**
   * 播放通知提示
   */
  private playNotification(): void {
    this.loadCachedPreferences()

    if (!this.notificationPreferences.messageEnabled) {
      return
    }

    if (this.notificationPreferences.vibrateEnabled) {
      uni.vibrateShort({
        fail: () => {
          console.warn('[MessageService] 当前环境不支持震动提示')
        }
      })
    }

    if (this.notificationPreferences.soundEnabled) {
      this.playNotificationSound()
    }
  }

  private playNotificationSound(): void {
    // #ifdef H5
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.16)
    } catch (error) {
      console.warn('[MessageService] H5 提示音播放失败:', error)
    }
    // #endif

    // #ifdef APP-PLUS
    try {
      if (typeof plus !== 'undefined' && plus.device?.beep) {
        plus.device.beep(1)
      }
    } catch (error) {
      console.warn('[MessageService] App 提示音播放失败:', error)
    }
    // #endif
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听应用前台/后台切换
    uni.onAppShow(() => {
      console.log('[MessageService] 应用进入前台')
      this.connect()
      this.refreshUnreadCount()
    })

    uni.onAppHide(() => {
      console.log('[MessageService] 应用进入后台')
      // 可选择是否断开 WebSocket 以节省资源
      // this.disconnect()
    })
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// 导出单例
export const messageService = new MessageService()

export default messageService
