<template>
  <view class="set-pay-password-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="设置支付密码"
      :show-back="true"
      background-color="var(--bg-color-card)"
      text-color="var(--text-color-primary)"
    />

    <!-- 内容区域 -->
    <view class="content">
      <!-- 说明信息 -->
      <view class="info-card">
        <uni-icons type="wallet" size="20" :color="primaryColor" />
        <view class="info-content">
          <text class="info-title">为什么要设置支付密码？</text>
          <text class="info-desc">支付密码用于交易、提现等资金操作的验证，保障您的资金安全</text>
        </view>
      </view>

      <!-- 表单 -->
      <view class="form">
        <view class="form-item">
          <view class="item-label">手机号</view>
          <view class="phone-display">
            <text class="phone-text">{{ maskedPhone }}</text>
          </view>
        </view>

        <view class="form-item">
          <view class="item-label">验证码</view>
          <view class="item-input-wrap">
            <input
              class="item-input code-input"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              v-model="formData.code"
            />
            <button
              class="code-btn"
              :class="{ disabled: !canSendCode }"
              :disabled="!canSendCode"
              @click="sendCode"
            >
              {{ codeBtnText }}
            </button>
          </view>
        </view>

        <view class="form-item">
          <view class="item-label">支付密码</view>
          <view class="item-input-wrap">
            <input
              class="item-input"
              type="number"
              maxlength="6"
              placeholder="请输入6位数字支付密码"
              v-model="formData.password"
            />
          </view>
          <view class="input-hint">6位纯数字，请勿与银行卡密码相同</view>
        </view>

        <view class="form-item">
          <view class="item-label">确认支付密码</view>
          <view class="item-input-wrap">
            <input
              class="item-input"
              type="number"
              maxlength="6"
              placeholder="请再次输入支付密码"
              v-model="formData.confirmPassword"
            />
          </view>
          <!-- 密码匹配提示 -->
          <view class="match-tip" v-if="formData.confirmPassword">
            <uni-icons
              :type="isPasswordMatch ? 'checkmarkempty' : 'closeempty'"
              size="14"
              :color="isPasswordMatch ? '#4CAF50' : '#F44336'"
            />
            <text
              class="match-text"
              :class="{ match: isPasswordMatch }"
            >
              {{ isPasswordMatch ? '密码一致' : '密码不一致' }}
            </text>
          </view>
        </view>

        <button
          class="submit-btn"
          :class="{ active: canSubmit }"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          完成设置
        </button>
      </view>

      <!-- 安全提示 -->
      <view class="security-tips">
        <view class="tips-title">
          <uni-icons type="info-filled" size="14" color="#AAAAAA" />
          <text class="title-text">安全提示</text>
        </view>
        <view class="tips-list">
          <view class="tip-item">
            <text class="dot">•</text>
            <text class="tip-text">支付密码为6位数字，请勿使用连续或重复数字</text>
          </view>
          <view class="tip-item">
            <text class="dot">•</text>
            <text class="tip-text">请勿将支付密码告知他人或写在明显处</text>
          </view>
          <view class="tip-item">
            <text class="dot">•</text>
            <text class="tip-text">定期更换支付密码，保障账户安全</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import { useThemeColors, useThemePage, useThemeStyle } from '@/utils/theme'

const { primaryColor } = useThemeColors()
const { themeStyle } = useThemeStyle()
const userStore = useUserStore()

onShow(() => {
  useThemePage()
})

// 用户手机号
const userPhone = computed(() => {
  return (userStore.userInfo as any)?.phone || ''
})

const maskedPhone = computed(() => {
  if (!userPhone.value) return '未绑定手机号'
  return userPhone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

// 表单数据
const formData = ref({
  phone: userPhone.value,
  code: '',
  password: '',
  confirmPassword: ''
})

// 验证码倒计时
const countdown = ref(0)
const codeBtnText = computed(() => {
  return countdown.value > 0 ? `${countdown.value}s后重新获取` : '获取验证码'
})

const canSendCode = computed(() => {
  return userPhone.value && countdown.value === 0
})

// 密码匹配检查
const isPasswordMatch = computed(() => {
  return formData.value.password === formData.value.confirmPassword &&
    formData.value.password.length === 6
})

// 密码格式验证（检查是否为弱密码）
const isWeakPassword = computed(() => {
  const password = formData.value.password
  if (password.length !== 6) return false

  // 连续数字：123456, 234567, 345678, 456789, 012345
  if (/^(?:012345|123456|234567|345678|456789|543210|654321|765432|876543|987654)$/.test(password)) {
    return true
  }

  // 重复数字：111111, 222222, etc.
  if (/^(\d)\1{5}$/.test(password)) {
    return true
  }

  return false
})

// 提交按钮状态
const canSubmit = computed(() => {
  return formData.value.code.length === 6 &&
    formData.value.password.length === 6 &&
    isPasswordMatch.value &&
    !isWeakPassword.value
})

// 发送验证码
async function sendCode() {
  if (!canSendCode.value) {
    return
  }

  try {
    await userApi.sendVerifyCode(userPhone.value, 'login')
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    })

    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none'
    })
  }
}

// 提交设置
async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  if (isWeakPassword.value) {
    uni.showToast({
      title: '密码过于简单，请重新设置',
      icon: 'none'
    })
    return
  }

  try {
    await userApi.setPayPassword({
      password: formData.value.password,
      phone: formData.value.phone,
      code: formData.value.code
    })

    uni.showToast({
      title: '设置成功',
      icon: 'success'
    })

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.set-pay-password-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
}

/* 内容区域 */
.content {
  flex: 1;
  padding: 24rpx;
}

/* 说明卡片 */
.info-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.info-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #388E3C;
}

.info-desc {
  font-size: 22rpx;
  color: #388E3C;
  opacity: 0.9;
  line-height: 1.5;
}

/* 表单 */
.form {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 0 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  padding: 32rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-of-type {
    border-bottom: none;
  }
}

.item-label {
  font-size: 28rpx;
  color: var(--text-color-primary);
  font-weight: 500;
  margin-bottom: 20rpx;
}

.phone-display {
  padding: 16rpx 0;
}

.phone-text {
  font-size: 32rpx;
  color: #667eea;
  font-weight: 600;
}

.item-input-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.item-input {
  flex: 1;
  font-size: 32rpx;
  color: var(--text-color-primary);
  height: 48rpx;
  line-height: 48rpx;

  &::placeholder {
    color: #C0C0C0;
  }
}

.code-input {
  flex: 1;
}

.code-btn {
  padding: 0 24rpx;
  height: 56rpx;
  line-height: 56rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  border-radius: 28rpx;
  font-size: 24rpx;
  color: #fff;
  border: none;
  transition: all 0.3s;

  &::after {
    border: none;
  }

  &.disabled {
    background: var(--bg-color-disabled);
    color: var(--text-color-tertiary);
  }

  &:active:not(.disabled) {
    transform: scale(0.95);
    opacity: 0.9;
  }
}

.input-hint {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--text-color-tertiary);
}

/* 密码匹配提示 */
.match-tip {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.match-text {
  font-size: 22rpx;
  color: #F44336;

  &.match {
    color: var(--success-color);
  }
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, var(--bg-color-disabled) 0%, var(--bg-color-disabled) 100%);
  border-radius: 44rpx;
  font-size: 32rpx;
  color: var(--text-color-tertiary);
  font-weight: 600;
  border: none;
  margin-top: 48rpx;
  margin-bottom: 32rpx;
  transition: all 0.3s;

  &::after {
    border: none;
  }

  &.active {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
    color: #fff;
    box-shadow: 0 8rpx 24rpx var(--info-color-alpha-40);
  }

  &:active.active {
    transform: scale(0.98);
  }
}

/* 安全提示 */
.security-tips {
  margin-top: 32rpx;
  padding: 24rpx;
  background: var(--bg-color-disabled);
  border-radius: 16rpx;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.title-text {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.dot {
  font-size: 20rpx;
  color: var(--text-color-tertiary);
  line-height: 1;
}

.tip-text {
  flex: 1;
  font-size: 22rpx;
  color: var(--text-color-tertiary);
  line-height: 1.6;
}
</style>
