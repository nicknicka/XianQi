<template>
  <view class="login-page" :style="themeStyle">
    <!-- 通用导航栏组件 -->
    <view class="nav-gradient-wrapper">
      <CustomNavBar
        :title="isRegister ? '注册' : '登录'"
        :show-back="false"
        :fixed="false"
        background-color="transparent"
        text-color="#fff"
      />
    </view>

    <view class="login-header">
      <view class="logo">🎓</view>
      <text class="slogan">闲七校园 - 你的校园生活助手</text>
    </view>

    <view class="login-form">
      <!-- 登录方式切换 -->
      <view v-if="!isRegister" class="login-type-tabs">
        <view
          class="tab-item"
          :class="{ active: loginType === 'password' }"
          @click="switchLoginType('password')"
        >
          <text class="tab-text">密码登录</text>
        </view>
        <view
          class="tab-item"
          :class="{ active: loginType === 'phone' }"
          @click="switchLoginType('phone')"
        >
          <text class="tab-text">验证码登录</text>
        </view>
      </view>

      <!-- 表单切换动画容器 -->
      <view class="form-wrapper">
        <!-- 登录表单 - 用户名密码登录 -->
        <view v-if="!isRegister && loginType === 'password'" class="form-container">
          <view class="form-title">欢迎回来</view>
          <view class="form-item">
            <uni-icons type="person" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input"
              type="text"
              v-model="loginForm.username"
              placeholder="请输入用户名"
              :placeholder-style="`color: ${primaryColor}`"
            />
          </view>
          <view class="form-item">
            <uni-icons type="locked" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input"
              type="text"
              :password="!showPassword"
              v-model="loginForm.password"
              placeholder="请输入密码"
              :placeholder-style="`color: ${primaryColor}`"
            />
            <uni-icons
              :type="showPassword ? 'eye' : 'eye-slash'"
              size="20"
              :color="primaryColor"
              @click="showPassword = !showPassword"
            ></uni-icons>
          </view>
          <view class="form-actions">
            <view class="custom-checkbox-row" @click="rememberPassword = !rememberPassword">
              <view class="custom-check-box" :class="{ 'is-checked': rememberPassword }">
                <uni-icons v-if="rememberPassword" type="checkmarkempty" size="12" color="#fff" />
              </view>
              <text class="checkbox-text">记住密码</text>
            </view>
            <text class="link forgot-link" @click="goToForgotPassword">忘记密码？</text>
          </view>
          <button class="login-btn" @click="handleLogin">登录</button>

          <view class="form-footer">
            <text class="footer-text">还没有账号？</text>
            <text class="link" @click="switchToRegister">立即注册</text>
          </view>
        </view>

        <!-- 登录表单 - 手机验证码登录 -->
        <view v-if="!isRegister && loginType === 'phone'" class="form-container">
          <view class="form-title">手机验证码登录</view>
          <view class="form-item">
            <uni-icons type="phone" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input"
              type="number"
              v-model="phoneLoginForm.phone"
              placeholder="请输入手机号"
              :placeholder-style="`color: ${primaryColor}`"
              maxlength="11"
            />
          </view>
          <view class="form-item">
            <uni-icons type="chat" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input code-input"
              type="number"
              v-model="phoneLoginForm.code"
              placeholder="请输入验证码"
              :placeholder-style="`color: ${primaryColor}`"
              maxlength="6"
            />
            <button
              class="code-btn"
              :disabled="codeCountdown > 0"
              @click="sendLoginCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
            </button>
          </view>
          <button class="login-btn" @click="handlePhoneLogin">登录</button>

          <view class="form-footer">
            <text class="footer-text">还没有账号？</text>
            <text class="link" @click="switchToRegister">立即注册</text>
          </view>
        </view>

        <!-- 注册表单 -->
        <view v-if="isRegister" class="form-container">
          <view class="form-title">创建账号</view>
          <view class="form-item">
            <uni-icons type="person" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input"
              type="text"
              v-model="registerForm.username"
              placeholder="请输入用户名"
              :placeholder-style="`color: ${primaryColor}`"
            />
          </view>
          <view class="form-item">
            <uni-icons type="phone" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input"
              type="number"
              v-model="registerForm.phone"
              placeholder="请输入手机号"
              :placeholder-style="`color: ${primaryColor}`"
              maxlength="11"
            />
          </view>
          <view class="form-item">
            <uni-icons type="chat" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input code-input"
              type="number"
              v-model="registerForm.code"
              placeholder="请输入验证码"
              :placeholder-style="`color: ${primaryColor}`"
              maxlength="6"
            />
            <button
              class="code-btn"
              :disabled="registerCodeCountdown > 0"
              @click="sendRegisterCode"
            >
              {{ registerCodeCountdown > 0 ? `${registerCodeCountdown}s` : '获取验证码' }}
            </button>
          </view>
          <view class="form-item">
            <uni-icons type="locked" size="20" :color="primaryColor"></uni-icons>
            <input
              class="input"
              type="text"
              :password="!showPassword"
              v-model="registerForm.password"
              placeholder="请输入密码"
              :placeholder-style="`color: ${primaryColor}`"
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
              v-model="registerForm.confirmPassword"
              placeholder="请确认密码"
              :placeholder-style="`color: ${primaryColor}`"
            />
            <uni-icons
              :type="showConfirmPassword ? 'eye' : 'eye-slash'"
              size="20"
              :color="primaryColor"
              @click="showConfirmPassword = !showConfirmPassword"
            ></uni-icons>
          </view>
          <view class="form-actions">
            <view class="custom-checkbox-row" @click="agreeTerms = !agreeTerms">
              <view class="custom-check-box" :class="{ 'is-checked': agreeTerms }">
                <uni-icons v-if="agreeTerms" type="checkmarkempty" size="12" color="#fff" />
              </view>
              <text class="checkbox-text">我已阅读并同意</text>
              <text class="link agreement-link" @click.stop="viewUserAgreement">《用户协议》</text>
            </view>
          </view>
          <button class="login-btn" @click="handleRegister">注册</button>
          <view class="form-footer">
            <text class="footer-text">已有账号？</text>
            <text class="link" @click="switchToLogin">立即登录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import validator from '@/utils/validator'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

// 获取状态栏高度（使用新的 API，避免弃用警告）
const isRegister = ref(false)
const loginType = ref<'password' | 'phone'>('password')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const rememberPassword = ref(false)
const agreeTerms = ref(false)
const codeCountdown = ref(0)
const registerCodeCountdown = ref(0)
const codeTimer = ref<any>(null)
const registerCodeTimer = ref<any>(null)
const redirectTarget = ref('')

const TAB_PAGE_PATHS = [
  '/pages/index/index',
  '/pages/market/list',
  '/pages/publish/index',
  '/pages/message/index',
  '/pages/mine/index'
]

onLoad((options: any) => {
  if (options?.mode === 'register') {
    switchToRegister()
  }

  if (typeof options?.redirect === 'string') {
    const decoded = decodeURIComponent(options.redirect)
    if (decoded.startsWith('/pages/')) {
      redirectTarget.value = decoded
    }
  }
})

function navigateAfterLogin() {
  const target = redirectTarget.value
  if (!target) {
    uni.switchTab({ url: '/pages/index/index' })
    return
  }

  const purePath = target.split('?')[0]
  if (TAB_PAGE_PATHS.includes(purePath)) {
    uni.switchTab({ url: purePath })
    return
  }

  uni.redirectTo({
    url: target,
    fail: () => {
      uni.switchTab({ url: '/pages/index/index' })
    }
  })
}

const loginForm = ref({
  username: '',
  password: ''
})

const phoneLoginForm = ref({
  phone: '',
  code: ''
})

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  code: ''
})

// 切换登录方式
function switchLoginType(type: 'password' | 'phone') {
  loginType.value = type
  // 清空表单
  if (type === 'password') {
    phoneLoginForm.value = { phone: '', code: '' }
  } else {
    loginForm.value = { username: '', password: '' }
  }
}

// 用户名密码登录
function handleLogin() {
  if (!loginForm.value.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!loginForm.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  userApi
    .login(loginForm.value, { showError: false })
    .then(async (res: any) => {
      // 兼容多种响应格式
      const token = res?.data?.token || res?.token
      let userInfo = res?.data?.userInfo || res?.userInfo

      // 如果没有 userInfo，尝试从 res.data 中获取用户信息
      if (!userInfo || Object.keys(userInfo || {}).length === 0) {
        if (res?.data && Object.keys(res.data).length > 1) {
          // res.data 中有除 token 外的其他字段
          const { token: _, ...userData } = res.data
          userInfo = userData
        }
      }

      if (!token) {
        uni.showToast({ title: '登录失败：Token为空', icon: 'none' })
        return
      }

      // 如果后端没有返回 userInfo，使用默认值
      if (!userInfo || Object.keys(userInfo || {}).length === 0) {
        userInfo = {
          id: 0,
          username: loginForm.value.username,
          nickname: loginForm.value.username,
          avatar: '/static/images/user.png'
        }
      }

      // 确保 userInfo 不是 undefined 或 null
      if (!userInfo) {
        userInfo = {}
      }

      userStore.login(token, userInfo)

      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        navigateAfterLogin()
      }, 1500)
    })
    .catch((error) => {
      const errorMessage = error?.message || '登录失败，请稍后重试'
      uni.showModal({
        title: '登录失败',
        content: errorMessage,
        showCancel: false,
        confirmText: '我知道了'
      })
    })
}

// 发送登录验证码
function sendLoginCode() {
  if (!phoneLoginForm.value.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!validator.isPhoneNumber(phoneLoginForm.value.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }

  userApi
    .sendVerifyCode(phoneLoginForm.value.phone, 'login', { showError: false })
    .then(() => {
      uni.showToast({ title: '验证码已发送', icon: 'success' })

      // 开始倒计时
      codeCountdown.value = 60
      codeTimer.value = setInterval(() => {
        codeCountdown.value--
        if (codeCountdown.value <= 0) {
          clearInterval(codeTimer.value)
        }
      }, 1000)
    })
    .catch((error) => {
      const errorMessage = error?.message || '验证码发送失败'
      uni.showModal({
        title: '提示',
        content: errorMessage,
        showCancel: false,
        confirmText: '我知道了'
      })
    })
}

// 发送注册验证码
function sendRegisterCode() {
  if (!registerForm.value.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!validator.isPhoneNumber(registerForm.value.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }

  userApi
    .sendVerifyCode(registerForm.value.phone, 'register', { showError: false })
    .then(() => {
      uni.showToast({ title: '验证码已发送', icon: 'success' })

      // 开始倒计时
      registerCodeCountdown.value = 60
      registerCodeTimer.value = setInterval(() => {
        registerCodeCountdown.value--
        if (registerCodeCountdown.value <= 0) {
          clearInterval(registerCodeTimer.value)
        }
      }, 1000)
    })
    .catch((error) => {
      const errorMessage = error?.message || '验证码发送失败'
      uni.showModal({
        title: '提示',
        content: errorMessage,
        showCancel: false,
        confirmText: '我知道了'
      })
    })
}

// 手机号验证码登录
function handlePhoneLogin() {
  if (!phoneLoginForm.value.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!validator.isPhoneNumber(phoneLoginForm.value.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  if (!phoneLoginForm.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }

  userApi
    .loginByPhone(phoneLoginForm.value, { showError: false })
    .then(async (res: any) => {
      // 兼容多种响应格式
      const token = res?.data?.token || res?.token
      let userInfo = res?.data?.userInfo || res?.userInfo

      // 如果没有 userInfo，尝试从 res.data 中获取用户信息
      if (!userInfo || Object.keys(userInfo || {}).length === 0) {
        if (res?.data && Object.keys(res.data).length > 1) {
          // res.data 中有除 token 外的其他字段
          const { token: _, ...userData } = res.data
          userInfo = userData
        }
      }

      if (!token) {
        uni.showToast({ title: '登录失败：Token为空', icon: 'none' })
        return
      }

      // 如果后端没有返回 userInfo，使用默认值
      if (!userInfo || Object.keys(userInfo || {}).length === 0) {
        userInfo = {
          id: 0,
          username: phoneLoginForm.value.phone,
          nickname: phoneLoginForm.value.phone,
          avatar: '/static/images/user.png'
        }
      }

      // 确保 userInfo 不是 undefined 或 null
      if (!userInfo) {
        userInfo = {}
      }

      userStore.login(token, userInfo)

      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        navigateAfterLogin()
      }, 1500)
    })
    .catch((error) => {
      const errorMessage = error?.message || '登录失败，请稍后重试'
      uni.showModal({
        title: '登录失败',
        content: errorMessage,
        showCancel: false,
        confirmText: '我知道了'
      })
    })
}

// 微信登录
function handleWechatLogin() {
  // #ifdef MP-WEIXIN
  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      userApi
        .loginByWechat({ code: loginRes.code }, { showError: false })
        .then((response: any) => {
          // 后端返回格式：{ code: 200, data: { token, id, nickname, avatar, phone, isNewUser } }
          const data = response?.data || response
          const token = data.token
          const isNewUser = data.isNewUser
          const userInfo = {
            id: data.id,
            username: data.username,
            nickname: data.nickname,
            avatar: data.avatar,
            phone: data.phone
          }

          if (!token) {
            uni.showToast({ title: '登录失败：Token为空', icon: 'none' })
            return
          }

          if (isNewUser) {
            // 新用户，需要绑定手机号
            uni.showModal({
              title: '提示',
              content: '首次登录需要绑定手机号',
              showCancel: false,
              success: () => {
                uni.navigateTo({
                  url: `/pages/login/bind-phone?token=${token}`
                })
              }
            })
          } else {
            userStore.login(token, userInfo)
            uni.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              navigateAfterLogin()
            }, 1500)
          }
        })
        .catch((error) => {
          const errorMessage = error?.message || '微信登录失败，请稍后重试'
          uni.showModal({
            title: '登录失败',
            content: errorMessage,
            showCancel: false,
            confirmText: '我知道了'
          })
        })
    },
    fail: () => {
      uni.showToast({ title: '微信授权失败', icon: 'none' })
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '仅微信小程序支持',
    icon: 'none'
  })
  // #endif
}

// QQ登录
function handleQQLogin() {
  // #ifdef MP-QQ
  uni.login({
    provider: 'qq',
    success: (loginRes) => {
      userApi
        .loginByQQ({ code: loginRes.code })
        .then((response: any) => {
          const data = response?.data || response
          const token = data.token
          const isNewUser = data.isNewUser
          const userInfo = {
            id: data.id,
            username: data.username,
            nickname: data.nickname,
            avatar: data.avatar,
            phone: data.phone
          }

          if (!token) {
            uni.showToast({ title: '登录失败：Token为空', icon: 'none' })
            return
          }

          if (isNewUser) {
            uni.showModal({
              title: '提示',
              content: '首次登录需要绑定手机号',
              showCancel: false,
              success: () => {
                uni.navigateTo({
                  url: `/pages/login/bind-phone?token=${token}`
                })
              }
            })
          } else {
            userStore.login(token, userInfo)
            uni.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              navigateAfterLogin()
            }, 1500)
          }
        })
        .catch((error) => {
          const errorMessage = error?.message || 'QQ登录失败，请稍后重试'
          uni.showModal({
            title: '登录失败',
            content: errorMessage,
            showCancel: false,
            confirmText: '我知道了'
          })
        })
    },
    fail: () => {
      uni.showToast({ title: 'QQ授权失败', icon: 'none' })
    }
  })
  // #endif

  // #ifndef MP-QQ
  uni.showToast({
    title: '请在QQ小程序中使用此功能',
    icon: 'none'
  })
  // #endif
}

// 忘记密码
function goToForgotPassword() {
  uni.navigateTo({
    url: '/pages/login/forgot-password'
  })
}

function handleRegister() {
  // 表单验证
  if (!registerForm.value.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  if (!validator.isUsername(registerForm.value.username)) {
    uni.showToast({ title: '用户名为2-20位字母数字下划线', icon: 'none' })
    return
  }
  if (!registerForm.value.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!validator.isPhoneNumber(registerForm.value.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  if (!registerForm.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (!registerForm.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  if (!validator.isPassword(registerForm.value.password)) {
    uni.showToast({ title: '密码长度为6-20位', icon: 'none' })
    return
  }
  if (!registerForm.value.confirmPassword) {
    uni.showToast({ title: '请确认密码', icon: 'none' })
    return
  }
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' })
    return
  }
  if (!agreeTerms.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }

  // 移除 confirmPassword 字段
  const { confirmPassword, ...registerData } = registerForm.value

  // 调用注册接口
  userApi
    .register(registerData, { showError: false })
    .then(() => {
      uni.showToast({ title: '注册成功，请登录', icon: 'none', duration: 2000 })
      // 等 toast 显示完再切换到登录界面
      setTimeout(() => {
        switchToLogin()
      }, 2000)
    })
    .catch((err: any) => {
      const errorMessage = err?.message || err?.toString() || '注册失败，请重试'
      uni.showModal({
        title: '注册失败',
        content: errorMessage,
        showCancel: false,
        confirmText: '我知道了'
      })
    })
}

// 切换到注册
function switchToRegister() {
  // 清空登录表单
  loginForm.value = {
    username: '',
    password: ''
  }
  phoneLoginForm.value = {
    phone: '',
    code: ''
  }
  rememberPassword.value = false
  isRegister.value = true
}

// 切换到登录
function switchToLogin() {
  // 清空注册表单
  registerForm.value = {
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    code: ''
  }
  agreeTerms.value = false
  showPassword.value = false
  showConfirmPassword.value = false
  isRegister.value = false
}

// 查看用户协议
function viewUserAgreement() {
  uni.navigateTo({
    url: '/pages/common/agreement'
  })
}

// 清理定时器
onUnmounted(() => {
  if (codeTimer.value) {
    clearInterval(codeTimer.value)
  }
  if (registerCodeTimer.value) {
    clearInterval(registerCodeTimer.value)
  }
})

</script>

<style lang="scss" scoped>
.login-page {
  /* 使用 fixed 定位锁死屏幕高度，完美适配所有机型 */
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden; /* 全局禁止容器溢出 */
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  padding-bottom: env(safe-area-inset-bottom); /* 使用系统安全区适配 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 导航栏渐变背景包装器 */
.nav-gradient-wrapper {
  position: relative;
  z-index: 999;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  flex-shrink: 0; /* 防止被压缩 */
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  padding-top: 20rpx;
  flex-shrink: 0; /* 防止被压缩 */

  .logo {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    margin-bottom: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80rpx;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10rpx);
  }

  .slogan {
    font-size: var(--font-size-base);
    color: rgba(255, 255, 255, 0.9);
  }
}

.login-form {
  background: var(--bg-color-card);
  border-radius: 32rpx;
  padding: 48rpx;
  margin: 0 24rpx;
  overflow-y: auto;
  flex: 1; /* 占据剩余空间 */
  min-height: 0; /* 重要：允许 flex 子元素缩小 */
  box-sizing: border-box;
  /* 防止滚动穿透 */
  overscroll-behavior: none; /* 禁止滚动事件冒泡到父元素 */
  -webkit-overflow-scrolling: touch; /* 优化iOS滚动流畅度 */
  touch-action: pan-y; /* 限制触摸行为仅允许纵向滚动 */
  /* Claymorphism 粘土拟态风格 */
  box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06), -4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
}

/* 登录方式切换 */
.login-type-tabs {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
  border-bottom: 1rpx solid var(--border-color-light);

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    position: relative;
    transition: all 0.3s;

    &.active {
      .tab-text {
        color: var(--primary-color);
        font-weight: 600;
      }

      &::after {
        content: '';
        position: absolute;
        bottom: -1rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background: var(--primary-color);
        border-radius: 2rpx;
      }
    }

    .tab-text {
      font-size: 28rpx;
      color: var(--text-color-secondary);
      transition: all 0.3s;
    }
  }
}

.form-wrapper {
  position: relative;
  /* 不再使用固定的 min-height，让内容自适应高度 */
  min-height: auto;
}

.form-container {
  position: relative;
  width: 100%;
  /* 使用 animation 而不是 transition，uniapp 支持 */
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* 防止动画元素溢出 */
}

.form-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-color-primary);
  text-align: center;
  margin-bottom: 40rpx;
  animation: fadeInDown 0.5s ease-out;
}

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

@keyframes fadeOutUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20rpx);
  }
}

@keyframes slideOutLeft {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-60rpx);
  }
}

/* 表单项交错的入场动画 */
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
  animation-fill-mode: both; /* 动画结束后保持最终状态 */
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

    &::after {
      border: none;
    }

    &:disabled {
      color: var(--text-color-tertiary);
      border-color: var(--text-color-tertiary);
    }
  }

  &.optional {
    .input {
      padding-right: 80rpx;
    }

    .optional-tag {
      position: absolute;
      right: 24rpx;
      font-size: 20rpx;
      color: var(--text-color-tertiary);
      background: var(--danger-color-alpha-10);
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
    }
  }

  /* 每个表单项的延迟动画 */
  &:nth-of-type(2) {
    animation-delay: 0.06s;
  }
  &:nth-of-type(3) {
    animation-delay: 0.12s;
  }
  &:nth-of-type(4) {
    animation-delay: 0.18s;
  }
  &:nth-of-type(5) {
    animation-delay: 0.24s;
  }
  &:nth-of-type(6) {
    animation-delay: 0.3s;
  }
  &:nth-of-type(7) {
    animation-delay: 0.36s;
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

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  animation: fadeInUp 0.5s ease-out 0.4s forwards;
  animation-fill-mode: both;

  .checkbox {
    display: flex;
    align-items: center;

    .checkbox-text {
      margin-left: 12rpx;
      font-size: var(--font-size-sm);
      color: var(--text-color-secondary);
    }

    .link {
      margin-left: 8rpx;
      color: var(--primary-color);
    }

    .agreement-link {
      text-decoration: underline;
      text-underline-offset: 4rpx;
    }
  }

  .custom-checkbox-row {
    display: flex;
    align-items: center;

    .custom-check-box {
      width: 32rpx;
      height: 32rpx;
      border-radius: 6rpx;
      border: 2rpx solid #d1d5db;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;

      &.is-checked {
        background: var(--primary-color);
        border-color: var(--primary-color);
      }
    }

    .checkbox-text {
      margin-left: 12rpx;
      font-size: var(--font-size-sm);
      color: var(--text-color-secondary);
    }

    .link {
      margin-left: 8rpx;
      color: var(--primary-color);
    }

    .agreement-link {
      text-decoration: underline;
      text-underline-offset: 4rpx;
    }
  }

  .forgot-link {
    font-size: var(--font-size-sm);
    color: var(--primary-color);
  }
}

/* 第三方登录 */
.third-party-login {
  margin-top: 32rpx;
  animation: fadeInUp 0.5s ease-out 0.5s forwards;
  animation-fill-mode: both;

  .divider-line {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1rpx;
      background: #e8e8e8;
    }

    .divider-text {
      padding: 0 24rpx;
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }

  .third-party-icons {
    display: flex;
    justify-content: center;
    gap: 64rpx;
  }

  .third-party-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    animation: fadeInUp 0.5s ease-out forwards;
    animation-fill-mode: both;
    transition: all 0.3s;

    &:nth-of-type(1) {
      animation-delay: 0.6s;
    }

    &:nth-of-type(2) {
      animation-delay: 0.7s;
    }

    &:active {
      transform: scale(0.95);
      opacity: 0.7;
    }

    .third-party-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      padding: 16rpx;
      background: var(--bg-color-disabled);
      /* Claymorphism 凸起效果 */
      box-shadow: 4rpx 4rpx 10rpx rgba(0, 0, 0, 0.06), -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.6);
      border: 2rpx solid rgba(255, 255, 255, 0.6);

      &.wechat-icon {
        background: linear-gradient(135deg, #07c160 0%, #06ae56 100%);
      }

      &.qq-icon {
        background: linear-gradient(135deg, #12b7f5 0%, #0099ff 100%);
      }
    }

    .third-party-text {
      font-size: 22rpx;
      color: var(--text-color-secondary);
    }
  }
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: var(--primary-color);
  color: var(--bg-color-card);
  font-size: var(--font-size-lg);
  border-radius: 9999px;
  border: none;
  margin-top: 24rpx;
  opacity: 1;
  animation: fadeInUp 0.5s ease-out 0.3s forwards;
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

.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24rpx;
  gap: 8rpx;
  animation: fadeInUp 0.5s ease-out 0.6s forwards;
  animation-fill-mode: both;

  .footer-text {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
  }

  .link {
    font-size: var(--font-size-sm);
    color: var(--primary-color);
    font-weight: 600;
    transition: all 0.3s ease;

    &:active {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }
}
</style>
