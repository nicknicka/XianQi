/**
 * 图片调试工具
 * 用于调试图片加载问题
 */
import { normalizeImageUrl, getImageUrl, ImageSize } from './image'

/**
 * 调试图片URL转换过程
 */
export function debugImageUrl(url: string, label = '图片') {
  console.log(`=== ${label} URL调试 ===`)
  console.log('原始URL:', url)
  console.log('URL类型:', url?.startsWith?.('/') ? '相对路径' : '完整URL')

  try {
    const normalized = normalizeImageUrl(url)
    console.log('标准化URL:', normalized)

    const thumbnail = getImageUrl(url, ImageSize.THUMBNAIL)
    const medium = getImageUrl(url, ImageSize.MEDIUM)
    const original = getImageUrl(url, ImageSize.ORIGINAL)

    console.log('缩略图:', thumbnail)
    console.log('中等图:', medium)
    console.log('原图:', original)
  } catch (error) {
    console.error('URL处理失败:', error)
  }

  console.log('==================\n')
}

/**
 * 批量调试图片URL
 */
export function debugImageUrls(urls: string[], label = '图片列表') {
  console.log(`=== ${label}批量调试 ===`)
  console.log('总数:', urls?.length || 0)

  urls?.forEach((url, index) => {
    console.log(`[${index + 1}]`, url)
  })

  console.log('==================\n')
}

/**
 * 检查图片是否可访问（小程序环境）
 */
export function checkImageAccessible(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      console.warn('[图片检查] URL为空')
      resolve(false)
      return
    }

    uni.getImageInfo({
      src: url,
      success: (res) => {
        console.log('[图片检查] 成功:', url, res)
        resolve(true)
      },
      fail: (err) => {
        console.error('[图片检查] 失败:', url, err)
        resolve(false)
      }
    })
  })
}

/**
 * 图片加载状态追踪
 */
class ImageLoadTracker {
  private loads = new Map<string, boolean>()
  private fails = new Map<string, boolean>()

  success(url: string) {
    this.loads.set(url, true)
    console.log(`✅ [图片追踪] 加载成功: ${url}`)
  }

  fail(url: string, error?: any) {
    this.fails.set(url, true)
    console.error(`❌ [图片追踪] 加载失败: ${url}`, error)
  }

  getStats() {
    return {
      success: this.loads.size,
      fail: this.fails.size,
      successUrls: Array.from(this.loads.keys()),
      failUrls: Array.from(this.fails.keys())
    }
  }

  clear() {
    this.loads.clear()
    this.fails.clear()
  }
}

export const imageTracker = new ImageLoadTracker()

export default {
  debugImageUrl,
  debugImageUrls,
  checkImageAccessible,
  imageTracker
}
