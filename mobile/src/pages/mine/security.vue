<template>
  <view class="security-page page-animate service-redesign-page" :class="{ 'animate-in': isAnimated }" :style="themeStyle">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-avatar">
        <lazy-image
          class="avatar-img"
          :src="userInfo.avatar"
          default-type="user"
          mode="aspectFill"
        />
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo.nickname || '未设置昵称' }}</text>
        <text class="user-phone">{{ userInfo.phone ? maskPhone(userInfo.phone) : '未绑定手机' }}</text>
      </view>
    </view>

    <!-- 安全设置列表 -->
    <view class="security-section">
      <view class="section-title">
        <text class="title-text">账号安全</text>
      </view>
      <view class="security-list">
        <view class="security-item" @click="goPhoneBind">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, var(--primary-color-alpha-10) 0%, var(--primary-color-alpha-20) 100%);">
              <uni-icons type="phone" size="18" :color="primaryColor" />
            </view>
            <view class="item-info">
              <text class="item-name">手机号</text>
              <text class="item-desc">{{ userInfo.phone ? maskPhone(userInfo.phone) : '未绑定' }}</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-status" :class="{ bound: userInfo.phone }">
              {{ userInfo.phone ? '已绑定' : '去绑定' }}
            </text>
            <uni-icons type="right" size="14" :color="primaryColor" />
          </view>
        </view>

        <view class="security-item" @click="goPasswordChange">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);">
              <uni-icons type="locked" size="18" :color="warningColor" />
            </view>
            <view class="item-info">
              <text class="item-name">登录密码</text>
              <text class="item-desc">用于登录账号</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-status">已设置</text>
            <uni-icons type="right" size="14" :color="primaryColor" />
          </view>
        </view>

        <view class="security-item" @click="goPayPassword">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);">
              <uni-icons type="wallet" size="18" :color="successColor" />
            </view>
            <view class="item-info">
              <text class="item-name">支付密码</text>
              <text class="item-desc">用于支付验证</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-status" :class="{ bound: hasPayPassword }">
              {{ hasPayPassword ? '已设置' : '去设置' }}
            </text>
            <uni-icons type="right" size="14" :color="primaryColor" />
          </view>
        </view>
      </view>
    </view>

    <!-- 身份认证 -->
    <view class="security-section">
      <view class="section-title">
        <text class="title-text">身份认证</text>
      </view>
      <view class="security-list">
        <view class="security-item" @click="goRealNameAuth">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);">
              <uni-icons type="checkmarkempty" size="18" :color="successColor" />
            </view>
            <view class="item-info">
              <text class="item-name">实名认证</text>
              <text class="item-desc">认证后可享受更多服务</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-status" :class="{ bound: realNameStatus === 2 }">
              {{ realNameStatusText }}
            </text>
            <uni-icons type="right" size="14" :color="primaryColor" />
          </view>
        </view>

        <view class="security-item" @click="goStudentAuth">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);">
              <uni-icons type="person" size="18" :color="primaryColor" />
            </view>
            <view class="item-info">
              <text class="item-name">学生认证</text>
              <text class="item-desc">学生身份专属特权</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-status" :class="{ bound: studentStatus === 2 }">
              {{ studentStatusText }}
            </text>
            <uni-icons type="right" size="14" :color="primaryColor" />
          </view>
        </view>
      </view>
    </view>

    <!-- 安全设备 -->
    <view class="security-section">
      <view class="section-title">
        <text class="title-text">设备管理</text>
      </view>
      <view class="security-list">
        <view class="security-item" @click="goDevices">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);">
              <uni-icons type="settings" size="18" :color="primaryColor" />
            </view>
            <view class="item-info">
              <text class="item-name">登录设备</text>
              <text class="item-desc">管理已登录的设备</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-count">{{ deviceCount }}台</text>
            <uni-icons type="right" size="14" :color="primaryColor" />
          </view>
        </view>
      </view>
    </view>

    <!-- 隐私设置 -->
    <view class="security-section">
      <view class="section-title">
        <text class="title-text">隐私设置</text>
      </view>
      <view class="security-list">
        <view class="security-item">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);">
              <uni-icons type="eye" size="18" :color="dangerColor" />
            </view>
            <view class="item-info">
              <text class="item-name">手机号搜索</text>
              <text class="item-desc">允许其他用户通过手机号找到你</text>
            </view>
          </view>
          <switch :checked="phoneSearchEnabled" @change="togglePhoneSearch" :color="primaryColor" />
        </view>

        <view class="security-item">
          <view class="item-left">
            <view class="item-icon" style="background: linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%);">
              <uni-icons type="location" size="18" color="#00796B" />
            </view>
            <view class="item-info">
              <text class="item-name">位置信息</text>
              <text class="item-desc">显示交易时的位置信息</text>
            </view>
          </view>
          <switch :checked="locationEnabled" @change="toggleLocation" :color="primaryColor" />
        </view>
      </view>
    </view>

    <!-- 危险操作 -->
    <view class="danger-section">
      <view class="danger-btn" @click="showDeleteConfirm">
        <text class="danger-text">注销账号</text>
      </view>
      <text class="danger-tip">注销后将无法恢复，请谨慎操作</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import LazyImage from '@/components/lazy-image/lazy-image.vue'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { themeStyle } = useThemeStyle()
const { primaryColor, successColor, warningColor, dangerColor } = useThemeColors()
const userStore = useUserStore()

// 页面进入动画状态
const isAnimated = ref(false)

const userInfo = ref({
  avatar: userStore.avatar || '',
  nickname: userStore.nickname || '',
  phone: (userStore.userInfo as any)?.phone || ''
})

const hasPayPassword = ref(false)
const deviceCount = ref(2)
const phoneSearchEnabled = ref(true)
const locationEnabled = ref(true)

// 身份认证状态：0-未认证，1-审核中，2-已认证
const realNameStatus = ref(0)
const studentStatus = ref(0)

// 计算认证状态文本
const realNameStatusText = computed(() => {
  const statusMap: Record<number, string> = {
    0: '去认证',
    1: '审核中',
    2: '已认证'
  }
  return statusMap[realNameStatus.value] || '去认证'
})

const studentStatusText = computed(() => {
  const statusMap: Record<number, string> = {
    0: '去认证',
    1: '审核中',
    2: '已认证'
  }
  return statusMap[studentStatus.value] || '去认证'
})

/**
 * 后端开关字段可能是 0/1 或 true/false，统一归一为布尔。
 */
function normalizeToggle(value: unknown): boolean {
  return value === 1 || value === true
}

// 手机号脱敏
function maskPhone(phone: string) {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 加载用户安全设置
async function loadSecuritySettings() {
  try {
    const [payPasswordRes, privacyRes, userInfoRes] = await Promise.all([
      userApi.checkPayPassword(),
      userApi.getPrivacySettings(),
      userApi.getUserInfo()
    ])

    hasPayPassword.value = !!payPasswordRes.data?.hasPayPassword
    phoneSearchEnabled.value = normalizeToggle(privacyRes.data?.phoneSearchEnabled)
    locationEnabled.value = normalizeToggle(privacyRes.data?.locationEnabled)
    realNameStatus.value = (userInfoRes.data as any)?.realNameStatus || 0
    studentStatus.value = (userInfoRes.data as any)?.studentStatus || 0
    userInfo.value = {
      avatar: (userInfoRes.data as any)?.avatar || userStore.avatar || '',
      nickname: (userInfoRes.data as any)?.nickname || userStore.nickname || '',
      phone: (userInfoRes.data as any)?.phone || (userStore.userInfo as any)?.phone || ''
    }
  } catch (error) {
    console.error('[Security] 加载安全设置失败:', error)
    uni.showToast({ title: '加载安全设置失败', icon: 'none' })
  }
}

// 绑定手机号
function goPhoneBind() {
  if (userInfo.value.phone) {
    // 已绑定手机，可以跳转到更换手机号页面
    uni.showActionSheet({
      itemList: ['更换手机号'],
      success: (res) => {
        if (res.tapIndex === 0) {
          uni.navigateTo({
            url: '/pages/mine/bind-phone?action=change'
          })
        }
      }
    })
  } else {
    uni.navigateTo({
      url: '/pages/mine/bind-phone'
    })
  }
}

// 修改登录密码
function goPasswordChange() {
  uni.navigateTo({
    url: '/pages/mine/change-password'
  })
}

// 设置/修改支付密码
function goPayPassword() {
  uni.navigateTo({
    url: hasPayPassword.value ? '/pages/mine/change-pay-password' : '/pages/mine/set-pay-password'
  })
}

// 登录设备管理
function goDevices() {
  uni.navigateTo({
    url: '/pages/mine/devices'
  })
}

// 实名认证
function goRealNameAuth() {
  uni.navigateTo({
    url: '/pages/mine/auth-center?type=realname'
  })
}

// 学生认证
function goStudentAuth() {
  uni.navigateTo({
    url: '/pages/mine/auth-center?type=student'
  })
}

// 切换手机号搜索
async function togglePhoneSearch(e: any) {
  const newValue = e.detail.value
  const oldValue = phoneSearchEnabled.value
  // 先更新 UI
  phoneSearchEnabled.value = newValue

  try {
    await userApi.updatePrivacySettings({
      phoneSearchEnabled: newValue
    })
    uni.showToast({
      title: newValue ? '已开启' : '已关闭',
      icon: 'none'
    })
  } catch (error: any) {
    // 恢复开关状态
    phoneSearchEnabled.value = oldValue
    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none'
    })
  }
}

// 切换位置信息
async function toggleLocation(e: any) {
  const newValue = e.detail.value
  const oldValue = locationEnabled.value
  // 先更新 UI
  locationEnabled.value = newValue

  try {
    await userApi.updatePrivacySettings({
      locationEnabled: newValue
    })
    uni.showToast({
      title: newValue ? '已开启' : '已关闭',
      icon: 'none'
    })
  } catch (error: any) {
    // 恢复开关状态
    locationEnabled.value = oldValue
    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none'
    })
  }
}

// 显示注销确认
function showDeleteConfirm() {
  uni.showModal({
    title: '注销账号',
    content: '注销后将无法恢复，所有数据将被清空，确定要注销吗？',
    confirmText: '确定注销',
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          // 需要用户输入密码确认
          // 这里可以弹出一个输入框让用户输入密码
          uni.showModal({
            title: '安全验证',
            content: '请输入登录密码以确认注销',
            editable: true,
            placeholderText: '请输入登录密码',
            success: async (pwdRes) => {
              if (pwdRes.confirm && pwdRes.content) {
                try {
                  uni.showLoading({ title: '注销中...' })
                  await userApi.deleteAccount({
                    password: pwdRes.content
                  })
                  uni.hideLoading()
                  uni.showToast({
                    title: '注销成功',
                    icon: 'success'
                  })
                  // 退出登录并跳转到登录页
                  setTimeout(() => {
                    userStore.logout()
                    uni.reLaunch({
                      url: '/pages/login/index'
                    })
                  }, 1500)
                } catch (error: any) {
                  uni.hideLoading()
                  uni.showToast({
                    title: error.message || '注销失败',
                    icon: 'none'
                  })
                }
              }
            }
          })
        } catch (error: any) {
          uni.showToast({
            title: error.message || '注销失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 页面加载时获取安全设置
onMounted(() => {
  loadSecuritySettings()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

// 页面显示时刷新数据
onShow(() => {
  useThemePage()
  loadSecuritySettings()
})
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

.security-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding: 24rpx;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.user-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx var(--info-color-alpha-30);
}

.user-avatar {
  margin-right: 24rpx;
}

.avatar-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.user-phone {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.security-section {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  padding: 24rpx 32rpx 16rpx;
  border-bottom: 1rpx solid var(--bg-color-disabled);
}

.title-text {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.security-list {
  padding: 0 16rpx;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 16rpx;
  border-bottom: 1rpx solid var(--bg-color-disabled);

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: var(--bg-color-hover);
    margin: 0 -16rpx;
    padding: 24rpx 16rpx;
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.item-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.item-name {
  font-size: 28rpx;
  color: var(--text-color-primary);
  font-weight: 500;
}

.item-desc {
  font-size: 22rpx;
  color: var(--text-color-tertiary);
}

.item-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.item-status {
  font-size: 24rpx;
  color: var(--text-color-tertiary);

  &.bound {
    color: var(--success-color);
  }
}

.item-count {
  font-size: 24rpx;
  color: var(--primary-color);
  font-weight: 600;
}

.danger-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}

.danger-btn {
  padding: 24rpx 64rpx;
  background: var(--bg-color-card);
  border: 2rpx solid var(--danger-color);
  border-radius: 48rpx;
  margin-bottom: 16rpx;
}

.danger-text {
  font-size: 28rpx;
  color: var(--danger-color);
  font-weight: 600;
}

.danger-tip {
  font-size: 22rpx;
  color: var(--text-color-tertiary);
}
</style>
