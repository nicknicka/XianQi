/**
 * 软萌简约主题系统 - 6套可爱风主题预设
 * 每个预设包含完整色板 + 吉祥物配色 + 阴影色
 */

import type { CuteThemePreset, CuteThemePresetId } from './theme-types'

/** 蜜桃奶芙 - 粉嫩少女心 */
const peachMilk: CuteThemePreset = {
  id: 'peach-milk',
  name: '蜜桃奶芙',
  description: '粉嫩少女心，甜到心里',
  emoji: '🍑',
  colors: {
    primaryColor: '#FFB6C1',
    primaryColorLight: '#FFD1DC',
    primaryColorDark: '#E89AA5',
    primaryColorFaded: 'rgba(255, 182, 193, 0.15)',
    secondaryColor: '#B8E6D0',
    accentColor: '#FFD700',
    backgroundColor: '#FFF0F3',
    successColor: '#7ED4A6',
    warningColor: '#FFD666',
    dangerColor: '#FF8A8A',
    infoColor: '#9DC4FF',
    textPrimary: '#2D2D2D',
    textSecondary: '#7A7A7A',
    textTertiary: '#AAAAAA'
  },
  shadows: {
    xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
    sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
    base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
    primary: '0 8rpx 32rpx rgba(255,182,193,0.30)'
  },
  mascot: {
    cheekColor: '#FFB6C1',
    bodyColor: '#FFF8F0',
    accentColor: '#FFB6C1',
    shadowColor: 'rgba(255,182,193,0.20)'
  }
}

/** 薄荷森林 - 清新自然 */
const mintForest: CuteThemePreset = {
  id: 'mint-forest',
  name: '薄荷森林',
  description: '清新自然风，元气满满',
  emoji: '🌿',
  colors: {
    primaryColor: '#7ED4A6',
    primaryColorLight: '#A8E4C4',
    primaryColorDark: '#5CB888',
    primaryColorFaded: 'rgba(126, 212, 166, 0.15)',
    secondaryColor: '#B8E6D0',
    accentColor: '#FFD93D',
    backgroundColor: '#F0FFF5',
    successColor: '#7ED4A6',
    warningColor: '#FFD666',
    dangerColor: '#FF8A8A',
    infoColor: '#9DC4FF',
    textPrimary: '#2D2D2D',
    textSecondary: '#7A7A7A',
    textTertiary: '#AAAAAA'
  },
  shadows: {
    xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
    sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
    base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
    primary: '0 8rpx 32rpx rgba(126,212,166,0.30)'
  },
  mascot: {
    cheekColor: '#FFB6C1',
    bodyColor: '#F0FFF5',
    accentColor: '#7ED4A6',
    shadowColor: 'rgba(126,212,166,0.20)'
  }
}

/** 焦糖可可 - 温暖治愈 (默认主题) */
const caramelCocoa: CuteThemePreset = {
  id: 'caramel-cocoa',
  name: '焦糖可可',
  description: '温暖治愈系，舒适惬意',
  emoji: '🍫',
  colors: {
    primaryColor: '#D4A574',
    primaryColorLight: '#E8C4A0',
    primaryColorDark: '#B8885A',
    primaryColorFaded: 'rgba(212, 165, 116, 0.15)',
    secondaryColor: '#E8C4A0',
    accentColor: '#FF8C69',
    backgroundColor: '#FFF8F0',
    successColor: '#7ED4A6',
    warningColor: '#FFD666',
    dangerColor: '#FF8A8A',
    infoColor: '#9DC4FF',
    textPrimary: '#2D2D2D',
    textSecondary: '#7A7A7A',
    textTertiary: '#AAAAAA'
  },
  shadows: {
    xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
    sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
    base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
    primary: '0 8rpx 32rpx rgba(212,165,116,0.30)'
  },
  mascot: {
    cheekColor: '#FFB6C1',
    bodyColor: '#FFF8F0',
    accentColor: '#D4A574',
    shadowColor: 'rgba(212,165,116,0.20)'
  }
}

/** 薰衣草梦境 - 梦幻紫色 */
const lavenderDream: CuteThemePreset = {
  id: 'lavender-dream',
  name: '薰衣草梦境',
  description: '梦幻紫调，浪漫温柔',
  emoji: '💜',
  colors: {
    primaryColor: '#B89AD4',
    primaryColorLight: '#D4B8E6',
    primaryColorDark: '#9A7CB6',
    primaryColorFaded: 'rgba(184, 154, 212, 0.15)',
    secondaryColor: '#D4B8E6',
    accentColor: '#FFB6C1',
    backgroundColor: '#F8F0FF',
    successColor: '#7ED4A6',
    warningColor: '#FFD666',
    dangerColor: '#FF8A8A',
    infoColor: '#9DC4FF',
    textPrimary: '#2D2D2D',
    textSecondary: '#7A7A7A',
    textTertiary: '#AAAAAA'
  },
  shadows: {
    xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
    sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
    base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
    primary: '0 8rpx 32rpx rgba(184,154,212,0.30)'
  },
  mascot: {
    cheekColor: '#FFB6C1',
    bodyColor: '#F8F0FF',
    accentColor: '#B89AD4',
    shadowColor: 'rgba(184,154,212,0.20)'
  }
}

/** 柠檬气泡 - 活泼明亮 */
const lemonBubble: CuteThemePreset = {
  id: 'lemon-bubble',
  name: '柠檬气泡',
  description: '活泼明亮，元气满满',
  emoji: '🍋',
  colors: {
    primaryColor: '#FFD93D',
    primaryColorLight: '#FFE88A',
    primaryColorDark: '#E6C235',
    primaryColorFaded: 'rgba(255, 217, 61, 0.15)',
    secondaryColor: '#FFF3B0',
    accentColor: '#7ED4A6',
    backgroundColor: '#FFFCF0',
    successColor: '#7ED4A6',
    warningColor: '#FFD666',
    dangerColor: '#FF8A8A',
    infoColor: '#9DC4FF',
    textPrimary: '#2D2D2D',
    textSecondary: '#7A7A7A',
    textTertiary: '#AAAAAA'
  },
  shadows: {
    xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
    sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
    base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
    primary: '0 8rpx 32rpx rgba(255,217,61,0.30)'
  },
  mascot: {
    cheekColor: '#FFB6C1',
    bodyColor: '#FFFCF0',
    accentColor: '#FFD93D',
    shadowColor: 'rgba(255,217,61,0.20)'
  }
}

/** 樱花之恋 - 浪漫粉色 */
const sakuraLove: CuteThemePreset = {
  id: 'sakura-love',
  name: '樱花之恋',
  description: '浪漫粉色，甜美可爱',
  emoji: '🌸',
  colors: {
    primaryColor: '#FF8FAB',
    primaryColorLight: '#FFB8C8',
    primaryColorDark: '#E67090',
    primaryColorFaded: 'rgba(255, 143, 171, 0.15)',
    secondaryColor: '#FFD6E0',
    accentColor: '#FFD93D',
    backgroundColor: '#FFF5F7',
    successColor: '#7ED4A6',
    warningColor: '#FFD666',
    dangerColor: '#FF8A8A',
    infoColor: '#9DC4FF',
    textPrimary: '#2D2D2D',
    textSecondary: '#7A7A7A',
    textTertiary: '#AAAAAA'
  },
  shadows: {
    xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
    sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
    base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
    primary: '0 8rpx 32rpx rgba(255,143,171,0.30)'
  },
  mascot: {
    cheekColor: '#FF8FAB',
    bodyColor: '#FFF5F7',
    accentColor: '#FF8FAB',
    shadowColor: 'rgba(255,143,171,0.20)'
  }
}

/** 海盐芝士 - 清爽蓝色 (默认主题) */
const seaSaltCheese: CuteThemePreset = {
  id: 'sea-salt-cheese',
  name: '海盐芝士',
  description: '清爽海洋风，文艺清新',
  emoji: '🧀',
  colors: {
    primaryColor: '#8EC5E8',
    primaryColorLight: '#B8D4E8',
    primaryColorDark: '#6AA8CC',
    primaryColorFaded: 'rgba(142, 197, 232, 0.15)',
    secondaryColor: '#B8D4E8',
    accentColor: '#FFD93D',
    backgroundColor: '#F0F8FF',
    successColor: '#7ED4A6',
    warningColor: '#FFD666',
    dangerColor: '#FF8A8A',
    infoColor: '#9DC4FF',
    textPrimary: '#2D2D2D',
    textSecondary: '#7A7A7A',
    textTertiary: '#AAAAAA'
  },
  shadows: {
    xs: '0 2rpx 8rpx rgba(0,0,0,0.04)',
    sm: '0 4rpx 16rpx rgba(0,0,0,0.06)',
    base: '0 8rpx 24rpx rgba(0,0,0,0.08)',
    primary: '0 8rpx 32rpx rgba(142,197,232,0.30)'
  },
  mascot: {
    cheekColor: '#FFB6C1',
    bodyColor: '#F0F8FF',
    accentColor: '#8EC5E8',
    shadowColor: 'rgba(142,197,232,0.20)'
  }
}

/** 所有主题预设映射 */
export const cuteThemePresets: Record<CuteThemePresetId, CuteThemePreset> = {
  'peach-milk': peachMilk,
  'mint-forest': mintForest,
  'caramel-cocoa': caramelCocoa,
  'lavender-dream': lavenderDream,
  'lemon-bubble': lemonBubble,
  'sea-salt-cheese': seaSaltCheese,
  'sakura-love': sakuraLove
}

/** 主题预设列表(用于页面展示) */
export const cuteThemePresetList: CuteThemePreset[] = [
  peachMilk,
  mintForest,
  caramelCocoa,
  lavenderDream,
  lemonBubble,
  seaSaltCheese,
  sakuraLove
]

/** 默认主题ID */
export const DEFAULT_PRESET_ID: CuteThemePresetId = 'sea-salt-cheese'

/** 获取指定主题预设 */
export function getPreset(id: CuteThemePresetId): CuteThemePreset {
  return cuteThemePresets[id]
}
