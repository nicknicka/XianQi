<template>
  <view class="drafts-page" :style="themeStyle">
    <!-- 自定义导航栏 -->
    <CustomNavBar
      :show-back="true"
      :avoid-capsule="true"
      background-color="var(--bg-color-card)"
      text-color="var(--text-color-primary)"
    >
      <template #title>
        <text class="nav-title">{{ isEditMode ? `已选${selectedDraftKeys.length}个` : '草稿箱' }}</text>
      </template>
      <template #right>
        <view class="nav-action" @tap="toggleEditMode">
          <text class="edit-text">{{ isEditMode ? '完成' : '管理' }}</text>
        </view>
      </template>
    </CustomNavBar>

    <!-- 编辑模式工具栏 -->
    <view v-if="isEditMode" class="edit-toolbar" :style="{ top: navBarTotalHeight + 'px' }">
      <view class="toolbar-left">
        <view class="select-all-btn" @tap="toggleSelectAll">
          <view class="checkbox" :class="{ checked: isAllSelected }">
            <uni-icons v-if="isAllSelected" type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
          </view>
          <text class="select-all-text">全选当前分组</text>
        </view>
      </view>
      <view class="toolbar-right">
        <view class="delete-btn" @tap="batchDelete" :class="{ disabled: selectedDraftKeys.length === 0 }">
          <uni-icons type="trash" size="16" :color="selectedDraftKeys.length > 0 ? dangerColor : '#cccccc'"></uni-icons>
          <text class="delete-text">删除</text>
        </view>
      </view>
    </view>
    <view v-if="isEditMode" class="edit-toolbar-placeholder"></view>

    <!-- 分段 Tab 切换 -->
    <view class="draft-tabs">
      <view class="draft-tabs-track">
        <view class="draft-tab-slider" :style="sliderStyle"></view>
        <view
          class="draft-tab-item"
          :class="{ active: activeTab === 'market' }"
          @tap="switchTab('market')"
        >
          <text class="draft-tab-icon">📦</text>
          <view class="draft-tab-content">
            <text class="draft-tab-label">商品草稿</text>
            <text class="draft-tab-desc">{{ marketDrafts.length }} 个草稿</text>
          </view>
          <view class="draft-tab-badge" v-if="marketDrafts.length > 0">
            <text class="badge-text">{{ marketDrafts.length }}</text>
          </view>
        </view>
        <view
          class="draft-tab-item"
          :class="{ active: activeTab === 'share' }"
          @tap="switchTab('share')"
        >
          <text class="draft-tab-icon">🔄</text>
          <view class="draft-tab-content">
            <text class="draft-tab-label">共享草稿</text>
            <text class="draft-tab-desc">{{ shareDrafts.length }} 个草稿</text>
          </view>
          <view class="draft-tab-badge share-badge" v-if="shareDrafts.length > 0">
            <text class="badge-text">{{ shareDrafts.length }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="scroll-view" scroll-y @scrolltolower="onScrollToLower">
      <!-- 发布草稿列表 -->
      <view v-if="activeTab === 'market'" class="draft-list tab-enter">
        <view
          v-for="(draft, index) in marketDrafts"
          :key="draft.draftKey"
          class="draft-card animated-item"
          :class="{ 'is-selected': isDraftSelected(draft.draftKey), 'is-edit-mode': isEditMode }"
          :style="{ animationDelay: `${index * 60}ms` }"
          @tap="handleDraftTap(draft, 'market')"
        >
          <view v-if="isEditMode" class="draft-checkbox" @tap.stop="toggleSelectDraft(draft.draftKey)">
            <view class="checkbox" :class="{ checked: isDraftSelected(draft.draftKey) }">
              <uni-icons v-if="isDraftSelected(draft.draftKey)" type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
            </view>
          </view>

          <view class="draft-cover market-cover">
            <lazy-image
              v-if="draft.coverImage"
              class="cover-image"
              :src="normalizeImageUrl(draft.coverImage)"
              mode="aspectFill"
            />
            <view v-else class="cover-placeholder">
              <text class="placeholder-icon">📦</text>
            </view>
            <view class="cover-badge market-badge" v-if="draft.condition">
              <text class="badge-text">{{ draft.condition }}</text>
            </view>
          </view>

          <view class="draft-body">
            <text class="draft-title">{{ draft.title || '未命名草稿' }}</text>
            <view class="draft-tags">
              <text class="draft-tag price-tag" v-if="draft.price">¥{{ draft.price }}</text>
              <text class="draft-tag category-tag" v-if="draft.category">{{ draft.category }}</text>
            </view>
            <view class="draft-footer">
              <text class="draft-time">{{ formatTime(draft.updateTime) }}</text>
              <view class="completion-mini" v-if="draft.completion !== undefined">
                <view class="mini-track">
                  <view class="mini-fill" :style="{ width: draft.completion + '%' }" :class="completionClass(draft.completion)"></view>
                </view>
                <text class="mini-text">{{ draft.completion }}%</text>
              </view>
            </view>
          </view>

          <view class="draft-action" v-if="!isEditMode">
            <view class="action-dot"></view>
            <view class="action-dot"></view>
            <view class="action-dot"></view>
          </view>
        </view>

        <view v-if="marketDrafts.length === 0" class="empty-state">
          <view class="empty-illustration">
            <view class="empty-box">
              <text class="box-icon">📦</text>
            </view>
            <view class="empty-sparkle sparkle-1">✨</view>
            <view class="empty-sparkle sparkle-2">⭐</view>
          </view>
          <text class="empty-title">暂无商品草稿</text>
          <text class="empty-desc">发布商品时会自动保存为草稿</text>
          <view class="empty-btn" @tap="goToPublish('market')">
            <text class="empty-btn-text">去发布商品</text>
          </view>
        </view>
      </view>

      <!-- 共享草稿列表 -->
      <view v-else class="draft-list tab-enter">
        <view
          v-for="(draft, index) in shareDrafts"
          :key="draft.draftKey"
          class="draft-card share-theme animated-item"
          :class="{ 'is-selected': isDraftSelected(draft.draftKey), 'is-edit-mode': isEditMode }"
          :style="{ animationDelay: `${index * 60}ms` }"
          @tap="handleDraftTap(draft, 'share')"
        >
          <view v-if="isEditMode" class="draft-checkbox" @tap.stop="toggleSelectDraft(draft.draftKey)">
            <view class="checkbox" :class="{ checked: isDraftSelected(draft.draftKey) }">
              <uni-icons v-if="isDraftSelected(draft.draftKey)" type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
            </view>
          </view>

          <view class="draft-cover share-cover">
            <lazy-image
              v-if="draft.coverImage"
              class="cover-image"
              :src="normalizeImageUrl(draft.coverImage)"
              mode="aspectFill"
            />
            <view v-else class="cover-placeholder">
              <text class="placeholder-icon">🔄</text>
            </view>
          </view>

          <view class="draft-body">
            <text class="draft-title">{{ draft.title || '未命名草稿' }}</text>
            <view class="draft-tags">
              <text class="draft-tag rent-tag" v-if="draft.dailyRent">¥{{ draft.dailyRent }}/天</text>
              <text class="draft-tag deposit-tag" v-if="draft.deposit">押金¥{{ draft.deposit }}</text>
              <text class="draft-tag category-tag share-cat" v-if="draft.category">{{ draft.category }}</text>
            </view>
            <view class="draft-footer">
              <text class="draft-time">{{ formatTime(draft.updateTime) }}</text>
              <view class="completion-mini" v-if="draft.completion !== undefined">
                <view class="mini-track share-track">
                  <view class="mini-fill share-fill" :style="{ width: draft.completion + '%' }" :class="completionClass(draft.completion)"></view>
                </view>
                <text class="mini-text">{{ draft.completion }}%</text>
              </view>
            </view>
          </view>

          <view class="draft-action" v-if="!isEditMode">
            <view class="action-dot share-dot"></view>
            <view class="action-dot share-dot"></view>
            <view class="action-dot share-dot"></view>
          </view>
        </view>

        <view v-if="shareDrafts.length === 0" class="empty-state">
          <view class="empty-illustration">
            <view class="empty-box share-box">
              <text class="box-icon">🔄</text>
            </view>
            <view class="empty-sparkle sparkle-1">✨</view>
            <view class="empty-sparkle sparkle-2">💚</view>
          </view>
          <text class="empty-title">暂无共享草稿</text>
          <text class="empty-desc">发布共享物品时会自动保存为草稿</text>
          <view class="empty-btn share-btn" @tap="goToPublish('share')">
            <text class="empty-btn-text">去发布共享</text>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="bottom-safe"></view>
    </scroll-view>

    <!-- 草稿详情弹窗 -->
    <view
      v-if="showDetailPopup"
      class="detail-popup-mask"
      @tap="closeDetailPopup"
      @touchmove.stop.prevent
    >
      <view class="detail-popup-content" @tap.stop>
        <view class="popup-header">
          <view class="popup-type-badge" :class="currentDraftType === 'market' ? 'market' : 'share'">
            <text class="type-icon">{{ currentDraftType === 'market' ? '📦' : '🔄' }}</text>
            <text class="type-label">{{ currentDraftType === 'market' ? '商品' : '共享' }}草稿</text>
          </view>
          <view class="popup-close" @tap="closeDetailPopup">
            <view class="close-icon-wrapper">
              <text class="close-icon-text">✕</text>
            </view>
          </view>
        </view>

        <!-- 完成度提示 -->
        <view v-if="currentDraft?.completion !== undefined" class="completion-section">
          <view class="completion-header">
            <text class="completion-label">完成度</text>
            <text class="completion-percent" :class="completionClass(currentDraft.completion)">{{ currentDraft.completion }}%</text>
          </view>
          <view class="completion-track-large">
            <view class="completion-fill-large" :style="{ width: currentDraft.completion + '%' }" :class="completionClass(currentDraft.completion)"></view>
          </view>
          <text v-if="currentDraft?.missingFields?.length" class="completion-hint">
            还需填写: {{ currentDraft.missingFields.join('、') }}
          </text>
        </view>

        <scroll-view
          class="popup-body"
          scroll-y
          :show-scrollbar="true"
          @touchmove.stop
        >
          <!-- 封面图 -->
          <view v-if="currentDraft?.coverImage" class="detail-cover">
            <image class="cover-img" :src="normalizeImageUrl(currentDraft.coverImage)" mode="aspectFill" />
            <view v-if="currentDraft.imageCount > 1" class="image-count-badge">
              <text>{{ currentDraft.imageCount }}张</text>
            </view>
          </view>

          <!-- 标题 -->
          <view class="detail-section">
            <text class="detail-label">物品名称</text>
            <text class="detail-value highlight">{{ currentDraft?.title || '未命名' }}</text>
          </view>

          <!-- 价格信息（商品） -->
          <template v-if="currentDraftType === 'market'">
            <view v-if="currentDraft?.price" class="detail-section">
              <text class="detail-label">价格</text>
              <view class="detail-value price-group">
                <text class="price-current">¥{{ currentDraft.price }}</text>
                <text v-if="currentDraft.originalPrice && currentDraft.originalPrice !== currentDraft.price" class="price-original">
                  原价¥{{ currentDraft.originalPrice }}
                </text>
              </view>
            </view>
            <view v-if="currentDraft?.isFlashSale" class="detail-section flash-sale-info">
              <text class="detail-label">⚡ 秒杀设置</text>
              <view class="flash-details">
                <text class="flash-price">秒杀价 ¥{{ currentDraft.flashPrice }}</text>
                <text v-if="currentDraft.flashSaleStock" class="flash-stock">库存 {{ currentDraft.flashSaleStock }}</text>
              </view>
            </view>
          </template>

          <!-- 价格信息（共享） -->
          <template v-else>
            <view class="detail-section">
              <text class="detail-label">租金/押金</text>
              <view class="detail-value price-group">
                <text class="price-current">¥{{ currentDraft?.dailyRent || 0 }}/天</text>
                <text v-if="currentDraft?.deposit" class="deposit">押金¥{{ currentDraft.deposit }}</text>
              </view>
            </view>
          </template>

          <!-- 成色 -->
          <view v-if="currentDraft?.condition" class="detail-section">
            <text class="detail-label">成色</text>
            <view class="detail-value">
              <text class="condition-tag">{{ currentDraft.condition }}</text>
            </view>
          </view>

          <!-- 分类 -->
          <view v-if="currentDraft?.category" class="detail-section">
            <text class="detail-label">分类</text>
            <text class="detail-value category-tag">{{ currentDraft.category }}</text>
          </view>

          <!-- 位置 -->
          <view v-if="currentDraft?.location" class="detail-section">
            <text class="detail-label">交易地点</text>
            <view class="detail-value location-info">
              <uni-icons type="location" size="14" color="#999999"></uni-icons>
              <text class="location-text">{{ currentDraft.location }}</text>
            </view>
          </view>

          <!-- 配送信息（商品） -->
          <template v-if="currentDraftType === 'market'">
            <view v-if="currentDraft?.canDelivery" class="detail-section">
              <text class="detail-label">配送方式</text>
              <view class="detail-value delivery-tags">
                <text class="delivery-tag">支持邮寄</text>
                <text v-if="currentDraft.freeShipping" class="delivery-tag free">包邮</text>
              </view>
            </view>
          </template>

          <!-- 描述 -->
          <view v-if="currentDraft?.description" class="detail-section">
            <text class="detail-label">描述</text>
            <text class="detail-value desc">{{ currentDraft.description }}</text>
          </view>

          <!-- 保存时间 -->
          <view class="detail-section">
            <text class="detail-label">保存时间</text>
            <text class="detail-value time">{{ formatFullTime(currentDraft?.updateTime) }}</text>
          </view>

          <!-- 草稿ID -->
          <view class="detail-section">
            <text class="detail-label">草稿ID</text>
            <text class="detail-value draft-id">#{{ currentDraft?.draftId }}</text>
          </view>
        </scroll-view>

        <!-- 操作按钮 -->
        <view class="popup-actions">
          <view class="popup-btn secondary" @tap="closeDetailPopup">
            <text>取消</text>
          </view>
          <view class="popup-btn primary" @tap="importDraft">
            <text>导入草稿</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { productApi } from '@/api/product'
import { shareApi } from '@/api/share'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { normalizeImageUrl } from '@/utils/image'
import { useThemeColors, useThemePage, useThemeStyle } from '@/utils/theme'
import { getNavBarInfo } from '@/utils/system-info'

const { dangerColor } = useThemeColors()
const { themeStyle } = useThemeStyle()

const navBarInfo = getNavBarInfo()
const navBarTotalHeight = navBarInfo.totalHeight

const activeTab = ref<'market' | 'share'>('market')
const marketDrafts = ref<any[]>([])
const shareDrafts = ref<any[]>([])
const MAX_DRAFTS = 10
const conditionMap: Record<number, string> = {
  10: '全新',
  9: '九成新',
  8: '八成新',
  7: '七成新',
  6: '六成新及以下'
}

const isEditMode = ref(false)
const selectedDraftKeys = ref<string[]>([])

const showDetailPopup = ref(false)
const currentDraft = ref<any>(null)
const currentDraftType = ref<'market' | 'share'>('market')

onLoad((options: any) => {
  const sourceTab = options?.source || options?.type || options?.draftType
  if (sourceTab === 'share') {
    activeTab.value = 'share'
  } else if (sourceTab === 'market') {
    activeTab.value = 'market'
  }
})

function buildDraftKey(type: 'market' | 'share', draftId: string) {
  return `${type}:${draftId}`
}

function normalizeMarketDraft(draft: any) {
  const draftId = resolveDraftId(draft, 'market')
  return {
    ...draft,
    draftType: 'market',
    draftId,
    draftKey: buildDraftKey('market', draftId),
    coverImage: normalizeImageUrl(draft.coverImage || draft.image || draft.productImage || draft.coverImageUrl),
    condition: conditionMap[draft.conditionLevel] || draft.condition || '未知成色',
    category: draft.categoryName
  }
}

function normalizeShareDraft(draft: any) {
  const draftId = resolveDraftId(draft, 'share')
  return {
    ...draft,
    draftType: 'share',
    draftId,
    draftKey: buildDraftKey('share', draftId),
    coverImage: normalizeImageUrl(draft.coverImage || draft.image || draft.shareItemImage || draft.coverImageUrl),
    condition: draft.conditionText || draft.condition || '',
    category: draft.categoryName
  }
}

function completionClass(completion: number): string {
  if (completion >= 80) return 'high'
  if (completion >= 50) return 'medium'
  return 'low'
}

const sliderStyle = computed(() => ({
  transform: activeTab.value === 'share' ? 'translateX(100%)' : 'translateX(0)'
}))

onMounted(() => {
  loadDrafts()
})

onShow(() => {
  useThemePage()
})

async function loadDrafts() {
  try {
    const marketRes = await productApi.getDraftList({ page: 1, pageSize: MAX_DRAFTS })
    let marketData = marketRes.data?.records || []

    marketDrafts.value = marketData
      .map(normalizeMarketDraft)
      .sort((a: any, b: any) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())
      .slice(0, MAX_DRAFTS)

    const shareRes = await shareApi.getDraftList({ page: 1, pageSize: MAX_DRAFTS })
    let shareData = shareRes.data?.records || []
    shareDrafts.value = shareData
      .map(normalizeShareDraft)
      .sort((a: any, b: any) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())
      .slice(0, MAX_DRAFTS)

    console.log('[Drafts] 加载草稿成功:', {
      market: marketDrafts.value.length,
      share: shareDrafts.value.length
    })
  } catch (error) {
    console.error('[Drafts] 加载草稿失败:', error)
    loadDraftsFromLocal()
  }
}

function loadDraftsFromLocal() {
  try {
    const marketDraftStr = uni.getStorageSync('product_publish_draft')
    const shareDraftStr = uni.getStorageSync('share_draft_data')

    if (marketDraftStr) {
      const data = JSON.parse(marketDraftStr)
      if (data.form?.title) {
        marketDrafts.value = [normalizeMarketDraft({
          ...data.form,
          draftId: data.form.draftId,
          images: data.images || [],
          coverImage: data.images?.[0],
          updateTime: data.updateTime
        })]
      }
    }

    if (shareDraftStr) {
      const data = JSON.parse(shareDraftStr)
      if (data.form?.title) {
        shareDrafts.value = [normalizeShareDraft({
          ...data.form,
          draftId: data.form.draftId,
          images: data.images || [],
          coverImage: data.images?.[0],
          updateTime: data.updateTime
        })]
      }
    }
  } catch (error) {
    console.error('[Drafts] 从本地加载草稿失败:', error)
  }
}

function switchTab(tab: 'market' | 'share') {
  if (activeTab.value !== tab) {
    selectedDraftKeys.value = []
  }
  activeTab.value = tab
}

function editDraft(draft: any, type: 'market' | 'share') {
  if (!draft || !draft.draftId) {
    uni.showToast({ title: '草稿数据异常', icon: 'none' })
    return
  }

  const url = type === 'market'
    ? `/pages/market/publish?draftId=${draft.draftId}`
    : `/pages/share/publish?draftId=${draft.draftId}`

  uni.navigateTo({
    url,
    fail: () => uni.showToast({ title: '打开草稿失败', icon: 'none' })
  })
}

function goToPublish(type: 'market' | 'share') {
  uni.navigateTo({
    url: type === 'market' ? '/pages/market/publish' : '/pages/share/publish',
    fail: () => uni.showToast({ title: '跳转失败', icon: 'none' })
  })
}

function toggleEditMode() {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    selectedDraftKeys.value = []
  }
}

function isDraftSelected(draftKey: string): boolean {
  return selectedDraftKeys.value.includes(draftKey)
}

function toggleSelectDraft(draftKey: string) {
  if (selectedDraftKeys.value.includes(draftKey)) {
    selectedDraftKeys.value = selectedDraftKeys.value.filter(key => key !== draftKey)
  } else {
    selectedDraftKeys.value = [...selectedDraftKeys.value, draftKey]
  }
}

const isAllSelected = computed(() => {
  const currentDrafts = activeTab.value === 'market' ? marketDrafts.value : shareDrafts.value
  return currentDrafts.length > 0 && currentDrafts.every(draft => selectedDraftKeys.value.includes(draft.draftKey))
})

function toggleSelectAll() {
  const currentDrafts = activeTab.value === 'market' ? marketDrafts.value : shareDrafts.value
  if (isAllSelected.value) {
    selectedDraftKeys.value = selectedDraftKeys.value.filter(key => !currentDrafts.some(draft => draft.draftKey === key))
  } else {
    const nextKeys = currentDrafts.map(draft => draft.draftKey)
    selectedDraftKeys.value = Array.from(new Set([...selectedDraftKeys.value, ...nextKeys]))
  }
}

function handleDraftTap(draft: any, type: 'market' | 'share') {
  if (isEditMode.value) {
    toggleSelectDraft(draft.draftKey)
  } else {
    viewDraftDetail(draft, type)
  }
}

function batchDelete() {
  if (selectedDraftKeys.value.length === 0) {
    uni.showToast({ title: '请选择要删除的草稿', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedDraftKeys.value.length} 个草稿吗？`,
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          const type = activeTab.value
          const draftsRef = type === 'market' ? marketDrafts : shareDrafts
          const targetDrafts = draftsRef.value.filter(draft => selectedDraftKeys.value.includes(draft.draftKey))

          if (targetDrafts.length === 0) {
            uni.showToast({ title: '当前分组无可删除草稿', icon: 'none' })
            return
          }

          const failedIds: string[] = []
          for (const draft of targetDrafts) {
            try {
              if (!draft.draftId) throw new Error('草稿缺少可删除 ID')
              if (type === 'market') {
                await productApi.deleteDraft(String(draft.draftId))
              } else {
                await shareApi.deleteDraft(String(draft.draftId))
              }
            } catch (error) {
              console.warn('[Drafts] 删除单个草稿失败:', draft.draftKey, error)
              failedIds.push(draft.draftKey)
            }
          }

          const successIds = targetDrafts
            .map(draft => draft.draftKey)
            .filter(draftKey => !failedIds.includes(draftKey))

          draftsRef.value = draftsRef.value.filter(d => !successIds.includes(d.draftKey))
          selectedDraftKeys.value = []
          isEditMode.value = false

          if (failedIds.length === 0) {
            uni.showToast({ title: '删除成功', icon: 'success' })
          } else if (successIds.length > 0) {
            uni.showToast({ title: `已删除${successIds.length}个，失败${failedIds.length}个`, icon: 'none' })
          } else {
            uni.showToast({ title: '删除失败', icon: 'none' })
          }
        } catch (error) {
          console.error('[Drafts] 批量删除失败:', error)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

function formatTime(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatFullTime(time: string): string {
  if (!time) return '未知'
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function viewDraftDetail(draft: any, type: 'market' | 'share') {
  currentDraft.value = {
    ...draft,
    coverImage: normalizeImageUrl(draft?.coverImage || draft?.image || draft?.productImage || draft?.coverImageUrl)
  }
  currentDraftType.value = draft?.draftType || type
  showDetailPopup.value = true
}

function closeDetailPopup() {
  showDetailPopup.value = false
  currentDraft.value = null
}

async function importDraft() {
  if (!currentDraft.value) return

  const draftToImport = JSON.parse(JSON.stringify(currentDraft.value))
  const draftType = currentDraftType.value

  showDetailPopup.value = false
  currentDraft.value = null

  if (!draftToImport || !draftToImport.draftId) {
    uni.showToast({ title: '草稿数据异常', icon: 'none' })
    return
  }

  const storageKey = draftType === 'market' ? 'product_publish_draft' : 'share_draft_data'
  const hasLocalDraft = checkLocalDraft(storageKey)

  if (hasLocalDraft) {
    const currentCount = draftType === 'market' ? marketDrafts.value.length : shareDrafts.value.length
    const isFull = currentCount >= MAX_DRAFTS

    const itemList = isFull
      ? ['保存并清理旧草稿', '直接遗弃本地内容', '取消']
      : ['保存当前草稿', '直接遗弃本地内容', '取消']

    uni.showActionSheet({
      itemList: itemList,
      success: async (res) => {
        if (res.tapIndex === 0) {
          try {
            await saveLocalDraftToServer(draftType)
            if (isFull) await clearOldestDraft(draftType)
            await loadDrafts()
            editDraft(draftToImport, draftType)
          } catch (e) {
            console.error('保存本地草稿失败:', e)
            uni.showToast({ title: '保存失败，无法导入', icon: 'none' })
          }
        } else if (res.tapIndex === 1) {
          uni.removeStorageSync(storageKey)
          editDraft(draftToImport, draftType)
        }
      }
    })
  } else {
    editDraft(draftToImport, draftType)
  }
}

function checkLocalDraft(storageKey: string): boolean {
  try {
    const draftStr = uni.getStorageSync(storageKey)
    if (!draftStr) return false
    const draftData = JSON.parse(draftStr)
    return !!(draftData.form?.title || draftData.images?.length > 0)
  } catch (e) {
    return false
  }
}

function resolveDraftId(draft: any, type: 'market' | 'share'): string {
  const candidates = type === 'market'
    ? [draft?.draftId, draft?.productId]
    : [draft?.draftId, draft?.shareId]

  const stringId = candidates.find((id) => typeof id === 'string' && id.trim().length > 0)
  if (stringId) return stringId

  return ''
}

async function saveLocalDraftToServer(type: 'market' | 'share') {
  const storageKey = type === 'market' ? 'product_publish_draft' : 'share_draft_data'
  const draftStr = uni.getStorageSync(storageKey)

  if (!draftStr) return

  const draftData = JSON.parse(draftStr)

  if (type === 'market') {
    const api = await import('@/api/product')
    const conditionMap: Record<string, number> = {
      '全新': 10, '九成新': 9, '八成新': 8, '七成新': 7, '六成新及以下': 6
    }

    let latitude: number | undefined
    let longitude: number | undefined
    let location = draftData.form.location
    if (draftData.form.location && draftData.form.location.includes(',')) {
      const [lat, lng] = draftData.form.location.split(',')
      latitude = parseFloat(lat)
      longitude = parseFloat(lng)
      location = draftData.form.locationName || draftData.form.location
    }

    const serverDraftData = {
      title: draftData.form.title,
      description: draftData.form.description,
      categoryId: draftData.form.categoryId || undefined,
      price: draftData.form.price ? parseFloat(draftData.form.price) : undefined,
      originalPrice: draftData.form.originalPrice ? parseFloat(draftData.form.originalPrice) : undefined,
      conditionLevel: conditionMap[draftData.form.condition] || 10,
      imageUrls: draftData.images || [],
      location, latitude, longitude
    }

    await api.productApi.saveDraft(serverDraftData)
  } else {
    const api = await import('@/api/share')
    const serverDraftData = {
      title: draftData.form.title,
      description: draftData.form.description,
      categoryId: draftData.form.categoryId || undefined,
      deposit: draftData.form.deposit ? parseFloat(draftData.form.deposit) : undefined,
      dailyRent: draftData.form.dailyRent ? parseFloat(draftData.form.dailyRent) : undefined,
      imageUrls: draftData.images || [],
      availableTimes: JSON.stringify({
        deliveryMethod: draftData.form.deliveryMethod,
        mailingType: draftData.form.mailingType,
        deliveryFee: draftData.form.deliveryFee,
        rentalType: draftData.form.rentalType,
        rentalDays: draftData.form.rentalDays,
        rentalHours: draftData.form.rentalHours
      })
    }

    await api.shareApi.saveDraft(serverDraftData)
  }

  uni.removeStorageSync(storageKey)
  uni.showToast({ title: '本地草稿已保存', icon: 'success' })
}

async function clearOldestDraft(type: 'market' | 'share') {
  const drafts = type === 'market' ? marketDrafts.value : shareDrafts.value
  if (drafts.length === 0) return

  const oldestDraft = drafts[drafts.length - 1]

  try {
    if (type === 'market') {
      const api = await import('@/api/product')
      await api.productApi.deleteDraft(String(oldestDraft.draftId))
      marketDrafts.value = marketDrafts.value.filter(d => d.draftId !== oldestDraft.draftId)
    } else {
      const api = await import('@/api/share')
      await api.shareApi.deleteDraft(String(oldestDraft.draftId))
      shareDrafts.value = shareDrafts.value.filter(d => d.draftId !== oldestDraft.draftId)
    }
  } catch (e) {
    console.error('清理草稿失败:', e)
  }
}

function onScrollToLower() {
  // 预留加载更多
}
</script>

<style lang="scss" scoped>
// ==================== 页面容器 ====================
.drafts-page {
  min-height: 100vh;
  height: 100vh;
  background: var(--bg-color-page);
  animation: pageSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  overflow-x: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
}

.nav-action {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .edit-text {
    font-size: 28rpx;
    color: var(--primary-color);
    font-weight: 500;
  }
}

// ==================== 编辑模式工具栏 ====================
.edit-toolbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 998;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: var(--bg-color-card);
  border-bottom: 1rpx solid var(--border-color-light);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  animation: slideDown 0.3s ease-out;

  .toolbar-left {
    .select-all-btn {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .select-all-text {
        font-size: 28rpx;
        color: var(--text-color-secondary);
      }
    }
  }

  .toolbar-right {
    .delete-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;

      &.disabled { opacity: 0.4; }

      .delete-text {
        font-size: 28rpx;
        color: var(--error-color);
        font-weight: 500;
      }
    }
  }
}

.edit-toolbar-placeholder {
  height: 80rpx;
}

// ==================== 复选框 ====================
.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid var(--border-color-base);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.checked {
    background: var(--primary-color);
    border-color: var(--primary-color);
    transform: scale(1.05);
    box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
  }
}

.draft-checkbox {
  width: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ==================== 分段 Tab 切换器 ====================
.draft-tabs {
  padding: 20rpx 30rpx;
  background: var(--bg-color-card);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

.draft-tabs-track {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  width: 100%;
  background: var(--bg-color-page);
  border-radius: 20rpx;
  padding: 6rpx;
  overflow: hidden;
  flex-wrap: nowrap;
  box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04);
}

.draft-tab-slider {
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: 50%;
  height: calc(100% - 12rpx);
  border-radius: 16rpx;
  background: var(--bg-color-card);
  box-shadow:
    4rpx 4rpx 10rpx rgba(0, 0, 0, 0.06),
    -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.8);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
  box-sizing: border-box;
}

.draft-tab-item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 14rpx;
  padding: 22rpx 20rpx;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  white-space: nowrap;
  border-radius: 16rpx;
  transition: all 0.25s ease;

  &:active {
    transform: scale(0.985);
  }

  &.active {
    .draft-tab-icon {
      transform: scale(1.08);
    }

    .draft-tab-label {
      color: var(--text-color-primary);
      font-weight: 600;
    }

    .draft-tab-desc {
      color: var(--text-color-secondary);
    }
  }

  .draft-tab-icon {
    flex-shrink: 0;
    font-size: 28rpx;
    transition: transform 0.25s ease;
  }

  .draft-tab-content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4rpx;
  }

  .draft-tab-label {
    font-size: 26rpx;
    color: var(--text-color-tertiary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .draft-tab-desc {
    font-size: 20rpx;
    color: var(--text-color-placeholder);
    white-space: nowrap;
  }

  .draft-tab-badge {
    min-width: 36rpx;
    height: 36rpx;
    padding: 0 10rpx;
    margin-left: auto;
    border-radius: 18rpx;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .badge-text {
      font-size: 18rpx;
      color: #ffffff;
      font-weight: 600;
    }

    &.share-badge {
      background: rgba(126, 212, 166, 0.2);

      .badge-text {
        color: var(--success-color);
      }
    }
  }
}

// ==================== 内容滚动区 ====================
.scroll-view {
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

// ==================== 草稿列表 ====================
.draft-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;

  &.tab-enter {
    animation: tabSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

// ==================== 草稿卡片 ====================
.draft-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: var(--bg-color-card);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  box-shadow:
    6rpx 6rpx 16rpx rgba(0, 0, 0, 0.05),
    -3rpx -3rpx 10rpx rgba(255, 255, 255, 0.7);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
  position: relative;

  &.animated-item {
    animation: cardSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  &.is-selected {
    background: var(--primary-color-alpha-5);
    border-color: var(--primary-color);
    box-shadow:
      0 0 0 2rpx var(--primary-color-alpha-30),
      6rpx 6rpx 16rpx rgba(0, 0, 0, 0.05);
  }

  &.is-edit-mode:active {
    transform: none;
  }

  &:not(.is-edit-mode):active {
    transform: scale(0.98);
    box-shadow:
      inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.04),
      2rpx 2rpx 8rpx rgba(0, 0, 0, 0.03);
  }

  // 共享主题变体
  &.share-theme.is-selected {
    background: rgba(126, 212, 166, 0.05);
    border-color: var(--success-color);
    box-shadow:
      0 0 0 2rpx rgba(126, 212, 166, 0.3),
      6rpx 6rpx 16rpx rgba(0, 0, 0, 0.05);
  }
}

// ==================== 草稿封面 ====================
.draft-cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: 18rpx;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;

  .cover-image {
    width: 100%;
    height: 100%;
  }

  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .placeholder-icon {
      font-size: 48rpx;
      opacity: 0.5;
    }
  }

  &.market-cover .cover-placeholder {
    background: linear-gradient(145deg, #FFF5EE, #FFE8D6);
    box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.03);
  }

  &.share-cover .cover-placeholder {
    background: linear-gradient(145deg, #EEFFF5, #D4F5E0);
    box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.03);
  }
}

.cover-badge {
  position: absolute;
  bottom: 8rpx;
  left: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  backdrop-filter: blur(8px);

  .badge-text {
    font-size: 20rpx;
    font-weight: 500;
  }

  &.market-badge {
    background: rgba(142, 197, 232, 0.85);
    .badge-text { color: #ffffff; }
  }
}

// ==================== 草稿内容 ====================
.draft-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  overflow: hidden;
  min-width: 0;

  .draft-title {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }
}

.draft-tags {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.draft-tag {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;

  &.price-tag {
    background: var(--primary-color-alpha-10);
    color: var(--primary-color-dark);
  }

  &.rent-tag {
    background: rgba(126, 212, 166, 0.12);
    color: #4CAF50;
  }

  &.deposit-tag {
    background: rgba(255, 217, 102, 0.15);
    color: #D4A520;
  }

  &.category-tag {
    background: var(--bg-color-page);
    color: var(--text-color-tertiary);

    &.share-cat {
      background: rgba(126, 212, 166, 0.08);
    }
  }
}

.draft-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;

  .draft-time {
    font-size: 22rpx;
    color: var(--text-color-placeholder);
  }
}

// ==================== 迷你完成度 ====================
.completion-mini {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .mini-track {
    width: 80rpx;
    height: 6rpx;
    background: var(--border-color-light);
    border-radius: 3rpx;
    overflow: hidden;

    &.share-track {
      background: rgba(126, 212, 166, 0.15);
    }
  }

  .mini-fill {
    height: 100%;
    border-radius: 3rpx;
    transition: width 0.4s ease;

    &.high { background: var(--success-color); }
    &.medium { background: var(--warning-color); }
    &.low { background: var(--error-color); }

    &.share-fill {
      &.high { background: #4CAF50; }
      &.medium { background: #FFC107; }
      &.low { background: #FF7043; }
    }
  }

  .mini-text {
    font-size: 20rpx;
    color: var(--text-color-placeholder);
    font-weight: 500;
  }
}

// ==================== 草稿操作按钮 ====================
.draft-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 16rpx 8rpx;
  flex-shrink: 0;

  .action-dot {
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    background: var(--border-color-base);

    &.share-dot {
      background: rgba(126, 212, 166, 0.5);
    }
  }
}

// ==================== 空状态 ====================
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 160rpx;
  animation: fadeInUp 0.5s ease-out;
}

.empty-illustration {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;

  .empty-box {
    width: 160rpx;
    height: 160rpx;
    border-radius: 32rpx;
    background: linear-gradient(145deg, #FFF5EE, #FFE8D6);
    box-shadow:
      8rpx 8rpx 20rpx rgba(255, 168, 88, 0.1),
      -4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20rpx auto 0;

    &.share-box {
      background: linear-gradient(145deg, #EEFFF5, #D4F5E0);
      box-shadow:
        8rpx 8rpx 20rpx rgba(126, 212, 166, 0.1),
        -4rpx -4rpx 12rpx rgba(255, 255, 255, 0.8);
    }

    .box-icon {
      font-size: 72rpx;
      opacity: 0.7;
    }
  }

  .empty-sparkle {
    position: absolute;
    font-size: 32rpx;
    animation: sparkle 2s ease-in-out infinite;

    &.sparkle-1 {
      top: 0;
      right: 0;
      animation-delay: 0s;
    }

    &.sparkle-2 {
      bottom: 20rpx;
      left: 0;
      animation-delay: 1s;
    }
  }
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: var(--text-color-tertiary);
  margin-bottom: 48rpx;
}

.empty-btn {
  height: 88rpx;
  padding: 0 64rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
  box-shadow:
    4rpx 4rpx 12rpx rgba(142, 197, 232, 0.25),
    -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:active {
    transform: scale(0.95);
    box-shadow: inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.06);
  }

  .empty-btn-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
  }

  &.share-btn {
    background: linear-gradient(135deg, #7ED4A6 0%, #A8E6C3 100%);
    box-shadow:
      4rpx 4rpx 12rpx rgba(126, 212, 166, 0.25),
      -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.5);
  }
}

.bottom-safe {
  height: calc(20rpx + env(safe-area-inset-bottom));
}

// ==================== 详情弹窗 ====================
.detail-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.25s ease-out;
  padding: 40rpx;
  backdrop-filter: blur(4px);
}

.detail-popup-content {
  width: 100%;
  max-width: 600rpx;
  height: 80vh;
  background: var(--bg-color-card);
  border-radius: 28rpx;
  display: flex;
  flex-direction: column;
  animation: popupScaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.15);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color-light);

  .popup-type-badge {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;

    &.market {
      background: var(--primary-color-alpha-10);
    }

    &.share {
      background: rgba(126, 212, 166, 0.12);
    }

    .type-icon {
      font-size: 28rpx;
    }

    .type-label {
      font-size: 26rpx;
      font-weight: 600;
      color: var(--text-color-primary);
    }
  }

  .popup-close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .close-icon-wrapper {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background: var(--bg-color-page);
      display: flex;
      align-items: center;
      justify-content: center;

      .close-icon-text {
        font-size: 24rpx;
        color: var(--text-color-tertiary);
        font-weight: 600;
      }
    }
  }
}

// ==================== 完成度区 ====================
.completion-section {
  background: var(--bg-color-page);
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color-light);

  .completion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .completion-label {
      font-size: 26rpx;
      color: var(--text-color-secondary);
      font-weight: 500;
    }

    .completion-percent {
      font-size: 36rpx;
      font-weight: 700;

      &.high { color: var(--success-color); }
      &.medium { color: var(--warning-color); }
      &.low { color: var(--error-color); }
    }
  }

  .completion-track-large {
    height: 10rpx;
    background: var(--border-color-light);
    border-radius: 5rpx;
    overflow: hidden;
    margin-bottom: 12rpx;
  }

  .completion-fill-large {
    height: 100%;
    border-radius: 5rpx;
    transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);

    &.high {
      background: linear-gradient(90deg, #7ED4A6, #A8E6C3);
    }
    &.medium {
      background: linear-gradient(90deg, #FFD666, #FFE4A0);
    }
    &.low {
      background: linear-gradient(90deg, #FF8A8A, #FFB0B0);
    }
  }

  .completion-hint {
    font-size: 22rpx;
    color: var(--error-color);
    font-weight: 500;
  }
}

.popup-body {
  flex: 1;
  padding: 30rpx;
  min-height: 0;
}

.detail-section {
  margin-bottom: 28rpx;

  .detail-label {
    display: block;
    font-size: 24rpx;
    color: var(--text-color-placeholder);
    margin-bottom: 10rpx;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1rpx;
  }

  .detail-value {
    display: block;
    font-size: 30rpx;
    color: var(--text-color-primary);
    line-height: 1.6;

    &.highlight {
      font-size: 34rpx;
      font-weight: 600;
    }

    &.price-group {
      display: flex;
      flex-direction: column;
      gap: 8rpx;
    }

    &.location-info {
      display: flex;
      align-items: center;
      gap: 8rpx;
    }

    &.desc {
      color: var(--text-color-secondary);
      white-space: pre-wrap;
      line-height: 1.8;
    }

    &.time {
      font-size: 26rpx;
      color: var(--text-color-tertiary);
    }

    &.draft-id {
      font-size: 24rpx;
      color: var(--text-color-placeholder);
      font-family: monospace;
    }
  }
}

.detail-cover {
  width: 100%;
  height: 300rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  position: relative;

  .cover-img {
    width: 100%;
    height: 100%;
  }
}

.image-count-badge {
  position: absolute;
  bottom: 16rpx;
  right: 16rpx;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;

  text {
    font-size: 22rpx;
    color: #ffffff;
    font-weight: 500;
  }
}

.price-current {
  font-size: 40rpx;
  color: var(--primary-color);
  font-weight: 700;
}

.price-original {
  font-size: 24rpx;
  color: var(--text-color-tertiary);
  text-decoration: line-through;
}

.deposit {
  font-size: 28rpx;
  color: var(--success-color);
  font-weight: 500;
}

.flash-sale-info {
  background: linear-gradient(135deg, #FFF5EE, #FFE8D6);
  padding: 20rpx;
  border-radius: 16rpx;
  border-left: 4rpx solid var(--primary-color);

  .flash-details {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-top: 8rpx;
  }

  .flash-price {
    font-size: 32rpx;
    color: var(--primary-color);
    font-weight: 700;
  }

  .flash-stock {
    font-size: 24rpx;
    color: var(--text-color-secondary);
  }
}

.condition-tag {
  display: inline-block;
  padding: 6rpx 18rpx;
  background: var(--primary-color-alpha-10);
  color: var(--primary-color-dark);
  border-radius: 10rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.category-tag {
  display: inline-block;
  padding: 6rpx 18rpx;
  background: rgba(126, 212, 166, 0.1);
  color: var(--success-color);
  border-radius: 10rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.delivery-tags {
  display: flex;
  gap: 12rpx;

  .delivery-tag {
    padding: 6rpx 18rpx;
    background: rgba(157, 196, 255, 0.1);
    color: var(--info-color);
    border-radius: 10rpx;
    font-size: 24rpx;

    &.free {
      background: var(--primary-color-alpha-10);
      color: var(--primary-color);
    }
  }
}

.location-text {
  font-size: 28rpx;
  color: var(--text-color-primary);
}

// ==================== 弹窗操作按钮 ====================
.popup-actions {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border-color-light);

  .popup-btn {
    flex: 1;
    height: 92rpx;
    border-radius: 22rpx;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:active {
      transform: scale(0.97);
    }

    &.secondary {
      background: var(--bg-color-page);
      color: var(--text-color-secondary);
      box-shadow:
        inset 2rpx 2rpx 6rpx rgba(0, 0, 0, 0.03),
        2rpx 2rpx 6rpx rgba(0, 0, 0, 0.02);
    }

    &.primary {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
      color: #ffffff;
      box-shadow:
        4rpx 4rpx 12rpx var(--primary-color-alpha-30),
        -2rpx -2rpx 8rpx rgba(255, 255, 255, 0.3);
    }
  }
}

// ==================== 动画 ====================
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateX(60rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tabSlideIn {
  from {
    opacity: 0;
    transform: translateX(24rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes indicatorStretch {
  0% { width: 0; }
  60% { width: 56rpx; }
  100% { width: 40rpx; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popupScaleIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>
