export type StudentCardSide = 'frontImage' | 'backImage'

/** 与后端本地上传限制保持一致。 */
export const STUDENT_CARD_IMAGE_MAX_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export interface StudentCardImageFile {
  path: string
  name: string
  type: string
  size?: number
}

export interface StudentCardImageSelection {
  files: StudentCardImageFile[]
  validationError: string | null
}

export interface StudentCardUploadState {
  activeSide: StudentCardSide | null
  requestTokens: Record<StudentCardSide, number>
}

export function validateStudentCardImage(file: StudentCardImageFile): string | null {
  if (typeof file.size === 'number' && file.size > STUDENT_CARD_IMAGE_MAX_SIZE) {
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
    requestTokens: {
      frontImage: 0,
      backImage: 0
    }
  }
}

export function beginStudentCardUpload(
  state: StudentCardUploadState,
  side: StudentCardSide,
  options: { replace?: boolean } = {}
): number {
  if (options.replace) {
    cancelStudentCardUpload(state, side)
  }

  state.activeSide = side
  state.requestTokens = {
    ...state.requestTokens,
    [side]: state.requestTokens[side] + 1
  }
  return state.requestTokens[side]
}

export function cancelStudentCardUpload(state: StudentCardUploadState, side: StudentCardSide): void {
  state.requestTokens = {
    ...state.requestTokens,
    [side]: state.requestTokens[side] + 1
  }

  if (state.activeSide === side) {
    state.activeSide = null
  }
}

export function isCurrentStudentCardUpload(
  state: StudentCardUploadState,
  side: StudentCardSide,
  requestToken: number
): boolean {
  return state.requestTokens[side] === requestToken
}

export function isImageSelectionCancelled(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('errMsg' in error)) {
    return false
  }

  const message = (error as { errMsg?: unknown }).errMsg
  return typeof message === 'string' && message.includes('cancel')
}

export function chooseStudentCardImage(options: {
  count?: number
  sizeType?: Array<'original' | 'compressed'>
  sourceType?: Array<'album' | 'camera'>
}): Promise<StudentCardImageSelection> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: options.count ?? 1,
      sizeType: options.sizeType ?? ['compressed'],
      sourceType: options.sourceType ?? ['album', 'camera'],
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
      name: source || fallbackPath,
      type: ''
    }
  }

  if (typeof source !== 'object' || source === null) {
    return fallbackPath
      ? { path: fallbackPath, name: fallbackPath, type: '' }
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
    type: typeof record.type === 'string' ? record.type : '',
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
