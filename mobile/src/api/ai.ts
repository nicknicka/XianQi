/**
 * AI 聊天相关 API
 */
import { http } from '@/utils/request'
import { wsClient } from '@/utils/websocket'
import { normalizeId } from '@/utils/id'

interface AIChatRequest {
  userId: string
  message: string
  sessionId?: string
  intent?: string
}

export interface AIChatMessage {
  id: string
  userId: string
  userMessage: string
  aiResponse: string
  intentType: string
  agentType: string
  createdAt: string
}

export interface AIChatError {
  type: string
  code: number
  message: string
  retryable: boolean
}

interface AIConfig {
  enabled: boolean
  model: string
  maxTokens: number
  temperature: number
  chatMemorySize: number
  streamEnabled: boolean
}

export const aiApi = {
  /**
   * 发送聊天消息并获取 AI 回复（普通模式）
   */
  chat(data: AIChatRequest) {
    return http.post<string>('/ai/chat', data, {
      showLoading: false, // 不显示全局 loading，使用页面内的加载状态
      showError: true
    })
  },

  /**
   * 发送聊天消息并获取 AI 回复（流式模式，使用 SSE）
   * 注意：仅在 H5 平台支持真正的流式传输，其他平台会降级为普通请求
   */
  chatStream(data: AIChatRequest, onMessage: (chunk: string) => void, onError?: (error: AIChatError | Error) => void, onComplete?: () => void) {
    // #ifdef H5
    // H5 平台使用 fetch API 实现真正的流式传输
    const token = uni.getStorageSync('token')
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
    const url = `${BASE_URL}/ai/chat/stream`

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }
      const streamReader = reader

      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = 'message'

      // 读取流式数据
      function readStream(): Promise<void> {
        return streamReader.read().then(({ done, value }) => {
          if (done) {
            onComplete?.()
            return Promise.resolve()
          }

          // 解码数据
          buffer += decoder.decode(value, { stream: true })

          // 按行分割处理 SSE 数据
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留最后一个不完整的行

          for (const line of lines) {
            const trimmedLine = line.trim()

            // 空行分隔一个 SSE event，之后重新回到默认 message 类型
            if (!trimmedLine) {
              currentEvent = 'message'
              continue
            }

            if (trimmedLine.startsWith('event:')) {
              currentEvent = trimmedLine.slice(6).trim() || 'message'
              continue
            }

            // 处理data行
            if (trimmedLine.startsWith('data:')) {
              const data = trimmedLine.slice(5).trim() // 移除 "data:" 前缀

              if (data === '[DONE]') {
                onComplete?.()
                return Promise.resolve()
              }

              if (currentEvent === 'error') {
                try {
                  onError?.(JSON.parse(data) as AIChatError)
                } catch {
                  onError?.(new Error(data || 'AI 请求失败'))
                }
                return Promise.resolve()
              }

              if (data && data !== '""') {
                try {
                  // 发送消息块到回调
                  onMessage(data)
                } catch (e) {
                  console.error('处理SSE数据失败:', e)
                }
              }
            }
          }

          // 继续读取
          return readStream()
        })
      }

      return readStream()
    }).catch(error => {
      console.error('SSE请求失败:', error)
      onError?.(error)
    })
    // #endif

    // #ifndef H5
    // 非 H5 平台（微信小程序等）直接使用真实普通请求
    console.log('[AI Chat] 当前平台不支持 SSE，使用真实普通请求')
    http.post<string>('/ai/chat', data, {
      showLoading: false,
      showError: false  // 不自动显示错误，由 onError 处理
    }).then(res => {
      onMessage(res.data || '')
      onComplete?.()
    }).catch(error => {
      console.error('[AI Chat] 请求失败:', error)
      onError?.(error)
    })
    // #endif
  },


  /**
   * 获取聊天历史记录
   */
  getHistory(userId: string, limit = 20) {
    return http.get<AIChatMessage[]>(`/ai/history/${normalizeId(userId)}`, { limit })
  },

  /**
   * 清除聊天历史记录
   */
  clearHistory(userId: string) {
    return http.delete<void>(`/ai/history/${normalizeId(userId)}`, { showLoading: true })
  },

  /**
   * 获取 AI 配置信息
   */
  getConfig() {
    return http.get<AIConfig>('/ai/config')
  },

  /**
   * 通过 WebSocket 发送 AI 聊天消息（流式响应）
   * @param data 聊天请求
   * @param onChunk 接收数据块的回调
   * @param onComplete 完成回调
   * @param onError 错误回调
   */
  chatByWebSocket(
    data: AIChatRequest,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: any) => void
  ) {
    // 检查 WebSocket 连接状态
    if (!wsClient.isConnected()) {
      console.warn('[AI Chat] WebSocket 未连接，降级为 HTTP 请求')
      // 降级为 HTTP 请求
      this.chatStream(data, onChunk, onError, onComplete)
      return
    }

    console.log('[AI Chat] 使用 WebSocket 发送消息:', data.message)

    // 发送 AI 聊天消息
    wsClient.send({
      type: 'ai_chat',
      data: {
        userId: data.userId,
        message: data.message,
        sessionId: data.sessionId
      }
    })

    // 监听响应（需要在 ai-chat.vue 中设置监听器）
    // 这里只发送消息，实际的消息处理在 ai-chat.vue 中完成
  }
}

export default aiApi
