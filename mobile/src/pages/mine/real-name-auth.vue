<template>
  <view class="real-name-auth-page page-animate" :class="{ 'animate-in': isAnimated }">
    <!-- 实名认证表单 -->
    <!-- TODO: 日后优化 -->
    <!-- - 添加身份证OCR识别功能 -->
    <!-- - 支持从相册选择身份证照片自动填充 -->
    <!-- - 添加认证历史记录查看 -->
    <!-- - 支持修改已认证信息的申请流程 -->
    <!-- 认证状态 -->
    <view class="status-card" :class="'status-' + authState.pageStatus">
      <uni-icons :type="authState.icon" :size="AUTH_ICON_SIZES.status" :color="statusColor" />
      <text class="status-text">{{ authState.label }}</text>
      <text class="status-desc">{{ authState.description }}</text>
    </view>

    <!-- 认证表单 -->
    <view v-if="authState.editable" class="form-section">
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
        <uni-icons type="info" :size="AUTH_ICON_SIZES.inline" :color="textColorTertiary" />
        <text>您的信息将加密存储，仅用于身份验证</text>
      </view>
    </view>

    <!-- 已认证信息 -->
    <view v-else-if="authState.pageStatus === 'verified' && verifiedInfo" class="info-section">
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
import { useThemeColors, useThemePage } from '@/utils/theme'
import { ref, computed, onMounted } from 'vue'
import { userApi } from '@/api/user'
import {
  AUTH_ICON_SIZES,
  AUTH_PAGE_ANIMATION_DELAY_MS
} from '@/utils/auth/auth-tokens'
import type { RealNameAuth } from '@/types'
import validator from '@/utils/validator'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { onShow } from '@dcloudio/uni-app'
import { resolveAuthState, type AuthenticationState } from '@/utils/auth/auth-state'

useServiceNavigation()
const { primaryColor, successColor, dangerColor, infoColor, textColorTertiary } = useThemeColors()

// 页面进入动画状态
const isAnimated = ref(false)

const authState = ref<AuthenticationState>(resolveAuthState())
const verifiedInfo = ref<RealNameAuth | null>(null)

const form = ref({
  realName: '',
  idCard: ''
})

const statusColor = computed(() => {
  const semanticColors = {
    info: infoColor,
    primary: primaryColor,
    success: successColor,
    danger: dangerColor
  } as const
  return semanticColors[authState.value.semanticColor]
})

onShow(() => {
  useThemePage()
})

onMounted(() => {
  loadVerificationStatus()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, AUTH_PAGE_ANIMATION_DELAY_MS)
})

async function loadVerificationStatus() {
  try {
    const res = await userApi.getRealNameAuth()
    const auth = res.data
    authState.value = resolveAuthState(auth?.status, {
      rejectReason: auth?.rejectReason
    })
    if (authState.value.pageStatus === 'verified') {
      verifiedInfo.value = auth ?? null
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
  if (!authState.value.editable) {
    return
  }

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
      authState.value = resolveAuthState(1)
      verifiedInfo.value = null
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
    transform: translateY(var(--motion-distance-page));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 页面动画样式
.page-animate {
  opacity: 0;
  transform: translateY(var(--motion-distance-page));

  &.animate-in {
    animation: pageSlideInUp var(--motion-duration-base) var(--motion-ease-standard) forwards;
  }
}

.real-name-auth-page {
  min-height: var(--auth-page-min-height);
  background: var(--bg-color-page);
  padding: var(--auth-page-padding);
}

.status-card {
  animation: pageSlideInUp var(--motion-duration-slow) var(--motion-ease-standard) forwards;
  animation-delay: var(--motion-delay-fast);
  opacity: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--auth-card-padding-lg);
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  margin-bottom: var(--auth-section-gap);

  .status-text {
    font-size: var(--font-size-xl);
    font-weight: var(--auth-font-weight-semibold);
    color: var(--auth-status-color);
    margin: var(--auth-section-gap) 0 var(--auth-label-gap);
  }

  .status-desc {
    font-size: var(--font-size-base);
    color: var(--text-color-tertiary);
    text-align: center;
  }
}

.status-unverified {
  --auth-status-color: var(--info-color);
}

.status-pending {
  --auth-status-color: var(--primary-color);
}

.status-verified {
  --auth-status-color: var(--success-color);
}

.status-rejected {
  --auth-status-color: var(--danger-color);
}

.form-section {
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  padding: var(--auth-card-padding);

  .form-title {
    font-size: var(--font-size-lg);
    font-weight: var(--auth-font-weight-semibold);
    color: var(--text-color-primary);
    margin-bottom: var(--auth-tip-gap);
  }

  .form-tip {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
    margin-bottom: var(--auth-section-gap);
  }

  .form-item {
    margin-bottom: var(--auth-section-gap);

    .label {
      display: block;
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      margin-bottom: var(--auth-label-gap);
    }

    .input {
      width: 100%;
      height: var(--auth-control-height);
      padding: 0 var(--auth-control-padding-x);
      background: var(--bg-color-page);
      border-radius: var(--auth-control-radius);
      font-size: var(--font-size-base);
    }
  }

  .submit-btn {
    width: 100%;
    height: var(--auth-control-height);
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: var(--font-size-lg);
    border-radius: var(--auth-control-radius);
    border: none;
    margin-top: var(--auth-card-padding);
  }

  .security-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--auth-tip-gap);
    margin-top: var(--auth-section-gap);
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

.info-section {
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  padding: var(--auth-card-padding);

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: var(--auth-section-gap) 0;
    border-bottom: var(--auth-divider-width) solid var(--border-color-light);

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
