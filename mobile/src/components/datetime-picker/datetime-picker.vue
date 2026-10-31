<template>
  <view class="datetime-picker" :class="[customClass]" :style="customStyle">
    <!-- 触发器 -->
    <view class="picker-trigger" :class="{ 'is-disabled': disabled, 'is-focused': visible }" @click="handleShow">
      <slot name="trigger">
        <view class="trigger-content">
          <text class="trigger-value" :class="{ 'is-placeholder': !displayValue }">
            {{ displayValue || placeholder }}
          </text>
          <text class="trigger-arrow">▼</text>
        </view>
      </slot>
    </view>

    <!-- 选择器弹窗 -->
    <uni-popup ref="popupRef" type="bottom" :safe-area="false">
      <view class="picker-modal">
        <!-- 头部 -->
        <view class="picker-header">
          <text class="header-btn cancel-btn" @click="handleCancel">取消</text>
          <text class="header-title">{{ title }}</text>
          <text class="header-btn confirm-btn" @click="handleConfirm">确定</text>
        </view>

        <!-- 选择器 -->
        <picker-view
          class="picker-view"
          :value="pickerValue"
          :immediate-change="true"
          @change="handleChange"
        >
          <!-- 年份 -->
          <picker-view-column v-if="showYear">
            <view v-for="year in years" :key="year" class="picker-item">
              <text class="item-text">{{ year }}年</text>
            </view>
          </picker-view-column>

          <!-- 月份 -->
          <picker-view-column v-if="showMonth">
            <view v-for="month in months" :key="month" class="picker-item">
              <text class="item-text">{{ month }}月</text>
            </view>
          </picker-view-column>

          <!-- 日期 -->
          <picker-view-column v-if="showDay">
            <view v-for="day in days" :key="day" class="picker-item">
              <text class="item-text">{{ day }}日</text>
            </view>
          </picker-view-column>

          <!-- 小时 -->
          <picker-view-column v-if="showHour">
            <view v-for="hour in hours" :key="hour" class="picker-item">
              <text class="item-text">{{ formatNumber(hour) }}时</text>
            </view>
          </picker-view-column>

          <!-- 分钟 -->
          <picker-view-column v-if="showMinute">
            <view v-for="minute in minutes" :key="minute" class="picker-item">
              <text class="item-text">{{ formatNumber(minute) }}分</text>
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface DateValue {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

interface Props {
  /** 绑定值（时间戳或日期字符串） */
  modelValue?: string | number | Date
  /** 日期类型 */
  type?: 'date' | 'datetime' | 'time' | 'year-month' | 'month-date'
  /** 最小日期 */
  minDate?: string | number | Date
  /** 最大日期 */
  maxDate?: string | number | Date
  /** 占位文本 */
  placeholder?: string
  /** 标题 */
  title?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 格式化函数 */
  format?: (value: Date) => string
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'date',
  placeholder: '请选择',
  title: '选择时间',
  format: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [value: Date]
  'cancel': []
  'confirm': [value: Date]
}>()

const popupRef = ref()
const visible = ref(false)
const currentValue = ref<DateValue>({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hour: new Date().getHours(),
  minute: new Date().getMinutes()
})

// 显示哪些列
const showYear = computed(() => ['date', 'datetime', 'year-month', 'month-date'].includes(props.type))
const showMonth = computed(() => ['date', 'datetime', 'year-month', 'month-date'].includes(props.type))
const showDay = computed(() => ['date', 'datetime', 'month-date'].includes(props.type))
const showHour = computed(() => props.type === 'datetime' || props.type === 'time')
const showMinute = computed(() => props.type === 'datetime' || props.type === 'time')

// 年份范围
const minYear = computed(() => {
  if (props.minDate) return new Date(props.minDate).getFullYear()
  return 1900
})

const maxYear = computed(() => {
  if (props.maxDate) return new Date(props.maxDate).getFullYear()
  return 2100
})

// 生成年份列表
const years = computed(() => {
  const arr: number[] = []
  for (let i = minYear.value; i <= maxYear.value; i++) {
    arr.push(i)
  }
  return arr
})

// 生成月份列表
const months = computed(() => {
  const arr: number[] = []
  for (let i = 1; i <= 12; i++) {
    arr.push(i)
  }
  return arr
})

// 生成日期列表
const days = computed(() => {
  const year = currentValue.value.year
  const month = currentValue.value.month
  const daysInMonth = new Date(year, month, 0).getDate()
  const arr: number[] = []
  for (let i = 1; i <= daysInMonth; i++) {
    arr.push(i)
  }
  return arr
})

// 生成小时列表
const hours = computed(() => {
  const arr: number[] = []
  for (let i = 0; i <= 23; i++) {
    arr.push(i)
  }
  return arr
})

// 生成分钟列表
const minutes = computed(() => {
  const arr: number[] = []
  for (let i = 0; i <= 59; i++) {
    arr.push(i)
  }
  return arr
})

// 选择器当前值
const pickerValue = computed(() => {
  const value: number[] = []
  const current = currentValue.value

  if (showYear.value) {
    value.push(years.value.indexOf(current.year))
  }
  if (showMonth.value) {
    value.push(months.value.indexOf(current.month))
  }
  if (showDay.value) {
    value.push(days.value.indexOf(current.day))
  }
  if (showHour.value) {
    value.push(hours.value.indexOf(current.hour))
  }
  if (showMinute.value) {
    value.push(minutes.value.indexOf(current.minute))
  }

  return value
})

// 显示值
const displayValue = computed(() => {
  if (!props.modelValue) return ''

  const date = new Date(props.modelValue)
  if (isNaN(date.getTime())) return ''

  if (props.format) {
    return props.format(date)
  }

  // 默认格式化
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  switch (props.type) {
    case 'date':
      return `${year}-${formatNumber(month)}-${formatNumber(day)}`
    case 'datetime':
      return `${year}-${formatNumber(month)}-${formatNumber(day)} ${formatNumber(hour)}:${formatNumber(minute)}`
    case 'time':
      return `${formatNumber(hour)}:${formatNumber(minute)}`
    case 'year-month':
      return `${year}-${formatNumber(month)}`
    case 'month-date':
      return `${formatNumber(month)}-${formatNumber(day)}`
    default:
      return ''
  }
})

// 格式化数字
function formatNumber(num: number): string {
  return num.toString().padStart(2, '0')
}

// 解析值
function parseValue(value: string | number | Date | undefined): DateValue {
  const date = value ? new Date(value) : new Date()

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes()
  }
}

// 显示选择器
function handleShow() {
  if (props.disabled) return
  currentValue.value = parseValue(props.modelValue)
  visible.value = true
  popupRef.value?.open()
}

// 隐藏选择器
function hide() {
  visible.value = false
  popupRef.value?.close()
}

// 取消
function handleCancel() {
  hide()
  emit('cancel')
}

// 确认
function handleConfirm() {
  const date = new Date(
    currentValue.value.year,
    currentValue.value.month - 1,
    currentValue.value.day,
    currentValue.value.hour,
    currentValue.value.minute
  )

  const timestamp = date.getTime()
  emit('update:modelValue', timestamp)
  emit('change', date)
  emit('confirm', date)
  hide()
}

// 选择变化
function handleChange(e: any) {
  const values = e.detail.value
  let index = 0

  if (showYear.value) {
    currentValue.value.year = years.value[values[index++]]
  }
  if (showMonth.value) {
    currentValue.value.month = months.value[values[index++]]
  }
  if (showDay.value) {
    currentValue.value.day = days.value[values[index++]]
  }
  if (showHour.value) {
    currentValue.value.hour = hours.value[values[index++]]
  }
  if (showMinute.value) {
    currentValue.value.minute = minutes.value[values[index++]]
  }
}

// 暴露方法
defineExpose({
  show: handleShow,
  hide,
  getValue: () => currentValue.value
})
</script>

<script lang="ts">
export default {
  name: 'DatetimePicker',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.datetime-picker {
  width: 100%;

  .picker-trigger {
    min-height: 80rpx;
    padding: 16rpx 24rpx;
    border: 1px solid #e5e5e5;
    border-radius: 8rpx;
    background: var(--bg-color-card);
    transition: border-color 0.2s;

    &:not(.is-disabled):active {
      background: #fafafa;
    }

    &.is-focused {
      border-color: var(--primary-color);
    }

    &.is-disabled {
      background: var(--bg-color-disabled);
      opacity: 0.6;
    }

    .trigger-content {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .trigger-value {
        flex: 1;
        font-size: 28rpx;
        color: var(--text-color-primary);

        &.is-placeholder {
          color: var(--text-color-tertiary);
        }
      }

      .trigger-arrow {
        font-size: 20rpx;
        color: var(--text-color-tertiary);
        margin-left: 16rpx;
      }
    }
  }
}

.picker-modal {
  width: 100%;
  max-width: 100vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  // 添加底部安全区域 padding
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  overflow-x: hidden;

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    border-bottom: 1px solid var(--border-color-light);

    .header-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .header-btn {
      font-size: 28rpx;
      padding: 8rpx 16rpx;

      &.cancel-btn {
        color: var(--text-color-tertiary);
      }

      &.confirm-btn {
        color: var(--primary-color);
      }
    }
  }

  .picker-view {
    width: 100%;
    height: 500rpx;

    .picker-item {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80rpx;

      .item-text {
        font-size: 28rpx;
        color: var(--text-color-primary);
      }
    }
  }
}
</style>
