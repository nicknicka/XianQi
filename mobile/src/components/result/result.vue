<template>
  <view class="result-page" :class="[`status-${status}`, customClass]" :style="customStyle">
    <!-- 图标区域 -->
    <view class="result-icon">
      <image
        v-if="image"
        class="icon-image"
        :src="image"
        mode="aspectFit"
      />
      <text v-else class="icon-emoji">{{ defaultIcon }}</text>
    </view>

    <!-- 标题 -->
    <text v-if="title" class="result-title">{{ title }}</text>

    <!-- 描述 -->
    <text v-if="description" class="result-desc">{{ description }}</text>

    <!-- 额外内容 -->
    <view v-if="$slots.default" class="result-extra">
      <slot></slot>
    </view>

    <!-- 操作按钮 -->
    <view v-if="showActions" class="result-actions">
      <slot name="actions">
        <view v-if="showPrimary" class="action-btn primary-btn" @click="handlePrimary">
          <text class="btn-text">{{ primaryText }}</text>
        </view>
        <view v-if="showSecondary" class="action-btn secondary-btn" @click="handleSecondary">
          <text class="btn-text">{{ secondaryText }}</text>
        </view>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ResultStatus = 'success' | 'error' | 'warning' | 'info' | '404' | '403' | '500'

interface Props {
  /** 状态 */
  status?: ResultStatus
  /** 自定义图标图片 */
  image?: string
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 是否显示主要按钮 */
  showPrimary?: boolean
  /** 主要按钮文本 */
  primaryText?: string
  /** 是否显示次要按钮 */
  showSecondary?: boolean
  /** 次要按钮文本 */
  secondaryText?: string
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  status: 'success',
  image: '',
  title: '',
  description: '',
  showActions: true,
  showPrimary: true,
  primaryText: '确定',
  showSecondary: true,
  secondaryText: '取消',
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'primary': []
  'secondary': []
}>()

// 默认图标
const defaultIcon = computed(() => {
  if (props.image) return ''

  const iconMap: Record<ResultStatus, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠️',
    info: 'ℹ️',
    404: '🔍',
    403: '🔒',
    500: '❌'
  }
  return iconMap[props.status] || '✓'
})

// 默认标题
const defaultTitle = computed(() => {
  const titleMap: Record<ResultStatus, string> = {
    success: '操作成功',
    error: '操作失败',
    warning: '警告',
    info: '提示',
    404: '页面不存在',
    403: '无权访问',
    500: '服务器错误'
  }
  return props.title || titleMap[props.status] || ''
})

// 主要按钮点击
function handlePrimary() {
  emit('primary')
}

// 次要按钮点击
function handleSecondary() {
  emit('secondary')
}
</script>

<script lang="ts">
export default {
  name: 'Result',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.result-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 80rpx 64rpx;

  .result-icon {
    margin-bottom: 32rpx;

    .icon-image {
      width: 200rpx;
      height: 200rpx;
      display: block;
    }

    .icon-emoji {
      font-size: 160rpx;
      line-height: 1;
    }
  }

  .result-title {
    font-size: 36rpx;
    color: var(--text-color-primary);
    font-weight: 600;
    margin-bottom: 16rpx;
    text-align: center;
  }

  .result-desc {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
    line-height: 1.6;
    margin-bottom: 48rpx;
    text-align: center;
    max-width: 600rpx;
  }

  .result-extra {
    width: 100%;
    margin-bottom: 48rpx;
  }

  .result-actions {
    display: flex;
    gap: 24rpx;

    .action-btn {
      min-width: 200rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 40rpx;
      font-size: 28rpx;
      transition: all 0.2s;

      &:active {
        transform: scale(0.95);
      }

      &.primary-btn {
        background: var(--primary-color);

        .btn-text {
          color: var(--bg-color-card);
        }
      }

      &.secondary-btn {
        background: var(--bg-color-disabled);

        .btn-text {
          color: var(--text-color-secondary);
        }
      }
    }
  }

  // 状态变体
  &.status-success {
    .result-icon .icon-emoji {
      color: var(--success-color);
    }
  }

  &.status-error {
    .result-icon .icon-emoji {
      color: var(--error-color);
    }
  }

  &.status-warning {
    .result-icon .icon-emoji {
      color: var(--warning-color);
    }
  }

  &.status-info {
    .result-icon .icon-emoji {
      color: var(--info-color);
    }
  }

  &.status-404,
  &.status-403,
  &.status-500 {
    .result-icon .icon-emoji {
      font-size: 120rpx;
    }
  }
}
</style>
