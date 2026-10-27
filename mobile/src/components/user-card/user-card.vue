<template>
  <view class="user-card" @click="handleClick">
    <UserAvatar :src="user.avatar" size="md" shape="circle" />
    <view class="user-info">
      <view class="user-header">
        <text class="name">{{ user.nickname || user.username }}</text>
        <view class="credit-info" v-if="showCredit">
          <uni-icons type="star" size="12" :color="warningColor" />
          <text class="credit-score">{{ user.creditScore || 0 }}</text>
        </view>
      </view>
      <text class="bio" v-if="user.bio && showBio">{{ user.bio }}</text>
      <view class="stats" v-if="showStats">
        <text class="stat-item">发布 {{ user.publishCount || 0 }}</text>
        <text class="stat-item">信用 {{ user.creditScore || 0 }}</text>
      </view>
    </view>
    <slot name="extra" />
  </view>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { warningColor } = useThemeColors()

interface User {
  id: string
  username?: string
  nickname?: string
  avatar?: string
  bio?: string
  creditScore?: number
  publishCount?: number
}

interface Props {
  user: User
  showCredit?: boolean
  showBio?: boolean
  showStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCredit: true,
  showBio: false,
  showStats: false
})

const emit = defineEmits<{
  click: [user: User]
}>()

function handleClick() {
  emit('click', props.user)
}
</script>

<style lang="scss" scoped>
.user-card {
  display: flex;
  align-items: center;
  background: var(--bg-color-card);
  border-radius: var(--spacing-sm);
  padding: 16rpx;
  gap: 16rpx;

  .user-info {
    flex: 1;

    .user-header {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 8rpx;

      .name {
        font-size: var(--font-size-lg);
        font-weight: 500;
        color: var(--text-color-primary);
      }

      .credit-info {
        display: flex;
        align-items: center;
        gap: 4rpx;

        .credit-score {
          font-size: var(--font-size-sm);
          color: var(--text-color-secondary);
        }
      }
    }

    .bio {
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
      display: block;
      margin-bottom: 8rpx;
    }

    .stats {
      display: flex;
      gap: 24rpx;

      .stat-item {
        font-size: var(--font-size-sm);
        color: var(--text-color-secondary);
      }
    }
  }
}
</style>
