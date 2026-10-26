<template>
  <view class="select-user-page">
    <view class="header">
      <view class="search-box">
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索用户昵称"
        />
      </view>
    </view>

    <scroll-view class="user-list" scroll-y>
      <view v-if="filteredUsers.length === 0" class="empty-container">
        <text class="empty-text">{{ loading ? '搜索中...' : (searchKeyword ? '未找到相关用户' : '请输入昵称或手机号搜索') }}</text>
      </view>

      <view
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-item"
        @click="selectUser(user)"
      >
        <UserAvatar class="user-avatar" :src="user.avatar" size="sm" shape="circle" />
        <view class="user-info">
          <text class="user-name">{{ user.nickname }}</text>
          <text class="user-credit">信用分: {{ user.creditScore }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage } from '@/utils/theme'
import { ref, computed, watch } from 'vue'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import { onShow } from '@dcloudio/uni-app'
import { userApi } from '@/api/user'

const searchKeyword = ref('')
const allUsers = ref<any[]>([])
const eventChannel = ref<any>()
const loading = ref(false)

// 获取页面参数和事件通道
const pages = getCurrentPages()
const currentPage = pages[pages.length - 1] as any
eventChannel.value = currentPage.eventChannel

const filteredUsers = computed(() => {
  if (!searchKeyword.value.trim()) {
    return allUsers.value
  }
  return allUsers.value
})

watch(searchKeyword, async (value) => {
  const keyword = value.trim()
  if (!keyword) {
    allUsers.value = []
    return
  }

  loading.value = true
  try {
    const res = await userApi.searchUsers({ keyword, page: 1, pageSize: 20 })
    allUsers.value = res.data?.list || []
  } catch (error) {
    allUsers.value = []
  } finally {
    loading.value = false
  }
})

onShow(() => {
  useThemePage()
})


function selectUser(user: any) {
  // 通过eventChannel返回选择的用户
  if (eventChannel.value && eventChannel.value.emit) {
    eventChannel.value.emit('onUserSelected', user)
  }
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.select-user-page {
  min-height: 100vh;
  background: var(--bg-color-disabled);
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--bg-color-card);
  padding: 16rpx 24rpx;
  border-bottom: 1px solid var(--border-color-light);

  .search-box {
    height: 64rpx;
    background: var(--bg-color-disabled);
    border-radius: 32rpx;
    padding: 0 24rpx;
    display: flex;
    align-items: center;

    .search-input {
      flex: 1;
      font-size: 14px;
      border: none;
      background: transparent;
    }
  }
}

.user-list {
  flex: 1;
  padding: 16rpx 24rpx;
}

.empty-container {
  padding-top: 200rpx;
  text-align: center;

  .empty-text {
    font-size: 14px;
    color: var(--text-color-tertiary);
  }
}

.user-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--bg-color-card);
  border-radius: 8px;
  padding: 24rpx;
  margin-bottom: 16rpx;

  &:active {
    background: var(--bg-color-disabled);
  }

  .user-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color-primary);
    }

    .user-credit {
      font-size: 12px;
      color: var(--text-color-tertiary);
    }
  }

  .arrow {
    font-size: 24px;
    color: var(--text-color-tertiary);
    font-weight: 300;
  }
}
</style>
