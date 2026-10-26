<template>
  <view class="change-pay-password-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="修改支付密码"
      :show-back="true"
      background-color="var(--bg-color-card)"
      text-color="var(--text-color-primary)"
    />

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'old' }"
        @click="switchTab('old')"
      >
        <text class="tab-text">原密码验证</text>
        <view class="tab-indicator" v-if="activeTab === 'old'"></view>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'phone' }"
        @click="switchTab('phone')"
      >
        <text class="tab-text">手机验证</text>
        <view class="tab-indicator" v-if="activeTab === 'phone'"></view>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y>
      <!-- 原密码验证方式 -->
      <view v-if="activeTab === 'old'" class="form-container">
        <view class="form">
          <view class="form-item">
            <view class="item-label">当前支付密码</view>
            <view class="item-input-wrap">
              <input
                class="item-input"
                type="number"
                maxlength="6"
                placeholder="请输入当前支付密码"
                v-model="oldPasswordForm.password"
              />
            </view>
          </view>

          <view class="form-item">
            <view class="item-label">新支付密码</view>
            <view class="item-input-wrap">
              <input
                class="item-input"
                type="number"
                maxlength="6"
                placeholder="请输入6位数字支付密码"
                v-model="oldPasswordForm.newPassword"
              />
            </view>
            <view class="input-hint">6位纯数字，请勿与银行卡密码相同</view>
          </view>

          <view class="form-item">
            <view class="item-label">确认新支付密码</view>
            <view class="item-input-wrap">
              <input
                class="item-input"
                type="number"
                maxlength="6"
                placeholder="请再次输入新支付密码"
                v-model="oldPasswordForm.confirmPassword"
              />
            </view>
            <view class="match-tip" v-if="oldPasswordForm.confirmPassword">
              <uni-icons
                :type="isPasswordMatchOld ? 'checkmarkempty' : 'closeempty'"
                size="14"
                :color="isPasswordMatchOld ? '#4CAF50' : '#F44336'"
              />
              <text
                class="match-text"
                :class="{ match: isPasswordMatchOld }"
              >
                {{ isPasswordMatchOld ? '密码一致' : '密码不一致' }}
              </text>
            </view>
          </view>

          <button
            class="submit-btn"
            :class="{ active: canSubmitOld }"
            :disabled="!canSubmitOld"
            @click="handleSubmitOld"
          >
            确认修改
          </button>
        </view>
      </view>

      <!-- 手机验证方式 -->
      <view v-if="activeTab === 'phone'" class="form-container">
        <view class="phone-info">
          <text class="info-text">已绑定手机号：{{ maskedPhone }}</text>
        </view>

        <view class="form">
          <view class="form-item">
            <view class="item-label">验证码</view>
            <view class="item-input-wrap">
              <input
                class="item-input code-input"
                type="number"
                maxlength="6"
                placeholder="请输入验证码"
                v-model="phoneForm.code"
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
            <view class="item-label">新支付密码</view>
            <view class="item-input-wrap">
              <input
                class="item-input"
                type="number"
                maxlength="6"
                placeholder="请输入6位数字支付密码"
                v-model="phoneForm.newPassword"
              />
            </view>
            <view class="input-hint">6位纯数字，请勿与银行卡密码相同</view>
          </view>

          <view class="form-item">
            <view class="item-label">确认新支付密码</view>
            <view class="item-input-wrap">
              <input
                class="item-input"
                type="number"
                maxlength="6"
                placeholder="请再次输入新支付密码"
                v-model="phoneForm.confirmPassword"
              />
            </view>
            <view class="match-tip" v-if="phoneForm.confirmPassword">
              <uni-icons
                :type="isPasswordMatchPhone ? 'checkmarkempty' : 'closeempty'"
                size="14"
                :color="isPasswordMatchPhone ? '#4CAF50' : '#F44336'"
              />
              <text
                class="match-text"
                :class="{ match: isPasswordMatchPhone }"
              >
                {{ isPasswordMatchPhone ? '密码一致' : '密码不一致' }}
              </text>
            </view>
          </view>

          <button
            class="submit-btn"
            :class="{ active: canSubmitPhone }"
            :disabled="!canSubmitPhone"
            @click="handleSubmitPhone"
          >
            确认修改
          </button>
        </view>
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
            <text class="tip-text">忘记支付密码？可以通过手机验证码重置</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import { useThemePage, useThemeStyle } from '@/utils/theme'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()

onShow(() => {
  useThemePage()
})

// 当前激活的Tab
const activeTab = ref<'old' | 'phone'>('old')

// 用户手机号
const userPhone = computed(() => {
  return (userStore.userInfo as any)?.phone || ''
})

const maskedPhone = computed(() => {
  if (!userPhone.value) return '未绑定手机号'
  return userPhone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

// 原密码验证表单
const oldPasswordForm = ref({
  password: '',
  newPassword: '',
  confirmPassword: ''
})

// 手机验证表单
const phoneForm = ref({
  code: '',
  newPassword: '',
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
const isPasswordMatchOld = computed(() => {
  return oldPasswordForm.value.newPassword === oldPasswordForm.value.confirmPassword &&
    oldPasswordForm.value.newPassword.length === 6
})

const isPasswordMatchPhone = computed(() => {
  return phoneForm.value.newPassword === phoneForm.value.confirmPassword &&
    phoneForm.value.newPassword.length === 6
})

// 密码格式验证（检查是否为弱密码）
const isWeakPasswordOld = computed(() => {
  return checkWeakPassword(oldPasswordForm.value.newPassword)
})

const isWeakPasswordPhone = computed(() => {
  return checkWeakPassword(phoneForm.value.newPassword)
})

function checkWeakPassword(password: string): boolean {
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
}

// 提交按钮状态
const canSubmitOld = computed(() => {
  return oldPasswordForm.value.password.length === 6 &&
    oldPasswordForm.value.newPassword.length === 6 &&
    isPasswordMatchOld.value &&
    !isWeakPasswordOld.value
})

const canSubmitPhone = computed(() => {
  return phoneForm.value.code.length === 6 &&
    phoneForm.value.newPassword.length === 6 &&
    isPasswordMatchPhone.value &&
    !isWeakPasswordPhone.value
})

// 切换Tab
function switchTab(tab: 'old' | 'phone') {
  activeTab.value = tab
}

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

// 原密码方式提交
async function handleSubmitOld() {
  if (!canSubmitOld.value) {
    return
  }

  if (isWeakPasswordOld.value) {
    uni.showToast({
      title: '密码过于简单，请重新设置',
      icon: 'none'
    })
    return
  }

  try {
    await userApi.changePayPassword({
      oldPassword: oldPasswordForm.value.password,
      newPassword: oldPasswordForm.value.newPassword
    })

    uni.showToast({
      title: '修改成功',
      icon: 'success'
    })

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '修改失败',
      icon: 'none'
    })
  }
}

// 手机验证方式提交
async function handleSubmitPhone() {
  if (!canSubmitPhone.value) {
    return
  }

  if (isWeakPasswordPhone.value) {
    uni.showToast({
      title: '密码过于简单，请重新设置',
      icon: 'none'
    })
    return
  }

  try {
    await userApi.resetPayPassword({
      phone: userPhone.value,
      code: phoneForm.value.code,
      newPassword: phoneForm.value.newPassword
    })

    uni.showToast({
      title: '修改成功',
      icon: 'success'
    })

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '修改失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.change-pay-password-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
}

/* Tab栏 */
.tab-bar {
  display: flex;
  background: var(--bg-color-card);
  border-bottom: 1rpx solid var(--bg-color-disabled);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  position: relative;
  transition: all 0.3s;
}

.tab-text {
  font-size: 28rpx;
  color: var(--text-color-secondary);
  transition: all 0.3s;
}

.tab-item.active .tab-text {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  width: 60rpx;
  height: 4rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  border-radius: 2rpx;
}

/* 内容区域 */
.content {
  flex: 1;
  padding: 24rpx;
}

/* 手机信息 */
.phone-info {
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.info-text {
  font-size: 26rpx;
  color: #388E3C;
}

/* 表单容器 */
.form-container {
  margin-bottom: 24rpx;
}

.form {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 0 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  padding: 32rpx 0;
  border-bottom: 1rpx solid var(--bg-color-disabled);

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
  margin-top: 24rpx;
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
