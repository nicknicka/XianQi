<template>
  <view class="location-picker" :class="[customClass]" :style="customStyle">
    <!-- 当前位置显示 -->
    <view v-if="showCurrent && currentLocation" class="current-location" @click="handleRelocate">
      <view class="location-icon">
        <text class="icon-text">📍</text>
      </view>
      <view class="location-info">
        <text class="location-name">{{ currentLocation.name }}</text>
        <text class="location-address">{{ currentLocation.address }}</text>
      </view>
      <view class="relocate-btn">
        <text class="btn-text">重新定位</text>
      </view>
    </view>

    <!-- 位置输入 -->
    <view v-if="showInput" class="location-input">
      <view class="input-wrapper">
        <text class="input-icon">🔍</text>
        <input
          class="input-field"
          type="text"
          :placeholder="inputPlaceholder"
          :value="searchKeyword"
          @input="handleSearchInput"
          @confirm="handleSearchConfirm"
        />
        <text v-if="searchKeyword" class="clear-icon" @click="handleClear">×</text>
      </view>
    </view>

    <!-- 搜索结果列表 -->
    <view v-if="showSearchResults && searchResults.length > 0" class="search-results">
      <scroll-view class="results-list" scroll-y :scroll-top="scrollTop">
        <view
          v-for="(item, index) in searchResults"
          :key="index"
          class="result-item"
          @click="handleSelectLocation(item)"
        >
          <view class="result-icon">
            <text class="icon-text">{{ getLocationIcon(item.type) }}</text>
          </view>
          <view class="result-info">
            <text class="result-name">{{ item.name }}</text>
            <text class="result-address">{{ item.address }}</text>
            <text v-if="item.distance" class="result-distance">
              距离 {{ formatDistance(item.distance) }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 地图显示 -->
    <view v-if="showMap" class="map-container">
      <map
        id="locationMap"
        class="location-map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :markers="mapMarkers"
        :scale="mapScale"
        :show-location="true"
        @tap="handleMapTap"
        @markertap="handleMarkerTap"
      />
    </view>

    <!-- 附近位置推荐 -->
    <view v-if="showNearby && nearbyLocations.length > 0" class="nearby-locations">
      <view class="nearby-header">
        <text class="header-title">附近位置</text>
        <text class="header-subtitle">共 {{ nearbyLocations.length }} 个地点</text>
      </view>
      <scroll-view class="nearby-list" scroll-y>
        <view
          v-for="(item, index) in nearbyLocations"
          :key="index"
          class="nearby-item"
          @click="handleSelectLocation(item)"
        >
          <view class="nearby-icon">
            <text class="icon-text">{{ getLocationIcon(item.type) }}</text>
          </view>
          <view class="nearby-info">
            <text class="nearby-name">{{ item.name }}</text>
            <text class="nearby-address">{{ item.address }}</text>
            <text v-if="item.distance" class="nearby-distance">
              {{ formatDistance(item.distance) }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 常用位置 -->
    <view v-if="showFavorites && favoriteLocations.length > 0" class="favorite-locations">
      <view class="favorite-header">
        <text class="header-title">常用位置</text>
      </view>
      <view class="favorite-list">
        <view
          v-for="(item, index) in favoriteLocations"
          :key="index"
          class="favorite-item"
          @click="handleSelectLocation(item)"
        >
          <view class="favorite-icon">
            <text class="icon-text">⭐</text>
          </view>
          <view class="favorite-info">
            <text class="favorite-name">{{ item.name }}</text>
            <text class="favorite-address">{{ item.address }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 确认按钮 -->
    <view v-if="showConfirm" class="confirm-actions">
      <view class="action-btn cancel-btn" @click="handleCancel">
        <text class="btn-text">取消</text>
      </view>
      <view
        class="action-btn confirm-btn"
        :class="{ 'is-disabled': !selectedLocation }"
        @click="handleConfirm"
      >
        <text class="btn-text">确认</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export type LocationType = 'home' | 'company' | 'school' | 'other'

interface LocationInfo {
  id?: string
  name: string
  address: string
  latitude: number
  longitude: number
  type?: LocationType
  distance?: number
  [key: string]: any
}

interface Props {
  /** 是否显示当前位置 */
  showCurrent?: boolean
  /** 是否显示输入框 */
  showInput?: boolean
  /** 是否显示搜索结果 */
  showSearchResults?: boolean
  /** 是否显示地图 */
  showMap?: boolean
  /** 是否显示附近位置 */
  showNearby?: boolean
  /** 是否显示常用位置 */
  showFavorites?: boolean
  /** 是否显示确认按钮 */
  showConfirm?: boolean
  /** 输入框占位文本 */
  inputPlaceholder?: string
  /** 地图缩放级别 */
  mapScale?: number
  /** 当前位置 */
  currentLocation?: LocationInfo | null
  /** 搜索结果 */
  searchResults?: LocationInfo[]
  /** 附近位置 */
  nearbyLocations?: LocationInfo[]
  /** 常用位置 */
  favoriteLocations?: LocationInfo[]
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  showCurrent: true,
  showInput: true,
  showSearchResults: true,
  showMap: true,
  showNearby: true,
  showFavorites: true,
  showConfirm: true,
  inputPlaceholder: '搜索地点',
  mapScale: 15,
  currentLocation: null,
  searchResults: () => [],
  nearbyLocations: () => [],
  favoriteLocations: () => []
})

const emit = defineEmits<{
  'relocate': []
  'search': [keyword: string]
  'select': [location: LocationInfo]
  'confirm': [location: LocationInfo]
  'cancel': []
  'map-tap': [location: { latitude: number; longitude: number }]
  'marker-tap': [marker: any]
}>()

const searchKeyword = ref('')
const selectedLocation = ref<LocationInfo | null>(props.currentLocation)
const scrollTop = ref(0)

// 地图中心点
const mapCenter = computed(() => {
  if (selectedLocation.value) {
    return {
      latitude: selectedLocation.value.latitude,
      longitude: selectedLocation.value.longitude
    }
  }
  if (props.currentLocation) {
    return {
      latitude: props.currentLocation.latitude,
      longitude: props.currentLocation.longitude
    }
  }
  return {
    latitude: 39.908823,
    longitude: 116.397470
  }
})

// 地图标记
const mapMarkers = computed(() => {
  const markers: any[] = []

  if (selectedLocation.value) {
    markers.push({
      id: 1,
      latitude: selectedLocation.value.latitude,
      longitude: selectedLocation.value.longitude,
      title: selectedLocation.value.name,
      iconPath: '/static/marker-selected.png',
      width: 30,
      height: 30
    })
  } else if (props.currentLocation) {
    markers.push({
      id: 0,
      latitude: props.currentLocation.latitude,
      longitude: props.currentLocation.longitude,
      title: props.currentLocation.name,
      iconPath: '/static/marker-current.png',
      width: 30,
      height: 30
    })
  }

  return markers
})

// 根据类型获取图标
function getLocationIcon(type?: LocationType): string {
  const iconMap: Record<LocationType, string> = {
    home: '🏠',
    company: '🏢',
    school: '🎓',
    other: '📍'
  }
  return type ? iconMap[type] : '📍'
}

// 格式化距离
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// 重新定位
function handleRelocate() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      emit('relocate')
    },
    fail: () => {
      uni.showToast({
        title: '定位失败',
        icon: 'none'
      })
    }
  })
}

// 搜索输入
function handleSearchInput(e: any) {
  searchKeyword.value = e.detail.value
  emit('search', searchKeyword.value)
}

// 搜索确认
function handleSearchConfirm() {
  if (searchKeyword.value.trim()) {
    emit('search', searchKeyword.value)
  }
}

// 清除搜索
function handleClear() {
  searchKeyword.value = ''
  emit('search', '')
}

// 选择位置
function handleSelectLocation(location: LocationInfo) {
  selectedLocation.value = location
  emit('select', location)
}

// 地图点击
function handleMapTap(e: any) {
  const { latitude, longitude } = e.detail
  emit('map-tap', { latitude, longitude })
}

// 标记点击
function handleMarkerTap(e: any) {
  emit('marker-tap', e.detail)
}

// 取消
function handleCancel() {
  emit('cancel')
}

// 确认
function handleConfirm() {
  if (selectedLocation.value) {
    emit('confirm', selectedLocation.value)
  } else {
    uni.showToast({
      title: '请选择位置',
      icon: 'none'
    })
  }
}

// 监听当前位置变化
watch(() => props.currentLocation, (newVal) => {
  if (newVal && !selectedLocation.value) {
    selectedLocation.value = newVal
  }
}, { immediate: true })

// 暴露方法
defineExpose({
  setSearchKeyword: (keyword: string) => {
    searchKeyword.value = keyword
  },
  setSelectedLocation: (location: LocationInfo) => {
    selectedLocation.value = location
  },
  getSelectedLocation: () => selectedLocation.value,
  clearSelection: () => {
    selectedLocation.value = null
  }
})
</script>

<script lang="ts">
export default {
  name: 'LocationPicker',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.location-picker {
  width: 100%;
  display: flex;
  flex-direction: column;

  .current-location {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx;
    background: linear-gradient(135deg, rgba($primary-color, 0.1) 0%, rgba($primary-color, 0.05) 100%);
    border-radius: 12rpx;
    margin-bottom: 16rpx;

    .location-icon {
      width: 56rpx;
      height: 56rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-card);
      border-radius: 50%;
      flex-shrink: 0;

      .icon-text {
        font-size: 28rpx;
      }
    }

    .location-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4rpx;

      .location-name {
        font-size: 28rpx;
        color: var(--text-color-primary);
        font-weight: 500;
      }

      .location-address {
        font-size: 24rpx;
        color: var(--text-color-tertiary);
      }
    }

    .relocate-btn {
      padding: 8rpx 16rpx;
      background: $primary-color;
      border-radius: 24rpx;

      .btn-text {
        font-size: 24rpx;
        color: var(--bg-color-card);
      }
    }
  }

  .location-input {
    margin-bottom: 16rpx;

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 16rpx;
      padding: 20rpx 24rpx;
      background: var(--bg-color-disabled);
      border-radius: 48rpx;

      .input-icon {
        font-size: 32rpx;
        flex-shrink: 0;
      }

      .input-field {
        flex: 1;
        font-size: 28rpx;
        color: var(--text-color-primary);
        background: transparent;
      }

      .clear-icon {
        font-size: 32rpx;
        color: var(--text-color-tertiary);
        flex-shrink: 0;
      }
    }
  }

  .search-results {
    max-height: 400rpx;
    background: var(--bg-color-card);
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    overflow: hidden;

    .results-list {
      height: 100%;

      .result-item {
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 20rpx 24rpx;
        border-bottom: 1rpx solid var(--border-color-light);

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: var(--bg-color-disabled);
        }

        .result-icon {
          width: 48rpx;
          height: 48rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .icon-text {
            font-size: 28rpx;
          }
        }

        .result-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4rpx;

          .result-name {
            font-size: 28rpx;
            color: var(--text-color-primary);
          }

          .result-address {
            font-size: 24rpx;
            color: var(--text-color-tertiary);
          }

          .result-distance {
            font-size: 22rpx;
            color: $primary-color;
          }
        }
      }
    }
  }

  .map-container {
    height: 400rpx;
    background: var(--bg-color-disabled);
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    overflow: hidden;

    .location-map {
      width: 100%;
      height: 100%;
    }
  }

  .nearby-locations {
    background: var(--bg-color-card);
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    overflow: hidden;

    .nearby-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx 24rpx;
      border-bottom: 1rpx solid var(--border-color-light);

      .header-title {
        font-size: 28rpx;
        color: var(--text-color-primary);
        font-weight: 500;
      }

      .header-subtitle {
        font-size: 24rpx;
        color: var(--text-color-tertiary);
      }
    }

    .nearby-list {
      max-height: 400rpx;

      .nearby-item {
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 20rpx 24rpx;
        border-bottom: 1rpx solid var(--border-color-light);

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: var(--bg-color-disabled);
        }

        .nearby-icon {
          width: 48rpx;
          height: 48rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .icon-text {
            font-size: 28rpx;
          }
        }

        .nearby-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4rpx;

          .nearby-name {
            font-size: 28rpx;
            color: var(--text-color-primary);
          }

          .nearby-address {
            font-size: 24rpx;
            color: var(--text-color-tertiary);
          }

          .nearby-distance {
            font-size: 22rpx;
            color: $primary-color;
          }
        }
      }
    }
  }

  .favorite-locations {
    background: var(--bg-color-card);
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    overflow: hidden;

    .favorite-header {
      padding: 20rpx 24rpx;
      border-bottom: 1rpx solid var(--border-color-light);

      .header-title {
        font-size: 28rpx;
        color: var(--text-color-primary);
        font-weight: 500;
      }
    }

    .favorite-list {
      .favorite-item {
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 20rpx 24rpx;
        border-bottom: 1rpx solid var(--border-color-light);

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: var(--bg-color-disabled);
        }

        .favorite-icon {
          width: 48rpx;
          height: 48rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .icon-text {
            font-size: 28rpx;
          }
        }

        .favorite-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4rpx;

          .favorite-name {
            font-size: 28rpx;
            color: var(--text-color-primary);
          }

          .favorite-address {
            font-size: 24rpx;
            color: var(--text-color-tertiary);
          }
        }
      }
    }
  }

  .confirm-actions {
    display: flex;
    gap: 16rpx;
    padding-top: 16rpx;

    .action-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 40rpx;
      font-size: 28rpx;

      &.cancel-btn {
        background: var(--bg-color-disabled);

        .btn-text {
          color: var(--text-color-secondary);
        }
      }

      &.confirm-btn {
        background: $primary-color;

        .btn-text {
          color: var(--bg-color-card);
        }

        &.is-disabled {
          opacity: 0.5;
        }
      }
    }
  }
}
</style>
