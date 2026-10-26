import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

/**
 * 通知查询条件
 */
export interface NotificationQueryParams extends PageParams {
  title?: string
  type?: string // 通知类型：system-系统公告, activity-活动通知, urgent-紧急通知
  status?: number // 状态：0-草稿，1-已发布，2-已撤回
  startTime?: string
  endTime?: string
}

/**
 * 系统通知VO
 */
export interface NotificationVO {
  notificationId: number
  title: string
  content: string
  type: string // system-系统公告, activity-活动通知, urgent-紧急通知
  status: number // 0-草稿，1-已发布，2-已撤回
  publishTime?: string
  targetUsers?: string // all-全部用户, specific-指定用户
  targetUserIds?: string
  createdBy?: string
  createdTime: string
  updatedTime: string
}

/**
 * 创建通知参数
 */
export interface CreateNotificationParams {
  title: string
  content: string
  type: string
  publishWay: 'immediate' | 'schedule' | 'draft' // 立即发布/定时发布/保存草稿
  scheduleTime?: string
  targetUsers: 'all' | 'specific'
  targetUserIds?: string
}

/**
 * 更新通知参数
 */
export interface UpdateNotificationParams extends CreateNotificationParams {
  notificationId: number
}

/**
 * 分页查询通知列表
 */
export function getNotificationList(params: NotificationQueryParams) {
  return request<PageResponse<NotificationVO>>({
    url: '/system-notification',
    method: 'get',
    params,
  })
}

/**
 * 获取通知详情
 */
export function getNotificationDetail(notificationId: number) {
  return request<NotificationVO>({
    url: `/system-notification/${notificationId}`,
    method: 'get',
  })
}

/**
 * 创建通知
 */
export function createNotification(data: CreateNotificationParams) {
  // 处理 targetUsers 数据
  let processedTargetUsers: string | null = null
  let processedTargetUserIds: string | undefined = undefined

  if (data.targetUsers === 'specific' && data.targetUserIds) {
    // 指定用户：将逗号分隔的ID转换为JSON数组
    const ids = data.targetUserIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id))
    processedTargetUsers = JSON.stringify(ids)
    processedTargetUserIds = data.targetUserIds
  }
  // 如果是 'all'，则 targetUsers 保持为 null，表示全部用户

  return request<number>({
    url: '/system-notification',
    method: 'post',
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      publishWay: data.publishWay,
      scheduleTime: data.scheduleTime,
      targetUsers: processedTargetUsers, // JSON 数组字符串或 null
      targetUserIds: processedTargetUserIds,
    },
  })
}

/**
 * 更新通知
 */
export function updateNotification(data: UpdateNotificationParams) {
  // 处理 targetUsers 数据
  let processedTargetUsers: string | null = null
  let processedTargetUserIds: string | undefined = undefined

  if (data.targetUsers === 'specific' && data.targetUserIds) {
    // 指定用户：将逗号分隔的ID转换为JSON数组
    const ids = data.targetUserIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id))
    processedTargetUsers = JSON.stringify(ids)
    processedTargetUserIds = data.targetUserIds
  }
  // 如果是 'all'，则 targetUsers 保持为 null，表示全部用户

  return request<boolean>({
    url: `/system-notification/${data.notificationId}`,
    method: 'put',
    data: {
      notificationId: data.notificationId,
      title: data.title,
      content: data.content,
      type: data.type,
      publishWay: data.publishWay,
      scheduleTime: data.scheduleTime,
      targetUsers: processedTargetUsers, // JSON 数组字符串或 null
      targetUserIds: processedTargetUserIds,
    },
  })
}

/**
 * 发布通知
 */
export function publishNotification(notificationId: number) {
  return request<boolean>({
    url: `/system-notification/${notificationId}/publish`,
    method: 'put',
  })
}

/**
 * 删除通知
 */
export function deleteNotification(notificationId: number) {
  return request<boolean>({
    url: `/system-notification/${notificationId}`,
    method: 'delete',
  })
}
