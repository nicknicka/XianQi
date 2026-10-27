<template>
  <view class="evaluation-item" :class="{ 'item-visible': visible }" :style="itemStyle">
    <!-- 商品缩略图 -->
    <lazy-image
      v-if="data.productImage"
      class="product-thumb"
      :src="data.productImage"
      mode="aspectFill"
    />

    <!-- 评价信息 -->
    <view class="eval-info">
      <!-- 顶部：标题 + 时间 -->
      <view class="eval-header">
        <text class="product-title">{{ data.productName }}</text>
        <text class="eval-time">{{ data.time }}</text>
      </view>

      <!-- 评分星星（仅显示星星，不显示数字） -->
      <view class="stars-section">
        <uni-icons
          v-for="star in 5"
          :key="star"
          :type="star <= data.rating ? 'star-filled' : 'star'"
          size="14"
          :color="star <= data.rating ? '#FFCB3F' : '#D9D9D9'"
        />
      </view>

      <!-- 标签 -->
      <view v-if="data.tags && data.tags.length > 0" class="tags-row">
        <text v-for="tag in data.tags" :key="tag" class="tag">{{ tag }}</text>
      </view>

      <!-- 评价内容 -->
      <text class="eval-content">{{ data.content }}</text>

      <!-- 评价图片 -->
      <view v-if="data.images && data.images.length > 0" class="images-row">
        <lazy-image
          v-for="(img, idx) in data.images"
          :key="idx"
          class="eval-image"
          :src="img"
          mode="aspectFill"
          @click.stop="previewImages(data.images, idx)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAttrs } from 'vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'

interface EvaluationItemData {
  id: string
  productId: string
  productName: string
  productImage: string
  productPrice: number
  rating: number
  tags: string[]
  content: string
  images: string[]
  time: string
}

interface Props {
  data: EvaluationItemData
  visible?: boolean
  itemStyle?: Record<string, any>
}

withDefaults(defineProps<Props>(), {
  visible: false,
  itemStyle: () => ({})
})

const emit = defineEmits<{
  click: [id: string]
}>()

function previewImages(images: string[], index: number) {
  uni.previewImage({
    urls: images,
    current: index
  })
}
</script>

<style lang="scss" scoped>
.evaluation-item {
  display: flex;
  gap: 12rpx;
  background: var(--bg-color-card);
  border-radius: var(--spacing-sm);
  padding: 12rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  opacity: 0;
  transform: translateY(10rpx);
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;

  &.item-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .product-thumb {
    width: 100rpx;
    height: 100rpx;
    border-radius: calc(var(--spacing-sm) / 2);
    flex-shrink: 0;
  }

  .eval-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    min-width: 0;

    .eval-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12rpx;

      .product-title {
        flex: 1;
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

      .eval-time {
        font-size: var(--font-size-xs);
        color: var(--text-color-tertiary);
        flex-shrink: 0;
        white-space: nowrap;
      }
    }

    .stars-section {
      display: flex;
      gap: 6rpx;
      align-items: center;
    }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;

      .tag {
        padding: 4rpx 8rpx;
        background: var(--bg-color-page);
        color: var(--text-color-secondary);
        font-size: var(--font-size-xs);
        border-radius: 3rpx;
        flex-shrink: 0;
      }
    }

    .eval-content {
      font-size: var(--font-size-sm);
      color: var(--text-color-primary);
      line-height: 1.5;
      word-break: break-word;
    }

    .images-row {
      display: flex;
      gap: 8rpx;
      flex-wrap: wrap;
      margin-top: 4rpx;

      .eval-image {
        width: 120rpx;
        height: 120rpx;
        border-radius: 4rpx;
      }
    }
  }
}
</style>
