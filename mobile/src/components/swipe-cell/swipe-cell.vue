<template>
  <view class="swipe-cell" :class="[customClass]" :style="customStyle">
    <movable-area class="swipe-area" :scale-area="false">
      <movable-view
        class="swipe-movable"
        :direction="direction"
        :inertia="true"
        :out-of-bounds="false"
        :damping="40"
        :friction="2"
        :x="movableX"
        :y="movableY"
        @change="handleMoveChange"
        @touchend="handleTouchEnd"
      >
        <!-- 主内容 -->
        <view class="swipe-content" @click="handleContentClick">
          <slot></slot>
        </view>

        <!-- 右侧操作按钮 -->
        <view v-if="rightActions.length > 0" class="swipe-right">
          <view
            v-for="(action, index) in rightActions"
            :key="index"
            class="action-btn"
            :style="{
              width: action.width || '140rpx',
              background: action.color || getDefaultColor(action.type, index)
            }"
            @click.stop="handleActionClick(action, 'right', index)"
          >
            <text class="btn-icon">{{ action.icon || '' }}</text>
            <text class="btn-text">{{ action.text }}</text>
          </view>
        </view>

        <!-- 左侧操作按钮 -->
        <view v-if="leftActions.length > 0" class="swipe-left">
          <view
            v-for="(action, index) in leftActions"
            :key="index"
            class="action-btn"
            :style="{
              width: action.width || '140rpx',
              background: action.color || getDefaultColor(action.type, index)
            }"
            @click.stop="handleActionClick(action, 'left', index)"
          >
            <text class="btn-icon">{{ action.icon || '' }}</text>
            <text class="btn-text">{{ action.text }}</text>
          </view>
        </view>
      </movable-view>
    </movable-area>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

export type SwipeDirection = 'horizontal' | 'vertical' | 'all'
export type ActionType = 'normal' | 'warning' | 'danger' | 'primary'

export interface SwipeAction {
  text: string
  type?: ActionType
  icon?: string
  color?: string
  width?: string
  [key: string]: any
}

interface Props {
  /** 右侧操作按钮 */
  rightActions?: SwipeAction[]
  /** 左侧操作按钮 */
  leftActions?: SwipeAction[]
  /** 滑动方向 */
  direction?: SwipeDirection
  /** 是否禁用 */
  disabled?: boolean
  /** 自动关闭 */
  autoClose?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  rightActions: () => [],
  leftActions: () => [],
  direction: 'horizontal',
  disabled: false,
  autoClose: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'action-click': [action: SwipeAction, position: 'left' | 'right', index: number]
  'open': [position: 'left' | 'right']
  'close': []
}>()

const movableX = ref(0)
const movableY = ref(0)
const isOpened = ref(false)
const openedPosition = ref<'left' | 'right' | null>(null)

// 右侧按钮总宽度
const rightWidth = computed(() => {
  return props.rightActions.reduce((total, action) => {
    return total + parseInt(action.width || '140')
  }, 0)
})

// 左侧按钮总宽度
const leftWidth = computed(() => {
  return props.leftActions.reduce((total, action) => {
    return total + parseInt(action.width || '140')
  }, 0)
})

// 获取默认颜色
function getDefaultColor(type?: ActionType, index?: number): string {
  if (type === 'danger') return 'var(--danger-color)'
  if (type === 'warning') return 'var(--warning-color)'
  if (type === 'primary') return 'var(--primary-color)'
  if (type === 'normal') return 'var(--bg-color-disabled)'

  // 默认根据索引给颜色
  if (index === 0) return 'var(--danger-color)'
  if (index === 1) return 'var(--warning-color)'
  return 'var(--bg-color-disabled)'
}

// 移动变化
function handleMoveChange(e: any) {
  if (props.disabled) return

  const x = e.detail.x
  const y = e.detail.y

  if (props.direction === 'horizontal') {
    // 向左滑动，显示右侧按钮
    if (x < -10 && props.rightActions.length > 0) {
      if (!isOpened.value || openedPosition.value !== 'right') {
        isOpened.value = true
        openedPosition.value = 'right'
        emit('open', 'right')
      }
    }
    // 向右滑动，显示左侧按钮
    else if (x > 10 && props.leftActions.length > 0) {
      if (!isOpened.value || openedPosition.value !== 'left') {
        isOpened.value = true
        openedPosition.value = 'left'
        emit('open', 'left')
      }
    }
    // 关闭
    else if (Math.abs(x) < 10 && isOpened.value) {
      close()
    }
  }
}

// 触摸结束
function handleTouchEnd() {
  if (props.disabled) return

  // 自动定位到打开或关闭状态
  if (isOpened.value) {
    if (openedPosition.value === 'right') {
      movableX.value = -rightWidth.value
    } else if (openedPosition.value === 'left') {
      movableX.value = leftWidth.value
    }
  } else {
    close()
  }
}

// 点击内容
function handleContentClick() {
  if (isOpened.value) {
    close()
  }
}

// 点击操作按钮
function handleActionClick(action: SwipeAction, position: 'left' | 'right', index: number) {
  emit('action-click', action, position, index)

  if (props.autoClose) {
    close()
  }
}

// 关闭
function close() {
  movableX.value = 0
  movableY.value = 0
  isOpened.value = false
  openedPosition.value = null
  emit('close')
}

// 暴露方法
defineExpose({
  close,
  open: (position: 'left' | 'right' = 'right') => {
    isOpened.value = true
    openedPosition.value = position

    if (position === 'right') {
      movableX.value = -rightWidth.value
    } else {
      movableX.value = leftWidth.value
    }

    emit('open', position)
  }
})
</script>

<script lang="ts">
export default {
  name: 'SwipeCell',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.swipe-cell {
  position: relative;
  width: 100%;
  overflow: hidden;

  .swipe-area {
    width: 100%;
    height: 100%;
    position: relative;

    .swipe-movable {
      display: flex;
      height: 100%;
      min-width: 100%;

      .swipe-content {
        min-width: 100%;
        flex-shrink: 0;
        background: var(--bg-color-card);
      }

      .swipe-right {
        display: flex;
        flex-shrink: 0;
        height: 100%;

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 32rpx;
          color: var(--bg-color-card);

          .btn-icon {
            font-size: 36rpx;
            margin-bottom: 8rpx;
          }

          .btn-text {
            font-size: 24rpx;
          }
        }
      }

      .swipe-left {
        display: flex;
        flex-shrink: 0;
        height: 100%;

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 32rpx;
          color: var(--bg-color-card);

          .btn-icon {
            font-size: 36rpx;
            margin-bottom: 8rpx;
          }

          .btn-text {
            font-size: 24rpx;
          }
        }
      }
    }
  }
}
</style>
