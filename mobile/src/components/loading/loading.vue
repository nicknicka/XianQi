<template>
  <view class="loading" :class="[`type-${type}`, `size-${size}`, customClass]" :style="customStyle">
    <!-- Spinner 加载 -->
    <view v-if="type === 'spinner'" class="loading-spinner">
      <view
        v-for="i in 12"
        :key="i"
        class="spinner-item"
        :style="{ transform: `rotate(${i * 30}deg) translate(0, -100%)` }"
      ></view>
    </view>

    <!-- Circular 加载 -->
    <view v-else-if="type === 'circular'" class="loading-circular">
      <svg class="circular-svg" viewBox="0 0 50 50">
        <circle
          class="circular-path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          :stroke="color"
          stroke-width="4"
        />
      </svg>
    </view>

    <!-- Pulse 加载 -->
    <view v-else-if="type === 'pulse'" class="loading-pulse">
      <view
        v-for="i in 3"
        :key="i"
        class="pulse-item"
        :style="{ animationDelay: `${i * 0.16}s` }"
      ></view>
    </view>

    <!-- Wave 加载 -->
    <view v-else-if="type === 'wave'" class="loading-wave">
      <view
        v-for="i in 5"
        :key="i"
        class="wave-item"
        :style="{ animationDelay: `${i * 0.1}s` }"
      ></view>
    </view>

    <!-- Dot 加载 -->
    <view v-else-if="type === 'dot'" class="loading-dot">
      <view
        v-for="i in 3"
        :key="i"
        class="dot-item"
        :style="{ animationDelay: `${i * 0.16}s` }"
      ></view>
    </view>

    <!-- Bar 加载 -->
    <view v-else-if="type === 'bar'" class="loading-bar">
      <view
        v-for="i in 5"
        :key="i"
        class="bar-item"
        :style="{ animationDelay: `${i * 0.1}s` }"
      ></view>
    </view>

    <!-- Clock 加载 -->
    <view v-else-if="type === 'clock'" class="loading-clock">
      <view class="clock-face">
        <view class="clock-hour"></view>
        <view class="clock-minute"></view>
      </view>
    </view>

    <!-- 文字提示 -->
    <text v-if="text" class="loading-text">{{ text }}</text>

    <!-- 遮罩层 -->
    <view v-if="mask" class="loading-mask" @click="handleMaskClick"></view>
  </view>
</template>

<script setup lang="ts">
export type LoadingType = 'spinner' | 'circular' | 'pulse' | 'wave' | 'dot' | 'bar' | 'clock'
export type LoadingSize = 'small' | 'medium' | 'large'

interface Props {
  /** 加载类型 */
  type?: LoadingType
  /** 尺寸 */
  size?: LoadingSize
  /** 颜色 */
  color?: string
  /** 文字提示 */
  text?: string
  /** 是否显示遮罩 */
  mask?: boolean
  /** 点击遮罩是否关闭 */
  maskCloseable?: boolean
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'medium',
  color: 'var(--primary-color)',
  text: '',
  mask: false,
  maskCloseable: false
})

const emit = defineEmits<{
  'mask-click': []
}>()

// 点击遮罩
function handleMaskClick() {
  if (props.maskCloseable) {
    emit('mask-click')
  }
}
</script>

<script lang="ts">
export default {
  name: 'Loading',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.loading {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  // 尺寸
  &.size-small {
    .loading-spinner,
    .loading-circular,
    .loading-pulse,
    .loading-wave,
    .loading-dot,
    .loading-bar,
    .loading-clock {
      width: 32rpx;
      height: 32rpx;
    }

    .loading-text {
      font-size: 24rpx;
    }
  }

  &.size-medium {
    .loading-spinner,
    .loading-circular,
    .loading-pulse,
    .loading-wave,
    .loading-dot,
    .loading-bar,
    .loading-clock {
      width: 48rpx;
      height: 48rpx;
    }

    .loading-text {
      font-size: 28rpx;
    }
  }

  &.size-large {
    .loading-spinner,
    .loading-circular,
    .loading-pulse,
    .loading-wave,
    .loading-dot,
    .loading-bar,
    .loading-clock {
      width: 64rpx;
      height: 64rpx;
    }

    .loading-text {
      font-size: 32rpx;
    }
  }

  // Spinner 类型
  .loading-spinner {
    position: relative;
    display: block;

    .spinner-item {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8%;
      height: 25%;
      margin-left: -4%;
      background: currentColor;
      border-radius: 4rpx;
      animation: spinner-fade 1s linear infinite;

      @for $i from 1 through 12 {
        &:nth-child(#{$i}) {
          animation-delay: #{$i * 0.083}s;
          opacity: $i / 12;
        }
      }
    }
  }

  // Circular 类型
  .loading-circular {
    display: block;

    .circular-svg {
      width: 100%;
      height: 100%;

      .circular-path {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: 0;
        stroke-linecap: round;
        animation: circular-dash 1.5s ease-in-out infinite;
      }
    }
  }

  // Pulse 类型
  .loading-pulse {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    .pulse-item {
      width: 25%;
      height: 25%;
      background: currentColor;
      border-radius: 50%;
      animation: pulse-scale 0.75s -0.24s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
  }

  // Wave 类型
  .loading-wave {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 6rpx;

    .wave-item {
      width: 6rpx;
      height: 100%;
      background: currentColor;
      animation: wave-stretch 1.2s -0.9s ease-in-out infinite;
      border-radius: 6rpx;
    }
  }

  // Dot 类型
  .loading-dot {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .dot-item {
      width: 25%;
      height: 25%;
      background: currentColor;
      border-radius: 50%;
      animation: dot-scale 0.8s -0.4s ease-in-out infinite;
    }
  }

  // Bar 类型
  .loading-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;

    .bar-item {
      width: 8rpx;
      height: 40%;
      background: currentColor;
      animation: bar-stretch 1s -0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      border-radius: 6rpx;
    }
  }

  // Clock 类型
  .loading-clock {
    display: block;

    .clock-face {
      width: 100%;
      height: 100%;
      border: 2rpx solid currentColor;
      border-radius: 50%;
      position: relative;

      .clock-hour {
        position: absolute;
        top: 25%;
        left: 50%;
        width: 4rpx;
        height: 25%;
        margin-left: -2rpx;
        background: currentColor;
        transform-origin: bottom center;
        animation: clock-rotate 3s linear infinite;
        border-radius: 6rpx;
      }

      .clock-minute {
        position: absolute;
        top: 10%;
        left: 50%;
        width: 4rpx;
        height: 40%;
        margin-left: -2rpx;
        background: currentColor;
        transform-origin: bottom center;
        animation: clock-rotate 10s linear infinite;
        border-radius: 6rpx;
      }
    }
  }

  .loading-text {
    margin-top: 16rpx;
    color: var(--text-color-tertiary);
  }

  .loading-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  }
}

// 动画定义
@keyframes spinner-fade {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes circular-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120;
  }
}

@keyframes pulse-scale {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes wave-stretch {
  0%, 40%, 100% {
    height: 40%;
  }
  20% {
    height: 100%;
  }
}

@keyframes dot-scale {
  0%, 100% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1);
  }
}

@keyframes bar-stretch {
  0%, 40%, 100% {
    height: 40%;
  }
  20% {
    height: 100%;
  }
}

@keyframes clock-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
