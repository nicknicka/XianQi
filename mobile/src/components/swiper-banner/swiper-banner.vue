<template>
  <view class="swiper-banner" :class="[customClass]" :style="customStyle">
    <swiper
      class="banner-swiper"
      :autoplay="autoplay"
      :circular="circular"
      :interval="interval"
      :duration="duration"
      :indicator-dots="showIndicator"
      :indicator-color="indicatorColor"
      :indicator-active-color="indicatorActiveColor"
      :current="current"
      @change="handleChange"
      @tap="handleTap"
    >
      <swiper-item v-for="(item, index) in list" :key="item.id || index">
        <view class="banner-item" :class="{ 'is-video': item.isVideo }" @click="handleItemClick(item, index)">
          <!-- 图片 -->
          <image
            v-if="!item.isVideo && item.image"
            class="banner-image"
            :src="item.image"
            mode="aspectFill"
            :lazy-load="true"
          />

          <!-- 视频 -->
          <view v-if="item.isVideo && item.video" class="banner-video">
            <video
              :src="item.video"
              :poster="item.image"
              :autoplay="false"
              :controls="true"
              :show-center-play-btn="true"
              :enable-play-gesture="true"
              object-fit="contain"
            />
          </view>

          <!-- 标题 -->
          <view v-if="item.title && showTitle" class="banner-title-overlay">
            <text class="title-text">{{ item.title }}</text>
          </view>

          <!-- 自定义内容插槽 -->
          <slot name="item" :item="item" :index="index"></slot>
        </view>
      </swiper-item>
    </swiper>

    <!-- 自定义指示器 -->
    <view v-if="!showIndicator && showCustomIndicator" class="custom-indicator">
      <view
        v-for="(item, index) in list"
        :key="index"
        class="indicator-dot"
        :class="{ 'is-active': current === index }"
      >
      </view>
    </view>

    <!-- 左右箭头 -->
    <template v-if="showArrows && list.length > 1">
      <view class="banner-arrow arrow-prev" @click.stop="handlePrev">
        <text class="arrow-icon">‹</text>
      </view>
      <view class="banner-arrow arrow-next" @click.stop="handleNext">
        <text class="arrow-icon">›</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface BannerItem {
  id?: string
  image: string
  video?: string
  title?: string
  link?: string
  isVideo?: boolean
  [key: string]: any
}

interface Props {
  /** 数据列表 */
  list: BannerItem[]
  /** 是否自动播放 */
  autoplay?: boolean
  /** 是否循环 */
  circular?: boolean
  /** 间隔时间 */
  interval?: number
  /** 切换动画时长 */
  duration?: number
  /** 当前索引 */
  current?: number
  /** 是否显示指示器 */
  showIndicator?: boolean
  /** 指示器颜色 */
  indicatorColor?: string
  /** 当前指示器颜色 */
  indicatorActiveColor?: string
  /** 是否显示自定义指示器 */
  showCustomIndicator?: boolean
  /** 是否显示标题 */
  showTitle?: boolean
  /** 是否显示箭头 */
  showArrows?: boolean
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  list: () => [],
  autoplay: true,
  circular: true,
  interval: 5000,
  duration: 500,
  current: 0,
  showIndicator: false,
  indicatorColor: 'rgba(255, 255, 255, 0.5)',
  indicatorActiveColor: '#fff',
  showCustomIndicator: true,
  showTitle: true,
  showArrows: false
})

const emit = defineEmits<{
  'update:current': [current: number]
  'change': [current: number, item: BannerItem]
  'click': [item: BannerItem, index: number]
}>()

const internalCurrent = ref(props.current)

// 切换事件
function handleChange(e: any) {
  const current = e.detail.current
  internalCurrent.value = current
  emit('update:current', current)
  emit('change', current, props.list[current])
}

// 点击事件
function handleTap(e: any) {
  // 可以在这里处理暂停/恢复自动播放
}

// 点击项
function handleItemClick(item: BannerItem, index: number) {
  emit('click', item, index)

  if (item.link) {
    uni.navigateTo({
      url: item.link
    })
  }
}

// 上一张
function handlePrev() {
  const newIndex = internalCurrent.value - 1
  if (newIndex < 0) {
    internalCurrent.value = props.list.length - 1
  } else {
    internalCurrent.value = newIndex
  }
  emit('update:current', internalCurrent.value)
}

// 下一张
function handleNext() {
  const newIndex = internalCurrent.value + 1
  if (newIndex >= props.list.length) {
    internalCurrent.value = 0
  } else {
    internalCurrent.value = newIndex
  }
  emit('update:current', internalCurrent.value)
}
</script>

<script lang="ts">
export default {
  name: 'SwiperBanner',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.swiper-banner {
  position: relative;
  width: 100%;
  height: 100%;

  .banner-swiper {
    width: 100%;
    height: 100%;
  }

  .banner-item {
    width: 100%;
    height: 100%;
    position: relative;

    &.is-video {
      background: #000;
    }

    .banner-image {
      width: 100%;
      height: 100%;
      display: block;
    }

    .banner-video {
      width: 100%;
      height: 100%;

      video {
        width: 100%;
        height: 100%;
      }
    }

    .banner-title-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 32rpx;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);

      .title-text {
        font-size: 32rpx;
        color: #fff;
        font-weight: 500;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
      }
    }
  }

  .custom-indicator {
    position: absolute;
    bottom: 24rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12rpx;
    z-index: 10;

    .indicator-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transition: all 0.3s;

      &.is-active {
        width: 32rpx;
        border-radius: 8rpx;
        background: var(--bg-color-card);
      }
    }
  }

  .banner-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    z-index: 10;
    transition: background 0.2s;

    &:active {
      background: rgba(0, 0, 0, 0.5);
    }

    .arrow-icon {
      font-size: 48rpx;
      color: #fff;
      line-height: 1;
    }
  }

  .arrow-prev {
    left: 24rpx;
  }

  .arrow-next {
    right: 24rpx;
  }
}
</style>
