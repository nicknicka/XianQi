<template>
  <view :class="['settings-page', animateClass]" :style="themeStyle">
    <!-- 个人信息 -->
    <view class="section section-animate" :class="{ 'section-visible': sectionStates[0] }">
      <view
        class="section-item item-animate"
        :class="{ 'item-visible': sectionStates[0] }"
        :style="{ '--item-index': 0 }"
        @click="goProfile"
        hover-class="item-hover"
      >
        <view class="item-left">
          <view class="icon-wrap icon-primary">
            <uni-icons type="person" size="20" :color="primaryColor" />
          </view>
          <text class="item-name">个人信息</text>
        </view>
        <uni-icons type="right" size="16" :color="hintColor" />
      </view>
      <view
        class="section-item item-animate"
        :class="{ 'item-visible': sectionStates[0] }"
        :style="{ '--item-index': 1 }"
        @click="goAccountSecurity"
        hover-class="item-hover"
      >
        <view class="item-left">
          <view class="icon-wrap icon-primary">
            <uni-icons type="locked" size="20" :color="primaryColor" />
          </view>
          <text class="item-name">账号安全</text>
          <text class="item-desc">密码、手机号、隐私设置</text>
        </view>
        <uni-icons type="right" size="16" :color="hintColor" />
      </view>
    </view>

    <!-- 消息通知 -->
    <view class="section section-animate" :class="{ 'section-visible': sectionStates[1] }">
      <view
        class="section-item item-animate"
        :class="{ 'item-visible': sectionStates[1] }"
        :style="{ '--item-index': 0 }"
        hover-class="item-hover"
      >
        <view class="item-left">
          <view class="icon-wrap icon-primary">
            <uni-icons type="notification" size="20" :color="primaryColor" />
          </view>
          <text class="item-name">消息通知</text>
        </view>
        <view class="switch-wrap switch-animate">
          <switch :checked="settings.messageEnabled" :color="primaryColor" @change="onMessageToggle" />
        </view>
      </view>
      <view
        class="section-item item-animate"
        :class="{ 'item-visible': sectionStates[1] }"
        :style="{ '--item-index': 1 }"
        hover-class="item-hover"
      >
        <view class="item-left">
          <view class="icon-wrap icon-primary">
            <uni-icons type="sound" size="20" :color="primaryColor" />
          </view>
          <text class="item-name">声音提醒</text>
        </view>
        <view class="switch-wrap switch-animate">
          <switch :checked="settings.soundEnabled" :color="primaryColor" @change="onSoundToggle" />
        </view>
      </view>
      <view
        class="section-item item-animate"
        :class="{ 'item-visible': sectionStates[1] }"
        :style="{ '--item-index': 2 }"
        hover-class="item-hover"
      >
        <view class="item-left">
          <view class="icon-wrap icon-primary">
            <uni-icons type="chat" size="20" :color="primaryColor" />
          </view>
          <text class="item-name">震动反馈</text>
        </view>
        <view class="switch-wrap switch-animate">
          <switch :checked="settings.vibrateEnabled" :color="primaryColor" @change="onVibrateToggle" />
        </view>
      </view>
    </view>

    <!-- 隐私设置提示 -->
    <view class="privacy-tip tip-animate" :class="{ 'tip-visible': sectionStates[2] }">
      <view class="tip-icon">
        <uni-icons type="info" size="14" :color="hintColor" />
      </view>
      <text class="tip-text">隐私设置(隐藏手机号等)已移至"账号安全"页面</text>
    </view>

    <!-- 主题设置 -->
    <view class="section section-animate" :class="{ 'section-visible': sectionStates[3] }">
      <view
        class="section-item item-animate"
        :class="{ 'item-visible': sectionStates[3] }"
        :style="{ '--item-index': 0 }"
        @click="goThemeSettings"
        hover-class="item-hover"
      >
        <view class="item-left">
          <view class="icon-wrap icon-primary">
            <uni-icons type="color" size="20" :color="accentColor" />
          </view>
          <text class="item-name">主题设置</text>
        </view>
        <view class="item-right">
          <text class="theme-name">{{ currentThemeName }}</text>
          <uni-icons type="right" size="16" :color="hintColor" />
        </view>
      </view>
      <view
        class="section-item item-animate"
        :class="{ 'item-visible': sectionStates[3] }"
        :style="{ '--item-index': 1 }"
        hover-class="item-hover"
      >
        <view class="item-left">
          <view class="icon-wrap icon-primary">
            <uni-icons type="eye-slash" size="20" :color="accentColor" />
          </view>
          <text class="item-name">深色模式</text>
        </view>
        <view class="switch-wrap switch-animate">
          <switch :checked="isDarkMode" :color="primaryColor" @change="onDarkModeToggle" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {themeManager, useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import storage from '@/utils/storage'
import { userApi } from '@/api/user'
import { onShow } from '@dcloudio/uni-app'

// 动画控制
const animateClass = ref('')

// 各区块动画状态
const sectionStates = ref([false, false, false, false])

const { primaryColor, accentColor } = useThemeColors()

// 箭头/提示图标颜色 - 跟随深色模式
const hintColor = computed(() => currentTheme.value.isDark ? '#888888' : '#AAAAAA')

const settings = ref({
  messageEnabled: true,
  soundEnabled: true,
  vibrateEnabled: true
})
const settingsLoading = ref(false)

// 主题相关 - 使用 ref 保存当前主题
const currentTheme = ref(themeManager.getTheme())
const { themeStyle } = useThemeStyle()

// 主题监听器
const removeThemeListener = themeManager.addListener(() => {
  currentTheme.value = themeManager.getTheme()
})

const currentThemeName = computed(() => {
  const names: Record<string, string> = {
    orange: '活力橙',
    blue: '天空蓝',
    green: '清新绿',
    purple: '优雅紫',
    red: '热情红',
    custom: '自定义'
  }
  return names[currentTheme.value.themeName] || '活力橙'
})

const isDarkMode = computed(() => currentTheme.value.isDark)

onShow(() => {
  useThemePage()
})


onMounted(() => {
  void loadSettings()
  // 触发页面整体进入动画
  setTimeout(() => {
    animateClass.value = 'animate-in'
  }, 50)

  // 依次触发各个区块的动画
  setTimeout(() => {
    sectionStates.value[0] = true // 个人信息区块
  }, 100)

  setTimeout(() => {
    sectionStates.value[1] = true // 消息通知区块
  }, 200)

  setTimeout(() => {
    sectionStates.value[2] = true // 提示信息
  }, 300)

  setTimeout(() => {
    sectionStates.value[3] = true // 主题设置区块
  }, 400)
})

onUnmounted(() => {
  // 清理主题监听器
  removeThemeListener?.()
})

async function loadSettings() {
  const savedSettings = storage.get('settings')
  if (savedSettings) {
    settings.value = { ...settings.value, ...savedSettings }
  }

  try {
    settingsLoading.value = true
    const res = await userApi.getNotificationSettings({ showError: false })
    const data = res?.data || {}
    settings.value = {
      messageEnabled: data.notificationEnabled ?? settings.value.messageEnabled,
      soundEnabled: data.soundEnabled ?? settings.value.soundEnabled,
      vibrateEnabled: data.vibrationEnabled ?? settings.value.vibrateEnabled
    }
    saveSettings()
  } catch (error) {
    console.warn('[settings] 加载通知设置失败，回退本地缓存:', error)
  } finally {
    settingsLoading.value = false
  }
}

function saveSettings() {
  storage.set('settings', settings.value)
}

async function persistSettings(previousSettings: typeof settings.value) {
  try {
    await userApi.updateNotificationSettings({
      notificationEnabled: settings.value.messageEnabled,
      soundEnabled: settings.value.soundEnabled,
      vibrationEnabled: settings.value.vibrateEnabled
    }, { showError: false })
    saveSettings()
  } catch (error) {
    settings.value = { ...previousSettings }
    saveSettings()
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  }
}

async function onMessageToggle(e: any) {
  const previousSettings = { ...settings.value }
  settings.value.messageEnabled = e.detail.value
  saveSettings()
  if (!settingsLoading.value) {
    await persistSettings(previousSettings)
  }
}

async function onSoundToggle(e: any) {
  const previousSettings = { ...settings.value }
  settings.value.soundEnabled = e.detail.value
  saveSettings()
  if (!settingsLoading.value) {
    await persistSettings(previousSettings)
  }
}

async function onVibrateToggle(e: any) {
  const previousSettings = { ...settings.value }
  settings.value.vibrateEnabled = e.detail.value
  saveSettings()
  if (!settingsLoading.value) {
    await persistSettings(previousSettings)
  }
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/mine/profile'
  })
}

function goAccountSecurity() {
  uni.navigateTo({
    url: '/pages/mine/security'
  })
}

function goThemeSettings() {
  uni.navigateTo({
    url: '/pages/mine/theme-settings'
  })
}

function onDarkModeToggle(e: any) {
  if (e.detail.value !== currentTheme.value.isDark) {
    themeManager.toggleDarkMode()
  }
}
</script>

<style lang="scss" scoped>
/* ========== 页面整体入场动画 ========== */
.settings-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding: 16rpx 0;
  opacity: 0;
  transform: translateX(20rpx);

  &.animate-in {
    animation: pageSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
}

@keyframes pageSlideIn {
  0% {
    opacity: 0;
    transform: translateX(30rpx) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* ========== 区块入场动画 ========== */
.section {
  background: var(--bg-color-card);
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &.section-animate {
    opacity: 0;
    transform: translateY(30rpx);

    &.section-visible {
      animation: sectionSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  }
}

@keyframes sectionSlideIn {
  0% {
    opacity: 0;
    transform: translateY(30rpx) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ========== 列表项交错入场动画 ========== */
.section-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-bottom: 1px solid var(--border-color-light);
  position: relative;

  &:last-child {
    border-bottom: none;
  }

  &.item-animate {
    opacity: 0;
    transform: translateX(-30rpx);

    &.item-visible {
      animation: itemSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      animation-delay: calc(var(--item-index) * 0.08s);
    }
  }

  &.item-hover {
    background: linear-gradient(90deg, var(--bg-color-hover) 0%, transparent 100%);
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;

    .item-name {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      font-weight: 500;
    }

    .item-desc {
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
      margin-left: 8rpx;
    }
  }

  .item-right {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .theme-name {
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
    }
  }
}

@keyframes itemSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-30rpx);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ========== 图标容器动画 ========== */
.icon-wrap {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14rpx;

  &.icon-primary {
    background: var(--primary-color-faded);
  }
}

.section-item.item-visible .icon-wrap {
  animation: iconPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--item-index) * 0.1s + 0.1s);
}

@keyframes iconPopIn {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-45deg);
  }
  60% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* ========== 开关按钮动画 ========== */
.switch-wrap {
  opacity: 0;
}

.section-item.item-visible .switch-wrap {
  animation: switchSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: calc(var(--item-index) * 0.1s + 0.2s);
}

@keyframes switchSlideIn {
  0% {
    opacity: 0;
    transform: translateX(20rpx) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* ========== 提示信息动画 ========== */
.privacy-tip {
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;

  &.tip-animate {
    opacity: 0;
    transform: translateY(-15rpx);

    &.tip-visible {
      animation: tipSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  }

  .tip-icon {
    animation: tipIconPulse 2s ease-in-out infinite;
  }

  @keyframes tipIconPulse {
    0%, 100% {
      opacity: 0.6;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .tip-text {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

@keyframes tipSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-15rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 箭头图标动画 ========== */
.section-item {
  .uni-icons {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:active {
    .uni-icons[type="right"] {
      transform: translateX(6rpx);
    }
  }
}

/* ========== 主题名称渐变动画 ========== */
.theme-name {
  background: linear-gradient(
    90deg,
    var(--text-color-tertiary) 0%,
    var(--text-color-primary) 50%,
    var(--text-color-tertiary) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: themeShine 3s linear infinite;
}

@keyframes themeShine {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* ========== 列表项点击反馈动画 ========== */
.section-item {
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0.05) 0%, transparent 70%);
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.4s ease-out;
    pointer-events: none;
  }

  &:active::after {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
