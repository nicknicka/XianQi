<template>
  <view
    class="lazy-image-wrapper"
    :class="{
      'absolute': props.absolute,
      'auto-height': props.mode === 'widthFix' || props.mode === 'heightFix'
    }"
    :style="wrapperStyle"
  >
    <!-- 实际图片 -->
    <image
      v-if="isVisible && (!loadError || useDefaultImage)"
      class="lazy-image"
      :class="{
        'fade-in': isLoaded,
        'is-default': isDefaultImage,
        'auto-height': props.mode === 'widthFix' || props.mode === 'heightFix'
      }"
      :src="currentSrc"
      :mode="actualMode"
      :style="imageStyle"
      @load="onLoad"
      @error="onError"
    />

    <!-- 加载中占位 -->
    <view v-if="!isLoaded && !loadError" class="lazy-placeholder" :style="placeholderStyle">
      <slot name="placeholder">
        <!-- 骨架屏动画 -->
        <view v-if="props.loadingAnimation === 'skeleton'" class="placeholder-content">
          <view class="skeleton-shimmer"></view>
        </view>
        <!-- 旋转加载动画 -->
        <view v-else-if="props.loadingAnimation === 'spinner'" class="placeholder-content">
          <view class="spinner-loader"></view>
        </view>
        <!-- 脉冲动画 -->
        <view v-else-if="props.loadingAnimation === 'pulse'" class="placeholder-content">
          <view class="pulse-loader"></view>
        </view>
        <!-- 点状加载动画 -->
        <view v-else-if="props.loadingAnimation === 'dots'" class="placeholder-content">
          <view class="dots-loader">
            <view class="dot"></view>
            <view class="dot"></view>
            <view class="dot"></view>
          </view>
        </view>
        <!-- 波浪动画 -->
        <view v-else-if="props.loadingAnimation === 'wave'" class="placeholder-content">
          <view class="wave-loader">
            <view class="wave-bar"></view>
            <view class="wave-bar"></view>
            <view class="wave-bar"></view>
            <view class="wave-bar"></view>
            <view class="wave-bar"></view>
          </view>
        </view>
        <!-- 默认图标 -->
        <view v-else class="placeholder-content">
          <text class="placeholder-icon">🖼️</text>
        </view>
      </slot>
    </view>

    <!-- 加载失败占位（仅在不使用默认图片时显示） -->
    <view v-if="loadError && !useDefaultImage" class="lazy-error" @click="retry">
      <slot name="error">
        <view v-if="props.errorIcon" class="error-icon-wrapper">
          <uni-icons :type="props.errorIcon" :size="props.width ? Number(props.width) / 2 : 40" color="#ccc" />
        </view>
        <view v-else class="error-content">
          <text class="error-icon">❌</text>
          <text class="error-text">加载失败</text>
          <text class="retry-text">点击重试</text>
        </view>
      </slot>
    </view>

    <!-- 加载进度 -->
    <view v-if="props.showProgress && isLoading && !isLoaded" class="load-progress">
      <view class="progress-bar" :style="{ width: progress + '%' }"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getImageUrl, normalizeImageUrl, ImageSize } from '@/utils/image'

interface Props {
  /** 图片URL */
  src: string | null | undefined
  /** 图片模式 */
  mode?: 'aspectFill' | 'aspectFit' | 'widthFix' | 'heightFix' | 'scaleToFill'
  /** 图片宽度 */
  width?: string | number
  /** 图片高度 */
  height?: string | number
  /** 是否显示骨架屏 */
  showSkeleton?: boolean
  /** 是否显示加载进度 */
  showProgress?: boolean
  /** 占位图URL */
  placeholder?: string
  /** 是否使用渐入动画 */
  fadeIn?: boolean
  /** 图片尺寸 */
  imageSize?: ImageSize | number
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
  /** 默认图片类型 */
  defaultType?: 'default' | 'user'
  /** 加载动画类型 */
  loadingAnimation?: 'skeleton' | 'spinner' | 'pulse' | 'dots' | 'wave'
  /** 是否禁用懒加载（立即加载） */
  disableLazyLoad?: boolean
  /** 加载失败时显示的图标类型（uni-icons） */
  errorIcon?: string
  /** wrapper 使用绝对定位（用于 height:0 + padding-bottom 场景） */
  absolute?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'aspectFill',
  showSkeleton: false,
  showProgress: false,
  fadeIn: true,
  imageSize: ImageSize.MEDIUM,
  defaultType: 'default',
  loadingAnimation: 'spinner',
  disableLazyLoad: false,
  absolute: false
})

const emit = defineEmits<{
  load: [e: any]
  error: [e: any]
  click: []
}>()

const isVisible = ref(false)
const isLoaded = ref(false)
const loadError = ref(false)
const isLoading = ref(false)
const progress = ref(0)
const retryCount = ref(0)
const maxRetries = 2  // 重试次数（总共尝试2次）
const useDefaultImage = ref(false)
const LOAD_TIMEOUT = 5000 // 5秒超时
let timeoutTimer: number | null = null
let isRetrying = false // 标记是否正在重试

// 默认图片路径映射
const DEFAULT_IMAGES = {
  default: '/static/images/empty.png',
  user: '/static/images/user.png'
}

// 当前使用的默认图片路径
const currentDefaultImage = computed(() => DEFAULT_IMAGES[props.defaultType])

// 当前显示的图片URL（处理图片尺寸）
const currentSrc = computed(() => {
  if (useDefaultImage.value) {
    return currentDefaultImage.value
  }

  if (!props.src) return ''

  try {
    // 先转换相对路径为完整URL，再处理图片尺寸
    const fullUrl = normalizeImageUrl(props.src)
    const finalUrl = getImageUrl(fullUrl, props.imageSize)

    // 添加调试日志
    if (props.src && props.src !== finalUrl) {
      console.log('[LazyImage] URL转换:', {
        原始URL: props.src,
        完整URL: fullUrl,
        最终URL: finalUrl,
        图片尺寸: props.imageSize
      })
    }

    return finalUrl
  } catch (error) {
    console.error('[LazyImage] URL处理失败:', props.src, error)
    return props.src
  }
})

// 判断是否为默认图片
const isDefaultImage = computed(() => {
  if (useDefaultImage.value) return true
  const src = props.src
  return src ? Object.values(DEFAULT_IMAGES).some(img => src.includes(img)) : false
})

// 实际使用的图片模式（默认图片使用 aspectFit）
const actualMode = computed(() => {
  return isDefaultImage.value ? 'aspectFit' : props.mode
})

// 容器样式
const wrapperStyle = computed(() => {
  const style: Record<string, any> = {}

  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}rpx` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
  }

  if (typeof props.customStyle === 'string') {
    return `${style.width || ''} ${style.height || ''} ${props.customStyle}`
  }

  return { ...style, ...(props.customStyle as Record<string, any>) }
})

// 占位符样式
const placeholderStyle = computed(() => {
  const style: Record<string, any> = {}
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}rpx` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
  }
  return style
})

// 图片样式（确保图片有明确的宽高）
const imageStyle = computed(() => {
  const style: Record<string, any> = {
    display: 'block'
  }

  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}rpx` : props.width
  } else {
    style.width = '100%'
  }

  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
  } else if (props.mode === 'widthFix') {
    // widthFix 模式不需要设置高度
  } else {
    // 没有设置高度时，使用最小高度
    style.minHeight = '200rpx'
  }

  return style
})

let initTimer: number | null = null

onMounted(() => {
  // 使用 nextTick 确保 DOM 已经渲染完成
  nextTick(() => {
    // 延迟初始化，确保 DOM 完全渲染（特别是列表渲染的场景）
    initTimer = setTimeout(() => {
      if (props.disableLazyLoad) {
        // 禁用懒加载，立即加载图片
        isVisible.value = true
        loadImage()
      } else {
        // 直接加载图片，不使用 IntersectionObserver
        // 因为 IntersectionObserver 在某些环境下不稳定
        isVisible.value = true
        loadImage()
      }
    }, 150) // 增加延迟到 150ms，确保 swiper 完全渲染
  })
})

onUnmounted(() => {
  // 清除初始化定时器
  if (initTimer) {
    clearTimeout(initTimer)
    initTimer = null
  }

  // 清除超时计时器
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
})

// 加载图片
function loadImage() {
  if (!props.src) {
    console.log('[LazyImage] src 为空，使用默认图片')
    useDefaultImage.value = true
    loadError.value = false
    isLoaded.value = true
    isLoading.value = false
    return
  }

  // 防止重复加载（但允许重试）
  if (isLoading.value && !useDefaultImage.value && !isRetrying) {
    console.log('[LazyImage] ⏸️ 图片正在加载中，跳过重复请求')
    return
  }

  console.log('[LazyImage] 🚀 开始加载图片:', {
    原始URL: props.src,
    最终URL: currentSrc.value,
    图片尺寸: props.imageSize,
    宽度: props.width,
    高度: props.height,
    模式: props.mode,
    禁用懒加载: props.disableLazyLoad,
    当前状态: {
      isVisible: isVisible.value,
      isLoaded: isLoaded.value,
      isLoading: isLoading.value,
      loadError: loadError.value,
      useDefaultImage: useDefaultImage.value
    }
  })

  isLoading.value = true
  loadError.value = false
  isRetrying = false // 重置重试标志

  // 清除之前的超时计时器
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }

  // 设置5秒超时
  timeoutTimer = setTimeout(() => {
    // console.warn(`[LazyImage] 图片加载超时 (${LOAD_TIMEOUT}ms): ${props.src}`)
    // 清除计时器
    timeoutTimer = null

    if (!isLoaded.value && !loadError.value) {
      // 超时后重试或使用默认图片
      if (retryCount.value < maxRetries) {
        retryCount.value++
        // console.warn(`[LazyImage] 超时重试 ${retryCount.value}/${maxRetries}`)
        // 先停止当前加载状态
        isLoading.value = false
        // 标记为重试，允许重复加载
        isRetrying = true
        // 延迟后重新加载
        setTimeout(() => {
          loadImage()
        }, 500)
      } else {
        // console.warn(`[LazyImage] 超时重试次数已达上限，使用默认图片`)
        isLoading.value = false
        useDefaultImage.value = true
        isLoaded.value = true
      }
    }
  }, LOAD_TIMEOUT) as unknown as number

  // 模拟进度（仅用于演示效果）
  if (props.showProgress) {
    simulateProgress()
  }
}

// 模拟加载进度
function simulateProgress() {
  progress.value = 0
  const interval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 30
    } else {
      clearInterval(interval)
    }
  }, 200)
}

// 图片加载成功
function onLoad(e: any) {
  // 清除超时计时器
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }

  const imageWidth = Number(e.detail?.width || 0)
  const imageHeight = Number(e.detail?.height || 0)
  const isTinyPlaceholder = imageWidth > 0 && imageHeight > 0 && imageWidth <= 1 && imageHeight <= 1

  if (isTinyPlaceholder && !useDefaultImage.value) {
    console.log('[LazyImage] 检测到 1x1 占位图，使用默认图片:', props.src)
    useDefaultImage.value = true
    loadError.value = false
    isLoaded.value = true
    isLoading.value = false
    progress.value = 100
    retryCount.value = 0
    return
  }

  isLoaded.value = true
  isLoading.value = false
  progress.value = 100
  retryCount.value = 0

  console.log('[LazyImage] ✅ 图片加载成功:', {
    原始URL: props.src,
    最终URL: currentSrc.value,
    图片尺寸: props.imageSize,
    宽度: props.width,
    高度: props.height,
    模式: props.mode,
    禁用懒加载: props.disableLazyLoad,
    加载时间: `${Date.now() - (initTimer as number || 0)}ms`,
    图片详情: e.detail,
    图片宽度: e.detail?.width,
    图片高度: e.detail?.height
  })

  // 检查图片尺寸是否合理
  if (e.detail && e.detail.width === 0 && e.detail.height === 0) {
    console.error('[LazyImage] ⚠️ 图片尺寸为0x0,可能图片加载失败但返回了成功!')
  }

  emit('load', e)
}

// 图片加载失败
function onError(e: any) {
  console.error('[LazyImage] ❌ 图片加载失败:', {
    原始URL: props.src,
    最终URL: currentSrc.value,
    图片尺寸: props.imageSize,
    错误信息: e,
    重试次数: retryCount.value,
    最大重试: maxRetries
  })

  // 清除超时计时器
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }

  isLoading.value = false
  progress.value = 0

  // 失败后也进行重试
  if (retryCount.value < maxRetries) {
    retryCount.value++
    console.warn(`[LazyImage] 🔄 开始第 ${retryCount.value} 次重试...`)
    // 标记为重试，允许重复加载
    isRetrying = true
    setTimeout(() => {
      loadImage()
    }, 1000) // 延迟1秒后重试
  } else {
    console.error('[LazyImage] ❌ 加载失败，已达最大重试次数，使用默认图片')
    loadError.value = true
    useDefaultImage.value = true
    // 标记为已加载，这样默认图片会显示出来
    isLoaded.value = true
    emit('error', e)
  }
}

// 重试加载
function retry() {
  loadError.value = false
  useDefaultImage.value = false
  retryCount.value = 0
  // console.warn(`[LazyImage] 手动重试加载: ${props.src}`)
  loadImage()
}

// 监听src变化
watch(() => props.src, (newSrc, oldSrc) => {
  if (newSrc && newSrc !== oldSrc) {
    // 清理旧加载状态
    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
      timeoutTimer = null
    }

    // 重置所有状态
    isLoaded.value = false
    loadError.value = false
    useDefaultImage.value = false
    retryCount.value = 0
    isRetrying = false

    if (isVisible.value) {
      loadImage()
    }
  }
})

// 暴露方法
defineExpose({
  retry,
  reload: loadImage
})
</script>

<script lang="ts">
export default {
  name: 'LazyImage',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.lazy-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-color-disabled);
  border-radius: 8rpx;

  // 绝对定位模式（用于 height:0 + padding-bottom 场景）
  &.absolute {
    position: absolute;
    top: 0;
    left: 0;
  }

  // 自适应高度模式（用于 widthFix/heightFix）
  &.auto-height {
    height: auto;
    min-height: 200rpx;
  }
}

.lazy-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;

  &.fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  // 默认图片样式
  &.is-default {
    padding: 60rpx;
    object-fit: contain;
  }

  // 自适应高度模式（用于 widthFix/heightFix）
  &.auto-height {
    position: static;
    height: auto;
    width: 100%;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.lazy-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-disabled);

  .placeholder-content {
    display: flex;
    align-items: center;
    justify-content: center;

    // 骨架屏动画
    .skeleton-shimmer {
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        #f2f2f2 25%,
        var(--border-color-light) 37%,
        #f2f2f2 63%
      );
      background-size: 400% 100%;
      animation: shimmer 1.5s ease infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: 100% 0;
      }
      100% {
        background-position: 0 0;
      }
    }

    // 旋转加载动画
    .spinner-loader {
      width: 60rpx;
      height: 60rpx;
      border: 4rpx solid rgba(0, 0, 0, 0.1);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    // 脉冲动画
    .pulse-loader {
      width: 60rpx;
      height: 60rpx;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
      border-radius: 50%;
      animation: pulse 1.2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(0.6);
        opacity: 0.6;
      }
      50% {
        transform: scale(1);
        opacity: 1;
      }
    }

    // 点状加载动画
    .dots-loader {
      display: flex;
      gap: 12rpx;
      align-items: center;

      .dot {
        width: 16rpx;
        height: 16rpx;
        background: var(--primary-color);
        border-radius: 50%;
        animation: dotBounce 1.4s ease-in-out infinite both;

        &:nth-child(1) {
          animation-delay: -0.32s;
        }

        &:nth-child(2) {
          animation-delay: -0.16s;
        }

        &:nth-child(3) {
          animation-delay: 0s;
        }
      }
    }

    @keyframes dotBounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.4;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    // 波浪动画
    .wave-loader {
      display: flex;
      gap: 8rpx;
      align-items: center;
      height: 60rpx;

      .wave-bar {
        width: 8rpx;
        height: 100%;
        background: linear-gradient(
          to bottom,
          var(--primary-color),
          var(--primary-color-light)
        );
        border-radius: 4rpx;
        animation: waveStretch 1.2s ease-in-out infinite;

        &:nth-child(1) {
          animation-delay: 0s;
        }

        &:nth-child(2) {
          animation-delay: -1.1s;
        }

        &:nth-child(3) {
          animation-delay: -0.9s;
        }

        &:nth-child(4) {
          animation-delay: -0.7s;
        }

        &:nth-child(5) {
          animation-delay: -0.5s;
        }
      }
    }

    @keyframes waveStretch {
      0%, 100% {
        height: 30%;
        opacity: 0.4;
      }
      50% {
        height: 100%;
        opacity: 1;
      }
    }

    .placeholder-icon {
      font-size: 48rpx;
      opacity: 0.3;
    }
  }
}

.lazy-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-disabled);
  cursor: pointer;

  .error-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;

    .error-icon {
      font-size: 64rpx;
    }

    .error-text {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }

    .retry-text {
      font-size: 22rpx;
      color: var(--primary-color);
    }
  }
}

.load-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4rpx;
  background: rgba(0, 0, 0, 0.1);

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
    transition: width 0.3s ease;
  }
}
</style>
