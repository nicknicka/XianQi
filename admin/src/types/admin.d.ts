/**
 * 管理员相关类型定义
 */

/** 管理员信息 */
export interface AdminInfo {
  id: string
  username: string
  nickname: string
  avatar: string
  isActive: number
  lastLoginTime: string
  lastLoginIp: string
}

/** 登录请求 */
export interface LoginRequest {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  token: string
  adminInfo: AdminInfo
}

/** 分页请求 */
export interface PageRequest {
  page: number
  pageSize: number
}

/** 分页响应 */
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
