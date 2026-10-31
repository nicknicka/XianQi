<template>
  <view class="followers-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      :title="pageTitle"
      :show-back="true"
      background-color="#ffffff"
      text-color="#333333"
    />

    <!-- 导航栏占位 -->
    <view class="nav-placeholder" :style="{ height: navPlaceholderHeight }"></view>

    <!-- 粉丝列表 -->
    <view class="user-list">
      <view v-if="loading && userList.length === 0" class="loading-container">
        <uni-load-more status="loading" :content-text="{ contentdown: '加载中...' }" />
      </view>

      <view v-else-if="userList.length === 0" class="empty-container">
        <view class="empty-icon">👥</view>
        <view class="empty-text">还没有粉丝</view>
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
            <view class="user-stats">
              <text class="stat-item">{{ user.followerCount || 0 }} 粉丝</text>
              <text class="stat-divider">·</text>
              <text class="stat-item">{{ user.followingCount || 0 }} 关注</text>
            </view>
          </view>
          <view class="user-actions">
            <button
              v-if="user.isFollowing"
              class="action-btn following-btn"
              @click.stop="handleUnfollow(user)"
            >
              已关注
            </button>
            <button v-else class="action-btn follow-btn" @click.stop="handleFollow(user)">
              关注
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
import type { UserInfo } from '@/api/user'
import { useThemeStyle } from '@/utils/theme'
import { getNavBarInfo } from '@/utils/system-info'
import { normalizeImageUrl } from '@/utils/image'

interface UserWithFollowStatus extends UserInfo {
  isFollowing?: boolean
}

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()

// 导航栏占位高度
const navBarInfo = getNavBarInfo()
const navPlaceholderHeight = `${navBarInfo.totalHeight}px`
const userId = ref<string>('')
const userList = ref<UserWithFollowStatus[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const loadMoreStatus = ref<'more' | 'loading' | 'noMore'>('more')

// 动态标题
const pageTitle = computed(() => {
  // 如果传入了 userId 且不等于当前用户，显示"TA的粉丝"
  if (userId.value && userId.value !== String(userStore.userInfo?.userId || '')) {
    return 'TA的粉丝'
  }
  return '我的粉丝'
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

// 关注用户
async function handleFollow(user: UserWithFollowStatus) {
  try {
    await userApi.followUser(String(user.id))
    uni.showToast({ title: '关注成功', icon: 'success' })
    // 更新状态
    user.isFollowing = true
  } catch (error: any) {
    console.error('关注失败:', error)
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}

// 取消关注
async function handleUnfollow(user: UserWithFollowStatus) {
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
    // 更新状态
    user.isFollowing = false
  } catch (error: any) {
    console.error('取消关注失败:', error)
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}

// 加载粉丝列表
async function loadFollowersList(refresh = false) {
  if (loading.value) return

  if (refresh) {
    page.value = 1
    loadMoreStatus.value = 'loading'
  } else if (loadMoreStatus.value === 'noMore') {
    return
  }

  loading.value = true

  try {
    // 如果传入了userId，则查询该用户的粉丝列表；否则查询当前登录用户的粉丝列表
    const targetUserId = userId.value || undefined
    const res = await userApi.getFollowersList(targetUserId, page.value, pageSize)

    if (refresh) {
      userList.value = []
    }

    if (res.data.list && res.data.list.length > 0) {
      // 为每个用户添加关注状态（初始默认设为 false）
      const usersWithStatus = res.data.list.map((user: UserInfo) => ({
        ...user,
        isFollowing: false
      }))

      userList.value = [...userList.value, ...usersWithStatus]
      total.value = res.data.total || 0

      // 判断是否还有更多
      if (userList.value.length >= total.value) {
        loadMoreStatus.value = 'noMore'
      } else {
        loadMoreStatus.value = 'more'
        page.value++
      }

      // 异步检查每个粉丝的关注状态（仅当查看自己的粉丝列表时）
      if (!userId.value || userId.value === String(userStore.userInfo?.userId || '')) {
        checkFollowStatusForUsers(res.data.list)
      }
    } else {
      loadMoreStatus.value = 'noMore'
    }
  } catch (error) {
    console.error('加载粉丝列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 批量检查用户关注状态
async function checkFollowStatusForUsers(users: UserInfo[]) {
  for (const user of users) {
    try {
      const isFollowing = await userApi.checkFollow(String(user.id))
      // 找到对应的用户并更新状态
      const targetUser = userList.value.find((u) => u.id === user.id)
      if (targetUser) {
        targetUser.isFollowing = isFollowing.data
      }
    } catch (error) {
      console.error(`检查用户 ${user.id} 关注状态失败:`, error)
    }
  }
}

// 加载更多
function loadMore() {
  if (loadMoreStatus.value === 'more') {
    loadFollowersList()
  }
}

// 下拉刷新
function onRefresh() {
  loadFollowersList(true)
}

// 页面加载
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  userId.value = options.id || ''

  loadFollowersList(true)
})
</script>

<style lang="scss" scoped>
.followers-page {
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

.user-stats {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: var(--text-color-tertiary);
}

.stat-item {
  margin: 0 4rpx;
}

.stat-divider {
  margin: 0 4rpx;
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

  &.follow-btn {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background-color: var(--bg-color-card);

    &:active {
      background-color: var(--primary-color);
      color: #fff;
    }
  }

  &.following-btn {
    border-color: var(--text-color-placeholder);
    color: var(--text-color-tertiary);
    background-color: var(--bg-color-disabled);
  }

  &:active {
    transform: scale(0.95);
  }
}

.load-more {
  padding: 30rpx 0;
}
</style>
