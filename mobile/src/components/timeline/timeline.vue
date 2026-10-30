<template>
  <view class="timeline" :class="[`position-${position}`, customClass]" :style="customStyle">
    <view
      v-for="(item, index) in items"
      :key="item.id || index"
      class="timeline-item"
      :class="{ 'is-last': index === items.length - 1 }"
    >
      <!-- 时间戳 -->
      <view v-if="showTimestamp && item.timestamp" class="timeline-timestamp">
        <text class="timestamp-text">{{ item.timestamp }}</text>
      </view>

      <!-- 图标 -->
      <view class="timeline-dot" :class="`dot-${item.type || 'default'}`">
        <view v-if="item.icon" class="dot-icon">
          <image
            v-if="item.iconType === 'image'"
            class="icon-image"
            :src="item.icon"
            mode="aspectFit"
          />
          <text v-else class="icon-text">{{ item.icon }}</text>
        </view>
      </view>

      <!-- 内容 -->
      <view class="timeline-content">
        <!-- 标题 -->
        <view v-if="item.title" class="content-title">
          <text class="title-text">{{ item.title }}</text>
          <!-- 标签 -->
          <view v-if="item.tag" class="title-tag" :class="`tag-${item.tagType || 'default'}`">
            <text class="tag-text">{{ item.tag }}</text>
          </view>
        </view>

        <!-- 描述 -->
        <view v-if="item.description" class="content-description">
          <text class="description-text">{{ item.description }}</text>
        </view>

        <!-- 额外内容插槽 -->
        <slot name="content" :item="item" :index="index">
          <!-- 自定义内容 -->
          <view v-if="item.content" class="content-extra">
            <text class="extra-text">{{ item.content }}</text>
          </view>
        </slot>

        <!-- 图片 -->
        <view v-if="item.images && item.images.length > 0" class="content-images">
          <image
            v-for="(image, imgIndex) in item.images"
            :key="imgIndex"
            class="content-image"
            :src="image"
            mode="aspectFill"
            @click="handleImagePreview(item.images, imgIndex)"
          />
        </view>

        <!-- 底部信息 -->
        <view v-if="item.footer" class="content-footer">
          <text class="footer-text">{{ item.footer }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export type TimelinePosition = 'left' | 'right' | 'alternate'
export type TimelineDotType = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

export interface TimelineItem {
  id?: string
  title?: string
  description?: string
  content?: string
  timestamp?: string
  icon?: string
  iconType?: 'text' | 'image'
  type?: TimelineDotType
  tag?: string
  tagType?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  images?: string[]
  footer?: string
  [key: string]: any
}

interface Props {
  /** 时间轴数据 */
  items?: TimelineItem[]
  /** 时间轴位置 */
  position?: TimelinePosition
  /** 是否显示时间戳 */
  showTimestamp?: boolean
  /** 自定义类名 */
  customClass?: string
  /** 自定义样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  position: 'left',
  showTimestamp: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'item-click': [item: TimelineItem, index: number]
  'image-preview': [images: string[], index: number]
}>()

// 点击时间轴项
function handleItemClick(item: TimelineItem, index: number) {
  emit('item-click', item, index)
}

// 预览图片
function handleImagePreview(images: string[], index: number) {
  uni.previewImage({
    urls: images,
    current: index
  })
  emit('image-preview', images, index)
}
</script>

<script lang="ts">
export default {
  name: 'Timeline',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.timeline {
  width: 100%;

  .timeline-item {
    display: flex;
    position: relative;
    padding-bottom: 48rpx;

    &:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 32rpx;
      top: 64rpx;
      bottom: 0;
      width: 2rpx;
      background: var(--border-color-base);
    }

    &.is-last {
      padding-bottom: 0;

      &::before {
        display: none;
      }
    }

    .timeline-timestamp {
      flex-shrink: 0;
      width: 120rpx;
      padding-right: 24rpx;
      text-align: right;

      .timestamp-text {
        font-size: 24rpx;
        color: var(--text-color-tertiary);
      }
    }

    .timeline-dot {
      flex-shrink: 0;
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-card);
      border-radius: 50%;
      border: 4rpx solid var(--border-color-base);
      z-index: 1;

      &.dot-primary {
        border-color: $primary-color;
        background: rgba($primary-color, 0.1);
      }

      &.dot-success {
        border-color: var(--success-color);
        background: rgba(82, 196, 26, 0.1);
      }

      &.dot-warning {
        border-color: var(--warning-color);
        background: rgba(250, 173, 20, 0.1);
      }

      &.dot-error {
        border-color: var(--error-color);
        background: rgba(255, 77, 79, 0.1);
      }

      &.dot-info {
        border-color: var(--info-color);
        background: rgba(24, 144, 255, 0.1);
      }

      .dot-icon {
        .icon-image {
          width: 32rpx;
          height: 32rpx;
        }

        .icon-text {
          font-size: 24rpx;
        }
      }
    }

    .timeline-content {
      flex: 1;
      padding-left: 24rpx;

      .content-title {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 12rpx;

        .title-text {
          font-size: 28rpx;
          color: var(--text-color-primary);
          font-weight: 500;
        }

        .title-tag {
          padding: 4rpx 12rpx;
          border-radius: 8rpx;

          &.tag-default {
            background: var(--bg-color-disabled);

            .tag-text {
              font-size: 20rpx;
              color: var(--text-color-secondary);
            }
          }

          &.tag-primary {
            background: rgba($primary-color, 0.1);

            .tag-text {
              font-size: 20rpx;
              color: $primary-color;
            }
          }

          &.tag-success {
            background: rgba(82, 196, 26, 0.1);

            .tag-text {
              font-size: 20rpx;
              color: var(--success-color);
            }
          }

          &.tag-warning {
            background: rgba(250, 173, 20, 0.1);

            .tag-text {
              font-size: 20rpx;
              color: var(--warning-color);
            }
          }

          &.tag-error {
            background: rgba(255, 77, 79, 0.1);

            .tag-text {
              font-size: 20rpx;
              color: var(--error-color);
            }
          }
        }
      }

      .content-description {
        margin-bottom: 16rpx;

        .description-text {
          font-size: 26rpx;
          color: var(--text-color-secondary);
          line-height: 1.6;
        }
      }

      .content-extra {
        margin-bottom: 16rpx;

        .extra-text {
          font-size: 26rpx;
          color: var(--text-color-tertiary);
          line-height: 1.6;
        }
      }

      .content-images {
        display: flex;
        gap: 12rpx;
        margin-bottom: 16rpx;

        .content-image {
          width: 160rpx;
          height: 160rpx;
          border-radius: 8rpx;
        }
      }

      .content-footer {
        padding-top: 12rpx;
        border-top: 1rpx solid var(--border-color-light);

        .footer-text {
          font-size: 24rpx;
          color: var(--text-color-tertiary);
        }
      }
    }
  }

  // 位置变体
  &.position-right {
    .timeline-item {
      flex-direction: row-reverse;

      &:not(:last-child)::before {
        left: auto;
        right: 32rpx;
      }

      .timeline-timestamp {
        text-align: left;
        padding-right: 0;
        padding-left: 24rpx;
      }

      .timeline-content {
        padding-left: 0;
        padding-right: 24rpx;
        text-align: right;
      }
    }
  }

  &.position-alternate {
    .timeline-item {
      &:nth-child(odd) {
        flex-direction: row;

        .timeline-timestamp {
          text-align: right;
          padding-right: 24rpx;
          padding-left: 0;
        }

        .timeline-content {
          padding-left: 24rpx;
          padding-right: 0;
          text-align: left;
        }
      }

      &:nth-child(even) {
        flex-direction: row-reverse;

        .timeline-timestamp {
          text-align: left;
          padding-right: 0;
          padding-left: 24rpx;
        }

        .timeline-content {
          padding-left: 0;
          padding-right: 24rpx;
          text-align: right;
        }
      }
    }
  }
}
</style>
