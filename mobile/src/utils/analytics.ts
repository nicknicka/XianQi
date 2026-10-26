/**
 * 数据埋点工具类
 * 用于收集用户行为数据和页面访问统计
 */
import { getSystemString } from './system-info'
import type { IdLike } from './id'
import { normalizeId } from './id'

/**
 * 事件类型枚举
 */
export enum EventType {
  // 页面相关
  PAGE_VIEW = 'page_view', // 页面浏览
  PAGE_DURATION = 'page_duration', // 页面停留时长
  PAGE_LEAVE = 'page_leave', // 离开页面

  // 商品相关
  PRODUCT_VIEW = 'product_view', // 商品浏览
  PRODUCT_FAVORITE = 'product_favorite', // 商品收藏
  PRODUCT_UNFAVORITE = 'product_unfavorite', // 取消收藏
  PRODUCT_SHARE = 'product_share', // 商品分享
  PRODUCT_SEARCH = 'product_search', // 商品搜索
  PRODUCT_FILTER = 'product_filter', // 商品筛选

  // 订单相关
  ORDER_CREATE = 'order_create', // 创建订单
  ORDER_CANCEL = 'order_cancel', // 取消订单
  ORDER_COMPLETE = 'order_complete', // 完成订单
  ORDER_REFUND = 'order_refund', // 退款

  // 用户相关
  USER_LOGIN = 'user_login', // 用户登录
  USER_LOGOUT = 'user_logout', // 用户登出
  USER_REGISTER = 'user_register', // 用户注册
  USER_PROFILE_VIEW = 'user_profile_view', // 查看用户主页

  // 聊天相关
  MESSAGE_SEND = 'message_send', // 发送消息
  MESSAGE_IMAGE_SEND = 'message_image_send', // 发送图片消息
  CONVERSATION_CREATE = 'conversation_create', // 创建会话

  // 系统相关
  NOTIFICATION_OPEN = 'notification_open', // 打开通知
  NOTIFICATION_CLICK = 'notification_click', // 点击通知
  ERROR_SHOW = 'error_show', // 错误展示
  BUTTON_CLICK = 'button_click' // 按钮点击
}

/**
 * 埋点数据接口
 */
export interface TrackEventData {
  eventType: EventType
  eventName: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

/**
 * 数据埋点管理类
 */
class Analytics {
  private sessionId: string = ''
  private userId: string | null = null
  private pageStartTime: number = 0
  private currentPage: string = ''

  /**
   * 初始化埋点
   */
  init() {
    // 生成会话ID
    this.sessionId = this.generateSessionId()

    // 获取用户ID
    this.getUserId()

    // 监听页面切换
    this.trackPageChange()
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取用户ID
   */
  private getUserId() {
    try {
      const userInfo = uni.getStorageSync('userInfo')
      this.userId = normalizeId(userInfo?.userId || userInfo?.id) || null
    } catch (e) {
      console.error('获取用户ID失败:', e)
    }
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: IdLike) {
    this.userId = normalizeId(userId) || null
  }

  /**
   * 追踪事件
   * @param eventType 事件类型
   * @param eventName 事件名称
   * @param properties 事件属性
   */
  track(eventType: EventType, eventName: string, properties: Record<string, any> = {}) {
    const eventData: TrackEventData = {
      eventType,
      eventName,
      properties: {
        ...properties,
        page: this.currentPage,
        userAgent: this.getUserAgent(),
        platform: this.getPlatform()
      },
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId
    }

    // 开发环境打印日志
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventData)
    }

    // TODO: 上报到服务器
    this.report(eventData)
  }

  /**
   * 追踪页面浏览
   * @param page 页面路径
   * @param title 页面标题
   */
  trackPageView(page: string, title?: string) {
    // 先记录上一页的停留时长
    if (this.currentPage) {
      const duration = Date.now() - this.pageStartTime
      this.track(EventType.PAGE_DURATION, '页面停留时长', {
        page: this.currentPage,
        duration
      })
    }

    // 记录新页面浏览
    this.currentPage = page
    this.pageStartTime = Date.now()
    this.track(EventType.PAGE_VIEW, '页面浏览', {
      page,
      title
    })
  }

  /**
   * 追踪商品浏览
   * @param productId 商品ID
   * @param productName 商品名称
   * @param categoryId 分类ID
   * @param categoryName 分类名称
   * @param sellerId 卖家ID
   */
  trackProductView(params: {
    productId: IdLike
    productName: string
    categoryId?: number
    categoryName?: string
    sellerId?: IdLike
  }) {
    this.track(EventType.PRODUCT_VIEW, '商品浏览', params)
  }

  /**
   * 追踪商品收藏
   * @param productId 商品ID
   * @param action 操作类型：favorite/unfavorite
   */
  trackProductFavorite(productId: IdLike, action: 'favorite' | 'unfavorite') {
    this.track(
      action === 'favorite' ? EventType.PRODUCT_FAVORITE : EventType.PRODUCT_UNFAVORITE,
      action === 'favorite' ? '商品收藏' : '取消收藏',
      { productId: normalizeId(productId) }
    )
  }

  /**
   * 追踪商品搜索
   * @param keyword 搜索关键词
   * @param resultCount 结果数量
   * @param filters 筛选条件
   */
  trackProductSearch(params: {
    keyword: string
    resultCount?: number
    filters?: Record<string, any>
  }) {
    this.track(EventType.PRODUCT_SEARCH, '商品搜索', params)
  }

  /**
   * 追踪按钮点击
   * @param buttonName 按钮名称
   * @param page 所在页面
   * @param location 按钮位置
   */
  trackButtonClick(buttonName: string, page: string, location?: string) {
    this.track(EventType.BUTTON_CLICK, '按钮点击', {
      buttonName,
      page,
      location
    })
  }

  /**
   * 追踪错误
   * @param error 错误信息
   * @param page 所在页面
   * @param action 操作
   */
  trackError(error: string | Error, page: string, action?: string) {
    const errorMessage = typeof error === 'string' ? error : error.message
    this.track(EventType.ERROR_SHOW, '错误展示', {
      error: errorMessage,
      page,
      action
    })
  }

  /**
   * 监听页面切换
   */
  private trackPageChange() {
    // 页面切换时会自动调用 trackPageView
  }

  /**
   * 获取用户代理信息
   */
  private getUserAgent(): string {
    return getSystemString()
  }

  /**
   * 获取平台信息
   */
  private getPlatform(): string {
    // #ifdef H5
    return 'h5'
    // #endif
    // #ifdef MP-WEIXIN
    return 'mp-weixin'
    // #endif
    // #ifdef MP-ALIPAY
    return 'mp-alipay'
    // #endif
    // #ifdef APP-PLUS
    return 'app-plus'
    // #endif
    return 'unknown'
  }

  /**
   * 上报数据到服务器
   * @paramEventData eventData 埋点数据
   */
  private async report(eventData: TrackEventData) {
    // TODO: 实现实际上报逻辑
    // 示例：调用后端API
    try {
      // await analyticsApi.report(eventData)
    } catch (error) {
      console.error('上报埋点数据失败:', error)
    }
  }
}

// 创建单例实例
export const analytics = new Analytics()

/**
 * 埋点辅助函数
 */

/**
 * 商品相关埋点
 */
export const trackProduct = {
  view: (params: {
    productId: IdLike
    productName: string
    categoryId?: number
    categoryName?: string
    sellerId?: IdLike
  }) => analytics.trackProductView(params),

  favorite: (productId: IdLike) => analytics.trackProductFavorite(productId, 'favorite'),

  unfavorite: (productId: IdLike) => analytics.trackProductFavorite(productId, 'unfavorite'),

  share: (productId: IdLike, platform: string) => {
    analytics.track(EventType.PRODUCT_SHARE, '商品分享', {
      productId: normalizeId(productId),
      platform
    })
  },

  search: (params: {
    keyword: string
    resultCount?: number
    filters?: Record<string, any>
  }) => analytics.trackProductSearch(params)
}

/**
 * 订单相关埋点
 */
export const trackOrder = {
  create: (orderId: IdLike, orderAmount: number) => {
    analytics.track(EventType.ORDER_CREATE, '创建订单', {
      orderId: normalizeId(orderId),
      orderAmount
    })
  },

  cancel: (orderId: IdLike, reason?: string) => {
    analytics.track(EventType.ORDER_CANCEL, '取消订单', {
      orderId: normalizeId(orderId),
      reason
    })
  },

  complete: (orderId: IdLike, orderAmount: number) => {
    analytics.track(EventType.ORDER_COMPLETE, '完成订单', {
      orderId: normalizeId(orderId),
      orderAmount
    })
  }
}

/**
 * 用户相关埋点
 */
export const trackUser = {
  login: (method: 'phone' | 'wechat') => {
    analytics.track(EventType.USER_LOGIN, '用户登录', { method })
  },

  logout: () => {
    analytics.track(EventType.USER_LOGOUT, '用户登出')
    analytics.setUserId('')
  },

  register: () => {
    analytics.track(EventType.USER_REGISTER, '用户注册')
  },

  profileView: (userId: IdLike) => {
    analytics.track(EventType.USER_PROFILE_VIEW, '查看用户主页', { userId: normalizeId(userId) })
  }
}
