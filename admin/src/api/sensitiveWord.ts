import request from '@/utils/request'
import type { PageParams, PageResponse } from './statistics'

// ==================== 类型定义 ====================

/**
 * 敏感词 VO
 */
export interface SensitiveWordVO {
  wordId: string
  word: string
  type: number // 1-禁止词，2-敏感词，3-替换词
  replaceWord?: string
  level: number // 1-一般，2-严重
  status: number // 0-禁用，1-启用
  createdAt?: string
  updatedAt?: string
}

/**
 * 敏感词查询参数
 */
export interface SensitiveWordQueryParams extends PageParams {
  keyword?: string
  type?: number
  level?: number
  status?: number
}

/**
 * 创建/更新敏感词参数
 */
export interface SensitiveWordParams {
  wordId?: string
  word: string
  type: number
  replaceWord?: string
  level: number
  status: number
}

// ==================== API 接口 ====================

/**
 * 分页查询敏感词列表
 */
export function getSensitiveWordList(params: SensitiveWordQueryParams) {
  return request<PageResponse<SensitiveWordVO>>({
    url: '/sensitive-word/list',
    method: 'get',
    params,
  })
}

/**
 * 获取敏感词详情
 */
export function getSensitiveWordDetail(wordId: string) {
  return request<SensitiveWordVO>({
    url: `/sensitive-word/${wordId}`,
    method: 'get',
  })
}

/**
 * 创建敏感词
 */
export function createSensitiveWord(data: SensitiveWordParams) {
  return request<boolean>({
    url: '/sensitive-word',
    method: 'post',
    data,
  })
}

/**
 * 更新敏感词
 */
export function updateSensitiveWord(data: SensitiveWordParams) {
  return request<boolean>({
    url: '/sensitive-word',
    method: 'put',
    data,
  })
}

/**
 * 删除敏感词
 */
export function deleteSensitiveWord(wordId: string) {
  return request<boolean>({
    url: `/sensitive-word/${wordId}`,
    method: 'delete',
  })
}

/**
 * 批量删除敏感词
 */
export function batchDeleteSensitiveWords(wordIds: string[]) {
  return request<boolean>({
    url: '/sensitive-word/batch',
    method: 'delete',
    data: wordIds,
  })
}

/**
 * 更新敏感词状态
 */
export function updateSensitiveWordStatus(wordId: string, status: number) {
  return request<boolean>({
    url: `/sensitive-word/${wordId}/status`,
    method: 'put',
    params: { status },
  })
}

/**
 * 批量导入敏感词（Excel或文本）
 */
export function importSensitiveWords(data: { words: string[]; type: number; level: number }) {
  return request<boolean>({
    url: '/sensitive-word/import',
    method: 'post',
    data,
  })
}

/**
 * 导出敏感词
 */
export function exportSensitiveWords() {
  return request<Blob>({
    url: '/sensitive-word/export',
    method: 'get',
    responseType: 'blob',
  })
}
