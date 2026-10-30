<template>
	<view class="market-list-page" :style="themeStyle">
		<!-- 固定头部容器 -->
		<view
			class="sticky-header page-animate"
			:class="{ 'hide-header': refreshing, 'animate-in': isAnimated }"
		>
			<!-- 自定义导航栏 -->
			<CustomNavBar
				title="交易市场"
				:background-color="`linear-gradient(135deg, ${primaryColor} 0%, ${primaryColorLight} 100%)`"
				text-color="var(--text-color-inverse)"
				:fixed="false"
			/>

			<!-- 搜索栏 -->
			<view class="search-bar page-animate" :class="{ 'animate-in': isAnimated }">
				<view class="search-input-wrapper">
					<text class="search-icon" @click="onSearch">🔍</text>
					<input
						class="search-input"
						type="text"
						:placeholder="
							currentMode === 'trade' ? '搜索商品' : '搜索共享物品'
						"
						placeholder-class="search-placeholder"
						:value="searchKeyword"
						@input="onSearchInput"
						@focus="onSearchFocus"
						@confirm="onSearch"
						@keyup.enter="onSearch"
					/>
					<text v-if="searchKeyword" class="clear-icon" @click="clearSearch"
						>✕</text
					>
				</view>
			</view>

			<!-- 交易/共享Tab -->
			<view class="mode-tabs page-animate" :class="{ 'animate-in': isAnimated }">
				<view
					class="mode-tab"
					:class="{ active: currentMode === 'trade' }"
					@click="switchMode('trade')"
				>
					<text class="mode-tab-text">交易</text>
					<view
						v-if="currentMode === 'trade'"
						class="mode-tab-indicator"
					></view>
				</view>
				<view
					class="mode-tab"
					:class="{ active: currentMode === 'share' }"
					@click="switchMode('share')"
				>
					<text class="mode-tab-text">共享</text>
					<view
						v-if="currentMode === 'share'"
						class="mode-tab-indicator"
					></view>
				</view>
			</view>

			<!-- 筛选栏 -->
			<view class="filter-bar page-animate" :class="{ 'animate-in': isAnimated }">
				<view
					class="filter-item"
					:class="{ active: selectedCategory !== null }"
					@click="openCategoryPicker"
				>
					<text class="filter-text">{{
						selectedCategory?.name || "分类"
					}}</text>
					<text class="icon-arrow">▼</text>
				</view>
				<view
					v-if="currentMode === 'trade'"
					class="filter-item"
					:class="{ active: selectedCondition !== '' }"
					@click="openConditionPicker"
				>
					<text class="filter-text">{{ selectedCondition || "成色" }}</text>
					<text class="icon-arrow">▼</text>
				</view>
				<view
					v-if="currentMode === 'trade'"
					class="filter-item"
					:class="{ active: sortBy !== 'latest' }"
					@click="toggleSort"
				>
					<text class="filter-text">{{ sortText }}</text>
					<text class="icon-arrow" :class="{ rotate: sortBy === 'price_asc' }">
						{{ sortBy === "price_asc" ? "▲" : "▼" }}
					</text>
				</view>
				<view class="filter-item" @click="toggleLayout">
					<text class="icon-layout">{{
						layoutMode === "grid" ? "☰" : "⊞"
					}}</text>
				</view>
			</view>

			<!-- 筛选标签 -->
			<view v-if="hasActiveFilters" class="filter-tags">
				<view class="filter-tag" @click="clearCategory">
					<text class="tag-text">{{ selectedCategory?.name }}</text>
					<text class="tag-close">✕</text>
				</view>
				<view v-if="selectedCondition" class="filter-tag" @click="clearCondition">
					<text class="tag-text">{{ selectedCondition }}</text>
					<text class="tag-close">✕</text>
				</view>
				<view class="filter-tag-clear" @click="clearAllFilters">
					<text class="clear-text">清空筛选</text>
				</view>
			</view>
		</view>

		<!-- 搜索历史弹窗 -->
		<view
			v-if="showSearchHistory"
			class="search-history-modal"
			@click.self="showSearchHistory = false"
		>
			<view class="search-history-content" @click.stop>
				<!-- 热门搜索 -->
				<view v-if="hotSearchList.length > 0" class="hot-search-section">
					<view class="section-header">
						<text class="section-title">🔥 热门搜索</text>
					</view>
					<view class="hot-search-list">
						<view
							v-for="(item, index) in hotSearchList"
							:key="'hot-' + index"
							class="hot-search-item"
							@click="selectHotSearch(item.keyword)"
						>
							<text
								class="hot-rank"
								:class="`rank-${Math.min(index + 1, 3)}`"
								>{{ index + 1 }}</text
							>
							<text class="hot-keyword">{{ item.keyword }}</text>
							<text class="hot-icon" v-if="item.iconType !== 'none'">
								{{ getIconForType(item.iconType) }}
							</text>
						</view>
					</view>
				</view>

				<!-- 搜索历史 -->
				<view
					class="search-history-header"
					:class="{ 'has-hot': hotSearchList.length > 0 }"
				>
					<text class="search-history-title">搜索历史</text>
					<text
						class="search-history-clear"
						@click="clearSearchHistory"
						v-if="!isSearchHistoryEmpty"
					>
						清空
					</text>
				</view>

				<view v-if="!isSearchHistoryEmpty" class="search-history-list">
					<view
						v-for="(item, index) in searchHistoryList"
						:key="index"
						class="search-history-item"
						@click="selectSearchHistory(item)"
					>
						<text class="search-history-icon">🕐</text>
						<text class="search-history-text">{{ item }}</text>
						<text
							class="search-history-delete"
							@click.stop="deleteSearchHistory(item)"
							>✕</text
						>
					</view>
				</view>

				<view v-else class="search-history-empty">
					<text class="empty-icon">📭</text>
					<text class="empty-text">暂无搜索历史</text>
				</view>
			</view>
		</view>

		<!-- 商品列表 -->
		<scroll-view
			class="product-scroll"
			:class="{ 'has-tags': hasActiveFilters }"
			scroll-y
			@scrolltolower="loadMore"
			:refresher-enabled="true"
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
		>
			<!-- 骨架屏 -->
			<view v-if="loading && productList.length === 0" class="skeleton-list">
				<view v-for="i in 4" :key="i" class="skeleton-item">
					<view class="skeleton-image"></view>
					<view class="skeleton-content">
						<view class="skeleton-title"></view>
						<view class="skeleton-meta"></view>
						<view class="skeleton-footer"></view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<empty-state
				v-else-if="productList.length === 0 && !loading"
				:text="currentMode === 'share' ? '暂无共享物品' : '暂无商品'"
				:tip="
					searchKeyword
						? '换个关键词试试吧'
						: currentMode === 'share'
						? '还没有发布任何共享物品'
						: '还没有发布任何商品'
				"
				icon="📦"
			/>

			<!-- 商品列表 - 交易模式 -->
			<view
				v-else-if="currentMode === 'trade'"
				class="product-list"
				:class="`layout-${layoutMode}`"
			>
				<product-card
					v-for="(product, index) in productList"
					:key="product.id"
					:product="(product as Product)"
					:show-user="true"
					:style="{ animationDelay: index * 30 + 'ms' }"
					class="product-item-animated"
					@click="goDetail"
				/>
			</view>

			<!-- 共享物品列表 - 共享模式 -->
			<view v-else class="product-list" :class="`layout-${layoutMode}`">
				<share-card
					v-for="(item, index) in productList"
					:key="item.id"
					:item="(item as ShareItem)"
					:show-user="true"
					:style="{ animationDelay: index * 30 + 'ms' }"
					class="product-item-animated"
					@click="goToShareDetail"
				/>
			</view>

			<!-- 加载中 -->
			<view v-if="loading && productList.length > 0" class="loading">
				<text class="loading-icon">⏳</text>
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 没有更多 -->
			<view v-if="noMore && productList.length > 0" class="no-more">
				<text class="divider-line"></text>
				<text class="no-more-text">没有更多了</text>
				<text class="divider-line"></text>
			</view>
		</scroll-view>

		<CustomTabBar />
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useThemePage, useThemeStyle, useThemeColors } from "@/utils/theme";
import { productApi } from "@/api/product";
import { shareApi } from "@/api/share";
import type { ShareItem } from "@/api/share";
import ProductCard from "@/components/product-card/product-card.vue";
import ShareCard from "@/components/share-card/share-card.vue";
import EmptyState from "@/components/empty-state/empty-state.vue";
import type { Product, Category, ProductCondition, ProductQueryParams } from "@/types";
import { searchHistory } from "@/utils/search-history";
import { hotSearch } from "@/utils/hot-search";
import type { HotSearchItem } from "@/utils/hot-search";
import { useAppStore } from "@/store/app";
import { categoryApi } from "@/api/category";
import CustomTabBar from "@/custom-tab-bar/index.vue";

const appStore = useAppStore();
const { themeStyle } = useThemeStyle();
const { primaryColor, primaryColorLight } = useThemeColors();

// 页面进入动画状态
const isAnimated = ref(false);

// 商品列表可以是Product或ShareItem
const productList = ref<(Product | ShareItem)[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 20;

// 搜索相关
const searchKeyword = ref("");
const showSearchHistory = ref(false);
const searchHistoryList = ref<string[]>([]);
const hotSearchList = ref<HotSearchItem[]>([]);

// 筛选相关
const selectedCategory = ref<Category | null>(null);
const selectedCondition = ref<ProductCondition | "">("");

// 排序相关 - 定义排序类型
type SortType = "latest" | "price_desc" | "price_asc" | "distance";
const sortBy = ref<SortType>("latest");

// 布局模式
const layoutMode = ref<"grid" | "list">("grid");

// 交易/共享模式
const currentMode = ref<"trade" | "share">("trade");

// 分类数据
const categories = ref<Category[]>([{ categoryId: '', name: "全部分类", sortOrder: 0 }]);

// 成色选项
const conditions = ref<{ value: ProductCondition; label: string }[]>([
	{ value: "new", label: "全新" },
	{ value: "almost_new", label: "几乎全新" },
	{ value: "lightly_used", label: "轻微使用" },
	{ value: "obviously_used", label: "明显使用" },
	{ value: "has_flaws", label: "有瑕疵" },
]);

// 标记是否已经初始化（避免 onShow 重复执行初始化逻辑）
let isInitialized = false;

// 计算属性
const hasActiveFilters = computed(() => {
	return (
		selectedCategory.value !== null ||
		(currentMode.value === "trade" && selectedCondition.value !== "")
	);
});

const isSearchHistoryEmpty = computed(() => {
	return searchHistoryList.value.length === 0;
});

const sortText = computed(() => {
	const map = {
		latest: "最新",
		price_desc: "价格↓",
		price_asc: "价格↑",
		distance: "距离",
	};
	return map[sortBy.value];
});

onMounted(async () => {
	console.log("[list.vue] onMounted - 开始加载商品列表");

	// 加载分类列表
	await loadCategories();

	// 加载商品列表
	loadProducts();
	// 加载搜索历史
	searchHistoryList.value = searchHistory.get();
	// 加载热门搜索
	hotSearchList.value = hotSearch.get();

	// 标记已初始化
	isInitialized = true;

	// 触发页面进入动画
	setTimeout(() => {
		isAnimated.value = true;
	}, 50);
});

// 每次页面显示时检查是否有从首页传递过来的分类选择
onShow(() => {
	useThemePage();
	console.log("[list.vue] onShow - 页面显示");

	// 等待初始化完成后再检查分类选择
	if (!isInitialized) {
		console.log("[list.vue] 等待初始化完成...");
		return;
	}

	// 检查是否有从首页传递过来的分类选择
	const selectedCategoryFromStore = appStore.selectedCategory;
	if (selectedCategoryFromStore?.categoryId) {
		console.log("[list.vue] 检测到从首页选择的分类:", selectedCategoryFromStore);

		// 根据 categoryId 找到对应的分类
		const category = categories.value.find(
			(c) => c.categoryId === selectedCategoryFromStore.categoryId
		);
		if (category) {
			console.log("[list.vue] 找到分类:", category.name, "设置筛选并重新加载商品");
			selectedCategory.value = category;
			// 重新加载商品列表（应用分类筛选）
			loadProducts(true);
		} else {
			console.warn(
				"[list.vue] 未找到对应的分类, categoryId:",
				selectedCategoryFromStore.categoryId
			);
		}

		// 清除 store 中的分类选择（避免下次进入时仍然应用筛选）
		appStore.clearSelectedCategory();
	} else {
		console.log("[list.vue] 无分类选择，显示全部商品");
	}
});

// 加载分类列表
async function loadCategories() {
	try {
		const res = await categoryApi.getCategoryList();
		const rawCategoryList = res.data || [];
		const categoryList: Category[] = rawCategoryList.map((item: any) => ({
			...item,
			categoryId: item.categoryId ?? item.id,
		}));
		// 添加"全部分类"选项
		categories.value = [
			{ categoryId: '', name: "全部分类", sortOrder: 0 },
			...categoryList,
		];
		console.log("[list.vue] 分类列表加载成功:", categories.value.length);
	} catch (error) {
		console.error("[list.vue] 加载分类列表失败:", error);
	}
}

function loadProducts(refresh = false) {
	console.log(
		"[list.vue] loadProducts called, refresh:",
		refresh,
		"loading:",
		loading.value,
		"mode:",
		currentMode.value
	);
	if (loading.value) return;

	if (refresh) {
		page.value = 1;
		noMore.value = false;
	}

	loading.value = true;

	// 根据当前模式调用不同的API
	const apiCall =
		currentMode.value === "share"
			? shareApi.getShareItemList({
					status: 1,
					page: page.value,
					size: pageSize,
					...(selectedCategory.value?.categoryId && {
						categoryId: selectedCategory.value.categoryId,
					}),
					...(searchKeyword.value && { keyword: searchKeyword.value }),
			  })
			: productApi.getProductList({
					page: page.value,
					pageSize,
					// 根据新的排序类型转换为后端参数
					...(sortBy.value === "latest" ? { sortBy: "latest" } : {}),
					...(sortBy.value === "price_desc"
						? { sortBy: "price", priceAsc: false }
						: {}),
					...(sortBy.value === "price_asc"
						? { sortBy: "price", priceAsc: true }
						: {}),
					...(sortBy.value === "distance" ? { sortBy: "distance" } : {}),
					...(selectedCategory.value?.categoryId && {
						categoryId: selectedCategory.value.categoryId,
					}),
					...(selectedCondition.value && {
						condition: selectedCondition.value,
					}),
					...(searchKeyword.value && { keyword: searchKeyword.value }),
			  });

	console.log("[list.vue] 请求参数:", {
		mode: currentMode.value,
		page: page.value,
		pageSize,
	});

	apiCall
		.then((res: any) => {
			console.log("[list.vue] 响应数据:", res);
			const rawList = res.data?.list || [];

			// 共享模式下，后端返回 shareId 而非 id，需要映射
			const list =
				currentMode.value === "share"
					? rawList.map((item: any) => ({
							...item,
							id: item.shareId || item.id,
							coverImage: item.coverImageUrl || item.coverImage || "",
							userName: item.ownerNickname || item.userName || "",
							userAvatar: item.ownerAvatar || item.userAvatar || "",
					  }))
					: rawList;

			if (refresh) {
				productList.value = list;
			} else {
				productList.value = [...productList.value, ...list];
			}
			noMore.value = rawList.length < pageSize;
		})
		.catch((err) => {
			console.error("[list.vue] 加载失败:", err);
			console.error("[list.vue] 错误详情:", JSON.stringify(err));
			uni.showToast({
				title: "加载失败，请稍后重试",
				icon: "none",
			});
		})
		.finally(() => {
			loading.value = false;
			refreshing.value = false;
		});
}

function loadMore() {
	if (!loading.value && !noMore.value) {
		page.value++;
		loadProducts();
	}
}

function onRefresh() {
	refreshing.value = true;
	loadProducts(true);
}

// 搜索相关
function onSearchInput(e: any) {
	searchKeyword.value = e.detail.value;
	if (searchKeyword.value.trim()) {
		showSearchHistory.value = false;
	}
}

function onSearch() {
	const keyword = searchKeyword.value.trim();
	if (keyword) {
		// 添加到搜索历史
		searchHistory.add(keyword);
		searchHistoryList.value = searchHistory.get();
	}
	showSearchHistory.value = false;
	loadProducts(true);
}

function onSearchFocus() {
	if (searchHistoryList.value.length > 0) {
		showSearchHistory.value = true;
	}
}

function clearSearch() {
	searchKeyword.value = "";
	loadProducts(true);
}

// 选择搜索历史
function selectSearchHistory(keyword: string) {
	searchKeyword.value = keyword;
	showSearchHistory.value = false;
	loadProducts(true);
}

// 删除搜索历史
function deleteSearchHistory(keyword: string) {
	searchHistory.remove(keyword);
	searchHistoryList.value = searchHistory.get();
}

// 清空搜索历史
function clearSearchHistory() {
	searchHistory.clear();
	searchHistoryList.value = [];
}

// 热门搜索相关
function selectHotSearch(keyword: string) {
	searchKeyword.value = keyword;
	showSearchHistory.value = false;
	// 记录搜索
	hotSearch.record(keyword);
	loadProducts(true);
}

function getIconForType(iconType?: string): string {
	const iconMap: Record<string, string> = {
		hot: "🔥",
		rise: "📈",
		new: "✨",
		none: "",
	};
	return iconMap[iconType || "none"] || "";
}

// 排序相关 - 循环切换排序方式
function toggleSort() {
	const sortCycle: SortType[] = ["latest", "price_desc", "price_asc", "distance"];
	const currentIndex = sortCycle.indexOf(sortBy.value);
	const nextIndex = (currentIndex + 1) % sortCycle.length;
	sortBy.value = sortCycle[nextIndex];
	loadProducts(true);
}

// 布局切换
function toggleLayout() {
	layoutMode.value = layoutMode.value === "grid" ? "list" : "grid";
}

// 打开分类选择器
function openCategoryPicker() {
	const categoryNames = categories.value.map((c) => c.name);
	uni.showActionSheet({
		itemList: categoryNames,
		success: (res) => {
			const index = res.tapIndex;
			const category = categories.value[index];
			if (category.categoryId === '') {
				selectedCategory.value = null;
			} else {
				selectedCategory.value = category;
			}
			loadProducts(true);
		},
	});
}

// 打开成色选择器
function openConditionPicker() {
	uni.showActionSheet({
		itemList: conditions.value.map((c) => c.label),
		success: (res) => {
			selectedCondition.value = conditions.value[res.tapIndex]
				.value as ProductCondition;
			loadProducts(true);
		},
	});
}

// 分类相关
function clearCategory() {
	selectedCategory.value = null;
	loadProducts(true);
}

// 成色相关

function clearCondition() {
	selectedCondition.value = "";
	loadProducts(true);
}

// 清空所有筛选
function clearAllFilters() {
	selectedCategory.value = null;
	selectedCondition.value = "";
	loadProducts(true);
}

function goDetail(product: Product) {
	uni.navigateTo({
		url: `/pages/market/detail?id=${product.id}`,
	});
}

function goToShareDetail(item: ShareItem) {
	uni.navigateTo({
		url: `/pages/share/detail?id=${item.id}`,
	});
}

// 发布商品
function goToPublish() {
	// 根据当前模式跳转到不同的发布页面
	if (currentMode.value === "share") {
		uni.navigateTo({
			url: "/pages/share/publish",
		});
	} else {
		uni.navigateTo({
			url: "/pages/market/publish",
		});
	}
}

// 切换交易/共享模式
function switchMode(mode: "trade" | "share") {
	if (currentMode.value === mode) return;
	currentMode.value = mode;
	// 清空筛选条件
	selectedCategory.value = null;
	selectedCondition.value = "";
	sortBy.value = "latest";
	searchKeyword.value = "";
	// 重新加载数据
	loadProducts(true);
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/variables.scss' as *;

// 页面进入动画关键帧
@keyframes pageSlideIn {
	from {
		opacity: 0;
		transform: translateY(30rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 页面动画样式
.page-animate {
	opacity: 0;
	transform: translateY(30rpx);

	&.animate-in {
		animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	&:nth-of-type(1).animate-in {
		animation-delay: 0s;
	}

	&:nth-of-type(2).animate-in {
		animation-delay: 0.05s;
	}

	&:nth-of-type(3).animate-in {
		animation-delay: 0.1s;
	}

	&:nth-of-type(4).animate-in {
		animation-delay: 0.15s;
	}
}

.market-list-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-color-page);
}

// 固定头部容器
.sticky-header {
	position: sticky;
	top: 0;
	z-index: $z-index-sticky;
	background: var(--bg-color-card);
	// 确保下拉刷新时头部保持整体性
	transform: translate3d(0, 0, 0);
	-webkit-transform: translate3d(0, 0, 0);

	&.hide-header {
		// 刷新时通过 transform 隐藏头部
		transform: translate3d(0, -100%, 0);
		-webkit-transform: translate3d(0, -100%, 0);
		transition: transform 0.3s ease;
	}
}

// 搜索栏
.search-bar {
	padding: 16rpx 24rpx;
	// 确保与父容器在同一渲染层
	position: relative;
	transform: translate3d(0, 0, 0);
	z-index: 1;

	.search-input-wrapper {
		display: flex;
		align-items: center;
		height: 64rpx;
		background: var(--bg-color-page);
		border-radius: 32rpx;
		padding: 0 24rpx;
		border: none;
		box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
			inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);

		.search-icon {
			font-size: 32rpx;
			margin-right: 12rpx;
		}

		.search-input {
			flex: 1;
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
		}

		.search-placeholder {
			color: var(--text-color-tertiary);
		}

		.clear-icon {
			font-size: 28rpx;
			color: var(--text-color-tertiary);
			padding: 8rpx;
			margin-left: 8rpx;
		}
	}
}

// 交易/共享Tab
.mode-tabs {
	display: flex;
	background: var(--bg-color-card);
	border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
	// 确保与父容器在同一渲染层
	position: relative;
	transform: translate3d(0, 0, 0);
	z-index: 1;

	.mode-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24rpx 0;
		position: relative;
		transition: all 0.3s ease;

		&:active {
			background: var(--bg-color-page);
		}

		.mode-tab-text {
			font-size: 28rpx;
			color: var(--text-color-secondary);
			font-weight: 500;
			transition: all 0.3s ease;
		}

		.mode-tab-indicator {
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 60rpx;
			height: 8rpx;
			background: linear-gradient(
				90deg,
				var(--primary-color) 0%,
				var(--primary-color-dark) 100%
			);
			border-radius: 8rpx;
			animation: tabIndicatorSlideIn 0.3s ease-out;
		}

		&.active {
			.mode-tab-text {
				color: var(--primary-color);
				font-weight: 600;
			}
		}
	}
}

@keyframes tabIndicatorSlideIn {
	from {
		transform: translateX(-50%) scaleX(0);
	}
	to {
		transform: translateX(-50%) scaleX(1);
	}
}

// 筛选栏
.filter-bar {
	display: flex;
	height: 88rpx;
	background: var(--bg-color-card);
	border-bottom: 1px solid var(--border-color-light);
	// 确保与父容器在同一渲染层
	position: relative;
	transform: translate3d(0, 0, 0);
	z-index: 1;

	.filter-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		position: relative;
		transition: background var(--motion-duration-fast) var(--motion-ease-standard);

		&:active {
			background: var(--bg-color-page);
		}

		&.active {
			.filter-text {
				color: var(--primary-color);
				font-weight: $font-weight-medium;
			}

			.icon-arrow {
				color: var(--primary-color);
			}
		}

		.filter-text {
			font-size: 26rpx;
			color: var(--text-color-primary);
			transition: color var(--motion-duration-fast) var(--motion-ease-standard);
		}

		.icon-arrow {
			font-size: 20rpx;
			color: var(--text-color-tertiary);
			transition: transform var(--motion-duration-fast) var(--motion-ease-standard), color var(--motion-duration-fast) var(--motion-ease-standard);

			&.rotate {
				transform: rotate(180deg);
			}
		}

		.icon-layout {
			font-size: 36rpx;
			color: var(--text-color-secondary);
		}
	}

	// 发布按钮
	.publish-btn {
		width: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 16rpx;
		background: linear-gradient(
			135deg,
			var(--primary-color) 0%,
			var(--primary-color-dark) 100%
		);
		border-radius: 20rpx;
		transition: all var(--motion-duration-fast) var(--motion-ease-standard);

		&:active {
			transform: scale(0.95);
			opacity: 0.8;
		}

		.publish-icon {
			font-size: 48rpx;
			color: var(--text-color-inverse);
			font-weight: 300;
			line-height: 1;
		}
	}
}

// 筛选标签
.filter-tags {
	display: flex;
	align-items: center;
	padding: 16rpx 24rpx;
	background: var(--bg-color-card);
	gap: 16rpx;
	border-bottom: 1px solid var(--border-color-light);
	// 确保标签区域也是整体的一部分
	position: relative;
	transform: translate3d(0, 0, 0);
	z-index: 1;

	.filter-tag {
		display: flex;
		align-items: center;
		padding: 8rpx 20rpx;
		background: var(--primary-color-alpha-10);
		border-radius: 32rpx;
		border: 1rpx solid rgba(0, 0, 0, 0.05);
		box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
			-1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
		gap: 8rpx;

		.tag-text {
			font-size: 24rpx;
			color: var(--primary-color);
		}

		.tag-close {
			font-size: 20rpx;
			color: var(--primary-color);
			opacity: 0.6;
		}
	}

	.filter-tag-clear {
		margin-left: auto;
		padding: 8rpx 20rpx;
		border-radius: 32rpx;
		border: 1rpx solid rgba(0, 0, 0, 0.05);
		box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
			-1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);

		.clear-text {
			font-size: 24rpx;
			color: var(--text-color-tertiary);
		}
	}
}

// 商品列表区域
.product-scroll {
	flex: 1;
	padding: 24rpx 0;

	&.has-tags {
		padding-top: 16rpx;
	}
}

// 商品列表布局
.product-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding: 0 24rpx;

	// Claymorphism 风格 - 穿透到商品卡片组件
	:deep(.product-card),
	:deep(.share-card) {
		border-radius: 24rpx;
		border: 2rpx solid var(--border-color-light);
		box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
			-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
		overflow: hidden;
		transition: box-shadow 0.3s ease, transform 0.3s ease;

		&:active {
			box-shadow: 4rpx 4rpx 8rpx rgba(0, 0, 0, 0.04),
				-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.4);
			transform: scale(0.98);
		}
	}

	&.layout-list {
		grid-template-columns: 1fr;
		padding: 0 24rpx;

		:deep(.product-card) {
			display: flex;
			flex-direction: row;
			height: 240rpx;
			width: 100%;
			max-width: 710rpx;
			margin: 0 auto;
			border-radius: 24rpx;
			border: 2rpx solid var(--border-color-light);
			box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
				-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);

			.product-image {
				width: 240rpx;
				height: 100%;
				flex-shrink: 0;
			}

			.product-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				padding: 16rpx 16rpx 16rpx 20rpx;
			}

			.product-badges {
				top: 16rpx;
				left: 16rpx;
			}
		}
	}
}

// 骨架屏
.skeleton-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding: 0 24rpx;

	.skeleton-item {
		background: var(--bg-color-card);
		border-radius: 24rpx;
		overflow: hidden;
		padding-bottom: 16rpx;
		border: 2rpx solid var(--border-color-light);
		box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
			-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);

		.skeleton-image {
			width: 100%;
			height: 320rpx;
			background: linear-gradient(
				90deg,
				var(--border-color-light) 25%,
				var(--border-color-base) 50%,
				var(--border-color-light) 75%
			);
			background-size: 200% 100%;
			animation: skeleton-loading 1.5s infinite;
		}

		.skeleton-content {
			padding: 16rpx;

			.skeleton-title {
				height: 36rpx;
				background: linear-gradient(
					90deg,
					var(--border-color-light) 25%,
					var(--border-color-base) 50%,
					var(--border-color-light) 75%
				);
				background-size: 200% 100%;
				animation: skeleton-loading 1.5s infinite;
				border-radius: 16rpx;
				margin-bottom: 16rpx;
			}

			.skeleton-meta {
				height: 32rpx;
				width: 60%;
				background: linear-gradient(
					90deg,
					var(--border-color-light) 25%,
					var(--border-color-base) 50%,
					var(--border-color-light) 75%
				);
				background-size: 200% 100%;
				animation: skeleton-loading 1.5s infinite;
				border-radius: 16rpx;
				margin-bottom: 12rpx;
			}

			.skeleton-footer {
				height: 28rpx;
				width: 80%;
				background: linear-gradient(
					90deg,
					var(--border-color-light) 25%,
					var(--border-color-base) 50%,
					var(--border-color-light) 75%
				);
				background-size: 200% 100%;
				animation: skeleton-loading 1.5s infinite;
				border-radius: 16rpx;
			}
		}
	}
}

@keyframes skeleton-loading {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}

// 商品项动画
.product-item-animated {
	animation: fadeInUp 0.4s ease-out backwards;
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

// 列表过渡动画
.list-fade-enter-active {
	transition: all 0.3s ease;
}

.list-fade-enter-from {
	opacity: 0;
	transform: translateY(-20rpx);
}

.list-fade-enter-to {
	opacity: 1;
	transform: translateY(0);
}

// 筛选标签动画
.filter-tag {
	animation: scaleIn 0.2s ease-out backwards;
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

// 加载状态
.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 60rpx;
	gap: 16rpx;

	.loading-icon {
		font-size: 36rpx;
		animation: rotate 1s linear infinite;
	}

	.loading-text {
		font-size: 26rpx;
		color: var(--text-color-tertiary);
	}
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

// 没有更多
.no-more {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx 24rpx;
	gap: 16rpx;

	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--border-color-light);
		max-width: 120rpx;
	}

	.no-more-text {
		font-size: 24rpx;
		color: var(--text-color-tertiary);
		white-space: nowrap;
	}
}

// 搜索历史弹窗
.search-history-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: $z-index-modal;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding-top: 200rpx;

	.search-history-content {
		width: 650rpx;
		background: var(--bg-color-card);
		border-radius: var(--border-radius-xl);
		overflow: hidden;
		box-shadow: var(--box-shadow-base);

		// 热门搜索区域
		.hot-search-section {
			padding: 24rpx;
			border-bottom: 1px solid var(--border-color-light);

			.section-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 16rpx;

				.section-title {
					font-size: var(--font-size-base);
					font-weight: $font-weight-medium;
					color: var(--text-color-primary);
				}
			}

			.hot-search-list {
				display: flex;
				flex-direction: column;
				gap: 8rpx;

				.hot-search-item {
					display: flex;
					align-items: center;
					padding: 16rpx;
					border-radius: var(--border-radius-sm);
					transition: background var(--motion-duration-fast) var(--motion-ease-standard);
					gap: 12rpx;

					&:active {
						background: var(--bg-color-page);
					}

					.hot-rank {
						width: 40rpx;
						height: 40rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 24rpx;
						font-weight: $font-weight-medium;
						border-radius: 8rpx;
						background: var(--bg-color-page);
						color: var(--text-color-tertiary);

						&.rank-1 {
							background: linear-gradient(
								135deg,
								var(--primary-color) 0%,
								var(--primary-color-dark) 100%
							);
							color: #fff;
						}

						&.rank-2 {
							background: linear-gradient(
								135deg,
								var(--primary-color-dark) 0%,
								var(--primary-color) 100%
							);
							color: #fff;
						}

						&.rank-3 {
							background: linear-gradient(
								135deg,
								var(--primary-color) 0%,
								var(--accent-color) 100%
							);
							color: #fff;
						}
					}

					.hot-keyword {
						flex: 1;
						font-size: var(--font-size-base);
						color: var(--text-color-primary);
					}

					.hot-icon {
						font-size: 28rpx;
					}
				}
			}
		}

		.search-history-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 24rpx;
			border-bottom: 1px solid var(--border-color-light);

			&.has-hot {
				border-top: none;
			}

			.search-history-title {
				font-size: var(--font-size-lg);
				font-weight: $font-weight-medium;
				color: var(--text-color-primary);
			}

			.search-history-clear {
				font-size: var(--font-size-base);
				color: var(--primary-color);
				padding: 8rpx 16rpx;
			}
		}

		.search-history-list {
			max-height: 600rpx;
			overflow-y: auto;

			.search-history-item {
				display: flex;
				align-items: center;
				padding: 24rpx;
				border-bottom: 1px solid var(--border-color-light);
				gap: 16rpx;
				transition: background var(--motion-duration-fast) var(--motion-ease-standard);

				&:last-child {
					border-bottom: none;
				}

				&:active {
					background: var(--bg-color-page);
				}

				.search-history-icon {
					font-size: 32rpx;
				}

				.search-history-text {
					flex: 1;
					font-size: var(--font-size-base);
					color: var(--text-color-primary);
				}

				.search-history-delete {
					font-size: 32rpx;
					color: var(--text-color-tertiary);
					padding: 8rpx;
				}
			}
		}

		.search-history-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 80rpx 48rpx;
			gap: 16rpx;

			.empty-icon {
				font-size: 80rpx;
				opacity: 0.5;
			}

			.empty-text {
				font-size: var(--font-size-base);
				color: var(--text-color-tertiary);
			}
		}
	}
}
</style>
