/**
 * 三层字典主题系统 - 统一入口
 */

// 类型
export type { ThemeId, ThemeSeed, DarkModeOverrides, ShadowConfig, ThemeRegistration, ThemeConfig } from './theme-seed'
export type { CuteThemePresetId, CuteThemeConfig } from './theme-seed'

// 注册表
export {
  themeRegistry,
  SHARED_COLORS,
  SHARED_MASCOT_CHEEK,
  SHARED_DARK_SEED,
  DEFAULT_THEME_ID,
  getTheme,
  getThemeList,
} from './theme-registry'

// 向后兼容别名
export { themeRegistry as cuteThemePresets } from './theme-registry'
export { DEFAULT_THEME_ID as DEFAULT_PRESET_ID } from './theme-registry'
export { getTheme as getPreset } from './theme-registry'
export { getThemeList as cuteThemePresetList } from './theme-registry'

// 派生引擎
export { resolveTheme, addAlpha, STATIC_VARS } from './theme-derive'

// 管理器
export { themeManager, reactiveCSSVars, fontSizeScales } from './theme-manager'

// Hooks
export { useTheme, useThemePage, useThemeStyle, useThemeColors } from './theme-hooks'
