<template>
  <view class="image-uploader" :class="[`layout-${mode}`, customClass]" :style="customStyle">
    <!-- 图片列表 -->
    <view class="image-list">
      <!-- 已上传的图片 -->
      <view
        v-for="(item, index) in imageList"
        :key="item.id || index"
        class="image-item"
        :class="{ 'is-uploading': item.status === 'uploading' }"
      >
        <!-- 图片 -->
        <image
          class="image-preview"
          :src="item.url"
          mode="aspectFill"
          @click="handlePreview(index)"
        />

        <!-- 上传进度 -->
        <view v-if="item.status === 'uploading'" class="upload-progress">
          <view class="progress-bar" :style="{ width: `${item.progress || 0}%` }"></view>
          <text class="progress-text">{{ item.progress }}%</text>
        </view>

        <!-- 上传失败 -->
        <view v-if="item.status === 'failed'" class="upload-failed" @click="handleRetry(index)">
          <text class="failed-icon">⚠️</text>
        </view>

        <!-- 操作按钮 -->
        <view v-if="!disabled && item.status !== 'uploading'" class="image-actions">
          <view class="action-btn delete-btn" @click.stop="handleDelete(index)">
            <text class="btn-icon">×</text>
          </view>
          <view
            v-if="showMoveControls && imageList.length > 1"
            class="action-btn move-btn"
            @click.stop="handleMove(index)"
          >
            <text class="btn-icon">⋮⋮</text>
          </view>
        </view>
      </view>

      <!-- 上传按钮 -->
      <view
        v-if="!disabled && imageList.length < maxCount"
        class="upload-button"
        :class="{ 'is-disabled': disabled || isUploading }"
        @click="handleChooseImage"
      >
        <slot name="upload">
          <view class="upload-content">
            <text class="upload-icon">+</text>
            <text v-if="uploadText" class="upload-text">{{ uploadText }}</text>
            <text v-if="tipText" class="upload-tip">{{ tipText }}</text>
          </view>
        </slot>
      </view>
    </view>

    <!-- 错误提示 -->
    <text v-if="hasError && errorText" class="uploader-error">{{ errorText }}</text>

    <!-- 帮助文本 -->
    <text v-if="helpText && !hasError" class="uploader-help">{{ helpText }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { chooseImage, uploadImage, batchCompressImages, formatFileSize } from '@/utils/image'

interface ImageItem {
  id?: string
  url: string
  status?: 'pending' | 'uploading' | 'success' | 'failed'
  progress?: number
  file?: any
  uploadedUrl?: string
}

interface Props {
  /** 图片列表 */
  modelValue?: string[]
  /** 最大上传数量 */
  maxCount?: number
  /** 最大文件大小（MB） */
  maxSize?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示移动控制 */
  showMoveControls?: boolean
  /** 是否压缩图片 */
  compress?: boolean
  /** 上传按钮文字 */
  uploadText?: string
  /** 提示文字 */
  tipText?: string
  /** 布局模式 */
  mode?: 'grid' | 'list'
  /** 错误状态 */
  hasError?: boolean
  /** 错误提示 */
  errorText?: string
  /** 帮助文本 */
  helpText?: string
  /** 上传地址 */
  action?: string
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxCount: 9,
  maxSize: 5,
  disabled: false,
  showMoveControls: true,
  compress: true,
  uploadText: '上传图片',
  mode: 'grid'
})

const emit = defineEmits<{
  'update:modelValue': [urls: string[]]
  'change': [urls: string[]]
  'upload-success': [item: ImageItem, response: any]
  'upload-error': [item: ImageItem, error: any]
  'delete': [index: number, url: string]
  'preview': [index: number, url: string]
  'oversize': [file: any, size: number]
}>()

const imageList = ref<ImageItem[]>([])
const isUploading = ref(false)

// 初始化图片列表
function initImageList(urls: string[]) {
  imageList.value = urls.map(url => ({
    url,
    status: 'success',
    uploadedUrl: url
  }))
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  const urls = imageList.value
    .filter(item => item.status === 'success' && item.uploadedUrl)
    .map(item => item.uploadedUrl!)

  if (JSON.stringify(urls) !== JSON.stringify(newVal)) {
    initImageList(newVal)
  }
}, { immediate: true })

// 选择图片
async function handleChooseImage() {
  if (props.disabled || isUploading.value) return

  try {
    const remainCount = props.maxCount - imageList.value.length
    const files = await chooseImage({
      count: remainCount,
      sizeType: props.compress ? ['compressed'] : ['original', 'compressed'],
      sourceType: ['album', 'camera']
    })

    // 检查文件大小
    const validFiles = []
    for (const file of files) {
      const fileInfo = await getFileInfo(file)
      if (fileInfo.size > props.maxSize * 1024 * 1024) {
        emit('oversize', file, fileInfo.size)
        uni.showToast({
          title: `图片大小不能超过${props.maxSize}MB`,
          icon: 'none'
        })
      } else {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0) return

    // 添加到列表
    for (const file of validFiles) {
      imageList.value.push({
        url: file,
        status: 'pending',
        file
      })
    }

    // 开始上传
    startUpload()
  } catch (error) {
    console.error('选择图片失败:', error)
  }
}

// 获取文件信息
function getFileInfo(filePath: string): Promise<{ size: number }> {
  return new Promise((resolve, reject) => {
    uni.getFileInfo({
      filePath,
      success: (res) => resolve({ size: res.size }),
      fail: reject
    })
  })
}

// 开始上传
async function startUpload() {
  isUploading.value = true

  const pendingItems = imageList.value.filter(item => item.status === 'pending')

  for (const item of pendingItems) {
    await uploadSingleImage(item)
  }

  isUploading.value = false
  emitChange()
}

// 上传单张图片
async function uploadSingleImage(item: ImageItem) {
  item.status = 'uploading'
  item.progress = 0

  try {
    let fileUrl = item.url

    // 压缩图片
    if (props.compress) {
      const compressed = await compressImage(fileUrl)
      fileUrl = compressed
    }

    // 模拟进度
    const progressTimer = setInterval(() => {
      if (item.progress! < 90) {
        item.progress = (item.progress || 0) + 10
      }
    }, 200)

    // 上传图片
    const result = await uploadImage(fileUrl, props.action)

    clearInterval(progressTimer)
    item.progress = 100
    item.status = 'success'
    item.uploadedUrl = result.url

    emit('upload-success', item, result)
  } catch (error) {
    console.error('上传失败:', error)
    item.status = 'failed'
    item.progress = 0
    emit('upload-error', item, error)
  }
}

// 压缩图片
async function compressImage(src: string): Promise<string> {
  return new Promise((resolve) => {
    uni.compressImage({
      src,
      quality: 80,
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(src) // 压缩失败使用原图
    })
  })
}

// 重试上传
async function handleRetry(index: number) {
  const item = imageList.value[index]
  if (item.status !== 'failed') return

  item.status = 'pending'
  await uploadSingleImage(item)
  emitChange()
}

// 删除图片
function handleDelete(index: number) {
  const item = imageList.value[index]
  const url = item.uploadedUrl || item.url

  imageList.value.splice(index, 1)

  emit('delete', index, url)
  emitChange()
}

// 移动图片
function handleMove(index: number) {
  // 简单实现：与上一张交换位置
  if (index <= 0) return

  const temp = imageList.value[index]
  imageList.value[index] = imageList.value[index - 1]
  imageList.value[index - 1] = temp

  emitChange()
}

// 预览图片
function handlePreview(index: number) {
  const urls = imageList.value.map(item => item.url)
  uni.previewImage({
    current: index,
    urls
  })
  emit('preview', index, urls[index])
}

// 触发变化
function emitChange() {
  const urls = imageList.value
    .filter(item => item.status === 'success' && item.uploadedUrl)
    .map(item => item.uploadedUrl!)

  emit('update:modelValue', urls)
  emit('change', urls)
}

// 暴露方法
defineExpose({
  // 手动触发上传
  startUpload,
  // 获取所有图片（包括未上传的）
  getAllImages: () => imageList.value,
  // 获取已上传成功的图片
  getSuccessImages: () => imageList.value.filter(item => item.status === 'success'),
  // 清空列表
  clear: () => {
    imageList.value = []
    emitChange()
  }
})
</script>

<script lang="ts">
export default {
  name: 'ImageUploader',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.image-uploader {
  width: 100%;

  .image-list {
    display: grid;
    gap: 16rpx;
  }

  &.layout-grid {
    .image-list {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &.layout-list {
    .image-list {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .image-item {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: 8rpx;
    overflow: hidden;
    background: var(--bg-color-disabled);

    .image-preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .upload-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 48rpx;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;

      .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s;
      }

      .progress-text {
        position: relative;
        font-size: 22rpx;
        color: #fff;
        z-index: 1;
      }
    }

    .upload-failed {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;

      .failed-icon {
        font-size: 64rpx;
      }
    }

    .image-actions {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      display: flex;
      gap: 8rpx;

      .action-btn {
        width: 44rpx;
        height: 44rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);

        .btn-icon {
          font-size: 32rpx;
          color: #fff;
          line-height: 1;
        }
      }
    }

    &.is-uploading {
      pointer-events: none;
    }
  }

  .upload-button {
    width: 100%;
    padding-bottom: 100%;
    position: relative;
    border: 2rpx dashed #e5e5e5;
    border-radius: 8rpx;
    background: #fafafa;
    transition: border-color 0.2s, background 0.2s;

    &:not(.is-disabled):active {
      border-color: var(--primary-color);
      background: var(--bg-color-card);
    }

    .upload-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12rpx;
      padding: 24rpx;

      .upload-icon {
        font-size: 64rpx;
        color: var(--text-color-tertiary);
        line-height: 1;
      }

      .upload-text {
        font-size: 24rpx;
        color: var(--text-color-secondary);
        white-space: nowrap;
      }

      .upload-tip {
        font-size: 22rpx;
        color: var(--text-color-tertiary);
        text-align: center;
        line-height: 1.4;
      }
    }
  }

  .uploader-error {
    display: block;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: var(--danger-color);
    line-height: 1.4;
  }

  .uploader-help {
    display: block;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: var(--text-color-tertiary);
    line-height: 1.4;
  }
}
</style>
