/**
 * 三层字典主题系统 - 主题管理器
 *
 * 精简版：getCSSVars() = 一行 resolveTheme() 调用
 * 保持所有公开 API 不变，确保向后兼容
 */

import { ref, type Ref } from 'vue'
import type { ThemeId, ThemeConfig } from './theme-seed'
import { themeRegistry, DEFAULT_THEME_ID, getTheme } from './theme-registry'
import { resolveTheme } from './theme-derive'

/** 响应式 CSS 变量（用于小程序 :style 绑定） */
const reactiveCSSVars: Ref<Record<string, string>> = ref({})

/** 字体大小预设 */
export const fontSizeScales = {
  small: 0.85,
  normal: 1.0,
  large: 1.15,
}

/**
 * 向后兼容的旧版 ThemeConfig
 * 部分 API（getTheme / switchTheme / updateBorderRadiusSize）仍引用此类型
 */
interface LegacyThemeConfig {
  primaryColor: string
  fontSizeScale: number
  isDark: boolean
  borderRadiusSize: string
  themeName: string
}

/**
 * 三层字典主题管理器
 */
class ThemeManager {
  private currentPresetId: ThemeId = DEFAULT_THEME_ID
  private fontSizeScale: number = 1.0
  private isDark: boolean = false
  private listeners: Array<(presetId: ThemeId) => void> = []
  private storageKey = 'app_cute_theme_config'
  private _loaded = false

  // ========== 读取器 ==========

  /** 获取当前预设ID */
  getPresetId(): ThemeId {
    this.ensureLoaded()
    return this.currentPresetId
  }

  /** 获取当前主题注册条目 */
  getCurrentRegistration() {
    return getTheme(this.getPresetId())
  }

  /** 获取字体缩放 */
  getFontSizeScale(): number {
    this.ensureLoaded()
    return this.fontSizeScale
  }

  /** 获取深色模式状态 */
  getIsDark(): boolean {
    this.ensureLoaded()
    return this.isDark
  }

  /**
   * 向后兼容：获取旧版 ThemeConfig
   * @deprecated 使用 getPresetId() / getCurrentRegistration() 替代
   */
  getTheme(): LegacyThemeConfig {
    const registration = this.getCurrentRegistration()
    return {
      primaryColor: registration.light.primaryColor,
      fontSizeScale: this.fontSizeScale,
      isDark: this.isDark,
      borderRadiusSize: 'large',
      themeName: 'custom',
    }
  }

  // ========== 核心方法 ==========

  /**
   * 生成完整 CSS 变量集合（80+ 个）
   * 从 200 行硬编码简化为一行 resolveTheme() 调用
   */
  getCSSVars(): Record<string, string> {
    const registration = this.getCurrentRegistration()
    const allVars = resolveTheme(registration, this.isDark, this.fontSizeScale)
    console.log(`[ThemeManager] getCSSVars - 生成变量数量: ${Object.keys(allVars).length}`)
    console.log(`[ThemeManager] getCSSVars - --bg-color-page: ${allVars['--bg-color-page']}`)
    reactiveCSSVars.value = { ...allVars }
    console.log(`[ThemeManager] getCSSVars - reactiveCSSVars.value 已更新`)
    return allVars
  }

  /**
   * 应用主题到页面
   */
  applyTheme() {
    const cssVars = this.getCSSVars()
    const pageStyle = Object.entries(cssVars)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n')

    // #ifdef H5
    try {
      const styleId = 'theme-dynamic-style'
      let styleEl = document.getElementById(styleId) as HTMLStyleElement

      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = styleId
        document.head.appendChild(styleEl)
      }

      styleEl.innerHTML = `
        :root {
          ${pageStyle}
        }
        page {
          ${pageStyle}
        }
      `
    } catch (e) {
      console.error('应用主题失败:', e)
    }
    // #endif

    // #ifndef H5
    try {
      this.applyPageCSSVars(cssVars)
      this.applyNavigationBarColor()
      this.applyTabBarStyle()
      this.applyBackgroundColor()
    } catch (_e) {
      console.error('应用导航栏/TabBar主题失败:', _e)
    }
    // #endif

    this.listeners.forEach(listener => listener(this.currentPresetId))
    this.saveConfig()
  }

  // ========== 切换方法 ==========

  /** 切换主题预设 */
  switchPreset(presetId: ThemeId) {
    if (themeRegistry[presetId]) {
      this.currentPresetId = presetId
      this.applyTheme()
    }
  }

  /** @deprecated 向后兼容，使用 switchPreset() 替代 */
  switchTheme(_themeName: string) {
    this.applyTheme()
  }

  /** 更新字体大小 */
  updateFontSizeScale(scale: number) {
    this.fontSizeScale = Math.max(0.8, Math.min(1.3, scale))
    this.applyTheme()
  }

  /** 切换深色/浅色模式 */
  toggleDarkMode() {
    this.isDark = !this.isDark
    this.applyTheme()
  }

  /** @deprecated 向后兼容 */
  updateBorderRadiusSize(_size: string) {
    this.applyTheme()
  }

  /** @deprecated 向后兼容 */
  updatePrimaryColor(_color: string) {
    this.applyTheme()
  }

  /** 重置为默认主题 */
  resetTheme() {
    this.currentPresetId = DEFAULT_THEME_ID
    this.fontSizeScale = 1.0
    this.isDark = false
    this.applyTheme()
  }

  /** 添加主题变化监听器 */
  addListener(listener: (presetId: ThemeId) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // ========== 小程序专用方法 ==========

  /** 小程序：存储 CSS 变量到全局 storage */
  private applyPageCSSVars(cssVars: Record<string, string>) {
    try {
      if (typeof uni === 'undefined') return
      uni.setStorageSync('theme_css_vars', JSON.stringify(cssVars))
      console.log('[ThemeManager] applyPageCSSVars - 已存储CSS变量到storage')
      // 尝试注入到当前页面
      this.injectCSSVarsToCurrentPage(cssVars)
    } catch (e) {
      console.error('存储主题CSS变量失败:', e)
    }
  }

  /**
   * 将 CSS 变量注入到当前页面根元素
   * 小程序环境下，CSS 变量需要设置到 page 元素上才能被样式表引用
   * @param cssVars 可选的 CSS 变量对象，如果不传则从 storage 读取
   */
  injectCSSVarsToCurrentPage(cssVars?: Record<string, string>) {
    try {
      // 优先使用传入的 cssVars，否则从 storage 读取
      let varsToInject: Record<string, string> | undefined = cssVars
      if (!varsToInject) {
        const varsStr = uni.getStorageSync('theme_css_vars')
        if (!varsStr) {
          console.log('[ThemeManager] injectCSSVarsToCurrentPage - storage为空，无CSS变量可注入')
          return
        }
        varsToInject = JSON.parse(varsStr) as Record<string, string>
      }
      if (!varsToInject) return

      console.log(`[ThemeManager] injectCSSVarsToCurrentPage - 准备注入 ${Object.keys(varsToInject).length} 个CSS变量`)
      console.log(`[ThemeManager] 注入的关键变量: --primary-color=${varsToInject['--primary-color']}, --bg-color-page=${varsToInject['--bg-color-page']}`)

      // 小程序环境：尝试使用 uni.setPageStyle (如果支持)
      // #ifndef H5
      try {
        // 将 CSS 变量转换为样式对象
        const pageStyle: Record<string, string> = {}
        Object.entries(varsToInject).forEach(([key, value]) => {
          // 移除 -- 前缀，转换为 camelCase
          const cssKey = key.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())
          pageStyle[cssKey] = value
        })

        // 尝试设置页面样式
        const pages = getCurrentPages()
        if (pages.length > 0) {
          const currentPage = pages[pages.length - 1] as any
          // 检查是否有 $page 或 $setPageStyle 方法
          if (currentPage.$page?.setStyle) {
            console.log('[ThemeManager] 使用 page.$page.setStyle 设置样式')
            currentPage.$page.setStyle(pageStyle)
          }
        }
      } catch (e) {
        console.log('[ThemeManager] setPageStyle 不可用，使用备用方案:', e)
      }
      // #endif

      // 同时尝试设置到 view 元素（作为备用）
      const pages = getCurrentPages()
      if (pages.length === 0) {
        console.log('[ThemeManager] injectCSSVarsToCurrentPage - 没有活动页面')
        return
      }

      const page = pages[pages.length - 1] as any
      const vm = page.$vm || page
      const el = vm.$el

      if (el && el.style) {
        let injectedCount = 0
        Object.entries(varsToInject).forEach(([key, value]) => {
          el.style.setProperty(key, value)
          injectedCount++
        })
        console.log(`[ThemeManager] injectCSSVarsToCurrentPage - 成功注入 ${injectedCount} 个CSS变量到页面元素`)
      } else {
        console.log('[ThemeManager] injectCSSVarsToCurrentPage - 页面元素或style不存在')
      }
    } catch (e) {
      console.error('[ThemeManager] injectCSSVarsToCurrentPage 失败:', e)
    }
  }

  /** 动态设置导航栏颜色 */
  applyNavigationBarColor() {
    try {
      if (typeof uni === 'undefined') return
      const registration = this.getCurrentRegistration()
      const bgColor = registration.light.primaryColor
      const frontColor = this.isLightColor(bgColor) ? '#ffffff' : '#000000'

      uni.setNavigationBarColor({
        frontColor,
        backgroundColor: bgColor,
        animation: { duration: 300, timingFunc: 'easeIn' },
      })
    } catch (e) {
      console.error('设置导航栏颜色失败:', e)
    }
  }

  /** 动态设置页面背景色 */
  applyBackgroundColor() {
    try {
      if (typeof uni === 'undefined') return
      const registration = this.getCurrentRegistration()
      const bgColor = this.isDark ? '#1A1A1A' : registration.light.backgroundColor
      uni.setBackgroundColor({
        backgroundColor: bgColor,
        backgroundColorTop: bgColor,
        backgroundColorBottom: bgColor,
      })
    } catch (_e) {
      // 部分平台不支持
    }
  }

  /** 动态设置 TabBar 颜色 */
  applyTabBarStyle() {
    try {
      if (typeof uni === 'undefined') return
      const registration = this.getCurrentRegistration()
      const dark = registration.dark
      uni.setTabBarStyle({
        color: this.isDark ? dark.tabBarColor : '#AAAAAA',
        selectedColor: registration.light.primaryColor,
        backgroundColor: this.isDark ? dark.tabBarBackground : '#FFFFFF',
        borderStyle: 'black',
        fail: () => {},
      })
    } catch (_e) {
      // 非 TabBar 页面调用会失败
    }
  }

  // ========== 私有工具 ==========

  /** 判断颜色是否为浅色 */
  private isLightColor(color: string): boolean {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
  }

  /** 确保配置已加载 */
  private ensureLoaded() {
    if (!this._loaded) {
      this.loadConfig()
      this._loaded = true
    }
  }

  /**
   * 强制从 storage 重新加载配置
   * 小程序每个页面有独立 JS 上下文，ThemeManager 实例互相隔离。
   * 当用户在设置页切换主题后，其他页面需要在 onShow 时刷新。
   */
  reloadConfig() {
    console.log(`[ThemeManager] reloadConfig - 重新加载前: presetId=${this.currentPresetId}`)
    this._loaded = false
    this.loadConfig()
    console.log(`[ThemeManager] reloadConfig - 重新加载后: presetId=${this.currentPresetId}`)
  }

  /** 从本地存储加载 */
  private loadConfig() {
    try {
      if (typeof uni === 'undefined') return
      const saved = uni.getStorageSync(this.storageKey)
      console.log(`[ThemeManager] loadConfig - storage原始值: ${saved}`)
      if (saved) {
        const config: ThemeConfig = JSON.parse(saved)
        if (themeRegistry[config.presetId]) {
          this.currentPresetId = config.presetId
        }
        this.fontSizeScale = config.fontSizeScale ?? 1.0
        this.isDark = config.isDark ?? false
        console.log(`[ThemeManager] loadConfig - 解析结果: presetId=${this.currentPresetId}, fontSizeScale=${this.fontSizeScale}, isDark=${this.isDark}`)
      } else {
        console.log(`[ThemeManager] loadConfig - storage为空，使用默认值: presetId=${this.currentPresetId}`)
      }
    } catch (e) {
      console.error('加载主题配置失败:', e)
    }
  }

  /** 保存到本地存储 */
  private saveConfig() {
    try {
      if (typeof uni === 'undefined') return
      const config: ThemeConfig = {
        presetId: this.currentPresetId,
        fontSizeScale: this.fontSizeScale,
        isDark: this.isDark,
      }
      uni.setStorageSync(this.storageKey, JSON.stringify(config))
      console.log(`[ThemeManager] saveConfig - 已保存: ${JSON.stringify(config)}`)
    } catch (e) {
      console.error('保存主题配置失败:', e)
    }
  }
}

// 导出单例
export const themeManager = new ThemeManager()

// 导出响应式 CSS 变量（供 hooks 使用）
export { reactiveCSSVars }
