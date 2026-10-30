<template>
  <view class="follow-list-page" :style="[themeStyle, pageAnimationStyle]">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      :title="pageTitle"
      :show-back="true"
      background-color="var(--bg-color-card)"
      text-color="var(--text-color-primary)"
    />

    <!-- 导航栏占位 -->
    <view class="nav-placeholder" :style="{ height: navPlaceholderHeight }"></view>

    <!-- Tab 切换 -->
    <view class="tab-bar" :style="{ top: navPlaceholderHeight }">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ 'tab-active': currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view v-if="currentTab === tab.value" class="tab-indicator"></view>
      </view>
    </view>

    <!-- 用户列表 -->
    <scroll-view class="scroll-view" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh" @scrolltolower="loadMore">
      <view v-if="userList.length === 0 && !loading" class="empty-state empty-animate">
        <view class="empty-icon">
          <uni-icons type="person" size="120" color="#ddd" />
        </view>
        <text class="empty-text">{{ emptyText }}</text>
      </view>

      <view v-else class="user-list">
        <view
          v-for="(item, index) in userList"
          :key="item.id"
          class="user-item item-animate"
          :class="{ 'item-visible': isItemVisible(index) }"
          :style="getItemStyle(index)"
        >
          <UserAvatar class="avatar" :src="item.avatar" size="md" shape="circle" @click="goUserHome(item.id)" />
          <view class="user-info" @click="goUserHome(item.id)">
            <text class="name">{{ item.nickname || item.username }}</text>
            <text v-if="item.signature" class="signature">{{ item.signature }}</text>
            <text v-else class="meta">ID: {{ item.id }}</text>
          </view>
          <view v-if="currentTab === 'followers'" class="action-btn-wrap">
            <button
              v-if="item.isFollowing"
              class="follow-btn following"
              @click.stop="unfollowUser(item.id)"
            >
              <uni-icons type="checkmarkempty" size="14" color="#7A7A7A" />
              <text>已关注</text>
            </button>
            <button
              v-else
              class="follow-btn"
              @click.stop="followUser(item.id)"
            >
              <uni-icons type="plus" size="14" color="#667eea" />
              <text>关注</text>
            </button>
          </view>
          <view v-else class="follow-time">
            <text class="time-text">{{ formatTime(item.followTime) }}</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-if="!hasMore && userList.length > 0" class="no-more">
        <text class="no-more-text">没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { formatDateTime } from '@/utils/date'
import { usePageAnimation } from '@/composables/usePageAnimation'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import { useThemePage, useThemeStyle } from '@/utils/theme'
import { getNavBarInfo } from '@/utils/system-info'

const { themeStyle } = useThemeStyle()

onShow(() => {
  useThemePage()
})

const userStore = useUserStore()

const navBarInfo = getNavBarInfo()
const navPlaceholderHeight = `${navBarInfo.totalHeight}px`

// 启用页面动画
const { pageAnimationStyle, isItemVisible, getItemStyle } = usePageAnimation()

// 页面参数
const pageType = ref<'following' | 'followers'>('following')

// Tab 配置
const tabs = computed<Array<{ label: string; value: 'following' | 'followers' }>>(() => [
  { label: '我的关注', value: 'following' },
  { label: '我的粉丝', value: 'followers' }
])

// 当前 Tab
const currentTab = ref<'following' | 'followers'>('following')

// 页面标题
const pageTitle = computed(() => currentTab.value === 'following' ? '我的关注' : '我的粉丝')

// 空状态文本
const emptyText = computed(() => currentTab.value === 'following' ? '还没有关注任何人' : '还没有粉丝关注你')

// 用户列表
interface UserItem {
  id: string
  username: string
  nickname: string
  avatar: string
  signature?: string
  followTime?: string
  isFollowing?: boolean
}

const userList = ref<UserItem[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 20

// 格式化时间
function formatTime(time?: string) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}月前`
  return `${Math.floor(days / 365)}年前`
}

// 切换 Tab
function switchTab(tab: 'following' | 'followers') {
  if (currentTab.value === tab) return
  currentTab.value = tab
  userList.value = []
  currentPage.value = 1
  hasMore.value = true
  loadUserList()
}

// 加载用户列表
async function loadUserList() {
  if (loading.value || !hasMore.value) return

  loading.value = true
  try {
    const userId = userStore.userInfo?.userId
    if (!userId) {
      uni.showToast({
        title: '用户信息不存在',
        icon: 'none'
      })
      return
    }

    // 根据 Tab 类型调用不同的 API
    const apiCall = currentTab.value === 'following'
      ? userApi.getFollowingList(String(userId), currentPage.value, pageSize)
      : userApi.getFollowersList(String(userId), currentPage.value, pageSize)

    const res: any = await apiCall
    const list = res.data?.records || res.data || []
    const total = res.data?.total || res.total || 0

    // 标记是否已关注（仅在粉丝列表中显示）
    const processedList = list.map((item: any) => ({
      ...item,
      isFollowing: currentTab.value === 'followers' ? (item.isFollowing || false) : true
    }))

    if (currentPage.value === 1) {
      userList.value = processedList
    } else {
      userList.value = [...userList.value, ...processedList]
    }

    hasMore.value = userList.value.length < total
    currentPage.value++
  } catch (error: any) {
    console.error('[FollowList] 加载用户列表失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
async function onRefresh() {
  refreshing.value = true
  currentPage.value = 1
  hasMore.value = true
  await loadUserList()
}

// 加载更多
function loadMore() {
  if (!loading.value && hasMore.value) {
    loadUserList()
  }
}

// 关注用户
async function followUser(userId: string) {
  try {
    await userApi.followUser(String(userId))
    uni.showToast({
      title: '关注成功',
      icon: 'success'
    })
    // 更新列表中该用户的关注状态
    const user = userList.value.find(u => u.id === userId)
    if (user) {
      user.isFollowing = true
    }
    // 更新本地用户统计数据（关注数+1）
    const currentFollowingCount = userStore.userInfo?.followingCount || 0
    userStore.updateUserInfo({ followingCount: currentFollowingCount + 1 })
  } catch (error: any) {
    console.error('[FollowList] 关注失败:', error)
    uni.showToast({
      title: error.message || '关注失败',
      icon: 'none'
    })
  }
}

// 取消关注
async function unfollowUser(userId: string) {
  try {
    await userApi.unfollowUser(String(userId))
    uni.showToast({
      title: '已取消关注',
      icon: 'success'
    })
    // 更新列表中该用户的关注状态
    const user = userList.value.find(u => u.id === userId)
    if (user) {
      user.isFollowing = false
    }
    // 更新本地用户统计数据（关注数-1，但最少为0）
    const currentFollowingCount = userStore.userInfo?.followingCount || 0
    userStore.updateUserInfo({ followingCount: Math.max(0, currentFollowingCount - 1) })
  } catch (error: any) {
    console.error('[FollowList] 取消关注失败:', error)
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    })
  }
}

// 跳转到用户主页
function goUserHome(userId: string) {
  uni.navigateTo({
    url: `/pages/user/home?id=${userId}`
  })
}

// 返回上一页
function goBack() {
  uni.navigateBack({
    delta: 1
  })
}

// 页面加载
onLoad((options: any) => {
  console.log('[FollowList] 页面参数:', options)
  if (options.type) {
    pageType.value = options.type
    currentTab.value = options.type
  }
  loadUserList()
})
</script>

<style lang="scss" scoped>
.follow-list-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-placeholder {
  width: 100%;
  flex-shrink: 0;
}

.tab-bar {
  display: flex;
  background: var(--bg-color-card);
  border-bottom: 1rpx solid var(--border-color-light);
  position: sticky;
  top: 0;
  z-index: 99;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx 0;
    position: relative;

    .tab-text {
      font-size: 28rpx;
      color: var(--text-color-secondary);
      transition: color 0.3s;
    }

    &.tab-active {
      .tab-text {
        color: var(--primary-color);
        font-weight: 600;
      }
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      width: 60rpx;
      height: 6rpx;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
      border-radius: 3rpx;
    }
  }
}

.scroll-view {
  flex: 1;
  min-height: 0;
}

.user-list {
  padding: 20rpx 32rpx;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: var(--bg-color-card);
  border-radius: 16rpx;
  margin-bottom: 20rpx;

  .avatar {
    flex-shrink: 0;
    margin-right: 24rpx;
  }

  .user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .name {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 8rpx;
    }

    .signature {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .meta {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }

  .action-btn-wrap {
    flex-shrink: 0;
    margin-left: 16rpx;

    .follow-btn {
      display: flex;
      align-items: center;
      padding: 12rpx 24rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
      border: 2rpx solid var(--primary-color);
      background: var(--bg-color-card);
      color: var(--primary-color);

      &.following {
        border-color: #e0e0e0;
        color: var(--text-color-secondary);
      }

      uni-icons {
        margin-right: 4rpx;
      }
    }
  }

  .follow-time {
    flex-shrink: 0;
    margin-left: 16rpx;

    .time-text {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
  background: transparent;

  .empty-icon {
    margin-bottom: 40rpx;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }
}

.loading,
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;

  .loading-icon,
  .no-more-text {
    font-size: 24rpx;
    color: var(--text-color-tertiary);
  }

  .loading-text {
    font-size: 24rpx;
    color: var(--text-color-tertiary);
    margin-left: 12rpx;
  }
}

/* 页面动画 */
.header-animate {
  animation: slideInDown 0.4s ease-out;
}

.empty-animate {
  animation: fadeIn 0.6s ease-out;
}

.item-animate {
  animation: slideInUp 0.4s ease-out;
  animation-fill-mode: both;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
