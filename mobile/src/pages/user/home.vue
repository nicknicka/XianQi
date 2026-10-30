<template>
  <view class="user-home-page" :style="themeStyle">
    <!-- 用户信息头部 -->
    <view class="user-header animated" :class="{ 'animate-in': headerVisible }">
      <view class="header-bg">
        <view class="bg-pattern" />
      </view>
      <view class="user-info-section">
        <view class="avatar-wrapper">
          <view class="avatar-shell">
            <user-avatar
              class="avatar"
              :src="userInfo.avatar"
              size="xl"
              shape="circle"
              :clickable="isCurrentUser"
              @click="handleAvatarClick"
            />
          </view>
          <!-- 认证徽章 -->
          <view v-if="userInfo.isVerified" class="verified-badge">
            <uni-icons type="checkmarkempty" size="10" color="#fff" />
          </view>
        </view>

        <view class="user-main-info">
          <view class="nickname-row">
            <text class="nickname">{{ userInfo.nickname || userInfo.username }}</text>
            <!-- 信用等级 -->
            <view v-if="creditLevel" class="credit-level" :class="`level-${creditLevel.level}`">
              <uni-icons type="star-filled" size="10" color="#fff" />
              <text>{{ creditLevel.text }}</text>
            </view>
          </view>

          <!-- 认证信息 -->
          <view class="verified-tags" v-if="userInfo.verifications && userInfo.verifications.length">
            <view v-for="v in userInfo.verifications" :key="v.type" class="verified-tag">
              <uni-icons :type="v.icon" size="12" />
              <text>{{ v.text }}</text>
            </view>
          </view>

          <view class="credit-info">
            <view class="credit-score">
              <uni-icons type="star-filled" size="14" color="#FFD700" />
              <text class="score-value">{{ userInfo.creditScore || 0 }}</text>
              <text class="score-label">信用分</text>
            </view>
            <view class="divider" />
            <view class="good-rate-info" v-if="userInfo.goodRate">
              <text class="rate-value">{{ userInfo.goodRate }}%</text>
              <text class="rate-label">好评率</text>
            </view>
          </view>
        </view>

        <!-- 个人简介 -->
        <view class="bio" v-if="userInfo.bio">
          <text>{{ userInfo.bio }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <view class="action-buttons-center">
            <button v-if="!isCurrentUser" class="action-btn primary" @click="goMessages">
              <uni-icons type="chatbubble" size="16" color="#fff" />
              <text>私信</text>
            </button>
            <button v-if="!isCurrentUser" class="action-btn" :class="{ followed: isFollowed }" @click="toggleFollow" ref="followBtn">
              <uni-icons :type="isFollowed ? 'heart-filled' : 'heart'" size="16" :color="isFollowed ? '#fff' : primaryColor" />
              <text>{{ isFollowed ? '已关注' : '关注' }}</text>
            </button>
          </view>
          <button class="action-btn more-btn" @click="showMoreActions">
            <uni-icons type="more-filled" size="18" color="#7A7A7A" />
          </button>
        </view>
      </view>
    </view>

    <!-- 社交数据统计 -->
    <view class="social-stats-section animated slide-up" :class="{ 'animate-in': statsVisible }" :style="{ animationDelay: '100ms' }">
      <view class="social-stat-item" @click="goFollowers">
        <text class="stat-num">{{ socialStats.followers  }}</text>
        <text class="stat-label">粉丝</text>
      </view>
      <view class="social-stat-divider" />
      <view class="social-stat-item" @click="goFollowing">
        <text class="stat-num">{{ socialStats.following }}</text>
        <text class="stat-label">关注</text>
      </view>
      <view class="social-stat-divider" />
      <view class="social-stat-item" @click="goProducts">
        <text class="stat-num">{{ stats.publishCount }}</text>
        <text class="stat-label">在售</text>
      </view>
      <view class="social-stat-divider" />
      <view class="social-stat-item" @click="goSoldProducts">
        <text class="stat-num">{{ stats.soldCount }}</text>
        <text class="stat-label">已售</text>
      </view>
    </view>

    <!-- 信用评价卡片 -->
    <view class="credit-card animated slide-up" v-if="!isCurrentUser && userInfo.creditScore" :class="{ 'animate-in': creditCardVisible }" :style="{ animationDelay: '200ms' }">
      <view class="credit-card-header">
        <view class="credit-title">
          <uni-icons type="star-filled" size="16" color="#FFD700" />
          <text>信用评价</text>
        </view>
        <view class="credit-detail" @click="goEvaluations">
          <text>查看详情</text>
          <uni-icons type="right" size="12" :color="primaryColor" />
        </view>
      </view>
      <view class="credit-card-content">
        <view class="credit-overview">
          <view class="rate-circle">
            <text class="rate-circle-value">{{ userInfo.goodRate || 0 }}</text>
            <text class="rate-circle-unit">%</text>
          </view>
          <text class="rate-circle-label">好评率</text>
        </view>
        <view class="credit-details">
          <view class="credit-detail-item">
            <text class="detail-label">信用评分</text>
            <view class="star-rating">
              <uni-icons v-for="star in 5" :key="star" type="star-filled" size="14"
                :color="star <= (userRating || 5) ? '#FFD700' : '#E8E8E8'" />
            </view>
          </view>
          <view class="credit-detail-item">
            <text class="detail-label">交易次数</text>
            <text class="detail-value">{{ stats.soldCount || 0 }}次</text>
          </view>
          <view class="credit-detail-item">
            <text class="detail-label">信用等级</text>
            <text class="detail-value credit-level-text">{{ creditLevel?.text || '普通用户' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tabs-wrapper animated slide-up" :class="{ 'animate-in': tabsVisible, 'has-popup': showActionPopup }" :style="{ animationDelay: '300ms' }">
      <view class="tabs">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: currentTab === tab.value && !showActionPopup }"
          @click="switchTab(tab.value)"
        >
          <text>{{ tab.label }}</text>
          <view v-if="currentTab === tab.value && !showActionPopup" class="tab-indicator" />
        </view>
      </view>
    </view>

    <!-- 自定义操作选择弹窗 -->
    <view v-if="showActionPopup" class="action-popup-mask" @click="closeActionPopup">
      <view class="action-popup" @click.stop>
        <view class="action-popup-header">
          <text class="action-popup-title">选择操作</text>
          <view class="action-popup-close" @click="closeActionPopup">
            <uni-icons type="close" size="20" color="#7A7A7A" />
          </view>
        </view>
        <view class="action-popup-content">
          <view
            v-for="(item, index) in actionItems"
            :key="index"
            class="action-popup-item"
            :class="{ danger: item.danger }"
            @click="handleActionClick(item)"
          >
            <uni-icons v-if="item.icon" :type="item.icon" size="18" :color="item.danger ? 'var(--danger-color)' : '#333'" />
            <text>{{ item.label }}</text>
          </view>
        </view>
        <view class="action-popup-footer">
          <view class="action-popup-cancel" @click="closeActionPopup">
            <text>取消</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view
      class="content-scroll"
      :class="{ 'content-visible': contentVisible }"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 在售商品 -->
      <view v-if="currentTab === 'selling'" class="product-grid">
        <view v-if="loading && products.length === 0" class="loading-placeholder">
          <!-- 加载中占位，不显示任何内容 -->
        </view>
        <view v-else-if="products.length === 0" class="empty-state" :class="{ 'animate-empty': contentVisible }">
          <view class="empty-icon-wrapper">
            <uni-icons type="box" size="64" color="#D9D9D9" />
          </view>
          <text class="empty-text">暂无商品</text>
          <text class="empty-hint">该用户还没有发布任何商品</text>
        </view>
        <view v-else-if="products.length > 0" class="grid-container" :class="{ 'animate-grid': contentVisible }">
          <view
            v-for="product in products"
            :key="product.id"
            class="product-card"
            @click="goProductDetail(product.id)"
          >
            <view class="product-image-wrapper">
              <lazy-image class="product-image" :src="product.coverImage" mode="aspectFill" />
              <!-- 商品标签 -->
              <view v-if="product.isNew" class="product-tag new">新品</view>
              <view v-if="product.isHot" class="product-tag hot">热卖</view>
            </view>
            <view class="product-info">
              <text class="product-title">{{ product.title }}</text>
              <view class="product-meta">
                <text class="price">¥{{ product.price }}</text>
                <text class="condition">{{ product.condition }}</text>
              </view>
              <view class="product-footer">
                <text class="publish-time">{{ formatTime(product.createdAt) }}</text>
                <view class="product-stats">
                  <uni-icons type="eye" size="12" :color="primaryColor" />
                  <text>{{ product.viewCount || 0 }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 收到的评价 -->
      <view v-if="currentTab === 'evaluations'" class="evaluation-list">
        <view v-if="loading && evaluations.length === 0" class="loading-placeholder">
          <!-- 加载中占位，不显示任何内容 -->
        </view>
        <view v-else-if="evaluations.length === 0" class="empty-state" :class="{ 'animate-empty': contentVisible }">
          <view class="empty-icon-wrapper">
            <uni-icons type="chat" size="64" color="#D9D9D9" />
          </view>
          <text class="empty-text">暂无评价</text>
          <text class="empty-hint">该用户还没有收到任何评价</text>
        </view>
        <view v-else-if="evaluations.length > 0" class="evaluation-container" :class="{ 'animate-items': contentVisible }">
          <view v-for="evaluation in evaluations" :key="evaluation.id" class="evaluation-card">
            <view class="eval-header">
              <user-avatar
                class="eval-avatar"
                :src="evaluation.evaluatorAvatar"
                size="sm"
                shape="circle"
                :clickable="true"
                @click="goUserProfile(evaluation.evaluatorId)"
              />
              <view class="eval-user-info">
                <text class="eval-name">{{ evaluation.evaluatorName }}</text>
                <view class="eval-meta">
                  <view class="eval-stars">
                    <uni-icons
                      v-for="star in 5"
                      :key="star"
                      type="star-filled"
                      size="12"
                      :color="star <= evaluation.rating ? '#FFD700' : '#E8E8E8'"
                    />
                  </view>
                  <text class="eval-time">{{ formatTime(evaluation.createdAt) }}</text>
                </view>
              </view>
              <view class="eval-rating-badge" :class="`rating-${evaluation.rating}`">
                {{ evaluation.rating }}.0
              </view>
            </view>
            <view class="eval-tags" v-if="evaluation.tags && evaluation.tags.length">
              <text v-for="tag in evaluation.tags" :key="tag" class="eval-tag">
                <uni-icons type="checkmarkempty" size="10" />{{ tag }}
              </text>
            </view>
            <text class="eval-content">{{ evaluation.content }}</text>
            <!-- 关联商品 -->
            <view v-if="evaluation.productName" class="eval-product" @click.stop="goProductDetail(evaluation.productId)">
              <lazy-image class="eval-product-img" :src="evaluation.productImage" mode="aspectFill" />
              <text class="eval-product-name">{{ evaluation.productName }}</text>
              <uni-icons type="right" size="12" :color="primaryColor" />
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <uni-icons type="spinner-cycle" size="20" :color="primaryColor" />
        <text class="loading-text">加载中...</text>
      </view>

      <view v-if="noMore && !loading" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { productApi } from '@/api/product'
import { evaluationApi } from '@/api/evaluation'
import { userApi } from '@/api/user'
import creditApi from '@/api/credit'
import { blacklistApi } from '@/api/blacklist'
import { formatDateTime } from '@/utils/date'
import { checkAuth } from '@/utils/auth'
import LazyImage from '@/components/lazy-image/lazy-image.vue'
import { shareManager } from '@/utils/share'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()
const { primaryColor, dangerColor } = useThemeColors()

const userId = ref<string>('')
const userInfo = ref<any>({})
const isCurrentUser = computed(() => userId.value === String(userStore.userInfo?.userId || ''))
const isFollowed = ref(false)
const isBlacklisted = ref(false) // 是否已在黑名单中

// 信用等级计算
const creditLevel = computed(() => {
  const score = userInfo.value.creditScore || 0
  if (score >= 90) return { level: 'excellent', text: '优秀' }
  if (score >= 80) return { level: 'good', text: '良好' }
  if (score >= 60) return { level: 'medium', text: '中等' }
  return { level: 'normal', text: '普通' }
})

// 用户评分（星级）
const userRating = computed(() => {
  const score = userInfo.value.creditScore || 0
  return Math.round(score / 20) // 转换为1-5星
})

// 社交数据
const socialStats = ref({
  followers: 0,
  following: 0
})

const tabs = [
  { label: '在售商品', value: 'selling' },
  { label: '收到的评价', value: 'evaluations' }
]

const currentTab = ref('selling')
const products = ref<any[]>([])
const evaluations = ref<any[]>([])
const stats = ref({
  publishCount: 0,
  soldCount: 0,
  evaluationCount: 0
})

const loading = ref(false)
const noMore = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 20
const loadIntent = ref('') // 当前加载意图，用于防止过期的加载结果更新数据

// 动画状态
const headerVisible = ref(false)
const statsVisible = ref(false)
const creditCardVisible = ref(false)
const tabsVisible = ref(false)
const contentVisible = ref(false)

// 操作弹窗状态
const showActionPopup = ref(false)
const actionItems = ref<Array<{ label: string; icon?: string; danger?: boolean; action: string }>>([])

onShow(() => {
  useThemePage()

  if (userId.value) {
    loadUserInfo()
    loadStats()
  }
})


onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}
  userId.value = options.id || String(userStore.userInfo?.userId || '')

  // 触发进入动画
  triggerEnterAnimation()

  loadUserInfo()
  loadStats()
  loadData()

  // 检查黑名单状态（仅对非当前用户）
  if (!isCurrentUser.value && userStore.isLogin) {
    checkBlacklistStatus()
    checkFollowStatus()
  }
})

// 触发进入动画
function triggerEnterAnimation() {
  setTimeout(() => {
    headerVisible.value = true
  }, 50)

  setTimeout(() => {
    statsVisible.value = true
  }, 150)

  setTimeout(() => {
    creditCardVisible.value = true
  }, 250)

  setTimeout(() => {
    tabsVisible.value = true
  }, 350)

  setTimeout(() => {
    contentVisible.value = true
  }, 450)
}

async function loadUserInfo() {
  console.log('========== loadUserInfo 开始 ==========')
  console.log('当前用户ID:', userId.value)
  console.log('是否为当前用户:', isCurrentUser.value)

  try {
    // 如果是当前用户，直接从 store 获取
    if (isCurrentUser.value) {
      console.log('从 store 获取当前用户信息')
      userInfo.value = userStore.userInfo
      console.log('Store 用户信息:', JSON.stringify(userInfo.value, null, 2))
    } else {
      // 其他用户，根据用户 ID 获取信息
      console.log('调用 API 获取用户信息, userId:', userId.value)
      const info = await userApi.getUserById(userId.value)

      console.log('========== API 返回数据 ==========')
      console.log('API 返回原始数据:', JSON.stringify(info, null, 2))
      console.log('API 返回的 data 字段:', JSON.stringify(info?.data, null, 2))
      console.log('用户 ID:', info?.data?.id)
      console.log('用户名:', info?.data?.username)
      console.log('昵称:', info?.data?.nickname)
      console.log('头像 URL:', info?.data?.avatar)
      console.log('信用分:', info?.data?.creditScore)
      console.log('是否实名:', info?.data?.isVerified)
      console.log('=====================================')

      // 提取 data 字段（http 模块返回的是完整响应对象）
      userInfo.value = (info as any).data
      console.log('设置后的 userInfo.value:', JSON.stringify(userInfo.value, null, 2))
    }

    await syncCreditDetail()
  } catch (error) {
    console.error('========== 获取用户信息失败 ==========')
    console.error('错误信息:', error)
    console.error('错误详情:', JSON.stringify(error, null, 2))
    uni.showToast({ title: '获取用户信息失败', icon: 'none' })
  }

  console.log('========== loadUserInfo 结束 ==========')
}

async function syncCreditDetail() {
  if (!userId.value) return

  try {
    const response = isCurrentUser.value
      ? await creditApi.getMyCreditDetail()
      : await creditApi.getCreditDetail(userId.value)
    const creditDetail = (response as any)?.data

    if (!creditDetail) return

    userInfo.value = {
      ...userInfo.value,
      creditScore: Number(creditDetail.creditScore || 0),
      creditLevel: creditDetail.creditLevel || userInfo.value.creditLevel,
      goodRate: Number(creditDetail.goodRate || 0)
    }

    if (isCurrentUser.value) {
      userStore.updateUserInfo({
        creditScore: Number(creditDetail.creditScore || 0),
        creditLevel: creditDetail.creditLevel || userStore.userInfo?.creditLevel
      })
    }
  } catch (error) {
    console.error('同步信用分失败:', error)
  }
}

async function loadStats() {
  try {
    // 根据是否为当前用户，调用不同的 API
    const response = isCurrentUser.value
      ? await userApi.getUserCenter()
      : await userApi.getUserCenterById(userId.value)

    // 访问 .data 属性获取真正的数据
    const centerData = (response as any).data || {}

    stats.value = {
      publishCount: centerData.productCount || 0,
      soldCount: centerData.orderCount || 0, // 使用 orderCount 代替 soldCount
      evaluationCount: centerData.evaluationCount || 0
    }

    // 初始化社交数据
    socialStats.value = {
      followers: centerData.followerCount || 0,
      following: centerData.followingCount || 0
    }
  } catch (error) {
    console.error('获取用户统计失败:', error)
    stats.value = {
      publishCount: 0,
      soldCount: 0,
      evaluationCount: 0
    }
    socialStats.value = {
      followers: 0,
      following: 0
    }
  }
}

function loadData() {
  if (currentTab.value === 'selling') {
    loadProducts()
  } else {
    loadEvaluations()
  }
}

// 检查黑名单状态
async function checkBlacklistStatus() {
  if (!userId.value || !userStore.isLogin) return

  try {
    const result: any = await blacklistApi.isInBlacklist(userId.value)
    isBlacklisted.value = result || false
  } catch (error) {
    console.error('检查黑名单状态失败:', error)
    isBlacklisted.value = false
  }
}

// 检查关注状态
async function checkFollowStatus() {
  if (!userId.value || !userStore.isLogin) return

  try {
    const response = await userApi.checkFollow(userId.value)
    isFollowed.value = response.data || false
  } catch (error) {
    console.error('检查关注状态失败:', error)
    isFollowed.value = false
  }
}

function loadProducts(refresh = false) {
  // 如果正在加载且不是刷新操作，跳过
  if (loading.value && !refresh) return

  if (refresh) {
    page.value = 1
    noMore.value = false
  }

  // 设置当前加载意图
  const currentIntent = `products-${Date.now()}`
  loadIntent.value = currentIntent
  loading.value = true

  const startTime = Date.now()
  const MIN_LOADING_TIME = 600 // 最小加载时间600ms

  productApi
    .getSellerProducts(userId.value, {
      page: page.value,
      pageSize
    })
    .then((res: any) => {
      // 检查加载意图是否仍然有效
      if (loadIntent.value !== currentIntent) {
        console.log('忽略过期的商品加载结果')
        return
      }

      const list = res?.data?.list || res?.list || []
      if (refresh) {
        products.value = list
      } else {
        products.value = [...products.value, ...list]
      }
      noMore.value = list.length < pageSize

      // 确保至少显示加载状态一段时间
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)

      return new Promise(resolve => setTimeout(resolve, remainingTime))
    })
    .finally(() => {
      // 只在当前意图仍然有效时重置loading
      if (loadIntent.value === currentIntent) {
        loading.value = false
      }
    })
}

function loadEvaluations(refresh = false) {
  // 如果正在加载且不是刷新操作，跳过
  if (loading.value && !refresh) return

  if (refresh) {
    page.value = 1
    noMore.value = false
  }

  // 设置当前加载意图
  const currentIntent = `evaluations-${Date.now()}`
  loadIntent.value = currentIntent
  loading.value = true

  const startTime = Date.now()
  const MIN_LOADING_TIME = 600 // 最小加载时间600ms

  evaluationApi
    .getEvaluationsByUser(userId.value, {
      page: page.value,
      pageSize
    })
    .then((res: any) => {
      // 检查加载意图是否仍然有效
      if (loadIntent.value !== currentIntent) {
        console.log('忽略过期的评价加载结果')
        return
      }
      const rawList = res?.data?.records || res?.records || res?.data?.list || res?.list || []
      const list = rawList.map((item: any) => ({
        ...item,
        id: item.id || item.evaluationId || item.evalId,
        evaluatorId: item.evaluatorId || item.fromUserId,
        evaluatorName: item.evaluatorName || item.fromUserName || item.evaluatorNickname || '匿名用户',
        evaluatorAvatar: item.evaluatorAvatar || item.fromUserAvatar || '',
        productName: item.productName || item.productTitle || '未知商品',
        createdAt: item.createdAt || ''
      }))
      if (refresh) {
        evaluations.value = list
      } else {
        evaluations.value = [...evaluations.value, ...list]
      }
      noMore.value = list.length < pageSize

      // 确保至少显示加载状态一段时间
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)

      return new Promise(resolve => setTimeout(resolve, remainingTime))
    })
    .finally(() => {
      // 只在当前意图仍然有效时重置loading
      if (loadIntent.value === currentIntent) {
        loading.value = false
      }
    })
}

function switchTab(value: string) {
  currentTab.value = value
  contentVisible.value = false // 重置动画

  // 清空要显示的列表数据，确保重新加载
  if (value === 'selling') {
    products.value = []
  } else {
    evaluations.value = []
  }

  // 重置分页和加载状态
  page.value = 1
  noMore.value = false
  loading.value = false

  loadData()

  // 切换后重新触发动画（延迟更长，确保数据开始加载）
  setTimeout(() => {
    contentVisible.value = true
  }, 200)
}

function onRefresh() {
  refreshing.value = true
  page.value = 1
  noMore.value = false
  contentVisible.value = false // 重置内容动画

  Promise.all([
    loadUserInfo(),
    loadStats(),
    currentTab.value === 'selling' ? loadProducts(true) : loadEvaluations(true)
  ]).finally(() => {
    refreshing.value = false
    // 刷新完成后重新触发内容动画
    setTimeout(() => {
      contentVisible.value = true
    }, 100)
  })
}

function loadMore() {
  if (!loading.value && !noMore.value) {
    page.value++
    loadData()
  }
}


function goMessages() {
  if (!userStore.checkLogin()) return

  // 判断是否是当前用户
  if (isCurrentUser.value) {
    uni.showToast({
      title: '不能给自己发私信',
      icon: 'none'
    })
    return
  }

  // 判断 userId 是否有效
  if (!userId.value) {
    uni.showToast({
      title: '用户信息异常，请稍后重试',
      icon: 'none'
    })
    return
  }

  // 跳转到聊天页面，传入用户ID
  uni.navigateTo({
    url: `/pages/message/chat?userId=${userId.value}`,
    fail: (err) => {
      console.error('跳转聊天页面失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

async function toggleFollow() {
  console.log('========== toggleFollow 被调用 ==========')
  console.log('当前用户ID:', userStore.userInfo?.userId)
  console.log('目标用户ID:', userId.value)
  console.log('是否已关注:', isFollowed.value)
  console.log('====================================')

  if (!userStore.checkLogin()) {
    console.log('未登录，退出')
    return
  }

  try {
    if (isFollowed.value) {
      console.log('执行取消关注操作...')
      // 取消关注
      await userApi.unfollowUser(userId.value)
      isFollowed.value = false
      uni.showToast({ title: '已取消关注', icon: 'success' })
      console.log('取消关注成功')
    } else {
      console.log('执行关注操作...')
      // 关注
      await userApi.followUser(userId.value)
      isFollowed.value = true
      uni.showToast({ title: '关注成功', icon: 'success' })
      console.log('关注成功')
    }

    // 重新获取统计数据以更新粉丝数
    if (!isCurrentUser.value) {
      console.log('重新获取统计数据...')
      await loadStats()
      console.log('统计数据更新完成')
    }
  } catch (error: any) {
    console.error('关注操作失败:', error)
    console.error('错误详情:', JSON.stringify(error, null, 2))
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
    // 恢复原状态
    isFollowed.value = !isFollowed.value
  }
}

function showMoreActions() {
  const items = isCurrentUser.value
    ? [
        { label: '编辑资料', icon: 'compose', action: 'edit' },
        { label: '设置', icon: 'gear', action: 'settings' },
        { label: '分享主页', icon: 'redo', action: 'share' }
      ]
    : isBlacklisted.value
    ? [
        { label: '移出黑名单', icon: 'eye', action: 'remove-blacklist' },
        { label: '举报用户', icon: 'flag', action: 'report', danger: true },
        { label: '分享主页', icon: 'redo', action: 'share' }
      ]
    : [
        { label: '加入黑名单', icon: 'eye-slash', action: 'blacklist', danger: true },
        { label: '举报用户', icon: 'flag', action: 'report', danger: true },
        { label: '分享主页', icon: 'redo', action: 'share' }
      ]

  actionItems.value = items
  showActionPopup.value = true
}

function closeActionPopup() {
  showActionPopup.value = false
}

function handleActionClick(item: any) {
  closeActionPopup()
  handleMoreAction(item.action)
}

function handleMoreAction(action: string) {
  switch (action) {
    case 'edit':
      uni.navigateTo({ url: '/pages/mine/profile' })
      break
    case 'blacklist':
      addToBlacklist()
      break
    case 'remove-blacklist':
      removeFromBlacklist()
      break
    case 'report':
      uni.navigateTo({ url: `/pages/message/report?userId=${userId.value}` })
      break
    case 'share':
      // 分享用户主页
      shareManager.shareUser(userInfo.value).catch(() => {
        uni.showToast({ title: '分享失败', icon: 'none' })
      })
      break
    case 'settings':
      uni.navigateTo({ url: '/pages/mine/settings' })
      break
  }
}

async function addToBlacklist() {
  // 检查登录状态
  if (!checkAuth({
    showTip: true,
    tipText: '请先登录后进行操作',
    showAuthGuide: true,
    guideTitle: '登录后可管理黑名单',
    guideContent: '黑名单属于个人隐私设置，请先登录或注册账号。'
  })) {
    return
  }

  // 如果已经在黑名单中，直接跳转到黑名单页面
  if (isBlacklisted.value) {
    uni.navigateTo({ url: '/pages/mine/blacklist' })
    return
  }

  uni.showModal({
    title: '加入黑名单',
    content: '加入黑名单后将无法接收该用户的消息，确定要继续吗？',
    confirmText: '确定',
    confirmColor: dangerColor,
    success: async (res) => {
      if (res.confirm) {
        try {
          await blacklistApi.addToBlacklist(userId.value)
          isBlacklisted.value = true
          uni.showToast({
            title: '已加入黑名单',
            icon: 'success'
          })
          // 延迟后跳转到黑名单页面
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/mine/blacklist' })
          }, 1500)
        } catch (error: any) {
          console.error('添加黑名单失败:', error)
          const errorMsg = error?.data?.message || '操作失败，请重试'
          uni.showToast({
            title: errorMsg,
            icon: 'none'
          })
        }
      }
    }
  })
}

async function removeFromBlacklist() {
  // 检查登录状态
  if (!checkAuth({
    showTip: true,
    tipText: '请先登录后进行操作',
    showAuthGuide: true,
    guideTitle: '登录后可管理黑名单',
    guideContent: '黑名单属于个人隐私设置，请先登录或注册账号。'
  })) {
    return
  }

  uni.showModal({
    title: '移出黑名单',
    content: '确定要将该用户移出黑名单吗？移出后可以正常接收该用户的消息。',
    confirmText: '确定',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 需要先获取黑名单记录ID，因为API需要的是blacklistId而不是userId
          const result: any = await blacklistApi.getBlacklist({ page: 1, size: 100 })
          const blacklistItem = result?.records?.find((item: any) => item.blockedUserId === userId.value)

          if (blacklistItem) {
            await blacklistApi.removeFromBlacklist(blacklistItem.id)
            isBlacklisted.value = false
            uni.showToast({
              title: '已移出黑名单',
              icon: 'success'
            })
          } else {
            uni.showToast({
              title: '未找到黑名单记录',
              icon: 'none'
            })
          }
        } catch (error: any) {
          console.error('移除黑名单失败:', error)
          const errorMsg = error?.data?.message || '操作失败，请重试'
          uni.showToast({
            title: errorMsg,
            icon: 'none'
          })
        }
      }
    }
  })
}

function goProducts() {
  currentTab.value = 'selling'
  loadData()
}

function goSoldProducts() {
  uni.navigateTo({
    url: `/pages/mine/sold-products`
  })
}

function goEvaluations() {
  currentTab.value = 'evaluations'
  loadData()
}

function goFollowers() {
  uni.navigateTo({
    url: `/pages/user/followers?id=${userId.value}`
  })
}

function goFollowing() {
  uni.navigateTo({
    url: `/pages/user/following?id=${userId.value}`
  })
}

function goProductDetail(id: string) {
  uni.navigateTo({
    url: `/pages/market/detail?id=${id}`
  })
}

function formatTime(time: string) {
  if (!time) return '-'
  return formatDateTime(time, 'YYYY-MM-DD HH:mm')
}

function handleAvatarClick() {
  if (isCurrentUser.value) {
    // 当前用户点击头像，跳转到编辑资料页面
    uni.navigateTo({ url: '/pages/mine/profile' })
  } else {
    // 其他用户点击头像，查看大图
    uni.previewImage({
      urls: [userInfo.value.avatar || '/static/images/user.png'],
      current: 0
    })
  }
}

function goUserProfile(userId: string) {
  uni.navigateTo({
    url: `/pages/user/home?id=${userId}`
  })
}
</script>

<style lang="scss" scoped>

.user-home-page {
  min-height: 100vh;
  background: var(--bg-color-page);
}

// 用户头部
.user-header {
  position: relative;
  margin-bottom: 16rpx;

  .header-bg {
    height: 280rpx;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 50%, var(--accent-color) 100%);
    position: relative;
    overflow: hidden;

    .bg-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.1;
      background-image:
        radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
    }
  }

  .user-info-section {
    position: relative;
    padding: 0 32rpx 32rpx;
    margin-top: -96rpx;

    .avatar-wrapper {
      position: relative;
      width: 176rpx;
      margin: 0 auto 16rpx;

      .avatar-shell {
        width: 176rpx;
        height: 176rpx;
        padding: 8rpx;
        border-radius: 50%;
        background: #fff;
        box-shadow: var(--box-shadow-base, 0 8rpx 24rpx rgba(0, 0, 0, 0.08));
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar {
        width: 160rpx;
        height: 160rpx;
        border-radius: 50%;
        overflow: hidden;
      }

      .verified-badge {
        position: absolute;
        right: 2rpx;
        bottom: 6rpx;
        width: 44rpx;
        height: 44rpx;
        background: linear-gradient(135deg, var(--info-color) 0%, #096DD9 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4rpx solid #fff;
      }
    }

    .user-main-info {
      text-align: center;

      .nickname-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        margin-bottom: 12rpx;

        .nickname {
          font-size: var(--font-size-xxl, 20px);
          font-weight: 600;
          color: var(--text-color-primary, #2D2D2D);
        }

        .credit-level {
          display: flex;
          align-items: center;
          gap: 4rpx;
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          font-size: var(--font-size-sm, 12px);

          &.level-excellent {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #fff;
          }

          &.level-good {
            background: linear-gradient(135deg, var(--success-color) 0%, #389E0D 100%);
            color: #fff;
          }

          &.level-medium {
            background: linear-gradient(135deg, var(--info-color) 0%, #096DD9 100%);
            color: #fff;
          }

          &.level-normal {
            background: var(--border-color-light, #F0F0F0);
            color: var(--text-color-secondary, #7A7A7A);
          }
        }
      }

      .verified-tags {
        display: flex;
        justify-content: center;
        gap: 12rpx;
        margin-bottom: 16rpx;

        .verified-tag {
          display: flex;
          align-items: center;
          gap: 4rpx;
          padding: 4rpx 12rpx;
          background: var(--info-color-alpha-10);
          border-radius: 4rpx;
          font-size: var(--font-size-xs, 10px);
          color: var(--info-color);
        }
      }

      .credit-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24rpx;
        margin-bottom: 16rpx;

        .credit-score {
          display: flex;
          align-items: center;
          gap: 6rpx;

          .score-value {
            font-size: var(--font-size-xl, 18px);
            font-weight: 600;
            color: var(--primary-color, #8EC5E8);
          }

          .score-label {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-color-tertiary, #AAAAAA);
          }
        }

        .divider {
          width: 1px;
          height: 24rpx;
          background: var(--border-color-light, #F0F0F0);
        }

        .good-rate-info {
          display: flex;
          flex-direction: column;
          align-items: center;

          .rate-value {
            font-size: var(--font-size-lg, 16px);
            font-weight: 600;
            color: var(--success-color, #7ED4A6);
          }

          .rate-label {
            font-size: var(--font-size-xs, 10px);
            color: var(--text-color-tertiary, #AAAAAA);
          }
        }
      }
    }

    .bio {
      text-align: center;
      font-size: var(--font-size-base, 14px);
      color: var(--text-color-secondary, #7A7A7A);
      margin-bottom: 24rpx;
      line-height: 1.6;
      padding: 0 32rpx;
    }

    .action-buttons {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 72rpx;

      .action-buttons-center {
        display: flex;
        align-items: center;
        gap: 16rpx;
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        padding: 0 28rpx;
        height: 72rpx;
        background: var(--bg-color-card);
        border: 2rpx solid var(--border-color-light, #F0F0F0);
        border-radius: 36rpx;
        font-size: var(--font-size-base, 14px);
        color: var(--primary-color, #8EC5E8);
        transition: all 0.25s ease;

        &.primary {
          background: linear-gradient(135deg, var(--primary-color, #8EC5E8) 0%, var(--primary-color-light) 100%);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
        }

        &.followed {
          background: linear-gradient(135deg, var(--danger-color) 0%, #FF7875 100%);
          border-color: transparent;
          color: #fff;
        }

        &.more-btn {
          position: absolute;
          right: calc(50% - 271rpx);
          width: 72rpx;
          padding: 0;
          background: var(--bg-color-card);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
}

// 社交数据统计
.social-stats-section {
  display: flex;
  align-items: center;
  background: var(--bg-color-card);
  margin-bottom: 16rpx;
  padding: 24rpx 0;

  .social-stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8rpx 0;

    .stat-num {
      font-size: var(--font-size-xxl, 20px);
      font-weight: 600;
      color: var(--text-color-primary, #2D2D2D);
      margin-bottom: 6rpx;
    }

    .stat-label {
      font-size: var(--font-size-sm, 12px);
      color: var(--text-color-tertiary, #AAAAAA);
    }
  }

  .social-stat-divider {
    width: 1px;
    height: 40rpx;
    background: var(--border-color-light, #F0F0F0);
  }
}

// 信用评价卡片
.credit-card {
  background: var(--bg-color-card);
  margin-bottom: 16rpx;
  padding: 24rpx;

  .credit-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .credit-title {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: var(--font-size-lg, 16px);
      font-weight: 500;
      color: var(--text-color-primary, #2D2D2D);
    }

    .credit-detail {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: var(--font-size-sm, 12px);
      color: var(--text-color-tertiary, #AAAAAA);
    }
  }

  .credit-card-content {
    display: flex;
    gap: 32rpx;

    .credit-overview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;

      .rate-circle {
        position: relative;
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        background: conic-gradient(#52C41A 0%, #F0F0F0 0%);
        display: flex;
        align-items: center;
        justify-content: center;

        &::before {
          content: '';
          position: absolute;
          width: 100rpx;
          height: 100rpx;
          border-radius: 50%;
          background: var(--bg-color-card);
        }

        .rate-circle-value {
          position: relative;
          z-index: 1;
          font-size: 36rpx;
          font-weight: 700;
          color: var(--success-color, #7ED4A6);
        }

        .rate-circle-unit {
          position: relative;
          z-index: 1;
          font-size: var(--font-size-sm, 12px);
          color: var(--text-color-tertiary, #AAAAAA);
        }
      }

      .rate-circle-label {
        font-size: var(--font-size-sm, 12px);
        color: var(--text-color-tertiary, #AAAAAA);
      }
    }

    .credit-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16rpx;

      .credit-detail-item {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .detail-label {
          font-size: var(--font-size-base, 14px);
          color: var(--text-color-secondary, #7A7A7A);
        }

        .star-rating {
          display: flex;
          gap: 4rpx;
        }

        .detail-value {
          font-size: var(--font-size-base, 14px);
          font-weight: 500;
          color: var(--text-color-primary, #2D2D2D);

          &.credit-level-text {
            color: var(--primary-color, #8EC5E8);
          }
        }
      }
    }
  }
}

// Tab 切换
.tabs-wrapper {
  background: var(--bg-color-card);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky, 1020);
  transition: all 0.25s ease;

  &.has-popup {
    opacity: 0.3;
  }
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color-light, #F0F0F0);

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 28rpx 0;
    font-size: var(--font-size-base, 14px);
    color: var(--text-color-secondary, #7A7A7A);
    position: relative;
    transition: all 0.25s ease;

    &.active {
      color: var(--primary-color, #8EC5E8);
      font-weight: 600;
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 64rpx;
      height: 6rpx;
      background: linear-gradient(90deg, var(--primary-color, #8EC5E8) 0%, var(--primary-color-light) 100%);
      border-radius: 3rpx;
    }
  }
}

.content-scroll {
  height: calc(100vh - 680rpx);
  padding: 16rpx;
}

// 商品网格
.product-grid {
  .grid-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;

    &:not(.animate-grid) {
      opacity: 0;
    }
  }

  .product-card {
    background: var(--bg-color-card);
    border-radius: var(--border-radius-lg, 24px);
    overflow: hidden;
    box-shadow: var(--box-shadow-xs, 0 2rpx 8rpx rgba(0, 0, 0, 0.04));
    transition: all 0.25s ease;

    &:active {
      transform: scale(0.98);
    }

    .product-image-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 100%;
      overflow: hidden;

      .product-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .product-tag {
        position: absolute;
        top: 12rpx;
        padding: 4rpx 12rpx;
        border-radius: 4rpx;
        font-size: var(--font-size-xs, 10px);
        color: #fff;
        font-weight: 500;

        &.new {
          left: 12rpx;
          background: linear-gradient(135deg, var(--info-color) 0%, #096DD9 100%);
        }

        &.hot {
          right: 12rpx;
          background: linear-gradient(135deg, var(--danger-color) 0%, #FF7875 100%);
        }
      }
    }

    .product-info {
      padding: 16rpx;

      .product-title {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        font-size: var(--font-size-base, 14px);
        color: var(--text-color-primary, #2D2D2D);
        line-height: 1.4;
        height: 40rpx;
        margin-bottom: 12rpx;
      }

      .product-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8rpx;

        .price {
          font-size: var(--font-size-xl, 18px);
          font-weight: 600;
          color: var(--danger-color);

          &::before {
            content: '¥';
            font-size: var(--font-size-base, 14px);
            margin-right: 2rpx;
          }
        }

        .condition {
          font-size: var(--font-size-xs, 10px);
          color: var(--text-color-tertiary, #AAAAAA);
          background: var(--bg-color-page);
          padding: 4rpx 8rpx;
          border-radius: 4rpx;
        }
      }

      .product-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .publish-time {
          font-size: var(--font-size-xs, 10px);
          color: var(--text-color-tertiary, #AAAAAA);
        }

        .product-stats {
          display: flex;
          align-items: center;
          gap: 4rpx;
          font-size: var(--font-size-xs, 10px);
          color: var(--text-color-tertiary, #AAAAAA);
        }
      }
    }
  }
}

// 评价列表
.evaluation-list {
  .evaluation-container {
    &:not(.animate-items) {
      opacity: 0;
    }
  }

  .evaluation-card {
    background: var(--bg-color-card);
    border-radius: var(--border-radius-lg, 24px);
    padding: 24rpx;
    margin-bottom: 16rpx;
    box-shadow: var(--box-shadow-xs, 0 2rpx 8rpx rgba(0, 0, 0, 0.04));

    .eval-header {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;

      .eval-avatar {
        border-radius: 50%;
        margin-right: 16rpx;
      }

      .eval-user-info {
        flex: 1;

        .eval-name {
          font-size: var(--font-size-lg, 16px);
          font-weight: 500;
          color: var(--text-color-primary, #2D2D2D);
          display: block;
          margin-bottom: 8rpx;
        }

        .eval-meta {
          display: flex;
          align-items: center;
          gap: 12rpx;

          .eval-stars {
            display: flex;
            gap: 4rpx;
          }

          .eval-time {
            font-size: var(--font-size-xs, 10px);
            color: var(--text-color-tertiary, #AAAAAA);
          }
        }
      }

      .eval-rating-badge {
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        font-size: var(--font-size-lg, 16px);
        font-weight: 600;

        &.rating-5 {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #fff;
        }

        &.rating-4 {
          background: linear-gradient(135deg, var(--success-color) 0%, #389E0D 100%);
          color: #fff;
        }

        &.rating-3 {
          background: linear-gradient(135deg, var(--info-color) 0%, #096DD9 100%);
          color: #fff;
        }

        &.rating-2,
        &.rating-1 {
          background: linear-gradient(135deg, var(--danger-color) 0%, #FF7875 100%);
          color: #fff;
        }
      }
    }

    .eval-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-bottom: 16rpx;

      .eval-tag {
        display: flex;
        align-items: center;
        gap: 4rpx;
        padding: 6rpx 12rpx;
        background: var(--success-color-alpha-10);
        color: var(--success-color);
        font-size: var(--font-size-sm, 12px);
        border-radius: 4rpx;
      }
    }

    .eval-content {
      font-size: var(--font-size-base, 14px);
      color: var(--text-color-secondary, #7A7A7A);
      line-height: 1.6;
      margin-bottom: 16rpx;
    }

    .eval-product {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 12rpx;
      background: var(--bg-color-page);
      border-radius: var(--border-radius-base, 20px);

      .eval-product-img {
        width: 80rpx;
        height: 80rpx;
        border-radius: var(--border-radius-base, 20px);
      }

      .eval-product-name {
        flex: 1;
        font-size: var(--font-size-sm, 12px);
        color: var(--text-color-secondary, #7A7A7A);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        overflow: hidden;
      }
    }
  }
}

// 加载占位符
.loading-placeholder {
  min-height: 400rpx;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 32rpx;
  opacity: 0;
  transition: opacity 0.4s ease;

  &.animate-empty {
    opacity: 1;

    .empty-icon-wrapper {
      animation: iconFloatIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .empty-text {
      animation: textSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards;
      opacity: 0;
      transform: translateY(20rpx);
    }

    .empty-hint {
      animation: textSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.25s forwards;
      opacity: 0;
      transform: translateY(20rpx);
    }
  }

  .empty-icon-wrapper {
    margin-bottom: 24rpx;
    opacity: 0;
    transform: scale(0.8) translateY(-20rpx);
  }

  .empty-text {
    font-size: var(--font-size-lg, 16px);
    color: var(--text-color-tertiary, #AAAAAA);
    margin: 24rpx 0 8rpx;
  }

  .empty-hint {
    font-size: var(--font-size-sm, 12px);
    color: var(--text-color-placeholder, #CCCCCC);
  }
}

@keyframes iconFloatIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20rpx);
  }
  60% {
    transform: scale(1.05) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes textSlideUp {
  0% {
    opacity: 0;
    transform: translateY(20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

// 加载状态
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;

  :deep(.uni-icons) {
    animation: spin 1s linear infinite;
  }

  .loading-text {
    margin-left: 16rpx;
    font-size: var(--font-size-sm, 12px);
    color: var(--text-color-tertiary, #AAAAAA);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 没有更多
.no-more {
  text-align: center;
  padding: 32rpx;
  font-size: var(--font-size-sm, 12px);
  color: var(--text-color-tertiary, #AAAAAA);
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 80rpx;
    height: 1px;
    background: var(--border-color-light, #F0F0F0);
  }

  &::before {
    left: 80rpx;
  }

  &::after {
    right: 80rpx;
  }
}

// 进入动画
.animated {
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  &.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  &.slide-up {
    transform: translateY(40rpx);

    &.animate-in {
      transform: translateY(0);
    }
  }
}

// 头部特殊动画
.user-header.animated {
  transform: translateY(-20rpx);

  &.animate-in {
    transform: translateY(0);
  }
}

// 商品卡片交错动画
.grid-container.animate-grid .product-card {
  animation: cardFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;

  @for $i from 1 through 20 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 评价卡片交错动画
.evaluation-container.animate-items .evaluation-card {
  animation: evalSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;

  @for $i from 1 through 20 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.08}s;
    }
  }
}

@keyframes evalSlideIn {
  from {
    opacity: 0;
    transform: translateX(-30rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 统计数字跳动动画
.social-stat-item .stat-num {
  animation: numberPop 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: 0.3s;
}

@keyframes numberPop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 信用环形进度条动画
.rate-circle {
  animation: circleProgress 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: 0.4s;
}

@keyframes circleProgress {
  from {
    transform: rotate(-90deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
}

// 头像缩放动画
.avatar-wrapper {
  .avatar {
    transition: transform 0.3s ease;

    &:active {
      transform: scale(0.95);
    }
  }
}

// 按钮悬停效果（仅H5）
@media (hover: hover) {
  .action-btn:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 6rpx 16rpx var(--primary-color-alpha-20);
  }

  .product-card:hover {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  }

  .evaluation-card:hover {
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  }
}

// 自定义操作弹窗
.action-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-modal, 1050) + 100);
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

.action-popup {
  width: 100%;
  background: var(--bg-color-card);
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
}

.action-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1px solid var(--border-color-light, #F0F0F0);

  .action-popup-title {
    font-size: var(--font-size-lg, 16px);
    font-weight: 600;
    color: var(--text-color-primary, #2D2D2D);
  }

  .action-popup-close {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--bg-color-page);
  }
}

.action-popup-content {
  padding: 16rpx 0;
  max-height: 60vh;
  overflow-y: auto;
}

.action-popup-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  transition: all 0.15s ease;

  &:active {
    background: var(--bg-color-page);
  }

  &.danger {
    text {
      color: var(--danger-color);
    }
  }

  text {
    font-size: var(--font-size-base, 14px);
    color: var(--text-color-primary, #2D2D2D);
  }
}

.action-popup-footer {
  padding: 16rpx 32rpx;
  border-top: 1px solid var(--border-color-light, #F0F0F0);
}

.action-popup-cancel {
  width: 100%;
  padding: 24rpx;
  background: var(--bg-color-page);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:active {
    opacity: 0.7;
  }

  text {
    font-size: var(--font-size-base, 14px);
    font-weight: 500;
    color: var(--text-color-primary, #2D2D2D);
  }
}
</style>
