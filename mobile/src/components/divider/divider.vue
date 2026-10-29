<template>
  <view class="divider" :class="[`direction-${direction}`, `dashed-${dashed}`, customClass]" :style="customStyle">
    <!-- 左侧文字 -->
    <slot name="left-content">
      <text v-if="direction === 'horizontal' && leftText" class="divider-text left-text">
        {{ leftText }}
      </text>
    </slot>

    <!-- 分割线 -->
    <view class="divider-line" :style="lineStyle"></view>

    <!-- 中间内容 -->
    <slot>
      <text v-if="text" class="divider-text">{{ text }}</text>
    </slot>

    <!-- 分割线 -->
    <view v-if="text || $slots.default || direction === 'vertical'" class="divider-line" :style="lineStyle"></view>

    <!-- 右侧文字 -->
    <slot name="right-content">
      <text v-if="direction === 'horizontal' && rightText" class="divider-text right-text">
        {{ rightText }}
      </text>
    </slot>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type DividerDirection = 'horizontal' | 'vertical'

interface Props {
  /** 分割线方向 */
  direction?: DividerDirection
  /** 文本内容 */
  text?: string
  /** 左侧文本 */
  leftText?: string
  /** 右侧文本 */
  rightText?: string
  /** 是否虚线 */
  dashed?: boolean
  /** 分割线颜色 */
  borderColor?: string
  /** 分割线宽度（horizontal 时为高度，vertical 时为宽度） */
  hairline?: boolean
  /** 内容两侧间距 */
  margin?: string | number
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  text: '',
  leftText: '',
  rightText: '',
  dashed: false,
  borderColor: 'var(--border-color-base)',
  hairline: true,
  margin: '',
  customClass: '',
  customStyle: ''
})

// 线条样式
const lineStyle = computed(() => {
  const styles: Record<string, string> = {}

  if (props.borderColor) {
    styles.borderColor = props.borderColor
  }

  if (props.hairline) {
    if (props.direction === 'horizontal') {
      styles.height = '1rpx'
    } else {
      styles.width = '1rpx'
    }
  } else {
    if (props.direction === 'horizontal') {
      styles.height = '2rpx'
    } else {
      styles.width = '2rpx'
    }
  }

  if (props.margin) {
    if (props.direction === 'horizontal') {
      styles.marginLeft = typeof props.margin === 'number' ? `${props.margin}rpx` : props.margin
      styles.marginRight = typeof props.margin === 'number' ? `${props.margin}rpx` : props.margin
    } else {
      styles.marginTop = typeof props.margin === 'number' ? `${props.margin}rpx` : props.margin
      styles.marginBottom = typeof props.margin === 'number' ? `${props.margin}rpx` : props.margin
    }
  }

  return styles
})
</script>

<script lang="ts">
export default {
  name: 'Divider',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.divider {
  display: flex;
  align-items: center;
  gap: 24rpx;

  // 水平方向
  &.direction-horizontal {
    flex-direction: row;
    width: 100%;
    padding: 32rpx 0;

    .divider-text {
      font-size: 28rpx;
      color: var(--text-color-tertiary);
      white-space: nowrap;

      &.left-text {
        padding-right: 24rpx;
      }

      &.right-text {
        padding-left: 24rpx;
      }
    }

    .divider-line {
      flex: 1;
      border-top: 1rpx solid var(--border-color-base);
    }
  }

  // 垂直方向
  &.direction-vertical {
    flex-direction: column;
    height: 100%;
    padding: 0 16rpx;

    .divider-text {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }

    .divider-line {
      flex: 1;
      border-left: 1rpx solid var(--border-color-base);
      min-height: 200rpx;
    }
  }

  // 虚线样式
  &.dashed-true {
    .divider-line {
      border-style: dashed;
    }
  }
}
</style>
