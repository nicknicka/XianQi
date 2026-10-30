<template>
  <view class="ai-chat-page" :style="themeStyle">
    <!-- 顶部导航 -->
    <ChatHeader
      theme="ai"
      :show-back="true"
      @back="goBack"
    >
      <template #center>
        <view class="ai-info">
          <view class="ai-avatar">🤖</view>
          <view class="ai-text">
            <text class="name">AI 助手</text>
            <text class="status">在线</text>
          </view>
        </view>
      </template>
      <template #right>
        <view class="clear-btn" @click="clearChat">
          <uni-icons type="trash" size="20" color="#fff" />
        </view>
      </template>
    </ChatHeader>

    <!-- 消息列表 -->
    <scroll-view
      class="message-scroll"
      scroll-y
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="true"
    >
      <view v-if="messages.length === 0" class="empty-state">
        <view class="empty-icon">🤖</view>
        <text class="empty-text">我是您的 AI 助手</text>
        <text class="empty-hint">有什么可以帮助您的吗？</text>
      </view>

      <view v-else class="message-list">
        <view
          v-for="(message, index) in messages"
          :key="message.id"
          :id="'msg-' + index"
          class="message-item"
          :class="message.role === 'user' ? 'self' : 'other'"
          :style="{ animationDelay: message.isNew ? index * 50 + 'ms' : '0ms' }"
        >
          <!-- 时间戳 -->
          <view v-if="message.showTime" class="time-divider">
            <text class="time-text">{{ formatMessageTime(message.timestamp) }}</text>
          </view>

          <!-- 消息内容 -->
          <view class="message-content">
            <!-- AI 头像 -->
            <view
              v-if="message.role === 'assistant'"
              class="avatar ai-avatar-small"
            >🤖</view>

            <!-- 消息气泡 -->
            <view class="bubble ai-bubble">
              <!-- AI 消息使用 Markdown 渲染 -->
              <MarkdownRender
                v-if="message.role === 'assistant'"
                :content="message.content"
                :options="{ breaks: true, gfm: true, sanitize: true }"
              />

              <!-- 用户消息保持纯文本 -->
              <text v-else class="text-message">{{ message.content }}</text>

              <!-- 打字效果 -->
              <view v-if="message.isTyping" class="typing-indicator">
                <view class="typing-dot"></view>
                <view class="typing-dot"></view>
                <view class="typing-dot"></view>
              </view>
            </view>

            <!-- 我的头像 -->
            <UserAvatar
              v-if="message.role === 'user'"
              class="avatar"
              :src="currentUser.avatar"
              :width="72"
              :height="72"
            />
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="isLoading" class="loading-more">
          <view class="loading-spinner">
            <view class="spinner-ring"></view>
            <view class="spinner-ring"></view>
            <view class="spinner-ring"></view>
          </view>
          <view class="loading-text-container">
            <text class="loading-text">{{ loadingText }}</text>
            <view class="loading-dots">
              <view class="dot"></view>
              <view class="dot"></view>
              <view class="dot"></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 快捷问题栏（始终显示） -->
    <view class="quick-questions-bar">
      <scroll-view class="quick-scroll" scroll-x :show-scrollbar="false">
        <view class="quick-items">
          <view
            v-for="(question, index) in quickQuestions"
            :key="index"
            class="quick-chip"
            @click="sendQuickQuestion(question)"
          >
            <uni-icons type="help-filled" size="14" :color="primaryColor" />
            <text class="quick-chip-text">{{ question }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 输入区域 -->
    <view class="input-area" :class="{ 'input-focused': inputFocused }">
      <view class="input-bar">
        <textarea
          class="message-input"
          v-model="inputText"
          placeholder="有问题尽管问我..."
          placeholder-style="color: var(--text-color-tertiary)"
          :auto-height="true"
          :maxlength="500"
          @focus="inputFocused = true"
          @blur="inputFocused = false"
        />
        <view
          class="send-btn"
          :class="{ disabled: !inputText.trim() || isLoading, active: inputText.trim() && !isLoading }"
          @click="sendMessage"
        >
          <uni-icons type="paperplane" size="20" :color="inputText.trim() && !isLoading ? '#fff' : '#999'" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { getRelativeTime } from '@/utils/date'
import { checkAuth } from '@/utils/auth'
import { useThemeStyle, useThemeColors } from '@/utils/theme'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import MarkdownRender from '@/components/markdown-render/markdown-render.vue'
import { useUserStore } from '@/store/user'
import { aiApi } from '@/api/ai'
import { wsClient } from '@/utils/websocket'
import { resolveWebSocketUrl } from '@/utils/websocket-url'
import type { AIChatMessage } from '@/api/ai'
import { normalizeId } from '@/utils/id'

const { themeStyle } = useThemeStyle()
const { primaryColor, successColor } = useThemeColors()

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  showTime?: boolean
  isNew?: boolean
  isTyping?: boolean
}

// 获取用户信息
const userStore = useUserStore()
const currentUser = computed(() => ({
  id: normalizeId(userStore.userInfo?.userId || userStore.userInfo?.id),
  name: userStore.nickname || '我',
  avatar: userStore.avatar || '/static/images/user.png'
}))

const messages = ref<AIMessage[]>([])
const inputText = ref('')
const scrollIntoView = ref('')
const inputFocused = ref(false)
const isLoading = ref(false)
const loadingText = ref('AI 正在思考')
let loadingTextTimer: number | null = null
const isGenerating = ref(false) // 标记是否已经开始生成内容
const wsUnsubscribers: Array<() => void> = []

const quickQuestions = ref([
  '如何发布商品？',
  '如何联系卖家？',
  '交易安全吗？',
  '如何举报违规？',
  '可以共享物品吗？'
])

onMounted(() => {
  // 检查登录状态
  if (!checkAuth({
    showTip: true,
    tipText: '请先登录后使用AI助手',
    showAuthGuide: true,
    guideTitle: '登录后可使用AI助手',
    guideContent: 'AI助手会结合你的账号信息提供服务，请先登录或注册账号。'
  })) {
    return
  }

  loadChatHistory()
  setupWebSocket()
})

// 设置 WebSocket 连接和消息监听
function setupWebSocket() {
  const wsUrl = resolveWebSocketUrl()

  // 监听消息
  wsUnsubscribers.push(wsClient.on('message', handleWebSocketMessage))

  // 监听连接状态
  wsUnsubscribers.push(wsClient.on('open', () => {
    console.log('[AI Chat] WebSocket 已连接')
  }))

  wsUnsubscribers.push(wsClient.on('error', (error) => {
    console.error('[AI Chat] WebSocket 错误:', error)
  }))

  wsUnsubscribers.push(wsClient.on('close', () => {
    console.log('[AI Chat] WebSocket 已断开')
  }))

  // 连接 WebSocket；连接客户端会复用已有连接。
  wsClient.connect(wsUrl)
}

// 处理 WebSocket 消息
function handleWebSocketMessage(data: any) {
  console.log('[AI Chat] 收到 WebSocket 消息:', data)

  switch (data.type) {
    case 'pong':
      // 心跳检测响应，保持连接活跃
      console.log('[AI Chat] 收到心跳响应')
      break

    case 'ai_chunk':
      // AI 响应数据块
      if (data.data && data.data.content) {
        // 第一次收到内容时，切换为"正在生成中"并停止轮换
        if (!isGenerating.value) {
          isGenerating.value = true
          loadingText.value = '正在生成中'
          // 停止文字轮换，保持"正在生成中"
          if (loadingTextTimer) {
            clearInterval(loadingTextTimer)
            loadingTextTimer = null
          }
        }

        const chunk = data.data.content
        // 追加到最后一条 AI 消息
        const lastMessage = messages.value[messages.value.length - 1]
        if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.isTyping) {
          lastMessage.content += chunk
          scrollToBottom()
        }
      }
      break

    case 'ai_complete': {
      // AI 响应完成
      console.log('[AI Chat] AI 响应完成:', data.data)
      isLoading.value = false
      isGenerating.value = false
      stopLoadingAnimation()
      saveChatHistory()

      // 检查是否有技术错误
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        const hasTechnicalError = lastMessage.content.includes('Exception') ||
          lastMessage.content.includes('NullPointerException') ||
          lastMessage.content.includes('SQLException')

        if (hasTechnicalError) {
          lastMessage.content = '抱歉，AI助手遇到了一些问题，请稍后再试。'
          saveChatHistory()
        }
      }
      break
    }

    case 'error': {
      // 错误消息
      console.error('[AI Chat] 收到错误消息:', data.data)
      isLoading.value = false
      isGenerating.value = false
      stopLoadingAnimation()

      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.data?.message || '抱歉，AI助手暂时无法回复，请稍后再试。',
        timestamp: new Date().toISOString(),
        showTime: shouldShowTime(),
        isNew: true
      }
      messages.value.push(errorMessage)
      saveChatHistory()
      scrollToBottom()

      uni.showToast({
        title: 'AI 请求失败',
        icon: 'none',
        duration: 2000
      })
      break
    }

    case 'connected':
      // 连接成功确认
      console.log('[AI Chat] WebSocket 连接确认:', data.data)
      break

    default:
      console.log('[AI Chat] 未处理的消息类型:', data.type)
  }
}

async function loadChatHistory() {
  try {
    // 从服务器加载聊天历史
    const res = await aiApi.getHistory(currentUser.value.id, 20)

    if (res.data && res.data.length > 0) {
      // 转换服务器格式为前端格式
      // 后端每条记录包含一对消息（用户消息 + AI回复），需要拆分为两条消息
      const convertedMessages: AIMessage[] = []

      res.data.forEach((msg: any) => {
        // 添加用户消息
        convertedMessages.push({
          id: msg.id.toString(),
          role: 'user' as const,
          content: msg.userMessage,
          timestamp: msg.createdAt,
          showTime: false
        })

        // 添加 AI 回复
        convertedMessages.push({
          id: msg.id.toString() + '_ai',
          role: 'assistant' as const,
          content: msg.aiResponse,
          timestamp: msg.createdAt,
          showTime: false
        })
      })

      // 按时间戳升序排序（确保消息按时间顺序显示）
      convertedMessages.sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      })

      messages.value = convertedMessages
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
    // 如果服务器加载失败，尝试从本地存储加载
    const history = uni.getStorageSync('ai_chat_history')
    if (history && history.length > 0) {
      messages.value = history
      scrollToBottom()
    }
  }
}

function sendMessage() {
  const content = inputText.value.trim()
  if (!content || isLoading.value) return

  // 添加用户消息
  const userMessage: AIMessage = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
    showTime: shouldShowTime(),
    isNew: true
  }
  messages.value.push(userMessage)

  inputText.value = ''
  saveChatHistory()
  scrollToBottom()

  // 模拟 AI 响应
  getAIResponse(content)
}

function sendQuickQuestion(question: string) {
  inputText.value = question
  sendMessage()
}

async function getAIResponse(question: string) {
  isLoading.value = true
  startLoadingAnimation()

  // 添加一个空的AI消息，内容会通过 WebSocket 逐步填充
  const aiMessage: AIMessage = {
    id: Date.now().toString(),
    role: 'assistant',
    content: '',
    timestamp: new Date().toISOString(),
    showTime: shouldShowTime(),
    isNew: true
  }
  messages.value.push(aiMessage)
  scrollToBottom()

  // 使用 WebSocket 发送消息
  if (wsClient.isConnected()) {
    // 通过 WebSocket 发送
    const wsMessage = {
      type: 'ai_chat',
      data: {
        userId: currentUser.value.id,
        message: question
      }
    }
    if (wsClient.send(wsMessage)) {
      console.log('[AI Chat] 已通过 WebSocket 发送消息:', wsMessage)

      // 设置超时检测，如果 30 秒没有响应，提示用户
      setTimeout(() => {
        if (isLoading.value) {
          console.warn('[AI Chat] AI 响应超时，请检查后端服务')
          uni.showToast({
            title: 'AI 响应超时，请重试',
            icon: 'none',
            duration: 2000
          })
        }
      }, 30000)
    } else {
      isLoading.value = false
      isGenerating.value = false
      stopLoadingAnimation()
      aiMessage.content = '消息发送失败，请重试。'
      saveChatHistory()
      uni.showToast({
        title: '发送失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  } else {
    // WebSocket 未连接，降级为 HTTP 请求
    console.log('[AI Chat] WebSocket 未连接，降级为 HTTP 请求')
    try {
      let fullResponse = ''

      aiApi.chatStream(
        {
          userId: currentUser.value.id,
          message: question
        },
        (chunk: string) => {
          if (chunk.includes('[DONE]') || chunk.includes('event:')) {
            return
          }

          // 第一次收到内容时，切换为"正在生成中"
          if (!isGenerating.value) {
            isGenerating.value = true
            loadingText.value = '正在生成中'
            if (loadingTextTimer) {
              clearInterval(loadingTextTimer)
              loadingTextTimer = null
            }
          }

          fullResponse += chunk
          aiMessage.content = fullResponse
          scrollToBottom()
        },
        (error: any) => {
          isLoading.value = false
          isGenerating.value = false
          stopLoadingAnimation()
          aiMessage.content = '抱歉，AI助手暂时无法回复，请稍后再试。'
          saveChatHistory()
          uni.showToast({
            title: 'AI 请求失败',
            icon: 'none',
            duration: 2000
          })
        },
        () => {
          isLoading.value = false
          isGenerating.value = false
          stopLoadingAnimation()
          if (!fullResponse || fullResponse.trim().length === 0) {
            aiMessage.content = '抱歉，AI助手暂时无法回复，请稍后再试。'
            saveChatHistory()
            return
          }
          saveChatHistory()
        }
      )
    } catch (error: any) {
      isLoading.value = false
      isGenerating.value = false
      stopLoadingAnimation()
      aiMessage.content = '抱歉，AI助手暂时无法回复，请稍后再试。'
      saveChatHistory()
      scrollToBottom()
    }
  }
}

function shouldShowTime(): boolean {
  if (messages.value.length === 0) return true
  const lastMessage = messages.value[messages.value.length - 1]
  const now = Date.now()
  const lastTime = new Date(lastMessage.timestamp).getTime()
  return now - lastTime > 5 * 60 * 1000 // 5分钟
}

function formatMessageTime(time: string) {
  return getRelativeTime(time)
}

function scrollToBottom() {
  nextTick(() => {
    if (messages.value.length > 0) {
      scrollIntoView.value = 'msg-' + (messages.value.length - 1)
    }
  })
}

function saveChatHistory() {
  // 只保存最近50条消息
  const history = messages.value.slice(-50)
  uni.setStorageSync('ai_chat_history', history)
}

async function clearChat() {
  uni.showModal({
    title: '确认清空',
    content: '是否清空与 AI 助手的聊天记录？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 调用服务器 API 清除历史
          await aiApi.clearHistory(currentUser.value.id)

          // 清空本地消息
          messages.value = []
          uni.removeStorageSync('ai_chat_history')

          uni.showToast({
            title: '已清空',
            icon: 'success'
          })
        } catch (error: any) {
          console.error('清除聊天历史失败:', error)
          uni.showToast({
            title: '清除失败：' + (error.message || '未知错误'),
            icon: 'none'
          })
        }
      }
    }
  })
}

function goBack() {
  uni.navigateBack()
}

// 加载动画相关
const loadingTexts = [
  'AI 正在思考',
  'AI 正在分析',
  'AI 正在整理',
  'AI 正在生成'
]

function startLoadingAnimation() {
  // 重置生成状态
  isGenerating.value = false
  loadingText.value = loadingTexts[0]
  let index = 0

  // 清除之前的定时器
  if (loadingTextTimer) {
    clearInterval(loadingTextTimer)
  }

  // 启动新的定时器，延长间隔到 2.5 秒
  loadingTextTimer = setInterval(() => {
    index = (index + 1) % loadingTexts.length
    loadingText.value = loadingTexts[index]
  }, 2500) as unknown as number
}

function stopLoadingAnimation() {
  if (loadingTextTimer) {
    clearInterval(loadingTextTimer)
    loadingTextTimer = null
  }
  loadingText.value = 'AI 正在思考'
}

// 组件卸载时清理 WebSocket 连接
onUnmounted(() => {
  // 清理加载动画定时器
  stopLoadingAnimation()

  // 只移除当前页面的订阅，不关闭全局连接。
  wsUnsubscribers.splice(0).forEach(unsubscribe => unsubscribe())
})
</script>

<style lang="scss" scoped>
.ai-chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
  animation: pageFadeIn 0.4s ease-out;
}

// AI 头部信息样式（用于 ChatHeader center 插槽）
.ai-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;

  .ai-avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
  }

  .ai-text {
    display: flex;
    flex-direction: column;
    align-items: center;

    .name {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: #fff;
    }

    .status {
      font-size: var(--font-size-xs);
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

// 清空按钮样式
.clear-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-scroll {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: var(--font-size-lg);
    font-weight: 500;
    color: var(--text-color-primary);
    margin-bottom: 12rpx;
  }

  .empty-hint {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

.message-list {
  padding: 24rpx;
  width: 100%;
  box-sizing: border-box;

  .message-item {
    margin-bottom: 32rpx;
    width: 100%;
    box-sizing: border-box;
    animation: slideInUp 0.3s ease-out backwards;

    .time-divider {
      text-align: center;
      margin-bottom: 16rpx;

      .time-text {
        font-size: var(--font-size-xs);
        color: var(--text-color-tertiary);
        padding: 8rpx 24rpx;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 20rpx;
      }
    }

    .message-content {
      display: flex;
      align-items: flex-start;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;

      .avatar {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40rpx;
        background: var(--bg-color-card);
      }

      .ai-avatar-small {
        border: 2rpx solid var(--primary-color);
        background: linear-gradient(135deg, #fffbf7 0%, #fff 100%);
      }

      .bubble {
        max-width: 560rpx;
        padding: 20rpx 24rpx;
        border-radius: 16rpx;
        position: relative;
        word-wrap: break-word;
        overflow-wrap: break-word;
        overflow: hidden;
        box-sizing: border-box;

        &.ai-bubble {
          background: linear-gradient(135deg, #fffbf7 0%, #fff 100%);
          border: 1rpx solid var(--primary-color-faded);
          box-shadow: 0 2rpx 12rpx var(--primary-color-faded);

          // Markdown 内容样式
          :deep(.markdown-render) {
            font-size: 14px;
            line-height: 1.7;
          }

          // 用户消息文本样式
          .text-message {
            color: var(--text-color-primary);
            line-height: 1.6;
            white-space: pre-wrap;
          }

          // Markdown 代码块优化
          :deep(.markdown-content .markdown-pre) {
            background-color: #f8f9fa;
            border: 1rpx solid #e9ecef;
            border-radius: 8rpx;
            padding: 16rpx;
            margin: 12rpx 0;
            overflow-x: auto;
          }

          :deep(.markdown-content .markdown-code) {
            background-color: var(--primary-color-faded);
            color: #d63384;
            padding: 2rpx 6rpx;
            border-radius: 4rpx;
            font-size: 13px;
          }

          :deep(.markdown-content .markdown-pre .markdown-code) {
            background-color: transparent;
            color: inherit;
            padding: 0;
          }

          // Markdown 引用优化
          :deep(.markdown-content .markdown-blockquote) {
            border-left-color: var(--primary-color);
            background-color: var(--primary-color-faded);
          }

          // Markdown 链接优化
          :deep(.markdown-content .markdown-link) {
            color: var(--primary-color);
          }

          // Markdown 表格优化
          :deep(.markdown-content .markdown-table) {
            border-radius: 8rpx;
            overflow: hidden;
          }

          :deep(.markdown-content .markdown-table-header) {
            background-color: var(--primary-color-faded);
          }
        }

        .text-message {
          font-size: var(--font-size-base);
          line-height: 1.5;
        }

        .typing-indicator {
          display: flex;
          gap: 8rpx;
          padding: 8rpx 0;

          .typing-dot {
            width: 12rpx;
            height: 12rpx;
            border-radius: 50%;
            background: var(--text-color-tertiary);
            animation: typingBounce 1.4s ease-in-out infinite;

            &:nth-child(1) {
              animation-delay: 0s;
            }

            &:nth-child(2) {
              animation-delay: 0.2s;
            }

            &:nth-child(3) {
              animation-delay: 0.4s;
            }
          }
        }
      }
    }

    // 我的消息 - 消息气泡在左边，我的头像在右边
    &.self {
      .message-content {
        justify-content: flex-end;

        .bubble {
          max-width: calc(100% - 88rpx);
          background: linear-gradient(135deg, var(--success-color) 0%, var(--success-color) 100%);
          box-shadow: 0 4rpx 12rpx var(--success-color-alpha-30);
          margin-right: 16rpx;

          .text-message {
            color: #fff;
          }
        }
      }
    }

    // AI 消息 - AI 头像在左边，消息气泡在右边
    &.other {
      .message-content {
        justify-content: flex-start;

        .bubble {
          max-width: 560rpx;
          margin-left: 16rpx;
        }
      }
    }
  }
}

.quick-questions-bar {
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  padding: 16rpx 24rpx;

  .quick-scroll {
    white-space: nowrap;
  }

  .quick-items {
    display: inline-flex;
    gap: 12rpx;
  }

  .quick-chip {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 20rpx;
    background: linear-gradient(135deg, #fffbf7 0%, #fff 100%);
    border: 1rpx solid var(--primary-color-faded);
    border-radius: 40rpx;
    white-space: nowrap;
    transition: all 0.2s;
    box-shadow: 0 2rpx 8rpx var(--primary-color-faded);

    &:active {
      transform: scale(0.95);
      background: linear-gradient(135deg, #fff5eb 0%, #fffbf7 100%);
    }

    .quick-chip-text {
      font-size: var(--font-size-sm);
      color: var(--text-color-primary);
    }
  }
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 24rpx;

  .loading-spinner {
    position: relative;
    width: 40rpx;
    height: 40rpx;

    .spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3rpx solid transparent;
      animation: spinnerRotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;

      &:nth-child(1) {
        border-top-color: var(--primary-color);
        animation-delay: 0s;
      }

      &:nth-child(2) {
        border-right-color: var(--primary-color-light);
        animation-delay: -0.4s;
      }

      &:nth-child(3) {
        border-bottom-color: var(--primary-color-faded);
        animation-delay: -0.8s;
      }
    }
  }

  .loading-text-container {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .loading-text {
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
      animation: textPulse 2s ease-in-out infinite;
    }

    .loading-dots {
      display: flex;
      gap: 6rpx;
      align-items: center;

      .dot {
        width: 6rpx;
        height: 6rpx;
        border-radius: 50%;
        background: var(--text-color-tertiary);
        animation: dotBounce 1.4s ease-in-out infinite;

        &:nth-child(1) {
          animation-delay: 0s;
        }

        &:nth-child(2) {
          animation-delay: 0.2s;
        }

        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }
  }
}

.input-area {
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));

  .input-bar {
    display: flex;
    align-items: flex-end;
    gap: 16rpx;

    .message-input {
      flex: 1;
      min-height: 64rpx;
      max-height: 200rpx;
      padding: 16rpx 24rpx;
      background: var(--bg-color-page);
      border-radius: 32rpx;
      font-size: var(--font-size-base);
      line-height: 1.5;
    }

    .send-btn {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-page);
      border-radius: 50%;
      flex-shrink: 0;
      transition: all 0.3s ease;

      &.disabled {
        opacity: 0.5;
      }

      &.active {
        background: linear-gradient(135deg, var(--success-color) 0%, var(--success-color) 100%);
        box-shadow: 0 4rpx 12rpx var(--success-color-alpha-30);
        transform: scale(1.05);

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }

  &.input-focused {
    .input-bar {
      .message-input {
        background: var(--bg-color-hover);
      }
    }
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8rpx);
    opacity: 1;
  }
}

@keyframes spinnerRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes dotBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6rpx);
    opacity: 1;
  }
}
</style>
