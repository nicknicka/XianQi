<template>
  <view class="devices-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      title="登录设备"
      :show-back="true"
      background-color="transparent"
      text-color="#ffffff"
    />

    <!-- 头部背景 -->
    <view class="header-bg" />

    <!-- 当前设备 -->
    <view class="device-section">
      <view class="section-title">
        <text class="title-text">当前设备</text>
        <view class="current-badge">
          <text class="badge-text">当前使用</text>
        </view>
      </view>
      <view class="device-card current-device">
        <view class="device-icon" :class="getPlatformClass(currentDevice?.platform)">
          <uni-icons :type="getPlatformIcon(currentDevice?.platform)" size="32" color="#fff" />
        </view>
        <view class="device-info">
          <text class="device-name">{{ currentDevice?.deviceName || '未知设备' }}</text>
          <view class="device-meta">
            <text class="meta-text">{{ currentDevice?.platform || '' }}</text>
            <text class="divider">|</text>
            <text class="meta-text">刚刚活跃</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 其他设备 -->
    <view class="device-section" v-if="otherDevices.length > 0">
      <view class="section-title">
        <text class="title-text">其他登录设备 ({{ otherDevices.length }})</text>
      </view>
      <view class="device-list">
        <view
          class="device-card"
          v-for="device in otherDevices"
          :key="device.deviceId"
        >
          <view class="device-icon" :class="getPlatformClass(device.platform)">
            <uni-icons :type="getPlatformIcon(device.platform)" size="28" color="#fff" />
          </view>
          <view class="device-info">
            <text class="device-name">{{ device.deviceName }}</text>
            <view class="device-meta">
              <text class="meta-text">{{ device.platform }}</text>
              <text class="divider">|</text>
              <text class="meta-text">{{ formatTime(device.lastLoginTime) }}</text>
            </view>
            <view class="device-ip">
              <uni-icons type="location" size="12" color="#AAAAAA" />
              <text class="ip-text">{{ device.lastLoginIP }}</text>
            </view>
          </view>
          <view class="device-actions">
            <view class="remove-btn" @click="handleRemoveDevice(device.deviceId)">
              <uni-icons type="trash" size="16" :color="dangerColor" />
              <text class="remove-text">移除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <EmptyState text="暂无其他登录设备" image="/static/images/empty.png" tip="您的账号安全有保障" />
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions" v-if="otherDevices.length > 0">
      <view class="action-btn danger-btn" @click="handleRemoveAll">
        <text class="btn-text">移除所有其他设备</text>
      </view>
    </view>

    <!-- 安全提示 -->
    <view class="security-tips">
      <view class="tips-header">
        <uni-icons type="info-filled" size="16" color="#FF9800" />
        <text class="tips-title">安全提示</text>
      </view>
      <view class="tips-list">
        <text class="tip-item">• 定期检查登录设备，发现异常及时移除</text>
        <text class="tip-item">• 移除设备后，该设备需要重新登录</text>
        <text class="tip-item">• 建议开启设备锁保护账号安全</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userApi } from '@/api/user'
import { useThemeStyle, useThemePage, useThemeColors } from '@/utils/theme'
import EmptyState from '@/components/empty-state/empty-state.vue'

const { themeStyle } = useThemeStyle()
const { dangerColor } = useThemeColors()

onShow(() => {
  useThemePage()
})

interface Device {
  deviceId: string
  deviceName: string
  deviceType: string
  platform: string
  lastLoginTime: string
  lastLoginIP: string
  isCurrent: boolean
}

const devices = ref<Device[]>([])
const currentDevice = ref<Device | null>(null)
const otherDevices = ref<Device[]>([])

onMounted(() => {
  loadDevices()
})

async function loadDevices() {
  try {
    const res = await userApi.getLoginDevices()
    devices.value = res.data?.devices || []

    // 分离当前设备和其他设备
    currentDevice.value = devices.value.find(d => d.isCurrent) || null
    otherDevices.value = devices.value.filter(d => !d.isCurrent)
  } catch (error) {
    console.error('[Devices] 获取设备列表失败:', error)
    uni.showToast({
      title: '获取设备列表失败',
      icon: 'none'
    })
  }
}

// 获取平台图标
function getPlatformIcon(platform?: string): string {
  const platformMap: Record<string, string> = {
    'iOS': 'iphone',
    'Android': 'android',
    'Windows': 'windows',
    'macOS': 'mac',
    'Linux': 'linux'
  }
  return platformMap[platform || ''] || 'phone'
}

// 获取平台样式类
function getPlatformClass(platform?: string): string {
  const platformMap: Record<string, string> = {
    'iOS': 'platform-ios',
    'Android': 'platform-android',
    'Windows': 'platform-windows',
    'macOS': 'platform-macos',
    'Linux': 'platform-linux'
  }
  return platformMap[platform || ''] || 'platform-default'
}

// 格式化时间
function formatTime(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

// 移除单个设备
function handleRemoveDevice(deviceId: string) {
  uni.showModal({
    title: '移除设备',
    content: '移除后该设备需要重新登录才能使用',
    confirmText: '确认移除',
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          await userApi.removeLoginDevice(deviceId)
          uni.showToast({
            title: '已移除',
            icon: 'success'
          })
          // 重新加载设备列表
          loadDevices()
        } catch (error: any) {
          uni.showToast({
            title: error.message || '移除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 移除所有其他设备
function handleRemoveAll() {
  uni.showModal({
    title: '移除所有设备',
    content: `确定要移除其他 ${otherDevices.value.length} 台设备吗？移除后这些设备都需要重新登录。`,
    confirmText: '确认移除',
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          await userApi.removeAllOtherDevices()
          uni.showToast({
            title: '已移除所有设备',
            icon: 'success'
          })
          // 重新加载设备列表
          loadDevices()
        } catch (error: any) {
          uni.showToast({
            title: error.message || '移除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.devices-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding-bottom: 32rpx;
}

.header-bg {
  height: 200rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  position: relative;
}

.device-section {
  margin: 24rpx;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .title-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .current-badge {
    padding: 6rpx 12rpx;
    background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
    border-radius: 12rpx;

    .badge-text {
      font-size: 20rpx;
      color: var(--success-color);
      font-weight: 600;
    }
  }
}

.device-card {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  &.current-device {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .device-name {
      color: #fff;
    }

    .meta-text {
      color: rgba(255, 255, 255, 0.8);
    }

    .divider {
      color: rgba(255, 255, 255, 0.4);
    }
  }
}

.device-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;

  &.platform-ios {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.platform-android {
    background: linear-gradient(135deg, var(--success-color) 0%, #45a049 100%);
  }

  &.platform-windows {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  }

  &.platform-macos {
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  }

  &.platform-linux {
    background: linear-gradient(135deg, #FFC107 0%, #FFA000 100%);
  }

  &.platform-default {
    background: linear-gradient(135deg, #9E9E9E 0%, #757575 100%);
  }
}

.device-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.device-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .meta-text {
    font-size: 22rpx;
    color: var(--text-color-tertiary);
  }

  .divider {
    font-size: 18rpx;
    color: #ddd;
  }
}

.device-ip {
  display: flex;
  align-items: center;
  gap: 6rpx;

  .ip-text {
    font-size: 20rpx;
    color: var(--text-color-tertiary);
  }
}

.device-actions {
  .remove-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: 12rpx 16rpx;

    .remove-text {
      font-size: 20rpx;
      color: var(--error-color);
    }

    &:active {
      opacity: 0.7;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;

  .empty-icon {
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: var(--text-color-primary);
    font-weight: 600;
    margin-bottom: 8rpx;
  }

  .empty-desc {
    font-size: 24rpx;
    color: var(--text-color-tertiary);
  }
}

.bottom-actions {
  padding: 0 24rpx;
  margin-top: 24rpx;

  .action-btn {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-color-card);
    border-radius: 16rpx;
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

    &.danger-btn {
      background: var(--error-color);
      color: #fff;
    }
  }
}

.security-tips {
  margin: 24rpx;
  padding: 24rpx;
  background: var(--bg-color-warm);
  border-radius: 16rpx;

  .tips-header {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;

    .tips-title {
      font-size: 26rpx;
      font-weight: 600;
      color: var(--warning-color);
    }
  }

  .tips-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    .tip-item {
      font-size: 22rpx;
      color: var(--text-color-secondary);
      line-height: 1.6;
    }
  }
}
</style>
