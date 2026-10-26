/**
 * 用户相关 API
 */
import { http } from '@/utils/request'
import { uploadImage as uploadImageFile } from '@/utils/image'
import type { RealNameAuth, StudentAuth } from '@/types'

interface LoginParams {
  username: string
  password: string
}

interface PhoneLoginParams {
  phone: string
  code: string
}

interface RegisterParams {
  username: string
  password: string
  phone: string
  code: string
  studentId?: string // 可选字段，后续可补充
}

interface WechatLoginParams {
  code: string
  userInfo?: {
    nickName?: string
    avatarUrl?: string
    gender?: number
    country?: string
    province?: string
    city?: string
    language?: string
  }
}

interface ResetPasswordParams {
  phone: string
  code: string
  newPassword: string
}

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar: string
  phone?: string
  studentId?: string
  realName?: string
  college?: string
  major?: string
  creditScore: number
  creditLevel?: string
  status?: number
  isVerified?: number
  realNameStatus?: number
  studentStatus?: number
  followerCount?: number
  followingCount?: number
  productCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface UserCenterInfo {
  id: string
  username: string
  nickname: string
  avatar: string
  creditScore: number
  productCount: number
  orderCount: number
  followingCount: number
  followerCount: number
  recentProducts?: Array<{
    id: string
    title: string
    price: number
    coverImage: string
    status: number
  }>
}

export interface NotificationSettings {
  notificationEnabled: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
}

function normalizeUserInfo(data: any): UserInfo {
  return {
    id: data?.id ?? data?.userId ?? '',
    username: data?.username || '',
    nickname: data?.nickname || data?.username || '',
    avatar: data?.avatar || '',
    phone: data?.phone,
    studentId: data?.studentId,
    realName: data?.realName,
    college: data?.college,
    major: data?.major,
    creditScore: Number(data?.creditScore || 0),
    creditLevel: data?.creditLevel,
    status: data?.status,
    isVerified: data?.isVerified,
    realNameStatus: data?.realNameStatus,
    studentStatus: data?.studentStatus,
    followerCount: data?.followerCount,
    followingCount: data?.followingCount,
    productCount: data?.productCount,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt
  }
}

function normalizeAuthResponse(res: any) {
  const rawData = res?.data || {}
  const userInfo = rawData.userInfo
    ? normalizeUserInfo(rawData.userInfo)
    : normalizeUserInfo(rawData)

  return {
    ...res,
    data: {
      ...rawData,
      token: rawData.token,
      refreshToken: rawData.refreshToken,
      expiresIn: rawData.expiresIn,
      isNewUser: rawData.isNewUser,
      userInfo
    }
  }
}

export const userApi = {
  /**
   * 用户名密码登录
   */
  login(data: LoginParams, options?: Partial<{ showError: boolean }>) {
    return http.post<{
      token: string
      userInfo: UserInfo
    }>('/user/login', data, { showLoading: true, ...options }).then(normalizeAuthResponse)
  },

  /**
   * 手机号验证码登录
   */
  loginByPhone(data: PhoneLoginParams, options?: Partial<{ showError: boolean }>) {
    return http.post<{
      token: string
      userInfo: UserInfo
    }>('/user/login/phone', data, { showLoading: true, ...options }).then(normalizeAuthResponse)
  },

  /**
   * 微信授权登录
   */
  loginByWechat(data: WechatLoginParams, options?: Partial<{ showError: boolean }>) {
    return http.post<{
      token: string
      userInfo: UserInfo
      isNewUser: boolean
    }>('/user/login/wechat', data, { showLoading: true, ...options }).then(normalizeAuthResponse)
  },

  /**
   * QQ授权登录
   */
  loginByQQ(data: { code: string; userInfo?: any }) {
    return http.post<{
      token: string
      userInfo: UserInfo
      isNewUser: boolean
    }>('/user/login/qq', data, { showLoading: true }).then(normalizeAuthResponse)
  },

  /**
   * 发送验证码
   */
  sendVerifyCode(phone: string, type: 'login' | 'register' | 'reset' | 'bind' = 'login', options?: Partial<{ showError: boolean }>) {
    return http.post('/user/send-code', { phone, type }, { showLoading: true, ...options })
  },

  /**
   * 验证验证码（用于重置密码）
   */
  verifyCodeForReset(phone: string, code: string) {
    return http.post('/user/verify-code', { phone, code }, { showLoading: true })
  },

  /**
   * 重置密码
   */
  resetPassword(data: ResetPasswordParams) {
    return http.post('/user/reset-password', data, { showLoading: true })
  },

  /**
   * 用户注册
   */
  register(data: RegisterParams, options?: Partial<{ showError: boolean }>) {
    return http.post<{ token: string; userInfo: UserInfo }>('/user/register', data, {
      showLoading: true,
      ...options
    }).then(normalizeAuthResponse)
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return http.get<UserInfo>('/user/info')
  },

  /**
   * 根据用户ID获取用户信息
   */
  getUserById(userId: string) {
    return http.get<UserInfo>(`/user/${userId}`)
  },

  /**
   * 搜索用户
   */
  searchUsers(params: { keyword: string; page?: number; pageSize?: number }) {
    return http.get<{
      list: UserInfo[]
      total: number
      current: number
      size: number
    }>('/user/search', {
      keyword: params.keyword,
      current: params.page,
      size: params.pageSize
    })
  },

  /**
   * 更新用户信息
   */
  updateUserInfo(data: Partial<UserInfo>) {
    return http.put<UserInfo>('/user/info', data, { showLoading: true })
  },

  /**
   * 修改密码
   */
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return http.put('/user/password', data, { showLoading: true })
  },

  /**
   * 绑定手机号
   */
  bindPhone(data: { phone: string; code: string }) {
    return http.post('/user/bind-phone', data, { showLoading: true })
  },

  /**
   * 更换手机号
   */
  changePhone(data: { oldPhone: string; newPhone: string; code: string }) {
    return http.post('/user/change-phone', data, { showLoading: true })
  },

  /**
   * 设置支付密码
   */
  setPayPassword(data: { password: string; phone: string; code: string }) {
    return http.post('/user/pay-password/set', data, { showLoading: true })
  },

  /**
   * 修改支付密码
   */
  changePayPassword(data: { oldPassword: string; newPassword: string }) {
    return http.post('/user/pay-password/change', data, { showLoading: true })
  },

  /**
   * 重置支付密码
   */
  resetPayPassword(data: { phone: string; code: string; newPassword: string }) {
    return http.post('/user/pay-password/reset', data, { showLoading: true })
  },

  /**
   * 验证支付密码
   */
  verifyPayPassword(password: string) {
    return http.post('/user/pay-password/verify', { password })
  },

  /**
   * 检查是否设置支付密码
   */
  checkPayPassword() {
    return http.get<{ hasPayPassword: boolean }>('/user/pay-password/check')
  },

  /**
   * 注销账号
   */
  deleteAccount(data: { password: string }) {
    return http.post('/user/delete-account', data, { showLoading: true })
  },

  /**
   * 获取隐私设置
   */
  getPrivacySettings() {
    return http.get<{
      phoneSearchEnabled: boolean
      locationEnabled: boolean
    }>('/user/privacy-settings')
  },

  /**
   * 更新隐私设置
   */
  updatePrivacySettings(data: {
    phoneSearchEnabled?: boolean | number
    locationEnabled?: boolean | number
  }) {
    return http.put('/user/privacy-settings', {
      phoneSearchEnabled: typeof data.phoneSearchEnabled === 'boolean'
        ? Number(data.phoneSearchEnabled)
        : data.phoneSearchEnabled,
      locationEnabled: typeof data.locationEnabled === 'boolean'
        ? Number(data.locationEnabled)
        : data.locationEnabled
    }, { showLoading: true })
  },

  /**
   * 获取通知设置
   */
  getNotificationSettings(options?: Partial<{ showError: boolean }>) {
    return http.get<NotificationSettings>('/user/notification-settings', undefined, options)
  },

  /**
   * 更新通知设置
   */
  updateNotificationSettings(data: {
    notificationEnabled?: boolean
    soundEnabled?: boolean
    vibrationEnabled?: boolean
  }, options?: Partial<{ showError: boolean }>) {
    return http.put('/user/notification-settings', data, {
      showLoading: true,
      ...options
    })
  },

  /**
   * 上传头像
   */
  uploadAvatar(filePath: string) {
    return uploadImageFile(filePath, '/user/avatar')
  },

  /**
   * 实名认证（分离后）
   */
  verifyRealName(data: { realName: string; idCard: string }) {
    return http.post('/user/verification/real-name', data, { showLoading: true })
  },

  /**
   * 获取实名认证信息
   */
  getRealNameAuth() {
    return http.get<RealNameAuth>('/user/verification/real-name')
  },

  /**
   * 学生认证（分离后）
   */
  verifyStudent(data: {
    studentId: string
    college: string
    major: string
    studentCardImages: string[]
  }) {
    return http.post('/user/verification/student', data, { showLoading: true })
  },

  /**
   * 获取学生认证信息
   */
  getStudentAuth() {
    return http.get<StudentAuth>('/user/verification/student')
  },

  /**
   * 实名认证（旧版本，已废弃）
   * @deprecated 请使用 verifyRealName 和 verifyStudent 分离接口
   */
  verifyRealNameOld(data: {
    realName: string
    idCard: string
    studentId: string
    studentCardImages: string[]
  }) {
    return http.post('/user/verification', data, { showLoading: true })
  },

  /**
   * 获取用户中心数据
   */
  getUserCenter() {
    return http.get<UserCenterInfo>('/user/center')
  },

  /**
   * 根据用户ID获取用户中心数据
   * @param userId 用户ID
   */
  getUserCenterById(userId: string) {
    return http.get<UserCenterInfo>(`/user/${userId}/center`)
  },

  /**
   * 获取登录设备列表
   */
  getLoginDevices() {
    return http.get<{
      devices: Array<{
        deviceId: string
        deviceName: string
        deviceType: string
        platform: string
        lastLoginTime: string
        lastLoginIP: string
        isCurrent: boolean
      }>
      total: number
    }>('/user/login-devices')
  },

  /**
   * 移除登录设备
   */
  removeLoginDevice(deviceId: string) {
    return http.delete(`/user/login-devices/${deviceId}`, { showLoading: true })
  },

  /**
   * 移除所有其他设备
   */
  removeAllOtherDevices() {
    return http.post('/user/login-devices/remove-all', {}, { showLoading: true })
  },

  /**
   * 获取用户统计数据
   */
  getUserStats() {
    return http.get<{
      publishCount: number      // 发布商品数
      orderCount: number        // 订单数
      followingCount: number    // 关注数
      followerCount: number     // 粉丝数
    }>('/user/stats')
  },

  /**
   * 根据用户ID获取用户统计数据
   * @param userId 用户ID
   */
  getUserStatsById(userId: string) {
    return http.get<{
      publishCount: number      // 发布商品数
      orderCount: number        // 订单数
      followingCount: number    // 关注数
      followerCount: number     // 粉丝数
    }>(`/user/${userId}/stats`)
  },

  /**
   * 关注用户
   * @param userId 被关注用户ID
   */
  followUser(userId: string) {
    return http.post(`/user/follow/${userId}`, {}, { showLoading: true })
  },

  /**
   * 取消关注用户
   * @param userId 被关注用户ID
   */
  unfollowUser(userId: string) {
    return http.delete(`/user/follow/${userId}`, { showLoading: true })
  },

  /**
   * 检查是否已关注用户
   * @param userId 被关注用户ID
   */
  checkFollow(userId: string) {
    return http.get<boolean>(`/user/follow/check/${userId}`)
  },

  /**
   * 获取关注列表
   * @param userId 用户ID，可选。不传则获取当前登录用户的关注列表
   * @param page 页码
   * @param size 每页数量
   */
  getFollowingList(userId?: string, page = 1, size = 20) {
    // 手动构建查询参数（兼容小程序）
    const params: string[] = []
    params.push(`page=${page}`)
    params.push(`size=${size}`)
    if (userId) {
      params.push(`userId=${userId}`)
    }
    const queryString = params.join('&')

    return http.get<{
      records: UserInfo[]
      total: number
      current: number
      size: number
    }>(`/user/follow/following?${queryString}`)
  },

  /**
   * 获取粉丝列表
   * @param userId 用户ID，可选。不传则获取当前登录用户的粉丝列表
   * @param page 页码
   * @param size 每页数量
   */
  getFollowersList(userId?: string, page = 1, size = 20) {
    // 手动构建查询参数（兼容小程序）
    const params: string[] = []
    params.push(`page=${page}`)
    params.push(`size=${size}`)
    if (userId) {
      params.push(`userId=${userId}`)
    }
    const queryString = params.join('&')

    return http.get<{
      records: UserInfo[]
      total: number
      current: number
      size: number
    }>(`/user/follow/followers?${queryString}`)
  }
}

export default userApi
