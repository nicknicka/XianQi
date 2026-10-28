<template>
  <view
    class="notice-item"
    :class="[`type-${type}`, { unread: !isRead }]"
    :style="customStyle"
    @click="handleClick"
  >
    <!-- 通知图标 -->
    <view class="notice-icon" :style="{ background: iconBgColor }">
      <uni-icons :type="iconType" size="20" :color="iconColor" />
    </view>

    <!-- 通知信息 -->
    <view class="notice-info">
      <view class="notice-header">
        <text class="title">{{ title }}</text>
        <text class="time">{{ displayTime }}</text>
      </view>
      <text class="content text-ellipsis">{{ content }}</text>
    </view>

    <!-- 未读标记 -->
    <view v-if="!isRead" class="unread-dot"></view>

    <!-- 右侧箭头（可选） -->
    <view v-if="showArrow" class="notice-arrow">
      <uni-icons type="right" size="14" color="#ccc" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getRelativeTime } from '@/utils/date'

export type NoticeItemType = 'system' | 'trade' | 'activity' | 'account' | 'custom'

interface Props {
  /** 通知 ID */
  id?: string
  /** 通知类型 */
  type?: NoticeItemType
  /** 通知标题 */
  title?: string
  /** 通知内容/摘要 */
  content?: string
  /** 创建时间（支持字符串或数组格式） */
  createdAt?: string | number[]
  /** 是否已读 */
  isRead?: boolean
  /** 自定义图标 */
  customIcon?: string
  /** 自定义图标颜色 */
  customIconColor?: string
  /** 自定义背景色 */
  customIconBgColor?: string
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  type: 'system',
  title: '',
  content: '',
  createdAt: () => '' as string | number[],
  isRead: false,
  customIcon: '',
  customIconColor: '',
  customIconBgColor: '',
  showArrow: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'click': [data: any]
}>()

// 图标和颜色映射
const iconMap: Record<NoticeItemType, string> = {
  system: 'notification',
  trade: 'shop',
  activity: 'gift',
  account: 'person',
  custom: 'star'
}

const iconColorMap: Record<NoticeItemType, string> = {
  system: 'var(--primary-color)',
  trade: 'var(--success-color)',
  activity: 'var(--error-color)',
  account: 'var(--info-color)',
  custom: 'var(--warning-color)'
}

const iconBgColorMap: Record<NoticeItemType, string> = {
  system: 'var(--primary-color-alpha-10)',
  trade: '#f6ffed',
  activity: 'var(--error-color-alpha-10)',
  account: '#e6f7ff',
  custom: '#fffbe6'
}

// 计算显示的图标
const iconType = computed(() => {
  return props.customIcon || iconMap[props.type] || 'notification'
})

// 计算显示的图标颜色
const iconColor = computed(() => {
  return props.customIconColor || iconColorMap[props.type] || '#999'
})

// 计算显示的图标背景色
const iconBgColor = computed(() => {
  return props.customIconBgColor || iconBgColorMap[props.type] || '#f5f5f5'
})

// 格式化显示时间
const displayTime = computed(() => {
  if (!props.createdAt) return ''
  
  // 如果是数组格式（如 [2025,1,15,11,0]），转换为字符串
  if (Array.isArray(props.createdAt)) {
    const arr = props.createdAt
    if (arr.length >= 5) {
      // 格式：[年，月，日，时，分]
      const year = arr[0]
      const month = String(arr[1]).padStart(2, '0')
      const day = String(arr[2]).padStart(2, '0')
      const hour = String(arr[3]).padStart(2, '0')
      const minute = String(arr[4]).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    } else if (arr.length === 0) {
      return ''
    }
  }
  
  // 如果已经是字符串，直接使用
  return getRelativeTime(props.createdAt as string)
})

// 点击事件
function handleClick() {
  emit('click', {
    id: props.id,
    type: props.type,
    title: props.title,
    content: props.content,
    createdAt: props.createdAt,
    isRead: props.isRead
  })
}
</script>

<script lang="ts">
export default {
  name: 'NoticeItem',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.notice-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: var(--bg-color-card);
  border-bottom: 1px solid var(--border-color-light);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 未读状态
  &.unread {
    background: linear-gradient(90deg, #fffbf7 0%, #fff 100%);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6rpx;
      background: var(--primary-color);
    }
  }

  // 类型变体
  &.type-system {
    &.unread::before {
      background: var(--primary-color);
    }
  }

  &.type-trade {
    &.unread::before {
      background: var(--success-color);
    }
  }

  &.type-activity {
    &.unread::before {
      background: var(--error-color);
    }
  }

  &.type-account {
    &.unread::before {
      background: var(--info-color);
    }
  }

  &:active {
    background-color: var(--bg-color-hover);
    transform: scale(0.98);
  }

  .notice-icon {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 40rpx;
    margin-right: 24rpx;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .notice-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    margin-right: 16rpx;

    .notice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8rpx;

      .title {
        font-size: var(--font-size-base);
        font-weight: 500;
        color: var(--text-color-primary);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .time {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
        flex-shrink: 0;
        margin-left: 16rpx;
      }
    }

    .content {
      font-size: var(--font-size-sm);
      color: var(--text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .unread-dot {
    width: 16rpx;
    height: 16rpx;
    background: var(--danger-color);
    border-radius: 50%;
    flex-shrink: 0;
    margin-right: 8rpx;
  }

  .notice-arrow {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

// 列表项动画
.notice-item {
  animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>
