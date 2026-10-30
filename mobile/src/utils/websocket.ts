/**
 * WebSocket 工具类
 */

type MessageHandler = (data: any) => void
type ConnectionHandler = () => void
type ErrorHandler = (error: any) => void
type Unsubscribe = () => void

const SOCKET_CONNECTING = 0
const SOCKET_OPEN = 1
const SOCKET_CLOSED = 3

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
  private messageHandlers = new Set<MessageHandler>()
  private openHandlers = new Set<ConnectionHandler>()
  private closeHandlers = new Set<ConnectionHandler>()
  private errorHandlers = new Set<ErrorHandler>()

  /**
   * 连接 WebSocket
   */
  connect(url: string): void {
    if (!url || typeof url !== 'string') {
      console.error('[WebSocket] URL 无效:', url)
      return
    }

    if (
      this.url === url &&
      this.ws &&
      (this.ws.readyState === SOCKET_CONNECTING || this.ws.readyState === SOCKET_OPEN)
    ) {
      console.log('[WebSocket] 已存在相同地址的连接，跳过重复连接')
      return
    }

    this.url = url
    this.isManualClose = false
    this.clearReconnectTimer()
    this.disposeSocket()

    const token = uni.getStorageSync('token')
    const wsUrl = token ? `${url}?token=${token}` : url

    console.log('[WebSocket] 开始连接:', wsUrl)

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
      const task = uni.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('[WebSocket] 连接请求已发送')
        },
        fail: (err) => {
          console.error('[WebSocket] 连接请求失败:', err)
          this.emitError(err)
          this.scheduleReconnect()
        }
      })

      if (!task) {
        console.error('[WebSocket] 创建 WebSocket 对象失败')
        this.emitError(new Error('创建 WebSocket 对象失败'))
        this.scheduleReconnect()
        return
      }

      this.ws = task

      task.onOpen(() => {
        if (this.ws !== task) return

        console.log('[WebSocket] 连接已打开')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.emitOpen()
      })

      task.onMessage((res) => {
        if (this.ws !== task) return

        try {
          if (!res || !res.data) {
            console.warn('[WebSocket] 收到空消息')
            return
          }

          const data = JSON.parse(res.data as string)
          if (data && typeof data === 'object') {
            this.emitMessage(data)
          } else {
            console.warn('[WebSocket] 解析后的数据格式无效:', res.data)
          }
        } catch (error) {
          console.error('[WebSocket] 解析消息失败:', error, '原始数据:', res.data)
        }
      })

      task.onError((err) => {
        if (this.ws !== task) return

        console.error('[WebSocket] 错误:', err)
        this.emitError(err)
        this.scheduleReconnect()
      })

      task.onClose(() => {
        if (this.ws !== task) return

        console.log('[WebSocket] 连接已关闭')
        this.ws = null
        this.stopHeartbeat()
        this.emitClose()

        if (!this.isManualClose) {
          this.scheduleReconnect()
        }
      })
    } catch (error) {
      console.error('[WebSocket] 连接异常:', error)
      this.emitError(error)
      this.scheduleReconnect()
    }
  }

  /**
   * 发送消息。仅在实际 OPEN 状态发送，确保调用方可以立即处理失败。
   */
  send(data: any): boolean {
    if (!this.ws || this.ws.readyState !== SOCKET_OPEN) {
      console.warn('WebSocket 未连接，消息未发送')
      return false
    }

    try {
      this.ws.send({
        data: JSON.stringify(data),
        success: () => {
          console.log('消息发送成功')
        },
        fail: (err) => {
          console.error('消息发送失败:', err)
          this.emitError(err)
          this.scheduleReconnect()
        }
      })
      return true
    } catch (error) {
      console.error('发送消息异常:', error)
      this.emitError(error)
      return false
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.isManualClose = true
    this.clearReconnectTimer()
    this.stopHeartbeat()
    this.disposeSocket()
  }

  /**
   * 监听 WebSocket 事件，返回取消订阅函数。
   */
  on(handler: 'message', callback: MessageHandler): Unsubscribe
  on(handler: 'open', callback: ConnectionHandler): Unsubscribe
  on(handler: 'close', callback: ConnectionHandler): Unsubscribe
  on(handler: 'error', callback: ErrorHandler): Unsubscribe
  on(handler: string, callback: any): Unsubscribe {
    if (handler === 'message') {
      this.messageHandlers.add(callback)
      return () => { this.messageHandlers.delete(callback) }
    }
    if (handler === 'open') {
      this.openHandlers.add(callback)
      return () => { this.openHandlers.delete(callback) }
    }
    if (handler === 'close') {
      this.closeHandlers.add(callback)
      return () => { this.closeHandlers.delete(callback) }
    }
    if (handler === 'error') {
      this.errorHandlers.add(callback)
      return () => { this.errorHandlers.delete(callback) }
    }

    throw new Error(`未知的 WebSocket 事件: ${handler}`)
  }

  /**
   * 获取连接状态
   */
  getReadyState(): number {
    return this.ws?.readyState ?? SOCKET_CLOSED
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.getReadyState() === SOCKET_OPEN
  }

  private disposeSocket(): void {
    const task = this.ws
    this.ws = null

    if (!task || task.readyState === SOCKET_CLOSED) {
      return
    }

    try {
      task.close()
    } catch (error) {
      console.warn('[WebSocket] 关闭旧连接失败:', error)
    }
  }

  private scheduleReconnect(): void {
    if (this.isManualClose || this.reconnectTimer) {
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 重连次数超过限制')
      return
    }

    this.reconnectAttempts++
    console.log(`[WebSocket] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.isManualClose) {
        this.connect(this.url)
      }
    }, this.reconnectDelay) as unknown as number
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return

    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' })
    }, this.heartbeatInterval) as unknown as number
  }

  private stopHeartbeat(): void {
    if (!this.heartbeatTimer) return

    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private emitMessage(data: any): void {
    for (const callback of [...this.messageHandlers]) {
      try {
        callback(data)
      } catch (error) {
        console.error('[WebSocket] 消息回调异常:', error)
      }
    }
  }

  private emitOpen(): void {
    for (const callback of [...this.openHandlers]) {
      try {
        callback()
      } catch (error) {
        console.error('[WebSocket] 打开回调异常:', error)
      }
    }
  }

  private emitClose(): void {
    for (const callback of [...this.closeHandlers]) {
      try {
        callback()
      } catch (error) {
        console.error('[WebSocket] 关闭回调异常:', error)
      }
    }
  }

  private emitError(error: any): void {
    for (const callback of [...this.errorHandlers]) {
      try {
        callback(error)
      } catch (callbackError) {
        console.error('[WebSocket] 错误回调异常:', callbackError)
      }
    }
  }
}

// 导出单例
export const wsClient = new WebSocketClient()

export default wsClient
