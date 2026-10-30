/**
 * 实名认证表单的旁注校验消息。
 * 页面只在字段附近展示错误，不再依赖 toast 表达本地校验结果。
 */

import validator from '@/utils/validator'

export type RealNameFormField = 'realName' | 'idCard'

export function getRealNameFieldError(field: RealNameFormField, value: string): string | null {
  if (field === 'realName') {
    if (!value.trim()) return '请输入真实姓名'
    return validator.isRealName(value) ? null : '姓名格式不正确'
  }

  if (!value.trim()) return '请输入身份证号'
  return validator.isIdCard(value) ? null : '身份证号格式不正确'
}
