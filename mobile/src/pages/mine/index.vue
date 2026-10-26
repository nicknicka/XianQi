<template>
	<view class="mine-page" :style="themeStyle">
		<!-- 滚动容器 -->
		<scroll-view
			class="scroll-container"
			scroll-y
			@scroll="onScroll"
			:scroll-with-animation="true"
			:style="scrollViewStyle"
		>
			<!-- 用户信息头部 -->
			<view class="user-header" :style="{ paddingTop: statusBarHeight + 'px' }">
				<!-- 背景装饰 -->
				<view
					class="header-bg"
					:style="{
						transform: `translateY(${headerTranslateY}px) scale(${bgScale})`,
					}"
				>
					<view class="bg-gradient"></view>
					<view class="bg-circle circle-1"></view>
					<view class="bg-circle circle-2"></view>
					<view class="bg-circle circle-3"></view>
					<view class="bg-particle particle-1"></view>
					<view class="bg-particle particle-2"></view>
				</view>

				<!-- 顶部操作栏 -->
				<view class="header-actions header-actions-animate">
					<!-- 返回按钮 - 仅在非 tabBar 进入时显示 -->
					<view
						v-if="showBackButton"
						class="back-btn animate-btn"
						@click="goBack"
					>
						<uni-icons type="left" size="22" color="#fff" />
					</view>
					<view class="action-btn-spacer"></view>
					<!-- 通知按钮 - 向下偏移避开小程序胶囊 -->
					<view
						class="notification-btn animate-btn notification-btn-safe"
						@click="goNotifications"
					>
						<uni-icons type="notification" size="22" color="#fff" />
						<view class="notification-dot" v-if="unreadCount > 0">
							<view class="dot-core"></view>
						</view>
					</view>
				</view>

				<!-- 用户信息卡片 -->
				<view class="user-card" @click="handleUserCardClick">
					<view class="avatar-container" @click.stop="handleChangeAvatar">
						<UserAvatar
							:src="userStore.avatar"
							size="lg"
							shape="circle"
							:show-online="true"
							:is-online="isOnline"
							:clickable="true"
							custom-style="width: 112rpx; height: 112rpx;"
						/>
						<view class="avatar-edit-badge" v-if="userStore.isLogin">
							<uni-icons type="camera" size="12" color="#fff"></uni-icons>
						</view>
					</view>

					<view class="user-info">
						<view class="nickname-row">
							<text class="nickname">{{
								userStore.nickname || "未登录"
							}}</text>
							<view class="level-badge" :class="'level-' + creditLevel">
								<uni-icons
									type="star-filled"
									size="10"
									:color="warningColor"
								/>
								<text class="level-text">{{ creditLevelText }}</text>
							</view>
						</view>
						<view class="user-meta">
							<text class="user-id"
								>ID: {{ displayUserId }}</text
							>
							<text class="divider">|</text>
							<view class="credit-info">
								<uni-icons type="medal" size="12" :color="warningColor" />
								<text class="credit-score"
									>{{
										displayCreditScore
									}}信用分</text
								>
							</view>
						</view>
						<view class="user-tags" v-if="userTags.length > 0">
							<view
								class="tag animate-tag"
								v-for="(tag, index) in userTags"
								:key="index"
								:style="{ '--tag-index': index }"
							>
								<text class="tag-text">{{ tag }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 快捷统计卡片 -->
			<view
				class="quick-stats section-animate"
				:class="{ 'section-visible': sectionAnimationStates.quickStats }"
			>
				<view class="stat-item" @click="goProducts">
					<view class="stat-icon-wrap">
						<view class="stat-icon" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)">
							<uni-icons type="shop" size="18" color="#fff" />
						</view>
					</view>
					<view class="stat-content">
						<text class="stat-num">{{ stats.publishCount || 0 }}</text>
						<text class="stat-label">发布</text>
					</view>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item" @click="goOrders">
					<view class="stat-icon-wrap">
						<view class="stat-icon" style="background: linear-gradient(135deg, var(--danger-color) 0%, var(--danger-color) 100%)">
							<uni-icons type="list" size="18" color="#fff" />
						</view>
					</view>
					<view class="stat-content">
						<text class="stat-num">{{ stats.orderCount || 0 }}</text>
						<text class="stat-label">订单</text>
					</view>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item" @click="goFollowing">
					<view class="stat-icon-wrap">
						<view class="stat-icon" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--warning-color) 100%)">
							<uni-icons type="personadd" size="18" color="#fff" />
						</view>
					</view>
					<view class="stat-content">
						<text class="stat-num">{{ stats.followingCount || 0 }}</text>
						<text class="stat-label">关注</text>
					</view>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item" @click="goFollowers">
					<view class="stat-icon-wrap">
						<view class="stat-icon" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%)">
							<uni-icons type="person-filled" size="18" color="#fff" />
						</view>
					</view>
					<view class="stat-content">
						<text class="stat-num">{{ stats.followerCount || 0 }}</text>
						<text class="stat-label">粉丝</text>
					</view>
				</view>
			</view>

			<!-- 我的服务 -->
			<view
				class="section-card service-section section-animate"
				:class="{ 'section-visible': sectionAnimationStates.services }"
			>
				<view class="section-header">
					<view class="section-title-wrap">
						<view class="title-icon"></view>
						<text class="section-title">我的服务</text>
					</view>
					<view class="more-btn" @click="goAllServices">
						<text class="more-text">全部</text>
						<uni-icons type="right" size="14" color="#AAAAAA" />
					</view>
				</view>
				<view class="service-grid">
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 0 }"
						@click="goProducts"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--warning-color-alpha-10) 0%, var(--warning-color-alpha-20) 100%)">
							<uni-icons type="shop" size="22" color="#FFA000" />
						</view>
						<text class="service-label">我发布的</text>
					</view>
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 1 }"
						@click="goOrders"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--primary-color-alpha-10) 0%, var(--primary-color-alpha-20) 100%)">
							<uni-icons type="cart" size="22" color="#1976D2" />
						</view>
						<text class="service-label">我买到的</text>
					</view>
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 2 }"
						@click="goSold"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--info-color-alpha-10) 0%, var(--info-color-alpha-20) 100%)">
							<uni-icons type="wallet-filled" size="22" color="#7B1FA2" />
						</view>
						<text class="service-label">我卖出的</text>
					</view>
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 3 }"
						@click="goShareItems"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--info-color-alpha-10) 0%, var(--info-color-alpha-20) 100%)">
							<uni-icons type="loop" size="22" color="#1976D2" />
						</view>
						<text class="service-label">共享物品</text>
					</view>
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 4 }"
						@click="goRefund"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--danger-color-alpha-10) 0%, var(--danger-color-alpha-20) 100%)">
							<uni-icons type="refresh" size="22" color="#D32F2F" />
						</view>
						<text class="service-label">退款/售后</text>
					</view>
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 5 }"
						@click="goEvaluations"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--success-color-alpha-10) 0%, var(--success-color-alpha-20) 100%)">
							<uni-icons type="star-filled" size="22" color="#4CAF50" />
						</view>
						<text class="service-label">我的评价</text>
					</view>
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 6 }"
						@click="goFavorites"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--danger-color-alpha-10) 0%, var(--danger-color-alpha-20) 100%)">
							<uni-icons type="heart-filled" size="22" color="#E91E63" />
						</view>
						<text class="service-label">我的收藏</text>
					</view>
					<view
						class="service-item"
						:class="{ 'item-visible': sectionAnimationStates.services }"
						:style="{ '--item-index': 7 }"
						@click="goHistory"
						hover-class="service-item-hover"
					>
						<view class="service-icon" style="background: linear-gradient(135deg, var(--warning-color-alpha-10) 0%, var(--warning-color-alpha-20) 100%)">
							<uni-icons type="calendar" size="22" color="#FF9800" />
						</view>
						<text class="service-label">浏览历史</text>
					</view>
				</view>
			</view>

			<!-- 其他功能 -->
			<view
				class="section-card section-animate"
				:class="{ 'section-visible': sectionAnimationStates.tools }"
			>
				<view class="section-header">
					<view class="section-title-wrap">
						<view class="title-icon" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)"></view>
						<text class="section-title">其他功能</text>
					</view>
				</view>
				<view class="tool-list">
					<view
						class="tool-item"
						:class="{ 'item-visible': sectionAnimationStates.tools }"
						:style="{ '--item-index': 0 }"
						hover-class="tool-item-hover"
						hover-stay-time="100"
						@click="goBlacklist"
					>
						<view class="tool-left">
							<view class="tool-icon" style="background: linear-gradient(135deg, var(--bg-color-disabled) 0%, var(--border-color-base) 100%)">
								<uni-icons type="eye-slash" size="16" color="#757575" />
							</view>
							<text class="tool-name">黑名单</text>
						</view>
						<uni-icons type="right" size="14" color="#C0C0C0" />
					</view>
				</view>
			</view>

			<!-- 设置中心 -->
			<view
				class="section-card section-animate"
				:class="{ 'section-visible': sectionAnimationStates.settings }"
			>
				<view class="section-header">
					<view class="section-title-wrap">
						<view class="title-icon" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)"></view>
						<text class="section-title">设置中心</text>
					</view>
				</view>
				<view class="setting-list">
					<view
						class="setting-item"
						:class="{ 'item-visible': sectionAnimationStates.settings }"
						:style="{ '--item-index': 0 }"
						hover-class="setting-item-hover"
						hover-stay-time="100"
						@click="goSystemSettings"
					>
						<view class="setting-left">
							<view class="setting-icon" style="background: linear-gradient(135deg, var(--info-color-alpha-10) 0%, var(--info-color-alpha-20) 100%)">
								<uni-icons type="gear" size="16" color="#9C27B0" />
							</view>
							<view class="setting-info">
								<text class="setting-name">系统设置</text>
								<text class="setting-desc">账号安全、通知、主题</text>
							</view>
						</view>
						<uni-icons type="right" size="14" color="#C0C0C0" />
					</view>
					<view
						class="setting-item"
						:class="{ 'item-visible': sectionAnimationStates.settings }"
						:style="{ '--item-index': 1 }"
						hover-class="setting-item-hover"
						hover-stay-time="100"
						@click="goFeedback"
					>
						<view class="setting-left">
							<view class="setting-icon" style="background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)">
								<uni-icons
									type="chatbubble-filled"
									size="16"
									color="#FFA000"
								/>
							</view>
							<view class="setting-info">
								<text class="setting-name">意见反馈</text>
								<text class="setting-desc">帮助我们做得更好</text>
							</view>
						</view>
						<uni-icons type="right" size="14" color="#C0C0C0" />
					</view>
					<view
						class="setting-item"
						:class="{ 'item-visible': sectionAnimationStates.settings }"
						:style="{ '--item-index': 4 }"
						hover-class="setting-item-hover"
						hover-stay-time="100"
						@click="goAbout"
					>
						<view class="setting-left">
							<view class="setting-icon" style="background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)">
								<uni-icons type="info-filled" size="16" color="#E91E63" />
							</view>
							<view class="setting-info">
								<text class="setting-name">关于我们</text>
								<text class="setting-desc">版本信息与用户协议</text>
							</view>
						</view>
						<view class="setting-right">
							<text class="version-text">v1.0.0</text>
							<uni-icons type="right" size="14" color="#C0C0C0" />
						</view>
					</view>
				</view>
			</view>

			<!-- 退出登录区域 - 仅在已登录时显示 -->
			<view
				v-if="userStore.isLogin"
				class="logout-section section-animate"
				:class="{ 'section-visible': sectionAnimationStates.settings }"
			>
				<view
					class="logout-btn"
					hover-class="logout-btn-hover"
					hover-stay-time="100"
					@click="handleLogout"
				>
					<view class="logout-icon">
						<uni-icons type="closeempty" size="20" :color="dangerColor" />
					</view>
					<text class="logout-text">退出登录</text>
				</view>
			</view>

			<!-- 底部安全区域 -->
			<view class="safe-area-bottom"></view>
		</scroll-view>

			<CustomTabBar />
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useThemePage, useThemeStyle, useThemeColors } from "@/utils/theme";
import { useUserStore } from "@/store/user";
import { navigate } from "@/utils/router";
import { checkAuth } from "@/utils/auth";
import { userApi } from "@/api/user";
import creditApi from "@/api/credit";
import { notificationApi } from "@/api/notification";
import { evaluationApi } from "@/api/evaluation";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";
import { getStatusBarHeight } from "@/utils/system-info";
import CustomTabBar from "@/custom-tab-bar/index.vue";

const userStore = useUserStore();
const { themeStyle } = useThemeStyle();
const { primaryColor, warningColor, dangerColor, successColor } = useThemeColors();

const stats = ref({
	publishCount: 0,
	orderCount: 0,
	followingCount: 0,
	followerCount: 0,
});

// 新增状态
const unreadCount = ref(0);
const isOnline = ref(false);
const showBackButton = ref(false);

// 滚动动画状态
const headerTranslateY = ref(0);
const headerOpacity = ref(1);
const bgScale = ref(1);
const navbarBgOpacity = ref(0);

// 页面入场动画状态
const pageVisible = ref(false);
const contentOpacity = ref(0);
const contentTransform = ref(30);

// 滚动容器动画样式
const scrollViewStyle = computed(() => ({
	opacity: contentOpacity.value,
	transform: `translateY(${contentTransform.value}rpx)`,
	transition: pageVisible.value
		? "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
		: "none",
}));

// 各区块动画状态
const sectionAnimationStates = ref({
	quickStats: false,
	services: false,
	tools: false,
	settings: false,
});

// 获取状态栏高度（使用新的 API，避免弃用警告）
const statusBarHeight = ref(getStatusBarHeight());

// 计算属性
const isVerified = computed(() => userStore.userInfo?.isVerified || false);
const displayUserId = computed(() =>
	userStore.isLogin ? userStore.userInfo?.userId || "-" : "-"
);
const displayCreditScore = computed(() =>
	userStore.isLogin ? userStore.userInfo?.creditScore || 0 : 0
);

const creditLevel = computed(() => {
	if (!userStore.isLogin) return "low";
	const score = userStore.userInfo?.creditScore || 0;
	if (score >= 90) return "excellent";
	if (score >= 80) return "good";
	if (score >= 60) return "medium";
	return "low";
});

const creditLevelText = computed(() => {
	const levelMap: Record<string, string> = {
		excellent: "优秀",
		good: "良好",
		medium: "一般",
		low: "待提升",
	};
	return levelMap[creditLevel.value] || "待提升";
});

const userTags = computed(() => {
	if (!userStore.isLogin) {
		return [];
	}
	const tags: string[] = [];
	if (isVerified.value) tags.push("已认证");
	if ((userStore.userInfo?.creditScore || 0) >= 90) tags.push("信誉优秀");
	if (userStore.userInfo?.college) tags.push(userStore.userInfo.college);
	return tags;
});

// 滚动事件处理
function onScroll(e: any) {
	const scrollTop = e.detail.scrollTop;
	const maxScroll = 150;

	headerTranslateY.value = -scrollTop * 0.3;
	headerOpacity.value = Math.max(0.5, 1 - scrollTop / maxScroll);
	bgScale.value = 1 + scrollTop * 0.0003;
	navbarBgOpacity.value = Math.min(1, scrollTop / 80);
}

onMounted(() => {
	loadStats();
	loadUnreadCount();

	// 触发页面入场动画
	setTimeout(() => {
		pageVisible.value = true;
		contentOpacity.value = 1;
		contentTransform.value = 0;

		// 依次触发各个区块的动画
		setTimeout(() => {
			sectionAnimationStates.value.quickStats = true;
		}, 100);

		setTimeout(() => {
			sectionAnimationStates.value.services = true;
		}, 200);

		setTimeout(() => {
			sectionAnimationStates.value.tools = true;
		}, 300);

		setTimeout(() => {
			sectionAnimationStates.value.settings = true;
		}, 400);
	}, 50);
});

// 每次页面显示时刷新数据
onShow(() => {
	useThemePage();
	console.log("[Mine Page] onShow - 刷新数据");
	console.log("[Mine Page] 当前登录状态:", userStore.isLogin);
	console.log("[Mine Page] Token:", userStore.token);
	console.log("[Mine Page] UserInfo:", userStore.userInfo);
	console.log("[Mine Page] Nickname:", userStore.nickname);
	console.log("[Mine Page] Avatar:", userStore.avatar);
	refreshUserProfile();
	loadStats();
	loadUnreadCount();

	// 检查是否显示返回按钮
	// 如果页面栈中存在多个页面，说明不是从 tabBar 直接进入的，需要显示返回按钮
	const pages = getCurrentPages();
	showBackButton.value = pages.length > 1;
	console.log(
		"[Mine Page] 页面栈深度:",
		pages.length,
		"showBackButton:",
		showBackButton.value
	);
});

async function refreshUserProfile() {
	if (!userStore.isLogin) {
		return;
	}

	try {
		const [userRes, creditRes] = await Promise.all([
			userApi.getUserInfo(),
			creditApi.getMyCreditDetail(),
		]);
		const latestUserInfo = (userRes as any)?.data || {};
		const creditDetail = (creditRes as any)?.data || {};

		userStore.updateUserInfo({
			...latestUserInfo,
			creditScore: Number(
				creditDetail.creditScore ?? latestUserInfo.creditScore ?? 0
			),
			creditLevel: creditDetail.creditLevel || latestUserInfo.creditLevel,
		});
	} catch (error) {
		console.error("[Mine] 刷新用户资料失败:", error);
	}
}

async function loadStats() {
	// 未登录时不加载统计数据
	if (!userStore.isLogin) {
		console.log("[loadStats] 用户未登录，跳过统计数据加载");
		stats.value = {
			publishCount: 0,
			orderCount: 0,
			followingCount: 0,
			followerCount: 0,
		};
		return;
	}

	// 优先使用 userInfo 中缓存的统计数据
	const cachedStats = userStore.userInfo;
	if (cachedStats) {
		stats.value = {
			publishCount: cachedStats.publishCount || 0,
			orderCount: cachedStats.orderCount || 0,
			followingCount: cachedStats.followingCount || 0,
			followerCount: cachedStats.followerCount || 0,
		};
	}

	// 后台刷新最新统计数据（不阻塞页面显示）
	try {
		const res = await userApi.getUserStats();
		const newStats = {
			publishCount: res.data?.publishCount || 0,
			orderCount: res.data?.orderCount || 0,
			followingCount: res.data?.followingCount || 0,
			followerCount: res.data?.followerCount || 0,
		};

		stats.value = newStats;

		// 更新 userInfo 中的统计数据缓存
		userStore.updateUserInfo(newStats);
	} catch (error) {
		console.error("[Mine] 获取用户统计失败:", error);
		// 接口调用失败时保持使用缓存值
	}
}

async function loadUnreadCount() {
	// 未登录时不加载未读数
	if (!userStore.isLogin) {
		console.log("[loadUnreadCount] 用户未登录，跳过未读数加载");
		unreadCount.value = 0;
		return;
	}

	try {
		const res = await notificationApi.getUnreadCount();
		unreadCount.value = res.data || 0;
	} catch (error) {
		console.error("[Mine] 获取未读数失败:", error);
		unreadCount.value = 0;
	}
}

// 导航方法 - 使用优化的路由工具
function handleUserCardClick() {
	if (!ensureMineAuth("请先登录后再访问个人资料")) {
		return;
	}

	// 已登录则跳转到个人资料页
	navigate.toProfile();
}

function ensureMineAuth(tipText: string) {
	return checkAuth({
		showTip: true,
		tipText,
		showAuthGuide: true,
		guideTitle: "登录后可使用该功能",
		guideContent: "该功能与个人数据相关，请先登录或注册账号。",
	});
}

function goProfile() {
	if (!ensureMineAuth("请先登录后再访问个人资料")) {
		return;
	}
	navigate.toProfile();
}

function goMessage() {
	if (!ensureMineAuth("请先登录后再查看消息")) {
		return;
	}
	navigate.toChat(
		"",
		String(userStore.userInfo?.id || userStore.userInfo?.userId || "")
	);
}

function goNotifications() {
	if (!ensureMineAuth("请先登录后再查看通知")) {
		return;
	}
	navigate.toNotifications();
}

function goProducts() {
	if (!ensureMineAuth("请先登录后再查看发布的商品")) {
		return;
	}
	navigate.toProducts();
}

function goOrders() {
	if (!ensureMineAuth("请先登录后再查看订单")) {
		return;
	}
	// 我买到的 - role=0
	uni.navigateTo({
		url: "/pages/order/list?role=0",
	});
}

function goSold() {
	if (!ensureMineAuth("请先登录后再查看订单")) {
		return;
	}
	// 我卖出的 - role=1
	uni.navigateTo({
		url: "/pages/order/list?role=1",
	});
}

function goShareItems() {
	if (!ensureMineAuth("请先登录后再查看共享物品")) {
		return;
	}
	uni.navigateTo({
		url: "/pages/share/my-share",
	});
}

function goFavorites() {
	if (!ensureMineAuth("请先登录后再查看收藏")) {
		return;
	}
	navigate.toFavorites();
}

function goEvaluations() {
	if (!ensureMineAuth("请先登录后再查看评价")) {
		return;
	}
	navigate.toEvaluations();
}

function goFollowing() {
	if (!ensureMineAuth("请先登录后再查看关注")) {
		return;
	}
	uni.navigateTo({
		url: "/pages/mine/follow-list?type=following",
	});
}

function goFollowers() {
	if (!ensureMineAuth("请先登录后再查看粉丝")) {
		return;
	}
	uni.navigateTo({
		url: "/pages/mine/follow-list?type=followers",
	});
}

function goHistory() {
	if (!ensureMineAuth("请先登录后再查看浏览历史")) {
		return;
	}
	navigate.toHistory();
}

function goBlacklist() {
	if (!ensureMineAuth("请先登录后再管理黑名单")) {
		return;
	}
	navigate.toBlacklist();
}

function goSystemSettings() {
	if (!ensureMineAuth("请先登录后再访问系统设置")) {
		return;
	}
	navigate.toSettings();
}

function goFeedback() {
	if (!ensureMineAuth("请先登录后再提交反馈")) {
		return;
	}
	navigate.toFeedback();
}

function goAbout() {
	if (!ensureMineAuth("请先登录后再查看关于我们")) {
		return;
	}
	navigate.toAbout();
}

function goRefund() {
	if (!ensureMineAuth("请先登录后再查看退款/售后")) {
		return;
	}
	navigate.toRefund();
}

function goAllServices() {
	if (!ensureMineAuth("请先登录后再查看服务")) {
		return;
	}
	navigate.toServices();
}

// 返回上一页
function goBack() {
	const pages = getCurrentPages();
	if (pages.length > 1) {
		uni.navigateBack({
			delta: 1,
		});
	} else {
		// 如果只有一个页面，可能是从外部链接或直接打开的，返回首页
		uni.switchTab({
			url: "/pages/market/index",
		});
	}
}

// 更换头像
function handleChangeAvatar() {
	// 检查登录状态
	if (!checkAuth({ showTip: true, tipText: "请先登录后再更换头像" })) {
		return;
	}

	uni.showActionSheet({
		itemList: ["拍照", "从相册选择"],
		success: (res) => {
			if (res.tapIndex === 0) {
				// 拍照
				chooseImage("camera");
			} else if (res.tapIndex === 1) {
				// 从相册选择
				chooseImage("album");
			}
		},
	});
}

// 选择图片
function chooseImage(sourceType: "album" | "camera") {
	uni.chooseImage({
		count: 1,
		sizeType: ["compressed"], // 压缩图
		sourceType: [sourceType],
		success: (res) => {
			const tempFilePath = res.tempFilePaths[0];
			console.log("[Avatar] 选择的图片:", tempFilePath);

			// 上传头像
			uploadAvatar(tempFilePath);
		},
		fail: (err) => {
			console.error("[Avatar] 选择图片失败:", err);
			uni.showToast({
				title: "选择图片失败",
				icon: "none",
			});
		},
	});
}

// 上传头像
async function uploadAvatar(filePath: string) {
	try {
		uni.showLoading({ title: "上传中..." });

		console.log("[Avatar] 开始上传头像:", filePath);

		// 调用上传头像 API
		const result: any = await userApi.uploadAvatar(filePath);

		console.log("[Avatar] 上传成功:", result);

		// 更新本地用户信息
		const avatarUrl = result?.url || '';
		if (!avatarUrl) {
			throw new Error('头像上传后未返回可用地址');
		}
		console.log("[Avatar] 新头像 URL:", avatarUrl);

		userStore.updateUserInfo({ avatar: avatarUrl });

		uni.hideLoading();

		uni.showToast({
			title: "头像更新成功",
			icon: "success",
		});
	} catch (error: any) {
		console.error("[Avatar] 上传失败:", error);
		uni.hideLoading();

		uni.showToast({
			title: error?.message || "上传失败，请重试",
			icon: "none",
			duration: 3000,
		});
	}
}

// 退出登录
function handleLogout() {
	uni.showModal({
		title: "提示",
		content: "确定要退出登录吗？",
		success: (res) => {
			if (res.confirm) {
				userStore.logout();
			}
		},
	});
}
</script>

<style lang="scss" scoped>
.mine-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-color-page);
}

.scroll-container {
	flex: 1;
	height: 100%;
}

/* 沉浸式头部 */
.immersion-header {
	position: sticky;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	height: 200rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	transition: opacity 0.3s ease;
}

/* 用户信息头部 */
.user-header {
	position: relative;
	padding: 12rpx 32rpx 0;
	overflow: visible;
	margin-bottom: 0;
}

.header-bg {
	position: absolute;
	top: -50rpx;
	left: -50rpx;
	right: -50rpx;
	bottom: -50rpx;
	overflow: visible;
	transform-origin: center top;
	z-index: 0;
	border-radius: 0 0 40rpx 40rpx;

	.bg-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			var(--primary-color) 0%,
			var(--primary-color-dark) 100%
		);
		border-radius: 0 0 40rpx 40rpx;
	}

	.bg-circle {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
	}

	.circle-1 {
		width: 350rpx;
		height: 350rpx;
		top: -120rpx;
		right: -80rpx;
	}

	.circle-2 {
		width: 250rpx;
		height: 250rpx;
		top: 80rpx;
		right: 60rpx;
	}

	.circle-3 {
		width: 180rpx;
		height: 180rpx;
		top: 30rpx;
		left: -50rpx;
	}

	.bg-particle {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
	}

	.particle-1 {
		width: 80rpx;
		height: 80rpx;
		top: 150rpx;
		left: 100rpx;
	}

	.particle-2 {
		width: 60rpx;
		height: 60rpx;
		top: 200rpx;
		right: 150rpx;
	}
}

/* 顶部操作栏 */
.header-actions {
	position: relative;
	z-index: 100;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 14rpx;
	margin-top: 16rpx;
	margin-bottom: 12rpx;
}

.action-btn-spacer {
	flex: 1;
}

/* ========== 极简风格顶部按钮 ========== */

/* 返回按钮 - 与通知按钮保持一致的极简风格 */
.back-btn {
	position: absolute;
	left: 0;
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.12);
	border-radius: 50%;
	backdrop-filter: blur(10rpx);
	transition: all 0.2s ease-out;
	opacity: 0;
	animation: fadeIn 0.3s ease-out forwards;

	&:active {
		transform: scale(0.92);
		background: rgba(255, 255, 255, 0.2);
	}
}

/* ========== 极简风格通知按钮 ========== */

/* 通知按钮容器 */
.notification-btn {
	position: relative;
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.12);
	border-radius: 50%;
	backdrop-filter: blur(10rpx);
	transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

	/* 向下偏移避开小程序胶囊 */
	&.notification-btn-safe {
		margin-top: 40rpx; /* 向下移动，避开胶囊区域 */
	}

	&:active {
		transform: scale(0.92);
		background: rgba(255, 255, 255, 0.2);
	}
}

/* 极简圆点徽章 */
.notification-dot {
	position: absolute;
	top: 4rpx;
	right: 4rpx;
	width: 18rpx;
	height: 18rpx;
	border-radius: 50%;
	background: var(--error-color);
	border: 2.5rpx solid #fff;
	box-shadow: 0 2rpx 8rpx var(--danger-color-alpha-35);
	z-index: 10;
	animation: fadeIn 0.3s ease-out 0.3s forwards;
	opacity: 0;
}

/* 圆点核心（增加层次感） */
.dot-core {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: radial-gradient(circle at 30% 30%, #ff6b7a, var(--error-color));
}

/* 通用淡入动画 */
@keyframes fadeIn {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}

/* ========== 保留旧样式作为备用 ========== */

/* 保留旧样式作为备用 */
.badge {
	position: absolute;
	top: -6rpx;
	right: -6rpx;
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 6rpx;
	background: linear-gradient(135deg, var(--error-color) 0%, #ff6b7a 100%);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid #fff;
	z-index: 999;
	box-shadow: 0 4rpx 12rpx var(--danger-color-alpha-40), 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
	transform: translateZ(0);
}

.badge .badge-text {
	font-size: 16rpx;
	font-weight: 700;
	color: #fff;
	line-height: 1;
	letter-spacing: 0;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
}

/* 用户信息卡片 */
.user-card {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	padding: 0 0 24rpx;
	transition: opacity 0.3s ease;
}

.avatar-container {
	position: relative;
	margin-right: 20rpx;
}

.avatar {
	width: 112rpx;
	height: 112rpx;
	border-radius: 56rpx;
}

.avatar-edit-badge {
	position: absolute;
	bottom: -2rpx;
	right: -2rpx;
	width: 36rpx;
	height: 36rpx;
	background: linear-gradient(
		135deg,
		var(--primary-color) 0%,
		var(--primary-color-dark) 100%
	);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid #fff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	z-index: 2;
	transition: all 0.3s;

	&:active {
		transform: scale(0.9);
	}
}

.online-status {
	position: absolute;
	bottom: 4rpx;
	right: 4rpx;
	width: 22rpx;
	height: 22rpx;
	background: var(--success-color);
	border-radius: 50%;
	border: 2rpx solid #fff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.user-info {
	flex: 1;
	padding-top: 4rpx;
}

.nickname-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 8rpx;
}

.nickname {
	font-size: 36rpx;
	font-weight: 700;
	color: #fff;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	letter-spacing: 1rpx;
}

.level-badge {
	display: flex;
	align-items: center;
	gap: 4rpx;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	backdrop-filter: blur(10rpx);
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);

	&.level-excellent {
		background: linear-gradient(135deg, var(--warning-color) 0%, #ffa500 100%);
		box-shadow: 0 2rpx 12rpx var(--accent-color-alpha-40);
	}

	&.level-good {
		background: var(--success-color);
	}

	&.level-medium {
		background: var(--warning-color-alpha-85);
	}

	&.level-low {
		background: rgba(255, 255, 255, 0.25);
	}

	.level-text {
		font-size: 18rpx;
		font-weight: 600;
		color: #fff;
	}
}

.user-meta {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 8rpx;
}

.user-id {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.85);
	font-weight: 500;
}

.divider {
	font-size: 18rpx;
	color: rgba(255, 255, 255, 0.4);
}

.credit-info {
	display: flex;
	align-items: center;
	gap: 4rpx;
}

.credit-score {
	font-size: 22rpx;
	color: var(--warning-color);
	font-weight: 600;
}

.user-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
}

.tag {
	padding: 4rpx 12rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 16rpx;
	backdrop-filter: blur(10rpx);
}

.tag-text {
	font-size: 18rpx;
	color: rgba(255, 255, 255, 0.95);
	font-weight: 500;
}

/* 快捷统计 - Claymorphism 风格 */
.quick-stats {
	position: relative;
	z-index: 2;
	margin: 16rpx 24rpx 0;
	background: var(--bg-color-card);
	border-radius: 24rpx;
	padding: 28rpx 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.8);
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	transition: opacity 0.3s ease;
}

.stat-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;

	&:active {
		transform: scale(0.95);
		opacity: 0.8;
	}
}

.stat-icon-wrap {
	position: relative;
}

.stat-icon {
	width: 72rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 20rpx;
	box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
}

.stat-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
}

.stat-num {
	font-size: 32rpx;
	font-weight: 700;
	color: var(--text-color-primary);
	line-height: 1;
}

.stat-label {
	font-size: 20rpx;
	color: var(--text-color-tertiary);
}

.stat-divider {
	width: 1rpx;
	height: 56rpx;
	background: linear-gradient(180deg, transparent 0%, #e5e5e5 50%, transparent 100%);
}

/* 区块卡片 - Claymorphism 风格 */
.section-card {
	margin: 20rpx 24rpx;
	background: var(--bg-color-card);
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.8);
	border: 2rpx solid rgba(255, 255, 255, 0.8);
}

.section-header {
	padding: 24rpx 28rpx 16rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.section-title-wrap {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.title-icon {
	width: 5rpx;
	height: 26rpx;
	background: linear-gradient(
		135deg,
		var(--primary-color) 0%,
		var(--primary-color-dark) 100%
	);
	border-radius: 3rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: 700;
	color: var(--text-color-primary);
}

.more-btn {
	display: flex;
	align-items: center;
	gap: 4rpx;
	padding: 8rpx 16rpx;
	background: var(--bg-color-page);
	border-radius: 20rpx;
	transition: all 0.3s;

	&:active {
		background: var(--bg-color-hover);
	}
}

.more-text {
	font-size: 24rpx;
	color: var(--text-color-tertiary);
}

/* 服务网格 */
.service-section {
	.section-header {
		border-bottom: 1rpx solid #f5f5f5;
	}
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
	gap: 10rpx;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;

	&:active {
		transform: scale(0.92);
		opacity: 0.8;
	}

	&.service-item-hover {
		transform: scale(0.95);
		opacity: 0.8;
	}
}

.service-icon {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 24rpx;
	box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.service-label {
	font-size: 22rpx;
	color: var(--text-color-secondary);
	text-align: center;
	transition: opacity 0.2s;
}

/* 工具列表 */
.tool-list {
	padding: 0 28rpx;
}

.tool-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:last-child {
		border-bottom: none;
	}

	&:active {
		transform: scale(0.98);
	}
}

.tool-item-hover {
	background: #f9f9f9;
	margin: 0 -28rpx;
	padding: 24rpx 28rpx;
	transform: scale(0.98);
}

.tool-left {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.tool-icon {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16rpx;
	box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
}

.tool-name {
	font-size: 26rpx;
	color: var(--text-color-primary);
	font-weight: 500;
}

.tool-right {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.tool-count {
	padding: 4rpx 10rpx;
	background: var(--error-color);
	border-radius: 18rpx;
	font-size: 18rpx;
	color: #fff;
	font-weight: 600;
	min-width: 32rpx;
	text-align: center;
}

/* 设置列表 */
.setting-list {
	padding: 0 28rpx;
}

.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&:last-child {
		border-bottom: none;
	}

	&:active {
		transform: scale(0.98);
	}
}

.setting-item-hover {
	background: #f9f9f9;
	margin: 0 -28rpx;
	padding: 20rpx 28rpx;
	transform: scale(0.98);
}

.setting-left {
	display: flex;
	align-items: center;
	gap: 16rpx;
	flex: 1;
}

.setting-icon {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16rpx;
	box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
}

.setting-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.setting-name {
	font-size: 26rpx;
	color: var(--text-color-primary);
	font-weight: 500;
}

.setting-desc {
	font-size: 20rpx;
	color: var(--text-color-tertiary);
}

/* 退出登录区域 */
.logout-section {
	margin: 20rpx 24rpx;
	padding: 0;
}

/* 退出登录按钮 - Claymorphism 风格 */
.logout-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	width: 100%;
	padding: 28rpx 0;
	background: var(--bg-color-card);
	border-radius: 24rpx;
	box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.8);
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	transition: all 0.2s ease-out;
	position: relative;
	overflow: hidden;
}

.logout-btn-hover {
	transform: scale(0.95);
	box-shadow: 2rpx 2rpx 8rpx rgba(0, 0, 0, 0.08),
		-1rpx -1rpx 4rpx rgba(255, 255, 255, 0.6);
}

.logout-icon {
	position: relative;
	z-index: 1;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
	border-radius: 50%;
	box-shadow: 3rpx 3rpx 8rpx rgba(0, 0, 0, 0.06),
		-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
}

.logout-text {
	position: relative;
	z-index: 1;
	font-size: 28rpx;
	font-weight: 600;
	color: var(--danger-color);
}

.setting-right {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.version-text {
	font-size: 22rpx;
	color: var(--text-color-tertiary);
}

.verification-badge {
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	font-size: 20rpx;
	font-weight: 600;

	&.verified {
		background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
		color: var(--success-color);
	}

	&.unverified {
		background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
		color: #ff9800;
	}

	.badge-text {
		font-size: 20rpx;
	}
}

/* 底部安全区域 */
.safe-area-bottom {
	height: constant(safe-area-inset-bottom);
	height: env(safe-area-inset-bottom);
}

/* ========== 增强页面入场动画 ========== */

/* 页面整体淡入 */
.mine-page {
	animation: pageFadeIn 0.3s ease-out forwards;
}

@keyframes pageFadeIn {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}

/* ========== 极简风格按钮动画 ========== */

/* 通知按钮入场动画 */
.notification-btn {
	opacity: 0;
	animation: fadeIn 0.3s ease-out 0.15s forwards;
}

/* ========== 新拟物化徽章动画（已弃用，保留作为备用） ========== */

/* 徽章弹出动画 */
.badge {
	animation: fadeIn 0.3s ease-out 0.4s forwards;
	opacity: 0;
}

/* 昵称文字淡入动画 */
.nickname {
	animation: fadeIn 0.3s ease-out 0.2s forwards;
}

/* 用户信息元数据淡入动画 */
.user-meta {
	animation: fadeIn 0.3s ease-out 0.3s forwards;
}

/* 用户标签淡入动画 */
.tag {
	opacity: 0;
	animation: fadeIn 0.3s ease-out forwards;

	&:nth-child(1) {
		animation-delay: 0.4s;
	}

	&:nth-child(2) {
		animation-delay: 0.45s;
	}

	&:nth-child(3) {
		animation-delay: 0.5s;
	}
}

/* 头像编辑徽章淡入动画 */
.avatar-edit-badge {
	animation: fadeIn 0.3s ease-out 0.6s forwards;
	opacity: 0;
}

/* 统计图标依次淡入动画 */
.quick-stats .stat-item {
	opacity: 0;
	animation: fadeIn 0.3s ease-out forwards;

	&:nth-child(1) {
		animation-delay: 0.1s;
	}

	&:nth-child(3) {
		animation-delay: 0.15s;
	}

	&:nth-child(5) {
		animation-delay: 0.2s;
	}

	&:nth-child(7) {
		animation-delay: 0.25s;
	}
}

/* 统计数字淡入 */
.stat-num {
	animation: fadeIn 0.3s ease-out forwards;
}

/* 区块入场淡入动画 */
.section-animate {
	opacity: 0;
	transition: opacity 0.3s ease-out;

	&.section-visible {
		opacity: 1;
	}
}

/* 服务项依次淡入动画 */
.service-item {
	opacity: 0;
	transition: opacity 0.3s ease-out;
	transition-delay: calc(var(--item-index) * 0.05s);

	&.item-visible {
		opacity: 1;
	}
}

/* 服务图标 Claymorphism 按压效果 */

/* 工具列表项淡入动画 */
.tool-item {
	opacity: 0;
	transition: opacity 0.3s ease-out;
	transition-delay: calc(var(--item-index) * 0.05s);

	&.item-visible {
		opacity: 1;
	}
}

/* 设置列表项淡入动画 */
.setting-item {
	opacity: 0;
	transition: opacity 0.3s ease-out;
	transition-delay: calc(var(--item-index) * 0.05s);

	&.item-visible {
		opacity: 1;
	}
}

/* 用户信息卡片淡入动画 */
.user-card {
	animation: fadeIn 0.3s ease-out forwards;
}

/* 头像淡入 */
.avatar {
	animation: fadeIn 0.3s ease-out forwards;
}

/* 徽章淡入动画 */
.level-badge {
	animation: fadeIn 0.3s ease-out 0.35s forwards;
}

/* 背景装饰 - Claymorphism 静态定位 */
.bg-circle,
.bg-particle {
	opacity: 0.08;
}

/* 按钮点击波纹效果 */
.action-btn,
.service-item,
.stat-item,
.tool-item,
.setting-item {
	position: relative;
	overflow: hidden;
}

/* 加载骨架屏增强动画 */
@keyframes skeletonShimmer {
	0% {
		background-position: -200% 0;
	}
	100% {
		background-position: 200% 0;
	}
}

.skeleton-loading {
	background: linear-gradient(
		90deg,
		#f0f0f0 0%,
		#e8e8e8 20%,
		#f5f5f5 40%,
		#e8e8e8 60%,
		#f0f0f0 100%
	);
	background-size: 200% 100%;
	animation: skeletonShimmer 1.8s infinite;
}
</style>
