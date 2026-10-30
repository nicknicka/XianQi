<template>
	<view class="edit-page" :style="pageStyle">
		<scroll-view class="scroll-view" scroll-y>
			<!-- 基本信息 -->
			<view class="card animated-section" style="animation-delay: 0ms">
				<view class="form-item horizontal clickable" @click="openTitlePopup">
					<view class="form-label">
						<text>商品标题</text>
						<text class="required-mark">*</text>
					</view>
					<view class="form-content">
						<view class="title-selector-inline">
							<text v-if="form.title" class="title-name-text">{{
								form.title
							}}</text>
							<text v-else class="title-placeholder-inline"
								>请输入商品标题</text
							>
						</view>
						<uni-icons
							type="right"
							size="14"
							color="var(--text-color-tertiary)"
						/>
					</view>
				</view>

				<view
					class="form-item horizontal clickable"
					@click="openConditionPopup()"
				>
					<view class="form-label">
						<text>商品成色</text>
						<text class="required-mark">*</text>
					</view>
					<view class="form-content">
						<view class="condition-selector-inline">
							<text v-if="form.condition" class="condition-name-text">{{
								conditionOptions.find((c) => c.value === form.condition)
									?.label || form.condition
							}}</text>
							<text v-else class="condition-placeholder-inline"
								>请选择成色</text
							>
						</view>
						<uni-icons
							type="right"
							size="14"
							color="var(--text-color-tertiary)"
						/>
					</view>
				</view>

				<view
					class="form-item horizontal clickable"
					@click="showCategoryPicker = true"
				>
					<view class="form-label">
						<text>商品分类</text>
						<text class="required-mark">*</text>
					</view>
					<view class="form-content">
						<view class="category-selector-inline">
							<text v-if="form.categoryName" class="category-name-text">{{
								form.categoryName
							}}</text>
							<text v-else class="category-placeholder-inline"
								>请选择分类</text
							>
						</view>
						<uni-icons
							type="right"
							size="14"
							color="var(--text-color-tertiary)"
						/>
					</view>
				</view>

				<!-- 图片上传 -->
				<view class="image-upload-section">
					<view class="image-grid">
						<view
							v-for="(image, index) in images"
							:key="index"
							class="image-item"
						>
							<image
								class="preview-image"
								:src="image"
								mode="aspectFill"
								@click="previewImage(index)"
							/>
							<view class="delete-btn" @click.stop="removeImage(index)">
								<uni-icons
									type="close"
									size="16"
									color="var(--text-color-inverse)"
								/>
							</view>
							<view v-if="index === 0" class="cover-tag">封面</view>
						</view>
						<view
							v-if="images.length < 9"
							class="upload-btn"
							@click="chooseImage"
						>
							<uni-icons
								type="camera"
								size="40"
								color="var(--text-color-tertiary)"
							/>
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
			<view
				class="card animated-section"
				:class="{ 'has-error': errors.price }"
				style="animation-delay: 140ms"
			>
				<view class="form-item horizontal clickable" @click="openPricePopup">
					<view class="form-label">
						<text>价格设置</text>
						<text class="required-mark">*</text>
					</view>
					<view class="form-content">
						<view class="price-display-inline">
							<text v-if="form.price" class="price-main-text"
								>¥{{ form.price }}</text
							>
							<text v-else class="price-placeholder-text">请设置价格</text>
							<text
								v-if="form.originalPrice && discountPercent > 0"
								class="price-discount-text"
								>原价¥{{ form.originalPrice }}</text
							>
						</view>
						<uni-icons
							type="right"
							size="14"
							color="var(--text-color-tertiary)"
						/>
					</view>
				</view>
			</view>

			<!-- 交易位置 -->
			<view class="card animated-section" style="animation-delay: 210ms">
				<view class="form-item horizontal clickable" @click="openLocationPopup">
					<view class="form-label">
						<text>交易位置</text>
					</view>
					<view class="form-content">
						<text v-if="form.locationName" class="value-text">{{
							form.locationName
						}}</text>
						<text v-else class="value-placeholder">请选择位置</text>
						<uni-icons
							type="right"
							size="14"
							color="var(--text-color-tertiary)"
						/>
					</view>
				</view>
			</view>

			<!-- 交易方式 -->
			<view class="card animated-section" style="animation-delay: 280ms">
				<view
					class="form-item horizontal clickable"
					@click="openDeliveryMethodPopup"
				>
					<view class="form-label">
						<text>交易方式</text>
					</view>
					<view class="form-content">
						<view class="delivery-method-display">
							<text v-if="!form.canDelivery" class="delivery-text"
								>仅自提</text
							>
							<text v-else-if="form.freeShipping" class="delivery-text"
								>邮寄包邮</text
							>
							<text v-else class="delivery-text"
								>按距离收费 ¥{{ form.deliveryFee || "0" }}</text
							>
						</view>
						<uni-icons
							type="right"
							size="14"
							color="var(--text-color-tertiary)"
						/>
					</view>
				</view>
			</view>

			<!-- 秒杀配置 -->
			<view class="card animated-section" style="animation-delay: 350ms">
				<view class="form-item horizontal clickable" @click="openFlashSalePopup">
					<view class="form-label">
						<text>秒杀配置</text>
					</view>
					<view class="form-content">
						<view class="flash-sale-display">
							<text v-if="!form.isFlashSale" class="flash-status-text"
								>未开启</text
							>
							<text v-else class="flash-status-text active">已开启</text>
							<text
								v-if="form.isFlashSale && form.flashPrice"
								class="flash-price-text"
								>¥{{ form.flashPrice }}</text
							>
						</view>
						<uni-icons
							type="right"
							size="14"
							color="var(--text-color-tertiary)"
						/>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部按钮 -->
		<view class="bottom-bar animated-bottom-bar">
			<view class="bar-actions">
				<button
					class="publish-btn"
					:class="{ disabled: !isFormValid }"
					:disabled="!isFormValid"
					@click="submitEdit"
				>
					{{ submitting ? "保存中..." : "保存修改" }}
				</button>
			</view>
		</view>

		<!-- 成色选择弹窗 -->
		<uni-popup ref="conditionPopup" type="bottom" :safe-area="false">
			<view class="condition-popup popup-animate-in">
				<view class="popup-header">
					<text class="popup-title">商品成色</text>
					<view class="close-btn" @click="closeConditionPopup">
						<uni-icons
							type="close"
							size="20"
							color="var(--text-color-secondary)"
						/>
					</view>
				</view>
				<view class="condition-content">
					<view
						v-for="condition in conditionOptions"
						:key="condition.value"
						class="condition-item"
						:class="{ active: form.condition === condition.value }"
						@click="selectCondition(condition)"
					>
						<view class="condition-icon">{{ condition.icon }}</view>
						<view class="condition-info">
							<text class="condition-label">{{ condition.label }}</text>
							<text class="condition-desc">{{ condition.desc }}</text>
						</view>
						<view
							v-if="form.condition === condition.value"
							class="condition-check"
						>
							<uni-icons
								type="checkmarkempty"
								size="20"
								:color="primaryColor"
							/>
						</view>
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 分类选择弹窗 -->
		<uni-popup ref="categoryPickerPopup" type="bottom" :safe-area="false">
			<view class="category-popup popup-animate-in">
				<view class="popup-header">
					<text class="popup-title">选择分类</text>
					<view class="close-btn" @click="showCategoryPicker = false">
						<uni-icons
							type="close"
							size="20"
							color="var(--text-color-secondary)"
						/>
					</view>
				</view>
				<picker-view
					class="category-picker"
					:indicator-style="indicatorStyle"
					:value="categoryPickerValue"
					@change="onCategoryPickerChange"
				>
					<picker-view-column>
						<view
							v-for="(category, index) in categories"
							:key="index"
							class="category-picker-item"
						>
							{{ category.name }}
						</view>
					</picker-view-column>
				</picker-view>
				<view class="popup-footer">
					<button
						class="popup-btn cancel-btn"
						@click="showCategoryPicker = false"
					>
						取消
					</button>
					<button class="popup-btn confirm-btn" @click="confirmCategory">
						确认
					</button>
				</view>
			</view>
		</uni-popup>

		<!-- 位置选择弹窗 -->
		<uni-popup ref="locationPopup" type="bottom" :safe-area="false">
			<view class="location-popup popup-animate-in">
				<view class="popup-header">
					<text class="popup-title">选择位置</text>
					<view class="close-btn" @click="closeLocationPopup">
						<uni-icons
							type="close"
							size="20"
							color="var(--text-color-secondary)"
						/>
					</view>
				</view>

				<!-- 自定义位置输入 -->
				<view class="custom-location-section">
					<text class="location-section-title">自定义位置</text>
					<view class="custom-input-wrapper">
						<view class="custom-input-box">
							<uni-icons
								type="location"
								size="18"
								color="var(--text-color-tertiary)"
							/>
							<input
								class="custom-input"
								v-model="customLocationInput"
								type="text"
								placeholder="输入自定义位置名称"
								placeholder-style="color: var(--text-color-tertiary)"
								@input="onCustomLocationInput"
							/>
							<view
								v-if="customLocationInput"
								class="clear-input-btn"
								@click="clearCustomInput"
							>
								<uni-icons
									type="clear"
									size="16"
									color="var(--text-color-tertiary)"
								/>
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
									<uni-icons
										:type="loc.icon"
										size="20"
										color="var(--text-color-secondary)"
									/>
								</view>
								<view class="location-item-info">
									<text class="location-item-name">{{ loc.name }}</text>
									<text class="location-item-desc">{{
										loc.address
									}}</text>
								</view>
								<view
									class="location-item-check"
									v-if="form.locationName === loc.name"
								>
									<uni-icons
										type="checkmarkempty"
										size="20"
										:color="primaryColor"
									/>
								</view>
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

		<!-- 售价输入弹窗 -->
		<uni-popup ref="pricePopup" type="bottom" :safe-area="false">
			<view class="amount-popup popup-animate-in">
				<view class="popup-header">
					<text class="popup-title">售价</text>
					<view class="close-btn" @click="closePricePopup">
						<uni-icons
							type="close"
							size="20"
							color="var(--text-color-secondary)"
						/>
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
						<view
							v-if="
								tempOriginalPrice &&
								tempPrice &&
								parseFloat(tempOriginalPrice) > parseFloat(tempPrice)
							"
							class="discount-preview"
						>
							<text class="discount-preview-text"
								>省
								{{
									Math.round(
										((parseFloat(tempOriginalPrice) -
											parseFloat(tempPrice)) /
											parseFloat(tempOriginalPrice)) *
											100
									)
								}}%</text
							>
						</view>
					</view>
				</view>
				<view class="popup-footer">
					<button class="popup-btn cancel-btn" @click="closePricePopup">
						取消
					</button>
					<button
						class="popup-btn confirm-btn"
						@click="confirmPrice"
						:disabled="!tempPrice"
					>
						确认
					</button>
				</view>
			</view>
		</uni-popup>

		<!-- 商品标题输入弹窗 -->
		<uni-popup ref="titlePopup" type="bottom" :safe-area="false">
			<view class="input-popup popup-animate-in">
				<view class="popup-header">
					<text class="popup-title">商品标题</text>
					<view class="close-btn" @click="closeTitlePopup">
						<uni-icons
							type="close"
							size="20"
							color="var(--text-color-secondary)"
						/>
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
					<button class="popup-btn cancel-btn" @click="closeTitlePopup">
						取消
					</button>
					<button
						class="popup-btn confirm-btn"
						@click="confirmTitle"
						:disabled="!tempTitle.trim()"
					>
						确认
					</button>
				</view>
			</view>
		</uni-popup>

		<!-- 交易方式弹窗 -->
		<uni-popup ref="deliveryMethodPopup" type="bottom" :safe-area="false">
			<view class="delivery-method-popup popup-animate-in">
				<view class="popup-header">
					<text class="popup-title">交易方式</text>
					<view class="close-btn" @click="closeDeliveryMethodPopup">
						<uni-icons
							type="close"
							size="20"
							color="var(--text-color-secondary)"
						/>
					</view>
				</view>
				<view class="delivery-method-content">
					<view class="delivery-toggle-item">
						<view class="delivery-toggle-info">
							<text class="delivery-toggle-icon">🚚</text>
							<view class="delivery-toggle-text">
								<text class="delivery-toggle-label">支持邮寄</text>
								<text class="delivery-toggle-desc"
									>开启后可选择包邮或收费</text
								>
							</view>
						</view>
						<switch
							:checked="form.canDelivery"
							:color="primaryColor"
							@change="toggleCanDelivery"
						/>
					</view>

					<template v-if="form.canDelivery">
						<view class="delivery-option-section">
							<text class="delivery-section-label">邮寄设置</text>
							<view class="delivery-options">
								<view
									class="delivery-option"
									:class="{ active: form.freeShipping }"
									@click="form.freeShipping = true"
								>
									<text class="delivery-option-text">包邮</text>
								</view>
								<view
									class="delivery-option"
									:class="{ active: !form.freeShipping }"
									@click="form.freeShipping = false"
								>
									<text class="delivery-option-text">收费</text>
								</view>
							</view>
						</view>

						<view v-if="!form.freeShipping" class="delivery-fee-section">
							<text class="delivery-fee-label">配送费</text>
							<view class="delivery-fee-input">
								<text class="delivery-fee-symbol">¥</text>
								<input
									class="delivery-fee-input-field"
									v-model="form.deliveryFee"
									type="digit"
									placeholder="请输入配送费"
									placeholder-style="color: var(--text-color-tertiary)"
								/>
							</view>
						</view>
					</template>
				</view>
				<view class="popup-footer">
					<button
						class="popup-btn cancel-btn"
						@click="closeDeliveryMethodPopup"
					>
						取消
					</button>
					<button class="popup-btn confirm-btn" @click="confirmDeliveryMethod">
						确认
					</button>
				</view>
			</view>
		</uni-popup>

		<!-- 秒杀配置弹窗 -->
		<uni-popup ref="flashSalePopup" type="bottom" :safe-area="false">
			<view class="flash-sale-popup popup-animate-in">
				<view class="popup-header">
					<text class="popup-title">秒杀配置</text>
					<view class="close-btn" @click="closeFlashSalePopup">
						<uni-icons
							type="close"
							size="20"
							color="var(--text-color-secondary)"
						/>
					</view>
				</view>

				<scroll-view class="flash-sale-content" scroll-y>
					<!-- 开关 -->
					<view class="flash-toggle-item">
						<view class="flash-toggle-info">
							<text class="flash-toggle-icon">⚡</text>
							<view class="flash-toggle-text">
								<text class="flash-toggle-label">开启秒杀</text>
								<text class="flash-toggle-desc"
									>商品将以秒杀价格展示</text
								>
							</view>
						</view>
						<switch
							:checked="form.isFlashSale"
							:color="dangerColor"
							@change="toggleFlashSale"
						/>
					</view>

					<template v-if="form.isFlashSale">
						<!-- 秒杀价格 -->
						<view class="flash-config-item">
							<text class="flash-config-label"
								>秒杀价格 <text class="required-mark">*</text></text
							>
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
							<text class="flash-config-label"
								>秒杀库存 <text class="required-mark">*</text></text
							>
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
					</template>
				</scroll-view>

				<view class="popup-footer">
					<button class="popup-btn cancel-btn" @click="closeFlashSalePopup">
						取消
					</button>
					<button class="popup-btn confirm-btn" @click="confirmFlashSale">
						确认
					</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { productApi } from "@/api/product";
import { categoryApi } from "@/api/category";
import { checkSensitiveWord, SensitiveCheckType } from "@/utils/sensitive-word";
import { useThemeStyle, useThemeColors, useThemePage } from "@/utils/theme";
import { onShow } from "@dcloudio/uni-app";

const { themeStyle, themeColors } = useThemeStyle();
const { primaryColor, successColor, warningColor, dangerColor } = useThemeColors();

// 计算页面样式（同时设置 CSS 变量和 background-color）
const pageStyle = computed(() => {
	const bgColor = themeColors.value.bgColorPage;
	console.log(`[edit.vue] pageStyle computed - bgColor: ${bgColor}`);
	return `background-color: ${bgColor}; ${themeStyle.value}`;
});

// 成色选项
const CONDITIONS = [
	{ value: "new", label: "全新", icon: "✨", desc: "未使用过，无任何痕迹" },
	{
		value: "almost_new",
		label: "几乎全新",
		icon: "🌟",
		desc: "使用次数极少，几乎看不出痕迹",
	},
	{
		value: "lightly_used",
		label: "轻微使用",
		icon: "👌",
		desc: "使用过几次，有轻微使用痕迹",
	},
	{
		value: "obviously_used",
		label: "明显使用",
		icon: "📦",
		desc: "使用过一段时间，有明显使用痕迹",
	},
	{ value: "has_flaws", label: "有瑕疵", icon: "⚠️", desc: "有明显瑕疵或功能性问题" },
];

const productId = ref<string>("");
const images = ref<string[]>([]);
const categories = ref<any[]>([]);
const showCategoryPicker = ref(false);
const categoryPickerValue = ref([0]);
const indicatorStyle = "height: 50px;";

// 弹窗ref
const titlePopup = ref();
const pricePopup = ref();
const conditionPopup = ref();
const locationPopup = ref();
const flashSalePopup = ref();
const deliveryMethodPopup = ref();

// 临时值
const tempTitle = ref("");
const tempPrice = ref("");
const tempOriginalPrice = ref("");

// 表单验证错误
const errors = ref<Record<string, string>>({
	images: "",
	title: "",
	price: "",
	categoryId: "",
	flashPrice: "",
});

// 表单数据
const form = ref({
	title: "",
	description: "",
	price: "",
	originalPrice: "",
	condition: CONDITIONS[0].label,
	categoryId: "",
	categoryName: "",
	location: "",
	locationName: "",
	canDelivery: false,
	freeShipping: false,
	deliveryFee: "",
	// 秒杀配置
	isFlashSale: false,
	flashPrice: "",
	flashSaleStock: "",
	limitPerUser: "1",
});

const submitting = ref(false);

// 自定义位置输入
const customLocationInput = ref("");

// 常用位置列表
const commonLocations = ref([
	{ name: "图书馆", address: "校园中心区", icon: "home", latitude: 0, longitude: 0 },
	{
		name: "第一食堂",
		address: "东区生活广场",
		icon: "shop",
		latitude: 0,
		longitude: 0,
	},
	{ name: "第二食堂", address: "西区宿舍区", icon: "shop", latitude: 0, longitude: 0 },
	{
		name: "教学楼A栋",
		address: "教学主楼",
		icon: "calendar",
		latitude: 0,
		longitude: 0,
	},
	{
		name: "体育馆",
		address: "体育运动区",
		icon: "paperplane",
		latitude: 0,
		longitude: 0,
	},
	{
		name: "学生活动中心",
		address: "学生活动广场",
		icon: "star",
		latitude: 0,
		longitude: 0,
	},
	{ name: "校门口", address: "学校正门", icon: "location", latitude: 0, longitude: 0 },
	{ name: "快递站", address: "菜鸟驿站", icon: "box", latitude: 0, longitude: 0 },
]);

const conditionOptions = ref(CONDITIONS);

const discountPercent = computed(() => {
	const price = parseFloat(form.value.price) || 0;
	const originalPrice = parseFloat(form.value.originalPrice) || 0;
	if (originalPrice > price) {
		return Math.round(((originalPrice - price) / originalPrice) * 100);
	}
	return 0;
});

// 表单验证
const isFormValid = computed(() => {
	return (
		form.value.title.trim() &&
		form.value.price &&
		form.value.categoryId &&
		form.value.condition &&
		images.value.length > 0 &&
		(!form.value.isFlashSale || (form.value.flashPrice && form.value.flashSaleStock))
	);
});

onShow(() => {
	useThemePage();
});

onMounted(() => {
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1] as any;
	const options = currentPage.options || {};
	productId.value = options.id || "";

	if (productId.value) {
		loadProductDetail();
	}
	loadCategories();
});

async function loadCategories() {
	try {
		const res = await categoryApi.getCategoryList();
		categories.value = res.data || [];
	} catch (e) {
		console.error("加载分类失败:", e);
	}
}

function loadProductDetail() {
	uni.showLoading({ title: "加载中..." });

	productApi
		.getProductDetail(productId.value)
		.then((data: any) => {
			// 映射 conditionLevel 到 condition value
			const conditionLevel = data.conditionLevel || 10;
			const conditionMap: Record<number, string> = {
				10: "new",
				9: "almost_new",
				8: "lightly_used",
				7: "obviously_used",
				6: "has_flaws",
			};

			form.value = {
				title: data.title || "",
				description: data.description || "",
				price: data.price ? String(data.price) : "",
				originalPrice: data.originalPrice ? String(data.originalPrice) : "",
				condition: conditionMap[conditionLevel] || CONDITIONS[0].value,
				categoryId: String(data.categoryId || ""),
				categoryName: data.categoryName || "",
				location:
					data.latitude && data.longitude
						? `${data.latitude},${data.longitude}`
						: "",
				locationName: data.location || "",
				canDelivery: data.canDelivery || false,
				freeShipping: data.freeShipping || false,
				deliveryFee: data.deliveryFee ? String(data.deliveryFee) : "",
				isFlashSale: data.isFlashSale || false,
				flashPrice: data.flashPrice ? String(data.flashPrice) : "",
				flashSaleStock: data.flashSaleStock ? String(data.flashSaleStock) : "",
				limitPerUser: data.limitPerUser ? String(data.limitPerUser) : "1",
			};
			images.value = data.imageUrls || [];

			// 设置分类选择器的值
			const categoryIndex = categories.value.findIndex(
				(c) => String(c.id) === form.value.categoryId
			);
			if (categoryIndex >= 0) {
				categoryPickerValue.value = [categoryIndex];
			}
		})
		.catch(() => {
			uni.showToast({ title: "加载失败", icon: "none" });
		})
		.finally(() => {
			uni.hideLoading();
		});
}

// 图片相关操作
function chooseImage() {
	const maxCount = 9 - images.value.length;
	uni.chooseImage({
		count: maxCount,
		sizeType: ["compressed"],
		sourceType: ["album", "camera"],
		success: (res) => {
			images.value.push(...res.tempFilePaths);
		},
	});
}

function removeImage(index: number) {
	images.value.splice(index, 1);
}

function previewImage(index: number) {
	uni.previewImage({
		current: index,
		urls: images.value,
	});
}

// 标题弹窗相关函数
function openTitlePopup() {
	tempTitle.value = form.value.title;
	titlePopup.value?.open();
}

function closeTitlePopup() {
	titlePopup.value?.close();
}

function confirmTitle() {
	if (!tempTitle.value.trim()) {
		uni.showToast({ title: "请输入商品标题", icon: "none" });
		return;
	}
	form.value.title = tempTitle.value;
	validateField("title");
	closeTitlePopup();
}

// 价格弹窗相关函数
function openPricePopup() {
	tempPrice.value = form.value.price;
	tempOriginalPrice.value = form.value.originalPrice;
	pricePopup.value?.open();
}

function closePricePopup() {
	pricePopup.value?.close();
}

function confirmPrice() {
	if (tempPrice.value) {
		const price = parseFloat(tempPrice.value);
		if (price <= 0) {
			uni.showToast({ title: "售价必须大于0", icon: "none" });
			return;
		}
	}
	form.value.price = tempPrice.value;
	form.value.originalPrice = tempOriginalPrice.value;
	validateField("price");
	closePricePopup();
}

// 成色选择相关函数
function openConditionPopup() {
	conditionPopup.value?.open();
}

function closeConditionPopup() {
	conditionPopup.value?.close();
}

function selectCondition(condition: typeof CONDITIONS[number]) {
	form.value.condition = condition.value;
	closeConditionPopup();
}

// 位置选择相关函数
function openLocationPopup() {
	locationPopup.value?.open();
}

function closeLocationPopup() {
	locationPopup.value?.close();
}

function selectCommonLocation(loc: typeof commonLocations.value[number]) {
	form.value.locationName = loc.name;
	form.value.location = `${loc.latitude},${loc.longitude}`;
	closeLocationPopup();
}

function clearLocation() {
	form.value.locationName = "";
	form.value.location = "";
	closeLocationPopup();
}

function onCustomLocationInput(e: any) {
	customLocationInput.value = e.detail.value;
}

function clearCustomInput() {
	customLocationInput.value = "";
}

function confirmCustomLocation() {
	const input = customLocationInput.value.trim();
	if (!input) {
		uni.showToast({ title: "请输入位置名称", icon: "none" });
		return;
	}

	form.value.locationName = input;
	form.value.location = "0,0";
	customLocationInput.value = "";
	closeLocationPopup();
}

// 分类选择相关函数
function onCategoryPickerChange(e: any) {
	categoryPickerValue.value = e.detail.value;
}

function confirmCategory() {
	const index = categoryPickerValue.value[0];
	const category = categories.value[index];
	if (category) {
		form.value.categoryId = String(category.id);
		form.value.categoryName = category.name;
		validateField("categoryId");
	}
	showCategoryPicker.value = false;
}

// 交易方式弹窗相关函数
function openDeliveryMethodPopup() {
	deliveryMethodPopup.value?.open();
}

function closeDeliveryMethodPopup() {
	deliveryMethodPopup.value?.close();
}

function toggleCanDelivery(e: any) {
	form.value.canDelivery = e.detail.value;
}

function confirmDeliveryMethod() {
	closeDeliveryMethodPopup();
}

// 秒杀配置弹窗相关函数
function openFlashSalePopup() {
	flashSalePopup.value?.open();
}

function closeFlashSalePopup() {
	flashSalePopup.value?.close();
}

function toggleFlashSale(e: any) {
	form.value.isFlashSale = e.detail.value;
	if (form.value.isFlashSale) {
		const price = parseFloat(form.value.price) || 0;
		if (price > 0 && !form.value.flashPrice) {
			form.value.flashPrice = (price * 0.8).toFixed(2);
		}
		if (!form.value.limitPerUser) {
			form.value.limitPerUser = "1";
		}
	}
}

function confirmFlashSale() {
	if (form.value.isFlashSale) {
		if (!form.value.flashPrice) {
			uni.showToast({ title: "请输入秒杀价格", icon: "none" });
			return;
		}
		if (parseFloat(form.value.flashPrice) >= parseFloat(form.value.price || "0")) {
			uni.showToast({ title: "秒杀价格必须低于售价", icon: "none" });
			return;
		}
		if (!form.value.flashSaleStock) {
			uni.showToast({ title: "请输入秒杀库存", icon: "none" });
			return;
		}
	}
	closeFlashSalePopup();
}

// 表单验证
function validateField(field: string) {
	switch (field) {
		case "title":
			errors.value.title = form.value.title.trim() ? "" : "请输入商品标题";
			break;
		case "price":
			if (!form.value.price) {
				errors.value.price = "请输入售价";
			} else if (parseFloat(form.value.price) <= 0) {
				errors.value.price = "售价必须大于0";
			} else {
				errors.value.price = "";
			}
			break;
		case "categoryId":
			errors.value.categoryId = form.value.categoryId ? "" : "请选择商品分类";
			break;
		case "flashPrice":
			if (form.value.isFlashSale) {
				if (!form.value.flashPrice) {
					errors.value.flashPrice = "请输入秒杀价格";
				} else if (
					parseFloat(form.value.flashPrice) >=
					parseFloat(form.value.price || "0")
				) {
					errors.value.flashPrice = "秒杀价格必须低于售价";
				} else {
					errors.value.flashPrice = "";
				}
			}
			break;
		case "images":
			errors.value.images = images.value.length > 0 ? "" : "请至少上传一张商品图片";
			break;
	}
}

async function submitEdit() {
	if (!isFormValid.value) return;

	// 检查敏感词
	const [titleCheck, descCheck] = await Promise.all([
		checkSensitiveWord(form.value.title, SensitiveCheckType.PRODUCT),
		checkSensitiveWord(form.value.description || "", SensitiveCheckType.PRODUCT),
	]);

	// 如果包含禁止词，停止提交
	if (titleCheck && !titleCheck.passed) return;
	if (descCheck && !descCheck.passed) return;

	// 使用过滤后的内容
	const filteredTitle = titleCheck?.filteredContent || form.value.title;
	const filteredDesc = descCheck?.filteredContent || form.value.description;

	// 如果有敏感词被过滤，显示提示
	if (titleCheck?.hasSensitiveWord || descCheck?.hasSensitiveWord) {
		uni.showToast({
			title: "已自动过滤敏感词",
			icon: "none",
			duration: 1500,
		});
	}

	const conditionMap: Record<string, number> = {
		new: 10,
		almost_new: 9,
		lightly_used: 8,
		obviously_used: 7,
		has_flaws: 6,
	};

	// 解析位置信息
	let latitude: number | undefined;
	let longitude: number | undefined;
	let location = form.value.location;
	if (form.value.location && form.value.location.includes(",")) {
		const [lat, lng] = form.value.location.split(",");
		latitude = parseFloat(lat);
		longitude = parseFloat(lng);
		location = form.value.locationName || form.value.location;
	}

	const submitData = {
		title: filteredTitle,
		description: filteredDesc,
		price: parseFloat(form.value.price),
		originalPrice: form.value.originalPrice
			? parseFloat(form.value.originalPrice)
			: undefined,
		conditionLevel: conditionMap[form.value.condition],
		categoryId: form.value.categoryId,
		imageUrls: images.value,
		location: location,
		latitude: latitude,
		longitude: longitude,
		canDelivery: form.value.canDelivery,
		freeShipping: form.value.freeShipping,
		deliveryFee: form.value.deliveryFee
			? parseFloat(form.value.deliveryFee)
			: undefined,
		isFlashSale: form.value.isFlashSale,
		flashPrice: form.value.flashPrice ? parseFloat(form.value.flashPrice) : undefined,
		flashSaleStock: form.value.flashSaleStock
			? parseInt(form.value.flashSaleStock)
			: undefined,
		limitPerUser: form.value.limitPerUser
			? parseInt(form.value.limitPerUser)
			: undefined,
	};

	submitting.value = true;
	uni.showLoading({ title: "保存中..." });

	productApi
		.updateProduct(productId.value, submitData)
		.then(() => {
			uni.showToast({ title: "修改成功", icon: "success" });
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		})
		.catch(() => {
			uni.showToast({ title: "修改失败", icon: "none" });
		})
		.finally(() => {
			submitting.value = false;
			uni.hideLoading();
		});
}
</script>

<style lang="scss" scoped>
$font-weight-medium: 500;
$font-weight-semibold: 600;

.edit-page {
	height: 100vh;
	height: 100dvh;
	background: var(--bg-color-page);
	overflow: hidden;
}

.scroll-view {
	height: 100%;
	background: var(--bg-color-page);
	box-sizing: border-box;
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.card {
	background: var(--bg-color-card);
	margin-bottom: 16rpx;
	padding: 0 var(--spacing-md);
}

.form-item {
	display: flex;
	padding: var(--spacing-md) 0;
	border-bottom: 1px solid var(--border-color-light);

	&:last-child {
		border-bottom: none;
	}

	&.horizontal {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	&.vertical {
		flex-direction: column;
		align-items: stretch;
	}

	&.clickable {
		&:active {
			background: var(--bg-color-page);
		}
	}
}

.form-label {
	display: flex;
	align-items: center;
	font-size: var(--font-size-base);
	color: var(--text-color-primary);
	font-weight: $font-weight-medium;
	flex-shrink: 0;
	width: 180rpx;

	.required-mark {
		color: var(--error-color);
		margin-left: 4rpx;
	}
}

.form-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: var(--spacing-xs);

	.value-text {
		font-size: var(--font-size-base);
		color: var(--text-color-primary);

		&.placeholder {
			color: var(--text-color-placeholder);
		}
	}
}

.title-selector-inline,
.condition-selector-inline,
.category-selector-inline {
	flex: 1;
	text-align: right;
	padding-right: var(--spacing-xs);
}

.title-name-text,
.condition-name-text,
.category-name-text {
	font-size: var(--font-size-base);
	color: var(--text-color-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.title-placeholder-inline,
.condition-placeholder-inline,
.category-placeholder-inline {
	font-size: var(--font-size-base);
	color: var(--text-color-placeholder);
}

.image-upload-section {
	padding: var(--spacing-md) 0;

	.image-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.image-item {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--border-radius-sm);
		overflow: hidden;

		.preview-image {
			width: 100%;
			height: 100%;
		}

		.delete-btn {
			position: absolute;
			top: 8rpx;
			right: 8rpx;
			width: 40rpx;
			height: 40rpx;
			background: rgba(0, 0, 0, 0.5);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.cover-tag {
			position: absolute;
			bottom: 8rpx;
			left: 8rpx;
			padding: 4rpx 12rpx;
			background: var(--primary-color-alpha-95);
			color: #fff;
			font-size: var(--font-size-xs);
			border-radius: 4rpx;
		}
	}

	.upload-btn {
		aspect-ratio: 1;
		border: 2rpx dashed var(--border-color-light);
		border-radius: var(--border-radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-color-page);
	}

	.upload-tip {
		font-size: var(--font-size-xs);
		color: var(--text-color-tertiary);
		display: block;
		text-align: center;
	}
}

.textarea-wrapper {
	position: relative;
	width: 100%;
	margin-top: var(--spacing-sm);

	.textarea {
		width: 100%;
		min-height: 200rpx;
		padding: var(--spacing-sm);
		background: var(--bg-color-page);
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-base);
		line-height: 1.6;
	}

	.count {
		position: absolute;
		bottom: var(--spacing-sm);
		right: var(--spacing-sm);
		font-size: var(--font-size-xs);
		color: var(--text-color-tertiary);
	}
}

.price-display-inline {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4rpx;

	.price-main-text {
		font-size: var(--font-size-xl);
		font-weight: $font-weight-semibold;
		color: var(--primary-color);
	}

	.price-placeholder-text {
		font-size: var(--font-size-base);
		color: var(--text-color-placeholder);
	}

	.price-discount-text {
		font-size: var(--font-size-xs);
		color: var(--text-color-tertiary);
		text-decoration: line-through;
	}
}

.delivery-method-display {
	flex: 1;
	text-align: right;

	.delivery-text {
		font-size: var(--font-size-base);
		color: var(--text-color-primary);
	}
}

.flash-sale-display {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: var(--spacing-xs);

	.flash-status-text {
		font-size: var(--font-size-base);
		color: var(--text-color-tertiary);

		&.active {
			color: var(--error-color);
		}
	}

	.flash-price-text {
		font-size: var(--font-size-lg);
		font-weight: $font-weight-semibold;
		color: var(--error-color);
	}
}

// 弹窗通用样式
.popup-animate-in {
	animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

.condition-popup,
.amount-popup,
.input-popup,
.delivery-method-popup,
.flash-sale-popup,
.location-popup,
.category-popup {
	width: 100%;
	max-width: 100vw;
	background: var(--bg-color-card);
	border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
	// 使用 calc 计算高度，减去底部安全区域
	max-height: calc(80vh - env(safe-area-inset-bottom));
	display: flex;
	flex-direction: column;
	// 添加底部安全区域 padding
	padding-bottom: env(safe-area-inset-bottom);
	// 确保 border-box，防止 padding 导致溢出
	box-sizing: border-box;
	// 防止内容横向溢出
	overflow-x: hidden;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--spacing-md);
	border-bottom: 1px solid var(--border-color-light);

	.popup-title {
		font-size: var(--font-size-lg);
		font-weight: $font-weight-semibold;
		color: var(--text-color-primary);
	}

	.close-btn {
		padding: var(--spacing-xs);
	}
}

.condition-content {
	padding: var(--spacing-md);
	max-height: 60vh;
	overflow-y: auto;

	.condition-item {
		display: flex;
		align-items: center;
		padding: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
		background: var(--bg-color-page);
		border-radius: var(--border-radius-base);
		border: 2rpx solid transparent;
		transition: all var(--motion-duration-fast) var(--motion-ease-standard);

		&.active {
			background: var(--primary-color-alpha-10);
			border-color: var(--primary-color);
		}

		.condition-icon {
			font-size: 48rpx;
			margin-right: var(--spacing-md);
		}

		.condition-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4rpx;

			.condition-label {
				font-size: var(--font-size-base);
				color: var(--text-color-primary);
				font-weight: $font-weight-medium;
			}

			.condition-desc {
				font-size: var(--font-size-sm);
				color: var(--text-color-tertiary);
			}
		}

		.condition-check {
			margin-left: var(--spacing-sm);
		}
	}
}

.amount-content {
	padding: var(--spacing-md);

	.amount-input-wrapper {
		display: flex;
		align-items: center;
		height: 100rpx;
		background: var(--bg-color-page);
		border-radius: var(--border-radius-base);
		padding: 0 var(--spacing-md);
		margin-bottom: var(--spacing-md);

		.amount-symbol {
			font-size: 48rpx;
			font-weight: $font-weight-semibold;
			color: var(--primary-color);
			margin-right: var(--spacing-xs);
		}

		.amount-input {
			flex: 1;
			font-size: 48rpx;
			font-weight: $font-weight-semibold;
			color: var(--text-color-primary);
		}

		&.small {
			height: 80rpx;

			.amount-symbol {
				font-size: var(--font-size-xl);
			}

			.amount-input {
				font-size: var(--font-size-xl);
			}
		}
	}

	.quick-amounts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);

		.amount-item {
			height: 72rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--bg-color-page);
			border-radius: var(--border-radius-sm);
			border: 2rpx solid transparent;
			transition: all var(--motion-duration-fast) var(--motion-ease-standard);

			&.active {
				background: var(--primary-color-alpha-10);
				border-color: var(--primary-color);
			}

			.amount-item-text {
				font-size: var(--font-size-base);
				color: var(--text-color-primary);
			}
		}
	}

	.original-price-section {
		margin-top: var(--spacing-md);

		.original-price-label {
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
			display: block;
			margin-bottom: var(--spacing-sm);
		}

		.discount-preview {
			margin-top: var(--spacing-sm);
			padding: var(--spacing-sm);
			background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%);
			border-radius: var(--border-radius-sm);
			text-align: center;

			.discount-preview-text {
				font-size: var(--font-size-sm);
				color: var(--primary-color);
				font-weight: $font-weight-medium;
			}
		}
	}
}

.input-content {
	padding: var(--spacing-md);
	position: relative;

	.popup-textarea {
		width: 100%;
		min-height: 200rpx;
		padding: var(--spacing-sm);
		background: var(--bg-color-page);
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-base);
		line-height: 1.6;
	}

	.count-text {
		position: absolute;
		bottom: var(--spacing-md);
		right: var(--spacing-md);
		font-size: var(--font-size-xs);
		color: var(--text-color-tertiary);
	}
}

.category-picker {
	height: 500rpx;
	background: var(--bg-color-page);

	.category-picker-item {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-base);
		color: var(--text-color-primary);
	}
}

.popup-footer {
	display: flex;
	gap: var(--spacing-md);
	padding: var(--spacing-md);
	// 底部添加安全区域间距
	padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
	border-top: 1px solid var(--border-color-light);

	.popup-btn {
		flex: 1;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-base);
		font-weight: $font-weight-medium;
		border-radius: var(--border-radius-base);
		border: none;

		&.cancel-btn {
			background: var(--bg-color-page);
			color: var(--text-color-secondary);
		}

		&.confirm-btn {
			background: var(--primary-color);
			color: #fff;
		}

		&.confirm-btn[disabled] {
			opacity: 0.5;
		}
	}
}

// 位置选择样式
.custom-location-section {
	padding: var(--spacing-md);
	border-bottom: 1px solid var(--border-color-light);

	.location-section-title {
		font-size: var(--font-size-base);
		color: var(--text-color-primary);
		font-weight: $font-weight-medium;
		display: block;
		margin-bottom: var(--spacing-sm);
	}

	.custom-input-wrapper {
		display: flex;
		gap: var(--spacing-sm);

		.custom-input-box {
			flex: 1;
			display: flex;
			align-items: center;
			height: 72rpx;
			background: var(--bg-color-page);
			border-radius: var(--border-radius-sm);
			padding: 0 var(--spacing-sm);

			.custom-input {
				flex: 1;
				font-size: var(--font-size-base);
				margin: 0 var(--spacing-sm);
			}

			.clear-input-btn {
				padding: var(--spacing-xs);
			}
		}

		.confirm-custom-btn {
			height: 72rpx;
			padding: 0 var(--spacing-md);
			background: var(--primary-color);
			color: #fff;
			font-size: var(--font-size-base);
			border-radius: var(--border-radius-sm);
			border: none;
			display: flex;
			align-items: center;
			justify-content: center;

			&.disabled {
				opacity: 0.5;
			}
		}
	}
}

.location-content {
	padding: var(--spacing-md);
	max-height: 50vh;
	overflow-y: auto;

	.location-section {
		margin-bottom: var(--spacing-md);

		.location-section-title {
			font-size: var(--font-size-sm);
			color: var(--text-color-secondary);
			display: block;
			margin-bottom: var(--spacing-sm);
		}

		.location-list {
			display: flex;
			flex-direction: column;
			gap: var(--spacing-sm);

			.location-item {
				display: flex;
				align-items: center;
				padding: var(--spacing-md);
				background: var(--bg-color-page);
				border-radius: var(--border-radius-base);
				border: 2rpx solid transparent;
				transition: all var(--motion-duration-fast) var(--motion-ease-standard);

				&.active {
					background: var(--primary-color-alpha-10);
					border-color: var(--primary-color);
				}

				.location-item-icon {
					margin-right: var(--spacing-md);
				}

				.location-item-info {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: 4rpx;

					.location-item-name {
						font-size: var(--font-size-base);
						color: var(--text-color-primary);
					}

					.location-item-desc {
						font-size: var(--font-size-sm);
						color: var(--text-color-tertiary);
					}
				}

				.location-item-check {
					margin-left: var(--spacing-sm);
				}
			}
		}

		.clear-location-btn {
			padding: var(--spacing-md);
			text-align: center;

			.clear-location-text {
				font-size: var(--font-size-base);
				color: var(--error-color);
			}
		}
	}
}

// 交易方式样式
.delivery-method-content {
	padding: var(--spacing-md);
	max-height: 60vh;
	overflow-y: auto;

	.delivery-toggle-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md);
		background: var(--bg-color-page);
		border-radius: var(--border-radius-base);
		margin-bottom: var(--spacing-md);

		.delivery-toggle-info {
			display: flex;
			align-items: center;
			gap: var(--spacing-md);

			.delivery-toggle-icon {
				font-size: 48rpx;
			}

			.delivery-toggle-text {
				display: flex;
				flex-direction: column;
				gap: 4rpx;

				.delivery-toggle-label {
					font-size: var(--font-size-base);
					color: var(--text-color-primary);
					font-weight: $font-weight-medium;
				}

				.delivery-toggle-desc {
					font-size: var(--font-size-sm);
					color: var(--text-color-tertiary);
				}
			}
		}
	}

	.delivery-option-section {
		margin-bottom: var(--spacing-md);

		.delivery-section-label {
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
			font-weight: $font-weight-medium;
			display: block;
			margin-bottom: var(--spacing-sm);
		}

		.delivery-options {
			display: flex;
			gap: var(--spacing-sm);

			.delivery-option {
				flex: 1;
				height: 72rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				background: var(--bg-color-page);
				border-radius: var(--border-radius-sm);
				border: 2rpx solid transparent;
				transition: all var(--motion-duration-fast) var(--motion-ease-standard);

				&.active {
					background: var(--primary-color-alpha-10);
					border-color: var(--primary-color);

					.delivery-option-text {
						color: var(--primary-color);
						font-weight: $font-weight-medium;
					}
				}

				.delivery-option-text {
					font-size: var(--font-size-base);
					color: var(--text-color-secondary);
				}
			}
		}
	}

	.delivery-fee-section {
		margin-bottom: var(--spacing-md);

		.delivery-fee-label {
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
			display: block;
			margin-bottom: var(--spacing-sm);
		}

		.delivery-fee-input {
			display: flex;
			align-items: center;
			height: 80rpx;
			background: var(--bg-color-page);
			border-radius: var(--border-radius-sm);
			padding: 0 var(--spacing-md);

			.delivery-fee-symbol {
				font-size: var(--font-size-xl);
				font-weight: $font-weight-semibold;
				color: var(--primary-color);
				margin-right: var(--spacing-xs);
			}

			.delivery-fee-input-field {
				flex: 1;
				font-size: var(--font-size-xl);
				font-weight: $font-weight-semibold;
				color: var(--text-color-primary);
			}
		}
	}
}

// 秒杀配置样式
.flash-sale-content {
	padding: var(--spacing-md);
	max-height: 60vh;
	overflow-y: auto;

	.flash-toggle-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md);
		background: linear-gradient(
			135deg,
			var(--danger-color-alpha-5) 0%,
			var(--danger-color-alpha-5) 100%
		);
		border-radius: var(--border-radius-base);
		margin-bottom: var(--spacing-md);

		.flash-toggle-info {
			display: flex;
			align-items: center;
			gap: var(--spacing-md);

			.flash-toggle-icon {
				font-size: 48rpx;
			}

			.flash-toggle-text {
				display: flex;
				flex-direction: column;
				gap: 4rpx;

				.flash-toggle-label {
					font-size: var(--font-size-base);
					color: var(--text-color-primary);
					font-weight: $font-weight-medium;
				}

				.flash-toggle-desc {
					font-size: var(--font-size-sm);
					color: var(--text-color-tertiary);
				}
			}
		}
	}

	.flash-config-item {
		margin-bottom: var(--spacing-md);

		.flash-config-label {
			font-size: var(--font-size-base);
			color: var(--text-color-primary);
			font-weight: $font-weight-medium;
			display: block;
			margin-bottom: var(--spacing-sm);
		}

		.flash-price-input,
		.flash-stock-input {
			display: flex;
			align-items: center;
			height: 80rpx;
			background: var(--bg-color-page);
			border-radius: var(--border-radius-sm);
			padding: 0 var(--spacing-md);

			.flash-price-symbol,
			.flash-stock-unit {
				font-size: var(--font-size-xl);
				font-weight: $font-weight-semibold;
				color: var(--error-color);
			}

			.flash-price-input-field,
			.flash-stock-input-field {
				flex: 1;
				font-size: var(--font-size-xl);
				font-weight: $font-weight-semibold;
				color: var(--text-color-primary);
				margin: 0 var(--spacing-xs);
			}

			.flash-stock-unit {
				margin-left: var(--spacing-xs);
			}
		}
	}
}

.required-mark {
	color: var(--error-color);
}

// 底部按钮
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
	padding: var(--spacing-md);
	background: var(--bg-color-card);
	border-top: 1px solid var(--border-color-light);
	padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
	z-index: 100;

	.bar-actions {
		.publish-btn {
			width: 100%;
			height: 88rpx;
			background: var(--primary-color);
			color: #fff;
			font-size: var(--font-size-lg);
			font-weight: $font-weight-medium;
			border-radius: var(--border-radius-lg);
			border: none;
			display: flex;
			align-items: center;
			justify-content: center;

			&.disabled {
				opacity: 0.5;
			}
		}
	}
}

// 动画效果
.animated-section {
	animation: fadeInUp 0.4s ease-out backwards;
}

.animated-bottom-bar {
	animation: slideUpBottom 0.3s ease-out;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes slideUpBottom {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}
</style>
