import request from '@/utils/request'

// ==================== 类型定义 ====================

/**
 * 场次模板
 */
export interface FlashSaleSessionTemplate {
  templateId: number
  name: string
  sessionTime: string // HH:mm 格式，如 10:00
  durationHours: number
  sortOrder: number
  isEnabled: number // 0-禁用，1-启用
  createTime?: string
  updateTime?: string
}

/**
 * 秒杀场次
 */
export interface FlashSaleSession {
  sessionId: string // 使用 string 类型避免雪花ID精度丢失
  name: string
  description?: string
  sessionTime: string // HH:mm 格式
  startTime: string
  endTime: string
  sortOrder: number
  sessionType: number // 1-固定场次，2-临时场次
  enabled: number // 0-禁用，1-启用
  createTime?: string
}

/**
 * 创建/编辑模板参数
 */
export interface FlashSaleTemplateParams {
  templateId?: number
  name: string
  sessionTime: string
  durationHours: number
  sortOrder?: number
  isEnabled?: number
}

/**
 * 创建/编辑临时场次参数
 */
export interface FlashSaleSessionParams {
  sessionId?: string // 使用 string 类型避免雪花ID精度丢失
  name: string
  description?: string
  startTime: string
  endTime: string
  sortOrder?: number
}

// ==================== 模板管理接口 ====================

/**
 * 获取所有场次模板
 */
export function getFlashSaleTemplates() {
  return request<FlashSaleSessionTemplate[]>({
    url: '/flash-sale/templates',
    method: 'get',
  })
}

/**
 * 创建/更新场次模板
 */
export function saveFlashSaleTemplate(data: FlashSaleTemplateParams) {
  return request<string>({
    url: '/flash-sale/template',
    method: 'post',
    data,
  })
}

/**
 * 启用/禁用模板
 */
export function toggleFlashSaleTemplate(templateId: number) {
  return request<string>({
    url: `/flash-sale/template/${templateId}/toggle`,
    method: 'put',
  })
}

// ==================== 场次生成接口 ====================

/**
 * 手动触发更新今天的场次
 */
export function generateTodaySessions() {
  return request<string>({
    url: '/flash-sale/sessions/generate',
    method: 'post',
  })
}

/**
 * 为指定日期更新场次
 */
export function generateSessionsForDate(date: string) {
  return request<string>({
    url: `/flash-sale/sessions/generate/${date}`,
    method: 'post',
  })
}

// ==================== 临时场次管理接口 ====================

/**
 * 获取所有临时场次
 */
export function getTemporarySessions() {
  return request<FlashSaleSession[]>({
    url: '/flash-sale/sessions/temporary',
    method: 'get',
  })
}

/**
 * 创建临时场次
 */
export function createTemporarySession(data: FlashSaleSessionParams) {
  return request<string>({
    url: '/flash-sale/sessions/temporary',
    method: 'post',
    data,
  })
}

/**
 * 更新临时场次
 */
export function updateTemporarySession(sessionId: string, data: FlashSaleSessionParams) {
  return request<string>({
    url: `/flash-sale/sessions/temporary/${sessionId}`,
    method: 'put',
    data,
  })
}

/**
 * 删除临时场次
 */
export function deleteTemporarySession(sessionId: string) {
  return request<string>({
    url: `/flash-sale/sessions/temporary/${sessionId}`,
    method: 'delete',
  })
}

// ==================== 固定场次管理接口 ====================

/**
 * 获取所有固定场次
 */
export function getFixedSessions() {
  return request<FlashSaleSession[]>({
    url: '/flash-sale/sessions/fixed',
    method: 'get',
  })
}

/**
 * 启用/禁用场次
 */
export function toggleFlashSaleSession(sessionId: string) {
  return request<string>({
    url: `/flash-sale/sessions/${sessionId}/toggle`,
    method: 'put',
  })
}

/**
 * 批量启用/禁用所有固定场次
 */
export function batchToggleSessions(enabled: number) {
  return request<string>({
    url: '/flash-sale/sessions/batch-toggle',
    method: 'put',
    data: { enabled },
  })
}
