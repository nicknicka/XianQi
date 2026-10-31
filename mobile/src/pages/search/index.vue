<template>
	<view class="search-page" :style="themeStyle">
		<!-- 装饰背景 -->
		<view class="bg-decor">
			<view class="blob blob-1" />
			<view class="blob blob-2" />
			<view class="blob blob-3" />
		</view>

		<!-- 搜索头部 -->
		<view class="search-header" :style="headerStyle">
			<view class="search-bar-row">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">‹</text>
				</view>

				<view class="search-box clay-search-box">
					<text class="search-icon-text">🔍</text>
					<input
						class="search-input"
						v-model="searchKeyword"
						placeholder="搜索你想要的宝贝..."
						placeholder-style="color: var(--text-color-tertiary)"
						focus
						confirm-type="search"
						@confirm="handleSearch"
						@input="onInput"
					/>
					<view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
						<text class="clear-icon">✕</text>
					</view>
				</view>

				<view class="search-action" @click="handleSearch">
					<text class="action-text">搜索</text>
				</view>
			</view>
		</view>

		<!-- 发现面板（搜索前） -->
		<scroll-view v-if="!hasSearched" class="discovery-scroll" scroll-y>
			<!-- 搜索历史 -->
			<view
				v-if="searchHistory.length > 0"
				class="discovery-section stagger-in"
			>
				<view class="section-header">
					<view class="section-title-group">
						<view class="section-icon-badge history-badge">
							<text class="badge-icon">🕐</text>
						</view>
						<text class="section-title">最近搜索</text>
					</view>
					<view class="clear-history-btn" @click="clearHistory">
						<text class="clear-icon-svg">🗑</text>
						<text class="clear-text">清空</text>
					</view>
				</view>
				<view class="tag-cloud">
					<view
						v-for="(item, index) in searchHistory"
						:key="'h-' + index"
						class="clay-tag history-tag"
						:style="{ animationDelay: `${index * 60}ms` }"
						@click="searchByHistory(item)"
					>
						<text class="tag-text">{{ item }}</text>
					</view>
				</view>
			</view>

			<!-- 热门搜索 -->
			<view class="discovery-section stagger-in" style="animation-delay: 0.1s">
				<view class="section-header">
					<view class="section-title-group">
						<view class="section-icon-badge hot-badge">
							<text class="badge-icon">🔥</text>
						</view>
						<text class="section-title">热门搜索</text>
					</view>
					<text class="update-hint">实时热门</text>
				</view>
				<view class="hot-grid">
					<view
						v-for="(item, index) in hotSearches"
						:key="'hot-' + index"
						class="clay-tag hot-tag"
						:class="getHotRankClass(index)"
						:style="{ animationDelay: `${index * 50}ms` }"
						@click="searchByHistory(item)"
					>
						<view class="rank-badge" :class="'rank-' + (index + 1)">
							<text class="rank-num">{{ index + 1 }}</text>
						</view>
						<text class="hot-tag-text">{{ item }}</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 搜索结果 -->
		<view v-else class="results-panel results-enter">
			<!-- Tab 切换 -->
			<view class="pill-tabs">
				<view
					v-for="tab in tabs"
					:key="tab.value"
					class="pill-tab"
					:class="{ active: currentTab === tab.value }"
					@click="switchTab(tab.value)"
				>
					<text class="pill-tab-text">{{ tab.label }}</text>
				</view>
			</view>

			<!-- 商品结果 -->
			<scroll-view
				v-if="currentTab === 'products'"
				class="results-scroll"
				scroll-y
				@scrolltolower="loadMore"
			>
				<view v-if="!productList?.length && !loading" class="empty-state">
					<text class="empty-icon">🔍</text>
					<text class="empty-title">未找到相关宝贝</text>
					<text class="empty-hint">换个关键词试试吧</text>
				</view>

				<view v-else class="product-grid">
					<view
						v-for="(product, idx) in productList"
						:key="product.id"
						class="product-card clay-card"
						:style="{ animationDelay: `${idx * 60}ms` }"
						@click="goProductDetail(product.id)"
					>
						<view class="product-image-wrap">
							<lazy-image
								class="product-image"
								:src="product.coverImage"
								mode="aspectFill"
								width="320"
								height="320"
							/>
							<view class="image-overlay" />
						</view>
						<view class="product-info">
							<text class="product-title text-ellipsis-2">{{
								product.title
							}}</text>
							<view class="product-meta">
								<text class="product-price"
									>¥{{ product.price }}</text
								>
								<view
									v-if="product.condition"
									class="condition-badge"
								>
									<text class="condition-text">{{
										product.condition
									}}</text>
								</view>
							</view>
							<view class="product-footer">
								<UserAvatar
									class="seller-avatar"
									:src="product.userAvatar"
									size="xs"
									shape="circle"
								/>
								<text class="seller-name">{{
									product.userName
								}}</text>
							</view>
						</view>
					</view>
				</view>

				<view v-if="loading" class="loading-state">
					<view class="loading-spinner" />
					<text class="loading-text">发现更多宝贝...</text>
				</view>

				<view v-if="noMore && productList.length" class="no-more">
					<view class="no-more-line" />
					<text class="no-more-text">已经到底啦</text>
					<view class="no-more-line" />
				</view>
			</scroll-view>

			<!-- 用户结果 -->
			<scroll-view
				v-else-if="currentTab === 'users'"
				class="results-scroll"
				scroll-y
				@scrolltolower="loadMore"
			>
				<view v-if="!userList?.length && !loading" class="empty-state">
					<text class="empty-icon">👤</text>
					<text class="empty-title">未找到相关用户</text>
					<text class="empty-hint">换个关键词试试吧</text>
				</view>

				<view v-else class="user-list">
					<view
						v-for="(user, idx) in userList"
						:key="user.id"
						class="user-card clay-card"
						:style="{ animationDelay: `${idx * 80}ms` }"
						@click="goUserHome(user.id)"
					>
						<UserAvatar
							class="user-avatar"
							:src="user.avatar"
							size="md"
							shape="circle"
						/>
						<view class="user-info">
							<text class="user-name">{{
								user.nickname || user.username
							}}</text>
							<view class="credit-row">
								<text class="star-icon">⭐</text>
								<text class="credit-score">{{
									user.creditScore || 0
								}}</text>
								<text class="credit-label">信用分</text>
							</view>
							<text class="user-bio" v-if="user.bio">{{
								user.bio
							}}</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { productApi } from "@/api/product";
import { userApi } from "@/api/user";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import { getNavBarInfo } from "@/utils/system-info";
import { useThemePage, useThemeStyle } from "@/utils/theme";

interface SearchResult {
	id: string;
	title?: string;
	coverImage?: string;
	price?: number;
	condition?: string;
	userAvatar?: string;
	userName?: string;
	nickname?: string;
	username?: string;
	avatar?: string;
	creditScore?: number;
	bio?: string;
}

const tabs = [
	{ label: "商品", value: "products" },
	{ label: "用户", value: "users" },
];

const { themeStyle } = useThemeStyle();
const navBarInfo = getNavBarInfo();

const searchKeyword = ref("");
const hasSearched = ref(false);
const currentTab = ref("products");
const statusBarHeight = ref(navBarInfo.statusBarHeight || 0);
const headerRightPadding = computed(() => {
	if (navBarInfo.capsule) {
		return Math.max(24, Math.ceil(navBarInfo.capsule.width + 16));
	}

	return 24;
});

const headerStyle = computed(() => ({
	paddingTop: `${statusBarHeight.value}px`,
	paddingRight: `${headerRightPadding.value}px`,
}));

const searchHistory = ref<string[]>([]);
const hotSearches = [
	"二手书",
	"数码产品",
	"生活用品",
	"运动装备",
	"校园卡",
	"宿舍用品",
	"教材",
	"自行车",
];

const productList = ref<SearchResult[]>([]);
const userList = ref<SearchResult[]>([]);

const loading = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 20;

onLoad((options: any) => {
	loadSearchHistory();

	if (options?.keyword) {
		searchKeyword.value = decodeURIComponent(options.keyword);
		handleSearch();
	}
});

onShow(() => {
	useThemePage();
});

function getHotRankClass(index: number): string {
	if (index < 3) return `hot-top-${index}`;
	return "";
}

function onInput() {
	if (searchKeyword.value.trim()) {
		handleSearch();
	}
}

function handleSearch() {
	if (!searchKeyword.value.trim()) {
		uni.showToast({ title: "请输入搜索关键词", icon: "none" });
		return;
	}

	hasSearched.value = true;
	addToHistory(searchKeyword.value.trim());

	currentTab.value = "products";
	loadProducts(true);
}

function searchByHistory(keyword: string) {
	searchKeyword.value = keyword;
	handleSearch();
}

function loadProducts(refresh = false) {
	if (loading.value) return;

	if (refresh) {
		page.value = 1;
		noMore.value = false;
	}

	loading.value = true;

	productApi
		.searchProducts({
			keyword: searchKeyword.value,
			page: page.value,
			pageSize,
		})
		.then((res: any) => {
			const list = res.data?.list || [];
			if (refresh) {
				productList.value = list;
			} else {
				productList.value = [...productList.value, ...list];
			}
			noMore.value = list.length < pageSize;
		})
		.catch(() => {
			productList.value = [];
			noMore.value = true;
		})
		.finally(() => {
			loading.value = false;
		});
}

function loadUsers(refresh = false) {
	if (loading.value) return;

	if (refresh) {
		page.value = 1;
		noMore.value = false;
	}

	loading.value = true;

	userApi
		.searchUsers({
			keyword: searchKeyword.value,
			page: page.value,
			pageSize,
		})
		.then((res: any) => {
			const list = res.data?.list || [];
			if (refresh) {
				userList.value = list;
			} else {
				userList.value = [...userList.value, ...list];
			}
			noMore.value = list.length < pageSize;
		})
		.catch(() => {
			userList.value = [];
			noMore.value = true;
		})
		.finally(() => {
			loading.value = false;
		});
}

function switchTab(value: string) {
	currentTab.value = value;

	if (value === "products") {
		loadProducts(true);
	} else {
		loadUsers(true);
	}
}

function loadMore() {
	if (!loading.value && !noMore.value) {
		page.value++;
		if (currentTab.value === "products") {
			loadProducts();
		} else {
			loadUsers();
		}
	}
}

function loadSearchHistory() {
	try {
		const history = uni.getStorageSync("search_history");
		searchHistory.value = history ? JSON.parse(history) : [];
	} catch {
		searchHistory.value = [];
	}
}

function addToHistory(keyword: string) {
	const index = searchHistory.value.indexOf(keyword);
	if (index > -1) {
		searchHistory.value.splice(index, 1);
	}
	searchHistory.value.unshift(keyword);

	if (searchHistory.value.length > 20) {
		searchHistory.value = searchHistory.value.slice(0, 20);
	}

	uni.setStorageSync("search_history", JSON.stringify(searchHistory.value));
}

function clearHistory() {
	uni.showModal({
		title: "提示",
		content: "确定清空搜索历史吗？",
		success: (res) => {
			if (res.confirm) {
				searchHistory.value = [];
				uni.removeStorageSync("search_history");
			}
		},
	});
}

function clearSearch() {
	searchKeyword.value = "";
	hasSearched.value = false;
	productList.value = [];
	userList.value = [];
}

function goProductDetail(id: string) {
	uni.navigateTo({
		url: `/pages/market/detail?id=${id}`,
	});
}

function goUserHome(id: string) {
	uni.navigateTo({
		url: `/pages/user/home?id=${id}`,
	});
}

function goBack() {
	uni.switchTab({
		url: "/pages/index/index",
	});
}
</script>

<style lang="scss" scoped>
// ========== 页面容器 ==========
.search-page {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--bg-color-page);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

// ========== 装饰背景 ==========
.bg-decor {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	z-index: 0;
	overflow: hidden;

	.blob {
		position: absolute;
		border-radius: 50%;
	}

	.blob-1 {
		width: 400rpx;
		height: 400rpx;
		top: -120rpx;
		right: -80rpx;
		background: var(--primary-color-alpha-8);
		animation: blobFloat 8s ease-in-out infinite;
	}

	.blob-2 {
		width: 300rpx;
		height: 300rpx;
		top: 200rpx;
		left: -100rpx;
		background: var(--primary-light-alpha-4);
		animation: blobFloat 10s ease-in-out infinite 2s;
	}

	.blob-3 {
		width: 200rpx;
		height: 200rpx;
		top: 500rpx;
		right: -60rpx;
		background: var(--accent-color-alpha-40);
		animation: blobFloat 12s ease-in-out infinite 4s;
	}
}

// ========== 搜索头部 ==========
.search-header {
	position: relative;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	padding-left: 24rpx;
	padding-bottom: 24rpx;
	flex-shrink: 0;

	.search-bar-row {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.back-btn {
		width: 68rpx;
		height: 68rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-color-card);
		border-radius: 50%;
		border: 2rpx solid rgba(255, 255, 255, 0.8);
		box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
			-1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

		.back-icon {
			font-size: 48rpx;
			font-weight: 300;
			color: var(--text-color-primary);
			line-height: 1;
			margin-left: -4rpx;
		}

		&:active {
			transform: scale(0.9);
			box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06),
				2rpx 2rpx 8rpx rgba(0, 0, 0, 0.04);
		}
	}

	// 粘土风格搜索框
	.clay-search-box {
		flex: 1;
		display: flex;
		align-items: center;
		height: 76rpx;
		padding: 0 28rpx;
		background: var(--bg-color-card);
		border-radius: 9999rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.6);
		box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
			inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

		.search-icon-text {
			font-size: 32rpx;
			flex-shrink: 0;
		}

		.search-input {
			flex: 1;
			height: 100%;
			margin-left: 16rpx;
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
		}

		.clear-btn {
			padding: 8rpx;

			.clear-icon {
				font-size: 28rpx;
				color: var(--text-color-tertiary);
				line-height: 1;
			}
		}
	}

	.search-action {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 108rpx;
		height: 76rpx;
		background: var(--primary-color);
		border-radius: 9999rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.5);
		box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.08),
			-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

		.action-text {
			font-size: var(--font-size-base);
			color: var(--text-color-inverse);
			font-weight: 600;
		}

		&:active {
			transform: scale(0.95);
			box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06),
				2rpx 2rpx 8rpx rgba(0, 0, 0, 0.04);
		}
	}
}

// ========== 发现面板 ==========
.discovery-scroll {
	flex: 1;
	min-height: 0;
	position: relative;
	z-index: 1;
}

.discovery-section {
	background: var(--bg-color-card);
	border-radius: 24rpx;
	padding: 28rpx 24rpx;
	margin: 0 24rpx 20rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
		-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.section-title-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.section-icon-badge {
	width: 44rpx;
	height: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;

	.badge-icon {
		font-size: 24rpx;
	}
}

.history-badge {
	background: var(--primary-color-alpha-8);
}

.hot-badge {
	background: var(--warning-color-alpha-10);
}

.section-title {
	font-size: var(--font-size-lg);
	font-weight: 600;
	color: var(--text-color-primary);
}

.clear-history-btn {
	display: flex;
	align-items: center;
	gap: 4rpx;
	padding: 8rpx 16rpx;
	border-radius: 9999rpx;
	background: var(--bg-color-page);

	.clear-icon-svg {
		font-size: 22rpx;
	}

	.clear-text {
		font-size: var(--font-size-sm);
		color: var(--text-color-tertiary);
	}
}

.update-hint {
	font-size: var(--font-size-xs);
	color: var(--text-color-tertiary);
	padding: 6rpx 16rpx;
	background: var(--bg-color-page);
	border-radius: 9999rpx;
}

// ========== 粘土标签 ==========
.clay-tag {
	display: inline-flex;
	align-items: center;
	padding: 16rpx 28rpx;
	background: var(--bg-color-card);
	border-radius: 9999rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.6);
	box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
		-1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
	transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	animation: tagPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;

	&:active {
		transform: scale(0.93);
		box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06),
			2rpx 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}
}

.tag-cloud {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;

	.tag-text {
		font-size: var(--font-size-base);
		color: var(--text-color-secondary);
	}
}

// ========== 热门搜索网格 ==========
.hot-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}

.hot-tag {
	display: inline-flex;
	align-items: center;
	gap: 10rpx;

	.rank-badge {
		width: 32rpx;
		height: 32rpx;
		border-radius: 10rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-color-page);

		.rank-num {
			font-size: 20rpx;
			font-weight: 700;
			color: var(--text-color-tertiary);
		}

		&.rank-1 {
			background: linear-gradient(
				135deg,
				#ff9a56,
				#ff6b6b
			);
			.rank-num {
				color: #fff;
			}
		}

		&.rank-2 {
			background: linear-gradient(
				135deg,
				#ffd666,
				#ffb347
			);
			.rank-num {
				color: #fff;
			}
		}

		&.rank-3 {
			background: linear-gradient(
				135deg,
				#7ed4a6,
				#56c596
			);
			.rank-num {
				color: #fff;
			}
		}
	}

	.hot-tag-text {
		font-size: var(--font-size-base);
		color: var(--text-color-secondary);
	}

	// 前三名特殊样式
	&.hot-top-0 {
		background: linear-gradient(
			135deg,
			rgba(255, 154, 86, 0.06),
			rgba(255, 107, 107, 0.06)
		);
		border-color: rgba(255, 154, 86, 0.2);

		.hot-tag-text {
			color: var(--text-color-primary);
			font-weight: 500;
		}
	}

	&.hot-top-1 {
		background: linear-gradient(
			135deg,
			rgba(255, 214, 102, 0.06),
			rgba(255, 179, 71, 0.06)
		);
		border-color: rgba(255, 214, 102, 0.2);

		.hot-tag-text {
			color: var(--text-color-primary);
			font-weight: 500;
		}
	}

	&.hot-top-2 {
		background: linear-gradient(
			135deg,
			rgba(126, 212, 166, 0.06),
			rgba(86, 197, 150, 0.06)
		);
		border-color: rgba(126, 212, 166, 0.2);

		.hot-tag-text {
			color: var(--text-color-primary);
			font-weight: 500;
		}
	}
}

// ========== 搜索结果面板 ==========
.results-panel {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	position: relative;
	z-index: 1;
}

// ========== 胶囊 Tab ==========
.pill-tabs {
	display: flex;
	gap: 12rpx;
	padding: 16rpx 24rpx;
	background: var(--bg-color-page);
	flex-shrink: 0;

	.pill-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 68rpx;
		background: var(--bg-color-card);
		border-radius: 9999rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.6);
		box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
			-1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
		transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

		.pill-tab-text {
			font-size: var(--font-size-base);
			color: var(--text-color-secondary);
			font-weight: 500;
			transition: color 0.25s ease;
		}

		&.active {
			background: var(--primary-color);
			border-color: rgba(255, 255, 255, 0.5);
			box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.08),
				-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);

			.pill-tab-text {
				color: var(--text-color-inverse);
				font-weight: 600;
			}
		}

		&:active {
			transform: scale(0.95);
		}
	}
}

// ========== 结果滚动区 ==========
.results-scroll {
	flex: 1;
	min-height: 0;
	padding: 16rpx 24rpx;
}

// ========== 商品卡片 ==========
.product-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;
}

.clay-card {
	background: var(--bg-color-card);
	border-radius: 24rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
		-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
	overflow: hidden;
	animation: cardFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

	&:active {
		transform: scale(0.97);
	}
}

.product-card {
	.product-image-wrap {
		position: relative;
		overflow: hidden;

		.product-image {
			width: 100%;
			height: 320rpx;
		}

		.image-overlay {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 60rpx;
			background: linear-gradient(transparent, rgba(0, 0, 0, 0.04));
			pointer-events: none;
		}
	}

	.product-info {
		padding: 16rpx 20rpx 20rpx;

		.product-title {
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
			line-height: 1.4;
			min-height: 72rpx;
			font-weight: 500;
		}

		.product-meta {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: 12rpx;
			gap: 8rpx;

			.product-price {
				font-size: var(--font-size-xl);
				font-weight: 700;
				color: var(--primary-color);
			}

			.condition-badge {
				padding: 4rpx 14rpx;
				background: var(--primary-color-alpha-8);
				border-radius: 9999rpx;

				.condition-text {
					font-size: var(--font-size-xs);
					color: var(--primary-color);
					font-weight: 500;
				}
			}
		}

		.product-footer {
			display: flex;
			align-items: center;
			margin-top: 14rpx;
			gap: 8rpx;

			.seller-avatar {
				width: 32rpx;
				height: 32rpx;
				border-radius: 50%;
			}

			.seller-name {
				flex: 1;
				font-size: var(--font-size-sm);
				color: var(--text-color-secondary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}
}

// ========== 用户卡片 ==========
.user-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.user-card {
	display: flex;
	align-items: center;
	padding: 24rpx;

	.user-avatar {
		flex-shrink: 0;
		margin-right: 20rpx;
	}

	.user-info {
		flex: 1;
		min-width: 0;

		.user-name {
			font-size: var(--font-size-lg);
			font-weight: 600;
			color: var(--text-color-primary);
			display: block;
			margin-bottom: 8rpx;
		}

		.credit-row {
			display: flex;
			align-items: center;
			gap: 6rpx;
			margin-bottom: 6rpx;

			.star-icon {
				font-size: 22rpx;
			}

			.credit-score {
				font-size: var(--font-size-sm);
				color: var(--accent-color);
				font-weight: 600;
			}

			.credit-label {
				font-size: var(--font-size-xs);
				color: var(--text-color-tertiary);
			}
		}

		.user-bio {
			font-size: var(--font-size-sm);
			color: var(--text-color-tertiary);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
}

// ========== 空状态 ==========
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 160rpx 0 120rpx;

	.empty-icon {
		font-size: 80rpx;
		margin-bottom: 24rpx;
	}

	.empty-title {
		font-size: var(--font-size-lg);
		color: var(--text-color-secondary);
		font-weight: 500;
		margin-bottom: 12rpx;
	}

	.empty-hint {
		font-size: var(--font-size-sm);
		color: var(--text-color-tertiary);
	}
}

// ========== 加载状态 ==========
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx 0;

	.loading-spinner {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		border: 4rpx solid var(--primary-color-alpha-15);
		border-top-color: var(--primary-color);
		animation: spin 0.8s linear infinite;
	}

	.loading-text {
		margin-top: 16rpx;
		font-size: var(--font-size-sm);
		color: var(--text-color-tertiary);
	}
}

// ========== 底部提示 ==========
.no-more {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 32rpx 0;

	.no-more-line {
		flex: 1;
		height: 1rpx;
		background: var(--border-color-light);
	}

	.no-more-text {
		font-size: var(--font-size-sm);
		color: var(--text-color-tertiary);
		flex-shrink: 0;
	}
}

// ========== 动画 ==========
@keyframes blobFloat {
	0%,
	100% {
		transform: translate(0, 0) scale(1);
	}
	33% {
		transform: translate(20rpx, -20rpx) scale(1.05);
	}
	66% {
		transform: translate(-15rpx, 15rpx) scale(0.95);
	}
}

@keyframes tagPop {
	from {
		opacity: 0;
		transform: scale(0.8) translateY(10rpx);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

@keyframes cardFadeIn {
	from {
		opacity: 0;
		transform: translateY(30rpx) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.stagger-in {
	animation: sectionSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.results-enter {
	animation: sectionSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes sectionSlideIn {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
