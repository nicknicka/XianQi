/**
 * 分类图标映射配置
 * 将后端返回的 icon code 映射为显示图标
 */

export interface CategoryIconConfig {
  emoji: string        // Emoji 图标
  gradient: string     // 渐变色背景
}

// 分类图标映射表
const CATEGORY_ICON_MAP: Record<string, CategoryIconConfig> = {
  // 数码产品
  'digital': {
    emoji: '📱',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  // 书籍教材
  'books': {
    emoji: '📚',
    gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
  },
  // 生活用品
  'daily': {
    emoji: '🏠',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  },
  // 服装鞋帽
  'clothing': {
    emoji: '👕',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  },
  // 运动器材
  'sports': {
    emoji: '⚽',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
  },
  // 美妆护肤
  'beauty': {
    emoji: '💄',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  },
  // 食品零食
  'food': {
    emoji: '🍔',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  // 其他物品
  'other': {
    emoji: '📦',
    gradient: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)'
  },
  // 桌面电竞
  'desktop': {
    emoji: '🖥️',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  // 手机平板
  'mobile': {
    emoji: '📲',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  // 摄影摄像
  'camera': {
    emoji: '📷',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  },
  // 智能设备
  'smart': {
    emoji: '⌚',
    gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
  },
  // 游戏设备
  'game': {
    emoji: '🎮',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  // 乐器
  'instrument': {
    emoji: '🎸',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  }
}

/**
 * 获取分类图标配置
 * @param iconCode 后端返回的图标代码
 * @returns 图标配置（包含 emoji 和渐变色）
 */
export function getCategoryIcon(iconCode: string): CategoryIconConfig {
  return CATEGORY_ICON_MAP[iconCode] || {
    emoji: '📦',
    gradient: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)'
  }
}

/**
 * 获取分类图标 emoji
 * @param iconCode 后端返回的图标代码
 * @returns emoji 字符串
 */
export function getCategoryEmoji(iconCode: string): string {
  return getCategoryIcon(iconCode).emoji
}

/**
 * 获取分类图标渐变色
 * @param iconCode 后端返回的图标代码
 * @returns 渐变色 CSS 字符串
 */
export function getCategoryGradient(iconCode: string): string {
  return getCategoryIcon(iconCode).gradient
}
