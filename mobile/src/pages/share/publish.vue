<template>
  <view class="publish-page" :style="themeStyle">
    <!-- 悬浮球组 -->
    <FloatingBalls
      currentPage="share"
      :draftCount="draftCount"
      :enable-switch-mode="true"
      @switchMode="handleModeSwitch"
      @preview="openPreviewPopup"
      @reset="resetAll"
      @drafts="goToDrafts"
      @saveDraft="saveDraftManually"
    />

    <scroll-view class="scroll-view" scroll-y>
      <!-- 基本信息 -->
      <view class="card animated-section" style="animation-delay: 0ms;">
        <view class="form-item horizontal clickable" @click="openTitlePopup">
          <view class="form-label">
            <text>物品名称</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="title-selector-inline">
              <text v-if="form.title" class="title-name-text">{{ form.title }}</text>
              <text v-else class="title-placeholder-inline">请输入物品名称</text>
            </view>
            <uni-icons type="right" size="14" color="#AAAAAA" />
          </view>
        </view>

        <view class="form-item horizontal clickable" @click="openConditionPicker">
          <view class="form-label">
            <text>物品成色</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="condition-selector-inline">
              <text v-if="form.conditionName" class="condition-name-text">{{ form.conditionName }}</text>
              <text v-else class="condition-placeholder-inline">请选择成色</text>
            </view>
            <uni-icons type="right" size="14" color="#AAAAAA" />
          </view>
        </view>

        <!-- 物品分类移到成色下面 -->
        <view class="form-item horizontal clickable" @click="openCategoryPicker">
          <view class="form-label">
            <text>物品分类</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="category-selector-inline">
              <view v-if="form.categoryName" class="category-selected-inline">
                <view class="category-icon-small" :style="{ background: getSelectedCategoryGradient() }">
                  <text class="category-emoji-small">{{ getSelectedCategoryIcon() }}</text>
                </view>
                <text class="category-name-text">{{ form.categoryName }}</text>
              </view>
              <view v-else class="category-placeholder-inline">
                <text>请选择</text>
              </view>
            </view>
            <uni-icons type="right" size="14" color="#AAAAAA" />
          </view>
        </view>

        <!-- 图片上传 -->
        <view class="image-upload-section">
          <view class="image-grid">
            <!-- 已上传的图片 -->
            <view v-for="(image, index) in images" :key="index" class="image-item" :class="{ 'is-dragging': draggingIndex === index }">
              <lazy-image
                class="preview-image"
                :src="image"
                mode="aspectFill"
                :disable-lazy-load="true"
                @click="previewImage(index)"
              />
              <!-- 图片操作遮罩 -->
              <view class="image-actions">
                <view class="action-btn left-btn" v-if="index > 0" @click.stop="moveImage(index, -1)">
                  <uni-icons type="left" size="14" color="#fff" />
                </view>
                <view class="action-menu">
                  <view class="action-btn" @click.stop="setAsCover(index)">
                    <uni-icons type="star" size="14" color="#fff" />
                  </view>
                  <view class="action-btn delete" @click.stop="removeImage(index)">
                    <uni-icons type="trash" size="14" color="#fff" />
                  </view>
                </view>
                <view class="action-btn right-btn" v-if="index < images.length - 1" @click.stop="moveImage(index, 1)">
                  <uni-icons type="right" size="14" color="#fff" />
                </view>
              </view>
              <view v-if="index === 0" class="cover-tag">封面</view>
            </view>
            <!-- 正在上传的图片 -->
            <view v-for="(image, index) in uploadingImages" :key="'uploading-' + index" class="image-item uploading">
              <image class="preview-image" :src="image" mode="aspectFill" />
              <view class="upload-mask">
                <view class="progress-ring">
                  <text class="progress-text">{{ uploadProgress[image] || 0 }}%</text>
                </view>
              </view>
            </view>
            <!-- 上传按钮 -->
            <view v-if="images.length + uploadingImages.length < 9" class="upload-btn" @click="chooseImage">
              <uni-icons type="camera" size="40" color="#AAAAAA" />
            </view>
          </view>
          <text class="upload-tip">支持jpg、png格式，单张图片不超过5MB</text>
        </view>

        <!-- 物品描述 -->
        <view class="form-item vertical">
          <view class="form-label">物品描述</view>
          <view class="textarea-wrapper">
            <textarea
              class="textarea"
              v-model="form.description"
              placeholder="请详细描述物品的品牌、型号、使用情况等"
              maxlength="500"
              placeholder-style="color: var(--text-color-tertiary)"
            />
            <text class="count">{{ form.description.length }}/500</text>
          </view>
        </view>
      </view>

      <!-- 价格 -->
      <view class="card animated-section" style="animation-delay: 140ms;">
        <view class="form-item horizontal clickable" @click="openDailyRentPopup">
          <view class="form-label">
            <text>日租金</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="amount-selector-inline">
              <text v-if="form.dailyRent" class="amount-text">¥{{ form.dailyRent }}/天</text>
              <text v-else class="amount-placeholder">请输入日租金</text>
            </view>
            <uni-icons type="right" size="14" color="#AAAAAA" />
          </view>
        </view>

        <view class="form-item horizontal clickable" @click="openDepositPopup">
          <view class="form-label">
            <text>押金</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="amount-selector-inline">
              <text v-if="form.deposit" class="amount-text">¥{{ form.deposit }}</text>
              <text v-else class="amount-placeholder">请输入押金</text>
            </view>
            <uni-icons type="right" size="14" color="#AAAAAA" />
          </view>
        </view>
      </view>

      <!-- 租借时间 -->
      <view class="card animated-section" style="animation-delay: 210ms;">
        <view class="form-item horizontal clickable" @click="openRentalTimePopup">
          <view class="form-label">
            <text>可借时长</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="rental-time-selector-inline">
              <text v-if="getRentalTimePreview() !== '暂未设置'" class="rental-time-text">{{ getRentalTimePreview() }}</text>
              <text v-else class="rental-time-placeholder">请选择可借时长</text>
            </view>
            <uni-icons type="right" size="14" color="#AAAAAA" />
          </view>
        </view>
      </view>

      <!-- 收货方式 -->
      <view class="card animated-section" style="animation-delay: 280ms;">
        <view class="form-item horizontal clickable" @click="openDeliveryMethodPopup">
          <view class="form-label">
            <text>收货方式</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="delivery-method-selector-inline">
              <text v-if="getDeliveryMethodText()" class="delivery-method-text">{{ getDeliveryMethodText() }}</text>
              <text v-else class="delivery-method-placeholder">请选择收货方式</text>
            </view>
            <uni-icons type="right" size="14" color="#AAAAAA" />
          </view>
        </view>

        <!-- 邮寄选项 -->
        <view v-if="form.deliveryMethod === 'mailing'" class="form-item vertical">
          <view class="form-label">邮寄方式</view>
          <view class="mailing-options">
            <text
              class="mailing-option"
              :class="{ active: form.mailingType === 'free' }"
              @click="onMailingTypeChange('free')"
            >
              🎁 包邮
            </text>
            <text
              class="mailing-option"
              :class="{ active: form.mailingType === 'none' }"
              @click="onMailingTypeChange('none')"
            >
              💬 无需邮寄
            </text>
            <text
              class="mailing-option"
              :class="{ active: form.mailingType === 'distance' }"
              @click="onMailingTypeChange('distance')"
            >
              📍 按距离收费
            </text>
          </view>
        </view>

        <!-- 按距离收费时显示费用输入 -->
        <view v-if="form.deliveryMethod === 'mailing' && form.mailingType === 'distance'" class="form-item horizontal">
          <view class="form-label">配送费（元）</view>
          <view class="form-content">
            <input class="input" v-model="form.deliveryFee" type="digit" placeholder="请输入费用" placeholder-style="color: var(--text-color-tertiary)" />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 分类选择弹窗 -->
    <uni-popup ref="categoryPopup" type="bottom">
      <view class="category-popup">
        <view class="popup-header">
          <text class="popup-title">选择分类</text>
          <view class="close-btn" @click="closeCategoryPicker">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>

        <!-- 分类选项横向滚动 -->
        <view class="category-tabs-wrapper">
          <scroll-view class="category-tabs" scroll-x :show-scrollbar="false">
            <view
              v-for="category in categoryList"
              :key="getCategoryId(category)"
              class="category-tab"
              :class="{ active: form.categoryId === String(getCategoryId(category)) }"
              @click="selectCategory(category)"
            >
              <view class="tab-icon" :style="{ background: category.gradient }">
                <text class="tab-emoji">{{ getCategoryEmoji(category.icon) }}</text>
              </view>
              <text class="tab-name">{{ category.name }}</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </uni-popup>

    <!-- 成色选择弹窗 -->
    <uni-popup ref="conditionPopup" type="bottom">
      <view class="condition-popup">
        <view class="popup-header">
          <text class="popup-title">选择成色</text>
          <view class="close-btn" @click="closeConditionPicker">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>

        <!-- 成色选项列表 -->
        <view class="condition-list">
          <view
            v-for="condition in conditionOptions"
            :key="condition.id"
            class="condition-item"
            :class="{ active: form.conditionId === condition.id }"
            @click="selectCondition(condition)"
          >
            <view class="condition-info">
              <text class="condition-name">{{ condition.name }}</text>
              <text class="condition-desc">{{ condition.description }}</text>
            </view>
            <view class="condition-check" v-if="form.conditionId === condition.id">
              <uni-icons type="checkmarkempty" size="20" :color="primaryColor" />
            </view>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 物品名称输入弹窗 -->
    <uni-popup ref="titlePopup" type="bottom">
      <view class="input-popup">
        <view class="popup-header">
          <text class="popup-title">物品名称</text>
          <view class="close-btn" @click="closeTitlePopup">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <view class="input-content">
          <textarea
            class="popup-textarea"
            v-model="tempTitle"
            placeholder="请输入物品名称"
            maxlength="50"
            :show-confirm-bar="false"
            placeholder-style="color: var(--text-color-tertiary)"
            auto-focus
          />
          <text class="count-text">{{ tempTitle.length }}/50</text>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closeTitlePopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmTitle" :disabled="!tempTitle.trim()">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 日租金选择弹窗 -->
    <uni-popup ref="dailyRentPopup" type="bottom">
      <view class="amount-popup">
        <view class="popup-header">
          <text class="popup-title">日租金</text>
          <view class="close-btn" @click="closeDailyRentPopup">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <view class="amount-content">
          <view class="quick-amounts">
            <view
              v-for="amount in dailyRentOptions"
              :key="amount"
              class="amount-item"
              :class="{ active: tempDailyRent === amount }"
              @click="selectDailyRent(amount)"
            >
              <text>¥{{ amount }}</text>
            </view>
          </view>
          <view class="custom-amount">
            <text class="custom-label">自定义</text>
            <input class="custom-input" v-model="tempDailyRent" type="digit" placeholder="请输入金额" placeholder-style="color: var(--text-color-tertiary)" />
            <text class="currency-text">元</text>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closeDailyRentPopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmDailyRent" :disabled="!tempDailyRent">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 押金选择弹窗 -->
    <uni-popup ref="depositPopup" type="bottom">
      <view class="amount-popup">
        <view class="popup-header">
          <text class="popup-title">押金</text>
          <view class="close-btn" @click="closeDepositPopup">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <view class="amount-content">
          <view class="quick-amounts">
            <view
              v-for="amount in depositOptions"
              :key="amount"
              class="amount-item"
              :class="{ active: tempDeposit === amount }"
              @click="selectDeposit(amount)"
            >
              <text>¥{{ amount }}</text>
            </view>
          </view>
          <view class="custom-amount">
            <text class="custom-label">自定义</text>
            <input class="custom-input" v-model="tempDeposit" type="digit" placeholder="请输入金额" placeholder-style="color: var(--text-color-tertiary)" />
            <text class="currency-text">元</text>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closeDepositPopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmDeposit" :disabled="!tempDeposit">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 租借时间选择弹窗 -->
    <uni-popup ref="rentalTimePopup" type="bottom">
      <view class="rental-time-popup">
        <view class="popup-header">
          <text class="popup-title">可借时长</text>
          <view class="close-btn" @click="closeRentalTimePopup">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <view class="rental-type-toggle-wrapper">
          <view
            class="toggle-option"
            :class="{ active: form.rentalType === 'days' }"
            @click="onRentalTypeChange('days')"
          >
            <text>按天租借</text>
          </view>
          <view
            class="toggle-option"
            :class="{ active: form.rentalType === 'hours' }"
            @click="onRentalTypeChange('hours')"
          >
            <text>按时租借</text>
          </view>
        </view>
        <view class="rental-time-content">
          <view v-if="form.rentalType === 'days'" class="time-input-group">
            <text class="time-label">可借天数</text>
            <view class="time-input-wrapper">
              <input class="time-input" v-model="tempRentalDays" type="number" placeholder="请输入天数" placeholder-style="color: var(--text-color-tertiary)" />
              <text class="time-unit">天</text>
            </view>
          </view>
          <view v-if="form.rentalType === 'hours'" class="time-input-group">
            <text class="time-label">可借小时</text>
            <view class="time-input-wrapper">
              <input class="time-input" v-model="tempRentalHours" type="number" placeholder="请输入小时数" placeholder-style="color: var(--text-color-tertiary)" />
              <text class="time-unit">小时</text>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closeRentalTimePopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmRentalTime" :disabled="!getCurrentRentalTime()">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 收货方式选择弹窗 -->
    <uni-popup ref="deliveryMethodPopup" type="bottom">
      <view class="delivery-popup">
        <view class="popup-header">
          <text class="popup-title">收货方式</text>
          <view class="close-btn" @click="closeDeliveryMethodPopup">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <view class="delivery-content">
          <view
            class="delivery-option-item"
            :class="{ active: form.deliveryMethod === 'pickup' }"
            @click="selectDeliveryMethod('pickup')"
          >
            <view class="delivery-option-info">
              <text class="delivery-option-icon">📍</text>
              <view class="delivery-option-text">
                <text class="delivery-option-title">自提</text>
                <text class="delivery-option-desc">买家上门取件</text>
              </view>
            </view>
            <view class="delivery-option-check" v-if="form.deliveryMethod === 'pickup'">
              <uni-icons type="checkmarkempty" size="18" color="#ffffff" />
            </view>
          </view>
          <view
            class="delivery-option-item"
            :class="{ active: form.deliveryMethod === 'mailing' }"
            @click="selectDeliveryMethod('mailing')"
          >
            <view class="delivery-option-info">
              <text class="delivery-option-icon">📦</text>
              <view class="delivery-option-text">
                <text class="delivery-option-title">邮寄</text>
                <text class="delivery-option-desc">快递发货</text>
              </view>
            </view>
            <view class="delivery-option-check" v-if="form.deliveryMethod === 'mailing'">
              <uni-icons type="checkmarkempty" size="18" color="#ffffff" />
            </view>
          </view>
          <!-- 邮寄子选项 -->
          <view v-if="form.deliveryMethod === 'mailing'" class="mailing-sub-options">
            <view
              class="mailing-option-item"
              :class="{ active: form.mailingType === 'free' }"
              @click="selectMailingType('free')"
            >
              <view class="mailing-option-info">
                <text class="mailing-option-icon">🎁</text>
                <text class="mailing-option-title">包邮</text>
              </view>
              <view class="mailing-option-check" v-if="form.mailingType === 'free'">
                <uni-icons type="checkmarkempty" size="16" color="#ffffff" />
              </view>
            </view>
            <view
              class="mailing-option-item"
              :class="{ active: form.mailingType === 'none' }"
              @click="selectMailingType('none')"
            >
              <view class="mailing-option-info">
                <text class="mailing-option-icon">🚫</text>
                <text class="mailing-option-title">无需邮寄</text>
              </view>
              <view class="mailing-option-check" v-if="form.mailingType === 'none'">
                <uni-icons type="checkmarkempty" size="16" color="#ffffff" />
              </view>
            </view>
            <view
              class="mailing-option-item"
              :class="{ active: form.mailingType === 'distance' }"
              @click="selectMailingType('distance')"
            >
              <view class="mailing-option-info">
                <text class="mailing-option-icon">📍</text>
                <text class="mailing-option-title">按距离收费</text>
              </view>
              <view class="mailing-option-check" v-if="form.mailingType === 'distance'">
                <uni-icons type="checkmarkempty" size="16" color="#ffffff" />
              </view>
            </view>
            <!-- 按距离收费时显示费用输入 -->
            <view v-if="form.mailingType === 'distance'" class="delivery-fee-input">
              <text class="fee-label">配送费</text>
              <input class="fee-input" v-model="form.deliveryFee" type="digit" placeholder="请输入费用" placeholder-style="color: var(--text-color-tertiary)" />
              <text class="fee-unit">元</text>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closeDeliveryMethodPopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmDeliveryMethod">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 预览弹窗 -->
    <uni-popup ref="previewPopup" type="center">
      <view class="preview-popup">
        <view class="popup-header">
          <text class="popup-title">预览效果</text>
          <view class="close-btn" @click="closePreviewPopup">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <scroll-view class="preview-content" scroll-y>
          <!-- 卡片预览 -->
          <view class="preview-card">
            <!-- 图片轮播 -->
            <swiper class="card-swiper" :indicator-dots="images.length > 1" :autoplay="false" :circular="true">
              <swiper-item v-if="images.length > 0" v-for="(image, index) in images" :key="index">
                <image class="card-image" :src="image" mode="aspectFill" />
              </swiper-item>
              <swiper-item v-else>
                <view class="card-image-placeholder">
                  <uni-icons type="image" size="60" color="#ddd" />
                  <text class="placeholder-text">暂无图片</text>
                </view>
              </swiper-item>
            </swiper>

            <!-- 卡片内容 -->
            <view class="card-content">
              <!-- 价格信息 -->
              <view class="card-price">
                <view class="price-main">
                  <text class="price-symbol">¥</text>
                  <text class="price-value">{{ form.dailyRent || '0' }}</text>
                  <text class="price-unit">/天</text>
                </view>
                <text class="price-deposit">押金 ¥{{ form.deposit || '0' }}</text>
              </view>

              <!-- 标题 -->
              <view class="card-title">
                <text>{{ form.title || '物品名称' }}</text>
                <view v-if="form.conditionName" class="condition-tag">{{ form.conditionName }}</view>
              </view>

              <!-- 描述 -->
              <view class="card-desc">
                <text>{{ form.description || '暂无描述' }}</text>
              </view>

              <!-- 标签信息 -->
              <view class="card-tags">
                <view class="tag-item">
                  <uni-icons type="calendar" size="12" color="#7A7A7A" />
                  <text class="tag-text">{{ getRentalTimePreview() }}</text>
                </view>
                <view class="tag-item">
                  <uni-icons type="location" size="12" color="#7A7A7A" />
                  <text class="tag-text">{{ getDeliveryMethodText() }}</text>
                </view>
              </view>

              <!-- 分类标签 -->
              <view v-if="form.categoryName" class="category-tag">
                {{ form.categoryName }}
              </view>
            </view>
          </view>

          <!-- 预览提示 -->
          <view class="preview-tips">
            <text class="tips-icon">💡</text>
            <text class="tips-text">以上为卡片预览效果，实际展示可能略有差异</text>
          </view>
        </scroll-view>

        <!-- 预览底部按钮 -->
        <view class="preview-footer">
          <button class="preview-close-btn" @click="closePreviewPopup">关闭预览</button>
        </view>
      </view>
    </uni-popup>

    <!-- 底部按钮 -->
    <view class="bottom-bar animated-bottom-bar">
      <!-- 按钮组 -->
      <view class="button-group">
        <button class="draft-btn" @click="saveDraftManually">
          <text>保存草稿</text>
        </button>
        <button class="publish-btn" @click="handlePublish">
          发布共享
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import {onLoad, onShow} from '@dcloudio/uni-app'
import { shareApi } from '@/api/share'
import { categoryApi, type Category } from '@/api/category'
import { checkSensitiveWord, SensitiveCheckType } from '@/utils/sensitive-word'
import { useUserStore } from '@/store/user'
import { getCategoryEmoji } from '@/utils/categoryIcons'
import { uploadImage as uploadImageFile, normalizeImageUrl } from '@/utils/image'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import { checkAuth } from '@/utils/auth'
// @ts-ignore
import FloatingBalls from '@/components/floating-balls/floating-balls.vue'
// @ts-ignore
import LazyImage from '@/components/lazy-image/lazy-image.vue'

const { themeStyle } = useThemeStyle()
const { primaryColor, successColor, warningColor, dangerColor } = useThemeColors()

// 草稿存储key
const DRAFT_KEY = 'share_draft_data'

const userStore = useUserStore()

// ==================== 草稿状态 ====================
const draftCount = ref(0)

const images = ref<string[]>([])
const uploadingImages = ref<string[]>([]) // 正在上传的图片
const uploadProgress = ref<Record<string, number>>({}) // 上传进度
const draggingIndex = ref<number>(-1) // 拖拽中的图片索引
const categoryList = ref<Category[]>([])
const categoryPopup = ref()
const conditionPopup = ref()
const titlePopup = ref()
const dailyRentPopup = ref()
const depositPopup = ref()
const rentalTimePopup = ref()
const deliveryMethodPopup = ref()
const previewPopup = ref()

// 临时输入值
const tempTitle = ref('')
const tempDailyRent = ref('')
const tempDeposit = ref('')
const tempRentalDays = ref('')
const tempRentalHours = ref('')

// 日租金快捷选项
const dailyRentOptions = ['5', '10', '20', '30', '50', '100', '200', '500']

// 押金快捷选项
const depositOptions = ['10', '20', '50', '100', '200', '500', '1000']

// 成色选项
const conditionOptions = [
  { id: '1', name: '全新', description: '未使用过或使用痕迹极不明显' },
  { id: '2', name: '轻微使用痕迹', description: '有轻微使用痕迹，功能完好' },
  { id: '3', name: '明显使用痕迹', description: '有明显使用痕迹，但功能正常' },
  { id: '4', name: '较旧', description: '使用时间较长，有磨损但仍可用' }
]

const CONDITION_ID_TO_API: Record<string, string> = {
  '1': 'new',
  '2': 'almost_new',
  '3': 'obviously_used',
  '4': 'has_flaws'
}

// URL 参数中的草稿ID（从草稿箱进入时使用）
const urlDraftId = ref<string>('')

const form = ref({
  draftId: undefined as string | undefined,  // 草稿ID
  title: '',
  description: '',
  dailyRent: '',
  deposit: '',
  categoryId: '',
  categoryName: '',
  conditionId: '', // 成色ID
  conditionName: '', // 成色名称
  // 收货方式
  deliveryMethod: 'pickup', // pickup-自提, mailing-邮寄
  mailingType: '', // 邮寄类型：free-包邮, none-无需邮寄, distance-按距离收费
  deliveryFee: '', // 按距离收费时的费用
  // 租借时间
  rentalType: 'days', // days-按天, hours-按时
  rentalDays: '', // 租借天数
  rentalHours: '' // 租借小时数
})

// 编辑模式状态
const editMode = ref(false)
const editShareId = ref('')

let saveDraftTimer: ReturnType<typeof setTimeout> | null = null
let isSavingDraft = false
let disableDraftSync = false

function ensureSharePublishAuth() {
  return checkAuth({
    showTip: true,
    tipText: '请先登录后发布共享',
    showAuthGuide: true,
    guideTitle: '登录后可发布共享',
    guideContent: '发布共享物品需要登录账号，便于管理借用与押金信息。'
  })
}

// 页面加载时获取参数
onLoad((options: any) => {
  if (!ensureSharePublishAuth()) {
    return
  }

  console.log('共享物品发布页面参数:', options)

  // 编辑模式：通过 id 参数加载已发布物品
  if (options.id && options.mode === 'edit') {
    editMode.value = true
    editShareId.value = options.id
    console.log('进入编辑模式, shareId:', editShareId.value)
    // 设置导航栏标题
    uni.setNavigationBarTitle({ title: '编辑共享物品' })
    return
  }

  // 草稿模式
  if (options.draftId) {
    urlDraftId.value = options.draftId || ''
    console.log('从URL获取到草稿ID:', urlDraftId.value)
  }
})

// 页面加载时获取分类列表

onShow(() => {
  useThemePage()
})

onMounted(async () => {
  if (!ensureSharePublishAuth()) {
    return
  }

  await loadCategories()

  // 编辑模式：加载已发布物品数据
  if (editMode.value && editShareId.value) {
    await loadShareItemForEdit(editShareId.value)
  } else {
    // 新建模式：加载草稿
    await loadDraft()
  }

  await updateDraftCount()
})

// 页面卸载时清理
onUnmounted(() => {
  if (saveDraftTimer) {
    clearTimeout(saveDraftTimer)
    saveDraftTimer = null
  }
  void flushDraftSave()
})

// 监听表单变化自动保存草稿
watch(
  form,
  () => {
    saveDraft()
  },
  { deep: true }
)

// 监听图片变化
watch(images, () => {
  saveDraft()
})

// 加载分类列表
async function loadCategories() {
  try {
    const res = await categoryApi.getCategoryList()
    categoryList.value = res.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

function getShareEditImages(data: any): string[] {
  if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    return data.imageUrls
  }

  if (Array.isArray(data.images) && data.images.length > 0) {
    return data.images
  }

  if (data.coverImageUrl || data.coverImage || data.image) {
    return [data.coverImageUrl || data.coverImage || data.image]
  }

  return []
}

function getConditionOptionById(id: string) {
  return conditionOptions.find(condition => condition.id === id)
}

function mapConditionIdToApi(id: string): string {
  return CONDITION_ID_TO_API[id] || ''
}

function mapConditionToForm(condition?: string, conditionLevel?: number | string) {
  let conditionId = ''

  if (condition) {
    const conditionMap: Record<string, string> = {
      new: '1',
      almost_new: '2',
      lightly_used: '2',
      obviously_used: '3',
      has_flaws: '4'
    }
    conditionId = conditionMap[condition] || ''
  } else if (conditionLevel !== undefined && conditionLevel !== null && conditionLevel !== '') {
    const level = Number(conditionLevel)
    if (level >= 10) {
      conditionId = '1'
    } else if (level >= 8) {
      conditionId = '2'
    } else if (level >= 7) {
      conditionId = '3'
    } else if (level > 0) {
      conditionId = '4'
    }
  }

  form.value.conditionId = conditionId
  form.value.conditionName = getConditionOptionById(conditionId)?.name || ''
}

// 打开分类选择器
function openCategoryPicker() {
  categoryPopup.value?.open()
}

// 关闭分类选择器
function closeCategoryPicker() {
  categoryPopup.value?.close()
}

function getCategoryId(category: Category) {
  return category.categoryId || category.id
}

// 选择分类
function selectCategory(category: Category) {
  form.value.categoryId = String(getCategoryId(category))
  form.value.categoryName = category.name
  closeCategoryPicker()
}

// 打开成色选择器
function openConditionPicker() {
  conditionPopup.value?.open()
}

// 关闭成色选择器
function closeConditionPicker() {
  conditionPopup.value?.close()
}

// 选择成色
function selectCondition(condition: { id: string; name: string; description: string }) {
  form.value.conditionId = condition.id
  form.value.conditionName = condition.name
  closeConditionPicker()
}

// ==================== 物品名称相关函数 ====================
function openTitlePopup() {
  tempTitle.value = form.value.title
  titlePopup.value?.open()
}

function closeTitlePopup() {
  titlePopup.value?.close()
}

function confirmTitle() {
  if (!tempTitle.value.trim()) {
    uni.showToast({ title: '请输入物品名称', icon: 'none' })
    return
  }
  form.value.title = tempTitle.value.trim()
  closeTitlePopup()
}

// ==================== 日租金相关函数 ====================
function openDailyRentPopup() {
  tempDailyRent.value = form.value.dailyRent
  dailyRentPopup.value?.open()
}

function closeDailyRentPopup() {
  dailyRentPopup.value?.close()
}

function selectDailyRent(amount: string) {
  tempDailyRent.value = amount
}

function confirmDailyRent() {
  if (!tempDailyRent.value) {
    uni.showToast({ title: '请输入日租金', icon: 'none' })
    return
  }
  form.value.dailyRent = tempDailyRent.value
  closeDailyRentPopup()
}

// ==================== 押金相关函数 ====================
function openDepositPopup() {
  tempDeposit.value = form.value.deposit
  depositPopup.value?.open()
}

function closeDepositPopup() {
  depositPopup.value?.close()
}

function selectDeposit(amount: string) {
  tempDeposit.value = amount
}

function confirmDeposit() {
  if (!tempDeposit.value) {
    uni.showToast({ title: '请输入押金', icon: 'none' })
    return
  }
  form.value.deposit = tempDeposit.value
  closeDepositPopup()
}

// ==================== 租借时间相关函数 ====================
function openRentalTimePopup() {
  tempRentalDays.value = form.value.rentalDays
  tempRentalHours.value = form.value.rentalHours
  rentalTimePopup.value?.open()
}

function closeRentalTimePopup() {
  rentalTimePopup.value?.close()
}

function getCurrentRentalTime(): string {
  return form.value.rentalType === 'days' ? tempRentalDays.value : tempRentalHours.value
}

function confirmRentalTime() {
  const currentTime = getCurrentRentalTime()
  if (!currentTime) {
    uni.showToast({ title: form.value.rentalType === 'days' ? '请输入天数' : '请输入小时数', icon: 'none' })
    return
  }
  form.value.rentalDays = tempRentalDays.value
  form.value.rentalHours = tempRentalHours.value
  closeRentalTimePopup()
}

// ==================== 收货方式相关函数 ====================
function openDeliveryMethodPopup() {
  deliveryMethodPopup.value?.open()
}

function closeDeliveryMethodPopup() {
  deliveryMethodPopup.value?.close()
}

function selectDeliveryMethod(method: 'pickup' | 'mailing') {
  form.value.deliveryMethod = method
}

function selectMailingType(type: 'free' | 'none' | 'distance') {
  form.value.mailingType = type
}

function confirmDeliveryMethod() {
  closeDeliveryMethodPopup()
}

// 获取选中分类的渐变色
function getSelectedCategoryGradient(): string {
  if (form.value.categoryId === 'other') {
    return 'linear-gradient(135deg, #999 0%, #666 100%)'
  }
  const category = categoryList.value.find(c => String(getCategoryId(c)) === form.value.categoryId)
  return category?.gradient || 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)'
}

// 获取选中分类的图标
function getSelectedCategoryIcon(): string {
  if (form.value.categoryId === 'other') {
    return '✏️'
  }
  const category = categoryList.value.find(c => String(getCategoryId(c)) === form.value.categoryId)
  return category ? getCategoryEmoji(category.icon) : '📦'
}

// 租借类型切换
function onRentalTypeChange(type: string) {
  form.value.rentalType = type
  // 切换类型时清空另一个字段
  if (type === 'days') {
    form.value.rentalHours = ''
  } else {
    form.value.rentalDays = ''
  }
}

// 快捷操作弹窗相关函数
// 预览弹窗相关函数
function openPreviewPopup() {
  previewPopup.value?.open()
}

function closePreviewPopup() {
  previewPopup.value?.close()
}

// 清空所有表单数据
function resetAll() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有内容吗？此操作不可恢复',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 清空表单
        form.value = {
          draftId: undefined,
          title: '',
          description: '',
          dailyRent: '',
          deposit: '',
          categoryId: '',
          categoryName: '',
          conditionId: '',
          conditionName: '',
          rentalType: 'days',
          rentalDays: '7',
          rentalHours: '1',
          deliveryMethod: '',
          mailingType: '',
          deliveryFee: ''
        }
        // 清空图片
        images.value = []
        uni.showToast({ title: '已清空所有内容', icon: 'success' })
      }
    }
  })
}

// 获取收货方式文本
function getDeliveryMethodText(): string {
  if (form.value.deliveryMethod === 'pickup') {
    return '📍 自提'
  } else if (form.value.deliveryMethod === 'mailing') {
    const mailingTypeMap: Record<string, string> = {
      'free': '📦 包邮',
      'none': '📦 无需邮寄',
      'distance': '📦 按距离收费'
    }
    return mailingTypeMap[form.value.mailingType] || '📦 邮寄'
  }
  return ''
}

// 手动保存草稿
async function saveDraftManually() {
  if (!hasMeaningfulDraftContent()) {
    uni.showToast({
      title: '暂无内容可保存',
      icon: 'none'
    })
    return
  }

  await flushDraftSave()
  uni.showToast({
    title: '草稿已保存',
    icon: 'success',
    duration: 2000
  })
}

// 加载已发布物品数据用于编辑
async function loadShareItemForEdit(shareId: string) {
  try {
    uni.showLoading({ title: '加载中...' })
    const response = await shareApi.getShareItemDetail(shareId)
    const data = response.data || response || {}

    // 回填表单
    form.value.title = data.title || ''
    form.value.description = data.description || ''
    form.value.categoryId = data.categoryId?.toString() || ''
    form.value.categoryName = data.categoryName || ''
    form.value.deposit = data.deposit?.toString() || ''
    form.value.dailyRent = data.dailyRent?.toString() || ''
    mapConditionToForm(data.condition, data.conditionLevel)

    if (!form.value.categoryName && form.value.categoryId) {
      const matchedCategory = categoryList.value.find(
        category => String(getCategoryId(category)) === form.value.categoryId
      )
      form.value.categoryName = matchedCategory?.name || ''
    }

    // 回填图片
    images.value = getShareEditImages(data)

    // 解析可借用时间段
    const availableTimesRaw = data.availableTimes || data.availableTime
    if (availableTimesRaw) {
      try {
        const availableTimes = typeof availableTimesRaw === 'string'
          ? JSON.parse(availableTimesRaw)
          : availableTimesRaw
        form.value.deliveryMethod = availableTimes.deliveryMethod || 'pickup'
        form.value.mailingType = availableTimes.mailingType || ''
        form.value.deliveryFee = availableTimes.deliveryFee?.toString() || ''
        form.value.rentalType = availableTimes.rentalType || 'days'
        form.value.rentalDays = availableTimes.rentalDays?.toString() || ''
        form.value.rentalHours = availableTimes.rentalHours?.toString() || ''
      } catch (e) {
        console.error('解析可借用时间段失败:', e)
      }
    }

    console.log('加载共享物品数据成功:', data)
  } catch (error) {
    console.error('加载共享物品失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  } finally {
    uni.hideLoading()
  }
}

// 更新草稿数量
async function updateDraftCount() {
  try {
    const res = await shareApi.getDraftCount()
    draftCount.value = res.data?.count || 0
    console.log('草稿数量已更新:', draftCount.value)
  } catch (e) {
    console.error('更新草稿数量失败:', e)
  }
}

function hasMeaningfulDraftContent() {
  return Boolean(
    form.value.title?.trim() ||
    form.value.description?.trim() ||
    form.value.categoryId ||
    form.value.conditionId ||
    form.value.conditionName ||
    form.value.deposit?.trim() ||
    form.value.dailyRent?.trim() ||
    images.value.length > 0 ||
    form.value.mailingType ||
    form.value.deliveryFee?.trim() ||
    form.value.rentalDays?.trim() ||
    form.value.rentalHours?.trim() ||
    form.value.deliveryMethod !== 'pickup' ||
    form.value.rentalType !== 'days'
  )
}

function saveDraftLocal() {
  if (!hasMeaningfulDraftContent()) {
    return false
  }

  try {
    const draftData = {
      form: form.value,
      images: images.value,
      updateTime: new Date().getTime()
    }
    uni.setStorageSync(DRAFT_KEY, JSON.stringify(draftData))
  } catch (error) {
    console.error('保存本地草稿失败:', error)
  }

  return true
}

function debouncedSaveDraft() {
  if (disableDraftSync) {
    return
  }

  if (!saveDraftLocal()) {
    return
  }

  if (saveDraftTimer) {
    clearTimeout(saveDraftTimer)
  }

  saveDraftTimer = setTimeout(() => {
    void saveDraftToServer()
  }, 2000)
}

async function flushDraftSave() {
  if (saveDraftTimer) {
    clearTimeout(saveDraftTimer)
    saveDraftTimer = null
  }

  if (!saveDraftLocal()) {
    return
  }

  if (!disableDraftSync) {
    await saveDraftToServer()
  }
}

// 草稿保存
async function saveDraft() {
  debouncedSaveDraft()
}

async function saveDraftToServer() {
  if (disableDraftSync) {
    return
  }

  if (!hasMeaningfulDraftContent()) {
    return
  }

  if (isSavingDraft) {
    console.log('共享草稿正在保存中，跳过本次请求')
    return
  }

  isSavingDraft = true
  try {
    const draftData = {
      draftId: form.value.draftId,
      title: form.value.title,
      description: form.value.description,
      categoryId: form.value.categoryId || undefined,
      deposit: form.value.deposit ? parseFloat(form.value.deposit) : undefined,
      dailyRent: form.value.dailyRent ? parseFloat(form.value.dailyRent) : undefined,
      condition: mapConditionIdToApi(form.value.conditionId) || undefined,
      imageUrls: images.value,
      availableTimes: JSON.stringify({
        deliveryMethod: form.value.deliveryMethod,
        mailingType: form.value.mailingType,
        deliveryFee: form.value.deliveryFee,
        rentalType: form.value.rentalType,
        rentalDays: form.value.rentalDays,
        rentalHours: form.value.rentalHours
      })
    }

    const res = await shareApi.saveDraft(draftData)
    // 保存服务器返回的 draftId
    if (res.data?.draftId) {
      form.value.draftId = res.data.draftId
      console.log('共享物品草稿同步到服务器成功, draftId:', res.data.draftId)
    }
    // 更新草稿数量
    await updateDraftCount()
  } catch (e: any) {
    console.error('保存服务器草稿失败:', e)

    // 如果是草稿不存在错误，说明 draftId 已失效，下次保存时会创建新草稿
    if ((e.message?.includes('草稿不存在') || e.message?.includes('商品不存在')) && form.value.draftId) {
      console.log('草稿不存在，清除 draftId，下次保存时将创建新草稿')
      form.value.draftId = undefined
      // 清除本地存储中的 draftId
      try {
        const localData = JSON.parse(uni.getStorageSync(DRAFT_KEY) || '{}')
        if (localData.form) {
          localData.form.draftId = undefined
          uni.setStorageSync(DRAFT_KEY, JSON.stringify(localData))
        }
      } catch (err) {
        console.error('更新本地存储失败:', err)
      }
    }
  } finally {
    isSavingDraft = false
  }
}

// 加载草稿
async function loadDraft() {
  console.log('=== 开始加载共享物品草稿 ===')
  console.log('URL草稿ID:', urlDraftId.value)

  // 只有URL中指定了草稿ID时才加载该草稿
  if (urlDraftId.value) {
    console.log('加载指定共享物品草稿, draftId:', urlDraftId.value)
    try {
      const draftRes = await shareApi.getDraftDetail(urlDraftId.value)
      const draft = draftRes.data
      if (draft) {
        form.value.draftId = draft.draftId
        form.value.title = draft.title || ''
        form.value.description = draft.description || ''
        form.value.categoryId = draft.categoryId?.toString() || ''
        form.value.categoryName = draft.categoryName || ''
        form.value.deposit = draft.deposit?.toString() || ''
        form.value.dailyRent = draft.dailyRent?.toString() || ''
        mapConditionToForm(draft.condition, draft.conditionLevel)
        // 加载图片
        images.value = draft.images || []

        // 解析可借用时间段
        if (draft.availableTimes) {
          try {
            const availableTimes = JSON.parse(draft.availableTimes)
            Object.assign(form.value, availableTimes)
          } catch (e) {
            console.error('解析可借用时间段失败:', e)
          }
        }

        console.log('从服务器加载指定共享物品草稿成功:', draft)
        console.log('设置的draftId:', form.value.draftId)
        return
      } else {
        console.warn('共享物品草稿详情返回空数据')
        uni.showToast({
          title: '草稿不存在',
          icon: 'none'
        })
        return
      }
    } catch (e: any) {
      console.error('加载指定共享物品草稿失败:', e)
      uni.showToast({
        title: e.message || '草稿加载失败',
        icon: 'none'
      })
      return  // 不继续加载其他草稿
    }
  }

  // 默认情况：清除本地存储，创建新草稿
  console.log('创建新草稿，清除本地存储')
  uni.removeStorageSync(DRAFT_KEY)
  form.value.draftId = undefined
}

// 清除草稿
function clearDraft() {
  try {
    uni.removeStorageSync(DRAFT_KEY)
  } catch (error) {
    console.error('清除草稿失败:', error)
  }
}

// 选择图片
function chooseImage() {
  const maxCount = 9 - images.value.length - uploadingImages.value.length
  uni.chooseImage({
    count: maxCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      uploadImages(res.tempFilePaths)
    }
  })
}

// 上传图片
async function uploadImages(filePaths: string[]) {
  for (const filePath of filePaths) {
    // 添加到上传中列表
    uploadingImages.value.push(filePath)
    uploadProgress.value[filePath] = 0

    try {
      const result = await uploadImageFile(filePath, '/upload/image', {
        showLoading: false,
        onProgress: (progress) => {
          uploadProgress.value[filePath] = progress
        }
      })
      const url = result.url
      // 上传成功，从上传中移除，添加到已完成
      const uploadIndex = uploadingImages.value.indexOf(filePath)
      if (uploadIndex > -1) {
        uploadingImages.value.splice(uploadIndex, 1)
      }
      delete uploadProgress.value[filePath]
      images.value.push(url)
    } catch (error) {
      // 上传失败，允许重试
      const uploadIndex = uploadingImages.value.indexOf(filePath)
      if (uploadIndex > -1) {
        uploadingImages.value.splice(uploadIndex, 1)
      }
      delete uploadProgress.value[filePath]

      uni.showModal({
        title: '上传失败',
        content: '图片上传失败，是否重试？',
        success: (res) => {
          if (res.confirm) {
            uploadImages([filePath])
          }
        }
      })
    }
  }
}

// 预览图片
function previewImage(index: number) {
  const displayUrls = images.value.map(url => getDisplayImageUrl(url))
  uni.previewImage({
    urls: displayUrls,
    current: index
  })
}

function getDisplayImageUrl(url: string) {
  if (!url) return ''
  return normalizeImageUrl(url)
}

// 删除图片
function removeImage(index: number) {
  uni.showModal({
    title: '删除图片',
    content: '确定要删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        images.value.splice(index, 1)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

// 移动图片位置
function moveImage(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= images.value.length) return

  draggingIndex.value = index
  const temp = images.value[index]
  images.value[index] = images.value[newIndex]
  images.value[newIndex] = temp

  setTimeout(() => {
    draggingIndex.value = -1
  }, 300)

  uni.showToast({ title: newIndex === 0 ? '已设为封面' : '已移动', icon: 'success', duration: 1000 })
}

// 设置为封面
function setAsCover(index: number) {
  if (index === 0) {
    uni.showToast({ title: '当前已是封面', icon: 'none' })
    return
  }

  draggingIndex.value = index
  const coverImage = images.value.splice(index, 1)[0]
  images.value.unshift(coverImage)

  setTimeout(() => {
    draggingIndex.value = -1
  }, 300)

  uni.showToast({ title: '已设为封面', icon: 'success' })
}

// 收货方式选择
function onDeliveryMethodChange(method: string) {
  form.value.deliveryMethod = method
  // 切换到自提时清空邮寄相关选项
  if (method === 'pickup') {
    form.value.mailingType = ''
    form.value.deliveryFee = ''
  }
}

// 邮寄类型选择
function onMailingTypeChange(type: string) {
  form.value.mailingType = type
  // 如果不是按距离收费，清空费用
  if (type !== 'distance') {
    form.value.deliveryFee = ''
  }
}

// 生成租借时间字符串
function getRentalTime() {
  if (form.value.rentalType === 'days') {
    return form.value.rentalDays ? `可借${form.value.rentalDays}天` : ''
  } else {
    return form.value.rentalHours ? `可借${form.value.rentalHours}小时` : ''
  }
}

// 获取租借时间预览
function getRentalTimePreview(): string {
  if (form.value.rentalType === 'days') {
    return form.value.rentalDays ? `可借${form.value.rentalDays}天` : '暂未设置'
  } else {
    return form.value.rentalHours ? `可借${form.value.rentalHours}小时` : '暂未设置'
  }
}

/** 处理模式切换 */
function handleModeSwitch(newMode: 'market' | 'share') {
  if (newMode === 'share') {
    uni.showToast({
      title: '当前已经是发布共享页面',
      icon: 'none'
    })
    return
  }

  console.log('[SharePublish] 切换发布模式: share ->', newMode)

  // 提示用户
  uni.showModal({
    title: '切换模式',
    content: '切换到发布商品将保存当前共享草稿，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        await flushDraftSave()
        // 切换到发布商品页面
        uni.redirectTo({
          url: '/pages/market/publish?from=modeSwitch',
          fail: () => {
            uni.showToast({
              title: '页面跳转失败',
              icon: 'none'
            })
          }
        })
      }
    }
  })
}

/** 跳转到草稿箱 */
function goToDrafts() {
  uni.navigateTo({
    url: '/pages/mine/drafts?source=share'
  })
}

// 发布共享物品
async function handlePublish() {
  if (!userStore.checkLogin()) return

  // 表单验证
  if (images.value.length === 0) {
    uni.showToast({ title: '请至少上传一张图片', icon: 'none' })
    return
  }
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入物品名称', icon: 'none' })
    return
  }
  if (!form.value.conditionName) {
    uni.showToast({ title: '请选择物品成色', icon: 'none' })
    return
  }
  if (!form.value.categoryId) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }
  if (!form.value.dailyRent) {
    uni.showToast({ title: '请输入日租金', icon: 'none' })
    return
  }
  if (!form.value.deposit) {
    uni.showToast({ title: '请输入押金', icon: 'none' })
    return
  }
  // 验证租借时长（根据类型）
  if (form.value.rentalType === 'days') {
    if (!form.value.rentalDays) {
      uni.showToast({ title: '请输入租借天数', icon: 'none' })
      return
    }
  } else {
    if (!form.value.rentalHours) {
      uni.showToast({ title: '请输入租借小时数', icon: 'none' })
      return
    }
  }
  if (!form.value.deliveryMethod) {
    uni.showToast({ title: '请选择收货方式', icon: 'none' })
    return
  }
  // 如果是邮寄且按距离收费，需要输入配送费
  if (form.value.deliveryMethod === 'mailing' && form.value.mailingType === 'distance' && !form.value.deliveryFee) {
    uni.showToast({ title: '请输入配送费', icon: 'none' })
    return
  }

  let publishSuccess = false

  try {
    // 编辑模式不需要保存草稿
    if (!editMode.value) {
      await flushDraftSave()
    }

    // 检查敏感词
    const [titleCheck, descCheck] = await Promise.all([
      checkSensitiveWord(form.value.title, SensitiveCheckType.PRODUCT),
      checkSensitiveWord(form.value.description || '', SensitiveCheckType.PRODUCT)
    ])

    // 如果包含禁止词，停止发布
    if (titleCheck && !titleCheck.passed) return
    if (descCheck && !descCheck.passed) return

    // 使用过滤后的内容
    const filteredTitle = titleCheck?.filteredContent || form.value.title
    const filteredDesc = descCheck?.filteredContent || form.value.description

    // 如果有敏感词被过滤，显示提示
    if (titleCheck?.hasSensitiveWord || descCheck?.hasSensitiveWord) {
      uni.showToast({
        title: '已自动过滤敏感词',
        icon: 'none',
        duration: 1500
      })
    }

    // 构建请求数据
    const data = {
      title: filteredTitle,
      description: filteredDesc,
      dailyRent: parseFloat(form.value.dailyRent),
      deposit: parseFloat(form.value.deposit),
      categoryId: form.value.categoryId,
      condition: mapConditionIdToApi(form.value.conditionId),
      imageUrls: images.value,
      availableTimes: JSON.stringify({
        deliveryMethod: form.value.deliveryMethod,
        mailingType: form.value.mailingType,
        deliveryFee: form.value.deliveryFee,
        rentalType: form.value.rentalType,
        rentalDays: form.value.rentalDays,
        rentalHours: form.value.rentalHours
      })
    }

    if (editMode.value && editShareId.value) {
      // 编辑模式：更新已发布的物品
      await shareApi.updateShareItem(editShareId.value, data)
      publishSuccess = true
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else if (form.value.draftId) {
      // 如果有草稿ID，从草稿发布
      await shareApi.publishFromDraft(form.value.draftId)
      publishSuccess = true
      // 发布成功，清除草稿
      disableDraftSync = true
      clearDraft()
      form.value.draftId = undefined
      uni.showToast({ title: '发布成功', icon: 'success' })
    } else {
      // 否则直接发布
      await shareApi.publishShareItem(data)
      publishSuccess = true
      uni.showToast({ title: '发布成功', icon: 'success' })
    }

    // 发布成功后更新草稿数量
    updateDraftCount()
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (e) {
    console.error('发布失败:', e)
    uni.showToast({ title: editMode.value ? '更新失败，请重试' : '发布失败，请重试', icon: 'none' })
  } finally {
    if (!publishSuccess) {
      disableDraftSync = false
    }
  }
}
</script>

<style lang="scss" scoped>
.publish-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
}

.scroll-view {
  flex: 1;
  padding: 16rpx;
  padding-bottom: 240rpx;
}

.card {
  background: var(--bg-color-card);
  margin-bottom: 16rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &.clickable {
    &:active {
      background: var(--bg-color-page);
    }
  }
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;

  .image-item {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

    &.uploading {
      .preview-image {
        filter: blur(2rpx);
      }
    }

    &.is-dragging {
      opacity: 0.5;
      transform: scale(0.95);
      transition: all 0.3s;
    }

    .preview-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 16rpx;
      background: var(--bg-color-disabled);
    }

    .image-actions {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8rpx;
      opacity: 0;
      transition: opacity 0.2s;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 16rpx;

      .action-menu {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .action-btn {
        width: 56rpx;
        height: 56rpx;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4rpx);
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
        transition: all 0.2s;

        &:active {
          transform: scale(0.9);
        }

        &.delete {
          background: var(--danger-color-alpha-95);
        }
      }

      .action-btn.delete {
        :deep(.uni-icons) {
          color: #fff !important;
        }
      }

      &.left-btn,
      &.right-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
      }

      &.left-btn {
        left: 8rpx;
      }

      &.right-btn {
        right: 8rpx;
      }
    }

    &:active .image-actions {
      opacity: 1;
    }

    .upload-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .progress-ring {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4rpx);

        .progress-text {
          font-size: 24rpx;
          color: #fff;
          font-weight: 600;
        }
      }
    }

    .cover-tag {
      position: absolute;
      bottom: 8rpx;
      left: 8rpx;
      padding: 4rpx 10rpx;
      background: var(--primary-color-alpha-95);
      color: #fff;
      font-size: 20rpx;
      border-radius: 8rpx;
      font-weight: 600;
      backdrop-filter: blur(4rpx);
    }
  }

  .upload-btn {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: var(--bg-color-page);
    border-radius: 16rpx;
    border: 2rpx dashed #ddd;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:active {
      background: var(--border-color-light);
      border-color: var(--primary-color);
    }

    .upload-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 22rpx;
      color: var(--text-color-tertiary);
    }
  }
}

// 图片上传区域（在表单卡片内）
.image-upload-section {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid var(--border-color-light);

  .image-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12rpx;

    .image-item {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      border-radius: 16rpx;
      overflow: hidden;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

      &.uploading {
        .preview-image {
          filter: blur(2rpx);
        }
      }

      &.is-dragging {
        opacity: 0.5;
        transform: scale(0.95);
        transition: all 0.3s;
      }

      .preview-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 16rpx;
        background: var(--bg-color-disabled);
      }

      .image-actions {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8rpx;
        opacity: 0;
        transition: opacity 0.2s;
        background: rgba(0, 0, 0, 0.4);
        border-radius: 16rpx;

        .action-menu {
          display: flex;
          flex-direction: column;
          gap: 8rpx;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .action-btn {
          width: 56rpx;
          height: 56rpx;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4rpx);
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
          transition: all 0.2s;

          &:active {
            transform: scale(0.9);
          }

          &.delete {
            background: var(--danger-color-alpha-95);
          }
        }

        .action-btn.delete {
          :deep(.uni-icons) {
            color: #fff !important;
          }
        }

        &.left-btn,
        &.right-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
        }

        &.left-btn {
          left: 8rpx;
        }

        &.right-btn {
          right: 8rpx;
        }
      }

      &:active .image-actions {
        opacity: 1;
      }

      .upload-mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        .progress-ring {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4rpx);

          .progress-text {
            font-size: 24rpx;
            color: #fff;
            font-weight: 600;
          }
        }
      }

      .cover-tag {
        position: absolute;
        bottom: 8rpx;
        left: 8rpx;
        padding: 4rpx 10rpx;
        background: var(--primary-color-alpha-95);
        color: #fff;
        font-size: 20rpx;
        border-radius: 8rpx;
        font-weight: 600;
        backdrop-filter: blur(4rpx);
      }
    }

    .upload-btn {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      background: var(--bg-color-page);
      border-radius: 16rpx;
      border: 2rpx dashed #ddd;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:active {
        background: var(--border-color-light);
        border-color: var(--primary-color);
      }
    }
  }

  .upload-tip {
    display: block;
    margin-top: 16rpx;
    font-size: 22rpx;
    color: var(--text-color-tertiary);
    padding: 0 4rpx;
  }
}

.upload-tip {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: var(--text-color-tertiary);
  padding: 0 4rpx;
}

.form-item {
  position: relative;
  padding: 12rpx 0;

  &.horizontal {
    display: flex;
    align-items: center;
    gap: 24rpx;

    .form-label {
      flex-shrink: 0;
      width: 180rpx;
      font-size: 28rpx;
      color: var(--text-color-primary);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4rpx;

      .required-mark {
        color: var(--error-color);
        font-weight: 600;
      }

      .optional-mark {
        font-size: 22rpx;
        color: var(--text-color-tertiary);
        margin-left: auto;
      }
    }

    .form-content {
      flex: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 12rpx;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }
  }

  &.vertical {
    .form-label {
      font-size: 28rpx;
      color: var(--text-color-primary);
      font-weight: 500;
      margin-bottom: 16rpx;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }
  }

  .textarea-wrapper {
    position: relative;
  }

  .condition-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;

    .condition-option {
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-disabled);
      border-radius: 12rpx;
      font-size: 24rpx;
      color: var(--text-color-secondary);
      border: 2rpx solid transparent;
      transition: all 0.2s;

      &.active {
        background: var(--bg-color-warm);
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
    }
  }

  .input {
    width: 100%;
    height: 72rpx;
    padding: 0 20rpx;
    background: var(--bg-color-disabled);
    border-radius: 12rpx;
    font-size: 28rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &:focus {
      background: var(--bg-color-card);
      border-color: var(--primary-color);
    }
  }

  .textarea {
    width: 100%;
    min-height: 160rpx;
    padding: 16rpx;
    background: var(--bg-color-disabled);
    border-radius: 12rpx;
    font-size: 28rpx;
    line-height: 1.6;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &:focus {
      background: var(--bg-color-card);
      border-color: var(--primary-color);
    }
  }

  .count {
    font-size: 22rpx;
    color: var(--text-color-tertiary);
    padding: 6rpx 12rpx;
    background: var(--bg-color-disabled);
    border-radius: 12rpx;
  }

  .input-wrapper .count,
  .textarea-wrapper .count {
    position: absolute;
    bottom: 8rpx;
    right: 8rpx;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 4rpx 8rpx;
    font-size: 20rpx;
  }

  .value {
    font-size: 28rpx;
    color: var(--text-color-primary);
  }

  .time-range {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .time-picker {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72rpx;
      padding: 0 20rpx;
      background: var(--bg-color-disabled);
      border-radius: 12rpx;
      font-size: 28rpx;
      transition: all 0.2s;

      &:active {
        background: #e8e8e8;
      }
    }

    .time-separator {
      font-size: 28rpx;
      color: var(--text-color-secondary);
      font-weight: 500;
    }
  }

  // 租借类型切换
  .rental-type-toggle {
    display: flex;
    background: var(--bg-color-disabled);
    border-radius: 12rpx;
    padding: 4rpx;
    gap: 4rpx;

    .toggle-option {
      flex: 1;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10rpx;
      font-size: 26rpx;
      color: var(--text-color-secondary);
      font-weight: 500;
      transition: all 0.3s;

      &.active {
        background: var(--bg-color-card);
        color: var(--primary-color);
        font-weight: 600;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }

  // 分类选择器（横向布局）
  .category-selector-inline {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .category-selected-inline {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .category-icon-small {
        width: 40rpx;
        height: 40rpx;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        .category-emoji-small {
          font-size: 20rpx;
        }
      }

      .category-name-text {
        font-size: 26rpx;
        color: var(--text-color-primary);
        font-weight: 500;
      }
    }

    .category-placeholder-inline {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }
  }

  // 成色选择器（横向布局）
  .condition-selector-inline {
    display: flex;
    align-items: center;

    .condition-name-text {
      font-size: 26rpx;
      color: var(--text-color-primary);
      font-weight: 500;
    }

    .condition-placeholder-inline {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }
  }

  // 物品名称选择器（横向布局）
  .title-selector-inline {
    display: flex;
    align-items: center;

    .title-name-text {
      font-size: 26rpx;
      color: var(--text-color-primary);
      font-weight: 500;
      max-width: 400rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .title-placeholder-inline {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }
  }

  // 金额选择器（横向布局）
  .amount-selector-inline {
    display: flex;
    align-items: center;

    .amount-text {
      font-size: 26rpx;
      color: var(--text-color-primary);
      font-weight: 500;
    }

    .amount-placeholder {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }
  }

  // 租借时间选择器（横向布局）
  .rental-time-selector-inline {
    display: flex;
    align-items: center;

    .rental-time-text {
      font-size: 26rpx;
      color: var(--text-color-primary);
      font-weight: 500;
    }

    .rental-time-placeholder {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }
  }

  // 收货方式选择器（横向布局）
  .delivery-method-selector-inline {
    display: flex;
    align-items: center;

    .delivery-method-text {
      font-size: 26rpx;
      color: var(--text-color-primary);
      font-weight: 500;
    }

    .delivery-method-placeholder {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }
  }

  .weekdays {
    display: flex;
    gap: 10rpx;

    .weekday-item {
      width: 80rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-disabled);
      color: var(--text-color-secondary);
      font-size: 26rpx;
      border-radius: 16rpx;
      font-weight: 500;
      transition: all 0.2s;
      border: 2rpx solid transparent;

      &.active {
        background: var(--bg-color-warm);
        color: var(--primary-color);
        border-color: var(--primary-color);
        font-weight: 600;
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .delivery-options {
    display: flex;
    gap: 12rpx;

    .delivery-option {
      flex: 1;
      height: 72rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-disabled);
      border-radius: 24rpx;
      font-size: 24rpx;
      color: var(--text-color-secondary);
      border: 2rpx solid transparent;
      transition: all 0.2s;
      font-weight: 500;

      &.active {
        background: var(--bg-color-warm);
        color: var(--primary-color);
        border-color: var(--primary-color);
        font-weight: 600;
      }

      &:active {
        transform: scale(0.97);
      }
    }
  }

  .mailing-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;

    .mailing-option {
      height: 72rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-disabled);
      border-radius: 16rpx;
      font-size: 22rpx;
      color: var(--text-color-secondary);
      border: 2rpx solid transparent;
      transition: all 0.2s;
      font-weight: 500;

      &.active {
        background: var(--bg-color-warm);
        color: var(--primary-color);
        border-color: var(--primary-color);
        font-weight: 600;
      }

      &:active {
        transform: scale(0.97);
      }
    }
  }

  .clickable {
    cursor: pointer;

    .form-content {
      pointer-events: none; // 让点击事件穿透到父元素
    }
  }

  .placeholder {
    color: var(--text-color-tertiary);
  }
}

.bottom-bar {
  background: var(--bg-color-card);
  border-top: 1px solid var(--border-color-light);
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);

  .button-group {
    display: flex;
    gap: 16rpx;

    .draft-btn {
      flex: 0 0 160rpx;
      height: 88rpx;
      background: var(--bg-color-disabled);
      color: var(--text-color-primary);
      font-size: 26rpx;
      border-radius: 44rpx;
      border: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4rpx;
      transition: all 0.2s;

      &:active {
        transform: scale(0.97);
        background: #e8e8e8;
      }
    }

    .publish-btn {
      flex: 1;
      height: 88rpx;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
      color: #fff;
      font-size: 30rpx;
      border-radius: 44rpx;
      border: none;
      font-weight: 600;
      box-shadow: 0 4rpx 16rpx var(--primary-color-alpha-30);
      transition: all 0.2s;

      &:active {
        transform: scale(0.98);
        box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-30);
      }

      &[disabled] {
        background: var(--bg-color-disabled);
        color: var(--text-color-tertiary);
        box-shadow: none;
      }
    }
  }
}

// 分类选择弹窗
.category-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .category-tabs-wrapper {
    padding: 16rpx 0;
    background: var(--bg-color-card);
    border-bottom: 1px solid var(--border-color-light);
  }

  .category-tabs {
    display: flex;
    white-space: nowrap;
    padding: 0 16rpx;

    .category-tab {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      padding: 12rpx 20rpx;
      margin-right: 12rpx;
      background: var(--bg-color-disabled);
      border-radius: 16rpx;
      border: 2rpx solid transparent;
      transition: all 0.2s;
      min-width: 100rpx;

      &.active {
        background: var(--bg-color-warm);
        border-color: var(--primary-color);
      }

      &:active {
        transform: scale(0.97);
      }

      .tab-icon {
        width: 48rpx;
        height: 48rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        .tab-emoji {
          font-size: 24rpx;
        }
      }

      .tab-name {
        font-size: 24rpx;
        color: var(--text-color-primary);
        font-weight: 500;

        .category-tab.active & {
          color: var(--primary-color);
          font-weight: 600;
        }
      }
    }
  }
}

// 成色选择弹窗
.condition-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .condition-list {
    padding: 16rpx 0;
    max-height: 60vh;
    overflow-y: auto;

    .condition-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx;
      border-bottom: 1px solid #f5f5f5;
      transition: all 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &.active {
        background: #f8f9ff;
      }

      &:active {
        background: var(--border-color-light);
      }

      .condition-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .condition-name {
          font-size: 30rpx;
          font-weight: 500;
          color: var(--text-color-primary);
        }

        .condition-desc {
          font-size: 24rpx;
          color: var(--text-color-tertiary);
        }
      }

      .condition-check {
        margin-left: 16rpx;
      }
    }
  }
}

// 物品名称输入弹窗
.input-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .input-content {
    padding: 24rpx;
    position: relative;

    .popup-textarea {
      width: 100%;
      min-height: 200rpx;
      padding: 16rpx;
      background: var(--bg-color-disabled);
      border-radius: 12rpx;
      font-size: 28rpx;
      line-height: 1.6;
      color: var(--text-color-primary);
    }

    .count-text {
      position: absolute;
      right: 32rpx;
      bottom: 32rpx;
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }

  .popup-footer {
    display: flex;
    gap: 16rpx;
    padding: 16rpx 24rpx 24rpx;
    border-top: 1px solid var(--border-color-light);

    .popup-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      border: none;

      &.cancel-btn {
        background: var(--bg-color-disabled);
        color: var(--text-color-secondary);
      }

      &.confirm-btn {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
        color: #fff;

        &:disabled {
          opacity: 0.5;
        }
      }

      &:active {
        opacity: 0.8;
      }
    }
  }
}

// 金额选择弹窗
.amount-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .amount-content {
    padding: 24rpx;
    max-height: 50vh;
    overflow-y: auto;

    .quick-amounts {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16rpx;
      margin-bottom: 24rpx;

      .amount-item {
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color-disabled);
        border-radius: 12rpx;
        font-size: 28rpx;
        color: var(--text-color-primary);
        font-weight: 500;
        border: 2rpx solid transparent;
        transition: all 0.2s;

        &.active {
          background: var(--bg-color-warm);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        &:active {
          transform: scale(0.97);
        }
      }
    }

    .custom-amount {
      display: flex;
      align-items: center;
      gap: 16rpx;
      padding: 16rpx;
      background: var(--bg-color-disabled);
      border-radius: 12rpx;

      .custom-label {
        font-size: 26rpx;
        color: var(--text-color-secondary);
        white-space: nowrap;
      }

      .custom-input {
        flex: 1;
        font-size: 28rpx;
        color: var(--text-color-primary);
      }

      .currency-text {
        font-size: 26rpx;
        color: var(--text-color-tertiary);
        white-space: nowrap;
      }
    }
  }

  .popup-footer {
    display: flex;
    gap: 16rpx;
    padding: 16rpx 24rpx 24rpx;
    border-top: 1px solid var(--border-color-light);

    .popup-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      border: none;

      &.cancel-btn {
        background: var(--bg-color-disabled);
        color: var(--text-color-secondary);
      }

      &.confirm-btn {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
        color: #fff;

        &:disabled {
          opacity: 0.5;
        }
      }

      &:active {
        opacity: 0.8;
      }
    }
  }
}

// 租借时间选择弹窗
.rental-time-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .rental-type-toggle-wrapper {
    display: flex;
    background: var(--bg-color-disabled);
    border-radius: 12rpx;
    padding: 4rpx;
    gap: 4rpx;
    margin: 16rpx 24rpx;

    .toggle-option {
      flex: 1;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10rpx;
      font-size: 26rpx;
      color: var(--text-color-secondary);
      font-weight: 500;
      transition: all 0.3s;

      &.active {
        background: var(--bg-color-card);
        color: var(--primary-color);
        font-weight: 600;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
      }
    }
  }

  .rental-time-content {
    padding: 16rpx 24rpx;

    .time-input-group {
      .time-label {
        display: block;
        font-size: 28rpx;
        color: var(--text-color-secondary);
        margin-bottom: 16rpx;
      }

      .time-input-wrapper {
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 16rpx;
        background: var(--bg-color-disabled);
        border-radius: 12rpx;

        .time-input {
          flex: 1;
          font-size: 32rpx;
          color: var(--text-color-primary);
          font-weight: 600;
        }

        .time-unit {
          font-size: 26rpx;
          color: var(--text-color-tertiary);
        }
      }
    }
  }

  .popup-footer {
    display: flex;
    gap: 16rpx;
    padding: 16rpx 24rpx 24rpx;
    border-top: 1px solid var(--border-color-light);

    .popup-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      border: none;

      &.cancel-btn {
        background: var(--bg-color-disabled);
        color: var(--text-color-secondary);
      }

      &.confirm-btn {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
        color: #fff;

        &:disabled {
          opacity: 0.5;
        }
      }

      &:active {
        opacity: 0.8;
      }
    }
  }
}

// 收货方式选择弹窗
.delivery-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .delivery-content {
    padding: 20rpx 24rpx 8rpx;
    max-height: 60vh;
    overflow-y: auto;

    .delivery-option-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx;
      margin-bottom: 16rpx;
      border: 2rpx solid var(--border-color-light);
      border-radius: 18rpx;
      background: var(--bg-color-card);
      transition: all 0.2s;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);

      &:last-child {
        margin-bottom: 0;
      }

      &.active {
        background: var(--primary-color-alpha-5);
        border-color: var(--primary-color);
        box-shadow: 0 8rpx 22rpx var(--primary-color-alpha-10);

        .delivery-option-icon {
          background: var(--primary-color-alpha-12);
          transform: scale(1.04);
        }

        .delivery-option-title {
          color: var(--primary-color);
          font-weight: 700;
        }
      }

      &:active {
        transform: scale(0.98);
      }

      .delivery-option-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 16rpx;

        .delivery-option-icon {
          width: 60rpx;
          height: 60rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16rpx;
          background: var(--bg-color-page);
          font-size: 36rpx;
          transition: all 0.2s;
        }

        .delivery-option-text {
          display: flex;
          flex-direction: column;
          gap: 4rpx;

          .delivery-option-title {
            font-size: 30rpx;
            font-weight: 500;
            color: var(--text-color-primary);
          }

          .delivery-option-desc {
            font-size: 24rpx;
            color: var(--text-color-tertiary);
          }
        }
      }

      .delivery-option-check {
        margin-left: 16rpx;
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        background: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
      }
    }

    .mailing-sub-options {
      margin: -4rpx 0 16rpx 32rpx;
      padding: 8rpx 0 8rpx 24rpx;
      border-left: 4rpx solid var(--primary-color-alpha-20);
      background: transparent;

      .mailing-option-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20rpx 20rpx;
        margin-bottom: 10rpx;
        border: 2rpx solid transparent;
        border-radius: 14rpx;
        background: var(--bg-color-page);
        transition: all 0.2s;

        &:last-child {
          margin-bottom: 0;
        }

        &.active {
          background: var(--primary-color-alpha-8);
          border-color: var(--primary-color-alpha-30);

          .mailing-option-title {
            color: var(--primary-color);
            font-weight: 700;
          }
        }

        &:active {
          transform: scale(0.98);
        }

        .mailing-option-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12rpx;

          .mailing-option-icon {
            font-size: 28rpx;
          }

          .mailing-option-title {
            font-size: 28rpx;
            font-weight: 500;
            color: var(--text-color-primary);
          }
        }

        .mailing-option-check {
          margin-left: 16rpx;
          width: 34rpx;
          height: 34rpx;
          border-radius: 50%;
          background: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .delivery-fee-input {
        display: flex;
        align-items: center;
        gap: 12rpx;
        padding: 16rpx;
        margin-top: 12rpx;
        background: var(--bg-color-disabled);
        border-radius: 12rpx;

        .fee-label {
          font-size: 26rpx;
          color: var(--text-color-secondary);
          white-space: nowrap;
        }

        .fee-input {
          flex: 1;
          font-size: 28rpx;
          color: var(--text-color-primary);
        }

        .fee-unit {
          font-size: 26rpx;
          color: var(--text-color-tertiary);
          white-space: nowrap;
        }
      }
    }
  }

  .popup-footer {
    display: flex;
    gap: 16rpx;
    padding: 16rpx 24rpx 24rpx;
    border-top: 1px solid var(--border-color-light);

    .popup-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      border: none;

      &.cancel-btn {
        background: var(--bg-color-disabled);
        color: var(--text-color-secondary);
      }

      &.confirm-btn {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
        color: #fff;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }
}

// 快捷操作弹窗
.quick-action-popup {
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .quick-action-list {
    max-height: 70vh;
    padding: 16rpx 0;

    .action-group {
      margin-bottom: 24rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .group-title {
        display: block;
        padding: 12rpx 24rpx;
        font-size: 24rpx;
        font-weight: 600;
        color: var(--text-color-secondary);
        background: var(--bg-color-disabled);
      }

      .action-items {
        padding: 8rpx 0;

        .quick-action-item {
          display: flex;
          align-items: center;
          gap: 16rpx;
          padding: 20rpx 24rpx;
          transition: background 0.2s;

          &:active {
            background: var(--bg-color-disabled);
          }

          .action-icon {
            width: 64rpx;
            height: 64rpx;
            font-size: 32rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-color-disabled);
            border-radius: 16rpx;
          }

          .action-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4rpx;

            .action-title {
              font-size: 28rpx;
              font-weight: 500;
              color: var(--text-color-primary);
            }

            .action-desc {
              font-size: 20rpx;
              color: var(--text-color-tertiary);
            }
          }
        }
      }
    }
  }
}

// ========== 页面进入动画 ==========

// 内容区块动画
.animated-section {
  opacity: 0;
  animation: slideInUpFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

// 底部按钮栏动画
.animated-bottom-bar {
  opacity: 0;
  animation: slideInUpFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s forwards;
}

// 向上滑入淡入动画
@keyframes slideInUpFade {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 为已有动画的元素保持动画效果
.animated-section,
.animated-bottom-bar {
  // 确保动画只在进入时播放一次
  animation-fill-mode: forwards;
}

// 预览弹窗
.preview-popup {
  width: 640rpx;
  max-height: 80vh;
  background: var(--bg-color-card);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid var(--border-color-light);
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }

    .close-btn {
      position: absolute;
      right: 24rpx;
      padding: 8rpx;
    }
  }

  .preview-content {
    flex: 1;
    padding: 24rpx;
    max-height: 60vh;

    .preview-card {
      background: var(--bg-color-disabled);
      border-radius: 16rpx;
      overflow: hidden;

      .card-swiper {
        width: 100%;
        height: 400rpx;

        .card-image {
          width: 100%;
          height: 100%;
        }

        .card-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-color-card);
          gap: 16rpx;

          .placeholder-text {
            font-size: 24rpx;
            color: var(--text-color-tertiary);
          }
        }
      }

      .card-content {
        padding: 20rpx;

        .card-price {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 16rpx;

          .price-main {
            display: flex;
            align-items: baseline;
            gap: 4rpx;

            .price-symbol {
              font-size: 28rpx;
              color: var(--primary-color);
              font-weight: 600;
            }

            .price-value {
              font-size: 40rpx;
              color: var(--primary-color);
              font-weight: 600;
            }

            .price-unit {
              font-size: 24rpx;
              color: var(--text-color-tertiary);
            }
          }

          .price-deposit {
            font-size: 24rpx;
            color: var(--text-color-secondary);
          }
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 12rpx;
          margin-bottom: 12rpx;

          text {
            flex: 1;
            font-size: 32rpx;
            font-weight: 600;
            color: var(--text-color-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .condition-tag {
            padding: 4rpx 12rpx;
            background: #f0f5ff;
            color: var(--info-color);
            font-size: 20rpx;
            border-radius: 8rpx;
            flex-shrink: 0;
          }
        }

        .card-desc {
          margin-bottom: 16rpx;

          text {
            font-size: 24rpx;
            color: var(--text-color-secondary);
            line-height: 1.6;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 12rpx;
          margin-bottom: 16rpx;

          .tag-item {
            display: flex;
            align-items: center;
            gap: 4rpx;
            font-size: 20rpx;
            color: var(--text-color-secondary);
          }
        }

        .category-tag {
          display: inline-block;
          padding: 6rpx 16rpx;
          background: var(--bg-color-warm);
          color: var(--primary-color);
          font-size: 20rpx;
          border-radius: 24rpx;
        }
      }
    }

    .preview-tips {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-top: 24rpx;
      padding: 12rpx 16rpx;
      background: #f0f5ff;
      border-radius: 12rpx;

      .tips-icon {
        font-size: 28rpx;
      }

      .tips-text {
        flex: 1;
        font-size: 20rpx;
        color: var(--info-color);
      }
    }
  }

  .preview-footer {
    padding: 16rpx 24rpx;
    border-top: 1px solid var(--border-color-light);

    .preview-close-btn {
      width: 100%;
      height: 80rpx;
      background: var(--bg-color-disabled);
      color: var(--text-color-primary);
      font-size: 28rpx;
      border-radius: 40rpx;
      border: none;
    }
  }
}

// 弹窗层级设置
:deep(.uni-popup) {
  z-index: 9999 !important;
}

:deep(.uni-popup__wrapper) {
  z-index: 9999 !important;
}
</style>
