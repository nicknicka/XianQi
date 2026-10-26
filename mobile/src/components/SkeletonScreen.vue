<template>
  <view class="skeleton-wrapper" :class="{ 'skeleton-loading': loading }">
    <!-- 骨架屏内容 -->
    <slot name="skeleton">
      <!-- 默认骨架屏 - 卡片列表 -->
      <view v-if="type === 'card'" class="skeleton-card">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-content">
          <view class="skeleton-title"></view>
          <view class="skeleton-text"></view>
          <view class="skeleton-text short"></view>
        </view>
      </view>

      <!-- 列表骨架屏 -->
      <view v-else-if="type === 'list'" class="skeleton-list">
        <view v-for="i in rowCount" :key="i" class="skeleton-list-item">
          <view class="skeleton-list-image"></view>
          <view class="skeleton-list-content">
            <view class="skeleton-title"></view>
            <view class="skeleton-text"></view>
            <view class="skeleton-text short"></view>
          </view>
        </view>
      </view>

      <!-- 详情骨架屏 -->
      <view v-else-if="type === 'detail'" class="skeleton-detail">
        <view class="skeleton-detail-image"></view>
        <view class="skeleton-detail-content">
          <view class="skeleton-title"></view>
          <view class="skeleton-text"></view>
          <view class="skeleton-text"></view>
          <view class="skeleton-text short"></view>
        </view>
      </view>

      <!-- 用户信息骨架屏 -->
      <view v-else-if="type === 'user'" class="skeleton-user">
        <view class="skeleton-avatar large"></view>
        <view class="skeleton-user-content">
          <view class="skeleton-title center"></view>
          <view class="skeleton-text center"></view>
        </view>
      </view>

      <!-- 网格骨架屏 -->
      <view v-else-if="type === 'grid'" class="skeleton-grid">
        <view v-for="i in gridCount" :key="i" class="skeleton-grid-item">
          <view class="skeleton-grid-icon"></view>
          <view class="skeleton-text center"></view>
        </view>
      </view>

      <!-- 自定义骨架屏 -->
      <view v-else-if="type === 'custom'" class="skeleton-custom">
        <slot></slot>
      </view>
    </slot>

    <!-- 实际内容 -->
    <slot v-if="!loading" name="default"></slot>
  </view>
</template>

<script setup lang="ts">
interface Props {
  loading?: boolean
  type?: 'card' | 'list' | 'detail' | 'user' | 'grid' | 'custom'
  rowCount?: number
  gridCount?: number
}

withDefaults(defineProps<Props>(), {
  loading: true,
  type: 'card',
  rowCount: 3,
  gridCount: 4
})
</script>

<style lang="scss" scoped>
.skeleton-wrapper {
  position: relative;
  min-height: 100rpx;

  &.skeleton-loading {
    // 骨架屏显示时隐藏实际内容
    :deep(> slot:not([name="skeleton"])) {
      display: none;
    }
  }
}

/* 闪烁动画 */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 骨架屏基础样式 */
[class^='skeleton-'],
[class*=' skeleton-'] {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8rpx;
}

/* 卡片骨架 */
.skeleton-card {
  display: flex;
  padding: 24rpx;
  background: var(--bg-color-card);
  border-radius: 16rpx;
  gap: 20rpx;
}

.skeleton-avatar {
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-title {
  width: 60%;
  height: 32rpx;
}

.skeleton-text {
  width: 100%;
  height: 24rpx;

  &.short {
    width: 40%;
  }

  &.center {
    margin: 0 auto;
  }
}

/* 列表骨架 */
.skeleton-list {
  padding: 24rpx;
}

.skeleton-list-item {
  display: flex;
  padding: 20rpx;
  margin-bottom: 20rpx;
  background: var(--bg-color-card);
  border-radius: 16rpx;
  gap: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.skeleton-list-image {
  flex-shrink: 0;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 8rpx;
}

/* 详情骨架 */
.skeleton-detail {
  padding: 24rpx;
}

.skeleton-detail-image {
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.skeleton-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 用户信息骨架 */
.skeleton-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx;
}

.skeleton-avatar.large {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 24rpx;
}

.skeleton-user-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

/* 网格骨架 */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
  padding: 24rpx;
}

.skeleton-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.skeleton-grid-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
}

/* 自定义骨架 */
.skeleton-custom {
  padding: 24rpx;
}

/* 空状态占位 */
.skeleton-empty {
  width: 100%;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-disabled);
  border-radius: 12rpx;
  color: var(--text-color-tertiary);
  font-size: 24rpx;
}
</style>
