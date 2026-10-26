<template>
  <view class="publish-page" :style="themeStyle">
    <PublishSidebar
      :isOpen="sidebarOpen"
      :currentMode="publishMode"
      :draftCount="draftCount"
      :recentDrafts="recentDrafts"
      @close="closeSidebar"
      @switchMode="handleModeSwitch"
      @goToDrafts="goToDrafts"
    />

    <view class="hero-card">
      <view class="hero-header">
        <text class="hero-title">发布入口</text>
        <view class="menu-btn" @tap="openSidebar">
          <text class="menu-icon">☰</text>
        </view>
      </view>
      <text class="hero-desc">
        这里不再承载占位表单，只负责切换到真实的商品发布页、共享发布页和草稿箱。
      </text>
      <view class="mode-indicator" :class="publishMode">
        <text class="indicator-text">{{ publishMode === 'market' ? '当前模式：发布商品' : '当前模式：发布共享' }}</text>
      </view>
    </view>

    <view class="content">
      <view class="card action-card">
        <text class="section-title">继续发布</text>
        <button class="primary-btn" @tap="goToCurrentPublish">
          {{ publishMode === 'market' ? '进入商品发布页' : '进入共享发布页' }}
        </button>
        <button class="secondary-btn" @tap="goToDrafts">
          打开草稿箱
        </button>
      </view>

      <view class="card">
        <view class="summary-row">
          <text class="summary-label">草稿总数</text>
          <text class="summary-value">{{ draftCount }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">商品草稿</text>
          <text class="summary-value">{{ marketDrafts.length }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">共享草稿</text>
          <text class="summary-value">{{ shareDrafts.length }}</text>
        </view>
      </view>

      <view class="card">
        <text class="section-title">最近草稿</text>
        <view v-if="recentDrafts.length > 0" class="draft-list">
          <view v-for="draft in recentDrafts" :key="draft.id" class="draft-item">
            <view>
              <text class="draft-title">{{ draft.title || '未命名草稿' }}</text>
              <text class="draft-meta">{{ draft.type === 'market' ? '商品发布' : '共享发布' }}</text>
            </view>
            <text class="draft-time">{{ formatTime(draft.updateTime) }}</text>
          </view>
        </view>
        <text v-else class="placeholder-text">暂无本地草稿，进入真实发布页后会自动保存。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useThemeStyle, useThemePage } from '@/utils/theme'
import productApi from '@/api/product'
import { shareApi } from '@/api/share'
import PublishSidebar from '@/components/publish-sidebar/publish-sidebar.vue'

const { themeStyle } = useThemeStyle()

onShow(() => {
  useThemePage()
  loadDraftSummary()
})

// ==================== 侧边栏状态 ====================
const sidebarOpen = ref(false)
const publishMode = ref<'market' | 'share'>('market')

// ==================== 草稿相关 ====================
const draftCount = ref(0)
const recentDrafts = ref<Array<{ id: string; type: 'market' | 'share'; title: string; updateTime: string }>>([])
const marketDrafts = computed(() => recentDrafts.value.filter(item => item.type === 'market'))
const shareDrafts = computed(() => recentDrafts.value.filter(item => item.type === 'share'))

async function loadDraftSummary() {
  const drafts: Array<{ id: string; type: 'market' | 'share'; title: string; updateTime: string }> = []

  const marketDraft = parseLocalDraft('product_publish_draft', 'market')
  if (marketDraft) {
    drafts.push(marketDraft)
  }

  const shareDraft = parseLocalDraft('share_draft_data', 'share')
  if (shareDraft) {
    drafts.push(shareDraft)
  }

  recentDrafts.value = drafts.sort((a, b) => {
    return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
  })

  try {
    const [marketCountRes, shareCountRes] = await Promise.all([
      productApi.getDraftCount(),
      shareApi.getDraftCount()
    ])
    draftCount.value = (marketCountRes?.data?.count || 0) + (shareCountRes?.data?.count || 0)
  } catch (error) {
    draftCount.value = recentDrafts.value.length
  }
}

function parseLocalDraft(storageKey: string, type: 'market' | 'share') {
  try {
    const draftStr = uni.getStorageSync(storageKey)
    if (!draftStr) return null

    const draftData = JSON.parse(draftStr)
    const form = draftData?.form || {}
    const updateTime = draftData?.updateTime
      ? new Date(draftData.updateTime).toISOString()
      : new Date().toISOString()

    if (!form.title && !(draftData?.images?.length > 0)) {
      return null
    }

    return {
      id: `${type}-${form.draftId || form.title || updateTime}`,
      type,
      title: form.title || '',
      updateTime
    }
  } catch (error) {
    console.warn('[publish-with-sidebar] 解析本地草稿失败:', error)
    return null
  }
}

// ==================== 侧边栏操作 ====================
/** 打开侧边栏 */
function openSidebar() {
  sidebarOpen.value = true
}

/** 关闭侧边栏 */
function closeSidebar() {
  sidebarOpen.value = false
}

/** 处理模式切换 */
function handleModeSwitch(newMode: 'market' | 'share') {
  publishMode.value = newMode
  goToCurrentPublish()
}

/** 跳转到草稿箱 */
function goToDrafts() {
  closeSidebar()
  uni.navigateTo({
    url: '/pages/mine/drafts'
  })
}

function goToCurrentPublish() {
  uni.navigateTo({
    url: publishMode.value === 'market' ? '/pages/market/publish' : '/pages/share/publish'
  })
}

function formatTime(time: string) {
  if (!time) return '刚刚'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style lang="scss" scoped>
.publish-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding: 32rpx;
}

.menu-btn {
  width: 72rpx;
  height: 72rpx;
  background: var(--bg-color-card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);

  .menu-icon {
    font-size: 36rpx;
    color: var(--text-color-primary);
  }
}

.hero-card {
  background: linear-gradient(135deg, rgba(35, 180, 145, 0.14) 0%, rgba(87, 133, 255, 0.12) 100%);
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.hero-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color-primary);
}

.hero-desc {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--text-color-secondary);
  margin-bottom: 24rpx;
}

.mode-indicator {
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.market {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  }

  &.share {
    background: linear-gradient(135deg, var(--success-color) 0%, var(--success-color-alpha-30) 100%);
  }

  .indicator-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-color-inverse);
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.card {
  background: var(--bg-color-card);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.primary-btn,
.secondary-btn {
  width: 100%;
  border-radius: 999rpx;
  font-size: 28rpx;
}

.primary-btn {
  background: var(--primary-color);
  color: #fff;
}

.secondary-btn {
  background: var(--bg-color-page);
  color: var(--text-color-primary);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.summary-label {
  font-size: 28rpx;
  color: var(--text-color-secondary);
}

.summary-value {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 20rpx;
}

.draft-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.draft-title {
  display: block;
  font-size: 28rpx;
  color: var(--text-color-primary);
  margin-bottom: 8rpx;
}

.draft-meta,
.draft-time,
.placeholder-text {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
}
</style>
