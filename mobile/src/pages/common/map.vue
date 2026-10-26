<template>
  <view class="map-page" :style="themeStyle">
    <!-- 地图区域 -->
    <view class="map-container">
      <map
        id="locationMap"
        class="map"
        :longitude="longitude"
        :latitude="latitude"
        :markers="markers"
        :show-location="true"
        @tap="onMapTap"
        @markertap="onMarkerTap"
      >
        <marker
          v-if="selectedLocation"
          :id="1"
          :longitude="selectedLocation.longitude"
          :latitude="selectedLocation.latitude"
          :icon-path="selectedLocation.iconPath"
        />
      </map>

      <!-- 搜索框 -->
      <view class="search-section">
        <view class="search-box">
          <uni-icons type="search" size="18" color="#AAAAAA" />
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索地点"
            placeholder-style="color: var(--text-color-tertiary)"
            @confirm="onSearch"
          />
        </view>
        <button class="locate-btn" @click="relocate">
          <uni-icons type="location" size="18" :color="primaryColor" />
        </button>
      </view>

      <!-- 搜索结果 -->
      <view class="search-results" v-if="searchResults.length > 0">
        <scroll-view scroll-y class="results-scroll">
          <view
            v-for="(item, index) in searchResults"
            :key="index"
            class="result-item"
            @click="selectSearchResult(item)"
          >
            <view class="result-icon">
              <uni-icons type="location" size="16" color="#AAAAAA" />
            </view>
            <view class="result-info">
              <text class="result-name">{{ item.name }}</text>
              <text class="result-address">{{ item.address }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 位置信息确认 -->
    <view class="location-info" v-if="selectedLocation">
      <view class="info-content">
        <view class="info-header">
          <uni-icons type="location" size="16" :color="primaryColor" />
          <text class="info-name">{{ selectedLocation.name || '选中的位置' }}</text>
        </view>
        <text class="info-address">{{ selectedLocation.address }}</text>
      </view>
      <button class="confirm-btn" @click="confirmLocation">确认位置</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import amapUtil from '@/utils/amap'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

const longitude = ref(116.397428) // 默认北京天安门
const latitude = ref(39.90923)
const selectedLocation = ref<any>(null)
const searchKeyword = ref('')
const searchResults = ref<any[]>([])

const markers = ref([
  {
    id: 1,
    longitude: longitude.value,
    latitude: latitude.value,
    iconPath: '/static/icons/marker.png',
    width: 30,
    height: 30
  }
])

onShow(() => {
  useThemePage()
})


onMounted(() => {
  getCurrentLocation()
})

function getCurrentLocation() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      longitude.value = res.longitude
      latitude.value = res.latitude
      updateMarker(res.longitude, res.latitude)
      // 逆地理编码获取地址
      reverseGeocode(res.longitude, res.latitude)
    },
    fail: () => {
      uni.showToast({ title: '获取位置失败', icon: 'none' })
    }
  })
}

function relocate() {
  getCurrentLocation()
}

function updateMarker(lng: number, lat: number, name = '', address = '') {
  markers.value = [
    {
      id: 1,
      longitude: lng,
      latitude: lat,
      iconPath: '/static/icons/marker.png',
      width: 30,
      height: 30
    }
  ]

  selectedLocation.value = {
    longitude: lng,
    latitude: lat,
    name: name || '选中位置',
    address: address || `${lng.toFixed(6)}, ${lat.toFixed(6)}`
  }

  // 清空搜索结果
  searchResults.value = []
  searchKeyword.value = ''
}

function onMapTap(e: any) {
  const { longitude: lng, latitude: lat } = e.detail
  updateMarker(lng, lat)

  // 逆地理编码获取地址
  reverseGeocode(lng, lat)
}

async function reverseGeocode(lng: number, lat: number) {
  try {
    const result = await amapUtil.reverseGeocode(lng, lat)
    if (result) {
      selectedLocation.value = {
        ...selectedLocation.value,
        name: result.name,
        address: result.address,
        province: result.province,
        city: result.city,
        district: result.district
      }
    }
  } catch (error) {
    console.error('逆地理编码失败:', error)
  }
}

async function onSearch() {
  if (!searchKeyword.value.trim()) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
    return
  }

  uni.showLoading({ title: '搜索中...' })

  try {
    const results = await amapUtil.searchPlace({
      keywords: searchKeyword.value,
      pageSize: 20
    })

    searchResults.value = results

    if (results.length === 0) {
      uni.showToast({ title: '未找到相关地点', icon: 'none' })
    }
  } catch (error) {
    console.error('搜索失败:', error)
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function selectSearchResult(item: any) {
  updateMarker(item.longitude, item.latitude, item.name, item.address)
}

function onMarkerTap() {
  // 点击标记
}

function confirmLocation() {
  if (!selectedLocation.value) return

  // 返回上一页并传递位置信息
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - 2] as any

  if (prevPage && prevPage.$vm && typeof prevPage.$vm.onLocationSelected === 'function') {
    prevPage.$vm.onLocationSelected(selectedLocation.value)
  }

  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.map-page {
  position: relative;
  width: 100%;
  height: 100vh;
}

.map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 120rpx);
}

.map {
  width: 100%;
  height: 100%;
}

.search-section {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  right: 24rpx;
  display: flex;
  gap: 16rpx;
  z-index: 100;

  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    height: 72rpx;
    padding: 0 24rpx;
    background: var(--bg-color-card);
    border-radius: 36rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

    .search-input {
      flex: 1;
      height: 100%;
      margin-left: 16rpx;
      font-size: var(--font-size-base);
    }
  }

  .locate-btn {
    width: 72rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-color-card);
    border-radius: 36rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }
}

.search-results {
  position: absolute;
  top: 120rpx;
  left: 24rpx;
  right: 24rpx;
  background: var(--bg-color-card);
  border-radius: 16rpx;
  max-height: 400rpx;
  z-index: 100;
  overflow: hidden;

  .results-scroll {
    max-height: 400rpx;
  }

  .result-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .result-icon {
      margin-right: 16rpx;
    }

    .result-info {
      flex: 1;

      .result-name {
        display: block;
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
        margin-bottom: 8rpx;
      }

      .result-address {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }
  }
}

.location-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-color-card);
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-color-base);

  .info-content {
    margin-bottom: 16rpx;

    .info-header {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 8rpx;

      .info-name {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-color-primary);
      }
    }

    .info-address {
      font-size: var(--font-size-base);
      color: var(--text-color-secondary);
      line-height: 1.6;
    }
  }

  .confirm-btn {
    width: 100%;
    height: 88rpx;
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: var(--font-size-lg);
    border-radius: 12rpx;
    border: none;
  }
}
</style>
