<template>
	<view class="order-list-page service-redesign-page" :style="themeStyle">
		<!-- 角色切换 -->
		<view class="role-tabs" :class="{ 'animate-in': isAnimated }">
			<view
				class="role-tab-item"
				:class="{ active: currentRole === 'buyer' }"
				@click="switchRole('buyer')"
			>
				<text class="role-tab-text">我买到的</text>
				<view v-if="currentRole === 'buyer'" class="role-tab-indicator" />
			</view>
			<view
				class="role-tab-item"
				:class="{ active: currentRole === 'seller' }"
				@click="switchRole('seller')"
			>
				<text class="role-tab-text">我卖出的</text>
				<view v-if="currentRole === 'seller'" class="role-tab-indicator" />
			</view>
		</view>

		<!-- Tab 切换 -->
		<view
			class="tabs animated-tabs page-animate"
			:class="{ 'animate-in': isAnimated }"
		>
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
			<!-- 滑动指示器背景 -->
			<view
				class="tab-slider"
				:style="{ transform: `translateX(${sliderPosition}%)` }"
			/>
		</view>

		<!-- 订单列表 -->
		<scroll-view
			class="scroll-view"
			:class="{ 'empty-scroll-view': orderList.length === 0 && !loading }"
			scroll-y
			:scroll-top="0"
			:scroll-with-animation="false"
			@scrolltolower="loadMore"
			@scroll="onScroll"
			:refresher-enabled="true"
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
		>
			<view v-if="orderList.length === 0 && !loading" class="empty-state">
				<image
					class="empty-image"
					src="/static/images/order.png"
					mode="aspectFit"
				/>
				<text class="empty-text">暂无订单</text>
			</view>

			<view v-else class="order-list" :class="{ 'list-transition': true }">
				<view
					v-for="(order, index) in orderList"
					:key="order.orderId || index"
					class="order-card animated-order-card"
					:style="{ animationDelay: Math.min(index * 80, 400) + 'ms' }"
					:class="{ 'card-enter': !refreshing }"
					@click="goDetail(order.orderId)"
				>
					<view class="order-header">
						<text class="order-no">订单号：{{ order.orderNo }}</text>
						<text class="order-status" :class="'status-' + order.status">{{
							getStatusText(order.status)
						}}</text>
					</view>

					<view class="product-info">
						<lazy-image
							class="product-image"
							:src="order.productImage"
							mode="aspectFit"
						/>
						<view class="product-detail">
							<text class="product-title">{{ order.productTitle }}</text>
							<text class="product-price">¥{{ order.price }}</text>
						</view>
					</view>

					<view class="order-info">
						<text class="info-item"
							>下单时间：{{ formatTime(order.createTime) }}</text
						>
						<text class="info-item"
							>交易地点：{{ order.location || "线上交易" }}</text
						>
					</view>

					<view class="order-actions">
						<!-- 买家：取消订单 -->
						<button
							v-if="order.status === 0 && order.isBuyer"
							class="action-btn secondary"
							size="mini"
							@click.stop="cancelOrder(order.orderId)"
						>
							取消订单
						</button>
						<!-- 卖家：确认订单 -->
						<button
							v-if="order.status === 0 && order.isSeller"
							class="action-btn primary"
							size="mini"
							@click.stop="confirmOrder(order.orderId)"
						>
							确认订单
						</button>
						<!-- 买家：确认收货 -->
						<button
							v-if="order.status === 1 && order.isBuyer"
							class="action-btn primary"
							size="mini"
							@click.stop="completeOrder(order.orderId)"
						>
							确认收货
						</button>
						<!-- 联系对方 -->
						<button
							v-if="order.status === 0 || order.status === 1"
							class="action-btn secondary"
							size="mini"
							@click.stop="contactUser(order)"
						>
							{{ order.isBuyer ? "联系卖家" : "联系买家" }}
						</button>
						<!-- 评价 -->
						<button
							v-if="order.status === 2"
							class="action-btn primary"
							size="mini"
							@click.stop="goEvaluate(order.orderId)"
						>
							评价/追评
						</button>
						<!-- 查看退款 -->
						<button
							v-if="order.status === 4"
							class="action-btn primary"
							size="mini"
							@click.stop="viewRefund(order.orderId)"
						>
							查看退款
						</button>
					</view>
				</view>
			</view>

			<view v-if="loading" class="loading">
				<uni-icons type="spinner-cycle" size="20" :color="primaryColor" />
				<text class="loading-text">加载中...</text>
			</view>

			<view v-if="noMore" class="no-more">没有更多了</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { orderApi } from "@/api/order";
import { evaluationApi } from "@/api/evaluation";
import { formatDateTime } from "@/utils/date";
import { useServiceNavigation } from "@/composables/useServiceNavigation";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import { useUserStore } from "@/store/user";
import { useThemeStyle, useThemeColors, useThemePage } from "@/utils/theme";
import { onShow } from "@dcloudio/uni-app";
import { checkAuth } from "@/utils/auth";

// 获取用户 store
const userStore = useUserStore();

// 主题相关
const { themeStyle } = useThemeStyle();
const { primaryColor } = useThemeColors();

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation();

interface Order {
	orderId: string; // 后端字段名是 orderId，使用 string 避免 JavaScript 大整数精度丢失
	orderNo: string;
	productId: string;
	productTitle: string;
	productImage: string;
	price: number;
	status: number;
	location: string;
	isBuyer: boolean;
	isSeller?: boolean;
	buyerId?: string;
	sellerId?: string;
	createTime: string;
}

const tabs = [
	{ label: "全部", value: "all" },
	{ label: "待确认", value: "0" },
	{ label: "进行中", value: "1" },
	{ label: "已完成", value: "2" },
	{ label: "已取消", value: "3" },
];

const currentTab = ref("all");
const currentRole = ref<"buyer" | "seller">("buyer"); // 当前角色：buyer-买家，seller-卖家
const isAnimated = ref(false);
const orderList = ref<Order[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 20;
const role = ref(0); // 0-买家 1-卖家，对应后端API
const sliderPosition = ref(0); // 滑动指示器位置

// 自动滚动加载相关
const SCROLL_THRESHOLD = 100; // 距离底部100px时触发加载
let scrollTimer: number | null = null;

function ensureOrderAuth() {
	return checkAuth({
		showTip: true,
		tipText: "请先登录后查看订单",
		showAuthGuide: true,
		guideTitle: "登录后可查看订单",
		guideContent: "订单包含你的交易信息，请先登录或注册账号。",
	});
}

onShow(() => {
	useThemePage();

	if (!ensureOrderAuth()) {
		return;
	}
});

onMounted(() => {
	if (!ensureOrderAuth()) {
		return;
	}

	// 从URL参数获取role（如果有的话），否则默认为买家
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1] as any;
	const options = currentPage.options || {};
	const urlRole = parseInt(options.role);
	// 根据URL参数设置默认角色，如果没有则默认为买家
	if (urlRole === 1) {
		currentRole.value = "seller";
	} else {
		currentRole.value = "buyer";
	}
	role.value = currentRole.value === "buyer" ? 0 : 1;

	loadOrders();

	// 初始化滑动指示器位置（默认在"全部"tab）
	sliderPosition.value = 0;

	// 触发页面进入动画
	setTimeout(() => {
		isAnimated.value = true;
	}, 50);
});

// 切换角色（买家/卖家）
function switchRole(newRole: "buyer" | "seller") {
	if (currentRole.value === newRole) return;
	currentRole.value = newRole;
	role.value = newRole === "buyer" ? 0 : 1;
	loadOrders(true); // 切换角色时重新加载数据
}

function switchTab(value: string) {
	currentTab.value = value;
	// 更新滑动指示器位置
	const tabIndex = tabs.findIndex((tab) => tab.value === value);
	sliderPosition.value = tabIndex * 20; // 每个tab占20%
	loadOrders(true);
}

function loadOrders(refresh = false) {
	if (loading.value) return;

	if (refresh) {
		page.value = 1;
		noMore.value = false;
	}

	loading.value = true;

	// 根据 tab 获取对应状态的订单
	let status: number | undefined;
	if (currentTab.value !== "all") {
		status = parseInt(currentTab.value);
	}

	orderApi
		.getOrderList({
			status,
			role: role.value,
			page: page.value,
			size: pageSize,
		})
		.then((res: any) => {
			console.log("[OrderList] Response:", res);
			console.log("[OrderList] res.data:", res.data);

			// 获取当前用户ID（转为字符串进行比较）
			const currentUserId = String(
				userStore.userInfo?.userId || userStore.userInfo?.id || ""
			);

			// 确保 list 是一个数组
			const list = Array.isArray(res.data?.list) ? res.data.list : [];
			const total = res.data?.total || 0;

			// 归一化订单字段，避免状态/角色因类型或用户信息未就绪导致按钮误隐藏
			const listWithIsBuyer = list.map((order: any) => {
				const normalizedStatus = Number(order.status);
				const isBuyerById = String(order.buyerId) === currentUserId;
				const isSellerById = String(order.sellerId) === currentUserId;

				return {
					...order,
					productTitle:
						order.productTitle || order.productName || "未知商品",
					productImage:
						order.productImage || order.coverImage || order.productCover || "",
					price:
						order.price ?? order.unitPrice ?? order.totalPrice ?? order.totalAmount ?? 0,
					location: order.location || order.address || "",
					status: Number.isNaN(normalizedStatus) ? order.status : normalizedStatus,
					isBuyer: isBuyerById || role.value === 0,
					isSeller: isSellerById || role.value === 1,
				};
			});

			console.log("[OrderList] 订单列表:", listWithIsBuyer);
			console.log("[OrderList] 总数量:", total, "当前页:", page.value);

			if (refresh) {
				orderList.value = listWithIsBuyer;
			} else {
				orderList.value = [...orderList.value, ...listWithIsBuyer];
			}

			// 根据总数判断是否还有更多数据
			noMore.value = orderList.value.length >= total;
		})
		.finally(() => {
			loading.value = false;
			refreshing.value = false;
		});
}

function loadMore() {
	if (!loading.value && !noMore.value) {
		page.value++;
		loadOrders();
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
			console.log("[OrderList] 接近底部，自动加载更多");
			loadMore();
		}
	}, 100); // 100ms 节流
}

function onRefresh() {
	refreshing.value = true;
	loadOrders(true);
}

function getStatusText(status: number) {
	const map: Record<number, string> = {
		0: "待确认",
		1: "进行中",
		2: "已完成",
		3: "已取消",
		4: "退款中",
	};
	return map[status] || "未知";
}

function formatTime(time: string) {
	return formatDateTime(time, "YYYY-MM-DD HH:mm");
}

function goDetail(id: string | undefined) {
	// 验证 id 是否有效
	if (!id) {
		console.error("[订单列表] 订单ID无效:", id);
		uni.showToast({
			title: "订单ID不存在",
			icon: "none",
		});
		return;
	}

	// 验证字符串
	if (id === "undefined" || id === "null") {
		console.error("[订单列表] 订单ID无效:", id);
		uni.showToast({
			title: "订单ID不存在",
			icon: "none",
		});
		return;
	}

	console.log("[订单列表] 跳转到订单详情，ID:", id);
	uni.navigateTo({
		url: `/pages/order/detail?id=${id}`,
	});
}

function confirmOrder(id: string) {
	const targetOrder = orderList.value.find((item) => item.orderId === id);
	if (!targetOrder?.isSeller) {
		uni.showToast({
			title: "仅卖家可确认订单",
			icon: "none",
		});
		return;
	}

	uni.showModal({
		title: "确认订单",
		content: "确认接受该订单吗？",
		success: (res) => {
			if (res.confirm) {
				orderApi
					.confirmOrder(id)
					.then(() => {
						uni.showToast({ title: "已确认", icon: "success" });
						loadOrders(true);
					})
					.catch(() => {});
			}
		},
	});
}

function cancelOrder(id: string) {
	const targetOrder = orderList.value.find((item) => item.orderId === id);
	if (!targetOrder?.isBuyer) {
		uni.showToast({
			title: "仅买家可取消订单",
			icon: "none",
		});
		return;
	}

	uni.showModal({
		title: "取消订单",
		content: "确定要取消该订单吗？",
		success: (res) => {
			if (res.confirm) {
				orderApi
					.cancelOrder(id)
					.then(() => {
						uni.showToast({ title: "已取消", icon: "success" });
						loadOrders(true);
					})
					.catch(() => {});
			}
		},
	});
}

function completeOrder(id: string) {
	const targetOrder = orderList.value.find((item) => item.orderId === id);
	if (!targetOrder?.isBuyer) {
		uni.showToast({
			title: "仅买家可确认收货",
			icon: "none",
		});
		return;
	}

	uni.showModal({
		title: "确认收货",
		content: "确认已完成交易吗？",
		success: (res) => {
			if (res.confirm) {
				orderApi
					.completeOrder(id)
					.then(() => {
						uni.showToast({ title: "交易完成", icon: "success" });
						loadOrders(true);
					})
					.catch(() => {});
			}
		},
	});
}

function contactUser(order: Order) {
	// 获取对方的用户ID：如果是买家则联系卖家，如果是卖家则联系买家
	const otherUserId = order.isBuyer ? order.sellerId : order.buyerId;
	if (!otherUserId) {
		uni.showToast({
			title: "无法获取用户信息",
			icon: "none",
		});
		return;
	}
	// 传递订单ID，创建关联订单的会话
	uni.navigateTo({
		url: `/pages/message/chat?userId=${otherUserId}&orderId=${order.orderId}`,
	});
}

async function goEvaluate(orderId: string) {
	try {
		const res: any = await evaluationApi.getEvaluationByOrder(orderId);
		const data = res?.data || res || {};
		const list = data.list || data.records || [];
		const evaluation = list[0];

		if (!evaluation) {
			uni.navigateTo({
				url: `/pages/order/evaluate?orderId=${orderId}`,
			});
			return;
		}

		const currentUserId = String(userStore.userInfo?.userId || "");
		const evaluatorId = String(evaluation.fromUserId || evaluation.evaluatorId || "");
		const hasAppend = !!(evaluation.hasAppend || evaluation.appendTime || evaluation.appendContent);

		if (currentUserId && evaluatorId === currentUserId && !hasAppend) {
			uni.navigateTo({
				url: `/pages/order/evaluate?orderId=${orderId}&mode=append&evalId=${evaluation.id || evaluation.evaluationId}`,
			});
			return;
		}

		uni.showToast({ title: hasAppend ? "该订单已完成评价" : "该订单已评价", icon: "none" });
	} catch (error) {
		uni.navigateTo({
			url: `/pages/order/evaluate?orderId=${orderId}`,
		});
	}
}

function viewRefund(orderId: string) {
	uni.navigateTo({
		url: `/pages/order/refund?orderId=${orderId}`,
	});
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

// 页面动画样式
.page-animate {
	opacity: 0;
	transform: translateY(30rpx);

	&.animate-in {
		animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
}

.order-list-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-color-page);
	padding-bottom: env(safe-area-inset-bottom);
}

// 角色切换样式
.role-tabs {
	display: flex;
	background: var(--bg-color-card);
	border-bottom: 1px solid var(--border-color-base);
	position: relative;
	z-index: 3;
	margin-bottom: 12rpx;

	.role-tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24rpx 0 20rpx;
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

		&::after {
			content: "";
			position: absolute;
			top: 18rpx;
			left: 50%;
			width: 88rpx;
			height: 44rpx;
			transform: translateX(-50%);
			background: linear-gradient(
				180deg,
				var(--primary-color-alpha-10) 0%,
				transparent 100%
			);
			border-radius: 9999px;
			opacity: 0;
			transition: opacity 0.25s ease;
		}

		.role-tab-text {
			font-size: 15px;
			font-weight: 500;
			color: var(--text-color-secondary);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			position: relative;
			z-index: 1;
		}

		&.active .role-tab-text {
			color: var(--primary-color);
			font-weight: 600;
		}

		&.active::after {
			opacity: 1;
		}

		.role-tab-indicator {
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

.page-header {
	background: var(--bg-color-card);
	padding: var(--spacing-md) var(--spacing-lg);
	border-bottom: 1px solid var(--border-color-base);

	.page-title {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-color-primary);
	}
}

.tabs {
	display: flex;
	background: var(--bg-color-card);
	border-bottom: 1px solid var(--border-color-base);
	position: relative;

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
		}
	}

	.tab-slider {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 20%;
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

.scroll-view {
	height: calc(
		92vh - 180rpx
	); // 固定高度，确保 scrolltolower 能正确触发（减去角色栏和状态栏的高度）
	width: 100%;
	box-sizing: border-box;
	padding: var(--spacing-md);

	&.empty-scroll-view {
		background: var(--bg-color-card);
	}
}

.order-list {
	.order-card {
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

		// 卡片悬停效果
		&:active {
			transform: scale(0.98);
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
		}

		// 点击涟漪效果
		&::before {
			content: "";
			position: absolute;
			top: 50%;
			left: 50%;
			width: 0;
			height: 0;
			border-radius: 50%;
			background: var(--primary-color-alpha-10);
			transform: translate(-50%, -50%);
			transition: width 0.6s ease, height 0.6s ease;
			pointer-events: none;
		}

		&:active::before {
			width: 400rpx;
			height: 400rpx;
		}

		.order-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding-bottom: var(--spacing-sm);
			border-bottom: 1px solid var(--border-color-light);
			margin-bottom: var(--spacing-sm);

			.order-no {
				font-size: var(--font-size-sm);
				color: var(--text-color-tertiary);
			}

			.order-status {
				font-size: var(--font-size-base);
				font-weight: 500;

				&.status-0 {
					color: var(--primary-color);
				}

				&.status-1 {
					color: var(--info-color);
				}

				&.status-2 {
					color: var(--success-color);
				}

				&.status-3 {
					color: var(--text-color-tertiary);
				}

				&.status-4 {
					color: var(--error-color);
				}
			}
		}

		.product-info {
			display: flex;
			margin-bottom: var(--spacing-sm);

			.product-image {
				width: 160rpx;
				height: 160rpx;
				border-radius: var(--border-radius-base);
				margin-right: var(--spacing-sm);
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

				&:active {
					transform: scale(0.95);
				}
			}

			.product-detail {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: space-between;

				.product-title {
					font-size: var(--font-size-base);
					color: var(--text-color-primary);
					line-height: 1.4;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					max-width: 100%;
				}

				.product-price {
					font-size: var(--font-size-xl);
					font-weight: 600;
					color: var(--error-color);
				}
			}
		}

		.order-info {
			margin-bottom: var(--spacing-sm);

			.info-item {
				display: block;
				font-size: var(--font-size-sm);
				color: var(--text-color-tertiary);
				margin-bottom: var(--spacing-xs);

				&:last-child {
					margin-bottom: 0;
				}
			}
		}

		.order-actions {
			display: flex;
			justify-content: flex-end;
			gap: var(--spacing-sm);

			.action-btn {
				min-width: 140rpx;
				height: 56rpx;
				line-height: 56rpx;
				border-radius: 9999px;
				font-size: var(--font-size-base);
				border: none;
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
				position: relative;
				overflow: hidden;

				&::before {
					content: "";
					position: absolute;
					top: 50%;
					left: 50%;
					width: 0;
					height: 0;
					border-radius: 50%;
					background: rgba(255, 255, 255, 0.3);
					transform: translate(-50%, -50%);
					transition: width 0.5s ease, height 0.5s ease;
				}

				&:active::before {
					width: 200rpx;
					height: 200rpx;
				}

				&.secondary {
					background: var(--bg-color-card);
					color: var(--text-color-secondary);
					border: 1px solid #d9d9d9;

					&:active {
						transform: scale(0.92);
						background: var(--bg-color-page);
					}
				}

				&.primary {
					background: var(--primary-color);
					color: var(--bg-color-card);
					box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);

					&:active {
						transform: scale(0.92);
						box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-20);
					}
				}
			}
		}
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;

	.empty-image {
		width: 240rpx;
		height: 240rpx;
		margin-bottom: var(--spacing-md);
	}

	.empty-text {
		font-size: var(--font-size-base);
		color: var(--text-color-tertiary);
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

// Tab 栏动画
.animated-tabs {
	opacity: 0;
	animation: slideDownFade 0.4s ease-out forwards;
}

// 订单卡片动画
.animated-order-card {
	opacity: 0;
	animation: slideInUpFade 0.5s ease-out forwards;

	&.card-enter {
		animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
}

// 向下滑入淡入动画（Tab 栏）
@keyframes slideDownFade {
	from {
		opacity: 0;
		transform: translateY(-20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 向上滑入淡入动画（订单卡片）
@keyframes slideInUpFade {
	from {
		opacity: 0;
		transform: translateY(40rpx);
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

// 订单卡片入场动画增强
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

// 加载旋转动画
@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

// 脉冲动画
@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

// 加载更多淡入动画
@keyframes loadingFadeIn {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 订单列表容器动画
.order-list {
	// 容器淡入动画
	animation: fadeInScale 0.3s ease-out 0.2s forwards;
	opacity: 0;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&.list-transition {
		animation: fadeInScale 0.3s ease-out forwards;
	}
}

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

// 空状态动画
.empty-state {
	opacity: 0;
	animation: emptyFadeIn 0.5s ease-out 0.3s forwards;

	.empty-image {
		animation: float 3s ease-in-out infinite;
	}
}

// 浮动动画
@keyframes float {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10rpx);
	}
}

// 状态标签脉冲动画
.order-status {
	&.status-0 {
		animation: statusPulse 2s ease-in-out infinite;
	}
}

@keyframes statusPulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.7;
	}
}

// 刷新动画
@keyframes refreshRotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
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

// 按钮点击效果
.action-btn {
	transition: transform 0.1s ease, box-shadow 0.2s ease;

	&:active {
		transform: scale(0.95);
	}
}

// 加载状态动画
.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-xl);
	animation: loadingFadeIn 0.3s ease-out;

	.loading-text {
		margin-left: var(--spacing-sm);
		font-size: var(--font-size-sm);
		color: var(--text-color-tertiary);
		animation: pulse 1.5s ease-in-out infinite;
	}
}

// "没有更多"提示动画
.no-more {
	text-align: center;
	padding: var(--spacing-xl);
	font-size: var(--font-size-sm);
	color: var(--text-color-tertiary);
	animation: loadingFadeIn 0.3s ease-out;
}

// 刷新状态动画
.scroll-view {
	&[style*="refresher-triggered: true"] {
		.order-list {
			animation: fadeInScale 0.3s ease-out;
		}
	}
}

// 订单卡片悬停增强
.order-card {
	&:hover {
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
		transform: translateY(-4rpx);
	}
}
</style>
