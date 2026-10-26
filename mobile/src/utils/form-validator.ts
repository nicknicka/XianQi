/**
 * 增强的表单验证工具类
 * 提供常用的表单验证规则和验证器
 */

import { isValidPhone, isValidEmail, isValidIdCard, isValid as isNotEmpty } from './common'
import { isEmpty } from './validator'

/**
 * 验证规则接口
 */
export interface ValidationRule {
  /** 规则名称 */
  name: string
  /** 验证函数 */
  validator: (value: any, formData?: Record<string, any>) => boolean | string
  /** 错误提示 */
  message?: string
  /** 是否触发验证（always | change | blur） */
  trigger?: 'always' | 'change' | 'blur'
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 是否通过 */
  valid: boolean
  /** 错误信息 */
  errors: Record<string, string[]>
}

/**
 * 常用验证规则
 */
export const ValidationRules = {
  // 必填
  required: (message = '此项为必填项', trigger: 'change' | 'blur' = 'blur'): ValidationRule => ({
    name: 'required',
    validator: (value: any) => {
      if (value === null || value === undefined) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return true
    },
    message,
    trigger
  }),

  // 手机号
  phone: (message = '请输入正确的手机号'): ValidationRule => ({
    name: 'phone',
    validator: (value: string) => !value || isValidPhone(value),
    message
  }),

  // 邮箱
  email: (message = '请输入正确的邮箱地址'): ValidationRule => ({
    name: 'email',
    validator: (value: string) => !value || isValidEmail(value),
    message
  }),

  // 身份证号
  idCard: (message = '请输入正确的身份证号'): ValidationRule => ({
    name: 'idCard',
    validator: (value: string) => !value || isValidIdCard(value),
    message
  }),

  // 学号
  studentId: (message = '请输入正确的学号'): ValidationRule => ({
    name: 'studentId',
    validator: (value: string) => !value || /^\d{8,12}$/.test(value),
    message
  }),

  // 用户名 (2-20位字母数字下划线)
  username: (message = '用户名为2-20位字母数字下划线'): ValidationRule => ({
    name: 'username',
    validator: (value: string) => !value || /^[a-zA-Z0-9_]{2,20}$/.test(value),
    message
  }),

  // 最小长度
  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validator: (value: string) => !value || value.length >= min,
    message: message || `长度不能少于${min}个字符`
  }),

  // 最大长度
  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validator: (value: string) => !value || value.length <= max,
    message: message || `长度不能超过${max}个字符`
  }),

  // 长度范围
  lengthRange: (min: number, max: number, message?: string): ValidationRule => ({
    name: 'lengthRange',
    validator: (value: string) => !value || (value.length >= min && value.length <= max),
    message: message || `长度应在${min}-${max}个字符之间`
  }),

  // 最小值
  min: (min: number, message?: string): ValidationRule => ({
    name: 'min',
    validator: (value: number) => value === null || value === undefined || value >= min,
    message: message || `不能小于${min}`
  }),

  // 最大值
  max: (max: number, message?: string): ValidationRule => ({
    name: 'max',
    validator: (value: number) => value === null || value === undefined || value <= max,
    message: message || `不能大于${max}`
  }),

  // 数值范围
  range: (min: number, max: number, message?: string): ValidationRule => ({
    name: 'range',
    validator: (value: number) => {
      return value === null || value === undefined || (value >= min && value <= max)
    },
    message: message || `应在${min}-${max}之间`
  }),

  // 正则表达式
  pattern: (regex: RegExp, message = '格式不正确'): ValidationRule => ({
    name: 'pattern',
    validator: (value: string) => !value || regex.test(value),
    message
  }),

  // URL
  url: (message = '请输入正确的URL'): ValidationRule => ({
    name: 'url',
    validator: (value: string) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message
  }),

  // 数字
  number: (message = '请输入数字'): ValidationRule => ({
    name: 'number',
    validator: (value: any) => !value || !isNaN(Number(value)),
    message
  }),

  // 整数
  integer: (message = '请输入整数'): ValidationRule => ({
    name: 'integer',
    validator: (value: any) => !value || Number.isInteger(Number(value)),
    message
  }),

  // 正数
  positive: (message = '请输入正数'): ValidationRule => ({
    name: 'positive',
    validator: (value: number) => value === null || value === undefined || value > 0,
    message
  }),

  // 密码（至少包含数字和字母）
  password: (message = '密码需包含数字和字母，至少6位'): ValidationRule => ({
    name: 'password',
    validator: (value: string) => !value || /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(value),
    message
  }),

  // 确认密码
  confirmPassword: (passwordField: string, message = '两次密码不一致'): ValidationRule => ({
    name: 'confirmPassword',
    validator: (value: string, formData?: Record<string, any>) => {
      if (!value) return true
      if (!formData) return true
      return value === formData[passwordField]
    },
    message
  }),

  // 自定义验证函数
  custom: (
    validator: (value: any, formData?: Record<string, any>) => boolean | string,
    message?: string
  ): ValidationRule => ({
    name: 'custom',
    validator,
    message
  })
}

/**
 * 表单验证器类
 */
export class FormValidator {
  private rules: Record<string, ValidationRule[]> = {}
  private formData: Record<string, any> = {}

  /**
   * 添加验证规则
   */
  addRule(field: string, rules: ValidationRule[]): FormValidator {
    if (!this.rules[field]) {
      this.rules[field] = []
    }
    this.rules[field].push(...rules)
    return this
  }

  /**
   * 批量添加验证规则
   */
  addRules(rules: Record<string, ValidationRule[]>): FormValidator {
    Object.keys(rules).forEach(field => {
      this.addRule(field, rules[field])
    })
    return this
  }

  /**
   * 设置表单数据
   */
  setData(data: Record<string, any>): FormValidator {
    this.formData = { ...this.formData, ...data }
    return this
  }

  /**
   * 更新单个字段数据
   */
  setField(field: string, value: any): FormValidator {
    this.formData[field] = value
    return this
  }

  /**
   * 验证单个字段
   */
  validateField(field: string): string | null {
    const rules = this.rules[field]
    if (!rules || rules.length === 0) {
      return null
    }

    const value = this.formData[field]

    for (const rule of rules) {
      const result = rule.validator(value, this.formData)
      if (result === false) {
        return rule.message || `${field}验证失败`
      }
      if (typeof result === 'string') {
        return result
      }
    }

    return null
  }

  /**
   * 验证所有字段
   */
  validate(): ValidationResult {
    const errors: Record<string, string[]> = {}
    let valid = true

    Object.keys(this.rules).forEach(field => {
      const error = this.validateField(field)
      if (error) {
        errors[field] = [error]
        valid = false
      }
    })

    return { valid, errors }
  }

  /**
   * 验证指定字段
   */
  validateFields(fields: string[]): ValidationResult {
    const errors: Record<string, string[]> = {}
    let valid = true

    fields.forEach(field => {
      const error = this.validateField(field)
      if (error) {
        errors[field] = [error]
        valid = false
      }
    })

    return { valid, errors }
  }

  /**
   * 清除验证规则
   */
  clearRules(): FormValidator {
    this.rules = {}
    return this
  }

  /**
   * 清除指定字段的规则
   */
  clearFieldRules(field: string): FormValidator {
    delete this.rules[field]
    return this
  }

  /**
   * 重置表单
   */
  reset(): FormValidator {
    this.formData = {}
    return this
  }
}

/**
 * 快速创建验证器
 */
export function createValidator(
  rules: Record<string, ValidationRule[]>,
  data?: Record<string, any>
): FormValidator {
  const validator = new FormValidator()
  validator.addRules(rules)
  if (data) {
    validator.setData(data)
  }
  return validator
}

/**
 * 表单验证 Composable
 * 用于 Vue 3 组件中
 */
export function useFormValidator<T extends Record<string, any> = any>() {
  const validator = new FormValidator()
  const formData = ref<T>({} as T)
  const errors = ref<Record<string, string[]>>({})
  const validating = ref(false)

  /**
   * 初始化规则
   */
  function initRules(rules: Record<string, ValidationRule[]>) {
    validator.addRules(rules)
  }

  /**
   * 设置表单数据
   */
  function setFormData(data: T) {
    formData.value = data
    validator.setData(data)
  }

  /**
   * 更新单个字段
   */
  function setField<K extends keyof T>(field: K, value: T[K]) {
    formData.value[field] = value
    validator.setData(formData.value)
  }

  /**
   * 验证单个字段
   */
  function validateField(field: string): string | null {
    const error = validator.validateField(field)
    if (error) {
      errors.value[field] = [error]
    } else {
      delete errors.value[field]
    }
    return error
  }

  /**
   * 验证所有字段
   */
  async function validate(): Promise<boolean> {
    validating.value = true
    const result = validator.validate()
    errors.value = result.errors
    validating.value = false
    return result.valid
  }

  /**
   * 验证指定字段
   */
  function validateFields(fields: string[]): boolean {
    const result = validator.validateFields(fields)
    errors.value = result.errors
    return result.valid
  }

  /**
   * 清除错误
   */
  function clearErrors(field?: string) {
    if (field) {
      delete errors.value[field]
    } else {
      errors.value = {}
    }
  }

  /**
   * 重置表单
   */
  function reset() {
    formData.value = {} as T
    errors.value = {}
    validator.reset()
  }

  return {
    formData,
    errors,
    validating,
    initRules,
    setFormData,
    setField,
    validateField,
    validate,
    validateFields,
    clearErrors,
    reset
  }
}

export default {
  ValidationRules,
  FormValidator,
  createValidator,
  useFormValidator
}
