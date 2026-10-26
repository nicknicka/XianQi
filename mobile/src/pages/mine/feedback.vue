<template>
  <view class="feedback-page page-animate service-redesign-page" :class="{ 'animate-in': isAnimated }">
    <view class="form-section">
      <!-- 反馈类型 -->
      <view class="form-item">
        <text class="label">反馈类型</text>
        <view class="type-list">
          <text
            v-for="type in feedbackTypes"
            :key="type.value"
            class="type-item"
            :class="{ active: form.type === type.value }"
            @click="form.type = type.value"
          >
            {{ type.label }}
          </text>
        </view>
      </view>

      <!-- 反馈标题 -->
      <view class="form-item">
        <text class="label">反馈标题（选填）</text>
        <input
          class="input"
          v-model="form.title"
          type="text"
          placeholder="用一句话概括您的问题"
          maxlength="50"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>

      <!-- 问题描述 -->
      <view class="form-item">
        <text class="label">问题描述</text>
        <textarea
          class="textarea"
          v-model="form.content"
          placeholder="请详细描述您遇到的问题或建议"
          maxlength="500"
          placeholder-style="color: var(--text-color-tertiary)"
        />
        <text class="count">{{ form.content.length }}/500</text>
      </view>

      <!-- 图片上传 -->
      <view class="form-item">
        <text class="label">图片（选填，最多3张）</text>
        <image-uploader
          v-model="form.images"
          :max-count="3"
          :show-cover-tag="false"
          tip="最多3张，支持 JPG、PNG 格式"
        />
      </view>

      <!-- 联系方式 -->
      <view class="form-item">
        <text class="label">联系方式（选填）</text>
        <input
          class="input"
          v-model="form.contact"
          type="text"
          placeholder="请输入您的手机号或邮箱"
          placeholder-style="color: var(--text-color-tertiary)"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button class="submit-btn" @click="handleSubmit">提交反馈</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeStyle } from '@/utils/theme'
import { ref, onMounted } from 'vue'
import commonApi from '@/api/common'
import { checkSensitiveWord, SensitiveCheckType } from '@/utils/sensitive-word'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import ImageUploader from '@/components/image-uploader/image-uploader.vue'
import { onShow } from '@dcloudio/uni-app'

// 启用服务页面导航（从服务页面进入时会自动处理返回逻辑）
useServiceNavigation()

const { themeStyle } = useThemeStyle()

// 页面进入动画状态
const isAnimated = ref(false)

// 触发页面进入动画

onShow(() => {
  useThemePage()
})

onMounted(() => {
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

const feedbackTypes = [
  { label: '功能异常', value: 'bug' },
  { label: '功能建议', value: 'suggestion' },
  { label: '其他问题', value: 'other' }
]

const form = ref({
  type: 'bug',
  title: '',
  content: '',
  images: [] as string[],
  contact: ''
})

/**
 * 验证手机号格式
 */
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 验证联系方式格式
 */
function validateContact(contact: string): boolean {
  if (!contact) return true // 选填，空值直接通过
  return isValidPhone(contact) || isValidEmail(contact)
}

async function handleSubmit() {
  // 验证问题描述
  if (!form.value.content.trim()) {
    uni.showToast({ title: '请输入问题描述', icon: 'none' })
    return
  }

  // 验证联系方式格式（如果填写了）
  if (form.value.contact && !validateContact(form.value.contact)) {
    uni.showToast({ title: '请输入正确的手机号或邮箱', icon: 'none' })
    return
  }

  // 检查标题和内容的敏感词
  const [titleCheck, contentCheck] = await Promise.all([
    checkSensitiveWord(form.value.title || '', SensitiveCheckType.COMMENT),
    checkSensitiveWord(form.value.content, SensitiveCheckType.COMMENT)
  ])

  // 如果包含禁止词，停止提交
  if (titleCheck && !titleCheck.passed) return
  if (contentCheck && !contentCheck.passed) return

  // 使用过滤后的内容
  const filteredTitle = titleCheck?.filteredContent || form.value.title
  const filteredContent = contentCheck?.filteredContent || form.value.content

  // 如果有敏感词被过滤，显示提示
  if (titleCheck?.hasSensitiveWord || contentCheck?.hasSensitiveWord) {
    uni.showToast({
      title: '已自动过滤敏感词',
      icon: 'none',
      duration: 1500
    })
  }

  const data = {
    type: form.value.type,
    title: filteredTitle || undefined,
    content: filteredContent,
    images: form.value.images.length > 0 ? form.value.images : undefined,
    contact: form.value.contact || undefined
  }

  commonApi.submitFeedback(data)
    .then(() => {
      uni.showToast({ title: '提交成功，感谢您的反馈', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    })
    .catch((error) => {
      const message = error?.message || '提交失败，请稍后重试'
      uni.showToast({ title: message, icon: 'none' })
    })
}
</script>

<style lang="scss" scoped>
// 页面进入动画关键帧
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 页面动画样式
.page-animate {
  opacity: 0;
  transform: translateY(30rpx);

  &.animate-in {
    animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}

.feedback-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

.form-section {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--bg-color-card);
  padding: 24rpx;
  margin-bottom: 16rpx;

  .form-item {
    position: relative;
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

    .type-list {
      display: flex;
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
      box-sizing: border-box;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      font-size: var(--font-size-base);
      line-height: 1.6;
    }

    .count {
      position: absolute;
      bottom: 0;
      right: 0;
      font-size: var(--font-size-sm);
      color: var(--text-color-tertiary);
    }

    .input {
      width: 100%;
      height: 88rpx;
      padding: 0 24rpx;
      box-sizing: border-box;
      background: var(--bg-color-page);
      border-radius: var(--spacing-sm);
      font-size: var(--font-size-base);
    }
  }
}

.submit-section {
  padding: 24rpx;
  box-sizing: border-box;
  overflow: hidden;

  .submit-btn {
    width: 100%;
    height: 88rpx;
    box-sizing: border-box;
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: var(--font-size-lg);
    border-radius: 12rpx;
    border: none;
  }
}
</style>
