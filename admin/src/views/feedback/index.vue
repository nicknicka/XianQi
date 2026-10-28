<template>
  <div class="feedback-manage-container">
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="功能建议" :value="1" />
            <el-option label="Bug反馈" :value="2" />
            <el-option label="投诉" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已处理" :value="2" />
            <el-option label="已驳回" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" v-loading="loading">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="feedbackId" label="ID" width="80" />
        <el-table-column label="用户" width="150">
          <template #default="{ row }">
            <div>{{ row.userNickname || '-' }}</div>
            <div class="text-secondary">ID: {{ row.userId }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getFeedbackTypeTagColor(row.type)">
              {{ getFeedbackTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getFeedbackStatusTagColor(row.status)">
              {{ getFeedbackStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handleNote" label="回复" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.handleNote || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetailDialog(row)">详情</el-button>
            <el-button link type="success" @click="openReplyDialog(row)">
              {{ row.handleNote ? '修改回复' : '回复' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog v-model="detailDialogVisible" title="反馈详情" width="700px">
      <el-descriptions v-if="currentFeedback" :column="2" border>
        <el-descriptions-item label="反馈ID">{{ currentFeedback.feedbackId }}</el-descriptions-item>
        <el-descriptions-item label="用户">
          {{ currentFeedback.userNickname || '-' }} (ID: {{ currentFeedback.userId }})
        </el-descriptions-item>
        <el-descriptions-item label="类型" :span="2">
          <el-tag v-if="currentFeedback.type === 'bug'" type="danger">Bug反馈</el-tag>
          <el-tag v-else-if="currentFeedback.type === 'feature'" type="success">功能建议</el-tag>
          <el-tag v-else type="info">其他</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="反馈内容" :span="2">{{ currentFeedback.content }}</el-descriptions-item>
        <el-descriptions-item label="联系方式" :span="2">{{ currentFeedback.contact || '无' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentFeedback.status === 1 ? 'success' : 'warning'">
            {{ currentFeedback.status === 1 ? '已处理' : '待处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatTime(currentFeedback.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentFeedback.handleNote" label="回复" :span="2">{{ currentFeedback.handleNote }}</el-descriptions-item>
        <el-descriptions-item v-if="currentFeedback.handleTime" label="回复时间" :span="2">{{ formatTime(currentFeedback.handleTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="replyDialogVisible" :title="currentFeedback?.handleNote ? '修改回复' : '回复反馈'" width="600px">
      <el-form :model="replyForm" label-width="100px">
        <el-form-item label="回复内容">
          <el-input v-model="replyForm.reply" type="textarea" :rows="6" placeholder="请输入回复内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReply">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getFeedbackList,
  replyFeedback,
  deleteFeedback,
  getFeedbackTypeText,
  getFeedbackStatusText,
  type UserFeedbackVO,
  type FeedbackQueryParams,
} from '@/api/feedback'

const tableData = ref<UserFeedbackVO[]>([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const replyDialogVisible = ref(false)
const currentFeedback = ref<UserFeedbackVO>()
const replyForm = ref({ reply: '' })

const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const searchForm = ref<FeedbackQueryParams>({
  type: undefined,
  status: undefined,
  pageNum: 1,
  pageSize: 20,
})

// 获取反馈类型标签颜色
const getFeedbackTypeTagColor = (type: number) => {
  const colors: Record<number, string> = {
    1: 'success', // 功能建议
    2: 'danger',  // Bug反馈
    3: 'warning', // 投诉
    4: 'info'     // 其他
  }
  return colors[type] || 'info'
}

// 获取反馈状态标签颜色
const getFeedbackStatusTagColor = (status: number) => {
  const colors: Record<number, string> = {
    0: 'warning', // 待处理
    1: 'primary',  // 处理中
    2: 'success',  // 已处理
    3: 'danger'    // 已驳回
  }
  return colors[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    searchForm.value.pageNum = pageNum.value
    searchForm.value.pageSize = pageSize.value
    const result = await getFeedbackList(searchForm.value)
    tableData.value = result.records
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = { type: undefined, status: undefined, pageNum: 1, pageSize: 20 }
  handleSearch()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadData()
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  loadData()
}

const openDetailDialog = (row: UserFeedbackVO) => {
  currentFeedback.value = row
  detailDialogVisible.value = true
}

const openReplyDialog = (row: UserFeedbackVO) => {
  currentFeedback.value = row
  replyForm.value = { reply: row.handleNote || '' }
  replyDialogVisible.value = true
}

const handleReply = async () => {
  if (!replyForm.value.reply.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  try {
    await replyFeedback(currentFeedback.value!.feedbackId, replyForm.value.reply)
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('回复失败')
  }
}

const handleDelete = async (row: UserFeedbackVO) => {
  try {
    await ElMessageBox.confirm('确定要删除这条反馈吗？', '提示', { type: 'warning' })
    await deleteFeedback(row.feedbackId)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadData()
})

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
.feedback-manage-container {
  padding: 20px;
  .filter-card, .table-card { margin-bottom: 20px; }
  .text-secondary { font-size: 12px; color: #909399; }
  .pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
}
</style>
