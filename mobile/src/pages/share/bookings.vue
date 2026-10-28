<template>
  <view class="bookings-page service-redesign-page" :style="themeStyle">
    <!-- Tab 切换 -->
    <view class="tab-bar page-animate" :class="{ 'animate-in': isAnimated }">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: currentTab === tab.value }]"
        :style="{ transitionDelay: currentTab === tab.value ? '0ms' : '50ms' }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
      <view
        class="tab-indicator"
        :style="{ left: currentTab === 'myBookings' ? '25%' : '75%' }"
      ></view>
    </view>

    <!-- 共享记录列表 -->
    <scroll-view
      class="booking-list"
      scroll-y
      :scroll-top="0"
      :scroll-with-animation="false"
      @scrolltolower="loadMore"
    >
      <!-- 加载状态 -->
      <view v-if="loading && bookingList.length === 0" class="loading-container">
        <view class="loading-animation">
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
        </view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 错误状态 -->
      <view v-else-if="error && bookingList.length === 0" class="error-container">
        <view class="error-icon">❌</view>
        <text class="error-text">{{ error }}</text>
        <button class="retry-btn" @click="loadBookings">重试</button>
      </view>

      <!-- 空状态 -->
      <view v-else-if="bookingList.length === 0 && !loading" class="empty-container">
        <image class="empty-image" src="/static/images/empty.png" mode="aspectFit" />
        <text class="empty-text">暂无共享记录</text>
      </view>

      <!-- 共享记录卡片列表 -->
      <transition-group name="booking-fade">
        <view
          v-for="(booking, index) in bookingList"
          :key="booking.id || booking.bookingId"
          class="booking-card"
          :style="{ 'animation-delay': `${index * 50}ms` }"
        >
          <!-- 物品信息 -->
          <view class="item-info" @click="goToShareDetail(booking.shareItemId || booking.shareId)">
            <lazy-image
              class="item-image"
              :src="booking.shareItemCover || booking.coverImage"
              mode="aspectFit"
              width="100"
              height="100"
              :disable-lazy-load="true"
              error-icon="gift"
            />
            <view class="item-details">
              <text class="item-title">{{ booking.shareItemTitle || booking.title }}</text>
              <view class="item-price">
                <text class="price-symbol">¥</text>
                <text class="price-value">{{ booking.totalAmount || booking.deposit }}</text>
                <text class="price-unit">/ {{ booking.days }}天</text>
              </view>
            </view>
          </view>

          <!-- 共享信息 -->
          <view class="booking-info">
            <view class="info-row">
              <text class="info-label">借用时间：</text>
              <text class="info-value">{{ formatDateRange(booking) }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">押金：</text>
              <text class="info-value">¥{{ booking.deposit }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">创建时间：</text>
              <text class="info-value">{{ booking.createdAt }}</text>
            </view>
          </view>

          <!-- 状态标签 -->
          <view class="status-section">
            <view :class="['status-tag', `status-${booking.status}`]">
              {{ getStatusText(booking.status) }}
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="action-section">
            <!-- 待审批 - 借用者操作 -->
            <template v-if="currentTab === 'myBookings' && booking.status === 0">
              <button class="action-btn cancel-btn" @click="cancelBooking(booking.bookingId)">取消申请</button>
            </template>

            <!-- 已批准 - 借用者操作 -->
            <template v-if="currentTab === 'myBookings' && booking.status === 1">
              <button class="action-btn approve-btn" @click="payBooking(booking.bookingId)">去支付</button>
            </template>

            <!-- 待审批 - 所有者操作 -->
            <template v-if="currentTab === 'receivedBookings' && booking.status === 0">
              <button class="action-btn approve-btn" @click="approveBooking(booking.bookingId)">同意借用</button>
              <button class="action-btn reject-btn" @click="rejectBooking(booking.bookingId)">拒绝</button>
            </template>

            <!-- 借用中 - 所有者操作 -->
            <template v-if="currentTab === 'receivedBookings' && booking.status === 4">
              <button class="action-btn confirm-btn" @click="confirmReturn(booking.bookingId)">确认归还</button>
            </template>

            <!-- 已完成 - 所有者操作（退还押金） -->
            <template v-if="currentTab === 'receivedBookings' && booking.status === 5 && !booking.depositReturned">
              <button class="action-btn deposit-btn" @click="returnDeposit(booking.bookingId)">退还押金</button>
            </template>

            <!-- 已完成/已取消/已拒绝 - 查看详情 -->
            <template v-if="booking.status === 3 || booking.status === 2 || booking.status === 5">
              <button class="action-btn detail-btn" @click="viewDetail(booking.bookingId)">查看详情</button>
            </template>
          </view>
        </view>
      </transition-group>

      <!-- 加载更多 -->
      <view v-if="hasMore && !loading && bookingList.length > 0" class="load-more">
        <view class="load-more-text">上拉加载更多</view>
      </view>
      <view v-if="loading && bookingList.length > 0" class="load-more">
        <view class="loading-more">
          <view class="loading-more-dot"></view>
          <view class="loading-more-dot"></view>
          <view class="loading-more-dot"></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { shareApi } from '@/api/share'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { onShow } from '@dcloudio/uni-app'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { themeStyle } = useThemeStyle()
const { primaryColor, successColor, warningColor, dangerColor } = useThemeColors()

const tabs = ref([
  { label: '我借用的', value: 'myBookings' },
  { label: '借我物品的', value: 'receivedBookings' }
])

const currentTab = ref('myBookings')
const isAnimated = ref(false)
const bookingList = ref<any[]>([])
const displayList = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loading = ref(false)
const error = ref<string | null>(null)
const isTabSwitching = ref(false)

onShow(() => {
  useThemePage()
})


onMounted(() => {
  loadBookings()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

function switchTab(value: string) {
  if (currentTab.value === value || isTabSwitching.value) return

  isTabSwitching.value = true
  currentTab.value = value

  // 先淡出当前列表
  displayList.value = []

  // 等待动画完成后重新加载
  setTimeout(() => {
    page.value = 1
    bookingList.value = []
    hasMore.value = true
    error.value = null
    loadBookings()
  }, 200)
}

function loadBookings() {
  if (loading.value) return

  loading.value = true
  error.value = null

  const apiMethod = currentTab.value === 'myBookings'
    ? shareApi.getMyBookings
    : shareApi.getReceivedBookings

  const requestParams = {
    page: page.value,
    pageSize: pageSize.value
  }

  console.log('[Bookings] 开始加载:', {
    tab: currentTab.value,
    tabLabel: currentTab.value === 'myBookings' ? '我借用的(我是借用者)' : '借我物品的(我是所有者)',
    apiMethod: currentTab.value === 'myBookings' ? 'getMyBookings(borrower_id)' : 'getReceivedBookings(owner_id)',
    params: requestParams
  })

  apiMethod(requestParams).then((response: any) => {
    console.log('[Bookings] API 响应:', response)

    const data = response.data || response || {}
    const newList = data.list || data.records || []

    console.log('[Bookings] 解析后的数据:', {
      list: newList,
      total: data.total || 0,
      currentPage: page.value
    })

    if (page.value === 1) {
      bookingList.value = newList
      // 首次加载时，逐个显示卡片
      staggerShowItems(newList)
    } else {
      bookingList.value.push(...newList)
      displayList.value = [...bookingList.value]
    }

    hasMore.value = bookingList.value.length < (data.total || 0)
    error.value = null
  }).catch((err: any) => {
    console.error('[Bookings] 加载失败:', err)
    if (page.value === 1) {
      error.value = '加载失败，请稍后重试'
      bookingList.value = []
      displayList.value = []
    }
    hasMore.value = false
  }).finally(() => {
    loading.value = false
    isTabSwitching.value = false
  })
}

// 逐个显示卡片动画
function staggerShowItems(items: any[]) {
  displayList.value = []
  if (items.length === 0) {
    displayList.value = items
    return
  }

  // 每次添加一个项目，创建阶梯效果
  items.forEach((item, index) => {
    setTimeout(() => {
      displayList.value.push(item)
    }, index * 80)
  })
}

function loadMore() {
  if (!hasMore.value) return
  page.value++
  loadBookings()
}

function getStatusText(status: number): string {
  // 与后端状态码保持一致
  const statusMap: Record<number, string> = {
    0: '待审批',
    1: '已批准',
    2: '已拒绝',
    3: '已取消',
    4: '借用中',
    5: '已完成'
  }
  return statusMap[status] || '未知'
}

function formatDateRange(booking: any): string {
  // 兼容多种字段名
  const startDate = booking.startDate || booking.start_date || booking.startTime || booking.start_time || ''
  const endDate = booking.endDate || booking.end_date || booking.endTime || booking.end_time || ''

  // 如果是数组，取第一个元素
  const start = Array.isArray(startDate) ? (startDate[0] || '') : startDate
  const end = Array.isArray(endDate) ? (endDate[0] || '') : endDate

  // 格式化日期显示
  if (start && end) {
    return `${formatDate(start)} 至 ${formatDate(end)}`
  } else if (start) {
    return formatDate(start)
  } else {
    return '暂无'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''

  // 处理各种日期格式
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      // 如果日期解析失败，直接返回原字符串
      return dateStr
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch {
    return dateStr
  }
}

function goToShareDetail(shareItemId: string) {
  uni.navigateTo({
    url: `/pages/share/detail?id=${shareItemId}`
  })
}

function cancelBooking(bookingId: string) {
  uni.showModal({
    title: '提示',
    content: '确定要取消这个借用申请吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.cancelBooking(bookingId).then(() => {
          uni.showToast({ title: '已取消借用', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '取消失败', icon: 'none' })
        })
      }
    }
  })
}

function approveBooking(bookingId: string) {
  uni.showModal({
    title: '同意借用',
    content: '确定同意这个借用申请吗？同意后借用者需要支付租金和押金。',
    success: (res) => {
      if (res.confirm) {
        shareApi.approveBooking({
          bookingId,
          status: 1  // 1-批准
        }).then(() => {
          uni.showToast({ title: '已同意借用', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function payBooking(bookingId: string) {
  uni.navigateTo({
    url: `/pages/share/booking-detail?id=${bookingId}`
  })
}

function rejectBooking(bookingId: string) {
  uni.showModal({
    title: '拒绝借用',
    content: '确定要拒绝这个借用申请吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.rejectBooking({
          bookingId
        }).then(() => {
          uni.showToast({ title: '已拒绝借用', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function confirmReturn(bookingId: string) {
  uni.showModal({
    title: '确认归还',
    content: '请确认对方已归还物品且物品完好',
    editable: true,
    placeholderText: '归还备注（可选）',
    success: (res) => {
      if (res.confirm) {
        shareApi.confirmReturn({
          bookingId,
          returnRemark: res.content || ''
        }).then(() => {
          uni.showToast({ title: '确认归还成功', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function returnDeposit(bookingId: string) {
  uni.showModal({
    title: '退还押金',
    content: '确定要退还押金吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.returnDeposit(bookingId).then(() => {
          uni.showToast({ title: '押金已退还', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function viewDetail(bookingId: string) {
  uni.navigateTo({
    url: `/pages/share/booking-detail?id=${bookingId}`
  })
}

function refreshList() {
  page.value = 1
  bookingList.value = []
  loadBookings()
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

.bookings-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
  animation: page-fade-in 0.3s ease-out;
  padding-bottom: env(safe-area-inset-bottom);
}

@keyframes page-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// 指示器弹跳动画
@keyframes indicatorBounce {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(1.2); }
  100% { transform: scaleX(1); }
}

.tab-bar {
  display: flex;
  background: var(--bg-color-card);
  margin: var(--spacing-sm) var(--spacing-lg);
  border-radius: 20rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color-light);
  overflow: hidden;
  position: relative;
  z-index: 10;

  .tab-item {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-base);
    color: var(--text-color-secondary);
    position: relative;
    z-index: 2;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(0.97);
    }

    &.active {
      color: var(--primary-color);
      font-weight: 600;
      background: linear-gradient(
        180deg,
        var(--primary-color-alpha-8) 0%,
        var(--primary-color-alpha-5) 100%
      );
    }
  }

  .tab-indicator {
    position: absolute;
    bottom: 0;
    width: 48rpx;
    height: 4rpx;
    background: var(--primary-color);
    border-radius: var(--border-radius-sm);
    transform: translateX(-50%);
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2rpx 10rpx var(--primary-color-alpha-30);
  }
}

.booking-list {
  flex: 1;
  padding: 16rpx;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
}

.booking-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  border-radius: 20rpx;
  border: 1px solid var(--border-color-light);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  animation: booking-card-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  .item-info {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;

    .item-image {
      width: 120rpx;
      height: 120rpx;
      border-radius: var(--spacing-sm);
      flex-shrink: 0;
      background: var(--bg-color-page);
      transition: transform 0.3s ease;

      &:active {
        transform: scale(0.95);
      }
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .item-title {
        font-size: var(--font-size-base);
        font-weight: 500;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        animation: text-fade-in 0.5s ease 0.1s backwards;
      }

      .item-price {
        display: flex;
        align-items: baseline;
        gap: 4rpx;
        animation: price-slide-up 0.4s ease 0.2s backwards;

        .price-symbol {
          font-size: var(--font-size-base);
          color: var(--primary-color);
          font-weight: 600;
        }

        .price-value {
          font-size: var(--font-size-xxl);
          color: var(--primary-color);
          font-weight: 600;
        }

        .price-unit {
          font-size: var(--font-size-sm);
          color: var(--text-color-tertiary);
        }
      }
    }
  }

  .booking-info {
    background: var(--bg-color-page);
    border-radius: var(--spacing-sm);
    padding: 16rpx;
    margin-bottom: 16rpx;
    animation: info-fade-in 0.3s ease 0.15s backwards;

    .info-row {
      display: flex;
      font-size: var(--font-size-sm);
      margin-bottom: 8rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        color: var(--text-color-tertiary);
        width: 140rpx;
        flex-shrink: 0;
      }

      .info-value {
        color: var(--text-color-primary);
        flex: 1;
      }
    }
  }

  .status-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16rpx;
    animation: status-pop-in 0.3s ease 0.25s backwards;

    .status-tag {
      padding: 6rpx 16rpx;
      border-radius: 9999px;
      font-size: var(--font-size-sm);
      font-weight: 600;

      &.status-0 {
        background: var(--bg-color-warm);
        color: var(--warning-color);
      }

      &.status-1 {
        background: var(--info-color-alpha-10);
        color: var(--info-color);
      }

      &.status-2 {
        background: var(--danger-color-alpha-6);
        color: var(--danger-color);
      }

      &.status-3 {
        background: var(--bg-color-page);
        color: var(--text-color-tertiary);
      }

      &.status-4 {
        background: var(--success-color-alpha-10);
        color: var(--success-color);
      }

      &.status-5 {
        background: var(--primary-color-alpha-5);
        color: var(--primary-color);
      }

      &.status--1 {
        background: var(--bg-color-page);
        color: var(--text-color-tertiary);
      }
    }
  }

  .action-section {
    display: flex;
    gap: 12rpx;
    justify-content: flex-end;
    animation: actions-slide-up 0.3s ease 0.3s backwards;

    .action-btn {
      min-width: 140rpx;
      height: 56rpx;
      line-height: 56rpx;
      border-radius: 9999px;
      font-size: var(--font-size-sm);
      border: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:nth-child(1) {
        animation-delay: 0.3s;
      }

      &:nth-child(2) {
        animation-delay: 0.35s;
      }

      &:active {
        transform: scale(0.92);
      }

      &.cancel-btn,
      &.reject-btn {
        background: var(--bg-color-card);
        border: 1px solid var(--border-color-base);
        color: var(--text-color-secondary);
      }

      &.approve-btn,
      &.confirm-btn,
      &.deposit-btn {
        background: var(--primary-color);
        color: var(--bg-color-card);
        box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
      }

      &.detail-btn {
        background: var(--bg-color-card);
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
      }
    }
  }
}

// 动画关键帧
@keyframes booking-card-enter {
  0% {
    opacity: 0;
    transform: translateY(30rpx) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes text-fade-in {
  from {
    opacity: 0;
    transform: translateX(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes price-slide-up {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes info-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes status-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes actions-slide-up {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes button-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// 加载动画
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  animation: fade-in 0.3s ease;
}

.loading-animation {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.loading-dot {
  width: 16rpx;
  height: 16rpx;
  background: var(--primary-color);
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: var(--font-size-base);
  color: var(--text-color-tertiary);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

// 加载更多
.loading-more {
  display: flex;
  justify-content: center;
  padding: 24rpx 0;
}

.loading-more-dot {
  width: 12rpx;
  height: 12rpx;
  background: var(--text-color-tertiary);
  border-radius: 50%;
  margin: 0 6rpx;
  animation: loading-more-bounce 1.4s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
}

@keyframes loading-more-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
  }
  40% {
    transform: scale(1);
  }
}

.load-more {
  padding: 24rpx 0;
  text-align: center;
}

.load-more-text {
  font-size: var(--font-size-sm);
  color: var(--text-color-tertiary);
}

// 空状态
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  animation: fade-in 0.5s ease;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: var(--font-size-base);
  color: var(--text-color-tertiary);
}

// 错误状态
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  gap: 24rpx;
  animation: shake-in 0.5s ease;
}

@keyframes shake-in {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10rpx);
  }
  75% {
    transform: translateX(10rpx);
  }
}

.error-icon {
  font-size: 80rpx;
  animation: error-shake 0.5s ease;
}

@keyframes error-shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.error-text {
  font-size: var(--font-size-base);
  color: var(--text-color-tertiary);
}

.retry-btn {
  min-width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: var(--primary-color);
  color: var(--bg-color-card);
  font-size: var(--font-size-base);
  border-radius: 36rpx;
  border: none;
  transition: all 0.2s ease;
  animation: button-pop-in 0.3s ease 0.2s backwards;

  &:active {
    transform: scale(0.95);
    background: #e65f00;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// Vue 过渡动画
.booking-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.booking-fade-leave-active {
  transition: all 0.3s ease;
}

.booking-fade-enter-from {
  opacity: 0;
  transform: translateY(30rpx) scale(0.95);
}

.booking-fade-leave-to {
  opacity: 0;
  transform: translateX(-30rpx);
}

.booking-fade-move {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
