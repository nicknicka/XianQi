<template>
  <view
    class="page-transition"
    :class="transitionClass"
    :style="transitionStyle"
  >
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

interface Props {
  // 动画类型
  type?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'bounce'
  // 延迟时间（毫秒）
  delay?: number
  // 动画时长（毫秒）
  duration?: number
  // 是否在挂载时自动执行
  auto?: boolean
  // 是否循环动画
  loop?: boolean
  // 自定义缓动函数
  timingFunction?: string
  // 是否交错子元素
  stagger?: boolean
  // 交错延迟（毫秒）
  staggerDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'fade',
  delay: 0,
  duration: 400,
  auto: true,
  loop: false,
  timingFunction: 'ease-out',
  stagger: false,
  staggerDelay: 100
})

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'end'): void
}>()

const isPlaying = ref(false)
const childrenElements = ref<any[]>([])

const transitionClass = computed(() => {
  if (!isPlaying.value) return ''
  return `transition-${props.type}`
})

const transitionStyle = computed(() => {
  if (!isPlaying.value) return {}

  return {
    '--transition-delay': `${props.delay}ms`,
    '--transition-duration': `${props.duration}ms`,
    '--transition-timing': props.timingFunction,
    '--stagger-delay': `${props.staggerDelay}ms`
  }
})

/**
 * 执行入场动画
 */
async function play() {
  if (isPlaying.value && !props.loop) return

  emit('start')
  isPlaying.value = true

  // 处理子元素交错动画
  if (props.stagger) {
    await nextTick()
    const query = uni.createSelectorQuery().in(this as any)
    query.selectAll('.stagger-item').boundingClientRect()
    query.exec((res) => {
      if (res && res[0]) {
        const elements = res[0]
        elements.forEach((_: any, index: number) => {
          setTimeout(() => {
            // 这里可以通过添加类名来触发子元素动画
          }, index * props.staggerDelay)
        })
      }
    })
  }

  // 动画结束回调
  setTimeout(() => {
    emit('end')
    if (!props.loop) {
      isPlaying.value = false
    }
  }, props.delay + props.duration)
}

/**
 * 重置动画状态
 */
function reset() {
  isPlaying.value = false
}

/**
 * 离场动画
 */
async function playExit() {
  isPlaying.value = false
  // 可以添加离场动画逻辑
}

onMounted(() => {
  if (props.auto) {
    setTimeout(() => {
      play()
    }, 50)
  }
})

defineExpose({
  play,
  reset,
  playExit
})
</script>

<style lang="scss" scoped>
.page-transition {
  // 淡入
  &.transition-fade {
    animation: fadeIn var(--transition-duration)
      var(--transition-timing) var(--transition-delay);
  }

  // 上滑进入
  &.transition-slide-up {
    animation: slideUp var(--transition-duration)
      var(--transition-timing)
      var(--transition-delay);
  }

  // 下滑进入
  &.transition-slide-down {
    animation: slideDown var(--transition-duration)
      var(--transition-timing)
      var(--transition-delay);
  }

  // 左滑进入
  &.transition-slide-left {
    animation: slideLeft var(--transition-duration)
      var(--transition-timing)
      var(--transition-delay);
  }

  // 右滑进入
  &.transition-slide-right {
    animation: slideRight var(--transition-duration)
      var(--transition-timing)
      var(--transition-delay);
  }

  // 缩放进入
  &.transition-zoom {
    animation: zoom var(--transition-duration)
      var(--transition-timing)
      var(--transition-delay);
  }

  // 弹跳进入
  &.transition-bounce {
    animation: bounce var(--transition-duration)
      cubic-bezier(0.68, -0.55, 0.265, 1.55) var(--transition-delay);
  }

  // 交错子元素
  .stagger-item {
    opacity: 0;
    animation: fadeIn 300ms ease-out calc(
      var(--transition-delay) + var(--stagger-delay) * var(--stagger-index)
    );
  }
}

// 关键帧动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(60rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-60rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(60rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-60rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes zoom {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
