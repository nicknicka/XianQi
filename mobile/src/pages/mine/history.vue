<template>
  <view class="history-page service-redesign-page" :style="pageAnimationStyle">
    <!-- 顶部操作栏 -->
    <view class="top-bar header-animate">
      <view class="top-bar-inner">
        <view class="stats-group">
          <view class="stat-pill">
            <text class="stat-num">{{ productList.length }}</text>
            <text class="stat-label">条记录</text>
          </view>
        </view>
        <view class="top-actions">
          <view class="icon-btn" @click="toggleEditMode">
            <text class="icon-btn-text">{{ isEditMode ? '完成' : '管理' }}</text>
          </view>
          <view class="icon-btn danger" @click="clearHistory">
            <text class="icon-btn-text danger-text">清空</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 列表主体 -->
    <scroll-view
      class="scroll-body"
      scroll-y
      :scroll-with-animation="false"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 空状态 -->
      <view v-if="productList.length === 0 && !loading" class="empty-state">
        <view class="empty-visual">
          <view class="empty-circle">
            <text class="empty-emoji">&#128214;</text>
          </view>
          <view class="empty-rings">
            <view class="ring ring-1" />
            <view class="ring ring-2" />
          </view>
        </view>
        <text class="empty-title">还没有浏览记录</text>
        <text class="empty-desc">去逛逛，发现感兴趣的宝贝吧</text>
      </view>

      <!-- 时间线列表 -->
      <view v-else class="timeline">
        <view
          v-for="(group, gIdx) in groupedProducts"
          :key="group.date"
          class="timeline-group"
        >
          <!-- 日期标签 -->
          <view class="date-chip">
            <view class="date-chip-dot" />
            <text class="date-chip-text">{{ group.label }}</text>
            <text class="date-chip-count">{{ group.items.length }}条</text>
          </view>

          <!-- 商品卡片 -->
          <view class="group-cards">
            <view
              v-for="(product, pIdx) in group.items"
              :key="product.id"
              class="product-card"
              :class="{ 'edit-mode': isEditMode }"
              @click="handleCardClick(product)"
            >
              <!-- 选择框（编辑模式） -->
              <view v-if="isEditMode" class="card-checkbox" @click.stop="toggleSelect(product.id)">
                <view class="checkbox-circle" :class="{ checked: selectedIds.includes(product.id) }">
                  <text v-if="selectedIds.includes(product.id)" class="check-mark">&#10003;</text>
                </view>
              </view>

              <!-- 商品图片 -->
              <view class="card-thumb">
                <image
                  class="thumb-img"
                  :src="normalizeImageUrl(product.coverImage)"
                  mode="aspectFill"
                  lazy-load
                />
                <view class="thumb-badge">
                  <text class="thumb-badge-text">{{ formatPrice(product.price) }}</text>
                </view>
              </view>

              <!-- 商品信息 -->
              <view class="card-body">
                <text class="card-title">{{ product.title }}</text>
                <text class="card-time">{{ formatViewTime(product.viewTime) }}</text>
              </view>

              <!-- 删除按钮 -->
              <view v-if="!isEditMode" class="card-action" @click.stop="deleteItem(product.id)">
                <view class="action-circle">
                  <text class="action-icon">&#10005;</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="load-indicator">
        <view class="load-dots">
          <view class="dot" />
          <view class="dot" />
          <view class="dot" />
        </view>
        <text class="load-text">正在加载</text>
      </view>

      <view v-if="noMore && productList.length > 0" class="no-more">
        <view class="no-more-line" />
        <text class="no-more-text">已经到底了</text>
        <view class="no-more-line" />
      </view>
    </scroll-view>

    <!-- 编辑模式底部栏 -->
    <view v-if="isEditMode && productList.length > 0" class="edit-bar">
      <view class="edit-bar-inner">
        <view class="select-all-btn" @click="toggleSelectAll">
          <view class="checkbox-circle" :class="{ checked: isAllSelected }">
            <text v-if="isAllSelected" class="check-mark">&#10003;</text>
          </view>
          <text class="select-all-text">全选</text>
        </view>
        <view class="delete-selected-btn" :class="{ disabled: selectedIds.length === 0 }" @click="batchDelete">
          <text class="delete-selected-text">删除{{ selectedIds.length > 0 ? `(${selectedIds.length})` : '' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeStyle, useThemeColors } from '@/utils/theme'
import { ref, computed, onMounted } from 'vue'
import { productApi } from '@/api/product'
import { getRelativeTime } from '@/utils/date'
import { usePageAnimation } from '@/composables/usePageAnimation'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { onShow } from '@dcloudio/uni-app'
import { normalizeImageUrl } from '@/utils/image'

useServiceNavigation()

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

interface Product {
  id: string
  productId: string
  title: string
  coverImage: string
  price: number
  viewTime: string
}

const productList = ref<Product[]>([])
const loading = ref(false)
const refreshing = ref(false)
const noMore = ref(false)
const page = ref(1)
const pageSize = 20
const isEditMode = ref(false)
const selectedIds = ref<Array<string>>([])

// 页面入场动画
const {
  pageVisible,
  contentOpacity,
  contentTransform,
  startPageAnimation
} = usePageAnimation({
  delay: 50,
  duration: 350,
  stagger: true,
  staggerDelay: 60,
  batchSize: 5
})

const pageAnimationStyle = computed(() => ({
  opacity: contentOpacity.value,
  transform: `translateY(${contentTransform.value}rpx)`,
  transition: pageVisible.value
    ? 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : 'none'
}))

// 按日期分组
const groupedProducts = computed(() => {
  const groups: { date: string; label: string; items: Product[] }[] = []
  const map = new Map<string, Product[]>()

  for (const item of productList.value) {
    const dateStr = item.viewTime ? item.viewTime.split(' ')[0] : '未知日期'
    if (!map.has(dateStr)) {
      map.set(dateStr, [])
    }
    map.get(dateStr)!.push(item)
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  for (const [date, items] of map) {
    let label = date
    if (date === today) label = '今天'
    else if (date === yesterday) label = '昨天'
    else {
      const d = new Date(date)
      const month = d.getMonth() + 1
      const day = d.getDate()
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      label = `${month}月${day}日 ${weekDays[d.getDay()]}`
    }
    groups.push({ date, label, items })
  }

  return groups
})

// 是否全选
const isAllSelected = computed(() => {
  return productList.value.length > 0 && selectedIds.value.length === productList.value.length
})

onShow(() => {
  useThemePage()
})

onMounted(() => {
  startPageAnimation()
  loadProducts()
})

function loadProducts(refresh = false) {
  if (loading.value) return

  if (refresh) {
    page.value = 1
    noMore.value = false
  }

  loading.value = true

  productApi
    .getViewHistory({ page: page.value, pageSize })
    .then((res: any) => {
      const data = res.data || res || {}
      const list = data.list || data.records || []

      const normalizedList = list.map((item: any) => ({
        ...item,
        coverImage: normalizeImageUrl(item.coverImage || item.image || item.productImage || item.cover)
      }))

      if (refresh) {
        productList.value = normalizedList
      } else {
        productList.value = [...productList.value, ...normalizedList]
      }

      noMore.value = normalizedList.length < pageSize
    })
    .catch(() => {
      uni.showToast({ title: '加载失败', icon: 'none' })
    })
    .finally(() => {
      loading.value = false
      refreshing.value = false
    })
}

function loadMore() {
  if (!loading.value && !noMore.value) {
    page.value++
    loadProducts()
  }
}

function onRefresh() {
  refreshing.value = true
  loadProducts(true)
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/market/detail?id=${id}` })
}

function handleCardClick(product: Product) {
  if (isEditMode.value) {
    toggleSelect(product.id)
  } else {
    goDetail(product.productId)
  }
}

function deleteItem(historyId: string) {
  uni.showModal({
    title: '删除记录',
    content: '确定删除这条浏览记录吗？',
    success: (res) => {
      if (res.confirm) {
        productApi
          .deleteViewHistory(historyId)
          .then(() => {
            productList.value = productList.value.filter((p) => p.id !== historyId)
            uni.showToast({ title: '已删除', icon: 'success' })
          })
          .catch(() => {
            uni.showToast({ title: '删除失败', icon: 'none' })
          })
      }
    }
  })
}

function clearHistory() {
  if (productList.value.length === 0) return
  uni.showModal({
    title: '清空历史',
    content: '确定清空所有浏览记录吗？此操作不可恢复。',
    confirmColor: '#FF6B6B',
    success: (res) => {
      if (res.confirm) {
        productApi
          .clearViewHistory()
          .then(() => {
            uni.showToast({ title: '已清空', icon: 'success' })
            loadProducts(true)
          })
          .catch(() => {})
      }
    }
  })
}

function toggleEditMode() {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    selectedIds.value = []
  }
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value = selectedIds.value.filter((i) => i !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = productList.value.map((p) => p.id)
  }
}

function batchDelete() {
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: '请先选择记录', icon: 'none' })
    return
  }
  uni.showModal({
    title: '批量删除',
    content: `确定删除选中的 ${selectedIds.value.length} 条记录吗？`,
    confirmColor: '#FF6B6B',
    success: async (res) => {
      if (res.confirm) {
        try {
          for (const id of selectedIds.value) {
            await productApi.deleteViewHistory(id)
          }
          productList.value = productList.value.filter((p) => !selectedIds.value.includes(p.id))
          selectedIds.value = []
          isEditMode.value = false
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch {
          uni.showToast({ title: '部分删除失败', icon: 'none' })
        }
      }
    }
  })
}

function formatPrice(price: number): string {
  return price !== undefined && price !== null ? `¥${price}` : ''
}

function formatViewTime(time: string): string {
  return getRelativeTime(time)
}
</script>

<style lang="scss" scoped>
/* ========== 页面布局 ========== */
.history-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
  padding-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
}

/* ========== 顶部操作栏 ========== */
.top-bar {
  position: relative;
  z-index: 2;
  padding: 16rpx 24rpx 0;

  .top-bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-color-card);
    border-radius: 20rpx;
    padding: 20rpx 24rpx;
    border: 1px solid var(--border-color-light);
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  }

  .stats-group {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .stat-pill {
    display: flex;
    align-items: baseline;
    gap: 6rpx;
    background: var(--primary-color-alpha-8);
    padding: 8rpx 20rpx;
    border-radius: 9999px;
  }

  .stat-num {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--primary-color);
  }

  .stat-label {
    font-size: 22rpx;
    color: var(--primary-color);
  }

  .top-actions {
    display: flex;
    gap: 12rpx;
  }

  .icon-btn {
    padding: 10rpx 24rpx;
    border-radius: 9999px;
    background: var(--bg-color-page);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(0.92);
      opacity: 0.8;
    }
  }

  .icon-btn-text {
    font-size: 26rpx;
    font-weight: 500;
    color: var(--text-color-secondary);
  }

  .danger-text {
    color: var(--error-color);
  }
}

/* ========== 滚动区域 ========== */
.scroll-body {
  flex: 1;
  min-height: 0;
  height: 0;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
  overflow: auto;
}

.scroll-body :deep(.uni-scroll-view) {
  height: 100%;
  overflow-y: auto;
}

.scroll-body :deep(.uni-scroll-view-content) {
  min-height: 100%;
}

/* ========== 时间线结构 ========== */
.timeline {
  width: 100%;
}

.timeline-group {
  margin-top: 24rpx;

  &:first-child {
    margin-top: 16rpx;
  }
}

/* 日期标签 */
.date-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  padding: 0 8rpx;

  .date-chip-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: var(--primary-color);
    box-shadow: 0 0 0 4rpx var(--primary-color-alpha-15);
  }

  .date-chip-text {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-color-primary);
    letter-spacing: 0.5px;
  }

  .date-chip-count {
    font-size: 20rpx;
    color: var(--text-color-tertiary);
    background: var(--bg-color-disabled);
    padding: 4rpx 14rpx;
    border-radius: 9999px;
  }
}

/* ========== 商品卡片 ========== */
.group-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-left: 24rpx;
  border-left: 2rpx solid var(--primary-color-alpha-15);
  margin-left: 5rpx;
}

.product-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 20rpx;
  border: 1px solid var(--border-color-light);
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:active {
    transform: scale(0.98);
  }

  &.edit-mode {
    background: var(--primary-color-alpha-5);
    border-color: var(--primary-color-alpha-15);
  }
}

/* 选择框 */
.card-checkbox {
  flex-shrink: 0;
}

.checkbox-circle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid var(--border-color-base);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;

  &.checked {
    background: var(--primary-color);
    border-color: var(--primary-color);
    box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
  }
}

.check-mark {
  font-size: 24rpx;
  color: #fff;
  font-weight: 700;
}

/* 商品图片 */
.card-thumb {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;

  .thumb-img {
    width: 100%;
    height: 100%;
  }

  .thumb-badge {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 4rpx 8rpx;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    text-align: center;
  }

  .thumb-badge-text {
    font-size: 20rpx;
    color: #fff;
    font-weight: 600;
  }
}

/* 商品信息 */
.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;

  .card-title {
    font-size: 28rpx;
    font-weight: 500;
    color: var(--text-color-primary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-time {
    font-size: 22rpx;
    color: var(--text-color-tertiary);
  }
}

/* 删除按钮 */
.card-action {
  flex-shrink: 0;

  .action-circle {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: var(--error-color-alpha-10, rgba(255, 138, 138, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;

    &:active {
      transform: scale(0.85);
      background: var(--error-color);
    }
  }

  .action-icon {
    font-size: 22rpx;
    color: var(--error-color);
  }
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 180rpx;
  opacity: 0;
  animation: emptyReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
}

.empty-visual {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 40rpx;
}

.empty-circle {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color-alpha-15), var(--primary-color-alpha-8));
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.empty-emoji {
  font-size: 72rpx;
}

.empty-rings {
  position: absolute;
  inset: 0;

  .ring {
    position: absolute;
    border-radius: 50%;
    border: 2rpx solid var(--primary-color-alpha-10);
  }

  .ring-1 {
    inset: 10rpx;
    animation: ringPulse 3s ease-in-out infinite;
  }

  .ring-2 {
    inset: -10rpx;
    animation: ringPulse 3s ease-in-out 1s infinite;
  }
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: var(--text-color-tertiary);
}

/* ========== 加载指示器 ========== */
.load-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  gap: 16rpx;
}

.load-dots {
  display: flex;
  gap: 12rpx;

  .dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: var(--primary-color);
    animation: dotBounce 1.2s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }
    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}

.load-text {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
}

/* ========== 底部提示 ========== */
.no-more {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 40rpx 0;

  .no-more-line {
    flex: 1;
    height: 1rpx;
    background: var(--border-color-light);
  }

  .no-more-text {
    font-size: 22rpx;
    color: var(--text-color-tertiary);
    white-space: nowrap;
  }
}

/* ========== 编辑模式底部栏 ========== */
.edit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-light);
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.06);
  z-index: 100;

  .edit-bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .select-all-btn {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .select-all-text {
    font-size: 28rpx;
    color: var(--text-color-primary);
  }

  .delete-selected-btn {
    padding: 16rpx 40rpx;
    border-radius: 9999px;
    background: var(--error-color);
    transition: all 0.3s ease;

    &.disabled {
      background: var(--bg-color-disabled);
      opacity: 0.6;
    }

    &:active:not(.disabled) {
      transform: scale(0.95);
    }
  }

  .delete-selected-text {
    font-size: 28rpx;
    color: #fff;
    font-weight: 600;
  }
}

/* ========== 入场动画 ========== */
.header-animate {
  animation: headerSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes headerSlideDown {
  0% { opacity: 0; transform: translateY(-20rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes emptyReveal {
  0% { opacity: 0; transform: translateY(30rpx) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 1; }
}

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
