<template>
  <view class="infinite-scroll-container">
    <!-- 列表内容 -->
    <slot></slot>

    <!-- 加载状态 -->
    <view v-if="state !== 'idle'" class="infinite-scroll-status">
      <!-- 加载中 -->
      <view v-if="state === 'loading'" class="status-loading">
        <view class="loading-spinner"></view>
        <text class="status-text">{{ loadingText }}</text>
      </view>

      <!-- 加载完成 -->
      <view v-else-if="state === 'loaded'" class="status-loaded">
        <view class="divider-line"></view>
        <text class="status-text">{{ loadedText }}</text>
        <view class="divider-line"></view>
      </view>

      <!-- 加载失败 -->
      <view v-else-if="state === 'error'" class="status-error" @click="handleRetry">
        <text class="error-icon">⚠️</text>
        <text class="status-text">{{ errorText }}</text>
        <text class="retry-text">点击重试</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  /** 是否禁用 */
  disabled?: boolean
  /** 加载中文字 */
  loadingText?: string
  /** 加载完成文字 */
  loadedText?: string
  /** 错误提示文字 */
  errorText?: string
  /** 距离底部多少像素触发加载 */
  distance?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loadingText: '加载中...',
  loadedText: '没有更多了',
  errorText: '加载失败',
  distance: 100
})

const emit = defineEmits<{
  load: []
}>()

type State = 'idle' | 'loading' | 'loaded' | 'error'
const state = ref<State>('idle')
const observer = ref<UniApp.IntersectionObserver | null>(null)

// 设置状态
function setState(newState: State) {
  state.value = newState
}

// 加载失败
function setError() {
  state.value = 'error'
}

// 加载完成（没有更多数据）
function setLoaded() {
  state.value = 'loaded'
}

// 重置状态
function reset() {
  state.value = 'idle'
}

// 重试加载
function handleRetry() {
  if (state.value === 'error') {
    loadMore()
  }
}

// 加载更多
function loadMore() {
  if (props.disabled || state.value === 'loading' || state.value === 'loaded') {
    return
  }

  state.value = 'loading'
  emit('load')
}

// 初始化 IntersectionObserver
function initObserver() {
  observer.value = uni.createIntersectionObserver(null, {
    thresholds: [0.1],
    observeAll: false
  })

  observer.value.relativeToViewport({
    bottom: props.distance
  })

  observer.value.observe('.infinite-scroll-status', (res) => {
    if (res.intersectionRatio > 0 && !props.disabled) {
      if (state.value === 'idle' || state.value === 'error') {
        loadMore()
      }
    }
  })
}

onMounted(() => {
  initObserver()
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
})

// 监听禁用状态
watch(() => props.disabled, (disabled) => {
  if (disabled && observer.value) {
    observer.value.disconnect()
  } else if (!disabled) {
    initObserver()
  }
})

// 暴露方法
defineExpose({
  setState,
  setError,
  setLoaded,
  reset,
  loadMore
})
</script>

<script lang="ts">
export default {
  name: 'InfiniteScroll',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.infinite-scroll-container {
  width: 100%;
}

.infinite-scroll-status {
  width: 100%;
  padding: 48rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-loading {
  display: flex;
  align-items: center;
  gap: 24rpx;

  .loading-spinner {
    width: 40rpx;
    height: 40rpx;
    border: 4rpx solid var(--border-color-light);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .status-text {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-loaded {
  display: flex;
  align-items: center;
  gap: 24rpx;

  .divider-line {
    width: 80rpx;
    height: 1px;
    background: var(--border-color-base);
  }

  .status-text {
    font-size: 24rpx;
    color: var(--text-color-tertiary);
    white-space: nowrap;
  }
}

.status-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  cursor: pointer;

  .error-icon {
    font-size: 48rpx;
  }

  .status-text {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
  }

  .retry-text {
    font-size: 24rpx;
    color: var(--primary-color);
    padding: 8rpx 24rpx;
    border: 1rpx solid var(--primary-color);
    border-radius: 24rpx;
  }
}
</style>
