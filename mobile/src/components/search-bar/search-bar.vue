<template>
  <view class="search-bar" :class="[`shape-${shape}`, `size-${size}`, customClass]" :style="customStyle">
    <!-- 搜索框 -->
    <view
      class="search-input-wrapper"
      :class="{ 'is-focused': focused, 'has-action': showAction }"
    >
      <!-- 搜索图标 -->
      <view class="search-icon">
        <text class="icon-text">🔍</text>
      </view>

      <!-- 输入框 -->
      <input
        class="search-input"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :placeholder-style="placeholderStyle"
        :focus="focused"
        :maxlength="maxLength"
        :disabled="disabled"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @confirm="handleConfirm"
        @click.stop="handleClick"
      />

      <!-- 清除按钮 -->
      <view
        v-if="showClear && modelValue && !disabled"
        class="clear-btn"
        @click.stop="handleClear"
      >
        <text class="clear-icon">×</text>
      </view>

      <!-- 操作按钮 -->
      <view v-if="showAction" class="action-btn" @click.stop="handleAction">
        <text class="action-text">{{ actionText }}</text>
      </view>
    </view>

    <!-- 取消按钮 -->
    <view v-if="showCancel && focused" class="cancel-btn" @click="handleCancel">
      <text class="cancel-text">取消</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  /** 绑定值 */
  modelValue?: string
  /** 占位文本 */
  placeholder?: string
  /** 占位样式 */
  placeholderStyle?: string
  /** 最大长度 */
  maxLength?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示清除按钮 */
  showClear?: boolean
  /** 是否显示操作按钮 */
  showAction?: boolean
  /** 操作按钮文字 */
  actionText?: string
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 形状 */
  shape?: 'square' | 'round'
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索',
  placeholderStyle: 'color: var(--text-color-tertiary)',
  maxLength: 50,
  disabled: false,
  showClear: true,
  showAction: false,
  actionText: '搜索',
  showCancel: false,
  shape: 'round',
  size: 'medium'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'focus': [e: any]
  'blur': [e: any]
  'input': [value: string]
  'confirm': [value: string]
  'clear': []
  'cancel': []
  'action': []
  'click': []
}>()

const focused = ref(false)

// 获得焦点
function handleFocus(e: any) {
  focused.value = true
  emit('focus', e)
}

// 失去焦点
function handleBlur(e: any) {
  focused.value = false
  emit('blur', e)
}

// 输入事件
function handleInput(e: any) {
  const value = e.detail.value
  emit('update:modelValue', value)
  emit('input', value)
}

// 确认事件
function handleConfirm(e: any) {
  emit('confirm', props.modelValue)
}

// 清除
function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}

// 取消
function handleCancel() {
  focused.value = false
  emit('cancel')
}

// 操作按钮
function handleAction() {
  emit('action')
}

// 点击输入框
function handleClick() {
  if (props.disabled) return
  emit('click')
}

// 暴露方法
defineExpose({
  focus: () => {
    focused.value = true
  },
  blur: () => {
    focused.value = false
  }
})
</script>

<script lang="ts">
export default {
  name: 'SearchBar',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    background: var(--bg-color-disabled);
    transition: all 0.2s;

    &.shape-round {
      border-radius: 48rpx;
      padding: 12rpx 24rpx;
    }

    &.shape-square {
      border-radius: 8rpx;
      padding: 12rpx 24rpx;
    }

    &.size-small {
      min-height: 56rpx;

      .search-icon .icon-text {
        font-size: 28rpx;
      }

      .search-input {
        font-size: 26rpx;
      }

      .clear-icon {
        font-size: 28rpx;
      }
    }

    &.size-medium {
      min-height: 64rpx;

      .search-icon .icon-text {
        font-size: 32rpx;
      }

      .search-input {
        font-size: 28rpx;
      }

      .clear-icon {
        font-size: 32rpx;
      }
    }

    &.size-large {
      min-height: 72rpx;

      .search-icon .icon-text {
        font-size: 36rpx;
      }

      .search-input {
        font-size: 32rpx;
      }

      .clear-icon {
        font-size: 36rpx;
      }
    }

    &.is-focused {
      background: var(--bg-color-card);

      @if props.shape === 'square' {
        border-color: var(--primary-color);
      }
    }

    &.has-action {
      padding-right: 16rpx;
    }

    .search-icon {
      flex-shrink: 0;

      .icon-text {
        line-height: 1;
      }
    }

    .search-input {
      flex: 1;
      height: 100%;
      background: transparent;
      border: none;
      outline: none;
      line-height: 1;
      padding: 0 16rpx;

      &::placeholder {
        color: var(--text-color-tertiary);
      }
    }

    .clear-btn {
      flex-shrink: 0;
      width: 40rpx;
      height: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;

      &:active {
        background: rgba(0, 0, 0, 0.05);
      }

      .clear-icon {
        font-size: 32rpx;
        color: var(--text-color-tertiary);
        line-height: 1;
      }
    }

    .action-btn {
      flex-shrink: 0;
      padding-left: 16rpx;
      border-left: 1rpx solid var(--border-color-base);

      .action-text {
        font-size: 28rpx;
        color: var(--primary-color);
      }
    }
  }

  .cancel-btn {
    flex-shrink: 0;

    .cancel-text {
      font-size: 28rpx;
      color: var(--text-color-secondary);
    }
  }
}
</style>
