<template>
  <view class="bind-phone-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="绑定手机号"
      :show-back="true"
      background-color="var(--bg-color-card)"
      text-color="var(--text-color-primary)"
    />

    <!-- 内容区域 -->
    <view class="content">
      <!-- 提示信息 -->
      <view class="tip-card">
        <uni-icons type="info-filled" size="18" :color="primaryColor" />
        <text class="tip-text">绑定手机号后，可以使用手机号登录账号</text>
      </view>

      <!-- 表单 -->
      <view class="form">
        <view class="form-item">
          <view class="item-label">手机号</view>
          <view class="item-input-wrap">
            <input
              class="item-input"
              type="number"
              maxlength="11"
              placeholder="请输入手机号"
              v-model="formData.phone"
              @input="onPhoneInput"
            />
            <view class="clear-btn" v-if="formData.phone" @click="formData.phone = ''">
              <uni-icons type="clear" size="14" color="#C0C0C0" />
            </view>
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

        <button class="submit-btn" :class="{ active: canSubmit }" :disabled="!canSubmit" @click="handleSubmit">
          确认绑定
        </button>
      </view>

      <!-- 说明文字 -->
      <view class="agreement-text">
        <text class="text">点击"确认绑定"即表示同意</text>
        <text class="link">《用户协议》</text>
        <text class="text">和</text>
        <text class="link">《隐私政策》</text>
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
  phone: '',
  code: ''
})

// 验证码倒计时
const countdown = ref(0)
const codeBtnText = computed(() => {
  return countdown.value > 0 ? `${countdown.value}s后重新获取` : '获取验证码'
})

const canSendCode = computed(() => {
  return /^1[3-9]\d{9}$/.test(formData.value.phone) && countdown.value === 0
})

const canSubmit = computed(() => {
  return /^1[3-9]\d{9}$/.test(formData.value.phone) && /^\d{6}$/.test(formData.value.code)
})

// 手机号输入处理
function onPhoneInput(e: any) {
  let value = e.detail.value
  // 只能输入数字
  value = value.replace(/\D/g, '')
  // 最多11位
  if (value.length > 11) {
    value = value.slice(0, 11)
  }
  formData.value.phone = value
}

// 发送验证码
async function sendCode() {
  if (!canSendCode.value) {
    return
  }

  try {
    await userApi.sendVerifyCode(formData.value.phone, 'bind')
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

// 提交绑定
async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  try {
    await userApi.bindPhone({
      phone: formData.value.phone,
      code: formData.value.code
    })

    uni.showToast({
      title: '绑定成功',
      icon: 'success'
    })

    // 更新用户信息
    const res = await userApi.getUserInfo()
    if (res.data) {
      userStore.setUserInfo(res.data)
    }

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error: any) {
    uni.showToast({
      title: error.message || '绑定失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.bind-phone-page {
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

/* 提示卡片 */
.tip-card {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, var(--primary-color-alpha-10) 0%, var(--primary-color-alpha-20) 100%);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.tip-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--primary-color);
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
    color: var(--text-color-placeholder);
  }
}

.code-input {
  flex: 1;
}

.clear-btn {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:active {
    background: var(--bg-color-disabled);
  }
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

/* 协议文字 */
.agreement-text {
  text-align: center;
  padding: 0 32rpx;
}

.text {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
}

.link {
  font-size: 24rpx;
  color: var(--primary-color);
}
</style>
