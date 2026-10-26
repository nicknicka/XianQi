export type IdLike = string | number | null | undefined

export function normalizeId(value: IdLike): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

export function extractUserIdFromToken(token?: string): string {
  if (!token) return ''

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return ''

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = atob(normalizedBase64)
    const match = payload.match(/"userId"\s*:\s*(\d+)/)
    return match?.[1] || ''
  } catch (error) {
    console.error('[IdUtil] 从 Token 提取 userId 失败:', error)
    return ''
  }
}
