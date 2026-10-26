<template>
  <view class="student-auth-page page-animate" :class="{ 'animate-in': isAnimated }">
    <!-- 学生认证表单 -->
    <!-- TODO: 日后优化 -->
    <!-- - 添加学号自动验证（对接教务系统API） -->
    <!-- - 支持学生证正反面多图上传和预览 -->
    <!-- - 添加图片压缩和裁剪功能 -->
    <!-- - 支持学生证OCR识别自动填充信息 -->
    <!-- - 添加认证进度实时查询 -->
    <!-- - 支持校友身份认证扩展 -->
    <!-- - 开发管理员系统进行认证审核（管理端审核界面、审核状态管理、审核通知推送） -->
    <!-- 认证状态 -->
    <view class="status-card" :class="'status-' + verificationStatus">
      <uni-icons :type="statusIcon" size="48" :color="statusColor" />
      <text class="status-text">{{ statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 认证表单 -->
    <view v-if="canEdit" class="form-section">
      <view class="form-title">学生认证信息</view>
      <view class="form-tip">请填写学生信息并上传学生证照片</view>

      <view class="form-item">
        <text class="label">学号</text>
        <input
          class="input"
          v-model="form.studentId"
          placeholder="请输入学号"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <view class="form-item">
        <text class="label">学院</text>
        <input
          class="input"
          v-model="form.college"
          placeholder="请输入学院"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <view class="form-item">
        <text class="label">专业</text>
        <input
          class="input"
          v-model="form.major"
          placeholder="请输入专业"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <view class="upload-section">
        <text class="label">学生证正面</text>
        <view class="upload-box" @click="uploadFront">
          <image v-if="form.frontImage" class="preview-image" :src="form.frontImage" mode="aspectFit" />
          <view v-else class="upload-placeholder">
            <uni-icons type="camera" size="40" color="#AAAAAA" />
            <text class="upload-text">点击上传</text>
          </view>
        </view>
      </view>

      <view class="upload-section">
        <text class="label">学生证反面</text>
        <view class="upload-box" @click="uploadBack">
          <image v-if="form.backImage" class="preview-image" :src="form.backImage" mode="aspectFit" />
          <view v-else class="upload-placeholder">
            <uni-icons type="camera" size="40" color="#AAAAAA" />
            <text class="upload-text">点击上传</text>
          </view>
        </view>
      </view>

      <button class="submit-btn" @click="handleSubmit">提交认证</button>

      <view class="security-tip">
        <uni-icons type="info" size="16" color="#AAAAAA" />
        <text>请确保照片清晰，信息完整可见</text>
      </view>
    </view>

    <!-- 已认证信息 -->
    <view v-else-if="verificationStatus === 'verified' && verifiedInfo" class="info-section">
      <view class="info-item">
        <text class="info-label">学号</text>
        <text class="info-value">{{ verifiedInfo.studentId }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">学院</text>
        <text class="info-value">{{ verifiedInfo.college }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">专业</text>
        <text class="info-value">{{ verifiedInfo.major }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">认证时间</text>
        <text class="info-value">{{ verifiedInfo.auditedAt || '-' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeColors, useThemeStyle } from '@/utils/theme'
import { ref, computed, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { useUserStore } from '@/store/user'
import type { StudentAuth } from '@/types'
import validator from '@/utils/validator'
import { uploadImage as uploadImageFile } from '@/utils/image'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { onShow } from '@dcloudio/uni-app'

const userStore = useUserStore()
useServiceNavigation()
const { primaryColor, successColor, dangerColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

// 页面进入动画状态
const isAnimated = ref(false)

const verificationStatus = ref<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified')
const verifiedInfo = ref<StudentAuth | null>(null)

const form = ref({
  studentId: '',
  college: '',
  major: '',
  frontImage: '',
  backImage: ''
})

const canEdit = computed(() => {
  return verificationStatus.value === 'unverified' || verificationStatus.value === 'rejected'
})

const statusIcon = computed(() => {
  const icons = {
    unverified: 'info',
    pending: 'clock',
    verified: 'checkmarkempty',
    rejected: 'closeempty'
  }
  return icons[verificationStatus.value]
})

const statusColor = computed(() => {
  const colors = {
    unverified: '#999',
    pending: primaryColor,
    verified: successColor,
    rejected: dangerColor
  }
  return colors[verificationStatus.value]
})

const statusText = computed(() => {
  const texts = {
    unverified: '未认证',
    pending: '审核中',
    verified: '已认证',
    rejected: '认证失败'
  }
  return texts[verificationStatus.value]
})

const statusDesc = computed(() => {
  const descs = {
    unverified: '完成学生认证，享受校园专属权益',
    pending: '您的认证信息正在审核中',
    verified: '学生认证已完成',
    rejected: verifiedInfo.value?.rejectReason || '认证失败，请重新提交'
  }
  return descs[verificationStatus.value]
})

onShow(() => {
  useThemePage()
})


onMounted(() => {
  loadVerificationStatus()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

async function loadVerificationStatus() {
  try {
    const res = await userApi.getStudentAuth()
    if (res.data) {
      const auth = res.data
      if (auth.status === 2) {
        verificationStatus.value = 'verified'
        verifiedInfo.value = auth

        // 审核通过后，刷新用户信息以获取最新的学号、学院、专业
        await refreshUserInfo()
      } else if (auth.status === 1) {
        verificationStatus.value = 'pending'
      } else if (auth.status === 3) {
        verificationStatus.value = 'rejected'
        verifiedInfo.value = auth
      }
    }
  } catch (error) {
    console.error('加载认证状态失败:', error)
  }
}

// 上传学生证正面
function uploadFront() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      uploadImage(res.tempFilePaths[0], 'front')
    }
  })
}

// 上传学生证反面
function uploadBack() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      uploadImage(res.tempFilePaths[0], 'back')
    }
  })
}

// 上传图片
async function uploadImage(filePath: string, type: 'front' | 'back') {
  uni.showLoading({ title: '上传中...' })

  try {
    const result = await uploadImageFile(filePath)
    if (type === 'front') {
      form.value.frontImage = result.url
    } else {
      form.value.backImage = result.url
    }
    uni.hideLoading()
    uni.showToast({ title: '上传成功', icon: 'success' })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
}

// 提交认证
async function handleSubmit() {
  // 表单验证
  if (!form.value.studentId) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return
  }
  if (!validator.isStudentId(form.value.studentId)) {
    uni.showToast({ title: '学号格式不正确', icon: 'none' })
    return
  }
  if (!form.value.college) {
    uni.showToast({ title: '请输入学院', icon: 'none' })
    return
  }
  if (!form.value.major) {
    uni.showToast({ title: '请输入专业', icon: 'none' })
    return
  }
  if (!form.value.frontImage) {
    uni.showToast({ title: '请上传学生证正面', icon: 'none' })
    return
  }
  if (!form.value.backImage) {
    uni.showToast({ title: '请上传学生证反面', icon: 'none' })
    return
  }

  try {
    // 提交认证
    await userApi.verifyStudent({
      studentId: form.value.studentId,
      college: form.value.college,
      major: form.value.major,
      studentCardImages: [form.value.frontImage, form.value.backImage]
    })

    verificationStatus.value = 'pending'
    uni.showToast({ title: '提交成功，请等待审核', icon: 'success' })

    // 刷新用户信息以获取最新的学号、学院、专业
    await refreshUserInfo()
  } catch (error) {
    console.error('[StudentAuth] 提交认证失败:', error)
  }
}

/**
 * 刷新用户信息
 * 认证成功后，从后端获取最新的用户信息并更新到 store
 */
async function refreshUserInfo() {
  try {
    const res = await userApi.getUserInfo()
    if (res.data) {
      console.log('[StudentAuth] 刷新用户信息成功:', res.data)
      userStore.setUserInfo(res.data)
    }
  } catch (error) {
    console.error('[StudentAuth] 刷新用户信息失败:', error)
  }
}
</script>

<style lang="scss" scoped>
// 页面进入动画关键帧
@keyframes pageSlideInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 页面动画样式
.page-animate {
  opacity: 0;
  transform: translateY(40rpx);

  &.animate-in {
    animation: pageSlideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}

.student-auth-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding: 24rpx;
}

.status-card {
  animation: pageSlideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.05s;
  opacity: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx;
  background: var(--bg-color-card);
  border-radius: 16rpx;
  margin-bottom: 24rpx;

  .status-text {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-color-primary);
    margin: 24rpx 0 12rpx;
  }

  .status-desc {
    font-size: var(--font-size-base);
    color: var(--text-color-tertiary);
    text-align: center;
  }
}

.form-section {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 32rpx;

  .form-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-color-primary);
    margin-bottom: 8rpx;
  }

  .form-tip {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
    margin-bottom: 24rpx;
  }

  .form-item {
    margin-bottom: 24rpx;

    .label {
      display: block;
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      margin-bottom: 12rpx;
    }

    .input {
      width: 100%;
      height: 88rpx;
      padding: 0 24rpx;
      background: var(--bg-color-page);
      border-radius: 12rpx;
      font-size: var(--font-size-base);
    }
  }

  .upload-section {
    margin-bottom: 24rpx;

    .label {
      display: block;
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      margin-bottom: 12rpx;
    }

    .upload-box {
      width: 100%;
      height: 400rpx;
      background: var(--bg-color-page);
      border-radius: 12rpx;
      overflow: hidden;

      .preview-image {
        width: 100%;
        height: 100%;
      }

      .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;

        .upload-text {
          font-size: var(--font-size-sm);
          color: var(--text-color-tertiary);
          margin-top: 16rpx;
        }
      }
    }
  }

  .submit-btn {
    width: 100%;
    height: 88rpx;
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: var(--font-size-lg);
    border-radius: 12rpx;
    border: none;
    margin-top: 32rpx;
  }

  .security-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin-top: 24rpx;
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

.info-section {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 32rpx;

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: var(--font-size-base);
      color: var(--text-color-tertiary);
    }

    .info-value {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
    }
  }
}
</style>
