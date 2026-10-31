<template>
  <view class="booking-detail-page service-redesign-page" :style="themeStyle">
    <scroll-view
      class="scroll-view detail-scroll"
      scroll-y
      :scroll-top="0"
      :scroll-with-animation="false"
      v-if="!loading && bookingDetail"
    >
      <view class="detail-content">
        <!-- 状态总览 -->
        <view class="status-card booking-card" :class="'status-' + bookingDetail.status">
          <view class="status-main">
            <view class="status-icon">
              <uni-icons :type="getStatusIcon(bookingDetail.status)" size="34" color="#FFFFFF" />
            </view>
            <view class="status-info">
              <text class="status-label">{{ isOwner ? '收到的借用申请' : '我的借用申请' }}</text>
              <text class="status-text">{{ getStatusText(bookingDetail.status) }}</text>
              <text class="status-desc">{{ getStatusDesc(bookingDetail.status) }}</text>
            </view>
          </view>
          <view class="status-pill">
            <view class="status-dot"></view>
            <text>{{ getStatusText(bookingDetail.status) }}</text>
          </view>
        </view>

        <!-- 金额概览 -->
        <view class="amount-grid booking-card">
        <view class="amount-item primary">
            <text class="amount-label">总金额</text>
            <text class="amount-value">¥{{ bookingDetail.totalAmount }}</text>
          </view>
          <view class="amount-item">
            <text class="amount-label">总租金</text>
            <text class="amount-value">¥{{ bookingDetail.totalRent }}</text>
          </view>
          <view class="amount-item">
            <text class="amount-label">押金</text>
            <text class="amount-value">¥{{ bookingDetail.deposit }}</text>
          </view>
        </view>

        <!-- 物品信息 -->
        <view class="section-card booking-card">
          <view class="section-header">
            <view class="section-title-wrap">
              <view class="title-icon"></view>
              <text class="section-title">共享物品</text>
            </view>
          </view>
          <view class="item-info" @click="goToShareDetail">
            <lazy-image class="item-image" :src="bookingDetail.shareItemCover" error-icon="gift" mode="aspectFill" width="176" height="176" />
            <view class="item-details">
              <text class="item-title">{{ bookingDetail.shareItemTitle }}</text>
              <view class="item-meta">
                <view class="meta-chip">
                  <uni-icons type="calendar" size="13" color="var(--primary-color)" />
                  <text>{{ bookingDetail.days }}天</text>
                </view>
                <view class="meta-chip">
                  <uni-icons type="wallet" size="13" color="var(--primary-color)" />
                  <text>押金 ¥{{ bookingDetail.deposit }}</text>
                </view>
              </view>
            </view>
            <uni-icons type="right" size="16" color="#B8C0CC" />
          </view>
        </view>

        <!-- 借用信息 -->
        <view class="section-card booking-card">
          <view class="section-header">
            <view class="section-title-wrap">
              <view class="title-icon"></view>
              <text class="section-title">借用安排</text>
            </view>
          </view>
          <view class="schedule-panel">
            <view class="schedule-icon">
              <uni-icons type="calendar-filled" size="22" color="#FFFFFF" />
            </view>
            <view class="schedule-content">
              <text class="schedule-label">借用时间</text>
              <text class="schedule-value">{{ formatDateRange(bookingDetail.startDate, bookingDetail.endDate) }}</text>
            </view>
          </view>
          <view class="info-list compact">
            <view class="info-item">
              <text class="info-label">借用天数</text>
              <text class="info-value">{{ bookingDetail.days }}天</text>
            </view>
            <view class="info-item">
              <text class="info-label">日租金</text>
              <text class="info-value">¥{{ bookingDetail.dailyRent }}/天</text>
            </view>
          </view>
        </view>

        <!-- 用户信息 -->
        <view class="section-card booking-card">
          <view class="section-header">
            <view class="section-title-wrap">
              <view class="title-icon"></view>
              <text class="section-title">{{ isOwner ? '借用者信息' : '所有者信息' }}</text>
            </view>
          </view>
          <view class="user-info" @click="goToUserHome">
            <UserAvatar
              class="user-avatar"
              :src="isOwner ? bookingDetail.borrowerAvatar : bookingDetail.ownerAvatar"
              :width="96"
              :height="96"
              shape="circle"
            />
            <view class="user-details">
              <text class="user-name">{{ isOwner ? bookingDetail.borrowerNickname : bookingDetail.ownerNickname }}</text>
              <text class="user-role">{{ isOwner ? '申请借用你的物品' : '物品发布者' }}</text>
            </view>
            <uni-icons type="right" size="16" color="#B8C0CC" />
          </view>
          <view class="action-btns">
            <button class="chat-btn" @click="goChat">
              <uni-icons type="chatbubble" size="16" :color="primaryColor" />
              <text>联系TA</text>
            </button>
          </view>
        </view>

        <!-- 备注信息 -->
        <view class="section-card booking-card" v-if="bookingDetail.remark || bookingDetail.approveRemark || bookingDetail.returnRemark">
          <view class="section-header">
            <view class="section-title-wrap">
              <view class="title-icon"></view>
              <text class="section-title">备注说明</text>
            </view>
          </view>
          <view class="remark-list">
            <view class="remark-block" v-if="bookingDetail.remark">
              <text class="remark-label">申请备注</text>
              <text class="remark-text">{{ bookingDetail.remark }}</text>
            </view>
            <view class="remark-block" v-if="bookingDetail.approveRemark">
              <text class="remark-label">审批备注</text>
              <text class="remark-text">{{ bookingDetail.approveRemark }}</text>
            </view>
            <view class="remark-block" v-if="bookingDetail.returnRemark">
              <text class="remark-label">归还备注</text>
              <text class="remark-text">{{ bookingDetail.returnRemark }}</text>
            </view>
          </view>
        </view>

        <!-- 时间信息 -->
        <view class="section-card booking-card">
          <view class="section-header">
            <view class="section-title-wrap">
              <view class="title-icon"></view>
              <text class="section-title">时间记录</text>
            </view>
          </view>
          <view class="timeline">
            <view class="timeline-item" v-if="bookingDetail.createdAt">
              <view class="timeline-dot active"></view>
              <view class="timeline-content">
                <text class="timeline-title">创建时间</text>
                <text class="timeline-time">{{ bookingDetail.createdAt }}</text>
              </view>
            </view>
            <view class="timeline-item" v-if="bookingDetail.approveTime">
              <view class="timeline-dot active"></view>
              <view class="timeline-content">
                <text class="timeline-title">审批时间</text>
                <text class="timeline-time">{{ bookingDetail.approveTime }}</text>
              </view>
            </view>
            <view class="timeline-item" v-if="bookingDetail.payTime">
              <view class="timeline-dot active"></view>
              <view class="timeline-content">
                <text class="timeline-title">支付时间</text>
                <text class="timeline-time">{{ bookingDetail.payTime }}</text>
              </view>
            </view>
            <view class="timeline-item" v-if="bookingDetail.returnTime">
              <view class="timeline-dot active"></view>
              <view class="timeline-content">
                <text class="timeline-title">归还时间</text>
                <text class="timeline-time">{{ bookingDetail.returnTime }}</text>
              </view>
            </view>
            <view class="timeline-item" v-if="bookingDetail.depositReturnTime">
              <view class="timeline-dot active"></view>
              <view class="timeline-content">
                <text class="timeline-title">押金退还时间</text>
                <text class="timeline-time">{{ bookingDetail.depositReturnTime }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="bottom-actions" v-if="showActions">
        <!-- 待审批 - 借用者操作 -->
        <template v-if="!isOwner && bookingDetail.status === 0">
          <button class="action-btn cancel" @click="cancelBooking">取消申请</button>
        </template>

        <!-- 待审批 - 所有者操作 -->
        <template v-if="isOwner && bookingDetail.status === 0">
          <button class="action-btn reject" @click="rejectBooking">拒绝</button>
          <button class="action-btn approve" @click="approveBooking">同意借用</button>
        </template>

        <!-- 已批准 - 借用者操作（支付租金和押金） -->
        <template v-if="!isOwner && bookingDetail.status === 1">
          <button class="action-btn pay-deposit" @click="payBooking">支付租金和押金</button>
        </template>

        <!-- 借用中 - 所有者操作 -->
        <template v-if="isOwner && bookingDetail.status === 4">
          <button class="action-btn confirm-return" @click="confirmReturn">确认归还</button>
        </template>

        <!-- 已完成 - 所有者操作 -->
        <template v-if="isOwner && bookingDetail.status === 5 && !bookingDetail.depositReturned">
          <button class="action-btn return-deposit" @click="returnDeposit">退还押金</button>
        </template>
      </view>
    </scroll-view>

    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-animation">
        <view class="loading-dot"></view>
        <view class="loading-dot"></view>
        <view class="loading-dot"></view>
      </view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view class="error-container" v-if="error">
      <view class="error-icon">
        <uni-icons type="info" size="52" color="var(--danger-color)" />
      </view>
      <text class="error-text">{{ error }}</text>
      <button class="retry-btn" @click="loadBookingDetail">重试</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { shareApi } from '@/api/share'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { useThemeStyle, useThemeColors, useThemePage } from '@/utils/theme'
import { useUserStore } from '@/store/user'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()
const userStore = useUserStore()

// 启用服务页面导航
useServiceNavigation()

const bookingDetail = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const bookingId = ref<string>('')
const currentUserId = ref<string>('')
let hasLoadedOnce = false

onShow(() => {
  useThemePage()
  if (hasLoadedOnce && bookingId.value) {
    loadBookingDetail()
  }
})

onLoad(async (options) => {
  bookingId.value = options?.id || options?.bookingId || ''

  if (bookingId.value) {
    await loadBookingDetail()
    hasLoadedOnce = true
  } else {
    error.value = '预约ID不存在'
    loading.value = false
  }
})

async function loadBookingDetail() {
  if (!bookingId.value) return

  loading.value = true
  error.value = null

  try {
    const response = await shareApi.getBookingDetail(bookingId.value)
    const data = response.data
    bookingDetail.value = data

    // 从用户 Store 获取当前登录用户ID
    currentUserId.value = String(userStore.userInfo?.userId || '')

    console.log('[BookingDetail] 预约详情:', bookingDetail.value)
  } catch (err: any) {
    console.error('[BookingDetail] 加载失败:', err)
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 判断当前用户是所有者还是借用者
const isOwner = computed(() => {
  if (!bookingDetail.value) return false
  return currentUserId.value === bookingDetail.value.ownerId
})

const counterpartyId = computed(() => {
  if (!bookingDetail.value) return ''
  return isOwner.value ? bookingDetail.value.borrowerId : bookingDetail.value.ownerId
})

// 是否显示操作按钮
const showActions = computed(() => {
  if (!bookingDetail.value) return false
  const status = bookingDetail.value.status
  // 待审批、已批准、借用中、已完成且未退还押金时显示操作按钮
  return [0, 1, 4].includes(status) || (status === 5 && !bookingDetail.value.depositReturned)
})

function getStatusIcon(status: number): string {
  const iconMap: Record<number, string> = {
    0: 'clock',
    1: 'checkmarkempty',
    2: 'closeempty',
    3: 'info',
    4: 'loop',
    5: 'checkbox-filled'
  }
  return iconMap[status] || 'info'
}

function getStatusColor(status: number): string {
  const colorMap: Record<number, string> = {
    0: '#fa8c16',
    1: 'var(--success-color)',
    2: '#f5222d',
    3: '#999',
    4: 'var(--info-color)',
    5: '#722ed1'
  }
  return colorMap[status] || '#999'
}

function getStatusText(status: number): string {
  const textMap: Record<number, string> = {
    0: '待审批',
    1: '已批准',
    2: '已拒绝',
    3: '已取消',
    4: '借用中',
    5: '已完成'
  }
  return textMap[status] || '未知'
}

function getStatusDesc(status: number): string {
  const descMap: Record<number, string> = {
    0: '等待所有者审批您的借用申请',
    1: '所有者已同意，请支付租金和押金后开始借用',
    2: '所有者拒绝了您的借用申请',
    3: '您已取消该借用申请',
    4: '借用中，请按时归还物品',
    5: '借用已完成'
  }
  return descMap[status] || ''
}

function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return '暂无'

  const format = (date: string) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const start = format(startDate || '')
  const end = format(endDate || '')

  if (start && end) {
    return `${start} 至 ${end}`
  } else if (start) {
    return start
  } else {
    return end
  }
}

function goToShareDetail() {
  if (!bookingDetail.value?.shareId) return
  uni.navigateTo({
    url: `/pages/share/detail?id=${bookingDetail.value.shareId}`
  })
}

function goToUserHome() {
  if (!counterpartyId.value) return
  uni.navigateTo({
    url: `/pages/user/home?id=${counterpartyId.value}`
  })
}

function goChat() {
  if (!userStore.checkLogin()) return
  if (!counterpartyId.value) return
  uni.navigateTo({
    url: `/pages/message/chat?userId=${counterpartyId.value}&shareItemId=${bookingDetail.value.shareId}`
  })
}

function cancelBooking() {
  uni.showModal({
    title: '取消申请',
    content: '确定要取消这个借用申请吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.cancelBooking(bookingId.value).then(() => {
          uni.showToast({ title: '已取消申请', icon: 'success' })
          loadBookingDetail()
        }).catch(() => {
          uni.showToast({ title: '取消失败', icon: 'none' })
        })
      }
    }
  })
}

function approveBooking() {
  uni.showModal({
    title: '同意借用',
    content: '确定同意这个借用申请吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.approveBooking({
          bookingId: bookingId.value,
          status: 1
        }).then(() => {
          uni.showToast({ title: '已同意', icon: 'success' })
          loadBookingDetail()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function rejectBooking() {
  uni.showModal({
    title: '拒绝借用',
    content: '确定要拒绝这个借用申请吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.rejectBooking({
          bookingId: bookingId.value
        }).then(() => {
          uni.showToast({ title: '已拒绝', icon: 'success' })
          loadBookingDetail()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function payBooking() {
  uni.showModal({
    title: '支付租金和押金',
    content: `总租金 ¥${bookingDetail.value?.totalRent || 0}，押金 ¥${bookingDetail.value?.deposit || 0}，合计 ¥${bookingDetail.value?.totalAmount || 0}`,
    success: (res) => {
      if (res.confirm) {
        shareApi.payBooking(bookingId.value).then(() => {
          uni.showToast({ title: '支付成功', icon: 'success' })
          loadBookingDetail()
        }).catch(() => {
          uni.showToast({ title: '支付失败', icon: 'none' })
        })
      }
    }
  })
}

function confirmReturn() {
  uni.showModal({
    title: '确认归还',
    content: '请确认对方已归还物品且物品完好',
    success: (res) => {
      if (res.confirm) {
        shareApi.confirmReturn({
          bookingId: bookingId.value
        }).then(() => {
          uni.showToast({ title: '确认成功', icon: 'success' })
          loadBookingDetail()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function returnDeposit() {
  uni.showModal({
    title: '退还押金',
    content: '确定要退还押金吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.returnDeposit(bookingId.value).then(() => {
          uni.showToast({ title: '已退还', icon: 'success' })
          loadBookingDetail()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@keyframes detail-card-enter {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.booking-detail-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scroll-view {
  flex: 1;
  height: 100vh;
  box-sizing: border-box;
}

.detail-content {
  position: relative;
  z-index: 1;
  padding: 20rpx 20rpx 150rpx;
  box-sizing: border-box;
}

.booking-card {
  animation: detail-card-enter 0.42s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.booking-card:nth-child(2) {
  animation-delay: 40ms;
}

.booking-card:nth-child(3) {
  animation-delay: 80ms;
}

.booking-card:nth-child(4) {
  animation-delay: 120ms;
}

.booking-card:nth-child(5) {
  animation-delay: 160ms;
}

.booking-card:nth-child(n + 6) {
  animation-delay: 200ms;
}

.status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
  min-height: 196rpx;
  padding: 32rpx;
  margin-bottom: 18rpx;
  border-radius: 24rpx;
  overflow: hidden;
  color: #FFFFFF;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  box-shadow: 0 18rpx 36rpx var(--primary-color-alpha-20);

  .status-main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 24rpx;
  }

  .status-icon {
    width: 84rpx;
    height: 84rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 22rpx;
  }

  .status-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;

    .status-label {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.78);
    }

    .status-text {
      font-size: 40rpx;
      line-height: 1.2;
      font-weight: 700;
      color: #FFFFFF;
    }

    .status-desc {
      font-size: 26rpx;
      line-height: 1.35;
      color: rgba(255, 255, 255, 0.86);
    }
  }

  .status-pill {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-shrink: 0;
    padding: 10rpx 16rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.22);
    font-size: 24rpx;
    color: #FFFFFF;
  }

  .status-dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: #FFFFFF;
  }

  &.status-2 {
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 42%),
      linear-gradient(135deg, var(--danger-color) 0%, #ff7875 100%);
  }

  &.status-3 {
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 42%),
      linear-gradient(135deg, #8C98A8 0%, #C4CBD5 100%);
  }

  &.status-4 {
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 42%),
      linear-gradient(135deg, var(--info-color) 0%, var(--primary-color) 100%);
  }

  &.status-5 {
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 42%),
      linear-gradient(135deg, #38A169 0%, #70C985 100%);
  }
}

.amount-grid {
  display: grid;
  grid-template-columns: 1.18fr 1fr 1fr;
  gap: 12rpx;
  padding: 18rpx;
  margin-bottom: 18rpx;
  border-radius: 22rpx;
  background: var(--bg-color-card);
  border: 1px solid var(--border-color-light);
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
}

.amount-item {
  min-width: 0;
  min-height: 112rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 12rpx;
  border-radius: 18rpx;
  background: var(--bg-color-page);

  &.primary {
    background: linear-gradient(180deg, var(--primary-color-alpha-10) 0%, var(--primary-color-alpha-5) 100%);

    .amount-value {
      color: var(--primary-color);
      font-size: 34rpx;
    }
  }

  .amount-label {
    font-size: 22rpx;
    color: var(--text-color-tertiary);
  }

  .amount-value {
    font-size: 28rpx;
    line-height: 1.2;
    font-weight: 700;
    color: var(--text-color-primary);
    white-space: nowrap;
  }
}

.section-card {
  background: var(--bg-color-card);
  padding: 28rpx;
  margin-bottom: 18rpx;
  border-radius: 22rpx;
  border: 1px solid var(--border-color-light);
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22rpx;
  }

  .section-title-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .title-icon {
    width: 6rpx;
    height: 30rpx;
    border-radius: 999rpx;
    background: var(--primary-color);
  }

  .section-title {
    font-size: 30rpx;
    line-height: 1.2;
    font-weight: 700;
    color: var(--text-color-primary);
  }
}

.item-info {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .item-image {
    width: 176rpx;
    height: 176rpx;
    border-radius: 18rpx;
    flex-shrink: 0;
    overflow: hidden;
    background: var(--bg-color-page);
  }

  .item-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 18rpx;

    .item-title {
      font-size: 32rpx;
      line-height: 1.35;
      font-weight: 700;
      color: var(--text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .item-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
    }

    .meta-chip {
      display: flex;
      align-items: center;
      gap: 6rpx;
      height: 44rpx;
      padding: 0 12rpx;
      border-radius: 999rpx;
      background: var(--primary-color-alpha-8);
      color: var(--primary-color);
      font-size: 23rpx;
    }
  }
}

.schedule-panel {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx;
  margin-bottom: 10rpx;
  border-radius: 18rpx;
  background: linear-gradient(180deg, var(--primary-color-alpha-8) 0%, var(--primary-color-alpha-5) 100%);
}

.schedule-icon {
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: var(--primary-color);
  box-shadow: 0 8rpx 18rpx var(--primary-color-alpha-20);
}

.schedule-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.schedule-label {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
}

.schedule-value {
  font-size: 28rpx;
  line-height: 1.35;
  font-weight: 600;
  color: var(--text-color-primary);
}

.info-list {
  &.compact {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12rpx;
    margin-top: 14rpx;

    .info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8rpx;
      padding: 18rpx;
      border-bottom: none;
      border-radius: 16rpx;
      background: var(--bg-color-page);
    }
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20rpx;
    padding: 22rpx 0;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 25rpx;
      color: var(--text-color-secondary);
    }

    .info-value {
      font-size: 28rpx;
      font-weight: 600;
      color: var(--text-color-primary);
      text-align: right;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 10rpx 0;

  .user-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .user-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .user-name {
      font-size: 30rpx;
      font-weight: 700;
      color: var(--text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-role {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }
}

.action-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;

  .chat-btn {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    background: var(--primary-color-alpha-8);
    color: var(--primary-color);
    border: none;
    border-radius: 36rpx;
    font-size: 28rpx;

    &::after {
      border: none;
    }
  }
}

.remark-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.remark-block {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  background: var(--bg-color-page);
}

.remark-label {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
}

.remark-text {
  font-size: 28rpx;
  color: var(--text-color-primary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.timeline {
  position: relative;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 18rpx;
  padding-bottom: 26rpx;

  &:last-child {
    padding-bottom: 0;
  }

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 10rpx;
    top: 24rpx;
    bottom: 0;
    width: 2rpx;
    background: var(--border-color-light);
  }
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 22rpx;
  height: 22rpx;
  flex-shrink: 0;
  margin-top: 7rpx;
  border-radius: 50%;
  background: var(--border-color-light);
  border: 5rpx solid var(--bg-color-card);

  &.active {
    background: var(--primary-color);
    box-shadow: 0 0 0 6rpx var(--primary-color-alpha-10);
  }
}

.timeline-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.timeline-title {
  font-size: 27rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.timeline-time {
  font-size: 24rpx;
  line-height: 1.35;
  color: var(--text-color-tertiary);
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--border-color-light);
  box-shadow: 0 -10rpx 28rpx rgba(0, 0, 0, 0.08);
  z-index: 20;

  .action-btn {
    flex: 1;
    height: 82rpx;
    line-height: 82rpx;
    border-radius: 24rpx;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    margin: 0;

    &::after {
      border: none;
    }

    &.cancel {
      background: var(--bg-color-page);
      color: var(--text-color-secondary);
    }

    &.reject {
      background: var(--danger-color-alpha-6);
      color: var(--danger-color);
    }

    &.approve,
    &.pay-deposit,
    &.confirm-return,
    &.return-deposit {
      background: var(--primary-color);
      color: var(--bg-color-card);
      box-shadow: 0 8rpx 18rpx var(--primary-color-alpha-20);
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 400rpx;
  gap: 24rpx;
  position: relative;
  z-index: 1;
}

.loading-animation {
  display: flex;
  gap: 16rpx;
}

.loading-dot {
  width: 20rpx;
  height: 20rpx;
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
  font-size: 28rpx;
  color: var(--text-color-tertiary);
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 400rpx;
  gap: 24rpx;
  position: relative;
  z-index: 1;
}

.error-icon {
  width: 116rpx;
  height: 116rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--danger-color-alpha-6);
}

.error-text {
  font-size: 28rpx;
  color: var(--text-color-tertiary);
}

.retry-btn {
  min-width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: var(--primary-color);
  color: var(--bg-color-card);
  font-size: 28rpx;
  border-radius: 36rpx;
  border: none;

  &::after {
    border: none;
  }
}
</style>
