<template>
  <view class="verification-page">
    <!-- 认证状态 -->
    <view class="status-card" :class="'status-' + verificationStatus">
      <uni-icons :type="statusIcon" size="48" :color="statusColor" />
      <text class="status-text">{{ statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 认证表单 -->
    <view v-if="canEdit" class="form-section">
      <view class="form-title">实名认证信息</view>

      <view class="form-item">
        <text class="label">真实姓名</text>
        <input
          class="input"
          v-model="form.realName"
          placeholder="请输入真实姓名"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <view class="form-item">
        <text class="label">身份证号</text>
        <input
          class="input"
          v-model="form.idCard"
          placeholder="请输入身份证号"
          placeholder-style="color: var(--text-color-tertiary)"
          maxlength="18"
        />
      </view>

      <view class="form-item">
        <text class="label">学号</text>
        <input
          class="input"
          v-model="form.studentId"
          placeholder="请输入学号"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <view class="upload-section">
        <text class="label">学生证正面</text>
        <view class="upload-box" @click="uploadFront">
          <image v-if="form.frontImage" class="preview-image" :src="form.frontImage" mode="aspectFill" />
          <view v-else class="upload-placeholder">
            <uni-icons type="camera" size="40" color="#AAAAAA" />
            <text class="upload-text">点击上传</text>
          </view>
        </view>
      </view>

      <view class="upload-section">
        <text class="label">学生证反面</text>
        <view class="upload-box" @click="uploadBack">
          <image v-if="form.backImage" class="preview-image" :src="form.backImage" mode="aspectFill" />
          <view v-else class="upload-placeholder">
            <uni-icons type="camera" size="40" color="#AAAAAA" />
            <text class="upload-text">点击上传</text>
          </view>
        </view>
      </view>

      <button class="submit-btn" @click="handleSubmit">提交认证</button>
    </view>

    <!-- 已认证信息 -->
    <view v-else-if="verificationStatus === 'verified'" class="info-section">
      <view class="info-item">
        <text class="info-label">真实姓名</text>
        <text class="info-value">{{ maskName(verifiedInfo.realName) }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">身份证号</text>
        <text class="info-value">{{ maskIdCard(verifiedInfo.idCard) }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">学号</text>
        <text class="info-value">{{ verifiedInfo.studentId }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">认证时间</text>
        <text class="info-value">{{ verifiedInfo.verifiedTime }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api/user'
import validator from '@/utils/validator'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { onShow } from '@dcloudio/uni-app'
import { useThemeColors, useThemePage, useThemeStyle } from '@/utils/theme'
import { uploadImage as uploadImageFile } from '@/utils/image'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const userStore = useUserStore()
const { primaryColor, successColor, dangerColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

const verificationStatus = ref<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified')
const verifiedInfo = ref<any>({})

const form = ref({
  realName: '',
  idCard: '',
  studentId: '',
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
    unverified: '完成实名认证，享受更多服务',
    pending: '您的认证信息正在审核中',
    verified: '您已通过实名认证',
    rejected: verifiedInfo.value.rejectReason || '认证失败，请重新提交'
  }
  return descs[verificationStatus.value]
})

onShow(() => {
  useThemePage()
})


onMounted(() => {
  loadVerificationStatus()
})

function loadVerificationStatus() {
  userApi.getUserInfo().then((res: any) => {
    if (res.isVerified) {
      verificationStatus.value = 'verified'
      verifiedInfo.value = res
    } else if (res.verificationStatus === 'pending') {
      verificationStatus.value = 'pending'
    } else if (res.verificationStatus === 'rejected') {
      verificationStatus.value = 'rejected'
      verifiedInfo.value = res
    }
  })
}

// 姓名脱敏
function maskName(name: string) {
  if (!name) return ''
  if (name.length === 2) return name[0] + '*'
  if (name.length === 3) return name[0] + '*' + name[2]
  return name[0] + '**' + name[name.length - 1]
}

// 身份证脱敏
function maskIdCard(idCard: string) {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
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
function uploadImage(filePath: string, type: 'front' | 'back') {
  uni.showLoading({ title: '上传中...' })

  uploadImageFile(filePath)
    .then((result) => {
      if (type === 'front') {
        form.value.frontImage = result.url
      } else {
        form.value.backImage = result.url
      }
      uni.hideLoading()
      uni.showToast({ title: '上传成功', icon: 'success' })
    })
    .catch(() => {
      uni.hideLoading()
      uni.showToast({ title: '上传失败', icon: 'none' })
    })
}

// 提交认证
function handleSubmit() {
  // 表单验证
  if (!form.value.realName) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return
  }
  if (!validator.isRealName(form.value.realName)) {
    uni.showToast({ title: '姓名格式不正确', icon: 'none' })
    return
  }
  if (!validator.isIdCard(form.value.idCard)) {
    uni.showToast({ title: '身份证号格式不正确', icon: 'none' })
    return
  }
  if (!validator.isStudentId(form.value.studentId)) {
    uni.showToast({ title: '学号格式不正确', icon: 'none' })
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

  // 提交认证
  userApi
    .verifyRealName({
      realName: form.value.realName,
      idCard: form.value.idCard,
      studentId: form.value.studentId,
      studentCardImages: [form.value.frontImage, form.value.backImage]
    })
    .then(() => {
      verificationStatus.value = 'pending'
      uni.showToast({ title: '提交成功，请等待审核', icon: 'success' })
    })
    .catch(() => {})
}
</script>

<style lang="scss" scoped>
.verification-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding: 24rpx;
}

.status-card {
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
