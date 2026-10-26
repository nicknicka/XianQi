/**
 * 敏感词检查工具类
 * 用于前端内容敏感词检测和过滤
 */

import { http } from '@/utils/request'

/**
 * 敏感词检查类型
 */
export enum SensitiveCheckType {
  PRODUCT = 1,    // 商品发布
  MESSAGE = 2,    // 消息发送
  COMMENT = 3     // 评论
}

/**
 * 敏感词检测结果
 */
export interface SensitiveWordCheckResult {
  hasSensitiveWord: boolean      // 是否包含敏感词
  passed: boolean                 // 是否通过检测
  sensitiveWords: string[]        // 检测到的敏感词列表
  filteredContent: string         // 替换后的内容
  message: string                 // 提示信息
}

/**
 * 敏感词API
 */
export const sensitiveWordApi = {
  /**
   * 检测敏感词
   * @param content 待检测内容
   * @param checkType 检测类型：1-商品发布，2-消息发送，3-评论
   */
  async check(content: string, checkType: SensitiveCheckType = SensitiveCheckType.MESSAGE) {
    return http.post<SensitiveWordCheckResult>('/sensitive-word/check', {
      content,
      checkType
    })
  },

  /**
   * 过滤敏感词
   * @param content 待过滤内容
   */
  async filter(content: string) {
    return http.post<string>('/sensitive-word/filter', content, {
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
}

/**
 * 检查内容是否包含敏感词
 * @param content 待检测内容
 * @param checkType 检测类型
 * @returns 检测结果，检查失败返回null
 */
export async function checkSensitiveWord(
  content: string,
  checkType: SensitiveCheckType = SensitiveCheckType.MESSAGE
): Promise<SensitiveWordCheckResult | null> {
  // 前端预校验：空内容直接返回null
  if (!content || !content.trim()) {
    return null
  }

  try {
    const response = await sensitiveWordApi.check(content, checkType)
    // http.post 返回 RequestResponse<SensitiveWordCheckResult>
    // 需要访问 .data 获取实际的检查结果
    return response?.data || null
  } catch (error) {
    console.error('[SensitiveWord] 检查失败:', error)
    // 检查失败时返回null，调用方可以决定是否放行
    return null
  }
}

/**
 * 过滤敏感词
 * @param content 待过滤内容
 * @returns 过滤后的内容，失败返回原内容
 */
export async function filterSensitiveWord(content: string): Promise<string> {
  if (!content || !content.trim()) {
    return content
  }

  try {
    const response = await sensitiveWordApi.filter(content)
    // http.post 返回 RequestResponse<string>
    // 需要访问 .data 获取实际的过滤结果
    return response?.data || content
  } catch (error) {
    console.error('[SensitiveWord] 过滤失败:', error)
    return content
  }
}

/**
 * 显示敏感词提示
 * @param result 检测结果
 * @returns 是否可以继续提交
 */
export function showSensitiveWordTip(result: SensitiveWordCheckResult): boolean {
  if (!result.passed) {
    // 禁止词 - 直接拒绝
    uni.showModal({
      title: '内容违规',
      content: `您的内容包含禁止词：「${result.sensitiveWords.join('、')}」`,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#ff4d4f'
    })
    return false
  }

  if (result.hasSensitiveWord) {
    // 敏感词 - 提示已自动过滤
    uni.showToast({
      title: `已自动过滤敏感词：${result.sensitiveWords.join('、')}`,
      icon: 'none',
      duration: 2000
    })
  }

  return true
}

/**
 * 防抖函数 - 用于实时检查
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

export default {
  checkSensitiveWord,
  filterSensitiveWord,
  showSensitiveWordTip,
  debounce,
  SensitiveCheckType
}
