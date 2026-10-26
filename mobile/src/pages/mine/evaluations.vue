<template>
	<view class="evaluations-page service-redesign-page" :style="themeStyle">
		<!-- 页面头部 -->
		<view class="page-header" :class="{ 'animate-in': isAnimated }">
			<text class="title">我的评价</text>
			<view class="stats">
				<view class="stat-item">
					<text class="stat-value">{{ goodRate }}%</text>
					<text class="stat-label">好评率</text>
				</view>
				<view class="stat-divider" />
				<view class="stat-item">
					<text class="stat-value">{{ totalCount }}</text>
					<text class="stat-label">总评价</text>
				</view>
			</view>
		</view>

		<!-- 一级 Tab 切换 -->
		<view class="scope-tabs" :class="{ 'animate-in': isAnimated }">
			<view
				v-for="tab in scopeTabs"
				:key="tab.value"
				class="scope-tab-item"
				:class="{ active: currentScope === tab.value }"
				@click="switchScope(tab.value)"
			>
				<text class="scope-tab-text">{{ tab.label }}</text>
			</view>
			<view
				class="scope-tab-slider"
				:style="{ left: scopeSliderLeft }"
			/>
		</view>

		<!-- 评分筛选 -->
		<view class="tabs" :class="{ 'animate-in': isAnimated }">
			<view
				v-for="tab in filterTabs"
				:key="tab.value"
				class="tab-item"
				:class="{ active: currentFilterTab === tab.value }"
				@click="switchFilter(tab.value)"
			>
				<text class="tab-text">{{ tab.label }}</text>
				<view v-if="currentFilterTab === tab.value" class="tab-indicator" />
			</view>
			<view
				class="tab-slider"
				:style="{ transform: `translateX(${filterSliderPosition}%)` }"
			/>
		</view>

		<!-- 评价列表 -->
		<scroll-view
			class="scroll-view"
			scroll-y
			@scrolltolower="loadMore"
			:scroll-top="0"
			:scroll-with-animation="false"
			:refresher-enabled="true"
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
		>
			<view v-if="filteredEvaluations.length === 0 && !loading" class="empty-state">
				<image
					class="empty-image"
					:src="emptyImage"
					mode="aspectFit"
				/>
				<text class="empty-text">{{ emptyText }}</text>
			</view>

			<view v-else class="evaluation-list">
				<view
					v-for="(item, index) in filteredEvaluations"
					:key="item.id"
					class="evaluation-card"
					:style="{ animationDelay: Math.min(index * 80, 400) + 'ms' }"
					@click="goProduct(item.productId)"
				>
					<!-- 商品信息头部 -->
					<view class="card-header">
						<lazy-image
							v-if="item.productImage"
							class="product-thumb"
							:src="item.productImage"
							mode="aspectFill"
						/>
						<view class="product-info">
							<text class="product-title">{{ item.productName }}</text>
							<view class="product-meta">
								<text v-if="item.productPrice" class="product-price">¥{{ item.productPrice }}</text>
								<text class="eval-time">{{ formatTime(item.createTime) }}</text>
							</view>
							<text class="counterparty-text">{{ item.counterpartyText }}</text>
						</view>
					</view>

					<!-- 评分和标签 -->
					<view class="rating-section">
						<view class="stars-row">
							<uni-icons
								v-for="star in 5"
								:key="star"
								:type="star <= item.rating ? 'star-filled' : 'star'"
								size="14"
								:color="star <= item.rating ? '#FFCB3F' : '#D9D9D9'"
							/>
						</view>
						<view v-if="ensureArray(item.tags).length > 0" class="tags-row">
							<text
								v-for="tag in ensureArray(item.tags)"
								:key="tag"
								class="tag"
								:class="{ 'tag-good': item.rating >= 4, 'tag-bad': item.rating <= 2 }"
							>
								{{ tag }}
							</text>
						</view>
					</view>

					<!-- 评价内容 -->
					<text v-if="item.content" class="eval-content">{{ item.content }}</text>

					<!-- 评价图片 -->
					<view v-if="ensureArray(item.images).length > 0" class="images-row">
						<lazy-image
							v-for="(img, idx) in ensureArray(item.images)"
							:key="idx"
							class="eval-image"
							:src="img"
							mode="aspectFill"
							@click.stop="previewImages(ensureArray(item.images), idx)"
						/>
					</view>
				</view>
			</view>

			<view v-if="loading" class="loading">
				<uni-icons type="spinner-cycle" size="20" :color="primaryColor" />
				<text class="loading-text">加载中...</text>
			</view>

			<view v-if="noMore && filteredEvaluations.length > 0" class="no-more">
				没有更多了
			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeStyle, useThemeColors } from "@/utils/theme";
import { ref, computed, onMounted } from "vue";
import { evaluationApi } from "@/api/evaluation";
import { formatDateTime } from "@/utils/date";
import { useServiceNavigation } from "@/composables/useServiceNavigation";
import { useUserStore } from "@/store/user";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import { onShow } from "@dcloudio/uni-app";

// 兼容 h5 base=./ 等部署场景
const emptyImage = `${import.meta.env.BASE_URL}static/images/empty.png`;

// 启用服务页面导航
useServiceNavigation();

const { themeStyle } = useThemeStyle();
const { primaryColor } = useThemeColors();
const userStore = useUserStore();

// 页面动画
const isAnimated = ref(false);

const scopeTabs = [
	{ label: "收到的评价", value: "received" },
	{ label: "发出的评价", value: "sent" },
] as const;

const filterTabs = [
	{ label: "全部", value: "all" },
	{ label: "好评", value: "good" },
	{ label: "中评", value: "medium" },
	{ label: "差评", value: "bad" },
] as const;

const currentScope = ref<(typeof scopeTabs)[number]["value"]>("received");
const currentFilterTab = ref<(typeof filterTabs)[number]["value"]>("all");

// 确保值是数组
function ensureArray(value: any): string[] {
	if (!value) return [];
	if (Array.isArray(value)) return value.map((v) => String(v));
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [value];
		} catch {
			if (value.includes(",")) {
				return value
					.split(",")
					.map((v: string) => v.trim())
					.filter(Boolean);
			}
			return [value];
		}
	}
	return [];
}

interface Evaluation {
	id: string;
	evaluationId?: string;
	productId: string;
	productName: string;
	productTitle?: string;
	productImage: string;
	productPrice?: number;
	orderId: string;
	orderNo?: string;
	rating: number;
	score?: number;
	tags: string[];
	content: string;
	images: string[];
	counterpartyText: string;
	createTime: string;
}

const evaluations = ref<Evaluation[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 20;
const goodRate = ref(0);
const totalCount = ref(0);
const loadIntent = ref("");

const scopeSliderLeft = computed(() =>
	currentScope.value === "received" ? "8rpx" : "50%"
);

const filterSliderPosition = computed(() => {
	const index = filterTabs.findIndex((tab) => tab.value === currentFilterTab.value);
	return index * 25;
});

const emptyText = computed(() =>
	currentScope.value === "received" ? "暂无收到的评价" : "暂无发出的评价"
);

// 根据 Tab 过滤评价
const filteredEvaluations = computed(() => {
	if (currentFilterTab.value === "all") return evaluations.value;
	if (currentFilterTab.value === "good") return evaluations.value.filter((e) => e.rating >= 4);
	if (currentFilterTab.value === "medium") return evaluations.value.filter((e) => e.rating === 3);
	if (currentFilterTab.value === "bad") return evaluations.value.filter((e) => e.rating <= 2);
	return evaluations.value;
});

function switchScope(value: (typeof scopeTabs)[number]["value"]) {
	if (currentScope.value === value) return;
	currentScope.value = value;
	evaluations.value = [];
	totalCount.value = 0;
	goodRate.value = 0;
	noMore.value = false;
	loadEvaluations(true);
}

function switchFilter(value: (typeof filterTabs)[number]["value"]) {
	currentFilterTab.value = value;
}

onShow(() => {
	useThemePage();
	loadEvaluations(true);
});

onMounted(() => {
	// 触发页面进入动画
	setTimeout(() => {
		isAnimated.value = true;
	}, 50);
});

function loadEvaluations(refresh = false) {
	if (loading.value && !refresh) return;

	if (refresh) {
		page.value = 1;
		noMore.value = false;
	}

	const requestScope = currentScope.value;
	const requestPage = page.value;
	const currentIntent = `${requestScope}-${requestPage}-${Date.now()}`;
	loadIntent.value = currentIntent;
	loading.value = true;

	const userId = userStore.userInfo?.userId;
	if (!userId) {
		loading.value = false;
		refreshing.value = false;
		return;
	}

	const request =
		requestScope === "received"
			? evaluationApi.getEvaluationsByUser(String(userId), {
					page: requestPage,
					size: pageSize,
				})
			: evaluationApi.getSentEvaluationsByUser(String(userId), {
					page: requestPage,
					size: pageSize,
				});

	request
		.then((res: any) => {
			if (loadIntent.value !== currentIntent) {
				return;
			}

			const rawDataList =
				res?.records || res?.data?.records || res?.list || res?.data?.list || [];
			const total = res?.total || res?.data?.total || 0;

			const list = rawDataList.map((item: any) => {
				let tags: string[] = [];
				if (item.tags) {
					if (typeof item.tags === "string") {
						try {
							tags = JSON.parse(item.tags);
						} catch (e) {
							tags = item.tags
								.split(",")
								.map((t: string) => t.trim())
								.filter((t: string) => t);
						}
					} else if (Array.isArray(item.tags)) {
						tags = item.tags;
					}
				}

				let images: string[] = [];
				if (item.images) {
					if (typeof item.images === "string") {
						try {
							images = JSON.parse(item.images);
						} catch (e) {
							images = item.images
								.split(",")
								.map((img: string) => img.trim())
								.filter((img: string) => img);
						}
					} else if (Array.isArray(item.images)) {
						images = item.images;
					}
				}

				let content = "";
				if (item.content) {
					if (typeof item.content === "string") {
						content = item.content;
					} else if (Array.isArray(item.content)) {
						content = item.content.join("");
					} else {
						content = String(item.content);
					}
				}

				const counterpartyName =
					requestScope === "received"
						? item.evaluatorName || item.fromUserName || item.evaluatorNickname || "匿名用户"
						: item.evaluatedUserNickname || item.toUserName || "匿名用户";

				return {
					id: item.evaluationId || item.id || item.evalId,
					productId: item.productId || 0,
					productName: item.productTitle || item.productName || "未知商品",
					productImage: item.productImage || "",
					productPrice: item.productPrice,
					orderId: item.orderId || 0,
					rating: item.score || item.rating || 5,
					tags: tags,
					content: content,
					images: images,
					counterpartyText:
						requestScope === "received"
							? `来自 ${counterpartyName}`
							: `评价给 ${counterpartyName}`,
					createTime: item.createTime || item.createdAt || new Date().toISOString(),
				};
			});

			if (refresh) {
				evaluations.value = list;
			} else {
				evaluations.value = [...evaluations.value, ...list];
			}
			totalCount.value = total;
			noMore.value = list.length < pageSize;
			calculateGoodRate();

			if (page.value === 1 && requestScope === "received") {
				userStore.updateUserInfo({ evaluationCount: total });
			}
		})
		.catch((error) => {
			if (loadIntent.value !== currentIntent) {
				return;
			}
			console.error("[Evaluations] API 调用失败:", error);
			uni.showToast({ title: "加载评价失败", icon: "none", duration: 2000 });
			evaluations.value = [];
			noMore.value = true;
		})
		.finally(() => {
			if (loadIntent.value === currentIntent) {
				loading.value = false;
				refreshing.value = false;
			}
		});
}

function calculateGoodRate() {
	if (evaluations.value.length === 0) {
		goodRate.value = 0;
		return;
	}
	const goodCount = evaluations.value.filter((item) => item.rating >= 4).length;
	goodRate.value = Math.round((goodCount / evaluations.value.length) * 100);
}

function loadMore() {
	if (!loading.value && !noMore.value) {
		page.value++;
		loadEvaluations();
	}
}

function onRefresh() {
	refreshing.value = true;
	loadEvaluations(true);
}

function goProduct(productId: string) {
	uni.navigateTo({ url: `/pages/market/detail?id=${productId}` });
}

function previewImages(images: string[], index: number) {
	uni.previewImage({ urls: images, current: index });
}

function formatTime(time: string) {
	return formatDateTime(time, "YYYY-MM-DD HH:mm");
}
</script>

<style lang="scss" scoped>
// 页面进入动画
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

@keyframes indicatorBounce {
	0% { transform: scaleX(0); }
	50% { transform: scaleX(1.2); }
	100% { transform: scaleX(1); }
}

@keyframes emptyFadeIn {
	from { opacity: 0; transform: translateY(20rpx); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10rpx); }
}

@keyframes cardEntrance {
	from {
		opacity: 0;
		transform: translateY(60rpx) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

.evaluations-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-color-page);
	padding-bottom: env(safe-area-inset-bottom);
}

// 页面头部
.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 32rpx;
	background: var(--bg-color-card);
	border-bottom: 1px solid var(--border-color-base);
	opacity: 0;
	transform: translateY(-20rpx);

	&.animate-in {
		animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.title {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-color-primary);
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 24rpx;

		.stat-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4rpx;

			.stat-value {
				font-size: var(--font-size-lg);
				font-weight: 600;
				color: var(--primary-color);
			}

			.stat-label {
				font-size: var(--font-size-xs);
				color: var(--text-color-tertiary);
			}
		}

		.stat-divider {
			width: 1px;
			height: 40rpx;
			background: var(--border-color-light);
		}
	}
}

// 一级 Tab 栏
.scope-tabs {
	display: flex;
	margin: var(--spacing-md) var(--spacing-md) 0;
	padding: 8rpx;
	background: var(--bg-color-card);
	border-radius: 9999px;
	position: relative;
	opacity: 0;
	transform: translateY(24rpx);

	&.animate-in {
		animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.scope-tab-item {
		flex: 1;
		padding: 18rpx 0;
		text-align: center;
		position: relative;
		z-index: 2;

		.scope-tab-text {
			font-size: var(--font-size-sm);
			color: var(--text-color-secondary);
			transition: color 0.3s ease;
		}

		&.active .scope-tab-text {
			color: var(--primary-color);
			font-weight: 600;
		}
	}

	.scope-tab-slider {
		position: absolute;
		top: 8rpx;
		left: 8rpx;
		width: calc(50% - 8rpx);
		height: calc(100% - 16rpx);
		border-radius: 9999px;
		background: linear-gradient(
			135deg,
			var(--primary-color-alpha-12) 0%,
			var(--primary-color-alpha-6) 100%
		);
		transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1;
	}
}

// Tab 栏
.tabs {
	display: flex;
	background: var(--bg-color-card);
	border-bottom: 1px solid var(--border-color-base);
	position: relative;
	opacity: 0;
	transform: translateY(30rpx);
	margin-top: var(--spacing-sm);

	&.animate-in {
		animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-md) 0;
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 2;

		.tab-text {
			font-size: var(--font-size-base);
			color: var(--text-color-secondary);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}

		&.active .tab-text {
			color: var(--primary-color);
			font-weight: 600;
			transform: scale(1.05);
		}

		.tab-indicator {
			position: absolute;
			bottom: 0;
			width: 48rpx;
			height: 4rpx;
			background: var(--primary-color);
			border-radius: var(--border-radius-sm);
			animation: indicatorBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
			box-shadow: 0 2rpx 10rpx var(--primary-color-alpha-30);
		}
	}

	.tab-slider {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 25%;
		height: 100%;
		background: linear-gradient(
			180deg,
			var(--primary-color-alpha-5) 0%,
			var(--primary-color-alpha-3) 100%
		);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1;
	}
}

// 滚动区域
.scroll-view {
	flex: 1;
	padding: var(--spacing-md);
	box-sizing: border-box;
	overflow: hidden;
}

// 评价列表
.evaluation-list {
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
	animation: fadeInScale 0.3s ease-out 0.2s forwards;
	opacity: 0;
}

// 评价卡片
.evaluation-card {
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	background: var(--bg-color-card);
	border-radius: 20rpx;
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
	opacity: 0;
	animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

	&:active {
		transform: scale(0.98);
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
	}

	.card-header {
		display: flex;
		margin-bottom: var(--spacing-sm);

		.product-thumb {
			width: 120rpx;
			height: 120rpx;
			border-radius: var(--border-radius-base);
			margin-right: var(--spacing-sm);
			flex-shrink: 0;
		}

		.product-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			min-width: 0;

			.product-title {
				font-size: var(--font-size-base);
				color: var(--text-color-primary);
				font-weight: 500;
				line-height: 1.4;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				max-width: 100%;
			}

			.product-meta {
				display: flex;
				align-items: center;
				justify-content: space-between;

				.product-price {
					font-size: var(--font-size-lg);
					font-weight: 600;
					color: var(--error-color);
				}

				.eval-time {
					font-size: var(--font-size-xs);
					color: var(--text-color-tertiary);
				}
			}

			.counterparty-text {
				margin-top: 8rpx;
				font-size: var(--font-size-xs);
				color: var(--text-color-secondary);
			}
		}
	}

	.rating-section {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: var(--spacing-sm);

		.stars-row {
			display: flex;
			gap: 4rpx;
		}

		.tags-row {
			display: flex;
			flex-wrap: wrap;
			gap: 8rpx;

			.tag {
				padding: 4rpx 12rpx;
				font-size: var(--font-size-xs);
				border-radius: 9999px;
				background: var(--bg-color-page);
				color: var(--text-color-secondary);

				&.tag-good {
					background: var(--success-color-alpha-10);
					color: var(--success-color);
				}

				&.tag-bad {
					background: var(--danger-color-alpha-6);
					color: var(--danger-color);
				}
			}
		}
	}

	.eval-content {
		font-size: var(--font-size-sm);
		color: var(--text-color-primary);
		line-height: 1.6;
		word-break: break-word;
		margin-bottom: var(--spacing-sm);
	}

	.images-row {
		display: flex;
		gap: 12rpx;
		flex-wrap: wrap;

		.eval-image {
			width: 160rpx;
			height: 160rpx;
			border-radius: var(--border-radius-base);
		}
	}
}

// 空状态
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
	opacity: 0;
	animation: emptyFadeIn 0.5s ease-out 0.3s forwards;
	background: transparent;

	.empty-image {
		width: 240rpx;
		height: 240rpx;
		margin-bottom: var(--spacing-md);
		animation: float 3s ease-in-out infinite;
		background: transparent;
	}

	.empty-text {
		font-size: var(--font-size-base);
		color: var(--text-color-tertiary);
		margin-bottom: 32rpx;
	}
}

// 加载状态
.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-xl);

	.loading-text {
		margin-left: var(--spacing-sm);
		font-size: var(--font-size-sm);
		color: var(--text-color-tertiary);
	}
}

// 没有更多
.no-more {
	text-align: center;
	padding: var(--spacing-xl);
	font-size: var(--font-size-sm);
	color: var(--text-color-tertiary);
}

// 列表容器淡入动画
@keyframes fadeInScale {
	from {
		opacity: 0;
		transform: scale(0.98);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}
</style>
