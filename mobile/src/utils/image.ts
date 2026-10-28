/**
 * 图片处理工具类
 * 提供图片压缩、上传、预览等功能
 */

/**
 * 默认头像路径
 */
export const DEFAULT_AVATAR = '/static/images/user.png'

/**
 * 上传结果统一结构
 */
export interface UploadedImageResult {
  url: string
  key: string
  raw?: any
}

/**
 * 上传图片配置
 */
export interface UploadImageOptions {
  showLoading?: boolean
  loadingText?: string
  onProgress?: (progress: number) => void
}

/**
 * 从后端返回的数据中提取图片地址
 */
export function resolveUploadedImageUrl(data: any): string {
  if (!data) return ''

  if (typeof data === 'string') {
    return data
  }

  if (Array.isArray(data)) {
    return resolveUploadedImageUrl(data[0])
  }

  if (typeof data === 'object') {
    const candidates = [data.url, data.avatar, data.imageUrl, data.fileUrl, data.path]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate
      }
    }

    if (data.data !== undefined) {
      return resolveUploadedImageUrl(data.data)
    }
  }

  return ''
}

/**
 * 解析统一上传响应
 */
export function parseUploadedImageResult(resData: string | Record<string, any>): UploadedImageResult {
  const response = typeof resData === 'string' ? JSON.parse(resData) : resData

  if (!response || typeof response !== 'object') {
    throw new Error('上传响应格式错误')
  }

  if (response.code !== 200) {
    throw new Error(response.message || '上传失败')
  }

  const rawData = response.data
  const url = resolveUploadedImageUrl(rawData)

  if (!url) {
    throw new Error('上传成功，但未返回图片地址')
  }

  let key = url
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    key = rawData.key || rawData.filename || rawData.uuid || url
  }

  return {
    url,
    key,
    raw: rawData,
    ...(rawData && typeof rawData === 'object' && !Array.isArray(rawData) ? rawData : {})
  }
}

/**
 * 处理用户头像URL
 * @param url 头像URL
 * @returns 处理后的头像URL
 */
export function normalizeAvatarUrl(url?: string): string {
  // 如果没有URL，返回默认头像
  if (!url) {
    console.log('[normalizeAvatarUrl] 没有URL，使用默认头像')
    return DEFAULT_AVATAR
  }

  // 处理旧的默认头像路径，统一转换到新的路径
  if (url === '/static/images/default-avatar.png') {
    console.log('[normalizeAvatarUrl] 检测到旧的默认头像路径，转换为新路径')
    return DEFAULT_AVATAR
  }

  // 处理不存在的 SVG 头像文件，返回默认头像
  if (url.includes('avatar-l.svg') || url.includes('avatar-z.svg')) {
    console.log('[normalizeAvatarUrl] 检测到不存在的 SVG 头像，使用默认头像:', url)
    return DEFAULT_AVATAR
  }

  // 如果是HTTP URL（包括localhost），需要转换为HTTPS
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 使用 normalizeImageUrl 来处理 localhost → HTTPS 的转换
    const normalized = normalizeImageUrl(url)
    console.log('[normalizeAvatarUrl] HTTP/HTTPS头像URL转换:', url, '->', normalized)
    return normalized
  }

  // 如果是本地静态资源，直接返回
  if (url.startsWith('/static/')) {
    return url
  }

  // 如果是相对路径（/api/、/image/、/uploads/、/user/），使用 normalizeImageUrl 处理
  if (url.startsWith('/')) {
    const normalized = normalizeImageUrl(url)
    console.log('[normalizeAvatarUrl] 转换相对路径头像:', url, '->', normalized)
    return normalized
  }

  // 其他情况，使用默认头像
  console.log('[normalizeAvatarUrl] URL格式未知，使用默认头像:', url)
  return DEFAULT_AVATAR
}

/**
 * 将相对路径的图片URL转换为完整的URL
 * @param url 图片URL（可能是相对路径或完整URL）
 * @returns 完整的图片URL
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return ''

  function isKnownPlaceholderHost(input: string): boolean {
    return /^https?:\/\/(?:www\.)?(example\.com|example\.org|example\.net)\b/i.test(input)
  }

  function getOrigin(input: string): string {
    const match = input.match(/^(https?:\/\/[^/]+)(?:\/.*)?$/i)
    return match ? match[1] : ''
  }

  function removeApiSuffix(input: string): string {
    return input.replace(/\/api\/?$/i, '')
  }

  // 如果是本地静态资源路径（/static/），直接返回
  if (url.startsWith('/static/')) {
    return url
  }

  // 如果已经是完整的URL（http/https/blob），处理 localhost 替换
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    if (isKnownPlaceholderHost(url)) {
      console.warn('[normalizeImageUrl] 检测到占位图片地址，降级为默认图:', url)
      return '/static/images/empty.png'
    }

    let processedUrl = url

    // 处理 localhost 替换（不依赖条件编译）
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
      if (apiBaseUrl && (apiBaseUrl.includes('10.173.241.252') || apiBaseUrl.includes('192.168'))) {
        // 提取协议和主机，替换 localhost
        const hostAndPort = apiBaseUrl.replace('/api', '')
        processedUrl = url.replace(/http:\/\/localhost:\d+|http:\/\/127\.0\.0\.1:\d+/, hostAndPort)
        console.log('[normalizeImageUrl] 替换 localhost 为局域网 IP:', url, '->', processedUrl)
      }
    }

    // 注意：这里不再调用 convertHttpToHttpsIfNeeded
    // 因为开发环境的 HTTP 服务器不支持 HTTPS
    // 如果需要 HTTPS，应该在生产环境的反向代理（如 Nginx）中配置
    return processedUrl
  }

  // 如果是绝对路径（以/开头）
  if (url.startsWith('/')) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

    // 检查 url 是否已经包含 /api/ 前缀
    if (url.startsWith('/api/')) {
      // url 已经包含 /api/，需要提取 baseURL 的主机部分
      if (baseURL.startsWith('http')) {
        const origin = getOrigin(baseURL)
        return origin ? `${origin}${url}` : url
      }
      // baseURL 不是完整 URL，url 已经是完整路径
      return url
    }

    // url 不包含 /api/，检查是否为静态资源路径（/uploads/、/image/、/user/ 等）
    // 静态资源路径需要特殊处理
    if (url.startsWith('/uploads/') || url.startsWith('/static/') || url.startsWith('/image/') || url.startsWith('/user/')) {
      // 需要提取 baseURL 的主机部分，不包含 /api/
      if (baseURL.startsWith('http')) {
        const origin = getOrigin(removeApiSuffix(baseURL))
        const fullUrl = origin ? `${origin}${url}` : url
        console.log('[normalizeImageUrl] 转换静态资源URL:', url, '->', fullUrl)
        return fullUrl
      }
      // baseURL 不是完整 URL，需要添加 /api 前缀（除非是 /static/ 资源）
      if (!url.startsWith('/static/')) {
        const fullUrl = baseURL + url
        console.log('[normalizeImageUrl] 添加API前缀:', url, '->', fullUrl)
        return fullUrl
      }
      return url
    }

    // 其他情况，直接拼接 baseURL
    const fullUrl = `${baseURL}${url}`
    console.log('[normalizeImageUrl] 转换图片URL:', url, '->', fullUrl)
    return fullUrl
  }

  // 其他情况（相对路径），直接返回
  console.log('[normalizeImageUrl] 保持原URL:', url)
  return url
}

/**
 * 图片质量配置
 */
export enum ImageQuality {
  LOW = 60,      // 低质量
  MEDIUM = 80,   // 中质量
  HIGH = 100     // 高质量
}

/**
 * 图片尺寸配置
 */
export enum ImageSize {
  THUMBNAIL = 'thumbnail', // 缩略图 200x200
  MEDIUM = 'medium',       // 中等图 800x800
  ORIGINAL = 'original'     // 原图
}

/**
 * 压缩图片
 * @param src 图片路径
 * @param quality 压缩质量
 */
export function compressImage(
  src: string,
  quality: ImageQuality = ImageQuality.MEDIUM
): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: (err) => {
        console.error('图片压缩失败:', err)
        // 压缩失败，返回原图
        resolve(src)
      }
    })
  })
}

/**
 * 批量压缩图片
 * @param srcs 图片路径数组
 * @param quality 压缩质量
 */
export async function batchCompressImages(
  srcs: string[],
  quality: ImageQuality = ImageQuality.MEDIUM
): Promise<string[]> {
  const results: string[] = []

  for (const src of srcs) {
    try {
      const compressed = await compressImage(src, quality)
      results.push(compressed)
    } catch (e) {
      console.error('压缩图片失败:', src, e)
      // 压缩失败，使用原图
      results.push(src)
    }
  }

  return results
}

/**
 * 选择图片
 */
export function chooseImage(options: {
  count?: number
  sizeType?: Array<'original' | 'compressed'>
  sourceType?: Array<'album' | 'camera'>
}): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: options.count || 9,
      sizeType: options.sizeType || ['compressed'],
      sourceType: options.sourceType || ['album', 'camera'],
      success: (res) => {
        resolve(res.tempFilePaths)
      },
      fail: reject
    })
  })
}

/**
 * 上传图片
 */
export function uploadImage(
  filePath: string,
  url = '/upload/image',
  options: UploadImageOptions = {}
): Promise<UploadedImageResult> {
  const { showLoading = true, loadingText = '上传中...', onProgress } = options

  return new Promise((resolve, reject) => {
    if (showLoading) {
      uni.showLoading({ title: loadingText })
    }

    const uploadTask = uni.uploadFile({
      url: import.meta.env.VITE_API_BASE_URL + url,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`
      },
      success: (res) => {
        if (showLoading) {
          uni.hideLoading()
        }
        try {
          resolve(parseUploadedImageResult(res.data))
        } catch (error: any) {
          uni.showToast({
            title: error?.message || '上传失败',
            icon: 'none'
          })
          reject(error)
        }
      },
      fail: (err) => {
        if (showLoading) {
          uni.hideLoading()
        }
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(err)
      }
    })

    if (onProgress) {
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress)
      })
    }
  })
}

/**
 * 批量上传图片
 * @param filePaths 文件路径数组
 */
export async function batchUploadImages(
  filePaths: string[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = []
  const total = filePaths.length

  for (let i = 0; i < filePaths.length; i++) {
    try {
      // 先压缩
      const compressed = await compressImage(filePaths[i])
      // 再上传
      const result = await uploadImage(compressed)
      urls.push(result.url)

      if (onProgress) {
        onProgress(i + 1, total)
      }
    } catch (e) {
      console.error('图片上传失败:', filePaths[i], e)
      // 继续上传其他图片
    }
  }

  return urls
}

/**
 * 预览图片
 */
export function previewImage(urls: string[], current?: number | string): void {
  uni.previewImage({
    urls,
    current: current || 0
  })
}

/**
 * 获取图片信息
 */
export function getImageInfo(src: string): Promise<UniApp.GetImageInfoSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 保存图片到相册
 */
export function saveImageToPhotosAlbum(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        })
        resolve()
      },
      fail: (err) => {
        if (err.errMsg.includes('auth')) {
          uni.showModal({
            title: '提示',
            content: '需要您授权保存相册',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.openSetting()
              }
            }
          })
        }
        reject(err)
      }
    })
  })
}

/**
 * 生成不同尺寸的图片 URL (OSS 图片处理)
 * @param url 原图 URL
 * @param size 尺寸
 */
export function getImageUrl(
  url: string,
  size: ImageSize | number = ImageSize.ORIGINAL
): string {
  if (!url) return ''

  // 先处理 localhost 替换（确保在所有环境下都能工作）
  let processedUrl = url
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
    if (apiBaseUrl && (apiBaseUrl.includes('10.173.241.252') || apiBaseUrl.includes('192.168'))) {
      // 提取协议和主机，替换 localhost
      const hostAndPort = apiBaseUrl.replace('/api', '')
      processedUrl = url.replace(/http:\/\/localhost:\d+|http:\/\/127\.0\.0\.1:\d+/, hostAndPort)
      console.log('[getImageUrl] 替换 localhost 为局域网 IP:', url, '->', processedUrl)
    }
  }

  // 如果是数字，返回指定宽度的图片
  if (typeof size === 'number') {
    if (processedUrl.includes('aliyuncs.com')) {
      return `${processedUrl}?x-oss-process=image/resize,w_${size}`
    }
    return processedUrl
  }

  const sizeMap: Record<ImageSize, string> = {
    [ImageSize.THUMBNAIL]: '200',
    [ImageSize.MEDIUM]: '800',
    [ImageSize.ORIGINAL]: ''
  }

  const imageSize = sizeMap[size]
  if (!imageSize) return processedUrl

  // 判断是否为 OSS URL
  if (processedUrl.includes('aliyuncs.com')) {
    return `${processedUrl}?x-oss-process=image/resize,w_${imageSize}`
  }

  return processedUrl
}

/**
 * 生成图片的缩略图 URL
 */
export function getThumbnailUrl(url: string): string {
  return getImageUrl(url, ImageSize.THUMBNAIL)
}

/**
 * 生成图片的中等图 URL
 */
export function getMediumUrl(url: string): string {
  return getImageUrl(url, ImageSize.MEDIUM)
}

/**
 * 获取图片占位符
 * @param width 宽度
 * @param height 高度
 */
export function getImagePlaceholder(width: number, height: number, text = '图片'): string {
  // 生成占位图 base64
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (ctx) {
    // 背景
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, width, height)

    // 文字
    ctx.fillStyle = '#999'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)
  }

  return canvas.toDataURL('image/png')
}

/**
 * 检查图片是否加载完成
 * @param src 图片 URL
 */
export function imageLoaded(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 */
export function formatFileSize(size: number): string {
  if (size < 1024) return size + 'B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + 'KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + 'MB'
  return (size / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
}

/**
 * 获取图片文件大小
 * @param src 图片 URL
 */
export async function getImageSize(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: (res) => {
        resolve(res.width * res.height * 4) // 估算RGBA大小
      },
      fail: reject
    })
  })
}

/**
 * 图片加载状态管理
 */
export class ImageLoader {
  private cache = new Map<string, boolean>()

  /**
   * 加载图片
   * @param src 图片 URL
   */
  async load(src: string): Promise<boolean> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!
    }

    try {
      await imageLoaded(src)
      this.cache.set(src, true)
      return true
    } catch (e) {
      this.cache.set(src, false)
      return false
    }
  }

  /**
   * 批量加载图片
   * @param srcs 图片 URL 数组
   */
  async batchLoad(srcs: string[]): Promise<boolean[]> {
    const results = await Promise.allSettled(
      srcs.map(src => this.load(src))
    )
    return results.map(r => r.status === 'success' ? r.value : false)
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
  }
}

// 创建单例
export const imageLoader = new ImageLoader()

export default {
  normalizeAvatarUrl,
  normalizeImageUrl,
  compressImage,
  batchCompressImages,
  chooseImage,
  uploadImage,
  batchUploadImages,
  previewImage,
  getImageInfo,
  saveImageToPhotosAlbum,
  getImageUrl,
  getThumbnailUrl,
  getMediumUrl,
  getImagePlaceholder,
  imageLoaded,
  formatFileSize,
  getImageSize,
  imageLoader,
  ImageQuality,
  ImageSize
}


/**
 * 归一化单个图片地址。非字符串输入返回空串。
 */
export function normalizeImageEntry(image: unknown): string {
  if (typeof image !== 'string') return ''
  return normalizeImageUrl(image)
}

/**
 * 把图片列表归一化为字符串数组。
 * 入参可能是数组、JSON 字符串，或单个地址；非法输入返回空数组。
 */
export function parseImageList(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.map(normalizeImageEntry).filter(Boolean)
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeImageEntry).filter(Boolean)
      }
    } catch {
      const normalized = normalizeImageEntry(images)
      return normalized ? [normalized] : []
    }
  }

  return []
}
