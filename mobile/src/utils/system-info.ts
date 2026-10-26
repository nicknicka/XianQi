/**
 * 系统信息工具类
 * 使用新的微信小程序 API 替代已弃用的 getSystemInfoSync
 */

export interface SystemInfo {
  /** 设备 ID */
  deviceId?: string
  /** 设备型号 */
  model?: string
  /** 平台 */
  platform?: string
  /** 系统版本 */
  system?: string
  /** 设备品牌 */
  brand?: string
  /** 状态栏高度 */
  statusBarHeight?: number
  /** 屏幕宽度 */
  screenWidth?: number
  /** 屏幕高度 */
  screenHeight?: number
  /** 窗口宽度 */
  windowWidth?: number
  /** 窗口高度 */
  windowHeight?: number
  /** 像素比 */
  pixelRatio?: number
  /** 语言 */
  language?: string
  /** SDK 版本 */
  SDKVersion?: string
}

/**
 * 胶囊按钮信息（仅微信小程序）
 */
export interface CapsuleInfo {
  /** 顶部位置 */
  top: number
  /** 右侧位置 */
  right: number
  /** 底部位置 */
  bottom: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
}

/**
 * 导航栏信息
 */
export interface NavBarInfo {
  /** 状态栏高度 */
  statusBarHeight: number
  /** 导航栏高度（不含状态栏） */
  navBarHeight: number
  /** 总导航栏高度（状态栏 + 导航栏） */
  totalHeight: number
  /** 胶囊按钮信息（仅微信小程序） */
  capsule?: CapsuleInfo
}

/**
 * 获取系统信息（使用新 API 替代已弃用的 getSystemInfoSync）
 * 在微信小程序中使用新的分段 API，在其他平台使用原 API
 */
export function getSystemInfo(): SystemInfo {
  try {
    // #ifdef MP-WEIXIN
    // 微信小程序环境：使用新的 API（不会产生弃用警告）
    const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : null
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null
    const appBaseInfo = wx.getAppBaseInfo ? wx.getAppBaseInfo() : null

    return {
      deviceId: deviceInfo?.model || appBaseInfo?.SDKVersion || 'unknown',
      model: deviceInfo?.model,
      platform: deviceInfo?.platform || windowInfo?.platform,
      system: deviceInfo?.system,
      brand: deviceInfo?.brand,
      statusBarHeight: windowInfo?.statusBarHeight,
      screenWidth: windowInfo?.screenWidth,
      screenHeight: windowInfo?.screenHeight,
      windowWidth: windowInfo?.windowWidth,
      windowHeight: windowInfo?.windowHeight,
      pixelRatio: windowInfo?.pixelRatio,
      language: appBaseInfo?.language,
      SDKVersion: appBaseInfo?.SDKVersion
    }
    // #endif

    // #ifndef MP-WEIXIN
    // 非微信小程序环境：使用 uni.getSystemInfoSync
    const systemInfo = uni.getSystemInfoSync()

    return {
      deviceId: systemInfo.deviceId || systemInfo.model,
      model: systemInfo.model,
      platform: systemInfo.platform,
      system: systemInfo.system,
      brand: systemInfo.brand,
      statusBarHeight: systemInfo.statusBarHeight,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      pixelRatio: systemInfo.pixelRatio,
      language: systemInfo.language,
      SDKVersion: systemInfo.SDKVersion
    }
    // #endif
  } catch (e) {
    console.warn('[SystemInfo] 获取系统信息失败:', e)
    return {}
  }
}

/**
 * 获取状态栏高度
 */
export function getStatusBarHeight(): number {
  const systemInfo = getSystemInfo()
  return systemInfo.statusBarHeight || 0
}

/**
 * 获取屏幕宽度
 */
export function getScreenWidth(): number {
  const systemInfo = getSystemInfo()
  return systemInfo.screenWidth || 375
}

/**
 * 获取系统版本字符串
 */
export function getSystemString(): string {
  const systemInfo = getSystemInfo()
  return systemInfo.system || ''
}

/**
 * 获取设备型号
 */
export function getDeviceModel(): string {
  const systemInfo = getSystemInfo()
  return systemInfo.model || 'unknown'
}

/**
 * 获取平台信息
 */
export function getPlatform(): string {
  const systemInfo = getSystemInfo()
  return systemInfo.platform || 'unknown'
}

/**
 * 获取完整导航栏信息
 */
export function getNavBarInfo(): NavBarInfo {
  const systemInfo = getSystemInfo()
  const statusBarHeight = systemInfo.statusBarHeight || 0

  // #ifdef MP-WEIXIN
  // 微信小程序环境：获取胶囊按钮信息
  try {
    const menuButton = uni.getMenuButtonBoundingClientRect()
    const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height

    return {
      statusBarHeight,
      navBarHeight,
      totalHeight: statusBarHeight + navBarHeight,
      capsule: {
        top: menuButton.top,
        right: menuButton.right,
        bottom: menuButton.bottom,
        width: menuButton.width,
        height: menuButton.height
      }
    }
  } catch (e) {
    // 如果获取胶囊信息失败，使用默认值
    const navBarHeight = 44
    return {
      statusBarHeight,
      navBarHeight,
      totalHeight: statusBarHeight + navBarHeight
    }
  }
  // #endif

  // #ifndef MP-WEIXIN
  // 非微信小程序环境：使用固定导航栏高度
  const navBarHeight = 44 // iOS/Android 标准导航栏高度

  return {
    statusBarHeight,
    navBarHeight,
    totalHeight: statusBarHeight + navBarHeight
  }
  // #endif
}

/**
 * 判断是否为刘海屏设备
 */
export function isNotchScreen(): boolean {
  const systemInfo = getSystemInfo()
  const model = systemInfo.model?.toLowerCase() || ''

  // iPhone 刘海屏机型列表
  const notchIPhones = [
    'iphone x', 'iphone xs', 'iphone xs max',
    'iphone xr', 'iphone 11', 'iphone 11 pro',
    'iphone 11 pro max', 'iphone 12', 'iphone 12 mini',
    'iphone 12 pro', 'iphone 12 pro max', 'iphone 13',
    'iphone 13 mini', 'iphone 13 pro', 'iphone 13 pro max',
    'iphone 14', 'iphone 14 plus', 'iphone 14 pro',
    'iphone 14 pro max', 'iphone 15', 'iphone 15 plus',
    'iphone 15 pro', 'iphone 15 pro max', 'iphone 16',
    'iphone 16 plus', 'iphone 16 pro', 'iphone 16 pro max'
  ]

  // Android 刘海屏判断（状态栏高度 > 20px 通常表示有刘海或水滴）
  const hasLargeStatusBar = (systemInfo.statusBarHeight || 0) > 20

  return notchIPhones.some(m => model.includes(m)) || hasLargeStatusBar
}

export default {
  getSystemInfo,
  getStatusBarHeight,
  getScreenWidth,
  getSystemString,
  getDeviceModel,
  getPlatform,
  getNavBarInfo,
  isNotchScreen
}
