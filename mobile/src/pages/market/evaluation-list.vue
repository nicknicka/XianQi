<template>
  <view class="evaluation-list-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="商品评价"
      :show-back="true"
      :background-color="bgColorCard"
      :text-color="textColorPrimary"
    />

    <!-- 评价概览 -->
    <view class="summary-section">
      <view class="rating-summary">
        <text class="average-rating">{{ summaryData.averageRating || '0.0' }}</text>
        <view class="stars">
          <uni-icons
            v-for="star in 5"
            :key="star"
            :type="star <= Math.round(summaryData.averageRating || 0) ? 'star-filled' : 'star'"
            size="16"
            :color="star <= Math.round(summaryData.averageRating || 0) ? warningColor : borderColorBase"
          />
        </view>
        <text class="total-count">{{ summaryData.totalCount || 0 }}条评价</text>
      </view>
    </view>

    <!-- 评价列表 -->
    <scroll-view class="scroll-view" scroll-y @scrolltolower="loadMore" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="evaluations.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无评价</text>
        <text class="empty-hint">快来发表第一条评价吧</text>
      </view>

      <view v-else class="evaluation-list">
        <view v-for="item in evaluations" :key="item.id" class="evaluation-item">
          <!-- 用户信息 -->
          <view class="user-header">
            <UserAvatar class="user-avatar" :src="item.fromUserAvatar" size="md" shape="circle" />
            <view class="user-info">
              <text class="user-name">{{ item.fromUserName }}</text>
              <view class="evaluation-rating">
                <uni-icons
                  v-for="i in 5"
                  :key="i"
                  :type="i <= item.rating ? 'star-filled' : 'star'"
                  size="12"
                  :color="i <= item.rating ? warningColor : borderColorBase"
                />
              </view>
            </view>
            <text class="eval-time">{{ formatTime(item.createdAt) }}</text>
          </view>

          <!-- 评价内容 -->
          <text class="evaluation-content">{{ item.content }}</text>

          <!-- 评价标签 -->
          <view class="evaluation-tags" v-if="item.tags && item.tags.length > 0">
            <text class="eval-tag" v-for="(tag, idx) in item.tags" :key="idx">{{ tag }}</text>
	          </view>

	          <!-- 评价图片 -->
	          <view class="evaluation-images" v-if="item.images && item.images.length > 0">
	            <lazy-image
	              v-for="(img, imgIndex) in item.images"
	              :key="imgIndex"
	              class="eval-image"
	              :src="img"
	              mode="aspectFill"
	              width="160"
	              height="160"
	              @click="previewImages(item.images, imgIndex)"
	            />
	          </view>

	          <!-- 追加评价 -->
	          <view class="append-evaluation" v-if="item.appendContent || (item.appendImages && item.appendImages.length > 0)">
	            <text class="append-label">追评</text>
	            <text class="append-content" v-if="item.appendContent">{{ item.appendContent }}</text>
	            <view class="evaluation-images" v-if="item.appendImages && item.appendImages.length > 0">
	              <lazy-image
	                v-for="(img, imgIndex) in item.appendImages"
	                :key="imgIndex"
	                class="eval-image"
	                :src="img"
	                mode="aspectFill"
	                width="160"
	                height="160"
	                @click="previewImages(item.appendImages, imgIndex)"
	              />
	            </view>
	          </view>

          <!-- 商品信息（可点击跳转） -->
          <view class="product-card" v-if="item.productImage" @click="goToProduct(item.productId)">
            <lazy-image class="product-thumb" :src="item.productImage" mode="aspectFill" width="80" height="80" />
            <view class="product-info">
              <text class="product-name">{{ item.productName }}</text>
              <text class="product-price">¥{{ item.productPrice }}</text>
            </view>
            <uni-icons type="right" size="14" :color="textColorTertiary" />
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <uni-icons type="spinner-cycle" size="20" :color="textColorTertiary" />
        <text class="loading-text">加载中...</text>
      </view>

      <view v-if="noMore && evaluations.length > 0" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useThemeColors, useThemeStyle } from '@/utils/theme'
import { useThemePage } from '@/utils/theme'
import { evaluationApi } from '@/api/evaluation'
import { formatDateTime } from '@/utils/date'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'

const { themeStyle } = useThemeStyle()
const {
  bgColorCard,
  textColorPrimary,
  textColorTertiary,
  warningColor,
  borderColorBase,
} = useThemeColors()

onShow(() => {
  useThemePage()
})

const productId = ref<string>('')
const evaluations = ref<any[]>([])
const summaryData = ref({
  averageRating: 0,
  totalCount: 0
})
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const page = ref(1)
const pageSize = 20

function normalizeStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && !!item.trim())
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && !!item.trim())
      }
    } catch (error) {
      // ignore invalid json and fall back to comma split
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  productId.value = options.id || options.productId || ''

  if (productId.value) {
    loadEvaluations()
  }
})

function loadEvaluations(refresh = false) {
  if (loading.value) return

  if (refresh) {
    page.value = 1
    noMore.value = false
  }

  loading.value = true

  evaluationApi.getProductEvaluations(productId.value, {
    page: page.value,
    pageSize
  }).then((res: any) => {
    console.log('[evaluation-list] 评价数据:', res)

    const data = res.data || res

    // 更新概览数据
    if (page.value === 1) {
      summaryData.value = {
        averageRating: data.averageRating || 0,
        totalCount: data.totalCount || 0
      }
    }

    // 处理评价列表数据
    const list = (data.list || []).map((item: any) => ({
      ...item,
      id: item.id || item.evaluationId || item.evalId,
      fromUserName: item.fromUserName || item.evaluatorName || item.evaluatorNickname || '匿名用户',
      fromUserAvatar: item.fromUserAvatar || item.evaluatorAvatar || '',
      productName: item.productName || item.productTitle || '未知商品',
      tags: normalizeStringArray(item.tags),
      images: normalizeStringArray(item.images),
      appendImages: normalizeStringArray(item.appendImages),
      createdAt: item.createdAt || ''
    }))

    if (refresh) {
      evaluations.value = list
    } else {
      evaluations.value = [...evaluations.value, ...list]
    }

    noMore.value = list.length < pageSize
  }).catch((err: any) => {
    console.error('[evaluation-list] 加载失败:', err)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }).finally(() => {
    loading.value = false
    refreshing.value = false
  })
}

function loadMore() {
  if (!loading.value && !noMore.value) {
    page.value++
    loadEvaluations()
  }
}

function onRefresh() {
  refreshing.value = true
  loadEvaluations(true)
}

function goBack() {
  uni.navigateBack()
}

function goToProduct(id: string) {
  uni.navigateTo({
    url: `/pages/market/detail?id=${id}`
  })
}

function previewImages(images: string[], index: number) {
  uni.previewImage({
    urls: images,
    current: index
  })
}

function formatTime(time: string) {
  if (!time) return ''
  return formatDateTime(time, 'YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.evaluation-list-page {
  min-height: 100vh;
  background: var(--bg-color-page);
}

.summary-section {
  background: var(--bg-color-card);
  padding: 32rpx 24rpx;
  margin-bottom: 16rpx;

  .rating-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;

    .average-rating {
      font-size: 64rpx;
      font-weight: 700;
      color: var(--error-color);
    }

    .stars {
      display: flex;
      gap: 4rpx;
    }

    .total-count {
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
    }
  }
}

.scroll-view {
  height: calc(100vh - 200rpx);
}

.evaluation-list {
  .evaluation-item {
    background: var(--bg-color-card);
    border-radius: var(--spacing-sm);
    padding: 24rpx;
    margin-bottom: 16rpx;

    .user-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;

      .user-avatar {
        width: 64rpx;
        height: 64rpx;
        margin-right: 16rpx;
      }

      .user-info {
        flex: 1;

        .user-name {
          font-size: var(--font-size-base);
          color: var(--text-color-primary);
          display: block;
          margin-bottom: 6rpx;
        }

        .evaluation-rating {
          display: flex;
          gap: 4rpx;
        }
      }

      .eval-time {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }

    .evaluation-content {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      line-height: 1.6;
      display: block;
      margin-bottom: 12rpx;
    }

    .evaluation-tags {
      display: flex;
      gap: 12rpx;
      margin-bottom: 12rpx;
      flex-wrap: wrap;

      .eval-tag {
        padding: 6rpx 12rpx;
        background: var(--bg-color-page);
        color: var(--text-color-secondary);
        font-size: var(--font-size-sm);
        border-radius: 4rpx;
      }
    }

	    .evaluation-images {
	      display: flex;
	      gap: 12rpx;
	      margin-bottom: 12rpx;

	      .eval-image {
	        width: 160rpx;
	        height: 160rpx;
	        border-radius: var(--spacing-sm);
	      }
	    }

	    .append-evaluation {
	      padding: 16rpx;
	      margin-bottom: 12rpx;
	      background: var(--bg-color-page);
	      border-radius: var(--spacing-sm);

	      .append-label {
	        display: inline-block;
	        padding: 4rpx 10rpx;
	        margin-bottom: 10rpx;
	        background: var(--primary-color-light);
	        color: var(--primary-color);
	        border-radius: 999rpx;
	        font-size: var(--font-size-xs);
	      }

	      .append-content {
	        display: block;
	        margin-bottom: 12rpx;
	        color: var(--text-color-primary);
	        font-size: var(--font-size-sm);
	        line-height: 1.6;
	      }
	    }

	    .product-card {
      display: flex;
      align-items: center;
      padding: 16rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);

      .product-thumb {
        width: 80rpx;
        height: 80rpx;
        border-radius: var(--spacing-xs);
        margin-right: 16rpx;
      }

      .product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6rpx;

        .product-name {
          font-size: var(--font-size-sm);
          color: var(--text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 400rpx;
        }

        .product-price {
          font-size: var(--font-size-sm);
          color: var(--error-color);
          font-weight: 600;
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
  padding: 200rpx 0;

  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
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
</style>
