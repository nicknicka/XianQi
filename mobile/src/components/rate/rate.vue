<template>
  <view class="rate" :class="[`size-${size}`, customClass]" :style="customStyle">
    <!-- 星星评分 -->
    <view class="rate-stars" @click="handleClick" @mousemove="handleMouseMove">
      <view
        v-for="(_, index) in max"
        :key="index"
        class="star-item"
        :class="{ 'is-active': index < activeValue }"
        :style="{ color: getStarColor(index) }"
        @click.stop="handleStarClick(index)"
      >
        <view class="star-background">
          <text class="star-icon">★</text>
        </view>
        <view class="star-foreground" :style="{ width: getPercent(index) }">
          <text class="star-icon">★</text>
        </view>
      </view>
    </view>

    <!-- 评分数值 -->
    <text v-if="showNumber" class="rate-number">{{ displayValue }}</text>

    <!-- 评分文字 -->
    <text v-if="showText && text" class="rate-text">{{ text }}</text>

    <!-- 只读显示当前值 -->
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="modelValue"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  /** 绑定值 */
  modelValue: number
  /** 最大分数 */
  max?: number
  /** 是否允许半星 */
  allowHalf?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否显示数字 */
  showNumber?: boolean
  /** 是否显示文字 */
  showText?: boolean
  /** 文字数组 */
  texts?: string[]
  /** 颜色（数组或单一颜色） */
  colors?: string | string[]
  /** 空值颜色 */
  voidColor?: string
  /** 禁用颜色 */
  disabledColor?: string
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 表单名称 */
  name?: string
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  max: 5,
  allowHalf: true,
  disabled: false,
  readonly: false,
  showNumber: false,
  showText: false,
  texts: () => ['极差', '失望', '一般', '满意', '惊喜'],
  colors: () => ['#f7ba2a', '#f7ba2a', '#f7ba2a', '#f7ba2a', '#f7ba2a'],
  voidColor: '#c6d1de',
  disabledColor: '#c6d1de',
  size: 'medium'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

const hoverValue = ref(0)

// 当前激活值（用于高亮）
const activeValue = computed(() => {
  return hoverValue.value || props.modelValue
})

// 显示值（保留一位小数）
const displayValue = computed(() => {
  if (props.allowHalf) {
    return props.modelValue.toFixed(1)
  }
  return props.modelValue.toString()
})

// 当前文字
const text = computed(() => {
  if (!props.texts || props.texts.length === 0) return ''
  const index = Math.min(Math.ceil(props.modelValue) - 1, props.texts.length - 1)
  return props.texts[index] || ''
})

// 获取星星颜色
function getStarColor(index: number): string {
  if (props.disabled || props.readonly) return props.disabledColor

  if (typeof props.colors === 'string') {
    return props.colors
  }

  const colorIndex = Math.min(index, props.colors.length - 1)
  return props.colors[colorIndex] || props.colors[0]
}

// 获取星星填充百分比
function getPercent(index: number): string {
  const value = activeValue.value
  const current = index + 1

  if (value >= current) return '100%'
  if (value < index) return '0%'

  // 处理半星
  const decimal = value - index
  return `${decimal * 100}%`
}

// 点击整个区域
function handleClick(e: any) {
  if (props.disabled || props.readonly) return
  // 可以在这里实现根据点击位置计算分数
}

// 鼠标移动（处理半星）
function handleMouseMove(e: any) {
  if (props.disabled || props.readonly) return
  // H5 端可以实现半星悬停效果
}

// 点击星星
function handleStarClick(index: number) {
  if (props.disabled || props.readonly) return

  let value = index + 1

  // 这里可以通过计算点击位置实现半星
  // 暂时实现整星点击

  emit('update:modelValue', value)
  emit('change', value)

  // 触觉反馈
  if (typeof uni !== 'undefined') {
    uni.vibrateShort({ type: 'light' })
  }
}

// 暴露方法
defineExpose({
  // 清空评分
  clear: () => {
    emit('update:modelValue', 0)
    emit('change', 0)
  }
})
</script>

<script lang="ts">
export default {
  name: 'Rate',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped
>
.rate {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;

  .rate-stars {
    display: inline-flex;
    align-items: center;
    gap: 4rpx;
  }

  .star-item {
    position: relative;
    display: inline-block;
    cursor: pointer;
    overflow: hidden;

    .star-background,
    .star-foreground {
      display: inline-block;
    }

    .star-background {
      color: var(--text-color-tertiary);
    }

    .star-foreground {
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      white-space: nowrap;
    }

    .star-icon {
      font-size: 32rpx;
      line-height: 1;
      transition: transform 0.2s;
    }

    &:active {
      .star-icon {
        transform: scale(0.9);
      }
    }
  }

  .rate-number {
    font-size: 28rpx;
    color: var(--text-color-primary);
    margin-left: 8rpx;
  }

  .rate-text {
    font-size: 26rpx;
    color: var(--text-color-secondary);
    margin-left: 8rpx;
  }

  // 尺寸变体
  &.size-small {
    .star-icon {
      font-size: 28rpx;
    }

    .rate-number {
      font-size: 24rpx;
    }

    .rate-text {
      font-size: 24rpx;
    }
  }

  &.size-large {
    .star-icon {
      font-size: 48rpx;
    }

    .rate-number {
      font-size: 32rpx;
    }

    .rate-text {
      font-size: 28rpx;
    }
  }

  // 禁用状态
  &[aria-disabled="true"] {
    opacity: 0.6;
    cursor: not-allowed;

    .star-item {
      cursor: not-allowed;
    }
  }
}
</style>
