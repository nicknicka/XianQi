<template>
  <view class="flash-sale-container">
    <!-- 顶部活动横幅 -->
    <view class="activity-banner" :class="{ 'banner-enter': isPageLoaded }">
      <view class="banner-content">
        <image class="banner-bg" src="/static/images/activity/flash-sale-bg.png" mode="aspectFill"></image>
        <view class="banner-overlay">
          <view class="activity-title">限时秒杀</view>
          <view class="activity-subtitle">超值低价 限时抢购</view>
          <!-- 倒计时 -->
          <view class="countdown-box">
            <view class="countdown-label">{{ countdownLabel }}</view>
            <view class="countdown-time" v-if="hasOngoingSession">
              <text class="time-block">{{ hours }}</text>
              <text class="time-separator">:</text>
              <text class="time-block">{{ minutes }}</text>
              <text class="time-separator">:</text>
              <text class="time-block">{{ seconds }}</text>
            </view>
            <view class="no-session-tip" v-else>
              <text>暂无进行中的场次</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 秒杀场次Tab -->
    <view class="session-tabs" :class="{ 'tabs-enter': isPageLoaded }">
      <scroll-view class="tabs-scroll" scroll-x show-scrollbar="false">
        <view class="tab-item"
              v-for="(session, index) in sessions"
              :key="index"
              :class="{ active: currentSession === index }"
              @click="switchSession(index)">
          <view class="tab-time">{{ session.time }}</view>
          <view class="tab-status">{{ getSessionStatusText(session.status) }}</view>
          <view class="tab-progress" v-if="session.progress">
            <view class="progress-bar" :style="{ width: session.progress + '%' }"></view>
          </view>
          <!-- 切换加载指示器 -->
          <view v-if="loadingSession === index" class="tab-loading">
            <view class="loading-dots">
              <text class="dot"></text>
              <text class="dot"></text>
              <text class="dot"></text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 商品列表 -->
    <view class="product-list" :class="{ 'list-enter': isPageLoaded }">
      <!-- 初始加载中状态 -->
      <view v-if="isInitialLoading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">
          <text class="loading-words">
            <text class="word">加</text>
            <text class="word">载</text>
            <text class="word">中</text>
          </text>
          <text class="loading-dots">
            <text class="dot">.</text>
            <text class="dot">.</text>
            <text class="dot">.</text>
          </text>
        </text>
      </view>

      <!-- 加载失败状态 -->
      <view v-else-if="loadError" class="error-container">
        <view class="error-icon">
          <view class="error-circle">
            <view class="error-line"></view>
            <view class="error-dot"></view>
          </view>
        </view>
        <text class="error-title">加载失败</text>
        <text class="error-message">{{ loadErrorMessage }}</text>
        <view class="retry-btn" @tap="handleRetry">
          <view class="retry-icon">
            <text class="refresh-arrow">⟳</text>
          </view>
          <text class="retry-text">点击重试</text>
        </view>
      </view>

      <!-- 空数据状态 -->
      <view v-else-if="products.length === 0" class="empty-container">
        <view class="empty-icon">
          <view class="empty-box">
            <view class="box-top"></view>
            <view class="box-body"></view>
          </view>
        </view>
        <text class="empty-title">暂无秒杀商品</text>
        <text class="empty-message">当前场次暂无商品，敬请期待下一场</text>
        <view class="empty-action" @tap="handleRefresh">
          <view class="action-icon">
            <text class="refresh-arrow">⟳</text>
          </view>
          <text class="action-text">刷新试试</text>
        </view>
      </view>

      <!-- 正常商品列表 -->
      <template v-else>
        <view class="list-header">
          <view class="header-title">秒杀商品</view>
          <view class="header-count">共{{ products.length }}件商品</view>
        </view>

        <!-- 瀑布流或网格布局 -->
        <view class="products-grid">
          <view class="product-item"
                v-for="product in products"
                :key="product.id"
                :class="{ 'product-disabled': isCurrentSessionEnded() }"
                @click="goToProductDetail(product.id)">
            <!-- 商品图片 -->
            <view class="product-image-wrapper">
              <lazy-image
                class="product-image"
                :src="product.image"
                mode="aspectFill"
                width="100%"
                height="320rpx"
                loading-animation="skeleton"
              />
              <!-- 秒杀标签 -->
              <view class="flash-tag">{{ product.discount }}折</view>
              <!-- 已抢进度 -->
              <view class="progress-overlay">
                <view class="progress-bg">
                  <view class="progress-fill" :style="{ width: product.soldPercent + '%' }"></view>
                </view>
                <text class="sold-text">已抢{{ product.soldPercent }}%</text>
              </view>
            </view>

            <!-- 商品信息 -->
            <view class="product-info">
              <view class="product-title">{{ product.title }}</view>
              <view class="product-desc">{{ product.description }}</view>

              <!-- 价格信息 -->
              <view class="price-section">
                <view class="price-left">
                  <text class="currency">¥</text>
                  <text class="price">{{ product.seckillPrice }}</text>
                  <text class="original-price">¥{{ product.originalPrice }}</text>
                </view>
                <view class="buy-btn" :class="{ disabled: product.soldPercent >= 100 }">
                  <text v-if="product.soldPercent < 100">立即抢</text>
                  <text v-else>已抢光</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMore && !isLoadingMore">
          <uni-load-more status="loading"></uni-load-more>
        </view>
        <view class="no-more" v-else-if="!hasMore && products.length > 0">
          <text>没有更多了</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage } from '@/utils/theme'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { activityApi, type FlashSaleSession, type FlashSaleProduct } from '@/api/activity'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { onShow } from '@dcloudio/uni-app'
import type { IdLike } from '@/utils/id'

// 前端扩展的场次接口（包含动态计算的status字段）
interface FlashSaleSessionWithStatus extends Omit<FlashSaleSession, 'status'> {
  status: 'upcoming' | 'ongoing' | 'ended'
}

// 场次数据
const sessions = ref<FlashSaleSessionWithStatus[]>([])
const currentSession = ref(0) // 当前选中的场次索引

// 倒计时显示值
const hours = ref('00')
const minutes = ref('00')
const seconds = ref('00')

let countdownTimer: any = null
let sessionStatusTimer: any = null // 场次状态更新定时器

// 场次切换加载状态
const loadingSession = ref<number | null>(null) // 正在加载的场次索引

// 商品数据缓存（按场次索引存储）
const productsCache = ref<Map<number, FlashSaleProduct[]>>(new Map())
const hasMoreCache = ref<Map<number, boolean>>(new Map())

// 当前显示的商品数据
const products = ref<FlashSaleProduct[]>([])
const hasMore = ref(true)
const isLoadingMore = ref(false)

// 页面加载状态
const isInitialLoading = ref(true) // 初始加载状态
const loadError = ref(false) // 加载错误状态
const loadErrorMessage = ref('') // 错误消息
const loadTimeout = ref(5000) // 5秒超时（可配置）

// 分页参数
const pageNum = ref(1)
const pageSize = 10

// 页面加载状态（用于触发入场动画）
const isPageLoaded = ref(false)

// 计算属性：是否有进行中的场次
const hasOngoingSession = computed(() => {
  return sessions.value.some(s => s.status === 'ongoing')
})

// 计算属性：倒计时标签
const countdownLabel = computed(() => {
  if (hasOngoingSession.value) {
    return '距离结束'
  }
  return '秒杀活动'
})

// 超时定时器
let timeoutTimer: number | null = null

// 页面加载

onShow(() => {
  useThemePage()
})

onMounted(async () => {
  // 启动超时定时器
  startLoadTimeout()

  await loadSessions()
  // 启动倒计时
  countdownTimer = setInterval(updateCountdown, 1000)
  updateCountdown()

  // 启动场次状态更新定时器（每10秒更新一次）
  sessionStatusTimer = setInterval(updateSessionStatus, 10000)

  // 清除超时定时器
  clearLoadTimeout()

  // 触发页面入场动画（延迟一小会儿确保 pop-in 动画完成后）
  setTimeout(() => {
    isPageLoaded.value = true
  }, 150)
})

// 页面卸载
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  if (sessionStatusTimer) {
    clearInterval(sessionStatusTimer)
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
  }
})

// 启动加载超时
const startLoadTimeout = () => {
  timeoutTimer = setTimeout(() => {
    if (isInitialLoading.value) {
      isInitialLoading.value = false
      loadError.value = true
      loadErrorMessage.value = '加载超时，请检查网络连接后重试'
      console.error('秒杀页面加载超时')
    }
  }, loadTimeout.value) as unknown as number
}

// 清除加载超时
const clearLoadTimeout = () => {
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
}

// 重试加载
const handleRetry = async () => {
  loadError.value = false
  loadErrorMessage.value = ''
  isInitialLoading.value = true
  pageNum.value = 1
  products.value = []
  // 清除当前场次的缓存
  productsCache.value.delete(currentSession.value)
  startLoadTimeout()
  await loadSessions()
  clearLoadTimeout()
}

// 刷新页面
const handleRefresh = async () => {
  pageNum.value = 1
  products.value = []
  isInitialLoading.value = true
  loadError.value = false
  // 清除所有缓存
  productsCache.value.clear()
  hasMoreCache.value.clear()
  startLoadTimeout()
  await loadSessions()
  clearLoadTimeout()
}

// 加载场次列表
const loadSessions = async () => {
  try {
    const res = await activityApi.getFlashSaleSessions()
    const rawData = res.data || []

    if (rawData.length === 0) {
      // 没有场次数据
      sessions.value = []
      isInitialLoading.value = false
      loadError.value = false
      return
    }

    // 前端根据当前时间计算每个场次的状态
    const now = new Date().getTime()
    sessions.value = rawData.map(session => {
      const startTime = new Date(session.startTime).getTime()
      const endTime = new Date(session.endTime).getTime()

      let status: 'upcoming' | 'ongoing' | 'ended'
      if (now < startTime) {
        status = 'upcoming'
      } else if (now >= startTime && now <= endTime) {
        status = 'ongoing'
      } else {
        status = 'ended'
      }

      // 动态添加 status 字段
      return {
        ...session,
        status
      }
    })

    // 调试日志：打印场次状态
    console.log('场次列表数据:', sessions.value.map(s => ({
      time: s.time,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status
    })))

    // 找到当前正在进行的场次
    const ongoingIndex = sessions.value.findIndex(s => s.status === 'ongoing')
    if (ongoingIndex >= 0) {
      currentSession.value = ongoingIndex
      console.log('找到进行中的场次，索引:', ongoingIndex)
    } else {
      // 如果没有正在进行的，选择第一个即将开始的
      const upcomingIndex = sessions.value.findIndex(s => s.status === 'upcoming')
      currentSession.value = upcomingIndex >= 0 ? upcomingIndex : 0
      console.log('未找到进行中的场次，选择索引:', currentSession.value)
    }

    // 加载当前场次的商品
    await loadSessionProducts(currentSession.value)

    // 加载完成，清除初始加载状态
    isInitialLoading.value = false
    loadError.value = false
  } catch (error: any) {
    console.error('加载场次失败:', error)
    isInitialLoading.value = false
    loadError.value = true
    loadErrorMessage.value = error?.message || '网络请求失败，请检查网络连接'
  }
}

// 切换场次
const switchSession = async (index: number) => {
  if (index === currentSession.value) return

  // 设置加载状态
  loadingSession.value = index

  currentSession.value = index

  // 检查是否有缓存数据
  const cachedProducts = productsCache.value.get(index)
  const cachedHasMore = hasMoreCache.value.get(index)

  if (cachedProducts && cachedProducts.length > 0) {
    // 使用缓存数据
    products.value = cachedProducts
    hasMore.value = cachedHasMore !== undefined ? cachedHasMore : true
    loadError.value = false
    isInitialLoading.value = false // 清除加载状态
    loadingSession.value = null
  } else {
    // 没有缓存，重新加载
    pageNum.value = 1
    products.value = []
    isInitialLoading.value = true
    loadError.value = false
    startLoadTimeout()
    await loadSessionProducts(index)
    clearLoadTimeout()

    // 清除加载状态
    loadingSession.value = null
  }
}

// 加载场次商品
const loadSessionProducts = async (sessionIndex: number) => {
  // 如果不是首次加载，检查是否正在加载更多
  if (pageNum.value > 1 && isLoadingMore.value) return

  try {
    // 首次加载使用 isInitialLoading，后续加载使用 isLoadingMore
    if (pageNum.value === 1) {
      // 首次加载由 loadSessions 控制
    } else {
      isLoadingMore.value = true
    }

    const session = sessions.value[sessionIndex]
    if (!session) return

    const res = await activityApi.getFlashSaleProducts(session.sessionId, {
      page: pageNum.value,
      pageSize: pageSize
    })

    const newProducts = res.data || []

    if (pageNum.value === 1) {
      products.value = newProducts
      // 保存到缓存（仅在首次加载时）
      productsCache.value.set(sessionIndex, newProducts)
    } else {
      products.value.push(...newProducts)
      // 更新缓存
      productsCache.value.set(sessionIndex, products.value)
    }

    hasMore.value = newProducts.length >= pageSize
    // 保存 hasMore 到缓存
    hasMoreCache.value.set(sessionIndex, hasMore.value)

    // 首次加载成功，清除初始加载状态
    if (pageNum.value === 1) {
      isInitialLoading.value = false
    }
  } catch (error: any) {
    console.error('加载商品失败:', error)
    // 只有首次加载失败才设置错误状态
    if (pageNum.value === 1) {
      isInitialLoading.value = false
      loadError.value = true
      loadErrorMessage.value = error?.message || '加载商品失败，请重试'
    } else {
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  } finally {
    isLoadingMore.value = false
    // 清除场次切换加载状态
    loadingSession.value = null
  }
}

// 获取场次状态中文文本
const getSessionStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'upcoming': '即将开始',
    'ongoing': '进行中',
    'ended': '已结束',
    // 添加可能的其他状态值
    'not_started': '即将开始',
    'in_progress': '进行中',
    'finished': '已结束',
    '0': '即将开始',
    '1': '进行中',
    '2': '已结束'
  }

  const result = statusMap[status] || status
  console.log(`状态转换: ${status} -> ${result}`)
  return result
}

// 检查当前场次是否已结束
const isCurrentSessionEnded = () => {
  const currentSessionData = sessions.value[currentSession.value]
  return currentSessionData && currentSessionData.status === 'ended'
}

// 跳转商品详情
const goToProductDetail = (productId: IdLike) => {
  // 检查当前场次是否已结束
  const currentSessionData = sessions.value[currentSession.value]
  if (currentSessionData && currentSessionData.status === 'ended') {
    uni.showToast({
      title: '该场次已结束',
      icon: 'none'
    })
    return
  }

  uni.navigateTo({
    url: `/pages/market/detail?id=${productId}&flash=1`
  })
}

// 更新倒计时
const updateCountdown = () => {
  // 倒计时只针对当前正在进行中的场次
  const ongoingSession = sessions.value.find(s => s.status === 'ongoing')

  if (!ongoingSession) {
    // 没有进行中的场次，显示00:00:00
    hours.value = '00'
    minutes.value = '00'
    seconds.value = '00'
    return
  }

  const now = new Date().getTime()
  const sessionEndTime = new Date(ongoingSession.endTime).getTime()
  const distance = sessionEndTime - now

  if (distance > 0) {
    const h = Math.floor(distance / (1000 * 60 * 60))
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((distance % (1000 * 60)) / 1000)

    hours.value = h.toString().padStart(2, '0')
    minutes.value = m.toString().padStart(2, '0')
    seconds.value = s.toString().padStart(2, '0')
  } else {
    // 倒计时结束（场次已结束），但状态可能还没更新，显示00:00:00
    hours.value = '00'
    minutes.value = '00'
    seconds.value = '00'
  }
}

// 更新场次状态（根据当前时间）
const updateSessionStatus = () => {
  if (sessions.value.length === 0) return

  const now = new Date().getTime()
  let statusChanged = false

  sessions.value.forEach((session, index) => {
    const startTime = new Date(session.startTime).getTime()
    const endTime = new Date(session.endTime).getTime()

    const oldStatus = session.status
    let newStatus: 'upcoming' | 'ongoing' | 'ended'

    if (now < startTime) {
      newStatus = 'upcoming'
    } else if (now >= startTime && now <= endTime) {
      newStatus = 'ongoing'
    } else {
      newStatus = 'ended'
    }

    if (oldStatus !== newStatus) {
      session.status = newStatus
      statusChanged = true
      console.log(`场次 ${index} 状态更新: ${oldStatus} -> ${newStatus}`)
    }
  })

  // 如果状态有变化，更新当前场次索引
  if (statusChanged) {
    const ongoingIndex = sessions.value.findIndex(s => s.status === 'ongoing')
    if (ongoingIndex >= 0 && currentSession.value !== ongoingIndex) {
      currentSession.value = ongoingIndex
    }
  }
}

// 下拉刷新
const onRefresh = async () => {
  pageNum.value = 1
  products.value = []
  isInitialLoading.value = true
  loadError.value = false
  startLoadTimeout()
  await loadSessions()
  clearLoadTimeout()
  uni.stopPullDownRefresh()
  uni.showToast({ title: '刷新成功', icon: 'success' })
}

// 加载更多
const onLoadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) return
  pageNum.value++
  await loadSessionProducts(currentSession.value)
}

// 暴露方法给页面
defineExpose({
  onRefresh,
  onLoadMore
})
</script>

<style lang="scss" scoped>
.flash-sale-container {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--error-color) 0%, var(--danger-color) 100%);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 活动横幅 */
.activity-banner {
  position: relative;
  width: 100%;
  height: 380rpx;
  overflow: hidden;

  .banner-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .banner-bg {
    width: 100%;
    height: 100%;
  }

  .banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, var(--danger-color-alpha-30) 0%, var(--danger-color-alpha-40) 100%);
  }

  .activity-title {
    font-size: 64rpx;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 16rpx;
    text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
  }

  .activity-subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 40rpx;
  }

  /* 倒计时 */
  .countdown-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
  }

  .countdown-label {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  .countdown-time {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .time-block {
    display: inline-block;
    min-width: 60rpx;
    height: 60rpx;
    line-height: 60rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: bold;
    color: var(--error-color);
    background: var(--bg-color-card);
    border-radius: 8rpx;
    padding: 0 8rpx;
  }

  .time-separator {
    font-size: 32rpx;
    font-weight: bold;
    color: #FFFFFF;
  }

  .no-session-tip {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

/* 场次Tab */
.session-tabs {
  background: var(--bg-color-card);
  padding: 24rpx 0;
  margin-bottom: 16rpx;

  .tabs-scroll {
    white-space: nowrap;
  }

  .tab-item {
    display: inline-block;
    min-width: 160rpx;
    padding: 20rpx 24rpx;
    margin: 0 8rpx;
    text-align: center;
    background: var(--bg-color-disabled);
    border-radius: 16rpx;
    position: relative;
    overflow: hidden;

    &.active {
      background: linear-gradient(135deg, var(--error-color) 0%, var(--danger-color) 100%);

      .tab-time,
      .tab-status {
        color: #FFFFFF;
      }
    }

    .tab-time {
      font-size: 32rpx;
      font-weight: bold;
      color: var(--text-color-primary);
      margin-bottom: 8rpx;
    }

    .tab-status {
      font-size: 22rpx;
      color: var(--text-color-tertiary);
    }

    .tab-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4rpx;
      background: rgba(255, 255, 255, 0.3);

      .progress-bar {
        height: 100%;
        background: var(--bg-color-card);
        border-radius: 2rpx;
      }
    }

    .tab-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.1);

      .loading-dots {
        display: flex;
        align-items: center;
        gap: 6rpx;

        .dot {
          width: 8rpx;
          height: 8rpx;
          background: var(--bg-color-card);
          border-radius: 50%;
          animation: tab-dot-bounce 1.4s infinite ease-in-out both;

          &:nth-child(1) {
            animation-delay: -0.32s;
          }

          &:nth-child(2) {
            animation-delay: -0.16s;
          }

          &:nth-child(3) {
            animation-delay: 0s;
          }
        }
      }
    }
  }
}

/* 商品列表 */
.product-list {
  background: var(--bg-color-disabled);
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 24rpx;
  min-height: calc(100vh - 580rpx);

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .header-title {
      font-size: 32rpx;
      font-weight: bold;
      color: var(--text-color-primary);
    }

    .header-count {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
  }

  .product-item {
    background: var(--bg-color-card);
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &.product-disabled {
      opacity: 0.6;
      filter: grayscale(1);

      .buy-btn {
        background: var(--text-color-placeholder) !important;
        pointer-events: none;
      }
    }
  }

  .product-image-wrapper {
    position: relative;
    width: 100%;
    height: 320rpx;
    overflow: hidden;

    .product-image {
      width: 100%;
      height: 100%;
    }

    .flash-tag {
      position: absolute;
      top: 16rpx;
      left: 16rpx;
      padding: 8rpx 16rpx;
      background: linear-gradient(135deg, var(--error-color) 0%, var(--danger-color) 100%);
      color: #FFFFFF;
      font-size: 22rpx;
      font-weight: bold;
      border-radius: 8rpx;
    }

    .progress-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12rpx 16rpx;
      background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
      display: flex;
      align-items: center;
      gap: 12rpx;

      .progress-bg {
        flex: 1;
        height: 8rpx;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4rpx;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
        }
      }

      .sold-text {
        font-size: 20rpx;
        color: #FFFFFF;
        white-space: nowrap;
      }
    }
  }

  .product-info {
    padding: 16rpx;

    .product-title {
      font-size: 28rpx;
      font-weight: bold;
      color: var(--text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 8rpx;
    }

    .product-desc {
      font-size: 22rpx;
      color: var(--text-color-tertiary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 16rpx;
    }

    .price-section {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .price-left {
        display: flex;
        align-items: baseline;
        gap: 8rpx;

        .currency {
          font-size: 22rpx;
          color: var(--error-color);
          font-weight: bold;
        }

        .price {
          font-size: 36rpx;
          font-weight: bold;
          color: var(--error-color);
        }

        .original-price {
          font-size: 22rpx;
          color: var(--text-color-placeholder);
          text-decoration: line-through;
        }
      }

      .buy-btn {
        padding: 12rpx 24rpx;
        background: linear-gradient(135deg, var(--error-color) 0%, var(--danger-color) 100%);
        color: #FFFFFF;
        font-size: 24rpx;
        font-weight: bold;
        border-radius: 32rpx;
        white-space: nowrap;

        &.disabled {
          background: var(--text-color-placeholder);
        }
      }
    }
  }
}

/* 加载状态 */
.load-more,
.no-more {
  padding: 32rpx 0;
  text-align: center;

  text {
    font-size: 24rpx;
    color: var(--text-color-tertiary);
  }
}

/* 初始加载容器 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  min-height: 400rpx;

  .loading-spinner {
    position: relative;
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &::before {
      content: '⟳';
      position: absolute;
      font-size: 64rpx;
      color: var(--error-color);
      line-height: 1;
      animation: spin 1s linear infinite;
      /* 调整旋转中心到字符视觉中心 */
      transform-origin: 48% 52%;
    }
  }

  .loading-text {
    margin-top: 40rpx;
    font-size: 28rpx;
    color: var(--text-color-tertiary);
    font-weight: 500;

    .loading-words {
      display: inline-block;
      margin-right: 4rpx;

      .word {
        display: inline-block;
        animation: word-fade-in 2.4s infinite ease-in-out both;
        opacity: 0.5;

        &:nth-child(1) {
          animation-delay: 0s;
        }

        &:nth-child(2) {
          animation-delay: 0.3s;
        }

        &:nth-child(3) {
          animation-delay: 0.6s;
        }
      }
    }

    .loading-dots {
      display: inline-block;
      width: 32rpx;
      text-align: left;

      .dot {
        display: inline-block;
        animation: dot-bounce 2.4s infinite ease-in-out both;

        &:nth-child(1) {
          animation-delay: 0.9s;
        }

        &:nth-child(2) {
          animation-delay: 1.1s;
        }

        &:nth-child(3) {
          animation-delay: 1.3s;
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes word-fade-in {
  0% {
    opacity: 0.5;
    transform: translateY(0);
  }
  25% {
    opacity: 1;
    transform: translateY(-2rpx);
  }
  50% {
    opacity: 1;
    transform: translateY(0);
  }
  75% {
    opacity: 0.5;
    transform: translateY(0);
  }
  100% {
    opacity: 0.5;
    transform: translateY(0);
  }
}

@keyframes dot-bounce {
  0% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  30% {
    opacity: 1;
    transform: scale(1.1);
  }
  60% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
}

/* 错误状态容器 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
  min-height: 400rpx;

  .error-icon {
    margin-bottom: 24rpx;
    animation: shake 0.5s ease-in-out;

    .error-circle {
      position: relative;
      width: 120rpx;
      height: 120rpx;
      border: 4rpx solid var(--error-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--danger-color-alpha-5);

      .error-line {
        position: absolute;
        top: 32rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 6rpx;
        height: 36rpx;
        background: var(--error-color);
        border-radius: 3rpx;
      }

      .error-dot {
        position: absolute;
        bottom: 28rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 8rpx;
        height: 8rpx;
        background: var(--error-color);
        border-radius: 50%;
      }
    }
  }

  .error-title {
    font-size: 32rpx;
    font-weight: bold;
    color: var(--text-color-primary);
    margin-bottom: 16rpx;
  }

  .error-message {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
    text-align: center;
    line-height: 1.6;
    margin-bottom: 40rpx;
    max-width: 500rpx;
  }

  .retry-btn {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 48rpx;
    background: linear-gradient(135deg, var(--error-color) 0%, var(--danger-color) 100%);
    border-radius: 48rpx;
    box-shadow: 0 8rpx 24rpx var(--danger-color-alpha-30);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
      box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.2);
    }

    .retry-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32rpx;
      height: 32rpx;

      .refresh-arrow {
        font-size: 28rpx;
        color: #FFFFFF;
        line-height: 1;
        animation: spin 1s linear infinite;
        display: inline-block;
        transform-origin: 48% 52%;
      }
    }

    .retry-text {
      font-size: 28rpx;
      color: #FFFFFF;
      font-weight: 600;
    }
  }
}

@keyframes shake {
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

/* 空数据容器 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
  min-height: 400rpx;

  .empty-icon {
    margin-bottom: 24rpx;
    animation: float 3s ease-in-out infinite;

    .empty-box {
      position: relative;
      width: 140rpx;
      height: 140rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 0.5;

      .box-top {
        position: absolute;
        top: 20rpx;
        width: 80rpx;
        height: 40rpx;
        border: 4rpx solid var(--text-color-placeholder);
        border-radius: 8rpx 8rpx 0 0;
        background: transparent;
      }

      .box-body {
        position: absolute;
        bottom: 20rpx;
        width: 100rpx;
        height: 70rpx;
        border: 4rpx solid var(--text-color-placeholder);
        border-top: none;
        border-radius: 0 0 12rpx 12rpx;
        background: transparent;

        &::before {
          content: '';
          position: absolute;
          top: 20rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 4rpx;
          background: var(--text-color-placeholder);
          border-radius: 2rpx;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: 20rpx;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 4rpx;
          background: var(--text-color-placeholder);
          border-radius: 2rpx;
        }
      }
    }
  }

  .empty-title {
    font-size: 32rpx;
    font-weight: bold;
    color: var(--text-color-primary);
    margin-bottom: 16rpx;
  }

  .empty-message {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
    text-align: center;
    line-height: 1.6;
    margin-bottom: 40rpx;
    max-width: 500rpx;
  }

  .empty-action {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 40rpx;
    background: var(--bg-color-card);
    border: 2rpx solid var(--error-color);
    border-radius: 48rpx;
    transition: all 0.3s ease;

    &:active {
      background: #FFF5F5;
      transform: scale(0.95);
    }

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28rpx;
      height: 28rpx;

      .refresh-arrow {
        font-size: 24rpx;
        color: var(--error-color);
        line-height: 1;
        display: inline-block;
        transform-origin: 48% 52%;
      }
    }

    .action-text {
      font-size: 28rpx;
      color: var(--error-color);
      font-weight: 600;
    }
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

@keyframes tab-dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 页面入场动画 */
.activity-banner {
  opacity: 0;
  transform: scale(0.9) translateY(-40rpx);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.banner-enter {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.session-tabs {
  opacity: 0;
  transform: translateY(30rpx);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s;

  &.tabs-enter {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-list {
  opacity: 0;
  transform: translateY(40rpx);
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s;

  &.list-enter {
    opacity: 1;
    transform: translateY(0);
  }

  .product-item {
    opacity: 0;
    transform: scale(0.95) translateY(20rpx);
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &.list-enter .product-item {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  // 为每个商品项添加延迟效果
  &.list-enter .product-item:nth-child(1) { transition-delay: 0.05s; }
  &.list-enter .product-item:nth-child(2) { transition-delay: 0.1s; }
  &.list-enter .product-item:nth-child(3) { transition-delay: 0.15s; }
  &.list-enter .product-item:nth-child(4) { transition-delay: 0.2s; }
  &.list-enter .product-item:nth-child(5) { transition-delay: 0.25s; }
  &.list-enter .product-item:nth-child(6) { transition-delay: 0.3s; }
}
</style>
