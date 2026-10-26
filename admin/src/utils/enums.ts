/**
 * 统一枚举定义
 * 用于前后端枚举值的一致性管理
 */

// ==================== 通用状态枚举 ====================

/**
 * 通用启用状态
 */
export enum EnableStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1,  // 启用
}

export const EnableStatusText: Record<EnableStatus, string> = {
  [EnableStatus.DISABLED]: '禁用',
  [EnableStatus.ENABLED]: '启用',
}

// ==================== 用户相关枚举 ====================

/**
 * 用户状态
 */
export enum UserStatus {
  NORMAL = 0,    // 正常
  BANNED = 1,    // 已封禁
}

export const UserStatusText: Record<UserStatus, string> = {
  [UserStatus.NORMAL]: '正常',
  [UserStatus.BANNED]: '已封禁',
}

/**
 * 实名认证状态
 */
export enum VerificationStatus {
  PENDING = 0,   // 待审核
  APPROVED = 1,  // 已通过
  REJECTED = 2,  // 已拒绝
}

export const VerificationStatusText: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: '待审核',
  [VerificationStatus.APPROVED]: '已通过',
  [VerificationStatus.REJECTED]: '已拒绝',
}

// ==================== 商品相关枚举 ====================

/**
 * 商品状态
 */
export enum ProductStatus {
  OFFLINE = 0,   // 下架
  ON_SALE = 1,   // 在售
  SOLD_OUT = 2,  // 已售
  RESERVED = 3,  // 预订
  DRAFT = 4,     // 草稿
}

export const ProductStatusText: Record<ProductStatus, string> = {
  [ProductStatus.OFFLINE]: '下架',
  [ProductStatus.ON_SALE]: '在售',
  [ProductStatus.SOLD_OUT]: '已售',
  [ProductStatus.RESERVED]: '预订',
  [ProductStatus.DRAFT]: '草稿',
}

/**
 * 商品成色
 */
export enum ProductCondition {
  BRAND_NEW = 1,      // 全新
  LIKE_NEW_90 = 2,    // 九成新
  GOOD_80 = 3,        // 八成新
  FAIR_70 = 4,        // 七成新
  POOR_60 = 5,        // 六成新及以下
}

export const ProductConditionText: Record<ProductCondition, string> = {
  [ProductCondition.BRAND_NEW]: '全新',
  [ProductCondition.LIKE_NEW_90]: '九成新',
  [ProductCondition.GOOD_80]: '八成新',
  [ProductCondition.FAIR_70]: '七成新',
  [ProductCondition.POOR_60]: '六成新及以下',
}

/**
 * 商品审核状态
 */
export enum ProductAuditStatus {
  PENDING = 0,   // 待审核
  APPROVED = 1,  // 审核通过
  REJECTED = 2,  // 审核拒绝
}

export const ProductAuditStatusText: Record<ProductAuditStatus, string> = {
  [ProductAuditStatus.PENDING]: '待审核',
  [ProductAuditStatus.APPROVED]: '审核通过',
  [ProductAuditStatus.REJECTED]: '审核拒绝',
}

// ==================== 订单相关枚举 ====================

/**
 * 订单状态
 */
export enum OrderStatus {
  PENDING = 0,      // 待确认
  IN_PROGRESS = 1,  // 进行中
  COMPLETED = 2,    // 已完成
  CANCELLED = 3,    // 已取消
  REFUNDING = 4,    // 退款中
}

export const OrderStatusText: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待确认',
  [OrderStatus.IN_PROGRESS]: '进行中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDING]: '退款中',
}

// ==================== 评价相关枚举 ====================

/**
 * 评价对象类型
 */
export enum EvaluationTargetType {
  SELLER = 1,  // 评价卖家
  BUYER = 2,   // 评价买家
}

export const EvaluationTargetTypeText: Record<EvaluationTargetType, string> = {
  [EvaluationTargetType.SELLER]: '评价卖家',
  [EvaluationTargetType.BUYER]: '评价买家',
}

// ==================== 反馈相关枚举 ====================

/**
 * 用户反馈类型
 */
export enum FeedbackType {
  SUGGESTION = 1,  // 功能建议
  BUG = 2,         // Bug反馈
  COMPLAINT = 3,   // 投诉
  OTHER = 4,       // 其他
}

export const FeedbackTypeText: Record<FeedbackType, string> = {
  [FeedbackType.SUGGESTION]: '功能建议',
  [FeedbackType.BUG]: 'Bug反馈',
  [FeedbackType.COMPLAINT]: '投诉',
  [FeedbackType.OTHER]: '其他',
}

/**
 * 用户反馈状态
 */
export enum FeedbackStatus {
  PENDING = 0,     // 待处理
  PROCESSING = 1,  // 处理中
  PROCESSED = 2,   // 已处理
  REJECTED = 3,    // 已驳回
}

export const FeedbackStatusText: Record<FeedbackStatus, string> = {
  [FeedbackStatus.PENDING]: '待处理',
  [FeedbackStatus.PROCESSING]: '处理中',
  [FeedbackStatus.PROCESSED]: '已处理',
  [FeedbackStatus.REJECTED]: '已驳回',
}

// ==================== 举报相关枚举 ====================

/**
 * 举报状态
 */
export enum ReportStatus {
  PENDING = 0,    // 待处理
  PROCESSED = 1,  // 已处理
  REJECTED = 2,   // 已驳回
}

export const ReportStatusText: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: '待处理',
  [ReportStatus.PROCESSED]: '已处理',
  [ReportStatus.REJECTED]: '已驳回',
}

/**
 * 举报原因
 */
export enum ReportReason {
  FRAUD = '欺诈',
  HARASSMENT = '骚扰',
  FAKE_INFO = '虚假信息',
  OTHER = '其他',
}

// ==================== 敏感词相关枚举 ====================

/**
 * 敏感词类型
 */
export enum SensitiveWordType {
  FORBIDDEN = 1,  // 禁止词
  SENSITIVE = 2,  // 敏感词
  REPLACEMENT = 3, // 替换词
}

export const SensitiveWordTypeText: Record<SensitiveWordType, string> = {
  [SensitiveWordType.FORBIDDEN]: '禁止词',
  [SensitiveWordType.SENSITIVE]: '敏感词',
  [SensitiveWordType.REPLACEMENT]: '替换词',
}

/**
 * 敏感词等级
 */
export enum SensitiveWordLevel {
  NORMAL = 1,  // 一般
  SEVERE = 2,  // 严重
}

export const SensitiveWordLevelText: Record<SensitiveWordLevel, string> = {
  [SensitiveWordLevel.NORMAL]: '一般',
  [SensitiveWordLevel.SEVERE]: '严重',
}

// ==================== 轮播图相关枚举 ====================

/**
 * 轮播图链接类型
 */
export enum BannerLinkType {
  NONE = 1,         // 无
  EXTERNAL = 2,     // 外链
  PRODUCT = 3,      // 商品详情
  FUNCTION = 4,     // 功能页面
}

export const BannerLinkTypeText: Record<BannerLinkType, string> = {
  [BannerLinkType.NONE]: '无',
  [BannerLinkType.EXTERNAL]: '外链',
  [BannerLinkType.PRODUCT]: '商品详情',
  [BannerLinkType.FUNCTION]: '功能页面',
}

// ==================== 通知相关枚举 ====================

/**
 * 通知类型
 */
export enum NotificationType {
  SYSTEM = 'system',         // 系统公告
  ACTIVITY = 'activity',     // 活动通知
  URGENT = 'urgent',         // 紧急通知
}

export const NotificationTypeText: Record<NotificationType, string> = {
  [NotificationType.SYSTEM]: '系统公告',
  [NotificationType.ACTIVITY]: '活动通知',
  [NotificationType.URGENT]: '紧急通知',
}

/**
 * 通知状态
 */
export enum NotificationStatus {
  DRAFT = 0,      // 草稿
  PUBLISHED = 1,  // 已发布
  REVOKED = 2,    // 已撤回
}

export const NotificationStatusText: Record<NotificationStatus, string> = {
  [NotificationStatus.DRAFT]: '草稿',
  [NotificationStatus.PUBLISHED]: '已发布',
  [NotificationStatus.REVOKED]: '已撤回',
}

// ==================== 共享物品相关枚举 ====================

/**
 * 共享物品状态
 */
export enum ShareItemStatus {
  OFFLINE = 0,    // 下架
  AVAILABLE = 1,  // 可借用
  BORROWED = 2,   // 借用中
  DRAFT = 4,      // 草稿
}

export const ShareItemStatusText: Record<ShareItemStatus, string> = {
  [ShareItemStatus.OFFLINE]: '下架',
  [ShareItemStatus.AVAILABLE]: '可借用',
  [ShareItemStatus.BORROWED]: '借用中',
  [ShareItemStatus.DRAFT]: '草稿',
}

/**
 * 共享物品预约状态
 */
export enum ShareItemBookingStatus {
  PENDING = 0,    // 待审批
  APPROVED = 1,   // 已批准
  REJECTED = 2,   // 已拒绝
  CANCELLED = 3,  // 已取消
  BORROWING = 4,  // 借用中
  COMPLETED = 5,  // 已完成
}

export const ShareItemBookingStatusText: Record<ShareItemBookingStatus, string> = {
  [ShareItemBookingStatus.PENDING]: '待审批',
  [ShareItemBookingStatus.APPROVED]: '已批准',
  [ShareItemBookingStatus.REJECTED]: '已拒绝',
  [ShareItemBookingStatus.CANCELLED]: '已取消',
  [ShareItemBookingStatus.BORROWING]: '借用中',
  [ShareItemBookingStatus.COMPLETED]: '已完成',
}

// ==================== 秒杀相关枚举 ====================

/**
 * 秒杀场次类型
 */
export enum FlashSaleSessionType {
  FIXED = 1,      // 固定场次
  TEMPORARY = 2,  // 临时场次
}

export const FlashSaleSessionTypeText: Record<FlashSaleSessionType, string> = {
  [FlashSaleSessionType.FIXED]: '固定场次',
  [FlashSaleSessionType.TEMPORARY]: '临时场次',
}

/**
 * 秒杀库存状态
 */
export enum FlashSaleStockStatus {
  ON_SALE = 0,    // 在售
  SOLD_OUT = 1,   // 已售罄
  OFFLINE = 2,    // 手动下架
}

export const FlashSaleStockStatusText: Record<FlashSaleStockStatus, string> = {
  [FlashSaleStockStatus.ON_SALE]: '在售',
  [FlashSaleStockStatus.SOLD_OUT]: '已售罄',
  [FlashSaleStockStatus.OFFLINE]: '手动下架',
}

// ==================== 辅助函数 ====================

/**
 * 获取枚举对应的文本
 */
export function getEnumText<T extends Record<number, string>>(
  enumMap: T,
  value: number
): string {
  return enumMap[value] || '未知'
}

/**
 * 获取枚举所有选项（用于下拉框等）
 */
export function getEnumOptions<T extends Record<number, string>>(
  enumMap: T
): Array<{ label: string; value: number }> {
  return Object.entries(enumMap).map(([key, value]) => ({
    label: value,
    value: Number(key),
  }))
}
