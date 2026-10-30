<template>
  <view class="auth-center-page page-animate service-redesign-page" :class="{ 'animate-in': isAnimated }" :style="themeStyle">
    <view class="page-header">
      <text class="page-title">身份认证</text>
      <text class="page-desc">完成认证，享受更多平台权益</text>
    </view>

    <view class="auth-card card-clickable" @click="goToRealNameAuth">
      <view class="card-header">
        <view class="header-left">
          <uni-icons type="person" :size="AUTH_ICON_SIZES.card" :color="primaryColor" />
          <text class="card-title">实名认证</text>
        </view>
        <view class="status-badge" :class="'status-' + realNameState.pageStatus">
          <text class="status-text">{{ realNameState.actionLabel }}</text>
          <uni-icons type="right" :size="AUTH_ICON_SIZES.inline" :color="textColorTertiary" />
        </view>
      </view>
      <view class="card-content">
        <text class="card-desc">{{ realNameState.description }}</text>
        <view class="info-row" v-if="realNameAuthInfo?.realName">
          <text class="info-label">已认证姓名</text>
          <text class="info-value">{{ maskName(realNameAuthInfo.realName) }}</text>
        </view>
        <view class="info-row" v-if="realNameAuthInfo?.idCard">
          <text class="info-label">身份证号</text>
          <text class="info-value">{{ maskIdCard(realNameAuthInfo.idCard) }}</text>
        </view>
        <view class="info-row" v-if="realNameAuthInfo?.auditedAt">
          <text class="info-label">认证时间</text>
          <text class="info-value">{{ realNameAuthInfo.auditedAt }}</text>
        </view>
      </view>
    </view>

    <view class="auth-card card-clickable" :class="{ 'card-locked': studentCard.locked }" @click="handleStudentCardClick">
      <view class="card-header">
        <view class="header-left">
          <uni-icons :type="studentCard.icon" :size="AUTH_ICON_SIZES.card" :color="studentStatusColor" />
          <text class="card-title">学生认证</text>
        </view>
        <view
          class="status-badge"
          :class="studentCard.locked ? 'status-locked' : 'status-' + studentCard.status.pageStatus"
        >
          <text class="status-text">{{ studentCard.actionLabel }}</text>
          <uni-icons :type="studentCard.locked ? 'locked' : 'right'" :size="AUTH_ICON_SIZES.inline" :color="studentStatusColor" />
        </view>
      </view>
      <view class="card-content">
        <text class="card-desc">{{ studentCard.description }}</text>
        <view class="info-row" v-if="studentAuthInfo?.studentId">
          <text class="info-label">已认证学号</text>
          <text class="info-value">{{ studentAuthInfo.studentId }}</text>
        </view>
        <view class="info-row" v-if="studentAuthInfo?.college">
          <text class="info-label">学院</text>
          <text class="info-value">{{ studentAuthInfo.college }}</text>
        </view>
        <view class="info-row" v-if="studentAuthInfo?.major">
          <text class="info-label">专业</text>
          <text class="info-value">{{ studentAuthInfo.major }}</text>
        </view>
        <view class="info-row" v-if="studentAuthInfo?.auditedAt">
          <text class="info-label">认证时间</text>
          <text class="info-value">{{ studentAuthInfo.auditedAt }}</text>
        </view>
      </view>
    </view>

    <view class="benefits-section">
      <view class="section-title">
        <uni-icons type="gift" :size="AUTH_ICON_SIZES.section" :color="primaryColor" />
        <text>认证权益</text>
      </view>
      <view class="benefit-list">
        <view class="benefit-item">
          <uni-icons type="checkmarkempty" :size="AUTH_ICON_SIZES.benefit" :color="successColor" />
          <text>实名认证：提高账户安全性，支持发布商品</text>
        </view>
        <view class="benefit-item">
          <uni-icons type="checkmarkempty" :size="AUTH_ICON_SIZES.benefit" :color="successColor" />
          <text>学生认证：享受学生专属优惠和活动</text>
        </view>
        <view class="benefit-item">
          <uni-icons type="checkmarkempty" :size="AUTH_ICON_SIZES.benefit" :color="successColor" />
          <text>双认证完成：提升信用等级，增加交易信任</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userApi } from '@/api/user'
import type { RealNameAuth, StudentAuth } from '@/types'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { useThemeColors, useThemePage, useThemeStyle } from '@/utils/theme'
import { AUTH_ICON_SIZES } from '@/utils/auth/auth-tokens'
import {
  resolveAuthState,
  resolveStudentAuthCenterState,
  type AuthenticationState
} from '@/utils/auth/auth-state'

useServiceNavigation()

const { primaryColor, successColor, dangerColor, infoColor, textColorTertiary } = useThemeColors()
const { themeStyle } = useThemeStyle()

const isAnimated = ref(false)
const realNameAuthInfo = ref<RealNameAuth | null>(null)
const studentAuthInfo = ref<StudentAuth | null>(null)

const realNameState = computed<AuthenticationState>(() =>
  resolveAuthState(realNameAuthInfo.value?.status, {
    rejectReason: realNameAuthInfo.value?.rejectReason
  })
)
const studentState = computed<AuthenticationState>(() =>
  resolveAuthState(studentAuthInfo.value?.status, {
    rejectReason: studentAuthInfo.value?.rejectReason
  })
)
const studentCard = computed(() =>
  resolveStudentAuthCenterState(studentState.value, realNameState.value)
)

const authSemanticColors = {
  info: infoColor,
  primary: primaryColor,
  success: successColor,
  danger: dangerColor,
  neutral: textColorTertiary
} as const

const studentStatusColor = computed(() => authSemanticColors[studentCard.value.semanticColor])

onShow(() => {
  useThemePage()
  loadAuthStatus()
})

onMounted(() => {
  nextTick(() => {
    isAnimated.value = true
  })
})

async function loadAuthStatus() {
  const [realNameData, studentData] = await Promise.allSettled([
    userApi.getRealNameAuth(),
    userApi.getStudentAuth()
  ])

  if (realNameData.status === 'fulfilled') {
    realNameAuthInfo.value = realNameData.value.data ?? null
  } else {
    console.error('加载实名认证状态失败:', realNameData.reason)
  }

  if (studentData.status === 'fulfilled') {
    studentAuthInfo.value = studentData.value.data ?? null
  } else {
    console.error('加载学生认证状态失败:', studentData.reason)
  }
}

function handleStudentCardClick() {
  if (studentCard.value.target === 'real-name') {
    goToRealNameAuth()
    return
  }

  goToStudentAuth()
}

function goToRealNameAuth() {
  uni.navigateTo({ url: '/pages/mine/real-name-auth' })
}

function goToStudentAuth() {
  uni.navigateTo({ url: '/pages/mine/student-auth' })
}

function maskName(name: string) {
  if (!name) return ''
  if (name.length === 2) return name[0] + '*'
  if (name.length === 3) return name[0] + '*' + name[2]
  return name[0] + '**' + name[name.length - 1]
}

function maskIdCard(idCard: string) {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}
</script>

<style lang="scss" scoped>
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(var(--motion-distance-page));
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(var(--motion-distance-page));
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-animate {
  opacity: 0;

  &.animate-in {
    animation: pageSlideIn var(--motion-duration-slow) var(--motion-ease-standard) forwards;
  }
}

.auth-center-page {
  min-height: var(--auth-page-min-height);
  background: var(--bg-color-page);
  padding: var(--auth-page-padding);
  padding-bottom: calc(var(--auth-page-padding) + env(safe-area-inset-bottom));
}

.page-header {
  padding: var(--auth-card-padding) 0;
  text-align: center;
  animation: cardSlideIn var(--motion-duration-base) var(--motion-ease-standard) forwards;
}

.auth-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  padding: var(--auth-card-padding-lg);
  margin-bottom: var(--auth-section-gap);
  transition: box-shadow var(--motion-duration-fast) var(--motion-ease-standard);
  opacity: 0;
  animation: cardSlideIn var(--motion-duration-slow) var(--motion-ease-standard) forwards;

  &:nth-of-type(2) {
    animation-delay: var(--motion-delay-base);
  }

  &.card-clickable {
    cursor: pointer;

    &:active {
      box-shadow: var(--box-shadow-xs);
    }
  }

  &.card-locked {
    background: var(--bg-color-warm);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--auth-section-gap);

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--auth-label-gap);

    .card-title {
      font-size: var(--font-size-lg);
      font-weight: var(--auth-font-weight-semibold);
      color: var(--text-color-primary);
    }
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: var(--auth-tip-gap);

    .status-text {
      font-size: var(--font-size-sm);

      .status-unverified & {
        color: var(--info-color);
      }

      .status-pending & {
        color: var(--primary-color);
      }

      .status-verified & {
        color: var(--success-color);
      }

      .status-rejected & {
        color: var(--danger-color);
      }

      .status-locked & {
        color: var(--text-color-tertiary);
      }
    }
  }
}

.card-content {
  .card-desc {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
    margin-bottom: var(--auth-label-gap);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: var(--auth-label-gap) 0;
    font-size: var(--font-size-sm);

    .info-label {
      color: var(--text-color-tertiary);
    }

    .info-value {
      color: var(--text-color-primary);
    }
  }
}

.benefits-section {
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  padding: var(--auth-card-padding);
  margin-top: var(--auth-section-gap);

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--auth-tip-gap);
    font-size: var(--font-size-lg);
    font-weight: var(--auth-font-weight-semibold);
    color: var(--text-color-primary);
    margin-bottom: var(--auth-section-gap);
  }

  .benefit-list {
    .benefit-item {
      display: flex;
      align-items: center;
      gap: var(--auth-label-gap);
      padding: var(--auth-label-gap) 0;
      font-size: var(--font-size-base);
      color: var(--text-color-secondary);
    }
  }
}
</style>
