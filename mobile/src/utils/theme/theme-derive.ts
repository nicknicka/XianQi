/**
 * 三层字典主题系统 - 派生引擎
 *
 * 核心职责：从 ~8 个种子色自动生成 80+ 个 CSS 变量。
 * 三层合并：静态共享层 + Alpha 派生层 + 种子层
 */

import type { ThemeRegistration, ThemeSeed } from './theme-seed'
import { SHARED_COLORS, SHARED_MASCOT_CHEEK } from './theme-registry'

// ========== 工具函数 ==========

/** hex 转 rgba */
export function addAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** hex 转 rgb 通道值，供 rgba(var(--primary-color-rgb), alpha) 使用 */
function hexToRgbTuple(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

// ========== 声明式 Alpha 派生配置 ==========

/** 种子色来源：ThemeSeed 的 key 或共享功能色的 key 或特殊值 */
type ColorSource = keyof ThemeSeed | 'successColor' | 'warningColor' | 'dangerColor' | 'infoColor' | 'primaryColorLight'

interface AlphaSpec {
  from: ColorSource
  /** 自定义 CSS 变量前缀（默认从 from 自动 kebab 转换） */
  prefix?: string
  alphas: number[]
}

const ALPHA_SPECS: AlphaSpec[] = [
  { from: 'primaryColor', alphas: [0.02, 0.03, 0.05, 0.06, 0.08, 0.10, 0.12, 0.15, 0.20, 0.25, 0.30, 0.40, 0.95] },
  { from: 'primaryColorLight', prefix: 'primary-light', alphas: [0.04, 0.08] },
  { from: 'dangerColor', alphas: [0.05, 0.06, 0.08, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.80, 0.95] },
  { from: 'successColor', alphas: [0.05, 0.08, 0.10, 0.15, 0.20, 0.30] },
  { from: 'warningColor', alphas: [0.10, 0.15, 0.20, 0.30, 0.85] },
  { from: 'infoColor', alphas: [0.10, 0.20, 0.30, 0.40] },
  { from: 'accentColor', alphas: [0.40] },
]

/** camelCase → kebab-case */
function camelToKebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/** 从种子中获取颜色值 */
function getSeedColor(
  from: string,
  seed: ThemeSeed,
  shared: typeof SHARED_COLORS,
): string {
  if (from in seed) return seed[from as keyof ThemeSeed]
  if (from in shared) return shared[from as keyof typeof shared]
  if (from === 'primaryColorLight') return seed.primaryColorLight
  return '#000000'
}

// ========== 静态共享层（所有主题都一样，只定义一次） ==========

export const STATIC_VARS: Record<string, string> = {
  // 字体
  '--auth-font-weight-semibold': '600',
  '--font-size-xs': '0.714em',
  '--font-size-sm': '0.857em',
  '--font-size-base': '1em',
  '--font-size-lg': '1.143em',
  '--font-size-xl': '1.286em',
  '--font-size-xxl': '1.429em',
  // 行高
  '--line-height-tight': '1.25',
  '--line-height-normal': '1.5',
  '--line-height-loose': '1.75',
  // 间距
  '--spacing-xs': '0.286em',
  '--spacing-sm': '0.571em',
  '--spacing-md': '0.857em',
  '--spacing-lg': '1.143em',
  '--spacing-xl': '1.714em',
  '--spacing-xxl': '2.286em',
  // 圆角
  '--border-radius-sm': '16px',
  '--border-radius-base': '20px',
  '--border-radius-lg': '24px',
  '--border-radius-xl': '32px',
  '--border-radius-round': '50%',
  '--border-radius-pill': '9999px',
  '--border-radius-card': '24rpx',
  '--border-radius-tab': '24rpx',
  // 认证组件规格：先服务实名认证分页，后续认证页面复用同一组组件 token。
  '--auth-page-min-height': '100vh',
  '--auth-page-padding': '24rpx',
  '--auth-card-padding': '32rpx',
  '--auth-card-padding-lg': '48rpx',
  '--auth-card-radius': '16rpx',
  '--auth-control-radius': '12rpx',
  '--auth-control-height': '88rpx',
  '--auth-control-padding-x': '24rpx',
  '--auth-section-gap': '24rpx',
  '--auth-label-gap': '12rpx',
  '--auth-tip-gap': '8rpx',
  '--auth-upload-height': '400rpx',
  '--auth-divider-width': '1px',
  // 认证动效规格：不引入一次性 duration / easing。
  '--motion-duration-fast': '200ms',
  '--motion-duration-base': '400ms',
  '--motion-duration-medium': '300ms',
  '--motion-duration-slow': '500ms',
  '--motion-delay-fast': '50ms',
  '--motion-delay-base': '100ms',
  '--motion-distance-page': '40rpx',
  '--motion-ease-standard': 'cubic-bezier(0.16, 1, 0.3, 1)',
  // z-index
  '--z-dropdown': '1000',
  '--z-sticky': '1020',
  '--z-fixed': '1030',
  '--z-modal-backdrop': '1040',
  '--z-modal': '1050',
  '--z-popover': '1060',
  '--z-tooltip': '1070',
}

// ========== 核心：resolveTheme ==========

/**
 * 从主题注册条目 + 运行时参数，生成完整的 CSS 变量字典
 *
 * @param registration 主题注册条目（包含 light/dark 种子、阴影等）
 * @param isDark 是否深色模式
 * @param fontSizeScale 字体缩放比例
 * @returns 完整的 CSS 变量字典（80+ 个）
 */
export function resolveTheme(
  registration: ThemeRegistration,
  isDark: boolean,
  fontSizeScale: number,
): Record<string, string> {
  const seed = registration.light
  const dark = registration.dark
  const shared = SHARED_COLORS
  const shadows = isDark ? registration.shadowsDark : registration.shadows

  const vars: Record<string, string> = {}

  // === 1. 静态共享层 ===
  Object.assign(vars, STATIC_VARS)

  // === 2. 字体基准（依赖 fontSizeScale） ===
  vars['--font-base'] = `${14 * fontSizeScale}px`

  // === 3. 种子色直接映射 ===
  vars['--primary-color'] = seed.primaryColor
  vars['--primary-color-rgb'] = hexToRgbTuple(seed.primaryColor)
  vars['--primary-color-light'] = seed.primaryColorLight
  vars['--primary-color-dark'] = seed.primaryColorDark
  vars['--primary-color-faded'] = addAlpha(seed.primaryColor, 0.15)
  vars['--secondary-color'] = seed.secondaryColor
  vars['--accent-color'] = seed.accentColor

  // === 4. 共享功能色 ===
  vars['--success-color'] = shared.successColor
  vars['--warning-color'] = shared.warningColor
  vars['--warning-color-dark'] = '#E6BF33'
  vars['--danger-color'] = shared.dangerColor
  vars['--info-color'] = shared.infoColor

  // === 5. 功能色背景（alpha 0.12） ===
  vars['--success-color-bg'] = addAlpha(shared.successColor, 0.12)
  vars['--warning-color-bg'] = addAlpha(shared.warningColor, 0.12)
  vars['--danger-color-bg'] = addAlpha(shared.dangerColor, 0.12)
  vars['--info-color-bg'] = addAlpha(shared.infoColor, 0.12)

  // === 6. Alpha 派生（声明式配置驱动） ===
  for (const spec of ALPHA_SPECS) {
    const colorValue = getSeedColor(spec.from, seed, shared)
    const prefix = spec.prefix ?? camelToKebab(spec.from as string)
    for (const alpha of spec.alphas) {
      const suffix = Math.round(alpha * 100)
      vars[`--${prefix}-alpha-${suffix}`] = addAlpha(colorValue, alpha)
    }
  }

  // === 7. 文字色 ===
  vars['--text-color-primary'] = isDark ? dark.textPrimary : shared.textPrimary
  vars['--text-color-secondary'] = isDark ? dark.textSecondary : shared.textSecondary
  vars['--text-color-tertiary'] = isDark ? dark.textTertiary : shared.textTertiary
  vars['--text-color-placeholder'] = isDark ? dark.textColorDisabled : '#CCCCCC'
  vars['--text-color-disabled'] = isDark ? dark.textColorDisabled : '#CCCCCC'
  vars['--text-color-inverse'] = isDark ? dark.textColorInverse : '#FFFFFF'

  // === 8. 背景色 ===
  vars['--bg-color-page'] = isDark ? dark.backgroundColor : seed.backgroundColor
  vars['--bg-color-card'] = isDark ? dark.bgColorCard : '#FFFFFF'
  vars['--bg-color-warm'] = isDark ? dark.bgColorWarm : seed.backgroundColor
  vars['--bg-color-disabled'] = isDark ? dark.bgColorDisabled : '#F5F5F5'
  vars['--bg-color-hover'] = isDark ? dark.bgColorDisabled : '#F5F5F5'
  vars['--bg-color-overlay'] = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)'

  // === 9. 边框色 ===
  vars['--border-color-base'] = isDark ? dark.borderColorBase : '#E8E8E8'
  vars['--border-color-light'] = isDark ? dark.borderColorLight : '#F0F0F0'
  vars['--border-color-lighter'] = isDark ? dark.borderColorLighter : '#FAFAFA'
  vars['--border-color-dark'] = isDark ? dark.borderColorDark : '#BFBFBF'

  // === 10. 阴影 ===
  vars['--box-shadow-xs'] = shadows.xs
  vars['--box-shadow-sm'] = shadows.sm
  vars['--box-shadow-base'] = shadows.base
  vars['--box-shadow-primary'] = shadows.primary
  vars['--box-shadow-card'] = `${shadows.base}, ${shadows.xs}`

  // === 11. Claymorphism 粘土阴影 ===
  if (isDark) {
    vars['--clay-shadow-card'] = '8rpx 8rpx 16rpx rgba(0,0,0,0.2), -4rpx -4rpx 12rpx rgba(255,255,255,0.05)'
    vars['--clay-shadow-card-pressed'] = 'inset 2rpx 2rpx 6rpx rgba(0,0,0,0.15), 2rpx 2rpx 8rpx rgba(0,0,0,0.1)'
    vars['--clay-shadow-btn'] = '4rpx 4rpx 12rpx rgba(0,0,0,0.2), -2rpx -2rpx 8rpx rgba(255,255,255,0.05)'
    vars['--clay-shadow-input'] = 'inset 2rpx 2rpx 6rpx rgba(0,0,0,0.1), inset -1rpx -1rpx 4rpx rgba(255,255,255,0.03)'
    vars['--clay-shadow-tag'] = '2rpx 2rpx 6rpx rgba(0,0,0,0.1), -1rpx -1rpx 4rpx rgba(255,255,255,0.03)'
  } else {
    vars['--clay-shadow-card'] = '8rpx 8rpx 16rpx rgba(0,0,0,0.06), -4rpx -4rpx 12rpx rgba(255,255,255,0.8)'
    vars['--clay-shadow-card-pressed'] = 'inset 2rpx 2rpx 6rpx rgba(0,0,0,0.06), 2rpx 2rpx 8rpx rgba(0,0,0,0.04)'
    vars['--clay-shadow-btn'] = '4rpx 4rpx 12rpx rgba(0,0,0,0.08), -2rpx -2rpx 8rpx rgba(255,255,255,0.5)'
    vars['--clay-shadow-input'] = 'inset 2rpx 2rpx 6rpx rgba(0,0,0,0.04), inset -1rpx -1rpx 4rpx rgba(255,255,255,0.5)'
    vars['--clay-shadow-tag'] = '2rpx 2rpx 6rpx rgba(0,0,0,0.04), -1rpx -1rpx 4rpx rgba(255,255,255,0.5)'
  }

  // === 12. 吉祥物配色 ===
  vars['--mascot-cheek-color'] = SHARED_MASCOT_CHEEK
  vars['--mascot-body-color'] = seed.mascotBody
  vars['--mascot-accent-color'] = seed.primaryColor
  vars['--mascot-shadow-color'] = addAlpha(seed.primaryColor, 0.20)

  // === 13. TabBar ===
  vars['--tab-bar-color'] = isDark ? dark.tabBarColor : '#AAAAAA'
  vars['--tab-bar-selected-color'] = seed.primaryColor
  vars['--tab-bar-background'] = isDark ? dark.tabBarBackground : '#FFFFFF'

  // === 14. 导航栏 ===
  vars['--nav-background'] = seed.primaryColor
  vars['--nav-text-style'] = isDark ? 'black' : 'white'

  return vars
}
