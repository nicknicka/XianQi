<template>
  <view class="auth-center-page page-animate service-redesign-page" :class="{ 'animate-in': isAnimated }">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">身份认证</text>
      <text class="page-desc">完成认证，享受更多平台权益</text>
    </view>

    <!-- 实名认证卡片 -->
    <!-- TODO: 日后优化 -->
    <!-- - 添加认证进度指示 -->
    <!-- - 支持OCR识别身份证自动填充 -->
    <!-- - 添加认证指引和帮助文档入口 -->
    <view class="auth-card card-clickable" @click="goToRealNameAuth">
      <view class="card-header">
        <view class="header-left">
          <uni-icons type="person" size="24" :color="primaryColor" />
          <text class="card-title">实名认证</text>
        </view>
        <view class="status-badge" :class="'status-' + realNameStatus">
          <text class="status-text">{{ realNameStatusText }}</text>
          <uni-icons type="right" size="16" color="#AAAAAA" />
        </view>
      </view>
      <view class="card-content">
        <text class="card-desc">验证真实身份，提高账户安全性</text>
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

    <!-- 学生认证卡片 -->
    <!-- TODO: 日后优化 -->
    <!-- - 添加学号自动验证功能（对接教务系统） -->
    <!-- - 支持多页学生证图片上传 -->
    <!-- - 添加认证失败原因的详细说明和引导 -->
    <!-- - 支持校友认证扩展 -->
    <view class="auth-card card-clickable" @click="goToStudentAuth">
      <view class="card-header">
        <view class="header-left">
          <uni-icons type="calendar" size="24" :color="primaryColor" />
          <text class="card-title">学生认证</text>
        </view>
        <view class="status-badge" :class="'status-' + studentStatus">
          <text class="status-text">{{ studentStatusText }}</text>
          <uni-icons type="right" size="16" color="#AAAAAA" />
        </view>
      </view>
      <view class="card-content">
        <text class="card-desc">验证在校学生身份，享受专属权益</text>
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

    <!-- 认证权益说明 -->
    <view class="benefits-section">
      <view class="section-title">
        <uni-icons type="gift" size="20" :color="primaryColor" />
        <text>认证权益</text>
      </view>
      <view class="benefit-list">
        <view class="benefit-item">
          <uni-icons type="checkmarkempty" size="18" color="var(--success-color)" />
          <text>实名认证：提高账户安全性，支持发布商品</text>
        </view>
        <view class="benefit-item">
          <uni-icons type="checkmarkempty" size="18" color="var(--success-color)" />
          <text>学生认证：享受学生专属优惠和活动</text>
        </view>
        <view class="benefit-item">
          <uni-icons type="checkmarkempty" size="18" color="var(--success-color)" />
          <text>双认证完成：提升信用等级，增加交易信任</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userApi } from '@/api/user'
import type { RealNameAuth, StudentAuth } from '@/types'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import {useThemeColors, useThemePage, useThemeStyle} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

useServiceNavigation()

const { primaryColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

// 页面进入动画状态
const isAnimated = ref(false)

// 实名认证状态: unverified-未认证, pending-审核中, verified-已认证, rejected-认证失败
const realNameStatus = ref<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified')
const realNameAuthInfo = ref<RealNameAuth | null>(null)

// 学生认证状态: unverified-未认证, pending-审核中, verified-已认证, rejected-认证失败
const studentStatus = ref<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified')
const studentAuthInfo = ref<StudentAuth | null>(null)

const realNameStatusText = computed(() => {
  const texts = {
    unverified: '去认证',
    pending: '审核中',
    verified: '已认证',
    rejected: '重新认证'
  }
  return texts[realNameStatus.value]
})

const studentStatusText = computed(() => {
  const texts = {
    unverified: '去认证',
    pending: '审核中',
    verified: '已认证',
    rejected: '重新认证'
  }
  return texts[studentStatus.value]
})

onShow(() => {
  useThemePage()
})


onMounted(() => {
  loadAuthStatus()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

async function loadAuthStatus() {
  try {
    // 并行加载两种认证状态
    const [realNameData, studentData] = await Promise.allSettled([
      userApi.getRealNameAuth(),
      userApi.getStudentAuth()
    ])

    // 处理实名认证状态
    if (realNameData.status === 'fulfilled' && realNameData.value.data) {
      const auth = realNameData.value.data
      if (auth.status === 2) {
        realNameStatus.value = 'verified'
        realNameAuthInfo.value = auth
      } else if (auth.status === 1) {
        realNameStatus.value = 'pending'
      } else if (auth.status === 3) {
        realNameStatus.value = 'rejected'
        realNameAuthInfo.value = auth
      }
    }

    // 处理学生认证状态
    if (studentData.status === 'fulfilled' && studentData.value.data) {
      const auth = studentData.value.data
      if (auth.status === 2) {
        studentStatus.value = 'verified'
        studentAuthInfo.value = auth
      } else if (auth.status === 1) {
        studentStatus.value = 'pending'
      } else if (auth.status === 3) {
        studentStatus.value = 'rejected'
        studentAuthInfo.value = auth
      }
    }
  } catch (error) {
    console.error('加载认证状态失败:', error)
  }
}

function goToRealNameAuth() {
  // 添加点击反馈延迟，让动画效果更明显
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/mine/real-name-auth',
      animationType: 'slide-in-bottom',
      animationDuration: 350
    })
  }, 100)
}

function goToStudentAuth() {
  // 添加点击反馈延迟，让动画效果更明显
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/mine/student-auth',
      animationType: 'slide-in-bottom',
      animationDuration: 350
    })
  }, 100)
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

// 卡片点击缩放动画
@keyframes cardClickScale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.97);
  }
  100% {
    transform: scale(1);
  }
}

// 卡片进入动画（延迟出现）
@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
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

.auth-center-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.page-header {
  padding: 32rpx 0;
  text-align: center;
  animation: cardSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.auth-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  opacity: 0;
  animation: cardSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  // 第二个卡片延迟出现
  &:nth-of-type(2) {
    animation-delay: 0.1s;
  }

  // 点击效果
  &.card-clickable {
    cursor: pointer;

    &:active {
      transform: scale(0.97);
      box-shadow: 0 2rpx 12rpx var(--primary-color-alpha-15);
    }
  }

  // 悬浮效果（H5端）
  @media (min-width: 768px) {
    &:hover {
      transform: translateY(-4rpx);
      box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.08);
    }
  }

  // 装饰性渐变边框效果
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.card-clickable:active::before {
    opacity: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .card-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-color-primary);
      }
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .status-text {
        font-size: var(--font-size-sm);

        .status-unverified & {
          color: var(--text-color-tertiary);
        }

        .status-pending & {
          color: var(--primary-color);
        }

        .status-verified & {
          color: var(--success-color);
        }

        .status-rejected & {
          color: var(--error-color);
        }
      }
    }
  }

  .card-content {
    .card-desc {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
      margin-bottom: 16rpx;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12rpx 0;
      font-size: var(--font-size-sm);

      .info-label {
        color: var(--text-color-tertiary);
      }

      .info-value {
        color: var(--text-color-primary);
      }
    }
  }
}

.benefits-section {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 32rpx;
  margin-top: 24rpx;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-color-primary);
    margin-bottom: 24rpx;
  }

  .benefit-list {
    .benefit-item {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 16rpx 0;
      font-size: var(--font-size-base);
      color: var(--text-color-secondary);
    }
  }
}
</style>
