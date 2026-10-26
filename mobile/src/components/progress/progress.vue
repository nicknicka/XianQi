<template>
  <view class="progress" :class="[`status-${status}`, customClass]" :style="customStyle">
    <!-- 进度信息 -->
    <view v-if="showInfo" class="progress-info">
      <text v-if="status === 'active'" class="info-text">{{ percentage }}%</text>
      <text v-else-if="status === 'success'" class="info-text">完成</text>
      <text v-else-if="status === 'exception'" class="info-text">失败</text>
    </view>

    <!-- 进度条容器 -->
    <view class="progress-wrap" :class="{ 'has-text': text }">
      <!-- 轨道 -->
      <view class="progress-track" :style="trackStyle"></view>

      <!-- 进度 -->
      <view
        class="progress-bar"
        :class="{ 'is-animate': animated }"
        :style="barStyle"
      >
        <!-- 条纹效果 -->
        <view v-if="striped && status === 'active'" class="progress-striped"></view>
      </view>

      <!-- 进度文字 -->
      <view v-if="text" class="progress-text">
        <text class="text-content">{{ text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { primaryColor, successColor, dangerColor } = useThemeColors()

export type ProgressStatus = 'normal' | 'active' | 'success' | 'exception'

interface Props {
  /** 百分比 */
  percentage?: number
  /** 状态 */
  status?: ProgressStatus
  /** 是否显示进度信息 */
  showInfo?: boolean
  /** 是否显示条纹 */
  striped?: boolean
  /** 条纹是否流动 */
  animated?: boolean
  /** 进度条文字 */
  text?: string
  /** 轨道颜色 */
  trackColor?: string
  /** 进度条颜色 */
  strokeColor?: string
  /** 进度条高度（rpx） */
  strokeWidth?: number
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  percentage: 0,
  status: 'normal',
  showInfo: false,
  striped: false,
  animated: false,
  text: '',
  trackColor: 'var(--bg-color-disabled)',
  strokeColor: 'var(--primary-color)',
  strokeWidth: 8,
  customClass: '',
  customStyle: ''
})

// 轨道样式
const trackStyle = computed(() => {
  return {
    backgroundColor: props.trackColor,
    height: `${props.strokeWidth}rpx`
  }
})

// 进度条样式
const barStyle = computed(() => {
  const width = Math.min(Math.max(props.percentage, 0), 100)

  return {
    width: `${width}%`,
    backgroundColor: props.strokeColor,
    height: `${props.strokeWidth}rpx`
  }
})
</script>

<script lang="ts">
export default {
  name: 'XianqiProgress',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.progress {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .progress-info {
    flex-shrink: 0;
    min-width: 60rpx;
    text-align: right;

    .info-text {
      font-size: 26rpx;
      color: var(--text-color-primary);
    }
  }

  .progress-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;

    .progress-track {
      position: absolute;
      left: 0;
      right: 0;
      height: 8rpx;
      background: var(--bg-color-disabled);
      border-radius: 4rpx;
      overflow: hidden;
    }

    .progress-bar {
      position: relative;
      height: 8rpx;
      background: var(--primary-color);
      border-radius: 4rpx;
      transition: width 0.3s;
      overflow: hidden;

      &.is-animate {
        transition: width 0.6s ease;
      }

      .progress-striped {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.15) 25%,
          transparent 25%,
          transparent 50%,
          rgba(255, 255, 255, 0.15) 50%,
          rgba(255, 255, 255, 0.15) 75%,
          transparent 75%,
          transparent
        );
        background-size: 40rpx 40rpx;
        animation: progress-stripes 1s linear infinite;
      }
    }

    .progress-text {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;

      .text-content {
        font-size: 22rpx;
        color: var(--bg-color-card);
        text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
      }
    }
  }

  // 状态变体
  &.status-success {
    .progress-bar {
      background: var(--success-color);
    }
  }

  &.status-exception {
    .progress-bar {
      background: var(--error-color);
    }
  }
}

@keyframes progress-stripes {
  from {
    background-position: 40rpx 0;
  }
  to {
    background-position: 0 0;
  }
}
</style>
