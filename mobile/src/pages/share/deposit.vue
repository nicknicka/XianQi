<template>
  <view class="deposit-page service-redesign-page" :style="themeStyle">
    <!-- 押金统计 -->
    <view class="deposit-stats page-animate" :class="{ 'animate-in': isAnimated }">
      <view class="stat-item">
        <text class="stat-value">¥{{ totalDeposit }}</text>
        <text class="stat-label">总押金</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">¥{{ frozenDeposit }}</text>
        <text class="stat-label">冻结中</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">¥{{ availableDeposit }}</text>
        <text class="stat-label">可退还</text>
      </view>
    </view>

    <!-- 押金记录列表 -->
    <scroll-view class="deposit-list" scroll-y @scrolltolower="loadMore">
      <view v-if="depositList.length === 0" class="empty-container">
        <empty-state text="暂无押金记录" image="/static/images/empty.png" tip="完成共享交易后，这里会显示押金记录" />
      </view>

      <view
        v-for="(record, index) in depositList"
        :key="record.id"
        class="deposit-record page-animate"
        :class="{ 'animate-in': isAnimated }"
        :style="{ 'animation-delay': Math.min(index * 0.08, 0.4) + 's' }"
      >
        <!-- 物品信息 -->
        <view class="record-header" @click="goToShareDetail(record.shareItemId)">
          <lazy-image class="item-image" :src="record.shareItemCover" mode="aspectFit" width="100" height="100" />
          <view class="item-info">
            <text class="item-title">{{ record.shareItemTitle }}</text>
            <text class="item-time">{{ record.createdAt }}</text>
          </view>
        </view>

        <!-- 押金详情 -->
        <view class="record-details">
          <view class="detail-row">
            <text class="detail-label">押金金额</text>
            <text class="detail-value amount">¥{{ record.depositAmount }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">押金状态</text>
            <view :class="['status-tag', `status-${record.status}`]">
              {{ getStatusText(record.status) }}
            </view>
          </view>
          <view v-if="record.status === 2" class="detail-row">
            <text class="detail-label">退还时间</text>
            <text class="detail-value">{{ record.refundTime }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="record-actions">
          <!-- 待支付 -->
          <button
            v-if="record.status === 0"
            class="action-btn pay-btn"
            @click="payDeposit(record)"
          >
            去支付
          </button>

          <!-- 已支付 - 等待归还 -->
          <view v-if="record.status === 1" class="status-tip">
            <uni-icons type="info" size="14" color="#AAAAAA" />
            <text>物品归还后押金将自动退还</text>
          </view>

          <!-- 已退还 -->
          <view v-if="record.status === 2" class="status-tip success">
            <uni-icons type="checkmarkempty" size="14" color="var(--success-color)" />
            <text>押金已退还至余额</text>
          </view>

          <!-- 已扣除 -->
          <view v-if="record.status === -1" class="status-tip error">
            <uni-icons type="clear" size="14" :color="dangerColor" />
            <text>{{ record.deductReason || '押金已扣除' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more">
        <uni-load-more status="loading" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { shareApi } from '@/api/share'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { onShow } from '@dcloudio/uni-app'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

// 页面进入动画状态
const isAnimated = ref(false)
const { themeStyle } = useThemeStyle()
const { primaryColor, successColor, warningColor, dangerColor } = useThemeColors()

const depositList = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

const totalDeposit = computed(() => {
  return depositList.value
    .filter(r => r.status >= 0)
    .reduce((sum, r) => sum + (r.depositAmount || 0), 0)
    .toFixed(2)
})

const frozenDeposit = computed(() => {
  return depositList.value
    .filter(r => r.status === 1)
    .reduce((sum, r) => sum + (r.depositAmount || 0), 0)
    .toFixed(2)
})

const availableDeposit = computed(() => {
  return depositList.value
    .filter(r => r.status === 2)
    .reduce((sum, r) => sum + (r.depositAmount || 0), 0)
    .toFixed(2)
})

onShow(() => {
  useThemePage()
})


onMounted(() => {
  loadDepositList()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

function loadDepositList() {
  const requestParams = {
    page: page.value,
    pageSize: pageSize.value
  }

  console.log('[Deposit] 开始加载押金列表:', requestParams)

  shareApi.getDepositList(requestParams).then((response) => {
    console.log('[Deposit] API 响应:', response)

    const data = response.data
    const newList = data.list || []

    console.log('[Deposit] 解析后的数据:', {
      list: newList,
      total: data.total || 0
    })

    if (page.value === 1) {
      depositList.value = newList
    } else {
      depositList.value.push(...newList)
    }
    hasMore.value = depositList.value.length < (data.total || 0)
  }).catch((error) => {
    console.error('[Deposit] 加载失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  })
}

function loadMore() {
  if (!hasMore.value) return
  page.value++
  loadDepositList()
}

function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待支付',
    1: '已支付',
    2: '已退还',
    '-1': '已扣除'
  }
  return statusMap[status] || '未知'
}

function payDeposit(record: any) {
  if (!record.bookingId) {
    uni.showToast({
      title: '预约记录不存在',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '去支付',
    content: '共享预约已改为支付租金和押金，是否前往预约详情完成支付？',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({
          url: `/pages/share/booking-detail?id=${record.bookingId}`
        })
      }
    }
  })
}

function goToShareDetail(shareItemId: string | undefined) {
  if (!shareItemId) {
    uni.showToast({
      title: '共享物品不存在',
      icon: 'none'
    })
    return
  }
  uni.navigateTo({
    url: `/pages/share/detail?id=${shareItemId}`
  })
}

function refreshList() {
  page.value = 1
  depositList.value = []
  loadDepositList()
}
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

// 页面动画样式
.page-animate {
  opacity: 0;
  transform: translateY(30rpx);

  &.animate-in {
    animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}

.deposit-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.deposit-stats {
  display: flex;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
  padding: 48rpx 24rpx;
  margin: var(--spacing-sm) var(--spacing-md);
  border-radius: 20rpx;
  box-shadow: 0 10rpx 30rpx var(--primary-color-alpha-20);

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;

    .stat-value {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--bg-color-card);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .stat-divider {
    width: 1px;
    height: 60rpx;
    background: rgba(255, 255, 255, 0.3);
    margin: 0 24rpx;
  }
}

.deposit-list {
  flex: 1;
  padding: 16rpx;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
}

.empty-container {
  padding-top: 200rpx;
}

.deposit-record {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  border-radius: 20rpx;
  border: 1px solid var(--border-color-light);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  overflow: hidden;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  .record-header {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;

    .item-image {
      width: 100rpx;
      height: 100rpx;
      border-radius: var(--spacing-sm);
      flex-shrink: 0;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .item-title {
        font-size: var(--font-size-base);
        font-weight: 500;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .item-time {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }
  }

  .record-details {
    background: var(--bg-color-page);
    border-radius: var(--spacing-sm);
    padding: 16rpx;
    margin-bottom: 16rpx;

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      margin-bottom: 12rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .detail-label {
        color: var(--text-color-tertiary);
      }

      .detail-value {
        color: var(--text-color-primary);

        &.amount {
          font-size: var(--font-size-xl);
          color: var(--primary-color);
          font-weight: 600;
        }
      }

      .status-tag {
        padding: 6rpx 16rpx;
        border-radius: 9999px;
        font-size: var(--font-size-sm);
        font-weight: 600;

        &.status-0 {
          background: var(--bg-color-warm);
          color: var(--warning-color);
        }

        &.status-1 {
          background: #e6f7ff;
          color: var(--info-color);
        }

        &.status-2 {
          background: #f6ffed;
          color: var(--success-color);
        }

        &.status--1 {
          background: var(--danger-color-alpha-5);
          color: var(--danger-color);
        }
      }
    }
  }

  .record-actions {
    display: flex;
    gap: 12rpx;

    .action-btn {
      flex: 1;
      height: 56rpx;
      line-height: 56rpx;
      border-radius: 9999px;
      font-size: var(--font-size-sm);
      border: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:active {
        transform: scale(0.92);
      }

      &.pay-btn {
        background: var(--primary-color);
        color: var(--bg-color-card);
        box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
      }
    }

    .status-tip {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      padding: 16rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      font-size: 13px;
      color: var(--text-color-tertiary);

      &.success {
        background: #f6ffed;
        color: var(--success-color);
      }

      &.error {
        background: var(--danger-color-alpha-5);
        color: var(--danger-color);
      }
    }
  }
}

.load-more {
  padding: 24rpx 0;
  text-align: center;
}
</style>
