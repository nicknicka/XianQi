<template>
  <div class="notification-manage-container">
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-button type="primary" :icon="Plus" @click="handleCreate">新建通知</el-button>
      <el-button :icon="Refresh" @click="loadNotificationList">刷新</el-button>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="通知标题" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="通知类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 150px">
            <el-option label="系统公告" value="system" />
            <el-option label="活动通知" value="activity" />
            <el-option label="紧急通知" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="已撤回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="notificationList" stripe>
        <el-table-column prop="notificationId" label="ID" width="80" />
        <el-table-column label="通知标题" width="300">
          <template #default="{ row }">
            <div class="title-cell">
              <el-tag v-if="row.type === 'system'" type="info" size="small">公告</el-tag>
              <el-tag v-else-if="row.type === 'activity'" type="success" size="small">活动</el-tag>
              <el-tag v-else-if="row.type === 'urgent'" type="danger" size="small">紧急</el-tag>
              <span class="title-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="通知内容" min-width="200">
          <template #default="{ row }">
            <div class="content-cell">{{ stripHtml(row.content) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="info">草稿</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已发布</el-tag>
            <el-tag v-else-if="row.status === 2" type="warning">已撤回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            {{ row.publishTime ? formatTime(row.publishTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              size="small"
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <!-- 创建/编辑弹窗 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEditMode ? '编辑通知' : '新建通知'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="notificationForm" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="通知标题" prop="title">
          <el-input
            v-model="notificationForm.title"
            placeholder="请输入通知标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="通知类型" prop="type">
          <el-radio-group v-model="notificationForm.type">
            <el-radio value="system">系统公告</el-radio>
            <el-radio value="activity">活动通知</el-radio>
            <el-radio value="urgent">紧急通知</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="发布方式" prop="publishWay">
          <el-radio-group v-model="notificationForm.publishWay">
            <el-radio value="draft">保存草稿</el-radio>
            <el-radio value="immediate">立即发布</el-radio>
            <el-radio value="schedule">定时发布</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="notificationForm.publishWay === 'schedule'"
          label="发布时间"
          prop="scheduleTime"
        >
          <el-date-picker
            v-model="notificationForm.scheduleTime"
            type="datetime"
            placeholder="选择发布时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="目标用户" prop="targetUsers">
          <el-radio-group v-model="notificationForm.targetUsers">
            <el-radio value="all">全部用户</el-radio>
            <el-radio value="specific">指定用户</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="notificationForm.targetUsers === 'specific'"
          label="用户ID列表"
          prop="targetUserIds"
        >
          <el-input
            v-model="notificationForm.targetUserIds"
            type="textarea"
            :rows="2"
            placeholder="请输入用户ID，多个ID用逗号分隔，如：1,2,3"
          />
        </el-form-item>

        <el-form-item label="通知内容" prop="content">
          <div class="rich-editor-container">
            <el-input
              v-model="notificationForm.content"
              type="textarea"
              :rows="10"
              placeholder="支持HTML格式，可以使用 &lt;b&gt;、&lt;u&gt;、&lt;span&gt; 等标签"
              class="rich-editor-textarea"
            />
            <div class="editor-toolbar">
              <span class="hint">提示：可以使用HTML标签来设置格式</span>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit" :loading="formSubmitting">
          {{ notificationForm.publishWay === 'draft' ? '保存草稿' : '确定发布' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  getNotificationList,
  createNotification,
  updateNotification,
  publishNotification,
  deleteNotification,
  type NotificationVO,
  type NotificationQueryParams,
  type CreateNotificationParams,
  type UpdateNotificationParams,
} from '@/api/notification'

// 搜索表单
const searchForm = ref({
  title: '',
  type: undefined as string | undefined,
  status: undefined as number | undefined,
})

// 数据状态
const loading = ref(false)
const notificationList = ref<NotificationVO[]>([])

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 表单弹窗
const formDialogVisible = ref(false)
const isEditMode = ref(false)
const formSubmitting = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const notificationForm = reactive<CreateNotificationParams & { notificationId?: number }>({
  title: '',
  content: '',
  type: 'system',
  publishWay: 'draft',
  scheduleTime: '',
  targetUsers: 'all',
  targetUserIds: '',
})

// 表单验证规则
const formRules: FormRules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  publishWay: [{ required: true, message: '请选择发布方式', trigger: 'change' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
  scheduleTime: [{ required: true, message: '请选择发布时间', trigger: 'change' }],
  targetUsers: [{ required: true, message: '请选择目标用户', trigger: 'change' }],
}

// 页面加载
onMounted(() => {
  loadNotificationList()
})

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  loadNotificationList()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    title: '',
    type: undefined,
    status: undefined,
  }
  pageNum.value = 1
  loadNotificationList()
}

// 加载通知列表
const loadNotificationList = async () => {
  loading.value = true
  try {
    // 构建查询参数，过滤掉 undefined 值
    const params: NotificationQueryParams = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    }

    // 只添加有值的搜索条件
    if (searchForm.value.title) {
      params.title = searchForm.value.title
    }
    if (searchForm.value.type !== undefined && searchForm.value.type !== '') {
      params.type = searchForm.value.type
    }
    if (searchForm.value.status !== undefined && searchForm.value.status !== null) {
      params.status = searchForm.value.status
    }

    const res = await getNotificationList(params)
    notificationList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('加载通知列表失败:', error)
    ElMessage.error('加载通知列表失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pageNum.value = page
  loadNotificationList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadNotificationList()
}

// 创建通知
const handleCreate = () => {
  isEditMode.value = false
  resetForm()
  formDialogVisible.value = true
}

// 编辑通知
const handleEdit = (notification: NotificationVO) => {
  isEditMode.value = true

  // 处理 targetUsers 字段
  let targetUsersValue: 'all' | 'specific' = 'all'
  let targetUserIdsValue = ''

  if (notification.targetUsers) {
    try {
      // 尝试解析为 JSON 数组
      const ids = JSON.parse(notification.targetUsers)
      if (Array.isArray(ids) && ids.length > 0) {
        targetUsersValue = 'specific'
        targetUserIdsValue = ids.join(',')
      }
    } catch {
      // 如果不是 JSON，可能是 'all' 或其他字符串值
      if (notification.targetUsers === 'all' || notification.targetUsers === 'specific') {
        targetUsersValue = notification.targetUsers
        targetUserIdsValue = notification.targetUserIds || ''
      }
    }
  }

  Object.assign(notificationForm, {
    notificationId: notification.notificationId,
    title: notification.title,
    content: notification.content,
    type: notification.type,
    publishWay: notification.status === 0 ? 'draft' : 'immediate',
    scheduleTime: '',
    targetUsers: targetUsersValue,
    targetUserIds: targetUserIdsValue,
  })
  formDialogVisible.value = true
}

// 提交表单
const handleFormSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  formSubmitting.value = true
  try {
    if (isEditMode.value) {
      // 更新
      const updateData: UpdateNotificationParams = {
        notificationId: notificationForm.notificationId!,
        title: notificationForm.title,
        content: notificationForm.content,
        type: notificationForm.type,
        publishWay: notificationForm.publishWay,
        scheduleTime: notificationForm.scheduleTime || undefined,
        targetUsers: notificationForm.targetUsers,
        targetUserIds: notificationForm.targetUserIds || undefined,
      }
      await updateNotification(updateData)
      ElMessage.success(notificationForm.publishWay === 'draft' ? '保存成功' : '发布成功')
    } else {
      // 创建
      const createData: CreateNotificationParams = {
        title: notificationForm.title,
        content: notificationForm.content,
        type: notificationForm.type,
        publishWay: notificationForm.publishWay,
        scheduleTime: notificationForm.scheduleTime || undefined,
        targetUsers: notificationForm.targetUsers,
        targetUserIds: notificationForm.targetUserIds || undefined,
      }
      await createNotification(createData)
      ElMessage.success(notificationForm.publishWay === 'draft' ? '保存成功' : '发布成功')
    }

    formDialogVisible.value = false
    loadNotificationList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    formSubmitting.value = false
  }
}

// 发布通知
const handlePublish = async (notification: NotificationVO) => {
  try {
    await ElMessageBox.confirm(`确定要发布通知"${notification.title}"吗？`, '确认发布', {
      type: 'warning',
    })

    await publishNotification(notification.notificationId)
    ElMessage.success('发布成功')
    loadNotificationList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布失败:', error)
      ElMessage.error('发布失败')
    }
  }
}

// 删除通知
const handleDelete = async (notification: NotificationVO) => {
  try {
    await ElMessageBox.confirm(`确定要删除通知"${notification.title}"吗？`, '确认删除', {
      type: 'warning',
    })

    await deleteNotification(notification.notificationId)
    ElMessage.success('删除成功')
    loadNotificationList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(notificationForm, {
    notificationId: undefined,
    title: '',
    content: '',
    type: 'system',
    publishWay: 'draft',
    scheduleTime: '',
    targetUsers: 'all',
    targetUserIds: '',
  })
  formRef.value?.resetFields()
}

// 去除HTML标签
const stripHtml = (html: string) => {
  const text = html.replace(/<[^>]*>/g, '')
  return text.length > 100 ? text.substring(0, 100) + '...' : text
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
.notification-manage-container {
  padding: 20px;
}

.toolbar-card {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  .title-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .title-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .content-cell {
    font-size: 14px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.rich-editor-container {
  width: 100%;

  .rich-editor-textarea {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .editor-toolbar {
    margin-top: 8px;
    padding: 8px;
    background-color: #f5f7fa;
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    .hint {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
