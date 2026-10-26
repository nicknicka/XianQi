/**
 * 分享功能工具类
 * 支持商品、用户等内容分享到各平台
 */

import type { Product, User } from '@/types'
import { analytics, trackProduct, EventType } from './analytics'

/**
 * 分享类型
 */
export enum ShareType {
  PRODUCT = 'product', // 商品
  USER = 'user', // 用户
  POST = 'post', // 帖子
  INVITE = 'invite' // 邀请
}

/**
 * 分享平台
 */
export enum SharePlatform {
  WECHAT = 'wechat', // 微信好友
  WECHAT_MOMENT = 'wechat_moment', // 微信朋友圈
  QQ = 'qq', // QQ
  QQ_ZONE = 'qq_zone', // QQ空间
  LINK = 'link', // 复制链接
  IMAGE = 'image', // 生成图片
  MORE = 'more' // 更多
}

/**
 * 分享配置接口
 */
export interface ShareConfig {
  title: string
  desc: string
  path: string
  imageUrl: string
  type: ShareType
  data?: any
}

/**
 * 分享结果
 */
export interface ShareResult {
  success: boolean
  platform: SharePlatform
  errMsg?: string
}

/**
 * 分享功能管理类
 */
class ShareManager {
  /**
   * 分享商品
   * @param product 商品信息
   */
  shareProduct(product: Product): Promise<ShareResult> {
    const config: ShareConfig = {
      title: product.title,
      desc: `¥${product.price} - ${product.condition}`,
      path: `/pages/market/detail?id=${product.id}`,
      imageUrl: product.coverImage,
      type: ShareType.PRODUCT,
      data: {
        productId: product.id,
        productName: product.title,
        price: product.price
      }
    }
    return this.share(config)
  }

  /**
   * 分享用户主页
   * @param user 用户信息
   */
  shareUser(user: User): Promise<ShareResult> {
    const config: ShareConfig = {
      title: `${user.nickname}的主页`,
      desc: `信用等级：${user.creditLevel} | ${user.productCount || 0}件商品`,
      path: `/pages/user/index?id=${user.id}`,
      imageUrl: user.avatar,
      type: ShareType.USER
    }
    return this.share(config)
  }

  /**
   * 通用分享方法
   * @param config 分享配置
   */
  async share(config: ShareConfig): Promise<ShareResult> {
    // #ifdef MP-WEIXIN
    // 微信小程序环境：直接显示分享面板
    return this.shareInMiniProgram(config)
    // #endif

    // #ifdef H5 || APP-PLUS
    // H5或App环境：使用uni.share API
    return this.shareInAppOrH5(config)
    // #endif

    // 其他环境：显示自定义分享面板
    return new Promise((resolve) => {
      this.showSharePanel(config, resolve)
    })
  }

  /**
   * 微信小程序环境分享
   * @param config 分享配置
   */
  private async shareInMiniProgram(config: ShareConfig): Promise<ShareResult> {
    return new Promise((resolve) => {
      uni.showShareMenu({
        withShareTicket: true,
        success: () => {
          uni.showToast({
            title: '请使用右上角分享',
            icon: 'none'
          })
          resolve({ success: true, platform: SharePlatform.MORE })
        },
        fail: (err: any) => {
          resolve({ success: false, platform: SharePlatform.MORE, errMsg: err?.errMsg })
        }
      })
    })
  }

  /**
   * H5或App环境分享
   * @param config 分享配置
   */
  private async shareInAppOrH5(config: ShareConfig): Promise<ShareResult> {
    return new Promise((resolve) => {
      // 尝试使用系统分享
      uni.share({
        provider: 'weixin',
        type: 0, // 图文
        title: config.title,
        summary: config.desc,
        href: this.getFullUrl(config.path),
        imageUrl: config.imageUrl,
        success: () => {
          this.trackShare(SharePlatform.WECHAT, config)
          resolve({ success: true, platform: SharePlatform.WECHAT })
        },
        fail: (err: any) => {
          console.warn('系统分享失败，显示自定义面板:', err)
          // 系统分享失败，显示自定义面板
          this.showSharePanel(config, resolve)
        }
      })
    })
  }

  /**
   * 获取完整的URL（用于H5）
   * @param path 页面路径
   */
  private getFullUrl(path: string): string {
    // #ifdef H5
    return `${window.location.origin}${path}`
    // #endif
    // #ifdef APP-PLUS
    return `https://your-domain.com${path}`
    // #endif
    return path
  }

  /**
   * 显示分享面板（自定义）
   * @param config 分享配置
   * @param resolve Promise resolve
   */
  private showSharePanel(config: ShareConfig, resolve: (result: ShareResult) => void) {
    const platforms: Array<{ name: string; icon: string; platform: SharePlatform }> = []

    // #ifdef APP-PLUS
    platforms.push(
      { name: '微信好友', icon: '💬', platform: SharePlatform.WECHAT },
      { name: '朋友圈', icon: '⭕', platform: SharePlatform.WECHAT_MOMENT }
    )
    // #endif

    platforms.push({ name: '复制链接', icon: '🔗', platform: SharePlatform.LINK })

    uni.showActionSheet({
      itemList: platforms.map(p => p.name),
      success: (res: any) => {
        const index = res.tapIndex
        const platform = platforms[index]
        this.handlePlatformShare(platform, config, resolve)
      },
      fail: () => {
        resolve({ success: false, platform: SharePlatform.MORE })
      }
    })
  }

  /**
   * 处理不同平台的分享
   * @param platform 分享平台
   * @param config 分享配置
   * @param resolve Promise resolve
   */
  private handlePlatformShare(
    platform: { name: string; icon: string; platform: SharePlatform },
    config: ShareConfig,
    resolve: (result: ShareResult) => void
  ) {
    switch (platform.platform) {
      case SharePlatform.LINK:
        this.copyLink(config.path, resolve)
        break
      case SharePlatform.IMAGE:
        this.generateShareImage(config, resolve)
        break
      default:
        // 其他平台分享
        this.shareToPlatform(platform.platform, config, resolve)
    }
  }

  /**
   * 复制链接
   * @param path 页面路径
   * @param resolve Promise resolve
   */
  private copyLink(path: string, resolve: (result: ShareResult) => void) {
    const baseUrl = this.getBaseUrl()
    const fullUrl = `${baseUrl}${path}`

    uni.setClipboardData({
      data: fullUrl,
      success: () => {
        uni.showToast({
          title: '链接已复制',
          icon: 'success'
        })
        this.trackShare(SharePlatform.LINK, { path })
        resolve({ success: true, platform: SharePlatform.LINK })
      },
      fail: () => {
        uni.showToast({
          title: '复制失败',
          icon: 'none'
        })
        resolve({ success: false, platform: SharePlatform.LINK })
      }
    })
  }

  /**
   * 生成分享图片
   * @param config 分享配置
   * @param resolve Promise resolve
   */
  private async generateShareImage(config: ShareConfig, resolve: (result: ShareResult) => void) {
    try {
      uni.showToast({
        title: '当前环境不支持海报，已复制链接',
        icon: 'none'
      })
      this.copyLink(config.path, resolve)
    } catch (error) {
      console.error('生成分享图片失败:', error)
      resolve({ success: false, platform: SharePlatform.IMAGE })
    }
  }

  /**
   * 分享到指定平台
   * @param platform 分享平台
   * @param config 分享配置
   * @param resolve Promise resolve
   */
  private shareToPlatform(
    platform: SharePlatform,
    config: ShareConfig,
    resolve: (result: ShareResult) => void
  ) {
    // 根据平台进行分享
    switch (platform) {
      case SharePlatform.WECHAT:
        // 微信分享
        this.shareToWeChat(config, resolve)
        break
      case SharePlatform.WECHAT_MOMENT:
        // 微信朋友圈分享
        this.shareToWeChatMoment(config, resolve)
        break
      default:
        resolve({ success: false, platform })
    }
  }

  /**
   * 分享到微信
   * @param config 分享配置
   * @param resolve Promise resolve
   */
  private shareToWeChat(config: ShareConfig, resolve: (result: ShareResult) => void) {
    // #ifdef MP-WEIXIN
    // 微信小程序环境
    // TODO: 实现微信小程序分享
    resolve({ success: false, platform: SharePlatform.WECHAT })
    // #endif

    // #ifdef H5 || APP-PLUS
    // H5或App环境
    uni.share({
      provider: 'weixin',
      type: 0, // 图文
      title: config.title,
      summary: config.desc,
      href: config.path,
      imageUrl: config.imageUrl,
      success: () => {
        this.trackShare(SharePlatform.WECHAT, config)
        resolve({ success: true, platform: SharePlatform.WECHAT })
      },
      fail: (err: any) => {
        console.error('微信分享失败:', err)
        resolve({ success: false, platform: SharePlatform.WECHAT, errMsg: err.errMsg })
      }
    })
    // #endif
  }

  /**
   * 分享到微信朋友圈
   * @param config 分享配置
   * @param resolve Promise resolve
   */
  private shareToWeChatMoment(config: ShareConfig, resolve: (result: ShareResult) => void) {
    // #ifdef MP-WEIXIN
    // 微信小程序环境
    // TODO: 实现微信朋友圈分享
    uni.showToast({
      title: '请截图分享到朋友圈',
      icon: 'none'
    })
    resolve({ success: false, platform: SharePlatform.WECHAT_MOMENT })
    // #endif

    // #ifdef H5 || APP-PLUS
    // H5或App环境
    uni.share({
      provider: 'weixin',
      type: 0, // 图文
      scene: 'WXSceneTimeline',
      title: config.title,
      summary: config.desc,
      href: config.path,
      imageUrl: config.imageUrl,
      success: () => {
        this.trackShare(SharePlatform.WECHAT_MOMENT, config)
        resolve({ success: true, platform: SharePlatform.WECHAT_MOMENT })
      },
      fail: (err: any) => {
        console.error('微信朋友圈分享失败:', err)
        resolve({ success: false, platform: SharePlatform.WECHAT_MOMENT, errMsg: err.errMsg })
      }
    })
    // #endif
  }

  /**
   * 获取基础URL
   */
  private getBaseUrl(): string {
    // #ifdef H5
    return window.location.origin
    // #endif
    // #ifdef MP-WEIXIN
    // 微信小程序返回空字符串
    return ''
    // #endif
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    return baseUrl.replace(/\/api\/?$/, '')
  }

  /**
   * 追踪分享行为
   * @param platform 分享平台
   * @param config 分享配置
   */
  private trackShare(platform: SharePlatform, config: ShareConfig | { path: string }) {
    // 集成数据埋点
    if ('trackProduct' in config) {
      // 商品分享
      trackProduct.share((config as any).data?.productId, platform)
    } else {
      // 通用分享追踪 - 使用按钮点击事件类型
      analytics.track(EventType.BUTTON_CLICK, '分享操作', {
        platform,
        type: (config as any).type || 'unknown'
      })
    }
  }
}

// 创建单例实例
export const shareManager = new ShareManager()

/**
 * 分享辅助函数
 */
export const share = {
  product: (product: Product) => shareManager.shareProduct(product),

  user: (user: User) => shareManager.shareUser(user),

  custom: (config: ShareConfig) => shareManager.share(config)
}
