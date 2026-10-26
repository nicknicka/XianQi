<template>
  <view
    class="product-list-item"
    :class="{ 'item-visible': visible }"
    :style="itemStyle"
    @click="handleClick"
  >
    <!-- 商品图片 -->
    <lazy-image class="product-image" :src="data.image" :error-icon="props.errorIcon" mode="aspectFit" />

    <!-- 商品信息 -->
    <view class="product-info">
      <text class="product-title text-ellipsis">{{ data.title }}</text>
      <view class="product-meta">
        <text class="product-price">¥{{ data.price }}</text>
        <text v-if="data.condition" class="product-condition">{{ data.condition }}</text>
      </view>
      <!-- 额外信息插槽 -->
      <view v-if="$slots.extra" class="product-extra">
        <slot name="extra" :data="data" />
      </view>
      <!-- 默认的额外信息（时间等） -->
      <view v-else-if="data.extra" class="product-extra">
        <text class="extra-text">{{ data.extra }}</text>
      </view>
    </view>

    <!-- 操作按钮插槽 -->
    <view v-if="$slots.action" class="action-area">
      <slot name="action" :data="data" />
    </view>
    <!-- 默认删除按钮 -->
    <view v-else-if="showDelete" class="delete-btn" @click.stop="handleDelete">
      <uni-icons type="clear" size="18" color="var(--text-color-tertiary)" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'

interface ProductItemData {
  id: number | string
  productId?: number | string
  title: string
  image: string
  price: number
  condition?: string
  extra?: string // 额外信息，如时间、状态等
  [key: string]: any // 支持任意其他字段
}

interface Props {
  data: ProductItemData
  visible?: boolean
  itemStyle?: Record<string, any>
  showDelete?: boolean
  errorIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  itemStyle: () => ({}),
  showDelete: false,
  errorIcon: 'image'
})

const emit = defineEmits<{
  click: [data: ProductItemData]
  delete: [data: ProductItemData]
}>()

function handleClick() {
  emit('click', props.data)
}

function handleDelete() {
  emit('delete', props.data)
}
</script>

<script lang="ts">
export default {
  name: 'ProductListItem'
}
</script>

<style lang="scss" scoped>
/* 商品列表项 - 水平布局 */
.product-list-item {
  position: relative;
  display: flex;
  background: var(--bg-color-card);
  border-radius: var(--spacing-sm);
  padding: 16rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    background: var(--bg-color-page);
    transform: scale(0.99);
  }

  .product-image {
    width: 180rpx;
    height: 180rpx;
    border-radius: var(--spacing-sm);
    margin-right: 16rpx;
    flex-shrink: 0;
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    /* 为右侧操作按钮预留空间，避免文本溢出 */
    padding-right: 48rpx;

    .product-title {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    .product-meta {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-top: 8rpx;

      .product-price {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--error-color);
      }

      .product-condition {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
        padding: 4rpx 8rpx;
        background: var(--bg-color-disabled);
        border-radius: 4rpx;
      }
    }

    .product-extra {
      margin-top: 8rpx;

      .extra-text {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }
  }

  .action-area {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
  }

  .delete-btn {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    padding: 8rpx;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(1.2);
    }
  }
}

/* 文本省略类 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: 100%;
}

/* 列表项入场动画 */
.product-list-item {
  opacity: 0;
  transform: translateX(-20rpx);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.item-visible {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
