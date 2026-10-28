<template>
  <div class="user-manage-container">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户名/昵称/手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="0" />
            <el-option label="已封禁" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="userList" stripe>
        <el-table-column label="用户" width="280">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="60" :src="row.avatar" />
              <div class="user-info">
                <div class="user-name">{{ row.nickname || row.username }}</div>
                <div class="user-meta">
                  <el-tag v-if="row.isVerified === 1" type="success" size="small">已认证</el-tag>
                  <span class="credit-score">信用分: {{ row.creditScore }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="学院/专业" width="200">
          <template #default="{ row }">
            <div>{{ row.college || '-' }}</div>
            <div class="text-secondary">{{ row.major || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="统计" width="180">
          <template #default="{ row }">
            <div class="stats">
              <span>商品: {{ row.productCount || 0 }}</span>
              <span>订单: {{ row.orderCount || 0 }}</span>
              <span>已售: {{ row.soldCount || 0 }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="success">正常</el-tag>
            <el-tag v-else-if="row.status === 1" type="danger">已封禁</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">查看</el-button>
            <el-button
              :type="row.status === 0 ? 'danger' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 0 ? '封禁' : '解封' }}
            </el-button>
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

    <!-- 用户详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="用户详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="currentUser" class="user-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <div class="section-title">基本信息</div>
          <div class="user-header">
            <el-avatar :size="100" :src="currentUser.avatar" />
            <div class="user-basic-info">
              <h3>{{ currentUser.nickname || currentUser.username }}</h3>
              <div class="user-tags">
                <el-tag v-if="currentUser.isVerified === 1" type="success">已认证</el-tag>
                <el-tag :type="currentUser.status === 0 ? 'success' : 'danger'">
                  {{ currentUser.status === 0 ? '正常' : '已封禁' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="detail-section">
          <div class="section-title">详细信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ currentUser.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ currentUser.studentId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="学院">{{ currentUser.college || '-' }}</el-descriptions-item>
            <el-descriptions-item label="专业">{{ currentUser.major || '-' }}</el-descriptions-item>
            <el-descriptions-item label="信用分">
              <el-tag type="warning">{{ currentUser.creditScore }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ currentUser.createdAt }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 统计数据 -->
        <div class="detail-section">
          <div class="section-title">统计数据</div>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ currentUser.productCount || 0 }}</div>
                <div class="stat-label">发布商品</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ currentUser.orderCount || 0 }}</div>
                <div class="stat-label">订单数量</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ currentUser.soldCount || 0 }}</div>
                <div class="stat-label">已售出</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>

    <!-- 封禁原因输入框 -->
    <el-dialog v-model="banDialogVisible" title="封禁原因" width="500px">
      <el-input
        v-model="banReason"
        type="textarea"
        :rows="4"
        placeholder="请输入封禁原因"
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="banDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBan">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getUserList,
  updateUserStatus,
  type UserManageVO,
  type UserQueryParams,
} from '@/api/user'

// 搜索表单
const searchForm = ref({
  keyword: '',
  status: undefined as number | undefined,
})

// 数据状态
const loading = ref(false)
const userList = ref<UserManageVO[]>([])

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 详情弹窗
const detailVisible = ref(false)
const currentUser = ref<UserManageVO | null>(null)

// 封禁
const banDialogVisible = ref(false)
const banReason = ref('')
const pendingUser = ref<UserManageVO | null>(null)

// 页面加载
onMounted(() => {
  loadUserList()
})

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  loadUserList()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    keyword: '',
    status: undefined,
  }
  pageNum.value = 1
  loadUserList()
}

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  try {
    const params: UserQueryParams = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchForm.value.keyword || undefined,
      status: searchForm.value.status,
    }

    console.log('📋 [User List] 开始加载用户列表，参数：', params)

    const res = await getUserList(params)

    console.log('✅ [User List] 加载成功：', {
      records: res.records,
      total: res.total,
      firstUser: res.records?.[0],
    })

    userList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('❌ [User List] 加载失败：', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pageNum.value = page
  loadUserList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadUserList()
}

// 查看详情
const viewDetail = (user: UserManageVO) => {
  currentUser.value = user
  detailVisible.value = true
}

// 切换用户状态（封禁/解封）
const toggleStatus = async (user: UserManageVO) => {
  const isBanning = user.status === 0 // 当前正常，要封禁

  if (isBanning) {
    // 封禁，需要输入原因
    pendingUser.value = user
    banReason.value = ''
    banDialogVisible.value = true
  } else {
    // 解封
    try {
      await ElMessageBox.confirm(`确定要解封用户"${user.nickname || user.username}"吗？`, '确认解封', {
        type: 'success',
      })
      await doUpdateStatus(user, 0, '')
    } catch {
      // 用户取消
    }
  }
}

// 确认封禁
const confirmBan = async () => {
  if (!banReason.value.trim()) {
    ElMessage.warning('请输入封禁原因')
    return
  }

  if (pendingUser.value) {
    await doUpdateStatus(pendingUser.value, 1, banReason.value.trim())
    banDialogVisible.value = false
    pendingUser.value = null
  }
}

// 更新用户状态
const doUpdateStatus = async (user: UserManageVO, status: number, reason: string) => {
  try {
    await updateUserStatus({
      userId: user.userId,
      status,
      reason,
    })

    ElMessage.success(status === 1 ? '已封禁' : '已解封')

    // 刷新列表
    loadUserList()
  } catch (error) {
    console.error('更新用户状态失败:', error)
    ElMessage.error('操作失败')
  }
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.user-manage-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  .user-cell {
    display: flex;
    gap: 12px;
    align-items: center;

    .user-info {
      flex: 1;

      .user-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
      }

      .user-meta {
        display: flex;
        align-items: center;
        gap: 12px;

        .credit-score {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .text-secondary {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: #606266;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

// 用户详情
.user-detail {
  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 16px;
    }
  }

  .user-header {
    display: flex;
    gap: 20px;
    align-items: center;

    .user-basic-info {
      flex: 1;

      h3 {
        font-size: 20px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 12px;
      }

      .user-tags {
        display: flex;
        gap: 8px;
      }
    }
  }

  .stat-item {
    text-align: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}
</style>
