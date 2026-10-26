<template>
  <view v-if="show" class="skeleton-wrapper" :class="[`skeleton-${type}`, customClass]">
    <!-- 基础骨架屏 -->
    <template v-if="type === 'basic'">
      <view class="skeleton-basic" :style="{ height: height || 'auto' }">
        <view
          v-for="item in rows"
          :key="item"
          class="skeleton-row"
          :class="{ 'skeleton-shimmer': animated }"
          :style="getRowStyle(item)"
        ></view>
      </view>
    </template>

    <!-- 商品卡片骨架屏 -->
    <template v-else-if="type === 'product-card'">
      <view
        v-for="item in count"
        :key="item"
        class="skeleton-product-card"
      >
        <view class="skeleton-image skeleton-shimmer"></view>
        <view class="skeleton-info">
          <view class="skeleton-title skeleton-shimmer"></view>
          <view class="skeleton-meta">
            <view class="skeleton-price skeleton-shimmer"></view>
            <view class="skeleton-condition skeleton-shimmer"></view>
          </view>
          <view class="skeleton-footer">
            <view class="skeleton-avatar skeleton-shimmer"></view>
            <view class="skeleton-name skeleton-shimmer"></view>
          </view>
        </view>
      </view>
    </template>

    <!-- 商品列表骨架屏（网格布局） -->
    <template v-else-if="type === 'product-grid'">
      <view class="skeleton-product-grid" :class="`grid-cols-${columns}`">
        <view
          v-for="item in count"
          :key="item"
          class="skeleton-product-card"
        >
          <view class="skeleton-image skeleton-shimmer"></view>
          <view class="skeleton-info">
            <view class="skeleton-title skeleton-shimmer"></view>
            <view class="skeleton-meta">
              <view class="skeleton-price skeleton-shimmer"></view>
              <view class="skeleton-condition skeleton-shimmer"></view>
            </view>
            <view class="skeleton-footer">
              <view class="skeleton-avatar skeleton-shimmer"></view>
              <view class="skeleton-name skeleton-shimmer"></view>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 消息列表骨架屏 -->
    <template v-else-if="type === 'message'">
      <view
        v-for="item in count"
        :key="item"
        class="skeleton-message"
      >
        <view class="skeleton-message-avatar skeleton-shimmer"></view>
        <view class="skeleton-message-content">
          <view class="skeleton-message-header">
            <view class="skeleton-message-name skeleton-shimmer"></view>
            <view class="skeleton-message-time skeleton-shimmer"></view>
          </view>
          <view class="skeleton-message-text skeleton-shimmer"></view>
        </view>
      </view>
    </template>

    <!-- 用户卡片骨架屏 -->
    <template v-else-if="type === 'user-card'">
      <view
        v-for="item in count"
        :key="item"
        class="skeleton-user-card"
      >
        <view class="skeleton-user-avatar skeleton-shimmer"></view>
        <view class="skeleton-user-info">
          <view class="skeleton-user-name skeleton-shimmer"></view>
          <view class="skeleton-user-desc skeleton-shimmer"></view>
        </view>
      </view>
    </template>

    <!-- 订单列表骨架屏 -->
    <template v-else-if="type === 'order'">
      <view
        v-for="item in count"
        :key="item"
        class="skeleton-order"
      >
        <view class="skeleton-order-header">
          <view class="skeleton-order-no skeleton-shimmer"></view>
          <view class="skeleton-order-status skeleton-shimmer"></view>
        </view>
        <view class="skeleton-order-product">
          <view class="skeleton-order-image skeleton-shimmer"></view>
          <view class="skeleton-order-info">
            <view class="skeleton-order-title skeleton-shimmer"></view>
            <view class="skeleton-order-meta skeleton-shimmer"></view>
          </view>
        </view>
        <view class="skeleton-order-footer">
          <view class="skeleton-order-price skeleton-shimmer"></view>
          <view class="skeleton-order-btn skeleton-shimmer"></view>
        </view>
      </view>
    </template>

    <!-- 头部导航骨架屏 -->
    <template v-else-if="type === 'header'">
      <view class="skeleton-header">
        <view class="skeleton-header-left skeleton-shimmer"></view>
        <view class="skeleton-header-center skeleton-shimmer"></view>
        <view class="skeleton-header-right skeleton-shimmer"></view>
      </view>
    </template>

    <!-- 分类导航骨架屏 -->
    <template v-else-if="type === 'category'">
      <view class="skeleton-category">
        <view
          v-for="item in count"
          :key="item"
          class="skeleton-category-item"
        >
          <view class="skeleton-category-icon skeleton-shimmer"></view>
          <view class="skeleton-category-text skeleton-shimmer"></view>
        </view>
      </view>
    </template>

    <!-- 图片轮播骨架屏 -->
    <template v-else-if="type === 'banner'">
      <view
        v-for="item in count"
        :key="item"
        class="skeleton-banner skeleton-shimmer"
        :style="{ height: height || '320rpx' }"
      ></view>
    </template>

    <!-- 自定义内容插槽 -->
    <template v-else>
      <slot></slot>
    </template>
  </view>
</template>

<script setup lang="ts">
/**
 * 骨架屏组件
 * 支持多种预设类型，也可通过自定义插槽使用
 */
interface Props {
  /** 是否显示骨架屏 */
  show?: boolean
  /** 骨架屏类型 */
  type?: 'basic' | 'product-card' | 'product-grid' | 'message' | 'user-card' | 'order' | 'header' | 'category' | 'banner' | 'custom'
  /** 数量（仅对列表类有效） */
  count?: number
  /** 行数（仅对 basic 类型有效） */
  rows?: number
  /** 行宽配置（仅对 basic 类型有效） */
  rowWidth?: string | string[]
  /** 高度（仅对 banner 类型有效） */
  height?: string
  /** 网格列数（仅对 product-grid 类型有效） */
  columns?: 2 | 3 | 4
  /** 是否开启动画 */
  animated?: boolean
  /** 自定义类名 */
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  type: 'basic',
  count: 3,
  rows: 3,
  rowWidth: '100%',
  height: undefined,
  columns: 2,
  animated: true,
  customClass: ''
})

// 获取行样式
function getRowStyle(index: number) {
  let width = props.rowWidth
  if (Array.isArray(width)) {
    width = width[index] || width[width.length - 1]
  }
  return { width }
}
</script>

<script lang="ts">
export default {
  name: 'Skeleton',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
// 闪烁动画
@keyframes shimmer {
  0% {
    background-position: -1000rpx 0;
  }
  100% {
    background-position: 1000rpx 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-color-disabled) 25%,
    var(--border-color-light) 37%,
    var(--bg-color-disabled) 63%
  );
  background-size: 1000rpx 100%;
  animation: shimmer 2s infinite linear;
}

.skeleton-wrapper {
  background: var(--bg-color-card);
}

// 基础骨架
.skeleton-basic {
  padding: 24rpx;

  .skeleton-row {
    height: 32rpx;
    background: var(--bg-color-disabled);
    border-radius: 4rpx;
    margin-bottom: 16rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 商品卡片骨架
.skeleton-product-card {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;

  .skeleton-image {
    width: 100%;
    height: 320rpx;
    background: var(--bg-color-disabled);
  }

  .skeleton-info {
    padding: 16rpx;

    .skeleton-title {
      width: 100%;
      height: 72rpx;
      background: var(--bg-color-disabled);
      border-radius: 8rpx;
      margin-bottom: 12rpx;
    }

    .skeleton-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;

      .skeleton-price {
        width: 100rpx;
        height: 32rpx;
        background: var(--bg-color-disabled);
        border-radius: 8rpx;
      }

      .skeleton-condition {
        width: 80rpx;
        height: 24rpx;
        background: var(--bg-color-disabled);
        border-radius: 4rpx;
      }
    }

    .skeleton-footer {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .skeleton-avatar {
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        background: var(--bg-color-disabled);
      }

      .skeleton-name {
        flex: 1;
        height: 24rpx;
        background: var(--bg-color-disabled);
        border-radius: 4rpx;
      }
    }
  }
}

// 商品网格骨架
.skeleton-product-grid {
  display: grid;
  gap: 20rpx;
  padding: 20rpx;

  &.grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &.grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  &.grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}

// 消息列表骨架
.skeleton-message {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;

  .skeleton-message-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: var(--bg-color-disabled);
    flex-shrink: 0;
    margin-right: 24rpx;
  }

  .skeleton-message-content {
    flex: 1;
    min-width: 0;

    .skeleton-message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;

      .skeleton-message-name {
        width: 200rpx;
        height: 32rpx;
        background: var(--bg-color-disabled);
        border-radius: 4rpx;
      }

      .skeleton-message-time {
        width: 120rpx;
        height: 24rpx;
        background: var(--bg-color-disabled);
        border-radius: 4rpx;
      }
    }

    .skeleton-message-text {
      width: 80%;
      height: 24rpx;
      background: var(--bg-color-disabled);
      border-radius: 4rpx;
    }
  }
}

// 用户卡片骨架
.skeleton-user-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: var(--bg-color-card);
  border-radius: 16rpx;
  margin-bottom: 20rpx;

  .skeleton-user-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: var(--bg-color-disabled);
    flex-shrink: 0;
    margin-right: 24rpx;
  }

  .skeleton-user-info {
    flex: 1;

    .skeleton-user-name {
      width: 200rpx;
      height: 36rpx;
      background: var(--bg-color-disabled);
      border-radius: 8rpx;
      margin-bottom: 12rpx;
    }

    .skeleton-user-desc {
      width: 300rpx;
      height: 24rpx;
      background: var(--bg-color-disabled);
      border-radius: 4rpx;
    }
  }
}

// 订单列表骨架
.skeleton-order {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;

  .skeleton-order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .skeleton-order-no {
      width: 200rpx;
      height: 28rpx;
      background: var(--bg-color-disabled);
      border-radius: 4rpx;
    }

    .skeleton-order-status {
      width: 100rpx;
      height: 32rpx;
      background: var(--bg-color-disabled);
      border-radius: 8rpx;
    }
  }

  .skeleton-order-product {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;

    .skeleton-order-image {
      width: 160rpx;
      height: 160rpx;
      border-radius: 12rpx;
      background: var(--bg-color-disabled);
      flex-shrink: 0;
    }

    .skeleton-order-info {
      flex: 1;

      .skeleton-order-title {
        width: 100%;
        height: 36rpx;
        background: var(--bg-color-disabled);
        border-radius: 8rpx;
        margin-bottom: 12rpx;
      }

      .skeleton-order-meta {
        width: 150rpx;
        height: 24rpx;
        background: var(--bg-color-disabled);
        border-radius: 4rpx;
      }
    }
  }

  .skeleton-order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .skeleton-order-price {
      width: 120rpx;
      height: 32rpx;
      background: var(--bg-color-disabled);
      border-radius: 8rpx;
    }

    .skeleton-order-btn {
      width: 140rpx;
      height: 56rpx;
      background: var(--bg-color-disabled);
      border-radius: 28rpx;
    }
  }
}

// 头部导航骨架
.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: var(--bg-color-card);

  .skeleton-header-left {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: var(--bg-color-disabled);
  }

  .skeleton-header-center {
    width: 200rpx;
    height: 36rpx;
    background: var(--bg-color-disabled);
    border-radius: 8rpx;
  }

  .skeleton-header-right {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: var(--bg-color-disabled);
  }
}

// 分类导航骨架
.skeleton-category {
  display: flex;
  padding: 30rpx;
  background: var(--bg-color-card);
  gap: 30rpx;
  overflow-x: auto;

  .skeleton-category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;

    .skeleton-category-icon {
      width: 96rpx;
      height: 96rpx;
      border-radius: 24rpx;
      background: var(--bg-color-disabled);
    }

    .skeleton-category-text {
      width: 80rpx;
      height: 24rpx;
      background: var(--bg-color-disabled);
      border-radius: 4rpx;
    }
  }
}

// 轮播图骨架
.skeleton-banner {
  width: 100%;
  background: var(--bg-color-disabled);
  border-radius: 16rpx;
  margin-bottom: 20rpx;

  &:not(:last-child) {
    margin-bottom: 20rpx;
  }
}
</style>
