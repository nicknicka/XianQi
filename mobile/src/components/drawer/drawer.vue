<template>
  <view class="drawer-wrapper">
    <!-- 遮罩层 -->
    <transition name="fade">
      <view
        v-if="visible && mask"
        class="drawer-mask"
        :class="{ 'is-closable': maskClosable }"
        @click="handleMaskClick"
      ></view>
    </transition>

    <!-- 抽屉内容 -->
    <transition :name="`slide-${placement}`">
      <view
        v-if="visible"
        class="drawer-content"
        :class="[`placement-${placement}`, customClass]"
        :style="contentStyle"
      >
        <!-- 头部 -->
        <view v-if="showHeader" class="drawer-header">
          <slot name="header">
            <view class="header-left">
              <text v-if="title" class="header-title">{{ title }}</text>
            </view>
            <view class="header-right">
              <view
                v-if="closable"
                class="header-close"
                @click="handleClose"
              >
                <text class="close-icon">×</text>
              </view>
            </view>
          </slot>
        </view>

        <!-- 内容区域 -->
        <view class="drawer-body" :style="bodyStyle">
          <slot></slot>
        </view>

        <!-- 底部 -->
        <view v-if="showFooter" class="drawer-footer">
          <slot name="footer">
            <view class="footer-buttons">
              <view
                v-if="showCancel"
                class="footer-btn cancel-btn"
                @click="handleCancel"
              >
                <text class="btn-text">{{ cancelText }}</text>
              </view>
              <view
                v-if="showConfirm"
                class="footer-btn confirm-btn"
                @click="handleConfirm"
              >
                <text class="btn-text">{{ confirmText }}</text>
              </view>
            </view>
          </slot>
        </view>
      </view>
    </transition>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

interface Props {
  /** 是否显示抽屉 */
  visible?: boolean
  /** 抽屉位置 */
  placement?: DrawerPlacement
  /** 宽度（left/right 时有效） */
  width?: string
  /** 高度（top/bottom 时有效） */
  height?: string
  /** 是否显示遮罩 */
  mask?: boolean
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean
  /** 是否显示头部 */
  showHeader?: boolean
  /** 标题 */
  title?: string
  /** 是否显示关闭按钮 */
  closable?: boolean
  /** 是否显示底部 */
  showFooter?: boolean
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否显示确认按钮 */
  showConfirm?: boolean
  /** 确认按钮文本 */
  confirmText?: string
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  placement: 'right',
  width: '600rpx',
  height: '60%',
  mask: true,
  maskClosable: true,
  showHeader: true,
  title: '',
  closable: true,
  showFooter: false,
  showCancel: true,
  cancelText: '取消',
  showConfirm: true,
  confirmText: '确定',
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
  'cancel': []
  'confirm': []
  'open': []
}>()

// 内容样式
const contentStyle = computed(() => {
  const styles: Record<string, string> = {}

  if (props.placement === 'left' || props.placement === 'right') {
    styles.width = props.width
  } else {
    styles.height = props.height
  }

  if (typeof props.customStyle === 'string') {
    // 如果是字符串，直接使用
    return styles
  }

  return { ...styles, ...props.customStyle }
})

// 内容区域样式
const bodyStyle = computed(() => {
  const styles: Record<string, string> = {}

  // 根据是否有头部和底部来计算高度
  if (props.showHeader && props.showFooter) {
    // 都有，不设置
  } else if (props.showHeader) {
    styles.height = '100%'
  } else if (props.showFooter) {
    styles.height = '100%'
  }

  return styles
})

// 点击遮罩
function handleMaskClick() {
  if (props.maskClosable) {
    handleClose()
  }
}

// 关闭抽屉
function handleClose() {
  emit('update:visible', false)
  emit('close')
}

// 取消
function handleCancel() {
  emit('cancel')
  handleClose()
}

// 确认
function handleConfirm() {
  emit('confirm')
}

// 监听显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    emit('open')
  }
})
</script>

<script lang="ts">
export default {
  name: 'Drawer',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.drawer-wrapper {
  position: relative;
  z-index: 1000;
}

.drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;

  &.is-closable {
    cursor: pointer;
  }
}

.drawer-content {
  position: fixed;
  background: var(--bg-color-card);
  z-index: 1002;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 100%;

  // 位置变体
  &.placement-left {
    top: 0;
    left: 0;
    bottom: 0;
    box-shadow: 4rpx 0 24rpx rgba(0, 0, 0, 0.15);
  }

  &.placement-right {
    top: 0;
    right: 0;
    bottom: 0;
    box-shadow: -4rpx 0 24rpx rgba(0, 0, 0, 0.15);
  }

  &.placement-top {
    top: 0;
    left: 0;
    right: 0;
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.15);
  }

  &.placement-bottom {
    bottom: 0;
    left: 0;
    right: 0;
    box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.15);
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid var(--border-color-light);
    flex-shrink: 0;

    .header-left {
      flex: 1;

      .header-title {
        font-size: 32rpx;
        color: var(--text-color-primary);
        font-weight: 600;
      }
    }

    .header-right {
      flex-shrink: 0;

      .header-close {
        width: 48rpx;
        height: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;

        &:active {
          background: var(--bg-color-disabled);
        }

        .close-icon {
          font-size: 40rpx;
          color: var(--text-color-tertiary);
          line-height: 1;
        }
      }
    }
  }

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .drawer-footer {
    padding: 24rpx 32rpx;
    border-top: 1rpx solid var(--border-color-light);
    flex-shrink: 0;

    .footer-buttons {
      display: flex;
      gap: 16rpx;

      .footer-btn {
        flex: 1;
        height: 72rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 36rpx;
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

        &.confirm-btn {
          background: $primary-color;

          .btn-text {
            color: var(--bg-color-card);
          }
        }
      }
    }
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.slide-top-enter-active,
.slide-top-leave-active,
.slide-bottom-enter-active,
.slide-bottom-leave-active {
  transition: transform 0.3s;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-top-enter-from,
.slide-top-leave-to {
  transform: translateY(-100%);
}

.slide-bottom-enter-from,
.slide-bottom-leave-to {
  transform: translateY(100%);
}
</style>
