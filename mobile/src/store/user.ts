/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '@/utils/storage'
import { extractUserIdFromToken } from '@/utils/id'

interface UserInfo {
  id?: string | number
  userId?: string | number
  username?: string
  nickname?: string
  avatar?: string
  phone?: string
  studentId?: string
  realName?: string
  college?: string
  major?: string
  creditScore?: number
  creditLevel?: string
  status?: number
  isVerified?: number
  realNameStatus?: number
  studentStatus?: number
  followerCount?: number
  followingCount?: number
  productCount?: number
  publishCount?: number
  orderCount?: number
  favoriteCount?: number
  evaluationCount?: number
  createdAt?: string
  updatedAt?: string
  refreshToken?: string
  expiresIn?: number
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(storage.get('token') || '')
  const tokenExpireTime = ref<number>(storage.get('tokenExpireTime') || 0)

  // 从 storage 读取 userInfo 并做字段映射
  const storedUserInfo = storage.get('userInfo') || {}
  const userInfo = ref<UserInfo>({
    ...storedUserInfo,
  })

  // 计算属性
  // 登录状态判断：token 存在 且 token 有效 且 userInfo 至少有一个有效字段
  const isLogin = computed(() => {
    const hasToken = !!token.value && token.value.length > 0
    const hasUserInfo = userInfo.value && (
      !!userInfo.value.userId ||
      !!userInfo.value.username ||
      !!userInfo.value.nickname
    )

    // Token 有效性验证（前端基础验证）
    let tokenValid = false
    if (hasToken) {
      try {
        const parts = token.value.split('.')
        if (parts.length === 3) {
          const payload = parts[1]
          const decoded = JSON.parse(
            decodeURIComponent(
              atob(payload)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            )
          )
          // 检查过期时间
          if (decoded.exp) {
            const now = Math.floor(Date.now() / 1000)
            tokenValid = decoded.exp >= now
          } else {
            tokenValid = true // 没有过期时间，视为有效
          }
        }
      } catch (error) {
        console.error('[UserStore] Token 验证失败:', error)
        tokenValid = false
      }
    }

    const result = hasToken && hasUserInfo && tokenValid
    console.log('[UserStore] isLogin 计算:', {
      hasToken,
      hasUserInfo,
      tokenValid,
      result
    })

    return result
  })

  const nickname = computed(() => {
    if (!isLogin.value) return '未登录'
    return userInfo.value?.nickname || userInfo.value?.username || '未登录'
  })
  const avatar = computed(() => {
    if (!isLogin.value) {
      console.log('[UserStore] 未登录，返回默认头像')
      return '/static/images/user.png'
    }
    const avatarUrl = userInfo.value?.avatar
    // 只有当 avatar 真正存在且不为空字符串时才返回，否则返回默认头像
    if (avatarUrl && avatarUrl.trim() !== '') {
      console.log('[UserStore] 返回用户头像:', avatarUrl)
      return avatarUrl
    }
    console.log('[UserStore] 返回默认头像')
    return '/static/images/user.png'
  })
  const creditScore = computed(() => (isLogin.value ? userInfo.value?.creditScore || 0 : 0))

  /**
   * 设置 Token
   */
  function setToken(newToken: string, expiresIn?: number) {
    console.log('[UserStore] setToken 被调用')
    console.log('[UserStore] 传入的 token:', newToken)

    token.value = newToken
    storage.set('token', newToken)

    // 解析 Token 过期时间
    if (expiresIn) {
      tokenExpireTime.value = Date.now() + expiresIn * 1000
      storage.set('tokenExpireTime', tokenExpireTime.value)
    } else {
      // 从 Token 中解析过期时间
      try {
        const parts = newToken.split('.')
        if (parts.length === 3) {
          const payload = parts[1]
          const decoded = JSON.parse(
            decodeURIComponent(
              atob(payload)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            )
          )
          if (decoded.exp) {
            tokenExpireTime.value = decoded.exp * 1000
            storage.set('tokenExpireTime', tokenExpireTime.value)
          }
        }
      } catch (error) {
        console.error('[UserStore] 解析 Token 过期时间失败:', error)
      }
    }

    console.log('[UserStore] token.value 已设置')
    console.log('[UserStore] 验证 storage 中的 token:', uni.getStorageSync('token'))
  }

  /**
   * 设置用户信息
   */
  function setUserInfo(info: UserInfo) {
    console.log('[UserStore] setUserInfo 被调用')
    console.log('[UserStore] 传入的 info:', info)
    console.log('[UserStore] info 类型:', typeof info)
    console.log('[UserStore] info 键数量:', Object.keys(info || {}).length)

    // 处理 userId 和 id 的映射问题
    // 后端不同接口返回字段不统一，有的返回 id，有的返回 userId
    // 这里统一处理：统一映射到 userId 字段
    const processedInfo = {
      ...info,
      userId: extractUserIdFromToken(token.value) || info.userId || info.id || undefined
    }
    userInfo.value = processedInfo

    console.log('[UserStore] userInfo.value 已设置:', userInfo.value)
    console.log('[UserStore] userInfo.value 键数量:', Object.keys(userInfo.value || {}).length)

    storage.set('userInfo', processedInfo)

    console.log('[UserStore] 已调用 storage.set')
    console.log('[UserStore] 验证 storage 中的数据:', uni.getStorageSync('userInfo'))
  }

  /**
   * 更新用户信息
   */
  function updateUserInfo(info: Partial<UserInfo>) {
    userInfo.value = { ...userInfo.value, ...info }
    storage.set('userInfo', userInfo.value)
  }

  /**
   * 登录
   */
  function login(loginToken: string, info: UserInfo, expiresIn?: number) {
    setToken(loginToken, expiresIn)
    setUserInfo(info)
  }

  /**
   * 退出登录
   */
  function logout() {
    clearAuthState()

    // 跳转到登录页
    uni.reLaunch({
      url: '/pages/login/index'
    })
  }

  /**
   * 清除登录状态但不跳转
   */
  function clearAuthState() {
    token.value = ''
    tokenExpireTime.value = 0
    userInfo.value = {}
    storage.remove('token')
    storage.remove('userInfo')
    storage.remove('tokenExpireTime')
    storage.remove('refreshToken')
  }

  /**
   * 检查登录状态
   */
  function checkLogin(): boolean {
    if (!isLogin.value) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/login/index'
        })
      }, 1500)
      return false
    }
    return true
  }

  /**
   * 验证 Token 是否有效（前端基础验证）
   * 注意：这只是前端的基础验证，真正的验证在后端
   */
  function validateToken(): boolean {
    if (!token.value) {
      console.log('[UserStore] Token 不存在')
      return false
    }

    try {
      // JWT 格式检查：header.payload.signature
      const parts = token.value.split('.')
      if (parts.length !== 3) {
        console.warn('[UserStore] Token 格式错误')
        return false
      }

      // 解析 Payload
      const payload = parts[1]
      const decoded = JSON.parse(
        decodeURIComponent(
          atob(payload)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      )

      // 检查过期时间
      if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000)
        if (decoded.exp < now) {
          console.warn('[UserStore] Token 已过期')
          console.log('[UserStore] 过期时间:', new Date(decoded.exp * 1000))
          console.log('[UserStore] 当前时间:', new Date(now * 1000))
          return false
        }
      }

      console.log('[UserStore] Token 验证通过')
      return true
    } catch (error) {
      console.error('[UserStore] Token 解析失败:', error)
      return false
    }
  }

  /**
   * 刷新 Token 验证状态
   * 如果 Token 无效，清除登录状态
   */
  function refreshLoginStatus() {
    if (token.value && !validateToken()) {
      console.warn('[UserStore] Token 无效，清除登录状态')
      logout()
    }
  }

  /**
   * 检查 Token 是否即将过期（5分钟内）
   */
  function isTokenExpiringSoon(): boolean {
    if (!tokenExpireTime.value) {
      return false
    }
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    return tokenExpireTime.value - now < fiveMinutes
  }

  /**
   * 刷新 Token
   * 调用后端接口刷新 Token
   */
  async function refreshToken(): Promise<boolean> {
    try {
      console.log('[UserStore] 开始刷新 Token')

      // 调用后端刷新 Token 接口
      const { http } = await import('@/utils/request')
      const response = await http.post<{
        token: string
        refreshToken: string
        expiresIn: number
      }>('/auth/refresh', {}, { showLoading: false })

      if (response.code === 200 && response.data) {
        const { token: newToken, refreshToken: newRefreshToken, expiresIn } = response.data

        // 更新 Token
        setToken(newToken)
        tokenExpireTime.value = Date.now() + expiresIn * 1000
        storage.set('tokenExpireTime', tokenExpireTime.value)

        // 保存 refreshToken（如果返回了新的）
        if (newRefreshToken) {
          storage.set('refreshToken', newRefreshToken)
        }

        console.log('[UserStore] Token 刷新成功')
        return true
      } else {
        console.warn('[UserStore] Token 刷新失败:', response.message)
        return false
      }
    } catch (error) {
      console.error('[UserStore] Token 刷新异常:', error)
      return false
    }
  }

  return {
    // 状态
    token,
    tokenExpireTime,
    userInfo,
    // 计算属性
    isLogin,
    nickname,
    avatar,
    creditScore,
    // 方法
    setToken,
    setUserInfo,
    updateUserInfo,
    login,
    logout,
    clearAuthState,
    checkLogin,
    validateToken,
    refreshLoginStatus,
    isTokenExpiringSoon,
    refreshToken
  }
})
