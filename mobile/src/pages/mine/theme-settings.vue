<template>
  <view class="theme-settings-page" :style="themeStyle">

    <scroll-view class="content" scroll-y>
      <!-- 主题颜色自定义 -->
      <view class="section">
        <view class="section-title">
          <text class="title-text">自定义主题色</text>
          <text class="title-desc">调整你喜欢的颜色</text>
        </view>

        <!-- 主要颜色 -->
        <view class="color-group">
          <text class="color-group-title">主要颜色</text>
          <view class="color-inputs">
            <view class="color-item">
              <text class="color-label">主色</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.primaryColor"
                  @input="updateColor('primaryColor', $event.detail.value)"
                  placeholder="#8EC5E8"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.primaryColor }"
                  @click="showColorPicker('primaryColor')"
                ></view>
              </view>
            </view>
            <view class="color-item">
              <text class="color-label">浅色</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.primaryColorLight"
                  @input="updateColor('primaryColorLight', $event.detail.value)"
                  placeholder="#B8D4E8"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.primaryColorLight }"
                  @click="showColorPicker('primaryColorLight')"
                ></view>
              </view>
            </view>
            <view class="color-item">
              <text class="color-label">深色</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.primaryColorDark"
                  @input="updateColor('primaryColorDark', $event.detail.value)"
                  placeholder="#6AA8CC"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.primaryColorDark }"
                  @click="showColorPicker('primaryColorDark')"
                ></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 次要颜色 -->
        <view class="color-group">
          <text class="color-group-title">次要颜色</text>
          <view class="color-inputs">
            <view class="color-item">
              <text class="color-label">次色</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.secondaryColor"
                  @input="updateColor('secondaryColor', $event.detail.value)"
                  placeholder="#B8D4E8"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.secondaryColor }"
                  @click="showColorPicker('secondaryColor')"
                ></view>
              </view>
            </view>
            <view class="color-item">
              <text class="color-label">强调色</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.accentColor"
                  @input="updateColor('accentColor', $event.detail.value)"
                  placeholder="#FFD93D"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.accentColor }"
                  @click="showColorPicker('accentColor')"
                ></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 背景颜色 -->
        <view class="color-group">
          <text class="color-group-title">背景颜色</text>
          <view class="color-inputs">
            <view class="color-item">
              <text class="color-label">页面背景</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.backgroundColor"
                  @input="updateColor('backgroundColor', $event.detail.value)"
                  placeholder="#F0F8FF"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.backgroundColor }"
                  @click="showColorPicker('backgroundColor')"
                ></view>
              </view>
            </view>
            <view class="color-item">
              <text class="color-label">卡片背景</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.bgCard"
                  @input="updateColor('bgCard', $event.detail.value)"
                  placeholder="#FFFFFF"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.bgCard }"
                  @click="showColorPicker('bgCard')"
                ></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 文字颜色 -->
        <view class="color-group">
          <text class="color-group-title">文字颜色</text>
          <view class="color-inputs">
            <view class="color-item">
              <text class="color-label">主要文字</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.textPrimary"
                  @input="updateColor('textPrimary', $event.detail.value)"
                  placeholder="#2D2D2D"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.textPrimary }"
                  @click="showColorPicker('textPrimary')"
                ></view>
              </view>
            </view>
            <view class="color-item">
              <text class="color-label">次要文字</text>
              <view class="color-picker">
                <input
                  class="color-input"
                  type="text"
                  :value="preferences.textSecondary"
                  @input="updateColor('textSecondary', $event.detail.value)"
                  placeholder="#7A7A7A"
                />
                <view
                  class="color-preview"
                  :style="{ background: preferences.textSecondary }"
                  @click="showColorPicker('textSecondary')"
                ></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 预设主题选择 -->
      <view class="section">
        <view class="section-title">
          <text class="title-text">快速选择预设</text>
          <text class="title-desc">或在上面自定义</text>
        </view>
        <view class="preset-grid">
          <view
            v-for="preset in presetList"
            :key="preset.id"
            :class="['preset-card', { active: pendingPresetId === preset.id }]"
            @click="applyPreset(preset)"
          >
            <!-- 颜色预览条 -->
            <view class="preset-colors">
              <view class="color-main" :style="{ background: preset.colors.primaryColor }"></view>
              <view class="color-secondary" :style="{ background: preset.colors.secondaryColor }"></view>
              <view class="color-accent" :style="{ background: preset.colors.accentColor }"></view>
              <view class="color-bg" :style="{ background: preset.colors.backgroundColor }"></view>
            </view>
            <!-- 主题信息 -->
            <view class="preset-info">
              <text class="preset-emoji">{{ preset.emoji }}</text>
              <text class="preset-name">{{ preset.name }}</text>
              <text class="preset-desc">{{ preset.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 字体大小 -->
      <view class="section">
        <view class="section-title">
          <text class="title-text">字体大小</text>
          <text class="scale-value">{{ Math.round(fontSizeScale * 100) }}%</text>
        </view>
        <view class="size-options">
          <view
            v-for="option in fontSizeOptions"
            :key="option.scale"
            :class="['size-item', { active: fontSizeScale === option.scale }]"
            @click="handleUpdateFontSizeScale(option.scale)"
          >
            {{ option.label }}
          </view>
        </view>
      </view>

      <!-- 预览区域 -->
      <view class="section preview-section">
        <view class="section-title">
          <text class="title-text">效果预览</text>
        </view>
        <view class="preview-card">
          <view class="preview-header">
            <text class="preview-title">标题文字</text>
            <text class="preview-subtitle">副标题文字</text>
          </view>
          <text class="preview-content">这是一段普通文字内容，用于预览当前主题设置的效果。切换不同主题可以看到实时变化哦~</text>
          <view class="preview-tags">
            <view class="preview-tag tag-primary">标签一</view>
            <view class="preview-tag tag-accent">标签二</view>
          </view>
          <view class="preview-buttons">
            <button class="preview-btn primary">主要按钮</button>
            <button class="preview-btn secondary">次要按钮</button>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="section">
        <view class="action-buttons">
          <button class="action-btn save-btn" @click="saveTheme">保存主题</button>
          <button class="action-btn reset-btn" @click="handleResetTheme">重置主题</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { themeManager, useThemeStyle, useThemePage } from '@/utils/theme'
import { cuteThemePresetList } from '@/utils/theme-presets'
import { useReactiveUserPreferences } from '@/utils/user-preferences'
import type { UserStylePreferences } from '@/utils/user-preferences'
import { onShow } from '@dcloudio/uni-app'

const fontSizeScale = ref(1.0)
const pendingPresetId = ref<string | null>(null)
const presetList = cuteThemePresetList

const fontSizeOptions = ref([
  { scale: 0.85, label: '小' },
  { scale: 1.0, label: '标准' },
  { scale: 1.15, label: '大' }
])

const { themeStyle } = useThemeStyle()
const { preferences, updatePreferences } = useReactiveUserPreferences()

onShow(() => {
  useThemePage()
  // 同步 pendingPresetId 为当前已应用的主题（用户未保存则丢弃）
  pendingPresetId.value = themeManager.getPresetId()
})

onMounted(() => {
  fontSizeScale.value = themeManager.getFontSizeScale()
  pendingPresetId.value = themeManager.getPresetId()
})

const removeListener = themeManager.addListener(() => {
  fontSizeScale.value = themeManager.getFontSizeScale()
})

onUnmounted(() => {
  removeListener?.()
})

// 更新颜色
function updateColor(key: keyof UserStylePreferences, value: string) {
  if (!value.startsWith('#')) {
    value = '#' + value.replace('#', '')
  }
  updatePreferences({ [key]: value })
}

// 显示颜色选择器（暂时使用简单的输入框，实际项目中可以集成颜色选择器组件）
function showColorPicker(key: keyof UserStylePreferences) {
  // 这里可以集成颜色选择器组件
  uni.showToast({
    title: '点击输入框编辑颜色',
    icon: 'none'
  })
}

// 应用预设主题
function applyPreset(preset: any, immediate = false) {
  pendingPresetId.value = preset.id

  // 保存用户偏好（供主题设置页面回显）
  const themeConfig: UserStylePreferences = {
    primaryColor: preset.colors.primaryColor,
    primaryColorLight: preset.colors.primaryColorLight,
    primaryColorDark: preset.colors.primaryColorDark,
    secondaryColor: preset.colors.secondaryColor,
    accentColor: preset.colors.accentColor,
    backgroundColor: preset.colors.backgroundColor,
    successColor: preset.colors.successColor,
    warningColor: preset.colors.warningColor,
    dangerColor: preset.colors.dangerColor,
    infoColor: preset.colors.infoColor,
    textPrimary: preset.colors.textPrimary,
    textSecondary: preset.colors.textSecondary,
    textTertiary: preset.colors.textTertiary,
    bgPage: preset.colors.backgroundColor,
    bgCard: '#FFFFFF',
    bgWarm: preset.colors.backgroundColor,
    bgDisabled: '#F5F5F5',
    borderLight: '#F0F0F0',
    borderBase: '#E8E8E8',
    borderDark: '#BFBFBF'
  }
  updatePreferences(themeConfig)

  if (immediate) {
    // 立即应用（重置场景，用户已确认）
    themeManager.switchPreset(preset.id)
    uni.showToast({
      title: `已应用 ${preset.name} 主题`,
      icon: 'success'
    })
  } else {
    // 等待用户点击保存
    uni.showToast({
      title: `已选择 ${preset.name}，点击保存生效`,
      icon: 'none'
    })
  }
}

// 保存主题
function saveTheme() {
  if (pendingPresetId.value) {
    themeManager.switchPreset(pendingPresetId.value)
  } else {
    themeManager.applyTheme()
  }
  uni.showToast({
    title: '主题已保存',
    icon: 'success'
  })
}

function handleUpdateFontSizeScale(scale: number) {
  themeManager.updateFontSizeScale(scale)
}

function handleResetTheme() {
  uni.showModal({
    title: '重置主题',
    content: '确定要重置为默认主题（焦糖可可）吗？',
    success: (res) => {
      if (res.confirm) {
        const defaultTheme = presetList.find(p => p.id === 'caramel-cocoa')
        if (defaultTheme) {
          applyPreset(defaultTheme, true)
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables.scss' as *;

.theme-settings-page {
  min-height: 100vh;
  background: var(--bg-color-page);
}

.content {
  padding: 16rpx;
}

.section {
  background: var(--bg-color-card);
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--box-shadow-card);
}

.section-title {
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title-text {
    font-size: 17px;
    font-weight: $font-weight-semibold;
    color: var(--text-color-primary);
  }

  .title-desc {
    font-size: 12px;
    color: var(--text-color-tertiary);
  }

  .scale-value {
    font-size: 14px;
    color: var(--text-color-secondary);
    font-weight: $font-weight-normal;
  }
}

/* ============ 主题预设卡片 ============ */

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.preset-card {
  position: relative;
  background: var(--bg-color-page);
  border-radius: 16rpx;
  padding: 20rpx;
  border: 3rpx solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;

  &.active {
    border-color: var(--primary-color);
    background: var(--bg-color-card);
    box-shadow: var(--box-shadow-primary);
  }

  &:active {
    transform: scale(0.97);
  }
}

.preset-colors {
  display: flex;
  height: 48rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 16rpx;

  .color-main {
    flex: 2;
  }

  .color-secondary {
    flex: 1.5;
  }

  .color-accent {
    flex: 1;
  }

  .color-bg {
    flex: 2;
  }
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.preset-emoji {
  font-size: 20px;
}

.preset-name {
  font-size: 14px;
  font-weight: $font-weight-semibold;
  color: var(--text-color-primary);
}

.preset-desc {
  font-size: 11px;
  color: var(--text-color-tertiary);
}

.preset-check {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 40rpx;
  height: 40rpx;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  .check-icon {
    color: #fff;
    font-size: 12px;
    font-weight: bold;
  }
}

/* ============ 字体大小 ============ */

.size-options {
  display: flex;
  gap: 12rpx;
}

.size-item {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-page);
  border-radius: 9999px;
  font-size: 14px;
  color: var(--text-color-primary);
  border: 2rpx solid transparent;
  transition: all 0.3s ease;

  &.active {
    background: var(--primary-color);
    color: #fff;
    border-color: var(--primary-color);
    box-shadow: var(--box-shadow-primary);
  }

  &:active {
    transform: scale(0.97);
  }
}

/* ============ 预览区域 ============ */

.preview-card {
  background: var(--bg-color-warm);
  border-radius: 20rpx;
  padding: 28rpx;
  border: 2rpx solid var(--border-color-light);

  .preview-header {
    margin-bottom: 16rpx;

    .preview-title {
      display: block;
      font-size: 18px;
      font-weight: $font-weight-semibold;
      color: var(--text-color-primary);
      margin-bottom: 8rpx;
    }

    .preview-subtitle {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }

  .preview-content {
    display: block;
    font-size: 14px;
    color: var(--text-color-secondary);
    line-height: 1.6;
    margin-bottom: 20rpx;
  }

  .preview-tags {
    display: flex;
    gap: 12rpx;
    margin-bottom: 20rpx;
  }

  .preview-tag {
    padding: 6rpx 20rpx;
    border-radius: 9999px;
    font-size: 12px;

    &.tag-primary {
      background: var(--primary-color-faded);
      color: var(--primary-color);
    }

    &.tag-accent {
      background: var(--primary-color-faded);
      color: var(--accent-color);
    }
  }

  .preview-buttons {
    display: flex;
    gap: 16rpx;

    .preview-btn {
      flex: 1;
      height: 72rpx;
      line-height: 72rpx;
      border-radius: 9999px;
      font-size: 14px;
      text-align: center;
      border: none;
      transition: all 0.15s ease;

      &:active {
        transform: scale(0.97);
      }

      &.primary {
        background: var(--primary-color);
        color: #fff;
        box-shadow: var(--box-shadow-primary);
      }

      &.secondary {
        background: var(--bg-color-card);
        color: var(--text-color-primary);
        border: 2rpx solid var(--border-color-base);
      }
    }
  }
}

/* ============ 重置按钮 ============ */

.reset-btn {
  width: 100%;
  height: 80rpx;
  background: var(--bg-color-page);
  color: var(--text-color-secondary);
  font-size: 14px;
  border-radius: 9999px;
  border: none;
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.97);
  }
}

/* ============ 颜色自定义 ============ */

.color-group {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.color-group-title {
  font-size: 16px;
  font-weight: $font-weight-semibold;
  color: var(--text-color-primary);
  margin-bottom: 16rpx;
  display: block;
}

.color-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.color-label {
  font-size: 14px;
  color: var(--text-color-secondary);
  font-weight: $font-weight-normal;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: var(--bg-color-page);
  border-radius: 12rpx;
  padding: 12rpx 16rpx;
  border: 2rpx solid var(--border-color-light);
}

.color-input {
  flex: 1;
  font-size: 14px;
  color: var(--text-color-primary);
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Courier New', monospace;
}

.color-preview {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  border: 2rpx solid var(--border-color-base);
  cursor: pointer;
  flex-shrink: 0;
}

/* ============ 操作按钮 ============ */

.action-buttons {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: $font-weight-semibold;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &.save-btn {
    background: var(--primary-color);
    color: #FFFFFF;

    &:active {
      background: var(--primary-color-dark);
    }
  }

  &.reset-btn {
    background: var(--bg-color-disabled);
    color: var(--text-color-secondary);
    border: 2rpx solid var(--border-color-base);

    &:active {
      background: var(--border-color-base);
    }
  }
}

/* ============ 响应式适配 ============ */

@media (max-width: 750rpx) {
  .color-inputs {
    grid-template-columns: 1fr;
  }

  .preset-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
