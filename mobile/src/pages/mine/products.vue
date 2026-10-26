<template>
	<view class="products-page service-redesign-page" :style="themeStyle">
		<!-- Tab 切换 -->
		<view class="tabs" :class="{ 'tab-animate': pageVisible }">
			<view
				v-for="tab in tabs"
				:key="tab.value"
				class="tab-item"
				:class="{ active: currentTab === tab.value }"
				@click="switchTab(tab.value)"
			>
				<text class="tab-text">{{ tab.label }}</text>
				<view v-if="currentTab === tab.value" class="tab-indicator" />
			</view>
		</view>

		<!-- 商品列表 -->
		<scroll-view
			class="scroll-view"
			:class="{ 'content-animate': pageVisible }"
			scroll-y
			@scrolltolower="loadMore"
			@scroll="onScroll"
			:refresher-enabled="true"
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
		>
			<view v-if="!productList?.length && !loading" class="empty-state">
				<image class="empty-image" :src="emptyProductImage" mode="aspectFit" />
				<text class="empty-text">暂无商品</text>
				<button class="publish-btn" @click="goPublish">去发布</button>
			</view>

			<view v-else class="product-list">
				<product-list-item
					v-for="(product, index) in productList"
					:key="product.id"
					:data="{
						id: product.id,
						title: product.title,
						image: product.coverImage,
						price: product.price,
						condition: getStatusText(product.status),
						extra: `浏览 ${product.viewCount} · 收藏 ${product.favoriteCount}`,
					}"
					:visible="true"
					:item-style="{ 'animation-delay': index * 0.05 + 's' }"
					@click="goDetail(product.id)"
				>
					<template #action>
						<view class="action-btn" @click.stop="showActionSheet(product)">
							<uni-icons type="more-filled" size="20" color="#AAAAAA" />
						</view>
					</template>
				</product-list-item>
			</view>

			<view v-if="loading" class="loading">
				<uni-icons type="spinner-cycle" size="20" color="#AAAAAA" />
				<text class="loading-text">加载中...</text>
			</view>

			<view v-if="noMore" class="no-more">没有更多了</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeStyle } from "@/utils/theme";
import { ref, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { productApi } from "@/api/product";
import { shareManager } from "@/utils/share";
import ProductListItem from "@/components/product-list-item/product-list-item.vue";

interface Product {
	id: string;
	title: string;
	coverImage: string;
	price: number;
	status: number;
	viewCount: number;
	favoriteCount: number;
}

const { themeStyle } = useThemeStyle();

const tabs = [
	{ label: "全部", value: "all" },
	{ label: "在售", value: "onsale" },
	{ label: "已售", value: "sold" },
	{ label: "下架", value: "offsale" },
];

const currentTab = ref("all");
const productList = ref<Product[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 20;

// 兼容 h5 base=./ 等部署场景，避免绝对路径 /static 在子路径部署下失效
const emptyProductImage = `${import.meta.env.BASE_URL}static/images/empty.png`;

// 页面入场动画状态
const pageVisible = ref(false);

// 自动滚动加载相关
const SCROLL_THRESHOLD = 100; // 距离底部100px时触发加载
let scrollTimer: number | null = null;

onMounted(() => {
	loadProducts();

	// 触发页面入场动画
	setTimeout(() => {
		pageVisible.value = true;
	}, 50);
});

// 页面显示时刷新数据（从其他页面返回时）
onShow(() => {
	useThemePage();
	console.log("我的发布页面显示，刷新数据");
	loadProducts(true);
});

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
// 放在 onMounted 后面以确保页面初始化完成
import { useServiceNavigation } from "@/composables/useServiceNavigation";
useServiceNavigation();

function switchTab(value: string) {
	currentTab.value = value;
	loadProducts(true);
}

function loadProducts(refresh = false) {
	if (loading.value) return;

	if (refresh) {
		page.value = 1;
		noMore.value = false;
	}

	loading.value = true;

	// 根据 tab 获取对应状态的商品
	let status: number | undefined;
	if (currentTab.value === "onsale") status = 1;
	else if (currentTab.value === "sold") status = 2;
	else if (currentTab.value === "offsale") status = 0;

	// 🔍 调试日志
	console.log("========== [我的发布] 开始加载商品 ==========");
	console.log("当前 tab:", currentTab.value);
	console.log("请求状态参数 status:", status);
	console.log("页码:", page.value);

	// 构建请求参数，只在 status 有值时才包含该参数
	const params: any = {
		page: page.value,
		pageSize,
	};
	if (status !== undefined) {
		params.status = status;
	}

	productApi
		.getMyProducts(params)
		.then((res: any) => {
			console.log("✅ [我的发布] API 请求成功");
			console.log("   完整响应:", res);
			console.log("   响应 code:", res?.code);
			console.log("   响应 message:", res?.message);

			let list = res.data?.list || res.data?.records || [];
			console.log("   获取到的商品数量（过滤前）:", list.length);
			console.log("   商品列表（过滤前）:", list);

			// 只显示有效商品：0=下架, 1=在售, 2=已售
			const beforeFilterCount = list.length;
			list = list.filter((item: Product) => {
				const validStatuses = [0, 1, 2];
				return validStatuses.includes(item.status);
			});
			console.log("   过滤后商品数量:", list.length);
			console.log("   过滤掉的商品数量:", beforeFilterCount - list.length);
			console.log("   注意：过滤掉的商品状态不是 0/1/2，可能是旧数据");

			// 打印每个商品的详细信息
			list.forEach((item: Product, index: number) => {
				console.log(`   商品 ${index + 1}:`, {
					id: item.id,
					title: item.title,
					status: item.status,
					statusText: getStatusText(item.status),
				});
			});

			if (refresh) {
				productList.value = list;
			} else {
				productList.value = [...productList.value, ...list];
			}

			// 获取总数来判断是否还有更多数据
			const total = res.data?.total || 0;
			noMore.value = productList.value.length >= total;

			console.log("   总数量:", total);
			console.log("   最终 productList 数量:", productList.value.length);
			console.log("========== [我的发布] 加载完成 ==========");
		})
		.catch((err: any) => {
			console.error("❌ [我的发布] API 请求失败:", err);
			// 错误时确保 productList 至少是空数组
			if (refresh) {
				productList.value = [];
			}
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

// 滚动事件处理 - 实现自动预加载
function onScroll(e: any) {
	if (loading.value || noMore.value) return;

	// 使用节流避免频繁触发
	if (scrollTimer) {
		clearTimeout(scrollTimer);
	}

	scrollTimer = setTimeout(() => {
		const scrollTop = e.detail.scrollTop;
		const scrollHeight = e.detail.scrollHeight;
		const viewHeight = e.detail.height || 600; // 默认视图高度

		// 计算距离底部的距离
		const distanceToBottom = scrollHeight - scrollTop - viewHeight;

		// 当距离底部小于阈值时，自动加载下一页
		if (distanceToBottom < SCROLL_THRESHOLD) {
			console.log("[Products] 接近底部，自动加载更多");
			loadMore();
		}
	}, 100); // 100ms 节流
}

function onRefresh() {
	refreshing.value = true;
	loadProducts(true);
}

function getStatusText(status: number) {
	const map: Record<number, string> = {
		0: "下架",
		1: "在售",
		2: "已售",
	};
	return map[status] || "未知";
}

function goDetail(id: string) {
	uni.navigateTo({
		url: `/pages/market/detail?id=${id}`,
	});
}

function goPublish() {
	uni.navigateTo({
		url: "/pages/market/publish",
	});
}

function showActionSheet(product: Product) {
	const items = ["编辑", "分享", "删除"];
	if (product.status === 1) {
		items.unshift("下架");
	} else if (product.status === 0) {
		items.unshift("上架");
	} else if (product.status === 2) {
		items.unshift("重新上架");
	}

	uni.showActionSheet({
		itemList: items,
		success: (res) => {
			const action = items[res.tapIndex];
			handleAction(action, product);
		},
	});
}

function handleAction(action: string, product: Product) {
	switch (action) {
		case "编辑":
			uni.navigateTo({
				url: `/pages/market/publish?id=${product.id}`,
			});
			break;
		case "上架":
		case "重新上架":
			updateStatus(product.id, 1);
			break;
		case "下架":
			updateStatus(product.id, 0);
			break;
		case "删除":
			uni.showModal({
				title: "提示",
				content: "确定要删除该商品吗？",
				success: (res) => {
					if (res.confirm) {
						deleteProduct(product.id);
					}
				},
			});
			break;
		case "分享":
			// 分享功能
			shareManager.shareProduct(product).catch(() => {
				uni.showToast({ title: "分享失败", icon: "none" });
			});
			break;
	}
}

function updateStatus(id: string, status: number) {
	productApi
		.updateProductStatus(id, status)
		.then(() => {
			uni.showToast({ title: "操作成功", icon: "success" });
			loadProducts(true);
		})
		.catch(() => {});
}

function deleteProduct(id: string) {
	productApi
		.deleteProduct(id)
		.then(() => {
			uni.showToast({ title: "删除成功", icon: "success" });
			loadProducts(true);
		})
		.catch(() => {});
}
</script>

<style lang="scss" scoped>
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

// 指示器弹跳动画
@keyframes indicatorBounce {
	0% {
		transform: scaleX(0);
	}
	50% {
		transform: scaleX(1.2);
	}
	100% {
		transform: scaleX(1);
	}
}

.products-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-color-page);
	padding-bottom: env(safe-area-inset-bottom);
}

// Tab 栏
.tabs {
	display: flex;
	background: var(--bg-color-card);
	border-bottom: 1px solid var(--border-color-base);
	position: relative;
	opacity: 0;
	transform: translateY(-20rpx);

	&.tab-animate {
		animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24rpx 0;
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

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
}

// 内容区域动画
.scroll-view {
	height: calc(92vh - 100rpx);
	padding: var(--spacing-md);
	box-sizing: border-box;
	opacity: 0;
	transform: translateY(30rpx);

	&.content-animate {
		animation: pageSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
	}
}

.product-list {
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
}

.action-btn {
	display: flex;
	align-items: center;
}

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

	.publish-btn {
		width: 200rpx;
		height: 72rpx;
		background: var(--primary-color);
		color: var(--bg-color-card);
		font-size: var(--font-size-base);
		border-radius: 9999px;
		border: none;
		box-shadow: 0 8rpx 18rpx var(--primary-color-alpha-20);
	}
}

@keyframes emptyFadeIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes float {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10rpx);
	}
}

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

.no-more {
	text-align: center;
	padding: var(--spacing-xl);
	font-size: var(--font-size-sm);
	color: var(--text-color-tertiary);
}
</style>
