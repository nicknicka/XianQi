<template>
  <uni-popup ref="popupRef" type="bottom" :safe-area="false" :mask-click="true">
    <view class="product-preview">
      <!-- 预览头部 -->
      <view class="preview-header">
        <text class="header-title">商品详情</text>
        <view class="header-close" @click="close">
          <text class="close-icon">×</text>
        </view>
      </view>

      <!-- 预览内容 -->
      <scroll-view class="preview-content" scroll-y>
        <!-- 商品图片轮播 -->
        <swiper class="product-images" indicator-dots indicator-color="rgba(0,0,0,0.3)" :indicator-active-color="primaryColor" :autoplay="false">
          <swiper-item v-for="(image, index) in product.images" :key="index">
            <lazy-image
              class="preview-image"
              :src="image"
              mode="aspectFill"
              width="500"
              height="500"
              @click="previewImages(index)"
            />
          </swiper-item>
        </swiper>

        <!-- 商品信息 -->
        <view class="product-details">
          <!-- 价格和标题 -->
          <view class="price-section">
            <view class="price-row">
              <text class="current-price">¥{{ product.price }}</text>
              <text class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</text>
            </view>
            <view class="product-tags">
              <text class="tag condition-tag">{{ getConditionLabel(product.condition) }}</text>
              <text class="tag category-tag">{{ product.categoryName }}</text>
            </view>
          </view>

          <text class="product-title">{{ product.title }}</text>
          <text class="product-description">{{ product.description }}</text>

          <!-- 卖家信息 -->
          <view class="seller-section" @click="goToUser">
            <UserAvatar class="seller-avatar" :src="product.userAvatar" size="md" shape="circle" />
            <view class="seller-info">
              <text class="seller-name">{{ product.userName }}</text>
              <view class="seller-stats">
                <text class="stat-item" v-if="product.creditLevel">
                  <text class="stat-icon">★</text>
                  {{ product.creditLevel }}
                </text>
                <text class="stat-item" v-if="product.location">
                  <text class="stat-icon">📍</text>
                  {{ product.location }}
                </text>
              </view>
            </view>
            <view class="seller-action">
              <text class="action-text">主页</text>
              <text class="action-arrow">›</text>
            </view>
          </view>

          <!-- 商品状态 -->
          <view class="product-status">
            <view class="status-item">
              <text class="status-label">发布时间</text>
              <text class="status-value">{{ formatTime(product.createdAt) }}</text>
            </view>
            <view class="status-item">
              <text class="status-label">浏览次数</text>
              <text class="status-value">{{ product.viewCount || 0 }}次</text>
            </view>
            <view class="status-item">
              <text class="status-label">收藏次数</text>
              <text class="status-value">{{ product.favoriteCount || 0 }}次</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="preview-actions">
        <view class="action-group">
          <view class="action-btn secondary-btn" @click="toggleFavorite">
            <text class="action-icon" :class="{ active: isFavorited }">♥</text>
            <text class="action-label">{{ isFavorited ? '已收藏' : '收藏' }}</text>
          </view>
          <view class="action-btn secondary-btn" @click="shareProduct">
            <text class="action-icon">⤳</text>
            <text class="action-label">分享</text>
          </view>
        </view>
        <view class="action-group">
          <view class="action-btn secondary-btn" @click="reportProduct">
            <text class="action-icon">⚠</text>
            <text class="action-label">举报</text>
          </view>
          <view class="action-btn primary-btn" @click="goToDetail">
            <text class="btn-text">查看详情</text>
          </view>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { share } from '@/utils/share'
import { searchHistory } from '@/utils/search-history'
import type { Product } from '@/types'
import { getConditionLabel } from '@/types'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'
import type { IdLike } from '@/utils/id'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

interface Props {
  product: Product
}

const props = defineProps<Props>()

const emit = defineEmits<{
  favorite: [product: Product]
  unfavorite: [product: Product]
  report: [product: Product]
  goToDetail: [product: Product]
  goToUser: [user: { id: IdLike; name: string; avatar: string }]
}>()

const popupRef = ref<UniApp.Popup>()
const isFavorited = ref(false)

// 打开预览
function open() {
  popupRef.value?.open()
  // 记录浏览
  trackView()
}

// 关闭预览
function close() {
  popupRef.value?.close()
}

// 预览图片
function previewImages(index: number) {
  uni.previewImage({
    current: index,
    urls: props.product.images
  })
}

// 切换收藏
function toggleFavorite() {
  isFavorited.value = !isFavorited.value
  if (isFavorited.value) {
    emit('favorite', props.product)
    uni.showToast({ title: '收藏成功', icon: 'success' })
  } else {
    emit('unfavorite', props.product)
    uni.showToast({ title: '取消收藏', icon: 'none' })
  }
}

// 分享商品
async function shareProduct() {
  try {
    await share.product(props.product)
    emit('favorite', props.product) // 分享成功后也可以记录
  } catch (error) {
    console.error('分享失败:', error)
  }
}

// 举报商品
function reportProduct() {
  uni.showActionSheet({
    itemList: ['虚假商品', '违禁品', '抄袭/侵权', '骚扰/垃圾信息', '其他'],
    success: (res) => {
      const reasons = ['fake', 'prohibited', 'infringement', 'spam', 'other']
      emit('report', { ...props.product, reportReason: reasons[res.tapIndex] })
      uni.showToast({ title: '举报已提交', icon: 'success' })
    }
  })
}

// 查看详情
function goToDetail() {
  close()
  emit('goToDetail', props.product)
}

// 跳转用户主页
function goToUser() {
  emit('goToUser', {
    id: props.product.userId,
    name: props.product.userName,
    avatar: props.product.userAvatar
  })
}

// 格式化时间
function formatTime(timestamp: string | number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getMonth() + 1}-${date.getDate()}`
}

// 记录浏览
function trackView() {
  // TODO: 集成埋点统计
  console.log('预览商品:', props.product.id)
}

// 暴露方法
defineExpose({
  open,
  close
})
</script>

<script lang="ts">
export default {
  name: 'ProductPreview',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.product-preview {
  // 使用 calc 计算高度，减去底部安全区域
  height: calc(90vh - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  background: var(--bg-color-disabled);
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: var(--bg-color-card);
  border-bottom: 1rpx solid var(--border-color-light);
  flex-shrink: 0;

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .header-close {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--bg-color-disabled);

    .close-icon {
      font-size: 48rpx;
      line-height: 1;
      color: var(--text-color-secondary);
    }
  }
}

.preview-content {
  flex: 1;
  overflow-y: auto;
}

.product-images {
  width: 100%;
  height: 500rpx;
  background: var(--bg-color-card);

  .preview-image {
    width: 100%;
    height: 100%;
  }
}

.product-details {
  padding: 24rpx;
}

.price-section {
  background: var(--bg-color-card);
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;

  .price-row {
    display: flex;
    align-items: baseline;
    gap: 16rpx;
    margin-bottom: 16rpx;

    .current-price {
      font-size: 48rpx;
      font-weight: 700;
      color: var(--primary-color);
    }

    .original-price {
      font-size: 28rpx;
      color: var(--text-color-tertiary);
      text-decoration: line-through;
    }
  }

  .product-tags {
    display: flex;
    gap: 12rpx;

    .tag {
      padding: 8rpx 16rpx;
      border-radius: 8rpx;
      font-size: 24rpx;

      &.condition-tag {
        background: var(--bg-color-warm);
        color: var(--primary-color);
      }

      &.category-tag {
        background: var(--border-color-light);
        color: var(--text-color-secondary);
      }
    }
  }
}

.product-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary);
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.product-description {
  display: block;
  font-size: 28rpx;
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.seller-section {
  display: flex;
  align-items: center;
  background: var(--bg-color-card);
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;

  .seller-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 16rpx;
  }

  .seller-info {
    flex: 1;

    .seller-name {
      display: block;
      font-size: 28rpx;
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 8rpx;
    }

    .seller-stats {
      display: flex;
      gap: 24rpx;

      .stat-item {
        font-size: 24rpx;
        color: var(--text-color-tertiary);

        .stat-icon {
          margin-right: 4rpx;
        }
      }
    }
  }

  .seller-action {
    display: flex;
    align-items: center;
    gap: 4rpx;
    color: var(--text-color-tertiary);

    .action-text {
      font-size: 24rpx;
    }

    .action-arrow {
      font-size: 32rpx;
    }
  }
}

.product-status {
  display: flex;
  justify-content: space-around;
  background: var(--bg-color-card);
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;

  .status-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;

    .status-label {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }

    .status-value {
      font-size: 28rpx;
      color: var(--text-color-primary);
      font-weight: 500;
    }
  }
}

.preview-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--bg-color-card);
  border-top: 1rpx solid var(--border-color-light);
  flex-shrink: 0;
  gap: 16rpx;

  .action-group {
    display: flex;
    gap: 16rpx;
    flex: 1;
  }

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16rpx;
    border-radius: 12rpx;
    font-size: 24rpx;
    min-width: 0;
    transition: all 0.2s;

    &.secondary-btn {
      background: var(--bg-color-disabled);
      color: var(--text-color-secondary);

      .action-icon {
        font-size: 36rpx;
        margin-bottom: 4rpx;

        &.active {
          color: var(--error-color);
        }
      }

      &:active {
        background: var(--border-color-base);
      }
    }

    &.primary-btn {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
      color: var(--bg-color-card);

      .btn-text {
        font-size: 28rpx;
        font-weight: 600;
      }

      &:active {
        opacity: 0.9;
      }
    }

    .action-label {
      font-size: 22rpx;
    }
  }
}
</style>
