/**
 * 热门搜索管理工具
 */

import storage from './storage'
import { searchHistory } from './search-history'

/**
 * 存储键
 */
const HOT_SEARCH_KEY = 'hot_search'
const HOT_SEARCH_STATS_KEY = 'hot_search_stats'
const MAX_HOT_COUNT = 10 // 最多显示10条热门搜索

/**
 * 热门搜索项
 */
export interface HotSearchItem {
  /** 关键词 */
  keyword: string
  /** 搜索次数 */
  count: number
  /** 是否为系统推荐 */
  isSystem?: boolean
  /** 图标类型 */
  iconType?: 'hot' | 'rise' | 'new' | 'none'
  /** 排名 */
  rank?: number
}

/**
 * 热门搜索管理类
 */
class HotSearch {
  /**
   * 获取热门搜索列表
   */
  get(): HotSearchItem[] {
    // 尝试从服务器获取
    const systemHot = this.getSystemHot()
    if (systemHot && systemHot.length > 0) {
      return systemHot
    }

    // 从本地统计获取
    const stats = storage.get<HotSearchItem[]>(HOT_SEARCH_STATS_KEY) || []
    return stats
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_HOT_COUNT)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        iconType: this.getIconType(item.count, index)
      }))
  }

  /**
   * 记录搜索
   * @param keyword 搜索关键词
   */
  record(keyword: string): void {
    if (!keyword || typeof keyword !== 'string') {
      return
    }

    const keywordTrimmed = keyword.trim()
    if (!keywordTrimmed) {
      return
    }

    // 同时添加到搜索历史
    searchHistory.add(keywordTrimmed)

    // 更新统计
    const stats = storage.get<HotSearchItem[]>(HOT_SEARCH_STATS_KEY) || []
    const existing = stats.find(item => item.keyword === keywordTrimmed)

    if (existing) {
      existing.count++
    } else {
      stats.push({
        keyword: keywordTrimmed,
        count: 1,
        isSystem: false
      })
    }

    storage.set(HOT_SEARCH_STATS_KEY, stats)
  }

  /**
   * 批量记录搜索（用于批量操作）
   * @param keywords 搜索关键词数组
   */
  recordBatch(keywords: string[]): void {
    keywords.forEach(keyword => this.record(keyword))
  }

  /**
   * 清空热门搜索统计
   */
  clearStats(): void {
    storage.remove(HOT_SEARCH_STATS_KEY)
  }

  /**
   * 设置系统推荐的热门搜索
   * @param hotList 热门搜索列表
   */
  setSystemHot(hotList: HotSearchItem[]): void {
    storage.set(HOT_SEARCH_KEY, hotList)
  }

  /**
   * 获取系统推荐的热门搜索
   */
  private getSystemHot(): HotSearchItem[] {
    const systemHot = storage.get<HotSearchItem[]>(HOT_SEARCH_KEY)
    if (!systemHot) {
      return []
    }

    // 检查是否过期（24小时）
    const lastUpdate = storage.get<number>(`${HOT_SEARCH_KEY}_time`)
    if (!lastUpdate) {
      return []
    }

    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000
    if (now - lastUpdate > dayInMs) {
      // 过期了，清除
      storage.remove(HOT_SEARCH_KEY)
      storage.remove(`${HOT_SEARCH_KEY}_time`)
      return []
    }

    return systemHot.map((item, index) => ({
      ...item,
      rank: index + 1,
      iconType: this.getIconType(item.count || 0, index)
    }))
  }

  /**
   * 从服务器更新热门搜索
   * @param apiFn 获取热门搜索的API函数
   */
  async fetchFromServer(apiFn: () => Promise<HotSearchItem[]>): Promise<void> {
    try {
      const hotList = await apiFn()
      this.setSystemHot(hotList)
      storage.set(`${HOT_SEARCH_KEY}_time`, Date.now())
    } catch (error) {
      console.error('获取热门搜索失败:', error)
    }
  }

  /**
   * 获取图标类型
   */
  private getIconType(count: number, index: number): 'hot' | 'rise' | 'new' | 'none' {
    // 前三名
    if (index < 3) {
      return 'hot'
    }
    // 搜索次数较多
    if (count >= 10) {
      return 'hot'
    }
    // 搜索次数中等
    if (count >= 5) {
      return 'rise'
    }
    // 搜索次数较少
    if (count >= 2) {
      return 'new'
    }
    return 'none'
  }

  /**
   * 获取热门搜索趋势
   * @param keyword 关键词
   */
  getTrend(keyword: string): 'up' | 'down' | 'stable' | 'none' {
    const stats = storage.get<HotSearchItem[]>(HOT_SEARCH_STATS_KEY) || []
    const item = stats.find(s => s.keyword === keyword)

    if (!item) {
      return 'none'
    }

    // 这里可以实现更复杂的趋势计算
    // 暂时根据搜索次数简单判断
    if (item.count >= 10) {
      return 'up'
    }
    if (item.count >= 5) {
      return 'stable'
    }
    return 'down'
  }

  /**
   * 获取推荐搜索（结合历史和热门）
   * @param limit 推荐数量
   */
  getRecommend(limit = 6): HotSearchItem[] {
    const history = searchHistory.get()
    const hot = this.get()

    // 去重并合并
    const combined = new Map<string, HotSearchItem>()

    // 添加热门搜索
    hot.forEach(item => {
      combined.set(item.keyword, item)
    })

    // 添加搜索历史（热门搜索优先）
    history.forEach((keyword, index) => {
      if (!combined.has(keyword)) {
        combined.set(keyword, {
          keyword,
          count: history.length - index, // 历史越近权重越高
          isSystem: false
        })
      }
    })

    // 按权重排序并返回
    return Array.from(combined.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * 导出统计数据（用于数据分析）
   */
  exportStats(): HotSearchItem[] {
    return storage.get<HotSearchItem[]>(HOT_SEARCH_STATS_KEY) || []
  }

  /**
   * 导入统计数据（用于数据迁移）
   */
  importStats(stats: HotSearchItem[]): void {
    storage.set(HOT_SEARCH_STATS_KEY, stats)
  }
}

export const hotSearch = new HotSearch()

export default {
  hotSearch
}
