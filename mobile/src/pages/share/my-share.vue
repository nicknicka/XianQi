<template>
  <view class="my-share-page service-redesign-page page-animate" :class="{ 'animate-in': isAnimated }" :style="themeStyle">
    <scroll-view
      class="content-scroll"
      scroll-y
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
        <view v-if="shareList.length > 0" class="summary-card">
          <view class="summary-main">
            <text class="summary-kicker">共享物品</text>
            <text class="summary-title">{{ shareList.length }} 件正在管理</text>
            <text class="summary-desc">查看状态，快速上下架你的共享物品</text>
          </view>
          <button class="summary-action" @click="goToPublish">
            <uni-icons type="plusempty" size="16" color="#FFFFFF" />
            <text>发布</text>
          </button>
        </view>

        <!-- 空状态 -->
        <view v-if="shareList.length === 0" class="empty-state">
          <image class="empty-image" src="/static/images/empty.png" mode="aspectFit" />
          <text class="empty-text">还没有共享物品</text>
          <text class="empty-hint">发布共享物品赚取收益吧</text>
          <button class="publish-btn" @click="goToPublish">立即发布</button>
        </view>
        <!-- 列表内容 -->
        <view v-else class="share-card-list">
          <view
            v-for="(item, index) in shareList"
            :key="item.id"
            class="share-card"
            :style="{ animationDelay: index * 50 + 'ms' }"
            @click="goDetail(item.id)"
          >
            <view class="cover-wrap">
              <lazy-image
                v-if="item.coverImage"
                class="share-cover"
                :src="item.coverImage"
                mode="aspectFill"
                :width="184"
                :height="184"
                :disable-lazy-load="true"
                error-icon="gift"
                @error="handleCoverError(item.id)"
              />
              <view class="cover-fallback" v-if="!item.coverImage">
                <uni-icons type="gift" size="32" color="#C3CAD4" />
              </view>
              <view class="status-badge" :class="'status-' + item.status">
                {{ getStatusText(item.status) }}
              </view>
            </view>

            <view class="card-content">
              <view class="card-top">
                <text class="share-title">{{ item.title }}</text>
                <uni-icons type="right" size="16" color="#B8C0CC" />
              </view>

              <view class="price-row">
                <view class="rent-block">
                  <text class="currency">¥</text>
                  <text class="rent">{{ item.dailyRent }}</text>
                  <text class="unit">/天</text>
                </view>
                <view class="deposit-chip">押金 ¥{{ item.deposit }}</view>
              </view>

              <view class="card-footer" @click.stop>
                <view class="status-note">
                  <view class="status-dot" :class="'status-' + item.status"></view>
                  <text>{{ getStatusHint(item.status) }}</text>
                </view>
                <view class="actions">
                  <button
                    v-if="item.status === 0 || item.status === 1"
                    class="action-btn ghost"
                    size="mini"
                    @click="goDetail(item.id)"
                  >查看</button>
                  <button
                    v-if="item.status === 1"
                    class="action-btn danger"
                    size="mini"
                    @click="offlineItem(item.id)"
                  >下架</button>
                  <button
                    v-if="item.status === 0"
                    class="action-btn primary"
                    size="mini"
                    @click="onlineItem(item.id)"
                  >上架</button>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading && !pageLoading" class="loading">
        <uni-icons type="spinner-cycle" size="20" color="#AAAAAA" />
        <text class="loading-text">加载中...</text>
      </view>

      <view v-if="noMore && !pageLoading" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeStyle } from '@/utils/theme'
import { ref, onMounted } from 'vue'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { shareApi } from '@/api/share'
import { onShow } from '@dcloudio/uni-app'
import { normalizeImageEntry, parseImageList } from '@/utils/image'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

interface ShareItem {
  id: string
  title: string
  images: string[]
  coverImage: string
  dailyRent: number
  deposit: number
  status: number
  description?: string
  availableTime?: string
}

const { themeStyle } = useThemeStyle()

const shareList = ref<ShareItem[]>([])
const isAnimated = ref(false)
const loading = ref(false)
const pageLoading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const page = ref(1)
const pageSize = ref(10)

onShow(() => {
  useThemePage()
})

onMounted(() => {
  loadData()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

async function loadData() {
  if (page.value === 1) {
    pageLoading.value = true
  }
  loading.value = true

  const requestParams = {
    page: page.value,
    size: pageSize.value
  }

  console.log('[MyShare] 开始加载我的共享物品:', requestParams)

  try {
    const response = await shareApi.getMyShareItems(requestParams)

    console.log('[MyShare] API 响应:', response)

    const data: any = response.data || response || {}
    const newList: ShareItem[] = data.list || data.records || []

    console.log('[MyShare] 解析后的数据:', {
      list: newList,
      total: data.total || 0
    })

    // 打印每个共享物品的详细信息，特别是状态字段
    newList.forEach((item: any, index: number) => {
      console.log(`[MyShare] 物品 ${index + 1}:`, {
        id: item.id,
        title: item.title,
        status: item.status,
        statusText: getStatusText(item.status),
        allFields: Object.keys(item)
      })
    })

    // 字段名与图片归一化已在 api/share.ts 的 normalizeShareItem 完成；
    // 这里只把 coverImage 兜底进 images（列表可能没有 images 但有封面）。
    const mappedList = newList.map((item: any) => ({
      ...item,
      images: item.images && item.images.length > 0
        ? item.images
        : item.coverImage
        ? [item.coverImage]
        : []
    }))

    console.log('[MyShare] 映射后的封面图:', mappedList.map((item) => ({
      id: item.id,
      title: item.title,
      coverImage: item.coverImage
    })))

    if (page.value === 1) {
      shareList.value = mappedList
    } else {
      shareList.value.push(...mappedList)
    }
    noMore.value = shareList.value.length >= (data.total || 0) || mappedList.length < pageSize.value
  } catch (error) {
    console.error('[MyShare] 加载失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
    if (page.value === 1) {
      shareList.value = []
    }
  } finally {
    loading.value = false
    pageLoading.value = false
    refreshing.value = false
  }
}

function loadMore() {
  if (loading.value || noMore.value) return
  page.value++
  loadData()
}

function onRefresh() {
  refreshing.value = true
  page.value = 1
  loadData()
}

function goDetail(id: string) {
  uni.navigateTo({
    url: `/pages/share/detail?id=${id}`
  })
}

function goToPublish() {
  uni.navigateTo({
    url: '/pages/share/publish'
  })
}

async function offlineItem(id: string) {
  uni.showModal({
    title: '提示',
    content: '确定要下架这个共享物品吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await shareApi.updateShareItemStatus(id, 0)
          uni.showToast({ title: '已下架', icon: 'success' })
          refreshList()
        } catch (error) {
          uni.showToast({ title: '下架失败', icon: 'none' })
        }
      }
    }
  })
}

async function onlineItem(id: string) {
  uni.showModal({
    title: '提示',
    content: '确定要重新上架这个共享物品吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await shareApi.updateShareItemStatus(id, 1)
          uni.showToast({ title: '已上架', icon: 'success' })
          refreshList()
        } catch (error) {
          uni.showToast({ title: '上架失败', icon: 'none' })
        }
      }
    }
  })
}

function refreshList() {
  page.value = 1
  loadData()
}

function handleCoverError(id: string) {
  shareList.value = shareList.value.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        images: [],
        coverImage: ''
      }
    }
    return item
  })
}

function getStatusText(status: number) {
  const map: Record<number, string> = {
    0: '已下架',
    1: '可借用',
    2: '借用中',
    4: '草稿'
  }
  const text = map[status] || '未知'
  if (text === '未知') {
    console.warn(`[MyShare] 未知的共享物品状态值: ${status}`, {
      status,
      statusType: typeof status,
      validValues: Object.keys(map).join(', ')
    })
  }
  return text
}

function getStatusHint(status: number) {
  const map: Record<number, string> = {
    0: '当前不可被借用',
    1: '同学可提交借用申请',
    2: '物品正在借用中',
    4: '草稿待完善'
  }
  return map[status] || '状态待确认'
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

.my-share-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.content-scroll {
  flex: 1;
  height: 100%;
  padding: 20rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.share-list {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.summary-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  margin-bottom: 22rpx;
  border-radius: 24rpx;
  color: #FFFFFF;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 44%),
    linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  box-shadow: 0 18rpx 36rpx var(--primary-color-alpha-20);
  overflow: hidden;
}

.summary-card::after {
  content: '';
  position: absolute;
  right: -40rpx;
  bottom: -70rpx;
  width: 210rpx;
  height: 210rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
}

.summary-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.summary-kicker {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.74);
}

.summary-title {
  font-size: 38rpx;
  line-height: 1.2;
  font-weight: 700;
}

.summary-desc {
  font-size: 24rpx;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.84);
}

.summary-action {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  height: 68rpx;
  line-height: 68rpx;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 0 22rpx;
  margin: 0;
  border: none;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
  font-size: 26rpx;
  font-weight: 600;

  &::after {
    border: none;
  }
}

.share-card-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.share-card {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 22rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: var(--bg-color-card);
  border: 1px solid var(--border-color-light);
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: share-card-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:active {
    transform: scale(0.985);
    box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.07);
  }
}

.cover-wrap {
  position: relative;
  width: 184rpx;
  height: 184rpx;
  flex-shrink: 0;
  border-radius: 22rpx;
  background: var(--bg-color-page);
  overflow: hidden;
}

.share-cover,
.cover-fallback {
  width: 100%;
  height: 100%;
}

.cover-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F4F6F8;
}

.status-badge {
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  max-width: calc(100% - 24rpx);
  height: 42rpx;
  line-height: 42rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-color-secondary);
  font-size: 22rpx;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);

  &.status-1 {
    color: var(--success-color);
  }

  &.status-2 {
    color: var(--primary-color);
  }

  &.status-0 {
    color: var(--danger-color);
  }
}

.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16rpx;
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.share-title {
  flex: 1;
  min-width: 0;
  font-size: 31rpx;
  line-height: 1.35;
  font-weight: 700;
  color: var(--text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}

.rent-block {
  display: flex;
  align-items: baseline;
  color: var(--text-color-primary);
}

.currency {
  font-size: 24rpx;
  font-weight: 700;
}

.rent {
  font-size: 38rpx;
  line-height: 1;
  font-weight: 800;
}

.unit {
  margin-left: 2rpx;
  font-size: 22rpx;
  color: var(--text-color-tertiary);
}

.deposit-chip {
  height: 44rpx;
  line-height: 44rpx;
  padding: 0 14rpx;
  border-radius: 10rpx;
  background: var(--bg-color-page);
  color: var(--text-color-tertiary);
  font-size: 24rpx;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.status-note {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: var(--text-color-tertiary);
  font-size: 23rpx;

  text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.status-dot {
  width: 10rpx;
  height: 10rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--text-color-tertiary);

  &.status-1 {
    background: var(--success-color);
  }

  &.status-2 {
    background: var(--primary-color);
  }

  &.status-0 {
    background: var(--danger-color);
  }
}

.actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;

  .action-btn {
    min-width: 82rpx;
    height: 54rpx;
    line-height: 54rpx;
    padding: 0 18rpx;
    margin: 0;
    font-size: 24rpx;
    font-weight: 600;
    border: none;
    border-radius: 999rpx;

    &::after {
      border: none;
    }

    &.ghost {
      background: var(--bg-color-page);
      color: var(--text-color-secondary);
    }

    &.danger {
      background: var(--danger-color-alpha-6);
      color: var(--danger-color);
    }

    &.primary {
      background: var(--primary-color);
      color: var(--bg-color-card);
      box-shadow: 0 6rpx 14rpx var(--primary-color-alpha-20);
    }
  }
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
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
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
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4rpx;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-price {
  height: 32rpx;
  width: 60%;
  margin-top: 12rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4rpx;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-footer {
  height: 28rpx;
  width: 40%;
  margin-top: 12rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
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

@keyframes share-card-in {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
  margin-bottom: 40rpx;
}

.publish-btn {
  min-width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: var(--primary-color);
  color: var(--bg-color-card);
  font-size: var(--font-size-base);
  border-radius: 36rpx;
  border: none;
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
</style>
