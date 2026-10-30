<template>
  <view class="auth-status-panel" :class="'status-' + semanticColor">
    <uni-icons :type="icon" :size="AUTH_ICON_SIZES.status" :color="iconColor" />
    <text class="status-text">{{ label }}</text>
    <text class="status-desc">{{ description }}</text>
    <slot name="action" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AUTH_ICON_SIZES } from '@/utils/auth/auth-tokens'
import { useAuthSemanticColors, type AuthPanelSemanticColor } from '@/utils/auth/auth-theme'

export type AuthStatusIcon = 'info' | 'clock' | 'checkmarkempty' | 'closeempty' | 'locked' | 'loop'

interface Props {
  icon: AuthStatusIcon
  label: string
  description: string
  semanticColor: AuthPanelSemanticColor
}

const props = defineProps<Props>()
const semanticColors = useAuthSemanticColors()
const iconColor = computed(() => semanticColors[props.semanticColor])
</script>

<style lang="scss" scoped>
.auth-status-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--auth-card-padding-lg);
  background: var(--bg-color-card);
  border-radius: var(--auth-card-radius);
  margin-bottom: var(--auth-section-gap);

  .status-text {
    font-size: var(--font-size-xl);
    font-weight: var(--auth-font-weight-semibold);
    color: var(--auth-status-color);
    margin: var(--auth-section-gap) 0 var(--auth-label-gap);
  }

  .status-desc {
    font-size: var(--font-size-base);
    color: var(--text-color-tertiary);
    text-align: center;
  }
}

.status-info {
  --auth-status-color: var(--info-color);
}

.status-primary {
  --auth-status-color: var(--primary-color);
}

.status-success {
  --auth-status-color: var(--success-color);
}

.status-danger {
  --auth-status-color: var(--danger-color);
}

.status-neutral {
  --auth-status-color: var(--text-color-tertiary);
}
</style>
