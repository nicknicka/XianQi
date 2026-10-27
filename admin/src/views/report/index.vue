<template>
  <div class="report-manage-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #409eff">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.total }}</div>
              <div class="stats-label">总举报数</div>
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
              <div class="stats-value">{{ statistics.statusStats.pending }}</div>
              <div class="stats-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #67c23a">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.statusStats.processed }}</div>
              <div class="stats-label">已处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #f56c6c">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.todayCount }}</div>
              <div class="stats-label">今日新增</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="举报原因">
          <el-input
            v-model="searchForm.reason"
            placeholder="搜索举报原因"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待处理" :value="0" />
            <el-option label="已处理" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="举报时间">
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

    <!-- 数据列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="reportId" label="举报ID" width="100" />
        <el-table-column label="举报人" width="150">
          <template #default="{ row }">
            <div>{{ row.reporterNickname || '-' }}</div>
            <div class="text-secondary">ID: {{ row.reporterId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="举报对象" width="150">
          <template #default="{ row }">
            <div>{{ reportTargetTypeLabel(row.targetType) }}</div>
            <div class="text-secondary">ID: {{ row.targetId }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="举报原因" width="150" />
        <el-table-column
          prop="description"
          label="描述"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待处理</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已处理</el-tag>
            <el-tag v-else type="info">已驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="举报时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="处理时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.handleTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetailDialog(row)">查看详情</el-button>
            <el-button
              v-if="row.status === 0"
              link
              type="success"
              @click="openHandleDialog(row)"
            >
              处理
            </el-button>
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
    <el-dialog v-model="detailDialogVisible" title="举报详情" width="700px">
      <el-descriptions v-if="currentReport" :column="2" border>
        <el-descriptions-item label="举报ID">{{ currentReport.reportId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="currentReport.status === 0" type="warning">待处理</el-tag>
          <el-tag v-else-if="currentReport.status === 1" type="success">已处理</el-tag>
          <el-tag v-else type="info">已驳回</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="举报人">
          {{ currentReport.reporterNickname || '-' }} (ID: {{ currentReport.reporterId }})
        </el-descriptions-item>
        <el-descriptions-item v-if="currentReport.targetType === 'user'" label="被举报人">
          {{ currentReport.reportedUserNickname || '-' }} (ID: {{ currentReport.reportedUserId }})
        </el-descriptions-item>
        <el-descriptions-item label="举报对象类型">{{ reportTargetTypeLabel(currentReport.targetType) }}</el-descriptions-item>
        <el-descriptions-item label="举报对象ID">{{ currentReport.targetId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="举报原因" :span="2">{{ currentReport.reason }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ currentReport.description || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="证据图片" :span="2">
          <div v-if="currentReport.evidenceImages && currentReport.evidenceImages.length > 0" class="evidence-images">
            <el-image
              v-for="(img, index) in currentReport.evidenceImages"
              :key="index"
              :src="img"
              :preview-src-list="currentReport.evidenceImages"
              style="width: 100px; height: 100px; margin-right: 10px"
              fit="cover"
            />
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="举报时间" :span="2">{{ formatTime(currentReport.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentReport.handleTime" label="处理时间" :span="2">
          {{ formatTime(currentReport.handleTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentReport.handleNote" label="管理员备注" :span="2">
          {{ currentReport.handleNote }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleDialogVisible" title="处理举报" width="600px">
      <el-form :model="handleForm" ref="handleFormRef" label-width="120px">
        <el-form-item label="处理结果" prop="status" :rules="[{ required: true, message: '请选择处理结果' }]">
          <el-radio-group v-model="handleForm.status">
            <el-radio :value="1">通过（已处理）</el-radio>
            <el-radio :value="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="管理员备注">
          <el-input
            v-model="handleForm.handleNote"
            type="textarea"
            :rows="4"
            placeholder="请输入处理说明或备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Clock,
  CircleCheck,
  CircleClose,
} from '@element-plus/icons-vue'
import {
  getReportList,
  getReportDetail,
  handleReport,
  getReportStatistics,
  deleteReport,
  type ReportVO,
  type ReportQueryParams,
  type ReportHandleParams,
} from '@/api/report'

// 数据状态
const tableData = ref<ReportVO[]>([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const handleFormRef = ref()
const currentReport = ref<ReportVO>()
const dateRange = ref<[string, string]>()
const statistics = ref({
  total: 0,
  statusStats: {
    pending: 0,
    processed: 0,
    rejected: 0,
  },
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
  reasonStats: [] as Array<{ reason: string; count?: number }>,
})

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = ref<ReportQueryParams>({
  reason: '',
  status: undefined,
  startTime: undefined,
  endTime: undefined,
  pageNum: 1,
  pageSize: 20,
})

// 处理表单
const handleForm = ref<ReportHandleParams>({
  reportId: '',
  status: 1,
  handleNote: '',
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    searchForm.value.pageNum = pageNum.value
    searchForm.value.pageSize = pageSize.value
    const result = await getReportList(searchForm.value)
    tableData.value = result.records
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
    const data = await getReportStatistics()
    statistics.value = {
      total: data.total,
      statusStats: data.statusStats,
      todayCount: data.todayCount,
      weekCount: data.weekCount || 0,
      monthCount: data.monthCount || 0,
      reasonStats: data.reasonStats || [],
    }
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
    reason: '',
    status: undefined,
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

// 打开详情
const openDetailDialog = async (row: ReportVO) => {
  try {
    currentReport.value = await getReportDetail(row.reportId)
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 打开处理
const openHandleDialog = (row: ReportVO) => {
  currentReport.value = row
  handleForm.value = {
    reportId: row.reportId,
    status: 1,
    handleNote: '',
  }
  handleDialogVisible.value = true
}

// 提交处理
const submitHandle = async () => {
  if (!handleForm.value.status) {
    ElMessage.warning('请选择处理结果')
    return
  }

  try {
    await handleReport(handleForm.value)
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    loadData()
    loadStatistics()
  } catch (error) {
    ElMessage.error('处理失败')
  }
}

// 删除
const handleDelete = async (row: ReportVO) => {
  try {
    await ElMessageBox.confirm('确定要删除这条举报记录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    await deleteReport(row.reportId)
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

// 举报对象类型标签
const reportTargetTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    user: '用户',
    product: '商品',
    message: '消息',
    conversation: '会话',
  }
  return type ? labels[type] || type : '-'
}

// 格式化时间
const formatTime = (time: string | number[] | undefined) => {
  if (!time) return '-'

  // 处理数组格式的时间 [year, month, day, hour, minute, second]
  if (Array.isArray(time)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = time
    const monthStr = String(month).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const hourStr = String(hour).padStart(2, '0')
    const minuteStr = String(minute).padStart(2, '0')
    const secondStr = String(second).padStart(2, '0')
    return `${year}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}:${secondStr}`
  }

  // 处理字符串格式的时间
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.report-manage-container {
  padding: 0; // 移除内边距，因为 el-main 已经有 padding

  .stats-row {
    margin-bottom: 16px; // 减小下边距

    .stats-card {
      min-height: 120px; // 使用最小高度而不是固定高度，避免内容溢出

      :deep(.el-card__body) {
        padding: 14px 16px; // 稍微增加内边距
        // 移除 height: 100%，避免触发滚动条
      }

      .stats-content {
        display: flex;
        flex-direction: column; // 垂直排列
        align-items: center;
        justify-content: center;
        gap: 8px; // 减小间距

        .stats-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
        }

        .stats-info {
          text-align: center; // 文字居中

          .stats-value {
            font-size: 20px;
            font-weight: bold;
            color: #303133;
            line-height: 1.2;
          }

          .stats-label {
            font-size: 13px;
            color: #909399;
            margin-top: 2px;
          }
        }
      }
    }
  }

  .filter-card,
  .table-card {
    margin-bottom: 16px; // 减小下边距
  }

  .text-secondary {
    font-size: 12px;
    color: #909399;
  }

  .evidence-images {
    display: flex;
    flex-wrap: wrap;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
