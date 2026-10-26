<template>
  <view class="notice-bar" :class="[`mode-${mode}`, customClass]" :style="customStyle">
    <!-- 左侧图标 -->
    <view v-if="showIcon" class="notice-icon" @click="handleIconClick">
      <image
        v-if="iconType === 'image'"
        class="icon-image"
        :src="icon"
        mode="aspectFit"
      />
      <text v-else class="icon-text">{{ defaultIcon }}</text>
    </view>

    <!-- 滚动内容 -->
    <view class="notice-content">
      <swiper
        v-if="scrollable && textList.length > 1"
        class="notice-swiper"
        :vertical="vertical"
        :circular="true"
        :autoplay="true"
        :interval="interval"
        :duration="duration"
        @change="handleSwiperChange"
      >
        <swiper-item
          v-for="(text, index) in textList"
          :key="index"
          class="swiper-item"
        >
          <view class="notice-text" @click="handleClick(text, index)">
            <text class="text-content">{{ text }}</text>
          </view>
        </swiper-item>
      </swiper>

      <!-- 单行文本 -->
      <view v-else class="notice-text" @click="handleClick(textList[0], 0)">
        <text class="text-content">{{ textList[0] || text }}</text>
      </view>
    </view>

    <!-- 右侧关闭按钮 -->
    <view v-if="closable" class="notice-close" @click="handleClose">
      <text class="close-icon">×</text>
    </view>

    <!-- 右侧箭头 -->
    <view v-if="showArrow" class="notice-arrow" @click="handleArrowClick">
      <text class="arrow-icon">›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export type NoticeMode = 'default' | 'warning' | 'error' | 'info'
export type NoticeIconType = 'text' | 'image'

interface Props {
  /** 通知文本（单条） */
  text?: string
  /** 通知文本列表（多条） */
  textList?: string[]
  /** 模式 */
  mode?: NoticeMode
  /** 图标 */
  icon?: string
  /** 图标类型 */
  iconType?: NoticeIconType
  /** 是否显示左侧图标 */
  showIcon?: boolean
  /** 是否可滚动 */
  scrollable?: boolean
  /** 是否垂直滚动 */
  vertical?: boolean
  /** 自动轮播间隔（ms） */
  interval?: number
  /** 动画时长（ms） */
  duration?: number
  /** 是否可关闭 */
  closable?: boolean
  /** 是否显示右侧箭头 */
  showArrow?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  textList: () => [],
  mode: 'default',
  icon: '',
  iconType: 'text',
  showIcon: true,
  scrollable: true,
  vertical: false,
  interval: 3000,
  duration: 300,
  closable: false,
  showArrow: false,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'click': [text: string, index: number]
  'close': []
  'icon-click': []
  'arrow-click': []
  'change': [index: number]
}>()

const visible = ref(true)
const currentIndex = ref(0)

// 实际显示的文本列表
const displayTextList = computed(() => {
  return props.textList.length > 0 ? props.textList : [props.text]
})

// 默认图标
const defaultIcon = computed(() => {
  if (props.icon) return props.icon

  const iconMap: Record<NoticeMode, string> = {
    default: '📢',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  }
  return iconMap[props.mode] || '📢'
})

// 点击文本
function handleClick(text: string, index: number) {
  emit('click', text, index)
}

// 关闭
function handleClose() {
  visible.value = false
  emit('close')
}

// 点击图标
function handleIconClick() {
  emit('icon-click')
}

// 点击箭头
function handleArrowClick() {
  emit('arrow-click')
}

// Swiper 切换
function handleSwiperChange(e: any) {
  currentIndex.value = e.detail.current
  emit('change', currentIndex.value)
}

// 暴露方法
defineExpose({
  close: () => {
    visible.value = false
  },
  show: () => {
    visible.value = true
  },
  next: () => {
    currentIndex.value = (currentIndex.value + 1) % displayTextList.value.length
  },
  prev: () => {
    currentIndex.value =
      (currentIndex.value - 1 + displayTextList.value.length) %
      displayTextList.value.length
  }
})
</script>

<script lang="ts">
export default {
  name: 'NoticeBar',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.notice-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-radius: 8rpx;
  overflow: hidden;

  // 模式变体
  &.mode-default {
    background: linear-gradient(90deg, var(--warning-color-alpha-10) 0%, var(--bg-color-card) 100%);
    border: 1rpx solid var(--warning-color-alpha-20);
  }

  &.mode-warning {
    background: linear-gradient(90deg, var(--warning-color-alpha-10) 0%, var(--bg-color-card) 100%);
    border: 1rpx solid var(--warning-color-alpha-20);
  }

  &.mode-error {
    background: linear-gradient(90deg, var(--danger-color-alpha-10) 0%, var(--bg-color-card) 100%);
    border: 1rpx solid var(--danger-color-alpha-10);
  }

  &.mode-info {
    background: linear-gradient(90deg, var(--primary-color-alpha-10) 0%, var(--bg-color-card) 100%);
    border: 1rpx solid var(--primary-color-alpha-20);
  }

  .notice-icon {
    flex-shrink: 0;
    margin-right: 16rpx;

    .icon-image {
      width: 32rpx;
      height: 32rpx;
    }

    .icon-text {
      font-size: 28rpx;
      line-height: 1;
    }
  }

  .notice-content {
    flex: 1;
    min-width: 0;

    .notice-swiper {
      width: 100%;
      height: 40rpx;

      .swiper-item {
        .notice-text {
          .text-content {
            font-size: 26rpx;
            color: var(--text-color-primary);
            white-space: nowrap;
          }
        }
      }
    }

    .notice-text {
      overflow: hidden;

      .text-content {
        display: block;
        font-size: 26rpx;
        color: var(--text-color-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .notice-close {
    flex-shrink: 0;
    margin-left: 16rpx;
    padding: 0 8rpx;

    .close-icon {
      font-size: 32rpx;
      color: var(--text-color-tertiary);
      line-height: 1;
    }
  }

  .notice-arrow {
    flex-shrink: 0;
    margin-left: 16rpx;

    .arrow-icon {
      font-size: 28rpx;
      color: var(--text-color-tertiary);
      line-height: 1;
    }
  }
}
</style>
