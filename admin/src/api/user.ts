import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

/**
 * 用户查询条件
 */
export interface UserQueryParams extends PageParams {
  keyword?: string // 用户名/昵称/手机号
  status?: number // 用户状态：0-正常，1-已封禁
  college?: string // 学院
  startTime?: string // 注册开始时间
  endTime?: string // 注册结束时间
}

/**
 * 用户管理VO
 */
export interface UserManageVO {
  userId: string
  username: string
  nickname: string
  avatar?: string
  phone?: string
  studentId?: string
  realName?: string
  college?: string
  major?: string
  creditScore: number
  status: number // 0-正常，1-已封禁
  isVerified: number // 0-未认证，1-已认证
  createTime: string
  lastLoginTime?: string
  productCount?: number
  orderCount?: number
  evaluationCount?: number
}

/**
 * 用户状态更新参数
 */
export interface UserStatusUpdateParams {
  userId: string
  status: number // 0-正常，1-已封禁
  reason?: string // 封禁原因
}

/**
 * 用户统计信息
 */
export interface UserStatistics {
  totalCount: number // 总用户数
  normalCount: number // 正常用户数
  bannedCount: number // 已封禁用户数
  todayNew: number // 今日新增
  weekNew: number // 本周新增
  monthNew: number // 本月新增
}

/**
 * 分页查询用户列表
 */
export function getUserList(params: UserQueryParams) {
  return request<PageResponse<UserManageVO>>({
    url: '/user/list',
    method: 'get',
    params,
  })
}

/**
 * 获取用户详情
 */
export function getUserDetail(userId: string) {
  return request<UserManageVO>({
    url: `/user/${userId}`,
    method: 'get',
  })
}

/**
 * 更新用户状态（封禁/解封）
 */
export function updateUserStatus(data: UserStatusUpdateParams) {
  return request<boolean>({
    url: '/user/status',
    method: 'put',
    data,
  })
}

/**
 * 获取用户统计信息
 */
export function getUserStatistics() {
  return request<UserStatistics>({
    url: '/user/statistics',
    method: 'get',
  })
}
