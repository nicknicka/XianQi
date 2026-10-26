<template>
	<view
		class="favorites-page service-redesign-page"
		:style="[themeStyle, pageAnimationStyle]"
	>
		<scroll-view
			class="scroll-view"
			scroll-y
			@scrolltolower="loadMore"
			:refresher-enabled="true"
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
		>
			<view class="collection-hero" :style="heroStyle">
				<view class="collection-hero__copy">
					<text class="collection-hero__eyebrow">我的收藏</text>
					<text class="collection-hero__title"
						>把心动商品整理成更有秩序的卡片墙</text
					>
					<text class="collection-hero__desc"
						>当前共
						{{ productList.length }} 件收藏，点击卡片可直达详情页。</text
					>
				</view>
				<view class="collection-hero__stat" :style="heroStatStyle">
					<text class="collection-hero__stat-value">{{
						productList.length
					}}</text>
					<text class="collection-hero__stat-label">items</text>
				</view>
			</view>

			<view
				v-if="productList.length === 0 && !loading"
				class="empty-state empty-animate"
			>
				<image
					class="empty-image"
					src="/static/images/favorites.png"
					mode="aspectFit"
				/>
				<text class="empty-text">暂无收藏</text>
			</view>

			<view v-else class="favorite-grid">
				<view
					v-for="(product, index) in productList"
					:key="product.id"
					class="favorite-card"
					:style="getCardAccentStyle(index)"
					@click="goDetail(product.id)"
				>
					<view class="favorite-card__media">
						<lazy-image
							class="favorite-card__image"
							:src="normalizeImageUrl(product.coverImage)"
							mode="aspectFill"
						/>
						<view class="favorite-card__overlay"></view>
						<view class="favorite-card__topbar">
							<view
								class="favorite-card__action"
								@click.stop="cancelFavorite(product.id)"
							>
								<uni-icons type="closeempty" size="14" color="#fff" />
							</view>
						</view>
						<view class="favorite-card__price-tag">
							<text class="favorite-card__price">{{
								formatPrice(product.price)
							}}</text>
						</view>
					</view>

					<view class="favorite-card__content">
						<text class="favorite-card__title text-ellipsis-2">{{
							product.title
						}}</text>
						<view class="favorite-card__meta">
							<text
								class="favorite-card__condition"
								:class="getConditionTone(product.condition)"
							>
								{{ getConditionLabel(product.condition) }}
							</text>
							<text class="favorite-card__dot">·</text>
							<text class="favorite-card__hint">点开看详情</text>
						</view>
					</view>
				</view>
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
import { ref, onMounted, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { favoriteApi } from "@/api/favorite";
import { usePageAnimation } from "@/composables/usePageAnimation";
import { useServiceNavigation } from "@/composables/useServiceNavigation";
import { useThemePage, useThemeStyle, useThemeColors, addAlpha } from "@/utils/theme";
import { getConditionLabel } from "@/types";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import { normalizeImageUrl } from "@/utils/image";
import type { IdLike } from "@/utils/id";

useServiceNavigation();

interface Product {
	id: IdLike;
	title: string;
	coverImage: string;
	price: number;
	condition: string;
}

const { themeStyle } = useThemeStyle();
const { primaryColor } = useThemeColors();
const productList = ref<Product[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 20;

const cardAccents = [
	{ start: "#ff7a59", end: "#ffb36b" },
	{ start: "#3b82f6", end: "#8b5cf6" },
	{ start: "#10b981", end: "#34d399" },
];

const {
	pageVisible,
	contentOpacity,
	contentTransform,
	startPageAnimation,
} = usePageAnimation({
	delay: 50,
	duration: 400,
	stagger: true,
	staggerDelay: 50,
	batchSize: 6,
});

const pageAnimationStyle = computed(() => ({
	opacity: contentOpacity.value,
	transform: `translateY(${contentTransform.value}rpx)`,
	transition: pageVisible.value
		? "opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
		: "none",
}));

const heroStyle = computed(() => ({
	background: `linear-gradient(135deg, ${addAlpha(primaryColor, 0.98)} 0%, ${addAlpha(
		primaryColor,
		0.82
	)} 100%)`,
}));

const heroStatStyle = computed(() => ({
	background: `linear-gradient(135deg, ${addAlpha(primaryColor, 0.36)} 0%, ${addAlpha(
		primaryColor,
		0.18
	)} 100%)`,
	border: `1rpx solid ${addAlpha(primaryColor, 0.42)}`,
	boxShadow: `0 18rpx 34rpx ${addAlpha(primaryColor, 0.22)}`,
}));

function getCardAccentStyle(index: number) {
	const accent = cardAccents[index % cardAccents.length];

	return {
		"--accent-start": accent.start,
		"--accent-end": accent.end,
		"animation-delay": `${index * 0.06}s`,
	};
}

function getConditionTone(condition: string) {
	const label = getConditionLabel(condition);

	if (label.includes("全新") || label.includes("99") || label.includes("新")) {
		return "tone-new";
	}

	if (label.includes("良") || label.includes("优") || label.includes("8")) {
		return "tone-good";
	}

	if (label.includes("中") || label.includes("可")) {
		return "tone-normal";
	}

	return "tone-soft";
}

function formatPrice(price: number) {
	if (!price || price <= 0) {
		return "价格面议";
	}

	return `¥${Number(price).toLocaleString("zh-CN")}`;
}

onShow(() => {
	useThemePage();
});

onMounted(() => {
	startPageAnimation();
	loadProducts();
});

function loadProducts(refresh = false) {
	if (loading.value) return;

	if (refresh) {
		page.value = 1;
		noMore.value = false;
	}

	loading.value = true;

	favoriteApi
		.getFavoriteList({
			page: page.value,
			pageSize,
		})
		.then((res: any) => {
			const rawDataList =
				res?.records || res?.data?.records || res?.list || res?.data?.list || [];

			const list = rawDataList.map((item: any) => ({
				id: item.productId || item.id,
				title: item.productTitle || item.title || item.productName || "未知商品",
				coverImage:
					item.coverImage ||
					item.image ||
					item.productImage ||
					item.cover ||
					"",
				price: item.price || 0,
				condition:
					item.condition || item.quality || item.productCondition || "全新",
			}));

			if (refresh) {
				productList.value = list;
			} else {
				productList.value = [...productList.value, ...list];
			}

			noMore.value = rawDataList.length < pageSize;
		})
		.catch((err: any) => {
			console.error("[收藏] 加载失败:", err);
			if (refresh) {
				productList.value = [];
			}
			noMore.value = true;
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

function goDetail(id: IdLike) {
	uni.navigateTo({
		url: `/pages/market/detail?id=${id}`,
	});
}

function cancelFavorite(id: IdLike) {
	uni.showModal({
		title: "提示",
		content: "确定取消收藏吗？",
		success: (res) => {
			if (res.confirm) {
				favoriteApi
					.cancelFavorite(String(id))
					.then(() => {
						uni.showToast({ title: "已取消收藏", icon: "success" });
						loadProducts(true);
					})
					.catch((error) => {
						console.error("[收藏] 取消失败:", error);
					});
			}
		},
	});
}
</script>

<style lang="scss" scoped>
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

@keyframes cardRiseIn {
	from {
		opacity: 0;
		transform: translateY(18rpx) scale(0.98);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

.favorites-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	position: relative;
	background: radial-gradient(
			circle at top left,
			rgba(255, 122, 89, 0.12),
			transparent 36%
		),
		radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 32%),
		var(--bg-color-page);
	padding-bottom: env(safe-area-inset-bottom);
	animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);

	&::before {
		content: "";
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.04) 0,
			rgba(255, 255, 255, 0.04) 1px,
			transparent 1px,
			transparent 100%
		);
		background-size: 22rpx 22rpx;
		opacity: 0.35;
		pointer-events: none;
	}
}

.scroll-view {
	flex: 1;
	padding: 24rpx 24rpx 12rpx;
	box-sizing: border-box;
	overflow: hidden;
	position: relative;
	z-index: 1;
}

.collection-hero {
	display: flex;
	align-items: stretch;
	justify-content: space-between;
	gap: 20rpx;
	padding: 28rpx;
	margin-bottom: 24rpx;
	border-radius: 30rpx;
	background: linear-gradient(
		135deg,
		var(--primary-color) 0%,
		var(--primary-color-dark) 100%
	);
	color: #f8fafc;
	box-shadow: 0 24rpx 50rpx rgba(8, 12, 24, 0.18);
	overflow: hidden;
	position: relative;

	&::after {
		content: "";
		position: absolute;
		right: -40rpx;
		top: -24rpx;
		width: 180rpx;
		height: 180rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.14), transparent 68%);
		filter: blur(4rpx);
	}

	&__copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	&__eyebrow {
		font-size: 20rpx;
		letter-spacing: 4rpx;
		text-transform: uppercase;
		color: rgba(248, 250, 252, 0.7);
	}

	&__title {
		font-size: 34rpx;
		line-height: 1.35;
		font-weight: 700;
		color: #fff;
	}

	&__desc {
		font-size: 24rpx;
		line-height: 1.6;
		color: rgba(248, 250, 252, 0.75);
	}

	&__stat {
		min-width: 132rpx;
		padding: 18rpx 16rpx;
		border-radius: 24rpx;
		backdrop-filter: blur(12px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 1;
	}

	&__stat-value {
		font-size: 44rpx;
		font-weight: 800;
		line-height: 1;
	}

	&__stat-label {
		margin-top: 8rpx;
		font-size: 20rpx;
		color: rgba(248, 250, 252, 0.7);
	}
}

.favorite-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 22rpx;
	width: 100%;
	box-sizing: border-box;
}

.favorite-card {
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	position: relative;
	border-radius: 28rpx;
	overflow: hidden;
	background: linear-gradient(
		180deg,
		rgba(255, 255, 255, 0.96) 0%,
		rgba(248, 250, 252, 0.94) 100%
	);
	border: 1rpx solid rgba(148, 163, 184, 0.18);
	box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
	animation: cardRiseIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
	transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease;

	&:active {
		transform: translateY(2rpx) scale(0.985);
		box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.1);
	}

	&::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		width: 10rpx;
		height: 100%;
		background: linear-gradient(180deg, var(--accent-start), var(--accent-end));
		z-index: 2;
	}

	&__media {
		position: relative;
		width: 100%;
		height: 260rpx;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			rgba(226, 232, 240, 0.8),
			rgba(241, 245, 249, 0.95)
		);
	}

	&__image {
		width: 100%;
		height: 100%;
		transition: transform 0.3s ease;
	}

	&:active &__image {
		transform: scale(1.06);
	}

	&__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(15, 23, 42, 0) 35%,
			rgba(15, 23, 42, 0.4) 100%
		);
	}

	&__topbar {
		position: absolute;
		left: 18rpx;
		right: 18rpx;
		top: 16rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 2;
	}

	&__action {
		width: 46rpx;
		height: 46rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 23, 42, 0.36);
		border: 1rpx solid rgba(255, 255, 255, 0.18);
		backdrop-filter: blur(12px);
	}

	&__price-tag {
		position: absolute;
		left: 18rpx;
		bottom: 16rpx;
		z-index: 2;
		padding: 8rpx 16rpx;
		border-radius: 18rpx;
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.12);
	}

	&__price {
		font-size: 28rpx;
		font-weight: 800;
		color: #ef4444;
	}

	&__content {
		padding: 18rpx 18rpx 20rpx;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	&__title {
		font-size: 26rpx;
		font-weight: 650;
		line-height: 1.4;
		color: var(--text-color-primary);
		min-height: 72rpx;
		letter-spacing: 0.2rpx;
	}

	&__meta {
		display: flex;
		align-items: center;
		gap: 8rpx;
		flex-wrap: wrap;
	}

	&__condition {
		padding: 6rpx 10rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		font-weight: 600;
		line-height: 1.3;
	}

	&__dot,
	&__hint {
		font-size: 20rpx;
		color: var(--text-color-tertiary);
	}

	&__hint {
		letter-spacing: 0.2rpx;
	}

	.tone-new {
		color: #166534;
		background: rgba(34, 197, 94, 0.12);
	}

	.tone-good {
		color: #1d4ed8;
		background: rgba(59, 130, 246, 0.12);
	}

	.tone-normal {
		color: #9a3412;
		background: rgba(249, 115, 22, 0.12);
	}

	.tone-soft {
		color: #475569;
		background: rgba(100, 116, 139, 0.12);
	}

	&:nth-child(2n) &__media {
		height: 286rpx;
	}

	&:nth-child(3n) &__price-tag {
		background: rgba(15, 23, 42, 0.92);

		.favorite-card__price {
			color: #fff;
		}
	}

	&:nth-child(3n + 1) &__chip {
		background: rgba(255, 255, 255, 0.18);
	}

	&:nth-child(3n + 2) &__chip {
		background: rgba(15, 23, 42, 0.45);
	}

	&:nth-child(3n) &__chip {
		background: rgba(99, 102, 241, 0.4);
	}
}

.favorite-card__action:active {
	transform: scale(0.92);
}

.favorite-card__overlay,
.favorite-card__action,
.favorite-card__price-tag,
.favorite-card__condition {
	transition: all 0.25s ease;
}

.favorite-card:hover .favorite-card__overlay,
.favorite-card:active .favorite-card__overlay {
	background: linear-gradient(
		180deg,
		rgba(15, 23, 42, 0) 24%,
		rgba(15, 23, 42, 0.48) 100%
	);
}

.favorite-card:hover .favorite-card__image,
.favorite-card:active .favorite-card__image {
	transform: scale(1.05);
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 64vh;
	padding: 80rpx 40rpx 120rpx;
	opacity: 0;
	animation: emptyFadeIn 0.5s ease-out 0.3s forwards;
	background: transparent;

	.empty-image {
		width: 260rpx;
		height: 260rpx;
		margin-bottom: 18rpx;
		animation: float 3s ease-in-out infinite;
	}

	.empty-text {
		font-size: 30rpx;
		font-weight: 600;
		color: var(--text-color-tertiary);
	}
}

.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 36rpx 0 12rpx;

	.loading-text {
		margin-left: 10rpx;
		font-size: 24rpx;
		color: var(--text-color-tertiary);
	}
}

.no-more {
	text-align: center;
	padding: 20rpx 0 20rpx;
	font-size: 24rpx;
	color: var(--text-color-tertiary);
}
</style>
