<template>
  <view class="real-name-auth-page page-animate" :class="{ 'animate-in': isAnimated }">
    <!-- 实名认证表单 -->
    <!-- TODO: 日后优化 -->
    <!-- - 添加身份证OCR识别功能 -->
    <!-- - 支持从相册选择身份证照片自动填充 -->
    <!-- - 添加认证历史记录查看 -->
    <!-- - 支持修改已认证信息的申请流程 -->
    <AuthStatusPanel
      class="page-status-panel"
      :icon="authState.icon"
      :label="authState.label"
      :description="authState.description"
      :semantic-color="authState.semanticColor"
    />

    <!-- 认证表单 -->
    <view v-if="authState.editable" class="form-section">
      <view class="form-title">实名认证信息</view>
      <view class="form-tip">请填写真实身份信息，确保与身份证一致</view>

      <AuthFormField
        v-model="form.realName"
        label="真实姓名"
        placeholder="请输入真实姓名"
        :error="visibleFieldErrors.realName"
        :success="fieldValidationState('realName') === 'success' ? '格式正确' : undefined"
        @blur="markFieldTouched('realName')"
      />

      <AuthFormField
        v-model="form.idCard"
        label="身份证号"
        placeholder="请输入身份证号"
        :maxlength="18"
        :error="visibleFieldErrors.idCard"
        :success="fieldValidationState('idCard') === 'success' ? '格式正确' : undefined"
        @blur="markFieldTouched('idCard')"
      />

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
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { onShow } from '@dcloudio/uni-app'
import { resolveAuthState, type AuthenticationState } from '@/utils/auth/auth-state'
import { getRealNameFieldError, type RealNameFormField } from '@/utils/auth/real-name-validation'
import AuthStatusPanel from '@/components/auth/AuthStatusPanel.vue'
import AuthFormField from '@/components/auth/AuthFormField.vue'

useServiceNavigation()
const { textColorTertiary } = useThemeColors()

// 页面进入动画状态
const isAnimated = ref(false)

const authState = ref<AuthenticationState>(resolveAuthState('real-name'))
const verifiedInfo = ref<RealNameAuth | null>(null)

const form = ref({
  realName: '',
  idCard: ''
})

const touchedFields = ref<Record<RealNameFormField, boolean>>({
  realName: false,
  idCard: false
})

const fieldErrors = computed<Record<RealNameFormField, string | null>>(() => ({
  realName: getRealNameFieldError('realName', form.value.realName),
  idCard: getRealNameFieldError('idCard', form.value.idCard)
}))

const visibleFieldErrors = computed<Record<RealNameFormField, string | undefined>>(() => ({
  realName: touchedFields.value.realName ? fieldErrors.value.realName || undefined : undefined,
  idCard: touchedFields.value.idCard ? fieldErrors.value.idCard || undefined : undefined
}))

function fieldValidationState(field: RealNameFormField): 'error' | 'success' | undefined {
  if (!touchedFields.value[field]) return undefined
  return fieldErrors.value[field] ? 'error' : 'success'
}

function markFieldTouched(field: RealNameFormField) {
  touchedFields.value[field] = true
}

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
    authState.value = resolveAuthState('real-name', auth?.status, {
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

  touchedFields.value = {
    realName: true,
    idCard: true
  }

  if (fieldErrors.value.realName || fieldErrors.value.idCard) {
    return
  }

  // 提交认证
  userApi
    .verifyRealName({
      realName: form.value.realName,
      idCard: form.value.idCard
    })
    .then(() => {
      authState.value = resolveAuthState('real-name', 1)
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
  padding-bottom: calc(var(--auth-page-padding) + env(safe-area-inset-bottom));
}

.page-status-panel {
  animation: pageSlideInUp var(--motion-duration-slow) var(--motion-ease-standard) forwards;
  animation-delay: var(--motion-delay-fast);
  opacity: 0;
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
