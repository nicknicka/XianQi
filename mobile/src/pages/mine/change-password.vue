<template>
  <view class="change-password-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="修改登录密码"
      :show-back="true"
      background-color="var(--bg-color-card)"
      text-color="var(--text-color-primary)"
    />

    <!-- 内容区域 -->
    <view class="content">
      <!-- 安全提示 -->
      <view class="security-tip">
        <uni-icons type="locked" size="20" :color="primaryColor" />
        <view class="tip-content">
          <text class="tip-title">安全提示</text>
          <text class="tip-desc">为了您的账号安全，修改密码后需要重新登录</text>
        </view>
      </view>

      <!-- 表单 -->
      <view class="form">
        <view class="form-item">
          <view class="item-label">当前密码</view>
          <view class="item-input-wrap">
            <input
              class="item-input"
              :type="showOldPassword ? 'text' : 'password'"
              placeholder="请输入当前密码"
              v-model="formData.oldPassword"
              maxlength="20"
            />
            <view class="eye-btn" @click="showOldPassword = !showOldPassword">
              <uni-icons
                :type="showOldPassword ? 'eye' : 'eye-slash'"
                size="18"
                color="#C0C0C0"
              />
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="item-label">新密码</view>
          <view class="item-input-wrap">
            <input
              class="item-input"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="请输入新密码（8-20位，包含数字和字母）"
              v-model="formData.newPassword"
              maxlength="20"
              @input="onPasswordInput"
            />
            <view class="eye-btn" @click="showNewPassword = !showNewPassword">
              <uni-icons
                :type="showNewPassword ? 'eye' : 'eye-slash'"
                size="18"
                color="#C0C0C0"
              />
            </view>
          </view>
          <!-- 密码强度指示器 -->
          <view class="password-strength" v-if="formData.newPassword">
            <view class="strength-bar">
              <view
                class="strength-fill"
                :class="strengthClass"
                :style="{ width: strengthWidth }"
              ></view>
            </view>
            <text class="strength-text" :class="strengthClass">{{ strengthText }}</text>
          </view>
        </view>

        <view class="form-item">
          <view class="item-label">确认新密码</view>
          <view class="item-input-wrap">
            <input
              class="item-input"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入新密码"
              v-model="formData.confirmPassword"
              maxlength="20"
            />
            <view class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
              <uni-icons
                :type="showConfirmPassword ? 'eye' : 'eye-slash'"
                size="18"
                color="#C0C0C0"
              />
            </view>
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
          确认修改
        </button>
      </view>

      <!-- 忘记密码 -->
      <view class="forgot-password">
        <text class="link" @click="goForgotPassword">忘记密码？</text>
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

// 表单数据
const formData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码显示状态
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 密码强度计算
const passwordStrength = computed(() => {
  const password = formData.value.newPassword
  if (!password) return 0

  let strength = 0
  // 长度检查
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  // 包含数字
  if (/\d/.test(password)) strength += 1
  // 包含小写字母
  if (/[a-z]/.test(password)) strength += 1
  // 包含大写字母
  if (/[A-Z]/.test(password)) strength += 1
  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1

  return Math.min(5, strength)
})

const strengthClass = computed(() => {
  const level = passwordStrength.value
  if (level <= 2) return 'weak'
  if (level <= 3) return 'medium'
  return 'strong'
})

const strengthWidth = computed(() => {
  const level = passwordStrength.value
  return `${(level / 5) * 100}%`
})

const strengthText = computed(() => {
  const level = passwordStrength.value
  if (level <= 2) return '弱'
  if (level <= 3) return '中'
  return '强'
})

// 密码匹配检查
const isPasswordMatch = computed(() => {
  return formData.value.newPassword === formData.value.confirmPassword &&
    formData.value.newPassword.length > 0
})

// 提交按钮状态
const canSubmit = computed(() => {
  return formData.value.oldPassword.length >= 6 &&
    formData.value.newPassword.length >= 8 &&
    isPasswordMatch.value
})

// 密码输入处理
function onPasswordInput(e: any) {
  // 可以在这里添加密码格式验证
}

// 提交修改
async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  // 验证新密码格式
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/
  if (!passwordRegex.test(formData.value.newPassword)) {
    uni.showToast({
      title: '密码格式不正确',
      icon: 'none'
    })
    return
  }

  try {
    await userApi.changePassword({
      oldPassword: formData.value.oldPassword,
      newPassword: formData.value.newPassword
    })

    uni.showToast({
      title: '修改成功，请重新登录',
      icon: 'success',
      duration: 2000
    })

    // 延迟退出登录
    setTimeout(() => {
      userStore.logout()
    }, 2000)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '修改失败',
      icon: 'none'
    })
  }
}

// 忘记密码
function goForgotPassword() {
  uni.navigateTo({
    url: '/pages/login/forgot-password'
  })
}
</script>

<style lang="scss" scoped>
.change-password-page {
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

/* 安全提示 */
.security-tip {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.tip-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.tip-title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--primary-color);
}

.tip-desc {
  font-size: 22rpx;
  color: var(--primary-color);
  opacity: 0.9;
}

/* 表单 */
.form {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 21rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  padding: 32rpx 0;
  border-bottom: 1rpx solid var(--border-color-light);

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
    color: var(--text-color-placeholder);
  }
}

.eye-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:active {
    background: var(--bg-color-disabled);
  }
}

/* 密码强度指示器 */
.password-strength {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.strength-bar {
  flex: 1;
  height: 8rpx;
  background: var(--border-color-base);
  border-radius: 4rpx;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: all 0.3s;

  &.weak {
    background: linear-gradient(90deg, var(--danger-color) 0%, var(--danger-color-alpha-95) 100%);
  }

  &.medium {
    background: linear-gradient(90deg, var(--warning-color) 0%, #FFC107 100%);
  }

  &.strong {
    background: linear-gradient(90deg, var(--success-color) 0%, #8BC34A 100%);
  }
}

.strength-text {
  font-size: 22rpx;
  font-weight: 600;

  &.weak {
    color: var(--danger-color);
  }

  &.medium {
    color: var(--warning-color);
  }

  &.strong {
    color: var(--success-color);
  }
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
  color: var(--danger-color);

  &.match {
    color: var(--success-color);
  }
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #E0E0E0 0%, #E0E0E0 100%);
  border-radius: 44rpx;
  font-size: 32rpx;
  color: var(--text-color-tertiary);
  font-weight: 600;
  border: none;
  margin-top: 48rpx;
  margin-bottom: 48rpx;
  transition: all 0.3s;

  &::after {
    border: none;
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--bg-color-card);
    box-shadow: 0 8rpx 24rpx var(--info-color-alpha-40);
  }

  &:active.active {
    transform: scale(0.98);
  }
}

/* 忘记密码 */
.forgot-password {
  text-align: center;
  margin-top: 32rpx;
}

.link {
  font-size: 26rpx;
  color: #667eea;
}
</style>
