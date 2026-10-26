<template>
  <view class="publish-page" :style="themeStyle">
    <!-- 草稿保存提示 -->
    <view v-if="draftStatus.show" class="draft-toast" :class="{ saving: draftStatus.saving }">
      <view class="draft-icon">
        <text v-if="draftStatus.saving" class="loading-spinner"></text>
        <text v-else class="check-small">✓</text>
      </view>
      <text class="draft-text">{{ draftStatus.saving ? '保存中...' : '草稿已保存' }}</text>
    </view>

    <!-- 悬浮球组 -->
    <FloatingBalls
      currentPage="market"
      :draftCount="draftCount"
      :isSaving="draftStatus.saving"
      :saveSuccess="saveSuccess"
      @switchMode="handleModeSwitch"
      @preview="showPreviewModal"
      @reset="resetAll"
      @saveDraft="manualSaveDraft"
      @drafts="goToDrafts"
    />

    <scroll-view class="scroll-view" scroll-y>
      <!-- 基本信息 -->
      <view class="card animated-section" style="animation-delay: 0ms;">
        <view class="form-item horizontal clickable" @click="openTitlePopup">
          <view class="form-label">
            <text>商品标题</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="title-selector-inline">
              <text v-if="form.title" class="title-name-text">{{ form.title }}</text>
              <text v-else class="title-placeholder-inline">请输入商品标题</text>
            </view>
            <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
          </view>
        </view>

        <view class="form-item horizontal clickable" @click="openConditionPopup()">
          <view class="form-label">
            <text>商品成色</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="condition-selector-inline">
              <text v-if="form.condition" class="condition-name-text">{{ CONDITIONS.find(c => c.value === form.condition)?.label || form.condition }}</text>
              <text v-else class="condition-placeholder-inline">请选择成色</text>
            </view>
            <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
          </view>
        </view>

        <view class="form-item horizontal clickable" @click="showCategoryPicker = true">
          <view class="form-label">
            <text>商品分类</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="category-selector-inline">
              <text v-if="form.categoryName" class="category-name-text">{{ form.categoryName }}</text>
              <text v-else class="category-placeholder-inline">请选择分类</text>
            </view>
            <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
          </view>
        </view>

        <!-- 图片上传 -->
        <view class="image-upload-section">
          <view class="image-grid">
            <view v-for="(image, index) in images" :key="index" class="image-item">
              <image class="preview-image" :src="getDisplayImageUrl(image)" mode="aspectFill" @click="previewImage(index)" />
              <view class="delete-btn" @click.stop="removeImage(index)">
                <uni-icons type="close" size="16" color="var(--text-color-inverse)" />
              </view>
              <view v-if="index === 0" class="cover-tag">封面</view>
            </view>
            <view v-if="images.length < 9" class="upload-btn" @click="chooseImage">
              <uni-icons type="camera" size="40" color="var(--text-color-tertiary)" />
            </view>
          </view>
          <text class="upload-tip">支持jpg、png格式，单张图片不超过5MB</text>
        </view>

        <!-- 商品描述 -->
        <view class="form-item vertical">
          <view class="form-label">商品描述</view>
          <view class="textarea-wrapper">
            <textarea
              class="textarea"
              v-model="form.description"
              placeholder="请详细描述商品的品牌、型号、入手渠道、转手原因等"
              maxlength="500"
              placeholder-style="color: var(--text-color-tertiary)"
            />
            <text class="count">{{ form.description.length }}/500</text>
          </view>
        </view>
      </view>

      <!-- 价格信息 -->
      <view class="card animated-section" :class="{ 'has-error': errors.price }" style="animation-delay: 140ms;">
        <view class="form-item horizontal clickable" @click="openPricePopup">
          <view class="form-label">
            <text>价格设置</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-content">
            <view class="price-display-inline">
              <text v-if="form.price" class="price-main-text">¥{{ form.price }}</text>
              <text v-else class="price-placeholder-text">请设置价格</text>
              <text v-if="form.originalPrice && discountPercent > 0" class="price-discount-text">原价¥{{ form.originalPrice }}</text>
            </view>
            <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
          </view>
        </view>
      </view>

      <!-- 其他选项 -->
      <view class="card animated-section" style="animation-delay: 210ms;">
        <view class="form-item horizontal clickable" @click="openDeliveryMethodPopup">
          <view class="form-label">
            <text>交易方式</text>
          </view>
          <view class="form-content">
            <view class="delivery-method-display">
              <text v-if="!form.canDelivery" class="delivery-text">仅自提</text>
              <text v-else-if="form.freeShipping" class="delivery-text">邮寄包邮</text>
              <text v-else class="delivery-text">按距离收费 ¥{{ form.deliveryFee || '0' }}</text>
            </view>
            <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
          </view>
        </view>
      </view>

      <!-- 交易位置 - 仅在自提时显示 -->
      <view v-if="!form.canDelivery" class="card animated-section" style="animation-delay: 280ms;">
        <view class="form-item horizontal clickable" @click="openLocationPopup">
          <view class="form-label">
            <text>交易位置</text>
          </view>
          <view class="form-content">
            <text v-if="form.locationName" class="value-text">{{ form.locationName }}</text>
            <text v-else class="value-placeholder">请选择自提位置</text>
            <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
          </view>
        </view>
      </view>

      <!-- 邮寄提示 -->
      <view v-else class="card animated-section mail-hint-card" style="animation-delay: 280ms;">
        <view class="form-item horizontal">
          <view class="form-label">
            <text>交易位置</text>
          </view>
          <view class="form-content">
            <text class="mail-hint-text">📦 邮寄商品无需选择位置</text>
          </view>
        </view>
      </view>

      <!-- 秒杀配置 -->
      <view id="section-flash" class="card animated-section" style="animation-delay: 350ms;">
        <view class="form-item horizontal clickable" @click="openFlashSalePopup">
          <view class="form-label">
            <text>秒杀配置</text>
          </view>
          <view class="form-content">
            <view class="flash-sale-display">
              <text v-if="!form.isFlashSale" class="flash-status-text">未开启</text>
              <text v-else class="flash-status-text active">已开启</text>
              <text v-if="form.isFlashSale && form.flashPrice" class="flash-price-text">¥{{ form.flashPrice }}</text>
            </view>
            <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
          </view>
        </view>
      </view>

      <!-- 发布提示 -->
      <view class="tips-section animated-section" style="animation-delay: 400ms;">
        <text class="tips-title">发布须知</text>
        <view class="tips-list">
          <text class="tip-item">• 请确保商品信息真实有效</text>
          <text class="tip-item">• 禁止发布违禁品和虚假信息</text>
          <text class="tip-item">• 图片应清晰展示商品实际情况</text>
          <text class="tip-item">• 发布后可在"我的发布"中管理</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="bottom-bar animated-bottom-bar">
      <view class="bar-actions">
        <button class="publish-btn" :class="{ disabled: !isFormValid }" :disabled="!isFormValid" @click="handlePublish">
          {{ publishButtonText }}
        </button>
      </view>
      <view class="bar-info">
        <text class="bar-text">发布即表示同意</text>
        <text class="bar-link">《用户协议》</text>
      </view>
    </view>

    <!-- 秒杀配置弹窗 -->
    <uni-popup ref="flashSalePopup" type="bottom" :safe-area="false">
      <view class="flash-sale-popup popup-animate-in">
        <view class="popup-header">
          <text class="popup-title">秒杀配置</text>
          <view class="close-btn" @click="closeFlashSalePopup">
            <uni-icons type="close" size="20" color="var(--text-color-secondary)" />
          </view>
        </view>

        <scroll-view class="flash-sale-content" scroll-y>
          <!-- 开关 -->
          <view class="flash-toggle-item">
            <view class="flash-toggle-info">
              <text class="flash-toggle-icon">⚡</text>
              <view class="flash-toggle-text">
                <text class="flash-toggle-label">开启秒杀</text>
                <text class="flash-toggle-desc">商品将以秒杀价格展示</text>
              </view>
            </view>
            <switch :checked="form.isFlashSale" :color="dangerColor" @change="toggleFlashSale" />
          </view>

          <template v-if="form.isFlashSale">
            <!-- 场次选择 -->
            <view class="flash-config-item clickable" @click="openSessionPicker">
              <text class="flash-config-label">秒杀场次 <text class="required-mark">*</text></text>
              <view class="flash-config-value">
                <text :class="{ placeholder: !form.sessionId }">
                  {{ getSelectedSessionName() || '请选择场次' }}
                </text>
                <uni-icons type="right" size="14" color="var(--text-color-tertiary)" />
              </view>
            </view>

            <!-- 秒杀价格 -->
            <view class="flash-config-item">
              <text class="flash-config-label">秒杀价格 <text class="required-mark">*</text></text>
              <view class="flash-price-input">
                <text class="flash-price-symbol">¥</text>
                <input
                  class="flash-price-input-field"
                  v-model="form.flashPrice"
                  type="digit"
                  placeholder="请输入秒杀价格"
                  placeholder-style="color: var(--text-color-tertiary)"
                />
              </view>
            </view>

            <!-- 秒杀库存 -->
            <view class="flash-config-item">
              <text class="flash-config-label">秒杀库存 <text class="required-mark">*</text></text>
              <view class="flash-stock-input">
                <input
                  class="flash-stock-input-field"
                  v-model="form.flashSaleStock"
                  type="number"
                  placeholder="请输入库存数量"
                  placeholder-style="color: var(--text-color-tertiary)"
                />
                <text class="flash-stock-unit">件</text>
              </view>
            </view>

            <!-- 每人限购 -->
            <view class="flash-config-item">
              <text class="flash-config-label">每人限购</text>
              <view class="flash-stock-input">
                <input
                  class="flash-stock-input-field"
                  v-model="form.limitPerUser"
                  type="number"
                  placeholder="限购数量"
                  placeholder-style="color: var(--text-color-tertiary)"
                />
                <text class="flash-stock-unit">件</text>
              </view>
            </view>

            <!-- 重复类型 -->
            <view class="flash-config-item">
              <text class="flash-config-label">重复类型</text>
              <view class="flash-repeat-options">
                <view
                  class="repeat-option"
                  :class="{ active: form.repeatType === 1 }"
                  @click="form.repeatType = 1"
                >
                  <text class="repeat-option-text">每日重复</text>
                  <text class="repeat-option-desc">每天参与，库存自动重置</text>
                </view>
                <view
                  class="repeat-option"
                  :class="{ active: form.repeatType === 0 }"
                  @click="form.repeatType = 0"
                >
                  <text class="repeat-option-text">仅一次</text>
                  <text class="repeat-option-desc">只在指定日期参与</text>
                </view>
              </view>
            </view>

            <!-- 秒杀日期（仅当 repeatType=0 时显示） -->
            <view v-if="form.repeatType === 0" class="flash-config-item">
              <text class="flash-config-label">秒杀日期 <text class="required-mark">*</text></text>
              <view class="flash-date-picker" @click="openDatePicker">
                <text :class="{ 'date-placeholder': !form.saleDate }">
                  {{ form.saleDate || '请选择秒杀日期' }}
                </text>
                <uni-icons type="calendar" size="18" color="var(--text-color-tertiary)" />
              </view>
            </view>

            <!-- 折扣预览 -->
            <view v-if="parseFloat(flashDiscountPercent) > 0" class="flash-discount-preview">
              <text class="flash-discount-icon">↓</text>
              <text class="flash-discount-text">秒杀折扣：{{ flashDiscountPercent }}折</text>
              <text class="flash-discount-sub">节省 ¥{{ calculateSavings() }}</text>
            </view>
          </template>
        </scroll-view>

        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closeFlashSalePopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmFlashSaleConfig">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 分类选择器 -->
    <view v-if="showCategoryPicker" class="picker-overlay" @click.self="showCategoryPicker = false">
      <view class="picker-content category-picker" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择分类</text>
          <text class="picker-close" @click="showCategoryPicker = false">✕</text>
        </view>
        <scroll-view class="picker-list" scroll-y>
          <view
            v-for="category in categories"
            :key="category.categoryId || (category as any).id"
            class="picker-item"
            :class="{ active: form.categoryId === String(category.categoryId || (category as any).id) }"
            @click="selectCategory(category)"
          >
            <text class="picker-item-name">{{ category.name }}</text>
            <text v-if="form.categoryId === String(category.categoryId || (category as any).id)" class="picker-item-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 成色选择弹窗 -->
    <uni-popup ref="conditionPopup" type="bottom" :safe-area="false">
      <view class="condition-popup popup-animate-in">
        <view class="popup-header">
          <text class="popup-title">选择成色</text>
          <view class="close-btn" @click="closeConditionPopup">
            <uni-icons type="close" size="20" color="var(--text-color-secondary)" />
          </view>
        </view>

        <!-- 成色选项列表 -->
        <view class="condition-list">
          <view
            v-for="condition in CONDITIONS"
            :key="condition.value"
            class="condition-item"
            :class="{ active: form.condition === condition.value }"
            @click="selectCondition(condition)"
          >
            <text class="condition-name">{{ condition.label }}</text>
            <view class="condition-check" v-if="form.condition === condition.value">
              <uni-icons type="checkmarkempty" size="20" :color="primaryColor" />
            </view>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 位置选择弹窗 -->
    <uni-popup ref="locationPopup" type="bottom" :safe-area="false" :mask-click="true">
      <view class="location-popup popup-animate-in">
        <view class="popup-header">
          <text class="popup-title">选择交易位置</text>
          <view class="close-btn" @click="closeLocationPopup">
            <uni-icons type="close" size="20" color="var(--text-color-secondary)" />
          </view>
        </view>

        <!-- 自定义输入 -->
        <view class="location-section">
          <text class="location-section-title">自定义位置</text>
          <view class="custom-input-wrapper">
            <view class="custom-input-box">
              <uni-icons type="location" size="18" color="var(--text-color-tertiary)" />
              <input
                class="custom-input"
                v-model="customLocationInput"
                type="text"
                placeholder="输入自定义位置名称"
                placeholder-style="color: var(--text-color-tertiary)"
                @input="onCustomLocationInput"
              />
              <view v-if="customLocationInput" class="clear-input-btn" @click="clearCustomInput">
                <uni-icons type="clear" size="16" color="var(--text-color-tertiary)" />
              </view>
            </view>
            <button
              class="confirm-custom-btn"
              :class="{ disabled: !customLocationInput.trim() }"
              :disabled="!customLocationInput.trim()"
              @click="confirmCustomLocation"
            >
              确定
            </button>
          </view>
        </view>

        <!-- 常用位置列表 -->
        <view class="location-content">
          <view class="location-section">
            <text class="location-section-title">常用位置</text>
            <view class="location-list">
              <view
                v-for="loc in commonLocations"
                :key="loc.name"
                class="location-item"
                :class="{ active: form.locationName === loc.name }"
                @click="selectCommonLocation(loc)"
              >
                <view class="location-item-icon">
                  <uni-icons :type="loc.icon" size="20" color="var(--text-color-secondary)" />
                </view>
                <view class="location-item-info">
                  <text class="location-item-name">{{ loc.name }}</text>
                  <text class="location-item-desc">{{ loc.address }}</text>
                </view>
                <view class="location-item-check" v-if="form.locationName === loc.name">
                  <uni-icons type="checkmarkempty" size="20" :color="primaryColor" />
                </view>
              </view>
            </view>
          </view>

          <!-- 打开地图选项 -->
          <view class="location-section map-section">
            <view class="map-option" @click="openMapSelector">
              <view class="map-option-icon">
                <uni-icons type="location" size="22" :color="primaryColor" />
              </view>
              <view class="map-option-info">
                <text class="map-option-title">打开地图精确定位</text>
                <text class="map-option-desc">在地图上选择精确位置</text>
              </view>
              <view class="map-option-arrow">
                <uni-icons type="right" size="16" color="var(--text-color-tertiary)" />
              </view>
            </view>
          </view>

          <!-- 清除位置 -->
          <view v-if="form.locationName" class="location-section">
            <view class="clear-location-btn" @click="clearLocation">
              <text class="clear-location-text">清除已选位置</text>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 地图选择弹窗 -->
    <uni-popup ref="mapSelectorPopup" type="center" :safe-area="false">
      <view class="map-selector-popup popup-scale-animate">
        <view class="map-popup-header">
          <text class="map-popup-title">选择地图位置</text>
          <view class="map-close-btn" @click="closeMapSelector">
            <uni-icons type="close" size="20" color="var(--text-color-secondary)" />
          </view>
        </view>

        <view class="map-container">
          <map
            id="locationMap"
            :longitude="mapCenter.longitude"
            :latitude="mapCenter.latitude"
            :scale="16"
            :markers="mapMarkers"
            :show-location="true"
            :enable-traffic="false"
            @tap="onMapTap"
            class="map-component"
          />
        </view>

        <view class="map-location-info">
          <view class="location-info-icon">
            <uni-icons type="location" size="18" :color="primaryColor" />
          </view>
          <view class="location-info-text">
            <text class="location-info-name">{{ selectedLocation.name || '请在地图上点击选择位置' }}</text>
            <text v-if="selectedLocation.address" class="location-info-address">{{ selectedLocation.address }}</text>
          </view>
        </view>

        <view class="map-popup-footer">
          <button class="map-btn cancel-map-btn" @click="closeMapSelector">取消</button>
          <button class="map-btn confirm-map-btn" @click="confirmMapLocation">确认位置</button>
        </view>
      </view>
    </uni-popup>

    <!-- 售价输入弹窗 -->
    <uni-popup ref="pricePopup" type="bottom" :safe-area="false">
      <view class="amount-popup popup-animate-in">
        <view class="popup-header">
          <text class="popup-title">售价</text>
          <view class="close-btn" @click="closePricePopup">
            <uni-icons type="close" size="20" color="var(--text-color-secondary)" />
          </view>
        </view>
        <view class="amount-content">
          <view class="amount-input-wrapper">
            <text class="amount-symbol">¥</text>
            <input
              class="amount-input"
              v-model="tempPrice"
              type="digit"
              placeholder="请输入售价"
              placeholder-style="color: var(--text-color-tertiary)"
              focus
            />
          </view>
          <view class="quick-amounts">
            <view
              v-for="amount in ['10', '50', '100', '200', '500', '1000']"
              :key="amount"
              class="amount-item"
              :class="{ active: tempPrice === amount }"
              @click="tempPrice = amount"
            >
              <text class="amount-item-text">¥{{ amount }}</text>
            </view>
          </view>

          <!-- 原价输入 -->
          <view class="original-price-section">
            <text class="original-price-label">原价（选填）</text>
            <view class="amount-input-wrapper small">
              <text class="amount-symbol">¥</text>
              <input
                class="amount-input"
                v-model="tempOriginalPrice"
                type="digit"
                placeholder="请输入原价"
                placeholder-style="color: var(--text-color-tertiary)"
              />
            </view>
            <view v-if="tempOriginalPrice && tempPrice && parseFloat(tempOriginalPrice) > parseFloat(tempPrice)" class="discount-preview">
              <text class="discount-preview-text">省 {{ Math.round((parseFloat(tempOriginalPrice) - parseFloat(tempPrice)) / parseFloat(tempOriginalPrice) * 100) }}%</text>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @click="closePricePopup">取消</button>
          <button class="popup-btn confirm-btn" @click="confirmPrice" :disabled="!tempPrice">确认</button>
        </view>
      </view>
    </uni-popup>

    <!-- 商品标题输入弹窗 -->
    <uni-popup ref="titlePopup" type="bottom" :safe-area="false">
      <view class="input-popup popup-animate-in">
        <view class="popup-header">
          <text class="popup-title">商品标题</text>
          <view class="close-btn" @click="closeTitlePopup">
            <uni-icons type="close" size="20" color="var(--text-color-secondary)" />
          </view>
        </view>
        <view class="input-content">
          <textarea
            class="popup-textarea"
            v-model="tempTitle"
            placeholder="请输入商品标题"
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

    <!-- 秒杀场次选择器 -->
    <view v-if="showSessionPicker" class="picker-overlay session-picker-overlay" @click.self="showSessionPicker = false">
      <view class="picker-content session-picker" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择秒杀场次</text>
          <text class="picker-close" @click="showSessionPicker = false">✕</text>
        </view>
        <scroll-view class="picker-list" scroll-y>
          <view v-if="flashSaleSessions.length === 0" class="picker-empty">
            <text class="empty-text">暂无秒杀场次</text>
          </view>
          <view
            v-else
            v-for="session in flashSaleSessions"
            :key="session.sessionId"
            class="picker-item session-item"
            :class="{ active: form.sessionId === session.sessionId }"
            @click="selectSession(session)"
          >
            <view class="session-info">
              <text class="session-time">{{ session.time }}</text>
              <text class="session-period">{{ formatSessionTime(session) }}</text>
            </view>
            <text v-if="form.sessionId === session.sessionId" class="picker-item-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 交易方式选择弹窗 -->
    <uni-popup ref="deliveryMethodPopup" type="bottom" :safe-area="false">
      <view class="delivery-popup popup-animate-in">
        <view class="popup-header">
          <text class="popup-title">交易方式</text>
          <view class="close-btn" @click="closeDeliveryMethodPopup">
            <uni-icons type="close" size="20" color="var(--text-color-secondary)" />
          </view>
        </view>
        <view class="delivery-content">
          <view
            class="delivery-option-item"
            :class="{ active: !form.canDelivery }"
            @click="selectDeliveryMethod('pickup')"
          >
            <view class="delivery-option-info">
              <text class="delivery-option-icon">📍</text>
              <view class="delivery-option-text">
                <text class="delivery-option-title">仅自提</text>
                <text class="delivery-option-desc">买家上门取件</text>
              </view>
            </view>
            <view class="delivery-option-check" v-if="!form.canDelivery">
              <uni-icons type="checkmarkempty" size="20" :color="primaryColor" />
            </view>
          </view>
          <view
            class="delivery-option-item"
            :class="{ active: form.canDelivery && !form.freeShipping }"
            @click="selectDeliveryMethod('mailing'); selectMailingType('cod')"
          >
            <view class="delivery-option-info">
              <text class="delivery-option-icon">📦</text>
              <view class="delivery-option-text">
                <text class="delivery-option-title">按距离收费</text>
                <text class="delivery-option-desc">快递发货，按距离计算运费</text>
              </view>
            </view>
            <view class="delivery-option-check" v-if="form.canDelivery && !form.freeShipping">
              <uni-icons type="checkmarkempty" size="20" :color="primaryColor" />
            </view>
          </view>

          <!-- 邮费输入 -->
          <view v-if="form.canDelivery && !form.freeShipping" class="delivery-fee-input">
            <text class="delivery-fee-label">邮费</text>
            <view class="fee-input-wrapper">
              <text class="fee-symbol">¥</text>
              <input
                class="fee-input"
                v-model="form.deliveryFee"
                type="digit"
                placeholder="请输入邮费"
                placeholder-style="color: var(--text-color-tertiary)"
              />
            </view>
            <text class="fee-unit">元</text>
          </view>

          <view
            class="delivery-option-item"
            :class="{ active: form.canDelivery && form.freeShipping }"
            @click="selectDeliveryMethod('mailing'); selectMailingType('free')"
          >
            <view class="delivery-option-info">
              <text class="delivery-option-icon">🎁</text>
              <view class="delivery-option-text">
                <text class="delivery-option-title">邮寄包邮</text>
                <text class="delivery-option-desc">快递发货，卖家包邮</text>
              </view>
            </view>
            <view class="delivery-option-check" v-if="form.canDelivery && form.freeShipping">
              <uni-icons type="checkmarkempty" size="20" :color="primaryColor" />
            </view>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 商品预览弹窗 -->
    <view v-if="showPreview" class="preview-overlay" @click.self="showPreview = false">
      <view class="preview-modal" @click.stop>
        <view class="preview-header">
          <text class="preview-title">商品预览</text>
          <text class="preview-close" @click="showPreview = false">✕</text>
        </view>
        <scroll-view class="preview-content" scroll-y>
          <view class="product-card-preview">
            <view class="preview-image-wrapper">
              <image class="preview-image" :src="getDisplayImageUrl(images[0])" mode="aspectFill" />
              <view v-if="form.isFlashSale" class="flash-tag">秒杀</view>
            </view>
            <view class="preview-info">
              <text class="preview-title-text">{{ form.title || '商品标题' }}</text>
              <view class="preview-price-row">
                <text class="preview-price">¥{{ form.price || '0.00' }}</text>
                <text v-if="form.originalPrice" class="preview-original">¥{{ form.originalPrice }}</text>
                <text v-if="discountPercent > 0" class="preview-discount">{{ discountPercent }}%OFF</text>
              </view>
              <view class="preview-meta">
                <text class="preview-condition">{{ CONDITIONS.find(c => c.value === form.condition)?.label || form.condition }}</text>
                <text class="preview-location" v-if="form.locationName">{{ form.locationName }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
    <view v-if="showCategoryPicker" class="category-picker-overlay" @click.self="showCategoryPicker = false">
      <view class="category-picker-content" @click.stop>
        <view class="picker-header">
          <text class="picker-title">选择分类</text>
          <text class="picker-close" @click="showCategoryPicker = false">✕</text>
        </view>
        <scroll-view class="category-list" scroll-y>
          <view
            v-for="category in categories"
            :key="category.categoryId || (category as any).id"
            class="category-item"
            :class="{ active: form.categoryId === String(category.categoryId || (category as any).id) }"
            @click="selectCategory(category)"
          >
            <text class="category-name">{{ category.name }}</text>
            <text v-if="form.categoryId === String(category.categoryId || (category as any).id)" class="category-check">✓</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { productApi } from '@/api/product'
import { categoryApi } from '@/api/category'
import { activityApi, type FlashSaleSession } from '@/api/activity'
import { checkSensitiveWord, SensitiveCheckType } from '@/utils/sensitive-word'
import { useUserStore } from '@/store/user'
import type { Category } from '@/types'
import { uploadImage, normalizeImageUrl } from '@/utils/image'
import { useThemeColors, useThemePage, useThemeStyle } from '@/utils/theme'
import { checkAuth } from '@/utils/auth'
// @ts-ignore
import FloatingBalls from '@/components/floating-balls/floating-balls.vue'

const { primaryColor, dangerColor } = useThemeColors()
const { themeStyle } = useThemeStyle()
const userStore = useUserStore()

// 草稿状态
const draftCount = ref(0)

// 常量
const STORAGE_KEY = 'product_publish_draft'
// 成色选项
const CONDITIONS = [
  { value: 'new', label: '全新' },
  { value: 'almost_new', label: '几乎全新' },
  { value: 'lightly_used', label: '轻微使用' },
  { value: 'obviously_used', label: '明显使用' },
  { value: 'has_flaws', label: '有瑕疵' }
]


// 状态
const images = ref<string[]>([])
const showCategoryPicker = ref(false)
const showSessionPicker = ref(false)
const publishing = ref(false)
const categories = ref<Category[]>([])
const flashSaleSessions = ref<FlashSaleSession[]>([])

// 弹窗ref
const titlePopup = ref()
const pricePopup = ref()
const conditionPopup = ref()
const locationPopup = ref()
const mapSelectorPopup = ref()
const flashSalePopup = ref()
const deliveryMethodPopup = ref()

// 临时值
const tempTitle = ref('')
const tempPrice = ref('')
const tempOriginalPrice = ref('')

// 草稿状态
const draftStatus = ref({
  show: false,
  saving: false,
  lastSaved: ''
})
const saveSuccess = ref(false)

// 草稿防抖：避免频繁请求服务器导致创建多个草稿
let saveDraftTimer: ReturnType<typeof setTimeout> | null = null
let isSavingDraft = false  // 防止并发保存
let disableDraftSync = false // 发布成功后禁止卸载阶段回写草稿

// 表单验证错误
const errors = ref<Record<string, string>>({
  images: '',
  title: '',
  price: '',
  categoryId: '',
  flashPrice: ''
})

// 预览相关
const showPreview = ref(false)

// URL 参数中的草稿ID（从草稿箱进入时使用）
const urlDraftId = ref<string>('')
// URL 参数中的商品ID（编辑商品时使用）
const urlProductId = ref<string>('')

const form = ref({
  draftId: undefined as string | undefined,  // 草稿ID
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  condition: CONDITIONS[0].value,
  categoryId: '',
  categoryName: '',
  location: '',
  locationName: '',
  canDelivery: false,
  freeShipping: false,
  deliveryFee: '',
  // 秒杀配置
  isFlashSale: false,
  flashPrice: '',
  flashSaleStock: '',
  limitPerUser: '1',
  sessionId: '' as string | number,
  repeatType: 1 as 0 | 1, // 0=仅一次, 1=每日重复
  saleDate: '' // 当 repeatType=0 时必填
})

const discountPercent = computed(() => {
  const price = parseFloat(form.value.price) || 0
  const originalPrice = parseFloat(form.value.originalPrice) || 0
  if (originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }
  return 0
})

// 是否是编辑模式
const isEditMode = computed(() => !!urlProductId.value)

// 发布按钮文本
const publishButtonText = computed(() => {
  return publishing.value ? (isEditMode.value ? '保存中...' : '发布中...') : (isEditMode.value ? '保存修改' : '立即发布')
})

// 秒杀折扣计算
const flashDiscountPercent = computed(() => {
  const originalPrice = parseFloat(form.value.price) || 0
  const flashPrice = parseFloat(form.value.flashPrice) || 0
  if (originalPrice > 0 && flashPrice > 0) {
    return (flashPrice / originalPrice * 10).toFixed(1)
  }
  return '0'
})

// 常用位置列表
const commonLocations = ref([
  { name: '图书馆', address: '校园中心区', icon: 'home', latitude: 0, longitude: 0 },
  { name: '第一食堂', address: '东区生活广场', icon: 'shop', latitude: 0, longitude: 0 },
  { name: '第二食堂', address: '西区宿舍区', icon: 'shop', latitude: 0, longitude: 0 },
  { name: '教学楼A栋', address: '教学主楼', icon: 'calendar', latitude: 0, longitude: 0 },
  { name: '体育馆', address: '体育运动区', icon: 'paperplane', latitude: 0, longitude: 0 },
  { name: '学生活动中心', address: '学生活动广场', icon: 'star', latitude: 0, longitude: 0 },
  { name: '校门口', address: '学校正门', icon: 'location', latitude: 0, longitude: 0 },
  { name: '快递站', address: '菜鸟驿站', icon: 'box', latitude: 0, longitude: 0 }
])

// 地图选择相关数据
const mapCenter = ref({
  latitude: 23.106414, // 默认广州(可以根据项目调整)
  longitude: 113.324520
})

const mapMarkers = ref<any[]>([])

const selectedLocation = ref({
  latitude: 0,
  longitude: 0,
  name: '',
  address: ''
})

// 自定义位置输入
const customLocationInput = ref('')

// 切换秒杀开关
function onFlashSaleChange(e: any) {
  form.value.isFlashSale = e.detail.value
  if (form.value.isFlashSale) {
    // 自动填充默认值
    const price = parseFloat(form.value.price) || 0
    if (price > 0 && !form.value.flashPrice) {
      // 默认设置为8折
      form.value.flashPrice = (price * 0.8).toFixed(2)
    }
    if (!form.value.limitPerUser) {
      form.value.limitPerUser = '1'
    }
  }
}

// 秒杀价格输入处理
function onFlashPriceInput() {
  // 可以在这里添加实时验证逻辑
}

// 计算节省金额
function calculateSavings() {
  const originalPrice = parseFloat(form.value.price) || 0
  const flashPrice = parseFloat(form.value.flashPrice) || 0
  if (originalPrice > flashPrice) {
    return (originalPrice - flashPrice).toFixed(2)
  }
  return '0.00'
}

// 价格popup相关函数
function openPricePopup() {
  tempPrice.value = form.value.price
  pricePopup.value?.open()
}

function closePricePopup() {
  pricePopup.value?.close()
}

function confirmPrice() {
  if (tempPrice.value) {
    const price = parseFloat(tempPrice.value)
    if (price <= 0) {
      uni.showToast({ title: '售价必须大于0', icon: 'none' })
      return
    }
  }
  form.value.price = tempPrice.value
  form.value.originalPrice = tempOriginalPrice.value
  validateField('price')
  closePricePopup()
  saveDraft()
}

// 标题弹窗相关函数
function openTitlePopup() {
  tempTitle.value = form.value.title
  titlePopup.value?.open()
}

function closeTitlePopup() {
  titlePopup.value?.close()
}

function confirmTitle() {
  if (!tempTitle.value.trim()) {
    uni.showToast({ title: '请输入商品标题', icon: 'none' })
    return
  }
  form.value.title = tempTitle.value
  validateField('title')
  closeTitlePopup()
  saveDraft()
}

// 表单验证
function validateField(field: string) {
  switch (field) {
    case 'title':
      errors.value.title = form.value.title.trim() ? '' : '请输入商品标题'
      break
    case 'price':
      if (!form.value.price) {
        errors.value.price = '请输入售价'
      } else if (parseFloat(form.value.price) <= 0) {
        errors.value.price = '售价必须大于0'
      } else {
        errors.value.price = ''
      }
      break
    case 'categoryId':
      errors.value.categoryId = form.value.categoryId ? '' : '请选择商品分类'
      break
    case 'flashPrice':
      if (form.value.isFlashSale) {
        if (!form.value.flashPrice) {
          errors.value.flashPrice = '请输入秒杀价格'
        } else if (parseFloat(form.value.flashPrice) >= parseFloat(form.value.price || '0')) {
          errors.value.flashPrice = '秒杀价格必须低于售价'
        } else {
          errors.value.flashPrice = ''
        }
      }
      break
    case 'images':
      errors.value.images = images.value.length > 0 ? '' : '请至少上传一张商品图片'
      break
  }
}

// 成色选择相关函数
function openConditionPopup() {
  conditionPopup.value?.open()
}

function closeConditionPopup() {
  conditionPopup.value?.close()
}

function selectCondition(condition: typeof CONDITIONS[number]) {
  form.value.condition = condition.value
  closeConditionPopup()
  saveDraft()
}

// 位置选择相关函数
function openLocationPopup() {
  locationPopup.value?.open()
}

function closeLocationPopup() {
  locationPopup.value?.close()
}

function selectCommonLocation(loc: typeof commonLocations.value[number]) {
  form.value.locationName = loc.name
  form.value.location = `${loc.latitude},${loc.longitude}`
  closeLocationPopup()
  saveDraft()
}

function clearLocation() {
  form.value.locationName = ''
  form.value.location = ''
  closeLocationPopup()
  saveDraft()
}

// 自定义位置输入相关方法
function onCustomLocationInput(e: any) {
  customLocationInput.value = e.detail.value
}

function clearCustomInput() {
  customLocationInput.value = ''
}

function confirmCustomLocation() {
  const input = customLocationInput.value.trim()
  if (!input) {
    uni.showToast({ title: '请输入位置名称', icon: 'none' })
    return
  }

  form.value.locationName = input
  form.value.location = '0,0' // 自定义位置不保存坐标
  customLocationInput.value = ''
  closeLocationPopup()
  saveDraft()
}

// 地图选择相关方法
function openMapSelector() {
  // 关闭位置弹窗
  closeLocationPopup()

  // 如果已有位置,设置为中心点
  if (form.value.location) {
    const [lat, lng] = form.value.location.split(',')
    mapCenter.value = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    }
    selectedLocation.value = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      name: form.value.locationName,
      address: form.value.locationName
    }
    mapMarkers.value = [{
      id: 1,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      iconPath: '/static/images/marker.png',
      width: 30,
      height: 30
    }]
  } else {
    // 获取当前位置
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        mapCenter.value = {
          latitude: res.latitude,
          longitude: res.longitude
        }
        selectedLocation.value = {
          latitude: res.latitude,
          longitude: res.longitude,
          name: '当前位置',
          address: '我的位置'
        }
        mapMarkers.value = [{
          id: 1,
          latitude: res.latitude,
          longitude: res.longitude,
          iconPath: '/static/images/marker.png',
          width: 30,
          height: 30
        }]
      },
      fail: () => {
        uni.showToast({ title: '获取位置失败', icon: 'none' })
      }
    })
  }

  // 打开地图弹窗
  mapSelectorPopup.value?.open()
}

function closeMapSelector() {
  mapSelectorPopup.value?.close()
}

function onMapTap(e: any) {
  const { latitude, longitude } = e.detail
  selectedLocation.value = {
    latitude,
    longitude,
    name: '选中位置',
    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  }
  mapMarkers.value = [{
    id: 1,
    latitude,
    longitude,
    iconPath: '/static/images/marker.png',
    width: 30,
    height: 30
  }]
}

function confirmMapLocation() {
  if (!selectedLocation.value.latitude || !selectedLocation.value.longitude) {
    uni.showToast({ title: '请先在地图上选择位置', icon: 'none' })
    return
  }

  form.value.location = `${selectedLocation.value.latitude},${selectedLocation.value.longitude}`
  form.value.locationName = selectedLocation.value.name
  closeMapSelector()
  saveDraft()
}

// 清除所有错误
function clearErrors() {
  errors.value = {
    images: '',
    title: '',
    price: '',
    categoryId: '',
    flashPrice: ''
  }
}

// 显示预览弹窗
function showPreviewModal() {
  showPreview.value = true
}

// 获取选中的场次名称
function getSelectedSessionName() {
  if (!form.value.sessionId) return ''
  const session = flashSaleSessions.value.find(s => s.sessionId === form.value.sessionId)
  return session ? session.time : ''
}

// 格式化场次时间
function formatSessionTime(session: FlashSaleSession) {
  const start = new Date(session.startTime)
  const end = new Date(session.endTime)
  const startHour = start.getHours().toString().padStart(2, '0')
  const startMin = start.getMinutes().toString().padStart(2, '0')
  const endHour = end.getHours().toString().padStart(2, '0')
  const endMin = end.getMinutes().toString().padStart(2, '0')
  return `${startHour}:${startMin} - ${endHour}:${endMin}`
}

// 选择秒杀场次
function selectSession(session: FlashSaleSession) {
  console.log('=== 选择秒杀场次 ===')
  console.log('选中的场次:', session)
  console.log('场次 ID:', session.sessionId)
  form.value.sessionId = session.sessionId
  showSessionPicker.value = false
  saveDraftWithStatus()
}

// 加载秒杀场次
async function loadFlashSaleSessions() {
  console.log('=== 开始加载秒杀场次 ===')
  console.log('调用接口: /flash-sale/sessions')
  try {
    const res = await activityApi.getFlashSaleSessions()
    console.log('秒杀场次 API 响应:', res)
    console.log('响应完整结构:', JSON.stringify(res))
    console.log('res.data:', res.data)
    console.log('res.data 类型:', typeof res.data)
    console.log('res.data 是否为数组:', Array.isArray(res.data))
    console.log('秒杀场次数量:', res.data?.length || 0)

    flashSaleSessions.value = res.data || []
    console.log('赋值后的 flashSaleSessions:', flashSaleSessions.value)
    console.log('=== 加载秒杀场次完成 ===')
  } catch (e) {
    console.error('加载秒杀场次失败:', e)
    console.error('错误详情:', JSON.stringify(e))
  }
}

// 打开秒杀场次选择器
function openSessionPicker() {
  console.log('=== 打开秒杀场次选择器 ===')
  console.log('当前 flashSaleSessions 数据:', flashSaleSessions.value)
  console.log('数据长度:', flashSaleSessions.value.length)
  showSessionPicker.value = true
}

// 带状态保存草稿（手动保存、上传图片后等需要立即同步的场景）
async function saveDraftWithStatus() {
  // 如果是编辑模式，只保存本地
  if (urlProductId.value) {
    saveDraftLocal()
    return
  }

  // 清除防抖定时器，立即同步到服务器
  if (saveDraftTimer) {
    clearTimeout(saveDraftTimer)
    saveDraftTimer = null
  }

  draftStatus.value.saving = true
  draftStatus.value.show = true

  // 先保存本地
  saveDraftLocal()

  // 立即同步到服务器
  await saveDraftToServer()

  draftStatus.value.saving = false
  draftStatus.value.lastSaved = new Date().toLocaleTimeString()

  // 触发草稿箱保存成功动效
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 800)

  setTimeout(() => {
    draftStatus.value.show = false
  }, 2000)
}

// 清空所有表单数据
function resetAll() {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有内容吗？此操作不可恢复',
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        // 如果有服务器草稿ID，删除服务器草稿
        const oldDraftId = form.value.draftId
        if (oldDraftId) {
          try {
            await productApi.deleteDraft(String(oldDraftId))
            console.log('服务器草稿已删除, draftId:', oldDraftId)
          } catch (e) {
            console.error('删除服务器草稿失败:', e)
          }
        }

        // 清空表单
        form.value = {
          draftId: undefined,
          title: '',
          description: '',
          price: '',
          originalPrice: '',
          condition: CONDITIONS[0].value,
          categoryId: '',
          categoryName: '',
          location: '',
          locationName: '',
          canDelivery: false,
          freeShipping: false,
          deliveryFee: '',
          isFlashSale: false,
          flashPrice: '',
          flashSaleStock: '',
          limitPerUser: '1',
          sessionId: '',
          repeatType: 1,
          saleDate: ''
        }
        // 清空图片
        images.value = []
        // 清空临时值
        tempPrice.value = ''
        tempOriginalPrice.value = ''
        // 清除本地存储
        uni.removeStorageSync(STORAGE_KEY)
        // 更新草稿数量
        await updateDraftCount()

        uni.showToast({ title: '已清空所有内容', icon: 'success' })
      }
    }
  })
}

// 清除草稿
async function handleClearDraft() {
  uni.showModal({
    title: '确认清除',
    content: '确定要清除草稿吗？此操作不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        // 如果有服务器草稿ID，删除服务器草稿
        if (form.value.draftId) {
          try {
            await productApi.deleteDraft(String(form.value.draftId))
          } catch (e) {
            console.error('删除服务器草稿失败:', e)
          }
        }

        // 清除本地存储
        uni.removeStorageSync(STORAGE_KEY)
        images.value = []
        form.value = {
          draftId: undefined,
          title: '',
          description: '',
          price: '',
          originalPrice: '',
          condition: CONDITIONS[0].value,
          categoryId: '',
          categoryName: '',
          location: '',
          locationName: '',
          canDelivery: false,
          freeShipping: false,
          deliveryFee: '',
          isFlashSale: false,
          flashPrice: '',
          flashSaleStock: '',
          limitPerUser: '1',
          sessionId: '',
          repeatType: 1,
          saleDate: ''
        }
        clearErrors()
        uni.showToast({ title: '草稿已清除', icon: 'success' })
      }
    }
  })
}

const isFormValid = computed(() => {
  const baseValid = images.value.length > 0 &&
    form.value.title.trim().length > 0 &&
    form.value.price !== '' &&
    parseFloat(form.value.price) > 0 &&
    form.value.categoryId !== ''

  // 如果开启秒杀，需要验证秒杀配置
  if (form.value.isFlashSale) {
    return baseValid &&
      form.value.sessionId !== '' &&
      form.value.flashPrice !== '' &&
      parseFloat(form.value.flashPrice) > 0 &&
      parseFloat(form.value.flashPrice) < parseFloat(form.value.price) &&
      form.value.flashSaleStock !== '' &&
      parseInt(form.value.flashSaleStock) > 0
  }

  return baseValid
})

function ensureMarketPublishAuth() {
  return checkAuth({
    showTip: true,
    tipText: '请先登录后发布商品',
    showAuthGuide: true,
    guideTitle: '登录后可发布商品',
    guideContent: '发布闲置需要登录账号，便于管理草稿与交易。'
  })
}

// 页面显示时更新导航栏主题
onShow(() => {
  useThemePage()
})

// 页面加载时获取参数
onLoad((options: any) => {
  if (!ensureMarketPublishAuth()) {
    return
  }

  console.log('页面参数:', options)
  if (options.draftId) {
    urlDraftId.value = options.draftId || ''
    console.log('从URL获取到草稿ID:', urlDraftId.value)
  }
  if (options.id) {
    urlProductId.value = options.id || ''
    console.log('从URL获取到商品ID:', urlProductId.value)
  }
})

// 生命周期
onMounted(() => {
  if (!ensureMarketPublishAuth()) {
    return
  }

  loadCategories()
  loadFlashSaleSessions()
  updateDraftCount()

  // 如果是编辑模式，先加载商品数据
  if (urlProductId.value) {
    loadProductForEdit()
  } else {
    // 否则加载草稿
    loadDraft()
  }
})

onUnmounted(() => {
  if (disableDraftSync) {
    return
  }

  // 清除防抖定时器
  if (saveDraftTimer) {
    clearTimeout(saveDraftTimer)
    saveDraftTimer = null
  }
  if (!hasMeaningfulDraftContent()) {
    return
  }

  // 页面退出时立即同步到服务器
  saveDraftLocal()
  saveDraftToServer()
})

// 加载草稿
async function loadDraft() {
  console.log('=== 开始加载草稿 ===')
  console.log('URL草稿ID:', urlDraftId.value)
  console.log('用户登录状态:', userStore.isLogin)

  // 先尝试从本地存储加载（包含秒杀配置等完整数据）
  let localDraft: any = null
  try {
    const draftStr = uni.getStorageSync(STORAGE_KEY)
    if (draftStr) {
      localDraft = JSON.parse(draftStr)
      console.log('本地草稿存在:', localDraft)
    }
  } catch (e) {
    console.error('读取本地草稿失败:', e)
  }

  // 只有URL中指定了草稿ID时才加载该草稿
  if (urlDraftId.value) {
    console.log('加载指定草稿, draftId:', urlDraftId.value)
    try {
      const draftRes = await productApi.getDraftDetail(String(urlDraftId.value))
      const draft = draftRes.data
      if (draft) {
        form.value.draftId = draft.draftId
        form.value.title = draft.title || ''
        form.value.description = draft.description || ''
        form.value.price = draft.price?.toString() || ''
        form.value.originalPrice = draft.originalPrice?.toString() || ''
        form.value.condition = CONDITIONS[draft.conditionLevel - 1]?.value || CONDITIONS[0].value
        form.value.categoryId = draft.categoryId?.toString() || ''
        form.value.categoryName = draft.categoryName || ''

        // 处理位置信息
        if (draft.latitude && draft.longitude) {
          form.value.location = `${draft.latitude},${draft.longitude}`
        } else {
          form.value.location = draft.location || ''
        }

        // 加载图片
        images.value = draft.images || []

        // 从本地存储补充秒杀配置
        if (localDraft?.form) {
          form.value.canDelivery = localDraft.form.canDelivery || false
          form.value.freeShipping = localDraft.form.freeShipping || false
          form.value.isFlashSale = localDraft.form.isFlashSale || false
          form.value.sessionId = localDraft.form.sessionId || ''
          form.value.flashPrice = localDraft.form.flashPrice || ''
          form.value.flashSaleStock = localDraft.form.flashSaleStock || ''
          form.value.limitPerUser = localDraft.form.limitPerUser || '1'
          form.value.repeatType = localDraft.form.repeatType ?? 1
          form.value.saleDate = localDraft.form.saleDate || ''
        }

        console.log('从服务器加载指定草稿成功:', draft)
        console.log('设置的draftId:', form.value.draftId)
        return
      } else {
        console.warn('草稿详情返回空数据')
        uni.showToast({
          title: '草稿不存在',
          icon: 'none'
        })
        return
      }
    } catch (e: any) {
      console.error('加载指定草稿失败:', e)
      uni.showToast({
        title: e.message || '草稿加载失败',
        icon: 'none'
      })
      return  // 不继续加载其他草稿
    }
  }

  // 默认情况：清除本地存储，创建新草稿
  console.log('创建新草稿，清除本地存储')
  uni.removeStorageSync(STORAGE_KEY)
  form.value.draftId = undefined
}

// 加载商品详情（编辑模式）
async function loadProductForEdit() {
  console.log('=== 开始加载商品详情（编辑模式）===')
  console.log('商品ID:', urlProductId.value)
  console.log('用户登录状态:', userStore.isLogin)

  if (!urlProductId.value) {
    console.warn('商品ID为空，跳过加载')
    return
  }

  try {
    const res = await productApi.getProductDetail(urlProductId.value, { channel: 'normal' })
    const product = res.data
    if (!product) {
      console.warn('商品详情返回空数据')
      uni.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      return
    }

    console.log('商品详情加载成功:', product)

    // 填充表单数据
    form.value.title = product.title || ''
    form.value.description = product.description || ''
    form.value.price = product.price?.toString() || ''
    form.value.originalPrice = product.originalPrice?.toString() || ''

    // 处理成色 - ProductCondition 类型
    form.value.condition = product.condition || CONDITIONS[0].value

    // 分类信息
    form.value.categoryId = product.categoryId?.toString() || ''
    form.value.categoryName = product.categoryName || ''

    // 位置信息 - Product 只有 location 字符串
    form.value.location = ''
    form.value.locationName = product.location || ''

    // 配送设置 - 从 Product 数据中读取，如果没有则使用默认值
    console.log('后端返回的配送字段:', {
      canDelivery: product.canDelivery,
      freeShipping: product.freeShipping,
      deliveryFee: product.deliveryFee
    })

    form.value.canDelivery = product.canDelivery === true
    form.value.freeShipping = product.freeShipping === true
    form.value.deliveryFee = product.deliveryFee?.toString() || ''

    // 尝试从本地存储的编辑草稿中恢复配送设置（如果后端没有返回）
    try {
      const localEditDraft = uni.getStorageSync(STORAGE_KEY + '_edit_' + urlProductId.value)
      if (localEditDraft?.form && localEditDraft.form.deliverySettingsLoaded) {
        console.log('从本地存储恢复配送设置:', localEditDraft.form.deliverySettings)
        form.value.canDelivery = localEditDraft.form.canDelivery ?? form.value.canDelivery
        form.value.freeShipping = localEditDraft.form.freeShipping ?? form.value.freeShipping
        form.value.deliveryFee = localEditDraft.form.deliveryFee ?? form.value.deliveryFee
      }
    } catch (e) {
      console.warn('读取本地编辑草稿失败:', e)
    }

    console.log('配送设置加载完成:', {
      canDelivery: form.value.canDelivery,
      freeShipping: form.value.freeShipping,
      deliveryFee: form.value.deliveryFee
    })

    // 加载图片 - images 是 string[] 类型
    if (product.images && Array.isArray(product.images)) {
      images.value = product.images
    } else {
      images.value = []
    }

    // 设置编辑模式标记
    form.value.draftId = undefined // 编辑模式不需要草稿ID

    // 设置导航栏标题
    uni.setNavigationBarTitle({
      title: '编辑商品'
    })

    console.log('商品数据填充完成:', form.value)
  } catch (e: any) {
    console.error('加载商品详情失败:', e)
    uni.showToast({
      title: e.message || '商品加载失败',
      icon: 'none'
    })
  }
}

// ==================== 悬浮球操作 ====================
/** 处理模式切换 */
function handleModeSwitch(newMode: 'market' | 'share') {
  console.log('[Publish] 切换发布模式: market ->', newMode)

  // 保存当前草稿
  saveDraft()

  // 提示用户
  uni.showModal({
    title: '切换模式',
    content: '切换到发布共享将保存当前商品草稿，是否继续？',
    success: (res) => {
      if (res.confirm) {
        // 切换到发布共享页面
        uni.redirectTo({
          url: '/pages/share/publish?from=modeSwitch',
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

/** 手动保存草稿 */
function manualSaveDraft() {
  // 如果是编辑模式，提示用户使用保存按钮
  if (urlProductId.value) {
    uni.showToast({
      title: '请点击"保存修改"按钮保存商品',
      icon: 'none',
      duration: 2000
    })
    return
  }

  if (!hasMeaningfulDraftContent()) {
    uni.showToast({
      title: '暂无内容可保存',
      icon: 'none'
    })
    return
  }

  // 调用带状态的保存函数
  saveDraftWithStatus()
}

/** 跳转到草稿箱 */
function goToDrafts() {
  uni.navigateTo({
    url: '/pages/mine/drafts'
  })
}

// 更新草稿数量
async function updateDraftCount() {
  try {
    const res = await productApi.getDraftCount()
    draftCount.value = res.data?.count || 0
    console.log('草稿数量已更新:', draftCount.value)
  } catch (e) {
    console.error('更新草稿数量失败:', e)
  }
}

// 仅保存到本地存储（轻量，每次操作都调用）
function saveDraftLocal() {
  if (!hasMeaningfulDraftContent()) {
    return false
  }

  try {
    const data = {
      images: images.value,
      form: form.value
    }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存本地草稿失败:', e)
  }

  return true
}

// 防抖保存草稿：操作后延迟同步到服务器，避免频繁请求导致创建多个草稿
function debouncedSaveDraft() {
  if (disableDraftSync) {
    return
  }

  // 先立即保存本地
  if (!saveDraftLocal()) {
    return
  }

  // 编辑模式不需要同步服务器
  if (urlProductId.value) return

  // 清除上一次的定时器
  if (saveDraftTimer) {
    clearTimeout(saveDraftTimer)
  }

  // 2秒后将服务器草稿同步标记为需要保存
  saveDraftTimer = setTimeout(() => {
    saveDraftToServer()
  }, 2000)
}

// 保存草稿到服务器
async function saveDraftToServer() {
  if (disableDraftSync) {
    return
  }

  if (!hasMeaningfulDraftContent()) {
    return
  }

  // 如果是编辑模式，不保存服务器草稿
  if (urlProductId.value) {
    console.log('编辑模式，跳过服务器草稿保存')
    return
  }

  // 防止并发保存（避免快速操作时创建多个草稿）
  if (isSavingDraft) {
    console.log('草稿正在保存中，跳过本次请求')
    return
  }

  isSavingDraft = true
  try {
    // 将 condition value 转换为 conditionLevel (1-10)
    const conditionMap: Record<string, number> = {
      'new': 10,
      'almost_new': 9,
      'lightly_used': 8,
      'obviously_used': 7,
      'has_flaws': 6
    }

    // 解析位置信息
    let latitude: number | undefined
    let longitude: number | undefined
    let location = form.value.location
    if (form.value.location && form.value.location.includes(',')) {
      const [lat, lng] = form.value.location.split(',')
      latitude = parseFloat(lat)
      longitude = parseFloat(lng)
      location = form.value.locationName || form.value.location
    }

    const draftData = {
      draftId: form.value.draftId,
      title: form.value.title,
      description: form.value.description,
      categoryId: form.value.categoryId ? parseInt(form.value.categoryId) : undefined,
      price: form.value.price ? parseFloat(form.value.price) : undefined,
      originalPrice: form.value.originalPrice ? parseFloat(form.value.originalPrice) : undefined,
      conditionLevel: conditionMap[form.value.condition] || 10,
      imageUrls: images.value,
      location: location,
      latitude: latitude,
      longitude: longitude
    }

    console.log('=== 开始保存服务器草稿 ===')
    console.log('发送数据:', draftData)

    const res = await productApi.saveDraft(draftData)
    console.log('服务器响应:', res)
    // 保存服务器返回的 draftId
    if (res.data?.draftId) {
      form.value.draftId = res.data.draftId
      console.log('草稿同步到服务器成功, draftId:', res.data.draftId)
    }
    // 更新草稿数量
    await updateDraftCount()
  } catch (e: any) {
    // 如果是草稿数量已达上限，只显示提示给用户
    if (e.message?.includes('草稿数量已达上限')) {
      uni.showToast({
        title: e.message || '草稿数量已达上限（10个），请先发布或删除部分草稿',
        icon: 'none',
        duration: 2000
      })
      return
    }

    console.error('保存服务器草稿失败:', e)

    // 如果是商品不存在错误，说明 draftId 已失效，下次保存时会创建新草稿
    if (e.message?.includes('商品不存在') && form.value.draftId) {
      console.log('草稿不存在，清除 draftId，下次保存时将创建新草稿')
      form.value.draftId = undefined
      // 清除本地存储中的 draftId
      try {
        const localData = JSON.parse(uni.getStorageSync(STORAGE_KEY) || '{}')
        if (localData.form) {
          localData.form.draftId = undefined
          uni.setStorageSync(STORAGE_KEY, JSON.stringify(localData))
        }
      } catch (err) {
        console.error('更新本地存储失败:', err)
      }
    }

    // 检查是否是用户不存在错误，提示重新登录
    if (e.message?.includes('用户不存在') || e.message?.includes('请重新登录')) {
      uni.showModal({
        title: '登录失效',
        content: '您的登录信息已失效，请重新登录',
        showCancel: false,
        success: () => {
          uni.removeStorageSync('token')
          userStore.logout()
          uni.navigateTo({ url: '/pages/login/login' })
        }
      })
    }
  } finally {
    isSavingDraft = false
  }
}

function hasMeaningfulDraftContent() {
  return Boolean(
    form.value.title?.trim() ||
    form.value.description?.trim() ||
    images.value.length > 0 ||
    form.value.price?.trim() ||
    form.value.originalPrice?.trim() ||
    form.value.categoryId ||
    form.value.location?.trim() ||
    form.value.locationName?.trim() ||
    form.value.condition !== CONDITIONS[0].value ||
    form.value.isFlashSale ||
    form.value.canDelivery ||
    form.value.freeShipping ||
    form.value.deliveryFee?.trim()
  )
}

// 兼容旧调用的 saveDraft（现在走防抖逻辑）
async function saveDraft() {
  debouncedSaveDraft()
}

// 加载分类
async function loadCategories() {
  try {
    const res = await categoryApi.getCategoryList()
    categories.value = res.data || []
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

// 选择图片
async function chooseImage() {
  const maxCount = 9 - images.value.length
  try {
    const res = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
      uni.chooseImage({
        count: maxCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      })
    })

    uni.showLoading({ title: '上传中...' })
    try {
      for (const filePath of res.tempFilePaths) {
        const result = await uploadImage(filePath)
        images.value.push(result.url)
      }
      uni.hideLoading()
      uni.showToast({ title: '上传成功', icon: 'success' })
      saveDraftWithStatus()
    } catch (error) {
      uni.hideLoading()
      uni.showToast({ title: '上传失败', icon: 'none' })
    }
  } catch (e) {
    // 用户取消选择
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
  images.value.splice(index, 1)
  saveDraft()
}

// 设置为封面
function setAsCover(index: number) {
  const [cover] = images.value.splice(index, 1)
  images.value.unshift(cover)
  saveDraft()
  uni.showToast({ title: '已设为封面', icon: 'success' })
}

// 秒杀配置弹窗相关函数
function openFlashSalePopup() {
  flashSalePopup.value?.open()
}

function closeFlashSalePopup() {
  flashSalePopup.value?.close()
}

function confirmFlashSaleConfig() {
  if (form.value.isFlashSale) {
    if (!form.value.flashPrice) {
      uni.showToast({ title: '请输入秒杀价格', icon: 'none' })
      return
    }
    if (!form.value.sessionId) {
      uni.showToast({ title: '请选择秒杀场次', icon: 'none' })
      return
    }
    // 如果选择"仅一次"，必须选择日期
    if (form.value.repeatType === 0 && !form.value.saleDate) {
      uni.showToast({ title: '请选择秒杀日期', icon: 'none' })
      return
    }
  }
  closeFlashSalePopup()
  saveDraft()
}

function toggleFlashSale(e: any) {
  form.value.isFlashSale = e.detail.value
  if (form.value.isFlashSale) {
    // 自动填充默认值
    const price = parseFloat(form.value.price) || 0
    if (price > 0 && !form.value.flashPrice) {
      form.value.flashPrice = (price * 0.8).toFixed(2)
    }
  }
}

function selectFlashSession(session: FlashSaleSession) {
  form.value.sessionId = session.sessionId
}

// 打开秒杀日期选择器
function openDatePicker() {
  const today = new Date()
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 1) // 最多选择未来一个月

  uni.showModal({
    title: '选择秒杀日期',
    editable: true,
    placeholderText: '请输入日期 (YYYY-MM-DD)',
    content: form.value.saleDate || formatDate(today),
    success: (res) => {
      if (res.confirm && res.content) {
        const dateStr = res.content.trim()
        // 验证日期格式
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (dateRegex.test(dateStr)) {
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            form.value.saleDate = dateStr
            saveDraft()
          } else {
            uni.showToast({ title: '日期格式不正确', icon: 'none' })
          }
        } else {
          uni.showToast({ title: '请输入正确的日期格式 (YYYY-MM-DD)', icon: 'none' })
        }
      }
    }
  })
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 交易方式弹窗相关函数
function openDeliveryMethodPopup() {
  deliveryMethodPopup.value?.open()
}

function closeDeliveryMethodPopup() {
  deliveryMethodPopup.value?.close()
}

function selectDeliveryMethod(method: string) {
  if (method === 'pickup') {
    form.value.canDelivery = false
    form.value.freeShipping = false
  } else if (method === 'mailing') {
    form.value.canDelivery = true
  }
}

function selectMailingType(type: string) {
  if (type === 'free') {
    form.value.freeShipping = true
  } else if (type === 'cod') {
    form.value.freeShipping = false
  }
}

function getDeliveryMethodText() {
  if (!form.value.canDelivery) return '仅自提'
  if (form.value.freeShipping) return '邮寄包邮'
  return '按距离收费'
}

// 选择分类
function selectCategory(category: Category) {
  // Category 类型定义中使用 categoryId 字段，但也兼容 id 字段
  const id = (category as any).id || category.categoryId
  form.value.categoryId = String(id)
  form.value.categoryName = category.name
  showCategoryPicker.value = false
  saveDraft()
}

// 价格输入处理
function onPriceInput(e: any) {
  let value = e.detail.value
  // 限制最多两位小数
  if (value.includes('.')) {
    const parts = value.split('.')
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2)
    }
  }
  // 限制最大值
  const numValue = parseFloat(value)
  if (numValue > 999999) {
    value = '999999'
  }
  form.value.price = value
  saveDraft()
}

function onOriginalPriceInput(e: any) {
  let value = e.detail.value
  if (value.includes('.')) {
    const parts = value.split('.')
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2)
    }
  }
  const numValue = parseFloat(value)
  if (numValue > 999999) {
    value = '999999'
  }
  form.value.originalPrice = value
  saveDraft()
}

// 发布商品
async function handlePublish() {
  if (!userStore.checkLogin()) return

  if (!isFormValid.value) {
    uni.showToast({ title: '请完善必填信息', icon: 'none' })
    return
  }

  publishing.value = true
  disableDraftSync = true

  // 发布前清理防抖定时器，避免延迟任务在发布后创建新草稿
  if (saveDraftTimer) {
    clearTimeout(saveDraftTimer)
    saveDraftTimer = null
  }

  let publishSuccess = false

  try {
    // 检查标题和描述的敏感词
    const [titleCheck, descCheck] = await Promise.all([
      checkSensitiveWord(form.value.title, SensitiveCheckType.PRODUCT),
      checkSensitiveWord(form.value.description || '', SensitiveCheckType.PRODUCT)
    ])

    // 如果包含禁止词，停止发布
    if (titleCheck && !titleCheck.passed) {
      publishing.value = false
      return
    }
    if (descCheck && !descCheck.passed) {
      publishing.value = false
      return
    }

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
    // 如果是编辑模式，更新商品
    if (urlProductId.value) {
      console.log('=== 编辑模式，开始保存商品 ===')
      console.log('商品ID:', urlProductId.value)
      console.log('图片数量:', images.value.length)
      console.log('图片列表:', images.value)

      // 解析位置坐标
      let latitude: number | undefined
      let longitude: number | undefined
      if (form.value.location && form.value.location.includes(',')) {
        const [lat, lng] = form.value.location.split(',')
        latitude = parseFloat(lat)
        longitude = parseFloat(lng)
      }

      const data: any = {
        images: images.value,
        coverImage: images.value.length > 0 ? images.value[0] : undefined, // 第一张图片作为封面
        title: filteredTitle,
        description: filteredDesc,
        price: parseFloat(form.value.price),
        originalPrice: form.value.originalPrice ? parseFloat(form.value.originalPrice) : undefined,
        condition: form.value.condition,
        categoryId: parseInt(form.value.categoryId),
        location: form.value.location,
        latitude,
        longitude,
        // 配送设置
        canDelivery: form.value.canDelivery,
        freeShipping: form.value.freeShipping,
        deliveryFee: form.value.deliveryFee ? parseFloat(form.value.deliveryFee) : undefined,
        // 秒杀配置
        isFlashSale: form.value.isFlashSale
      }

      // 如果开启秒杀，添加秒杀相关字段
      if (form.value.isFlashSale) {
        data.sessionId = parseInt(form.value.sessionId as string)
        data.flashPrice = parseFloat(form.value.flashPrice)
        data.flashSaleStock = parseInt(form.value.flashSaleStock)
        data.limitPerUser = parseInt(form.value.limitPerUser) || 1
        data.repeatType = form.value.repeatType
        data.saleDate = form.value.saleDate || undefined
      }

      console.log('=== 编辑模式提交前表单状态 ===')
      console.log('表单配送设置:', {
        canDelivery: form.value.canDelivery,
        freeShipping: form.value.freeShipping,
        deliveryFee: form.value.deliveryFee
      })
      console.log('发送到后端的配送设置:', {
        canDelivery: data.canDelivery,
        freeShipping: data.freeShipping,
        deliveryFee: data.deliveryFee
      })
      console.log('发送到后端的完整数据:', data)
      console.log('images 字段类型:', typeof data.images)
      console.log('images 是否为数组:', Array.isArray(data.images))

      // 保存配送设置到本地存储（用于编辑模式恢复）
      try {
        const editDraftKey = STORAGE_KEY + '_edit_' + urlProductId.value
        uni.setStorageSync(editDraftKey, {
          form: {
            canDelivery: form.value.canDelivery,
            freeShipping: form.value.freeShipping,
            deliveryFee: form.value.deliveryFee,
            deliverySettingsLoaded: true
          },
          timestamp: Date.now()
        })
        console.log('配送设置已保存到本地存储:', editDraftKey)
      } catch (e) {
        console.warn('保存本地编辑草稿失败:', e)
      }

      const res = await productApi.updateProduct(urlProductId.value, data)
      console.log('更新商品响应:', res)
      console.log('响应数据:', res.data)
      console.log('响应数据中的 images:', res.data?.images)

      // 更新成功后返回商品列表页
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
    // 如果有草稿ID，从草稿发布
    else if (form.value.draftId) {
      await productApi.publishFromDraft(String(form.value.draftId))
    } else {
      // 否则直接发布
      const data: any = {
        images: images.value,
        title: filteredTitle,
        description: filteredDesc,
        price: parseFloat(form.value.price),
        originalPrice: form.value.originalPrice ? parseFloat(form.value.originalPrice) : undefined,
        condition: form.value.condition,
        categoryId: parseInt(form.value.categoryId),
        location: form.value.location,
        latitude: form.value.location ? parseFloat(form.value.location.split(',')[0]) : undefined,
        longitude: form.value.location ? parseFloat(form.value.location.split(',')[1]) : undefined,
        canDelivery: form.value.canDelivery,
        freeShipping: form.value.freeShipping,
        // 秒杀配置
        isFlashSale: form.value.isFlashSale
      }

      // 如果开启秒杀，添加秒杀相关字段
      if (form.value.isFlashSale) {
        data.sessionId = parseInt(form.value.sessionId as string)
        data.flashPrice = parseFloat(form.value.flashPrice)
        data.flashSaleStock = parseInt(form.value.flashSaleStock)
        data.limitPerUser = parseInt(form.value.limitPerUser) || 1
        data.repeatType = form.value.repeatType
        data.saleDate = form.value.saleDate || undefined
      }

      await productApi.publishProduct(data)
    }

    // 清除草稿（本地和服务器）
    uni.removeStorageSync(STORAGE_KEY)
    form.value.draftId = undefined
    publishSuccess = true
    // 发布成功后更新草稿数量
    updateDraftCount()

    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.showToast({ title: '发布失败，请重试', icon: 'none' })
  } finally {
    if (!publishSuccess) {
      // 发布失败时恢复草稿自动保存
      disableDraftSync = false
    }
    publishing.value = false
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/variables.scss' as *;

.publish-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
}

// 菜单按钮
.scroll-view {
  flex: 1;
  padding-bottom: env(safe-area-inset-bottom);
}

.section {
  background: var(--bg-color-card);
  margin-bottom: $spacing-sm;
  padding: $spacing-md;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-sm;

    &.compact {
      margin-bottom: 8rpx;
    }

    &.clickable {
      @include clickable;
    }
  }

  .section-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $text-color-primary;
  }

  .section-required {
    font-size: $font-size-sm;
    color: var(--danger-color);
  }

  // 折叠箭头
  .collapse-arrow {
    font-size: 32rpx;
    color: $text-color-tertiary;
    transition: transform 0.3s ease;
    transform: rotate(90deg);

    &.expanded {
      transform: rotate(-90deg);
    }
  }
}

.form-item {
  position: relative;
  padding: $spacing-md 0;

  &.vertical {
    .label {
      margin-bottom: $spacing-sm;
    }
  }

  &.clickable {
    @include clickable;
  }

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: $font-size-base;
    color: $text-color-primary;
    display: block;
    margin-bottom: $spacing-sm;

    &.required::before {
      content: '*';
      color: var(--danger-color);
      margin-right: 4rpx;
    }
  }

  .input {
    width: 100%;
    height: 80rpx;
    font-size: $font-size-base;
    color: $text-color-primary;
  }

  .textarea {
    width: 100%;
    min-height: 180rpx;
    padding: $spacing-sm;
    background: var(--bg-color-page);
    border-radius: $border-radius-sm;
    font-size: $font-size-base;
    line-height: 1.6;
    color: $text-color-primary;
  }

  .count {
    position: absolute;
    bottom: $spacing-md;
    right: 0;
    font-size: $font-size-xs;
    color: $text-color-tertiary;

    &.warning {
      color: var(--danger-color);
    }
  }

  .value-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .value {
      font-size: $font-size-base;
      color: $text-color-primary;

      &.placeholder {
        color: $text-color-placeholder;
      }
    }

    .arrow {
      font-size: 40rpx;
      color: $text-color-tertiary;
      font-weight: 300;
    }
  }
}

.price-row {
  display: flex;
  gap: $spacing-md;

  .price-item {
    flex: 1;
  }
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  height: 80rpx;
  background: var(--bg-color-page);
  border-radius: $border-radius-sm;
  padding: 0 $spacing-sm;

  .price-symbol {
    font-size: $font-size-xl;
    font-weight: $font-weight-medium;
    color: var(--primary-color);
    margin-right: $spacing-xs;
  }

  .price-input {
    flex: 1;
    font-size: $font-size-xl;
    font-weight: $font-weight-medium;
    color: $text-color-primary;
  }
}

.discount-tip {
  margin-top: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: var(--success-color-alpha-10);
  border-radius: $border-radius-sm;

  .discount-text {
    font-size: $font-size-sm;
    color: var(--success-color);
  }
}

.condition-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .condition-tag {
    padding: $spacing-sm $spacing-md;
    background: var(--bg-color-page);
    color: $text-color-secondary;
    font-size: $font-size-sm;
    border-radius: 48rpx;
    transition: all $transition-fast;
    border: 2rpx solid transparent;

    &.active {
      background: var(--primary-color-alpha-10);
      color: var(--primary-color);
      border-color: var(--primary-color);
      font-weight: $font-weight-medium;
    }
  }
}

.location-detail {
  padding: $spacing-sm;
  background: var(--bg-color-page);
  border-radius: $border-radius-sm;
  margin-top: $spacing-sm;

  .location-detail-text {
    font-size: $font-size-sm;
    color: $text-color-secondary;
  }
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md 0;
  border-bottom: 1px solid $border-color-light;

  &:last-child {
    border-bottom: none;
  }

  .option-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .option-label {
      font-size: $font-size-base;
      color: $text-color-primary;
    }

    .option-desc {
      font-size: $font-size-xs;
      color: $text-color-tertiary;
    }
  }
}

// 秒杀配置样式
.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;

  .switch-wrapper {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .switch-label {
      font-size: $font-size-sm;
      color: $text-color-tertiary;
    }
  }
}

.flash-config {
  padding: $spacing-md;
  background: linear-gradient(135deg, var(--danger-color-alpha-5) 0%, var(--danger-color-alpha-5) 100%);
  border-radius: $border-radius-base;
  border: 1px solid var(--danger-color-alpha-10);

  .config-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid var(--danger-color-alpha-10);

    &:last-child {
      border-bottom: none;
    }

    .config-label {
      width: 140rpx;
      font-size: $font-size-base;
      color: $text-color-primary;
      flex-shrink: 0;
    }

    .price-input-wrapper {
      flex: 1;
      display: flex;
      align-items: baseline;
      padding: 0 16rpx;
      background: var(--bg-color-page);
      border-radius: $border-radius-sm;
      height: 64rpx;

      .price-symbol {
        font-size: $font-size-lg;
        color: var(--danger-color);
        font-weight: bold;
      }

      .price-input {
        flex: 1;
        height: 100%;
        font-size: $font-size-base;
        color: $text-color-primary;
        padding: 0 8rpx;
      }
    }

    .number-input {
      flex: 1;
      padding: 0 16rpx;
      height: 64rpx;
      background: var(--bg-color-page);
      border-radius: $border-radius-sm;
      font-size: $font-size-base;
      color: $text-color-primary;
      text-align: center;
    }

    .config-unit {
      margin-left: 12rpx;
      font-size: $font-size-sm;
      color: $text-color-tertiary;
      flex-shrink: 0;
    }

    .config-hint {
      margin-left: 12rpx;
      font-size: $font-size-xs;
      color: $text-color-tertiary;
    }
  }

  .discount-preview {
    margin-top: 20rpx;
    padding: 20rpx;
    background: linear-gradient(135deg, var(--primary-color-alpha-8) 0%, var(--primary-color-alpha-15) 100%);
    border-radius: $border-radius-base;
    text-align: center;

    .discount-text {
      display: block;
      font-size: $font-size-lg;
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: 8rpx;
    }

    .discount-sub {
      font-size: $font-size-sm;
      color: $text-color-secondary;
    }
  }
}

.tips-section {
  background: linear-gradient(135deg, var(--primary-color-alpha-5) 0%, var(--primary-color-alpha-2) 100%);
  padding: $spacing-md;

  .tips-title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-color-primary;
    display: block;
    margin-bottom: $spacing-sm;
  }

  .tips-list {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .tip-item {
      font-size: $font-size-sm;
      color: $text-color-secondary;
      line-height: 1.6;
    }
  }
}

// 邮寄提示卡片
.mail-hint-card {
  background: linear-gradient(135deg, var(--success-color-alpha-10) 0%, var(--success-color-alpha-5) 100%);
  border: 1px solid var(--success-color-alpha-30);

  .mail-hint-text {
    font-size: $font-size-base;
    color: var(--success-color);
    font-weight: $font-weight-medium;
  }
}

.bottom-bar {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: var(--bg-color-card);
  border-top: 1px solid $border-color-light;
  padding-bottom: calc($spacing-md + env(safe-area-inset-bottom));

  .bar-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    .bar-text {
      font-size: $font-size-xs;
      color: $text-color-tertiary;
    }

    .bar-link {
      font-size: $font-size-xs;
      color: var(--primary-color);
    }
  }

  .publish-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
    color: #fff;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    border-radius: $border-radius-lg;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity $transition-fast;
    box-shadow: 0 4rpx 16rpx var(--primary-color-alpha-30);

    &:active {
      transform: scale(0.98);
      box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-30);
    }

    &.disabled {
      opacity: 0.5;
      background: var(--bg-color-disabled);
      color: var(--text-color-tertiary);
      box-shadow: none;
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

// 分类选择器
.category-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-index-modal;
  display: flex;
  align-items: flex-end;

  .category-picker-content {
    width: 100%;
    max-height: 70vh;
    background: var(--bg-color-card);
    border-radius: $border-radius-xl $border-radius-xl 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-md;
      border-bottom: 1px solid $border-color-light;

      .picker-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-medium;
        color: $text-color-primary;
      }

      .picker-close {
        font-size: 48rpx;
        color: $text-color-tertiary;
        padding: $spacing-xs;
      }
    }

    .category-list {
      flex: 1;
      padding: $spacing-sm 0;

      .category-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $spacing-md;
        transition: background $transition-fast;

        &:active {
          background: var(--bg-color-page);
        }

        &.active {
          background: var(--primary-color-alpha-5);

          .category-name {
            color: var(--primary-color);
            font-weight: $font-weight-medium;
          }
        }

        .category-name {
          font-size: $font-size-base;
          color: $text-color-primary;
        }

        .category-check {
          font-size: $font-size-xl;
          color: var(--primary-color);
        }
      }
    }
  }
}

.placeholder {
  color: $text-color-placeholder;
}

// 草稿保存提示
.draft-toast {
  position: fixed;
  top: 20rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 24rpx;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 48rpx;
  z-index: $z-index-toast;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;

  &.saving {
    .draft-icon .loading-spinner {
      display: inline-block;
      width: 28rpx;
      height: 28rpx;
      border: 3rpx solid rgba(255, 255, 255, 0.3);
      border-top-color: $text-color-white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  .draft-icon {
    .check-small {
      color: var(--success-color);
      font-size: $font-size-lg;
    }
  }

  .draft-text {
    font-size: $font-size-sm;
    color: $text-color-white;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 区域标题优化
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;

  .section-required {
    font-size: $font-size-sm;
    color: var(--danger-color);
  }
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;

  .section-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .section-icon {
      font-size: $font-size-xl;
    }
  }
}

// 表单错误状态
.has-error {
  .input,
  .price-input-wrapper,
  .textarea {
    border-color: var(--danger-color) !important;
    background: var(--danger-color-alpha-5);
  }
}

.field-error {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;

  .error-icon {
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background: var(--danger-color);
    color: $text-color-white;
    font-size: $font-size-xs;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-text {
    font-size: $font-size-xs;
    color: var(--danger-color);
  }
}

.error-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: $spacing-sm $spacing-md;
  background: var(--danger-color-alpha-8);
  border-radius: $border-radius-sm;
  margin-top: $spacing-sm;

  .error-text {
    font-size: $font-size-sm;
    color: var(--danger-color);
  }
}

// 图片优化
.cover-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;

  .cover-icon {
    font-size: $font-size-sm;
  }
}

.upload-btn {
  .upload-icon-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    .upload-icon {
      font-size: 72rpx;
      color: $text-color-placeholder;
      line-height: 1;
    }
  }

  .upload-text {
    position: absolute;
    top: 55%;
    left: 50%;
    transform: translate(-50%, 20%);
    font-size: $font-size-sm;
    color: $text-color-tertiary;
  }

  .upload-count {
    position: absolute;
    bottom: 8rpx;
    right: 8rpx;
    font-size: $font-size-xs;
    color: $text-color-tertiary;
    background: rgba(0, 0, 0, 0.5);
    padding: 4rpx 8rpx;
    border-radius: $border-radius-sm;
  }
}

.upload-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .tip-icon {
    font-size: $font-size-base;
    color: var(--primary-color);
  }
}

// 价格相关
.discount-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .discount-icon {
    font-size: $font-size-lg;
    color: var(--success-color);
  }
}

// 位置信息
.location-detail {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .location-icon {
    font-size: $font-size-lg;
    color: var(--primary-color);
  }
}

// 选项优化
.option-item {
  .option-info {
    flex-direction: row;
    align-items: center;
    gap: $spacing-md;

    .option-icon-wrapper {
      width: 64rpx;
      height: 64rpx;
      border-radius: $border-radius-md;
      background: var(--bg-color-page);
      display: flex;
      align-items: center;
      justify-content: center;

      .option-icon {
        font-size: 32rpx;
      }
    }

    .option-text {
      display: flex;
      flex-direction: column;
      gap: 4rpx;
    }
  }
}

// 预览按钮
.preview-section {
  padding: $spacing-md;
  background: transparent;

  .preview-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, var(--primary-color-alpha-10) 0%, var(--primary-color-alpha-5) 100%);
    border: 2rpx solid var(--primary-color-alpha-30);
    border-radius: $border-radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      background: var(--primary-color-alpha-15);
    }

    .preview-icon {
      font-size: $font-size-xl;
      color: var(--primary-color);
    }

    .preview-text {
      font-size: $font-size-base;
      color: var(--primary-color);
      font-weight: $font-weight-medium;
    }
  }
}

// 秒杀配置优化
.flash-section {
  background: linear-gradient(135deg, var(--danger-color-alpha-5) 0%, var(--danger-color-alpha-5) 100%);
  border: 1px solid var(--danger-color-alpha-10);

  .switch-wrapper {
    .switch-label {
      transition: color 0.3s ease;

      &.active {
        color: var(--danger-color);
      }
    }
  }
}

.flash-config {
  .config-item {
    &.full-width {
      flex-direction: column;
      align-items: stretch;

      .session-selector {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16rpx;
        background: var(--bg-color-page);
        border-radius: $border-radius-sm;

        .session-value {
          font-size: $font-size-base;
          color: $text-color-primary;

          &.placeholder {
            color: $text-color-placeholder;
          }
        }

        .selector-arrow {
          font-size: 40rpx;
          color: $text-color-tertiary;
        }
      }
    }
  }

  .discount-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;

    .discount-icon {
      font-size: 48rpx;
      color: var(--primary-color);
    }
  }
}

// 底部按钮优化
.bottom-bar {
  .bar-actions {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-sm;

    .draft-btn {
      flex: 1;
      height: 88rpx;
      background: var(--bg-color-page);
      border: 2rpx solid $border-color-base;
      border-radius: $border-radius-lg;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:active {
        background: color-mix(in srgb, var(--bg-color-page) 95%, black);
      }

      .draft-btn-text {
        font-size: $font-size-base;
        color: $text-color-secondary;
      }
    }

    .publish-btn {
      flex: 2;
    }
  }
}

// 选择器通用样式
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-index-modal;
  display: flex;
  align-items: flex-end;

  .picker-content {
    width: 100%;
    max-height: 70vh;
    height: 60vh;
    background: var(--bg-color-card);
    border-radius: $border-radius-xl $border-radius-xl 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-md;
      border-bottom: 1px solid $border-color-light;

      .picker-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-medium;
        color: $text-color-primary;
      }

      .picker-close {
        font-size: 48rpx;
        color: $text-color-tertiary;
        padding: $spacing-xs;
      }
    }

    .picker-list {
      flex: 1;
      min-height: 0;
      padding: $spacing-sm 0;

      .picker-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 80rpx 0;

        .empty-text {
          font-size: 28rpx;
          color: $text-color-tertiary;
        }
      }

      .picker-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $spacing-md;
        transition: background $transition-fast;

        &:active {
          background: var(--bg-color-page);
        }

        &.active {
          background: var(--primary-color-alpha-5);

          .picker-item-name,
          .session-time {
            color: var(--primary-color);
            font-weight: $font-weight-medium;
          }
        }

        .picker-item-name {
          font-size: $font-size-base;
          color: $text-color-primary;
        }

        .picker-item-check {
          font-size: $font-size-xl;
          color: var(--primary-color);
        }

        &.session-item {
          .session-info {
            display: flex;
            flex-direction: column;
            gap: 8rpx;

            .session-time {
              font-size: $font-size-lg;
              font-weight: $font-weight-medium;
              color: $text-color-primary;
            }

            .session-period {
              font-size: $font-size-sm;
              color: $text-color-tertiary;
            }
          }
        }
      }
    }
  }
}

.session-picker-overlay {
  z-index: 10050;
}

// 预览弹窗
.preview-overlay {
  .preview-modal {
    width: 640rpx;
    max-height: 80vh;
    background: var(--bg-color-card);
    border-radius: $border-radius-xl;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin: 0 auto;

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: $spacing-md;
      border-bottom: 1px solid $border-color-light;

      .preview-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-medium;
        color: $text-color-primary;
      }

      .preview-close {
        font-size: 48rpx;
        color: $text-color-tertiary;
        padding: $spacing-xs;
      }
    }

    .preview-content {
      flex: 1;
      padding: $spacing-md;
    }
  }
}

.product-card-preview {
  .preview-image-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: $border-radius-lg;
    overflow: hidden;
    background: var(--bg-color-page);

    .preview-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .flash-tag {
      position: absolute;
      top: $spacing-sm;
      left: $spacing-sm;
      padding: 8rpx 20rpx;
      background: linear-gradient(135deg, var(--danger-color) 0%, var(--danger-color) 100%);
      color: $text-color-white;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      border-radius: $border-radius-sm;
    }
  }

  .preview-info {
    padding: $spacing-md 0;

    .preview-title-text {
      font-size: $font-size-lg;
      font-weight: $font-weight-medium;
      color: $text-color-primary;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .preview-price-row {
      display: flex;
      align-items: baseline;
      gap: 12rpx;
      margin-top: $spacing-sm;

      .preview-price {
        font-size: 36rpx;
        font-weight: bold;
        color: var(--danger-color);
      }

      .preview-original {
        font-size: $font-size-sm;
        color: $text-color-tertiary;
        text-decoration: line-through;
      }

      .preview-discount {
        padding: 4rpx 12rpx;
        background: linear-gradient(135deg, var(--danger-color) 0%, var(--danger-color) 100%);
        color: $text-color-white;
        font-size: $font-size-xs;
        border-radius: $border-radius-sm;
      }
    }

    .preview-meta {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-top: $spacing-sm;

      .preview-condition {
        padding: 6rpx 16rpx;
        background: var(--primary-color-alpha-10);
        color: var(--primary-color);
        font-size: $font-size-xs;
        border-radius: $border-radius-sm;
      }

      .preview-location {
        font-size: $font-size-xs;
        color: $text-color-tertiary;
      }
    }
  }
}

// 发布提示优化
.tips-section {
  .tips-title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-color-primary;
    display: block;
    margin-bottom: $spacing-sm;
  }
}

// ========== 紧凑布局样式 ==========

// 紧凑section
.compact-section {
  padding: $spacing-sm $spacing-md !important;
  margin-bottom: 8rpx !important;

  .section-header {
    margin-bottom: $spacing-sm !important;
  }
}

// 紧凑网格布局
.compact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-sm;

  .form-item {
    padding: $spacing-sm 0 !important;
  }
}

// 紧凑价格输入
.price-input-wrapper.compact {
  padding: 0 $spacing-xs !important;
  height: 64rpx !important;

  .price-input {
    font-size: $font-size-base !important;
  }

  .price-symbol {
    font-size: $font-size-lg !important;
  }
}

// 内联折扣提示
.discount-inline {
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, var(--success-color-alpha-15) 0%, var(--success-color-alpha-8) 100%);
  border-radius: $border-radius-sm;
  text-align: center;

  .discount-text {
    font-size: $font-size-xs;
    color: var(--success-color);
    font-weight: $font-weight-medium;
  }
}

// 紧凑表单项
.form-item.compact {
  padding: $spacing-xs 0 !important;
}

.field-error.compact {
  margin-top: 4rpx !important;
  padding: 0 !important;
}

// 成色横向滚动
.condition-scroll {
  width: 100%;
  white-space: nowrap;

  .condition-tags-inline {
    display: inline-flex;
    gap: 8rpx;
    padding: 4rpx 0;
  }

  .condition-tag-compact {
    display: inline-block;
    padding: 8rpx 20rpx;
    background: var(--bg-color-page);
    color: $text-color-secondary;
    font-size: $font-size-sm;
    border-radius: 48rpx;
    transition: all $transition-fast;
    border: 2rpx solid transparent;
    white-space: nowrap;

    &.active {
      background: var(--primary-color-alpha-10);
      color: var(--primary-color);
      border-color: var(--primary-color);
      font-weight: $font-weight-medium;
    }
  }
}

// 图标按钮
.icon-btn {
  width: 88rpx;
  height: 88rpx;
  background: var(--bg-color-page);
  border: 2rpx solid $border-color-base;
  border-radius: $border-radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
  margin: 0;

  &:active {
    transform: scale(0.95);
    background: color-mix(in srgb, var(--bg-color-page) 95%, black);
  }

  .btn-icon {
    font-size: 40rpx;
    color: var(--primary-color);
  }
}

// 底部按钮组调整
.bottom-bar {
  .bar-actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;

    .icon-btn {
      flex-shrink: 0;
    }

    .draft-btn {
      flex: 1;
    }

    .publish-btn {
      flex: 2;
    }
  }
}

// 秒杀折叠指示器
.flash-section {
  .section-header-row {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      right: 180rpx;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 8rpx solid transparent;
      border-right: 8rpx solid transparent;
      border-top: 8rpx solid $text-color-tertiary;
      transition: transform 0.3s ease;
    }

    &.collapsed::after {
      transform: translateY(-50%) rotate(-90deg);
    }
  }
}

// 优化成色标签区域高度
.condition-tags {
  max-height: 160rpx;
  overflow-y: auto;
}

// ========== 页面进入动画 ==========

// 内容区块动画
.animated-section {
  opacity: 0;
  animation: slideInUpFade 0.5s ease-out forwards;
}

// 底部按钮栏动画
.animated-bottom-bar {
  opacity: 0;
  animation: slideInUpFade 0.5s ease-out 0.45s forwards;
}

// 向上滑入淡入动画
@keyframes slideInUpFade {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 弹窗进入动画
@keyframes popupSlideInUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 弹窗退出动画
@keyframes popupSlideOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}

// 弹窗缩放动画
@keyframes popupScaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// 交易方式选项滑入动画
@keyframes deliveryOptionSlideIn {
  from {
    opacity: 0;
    transform: translateX(-30rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 图标弹跳动画
@keyframes iconBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
}

// 选中标记弹出动画
@keyframes checkmarkPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 邮费输入框滑入动画
@keyframes feeInputSlideDown {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 100rpx;
    padding-top: 16rpx;
    padding-bottom: 16rpx;
    margin-top: 8rpx;
  }
}

// 弹窗动画类
.popup-animate-in {
  animation: popupSlideInUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

// 为已有动画的元素保持动画效果
.animated-section,
.animated-bottom-bar {
  // 确保动画只在进入时播放一次
  animation-fill-mode: forwards;
}

// 价格弹窗样式
.amount-popup {
  width: 100%;
  max-width: 100vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48rpx;
    margin-bottom: 24rpx;
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      padding: 8rpx;
    }
  }

  .amount-content {
    .amount-input-wrapper {
      display: flex;
      align-items: center;
      background: var(--bg-color-disabled);
      border-radius: 16rpx;
      padding: 0 24rpx;
      height: 96rpx;
      margin-bottom: 24rpx;

      .amount-symbol {
        font-size: 36rpx;
        color: $text-color-primary;
        font-weight: 600;
        margin-right: 8rpx;
      }

      .amount-input {
        flex: 1;
        font-size: 36rpx;
        color: $text-color-primary;
        font-weight: 600;
      }
    }

    .quick-amounts {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12rpx;
      margin-bottom: 24rpx;

      .amount-item {
        height: 72rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color-disabled);
        border-radius: 12rpx;
        border: 2rpx solid transparent;
        transition: all 0.2s;

        &.active {
          background: var(--primary-color-alpha-10);
          border-color: var(--primary-color);

          .amount-item-text {
            color: var(--primary-color);
            font-weight: 600;
          }
        }

        .amount-item-text {
          font-size: 26rpx;
          color: $text-color-secondary;
        }
      }
    }
  }

  .popup-footer {
    display: flex;
    gap: 12rpx;

    .popup-btn {
      flex: 1;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      border: none;

      &.cancel-btn {
        background: var(--bg-color-disabled);
        color: $text-color-secondary;
      }

      &.confirm-btn {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
        color: #fff;

        &[disabled] {
          opacity: 0.5;
        }
      }
    }
  }
}

// 价格预览样式
.price-selector-inline {
  display: flex;
  align-items: center;

  .price-text {
    font-size: 32rpx;
    color: $text-color-primary;
    font-weight: 600;
  }

  .price-placeholder {
    font-size: 28rpx;
    color: $text-color-tertiary;
  }
}

.discount-tag {
  padding: 4rpx 12rpx;
  background: var(--primary-color-alpha-10);
  border-radius: 8rpx;
  margin-right: 8rpx;

  .discount-text {
    font-size: 22rpx;
    color: var(--primary-color);
    font-weight: 600;
  }
}

// 卡片样式
.card {
  background: var(--bg-color-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;

    .card-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .card-required {
      font-size: 22rpx;
      color: $text-color-tertiary;
    }
  }
}

// 表单项样式（横向布局）
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
      color: $text-color-primary;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4rpx;

      .required-mark {
        color: var(--danger-color);
        font-weight: 600;
      }
    }

    .form-content {
      flex: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 12rpx;

      .value-text {
        font-size: 28rpx;
        color: $text-color-primary;
      }

      .value-placeholder {
        font-size: 28rpx;
        color: $text-color-tertiary;
      }
    }
  }

  &.vertical {
    .form-label {
      font-size: 28rpx;
      color: $text-color-primary;
      font-weight: 500;
      margin-bottom: 16rpx;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }
  }

  &.clickable {
    &:active {
      opacity: 0.7;
    }
  }
}

// 成色弹窗样式
.condition-popup {
  width: 100%;
  max-width: 100vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48rpx;
    margin-bottom: 24rpx;
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      padding: 8rpx;
    }
  }

  .condition-list {
    max-height: 50vh;

    .condition-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 0;
      border-bottom: 1px solid $border-color-light;
      transition: background 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:active {
        background: var(--bg-color-disabled);
      }

      &.active {
        .condition-name {
          color: var(--primary-color);
          font-weight: 600;
        }
      }

      .condition-name {
        font-size: 28rpx;
        color: $text-color-primary;
      }

      .condition-check {
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

// 位置选择弹窗样式
.location-popup {
  width: 100%;
  max-width: 100vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48rpx;
    margin-bottom: 24rpx;
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      padding: 8rpx;
    }
  }

  .location-content {
    max-height: 60vh;
    overflow-y: auto;
  }

  .location-section {
    margin-bottom: 24rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .location-section-title {
      display: block;
      font-size: 26rpx;
      color: $text-color-tertiary;
      margin-bottom: 16rpx;
      padding-left: 4rpx;
    }
  }

  // 自定义输入框样式
  .custom-input-wrapper {
    display: flex;
    gap: 16rpx;
    align-items: stretch;

    .custom-input-box {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 20rpx 24rpx;
      background: var(--bg-color-page);
      border-radius: 12rpx;
      border: 1px solid $border-color-base;
      transition: all 0.3s;

      &:focus-within {
        border-color: var(--primary-color);
        background: var(--bg-color-card);
        box-shadow: 0 0 0 4rpx var(--primary-color-alpha-10);
      }

      .custom-input {
        flex: 1;
        font-size: 28rpx;
        color: $text-color-primary;
        margin-left: 12rpx;
      }

      .clear-input-btn {
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8rpx;
      }
    }

    .confirm-custom-btn {
      width: 120rpx;
      height: auto;
      padding: 20rpx 0;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
      color: $text-color-white;
      font-size: 28rpx;
      font-weight: 600;
      border-radius: 12rpx;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      &:active:not(.disabled) {
        opacity: 0.8;
        transform: scale(0.98);
      }

      &.disabled {
        background: $border-color-base;
        color: $text-color-tertiary;
      }
    }
  }

  .location-list {
    background: var(--bg-color-page);
    border-radius: 16rpx;
    overflow: hidden;

    .location-item {
      display: flex;
      align-items: center;
      padding: 24rpx 20rpx;
      background: var(--bg-color-card);
      transition: background 0.2s;
      border-bottom: 1px solid $border-color-light;

      &:last-child {
        border-bottom: none;
      }

      &:active {
        background: var(--bg-color-disabled);
      }

      &.active {
        .location-item-name {
          color: var(--primary-color);
          font-weight: 600;
        }
      }

      .location-item-icon {
        width: 48rpx;
        height: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color-disabled);
        border-radius: 50%;
        margin-right: 16rpx;
      }

      .location-item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;

        .location-item-name {
          font-size: 28rpx;
          color: $text-color-primary;
        }

        .location-item-desc {
          font-size: 24rpx;
          color: $text-color-tertiary;
        }
      }

      .location-item-check {
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .map-section {
    .map-option {
      display: flex;
      align-items: center;
      padding: 24rpx 20rpx;
      background: linear-gradient(135deg, var(--primary-color-alpha-8) 0%, var(--bg-color-card) 100%);
      border-radius: 16rpx;
      border: 1px solid var(--primary-color-alpha-20);
      transition: background 0.2s;

      &:active {
        background: var(--primary-color-alpha-12);
      }

      .map-option-icon {
        width: 56rpx;
        height: 56rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color-card);
        border-radius: 50%;
        margin-right: 16rpx;
      }

      .map-option-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;

        .map-option-title {
          font-size: 28rpx;
          color: $text-color-primary;
          font-weight: 500;
        }

        .map-option-desc {
          font-size: 24rpx;
          color: $text-color-tertiary;
        }
      }

      .map-option-arrow {
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .clear-location-btn {
    padding: 24rpx 20rpx;
    text-align: center;
    background: var(--bg-color-card);
    border-radius: 16rpx;
    border: 1px solid var(--primary-color);
    transition: background 0.2s;

    &:active {
      background: var(--danger-color-alpha-8);
    }

    .clear-location-text {
      font-size: 28rpx;
      color: var(--primary-color);
    }
  }
}

// 地图选择弹窗样式
.map-selector-popup {
  width: 660rpx;
  background: var(--bg-color-card);
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.15);

  .map-popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-bottom: 1px solid $border-color-light;
    position: relative;

    .map-popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .map-close-btn {
      position: absolute;
      right: 24rpx;
      top: 50%;
      transform: translateY(-50%);
      padding: 8rpx;
    }
  }

  .map-container {
    width: 100%;
    height: 500rpx;
    position: relative;

    .map-component {
      width: 100%;
      height: 100%;
    }
  }

  .map-location-info {
    display: flex;
    align-items: center;
    padding: 20rpx 24rpx;
    background: var(--bg-color-page);
    border-top: 1px solid $border-color-light;

    .location-info-icon {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-color-card);
      border-radius: 50%;
      margin-right: 16rpx;
    }

    .location-info-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4rpx;

      .location-info-name {
        font-size: 28rpx;
        color: $text-color-primary;
        font-weight: 500;
      }

      .location-info-address {
        font-size: 24rpx;
        color: $text-color-tertiary;
      }
    }
  }

  .map-popup-footer {
    display: flex;
    gap: 16rpx;
    padding: 20rpx 24rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    border-top: 1px solid $border-color-light;

    .map-btn {
      flex: 1;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      border: none;
      transition: opacity 0.2s;

      &:active {
        opacity: 0.8;
      }
    }

    .cancel-map-btn {
      background: var(--bg-color-disabled);
      color: $text-color-secondary;
    }

    .confirm-map-btn {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
      color: #fff;
      font-weight: 600;
    }
  }
}

// 地图弹窗缩放动画
.popup-scale-animate {
  animation: popupScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

// 输入弹窗样式
.input-popup {
  width: 100%;
  max-width: 100vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48rpx;
    margin-bottom: 24rpx;
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      padding: 8rpx;
    }
  }

  .input-content {
    position: relative;
    margin-bottom: 24rpx;

    .popup-textarea {
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

    .count-text {
      position: absolute;
      bottom: 12rpx;
      right: 12rpx;
      font-size: 22rpx;
      color: $text-color-tertiary;
      background: rgba(0, 0, 0, 0.5);
      color: $text-color-white;
      padding: 4rpx 8rpx;
      border-radius: 8rpx;
    }
  }

  .popup-footer {
    display: flex;
    gap: 12rpx;

    .popup-btn {
      flex: 1;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      border: none;

      &.cancel-btn {
        background: var(--bg-color-disabled);
        color: $text-color-secondary;
      }

      &.confirm-btn {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
        color: #fff;

        &[disabled] {
          opacity: 0.5;
        }
      }
    }
  }
}

// 标题/成色/分类选择器内联样式
.title-selector-inline,
.condition-selector-inline,
.category-selector-inline {
  display: flex;
  align-items: center;

  .title-name-text,
  .condition-name-text,
  .category-name-text {
    font-size: 28rpx;
    color: $text-color-primary;
  }

  .title-placeholder-inline,
  .condition-placeholder-inline,
  .category-placeholder-inline {
    font-size: 28rpx;
    color: $text-color-tertiary;
  }
}

// 图片上传区域样式
.image-upload-section {
  margin-top: 24rpx;
  padding-top: 24rpx;

  .image-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8rpx;

    .image-item {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      border-radius: 16rpx;
      overflow: hidden;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

      .preview-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 16rpx;
        background: var(--bg-color-disabled);
      }

      .delete-btn {
        position: absolute;
        top: 8rpx;
        right: 8rpx;
        width: 40rpx;
        height: 40rpx;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4rpx);
        z-index: 2;
      }

      .cover-tag {
        position: absolute;
        bottom: 8rpx;
        left: 8rpx;
        padding: 4rpx 10rpx;
        background: var(--primary-color-alpha-95);
        color: $text-color-white;
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
      background: var(--bg-color-disabled);
      border-radius: 16rpx;
      border: 2rpx dashed $border-color-base;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:active {
        background: $border-color-light;
      }
    }
  }

  .upload-tip {
    display: block;
    font-size: 22rpx;
    color: $text-color-tertiary;
    padding: 0 4rpx;
    margin-top: 12rpx;
  }
}

// Textarea wrapper样式
.textarea-wrapper {
  position: relative;

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
    position: absolute;
    bottom: 8rpx;
    right: 8rpx;
    background: rgba(0, 0, 0, 0.5);
    color: $text-color-white;
    padding: 4rpx 8rpx;
    font-size: 20rpx;
    border-radius: 8rpx;
  }
}

// 秒杀配置弹窗样式
.flash-sale-popup {
  width: 100%;
  max-width: 100vw;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-x: hidden;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48rpx;
    margin-bottom: 24rpx;
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      padding: 8rpx;
    }
  }

  .flash-sale-content {
    max-height: 60vh;

    .flash-toggle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 0;
      border-bottom: 1px solid $border-color-light;

      .flash-toggle-info {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .flash-toggle-icon {
          font-size: 36rpx;
        }

        .flash-toggle-text {
          display: flex;
          flex-direction: column;

          .flash-toggle-label {
            font-size: 28rpx;
            color: $text-color-primary;
            font-weight: 500;
          }

          .flash-toggle-desc {
            font-size: 22rpx;
            color: $text-color-tertiary;
            margin-top: 4rpx;
          }
        }
      }
    }

    .flash-config-item {
      padding: 24rpx 0;
      border-bottom: 1px solid $border-color-light;

      &.clickable {
        &:active {
          background: var(--bg-color-disabled);
        }
      }

      .flash-config-label {
        font-size: 28rpx;
        color: $text-color-primary;
        font-weight: 500;
        display: block;
        margin-bottom: 16rpx;

        .required-mark {
          color: var(--danger-color);
        }
      }

      .flash-config-value {
        display: flex;
        align-items: center;
        justify-content: space-between;

        text {
          font-size: 28rpx;
          color: $text-color-primary;

          &.placeholder {
            color: $text-color-tertiary;
          }
        }
      }

      .flash-price-input,
      .flash-stock-input {
        display: flex;
        align-items: center;
        background: var(--bg-color-disabled);
        border-radius: 12rpx;
        padding: 0 16rpx;

        .flash-price-symbol {
          font-size: 32rpx;
          color: $text-color-primary;
          font-weight: 600;
        }

        .flash-price-input-field,
        .flash-stock-input-field {
          flex: 1;
          height: 72rpx;
          font-size: 28rpx;
          color: $text-color-primary;
        }

        .flash-stock-unit {
          font-size: 24rpx;
          color: $text-color-tertiary;
          margin-left: 8rpx;
        }
      }

      // 重复类型选择器
      .flash-repeat-options {
        display: flex;
        gap: 12rpx;

        .repeat-option {
          flex: 1;
          padding: 16rpx;
          background: var(--bg-color-disabled);
          border-radius: 12rpx;
          border: 2rpx solid transparent;
          display: flex;
          flex-direction: column;
          gap: 4rpx;
          transition: all 0.2s;

          &.active {
            background: var(--danger-color-alpha-8);
            border-color: var(--danger-color);

            .repeat-option-text {
              color: var(--danger-color);
              font-weight: 600;
            }
          }

          &:active {
            background: $border-color-base;
          }

          .repeat-option-text {
            font-size: 26rpx;
            color: $text-color-primary;
            font-weight: 500;
          }

          .repeat-option-desc {
            font-size: 22rpx;
            color: $text-color-tertiary;
          }
        }
      }

      // 日期选择器
      .flash-date-picker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-color-disabled);
        border-radius: 12rpx;
        padding: 16rpx;
        min-height: 72rpx;

        text {
          font-size: 28rpx;
          color: $text-color-primary;

          &.date-placeholder {
            color: $text-color-tertiary;
          }
        }
      }
    }

    .flash-discount-preview {
      margin-top: 24rpx;
      padding: 16rpx;
      background: linear-gradient(135deg, var(--danger-color-alpha-8) 0%, var(--danger-color-alpha-10) 100%);
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      gap: 8rpx;

      .flash-discount-icon {
        font-size: 28rpx;
      }

      .flash-discount-text {
        font-size: 26rpx;
        color: var(--danger-color);
        font-weight: 600;
      }

      .flash-discount-sub {
        font-size: 22rpx;
        color: var(--danger-color);
        margin-left: auto;
      }
    }
  }

  .popup-footer {
    display: flex;
    gap: 12rpx;
    margin-top: 24rpx;

    .popup-btn {
      flex: 1;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      border: none;

      &.cancel-btn {
        background: var(--bg-color-disabled);
        color: $text-color-secondary;
      }

      &.confirm-btn {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
        color: $text-color-white;
      }
    }
  }
}

// 价格显示内联样式
.price-display-inline {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .price-main-text {
    font-size: 32rpx;
    color: $text-color-primary;
    font-weight: 600;
  }

  .price-placeholder-text {
    font-size: 28rpx;
    color: $text-color-tertiary;
  }

  .price-discount-text {
    font-size: 22rpx;
    color: $text-color-tertiary;
  }
}

// 秒杀显示内联样式
.flash-sale-display {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .flash-status-text {
    font-size: 26rpx;
    color: $text-color-tertiary;

    &.active {
      color: var(--danger-color);
      font-weight: 600;
    }
  }

  .flash-price-text {
    font-size: 24rpx;
    color: var(--danger-color);
    font-weight: 600;
  }
}

// 交易方式弹窗样式
.delivery-popup {
  width: 100%;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48rpx;
    margin-bottom: 24rpx;
    position: relative;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-color-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      padding: 8rpx;
    }
  }

  .delivery-content {
    max-height: 60vh;
    overflow-y: auto;

    .delivery-option-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 0;
      border-bottom: 1px solid $border-color-light;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      // 选项进入动画
      opacity: 0;
      animation: deliveryOptionSlideIn 0.4s ease-out forwards;

      &:nth-child(1) { animation-delay: 0.05s; }
      &:nth-child(2) { animation-delay: 0.1s; }
      &:nth-child(4) { animation-delay: 0.15s; }

      &:last-child {
        border-bottom: none;
      }

      &:active {
        transform: scale(0.98);
        background: var(--bg-color-disabled);
      }

      &.active {
        background: linear-gradient(90deg, var(--primary-color-alpha-5) 0%, var(--primary-color-alpha-3) 100%);
        border-color: var(--primary-color-alpha-10);

        .delivery-option-title {
          color: var(--primary-color);
          font-weight: 600;
        }

        .delivery-option-icon {
          animation: iconBounce 0.5s ease-out;
        }

        .delivery-option-check {
          animation: checkmarkPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      }

      .delivery-option-info {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .delivery-option-icon {
          font-size: 36rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56rpx;
          height: 56rpx;
          background: var(--bg-color-page);
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          .delivery-option-item.active & {
            background: linear-gradient(135deg, var(--primary-color-alpha-8) 0%, var(--primary-color-alpha-15) 100%);
            transform: scale(1.1);
          }
        }

        .delivery-option-text {
          display: flex;
          flex-direction: column;

          .delivery-option-title {
            font-size: 28rpx;
            color: $text-color-primary;
            font-weight: 500;
            transition: all 0.3s;
          }

          .delivery-option-desc {
            font-size: 22rpx;
            color: $text-color-tertiary;
            margin-top: 4rpx;
            transition: all 0.3s;
          }
        }
      }

      .delivery-option-check {
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color-card);
        border-radius: 50%;
        box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-20);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
    }

    // 邮费输入框展开动画
    .delivery-fee-input {
      display: flex;
      align-items: center;
      padding: 16rpx 24rpx;
      margin-top: 8rpx;
      background: var(--bg-color-disabled);
      border-radius: 12rpx;
      opacity: 0;
      animation: feeInputSlideDown 0.3s ease-out forwards;

      .delivery-fee-label {
        font-size: 26rpx;
        color: $text-color-secondary;
        margin-right: 12rpx;
      }

      .fee-input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        background: var(--bg-color-card);
        border-radius: 8rpx;
        padding: 0 12rpx;
        height: 56rpx;
        transition: all 0.3s;
        border: 1px solid transparent;

        &:focus-within {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4rpx var(--primary-color-alpha-10);
        }

        .fee-symbol {
          font-size: 24rpx;
          color: $text-color-primary;
        }

        .fee-input {
          flex: 1;
          font-size: 26rpx;
          color: $text-color-primary;
        }
      }

      .fee-unit {
        font-size: 22rpx;
        color: $text-color-tertiary;
        margin-left: 8rpx;
      }
    }
  }
}

// 交易方式显示内联样式
.delivery-method-display {
  display: flex;
  align-items: center;

  .delivery-text {
    font-size: 28rpx;
    color: $text-color-primary;
  }
}
</style>
