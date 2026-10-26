<template>
  <view class="empty-state">
    <view class="empty-content">
      <image v-if="image" class="empty-image" :src="image" mode="aspectFit" />
      <view v-else class="empty-icon">
        <text class="icon-emoji">{{ defaultIcon }}</text>
      </view>
      <text class="empty-text">{{ text }}</text>
      <text class="empty-tip" v-if="tip">{{ tip }}</text>
      <slot name="extra" />
      <view v-if="showButton" class="action-btn" @click="handleAction">
        <text class="action-text">{{ buttonText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  text?: string
  image?: string
  tip?: string
  showButton?: boolean
  buttonText?: string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  showButton: false,
  buttonText: '去操作'
})

const emit = defineEmits<{
  action: []
}>()

// 默认图标
const defaultIcon = computed(() => {
  return props.icon || '📭'
})

function handleAction() {
  emit('action')
}
</script>

<script lang="ts">
import { computed } from 'vue'
export default {
  name: 'EmptyState'
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 48rpx;

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .empty-image {
      width: 240rpx;
      height: 240rpx;
      margin-bottom: var(--spacing-md);
    }

    .empty-icon {
      width: 160rpx;
      height: 160rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border-radius: 50%;
      margin-bottom: var(--spacing-md);

      .icon-emoji {
        font-size: 80rpx;
      }
    }

    .empty-text {
      font-size: var(--font-size-base);
      color: var(--text-color-tertiary);
      margin-bottom: 12rpx;
    }

    .empty-tip {
      font-size: 24rpx;
      color: var(--text-color-placeholder);
      margin-bottom: 32rpx;
      text-align: center;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 240rpx;
      height: 72rpx;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
      border-radius: 9999px;
      box-shadow: 0 8rpx 24rpx var(--primary-color-alpha-20);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:active {
        transform: translateY(-2rpx);
        box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-10);
      }

      .action-text {
        font-size: var(--font-size-base);
        color: #fff;
        font-weight: 500;
      }
    }
  }
}
</style>
