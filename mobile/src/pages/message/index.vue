<template>
  <view class="message-page" :style="themeStyle">
    <view class="tab-bar page-animate" :class="{ 'animate-in': isAnimated }">
      <view
        v-for="(tab, index) in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTabIndex === index }"
        @click="switchTab(index)"
      >
        {{ tab.label }}
        <text v-if="tab.count > 0" class="tab-badge">{{ tab.count > 99 ? '99+' : tab.count }}</text>
        <view v-if="currentTabIndex === index" class="tab-indicator"></view>
      </view>
    </view>

    <!-- Swiper 容器 -->
    <swiper
      class="content-swiper"
      :current="currentTabIndex"
      :duration="300"
      @change="onSwiperChange"
      @transition="onSwiperTransition"
    >
      <!-- 聊天页面 -->
      <swiper-item>
        <scroll-view class="content-scroll" scroll-y>
          <!-- 会话列表 -->
          <view class="conversation-list">
            <!-- AI 助手入口 -->
            <view class="ai-assistant-item" @click="goAIChat">
              <view class="avatar-wrapper">
                <view class="avatar ai-avatar">🤖</view>
                <view class="ai-badge">
                  <uni-icons type="robot" size="12" color="#fff" />
                </view>
              </view>
              <view class="conversation-info">
                <view class="conversation-header">
                  <text class="name ai-name">AI 助手</text>
                  <uni-icons type="right" size="14" color="#AAAAAA" />
                </view>
                <text class="last-message ai-tip">智能问答，随时为您服务</text>
              </view>
            </view>

            <!-- 会话列表 -->
            <view
              v-for="(conversation, index) in sortedConversations"
              :key="conversation.conversationId"
              class="conversation-item"
              :class="{ pinned: conversation.isTop === 1 }"
              :style="{ animationDelay: index * 40 + 'ms' }"
              @click="goChat(conversation.conversationId)"
              @longpress="showConversationMenu(conversation)"
            >
              <view v-if="conversation.isTop === 1" class="pinned-icon">
                <uni-icons type="pin" size="14" :color="primaryColor" />
              </view>
              <view
                class="avatar-wrapper"
                @click.stop="goUserProfile(conversation.otherUserId)"
              >
                <UserAvatar
                  class="avatar"
                  :src="conversation.otherUserAvatar"
                  size="md"
                  :clickable="false"
                />
                <view v-if="conversation.unreadCount && conversation.unreadCount > 0" class="unread-badge">
                  {{ conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount }}
                </view>
              </view>
              <view class="conversation-info">
                <view class="conversation-header">
                  <text class="name">{{ conversation.otherUserNickname }}</text>
                  <text class="time">{{ formatRelativeTime(conversation.lastMessageTime || '') }}</text>
                </view>
                
                <text class="last-message text-ellipsis">{{ formatLastMessageContent(conversation) }}</text>
                <!-- <text class="last-message text-ellipsis">{{ conversation }}</text> -->
              </view>
            </view>

            <view v-if="conversations.length === 0" class="empty-state">
              <uni-icons type="chatbubble" size="120" color="#ccc" />
              <text class="empty-text">暂无会话</text>
            </view>
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 通知页面 -->
      <swiper-item>
        <view class="notice-container">
          <!-- 通知分类 Tab -->
          <view class="notice-tab-bar">
            <view
              v-for="tab in noticeTabs"
              :key="tab.value"
              class="notice-tab-item"
              :class="{ active: currentNoticeTab === tab.value }"
              @click="switchNoticeTab(tab.value)"
            >
              {{ tab.label }}
              <view v-if="currentNoticeTab === tab.value" class="notice-tab-indicator"></view>
            </view>
          </view>

          <!-- 操作栏 -->
          <view class="notice-action-bar">
            <view class="action-btn" @click="markAllRead">
              <uni-icons type="checkmarkempty" size="14" color="#7A7A7A" />
              <text>全部已读</text>
            </view>
            <view class="action-btn" @click="clearAllNotices">
              <uni-icons type="trash" size="14" color="#7A7A7A" />
              <text>清空</text>
            </view>
          </view>

          <scroll-view
            class="content-scroll"
            scroll-y
          >
            <!-- 通知列表 -->
            <view class="notice-list">
              <NoticeItem
                v-for="(notice, index) in notices"
                :key="notice.id"
                :id="notice.id"
                :type="notice.type as any"
                :title="notice.title"
                :content="notice.summary"
                :createdAt="notice.createdAt"
                :isRead="notice.isRead"
                :style="{ animationDelay: index * 40 + 'ms' }"
                @click="handleNoticeItemClick"
              />

              <view v-if="notices.length === 0" class="empty-state">
                <uni-icons type="notification" size="120" color="#ccc" />
                <text class="empty-text">暂无通知</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </swiper-item>
    </swiper>

	<CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, getCurrentInstance, onUnmounted, nextTick } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useThemePage, useThemeStyle, useThemeColors } from '@/utils/theme'
import { getRelativeTime } from '@/utils/date'
import { checkAuth } from '@/utils/auth'
import { messageApi, type Conversation } from '@/api/message'
import { notificationApi, NotificationType } from '@/api/notification'
import { useAppStore } from '@/store/app'
import { updateMessageBadge } from '@/utils/tabbar'
import { messageEventBus, MessageEvents } from '@/utils/message-bus'
import { messageService } from '@/services/message.service'
import NoticeItem from '@/components/notice-item/notice-item.vue'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import { getScreenWidth } from '@/utils/system-info'
import CustomTabBar from '@/custom-tab-bar/index.vue'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

interface Notice {
  id: string
  type: string
  title: string
  summary: string
  content: string
  createdAt: string
  isRead: boolean
  linkType?: number
  linkUrl?: string
  linkProductId?: string
  linkOrderId?: string
}

const tabs = ref([
  { label: '聊天', value: 'chat', count: 0 },
  { label: '通知', value: 'notice', count: 0 }
])

// 通知分类 Tab
const noticeTabs = ref([
  { label: '全部', value: 'all' },
  { label: '系统', value: 'system' },
  { label: '交易', value: 'trade' },
  { label: '活动', value: 'activity' }
])
const currentNoticeTab = ref('all')

const appStore = useAppStore()
const currentTab = ref('chat')
const conversations = ref<Conversation[]>([])
const notices = ref<Notice[]>([])
const selectedConversation = ref<Conversation | null>(null)
const showActionSheet = ref(false)
const handledChatParams = ref(false) // 标记是否已处理过聊天参数

// Swiper 相关
const currentTabIndex = ref(0) // 当前显示的 tab 索引（0=聊天, 1=通知）
const isAnimated = ref(false) // 页面进入动画状态
const swiperOffset = ref(0) // Swiper 的实时偏移量（px）
const screenWidth = ref(375) // 屏幕宽度
const indicatorBaseIndex = ref(0) // 指示器的基准位置（滑动开始时的 tab 索引）

function ensureMessageAuth() {
  return checkAuth({
    showTip: true,
    tipText: '请先登录后查看消息',
    showAuthGuide: true,
    guideTitle: '登录后可查看消息',
    guideContent: '消息会话和系统通知需要登录后使用。'
  })
}

// 获取屏幕宽度
onMounted(() => {
  // 检查登录状态
  if (!ensureMessageAuth()) {
    return
  }

  // 获取屏幕宽度（使用新的 API，避免弃用警告）
  screenWidth.value = getScreenWidth()

  loadData()

  // 预加载通知未读数（避免切换到通知 tab 时才显示未读数）
  preloadNoticeUnreadCount()

  // 监听新消息事件
  setupMessageListeners()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

// 预加载通知未读数
async function preloadNoticeUnreadCount() {
  try {
    const unreadRes: any = await notificationApi.getUnreadCount()
    tabs.value[1].count = unreadRes.data || 0
    appStore.setUnreadNoticeCount(tabs.value[1].count)
    updateTabBarBadge()
  } catch (error) {
    console.error('预加载通知未读数失败:', error)
  }
}

// 设置消息监听
function setupMessageListeners() {
  // 监听新消息
  messageEventBus.on(MessageEvents.NEW_MESSAGE, (data: any) => {
    console.log('[MessageIndex] 收到新消息:', data)

    // 刷新会话列表（如果当前在聊天 Tab）
    if (currentTabIndex.value === 0) {
      loadConversations()
    }
  })

  // 监听未读数更新
  messageEventBus.on(MessageEvents.UNREAD_COUNT_UPDATE, (data: any) => {
    console.log('[MessageIndex] 未读数更新:', data)
    tabs.value[0].count = appStore.unreadMessageCount
    tabs.value[1].count = appStore.unreadNoticeCount
    updateTabBarBadge()
    if (data?.refreshNoticeList && currentTabIndex.value === 1) {
      loadNotices()
    }
  })

  // 监听消息已读
  messageEventBus.on(MessageEvents.MESSAGE_READ, (data: any) => {
    console.log('[MessageIndex] 消息已读:', data)
    // 刷新会话列表
    if (currentTabIndex.value === 0) {
      loadConversations()
    }
  })
}

// 清理消息监听
onUnmounted(() => {
  messageEventBus.clearEvent(MessageEvents.NEW_MESSAGE)
  messageEventBus.clearEvent(MessageEvents.UNREAD_COUNT_UPDATE)
  messageEventBus.clearEvent(MessageEvents.MESSAGE_READ)
})

// 页面显示时刷新数据
onShow(async () => {
  useThemePage()

  if (!ensureMessageAuth()) {
    return
  }

  // 检查是否需要切换到通知 Tab
  const app = getApp() as any
  if (app?.globalData?.switchToNoticeTab) {
    // 清除标志
    app.globalData.switchToNoticeTab = false
    // 切换到通知 Tab（使用 nextTick 确保 DOM 更新后再切换）
    setTimeout(() => {
      switchTab(1)
    }, 100)
  } else {
    // 检查是否需要刷新会话列表（从聊天页面返回时）
    const needRefresh = app?.globalData?.needRefreshConversationList

    if (currentTabIndex.value === 0) {
      // 如果当前在聊天 tab，刷新会话列表
      if (needRefresh) {
        await loadConversations()
        if (app?.globalData) {
          app.globalData.needRefreshConversationList = false
        }
      }
    } else {
      // 如果当前在通知 tab，刷新通知列表
      await loadNotices()
      if (app?.globalData) {
        app.globalData.needRefreshConversationList = false
      }
    }

    // 处理从外部跳转过来的聊天参数
    handleChatParams()
    // 更新 TabBar 徽章
    updateTabBarBadge()
  }
})

// 处理外部跳转的聊天参数
async function handleChatParams() {
  // 如果已经处理过，直接返回
  if (handledChatParams.value) return

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const { userId, productId, shareItemId, shareId } = currentPage.options || {}

  if (userId) {
    // 标记已处理
    handledChatParams.value = true

    try {
      // 确保在聊天 tab
      if (currentTabIndex.value !== 0) {
        switchTab(0)
      }

      // 查找或创建会话
      const targetId = userId
      const pid = productId || undefined
      const sid = shareItemId || shareId || undefined

      // 先查找是否已有会话
      const findRes = await messageApi.findConversationByUserAndProduct(targetId, pid, sid)

      if (findRes.data?.conversationId) {
        // 已有会话，直接打开
        const existingConversationId = findRes.data.conversationId
        setTimeout(() => {
          goChat(existingConversationId)
        }, 300)
      } else {
        // 没有会话，创建新会话
        const createRes = await messageApi.createOrUpdateConversation(targetId, pid, undefined, sid)
        if (createRes.data?.conversationId) {
          setTimeout(() => {
            goChat(createRes.data.conversationId)
          }, 300)
        }
      }
    } catch (error) {
      console.error('打开会话失败:', error)
    }
  }
}

// 排序后的会话列表（置顶的在前面）
// 注意：后端已经进行了排序，前端直接使用即可
const sortedConversations = computed(() => {
  return conversations.value
})

async function loadData() {
  // 使用 currentTabIndex 而不是 currentTab 来确保数据正确加载
  if (currentTabIndex.value === 0) {
    await loadConversations()
  } else {
    await loadNotices()
  }
}

async function loadConversations() {
  try {
    const res = await messageApi.getConversationList()
    const list = res.data?.list || []
    conversations.value = list
    // 更新未读数
    const unreadCount = list.reduce((sum: number, c: Conversation) => sum + (c.unreadCount || 0), 0)
    tabs.value[0].count = unreadCount

    // 同步未读数到全局 store 和 TabBar
    appStore.setUnreadMessageCount(unreadCount)
    updateTabBarBadge()
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

async function loadNotices() {
  try {
    // 根据当前分类映射到通知类型
    console.log('[loadNotices] 当前通知分类:', currentNoticeTab.value)

    // 构建请求参数，只在有值时才添加 type
    const params: any = {
      page: 1,
      size: 50
    }

    switch (currentNoticeTab.value) {
      case 'system':
        params.type = NotificationType.SYSTEM
        break
      case 'trade':
        params.type = NotificationType.TRADE
        break
      case 'activity':
        params.type = NotificationType.ACTIVITY
        break
      case 'all':
      default:
        // 不添加 type 参数，获取全部
        break
    }
    console.log('[loadNotices] 请求参数:', params)

    const res: any = await notificationApi.getNotificationList(params)
    console.log('[loadNotices] API 返回:', res.data?.records?.length, '条通知')

    // 转换后端数据格式到前端格式
    const notificationList = res.data?.records || []
    notices.value = notificationList.map((item: any) => ({
      id: item.notificationId,
      type: mapNotificationType(item.type),
      title: item.title,
      summary: item.content?.substring(0, 50) || item.content,
      content: item.content,
      createdAt: item.publishTime,
      isRead: item.isRead,
      linkType: item.linkType,
      linkUrl: item.linkUrl,
      linkProductId: item.linkProductId,
      linkOrderId: item.linkOrderId
    }))
    console.log('[loadNotices] 更新后 notices 数量:', notices.value.length)

    // 获取未读通知数量
    const unreadRes: any = await notificationApi.getUnreadCount()
    tabs.value[1].count = unreadRes.data || 0

    // 同步通知未读数到全局 store 和 TabBar
    appStore.setUnreadNoticeCount(tabs.value[1].count)
    updateTabBarBadge()
  } catch (error) {
    console.error('[loadNotices] 加载通知列表失败:', error)
    // 如果 API 调用失败，可以显示空状态或使用 mock 数据作为降级方案
    notices.value = []
    tabs.value[1].count = 0
    appStore.setUnreadNoticeCount(0)
    updateTabBarBadge()
  }
}

// 映射后端通知类型到前端类型
function mapNotificationType(type: NotificationType): string {
  switch (type) {
    case NotificationType.SYSTEM:
      return 'system'
    case NotificationType.TRADE:
      return 'trade'
    case NotificationType.ACTIVITY:
      return 'activity'
    case NotificationType.ACCOUNT:
      return 'account'
    default:
      return 'system'
  }
}

async function switchTab(index: number) {
  if (currentTabIndex.value === index) return
  currentTabIndex.value = index
  currentTab.value = tabs.value[index].value
  indicatorBaseIndex.value = index
  swiperOffset.value = 0
  await loadData()
}

// Swiper 变化事件（滑动切换结束时触发）
async function onSwiperChange(e: any) {
  const index = e.detail.current
  currentTabIndex.value = index
  indicatorBaseIndex.value = index // 更新基准位置
  currentTab.value = tabs.value[index].value
  swiperOffset.value = 0 // 重置偏移量
  await loadData()
}

// Swiper 动画过程中（实时更新偏移量）
function onSwiperTransition(e: any) {
  const dx = e.detail.dx

  // 计算偏移比例（0-1之间）
  const offsetRatio = Math.abs(dx) / screenWidth.value

  // 边界检测：如果偏移量超过屏幕宽度，说明到了边界，不应该移动指示器
  if (offsetRatio > 1) {
    swiperOffset.value = 0
    return
  }

  // 当开始滑动时（偏移量从 0 变为非 0），锁定基准位置
  if (dx !== 0 && swiperOffset.value === 0) {
    indicatorBaseIndex.value = currentTabIndex.value
  }

  // 限制偏移范围：只能在两个 tab 之间滑动
  // 从第一个 tab 向右滑，dx 为正，最大移动到第二个 tab
  // 从第二个 tab 向左滑，dx 为负，最大移动到第一个 tab
  const maxOffset = screenWidth.value // 最大偏移量为一个屏幕宽度
  const clampedDx = Math.max(-maxOffset, Math.min(maxOffset, dx))

  swiperOffset.value = clampedDx
}

// 原生下拉刷新
onPullDownRefresh(async () => {
  if (!ensureMessageAuth()) {
    uni.stopPullDownRefresh()
    return
  }

  try {
    // 先淡出动画
    isAnimated.value = false

    // 等待淡出动画完成
    await new Promise(resolve => setTimeout(resolve, 200))

    // 加载数据
    await loadData()

    // 停止下拉刷新
    uni.stopPullDownRefresh()

    // 延迟一下再淡入，让用户感觉到重新加载
    setTimeout(() => {
      isAnimated.value = true
    }, 100)

    // 显示刷新成功提示
    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500
    })
  } catch (error) {
    // 即使出错也要停止刷新
    uni.stopPullDownRefresh()

    // 恢复动画状态
    setTimeout(() => {
      isAnimated.value = true
    }, 100)

    uni.showToast({
      title: '刷新失败',
      icon: 'none',
      duration: 1500
    })
  }
})

function goChat(id: string) {
  // 创建点击波纹效果
  uni.navigateTo({
    url: `/pages/message/chat?conversationId=${id}`,
    animationType: 'slide-in-right',
    animationDuration: 300
  })
}

function goAIChat() {
  uni.navigateTo({
    url: '/pages/message/ai-chat'
  })
}

function goUserProfile(userId?: string) {
  if (!userId) return

  uni.navigateTo({
    url: `/pages/user/home?id=${userId}`,
    animationType: 'slide-in-right',
    animationDuration: 300
  })
}

function showConversationMenu(conversation: Conversation) {
  selectedConversation.value = conversation
  const items = conversation.isTop === 1 ? ['取消置顶', '删除会话'] : ['置顶聊天', '删除会话']

  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      if (res.tapIndex === 0) {
        if (conversation.isTop === 1) {
          unpinConversation(conversation.conversationId)
        } else {
          pinConversation(conversation.conversationId)
        }
      } else if (res.tapIndex === 1) {
        deleteConversation(conversation.conversationId)
      }
    }
  })
}

function pinConversation(id: string) {
  messageApi.pinConversation(id).then(async () => {
    // 先更新本地状态，确保 UI 立即响应
    const conversation = conversations.value.find(c => c.conversationId === id)
    if (conversation) {
      conversation.isTop = 1
    }
    // 重新加载会话列表以获取正确的排序
    await loadConversations()
    uni.showToast({ title: '已置顶', icon: 'success' })
  }).catch(() => {
    uni.showToast({ title: '置顶失败', icon: 'none' })
  })
}

function unpinConversation(id: string) {
  messageApi.unpinConversation(id).then(async () => {
    // 先更新本地状态，确保 UI 立即响应
    const conversation = conversations.value.find(c => c.conversationId === id)
    if (conversation) {
      conversation.isTop = 0
    }
    // 重新加载会话列表以获取正确的排序
    await loadConversations()
    uni.showToast({ title: '已取消置顶', icon: 'success' })
  }).catch(() => {
    uni.showToast({ title: '取消置顶失败', icon: 'none' })
  })
}

function deleteConversation(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '删除后将清空该会话的聊天记录，是否确认删除？',
    success: (res) => {
      if (res.confirm) {
        messageApi.deleteConversation(id).then(() => {
          conversations.value = conversations.value.filter(c => c.conversationId !== id)
          uni.showToast({ title: '已删除', icon: 'success' })
        }).catch(() => {
          uni.showToast({ title: '删除失败', icon: 'none' })
        })
      }
    }
  })
}

async function goNoticeDetail(notice: Notice) {
  // 标记为已读（先更新本地状态，提升响应速度）
  if (!notice.isRead) {
    // 调用后端 API 标记已读（异步执行，不阻塞跳转）
    notificationApi.markAsRead(notice.id).catch(err => {
      console.error('[goNoticeDetail] 标记已读失败:', err)
    })

    // 立即更新本地状态
    notice.isRead = true
    tabs.value[1].count = Math.max(0, tabs.value[1].count - 1)
    appStore.setUnreadNoticeCount(tabs.value[1].count)
    updateTabBarBadge()
  }

  // 处理跳转逻辑
  if (notice.linkProductId) {
    // 跳转到商品详情
    uni.navigateTo({
      url: `/pages/market/detail?id=${notice.linkProductId}`
    })
  } else if (notice.linkOrderId) {
    // 跳转到订单详情
    uni.navigateTo({
      url: `/pages/order/detail?id=${notice.linkOrderId}`
    })
  } else if (notice.linkUrl) {
    // 跳转到指定 URL
    const linkUrl = notice.linkUrl
    if (linkUrl.startsWith('/pages/')) {
      // 内部页面跳转
      uni.navigateTo({
        url: linkUrl,
        fail: () => {
          // 如果 navigateTo 失败，尝试 switchTab
          uni.switchTab({
            url: linkUrl,
            fail: () => {
              uni.showToast({ title: '页面跳转失败', icon: 'none' })
            }
          })
        }
      })
    } else {
      // 外部链接，使用 webview
      uni.navigateTo({
        url: `/pages/common/webview?url=${encodeURIComponent(linkUrl)}`
      })
    }
  } else {
    // 没有跳转链接，显示弹窗
    uni.showModal({
      title: notice.title,
      content: notice.content,
      showCancel: false,
      confirmText: '确定'
    })
  }
}

async function switchNoticeTab(value: string) {
  if (currentNoticeTab.value === value) return
  console.log('[switchNoticeTab] 切换通知类型:', value, '当前:', currentNoticeTab.value)

  // 先更新 tab 值
  currentNoticeTab.value = value
  console.log('[switchNoticeTab] 更新后 currentNoticeTab:', currentNoticeTab.value)

  // 使用 nextTick 确保 Vue 响应式更新完成后再加载数据
  await nextTick()

  console.log('[switchNoticeTab] 准备加载数据, currentNoticeTab:', currentNoticeTab.value)
  await loadNotices()
}

// 处理通知项点击事件
function handleNoticeItemClick(data: any) {
  // 在列表中查找对应的通知
  const notice = notices.value.find(n => n.id === data.id)
  if (notice) {
    goNoticeDetail(notice)
  }
}

async function markAllRead() {
  if (notices.value.length === 0) {
    uni.showToast({ title: '暂无通知', icon: 'none' })
    return
  }
  const unreadCount = notices.value.filter(n => !n.isRead).length
  if (unreadCount === 0) {
    uni.showToast({ title: '暂无未读通知', icon: 'none' })
    return
  }

  try {
    // 调用 API 标记所有通知为已读
    await notificationApi.markAllAsRead()

    // 更新本地状态
    notices.value.forEach(notice => {
      notice.isRead = true
    })
    tabs.value[1].count = 0
    appStore.setUnreadNoticeCount(0)
    updateTabBarBadge()

    uni.showToast({ title: '已全部标记为已读', icon: 'success' })
  } catch (error) {
    console.error('标记全部已读失败:', error)
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
  }
}

async function clearAllNotices() {
  if (notices.value.length === 0) {
    uni.showToast({ title: '暂无通知', icon: 'none' })
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要清空所有通知吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 调用后端 API 清空所有通知
          await notificationApi.clearAll()

          // 更新本地状态
          notices.value = []
          tabs.value[1].count = 0
          appStore.setUnreadNoticeCount(0)
          updateTabBarBadge()

          uni.showToast({ title: '已清空所有通知', icon: 'success' })
        } catch (error) {
          console.error('清空通知失败:', error)
          uni.showToast({ title: '清空失败，请重试', icon: 'none' })
        }
      }
    }
  })
}

// 格式化相对时间（用于聊天列表）
function formatRelativeTime(time: string) {
  return getRelativeTime(time)
}

// 格式化最后一条消息内容（处理非文本消息）
function formatLastMessageContent(conversation: Conversation) {
  const { lastMessageContent, lastMessageType } = conversation

  // 如果没有消息内容，返回默认提示
  if (!lastMessageContent) {
    return '暂无消息'
  }

  // 如果后端已经返回了友好显示内容（如 "[图片]"、"[商品]"），直接返回
  if (lastMessageContent.startsWith('[') && lastMessageContent.endsWith(']')) {
    return lastMessageContent
  }

  // 类型守卫：确保 lastMessageType 是字符串类型
  const messageType = typeof lastMessageType === 'string' ? lastMessageType : undefined

  // 根据消息类型返回对应提示
  switch (messageType) {
    case 'image':
      return '【图片】'
    case 'product':
      return '【商品】'
    case 'order':
      return '【订单】'
    case 'voice':
      return '【语音】'
    case 'video':
      return '【视频】'
    case 'file':
      return '【文件】'
    case 'system':
      return '【系统通知】'
    case 'quote':
      return '【引用消息】'
    case 'text':
    default:
      // 对于文本消息，如果内容是URL开头，也显示为链接提示
      if (lastMessageContent.startsWith('http://') || lastMessageContent.startsWith('https://')) {
        return '【链接】'
      }
      // 将换行符替换为空格，避免会话列表中出现多行显示
      return lastMessageContent.replace(/[\r\n]+/g, ' ')
  }
}

// 更新 TabBar 徽章
function updateTabBarBadge() {
  const totalUnread = appStore.getTotalUnreadCount()

  // 使用工具函数更新原生 TabBar 徽章
  updateMessageBadge(totalUnread)

  // 尝试更新自定义 TabBar
  try {
    const instance = getCurrentInstance()
    if (instance?.proxy) {
      const tabBar = (instance.proxy as any).$scope?.getTabBar?.()
      const setBadge = tabBar?.setBadge || tabBar?.$setBadge
      if (typeof setBadge === 'function') {
        setBadge(3, totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : 0)
      }
    }
  } catch (e) {
    // 忽略访问自定义 TabBar 的错误
    console.debug('无法访问自定义 TabBar:', e)
  }
}
</script>

<style lang="scss" scoped>
// 页面进入动画关键帧
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 页面动画样式
.page-animate {
  opacity: 0;
  transform: translateY(30rpx);

  &.animate-in {
    animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}

.message-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
}

.tab-bar {
  display: flex;
  background: var(--bg-color-card);
  border-bottom: 1px solid var(--border-color-base);
  position: relative;
  z-index: 10;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 24rpx 0;
    font-size: var(--font-size-base);
    color: var(--text-color-secondary);
    position: relative;
    transition: all 0.3s ease;

    &.active {
      color: var(--primary-color);
      font-weight: 600;
    }

    .tab-badge {
      position: absolute;
      top: 12rpx;
      right: 30%;
      min-width: 32rpx;
      height: 32rpx;
      line-height: 32rpx;
      padding: 0 8rpx;
      background: var(--danger-color);
      color: var(--bg-color-card);
      font-size: var(--font-size-xs);
      border-radius: 16rpx;
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60rpx;
      height: 4rpx;
      background: var(--primary-color);
      border-radius: 2rpx;
      animation: indicatorSlideIn 0.3s ease-out;
    }
  }
}

.content-swiper {
  flex: 1;
  height: 100%;
}

.content-scroll {
  height: 100%;
}

.conversation-list {
  .ai-assistant-item {
    display: flex;
    padding: 24rpx;
    background: linear-gradient(135deg, #fff5f0 0%, var(--bg-color-card) 100%);
    border-bottom: 1px solid var(--border-color-light);
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(0.98);
      background: linear-gradient(135deg, #ffe8dd 0%, #fff5f0 100%);
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6rpx;
      background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
    }

    .avatar-wrapper {
      position: relative;
      margin-right: 24rpx;

      .avatar {
        width: 96rpx;
        height: 96rpx;
        border-radius: 48rpx;
        border: 2rpx solid var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 56rpx;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
      }

      .ai-badge {
        position: absolute;
        bottom: -4rpx;
        right: -4rpx;
        width: 32rpx;
        height: 32rpx;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2rpx solid var(--bg-color-card);
      }
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;

        .name {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--primary-color);
        }

        .ai-name {
          background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      .last-message {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.ai-tip {
          color: var(--primary-color);
          font-weight: 500;
        }
      }
    }
  }

  .conversation-item {
    display: flex;
    padding: 24rpx;
    background: var(--bg-color-card);
    border-bottom: 1px solid var(--border-color-light);
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.pinned {
      background: linear-gradient(90deg, #fffbf7 0%, var(--bg-color-card) 100%);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 6rpx;
        background: var(--primary-color);
      }
    }

    &:active {
      background-color: var(--bg-color-hover);
      transform: scale(0.98);
    }

    .pinned-icon {
      position: absolute;
      top: 16rpx;
      left: 8rpx;
      z-index: 1;
    }

    .avatar-wrapper {
      position: relative;
      margin-right: 24rpx;
      margin-left: 0;

      .avatar {
        width: 96rpx;
        height: 96rpx;
        border-radius: 48rpx;
      }

      .unread-badge {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
        min-width: 36rpx;
        height: 36rpx;
        line-height: 36rpx;
        padding: 0 8rpx;
        background: var(--danger-color);
        color: var(--bg-color-card);
        font-size: var(--font-size-xs);
        text-align: center;
        border-radius: 18rpx;
        border: 2rpx solid var(--bg-color-card);
      }
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .conversation-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8rpx;

        .name {
          font-size: var(--font-size-base);
          font-weight: 500;
          color: var(--text-color-primary);
        }

        .time {
          font-size: var(--font-size-sm);
          color: var(--text-color-tertiary);
        }
      }

      .last-message {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.notice-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.notice-tab-bar {
  display: flex;
  background: var(--bg-color-card);
  border-bottom: 1px solid var(--border-color-base);
  position: relative;
  z-index: 10;

  .notice-tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    position: relative;
    transition: all 0.3s ease;

    &.active {
      color: var(--primary-color);
      font-weight: 600;
    }

    .notice-tab-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background: var(--primary-color);
      border-radius: 2rpx;
      animation: indicatorSlideIn 0.3s ease-out;
    }
  }
}

.notice-action-bar {
  display: flex;
  justify-content: space-around;
  padding: 16rpx 24rpx;
  background: var(--bg-color-card);
  border-bottom: 1px solid var(--border-color-light);

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 24rpx;
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    background: var(--bg-color-page);
    border-radius: 20rpx;
    transition: all 0.2s ease;

    &:active {
      background: var(--border-color-light);
      transform: scale(0.95);
    }
  }
}

.notice-list {
  // 注意：notice-item 的样式已移至组件内部
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  animation: fadeIn 0.3s ease-in-out;

  .empty-image {
    width: 240rpx;
    height: 240rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: var(--font-size-base);
    color: var(--text-color-tertiary);
  }
}

// 列表项动画
.conversation-list {
  .conversation-item {
    animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  }

  .ai-assistant-item {
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  }
}

.notice-list {
  .notice-item {
    animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 指示器滑入动画
@keyframes indicatorSlideIn {
  from {
    transform: translateX(-50%) scaleX(0);
  }
  to {
    transform: translateX(-50%) scaleX(1);
  }
}

// Tab切换动画通过v-if和animation-delay实现
.tab-switch-animation {
  animation: tabFadeIn 0.3s ease-out;
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateX(20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
