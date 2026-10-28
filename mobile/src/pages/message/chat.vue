<template>
  <view class="chat-page" :style="themeStyle">
    <!-- 顶部导航 -->
    <ChatHeader
      :title="targetUser.name"
      :show-back="true"
      :show-more="true"
      @back="goBack"
      @more="showMore"
    />

    <!-- 黑名单提示 -->
    <view v-if="isBlacklisted" class="blacklist-notice">
      <uni-icons type="info-filled" size="16" :color="dangerColor" />
      <text class="notice-text">该用户已在黑名单中，无法发送消息</text>
    </view>

    <!-- 关联订单/商品悬浮卡片 -->
    <view v-if="relatedOrder || relatedProduct" class="related-info-card" :class="{ 'collapsed': !isCardExpanded }">
      <view class="card-header" @click="toggleCard">
        <view class="card-title-row">
          <uni-icons :type="relatedOrder ? 'shop' : 'cart'" size="16" :color="primaryColor" />
          <text class="card-title">{{ relatedOrder ? '关联订单' : (isShareCard(relatedProduct) ? '关联共享' : '关联商品') }}</text>
          <uni-icons
            :type="isCardExpanded ? 'up' : 'down'"
            size="14"
            color="#AAAAAA"
            class="expand-icon"
          />
        </view>
      </view>
      <view v-if="isCardExpanded" class="card-content">
        <!-- 订单卡片 -->
        <view v-if="relatedOrder" class="order-info-row" @click="goToRelatedInfo">
          <LazyImage
            v-if="relatedOrder.productImage"
            class="info-thumb"
            :src="relatedOrder.productImage"
            mode="aspectFit"
            :width="96"
            :height="96"
          />
          <view class="info-details">
            <text v-if="relatedOrder.productTitle" class="info-title">{{ relatedOrder.productTitle }}</text>
            <text class="info-no">订单号: {{ relatedOrder.orderNo }}</text>
            <text v-if="relatedOrder.price" class="info-price">¥{{ relatedOrder.price }}</text>
            <view class="order-status-badge" :class="'status-' + relatedOrder.status">
              <text class="status-text">{{ getOrderStatusText(relatedOrder.status) }}</text>
            </view>
            <!-- 卖家：确认订单 -->
            <button
              v-if="canConfirmRelatedOrder"
              class="confirm-receive-btn"
              @click.stop="handleConfirmOrder"
            >
              确认订单
            </button>
            <!-- 买家：确认收货 -->
            <button
              v-if="canCompleteRelatedOrder"
              class="confirm-receive-btn"
              @click.stop="handleConfirmReceive"
            >
              确认收货
            </button>
          </view>
          <uni-icons type="right" size="16" color="#AAAAAA" />
        </view>
        <!-- 商品卡片 -->
        <view v-else-if="relatedProduct" class="product-info-row" @click="goToRelatedInfo">
          <LazyImage
            class="info-thumb"
            :src="relatedProduct.image"
            mode="aspectFit"
            :width="96"
            :height="96"
          />
          <view class="info-details">
            <text class="info-title">{{ relatedProduct.title }}</text>
            <text v-if="shouldShowCardPricing(relatedProduct)" class="info-price">
              {{ isShareCard(relatedProduct) ? formatShareRent(relatedProduct) : formatCardPrice(relatedProduct) }}
            </text>
            <view v-if="formatCardDeposit(relatedProduct)" class="info-meta-row">
              <text v-if="formatCardDeposit(relatedProduct)" class="info-subtitle">{{ formatCardDeposit(relatedProduct) }}</text>
            </view>
          </view>
          <uni-icons type="right" size="16" color="#AAAAAA" />
        </view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="message-scroll"
      scroll-y
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="true"
      :scroll-anchoring="true"
      @scrolltoupper="loadMoreMessages"
    >
      <view v-if="messages.length === 0" class="empty-state">
        <view class="empty-icon">💬</view>
        <text class="empty-text">开始聊天吧~</text>
        <text class="empty-hint">发送消息开始交流</text>
      </view>

      <view v-else class="message-list">
        <view
          v-for="(message, index) in messages"
          :key="message.id"
          :id="'msg-' + message.id"
          class="message-item"
          :class="message.isSelf ? 'self' : 'other'"
          :style="{ animationDelay: message.isNew ? index * 50 + 'ms' : '0ms' }"
        >
          <!-- 时间戳 -->
          <view v-if="message.showTime" class="time-divider">
            <text class="time-text">{{ formatMessageTime(message.timestamp) }}</text>
          </view>

          <!-- 消息内容 -->
          <view class="message-content">
            <!-- 对方头像 -->
            <UserAvatar
              v-if="!message.isSelf"
              :src="targetUser.avatar"
              size="sm"
              :clickable="Boolean(targetUserId)"
              @click="goTargetUserProfile"
            />

            <!-- 被拉黑警告图标 -->
            <view
              v-if="message.blockedByUser && message.isSelf"
              class="blocked-warning-icon"
              @click="showBlockedTip"
            >
              <text class="icon">⚠️</text>
            </view>

            <!-- 消息气泡 -->
            <view class="bubble" :class="['type-' + message.type, { 'blocked': message.blockedByUser }]">
              <!-- 文本消息 -->
              <text v-if="message.type === 'text'" class="text-message">{{ message.content }}</text>

              <!-- 图片消息 -->
              <view v-else-if="message.type === 'image'" class="image-message-wrapper">
                <LazyImage
                  class="image-message"
                  :src="message.content"
                  mode="widthFix"
                  width="400"
                  :disable-lazy-load="true"
                  @click="previewImage(message.content)"
                />
              </view>

              <!-- 商品卡片 -->
              <view v-if="message.type === 'product' && message.content" class="product-card" @click="goProduct(message.content)">
                <LazyImage class="product-image" :src="message.content?.image" mode="aspectFit" :width="120" :height="120" />
                <view class="product-info">
                  <text class="product-title">{{ message.content?.title || (message.content?.itemType === 'share' ? '共享物品' : '商品') }}</text>
                  <view class="product-meta-row">
                    <template v-if="isShareCard(message.content)">
                      <text class="share-rent">{{ formatShareRent(message.content) }}</text>
                    </template>
                    <template v-else-if="shouldShowCardPricing(message.content)">
                      <text class="product-price">{{ formatCardPrice(message.content) }}</text>
                    </template>
                    <template v-if="formatCardDeposit(message.content)">
                      <text class="product-deposit">
                        {{ formatCardDeposit(message.content) }}
                      </text>
                    </template>
                    <text class="product-tag">{{ message.content?.itemType === 'share' ? '共享物品' : '闲置商品' }}</text>
                  </view>
                  <text v-if="formatCardSubtitle(message.content)" class="product-subtitle">
                    {{ formatCardSubtitle(message.content) }}
                  </text>
                </view>
              </view>

              <!-- 订单卡片 -->
              <view v-if="message.type === 'order' && message.content" class="order-card" @click="goOrder(message.content?.id)">
                <view class="order-info">
                  <text class="order-title">订单</text>
                  <text class="order-no">{{ message.content?.orderNo || 'N/A' }}</text>
                </view>
                <text class="order-price">¥{{ message.content?.price || 0 }}</text>
              </view>
            </view>

            <!-- 我的头像 -->
            <UserAvatar
              v-if="message.isSelf"
              :src="currentUser.avatar"
              size="sm"
              :clickable="Boolean(currentUser.id)"
              @click="goCurrentUserProfile"
            />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area" :class="{ 'input-focused': inputFocused, 'disabled': isBlacklisted }">
      <!-- 黑名单提示 -->
      <view v-if="isBlacklisted" class="blacklist-tip">
        <text class="tip-icon">🚫</text>
        <text class="tip-text">对方已在黑名单中，无法发送消息</text>
      </view>

      <view class="input-bar" :class="{ 'disabled': isBlacklisted }">
        <view class="tool-btn" @click="chooseImage" :class="{ 'disabled': isBlacklisted }">
          <uni-icons type="image" size="24" :color="isBlacklisted ? '#ccc' : '#666'" />
        </view>
        <view class="tool-btn" @click="showProductPicker" :class="{ 'disabled': isBlacklisted }">
          <uni-icons type="shop" size="24" :color="isBlacklisted ? '#ccc' : '#666'" />
        </view>
        <textarea
          class="message-input"
          v-model="inputText"
          :placeholder="isBlacklisted ? '无法发送消息' : '输入消息...'"
          placeholder-style="color: var(--text-color-tertiary)"
          :auto-height="true"
          :maxlength="-1"
          :disabled="isBlacklisted"
          @confirm="handleInputConfirm"
          @focus="inputFocused = true; showEmojiPanel = false"
          @blur="inputFocused = false"
        />
        <view class="tool-btn" @click="showEmoji" :class="{ 'disabled': isBlacklisted }">
          <uni-icons type="emoji" size="24" :color="isBlacklisted ? '#ccc' : '#666'" />
        </view>
        <button
          class="send-btn"
          :class="{ 'is-disabled': !inputText.trim() || isBlacklisted }"
          @click="sendMessage"
          :disabled="!inputText.trim() || isBlacklisted"
        >
          <text class="send-text">发送</text>
        </button>
      </view>
    </view>

    <!-- 表情面板弹窗 -->
    <view v-if="showEmojiPanel" class="emoji-modal" @click="closeEmojiPanel">
      <view class="emoji-content" @click.stop>
        <view class="emoji-header">
          <text class="emoji-title">选择表情</text>
          <view class="emoji-close" @click="closeEmojiPanel">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <scroll-view class="emoji-list" scroll-y>
          <view class="emoji-grid">
            <view
              v-for="(emoji, index) in emojiList"
              :key="index"
              class="emoji-item"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 商品选择器弹窗 -->
    <view v-if="showProductPickerModal" class="product-picker-modal" @click="showProductPickerModal = false">
      <view class="product-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择商品（{{ productPickerOwnerLabel }} {{ myProducts.length }}）</text>
          <view class="picker-close" @click="showProductPickerModal = false">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <scroll-view class="product-list" scroll-y>
          <view
            v-for="product in myProducts"
            :key="product.id"
            class="product-item"
            @click="sendProductCard(product)"
          >
            <LazyImage class="product-thumb" :src="product.coverImage" mode="aspectFit" :width="96" :height="96" />
            <view class="product-detail">
              <text class="product-name">{{ product.title }}</text>
              <view class="product-picker-meta">
                <text class="product-price">{{ formatCardPrice(product) }}</text>
                <text class="product-type">{{ product.itemType === 'share' ? '共享' : '闲置' }}</text>
              </view>
            </view>
            <uni-icons type="right" size="16" color="#AAAAAA" />
          </view>
          <view v-if="myProducts.length === 0" class="empty-products">
            <text>{{ productPickerEmptyText }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useThemePage, useThemeStyle, useThemeColors } from '@/utils/theme'
import { messageApi } from '@/api/message'
import { productApi } from '@/api/product'
import { shareApi } from '@/api/share'
import { userApi } from '@/api/user'
import { blacklistApi } from '@/api/blacklist'
import { commonApi } from '@/api/common'
import { orderApi } from '@/api/order'
import { checkSensitiveWord, SensitiveCheckType } from '@/utils/sensitive-word'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { formatTime } from '@/utils/date'
import { checkAuth } from '@/utils/auth'
import { updateMessageBadge } from '@/utils/tabbar'
import { messageEventBus, MessageEvents } from '@/utils/message-bus'
import { messageService } from '@/services/message.service'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { normalizeImageUrl } from '@/utils/image'

const userStore = useUserStore()
const appStore = useAppStore()
const { themeStyle } = useThemeStyle()
const { primaryColor, dangerColor } = useThemeColors()

// 缓存表情列表，避免每次重新创建
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '👍', '👎', '👏', '🙏', '💪', '❤️', '💔', '💯',
  '✨', '⭐', '🌟', '💫', '🔥', '💥', '💦', '🎉'
]

interface Message {
  id: string
  isSelf: boolean
  type: 'text' | 'image' | 'product' | 'order'
  content: any
  timestamp: string
  showTime?: boolean
  isNew?: boolean
  sendStatus?: 'sending' | 'success' | 'failed' | 'blocked' // 发送状态：发送中、成功、失败、被拉黑
  blockedByUser?: boolean // 是否被对方拉黑
}

const targetUserId = ref<string>('')
const conversationId = ref<string>('')
const productId = ref<string>('')
const shareItemId = ref<string>('')
const orderId = ref<string>('') // 关联的订单ID
const relatedProduct = ref<any>(null) // 关联的商品信息
const relatedOrder = ref<any>(null) // 关联的订单信息
const targetUser = ref<any>({})
const isCardExpanded = ref(true) // 卡片展开状态，默认展开
const currentUser = ref<any>({})
const messages = ref<Message[]>([])
const inputText = ref('')
const scrollIntoView = ref('')
const inputFocused = ref(false)
const messagePage = ref(1) // 消息分页页码，避免与getCurrentPages()的currentPage冲突
const pageSize = ref(20)
const totalPages = ref(0)
const isLoading = ref(false)
const hasMore = ref(true)
const showProductPickerModal = ref(false)
const showEmojiPanel = ref(false)
const myProducts = ref<any[]>([])
const relatedProductSellerId = ref<string>('')
const productPickerOwnerLabel = ref<'我的' | '对方'>('我的')
const emojiList = ref(EMOJI_LIST) // 使用缓存的表情列表
const isBlacklisted = ref(false) // 对方是否在黑名单中
const isBlockedBy = ref(false) // 当前用户是否被对方拉黑

const productPickerEmptyText = computed(() => `${productPickerOwnerLabel.value}暂无在售商品或共享物品`)
const canConfirmRelatedOrder = computed(() => {
  return relatedOrder.value?.status === 0 && relatedOrder.value?.isSeller
})
const canCompleteRelatedOrder = computed(() => {
  return relatedOrder.value?.status === 1 && relatedOrder.value?.isBuyer
})

function isSelectableProductStatus(status: any): boolean {
  // 允许在售与待确认（预订）状态进入商品选择器
  const normalizedStatus = Number(status)
  return normalizedStatus === 1 || normalizedStatus === 3 || status === 'pending_confirm'
}

function normalizeUserId(userId: any): string {
  if (userId === null || userId === undefined) {
    return ''
  }
  return String(userId)
}

function getCurrentUserId(): string {
  return normalizeUserId(currentUser.value.id || userStore.userInfo?.userId)
}

function normalizeOrderRole(orderData: any): { isBuyer: boolean; isSeller: boolean } {
  const currentUserId = getCurrentUserId()
  const buyerId = normalizeUserId(orderData?.buyerId)
  const sellerId = normalizeUserId(orderData?.sellerId)

  return {
    isBuyer: !!currentUserId && buyerId === currentUserId,
    isSeller: !!currentUserId && sellerId === currentUserId
  }
}

async function resolveSellerIdForProductPicker(): Promise<string> {
  const currentUserId = getCurrentUserId()

  // 无关联资源：聊天里优先展示对方商品
  if (!productId.value && !shareItemId.value) {
    const otherUserId = normalizeUserId(targetUserId.value)
    if (otherUserId && otherUserId !== currentUserId) {
      productPickerOwnerLabel.value = '对方'
      return otherUserId
    }
    productPickerOwnerLabel.value = '我的'
    return currentUserId
  }

  // 已有关联资源，但还没拿到卖家ID时，先补拉一次详情
  if (!relatedProductSellerId.value) {
    if (shareItemId.value) {
      await loadRelatedShareItem()
    } else {
      await loadRelatedProduct()
    }
  }

  const sellerId = normalizeUserId(relatedProductSellerId.value)
  if (!sellerId) {
    // 兜底：关联资源信息异常时，默认按自己的商品展示
    productPickerOwnerLabel.value = '我的'
    return currentUserId
  }

  // 当前会话中自己是卖家 -> 展示自己的商品
  if (sellerId === currentUserId) {
    productPickerOwnerLabel.value = '我的'
    return currentUserId
  }

  // 当前会话中对方是卖家 -> 展示对方商品
  productPickerOwnerLabel.value = '对方'
  return sellerId
}

function isShareCard(card: any): boolean {
  return card?.itemType === 'share'
    || card?.type === 'share'
    || card?.cardType === 'share'
    || card?.type === 'share_card'
    || card?.type === 'share_item_card'
    || !!card?.shareId
    || !!card?.shareItemId
}

function firstDefined(...values: any[]) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

function formatAmount(value: any): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '0'
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '')
}

function formatAvailableTime(raw: string): string {
  if (!raw) return '随时可借用'

  try {
    const parsed = JSON.parse(raw)
    const parts: string[] = []

    if (parsed.rentalType === 'days' && parsed.rentalDays) {
      parts.push(`可借${parsed.rentalDays}天`)
    } else if (parsed.rentalType === 'hours' && parsed.rentalHours) {
      parts.push(`可借${parsed.rentalHours}小时`)
    }

    const deliveryMap: Record<string, string> = {
      self: '自取',
      mailing: '邮寄',
      both: '自取/邮寄'
    }

    if (parsed.deliveryMethod) {
      parts.push(deliveryMap[parsed.deliveryMethod] || parsed.deliveryMethod)
    }

    return parts.length > 0 ? parts.join(' · ') : '随时可借用'
  } catch {
    return raw || '随时可借用'
  }
}

function normalizeProductCard(card: any) {
  if (!card || typeof card !== 'object') {
    return card
  }

  const itemType = isShareCard(card) ? 'share' : 'product'
  const priceValue = Number(itemType === 'share'
    ? firstDefined(card.dailyRent, card.dailyRental, card.rent, card.rentPrice, card.rentalPrice, card.price, card.amount, 0)
    : firstDefined(card.price, card.amount, 0))
  const depositValue = Number(firstDefined(card.deposit, card.depositAmount, 0))
  const cardId = itemType === 'share'
    ? firstDefined(card.shareId, card.shareItemId, card.id, card.productId, '')
    : firstDefined(card.productId, card.id, '')
  const rawSubtitle = firstDefined(card.conditionText, card.condition, card.availableTime, card.availableTimes, card.location, '')
  const conditionText = itemType === 'share' && rawSubtitle === '共享物品' ? '' : rawSubtitle

  return {
    ...card,
    id: String(cardId),
    itemType,
    title: firstDefined(card.title, card.productTitle, card.shareItemTitle, itemType === 'share' ? '共享物品' : '商品'),
    price: priceValue,
    dailyRent: itemType === 'share' ? priceValue : undefined,
    deposit: itemType === 'share' ? depositValue : undefined,
    image: firstDefined(card.image, card.coverImage, card.coverImageUrl, card.shareItemCover, card.shareItemImage, card.imageUrl, ''),
    conditionText
  }
}

function formatCardPrice(card: any): string {
  const normalized = normalizeProductCard(card) || {}
  const price = Number(firstDefined(normalized.price, normalized.dailyRent, 0))
  if (!Number.isFinite(price) || price <= 0) {
    return normalized.itemType === 'share' ? '免费/天' : '¥0'
  }
  return normalized.itemType === 'share' ? `¥${formatAmount(price)}/天` : `¥${formatAmount(price)}`
}

function formatShareRent(card: any): string {
  const normalized = normalizeProductCard(card) || {}
  const rent = Number(firstDefined(normalized.dailyRent, normalized.price, normalized.rentPrice, normalized.rentalPrice, 0))
  if (!Number.isFinite(rent) || rent <= 0) return '日租金待定'
  return `日租金 ¥${formatAmount(rent)}/天`
}

function formatCardDeposit(card: any): string {
  const normalized = normalizeProductCard(card) || {}
  if (normalized.itemType !== 'share') return ''

  const deposit = Number(firstDefined(normalized.deposit, 0))
  if (!Number.isFinite(deposit) || deposit <= 0) return ''
  return `押金 ¥${formatAmount(deposit)}`
}

function formatCardSubtitle(card: any): string {
  const normalized = normalizeProductCard(card) || {}
  if (normalized.itemType === 'share') {
    const availableTime = formatAvailableTime(firstDefined(normalized.conditionText, normalized.location, '') || '')
    return availableTime
  }
  return firstDefined(normalized.conditionText, normalized.location, '')
}

function shouldShowCardPricing(card: any): boolean {
  return true
}

function parseCardPayload(message: any) {
  const candidates = [message?.content, message?.extraData]
  for (const candidate of candidates) {
    if (!candidate) continue
    if (typeof candidate === 'object') {
      return normalizeProductCard(candidate)
    }
    if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate)
        if (parsed && typeof parsed === 'object') {
          return normalizeProductCard(parsed)
        }
      } catch {
        // content 可能只是旧接口保存的商品标题，继续尝试 extraData
      }
    }
  }

  return normalizeProductCard({
    title: message?.content || '',
    price: 0
  })
}

async function fetchAllSellerProducts(userId: string) {
  const pageSize = 100
  let page = 1
  let total = Number.POSITIVE_INFINITY
  const result: any[] = []

  while (result.length < total) {
    const res: any = await productApi.getSellerProducts(userId, {
      page,
      pageSize
    })
    const data = res.data || {}
    const list = data.list || data.records || []
    result.push(...list)
    total = Number(data.total ?? result.length)

    if (list.length === 0 || list.length < pageSize) break
    page++
  }

  return result
}

async function fetchAllUserShareItems(userId: string) {
  const pageSize = 100
  let page = 1
  let total = Number.POSITIVE_INFINITY
  const result: any[] = []

  while (result.length < total) {
    const res: any = await shareApi.getUserShareItems(userId, {
      page,
      size: pageSize,
      status: 1
    })
    const data = res.data || {}
    const list = data.list || data.records || []
    result.push(...list)
    total = Number(data.total ?? result.length)

    if (list.length === 0 || list.length < pageSize) break
    page++
  }

  return result
}

onMounted(() => {
  // 检查登录状态
  if (!checkAuth({
    showTip: true,
    tipText: '请先登录后进行聊天',
    showAuthGuide: true,
    guideTitle: '登录后可进行聊天',
    guideContent: '私信聊天涉及个人消息记录，请先登录或注册账号。'
  })) {
    return
  }

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  // 支持三种参数传递方式：
  // 1. conversationId：直接打开会话
  // 2. userId + productId：通过用户ID和商品ID定位会话
  // 3. userId + shareItemId：从共享物品详情进入聊天
  // 4. userId + orderId：通过用户ID和订单ID定位会话
  conversationId.value = options.conversationId || ''
  targetUserId.value = options.userId || ''
  productId.value = options.productId || ''
  shareItemId.value = options.shareItemId || options.shareId || ''
  orderId.value = options.orderId || ''

  console.log('[Chat] URL参数:', {
    conversationId: conversationId.value,
    targetUserId: targetUserId.value,
    userId: options.userId,
    productId: productId.value,
    shareItemId: shareItemId.value,
    orderId: orderId.value,
    allOptions: options
  })

  currentUser.value = {
    id: userStore.userInfo?.userId,
    avatar: normalizeImageUrl(userStore.avatar || '/static/images/user.png')
  }

  // 检查黑名单状态
  checkBlacklistStatus()

  // 设置当前会话ID
  if (conversationId.value) {
    messageService.setCurrentConversation(conversationId.value)
  }

  if (conversationId.value) {
    // 如果有会话ID，直接加载会话
    loadConversation()
  } else if (targetUserId.value) {
    // 如果只有用户ID，先创建会话再加载
    createConversationAndInit()
  }

  // 设置消息监听
  setupMessageListeners()
})

onShow(() => {
  useThemePage()
})

// 设置消息监听
function setupMessageListeners() {
  // 监听新消息
  messageEventBus.on(MessageEvents.NEW_MESSAGE, (data: any) => {
    // 如果是当前会话的消息，添加到消息列表
    if (data.conversationId === conversationId.value) {
      console.log('[Chat] 收到新消息:', data.message)

      // 将后端消息格式转换为前端格式
      let content = data.message.content

      // 尝试解析商品/订单卡片
      if (data.message.type === 3) {
        content = parseCardPayload(data.message)
      } else if (data.message.type === 4) {
        try {
          content = JSON.parse(data.message.extraData || data.message.content)
        } catch (e) {
          console.error('[Chat] 解析订单消息内容失败:', e)
        }
      }

      // 图片消息：记录URL以便调试
      if (data.message.type === 2) {
        console.log('[Chat] 收到图片消息，URL:', content)
      }

      const timestamp = data.message.sendTime || data.message.createdAt || new Date().toISOString()

      // 判断是否为自己发送的消息
      let isSelf = false
      if (data.message.isMine !== undefined) {
        isSelf = data.message.isMine
      } else if (data.message.fromUserId !== undefined) {
        isSelf = normalizeUserId(data.message.fromUserId) === getCurrentUserId()
      }

      const newMessage: Message = {
        id: data.message.messageId?.toString() || data.message.id?.toString() || String(Date.now()),
        isSelf,
        type: getMessageType(data.message.type || 1),
        content: content,
        timestamp: timestamp,
        isNew: true,
        showTime: false // 先设置为false，添加后再计算
      }
      messages.value.push(newMessage)

      // 计算是否显示时间（基于上一条消息）
      if (messages.value.length >= 2) {
        const currentTime = new Date(timestamp).getTime()
        const prevMsg = messages.value[messages.value.length - 2]
        if (prevMsg?.timestamp) {
          const prevTime = new Date(prevMsg.timestamp).getTime()
          newMessage.showTime = currentTime - prevTime > 5 * 60 * 1000
        }
      } else {
        newMessage.showTime = true
      }

      // 滚动到底部
      nextTick(() => {
        scrollToBottom()
      })

      // 标记已读
      markConversationAsRead()
    }
  })

  // 监听消息撤回
  messageEventBus.on(MessageEvents.MESSAGE_RECALLED, (data: any) => {
    console.log('[Chat] 消息已撤回:', data)
    if (data.conversationId === conversationId.value) {
      // 从列表中移除被撤回的消息
      messages.value = messages.value.filter(msg => msg.id !== data.messageId)
    }
  })

  // 监听对方正在输入
  messageEventBus.on(MessageEvents.TYPING, (data: any) => {
    if (data.conversationId === conversationId.value && data.isTyping) {
      console.log('[Chat] 对方正在输入...')
      // 可以显示"对方正在输入..."的提示
      uni.showToast({
        title: '对方正在输入...',
        icon: 'none',
        duration: 1000
      })
    }
  })
}

async function loadTargetUser() {
  if (!targetUserId.value) return

  try {
    isLoading.value = true
    const res: any = await userApi.getUserById(targetUserId.value)
    if (res.data) {
      targetUser.value = {
        id: res.data.id,
        name: res.data.nickname || res.data.username,
        avatar: normalizeImageUrl(res.data.avatar || '/static/images/user.png')
      }
    }

    // 如果有会话ID，标记已读
    if (conversationId.value) {
      markConversationAsRead()
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 失败时使用默认值
    targetUser.value = {
      id: targetUserId.value,
      name: '用户' + targetUserId.value,
      avatar: normalizeImageUrl('/static/images/user.png')
    }
  } finally {
    isLoading.value = false
  }
}

async function loadMessages(isLoadMore = false) {
  if (!conversationId.value || isLoading.value) return

  // 如果是加载更多且没有更多数据，直接返回
  if (isLoadMore && !hasMore.value) return

  try {
    isLoading.value = true

    console.log('[Chat] 加载消息列表:', {
      conversationId: conversationId.value,
      currentPage: messagePage.value,
      currentUser: currentUser.value
    })

    const res: any = await messageApi.getMessageList(conversationId.value, {
      page: messagePage.value,
      pageSize: pageSize.value
    })

    if (res.data) {
      const { list, total } = res.data
      totalPages.value = Math.ceil(total / pageSize.value)

      console.log('[Chat] 后端返回消息列表:', {
        total,
        listCount: list.length,
        firstMessage: list[0] ? {
          id: list[0].id,
          messageId: list[0].messageId,
          fromUserId: list[0].fromUserId,
          isMine: list[0].isMine,
          mine: list[0].mine,
          allFields: Object.keys(list[0])
        } : null
      })

      // 转换消息格式
      const formattedMessages: Message[] = list.map((msg: any, index: number) => {
        let content = msg.content

        // 尝试解析商品/订单卡片
        if (msg.type === 3) {
          content = parseCardPayload(msg)
        } else if (msg.type === 4) {
          try {
            content = JSON.parse(msg.extraData || msg.content)
          } catch (e) {
            console.error('[Chat] 解析订单消息内容失败:', e)
          }
        }

        // 图片消息：检查content是否为有效URL
        if (msg.type === 2) {
          console.log('[Chat] 图片消息URL:', content)
        }

        const timestamp = msg.sendTime || msg.createdAt || new Date().toISOString()

        // 计算是否显示时间（基于列表中的上一条消息）
        let showTime = false
        if (index === 0) {
          // 第一条消息显示时间
          showTime = true
        } else {
          const prevMsg = list[index - 1]
          if (prevMsg) {
            const prevTimestamp = prevMsg.sendTime || prevMsg.createdAt
            if (prevTimestamp) {
              const currentTime = new Date(timestamp).getTime()
              const prevTime = new Date(prevTimestamp).getTime()
              showTime = currentTime - prevTime > 5 * 60 * 1000
            }
          }
        }

        // 判断是否为自己发送的消息
        // 优先使用后端的 isMine 字段，其次使用 fromUserId 字段进行判断
        let isSelf = false
        if (msg.isMine !== undefined) {
          // 后端已经标注了是否是自己发送的消息
          isSelf = msg.isMine
        } else if (msg.fromUserId !== undefined) {
          // 使用 fromUserId 字段判断
          isSelf = normalizeUserId(msg.fromUserId) === getCurrentUserId()
        }

        console.log(`[Chat] 消息 ${index + 1}:`, {
          messageId: msg.messageId || msg.id,
          fromUserId: msg.fromUserId,
          isMine: msg.isMine,
          currentUserId: currentUser.value.id,
          isSelf,
          messageType: msg.type,
          messageTypeValue: msg.type,
          messageContent: content,
          parsedType: getMessageType(msg.type)
        })

        return {
          id: msg.messageId?.toString() || String(msg.id),
          isSelf,
          type: getMessageType(msg.type),
          content: content,
          timestamp: timestamp,
          showTime: showTime
        }
      })

      console.log('[Chat] 格式化后的消息顺序（反转前）:', {
        totalCount: formattedMessages.length,
        firstMessageId: formattedMessages[0]?.id,
        lastMessageId: formattedMessages[formattedMessages.length - 1]?.id,
        firstMessageTime: formattedMessages[0]?.timestamp,
        lastMessageTime: formattedMessages[formattedMessages.length - 1]?.timestamp
      })

      // 反转消息数组，让最早的消息在最上面，最新的在最下面（标准聊天显示方式）
      const reversedMessages = [...formattedMessages].reverse()

      // 反转后重新计算每条消息的 showTime
      reversedMessages.forEach((msg, index) => {
        if (index === 0) {
          // 第一条消息（最上面的消息）显示时间
          msg.showTime = true
        } else {
          const prevMsg = reversedMessages[index - 1]
          if (prevMsg) {
            const currentTime = new Date(msg.timestamp).getTime()
            const prevTime = new Date(prevMsg.timestamp).getTime()
            // 与上一条消息间隔超过5分钟才显示时间
            msg.showTime = currentTime - prevTime > 5 * 60 * 1000
          }
        }
      })

      console.log('[Chat] 格式化后的消息顺序（反转后）:', {
        totalCount: reversedMessages.length,
        firstMessageId: reversedMessages[0]?.id,
        lastMessageId: reversedMessages[reversedMessages.length - 1]?.id,
        firstMessageTime: reversedMessages[0]?.timestamp,
        lastMessageTime: reversedMessages[reversedMessages.length - 1]?.timestamp,
        firstShowTime: reversedMessages[0]?.showTime
      })

      // 如果是加载更多，将新消息插入到前面
      if (isLoadMore) {
        messages.value = [...reversedMessages, ...messages.value]
      } else {
        messages.value = reversedMessages
        // 首次加载，滚动到底部
        nextTick(() => {
          scrollToBottom()
        })
      }

      // 更新是否有更多数据
      hasMore.value = messagePage.value < totalPages.value
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    uni.showToast({
      title: '加载消息失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

// 辅助函数：获取消息类型字符串
function getMessageType(messageType: number): 'text' | 'image' | 'product' | 'order' {
  const typeMap: Record<number, 'text' | 'image' | 'product' | 'order'> = {
    1: 'text',
    2: 'image',
    3: 'product',
    4: 'order'
  }
  const result = typeMap[messageType] || 'text'

  // 如果类型未知，记录警告
  if (!typeMap[messageType]) {
    console.warn(`[Chat] 未知消息类型: ${messageType}，已默认为文本类型`)
  }

  return result
}

async function loadConversation() {
  try {
    const res: any = await messageApi.getConversationDetail(conversationId.value)
    if (res.data) {
      const conv = res.data
      // 兼容不同后端字段命名
      targetUserId.value = conv.otherUserId || conv.targetId
      targetUser.value = {
        id: conv.otherUserId || conv.targetId,
        name: conv.otherUserNickname || conv.targetName || '用户',
        avatar: conv.otherUserAvatar || conv.targetAvatar || '/static/images/user.png'
      }

      // 检查是否有关联商品ID
      const relatedPid = conv.relatedProductId || conv.productId
      if (relatedPid && !productId.value) {
        productId.value = relatedPid
        console.log('[Chat] 从会话中发现关联商品ID:', relatedPid)
      }

      const relatedSid = conv.relatedShareId || conv.shareItemId || conv.shareId
      if (relatedSid && !shareItemId.value) {
        shareItemId.value = relatedSid
        console.log('[Chat] 从会话中发现关联共享物品ID:', relatedSid)
      }

      // 检查是否有关联订单ID
      const relatedOid = conv.relatedOrderId || conv.orderId
      if (relatedOid && !orderId.value) {
        orderId.value = relatedOid
        console.log('[Chat] 从会话中发现关联订单ID:', relatedOid)
      }

      // 标记会话为已读
      await markConversationAsRead()

      // 重新检查黑名单状态（因为targetUserId现在已被正确设置）
      await checkBlacklistStatus()

      // 加载会话消息
      loadMessages()

      // 如果有关联商品，加载商品信息
      if (productId.value) {
        loadRelatedProduct()
      }

      if (shareItemId.value) {
        loadRelatedShareItem()
      }

      // 如果有关联订单，加载订单信息
      if (orderId.value) {
        loadRelatedOrder()
      }
    }
  } catch (error) {
    console.error('加载会话失败:', error)
  }
}

// 创建会话并初始化聊天
async function createConversationAndInit() {
  if (!targetUserId.value) return

  try {
    isLoading.value = true
    console.log('[Chat] 开始创建/获取会话:', {
      targetUserId: targetUserId.value,
      targetUserIdType: typeof targetUserId.value,
      productId: productId.value,
      shareItemId: shareItemId.value,
      orderId: orderId.value
    })

    const res: any = await messageApi.createOrUpdateConversation(
      targetUserId.value,
      productId.value || '',
      orderId.value || '',
      shareItemId.value || ''
    )

    console.log('[Chat] 创建会话完整响应:', JSON.stringify(res))
    console.log('[Chat] 创建会话响应 data:', res.data)
    console.log('[Chat] 创建会话响应 conversationId:', res.data?.conversationId)

    if (res.data && res.data.conversationId) {
      conversationId.value = String(res.data.conversationId)
      messageService.setCurrentConversation(conversationId.value)
      console.log('[Chat] 会话创建/获取成功, ID:', conversationId.value)

      // 从返回数据中获取用户信息
      targetUser.value = {
        id: res.data.otherUserId || targetUserId.value,
        name: res.data.otherUserNickname || '用户',
        avatar: normalizeImageUrl(res.data.otherUserAvatar || '/static/images/user.png')
      }

      console.log('[Chat] 目标用户信息:', targetUser.value)

      // 检查黑名单状态
      await checkBlacklistStatus()

      // 加载消息列表（注意：需要在 finally 块之前调用，所以先重置 isLoading）
      isLoading.value = false
      await loadMessages()

      // 如果有商品ID，加载商品信息
      if (productId.value) {
        loadRelatedProduct()
      }

      if (shareItemId.value) {
        loadRelatedShareItem()
      }

      // 如果有订单ID，加载订单信息
      if (orderId.value) {
        loadRelatedOrder()
      }
    } else {
      throw new Error('创建会话失败：未返回会话ID')
    }
  } catch (error: any) {
    console.error('[Chat] 创建会话失败，稍后重试:', error)

    // 不使用降级方案，清空会话ID，让发送消息时重新尝试创建
    conversationId.value = ''
    targetUser.value = {
      id: targetUserId.value,
      name: '用户',
      avatar: '/static/images/user.png'
    }

    // 清空消息列表
    messages.value = []

    // 显示错误提示，告知用户可能需要重试
    uni.showToast({
      title: '会话创建失败，发送消息时将重试',
      icon: 'none',
      duration: 2000
    })

    // 如果有商品ID，尝试加载商品信息
    if (productId.value) {
      loadRelatedProduct()
    }

    if (shareItemId.value) {
      loadRelatedShareItem()
    }

    // 如果有订单ID，尝试加载订单信息
    if (orderId.value) {
      loadRelatedOrder()
    }
  } finally {
    isLoading.value = false
  }
}

async function loadRelatedProduct() {
  if (!productId.value) return

  try {
    const res: any = await productApi.getProductDetail(productId.value)
    if (res.data) {
      const sellerId = res.data.sellerId || res.data.userId
      relatedProductSellerId.value = normalizeUserId(sellerId)

      relatedProduct.value = {
        id: res.data.id,
        title: res.data.title,
        price: res.data.price,
        image: normalizeImageUrl(res.data.coverImage)
      }

      console.log('[Chat] 加载关联商品成功:', relatedProduct.value)

      // 不再自动添加商品卡片到消息列表
      // 商品信息会通过顶部的关联信息悬浮卡片显示
    }
  } catch (error) {
    console.error('[Chat] 加载商品信息失败:', error)
  }
}

async function loadRelatedShareItem() {
  if (!shareItemId.value) return

  try {
    const res: any = await shareApi.getShareItemDetail(shareItemId.value)
    if (res.data) {
      relatedProductSellerId.value = normalizeUserId(res.data.userId)

      relatedProduct.value = {
        id: res.data.id,
        itemType: 'share',
        title: res.data.title,
        price: res.data.dailyRent,
        dailyRent: res.data.dailyRent,
        deposit: res.data.deposit,
        image: normalizeImageUrl(res.data.coverImage),
        conditionText: res.data.availableTime || ''
      }

      console.log('[Chat] 加载关联共享物品成功:', relatedProduct.value)
    }
  } catch (error) {
    console.error('[Chat] 加载共享物品信息失败:', error)
  }
}

// 加载关联订单信息
async function loadRelatedOrder() {
  if (!orderId.value) return

  try {
    const res: any = await orderApi.getOrderDetail(orderId.value)
    if (res.data) {
      const normalizedStatus = Number(res.data.status)
      const roleInfo = normalizeOrderRole(res.data)

      relatedOrder.value = {
        id: res.data.orderId,
        orderNo: res.data.orderNo,
        productTitle: res.data.productTitle,
        price: res.data.totalPrice || res.data.unitPrice,
        status: Number.isNaN(normalizedStatus) ? res.data.status : normalizedStatus,
        productImage: normalizeImageUrl(res.data.productImage),
        buyerId: normalizeUserId(res.data.buyerId),
        sellerId: normalizeUserId(res.data.sellerId),
        isBuyer: roleInfo.isBuyer,
        isSeller: roleInfo.isSeller
      }

      console.log('[Chat] 加载关联订单成功:', relatedOrder.value)
    }
  } catch (error) {
    console.error('[Chat] 加载订单信息失败:', error)
  }
}

async function loadMoreMessages() {
  if (!hasMore.value || isLoading.value) return

  messagePage.value++
  await loadMessages(true)
}

async function sendMessage() {
  if (!inputText.value.trim()) return

  // 检查敏感词
  const checkResult = await checkSensitiveWord(inputText.value, SensitiveCheckType.MESSAGE)
  if (checkResult && !checkResult.passed) {
    return // 包含禁止词，停止发送
  }

  // 使用过滤后的内容或原内容
  const messageToSend = checkResult?.filteredContent || inputText.value

  // 如果有敏感词被过滤，显示提示
  if (checkResult?.hasSensitiveWord) {
    uni.showToast({
      title: '已自动过滤敏感词',
      icon: 'none',
      duration: 1500
    })
  }

  // 检查黑名单状态
  if (isBlacklisted.value) {
    uni.showModal({
      title: '无法发送消息',
      content: '该用户已在您的黑名单中，请先将其移出黑名单后再发送消息',
      confirmText: '前往黑名单',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/mine/blacklist' })
        }
      }
    })
    return
  }

  // 检查是否被对方拉黑
  const isBlocked = await checkIsBlockedBy()
  if (isBlocked) {
    // 被对方拉黑，创建本地消息不上传到服务器
    const tempMessage: Message = {
      id: Date.now().toString(),
      isSelf: true,
      type: 'text',
      content: inputText.value,
      timestamp: new Date().toISOString(),
      isNew: true,
      sendStatus: 'blocked',
      blockedByUser: true
    }

    messages.value.push(tempMessage)
    inputText.value = ''

    nextTick(() => {
      scrollToBottom()
    })

    // 显示提示
    uni.showToast({
      title: '对方已将你拉黑，消息无法发送',
      icon: 'none',
      duration: 2000
    })

    return
  }

  // 如果没有会话ID，先创建会话
  if (!conversationId.value && targetUserId.value) {
    try {
      const res: any = await messageApi.createOrUpdateConversation(
        targetUserId.value,
        productId.value || '',
        orderId.value || '',
        shareItemId.value || ''
      )
      if (res.data) {
        conversationId.value = res.data.conversationId
        messageService.setCurrentConversation(conversationId.value)
      } else {
        throw new Error('创建会话失败')
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      uni.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      })
      return
    }
  }

  // 再次检查conversationId
  if (!conversationId.value) {
    uni.showToast({
      title: '会话创建失败',
      icon: 'none'
    })
    return
  }

  const tempMessage: Message = {
    id: Date.now().toString(),
    isSelf: true,
    type: 'text',
    content: messageToSend,
    timestamp: new Date().toISOString(),
    isNew: true
  }

  // 先添加到本地列表，实现乐观更新
  messages.value.push(tempMessage)
  const messageContent = messageToSend
  inputText.value = ''

  nextTick(() => {
    scrollToBottom()
  })

  // 发送到服务器
  try {
    console.log('[Chat] 发送消息参数:', {
      conversationId: conversationId.value,
      conversationIdType: typeof conversationId.value,
      content: messageContent,
      type: 1
    })

    const res: any = await messageApi.sendMessage({
      conversationId: conversationId.value,
      content: messageContent,
      type: 1 // 文本消息，使用数字类型
    })

    console.log('[Chat] 发送消息响应:', res)

    if (res.data) {
      // 更新本地消息ID
      const index = messages.value.findIndex(m => m.id === tempMessage.id)
      if (index !== -1) {
        messages.value[index].id = res.data.messageId?.toString() || res.data.id?.toString()
        // ID 更新后，重新触发滚动
        nextTick(() => {
          setTimeout(() => {
            scrollToBottom()
          }, 50)
        })
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    uni.showToast({
      title: '发送失败',
      icon: 'none'
    })
    // 移除失败的消息
    const index = messages.value.findIndex(m => m.id === tempMessage.id)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }
}

function scrollToBottom() {
  if (messages.value.length > 0) {
    // 使用最后一条消息的 ID 作为滚动目标
    const lastMessage = messages.value[messages.value.length - 1]
    const targetId = 'msg-' + lastMessage.id

    // 先清空，再设置，确保触发滚动
    scrollIntoView.value = ''
    nextTick(() => {
      setTimeout(() => {
        scrollIntoView.value = targetId
      }, 50)
    })
  }
}

function formatMessageTime(timestamp: string) {
  return formatTime(timestamp)
}

// 处理输入框确认事件（仅支持点击发送按钮发送消息）
function handleInputConfirm() {
  // textarea 默认支持多行输入，Enter 换行
  // 用户需要点击发送按钮来发送消息
  // 如果需要 Enter 发送、Shift+Enter 换行的行为，建议使用专门的富文本编辑器组件
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      uploadAndSendImage(res.tempFilePaths[0])
    }
  })
}

async function uploadAndSendImage(filePath: string) {
  console.log('[Chat] 开始上传和发送图片:', filePath)

  // 检查黑名单状态
  if (isBlacklisted.value) {
    uni.showToast({
      title: '对方已在黑名单中，无法发送图片',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 检查是否被对方拉黑
  const isBlocked = await checkIsBlockedBy()
  if (isBlocked) {
    // 被对方拉黑，创建本地消息不上传到服务器
    const tempMessage: Message = {
      id: Date.now().toString(),
      isSelf: true,
      type: 'image',
      content: filePath, // 使用本地路径显示
      timestamp: new Date().toISOString(),
      isNew: true,
      sendStatus: 'blocked',
      blockedByUser: true
    }

    messages.value.push(tempMessage)

    nextTick(() => {
      scrollToBottom()
    })

    // 显示提示
    uni.showToast({
      title: '对方已将你拉黑，图片无法发送',
      icon: 'none',
      duration: 2000
    })

    return
  }

  uni.showLoading({ title: '发送中...' })

  try {
    // 上传图片
    const imageUrl: any = await commonApi.uploadImage(filePath)
    console.log('[Chat] 图片上传成功:', imageUrl?.substring(0, 100))

    // 不再转换URL，直接使用后端返回的原始URL
    // LazyImage组件会自动处理URL的标准化和显示
    const imageContentUrl = imageUrl

    // 如果没有会话ID，先创建会话
    if (!conversationId.value && targetUserId.value) {
      console.log('[Chat] 会话不存在，创建新会话...')
      const res: any = await messageApi.createOrUpdateConversation(
        targetUserId.value,
        productId.value || '',
        orderId.value || '',
        shareItemId.value || ''
      )
      if (res.data) {
        conversationId.value = res.data.conversationId
        messageService.setCurrentConversation(conversationId.value)
        console.log('[Chat] 会话创建成功, ID:', conversationId.value)
      } else {
        throw new Error('创建会话失败')
      }
    }

    // 再次检查conversationId
    if (!conversationId.value) {
      console.error('[Chat] 会话ID为空')
      uni.showToast({
        title: '会话创建失败',
        icon: 'none'
      })
      return
    }

    // 先添加到本地列表
    const tempMessage: Message = {
      id: Date.now().toString(),
      isSelf: true,
      type: 'image',
      content: imageContentUrl,
      timestamp: new Date().toISOString(),
      isNew: true
    }

    messages.value.push(tempMessage)

    nextTick(() => {
      scrollToBottom()
    })

    // 发送图片消息到服务器
    const res: any = await messageApi.sendMessage({
      conversationId: conversationId.value,
      content: imageContentUrl,
      type: 2 // 图片消息，使用数字类型
    })

    if (res.data) {
      // 更新本地消息ID
      const index = messages.value.findIndex(m => m.id === tempMessage.id)

      if (index !== -1) {
        messages.value[index].id = res.data.messageId?.toString() || res.data.id?.toString()

        // ID 更新后，重新触发滚动
        nextTick(() => {
          setTimeout(() => {
            scrollToBottom()
          }, 50)
        })
      } else {
        console.error('[Chat] 未找到临时消息，无法更新ID')
      }
    }
  } catch (error) {
    console.error('[Chat] 发送图片失败:', error)
    uni.showToast({
      title: '发送失败',
      icon: 'none'
    })
    // 移除失败的消息
    const index = messages.value.findIndex(m => m.isNew && m.type === 'image')
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  } finally {
    uni.hideLoading()
  }
}

function previewImage(url: string) {
  uni.previewImage({
    urls: [url],
    current: url
  })
}

async function showProductPicker() {
  try {
    const sellerIdToQuery = await resolveSellerIdForProductPicker()
    if (!sellerIdToQuery) {
      uni.showToast({
        title: '无法确定商品归属',
        icon: 'none'
      })
      return
    }

    isLoading.value = true
    // 根据会话卖家归属获取在售商品和共享物品列表
    const [productResult, shareResult]: any[] = await Promise.allSettled([
      fetchAllSellerProducts(sellerIdToQuery),
      fetchAllUserShareItems(sellerIdToQuery)
    ])

    if (productResult.status === 'rejected') {
      console.warn('[Chat] 加载普通商品失败，继续显示共享物品:', productResult.reason)
    }
    if (shareResult.status === 'rejected') {
      console.warn('[Chat] 加载共享物品失败，继续显示普通商品:', shareResult.reason)
    }

    const productList = productResult.status === 'fulfilled' ? productResult.value : []
    const shareList = shareResult.status === 'fulfilled' ? shareResult.value : []

    const products = productList
      .filter((p: any) => isSelectableProductStatus(p.status))
      .map((p: any) => ({
        ...p,
        itemType: 'product',
        id: p.id || p.productId,
        coverImage: p.coverImage || p.coverImageUrl || p.image || '',
        title: p.title || '未命名商品',
        price: Number(firstDefined(p.price, p.amount, 0)),
        conditionText: firstDefined(p.conditionText, p.condition, p.location, '')
      }))

    const shareItems = shareList
      .map((item: any) => ({
        ...item,
        itemType: 'share',
        id: item.shareId || item.shareItemId || item.id,
        shareId: item.shareId || item.shareItemId || item.id,
        shareItemId: item.shareId || item.shareItemId || item.id,
        coverImage: item.coverImage || '',
        title: item.title || '未命名共享物品',
        price: Number(firstDefined(item.dailyRent, item.dailyRental, item.rentPrice, item.price, 0)),
        dailyRent: Number(firstDefined(item.dailyRent, item.dailyRental, item.rentPrice, item.price, 0)),
        deposit: Number(firstDefined(item.deposit, 0)),
        conditionText: firstDefined(item.availableTime, item.availableTimes, item.location, '')
      }))

    myProducts.value = [...products, ...shareItems]

    if (myProducts.value.length === 0) {
      uni.showToast({
        title: productPickerEmptyText.value,
        icon: 'none'
      })
      return
    }

    // 显示商品选择器
    showProductPickerModal.value = true
  } catch (error) {
    console.error('获取商品列表失败:', error)
    uni.showToast({
      title: '获取商品失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

function sendProductCard(product: any) {
  showProductPickerModal.value = false

  // 构建商品卡片消息
  const itemType = product.itemType || 'product'
  const itemId = itemType === 'share'
    ? firstDefined(product.shareId, product.shareItemId, product.id, product.productId)
    : firstDefined(product.productId, product.id)
  const price = itemType === 'share'
    ? firstDefined(product.dailyRent, product.dailyRental, product.rent, product.rentPrice, product.rentalPrice, product.price, 0)
    : firstDefined(product.price, product.amount, 0)
  const image = firstDefined(product.coverImage, product.coverImageUrl, product.image, product.shareItemCover, '')

  const productCard = normalizeProductCard({
    id: itemId,
    productId: itemType === 'product' ? itemId : undefined,
    shareId: itemType === 'share' ? itemId : undefined,
    shareItemId: itemType === 'share' ? itemId : undefined,
    itemType,
    title: product.title,
    price,
    dailyRent: itemType === 'share' ? price : undefined,
    deposit: itemType === 'share' ? firstDefined(product.deposit, product.depositAmount, 0) : undefined,
    image,
    coverImage: image,
    conditionText: firstDefined(product.conditionText, product.condition, product.availableTime, product.availableTimes, product.location, '')
  })

  sendProductMessage(productCard)
}

async function sendProductMessage(productCard: any) {
  // 检查黑名单状态
  if (isBlacklisted.value) {
    uni.showToast({
      title: '对方已在黑名单中，无法发送商品卡片',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 检查是否被对方拉黑
  const isBlocked = await checkIsBlockedBy()
  if (isBlocked) {
    // 被对方拉黑，创建本地消息不上传到服务器
    const tempMessage: Message = {
      id: Date.now().toString(),
      isSelf: true,
      type: 'product',
      content: productCard,
      timestamp: new Date().toISOString(),
      isNew: true,
      sendStatus: 'blocked',
      blockedByUser: true
    }

    messages.value.push(tempMessage)

    nextTick(() => {
      scrollToBottom()
    })

    // 显示提示
    uni.showToast({
      title: '对方已将你拉黑，商品卡片无法发送',
      icon: 'none',
      duration: 2000
    })

    return
  }

  // 如果没有会话ID，先创建会话
  if (!conversationId.value && targetUserId.value) {
    try {
      const res: any = await messageApi.createOrUpdateConversation(
        targetUserId.value,
        isShareCard(productCard) ? '' : productCard.id,
        orderId.value || '',
        isShareCard(productCard) ? productCard.id : (shareItemId.value || '')
      )
      if (res.data) {
        conversationId.value = res.data.conversationId
        messageService.setCurrentConversation(conversationId.value)
      } else {
        throw new Error('创建会话失败')
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      uni.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      })
      return
    }
  }

  // 再次检查conversationId
  if (!conversationId.value) {
    uni.showToast({
      title: '会话创建失败',
      icon: 'none'
    })
    return
  }

  // 先添加到本地列表
  const tempMessage: Message = {
    id: Date.now().toString(),
    isSelf: true,
    type: 'product',
    content: productCard,
    timestamp: new Date().toISOString(),
    isNew: true
  }
  messages.value.push(tempMessage)

  nextTick(() => {
    scrollToBottom()
  })

  // 发送到服务器
  try {
    const res: any = await messageApi.sendMessage({
      conversationId: conversationId.value,
      content: JSON.stringify(productCard),
      type: 3 // 商品卡片，使用数字类型
    })

    if (res.data) {
      // 更新本地消息ID
      const index = messages.value.findIndex(m => m.id === tempMessage.id)
      if (index !== -1) {
        messages.value[index].id = res.data.messageId?.toString() || res.data.id?.toString()
        // ID 更新后，重新触发滚动
        nextTick(() => {
          setTimeout(() => {
            scrollToBottom()
          }, 50)
        })
      }
    }
  } catch (error) {
    console.error('发送商品卡片失败:', error)
    uni.showToast({
      title: '发送失败',
      icon: 'none'
    })
    // 移除失败的消息
    const index = messages.value.findIndex(m => m.id === tempMessage.id)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }
}

function showEmoji() {
  showEmojiPanel.value = !showEmojiPanel.value
}

function selectEmoji(emoji: string) {
  inputText.value += emoji
  showEmojiPanel.value = false
}

function closeEmojiPanel() {
  showEmojiPanel.value = false
}

function goProduct(productId: any) {
  const card = typeof productId === 'object' ? productId : { id: productId }
  if (isShareCard(card)) {
    uni.navigateTo({
      url: `/pages/share/detail?id=${card.id}`
    })
    return
  }

  uni.navigateTo({
    url: `/pages/market/detail?id=${card.id}`
  })
}

function goOrder(orderId: any) {
  uni.navigateTo({
    url: `/pages/order/detail?id=${orderId}`
  })
}

function goBack() {
  // 退出聊天时通知消息列表刷新
  const app = getApp() as any
  if (app) {
    app.globalData.needRefreshConversationList = true
  }
  uni.navigateBack()
}

// 标记会话为已读
async function markConversationAsRead() {
  if (!conversationId.value) return

  try {
    await messageApi.markAsRead(conversationId.value)

    // 减少全局未读消息数
    if (appStore.unreadMessageCount > 0) {
      appStore.setUnreadMessageCount(Math.max(0, appStore.unreadMessageCount - 1))
    }

    // 更新 TabBar 徽章
    updateMessageBadge(appStore.getTotalUnreadCount())
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 页面卸载时清理
onUnmounted(() => {
  // 通知消息列表需要刷新
  const app = getApp() as any
  if (app) {
    app.globalData.needRefreshConversationList = true
  }

  // 清除当前会话ID
  messageService.clearCurrentConversation()

  // 清理消息监听
  messageEventBus.clearEvent(MessageEvents.NEW_MESSAGE)
  messageEventBus.clearEvent(MessageEvents.MESSAGE_RECALLED)
  messageEventBus.clearEvent(MessageEvents.TYPING)
})

// 检查黑名单状态
async function checkBlacklistStatus() {
  if (!targetUserId.value) return

  try {
    const result: any = await blacklistApi.isInBlacklist(targetUserId.value)
    // 处理返回值，可能是 boolean 或 { data: boolean }
    const isInBlacklist = typeof result === 'boolean' ? result : (result?.data || false)
    isBlacklisted.value = isInBlacklist

    console.log('[黑名单检查] targetUserId:', targetUserId.value, 'isInBlacklist:', isInBlacklist, '原始返回:', result)

    // 如果对方在黑名单中，显示提示（但不干扰用户操作）
    if (isBlacklisted.value) {
      console.log('[黑名单检查] 对方在黑名单中，禁用输入区域')
    }
  } catch (error) {
    console.error('检查黑名单状态失败:', error)
    isBlacklisted.value = false
  }
}

// 公共函数：检查当前用户是否被对方拉黑
async function checkIsBlockedBy(): Promise<boolean> {
  if (!targetUserId.value) return false

  try {
    const blockedResult: any = await blacklistApi.isBlockedBy(targetUserId.value)
    const isBlocked = typeof blockedResult === 'boolean' ? blockedResult : (blockedResult?.data || false)
    isBlockedBy.value = isBlocked

    console.log('[检查被拉黑] targetUserId:', targetUserId.value, 'isBlocked:', isBlocked, '原始返回:', blockedResult)
    return isBlocked
  } catch (error) {
    console.error('检查是否被对方拉黑失败:', error)
    return false
  }
}

function showMore() {
  const items = isBlacklisted.value
    ? ['查看用户资料', '清空聊天记录', '移出黑名单']
    : ['查看用户资料', '清空聊天记录', '加入黑名单']

  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          uni.navigateTo({
            url: `/pages/user/home?id=${targetUserId.value}`
          })
          break
        case 1:
          clearChatHistory()
          break
        case 2:
          if (isBlacklisted.value) {
            removeFromBlacklist()
          } else {
            addToBlacklist()
          }
          break
      }
    }
  })
}

function goTargetUserProfile() {
  if (!targetUserId.value) return

  uni.navigateTo({
    url: `/pages/user/home?id=${targetUserId.value}`
  })
}

function goCurrentUserProfile() {
  if (!currentUser.id) return

  uni.navigateTo({
    url: `/pages/user/home?id=${currentUser.id}`
  })
}

// 清空聊天记录
async function clearChatHistory() {
  if (!conversationId.value) {
    console.warn('[Chat] 会话ID为空，无法清空聊天记录')
    uni.showToast({
      title: '会话不存在',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '清空聊天记录',
    content: '确定要清空所有聊天记录吗？此操作不可恢复。',
    confirmText: '清空',
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          console.log('[Chat] 开始清空聊天记录, conversationId:', conversationId.value)

          // 调用后端API清空聊天记录
          await messageApi.clearMessages(conversationId.value)

          // 清空本地消息列表
          messages.value = []
          messagePage.value = 1
          hasMore.value = true

          console.log('[Chat] 聊天记录已清空')

          uni.showToast({
            title: '聊天记录已清空',
            icon: 'success'
          })

          // 通知消息列表刷新
          const app = getApp() as any
          if (app) {
            app.globalData.needRefreshConversationList = true
          }
        } catch (error) {
          console.error('[Chat] 清空聊天记录失败:', error)
          uni.showToast({
            title: '清空失败，请重试',
            icon: 'none'
          })
        }
      }
    }
  })
}

async function addToBlacklist() {
  if (!targetUserId.value) return

  uni.showModal({
    title: '加入黑名单',
    content: '加入黑名单后将无法接收该用户的消息，且输入区域将被禁用。如需再次发送消息，需先将用户移出黑名单。确定要继续吗？',
    confirmText: '确定加入',
    cancelText: '取消',
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          await blacklistApi.addToBlacklist(targetUserId.value)
          isBlacklisted.value = true
          // 清空输入框内容
          inputText.value = ''
          uni.showToast({
            title: '已加入黑名单，无法发送消息',
            icon: 'success',
            duration: 2000
          })
        } catch (error) {
          console.error('加入黑名单失败:', error)
          uni.showToast({
            title: '操作失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 显示被拉黑提示
function showBlockedTip() {
  uni.showModal({
    title: '无法发送消息',
    content: '对方已将你拉黑，你发送的消息无法送达对方。消息仅保存在本地，对方无法看到。',
    showCancel: false,
    confirmText: '我知道了'
  })
}

async function removeFromBlacklist() {
  if (!targetUserId.value) return

  uni.showModal({
    title: '移出黑名单',
    content: '确定要将该用户移出黑名单吗？移出后输入区域将恢复正常，可以正常接收和发送该用户的消息。',
    confirmText: '确定移出',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 直接使用新的API通过被拉黑用户ID移除黑名单
          await blacklistApi.removeFromBlacklistByBlockedUserId(targetUserId.value)
          isBlacklisted.value = false
          // 聚焦到输入框
          nextTick(() => {
            inputFocused.value = true
          })
          uni.showToast({
            title: '已移出黑名单，可以正常发送消息',
            icon: 'success',
            duration: 2000
          })
        } catch (error) {
          console.error('移除黑名单失败:', error)
          uni.showToast({
            title: '操作失败，请重试',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 切换关联信息卡片的展开/收缩状态
function toggleCard() {
  isCardExpanded.value = !isCardExpanded.value
}

// 跳转到关联信息（商品或订单详情）
function goToRelatedInfo() {
  if (relatedOrder.value) {
    // 跳转到订单详情
    uni.navigateTo({
      url: `/pages/order/detail?id=${relatedOrder.value.id}`
    })
  } else if (relatedProduct.value) {
    if (isShareCard(relatedProduct.value)) {
      uni.navigateTo({
        url: `/pages/share/detail?id=${relatedProduct.value.id}`
      })
      return
    }

    uni.navigateTo({
      url: `/pages/market/detail?id=${relatedProduct.value.id}`
    })
  }
}

// 获取订单状态文本
function getOrderStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待确认',
    1: '进行中',
    2: '已完成',
    3: '已取消',
    4: '已退款'
  }
  return statusMap[status] || '未知状态'
}

// 卖家确认订单
async function handleConfirmOrder() {
  if (!relatedOrder.value || !relatedOrder.value.id) return

  if (!relatedOrder.value.isSeller) {
    uni.showToast({
      title: '仅卖家可确认订单',
      icon: 'none'
    })
    return
  }

  try {
    const res = await orderApi.confirmOrder(relatedOrder.value.id)
    if (res.code === 200) {
      uni.showToast({
        title: '确认订单成功',
        icon: 'success'
      })

      if (relatedOrder.value) {
        relatedOrder.value.status = 1 // 进行中
      }
    }
  } catch (error) {
    console.error('[Chat] 确认订单失败:', error)
    uni.showToast({
      title: '确认订单失败，请重试',
      icon: 'none'
    })
  }
}

// 确认收货
async function handleConfirmReceive() {
  if (!relatedOrder.value || !relatedOrder.value.id) return

  if (!relatedOrder.value.isBuyer) {
    uni.showToast({
      title: '仅买家可确认收货',
      icon: 'none'
    })
    return
  }

  try {
    const res = await orderApi.completeOrder(relatedOrder.value.id)
    if (res.code === 200) {
      uni.showToast({
        title: '确认收货成功',
        icon: 'success'
      })

      // 更新订单状态
      if (relatedOrder.value) {
        relatedOrder.value.status = 2 // 已完成
      }
    }
  } catch (error) {
    console.error('[Chat] 确认收货失败:', error)
    uni.showToast({
      title: '确认收货失败，请重试',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
  animation: pageFadeIn 0.4s ease-out;
  overflow: hidden; // 防止整个页面滚动
  box-sizing: border-box;
}

// 黑名单提示
.blacklist-notice {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: var(--danger-color-alpha-8); // 使用纯色背景，提高兼容性
  border-bottom: 1px solid var(--danger-color-alpha-30);
  animation: slideDown 0.3s ease-out;

  .notice-text {
    flex: 1;
    margin-left: 12rpx;
    font-size: var(--font-size-sm);
    color: var(--error-color);
  }
}

// 关联信息悬浮卡片
.related-info-card {
  flex-shrink: 0;
  background: var(--bg-color-card);
  margin: 16rpx 24rpx;
  border-radius: 24rpx;
  box-shadow: 6rpx 6rpx 14rpx rgba(0, 0, 0, 0.05), -3rpx -3rpx 10rpx rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
  transition: all 0.3s ease;
  animation: slideDown 0.4s ease-out 0.1s backwards;
  z-index: 50;

  &.collapsed {
    .card-content {
      display: none;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    padding: 16rpx 20rpx;
    background: var(--bg-color-warm); // 使用纯色背景，提高兼容性
    border-bottom: 1px solid var(--primary-color-light);
    cursor: pointer;
    transition: background 0.2s ease;

    &:active {
      background: var(--primary-color-light); // 使用纯色背景，提高兼容性
    }

    .card-title-row {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 8rpx;

      .card-title {
        flex: 1;
        font-size: var(--font-size-base);
        font-weight: 600;
        color: var(--text-color-primary);
      }

      .expand-icon {
        transition: transform 0.3s ease;
      }
    }
  }

  .card-content {
    padding: 16rpx 20rpx;
    animation: fadeIn 0.3s ease-out;
    cursor: pointer;
    transition: background 0.2s ease;

    &:active {
      background: var(--bg-color-page);
    }

    .order-info-row,
    .product-info-row {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .info-thumb {
        position: relative;
        width: 96rpx;
        height: 96rpx;
        border-radius: var(--spacing-sm);
        flex-shrink: 0;
        overflow: hidden;
      }

      .info-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        min-width: 0;

        .info-no {
          font-size: var(--font-size-sm);
          color: var(--text-color-tertiary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .info-title {
          font-size: var(--font-size-base);
          color: var(--text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .info-price {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--error-color);
        }

        .info-subtitle {
          font-size: var(--font-size-sm);
          color: var(--text-color-secondary);
        }

        .order-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4rpx 12rpx;
          border-radius: 9999px;
          align-self: flex-start;

          &.status-0 {
            background: #fff7e6;
            .status-text {
              color: #fa8c16;
            }
          }

          &.status-1 {
            background: #e6f7ff;
            .status-text {
              color: var(--info-color);
            }
          }

          &.status-2 {
            background: #f6ffed;
            .status-text {
              color: var(--success-color);
            }
          }

          &.status-3,
          &.status-4 {
            background: var(--danger-color-alpha-6);
            .status-text {
              color: var(--error-color);
            }
          }

          .status-text {
            font-size: var(--font-size-sm);
            font-weight: 500;
          }
        }

        .confirm-receive-btn {
          margin-top: 12rpx;
          padding: 8rpx 24rpx;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
          color: var(--bg-color-card);
          border: none;
          border-radius: 9999px;
          font-size: var(--font-size-sm);
          font-weight: 500;
          align-self: flex-start;
          transition: all 0.3s ease;

          &:active {
            transform: scale(0.95);
            opacity: 0.8;
          }
        }
      }
    }
  }
}

.message-scroll {
  flex: 1;
  height: 0; // 重要：让flex子元素正确计算高度
  overflow-y: auto;
  padding: 24rpx;
  box-sizing: border-box;
  animation: fadeIn 0.5s ease-out 0.2s backwards;
}

.message-list {
  width: 100%;
  box-sizing: border-box;

  .message-item {
    margin-bottom: 32rpx;
    width: 100%;
    box-sizing: border-box;
    animation: messageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;

    .time-divider {
      text-align: center;
      margin-bottom: 16rpx;
      animation: fadeIn 0.3s ease-out;

      .time-text {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
        background: rgba(0, 0, 0, 0.05);
        padding: 8rpx 16rpx;
        border-radius: 4rpx;
      }
    }

    .message-content {
      display: flex;
      align-items: flex-start;
      width: 100%;
      box-sizing: border-box;

      .avatar {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
        flex-shrink: 0;

        &:active {
          transform: scale(0.95);
        }
      }

      .bubble {
        max-width: 480rpx;
        padding: 16rpx 24rpx;
        border-radius: var(--spacing-sm);
        word-wrap: break-word;
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        animation: bubblePop 0.3s ease-out backwards;

        &:active {
          transform: scale(0.98);
        }

        // 被拉黑状态
        &.blocked {
          border: 2rpx solid var(--error-color);
          box-shadow: 0 0 0 4rpx var(--danger-color-alpha-10);
        }

        // 气泡小三角
        &::before {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border: 12rpx solid transparent;
        }

        .text-message {
          font-size: var(--font-size-base);
          line-height: 1.6;
        }

        .image-message {
          max-width: 400rpx;
          border-radius: var(--spacing-sm);
          display: block;
        }

        .image-message-wrapper {
          display: flex;
          flex-direction: column;
          min-width: 200rpx;
        }

        .product-card {
          display: flex;
          padding: 16rpx;
          background: var(--bg-color-card);
          border-radius: 24rpx;
          box-shadow: 6rpx 6rpx 14rpx rgba(0, 0, 0, 0.05), -3rpx -3rpx 10rpx rgba(255, 255, 255, 0.8);
          border: 2rpx solid rgba(255, 255, 255, 0.8);
          min-width: 360rpx;

          .product-image {
            position: relative;
            width: 120rpx;
            height: 120rpx;
            border-radius: var(--spacing-sm);
            margin-right: 16rpx;
            background: var(--bg-color-page);
            overflow: hidden;
          }

          .product-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8rpx;
            min-width: 0;

            .product-title {
              font-size: var(--font-size-base);
              color: var(--text-color-primary);
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }

            .product-price {
              font-size: var(--font-size-lg);
              font-weight: 600;
              color: var(--error-color);
            }

            .share-rent {
              display: inline-flex;
              align-items: center;
              font-size: var(--font-size-lg);
              font-weight: 600;
              color: var(--error-color);
              line-height: 1.3;
            }

            .info-meta-row {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 12rpx;
            }

            .product-meta-row {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 12rpx;
            }

            .product-deposit {
              font-size: var(--font-size-xs);
              color: var(--text-color-secondary);
              white-space: nowrap;
            }

            .product-tag {
              font-size: var(--font-size-xs);
              color: var(--text-color-secondary);
              background: var(--bg-color-page);
              padding: 4rpx 10rpx;
              border-radius: 4rpx;
              white-space: nowrap;
            }

            .product-subtitle {
              font-size: var(--font-size-xs);
              color: var(--text-color-tertiary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }

        .order-card {
          padding: 16rpx;
          background: var(--bg-color-card);
          border-radius: 24rpx;
          box-shadow: 6rpx 6rpx 14rpx rgba(0, 0, 0, 0.05), -3rpx -3rpx 10rpx rgba(255, 255, 255, 0.8);
          border: 2rpx solid rgba(255, 255, 255, 0.8);

          .order-info {
            margin-bottom: 8rpx;

            .order-title {
              font-size: var(--font-size-sm);
              color: var(--text-color-tertiary);
            }

            .order-no {
              font-size: var(--font-size-base);
              color: var(--text-color-primary);
              margin-left: 8rpx;
            }
          }

          .order-price {
            font-size: var(--font-size-lg);
            font-weight: 600;
            color: var(--error-color);
          }
        }

        // 未知消息类型
        .unknown-message {
          padding: 12rpx;
          background: var(--warning-color-alpha-15);
          border-radius: var(--spacing-sm);

          .unknown-type {
            font-size: var(--font-size-sm);
            color: #856404;
            display: block;
            margin-bottom: 8rpx;
          }

          .unknown-content {
            font-size: var(--font-size-sm);
            color: var(--text-color-secondary);
            word-break: break-all;
            display: block;
          }
        }
      }
    }

    // 我的消息 - 消息气泡在左边，我的头像在右边
    &.self {
      .message-content {
        justify-content: flex-end;

        .bubble {
          background: var(--primary-color); // 使用纯色背景，提高兼容性
          color: var(--bg-color-card);
          border-radius: 24rpx 4rpx 24rpx 24rpx;
          border: 1rpx solid rgba(255, 255, 255, 0.2);
          box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.06);
          margin-right: 16rpx;

          &::before {
            right: -20rpx;
            border-left-color: var(--primary-color);
            border-right: none;
          }

          // 被拉黑状态
          &.blocked {
            border: 2rpx solid var(--error-color);
            box-shadow: 0 0 0 4rpx var(--danger-color-alpha-10);
          }
        }

        // 被拉黑警告图标（显示在消息左侧，气泡和头像之间）
        .blocked-warning-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48rpx;
          height: 48rpx;
          margin: 0 8rpx;
          background: var(--danger-color-alpha-10);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: center; // 垂直居中对齐
          flex-shrink: 0; // 防止被压缩

          &:active {
            transform: scale(0.9);
            background: var(--danger-color-alpha-20);
          }

          .icon {
            font-size: 32rpx;
            animation: pulse 2s ease-in-out infinite;
          }
        }
      }
    }

    // 对方消息 - 对方头像在左边，消息气泡在右边
    &.other {
      .message-content {
        justify-content: flex-start;

        .bubble {
          background: var(--bg-color-card);
          color: var(--text-color-primary);
          border-radius: 4rpx 24rpx 24rpx 24rpx;
          border: 2rpx solid rgba(255, 255, 255, 0.8);
          box-shadow: 6rpx 6rpx 14rpx rgba(0, 0, 0, 0.05), -3rpx -3rpx 10rpx rgba(255, 255, 255, 0.8);
          margin-left: 16rpx;

          &::before {
            left: -20rpx;
            border-right-color: var(--bg-color-card);
          }
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  animation: fadeIn 0.5s ease-out;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
    animation: float 3s ease-in-out infinite;
  }

  .empty-text {
    font-size: var(--font-size-base);
    color: var(--text-color-secondary);
    margin-bottom: 12rpx;
  }

  .empty-hint {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

.input-area {
  flex-shrink: 0; // 防止输入区域被压缩
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  padding-bottom: env(safe-area-inset-bottom);
  transition: all 0.3s ease;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s backwards;
  position: relative; // 确保输入区域固定在底部
  z-index: 99;

  &.input-focused {
    .input-bar {
      .message-input {
        background: var(--bg-color-card);
        box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06), inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.65), 0 0 0 2rpx var(--primary-color-light);
      }
    }
  }

  // 黑名单禁用状态
  &.disabled {
    background: var(--bg-color-page);
    border-top-color: var(--border-color-base);

    .input-bar {
      background: var(--bg-color-page);
      opacity: 0.6;

      .tool-btn {
        color: var(--text-color-placeholder);
        pointer-events: none;

        &:active {
          transform: none;
          background: transparent;
        }
      }

      .message-input {
        background: var(--border-color-base);
        color: var(--text-color-tertiary);
        pointer-events: none;
      }

      .send-btn {
        background: var(--text-color-placeholder) !important;
        color: var(--bg-color-card) !important;
        box-shadow: none !important;
        pointer-events: none;

        &:active {
          transform: none;
        }
      }
    }

    .blacklist-tip {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12rpx 24rpx;
      background: var(--danger-color-alpha-8);
      border-bottom: 1px solid var(--danger-color-alpha-30);
      animation: slideDown 0.3s ease-out;

      .tip-icon {
        font-size: 32rpx;
        margin-right: 8rpx;
      }

      .tip-text {
        font-size: var(--font-size-sm);
        color: var(--error-color);
        font-weight: 500;
      }
    }
  }

  .input-bar {
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    gap: 16rpx;
    transition: background 0.3s ease;

    .tool-btn {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease, transform 0.2s ease;

      &:active {
        transform: scale(0.9);
        background: var(--bg-color-page);
      }
    }

    .message-input {
      flex: 1;
      min-height: 40rpx;
      max-height: 200rpx;
      padding: 8rpx 24rpx;
      background: var(--bg-color-page);
      border-radius: 36rpx;
      box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04), inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
      font-size: var(--font-size-base);
      line-height: 1.5;
      transition: all 0.3s ease;

      // 确保在所有平台上都正确显示
      width: 0; // flex 布局下需要设置
    }

    .send-btn {
      width: 120rpx;
      height: 72rpx;
      line-height: 72rpx;
      padding: 0;
      background: var(--primary-color) !important;
      color: var(--bg-color-card) !important;
      font-size: var(--font-size-base);
      border-radius: 9999px;
      border: none !important;
      transition: all 0.2s ease;
      box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.08), -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.5);

      // 去掉小程序 button 默认描边，避免只剩轮廓
      &::after {
        border: none;
      }

      .send-text {
        color: var(--bg-color-card) !important;
        transition: transform 0.2s ease;
      }

      &:active:not([disabled]) {
        transform: scale(0.95);
        box-shadow: 1rpx 1rpx 4rpx rgba(0, 0, 0, 0.06), -1rpx -1rpx 3rpx rgba(255, 255, 255, 0.4);
      }

      &[disabled] {
        background: #b8c4d1 !important;
        color: var(--bg-color-card) !important;
        box-shadow: none;
        opacity: 1;

        .send-text {
          color: var(--bg-color-card) !important;
          opacity: 1;
        }
      }

      &.is-disabled {
        background: #b8c4d1 !important;
        color: var(--bg-color-card) !important;
        box-shadow: none;
        opacity: 1;

        .send-text {
          color: var(--bg-color-card) !important;
          opacity: 1;
        }
      }
    }
  }
}

// 动画关键帧
@keyframes pageFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bubblePop {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-4rpx);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(4rpx);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
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
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

// 表情面板弹窗样式
.emoji-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease-out;

  .emoji-content {
    width: 100%;
    max-height: 60vh;
    background: var(--bg-color-card);
    border-radius: 24rpx 24rpx 0 0;
    animation: slideUp 0.3s ease-out;
    display: flex;
    flex-direction: column;
  }

  .emoji-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    border-bottom: 1px solid var(--border-color-base);

    .emoji-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .emoji-close {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      &:active {
        background: var(--bg-color-page);
      }
    }
  }

  .emoji-list {
    flex: 1;
    padding: 16rpx 24rpx;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 16rpx;

    .emoji-item {
      font-size: 40rpx;
      text-align: center;
      padding: 12rpx;
      border-radius: 20rpx;
      box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04), -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
      background: var(--bg-color-card);
      transition: background 0.2s ease, transform 0.15s ease;

      &:active {
        background: var(--bg-color-page);
        transform: scale(0.92);
      }
    }
  }
}

// 商品选择器弹窗样式
.product-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease-out;

  .product-picker-content {
    width: 100%;
    max-height: 82vh;
    height: auto;
    background: var(--bg-color-card);
    border-radius: 24rpx 24rpx 0 0;
    animation: slideUp 0.3s ease-out;
    display: flex;
    flex-direction: column;
  }

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    border-bottom: 1px solid var(--border-color-base);

    .picker-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .picker-close {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      &:active {
        background: var(--bg-color-page);
      }
    }
  }

  .product-list {
    flex: 0 1 auto;
    max-height: calc(82vh - 112rpx);
    padding: 16rpx 24rpx;

    .product-item {
      display: flex;
      align-items: center;
      padding: 16rpx;
      background: var(--bg-color-card);
      border-radius: 24rpx;
      box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.04), -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.6);
      border: 1rpx solid rgba(255, 255, 255, 0.6);
      margin-bottom: 16rpx;
      transition: all 0.2s ease;

      &:active {
        background: var(--bg-color-page);
        transform: scale(0.97);
      }

      .product-thumb {
        position: relative;
        width: 96rpx;
        height: 96rpx;
        border-radius: var(--spacing-sm);
        margin-right: 16rpx;
        flex-shrink: 0;
        background: var(--bg-color-page);
        overflow: hidden;
      }

      .product-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        min-width: 0;

        .product-name {
          font-size: var(--font-size-base);
          color: var(--text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-price {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--error-color);
        }

        .product-picker-meta {
          display: flex;
          align-items: center;
          gap: 12rpx;
        }

        .product-type {
          font-size: var(--font-size-xs);
          color: var(--text-color-secondary);
          background: var(--bg-color-page);
          padding: 4rpx 10rpx;
          border-radius: 4rpx;
        }
      }
    }

    .empty-products {
      text-align: center;
      padding: 80rpx 0;
      color: var(--text-color-tertiary);
      font-size: var(--font-size-base);
    }
  }
}
</style>
