<template>
  <view class="order-confirm-page" :style="themeStyle">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 主内容 -->
    <view v-else class="content-container">
      <!-- 商品信息 -->
      <view class="card product-card">
        <view class="card-header">商品信息</view>
        <view class="product-content">
          <image class="product-img" :src="productData.coverImage || '/static/images/empty.png'" mode="aspectFill" />
          <view class="product-detail">
            <text class="product-name">{{ productData.title || '商品标题' }}</text>
            <view class="product-meta">
              <text class="product-condition" v-if="productData.conditionText">{{ productData.conditionText }}</text>
              <text class="product-category" v-if="productData.categoryName">{{ productData.categoryName }}</text>
            </view>
            <text class="product-price">¥{{ productData.price || 0 }}</text>
          </view>
        </view>
        <!-- 商品描述 -->
        <view class="product-desc" v-if="productData.description">
          <text class="desc-label">商品描述：</text>
          <text class="desc-text">{{ productData.description }}</text>
        </view>
      </view>

      <!-- 卖家信息 -->
      <view class="card seller-card">
        <view class="card-header">卖家信息</view>
        <view class="seller-content">
          <image class="seller-avatar" :src="productData.sellerAvatar || '/static/images/user.png'" mode="aspectFill" />
          <view class="seller-detail">
            <text class="seller-name">{{ productData.sellerNickname || '卖家' }}</text>
            <view class="seller-credit" v-if="productData.sellerCreditScore">
              <text class="credit-label">信用分：</text>
              <text class="credit-value">{{ productData.sellerCreditScore }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 交易方式 -->
      <view class="card trade-type-card">
        <view class="card-header">交易方式</view>
        <view class="trade-type-options">
          <view
            class="trade-type-option"
            :class="{ active: formData.tradeType === 'offline' }"
            @click="selectTradeType('offline')"
          >
            <view class="option-icon">📍</view>
            <view class="option-content">
              <text class="option-title">线下自提</text>
              <text class="option-desc">当面交易，安全便捷</text>
            </view>
            <view class="option-check" v-if="formData.tradeType === 'offline'">✓</view>
          </view>
          <view
            class="trade-type-option"
            :class="{ active: formData.tradeType === 'online' }"
            @click="selectTradeType('online')"
          >
            <view class="option-icon">📦</view>
            <view class="option-content">
              <text class="option-title">线上邮寄</text>
              <text class="option-desc">快递配送，省心省力</text>
            </view>
            <view class="option-check" v-if="formData.tradeType === 'online'">✓</view>
          </view>
        </view>
      </view>

      <!-- 线下自提信息 -->
      <view v-if="formData.tradeType === 'offline'" class="card trade-card">
        <view class="card-header">交易信息</view>
        <view class="form-item" @click="selectLocation">
          <view class="form-label">交易地点</view>
          <view class="form-value-wrap">
            <text class="form-value">{{ formData.location || '请选择交易地点' }}</text>
            <text class="arrow">›</text>
          </view>
        </view>
        <view class="form-item">
          <view class="form-label">联系方式</view>
          <input class="form-input" v-model="formData.phone" type="number" placeholder="请输入联系电话" />
        </view>
      </view>

      <!-- 线上邮寄信息 -->
      <view v-if="formData.tradeType === 'online'" class="card address-card">
        <view class="card-header">
          <text>收货地址</text>
          <text class="manage-link" @click="goToAddressList">管理地址</text>
        </view>
        <!-- 已选地址 -->
        <view v-if="selectedAddress" class="address-selected" @click="showAddressPicker">
          <view class="address-content">
            <view class="address-contact">
              <text class="contact-name">{{ selectedAddress.contactName }}</text>
              <text class="contact-phone">{{ selectedAddress.contactPhone }}</text>
            </view>
            <text class="address-detail">{{ selectedAddress.fullAddress }}</text>
          </view>
          <text class="address-arrow">›</text>
        </view>
        <!-- 未选择地址 -->
        <view v-else class="address-empty" @click="showAddressPicker">
          <text class="empty-text">请选择收货地址</text>
          <text class="empty-arrow">›</text>
        </view>
      </view>

      <!-- 金额明细 -->
      <view class="card amount-card">
        <view class="card-header">金额明细</view>
        <view class="amount-row">
          <text class="amount-label">商品金额</text>
          <text class="amount-value">¥{{ productData.price || 0 }}</text>
        </view>
        <view v-if="formData.tradeType === 'online'" class="amount-row">
          <text class="amount-label">运费</text>
          <text class="amount-value">¥{{ shippingFee }}</text>
        </view>
        <view class="amount-row total-row">
          <text class="amount-label total-label">合计</text>
          <text class="amount-value total-value">¥{{ totalAmount }}</text>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <view class="total-wrap">
        <text class="total-text">合计：</text>
        <text class="total-amount">¥{{ totalAmount }}</text>
      </view>
      <button class="submit-btn" :disabled="!canSubmitOrder" @click="submitOrder">提交订单</button>
    </view>

    <!-- 地址选择弹窗 -->
    <view v-if="addressPickerVisible" class="picker-mask" @click="hideAddressPicker">
      <view class="picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择收货地址</text>
          <text class="picker-close" @click="hideAddressPicker">✕</text>
        </view>
        <scroll-view class="address-list" scroll-y>
          <view
            v-for="address in addressList"
            :key="address.addressId"
            class="address-item"
            :class="{ selected: selectedAddress?.addressId === address.addressId }"
            @click="selectAddress(address)"
          >
            <view class="address-item-content">
              <view class="address-item-contact">
                <text class="contact-name">{{ address.contactName }}</text>
                <text class="contact-phone">{{ address.contactPhone }}</text>
                <text class="address-tag" v-if="address.isDefault">默认</text>
              </view>
              <text class="address-item-detail">{{ address.fullAddress }}</text>
            </view>
            <view class="address-item-check" v-if="selectedAddress?.addressId === address.addressId">✓</view>
          </view>
          <view v-if="addressList.length === 0" class="address-empty-state">
            <text class="empty-state-text">暂无地址，请先添加地址</text>
          </view>
        </scroll-view>
        <view class="picker-footer">
          <button class="add-address-btn" @click="goToAddAddress">+ 新增地址</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productApi } from '@/api/product'
import { orderApi } from '@/api/order'
import { addressApi, type UserAddress } from '@/api/address'
import { useUserStore } from '@/store/user'
import { normalizeImageUrl } from '@/utils/image'
import {useThemeStyle, useThemePage} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()

const loading = ref(true)
const productId = ref('')

// 商品数据
const productData = ref<any>({
  id: '',
  status: 1,
  sellerId: '',
  userId: '',
  title: '',
  price: 0,
  coverImage: '',
  condition: '',
  conditionText: '',
  categoryName: '',
  description: '',
  sellerNickname: '',
  sellerAvatar: '',
  sellerCreditScore: 0,
  canDelivery: false // 是否支持邮寄
})

// 表单数据
const formData = ref({
  tradeType: 'offline', // 交易方式：offline-线下自提，online-线上邮寄
  location: '',
  phone: '',
  addressId: '' // 选中的地址ID
})

// 地址相关
const addressList = ref<UserAddress[]>([])
const selectedAddress = ref<UserAddress | null>(null)
const addressPickerVisible = ref(false)
const shippingFee = ref(0) // 运费

function normalizeId(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function getCurrentUserIdSafe(): string {
  const fromStore = normalizeId(userStore.userInfo?.userId || userStore.userInfo?.id)
  if (fromStore) {
    return fromStore
  }
  const cachedUserInfo = uni.getStorageSync('userInfo') || {}
  return normalizeId(cachedUserInfo.userId || cachedUserInfo.id)
}

function getProductOwnerId(): string {
  return normalizeId(productData.value.sellerId || productData.value.userId)
}

const canSubmitOrder = computed(() => {
  const currentUserId = getCurrentUserIdSafe()
  const ownerId = getProductOwnerId()
  const productStatus = Number(productData.value.status)

  return !!currentUserId && !!ownerId && currentUserId !== ownerId && productStatus === 1
})

const cannotSubmitReason = computed(() => {
  const currentUserId = getCurrentUserIdSafe()
  const ownerId = getProductOwnerId()
  const productStatus = Number(productData.value.status)

  if (!currentUserId) {
    return '请先登录'
  }
  if (currentUserId && ownerId && currentUserId === ownerId) {
    return '不能购买自己的商品'
  }
  if (productStatus === 2) {
    return '商品已售出'
  }
  if (productStatus === 0) {
    return '商品已下架'
  }
  return '当前商品不可下单'
})

// 成色映射
const conditionMap: Record<string, string> = {
  'new': '全新',
  'almost_new': '几乎全新',
  'lightly_used': '轻微使用',
  'obviously_used': '明显使用',
  'has_flaws': '有瑕疵'
}

// 计算总金额
const totalAmount = computed(() => {
  const price = productData.value.price || 0
  return formData.value.tradeType === 'online' ? price + shippingFee.value : price
})

// 获取成色文本
function getConditionText(condition: string): string {
  return conditionMap[condition] || condition || ''
}

onShow(() => {
  useThemePage()
})


onMounted(async () => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  productId.value = options.productId || ''

  console.log('[确认订单] 商品ID:', productId.value)

  if (productId.value) {
    await loadProduct()

    if (!canSubmitOrder.value) {
      uni.showToast({ title: cannotSubmitReason.value, icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1200)
      return
    }

    // 设置默认手机号
    if (userStore.userInfo?.phone) {
      formData.value.phone = userStore.userInfo.phone
    }
    // 加载地址列表
    await loadAddressList()
    // 检查商品是否支持邮寄
    if (!productData.value.canDelivery) {
      formData.value.tradeType = 'offline'
    }
  } else {
    loading.value = false
    uni.showToast({ title: '商品ID不存在', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

// 加载商品数据
async function loadProduct() {
  loading.value = true
  try {
    const response = await productApi.getProductDetail(productId.value)
    console.log('[确认订单] API响应:', response)
    console.log('[确认订单] 商品数据:', response.data)

    if (response.data) {
      productData.value = {
        id: response.data.id,
        status: response.data.status,
        sellerId: response.data.sellerId || response.data.userId || '',
        userId: response.data.userId || response.data.sellerId || '',
        title: response.data.title?.trim() || '',
        price: response.data.price || 0,
        coverImage: normalizeImageUrl(response.data.coverImage || ''),
        condition: response.data.condition || '',
        conditionText: getConditionText(response.data.condition),
        categoryName: response.data.categoryName || '',
        description: response.data.description || '',
        sellerNickname: response.data.sellerNickname || response.data.userName || '',
        sellerAvatar: normalizeImageUrl(response.data.sellerAvatar || response.data.userAvatar || ''),
        sellerCreditScore: response.data.sellerCreditScore || 0,
        canDelivery: response.data.canDelivery || false
      }
      console.log('[确认订单] 处理后的商品数据:', productData.value)
    }

    loading.value = false
  } catch (error) {
    console.error('[确认订单] 加载失败:', error)
    loading.value = false
    uni.showToast({ title: '商品不存在', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

// 加载地址列表
async function loadAddressList() {
  try {
    const response = await addressApi.getAddressList({ page: 1, pageSize: 20 })
    addressList.value = response.data?.list || []

    // 获取默认地址
    const defaultAddress = await addressApi.getDefaultAddress().catch(() => null)
    if (defaultAddress?.data) {
      selectedAddress.value = defaultAddress.data
      formData.value.addressId = defaultAddress.data.addressId
    }
  } catch (error) {
    console.error('[确认订单] 加载地址失败:', error)
  }
}

// 选择交易方式
function selectTradeType(type: 'offline' | 'online') {
  // 如果商品不支持邮寄，提示用户
  if (type === 'online' && !productData.value.canDelivery) {
    uni.showToast({ title: '该商品不支持邮寄', icon: 'none' })
    return
  }
  formData.value.tradeType = type
}

// 选择交易地点（线下）
function selectLocation() {
  uni.chooseLocation({
    success: (res) => {
      formData.value.location = res.name || res.address
    }
  })
}

// 显示地址选择器
function showAddressPicker() {
  addressPickerVisible.value = true
}

// 隐藏地址选择器
function hideAddressPicker() {
  addressPickerVisible.value = false
}

// 选择地址
function selectAddress(address: UserAddress) {
  selectedAddress.value = address
  formData.value.addressId = address.addressId
  formData.value.phone = address.contactPhone
  hideAddressPicker()
}

// 跳转到地址列表
function goToAddressList() {
  uni.navigateTo({
    url: '/pages/mine/address'
  })
}

// 跳转到添加地址
function goToAddAddress() {
  hideAddressPicker()
  uni.navigateTo({
    url: '/pages/mine/address-edit'
  })
}

// 提交订单
function submitOrder() {
  if (!userStore.checkLogin()) return

  if (!canSubmitOrder.value) {
    uni.showToast({ title: cannotSubmitReason.value, icon: 'none' })
    return
  }

  // 表单验证
  if (formData.value.tradeType === 'offline') {
    if (!formData.value.location) {
      uni.showToast({ title: '请选择交易地点', icon: 'none' })
      return
    }
    if (!formData.value.phone) {
      uni.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }
  } else {
    if (!selectedAddress.value) {
      uni.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
  }

  // 构建订单数据
  const orderData: any = {
    productId: productId.value,
    quantity: 1,
    tradeType: formData.value.tradeType
  }

  if (formData.value.tradeType === 'offline') {
    orderData.address = formData.value.location
    orderData.phone = formData.value.phone
  } else {
    orderData.addressId = formData.value.addressId
  }

  // 提交订单
  orderApi.createOrder(orderData).then((res: any) => {
    console.log('[确认订单] 创建订单响应:', res)
    uni.showToast({ title: '订单创建成功', icon: 'success' })

    setTimeout(() => {
      const orderId = res.data?.id || res.id
      if (orderId) {
        uni.redirectTo({
          url: `/pages/order/detail?id=${orderId}`
        })
      } else {
        // 订单列表页不是 tabBar 页面，使用 redirectTo 跳转
        uni.redirectTo({
          url: '/pages/order/list'
        })
      }
    }, 1500)
  }).catch((error: any) => {
    console.error('[确认订单] 创建订单失败:', error)
  })
}
</script>

<style lang="scss" scoped>
.order-confirm-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding-bottom: 120rpx;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--bg-color-page);

  .loading-text {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }
}

.content-container {
  padding: 20rpx;
}

.card {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;

  .card-header {
    padding: 24rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-color-primary);
    border-bottom: 1px solid var(--border-color-light);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .manage-link {
      font-size: 26rpx;
      color: var(--primary-color);
      font-weight: 400;
    }
  }
}

// 商品卡片
.product-card {
  .product-content {
    display: flex;
    padding: 24rpx;
    gap: 24rpx;
  }

  .product-img {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background: var(--bg-color-page);
    flex-shrink: 0;
  }

  .product-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .product-name {
    font-size: 28rpx;
    color: var(--text-color-primary);
    line-height: 1.5;
    word-break: break-all;
  }

  .product-meta {
    display: flex;
    gap: 12rpx;
    margin: 8rpx 0;
  }

  .product-condition,
  .product-category {
    padding: 4rpx 12rpx;
    background: var(--primary-color-alpha-10);
    color: var(--primary-color);
    font-size: 22rpx;
    border-radius: 4rpx;
  }

  .product-price {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--danger-color);
  }

  .product-desc {
    padding: 0 24rpx 24rpx;
    border-top: 1px solid var(--border-color-light);
    margin-top: 16rpx;
    padding-top: 16rpx;
  }

  .desc-label {
    font-size: 26rpx;
    color: var(--text-color-secondary);
  }

  .desc-text {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
    line-height: 1.6;
  }
}

// 卖家卡片
.seller-card {
  .seller-content {
    display: flex;
    padding: 24rpx;
    gap: 20rpx;
    align-items: center;
  }

  .seller-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: var(--bg-color-page);
    flex-shrink: 0;
  }

  .seller-detail {
    flex: 1;
  }

  .seller-name {
    font-size: 28rpx;
    color: var(--text-color-primary);
    font-weight: 500;
    display: block;
    margin-bottom: 8rpx;
  }

  .seller-credit {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .credit-label {
    font-size: 24rpx;
    color: var(--text-color-tertiary);
  }

  .credit-value {
    font-size: 24rpx;
    color: var(--primary-color);
    font-weight: 600;
  }
}

// 交易方式卡片
.trade-type-card {
  .trade-type-options {
    padding: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .trade-type-option {
    display: flex;
    align-items: center;
    padding: 24rpx;
    background: var(--bg-color-page);
    border-radius: 12rpx;
    border: 2px solid transparent;
    transition: all 0.2s;

    &.active {
      background: var(--primary-color-alpha-8);
      border-color: var(--primary-color);
    }
  }

  .option-icon {
    font-size: 48rpx;
    margin-right: 16rpx;
  }

  .option-content {
    flex: 1;
  }

  .option-title {
    font-size: 28rpx;
    color: var(--text-color-primary);
    font-weight: 500;
    display: block;
    margin-bottom: 4rpx;
  }

  .option-desc {
    font-size: 24rpx;
    color: var(--text-color-tertiary);
  }

  .option-check {
    width: 40rpx;
    height: 40rpx;
    background: var(--primary-color);
    color: var(--bg-color-card);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
  }
}

// 交易信息
.trade-card {
  .form-item {
    padding: 24rpx;
    border-bottom: 1px solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }
  }

  .form-label {
    font-size: 28rpx;
    color: var(--text-color-primary);
    margin-bottom: 16rpx;
    display: block;
  }

  .form-value-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .form-value {
    font-size: 28rpx;
    color: var(--text-color-secondary);
  }

  .arrow {
    font-size: 40rpx;
    color: var(--text-color-tertiary);
  }

  .form-input {
    width: 100%;
    height: 80rpx;
    font-size: 28rpx;
    color: var(--text-color-primary);
    background: var(--bg-color-page);
    border-radius: 8rpx;
    padding: 0 20rpx;
    box-sizing: border-box;
  }
}

// 地址卡片
.address-card {
  .address-selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
    background: var(--primary-color-alpha-5);
    border: 1px solid var(--primary-color-alpha-20);
  }

  .address-content {
    flex: 1;
  }

  .address-contact {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 8rpx;
  }

  .contact-name {
    font-size: 28rpx;
    color: var(--text-color-primary);
    font-weight: 500;
  }

  .contact-phone {
    font-size: 26rpx;
    color: var(--text-color-secondary);
  }

  .address-detail {
    font-size: 26rpx;
    color: var(--text-color-secondary);
    line-height: 1.5;
  }

  .address-arrow {
    font-size: 40rpx;
    color: var(--text-color-tertiary);
    margin-left: 16rpx;
  }

  .address-empty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40rpx 24rpx;
    background: var(--bg-color-page);
  }

  .empty-text {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }

  .empty-arrow {
    font-size: 40rpx;
    color: var(--text-color-tertiary);
  }
}

// 金额卡片
.amount-card {
  .amount-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
    border-bottom: 1px solid var(--border-color-light);

    &.total-row {
      border-bottom: none;
      border-top: 1px solid var(--border-color-base);
      margin-top: 16rpx;
      padding-top: 24rpx;
    }
  }

  .amount-label {
    font-size: 28rpx;
    color: var(--text-color-secondary);

    &.total-label {
      font-size: 32rpx;
      color: var(--text-color-primary);
      font-weight: 600;
    }
  }

  .amount-value {
    font-size: 28rpx;
    color: var(--text-color-primary);

    &.total-value {
      font-size: 40rpx;
      color: var(--danger-color);
      font-weight: 600;
    }
  }
}

// 底部栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  z-index: 100;

  .total-wrap {
    display: flex;
    align-items: baseline;
    gap: 8rpx;

    .total-text {
      font-size: 28rpx;
      color: var(--text-color-primary);
    }

    .total-amount {
      font-size: 40rpx;
      font-weight: 600;
      color: var(--danger-color);
    }
  }

  .submit-btn {
    width: 240rpx;
    height: 72rpx;
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 9999px;
    border: none;
    line-height: 72rpx;
    padding: 0;

    &:active {
      opacity: 0.8;
    }

    &:disabled {
      background: var(--bg-color-disabled);
      color: var(--text-color-tertiary);
    }
  }
}

/* #ifdef H5 */
.bottom-bar {
  left: 50%;
  right: auto;
  width: min(100vw, 430px);
  transform: translateX(-50%);
  box-sizing: border-box;
}
/* #endif */

// 地址选择弹窗
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.picker-content {
  width: 100%;
  max-height: 80vh;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-bottom: 1px solid var(--border-color-light);

  .picker-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .picker-close {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    color: var(--text-color-tertiary);
    background: var(--bg-color-page);
    border-radius: 50%;
  }
}

.address-list {
  flex: 1;
  overflow-y: auto;
}

.address-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-bottom: 1px solid var(--border-color-light);

  &.selected {
    background: var(--primary-color-alpha-5);
  }
}

.address-item-content {
  flex: 1;
}

.address-item-contact {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.address-item .contact-name {
  font-size: 28rpx;
  color: var(--text-color-primary);
  font-weight: 500;
}

.address-item .contact-phone {
  font-size: 26rpx;
  color: var(--text-color-secondary);
}

.address-tag {
  padding: 4rpx 12rpx;
  background: var(--primary-color);
  color: var(--bg-color-card);
  font-size: 22rpx;
  border-radius: 9999px;
}

.address-item-detail {
  font-size: 26rpx;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.address-item-check {
  width: 40rpx;
  height: 40rpx;
  background: var(--primary-color);
  color: var(--bg-color-card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  margin-left: 16rpx;
}

.address-empty-state {
  padding: 80rpx 24rpx;
  text-align: center;

  .empty-state-text {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }
}

.picker-footer {
  padding: 20rpx;
  border-top: 1px solid var(--border-color-light);

  .add-address-btn {
    width: 100%;
    height: 80rpx;
    background: var(--bg-color-card);
    color: var(--primary-color);
    font-size: 28rpx;
    border: 1px solid var(--primary-color);
    border-radius: 9999px;
    line-height: 80rpx;
    padding: 0;

    &:active {
      background: var(--primary-color-alpha-8);
    }
  }
}
</style>
