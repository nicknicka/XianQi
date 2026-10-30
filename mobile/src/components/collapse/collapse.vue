<template>
  <view class="collapse" :class="[customClass]" :style="customStyle">
    <view
      v-for="(item, index) in items"
      :key="item.id || index"
      class="collapse-item"
      :class="{
        'is-active': activeNames.includes(item.name || String(index)),
        'is-disabled': item.disabled
      }"
    >
      <!-- 面板头部 -->
      <view
        class="collapse-header"
        @click="handleHeaderClick(item, index)"
      >
        <!-- 左侧图标 -->
        <view v-if="item.icon" class="header-icon">
          <image
            v-if="item.iconType === 'image'"
            class="icon-image"
            :src="item.icon"
            mode="aspectFit"
          />
          <text v-else class="icon-text">{{ item.icon }}</text>
        </view>

        <!-- 标题 -->
        <view class="header-title">
          <text class="title-text">{{ item.title }}</text>
          <!-- 徽章 -->
          <view v-if="item.badge" class="title-badge">
            <text class="badge-text">{{ item.badge }}</text>
          </view>
        </view>

        <!-- 额外内容 -->
        <view v-if="item.extra" class="header-extra">
          <text class="extra-text">{{ item.extra }}</text>
        </view>

        <!-- 箭头图标 -->
        <view class="header-arrow">
          <text class="arrow-icon">›</text>
        </view>
      </view>

      <!-- 面板内容 -->
      <view
        v-if="!item.disabled"
        class="collapse-wrapper"
        :class="{ 'is-open': activeNames.includes(item.name || String(index)) }"
      >
        <view class="collapse-content">
          <slot
            :name="`content-${index}`"
            :item="item"
            :index="index"
          >
            <!-- 默认内容 -->
            <view class="default-content">
              <text v-if="item.content">{{ item.content }}</text>
              <slot
                v-else
                name="default"
                :item="item"
                :index="index"
              ></slot>
            </view>
          </slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export interface CollapseItem {
  id?: string
  name?: string
  title: string
  content?: string
  icon?: string
  iconType?: 'text' | 'image'
  badge?: string
  extra?: string
  disabled?: boolean
  [key: string]: any
}

interface Props {
  /** 折叠面板数据 */
  items?: CollapseItem[]
  /** 当前激活的面板名称 */
  modelValue?: string[]
  /** 是否手风琴模式（只能展开一个） */
  accordion?: boolean
  /** 是否显示边框 */
  border?: boolean
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  modelValue: () => [],
  accordion: false,
  border: true,
  customClass: '',
  customStyle: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'change': [activeNames: string[], item: CollapseItem]
  'open': [item: CollapseItem]
  'close': [item: CollapseItem]
}>()

const activeNames = ref<string[]>([...props.modelValue])

// 点击头部
function handleHeaderClick(item: CollapseItem, index: number) {
  if (item.disabled) return

  const name = item.name || String(index)
  const isActive = activeNames.value.includes(name)

  if (props.accordion) {
    // 手风琴模式：只能展开一个
    if (isActive) {
      activeNames.value = []
      emit('close', item)
    } else {
      activeNames.value = [name]
      emit('open', item)
    }
  } else {
    // 非手风琴模式：可以展开多个
    if (isActive) {
      activeNames.value = activeNames.value.filter(n => n !== name)
      emit('close', item)
    } else {
      activeNames.value.push(name)
      emit('open', item)
    }
  }

  emit('update:modelValue', activeNames.value)
  emit('change', activeNames.value, item)
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  activeNames.value = [...newVal]
})

// 暴露方法
defineExpose({
  open: (name: string | string[]) => {
    if (typeof name === 'string') {
      if (props.accordion) {
        activeNames.value = [name]
      } else {
        activeNames.value.push(name)
      }
    } else {
      activeNames.value = props.accordion ? [name[0]] : [...name]
    }
    emit('update:modelValue', activeNames.value)
  },
  close: (name: string | string[]) => {
    if (typeof name === 'string') {
      activeNames.value = activeNames.value.filter(n => n !== name)
    } else {
      activeNames.value = activeNames.value.filter(n => !name.includes(n))
    }
    emit('update:modelValue', activeNames.value)
  },
  openAll: () => {
    if (props.accordion) {
      return
    }
    activeNames.value = props.items.map((item, index) => item.name || String(index))
    emit('update:modelValue', activeNames.value)
  },
  closeAll: () => {
    activeNames.value = []
    emit('update:modelValue', activeNames.value)
  }
})
</script>

<script lang="ts">
export default {
  name: 'Collapse',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.collapse {
  width: 100%;
  background: var(--bg-color-card);

  .collapse-item {
    border-bottom: 1rpx solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .collapse-header {
      display: flex;
      align-items: center;
      gap: 16rpx;
      padding: 24rpx 32rpx;
      background: var(--bg-color-card);
      transition: background 0.2s;
      cursor: pointer;

      &:active {
        background: var(--bg-color-disabled);
      }

      .header-icon {
        flex-shrink: 0;

        .icon-image {
          width: 40rpx;
          height: 40rpx;
        }

        .icon-text {
          font-size: 32rpx;
        }
      }

      .header-title {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12rpx;

        .title-text {
          font-size: 28rpx;
          color: var(--text-color-primary);
          font-weight: 500;
        }

        .title-badge {
          padding: 4rpx 12rpx;
          background: var(--primary-color-alpha-10);
          border-radius: 8rpx;

          .badge-text {
            font-size: 20rpx;
            color: var(--primary-color);
            transform: scale(0.9);
          }
        }
      }

      .header-extra {
        flex-shrink: 0;

        .extra-text {
          font-size: 26rpx;
          color: var(--text-color-tertiary);
        }
      }

      .header-arrow {
        flex-shrink: 0;
        transition: transform 0.3s;

        .arrow-icon {
          font-size: 32rpx;
          color: var(--text-color-tertiary);
        }
      }
    }

    .collapse-wrapper {
      height: 0;
      overflow: hidden;
      transition: height 0.3s ease-in-out;

      &.is-open {
        height: auto;
      }

      .collapse-content {
        padding: 0 32rpx 24rpx;

        .default-content {
          font-size: 28rpx;
          color: var(--text-color-secondary);
          line-height: 1.6;
        }
      }
    }

    &.is-active {
      .collapse-header .header-arrow {
        transform: rotate(90deg);
      }
    }

    &.is-disabled {
      .collapse-header {
        opacity: 0.5;
        pointer-events: none;
      }
    }
  }
}
</style>
