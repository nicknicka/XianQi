import request from '@/utils/request'

export interface SystemConfig {
  configId: string
  configKey: string
  configValue: string
  configType: string // 配置值类型：string/number/boolean/json
  groupName: string // 分组名称：basic/upload/payment/email/sms/security/business
  valueOptions?: string // 可选值列表（JSON）
  description?: string
  isPublic?: number // 是否公开：0-否，1-是
  isSystem?: number // 是否系统配置：0-否，1-是
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

// 扩展类型：用于表格编辑状态
export interface SystemConfigWithEdit extends SystemConfig {
  isEditing: boolean
  tempValue: any
}

export function getConfigList(groupName?: string) {
  return request<SystemConfig[]>({
    url: '/config/all',
    method: 'get',
    params: { groupName },
  })
}

export function getConfig(configKey: string) {
  return request<string>({
    url: `/config/value/${configKey}`,
    method: 'get',
  })
}

export function updateConfig(configKey: string, configValue: string) {
  return request<boolean>({
    url: '/config/value',
    method: 'put',
    params: { configKey, configValue },
  })
}

export function batchUpdateConfig(configs: { configKey: string; configValue: string }[]) {
  return request<boolean>({
    url: '/config/batch',
    method: 'put',
    data: configs,
  })
}
