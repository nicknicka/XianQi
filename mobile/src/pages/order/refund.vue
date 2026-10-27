<template>
  <view class="refund-page" :style="themeStyle">
    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: currentTab === tab.value }]"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 退款列表 -->
    <scroll-view class="refund-list" scroll-y @scrolltolower="loadMore">
      <!-- 申请退款 -->
      <view v-if="currentTab === 'apply' && orderInfo" class="apply-section">
        <!-- 订单信息 -->
        <view class="order-info-card">
          <view class="card-title">订单信息</view>
          <view class="product-item" @click="goToProduct(orderInfo.productId)">
            <lazy-image class="product-image" :src="orderInfo.productImage" mode="aspectFill" width="120" height="120" />
            <view class="product-details">
              <text class="product-title">{{ orderInfo.productTitle }}</text>
              <text class="product-price">¥{{ orderInfo.productPrice }}</text>
            </view>
          </view>
          <view class="order-details">
            <view class="detail-row">
              <text class="label">订单编号：</text>
              <text class="value">{{ orderInfo.orderNo }}</text>
            </view>
            <view class="detail-row">
              <text class="label">下单时间：</text>
              <text class="value">{{ orderInfo.createTime }}</text>
            </view>
            <view class="detail-row">
              <text class="label">订单金额：</text>
              <text class="value price">¥{{ orderInfo.totalAmount }}</text>
            </view>
          </view>
        </view>

        <!-- 退款表单 -->
        <view class="refund-form-card">
          <view class="card-title">申请退款</view>

          <!-- 退款原因 -->
          <view class="form-item">
            <view class="item-label required">退款原因</view>
            <picker mode="selector" :range="refundReasons" range-key="label" @change="onReasonChange">
              <view class="picker-value">
                <text :class="{ placeholder: !selectedReason }">
                  {{ selectedReason || '请选择退款原因' }}
                </text>
                <uni-icons type="right" size="16" :color="primaryColor" />
              </view>
            </picker>
          </view>

          <!-- 退款说明 -->
          <view class="form-item">
            <view class="item-label">退款说明</view>
            <textarea
              v-model="refundForm.description"
              class="textarea-input"
              placeholder="请详细描述退款原因（选填）"
              maxlength="200"
            />
          </view>

          <!-- 上传图片 -->
          <view class="form-item">
            <view class="item-label">上传凭证</view>
            <image-uploader
              v-model="refundForm.images"
              :max-count="3"
              :show-cover-tag="false"
              tip="最多上传3张图片"
            />
          </view>

          <!-- 退款金额 -->
          <view class="refund-amount">
            <text class="amount-label">退款金额：</text>
            <text class="amount-value">¥{{ orderInfo.totalAmount }}</text>
          </view>
        </view>

        <!-- 提交按钮 -->
        <view class="submit-section">
          <button class="submit-btn" @click="submitRefund">提交退款申请</button>
        </view>
      </view>

      <!-- 退款记录 -->
      <view v-if="currentTab === 'records'" class="records-list">
        <view v-if="refundList.length === 0" class="empty-container">
          <empty-state text="暂无退款记录" />
        </view>

        <view v-for="record in refundList" :key="record.id" class="refund-record-card">
          <!-- 状态标签 -->
          <view class="record-header">
            <text class="order-no">订单号：{{ record.orderNo }}</text>
            <view :class="['status-tag', `status-${record.status}`]">
              {{ getStatusText(record.status) }}
            </view>
          </view>

          <!-- 商品信息 -->
          <view class="record-product">
            <lazy-image class="product-image" :src="record.productImage" mode="aspectFill" width="100" height="100" />
            <view class="product-details">
              <text class="product-title">{{ record.productTitle }}</text>
              <text class="refund-amount">退款金额：¥{{ record.refundAmount }}</text>
            </view>
          </view>

          <!-- 退款信息 -->
          <view class="record-info">
            <view class="info-row">
              <text class="label">退款原因：</text>
              <text class="value">{{ record.reason }}</text>
            </view>
            <view v-if="record.description" class="info-row">
              <text class="label">退款说明：</text>
              <text class="value">{{ record.description }}</text>
            </view>
            <view class="info-row">
              <text class="label">申请时间：</text>
              <text class="value">{{ record.createTime }}</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="record-actions">
            <button v-if="record.status === 0" class="action-btn cancel-btn" @click="cancelRefund(record.id)">
              撤销申请
            </button>
            <button v-if="record.status === 2" class="action-btn retry-btn" @click="retryRefund(record)">
              重新申请
            </button>
            <button class="action-btn detail-btn" @click="viewRefundDetail(record)">
              查看详情
            </button>
          </view>

          <!-- 退款进度 -->
          <view v-if="record.status === 1" class="refund-progress">
            <view class="progress-item">
              <view class="progress-icon active">1</view>
              <text class="progress-text">提交申请</text>
            </view>
            <view class="progress-line active" />
            <view class="progress-item">
              <view class="progress-icon active">2</view>
              <text class="progress-text">商家处理</text>
            </view>
            <view :class="['progress-line', { active: record.status >= 3 }]" />
            <view class="progress-item">
              <view :class="['progress-icon', { active: record.status >= 3 }]">3</view>
              <text class="progress-text">退款完成</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="hasMore" class="load-more">
          <uni-load-more status="loading" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { orderApi } from '@/api/order'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

const tabs = ref([
  { label: '申请退款', value: 'apply' },
  { label: '退款记录', value: 'records' }
])

const currentTab = ref('apply')
const orderId = ref<string>('')
const orderInfo = ref<any>(null)

const refundReasons = ref([
  { value: 1, label: '不想要了' },
  { value: 2, label: '商品信息描述不符' },
  { value: 3, label: '质量问题' },
  { value: 4, label: '假冒品牌' },
  { value: 5, label: '货物破损' },
  { value: 6, label: '未按约定时间发货' },
  { value: 7, label: '其他原因' }
])

const selectedReason = ref('')
const refundForm = ref({
  reason: '',
  description: '',
  images: [] as string[]
})

const refundList = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

onShow(() => {
  useThemePage()
})


onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  orderId.value = options.id || ''

  if (currentTab.value === 'apply' && orderId.value) {
    loadOrderInfo()
  }
})

function switchTab(value: string) {
  currentTab.value = value
  if (value === 'records') {
    loadRefundRecords()
  }
}

function loadOrderInfo() {
  orderApi.getOrderDetail(orderId.value).then((res: any) => {
    orderInfo.value = res.data
  }).catch(() => {
    uni.showToast({ title: '加载订单信息失败', icon: 'none' })
  })
}

function loadRefundRecords() {
  orderApi.getRefundList({
    page: page.value,
    pageSize: pageSize.value
  }).then((res: any) => {
    const data = res.data || {}
    if (page.value === 1) {
      refundList.value = data.list || []
    } else {
      refundList.value.push(...(data.list || []))
    }
    hasMore.value = refundList.value.length < (data.total || 0)
  }).catch(() => {
    uni.showToast({ title: '加载失败', icon: 'none' })
  })
}

function loadMore() {
  if (!hasMore.value || currentTab.value !== 'records') return
  page.value++
  loadRefundRecords()
}

function onReasonChange(e: any) {
  const index = e.detail.value
  selectedReason.value = refundReasons.value[index].label
  refundForm.value.reason = refundReasons.value[index].value
}

function submitRefund() {
  if (!refundForm.value.reason) {
    uni.showToast({ title: '请选择退款原因', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认退款',
    content: `申请退款金额 ¥${orderInfo.value?.totalAmount || 0}，提交后商家将进行处理`,
    success: (res) => {
      if (res.confirm) {
        const submitData = {
          orderId: orderId.value,
          reason: refundForm.value.reason,
          description: refundForm.value.description,
          images: refundForm.value.images
        }

        orderApi.applyRefund(submitData).then(() => {
          uni.showToast({ title: '退款申请已提交', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }).catch(() => {
          uni.showToast({ title: '提交失败', icon: 'none' })
        })
      }
    }
  })
}

function cancelRefund(refundId: string) {
  uni.showModal({
    title: '撤销申请',
    content: '确定要撤销退款申请吗？',
    success: (res) => {
      if (res.confirm) {
        orderApi.cancelRefund(refundId).then(() => {
          uni.showToast({ title: '已撤销退款申请', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function retryRefund(record: any) {
  // 跳转到申请退款页面，预填信息
  uni.navigateTo({
    url: `/pages/order/refund?id=${record.orderId}&retry=true`
  })
}

function viewRefundDetail(record: any) {
  uni.navigateTo({
    url: `/pages/order/refund-detail?id=${record.id}`
  })
}

function goToProduct(productId: string) {
  uni.navigateTo({
    url: `/pages/market/detail?id=${productId}`
  })
}

function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待处理',
    1: '处理中',
    2: '已拒绝',
    3: '退款成功',
    4: '退款失败'
  }
  return statusMap[status] || '未知'
}

function refreshList() {
  page.value = 1
  refundList.value = []
  loadRefundRecords()
}
</script>

<style lang="scss" scoped>
.refund-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
}

.tab-bar {
  display: flex;
  background: var(--bg-color-card);
  border-bottom: 1px solid var(--border-color-light);

  .tab-item {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-base);
    color: var(--text-color-secondary);
    position: relative;

    &.active {
      color: var(--primary-color);
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background: var(--primary-color);
        border-radius: 2rpx;
      }
    }
  }
}

.refund-list {
  flex: 1;
  padding: 16rpx;
}

.apply-section {
  .order-info-card,
  .refund-form-card {
    background: var(--bg-color-card);
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;

    .card-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 16rpx;
    }
  }

  .product-item {
    display: flex;
    gap: 16rpx;
    padding: 16rpx;
    background: var(--bg-color-page);
    border-radius: var(--spacing-sm);
    margin-bottom: 16rpx;

    .product-image {
      width: 120rpx;
      height: 120rpx;
      border-radius: var(--spacing-sm);
      flex-shrink: 0;
    }

    .product-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .product-title {
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .product-price {
        font-size: var(--font-size-xl);
        color: var(--primary-color);
        font-weight: 600;
      }
    }
  }

  .order-details {
    .detail-row {
      display: flex;
      font-size: 13px;
      margin-bottom: 12rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--text-color-tertiary);
        width: 140rpx;
        flex-shrink: 0;
      }

      .value {
        color: var(--text-color-primary);
        flex: 1;

        &.price {
          color: var(--primary-color);
          font-weight: 600;
        }
      }
    }
  }

  .form-item {
    margin-bottom: 24rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .item-label {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      margin-bottom: 12rpx;

      &.required::before {
        content: '*';
        color: var(--error-color);
        margin-right: 4rpx;
      }
    }

    .picker-value {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      padding: 0 24rpx;

      text {
        font-size: var(--font-size-base);

        &.placeholder {
          color: var(--text-color-tertiary);
        }
      }
    }

    .textarea-input {
      width: 100%;
      min-height: 160rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      padding: 16rpx;
      font-size: var(--font-size-base);
    }
  }

  .refund-amount {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-top: 16rpx;
    border-top: 1px solid var(--border-color-light);

    .amount-label {
      font-size: var(--font-size-base);
      color: var(--text-color-secondary);
      margin-right: 8rpx;
    }

    .amount-value {
      font-size: var(--spacing-xl);
      color: var(--primary-color);
      font-weight: 600;
    }
  }

  .submit-section {
    margin-top: 24rpx;

    .submit-btn {
      width: 100%;
      height: 88rpx;
      background: var(--primary-color);
      color: var(--bg-color-card);
      font-size: var(--font-size-lg);
      font-weight: 600;
      border-radius: 9999px;
      border: none;
    }
  }
}

.records-list {
  .empty-container {
    padding-top: 200rpx;
  }
}

.refund-record-card {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .order-no {
      font-size: 13px;
      color: var(--text-color-tertiary);
    }

    .status-tag {
      padding: 6rpx 16rpx;
      border-radius: 9999px;
      font-size: var(--font-size-sm);
      font-weight: 500;

      &.status-0 {
        background: var(--primary-color-alpha-10);
        color: var(--primary-color);
      }

      &.status-1 {
        background: #e6f7ff;
        color: var(--info-color);
      }

      &.status-2 {
        background: var(--danger-color-alpha-10);
        color: var(--error-color);
      }

      &.status-3 {
        background: var(--success-color-alpha-10);
        color: var(--success-color);
      }

      &.status-4 {
        background: var(--bg-color-page);
        color: var(--text-color-tertiary);
      }
    }
  }

  .record-product {
    display: flex;
    gap: 16rpx;
    padding: 16rpx;
    background: var(--bg-color-page);
    border-radius: var(--spacing-sm);
    margin-bottom: 16rpx;

    .product-image {
      width: 100rpx;
      height: 100rpx;
      border-radius: var(--spacing-sm);
      flex-shrink: 0;
    }

    .product-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .product-title {
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .refund-amount {
        font-size: var(--font-size-base);
        color: var(--primary-color);
        font-weight: 500;
      }
    }
  }

  .record-info {
    margin-bottom: 16rpx;

    .info-row {
      display: flex;
      font-size: 13px;
      margin-bottom: 8rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--text-color-tertiary);
        width: 140rpx;
        flex-shrink: 0;
      }

      .value {
        color: var(--text-color-primary);
        flex: 1;
      }
    }
  }

  .record-actions {
    display: flex;
    gap: 12rpx;
    justify-content: flex-end;
    margin-bottom: 16rpx;

    .action-btn {
      min-width: 140rpx;
      height: 60rpx;
      line-height: 60rpx;
      border-radius: 9999px;
      font-size: var(--font-size-base);
      border: none;

      &.cancel-btn,
      &.retry-btn {
        background: var(--bg-color-page);
        color: var(--text-color-secondary);
      }

      &.detail-btn {
        background: var(--bg-color-card);
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
      }
    }
  }

  .refund-progress {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;

    .progress-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;

      .progress-icon {
        width: 48rpx;
        height: 48rpx;
        border-radius: 50%;
        background: var(--border-color-base);
        color: var(--text-color-tertiary);
        font-size: var(--font-size-sm);
        display: flex;
        align-items: center;
        justify-content: center;

        &.active {
          background: var(--primary-color);
          color: var(--bg-color-card);
        }
      }

      .progress-text {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);

        .progress-icon.active + & {
          color: var(--text-color-primary);
        }
      }
    }

    .progress-line {
      flex: 1;
      height: 2px;
      background: var(--border-color-base);
      margin: 0 8rpx;

      &.active {
        background: var(--primary-color);
      }
    }
  }
}

.load-more {
  padding: 24rpx 0;
  text-align: center;
}
</style>
