/**
 * 搜索历史管理工具
 */

import storage from './storage'

/**
 * 存储键
 */
const SEARCH_HISTORY_KEY = 'search_history'
const MAX_HISTORY_COUNT = 10 // 最多保存10条搜索历史

/**
 * 搜索历史管理类
 */
class SearchHistory {
  /**
   * 获取搜索历史
   */
  get(): string[] {
    const history = storage.get(SEARCH_HISTORY_KEY)
    return Array.isArray(history) ? history : []
  }

  /**
   * 添加搜索历史
   * @param keyword 搜索关键词
   */
  add(keyword: string): void {
    if (!keyword || typeof keyword !== 'string') {
      return
    }

    const keywordTrimmed = keyword.trim()
    if (!keywordTrimmed) {
      return
    }

    let history = this.get()

    // 移除已存在的相同关键词
    history = history.filter(item => item !== keywordTrimmed)

    // 添加到开头
    history.unshift(keywordTrimmed)

    // 限制数量
    if (history.length > MAX_HISTORY_COUNT) {
      history = history.slice(0, MAX_HISTORY_COUNT)
    }

    storage.set(SEARCH_HISTORY_KEY, history)
  }

  /**
   * 删除指定的搜索历史
   * @param keyword 搜索关键词
   */
  remove(keyword: string): void {
    let history = this.get()
    history = history.filter(item => item !== keyword)
    storage.set(SEARCH_HISTORY_KEY, history)
  }

  /**
   * 清空所有搜索历史
   */
  clear(): void {
    storage.remove(SEARCH_HISTORY_KEY)
  }

  /**
   * 检查搜索历史是否为空
   */
  isEmpty(): boolean {
    return this.get().length === 0
  }

  /**
   * 获取搜索历史数量
   */
  count(): number {
    return this.get().length
  }
}

export const searchHistory = new SearchHistory()
