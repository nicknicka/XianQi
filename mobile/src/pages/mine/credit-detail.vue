<template>
  <view class="credit-detail-page" :style="themeStyle">
    <!-- 信用分展示卡片 -->
    <view class="score-card">
      <view class="score-circle-container">
        <view class="score-circle" :class="`level-${creditLevel}`">
          <view class="score-ring" :style="{ background: conicGradient }" />
          <view class="score-inner">
            <text class="score-value">{{ creditDetail?.creditScore || 0 }}</text>
            <text class="score-label">{{ creditDetail?.creditLevelText || '一般' }}</text>
          </view>
        </view>
      </view>

      <!-- 进度条 -->
      <view class="progress-section">
        <view class="progress-bar">
          <view
            class="progress-fill"
            :class="`level-${creditLevel}`"
            :style="{ width: `${progressPercent}%` }"
          />
        </view>
        <text class="progress-text">
          距离下一等级还需 {{ nextLevelGap }} 分
        </text>
      </view>

      <!-- 今日统计 -->
      <view class="today-stats">
        <view class="stat-item">
          <text class="stat-label">今日已获得</text>
          <text class="stat-value gain">+{{ todayGain }}</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-label">今日剩余</text>
          <text class="stat-value">{{ todayRemaining }}</text>
        </view>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-section">
      <view class="stat-card" @click="goEvaluations">
        <view class="stat-icon good">
          <uni-icons type="thumbsup" size="20" color="#FFFFFF" />
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ creditDetail?.positiveCount || 0 }}</text>
          <text class="stat-label">好评</text>
        </view>
      </view>

      <view class="stat-card" @click="goEvaluations">
        <view class="stat-icon neutral">
          <uni-icons type="help" size="20" color="#FFFFFF" />
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ creditDetail?.neutralCount || 0 }}</text>
          <text class="stat-label">中评</text>
        </view>
      </view>

      <view class="stat-card" @click="goEvaluations">
        <view class="stat-icon bad">
          <uni-icons type="thumbsdown" size="20" color="#FFFFFF" />
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ creditDetail?.negativeCount || 0 }}</text>
          <text class="stat-label">差评</text>
        </view>
      </view>

      <view class="stat-card" @click="goOrders">
        <view class="stat-icon transaction">
          <uni-icons type="shop" size="20" color="#FFFFFF" />
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ creditDetail?.transactionCount || 0 }}</text>
          <text class="stat-label">交易</text>
        </view>
      </view>
    </view>

    <!-- 好评率展示 -->
    <view class="good-rate-card" v-if="creditDetail?.totalEvaluations">
      <view class="rate-header">
        <text class="rate-title">好评率</text>
        <text class="rate-value">{{ creditDetail.goodRate }}%</text>
      </view>
      <view class="rate-bar">
        <view
          class="rate-fill"
          :style="{ width: `${creditDetail.goodRate}%` }"
        />
      </view>
      <text class="rate-desc">基于 {{ creditDetail.totalEvaluations }} 条评价</text>
    </view>

    <!-- 信用分规则 -->
    <view class="rules-section">
      <view class="section-header">
        <uni-icons type="info" size="18" color="var(--info-color)" />
        <text class="section-title">信用分规则</text>
      </view>

      <view class="rule-list">
        <view class="rule-category">
          <view class="category-header">
            <uni-icons type="plus-filled" size="16" color="#7ED4A6" />
            <text class="category-title">加分规则</text>
          </view>
          <view class="rule-items">
            <view v-for="rule in gainRules" :key="rule.title" class="rule-item">
              <view class="rule-main">
                <text class="rule-title">{{ rule.title }}</text>
                <text class="rule-score positive">+{{ rule.score }}</text>
              </view>
              <text class="rule-desc">{{ rule.description }}</text>
              <text class="rule-limit" v-if="rule.limit">{{ rule.limit }}</text>
            </view>
          </view>
        </view>

        <view class="rule-category">
          <view class="category-header">
            <uni-icons type="minus-filled" size="16" :color="dangerColor" />
            <text class="category-title">减分规则</text>
          </view>
          <view class="rule-items">
            <view v-for="rule in lossRules" :key="rule.title" class="rule-item">
              <view class="rule-main">
                <text class="rule-title">{{ rule.title }}</text>
                <text class="rule-score negative">{{ rule.score }}</text>
              </view>
              <text class="rule-desc">{{ rule.description }}</text>
              <text class="rule-limit" v-if="rule.limit">{{ rule.limit }}</text>
            </view>
          </view>
        </view>

        <view class="rule-category">
          <view class="category-header">
            <uni-icons type="clock" size="16" color="#FFD666" />
            <text class="category-title">衰减规则</text>
          </view>
          <view class="rule-items">
            <view class="rule-item">
              <view class="rule-main">
                <text class="rule-title">{{ decayRule.title }}</text>
              </view>
              <text class="rule-desc">{{ decayRule.description }}</text>
              <text class="rule-limit">{{ decayRule.limit }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 防刷提示 -->
    <view class="anti-spam-tip">
      <uni-icons type="warn" size="16" color="#FFA500" />
      <text>为维护公平，信用分设有每日/周/月加分上限，防止刷分作弊</text>
    </view>

    <!-- 变化记录 -->
    <view class="history-section">
      <view class="section-header">
        <uni-icons type="list" size="18" color="var(--info-color)" />
        <text class="section-title">近期变化</text>
      </view>

      <view v-if="!loading && historyList.length === 0" class="empty-state">
        <EmptyState text="暂无变化记录" image="/static/images/empty.png" tip="你的信用分变化会在这里记录" />
      </view>

      <view v-else class="history-list">
        <view v-for="record in historyList" :key="record.createdAt" class="history-item">
          <view class="history-info">
            <text class="history-reason">{{ getReasonText(record.reason) }}</text>
            <text v-if="record.reasonDetail" class="history-detail">{{ record.reasonDetail }}</text>
            <text class="history-time">{{ formatTime(record.createdAt) }}</text>
          </view>
          <view class="history-score" :class="{ positive: record.scoreChange > 0, negative: record.scoreChange < 0 }">
            <text>{{ record.scoreChange > 0 ? '+' : '' }}{{ record.scoreChange }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { creditApi } from '@/api/credit'
import { getCreditLevel, getCreditLevelTextByScore, calculateNextLevelGap, calculateProgressPercent, CREDIT_CONFIG } from '@/constants/credit'
import { getCreditReasonText } from '@/types/credit'
import { useUserStore } from '@/store/user'
import { transformCreditDetail, validateCreditDetail, parseNumber, getDefaultCreditDetail } from '@/utils/credit-helper'
import { useThemeColors, useThemeStyle } from '@/utils/theme'
import EmptyState from '@/components/empty-state/empty-state.vue'

const userStore = useUserStore()
const { themeStyle } = useThemeStyle()
const { dangerColor } = useThemeColors()

const creditDetail = ref<any>(getDefaultCreditDetail())
const creditRules = ref<any>(null)
const loading = ref(false)

const creditLevel = computed(() => {
  if (!creditDetail.value) return 'normal'
  return getCreditLevel(creditDetail.value.creditScore)
})

const nextLevelGap = computed(() => {
  if (!creditDetail.value) return 0
  return calculateNextLevelGap(creditDetail.value.creditScore)
})

const progressPercent = computed(() => {
  if (!creditDetail.value) return 0
  return calculateProgressPercent(creditDetail.value.creditScore)
})

const todayGain = computed(() => {
  if (!creditDetail.value) return 0
  return parseNumber(creditDetail.value.todayGain)
})

const todayRemaining = computed(() => {
  if (!creditDetail.value) return CREDIT_CONFIG.DAILY_MAX_GAIN
  return Math.max(0, parseNumber(creditDetail.value.todayRemaining))
})

const conicGradient = computed(() => {
  const percent = progressPercent.value
  return `conic-gradient(
    ${getLevelColor(creditLevel.value)} 0%,
    ${getLevelColor(creditLevel.value)} ${percent}%,
    #F0F0F0 ${percent}%,
    #F0F0F0 100%
  )`
})

const historyList = computed(() => {
  if (!creditDetail.value?.scoreHistory) return []
  return creditDetail.value.scoreHistory
})

const gainRules = computed(() => {
  return creditRules.value?.gainRules || []
})

const lossRules = computed(() => {
  return creditRules.value?.lossRules || []
})

const decayRule = computed(() => {
  return creditRules.value?.decayRule || { title: '', description: '', limit: '' }
})

function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    excellent: 'var(--success-color)',
    good: 'var(--info-color)',
    normal: 'var(--warning-color)',
    poor: dangerColor
  }
  return colors[level] || 'var(--warning-color)'
}

function getReasonText(reason: string): string {
  return getCreditReasonText(reason)
}

function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

function goEvaluations() {
  uni.navigateTo({ url: '/pages/mine/evaluations' })
}

function goOrders() {
  uni.navigateTo({ url: '/pages/order/list?status=completed' })
}

async function loadData() {
  loading.value = true
  try {
    const [detailRes, rulesRes] = await Promise.all([
      creditApi.getMyCreditDetail(),
      creditApi.getCreditRules()
    ])

    // 转换和处理数据
    const transformedDetail = transformCreditDetail(detailRes.data)

    // 验证数据完整性
    if (validateCreditDetail(transformedDetail)) {
      creditDetail.value = transformedDetail
    } else {
      console.warn('信用分数据验证失败，使用默认值')
      creditDetail.value = getDefaultCreditDetail()
    }

    creditRules.value = rulesRes.data
  } catch (error: any) {
    console.error('加载信用分数据失败', error)
    uni.showToast({
      title: error?.message || '加载失败',
      icon: 'none'
    })
    // 加载失败时使用默认值
    creditDetail.value = getDefaultCreditDetail()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.credit-detail-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
}

// 信用分卡片
.score-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 50%, var(--accent-color) 100%);
  padding: 48rpx 32rpx 32rpx;
  margin-bottom: 16rpx;
}

.score-circle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 32rpx;
}

.score-circle {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  padding: 8rpx;
  background: rgba(255, 255, 255, 0.2);
}

.score-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.score-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--bg-color-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 56rpx;
  font-weight: bold;
  color: var(--primary-color);
  line-height: 1;
}

.score-label {
  font-size: $font-size-base;
  color: var(--text-color-secondary);
  margin-top: 8rpx;
}

// 进度条
.progress-section {
  margin-bottom: 24rpx;
}

.progress-bar {
  height: 12rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.progress-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s;

  &.level-excellent {
    background: var(--success-color);
  }

  &.level-good {
    background: var(--info-color);
  }

  &.level-normal {
    background: var(--warning-color);
  }

  &.level-poor {
    background: var(--error-color);
  }
}

.progress-text {
  display: block;
  text-align: center;
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.9);
}

// 今日统计
.today-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 20rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-label {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-size: $font-size-xl;
  font-weight: 600;
  color: #fff;

  &.gain {
    color: var(--success-color);
  }
}

.stat-divider {
  width: 1px;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 24rpx;
}

// 数据统计
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  padding: 0 16rpx;
  margin-bottom: 16rpx;
}

.stat-card {
  background: var(--bg-color-card);
  border-radius: $border-radius-lg;
  padding: 20rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.stat-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.good {
    background: linear-gradient(135deg, var(--success-color) 0%, #389E0D 100%);
  }

  &.neutral {
    background: linear-gradient(135deg, var(--warning-color) 0%, #D46B08 100%);
  }

  &.bad {
    background: linear-gradient(135deg, var(--error-color) 0%, #CF1322 100%);
  }

  &.transaction {
    background: linear-gradient(135deg, var(--info-color) 0%, #096DD9 100%);
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stat-value {
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--text-color-primary);
}

.stat-label {
  font-size: $font-size-xs;
  color: var(--text-color-tertiary);
}

// 好评率卡片
.good-rate-card {
  background: var(--bg-color-card);
  margin: 0 16rpx 16rpx;
  padding: 24rpx;
  border-radius: $border-radius-lg;
}

.rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.rate-title {
  font-size: $font-size-base;
  color: var(--text-color-secondary);
}

.rate-value {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--success-color);
}

.rate-bar {
  height: 16rpx;
  background: var(--bg-color-page);
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-color) 0%, #73D13D 100%);
  border-radius: 8rpx;
  transition: width 0.3s;
}

.rate-desc {
  font-size: $font-size-sm;
  color: var(--text-color-tertiary);
}

// 规则区域
.rules-section,
.history-section {
  background: var(--bg-color-card);
  margin: 0 16rpx 16rpx;
  padding: 24rpx;
  border-radius: $border-radius-lg;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--text-color-primary);
}

.rule-category {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.category-title {
  font-size: $font-size-base;
  font-weight: 600;
  color: var(--text-color-primary);
}

.rule-items {
  padding-left: 24rpx;
}

.rule-item {
  padding: 16rpx 0;
  border-bottom: 1px solid $border-color-light;

  &:last-child {
    border-bottom: none;
  }
}

.rule-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.rule-title {
  font-size: $font-size-base;
  color: var(--text-color-primary);
}

.rule-score {
  font-size: $font-size-base;
  font-weight: 600;

  &.positive {
    color: var(--success-color);
  }

  &.negative {
    color: var(--error-color);
  }
}

.rule-desc {
  display: block;
  font-size: $font-size-sm;
  color: var(--text-color-secondary);
  margin-bottom: 6rpx;
}

.rule-limit {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-color-tertiary);
  background: var(--bg-color-page);
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
}

// 防刷提示
.anti-spam-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #FFF7E6;
  border: 1px solid #FFD591;
  border-radius: $border-radius-base;
  padding: 16rpx;
  margin: 0 16rpx 16rpx;

  text {
    flex: 1;
    font-size: $font-size-sm;
    color: #D46B08;
    line-height: 1.5;
  }
}

// 变化记录
.history-list {
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16rpx 0;
    border-bottom: 1px solid $border-color-light;

    &:last-child {
      border-bottom: none;
    }
  }
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.history-reason {
  font-size: $font-size-base;
  color: var(--text-color-primary);
  font-weight: 500;
}

.history-detail {
  font-size: $font-size-sm;
  color: var(--text-color-secondary);
}

.history-time {
  font-size: $font-size-xs;
  color: var(--text-color-tertiary);
}

.history-score {
  font-size: $font-size-lg;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;

  &.positive {
    color: var(--success-color);
    background: var(--success-color-alpha-10);
  }

  &.negative {
    color: var(--error-color);
    background: var(--danger-color-alpha-10);
  }
}

// 空状态
.empty-state {
  padding: 80rpx 0;
  text-align: center;
}

.empty-text {
  font-size: $font-size-base;
  color: var(--text-color-tertiary);
}
</style>
