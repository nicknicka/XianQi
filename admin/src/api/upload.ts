import request from '@/utils/request'

// ==================== 类型定义 ====================

/**
 * 文件上传响应VO
 */
export interface FileUploadVO {
  uuid: string
  url: string
  filename: string
  originalFilename: string
  size: number
  extension: string
}

// ==================== 工具函数 ====================

/**
 * 生成缩略图URL（使用阿里云OSS图片处理）
 * @param url 原图URL
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns 缩略图URL
 */
export function getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
  if (!url) return ''

  // 检查是否是阿里云OSS链接
  if (url.includes('aliyuncs.com')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}x-oss-process=image/resize,m_fill,w_${width},h_${height}`
  }

  // 如果不是OSS链接，返回原图
  return url
}

/**
 * 生成中等图URL（使用阿里云OSS图片处理）
 * @param url 原图URL
 * @returns 中等图URL
 */
export function getMediumUrl(url: string): string {
  return getThumbnailUrl(url, 800, 800)
}

/**
 * 生成分辨率适配的图片URL
 * @param url 原图URL
 * @param size 目标尺寸
 * @returns 处理后的URL
 */
export function getResizedUrl(url: string, size: number): string {
  return getThumbnailUrl(url, size, size)
}

// ==================== API 接口 ====================

/**
 * 管理员上传单个图片
 * @param file 图片文件
 * @returns 上传结果
 */
export function uploadImage(file: File): Promise<FileUploadVO> {
  const formData = new FormData()
  formData.append('file', file)

  return request<FileUploadVO>({
    url: '/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 管理员批量上传图片
 * @param files 图片文件数组
 * @returns 上传结果数组
 */
export function uploadImages(files: File[]): Promise<FileUploadVO[]> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  return request<FileUploadVO[]>({
    url: '/upload/images',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ==================== 常量定义 ====================

/**
 * 允许的图片格式
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * 最大文件大小（5MB）
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/**
 * 图片尺寸配置
 */
export const IMAGE_SIZES = {
  thumbnail: 200,    // 缩略图
  medium: 800,       // 中等图
  large: 1920,       // 大图
} as const
