/** 认证语义色到主题运行时色的统一映射。 */

import type { AuthenticationSemanticColor } from './auth-state'
import { useThemeColors } from '@/utils/theme'

export type AuthPanelSemanticColor = AuthenticationSemanticColor | 'neutral'

export type AuthSemanticColorMap = Record<AuthPanelSemanticColor, string>

export function useAuthSemanticColors(): AuthSemanticColorMap {
  const {
    infoColor,
    primaryColor,
    successColor,
    dangerColor,
    textColorTertiary
  } = useThemeColors()

  return {
    info: infoColor,
    primary: primaryColor,
    success: successColor,
    danger: dangerColor,
    neutral: textColorTertiary
  }
}
