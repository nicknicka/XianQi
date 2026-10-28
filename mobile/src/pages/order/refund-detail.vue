<template>
  <view class="refund-detail-page" :style="themeStyle">
    <!-- 骨架屏 -->
    <view v-if="pageLoading" class="skeleton-container">
      <view class="skeleton-status-section">
        <view class="skeleton-status-text skeleton-shimmer"></view>
        <view class="skeleton-status-desc skeleton-shimmer"></view>
      </view>
      <view class="skeleton-section">
        <view class="skeleton-section-title skeleton-shimmer"></view>
        <view class="skeleton-info-item">
          <view class="skeleton-label skeleton-shimmer"></view>
          <view class="skeleton-value skeleton-shimmer"></view>
        </view>
        <view class="skeleton-info-item">
          <view class="skeleton-label skeleton-shimmer"></view>
          <view class="skeleton-value skeleton-shimmer"></view>
        </view>
      </view>
      <view class="skeleton-section">
        <view class="skeleton-section-title skeleton-shimmer"></view>
        <view class="skeleton-product-card">
          <view class="skeleton-image skeleton-shimmer"></view>
          <view class="skeleton-info">
            <view class="skeleton-title skeleton-shimmer"></view>
            <view class="skeleton-price skeleton-shimmer"></view>
          </view>
        </view>
      </view>
    </view>

    <scroll-view v-else class="scroll-view" scroll-y>
      <!-- 退款状态 -->
      <view class="status-section animate-fade-in-up" :class="'status-' + refund.status" style="animation-delay: 0s">
        <view class="status-info">
          <text class="status-text">{{ refund.statusDesc }}</text>
          <text class="status-desc">{{ getStatusDesc(refund.status) }}</text>
        </view>
      </view>

      <!-- 退款信息 -->
      <view class="section animate-fade-in-up" style="animation-delay: 0.1s">
        <view class="section-title">退款信息</view>
        <view class="info-list">
          <view class="info-item">
            <text class="label">退款单号</text>
            <text class="value">{{ refund.refundNo }}</text>
          </view>
          <view class="info-item">
            <text class="label">退款金额</text>
            <text class="value amount">¥{{ refund.refundAmount }}</text>
          </view>
          <view class="info-item">
            <text class="label">退款类型</text>
            <text class="value">{{ refund.refundTypeDesc }}</text>
          </view>
          <view class="info-item">
            <text class="label">退款原因</text>
            <text class="value">{{ refund.refundReason }}</text>
          </view>
          <view v-if="refund.rejectReason" class="info-item">
            <text class="label">拒绝原因</text>
            <text class="value reject-reason">{{ refund.rejectReason }}</text>
          </view>
          <view class="info-item">
            <text class="label">申请时间</text>
            <text class="value">{{ formatTime(refund.createdAt) }}</text>
          </view>
          <view v-if="refund.finishTime" class="info-item">
            <text class="label">完成时间</text>
            <text class="value">{{ formatTime(refund.finishTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 商品信息 -->
      <view class="section animate-fade-in-up" style="animation-delay: 0.2s">
        <view class="section-title">商品信息</view>
        <view class="product-card" @click="goProduct">
          <lazy-image class="product-image" :src="refund.productImage" error-icon="image" mode="aspectFill" width="160" height="160" />
          <view class="product-info">
            <text class="product-title">{{ refund.productName }}</text>
            <text v-if="refund.productSpec" class="product-spec">{{ refund.productSpec }}</text>
            <text class="product-price">¥{{ refund.refundAmount }}</text>
          </view>
        </view>
      </view>

      <!-- 退款凭证 -->
      <view v-if="refund.evidenceImages && refund.evidenceImages.length > 0" class="section animate-fade-in-up" style="animation-delay: 0.3s">
        <view class="section-title">退款凭证</view>
        <view class="evidence-images">
          <lazy-image
            v-for="(img, index) in refund.evidenceImages"
            :key="index"
            class="evidence-image"
            :src="img"
            mode="aspectFill"
            width="200"
            height="200"
            @click="previewImage(index)"
          />
        </view>
      </view>

      <!-- 物流信息 -->
      <view v-if="refund.logisticsCompany" class="section animate-fade-in-up" style="animation-delay: 0.4s">
        <view class="section-title">退货物流</view>
        <view class="info-list">
          <view class="info-item">
            <text class="label">物流公司</text>
            <text class="value">{{ refund.logisticsCompany }}</text>
          </view>
          <view class="info-item">
            <text class="label">物流单号</text>
            <text class="value">{{ refund.logisticsNo }}</text>
          </view>
          <view v-if="refund.logisticsTime" class="info-item">
            <text class="label">发货时间</text>
            <text class="value">{{ formatTime(refund.logisticsTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view v-if="refund.remark" class="section">
        <view class="section-title">备注</view>
        <text class="remark-text">{{ refund.remark }}</text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="showActions" class="bottom-actions animate-slide-up" style="animation-delay: 0.5s">
      <view
        v-if="refund.status === 0"
        class="action-btn secondary"
        @click="cancelRefund"
      >
        <text class="btn-text">取消退款</text>
      </view>
      <view
        v-if="refund.status === 1 && refund.refundType === 2"
        class="action-btn primary"
        @click="fillLogistics"
      >
        <text class="btn-text">填写退货物流</text>
      </view>
      <view
        class="action-btn"
        @click="goOrder"
      >
        <text class="btn-text">查看订单</text>
      </view>
      <view
        class="action-btn"
        @click="contactSeller"
      >
        <text class="btn-text">联系卖家</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {onLoad, onShow} from '@dcloudio/uni-app'
import { refundApi } from '@/api/refund'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import {useThemeStyle, useThemePage} from '@/utils/theme'

const { themeStyle } = useThemeStyle()

interface RefundDetail {
  refundId: string
  refundNo: string
  orderId: string
  orderNo: string
  productId: string
  productName: string
  productSpec: string
  productImage: string
  buyerId: string
  buyerNickname: string
  sellerId: string
  sellerNickname: string
  refundAmount: number
  refundReason: string
  refundType: number
  refundTypeDesc: string
  status: number
  statusDesc: string
  rejectReason: string
  logisticsCompany: string
  logisticsNo: string
  logisticsTime: string
  evidenceImages: string[]
  remark: string
  createdAt: string
  updatedAt: string
  finishTime: string
}

const pageLoading = ref(true)
const refund = ref<RefundDetail>({} as RefundDetail)
const refundId = ref<string>('')

// 是否显示操作按钮
const showActions = computed(() => {
  return refund.value.status === 0 || refund.value.status === 1
})

onShow(() => {
  useThemePage()
})


onLoad((options: any) => {
  refundId.value = options.id || ''
  loadRefundDetail()
})

// 加载退款详情
async function loadRefundDetail() {
  try {
    const response = await refundApi.getRefundDetail(refundId.value)
    const data = response?.data || {}
    refund.value = data
  } catch (error) {
    console.error('获取退款详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageLoading.value = false
  }
}

// 获取状态描述
function getStatusDesc(status: number): string {
  const descMap: Record<number, string> = {
    0: '等待卖家处理',
    1: '卖家已同意，请按流程操作',
    2: '卖家拒绝了您的退款申请',
    3: '已寄回商品，等待卖家确认',
    4: '退款已完成',
    5: '退款已取消'
  }
  return descMap[status] || ''
}

// 格式化时间
function formatTime(time: string): string {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 19)
}

// 取消退款
function cancelRefund() {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消该退款申请吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          await refundApi.cancelRefund(refund.value.refundId)
          uni.hideLoading()
          uni.showToast({
            title: '取消成功',
            icon: 'success'
          })
          loadRefundDetail()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({
            title: '取消失败',
            icon: 'error'
          })
        }
      }
    }
  })
}

// 填写物流
function fillLogistics() {
  uni.navigateTo({
    url: `/pages/order/refund-logistics?id=${refund.value.refundId}`
  })
}

// 查看商品
function goProduct() {
  uni.navigateTo({
    url: `/pages/market/detail?id=${refund.value.productId}`
  })
}

// 查看订单
function goOrder() {
  const orderId = refund.value.orderId
  if (!orderId || orderId === 'undefined') {
    console.error('[退款详情] 订单ID无效:', orderId)
    uni.showToast({
      title: '订单ID不存在',
      icon: 'none'
    })
    return
  }

  uni.navigateTo({
    url: `/pages/order/detail?id=${orderId}`
  })
}

// 联系卖家
function contactSeller() {
  uni.navigateTo({
    url: `/pages/message/chat?userId=${refund.value.sellerId}`
  })
}

// 预览图片
function previewImage(index: number) {
  uni.previewImage({
    current: index,
    urls: refund.value.evidenceImages || []
  })
}
</script>

<style lang="scss" scoped>
.refund-detail-page {
  min-height: 100vh;
  background: var(--bg-color-page);
}

.skeleton-container {
  padding: 20rpx;
}

@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.skeleton-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(90deg, var(--border-color-light) 25%, #e0e0e0 50%, var(--border-color-light) 75%);
  background-size: 468px 100%;
}

.skeleton-status-section {
  height: 200rpx;
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.skeleton-status-text {
  width: 200rpx;
  height: 48rpx;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.skeleton-status-desc {
  width: 300rpx;
  height: 36rpx;
  border-radius: 8rpx;
}

.skeleton-section {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.skeleton-section-title {
  width: 150rpx;
  height: 36rpx;
  border-radius: 8rpx;
  margin-bottom: 30rpx;
}

.skeleton-info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.skeleton-label {
  width: 150rpx;
  height: 32rpx;
  border-radius: 8rpx;
}

.skeleton-value {
  width: 300rpx;
  height: 32rpx;
  border-radius: 8rpx;
}

.skeleton-product-card {
  display: flex;
  gap: 24rpx;
}

.skeleton-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-title {
  width: 300rpx;
  height: 36rpx;
  border-radius: 8rpx;
}

.skeleton-price {
  width: 120rpx;
  height: 36rpx;
  border-radius: 8rpx;
}

.skeleton-user-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.skeleton-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.skeleton-user-name {
  width: 200rpx;
  height: 32rpx;
  border-radius: 8rpx;
}

.scroll-view {
  height: 100vh;
  padding-bottom: 120rpx;
}

.status-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;

  &.status-0 {
    background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
  }

  &.status-1 {
    background: linear-gradient(135deg, #42A5F5 0%, #1976D2 100%);
  }

  &.status-2 {
    background: linear-gradient(135deg, #EF5350 0%, #C62828 100%);
  }

  &.status-3 {
    background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
  }

  &.status-4 {
    background: linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%);
  }

  &.status-5 {
    background: linear-gradient(135deg, #9E9E9E 0%, #757575 100%);
  }
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.status-text {
  font-size: 48rpx;
  font-weight: bold;
  color: var(--bg-color-card);
}

.status-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.section {
  background: var(--bg-color-card);
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
  border-radius: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-color-primary);
  margin-bottom: 30rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 28rpx;
  color: var(--text-color-tertiary);
}

.value {
  font-size: 28rpx;
  color: var(--text-color-primary);
  text-align: right;
  flex: 1;
  margin-left: 20rpx;

  &.amount {
    font-size: 36rpx;
    font-weight: bold;
    color: var(--error-color);
  }

  &.reject-reason {
    color: var(--error-color);
  }
}

.product-card {
  display: flex;
  gap: 24rpx;
  padding: 20rpx;
  background: var(--bg-color-page);
  border-radius: 20rpx;
}

.product-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 30rpx;
  color: var(--text-color-primary);
  font-weight: 500;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-spec {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
  margin-top: 8rpx;
}

.product-price {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--error-color);
  align-self: flex-end;
}

.evidence-images {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.evidence-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
}

.remark-text {
  font-size: 28rpx;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.bottom-placeholder {
  height: 120rpx;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background: var(--bg-color-card);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 500;
  border: 2rpx solid var(--border-color-base);
  background: var(--bg-color-card);

  &.primary {
    background: var(--primary-color);
    border: none;
    color: var(--bg-color-card);
  }

  &.secondary {
    border-color: var(--error-color);
    color: var(--error-color);
  }
}

.btn-text {
  color: inherit;
}

// 动画关键帧
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
</style>
