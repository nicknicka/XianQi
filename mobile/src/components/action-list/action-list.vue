<template>
  <view class="action-list" :class="[customClass]" :style="customStyle">
    <view
      v-for="(item, index) in items"
      :key="item.id || index"
      class="action-item"
      :class="{
        'is-disabled': item.disabled,
        'is-active': item.active,
        'is-clickable': item.clickable !== false
      }"
      @click="handleClick(item, index)"
    >
      <!-- 左侧图标 -->
      <view v-if="item.icon" class="item-icon" :style="{ color: item.iconColor || '' }">
        <image
          v-if="item.iconType === 'image'"
          class="icon-image"
          :src="item.icon"
          mode="aspectFit"
        />
        <text v-else class="icon-text">{{ item.icon }}</text>
      </view>

      <!-- 中间内容 -->
      <view class="item-content">
        <!-- 标题 -->
        <view class="content-title">
          <text class="title-text">{{ item.title }}</text>
          <!-- 徽章 -->
          <view v-if="item.badge" class="title-badge">
            <text class="badge-text">{{ item.badge }}</text>
          </view>
        </view>

        <!-- 描述 -->
        <text v-if="item.description" class="content-desc">
          {{ item.description }}
        </text>

        <!-- 额外信息 -->
        <text v-if="item.extra" class="content-extra">
          {{ item.extra }}
        </text>
      </view>

      <!-- 右侧箭头 -->
      <view v-if="showArrow && item.arrow !== false" class="item-arrow">
        <text class="arrow-icon">›</text>
      </view>

      <!-- 切换开关 -->
      <view v-if="item.showSwitch" class="item-switch" @click.stop="handleSwitch(item, index)">
        <switch
          :checked="item.switchChecked"
          :disabled="item.disabled"
          :color="primaryColor"
          @change="handleSwitchChange(item, index, $event)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

interface ActionListItem {
  id?: string
  title: string
  description?: string
  extra?: string
  icon?: string
  iconType?: 'text' | 'image'
  iconColor?: string
  badge?: string | number
  arrow?: boolean
  showSwitch?: boolean
  switchChecked?: boolean
  disabled?: boolean
  active?: boolean
  clickable?: boolean
  url?: string
  [key: string]: any
}

interface Props {
  /** 列表数据 */
  items?: ActionListItem[]
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  showArrow: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'click': [item: ActionListItem, index: number]
  'switch-change': [item: ActionListItem, index: number, checked: boolean]
}>()

// 点击列表项
function handleClick(item: ActionListItem, index: number) {
  if (item.disabled || item.clickable === false) return

  emit('click', item, index)

  // 如果有 URL，跳转
  if (item.url) {
    if (!item.url) return
    uni.navigateTo({
      url: item.url,
      fail: () => {
        uni.switchTab({
          url: item.url as string
        })
      }
    })
  }
}

// 点击开关
function handleSwitch(item: ActionListItem, index: number) {
  // 阻止事件冒泡
}

// 开关变化
function handleSwitchChange(item: ActionListItem, index: number, e: any) {
  emit('switch-change', item, index, e.detail.value)
}

// 暴露方法
defineExpose({
  setItems: (items: ActionListItem[]) => {
    // 更新列表项
  },
  updateItem: (index: number, data: Partial<ActionListItem>) => {
    // 更新单个项
  }
})
</script>

<script lang="ts">
export default {
  name: 'ActionList',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.action-list {
  background: var(--bg-color-card);

  .action-item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 24rpx 32rpx;
    background: var(--bg-color-card);
    border-bottom: 1rpx solid var(--border-color-light);
    transition: background 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &.is-clickable:active {
      background: var(--bg-color-disabled);
    }

    &.is-active {
      background: rgba(var(--primary-color-rgb), 0.05);
    }

    &.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .item-icon {
      flex-shrink: 0;
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon-image {
        width: 100%;
        height: 100%;
      }

      .icon-text {
        font-size: 36rpx;
      }
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .content-title {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 8rpx;

        .title-text {
          font-size: 28rpx;
          color: var(--text-color-primary);
          font-weight: 500;
        }

        .title-badge {
          padding: 4rpx 12rpx;
          background: var(--error-color);
          border-radius: 16rpx;

          .badge-text {
            font-size: 20rpx;
            color: var(--bg-color-card);
            transform: scale(0.85);
          }
        }
      }

      .content-desc {
        display: block;
        font-size: 24rpx;
        color: var(--text-color-tertiary);
        line-height: 1.4;
        margin-bottom: 8rpx;
      }

      .content-extra {
        display: block;
        font-size: 26rpx;
        color: var(--text-color-secondary);
      }
    }

    .item-arrow {
      flex-shrink: 0;

      .arrow-icon {
        font-size: 32rpx;
        color: var(--text-color-placeholder);
      }
    }

    .item-switch {
      flex-shrink: 0;
    }
  }
}
</style>
