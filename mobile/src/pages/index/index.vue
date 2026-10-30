<template>
	<view class="home-page" :style="themeStyle">
		<!-- 骨架屏 -->
		<view v-if="isLoading" class="skeleton-container">
			<skeleton />
		</view>

		<!-- 实际内容 -->
		<view v-else class="page-content">
			<!-- 顶部搜索栏 -->
			<view class="search-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="search-content">
					<view class="location-box" @tap="selectLocation">
						<text class="icon-location">📍</text>
						<text class="location-text">{{ currentLocation }}</text>
						<text class="icon-arrow">▼</text>
					</view>
					<view class="search-box" @tap="goToSearch">
						<text class="icon-search">🔍</text>
						<text class="search-placeholder">搜索商品、用户...</text>
					</view>
					<view class="message-btn" @tap="goToMessage">
						<text class="iconfont icon-message" />
						<view
							class="badge"
							:class="{ 'has-count': unreadCount > 1 }"
							v-if="unreadCount > 0"
						>
							<text v-if="unreadCount > 1">{{
								unreadCount > 99 ? "99" : unreadCount
							}}</text>
						</view>
					</view>
				</view>

				<!-- 热门搜索标签 -->
				<view class="hot-tags" v-if="hotTags.length > 0">
					<scroll-view class="tags-scroll" scroll-x :show-scrollbar="false">
						<view
							class="tag-item"
							v-for="(tag, index) in hotTags"
							:key="index"
							@tap="searchTag(tag)"
						>
							<text class="tag-icon" v-if="index < 3">🔥</text>
							<text class="tag-text">{{ tag }}</text>
						</view>
					</scroll-view>
				</view>
			</view>

			<!-- 活动公告横幅 -->
			<view
				class="notice-banner"
				v-if="noticeList.length > 0"
				:class="{ closing: isNoticeClosing }"
				@tap="onNoticeTap"
			>
				<view class="notice-left">
					<view class="notice-icon">📢</view>
					<view class="notice-new" v-if="hasUnreadNotice">NEW</view>
				</view>
				<view class="notice-content">
					<view
						class="notice-text-wrapper"
						:style="{
							transform: `translateY(-${currentNoticeIndex * 100}%)`,
						}"
					>
						<view
							class="notice-item"
							v-for="(notice, index) in noticeList"
							:key="
								notice.notificationId ||
								notice.noticeId ||
								notice.id ||
								index
							"
						>
							<text class="notice-text">{{ notice.content }}</text>
						</view>
					</view>
				</view>
				<view class="notice-right">
					<view class="notice-dots">
						<view
							class="notice-dot"
							v-for="(notice, index) in noticeList"
							:key="
								notice.notificationId ||
								notice.noticeId ||
								notice.id ||
								index
							"
							:class="{ active: index === currentNoticeIndex }"
						></view>
					</view>
					<view class="notice-close" @tap.stop="closeNotice">✕</view>
				</view>
			</view>

			<!-- 轮播图 -->
			<view class="banner-section">
				<swiper
					v-if="bannerList.length > 0"
					class="banner-swiper"
					:indicator-dots="bannerList.length > 1"
					:autoplay="bannerList.length > 1"
					:circular="bannerList.length > 1"
					:interval="3000"
					:duration="500"
					indicator-color="rgba(255,255,255,0.5)"
					:indicator-active-color="primaryColor"
				>
					<swiper-item
						v-for="(item, index) in bannerList"
						:key="index"
						@tap="onBannerTap(item)"
					>
						<lazy-image
							class="banner-image"
							:src="item.image"
							mode="aspectFit"
							width="750"
							height="360"
							:disable-lazy-load="true"
						/>
					</swiper-item>
				</swiper>
				<!-- 轮播图进度 -->
				<view class="banner-progress">
					<view
						class="progress-bar"
						:style="{ width: bannerProgress + '%' }"
					></view>
				</view>
			</view>

			<!-- 分类导航 -->
			<view class="category-section" v-if="categoryList.length > 0">
				<view class="category-grid">
					<view
						class="category-item"
						v-for="(item, index) in categoryList"
						:key="index"
						@tap="onCategoryTap(item)"
					>
						<view
							class="category-icon"
							:style="{ background: getCategoryGradient(item.icon) }"
						>
							<text class="icon-text">{{
								getCategoryEmoji(item.icon)
							}}</text>
						</view>
						<text class="category-name">{{ item.name }}</text>
					</view>
				</view>
			</view>

			<!-- 分类空状态 -->
			<view class="category-section category-empty" v-else-if="!isLoading">
				<view class="empty-category-icon">📦</view>
				<text class="empty-category-text">暂无分类</text>
			</view>

			<!-- 快捷功能入口 -->
			<view class="quick-actions">
				<view class="action-item" @tap="goToPublish">
					<view class="action-icon publish-icon">
						<uni-icons type="plus" size="22" color="#fff" />
					</view>
					<text class="action-text">发布商品</text>
				</view>
				<view class="action-item" @tap="goToShare">
					<view class="action-icon share-icon">
						<uni-icons type="reload" size="22" color="#fff" />
					</view>
					<text class="action-text">共享物品</text>
				</view>
				<view class="action-item" @tap="goToOrders">
					<view class="action-icon order-icon">
						<uni-icons type="list" size="22" color="#fff" />
					</view>
					<text class="action-text">我的订单</text>
				</view>
			</view>

			<!-- 限时秒杀 -->
			<view class="flash-sale-section" v-if="flashSaleProducts.length > 0">
				<view class="section-header">
					<view class="header-left">
						<text class="section-title">⚡ 限时秒杀</text>
						<view class="countdown">
							<text class="countdown-text">{{ countdownText }}</text>
						</view>
					</view>
					<view
						class="section-more"
						@tap="goToFlashSale"
						:class="{ loading: isNavigatingToFlashSale }"
					>
						<text>{{
							isNavigatingToFlashSale
								? `加载中${".".repeat(loadingDots) || ""}`
								: "更多"
						}}</text>
						<text
							class="icon-arrow-right"
							:class="{ spinning: isNavigatingToFlashSale }"
							>{{ isNavigatingToFlashSale ? "⟳" : "›" }}</text
						>
					</view>
				</view>
				<scroll-view class="flash-sale-scroll" scroll-x :show-scrollbar="false">
					<view
						class="flash-sale-item"
						v-for="product in flashSaleProducts"
						:key="product.id"
						@tap="goToDetail(product)"
					>
						<view class="flash-badge">限时</view>
						<lazy-image
							class="flash-image"
							:src="product.coverImage || '/static/images/empty.png'"
							mode="aspectFill"
							width="240"
							height="200"
						/>
						<view class="flash-info">
							<text class="flash-title">{{ product.title }}</text>
							<view class="flash-price-box">
								<text class="flash-price">¥{{ product.flashPrice }}</text>
								<text class="original-price">¥{{ product.price }}</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 猜你喜欢 -->
			<view class="recommend-section">
				<view class="section-header">
					<text class="section-title">💖 猜你喜欢</text>
					<view
						class="refresh-btn"
						:class="{ refreshing: isRefreshingRecommend }"
						@tap="refreshRecommend"
					>
						<text class="refresh-icon">↻</text>
						<text>{{ isRefreshingRecommend ? "刷新中" : "换一批" }}</text>
					</view>
				</view>

				<!-- 商品列表 -->
				<view
					class="products-grid"
					v-if="productList.length > 0 && !isLoading && !isRefreshingRecommend"
				>
					<view
						class="product-item-wrapper"
						v-for="(product, index) in productList"
						:key="product.id"
						:style="{ animationDelay: index * 50 + 'ms' }"
					>
						<product-card
							:product="product"
							:default-favorited="product.isFavorite"
							@click="goToDetail(product)"
							@favorite="handleProductFavorite"
						/>
					</view>
				</view>

				<!-- 刷新中的骨架屏 -->
				<view class="products-grid" v-if="isRefreshingRecommend">
					<view
						class="product-item-wrapper skeleton-item"
						v-for="i in 4"
						:key="'skeleton-' + i"
					>
						<view class="skeleton-image"></view>
						<view class="skeleton-content">
							<view class="skeleton-title"></view>
							<view class="skeleton-meta"></view>
							<view class="skeleton-footer"></view>
						</view>
					</view>
				</view>

				<!-- 加载中状态 -->
				<view class="loading-more" v-if="isLoadingMore && !isRefreshingRecommend">
					<text class="loading-text">加载中...</text>
				</view>

				<!-- 没有更多 -->
				<view class="no-more" v-if="noMore && productList.length > 0">
					<text class="no-more-text">没有更多了</text>
				</view>

				<!-- 空状态 -->
				<empty-state
					v-else-if="!isLoading && productList.length === 0"
					image="/static/images/empty.png"
					text="暂无商品"
					button-text="去发布"
					:show-button="true"
					@action="goToPublish"
				/>
			</view>

			<CustomTabBar />
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useThemePage, useThemeStyle, useThemeColors } from '@/utils/theme'
import { getStatusBarHeight } from '@/utils/system-info'
import ProductCard from '@/components/product-card/product-card.vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import EmptyState from '@/components/empty-state/empty-state.vue'
import Skeleton from '@/components/skeleton/skeleton.vue'
import { bannerApi } from '@/api/banner'
import { productApi } from '@/api/product'
import { notificationApi } from '@/api/notification'
import { conversationApi } from '@/api/conversation'
import { categoryApi, type Category } from '@/api/category'
import { hotTagApi, type HotTag } from '@/api/hot-tag'
import { systemApi } from '@/api/system'
import CustomTabBar from '@/custom-tab-bar/index.vue'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()
const statusBarHeight = ref(getStatusBarHeight())
import { locationApi, type LocationItem } from '@/api/location'
import { activityApi, type FlashSaleProduct } from '@/api/activity'
import { favoriteApi } from '@/api/favorite'
import type { Product, ProductCondition } from '@/types'
import { getCategoryEmoji, getCategoryGradient } from '@/utils/categoryIcons'
import { normalizeImageUrl } from '@/utils/image'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'
import { checkAuth } from '@/utils/auth'

const appStore = useAppStore()
const userStore = useUserStore()

console.log('========== 首页加载 ==========')

// 加载状态
const isLoading = ref(true)
const refreshing = ref(false)
const isLoadingMore = ref(false)
const isRefreshingRecommend = ref(false)
const noMore = ref(false)

// 分页参数
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)

// 未读消息数
const unreadCount = ref(0)

// 位置列表
const locationList = ref<LocationItem[]>([])

// 当前位置
const currentLocation = ref('全校')
const currentLocationCode = ref('')

// 热门搜索标签
const hotTags = ref<string[]>([])

// 公告数据列表
const noticeList = ref<Array<any>>([])

// 当前显示的公告索引
const currentNoticeIndex = ref(0)

// 公告关闭动画状态
const isNoticeClosing = ref(false)

// 公告轮播定时器
let noticeCarouselTimer: number | null = null

// 判断是否有未读公告（noticeList 中的都是未读的）
const hasUnreadNotice = computed(() => {
  return noticeList.value.length > 0
})

// 本地存储相关的辅助函数
const CLOSED_NOTICES_KEY = 'closed_notice_ids'

const getClosedNoticeIds = (): string[] => {
  try {
    const data = uni.getStorageSync(CLOSED_NOTICES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveClosedNoticeId = (noticeId: string) => {
  try {
    const closedIds = getClosedNoticeIds()
    if (!closedIds.includes(noticeId)) {
      closedIds.push(noticeId)
      uni.setStorageSync(CLOSED_NOTICES_KEY, JSON.stringify(closedIds))
    }
  } catch (error) {
    console.error('保存已关闭公告ID失败:', error)
  }
}

// 轮播图数据
const bannerList = ref<Array<any>>([])

// 轮播图进度
const bannerProgress = ref(0)
let bannerTimer: number | null = null
let progressTimer: number | null = null

// 分类数据（带渐变色）
const categoryList = ref<Array<Category>>([])

// 限时秒杀商品
const flashSaleProducts = ref<Array<Product & { flashPrice?: number }>>([])

// 倒计时
const countdownText = ref('00:00:00')
const flashSaleEndTime = ref<string | null>(null) // 后端返回的结束时间
let countdownTimer: number | null = null

// 前往限时秒杀加载状态
const isNavigatingToFlashSale = ref(false)
const loadingDots = ref(0)
let loadingDotsTimer: number | null = null

// 商品列表
const productList = ref<Array<Product & { isFavorite?: boolean }>>([])

// 页面加载
onMounted(() => {
  console.log('========== 首页 onMounted ==========')
  initPage()
  startBannerProgress()
  // 注意：startCountdown() 现在在 loadFlashSale() 完成后自动调用
})

// 页面显示时重新应用导航栏主题色
onShow(() => {
  useThemePage()
})

// 页面卸载
onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
  if (progressTimer) clearInterval(progressTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (loadingDotsTimer) clearInterval(loadingDotsTimer)
  if (noticeCarouselTimer) clearInterval(noticeCarouselTimer)
})

// 初始化页面
const initPage = async () => {
  try {
    isLoading.value = true
    // 核心数据必须加载成功
    await Promise.all([
      loadBanners(),
      loadProducts(),
      loadCategories(),
      loadHotTags()
    ])
    // 非关键数据独立加载，不阻塞页面展示
    loadFlashSale().catch(() => {})
    loadUnreadCount().catch(() => {})
    loadHomeNotice().catch(() => {})
    loadLocations().catch(() => {})
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 500) // 延迟一点展示，让骨架屏效果更明显
  }
}

// 启动轮播图进度
const startBannerProgress = () => {
  let progress = 0
  progressTimer = setInterval(() => {
    progress += 100 / 60 // 3秒内完成，每帧更新
    if (progress >= 100) {
      progress = 0
    }
    bannerProgress.value = progress
  }, 50) // 每50ms更新一次
}

// 启动倒计时
const startCountdown = () => {
  // 清除之前的定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }

  const updateCountdown = () => {
    if (!flashSaleEndTime.value) {
      // 如果没有后端数据，使用默认倒计时
      countdownText.value = '--:--:--'
      return
    }

    try {
      // 计算剩余时间（秒）
      const now = new Date().getTime()
      const end = new Date(flashSaleEndTime.value).getTime()
      const remaining = Math.max(0, Math.floor((end - now) / 1000))

      if (remaining <= 0) {
        // 倒计时结束
        countdownText.value = '00:00:00'
        // 可以在这里触发重新加载活动数据
        return
      }

      // 格式化为 HH:MM:SS
      const h = Math.floor(remaining / 3600)
      const m = Math.floor((remaining % 3600) / 60)
      const s = remaining % 60
      countdownText.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    } catch (error) {
      console.error('倒计时计算错误:', error)
      countdownText.value = '--:--:--'
    }
  }

  // 立即执行一次
  updateCountdown()

  // 每秒更新一次
  countdownTimer = setInterval(updateCountdown, 1000) as unknown as number
}

// 下拉刷新
const onRefresh = async () => {
  try {
    refreshing.value = true
    pageNum.value = 1
    noMore.value = false
    await Promise.all([
      loadBanners(),
      loadProducts(),
      loadCategories(),
      loadHotTags(),
      loadHomeNotice()
    ])
    uni.showToast({ title: '刷新成功', icon: 'success' })
  } finally {
    refreshing.value = false
  }
}

// 上拉加载更多
const onLoadMore = async () => {
  if (isLoadingMore.value || noMore.value) return

  try {
    isLoadingMore.value = true
    pageNum.value++
    await loadProducts()
  } finally {
    isLoadingMore.value = false
  }
}

// 刷新推荐
const refreshRecommend = async () => {
  if (isRefreshingRecommend.value || isLoading.value) return
  isRefreshingRecommend.value = true

  // 先清空列表，显示加载效果
  productList.value = []

  try {
    pageNum.value = 1
    await loadProducts()
  } finally {
    // 延迟清除状态，让用户看到动画完成
    setTimeout(() => {
      isRefreshingRecommend.value = false
    }, 500)
  }
}

// 加载轮播图
const loadBanners = async () => {
  try {
    const res = await bannerApi.getActiveBanners()
    const banners = res.data || []
    bannerList.value = banners.map((banner: any) => ({
      id: banner.bannerId,
      image: normalizeImageUrl(banner.imageUrl), // 处理图片 URL
      link: getBannerLink(banner),
      linkType: banner.linkType,
      linkProductId: banner.linkProductId,
      linkOrderId: banner.linkOrderId
    }))
    console.log('轮播图加载成功:', bannerList.value.length)
  } catch (error) {
    console.error('加载轮播图失败:', error)
  }
}

// 获取轮播图跳转链接
const getBannerLink = (banner: any): string => {
  if (banner.linkType === 2 && banner.linkUrl) {
    // 网页链接
    return `/pages/webview/index?url=${encodeURIComponent(banner.linkUrl)}`
  } else if (banner.linkType === 3 && banner.linkProductId) {
    // 商品详情
    return `/pages/market/detail?id=${banner.linkProductId}`
  } else if (banner.linkType === 4 && banner.linkOrderId) {
    // 订单详情
    return `/pages/mine/order-detail?id=${banner.linkOrderId}`
  }
  return ''
}

// 加载商品列表
const loadProducts = async () => {
  if (isLoadingMore.value && noMore.value) return

  try {
    console.log('========== 开始加载商品列表 ==========')
    console.log('请求参数:', {
      page: pageNum.value,
      pageSize: pageSize,
      sortBy: 'latest',
      locationCode: currentLocationCode.value
    })

    const res = await productApi.getProductList({
      page: pageNum.value,
      pageSize: pageSize,
      sortBy: 'latest',
      locationCode: currentLocationCode.value
    })

    console.log('后端响应数据:', res)
    console.log('响应码:', res.code)
    console.log('响应消息:', res.message)
    console.log('响应数据结构:', res.data)
    console.log('商品列表:', res.data?.list)
    console.log('总数:', res.data?.total)

    const rawProducts = res.data?.list || []

    // 打印第一个商品的详细数据
    if (rawProducts.length > 0) {
      const firstProduct = rawProducts[0] as any
      console.log('========== 第一个商品详细信息 ==========')
      console.log('商品ID:', firstProduct.id)
      console.log('商品标题:', firstProduct.title)
      console.log('商品价格:', firstProduct.price)
      console.log('卖家ID:', firstProduct.userId)
      console.log('卖家名称:', firstProduct.userName)
      console.log('卖家头像:', firstProduct.userAvatar)
      console.log('信用等级:', firstProduct.creditLevel)
      console.log('距离:', firstProduct.distance)
      console.log('成色:', firstProduct.condition)
      console.log('创建时间:', firstProduct.createdAt)
      console.log('更新时间:', firstProduct.updatedAt)
      // 图片相关字段
      console.log('========== 图片相关字段 ==========')
      console.log('coverImage:', firstProduct.coverImage)
      console.log('imageUrls:', firstProduct.imageUrls)
      console.log('images:', firstProduct.images)
      console.log('imageUrl:', firstProduct.imageUrl)
      console.log('mainImage:', firstProduct.mainImage)
      console.log('==========================================')
      console.log('完整对象:', JSON.stringify(firstProduct, null, 2))
      console.log('==========================================')
    }

    // 信用等级转换函数
    const convertCreditScore = (score: number): string => {
      if (score >= 90) return '优秀'
      if (score >= 80) return '良好'
      if (score >= 60) return '一般'
      return '较差'
    }

    // 成色转换函数（将 conditionLevel 转换为新的 value 值）
    const convertCondition = (level: number): ProductCondition => {
      const conditions: Record<number, ProductCondition> = {
        10: 'new',
        9: 'almost_new',
        8: 'lightly_used',
        7: 'obviously_used',
        6: 'has_flaws'
      }
      return conditions[level] || 'almost_new'
    }

    // 处理图片 URL
    const processImageUrl = (url: string, isAvatar = false): string => {
      if (!url) {
        return isAvatar ? '/static/images/user.png' : '/static/images/empty.png'
      }

      // 如果是完整的 URL（http/https），直接返回
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }


      // 如果是相对路径且文件存在（Mock 数据），直接使用
      // 否则使用默认图片
      if (url.startsWith('/static/')) {
        return url // 静态资源路径，尝试直接使用
      }

      // 其他情况，如果是头像且路径不完整，使用默认头像
      if (isAvatar) {
        return '/static/images/user.png'
      }

      return url
    }

    // 转换后端数据格式为前端 Product 类型（字段映射）
    const newProducts = rawProducts.map((p: any) => ({
      // 基础字段映射
      id: p.productId || p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      condition: convertCondition(p.conditionLevel || p.condition),
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      coverImage: processImageUrl(p.coverImage || p.imageUrls?.[0]),
      images: (p.imageUrls || p.images || []).map((img: string) => processImageUrl(img)),
      location: p.location,

      // 卖家信息字段映射
      userId: p.sellerId || p.userId,
      userName: p.sellerNickname || p.userName,
      userAvatar: processImageUrl(p.sellerAvatar || p.userAvatar, true),

      // 信用等级转换
      creditLevel: convertCreditScore(p.sellerCreditScore || p.creditScore || 75),

      // 其他字段
      distance: p.distance,
      status: p.status,
      viewCount: p.viewCount || 0,
      favoriteCount: p.favoriteCount || 0,
      isFavorite: p.isFavorite || false,

      // 时间字段
      createdAt: p.createdAt || '',
      updatedAt: p.updatedAt || '',

      // 标签字段（后端可能没有，根据业务逻辑添加）
      isNew: p.isNew || false,
      isHot: p.isHot || false,
      isDiscount: p.isDiscount || false
    }))

    console.log('转换后的商品列表:', newProducts)

    if (pageNum.value === 1) {
      productList.value = newProducts
    } else {
      productList.value.push(...newProducts)
    }

    total.value = res.data?.total || 0
    noMore.value = productList.value.length >= total.value

    console.log('最终商品列表长度:', productList.value.length)
    console.log('总数:', total.value)
    console.log('是否还有更多:', !noMore.value)
    console.log('========== 商品列表加载完成 ==========\n')
  } catch (error) {
    console.error('========== 加载商品列表失败 ==========')
    console.error('错误信息:', error)
    console.error('======================================')
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 加载限时秒杀
const loadFlashSale = async () => {
  try {
    // 先获取秒杀场次列表，找到当前场次的结束时间
    let endTime: string | null = null
    try {
      const sessionsRes = await activityApi.getFlashSaleSessions()
      const sessions = sessionsRes.data || []

      // 找到当前正在进行的场次（ongoing）
      const now = new Date()
      const currentSession = sessions.find((session: any) => {
        const start = new Date(session.startTime)
        const end = new Date(session.endTime)
        return now >= start && now <= end
      })

      if (currentSession?.endTime) {
        endTime = currentSession.endTime
        flashSaleEndTime.value = endTime
      }
    } catch (error) {
      // 获取场次列表失败，使用默认倒计时
    }

    // 使用 activityApi 获取当前秒杀商品
    const res = await activityApi.getCurrentFlashSaleProducts({ limit: 5 })
    const rawProducts: FlashSaleProduct[] = res.data || []

    // FlashSaleProduct 已经包含秒杀特有字段，直接映射即可
    // 过滤掉 null 值，防止访问 null.id 报错
    const mappedProducts = rawProducts.filter((p: FlashSaleProduct | null) => p != null).map((p: FlashSaleProduct, _index: number) => {

      return {
        // 基础字段映射
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        condition: p.condition,
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        coverImage: p.coverImage || p.image || p.images?.[0] || '/static/images/empty.png',
        images: p.images || [p.image].filter(Boolean),
        location: p.location,

        // 卖家信息字段映射
        userId: p.userId,
        userName: p.userName,
        userAvatar: p.userAvatar || '/static/images/user.png',

        // 信用等级
        creditLevel: p.creditLevel,

        // 其他字段
        viewCount: p.viewCount || 0,
        favoriteCount: p.favoriteCount || 0,

        // 秒杀特定字段 - 将 seckillPrice 映射为 flashPrice（模板使用）
        flashPrice: p.seckillPrice,
        soldPercent: p.soldPercent,
        stock: p.stock,
        discount: p.discount,
        sessionId: p.sessionId
      } as any
    })

    // 只显示有秒杀价的商品
    flashSaleProducts.value = mappedProducts.filter((p: any) => p.flashPrice != null && p.id != null)

    console.log('限时秒杀加载成功:', flashSaleProducts.value.length)
    console.log('   最终商品列表:', flashSaleProducts.value.map((p: any) => ({ id: p.id, title: p.title, flashPrice: p.flashPrice })))

    // 启动/重启倒计时（使用最新的结束时间）
    startCountdown()
  } catch (error) {
    console.error('加载限时秒杀失败:', error)
    flashSaleProducts.value = []
  }
}

// 加载未读数
const loadUnreadCount = async () => {
  // 未登录时不加载未读数
  if (!userStore.isLogin) {
    console.log('[loadUnreadCount] 用户未登录，跳过未读数加载')
    unreadCount.value = 0
    return
  }

  try {
    // 获取通知未读数
    const notificationRes = await notificationApi.getUnreadCount()
    const notificationUnread = notificationRes.data || 0
    // 获取会话未读数（如果有这个 API）
    let conversationUnread = 0
    try {
      const conversationRes = await conversationApi.getConversationList()
      const conversations = conversationRes.data?.list || []
      conversationUnread = conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
    } catch (e) {
      // 忽略会话列表错误
    }
    unreadCount.value = notificationUnread + conversationUnread
    console.log('未读数加载成功:', unreadCount.value)
  } catch (error) {
    console.error('加载未读数失败:', error)
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const res = await categoryApi.getCategoryList()
    categoryList.value = res.data || []
    console.log('分类加载成功:', categoryList.value.length)
  } catch (error) {
    console.error('加载分类失败:', error)
    categoryList.value = []
  }
}

// 加载热门搜索标签
const loadHotTags = async () => {
  try {
    const res = await hotTagApi.getHotTags({ limit: 10 })
    const tags = res.data || []
    hotTags.value = tags.map((t: HotTag) => t.keyword)
    console.log('热门标签加载成功:', hotTags.value.length)
  } catch (error) {
    console.error('加载热门标签失败:', error)
    hotTags.value = []
  }
}

// 加载首页公告
const loadHomeNotice = async () => {
  try {
    console.log('📢 [loadHomeNotice] 开始加载首页公告...')
    const res = await systemApi.getHomeNotice()
    console.log('📢 [loadHomeNotice] API 响应:', res)
    console.log('📢 [loadHomeNotice] res.data:', res.data)

    // 兼容两种数据格式：{ notices: [] } 或 { notice: {} }
    let notices: any[] = []

    if (res.data) {
      if (Array.isArray(res.data.notices)) {
        notices = res.data.notices
        console.log('📢 [loadHomeNotice] 使用 notices 数组:', notices)
      } else if (res.data.notice && typeof res.data.notice === 'object') {
        notices = [res.data.notice]
        console.log('📢 [loadHomeNotice] 使用 notice 对象:', notices)
      } else {
        console.warn('⚠️ [loadHomeNotice] 未识别的数据格式:', res.data)
      }
    } else {
      console.warn('⚠️ [loadHomeNotice] res.data 为空')
    }

    if (notices.length === 0) {
      console.log('ℹ️ [loadHomeNotice] 没有公告数据')
      noticeList.value = []
      return
    }

    // 过滤掉用户已关闭的公告
    const closedNoticeIds = getClosedNoticeIds()
    console.log('📢 [loadHomeNotice] 已关闭的公告ID:', closedNoticeIds)

    noticeList.value = notices.filter((notice: any) => {
      // 获取公告 ID（支持 notificationId、noticeId 或 id）
      const noticeId = notice.notificationId?.toString() ||
                      notice.noticeId?.toString() ||
                      notice.id?.toString()
      console.log(`📢 [loadHomeNotice] 检查公告: "${notice.title}", ID: ${noticeId}`)

      // 如果没有 ID，仍然显示（但记录警告）
      if (!noticeId) {
        console.warn('⚠️ [loadHomeNotice] 公告缺少 ID，仍然显示:', notice)
        return true
      }

      // 检查是否已关闭
      const isClosed = closedNoticeIds.includes(noticeId)
      if (isClosed) {
        console.log(`  ❌ 公告已关闭，跳过`)
      } else {
        console.log(`  ✅ 公告未关闭，将显示`)
      }

      return !isClosed
    })

    console.log('📢 [loadHomeNotice] 最终公告列表:', noticeList.value.length, '条')
    noticeList.value.forEach((notice, idx) => {
      console.log(`  [${idx}] ${notice.title}: ${notice.content}`)
    })

    if (noticeList.value.length > 0) {
      console.log('✅ 首页公告加载成功，启动轮播')
      startNoticeCarousel()
    } else {
      console.log('ℹ️ 所有公告都已关闭或没有公告')
    }
  } catch (error) {
    console.error('❌ [loadHomeNotice] 加载首页公告失败:', error)
    noticeList.value = []
  }
}

// 启动公告轮播
const startNoticeCarousel = () => {
  // 清除之前的定时器
  if (noticeCarouselTimer) {
    clearInterval(noticeCarouselTimer)
    noticeCarouselTimer = null
  }

  // 如果只有一条或没有公告，不需要轮播
  if (noticeList.value.length <= 1) {
    return
  }

  // 每3秒切换到下一条公告
  noticeCarouselTimer = setInterval(() => {
    currentNoticeIndex.value = (currentNoticeIndex.value + 1) % noticeList.value.length
  }, 3000) as unknown as number
}

// 加载位置列表
const loadLocations = async () => {
  // 未登录时使用默认位置列表，不请求后端
  if (!userStore.isLogin) {
    console.log('[loadLocations] 用户未登录，使用默认位置列表')
    const defaultLocations = [
      { locationId: '1', name: '全校', code: 'all', description: '全校所有区域', sortOrder: 0, status: 1 },
      { locationId: '2', name: '南区', code: 'south', description: '校园南区', sortOrder: 1, status: 1 },
      { locationId: '3', name: '北区', code: 'north', description: '校园北区', sortOrder: 2, status: 1 },
      { locationId: '4', name: '东区', code: 'east', description: '校园东区', sortOrder: 3, status: 1 },
      { locationId: '5', name: '西区', code: 'west', description: '校园西区', sortOrder: 4, status: 1 }
    ]
    locationList.value = defaultLocations

    // 设置默认位置
    if (!currentLocationCode.value) {
      currentLocation.value = defaultLocations[0].name
      currentLocationCode.value = defaultLocations[0].code
    }
    return
  }

  try {
    const res = await locationApi.getLocationList()
    const locations = res.data || []
    locationList.value = locations

    // 设置默认位置为第一个
    if (locations.length > 0 && !currentLocationCode.value) {
      currentLocation.value = locations[0].name
      currentLocationCode.value = locations[0].code
    }

    console.log('位置列表加载成功:', locationList.value.length)
  } catch (error) {
    console.warn('位置列表加载失败，回退默认位置列表:', error)
    // 使用默认位置列表
    const defaultLocations = [
      { locationId: '1', name: '全校', code: 'all', description: '全校所有区域', sortOrder: 0, status: 1 },
      { locationId: '2', name: '南区', code: 'south', description: '校园南区', sortOrder: 1, status: 1 },
      { locationId: '3', name: '北区', code: 'north', description: '校园北区', sortOrder: 2, status: 1 },
      { locationId: '4', name: '东区', code: 'east', description: '校园东区', sortOrder: 3, status: 1 },
      { locationId: '5', name: '西区', code: 'west', description: '校园西区', sortOrder: 4, status: 1 }
    ]
    locationList.value = defaultLocations

    // 设置默认位置
    if (!currentLocationCode.value) {
      currentLocation.value = defaultLocations[0].name
      currentLocationCode.value = defaultLocations[0].code
    }
  }
}

// 选择位置
const selectLocation = () => {
  // 使用后端返回的位置列表
  const locationNames = locationList.value.map(loc => loc.name)

  uni.showActionSheet({
    itemList: locationNames,
    success: (res) => {
      const selectedLocation = locationList.value[res.tapIndex]
      currentLocation.value = selectedLocation.name
      currentLocationCode.value = selectedLocation.code

      uni.showToast({
        title: `已切换至${currentLocation.value}`,
        icon: 'none'
      })

      // 根据位置重新加载商品
      loadProducts()
    }
  })
}

// 搜索标签
const searchTag = (tag: string) => {
  uni.navigateTo({
    url: `/pages/search/index?keyword=${tag}`
  })
}

// 公告点击
const onNoticeTap = () => {
  if (noticeList.value.length === 0) return

  // 获取当前显示的公告
  const currentNotice = noticeList.value[currentNoticeIndex.value]
  if (!currentNotice) return

  // 如果有跳转链接，执行跳转
  if (currentNotice.linkType && currentNotice.linkType !== 1) {
    handleNoticeLink(currentNotice)
    return
  }

  // 否则显示弹窗
  uni.showModal({
    title: currentNotice.title || '公告',
    content: currentNotice.content || '',
    showCancel: false
  })
}

// 处理公告跳转链接
const handleNoticeLink = (notice: any) => {
  let url = ''
  if (notice.linkType === 2 && notice.linkUrl) {
    // 网页链接
    url = `/pages/webview/index?url=${encodeURIComponent(notice.linkUrl)}`
  } else if (notice.linkType === 3 && notice.linkProductId) {
    // 商品详情
    url = `/pages/market/detail?id=${notice.linkProductId}`
  } else if (notice.linkType === 4 && notice.linkOrderId) {
		if (!checkAuth({
			showTip: true,
			tipText: '请先登录后查看订单',
			showAuthGuide: true,
			guideTitle: '登录后可查看订单',
			guideContent: '订单详情仅对已登录用户可见。'
		})) {
			return
		}
    // 订单详情
    url = `/pages/order/detail?id=${notice.linkOrderId}`
  }

  if (url) {
    uni.navigateTo({ url })
  }
}

// 关闭公告
const closeNotice = () => {
  if (noticeList.value.length === 0) return

  // 获取当前公告ID（支持 notificationId、noticeId 或 id）
  const currentNotice = noticeList.value[currentNoticeIndex.value]
  const noticeId = currentNotice?.notificationId?.toString() ||
                  currentNotice?.noticeId?.toString() ||
                  currentNotice?.id?.toString()

  console.log('📢 [closeNotice] 关闭公告:', currentNotice?.title, 'ID:', noticeId)

  if (noticeId) {
    // 保存到本地存储
    saveClosedNoticeId(noticeId)
    console.log('✅ 公告已关闭并保存到本地:', noticeId)
  }

  // 从列表中移除当前公告
  noticeList.value.splice(currentNoticeIndex.value, 1)

  // 调整索引（如果删除的是最后一条，索引减1）
  if (currentNoticeIndex.value >= noticeList.value.length && noticeList.value.length > 0) {
    currentNoticeIndex.value = noticeList.value.length - 1
  }

  // 如果没有公告了，触发滑出动画
  if (noticeList.value.length === 0) {
    isNoticeClosing.value = true
    setTimeout(() => {
      isNoticeClosing.value = false
    }, 350)
    // 停止轮播定时器
    if (noticeCarouselTimer) {
      clearInterval(noticeCarouselTimer)
      noticeCarouselTimer = null
    }
  }
}

// 前往消息
const goToMessage = () => {
	if (!checkAuth({
		showTip: true,
		tipText: '请先登录后查看消息',
		showAuthGuide: true,
		guideTitle: '登录后可查看消息',
		guideContent: '消息、会话和通知仅对已登录用户开放。'
	})) {
		return
	}

  uni.switchTab({ url: '/pages/message/index' })
}

// 轮播图点击
const onBannerTap = async (item: any) => {
  console.log('点击轮播图:', item)
  // 记录点击
  try {
    await bannerApi.incrementClickCount(item.id)
  } catch (error) {
    console.error('记录点击失败:', error)
  }

  // 跳转
  if (item.link) {
    uni.navigateTo({ url: item.link })
  }
}

// 分类点击
const onCategoryTap = (item: Category) => {
  console.log('点击分类:', item)
  // 将选中的分类存储到全局 store
  appStore.setSelectedCategory({
    categoryId: item.categoryId,
    name: item.name
  })
  // 使用 switchTab 跳转到交易市场（因为它是 tabBar 页面）
  uni.switchTab({
    url: '/pages/market/list'
  })
}

// 搜索
const goToSearch = () => {
  uni.navigateTo({ url: '/pages/search/index' })
}

// 发布商品
const goToPublish = () => {
	if (!checkAuth({
		showTip: true,
		tipText: '请先登录后发布商品',
		showAuthGuide: true,
		guideTitle: '登录后可发布商品',
		guideContent: '发布闲置前请先登录或注册账号。'
	})) {
		return
	}

  uni.navigateTo({ url: '/pages/market/publish' })
}

// 共享物品
const goToShare = () => {
	if (!checkAuth({
		showTip: true,
		tipText: '请先登录后发布共享',
		showAuthGuide: true,
		guideTitle: '登录后可发布共享',
		guideContent: '发布共享物品前请先登录或注册账号。'
	})) {
		return
	}

  uni.navigateTo({ url: '/pages/share/publish' })
}

// 我的订单
const goToOrders = () => {
	if (!checkAuth({
		showTip: true,
		tipText: '请先登录后查看订单',
		showAuthGuide: true,
		guideTitle: '登录后可查看订单',
		guideContent: '订单信息涉及个人交易数据，请先登录。'
	})) {
		return
	}

  uni.navigateTo({ url: '/pages/order/list' })
}

// 前往限时秒杀
const goToFlashSale = () => {
  if (isNavigatingToFlashSale.value) return

  isNavigatingToFlashSale.value = true
  loadingDots.value = 0

  // 启动点的动画
  loadingDotsTimer = setInterval(() => {
    loadingDots.value = (loadingDots.value + 1) % 4
  }, 300) as unknown as number

  uni.navigateTo({
    url: '/pages/activity/flash-sale',
    success: () => {
      // 导航成功,延迟重置状态以确保用户看到加载效果
      setTimeout(() => {
        isNavigatingToFlashSale.value = false
        loadingDots.value = 0
        if (loadingDotsTimer) {
          clearInterval(loadingDotsTimer)
          loadingDotsTimer = null
        }
      }, 300)
    },
    fail: () => {
      // 导航失败,立即重置状态
      isNavigatingToFlashSale.value = false
      loadingDots.value = 0
      if (loadingDotsTimer) {
        clearInterval(loadingDotsTimer)
        loadingDotsTimer = null
      }
    }
  })
}

// 处理商品收藏（来自 product-card 组件）
const handleProductFavorite = async (product: any, isFavorited: boolean) => {
  // 保存原始状态，用于失败时回滚
  const targetProduct = productList.value.find(p => p.id === product.id)
  if (!targetProduct) return

  const originalState = targetProduct.isFavorite

  // 乐观更新：先更新本地状态
  targetProduct.isFavorite = isFavorited

  try {
    // 调用后端 API
    if (isFavorited) {
      await favoriteApi.addFavorite(product.id)
      uni.showToast({
        title: '收藏成功',
        icon: 'success',
        duration: 1500
      })
    } else {
      await favoriteApi.cancelFavorite(product.id)
      uni.showToast({
        title: '已取消收藏',
        icon: 'success',
        duration: 1500
      })
    }
  } catch (error: any) {
    // 失败时回滚状态
    targetProduct.isFavorite = originalState

    // 显示错误提示
    uni.showToast({
      title: error.message || '操作失败，请重试',
      icon: 'none',
      duration: 2000
    })

    console.error('[收藏操作失败]', error)
  }
}

// 商品详情
const goToDetail = (product: any) => {
  console.log('🔍 [index.vue] goToDetail 被调用')
  console.log('   product 对象:', JSON.stringify(product))
  console.log('   product.id:', product.id)

  if (!product || !product.id) {
    console.error('❌ [index.vue] 商品数据无效，product.id 为空')
    uni.showToast({
      title: '商品数据异常',
      icon: 'none'
    })
    return
  }

  uni.navigateTo({
    url: `/pages/market/detail?id=${product.id}`
  })
}
</script>

<style lang="scss" scoped>
.home-page {
	/* 不设置固定高度，让页面自然流动 */
	background: var(--bg-color-page);
}

// 页面内容
.page-content {
	/* 不设置固定高度，让内容自然流动 */
	padding-bottom: calc(100rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

// 搜索栏
.search-bar {
	top: 0;
	z-index: 100;
	background: linear-gradient(
		135deg,
		var(--primary-color) 0%,
		var(--primary-color-light) 100%
	);
	padding: 20rpx 30rpx;

	.search-content {
		display: flex;
		align-items: center;
		gap: 20rpx;

		.location-box {
			display: flex;
			align-items: center;
			gap: 6rpx;
			padding: 10rpx 16rpx;
			background: rgba(255, 255, 255, 0.3);
			border-radius: 30rpx;
			flex-shrink: 0;

			.icon-location {
				font-size: 24rpx;
			}

			.icon-arrow {
				font-size: 20rpx;
				color: rgba(255, 255, 255, 0.8);
			}

			.location-text {
				font-size: 24rpx;
				color: #fff;
				font-weight: 500;
				max-width: 100rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.search-box {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 16rpx;
			height: 64rpx;
			background: var(--bg-color-disabled);
			border-radius: 32rpx;
			padding: 0 24rpx;
			border: none;
			box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
				inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);

			.icon-search {
				font-size: 28rpx;
				color: var(--text-color-tertiary);
			}

			.search-placeholder {
				flex: 1;
				font-size: 26rpx;
				color: var(--text-color-tertiary);
			}
		}

		.message-btn {
			position: relative;
			width: 56rpx;
			height: 56rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			transition: opacity 0.2s ease;

			&:active {
				opacity: 0.6;
			}

			.icon-message {
				font-size: 40rpx;
			}

			.badge {
				position: absolute;
				top: -4rpx;
				right: -6rpx;
				min-width: 18rpx;
				height: 18rpx;
				background: var(--danger-color, #ff4d4f);
				color: var(--text-color-inverse, #ffffff);
				border-radius: 50%;
				border: 2rpx solid var(--bg-color-card);
				box-sizing: border-box;
				box-shadow: 0 2rpx 6rpx
					var(--danger-color-alpha-30, rgba(255, 77, 79, 0.4));
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 18rpx;
				font-weight: 500;
				line-height: 1;

				&.has-count {
					min-width: 28rpx;
					height: 28rpx;
					border-radius: 14rpx;
					padding: 0 6rpx;

					text {
						font-size: 18rpx;
						color: var(--text-color-inverse, #ffffff);
						font-weight: 500;
						line-height: 1;
						transform: scale(0.9);
					}
				}
			}
		}
	}

	// 热门搜索标签
	.hot-tags {
		margin-top: 20rpx;

		.tags-scroll {
			white-space: nowrap;

			.tag-item {
				display: inline-flex;
				align-items: center;
				gap: 6rpx;
				padding: 12rpx 20rpx;
				margin-right: 16rpx;
				background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
				border-radius: 30rpx;
				border: 1rpx solid #ffe4d9;

				.tag-icon {
					font-size: 24rpx;
				}

				.tag-text {
					font-size: 24rpx;
					color: var(--primary-color);
				}
			}
		}
	}
}

// 活动公告横幅
.notice-banner {
	position: relative;
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 14rpx 24rpx;
	background: linear-gradient(135deg, #fff9e6 0%, #fff8f0 50%, #fffbf5 100%);
	border-bottom: 1rpx solid #ffeaa7;
	box-shadow: 0 4rpx 12rpx var(--warning-color-alpha-10);
	overflow: hidden;
	max-height: 88rpx;
	transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease-out,
		transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), padding 0.35s ease;

	// 关闭动画状态 - 向下滑出
	&.closing {
		max-height: 0;
		opacity: 0;
		transform: translateY(-100%);
		padding-top: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	// 左侧区域（图标 + NEW 标签）
	.notice-left {
		position: relative;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		gap: 8rpx;
	}

	.notice-icon {
		font-size: 32rpx;
		line-height: 1;
		animation: noticeIconPulse 2s ease-in-out infinite;
	}

	.notice-new {
		padding: 2rpx 8rpx;
		background: linear-gradient(
			135deg,
			var(--primary-color) 0%,
			var(--primary-color-dark) 100%
		);
		border-radius: 8rpx;
		font-size: 18rpx;
		color: #fff;
		font-weight: 600;
		line-height: 1.2;
		box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-30);
		animation: noticeNewBadge 1.5s ease-in-out infinite;
	}

	// 中间内容区域
	.notice-content {
		flex: 1;
		height: 40rpx;
		overflow: hidden;
		mask-image: linear-gradient(
			to right,
			transparent,
			black 20rpx,
			black calc(100% - 20rpx),
			transparent
		);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			black 20rpx,
			black calc(100% - 20rpx),
			transparent
		);
	}

	.notice-text-wrapper {
		transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.notice-item {
		height: 40rpx;
		display: flex;
		align-items: center;
	}

	.notice-text {
		font-size: 26rpx;
		color: var(--primary-color-light);
		font-weight: 500;
		white-space: nowrap;
		line-height: 40rpx;
	}

	// 右侧区域（指示点 + 关闭按钮）
	.notice-right {
		display: flex;
		align-items: center;
		gap: 12rpx;
		flex-shrink: 0;
	}

	.notice-dots {
		display: flex;
		gap: 6rpx;

		.notice-dot {
			width: 8rpx;
			height: 8rpx;
			border-radius: 50%;
			background: var(--warning-color-alpha-30);
			transition: all 0.3s ease;

			&.active {
				width: 20rpx;
				border-radius: 4rpx;
				background: linear-gradient(
					90deg,
					var(--primary-color) 0%,
					var(--primary-color-dark) 100%
				);
			}
		}
	}

	.notice-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40rpx;
		height: 40rpx;
		background: rgba(0, 0, 0, 0.06);
		border-radius: 50%;
		font-size: 24rpx;
		color: var(--text-color-tertiary);
		transition: all 0.2s ease;

		&:active {
			transform: scale(0.9);
			background: rgba(0, 0, 0, 0.1);
		}
	}
}

// 公告动画关键帧
@keyframes noticeIconPulse {
	0%,
	100% {
		transform: scale(1) rotate(0deg);
	}
	50% {
		transform: scale(1.1) rotate(5deg);
	}
}

@keyframes noticeNewBadge {
	0%,
	100% {
		transform: scale(1);
		box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-30);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 4rpx 16rpx var(--primary-color-alpha-40);
	}
}

// 轮播图
.banner-section {
	position: relative;
	background: var(--bg-color-card);
	margin-bottom: 20rpx;
	border-radius: 24rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
		-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
	overflow: hidden;

	.banner-swiper {
		width: 100%;
		height: 320rpx;

		.banner-image {
			width: 100%;
			height: 100%;
		}
	}

	.banner-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 6rpx;
		background: rgba(255, 255, 255, 0.3);

		.progress-bar {
			height: 100%;
			background: var(--primary-color);
			transition: width 0.1s linear;
		}
	}
}

// 分类导航
.category-section {
	background: var(--bg-color-card);
	margin-bottom: 20rpx;
	padding: 40rpx 30rpx;
	animation: sectionFadeIn 0.5s ease-out;

	.category-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 30rpx 20rpx;

		.category-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 12rpx;
			animation: scaleIn 0.4s ease-out backwards;
			transition: transform 0.2s ease;

			&:active {
				transform: scale(0.95);
			}

			.category-icon {
				width: 96rpx;
				height: 96rpx;
				border-radius: 24rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.06),
					-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
				border: 2rpx solid rgba(255, 255, 255, 0.6);
				transition: transform 0.2s ease, box-shadow 0.2s ease;

				.icon-text {
					font-size: 44rpx;
				}
			}

			&:active .category-icon {
				transform: scale(0.9);
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
			}

			.category-name {
				font-size: 24rpx;
				color: var(--text-color-primary);
				font-weight: 500;
			}
		}
	}

	// 分类空状态
	&.category-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 30rpx;
		min-height: 200rpx;

		.empty-category-icon {
			font-size: 80rpx;
			opacity: 0.3;
			margin-bottom: 16rpx;
		}

		.empty-category-text {
			font-size: 26rpx;
			color: var(--text-color-tertiary);
		}
	}
}

// 快捷功能入口
.quick-actions {
	display: flex;
	justify-content: center;
	gap: 120rpx;
	background: var(--bg-color-card);
	margin-bottom: 20rpx;
	padding: 40rpx 30rpx;
	animation: sectionFadeIn 0.6s ease-out;

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		animation: scaleIn 0.4s ease-out backwards;
		transition: transform 0.2s ease;

		&:active {
			transform: scale(0.95);
		}

		.action-icon {
			width: 96rpx;
			height: 96rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
			transition: transform 0.2s ease, box-shadow 0.2s ease;

			:deep(.uni-icons) {
				display: flex;
				align-items: center;
				justify-content: center;
			}

			&.publish-icon {
				background: linear-gradient(
					135deg,
					var(--primary-color) 0%,
					var(--primary-color-dark) 100%
				);
			}

			&.share-icon {
				background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
			}

			&.market-icon {
				background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%);
			}

			&.order-icon {
				background: linear-gradient(135deg, #9c27b0 0%, #ab47bc 100%);
			}
		}

		&:active .action-icon {
			transform: scale(0.9);
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
		}

		.action-text {
			font-size: 24rpx;
			color: var(--text-color-secondary);
			font-weight: 500;
		}
	}
}

// 限时秒杀
.flash-sale-section {
	background: var(--bg-color-card);
	margin-bottom: 20rpx;
	padding: 30rpx 0;
	animation: sectionFadeIn 0.7s ease-out;

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 30rpx 20rpx;

		.header-left {
			display: flex;
			align-items: center;
			gap: 20rpx;

			.section-title {
				font-size: 36rpx;
				font-weight: bold;
				color: var(--text-color-primary);
			}

			.countdown {
				padding: 8rpx 16rpx;
				background: linear-gradient(135deg, var(--error-color) 0%, #ff7875 100%);
				border-radius: 24rpx;
				border: 2rpx solid rgba(255, 255, 255, 0.6);
				box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.08),
					-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
				animation: pulse 2s ease-in-out infinite;

				.countdown-text {
					font-size: 24rpx;
					color: #fff;
					font-weight: 600;
				}
			}
		}

		.section-more {
			display: flex;
			align-items: center;
			gap: 4rpx;
			font-size: 26rpx;
			color: var(--text-color-tertiary);
			padding: 10rpx 20rpx;
			background: var(--bg-color-disabled);
			border-radius: 30rpx;
			transition: all 0.2s ease;

			&:active {
				background: #e8e8e8;
			}

			&.loading {
				background: var(--danger-color-alpha-6);
				color: var(--primary-color);
			}

			.icon-arrow-right {
				font-size: 36rpx;
				color: var(--text-color-tertiary);
				display: inline-flex;
				align-items: center;
				justify-content: center;
				line-height: 1;
				transform-origin: 50% 55%;

				&.spinning {
					animation: spinArrow 0.8s linear infinite;
					color: var(--primary-color);
				}
			}
		}
	}

	.flash-sale-scroll {
		white-space: nowrap;
		padding: 0 30rpx;

		.flash-sale-item {
			position: relative;
			display: inline-block;
			width: 240rpx;
			margin-right: 20rpx;
			background: var(--bg-color-card);
			border-radius: 24rpx;
			overflow: hidden;
			border: 2rpx solid rgba(255, 255, 255, 0.8);
			box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
				-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
			animation: slideInLeft 0.5s ease-out backwards;
			transition: transform 0.2s ease, box-shadow 0.2s ease;

			&:active {
				transform: scale(0.98);
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
			}

			.flash-badge {
				position: absolute;
				top: 12rpx;
				left: 12rpx;
				padding: 6rpx 12rpx;
				background: linear-gradient(135deg, var(--error-color) 0%, #ff7875 100%);
				border-radius: 8rpx;
				font-size: 20rpx;
				color: #fff;
				font-weight: 600;
				z-index: 1;
				animation: badgeShine 2s ease-in-out infinite;
			}

			.flash-image {
				width: 100%;
				height: 200rpx;
			}

			.flash-info {
				padding: 16rpx;

				.flash-title {
					display: block;
					font-size: 26rpx;
					color: var(--text-color-primary);
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					margin-bottom: 12rpx;
				}

				.flash-price-box {
					display: flex;
					align-items: baseline;
					gap: 8rpx;

					.flash-price {
						font-size: 32rpx;
						font-weight: bold;
						color: var(--error-color);
					}

					.original-price {
						font-size: 22rpx;
						color: var(--text-color-tertiary);
						text-decoration: line-through;
					}
				}
			}
		}
	}
}

// 推荐商品
.recommend-section {
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 30rpx 20rpx;

		.section-title {
			font-size: 36rpx;
			font-weight: bold;
			color: var(--text-color-primary);
		}

		.refresh-btn {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 10rpx 20rpx;
			background: var(--bg-color-disabled);
			border-radius: 30rpx;
			font-size: 26rpx;
			color: var(--text-color-secondary);
			transition: all 0.3s ease;

			.refresh-icon {
				font-size: 32rpx;
				font-weight: 300;
			}

			&:active {
				opacity: 0.7;
			}

			// 刷新中的持续旋转动画
			&.refreshing .refresh-icon {
				animation: rotateRefresh 1s linear infinite;
			}

			// 点击时的单次旋转动画（非刷新状态）
			&:active:not(.refreshing) .refresh-icon {
				animation: rotateRefreshOnce 0.5s ease;
			}
		}
	}

	.products-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20rpx;
		padding: 0 30rpx 30rpx;
		align-items: stretch; // 改回 stretch，确保高度一致

		.product-item-wrapper {
			position: relative;
			width: 100%;
			min-width: 0; // 关键：移除 Grid 默认的 min-width: auto
			animation: fadeInUp 0.5s ease-out backwards;
			min-height: 480rpx;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
			overflow: hidden; // 防止内容溢出

			// 深度选择器，确保内部的 product-card 也使用 border-box
			:deep(.product-card),
			:deep(.product-card-wrapper) {
				box-sizing: border-box;
			}

			@keyframes fadeInUp {
				from {
					opacity: 0;
					transform: translateY(20rpx);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}
		}
	}

	// 加载中
	.loading-more {
		display: flex;
		justify-content: center;
		padding: 40rpx;

		.loading-text {
			font-size: 26rpx;
			color: var(--text-color-tertiary);
		}
	}

	// 没有更多
	.no-more {
		display: flex;
		justify-content: center;
		padding: 40rpx;

		.no-more-text {
			font-size: 24rpx;
			color: var(--text-color-placeholder);
		}
	}

	// 骨架屏样式
	.skeleton-item {
		background: var(--bg-color-card);
		border-radius: 24rpx;
		overflow: hidden;
		padding-bottom: 16rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.8);
		box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
			-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
		animation: skeletonPulse 1.5s ease-in-out infinite;

		.skeleton-image {
			width: 100%;
			height: 320rpx;
			background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
			background-size: 200% 100%;
			animation: skeletonShimmer 1.5s infinite;
		}

		.skeleton-content {
			padding: 16rpx;

			.skeleton-title {
				height: 72rpx;
				background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
				background-size: 200% 100%;
				animation: skeletonShimmer 1.5s infinite;
				border-radius: 8rpx;
				margin-bottom: 16rpx;
			}

			.skeleton-meta {
				height: 32rpx;
				width: 60%;
				background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
				background-size: 200% 100%;
				animation: skeletonShimmer 1.5s infinite;
				border-radius: 8rpx;
				margin-bottom: 12rpx;
			}

			.skeleton-footer {
				height: 28rpx;
				width: 80%;
				background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
				background-size: 200% 100%;
				animation: skeletonShimmer 1.5s infinite;
				border-radius: 8rpx;
			}
		}
	}
}

// 底部磨砂雾层
.bottom-frost-layer {
	position: relative;
	height: 140rpx;
	margin-top: -40rpx;
	pointer-events: none;
	overflow: hidden;

	.frost-blur {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.8);
		-webkit-backdrop-filter: blur(20rpx);
		backdrop-filter: blur(20rpx);
	}

	.frost-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0),
			rgba(255, 255, 255, 0.3) 30%,
			rgba(255, 255, 255, 0.9) 100%
		);
	}
}

// 全局动画关键帧
@keyframes sectionFadeIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes scaleIn {
	from {
		opacity: 0;
		transform: scale(0.8);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes slideInLeft {
	from {
		opacity: 0;
		transform: translateX(-40rpx);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@keyframes pulse {
	0%,
	100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
}

@keyframes badgeShine {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.8;
	}
}

// 搜索栏动画增强
.search-bar {
	animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
	from {
		opacity: 0;
		transform: translateY(-100%);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 公告横幅动画
.notice-banner {
	animation: fadeIn 0.5s ease-out;
}

// 轮播图动画
.banner-section {
	animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(30rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes rotateRefresh {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@keyframes rotateRefreshOnce {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@keyframes skeletonShimmer {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}

@keyframes skeletonPulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.7;
	}
}

@keyframes spinArrow {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
