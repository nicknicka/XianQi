/**
 * 权限控制组合式函数
 * 用于在组件中控制权限相关的 UI 显示
 */
import { computed } from 'vue'
import { checkPermission, checkPermissions, checkAnyPermission, isAdmin, isSuperAdmin } from '@/utils/auth'
import { Permission } from '@/types/permission'

/**
 * 权限控制 Hook
 * @returns 权限相关的计算属性和方法
 */
export function usePermission() {
  /**
   * 检查单个权限
   */
  const hasPermission = (permission: Permission | string) => {
    return computed(() => checkPermission(permission))
  }

  /**
   * 检查多个权限（需要全部）
   */
  const hasPermissions = (permissions: (Permission | string)[]) => {
    return computed(() => checkPermissions(permissions))
  }

  /**
   * 检查多个权限（拥有其中一个即可）
   */
  const hasAnyPermission = (permissions: (Permission | string)[]) => {
    return computed(() => checkAnyPermission(permissions))
  }

  /**
   * 是否是管理员
   */
  const isAdminUser = computed(() => isAdmin())

  /**
   * 是否是超级管理员
   */
  const isSuperAdminUser = computed(() => isSuperAdmin())

  return {
    hasPermission,
    hasPermissions,
    hasAnyPermission,
    isAdminUser,
    isSuperAdminUser
  }
}
