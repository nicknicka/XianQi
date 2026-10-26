/**
 * 认证中间件
 * 提供登录验证、权限检查等通用方法
 */
import { useUserStore } from '@/store/user'
import { UserRole, Permission, RolePermissions } from '@/types/permission'

/**
 * 登录验证选项
 */
export interface AuthOptions {
  /** 是否显示提示 */
  showTip?: boolean
  /** 提示文字 */
  tipText?: string
  /** 未登录时是否展示登录/注册引导 */
  showAuthGuide?: boolean
  /** 登录引导的标题 */
  guideTitle?: string
  /** 登录引导文案 */
  guideContent?: string
  /** 验证失败后的回调 */
  onFail?: () => void
}

/**
 * 需要登录的页面路径白名单
 * 这些页面在跳转前需要验证登录状态
 */
export const REQUIRE_LOGIN_PAGES = [
  '/pages/publish/index',
  '/pages/message/index',
  '/pages/mine/profile',
  '/pages/mine/settings',
  '/pages/mine/products',
  '/pages/mine/favorites',
  '/pages/mine/history',
  '/pages/mine/evaluations',
  '/pages/mine/verification',
  '/pages/mine/feedback',
  '/pages/mine/about',
  '/pages/mine/blacklist',
  '/pages/mine/address',
  '/pages/mine/security',
  '/pages/mine/refund',
  '/pages/mine/coupons',
  '/pages/mine/services',
  '/pages/order/create',
  '/pages/order/detail',
  '/pages/order/list',
  '/pages/order/evaluate',
  '/pages/market/publish',
  '/pages/market/edit',
  '/pages/share/publish',
  '/pages/share/my-share',
  '/pages/share/bookings',
  '/pages/message/chat'
]

function navigateToLogin(mode: 'login' | 'register' = 'login', redirectUrl?: string) {
  const query: string[] = []
  if (mode === 'register') {
    query.push('mode=register')
  }
  if (redirectUrl) {
    query.push(`redirect=${encodeURIComponent(redirectUrl)}`)
  }

  const url = `/pages/login/index${query.length ? `?${query.join('&')}` : ''}`
  uni.navigateTo({ url })
}

export function showLoginRegisterGuide(options: Pick<AuthOptions, 'guideTitle' | 'guideContent'> = {}) {
  const {
    guideTitle = '需要登录',
    guideContent = '该功能需要登录后使用，你可以先登录或注册账号。'
  } = options

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentRoute = currentPage?.route ? `/${currentPage.route}` : ''

  uni.showModal({
    title: guideTitle,
    content: guideContent,
    confirmText: '去登录',
    cancelText: '去注册',
    success: (res) => {
      if (res.confirm) {
        navigateToLogin('login', currentRoute)
      } else if (res.cancel) {
        navigateToLogin('register', currentRoute)
      }
    }
  })
}

/**
 * 检查路径是否需要登录
 */
export function isRequireLoginPath(path: string): boolean {
  return REQUIRE_LOGIN_PAGES.some(page => path.includes(page))
}

/**
 * 登录验证函数
 * @param options 验证选项
 * @returns 是否已登录
 */
export function checkAuth(options: AuthOptions = {}): boolean {
  const {
    showTip = true,
    tipText = '请先登录',
    showAuthGuide = false,
    guideTitle,
    guideContent,
    onFail
  } = options

  const userStore = useUserStore()

  if (!userStore.isLogin) {
    if (showTip) {
      uni.showToast({
        title: tipText,
        icon: 'none',
        duration: 1500
      })
    }

    // 执行失败回调
    if (onFail) {
      onFail()
    } else if (showAuthGuide) {
      showLoginRegisterGuide({
        guideTitle,
        guideContent
      })
    } else {
      // 默认跳转到登录页（与提示同时进行）
      navigateToLogin('login')
    }

    return false
  }

  return true
}

/**
 * 创建登录验证前置守卫
 * 用于路由跳转前的登录检查
 */
export function createAuthGuard(options?: AuthOptions) {
  return () => {
    return checkAuth(options)
  }
}

/**
 * 检查并处理 Token 过期
 */
export function handleTokenExpired() {
  const userStore = useUserStore()
  userStore.logout()

  uni.showModal({
    title: '提示',
    content: '登录已过期，请重新登录',
    showCancel: false,
    success: () => {
      uni.reLaunch({
        url: '/pages/login/index'
      })
    }
  })
}

/**
 * 检查用户权限
 * @param permission 权限标识
 * @returns 是否有权限
 */
export function checkPermission(permission: Permission | string): boolean {
  const userStore = useUserStore()

  if (!userStore.userInfo || !userStore.isLogin) {
    return false
  }

  // 获取用户角色（默认为普通用户）
  const userRole = (userStore.userInfo as any).role || UserRole.USER

  // 超级管理员拥有所有权限
  if (userRole === UserRole.SUPER_ADMIN) {
    return true
  }

  // 获取角色的权限列表
  const permissions = RolePermissions[userRole] || []

  // 检查是否拥有该权限
  return permissions.includes(permission as Permission)
}

/**
 * 检查多个权限（需要全部拥有）
 * @param permissions 权限列表
 * @returns 是否拥有所有权限
 */
export function checkPermissions(permissions: (Permission | string)[]): boolean {
  return permissions.every(permission => checkPermission(permission))
}

/**
 * 检查多个权限（拥有其中一个即可）
 * @param permissions 权限列表
 * @returns 是否拥有任一权限
 */
export function checkAnyPermission(permissions: (Permission | string)[]): boolean {
  return permissions.some(permission => checkPermission(permission))
}

/**
 * 获取当前用户的角色
 */
export function getCurrentUserRole(): UserRole {
  const userStore = useUserStore()
  return (userStore.userInfo as any).role || UserRole.USER
}

/**
 * 检查是否是管理员
 */
export function isAdmin(): boolean {
  const role = getCurrentUserRole()
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
}

/**
 * 检查是否是超级管理员
 */
export function isSuperAdmin(): boolean {
  return getCurrentUserRole() === UserRole.SUPER_ADMIN
}

/**
 * 检查 Token 是否有效，如果即将过期则自动刷新
 * 在关键操作前调用此方法
 */
export async function checkTokenValid(): Promise<boolean> {
  const { useUserStore } = await import('@/store/user')
  const userStore = useUserStore()

  if (!userStore.token) {
    return false
  }

  // 检查 Token 是否即将过期
  if (userStore.isTokenExpiringSoon()) {
    console.log('[Auth] Token 即将过期，尝试刷新')
    const success = await userStore.refreshToken()

    if (!success) {
      // 刷新失败，清除登录状态
      userStore.logout()
      return false
    }
  }

  return true
}

/**
 * 带有 Token 检查的操作包装器
 * 如果 Token 无效，则不执行操作
 */
export async function withAuthCheck<T>(
  action: () => T | Promise<T>
): Promise<T> {
  const valid = await checkTokenValid()

  if (!valid) {
    uni.showModal({
      title: '提示',
      content: '登录已过期，请重新登录',
      showCancel: false,
      success: () => {
        uni.navigateTo({
          url: '/pages/login/index'
        })
      }
    })
    throw new Error('登录已过期')
  }

  return await action()
}

/**
 * 登录拦截器
 * 用于拦截需要登录的操作
 */
export function withAuth<T extends (...args: any[]) => any>(
  fn: T,
  options?: AuthOptions
): T {
  return ((...args: any[]) => {
    if (!checkAuth(options)) {
      return Promise.reject(new Error('未登录'))
    }
    return fn(...args)
  }) as T
}

export default {
  checkAuth,
  createAuthGuard,
  handleTokenExpired,
  checkPermission,
  withAuth,
  isRequireLoginPath,
  REQUIRE_LOGIN_PAGES
}
