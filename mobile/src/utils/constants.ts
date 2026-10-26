/**
 * 常量定义
 */

// API 基础配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws'

// 存储 key
export const STORAGE_KEY = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  SEARCH_HISTORY: 'searchHistory',
  LOCATION: 'location'
}

// 订单状态
export const ORDER_STATUS = {
  PENDING_CONFIRM: 0, // 待确认
  IN_PROGRESS: 1, // 进行中
  COMPLETED: 2, // 已完成
  CANCELLED: 3, // 已取消
  REFUNDED: 4 // 已退款
}

// 订单状态文本
export const ORDER_STATUS_TEXT: Record<number, string> = {
  0: '待确认',
  1: '进行中',
  2: '已完成',
  3: '已取消',
  4: '已退款'
}

// 商品状态
export const PRODUCT_STATUS = {
  ON_SALE: 0, // 在售
  SOLD_OUT: 1, // 已售
  OFF_SHELF: 2 // 下架
}

// 商品成色
export const PRODUCT_CONDITION = {
  NEW: '全新',
  LIKE_NEW: '几乎全新',
  GOOD: '较好',
  FAIR: '一般',
  POOR: '较差'
}

// 共享预约状态
export const BOOKING_STATUS = {
  PENDING: 0, // 待审批
  APPROVED: 1, // 已批准
  REJECTED: 2, // 已拒绝
  IN_PROGRESS: 3, // 借用中
  COMPLETED: 4, // 已完成
  CANCELLED: 5 // 已取消
}

// 消息类型
export const MESSAGE_TYPE = {
  TEXT: 'text', // 文本
  IMAGE: 'image', // 图片
  PRODUCT_CARD: 'product_card', // 商品卡片
  ORDER_CARD: 'order_card', // 订单卡片
  QUOTE: 'quote', // 引用
  SYSTEM: 'system' // 系统通知
}

// 评价标签
export const EVALUATION_TAGS = {
  GOOD: ['诚信可靠', '回复及时', '商品不错', '性价比高', '发货迅速'],
  NEUTRAL: ['一般', '有待改进', '还可以'],
  BAD: ['不诚信', '回复慢', '商品不符', '态度差']
}

// 信用等级
export const CREDIT_LEVEL = {
  EXCELLENT: { name: '优秀', minScore: 90 },
  GOOD: { name: '良好', minScore: 75 },
  AVERAGE: { name: '中等', minScore: 60 },
  POOR: { name: '较差', minScore: 0 }
}

// 分页配置
export const PAGE_CONFIG = {
  PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 30, 50]
}

// 图片配置
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_COUNT: 9, // 最多9张
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}

// 颜色主题（海盐芝士默认色板）
export const THEME_COLORS = {
  PRIMARY: '#8EC5E8',
  PRIMARY_LIGHT: '#B8D4E8',
  PRIMARY_DARK: '#6AA8CC',
  SUCCESS: '#7ED4A6',
  WARNING: '#FFD666',
  ERROR: '#FF8A8A',
  INFO: '#9DC4FF'
}

export default {
  API_BASE_URL,
  WS_BASE_URL,
  STORAGE_KEY,
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PRODUCT_STATUS,
  PRODUCT_CONDITION,
  BOOKING_STATUS,
  MESSAGE_TYPE,
  EVALUATION_TAGS,
  CREDIT_LEVEL,
  PAGE_CONFIG,
  IMAGE_CONFIG,
  THEME_COLORS
}
