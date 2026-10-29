export {};

// 全局 require 函数声明（用于动态导入模块）
declare function require(module: string): any;

declare global {
  /**
   * 补齐 UniApp.SocketTask 的类型缺口。
   *
   * `@dcloudio/types` 的 SocketTask 声明里既没有 `readyState`（微信小程序
   * 运行时确实提供），也把 `close(options)` 的 options 标成必填（官方文档
   * 示例是 `task.close()`，即可省略）。这里按运行时行为做声明合并补齐。
   */
  namespace UniNamespace {
    interface SocketTask {
      readonly readyState: number
      close(options?: CloseSocketOptions): void
    }
  }

  /**
   * 微信小程序的全局对象。
   *
   * 仅在 `#ifdef MP-WEIXIN` 条件编译块内使用（H5 构建时整块被剔除），
   * 但类型检查器会解析这些分支，因此需要声明。声明只覆盖项目实际用到的
   * 四个方法，避免引入一份需要长期维护的完整微信 API 类型。
   */
  const wx: {
    getDeviceInfo?: () => { model?: string; platform?: string; system?: string; brand?: string }
    getWindowInfo?: () => {
      platform?: string
      statusBarHeight?: number
      screenWidth?: number
      screenHeight?: number
      windowWidth?: number
      windowHeight?: number
      pixelRatio?: number
    }
    getAppBaseInfo?: () => { SDKVersion?: string; language?: string }
    getMenuButtonBoundingClientRect: () => { top: number; right: number; bottom: number; width: number; height: number }
  }
}

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
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