<template>
  <view class="share-page">
    <view class="tab-bar page-animate" :class="{ 'animate-in': isAnimated }">
      <view
        v-for="(tab, index) in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTabIndex === index }"
        @click="switchTab(index)"
      >
        {{ tab.label }}
        <view v-if="currentTabIndex === index" class="tab-indicator"></view>
      </view>
    </view>

    <swiper
      class="content-swiper"
      :current="currentTabIndex"
      :duration="300"
      @change="onSwiperChange"
      @transition="onSwiperTransition"
    >
      <!-- 可借用页面 -->
      <swiper-item class="swiper-item">
        <scroll-view
          class="content-scroll"
          scroll-y
          :scroll-top="0"
          :scroll-with-animation="false"
          @scrolltolower="loadMore"
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
        >
          <!-- 加载骨架屏 -->
          <view v-if="pageLoading" class="skeleton-wrapper">
            <view v-for="i in 3" :key="i" class="skeleton-card">
              <view class="skeleton-image"></view>
              <view class="skeleton-info">
                <view class="skeleton-title"></view>
                <view class="skeleton-price"></view>
                <view class="skeleton-footer"></view>
              </view>
            </view>
          </view>

          <!-- 可借用列表 -->
          <view v-if="!pageLoading" class="share-list">
            <!-- 空状态 -->
            <view v-if="shareList.length === 0" class="empty-state">
              <image class="empty-image" src="/static/images/empty.png" mode="aspectFit" />
              <text class="empty-text">暂无可借用物品</text>
              <text class="empty-hint">快去发布一些共享物品吧</text>
            </view>
            <!-- 列表内容 -->
            <view v-else>
              <product-list-item
                v-for="(item, index) in shareList"
                :key="item.id"
                :data="{
                  id: item.id,
                  title: item.title,
                  image: item.coverImage,
                  price: item.dailyRent,
                  condition: `押金 ¥${item.deposit}`,
                  extra: item.availableTime + (item.distance ? ` · ${item.distance}km` : '')
                }"
                :visible="true"
                :item-style="{ animationDelay: index * 50 + 'ms' }"
                @click="goDetail(item.id)"
              />
            </view>
          </view>

          <view v-if="loading && !pageLoading" class="loading">
            <uni-icons type="spinner-cycle" size="20" color="#AAAAAA" />
            <text class="loading-text">加载中...</text>
          </view>

          <view v-if="noMore && !pageLoading" class="no-more">没有更多了</view>
        </scroll-view>
      </swiper-item>

      <!-- 我的共享页面 -->
      <swiper-item class="swiper-item">
        <scroll-view
          class="content-scroll"
          scroll-y
          :scroll-top="0"
          :scroll-with-animation="false"
          @scrolltolower="loadMore"
          :refresher-enabled="true"
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
        >
          <!-- 加载骨架屏 -->
          <view v-if="pageLoading" class="skeleton-wrapper">
            <view v-for="i in 3" :key="i" class="skeleton-card">
              <view class="skeleton-image"></view>
              <view class="skeleton-info">
                <view class="skeleton-title"></view>
                <view class="skeleton-price"></view>
                <view class="skeleton-footer"></view>
              </view>
            </view>
          </view>

          <!-- 我的共享列表 -->
          <view v-if="!pageLoading" class="share-list">
            <!-- 空状态 -->
            <view v-if="myList.length === 0" class="empty-state">
              <image class="empty-image" src="/static/images/empty.png" mode="aspectFit" />
              <text class="empty-text">还没有共享物品</text>
              <text class="empty-hint">发布共享物品赚取收益吧</text>
            </view>
            <!-- 列表内容 -->
            <view v-else>
              <product-list-item
                v-for="(item, index) in myList"
                :key="item.id"
                :data="{
                  id: item.id,
                  title: item.title,
                  image: item.coverImage,
                  price: item.dailyRent,
                  condition: `押金 ¥${item.deposit}`,
                  extra: getStatusText(item.status)
                }"
                :visible="true"
                :item-style="{ animationDelay: index * 50 + 'ms' }"
                @click="goDetail(item.id)"
              />
            </view>
          </view>

          <view v-if="loading && !pageLoading" class="loading">
            <uni-icons type="spinner-cycle" size="20" color="#AAAAAA" />
            <text class="loading-text">加载中...</text>
          </view>

          <view v-if="noMore && !pageLoading" class="no-more">没有更多了</view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
import { useThemePage } from '@/utils/theme'
import { ref, onMounted, computed } from 'vue'
import { shareApi } from '@/api/share'
import ProductListItem from '@/components/product-list-item/product-list-item.vue'
import { normalizeImageUrl } from '@/utils/image'
import { onShow } from '@dcloudio/uni-app'

function formatAvailableTime(raw: string): string {
  if (!raw) return '随时可借用'
  try {
    const obj = JSON.parse(raw)
    const parts: string[] = []
    if (obj.rentalType === 'days' && obj.rentalDays) {
      parts.push(`可借${obj.rentalDays}天`)
    } else if (obj.rentalType === 'hours' && obj.rentalHours) {
      parts.push(`可借${obj.rentalHours}小时`)
    }
    const deliveryMap: Record<string, string> = {
      self: '自取',
      mailing: '邮寄',
      both: '自取/邮寄'
    }
    if (obj.deliveryMethod) {
      parts.push(deliveryMap[obj.deliveryMethod] || obj.deliveryMethod)
    }
    return parts.length > 0 ? parts.join(' · ') : '随时可借用'
  } catch {
    return raw || '随时可借用'
  }
}

interface ShareItem {
  id: string
  shareId?: string
  title: string
  coverImage: string
  dailyRent: number
  deposit: number
  availableTime: string
  status: number
  distance?: number
}

const tabs = [
  { label: '可借用', value: 'available' },
  { label: '我的共享', value: 'mine' }
]

const currentTabIndex = ref(0)
const isAnimated = ref(false)
const shareList = ref<ShareItem[]>([])
const myList = ref<ShareItem[]>([])
const loading = ref(false)
const pageLoading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const currentPage = ref(1)
const pageSize = 20

// 计算当前tab的值
const currentTab = computed(() => tabs[currentTabIndex.value].value)

// 页面加载时获取 URL 参数

onShow(() => {
  useThemePage()
})

onMounted(() => {
  // 获取页面参数，确定要显示的标签页
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  // 如果有 tab 参数，切换到对应的标签页
  if (options.tab === 'mine') {
    currentTabIndex.value = 1
  } else if (options.tab === 'available') {
    currentTabIndex.value = 0
  }

  loadData()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

async function loadData() {
  if (loading.value) return

  loading.value = true

  try {
    console.log('[ShareIndex] 开始加载数据, tab:', currentTab.value)

    if (currentTab.value === 'available') {
      // 加载可借用物品列表
      const response: any = await shareApi.getShareItemList({
        status: 1,
        page: currentPage.value,
        size: pageSize
      })

      console.log('[ShareIndex] 可借用物品响应:', response)

      const data = response.data || response || {}
      const list = data.list || data.records || []

      // 处理数据字段映射
      const mappedList = list.map((item: any) => ({
        id: item.id || item.shareId,
        shareId: item.shareId || item.id,
        title: item.title,
        coverImage: normalizeImageUrl(item.coverImageUrl || item.coverImage || item.image || ''),
        dailyRent: item.dailyRent,
        deposit: item.deposit,
        availableTime: formatAvailableTime(item.availableTimes || item.availableTime || ''),
        status: item.status,
        distance: item.distance,
        userName: item.ownerNickname || item.userName || '',
        userAvatar: item.ownerAvatar || item.userAvatar || ''
      }))

      if (currentPage.value === 1) {
        shareList.value = mappedList
      } else {
        shareList.value.push(...mappedList)
      }

      noMore.value = shareList.value.length >= (data.total || 0) || mappedList.length < pageSize
    } else if (currentTab.value === 'mine') {
      // 加载我的共享物品
      const response: any = await shareApi.getMyShareItems({
        page: currentPage.value,
        size: pageSize
      })

      console.log('[ShareIndex] 我的共享响应:', response)

      const data = response.data || response || {}
      const list = data.list || data.records || []

      // 处理数据字段映射
      const mappedList = list.map((item: any) => ({
        id: item.id || item.shareId,
        shareId: item.shareId || item.id,
        title: item.title,
        coverImage: normalizeImageUrl(item.coverImageUrl || item.coverImage || item.image || ''),
        dailyRent: item.dailyRent,
        deposit: item.deposit,
        availableTime: formatAvailableTime(item.availableTimes || item.availableTime || ''),
        status: item.status,
        userName: item.ownerNickname || item.userName || '',
        userAvatar: item.ownerAvatar || item.userAvatar || ''
      }))

      if (currentPage.value === 1) {
        myList.value = mappedList
      } else {
        myList.value.push(...mappedList)
      }

      noMore.value = myList.value.length >= (data.total || 0) || mappedList.length < pageSize
    }
  } catch (error) {
    console.error('[ShareIndex] 加载失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    pageLoading.value = false
    refreshing.value = false
  }
}

function switchTab(index: number) {
  if (currentTabIndex.value === index) return
  currentTabIndex.value = index
  currentPage.value = 1
  noMore.value = false
  loadData()
}

// swiper滑动切换事件
function onSwiperChange(e: any) {
  const index = e.detail.current
  if (currentTabIndex.value !== index) {
    currentTabIndex.value = index
    currentPage.value = 1
    noMore.value = false
    loadData()
  }
}

// swiper过渡动画事件（可选，用于添加更流畅的效果）
function onSwiperTransition(e: any) {
  // 可以在这里添加一些过渡效果
}

function loadMore() {
  if (loading.value || noMore.value) return
  currentPage.value++
  loadData()
}

function onRefresh() {
  refreshing.value = true
  currentPage.value = 1
  noMore.value = false
  loadData()
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

function goDetail(id: string) {
  uni.navigateTo({
    url: `/pages/share/detail?id=${id}`
  })
}

function getStatusText(status: number) {
  // 与后端状态码保持一致
  const map: Record<number, string> = {
    0: '已下架',
    1: '可借用',
    2: '借用中'
  }
  return map[status] || '未知'
}

// 发布共享物品
function goToPublish() {
  uni.navigateTo({
    url: '/pages/share/publish'
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

.share-page {
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

  // 发布按钮
  .publish-btn {
    width: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16rpx;
    background: linear-gradient(135deg, var(--success-color), var(--success-color));
    border-radius: 12rpx;
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .publish-icon {
      font-size: 48rpx;
      color: var(--bg-color-card);
      font-weight: 300;
      line-height: 1;
    }
  }
}

@keyframes indicatorSlideIn {
  from {
    transform: translateX(-50%) scaleX(0);
  }
  to {
    transform: translateX(-50%) scaleX(1);
  }
}

.content-swiper {
  flex: 1;
  height: 100%;
}

.swiper-item {
  height: 100%;
}

.content-scroll {
  height: 100%;
  padding: 16rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.share-list {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  /* 基础样式由 product-list-item 组件提供 */
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;

  .loading-text {
    margin-left: 16rpx;
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

.no-more {
  text-align: center;
  padding: 32rpx;
  font-size: var(--font-size-sm);
  color: var(--text-color-tertiary);
}

/* 骨架屏样式 */
.skeleton-wrapper {
  padding: 16rpx;
}

.skeleton-card {
  display: flex;
  background: var(--bg-color-card);
  border-radius: var(--spacing-sm);
  padding: 16rpx;
  margin-bottom: 16rpx;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: var(--spacing-sm);
  margin-right: 16rpx;
  background: linear-gradient(90deg, var(--border-color-light) 25%, var(--border-color-base) 50%, var(--border-color-light) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.skeleton-title {
  height: 40rpx;
  background: linear-gradient(90deg, var(--border-color-light) 25%, var(--border-color-base) 50%, var(--border-color-light) 75%);
  background-size: 200% 100%;
  border-radius: 4rpx;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-price {
  height: 32rpx;
  width: 60%;
  margin-top: 12rpx;
  background: linear-gradient(90deg, var(--border-color-light) 25%, var(--border-color-base) 50%, var(--border-color-light) 75%);
  background-size: 200% 100%;
  border-radius: 4rpx;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-footer {
  height: 28rpx;
  width: 40%;
  margin-top: 12rpx;
  background: linear-gradient(90deg, var(--border-color-light) 25%, var(--border-color-base) 50%, var(--border-color-light) 75%);
  background-size: 200% 100%;
  border-radius: 4rpx;
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  animation: fadeIn 0.3s ease-in-out;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: var(--spacing-md);
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

/* 列表项动画 */
/* 组件已提供列表项入场动画 */

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

/* Tab切换过渡动画 */
.tab-content {
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
