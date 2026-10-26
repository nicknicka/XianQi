<template>
  <view class="custom-tab-bar-spacer" />
  <view class="custom-tab-bar" :style="tabBarThemeStyle">
    <view class="tab-group tab-group-left">
      <view
        v-for="(item, index) in leftTabs"
        :key="item.pagePath"
        class="tab-item"
        :class="{ active: currentIndex === index }"
        :style="tabItemStyle(currentIndex === index)"
        @click="switchTab(index, item.pagePath)"
      >
        <view class="icon-wrapper">
          <view class="iconfont tab-icon" :class="item.iconClass" />
          <view v-if="item.badge" class="badge">
            {{ item.badge }}
          </view>
        </view>
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>

    <view class="publish-button" @tap.stop="showPublishModal">
      <view class="publish-button-shadow" />
      <view class="publish-button-core">
        <view class="publish-icon-wrapper">
          <text class="iconfont publish-icon">&#xe694;</text>
        </view>
      </view>
    </view>

    <view class="tab-group tab-group-right">
      <view
        v-for="(item, index) in rightTabs"
        :key="item.pagePath"
        class="tab-item"
        :class="{ active: currentIndex === index + 3 }"
        :style="tabItemStyle(currentIndex === index + 3)"
        @click="switchTab(index + 3, item.pagePath)"
      >
        <view class="icon-wrapper">
          <view class="iconfont tab-icon" :class="item.iconClass" />
          <view v-if="item.badge" class="badge">
            {{ item.badge }}
          </view>
        </view>
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { checkAuth } from '@/utils/auth'
import { themeManager } from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

// 使用模块级共享状态，所有 TabBar 实例共享同一个 currentIndex
const sharedState = reactive({ currentIndex: 0 })
const currentIndex = computed(() => sharedState.currentIndex)
const primaryColor = ref('#5DADE2')
const primaryColorLight = ref('#B8D8F2')
const tabBarInactiveColor = ref('#8A96A3')
const tabBarBgStart = ref('rgba(255, 255, 255, 0.98)')
const tabBarBgEnd = ref('rgba(244, 249, 255, 0.95)')
const tabBarBorderColor = ref('rgba(255, 255, 255, 0.78)')
const tabBarShadowColor = ref('rgba(93, 173, 226, 0.14)')

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) {
    return `rgba(93, 173, 226, ${alpha})`
  }

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function syncThemeColors() {
  const registration = themeManager.getCurrentRegistration()
  const seed = registration.light

  primaryColor.value = seed.primaryColor
  primaryColorLight.value = seed.primaryColorLight
  tabBarInactiveColor.value = '#8A96A3'
  tabBarBgStart.value = hexToRgba(seed.primaryColor, 0.08)
  tabBarBgEnd.value = 'rgba(255, 255, 255, 0.96)'
  tabBarBorderColor.value = hexToRgba(seed.primaryColor, 0.20)
  tabBarShadowColor.value = hexToRgba(seed.primaryColor, 0.18)
}

const tabBarThemeStyle = computed(() => ({
  '--tab-bar-selected-color': primaryColor.value,
  '--tab-bar-color': tabBarInactiveColor.value,
  '--tab-bar-background-start': tabBarBgStart.value,
  '--tab-bar-background-end': tabBarBgEnd.value,
  '--tab-bar-border-color': tabBarBorderColor.value,
  '--tab-bar-shadow-color': tabBarShadowColor.value,
  '--tab-bar-publish-start': primaryColor.value,
  '--tab-bar-publish-end': primaryColorLight.value,
  '--tab-bar-publish-shadow': hexToRgba(primaryColor.value, 0.34)
}))

let stopThemeListener: (() => void) | undefined

interface TabItem {
  text: string
  iconClass: string
  pagePath: string
  badge?: number | string
}

const leftTabs = ref<TabItem[]>([
  {
    text: '首页',
    iconClass: 'icon-shouye',
    pagePath: '/pages/index/index'
  },
  {
    text: '交易',
    iconClass: 'icon-jiaoyi',
    pagePath: '/pages/market/list'
  }
])

const rightTabs = ref<TabItem[]>([
  {
    text: '消息',
    iconClass: 'icon-message',
    pagePath: '/pages/message/index',
    badge: 0
  },
  {
    text: '我的',
    iconClass: 'icon-wode',
    pagePath: '/pages/mine/index'
  }
])

const routeTabIndexMap: Record<string, number> = {
  '/pages/index/index': 0,
  '/pages/market/list': 1,
  '/pages/publish/index': 2,
  '/pages/message/index': 3,
  '/pages/mine/index': 4
}

function tabItemStyle(isActive: boolean) {
  return {
    color: isActive
      ? 'var(--tab-bar-selected-color, #5DADE2)'
      : 'var(--tab-bar-color, #8A96A3)'
  }
}

function switchTab(index: number, path: string) {
  // 先同步路由状态，避免因子组件 onShow 未触发导致状态过期
  syncCurrentIndex()

  if (currentIndex.value === index) return

  if (path === '/pages/message/index') {
    const canEnter = checkAuth({
      showTip: true,
      tipText: '请先登录后查看消息',
      showAuthGuide: true,
      guideTitle: '登录后可查看消息',
      guideContent: '消息会话和通知需要登录后使用。'
    })

    if (!canEnter) {
      return
    }
  }

  uni.switchTab({
    url: path
  })
}

function showPublishModal(e: any) {
  if (e && e.stopPropagation) {
    e.stopPropagation()
  }
  if (e && e.preventDefault) {
    e.preventDefault()
  }

  const canEnter = checkAuth({
    showTip: true,
    tipText: '请先登录后发布内容',
    showAuthGuide: true,
    guideTitle: '登录后可发布内容',
    guideContent: '发布闲置或共享物品前，请先登录或注册账号。'
  })

  if (!canEnter) {
    return
  }

  uni.switchTab({
    url: '/pages/publish/index'
  })
}

function syncCurrentIndex() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentPath = '/' + currentPage.route
  const index = routeTabIndexMap[currentPath]
  if (index !== undefined) {
    sharedState.currentIndex = index
  }
}

onMounted(() => {
  syncThemeColors()
  stopThemeListener = themeManager.addListener(() => {
    syncThemeColors()
  })
  syncCurrentIndex()
})

// 页面每次显示时同步选中状态，解决切换回已访问 tab 时选中不更新的问题
onShow(() => {
  syncCurrentIndex()
})

onUnmounted(() => {
  if (stopThemeListener) {
    stopThemeListener()
    stopThemeListener = undefined
  }
})

function setBadge(index: number, badge: string | number) {
  if (index === 0 || index === 1) {
    leftTabs.value = leftTabs.value.map((item, tabIndex) => {
      if (tabIndex !== index) {
        return item
      }

      return {
        ...item,
        badge
      }
    })
    return
  }

  if (index === 3 || index === 4) {
    const rightIndex = index - 3
    rightTabs.value = rightTabs.value.map((item, tabIndex) => {
      if (tabIndex !== rightIndex) {
        return item
      }

      return {
        ...item,
        badge
      }
    })
  }
}

function setCurrentIndex(index: number) {
  sharedState.currentIndex = index
}

defineExpose({
  setBadge,
  $setBadge: setBadge,
  setCurrentIndex,
  $setCurrentIndex: setCurrentIndex
})
</script>

<style lang="scss" scoped>
.custom-tab-bar-spacer {
  /* 为悬浮 tabbar 预留滚动空间，避免底部内容被遮挡 */
  height: calc(156rpx + constant(safe-area-inset-bottom));
  height: calc(156rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.custom-tab-bar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 14rpx);
  min-height: 104rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--tab-bar-border-color);
  border-radius: 999rpx;
  background:
    linear-gradient(180deg, var(--tab-bar-background-start) 0%, var(--tab-bar-background-end) 100%);
  padding: 10rpx 16rpx 10rpx;
  z-index: 9999;
  box-shadow:
    0 20rpx 46rpx rgba(15, 23, 42, 0.14),
    0 6rpx 14rpx var(--tab-bar-shadow-color);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  overflow: visible;
  box-sizing: border-box;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 76rpx;
  position: relative;
  padding: 4rpx 0;
  transition: transform 0.22s ease, color 0.22s ease, opacity 0.22s ease;
  box-sizing: border-box;
}

.tab-item.active {
  font-weight: 600;
  transform: translateY(-3rpx);
}

.icon-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.tab-icon {
  width: 24px;
  height: 24px;
  font-size: 24px;
  line-height: 1;
  color: inherit;
  font-family: "iconfont" !important;
  font-style: normal;
}

.tab-text {
  font-size: 11px;
  line-height: 1;
  color: inherit;
  transition: color 0.22s ease;
}

.badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
  background: var(--danger-color, #ff4d4f);
  color: var(--text-color-inverse, #ffffff);
  font-size: 10px;
  text-align: center;
  border-radius: 50%;
  border: 2px solid var(--tab-bar-background, var(--bg-color-card));
  font-weight: 500;
  box-shadow: 0 2px 6px var(--danger-color-alpha-30, rgba(255, 77, 79, 0.4));
}

.publish-button {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -52%);
  width: 178rpx;
  height: 178rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  color: var(--tab-bar-selected-color, var(--primary-color));
}

.publish-button-shadow {
  position: absolute;
  inset: 24rpx 28rpx 34rpx;
  border-radius: 50%;
  background: var(--tab-bar-publish-shadow);
  filter: blur(20rpx);
  transform: translateY(18rpx);
}

.publish-button-core {
  position: relative;
  width: 134rpx;
  height: 134rpx;
  border-radius: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(247, 251, 255, 0.98) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 18rpx 36rpx rgba(15, 23, 42, 0.16),
    0 8rpx 16rpx rgba(142, 197, 232, 0.24);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.publish-icon-wrapper {
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tab-bar-publish-start) 0%, var(--tab-bar-publish-end) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 14rpx 24rpx var(--tab-bar-publish-shadow),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.55);
  border: 4rpx solid rgba(255, 255, 255, 0.98);
}

.publish-icon {
  font-size: 42px;
  line-height: 1;
  color: #ffffff;
  font-family: "iconfont" !important;
  font-style: normal;
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.tab-group {
  display: flex;
  align-items: center;
  height: 100%;
  min-height: 76rpx;
}

.tab-group-left {
  flex: 1;
  padding-right: 100rpx;
}

.tab-group-right {
  flex: 1;
  padding-left: 100rpx;
}

.tab-item:active {
  opacity: 0.82;
}

/* #ifdef H5 */
@media (min-width: 768px) {
  .custom-tab-bar {
    left: 50%;
    right: auto;
    width: min(calc(100vw - 48rpx), calc(430px - 48rpx));
    transform: translateX(-50%);
  }
}
/* #endif */
</style>
