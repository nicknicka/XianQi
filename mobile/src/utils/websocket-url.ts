/**
 * WebSocket 地址解析。
 *
 * H5 端必须跟随当前页面地址，避免硬编码域名、错误端口和 HTTPS 页面上的 mixed content；
 * 小程序端继续使用部署时配置的 WebSocket 域名。
 */

interface WebSocketLocation {
  protocol: string
  host: string
  origin: string
}

export function buildH5WebSocketUrl(
  apiBaseUrl: string,
  location: WebSocketLocation
): string {
  if (!location.host) {
    throw new Error('无法确定当前页面地址')
  }

  const apiUrl = new URL(apiBaseUrl || '/api', location.origin)
  const apiPath = apiUrl.pathname.replace(/\/+$/, '')
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'

  return `${protocol}//${location.host}${apiPath}/ws`
}

export function normalizeConfiguredWebSocketUrl(configuredUrl?: string): string {
  if (!configuredUrl || !configuredUrl.trim()) {
    throw new Error('VITE_WS_BASE_URL 未配置')
  }

  const normalized = configuredUrl
    .trim()
    .replace(/^http:\/\//i, 'ws://')
    .replace(/^https:\/\//i, 'wss://')

  if (!/^wss?:\/\//i.test(normalized)) {
    throw new Error('VITE_WS_BASE_URL 必须是 ws:// 或 wss:// 地址')
  }

  const isLocal = /localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  if (normalized.startsWith('ws://') && !isLocal) {
    return normalized.replace(/^ws:\/\//i, 'wss://')
  }

  return normalized
}

export function resolveWebSocketUrl(): string {
  let url = ''

  // #ifdef H5
  url = buildH5WebSocketUrl(import.meta.env.VITE_API_BASE_URL || '/api', window.location)
  // #endif

  // #ifndef H5
  url = normalizeConfiguredWebSocketUrl(import.meta.env.VITE_WS_BASE_URL)
  // #endif

  if (!url) {
    throw new Error('WebSocket 地址未配置')
  }

  return url
}
