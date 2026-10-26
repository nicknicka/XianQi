<template>
  <view class="collapse-card" :class="[`size-${size}`, customClass]" :style="customStyle">
    <!-- 卡片头部 -->
    <view class="card-header" @click="handleHeaderClick">
      <!-- 左侧图标 -->
      <view v-if="icon" class="header-icon">
        <image
          v-if="iconType === 'image'"
          class="icon-image"
          :src="icon"
          mode="aspectFit"
        />
        <text v-else class="icon-text">{{ icon }}</text>
      </view>

      <!-- 标题和描述 -->
      <view class="header-content">
        <text v-if="title" class="header-title">{{ title }}</text>
        <text v-if="description" class="header-desc">{{ description }}</text>
      </view>

      <!-- 额外内容 -->
      <view v-if="$slots.extra" class="header-extra">
        <slot name="extra"></slot>
      </view>

      <!-- 展开箭头 -->
      <view v-if="showArrow" class="header-arrow" :class="{ 'is-expanded': expanded }">
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <!-- 卡片内容 -->
    <view v-if="expanded" class="card-body">
      <slot></slot>
    </view>

    <!-- 卡片底部 -->
    <view v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export type CollapseCardSize = 'small' | 'medium' | 'large'

interface Props {
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 图标 */
  icon?: string
  /** 图标类型 */
  iconType?: 'text' | 'image'
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 是否默认展开 */
  defaultExpanded?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: CollapseCardSize
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  icon: '',
  iconType: 'text',
  showArrow: true,
  defaultExpanded: false,
  disabled: false,
  size: 'medium',
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'toggle': [expanded: boolean]
  'expand': []
  'collapse': []
}>()

const expanded = ref(props.defaultExpanded)

// 点击头部
function handleHeaderClick() {
  if (props.disabled) return

  expanded.value = !expanded.value

  if (expanded.value) {
    emit('expand')
  } else {
    emit('collapse')
  }

  emit('toggle', expanded.value)
}

// 暴露方法
defineExpose({
  expand: () => {
    expanded.value = true
    emit('expand')
    emit('toggle', true)
  },
  collapse: () => {
    expanded.value = false
    emit('collapse')
    emit('toggle', false)
  },
  toggle: () => {
    handleHeaderClick()
  }
})
</script>

<script lang="ts">
export default {
  name: 'CollapseCard',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.collapse-card {
  background: var(--bg-color-card);
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

  // 尺寸变体
  &.size-small {
    .card-header {
      padding: 20rpx 24rpx;

      .header-icon {
        .icon-text {
          font-size: 32rpx;
        }
      }

      .header-title {
        font-size: 28rpx;
      }

      .header-desc {
        font-size: 24rpx;
      }
    }

    .card-body {
      padding: 0 24rpx 24rpx;
    }

    .card-footer {
      padding: 16rpx 24rpx;
    }
  }

  &.size-medium {
    .card-header {
      padding: 24rpx 32rpx;

      .header-icon {
        .icon-text {
          font-size: 36rpx;
        }
      }

      .header-title {
        font-size: 30rpx;
      }

      .header-desc {
        font-size: 26rpx;
      }
    }

    .card-body {
      padding: 0 32rpx 32rpx;
    }

    .card-footer {
      padding: 20rpx 32rpx;
    }
  }

  &.size-large {
    .card-header {
      padding: 32rpx 40rpx;

      .header-icon {
        .icon-text {
          font-size: 40rpx;
        }
      }

      .header-title {
        font-size: 32rpx;
      }

      .header-desc {
        font-size: 28rpx;
      }
    }

    .card-body {
      padding: 0 40rpx 40rpx;
    }

    .card-footer {
      padding: 24rpx 40rpx;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    cursor: pointer;
    transition: background 0.2s;

    &:active {
      background: var(--bg-color-disabled);
    }

    .header-icon {
      flex-shrink: 0;

      .icon-image {
        width: 40rpx;
        height: 40rpx;
      }

      .icon-text {
        font-size: 36rpx;
      }
    }

    .header-content {
      flex: 1;
      min-width: 0;

      .header-title {
        display: block;
        font-size: 30rpx;
        color: var(--text-color-primary);
        font-weight: 500;
        margin-bottom: 8rpx;
      }

      .header-desc {
        display: block;
        font-size: 26rpx;
        color: var(--text-color-tertiary);
      }
    }

    .header-extra {
      flex-shrink: 0;
    }

    .header-arrow {
      flex-shrink: 0;
      margin-left: 16rpx;
      transition: transform 0.3s;

      &.is-expanded {
        transform: rotate(90deg);
      }

      .arrow-icon {
        font-size: 32rpx;
        color: var(--text-color-tertiary);
      }
    }
  }

  .card-body {
    border-top: 1rpx solid var(--border-color-light);
  }

  .card-footer {
    border-top: 1rpx solid var(--border-color-light);
    background: #fafafa;
  }
}
</style>
