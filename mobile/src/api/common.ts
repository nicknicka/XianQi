/**
 * 通用 API
 */
import { http } from '@/utils/request'
import { uploadImage as uploadImageFile } from '@/utils/image'

export const commonApi = {
  /**
   * 上传图片
   */
  uploadImage(filePath: string) {
    return uploadImageFile(filePath, '/upload/image').then((result) => result.url)
  },

  /**
   * 批量上传图片
   */
  batchUploadImages(filePaths: string[]) {
    return Promise.all(filePaths.map((filePath) => this.uploadImage(filePath)))
  },

  /**
   * 获取轮播图
   */
  getBanners() {
    return http.get<
      Array<{
        id: string
        title: string
        image: string
        link: string
        sortOrder: number
      }>
    >('/banner')
  },

  /**
   * 获取分类列表
   */
  getCategories() {
    return http.get<
      Array<{
        id: string
        name: string
        icon: string
        sortOrder: number
      }>
    >('/category')
  },

  /**
   * 获取系统通知
   */
  getNotifications(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: Array<{
        id: string
        title: string
        content: string
        type: string
        createdAt: string
      }>
      total: number
    }>('/notification', params)
  },

  /**
   * 标记通知已读
   */
  markNotificationRead(id: string) {
    return http.put(`/notification/${id}/read`)
  },

  /**
   * 提交反馈
   */
  submitFeedback(data: {
    type: string
    content: string
    images?: string[]
    contact?: string
  }) {
    return http.post('/feedback', data, { showLoading: true })
  },

  /**
   * 举报
   */
  report(data: {
    targetType: string
    targetId: string
    reason: string
    description?: string
    images?: string[]
  }) {
    return http.post('/report', {
      targetType: data.targetType,
      targetId: String(data.targetId),
      reason: data.reason,
      description: data.description,
      evidenceImages: data.images?.length ? JSON.stringify(data.images) : undefined
    }, { showLoading: true })
  },

  /**
   * 添加黑名单
   */
  addToBlacklist(userId: string) {
    return http.post(`/blacklist/${userId}`, undefined, { showLoading: true })
  },

  /**
   * 移除黑名单
   */
  removeFromBlacklist(userId: string) {
    return http.delete(`/blacklist/blocked-user/${userId}`, undefined, { showLoading: true })
  },

  /**
   * 获取黑名单列表
   */
  getBlacklist() {
    return http.get<{
      list: Array<{ userId: string; username: string; avatar: string }>
      total: number
    }>('/blacklist', { page: 1, size: 100 }).then((res: any) => ({
      ...res,
      data: res.data?.list || []
    }))
  }
}

export default commonApi
