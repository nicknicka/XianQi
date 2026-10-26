<template>
  <div class="image-upload-container">
    <el-upload
      :action="uploadUrl"
      :headers="uploadHeaders"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-progress="handleProgress"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      :drag="drag"
      class="image-uploader"
      :disabled="disabled"
    >
      <div v-if="imageUrl && !uploading" class="image-preview-wrapper">
        <el-image :src="imageUrl" fit="contain" class="uploaded-image" />
        <div class="image-mask">
          <div class="mask-actions">
            <el-icon @click.stop="handlePreview" class="mask-icon">
              <View />
            </el-icon>
            <el-icon @click.stop="handleRemove" class="mask-icon">
              <Delete />
            </el-icon>
          </div>
        </div>
      </div>
      <div v-else-if="uploading" class="uploading-wrapper">
        <el-progress :percentage="uploadPercentage" />
        <div class="uploading-text">上传中...</div>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon">
          <Plus />
        </el-icon>
        <div class="upload-text">
          <div>{{ drag ? '拖拽图片到此处' : '点击上传图片' }}</div>
          <div class="upload-hint">支持 JPG、PNG、WebP，最大 {{ maxSize }}MB</div>
        </div>
      </div>
    </el-upload>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="800px">
      <div style="text-align: center;">
        <el-image :src="imageUrl" fit="contain" style="max-width: 100%; max-height: 600px;" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, View, Delete } from '@element-plus/icons-vue'
import type { UploadProps } from 'element-plus'

interface Props {
  modelValue?: string
  drag?: boolean
  maxSize?: number
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  drag: true,
  maxSize: 5,
  disabled: false
})

const emit = defineEmits<Emits>()

const imageUrl = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

// 上传配置
const uploadUrl = import.meta.env.VITE_ADMIN_BASE_URL + '/upload/image'
const uploadHeaders = computed(() => ({
  'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
}))

// 上传状态
const uploading = ref(false)
const uploadPercentage = ref(0)
const previewVisible = ref(false)

// 上传前校验
const beforeUpload = (file: File) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }

  // 检查文件大小
  const isLtSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB！`)
    return false
  }

  uploading.value = true
  uploadPercentage.value = 0
  return true
}

// 上传成功
const handleSuccess = (response: any) => {
  uploading.value = false
  uploadPercentage.value = 100

  if (response.code === 200 && response.data) {
    // 后端返回的URL格式
    imageUrl.value = response.data.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
const handleError = (error: any) => {
  uploading.value = false
  uploadPercentage.value = 0
  console.error('上传失败:', error)
  ElMessage.error('上传失败，请重试')
}

// 上传进度
const handleProgress = (event: any) => {
  uploadPercentage.value = Math.floor(event.percent)
}

// 预览图片
const handlePreview = () => {
  if (imageUrl.value) {
    previewVisible.value = true
  }
}

// 删除图片
const handleRemove = () => {
  imageUrl.value = ''
  ElMessage.success('已删除')
}

// 生成缩略图URL（使用阿里云OSS图片处理）
const getThumbnailUrl = (url: string, width: number = 200, height: number = 200) => {
  if (!url) return ''
  // 检查是否是OSS链接，如果是则添加图片处理参数
  if (url.includes('aliyuncs.com')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}x-oss-process=image/resize,m_fill,w_${width},h_${height}`
  }
  return url
}

// 暴露方法供父组件调用
defineExpose({
  getThumbnailUrl
})
</script>

<style scoped lang="scss">
.image-upload-container {
  width: 100%;
}

.image-uploader {
  :deep(.el-upload) {
    width: 100%;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.image-preview-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;

  .uploaded-image {
    width: 100%;
    height: 100%;
  }

  .image-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;

    .mask-actions {
      display: flex;
      gap: 16px;

      .mask-icon {
        font-size: 24px;
        color: #fff;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }

  &:hover .image-mask {
    opacity: 1;
  }
}

.uploading-wrapper {
  padding: 40px 20px;
  text-align: center;

  .uploading-text {
    margin-top: 16px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.upload-placeholder {
  padding: 40px 20px;
  text-align: center;

  .upload-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
  }

  .upload-text {
    margin-top: 16px;
    color: var(--el-text-color-regular);
    font-size: 14px;

    .upload-hint {
      margin-top: 8px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}

// 拖拽样式
.image-uploader:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  .image-preview-wrapper,
  .uploading-wrapper,
  .upload-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
  }
}
</style>
