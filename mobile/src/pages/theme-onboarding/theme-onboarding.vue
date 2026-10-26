<template>
  <view class="theme-onboarding-page">
    <!-- 顶部装饰 -->
    <view class="decoration-top">
      <view class="decoration-circle circle-1"></view>
      <view class="decoration-circle circle-2"></view>
      <view class="decoration-circle circle-3"></view>
    </view>

    <!-- 欢迎内容 -->
    <view class="content">
      <view class="welcome-section">
        <view class="logo">
          <text class="logo-text">🎨</text>
        </view>
        <text class="title">选择你的专属主题</text>
        <text class="subtitle">为你的校园生活定制专属色彩</text>
      </view>

      <!-- 主题选择 -->
      <view class="theme-selection">
        <view class="theme-grid">
          <view
            v-for="theme in availableThemes"
            :key="theme.id"
            :class="['theme-card', { selected: selectedThemeId === theme.id }]"
            @click="selectTheme(theme.id)"
          >
            <!-- 颜色预览 -->
            <view class="theme-preview">
              <view class="preview-colors">
                <view class="color-bar" :style="{ background: theme.colors.primaryColor }"></view>
                <view class="color-bar" :style="{ background: theme.colors.secondaryColor }"></view>
                <view class="color-bar" :style="{ background: theme.colors.accentColor }"></view>
                <view class="color-bar" :style="{ background: theme.colors.backgroundColor }"></view>
              </view>
              <view class="preview-elements">
                <view class="preview-button" :style="{ background: theme.colors.primaryColor }"></view>
                <view class="preview-text" :style="{ color: theme.colors.textPrimary }">文字</view>
              </view>
            </view>

            <!-- 主题信息 -->
            <view class="theme-info">
              <text class="theme-emoji">{{ theme.emoji }}</text>
              <text class="theme-name">{{ theme.name }}</text>
              <text class="theme-desc">{{ theme.description }}</text>
            </view>

            <!-- 选中标识 -->
            <view v-if="selectedThemeId === theme.id" class="selection-indicator">
              <text class="check-icon">✓</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 确认按钮 -->
      <view class="action-section">
        <button
          class="confirm-btn"
          :disabled="!selectedThemeId"
          @click="confirmTheme"
        >
          {{ selectedThemeId ? '开始使用' : '请选择一个主题' }}
        </button>
        <text class="hint">选择后可以在设置中随时更改</text>
      </view>
    </view>

    <!-- 底部装饰 -->
    <view class="decoration-bottom">
      <view class="decoration-circle circle-4"></view>
      <view class="decoration-circle circle-5"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReactiveUserPreferences } from '@/utils/user-preferences'
import { themeManager } from '@/utils/theme'
import type { UserStylePreferences } from '@/utils/user-preferences'

const selectedThemeId = ref<string>('')
const { updatePreferences } = useReactiveUserPreferences()

// 预设主题选项
const availableThemes = ref([
  {
    id: 'caramel-cocoa',
    name: '焦糖可可',
    description: '温暖治愈系',
    emoji: '🍫',
    colors: {
      primaryColor: '#D4A574',
      primaryColorLight: '#E8C4A0',
      primaryColorDark: '#B8885A',
      secondaryColor: '#E8C4A0',
      accentColor: '#FF8C69',
      backgroundColor: '#FFF8F0',
      successColor: '#7ED4A6',
      warningColor: '#FFD666',
      dangerColor: '#FF8A8A',
      infoColor: '#9DC4FF',
      textPrimary: '#2D2D2D',
      textSecondary: '#7A7A7A',
      textTertiary: '#AAAAAA'
    }
  },
  {
    id: 'mint-forest',
    name: '薄荷森林',
    description: '清新自然风',
    emoji: '🌿',
    colors: {
      primaryColor: '#7ED4A6',
      primaryColorLight: '#A8E4C4',
      primaryColorDark: '#5CB888',
      secondaryColor: '#B8E6D0',
      accentColor: '#FFD93D',
      backgroundColor: '#F0FFF5',
      successColor: '#7ED4A6',
      warningColor: '#FFD666',
      dangerColor: '#FF8A8A',
      infoColor: '#9DC4FF',
      textPrimary: '#2D2D2D',
      textSecondary: '#7A7A7A',
      textTertiary: '#AAAAAA'
    }
  },
  {
    id: 'peach-milk',
    name: '蜜桃奶芙',
    description: '粉嫩少女心',
    emoji: '🍑',
    colors: {
      primaryColor: '#FFB6C1',
      primaryColorLight: '#FFD1DC',
      primaryColorDark: '#E89AA5',
      secondaryColor: '#B8E6D0',
      accentColor: '#FFD700',
      backgroundColor: '#FFF0F3',
      successColor: '#7ED4A6',
      warningColor: '#FFD666',
      dangerColor: '#FF8A8A',
      infoColor: '#9DC4FF',
      textPrimary: '#2D2D2D',
      textSecondary: '#7A7A7A',
      textTertiary: '#AAAAAA'
    }
  },
  {
    id: 'ocean-breeze',
    name: '海洋微风',
    description: '清凉舒爽系',
    emoji: '🌊',
    colors: {
      primaryColor: '#8EC5E8',
      primaryColorLight: '#B8D4E8',
      primaryColorDark: '#6AA8CC',
      secondaryColor: '#B8D4E8',
      accentColor: '#FFD93D',
      backgroundColor: '#F0F8FF',
      successColor: '#7ED4A6',
      warningColor: '#FFD666',
      dangerColor: '#FF8A8A',
      infoColor: '#9DC4FF',
      textPrimary: '#2D2D2D',
      textSecondary: '#7A7A7A',
      textTertiary: '#AAAAAA'
    }
  },
  {
    id: 'sunset-glow',
    name: '夕阳余晖',
    description: '温暖浪漫风',
    emoji: '🌅',
    colors: {
      primaryColor: '#FF8A65',
      primaryColorLight: '#FFAB91',
      primaryColorDark: '#E64A19',
      secondaryColor: '#FFCCBC',
      accentColor: '#FFD54F',
      backgroundColor: '#FFF3E0',
      successColor: '#7ED4A6',
      warningColor: '#FFD666',
      dangerColor: '#FF8A8A',
      infoColor: '#9DC4FF',
      textPrimary: '#2D2D2D',
      textSecondary: '#7A7A7A',
      textTertiary: '#AAAAAA'
    }
  },
  {
    id: 'lavender-dream',
    name: '薰衣草梦',
    description: '梦幻紫色调',
    emoji: '💜',
    colors: {
      primaryColor: '#CE93D8',
      primaryColorLight: '#E1BEE7',
      primaryColorDark: '#BA68C8',
      secondaryColor: '#F3E5F5',
      accentColor: '#FFD93D',
      backgroundColor: '#F8F5FF',
      successColor: '#7ED4A6',
      warningColor: '#FFD666',
      dangerColor: '#FF8A8A',
      infoColor: '#9DC4FF',
      textPrimary: '#2D2D2D',
      textSecondary: '#7A7A7A',
      textTertiary: '#AAAAAA'
    }
  }
])

onMounted(() => {
  // 默认选中第一个主题
  selectedThemeId.value = availableThemes.value[0].id
})

function selectTheme(themeId: string) {
  selectedThemeId.value = themeId
}

function confirmTheme() {
  if (!selectedThemeId.value) return

  const selectedTheme = availableThemes.value.find(t => t.id === selectedThemeId.value)
  if (!selectedTheme) return

  // 保存用户选择的主题配置
  const themeConfig: UserStylePreferences = {
    primaryColor: selectedTheme.colors.primaryColor,
    primaryColorLight: selectedTheme.colors.primaryColorLight,
    primaryColorDark: selectedTheme.colors.primaryColorDark,
    secondaryColor: selectedTheme.colors.secondaryColor,
    accentColor: selectedTheme.colors.accentColor,
    backgroundColor: selectedTheme.colors.backgroundColor,
    successColor: selectedTheme.colors.successColor,
    warningColor: selectedTheme.colors.warningColor,
    dangerColor: selectedTheme.colors.dangerColor,
    infoColor: selectedTheme.colors.infoColor,
    textPrimary: selectedTheme.colors.textPrimary,
    textSecondary: selectedTheme.colors.textSecondary,
    textTertiary: selectedTheme.colors.textTertiary,
    bgPage: selectedTheme.colors.backgroundColor,
    bgCard: '#FFFFFF',
    bgWarm: selectedTheme.colors.backgroundColor,
    bgDisabled: '#F5F5F5',
    borderLight: '#F0F0F0',
    borderBase: '#E8E8E8',
    borderDark: '#BFBFBF'
  }

  // 更新用户偏好设置
  updatePreferences(themeConfig)

  // 切换到选中预设并应用主题
  themeManager.switchPreset(selectedThemeId.value as any)

  // 标记为已配置主题
  uni.setStorageSync('theme_configured', true)

  // 跳转到首页
  uni.switchTab({
    url: '/pages/index/index'
  })

  uni.showToast({
    title: `已选择 ${selectedTheme.name} 主题`,
    icon: 'success'
  })
}
</script>

<style lang="scss" scoped>
.theme-onboarding-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ============ 装饰元素 ============ */

.decoration-top,
.decoration-bottom {
  position: absolute;
  width: 100%;
  height: 200rpx;
  pointer-events: none;
}

.decoration-top {
  top: 0;
}

.decoration-bottom {
  bottom: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 120rpx;
  height: 120rpx;
  top: 50rpx;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 80rpx;
  height: 80rpx;
  top: 100rpx;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 60rpx;
  height: 60rpx;
  top: 30rpx;
  left: 70%;
  animation-delay: 4s;
}

.circle-4 {
  width: 100rpx;
  height: 100rpx;
  bottom: 80rpx;
  left: 20%;
  animation-delay: 1s;
}

.circle-5 {
  width: 70rpx;
  height: 70rpx;
  bottom: 40rpx;
  right: 25%;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0rpx);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

/* ============ 主要内容 ============ */

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60rpx 40rpx;
  z-index: 1;
}

.welcome-section {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo {
  margin-bottom: 30rpx;
}

.logo-text {
  font-size: 80rpx;
  display: block;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16rpx;
  display: block;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
}

/* ============ 主题选择 ============ */

.theme-selection {
  flex: 1;
  margin-bottom: 60rpx;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
  max-width: 600rpx;
  margin: 0 auto;
}

.theme-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 30rpx;
  backdrop-filter: blur(10px);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;

  &.selected {
    border-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.2);
    transform: translateY(-8rpx);
  }

  &:active {
    transform: translateY(-4rpx) scale(0.98);
  }
}

.theme-preview {
  margin-bottom: 20rpx;
}

.preview-colors {
  display: flex;
  height: 60rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.color-bar {
  flex: 1;
}

.preview-elements {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-button {
  width: 60rpx;
  height: 30rpx;
  border-radius: 15rpx;
}

.preview-text {
  font-size: 24rpx;
  font-weight: 500;
}

.theme-info {
  text-align: center;
}

.theme-emoji {
  font-size: 40rpx;
  display: block;
  margin-bottom: 8rpx;
}

.theme-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #2D2D2D;
  display: block;
  margin-bottom: 4rpx;
}

.theme-desc {
  font-size: 24rpx;
  color: #7A7A7A;
  display: block;
}

.selection-indicator {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 50rpx;
  height: 50rpx;
  background: var(--success-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.check-icon {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: bold;
}

/* ============ 操作区域 ============ */

.action-section {
  text-align: center;
}

.confirm-btn {
  width: 400rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:not(:disabled):active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 20rpx;
  display: block;
}

/* ============ 响应式适配 ============ */

@media (max-width: 750rpx) {
  .theme-grid {
    grid-template-columns: 1fr;
    gap: 20rpx;
  }

  .content {
    padding: 40rpx 20rpx;
  }

  .title {
    font-size: 32rpx;
  }

  .subtitle {
    font-size: 26rpx;
  }
}
</style>