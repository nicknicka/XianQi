/**
 * 向后兼容 shim - 所有 50+ 页面的 import 都指向此文件
 * 实际实现已迁移到 ./theme/ 目录下的三层字典架构
 */

// 管理器 + hooks（所有页面直接使用的 API）
export { themeManager, reactiveCSSVars, fontSizeScales } from './theme/theme-manager'
export { useTheme, useThemePage, useThemeStyle, useThemeColors } from './theme/theme-hooks'

// 类型
export type { ThemeId as CuteThemePresetId, ThemeConfig as CuteThemeConfig } from './theme/theme-seed'

// 向后兼容：旧版导出名
export { themeRegistry as cuteThemePresets } from './theme/theme-registry'
export { DEFAULT_THEME_ID as DEFAULT_PRESET_ID } from './theme/theme-registry'
export { getTheme as getPreset } from './theme/theme-registry'
export { getThemeList as cuteThemePresetList } from './theme/theme-registry'

// 新版 API（供新代码使用）
export { resolveTheme, addAlpha, STATIC_VARS } from './theme/theme-derive'
export type { ThemeId, ThemeSeed, ThemeRegistration } from './theme/theme-seed'
export { themeRegistry, DEFAULT_THEME_ID, getTheme, getThemeList } from './theme/theme-registry'
