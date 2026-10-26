<template>
  <view class="countdown-timer" :class="[`size-${size}`, theme]">
    <view class="countdown-label" v-if="showLabel">{{ labelText }}</view>
    <view class="countdown-content">
      <view class="time-wrapper" v-for="(time, index) in timeParts" :key="index">
        <view class="time-block">
          <text class="time-value">{{ time.value }}</text>
        </view>
        <text class="time-separator" v-if="index < timeParts.length - 1">{{ separator }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

interface Props {
  // 目标时间戳
  targetTime?: number
  // 剩余秒数
  seconds?: number
  // 是否显示标签
  showLabel?: boolean
  // 标签文字
  labelText?: string
  // 分隔符
  separator?: string
  // 大小: small, medium, large
  size?: 'small' | 'medium' | 'large'
  // 主题: default, light, dark
  theme?: 'default' | 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  labelText: '距离结束',
  separator: ':',
  size: 'medium',
  theme: 'default'
})

const emit = defineEmits<{
  finish: []
}>()

// 倒计时剩余时间
const remainingSeconds = ref(0)

// 计时器
let timer: any = null

// 时间分解
const timeParts = computed(() => {
  const totalSeconds = remainingSeconds.value
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []

  // 如果有小时
  if (hours > 0) {
    parts.push({
      value: hours.toString().padStart(2, '0'),
      label: '时'
    })
  }

  // 添加分钟
  parts.push({
    value: minutes.toString().padStart(2, '0'),
    label: '分'
  })

  // 添加秒
  parts.push({
    value: seconds.toString().padStart(2, '0'),
    label: '秒'
  })

  return parts
})

// 初始化倒计时
const initCountdown = () => {
  if (props.targetTime) {
    const now = new Date().getTime()
    const distance = props.targetTime - now
    remainingSeconds.value = Math.max(0, Math.floor(distance / 1000))
  } else if (props.seconds) {
    remainingSeconds.value = props.seconds
  }
}

// 更新倒计时
const updateCountdown = () => {
  if (remainingSeconds.value > 0) {
    remainingSeconds.value--
  } else {
    // 倒计时结束
    clearInterval(timer)
    emit('finish')
  }
}

// 启动倒计时
const start = () => {
  if (timer) {
    clearInterval(timer)
  }
  timer = setInterval(updateCountdown, 1000)
}

// 停止倒计时
const stop = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 重置倒计时
const reset = () => {
  stop()
  initCountdown()
  start()
}

// 监听时间变化
watch(() => [props.targetTime, props.seconds], () => {
  reset()
})

onMounted(() => {
  initCountdown()
  start()
})

onUnmounted(() => {
  stop()
})

// 暴露方法
defineExpose({
  start,
  stop,
  reset
})
</script>

<style lang="scss" scoped>
.countdown-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;

  &.size-small {
    .countdown-label {
      font-size: 20rpx;
    }

    .time-block {
      min-width: 40rpx;
      height: 40rpx;
      line-height: 40rpx;

      .time-value {
        font-size: 20rpx;
      }
    }

    .time-separator {
      font-size: 20rpx;
    }
  }

  &.size-medium {
    .countdown-label {
      font-size: 24rpx;
    }

    .time-block {
      min-width: 50rpx;
      height: 50rpx;
      line-height: 50rpx;

      .time-value {
        font-size: 24rpx;
      }
    }

    .time-separator {
      font-size: 24rpx;
    }
  }

  &.size-large {
    .countdown-label {
      font-size: 28rpx;
    }

    .time-block {
      min-width: 60rpx;
      height: 60rpx;
      line-height: 60rpx;

      .time-value {
        font-size: 32rpx;
      }
    }

    .time-separator {
      font-size: 32rpx;
    }
  }

  /* 主题样式 */
  &.theme-default {
    .countdown-label {
      color: rgba(255, 255, 255, 0.8);
    }

    .time-block {
      background: var(--bg-color-card);

      .time-value {
        color: var(--error-color);
      }
    }

    .time-separator {
      color: var(--text-color-inverse);
    }
  }

  &.theme-light {
    .countdown-label {
      color: var(--text-color-secondary);
    }

    .time-block {
      background: var(--bg-color-disabled);

      .time-value {
        color: var(--text-color-primary);
      }
    }

    .time-separator {
      color: var(--text-color-primary);
    }
  }

  &.theme-dark {
    .countdown-label {
      color: var(--text-color-placeholder);
    }

    .time-block {
      background: var(--text-color-primary);

      .time-value {
        color: var(--text-color-inverse);
      }
    }

    .time-separator {
      color: var(--text-color-inverse);
    }
  }
}

.countdown-label {
  font-weight: 500;
}

.countdown-content {
  display: flex;
  align-items: center;
  gap: 4rpx;

  .time-wrapper {
    display: flex;
    align-items: center;
  }

  .time-block {
    text-align: center;
    border-radius: 8rpx;
    font-weight: bold;
  }

  .time-separator {
    font-weight: bold;
    margin: 0 4rpx;
  }
}
</style>
