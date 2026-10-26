/**
 * 三层字典主题系统 - 类型定义
 *
 * 架构：
 *   种子层 (ThemeSeed) → 每个主题只定义 8 个核心色
 *   派生层 (resolveTheme) → 自动生成 80+ 个 CSS 变量
 *   共享层 (STATIC_VARS) → 圆角/间距/字号等所有主题共用
 */

/** 主题标识 */
export type ThemeId =
  | 'peach-milk'
  | 'mint-forest'
  | 'caramel-cocoa'
  | 'lavender-dream'
  | 'lemon-bubble'
  | 'sea-salt-cheese'
  | 'sakura-love'

/**
 * 种子字典 - 每个主题只需定义这 8 个核心色
 * 其余所有值（alpha 变体、功能色、深色模式等）都从这些种子自动派生
 */
export interface ThemeSeed {
  primaryColor: string
  primaryColorLight: string
  primaryColorDark: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  /** 吉祥物身体色（大部分主题 = backgroundColor，少数例外） */
  mascotBody: string
}

/** 深色模式覆盖值（所有主题共享同一套） */
export interface DarkModeOverrides {
  backgroundColor: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  textColorDisabled: string
  textColorInverse: string
  bgColorCard: string
  bgColorWarm: string
  bgColorDisabled: string
  borderColorBase: string
  borderColorLight: string
  borderColorLighter: string
  borderColorDark: string
  tabBarColor: string
  tabBarBackground: string
}

/** 阴影配置 */
export interface ShadowConfig {
  xs: string
  sm: string
  base: string
  primary: string
}

/**
 * 主题注册条目
 * 每个主题 = 元数据 + light 种子 + dark 覆盖 + 两套阴影
 */
export interface ThemeRegistration {
  id: ThemeId
  name: string
  emoji: string
  description: string
  light: ThemeSeed
  dark: DarkModeOverrides
  shadows: ShadowConfig
  shadowsDark: ShadowConfig
}

/** 运行时主题配置（持久化到 storage） */
export interface ThemeConfig {
  presetId: ThemeId
  fontSizeScale: number
  isDark: boolean
}

/** 向后兼容的类型别名 */
export type CuteThemePresetId = ThemeId
export type CuteThemeConfig = ThemeConfig
