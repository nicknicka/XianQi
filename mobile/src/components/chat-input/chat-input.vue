<template>
  <view class="chat-input" :class="[`mode-${mode}`, customClass]" :style="customStyle">
    <!-- 输入框区域 -->
    <view class="input-wrapper">
      <!-- 工具栏按钮 -->
      <view v-if="showToolbar && mode === 'full'" class="toolbar">
        <view class="toolbar-btn" @click="handleChooseImage">
          <text class="btn-icon">🖼️</text>
        </view>
        <view class="toolbar-btn" @click="handleChooseCamera">
          <text class="btn-icon">📷</text>
        </view>
      </view>

      <!-- 输入框 -->
      <view class="input-container" :class="{ 'has-toolbar': showToolbar && mode === 'full' }">
        <textarea
          v-if="multiline"
          class="input-field textarea-field"
          :placeholder="placeholder"
          :value="modelValue"
          :maxlength="maxLength"
          :auto-height="autoHeight"
          :cursor-spacing="10"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="handleInput"
          @confirm="handleConfirm"
        />

        <input
          v-else
          class="input-field"
          type="text"
          :placeholder="placeholder"
          :value="modelValue"
          :maxlength="maxLength"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="handleInput"
          @confirm="handleConfirm"
        />

        <!-- 附件按钮 -->
        <view
          v-if="showAttach && !modelValue"
          class="attach-btn"
          @click="handleAttach"
        >
          <text class="btn-icon">⊕</text>
        </view>

        <!-- 表情按钮 -->
        <view v-if="showEmoji" class="emoji-btn" @click="handleEmoji">
          <text class="btn-icon">☺</text>
        </view>
      </view>

      <!-- 发送按钮 -->
      <view class="send-btn" :class="{ 'is-disabled': !canSend }" @click="handleSend">
        <text class="send-icon">{{ sendIcon }}</text>
      </view>
    </view>

    <!-- 表情面板 -->
    <view v-if="showEmojiPanel" class="emoji-panel">
      <scroll-view class="emoji-list" scroll-y>
        <view
          v-for="(emoji, index) in emojiList"
          :key="index"
          class="emoji-item"
          @click="handleSelectEmoji(emoji)"
        >
          <text class="emoji-text">{{ emoji }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 功能面板 -->
    <view v-if="showActionPanel" class="action-panel">
      <view class="action-grid">
        <view class="action-item" @click="handleChooseImage">
          <text class="action-icon">🖼️</text>
          <text class="action-label">图片</text>
        </view>
        <view class="action-item" @click="handleChooseCamera">
          <text class="action-icon">📷</text>
          <text class="action-label">拍照</text>
        </view>
        <view class="action-item" @click="handleChooseLocation">
          <text class="action-icon">📍</text>
          <text class="action-label">位置</text>
        </view>
        <view class="action-item" @click="handleChooseFile">
          <text class="action-icon">📎</text>
          <text class="action-label">文件</text>
        </view>
        <view class="action-item" @click="handleChooseCard">
          <text class="action-icon">💳</text>
          <text class="action-label">名片</text>
        </view>
      </view>
    </view>

    <!-- 输入提示 -->
    <view v-if="showTips && tips.length > 0" class="input-tips">
      <view
        v-for="(tip, index) in tips"
        :key="index"
        class="tip-item"
        @click="handleSelectTip(tip)"
      >
        <text class="tip-text">{{ tip }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  /** 绑定值 */
  modelValue?: string
  /** 输入模式 */
  mode?: 'simple' | 'full'
  /** 占位文本 */
  placeholder?: string
  /** 最大长度 */
  maxLength?: number
  /** 是否多行输入 */
  multiline?: boolean
  /** 是否自动高度 */
  autoHeight?: boolean
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否显示附件按钮 */
  showAttach?: boolean
  /** 是否显示表情按钮 */
  showEmoji?: boolean
  /** 发送按钮图标 */
  sendIcon?: string
  /** 输入提示 */
  tips?: string[]
  /** 是否显示提示 */
  showTips?: boolean
  /** 禁用状态 */
  disabled?: boolean
  /** 是否可发送 */
  canSend?: boolean
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  mode: 'simple',
  placeholder: '请输入...',
  maxLength: 500,
  multiline: false,
  autoHeight: false,
  showToolbar: false,
  showAttach: true,
  showEmoji: true,
  sendIcon: '↑',
  tips: () => [],
  showTips: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': [value: string]
  'focus': [e: any]
  'blur': [e: any]
  'input': [value: string]
  'confirm': [value: string]
  'choose-image': []
  'choose-camera': []
  'choose-location': []
  'choose-file': []
  'choose-card': []
  'select-emoji': [emoji: string]
}>()

const focused = ref(false)
const showEmojiPanel = ref(false)
const showActionPanel = ref(false)

// 常用表情
const emojiList = [
  '😀', '😁', '😂', '🥰', '😍', '🤔', '😎', '😭', '😡', '👍', '👎', '🙏',
  '❤️', '💔', '🎉', '🎊', '🌹', '🌸', '💐', '🌟', '⭐', '🌙'
]

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
  const value = e.detail.value
  if (value.trim()) {
    handleSend()
  }
}

// 发送
function handleSend() {
  if (!props.canSend || props.disabled) return
  emit('send', props.modelValue)
  emit('update:modelValue', '')
}

// 点击附件
function handleAttach() {
  showActionPanel.value = !showActionPanel.value
  showEmojiPanel.value = false
}

// 点击表情
function handleEmoji() {
  showEmojiPanel.value = !showEmojiPanel.value
  showActionPanel.value = false
}

// 选择表情
function handleSelectEmoji(emoji: string) {
  emit('select-emoji', emoji)
  showEmojiPanel.value = false
}

// 选择图片
function handleChooseImage() {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    success: (res) => {
      emit('choose-image', res.tempFilePaths)
    }
  })
}

// 选择拍照
function handleChooseCamera() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (  res) => {
      emit('choose-camera', res.tempFilePaths)
    }
  })
}

// 选择位置
function handleChooseLocation() {
  uni.chooseLocation({
    success: (res) => {
      emit('choose-location', res)
    }
  })
}

// 选择文件
function handleChooseFile() {
  // 这里可以选择实现文件选择
  emit('choose-file')
}

// 选择名片
function handleChooseCard() {
  emit('choose-card')
}

// 选择提示
function handleSelectTip(tip: string) {
  emit('update:modelValue', props.modelValue + tip)
}

// 监听值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal && showEmojiPanel.value) {
    showEmojiPanel.value = false
  }
})

// 暴露方法
defineExpose({
  focus: () => {
    focused.value = true
  },
  blur: () => {
    focused.value = false
  },
  openEmoji: () => {
    showEmojiPanel.value = true
    showActionPanel.value = false
  },
  openAction: () => {
    showActionPanel.value = true
    showEmojiPanel.value = false
  },
  closePanel: () => {
    showEmojiPanel.value = false
    showActionPanel.value = false
  }
})
</script>

<script lang="ts">
export default {
  name: 'ChatInput',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.chat-input {
  width: 100%;
  background: var(--bg-color-card);

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 16rpx;
    padding: 16rpx;
    border: 1rpx solid var(--border-color-base);
    border-radius: 12rpx;

    .toolbar {
      display: flex;
      gap: 16rpx;
      padding-bottom: 12rpx;
      border-bottom: 1rpx solid var(--border-color-light);
      margin-bottom: 12rpx;

      .toolbar-btn {
        width: 48rpx;
        height: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--bg-color-disabled);
        transition: background 0.2s;

        &:active {
          background: var(--border-color-base);
        }

        .btn-icon {
          font-size: 32rpx;
        }
      }
    }

    .input-container {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 12rpx;

      &.has-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .input-field {
        flex: 1;
        font-size: 28rpx;
        color: var(--text-color-primary);
        background: transparent;

        &.textarea-field {
          min-height: 80rpx;
          max-height: 200rpx;
        }
      }

      .attach-btn,
      .emoji-btn {
        width: 48rpx;
        height: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-bottom: 8rpx;

        .btn-icon {
          font-size: 32rpx;
          color: var(--text-color-tertiary);
        }
      }
    }

    .send-btn {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: $primary-color;
      transition: all 0.2s;

      &.is-disabled {
        background: var(--border-color-base);
      }

      &:not(.is-disabled):active {
        transform: scale(0.95);
      }

      .send-icon {
        font-size: 32rpx;
        color: var(--bg-color-card);
        line-height: 1;
      }
    }
  }

  .emoji-panel,
  .action-panel {
    max-height: 400rpx;
    background: var(--bg-color-disabled);
    border-radius: 12rpx;
    margin-top: 16rpx;
    overflow: hidden;

    .emoji-list {
      height: 300rpx;
      padding: 16rpx;

      .emoji-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 80rpx;
        height: 80rpx;
        font-size: 48rpx;
      }
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 24rpx;
      padding: 32rpx;

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12rpx;

        .action-icon {
          font-size: 48rpx;
        }

        .action-label {
          font-size: 22rpx;
          color: var(--text-color-secondary);
        }
      }
    }
  }

  .input-tips {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    padding-top: 12rpx;
    border-top: 1rpx solid var(--border-color-light);

    .tip-item {
      padding: 8rpx 16rpx;
      background: var(--bg-color-disabled);
      border-radius: 24rpx;

      .tip-text {
        font-size: 24rpx;
        color: var(--text-color-secondary);
      }
    }
  }
}
</style>
