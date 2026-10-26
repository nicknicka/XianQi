<template>
  <view class="transfer-page service-redesign-page" :style="themeStyle">
    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view class="tab-indicator" :style="{ transform: `translateX(${currentTabIndex * 100}%)` }"></view>
      <view
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: currentTab === tab.value }]"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
        <view v-if="tab.badge > 0" class="badge">{{ tab.badge }}</view>
      </view>
    </view>

    <!-- 转赠列表 -->
    <scroll-view class="transfer-list" scroll-y @scrolltolower="loadMore">
      <!-- 发起转赠 -->
      <view
        v-if="currentTab === 'send'"
        :class="['send-section', 'tab-content', { 'tab-content-active': currentTab === 'send' }]"
      >
        <!-- 转赠按钮 -->
        <view class="action-card" @click="showTransferModal">
          <uni-icons type="gift" size="32" :color="primaryColor" />
          <text class="action-text">发起转赠</text>
          <text class="action-desc">将您的共享物品转赠给其他用户</text>
        </view>

        <!-- 我发起的转赠列表 -->
        <view v-if="transferList.length === 0 && !isLoading" class="empty-container">
          <empty-state text="暂无转赠记录" image="/static/images/empty.png" tip="发起转赠后，这里会显示记录" />
        </view>

        <view
          v-for="(item, index) in transferList"
          :key="item.id"
          class="transfer-card"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- 物品信息 -->
          <view class="item-info" @click="goToShareDetail(item.shareItemId)">
            <lazy-image class="item-image" :src="item.shareItemCover" mode="aspectFit" width="100" height="100" />
            <view class="item-details">
              <text class="item-title">{{ item.shareItemTitle }}</text>
              <text class="item-time">{{ item.createTime }}</text>
            </view>
            <view :class="['status-tag', `status-${item.status}`]">
              {{ getSendStatusText(item.status) }}
            </view>
          </view>

          <!-- 接收方信息 -->
          <view v-if="item.receiverInfo" class="receiver-info">
            <view class="user-avatar" @click="goToUserHome(item.receiverId)">
              <UserAvatar :src="item.receiverInfo.avatar" size="sm" shape="circle" />
            </view>
            <view class="user-details">
              <text class="user-name">{{ item.receiverInfo.nickname }}</text>
              <text class="user-desc">{{ item.receiverInfo.creditScore }} 信用分</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="card-actions">
            <!-- 待接受 -->
            <template v-if="item.status === 0">
              <button class="action-btn cancel-btn" @click="cancelTransfer(item.id)">取消转赠</button>
            </template>

            <!-- 已完成/已取消/已拒绝 -->
            <template v-if="item.status >= 1 || item.status === -1">
              <button class="action-btn detail-btn" @click="viewDetail(item)">查看详情</button>
            </template>
          </view>
        </view>
      </view>

      <!-- 收到的转赠 -->
      <view
        v-if="currentTab === 'receive'"
        :class="['receive-section', 'tab-content', { 'tab-content-active': currentTab === 'receive' }]"
      >
        <view v-if="receiveList.length === 0 && !isLoading" class="empty-container">
          <empty-state text="暂无收到的转赠" image="/static/images/empty.png" tip="收到转赠后会在这里显示" />
        </view>

        <view
          v-for="(item, index) in receiveList"
          :key="item.id"
          class="transfer-card"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- 物品信息 -->
          <view class="item-info" @click="goToShareDetail(item.shareItemId)">
            <lazy-image class="item-image" :src="item.shareItemCover" mode="aspectFit" width="100" height="100" />
            <view class="item-details">
              <text class="item-title">{{ item.shareItemTitle }}</text>
              <text class="item-time">{{ item.createTime }}</text>
            </view>
            <view :class="['status-tag', `status-${item.status}`]">
              {{ getReceiveStatusText(item.status) }}
            </view>
          </view>

          <!-- 转赠方信息 -->
          <view v-if="item.senderInfo" class="sender-info">
            <view class="user-avatar" @click="goToUserHome(item.senderId)">
              <UserAvatar :src="item.senderInfo.avatar" size="sm" shape="circle" />
            </view>
            <view class="user-details">
              <text class="user-name">{{ item.senderInfo.nickname }}</text>
              <text class="user-desc">{{ item.senderInfo.creditScore }} 信用分</text>
            </view>
          </view>

          <!-- 赠言 -->
          <view v-if="item.message" class="transfer-message">
            <text class="message-label">赠言：</text>
            <text class="message-text">{{ item.message }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="card-actions">
            <!-- 待接受 -->
            <template v-if="item.status === 0">
              <button class="action-btn accept-btn" @click="acceptTransfer(item.id)">接受</button>
              <button class="action-btn reject-btn" @click="rejectTransfer(item.id)">拒绝</button>
            </template>

            <!-- 其他状态 -->
            <template v-if="item.status !== 0">
              <button class="action-btn detail-btn" @click="viewDetail(item)">查看详情</button>
            </template>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more">
        <uni-load-more status="loading" />
      </view>
    </scroll-view>

    <!-- 转赠弹窗 -->
    <uni-popup ref="transferPopup" type="bottom">
      <view class="transfer-popup">
        <view class="popup-header">
          <text class="popup-title">发起转赠</text>
          <view class="close-btn" @click="closeTransferModal">
            <uni-icons type="close" size="20" color="#AAAAAA" />
          </view>
        </view>

        <!-- 弹窗内容区域 -->
        <scroll-view class="popup-content" scroll-y>
          <!-- 选择物品 -->
          <view class="form-section">
          <view class="section-title">选择物品</view>
          <scroll-view class="my-shares-list" scroll-y>
            <view v-if="myShareItems.length === 0" class="empty-shares">
              <text class="empty-text">暂无可转赠的共享物品</text>
              <text class="empty-hint">请先发布共享物品</text>
            </view>
            <view
              v-for="item in myShareItems"
              :key="item.id"
              :class="['share-item', { selected: selectedShareId === item.id }]"
              @click="selectShareItem(item)"
            >
              <lazy-image class="share-image" :src="item.coverImage" mode="aspectFit" width="80" height="80" />
              <view class="share-info">
                <text class="share-title">{{ item.title }}</text>
                <text class="share-price">押金 ¥{{ item.deposit }}</text>
              </view>
              <uni-icons v-if="selectedShareId === item.id" type="checkbox-filled" size="20" :color="primaryColor" />
            </view>
          </scroll-view>
        </view>

        <!-- 选择用户 -->
        <view class="form-section">
          <view class="section-title">转赠给</view>
          <button class="select-user-btn" @click="selectUser">
            <text v-if="selectedUser">{{ selectedUser.nickname || `用户${transferForm.toUserId}` }}</text>
            <text v-else>点击选择用户</text>
            <uni-icons type="right" size="16" color="#AAAAAA" />
          </button>
        </view>

        <!-- 赠言 -->
        <view class="form-section">
          <view class="section-title">赠言（选填）</view>
          <textarea
            v-model="transferForm.transferNote"
            class="message-input"
            placeholder="说点什么吧..."
            maxlength="100"
          />
        </view>
        </scroll-view>

        <!-- 提交按钮 -->
        <view class="popup-footer">
          <button class="submit-btn" :disabled="!canSubmit" @click="submitTransfer">确认转赠</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { shareApi } from '@/api/share'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { onShow } from '@dcloudio/uni-app'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { themeStyle } = useThemeStyle()
const { primaryColor, successColor, warningColor, dangerColor } = useThemeColors()

const tabs = ref([
  { label: '我发起的', value: 'send', badge: 0 },
  { label: '我收到的', value: 'receive', badge: 0 }
])

const currentTab = ref('send')
const transferList = ref<any[]>([])
const receiveList = ref<any[]>([])
const myShareItems = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const isLoading = ref(false)

const transferPopup = ref()
const selectedShareId = ref<string>('')
const selectedUser = ref<any>(null)
const transferForm = ref({
  shareId: '' as string | number,
  toUserId: '' as string | number,
  transferNote: ''
})

const canSubmit = computed(() => {
  return !!String(transferForm.value.shareId || '').trim() && !!String(transferForm.value.toUserId || '').trim()
})

const currentTabIndex = computed(() => {
  return tabs.value.findIndex(tab => tab.value === currentTab.value)
})

onShow(() => {
  useThemePage()
})


onMounted(() => {
  loadTransferList()
  loadMyShareItems()
})

function switchTab(value: string) {
  currentTab.value = value
  page.value = 1
  hasMore.value = true

  if (value === 'send') {
    transferList.value = []
    loadTransferList()
  } else {
    receiveList.value = []
    loadReceiveList()
  }
}

function loadTransferList() {
  isLoading.value = true
  shareApi.getSentTransfers({
    page: page.value,
    pageSize: pageSize.value
  }).then((data: any) => {
    if (page.value === 1) {
      transferList.value = data.list || []
    } else {
      transferList.value.push(...(data.list || []))
    }
    hasMore.value = transferList.value.length < (data.total || 0)
  }).catch(() => {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }).finally(() => {
    isLoading.value = false
  })
}

function loadReceiveList() {
  isLoading.value = true
  shareApi.getReceivedTransfers({
    page: page.value,
    pageSize: pageSize.value
  }).then((data: any) => {
    if (page.value === 1) {
      receiveList.value = data.list || []
    } else {
      receiveList.value.push(...(data.list || []))
    }

    // 更新未读数
    const unreadCount = receiveList.value.filter((item: any) => item.status === 0).length
    tabs.value[1].badge = unreadCount

    hasMore.value = receiveList.value.length < (data.total || 0)
  }).catch(() => {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }).finally(() => {
    isLoading.value = false
  })
}

function loadMyShareItems() {
  // 加载所有状态的共享物品，不包括已删除的
  shareApi.getMyShareItems({}).then((res: any) => {
    console.log('加载我的共享物品:', res)
    // 过滤出可以转赠的物品（状态为1-已发布）
    myShareItems.value = (res.data?.list || res.list || []).filter((item: any) => item.status === 1)
    console.log('可转赠的共享物品列表:', myShareItems.value)
  }).catch((err: any) => {
    console.error('加载共享物品失败:', err)
  })
}

function loadMore() {
  if (!hasMore.value || isLoading.value) return
  page.value++

  if (currentTab.value === 'send') {
    loadTransferList()
  } else {
    loadReceiveList()
  }
}

function getSendStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待接受',
    1: '已接受',
    '-1': '已取消',
    '-2': '已拒绝'
  }
  return statusMap[status] || '未知'
}

function getReceiveStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待接受',
    1: '已接受',
    '-1': '已拒绝'
  }
  return statusMap[status] || '未知'
}

function showTransferModal() {
  transferPopup.value?.open()
}

function closeTransferModal() {
  transferPopup.value?.close()
  resetForm()
}

function resetForm() {
  selectedShareId.value = ''
  selectedUser.value = null
  transferForm.value = {
    shareId: '',
    toUserId: '',
    transferNote: ''
  }
}

function selectShareItem(item: any) {
  // 如果点击已选中的物品，则取消选择
  if (selectedShareId.value === item.id) {
    selectedShareId.value = ''
    transferForm.value.shareId = ''
  } else {
    selectedShareId.value = item.id
    transferForm.value.shareId = item.id
  }
}

function selectUser() {
  uni.navigateTo({
    url: '/pages/share/select-user',
    events: {
      onUserSelected: (user: any) => {
        selectedUser.value = user
        transferForm.value.toUserId = String(user.id)
      }
    }
  })
}

function submitTransfer() {
  if (!canSubmit.value) return

  // 检查是否选择了物品和用户
  if (!transferForm.value.shareId) {
    uni.showToast({ title: '请选择要转赠的物品', icon: 'none' })
    return
  }

  if (!transferForm.value.toUserId) {
    uni.showToast({ title: '请选择接收用户', icon: 'none' })
    return
  }

  // 二次确认弹窗
  const selectedItem = myShareItems.value.find(item => item.id === transferForm.value.shareId)
  uni.showModal({
    title: '确认转赠',
    content: `确定要将「${selectedItem?.title}」转赠给用户ID为「${transferForm.value.toUserId}」的用户吗？转赠后对方将获得该物品的所有权。`,
    confirmText: '确认转赠',
    confirmColor: primaryColor,
    success: (res) => {
      if (res.confirm) {
        const submitData = {
          shareId: transferForm.value.shareId,
          toUserId: transferForm.value.toUserId,
          transferNote: transferForm.value.transferNote || ''
        }

        shareApi.initiateTransfer(submitData).then(() => {
          uni.showToast({ title: '转赠成功', icon: 'success' })
          closeTransferModal()
          refreshList()
        }).catch((err: any) => {
          uni.showToast({ title: err.message || '转赠失败', icon: 'none' })
        })
      }
    }
  })
}

function acceptTransfer(transferId: number) {
  uni.showModal({
    title: '接受转赠',
    content: '接受后将获得该物品的所有权，是否确认？',
    success: (res) => {
      if (res.confirm) {
        shareApi.acceptTransfer(transferId).then(() => {
          uni.showToast({ title: '已接受转赠', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function rejectTransfer(transferId: number) {
  uni.showModal({
    title: '拒绝转赠',
    content: '确定要拒绝这个转赠吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.rejectTransfer(transferId).then(() => {
          uni.showToast({ title: '已拒绝转赠', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function cancelTransfer(transferId: number) {
  uni.showModal({
    title: '取消转赠',
    content: '对方还未接受，确定要取消吗？',
    success: (res) => {
      if (res.confirm) {
        shareApi.cancelTransfer(transferId).then(() => {
          uni.showToast({ title: '已取消转赠', icon: 'success' })
          refreshList()
        }).catch(() => {
          uni.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    }
  })
}

function viewDetail(item: any) {
  const counterpartyName = currentTab.value === 'send'
    ? item.receiverInfo?.nickname
    : item.senderInfo?.nickname
  uni.showModal({
    title: '转赠详情',
    content: [
      `物品：${item.shareItemTitle || '共享物品'}`,
      `对方：${counterpartyName || '未知用户'}`,
      `状态：${currentTab.value === 'send' ? getSendStatusText(item.status) : getReceiveStatusText(item.status)}`,
      item.message ? `赠言：${item.message}` : ''
    ].filter(Boolean).join('\n'),
    showCancel: false
  })
}

function goToShareDetail(shareItemId: number | string) {
  if (!shareItemId) return
  uni.navigateTo({
    url: `/pages/share/detail?id=${shareItemId}`
  })
}

function goToUserHome(userId: number | string) {
  if (!userId) return
  uni.navigateTo({
    url: `/pages/user/home?id=${userId}`
  })
}

function refreshList() {
  page.value = 1
  if (currentTab.value === 'send') {
    transferList.value = []
    loadTransferList()
  } else {
    receiveList.value = []
    loadReceiveList()
  }
}
</script>

<style lang="scss" scoped>
.transfer-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

// 指示器弹跳动画
@keyframes indicatorBounce {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(1.2); }
  100% { transform: scaleX(1); }
}

.tab-bar {
  display: flex;
  background: var(--bg-color-card);
  margin: var(--spacing-sm) var(--spacing-lg);
  border-radius: 20rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color-light);
  overflow: hidden;
  position: relative;

  .tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50%;
    height: 4rpx;
    background: var(--primary-color);
    border-radius: var(--border-radius-sm);
    animation: indicatorBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    box-shadow: 0 2rpx 10rpx var(--primary-color-alpha-30);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .tab-item {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-base);
    color: var(--text-color-secondary);
    position: relative;
    z-index: 2;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

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

    &.active {
      color: var(--primary-color);
      font-weight: 600;

      &::after {
        opacity: 1;
      }
    }

    &:active {
      transform: scale(0.97);
    }

    .badge {
      position: absolute;
      top: 16rpx;
      right: 25%;
      min-width: 32rpx;
      height: 32rpx;
      line-height: 32rpx;
      padding: 0 8rpx;
      background: var(--error-color);
      color: var(--bg-color-card);
      font-size: var(--font-size-xs);
      border-radius: 16rpx;
      text-align: center;
    }
  }
}

.transfer-list {
  flex: 1;
  padding: 16rpx;
  box-sizing: border-box;
  overflow: hidden;
  width: 100%;
}

.tab-content {
  opacity: 0;
  transform: translateY(20rpx);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.tab-content-active {
    opacity: 1;
    transform: translateY(0);
  }
}

.send-section,
.receive-section {
  .action-card {
    background: linear-gradient(135deg, var(--bg-color-page), var(--bg-color-card));
    border: 2rpx dashed var(--primary-color);
    border-radius: 12rpx;
    padding: 48rpx 24rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;
    transition: all 0.2s ease;
    cursor: pointer;

    &:active {
      transform: scale(0.98);
      background: linear-gradient(135deg, var(--bg-color-warm), var(--bg-color-card));
    }

    .action-text {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .action-desc {
      font-size: 13px;
      color: var(--text-color-tertiary);
    }
  }
}

.empty-container {
  padding-top: 200rpx;
  animation: fadeIn 0.5s ease-out;
}

.transfer-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  border-radius: 20rpx;
  border: 1px solid var(--border-color-light);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  animation: fadeSlideIn 0.4s ease-out forwards;
  opacity: 0;
  overflow: hidden;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.98);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  .item-info {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;

    .item-image {
      width: 100rpx;
      height: 100rpx;
      border-radius: var(--spacing-sm);
      flex-shrink: 0;
    }

    .item-details {
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

    .status-tag {
      padding: 6rpx 16rpx;
      border-radius: 9999px;
      font-size: var(--font-size-sm);
      font-weight: 600;
      align-self: flex-start;

      &.status-0 {
        background: var(--bg-color-warm);
        color: var(--warning-color);
      }

      &.status-1 {
        background: var(--success-color-alpha-10);
        color: var(--success-color);
      }

      &.status--1,
      &.status--2 {
        background: var(--bg-color-page);
        color: var(--text-color-tertiary);
      }
    }
  }

  .receiver-info,
  .sender-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx;
    background: var(--bg-color-page);
    border-radius: var(--spacing-sm);
    margin-bottom: 16rpx;

    .user-avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      overflow: hidden;
      transition: transform 0.2s ease;

      &:active {
        transform: scale(0.9);
      }

      image {
        width: 100%;
        height: 100%;
      }
    }

    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4rpx;

      .user-name {
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
      }

      .user-desc {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }
  }

  .transfer-message {
    padding: 16rpx;
    background: var(--primary-color-alpha-10);
    border-radius: var(--spacing-sm);
    margin-bottom: 16rpx;
    font-size: 13px;

    .message-label {
      color: var(--primary-color);
    }

    .message-text {
      color: var(--text-color-primary);
    }
  }

  .card-actions {
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

      &.cancel-btn,
      &.reject-btn {
        background: var(--bg-color-card);
        border: 1px solid var(--border-color-base);
        color: var(--text-color-secondary);
      }

      &.accept-btn {
        background: var(--primary-color);
        color: var(--bg-color-card);
        box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
      }

      &.detail-btn {
        background: var(--bg-color-card);
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
      }
    }
  }
}

.load-more {
  padding: 24rpx 0;
  text-align: center;
}

.transfer-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  overflow: hidden;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;
    flex-shrink: 0;

    .popup-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .popup-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 20rpx;
  }

  .form-section {
    padding: 24rpx;

    .section-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 16rpx;
    }
  }

  .my-shares-list {
    max-height: 300rpx;
    padding: 0 2rpx;

    .empty-shares {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60rpx 24rpx;
      text-align: center;

      .empty-text {
        font-size: var(--font-size-base);
        color: var(--text-color-secondary);
        margin-bottom: 8rpx;
      }

      .empty-hint {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
      }
    }

    .share-item {
      display: flex;
      align-items: center;
      gap: 16rpx;
      padding: 16rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      margin-bottom: 12rpx;
      border: 2rpx solid transparent;
      transition: all 0.2s ease;
      box-sizing: border-box;

      &:active {
        transform: scale(0.98);
      }

      &.selected {
        border-color: var(--primary-color);
        background: var(--bg-color-page);
        transform: scale(1.02);
      }

      .share-image {
        width: 80rpx;
        height: 80rpx;
        border-radius: var(--spacing-sm);
        flex-shrink: 0;
      }

      .share-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .share-title {
          font-size: var(--font-size-base);
          color: var(--text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .share-price {
          font-size: var(--font-size-sm);
          color: var(--primary-color);
        }
      }
    }
  }

  .select-user-btn {
    width: 100%;
    height: 80rpx;
    background: var(--bg-color-page);
    border-radius: var(--spacing-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
    font-size: var(--font-size-base);
    color: var(--text-color-primary);
    border: none;

    .user-avatar-small {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
    }
  }

  .message-input {
    width: 100%;
    min-height: 120rpx;
    background: var(--bg-color-page);
    border-radius: var(--spacing-sm);
    padding: 16rpx;
    font-size: var(--font-size-base);
  }

  .popup-footer {
    padding: 24rpx;
    border-top: 1px solid var(--border-color-light);
    flex-shrink: 0;

    .submit-btn {
      width: 100%;
      height: 88rpx;
      background: var(--primary-color);
      color: var(--bg-color-card);
      font-size: var(--font-size-lg);
      font-weight: 600;
      border-radius: 44rpx;
      border: none;

      &[disabled] {
        background: var(--border-color-light);
        color: var(--text-color-tertiary);
      }
    }
  }
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
