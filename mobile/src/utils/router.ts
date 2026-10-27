/**
 * 路由导航工具
 * 统一管理页面跳转，支持动画、预加载、参数传递
 */
import { transitionManager, TransitionPresets, TransitionType, getTransitionForPage } from './transition'
import { createAuthGuard, isRequireLoginPath } from './auth'

export interface RouterOptions {
  // 页面路径
  url: string
  // 过渡类型（自动推断或手动指定）
  transition?: TransitionType
  // 过渡时长
  duration?: number
  // 路由参数
  params?: Record<string, any>
  // 是否预加载
  preload?: boolean
  // 跳转前的回调
  beforeNavigate?: () => boolean | Promise<boolean>
  // 跳转后的回调
  afterNavigate?: () => void
  // 加载提示文字
  loadingText?: string
  // 是否显示加载提示
  showLoading?: boolean
  // 错误处理
  onError?: (error: any) => void
}

/**
 * 路由导航类
 */
class Router {
  /**
   * 页面跳转
   */
  async to(options: RouterOptions): Promise<any> {
    const {
      url,
      transition,
      duration,
      params,
      preload,
      beforeNavigate,
      afterNavigate,
      loadingText = '加载中...',
      showLoading = false,
      onError
    } = options

    try {
      // 自动检查需要登录的页面
      if (isRequireLoginPath(url) && !beforeNavigate) {
        const authGuard = createAuthGuard({
          showTip: true,
          tipText: '请先登录后再访问'
        })
        const canNavigate = authGuard()
        if (!canNavigate) {
          return null
        }
      }

      // 执行跳转前钩子
      if (beforeNavigate) {
        const canNavigate = await beforeNavigate()
        if (canNavigate === false) {
          return null
        }
      }

      // 显示加载提示
      if (showLoading) {
        uni.showLoading({
          title: loadingText,
          mask: true
        })
      }

      // 获取过渡配置
      let transitionType = transition
      if (!transitionType) {
        const preset = getTransitionForPage(url)
        transitionType = TransitionPresets[preset].type
      }
      let transitionDuration = duration
      if (!transitionDuration) {
        const preset = getTransitionForPage(url)
        transitionDuration = TransitionPresets[preset].duration
      }

      // 预加载页面
      if (preload) {
        transitionManager.preloadPage(url)
      }

      // 执行跳转
      const result = await transitionManager.navigateTo(
        url,
        transitionType,
        transitionDuration,
        params
      )

      // 隐藏加载提示
      if (showLoading) {
        uni.hideLoading()
      }

      // 执行跳转后钩子
      if (afterNavigate) {
        afterNavigate()
      }

      return result
    } catch (error) {
      // 隐藏加载提示
      if (showLoading) {
        uni.hideLoading()
      }

      // 错误处理
      if (onError) {
        onError(error)
      } else {
        console.error('[Router] 导航失败:', error)
        uni.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }

      throw error
    }
  }

  /**
   * 返回上一页
   */
  async back(
    delta = 1,
    beforeBack?: () => boolean | Promise<boolean>
  ): Promise<any> {
    try {
      // 执行返回前钩子
      if (beforeBack) {
        const canBack = await beforeBack()
        if (canBack === false) {
          return null
        }
      }

      return await transitionManager.navigateBack(delta)
    } catch (error) {
      console.error('[Router] 返回失败:', error)
      uni.showToast({
        title: '返回失败',
        icon: 'none'
      })
      throw error
    }
  }

  /**
   * 返回首页
   */
  async home(): Promise<any> {
    return this.to({
      url: '/pages/index/index',
      transition: TransitionType.FADE_IN,
      duration: 200
    })
  }

  /**
   * 返回并刷新
   */
  async backAndRefresh(delta = 1): Promise<any> {
    const pages = getCurrentPages()
    if (pages.length > delta) {
      const prevPage = pages[pages.length - 1 - delta] as any
      // 触发上一页的刷新方法
      if (prevPage && prevPage.$vm && prevPage.$vm.onRefresh) {
        prevPage.$vm.onRefresh()
      }
    }
    return this.back(delta)
  }

  /**
   * 返回并传递数据
   */
  async backWithData(delta = 1, data: Record<string, any>): Promise<any> {
    const pages = getCurrentPages()
    if (pages.length > delta) {
      const prevPage = pages[pages.length - 1 - delta] as any
      // 传递数据到上一页
      if (prevPage && prevPage.$vm) {
        prevPage.$vm.onBackData?.(data)
        // 也可以直接赋值
        Object.assign(prevPage.$vm, data)
      }
    }
    return this.back(delta)
  }

  /**
   * Tab 切换
   */
  async switchTab(url: string): Promise<any> {
    try {
      return await transitionManager.switchTab(url)
    } catch (error) {
      console.error('[Router] Tab切换失败:', error)
      throw error
    }
  }

  /**
   * 重定向
   */
  async redirect(
    url: string,
    params?: Record<string, any>
  ): Promise<any> {
    try {
      return await transitionManager.redirectTo(url, TransitionType.FADE_IN, 200, params)
    } catch (error) {
      console.error('[Router] 重定向失败:', error)
      throw error
    }
  }

  /**
   * 重新启动
   */
  async reLaunch(
    url: string,
    params?: Record<string, any>
  ): Promise<any> {
    try {
      return await transitionManager.reLaunch(url, params)
    } catch (error) {
      console.error('[Router] 重启失败:', error)
      throw error
    }
  }

  /**
   * 检查页面是否在栈中
   */
  isPageInStack(pagePath: string): boolean {
    const pages = getCurrentPages()
    return pages.some(page => page.route?.includes(pagePath))
  }

  /**
   * 获取当前页面路径
   */
  getCurrentPagePath(): string {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    return currentPage?.route || ''
  }

  /**
   * 获取页面参数
   */
  getPageParams<T = any>(): T {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    return currentPage?.options as any || {}
  }
}

export const router = new Router()

/**
 * 快捷导航方法
 * 默认为需要登录的页面添加登录验证
 */
export const navigate = {
  // 创建需要登录验证的导航方法
  _createAuthNavigate: (url: string, extraOptions: Partial<RouterOptions> = {}) =>
    router.to({
      url,
      ...extraOptions
    }),
  // 详情页
  toDetail: (id: string, type = 'product') =>
    router.to({
      url: `/pages/${type}/detail`,
      params: { id },
      preload: true
    }),

  // 聊天页
  toChat: (conversationId: string, userId?: string) =>
    router.to({
      url: '/pages/message/chat',
      params: { conversationId, userId },
      preload: true
    }),

  // 用户主页
  toUserHome: (userId: string) =>
    router.to({
      url: '/pages/user/home',
      params: { userId }
    }),

  // 发布页
  toPublish: (type = 'product') =>
    router.to({
      url: `/pages/${type}/publish`,
      transition: TransitionType.SLIDE_IN_BOTTOM
    }),

  // 编辑页
  toEdit: (id: string, type = 'product') =>
    router.to({
      url: `/pages/${type}/edit`,
      params: { id },
      transition: TransitionType.SLIDE_IN_BOTTOM
    }),

  // 订单页
  toOrder: (orderId?: string) =>
    router.to({
      url: orderId ? '/pages/order/detail' : '/pages/order/list',
      params: orderId ? { orderId } : undefined
    }),

  // 登录页
  toLogin: () =>
    router.redirect('/pages/login/index'),

  // 我的页面各子页面（自动添加登录验证）
  toProfile: () =>
    router.to({
      url: '/pages/mine/profile',
      transition: TransitionType.ZOOM_FADE_IN
    }),

  toSettings: () =>
    router.to({
      url: '/pages/mine/settings',
      transition: TransitionType.FADE_IN,
      duration: 200
    }),

  toProducts: () =>
    router.to({
      url: '/pages/mine/products',
      transition: TransitionType.POP_IN,
      duration: 300
    }),

  toFavorites: () =>
    router.to({
      url: '/pages/mine/favorites'
    }),

  toHistory: () =>
    router.to({
      url: '/pages/mine/history'
    }),

  toEvaluations: () =>
    router.to({
      url: '/pages/mine/evaluations'
    }),

  toVerification: () =>
    router.to({
      url: '/pages/mine/verification'
    }),

  toFeedback: () =>
    router.to({
      url: '/pages/mine/feedback',
      transition: TransitionType.SLIDE_IN_BOTTOM
    }),

  toAbout: () =>
    router.to({
      url: '/pages/mine/about'
    }),

  toBlacklist: () =>
    router.to({
      url: '/pages/mine/blacklist'
    }),

  toAddress: () =>
    router.to({
      url: '/pages/mine/address'
    }),

  toSecurity: () =>
    router.to({
      url: '/pages/mine/security'
    }),

  toRefund: () =>
    router.to({
      url: '/pages/mine/refund'
    }),

  toCoupons: () =>
    router.to({
      url: '/pages/mine/coupons'
    }),

  toServices: () =>
    router.to({
      url: '/pages/mine/services',
      transition: TransitionType.SLIDE_IN_BOTTOM,
      duration: 350
    }),

  toNotifications: () => {
    // 设置全局标志，告诉消息页面需要切换到通知 Tab
    ;(getApp() as any).globalData = (getApp() as any).globalData || {}
    ;(getApp() as any).globalData.switchToNoticeTab = true
    // 切换到消息页面
    return router.switchTab('/pages/message/index')
  }
}
