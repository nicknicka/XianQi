<template>
  <view
    class="thumbnail-wrapper"
    :class="[`size-${size}`, shape]"
    :style="wrapperStyle"
  >
    <!-- 缩略图 -->
    <image
      class="thumbnail"
      :src="displaySrc"
      :mode="mode"
      :lazy-load="lazyLoad"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- 可点击遮罩 -->
    <view v-if="clickable" class="click-mask" @click="handleClick"></view>

    <!-- 加载失败占位 -->
    <view v-if="loadError" class="error-placeholder">
      <uni-icons type="image" size="20" color="#AAAAAA" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { normalizeImageUrl } from '@/utils/image'

interface Props {
  /** 图片URL */
  src?: string
  /** 默认图片URL */
  defaultSrc?: string
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  /** 形状 */
  shape?: 'circle' | 'square' | 'rounded'
  /** 图片裁剪模式 */
  mode?: 'aspectFill' | 'aspectFit' | 'widthFix' | 'heightFix'
  /** 是否懒加载 */
  lazyLoad?: boolean
  /** 是否可点击 */
  clickable?: boolean
  /** 自定义宽度 */
  width?: string | number
  /** 自定义高度 */
  height?: string | number
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  defaultSrc: '/static/images/empty.png',
  size: 'md',
  shape: 'square',
  mode: 'aspectFit',
  lazyLoad: true,
  clickable: false
})

const emit = defineEmits<{
  click: [event: Event]
  load: [event: Event]
  error: [event: Event]
}>()

const loadError = ref(false)

// 通用缩略图默认使用 default.png
const displaySrc = computed(() => {
  const src = props.src || props.defaultSrc
  // 标准化图片URL，将相对路径转换为完整URL
  return normalizeImageUrl(src)
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

function handleClick(e: any) {
  if (props.clickable) {
    emit('click', e)
  }
}

function handleLoad(e: any) {
  loadError.value = false
  emit('load', e)
}

function handleError(e: any) {
  loadError.value = true
  emit('error', e)
}

// 重置错误状态
function retry() {
  loadError.value = false
}

defineExpose({
  retry
})
</script>

<script lang="ts">
export default {
  name: 'Thumbnail',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.thumbnail-wrapper {
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

.thumbnail {
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

.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-disabled);
}
</style>
