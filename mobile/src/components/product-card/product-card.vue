<template>
	<view class="product-card-wrapper" :style="themeStyle">
		<!-- 快捷操作按钮 -->
		<view class="quick-actions" v-if="showActions">
			<view class="action-btn favorite-btn" @click.stop="handleFavorite">
				<text class="action-icon" :class="{ active: isFavorited }">♥</text>
			</view>
			<view class="action-btn share-btn" @click.stop="handleShare">
				<text class="action-icon">⤳</text>
			</view>
		</view>

		<view
			class="product-card"
			:class="{ 'show-actions': showActions }"
			@click="handleClick"
			@longpress="handleLongPress"
		>
			<!-- 商品标签 -->
			<view class="product-badges" v-if="badges.length > 0">
				<view
					class="badge-item"
					v-for="(badge, index) in badges"
					:key="index"
					:class="badge.type"
				>
					<text class="badge-text">{{ badge.text }}</text>
				</view>
			</view>

			<!-- 快速预览提示 -->
			<view class="preview-hint" v-if="enablePreview">
				<text class="hint-text">长按快捷操作</text>
			</view>

			<!-- 商品图片 -->
			<lazy-image
				class="product-image"
				:src="product.coverImage"
				mode="aspectFit"
				:disable-lazy-load="true"
				:absolute="true"
			/>

			<!-- 商品信息 -->
			<view class="product-info">
				<text class="product-title text-ellipsis-2">{{ product.title }}</text>
				<view class="product-meta">
					<text class="product-price">{{ product.price }}</text>
					<text class="product-condition" v-if="product.condition">{{
						getConditionLabel(product.condition)
					}}</text>
				</view>
				<view class="product-footer" v-if="showUser">
					<user-avatar
						class="user-avatar"
						:src="product.userAvatar"
						size="xs"
						:width="28"
						:height="28"
					/>
					<text class="user-name">{{ product.userName }}</text>
					<!-- 信用标签 -->
					<view
						v-if="showCredit && product.creditLevel"
						class="credit-tag"
						:class="creditLevelClass"
					>
						<text class="credit-tag-text">{{ product.creditLevel }}</text>
					</view>
					<text v-if="product.distance" class="distance"
						>{{ product.distance }}km</text
					>
				</view>
			</view>

			<slot name="extra" />
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useThemeStyle } from "@/utils/theme";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";
import type { Product } from "@/types";
import { getConditionLabel } from "@/types";

interface Props {
	product: Product;
	showUser?: boolean;
	showCredit?: boolean;
	enablePreview?: boolean; // 是否启用长按预览
	defaultFavorited?: boolean; // 默认收藏状态
}

const props = withDefaults(defineProps<Props>(), {
	showUser: true,
	showCredit: true, // 默认显示信用度
	enablePreview: false,
	defaultFavorited: false,
});

const emit = defineEmits<{
	click: [product: Product];
	longPress: [product: Product];
	favorite: [product: Product, isFavorited: boolean];
	share: [product: Product];
}>();

const { themeStyle } = useThemeStyle();
const isFavorited = ref(props.defaultFavorited);
const showActions = ref(false);

// 组件挂载时记录图片信息
onMounted(() => {
	if (props.product.coverImage) {
		console.log("[ProductCard] 📦 商品卡片图片信息:", {
			商品ID: props.product.id,
			商品标题: props.product.title,
			封面图URL: props.product.coverImage,
			图片数组: props.product.images,
			图片URL类型: typeof props.product.coverImage,
			是否为相对路径: props.product.coverImage?.startsWith("/"),
			图片长度: props.product.coverImage?.length,
		});
	} else {
		console.warn("[ProductCard] ⚠️ 商品卡片缺少封面图:", {
			商品ID: props.product.id,
			商品标题: props.product.title,
		});
	}
});

// 计算标签
const badges = computed(() => {
	const result: Array<{ text: string; type: string }> = [];
	if (props.product.isNew) {
		result.push({ text: "新品", type: "new" });
	}
	if (props.product.isHot) {
		result.push({ text: "热门", type: "hot" });
	}
	if (props.product.isDiscount) {
		result.push({ text: "特惠", type: "discount" });
	}
	return result;
});

// 计算信用等级样式类
const creditLevelClass = computed(() => {
	const creditValue = props.product.creditLevel;
	// 确保 creditLevel 是字符串类型
	const level = creditValue != null ? String(creditValue).toLowerCase() : "";
	if (level.includes("excellent") || level.includes("优秀")) {
		return "credit-excellent";
	} else if (level.includes("good") || level.includes("良好")) {
		return "credit-good";
	} else if (level.includes("normal") || level.includes("一般")) {
		return "credit-normal";
	} else if (level.includes("poor") || level.includes("较差")) {
		return "credit-poor";
	}
	return "credit-normal";
});

function handleClick() {
	emit("click", props.product);
}

function handleLongPress() {
	// 触觉反馈 - 仅在非H5环境中执行
	// #ifndef H5
	uni.vibrateShort({
		type: "light",
		success: () => {},
		fail: () => {},
	});
	// #endif

	// 切换操作按钮显示
	showActions.value = !showActions.value;
	emit("longPress", props.product);
}

function handleFavorite() {
	isFavorited.value = !isFavorited.value;
	emit("favorite", props.product, isFavorited.value);

	if (isFavorited.value) {
		uni.showToast({ title: "收藏成功", icon: "success", duration: 1500 });
	} else {
		uni.showToast({ title: "取消收藏", icon: "none", duration: 1500 });
	}

	// 2秒后自动隐藏操作按钮
	setTimeout(() => {
		showActions.value = false;
	}, 2000);
}

async function handleShare() {
	try {
		const { share } = await import("@/utils/share");
		await share.product(props.product);
		emit("share", props.product);
		showActions.value = false;
	} catch (error) {
		console.error("分享失败:", error);
	}
}

// 暴露方法
defineExpose({
	toggleActions: () => {
		showActions.value = !showActions.value;
	},
	hideActions: () => {
		showActions.value = false;
	},
	setFavorited: (value: boolean) => {
		isFavorited.value = value;
	},
});
</script>

<script lang="ts">
export default {
	name: "ProductCard",
};
</script>

<style lang="scss" scoped>
/**
 * ProductCard 组件样式 - 完全响应式主题
 * 所有颜色、阴影、圆角均使用 CSS 变量，自动跟随主题变化
 * 采用 Claymorphism 设计风格
 */


// ========== 主容器 ==========
.product-card-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-sizing: border-box;
}

// ========== 快捷操作按钮 ==========
.quick-actions {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	flex-direction: row;
	gap: 24rpx;
	z-index: 5;
	animation: fadeIn 0.3s ease;

	.action-btn {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
		animation: popIn 0.3s ease backwards;
		transition: all var(--motion-duration-medium) var(--motion-ease-standard);
		/* 使用 CSS 变量，主题中可覆盖 */
		--action-shadow: rgba(0, 0, 0, 0.15);

		&:nth-child(1) {
			animation-delay: 0.1s;
		}

		&:nth-child(2) {
			animation-delay: 0.2s;
		}

		&:active {
			transform: scale(0.9);
		}

		.action-icon {
			font-size: 36rpx;
			color: var(--text-color-inverse);

			&.active {
				color: var(--error-color);
			}
		}

		&.favorite-btn {
			background: linear-gradient(
				135deg,
				var(--error-color) 0%,
				var(--error-color) 100%
			);
			box-shadow: 0 4rpx 12rpx rgba(255, 138, 138, 0.3);

			&:active {
				box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.1);
			}
		}

		&.share-btn {
			background: linear-gradient(
				135deg,
				var(--primary-color) 0%,
				var(--primary-color-light) 100%
			);
			box-shadow: 0 4rpx 12rpx rgba(142, 197, 232, 0.3);

			&:active {
				box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.1);
			}
		}
	}
}

// ========== 商品卡片主体 ==========
.product-card {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	background: var(--bg-color-card);
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	border-radius: var(--radius-lg);
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
		-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);

	&:active {
		transform: translateY(-4rpx) scale(0.98);
		box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06),
			2rpx 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}

	&.show-actions {
		transform: scale(0.98);
		box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
			inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.5);
	}

	// ========== 商品标签 ==========
	.product-badges {
		position: absolute;
		top: 12rpx;
		left: 12rpx;
		display: flex;
		gap: 8rpx;
		z-index: 2;

		.badge-item {
			padding: 6rpx 12rpx;
			border-radius: 8rpx;
			font-size: 20rpx;
			font-weight: 600;
			line-height: 1.2;
			box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
			backdrop-filter: blur(4rpx);
			transition: all 0.2s ease;

			&.new {
				background: linear-gradient(
					135deg,
					var(--success-color) 0%,
					rgba(126, 212, 166, 0.3) 100%
				);
				color: var(--text-color-inverse);
				text-shadow: 0 1rpx 1rpx rgba(0, 0, 0, 0.2);
			}

			&.hot {
				background: linear-gradient(
					135deg,
					var(--error-color) 0%,
					var(--error-color) 100%
				);
				color: var(--text-color-inverse);
				text-shadow: 0 1rpx 1rpx rgba(0, 0, 0, 0.2);
			}

			&.discount {
				background: linear-gradient(
					135deg,
					var(--warning-color) 0%,
					rgba(255, 214, 102, 0.15) 100%
				);
				color: var(--text-color-inverse);
				text-shadow: 0 1rpx 1rpx rgba(0, 0, 0, 0.2);
			}
		}
	}

	// ========== 长按提示 ==========
	.preview-hint {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.7);
		padding: 16rpx 32rpx;
		border-radius: var(--radius-xl);
		z-index: 3;
		opacity: 0;
		animation: fadeInOut 2s ease;
		pointer-events: none;
		white-space: nowrap;
		backdrop-filter: blur(8rpx);

		.hint-text {
			font-size: 24rpx;
			color: var(--text-color-inverse);
			font-weight: 500;
			white-space: nowrap;
		}
	}

	// ========== 商品图片 ==========
	.product-image {
		position: relative;
		width: 100%;
		height: 0;
		padding-bottom: 100%; /* 1:1 宽高比 */
		background: linear-gradient(
			135deg,
			var(--border-color-light) 0%,
			var(--border-color-base) 100%
		);
		overflow: hidden;
		box-shadow: inset 0 -2rpx 8rpx rgba(0, 0, 0, 0.06);
	}

	// ========== 商品信息 ==========
	.product-info {
		padding: 20rpx;
		display: flex;
		flex-direction: column;
		background: var(--bg-color-page);
		min-height: 180rpx;
		overflow: hidden;
		border-top: 2rpx solid rgba(255, 255, 255, 0.5);
		position: relative;
		flex: 1;

		/* 顶部高光效果 */
		&::before {
			content: "";
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(
				90deg,
				transparent,
				rgba(255, 255, 255, 0.8),
				transparent
			);
		}

		/* 商品标题 */
		.product-title {
			font-size: 28rpx;
			color: var(--text-color-primary);
			line-height: 1.6;
			min-height: 80rpx;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			overflow: hidden;
			text-overflow: ellipsis;
			font-weight: 600;
			margin-bottom: 12rpx;
			transition: color 0.2s ease;
		}

		/* 价格和成色 */
		.product-meta {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			margin-bottom: 12rpx;

			.product-price {
				font-size: 36rpx;
				font-weight: 700;
				color: var(--primary-color);
				letter-spacing: -0.5rpx;
				background: linear-gradient(
					135deg,
					var(--primary-color) 0%,
					var(--primary-color-dark) 100%
				);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
				transition: all 0.2s ease;

				&::before {
					content: "¥";
					font-size: 24rpx;
					font-weight: 600;
					margin-right: 2rpx;
				}
			}

			.product-condition {
				font-size: 22rpx;
				color: var(--text-color-secondary);
				padding: 6rpx 12rpx;
				background: var(--bg-color-card);
				border-radius: var(--radius-pill);
				font-weight: 500;
				border: 1px solid var(--border-color-light);
				box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
				transition: all 0.2s ease;
			}
		}

		/* 底部信息 */
		.product-footer {
			display: flex;
			align-items: center;
			gap: 8rpx;
			margin-top: auto;
			padding-top: 12rpx;
			border-top: 1px solid var(--border-color-base);
			box-shadow: 0 -1rpx 2rpx rgba(0, 0, 0, 0.02);

			.user-avatar {
				flex-shrink: 0;
			}

			.user-name {
				flex: 1;
				font-size: 22rpx;
				color: var(--text-color-tertiary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				min-width: 0;
				font-weight: 500;
			}

			.distance {
				font-size: 20rpx;
				color: var(--text-color-secondary);
				margin-left: auto;
				flex-shrink: 0;
				font-weight: 500;
			}

			/* 信用标签 */
			.credit-tag {
				display: inline-flex;
				align-items: center;
				padding: 4rpx 10rpx;
				border-radius: 8rpx;
				font-size: 18rpx;
				font-weight: 600;
				margin-left: 4rpx;
				flex-shrink: 0;
				box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
				transition: all 0.2s ease;

				.credit-tag-text {
					color: var(--text-color-inverse);
					text-shadow: 0 1rpx 1rpx rgba(0, 0, 0, 0.2);
				}

				/* 信用等级样式 */
				&.credit-excellent {
					background: linear-gradient(
						135deg,
						var(--success-color) 0%,
						var(--success-color) 100%
					);
				}

				&.credit-good {
					background: linear-gradient(
						135deg,
						var(--info-color) 0%,
						var(--info-color) 100%
					);
				}

				&.credit-normal {
					background: linear-gradient(
						135deg,
						var(--warning-color) 0%,
						var(--warning-color) 100%
					);
				}

				&.credit-poor {
					background: linear-gradient(
						135deg,
						var(--error-color) 0%,
						var(--error-color) 100%
					);
				}
			}
		}
	}
}

// ========== 响应式动画 ==========
@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.8);
	}

	to {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}
}

@keyframes popIn {
	from {
		opacity: 0;
		transform: scale(0);
	}

	to {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes fadeInOut {
	0%,
	100% {
		opacity: 0;
	}

	20%,
	80% {
		opacity: 1;
	}
}
</style>
