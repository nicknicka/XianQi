<template>
	<view class="detail-page" :style="themeStyle">
		<!-- 骨架屏 -->
		<view v-if="pageLoading" class="skeleton-container">
			<view class="skeleton-banner skeleton-shimmer"></view>
			<view class="skeleton-section">
				<view class="skeleton-price-row">
					<view class="skeleton-price skeleton-shimmer"></view>
					<view class="skeleton-original-price skeleton-shimmer"></view>
				</view>
				<view class="skeleton-title skeleton-shimmer"></view>
				<view class="skeleton-tags">
					<view class="skeleton-tag skeleton-shimmer"></view>
					<view class="skeleton-tag skeleton-shimmer"></view>
					<view class="skeleton-tag skeleton-shimmer"></view>
				</view>
			</view>
			<view class="skeleton-section">
				<view class="skeleton-user-row">
					<view class="skeleton-avatar skeleton-shimmer"></view>
					<view class="skeleton-user-info">
						<view class="skeleton-name skeleton-shimmer"></view>
						<view class="skeleton-credit skeleton-shimmer"></view>
					</view>
				</view>
			</view>
			<view class="skeleton-section">
				<view class="skeleton-section-title skeleton-shimmer"></view>
				<view class="skeleton-desc skeleton-shimmer"></view>
				<view class="skeleton-desc skeleton-shimmer"></view>
			</view>
		</view>

		<scroll-view v-else class="scroll-view" scroll-y>
			<!-- 图片轮播 -->
			<view class="images-container animate-fade-in-up">
				<swiper
					class="image-swiper"
					indicator-dots
					:autoplay="false"
					:circular="true"
				>
					<swiper-item v-for="(image, index) in displayImages" :key="index">
						<lazy-image
							class="product-image"
							:src="image"
							mode="aspectFit"
							width="750"
							height="750"
							@click="previewImage(Number(index))"
						/>
					</swiper-item>
				</swiper>
			</view>

			<!-- 秒杀倒计时条 (仅秒杀渠道显示) -->
			<view
				v-if="isFlashChannel && product.endTime"
				class="flash-countdown-bar animate-fade-in-up"
				style="animation-delay: 0.05s"
			>
				<view class="countdown-content">
					<text class="countdown-label">⏰ 距离结束</text>
					<view class="countdown-time">
						<text class="time-block">{{ countdownHours }}</text>
						<text class="time-separator">:</text>
						<text class="time-block">{{ countdownMinutes }}</text>
						<text class="time-separator">:</text>
						<text class="time-block">{{ countdownSeconds }}</text>
					</view>
				</view>
			</view>

			<!-- 商品信息 -->
			<view
				class="product-section animate-fade-in-up"
				style="animation-delay: 0.1s"
			>
				<!-- 秒杀价格区域 -->
				<view v-if="isFlashChannel" class="flash-price-box">
					<view class="flash-tag">⚡ 限时秒杀</view>
					<view class="flash-price-row">
						<text class="currency">¥</text>
						<text class="price">{{
							product.seckillPrice || product.price
						}}</text>
						<text class="original-price"
							>¥{{ product.originalPrice || product.price }}</text
						>
						<text class="discount" v-if="product.discount"
							>{{ product.discount }}折</text
						>
					</view>
					<!-- 秒杀库存进度 -->
					<view v-if="product.soldPercent !== undefined" class="stock-progress">
						<view class="progress-info">
							<text class="stock-text"
								>已抢 {{ product.soldPercent }}%</text
							>
							<text class="stock-remain"
								>剩余 {{ product.flashSaleStock || 0 }} 件</text
							>
						</view>
						<view class="progress-bar">
							<view
								class="progress-fill"
								:style="{ width: product.soldPercent + '%' }"
							></view>
						</view>
					</view>
					<!-- 秒杀提示 -->
					<view class="flash-tips">
						<text class="tip-item"
							>⚡ 每人限购 {{ product.limitPerUser || 1 }} 件</text
						>
					</view>
				</view>

				<!-- 正常价格区域 -->
				<view v-else class="price-row">
					<text class="price">¥{{ product.price }}</text>
					<text class="original-price" v-if="product.originalPrice"
						>¥{{ product.originalPrice }}</text
					>
					<!-- 秒杀提示 (正常渠道下显示) -->
					<view
						v-if="product.isFlashSale"
						class="flash-hint"
						@click="switchToFlash"
					>
						<text class="hint-text">🔥 此商品正在秒杀</text>
					</view>
				</view>

				<text class="title">{{ product.title }}</text>
				<view class="tags">
					<text class="tag">{{ getConditionLabel(product.condition) }}</text>
					<text class="tag" v-if="product.isNew">全新</text>
					<text class="tag" v-if="product.canDelivery">可邮寄</text>
				</view>
			</view>

			<!-- 商品描述 -->
			<view class="desc-section animate-fade-in-up" style="animation-delay: 0.3s">
				<text class="section-title">商品描述</text>
				<text class="desc-text">{{ product.description }}</text>
			</view>

			<!-- 发布信息 -->
			<view class="info-section animate-fade-in-up" style="animation-delay: 0.4s">
				<view class="info-item">
					<text class="label">发布时间</text>
					<text class="value">{{ formatTime(product.createdAt) }}</text>
				</view>
				<view class="info-item">
					<text class="label">浏览次数</text>
					<text class="value">{{ product.viewCount }}次</text>
				</view>
				<view class="info-item">
					<text class="label">收藏人数</text>
					<text class="value">{{ product.favoriteCount }}人</text>
				</view>
			</view>

			<!-- 位置信息 -->
			<view
				class="location-section animate-fade-in-up"
				style="animation-delay: 0.5s"
				v-if="product.location"
			>
				<view class="location-info">
					<uni-icons type="location" size="16" :color="textColorTertiary" />
					<text class="location-text">{{ product.location }}</text>
				</view>
				<view class="distance" v-if="product.distance"
					>{{ product.distance }}km</view
				>
			</view>

			<!-- 交易安全保障 -->
			<view
				class="safety-section animate-fade-in-up"
				style="animation-delay: 0.55s"
			>
				<view class="section-header-small">
					<uni-icons type="checkbox" size="16" :color="successColor" />
					<text class="section-title-small">交易保障</text>
				</view>
				<view class="safety-tips">
					<view class="tip-item">
						<text class="tip-icon">🎓</text>
						<text class="tip-text">校园认证，学生身份真实可靠</text>
					</view>
					<view class="tip-item">
						<text class="tip-icon">💬</text>
						<text class="tip-text">平台内沟通，交易记录可追溯</text>
					</view>
					<view class="tip-item">
						<text class="tip-icon">📍</text>
						<text class="tip-text">建议选择校内公共场所当面交易</text>
					</view>
				</view>
			</view>

			<!-- 商品评价 -->
			<view
				class="evaluation-section animate-fade-in-up"
				style="animation-delay: 0.6s"
				v-if="evaluationData.totalCount > 0"
			>
				<view class="section-header-with-more" @tap="goToEvaluationList">
					<view class="section-header-small">
						<text class="section-title-small">商品评价</text>
						<view class="rating-badge">
							<text class="rating-score">{{
								evaluationData.averageRating
							}}</text>
							<uni-icons type="star" size="12" :color="warningColor" />
						</view>
						<text class="evaluation-count"
							>({{ evaluationData.totalCount }}条)</text
						>
					</view>
					<uni-icons type="right" size="14" :color="textColorTertiary" />
				</view>

				<view class="evaluation-list" v-if="evaluationData.list.length > 0">
					<view
						class="evaluation-item"
						v-for="evaluation in evaluationData.list"
						:key="evaluation.id"
					>
						<view class="evaluation-header">
							<UserAvatar
								class="evaluation-avatar"
								:src="evaluation.fromUserAvatar"
								size="md"
								shape="circle"
							/>
							<view class="evaluation-user">
								<text class="evaluation-name">{{
									evaluation.fromUserName
								}}</text>
								<view class="evaluation-rating">
									<uni-icons
										v-for="i in 5"
										:key="i"
										:type="
											i <= evaluation.rating
												? 'star-filled'
												: 'star'
										"
										size="12"
										:color="
											i <= evaluation.rating
												? warningColor
												: 'var(--border-color-base)'
										"
									/>
								</view>
							</view>
						</view>
						<text class="evaluation-content">{{ evaluation.content }}</text>
							<view
								class="evaluation-tags"
								v-if="evaluation.tags && evaluation.tags.length > 0"
							>
							<text
								class="eval-tag"
								v-for="(tag, idx) in evaluation.tags"
								:key="idx"
									>{{ tag }}</text
								>
							</view>
							<view
								class="append-evaluation"
								v-if="evaluation.appendContent || (evaluation.appendImages && evaluation.appendImages.length > 0)"
							>
								<text class="append-label">追评</text>
								<text class="append-content" v-if="evaluation.appendContent">{{
									evaluation.appendContent
								}}</text>
							</view>
						</view>
					</view>
				</view>

			<!-- 卖家其他商品 -->
			<view
				class="seller-products-section animate-fade-in-up"
				style="animation-delay: 0.7s"
				v-if="sellerProducts.length > 0"
			>
				<view class="seller-products-header">
					<view class="seller-info-row" @tap="goUserHome">
						<UserAvatar
							class="seller-avatar"
							:src="product.userAvatar"
							size="md"
							shape="circle"
						/>
						<view class="seller-details">
							<text class="seller-name">{{ product.userName }}</text>
							<view class="seller-meta">
								<view class="credit-badge">
									<uni-icons
										type="star"
										size="10"
										:color="warningColor"
									/>
									<text class="credit-text"
										>{{ product.creditScore || 95 }}分</text
									>
								</view>
								<text class="product-count"
									>{{ sellerProducts.length }}件在售</text
								>
							</view>
						</view>
					</view>
					<view class="view-all-btn" @tap="goToSellerProducts">
						<text class="view-all-text">查看全部</text>
						<uni-icons type="right" size="12" :color="textColorTertiary" />
					</view>
				</view>
				<scroll-view class="products-scroll" scroll-x :show-scrollbar="false">
					<view
						class="product-scroll-item"
						v-for="item in sellerProducts"
						:key="item.id"
						@tap="goToDetail(item)"
					>
						<ProductCard
							class="seller-product-card"
							:product="item"
							:show-user="false"
							:show-credit="false"
							:enable-preview="false"
						/>
					</view>
				</scroll-view>
			</view>

			<!-- 相似商品推荐 -->
			<view
				class="similar-section animate-fade-in-up"
				style="animation-delay: 0.8s"
				v-if="similarProducts.length > 0"
			>
				<view class="section-header-small">
					<text class="section-title-small">相似推荐</text>
				</view>
				<view class="similar-grid">
					<view
						class="similar-item"
						v-for="item in similarProducts"
						:key="item.id"
						@tap="goToDetail(item)"
					>
						<ProductCard
							class="similar-card"
							:product="item"
							:show-user="false"
							:show-credit="false"
							:enable-preview="false"
						/>
					</view>
				</view>
			</view>

			<!-- 举报按钮 (非卖家可见) -->
			<view
				v-if="!isOwner"
				class="report-section animate-fade-in-up"
				style="animation-delay: 0.9s"
			>
				<view class="report-btn-enhanced" @tap="showReportModal">
					<view class="report-btn-icon">
						<text class="icon-text">⚠️</text>
					</view>
					<view class="report-btn-content">
						<text class="report-btn-title">举报商品</text>
						<text class="report-btn-subtitle">发现违规内容？</text>
					</view>
					<view class="report-btn-arrow">
						<uni-icons type="right" size="14" :color="textColorTertiary" />
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部操作栏 -->
		<view class="bottom-bar animate-fade-in-up" style="animation-delay: 0.6s">
			<!-- 卖家视角 -->
			<template v-if="isOwner">
				<view class="owner-actions">
					<view class="owner-action-btn" @click="editProduct">
						<uni-icons type="compose" size="20" :color="textColorSecondary" />
						<text>编辑</text>
					</view>
					<view class="owner-action-btn" @click="shareProduct">
						<uni-icons type="redo" size="20" :color="textColorSecondary" />
						<text>分享</text>
					</view>
					<!-- 已下架状态 -->
					<view
						v-if="product.status === 0"
						class="owner-action-btn primary"
						@click="changeStatus(1)"
					>
						<uni-icons
							type="eye"
							size="20"
							color="var(--text-color-inverse)"
						/>
						<text>上架</text>
					</view>
					<!-- 在售状态 -->
					<view
						v-else-if="product.status === 1"
						class="owner-action-btn warning"
						@click="changeStatus(0)"
					>
						<uni-icons
							type="eye-slash"
							size="20"
							color="var(--text-color-inverse)"
						/>
						<text>下架</text>
					</view>
					<!-- 已售状态 -->
					<view v-else class="owner-action-btn disabled">
						<text>已售</text>
					</view>
					<view class="owner-action-btn danger" @click="deleteProduct">
						<uni-icons
							type="trash"
							size="20"
							color="var(--text-color-inverse)"
						/>
						<text>删除</text>
					</view>
				</view>
			</template>
			<!-- 买家视角 -->
			<template v-else>
				<view class="left-actions">
					<view class="action-item" @click="toggleFavorite">
						<uni-icons
							:type="isFavorited ? 'heart-filled' : 'heart'"
							size="24"
							:color="
								isFavorited ? 'var(--error-color)' : textColorSecondary
							"
						/>
					</view>
					<view class="action-item" @click="shareProduct">
						<uni-icons type="redo" size="24" :color="textColorSecondary" />
					</view>
				</view>
				<view class="right-actions">
					<!-- 秒杀渠道（仅可购买时展示） -->
					<template v-if="showPurchaseActions && isFlashChannel">
						<button
							v-if="canBuy"
							class="seckill-btn"
							:class="{ disabled: isSeckillLoading }"
							:disabled="isSeckillLoading"
							@click="handleSeckill"
						>
							{{ isSeckillLoading ? "抢购中..." : "立即抢" }}
						</button>
						<button v-else class="seckill-btn disabled" disabled>
							{{ cannotBuyReason || "已抢光" }}
						</button>
					</template>
					<!-- 正常渠道（仅可购买时展示） -->
					<template v-else-if="showPurchaseActions">
						<view class="chat-btn" @click="goChat">
							<uni-icons
								type="chatbubble"
								size="18"
								:color="primaryColor"
							/>
							<text>联系卖家</text>
						</view>
						<button class="buy-btn" @click="buyNow">立即购买</button>
					</template>
					<view v-else class="purchase-disabled-tip">{{ purchaseDisabledReason }}</view>
				</view>
			</template>
		</view>

		<!-- 举报弹窗 -->
		<view
			v-if="reportModalVisible"
			class="report-modal-wrapper"
			@tap.self="closeReportModal"
			@touchmove.prevent
		>
			<view class="report-modal-content" @tap.stop @touchmove.stop>
				<scroll-view class="report-modal-scroll" scroll-y :show-scrollbar="false">
					<!-- 头部 -->
					<view class="report-modal-header">
						<view class="report-header-icon">
							<text class="icon-warning">⚠️</text>
						</view>
						<text class="report-modal-title">举报商品</text>
						<view class="report-close-btn" @tap="closeReportModal">
							<uni-icons
								type="closeempty"
								size="20"
								:color="textColorTertiary"
							/>
						</view>
					</view>

					<!-- 提示信息 -->
					<view class="report-tip">
						<uni-icons
							type="info-filled"
							size="14"
							color="var(--info-color)"
						/>
						<text class="tip-text">感谢您帮助维护良好的交易环境</text>
					</view>

					<!-- 举报原因 -->
					<view class="report-reasons-container">
						<text class="section-label">举报原因</text>
						<view class="reasons-grid">
							<view
								class="reason-card"
								:class="{
									'reason-active': selectedReportReason === r.value,
								}"
								v-for="r in reportReasons"
								:key="r.value"
								@tap="selectReason(r.value)"
							>
								<view class="reason-icon-wrapper">
									<text class="reason-icon">{{
										getReasonIcon(r.value)
									}}</text>
								</view>
								<text class="reason-label">{{ r.label }}</text>
								<view
									class="reason-check-mark"
									v-if="selectedReportReason === r.value"
								>
									<uni-icons
										type="checkmarkempty"
										size="16"
										color="var(--text-color-inverse)"
									/>
								</view>
							</view>
						</view>
					</view>

					<!-- 详细描述 -->
					<view class="report-description-container">
						<view class="desc-header">
							<text class="section-label">详细描述（选填）</text>
							<text class="char-count"
								>{{ reportDescription.length }}/200</text
							>
						</view>
						<textarea
							class="report-textarea"
							placeholder="请详细描述您发现的问题，有助于我们更快处理..."
							:value="reportDescription"
							@input="onReportDescInput"
							maxlength="200"
						/>
					</view>
				</scroll-view>

				<!-- 操作按钮 -->
				<view class="report-modal-actions">
					<view class="action-btn-cancel" @tap="closeReportModal">
						<text class="btn-text-cancel">取消</text>
					</view>
					<view
						class="action-btn-submit"
						:class="{ 'btn-disabled': !selectedReportReason }"
						@tap="submitReport"
					>
						<view class="btn-submit-content">
							<text class="btn-text-submit">提交举报</text>
							<uni-icons
								type="arrowright"
								size="16"
								color="var(--text-color-inverse)"
							/>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
// #ifdef MP-WEIXIN
import { onShareAppMessage, onShareTimeline } from "@dcloudio/uni-app";
// #endif
import { onShow } from "@dcloudio/uni-app";
import { useThemePage, useThemeStyle, useThemeColors } from "@/utils/theme";
import { productApi } from "@/api/product";
import { evaluationApi } from "@/api/evaluation";
import { reportApi, ReportReason } from "@/api/report";
import { favoriteApi } from "@/api/favorite";
import { activityApi } from "@/api/activity";
import { checkSensitiveWord, SensitiveCheckType } from "@/utils/sensitive-word";
import { useUserStore } from "@/store/user";
import { formatDateTime } from "@/utils/date";
import { shareManager } from "@/utils/share";
import { getConditionLabel } from "@/types";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import ProductCard from "@/components/product-card/product-card.vue";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";

const userStore = useUserStore();
const { themeStyle } = useThemeStyle();
const {
	primaryColor,
	secondaryColor: textColorSecondary,
	accentColor: textColorTertiary,
	successColor,
	warningColor,
} = useThemeColors();

const productId = ref<string>("");
const product = ref<any>({});
const productOwnerId = ref<string>("");
const isFavorited = ref(false);
const pageLoading = ref(true);

// 秒杀相关状态
const isFlashChannel = ref(false); // 是否秒杀渠道
const countdownHours = ref("00");
const countdownMinutes = ref("00");
const countdownSeconds = ref("00");
let countdownTimer: any = null;

// 秒杀资格状态
const canBuy = ref(true);
const cannotBuyReason = ref("");
const isSeckillLoading = ref(false);

// 评价数据
const evaluationData = ref<{
	list: any[];
	total: number;
	averageRating: number;
	totalCount: number;
}>({
	list: [],
	total: 0,
	averageRating: 0,
	totalCount: 0,
});

// 卖家其他商品
const sellerProducts = ref<any[]>([]);

// 相似商品
const similarProducts = ref<any[]>([]);

// 举报相关
const reportModalVisible = ref(false);
const selectedReportReason = ref<number | null>(null);
const reportDescription = ref("");
const reportReasons = [
	{ label: "虚假信息", value: ReportReason.FRAUD },
	{ label: "违规内容", value: ReportReason.PORNOGRAPHY },
	{ label: "骚扰广告", value: ReportReason.SPAM },
	{ label: "其他问题", value: ReportReason.OTHER },
];

// 计算显示的图片列表
const displayImages = computed(() => {
	const images = product.value.images || [];
	const coverImage = product.value.coverImage;

	if (images.length > 0) {
		return images;
	} else if (coverImage) {
		return [coverImage];
	} else {
		return ["/static/images/empty.png"];
	}
});

function normalizeId(value: any): string {
	if (value === null || value === undefined) {
		return "";
	}
	return String(value).trim();
}

function getCurrentUserIdSafe(): string {
	const storeUserId = normalizeId(
		userStore.userInfo?.userId || userStore.userInfo?.id
	);
	if (storeUserId) {
		return storeUserId;
	}

	const cachedUserInfo = uni.getStorageSync("userInfo") || {};
	return normalizeId(cachedUserInfo.userId || cachedUserInfo.id);
}

// 判断是否是商品所有者
const isOwner = computed(() => {
	const currentUserId = getCurrentUserIdSafe();
	const ownerId = normalizeId(
		productOwnerId.value ||
			product.value.userId ||
			product.value.sellerId ||
			product.value.ownerId ||
			product.value.publisherId ||
			product.value.createUserId
	);
	if (!currentUserId || !ownerId) {
		return false;
	}
	return currentUserId === ownerId;
});

// 商品是否在售（status=1）
const isProductOnSale = computed(() => Number(product.value.status) === 1);

// 是否展示购买相关操作
const showPurchaseActions = computed(() => !isOwner.value && isProductOnSale.value);

// 不可购买时提示
const purchaseDisabledReason = computed(() => {
	if (isOwner.value) {
		return "这是你发布的商品";
	}
	if (Number(product.value.status) === 2) {
		return "商品已售出";
	}
	if (Number(product.value.status) === 0) {
		return "商品暂未上架";
	}
	return "当前不可购买";
});

// 卖家操作函数
function editProduct() {
	uni.navigateTo({
		url: `/pages/market/publish?id=${productId.value}`,
	});
}

function changeStatus(status: number) {
	const action = status === 1 ? "上架" : "下架";
	uni.showModal({
		title: `确认${action}`,
		content: `确定要${action}此商品吗？`,
		success: (res) => {
			if (res.confirm) {
				productApi
					.updateProductStatus(productId.value, status)
					.then(() => {
						product.value.status = status;
						uni.showToast({
							title: `${action}成功`,
							icon: "success",
						});
					})
					.catch(() => {
						uni.showToast({
							title: `${action}失败`,
							icon: "none",
						});
					});
			}
		},
	});
}

function deleteProduct() {
	uni.showModal({
		title: "确认删除",
		content: "删除后无法恢复，确定要删除此商品吗？",
		success: (res) => {
			if (res.confirm) {
				productApi
					.deleteProduct(productId.value)
					.then(() => {
						uni.showToast({
							title: "删除成功",
							icon: "success",
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					})
					.catch(() => {
						uni.showToast({
							title: "删除失败",
							icon: "none",
						});
					});
			}
		},
	});
}

onShow(() => {
	useThemePage();
	// 每次页面显示时同步收藏状态，防止从收藏页取消收藏后状态不同步
	if (productId.value && userStore.isLogin) {
		checkFavorite();
	}
});

onMounted(() => {
	console.log("=".repeat(60));
	console.log("📄 [detail.vue] 页面 onMounted 开始");
	console.log(
		"   当前页面路由:",
		getCurrentPages()
			.map((p: any) => p.route)
			.join(" -> ")
	);

	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1] as any;
	const options = currentPage.options || {};
	console.log("   页面参数 (options):", JSON.stringify(options));
	console.log("   商品ID (原始):", options.id);
	console.log("   是否秒杀渠道:", options.flash === "1");

	productId.value = options.id || "";
	// 判断是否秒杀渠道
	isFlashChannel.value = options.flash === "1";
	console.log("   isFlashChannel 设置为:", isFlashChannel.value);

	console.log("   productId.value 设置为:", productId.value);
	console.log("   pageLoading 初始值:", pageLoading.value);

	// #ifdef MP-WEIXIN
	// 微信小程序：显示分享菜单
	uni.showShareMenu({
		withShareTicket: true,
		menus: ["shareAppMessage", "shareTimeline"],
		success: () => {
			console.log("✅ [detail.vue] 微信分享菜单显示成功");
		},
		fail: (err: any) => {
			// 在开发环境中，微信开发者工具默认禁用分享功能，这是正常的
			// 只在非 "banned" 错误时才输出警告
			if (err.errMsg && !err.errMsg.includes("banned")) {
				console.warn("⚠️ [detail.vue] 微信分享菜单显示失败:", err);
			} else {
				console.log("[detail.vue] 微信分享菜单在开发环境中被禁用（正常现象）");
			}
		},
	});
	// #endif

	// 校验 productId 必须是有效的数字 ID（防止 "undefined" 字符串穿透到后端）
	const isValidId =
		productId.value &&
		productId.value !== "undefined" &&
		/^\d+$/.test(productId.value);
	if (isValidId) {
		console.log("✅ [detail.vue] 开始加载数据");
		loadProductDetail();
		checkFavorite();
		loadEvaluations();
		loadSimilarProducts();
	} else {
		console.error("❌ [detail.vue] 商品ID无效:", productId.value);
		console.log("   设置 pageLoading = false (因为 productId 无效)");
		pageLoading.value = false;
		uni.showToast({ title: "商品不存在", icon: "none" });
		setTimeout(() => uni.navigateBack(), 1500);
	}
	console.log("=".repeat(60));
});

// 页面卸载时清除定时器
onUnmounted(() => {
	if (countdownTimer) {
		clearInterval(countdownTimer);
		countdownTimer = null;
	}
});

function loadProductDetail() {
	console.log("⏳ [detail.vue] loadProductDetail 开始");
	console.log("   当前 productId:", productId.value);
	console.log("   是否秒杀渠道:", isFlashChannel.value);
	console.log("   当前 pageLoading:", pageLoading.value);

	pageLoading.value = true;
	console.log("   设置 pageLoading = true");

	// 根据渠道决定请求参数
	const channel = isFlashChannel.value ? "flash" : "normal";
	console.log(
		"📡 [detail.vue] 调用 productApi.getProductDetail(",
		productId.value,
		", { channel:",
		channel,
		" })"
	);

	productApi
		.getProductDetail(productId.value, { channel })
		.then((res: any) => {
			console.log("✅ [detail.vue] API 请求成功 (Promise resolved)");
			console.log("   完整响应:", JSON.stringify(res));
			console.log("   响应 code:", res?.code);
			console.log("   响应 message:", res?.message);
			console.log("   响应 data 类型:", typeof res?.data);
			console.log("   响应 data:", res?.data);

			const data = res?.data;
			if (!data) {
				console.error("❌ [detail.vue] 响应 data 为空或 null");
				console.log("   设置 pageLoading = false (无数据)");
				pageLoading.value = false;
				uni.showToast({
					title: "商品不存在",
					icon: "none",
				});
				return;
			}

			// 确保必需的字段存在，并处理字段映射（后端可能返回 sellerId/sellerNickname/sellerAvatar）
			console.log("🔧 [detail.vue] 开始处理商品数据");
			console.log("   原始 data.images:", data.images);
			console.log("   原始 data.coverImage:", data.coverImage);
			console.log("   原始 data.imageUrls:", data.imageUrls);
			console.log("   原始 data.isFlashSale:", data.isFlashSale);
			console.log("   原始 data.seckillPrice:", data.seckillPrice);

			// 处理图片数据
			let processedImages: string[] = [];
			if (data.images && Array.isArray(data.images) && data.images.length > 0) {
				processedImages = data.images;
				console.log(
					"   ✅ 使用 data.images，共",
					processedImages.length,
					"张图片"
				);
			} else if (
				data.imageUrls &&
				Array.isArray(data.imageUrls) &&
				data.imageUrls.length > 0
			) {
				processedImages = data.imageUrls;
				console.log(
					"   ✅ 使用 data.imageUrls，共",
					processedImages.length,
					"张图片"
				);
			} else if (data.coverImage) {
				processedImages = [data.coverImage];
				console.log("   ✅ 使用 data.coverImage 作为单张图片");
			} else {
				console.warn("   ⚠️ 没有找到任何图片数据！");
			}

			console.log("   处理后的图片数组:", processedImages);
			console.log("   图片详情:");
			processedImages.forEach((url, index) => {
				console.log(`     [${index + 1}] ${url}`);
			});

			const normalizedOwnerId = normalizeId(
				data.sellerId ||
					data.userId ||
					data.ownerId ||
					data.publisherId ||
					data.createUserId
			);

			product.value = {
				...data,
				// 卖家信息字段映射（后端返回的字段名可能是 sellerId，需要映射为 userId）
				userId: normalizedOwnerId,
				userName: data.sellerNickname || data.userName || "未知用户",
				userAvatar:
					data.sellerAvatar || data.userAvatar || "/static/images/user.png",
				// 图片处理
				images: processedImages,
				coverImage:
					data.coverImage || processedImages[0] || "/static/images/empty.png",
				// 时间字段映射（后端可能返回 createTime/updateTime）
				createdAt:
					data.createTime ||
					data.createdAt ||
					data.updateTime ||
					data.updatedAt ||
					"",
				updatedAt:
					data.updateTime ||
					data.updatedAt ||
					data.createTime ||
					data.createdAt ||
					"",
				// 其他字段处理
				creditScore:
					data.sellerCreditScore ||
					data.creditScore ||
					data.creditLevel === "优秀"
						? 95
						: 85,
			};

			productOwnerId.value = normalizedOwnerId;

			console.log("✅ [detail.vue] 商品数据处理完成");
			console.log("   product.value:", JSON.stringify(product.value));
			console.log("   product.value.images:", product.value.images);
			console.log("   product.value.coverImage:", product.value.coverImage);
			console.log("   product.value.title:", product.value.title);
			console.log("   product.value.price:", product.value.price);
			console.log("   product.value.isFlashSale:", product.value.isFlashSale);
			console.log("   product.value.seckillPrice:", product.value.seckillPrice);

			// 📊 统计数据日志
			console.log("📊 [浏览统计-前端] 商品统计数据");
			console.log("   productId:", productId.value);
			console.log("   浏览次数 (viewCount):", data.viewCount || 0);
			console.log("   收藏人数 (favoriteCount):", data.favoriteCount || 0);

			console.log("   设置 pageLoading = false (加载成功)");
			pageLoading.value = false;

			// 设置导航栏标题
			console.log("📝 [detail.vue] 设置导航栏标题:", data.title || "商品详情");
			uni.setNavigationBarTitle({
				title: data.title || "商品详情",
			});

			// 如果是秒杀渠道，启动倒计时并检查购买资格
			if (isFlashChannel.value) {
				if (product.value.endTime) {
					startCountdown(product.value.endTime);
				}
				checkSeckillEligibility();
			}

			// 加载卖家其他商品（使用映射后的 userId）
			if (product.value.userId) {
				console.log(
					"👤 [detail.vue] 加载卖家其他商品, userId:",
					product.value.userId
				);
				loadSellerProducts(product.value.userId);
			} else {
				console.warn("⚠️  [detail.vue] 没有 userId，跳过加载卖家其他商品");
				console.log("   data.userId:", data.userId);
				console.log("   data.sellerId:", data.sellerId);
				console.log("   product.value.userId:", product.value.userId);
			}
		})
		.catch((err) => {
			console.error("❌ [detail.vue] API 请求失败 (Promise rejected)");
			console.error("   错误对象:", err);
			console.error("   错误消息:", err?.message);
			console.error("   错误堆栈:", err?.stack);
			console.error("   错误名称:", err?.name);

			console.log("   设置 pageLoading = false (请求失败)");
			pageLoading.value = false;
			uni.showToast({
				title: "加载失败，请重试",
				icon: "none",
			});
		})
		.finally(() => {
			console.log("🏁 [detail.vue] loadProductDetail Promise settled (finally)");
			console.log("   最终 pageLoading 值:", pageLoading.value);
		});
}

// 加载商品评价
function loadEvaluations() {
	console.log("📊 [detail.vue] loadEvaluations 开始, productId:", productId.value);
	evaluationApi
		.getProductEvaluations(productId.value, { page: 1, pageSize: 3 })
		.then((res: any) => {
			console.log("✅ [detail.vue] 评价数据加载成功:", res.data);
			const data = res.data || { list: [], total: 0, averageRating: 0, totalCount: 0 };
			evaluationData.value = {
				...data,
				list: (data.list || []).map((item: any) => ({
					...item,
					id: item.id || item.evaluationId || item.evalId,
					fromUserName:
						item.fromUserName || item.evaluatorName || item.evaluatorNickname || "匿名用户",
					fromUserAvatar: item.fromUserAvatar || item.evaluatorAvatar || "",
					tags: normalizeStringArray(item.tags),
					images: normalizeStringArray(item.images),
					appendImages: normalizeStringArray(item.appendImages),
				})),
			};
		})
		.catch((err) => {
			console.warn("⚠️  [detail.vue] 评价数据加载失败:", err);
		});
}

function normalizeStringArray(value: unknown): string[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === "string" && !!item.trim());
	}
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				return parsed.filter((item): item is string => typeof item === "string" && !!item.trim());
			}
		} catch (error) {
			// ignore invalid json and fall back to comma split
		}
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [];
}

// 加载卖家其他商品
function loadSellerProducts(userId: string) {
	productApi
		.getSellerProducts(userId, {
			page: 1,
			pageSize: 10,
			excludeProductId: Number(productId.value),
		})
		.then((res: any) => {
			sellerProducts.value = (res.data?.list || []).map((item: any) =>
				ensureCoverImage(item)
			);
		})
		.catch(() => {
			// 忽略错误
		});
}

// 加载相似商品
function loadSimilarProducts() {
	console.log("🔍 [detail.vue] loadSimilarProducts 开始, productId:", productId.value);
	productApi
		.getSimilarProducts(productId.value, { limit: 6 })
		.then((res: any) => {
			console.log("✅ [detail.vue] 相似商品加载成功, 数量:", res.data?.length || 0);
			similarProducts.value = (res.data || []).map((item: any) =>
				ensureCoverImage(item)
			);
		})
		.catch((err: any) => {
			console.warn("⚠️  [detail.vue] 相似商品加载失败:", err);
		});
}

function ensureCoverImage(item: any): any {
	return {
		...item,
		coverImage:
			item.coverImage ||
			item.coverImageUrl ||
			item.imageUrl ||
			item.images?.[0] ||
			item.imageUrls?.[0] ||
			"/static/images/empty.png",
	};
}

function checkFavorite() {
	console.log("❤️ [detail.vue] checkFavorite 开始, productId:", productId.value);
	console.log("   用户登录状态:", userStore.isLogin);
	if (!userStore.isLogin) {
		console.log("   用户未登录，跳过检查收藏状态");
		return;
	}

	favoriteApi
		.checkFavorite(productId.value)
		.then((res: any) => {
			const isFav = !!res?.data;
			console.log("   收藏状态:", isFav, "原始响应:", res);
			isFavorited.value = isFav;
		})
		.catch((err: any) => {
			console.warn("   检查收藏状态失败:", err);
		});
}

function previewImage(index: number) {
	uni.previewImage({
		urls: product.value.images,
		current: index.toString(),
	});
}

function toggleFavorite() {
	if (!userStore.checkLogin()) return;

	if (isFavorited.value) {
		favoriteApi
			.cancelFavorite(productId.value)
			.then(() => {
				isFavorited.value = false;
				// 前端乐观更新收藏数
				product.value.favoriteCount = Math.max(
					0,
					(product.value.favoriteCount || 0) - 1
				);
				uni.showToast({ title: "已取消收藏", icon: "success" });
			})
			.catch(() => {});
	} else {
		favoriteApi
			.addFavorite(productId.value)
			.then(() => {
				isFavorited.value = true;
				// 前端乐观更新收藏数
				product.value.favoriteCount = (product.value.favoriteCount || 0) + 1;
				uni.showToast({ title: "收藏成功", icon: "success" });
			})
			.catch(() => {});
	}
}

function shareProduct() {
	// #ifdef MP-WEIXIN
	// 微信小程序环境：引导用户使用右上角分享
	uni.showModal({
		title: "分享提示",
		content: '请点击右上角菜单，选择"转发"给微信好友',
		showCancel: false,
		confirmText: "知道了",
		success: () => {
			// 显示分享菜单（确保右上角按钮可见）
			uni.showShareMenu({
				withShareTicket: true,
				menus: ["shareAppMessage", "shareTimeline"],
				fail: (err: any) => {
					// 忽略开发环境中的 "banned" 错误
					if (!err.errMsg || !err.errMsg.includes("banned")) {
						console.warn("[detail.vue] 显示分享菜单失败:", err);
					}
				},
			});
		},
	});
	// #endif

	// #ifdef H5 || APP-PLUS
	// H5或App环境：使用分享管理器
	shareManager.shareProduct(product.value).catch(() => {
		uni.showToast({ title: "分享失败", icon: "none" });
	});
	// #endif
}

function goUserHome() {
	uni.navigateTo({
		url: `/pages/user/home?id=${product.value.userId}`,
	});
}

function goChat() {
	if (!userStore.checkLogin()) return;

	const sellerUserId = product.value.userId || product.value.sellerId;
	if (!sellerUserId) {
		uni.showToast({ title: "无法获取卖家信息", icon: "none" });
		return;
	}

	// 直接跳转到聊天页面，传入用户ID和商品ID
	// 注意：不能跳转到 message/index（tabbar页面），所以直接跳转到 chat 页面
	uni.navigateTo({
		url: `/pages/message/chat?userId=${sellerUserId}&productId=${productId.value}`,
	});
}

function goToSellerProducts() {
	uni.navigateTo({
		url: `/pages/user/home?id=${product.value.userId}&tab=products`,
	});
}

function goToEvaluationList() {
	uni.navigateTo({
		url: `/pages/market/evaluation-list?productId=${productId.value}`,
	});
}

function buyNow() {
	if (!userStore.checkLogin()) return;

	if (!showPurchaseActions.value) {
		uni.showToast({
			title: purchaseDisabledReason.value,
			icon: "none",
		});
		return;
	}

	uni.navigateTo({
		url: `/pages/order/create?productId=${productId.value}`,
	});
}

function formatTime(time: string) {
	if (!time) return "-";
	return formatDateTime(time, "YYYY-MM-DD HH:mm");
}

// 跳转到其他商品详情
function goToDetail(item: any) {
	if (item.id === productId.value) return;
	uni.navigateTo({
		url: `/pages/market/detail?id=${item.id}`,
	});
}

// 举报相关
function showReportModal() {
	if (!userStore.checkLogin()) return;
	reportModalVisible.value = true;
}

function closeReportModal() {
	reportModalVisible.value = false;
	selectedReportReason.value = null;
	reportDescription.value = "";
}

function selectReason(reason: number) {
	selectedReportReason.value = reason;
}

function getReasonIcon(reason: number): string {
	const iconMap: Record<number, string> = {
		[ReportReason.FRAUD]: "🚫",
		[ReportReason.PORNOGRAPHY]: "⚠️",
		[ReportReason.SPAM]: "📢",
		[ReportReason.OTHER]: "❓",
	};
	return iconMap[reason] || "❓";
}

function onReportDescInput(e: any) {
	reportDescription.value = e.detail.value;
}

async function submitReport() {
	if (selectedReportReason.value === null) {
		uni.showToast({ title: "请选择举报原因", icon: "none" });
		return;
	}

	// 检查敏感词
	const checkResult = await checkSensitiveWord(
		reportDescription.value,
		SensitiveCheckType.COMMENT
	);
	if (checkResult && !checkResult.passed) {
		return;
	}

	// 使用过滤后的内容
	const filteredDesc = checkResult?.filteredContent || reportDescription.value;

	// 如果有敏感词被过滤，显示提示
	if (checkResult?.hasSensitiveWord) {
		uni.showToast({
			title: "已自动过滤敏感词",
			icon: "none",
			duration: 1500,
		});
	}

	reportApi
		.createReport({
			reportedUserId: product.value.userId,
			targetType: 2, // ReportType.PRODUCT
			targetId: Number(productId.value),
			reason: selectedReportReason.value as ReportReason,
			description: filteredDesc,
		})
		.then(() => {
			uni.showToast({ title: "举报已提交", icon: "success" });
			closeReportModal();
		})
		.catch(() => {
			uni.showToast({ title: "提交失败", icon: "none" });
		});
}

// ========== 秒杀相关函数 ==========

// 启动倒计时
function startCountdown(endTimeStr: string) {
	console.log("⏰ [detail.vue] 启动倒计时, 结束时间:", endTimeStr);

	const endTime = new Date(endTimeStr).getTime();

	// 立即执行一次
	updateCountdown(endTime);

	// 每秒更新
	countdownTimer = setInterval(() => {
		updateCountdown(endTime);
	}, 1000);
}

// 更新倒计时
function updateCountdown(endTime: number) {
	const now = new Date().getTime();
	const distance = endTime - now;

	if (distance > 0) {
		const h = Math.floor(distance / (1000 * 60 * 60));
		const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		const s = Math.floor((distance % (1000 * 60)) / 1000);

		countdownHours.value = h.toString().padStart(2, "0");
		countdownMinutes.value = m.toString().padStart(2, "0");
		countdownSeconds.value = s.toString().padStart(2, "0");
	} else {
		// 倒计时结束
		countdownHours.value = "00";
		countdownMinutes.value = "00";
		countdownSeconds.value = "00";

		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}

		// 刷新商品状态
		canBuy.value = false;
		cannotBuyReason.value = "活动已结束";
	}
}

// 检查秒杀购买资格
function checkSeckillEligibility() {
	console.log("🔍 [detail.vue] 检查秒杀资格, productId:", productId.value);

	if (!userStore.isLogin) {
		console.log("   用户未登录，无法检查资格");
		canBuy.value = true; // 未登录允许进入，点击购买时再提示登录
		return;
	}

	activityApi
		.checkSeckillEligibility(productId.value)
		.then((res: any) => {
			console.log("   资格检查结果:", res.data);
			canBuy.value = !!res.data?.canBuy;
			cannotBuyReason.value = canBuy.value
				? ""
				: res.data?.reason || "当前不可参与秒杀";
		})
		.catch((err: any) => {
			console.warn("   检查资格失败:", err);
			canBuy.value = false;
			cannotBuyReason.value = err?.message || "秒杀资格校验失败";
		});
}

// 秒杀抢购
function handleSeckill() {
	if (!userStore.checkLogin()) return;
	if (!canBuy.value || isSeckillLoading.value) return;

	console.log("⚡ [detail.vue] 开始秒杀抢购, productId:", productId.value);

	isSeckillLoading.value = true;

	activityApi
		.seckillBuy(productId.value, {
			quantity: 1,
			remark: "",
		})
		.then((res: any) => {
			console.log("✅ [detail.vue] 秒抢购成功:", res.data);
			uni.showToast({ title: "抢购成功！", icon: "success" });

			// 跳转到订单详情
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/order/detail?id=${res.data.orderId}`,
				});
			}, 1500);
		})
		.catch((err: any) => {
			console.error("❌ [detail.vue] 秒杀抢购失败:", err);
			uni.showToast({
				title: err?.message || "抢购失败，请重试",
				icon: "none",
			});

			// 抢购失败后刷新资格状态
			checkSeckillEligibility();
		})
		.finally(() => {
			isSeckillLoading.value = false;
		});
}

// 切换到秒杀渠道
function switchToFlash() {
	uni.redirectTo({
		url: `/pages/market/detail?id=${productId.value}&flash=1`,
	});
}

// 切换到正常渠道
function switchToNormal() {
	uni.redirectTo({
		url: `/pages/market/detail?id=${productId.value}`,
	});
}

// #ifdef MP-WEIXIN
// 配置微信小程序分享
onShareAppMessage(() => {
	return {
		title: product.value.title || "商品分享",
		path: `/pages/market/detail?id=${productId.value}`,
		imageUrl: product.value.coverImage || product.value.images?.[0] || "",
	};
});

// 配置分享到朋友圈
onShareTimeline(() => {
	return {
		title: product.value.title || "商品分享",
		query: `id=${productId.value}`,
		imageUrl: product.value.coverImage || product.value.images?.[0] || "",
	};
});
// #endif
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.detail-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-color-page);
	animation: fadeIn 0.3s ease-in-out;
}

.scroll-view {
	flex: 1;
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

// 渐入向上动画
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

// 渐入动画
@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.animate-fade-in-up {
	animation: fadeInUp 0.6s ease-out forwards;
	opacity: 0;
}

// 图片容器 - 不铺满显示
.images-container {
	padding: var(--spacing-md);
	background: var(--bg-color-card);
	margin-bottom: var(--spacing-md);
}

.image-swiper {
	width: 100%;
	height: 750rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: var(--bg-color-page);
	box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.04),
		-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.7);
	border: 2rpx solid rgba(255, 255, 255, 0.7);

	.product-image {
		width: 100%;
		height: 100%;
		background: var(--bg-color-page);
	}
}

.product-section {
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.price-row {
		display: flex;
		align-items: baseline;
		margin-bottom: var(--spacing-md);

		.price {
			font-size: 28px;
			font-weight: 600;
			color: var(--error-color);
		}

		.original-price {
			margin-left: var(--spacing-sm);
			font-size: var(--font-size-base);
			color: var(--text-color-tertiary);
			text-decoration: line-through;
		}
	}

	.title {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-color-primary);
		line-height: 1.4;
		display: block;
		margin-bottom: var(--spacing-md);
	}

	.tags {
		display: flex;
		gap: var(--spacing-sm);

		.tag {
			padding: var(--spacing-xs) var(--spacing-sm);
			background: var(--primary-color-faded);
			color: var(--primary-color);
			font-size: var(--font-size-sm);
			border-radius: var(--border-radius-base);
		}
	}

	// 秒杀价格区域
	.flash-price-box {
		margin-bottom: var(--spacing-md);
		padding: 20rpx 24rpx;
		background: linear-gradient(
			135deg,
			rgba(255, 245, 240, 0.8) 0%,
			rgba(255, 255, 255, 0.6) 100%
		);
		border-radius: 24rpx;
		box-shadow: 6rpx 6rpx 14rpx rgba(0, 0, 0, 0.06),
			-3rpx -3rpx 10rpx rgba(255, 255, 255, 0.8);
		border: 2rpx solid rgba(255, 255, 255, 0.8);

		.flash-tag {
			display: inline-block;
			padding: 6rpx 16rpx;
			background: linear-gradient(
				135deg,
				var(--error-color) 0%,
				var(--danger-color) 100%
			);
			color: var(--text-color-inverse);
			font-size: 22rpx;
			font-weight: bold;
			border-radius: 12rpx;
			margin-bottom: 16rpx;
		}

		.flash-price-row {
			display: flex;
			align-items: baseline;
			gap: 12rpx;
			margin-bottom: 16rpx;

			.currency {
				font-size: 32rpx;
				color: var(--error-color);
				font-weight: bold;
			}

			.price {
				font-size: 56rpx;
				font-weight: bold;
				color: var(--error-color);
			}

			.original-price {
				font-size: 28rpx;
				color: var(--text-color-tertiary);
				text-decoration: line-through;
			}

			.discount {
				padding: 4rpx 12rpx;
				background: var(--bg-color-warm);
				color: var(--primary-color);
				font-size: 22rpx;
				border-radius: 12rpx;
				font-weight: bold;
			}
		}

		.stock-progress {
			margin-bottom: 12rpx;

			.progress-info {
				display: flex;
				justify-content: space-between;
				margin-bottom: 8rpx;

				.stock-text {
					font-size: 24rpx;
					color: var(--error-color);
					font-weight: bold;
				}

				.stock-remain {
					font-size: 22rpx;
					color: var(--text-color-tertiary);
				}
			}

			.progress-bar {
				height: 12rpx;
				background: var(--primary-color-alpha-15);
				border-radius: 6rpx;
				overflow: hidden;

				.progress-fill {
					height: 100%;
					background: linear-gradient(
						90deg,
						var(--warning-color) 0%,
						var(--warning-color) 100%
					);
					border-radius: 6rpx;
					transition: width 0.3s ease;
				}
			}
		}

		.flash-tips {
			.tip-item {
				font-size: 22rpx;
				color: var(--primary-color);
			}
		}
	}

	// 正常价格区域的秒杀提示
	.price-row {
		display: flex;
		align-items: center;
		gap: 16rpx;
		padding: 20rpx 24rpx;
		background: linear-gradient(
			135deg,
			var(--primary-color-alpha-6) 0%,
			var(--primary-light-alpha-4) 100%
		);
		border-radius: 24rpx;
		box-shadow: 6rpx 6rpx 14rpx rgba(0, 0, 0, 0.06),
			-3rpx -3rpx 10rpx rgba(255, 255, 255, 0.8);
		border: 2rpx solid rgba(255, 255, 255, 0.8);

		.flash-hint {
			margin-left: auto;
			padding: 8rpx 16rpx;
			background: linear-gradient(
				135deg,
				var(--error-color) 0%,
				var(--danger-color) 100%
			);
			color: var(--text-color-inverse);
			font-size: 22rpx;
			border-radius: 9999px;
			font-weight: bold;

			.hint-text {
				display: flex;
				align-items: center;
				gap: 4rpx;
			}
		}

		.price {
			font-size: 28px;
			font-weight: 600;
			color: var(--error-color);
		}

		.original-price {
			margin-left: var(--spacing-sm);
			font-size: var(--font-size-base);
			color: var(--text-color-tertiary);
			text-decoration: line-through;
		}
	}
}

.seller-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.seller-left {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		margin-right: var(--spacing-sm);
	}

	.seller-info {
		flex: 1;

		.name {
			font-size: var(--font-size-lg);
			font-weight: 500;
			color: var(--text-color-primary);
			display: block;
			margin-bottom: var(--spacing-xs);
		}

		.credit-info {
			display: flex;
			align-items: center;
			gap: var(--spacing-xs);

			.credit-score {
				font-size: var(--font-size-sm);
				color: var(--text-color-secondary);
			}
		}
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--primary-color-alpha-10);
		border-radius: var(--spacing-md);
		color: var(--primary-color);
		font-size: var(--font-size-sm);
	}
}

.desc-section,
.info-section {
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.section-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-color-primary);
		display: block;
		margin-bottom: var(--spacing-md);
	}

	.desc-text {
		font-size: var(--font-size-base);
		color: var(--text-color-secondary);
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		padding: var(--spacing-sm) 0;
		border-bottom: 1px solid var(--border-color-light);

		&:last-child {
			border-bottom: none;
		}

		.label {
			font-size: var(--font-size-base);
			color: var(--text-color-tertiary);
		}

		.value {
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
		}
	}
}

.location-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.location-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);

		.location-text {
			font-size: var(--font-size-base);
			color: var(--text-color-secondary);
		}
	}

	.distance {
		font-size: var(--font-size-sm);
		color: var(--text-color-tertiary);
	}
}

// 交易安全保障
.safety-section {
	background: linear-gradient(
		135deg,
		var(--success-color-bg) 0%,
		var(--bg-color-card) 100%
	);
	border: 1px solid var(--success-color-alpha-30);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);
	border-radius: var(--border-radius-lg);

	.section-header-small {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-bottom: 16rpx;

		.section-title-small {
			font-size: var(--font-size-base);
			font-weight: 600;
			color: var(--success-color);
		}
	}

	.safety-tips {
		.tip-item {
			display: flex;
			align-items: center;
			gap: 12rpx;
			margin-bottom: 12rpx;

			&:last-child {
				margin-bottom: 0;
			}

			.tip-icon {
				font-size: 32rpx;
			}

			.tip-text {
				font-size: 24rpx;
				color: var(--text-color-secondary);
				flex: 1;
			}
		}
	}
}

// 小标题区域
.section-header-with-more {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;

	.section-header-small {
		display: flex;
		align-items: center;
		gap: 8rpx;

		.section-title-small {
			font-size: var(--font-size-base);
			font-weight: 600;
			color: var(--text-color-primary);
		}

		.rating-badge {
			display: flex;
			align-items: center;
			gap: 4rpx;
			padding: 2rpx 8rpx;
			background: var(--bg-color-warm);
			border-radius: 8rpx;

			.rating-score {
				font-size: 24rpx;
				font-weight: 600;
				color: var(--warning-color);
			}
		}

		.evaluation-count {
			font-size: 24rpx;
			color: var(--text-color-tertiary);
		}
	}

	.more-text {
		display: flex;
		align-items: center;
		gap: 4rpx;
		font-size: 24rpx;
		color: var(--text-color-tertiary);
	}
}

// 商品评价
.evaluation-section {
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.evaluation-list {
		.evaluation-item {
			padding: 20rpx 24rpx;
			margin-bottom: 16rpx;
			background: linear-gradient(
				135deg,
				rgba(240, 248, 255, 0.6) 0%,
				rgba(255, 255, 255, 0.8) 100%
			);
			border-radius: 20rpx;
			box-shadow: 4rpx 4rpx 10rpx rgba(0, 0, 0, 0.04),
				-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.7);
			border: 2rpx solid rgba(255, 255, 255, 0.7);

			&:last-child {
				margin-bottom: 0;
			}

			.evaluation-header {
				display: flex;
				align-items: center;
				margin-bottom: 12rpx;

				.evaluation-avatar {
					width: 60rpx;
					height: 60rpx;
					border-radius: 50%;
					margin-right: 12rpx;
					box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06);
					border: 2rpx solid rgba(255, 255, 255, 0.6);
				}

				.evaluation-user {
					flex: 1;

					.evaluation-name {
						font-size: 26rpx;
						color: var(--text-color-primary);
						display: block;
						margin-bottom: 4rpx;
					}

					.evaluation-rating {
						display: flex;
						gap: 4rpx;
					}
				}
			}

			.evaluation-content {
				font-size: 26rpx;
				color: var(--text-color-secondary);
				line-height: 1.5;
				display: block;
				margin-bottom: 8rpx;
			}

				.evaluation-tags {
					display: flex;
					gap: 8rpx;
					margin-bottom: 8rpx;

				.eval-tag {
					padding: 6rpx 14rpx;
					background: linear-gradient(
						135deg,
						var(--primary-color-alpha-10) 0%,
						var(--primary-light-alpha-8) 100%
					);
					color: var(--text-color-tertiary);
					font-size: 22rpx;
					border-radius: 12rpx;
					box-shadow: 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.03),
						-1rpx -1rpx 4rpx rgba(255, 255, 255, 0.6);
						border: 1rpx solid rgba(255, 255, 255, 0.6);
					}
				}

				.append-evaluation {
					padding: 12rpx 14rpx;
					background: rgba(142, 197, 232, 0.12);
					border-radius: 14rpx;

					.append-label {
						display: inline-block;
						margin-right: 10rpx;
						color: var(--primary-color);
						font-size: 22rpx;
						font-weight: 600;
					}

					.append-content {
						color: var(--text-color-secondary);
						font-size: 24rpx;
						line-height: 1.5;
					}
				}
			}
		}
	}

// 卖家其他商品
.seller-products-section {
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);
	border-radius: var(--border-radius-lg);

	.seller-products-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
		padding-bottom: 16rpx;
		border-bottom: 1px solid var(--border-color-light);

		.seller-info-row {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 16rpx;

			.seller-avatar {
				width: 64rpx;
				height: 64rpx;
				border-radius: 50%;
				background: var(--bg-color-page);
				border: 2px solid var(--border-color-light);
			}

			.seller-details {
				display: flex;
				flex-direction: column;
				gap: 6rpx;

				.seller-name {
					font-size: 28rpx;
					font-weight: 600;
					color: var(--text-color-primary);
				}

				.seller-meta {
					display: flex;
					align-items: center;
					gap: 12rpx;

					.credit-badge {
						display: flex;
						align-items: center;
						gap: 4rpx;
						padding: 2rpx 8rpx;
						background: linear-gradient(
							135deg,
							var(--bg-color-warm) 0%,
							var(--primary-color-alpha-10) 100%
						);
						border-radius: 8rpx;

						.credit-text {
							font-size: 20rpx;
							font-weight: 600;
							color: var(--warning-color);
						}
					}

					.product-count {
						font-size: 22rpx;
						color: var(--text-color-tertiary);
					}
				}
			}
		}

		.view-all-btn {
			display: flex;
			align-items: center;
			gap: 4rpx;
			padding: 8rpx 16rpx;
			background: var(--bg-color-page);
			border-radius: 20rpx;
			transition: all 0.2s ease;

			&:active {
				background: var(--bg-color-hover);
				transform: scale(0.95);
			}

			.view-all-text {
				font-size: 24rpx;
				color: var(--text-color-secondary);
			}
		}
	}

	.products-scroll {
		white-space: nowrap;

		.product-scroll-item {
			display: inline-block;
			width: 224rpx;
			margin-right: 16rpx;
			vertical-align: top;
			padding: 0;
			transition: all 0.2s ease;

			&:active {
				transform: scale(0.96);
			}

			&:last-child {
				margin-right: 0;
			}

			.seller-product-card {
				height: 100%;
				min-height: 380rpx;
				border-radius: var(--border-radius-lg);
				overflow: hidden;
				box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.04),
					-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.7);
			}
		}
	}
}

// 相似商品推荐
.similar-section {
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.similar-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16rpx;

		.similar-item {
			.similar-card {
				height: 100%;
				border-radius: var(--border-radius-lg);
				overflow: hidden;
				box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.04),
					-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.7);
			}
		}
	}
}

// 举报区域
.report-section {
	padding: 0 var(--spacing-md) var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.report-btn-enhanced {
		display: flex;
		align-items: center;
		padding: 24rpx;
		background: linear-gradient(
			135deg,
			var(--danger-color-alpha-5) 0%,
			var(--bg-color-card) 100%
		);
		border: 1px solid var(--danger-color-alpha-15);
		border-radius: 20rpx;
		box-shadow: 0 2rpx 8rpx var(--danger-color-alpha-8);
		transition: all 0.3s ease;

		&:active {
			transform: scale(0.98);
			box-shadow: 0 1rpx 4rpx var(--danger-color-alpha-10);
		}

		.report-btn-icon {
			width: 56rpx;
			height: 56rpx;
			background: linear-gradient(
				135deg,
				var(--error-color) 0%,
				var(--danger-color) 100%
			);
			border-radius: 12rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 16rpx;
			box-shadow: 0 4rpx 12rpx var(--danger-color-alpha-25);

			.icon-text {
				font-size: 32rpx;
			}
		}

		.report-btn-content {
			flex: 1;
			display: flex;
			flex-direction: column;

			.report-btn-title {
				font-size: 28rpx;
				font-weight: 600;
				color: var(--text-color-primary);
				margin-bottom: 4rpx;
			}

			.report-btn-subtitle {
				font-size: 22rpx;
				color: var(--text-color-secondary);
			}
		}

		.report-btn-arrow {
			margin-left: 8rpx;
		}
	}

	.report-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 20rpx;
		background: var(--bg-color-card);
		border-radius: var(--border-radius-base);
		font-size: 26rpx;
		color: var(--text-color-tertiary);
	}
}

.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px var(--spacing-md);
	background: var(--bg-color-card);
	border-top: 1px solid var(--border-color-base);
	padding-bottom: calc(10px + env(safe-area-inset-bottom));
	z-index: 100;

	/* #ifdef H5 */
	@media (min-width: 768px) {
		left: 50%;
		right: auto;
		width: 430px;
		max-width: 100vw;
		margin-left: -215px;
	}
	/* #endif */

	// 卖家操作按钮组
	.owner-actions {
		display: flex;
		align-items: center;
		gap: 16rpx;
		width: 100%;

		.owner-action-btn {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 88rpx;
			background: var(--bg-color-page);
			border-radius: 9999px;
			font-size: 24rpx;
			color: var(--text-color-secondary);
			box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.08),
				-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
			border: 2rpx solid rgba(255, 255, 255, 0.5);
			transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

			&:active {
				transform: scale(0.95);
				box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.08),
					inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.4);
			}

			&.disabled {
				background: var(--bg-color-disabled);
				color: var(--text-color-tertiary);
				pointer-events: none;
			}

			&.primary {
				background: var(--primary-color);
				color: var(--text-color-inverse);

				&:active {
					background: var(--primary-color-dark);
					box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.1),
						inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.3);
				}
			}

			&.warning {
				background: var(--warning-color);
				color: var(--text-color-inverse);

				&:active {
					background: var(--warning-color);
					box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.1),
						inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.3);
				}
			}

			&.danger {
				background: var(--error-color);
				color: var(--text-color-inverse);

				&:active {
					background: var(--danger-color);
					box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.1),
						inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.3);
				}
			}
		}
	}

	.left-actions {
		display: flex;
		gap: 32rpx;

		.action-item {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 48rpx;
			height: 48rpx;
		}
	}

	.right-actions {
		display: flex;
		align-items: center;
		gap: 16rpx;

		.purchase-disabled-tip {
			padding: 0 24rpx;
			height: 64rpx;
			line-height: 64rpx;
			border-radius: 9999px;
			font-size: var(--font-size-sm);
			color: var(--text-color-tertiary);
			background: var(--bg-color-disabled);
		}

		.chat-btn {
			display: flex;
			align-items: center;
			gap: 6rpx;
			padding: 0 20rpx;
			height: 64rpx;
			background: var(--primary-color-alpha-10);
			border-radius: 9999px;
			color: var(--primary-color);
			font-size: var(--font-size-sm);
			font-weight: 500;
			box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.08),
				-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
			border: 2rpx solid rgba(255, 255, 255, 0.5);
			transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

			&:active {
				transform: scale(0.95);
				box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.08),
					inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.4);
			}
		}
	}

	.buy-btn {
		padding: 0 36rpx;
		height: 64rpx;
		background: var(--primary-color);
		color: var(--bg-color-card);
		font-size: var(--font-size-base);
		border-radius: 9999px;
		border: 2rpx solid rgba(255, 255, 255, 0.5);
		line-height: 64rpx;
		box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.08),
			-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

		&:active {
			transform: scale(0.95);
			box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.1),
				inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.3);
		}
	}

	// 秒杀按钮
	.seckill-btn {
		flex: 1;
		height: 64rpx;
		background: linear-gradient(
			135deg,
			var(--error-color) 0%,
			var(--danger-color) 100%
		);
		color: var(--text-color-inverse);
		font-size: 32rpx;
		font-weight: bold;
		border-radius: 9999px;
		border: 2rpx solid rgba(255, 255, 255, 0.5);
		line-height: 64rpx;
		padding: 0;
		box-shadow: 4rpx 4rpx 12rpx rgba(255, 71, 87, 0.15),
			-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

		&.disabled {
			background: var(--bg-color-disabled);
			box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.06),
				-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.4);
		}

		&:active:not(.disabled) {
			transform: scale(0.95);
			box-shadow: inset 2rpx 2rpx 6rpx rgba(255, 71, 87, 0.2),
				inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.3);
		}
	}
}

// 秒杀倒计时条
.flash-countdown-bar {
	padding: 20rpx var(--spacing-md);
	background: linear-gradient(135deg, var(--error-color) 0%, var(--danger-color) 100%);
	margin-bottom: var(--spacing-md);

	.countdown-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16rpx;

		.countdown-label {
			font-size: 26rpx;
			color: var(--text-color-inverse);
			font-weight: bold;
		}

		.countdown-time {
			display: flex;
			align-items: center;
			gap: 8rpx;

			.time-block {
				display: inline-block;
				min-width: 48rpx;
				height: 48rpx;
				line-height: 48rpx;
				text-align: center;
				font-size: 28rpx;
				font-weight: bold;
				color: var(--error-color);
				background: var(--bg-color-card);
				border-radius: 8rpx;
				padding: 0 8rpx;
			}

			.time-separator {
				font-size: 28rpx;
				font-weight: bold;
				color: var(--text-color-inverse);
			}
		}
	}
}

// 举报弹窗
.report-modal-wrapper {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(4rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.3s ease;

	.report-modal-content {
		width: 640rpx;
		max-height: 80vh;
		background: var(--bg-color-card);
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.15);
		animation: slideUp 0.3s ease;
		display: flex;
		flex-direction: column;
		overscroll-behavior: contain;

		// 滚动容器
		.report-modal-scroll {
			flex: 1;
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
			overscroll-behavior: contain;
		}

		// 头部
		.report-modal-header {
			position: relative;
			padding: 32rpx 32rpx 24rpx;
			text-align: center;
			background: linear-gradient(
				135deg,
				var(--danger-color-alpha-5) 0%,
				var(--bg-color-card) 100%
			);
			border-bottom: 1px solid var(--danger-color-alpha-15);

			.report-header-icon {
				width: 80rpx;
				height: 80rpx;
				margin: 0 auto 16rpx;
				background: linear-gradient(
					135deg,
					var(--error-color) 0%,
					var(--danger-color) 100%
				);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 8rpx 24rpx var(--danger-color-alpha-30);

				.icon-warning {
					font-size: 40rpx;
				}
			}

			.report-modal-title {
				font-size: 36rpx;
				font-weight: 700;
				color: var(--text-color-primary);
				letter-spacing: 1rpx;
			}

			.report-close-btn {
				position: absolute;
				top: 24rpx;
				right: 24rpx;
				width: 48rpx;
				height: 48rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background: rgba(0, 0, 0, 0.05);
				border-radius: 50%;
				transition: all 0.2s ease;

				&:active {
					background: rgba(0, 0, 0, 0.1);
					transform: scale(0.9);
				}
			}
		}

		// 提示信息
		.report-tip {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8rpx;
			padding: 16rpx 32rpx;
			background: var(--primary-color-alpha-10);
			border-bottom: 1px solid var(--primary-color-alpha-20);

			.tip-text {
				font-size: 24rpx;
				color: var(--info-color);
			}
		}

		// 举报原因
		.report-reasons-container {
			padding: 24rpx 32rpx;

			.section-label {
				display: block;
				font-size: 28rpx;
				font-weight: 600;
				color: var(--text-color-primary);
				margin-bottom: 16rpx;
			}

			.reasons-grid {
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: 16rpx;

				.reason-card {
					position: relative;
					padding: 24rpx 16rpx;
					background: var(--bg-color-page);
					border: 2px solid var(--border-color-light);
					border-radius: 12rpx;
					display: flex;
					flex-direction: column;
					align-items: center;
					transition: all 0.3s ease;

					&:active {
						transform: scale(0.95);
					}

					&.reason-active {
						background: linear-gradient(
							135deg,
							var(--danger-color-alpha-5) 0%,
							var(--bg-color-card) 100%
						);
						border-color: var(--error-color);
						box-shadow: 0 4rpx 16rpx var(--danger-color-alpha-20);

						.reason-icon-wrapper {
							background: linear-gradient(
								135deg,
								var(--error-color) 0%,
								var(--danger-color) 100%
							);
							box-shadow: 0 4rpx 12rpx var(--danger-color-alpha-30);
						}

						.reason-label {
							color: var(--error-color);
							font-weight: 600;
						}
					}

					.reason-icon-wrapper {
						width: 64rpx;
						height: 64rpx;
						background: var(--bg-color-page);
						border-radius: 16rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						margin-bottom: 12rpx;
						transition: all 0.3s ease;

						.reason-icon {
							font-size: 36rpx;
						}
					}

					.reason-label {
						font-size: 24rpx;
						color: var(--text-color-secondary);
						text-align: center;
					}

					.reason-check-mark {
						position: absolute;
						top: 8rpx;
						right: 8rpx;
						width: 32rpx;
						height: 32rpx;
						background: var(--error-color);
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						box-shadow: 0 2rpx 8rpx var(--danger-color-alpha-40);
						animation: popIn 0.3s ease;
					}
				}
			}
		}

		// 详细描述
		.report-description-container {
			padding: 0 32rpx 24rpx;

			.desc-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 12rpx;

				.section-label {
					font-size: 28rpx;
					font-weight: 600;
					color: var(--text-color-primary);
				}

				.char-count {
					font-size: 22rpx;
					color: var(--text-color-secondary);
				}
			}

			.report-textarea {
				width: 100%;
				min-height: 160rpx;
				padding: 16rpx;
				background: var(--bg-color-page);
				border: 1px solid var(--border-color-light);
				border-radius: 12rpx;
				font-size: 26rpx;
				color: var(--text-color-primary);
				line-height: 1.6;
				box-sizing: border-box;
				transition: all 0.3s ease;

				&:focus {
					background: var(--bg-color-card);
					border-color: var(--error-color);
					box-shadow: 0 0 0 4rpx var(--danger-color-alpha-10);
				}
			}
		}

		// 操作按钮
		.report-modal-actions {
			display: flex;
			gap: 16rpx;
			padding: 24rpx 32rpx 32rpx;
			border-top: 1px solid var(--border-color-light);
			flex-shrink: 0;

			.action-btn-cancel,
			.action-btn-submit {
				flex: 1;
				height: 88rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 9999px;
				transition: all 0.3s ease;

				&:active {
					transform: scale(0.96);
				}
			}

			.action-btn-cancel {
				background: var(--bg-color-page);
				border: 1px solid var(--border-color-base);

				.btn-text-cancel {
					font-size: 28rpx;
					color: var(--text-color-secondary);
					font-weight: 500;
				}
			}

			.action-btn-submit {
				background: linear-gradient(
					135deg,
					var(--error-color) 0%,
					var(--danger-color) 100%
				);
				box-shadow: 0 4rpx 16rpx var(--danger-color-alpha-30);

				.btn-submit-content {
					display: flex;
					align-items: center;
					gap: 8rpx;

					.btn-text-submit {
						font-size: 28rpx;
						color: var(--text-color-inverse);
						font-weight: 600;
					}
				}

				&.btn-disabled {
					background: var(--bg-color-disabled);
					box-shadow: none;
					opacity: 0.6;
				}
			}
		}
	}
}

// 弹窗动画
@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(60rpx) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes popIn {
	0% {
		opacity: 0;
		transform: scale(0);
	}
	50% {
		transform: scale(1.2);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}

// 骨架屏样式
@keyframes shimmer {
	0% {
		background-position: -1000rpx 0;
	}
	100% {
		background-position: 1000rpx 0;
	}
}

.skeleton-shimmer {
	background: linear-gradient(90deg, #e8eef4 25%, #dce5ed 37%, #e8eef4 63%);
	background-size: 1000rpx 100%;
	animation: shimmer 2s infinite linear;
}

.skeleton-container {
	background: var(--bg-color-page);
}

.skeleton-banner {
	width: 100%;
	height: 750rpx;
	background: linear-gradient(135deg, #e8eef4 0%, #dce5ed 100%);
	margin-bottom: var(--spacing-md);
	border-radius: 0;
}

.skeleton-section {
	background: var(--bg-color-card);
	padding: var(--spacing-md);
	margin-bottom: var(--spacing-md);
	border-radius: 16rpx;

	.skeleton-price-row {
		display: flex;
		align-items: baseline;
		margin-bottom: var(--spacing-md);
		gap: var(--spacing-sm);

		.skeleton-price {
			width: 150rpx;
			height: 56rpx;
			border-radius: 16rpx;
		}

		.skeleton-original-price {
			width: 100rpx;
			height: 32rpx;
			border-radius: 12rpx;
		}
	}

	.skeleton-title {
		width: 100%;
		height: 52rpx;
		border-radius: 16rpx;
		margin-bottom: var(--spacing-md);
	}

	.skeleton-tags {
		display: flex;
		gap: var(--spacing-sm);

		.skeleton-tag {
			width: 80rpx;
			height: 36rpx;
			border-radius: 12rpx;
		}
	}

	.skeleton-user-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);

		.skeleton-avatar {
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			flex-shrink: 0;
			box-shadow: 4rpx 4rpx 10rpx rgba(0, 0, 0, 0.04),
				-2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
			border: 2rpx solid rgba(255, 255, 255, 0.6);
		}

		.skeleton-user-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: var(--spacing-xs);

			.skeleton-name {
				width: 150rpx;
				height: 36rpx;
				border-radius: 14rpx;
			}

			.skeleton-credit {
				width: 100rpx;
				height: 28rpx;
				border-radius: 10rpx;
			}
		}
	}

	.skeleton-section-title {
		width: 140rpx;
		height: 40rpx;
		border-radius: 14rpx;
		margin-bottom: var(--spacing-md);
	}

	.skeleton-desc {
		width: 100%;
		height: 32rpx;
		border-radius: 12rpx;
		margin-bottom: var(--spacing-sm);

		&:last-child {
			width: 60%;
			margin-bottom: 0;
		}
	}
}
</style>
