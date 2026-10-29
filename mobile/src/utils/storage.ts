/**
 * 本地存储工具类
 * 基于 uni.storage 封装
 */

export default {
  /**
   * 设置数据
   */
  set(key: string, data: any): void {
    try {
      console.log('[Storage] 准备存储数据')
      console.log(`[Storage] 键: ${key}`)
      console.log('[Storage] 值:', data)
      console.log('[Storage] 值类型:', typeof data)
      console.log('[Storage] 值是否为数组:', Array.isArray(data))
      console.log('[Storage] 值键数量:', data !== null && typeof data === 'object' ? Object.keys(data || {}).length : 'N/A')

      uni.setStorageSync(key, data)

      // 验证存储结果
      const storedValue = uni.getStorageSync(key)
      console.log('[Storage] 存储后的值:', storedValue)
      console.log('[Storage] 存储验证:', JSON.stringify(storedValue) === JSON.stringify(data) ? '成功' : '失败')
      console.log('[Storage] 当前所有存储键:', Object.keys(uni.getStorageInfoSync() || {}))

      // 获取存储信息
      try {
        const storageInfo = uni.getStorageInfoSync()
        console.log('[Storage] 存储信息:', {
          keys: storageInfo.keys,
          currentSize: storageInfo.currentSize,
          limitSize: storageInfo.limitSize
        })
      } catch (e) {
        console.error('[Storage] 获取存储信息失败:', e)
      }
    } catch (e) {
      console.error('[Storage] 存储数据失败:', e)
      console.error('[Storage] 错误详情:', {
        key,
        dataType: typeof data,
        data,
        error: e
      })
    }
  },

  /**
   * 获取数据
   */
  get<T = any>(key: string): T | null {
    try {
      return uni.getStorageSync(key) as T
    } catch (e) {
      console.error('获取数据失败:', e)
      return null
    }
  },

  /**
   * 删除数据
   */
  remove(key: string): void {
    try {
      uni.removeStorageSync(key)
    } catch (e) {
      console.error('删除数据失败:', e)
    }
  },

  /**
   * 清空所有数据
   */
  clear(): void {
    try {
      uni.clearStorageSync()
    } catch (e) {
      console.error('清空数据失败:', e)
    }
  },

  /**
   * 获取存储信息
   */
  getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      uni.getStorageInfo({
        success: resolve,
        fail: reject
      })
    })
  }
}
