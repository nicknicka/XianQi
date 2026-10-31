<template>
  <view class="following-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      :title="pageTitle"
      :show-back="true"
      background-color="#ffffff"
      text-color="#333333"
    />

    <!-- 导航栏占位 -->
    <view class="nav-placeholder" :style="{ height: navPlaceholderHeight }"></view>

    <!-- 关注列表 -->
    <view class="user-list">
      <view v-if="loading && userList.length === 0" class="loading-container">
        <uni-load-more status="loading" :content-text="{ contentdown: '加载中...' }" />
      </view>

      <view v-else-if="userList.length === 0" class="empty-container">
        <view class="empty-icon">👥</view>
        <view class="empty-text">还没有关注任何人</view>
      </view>

      <view v-else>
        <view
          v-for="user in userList"
          :key="user.id"
          class="user-item"
          @click="goToUserHome(user.id)"
        >
          <image class="user-avatar" :src="normalizeImageUrl(user.avatar) || '/static/default-avatar.png'" mode="aspectFill" />
          <view class="user-info">
            <view class="user-name">{{ user.nickname || user.username }}</view>
          </view>
          <view class="user-actions">
            <button
              class="action-btn following-btn"
              :class="{ 'is-following': true }"
              @click.stop="handleUnfollow(user)"
            >
              已关注
            </button>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="userList.length > 0" class="load-more">
        <uni-load-more
          :status="loadMoreStatus"
          :content-text="{
            contentdown: '上拉加载更多',
            contentrefresh: '加载中...',
            contentnomore: '没有更多了'
          }"
          @clickLoadMore="loadMore"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import type { FollowUser } from '@/api/user'
import { useThemeStyle } from '@/utils/theme'
import { getNavBarInfo } from '@/utils/system-info'
import { normalizeImageUrl } from '@/utils/image'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()

// 导航栏占位高度
const navBarInfo = getNavBarInfo()
const navPlaceholderHeight = `${navBarInfo.totalHeight}px`
const userId = ref<string>('')
const userList = ref<FollowUser[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const loadMoreStatus = ref<'more' | 'loading' | 'noMore'>('more')

// 动态标题
const pageTitle = computed(() => {
  // 如果传入了 userId 且不等于当前用户，显示"TA的关注"
  if (userId.value && userId.value !== String(userStore.userInfo?.userId || '')) {
    return 'TA的关注'
  }
  return '我的关注'
})

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 跳转到用户主页
function goToUserHome(id: string) {
  uni.navigateTo({
    url: `/pages/user/home?id=${id}`
  })
}

// 取消关注
async function handleUnfollow(user: FollowUser) {
  try {
    const confirmed = await new Promise<boolean>((resolve) => {
      uni.showModal({
        title: '取消关注',
        content: `确定取消关注 ${user.nickname || user.username} 吗？`,
        success: (res) => resolve(res.confirm)
      })
    })

    if (!confirmed) return

    await userApi.unfollowUser(String(user.id))
    uni.showToast({ title: '已取消关注', icon: 'success' })

    // 从列表中移除
    userList.value = userList.value.filter((u) => u.id !== user.id)
    total.value--
  } catch (error: any) {
    console.error('取消关注失败:', error)
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}

// 加载关注列表
async function loadFollowingList(refresh = false) {
  if (loading.value) return

  if (refresh) {
    page.value = 1
    loadMoreStatus.value = 'loading'
  } else if (loadMoreStatus.value === 'noMore') {
    return
  }

  loading.value = true

  try {
    // 如果传入了userId，则查询该用户的关注列表；否则查询当前登录用户的关注列表
    const targetUserId = userId.value || undefined
    const res = await userApi.getFollowingList(targetUserId, page.value, pageSize)

    if (refresh) {
      userList.value = []
    }

    if (res.data.list && res.data.list.length > 0) {
      userList.value = [...userList.value, ...res.data.list]
      total.value = res.data.total || 0

      // 判断是否还有更多
      if (userList.value.length >= total.value) {
        loadMoreStatus.value = 'noMore'
      } else {
        loadMoreStatus.value = 'more'
        page.value++
      }
    } else {
      loadMoreStatus.value = 'noMore'
    }
  } catch (error) {
    console.error('加载关注列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 加载更多
function loadMore() {
  if (loadMoreStatus.value === 'more') {
    loadFollowingList()
  }
}

// 页面加载
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  userId.value = options.id || ''

  loadFollowingList(true)
})
</script>

<style lang="scss" scoped>
.following-page {
  min-height: 100vh;
  background-color: var(--bg-color-disabled);
}

.nav-placeholder {
  width: 100%;
  flex-shrink: 0;
}

.user-list {
  padding: 20rpx 30rpx;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: var(--text-color-tertiary);
}

.user-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background-color: var(--bg-color-card);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background-color: var(--border-color-light);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-color-primary);
  margin-bottom: 8rpx;
}

.user-actions {
  margin-left: 20rpx;
}

.action-btn {
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  border: 2rpx solid var(--primary-color);
  background-color: var(--bg-color-card);
  color: var(--primary-color);
  transition: all 0.3s;

  &.following-btn {
    border-color: var(--text-color-placeholder);
    color: var(--text-color-tertiary);
  }

  &:active {
    transform: scale(0.95);
  }
}

.load-more {
  padding: 30rpx 0;
}
</style>
