/**
 * 三层字典主题系统 - 主题注册表
 *
 * 每个主题只需定义 8 个核心色（种子），其余全部自动派生。
 * 所有主题共享的功能色、深色模式、基础阴影只定义一次。
 */

import type { ThemeId, ThemeSeed, DarkModeOverrides, ShadowConfig, ThemeRegistration } from './theme-seed'

// ========== 共享基础色（所有主题都一样，只定义一次） ==========
export const SHARED_COLORS = {
  successColor: '#7ED4A6',
  warningColor: '#FFD666',
  dangerColor: '#FF8A8A',
  infoColor: '#9DC4FF',
  textPrimary: '#2D2D2D',
  textSecondary: '#7A7A7A',
  textTertiary: '#AAAAAA',
} as const

/** 吉祥物腮红色（所有主题共享） */
export const SHARED_MASCOT_CHEEK = '#FFB6C1'

// ========== 深色模式覆盖值（所有主题共享） ==========
export const SHARED_DARK_SEED: DarkModeOverrides = {
  backgroundColor: '#1A1A1A',
  textPrimary: '#E8E8E8',
  textSecondary: '#AAAAAA',
  textTertiary: '#888888',
  textColorDisabled: '#666666',
  textColorInverse: '#2D2D2D',
  bgColorCard: '#2A2A2A',
  bgColorWarm: '#2A2520',
  bgColorDisabled: '#333333',
  borderColorBase: '#444444',
  borderColorLight: '#333333',
  borderColorLighter: '#2A2A2A',
  borderColorDark: '#666666',
  tabBarColor: '#888888',
  tabBarBackground: '#2A2A2A',
}

// ========== 基础阴影（只有 primary 因主题色不同） ==========
export const BASE_SHADOWS = {
  xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
  sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
  base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
} as const

export const BASE_SHADOWS_DARK = {
  xs: '0 2rpx 8rpx rgba(0,0,0,0.08)',
  sm: '0 4rpx 16rpx rgba(0,0,0,0.12)',
  base: '0 8rpx 24rpx rgba(0,0,0,0.16)',
} as const

// ========== 默认主题 ==========
export const DEFAULT_THEME_ID: ThemeId = 'sea-salt-cheese'

// ========== 主题注册表 ==========
export const themeRegistry: Record<ThemeId, ThemeRegistration> = {
  'peach-milk': {
    id: 'peach-milk',
    name: '蜜桃奶芙',
    emoji: '🍑',
    description: '粉嫩少女心，甜到心里',
    light: {
      primaryColor: '#FFB6C1',
      primaryColorLight: '#FFD1DC',
      primaryColorDark: '#E89AA5',
      secondaryColor: '#B8E6D0',
      accentColor: '#FFD700',
      backgroundColor: '#FFF0F3',
      mascotBody: '#FFF8F0',
    },
    dark: { ...SHARED_DARK_SEED },
    shadows: { ...BASE_SHADOWS, primary: '0 8rpx 32rpx rgba(255,182,193,0.30)' },
    shadowsDark: { ...BASE_SHADOWS_DARK, primary: '0 8rpx 32rpx rgba(255,182,193,0.25)' },
  },

  'mint-forest': {
    id: 'mint-forest',
    name: '薄荷森林',
    emoji: '🌿',
    description: '清新自然风，元气满满',
    light: {
      primaryColor: '#7ED4A6',
      primaryColorLight: '#A8E4C4',
      primaryColorDark: '#5CB888',
      secondaryColor: '#B8E6D0',
      accentColor: '#FFD93D',
      backgroundColor: '#F0FFF5',
      mascotBody: '#F0FFF5',
    },
    dark: { ...SHARED_DARK_SEED },
    shadows: { ...BASE_SHADOWS, primary: '0 8rpx 32rpx rgba(126,212,166,0.30)' },
    shadowsDark: { ...BASE_SHADOWS_DARK, primary: '0 8rpx 32rpx rgba(126,212,166,0.25)' },
  },

  'caramel-cocoa': {
    id: 'caramel-cocoa',
    name: '焦糖可可',
    emoji: '🍫',
    description: '温暖治愈系，舒适惬意',
    light: {
      primaryColor: '#D4A574',
      primaryColorLight: '#E8C4A0',
      primaryColorDark: '#B8885A',
      secondaryColor: '#E8C4A0',
      accentColor: '#FF8C69',
      backgroundColor: '#FFF8F0',
      mascotBody: '#FFF8F0',
    },
    dark: { ...SHARED_DARK_SEED },
    shadows: { ...BASE_SHADOWS, primary: '0 8rpx 32rpx rgba(212,165,116,0.30)' },
    shadowsDark: { ...BASE_SHADOWS_DARK, primary: '0 8rpx 32rpx rgba(212,165,116,0.25)' },
  },

  'lavender-dream': {
    id: 'lavender-dream',
    name: '薰衣草梦境',
    emoji: '💜',
    description: '梦幻紫调，浪漫温柔',
    light: {
      primaryColor: '#B89AD4',
      primaryColorLight: '#D4B8E6',
      primaryColorDark: '#9A7CB6',
      secondaryColor: '#D4B8E6',
      accentColor: '#FFB6C1',
      backgroundColor: '#F8F0FF',
      mascotBody: '#F8F0FF',
    },
    dark: { ...SHARED_DARK_SEED },
    shadows: { ...BASE_SHADOWS, primary: '0 8rpx 32rpx rgba(184,154,212,0.30)' },
    shadowsDark: { ...BASE_SHADOWS_DARK, primary: '0 8rpx 32rpx rgba(184,154,212,0.25)' },
  },

  'lemon-bubble': {
    id: 'lemon-bubble',
    name: '柠檬气泡',
    emoji: '🍋',
    description: '活泼明亮，元气满满',
    light: {
      primaryColor: '#FFD93D',
      primaryColorLight: '#FFE88A',
      primaryColorDark: '#E6C235',
      secondaryColor: '#FFF3B0',
      accentColor: '#7ED4A6',
      backgroundColor: '#FFFCF0',
      mascotBody: '#FFFCF0',
    },
    dark: { ...SHARED_DARK_SEED },
    shadows: { ...BASE_SHADOWS, primary: '0 8rpx 32rpx rgba(255,217,61,0.30)' },
    shadowsDark: { ...BASE_SHADOWS_DARK, primary: '0 8rpx 32rpx rgba(255,217,61,0.25)' },
  },

  'sea-salt-cheese': {
    id: 'sea-salt-cheese',
    name: '海盐芝士',
    emoji: '🧀',
    description: '清爽海洋风，文艺清新',
    light: {
      primaryColor: '#8EC5E8',
      primaryColorLight: '#B8D4E8',
      primaryColorDark: '#6AA8CC',
      secondaryColor: '#B8D4E8',
      accentColor: '#FFD93D',
      backgroundColor: '#F0F8FF',
      mascotBody: '#F0F8FF',
    },
    dark: { ...SHARED_DARK_SEED },
    shadows: { ...BASE_SHADOWS, primary: '0 8rpx 32rpx rgba(142,197,232,0.30)' },
    shadowsDark: { ...BASE_SHADOWS_DARK, primary: '0 8rpx 32rpx rgba(142,197,232,0.25)' },
  },

  'sakura-love': {
    id: 'sakura-love',
    name: '樱花之恋',
    emoji: '🌸',
    description: '浪漫粉色，甜美可爱',
    light: {
      primaryColor: '#FF8FAB',
      primaryColorLight: '#FFB8C8',
      primaryColorDark: '#E67090',
      secondaryColor: '#FFD6E0',
      accentColor: '#FFD93D',
      backgroundColor: '#FFF5F7',
      mascotBody: '#FFF5F7',
    },
    dark: { ...SHARED_DARK_SEED },
    shadows: { ...BASE_SHADOWS, primary: '0 8rpx 32rpx rgba(255,143,171,0.30)' },
    shadowsDark: { ...BASE_SHADOWS_DARK, primary: '0 8rpx 32rpx rgba(255,143,171,0.25)' },
  },
}

// ========== 工具函数 ==========

/** 获取指定主题注册 */
export function getTheme(id: ThemeId): ThemeRegistration {
  return themeRegistry[id]
}

/** 获取主题列表（用于页面展示） */
export function getThemeList(): ThemeRegistration[] {
  return Object.values(themeRegistry)
}
