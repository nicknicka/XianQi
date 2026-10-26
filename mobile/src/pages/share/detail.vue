<template>
	<view class="detail-page" :style="themeStyle">
		<!-- 主内容区域（页面自然滚动） -->
		<!-- 图片轮播 -->
		<swiper
			class="image-swiper"
			indicator-dots
			:autoplay="false"
			:circular="displayImages.length > 1"
		>
			<swiper-item v-for="(image, index) in displayImages" :key="index">
				<view class="item-image" @click="previewImage(Number(index))">
					<lazy-image
						:src="image"
						mode="aspectFill"
						:width="750"
						:height="750"
						:disable-lazy-load="true"
					/>
				</view>
			</swiper-item>
		</swiper>

		<!-- 物品信息 -->
		<view class="info-section">
			<view class="price-row">
				<!-- 物品状态标签 -->
				<view class="status-tag" :class="'status-' + shareItem.status">
					{{ getStatusText(shareItem.status) }}
				</view>
			</view>
			<text class="title">{{ shareItem.title }}</text>
			<view class="available-time">
				<uni-icons type="calendar" size="14" color="#7A7A7A" />
				<text class="time-text">可借用时间：{{ shareItem.availableTime }}</text>
			</view>
		</view>

		<!-- 所有者信息 -->
		<view class="owner-section" @click="!isOwner && goUserHome()">
			<!-- 买家视角：显示所有者信息 + 联系TA -->
			<template v-if="!isOwner">
				<UserAvatar
					class="avatar"
					:src="shareItem.userAvatar"
					size="md"
					shape="circle"
				/>
				<view class="owner-info">
					<text class="name">{{ shareItem.userName }}</text>
				</view>
				<view class="action-btn" @click.stop="goChat">
					<uni-icons type="chatbubble" size="16" :color="primaryColor" />
					<text>联系TA</text>
				</view>
			</template>

			<!-- Owner 视角：显示预约概况 -->
			<template v-else>
				<view class="owner-dashboard">
					<text class="dashboard-title">我的共享物品</text>
					<view class="booking-summary" v-if="shareItem.pendingBookingCount > 0">
						<view class="pending-badge">{{ shareItem.pendingBookingCount }} 条待处理</view>
						<text class="summary-hint">有同学想借用你的物品</text>
					</view>
					<view class="booking-summary" v-else-if="shareItem.activeBookingCount > 0">
						<view class="active-badge">{{ shareItem.activeBookingCount }} 个借用中</view>
					</view>
					<view class="booking-summary" v-else>
						<text class="summary-hint">暂无借用申请</text>
					</view>
				</view>
				<view class="action-btn" @click.stop="goToBookings">
					<uni-icons type="list" size="16" :color="primaryColor" />
					<text>查看预约</text>
				</view>
			</template>
		</view>

		<!-- 物品描述 -->
		<view class="desc-section">
			<text class="section-title">物品描述</text>
			<text class="desc-text">{{ shareItem.description }}</text>
		</view>
		<!-- 底部占位，防止内容被固定底栏遮挡 -->
		<view class="bottom-placeholder" />

		<!-- 底部操作栏 -->
		<view class="bottom-bar" :class="{ 'is-hidden': isBookModalOpen }">
			<!-- 买家视角 -->
			<template v-if="!isOwner">
				<view class="bottom-summary">
					<view class="summary-copy">
						<text class="summary-eyebrow">租借方案</text>
						<view class="summary-price-row">
							<text class="summary-price">¥{{ shareItem.dailyRent }}</text>
							<text class="summary-unit">/天</text>
							<text class="summary-deposit">押金 ¥{{ shareItem.deposit }}</text>
						</view>
					</view>

					<view class="summary-state" :class="`state-${shareItem.status}`">
						<text class="summary-state-text">{{ bottomStatusText }}</text>
						<text class="summary-state-hint">{{ bottomStatusHint }}</text>
					</view>
				</view>

				<view class="bottom-actions">
					<view
						class="action-chip favorite"
						@click="toggleFavorite"
					>
						<uni-icons
							:type="isFavorited ? 'heart-filled' : 'heart'"
							size="18"
							:color="
								isFavorited
									? 'var(--error-color)'
									: 'var(--text-color-secondary)'
							"
						/>
						<text class="action-chip-text">{{
							isFavorited ? "已收藏" : "收藏"
						}}</text>
					</view>

					<view class="action-chip contact" @click="goChat">
						<uni-icons type="chatbubble" size="18" :color="primaryColor" />
						<text class="action-chip-text">联系TA</text>
					</view>

					<button
						class="book-btn"
						:class="{ disabled: !canBook }"
						:disabled="!canBook"
						@click="showBookModal"
					>
						<text class="book-btn-label">{{ primaryActionText }}</text>
						<text class="book-btn-sub">{{
							canBook ? "提交后等待对方审批" : "当前不可预约"
						}}</text>
					</button>
				</view>
			</template>

			<!-- Owner 视角：管理按钮组 -->
			<template v-else>
				<view class="bottom-summary">
					<view class="summary-copy">
						<text class="summary-eyebrow">管理操作</text>
						<view class="owner-status-row">
							<text class="owner-status-text">{{ ownerStatusText }}</text>
							<text class="owner-status-hint">{{ ownerStatusHint }}</text>
						</view>
					</view>
				</view>

				<view class="bottom-actions owner-actions">
					<!-- 可借用状态 -->
					<template v-if="shareItem.status === 1">
						<view class="owner-action-btn" @click="goToEdit">
							<uni-icons type="compose" size="20" color="var(--text-color-secondary)" />
							<text>编辑</text>
						</view>
						<view class="owner-action-btn" @click="goToBookings">
							<uni-icons type="list" size="20" color="var(--text-color-secondary)" />
							<text>预约</text>
						</view>
						<view class="owner-action-btn warning" @click="offlineItem">
							<uni-icons type="eye-slash" size="20" color="var(--text-color-inverse)" />
							<text>下架</text>
						</view>
					</template>
					<!-- 已下架状态 -->
					<template v-else-if="shareItem.status === 0">
						<view class="owner-action-btn" @click="goToEdit">
							<uni-icons type="compose" size="20" color="var(--text-color-secondary)" />
							<text>编辑</text>
						</view>
						<view class="owner-action-btn primary" @click="onlineItem">
							<uni-icons type="eye" size="20" color="var(--text-color-inverse)" />
							<text>上架</text>
						</view>
						<view class="owner-action-btn danger" @click="deleteItem">
							<uni-icons type="trash" size="20" color="var(--text-color-inverse)" />
							<text>删除</text>
						</view>
					</template>
					<!-- 借用中状态 -->
					<template v-else-if="shareItem.status === 2">
						<view class="owner-action-btn" @click="goToEdit">
							<uni-icons type="compose" size="20" color="var(--text-color-secondary)" />
							<text>编辑</text>
						</view>
						<view class="owner-action-btn primary" @click="goToActiveBooking">
							<uni-icons type="list" size="20" color="var(--text-color-inverse)" />
							<text>借用</text>
						</view>
						<view class="owner-action-btn" @click="goToTransfer">
							<uni-icons type="redo" size="20" color="var(--text-color-secondary)" />
							<text>转赠</text>
						</view>
					</template>
				</view>
			</template>
		</view>

		<!-- 预约弹窗 -->
		<uni-popup ref="bookPopup" type="bottom">
			<view class="book-modal">
				<view class="modal-header">
					<text class="modal-title">预约借用</text>
					<view class="close-btn" @click="closeBookModal">
						<uni-icons type="close" size="20" color="#7A7A7A" />
					</view>
				</view>

				<view class="modal-body">
					<!-- 日期选择 -->
					<view class="form-item">
						<text class="label">开始日期</text>
						<picker
							mode="date"
							:value="bookForm.startDate"
							@change="onStartDateChange"
						>
							<view class="picker-value">
								<text>{{ bookForm.startDate || "请选择开始日期" }}</text>
								<uni-icons type="right" size="14" color="#AAAAAA" />
							</view>
						</picker>
					</view>

					<view class="form-item">
						<text class="label">结束日期</text>
						<picker
							mode="date"
							:value="bookForm.endDate"
							@change="onEndDateChange"
						>
							<view class="picker-value">
								<text>{{ bookForm.endDate || "请选择结束日期" }}</text>
								<uni-icons type="right" size="14" color="#AAAAAA" />
							</view>
						</picker>
					</view>

					<!-- 费用计算 -->
					<view class="cost-section">
						<view class="cost-item">
							<text class="cost-label">日租金</text>
							<text class="cost-value">¥{{ shareItem.dailyRent }}</text>
						</view>
						<view class="cost-item">
							<text class="cost-label">租金小计</text>
							<text class="cost-value">¥{{ rentSubtotal }}</text>
						</view>
						<view class="cost-item">
							<text class="cost-label">押金</text>
							<text class="cost-value">¥{{ shareItem.deposit }}</text>
						</view>
						<view class="cost-item">
							<text class="cost-label">借用天数</text>
							<text class="cost-value">{{ days }}天</text>
						</view>
						<view class="cost-item total">
							<text class="cost-label">总计</text>
							<text class="cost-value">¥{{ totalCost }}</text>
						</view>
					</view>

					<view class="form-item">
						<text class="label">备注（选填）</text>
						<textarea
							class="textarea"
							v-model="bookForm.remark"
							placeholder="请输入备注信息"
							maxlength="200"
							placeholder-style="color: var(--text-color-tertiary)"
						/>
					</view>
				</view>

				<view class="modal-footer">
					<button class="confirm-btn" @click="handleBook">确认预约</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { shareApi } from "@/api/share";
import { favoriteApi } from "@/api/favorite";
import { useUserStore } from "@/store/user";
import { useThemeStyle, useThemeColors, useThemePage } from "@/utils/theme";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";
import LazyImage from "@/components/lazy-image/lazy-image.vue";
import { onLoad, onShow } from "@dcloudio/uni-app";

const { themeStyle } = useThemeStyle();
const { primaryColor, successColor, warningColor, dangerColor } = useThemeColors();
const userStore = useUserStore();
const bookPopup = ref();
const isBookModalOpen = ref(false);

const shareItemId = ref<string>("");
const shareItem = ref<any>({
	images: [],
	dailyRent: 0,
	deposit: 0,
	title: "",
	availableTime: "",
	userAvatar: "",
	userName: "",
	description: "",
	userId: "",
	status: 0,
	// 预约统计
	pendingBookingCount: 0,
	activeBookingCount: 0,
	totalBookingCount: 0,
});
const isFavorited = ref(false);

const bookForm = ref({
	startDate: "",
	endDate: "",
	remark: "",
});

const days = computed(() => {
	if (!bookForm.value.startDate || !bookForm.value.endDate) return 0;
	const start = new Date(bookForm.value.startDate);
	const end = new Date(bookForm.value.endDate);
	const diff = end.getTime() - start.getTime();
	// 闭区间：两端都算在内，所以 +1（同一天 = 1天）
	return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
});

const rentSubtotal = computed(() => {
	return (shareItem.value.dailyRent || 0) * days.value;
});

const totalCost = computed(() => {
	return rentSubtotal.value + (shareItem.value.deposit || 0);
});

const displayImages = computed(() => {
	const images = shareItem.value.images || [];
	if (images.length > 0) {
		return images;
	}

	if (shareItem.value.coverImage) {
		return [shareItem.value.coverImage];
	}

	return ["/static/images/empty.png"];
});

// 判断当前用户是否是物品所有者
const isOwner = computed(() => {
	const currentUserId = userStore.userInfo?.userId;
	const ownerUserId = shareItem.value.userId;
	if (currentUserId === undefined || currentUserId === null || currentUserId === "") {
		return false;
	}
	if (ownerUserId === undefined || ownerUserId === null || ownerUserId === "") {
		return false;
	}
	return String(currentUserId) === String(ownerUserId);
});

// 判断是否可以借用
const canBook = computed(() => {
	// 状态必须为 1（可借用）
	if (shareItem.value.status !== 1) return false;
	// 不能借用自己的物品
	if (isOwner.value) return false;
	return true;
});

// 买家视角的状态文案
const bottomStatusText = computed(() => {
	if (canBook.value) return "可立即预约";
	if (isOwner.value) return "我的物品";
	if (shareItem.value.status === 2) return "借用中";
	if (shareItem.value.status === 0) return "已下架";
	return "暂不可用";
});

const bottomStatusHint = computed(() => {
	if (canBook.value) return "提交后等待对方审批";
	if (isOwner.value) return "查看自己的发布内容";
	if (shareItem.value.status === 2) return "物品正在借用中";
	if (shareItem.value.status === 0) return "当前不可借用";
	return "请稍后再试";
});

const primaryActionText = computed(() => {
	if (canBook.value) return "预约借用";
	return bottomStatusText.value;
});

// Owner 视角的状态文案
const ownerStatusText = computed(() => {
	switch (shareItem.value.status) {
		case 1: return "可借用";
		case 0: return "已下架";
		case 2: return "借用中";
		default: return "未知状态";
	}
});

const ownerStatusHint = computed(() => {
	switch (shareItem.value.status) {
		case 1:
			return shareItem.value.pendingBookingCount > 0
				? `${shareItem.value.pendingBookingCount} 条待处理预约`
				: "同学可提交借用申请";
		case 0: return "当前不可被借用";
		case 2: return "物品正在借用中";
		default: return "";
	}
});

onLoad((options) => {
	shareItemId.value = options?.id || "";
});

onShow(() => {
	useThemePage();
	if (shareItemId.value) {
		refreshShareItemState();
	}
});

function refreshShareItemState() {
	loadShareItem();
	checkFavoriteStatus();
}

function formatAvailableTime(raw: string): string {
	if (!raw) return "随时可借用";
	try {
		const obj = JSON.parse(raw);
		const parts: string[] = [];
		if (obj.rentalType === "days" && obj.rentalDays) {
			parts.push(`可借${obj.rentalDays}天`);
		} else if (obj.rentalType === "hours" && obj.rentalHours) {
			parts.push(`可借${obj.rentalHours}小时`);
		}
		const deliveryMap: Record<string, string> = {
			self: "自取",
			mailing: "邮寄",
			both: "自取/邮寄",
		};
		if (obj.deliveryMethod) {
			parts.push(deliveryMap[obj.deliveryMethod] || obj.deliveryMethod);
		}
		return parts.length > 0 ? parts.join(" · ") : "随时可借用";
	} catch {
		return raw || "随时可借用";
	}
}

function loadShareItem() {
	shareApi
		.getShareItemDetail(shareItemId.value)
		.then((response: any) => {
			const data = response.data || response || {};

			// 映射后端字段到模板所需的字段名
			const imageList =
				data.imageUrls && data.imageUrls.length > 0
					? data.imageUrls
					: data.images && data.images.length > 0
					? data.images
					: data.coverImageUrl || data.coverImage || data.image
					? [data.coverImageUrl || data.coverImage || data.image]
					: [];

			const availableTimeRaw = data.availableTimes || data.availableTime || "";

			shareItem.value = {
				images: imageList,
				coverImage: data.coverImageUrl || data.coverImage || data.image || "",
				dailyRent: data.dailyRent || 0,
				deposit: data.deposit || 0,
				title: data.title || "",
				availableTime: formatAvailableTime(availableTimeRaw),
				userAvatar: data.ownerAvatar || data.userAvatar || "",
				userName: data.ownerNickname || data.userName || "",
				userId: String(data.ownerId || data.userId || ""),
				description: data.description || "",
				status: data.status ?? 0,
				// 预约统计
				pendingBookingCount: data.pendingBookingCount || 0,
				activeBookingCount: data.activeBookingCount || 0,
				totalBookingCount: data.totalBookingCount || 0,
			};

			// 设置导航栏标题
			if (data.title) {
				uni.setNavigationBarTitle({
					title: data.title,
				});
			}
		})
		.catch((error) => {
			console.error("[ShareDetail] 加载失败:", error);
			uni.showToast({
				title: "加载失败",
				icon: "none",
			});
		});
}

function previewImage(index: number) {
	uni.previewImage({
		urls: displayImages.value,
		current: index,
	});
}

function goUserHome() {
	uni.navigateTo({
		url: `/pages/user/home?id=${shareItem.value.userId}`,
	});
}

function goChat() {
	if (!userStore.checkLogin()) return;

	uni.navigateTo({
		url: `/pages/message/chat?userId=${shareItem.value.userId}&shareItemId=${shareItemId.value}`,
	});
}

function toggleFavorite() {
	if (!userStore.checkLogin()) return;

	if (isFavorited.value) {
		// 取消收藏
		favoriteApi
			.cancelFavorite(shareItemId.value)
			.then(() => {
				isFavorited.value = false;
				uni.showToast({ title: "已取消收藏", icon: "success" });
			})
			.catch(() => {
				uni.showToast({ title: "操作失败", icon: "none" });
			});
	} else {
		// 添加收藏
		favoriteApi
			.addFavorite(shareItemId.value)
			.then(() => {
				isFavorited.value = true;
				uni.showToast({ title: "收藏成功", icon: "success" });
			})
			.catch(() => {
				uni.showToast({ title: "操作失败", icon: "none" });
			});
	}
}

function showBookModal() {
	// Owner 不能预约自己的物品
	if (isOwner.value) return;
	if (!userStore.checkLogin()) return;
	isBookModalOpen.value = true;
	bookForm.value = {
		startDate: "",
		endDate: "",
		remark: "",
	};
	bookPopup.value?.open();
}

function closeBookModal() {
	bookPopup.value?.close();
	isBookModalOpen.value = false;
	bookForm.value = {
		startDate: "",
		endDate: "",
		remark: "",
	};
}

function getStatusText(status: number): string {
	const statusMap: Record<number, string> = {
		0: "已下架",
		1: "可借用",
		2: "借用中",
	};
	return statusMap[status] || "未知";
}

function onStartDateChange(e: any) {
	bookForm.value.startDate = e.detail.value;
}

function onEndDateChange(e: any) {
	bookForm.value.endDate = e.detail.value;
}

function formatToday(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function isBeforeToday(dateString: string): boolean {
	return dateString < formatToday();
}

function isEndBeforeStart(startDate: string, endDate: string): boolean {
	return endDate < startDate;
}

function checkFavoriteStatus() {
	if (!userStore.isLogin) return;

	favoriteApi
		.checkFavorite(shareItemId.value)
		.then((res: any) => {
			const data = res.data ?? res;
			isFavorited.value = !!data;
		})
		.catch(() => {
			isFavorited.value = false;
		});
}

function handleBook() {
	if (!bookForm.value.startDate) {
		uni.showToast({ title: "请选择开始日期", icon: "none" });
		return;
	}
	if (!bookForm.value.endDate) {
		uni.showToast({ title: "请选择结束日期", icon: "none" });
		return;
	}
	if (isBeforeToday(bookForm.value.startDate)) {
		uni.showToast({ title: "开始日期不能早于今天", icon: "none" });
		return;
	}
	if (isEndBeforeStart(bookForm.value.startDate, bookForm.value.endDate)) {
		uni.showToast({ title: "结束日期必须大于开始日期", icon: "none" });
		return;
	}

	shareApi
		.bookShareItem({
			shareId: shareItemId.value,
			startDate: bookForm.value.startDate,
			endDate: bookForm.value.endDate,
			remark: bookForm.value.remark,
		})
		.then((res: any) => {
			closeBookModal();
			const data = res.data || res || {};
			const newBookingId = data.bookingId || data.id;
			uni.showModal({
				title: "预约成功",
				content: "预约已提交，等待物品所有者审批。是否查看预约详情？",
				confirmText: "查看详情",
				cancelText: "留在本页",
				success: (result) => {
					if (result.confirm && newBookingId) {
						uni.navigateTo({
							url: `/pages/share/booking-detail?id=${newBookingId}`,
						});
					}
				},
			});
		})
		.catch((error: any) => {
			// 显示错误信息
			const message =
				error?.message || error?.data?.message || "预约失败，请稍后重试";
			uni.showToast({
				title: message,
				icon: "none",
				duration: 3000,
			});
		});
}

// ========== Owner 管理方法 ==========

// 跳转编辑页
function goToEdit() {
	uni.navigateTo({
		url: `/pages/share/publish?id=${shareItemId.value}&mode=edit`
	});
}

// 下架
function offlineItem() {
	uni.showModal({
		title: '下架物品',
		content: '下架后同学将无法看到此物品，确定下架吗？',
		success: (res) => {
			if (res.confirm) {
				shareApi.updateShareItemStatus(shareItemId.value, 0).then(() => {
					uni.showToast({ title: '已下架', icon: 'success' })
					loadShareItem()
				}).catch(() => {
					uni.showToast({ title: '操作失败', icon: 'none' })
				})
			}
		}
	})
}

// 上架
function onlineItem() {
	shareApi.updateShareItemStatus(shareItemId.value, 1).then(() => {
		uni.showToast({ title: '已上架', icon: 'success' })
		loadShareItem()
	}).catch(() => {
		uni.showToast({ title: '操作失败', icon: 'none' })
	})
}

// 删除
function deleteItem() {
	uni.showModal({
		title: '删除物品',
		content: '删除后无法恢复，确定删除吗？',
		confirmColor: '#ff4d4f',
		success: (res) => {
			if (res.confirm) {
				shareApi.deleteShareItem(shareItemId.value).then(() => {
					uni.showToast({ title: '已删除', icon: 'success' })
					setTimeout(() => uni.navigateBack(), 1500)
				}).catch(() => {
					uni.showToast({ title: '删除失败', icon: 'none' })
				})
			}
		}
	})
}

// 跳转预约列表
function goToBookings() {
	uni.navigateTo({
		url: `/pages/share/bookings?shareId=${shareItemId.value}`
	})
}

// 跳转当前借用详情
function goToActiveBooking() {
	uni.navigateTo({
		url: `/pages/share/bookings?shareId=${shareItemId.value}&tab=received`
	})
}

// 跳转转赠
function goToTransfer() {
	uni.navigateTo({
		url: `/pages/share/transfer?shareId=${shareItemId.value}`
	})
}
</script>

<style lang="scss" scoped>
.detail-page {
	min-height: 100vh;
	background: var(--bg-color-page);
}

.bottom-placeholder {
	height: calc(240rpx + env(safe-area-inset-bottom));
}

.image-swiper {
	width: 100%;
	height: 750rpx;
	background: var(--bg-color-card);

	.item-image {
		width: 100%;
		height: 100%;
	}
}

.info-section {
	background: var(--bg-color-card);
	padding: 24rpx;
	margin-bottom: 16rpx;

	.price-row {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
		gap: 16rpx;

		.rent {
			font-size: var(--spacing-xxl);
			font-weight: 600;
			color: var(--error-color);
		}

		.rent-unit {
			font-size: var(--font-size-base);
			color: var(--error-color);
		}

		.deposit {
			font-size: var(--font-size-base);
			color: var(--text-color-tertiary);
		}

		.status-tag {
			margin-left: auto;
			padding: 4rpx 16rpx;
			border-radius: 4rpx;
			font-size: var(--font-size-sm);
			font-weight: 500;

			&.status-0 {
				background: var(--bg-color-page);
				color: var(--text-color-tertiary);
			}

			&.status-1 {
				background: var(--bg-color-page);
				color: var(--success-color);
			}

			&.status-2 {
				background: var(--bg-color-page);
				color: var(--warning-color);
			}
		}
	}

	.title {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-color-primary);
		line-height: 1.4;
		display: block;
		margin-bottom: 16rpx;
	}

	.available-time {
		display: flex;
		align-items: center;
		gap: 8rpx;

		.time-text {
			font-size: var(--font-size-base);
			color: var(--text-color-secondary);
		}
	}
}

.owner-section {
	display: flex;
	align-items: center;
	background: var(--bg-color-card);
	padding: 24rpx;
	margin-bottom: 16rpx;

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		margin-right: 16rpx;
	}

	.owner-info {
		flex: 1;

		.name {
			font-size: var(--font-size-lg);
			font-weight: 500;
			color: var(--text-color-primary);
		}
	}

	.owner-dashboard {
		flex: 1;

		.dashboard-title {
			font-size: var(--font-size-lg);
			font-weight: 600;
			color: var(--text-color-primary);
			display: block;
			margin-bottom: 8rpx;
		}

		.booking-summary {
			display: flex;
			align-items: center;
			gap: 12rpx;

			.pending-badge {
				padding: 4rpx 12rpx;
				border-radius: 999rpx;
				background: var(--warning-color-alpha-10);
				color: var(--warning-color);
				font-size: var(--font-size-sm);
				font-weight: 600;
			}

			.active-badge {
				padding: 4rpx 12rpx;
				border-radius: 999rpx;
				background: var(--primary-color-alpha-10);
				color: var(--primary-color);
				font-size: var(--font-size-sm);
				font-weight: 600;
			}

			.summary-hint {
				font-size: var(--font-size-sm);
				color: var(--text-color-tertiary);
			}
		}
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 24rpx;
		background: var(--primary-color-alpha-10);
		border-radius: 24rpx;
		color: var(--primary-color);
		font-size: var(--font-size-sm);
	}
}

.desc-section {
	background: var(--bg-color-card);
	padding: 24rpx;
	margin-bottom: 16rpx;

	.section-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-color-primary);
		display: block;
		margin-bottom: 16rpx;
	}

	.desc-text {
		font-size: var(--font-size-base);
		color: var(--text-color-secondary);
		line-height: 1.6;
		white-space: pre-wrap;
	}
}

.bottom-bar {
	position: fixed;
	left: 16rpx;
	right: 16rpx;
	bottom: calc(16rpx + env(safe-area-inset-bottom));
	z-index: 100;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	padding: 20rpx;
	border-radius: 32rpx;
	background: linear-gradient(
		180deg,
		rgba(255, 255, 255, 0.96) 0%,
		rgba(255, 255, 255, 0.9) 100%
	);
	border: 1px solid rgba(255, 255, 255, 0.75);
	box-shadow: 0 20rpx 48rpx rgba(249, 114, 154, 0.18), 0 8rpx 20rpx rgba(0, 0, 0, 0.08);
	transition: opacity 0.18s ease, transform 0.18s ease;

	.bottom-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;

		.summary-copy {
			display: flex;
			flex-direction: column;
			gap: 8rpx;
			min-width: 0;

			.summary-eyebrow {
				font-size: 22rpx;
				color: var(--text-color-tertiary);
				letter-spacing: 2rpx;
			}

			.summary-price-row {
				display: flex;
				align-items: baseline;
				gap: 10rpx;
				flex-wrap: wrap;

				.summary-price {
					font-size: 34rpx;
					font-weight: 800;
					color: var(--text-color-primary);
					line-height: 1;
				}

				.summary-unit {
					font-size: 24rpx;
					color: var(--text-color-secondary);
				}

				.summary-deposit {
					font-size: 24rpx;
					color: var(--text-color-secondary);
					padding: 4rpx 12rpx;
					border-radius: 999rpx;
					background: rgba(0, 0, 0, 0.04);
				}
			}

			.owner-status-row {
				display: flex;
				flex-direction: column;
				gap: 4rpx;

				.owner-status-text {
					font-size: 32rpx;
					font-weight: 700;
					color: var(--text-color-primary);
				}

				.owner-status-hint {
					font-size: 22rpx;
					color: var(--text-color-tertiary);
				}
			}
		}

		.summary-state {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 4rpx;
			padding: 10rpx 16rpx;
			border-radius: 20rpx;
			background: linear-gradient(
				135deg,
				rgba(249, 114, 154, 0.08),
				rgba(249, 114, 154, 0.16)
			);

			.summary-state-text {
				font-size: 24rpx;
				font-weight: 700;
				color: var(--primary-color);
			}

			.summary-state-hint {
				font-size: 20rpx;
				color: var(--text-color-tertiary);
			}

			&.state-2 {
				background: linear-gradient(
					135deg,
					rgba(255, 193, 7, 0.08),
					rgba(255, 193, 7, 0.16)
				);

				.summary-state-text {
					color: var(--warning-color);
				}
			}

			&.state-0 {
				background: linear-gradient(
					135deg,
					rgba(148, 163, 184, 0.08),
					rgba(148, 163, 184, 0.16)
				);

				.summary-state-text {
					color: var(--text-color-tertiary);
				}
			}
		}
	}

	.bottom-actions {
		display: flex;
		align-items: center;
		gap: 12rpx;

		.action-chip {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8rpx;
			height: 88rpx;
			padding: 0 18rpx;
			border-radius: 26rpx;
			background: rgba(255, 255, 255, 0.85);
			border: 1px solid rgba(0, 0, 0, 0.06);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);

			.action-chip-text {
				font-size: 24rpx;
				color: var(--text-color-secondary);
				white-space: nowrap;
			}

			&.favorite {
				min-width: 134rpx;
			}

			&.contact {
				min-width: 156rpx;
			}

			&:active {
				transform: scale(0.98);
			}
		}

		.book-btn {
			flex: 1;
			min-width: 0;
			height: 88rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 2rpx;
			padding: 0 20rpx;
			background: linear-gradient(
				135deg,
				var(--primary-color) 0%,
				var(--primary-color-dark) 100%
			);
			color: var(--bg-color-card);
			border-radius: 26rpx;
			border: none;
			box-shadow: 0 12rpx 24rpx rgba(249, 114, 154, 0.28);

			.book-btn-label {
				font-size: 30rpx;
				font-weight: 700;
				line-height: 1;
			}

			.book-btn-sub {
				font-size: 20rpx;
				opacity: 0.9;
				line-height: 1.1;
			}

			&:active {
				transform: translateY(1rpx) scale(0.99);
			}

			&.disabled {
				background: linear-gradient(
					135deg,
					rgba(148, 163, 184, 0.7) 0%,
					rgba(148, 163, 184, 0.9) 100%
				);
				color: var(--bg-color-card);
				box-shadow: none;
			}
		}

		.owner-action-btn {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 88rpx;
			border-radius: 9999px;
			font-size: 24rpx;
			color: var(--text-color-secondary);
			background: var(--bg-color-page);
			box-shadow: 4rpx 4rpx 12rpx rgba(0, 0, 0, 0.08),
				-2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
			border: 2rpx solid rgba(255, 255, 255, 0.5);
			transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

			&.primary {
				background: var(--primary-color);
				color: var(--text-color-inverse);
				border-color: transparent;
				box-shadow: 0 8rpx 20rpx var(--primary-color-alpha-20);
			}

			&.warning {
				background: var(--warning-color);
				color: var(--text-color-inverse);
				border-color: transparent;
			}

			&.danger {
				background: var(--error-color);
				color: var(--text-color-inverse);
				border-color: transparent;
			}

			&:active {
				transform: scale(0.95);
				box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.08),
					inset -1rpx -1rpx 4rpx rgba(255, 255, 255, 0.4);
			}
		}
	}

	&.is-hidden {
		opacity: 0;
		transform: translateY(120%);
		pointer-events: none;
	}
}

.book-modal {
	background: var(--bg-color-card);
	border-radius: 24rpx 24rpx 0 0;
	max-height: 80vh;
	width: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;

	.modal-header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx;
		border-bottom: 1px solid var(--border-color-base);

		.modal-title {
			font-size: var(--font-size-lg);
			font-weight: 600;
			color: var(--text-color-primary);
		}
	}

	.modal-body {
		flex: 1;
		min-height: 0;
		padding: 24rpx;
		overflow-y: auto;

		.form-item {
			margin-bottom: 24rpx;

			.label {
				font-size: var(--font-size-base);
				color: var(--text-color-primary);
				display: block;
				margin-bottom: 12rpx;
			}

			.picker-value {
				display: flex;
				align-items: center;
				justify-content: space-between;
				height: 88rpx;
				padding: 0 24rpx;
				background: var(--bg-color-page);
				border-radius: var(--spacing-sm);
				font-size: var(--font-size-base);
			}

			.textarea {
				width: 100%;
				min-height: 160rpx;
				padding: 16rpx;
				background: var(--bg-color-page);
				border-radius: var(--spacing-sm);
				font-size: var(--font-size-base);
				line-height: 1.6;
			}
		}

		.cost-section {
			background: var(--bg-color-page);
			border-radius: var(--spacing-sm);
			padding: 24rpx;
			margin-bottom: 24rpx;

			.cost-item {
				display: flex;
				justify-content: space-between;
				padding: 12rpx 0;

				&.total {
					border-top: 1px solid var(--border-color-base);
					margin-top: 12rpx;
					padding-top: 16rpx;

					.cost-label {
						font-size: var(--font-size-lg);
						font-weight: 600;
					}

					.cost-value {
						font-size: var(--font-size-xxl);
						font-weight: 600;
						color: var(--error-color);
					}
				}

				.cost-label {
					font-size: var(--font-size-base);
					color: var(--text-color-secondary);
				}

				.cost-value {
					font-size: var(--font-size-base);
					color: var(--text-color-primary);
				}
			}
		}
	}

	.modal-footer {
		flex-shrink: 0;
		padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
		border-top: 1px solid var(--border-color-base);
		background: var(--bg-color-card);

		.confirm-btn {
			width: 100%;
			height: 88rpx;
			background: var(--primary-color);
			color: var(--bg-color-card);
			font-size: var(--font-size-lg);
			border-radius: 12rpx;
			border: none;
		}
	}
}
</style>
