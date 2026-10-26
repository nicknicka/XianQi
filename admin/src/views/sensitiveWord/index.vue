<template>
  <div class="sensitive-word-manage-container">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索敏感词"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 150px">
            <el-option label="禁止词" :value="1" />
            <el-option label="敏感词" :value="2" />
            <el-option label="替换词" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="searchForm.level" placeholder="全部" clearable style="width: 150px">
            <el-option label="一般" :value="1" />
            <el-option label="严重" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建敏感词</el-button>
      <el-button type="success" :icon="Upload" @click="openImportDialog">批量导入</el-button>
      <el-button type="warning" :icon="Download" @click="handleExport">导出</el-button>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </el-card>

    <!-- 数据列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="word" label="敏感词" width="200">
          <template #default="{ row }">
            <el-tag type="danger" size="large">{{ row.word }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="danger">禁止词</el-tag>
            <el-tag v-else-if="row.type === 2" type="warning">敏感词</el-tag>
            <el-tag v-else type="info">替换词</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="replaceWord" label="替换词" width="150">
          <template #default="{ row }">
            {{ row.replaceWord || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.level === 1" type="info">一般</el-tag>
            <el-tag v-else type="danger">严重</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div v-if="selectedRows.length > 0" class="batch-actions">
        <span>已选择 {{ selectedRows.length }} 项</span>
        <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
      </div>

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

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑敏感词' : '新建敏感词'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="敏感词" prop="word">
          <el-input v-model="formData.word" placeholder="请输入敏感词" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :value="1">禁止词</el-radio>
            <el-radio :value="2">敏感词</el-radio>
            <el-radio :value="3">替换词</el-radio>
          </el-radio-group>
          <div class="form-tip">
            禁止词：直接拒绝提交 | 敏感词：警告提示 | 替换词：自动替换
          </div>
        </el-form-item>

        <el-form-item v-if="formData.type === 3" label="替换词" prop="replaceWord">
          <el-input v-model="formData.replaceWord" placeholder="替换为的内容" />
        </el-form-item>

        <el-form-item label="等级" prop="level">
          <el-radio-group v-model="formData.level">
            <el-radio :value="1">一般</el-radio>
            <el-radio :value="2">严重</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="批量导入敏感词" width="600px">
      <el-form :model="importForm" label-width="120px">
        <el-form-item label="敏感词列表">
          <el-input
            v-model="importForm.wordsText"
            type="textarea"
            :rows="10"
            placeholder="每行一个敏感词，例如：&#10;敏感词1&#10;敏感词2&#10;敏感词3"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="importForm.type">
            <el-option label="禁止词" :value="1" />
            <el-option label="敏感词" :value="2" />
            <el-option label="替换词" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-radio-group v-model="importForm.level">
            <el-radio :value="1">一般</el-radio>
            <el-radio :value="2">严重</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload, Download } from '@element-plus/icons-vue'
import {
  getSensitiveWordList,
  createSensitiveWord,
  updateSensitiveWord,
  deleteSensitiveWord,
  batchDeleteSensitiveWords,
  updateSensitiveWordStatus,
  importSensitiveWords,
  exportSensitiveWords,
  type SensitiveWordVO,
  type SensitiveWordQueryParams,
  type SensitiveWordParams,
} from '@/api/sensitiveWord'

// 数据状态
const tableData = ref<SensitiveWordVO[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const formRef = ref()
const selectedRows = ref<SensitiveWordVO[]>([])

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = ref<SensitiveWordQueryParams>({
  keyword: '',
  type: undefined,
  level: undefined,
  status: undefined,
  pageNum: 1,
  pageSize: 20,
})

// 表单数据
const formData = ref<SensitiveWordParams>({
  word: '',
  type: 1,
  replaceWord: '',
  level: 1,
  status: 1,
})

// 导入表单
const importForm = ref({
  wordsText: '',
  type: 1,
  level: 1,
})

// 表单验证规则
const formRules = {
  word: [{ required: true, message: '请输入敏感词', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const isEditMode = ref(false)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    searchForm.value.pageNum = pageNum.value
    searchForm.value.pageSize = pageSize.value
    const result = await getSensitiveWordList(searchForm.value)
    tableData.value = result.records
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
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
    type: undefined,
    level: undefined,
    status: undefined,
    pageNum: 1,
    pageSize: 20,
  }
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
const handleSelectionChange = (rows: SensitiveWordVO[]) => {
  selectedRows.value = rows
}

// 打开创建对话框
const openCreateDialog = () => {
  isEditMode.value = false
  formData.value = {
    word: '',
    type: 1,
    replaceWord: '',
    level: 1,
    status: 1,
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (row: SensitiveWordVO) => {
  isEditMode.value = true
  formData.value = {
    wordId: row.wordId,
    word: row.word,
    type: row.type,
    replaceWord: row.replaceWord || '',
    level: row.level,
    status: row.status,
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    if (isEditMode.value) {
      await updateSensitiveWord(formData.value)
      ElMessage.success('更新成功')
    } else {
      await createSensitiveWord(formData.value)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('操作失败')
    }
  }
}

// 切换状态
const toggleStatus = async (row: SensitiveWordVO) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await updateSensitiveWordStatus(row.wordId, newStatus)
    ElMessage.success(newStatus === 1 ? '已启用' : '已禁用')
    loadData()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除
const handleDelete = async (row: SensitiveWordVO) => {
  try {
    await ElMessageBox.confirm('确定要删除这个敏感词吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    await deleteSensitiveWord(row.wordId)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个敏感词吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    const wordIds = selectedRows.value.map((row) => row.wordId)
    await batchDeleteSensitiveWords(wordIds)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 打开导入对话框
const openImportDialog = () => {
  importForm.value = {
    wordsText: '',
    type: 1,
    level: 1,
  }
  importDialogVisible.value = true
}

// 导入
const handleImport = async () => {
  if (!importForm.value.wordsText.trim()) {
    ElMessage.warning('请输入敏感词列表')
    return
  }

  const words = importForm.value.wordsText
    .split('\n')
    .map((w) => w.trim())
    .filter((w) => w)

  if (words.length === 0) {
    ElMessage.warning('请输入有效的敏感词')
    return
  }

  try {
    await importSensitiveWords({
      words,
      type: importForm.value.type,
      level: importForm.value.level,
    })
    ElMessage.success(`成功导入 ${words.length} 个敏感词`)
    importDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('导入失败')
  }
}

// 导出
const handleExport = async () => {
  try {
    const blob = await exportSensitiveWords()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `敏感词_${new Date().getTime()}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
</script>

<style scoped lang="scss">
.sensitive-word-manage-container {
  padding: 20px;

  .filter-card,
  .toolbar-card,
  .table-card {
    margin-bottom: 20px;
  }

  .batch-actions {
    margin-top: 16px;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 16px;

    span {
      color: #606266;
      font-size: 14px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}
</style>
