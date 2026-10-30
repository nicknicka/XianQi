<template>
  <view class="image-uploader">
    <view class="image-list">
      <view v-for="(image, index) in imageList" :key="index" class="image-item">
        <image class="preview-image" :src="image" mode="aspectFill" @click="previewImage(index)" />
        <view class="delete-btn" @click="removeImage(index)">
          <uni-icons type="clear" size="16" color="#fff" />
        </view>
        <view v-if="index === 0 && showCoverTag" class="cover-tag">封面</view>
      </view>
      <view v-if="imageList.length < maxCount" class="upload-btn" @click="chooseImage">
        <uni-icons type="camera" size="32" :color="textColorTertiary" />
        <text class="upload-text">{{ imageList.length > 0 ? '' : '添加图片' }}</text>
      </view>
    </view>
    <text v-if="tip" class="upload-tip">{{ tip }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'
import { parseUploadedImageResult } from '@/utils/image'

const { themeStyle } = useThemeStyle()
const { textColorTertiary, warningColor } = useThemeColors()

interface Props {
  modelValue: string[]
  maxCount?: number
  showCoverTag?: boolean
  tip?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 9,
  showCoverTag: true,
  tip: ''
})

const emit = defineEmits<{
  'update:modelValue': [images: string[]]
  change: [images: string[]]
}>()

const imageList = ref<string[]>([...props.modelValue])

watch(
  () => props.modelValue,
  (newVal) => {
    imageList.value = [...newVal]
  }
)

function chooseImage() {
  const maxCount = props.maxCount - imageList.value.length
  uni.chooseImage({
    count: maxCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const filePaths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
      uploadImages(filePaths)
    }
  })
}

async function uploadImages(filePaths: string[]) {
  uni.showLoading({ title: '上传中...' })

  try {
    for (const filePath of filePaths) {
      const url = await uploadSingleImage(filePath)
      imageList.value.push(url)
    }
    updateImages()
    uni.hideLoading()
    uni.showToast({ title: '上传成功', icon: 'success' })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
}

function uploadSingleImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: import.meta.env.VITE_API_BASE_URL + '/upload/images',
      filePath,
      name: 'files',
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`
      },
      success: (res) => {
        try {
          const result = parseUploadedImageResult(res.data)
          resolve(result.url)
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}

function removeImage(index: number) {
  imageList.value.splice(index, 1)
  updateImages()
}

function previewImage(index: number) {
  uni.previewImage({
    urls: imageList.value,
    current: index
  })
}

function updateImages() {
  emit('update:modelValue', [...imageList.value])
  emit('change', [...imageList.value])
}
</script>

<style lang="scss" scoped>
.image-uploader {
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  .image-item,
  .upload-btn {
    position: relative;
    width: 160rpx;
    height: 160rpx;

    &.upload-btn {
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px dashed var(--border-color-base);

      .upload-text {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
        margin-top: 8rpx;
      }
    }

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

    .cover-tag {
      position: absolute;
      bottom: 8rpx;
      left: 8rpx;
      padding: 4rpx 12rpx;
      background: var(--warning-color);
      color: var(--bg-color-card);
      font-size: var(--font-size-sm);
      border-radius: 4rpx;
    }
  }

  .upload-tip {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
    margin-top: 12rpx;
  }
}
</style>
