<template>
	<view class="share-card-wrapper" :style="themeStyle">
		<view class="share-card" @click="handleClick">
			<!-- 物品图片 -->
			<lazy-image
				class="share-image"
				:src="item.coverImage"
				mode="aspectFill"
				width="100%"
				height="380"
			/>

			<!-- 共享标签 -->
			<view class="share-badge">
				<text class="badge-text">可共享</text>
			</view>

			<!-- 物品信息 -->
			<view class="share-info">
				<text class="share-title text-ellipsis-2">{{ item.title }}</text>
				<view class="share-price">
					<text class="rent-price">¥{{ item.dailyRent }}/天</text>
					<text class="deposit-price">押金¥{{ item.deposit }}</text>
				</view>
				<view class="share-footer" v-if="showUser">
					<user-avatar class="user-avatar" :src="item.userAvatar" size="xs" />
					<text class="user-name">{{ item.userName }}</text>
					<text v-if="item.distance" class="distance"
						>{{ item.distance }}km</text
					>
				</view>
			</view>

			<slot name="extra" />
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useThemeStyle } from "@/utils/theme";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";
import type { ShareItem } from "@/api/share";

interface Props {
	item: ShareItem;
	showUser?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	showUser: true,
});

const { themeStyle } = useThemeStyle();

const emit = defineEmits<{
	click: [item: ShareItem];
}>();

function handleClick() {
	emit("click", props.item);
}
</script>

<script lang="ts">
export default {
	name: "ShareCard",
};
</script>

<style lang="scss" scoped>
/**
 * ShareCard 组件样式 - 完全响应式主题
 * 所有颜色、阴影、圆角均使用 CSS 变量，自动跟随主题变化
 * 采用 Claymorphism 设计风格
 */


// ========== 主容器 ==========
.share-card-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-sizing: border-box;
}

// ========== 共享卡片主体 ==========
.share-card {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	background: var(--bg-color-card);
	border: 2rpx solid rgba(255, 255, 255, 0.8);
	border-radius: var(--border-radius-lg);
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	box-shadow: 8rpx 8rpx 16rpx rgba(0, 0, 0, 0.06),
		-4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);

	&:active {
		transform: translateY(-4rpx) scale(0.98);
		box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06),
			2rpx 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}

	// ========== 共享标签 ==========
	.share-badge {
		position: absolute;
		top: 12rpx;
		left: 12rpx;
		z-index: 2;

		.badge-text {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 8rpx 16rpx;
			border-radius: 12rpx;
			font-size: 20rpx;
			font-weight: 600;
			background: linear-gradient(
				135deg,
				var(--primary-color) 0%,
				var(--primary-color) 100%
			);
			color: var(--text-color-inverse);
			box-shadow: 0 4rpx 12rpx var(--primary-color-faded);
			text-shadow: 0 1rpx 1rpx rgba(0, 0, 0, 0.1);
			transition: all 0.2s ease;
		}
	}

	// ========== 物品图片 ==========
	.share-image {
		width: 100%;
		height: 360rpx;
		background: linear-gradient(
			135deg,
			var(--border-color-light) 0%,
			var(--border-color-base) 100%
		);
		display: block;
		overflow: hidden;
		box-shadow: inset 0 -2rpx 8rpx rgba(0, 0, 0, 0.06);
		flex-shrink: 0;
	}

	// ========== 共享信息 ==========
	.share-info {
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

		/* 物品标题 */
		.share-title {
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

		/* 价格区域 */
		.share-price {
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			margin-bottom: 12rpx;

			.rent-price {
				font-size: 36rpx;
				font-weight: 700;
				color: var(--primary-color);
				letter-spacing: -0.5rpx;
				background: linear-gradient(
					135deg,
					var(--primary-color) 0%,
					var(--primary-color) 100%
				);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
				transition: all 0.2s ease;
			}

			.deposit-price {
				font-size: 22rpx;
				color: var(--text-color-secondary);
				padding: 6rpx 12rpx;
				background: var(--bg-color-card);
				border-radius: var(--border-radius-pill);
				font-weight: 500;
				border: 1px solid var(--border-color-light);
				box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
				transition: all 0.2s ease;
			}
		}

		/* 底部信息 */
		.share-footer {
			display: flex;
			align-items: center;
			gap: 12rpx;
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
		}
	}
}
</style>
