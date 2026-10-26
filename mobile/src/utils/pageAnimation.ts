/**
 * 页面动画配置工具
 * 提供统一的页面切换动画配置和预设
 */

export type PageAnimationType =
  | 'slide-in-right'      // 从右侧滑入（默认）
  | 'slide-in-left'       // 从左侧滑入
  | 'slide-in-top'        // 从顶部滑入
  | 'slide-in-bottom'     // 从底部滑入
  | 'fade-in'             // 淡入
  | 'zoom-in'             // 缩放进入
  // | 'zoom-fade-in'      // 缩放淡入 (不支持，已移除)
  | 'pop-in'              // 弹出进入
  | 'slide-out-right'     // 向右侧滑出
  | 'slide-out-left'      // 向左侧滑出
  | 'slide-out-top'       // 向顶部滑出
  | 'slide-out-bottom'    // 向底部滑出
  | 'fade-out'            // 淡出
  | 'zoom-out'            // 缩放退出

export type PageAnimationPreset =
  | 'default'             // 默认：右滑入
  | 'push'                // 推入：右滑入
  | 'modal'               // 模态框：底部滑入
  | 'popup'               // 弹出：缩放淡入
  | 'fade'                // 淡入淡出
  | 'slide'               // 滑动
  | 'none'                // 无动画

export interface PageAnimationConfig {
  type: PageAnimationType
  duration: number        // 动画持续时间（毫秒）
  timingFunction?: string // 缓动函数
  delay?: number          // 延迟时间（毫秒）
}

/**
 * 页面动画预设配置
 */
export const PageAnimationPresets: Record<PageAnimationPreset, PageAnimationConfig> = {
  // 默认动画 - 从右侧滑入，适合大多数页面
  default: {
    type: 'slide-in-right',
    duration: 300,
    timingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)' // Material Design 标准
  },

  // 推入动画 - 类似 iOS 导航，有视差效果
  push: {
    type: 'slide-in-right',
    duration: 350,
    timingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' // iOS 风格
  },

  // 模态框动画 - 从底部滑入，适合表单、详情页
  modal: {
    type: 'slide-in-bottom',
    duration: 350,
    timingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
  },

  // 弹出动画 - 弹出效果，适合对话框、弹窗
  popup: {
    type: 'pop-in',
    duration: 250,
    timingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // 带弹性
  },

  // 淡入淡出 - 最简单，适合辅助页面
  fade: {
    type: 'fade-in',
    duration: 200,
    timingFunction: 'ease-out'
  },

  // 滑动动画 - 更快的滑动
  slide: {
    type: 'slide-in-right',
    duration: 280,
    timingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // 更快速的缓动
  },

  // 无动画
  none: {
    type: 'fade-in',
    duration: 0
  }
}

/**
 * 页面路径到动画预设的映射
 * 根据页面类型自动选择合适的动画效果
 */
export const PageAnimationMap: Record<string, PageAnimationPreset> = {
  // Tab 页面 - 无动画或淡入
  'pages/index/index': 'fade',
  'pages/market/list': 'fade',
  'pages/share/index': 'fade',
  'pages/message/index': 'fade',
  'pages/mine/index': 'fade',

  // 详情类页面 - 推入动画
  'pages/market/detail': 'push',
  'pages/share/detail': 'push',
  'pages/user/home': 'push',
  'pages/user/following': 'push',
  'pages/user/followers': 'push',
  'pages/order/detail': 'push',

  // 编辑/发布类页面 - 模态框动画
  'pages/market/publish': 'modal',
  'pages/market/edit': 'modal',
  'pages/share/publish': 'modal',
  'pages/order/create': 'modal',
  'pages/order/evaluate': 'modal',
  'pages/mine/feedback': 'modal',
  'pages/mine/verification': 'modal',

  // 设置类页面 - 淡入动画
  'pages/mine/settings': 'fade',
  'pages/mine/security': 'fade',
  'pages/mine/theme-settings': 'fade',
  'pages/mine/about': 'fade',

  // 列表类页面 - 推入动画
  'pages/mine/products': 'push',
  'pages/mine/favorites': 'push',
  'pages/mine/history': 'push',
  'pages/mine/evaluations': 'push',
  'pages/mine/address': 'push',
  'pages/mine/blacklist': 'push',
  'pages/order/list': 'push',

  // 弹窗类页面 - 弹出动画
  'pages/message/quick-reply': 'popup',
  'pages/mine/coupons': 'popup',

  // 用户信息 - 缩放动画
  'pages/mine/profile': 'popup',
  'pages/mine/services': 'popup',

  // 退款/售后 - 推入动画
  'pages/order/refund': 'push',
  'pages/mine/refund': 'push',
  'pages/share/bookings': 'push',
  'pages/share/deposit': 'push',
  'pages/share/transfer': 'push'
}

/**
 * 获取页面动画配置
 * @param pagePath 页面路径
 * @param preset 动画预设（可选）
 * @returns 页面动画配置
 */
export function getPageAnimation(pagePath: string, preset?: PageAnimationPreset): PageAnimationConfig {
  // 如果指定了预设，直接使用
  if (preset && PageAnimationPresets[preset]) {
    return PageAnimationPresets[preset]
  }

  // 从映射表中查找
  const mappedPreset = PageAnimationMap[pagePath]
  if (mappedPreset) {
    return PageAnimationPresets[mappedPreset]
  }

  // 默认使用 push 动画
  return PageAnimationPresets.default
}

/**
 * 生成 pages.json 的动画配置
 * @param pagePath 页面路径
 * @param preset 动画预设
 * @returns pages.json style 配置对象
 */
export function generatePageAnimationStyle(pagePath: string, preset?: PageAnimationPreset) {
  const config = getPageAnimation(pagePath, preset)

  return {
    animationType: config.type,
    animationDuration: config.duration
  }
}

/**
 * 自定义动画配置创建器
 * @param type 动画类型
 * @param duration 持续时间
 * @param timingFunction 缓动函数
 * @returns 动画配置
 */
export function createCustomAnimation(
  type: PageAnimationType,
  duration: number = 300,
  timingFunction: string = 'ease-out'
): PageAnimationConfig {
  return {
    type,
    duration,
    timingFunction
  }
}

/**
 * 常用缓动函数预设
 */
export const EasingPresets = {
  // 线性
  linear: 'linear',

  // 基础
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Material Design
  material: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  materialDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  materialAccelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',

  // iOS
  ios: 'cubic-bezier(0.32, 0.72, 0, 1)',

  // 弹性
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // 快速
  swift: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',

  // 平滑
  smooth: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
}

/**
 * 根据页面层级计算动画
 * 深层级页面使用更快的动画
 */
export function getAnimationByLevel(level: number): PageAnimationConfig {
  const duration = Math.max(200, 350 - level * 30)
  return {
    type: 'slide-in-right',
    duration,
    timingFunction: level > 2 ? EasingPresets.swift : EasingPresets.material
  }
}
