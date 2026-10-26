<template>
  <view class="card" :class="[`shadow-${shadow}`, `border-${border}`, customClass]" :style="customStyle">
    <!-- 卡片头部 -->
    <view v-if="title || $slots.header" class="card-header" :class="{ 'is-border': headerBorder }">
      <slot name="header">
        <view class="header-content">
          <text v-if="title" class="header-title">{{ title }}</text>
          <text v-if="extra" class="header-extra">{{ extra }}</text>
        </view>
      </slot>
    </view>

    <!-- 卡片内容 -->
    <view class="card-body" :class="{ 'is-padding': bodyPadding }">
      <slot></slot>
    </view>

    <!-- 卡片底部 -->
    <view v-if="$slots.footer" class="card-footer" :class="{ 'is-border': footerBorder }">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  /** 标题 */
  title?: string
  /** 额外内容 */
  extra?: string
  /** 是否显示头部边框 */
  headerBorder?: boolean
  /** 是否显示底部边框 */
  footerBorder?: boolean
  /** 内容是否有内边距 */
  bodyPadding?: boolean
  /** 阴影类型 */
  shadow?: 'never' | 'light' | 'medium' | 'dark'
  /** 是否显示边框 */
  border?: 'none' | 'default'
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  shadow: 'light',
  border: 'none',
  headerBorder: false,
  footerBorder: false,
  bodyPadding: true
})
</script>

<script lang="ts">
export default {
  name: 'Card',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.card {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  overflow: hidden;

  // 边框样式
  &.border-none {
    border: none;
  }

  &.border-default {
    border: 1rpx solid var(--border-color-base);
  }

  // 阴影样式
  &.shadow-never {
    box-shadow: none;
  }

  &.shadow-light {
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  }

  &.shadow-medium {
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  &.shadow-dark {
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  }

  .card-header {
    padding: 24rpx;
    font-size: 28rpx;

    &.is-border {
      border-bottom: 1rpx solid var(--border-color-light);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-title {
        font-size: 32rpx;
        font-weight: 600;
        color: var(--text-color-primary);
      }

      .header-extra {
        font-size: 26rpx;
        color: var(--text-color-tertiary);
      }
    }
  }

  .card-body {
    &.is-padding {
      padding: 24rpx;
    }

    &:not(.is-padding) {
      > view:first-child {
        border-top-left-radius: 16rpx;
        border-top-right-radius: 16rpx;
        overflow: hidden;
      }
    }
  }

  .card-footer {
    padding: 24rpx;
    font-size: 28rpx;

    &.is-border {
      border-top: 1rpx solid var(--border-color-light);
    }
  }
}
</style>
