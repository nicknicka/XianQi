/**
 * 软萌简约主题系统 - 类型定义
 * 支持6套可爱风主题预设 + 吉祥物配色联动
 */

/** 主题预设标识 */
export type CuteThemePresetId =
  | 'peach-milk'
  | 'mint-forest'
  | 'caramel-cocoa'
  | 'lavender-dream'
  | 'lemon-bubble'
  | 'sea-salt-cheese'
  | 'sakura-love'

/** 完整色板接口 */
export interface CuteColorPalette {
  /** 主色 */
  primaryColor: string
  /** 主色浅色变体 */
  primaryColorLight: string
  /** 主色深色变体 */
  primaryColorDark: string
  /** 主色淡化(10%透明度) */
  primaryColorFaded: string
  /** 辅色 */
  secondaryColor: string
  /** 强调色(星星/徽章) */
  accentColor: string
  /** 背景色(暖白) */
  backgroundColor: string
  /** 功能色 - 成功 */
  successColor: string
  /** 功能色 - 警告 */
  warningColor: string
  /** 功能色 - 危险 */
  dangerColor: string
  /** 功能色 - 信息 */
  infoColor: string
  /** 主文字色 */
  textPrimary: string
  /** 副文字色 */
  textSecondary: string
  /** 辅助文字色 */
  textTertiary: string
}

/** 吉祥物配色接口 */
export interface MascotColors {
  /** 腮红色 */
  cheekColor: string
  /** 面部/身体色 */
  bodyColor: string
  /** 装饰色(耳朵/帽子等) */
  accentColor: string
  /** 阴影色 */
  shadowColor: string
}

/** 主题阴影配置 */
export interface CuteShadowPalette {
  xs: string
  sm: string
  base: string
  primary: string
}

/** 完整的可爱风主题预设 */
export interface CuteThemePreset {
  /** 预设标识 */
  id: CuteThemePresetId
  /** 显示名称 */
  name: string
  /** 简短描述 */
  description: string
  /** emoji图标 */
  emoji: string
  /** 色板 */
  colors: CuteColorPalette
  /** 阴影 */
  shadows: CuteShadowPalette
  /** 吉祥物配色 */
  mascot: MascotColors
}

/** 扩展后的主题配置 */
export interface CuteThemeConfig {
  /** 当前预设ID */
  presetId: CuteThemePresetId
  /** 字体大小缩放 (0.8 ~ 1.3) */
  fontSizeScale: number
  /** 是否深色模式 */
  isDark: boolean
}
