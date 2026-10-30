<template>
  <scroll-view
    class="pull-refresh-container"
    :class="{ 'is-pulling': pulling, 'is-refreshing': refreshing }"
    scroll-y
    :scroll-top="scrollTop"
    @scroll="onScroll"
    @scrolltoupper="onScrollToUpper"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 下拉刷新提示 -->
    <view class="pull-refresh-header" :style="{ height: `${pullHeight}px`, transform: `translateY(${pullHeight - pullDistance}px)` }">
      <view class="refresh-content">
        <!-- 状态图标 -->
        <view class="refresh-icon">
          <view v-if="refreshing" class="icon-loading"></view>
          <view v-else-if="pullStatus === 'loose'" class="icon-arrow" :class="{ 'rotate': canRelease }">↓</view>
          <view v-else class="icon-success">✓</view>
        </view>

        <!-- 状态文字 -->
        <text class="refresh-text">{{ refreshText }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="pull-refresh-content">
      <slot></slot>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  /** 下拉阈值（超过此值松手可触发刷新） */
  threshold?: number
  /** 最大下拉距离 */
  maxDistance?: number
  /** 刷新中文字 */
  refreshingText?: string
  /** 下拉提示文字 */
  pullingText?: string
  /** 释放提示文字 */
  releaseText?: string
  /** 刷新成功文字 */
  successText?: string
  /** 成功提示显示时长 */
  successDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 80,
  maxDistance: 150,
  refreshingText: '加载中...',
  pullingText: '下拉刷新',
  releaseText: '释放刷新',
  successText: '刷新成功',
  successDuration: 1500
})

const emit = defineEmits<{
  refresh: []
}>()

// 状态
type PullStatus = 'idle' | 'pulling' | 'loose' | 'refreshing' | 'success'
const pullStatus = ref<PullStatus>('idle')
const pulling = ref(false)
const refreshing = ref(false)

// 拖拽相关
const startY = ref(0)
const pullDistance = ref(0)
const pullHeight = ref(0)
const scrollTop = ref(0)
const isScrolling = ref(false)

// 是否可以释放刷新
const canRelease = computed(() => {
  return pullDistance.value >= props.threshold
})

// 刷新文字
const refreshText = computed(() => {
  if (refreshing.value) return props.refreshingText
  if (pullStatus.value === 'success') return props.successText
  if (canRelease.value) return props.releaseText
  if (pullDistance.value > 10) return props.pullingText
  return ''
})

// 触摸开始
function onTouchStart(e: TouchEvent) {
  if (refreshing.value) return

  const touch = e.touches[0]
  startY.value = touch.clientY
  isScrolling.value = false
  pullHeight.value = 0
}

// 触摸移动
function onTouchMove(e: TouchEvent) {
  if (refreshing.value) return

  const touch = e.touches[0]
  const distance = touch.clientY - startY.value

  // 判断滚动方向
  if (scrollTop.value <= 0 && distance > 0) {
    // 向下拉且已经在顶部
    isScrolling.value = true
  }

  if (!isScrolling.value) return

  // 计算下拉距离（带阻尼效果）
  const dampDistance = distance * 0.4
  pullDistance.value = Math.min(dampDistance, props.maxDistance)

  if (pullDistance.value > 10) {
    pulling.value = true

    if (pullDistance.value >= props.threshold) {
      pullStatus.value = 'loose'
    } else {
      pullStatus.value = 'pulling'
    }
  }
}

// 触摸结束
function onTouchEnd() {
  isScrolling.value = false

  if (!pulling.value) return

  if (canRelease.value) {
    // 触发刷新
    startRefresh()
  } else {
    // 回弹
    resetPull()
  }
}

// 开始刷新
function startRefresh() {
  pullHeight.value = props.threshold
  pullDistance.value = props.threshold
  pullStatus.value = 'refreshing'
  refreshing.value = true

  emit('refresh')
}

// 完成刷新
function finishRefresh() {
  pullStatus.value = 'success'

  setTimeout(() => {
    resetPull()
  }, props.successDuration)
}

// 重置下拉状态
function resetPull() {
  pulling.value = false
  refreshing.value = false
  pullDistance.value = 0
  pullHeight.value = 0
  pullStatus.value = 'idle'
}

// 滚动事件
function onScroll(e: any) {
  scrollTop.value = e.detail.scrollTop
}

// 滚动到顶部
function onScrollToUpper() {
  // 可以在这里处理其他逻辑
}

// 暴露方法
defineExpose({
  finishRefresh,
  resetPull,
  triggerRefresh: startRefresh
})
</script>

<script lang="ts">
export default {
  name: 'PullRefresh',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.pull-refresh-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  &.is-pulling {
    .pull-refresh-content {
      transition: transform 0.3s ease;
    }
  }

  &.is-refreshing {
    .pull-refresh-content {
      transition: transform 0.3s ease;
    }
  }
}

.pull-refresh-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;

  .refresh-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 0;

    .refresh-icon {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon-loading {
        width: 48rpx;
        height: 48rpx;
        border: 4rpx solid var(--border-color-light);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .icon-arrow {
        font-size: 48rpx;
        color: var(--text-color-tertiary);
        transition: transform 0.3s ease;

        &.rotate {
          transform: rotate(180deg);
        }
      }

      .icon-success {
        font-size: 48rpx;
        color: var(--success-color);
        animation: scaleIn 0.3s ease;
      }
    }

    .refresh-text {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
      white-space: nowrap;
    }
  }
}

.pull-refresh-content {
  width: 100%;
  min-height: 100%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
