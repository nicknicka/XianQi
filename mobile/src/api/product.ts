/**
 * 商品相关 API
 */
import { http } from '@/utils/request'
import type { Product, ProductCondition } from '@/types'
import { repairMojibakeText } from '@/utils/text'

// ===== 草稿相关类型定义 =====

/** 商品草稿保存请求 */
export interface ProductDraftDto {
  draftId?: string                    // 更新时传入
  title?: string                      // 商品标题
  description?: string                // 商品描述
  categoryId?: string                 // 分类ID
  price?: number                      // 价格
  originalPrice?: number              // 原价
  condition?: string                  // 成色字符串: new, almost_new, lightly_used, obviously_used, has_flaws
  conditionLevel?: number             // 成色等级 1-10（向后兼容）
  imageUrls?: string[]                // 图片URL列表
  location?: string                   // 交易地点
  latitude?: number                   // 纬度
  longitude?: number                  // 经度
  canDelivery?: boolean               // 是否支持邮寄
  freeShipping?: boolean              // 是否包邮
  // 秒杀配置
  isFlashSale?: boolean               // 是否参与秒杀
  sessionId?: string                  // 秒杀场次ID
  flashPrice?: number                 // 秒杀价格
  flashSaleStock?: number             // 秒杀库存
  limitPerUser?: number               // 每人限购数量
  repeatType?: number                 // 重复类型
  saleDate?: string                   // 秒杀日期
}

/** 商品草稿响应 */
export interface ProductDraftVo {
  draftId: string
  productId: string
  title: string
  description: string
  categoryId: string
  categoryName: string
  price: number
  originalPrice: number
  condition?: string                  // 成色字符串
  conditionLevel: number              // 成色等级 1-10
  coverImage: string
  images: string[]
  imageCount: number
  location: string
  latitude: number
  longitude: number
  canDelivery: boolean
  freeShipping: boolean
  isFlashSale: boolean
  flashPrice: number
  flashSaleStock: number
  createTime: string
  updateTime: string
  completion: number                  // 完成度 0-100
  missingFields: string[]             // 缺少的必填字段
}

/** 草稿列表响应 */
export interface ProductDraftListRes {
  records: ProductDraftVo[]
  total: number
  current: number
  size: number
}

// API 返回的商品数据结构（可能与 types/Product 不同）
export interface ProductDto {
  id: string
  title: string
  description: string
  price: number
  condition: ProductCondition | string
  categoryId: string
  images: string[]
  coverImage: string
  location: string
  userId: string
  userName: string
  userAvatar: string
  status: number
  viewCount: number
  favoriteCount: number
  createTime: string
  distance?: number
}

interface ProductListParams {
  page?: number
  pageSize?: number
  categoryId?: string
  keyword?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  sortBy?: 'latest' | 'price' | 'distance'
  locationCode?: string
}

function normalizeProduct(data: any): Product {
  if (!data || typeof data !== 'object') {
    return data
  }

  const title = repairMojibakeText(data.title)
  const description = repairMojibakeText(data.description)
  const categoryName = repairMojibakeText(data.categoryName)
  const location = repairMojibakeText(data.location)
  const userName = repairMojibakeText(
    data.userName || data.sellerNickname || data.nickname || data.username || ''
  )
  const sellerNickname = repairMojibakeText(data.sellerNickname || userName)

  return {
    ...data,
    id: data.id || data.productId,
    productId: data.productId || data.id,
    userId: data.userId || data.sellerId,
    title,
    description,
    categoryName,
    location,
    userName,
    sellerNickname
  }
}

function normalizeProductPage<T extends { data?: any }>(res: T): T {
  const pageData = res.data
  if (!pageData || typeof pageData !== 'object') {
    return res
  }

  const rawList = pageData.list || pageData.records
  if (!Array.isArray(rawList)) {
    return res
  }

  const list = rawList.map(normalizeProduct)
  return {
    ...res,
    data: {
      ...pageData,
      list,
      records: list
    }
  }
}

export const productApi = {
  /**
   * 获取商品列表
   */
  getProductList(params: ProductListParams) {
    return http.get<{
      list: Product[]
      total: number
    }>('/product', params).then(normalizeProductPage)
  },

  /**
   * 获取商品详情
   * @param id 商品ID
   * @param params 可选参数，支持 channel 渠道参数（normal-正常渠道，flash-秒杀渠道）
   */
  getProductDetail(id: string, params?: { channel?: 'normal' | 'flash' }) {
    return http.get<Product>(`/product/${id}`, params).then((res) => ({
      ...res,
      data: normalizeProduct(res.data)
    }))
  },

  /**
   * 发布商品
   */
  publishProduct(data: {
    title: string
    description: string
    price: number
    condition: string
    categoryId: string
    images: string[]
    location: string
    latitude?: number
    longitude?: number
  }) {
    return http.post<Product>('/product', data, { showLoading: true })
  },

  /**
   * 更新商品
   */
  updateProduct(id: string, data: Partial<Product>) {
    return http.put<Product>(`/product/${id}`, data, { showLoading: true })
  },

  /**
   * 删除商品
   */
  deleteProduct(id: string) {
    return http.delete(`/product/${id}`, undefined, { showLoading: true })
  },

  /**
   * 上架/下架商品
   * @param id 商品ID
   * @param status 状态：0-下架, 1-在售, 2-已售
   */
  updateProductStatus(id: string, status: number) {
    return http.put(`/product/${id}/status`, { status }, { showLoading: true })
  },

  /**
   * 标记已售
   */
  markAsSold(id: string) {
    return http.put(`/product/${id}/sold`, undefined, { showLoading: true })
  },

  /**
   * 我的商品
   */
  getMyProducts(params: { status?: number; page?: number; pageSize?: number }) {
    return http.get<{
      list: Product[]
      total: number
    }>('/product/my', params).then(normalizeProductPage)
  },

  /**
   * 搜索商品
   */
  searchProducts(params: ProductListParams) {
    return http.get<{
      list: Product[]
      total: number
    }>('/product/search', params).then(normalizeProductPage)
  },

  /**
   * 获取推荐商品（热门商品）V1
   */
  getRecommendProducts(params: { categoryId?: string; limit?: number }) {
    return http.get<Product[]>('/recommend/hot', params)
  },

  /**
   * 获取个性化推荐商品（V2，支持地理位置）
   */
  getPersonalizedRecommendations(params: {
    limit?: number
    latitude?: number
    longitude?: number
  }) {
    return http.get<Product[]>('/recommend/v2/personalized', params)
  },

  /**
   * 获取热门商品推荐（V2，带缓存）
   */
  getHotProductsV2(params: { categoryId?: string; limit?: number }) {
    return http.get<Product[]>('/recommend/v2/hot', params)
  },

  /**
   * 获取附近商品推荐（V2，基于地理位置）
   */
  getNearbyProducts(params: {
    latitude: number
    longitude: number
    limit?: number
  }) {
    return http.get<Product[]>('/recommend/v2/by-location', params)
  },

  /**
   * 收藏商品
   */
  favoriteProduct(id: string) {
    return http.post(`/favorite/${id}`)
  },

  /**
   * 取消收藏
   */
  unfavoriteProduct(id: string) {
    return http.delete(`/favorite/${id}`)
  },

  /**
   * 收藏列表
   */
  getFavoriteList(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: Product[]
      total: number
    }>('/favorite', params).then(normalizeProductPage)
  },

  /**
   * 浏览历史
   */
  getViewHistory(params: { page?: number; pageSize?: number }) {
    return http.get<{
      list: Product[]
      total: number
    }>('/history', params).then(normalizeProductPage)
  },

  /**
   * 清空浏览历史
   */
  clearViewHistory() {
    return http.delete('/history/clear', undefined, { showLoading: true })
  },

  /**
   * 删除单条浏览历史
   */
  deleteViewHistory(historyId: string) {
    return http.delete(`/history/${historyId}`, undefined, { showLoading: true })
  },

  /**
   * 获取当前秒杀商品列表
   */
  getFlashSaleProducts(params: { limit?: number }) {
    return http.get<Product[]>('/flash-sale/current/products', params)
  },

  /**
   * 获取相似商品推荐
   */
  getSimilarProducts(productId: string, params: { limit?: number }) {
    return http.get<Product[]>(`/product/${productId}/similar`, params)
  },

  /**
   * 获取卖家的其他商品
   */
  getSellerProducts(userId: string, params: { page?: number; pageSize?: number; excludeProductId?: string }) {
    return http.get<{
      list: Product[]
      total: number
    }>(`/product/user/${userId}/products`, {
      page: params.page,
      size: params.pageSize,
      excludeProductId: params.excludeProductId
    })
  },

  // ===== 草稿相关方法 =====

  /**
   * 保存商品草稿
   */
  saveDraft(data: ProductDraftDto) {
    return http.post<ProductDraftVo>('/product/draft', data)
  },

  /**
   * 获取草稿列表
   */
  getDraftList(params: { page?: number; pageSize?: number }) {
    return http.get<ProductDraftListRes>('/product/draft', params)
  },

  /**
   * 获取草稿详情
   */
  getDraftDetail(id: string) {
    return http.get<ProductDraftVo>(`/product/draft/${id}`)
  },

  /**
   * 从草稿发布
   */
  publishFromDraft(id: string) {
    return http.post<Product>(`/product/draft/${id}/publish`, undefined, { showLoading: true })
  },

  /**
   * 删除草稿
   */
  deleteDraft(id: string) {
    return http.delete(`/product/draft/${id}`, undefined, { showLoading: true })
  },

  /**
   * 获取草稿数量
   */
  getDraftCount() {
    return http.get<{ count: number; maxCount: number }>('/product/draft/count')
  }
}

export default productApi
