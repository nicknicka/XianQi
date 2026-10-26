<template>
  <view class="evaluate-page" :style="themeStyle">
    <scroll-view class="scroll-view" scroll-y>
      <!-- 商品信息 -->
      <view class="product-card">
        <image class="product-image" :src="product.image" mode="aspectFill" />
        <view class="product-info">
          <text class="product-title">{{ product.title }}</text>
          <text class="product-price">¥{{ product.price }}</text>
        </view>
      </view>

      <!-- 评价表单 -->
      <view class="form-section">
        <view class="form-title">{{ isAppendMode ? '追加评价' : '评价商品' }}</view>

        <!-- 星级评分 -->
        <view v-if="!isAppendMode" class="rate-section">
          <text class="label">商品评分</text>
          <view class="stars">
            <text
              v-for="star in 5"
              :key="star"
              class="star"
              :class="{ active: star <= form.rating }"
              @click="form.rating = star"
            >
              ★
            </text>
          </view>
        </view>

        <!-- 标签 -->
        <view v-if="!isAppendMode" class="tags-section">
          <text class="label">评价标签</text>
          <view class="tags">
            <text
              v-for="tag in tags"
              :key="tag"
              class="tag"
              :class="{ active: form.tags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </text>
          </view>
        </view>

        <!-- 文字评价 -->
        <view class="input-section">
          <text class="label">{{ isAppendMode ? '追加内容' : '文字评价' }}</text>
          <textarea
            class="textarea"
            v-model="form.content"
            :placeholder="isAppendMode ? '补充更多使用体验或交易感受' : '分享你的使用体验吧'"
            maxlength="500"
            placeholder-style="color: var(--text-color-tertiary)"
          />
          <text class="count">{{ form.content.length }}/500</text>
        </view>

        <!-- 图片上传 -->
        <view class="upload-section">
          <text class="label">图片（选填，最多3张）</text>
          <view class="image-list">
            <view v-for="(image, index) in form.images" :key="index" class="image-item">
              <image class="preview-image" :src="image" mode="aspectFill" />
              <view class="delete-btn" @click="removeImage(index)">
                <uni-icons type="clear" size="16" color="#fff" />
              </view>
            </view>
            <view v-if="form.images.length < 3" class="upload-btn" @click="chooseImage">
              <uni-icons type="camera" size="32" :color="primaryColor" />
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button class="submit-btn" @click="handleSubmit">
        {{ isAppendMode ? '提交追评' : '提交评价' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { evaluationApi } from '@/api/evaluation'
import { productApi } from '@/api/product'
import { orderApi } from '@/api/order'
import { checkSensitiveWord, SensitiveCheckType } from '@/utils/sensitive-word'
import { uploadImage as uploadImageFile } from '@/utils/image'
import { normalizeImageUrl } from '@/utils/image'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const { themeStyle } = useThemeStyle()
const { primaryColor } = useThemeColors()

const orderId = ref<string>('')
const productId = ref<string>('')
const evaluationId = ref<string>('')
const isAppendMode = ref(false)
const product = ref<any>({})

const tags = ['质量很好', '性价比高', '正品', '发货快', '态度好', '描述准确']

const form = ref({
  rating: 5,
  tags: [] as string[],
  content: '',
  images: [] as string[]
})

onShow(() => {
  useThemePage()
})


onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  orderId.value = options.orderId || ''
  evaluationId.value = options.evalId || options.evaluationId || ''
  isAppendMode.value = options.mode === 'append'

  if (orderId.value) {
    loadOrder()
  }
})

async function loadOrder() {
  try {
    const res = await orderApi.getOrderDetail(orderId.value)
    const order = res.data
    productId.value = order.productId
    loadProduct()
  } catch (error) {
    uni.showToast({ title: '订单不存在', icon: 'none' })
  }
}

async function loadProduct() {
  try {
    const res = await productApi.getProductDetail(productId.value)
    const data = res.data
    product.value = {
      id: data.id,
      title: data.title,
      image: normalizeImageUrl(data.coverImage),
      price: data.price
    }
  } catch (error) {
    // ignore
  }
}

function toggleTag(tag: string) {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  } else {
    form.value.tags.push(tag)
  }
}

function chooseImage() {
  const maxCount = 3 - form.value.images.length
  uni.chooseImage({
    count: maxCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      uploadImages(res.tempFilePaths)
    }
  })
}

async function uploadImages(filePaths: string[]) {
  uni.showLoading({ title: '上传中...' })

  try {
    for (const filePath of filePaths) {
      const url = await uploadSingleImage(filePath)
      form.value.images.push(url)
    }
    uni.hideLoading()
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
}

function uploadSingleImage(filePath: string): Promise<string> {
  return uploadImageFile(filePath).then((result) => result.url)
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}

async function handleSubmit() {
  if (isAppendMode.value && !evaluationId.value) {
    uni.showToast({ title: '评价ID不能为空', icon: 'none' })
    return
  }

  if (!isAppendMode.value && form.value.rating === 0) {
    uni.showToast({ title: '请选择评分', icon: 'none' })
    return
  }
  const content = form.value.content.trim()
  if (!content) {
    uni.showToast({ title: '请输入评价内容', icon: 'none' })
    return
  }

  // 检查敏感词
  const checkResult = await checkSensitiveWord(content, SensitiveCheckType.COMMENT)
  if (checkResult && !checkResult.passed) {
    return
  }

  // 使用过滤后的内容
  const filteredContent = checkResult?.filteredContent || content

  // 如果有敏感词被过滤，显示提示
  if (checkResult?.hasSensitiveWord) {
    uni.showToast({
      title: '已自动过滤敏感词',
      icon: 'none',
      duration: 1500
    })
  }

  // 将tags数组转换为逗号分隔的字符串
  const tagsString = form.value.tags.join(',')

  uni.showLoading({ title: '提交中...' })

  const submitRequest = isAppendMode.value
    ? evaluationApi.appendEvaluation(evaluationId.value, {
        content: filteredContent,
        images: form.value.images
      })
    : evaluationApi.createEvaluation({
        orderId: orderId.value,
        productId: productId.value,
        rating: form.value.rating,
        tags: tagsString,
        content: filteredContent,
        images: form.value.images
      })

  submitRequest
    .then(() => {
      uni.hideLoading()
      uni.showToast({ title: isAppendMode.value ? '追评成功' : '评价成功', icon: 'success' })
      setTimeout(() => {
        // 尝试返回上一页，如果失败则跳转到订单详情页
        const pages = getCurrentPages()
        if (pages.length > 1) {
          uni.navigateBack()
        } else {
          // 如果没有上一页，跳转到订单详情页
          uni.redirectTo({
            url: `/pages/order/detail?id=${orderId.value}`
          })
        }
      }, 1500)
    })
    .catch((error) => {
      uni.hideLoading()
      // 显示后端返回的错误信息
      console.error('评价失败:', error)
      const errorMsg = error?.message || error?.data?.message || '评价失败，请稍后重试'
      uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
    })
}
</script>

<style lang="scss" scoped>
.evaluate-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
}

.scroll-view {
  flex: 1;
}

.product-card {
  display: flex;
  background: var(--bg-color-card);
  padding: 24rpx;
  margin-bottom: 16rpx;

  .product-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: var(--spacing-sm);
    margin-right: 16rpx;
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .product-title {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      line-height: 1.4;
    }

    .product-price {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--error-color);
    }
  }
}

.form-section {
  background: var(--bg-color-card);
  padding: 24rpx;

  .form-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-color-primary);
    margin-bottom: 24rpx;
  }

  .rate-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1px solid var(--border-color-light);

    .stars {
      display: flex;
      gap: 8rpx;

      .star {
        font-size: 48rpx;
        color: #d9d9d9;

        &.active {
          color: #ffcb3f;
        }
      }
    }
  }

  .tags-section {
    padding: 24rpx 0;
    border-bottom: 1px solid var(--border-color-light);

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-top: 16rpx;

      .tag {
        padding: 12rpx 24rpx;
        background: var(--bg-color-page);
        color: var(--text-color-secondary);
        font-size: var(--font-size-base);
        border-radius: 9999px;

        &.active {
          background: var(--primary-color-alpha-10);
          color: var(--primary-color);
        }
      }
    }
  }

  .input-section {
    position: relative;
    padding: 24rpx 0;
    border-bottom: 1px solid var(--border-color-light);

    .textarea {
      width: 100%;
      min-height: 200rpx;
      padding: 16rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      font-size: var(--font-size-base);
      line-height: 1.6;
      margin-top: 12rpx;
    }

    .count {
      position: absolute;
      bottom: 24rpx;
      right: 0;
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
    }
  }

  .upload-section {
    padding: 24rpx 0;

    .image-list {
      display: flex;
      gap: 16rpx;
      margin-top: 16rpx;

      .image-item {
        position: relative;
        width: 160rpx;
        height: 160rpx;

        .preview-image {
          width: 100%;
          height: 100%;
          border-radius: var(--spacing-sm);
        }

        .delete-btn {
          position: absolute;
          top: -8rpx;
          right: -8rpx;
          width: 40rpx;
          height: 40rpx;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .upload-btn {
        width: 160rpx;
        height: 160rpx;
        background: var(--bg-color-page);
        border-radius: var(--spacing-sm);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

.label {
  font-size: var(--font-size-base);
  color: var(--text-color-primary);
  display: block;
}

.bottom-bar {
  padding: 16rpx 24rpx;
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-base);
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));

  .submit-btn {
    width: 100%;
    height: 88rpx;
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: var(--font-size-lg);
    border-radius: 9999px;
    border: none;
  }
}
</style>
