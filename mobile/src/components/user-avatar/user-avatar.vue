<template>
  <view
    class="user-avatar-wrapper"
    :class="[`size-${size}`, shape]"
    :style="wrapperStyle"
  >
    <!-- 用户头像 -->
    <image
      class="user-avatar"
      :src="displaySrc"
      :mode="mode"
      :lazy-load="lazyLoad"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- 在线状态指示器 -->
    <view v-if="showOnline" class="online-indicator" :class="{ online: isOnline }"></view>

    <!-- 可点击遮罩 -->
    <view v-if="clickable" class="click-mask" @click="handleClick"></view>

    <!-- 加载失败占位（仅在不使用默认图片时显示） -->
    <view v-if="hasError && displaySrc !== DEFAULT_AVATAR" class="error-placeholder">
      <uni-icons type="person" size="20" :color="textColorTertiary" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { normalizeAvatarUrl, DEFAULT_AVATAR } from '@/utils/image'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { successColor } = useThemeColors()

interface Props {
  /** 用户头像URL */
  src?: string
  /** 头像尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  /** 头像形状 */
  shape?: 'circle' | 'square' | 'rounded'
  /** 图片裁剪模式 */
  mode?: 'aspectFill' | 'aspectFit' | 'widthFix' | 'heightFix' | 'scaleToFill'
  /** 是否懒加载 */
  lazyLoad?: boolean
  /** 是否可点击 */
  clickable?: boolean
  /** 是否显示在线状态 */
  showOnline?: boolean
  /** 是否在线 */
  isOnline?: boolean
  /** 自定义宽度 */
  width?: string | number
  /** 自定义高度 */
  height?: string | number
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  size: 'md',
  shape: 'circle',
  mode: 'aspectFill',
  lazyLoad: true,
  clickable: false,
  showOnline: false,
  isOnline: false
})

const emit = defineEmits<{
  click: [event: Event]
  load: [event: Event]
  error: [event: Event]
}>()

// 当前使用的头像URL（可能是原始URL或默认头像）
const currentSrc = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const retryCount = ref(0)
const maxRetries = 2 // 最大重试次数
const failedUrls = ref<Set<string>>(new Set()) // 记录失败的URL

// 计算要显示的头像URL
const displaySrc = computed(() => {
  // 如果已经出错且达到最大重试次数，使用默认头像
  if (hasError.value && retryCount.value >= maxRetries) {
    return DEFAULT_AVATAR
  }

  // 如果当前有缓存的成功URL，使用它
  if (currentSrc.value) {
    return currentSrc.value
  }

  // 否则，处理传入的src
  const normalizedUrl = normalizeAvatarUrl(props.src)

  // 检查这个URL是否之前失败过
  if (failedUrls.value.has(normalizedUrl) && normalizedUrl !== DEFAULT_AVATAR) {
    // 如果之前失败过，直接使用默认头像
    return DEFAULT_AVATAR
  }

  return normalizedUrl
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

// 三级文本颜色（用于图标）
const textColorTertiary = computed(() => {
  // 返回CSS变量值，用于动态绑定
  return 'var(--text-color-tertiary)'
})

function handleClick(e: any) {
  if (props.clickable) {
    emit('click', e)
  }
}

function handleLoad(e: any) {
  console.log('[UserAvatar] 头像加载成功:', displaySrc.value)
  hasError.value = false
  isLoading.value = false
  retryCount.value = 0 // 重置重试计数
  // 缓存成功加载的URL
  currentSrc.value = displaySrc.value
  emit('load', e)
}

function handleError(e: any) {
  const currentUrl = displaySrc.value

  // 记录失败的URL
  failedUrls.value.add(currentUrl)

  // 增加重试计数
  retryCount.value++

  console.warn(`[UserAvatar] 头像加载失败 (${retryCount.value}/${maxRetries}): ${currentUrl}`)

  // 如果达到最大重试次数，使用默认头像并停止重试
  if (retryCount.value >= maxRetries) {
    hasError.value = true
    isLoading.value = false
    console.warn('[UserAvatar] 已达到最大重试次数，停止重试')
    emit('error', e)
    return
  }

  // 如果当前不是默认头像，尝试使用默认头像
  if (currentUrl !== DEFAULT_AVATAR) {
    hasError.value = true
    isLoading.value = false
    emit('error', e)
  } else {
    // 默认头像也加载失败，停止重试
    hasError.value = true
    isLoading.value = false
    console.error('[UserAvatar] 默认头像加载失败，停止重试')
    emit('error', e)
  }
}

// 重置错误状态并重试
function retry() {
  hasError.value = false
  isLoading.value = true
  currentSrc.value = ''
  retryCount.value = 0 // 重置重试计数
  console.log(`[UserAvatar] 手动重试加载头像: ${props.src}`)
}

// 监听src变化
watch(() => props.src, (newSrc, oldSrc) => {
  if (newSrc !== oldSrc) {
    console.log(`[UserAvatar] 头像URL变化: ${oldSrc} -> ${newSrc}`)
    // 重置状态
    hasError.value = false
    isLoading.value = true
    currentSrc.value = ''
    retryCount.value = 0
    // 注意：不重置 failedUrls，因为我们要记住所有失败过的URL
  }
})

defineExpose({
  retry
})
</script>

<script lang="ts">
export default {
  name: 'UserAvatar',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.user-avatar-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-color-disabled);

  // 形状
  &.circle {
    border-radius: 50%;
  }

  &.square {
    border-radius: 0;
  }

  &.rounded {
    border-radius: 12rpx;
  }

  // 尺寸
  &.size-xs {
    width: 48rpx;
    height: 48rpx;
  }

  &.size-sm {
    width: 64rpx;
    height: 64rpx;
  }

  &.size-md {
    width: 80rpx;
    height: 80rpx;
  }

  &.size-lg {
    width: 120rpx;
    height: 120rpx;
  }

  &.size-xl {
    width: 160rpx;
    height: 160rpx;
  }

  &.size-xxl {
    width: 200rpx;
    height: 200rpx;
  }
}

.user-avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.click-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.online-indicator {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: var(--text-color-placeholder);
  border: 2rpx solid var(--bg-color-card);
  z-index: 2;

  &.online {
    background: var(--success-color);
  }
}

.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-page);
}
</style>
