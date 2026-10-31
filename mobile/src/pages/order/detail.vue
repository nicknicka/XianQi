<template>
  <view class="detail-page" :style="themeStyle">
    <!-- 骨架屏 -->
    <view v-if="pageLoading" class="skeleton-container">
      <view class="skeleton-status-section">
        <view class="skeleton-status-text skeleton-shimmer"></view>
        <view class="skeleton-status-desc skeleton-shimmer"></view>
      </view>
      <view class="skeleton-section">
        <view class="skeleton-section-title skeleton-shimmer"></view>
        <view class="skeleton-product-card">
          <view class="skeleton-image skeleton-shimmer"></view>
          <view class="skeleton-info">
            <view class="skeleton-title skeleton-shimmer"></view>
            <view class="skeleton-price skeleton-shimmer"></view>
          </view>
        </view>
      </view>
      <view class="skeleton-section">
        <view class="skeleton-section-title skeleton-shimmer"></view>
        <view class="skeleton-info-item">
          <view class="skeleton-label skeleton-shimmer"></view>
          <view class="skeleton-value skeleton-shimmer"></view>
        </view>
        <view class="skeleton-info-item">
          <view class="skeleton-label skeleton-shimmer"></view>
          <view class="skeleton-value skeleton-shimmer"></view>
        </view>
        <view class="skeleton-info-item">
          <view class="skeleton-label skeleton-shimmer"></view>
          <view class="skeleton-value skeleton-shimmer"></view>
        </view>
      </view>
      <view class="skeleton-section">
        <view class="skeleton-section-title skeleton-shimmer"></view>
        <view class="skeleton-user-card">
          <view class="skeleton-avatar skeleton-shimmer"></view>
          <view class="skeleton-user-name skeleton-shimmer"></view>
        </view>
        <view class="skeleton-user-card">
          <view class="skeleton-avatar skeleton-shimmer"></view>
          <view class="skeleton-user-name skeleton-shimmer"></view>
        </view>
      </view>
      <view class="skeleton-section">
        <view class="skeleton-section-title skeleton-shimmer"></view>
        <view class="skeleton-timeline">
          <view class="skeleton-timeline-item">
            <view class="skeleton-timeline-dot skeleton-shimmer"></view>
            <view class="skeleton-timeline-content">
              <view class="skeleton-timeline-line skeleton-shimmer"></view>
              <view class="skeleton-timeline-line-short skeleton-shimmer"></view>
            </view>
          </view>
          <view class="skeleton-timeline-item">
            <view class="skeleton-timeline-dot skeleton-shimmer"></view>
            <view class="skeleton-timeline-content">
              <view class="skeleton-timeline-line skeleton-shimmer"></view>
              <view class="skeleton-timeline-line-short skeleton-shimmer"></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <scroll-view v-else class="scroll-view" scroll-y>
      <!-- 订单状态 -->
      <view class="status-section animate-fade-in-up" :class="'status-' + order.status" style="animation-delay: 0s">
        <view class="status-info">
          <text class="status-text">{{ getStatusText(order.status) }}</text>
          <text class="status-desc">{{ getStatusDesc(order.status) }}</text>
        </view>
      </view>

      <!-- 商品信息 -->
      <view class="section animate-fade-in-up" style="animation-delay: 0.1s">
        <view class="section-title">商品信息</view>
        <view class="product-card" @click="goProduct">
          <lazy-image class="product-image" :src="order.productImage" mode="aspectFill" width="160" height="160" />
          <view class="product-info">
            <text class="product-title">{{ order.productTitle }}</text>
            <text class="product-price">¥{{ order.price }}</text>
          </view>
        </view>
      </view>

      <!-- 交易信息 -->
      <view class="section animate-fade-in-up" style="animation-delay: 0.2s">
        <view class="section-title">交易信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="label">订单编号</text>
            <text class="value">{{ order.orderNo }}</text>
          </view>
          <view class="info-item">
            <text class="label">下单时间</text>
            <text class="value">{{ formatTime(order.createdAt) }}</text>
          </view>
          <view class="info-item">
            <text class="label">交易地点</text>
            <text class="value">{{ order.address || '线上交易' }}</text>
          </view>
          <view class="info-item" v-if="order.phone">
            <text class="label">联系电话</text>
            <text class="value">{{ order.phone }}</text>
          </view>
          <view class="info-item" v-if="order.remark">
            <text class="label">备注</text>
            <text class="value">{{ order.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 交易双方 -->
      <view class="section animate-fade-in-up" style="animation-delay: 0.3s">
        <view class="section-title">交易双方</view>
        <view class="user-card">
          <UserAvatar
            class="avatar"
            :src="order.buyerAvatar"
            size="md"
            shape="circle"
            :clickable="Boolean(order.buyerId)"
            @click="goUserHome(order.buyerId)"
          />
          <view class="user-info">
            <text class="name">买家：{{ order.buyerName }}</text>
          </view>
        </view>
        <view class="user-card">
          <UserAvatar
            class="avatar"
            :src="order.sellerAvatar"
            size="md"
            shape="circle"
            :clickable="Boolean(order.sellerId)"
            @click="goUserHome(order.sellerId)"
          />
          <view class="user-info">
            <text class="name">卖家：{{ order.sellerName }}</text>
          </view>
        </view>
      </view>

      <!-- 订单日志 -->
      <view class="section animate-fade-in-up" style="animation-delay: 0.4s" v-if="orderLogs.length > 0">
        <view class="section-title">订单日志</view>
        <view class="timeline">
          <view class="timeline-item" v-for="log in orderLogs" :key="log.id">
            <view class="timeline-dot"></view>
            <view class="timeline-content">
              <view class="timeline-header">
                <text class="timeline-action">{{ log.actionText }}</text>
                <text class="timeline-time">{{ formatLogTime(log.createdAt) }}</text>
              </view>
              <view class="timeline-desc" v-if="log.description">{{ log.description }}</view>
              <view class="timeline-user">{{ log.userName }}</view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="!pageLoading && order.status !== 3" class="bottom-bar animate-fade-in-up" style="animation-delay: 0.4s">
      <button
        v-if="order.status === 0 && order.isSeller"
        class="action-btn primary"
        @click="confirmOrder"
      >
        确认订单
      </button>
      <button
        v-if="order.status === 0 && order.isBuyer"
        class="action-btn secondary"
        @click="cancelOrder"
      >
        取消订单
      </button>
      <button
        v-if="order.status === 1 && order.isBuyer"
        class="action-btn primary"
        @click="completeOrder"
      >
        确认收货
      </button>
      <button
        v-if="order.status === 2"
        class="action-btn primary"
        @click="goEvaluate"
      >
        评价/追评
      </button>
      <button
        v-if="order.status === 0 || order.status === 1"
        class="action-btn secondary"
        @click="contactUser"
      >
        {{ order.isBuyer ? '联系卖家' : '联系买家' }}
      </button>
    </view>

    <!-- 骨架屏底部栏 -->
    <view v-if="pageLoading" class="skeleton-bottom-bar">
      <view class="skeleton-action-btn skeleton-shimmer"></view>
      <view class="skeleton-action-btn skeleton-shimmer"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { orderApi } from '@/api/order'
import { evaluationApi } from '@/api/evaluation'
import type { OrderLog } from '@/api/order'
import { formatDateTime } from '@/utils/date'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { useUserStore } from '@/store/user'
import {useThemeStyle, useThemePage} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()
const orderId = ref<string>('')
const order = ref<any>({})
const orderLogs = ref<OrderLog[]>([])
const pageLoading = ref(true)

// 用于标记组件是否已卸载
let isUnmounted = false

onShow(() => {
  useThemePage()
})


onMounted(() => {
  // 兼容不同平台的页面参数获取方式
  let id = ''

  try {
    // #ifdef H5
    // H5环境：优先从路由查询参数获取
    console.log('[订单详情] H5环境，开始获取参数')
    console.log('[订单详情] window.location.search:', window.location.search)
    console.log('[订单详情] window.location.hash:', window.location.hash)

    // 从 URL 查询参数获取
    const urlParams = new URLSearchParams(window.location.search)
    id = urlParams.get('id') || ''

    // 如果查询参数中没有，尝试从 hash 中获取
    if (!id && window.location.hash) {
      const hashMatch = window.location.hash.match(/[?&]id=([^&#]+)/)
      if (hashMatch) {
        id = hashMatch[1]
        console.log('[订单详情] 从 hash 获取到 id:', id)
      }
    }

    // 尝试从 uni-app 的路由实例获取
    if (!id) {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as any
      if (currentPage.options && currentPage.options.id) {
        id = currentPage.options.id
        console.log('[订单详情] 从 getCurrentPages 获取到 id:', id)
      }
    }

    console.log('[订单详情] 最终获取到的 id:', id, '类型:', typeof id)
    // #endif

    // #ifndef H5
    // 非H5环境（小程序/App）：通过 getCurrentPages 获取参数
    console.log('[订单详情] 非H5环境')
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1] as any
    const options = currentPage.options || {}
    id = options.id || ''
    console.log('[订单详情] 从 options 获取到 id:', id, '类型:', typeof id)
    // #endif
  } catch (error) {
    console.error('[订单详情] 获取参数失败:', error)
  }

  // 验证 id 的有效性
  if (!id || id === 'undefined' || id === 'null') {
    console.error('[订单详情] 订单ID无效:', id)
    pageLoading.value = false
    uni.showToast({
      title: '订单ID不存在',
      icon: 'none',
      duration: 2000
    })
    return
  }

  console.log('[订单详情] 订单ID有效，设置为:', id)
  orderId.value = id

  // 添加延迟确保 DOM 已准备好
  setTimeout(() => {
    if (!isUnmounted) {
      console.log('[订单详情] 开始加载订单数据')
      loadOrderDetail()
      loadOrderLogs()
    }
  }, 50)
})

// 页面卸载时标记
onUnmounted(() => {
  isUnmounted = true
  console.log('[订单详情] 页面已卸载')
})

function loadOrderDetail() {
  // 如果已卸载，不执行请求
  if (isUnmounted) return

  // 验证 orderId
  if (!orderId.value || orderId.value === 'undefined' || orderId.value === 'null') {
    console.error('[订单详情] orderId 无效，无法加载订单详情:', orderId.value)
    pageLoading.value = false
    return
  }

  console.log('[订单详情] 开始加载订单详情，ID:', orderId.value)
  pageLoading.value = true

  orderApi.getOrderDetail(orderId.value)
    .then((res: any) => {
      // 检查组件是否已卸载
      if (isUnmounted) return

      // 获取当前用户ID（转为字符串进行比较）
      const currentUserId = String(userStore.userInfo?.userId || userStore.userInfo?.id || '')

      // 字段名归一化（price / buyerName / sellerName）已在 api/order.ts 完成。
      // 这里只补充依赖页面上下文的角色判断与展示用电话。
      const data = res.data || {}
      order.value = {
        ...data,
        phone: data.contactPhone || '',
        isBuyer: String(data.buyerId) === currentUserId,
        isSeller: String(data.sellerId) === currentUserId
      }
      pageLoading.value = false

      uni.setNavigationBarTitle({
        title: '订单详情'
      })
    })
    .catch((error: any) => {
      // 检查组件是否已卸载
      if (isUnmounted) return

      console.error('[订单详情] 加载失败:', error)
      pageLoading.value = false

      // 只在非取消错误时显示提示
      if (error.message && !error.message.includes('interrupted')) {
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      }
    })
}

function loadOrderLogs() {
  // 如果已卸载，不执行请求
  if (isUnmounted) return

  // 验证 orderId
  if (!orderId.value || orderId.value === 'undefined' || orderId.value === 'null') {
    console.error('[订单详情] orderId 无效，无法加载订单日志:', orderId.value)
    return
  }

  console.log('[订单详情] 开始加载订单日志，ID:', orderId.value)

  orderApi.getOrderLogs(orderId.value)
    .then((res: any) => {
      // 检查组件是否已卸载
      if (isUnmounted) return

      // 映射后端字段到前端字段
      const logs = (res.data || []).map((log: any) => ({
        ...log,
        id: log.logId?.toString() || log.id,
        userName: log.username || log.userName
      }))

      orderLogs.value = logs
    })
    .catch((error: any) => {
      // 检查组件是否已卸载
      if (isUnmounted) return

      console.error('[订单详情] 加载日志失败:', error)
      orderLogs.value = []
    })
}

function getStatusText(status: number | string) {
  // 将 status 转换为数字，处理字符串类型的情况
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status
  const map: Record<number, string> = {
    0: '待确认',
    1: '进行中',
    2: '已完成',
    3: '已取消',
    4: '退款中'
  }
  return map[statusNum] || '未知'
}

function getStatusDesc(status: number | string) {
  // 将 status 转换为数字，处理字符串类型的情况
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status
  const map: Record<number, string> = {
    0: '等待卖家确认订单',
    1: '订单已确认，请完成线下交易',
    2: '交易已完成',
    3: '订单已取消',
    4: '退款处理中'
  }
  return map[statusNum] || ''
}

function formatTime(time: string) {
  return formatDateTime(time, 'YYYY-MM-DD HH:mm')
}

function formatLogTime(time: string) {
  return formatDateTime(time, 'YYYY-MM-DD HH:mm:ss')
}

function goProduct() {
  uni.navigateTo({
    url: `/pages/market/detail?id=${order.value.productId}`
  })
}

function confirmOrder() {
  if (!order.value.isSeller) {
    uni.showToast({
      title: '仅卖家可确认订单',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认订单',
    content: '确认接受该订单吗？',
    success: (res) => {
      if (res.confirm) {
        orderApi.confirmOrder(orderId.value).then(() => {
          uni.showToast({ title: '已确认', icon: 'success' })
          loadOrderDetail()
        })
      }
    }
  })
}

function cancelOrder() {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        orderApi.cancelOrder(orderId.value).then(() => {
          uni.showToast({ title: '已取消', icon: 'success' })
          loadOrderDetail()
        })
      }
    }
  })
}

function completeOrder() {
  uni.showModal({
    title: '确认收货',
    content: '确认已完成交易吗？',
    success: (res) => {
      if (res.confirm) {
        orderApi.completeOrder(orderId.value).then(() => {
          uni.showToast({ title: '交易完成', icon: 'success' })
          loadOrderDetail()
        })
      }
    }
  })
}

async function goEvaluate() {
  try {
    const res = await evaluationApi.getEvaluationByOrder(orderId.value)
    const list = res.data?.list || []
    const evaluation = list[0]

    if (!evaluation) {
      uni.navigateTo({
        url: `/pages/order/evaluate?orderId=${orderId.value}`
      })
      return
    }

    const currentUserId = String(userStore.userInfo?.userId || '')
    const evaluatorId = String(evaluation.fromUserId || evaluation.evaluatorId || '')
    const hasAppend = !!(evaluation.hasAppend || evaluation.appendTime || evaluation.appendContent)

    if (currentUserId && evaluatorId === currentUserId && !hasAppend) {
      uni.navigateTo({
        url: `/pages/order/evaluate?orderId=${orderId.value}&mode=append&evalId=${evaluation.id || evaluation.evaluationId}`
      })
      return
    }

    uni.showToast({ title: hasAppend ? '该订单已完成评价' : '该订单已评价', icon: 'none' })
  } catch (error) {
    uni.navigateTo({
      url: `/pages/order/evaluate?orderId=${orderId.value}`
    })
  }
}

function contactUser() {
  const userId = order.value.isBuyer ? order.value.sellerId : order.value.buyerId
  // 传递订单ID，创建关联订单的会话
  uni.navigateTo({
    url: `/pages/message/chat?userId=${userId}&orderId=${orderId.value}`
  })
}

function goUserHome(userId: string) {
  if (!userId) return

  uni.navigateTo({
    url: `/pages/user/home?id=${userId}`
  })
}
</script>

<style lang="scss" scoped>
.detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
  animation: fadeIn 0.3s ease-in-out;
}

.scroll-view {
  flex: 1;
}

// 渐入向上动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 渐入动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0; // 初始隐藏
}

.status-section {
  padding: 48rpx var(--spacing-md);
  background: var(--bg-color-card);
  margin-bottom: var(--spacing-md);

  .status-info {
    display: flex;
    flex-direction: column;
    align-items: center;

    .status-text {
      font-size: var(--spacing-xl);
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: var(--spacing-sm);
    }

    .status-desc {
      font-size: var(--font-size-base);
      color: var(--text-color-tertiary);
    }
  }
}

.section {
  background: var(--bg-color-card);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: 20rpx;

  .section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-color-primary);
    display: block;
    margin-bottom: var(--spacing-sm);
  }
}

.product-card {
  display: flex;
  padding: var(--spacing-sm);
  background: var(--bg-color-page);
  border-radius: 20rpx;

  .product-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 20rpx;
    margin-right: var(--spacing-sm);
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .product-title {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      line-height: 1.4;
    }

    .product-price {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--danger-color);
    }
  }
}

.info-list {
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: var(--font-size-base);
      color: var(--text-color-tertiary);
    }

    .value {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
    }
  }
}

.user-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--bg-color-page);
  border-radius: 20rpx;
  margin-bottom: var(--spacing-sm);

  &:last-child {
    margin-bottom: 0;
  }

  .avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    margin-right: var(--spacing-sm);
  }

  .user-info {
    flex: 1;

    .name {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
    }
  }
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  padding-bottom: calc(var(--spacing-sm) + env(safe-area-inset-bottom));

  .action-btn {
    min-width: 160rpx;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 9999px;
    font-size: var(--font-size-base);
    border: none;

    &.secondary {
      background: var(--bg-color-card);
      color: var(--text-color-secondary);
      border: 1px solid #d9d9d9;
    }

    &.primary {
      background: var(--primary-color);
      color: var(--bg-color-card);
    }
  }
}

// 订单日志时间线样式
.timeline {
  position: relative;
  padding-left: var(--spacing-lg);

  .timeline-item {
    position: relative;
    padding-bottom: var(--spacing-md);

    &:last-child {
      padding-bottom: 0;

      &::before {
        display: none;
      }
    }

    // 连接线
    &::before {
      content: '';
      position: absolute;
      left: -28px;
      top: 16rpx;
      bottom: -24px;
      width: 2rpx;
      background: var(--border-color-base);
    }

    .timeline-dot {
      position: absolute;
      left: -33px;
      top: 6rpx;
      width: 12rpx;
      height: 12rpx;
      border-radius: 50%;
      background: var(--primary-color);
      border: 2rpx solid var(--bg-color-card);
      box-shadow: 0 0 0 2rpx var(--primary-color);
    }

    .timeline-content {
      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);

        .timeline-action {
          font-size: var(--font-size-base);
          font-weight: 500;
          color: var(--text-color-primary);
        }

        .timeline-time {
          font-size: var(--font-size-sm);
          color: var(--text-color-tertiary);
        }
      }

      .timeline-desc {
        font-size: var(--font-size-sm);
        color: var(--text-color-secondary);
        margin-bottom: var(--spacing-xs);
        line-height: 1.5;
      }

      .timeline-user {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }
  }
}

// 骨架屏样式
@keyframes shimmer {
  0% {
    background-position: -1000rpx 0;
  }
  100% {
    background-position: 1000rpx 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
  background-size: 1000rpx 100%;
  animation: shimmer 2s infinite linear;
}

.skeleton-container {
  background: var(--bg-color-page);
}

.skeleton-status-section {
  padding: 48rpx var(--spacing-md);
  background: var(--bg-color-card);
  margin-bottom: var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);

  .skeleton-status-text {
    width: 150rpx;
    height: 56rpx;
    border-radius: 8rpx;
  }

  .skeleton-status-desc {
    width: 250rpx;
    height: 32rpx;
    border-radius: 4rpx;
  }
}

.skeleton-section {
  background: var(--bg-color-card);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);

  .skeleton-section-title {
    width: 140rpx;
    height: 40rpx;
    border-radius: 8rpx;
    margin-bottom: var(--spacing-sm);
  }

  .skeleton-product-card {
    display: flex;
    padding: var(--spacing-sm);
    background: var(--bg-color-page);
    border-radius: 20rpx;
    gap: var(--spacing-sm);

    .skeleton-image {
      width: 160rpx;
      height: 160rpx;
      border-radius: 20rpx;
      flex-shrink: 0;
    }

    .skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .skeleton-title {
        width: 100%;
        height: 40rpx;
        border-radius: 8rpx;
      }

      .skeleton-price {
        width: 100rpx;
        height: 36rpx;
        border-radius: 8rpx;
      }
    }
  }

  .skeleton-info-item {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .skeleton-label {
      width: 140rpx;
      height: 32rpx;
      border-radius: 4rpx;
    }

    .skeleton-value {
      width: 200rpx;
      height: 32rpx;
      border-radius: 4rpx;
    }
  }

  .skeleton-user-card {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm);
    background: var(--bg-color-page);
    border-radius: 20rpx;
    margin-bottom: var(--spacing-sm);
    gap: var(--spacing-sm);

    &:last-child {
      margin-bottom: 0;
    }

    .skeleton-avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-user-name {
      flex: 1;
      height: 32rpx;
      border-radius: 4rpx;
    }
  }

  .skeleton-timeline {
    padding-left: var(--spacing-lg);

    .skeleton-timeline-item {
      position: relative;
      padding-bottom: var(--spacing-md);
      display: flex;

      &:last-child {
        padding-bottom: 0;
      }

      .skeleton-timeline-dot {
        position: absolute;
        left: -33px;
        top: 6rpx;
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .skeleton-timeline-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);

        .skeleton-timeline-line {
          width: 100%;
          height: 28rpx;
          border-radius: 4rpx;
        }

        .skeleton-timeline-line-short {
          width: 60%;
          height: 24rpx;
          border-radius: 4rpx;
        }
      }
    }
  }
}

.skeleton-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  padding-bottom: calc(var(--spacing-sm) + env(safe-area-inset-bottom));

  .skeleton-action-btn {
    min-width: 160rpx;
    height: 72rpx;
    border-radius: 9999px;
  }
}
</style>
