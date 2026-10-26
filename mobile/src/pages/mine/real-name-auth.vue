<template>
  <view class="real-name-auth-page page-animate" :class="{ 'animate-in': isAnimated }">
    <!-- 实名认证表单 -->
    <!-- TODO: 日后优化 -->
    <!-- - 添加身份证OCR识别功能 -->
    <!-- - 增加姓名和身份证号的实时格式校验 -->
    <!-- - 支持从相册选择身份证照片自动填充 -->
    <!-- - 添加认证历史记录查看 -->
    <!-- - 支持修改已认证信息的申请流程 -->
    <!-- 认证状态 -->
    <view class="status-card" :class="'status-' + verificationStatus">
      <uni-icons :type="statusIcon" size="48" :color="statusColor" />
      <text class="status-text">{{ statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 认证表单 -->
    <view v-if="canEdit" class="form-section">
      <view class="form-title">实名认证信息</view>
      <view class="form-tip">请填写真实身份信息，确保与身份证一致</view>

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

      <button class="submit-btn" @click="handleSubmit">提交认证</button>

      <view class="security-tip">
        <uni-icons type="info" size="16" color="#AAAAAA" />
        <text>您的信息将加密存储，仅用于身份验证</text>
      </view>
    </view>

    <!-- 已认证信息 -->
    <view v-else-if="verificationStatus === 'verified' && verifiedInfo" class="info-section">
      <view class="info-item">
        <text class="info-label">真实姓名</text>
        <text class="info-value">{{ maskName(verifiedInfo.realName) }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">身份证号</text>
        <text class="info-value">{{ maskIdCard(verifiedInfo.idCard) }}</text>
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
import type { RealNameAuth } from '@/types'
import validator from '@/utils/validator'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { onShow } from '@dcloudio/uni-app'

useServiceNavigation()
const { primaryColor, successColor, dangerColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

// 页面进入动画状态
const isAnimated = ref(false)

const verificationStatus = ref<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified')
const verifiedInfo = ref<RealNameAuth | null>(null)

const form = ref({
  realName: '',
  idCard: ''
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
    unverified: '#AAAAAA',
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
    unverified: '完成实名认证，提高账户安全性',
    pending: '您的认证信息正在审核中',
    verified: '实名认证已完成',
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
    const res = await userApi.getRealNameAuth()
    if (res.data) {
      const auth = res.data
      if (auth.status === 2) {
        verificationStatus.value = 'verified'
        verifiedInfo.value = auth
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

  // 提交认证
  userApi
    .verifyRealName({
      realName: form.value.realName,
      idCard: form.value.idCard
    })
    .then(() => {
      verificationStatus.value = 'pending'
      uni.showToast({ title: '提交成功，请等待审核', icon: 'success' })
    })
    .catch(() => {})
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

.real-name-auth-page {
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
