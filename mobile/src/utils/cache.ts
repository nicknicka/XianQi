/**
 * 请求缓存工具类
 * 用于缓存API请求结果，减少网络请求，提升性能
 */
import { normalizeId } from './id'

interface CacheItem<T> {
  data: T
  time: number
  ttl: number
}

class RequestCache {
  private cache = new Map<string, CacheItem<any>>()
  private timers = new Map<string, number>()

  /**
   * 获取缓存数据
   * @param key 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回 null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.time > item.ttl) {
      // 缓存已过期
      this.remove(key)
      return null
    }

    return item.data as T
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param data 要缓存的数据
   * @param ttl 缓存过期时间（毫秒），默认5分钟
   */
  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // 清除之前的定时器
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 存储缓存数据
    this.cache.set(key, {
      data,
      time: Date.now(),
      ttl
    })

    // 设置过期清理定时器
    const timer = setTimeout(() => {
      this.remove(key)
    }, ttl)
    this.timers.set(key, timer)
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  remove(key: string): void {
    this.cache.delete(key)
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   * @returns 是否有效
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 带缓存的请求封装
   * @param key 缓存键
   * @param request 请求数据的函数
   * @param ttl 缓存过期时间（毫秒）
   * @returns Promise<T>
   */
  async request<T>(
    key: string,
    request: () => Promise<T>,
    ttl = 5 * 60 * 1000
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // 缓存未命中，执行请求
    const data = await request()
    this.set(key, data, ttl)
    return data
  }
}

// 创建单例实例
export const requestCache = new RequestCache()

/**
 * 缓存键常量
 */
export const CacheKeys = {
  // 分类相关
  CATEGORIES: 'cache:categories',
  CATEGORY_DETAIL: (id: string) => `cache:category:${normalizeId(id)}`,

  // 商品相关
  PRODUCT_DETAIL: (id: string) => `cache:product:${normalizeId(id)}`,
  PRODUCT_LIST: (params: any) => `cache:products:${JSON.stringify(params)}`,

  // 用户相关
  USER_INFO: (id: string) => `cache:user:${normalizeId(id)}`,
  USER_CREDIT: (id: string) => `cache:user:${normalizeId(id)}:credit`,

  // 系统配置
  SYSTEM_CONFIG: 'cache:system:config',
  SYSTEM_CONFIG_BY_KEY: (key: string) => `cache:system:config:${key}`,

  // 轮播图
  BANNERS: 'cache:banners',

  // 热门搜索
  HOT_SEARCH: 'cache:hot:search',

  // 消息未读数
  UNREAD_COUNT: (userId: string) => `cache:user:${normalizeId(userId)}:unread`
}

/**
 * 缓存过期时间常量（毫秒）
 */
export const CacheTTL = {
  SHORT: 2 * 60 * 1000, // 2分钟
  MEDIUM: 5 * 60 * 1000, // 5分钟
  LONG: 15 * 60 * 1000, // 15分钟
  HOUR: 60 * 60 * 1000, // 1小时
  DAY: 24 * 60 * 60 * 1000 // 1天
}
