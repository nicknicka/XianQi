/**
 * 主题设置 API
 */
import { http } from '@/utils/request'

export interface ThemeConfig {
  currentTheme: string
  availableThemes: ThemeOption[]
  autoDarkMode: boolean
  fontSize: number
}

export interface ThemeOption {
  value: string
  name: string
  description: string
  preview: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
}

export const themeApi = {
  /**
   * 获取主题配置
   */
  getThemeConfig() {
    return http.get<ThemeConfig>('/user/theme')
  },

  /**
   * 更新主题设置
   */
  updateTheme(data: {
    currentTheme?: string
    autoDarkMode?: boolean
    fontSize?: number
  }) {
    const params = new URLSearchParams()
    if (data.currentTheme !== undefined) params.append('theme', data.currentTheme)
    if (data.autoDarkMode !== undefined) params.append('autoDarkMode', String(data.autoDarkMode))
    if (data.fontSize !== undefined) params.append('fontSize', String(data.fontSize))

    return http.put(`/user/theme?${params.toString()}`, undefined, { showLoading: true })
  },

  /**
   * 获取可用主题列表
   */
  getAvailableThemes() {
    return http.get<ThemeOption[]>('/public/themes')
  }
}

export default themeApi
