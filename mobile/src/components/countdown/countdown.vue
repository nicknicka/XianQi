<template>
  <view class="countdown" :class="[`format-${format}`, customClass]" :style="customStyle">
    <!-- 天数 -->
    <view v-if="showDays && timeData.days > 0" class="time-unit">
      <text class="time-value">{{ formatNumber(timeData.days) }}</text>
      <text v-if="showLabel" class="time-label">{{ dayLabel }}</text>
    </view>

    <!-- 小时 -->
    <view v-if="showHours" class="time-unit">
      <text class="time-value">{{ formatNumber(timeData.hours) }}</text>
      <text v-if="showLabel" class="time-label">{{ hourLabel }}</text>
    </view>

    <!-- 分隔符 -->
    <text v-if="format === 'classic'" class="time-separator">:</text>

    <!-- 分钟 -->
    <view v-if="showMinutes" class="time-unit">
      <text class="time-value">{{ formatNumber(timeData.minutes) }}</text>
      <text v-if="showLabel" class="time-label">{{ minuteLabel }}</text>
    </view>

    <!-- 分隔符 -->
    <text v-if="format === 'classic'" class="time-separator">:</text>

    <!-- 秒 -->
    <view v-if="showSeconds" class="time-unit">
      <text class="time-value">{{ formatNumber(timeData.seconds) }}</text>
      <text v-if="showLabel" class="time-label">{{ secondLabel }}</text>
    </view>

    <!-- 自定义插槽 -->
    <slot :timeData="timeData" :remaining="remainingTime"></slot>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface TimeData {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface Props {
  /** 目标时间（时间戳或日期字符串） */
  target?: string | number | Date
  /** 倒计时时长（毫秒） */
  duration?: number
  /** 格式化样式 */
  format?: 'classic' | 'simple' | 'custom'
  /** 是否显示天数 */
  showDays?: boolean
  /** 是否显示小时 */
  showHours?: boolean
  /** 是否显示分钟 */
  showMinutes?: boolean
  /** 是否显示秒 */
  showSeconds?: boolean
  /** 是否显示标签 */
  showLabel?: boolean
  /** 天标签 */
  dayLabel?: string
  /** 小时标签 */
  hourLabel?: string
  /** 分钟标签 */
  minuteLabel?: string
  /** 秒标签 */
  secondLabel?: string
  /** 数字补零 */
  padZero?: boolean
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  format: 'classic',
  showDays: false,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  showLabel: false,
  dayLabel: '天',
  hourLabel: '时',
  minuteLabel: '分',
  secondLabel: '秒',
  padZero: true
})

const emit = defineEmits<{
  finish: []
  change: [remaining: number]
}>()

const timer = ref<number | null>(null)
const currentTime = ref(Date.now())
const remainingTime = ref(0)

// 目标时间
const targetTime = computed(() => {
  if (props.target) {
    return new Date(props.target).getTime()
  }
  if (props.duration) {
    return Date.now() + props.duration
  }
  return 0
})

// 时间数据
const timeData = computed<TimeData>(() => {
  const remaining = Math.max(0, remainingTime.value)
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
})

// 格式化数字
function formatNumber(num: number): string {
  if (props.padZero) {
    return num.toString().padStart(2, '0')
  }
  return num.toString()
}

// 启动倒计时
function start() {
  stop()

  const update = () => {
    const now = Date.now()
    const remaining = targetTime.value - now

    remainingTime.value = remaining

    if (remaining <= 0) {
      stop()
      emit('finish')
    } else {
      emit('change', remaining)
      timer.value = requestAnimationFrame(update) as unknown as number
    }
  }

  timer.value = requestAnimationFrame(update) as unknown as number
}

// 停止倒计时
function stop() {
  if (timer.value !== null) {
    cancelAnimationFrame(timer.value)
    timer.value = null
  }
}

// 重置倒计时
function reset() {
  stop()
  remainingTime.value = targetTime.value - Date.now()
  start()
}

// 监听目标时间变化
watch(() => [props.target, props.duration], () => {
  reset()
}, { deep: true })

onMounted(() => {
  remainingTime.value = targetTime.value - Date.now()
  if (remainingTime.value > 0) {
    start()
  }
})

onUnmounted(() => {
  stop()
})

// 暴露方法
defineExpose({
  start,
  stop,
  reset,
  getTimeData: () => timeData.value,
  getRemaining: () => remainingTime.value
})
</script>

<script lang="ts">
export default {
  name: 'Countdown',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;

  &.format-classic {
    .time-unit {
      display: inline-flex;
      align-items: center;
      gap: 4rpx;
    }

    .time-value {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
      line-height: 1;
      min-width: 40rpx;
      text-align: center;
    }

    .time-label {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }

    .time-separator {
      font-size: 32rpx;
      color: var(--text-color-primary);
      margin: 0 4rpx;
    }
  }

  &.format-simple {
    .time-unit {
      display: inline-flex;
      align-items: center;
    }

    .time-value {
      font-size: 28rpx;
      font-weight: 500;
      color: var(--text-color-primary);
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
      color: var(--bg-color-card);
      padding: 4rpx 12rpx;
      border-radius: 6rpx;
      min-width: 40rpx;
      text-align: center;
    }

    .time-label {
      font-size: 22rpx;
      color: var(--text-color-secondary);
      margin-left: 4rpx;
    }
  }

  &.format-custom {
    // 自定义样式完全由外部控制
  }
}
</style>
