<template>
  <view :class="['profile-page', animateClass]" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="个人信息"
      :show-back="true"
      background-color="transparent"
      text-color="#FFFFFF"
    />

    <!-- 头部背景 -->
    <view class="header-bg header-animate" :class="{ 'header-visible': isHeaderVisible }">
      <view class="header-glow glow-left"></view>
      <view class="header-glow glow-right"></view>
    </view>

    <!-- 资料卡片 -->
    <view class="profile-hero avatar-animate" :class="{ 'avatar-visible': isAvatarVisible }">
      <view class="profile-card">
        <view class="avatar-shell">
          <UserAvatar
            :src="userInfo.avatar"
            size="xl"
            clickable
            @click="changeAvatar"
          />
          <view class="avatar-edit-badge">
            <uni-icons type="camera" size="12" color="#fff" />
          </view>
        </view>
        <view class="profile-meta">
          <text class="profile-name">{{ userInfo.nickname || userInfo.username || '未设置昵称' }}</text>
          <text class="profile-subtitle">资料完整一些，交易沟通会更顺畅</text>
          <view class="profile-tags">
            <view class="profile-tag primary">
              <text>用户名 {{ userInfo.username || '未设置' }}</text>
            </view>
            <view class="profile-tag" v-if="userInfo.studentId">
              <text>已绑定学号</text>
            </view>
            <view class="profile-tag" v-else>
              <text>待完善学号</text>
            </view>
          </view>
        </view>
      </view>
      <text class="avatar-tip">点击头像可更换</text>
    </view>

    <!-- 用户信息表单 -->
    <view class="info-form form-animate" :class="{ 'form-visible': isFormVisible }">
      <view class="form-header">
        <text class="form-title">基础资料</text>
        <text class="form-desc">带箭头的字段可直接修改</text>
      </view>
      <view
        class="form-item item-animate"
        :class="{ 'item-visible': isFormVisible }"
        :style="{ '--item-index': 0 }"
      >
        <view class="label-group">
          <text class="label">用户名</text>
          <text class="hint">账号唯一标识</text>
        </view>
        <text class="value">{{ userInfo.username || '未设置' }}</text>
      </view>
      <view
        class="form-item item-animate"
        :class="{ 'item-visible': isFormVisible }"
        :style="{ '--item-index': 1 }"
        @click="editNickname"
      >
        <view class="label-group">
          <text class="label">昵称</text>
          <text class="hint">展示在个人主页和聊天中</text>
        </view>
        <view class="value-row">
          <text class="value">{{ userInfo.nickname || '未设置' }}</text>
          <uni-icons type="right" size="14" :color="primaryColor" />
        </view>
      </view>
      <view
        class="form-item item-animate"
        :class="{ 'item-visible': isFormVisible }"
        :style="{ '--item-index': 2 }"
        @click="editPhone"
      >
        <view class="label-group">
          <text class="label">手机号</text>
          <text class="hint">用于登录和交易联系</text>
        </view>
        <view class="value-row">
          <text class="value">{{ userInfo.phone ? maskPhone(userInfo.phone) : '未绑定' }}</text>
          <uni-icons type="right" size="14" :color="primaryColor" />
        </view>
      </view>
      <view
        class="form-item item-animate"
        :class="{ 'item-visible': isFormVisible }"
        :style="{ '--item-index': 3 }"
        @click="editStudentId"
      >
        <view class="label-group">
          <text class="label">学号</text>
          <text class="hint">校园身份认证信息</text>
        </view>
        <view class="value-row">
          <text class="value">{{ userInfo.studentId || '未认证' }}</text>
          <uni-icons type="right" size="14" :color="primaryColor" />
        </view>
      </view>
      <view
        class="form-item item-animate"
        :class="{ 'item-visible': isFormVisible }"
        :style="{ '--item-index': 4 }"
        @click="editCollege"
      >
        <view class="label-group">
          <text class="label">学院</text>
          <text class="hint">帮助同校同院用户识别你</text>
        </view>
        <view class="value-row">
          <text class="value">{{ userInfo.college || '未设置' }}</text>
          <uni-icons type="right" size="14" :color="primaryColor" />
        </view>
      </view>
      <view
        class="form-item item-animate"
        :class="{ 'item-visible': isFormVisible }"
        :style="{ '--item-index': 5 }"
        @click="editMajor"
      >
        <view class="label-group">
          <text class="label">专业</text>
          <text class="hint">完善后主页信息更完整</text>
        </view>
        <view class="value-row">
          <text class="value">{{ userInfo.major || '未设置' }}</text>
          <uni-icons type="right" size="14" :color="primaryColor" />
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import { useThemeStyle, useThemeColors } from '@/utils/theme'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()
const userStore = useUserStore()
const userInfo = ref<any>({})

// 动画控制
const animateClass = ref('')
const isHeaderVisible = ref(false)
const isAvatarVisible = ref(false)
const isFormVisible = ref(false)

onMounted(() => {
  // 先显示现有数据
  userInfo.value = { ...userStore.userInfo }
  console.log('[Profile] onMounted - 初始化 userInfo:', userInfo.value)

  // 异步刷新最新数据（不阻塞页面渲染）
  refreshUserInfo().then(() => {
    // 刷新成功后更新显示
    userInfo.value = { ...userStore.userInfo }
    console.log('[Profile] 刷新后的 userInfo:', userInfo.value)
  })

  // 触发页面整体进入动画
  setTimeout(() => {
    animateClass.value = 'animate-in'
  }, 50)

  // 依次触发各个区块的动画
  setTimeout(() => {
    isHeaderVisible.value = true
  }, 100)

  setTimeout(() => {
    isAvatarVisible.value = true
  }, 200)

  setTimeout(() => {
    isFormVisible.value = true
  }, 300)
})

// 监听 store 中 userInfo 的变化，同步更新本地 userInfo
watch(
  () => userStore.userInfo,
  (newUserInfo) => {
    console.log('[Profile] watch - store userInfo 变化:', newUserInfo)
    userInfo.value = { ...newUserInfo }
  },
  { deep: true }
)

function goBack() {
  uni.navigateBack()
}

/**
 * 刷新用户信息
 * 从后端获取最新的用户数据并更新到 store
 */
async function refreshUserInfo() {
  try {
    const res = await userApi.getUserInfo()
    if (res.data) {
      console.log('[Profile] 刷新用户信息成功:', res.data)
      userStore.setUserInfo(res.data)
    }
  } catch (error) {
    console.error('[Profile] 刷新用户信息失败:', error)
  }
}

// 手机号脱敏
function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 更换头像
function changeAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const filePath = res.tempFilePaths[0]
      uploadAvatar(filePath)
    }
  })
}

function uploadAvatar(filePath: string) {
  console.log('[Profile] 开始上传头像:', filePath)
  userApi
    .uploadAvatar(filePath)
    .then((res: any) => {
      console.log('[Profile] 上传头像返回结果:', res)
      console.log('[Profile] 返回结果类型:', typeof res)

      const avatarUrl = res?.url || ''
      if (!avatarUrl) {
        console.warn('[Profile] 无法解析头像URL:', res)
        uni.showToast({ title: '头像上传失败', icon: 'none' })
        return
      }

      console.log('[Profile] 解析到的头像URL:', avatarUrl)

      // 更新本地状态
      userInfo.value.avatar = avatarUrl
      userStore.updateUserInfo({ avatar: avatarUrl })

      console.log('[Profile] 更新后的 userInfo:', userInfo.value)
      console.log('[Profile] 更新后的 store:', userStore.userInfo)

      uni.showToast({ title: '头像更新成功', icon: 'success' })
    })
    .catch((err: any) => {
      console.error('[Profile] 上传头像失败:', err)
      uni.showToast({ title: '头像上传失败', icon: 'none' })
    })
}

// 编辑昵称
function editNickname() {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: userInfo.value.nickname || '',
    success: (res) => {
      if (res.confirm && res.content) {
        updateUserInfo({ nickname: res.content })
      }
    }
  })
}

// 编辑手机号
function editPhone() {
  uni.navigateTo({
    url: '/pages/mine/bind-phone'
  })
}

// 编辑学号
function editStudentId() {
  uni.navigateTo({
    url: '/pages/mine/auth-center'
  })
}

// 编辑学院
function editCollege() {
  uni.showModal({
    title: '修改学院',
    editable: true,
    placeholderText: userInfo.value.college || '',
    success: (res) => {
      if (res.confirm && res.content) {
        updateUserInfo({ college: res.content })
      }
    }
  })
}

// 编辑专业
function editMajor() {
  uni.showModal({
    title: '修改专业',
    editable: true,
    placeholderText: userInfo.value.major || '',
    success: (res) => {
      if (res.confirm && res.content) {
        updateUserInfo({ major: res.content })
      }
    }
  })
}

// 更新用户信息
function updateUserInfo(data: any) {
  userApi
    .updateUserInfo(data)
    .then((res: any) => {
      userInfo.value = { ...userInfo.value, ...res }
      userStore.updateUserInfo(res)
      uni.showToast({ title: '更新成功', icon: 'success' })
    })
    .catch(() => {})
}
</script>

<style lang="scss" scoped>
/* ========== 页面整体入场动画 ========== */
.profile-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  opacity: 0;

  &.animate-in {
    animation: pageFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
}

@keyframes pageFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* ========== 头部背景动画 ========== */
.header-bg {
  height: 320rpx;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.28) 0, rgba(255, 255, 255, 0) 34%),
    linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 55%, #9fd2ff 100%);
  position: relative;
  overflow: hidden;

  .header-glow {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    filter: blur(6rpx);
  }

  .glow-left {
    width: 220rpx;
    height: 220rpx;
    top: 36rpx;
    left: -48rpx;
  }

  .glow-right {
    width: 280rpx;
    height: 280rpx;
    right: -72rpx;
    bottom: -90rpx;
  }

  &.header-animate {
    opacity: 0;
    transform: translateY(-30rpx);

    &.header-visible {
      animation: headerSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  }

}

@keyframes headerSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-30rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* ========== 资料卡动画 ========== */
.profile-hero {
  margin: -112rpx 24rpx 28rpx;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;

  &.avatar-animate {
    opacity: 0;
    transform: scale(0.5) translateY(30rpx);

    &.avatar-visible {
      animation: avatarPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  }

  .profile-card {
    width: 100%;
    padding: 32rpx 28rpx 28rpx;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 18rpx 40rpx rgba(61, 123, 183, 0.12);
    backdrop-filter: blur(12rpx);
    display: flex;
    align-items: center;
    gap: 24rpx;
  }

  .avatar-shell {
    position: relative;
    width: 132rpx;
    height: 132rpx;
    padding: 8rpx;
    border-radius: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(232, 242, 255, 0.98) 100%);
    box-shadow: 0 10rpx 24rpx rgba(93, 146, 194, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .avatar-edit-badge {
    position: absolute;
    right: 2rpx;
    bottom: 2rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid #fff;
  }

  .profile-meta {
    flex: 1;
    min-width: 0;
  }

  .profile-name {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-color-primary);
    line-height: 1.2;
    margin-bottom: 10rpx;
  }

  .profile-subtitle {
    display: block;
    font-size: 24rpx;
    color: var(--text-color-secondary);
    line-height: 1.5;
    margin-bottom: 16rpx;
  }

  .profile-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  .profile-tag {
    padding: 8rpx 16rpx;
    border-radius: 999rpx;
    background: rgba(120, 173, 228, 0.12);
    color: var(--text-color-secondary);
    font-size: 22rpx;
    line-height: 1;

    &.primary {
      background: rgba(86, 159, 222, 0.16);
      color: var(--primary-color);
      font-weight: 600;
    }
  }

  .avatar-tip {
    margin-top: 18rpx;
    font-size: 24rpx;
    color: rgba(86, 123, 158, 0.9);
    opacity: 0;
  }

  &.avatar-visible .avatar-tip {
    animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    animation-delay: 0.3s;
  }
}

@keyframes avatarPopIn {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(30rpx);
  }
  60% {
    transform: scale(1.05) translateY(-5rpx);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(10rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 表单区域动画 ========== */
.info-form {
  background: var(--bg-color-card);
  margin: 0 24rpx 16rpx;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 32rpx rgba(26, 66, 109, 0.06);

  .form-header {
    padding: 26rpx 28rpx 18rpx;
    background: linear-gradient(180deg, rgba(134, 190, 237, 0.12) 0%, rgba(255, 255, 255, 0) 100%);
  }

  .form-title {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: var(--text-color-primary);
    margin-bottom: 6rpx;
  }

  .form-desc {
    display: block;
    font-size: 22rpx;
    color: var(--text-color-tertiary);
  }

  &.form-animate {
    opacity: 0;
    transform: translateY(30rpx);

    &.form-visible {
      animation: formSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  }

  .form-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 28rpx;
    border-bottom: 1px solid rgba(112, 146, 182, 0.12);
    position: relative;
    gap: 24rpx;

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

    &:active {
      background: linear-gradient(90deg, rgba(120, 173, 228, 0.08) 0%, transparent 100%);
    }

    .label-group {
      width: 224rpx;
      flex-shrink: 0;
    }

    .hint {
      display: block;
      margin-top: 8rpx;
      font-size: 22rpx;
      color: var(--text-color-tertiary);
      line-height: 1.4;
    }

    .label {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      font-weight: 600;
      display: block;
    }

    .value {
      flex: 1;
      font-size: var(--font-size-base);
      color: var(--text-color-secondary);
      text-align: right;
    }

    .value-row {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8rpx;

      .value {
        text-align: right;
        line-height: 1.4;
      }

      .uni-icons {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    &:active .value-row .uni-icons {
      transform: translateX(4rpx);
    }
  }
}

@keyframes formSlideIn {
  0% {
    opacity: 0;
    transform: translateY(30rpx) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
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
</style>
