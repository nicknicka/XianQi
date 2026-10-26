<template>
  <view class="form" :class="[`label-${labelPosition}`, customClass]" :style="customStyle">
    <!-- 表单项 -->
    <view
      v-for="(item, index) in formItems"
      :key="item.prop || index"
      class="form-item"
      :class="{
        'is-required': item.required,
        'is-error': errors[item.prop],
        'is-hidden': item.hidden
      }"
    >
      <!-- 标签 -->
      <view v-if="item.label && showLabel" class="form-label">
        <text class="label-text">{{ item.label }}</text>
        <text v-if="item.required" class="label-required">*</text>
      </view>

      <!-- 表单项内容 -->
      <view class="form-content">
        <!-- 输入框 -->
        <input
          v-if="item.type === 'input'"
          class="form-input"
          :type="item.inputType || 'text'"
          :value="formData[item.prop]"
          :placeholder="item.placeholder"
          :disabled="item.disabled"
          :maxlength="item.maxlength"
          :password="item.password"
          @input="handleInput(item, $event)"
          @blur="handleBlur(item, $event)"
          @focus="handleFocus(item, $event)"
        />

        <!-- 文本域 -->
        <textarea
          v-else-if="item.type === 'textarea'"
          class="form-textarea"
          :value="formData[item.prop]"
          :placeholder="item.placeholder"
          :disabled="item.disabled"
          :maxlength="item.maxlength"
          :auto-height="item.autoHeight"
          @input="handleInput(item, $event)"
          @blur="handleBlur(item, $event)"
          @focus="handleFocus(item, $event)"
        />

        <!-- 选择器 -->
        <picker
          v-else-if="item.type === 'select'"
          mode="selector"
          :range="item.options"
          :value="formData[item.prop]"
          :disabled="item.disabled"
          @change="handleSelect(item, $event)"
        >
          <view class="form-picker" :class="{ 'is-placeholder': !formData[item.prop] }">
            <text class="picker-text">
              {{ getSelectText(item) }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>

        <!-- 日期选择器 -->
        <picker
          v-else-if="item.type === 'date'"
          mode="date"
          :value="formData[item.prop]"
          :start="item.start"
          :end="item.end"
          :disabled="item.disabled"
          @change="handleDateChange(item, $event)"
        >
          <view class="form-picker" :class="{ 'is-placeholder': !formData[item.prop] }">
            <text class="picker-text">
              {{ formData[item.prop] || (item.placeholder || '请选择日期') }}
            </text>
            <text class="picker-arrow">📅</text>
          </view>
        </picker>

        <!-- 开关 -->
        <switch
          v-else-if="item.type === 'switch'"
          class="form-switch"
          :checked="formData[item.prop]"
          :disabled="item.disabled"
          color="var(--primary-color)"
          @change="handleSwitch(item, $event)"
        />

        <!-- 单选框 -->
        <radio-group
          v-else-if="item.type === 'radio'"
          class="form-radio-group"
          :disabled="item.disabled"
          @change="handleRadio(item, $event)"
        >
          <label
            v-for="(option, optIndex) in item.options"
            :key="optIndex"
            class="radio-item"
          >
            <view class="radio-content">
              <radio
                :value="option.value"
                :checked="formData[item.prop] === option.value"
                :disabled="item.disabled"
                color="var(--primary-color)"
              />
              <text class="radio-text">{{ option.label }}</text>
            </view>
          </label>
        </radio-group>

        <!-- 多选框 -->
        <checkbox-group
          v-else-if="item.type === 'checkbox'"
          class="form-checkbox-group"
          :disabled="item.disabled"
          @change="handleCheckbox(item, $event)"
        >
          <label
            v-for="(option, optIndex) in item.options"
            :key="optIndex"
            class="checkbox-item"
          >
            <view class="checkbox-content">
              <checkbox
                :value="option.value"
                :checked="isCheckboxChecked(item, option.value)"
                :disabled="item.disabled"
                color="var(--primary-color)"
              />
              <text class="checkbox-text">{{ option.label }}</text>
            </view>
          </label>
        </checkbox-group>

        <!-- 自定义插槽 -->
        <slot
          v-else-if="item.type === 'slot'"
          :name="item.prop"
          :item="item"
          :value="formData[item.prop]"
        ></slot>

        <!-- 错误提示 -->
        <view v-if="errors[item.prop]" class="form-error">
          <text class="error-text">{{ errors[item.prop] }}</text>
        </view>

        <!-- 帮助文本 -->
        <view v-if="item.help" class="form-help">
          <text class="help-text">{{ item.help }}</text>
        </view>
      </view>
    </view>

    <!-- 表单操作 -->
    <view v-if="showActions" class="form-actions">
      <view
        v-if="showCancel"
        class="action-btn cancel-btn"
        @click="handleCancel"
      >
        <text class="btn-text">{{ cancelText }}</text>
      </view>
      <view
        class="action-btn submit-btn"
        :class="{ 'is-loading': loading }"
        @click="handleSubmit"
      >
        <text class="btn-text">{{ submitText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

export type FormLabelPosition = 'top' | 'left' | 'right'
export type FormItemType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'date'
  | 'switch'
  | 'radio'
  | 'checkbox'
  | 'slot'

export interface FormOption {
  label: string
  value: any
  disabled?: boolean
}

export interface FormItem {
  prop: string
  type?: FormItemType
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  inputType?: string
  password?: boolean
  maxlength?: number
  autoHeight?: boolean
  options?: FormOption[]
  start?: string
  end?: string
  help?: string
  rules?: Array<(value: any) => string | boolean>
}

interface Props {
  /** 表单项配置 */
  items?: FormItem[]
  /** 初始数据 */
  modelValue?: Record<string, any>
  /** 标签位置 */
  labelPosition?: FormLabelPosition
  /** 是否显示标签 */
  showLabel?: boolean
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 提交按钮文本 */
  submitText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  modelValue: () => ({}),
  labelPosition: 'top',
  showLabel: true,
  showActions: true,
  submitText: '提交',
  cancelText: '取消',
  showCancel: true,
  loading: false,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  'submit': [value: Record<string, any>]
  'cancel': []
  'change': [prop: string, value: any]
}>()

const formData = reactive<Record<string, any>>({ ...props.modelValue })
const errors = ref<Record<string, string>>({})

// 获取选择器显示文本
function getSelectText(item: FormItem): string {
  if (!formData[item.prop]) return item.placeholder || '请选择'

  const option = item.options?.find(opt => opt.value === formData[item.prop])
  return option?.label || formData[item.prop]
}

// 判断多选框是否选中
function isCheckboxChecked(item: FormItem, value: any): boolean {
  const currentValue = formData[item.prop]
  return Array.isArray(currentValue) && currentValue.includes(value)
}

// 输入事件
function handleInput(item: FormItem, e: any) {
  const value = e.detail.value
  formData[item.prop] = value
  emit('update:modelValue', formData)
  emit('change', item.prop, value)
  clearError(item.prop)
}

// 失焦事件
function handleBlur(item: FormItem, e: any) {
  validateField(item.prop)
}

// 聚焦事件
function handleFocus(item: FormItem, e: any) {
  // 可以处理聚焦逻辑
}

// 选择器事件
function handleSelect(item: FormItem, e: any) {
  const index = e.detail.value
  const option = item.options?.[index]
  const value = option?.value

  formData[item.prop] = value
  emit('update:modelValue', formData)
  emit('change', item.prop, value)
  clearError(item.prop)
}

// 日期变化
function handleDateChange(item: FormItem, e: any) {
  const value = e.detail.value
  formData[item.prop] = value
  emit('update:modelValue', formData)
  emit('change', item.prop, value)
  clearError(item.prop)
}

// 开关变化
function handleSwitch(item: FormItem, e: any) {
  const value = e.detail.value
  formData[item.prop] = value
  emit('update:modelValue', formData)
  emit('change', item.prop, value)
}

// 单选变化
function handleRadio(item: FormItem, e: any) {
  const value = e.detail.value
  formData[item.prop] = value
  emit('update:modelValue', formData)
  emit('change', item.prop, value)
}

// 多选变化
function handleCheckbox(item: FormItem, e: any) {
  const value = e.detail.value
  formData[item.prop] = value
  emit('update:modelValue', formData)
  emit('change', item.prop, value)
}

// 清除错误
function clearError(prop: string) {
  if (errors.value[prop]) {
    delete errors.value[prop]
  }
}

// 验证单个字段
function validateField(prop: string): boolean {
  const item = props.items.find(i => i.prop === prop)
  if (!item || !item.rules) return true

  for (const rule of item.rules) {
    const result = rule(formData[prop])
    if (result !== true) {
      errors.value[prop] = typeof result === 'string' ? result : '验证失败'
      return false
    }
  }

  clearError(prop)
  return true
}

// 验证整个表单
function validate(): boolean {
  let isValid = true

  for (const item of props.items) {
    if (item.required && !formData[item.prop]) {
      errors.value[item.prop] = '此项为必填项'
      isValid = false
    } else if (item.rules) {
      if (!validateField(item.prop)) {
        isValid = false
      }
    }
  }

  return isValid
}

// 提交
function handleSubmit() {
  if (validate()) {
    emit('submit', formData)
  }
}

// 取消
function handleCancel() {
  emit('cancel')
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  Object.assign(formData, newVal)
}, { deep: true })

// 暴露方法
defineExpose({
  validate,
  validateField,
  resetFields: () => {
    Object.keys(formData).forEach(key => {
      formData[key] = ''
    })
    errors.value = {}
  },
  clearErrors: () => {
    errors.value = {}
  },
  setFieldValue: (prop: string, value: any) => {
    formData[prop] = value
    emit('update:modelValue', formData)
  },
  getFieldValue: (prop: string) => {
    return formData[prop]
  }
})
</script>

<script lang="ts">
export default {
  name: 'XianqiForm',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.form {
  width: 100%;

  // 标签位置变体
  &.label-top {
    .form-item {
      flex-direction: column;
    }
  }

  &.label-left {
    .form-item {
      flex-direction: row;
      align-items: flex-start;
    }

    .form-label {
      width: 200rpx;
      text-align: right;
      flex-shrink: 0;
    }
  }

  &.label-right {
    .form-item {
      flex-direction: row-reverse;
      align-items: flex-start;
    }

    .form-label {
      width: 200rpx;
      text-align: left;
      flex-shrink: 0;
    }
  }

  .form-item {
    display: flex;
    margin-bottom: 32rpx;

    &:last-child {
      margin-bottom: 0;
    }

    &.is-hidden {
      display: none;
    }

    .form-label {
      margin-bottom: 16rpx;

      .label-text {
        font-size: 28rpx;
        color: var(--text-color-primary);
      }

      .label-required {
        color: var(--error-color);
        margin-left: 4rpx;
      }
    }

    .form-content {
      flex: 1;

      .form-input {
        width: 100%;
        padding: 20rpx 24rpx;
        background: var(--bg-color-disabled);
        border-radius: 8rpx;
        font-size: 28rpx;
        color: var(--text-color-primary);

        &:focus {
          background: var(--bg-color-card);
        }
      }

      .form-textarea {
        width: 100%;
        min-height: 160rpx;
        padding: 20rpx 24rpx;
        background: var(--bg-color-disabled);
        border-radius: 8rpx;
        font-size: 28rpx;
        color: var(--text-color-primary);
        line-height: 1.6;
      }

      .form-picker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20rpx 24rpx;
        background: var(--bg-color-disabled);
        border-radius: 8rpx;

        &.is-placeholder {
          .picker-text {
            color: var(--text-color-tertiary);
          }
        }

        .picker-text {
          font-size: 28rpx;
          color: var(--text-color-primary);
        }

        .picker-arrow {
          font-size: 32rpx;
          color: var(--text-color-tertiary);
        }
      }

      .form-switch {
        transform: scale(0.9);
      }

      .form-radio-group,
      .form-checkbox-group {
        display: flex;
        flex-wrap: wrap;
        gap: 24rpx;

        .radio-item,
        .checkbox-item {
          display: inline-flex;
          margin-right: 24rpx;

          &:last-child {
            margin-right: 0;
          }

          .radio-content,
          .checkbox-content {
            display: flex;
            align-items: center;
            gap: 12rpx;

            .radio-text,
            .checkbox-text {
              font-size: 28rpx;
              color: var(--text-color-primary);
            }
          }
        }
      }

      .form-error {
        margin-top: 12rpx;

        .error-text {
          font-size: 24rpx;
          color: var(--error-color);
        }
      }

      .form-help {
        margin-top: 12rpx;

        .help-text {
          font-size: 24rpx;
          color: var(--text-color-tertiary);
        }
      }
    }
  }

  .form-actions {
    display: flex;
    gap: 24rpx;
    margin-top: 48rpx;

    .action-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 40rpx;
      font-size: 28rpx;
      transition: all 0.2s;

      &:active {
        transform: scale(0.98);
      }

      &.cancel-btn {
        background: var(--bg-color-disabled);

        .btn-text {
          color: var(--text-color-secondary);
        }
      }

      &.submit-btn {
        background: $primary-color;

        .btn-text {
          color: var(--bg-color-card);
        }

        &.is-loading {
          opacity: 0.7;
        }
      }
    }
  }
}
</style>
