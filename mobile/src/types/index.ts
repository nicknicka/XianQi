/**
 * 统一类型定义
 * 用于整个项目的类型管理
 */

// ==================== 基础类型 ====================

/**
 * API 响应基础类型
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 分页数据类型
 */
export interface PageData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 分页请求参数
 */
export interface PageParams {
  page: number
  pageSize: number
}

// ==================== 商品相关类型 ====================

/**
 * 商品类型
 */
export interface Product {
  id: string
  title: string
  description: string
  coverImage: string
  images: string[]
  price: number
  originalPrice?: number
  condition: ProductCondition
  categoryId: string
  categoryName?: string
  userId: string
  userName: string
  userAvatar: string
  distance?: number
  location?: string
  latitude?: number  // 纬度
  longitude?: number  // 经度
  creditLevel?: string
  creditScore?: number  // 信用分数
  status: ProductStatus | number  // 兼容字符串枚举和数字类型（0=下架,1=在售,2=已售）
  isNew?: boolean
  isHot?: boolean
  isDiscount?: boolean
  canDelivery?: boolean  // 是否支持邮寄
  freeShipping?: boolean  // 是否包邮
  deliveryFee?: number   // 配送费
  viewCount?: number
  favoriteCount?: number
  createdAt: string
  updatedAt: string
  sellerId?: string   // 后端可能返回 sellerId
  sellerNickname?: string  // 后端可能返回 sellerNickname
  sellerAvatar?: string  // 后端可能返回 sellerAvatar
  sellerCreditScore?: number  // 后端可能返回 sellerCreditScore
  // 秒杀相关字段
  isFlashSale?: boolean
  seckillPrice?: number
  flashSaleStock?: number
  endTime?: string
  soldPercent?: number
  limitPerUser?: number
  discount?: number
}

/**
 * 商品成色
 */
export type ProductCondition =
  | 'new'
  | 'almost_new'
  | 'lightly_used'
  | 'obviously_used'
  | 'has_flaws'

/**
 * 商品成色映射
 */
export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: '全新',
  almost_new: '几乎全新',
  lightly_used: '轻微使用',
  obviously_used: '明显使用',
  has_flaws: '有瑕疵'
} as const

/**
 * 获取成色中文标签
 * @param condition 成色值
 * @returns 中文标签
 */
export function getConditionLabel(condition: ProductCondition | string | undefined): string {
  if (!condition) return ''
  return CONDITION_LABELS[condition as ProductCondition] || condition
}

/**
 * 商品状态
 */
export enum ProductStatus {
  ON_SALE = 'on_sale', // 在售
  SOLD_OUT = 'sold_out', // 已售出
  OFF_SHELF = 'off_shelf', // 已下架
  PENDING_REVIEW = 'pending_review', // 待审核
  REJECTED = 'rejected', // 审核未通过
}

/**
 * 商品图片
 */
export interface ProductImage {
  id: string
  productId: string
  originalUrl: string
  mediumUrl: string
  thumbnailUrl: string
  isCover: boolean
  sortOrder: number
}

/**
 * 商品查询参数
 */
export interface ProductQueryParams extends PageParams {
  keyword?: string
  categoryId?: string
  condition?: ProductCondition
  sortBy?: ProductSortType
  priceAsc?: boolean
  minPrice?: number
  maxPrice?: number
  location?: string
}

/**
 * 商品排序类型
 */
export type ProductSortType = 'latest' | 'price' | 'distance' | 'popularity'

// ==================== 用户相关类型 ====================

/**
 * 用户类型（基础信息）
 */
export interface User {
  id: string
  username?: string  // 用户名可能不返回
  nickname: string
  avatar: string
  phone?: string
  studentId?: string
  realName?: string
  college?: string
  major?: string
  gender?: UserGender
  birthday?: string
  bio?: string
  location?: string
  creditScore: number
  creditLevel?: string
  status?: number
  isVerified?: number
  // 实名认证状态：0-未认证 1-审核中 2-已认证 3-认证失败
  realNameStatus?: 0 | 1 | 2 | 3 | number
  // 学生认证状态：0-未认证 1-审核中 2-已认证 3-认证失败
  studentStatus?: 0 | 1 | 2 | 3 | number
  isBlacklisted?: boolean
  followerCount?: number
  followingCount?: number
  productCount?: number
  orderCount?: number  // 订单数量
  favoriteCount?: number  // 收藏数量
  evaluationCount?: number  // 评价数量
  createdAt?: string
  updatedAt?: string
  userId?: string  // 后端可能返回 userId 而不是 id
}

/**
 * 实名认证信息
 */
export interface RealNameAuth {
  id: string
  userId: string
  realName: string
  idCard: string
  status: 0 | 1 | 2 | 3
  rejectReason?: string
  auditedAt?: string
  createdAt: string
}

/**
 * 学生认证信息
 */
export interface StudentAuth {
  id: string
  userId: string
  studentId: string
  college: string
  major: string
  studentCardImages: string[]
  status: 0 | 1 | 2 | 3
  rejectReason?: string
  enrollmentYear?: string
  graduationYear?: string
  educationLevel?: string
  auditedAt?: string
  createdAt: string
}

/**
 * 用户性别
 */
export type UserGender = 'male' | 'female' | 'secret'

/**
 * 信用等级
 */
export enum CreditLevel {
  EXCELLENT = 'excellent', // 优秀
  GOOD = 'good', // 良好
  NORMAL = 'normal', // 一般
  POOR = 'poor', // 较差
}

/**
 * 用户登录信息
 */
export interface LoginParams {
  phone: string
  code: string
}

/**
 * 用户注册信息
 */
export interface RegisterParams {
  phone: string
  code: string
  password: string
  nickname: string
  studentId: string
}

// ==================== 分类相关类型 ====================

/**
 * 商品分类
 */
export interface Category {
  categoryId: string
  name: string
  icon?: string
  code?: string      // 分类代码
  gradient?: string  // 渐变色
  parentId?: string
  sortOrder: number
  children?: Category[]
  // 兼容字段（后端可能返回 id 而不是 categoryId）
  id?: string
}

// ==================== 订单相关类型 ====================

/**
 * 订单类型
 */
export interface Order {
  id: string
  orderNo: string
  productId: string
  productName?: string  // 商品名称（可能后端不返回）
  productImage: string
  productPrice: number
  sellerId: string
  sellerName: string
  sellerAvatar: string
  buyerId: string
  buyerName: string
  buyerAvatar: string
  status: OrderStatus | number  // 兼容字符串枚举和数字类型（0=待确认,1=进行中,2=已完成,3=已取消,4=退款中）
  totalAmount: number
  price?: number  // 实际价格（可能和 productPrice 不同）
  remark?: string
  address?: OrderAddress  // 地址可能不总是有
  location?: string  // 交易地点（线下交易）
  isBuyer?: boolean  // 是否是买家视角
  createdAt: string
  updatedAt: string
  productTitle?: string  // 后端可能返回 productTitle 而不是 productName
}

/**
 * 订单状态
 */
export enum OrderStatus {
  PENDING_CONFIRM = 'pending_confirm', // 待确认
  PENDING_PAYMENT = 'pending_payment', // 待付款
  IN_TRANSACTION = 'in_transaction', // 交易中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  REFUNDING = 'refunding', // 退款中
  REFUNDED = 'refunded', // 已退款
}

/**
 * 订单地址
 */
export interface OrderAddress {
  contactName: string
  contactPhone: string
  province: string
  city: string
  district: string
  detail: string
}

// ==================== 评价相关类型 ====================

/**
 * 评价类型
 */
export interface Evaluation {
  id: string
  evaluationId?: string  // 后端 EvaluationVO 同时给出 id 与 evaluationId
  orderId: string
  productId: string
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  toUserId?: string  // 可能不总是返回
  evaluatorId?: string  // 后端 EvaluationVO 的 fromUserId 别名
  rating: number
  content: string
  tags?: string[]
  images?: string[]
  hasAppend?: boolean
  appendContent?: string
  appendTime?: string
  createdAt: string
}

// ==================== 收藏相关类型 ====================

/**
 * 收藏类型
 */
export interface Favorite {
  id: string
  userId: string
  productId: string
  product: Product
  createdAt: string
}

// ==================== 共享物品相关类型 ====================

/**
 * 共享物品
 */
export interface ShareItem {
  id: string
  title: string
  description: string
  coverImage: string
  images: string[]
  deposit: number
  dailyRent: number
  categoryId: string
  categoryName?: string
  userId: string
  userName: string
  userAvatar: string
  location?: string
  status: ShareItemStatus
  availableTimes: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 共享物品状态
 */
export enum ShareItemStatus {
  AVAILABLE = 'available', // 可借用
  BORROWED = 'borrowed', // 借用中
  UNAVAILABLE = 'unavailable', // 不可用
}

/**
 * 共享预约
 */
export interface ShareReservation {
  id: string
  shareItemId: string
  userId: string
  userName: string
  startDate: string
  endDate: string
  status: ReservationStatus
  createdAt: string
}

/**
 * 预约状态
 */
export enum ReservationStatus {
  PENDING = 'pending', // 待审批
  APPROVED = 'approved', // 已批准
  REJECTED = 'rejected', // 已拒绝
  IN_PROGRESS = 'in_progress', // 使用中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

// ==================== 系统相关类型 ====================

/**
 * 系统配置
 */
export interface SystemConfig {
  configKey: string
  configValue: string
  configType: string
  description?: string
}

/**
 * 系统通知
 */
export interface SystemNotification {
  id: string
  title: string
  content: string
  type: NotificationType
  isRead: boolean
  createdAt: string
}

/**
 * 通知类型
 */
export enum NotificationType {
  SYSTEM = 'system', // 系统通知
  ORDER = 'order', // 订单通知
  MESSAGE = 'message', // 消息通知
  ACTIVITY = 'activity', // 活动通知
}

/**
 * 轮播图
 */
export interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  linkType?: BannerLinkType
  sortOrder: number
}

/**
 * 轮播图链接类型
 */
export enum BannerLinkType {
  NONE = 'none', // 无链接
  PRODUCT = 'product', // 商品详情
  URL = 'url', // 外部链接
  PAGE = 'page', // 内部页面
}

// ==================== 反馈相关类型 ====================

/**
 * 用户反馈
 */
export interface UserFeedback {
  id: string
  userId: string
  content: string
  images?: string[]
  contact?: string
  status: FeedbackStatus
  reply?: string
  createdAt: string
}

/**
 * 反馈状态
 */
export enum FeedbackStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved', // 已解决
  CLOSED = 'closed', // 已关闭
}

// ==================== 举报相关类型 ====================

/**
 * 举报记录
 */
export interface Report {
  id: string
  reporterId: string
  reporterName: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  description?: string
  images?: string[]
  status: ReportStatus
  createdAt: string
}

/**
 * 举报目标类型
 */
export enum ReportTargetType {
  PRODUCT = 'product', // 商品
  USER = 'user', // 用户
  MESSAGE = 'message', // 消息
  COMMENT = 'comment', // 评论
}

/**
 * 举报状态
 */
export enum ReportStatus {
  PENDING = 'pending', // 待处理
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已驳回
}

// ==================== 黑名单相关类型 ====================

/**
 * 黑名单
 */
export interface Blacklist {
  id: string
  userId: string
  blockedUserId: string
  blockedUserName: string
  blockedUserAvatar: string
  reason?: string
  createdAt: string
}

// ==================== 快捷回复相关类型 ====================

/**
 * 快捷回复
 */
export interface QuickReply {
  id: string
  userId: string
  content: string
  sortOrder: number
  createdAt: string
}
