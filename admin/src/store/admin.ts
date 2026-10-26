import { defineStore } from 'pinia'
import { login, getAdminInfo, logout } from '@/api/auth'
import type { LoginRequest, AdminInfo } from '@/types/admin'

interface AdminState {
  token: string
  adminInfo: AdminInfo | null
}

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    token: localStorage.getItem('admin_token') || '',
    adminInfo: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    /** 登录 */
    async login(loginForm: LoginRequest) {
      const res = await login(loginForm)
      this.token = res.token
      this.adminInfo = res.adminInfo
      localStorage.setItem('admin_token', res.token)
    },

    /** 获取管理员信息 */
    async getAdminInfo() {
      const res = await getAdminInfo()
      this.adminInfo = res
    },

    /** 退出登录 */
    async logout() {
      await logout()
      this.token = ''
      this.adminInfo = null
      localStorage.removeItem('admin_token')
    },
  },
})
