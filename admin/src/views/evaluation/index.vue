<template>
  <div class="evaluation-manage-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #409eff">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.totalCount }}</div>
              <div class="stats-label">总评价数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #f56c6c">
              <el-icon><StarFilled /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.averageScore.toFixed(1) }}</div>
              <div class="stats-label">平均评分</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #67c23a">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.fiveStarCount }}</div>
              <div class="stats-label">5星好评</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #e6a23c">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.todayCount }}</div>
              <div class="stats-label">今日新增</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 评分分布 -->
    <el-card class="distribution-card">
      <template #header>
        <span>评分分布</span>
      </template>
      <div class="score-distribution">
        <div
          v-for="item in scoreDistribution"
          :key="item.score"
          class="score-item"
        >
          <div class="score-label">
            <el-rate v-model="item.score" disabled />
            <span>{{ item.count }}条</span>
          </div>
          <el-progress
            :percentage="item.percentage"
            :color="getProgressColor(item.score)"
          />
        </div>
      </div>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索评价内容"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="评分">
          <el-select v-model="searchForm.score" placeholder="全部" clearable style="width: 150px">
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="评价时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      <el-button v-if="selectedRows.length > 0" type="danger" @click="handleBatchDelete">
        批量删除 ({{ selectedRows.length }})
      </el-button>
    </el-card>

    <!-- 数据列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="evaluationId" label="评价ID" width="100" />
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column label="评价人" width="150">
          <template #default="{ row }">
            <div>{{ row.evaluatorNickname || '-' }}</div>
            <div class="text-secondary">ID: {{ row.evaluatorId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="被评价人" width="150">
          <template #default="{ row }">
            <div>{{ row.evaluatedUserNickname || '-' }}</div>
            <div class="text-secondary">ID: {{ row.evaluatedUserId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="180">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="标签" width="200">
          <template #default="{ row }">
            <el-tag v-if="row.tags && row.tags.length > 0" v-for="(tag, index) in row.tags.slice(0, 3)" :key="index" size="small" style="margin-right: 4px">
              {{ tag }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="评价时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetailDialog(row)">查看详情</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="评价详情" width="700px">
      <el-descriptions v-if="currentEvaluation" :column="2" border>
        <el-descriptions-item label="评价ID">{{ currentEvaluation.evaluationId }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentEvaluation.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="评价人">
          {{ currentEvaluation.evaluatorNickname || '-' }} (ID: {{ currentEvaluation.evaluatorId }})
        </el-descriptions-item>
        <el-descriptions-item label="被评价人">
          {{ currentEvaluation.evaluatedUserNickname || '-' }} (ID: {{ currentEvaluation.evaluatedUserId }})
        </el-descriptions-item>
        <el-descriptions-item label="评分" :span="2">
          <el-rate v-model="currentEvaluation.rating" disabled show-score />
        </el-descriptions-item>
        <el-descriptions-item label="评价内容" :span="2">
          {{ currentEvaluation.content || '无文字评价' }}
        </el-descriptions-item>
        <el-descriptions-item label="评价标签" :span="2">
          <el-tag v-if="currentEvaluation.tags && currentEvaluation.tags.length > 0" v-for="(tag, index) in currentEvaluation.tags" :key="index" style="margin-right: 8px">
            {{ tag }}
          </el-tag>
          <span v-else>无标签</span>
        </el-descriptions-item>
        <el-descriptions-item label="评价时间" :span="2">{{ currentEvaluation.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, StarFilled, ChatDotRound, Clock, Refresh } from '@element-plus/icons-vue'
import {
  getEvaluationList,
  getEvaluationDetail,
  deleteEvaluation,
  batchDeleteEvaluations,
  getEvaluationStatistics,
  parseTags,
  type EvaluationVO,
  type EvaluationQueryParams,
  type EvaluationStatistics,
} from '@/api/evaluation'

// 数据状态
const tableData = ref<EvaluationVO[]>([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedRows = ref<EvaluationVO[]>([])
const currentEvaluation = ref<EvaluationVO>()
const dateRange = ref<[string, string]>()
const statistics = ref<EvaluationStatistics>({
  totalCount: 0,
  averageScore: 0,
  fiveStarCount: 0,
  fourStarCount: 0,
  threeStarCount: 0,
  twoStarCount: 0,
  oneStarCount: 0,
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
})

// 评分分布
const scoreDistribution = computed(() => {
  const total = statistics.value.totalCount || 1

  // 辅助函数：计算百分比并四舍五入到百分位
  const calculatePercentage = (count: number | undefined) => {
    const validCount = count || 0
    const percentage = (validCount / total) * 100
    return Math.round(percentage * 100) / 100 // 保留两位小数
  }

  return [
    { score: 5, count: statistics.value.fiveStarCount || 0, percentage: calculatePercentage(statistics.value.fiveStarCount) },
    { score: 4, count: statistics.value.fourStarCount || 0, percentage: calculatePercentage(statistics.value.fourStarCount) },
    { score: 3, count: statistics.value.threeStarCount || 0, percentage: calculatePercentage(statistics.value.threeStarCount) },
    { score: 2, count: statistics.value.twoStarCount || 0, percentage: calculatePercentage(statistics.value.twoStarCount) },
    { score: 1, count: statistics.value.oneStarCount || 0, percentage: calculatePercentage(statistics.value.oneStarCount) },
  ]
})

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = ref<EvaluationQueryParams>({
  keyword: '',
  score: undefined,
  startTime: undefined,
  endTime: undefined,
  pageNum: 1,
  pageSize: 20,
})

// 进度条颜色
const getProgressColor = (score: number) => {
  const colors: Record<number, string> = {
    5: '#67c23a',
    4: '#95d475',
    3: '#e6a23c',
    2: '#f56c6c',
    1: '#909399',
  }
  return colors[score]
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    searchForm.value.pageNum = pageNum.value
    searchForm.value.pageSize = pageSize.value
    const result = await getEvaluationList(searchForm.value)
    // 解析JSON字段
    tableData.value = result.records.map((item) => ({
      ...item,
      tags: parseTags(item.tags || '[]'),
    }))
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载统计
const loadStatistics = async () => {
  try {
    statistics.value = await getEvaluationStatistics()
  } catch (error) {
    console.error('加载统计失败', error)
  }
}

// 日期范围变化
const handleDateChange = (dates: [string, string] | null) => {
  if (dates) {
    searchForm.value.startTime = dates[0]
    searchForm.value.endTime = dates[1]
  } else {
    searchForm.value.startTime = undefined
    searchForm.value.endTime = undefined
  }
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    keyword: '',
    score: undefined,
    startTime: undefined,
    endTime: undefined,
    pageNum: 1,
    pageSize: 20,
  }
  dateRange.value = undefined
  handleSearch()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadData()
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  loadData()
}

// 选择变化
const handleSelectionChange = (rows: EvaluationVO[]) => {
  selectedRows.value = rows
}

// 打开详情
const openDetailDialog = async (row: EvaluationVO) => {
  try {
    const evaluation = await getEvaluationDetail(row.evaluationId)
    // 解析JSON字段
    evaluation.tags = parseTags(evaluation.tags || '[]')
    currentEvaluation.value = evaluation
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 删除
const handleDelete = async (row: EvaluationVO) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    await deleteEvaluation(row.evaluationId)
    ElMessage.success('删除成功')
    loadData()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条评价吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    const evalIds = selectedRows.value.map((row) => row.evaluationId)
    await batchDeleteEvaluations(evalIds)
    ElMessage.success('删除成功')
    loadData()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 页面加载
onMounted(() => {
  loadData()
  loadStatistics()
})
</script>

<style scoped lang="scss">
.evaluation-manage-container {
  padding: 20px;

  .stats-row {
    margin-bottom: 20px;

    .stats-card {
      height: 120px; // 增加卡片高度

      :deep(.el-card__body) {
        height: 100%;
        display: flex;
        align-items: center;
        padding: 16px;
      }

      .stats-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        height: 100%;

        .stats-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 26px;
          flex-shrink: 0;
        }

        .stats-info {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;

          .stats-value {
            font-size: 26px;
            font-weight: bold;
            color: #303133;
            line-height: 1.1;
            margin-bottom: 2px;
          }

          .stats-label {
            font-size: 13px;
            color: #909399;
          }
        }
      }
    }
  }

  .distribution-card,
  .filter-card,
  .toolbar-card,
  .table-card {
    margin-bottom: 20px;
  }

  .score-distribution {
    .score-item {
      margin-bottom: 16px;

      .score-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
    }
  }

  .text-secondary {
    font-size: 12px;
    color: #909399;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
