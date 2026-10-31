<template>
  <view class="tab-bar" :class="[`fixed-${fixed}`, customClass]" :style="customStyle">
    <view class="tab-bar-content">
      <view
        v-for="(item, index) in tabs"
        :key="item.id || index"
        class="tab-item"
        :class="{ 'is-active': activeIndex === index }"
        @click="handleTabClick(item, index)"
      >
        <!-- 图标 -->
        <view class="tab-icon">
          <image
            v-if="item.icon && !item.dot"
            class="icon-image"
            :src="activeIndex === index ? item.activeIcon || item.icon : item.icon"
            mode="aspectFit"
          />
          <text v-else-if="item.dot" class="icon-dot">•</text>
          <text v-else class="icon-text">{{ getIconText(item, index) }}</text>
          <!-- 徽章 -->
          <view v-if="item.badge" class="tab-badge" :class="{ 'is-dot': isDotBadge(item.badge) }">
            <text v-if="!isDotBadge(item.badge)" class="badge-text">{{ item.badge }}</text>
          </view>
        </view>

        <!-- 文字 -->
        <text v-if="item.text" class="tab-text" :class="{ 'is-active': activeIndex === index }">
          {{ item.text }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TabItem {
  id?: string
  text?: string
  icon?: string
  activeIcon?: string
  dot?: boolean
  badge?: string | number
  link?: string
  [key: string]: any
}

interface Props {
  /** 标签列表 */
  tabs: TabItem[]
  /** 当前激活索引 */
  activeIndex?: number
  /** 是否固定在底部 */
  fixed?: boolean
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  color?: string
  /** 激活文字颜色 */
  activeColor?: string
  /** 是否显示边框 */
  border?: boolean
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  activeIndex: 0,
  fixed: true,
  backgroundColor: '#fff',
  color: '#999',
  activeColor: '#333',
  border: false
})

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  'change': [item: TabItem, index: number]
  'click': [item: TabItem, index: number]
}>()

// 判断是否为点徽章
function isDotBadge(badge: string | number): boolean {
  return badge === 'dot' 
}

// 获取图标文字（当没有图片时）
function getIconText(item: TabItem, index: number): string {
  if (item.dot) return ''
  return ''
}

// 点击标签
function handleTabClick(item: TabItem, index: number) {
  emit('update:activeIndex', index)
  emit('change', item, index)
  emit('click', item, index)

  // 跳转链接
  if (item.link) {
    uni.switchTab({
      url: item.link
    })
  }
}
</script>

<script lang="ts">
export default {
  name: 'TabBar',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.tab-bar {
  width: 100%;

  &.fixed-true {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 999;
  }

  .tab-bar-content {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 12rpx 0;
    background: v-bind(backgroundColor);
    border-top: 1rpx solid var(--border-color-light);

    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
    }
  }

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    position: relative;
    padding: 8rpx 0;
    transition: all 0.2s;

    &:active {
      opacity: 0.7;
    }

    .tab-icon {
      position: relative;
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon-image {
        width: 48rpx;
        height: 48rpx;
      }

      .icon-text {
        font-size: 48rpx;
        color: v-bind(color);
        line-height: 1;
      }

      .icon-dot {
        font-size: 48rpx;
        color: v-bind(color);
        line-height: 1;
      }

      .tab-badge {
        position: absolute;
        top: 0;
        right: -8rpx;
        min-width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 8rpx;
        background: var(--danger-color);
        border-radius: 16rpx;
        border: 2rpx solid v-bind(backgroundColor);
        font-size: 20rpx;
        color: var(--bg-color-card);
        line-height: 1;
        z-index: 1;

        &.is-dot {
          min-width: 16rpx;
          width: 16rpx;
          height: 16rpx;
          padding: 0;
          border-radius: 50%;
        }

        .badge-text {
          font-size: 20rpx;
          line-height: 1;
          transform: scale(0.8);
        }
      }
    }

    .tab-text {
      font-size: 22rpx;
      color: v-bind(color);
      line-height: 1.2;
      transition: color 0.2s;

      &.is-active {
        color: v-bind(activeColor);
        font-weight: 500;
      }
    }

    &.is-active {
      .tab-icon {
        .icon-text {
          color: v-bind(activeColor);
        }

        .icon-dot {
          color: v-bind(activeColor);
        }
      }
    }
  }
}
</style>
