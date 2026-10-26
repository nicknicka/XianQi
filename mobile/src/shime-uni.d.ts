export {};

// 全局 require 函数声明（用于动态导入模块）
declare function require(module: string): any;

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_OSS_ENABLED: string
  readonly VITE_OSS_ENDPOINT: string
  readonly VITE_OSS_ACCESS_KEY_ID: string
  readonly VITE_OSS_ACCESS_KEY_SECRET: string
  readonly VITE_OSS_BUCKET_NAME: string
  readonly VITE_OSS_BASE_URL: string
  readonly VITE_UPLOAD_BASE_URL: string
  readonly VITE_AMAP_WEB_KEY: string
  readonly VITE_AMAP_MINIPROGRAM_KEY: string
  readonly VITE_AMAP_SECRET_KEY: string
  readonly VITE_AMAP_KEY: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "vue" {
  type Hooks = App.AppInstance & Page.PageInstance;
  interface ComponentCustomOptions extends Hooks {}
}