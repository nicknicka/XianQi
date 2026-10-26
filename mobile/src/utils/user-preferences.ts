/**
 * 用户样式偏好 - 响应式管理
 *
 * 存储用户的自定义颜色偏好，供主题设置页面使用。
 * 与三层字典主题系统协同工作：预设主题覆盖偏好，偏好提供细粒度自定义。
 */

import { ref, type Ref } from 'vue'

const STORAGE_KEY = 'user_style_preferences'

/** 用户样式偏好接口 */
export interface UserStylePreferences {
  primaryColor: string
  primaryColorLight: string
  primaryColorDark: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  successColor: string
  warningColor: string
  dangerColor: string
  infoColor: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  bgPage: string
  bgCard: string
  bgWarm: string
  bgDisabled: string
  borderLight: string
  borderBase: string
  borderDark: string
}

const defaultPreferences: UserStylePreferences = {
  primaryColor: '#8EC5E8',
  primaryColorLight: '#B8D4E8',
  primaryColorDark: '#6AA8CC',
  secondaryColor: '#B8D4E8',
  accentColor: '#FFD93D',
  backgroundColor: '#F0F8FF',
  successColor: '#7ED4A6',
  warningColor: '#FFD666',
  dangerColor: '#FF8A8A',
  infoColor: '#9DC4FF',
  textPrimary: '#2D2D2D',
  textSecondary: '#7A7A7A',
  textTertiary: '#AAAAAA',
  bgPage: '#F0F8FF',
  bgCard: '#FFFFFF',
  bgWarm: '#F0F8FF',
  bgDisabled: '#F5F5F5',
  borderLight: '#F0F0F0',
  borderBase: '#E8E8E8',
  borderDark: '#BFBFBF',
}

/** 响应式偏好数据 */
const preferences: Ref<UserStylePreferences> = ref({ ...defaultPreferences })

/** 从本地存储加载 */
function loadPreferences(): void {
  try {
    if (typeof uni === 'undefined') return
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      preferences.value = { ...defaultPreferences, ...parsed }
    }
  } catch (_e) {
    // 加载失败使用默认值
  }
}

/** 保存到本地存储 */
function savePreferences(): void {
  try {
    if (typeof uni === 'undefined') return
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(preferences.value))
  } catch (_e) {
    // 保存失败静默处理
  }
}

/** 响应式用户偏好 hook */
export function useReactiveUserPreferences() {
  loadPreferences()

  function updatePreferences(newPrefs: Partial<UserStylePreferences>): void {
    preferences.value = { ...preferences.value, ...newPrefs }
    savePreferences()
  }

  return {
    preferences,
    updatePreferences,
  }
}
