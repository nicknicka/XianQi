<template>
  <view class="address-picker" :class="[customClass]" :style="customStyle">
    <!-- 触发器 -->
    <view class="picker-trigger" :class="{ 'is-disabled': disabled, 'is-focused': visible }" @click="handleShow">
      <slot name="trigger">
        <view class="trigger-content">
          <text class="trigger-value" :class="{ 'is-placeholder': !displayValue }">
            {{ displayValue || placeholder }}
          </text>
          <text class="trigger-arrow">▼</text>
        </view>
      </slot>
    </view>

    <!-- 选择器弹窗 -->
    <uni-popup ref="popupRef" type="bottom" :safe-area="false">
      <view class="picker-modal">
        <!-- 头部 -->
        <view class="picker-header">
          <text class="header-btn cancel-btn" @click="handleCancel">取消</text>
          <text class="header-title">{{ title }}</text>
          <text class="header-btn confirm-btn" @click="handleConfirm">确定</text>
        </view>

        <!-- 已选地址标签 -->
        <view class="picker-tabs">
          <view
            class="tab-item"
            :class="{ 'is-active': activeTab === 'province' }"
            @click="switchTab('province')"
          >
            <text class="tab-text">{{ selectedAddress.provinceName || '请选择' }}</text>
          </view>
          <view
            v-if="selectedAddress.provinceName"
            class="tab-item"
            :class="{ 'is-active': activeTab === 'city' }"
            @click="switchTab('city')"
          >
            <text class="tab-text">{{ selectedAddress.cityName || '请选择' }}</text>
          </view>
          <view
            v-if="selectedAddress.cityName && level === 3"
            class="tab-item"
            :class="{ 'is-active': activeTab === 'district' }"
            @click="switchTab('district')"
          >
            <text class="tab-text">{{ selectedAddress.districtName || '请选择' }}</text>
          </view>
        </view>

        <!-- 选择器列表 -->
        <scroll-view class="picker-list" scroll-y>
          <!-- 省份列表 -->
          <view v-if="activeTab === 'province'" class="list-items">
            <view
              v-for="province in provinces"
              :key="province.code"
              class="list-item"
              :class="{ 'is-selected': selectedAddress.provinceCode === province.code }"
              @click="selectProvince(province)"
            >
              <text class="item-text">{{ province.name }}</text>
              <text v-if="selectedAddress.provinceCode === province.code" class="item-check">✓</text>
            </view>
          </view>

          <!-- 城市列表 -->
          <view v-if="activeTab === 'city'" class="list-items">
            <view
              v-for="city in cities"
              :key="city.code"
              class="list-item"
              :class="{ 'is-selected': selectedAddress.cityCode === city.code }"
              @click="selectCity(city)"
            >
              <text class="item-text">{{ city.name }}</text>
              <text v-if="selectedAddress.cityCode === city.code" class="item-check">✓</text>
            </view>
          </view>

          <!-- 区县列表 -->
          <view v-if="activeTab === 'district'" class="list-items">
            <view
              v-for="district in districts"
              :key="district.code"
              class="list-item"
              :class="{ 'is-selected': selectedAddress.districtCode === district.code }"
              @click="selectDistrict(district)"
            >
              <text class="item-text">{{ district.name }}</text>
              <text v-if="selectedAddress.districtCode === district.code" class="item-check">✓</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { addressPicker, type SelectedAddress, type Province, type City, type District } from '@/utils/address-picker'

interface Props {
  /** 绑定值（区域代码或地址对象） */
  modelValue?: string | SelectedAddress
  /** 选择级别 */
  level?: 2 | 3
  /** 占位文本 */
  placeholder?: string
  /** 标题 */
  title?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义数据 */
  data?: Province[]
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  level: 3,
  placeholder: '请选择省市区',
  title: '选择地址',
  data: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: string | SelectedAddress]
  'change': [value: SelectedAddress]
  'cancel': []
  'confirm': [value: SelectedAddress]
}>()

const popupRef = ref()
const visible = ref(false)
const activeTab = ref<'province' | 'city' | 'district'>('province')
const selectedAddress = ref<SelectedAddress>({})

// 使用自定义数据或默认数据
const picker = computed(() => {
  return props.data ? new (require('@/utils/address-picker').AddressPicker)(props.data) : addressPicker
})

// 省份列表
const provinces = computed(() => {
  return picker.value.getProvinces()
})

// 城市列表
const cities = computed(() => {
  if (!selectedAddress.value.provinceCode) return []
  return picker.value.getCities(selectedAddress.value.provinceCode)
})

// 区县列表
const districts = computed(() => {
  if (!selectedAddress.value.cityCode) return []
  return picker.value.getDistricts(selectedAddress.value.cityCode)
})

// 显示值
const displayValue = computed(() => {
  const { provinceName, cityName, districtName } = selectedAddress.value
  const parts = [provinceName, cityName, districtName].filter(Boolean)
  return parts.join('')
})

// 初始化选中值
function initValue() {
  if (!props.modelValue) {
    selectedAddress.value = {}
    return
  }

  if (typeof props.modelValue === 'string') {
    // 根据代码解析
    const address = picker.value.getAddressByCode(props.modelValue)
    // 这里可以进一步解析省市区的名称
    selectedAddress.value = {
      fullAddress: address
    }
  } else {
    selectedAddress.value = { ...props.modelValue }
  }
}

// 显示选择器
function handleShow() {
  if (props.disabled) return
  initValue()
  if (!selectedAddress.value.provinceName) {
    activeTab.value = 'province'
  } else if (!selectedAddress.value.cityName) {
    activeTab.value = 'city'
  } else if (!selectedAddress.value.districtName && props.level === 3) {
    activeTab.value = 'district'
  }
  visible.value = true
  popupRef.value?.open()
}

// 隐藏选择器
function hide() {
  visible.value = false
  popupRef.value?.close()
}

// 切换标签
function switchTab(tab: 'province' | 'city' | 'district') {
  activeTab.value = tab
}

// 选择省份
function selectProvince(province: Province) {
  selectedAddress.value = {
    provinceCode: province.code,
    provinceName: province.name
  }

  if (props.level === 2) {
    // 二级选择直接完成
    finish()
  } else {
    // 进入城市选择
    activeTab.value = 'city'
  }
}

// 选择城市
function selectCity(city: City) {
  selectedAddress.value = {
    ...selectedAddress.value,
    cityCode: city.code,
    cityName: city.name
  }

  if (props.level === 3) {
    // 进入区县选择
    activeTab.value = 'district'
  } else {
    finish()
  }
}

// 选择区县
function selectDistrict(district: District) {
  selectedAddress.value = {
    ...selectedAddress.value,
    districtCode: district.code,
    districtName: district.name
  }
  finish()
}

// 完成选择
function finish() {
  const fullAddress = displayValue.value
  selectedAddress.value.fullAddress = fullAddress

  const value = selectedAddress.value.districtCode || selectedAddress.value.cityCode || selectedAddress.value.provinceCode || ''
  emit('update:modelValue', value)
  emit('change', selectedAddress.value)
  emit('confirm', selectedAddress.value)
  hide()
}

// 取消
function handleCancel() {
  hide()
  emit('cancel')
}

// 确认
function handleConfirm() {
  finish()
}

// 监听外部值变化
watch(() => props.modelValue, () => {
  initValue()
})

// 暴露方法
defineExpose({
  show: handleShow,
  hide,
  getValue: () => selectedAddress.value,
  setValue: (value: SelectedAddress) => {
    selectedAddress.value = value
  }
})
</script>

<script lang="ts">
export default {
  name: 'AddressPicker',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.address-picker {
  width: 100%;

  .picker-trigger {
    min-height: 80rpx;
    padding: 16rpx 24rpx;
    border: 1px solid #e5e5e5;
    border-radius: 8rpx;
    background: var(--bg-color-card);
    transition: border-color 0.2s;

    &:not(.is-disabled):active {
      background: #fafafa;
    }

    &.is-focused {
      border-color: $primary-color;
    }

    &.is-disabled {
      background: var(--bg-color-disabled);
      opacity: 0.6;
    }

    .trigger-content {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .trigger-value {
        flex: 1;
        font-size: 28rpx;
        color: var(--text-color-primary);

        &.is-placeholder {
          color: var(--text-color-tertiary);
        }
      }

      .trigger-arrow {
        font-size: 20rpx;
        color: var(--text-color-tertiary);
        margin-left: 16rpx;
      }
    }
  }
}

.picker-modal {
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

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    border-bottom: 1px solid var(--border-color-light);

    .header-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .header-btn {
      font-size: 28rpx;
      padding: 8rpx 16rpx;

      &.cancel-btn {
        color: var(--text-color-tertiary);
      }

      &.confirm-btn {
        color: $primary-color;
      }
    }
  }

  .picker-tabs {
    display: flex;
    gap: 8rpx;
    padding: 16rpx 24rpx;
    border-bottom: 1px solid var(--border-color-light);

    .tab-item {
      flex: 1;
      text-align: center;
      padding: 12rpx 16rpx;
      border-radius: 8rpx;
      background: var(--bg-color-disabled);
      transition: all 0.2s;

      &.is-active {
        background: rgba($primary-color, 0.1);

        .tab-text {
          color: $primary-color;
          font-weight: 500;
        }
      }

      .tab-text {
        font-size: 26rpx;
        color: var(--text-color-secondary);
      }
    }
  }

  .picker-list {
    height: 500rpx;

    .list-items {
      padding: 8rpx 0;

      .list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24rpx 32rpx;
        transition: background 0.2s;

        &:active {
          background: var(--bg-color-disabled);
        }

        &.is-selected {
          .item-text {
            color: $primary-color;
          }
        }

        .item-text {
          font-size: 28rpx;
          color: var(--text-color-primary);
        }

        .item-check {
          font-size: 32rpx;
          color: $primary-color;
        }
      }
    }
  }
}
</style>
