<template>
  <view class="student-auth-page page-animate" :class="{ 'animate-in': isAnimated }" :style="themeStyle">
    <!-- 正在确认实名前置条件时不渲染表单，避免直接访问短暂绕过守卫。 -->
    <AuthStatusPanel
      v-if="statusLoading"
      class="page-status-panel"
      icon="loop"
      label="正在校验"
      description="正在确认实名认证状态"
      semantic-color="neutral"
    />

    <!-- 直接访问学生认证页时的实名前置守卫。 -->
    <AuthStatusPanel
      v-else-if="accessGuard.locked"
      class="page-status-panel"
      :icon="accessGuard.icon"
      :label="accessGuard.label"
      :description="accessGuard.description"
      :semantic-color="accessGuard.semanticColor"
    >
      <view class="locked-action" @click="goToRealNameAuth">
        <text>{{ accessGuard.actionLabel }}</text>
        <uni-icons type="right" :size="AUTH_ICON_SIZES.inline" :color="bgColorCard" />
      </view>
    </AuthStatusPanel>

    <!-- 学生认证状态：未认证、审核中、已认证、认证失败。 -->
    <AuthStatusPanel
      v-else
      class="page-status-panel"
      :icon="studentState.icon"
      :label="studentState.label"
      :description="studentState.description"
      :semantic-color="studentState.semanticColor"
    />

    <!-- 学生认证表单 -->
    <view v-if="!statusLoading && !accessGuard.locked && studentState.editable" class="form-section">
      <view class="form-title">学生认证信息</view>
      <view class="form-tip">请填写学生信息并上传学生证照片</view>

      <AuthFormField
        v-model="form.studentId"
        label="学号"
        placeholder="请输入学号"
      />

      <AuthFormField
        v-model="form.college"
        label="学院"
        placeholder="请输入学院"
      />

      <AuthFormField
        v-model="form.major"
        label="专业"
        placeholder="请输入专业"
      />

      <AuthStudentCardUpload
        v-for="side in studentCardSides"
        :key="side.key"
        v-model="form[side.key]"
        :label="side.label"
        :uploading="uploadingSide === side.key"
        :error="uploadError === side.key"
        @activate="handleUploadBoxClick(side.key)"
        @replace="uploadStudentCard(side.key)"
        @remove="removeStudentCard(side.key)"
      />

      <button
        class="submit-btn"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '提交认证' }}
      </button>

      <view class="security-tip">
        <uni-icons type="info" :size="AUTH_ICON_SIZES.inline" :color="textColorTertiary" />
        <text>请确保照片清晰，信息完整可见</text>
      </view>
    </view>

    <!-- 已认证信息 -->
    <view
      v-else-if="!statusLoading && !accessGuard.locked && studentState.pageStatus === 'verified' && verifiedInfo"
      class="info-section"
    >
      <view class="info-item">
        <text class="info-label">学号</text>
        <text class="info-value">{{ verifiedInfo.studentId }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">学院</text>
        <text class="info-value">{{ verifiedInfo.college }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">专业</text>
        <text class="info-value">{{ verifiedInfo.major }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">认证时间</text>
        <text class="info-value">{{ verifiedInfo.auditedAt || '-' }}</text>
      </view>
      <view class="info-images">
        <image
          v-for="imageUrl in verifiedStudentCardImages"
          :key="imageUrl"
          class="info-image"
          :src="imageUrl"
          mode="aspectFit"
          @click="previewImage([imageUrl], imageUrl)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePage, useThemeColors, useThemeStyle } from '@/utils/theme'
import { ref, computed, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { useUserStore } from '@/store/user'
import type { StudentAuth } from '@/types'
import validator from '@/utils/validator'
import { chooseImage as chooseStudentCardImage, uploadImage as uploadImageFile, previewImage } from '@/utils/image'
import { useServiceNavigation } from '@/composables/useServiceNavigation'
import { onShow } from '@dcloudio/uni-app'
import {
  resolveAuthState,
  resolveStudentAuthAccessState,
  type AuthenticationState
} from '@/utils/auth/auth-state'
import AuthStatusPanel from '@/components/auth/AuthStatusPanel.vue'
import AuthFormField from '@/components/auth/AuthFormField.vue'
import AuthStudentCardUpload from '@/components/auth/AuthStudentCardUpload.vue'
import {
  AUTH_ICON_SIZES,
  AUTH_PAGE_ANIMATION_DELAY_MS
} from '@/utils/auth/auth-tokens'

type StudentCardSide = 'frontImage' | 'backImage'

const userStore = useUserStore()
useServiceNavigation()
const { textColorTertiary, bgColorCard } = useThemeColors()
const { themeStyle } = useThemeStyle()

const studentCardSides = [
  { key: 'frontImage' as const, label: '学生证正面' },
  { key: 'backImage' as const, label: '学生证反面' }
]

const isAnimated = ref(false)
const statusLoading = ref(true)
const submitting = ref(false)
const uploadingSide = ref<StudentCardSide | null>(null)
const uploadError = ref<StudentCardSide | null>(null)
const realNameState = ref<AuthenticationState>(resolveAuthState('real-name'))
const studentState = ref<AuthenticationState>(resolveAuthState('student'))
const verifiedInfo = ref<StudentAuth | null>(null)

const form = ref({
  studentId: '',
  college: '',
  major: '',
  frontImage: '',
  backImage: ''
})

/** 直接访问和认证中心都复用同一学生锁定模型，保证前置规则只有一处。 */
const accessGuard = computed(() =>
  resolveStudentAuthAccessState(studentState.value, realNameState.value)
)

const verifiedStudentCardImages = computed(() =>
  [verifiedInfo.value?.studentCardImages?.[0], verifiedInfo.value?.studentCardImages?.[1]].filter(
    (imageUrl): imageUrl is string => Boolean(imageUrl)
  )
)

onShow(() => {
  useThemePage()
})

onMounted(() => {
  loadVerificationStatus()

  setTimeout(() => {
    isAnimated.value = true
  }, AUTH_PAGE_ANIMATION_DELAY_MS)
})

async function loadVerificationStatus() {
  statusLoading.value = true

  try {
    const realNameRes = await userApi.getRealNameAuth()
    realNameState.value = resolveAuthState('real-name', realNameRes.data?.status, {
      rejectReason: realNameRes.data?.rejectReason
    })
  } catch (error) {
    console.error('加载实名认证状态失败:', error)
    realNameState.value = resolveAuthState('real-name')
  }

  if (realNameState.value.pageStatus !== 'verified') {
    statusLoading.value = false
    return
  }

  try {
    const studentRes = await userApi.getStudentAuth()
    const auth = studentRes.data
    studentState.value = resolveAuthState('student', auth?.status, {
      rejectReason: auth?.rejectReason
    })
    verifiedInfo.value = auth ?? null

    if (auth?.status === 3) {
      form.value.studentId = auth.studentId || ''
      form.value.college = auth.college || ''
      form.value.major = auth.major || ''
      form.value.frontImage = auth.studentCardImages?.[0] || ''
      form.value.backImage = auth.studentCardImages?.[1] || ''
    }

    if (studentState.value.pageStatus === 'verified') {
      await refreshUserInfo()
    }
  } catch (error) {
    console.error('加载学生认证状态失败:', error)
  } finally {
    statusLoading.value = false
  }
}

function goToRealNameAuth() {
  uni.navigateTo({ url: '/pages/mine/real-name-auth' })
}

function handleUploadBoxClick(side: StudentCardSide) {
  if (uploadingSide.value) {
    return
  }

  if (!form.value[side]) {
    uploadStudentCard(side)
    return
  }

  previewImage([form.value[side]], form.value[side])
}

async function uploadStudentCard(side: StudentCardSide) {
  if (uploadingSide.value) {
    return
  }

  uploadingSide.value = side
  uploadError.value = null

  try {
    const paths = await chooseStudentCardImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })
    const result = await uploadImageFile(paths[0])
    form.value[side] = result.url
    uni.showToast({ title: '上传成功', icon: 'success' })
  } catch (error) {
    if (!isImageSelectionCancelled(error)) {
      console.error('上传学生证图片失败:', error)
      uploadError.value = side
    }
  } finally {
    uploadingSide.value = null
  }
}

function removeStudentCard(side: StudentCardSide) {
  form.value[side] = ''
  uploadError.value = null
}

function isImageSelectionCancelled(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('errMsg' in error)) {
    return false
  }

  const message = (error as { errMsg?: unknown }).errMsg
  return typeof message === 'string' && message.includes('cancel')
}

async function handleSubmit() {
  if (submitting.value || !studentState.value.editable || accessGuard.value.locked) {
    return
  }

  const studentId = form.value.studentId.trim()
  const college = form.value.college.trim()
  const major = form.value.major.trim()

  if (!studentId) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return
  }
  if (!validator.isStudentId(studentId)) {
    uni.showToast({ title: '学号格式不正确', icon: 'none' })
    return
  }
  if (!college) {
    uni.showToast({ title: '请输入学院', icon: 'none' })
    return
  }
  if (!major) {
    uni.showToast({ title: '请输入专业', icon: 'none' })
    return
  }
  if (!form.value.frontImage) {
    uni.showToast({ title: '请上传学生证正面', icon: 'none' })
    return
  }
  if (!form.value.backImage) {
    uni.showToast({ title: '请上传学生证反面', icon: 'none' })
    return
  }

  submitting.value = true

  try {
    await userApi.verifyStudent({
      studentId,
      college,
      major,
      studentCardImages: [form.value.frontImage, form.value.backImage]
    })

    studentState.value = resolveAuthState('student', 1)
    verifiedInfo.value = null
    uni.showToast({ title: '提交成功，请等待审核', icon: 'success' })
    await refreshUserInfo()
  } catch (error) {
    console.error('[StudentAuth] 提交认证失败:', error)
  } finally {
    submitting.value = false
  }
}

async function refreshUserInfo() {
  try {
    const res = await userApi.getUserInfo()
    if (res.data) {
      userStore.setUserInfo(res.data)
    }
  } catch (error) {
    console.error('[StudentAuth] 刷新用户信息失败:', error)
  }
}
</script>

<style lang="scss" scoped>
@keyframes pageSlideInUp {
  from {
    opacity: 0;
    transform: translateY(var(--motion-distance-page));
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-animate {
  opacity: 0;
  transform: translateY(var(--motion-distance-page));

  &.animate-in {
    animation: pageSlideInUp var(--motion-duration-base) var(--motion-ease-standard) forwards;
  }
}

.student-auth-page {
  min-height: var(--auth-page-min-height);
  background: var(--bg-color-page);
  padding: var(--auth-page-padding);
  padding-bottom: calc(var(--auth-page-padding) + env(safe-area-inset-bottom));
}

.page-status-panel {
  animation: pageSlideInUp var(--motion-duration-slow) var(--motion-ease-standard) forwards;
  animation-delay: var(--motion-delay-fast);
  opacity: 0;
}

.locked-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--auth-tip-gap);
  width: 100%;
  height: var(--auth-control-height);
  margin-top: var(--auth-section-gap);
  background: var(--primary-color);
  color: var(--bg-color-card);
  font-size: var(--font-size-base);
  border-radius: var(--auth-control-radius);
}

.form-section {
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  padding: var(--auth-card-padding);

  .form-title {
    font-size: var(--font-size-lg);
    font-weight: var(--auth-font-weight-semibold);
    color: var(--text-color-primary);
    margin-bottom: var(--auth-tip-gap);
  }

  .form-tip {
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
    margin-bottom: var(--auth-section-gap);
  }


  .submit-btn {
    width: 100%;
    height: var(--auth-control-height);
    background: var(--primary-color);
    color: var(--bg-color-card);
    font-size: var(--font-size-lg);
    border-radius: var(--auth-control-radius);
    border: none;
    margin-top: var(--auth-card-padding);
  }

  .security-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--auth-tip-gap);
    margin-top: var(--auth-section-gap);
    font-size: var(--font-size-sm);
    color: var(--text-color-tertiary);
  }
}

.info-section {
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  padding: var(--auth-card-padding);

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: var(--auth-section-gap) 0;
    border-bottom: var(--auth-divider-width) solid var(--border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: var(--font-size-base);
      color: var(--text-color-tertiary);
    }

    .info-value {
      font-size: var(--font-size-base);
      color: var(--text-color-primary);
    }
  }

  .info-images {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--auth-label-gap);
    padding-top: var(--auth-section-gap);
  }

  .info-image {
    width: 100%;
    height: var(--auth-upload-height);
    border-radius: var(--auth-control-radius);
  }
}
</style>
