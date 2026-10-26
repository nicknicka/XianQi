<template>
  <view
    class="custom-nav-bar"
    :style="navBarStyle"
    :class="{ 'is-notch': isNotch, 'avoid-capsule': avoidCapsule }"
  >
    <!-- 状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- 导航栏内容区 -->
    <view class="nav-content" :style="navContentStyle">
      <!-- 左侧：返回按钮 -->
      <view v-if="showBack" class="nav-left" @click="handleBack">
        <slot name="left">
          <uni-icons type="left" :size="iconSize" :color="textColor"></uni-icons>
        </slot>
      </view>

      <!-- 中间：标题 -->
      <view class="nav-title" :class="{ 'has-left': showBack, 'has-right': $slots.right }">
        <slot name="title">
          <text class="title-text" :style="{ color: textColor, fontSize: titleFontSize }">
            {{ title }}
          </text>
        </slot>
      </view>

      <!-- 右侧：自定义内容 -->
      <view class="nav-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getNavBarInfo, isNotchScreen } from '@/utils/system-info'

interface Props {
  /** 标题文字 */
  title?: string
  /** 是否显示返回按钮 */
  showBack?: boolean
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  textColor?: string
  /** 标题字体大小 */
  titleFontSize?: string
  /** 图标大小 */
  iconSize?: number
  /** 是否固定在顶部 */
  fixed?: boolean
  /** 是否避开小程序右上角胶囊 */
  avoidCapsule?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  backgroundColor: 'var(--nav-background)',
  textColor: '#fff',
  titleFontSize: '17px',
  iconSize: 20,
  fixed: true,
  avoidCapsule: false
})

const emit = defineEmits<{
  back: []
}>()

const navBarInfo = getNavBarInfo()
const isNotch = ref(false)

onMounted(() => {
  isNotch.value = isNotchScreen()
})

const statusBarHeight = computed(() => navBarInfo.statusBarHeight)
const avoidCapsule = computed(() => props.avoidCapsule && !!navBarInfo.capsule)
const navBarStyle = computed(() => ({
  height: `${navBarInfo.totalHeight}px`,
  // 使用 background 代替 backgroundColor，支持渐变色（纯色也兼容）
  background: props.backgroundColor,
  color: props.textColor,
  position: props.fixed ? 'fixed' : 'relative'
}))

const navContentStyle = computed(() => {
  if (!avoidCapsule.value || !navBarInfo.capsule) {
    return {}
  }
  // 为右侧插槽预留胶囊宽度，避免与微信原生胶囊重叠
  const rightSafeSpace = navBarInfo.capsule.width + 12
  return {
    paddingRight: `${rightSafeSpace}px`
  }
})

const handleBack = () => {
  emit('back')
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    // 如果没有上一页，返回首页
    uni.switchTab({
      url: '/pages/index/index',
      fail: () => {
        // 如果不是 tabbar 页面，使用 reLaunch
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }
    })
  }
}
</script>

<style scoped lang="scss">
.custom-nav-bar {
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  width: 100%;
  transition: all 0.3s ease;

  &.is-notch {
    // 刘海屏特殊处理（如有需要）
  }

  &.avoid-capsule {
    .nav-right {
      min-width: 0;
      width: auto;
    }
  }
}

.status-bar {
  width: 100%;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;

  .nav-left {
    width: 32px;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
  }

  .nav-title {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    &.has-left {
      padding-left: 0;
    }

    &.has-right {
      padding-right: 0;
    }

    .title-text {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }

  .nav-right {
    min-width: 40px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
