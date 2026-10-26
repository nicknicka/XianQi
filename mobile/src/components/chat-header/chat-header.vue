<template>
  <view
    class="chat-header"
    :class="[themeClass, customClass, { 'avoid-capsule': avoidCapsule }]"
    :style="{ paddingTop: statusBarHeight + 'px' }"
  >
    <!-- 左侧区域：返回按钮 + 右侧功能按钮（避开小程序胶囊） -->
    <view class="header-left-group">
      <view v-if="showBack" class="header-left" @click="handleBack">
        <slot name="left">
          <uni-icons type="left" :size="iconSize" :color="iconColor" />
        </slot>
      </view>

      <!-- 右侧功能按钮放在左侧，避开小程序胶囊 -->
      <view v-if="$slots.right || showMore" class="header-action-left">
        <slot name="right">
          <uni-icons
            v-if="showMore"
            type="more"
            :size="iconSize"
            :color="iconColor"
            @click="handleMoreClick"
          />
        </slot>
      </view>
    </view>

    <!-- 中间：标题/用户信息 -->
    <view class="header-center">
      <slot name="center">
        <!-- 默认：只有标题 -->
        <text v-if="title" class="header-title" :style="{ color: textColor }">
          {{ title }}
        </text>
      </slot>
    </view>

    <!-- 右侧：占位，保持布局平衡（但不放按钮，避开胶囊） -->
    <view class="header-right-placeholder"></view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatusBarHeight } from '@/utils/system-info'

interface Props {
  /** 标题文字 */
  title?: string
  /** 是否显示返回按钮 */
  showBack?: boolean
  /** 是否显示更多按钮 */
  showMore?: boolean
  /** 背景主题 */
  theme?: 'default' | 'ai' | 'custom'
  /** 自定义类名 */
  customClass?: string
  /** 图标大小 */
  iconSize?: number
  /** 图标颜色 */
  iconColor?: string
  /** 文字颜色 */
  textColor?: string
  /** 是否避开小程序胶囊（向下偏移） */
  avoidCapsule?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  showMore: true,
  theme: 'default',
  customClass: '',
  iconSize: 20,
  iconColor: '#fff',
  textColor: '#fff',
  avoidCapsule: false
})

const emit = defineEmits<{
  back: []
  more: []
}>()

const statusBarHeight = computed(() => getStatusBarHeight())

const themeClass = computed(() => {
  if (props.theme === 'ai') return 'ai-theme'
  if (props.theme === 'custom') return 'custom-theme'
  return ''
})

const handleBack = () => {
  emit('back')
}

// 点击更多按钮时触发
const handleMoreClick = () => {
  emit('more')
}
</script>

<style scoped lang="scss">
.chat-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 0 24rpx;
  background: var(--primary-color);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;

  /* AI 主题 */
  &.ai-theme {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
  }

  /* 自定义主题 */
  &.custom-theme {
    /* 可以通过 customClass 自定义背景色 */
  }

  /* 避开小程序胶囊：向下偏移 */
  &.avoid-capsule {
    .header-left-group {
      margin-top: 40rpx;
    }
  }

  .header-left-group {
    min-width: 120rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
  }

  .header-left {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-shrink: 0;
  }

  // 右侧功能按钮移到左侧显示
  .header-action-left {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .header-right-placeholder {
    min-width: 120rpx;
    flex-shrink: 0;
  }

  .header-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 12rpx;
    min-width: 0; /* 防止内容溢出 */
  }

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}
</style>
