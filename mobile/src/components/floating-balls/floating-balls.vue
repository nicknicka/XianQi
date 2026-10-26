<template>
  <view class="floating-balls-container">
    <!-- 预览悬浮球 -->
    <view class="floating-ball preview" @tap="handlePreview" @longpress="showLabel('预览')">
      <view class="ball-icon">
        <uni-icons type="eye" size="22" color="#ffffff"></uni-icons>
      </view>
    </view>

    <!-- 保存草稿悬浮球 -->
    <view class="floating-ball save-draft" :class="{ saving: isSaving }" @tap="handleSaveDraft" @longpress="showLabel('保存草稿')">
      <view class="ball-icon">
        <image v-if="!isSaving" class="draft-icon" src="/static/icons/file.png" mode="aspectFit"></image>
        <view v-else class="saving-spinner"></view>
      </view>
    </view>

    <!-- 切换模式悬浮球 -->
    <view v-if="enableSwitchMode" class="floating-ball switch-mode" @tap="handleSwitchMode" @longpress="showSwitchLabel">
      <view class="ball-icon">
        <uni-icons type="reload" size="22" color="#ffffff"></uni-icons>
      </view>
    </view>

    <!-- 草稿箱悬浮球 -->
    <view class="floating-ball drafts" :class="{ 'show-success': saveSuccess }" @tap="handleDrafts" @longpress="showLabel('草稿箱')">
      <!-- 草稿数量徽章 -->
      <view class="ball-badge" v-if="draftCount > 0">
        <text class="badge-count">{{ draftCount > 99 ? '99+' : draftCount }}</text>
      </view>
      <!-- 保存成功提示 -->
      <view class="success-check" v-if="saveSuccess">
        <text class="check-icon">✓</text>
      </view>
      <view class="ball-icon" :class="{ 'icon-fade': saveSuccess }">
        <uni-icons type="compose" size="22" color="#ffffff"></uni-icons>
      </view>
    </view>

    <!-- 清空悬浮球 -->
    <view class="floating-ball reset" @tap="handleReset" @longpress="showLabel('清空')">
      <view class="ball-icon">
        <uni-icons type="trash" size="22" color="#ffffff"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
export default {
  options: {
    virtualHost: true,
    styleIsolation: 'shared'
  }
}
</script>

<script setup lang="ts">
interface Props {
  currentPage?: 'market' | 'share'
  draftCount?: number
  isSaving?: boolean
  saveSuccess?: boolean
  enableSwitchMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 'market',
  draftCount: 0,
  isSaving: false,
  saveSuccess: false,
  enableSwitchMode: true
})

const emit = defineEmits<{
  'switchMode': [mode: 'market' | 'share']
  'preview': []
  'reset': []
  'drafts': []
  'saveDraft': []
}>()

function handleSwitchMode() {
  // 根据当前页面切换到相反的模式
  const targetMode = props.currentPage === 'market' ? 'share' : 'market'
  emit('switchMode', targetMode)
}

function handlePreview() {
  emit('preview')
}

function handleReset() {
  emit('reset')
}

function handleSaveDraft() {
  emit('saveDraft')
}

function handleDrafts() {
  emit('drafts')
}

function showLabel(label: string) {
  uni.showToast({
    title: label,
    icon: 'none',
    duration: 1000
  })
}

function showSwitchLabel() {
  const label = props.currentPage === 'market' ? '切换到共享' : '切换到发布'
  showLabel(label)
}
</script>

<style lang="scss" scoped>
.floating-balls-container {
  position: fixed;
  right: 24rpx;
  bottom: 200rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  z-index: 10060;
  pointer-events: none;
}

/* #ifdef H5 */
@media (min-width: 560px) {
  .floating-balls-container {
    right: calc((100vw - 430px) / 2 - 62px);
  }
}
/* #endif */

.floating-balls-container .floating-ball {
  pointer-events: auto;
}

.floating-ball {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color, #8EC5E8) 0%, var(--primary-color-light, #B8DDF3) 100%);
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .ball-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInRight 0.4s ease-out both;
  flex-shrink: 0;

  // 为每个球添加不同的动画延迟
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
  &:nth-child(4) { animation-delay: 0.4s; }
  &:nth-child(5) { animation-delay: 0.5s; }

  &:active {
    transform: scale(0.9);
  }

  // 切换模式颜色
  &.switch-mode {
    background: linear-gradient(135deg, var(--success-color, #52C41A) 0%, var(--success-color, #52C41A) 100%);
    box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.4);
  }

  &.preview {
    background: linear-gradient(135deg, var(--info-color, #1890FF) 0%, var(--info-color, #1890FF) 100%);
    box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.4);
  }

  &.reset {
    background: linear-gradient(135deg, var(--danger-color, #FF4D4F) 0%, var(--danger-color, #FF4D4F) 100%);
    box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.4);
  }

  &.save-draft {
    background: linear-gradient(135deg, var(--warning-color, #FAAD14) 0%, var(--warning-color, #FAAD14) 100%);
    box-shadow: 0 8rpx 24rpx rgba(250, 173, 20, 0.4);

    .draft-icon {
      width: 44rpx;
      height: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .draft-text-icon {
      font-size: 24rpx;
      color: var(--text-color-inverse, #ffffff);
      font-weight: bold;
      line-height: 1;
    }

    // 保存中状态
    &.saving {
      animation: savingPulse 1s infinite;

      .saving-spinner {
        width: 22px;
        height: 22px;
        border: 3rpx solid rgba(255, 255, 255, 0.3);
        border-top-color: var(--text-color-inverse, #ffffff);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
  }

  &.drafts {
    background: linear-gradient(135deg, var(--info-color, #1890FF) 0%, var(--info-color, #1890FF) 100%);
    box-shadow: 0 8rpx 24rpx rgba(114, 46, 209, 0.4);

    // 保存成功提示
    .success-check {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
      animation: successPop 0.6s ease-out;

      .check-icon {
        font-size: 48rpx;
        color: var(--success-color, #52C41A);
        font-weight: bold;
        text-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.4);
      }
    }

    .icon-fade {
      opacity: 0.3;
    }

    &.show-success {
      animation: successBounce 0.6s ease-out;
    }
  }

  // 草稿数量徽章
  .ball-badge {
    position: absolute;
    top: -6rpx;
    right: -6rpx;
    min-width: 40rpx;
    height: 40rpx;
    padding: 0 8rpx;
    background: var(--danger-color, #FF4D4F);
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3rpx solid var(--text-color-inverse, #ffffff);
    box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
    animation: badgePulse 2s infinite;
    z-index: 1;

    .badge-count {
      font-size: 20rpx;
      color: var(--text-color-inverse, #ffffff);
      font-weight: bold;
    }
  }

}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes badgePulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes savingPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8rpx 24rpx rgba(250, 173, 20, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12rpx 32rpx rgba(250, 173, 20, 0.6);
  }
}

@keyframes successPop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes successBounce {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.15);
  }
  50% {
    transform: scale(0.95);
  }
  75% {
    transform: scale(1.05);
  }
}
</style>
