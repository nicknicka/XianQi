/**
 * WebSocket 工具类
 */

type MessageHandler = (data: any) => void
type ConnectionHandler = () => void
type ErrorHandler = (error: any) => void

class WebSocketClient {
  private ws: UniApp.SocketTask | null = null
  private url: string = ''
  private reconnectTimer: number | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 3000
  private isManualClose: boolean = false
  private heartbeatTimer: number | null = null
  private heartbeatInterval: number = 30000
  private onMessage: MessageHandler | null = null
  private onOpen: ConnectionHandler | null = null
  private onClose: ConnectionHandler | null = null
  private onError: ErrorHandler | null = null

  /**
   * 连接 WebSocket
   */
  connect(url: string): void {
    this.url = url
    this.isManualClose = false

    const token = uni.getStorageSync('token')
    const wsUrl = token ? `${url}?token=${token}` : url

    console.log('[WebSocket] 开始连接:', wsUrl)

    // 检查 URL 是否合法
    if (!wsUrl || typeof wsUrl !== 'string') {
      console.error('[WebSocket] URL 无效:', wsUrl)
      return
    }

    // 微信小程序环境检查
    // #ifdef MP-WEIXIN
    if (wsUrl.startsWith('ws://') && !wsUrl.includes('localhost') && !wsUrl.includes('127.0.0.1')) {
      console.warn('[WebSocket] ⚠️ 微信小程序建议使用 wss:// 协议')
      console.warn('[WebSocket] 当前使用 ws:// 可能在真机上无法连接')
    }

    // 检查是否使用本地 IP
    if (wsUrl.includes('10.173.241.252') || wsUrl.match(/192\.168\.\d+\.\d+/)) {
      console.warn('[WebSocket] ⚠️ 检测到内网 IP 地址，请在微信开发者工具中勾选"不校验合法域名"')
    }
    // #endif

    try {
      this.ws = uni.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('[WebSocket] 连接请求已发送')
        },
        fail: (err) => {
          console.error('[WebSocket] 连接请求失败:', err)
          this.onError?.(err)
        }
      })

      // 检查 WebSocket 对象是否创建成功
      if (!this.ws) {
        console.error('[WebSocket] 创建 WebSocket 对象失败')
        this.onError?.(new Error('创建 WebSocket 对象失败'))
        return
      }

      this.ws.onOpen(() => {
        console.log('[WebSocket] 连接已打开')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.onOpen?.()
      })

      this.ws.onMessage((res) => {
        try {
          // 检查数据是否存在
          if (!res || !res.data) {
            console.warn('[WebSocket] 收到空消息')
            return
          }

          // 尝试解析 JSON
          const data = JSON.parse(res.data as string)

          // 验证解析后的数据
          if (data && typeof data === 'object') {
            this.onMessage?.(data)
          } else {
            console.warn('[WebSocket] 解析后的数据格式无效:', res.data)
          }
        } catch (e) {
          console.error('[WebSocket] 解析消息失败:', e, '原始数据:', res.data)
        }
      })

      this.ws.onError((err) => {
        console.error('[WebSocket] 错误:', err)
        this.onError?.(err)
        this.reconnect()
      })

      this.ws.onClose(() => {
        console.log('[WebSocket] 连接已关闭')
        this.stopHeartbeat()
        this.onClose?.()

        if (!this.isManualClose) {
          this.reconnect()
        }
      })
    } catch (error) {
      console.error('[WebSocket] 连接异常:', error)
      this.onError?.(error)
    }
  }

  /**
   * 发送消息
   */
  send(data: any): void {
    if (!this.ws || !this.ws.readyState) {
      console.warn('WebSocket 未连接')
      return
    }

    try {
      this.ws.send({
        data: JSON.stringify(data),
        success: () => {
          console.log('消息发送成功')
        },
        fail: (err) => {
          console.error('消息发送失败:', err)
        }
      })
    } catch (e) {
      console.error('发送消息异常:', e)
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.isManualClose = true
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * 重连
   */
  private reconnect(): void {
    if (this.isManualClose) return

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket 重连次数超过限制')
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    console.log(`WebSocket 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.url)
    }, this.reconnectDelay)
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' })
    }, this.heartbeatInterval) as unknown as number
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 监听消息
   */
  on(handler: 'message', callback: MessageHandler): void
  on(handler: 'open', callback: ConnectionHandler): void
  on(handler: 'close', callback: ConnectionHandler): void
  on(handler: 'error', callback: ErrorHandler): void
  on(handler: string, callback: any): void {
    if (handler === 'message') {
      this.onMessage = callback
    } else if (handler === 'open') {
      this.onOpen = callback
    } else if (handler === 'close') {
      this.onClose = callback
    } else if (handler === 'error') {
      this.onError = callback
    }
  }

  /**
   * 获取连接状态
   */
  getReadyState(): number {
    return this.ws?.readyState ?? 3 // 3 = CLOSED
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.getReadyState() === 1 // 1 = OPEN
  }
}

// 导出单例
export const wsClient = new WebSocketClient()

export default wsClient
