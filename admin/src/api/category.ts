import request from '@/utils/request'

// ==================== 类型定义 ====================

/**
 * 分类 VO
 */
export interface CategoryVO {
  categoryId: number
  name: string
  code?: string
  parentId?: number | null
  icon?: string
  gradient?: string
  sortOrder: number
  status: number // 0-禁用，1-启用
  createTime?: string
  updateTime?: string
  children?: CategoryVO[] // 子分类
  productCount?: number // 商品数量
}

/**
 * 创建分类参数
 */
export interface CategoryCreateParams {
  name: string
  code?: string
  parentId?: number | null
  icon?: string
  gradient?: string
  sortOrder?: number
  status: number
}

/**
 * 更新分类参数
 */
export interface CategoryUpdateParams extends CategoryCreateParams {
  categoryId: number
}

// ==================== API 接口 ====================

/**
 * 获取分类列表（树形结构）
 */
export function getCategoryTree() {
  return request<CategoryVO[]>({
    url: '/category/tree',
    method: 'get',
  })
}

/**
 * 获取分类列表（平铺结构）
 */
export function getCategoryList() {
  return request<CategoryVO[]>({
    url: '/category/list',
    method: 'get',
  })
}

/**
 * 获取分类详情
 */
export function getCategoryDetail(categoryId: number) {
  return request<CategoryVO>({
    url: `/category/${categoryId}`,
    method: 'get',
  })
}

/**
 * 创建分类
 */
export function createCategory(data: CategoryCreateParams) {
  return request<number>({
    url: '/category',
    method: 'post',
    data,
  })
}

/**
 * 更新分类
 */
export function updateCategory(data: CategoryUpdateParams) {
  return request<boolean>({
    url: '/category',
    method: 'put',
    data,
  })
}

/**
 * 删除分类
 */
export function deleteCategory(categoryId: number) {
  return request<boolean>({
    url: `/category/${categoryId}`,
    method: 'delete',
  })
}

/**
 * 更新分类状态
 */
export function updateCategoryStatus(categoryId: number, status: number) {
  return request<boolean>({
    url: `/category/${categoryId}/status`,
    method: 'put',
    params: { status },
  })
}

/**
 * 批量更新排序
 */
export function batchUpdateSortOrder(sortData: { categoryId: number; sortOrder: number }[]) {
  return request<boolean>({
    url: '/category/sort',
    method: 'put',
    data: sortData,
  })
}
