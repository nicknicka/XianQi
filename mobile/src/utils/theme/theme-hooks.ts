/**
 * 三层字典主题系统 - Hooks
 *
 * 4 个 hook 的签名和返回值与旧版完全一致，确保向后兼容。
 */

import { computed } from 'vue'
import type { ThemeId, ThemeRegistration } from './theme-seed'
import { themeManager, reactiveCSSVars } from './theme-manager'
import { getTheme, getThemeList, SHARED_COLORS } from './theme-registry'
import { resolveTheme } from './theme-derive'

/**
 * 主题操作 hook
 * 提供主题切换、重置等操作方法
 */
export const useTheme = () => ({
  theme: themeManager.getTheme(),
  presetId: themeManager.getPresetId(),
  currentPreset: themeManager.getCurrentRegistration(),
  switchPreset: (id: ThemeId) => themeManager.switchPreset(id),
  switchTheme: (name: string) => themeManager.switchTheme(name),
  updatePrimaryColor: (color: string) => themeManager.updatePrimaryColor(color),
  updateFontSizeScale: (scale: number) => themeManager.updateFontSizeScale(scale),
  toggleDarkMode: () => themeManager.toggleDarkMode(),
  updateBorderRadiusSize: (size: string) => themeManager.updateBorderRadiusSize(size),
  resetTheme: () => themeManager.resetTheme(),
  addListener: (listener: (presetId: ThemeId) => void) => themeManager.addListener(listener),
  applyTheme: () => themeManager.applyTheme(),
})

/**
 * 页面级主题 hook - 在页面 onShow 中调用
 *
 * 三件事：
 * 1. getCSSVars() → 从 storage 读取最新 presetId → resolveTheme → 刷新 reactiveCSSVars
 *    （小程序每个页面有独立 JS 上下文，模块级 ref 不共享，必须重新生成）
 * 2. injectCSSVarsToCurrentPage() → 将 CSS 变量注入到页面根元素
 * 3. applyNavigationBarColor / applyBackgroundColor → 原生组件颜色跟随主题
 */
export const useThemePage = () => {
  const pageName = (() => {
    try {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      return current?.route || 'unknown'
    } catch {
      return 'unknown'
    }
  })()

  console.log(`[Theme] === useThemePage 开始 === 页面: ${pageName}`)

  // 强制从 storage 刷新配置（跨页面实例同步）
  themeManager.reloadConfig()

  const presetId = themeManager.getPresetId()
  const registration = themeManager.getCurrentRegistration()
  const isDark = themeManager.getIsDark()
  const fontSizeScale = themeManager.getFontSizeScale()

  console.log(`[Theme] 加载配置: presetId=${presetId}, isDark=${isDark}, fontSizeScale=${fontSizeScale}`)
  console.log(`[Theme] 种子色: primaryColor=${registration.light.primaryColor}, secondaryColor=${registration.light.secondaryColor}, accentColor=${registration.light.accentColor}`)
  console.log(`[Theme] 背景色: ${registration.light.backgroundColor}`)

  // 重新生成响应式 CSS 变量（确保 :style="themeStyle" 拿到最新值）
  const cssVars = themeManager.getCSSVars()
  console.log(`[Theme] 生成 CSS 变量数量: ${Object.keys(cssVars).length}`)
  console.log(`[Theme] --primary-color=${cssVars['--primary-color']}, --bg-color-page=${cssVars['--bg-color-page']}, --bg-color-card=${cssVars['--bg-color-card']}`)

  // 注入到页面根元素（直接传入 CSS 变量，不依赖 storage）
  themeManager.injectCSSVarsToCurrentPage(cssVars)

  // 原生组件颜色
  themeManager.applyNavigationBarColor()
  themeManager.applyBackgroundColor()

  console.log(`[Theme] === useThemePage 完成 ===`)
}

/**
 * 响应式主题样式 hook - 在页面根元素通过 :style="themeStyle" 绑定
 * 解决小程序环境 el.style.setProperty 不生效的问题
 *
 * 小程序 :style 绑定注意事项：
 * 1. 对象形式的 CSS 变量（--xxx）可能不被正确处理
 * 2. CSS 变量通过 :style 设置后，样式表中的 var() 可能无法引用
 * 3. 返回具体的颜色值，供模板直接使用
 */
export const useThemeStyle = () => {
  console.log('[Theme] useThemeStyle 被调用')

  // 确保 CSS 变量已生成（首次调用时可能为空）
  if (Object.keys(reactiveCSSVars.value).length === 0) {
    console.log('[Theme] useThemeStyle - CSS变量为空，触发生成')
    themeManager.getCSSVars()
  }

  // 将 CSS 变量对象转换为字符串格式
  const themeStyle = computed(() => {
    const vars = reactiveCSSVars.value
    console.log(`[Theme] themeStyle computed - 变量数量: ${Object.keys(vars).length}`)
    if (Object.keys(vars).length === 0) {
      console.log('[Theme] useThemeStyle - computed 中变量仍为空，重新生成')
      themeManager.getCSSVars()
      return ''
    }

    // 生成 CSS 变量字符串
    const styleStr = Object.entries(vars)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')

    console.log(`[Theme] useThemeStyle 生成样式字符串长度: ${styleStr.length}`)
    return styleStr
  })

  // 直接返回颜色值（小程序兼容）- 保持响应式
  const themeColors = computed(() => {
    const vars = reactiveCSSVars.value
    console.log(`[Theme] themeColors computed 被调用 - 变量数量: ${Object.keys(vars).length}`)
    // 如果为空，先触发生成
    if (Object.keys(vars).length === 0) {
      console.log('[Theme] themeColors - 变量为空，触发生成')
      themeManager.getCSSVars()
    }
    const colors = {
      primaryColor: vars['--primary-color'] || '#8ec5e8',
      bgColorPage: vars['--bg-color-page'] || '#f5f5f5',
      bgColorCard: vars['--bg-color-card'] || '#ffffff',
      textColorPrimary: vars['--text-color-primary'] || '#333333',
      textColorSecondary: vars['--text-color-secondary'] || '#666666',
      // 以下两项由 theme-derive 生成为 CSS 变量，此前未在此处暴露，
      // 导致页面解构后拿到 undefined（图标颜色/边框色失效）。
      textColorTertiary: vars['--text-color-tertiary'] || '#999999',
      borderColorBase: vars['--border-color-base'] || '#E8E8E8',
    }
    console.log(`[Theme] themeColors computed - bgColorPage: ${colors.bgColorPage}`)
    return colors
  })

  return { themeStyle, themeColors }
}

/**
 * 获取当前主题颜色值（供 uni-icons 等组件的 color 属性使用）
 * HTML 属性无法使用 CSS 变量，需要通过 JS 获取当前值
 */
export const useThemeColors = () => {
  const registration = themeManager.getCurrentRegistration()
  const seed = registration.light
  const vars = resolveTheme(registration, themeManager.getIsDark(), themeManager.getFontSizeScale())
  console.log(`[Theme] useThemeColors 加载颜色: primaryColor=${seed.primaryColor}, accentColor=${seed.accentColor}, backgroundColor=${seed.backgroundColor}`)
  return {
    primaryColor: seed.primaryColor,
    primaryColorLight: seed.primaryColorLight,
    primaryColorDark: seed.primaryColorDark,
    secondaryColor: seed.secondaryColor,
    accentColor: seed.accentColor,
    successColor: SHARED_COLORS.successColor,
    warningColor: SHARED_COLORS.warningColor,
    dangerColor: SHARED_COLORS.dangerColor,
    infoColor: SHARED_COLORS.infoColor,
    // 页面（图标/边框/卡片背景）需要用到的语义色。
    // 这些值由派生层生成，不能从只有种子色的 light 对象读取。
    bgColorCard: vars['--bg-color-card'],
    textColorPrimary: vars['--text-color-primary'],
    textColorTertiary: vars['--text-color-tertiary'],
    borderColorBase: vars['--border-color-base'],
  }
}
