<template>
  <view class="loading-state" :class="[`type-${type}`, customClass]" :style="customStyle">
    <!-- Loading 状态 -->
    <template v-if="type === 'loading'">
      <slot name="loading">
        <view class="loading-content">
          <!-- 默认加载动画 -->
          <view v-if="!customIcon" class="default-spinner">
            <view v-for="i in 8" :key="i" class="spinner-dot" :style="{ animationDelay: `${i * 0.1}s` }"></view>
          </view>
          <!-- 自定义图标 -->
          <image v-else-if="customIcon" class="custom-icon" :src="customIcon" mode="aspectFit" />
          <!-- 加载文字 -->
          <text v-if="text" class="loading-text">{{ text }}</text>
        </view>
      </slot>
    </template>

    <!-- Empty 空状态 -->
    <template v-else-if="type === 'empty'">
      <slot name="empty">
        <view class="empty-content">
          <view v-if="icon" class="empty-icon">
            <image v-if="icon.startsWith('/')" :src="icon" mode="aspectFit" />
            <text v-else class="icon-text">{{ icon }}</text>
          </view>
          <text v-if="text" class="empty-text">{{ text }}</text>
          <text v-if="tip" class="empty-tip">{{ tip }}</text>
          <view v-if="showAction" class="empty-action" @click="handleAction">
            <text class="action-text">{{ actionText }}</text>
          </view>
        </view>
      </slot>
    </template>

    <!-- Error 错误状态 -->
    <template v-else-if="type === 'error'">
      <slot name="error">
        <view class="error-content">
          <view v-if="icon" class="error-icon">
            <image v-if="icon.startsWith('/')" :src="icon" mode="aspectFit" />
            <text v-else class="icon-text">{{ icon }}</text>
          </view>
          <text v-if="text" class="error-text">{{ text }}</text>
          <text v-if="tip" class="error-tip">{{ tip }}</text>
          <view v-if="showAction" class="error-action" @click="handleAction">
            <text class="action-text">{{ actionText }}</text>
          </view>
        </view>
      </slot>
    </template>

    <!-- Success 成功状态 -->
    <template v-else-if="type === 'success'">
      <slot name="success">
        <view class="success-content">
          <view v-if="icon" class="success-icon">
            <image v-if="icon.startsWith('/')" :src="icon" mode="aspectFit" />
            <text v-else class="icon-text">{{ icon }}</text>
          </view>
          <text v-if="text" class="success-text">{{ text }}</text>
          <view v-if="showAction" class="success-action" @click="handleAction">
            <text class="action-text">{{ actionText }}</text>
          </view>
        </view>
      </slot>
    </template>

    <!-- Network 网络错误 -->
    <template v-else-if="type === 'network'">
      <slot name="network">
        <view class="network-content">
          <view class="network-icon">📶</view>
          <text class="network-text">网络连接失败</text>
          <text class="network-tip">请检查网络设置后重试</text>
          <view class="network-action" @click="handleAction">
            <text class="action-text">{{ actionText }}</text>
          </view>
        </view>
      </slot>
    </template>
  </view>
</template>

<script setup lang="ts">
interface Props {
  /** 状态类型 */
  type?: 'loading' | 'empty' | 'error' | 'success' | 'network'
  /** 图标（emoji或图片路径） */
  icon?: string
  /** 主要文字 */
  text?: string
  /** 提示文字 */
  tip?: string
  /** 是否显示操作按钮 */
  showAction?: boolean
  /** 操作按钮文字 */
  actionText?: string
  /** 自定义加载图标 */
  customIcon?: string
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'loading',
  icon: '',
  text: '',
  tip: '',
  showAction: false,
  actionText: '重试',
  customIcon: ''
})

const emit = defineEmits<{
  action: []
}>()

function handleAction() {
  emit('action')
}
</script>

<script lang="ts">
export default {
  name: 'LoadingState',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 120rpx 48rpx;
  min-height: 400rpx;
}

// Loading 状态
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;

  .default-spinner {
    position: relative;
    width: 80rpx;
    height: 80rpx;

    .spinner-dot {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12rpx;
      height: 12rpx;
      margin: -6rpx 0 0 -6rpx;
      border-radius: 50%;
      background: $primary-color;
      animation: spinnerFade 1.2s linear infinite;
    }
  }

  @keyframes spinnerFade {
    0%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }

  .custom-icon {
    width: 80rpx;
    height: 80rpx;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }
}

// Empty 状态
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;

  .empty-icon {
    .icon-text {
      font-size: 120rpx;
      opacity: 0.5;
    }

    image {
      width: 200rpx;
      height: 200rpx;
    }
  }

  .empty-text {
    font-size: 32rpx;
    color: var(--text-color-primary);
    font-weight: 500;
  }

  .empty-tip {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
    text-align: center;
  }

  .empty-action {
    margin-top: 16rpx;
    padding: 16rpx 48rpx;
    background: $primary-color;
    border-radius: 48rpx;

    .action-text {
      font-size: 28rpx;
      color: #fff;
    }
  }
}

// Error 状态
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;

  .error-icon {
    .icon-text {
      font-size: 120rpx;
    }

    image {
      width: 200rpx;
      height: 200rpx;
    }
  }

  .error-text {
    font-size: 32rpx;
    color: var(--text-color-primary);
    font-weight: 500;
  }

  .error-tip {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
    text-align: center;
  }

  .error-action {
    margin-top: 16rpx;
    padding: 16rpx 48rpx;
    border: 1rpx solid $primary-color;
    border-radius: 48rpx;

    .action-text {
      font-size: 28rpx;
      color: $primary-color;
    }
  }
}

// Success 状态
.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;

  .success-icon {
    .icon-text {
      font-size: 120rpx;
    }

    image {
      width: 200rpx;
      height: 200rpx;
    }
  }

  .success-text {
    font-size: 32rpx;
    color: var(--text-color-primary);
    font-weight: 500;
  }

  .success-action {
    margin-top: 16rpx;
    padding: 16rpx 48rpx;
    background: $primary-color;
    border-radius: 48rpx;

    .action-text {
      font-size: 28rpx;
      color: #fff;
    }
  }
}

// Network 状态
.network-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;

  .network-icon {
    font-size: 120rpx;
    opacity: 0.5;
  }

  .network-text {
    font-size: 32rpx;
    color: var(--text-color-primary);
    font-weight: 500;
  }

  .network-tip {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
    text-align: center;
  }

  .network-action {
    margin-top: 16rpx;
    padding: 16rpx 48rpx;
    background: $primary-color;
    border-radius: 48rpx;

    .action-text {
      font-size: 28rpx;
      color: #fff;
    }
  }
}

// 紧凑模式
.type-loading.type-compact {
  padding: 48rpx;
  min-height: auto;

  .loading-content {
    .default-spinner {
      width: 48rpx;
      height: 48rpx;

      .spinner-dot {
        width: 8rpx;
        height: 8rpx;
      }
    }

    .custom-icon {
      width: 48rpx;
      height: 48rpx;
    }

    .loading-text {
      font-size: 24rpx;
    }
  }
}
</style>
