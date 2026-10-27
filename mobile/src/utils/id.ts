export function normalizeId(value?: string | null): string {
  return value?.trim() || ''
}

function decodeBase64Url(value: string): string {
  if (typeof atob === 'function') {
    return atob(value)
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let output = ''
  let buffer = 0
  let bits = 0

  for (const character of value.replace(/=+$/, '')) {
    const index = alphabet.indexOf(character)
    if (index === -1) continue
    buffer = (buffer << 6) | index
    bits += 6
    if (bits >= 8) {
      bits -= 8
      output += String.fromCharCode((buffer >> bits) & 0xff)
    }
  }

  return output
}

export function decodeTokenPayload(token?: string): Record<string, unknown> {
  if (!token) return {}

  const parts = token.split('.')
  if (parts.length !== 3) return {}

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return JSON.parse(decodeBase64Url(normalizedBase64)) as Record<string, unknown>
}

export function extractUserIdFromToken(token?: string): string {
  try {
    const payload = decodeTokenPayload(token)
    return normalizeId(typeof payload.userId === 'string' || typeof payload.userId === 'number' ? String(payload.userId) : '')
  } catch (error) {
    console.error('[IdUtil] 从 Token 提取 userId 失败:', error)
    return ''
  }
}
