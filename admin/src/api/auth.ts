import request from '@/utils/request'
import type { LoginRequest, LoginResponse, AdminInfo } from '@/types/admin'

/**
 * 管理员登录
 */
export function login(data: LoginRequest) {
  return request<LoginResponse>({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

/**
 * 获取管理员信息
 */
export function getAdminInfo() {
  return request<AdminInfo>({
    url: '/auth/info',
    method: 'get',
  })
}

/**
 * 退出登录
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}
