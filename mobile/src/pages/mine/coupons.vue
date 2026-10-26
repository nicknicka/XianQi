<template>
  <view class="coupons-page service-redesign-page">
    <!-- 优惠券类型切换 -->
    <view class="type-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view class="tab-count" v-if="tab.count > 0">{{ tab.count }}</view>
        <view class="tab-indicator" v-if="currentTab === tab.value"></view>
      </view>
    </view>

    <!-- 骨架屏 -->
    <SkeletonScreen v-if="isLoading" type="list" :row-count="3" />

    <!-- 优惠券列表 -->
    <PageTransition v-else type="slide-up" stagger :stagger-delay="80">
      <view class="coupons-list">
        <view
          v-for="(item, index) in couponList"
          :key="item.id"
          class="coupon-item stagger-item"
          :style="{ '--stagger-index': index }"
          :class="{
            'coupon-disabled': item.status === 'expired' || item.status === 'used',
            'coupon-used': item.status === 'used'
          }"
        >
          <view class="coupon-left">
            <view class="coupon-amount-wrap">
              <text class="coupon-symbol">¥</text>
              <text class="coupon-amount">{{ item.amount }}</text>
            </view>
            <text class="coupon-condition">{{ item.condition }}</text>
          </view>

          <view class="coupon-divider">
            <view class="divider-circle top"></view>
            <view class="divider-line"></view>
            <view class="divider-circle bottom"></view>
          </view>

          <view class="coupon-right">
            <view class="coupon-info">
              <text class="coupon-title">{{ item.title }}</text>
              <text class="coupon-desc" v-if="item.description">{{ item.description }}</text>
              <text class="coupon-time">{{ item.validStart }} ~ {{ item.validEnd }}</text>
            </view>
            <view
              class="coupon-btn"
              :class="{
                'btn-disabled': item.status !== 'available',
                'btn-used': item.status === 'used',
                'btn-expired': item.status === 'expired'
              }"
              @click="handleCoupon(item)"
            >
              <text class="btn-text">{{ getBtnText(item.status) }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="couponList.length === 0" class="empty-state">
          <image src="/static/images/coupon.png" class="empty-image" mode="aspectFit" />
          <text class="empty-text">{{ getEmptyText() }}</text>
          <view v-if="currentTab === 'available'" class="empty-btn" @click="goGetCoupon">
            <text class="empty-btn-text">去领券中心</text>
          </view>
        </view>
      </view>
    </PageTransition>

    <!-- 领券中心入口 -->
    <view class="coupon-center" @click="goGetCoupon">
      <uni-icons type="gift-filled" size="18" :color="primaryColor" />
      <text class="center-text">领券中心</text>
      <uni-icons type="right" size="14" color="#AAAAAA" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useListData } from '@/hooks/usePageAnimation'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { couponApi, type UserCoupon } from '@/api/coupon'
import {useThemeColors, useThemePage, useThemeStyle} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { primaryColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

type CouponStatus = 'available' | 'used' | 'expired'

interface Coupon {
  id: string
  userCouponId: number
  title: string
  description?: string
  amount: string
  condition: string
  status: CouponStatus
  validStart: string
  validEnd: string
  minAmount?: string
  type?: 'general' | 'category' | 'product'
  categoryIds?: string[]
  productIds?: string[]
}

const tabs = ref([
  { label: '可使用', value: 'available', count: 0 },
  { label: '已使用', value: 'used', count: 0 },
  { label: '已过期', value: 'expired', count: 0 }
])

const currentTab = ref<CouponStatus>('available')

// 状态映射：将前端状态映射到后端状态码
const statusMap: Record<CouponStatus, number> = {
  available: 1, // 可用
  used: 2, // 已使用
  expired: 3 // 已过期
}

const {
  isLoading,
  list: couponList,
  loadFirstPage,
  refresh
} = useListData<Coupon>(
  async () => {
    const { data: { list } } = await couponApi.getMyCoupons({
      status: statusMap[currentTab.value],
      page: 1,
      pageSize: 20
    })

    // 转换后端数据格式到前端需要的格式
    return {
      list: list.map((item: UserCoupon) => ({
        id: String(item.userCouponId),
        userCouponId: item.userCouponId,
        title: item.name,
        description: item.description,
        amount: String(item.discountValue),
        condition: item.minAmount > 0 ? `满${item.minAmount}元可用` : '无门槛',
        status: mapBackendStatusToFrontend(item.status),
        validStart: formatDate(item.validFrom),
        validEnd: formatDate(item.validTo),
        minAmount: String(item.minAmount),
        type: 'general' as const
      })),
      total: list.length
    }
  },
  {
    pageSize: 20,
    showSkeleton: true
  }
)

// 将后端状态码映射到前端状态
function mapBackendStatusToFrontend(status: number): CouponStatus {
  if (status === 1) return 'available'
  if (status === 2) return 'used'
  return 'expired'
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 切换标签
function switchTab(value: string) {
  currentTab.value = value as CouponStatus
  refresh()
}

// 获取按钮文本
function getBtnText(status: CouponStatus): string {
  const btnMap: Record<CouponStatus, string> = {
    available: '立即使用',
    used: '已使用',
    expired: '已过期'
  }
  return btnMap[status] || ''
}

// 获取空状态文本
function getEmptyText(): string {
  const emptyMap: Record<CouponStatus, string> = {
    available: '暂无可用优惠券',
    used: '暂无已使用优惠券',
    expired: '暂无已过期优惠券'
  }
  return emptyMap[currentTab.value] || ''
}

// 处理优惠券
function handleCoupon(item: Coupon) {
  if (item.status === 'available') {
    // 跳转到商品列表或详情页
    if (item.type === 'product' && item.productIds && item.productIds.length > 0) {
      uni.navigateTo({
        url: `/pages/market/detail?id=${item.productIds[0]}`
      })
    } else {
      uni.switchTab({
        url: '/pages/market/list'
      })
    }
  } else if (item.status === 'used') {
    uni.showToast({
      title: '优惠券已使用',
      icon: 'none'
    })
  } else if (item.status === 'expired') {
    uni.showToast({
      title: '优惠券已过期',
      icon: 'none'
    })
  }
}

// 去领券中心
function goGetCoupon() {
  uni.showToast({
    title: '领券中心功能即将上线',
    icon: 'none'
  })
}

// 页面加载

onShow(() => {
  useThemePage()
})

onMounted(() => {
  loadFirstPage()
})
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

// 空状态淡入动画
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

// Tab 栏滑入动画
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

.coupons-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  overflow: hidden;
}

.type-tabs {
  display: flex;
  background: var(--bg-color-card);
  padding: 0 32rpx;
  position: sticky;
  top: 0;
  z-index: 10;
  border-radius: 0 0 20rpx 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  animation: slideDownFade 0.4s ease-out forwards;

  .tab-item {
    flex: 1;
    position: relative;
    padding: 28rpx 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;

    // active 状态背景高光
    &::after {
      content: '';
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

    &.active::after {
      opacity: 1;
    }
  }

  .tab-text {
    font-size: 28rpx;
    color: var(--text-color-secondary);
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  .tab-item.active .tab-text {
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

.tab-count {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: var(--error-color);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: var(--bg-color-card);
  font-weight: 600;
}

.coupons-list {
  padding: 24rpx;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
  animation: fadeInScale 0.3s ease-out forwards;
  opacity: 0;
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

.coupon-item {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  background: linear-gradient(135deg, #FFF8F0 0%, #FFF 100%);
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4rpx 16rpx var(--primary-color-alpha-10);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 点击缩放效果
  &:active {
    transform: scale(0.98);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10rpx,
      rgba(0, 0, 0, 0.02) 10rpx,
      rgba(0, 0, 0, 0.02) 20rpx
    );
    pointer-events: none;
  }

  &.coupon-disabled,
  &.coupon-used {
    background: var(--bg-color-disabled);
    box-shadow: none;

    .coupon-amount,
    .coupon-condition {
      color: var(--text-color-tertiary);
    }

    .coupon-title,
    .coupon-desc,
    .coupon-time {
      color: var(--text-color-tertiary);
    }
  }
}

.coupon-left {
  flex-shrink: 0;
  width: 220rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
  color: #fff;

  .coupon-item.coupon-disabled & {
    background: var(--text-color-placeholder);
  }
}

.coupon-amount-wrap {
  display: flex;
  align-items: baseline;
  margin-bottom: 8rpx;
}

.coupon-symbol {
  font-size: 28rpx;
  font-weight: 600;
}

.coupon-amount {
  font-size: 64rpx;
  font-weight: 700;
  line-height: 1;
}

.coupon-condition {
  font-size: 20rpx;
  opacity: 0.9;
}

.coupon-divider {
  position: relative;
  width: 2rpx;
  background: var(--bg-color-disabled);
}

.divider-circle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 24rpx;
  height: 24rpx;
  background: var(--bg-color-page);
  border-radius: 50%;

  &.top {
    top: -12rpx;
  }

  &.bottom {
    bottom: -12rpx;
  }
}

.divider-line {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    180deg,
    transparent,
    transparent 8rpx,
    var(--border-color-base) 8rpx,
    var(--border-color-base) 12rpx
  );
}

.coupon-right {
  flex: 1;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.coupon-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.coupon-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.coupon-desc {
  font-size: 22rpx;
  color: var(--text-color-tertiary);
}

.coupon-time {
  font-size: 20rpx;
  color: var(--text-color-tertiary);
}

.coupon-btn {
  flex-shrink: 0;
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
  border-radius: 48rpx;
  box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  // 点击涟漪效果
  &::before {
    content: '';
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

  &:active {
    transform: scale(0.92);
    box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-20);
  }

  &.btn-disabled,
  &.btn-used,
  &.btn-expired {
    background: var(--text-color-placeholder);
    box-shadow: none;

    &:active {
      transform: none;
    }
  }
}

.btn-text {
  font-size: 24rpx;
  color: var(--bg-color-card);
  font-weight: 600;
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
  }

  .empty-text {
    font-size: var(--font-size-base);
    color: var(--text-color-tertiary);
    margin-bottom: 48rpx;
  }

  .empty-btn {
    padding: 20rpx 64rpx;
    background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
    border-radius: 48rpx;
    box-shadow: 0 8rpx 24rpx var(--primary-color-alpha-30);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(0.95);
    }
  }

  .empty-btn-text {
    font-size: 28rpx;
    color: var(--bg-color-card);
    font-weight: 600;
  }
}

.coupon-center {
  position: fixed;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 48rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

.center-text {
  font-size: 28rpx;
  color: var(--text-color-primary);
  font-weight: 500;
}
</style>
