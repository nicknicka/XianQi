<template>
  <view class="fab-wrapper" :class="[`position-${position}`, customClass]" :style="wrapperStyle">
    <!-- 展开的子按钮 -->
    <transition-group name="fab-item">
      <view
        v-for="(item, index) in visibleItems"
        :key="item.id || index"
        v-show="expanded"
        class="fab-item"
        :class="[
          `fab-item-${direction}`,
          `size-${item.size || size}`
        ]"
        :style="getItemStyle(index)"
        @click="handleItemClick(item, index)"
      >
        <!-- 图标 -->
        <view v-if="item.icon" class="item-icon">
          <image
            v-if="item.iconType === 'image'"
            class="icon-image"
            :src="item.icon"
            mode="aspectFit"
          />
          <text v-else class="icon-text">{{ item.icon }}</text>
        </view>

        <!-- 文字标签 -->
        <text v-if="item.label" class="item-label">{{ item.label }}</text>

        <!-- 徽章 -->
        <view v-if="item.badge" class="item-badge">
          <text class="badge-text">{{ item.badge }}</text>
        </view>
      </view>
    </transition-group>

    <!-- 主按钮 -->
    <view
      class="fab-main"
      :class="{
        [`size-${size}`]: true,
        'is-expanded': expanded,
        'is-disabled': disabled
      }"
      :style="mainStyle"
      @click="handleMainClick"
    >
      <!-- 背景涟漪效果 -->
      <view v-if="ripple" class="fab-ripple"></view>

      <!-- 图标 -->
      <view class="main-icon">
        <image
          v-if="iconType === 'image'"
          class="icon-image"
          :src="expanded ? closeIcon || icon : icon"
          mode="aspectFit"
        />
        <text v-else class="icon-text">{{ expanded ? (closeIcon || icon) : icon }}</text>
      </view>

      <!-- 文字 -->
      <text v-if="text && !expanded" class="main-text">{{ text }}</text>

      <!-- 徽章 -->
      <view v-if="badge" class="main-badge">
        <text class="badge-text">{{ badge }}</text>
      </view>

      <!-- 小圆点 -->
      <view v-if="dot" class="main-dot"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export type FabDirection = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type FabSize = 'small' | 'medium' | 'large'
export type FabPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface FabItem {
  id?: string | number
  icon: string
  iconType?: 'text' | 'image'
  label?: string
  badge?: string | number
  size?: FabSize
  color?: string
  bgColor?: string
  disabled?: boolean
  [key: string]: any
}

interface Props {
  /** 图标 */
  icon?: string
  /** 图标类型 */
  iconType?: 'text' | 'image'
  /** 展开时的图标（关闭图标） */
  closeIcon?: string
  /** 文字 */
  text?: string
  /** 徽章 */
  badge?: string | number
  /** 是否显示小圆点 */
  dot?: boolean
  /** 尺寸 */
  size?: FabSize
  /** 背景色 */
  bgColor?: string
  /** 图标颜色 */
  color?: string
  /** 子菜单项 */
  items?: FabItem[]
  /** 子菜单展开方向 */
  direction?: FabDirection
  /** 位置 */
  position?: FabPosition
  /** 偏移量（rpx） */
  offset?: [number, number]
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示涟漪效果 */
  ripple?: boolean
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  icon: '+',
  iconType: 'text',
  closeIcon: '×',
  text: '',
  badge: '',
  dot: false,
  size: 'medium',
  bgColor: '',
  color: '#fff',
  items: () => [],
  direction: 'top',
  position: 'bottom-right',
  offset: () => [40, 40],
  disabled: false,
  ripple: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'click': []
  'item-click': [item: FabItem, index: number]
}>()

const expanded = ref(false)

// 可见的菜单项（排除禁用的）
const visibleItems = computed(() => {
  return props.items.filter(item => !item.disabled)
})

// 容器样式
const wrapperStyle = computed(() => {
  const [x, y] = props.offset
  const styles: Record<string, string> = {}

  switch (props.position) {
    case 'bottom-right':
      styles.right = `${x}rpx`
      styles.bottom = `${y}rpx`
      break
    case 'bottom-left':
      styles.left = `${x}rpx`
      styles.bottom = `${y}rpx`
      break
    case 'top-right':
      styles.right = `${x}rpx`
      styles.top = `${y}rpx`
      break
    case 'top-left':
      styles.left = `${x}rpx`
      styles.top = `${y}rpx`
      break
  }

  return styles
})

// 主按钮样式
const mainStyle = computed(() => {
  const styles: Record<string, string> = {}

  if (props.bgColor) {
    styles.background = props.bgColor
  }

  if (props.color) {
    styles.color = props.color
  }

  return styles
})

// 获取子按钮样式
function getItemStyle(index: number) {
  const styles: Record<string, string> = {}

  // 根据索引设置延迟
  styles.transitionDelay = `${index * 0.05}s`

  return styles
}

// 点击主按钮
function handleMainClick() {
  if (props.disabled) return

  if (props.items.length > 0) {
    expanded.value = !expanded.value
  } else {
    emit('click')
  }
}

// 点击子按钮
function handleItemClick(item: FabItem, index: number) {
  if (item.disabled) return

  emit('item-click', item, index)
  expanded.value = false
}

// 暴露方法
defineExpose({
  open: () => {
    if (props.items.length > 0) {
      expanded.value = true
    }
  },
  close: () => {
    expanded.value = false
  },
  toggle: () => {
    if (props.items.length > 0) {
      expanded.value = !expanded.value
    }
  }
})
</script>

<script lang="ts">
export default {
  name: 'Fab',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.fab-wrapper {
  position: fixed;
  z-index: 999;

  .fab-item {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 16rpx;
    background: var(--bg-color-card);
    border-radius: 48rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;

    // 展开方向
    &.fab-item-top {
      bottom: 100%;
      margin-bottom: 16rpx;
      left: 0;
    }

    &.fab-item-bottom {
      top: 100%;
      margin-top: 16rpx;
      left: 0;
    }

    &.fab-item-left {
      right: 100%;
      margin-right: 16rpx;
      top: 0;
    }

    &.fab-item-right {
      left: 100%;
      margin-left: 16rpx;
      top: 0;
    }

    &.fab-item-top-left {
      bottom: 100%;
      right: 100%;
      margin: 16rpx;
    }

    &.fab-item-top-right {
      bottom: 100%;
      left: 100%;
      margin: 16rpx;
    }

    &.fab-item-bottom-left {
      top: 100%;
      right: 100%;
      margin: 16rpx;
    }

    &.fab-item-bottom-right {
      top: 100%;
      left: 100%;
      margin: 16rpx;
    }

    // 尺寸变体
    &.size-small {
      .item-icon .icon-text {
        font-size: 32rpx;
      }

      .item-label {
        font-size: 24rpx;
      }
    }

    &.size-medium {
      .item-icon .icon-text {
        font-size: 36rpx;
      }

      .item-label {
        font-size: 26rpx;
      }
    }

    &.size-large {
      .item-icon .icon-text {
        font-size: 40rpx;
      }

      .item-label {
        font-size: 28rpx;
      }
    }

    .item-icon {
      flex-shrink: 0;

      .icon-image {
        width: 40rpx;
        height: 40rpx;
      }

      .icon-text {
        font-size: 36rpx;
        color: var(--text-color-primary);
      }
    }

    .item-label {
      font-size: 26rpx;
      color: var(--text-color-primary);
    }

    .item-badge {
      position: absolute;
      top: -8rpx;
      right: -8rpx;
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--error-color);
      border-radius: 16rpx;

      .badge-text {
        font-size: 20rpx;
        color: var(--bg-color-card);
        transform: scale(0.85);
      }
    }
  }

  .fab-main {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
    border-radius: 50%;
    box-shadow: 0 8rpx 24rpx rgba(212, 165, 116, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &:active {
      transform: scale(0.95);
    }

    &.is-expanded {
      transform: rotate(45deg);
    }

    &.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    // 尺寸变体
    &.size-small {
      width: 96rpx;
      height: 96rpx;

      .main-icon .icon-text {
        font-size: 32rpx;
      }

      .main-text {
        font-size: 24rpx;
      }
    }

    &.size-medium {
      width: 112rpx;
      height: 112rpx;

      .main-icon .icon-text {
        font-size: 36rpx;
      }

      .main-text {
        font-size: 26rpx;
      }
    }

    &.size-large {
      width: 128rpx;
      height: 128rpx;

      .main-icon .icon-text {
        font-size: 40rpx;
      }

      .main-text {
        font-size: 28rpx;
      }
    }

    .fab-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    }

    .main-icon {
      flex-shrink: 0;

      .icon-image {
        width: 48rpx;
        height: 48rpx;
      }

      .icon-text {
        font-size: 36rpx;
        color: #fff;
        line-height: 1;
      }
    }

    .main-text {
      font-size: 26rpx;
      color: #fff;
      font-weight: 500;
    }

    .main-badge {
      position: absolute;
      top: -4rpx;
      right: -4rpx;
      min-width: 36rpx;
      height: 36rpx;
      padding: 0 10rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--error-color);
      border: 4rpx solid var(--bg-color-card);
      border-radius: 18rpx;

      .badge-text {
        font-size: 20rpx;
        color: var(--bg-color-card);
        transform: scale(0.85);
      }
    }

    .main-dot {
      position: absolute;
      top: 4rpx;
      right: 4rpx;
      width: 16rpx;
      height: 16rpx;
      background: var(--error-color);
      border: 4rpx solid var(--bg-color-card);
      border-radius: 50%;
    }
  }
}

// 动画
@keyframes ripple {
  to {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.fab-item-enter-active,
.fab-item-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-item-enter-from,
.fab-item-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
