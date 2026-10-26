<template>
  <view class="waterfall" :class="[`columns-${columns}`, customClass]" :style="customStyle">
    <!-- 多列容器 -->
    <view
      v-for="(column, columnIndex) in columnsData"
      :key="columnIndex"
      class="waterfall-column"
    >
      <view
        v-for="(item, index) in column"
        :key="item.id || index"
        class="waterfall-item"
        :style="{ height: itemHeight(item) }"
      >
        <slot name="item" :item="item" :index="index" :column="columnIndex">
          <!-- 默认卡片内容 -->
          <view class="default-card">
            <image
              v-if="item.image"
              class="card-image"
              :src="item.image"
              mode="aspectFill"
            />
            <view class="card-content">
              <text v-if="item.title" class="card-title">{{ item.title }}</text>
              <text v-if="item.description" class="card-desc">{{ item.description }}</text>
            </view>
          </view>
        </slot>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading && items.length > 0" class="waterfall-loading">
      <slot name="loading">
        <view class="loading-content">
          <text class="loading-icon">⏳</text>
          <text class="loading-text">加载中...</text>
        </view>
      </slot>
    </view>

    <!-- 已加载全部 -->
    <view v-if="finished && items.length > 0" class="waterfall-finished">
      <slot name="finished">
        <view class="finished-content">
          <view class="divider-line"></view>
          <text class="finished-text">没有更多了</text>
          <view class="divider-line"></view>
        </view>
      </slot>
    </view>

    <!-- 空状态 -->
    <view v-if="items.length === 0 && !loading" class="waterfall-empty">
      <slot name="empty">
        <view class="empty-content">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无数据</text>
        </view>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'

interface WaterfallItem {
  id?: string
  image?: string
  title?: string
  description?: string
  height?: number
  [key: string]: any
}

interface Props {
  /** 数据列表 */
  items?: WaterfallItem[]
  /** 列数 */
  columns?: number
  /** 列间距 */
  gap?: number
  /** 是否加载中 */
  loading?: boolean
  /** 是否加载完成 */
  finished?: boolean
  /** 项目高度计算函数 */
  itemHeight?: (item: WaterfallItem) => string
  /** 容器宽度（用于计算） */
  width?: number
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  columns: 2,
  gap: 16,
  loading: false,
  finished: false,
  itemHeight: undefined
})

const emit = defineEmits<{
  load: []
}>()

// 列数据（每列的高度和项目）
const columnsData = ref<WaterfallItem[][]>([])
const columnHeights = ref<number[]>([])

// 初始化列
function initColumns() {
  columnsData.value = Array.from({ length: props.columns }, () => [])
  columnHeights.value = Array(props.columns).fill(0)
}

// 计算项目高度
function itemHeight(item: WaterfallItem): string {
  if (props.itemHeight) {
    return props.itemHeight(item)
  }
  if (item.height) {
    return `${item.height}rpx`
  }
  return 'auto'
}

// 获取项目实际高度（需要渲染后测量）
async function measureItemHeight(item: WaterfallItem): Promise<number> {
  return new Promise((resolve) => {
    // 这里可以使用图片信息预获取高度
    // 简化实现：使用固定比例或默认高度
    if (item.height) {
      resolve(item.height)
    } else if (item.image) {
      // 尝试获取图片信息
      uni.getImageInfo({
        src: item.image,
        success: (res) => {
          // 根据宽度计算高度
          const columnWidth = (props.width || 750) / props.columns - props.gap
          const height = (res.height / res.width) * columnWidth
          resolve(height)
        },
        fail: () => {
          // 默认高度
          resolve(300)
        }
      })
    } else {
      resolve(200)
    }
  })
}

// 分配项目到最短的列
async function distributeItems() {
  initColumns()

  for (const item of props.items) {
    // 找到最短的列
    const minHeight = Math.min(...columnHeights.value)
    const columnIndex = columnHeights.value.indexOf(minHeight)

    // 添加到该列
    columnsData.value[columnIndex].push(item)

    // 更新列高度
    const itemH = await measureItemHeight(item)
    columnHeights.value[columnIndex] += itemH + props.gap
  }
}

// 监听数据变化
watch(() => props.items, () => {
  distributeItems()
}, { deep: true })

// 监听列数变化
watch(() => props.columns, () => {
  distributeItems()
})

onMounted(() => {
  initColumns()
  distributeItems()
})

// 暴露方法
defineExpose({
  // 刷新布局
  refresh: distributeItems,
  // 重置
  reset: initColumns
})
</script>

<script lang="ts">
export default {
  name: 'Waterfall',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.waterfall {
  width: 100%;
  display: flex;
  gap: 16rpx;

  &.columns-2 {
    .waterfall-column {
      width: calc((100% - 16rpx) / 2);
    }
  }

  &.columns-3 {
    .waterfall-column {
      width: calc((100% - 32rpx) / 3);
    }
  }

  &.columns-4 {
    .waterfall-column {
      width: calc((100% - 48rpx) / 4);
    }
  }

  .waterfall-column {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    flex-shrink: 0;
  }

  .waterfall-item {
    width: 100%;
    background: var(--bg-color-card);
    border-radius: 12rpx;
    overflow: hidden;

    .default-card {
      width: 100%;

      .card-image {
        width: 100%;
        display: block;
      }

      .card-content {
        padding: 16rpx;

        .card-title {
          display: block;
          font-size: 28rpx;
          color: var(--text-color-primary);
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          margin-bottom: 8rpx;
        }

        .card-desc {
          display: block;
          font-size: 24rpx;
          color: var(--text-color-tertiary);
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .waterfall-loading,
  .waterfall-finished,
  .waterfall-empty {
    width: 100%;
    padding: 48rpx 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .loading-content {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .loading-icon {
      font-size: 32rpx;
      animation: rotate 1s linear infinite;
    }

    .loading-text {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }
  }

  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }

  .finished-content {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .divider-line {
      width: 80rpx;
      height: 1px;
      background: #e5e5e5;
    }

    .finished-text {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
      white-space: nowrap;
    }
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24rpx;

    .empty-icon {
      font-size: 96rpx;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 28rpx;
      color: var(--text-color-tertiary);
    }
  }
}
</style>
