<template>
  <view class="popover-wrapper" :class="[`placement-${placement}`, customClass]" :style="customStyle">
    <!-- 触发器 -->
    <view class="popover-trigger" @click="handleTriggerClick">
      <slot name="trigger">
        <view class="default-trigger">
          <text class="trigger-text">点击</text>
        </view>
      </slot>
    </view>

    <!-- 气泡内容 -->
    <view v-if="visible" class="popover-content" :class="`placement-${placement}`" @click.stop>
      <!-- 箭头 -->
      <view v-if="showArrow" class="popover-arrow" :class="`arrow-${placement}`"></view>

      <!-- 内容 -->
      <view class="popover-inner">
        <slot></slot>
      </view>
    </view>

    <!-- 遮罩层 -->
    <view v-if="visible && mask" class="popover-mask" @click="handleMaskClick"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type PopoverTrigger = 'click' | 'hover'

interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 位置 */
  placement?: PopoverPlacement
  /** 触发方式 */
  trigger?: PopoverTrigger
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 是否显示遮罩 */
  mask?: boolean
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean
  /** 偏移量（rpx） */
  offset?: number
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  placement: 'bottom',
  trigger: 'click',
  showArrow: true,
  mask: false,
  maskClosable: true,
  offset: 0,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'show': []
  'hide': []
  'click': []
}>()

const internalVisible = ref(props.visible)

// 点击触发器
function handleTriggerClick() {
  if (props.trigger === 'click') {
    toggleVisible()
  }
}

// 切换显示状态
function toggleVisible() {
  internalVisible.value = !internalVisible.value

  if (internalVisible.value) {
    emit('show')
  } else {
    emit('hide')
  }

  emit('update:visible', internalVisible.value)
  emit('click')
}

// 点击遮罩
function handleMaskClick() {
  if (props.maskClosable) {
    internalVisible.value = false
    emit('hide')
    emit('update:visible', false)
  }
}

// 监听外部 visible 变化
watch(() => props.visible, (newVal) => {
  internalVisible.value = newVal
})

// 暴露方法
defineExpose({
  show: () => {
    internalVisible.value = true
    emit('show')
    emit('update:visible', true)
  },
  hide: () => {
    internalVisible.value = false
    emit('hide')
    emit('update:visible', false)
  },
  toggle: () => {
    toggleVisible()
  }
})
</script>

<script lang="ts">
export default {
  name: 'Popover',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.popover-wrapper {
  position: relative;
  display: inline-block;

  .popover-trigger {
    display: inline-block;

    .default-trigger {
      padding: 12rpx 24rpx;
      background: var(--bg-color-disabled);
      border-radius: 8rpx;

      .trigger-text {
        font-size: 28rpx;
        color: var(--text-color-primary);
      }
    }
  }

  .popover-content {
    position: absolute;
    z-index: 1000;
    background: var(--bg-color-card);
    border-radius: 8rpx;
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.15);
    min-width: 200rpx;

    // 位置变体
    &.placement-top {
      bottom: calc(100% + 12rpx);
      left: 50%;
      transform: translateX(-50%);
    }

    &.placement-top-start {
      bottom: calc(100% + 12rpx);
      left: 0;
    }

    &.placement-top-end {
      bottom: calc(100% + 12rpx);
      right: 0;
    }

    &.placement-bottom {
      top: calc(100% + 12rpx);
      left: 50%;
      transform: translateX(-50%);
    }

    &.placement-bottom-start {
      top: calc(100% + 12rpx);
      left: 0;
    }

    &.placement-bottom-end {
      top: calc(100% + 12rpx);
      right: 0;
    }

    &.placement-left {
      right: calc(100% + 12rpx);
      top: 50%;
      transform: translateY(-50%);
    }

    &.placement-left-start {
      right: calc(100% + 12rpx);
      top: 0;
    }

    &.placement-left-end {
      right: calc(100% + 12rpx);
      bottom: 0;
    }

    &.placement-right {
      left: calc(100% + 12rpx);
      top: 50%;
      transform: translateY(-50%);
    }

    &.placement-right-start {
      left: calc(100% + 12rpx);
      top: 0;
    }

    &.placement-right-end {
      left: calc(100% + 12rpx);
      bottom: 0;
    }

    .popover-arrow {
      position: absolute;
      width: 0;
      height: 0;
      border: 12rpx solid transparent;

      // 箭头位置
      &.arrow-top {
        bottom: -24rpx;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: #fff;
        border-bottom: none;
      }

      &.arrow-bottom {
        top: -24rpx;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: #fff;
        border-top: none;
      }

      &.arrow-left {
        right: -24rpx;
        top: 50%;
        transform: translateY(-50%);
        border-left-color: #fff;
        border-right: none;
      }

      &.arrow-right {
        left: -24rpx;
        top: 50%;
        transform: translateY(-50%);
        border-right-color: #fff;
        border-left: none;
      }
    }

    .popover-inner {
      padding: 16rpx;
    }
  }

  .popover-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    background: transparent;
  }
}
</style>
