<template>
  <div class="blacklist-manage-container">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户昵称或手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="拉黑时间">
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
        批量解除 ({{ selectedRows.length }})
      </el-button>
    </el-card>

    <!-- 数据列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="blacklistId" label="记录ID" width="100" />
        <el-table-column label="拉黑用户" width="200">
          <template #default="{ row }">
            <div class="user-info">
              <div>{{ row.userNickname || '-' }}</div>
              <div class="text-secondary">ID: {{ row.userId }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="被拉黑用户" width="200">
          <template #default="{ row }">
            <div class="user-info">
              <div>{{ row.blockedUserNickname || '-' }}</div>
              <div class="text-secondary">ID: {{ row.blockedUserId }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="拉黑原因" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.reason || '未填写' }}
          </template>
        </el-table-column>
        <el-table-column label="拉黑时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDelete(row)">解除拉黑</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  getBlacklistList,
  deleteBlacklist,
  batchDeleteBlacklist,
  type BlacklistVO,
  type BlacklistQueryParams,
} from '@/api/blacklist'

// 数据状态
const tableData = ref<BlacklistVO[]>([])
const loading = ref(false)
const selectedRows = ref<BlacklistVO[]>([])
const dateRange = ref<[string, string]>()

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = ref<BlacklistQueryParams>({
  keyword: '',
  startTime: undefined,
  endTime: undefined,
  pageNum: 1,
  pageSize: 20,
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    searchForm.value.pageNum = pageNum.value
    searchForm.value.pageSize = pageSize.value
    const result = await getBlacklistList(searchForm.value)
    tableData.value = result.records
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
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
const handleSelectionChange = (rows: BlacklistVO[]) => {
  selectedRows.value = rows
}

// 删除（解除拉黑）
const handleDelete = async (row: BlacklistVO) => {
  try {
    await ElMessageBox.confirm(
      `确定要解除 ${row.userNickname || row.userId} 对 ${row.blockedUserNickname || row.blockedUserId} 的拉黑吗？`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )

    await deleteBlacklist(row.blacklistId)
    ElMessage.success('解除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要解除选中的 ${selectedRows.value.length} 个拉黑关系吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    const blacklistIds = selectedRows.value.map((row) => row.blacklistId)
    await batchDeleteBlacklist(blacklistIds)
    ElMessage.success('解除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 页面加载
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
.blacklist-manage-container {
  padding: 20px;

  .filter-card,
  .toolbar-card,
  .table-card {
    margin-bottom: 20px;
  }

  .user-info {
    .text-secondary {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
