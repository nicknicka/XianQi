<template>
  <view class="address-edit-page">
    <!-- 表单 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label">联系人</text>
        <input
          v-model="form.contactName"
          class="input"
          placeholder="请输入联系人姓名"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <view class="form-item">
        <text class="label">手机号</text>
        <input
          v-model="form.contactPhone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <!-- 省市区选择 -->
      <AddressPicker
        class="region-picker-trigger"
        :model-value="selectedRegion"
        @change="onRegionSelected"
      >
        <template #trigger>
          <view class="form-item">
            <text class="label">所在地区</text>
            <view class="region-value">
              <text v-if="regionText" class="text">{{ regionText }}</text>
              <text v-else class="placeholder">请选择省/市/区</text>
              <uni-icons type="right" size="16" color="#AAAAAA" />
            </view>
          </view>
        </template>
      </AddressPicker>

      <view class="form-item">
        <text class="label">详细地址</text>
        <textarea
          v-model="form.detailAddress"
          class="textarea"
          placeholder="请输入详细地址，如街道、楼栋号、门牌号等"
          placeholder-style="color: var(--text-color-tertiary)"
          maxlength="200"
        />
      </view>

      <!-- 设为默认 -->
      <view class="form-item default-item">
        <text class="label">设为默认地址</text>
        <switch :checked="form.isDefault" @change="onDefaultChange" :color="primaryColor" />
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="bottom-bar">
      <button class="save-btn" @click="saveAddress">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { addressApi, type UserAddress } from '@/api/address'
import AddressPicker from '@/components/address-picker/address-picker.vue'
import { addressPicker, type SelectedAddress } from '@/utils/address-picker'
import {useThemeColors, useThemePage, useThemeStyle} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const { primaryColor } = useThemeColors()
const { themeStyle } = useThemeStyle()
const addressId = ref<string>('')
const isEdit = ref(false)
const selectedRegion = ref<SelectedAddress>({})

// 表单数据
const form = ref({
  contactName: '',
  contactPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: false
})

// 地区文本
const regionText = computed(() => {
  if (form.value.province && form.value.city && form.value.district) {
    return `${form.value.province} ${form.value.city} ${form.value.district}`
  }
  return ''
})

// 页面标题
const pageTitle = computed(() => isEdit.value ? '编辑地址' : '添加地址')

onShow(() => {
  useThemePage()
})


onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.id) {
    addressId.value = options.id
    isEdit.value = true
    loadAddressDetail()
  }
})

// 加载地址详情
async function loadAddressDetail() {
  try {
    console.log('[AddressEdit] ========== 开始加载地址详情 ==========')
    console.log('[AddressEdit] 地址ID:', addressId.value)

    const res = await addressApi.getAddressDetail(addressId.value)
    console.log('[AddressEdit] API响应:', JSON.stringify(res, null, 2))

    // 从 res.data 中获取地址数据
    const addressData = res.data
    console.log('[AddressEdit] 地址数据:', JSON.stringify(addressData, null, 2))

    form.value = {
      contactName: addressData.contactName,
      contactPhone: addressData.contactPhone,
      province: addressData.province,
      city: addressData.city,
      district: addressData.district,
      detailAddress: addressData.detailAddress,
      isDefault: addressData.isDefault
    }
    selectedRegion.value = {
      provinceName: addressData.province,
      cityName: addressData.city,
      districtName: addressData.district,
      provinceCode: addressPicker.getCodeByName(addressData.province) || undefined,
      cityCode: addressPicker.getCodeByName(addressData.province, addressData.city) || undefined,
      districtCode: addressPicker.getCodeByName(addressData.province, addressData.city, addressData.district) || undefined,
      fullAddress: `${addressData.province}${addressData.city}${addressData.district}`
    }

    console.log('[AddressEdit] ========== 地址详情加载成功 ==========')
  } catch (error) {
    console.error('[AddressEdit] ========== 加载地址详情失败 ==========')
    console.error('[AddressEdit] 错误详情:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// 设为默认
function onDefaultChange(e: any) {
  form.value.isDefault = e.detail.value
}

function onRegionSelected(region: SelectedAddress) {
  selectedRegion.value = region
  form.value.province = region.provinceName || ''
  form.value.city = region.cityName || ''
  form.value.district = region.districtName || ''
}

// 保存地址
async function saveAddress() {
  // 表单验证
  if (!form.value.contactName) {
    uni.showToast({ title: '请输入联系人姓名', icon: 'none' })
    return
  }

  if (!form.value.contactPhone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }

  if (!/^1[3-9]\d{9}$/.test(form.value.contactPhone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }

  if (!form.value.province || !form.value.city || !form.value.district) {
    uni.showToast({ title: '请选择所在地区', icon: 'none' })
    return
  }

  if (!form.value.detailAddress) {
    uni.showToast({ title: '请输入详细地址', icon: 'none' })
    return
  }

  console.log('[AddressEdit] ========== 开始保存地址 ==========')
  console.log('[AddressEdit] 是否为编辑模式:', isEdit.value)
  console.log('[AddressEdit] 地址ID:', addressId.value)
  console.log('[AddressEdit] 表单数据:', JSON.stringify(form.value, null, 2))

  try {
    uni.showLoading({ title: '保存中...' })

    let result
    if (isEdit.value) {
      console.log('[AddressEdit] 调用更新地址API: PUT /user/address/' + addressId.value)
      console.log('[AddressEdit] 请求参数:', JSON.stringify(form.value, null, 2))
      // 更新地址
      result = await addressApi.updateAddress(addressId.value, form.value)
      console.log('[AddressEdit] 更新地址API响应:', JSON.stringify(result, null, 2))
    } else {
      console.log('[AddressEdit] 调用创建地址API: POST /user/address')
      console.log('[AddressEdit] 请求参数:', JSON.stringify(form.value, null, 2))
      // 创建地址
      result = await addressApi.createAddress(form.value)
      console.log('[AddressEdit] 创建地址API响应:', JSON.stringify(result, null, 2))
    }

    console.log('[AddressEdit] ========== 保存地址成功 ==========')
    uni.hideLoading()
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  } catch (error) {
    console.error('[AddressEdit] ========== 保存地址失败 ==========')
    console.error('[AddressEdit] 错误详情:', error)
    console.error('[AddressEdit] 错误对象字符串:', JSON.stringify(error, null, 2))
    uni.hideLoading()
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.address-edit-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding-bottom: 140rpx;
}

.form-section {
  background: var(--bg-color-card);
  margin-top: 16rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--border-color-light);

  &.tags-item {
    flex-direction: column;
    align-items: flex-start;
  }

  &.default-item {
    justify-content: space-between;
  }
}

.label {
  min-width: 140rpx;
  font-size: 28rpx;
  color: var(--text-color-primary);
  font-weight: 500;
}

.input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-color-primary);
  text-align: right;
}

.textarea {
  flex: 1;
  min-height: 120rpx;
  margin-top: 16rpx;
  padding: 20rpx;
  background: var(--bg-color-disabled);
  border-radius: 8rpx;
  font-size: 28rpx;
  color: var(--text-color-primary);
}

.region-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;

  .text {
    font-size: 28rpx;
    color: var(--text-color-primary);
  }

  .placeholder {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }
}

.tags-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.tag-item {
  padding: 12rpx 32rpx;
  background: var(--bg-color-page);
  border-radius: 32rpx;
  border: 1rpx solid transparent;

  &.active {
    background: var(--bg-color-warm);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .tag-text {
    font-size: 24rpx;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 32rpx;
  background: var(--bg-color-card);
  border-top: 1rpx solid var(--border-color-light);
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.save-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
  color: var(--bg-color-card);
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;

  &:active {
    opacity: 0.8;
  }
}

.region-picker-trigger {
  display: block;
}
</style>
