<template>
  <view class="badge-wrapper" :class="[customClass]" :style="customStyle">
    <!-- 徽章内容 -->
    <view class="badge-content">
      <slot></slot>
    </view>

    <!-- 徽章 -->
    <view v-if="showBadge" class="badge" :class="badgeClass" :style="badgeStyle">
      <!-- 数字徽章 -->
      <template v-if="type === 'number' && count !== 0">
        <text class="badge-text">{{ displayCount }}</text>
      </template>

      <!-- 点徽章 -->
      <template v-else-if="type === 'dot'">
        <view class="badge-dot"></view>
      </template>

      <!-- 文本徽章 -->
      <template v-else-if="type === 'text' && text">
        <text class="badge-text">{{ text }}</text>
      </template>

      <!-- 自定义徽章 -->
      <template v-else-if="type === 'custom'">
        <slot name="badge"></slot>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type BadgeType = 'number' | 'dot' | 'text' | 'custom'
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface Props {
  /** 徽章类型 */
  type?: BadgeType
  /** 计数值 */
  count?: number
  /** 最大值 */
  maxCount?: number
  /** 是否显示零 */
  showZero?: boolean
  /** 文本内容 */
  text?: string
  /** 徽章颜色 */
  color?: string
  /** 背景色 */
  backgroundColor?: string
  /** 徽章位置 */
  position?: BadgePosition
  /** 是否独立显示 */
  standalone?: boolean
  /** 偏移量 */
  offset?: [number, number]
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'number',
  count: 0,
  maxCount: 99,
  showZero: false,
  text: '',
  color: '#fff',
  backgroundColor: '#FF8A8A',
  position: 'top-right',
  standalone: false,
  offset: () => [0, 0],
  customClass: '',
  customStyle: ''
})

// 是否显示徽章
const showBadge = computed(() => {
  if (props.type === 'number') {
    return props.count > 0 || props.showZero
  }
  if (props.type === 'dot') {
    return true
  }
  if (props.type === 'text') {
    return !!props.text
  }
  return true
})

// 显示的计数值
const displayCount = computed(() => {
  if (props.count > props.maxCount) {
    return `${props.maxCount}+`
  }
  return props.count
})

// 徽章样式类
const badgeClass = computed(() => {
  return [
    `type-${props.type}`,
    `position-${props.position}`,
    { 'is-standalone': props.standalone }
  ]
})

// 徽章样式
const badgeStyle = computed(() => {
  const styles: Record<string, string> = {}

  if (props.color) {
    styles.color = props.color
  }

  if (props.backgroundColor) {
    styles.background = props.backgroundColor
  }

  if (props.offset) {
    const [x, y] = props.offset
    if (props.position.includes('right')) {
      styles.right = `${x}rpx`
    } else {
      styles.left = `${x}rpx`
    }

    if (props.position.includes('top')) {
      styles.top = `${y}rpx`
    } else {
      styles.bottom = `${y}rpx`
    }
  }

  return styles
})
</script>

<script lang="ts">
export default {
  name: 'Badge',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.badge-wrapper {
  position: relative;
  display: inline-block;

  .badge-content {
    display: inline-block;
  }

  .badge {
    position: absolute;
    z-index: 10;
    transform: translate(50%, -50%);

    // 位置变体
    &.position-top-right {
      top: 0;
      right: 0;
    }

    &.position-top-left {
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
    }

    &.position-bottom-right {
      bottom: 0;
      right: 0;
      transform: translate(50%, 50%);
    }

    &.position-bottom-left {
      bottom: 0;
      left: 0;
      transform: translate(-50%, 50%);
    }

    // 类型变体
    &.type-number {
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--danger-color);
      border-radius: 16rpx;
      border: 2rpx solid var(--text-color-inverse);

      .badge-text {
        font-size: 20rpx;
        color: #fff;
        line-height: 1;
        transform: scale(0.85);
      }
    }

    &.type-dot {
      width: 16rpx;
      height: 16rpx;
      background: var(--danger-color);
      border-radius: 50%;
      border: 2rpx solid var(--text-color-inverse);

      .badge-dot {
        width: 100%;
        height: 100%;
      }
    }

    &.type-text {
      padding: 4rpx 12rpx;
      background: var(--danger-color);
      border-radius: 16rpx;
      border: 2rpx solid var(--text-color-inverse);

      .badge-text {
        font-size: 22rpx;
        color: #fff;
        line-height: 1;
        transform: scale(0.85);
      }
    }

    &.type-custom {
      border: 2rpx solid var(--text-color-inverse);
    }

    // 独立模式
    &.is-standalone {
      position: static;
      transform: none;
      display: inline-flex;
    }
  }
}
</style>
