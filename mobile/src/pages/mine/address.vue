<template>
  <view class="address-page service-redesign-page" :style="[themeStyle, pageAnimationStyle]">
    <!-- 页面头部 -->
    <view class="page-header header-animate">
      <text class="page-title">收货地址</text>
    </view>

    <!-- 骨架屏 -->
    <view v-if="isLoading" class="skeleton-wrapper">
      <view v-for="i in 3" :key="i" class="skeleton-item"></view>
    </view>

    <!-- 地址列表 -->
    <view v-else class="address-list">
      <view
        v-for="(item, index) in addressList"
        :key="item.id"
        class="address-item item-animate"
        :class="{ 'item-visible': item.visible !== false }"
        :style="{ animationDelay: `${index * 80}ms` }"
        @click="editAddress(item)"
      >
          <view class="address-content">
            <view class="address-header">
              <view class="user-info">
                <text class="name">{{ item.name }}</text>
                <text class="phone">{{ item.phone }}</text>
              </view>
              <view class="default-badge" v-if="item.isDefault">
                <text class="badge-text">默认</text>
              </view>
            </view>
            <view class="address-detail">
              <text class="address-text">{{ item.fullAddress }}</text>
            </view>
            <view class="address-tags" v-if="item.tags && item.tags.length > 0">
              <view class="tag" v-for="(tag, tagIndex) in item.tags" :key="tagIndex">
                <text class="tag-text">{{ tag }}</text>
              </view>
            </view>
          </view>
          <view class="address-actions">
            <view class="action-btn" @click.stop="setDefault(item)" v-if="!item.isDefault">
              <uni-icons type="star" size="16" color="#AAAAAA" />
              <text class="action-text">设为默认</text>
            </view>
            <view class="action-btn" @click.stop="editAddress(item)">
              <uni-icons type="compose" size="16" color="#AAAAAA" />
              <text class="action-text">编辑</text>
            </view>
            <view class="action-btn delete" @click.stop="deleteAddress(item)">
              <uni-icons type="trash" size="16" :color="dangerColor" />
              <text class="action-text">删除</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="addressList.length === 0" class="empty-state">
          <image src="/static/images/address.png" class="empty-image" mode="aspectFit" />
          <text class="empty-text">暂无收货地址</text>
          <view class="empty-btn" @click="addAddress">
            <text class="empty-btn-text">添加地址</text>
          </view>
        </view>
    </view>

    <!-- 底部添加按钮 -->
    <view class="bottom-bar">
      <view class="bottom-btn" @click="addAddress">
        <uni-icons type="plus" size="20" color="#FFFFFF" />
        <text class="bottom-btn-text">添加新地址</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeColors, useThemeStyle } from '@/utils/theme'
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigate } from '@/utils/router'
import { usePageAnimation } from '@/composables/usePageAnimation'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { addressApi, type UserAddress } from '@/api/address'
import type { IdLike } from '@/utils/id'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { dangerColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

// 标记页面是否已经初始化
let isInitialized = false

// 页面显示时刷新数据（从编辑页面返回时会触发）
onShow(() => {
  useThemePage()
  if (!isInitialized) {
    // 首次加载，执行初始化
    console.log('[Address] ========== 首次加载，初始化页面 ==========')
    isInitialized = true
    startPageAnimation()
  } else {
    // 从其他页面返回，刷新数据
    console.log('[Address] ========== onShow 触发，从其他页面返回，刷新地址列表 ==========')
  }
  loadData()
})

interface Address {
  id: IdLike
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  fullAddress: string
  isDefault: boolean
  tags?: string[]
  visible?: boolean
}

const isLoading = ref(true)
const addressList = ref<Address[]>([])

// 页面入场动画
const { pageVisible, contentOpacity, contentTransform, startPageAnimation } = usePageAnimation({
  delay: 50,
  duration: 400
})

// 页面容器动画样式
const pageAnimationStyle = computed(() => ({
  opacity: contentOpacity.value,
  transform: `translateY(${contentTransform.value}rpx)`,
  transition: pageVisible.value
    ? 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : 'none'
}))

// 将后端数据转换为页面需要的格式
function transformAddress(apiAddress: UserAddress): Address {
  return {
    id: apiAddress.addressId,
    name: apiAddress.contactName,
    phone: apiAddress.contactPhone,
    province: apiAddress.province,
    city: apiAddress.city,
    district: apiAddress.district,
    detail: apiAddress.detailAddress,
    fullAddress: apiAddress.fullAddress,
    isDefault: apiAddress.isDefault,
    tags: apiAddress.tag ? [apiAddress.tag] : []
  }
}

// 加载数据
async function loadData() {
  console.log('[Address] ========== 开始加载地址列表 ==========')
  isLoading.value = true
  try {
    const res = await addressApi.getAddressList()
    console.log('[Address] API响应:', JSON.stringify(res, null, 2))
    console.log('[Address] res.data 类型:', typeof res.data)
    console.log('[Address] res.data 内容:', res.data)
    console.log('[Address] res.data.list:', res.data?.list)
    console.log('[Address] res.data.records:', (res.data as any)?.records)

    // 检查数据结构
    const listData = res.data?.list || (res.data as any)?.records || []
    console.log('[Address] 提取的列表数据:', listData)
    console.log('[Address] 列表数据类型:', Array.isArray(listData) ? '数组' : typeof listData)
    console.log('[Address] 列表数据长度:', Array.isArray(listData) ? listData.length : '非数组')

    const transformedList = listData.map(transformAddress)
    console.log('[Address] 转换后的地址列表:', JSON.stringify(transformedList, null, 2))
    addressList.value = transformedList
    console.log('[Address] ========== 加载地址列表成功，共 ' + addressList.value.length + ' 条 ==========')
  } catch (error) {
    console.error('[Address] ========== 加载地址列表失败 ==========')
    console.error('[Address] 错误详情:', error)
    console.error('[Address] 错误对象字符串:', JSON.stringify(error, null, 2))
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

// 刷新数据
async function refresh() {
  await loadData()
}

// 添加地址
function addAddress() {
  uni.navigateTo({
    url: '/pages/mine/address-edit'
  })
}

// 编辑地址
function editAddress(item: Address) {
  uni.navigateTo({
    url: `/pages/mine/address-edit?id=${item.id}`
  })
}

// 设为默认
async function setDefault(item: Address) {
  console.log('[Address] ========== 开始设置默认地址 ==========')
  console.log('[Address] 地址ID:', item.id)
  console.log('[Address] 地址信息:', JSON.stringify(item, null, 2))

  try {
    uni.showLoading({ title: '设置中...' })

    console.log('[Address] 调用API: PUT /user/address/' + item.id + '/default')
    const result = await addressApi.setDefaultAddress(String(item.id))
    console.log('[Address] API响应:', JSON.stringify(result, null, 2))

    console.log('[Address] ========== 设置默认地址成功 ==========')
    uni.hideLoading()
    uni.showToast({
      title: '设置成功',
      icon: 'success'
    })

    refresh()
  } catch (error) {
    console.error('[Address] ========== 设置默认地址失败 ==========')
    console.error('[Address] 错误详情:', error)
    console.error('[Address] 错误对象字符串:', JSON.stringify(error, null, 2))
    uni.hideLoading()
    uni.showToast({
      title: '设置失败',
      icon: 'none'
    })
  }
}

// 删除地址
function deleteAddress(item: Address) {
  console.log('[Address] ========== 用户确认删除地址 ==========')
  console.log('[Address] 地址ID:', item.id)
  console.log('[Address] 地址信息:', JSON.stringify(item, null, 2))

  uni.showModal({
    title: '确认删除',
    content: '确定要删除该地址吗？',
    success: async (res) => {
      if (res.confirm) {
        console.log('[Address] 用户确认删除，开始执行删除操作')
        try {
          uni.showLoading({ title: '删除中...' })

          console.log('[Address] 调用API: DELETE /user/address/' + item.id)
          const result = await addressApi.deleteAddress(String(item.id))
          console.log('[Address] API响应:', JSON.stringify(result, null, 2))

          console.log('[Address] ========== 删除地址成功 ==========')
          uni.hideLoading()
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })

          refresh()
        } catch (error) {
          console.error('[Address] ========== 删除地址失败 ==========')
          console.error('[Address] 错误详情:', error)
          console.error('[Address] 错误对象字符串:', JSON.stringify(error, null, 2))
          uni.hideLoading()
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      } else {
        console.log('[Address] 用户取消删除')
      }
    }
  })
}

// 下拉刷新 - 暂时注释掉
// onPullDownRefresh(() => {
//   refresh().then(() => {
//     uni.stopPullDownRefresh()
//   })
// })
</script>

<style lang="scss" scoped>
.address-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: var(--bg-color-card);
}

/* ========== 页面入场动画 ========== */

/* 头部动画 */
.header-animate {
  animation: headerSlideDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* 骨架屏 */
.skeleton-wrapper {
  padding: 24rpx;
}

.skeleton-item {
  background: linear-gradient(
    90deg,
    var(--border-color-light) 25%,
    #e0e0e0 50%,
    var(--border-color-light) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
  height: 200rpx;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
}

@keyframes skeletonShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 地址项入场动画 */
.item-animate {
  opacity: 0;
  transform: translateY(30rpx) scale(0.98);
  animation: itemSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

  &.item-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes itemSlideIn {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes headerSlideDown {
  0% {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 按钮点击反馈 */
.action-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

/* 底部按钮动画 */
.bottom-btn {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:active {
    transform: scale(0.98);
  }
}

.page-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-color-primary);
}

.address-list {
  padding: 24rpx;
}

.address-item {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--bg-color-card);
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.address-content {
  padding: 28rpx;
  border-bottom: 1rpx solid var(--bg-color-disabled);
}

.address-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color-primary);
}

.phone {
  font-size: 24rpx;
  color: var(--text-color-secondary);
}

.default-badge {
  padding: 6rpx 16rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
  border-radius: 20rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
}

.address-detail {
  margin-bottom: 16rpx;
}

.address-text {
  font-size: 26rpx;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.address-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.tag {
  padding: 6rpx 16rpx;
  background: var(--bg-color-disabled);
  border-radius: 8rpx;
}

.tag-text {
  font-size: 20rpx;
  color: var(--text-color-tertiary);
}

.address-actions {
  display: flex;
  padding: 20rpx 28rpx;
  gap: 32rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  justify-content: center;
  padding: 12rpx 0;

  &.delete {
    .action-text {
      color: var(--error-color);
    }
  }
}

.action-text {
  font-size: 24rpx;
  color: var(--text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: var(--spacing-md);
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
}

.empty-btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  background: var(--bg-color-card);
  border-top: 1rpx solid var(--bg-color-disabled);
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.bottom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
  padding: 28rpx 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx var(--primary-color-alpha-30);
}

.bottom-btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}
</style>
