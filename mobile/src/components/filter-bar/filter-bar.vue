<template>
  <view class="filter-bar" :class="[customClass]" :style="customStyle">
    <!-- 筛选项 -->
    <view class="filter-items">
      <view
        v-for="(filter, index) in filters"
        :key="index"
        class="filter-item"
        :class="{ 'is-active': isFilterActive(filter), 'is-disabled': filter.disabled }"
        @click="handleFilterClick(filter, index)"
      >
        <text class="filter-text">{{ getFilterText(filter) }}</text>
        <text v-if="filter.type === 'sort' && getSortIcon(filter)" class="sort-icon">
          {{ getSortIcon(filter) }}
        </text>
      </view>
    </view>

    <!-- 更多按钮 -->
    <view v-if="showMore" class="filter-more" @click="handleMoreClick">
      <text class="more-text">更多</text>
      <text class="more-arrow">›</text>
    </view>

    <!-- 筛选弹窗 -->
    <uni-popup ref="popupRef" type="bottom" :safe-area="false">
      <view class="filter-modal">
        <!-- 头部 -->
        <view class="modal-header">
          <text class="header-title">{{ modalTitle }}</text>
          <text class="header-btn" @click="handleReset">重置</text>
        </view>

        <!-- 筛选内容 -->
        <scroll-view class="modal-content" scroll-y>
          <!-- 分类筛选 -->
          <view v-for="group in filterGroups" :key="group.key" class="filter-group">
            <view class="group-title">{{ group.title }}</view>
            <view class="group-options">
              <view
                v-for="option in group.options"
                :key="option.value"
                class="option-item"
                :class="{ 'is-active': isOptionActive(group.key, option.value) }"
                @click="handleOptionClick(group.key, option)"
              >
                <text class="option-text">{{ option.label }}</text>
                <text v-if="isOptionActive(group.key, option.value)" class="option-check">✓</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 底部按钮 -->
        <view class="modal-footer">
          <view class="footer-btn cancel-btn" @click="handleCancel">
            <text class="btn-text">取消</text>
          </view>
          <view class="footer-btn confirm-btn" @click="handleConfirm">
            <text class="btn-text">确定</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 筛选项类型
type FilterType = 'sort' | 'select' | 'multi-select' | 'range' | 'date'

interface FilterOption {
  label: string
  value: any
  icon?: string
}

interface FilterItem {
  key: string
  type: FilterType
  label: string
  placeholder?: string
  options?: FilterOption[]
  value?: any
  defaultValue?: any
  disabled?: boolean
  icon?: string
  sortOrder?: 'asc' | 'desc' | null
}

interface FilterGroup {
  key: string
  title: string
  type: 'select' | 'multi-select'
  options: FilterOption[]
  value?: any
}

interface Props {
  /** 筛选项配置 */
  filters: FilterItem[]
  /** 筛选组配置（弹窗内容） */
  filterGroups?: FilterGroup[]
  /** 是否显示更多按钮 */
  showMore?: boolean
  /** 模态框标题 */
  modalTitle?: string
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
  filterGroups: () => [],
  showMore: false,
  modalTitle: '筛选'
})

const emit = defineEmits<{
  'change': [filters: Record<string, any>]
  'filter-click': [filter: FilterItem, value: any]
  'reset': []
  'confirm': [filters: Record<string, any>]
}>()

const popupRef = ref()
const tempValues = ref<Record<string, any>>({})

// 当前筛选值
const currentValues = computed(() => {
  const values: Record<string, any> = {}
  props.filters.forEach(filter => {
    if (filter.value !== undefined) {
      values[filter.key] = filter.value
    } else {
      values[filter.key] = filter.defaultValue
    }
  })
  return values
})

// 判断筛选是否激活
function isFilterActive(filter: FilterItem): boolean {
  const value = currentValues.value[filter.key]
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

// 获取筛选显示文本
function getFilterText(filter: FilterItem): string {
  const value = currentValues.value[filter.key]

  if (!isFilterActive(filter)) {
    return filter.placeholder || filter.label
  }

  if (filter.type === 'select') {
    const option = filter.options?.find(opt => opt.value === value)
    return option?.label || filter.label
  }

  if (filter.type === 'sort') {
    if (value === 'asc') return filter.label + '↑'
    if (value === 'desc') return filter.label + '↓'
    return filter.label
  }

  if (filter.type === 'range') {
    const labels = (value as string)?.split('-') || []
    if (labels.length === 2) {
      return `${filter.label} ${labels[0]}-${labels[1]}`
    }
  }

  return filter.label
}

// 获取排序图标
function getSortIcon(filter: FilterItem): string {
  if (filter.type !== 'sort') return ''
  const value = currentValues.value[filter.key]
  if (value === 'asc') return '↑'
  if (value === 'desc') return '↓'
  return ''
}

// 判断选项是否激活
function isOptionActive(key: string, value: any): boolean {
  const currentValue = tempValues.value[key] ?? currentValues.value[key]
  if (Array.isArray(currentValue)) {
    return currentValue?.includes(value)
  }
  return currentValue === value
}

// 点击筛选项
function handleFilterClick(filter: FilterItem, index: number) {
  if (filter.disabled) return

  // 排序类型：点击切换 asc/desc/null
  if (filter.type === 'sort') {
    const current = currentValues.value[filter.key]
    let newValue: string | null = null
    if (!current) {
      newValue = 'asc'
    } else if (current === 'asc') {
      newValue = 'desc'
    }
    emitChange(filter.key, newValue)
    emit('filter-click', filter, newValue)
  }
  // 单选和多选：打开弹窗
  else if (filter.type === 'select' || filter.type === 'multi-select' || filter.type === 'range') {
    openModal()
  }
  // 其他类型直接触发
  else {
    openModal()
  }
}

// 打开弹窗
function openModal() {
  // 初始化临时值
  tempValues.value = { ...currentValues.value }
  popupRef.value?.open()
}

// 点击选项
function handleOptionClick(key: string, option: FilterOption) {
  // 查找对应的筛选组
  const group = props.filterGroups.find(g => g.key === key)
  if (!group) return

  if (group.type === 'select') {
    tempValues.value[key] = option.value
  } else if (group.type === 'multi-select') {
    const current = tempValues.value[key] || []
    if (current.includes(option.value)) {
      tempValues.value[key] = current.filter((v: any) => v !== option.value)
    } else {
      tempValues.value[key] = [...current, option.value]
    }
  }
}

// 重置
function handleReset() {
  tempValues.value = {}
  emit('reset')
}

// 取消
function handleCancel() {
  popupRef.value?.close()
}

// 确认
function handleConfirm() {
  emit('change', tempValues.value)
  emit('confirm', tempValues.value)
  popupRef.value?.close()
}

// 点击更多
function handleMoreClick() {
  openModal()
}

// 触发变化
function emitChange(key: string, value: any) {
  const newFilters = { ...currentValues.value, [key]: value }
  emit('change', newFilters)
}

// 暴露方法
defineExpose({
  open: openModal,
  close: () => popupRef.value?.close(),
  reset: handleReset,
  getValue: () => currentValues.value,
  setValue: (key: string, value: any) => {
    emitChange(key, value)
  }
})
</script>

<script lang="ts">
export default {
  name: 'FilterBar',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
  padding: 16rpx 0;

  .filter-items {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12rpx;
    overflow-x: scroll;
    overflow-y: hidden;

    &::-webkit-scrollbar {
      display: none;
    }

    .filter-item {
      display: inline-flex;
      align-items: center;
      gap: 8rpx;
      padding: 12rpx 20rpx;
      background: var(--bg-color-disabled);
      border-radius: 48rpx;
      flex-shrink: 0;
      transition: all 0.2s;

      &:not(.is-disabled):active {
        background: var(--border-color-base);
      }

      &.is-disabled {
        opacity: 0.4;
      }

      &.is-active {
        background: var(--primary-color-alpha-10);

        .filter-text {
          color: var(--primary-color);
        }

        .sort-icon {
          color: var(--primary-color);
        }
      }

      .filter-text {
        font-size: 26rpx;
        color: var(--text-color-primary);
        white-space: nowrap;
      }

      .sort-icon {
        font-size: 20rpx;
        color: var(--text-color-tertiary);
      }
    }
  }

  .filter-more {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 12rpx 16rpx;

    .more-text {
      font-size: 26rpx;
      color: var(--text-color-secondary);
    }

    .more-arrow {
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }
}

.filter-modal {
  width: 100%;
  max-width: 100vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  // 使用 calc 计算高度，减去底部安全区域
  max-height: calc(80vh - env(safe-area-inset-bottom));
  // 添加底部安全区域 padding
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  overflow-x: hidden;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid var(--border-color-light);

    .header-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .header-btn {
      font-size: 28rpx;
      color: var(--primary-color);
    }
  }

  .modal-content {
    max-height: 60vh;
    padding: 24rpx 32rpx;

    .filter-group {
      margin-bottom: 32rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .group-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--text-color-primary);
        margin-bottom: 16rpx;
      }

      .group-options {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;

        .option-item {
          padding: 12rpx 24rpx;
          background: var(--bg-color-disabled);
          border-radius: 8rpx;
          border: 1rpx solid transparent;
          transition: all 0.2s;

          &:active {
            background: var(--border-color-base);
          }

          &.is-active {
            background: var(--primary-color-alpha-10);
            border-color: var(--primary-color);

            .option-text {
              color: var(--primary-color);
            }
          }

          .option-text {
            font-size: 26rpx;
            color: var(--text-color-primary);
          }

          .option-check {
            font-size: 24rpx;
            color: var(--primary-color);
            margin-left: 8rpx;
          }
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 32rpx;
    border-top: 1rpx solid var(--border-color-light);

    .footer-btn {
      flex: 1;
      height: 72rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 36rpx;
      font-size: 28rpx;

      &.cancel-btn {
        background: var(--bg-color-disabled);

        .btn-text {
          color: var(--text-color-secondary);
        }
      }

      &.confirm-btn {
        background: var(--primary-color);

        .btn-text {
          color: #fff;
        }
      }
    }
  }
}
</style>
