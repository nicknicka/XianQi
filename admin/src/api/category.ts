import request from '@/utils/request'

// ==================== 类型定义 ====================

/**
 * 分类 VO
 */
export interface CategoryVO {
  categoryId: string
  name: string
  code?: string
  parentId?: string | null
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
  parentId?: string | null
  icon?: string
  gradient?: string
  sortOrder?: number
  status: number
}

/**
 * 更新分类参数
 */
export interface CategoryUpdateParams extends CategoryCreateParams {
  categoryId: string
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
export function getCategoryDetail(categoryId: string) {
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
  }).then(categoryId => String(categoryId))
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
export function deleteCategory(categoryId: string) {
  return request<boolean>({
    url: `/category/${categoryId}`,
    method: 'delete',
  })
}

/**
 * 更新分类状态
 */
export function updateCategoryStatus(categoryId: string, status: number) {
  return request<boolean>({
    url: `/category/${categoryId}/status`,
    method: 'put',
    params: { status },
  })
}

/**
 * 批量更新排序
 */
export function batchUpdateSortOrder(sortData: { categoryId: string; sortOrder: number }[]) {
  return request<boolean>({
    url: '/category/sort',
    method: 'put',
    data: sortData,
  })
}
