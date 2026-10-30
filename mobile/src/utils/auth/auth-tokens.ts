/**
 * 认证页面运行时组件参数。
 * uni-icons 等组件属性不能消费 CSS 变量，值集中在认证 token 真源中。
 */
export const AUTH_ICON_SIZES = {
  status: 48,
  card: 24,
  section: 20,
  benefit: 18,
  inline: 16,
  upload: 40
} as const

export const AUTH_PAGE_ANIMATION_DELAY_MS = 50
