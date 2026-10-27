<template>
  <view class="report-page">
    <scroll-view class="scroll-container" scroll-y>
      <view class="form-section">
      <!-- 举报对象 -->
      <view class="form-item">
        <text class="label">举报对象</text>
        <view class="user-card">
          <UserAvatar
            class="avatar"
            :src="userInfo.avatar || '/static/images/user.png'"
            size="sm"
            :clickable="false"
          />
          <text class="name">{{ userInfo.nickname || userInfo.username }}</text>
        </view>
      </view>

      <!-- 举报类型 -->
      <view class="form-item">
        <text class="label">举报类型</text>
        <view class="type-list">
          <text
            v-for="type in reportTypes"
            :key="type.value"
            class="type-item"
            :class="{ active: form.reportType === type.value }"
            @click="form.reportType = type.value"
          >
            {{ type.label }}
          </text>
        </view>
      </view>

      <!-- 举报原因 -->
      <view class="form-item">
        <text class="label">举报原因</text>
        <textarea
          class="textarea"
          v-model="form.reason"
          placeholder="请详细描述举报原因，以便我们核实处理"
          maxlength="500"
          placeholder-style="color: var(--text-color-tertiary)"
        />
        <text class="count">{{ form.reason.length }}/500</text>
      </view>

      <!-- 图片上传 -->
      <view class="form-item">
        <text class="label">相关截图（选填，最多3张）</text>
        <view class="image-list">
          <view v-for="(image, index) in form.images" :key="index" class="image-item">
            <LazyImage class="preview-image" :src="image" mode="aspectFill" @click="previewImage(index)" />
            <view class="delete-btn" @click="removeImage(index)">
              <uni-icons type="clear" size="16" color="#fff" />
            </view>
          </view>
          <view v-if="form.images.length < 3" class="upload-btn" @click="chooseImage">
            <uni-icons type="camera" size="32" color="#AAAAAA" />
          </view>
        </view>
      </view>
    </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button class="submit-btn" @click="handleSubmit">提交举报</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage } from '@/utils/theme'
import { ref, onMounted } from 'vue'
import { reportApi, ReportType, ReportReason } from '@/api/report'
import { userApi } from '@/api/user'
import { checkSensitiveWord, SensitiveCheckType } from '@/utils/sensitive-word'
import { uploadImage as uploadImageFile } from '@/utils/image'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { onShow } from '@dcloudio/uni-app'

interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar: string
}

const targetUserId = ref<string>('')
const targetType = ref<'user' | 'product' | 'message'>('user')
const userInfo = ref<UserInfo>({} as UserInfo)

const reportTypes = [
  { label: '发布违规信息', value: 'violation' },
  { label: '垃圾广告', value: 'spam' },
  { label: '辱骂谩骂', value: 'abuse' },
  { label: '诈骗', value: 'scam' },
  { label: '色情低俗', value: 'porn' },
  { label: '其他', value: 'other' }
]

const form = ref({
  reportType: 'violation',
  reason: '',
  images: [] as string[]
})

onShow(() => {
  useThemePage()
})


onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  targetUserId.value = options.userId || ''
  targetType.value = options.type || 'user'

  // 加载用户信息
  if (targetUserId.value) {
    try {
      // 这里简化处理，实际应该从用户列表获取或调用专门的用户详情接口
      userInfo.value = {
        id: targetUserId.value,
        username: '用户' + targetUserId.value,
        nickname: '用户' + targetUserId.value,
        avatar: '/static/images/user.png'
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }
})

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

function previewImage(index: number) {
  uni.previewImage({
    urls: form.value.images,
    current: index
  })
}

async function handleSubmit() {
  if (!form.value.reportType) {
    uni.showToast({ title: '请选择举报类型', icon: 'none' })
    return
  }
  if (!form.value.reason.trim()) {
    uni.showToast({ title: '请输入举报原因', icon: 'none' })
    return
  }

  // 检查敏感词
  const checkResult = await checkSensitiveWord(form.value.reason, SensitiveCheckType.COMMENT)
  if (checkResult && !checkResult.passed) {
    return
  }

  // 使用过滤后的内容
  const filteredReason = checkResult?.filteredContent || form.value.reason

  // 如果有敏感词被过滤，显示提示
  if (checkResult?.hasSensitiveWord) {
    uni.showToast({
      title: '已自动过滤敏感词',
      icon: 'none',
      duration: 1500
    })
  }

  try {
    // 映射举报类型
    const targetTypeMap: Record<string, ReportType> = {
      user: ReportType.USER,
      product: ReportType.PRODUCT,
      message: ReportType.MESSAGE
    }

    // 映射举报原因
    const reasonMap: Record<string, ReportReason> = {
      violation: ReportReason.OTHER,
      spam: ReportReason.SPAM,
      abuse: ReportReason.OTHER,
      scam: ReportReason.FRAUD,
      porn: ReportReason.PORNOGRAPHY,
      other: ReportReason.OTHER
    }

    await reportApi.createReport({
      targetType: targetTypeMap[targetType.value] || ReportType.USER,
      targetId: targetUserId.value,
      reason: reasonMap[form.value.reportType] || ReportReason.OTHER,
      description: filteredReason,
      images: form.value.images
    })

    uni.showToast({ title: '举报已提交，感谢您的反馈', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('举报提交失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.report-page {
  height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scroll-container {
  flex: 1;
  height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.form-section {
  background: var(--bg-color-card);
  padding: 24rpx;
  margin-bottom: 16rpx;

  .form-item {
    margin-bottom: 32rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
      display: block;
      margin-bottom: 12rpx;
    }

    .user-card {
      display: flex;
      align-items: center;
      padding: 16rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);

      .avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        margin-right: 16rpx;
      }

      .name {
        font-size: var(--font-size-base);
        color: var(--text-color-primary);
      }
    }

    .type-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;

      .type-item {
        padding: 12rpx 24rpx;
        background: var(--bg-color-page);
        color: var(--text-color-secondary);
        font-size: var(--font-size-base);
        border-radius: 24rpx;

        &.active {
          background: var(--bg-color-card);
          color: var(--primary-color);
        }
      }
    }

    .textarea {
      width: 100%;
      min-height: 200rpx;
      padding: 16rpx;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      font-size: var(--font-size-base);
      line-height: 1.6;
    }

    .count {
      display: block;
      text-align: right;
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
      margin-top: 8rpx;
    }

    .image-list {
      display: flex;
      gap: 16rpx;

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

.submit-section {
  padding: 24rpx;

  .submit-btn {
    width: 100%;
    height: 88rpx;
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: var(--font-size-lg);
    border-radius: 12rpx;
    border: none;
  }
}
</style>
