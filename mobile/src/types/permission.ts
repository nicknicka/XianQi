/**
 * 权限管理类型定义
 */

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'user',           // 普通用户
  ADMIN = 'admin',         // 管理员
  SUPER_ADMIN = 'super'    // 超级管理员
}

/**
 * 权限枚举
 */
export enum Permission {
  // 商品管理
  PRODUCT_CREATE = 'product:create',
  PRODUCT_EDIT = 'product:edit',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_AUDIT = 'product:audit',

  // 用户管理
  USER_MANAGE = 'user:manage',
  USER_BAN = 'user:ban',

  // 订单管理
  ORDER_MANAGE = 'order:manage',
  ORDER_REFUND = 'order:refund',

  // 系统管理
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOG = 'system:log'
}

/**
 * 角色权限映射
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // 超级管理员拥有所有权限
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_EDIT,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_AUDIT,
    Permission.USER_MANAGE,
    Permission.USER_BAN,
    Permission.ORDER_MANAGE,
    Permission.ORDER_REFUND,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_LOG
  ],
  [UserRole.ADMIN]: [
    // 管理员权限
    Permission.PRODUCT_AUDIT,
    Permission.USER_MANAGE,
    Permission.ORDER_MANAGE,
    Permission.SYSTEM_LOG
  ],
  [UserRole.USER]: [
    // 普通用户权限
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_EDIT
  ]
}
