<template>
  <view class="notification-box" :class="[`position-${position}`, customClass]" :style="customStyle">
    <transition-group name="notice">
      <view
        v-for="notice in notices"
        :key="notice.id"
        class="notice-item"
        :class="[`notice-${notice.type}`]"
        @click="handleClick(notice)"
      >
        <!-- 图标 -->
        <view v-if="notice.showIcon" class="notice-icon">
          <text class="icon-text">{{ getIcon(notice) }}</text>
        </view>

        <!-- 内容 -->
        <view class="notice-content">
          <text class="notice-title">{{ notice.title }}</text>
        </view>

        <!-- 关闭按钮 -->
        <view
          v-if="notice.closable"
          class="notice-close"
          @click.stop="handleClose(notice)"
        >
          <text class="close-icon">×</text>
        </view>
      </view>
    </transition-group>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { notification, type NoticeItem, typeIcons } from '@/utils/notification'

interface Props {
  /** 最大显示数量 */
  maxCount?: number
  /** 位置 */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 3,
  position: 'top-right'
})

const notices = ref<NoticeItem[]>([])

// 获取图标
function getIcon(notice: NoticeItem): string {
  if (notice.icon) return notice.icon
  return typeIcons[notice.type || 'info']
}

// 点击通知
function handleClick(notice: NoticeItem) {
  notice.onClick?.()
  if (notice.closable) {
    notification.remove(notice.id)
  }
}

// 关闭通知
function handleClose(notice: NoticeItem) {
  notification.remove(notice.id)
}

// 订阅通知变化
let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = notification.subscribe((newNotices) => {
    // 限制数量
    if (props.maxCount > 0) {
      notices.value = newNotices.slice(-props.maxCount)
    } else {
      notices.value = newNotices
    }
  })
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<script lang="ts">
export default {
  name: 'NotificationBox',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.notification-box {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  pointer-events: none;
  max-width: 500rpx;

  &.position-top-right {
    top: 24rpx;
    right: 24rpx;
    align-items: flex-end;
  }

  &.position-top-left {
    top: 24rpx;
    left: 24rpx;
    align-items: flex-start;
  }

  &.position-top-center {
    top: 24rpx;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  }

  &.position-bottom-right {
    bottom: 24rpx;
    right: 24rpx;
    align-items: flex-end;
  }

  &.position-bottom-left {
    bottom: 24rpx;
    left: 24rpx;
    align-items: flex-start;
  }

  &.position-bottom-center {
    bottom: 24rpx;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  }

  .notice-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx 24rpx;
    background: var(--bg-color-card);
    border-radius: 8rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    pointer-events: auto;
    animation: slideIn 0.3s ease;

    &.notice-success {
      border-left: 4rpx solid var(--success-color);

      .notice-icon .icon-text {
        color: var(--success-color);
      }
    }

    &.notice-warning {
      border-left: 4rpx solid var(--warning-color);

      .notice-icon .icon-text {
        color: var(--warning-color);
      }
    }

    &.notice-error {
      border-left: 4rpx solid var(--error-color);

      .notice-icon .icon-text {
        color: var(--error-color);
      }
    }

    &.notice-info {
      border-left: 4rpx solid var(--info-color);

      .notice-icon .icon-text {
        color: var(--info-color);
      }
    }

    .notice-icon {
      flex-shrink: 0;

      .icon-text {
        font-size: 32rpx;
        line-height: 1;
      }
    }

    .notice-content {
      flex: 1;
      min-width: 0;

      .notice-title {
        font-size: 28rpx;
        color: var(--text-color-primary);
        line-height: 1.4;
      }
    }

    .notice-close {
      flex-shrink: 0;
      width: 40rpx;
      height: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;

      &:active {
        background: rgba(0, 0, 0, 0.05);
      }

      .close-icon {
        font-size: 36rpx;
        color: var(--text-color-tertiary);
        line-height: 1;
      }
    }
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notice-enter-active,
.notice-leave-active {
  transition: all 0.3s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translateX(40rpx);
}
</style>
