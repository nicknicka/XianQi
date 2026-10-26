<template>
  <view class="publish-sidebar" :class="{ 'is-open': isOpen }" :style="themeStyle">
    <!-- 悬浮球按钮 -->
    <view class="floating-ball" :class="{ 'is-open': isOpen }" @tap="toggleSidebar">
      <!-- 草稿数量徽章 -->
      <view class="ball-badge" v-if="draftCount > 0">
        <text class="badge-count">{{ draftCount > 99 ? '99+' : draftCount }}</text>
      </view>
      <!-- 悬浮球图标 -->
      <view class="ball-icon">
        <text class="icon-text" :class="{ 'rotate': isOpen }">⚙</text>
      </view>
    </view>

    <!-- 遮罩层 -->
    <view class="sidebar-mask" :class="{ 'is-show': isOpen }" @tap="handleMaskClick" v-if="isOpen"></view>

    <!-- 右侧抽屉内容 -->
    <view class="sidebar-drawer" :class="{ 'is-open': isOpen }">
      <!-- 顶部标题栏 -->
      <view class="drawer-header">
        <text class="header-title">发布选项</text>
      </view>

      <!-- 模式切换区域 -->
      <view class="drawer-section">
        <text class="section-title">切换模式</text>
        <view class="mode-switcher">
          <view
            class="mode-btn"
            :class="{ 'is-active': currentMode === 'market' }"
            @tap="switchMode('market')"
          >
            <view class="mode-icon market-icon">📦</view>
            <view class="mode-info">
              <text class="mode-name">发布商品</text>
              <text class="mode-desc">二手物品交易</text>
            </view>
            <view class="mode-check" v-if="currentMode === 'market'">
              <text class="check-icon">✓</text>
            </view>
          </view>
          <view
            class="mode-btn"
            :class="{ 'is-active': currentMode === 'share' }"
            @tap="switchMode('share')"
          >
            <view class="mode-icon share-icon">🔄</view>
            <view class="mode-info">
              <text class="mode-name">发布共享</text>
              <text class="mode-desc">物品共享借用</text>
            </view>
            <view class="mode-check" v-if="currentMode === 'share'">
              <text class="check-icon">✓</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 草稿箱区域 -->
      <view class="drawer-section">
        <view class="section-header" @tap="goToDrafts">
          <text class="section-title">草稿箱</text>
          <view class="draft-count-badge" v-if="draftCount > 0">
            <text class="count-text">{{ draftCount > 99 ? '99+' : draftCount }}个草稿</text>
          </view>
        </view>

        <view class="draft-tabs" v-if="recentDrafts.length > 0">
          <view
            class="draft-tab"
            :class="{ active: activeDraftTab === 'market' }"
            @tap="activeDraftTab = 'market'"
          >
            <text class="tab-label">发布草稿</text>
            <text class="tab-count">{{ marketDrafts.length }}</text>
          </view>
          <view
            class="draft-tab"
            :class="{ active: activeDraftTab === 'share' }"
            @tap="activeDraftTab = 'share'"
          >
            <text class="tab-label">共享草稿</text>
            <text class="tab-count">{{ shareDrafts.length }}</text>
          </view>
        </view>

        <view class="draft-preview" v-if="currentDrafts.length > 0" @tap="goToDrafts">
          <view class="draft-item" v-for="(draft, index) in currentDrafts.slice(0, 3)" :key="draftKey(draft, index)">
            <view class="draft-icon" :class="draft.type === 'market' ? 'market' : 'share'">
              {{ draft.type === 'market' ? '📦' : '🔄' }}
            </view>
            <view class="draft-info">
              <text class="draft-title">{{ draft.title || '未命名草稿' }}</text>
              <text class="draft-time">{{ formatTime(draft.updateTime) }}</text>
            </view>
          </view>
          <view class="view-all" v-if="currentDrafts.length > 3">
            <text class="view-all-text">查看全部 ›</text>
          </view>
        </view>
        <view class="empty-drafts" v-else @tap="goToDrafts">
          <text class="empty-icon">📝</text>
          <text class="empty-text">当前暂无{{ activeDraftTab === 'market' ? '发布' : '共享' }}草稿</text>
        </view>
      </view>

      <!-- 底部关闭提示 -->
      <view class="drawer-footer">
        <text class="footer-tip">点击悬浮球或遮罩关闭</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
useThemeColors()

interface Props {
  isOpen?: boolean
  currentMode?: 'market' | 'share'
  draftCount?: number
  recentDrafts?: any[]
}

type DraftMode = 'market' | 'share'

interface DraftItem {
  id?: string | number
  type?: DraftMode
  title?: string
  updateTime?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  currentMode: 'market',
  draftCount: 0,
  recentDrafts: () => []
})

const activeDraftTab = ref<DraftMode>('market')
const marketDrafts = computed(() => filterDraftsByType('market'))
const shareDrafts = computed(() => filterDraftsByType('share'))
const currentDrafts = computed(() => activeDraftTab.value === 'market' ? marketDrafts.value : shareDrafts.value)

const emit = defineEmits<{
  'toggle': []
  'close': []
  'switchMode': [mode: 'market' | 'share']
  'goToDrafts': []
}>()

// 切换侧边栏开关状态
function toggleSidebar() {
  emit('toggle')
}

// 遮罩点击 - 始终关闭
function handleMaskClick() {
  emit('close')
}

// 切换模式
function switchMode(mode: 'market' | 'share') {
  if (mode !== props.currentMode) {
    emit('switchMode', mode)
    emit('close')
  }
}

// 跳转到草稿箱
function goToDrafts() {
  emit('goToDrafts')
  emit('close')
}

function filterDraftsByType(type: DraftMode): DraftItem[] {
  return props.recentDrafts.filter((draft: DraftItem) => draft?.type === type)
}

function draftKey(draft: DraftItem, index: number): string {
  const id = draft?.id ?? `${draft?.title || 'draft'}-${draft?.updateTime || index}`
  return `${draft.type || 'unknown'}:${id}`
}

// 格式化时间
function formatTime(time?: string): string {
  if (!time) return '刚刚'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style lang="scss" scoped>
.publish-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;

  &.is-open {
    pointer-events: auto;
  }
}

// ==================== 悬浮球 ====================
.floating-ball {
  position: fixed;
  right: 30rpx;
  bottom: 300rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
  box-shadow: 0 8rpx 24rpx rgba(212, 165, 116, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  pointer-events: auto;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.is-open {
    transform: rotate(45deg);
    background: linear-gradient(135deg, var(--text-color-tertiary) 0%, var(--text-color-secondary) 100%);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  }

  // 按钮按住效果
  &:active {
    transform: scale(0.9);
  }

  &.is-open:active {
    transform: rotate(45deg) scale(0.9);
  }

  // 草稿数量徽章
  .ball-badge {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    min-width: 44rpx;
    height: 44rpx;
    padding: 0 10rpx;
    background: var(--error-color);
    border-radius: 22rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3rpx solid var(--bg-color-card);
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
    animation: badgePulse 2s infinite;

    .badge-count {
      font-size: 22rpx;
      color: var(--text-color-inverse);
      font-weight: bold;
      transform: scale(0.95);
    }
  }

  // 悬浮球图标
  .ball-icon {
    .icon-text {
      font-size: 52rpx;
      color: var(--text-color-inverse);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

      &.rotate {
        transform: rotate(90deg);
      }
    }
  }
}

// ==================== 遮罩层 ====================
.sidebar-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;

  &.is-show {
    opacity: 1;
    pointer-events: auto;
  }
}

// ==================== 右侧抽屉 ====================
.sidebar-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 600rpx;
  max-width: 90vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 0 0 24rpx;
  box-shadow: -8rpx 0 32rpx rgba(0, 0, 0, 0.15);
  transform: translateX(120%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.is-open {
    transform: translateX(0);
  }
}

// ==================== 抽屉头部 ====================
.drawer-header {
  padding: 50rpx 40rpx 30rpx;
  background: linear-gradient(180deg, var(--bg-color-warm) 0%, var(--bg-color-card) 100%);
  border-bottom: 1rpx solid var(--border-color-light);

  .header-title {
    font-size: 40rpx;
    font-weight: bold;
    color: var(--text-color-primary);
  }
}

// ==================== 抽屉区域 ====================
.drawer-section {
  padding: 40rpx;
  border-bottom: 1rpx solid var(--bg-color-disabled);

  .section-title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-color-primary);
    margin-bottom: 24rpx;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .section-title {
      margin-bottom: 0;
    }

    .draft-count-badge {
      padding: 8rpx 20rpx;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
      border-radius: 24rpx;

      .count-text {
        font-size: 24rpx;
        color: var(--text-color-inverse);
        font-weight: 500;
      }
    }
  }
}

.draft-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;

  .draft-tab {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    padding: 18rpx 20rpx;
    border-radius: 16rpx;
    background: var(--bg-color-page);
    border: 1rpx solid var(--border-color-light);
    transition: all 0.2s ease;

    &.active {
      background: var(--bg-color-warm);
      border-color: var(--primary-color);
    }

    &:active {
      transform: scale(0.98);
    }

    .tab-label {
      font-size: 26rpx;
      color: var(--text-color-primary);
      font-weight: 500;
    }

    .tab-count {
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      border-radius: 16rpx;
      background: var(--primary-color);
      color: var(--text-color-inverse);
      font-size: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  }
}

// ==================== 模式切换器 ====================
.mode-switcher {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .mode-btn {
    display: flex;
    align-items: center;
    padding: 28rpx;
    background: var(--bg-color-page);
    border-radius: 20rpx;
    border: 3rpx solid transparent;
    transition: all 0.3s ease;

    &.is-active {
      background: var(--bg-color-warm);
      border-color: var(--primary-color);
      box-shadow: 0 4rpx 16rpx rgba(212, 165, 116, 0.15);

      .mode-icon {
        transform: scale(1.08);
      }
    }

    &:active {
      transform: scale(0.98);
    }

    .mode-icon {
      width: 88rpx;
      height: 88rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48rpx;
      margin-right: 24rpx;
      transition: transform 0.3s ease;
      flex-shrink: 0;

      &.market-icon {
        background: linear-gradient(135deg, var(--bg-color-warm) 0%, var(--primary-alpha-10) 100%);
      }

      &.share-icon {
        background: linear-gradient(135deg, var(--success-color-bg) 0%, var(--success-color-alpha-30) 100%);
      }
    }

    .mode-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6rpx;

      .mode-name {
        font-size: 32rpx;
        font-weight: 600;
        color: var(--text-color-primary);
      }

      .mode-desc {
        font-size: 24rpx;
        color: var(--text-color-tertiary);
      }
    }

    .mode-check {
      width: 56rpx;
      height: 56rpx;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .check-icon {
        font-size: 32rpx;
        color: var(--text-color-inverse);
        font-weight: bold;
      }
    }
  }
}

// ==================== 草稿预览 ====================
.draft-preview {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .draft-item {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: var(--bg-color-page);
    border-radius: 16rpx;
    transition: all 0.2s ease;

    &:active {
      background: var(--border-color-light);
      transform: scale(0.98);
    }

    .draft-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      margin-right: 20rpx;
      flex-shrink: 0;

      &.market {
        background: linear-gradient(135deg, var(--bg-color-warm) 0%, var(--primary-alpha-10) 100%);
      }

      &.share {
        background: linear-gradient(135deg, var(--success-color-bg) 0%, var(--success-color-alpha-30) 100%);
      }
    }

    .draft-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6rpx;
      overflow: hidden;

      .draft-title {
        font-size: 30rpx;
        color: var(--text-color-primary);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .draft-time {
        font-size: 24rpx;
        color: var(--text-color-tertiary);
      }
    }
  }

  .view-all {
    padding: 16rpx;
    text-align: center;

    .view-all-text {
      font-size: 28rpx;
      color: var(--primary-color);
      font-weight: 500;
    }
  }
}

// 空草稿状态
.empty-drafts {
  padding: 80rpx 0;
  text-align: center;

  .empty-icon {
    display: block;
    font-size: 88rpx;
    margin-bottom: 16rpx;
    opacity: 0.4;
  }

  .empty-text {
    display: block;
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }
}

// ==================== 抽屉底部 ====================
.drawer-footer {
  margin-top: auto;
  padding: 30rpx 40rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--bg-color-disabled);
  background: var(--bg-color-page);

  .footer-tip {
    display: block;
    font-size: 24rpx;
    color: var(--text-color-tertiary);
    text-align: center;
  }
}

// ==================== 动画 ====================
@keyframes badgePulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
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
