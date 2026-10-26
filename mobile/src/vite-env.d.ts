/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_USE_MOCK: string
  readonly VITE_AMAP_WEB_KEY: string
  readonly VITE_AMAP_MINIPROGRAM_KEY: string
  readonly VITE_AMAP_SECRET_KEY: string
  readonly VITE_AMAP_KEY: string
  // 添加其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
