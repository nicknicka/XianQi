<template>
  <view class="auth-student-card-upload">
    <text class="label">{{ label }}</text>
    <view
      class="upload-box"
      :class="{ uploading }"
      @click="emit('activate')"
    >
      <image
        v-if="modelValue"
        class="preview-image"
        :src="modelValue"
        mode="aspectFit"
      />
      <view v-else class="upload-placeholder">
        <uni-icons type="camera" :size="AUTH_ICON_SIZES.upload" :color="placeholderColor" />
        <text class="upload-text">{{ uploading ? '上传中...' : '点击上传' }}</text>
      </view>
    </view>
    <view v-if="modelValue" class="upload-actions">
      <view class="upload-action" @click.stop="emit('replace')">替换</view>
      <view class="upload-action delete-action" @click.stop="emit('remove')">删除</view>
    </view>
    <text v-if="error" class="upload-error">上传失败，请重试</text>
  </view>
</template>

<script setup lang="ts">
import { AUTH_ICON_SIZES } from '@/utils/auth/auth-tokens'
import { useThemeColors } from '@/utils/theme'

interface Props {
  modelValue: string
  label: string
  uploading?: boolean
  error?: boolean
}

withDefaults(defineProps<Props>(), {
  uploading: false,
  error: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'activate'): void
  (event: 'replace'): void
  (event: 'remove'): void
}>()

const { textColorTertiary } = useThemeColors()
const placeholderColor = textColorTertiary
</script>

<style lang="scss" scoped>
.auth-student-card-upload {
  margin-bottom: var(--auth-section-gap);

  .label {
    display: block;
    font-size: var(--font-size-base);
    color: var(--text-color-primary);
    margin-bottom: var(--auth-label-gap);
  }

  .upload-box {
    width: 100%;
    height: var(--auth-upload-height);
    background: var(--bg-color-page);
    border-radius: var(--auth-control-radius);
    overflow: hidden;

    .preview-image {
      width: 100%;
      height: 100%;
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;

      .upload-text {
        font-size: var(--font-size-sm);
        color: var(--text-color-tertiary);
        margin-top: var(--auth-label-gap);
      }
    }
  }

  .upload-actions {
    display: flex;
    gap: var(--auth-label-gap);
    margin-top: var(--auth-label-gap);
  }

  .upload-action {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--auth-control-height);
    background: var(--bg-color-page);
    color: var(--text-color-primary);
    font-size: var(--font-size-sm);
    border-radius: var(--auth-control-radius);
  }

  .delete-action {
    color: var(--danger-color);
  }

  .upload-error {
    display: block;
    margin-top: var(--auth-tip-gap);
    font-size: var(--font-size-sm);
    color: var(--danger-color);
  }
}
</style>
