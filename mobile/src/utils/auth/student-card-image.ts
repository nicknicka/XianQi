export type StudentCardSide = 'frontImage' | 'backImage'

/** 与后端本地上传限制保持一致。 */
export const STUDENT_CARD_IMAGE_MAX_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export interface StudentCardImageFile {
  path: string
  name: string
  type?: string
  size?: number
}

export interface StudentCardImageSelection {
  files: StudentCardImageFile[]
  validationError: string | null
}

export interface StudentCardUploadRequest {
  side: StudentCardSide
  generation: number
}

export interface StudentCardUploadState {
  activeSide: StudentCardSide | null
  requestGenerations: Record<StudentCardSide, number>
}

export function validateStudentCardImage(file: StudentCardImageFile): string | null {
  const size = file.size
  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
    return '图片信息不可读，请重新选择'
  }
  if (typeof file.type !== 'string' || !file.type) {
    return '图片信息不可读，请重新选择'
  }

  if (size > STUDENT_CARD_IMAGE_MAX_SIZE) {
    return '图片大小不能超过 5MB'
  }

  const extension = getImageExtension(file.type || file.name || file.path)
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
    return '仅支持 JPG、JPEG、PNG 或 WEBP 格式图片'
  }

  return null
}

export function createStudentCardUploadState(): StudentCardUploadState {
  return {
    activeSide: null,
    requestGenerations: {
      frontImage: 0,
      backImage: 0
    }
  }
}

function invalidateStudentCardUpload(state: StudentCardUploadState, side: StudentCardSide): number {
  state.requestGenerations[side] += 1
  return state.requestGenerations[side]
}

export function beginStudentCardUpload(
  state: StudentCardUploadState,
  side: StudentCardSide,
  options: { replace?: boolean } = {}
): StudentCardUploadRequest {
  if (options.replace) {
    cancelStudentCardUpload(state, side)
  }

  state.activeSide = side
  return { side, generation: invalidateStudentCardUpload(state, side) }
}

export function cancelStudentCardUpload(state: StudentCardUploadState, side: StudentCardSide): void {
  invalidateStudentCardUpload(state, side)

  if (state.activeSide === side) {
    state.activeSide = null
  }
}

export function isCurrentStudentCardUpload(
  state: StudentCardUploadState,
  request: StudentCardUploadRequest
): boolean {
  return state.requestGenerations[request.side] === request.generation
}

export function isImageSelectionCancelled(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('errMsg' in error)) {
    return false
  }

  const message = (error as { errMsg?: unknown }).errMsg
  return typeof message === 'string' && message.includes('cancel')
}

export function chooseStudentCardImage(): Promise<StudentCardImageSelection> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const paths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
        const sourceFiles = Array.isArray(res.tempFiles) ? res.tempFiles : [res.tempFiles]
        const files = paths
          .map((path, index) => normalizeStudentCardImageFile(sourceFiles[index], path))
          .filter((file): file is StudentCardImageFile => Boolean(file))

        if (!files.length) {
          reject(new Error('未选择图片'))
          return
        }

        const validationError = validateStudentCardImage(files[0])
        if (validationError) {
          resolve({ files: [], validationError })
          return
        }

        resolve({ files, validationError: null })
      },
      fail: reject
    })
  })
}

function normalizeStudentCardImageFile(source: unknown, fallbackPath: string): StudentCardImageFile | null {
  if (typeof source === 'string') {
    return {
      path: source || fallbackPath,
      name: source || fallbackPath
    }
  }

  if (typeof source !== 'object' || source === null) {
    return fallbackPath
      ? { path: fallbackPath, name: fallbackPath }
      : null
  }

  const record = source as Partial<StudentCardImageFile>
  const path = typeof record.path === 'string' && record.path ? record.path : fallbackPath
  const name = typeof record.name === 'string' && record.name ? record.name : path

  if (!path && !name) {
    return null
  }

  return {
    path,
    name,
    type: typeof record.type === 'string' ? record.type : undefined,
    size: typeof record.size === 'number' ? record.size : undefined
  }
}

function getImageExtension(value: string): string {
  const mimeType = value.match(/^image\/([a-z0-9+.-]+)$/i)
  if (mimeType?.[1] === 'svg+xml') {
    return 'svg'
  }

  const source = mimeType?.[1] || value
  const extension = source.split('.').pop() || ''
  return extension.toLowerCase()
}
