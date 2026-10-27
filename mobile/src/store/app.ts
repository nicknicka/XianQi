/**
 * 应用全局状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface LocationInfo {
  latitude: number
  longitude: number
  address?: string
  province?: string
  city?: string
  district?: string
}

// 分类选择状态
interface CategorySelection {
  categoryId: string // 分类ID
  name: string       // 分类名称
}

export const useAppStore = defineStore('app', () => {
  // 网络状态
  const networkType = ref<string>('unknown')
  const isConnected = ref<boolean>(true)

  // 用户位置
  const location = ref<LocationInfo>({
    latitude: 0,
    longitude: 0
  })

  // 系统信息
  const systemInfo = ref<UniApp.GetSystemInfoResult | null>(null)

  // 未读消息数
  const unreadMessageCount = ref<number>(0)
  const unreadNoticeCount = ref<number>(0)

  // 选中的分类（用于从首页跳转到交易市场时传递分类筛选）
  const selectedCategory = ref<CategorySelection | null>(null)

  /**
   * 设置网络状态
   */
  function setNetworkStatus(type: string, connected: boolean) {
    networkType.value = type
    isConnected.value = connected
  }

  /**
   * 设置位置信息
   */
  function setLocation(loc: LocationInfo) {
    location.value = loc
  }

  /**
   * 获取用户位置
   */
  async function getLocation(): Promise<LocationInfo> {
    return new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          const loc = {
            latitude: res.latitude,
            longitude: res.longitude
          }
          setLocation(loc)
          resolve(loc)
        },
        fail: reject
      })
    })
  }

  /**
   * 设置系统信息
   */
  function setSystemInfo(info: UniApp.GetSystemInfoResult) {
    systemInfo.value = info
  }

  /**
   * 获取系统信息
   */
  function getSystemInfo() {
    uni.getSystemInfo({
      success: (res) => {
        setSystemInfo(res)
      }
    })
  }

  /**
   * 设置未读消息数
   */
  function setUnreadMessageCount(count: number) {
    unreadMessageCount.value = count
  }

  /**
   * 增加未读消息数
   */
  function increaseUnreadMessageCount() {
    unreadMessageCount.value++
  }

  /**
   * 清空未读消息数
   */
  function clearUnreadMessageCount() {
    unreadMessageCount.value = 0
  }

  /**
   * 设置未读通知数
   */
  function setUnreadNoticeCount(count: number) {
    unreadNoticeCount.value = count
  }

  /**
   * 清空未读通知数
   */
  function clearUnreadNoticeCount() {
    unreadNoticeCount.value = 0
  }

  /**
   * 获取总未读数
   */
  function getTotalUnreadCount(): number {
    return unreadMessageCount.value + unreadNoticeCount.value
  }

  /**
   * 设置选中的分类
   */
  function setSelectedCategory(category: CategorySelection) {
    selectedCategory.value = category
  }

  /**
   * 清除选中的分类
   */
  function clearSelectedCategory() {
    selectedCategory.value = null
  }

  return {
    // 状态
    networkType,
    isConnected,
    location,
    systemInfo,
    unreadMessageCount,
    unreadNoticeCount,
    selectedCategory,
    // 方法
    setNetworkStatus,
    setLocation,
    getLocation,
    setSystemInfo,
    getSystemInfo,
    setUnreadMessageCount,
    increaseUnreadMessageCount,
    clearUnreadMessageCount,
    setUnreadNoticeCount,
    clearUnreadNoticeCount,
    getTotalUnreadCount,
    setSelectedCategory,
    clearSelectedCategory
  }
})
