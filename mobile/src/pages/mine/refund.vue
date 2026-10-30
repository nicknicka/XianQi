<template>
  <view class="refund-page service-redesign-page" :style="themeStyle">
    <!-- 退款类型切换 -->
    <view class="tabs animated-tabs page-animate" :class="{ 'animate-in': isAnimated }">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view v-if="currentTab === tab.value" class="tab-indicator" />
      </view>
      <view
        class="tab-slider"
        :style="{ transform: `translateX(${sliderPosition}%)` }"
      />
    </view>

    <!-- 骨架屏 -->
    <SkeletonScreen v-if="showSkeleton" type="list" :row-count="3" />

    <!-- 退款列表 -->
    <scroll-view
      v-else
      class="scroll-view"
      scroll-y
      @scrolltolower="onLoadMore"
    >
      <PageTransition
        ref="pageTransitionRef"
        type="slide-up"
        stagger
        :stagger-delay="80"
        :key="currentTab"
      >
      <view v-if="refundList.length > 0" class="refund-overview">
        <view class="overview-copy">
          <text class="overview-eyebrow">{{ currentTabMeta.eyebrow }}</text>
          <text class="overview-title">{{ currentTabMeta.title }}</text>
          <text class="overview-subtitle">{{ currentTabMeta.subtitle }}</text>
        </view>
        <view class="overview-stat">
          <text class="overview-count">{{ refundList.length }}</text>
          <text class="overview-unit">条记录</text>
        </view>
      </view>

      <view class="refund-list">
        <view
          v-for="(item, index) in refundList"
          :key="item.refundId"
          class="refund-card stagger-item"
          :style="{ '--stagger-index': index }"
        >
          <view class="refund-card-top">
            <view class="refund-meta">
              <text class="refund-no">退款单号 {{ item.refundNo }}</text>
              <text class="refund-time">{{ formatCreateTime(item.createdAt) }}</text>
            </view>
            <view class="status-badge" :class="'status-' + item.status">
              <text class="status-text">{{ item.statusDesc || getStatusText(item.status) }}</text>
            </view>
          </view>

          <view class="refund-card-main" @click="goRefundDetail(item)">
            <view class="product-thumb-shell">
              <lazy-image class="product-thumb" :src="item.productImage" mode="aspectFill" />
              <view class="thumb-mask" />
            </view>

            <view class="refund-content">
              <view class="product-row">
                <text class="product-name">{{ item.productName || '未知商品' }}</text>
                <text class="refund-amount">¥{{ formatAmount(item.refundAmount) }}</text>
              </view>

              <view class="spec-row">
                <view class="type-chip" :class="'type-' + item.status">
                  <uni-icons type="wallet" size="12" :color="getStatusColor(item.status)" />
                  <text class="type-chip-text">{{ getStatusHint(item.status) }}</text>
                </view>
                <text class="refund-spec">{{ item.productSpec || '默认规格' }}</text>
              </view>

              <view class="reason-card">
                <text class="reason-label">退款原因</text>
                <text class="reason-value">{{ item.refundReason || '未填写退款原因' }}</text>
              </view>
            </view>
          </view>

          <view class="refund-card-footer">
            <view class="progress-tip">
              <view class="progress-dot" :class="'status-' + item.status" />
              <text class="progress-text">{{ getProgressText(item.status) }}</text>
            </view>

            <view class="action-buttons">
              <view
                v-if="item.status === 'pending'"
                class="action-btn cancel"
                @click.stop="cancelRefund(item)"
              >
                <text class="btn-text">取消退款</text>
              </view>
              <view
                v-if="item.status === 'approved'"
                class="action-btn primary"
                @click.stop="fillLogistics(item)"
              >
                <text class="btn-text">填写退货物流</text>
              </view>
              <view
                class="action-btn ghost"
                @click.stop="goRefundDetail(item)"
              >
                <text class="btn-text">查看详情</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="refundList.length === 0" class="empty-state">
          <image src="/static/images/refund.png" class="empty-image" mode="aspectFit" />
          <text class="empty-text">暂无退款记录</text>
        </view>

        <!-- 加载更多（刷新时不显示） -->
        <!-- <view v-if="isLoadingMore && refundList.length > 0 && !refreshing" class="loading-more">
          <uni-load-more status="loading" />
        </view>

        <!-- 加载更多 -->
        <view v-if="isLoadingMore && refundList.length > 0" class="loading-more">
          <uni-load-more status="loading" />
        </view>
        <view v-else-if="!hasMore && refundList.length > 0" class="no-more">
          没有更多了
        </view>
      </view>
      </PageTransition>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeStyle } from '@/utils/theme'
import { ref, computed, nextTick, onMounted } from 'vue'
import {onPullDownRefresh, onShow} from '@dcloudio/uni-app'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { refundApi } from '@/api/refund'
import LazyImage from '@/components/lazy-image/lazy-image.vue'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

// 主题样式
const { themeStyle } = useThemeStyle()

// PageTransition 组件引用
const pageTransitionRef = ref()

type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'

interface RefundItem {
  refundId: string
  refundNo: string
  orderId: string
  orderNo: string
  productId: string
  productName: string
  productSpec: string
  productImage: string
  refundAmount: number
  refundReason: string
  status: RefundStatus
  statusDesc: string
  createdAt: string
}

const tabs = [
  { label: '全部', value: 'all' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'completed' }
]

const currentTab = ref('all')
const isAnimated = ref(false)
const sliderPosition = ref(0)

const currentTabMeta = computed(() => {
  const metaMap: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
    all: {
      eyebrow: '售后总览',
      title: '全部退款记录',
      subtitle: '集中查看每一笔退款的进度、原因与处理动作'
    },
    processing: {
      eyebrow: '处理中',
      title: '等待推进的退款',
      subtitle: '优先处理待审核、已同意与退货中的订单'
    },
    completed: {
      eyebrow: '已完成',
      title: '已经闭环的退款',
      subtitle: '退款完成后，记录会保留在这里便于回查'
    }
  }

  return metaMap[currentTab.value] || metaMap.all
})

// 状态映射：将后端状态码映射到前端状态类型
const statusMap: Record<number, RefundStatus> = {
  0: 'pending',      // 待审核
  1: 'approved',     // 已同意
  2: 'rejected',     // 已拒绝
  3: 'processing',   // 退货中
  4: 'completed',    // 已完成
  5: 'cancelled'     // 已取消
}

// 根据当前tab筛选状态码
function getStatusFilter(): number | undefined {
  if (currentTab.value === 'all') return undefined
  if (currentTab.value === 'processing') {
    // 处理中：待审核、已同意、退货中
    return undefined // 需要在API调用后过滤
  }
  if (currentTab.value === 'completed') {
    // 已完成：已完成
    return 4
  }
  return undefined
}

// Tab数据缓存
const tabCache = ref<Record<string, RefundItem[]>>({})
const tabLoading = ref<Record<string, boolean>>({})
const isFirstLoad = ref(true)

// 显示的退款列表（从缓存中获取）
const refundList = computed(() => tabCache.value[currentTab.value] || [])
const isLoading = computed(() => tabLoading.value[currentTab.value] || false)
const isLoadingMore = ref(false)
const hasMore = ref(true)

// 分页状态
const currentPage = ref(1)
const pageSize = 20

// 是否显示骨架屏（只在首次加载时显示）
const showSkeleton = computed(() => isFirstLoad.value && Object.keys(tabCache.value).length === 0)

// 加载指定tab的数据
async function loadTabData(tab: string, forceRefresh = false, page: number = 1) {
  // 如果已经有缓存且不是强制刷新，直接返回
  if (!forceRefresh && tabCache.value[tab] && page === 1) {
    return
  }

  tabLoading.value[tab] = true

  try {
    const status = getStatusFilter()
    console.log('[退款列表] 请求参数:', { page, size: pageSize, status, tab })

    // 构建请求参数，过滤掉 undefined 值
    const params: any = {
      page,
      size: pageSize
    }
    if (status !== undefined) {
      params.status = status
    }

    const response = await refundApi.getBuyerRefundList(params)

    console.log('[退款列表] API返回:', response)

    // API返回的是 { list, total } 结构
    const data = response?.data || {} as any
    const records = data?.list || []

    console.log('[退款列表] 解析后的records:', records)

    let list = records.map((item: any) => ({
      ...item,
      // 后端返回的字段名就是 refundId，直接使用即可
      status: statusMap[item.status] || 'pending'
    }))

    // 如果是处理中tab，需要过滤出处理中的状态
    if (tab === 'processing') {
      list = list.filter((item: any) =>
        item.status === 'pending' || item.status === 'approved' || item.status === 'processing'
      )
    }

    console.log('[退款列表] 最终列表:', list)

    // 缓存数据
    if (page === 1) {
      tabCache.value[tab] = list
      currentPage.value = 1
    } else {
      // 加载更多，追加到现有列表
      tabCache.value[tab] = [...(tabCache.value[tab] || []), ...list]
    }

    // 更新分页状态：如果返回的数据量等于 pageSize，说明可能还有更多数据
    hasMore.value = list.length === pageSize
    currentPage.value = page
  } catch (error: any) {
    console.error('[退款列表] 获取退款列表失败:', error)
    if (page === 1) {
      tabCache.value[tab] = []
    }
  } finally {
    tabLoading.value[tab] = false
    isFirstLoad.value = false
  }
}

// 切换标签（使用缓存数据，但播放动画）
async function switchTab(value: string) {
  if (currentTab.value === value) return

  const hasCache = !!tabCache.value[value]

  // 如果该tab没有缓存数据，先加载数据
  if (!hasCache) {
    await loadTabData(value)
  }

  // 切换tab
  currentTab.value = value

  // 更新滑动指示器位置（3个tab，每个占33.33%）
  const tabIndex = tabs.findIndex((tab) => tab.value === value)
  sliderPosition.value = tabIndex * 33.33
}

// 加载更多
async function onLoadMore() {
  // 如果没有更多数据或正在加载，不执行加载更多
  if (isLoadingMore.value || !hasMore.value) {
    console.log('[加载更多] 跳过, isLoadingMore:', isLoadingMore.value, 'hasMore:', hasMore.value)
    return
  }

  console.log('[加载更多] 开始加载更多, isLoadingMore:', isLoadingMore.value)

  try {
    isLoadingMore.value = true
    const nextPage = currentPage.value + 1
    await loadTabData(currentTab.value, true, nextPage)
  } finally {
    // 确保无论成功或失败都重置加载状态
    isLoadingMore.value = false
    console.log('[加载更多] 加载结束, isLoadingMore:', isLoadingMore.value)
  }
}

// 刷新当前tab（供其他操作后调用）
async function refresh() {
  currentPage.value = 1
  await loadTabData(currentTab.value, true, 1)
}

// 页面加载时初始化数据

onShow(() => {
  useThemePage()
})

onMounted(async () => {
  await loadTabData('all', false, 1)

  // 初始化滑动指示器位置
  sliderPosition.value = 0

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)

  // 首次加载完成后播放入场动画
  nextTick(() => {
    if (pageTransitionRef.value) {
      pageTransitionRef.value.reset()
      setTimeout(() => {
        pageTransitionRef.value.play?.()
      }, 50)
    }
  })
})

// 下拉刷新
onPullDownRefresh(async () => {
  console.log('[下拉刷新] ========== 开始刷新 ==========')

  try {
    // 重置页码并刷新当前 tab
    currentPage.value = 1
    await loadTabData(currentTab.value, true, 1)

    console.log('[下拉刷新] 刷新成功')

    // 触发 PageTransition 重新播放动画
    nextTick(() => {
      if (pageTransitionRef.value) {
        pageTransitionRef.value.reset()
        setTimeout(() => {
          pageTransitionRef.value.play?.()
        }, 50)
      }
    })

    // 显示成功提示
    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500
    })
  } catch (error: any) {
    console.error('[下拉刷新] 刷新失败:', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'error'
    })
  } finally {
    // 确保停止下拉刷新动画
    // 添加小延迟让用户看到刷新效果
    setTimeout(() => {
      uni.stopPullDownRefresh()
      console.log('[下拉刷新] ========== 刷新结束 ==========')
    }, 300)
  }
})

// 获取状态文本
function getStatusText(status: RefundStatus): string {
  const statusMap: Record<RefundStatus, string> = {
    pending: '待审核',
    approved: '已同意',
    rejected: '已拒绝',
    processing: '退货中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知'
}

function getStatusHint(status: RefundStatus): string {
  const hintMap: Record<RefundStatus, string> = {
    pending: '等待平台或卖家审核',
    approved: '卖家已同意，等待你继续操作',
    rejected: '申请已被拒绝，可查看原因',
    processing: '退货物流处理中',
    completed: '退款流程已经完成',
    cancelled: '你已主动取消这笔退款'
  }

  return hintMap[status] || '售后状态更新中'
}

function getProgressText(status: RefundStatus): string {
  const progressMap: Record<RefundStatus, string> = {
    pending: '当前节点：退款申请已提交',
    approved: '当前节点：等待填写退货物流',
    rejected: '当前节点：本次申请已结束',
    processing: '当前节点：卖家等待收货确认',
    completed: '当前节点：退款已原路退回',
    cancelled: '当前节点：退款申请已撤销'
  }

  return progressMap[status] || '当前节点：处理中'
}

function getStatusColor(status: RefundStatus): string {
  const colorMap: Record<RefundStatus, string> = {
    pending: 'var(--warning-color)',
    approved: 'var(--info-color)',
    rejected: 'var(--danger-color)',
    processing: 'var(--primary-color)',
    completed: 'var(--success-color)',
    cancelled: 'var(--text-color-tertiary)'
  }

  return colorMap[status] || 'var(--primary-color)'
}

function formatAmount(amount: number) {
  const value = Number(amount || 0)
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function formatCreateTime(time?: string) {
  if (!time) return '刚刚创建'
  return String(time).replace('T', ' ').slice(0, 16)
}

// 查看退款详情
function goRefundDetail(item: RefundItem) {
  if (!item.refundId) {
    uni.showToast({
      title: '退款ID无效',
      icon: 'error'
    })
    return
  }
  uni.navigateTo({
    url: `/pages/order/refund-detail?id=${item.refundId}`
  })
}

// 取消退款
async function cancelRefund(item: RefundItem) {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消该退款申请吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await refundApi.cancelRefund(item.refundId)
          uni.hideLoading()
          uni.showToast({
            title: '取消成功',
            icon: 'success'
          })
          refresh()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({
            title: '取消失败',
            icon: 'error'
          })
        }
      }
    }
  })
}

// 填写退货物流
function fillLogistics(item: RefundItem) {
  uni.navigateTo({
    url: `/pages/order/refund-logistics?id=${item.refundId}`
  })
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

// 动画关键帧
@keyframes indicatorBounce {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(1.2); }
  100% { transform: scaleX(1); }
}

@keyframes emptyFadeIn {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

.refund-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
}

// Tab 栏 - 与订单列表页保持一致
.tabs {
  display: flex;
  background: var(--bg-color-card);
  border-bottom: 1px solid var(--border-color-base);
  position: relative;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-md) 0;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;

    .tab-text {
      font-size: var(--font-size-base);
      color: var(--text-color-secondary);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.active .tab-text {
      color: var(--primary-color);
      font-weight: 600;
      transform: scale(1.05);
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      width: 48rpx;
      height: 4rpx;
      background: var(--primary-color);
      border-radius: var(--border-radius-sm);
      animation: indicatorBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  }

  .tab-slider {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 33.33%;
    height: 100%;
    background: linear-gradient(
      180deg,
      var(--primary-color-alpha-5) 0%,
      var(--primary-color-alpha-3) 100%
    );
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }
}

// Tab 栏动画
.animated-tabs {
  opacity: 0;
  animation: slideDownFade 0.4s ease-out forwards;
}

// 向下滑入淡入动画（Tab 栏）
@keyframes slideDownFade {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-view {
  flex: 1;
  height: 0;
  padding: var(--spacing-md);
  box-sizing: border-box;
  overflow: hidden;
}

.refund-list {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  padding: 0 var(--spacing-sm) var(--spacing-xl);
}

.refund-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin: 0 var(--spacing-sm) var(--spacing-md);
  padding: 28rpx 30rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(135deg, var(--primary-color-alpha-10) 0%, rgba(255, 255, 255, 0.98) 62%),
    var(--bg-color-card);
  border: 1px solid var(--primary-color-alpha-15);
  box-shadow: 0 18rpx 42rpx var(--primary-color-alpha-10);
}

.overview-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.overview-eyebrow {
  font-size: 20rpx;
  line-height: 1;
  letter-spacing: 3rpx;
  color: var(--primary-color);
}

.overview-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text-color-primary);
}

.overview-subtitle {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--text-color-secondary);
}

.overview-stat {
  min-width: 134rpx;
  padding: 18rpx 16rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, var(--bg-color-card) 0%, var(--primary-color-alpha-5) 100%);
  box-shadow: inset 0 0 0 1px var(--primary-color-alpha-10);
  text-align: center;
}

.overview-count {
  display: block;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1;
  color: var(--text-color-primary);
}

.overview-unit {
  display: block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: var(--text-color-tertiary);
}

.refund-card {
  margin-bottom: var(--spacing-md);
  padding: 26rpx;
  border-radius: 30rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, var(--bg-color-card) 100%);
  border: 1px solid var(--border-color-light);
  box-shadow: 0 18rpx 42rpx rgba(15, 39, 73, 0.08);
}

.refund-card-top,
.refund-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.refund-card-top {
  margin-bottom: 22rpx;
}

.refund-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.refund-no {
  font-size: 22rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.refund-time {
  font-size: 20rpx;
  color: var(--text-color-tertiary);
}

.refund-card-main {
  display: flex;
  align-items: stretch;
  gap: 20rpx;
}

.product-thumb-shell {
  position: relative;
  width: 184rpx;
  height: 184rpx;
  flex-shrink: 0;
  border-radius: 24rpx;
  overflow: hidden;
  background: linear-gradient(180deg, var(--primary-color-alpha-8) 0%, var(--bg-color-card) 100%);
  box-shadow: inset 0 0 0 1px var(--primary-color-alpha-8);
}

.product-thumb {
  width: 100%;
  height: 100%;
}

.thumb-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(255, 255, 255, 0.12) 100%);
  pointer-events: none;
}

.refund-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.product-row,
.spec-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.product-name {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-color-primary);
}

.refund-amount {
  flex-shrink: 0;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1;
  color: #111111;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 18rpx;
  max-width: 100%;
  border-radius: 9999px;
  background: var(--primary-color-alpha-8);
  box-shadow: inset 0 0 0 1px var(--primary-color-alpha-10);
}

.type-chip.type-pending {
  background: var(--warning-color-alpha-10);
  box-shadow: inset 0 0 0 1px var(--warning-color-alpha-15);
}

.type-chip.type-approved,
.type-chip.type-processing {
  background: var(--info-color-alpha-10);
  box-shadow: inset 0 0 0 1px var(--info-color-alpha-30);
}

.type-chip.type-completed {
  background: var(--success-color-alpha-10);
  box-shadow: inset 0 0 0 1px var(--success-color-alpha-30);
}

.type-chip.type-rejected,
.type-chip.type-cancelled {
  background: var(--danger-color-alpha-6);
  box-shadow: inset 0 0 0 1px var(--danger-color-alpha-20);
}

.type-chip-text {
  font-size: 20rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.refund-spec {
  flex: 1;
  text-align: right;
  font-size: 22rpx;
  color: var(--text-color-tertiary);
}

.reason-card {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: linear-gradient(180deg, var(--primary-color-alpha-5) 0%, rgba(255, 255, 255, 0.92) 100%);
  border: 1px solid var(--primary-color-alpha-8);
}

.reason-label {
  display: block;
  margin-bottom: 8rpx;
  font-size: 20rpx;
  letter-spacing: 2rpx;
  color: var(--text-color-tertiary);
}

.reason-value {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-color-secondary);
}

.refund-card-footer {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1px dashed var(--border-color-base);
}

.progress-tip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.progress-dot {
  width: 14rpx;
  height: 14rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--primary-color);
  box-shadow: 0 0 0 8rpx var(--primary-color-alpha-10);
}

.progress-dot.status-pending {
  background: var(--warning-color);
  box-shadow: 0 0 0 8rpx var(--warning-color-alpha-10);
}

.progress-dot.status-approved,
.progress-dot.status-processing {
  background: var(--info-color);
  box-shadow: 0 0 0 8rpx var(--info-color-alpha-10);
}

.progress-dot.status-completed {
  background: var(--success-color);
  box-shadow: 0 0 0 8rpx var(--success-color-alpha-10);
}

.progress-dot.status-rejected,
.progress-dot.status-cancelled {
  background: var(--danger-color);
  box-shadow: 0 0 0 8rpx var(--danger-color-alpha-6);
}

.progress-text {
  font-size: 22rpx;
  line-height: 1.4;
  color: var(--text-color-secondary);
}

// 状态标签统一为胶囊形
.status-badge {
  align-self: flex-start;
  padding: 10rpx 20rpx;
  border-radius: 9999px;
  box-shadow: inset 0 0 0 1px transparent;

  &.status-pending {
    background: var(--warning-color-alpha-10);
    box-shadow: inset 0 0 0 1px var(--warning-color-alpha-15);
    .status-text { color: var(--warning-color); }
  }

  &.status-approved,
  &.status-processing {
    background: var(--info-color-alpha-10);
    box-shadow: inset 0 0 0 1px var(--info-color-alpha-30);
    .status-text { color: var(--info-color); }
  }

  &.status-completed {
    background: var(--success-color-alpha-10);
    box-shadow: inset 0 0 0 1px var(--success-color-alpha-30);
    .status-text { color: var(--success-color); }
  }

  &.status-rejected,
  &.status-cancelled {
    background: var(--danger-color-alpha-6);
    box-shadow: inset 0 0 0 1px var(--danger-color-alpha-20);
    .status-text { color: var(--danger-color); }
  }
}

.status-text {
  font-size: 20rpx;
  font-weight: 600;
}

// 按钮统一为胶囊形
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.action-btn {
  min-width: 140rpx;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 24rpx;
  border-radius: 9999px;
  font-size: var(--font-size-sm);
  border: none;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active { transform: scale(0.92); }

  &.primary {
    background: var(--primary-color);
    border-color: transparent;
    box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
    .btn-text { color: var(--bg-color-card); }
  }

  &.cancel {
    background: var(--bg-color-card);
    border: 1px solid var(--danger-color);
    .btn-text { color: var(--danger-color); }
  }

  &.ghost {
    background: var(--primary-color-alpha-5);
    border: 1px solid var(--primary-color-alpha-15);
    .btn-text { color: var(--primary-color); }
  }
}

.btn-text {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  opacity: 0;
  animation: emptyFadeIn 0.5s ease-out 0.3s forwards;
  background: transparent;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: var(--spacing-md);
  animation: float 3s ease-in-out infinite;
}

.empty-text {
  font-size: var(--font-size-base);
  color: var(--text-color-tertiary);
}

.loading-more,
.no-more {
  padding: var(--spacing-xl) 0;
  text-align: center;
}

.no-more {
  font-size: var(--font-size-sm);
  color: var(--text-color-tertiary);
}
</style>
