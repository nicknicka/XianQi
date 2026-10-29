<template>
  <view class="tabs" :class="[`type-${type}`, `position-${position}`, customClass]" :style="customStyle">
    <!-- 标签栏 -->
    <view class="tabs-header" :class="{ 'is-card': type === 'card' }">
      <scroll-view class="tabs-nav" :class="{ 'is-scrollable': scrollable }" scroll-x scroll-with-animation>
        <view class="tabs-list">
          <view
            v-for="(tab, index) in tabs"
            :key="tab.id || index"
            class="tab-item"
            :class="{ 'is-active': activeIndex === index, 'is-disabled': tab.disabled }"
            @click="handleTabClick(tab, index)"
          >
            <slot name="label" :tab="tab" :index="index">
              <view class="tab-label">
                <!-- 图标 -->
                <image v-if="tab.icon" class="tab-icon" :src="tab.icon" mode="aspectFit" />
                <!-- 徽章 -->
                <view v-if="tab.badge" class="tab-badge" :class="{ 'is-dot': isDotBadge(tab.badge) }">
                  <text v-if="!isDotBadge(tab.badge)" class="badge-text">{{ tab.badge }}</text>
                </view>
                <!-- 标题 -->
                <text class="tab-title">{{ tab.title }}</text>
                <!-- 关闭按钮 -->
                <view
                  v-if="tab.closable && !tab.disabled && tabs.length > 1"
                  class="tab-close"
                  @click.stop="handleTabClose(index)"
                >
                  <text class="close-icon">×</text>
                </view>
              </view>
            </slot>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 内容区域 -->
    <view class="tabs-content">
      <swiper
        class="tabs-swiper"
        :current="activeIndex"
        :duration="duration"
        @change="handleSwiperChange"
      >
        <swiper-item v-for="(tab, index) in tabs" :key="tab.id || index">
          <view class="tab-pane">
            <slot :name="`pane-${index}`" :tab="tab" :index="index">
              <!-- 默认内容 -->
              <view class="default-pane">
                <text class="pane-text">{{ tab.content || tab.title }}</text>
              </view>
            </slot>
          </view>
        </swiper-item>
      </swiper>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface TabItem {
  id?: string
  title: string
  content?: string
  icon?: string
  badge?: string | number
  disabled?: boolean
  closable?: boolean
  [key: string]: any
}

interface Props {
  /** 标签列表 */
  tabs: TabItem[]
  /** 当前激活索引 */
  activeIndex?: number
  /** 类型 */
  type?: 'line' | 'card' | 'segment'
  /** 标签位置 */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** 是否可滚动 */
  scrollable?: boolean
  /** 动画时长 */
  duration?: number
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  activeIndex: 0,
  type: 'line',
  position: 'top',
  scrollable: false,
  duration: 300
})

const emit = defineEmits<{
  'update:activeIndex': [index: number]
  'change': [tab: TabItem, index: number]
  'click': [tab: TabItem, index: number]
  'close': [tab: TabItem, index: number]
}>()

const internalActive = ref(props.activeIndex)

// 判断是否为点徽章
function isDotBadge(badge: string | number | boolean): boolean {
  return badge === 'dot' || badge === true
}

// 点击标签
function handleTabClick(tab: TabItem, index: number) {
  if (tab.disabled) return

  internalActive.value = index
  emit('update:activeIndex', index)
  emit('change', tab, index)
  emit('click', tab, index)
}

// 关闭标签
function handleTabClose(index: number) {
  const tab = props.tabs[index]
  emit('close', tab, index)

  // 如果关闭的是当前激活标签，需要切换到其他标签
  if (index === internalActive.value) {
    const newIndex = index > 0 ? index - 1 : 0
    internalActive.value = newIndex
    emit('update:activeIndex', newIndex)
  }
}

// swiper 切换
function handleSwiperChange(e: any) {
  const index = e.detail.current
  internalActive.value = index
  emit('update:activeIndex', index)
}

// 监听外部值变化
watch(() => props.activeIndex, (newVal) => {
  internalActive.value = newVal
})
</script>

<script lang="ts">
export default {
  name: 'Tabs',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.tabs {
  width: 100%;
  display: flex;
  flex-direction: column;

  &.position-top {
    flex-direction: column;
  }

  &.position-bottom {
    flex-direction: column-reverse;
  }

  &.position-left {
    flex-direction: row;

    .tabs-header {
      width: 200rpx;
      border-right: 1rpx solid var(--border-color-light);
      border-bottom: none;
    }

    .tabs-content {
      flex: 1;
    }
  }

  &.position-right {
    flex-direction: row-reverse;

    .tabs-header {
      width: 200rpx;
      border-left: 1rpx solid var(--border-color-light);
      border-bottom: none;
    }

    .tabs-content {
      flex: 1;
    }
  }

  .tabs-header {
    background: var(--bg-color-card);
    border-bottom: 1rpx solid var(--border-color-light);

    &.is-card {
      background: var(--bg-color-disabled);
      border: none;
      padding: 8rpx;
      margin: 16rpx;
      border-radius: 8rpx;
    }
  }

  .tabs-nav {
    white-space: nowrap;

    &.is-scrollable {
      :deep(.uni-scroll-view) {
        scroll-behavior-x: auto;
      }
    }

    .tabs-list {
      display: inline-flex;
      min-width: 100%;
    }
  }

  .tab-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 24rpx 32rpx;
    cursor: pointer;
    transition: color 0.2s;

    &.is-disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    .tab-label {
      display: flex;
      align-items: center;
      gap: 8rpx;
      position: relative;

      .tab-icon {
        width: 32rpx;
        height: 32rpx;
      }

      .tab-badge {
        min-width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 8rpx;
        background: var(--error-color);
        border-radius: 16rpx;
        font-size: 20rpx;
        color: var(--bg-color-card);
        line-height: 1;

        &.is-dot {
          min-width: 16rpx;
          width: 16rpx;
          height: 16rpx;
          padding: 0;
          border-radius: 50%;
        }

        .badge-text {
          font-size: 20rpx;
          transform: scale(0.8);
        }
      }

      .tab-title {
        font-size: 28rpx;
        color: var(--text-color-primary);
        white-space: nowrap;
      }

      .tab-close {
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8rpx;
        border-radius: 50%;
        transition: background 0.2s;

        &:active {
          background: rgba(0, 0, 0, 0.05);
        }

        .close-icon {
          font-size: 32rpx;
          color: var(--text-color-tertiary);
          line-height: 1;
        }
      }
    }

    // type=line 样式
    .type-line &:not(.is-active) {
      .tab-title {
        color: var(--text-color-secondary);
      }

      &::after {
        content: '';
        position: absolute;
        left: 32rpx;
        right: 32rpx;
        bottom: 0;
        height: 2rpx;
        background: transparent;
        transition: background 0.2s;
      }
    }

    &.is-active {
      .tab-title {
        color: $primary-color;
        font-weight: 500;
      }

      &::after {
        background: $primary-color;
      }
    }

    // type=card 样式
    .type-card & {
      background: var(--bg-color-card);
      border-radius: 6rpx;
      padding: 16rpx 24rpx;
      margin: 0 8rpx;

      &::after {
        display: none;
      }

      .tab-title {
        color: var(--text-color-secondary);
      }

      &.is-active {
        background: $primary-color;

        .tab-title {
          color: var(--bg-color-card);
        }

        .tab-close .close-icon {
          color: var(--bg-color-card);
        }
      }
    }

    // type=segment 样式
    .type-segment & {
      border-radius: 8rpx;
      padding: 8rpx;
      margin: 0 4rpx;

      .tab-label {
        padding: 12rpx 24rpx;
        border-radius: 6rpx;
        background: transparent;
        transition: all 0.2s;
      }

      .tab-title {
        color: var(--text-color-secondary);
      }

      &.is-active {
        .tab-label {
          background: $primary-color;

          .tab-title {
            color: var(--bg-color-card);
          }
        }
      }
    }
  }

  .tabs-content {
    flex: 1;
    overflow: hidden;

    .tabs-swiper {
      width: 100%;
      height: 100%;

      .tab-pane {
        height: 100%;
        overflow-y: auto;

        .default-pane {
          padding: 48rpx;
          text-align: center;

          .pane-text {
            font-size: 28rpx;
            color: var(--text-color-tertiary);
          }
        }
      }
    }
  }
}
</style>
