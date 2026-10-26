<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-loading="loading">
        <el-card class="stats-card user-card">
          <div class="stats-content">
            <div class="stats-icon">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ overviewData?.totalUsers || 0 }}</div>
              <div class="stats-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" v-loading="loading">
        <el-card class="stats-card product-card">
          <div class="stats-content">
            <div class="stats-icon">
              <el-icon size="32"><Goods /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ overviewData?.totalProducts || 0 }}</div>
              <div class="stats-label">总商品数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" v-loading="loading">
        <el-card class="stats-card order-card">
          <div class="stats-content">
            <div class="stats-icon">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ overviewData?.totalOrders || 0 }}</div>
              <div class="stats-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" v-loading="loading">
        <el-card class="stats-card amount-card">
          <div class="stats-content">
            <div class="stats-icon">
              <el-icon size="32"><Money /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">¥{{ overviewData?.totalAmount || 0 }}</div>
              <div class="stats-label">交易总额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 今日数据 -->
    <el-card class="today-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>今日数据</span>
          <el-button :icon="Refresh" @click="refreshData" :loading="refreshing">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <div class="today-item">
            <div class="today-label">新增用户</div>
            <div class="today-value">{{ overviewData?.todayUsers || 0 }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="today-item">
            <div class="today-label">新增商品</div>
            <div class="today-value">{{ overviewData?.todayProducts || 0 }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="today-item">
            <div class="today-label">新增订单</div>
            <div class="today-value">{{ overviewData?.todayOrders || 0 }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="today-item">
            <div class="today-label">交易金额</div>
            <div class="today-value">¥{{ overviewData?.todayAmount || 0 }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 待办事项 -->
    <el-row :gutter="20" class="todo-row">
      <el-col :xs="24" :md="12">
        <el-card class="todo-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <div class="todo-list">
            <div class="todo-item" @click="goToProductAudit">
              <div class="todo-left">
                <el-icon color="#f56c6c" size="24"><CircleCheck /></el-icon>
                <span>待审核商品</span>
              </div>
              <div class="todo-right">
                <el-tag size="large" type="warning">{{ statisticsData?.product?.pendingAuditCount || 0 }}</el-tag>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            <div class="todo-item" @click="goToOrderManage">
              <div class="todo-left">
                <el-icon color="#409eff" size="24"><Management /></el-icon>
                <span>待处理退款</span>
              </div>
              <div class="todo-right">
                <el-tag size="large" type="primary">{{ statisticsData?.order?.refundedCount || 0 }}</el-tag>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            <div class="todo-item" @click="goToFeedback">
              <div class="todo-left">
                <el-icon color="#67c23a" size="24"><ChatLineSquare /></el-icon>
                <span>待处理反馈</span>
              </div>
              <div class="todo-right">
                <el-tag size="large" type="success">{{ overviewData?.userFeedbacks || 0 }}</el-tag>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            <div class="todo-item" @click="goToReport">
              <div class="todo-left">
                <el-icon color="#e6a23c" size="24"><Warning /></el-icon>
                <span>待处理举报</span>
              </div>
              <div class="todo-right">
                <el-tag size="large" type="warning">{{ overviewData?.pendingReports || 0 }}</el-tag>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Goods,
  Document,
  Money,
  Refresh,
  CircleCheck,
  Management,
  ArrowRight,
  ChatLineSquare,
  Warning,
} from '@element-plus/icons-vue'
import { getOverview, getUserStatistics, getProductStatistics, getOrderStatistics } from '@/api/statistics'

const router = useRouter()

// 数据状态
const loading = ref(false)
const refreshing = ref(false)

// 总览数据
const overviewData = ref<any>(null)

// 详细统计数据
const statisticsData = ref<any>(null)

// 页面加载
onMounted(() => {
  loadOverviewData()
  loadStatisticsData()
})

// 加载总览数据
const loadOverviewData = async () => {
  loading.value = true
  try {
    const res = await getOverview()
    overviewData.value = res
  } catch (error) {
    console.error('加载总览数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载详细统计数据
const loadStatisticsData = async () => {
  try {
    const [users, products, orders] = await Promise.all([
      getUserStatistics(),
      getProductStatistics(),
      getOrderStatistics(),
    ])

    statisticsData.value = {
      user: users,
      product: products,
      order: orders,
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 刷新数据
const refreshData = () => {
  refreshing.value = true
  Promise.all([loadOverviewData(), loadStatisticsData()]).finally(() => {
    refreshing.value = false
    ElMessage.success('刷新成功')
  })
}

// 跳转到商品审核
const goToProductAudit = () => {
  router.push('/admin/product')
}

// 跳转到订单管理
const goToOrderManage = () => {
  router.push('/admin/order')
}

// 跳转到用户反馈
const goToFeedback = () => {
  router.push('/admin/feedback')
}

// 跳转到举报管理
const goToReport = () => {
  router.push('/admin/report')
}
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 20px;
}

// 统计卡片
.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  :deep(.el-card__body) {
    padding: 20px;
  }

  .stats-content {
    display: flex;
    align-items: center;

    .stats-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .stats-info {
      flex: 1;

      .stats-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        line-height: 1.2;
        margin-bottom: 8px;
      }

      .stats-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  &.user-card .stats-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &.product-card .stats-icon {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #fff;
  }

  &.order-card .stats-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
  }

  &.amount-card .stats-icon {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: #fff;
  }
}

// 今日数据卡片
.today-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .today-item {
    text-align: center;
    padding: 20px 0;

    .today-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 12px;
    }

    .today-value {
      font-size: 28px;
      font-weight: bold;
      color: #409eff;
    }
  }
}

// 待办事项和图表
.todo-row {
  .todo-card,
  .chart-card {
    height: 100%;

    .todo-list {
      .todo-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #ebeef5;
        cursor: pointer;
        transition: all 0.3s;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f5f7fa;
          border-radius: 4px;
          padding-left: 8px;
          padding-right: 8px;
        }

        .todo-left {
          display: flex;
          align-items: center;
          gap: 12px;

          span {
            font-size: 16px;
            color: #303133;
          }
        }

        .todo-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }

  }
}
</style>
