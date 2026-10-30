/**
 * 页面过渡动画配置
 */
export interface TransitionConfig {
  animationType?: string
  animationDuration?: number
  animationIterationCount?: string
  timingFunction?: string
}

export enum TransitionType {
  // 基础过渡
  SLIDE_IN_RIGHT = 'slide-in-right',
  SLIDE_IN_LEFT = 'slide-in-left',
  SLIDE_IN_TOP = 'slide-in-top',
  SLIDE_IN_BOTTOM = 'slide-in-bottom',
  POP_IN = 'pop-in',
  FADE_IN = 'fade-in',

  // 高级过渡 (修正后的值)
  ZOOM_FADE_IN = 'fade-in',
  SLIDE_ZOOM_IN = 'slide-in-right',
  FLIP_X = 'fade-in',
  FLIP_Y = 'fade-in',

  // 特殊效果
  NONE = 'none'
}

/**
 * uni.navigateTo 接受的 animationType 字面量联合（进入动画）。
 *
 * 库的声明用的是字符串字面量联合而非枚举，直接把 TransitionType 传过去
 * 会因「枚举类型不等同于字面量联合」而报错，因此在此显式对齐。
 */
type NavigateToAnimationType =
  | 'auto' | 'none'
  | 'slide-in-right' | 'slide-in-left' | 'slide-in-top' | 'slide-in-bottom'
  | 'fade-in' | 'zoom-out' | 'zoom-fade-out' | 'pop-in'

/** uni.navigateBack 接受的 animationType 字面量联合（退出动画，取值不同）。 */
type NavigateBackAnimationType =
  | 'auto' | 'none'
  | 'slide-out-right' | 'slide-out-left' | 'slide-out-top' | 'slide-out-bottom'
  | 'fade-out' | 'zoom-in' | 'zoom-fade-in' | 'pop-out'

/**
 * 页面过渡管理器
 */
class TransitionManager {
  private defaultDuration = 300

  /**
   * 获取页面过渡配置
   */
  getConfig(type: TransitionType, duration?: number): TransitionConfig {
    return {
      animationType: type,
      animationDuration: duration || this.defaultDuration
    }
  }

  /**
   * 导航到指定页面（带动画配置）
   */
  navigateTo(
    url: string,
    transitionType: TransitionType = TransitionType.SLIDE_IN_RIGHT,
    duration?: number,
    params?: Record<string, any>
  ) {
    // 拼接参数
    let finalUrl = url
    if (params) {
      const query = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
        .join('&')
      finalUrl += (url.includes('?') ? '&' : '?') + query
    }

    return uni.navigateTo({
      url: finalUrl,
      animationType: transitionType as unknown as NavigateToAnimationType,
      animationDuration: duration || this.defaultDuration
    })
  }

  /**
   * 返回上一页（带动画）
   */
  navigateBack(
    delta = 1,
    transitionType: TransitionType = TransitionType.SLIDE_IN_LEFT,
    duration?: number
  ) {
    return uni.navigateBack({
      delta,
      animationType: transitionType as unknown as NavigateBackAnimationType,
      animationDuration: duration || this.defaultDuration
    })
  }

  /**
   * 切换到 TabBar 页面（带动画）
   */
  switchTab(
    url: string,
    transitionType: TransitionType = TransitionType.FADE_IN,
    duration?: number
  ) {
    // switchTab 不支持 animationType，但我们可以预加载和添加过渡效果
    return uni.switchTab({
      url
    })
  }

  /**
   * 重定向到指定页面（带动画）
   */
  redirectTo(
    url: string,
    transitionType: TransitionType = TransitionType.FADE_IN,
    duration?: number,
    params?: Record<string, any>
  ) {
    let finalUrl = url
    if (params) {
      const query = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
        .join('&')
      finalUrl += (url.includes('?') ? '&' : '?') + query
    }

    return uni.redirectTo({
      url: finalUrl
    })
  }

  /**
   * 关闭所有页面并跳转（带动画）
   */
  reLaunch(
    url: string,
    params?: Record<string, any>
  ) {
    let finalUrl = url
    if (params) {
      const query = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
        .join('&')
      finalUrl += (url.includes('?') ? '&' : '?') + query
    }

    return uni.reLaunch({
      url: finalUrl
    })
  }

  /**
   * 预加载页面
   */
  preloadPage(url: string): void {
    uni.preloadPage({
      url
    })
  }
}

export const transitionManager = new TransitionManager()

/**
 * 页面过渡动画预设
 */
export const TransitionPresets = {
  // 详情页进入 - 从右侧滑入
  detail: {
    type: TransitionType.SLIDE_IN_RIGHT,
    duration: 350
  },

  // 模态框 - 淡入并放大
  modal: {
    type: TransitionType.POP_IN,
    duration: 250
  },

  // 表单页 - 从底部滑入
  form: {
    type: TransitionType.SLIDE_IN_BOTTOM,
    duration: 300
  },

  // 返回 - 从左侧滑入
  back: {
    type: TransitionType.SLIDE_IN_LEFT,
    duration: 250
  },

  // 设置页 - 淡入
  settings: {
    type: TransitionType.FADE_IN,
    duration: 200
  },

  // 个人中心 - 淡入
  profile: {
    type: TransitionType.FADE_IN,
    duration: 300
  },

  // 默认 - 右侧滑入
  default: {
    type: TransitionType.SLIDE_IN_RIGHT,
    duration: 300
  }
}

/**
 * 根据页面类型获取过渡配置
 */
export function getTransitionForPage(pagePath: string): keyof typeof TransitionPresets {
  const detailPages = ['detail', 'chat', 'evaluate']
  const formPages = ['publish', 'edit', 'create', 'feedback', 'report']
  const modalPages = ['quick-reply', 'map']
  const settingsPages = ['settings', 'security', 'theme-settings']
  const profilePages = ['profile', 'user/home']

  if (detailPages.some(p => pagePath.includes(p))) return 'detail'
  if (formPages.some(p => pagePath.includes(p))) return 'form'
  if (modalPages.some(p => pagePath.includes(p))) return 'modal'
  if (settingsPages.some(p => pagePath.includes(p))) return 'settings'
  if (profilePages.some(p => pagePath.includes(p))) return 'profile'

  return 'default'
}
