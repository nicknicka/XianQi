<template>
  <view class="publish-center" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="发布中心"
      background-color="transparent"
      text-color="#333333"
    />
    <!-- 顶部内容 -->
    <view class="header" :class="{ 'animate-in': isAnimated }">
      <text class="subtitle">选择你要发布的内容类型</text>
    </view>

    <!-- 主内容区域 -->
    <view class="content">
      <!-- 发布商品卡片 -->
      <view class="option-card market" :class="{ 'animate-in': isAnimated }" @tap="goToMarketPublish">
        <view class="card-icon">
          <uni-icons type="star" size="36" :color="primaryColor"></uni-icons>
        </view>
        <text class="card-title">发布闲置</text>
        <text class="card-desc">二手物品交易</text>
        <view class="card-features">
          <view class="feature"><uni-icons type="checkmarkempty" size="10" color="#AAAAAA"></uni-icons><text>快速出售</text></view>
          <view class="feature"><uni-icons type="checkmarkempty" size="10" color="#AAAAAA"></uni-icons><text>在线交易</text></view>
        </view>
      </view>

      <!-- 发布共享卡片 -->
      <view class="option-card share" :class="{ 'animate-in': isAnimated }" @tap="goToSharePublish">
        <view class="card-icon">
          <uni-icons type="refresh" size="36" :color="successColor"></uni-icons>
        </view>
        <text class="card-title">共享闲置</text>
        <text class="card-desc">物品共享借用</text>
        <view class="card-features">
          <view class="feature"><uni-icons type="checkmarkempty" size="10" color="#AAAAAA"></uni-icons><text>资源共享</text></view>
          <view class="feature"><uni-icons type="checkmarkempty" size="10" color="#AAAAAA"></uni-icons><text>环保节约</text></view>
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer" :class="{ 'animate-in': isAnimated }">
      <view class="footer-text"><uni-icons type="info" size="12" color="#AAAAAA"></uni-icons><text>发布前请确保信息真实准确</text></view>
    </view>

	<CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useThemePage, useThemeStyle, useThemeColors } from '@/utils/theme'
import { useUserStore } from '@/store/user'
import { getSystemInfo } from '@/utils/system-info'
import { checkAuth } from '@/utils/auth'
import CustomTabBar from '@/custom-tab-bar/index.vue'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()
const { primaryColor, successColor } = useThemeColors()
const isAnimated = ref(false)

// 获取系统状态栏高度（使用新API替代已弃用的 getSystemInfoSync）
const systemInfo = getSystemInfo()
const statusBarHeight = ref(systemInfo.statusBarHeight || 0)

// 计算状态栏高度的rpx值
const screenWidth = systemInfo.screenWidth || 375
const statusBarHeightRpx = computed(() => {
  return (statusBarHeight.value / screenWidth) * 750
})

onShow(() => {
  useThemePage()
})

onShow(() => {
  useThemePage()
})

onMounted(() => {
  console.log('[PublishCenter] 发布中心页面加载')

  if (!checkPublishAuth()) {
    return
  }

  // 触发进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

function checkPublishAuth() {
  return checkAuth({
    showTip: true,
    tipText: '请先登录后再发布',
    showAuthGuide: true,
    guideTitle: '登录后可发布内容',
    guideContent: '发布闲置或共享物品前，请先登录或注册账号。'
  })
}

// 发布商品
function goToMarketPublish() {
  if (!checkPublishAuth()) {
    return
  }

  uni.navigateTo({
    url: '/pages/market/publish?from=selector',
    fail: (err) => {
      console.error('[PublishCenter] 跳转失败:', err)
      uni.showToast({
        title: '跳转失败，请重试',
        icon: 'none'
      })
    }
  })
}

// 发布共享
function goToSharePublish() {
  if (!checkPublishAuth()) {
    return
  }

  uni.navigateTo({
    url: '/pages/share/publish?from=selector',
    fail: (err) => {
      console.error('[PublishCenter] 跳转失败:', err)
      uni.showToast({
        title: '跳转失败，请重试',
        icon: 'none'
      })
    }
  })
}
</script>

<style lang="scss" scoped>
.publish-center {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, var(--bg-color-page) 0%, var(--bg-color-card) 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

/* #ifdef H5 */
@media (min-width: 768px) {
  .publish-center {
    left: 50%;
    right: auto;
    width: min(100vw, 430px);
    transform: translateX(-50%);
  }
}
/* #endif */

// 进入动画关键帧
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 顶部
.header {
  padding-right: 40rpx;
  padding-bottom: 20rpx;
  padding-left: 40rpx;
  text-align: center;
  flex-shrink: 0;
  opacity: 0;
  transform: translateY(40rpx);
  box-sizing: border-box;

  &.animate-in {
    animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .subtitle {
    display: block;
    font-size: 24rpx;
    color: var(--text-color-tertiary);
  }
}

// 内容区域
.content {
  flex: 1;
  padding: 20rpx 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  overflow-y: auto;
  min-height: 0;
}

// 选项卡片
.option-card {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 34rpx 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  min-height: 0;
  max-width: 500rpx;
  width: 100%;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(40rpx);

  &.animate-in {
    animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  &:nth-of-type(1).animate-in {
    animation-delay: 0.1s;
  }

  &:nth-of-type(2).animate-in {
    animation-delay: 0.2s;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5rpx;
  }

  &.market::before {
    background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
  }

  &.share::before {
    background: linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  }

  .card-icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10rpx;
    flex-shrink: 0;
  }

  .card-title {
    font-size: 28rpx;
    font-weight: bold;
    color: var(--text-color-primary);
    margin-bottom: 4rpx;
    flex-shrink: 0;
  }

  .card-desc {
    font-size: 22rpx;
    color: var(--text-color-tertiary);
    margin-bottom: 12rpx;
    flex-shrink: 0;
  }

  .card-features {
    display: flex;
    gap: 12rpx;
    flex-shrink: 0;

    .feature {
      font-size: 20rpx;
      color: var(--text-color-secondary);
      background: #f8f8f8;
      padding: 4rpx 10rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      gap: 4rpx;
      white-space: nowrap;

      text {
        line-height: 1;
      }
    }
  }
}

// 底部
.footer {
  padding: 20rpx 40rpx;
  text-align: center;
  flex-shrink: 0;
  opacity: 0;
  transform: translateY(40rpx);

  &.animate-in {
    animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.3s;
  }

  .footer-text {
    font-size: 20rpx;
    color: var(--text-color-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;

    text {
      line-height: 1;
    }
  }
}
</style>
