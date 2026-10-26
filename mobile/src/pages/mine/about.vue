<template>
  <view class="about-page page-animate service-redesign-page" :class="{ 'animate-in': isAnimated }">
    <!-- Logo 区域 -->
    <view class="logo-section">
      <view class="logo">🎓</view>
      <text class="app-name">闲七校园</text>
      <text class="app-slogan">你的校园生活助手</text>
    </view>

    <!-- 版本信息 -->
    <view class="version-section">
      <view class="version-item">
        <text class="label">当前版本</text>
        <text class="value">v1.0.0</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="section-list">
      <view class="section-item" @click="checkUpdate">
        <view class="item-left">
          <uni-icons type="loop" size="20" :color="primaryColor" />
          <text class="item-name">检查更新</text>
        </view>
        <uni-icons type="right" size="16" color="#AAAAAA" />
      </view>
      <view class="section-item" @click="goUserAgreement">
        <view class="item-left">
          <uni-icons type="document" size="20" :color="primaryColor" />
          <text class="item-name">用户协议</text>
        </view>
        <uni-icons type="right" size="16" color="#AAAAAA" />
      </view>
      <view class="section-item" @click="goPrivacyPolicy">
        <view class="item-left">
          <uni-icons type="locked" size="20" :color="primaryColor" />
          <text class="item-name">隐私政策</text>
        </view>
        <uni-icons type="right" size="16" color="#AAAAAA" />
      </view>
      <view class="section-item" @click="goFeedback">
        <view class="item-left">
          <uni-icons type="chatbubble" size="20" :color="primaryColor" />
          <text class="item-name">意见反馈</text>
        </view>
        <uni-icons type="right" size="16" color="#AAAAAA" />
      </view>
      <view class="section-item" @click="contactService">
        <view class="item-left">
          <uni-icons type="phone" size="20" :color="primaryColor" />
          <text class="item-name">联系客服</text>
        </view>
        <uni-icons type="right" size="16" color="#AAAAAA" />
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer-info">
      <text class="icp">ICP备案号：xxxxxx</text>
      <text class="copyright">© 2026 闲七校园 All Rights Reserved</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import {useThemeColors, useThemePage, useThemeStyle} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

// 页面进入动画状态
const isAnimated = ref(false)

// 触发页面进入动画

onShow(() => {
  useThemePage()
})

onMounted(() => {
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

function checkUpdate() {
  uni.showLoading({ title: '检查中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '已是最新版本', icon: 'success' })
  }, 1500)
}

function goUserAgreement() {
  uni.navigateTo({
    url: '/pages/common/agreement'
  })
}

function goPrivacyPolicy() {
  uni.navigateTo({
    url: '/pages/common/privacy'
  })
}

function goFeedback() {
  uni.navigateTo({
    url: '/pages/mine/feedback'
  })
}

function contactService() {
  uni.showModal({
    title: '联系客服',
    content: '客服电话：400-xxx-xxxx\n工作时间：9:00-18:00',
    showCancel: false
  })
}
</script>

<style lang="scss" scoped>
// 页面进入动画关键帧
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 页面动画样式
.page-animate {
  opacity: 0;
  transform: translateY(30rpx);

  &.animate-in {
    animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}

.about-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding-bottom: env(safe-area-inset-bottom);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0 48rpx;
  background: var(--bg-color-card);

  .logo {
    width: 160rpx;
    height: 160rpx;
    border-radius: 32rpx;
    margin-bottom: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80rpx;
    background: var(--primary-color-alpha-10);
  }

  .app-name {
    font-size: var(--font-size-xxl);
    font-weight: 600;
    color: var(--text-color-primary);
    margin-bottom: 12rpx;
  }

  .app-slogan {
    font-size: var(--font-size-base);
    color: var(--text-color-tertiary);
  }
}

.version-section {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  margin-top: 16rpx;
  padding: 0 24rpx;

  .version-item {
    display: flex;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
    }

    .value {
      font-size: var(--font-size-base);
      color: var(--text-color-tertiary);
    }
  }
}

.section-list {
  background: var(--bg-color-card);
  margin-top: 16rpx;

  .section-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 16rpx;

      .item-name {
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
      }
    }
  }
}

.footer-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx;

  .icp,
  .copyright {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
    margin-bottom: 8rpx;
  }
}
</style>
