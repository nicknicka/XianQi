<template>
	<view class="services-page service-redesign-page">
		<!-- 页面标题 -->
		<view class="page-header" :class="{ 'header-animate': pageVisible }">
			<text class="page-title">全部服务</text>
		</view>

		<!-- 服务分类 -->
		<view class="service-categories">
			<view
				v-for="(category, index) in serviceCategories"
				:key="index"
				class="category-section"
				:class="{ 'category-animate': pageVisible }"
				:style="{ 'animation-delay': index * 0.1 + 's' }"
			>
				<view class="category-header">
					<view class="category-icon" :style="{ background: category.color }">
						<uni-icons :type="category.icon" size="20" color="#fff" />
					</view>
					<text class="category-title">{{ category.title }}</text>
				</view>

				<view class="service-grid">
					<view
						v-for="(service, sIndex) in category.services"
						:key="service.id"
						class="service-item"
						:class="{ 'service-animate': pageVisible }"
						:style="{ 'animation-delay': index * 0.1 + sIndex * 0.03 + 's' }"
						@click="handleService(service)"
					>
						<view class="service-icon-wrap">
							<view
								class="service-icon"
								:style="{ background: service.iconBg }"
							>
								<uni-icons
									:type="service.icon"
									size="24"
									:color="service.iconColor"
								/>
							</view>
							<view class="service-badge" v-if="service.badge">
								<text class="badge-text">{{ service.badge }}</text>
							</view>
						</view>
						<text class="service-name">{{ service.name }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 常见问题 -->
		<view class="faq-section" :class="{ 'faq-animate': pageVisible }">
			<view class="faq-header">
				<text class="faq-title">常见问题</text>
			</view>
			<view class="faq-list">
				<view
					v-for="(item, index) in faqList"
					:key="index"
					class="faq-item"
					:class="{ 'faq-item-animate': pageVisible }"
					:style="{ 'animation-delay': 0.4 + index * 0.08 + 's' }"
					@click="handleFaq(item)"
				>
					<view class="faq-left">
						<uni-icons type="help-filled" size="18" :color="primaryColor" />
						<text class="faq-question">{{ item.question }}</text>
					</view>
					<uni-icons type="right" size="14" color="#C0C0C0" />
				</view>
			</view>
		</view>

		<!-- 联系客服 -->
		<view class="contact-section" :class="{ 'contact-animate': pageVisible }">
			<view class="contact-card" @click="contactService">
				<view class="contact-left">
					<view class="contact-icon">
						<uni-icons
							type="chatbubble-filled"
							size="24"
							:color="primaryColor"
						/>
					</view>
					<view class="contact-info">
						<text class="contact-title">联系客服</text>
						<text class="contact-desc">有问题随时联系我们</text>
					</view>
				</view>
				<uni-icons type="right" size="14" color="#C0C0C0" />
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { navigateFromService } from "@/composables/useServiceNavigation";
import { useThemeColors, useThemePage, useThemeStyle } from "@/utils/theme";
import { onShow } from "@dcloudio/uni-app";

const { primaryColor } = useThemeColors();
const { themeStyle } = useThemeStyle();

// 页面入场动画状态
const pageVisible = ref(false);

onShow(() => {
	useThemePage();
});

onMounted(() => {
	// 触发页面入场动画
	setTimeout(() => {
		pageVisible.value = true;
	}, 50);
});

interface Service {
	id: string;
	name: string;
	icon: string;
	iconBg: string;
	iconColor: string;
	route?: string;
	action?: string;
	badge?: string;
}

interface ServiceCategory {
	title: string;
	icon: string;
	color: string;
	services: Service[];
}

interface Faq {
	question: string;
	answer: string;
}

// 服务分类
const serviceCategories = ref<ServiceCategory[]>([
	{
		title: "交易服务",
		icon: "shop",
		color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		services: [
			{
				id: "products",
				name: "我发布的",
				icon: "shop",
				iconBg: "linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)",
				iconColor: "#FFA000",
				route: "/pages/mine/products",
			},
			{
				id: "sold",
				name: "我卖出的",
				icon: "wallet-filled",
				iconBg: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
				iconColor: "#7B1FA2",
				route: "/pages/order/list",
			},
			{
				id: "evaluations",
				name: "我的评价",
				icon: "star-filled",
				iconBg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
				iconColor: "#4CAF50",
				route: "/pages/mine/evaluations",
			},
			{
				id: "refund",
				name: "退款/售后",
				icon: "refresh",
				iconBg: "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)",
				iconColor: "#D32F2F",
				route: "/pages/mine/refund",
			},
		],
	},
	{
		title: "共享服务",
		icon: "loop",
		color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
			services: [
				{
					id: "my-share",
					name: "共享物品",
					icon: "shop",
					iconBg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
					iconColor: "#4CAF50",
					route: "/pages/share/my-share",
				},
				{
					id: "bookings",
					name: "共享管理",
				icon: "loop",
				iconBg: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
				iconColor: "#1976D2",
				route: "/pages/share/bookings",
			},
			{
				id: "deposit",
				name: "押金管理",
				icon: "wallet",
				iconBg: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
				iconColor: "#FF9800",
				route: "/pages/share/deposit",
			},
			{
				id: "transfer",
				name: "一键转赠",
				icon: "redo",
				iconBg: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)",
				iconColor: "#E91E63",
				route: "/pages/share/transfer",
			},
		],
	},
	{
		title: "常用工具",
		icon: "gear",
		color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
		services: [
			{
				id: "favorites",
				name: "我的收藏",
				icon: "heart-filled",
				iconBg: "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)",
				iconColor: "#E91E63",
				route: "/pages/mine/favorites",
			},
			{
				id: "history",
				name: "浏览历史",
				icon: "calendar",
				iconBg: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
				iconColor: "#FF9800",
				route: "/pages/mine/history",
			},
			{
				id: "address",
				name: "收货地址",
				icon: "location-filled",
				iconBg: "linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)",
				iconColor: "#03A9F4",
				route: "/pages/mine/address",
			},
			{
				id: "blacklist",
				name: "黑名单",
				icon: "eye-slash",
				iconBg: "linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)",
				iconColor: "#757575",
				route: "/pages/mine/blacklist",
			},
		],
	},
	{
		title: "账号安全",
		icon: "locked",
		color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
		services: [
			{
				id: "verification",
				name: "身份认证",
				icon: "checkmarkempty",
				iconBg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
				iconColor: "#4CAF50",
				route: "/pages/mine/auth-center",
			},
			{
				id: "security",
				name: "账号安全",
				icon: "locked",
				iconBg: "linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)",
				iconColor: "#03A9F4",
				route: "/pages/mine/security",
			},
		],
	},
	{
		title: "更多服务",
		icon: "more-filled",
		color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
		services: [
			{
				id: "coupons",
				name: "优惠券",
				icon: "gift",
				iconBg: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
				iconColor: "#F57C00",
				route: "/pages/mine/coupons",
				badge: "3",
			},
			{
				id: "quick-reply",
				name: "快捷回复",
				icon: "chat",
				iconBg: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
				iconColor: "#9C27B0",
				route: "/pages/message/quick-reply",
			},
			{
				id: "feedback",
				name: "意见反馈",
				icon: "chatbubble-filled",
				iconBg: "linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)",
				iconColor: "#FFA000",
				route: "/pages/mine/feedback",
			},
			{
				id: "about",
				name: "关于我们",
				icon: "info-filled",
				iconBg: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
				iconColor: "#4CAF50",
				route: "/pages/mine/about",
			},
		],
	},
]);

// 常见问题
const faqList = ref<Faq[]>([
	{
		question: "如何发布商品？",
		answer: '点击交易市场的"+"按钮，选择发布商品，填写商品信息后即可发布。',
	},
	{
		question: "如何申请退款？",
		answer: "在订单详情页点击申请退款，填写退款原因和金额，等待卖家处理。",
	},
	{
		question: "如何进行身份认证？",
		answer:
			"在全部服务中点击身份认证，分别完成实名认证和学生认证，享受更多平台权益。",
	},
	{
		question: "交易安全吗？",
		answer: "平台提供担保交易，买家确认收货后才将款项转给卖家，保障交易安全。",
	},
]);

// 处理服务点击
function handleService(service: Service) {
	if (service.route) {
		// 使用服务页面导航，确保子页面返回到服务页面
		navigateFromService(service.route);
	} else if (service.action) {
		handleServiceAction(service.action);
	}
}

// 处理服务操作
function handleServiceAction(action: string) {
	switch (action) {
		case "share":
			uni.showToast({
				title: "分享功能开发中",
				icon: "none",
			});
			break;
		case "contact":
			contactService();
			break;
		default:
			break;
	}
}

// 处理常见问题
function handleFaq(item: Faq) {
	uni.showModal({
		title: item.question,
		content: item.answer,
		showCancel: false,
		confirmText: "我知道了",
	});
}

// 联系客服
function contactService() {
	uni.showActionSheet({
		itemList: ["在线客服", "电话客服"],
		success: (res) => {
			if (res.tapIndex === 0) {
				// 在线客服
				uni.navigateTo({
					url: "/pages/message/chat",
				});
			} else if (res.tapIndex === 1) {
				// 电话客服
				uni.makePhoneCall({
					phoneNumber: "400-123-4567",
				});
			}
		},
	});
}
</script>

<style lang="scss" scoped>
.services-page {
	min-height: 100vh;
	background: var(--bg-color-page);
	padding-bottom: env(safe-area-inset-bottom);
}

.page-header {
	padding: 24rpx 32rpx;
	background: var(--bg-color-card);
}

.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: var(--text-color-primary);
}

.service-categories {
	padding: 24rpx;
}

.category-section {
	background: var(--bg-color-card);
	border-radius: 20rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.category-header {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 24rpx 28rpx;
	border-bottom: 1rpx solid var(--border-color-light);
}

.category-icon {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 14rpx;
}

.category-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-color-primary);
}

.service-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	padding: 28rpx 20rpx;
	gap: 20rpx 0;
}

.service-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
}

.service-icon-wrap {
	position: relative;
}

.service-icon {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.06);
}

.service-badge {
	position: absolute;
	top: -8rpx;
	right: -8rpx;
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	background: var(--danger-color);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid var(--bg-color-card);
}

.badge-text {
	font-size: 18rpx;
	font-weight: 600;
	color: var(--bg-color-card);
	line-height: 1;
}

.service-name {
	font-size: 22rpx;
	color: var(--text-color-secondary);
	text-align: center;
}

.faq-section {
	margin: 0 24rpx 24rpx;
	background: var(--bg-color-card);
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.faq-header {
	padding: 24rpx 28rpx;
	border-bottom: 1rpx solid var(--border-color-light);
}

.faq-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-color-primary);
}

.faq-list {
	padding: 0 16rpx;
}

.faq-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 12rpx;
	border-bottom: 1rpx solid var(--border-color-light);

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background: var(--bg-color-hover);
		margin: 0 -16rpx;
		padding: 24rpx 28rpx;
	}
}

.faq-left {
	display: flex;
	align-items: center;
	gap: 16rpx;
	flex: 1;
}

.faq-question {
	font-size: 26rpx;
	color: var(--text-color-primary);
}

.contact-section {
	margin: 0 24rpx 24rpx;
}

.contact-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx;
	background: linear-gradient(135deg, #fff8f0 0%, #fff 100%);
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx var(--primary-color-alpha-10);
}

.contact-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.contact-icon {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, var(--primary-color) 0%, #ff8f00 100%);
	border-radius: 16rpx;
}

.contact-info {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.contact-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text-color-primary);
}

.contact-desc {
	font-size: 22rpx;
	color: var(--text-color-tertiary);
}

/* ========== 页面入场动画 ========== */

/* 页面标题动画 */
.page-header {
	opacity: 0;
	transform: translateY(-30rpx);

	&.header-animate {
		animation: slideDownFadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
}

/* 服务分类卡片动画 */
.category-section {
	opacity: 0;
	transform: translateY(40rpx) scale(0.95);

	&.category-animate {
		animation: slideUpScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
}

/* 服务项动画 */
.service-item {
	opacity: 0;
	transform: scale(0.8) translateY(20rpx);

	&.service-animate {
		animation: servicePop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
	}
}

/* 常见问题区域动画 */
.faq-section {
	opacity: 0;
	transform: translateX(30rpx);

	&.faq-animate {
		animation: slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
	}
}

/* FAQ 列表项动画 */
.faq-item {
	opacity: 0;
	transform: translateX(20rpx);

	&.faq-item-animate {
		animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
}

/* 联系客服卡片动画 */
.contact-section {
	opacity: 0;
	transform: translateY(30rpx);

	&.contact-animate {
		animation: slideUpFade 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
	}
}

/* 标题下滑淡入动画 */
@keyframes slideDownFadeIn {
	0% {
		opacity: 0;
		transform: translateY(-30rpx);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 分类卡片上滑缩放动画 */
@keyframes slideUpScale {
	0% {
		opacity: 0;
		transform: translateY(40rpx) scale(0.95);
	}
	60% {
		transform: translateY(-5rpx) scale(1.02);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

/* 服务项弹出动画 */
@keyframes servicePop {
	0% {
		opacity: 0;
		transform: scale(0.8) translateY(20rpx);
	}
	60% {
		transform: scale(1.05) translateY(-5rpx);
	}
	100% {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

/* 右侧滑入动画 */
@keyframes slideInRight {
	0% {
		opacity: 0;
		transform: translateX(30rpx);
	}
	100% {
		opacity: 1;
		transform: translateX(0);
	}
}

/* 上滑淡入动画 */
@keyframes slideUpFade {
	0% {
		opacity: 0;
		transform: translateY(30rpx);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 服务图标悬停效果 */
.service-item {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);

		.service-icon {
			transform: scale(0.95);
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		}
	}
}

.service-icon {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.95);
	}
}

/* 分类标题动画 */
.category-title {
	transition: all 0.3s ease;
}

/* 徽章动画 */
.service-badge {
	animation: badgePop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
	animation-delay: inherit;
}

@keyframes badgePop {
	0% {
		opacity: 0;
		transform: scale(0);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}

/* 联系卡片渐变背景动画 */
.contact-card {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:active {
		transform: scale(0.98);
		box-shadow: 0 6rpx 20rpx var(--primary-color-alpha-15);
	}
}

/* FAQ 项悬停效果 */
.faq-item {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
