<template>
  <view class="index-list" :class="[customClass]" :style="customStyle">
    <!-- 列表内容 -->
    <scroll-view
      class="list-container"
      scroll-y
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="true"
    >
      <!-- 分组列表 -->
      <view
        v-for="group in dataSource"
        :key="group.index"
        :id="`section-${group.index}`"
        class="list-section"
      >
        <!-- 分组标题 -->
        <view class="section-header">
          <text class="header-text">{{ group.index }}</text>
        </view>

        <!-- 列表项 -->
        <view
          v-for="(item, itemIndex) in group.items"
          :key="item.id || itemIndex"
          class="list-item"
          @click="handleItemClick(item, itemIndex)"
        >
          <!-- 头像 -->
          <UserAvatar
            v-if="item.avatar"
            class="item-avatar"
            :src="item.avatar"
            size="sm"
            shape="circle"
          />

          <!-- 内容 -->
          <view class="item-content">
            <text class="item-name">{{ item.name }}</text>
            <text v-if="item.description" class="item-desc">
              {{ item.description }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 索引条 -->
    <view
      v-if="showIndex"
      class="index-bar"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <view
        v-for="(group, index) in dataSource"
        :key="index"
        class="index-item"
        :class="{ 'is-active': activeIndex === group.index }"
        :data-index="group.index"
      >
        <text class="index-text">{{ group.index }}</text>
      </view>
    </view>

    <!-- 当前索引提示 -->
    <view v-if="showToast && touching" class="index-toast">
      <text class="toast-text">{{ activeIndex }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'

export interface IndexListItem {
  id?: string
  name: string
  avatar?: string
  description?: string
  [key: string]: any
}

export interface IndexListGroup {
  index: string
  items: IndexListItem[]
}

interface Props {
  /** 数据源 */
  dataSource?: IndexListGroup[]
  /** 是否显示索引 */
  showIndex?: boolean
  /** 是否显示索引提示 */
  showToast?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  dataSource: () => [],
  showIndex: true,
  showToast: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'click': [item: IndexListItem, index: number]
  'select': [index: string]
}>()

const activeIndex = ref('')
const scrollIntoView = ref('')
const touching = ref(false)
const sidebarTop = ref(0)

// 点击列表项
function handleItemClick(item: IndexListItem, index: number) {
  emit('click', item, index)
}

// 触摸开始
function handleTouchStart(e: any) {
  touching.value = true
  handleTouchMove(e)
}

// 触摸移动
function handleTouchMove(e: any) {
  const touch = e.touches[0]
  const query = uni.createSelectorQuery()

  query.selectAll('.index-item').boundingClientRect((rects: any) => {
    if (!rects || !rects.length) return

    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i]
      if (
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        const index = props.dataSource[i]?.index
        if (index && activeIndex.value !== index) {
          activeIndex.value = index
          scrollIntoView.value = `section-${index}`
          emit('select', index)
        }
        break
      }
    }
  }).exec()
}

// 触摸结束
function handleTouchEnd() {
  touching.value = false
}
</script>

<script lang="ts">
export default {
  name: 'IndexList',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.index-list {
  position: relative;
  width: 100%;
  height: 100vh;
  background: var(--bg-color-card);

  .list-container {
    height: 100%;

    .list-section {
      .section-header {
        padding: 16rpx 32rpx;
        background: var(--bg-color-disabled);

        .header-text {
          font-size: 24rpx;
          color: var(--text-color-tertiary);
          font-weight: 500;
        }
      }

      .list-item {
        display: flex;
        align-items: center;
        gap: 24rpx;
        padding: 24rpx 32rpx;
        background: var(--bg-color-card);
        border-bottom: 1rpx solid var(--border-color-light);

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: var(--bg-color-disabled);
        }

        .item-avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .item-content {
          flex: 1;
          min-width: 0;

          .item-name {
            display: block;
            font-size: 28rpx;
            color: var(--text-color-primary);
            margin-bottom: 8rpx;
          }

          .item-desc {
            display: block;
            font-size: 24rpx;
            color: var(--text-color-tertiary);
          }
        }
      }
    }
  }

  .index-bar {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    padding: 16rpx 12rpx;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 24rpx 0 0 24rpx;
    z-index: 10;

    .index-item {
      width: 32rpx;
      height: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      &.is-active {
        .index-text {
          color: var(--primary-color);
          font-weight: 600;
        }
      }

      .index-text {
        font-size: 22rpx;
        color: var(--text-color-secondary);
      }
    }
  }

  .index-toast {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 16rpx;
    z-index: 20;

    .toast-text {
      font-size: 48rpx;
      color: #fff;
      font-weight: 600;
    }
  }
}
</style>
