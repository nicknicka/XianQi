import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

/**
 * 实名认证查询条件
 */
export interface RealNameQueryParams extends PageParams {
  status?: number // 审核状态：0-待审核，1-已通过，2-已拒绝
  keyword?: string // 姓名/身份证号
  startTime?: string
  endTime?: string
}

/**
 * 学号认证查询条件
 */
export interface StudentQueryParams extends PageParams {
  status?: number // 审核状态：0-待审核，1-已通过，2-已拒绝
  keyword?: string // 姓名/学号
  startTime?: string
  endTime?: string
}

/**
 * 实名认证VO
 */
export interface RealNameAuthVO {
  id: number
  userId: number
  username?: string
  nickname?: string
  realName: string
  idCard: string
  status: number // 0-未认证 1-审核中 2-已认证 3-认证失败
  rejectReason?: string
  auditedAt?: string
  createdAt: string
}

/**
 * 学号认证VO
 */
export interface StudentAuthVO {
  id: number
  userId: number
  username?: string
  nickname?: string
  realName?: string
  studentId: string
  college: string
  major: string
  enrollmentYear: string
  graduationYear?: string // 毕业年份
  educationLevel?: string // 学历层次
  studentCardImages: string[] // 学生证图片URL列表
  status: number // 0-未认证 1-审核中 2-已认证 3-认证失败
  rejectReason?: string
  auditedAt?: string
  createdAt: string
}

/**
 * 认证审核参数
 */
export interface AuditParams {
  authId: number
  action: 'approve' | 'reject'
  rejectReason?: string
}

/**
 * 认证统计信息
 */
export interface AuthStatistics {
  realNameTotal: number // 实名认证总数
  realNamePending: number // 实名认证待审核数
  realNameApproved: number // 实名认证已通过数
  realNameRejected: number // 实名认证已拒绝数
  realNameTodayApproved: number // 今日实名认证通过数
  realNameTodayRejected: number // 今日实名认证拒绝数
  studentTotal: number // 学号认证总数
  studentPending: number // 学号认证待审核数
  studentApproved: number // 学号认证已通过数
  studentRejected: number // 学号认证已拒绝数
  studentTodayApproved: number // 今日学号认证通过数
  studentTodayRejected: number // 今日学号认证拒绝数
}

// ==================== 实名认证相关接口 ====================

/**
 * 分页查询实名认证列表（全部）
 */
export function getRealNameList(params: RealNameQueryParams) {
  return request<PageResponse<RealNameAuthVO>>({
    url: '/auth/real-name/all',
    method: 'get',
    params,
  })
}

/**
 * 查询待审核实名认证列表
 */
export function getRealNamePendingList(params?: PageParams) {
  return request<PageResponse<RealNameAuthVO>>({
    url: '/auth/real-name/pending',
    method: 'get',
    params,
  })
}

/**
 * 获取实名认证详情
 */
export function getRealNameDetail(authId: number) {
  return request<RealNameAuthVO>({
    url: `/auth/real-name/${authId}`,
    method: 'get',
  })
}

/**
 * 审核实名认证
 */
export function auditRealName(data: AuditParams) {
  return request<boolean>({
    url: '/auth/real-name/audit',
    method: 'put',
    data,
  })
}

// ==================== 学号认证相关接口 ====================

/**
 * 分页查询学号认证列表（全部）
 */
export function getStudentList(params: StudentQueryParams) {
  return request<PageResponse<StudentAuthVO>>({
    url: '/auth/student/all',
    method: 'get',
    params,
  })
}

/**
 * 查询待审核学号认证列表
 */
export function getStudentPendingList(params?: PageParams) {
  return request<PageResponse<StudentAuthVO>>({
    url: '/auth/student/pending',
    method: 'get',
    params,
  })
}

/**
 * 获取学号认证详情
 */
export function getStudentDetail(authId: number) {
  return request<StudentAuthVO>({
    url: `/auth/student/${authId}`,
    method: 'get',
  })
}

/**
 * 审核学号认证
 */
export function auditStudent(data: AuditParams) {
  return request<boolean>({
    url: '/auth/student/audit',
    method: 'put',
    data,
  })
}

// ==================== 统计相关接口 ====================

/**
 * 获取认证统计信息
 */
export function getAuthStatistics() {
  return request<AuthStatistics>({
    url: '/auth/statistics',
    method: 'get',
  })
}
