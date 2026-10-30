<template>
  <view class="auth-form-field" :class="{ 'has-error': Boolean(error), 'is-success': success && !error }">
    <text class="label">{{ label }}</text>
    <input
      class="input"
      v-model="fieldValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :adjust-position="true"
      :cursor-spacing="AUTH_INPUT_CURSOR_SPACING_PX"
      placeholder-style="color: var(--text-color-tertiary)"
      @blur="emit('blur')"
    />
    <text v-if="error" class="message error-message">{{ error }}</text>
    <text v-else-if="success" class="message success-message">{{ success }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AUTH_INPUT_CURSOR_SPACING_PX } from '@/utils/auth/auth-tokens'

interface Props {
  modelValue: string
  label: string
  placeholder: string
  maxlength?: number
  error?: string
  success?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxlength: undefined,
  error: '',
  success: ''
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'blur'): void
}>()

const fieldValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})
</script>

<style lang="scss" scoped>
.auth-form-field {
  margin-bottom: var(--auth-section-gap);

  .label {
    display: block;
    font-size: var(--font-size-base);
    color: var(--text-color-primary);
    margin-bottom: var(--auth-label-gap);
  }

  .input {
    width: 100%;
    height: var(--auth-control-height);
    padding: 0 var(--auth-control-padding-x);
    background: var(--bg-color-page);
    border-radius: var(--auth-control-radius);
    font-size: var(--font-size-base);
  }

  &.has-error .input {
    border: var(--auth-divider-width) solid var(--danger-color);
  }

  &.is-success .input {
    border: var(--auth-divider-width) solid var(--success-color);
  }

  .message {
    display: block;
    margin-top: var(--auth-tip-gap);
    font-size: var(--font-size-sm);
  }

  .error-message {
    color: var(--danger-color);
  }

  .success-message {
    color: var(--success-color);
  }
}
</style>
