<template>
  <view class="segmented" :class="[`size-${size}`, customClass]" :style="customStyle">
    <view
      v-for="(option, index) in options"
      :key="option.value || index"
      class="segmented-item"
      :class="{ 'is-active': modelValue === option.value, 'is-disabled': option.disabled }"
      @click="handleClick(option, index)"
    >
      <!-- 图标 -->
      <view v-if="option.icon" class="item-icon">
        <image
          v-if="option.iconType === 'image'"
          class="icon-image"
          :src="option.icon"
          mode="aspectFit"
        />
        <text v-else class="icon-text">{{ option.icon }}</text>
      </view>

      <!-- 文本 -->
      <text class="item-text">{{ option.label }}</text>

      <!-- 徽章 -->
      <view v-if="option.badge" class="item-badge">
        <text class="badge-text">{{ option.badge }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

type SegmentedSize = 'small' | 'medium' | 'large'

interface SegmentedOption {
  label: string
  value: string | number
  icon?: string
  iconType?: 'text' | 'image'
  badge?: string | number
  disabled?: boolean
  [key: string]: any
}

interface Props {
  /** 选项数据 */
  options?: SegmentedOption[]
  /** 当前选中值 */
  modelValue?: string | number
  /** 尺寸 */
  size?: SegmentedSize
  /** 背景色 */
  backgroundColor?: string
  /** 激活文字颜色 */
  activeColor?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  modelValue: '',
  size: 'medium',
  backgroundColor: 'var(--bg-color-disabled)',
  activeColor: 'var(--primary-color)',
  disabled: false,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [value: string | number, option: SegmentedOption]
}>()

// 点击选项
function handleClick(option: SegmentedOption, index: number) {
  if (props.disabled || option.disabled) return

  emit('update:modelValue', option.value)
  emit('change', option.value, option)
}

// 暴露方法
defineExpose({
  setValue: (value: string | number) => {
    emit('update:modelValue', value)
  }
})
</script>

<script lang="ts">
export default {
  name: 'Segmented',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.segmented {
  display: inline-flex;
  padding: 4rpx;
  background: var(--bg-color-disabled);
  border-radius: 8rpx;

  // 尺寸变体
  &.size-small {
    padding: 4rpx;

    .segmented-item {
      padding: 8rpx 16rpx;
      gap: 6rpx;
      min-height: 48rpx;

      .item-icon {
        .icon-text {
          font-size: 24rpx;
        }
      }

      .item-text {
        font-size: 24rpx;
      }

      .item-badge {
        min-width: 24rpx;
        height: 24rpx;
        padding: 0 6rpx;

        .badge-text {
          font-size: 18rpx;
        }
      }
    }
  }

  &.size-medium {
    padding: 6rpx;

    .segmented-item {
      padding: 12rpx 24rpx;
      gap: 8rpx;
      min-height: 64rpx;

      .item-icon {
        .icon-text {
          font-size: 28rpx;
        }
      }

      .item-text {
        font-size: 28rpx;
      }

      .item-badge {
        min-width: 32rpx;
        height: 32rpx;
        padding: 0 8rpx;

        .badge-text {
          font-size: 20rpx;
        }
      }
    }
  }

  &.size-large {
    padding: 8rpx;

    .segmented-item {
      padding: 16rpx 32rpx;
      gap: 12rpx;
      min-height: 80rpx;

      .item-icon {
        .icon-text {
          font-size: 32rpx;
        }
      }

      .item-text {
        font-size: 32rpx;
      }

      .item-badge {
        min-width: 36rpx;
        height: 36rpx;
        padding: 0 10rpx;

        .badge-text {
          font-size: 22rpx;
        }
      }
    }
  }

  .segmented-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    background: transparent;
    border-radius: 6rpx;
    transition: all 0.3s;

    &:not(.is-disabled):active {
      transform: scale(0.96);
    }

    &.is-active {
      background: var(--bg-color-card);
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);

      .item-text {
        color: var(--primary-color);
        font-weight: 500;
      }
    }

    &.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .item-icon {
      flex-shrink: 0;

      .icon-image {
        width: 32rpx;
        height: 32rpx;
      }

      .icon-text {
        font-size: 28rpx;
      }
    }

    .item-text {
      font-size: 28rpx;
      color: var(--text-color-primary);
      white-space: nowrap;
    }

    .item-badge {
      position: absolute;
      top: -8rpx;
      right: -8rpx;
      min-width: 32rpx;
      height: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8rpx;
      background: var(--error-color);
      border-radius: 16rpx;

      .badge-text {
        font-size: 20rpx;
        color: var(--bg-color-card);
        transform: scale(0.85);
      }
    }
  }
}
</style>
