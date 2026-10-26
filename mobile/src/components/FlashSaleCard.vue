<template>
  <view class="flash-sale-card" @click="handleClick">
    <!-- 商品图片 -->
    <view class="image-wrapper">
      <lazy-image class="product-image" :src="product.image" mode="aspectFill" />

      <!-- 秒杀标签 -->
      <view class="flash-tag" :style="{ background: tagBg }">
        {{ product.discount }}折
      </view>

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

        <!-- 抢购按钮 -->
        <view class="buy-btn" :class="{ disabled: isSoldOut }">
          <text v-if="!isSoldOut">{{ btnText }}</text>
          <text v-else>已抢光</text>
        </view>
      </view>

      <!-- 即将开始状态 -->
      <view class="upcoming-tip" v-if="product.status === 'upcoming'">
        <uni-icons type="clock" size="14" :color="primaryColor"></uni-icons>
        <text>{{ product.startTime }}开始</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

interface Product {
  id: string
  title: string
  description: string
  image: string
  seckillPrice: string
  originalPrice: string
  discount: number
  soldPercent: number
  status?: 'ongoing' | 'upcoming' | 'ended'
  startTime?: string
}

interface Props {
  product: Product
  tagBg?: string
  btnText?: string
}

const props = withDefaults(defineProps<Props>(), {
  tagBg: 'linear-gradient(135deg, var(--error-color) 0%, var(--danger-color) 100%)',
  btnText: '立即抢'
})

const emit = defineEmits<{
  click: [product: Product]
}>()

const isSoldOut = computed(() => {
  return props.product.soldPercent >= 100 || props.product.status === 'ended'
})

const handleClick = () => {
  if (!isSoldOut.value) {
    emit('click', props.product)
  }
}
</script>

<style lang="scss" scoped>
.flash-sale-card {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
  }
}

.image-wrapper {
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
    color: var(--bg-color-card);
    font-size: 22rpx;
    font-weight: bold;
    border-radius: 8rpx;
    box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.3);
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
        background: linear-gradient(90deg, var(--warning-color) 0%, var(--warning-color-dark) 100%);
        transition: width 0.3s;
      }
    }

    .sold-text {
      font-size: 20rpx;
      color: var(--bg-color-card);
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
      color: var(--bg-color-card);
      font-size: 24rpx;
      font-weight: bold;
      border-radius: 32rpx;
      white-space: nowrap;
      box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.3);
      transition: all 0.3s;

      &.disabled {
        background: var(--text-color-placeholder);
        box-shadow: none;
      }
    }
  }

  .upcoming-tip {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 12rpx;
    padding: 8rpx 12rpx;
    background: var(--bg-color-warm);
    border-radius: 8rpx;

    text {
      font-size: 22rpx;
      color: var(--primary-color);
    }
  }
}
</style>
