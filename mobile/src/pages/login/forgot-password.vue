<template>
  <view class="forgot-page" :style="themeStyle">
    <!-- 导航栏 -->
    <view class="nav-gradient-wrapper">
      <CustomNavBar
        title="忘记密码"
        :show-back="true"
        :fixed="false"
        background-color="transparent"
        text-color="#fff"
      />
    </view>

    <!-- 顶部图标区域 -->
    <view class="forgot-header">
      <view class="header-icon">
        <text class="icon-emoji">🔐</text>
      </view>
      <text class="header-title">找回密码</text>
      <text class="header-desc">通过手机验证码重置你的密码</text>
    </view>

    <!-- 表单卡片 -->
    <view class="forgot-form">
      <!-- 步骤指示器 -->
      <view class="step-indicator">
        <view class="step-item" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
          <view class="step-dot">
            <text v-if="currentStep <= 1" class="step-num">1</text>
            <uni-icons v-else type="checkmarkempty" size="12" color="#fff"></uni-icons>
          </view>
          <text class="step-label">验证手机</text>
        </view>
        <view class="step-line" :class="{ active: currentStep > 1 }"></view>
        <view class="step-item" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
          <view class="step-dot">
            <text v-if="currentStep <= 2" class="step-num">2</text>
            <uni-icons v-else type="checkmarkempty" size="12" color="#fff"></uni-icons>
          </view>
          <text class="step-label">设置密码</text>
        </view>
        <view class="step-line" :class="{ active: currentStep > 2 }"></view>
        <view class="step-item" :class="{ active: currentStep >= 3 }">
          <view class="step-dot">
            <text class="step-num">3</text>
          </view>
          <text class="step-label">完成</text>
        </view>
      </view>

      <!-- 步骤1：验证手机号 -->
      <view v-if="currentStep === 1" class="form-container">
        <view class="form-title">验证你的手机号</view>
        <view class="form-item">
          <uni-icons type="phone" size="20" :color="primaryColor"></uni-icons>
          <input
            class="input"
            type="number"
            v-model="formData.phone"
            placeholder="请输入手机号"
            :placeholder-style="`color: ${placeholderColor}`"
            maxlength="11"
          />
        </view>
        <view class="form-item">
          <uni-icons type="chat" size="20" :color="primaryColor"></uni-icons>
          <input
            class="input code-input"
            type="number"
            v-model="formData.code"
            placeholder="请输入验证码"
            :placeholder-style="`color: ${placeholderColor}`"
            maxlength="6"
          />
          <button
            class="code-btn"
            :disabled="codeCountdown > 0"
            @click="sendCode"
          >
            {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
          </button>
        </view>
        <button class="submit-btn" @click="goToStep2">下一步</button>
      </view>

      <!-- 步骤2：设置新密码 -->
      <view v-if="currentStep === 2" class="form-container">
        <view class="form-title">设置新密码</view>
        <view class="form-item">
          <uni-icons type="locked" size="20" :color="primaryColor"></uni-icons>
          <input
            class="input"
            type="text"
            :password="!showPassword"
            v-model="formData.newPassword"
            placeholder="请输入新密码（6-20位）"
            :placeholder-style="`color: ${placeholderColor}`"
          />
          <uni-icons
            :type="showPassword ? 'eye' : 'eye-slash'"
            size="20"
            :color="primaryColor"
            @click="showPassword = !showPassword"
          ></uni-icons>
        </view>
        <view class="form-item">
          <uni-icons type="locked" size="20" :color="primaryColor"></uni-icons>
          <input
            class="input"
            type="text"
            :password="!showConfirmPassword"
            v-model="formData.confirmPassword"
            placeholder="请再次输入新密码"
            :placeholder-style="`color: ${placeholderColor}`"
          />
          <uni-icons
            :type="showConfirmPassword ? 'eye' : 'eye-slash'"
            size="20"
            :color="primaryColor"
            @click="showConfirmPassword = !showConfirmPassword"
          ></uni-icons>
        </view>

        <!-- 密码强度指示 -->
        <view v-if="formData.newPassword" class="password-strength">
          <view class="strength-bar">
            <view
              class="strength-fill"
              :style="{ width: passwordStrength.percent + '%', background: passwordStrength.color }"
            ></view>
          </view>
          <text class="strength-text" :style="{ color: passwordStrength.color }">
            {{ passwordStrength.label }}
          </text>
        </view>

        <button class="submit-btn" @click="handleResetPassword">确认重置</button>
        <view class="step-back" @click="currentStep = 1">
          <uni-icons type="left" size="14" :color="primaryColor"></uni-icons>
          <text class="step-back-text">返回上一步</text>
        </view>
      </view>

      <!-- 步骤3：完成 -->
      <view v-if="currentStep === 3" class="form-container success-container">
        <view class="success-icon">
          <text class="success-emoji">🎉</text>
        </view>
        <view class="success-title">密码重置成功</view>
        <view class="success-desc">你的密码已成功更新，现在可以使用新密码登录</view>
        <button class="submit-btn" @click="goToLogin">立即登录</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { userApi } from '@/api/user'
import validator from '@/utils/validator'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

const placeholderColor = 'rgba(0,0,0,0.25)'

const currentStep = ref(1)
const codeCountdown = ref(0)
const codeTimer = ref<ReturnType<typeof setInterval> | null>(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const formData = ref({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = formData.value.newPassword
  if (!pwd) return { percent: 0, color: '#ddd', label: '' }

  let score = 0
  if (pwd.length >= 6) score += 25
  if (pwd.length >= 10) score += 25
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25
  if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 25

  if (score <= 25) return { percent: 25, color: '#FF8A8A', label: '弱' }
  if (score <= 50) return { percent: 50, color: '#FFD666', label: '一般' }
  if (score <= 75) return { percent: 75, color: '#9DC4FF', label: '良好' }
  return { percent: 100, color: '#7ED4A6', label: '强' }
})

function startCountdown() {
  codeCountdown.value = 60
  if (codeTimer.value) {
    clearInterval(codeTimer.value)
  }
  codeTimer.value = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0 && codeTimer.value) {
      clearInterval(codeTimer.value)
      codeTimer.value = null
    }
  }, 1000)
}

function sendCode() {
  if (!validator.isPhoneNumber(formData.value.phone)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }

  userApi
    .sendVerifyCode(formData.value.phone, 'reset')
    .then(() => {
      uni.showToast({ title: '验证码已发送', icon: 'success' })
      startCountdown()
    })
    .catch(() => {
      uni.showToast({ title: '验证码发送失败', icon: 'none' })
    })
}

function goToStep2() {
  if (!validator.isPhoneNumber(formData.value.phone)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  if (!formData.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  currentStep.value = 2
}

function handleResetPassword() {
  if (!validator.isPassword(formData.value.newPassword)) {
    uni.showToast({ title: '密码长度需为6-20位', icon: 'none' })
    return
  }
  if (formData.value.newPassword !== formData.value.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }

  userApi
    .resetPassword({
      phone: formData.value.phone,
      code: formData.value.code,
      newPassword: formData.value.newPassword
    })
    .then(() => {
      currentStep.value = 3
    })
    .catch(() => {
      uni.showToast({ title: '重置失败，请稍后重试', icon: 'none' })
    })
}

function goToLogin() {
  // 需要返回登录页，使用 navigateBack 或 redirectTo 避免堆栈过深
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/login/index' })
  }
}

onUnload(() => {
  if (codeTimer.value) {
    clearInterval(codeTimer.value)
    codeTimer.value = null
  }
})
</script>

<style lang="scss" scoped>
.forgot-page {
  /* 与登录页一致的全屏 fixed 布局 */
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-gradient-wrapper {
  position: relative;
  z-index: 999;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  flex-shrink: 0;
}

/* 顶部图标区域 */
.forgot-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
  padding-top: 8rpx;
  flex-shrink: 0;

  .header-icon {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    margin-bottom: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10rpx);
    animation: fadeInDown 0.5s ease-out;

    .icon-emoji {
      font-size: 72rpx;
    }
  }

  .header-title {
    font-size: 36rpx;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 8rpx;
    animation: fadeInDown 0.5s ease-out 0.05s both;
  }

  .header-desc {
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.75);
    animation: fadeInDown 0.5s ease-out 0.1s both;
  }
}

/* 表单卡片 */
.forgot-form {
  background: var(--bg-color-card);
  border-radius: 32rpx;
  padding: 40rpx 48rpx;
  margin: 0 24rpx;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  /* Claymorphism 粘土拟态风格 */
  box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06), -4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  animation: fadeInDown 0.5s ease-out 0.1s both;

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;

    .step-dot {
      width: 44rpx;
      height: 44rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-disabled);
      border: 2rpx solid var(--border-color-light);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

      .step-num {
        font-size: 22rpx;
        font-weight: 700;
        color: var(--text-color-tertiary);
        transition: color 0.3s;
      }
    }

    .step-label {
      font-size: 22rpx;
      color: var(--text-color-tertiary);
      transition: color 0.3s;
    }

    &.active {
      .step-dot {
        background: var(--primary-color);
        border-color: var(--primary-color);
        box-shadow: 4rpx 4rpx 10rpx rgba(0, 0, 0, 0.08), -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.5);

        .step-num {
          color: #fff;
        }
      }

      .step-label {
        color: var(--primary-color);
        font-weight: 600;
      }
    }

    &.done {
      .step-dot {
        background: var(--success-color);
        border-color: var(--success-color);
        box-shadow: 4rpx 4rpx 10rpx rgba(0, 0, 0, 0.08), -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.5);
      }

      .step-label {
        color: var(--success-color);
      }
    }
  }

  .step-line {
    width: 80rpx;
    height: 4rpx;
    border-radius: 2rpx;
    background: var(--border-color-light);
    margin: 0 12rpx;
    margin-bottom: 28rpx;
    transition: background 0.4s;

    &.active {
      background: var(--success-color);
    }
  }
}

/* 表单容器 */
.form-container {
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-color-primary);
  text-align: center;
  margin-bottom: 36rpx;
  animation: fadeInDown 0.5s ease-out;
}

/* 表单项 - 与登录页完全一致 */
.form-item {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
  background: var(--bg-color-page);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  position: relative;
  animation: fadeInUp 0.5s ease-out forwards;
  animation-fill-mode: both;
  /* Claymorphism 内凹效果 */
  border: 2rpx solid transparent;
  box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04), inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);

  .input {
    flex: 1;
    height: 100%;
    margin: 0 16rpx;
    font-size: var(--font-size-base);

    &.code-input {
      flex: 1;
    }
  }

  .code-btn {
    padding: 0 24rpx;
    height: 60rpx;
    line-height: 60rpx;
    font-size: 24rpx;
    color: var(--primary-color);
    background: transparent;
    border: 1rpx solid var(--primary-color);
    border-radius: 8rpx;
    margin-left: 16rpx;
    transition: all 0.25s;

    &::after {
      border: none;
    }

    &:disabled {
      color: var(--text-color-tertiary);
      border-color: var(--text-color-tertiary);
    }
  }

  /* 交错入场动画 */
  &:nth-of-type(1) {
    animation-delay: 0.06s;
  }
  &:nth-of-type(2) {
    animation-delay: 0.12s;
  }
  &:nth-of-type(3) {
    animation-delay: 0.18s;
  }
  &:nth-of-type(4) {
    animation-delay: 0.24s;
  }
}

/* 密码强度指示器 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
  animation: fadeInUp 0.5s ease-out 0.24s both;

  .strength-bar {
    flex: 1;
    height: 8rpx;
    border-radius: 4rpx;
    background: var(--bg-color-disabled);
    overflow: hidden;
  }

  .strength-fill {
    height: 100%;
    border-radius: 4rpx;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .strength-text {
    font-size: 22rpx;
    font-weight: 600;
    min-width: 48rpx;
    text-align: right;
  }
}

/* 主按钮 - 与登录页一致 */
.submit-btn {
  width: 100%;
  height: 88rpx;
  background: var(--primary-color);
  color: var(--bg-color-card);
  font-size: var(--font-size-lg);
  border-radius: 9999px;
  border: none;
  margin-top: 24rpx;
  animation: fadeInUp 0.5s ease-out 0.3s forwards;
  animation-fill-mode: both;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
  /* Claymorphism 凸起效果 */
  box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.08), -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
  border: 2rpx solid rgba(255, 255, 255, 0.5);

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.95);
    opacity: 0.9;
  }
}

/* 返回上一步 */
.step-back {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;
  padding: 16rpx 0;
  animation: fadeInUp 0.5s ease-out 0.4s both;

  .step-back-text {
    font-size: var(--font-size-sm);
    color: var(--primary-color);
    margin-left: 4rpx;
  }

  &:active {
    opacity: 0.6;
  }
}

/* 成功页面 */
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40rpx;

  .success-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(126, 212, 166, 0.12);
    margin-bottom: 32rpx;
    animation: cuteBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

    .success-emoji {
      font-size: 80rpx;
    }
  }

  .success-title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-color-primary);
    margin-bottom: 12rpx;
    animation: fadeInDown 0.5s ease-out 0.15s both;
  }

  .success-desc {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    text-align: center;
    margin-bottom: 48rpx;
    animation: fadeInDown 0.5s ease-out 0.25s both;
  }
}

/* 动画关键帧 */
@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateX(60rpx);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInDown {
  0% {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cuteBounce {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
