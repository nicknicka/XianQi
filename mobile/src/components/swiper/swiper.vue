<template>
  <view class="image-swiper" :class="[`indicator-${indicatorType}`, customClass]" :style="customStyle">
    <swiper
      class="swiper-container"
      :current="currentIndex"
      :autoplay="autoplay"
      :interval="interval"
      :duration="duration"
      :circular="circular"
      :vertical="vertical"
      :easing-function="easingFunction"
      @change="handleSwiperChange"
      @tap="handleSwiperTap"
    >
      <swiper-item
        v-for="(item, index) in swiperList"
        :key="item.id || index"
        class="swiper-item"
      >
        <!-- 图片模式 -->
        <image
          v-if="item.type === 'image'"
          class="swiper-image"
          :src="item.image || item.url"
          :mode="imageMode"
          :lazy-load="lazyLoad"
          @tap="handleImageTap(item, index)"
        />

        <!-- 视频模式 -->
        <video
          v-else-if="item.type === 'video'"
          class="swiper-video"
          :src="item.url"
          :poster="item.poster"
          :controls="true"
          :show-center-play-btn="true"
          :autoplay="false"
        />

        <!-- 自定义内容 -->
        <view v-else class="swiper-custom" @tap="handleItemTap(item, index)">
          <slot name="item" :item="item" :index="index">
            <text class="custom-text">{{ item.title }}</text>
          </slot>
        </view>

        <!-- 标题遮罩 -->
        <view v-if="showTitle && item.title && item.type === 'image'" class="swiper-title-mask">
          <text class="title-text">{{ item.title }}</text>
        </view>
      </swiper-item>
    </swiper>

    <!-- 指示器 -->
    <view v-if="showIndicator" class="swiper-indicator" :class="`indicator-${indicatorType}`">
      <!-- 默认指示器 -->
      <template v-if="indicatorType === 'default'">
        <view
          v-for="(item, index) in swiperList"
          :key="index"
          class="indicator-dot"
          :class="{ 'is-active': index === currentIndex }"
        ></view>
      </template>

      <!-- 数字指示器 -->
      <template v-else-if="indicatorType === 'number'">
        <text class="indicator-number">{{ currentIndex + 1 }}/{{ swiperList.length }}</text>
      </template>

      <!-- 进度条指示器 -->
      <template v-else-if="indicatorType === 'progress'">
        <view class="indicator-progress">
          <view
            class="progress-bar"
            :style="{ width: ((currentIndex + 1) / swiperList.length * 100) + '%' }"
          ></view>
        </view>
      </template>

      <!-- 自定义指示器 -->
      <template v-else-if="indicatorType === 'custom'">
        <slot name="indicator" :current="currentIndex" :total="swiperList.length">
          <text class="indicator-custom">{{ currentIndex + 1 }}/{{ swiperList.length }}</text>
        </slot>
      </template>
    </view>

    <!-- 左右箭头 -->
    <view v-if="showArrow && !vertical" class="swiper-arrows">
      <view class="arrow-arrow arrow-left" @tap.stop="handlePrev">
        <text class="arrow-icon">‹</text>
      </view>
      <view class="arrow-arrow arrow-right" @tap.stop="handleNext">
        <text class="arrow-icon">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export type IndicatorType = 'default' | 'number' | 'progress' | 'custom' | 'none'
export type ImageMode = 'aspectFill' | 'aspectFit' | 'scaleToFill' | 'widthFix'

export interface SwiperItem {
  id?: string | number
  type?: 'image' | 'video' | 'custom'
  url?: string
  image?: string
  poster?: string
  title?: string
  link?: string
  [key: string]: any
}

interface Props {
  /** 轮播数据 */
  list?: SwiperItem[]
  /** 当前索引 */
  current?: number
  /** 是否自动播放 */
  autoplay?: boolean
  /** 自动轮播间隔（ms） */
  interval?: number
  /** 动画时长（ms） */
  duration?: number
  /** 是否循环 */
  circular?: boolean
  /** 是否纵向 */
  vertical?: boolean
  /** 缓动函数 */
  easingFunction?: 'default' | 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
  /** 指示器类型 */
  indicatorType?: IndicatorType
  /** 是否显示指示器 */
  showIndicator?: boolean
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 是否显示标题 */
  showTitle?: boolean
  /** 图片填充模式 */
  imageMode?: ImageMode
  /** 是否懒加载 */
  lazyLoad?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  list: () => [],
  current: 0,
  autoplay: true,
  interval: 3000,
  duration: 300,
  circular: true,
  vertical: false,
  easingFunction: 'easeInOutCubic',
  indicatorType: 'default',
  showIndicator: true,
  showArrow: false,
  showTitle: false,
  imageMode: 'aspectFill',
  lazyLoad: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'update:current': [index: number]
  'change': [index: number]
  'tap': [item: SwiperItem, index: number]
  'image-tap': [item: SwiperItem, index: number]
}>()

const currentIndex = ref(props.current)

// 轮播列表
const swiperList = computed(() => {
  return props.list.length > 0 ? props.list : []
})

// Swiper 切换
function handleSwiperChange(e: any) {
  currentIndex.value = e.detail.current
  emit('update:current', currentIndex.value)
  emit('change', currentIndex.value)
}

// 点击 Swiper
function handleSwiperTap() {
  const item = swiperList.value[currentIndex.value]
  emit('tap', item, currentIndex.value)
}

// 点击图片
function handleImageTap(item: SwiperItem, index: number) {
  emit('image-tap', item, index)

  // 如果有链接，跳转
  if (item.link) {
    uni.navigateTo({
      url: item.link,
      fail: () => {
        // 跳转失败，尝试 webview
        uni.navigateTo({
          url: `/pages/webview/index?url=${encodeURIComponent(item.link)}`
        })
      }
    })
  }
}

// 点击自定义项
function handleItemTap(item: SwiperItem, index: number) {
  emit('tap', item, index)

  if (item.link) {
    uni.navigateTo({
      url: item.link
    })
  }
}

// 上一张
function handlePrev() {
  const newIndex = currentIndex.value - 1
  currentIndex.value = newIndex >= 0 ? newIndex : swiperList.value.length - 1
  emit('update:current', currentIndex.value)
}

// 下一张
function handleNext() {
  const newIndex = currentIndex.value + 1
  currentIndex.value = newIndex < swiperList.value.length ? newIndex : 0
  emit('update:current', currentIndex.value)
}

// 暴露方法
defineExpose({
  prev: handlePrev,
  next: handleNext,
  slideTo: (index: number) => {
    currentIndex.value = index
    emit('update:current', index)
  }
})
</script>

<script lang="ts">
export default {
  name: 'ImageSwiper',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.image-swiper {
  position: relative;
  width: 100%;
  background: var(--bg-color-disabled);
  overflow: hidden;

  .swiper-container {
    width: 100%;
    height: 100%;

    .swiper-item {
      width: 100%;
      height: 100%;

      .swiper-image {
        width: 100%;
        height: 100%;
        display: block;
      }

      .swiper-video {
        width: 100%;
        height: 100%;
      }

      .swiper-custom {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .custom-text {
          font-size: 32rpx;
          color: var(--text-color-secondary);
        }
      }

      .swiper-title-mask {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 24rpx 32rpx;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);

        .title-text {
          font-size: 28rpx;
          color: var(--bg-color-card);
        }
      }
    }
  }

  .swiper-indicator {
    position: absolute;
    z-index: 10;

    // 默认指示器 - 底部居中
    &.indicator-default {
      bottom: 24rpx;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12rpx;

      .indicator-dot {
        width: 16rpx;
        height: 16rpx;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        transition: all 0.3s;

        &.is-active {
          width: 32rpx;
          background: var(--bg-color-card);
          border-radius: 8rpx;
        }
      }
    }

    // 数字指示器 - 右下角
    &.indicator-number {
      bottom: 24rpx;
      right: 32rpx;
      padding: 8rpx 16rpx;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 24rpx;

      .indicator-number {
        font-size: 24rpx;
        color: var(--bg-color-card);
      }
    }

    // 进度条指示器 - 底部
    &.indicator-progress {
      bottom: 0;
      left: 0;
      right: 0;
      height: 4rpx;
      background: rgba(255, 255, 255, 0.3);

      .progress-bar {
        height: 100%;
        background: var(--bg-color-card);
        transition: width 0.3s;
      }
    }

    // 自定义指示器
    &.indicator-custom {
      bottom: 24rpx;
      right: 32rpx;

      .indicator-custom {
        font-size: 24rpx;
        color: var(--bg-color-card);
      }
    }
  }

  // 箭头
  .swiper-arrows {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    padding: 0 24rpx;
    pointer-events: none;
    z-index: 10;

    .arrow-arrow {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 50%;
      pointer-events: auto;
      transition: all 0.2s;

      &:active {
        background: rgba(0, 0, 0, 0.5);
      }

      .arrow-icon {
        font-size: 40rpx;
        color: var(--bg-color-card);
        line-height: 1;
      }
    }
  }
}
</style>
