<template>
  <view class="steps" :class="[`direction-${direction}`, `size-${size}`, customClass]" :style="customStyle">
    <view
      v-for="(step, index) in steps"
      :key="index"
      class="step-item"
      :class="{
        'is-active': currentStep === index,
        'is-finished': currentStep > index,
        'is-process': currentStep === index,
        'is-wait': currentStep < index
      }"
    >
      <!-- 步骤图标 -->
      <view class="step-icon-wrapper">
        <view v-if="currentStep > index" class="step-icon finished-icon">
          <text class="icon-text">✓</text>
        </view>
        <view v-else-if="currentStep === index" class="step-icon active-icon">
          <text v-if="step.icon" class="icon-text">{{ step.icon }}</text>
          <text v-else class="icon-number">{{ index + 1 }}</text>
        </view>
        <view v-else class="step-icon wait-icon">
          <text class="icon-number">{{ index + 1 }}</text>
        </view>
      </view>

      <!-- 步骤内容 -->
      <view class="step-content">
        <text v-if="step.title" class="step-title">{{ step.title }}</text>
        <text v-if="step.description" class="step-description">{{ step.description }}</text>
      </view>

      <!-- 连接线 -->
      <view v-if="index < steps.length - 1" class="step-line" :class="{ 'is-active': currentStep > index }">
        <view class="line-inner"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface StepItem {
  /** 标题 */
  title: string
  /** 描述 */
  description?: string
  /** 图标 */
  icon?: string
  /** 状态 */
  status?: 'wait' | 'process' | 'finish' | 'error'
}

interface Props {
  /** 步骤数据 */
  steps: StepItem[]
  /** 当前步骤 */
  currentStep?: number
  /** 方向 */
  direction?: 'horizontal' | 'vertical'
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  currentStep: 0,
  direction: 'horizontal',
  size: 'medium'
})
</script>

<script lang="ts">
export default {
  name: 'Steps',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.steps {
  display: flex;

  &.direction-horizontal {
    flex-direction: row;
    align-items: flex-start;

    .step-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;

      &:not(:last-child) {
        .step-line {
          position: absolute;
          top: 32rpx;
          left: calc(50% + 32rpx);
          right: calc(-50% + 32rpx);
          height: 2rpx;
          background: var(--border-color-base);

          .line-inner {
            width: 0;
            height: 100%;
            background: $primary-color;
            transition: width 0.3s;
          }

          &.is-active {
            .line-inner {
              width: 100%;
            }
          }
        }
      }
    }

    .step-content {
      margin-top: 16rpx;
      text-align: center;
    }
  }

  &.direction-vertical {
    flex-direction: column;
    width: 100%;

    .step-item {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      padding: 16rpx 0;

      &:not(:last-child) {
        .step-line {
          position: absolute;
          left: 32rpx;
          top: 80rpx;
          bottom: -16rpx;
          width: 2rpx;
          background: var(--border-color-base);

          .line-inner {
            width: 100%;
            height: 0;
            background: $primary-color;
            transition: height 0.3s;
          }

          &.is-active {
            .line-inner {
              height: 100%;
            }
          }
        }
      }
    }

    .step-content {
      flex: 1;
      margin-left: 24rpx;
      text-align: left;
    }
  }

  // 图标尺寸
  &.size-small {
    .step-icon-wrapper {
      width: 48rpx;
      height: 48rpx;
    }

    .step-icon {
      width: 48rpx;
      height: 48rpx;

      .icon-text,
      .icon-number {
        font-size: 24rpx;
      }
    }

    .step-title {
      font-size: 24rpx;
    }

    .step-description {
      font-size: 22rpx;
    }
  }

  &.size-medium {
    .step-icon-wrapper {
      width: 64rpx;
      height: 64rpx;
    }

    .step-icon {
      width: 64rpx;
      height: 64rpx;

      .icon-text,
      .icon-number {
        font-size: 28rpx;
      }
    }

    .step-title {
      font-size: 28rpx;
    }

    .step-description {
      font-size: 24rpx;
    }
  }

  &.size-large {
    .step-icon-wrapper {
      width: 80rpx;
      height: 80rpx;
    }

    .step-icon {
      width: 80rpx;
      height: 80rpx;

      .icon-text,
      .icon-number {
        font-size: 32rpx;
      }
    }

    .step-title {
      font-size: 32rpx;
    }

    .step-description {
      font-size: 26rpx;
    }
  }

  .step-item {
    &.is-wait {
      .step-icon {
        background: var(--bg-color-disabled);
        border: 2rpx solid #e5e5e5;

        .icon-number {
          color: var(--text-color-tertiary);
        }
      }

      .step-title {
        color: var(--text-color-tertiary);
      }
    }

    &.is-process {
      .step-icon.active-icon {
        background: $primary-color;
        border-color: $primary-color;

        .icon-text,
        .icon-number {
          color: var(--text-color-inverse);
        }
      }

      .step-title {
        color: $primary-color;
        font-weight: 600;
      }
    }

    &.is-finished {
      .step-icon {
        background: $primary-color;
        border-color: $primary-color;

        .icon-text {
          color: var(--text-color-inverse);
        }
      }

      .step-title {
        color: var(--text-color-primary);
      }
    }

    .step-icon-wrapper {
      position: relative;
      z-index: 1;
    }

    .step-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: 600;
      transition: all 0.3s;

      .icon-text,
      .icon-number {
        line-height: 1;
      }
    }

    .step-content {
      .step-title {
        display: block;
        line-height: 1.4;
        margin-bottom: 4rpx;
      }

      .step-description {
        display: block;
        color: var(--text-color-tertiary);
        line-height: 1.4;
      }
    }
  }
}
</style>
