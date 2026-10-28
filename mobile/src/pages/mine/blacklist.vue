<template>
  <view class="blacklist-page service-redesign-page" :style="pageAnimationStyle">
    <!-- 页面头部 -->
    <view class="page-header header-animate">
      <text class="title">黑名单</text>
      <text class="desc">已拉黑 {{ blacklist.length }} 人</text>
    </view>

    <!-- 搜索栏 -->
    <view v-if="blacklist.length > 0" class="search-bar">
      <view class="search-input-wrapper">
        <uni-icons type="search" size="16" color="#AAAAAA" />
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索昵称或用户名"
          placeholder-style="color: var(--text-color-tertiary)"
          @input="onSearchInput"
        />
        <uni-icons v-if="searchKeyword" type="clear" size="16" color="#AAAAAA" @click="clearSearch" />
      </view>
    </view>

    <!-- 批量操作栏 -->
    <view v-if="blacklist.length > 0 && selectedItems.length > 0" class="batch-bar">
      <view class="batch-info">
        <checkbox class="select-all-checkbox" :checked="isAllSelected" @click="toggleSelectAll" />
        <text class="batch-text">已选 {{ selectedItems.length }} 项</text>
      </view>
      <button class="batch-remove-btn" @click="batchRemove">批量移除</button>
    </view>

    <!-- 黑名单列表 -->
    <scroll-view class="scroll-view" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view v-if="blacklist.length === 0 && !loading" class="empty-state empty-animate">
        <image class="empty-image" src="/static/images/blackList.png" mode="aspectFit" />
        <text class="empty-text">暂无黑名单</text>
      </view>

      <view v-else-if="filteredBlacklist.length === 0 && !loading" class="empty-state">
        <text class="empty-text">未找到匹配的用户</text>
      </view>

      <view v-else class="blacklist-list">
        <view
          v-for="(item, index) in filteredBlacklist"
          :key="item.id"
          class="blacklist-item item-animate"
          :class="{ 'item-visible': isItemVisible(index), 'batch-mode': selectedItems.length > 0 }"
          :style="getItemStyle(index)"
        >
          <checkbox
            v-if="selectedItems.length > 0 || isSelectMode"
            class="item-checkbox"
            :checked="selectedItems.includes(item.id)"
            @click="toggleSelectItem(item.id)"
          />
          <UserAvatar class="avatar" :src="item.avatar" size="sm" shape="circle" @click="goUserHome(item.userId)" />
          <view class="user-info" @click="goUserHome(item.userId)">
            <text class="name">{{ item.nickname || item.username }}</text>
            <text class="add-time">{{ formatTime(item.createdAt) }} 拉黑</text>
          </view>
          <button v-if="selectedItems.length === 0 && !isSelectMode" class="remove-btn" @click="removeBlacklist(item.id)">移除</button>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">加载中...</text>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="blacklist.length > 0 && selectedItems.length === 0" class="bottom-actions">
      <button class="action-btn" @click="toggleSelectMode">
        <uni-icons type="list" size="16" color="#7A7A7A" />
        <text>批量管理</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeColors, useThemeStyle } from '@/utils/theme'
import { ref, onMounted, computed } from 'vue'
import { formatDateTime } from '@/utils/date'
import { usePageAnimation } from '@/composables/usePageAnimation'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { blacklistApi } from '@/api/blacklist'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import { onShow } from '@dcloudio/uni-app'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { dangerColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

interface BlacklistItem {
  id: string
  userId: string
  username: string
  nickname: string
  avatar: string
  createdAt: string
}

const blacklist = ref<BlacklistItem[]>([])
const loading = ref(false)
const refreshing = ref(false)
const searchKeyword = ref('')
const selectedItems = ref<Array<string>>([])
const isSelectMode = ref(false)

// 过滤后的黑名单列表
const filteredBlacklist = computed(() => {
  if (!searchKeyword.value) {
    return blacklist.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return blacklist.value.filter(item => {
    return (item.nickname?.toLowerCase() || '').includes(keyword) ||
           (item.username?.toLowerCase() || '').includes(keyword)
  })
})

// 是否全选
const isAllSelected = computed(() => {
  return filteredBlacklist.value.length > 0 &&
         selectedItems.value.length === filteredBlacklist.value.length
})

// 页面入场动画
const {
  pageVisible,
  contentOpacity,
  contentTransform,
  startPageAnimation,
  isItemVisible,
  getItemStyle
} = usePageAnimation({
  delay: 50,
  duration: 350,
  stagger: true,
  staggerDelay: 60
})

// 页面容器动画样式
const pageAnimationStyle = computed(() => ({
  opacity: contentOpacity.value,
  transform: `translateY(${contentTransform.value}rpx)`,
  transition: pageVisible.value
    ? 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : 'none'
}))

onShow(() => {
  useThemePage()
})


onMounted(() => {
  startPageAnimation()
  loadBlacklist()
})

async function loadBlacklist() {
  loading.value = true

  try {
    const res: any = await blacklistApi.getBlacklist({ page: 1, size: 100 })
    blacklist.value = (res.records || []).map((item: any) => ({
      id: item.id,
      userId: item.blockedUserId,
      username: item.username,
      nickname: item.nickname,
      avatar: item.avatar,
      reason: item.reason || '',
      createdAt: item.createdAt
    }))
  } catch (error) {
    console.error('加载黑名单失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() {
  refreshing.value = true
  loadBlacklist()
}

async function removeBlacklist(id: string) {
  uni.showModal({
    title: '提示',
    content: '确定要移出黑名单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await blacklistApi.removeFromBlacklist(id)
          blacklist.value = blacklist.value.filter((item) => item.id !== id)
          uni.showToast({ title: '已移除', icon: 'success' })
        } catch (error) {
          console.error('移除黑名单失败:', error)
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

// 搜索输入
function onSearchInput(e: any) {
  searchKeyword.value = e.detail.value
}

// 清除搜索
function clearSearch() {
  searchKeyword.value = ''
}

// 切换选择模式
function toggleSelectMode() {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) {
    selectedItems.value = []
  }
}

// 切换选择项
function toggleSelectItem(id: string) {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

// 全选/取消全选
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = filteredBlacklist.value.map(item => item.id)
  }
}

// 批量移除
async function batchRemove() {
  if (selectedItems.value.length === 0) {
    uni.showToast({ title: '请先选择要移除的用户', icon: 'none' })
    return
  }

  uni.showModal({
    title: '批量移除',
    content: `确定要移出选中的 ${selectedItems.value.length} 个用户吗？`,
    confirmText: '确定',
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          // 逐个移除
          for (const id of selectedItems.value) {
            await blacklistApi.removeFromBlacklist(id)
          }

          // 从列表中移除
          blacklist.value = blacklist.value.filter(item => !selectedItems.value.includes(item.id))

          // 重置选择状态
          selectedItems.value = []
          isSelectMode.value = false

          uni.showToast({
            title: '批量移除成功',
            icon: 'success'
          })
        } catch (error) {
          console.error('批量移除黑名单失败:', error)
          uni.showToast({
            title: '部分操作失败，请重试',
            icon: 'none'
          })
        }
      }
    }
  })
}

function goUserHome(userId: string) {
  uni.navigateTo({
    url: `/pages/user/home?id=${userId}`
  })
}

function formatTime(time: string) {
  return formatDateTime(time, 'YYYY-MM-DD')
}
</script>

<style lang="scss" scoped>
.blacklist-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

// 页面头部 - 统一卡片风格
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: var(--bg-color-card);
  margin: 0 24rpx 16rpx;
  border-radius: 20rpx;
  border: 1px solid var(--border-color-light);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;

  .title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .desc {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

// 搜索栏 - 统一卡片风格
.search-bar {
  padding: 16rpx 24rpx;
  background: var(--bg-color-card);
  margin: 0 24rpx 16rpx;
  border-radius: 20rpx;
  border: 1px solid var(--border-color-light);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .search-input-wrapper {
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    background: var(--bg-color-page);
    border-radius: 48rpx;

    .search-input {
      flex: 1;
      margin: 0 16rpx;
      font-size: var(--font-size-base);
    }
  }
}

// 批量操作栏 - 统一卡片风格
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  background: var(--bg-color-warm);
  margin: 0 24rpx 16rpx;
  border-radius: 20rpx;
  border: 1px solid var(--warning-color);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .batch-info {
    display: flex;
    align-items: center;

    .select-all-checkbox {
      margin-right: 16rpx;
    }

    .batch-text {
      font-size: var(--font-size-base);
      color: var(--warning-color);
    }
  }

  .batch-remove-btn {
    padding: 8rpx 24rpx;
    background: var(--error-color);
    color: #fff;
    font-size: var(--font-size-sm);
    border-radius: 9999px;
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(0.92);
      opacity: 0.85;
    }
  }
}

// 底部操作栏
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 16rpx;
    background: var(--bg-color-page);
    border-radius: 48rpx;
    font-size: var(--font-size-base);
    color: var(--text-color-primary);
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    text {
      margin-left: 8rpx;
    }

    &:active {
      transform: scale(0.96);
    }
  }
}

/* ========== 页面入场动画 ========== */

.header-animate {
  animation: headerSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes headerSlideDown {
  0% {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-animate {
  animation: emptyFadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes emptyFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// 浮动动画 - 空状态图片
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}

/* 列表项入场动画 */
.item-animate {
  opacity: 0;
  transform: translateX(-20rpx);

  &.item-visible {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 头像动画 */
.avatar {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:active {
    transform: scale(0.95);
  }
}

/* 移除按钮动画 */
.remove-btn {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

  &:active {
    transform: scale(0.92);
    opacity: 0.8;
  }
}

.scroll-view {
  height: calc(100vh - 100rpx);
  box-sizing: border-box;
  overflow: hidden;
  padding: 0 24rpx;
}

.blacklist-list {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  .blacklist-item {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    background: var(--bg-color-card);
    padding: 24rpx;
    margin-bottom: 16rpx;
    border-radius: 20rpx;
    border: 1px solid var(--border-color-light);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    }

    &.batch-mode {
      background: var(--bg-color-warm);
    }

    .item-checkbox {
      margin-right: 16rpx;
    }

    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 16rpx;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .name {
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
        font-weight: 500;
      }

      .add-time {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }

    .remove-btn {
      padding: 12rpx 24rpx;
      background: var(--bg-color-card);
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
      font-size: var(--font-size-sm);
      border-radius: 9999px;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  opacity: 0;
  animation: emptySlideIn 0.5s ease-out 0.3s forwards;
  background: transparent;

  .empty-image {
    width: 240rpx;
    height: 240rpx;
    margin-bottom: var(--spacing-md);
    animation: float 3s ease-in-out infinite;
  }

  .empty-text {
    font-size: var(--font-size-base);
    color: var(--text-color-tertiary);
  }
}

@keyframes emptySlideIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  animation: loadingFadeIn 0.3s ease-out;

  .loading-icon {
    font-size: 32rpx;
  }

  .loading-text {
    margin-left: 16rpx;
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

@keyframes loadingFadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
