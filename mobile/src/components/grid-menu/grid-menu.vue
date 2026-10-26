<template>
  <view class="grid-menu" :class="[`cols-${columns}`, `size-${size}`, customClass]" :style="customStyle">
    <view
      v-for="(item, index) in menuItems"
      :key="item.id || index"
      class="menu-item"
      :class="{ 'is-disabled': item.disabled }"
      @click="handleClick(item, index)"
    >
      <!-- 徽章 -->
      <view v-if="item.badge" class="menu-badge">
        <text class="badge-text">{{ item.badge }}</text>
      </view>

      <!-- 小圆点 -->
      <view v-if="item.dot" class="menu-dot"></view>

      <!-- 图标 -->
      <view class="menu-icon" :class="{ 'is-square': item.iconShape === 'square' }">
        <image
          v-if="item.iconType === 'image'"
          class="icon-image"
          :src="item.icon"
          mode="aspectFit"
        />
        <text v-else class="icon-text" :style="{ color: item.color || '' }">
          {{ item.icon || '?' }}
        </text>

        <!-- 角标 -->
        <view v-if="item.cornerMark" class="icon-corner">
          <text class="corner-text">{{ item.cornerMark }}</text>
        </view>
      </view>

      <!-- 标题 -->
      <text v-if="item.title" class="menu-title">{{ item.title }}</text>

      <!-- 描述 -->
      <text v-if="item.description" class="menu-desc">{{ item.description }}</text>

      <!-- 箭头 -->
      <view v-if="showArrow && !item.disabled" class="menu-arrow">
        <text class="arrow-icon">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export type GridMenuSize = 'small' | 'medium' | 'large'
export type GridMenuColumns = 3 | 4 | 5

export interface GridMenuItem {
  id?: string
  title: string
  description?: string
  icon: string
  iconType?: 'text' | 'image'
  iconShape?: 'circle' | 'square'
  color?: string
  badge?: string | number
  dot?: boolean
  cornerMark?: string
  url?: string
  disabled?: boolean
  [key: string]: any
}

interface Props {
  /** 菜单项数据 */
  items?: GridMenuItem[]
  /** 列数 */
  columns?: GridMenuColumns
  /** 尺寸 */
  size?: GridMenuSize
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 图标背景色 */
  iconBg?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  columns: 4,
  size: 'medium',
  showArrow: false,
  iconBg: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'click': [item: GridMenuItem, index: number]
}>()

// 实际显示的菜单项
const menuItems = ref<GridMenuItem[]>(props.items)

// 点击菜单项
function handleClick(item: GridMenuItem, index: number) {
  if (item.disabled) return

  emit('click', item, index)

  // 如果有 URL，跳转
  if (item.url) {
    uni.navigateTo({
      url: item.url,
      fail: () => {
        // 如果 navigateTo 失败，尝试 switchTab
        uni.switchTab({
          url: item.url
        })
      }
    })
  }
}

// 暴露方法
defineExpose({
  setItems: (items: GridMenuItem[]) => {
    menuItems.value = items
  },
  getItems: () => {
    return menuItems.value
  }
})
</script>

<script lang="ts">
export default {
  name: 'GridMenu',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.grid-menu {
  display: grid;
  gap: 24rpx;
  padding: 24rpx;
  background: var(--bg-color-card);

  // 列数变体
  &.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  &.cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  &.cols-5 {
    grid-template-columns: repeat(5, 1fr);
  }

  // 尺寸变体
  &.size-small {
    .menu-item {
      .menu-icon {
        width: 96rpx;
        height: 96rpx;

        .icon-text {
          font-size: 40rpx;
        }
      }

      .menu-title {
        font-size: 24rpx;
      }

      .menu-desc {
        font-size: 20rpx;
      }
    }
  }

  &.size-medium {
    .menu-item {
      .menu-icon {
        width: 112rpx;
        height: 112rpx;

        .icon-text {
          font-size: 48rpx;
        }
      }

      .menu-title {
        font-size: 26rpx;
      }

      .menu-desc {
        font-size: 22rpx;
      }
    }
  }

  &.size-large {
    .menu-item {
      .menu-icon {
        width: 128rpx;
        height: 128rpx;

        .icon-text {
          font-size: 56rpx;
        }
      }

      .menu-title {
        font-size: 28rpx;
      }

      .menu-desc {
        font-size: 24rpx;
      }
    }
  }

  .menu-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx;
    border-radius: 12rpx;
    transition: background 0.2s;

    &:active {
      background: var(--bg-color-disabled);
    }

    &.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .menu-badge {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--error-color);
      border-radius: 16rpx;
      z-index: 1;

      .badge-text {
        font-size: 20rpx;
        color: #fff;
        transform: scale(0.85);
      }
    }

    .menu-dot {
      position: absolute;
      top: 12rpx;
      right: 12rpx;
      width: 16rpx;
      height: 16rpx;
      background: var(--error-color);
      border-radius: 50%;
      z-index: 1;
    }

    .menu-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      border-radius: 24rpx;
      position: relative;

      &.is-square {
        border-radius: 16rpx;
      }

      .icon-image {
        width: 60%;
        height: 60%;
      }

      .icon-text {
        font-size: 48rpx;
      }

      .icon-corner {
        position: absolute;
        top: -4rpx;
        right: -4rpx;
        padding: 2rpx 8rpx;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
        border-radius: 16rpx;

        .corner-text {
          font-size: 18rpx;
          color: #fff;
          transform: scale(0.85);
        }
      }
    }

    .menu-title {
      font-size: 26rpx;
      color: var(--text-color-primary);
      text-align: center;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-desc {
      font-size: 22rpx;
      color: var(--text-color-tertiary);
      text-align: center;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-arrow {
      position: absolute;
      bottom: 8rpx;
      right: 8rpx;

      .arrow-icon {
        font-size: 24rpx;
        color: var(--text-color-placeholder);
      }
    }
  }
}
</style>
