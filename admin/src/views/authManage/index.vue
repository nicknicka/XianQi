<template>
  <div class="auth-manage-container">
    <!-- 统计卡片 -->
    <el-card class="stats-card" v-loading="statsLoading">
      <template #header>
        <div class="card-header">
          <span>认证统计</span>
          <el-button :icon="Refresh" @click="loadStatistics" :loading="statsRefreshing">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <!-- 实名认证统计 -->
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value stat-primary">{{ statistics.realNamePending || 0 }}</div>
            <div class="stat-label">待审核实名</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value stat-success">{{ statistics.realNameTodayApproved || 0 }}</div>
            <div class="stat-label">今日实名通过</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value stat-warning">{{ statistics.realNameTodayRejected || 0 }}</div>
            <div class="stat-label">今日实名拒绝</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ statistics.realNameTotal || 0 }}</div>
            <div class="stat-label">实名认证总数</div>
          </div>
        </el-col>
        <!-- 学号认证统计 -->
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value stat-primary">{{ statistics.studentPending || 0 }}</div>
            <div class="stat-label">待审核学号</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value stat-success">{{ statistics.studentTodayApproved || 0 }}</div>
            <div class="stat-label">今日学号通过</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value stat-warning">{{ statistics.studentTodayRejected || 0 }}</div>
            <div class="stat-label">今日学号拒绝</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ statistics.studentTotal || 0 }}</div>
            <div class="stat-label">学号认证总数</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 认证管理标签页 -->
    <el-card class="table-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 实名认证标签 -->
        <el-tab-pane label="实名认证" name="realName">
          <!-- 筛选条件 -->
          <el-form :inline="true" :model="realNameSearchForm" @submit.prevent="handleRealNameSearch" class="search-form">
            <el-form-item label="状态">
              <el-select v-model="realNameSearchForm.status" placeholder="全部" clearable style="width: 150px">
                <el-option label="未认证" :value="0" />
                <el-option label="审核中" :value="1" />
                <el-option label="已认证" :value="2" />
                <el-option label="认证失败" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input
                v-model="realNameSearchForm.keyword"
                placeholder="姓名/身份证号"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleRealNameSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleRealNameReset">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 实名认证列表 -->
          <el-table :data="realNameList" v-loading="realNameLoading" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="用户信息" width="200">
              <template #default="{ row }">
                <div>{{ row.nickname || '-' }}</div>
                <div class="text-secondary">{{ row.username || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="真实姓名" width="120">
              <template #default="{ row }">
                {{ row.realName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="身份证号" width="180">
              <template #default="{ row }">
                {{ row.idCard || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 0" type="info">未认证</el-tag>
                <el-tag v-else-if="row.status === 1" type="warning">审核中</el-tag>
                <el-tag v-else-if="row.status === 2" type="success">已认证</el-tag>
                <el-tag v-else-if="row.status === 3" type="danger">认证失败</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="提交时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewRealNameDetail(row)">查看</el-button>
                <el-button
                  v-if="row.status === 1"
                  type="success"
                  size="small"
                  @click="handleAudit(row, 'approve', 'realName')"
                >
                  通过
                </el-button>
                <el-button
                  v-if="row.status === 1"
                  type="danger"
                  size="small"
                  @click="handleAudit(row, 'reject', 'realName')"
                >
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="realNamePageNum"
              v-model:page-size="realNamePageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="realNameTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleRealNameSizeChange"
              @current-change="handleRealNamePageChange"
            />
          </div>
        </el-tab-pane>

        <!-- 学号认证标签 -->
        <el-tab-pane label="学号认证" name="student">
          <!-- 筛选条件 -->
          <el-form :inline="true" :model="studentSearchForm" @submit.prevent="handleStudentSearch" class="search-form">
            <el-form-item label="状态">
              <el-select v-model="studentSearchForm.status" placeholder="全部" clearable style="width: 150px">
                <el-option label="未认证" :value="0" />
                <el-option label="审核中" :value="1" />
                <el-option label="已认证" :value="2" />
                <el-option label="认证失败" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input
                v-model="studentSearchForm.keyword"
                placeholder="姓名/学号"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleStudentSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleStudentReset">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 学号认证列表 -->
          <el-table :data="studentList" v-loading="studentLoading" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="用户信息" width="200">
              <template #default="{ row }">
                <div>{{ row.nickname || '-' }}</div>
                <div class="text-secondary">{{ row.username || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="真实姓名" width="120">
              <template #default="{ row }">
                {{ row.realName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="学号" width="150">
              <template #default="{ row }">
                {{ row.studentId || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="学院专业" width="200">
              <template #default="{ row }">
                <div>{{ row.college || '-' }}</div>
                <div class="text-secondary">{{ row.major || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 0" type="info">未认证</el-tag>
                <el-tag v-else-if="row.status === 1" type="warning">审核中</el-tag>
                <el-tag v-else-if="row.status === 2" type="success">已认证</el-tag>
                <el-tag v-else-if="row.status === 3" type="danger">认证失败</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="提交时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewStudentDetail(row)">查看</el-button>
                <el-button
                  v-if="row.status === 1"
                  type="success"
                  size="small"
                  @click="handleAudit(row, 'approve', 'student')"
                >
                  通过
                </el-button>
                <el-button
                  v-if="row.status === 1"
                  type="danger"
                  size="small"
                  @click="handleAudit(row, 'reject', 'student')"
                >
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="studentPageNum"
              v-model:page-size="studentPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="studentTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleStudentSizeChange"
              @current-change="handleStudentPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 实名认证详情弹窗 -->
    <el-dialog
      v-model="realNameDetailVisible"
      title="实名认证详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="currentRealNameAuth" class="auth-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="认证ID">{{ currentRealNameAuth.id }}</el-descriptions-item>
          <el-descriptions-item label="用户昵称">{{ currentRealNameAuth.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentRealNameAuth.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ currentRealNameAuth.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号" :span="2">{{ currentRealNameAuth.idCard || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核状态" :span="2">
            <el-tag v-if="currentRealNameAuth.status === 0" type="info">未认证</el-tag>
            <el-tag v-else-if="currentRealNameAuth.status === 1" type="warning">审核中</el-tag>
            <el-tag v-else-if="currentRealNameAuth.status === 2" type="success">已认证</el-tag>
            <el-tag v-else-if="currentRealNameAuth.status === 3" type="danger">认证失败</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRealNameAuth.rejectReason" label="拒绝原因" :span="2">
            {{ currentRealNameAuth.rejectReason }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentRealNameAuth.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ currentRealNameAuth.auditedAt || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 学号认证详情弹窗 -->
    <el-dialog
      v-model="studentDetailVisible"
      title="学号认证详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="currentStudentAuth" class="auth-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="认证ID">{{ currentStudentAuth.id }}</el-descriptions-item>
          <el-descriptions-item label="用户昵称">{{ currentStudentAuth.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentStudentAuth.username || '-' }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ currentStudentAuth.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentStudentAuth.studentId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="入学年份">{{ currentStudentAuth.enrollmentYear || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ currentStudentAuth.college || '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ currentStudentAuth.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核状态" :span="2">
            <el-tag v-if="currentStudentAuth.status === 0" type="info">未认证</el-tag>
            <el-tag v-else-if="currentStudentAuth.status === 1" type="warning">审核中</el-tag>
            <el-tag v-else-if="currentStudentAuth.status === 2" type="success">已认证</el-tag>
            <el-tag v-else-if="currentStudentAuth.status === 3" type="danger">认证失败</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentStudentAuth.studentCardImages && currentStudentAuth.studentCardImages.length > 0" label="学生证照片" :span="2">
            <el-image
              v-for="(img, index) in currentStudentAuth.studentCardImages"
              :key="index"
              :src="img"
              fit="contain"
              style="max-width: 300px; max-height: 200px; margin-right: 10px"
              :preview-src-list="currentStudentAuth.studentCardImages"
            />
          </el-descriptions-item>
          <el-descriptions-item v-if="currentStudentAuth.rejectReason" label="拒绝原因" :span="2">
            {{ currentStudentAuth.rejectReason }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentStudentAuth.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ currentStudentAuth.auditedAt || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 拒绝理由弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝认证" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="拒绝理由">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝理由"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确定拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getRealNameList,
  getStudentList,
  auditRealName,
  auditStudent,
  getAuthStatistics,
  type RealNameAuthVO,
  type StudentAuthVO,
  type RealNameQueryParams,
  type StudentQueryParams,
  type AuthStatistics,
} from '@/api/authManage'

// 当前标签页
const activeTab = ref<'realName' | 'student'>('realName')

// 统计信息
const statsLoading = ref(false)
const statsRefreshing = ref(false)
const statistics = ref<AuthStatistics>({
  realNameTotal: 0,
  realNamePending: 0,
  realNameApproved: 0,
  realNameRejected: 0,
  realNameTodayApproved: 0,
  realNameTodayRejected: 0,
  studentTotal: 0,
  studentPending: 0,
  studentApproved: 0,
  studentRejected: 0,
  studentTodayApproved: 0,
  studentTodayRejected: 0,
})

// 实名认证数据
const realNameLoading = ref(false)
const realNameList = ref<RealNameAuthVO[]>([])
const realNamePageNum = ref(1)
const realNamePageSize = ref(20)
const realNameTotal = ref(0)
const realNameSearchForm = ref({
  status: undefined as number | undefined,
  keyword: '',
})

// 学号认证数据
const studentLoading = ref(false)
const studentList = ref<StudentAuthVO[]>([])
const studentPageNum = ref(1)
const studentPageSize = ref(20)
const studentTotal = ref(0)
const studentSearchForm = ref({
  status: undefined as number | undefined,
  keyword: '',
})

// 详情弹窗
const realNameDetailVisible = ref(false)
const currentRealNameAuth = ref<RealNameAuthVO | null>(null)
const studentDetailVisible = ref(false)
const currentStudentAuth = ref<StudentAuthVO | null>(null)

// 拒绝弹窗
const rejectDialogVisible = ref(false)
const rejectForm = ref({
  authId: '',
  authType: 'realName' as 'realName' | 'student',
  rejectReason: '',
})

// 页面加载
onMounted(() => {
  loadStatistics()
  loadRealNameList()
})

// 加载统计信息
const loadStatistics = async () => {
  if (statsRefreshing.value) {
    statsRefreshing.value = true
  } else {
    statsLoading.value = true
  }
  try {
    const res = await getAuthStatistics()
    statistics.value = res || statistics.value
  } catch (error) {
    console.error('加载统计信息失败:', error)
  } finally {
    statsLoading.value = false
    statsRefreshing.value = false
  }
}

// 标签页切换
const handleTabChange = (tabName: string | number) => {
  const name = String(tabName)
  if (name === 'realName' && realNameList.value.length === 0) {
    loadRealNameList()
  } else if (name === 'student' && studentList.value.length === 0) {
    loadStudentList()
  }
}

// ==================== 实名认证相关方法 ====================

// 加载实名认证列表
const loadRealNameList = async () => {
  realNameLoading.value = true
  try {
    const params: RealNameQueryParams = {
      pageNum: realNamePageNum.value,
      pageSize: realNamePageSize.value,
      status: realNameSearchForm.value.status,
      keyword: realNameSearchForm.value.keyword || undefined,
    }
    const res = await getRealNameList(params)
    realNameList.value = res?.records || []
    realNameTotal.value = res?.total || 0
  } catch (error) {
    console.error('加载实名认证列表失败:', error)
    ElMessage.error('加载实名认证列表失败')
  } finally {
    realNameLoading.value = false
  }
}

// 实名认证搜索
const handleRealNameSearch = () => {
  realNamePageNum.value = 1
  loadRealNameList()
}

// 实名认证重置
const handleRealNameReset = () => {
  realNameSearchForm.value = {
    status: undefined,
    keyword: '',
  }
  realNamePageNum.value = 1
  loadRealNameList()
}

// 实名认证分页
const handleRealNamePageChange = (page: number) => {
  realNamePageNum.value = page
  loadRealNameList()
}

const handleRealNameSizeChange = (size: number) => {
  realNamePageSize.value = size
  realNamePageNum.value = 1
  loadRealNameList()
}

// 查看实名认证详情
const viewRealNameDetail = (auth: RealNameAuthVO) => {
  currentRealNameAuth.value = auth
  realNameDetailVisible.value = true
}

// ==================== 学号认证相关方法 ====================

// 加载学号认证列表
const loadStudentList = async () => {
  studentLoading.value = true
  try {
    const params: StudentQueryParams = {
      pageNum: studentPageNum.value,
      pageSize: studentPageSize.value,
      status: studentSearchForm.value.status,
      keyword: studentSearchForm.value.keyword || undefined,
    }
    const res = await getStudentList(params)
    studentList.value = res?.records || []
    studentTotal.value = res?.total || 0
  } catch (error) {
    console.error('加载学号认证列表失败:', error)
    ElMessage.error('加载学号认证列表失败')
  } finally {
    studentLoading.value = false
  }
}

// 学号认证搜索
const handleStudentSearch = () => {
  studentPageNum.value = 1
  loadStudentList()
}

// 学号认证重置
const handleStudentReset = () => {
  studentSearchForm.value = {
    status: undefined,
    keyword: '',
  }
  studentPageNum.value = 1
  loadStudentList()
}

// 学号认证分页
const handleStudentPageChange = (page: number) => {
  studentPageNum.value = page
  loadStudentList()
}

const handleStudentSizeChange = (size: number) => {
  studentPageSize.value = size
  studentPageNum.value = 1
  loadStudentList()
}

// 查看学号认证详情
const viewStudentDetail = (auth: StudentAuthVO) => {
  currentStudentAuth.value = auth
  studentDetailVisible.value = true
}

// ==================== 审核相关方法 ====================

// 处理审核
const handleAudit = async (
  auth: RealNameAuthVO | StudentAuthVO,
  action: 'approve' | 'reject',
  authType: 'realName' | 'student'
) => {
  if (action === 'approve') {
    try {
      await ElMessageBox.confirm('确定通过该认证吗？', '确认通过', {
        type: 'success',
      })

      const api = authType === 'realName' ? auditRealName : auditStudent
      await api({ authId: auth.id, action: 'approve' })
      ElMessage.success('已通过')

      // 刷新列表和统计
      if (authType === 'realName') {
        loadRealNameList()
      } else {
        loadStudentList()
      }
      loadStatistics()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('审核失败:', error)
        ElMessage.error('操作失败')
      }
    }
  } else {
    // 拒绝认证，显示拒绝理由弹窗
    rejectForm.value = {
      authId: auth.id,
      authType,
      rejectReason: '',
    }
    rejectDialogVisible.value = true
  }
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectForm.value.rejectReason) {
    ElMessage.warning('请输入拒绝理由')
    return
  }

  try {
    const api = rejectForm.value.authType === 'realName' ? auditRealName : auditStudent
    await api({
      authId: rejectForm.value.authId,
      action: 'reject',
      rejectReason: rejectForm.value.rejectReason,
    })
    ElMessage.success('已拒绝')

    rejectDialogVisible.value = false

    // 刷新列表和统计
    if (rejectForm.value.authType === 'realName') {
      loadRealNameList()
    } else {
      loadStudentList()
    }
    loadStatistics()
  } catch (error) {
    console.error('拒绝失败:', error)
    ElMessage.error('操作失败')
  }
}

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.auth-manage-container {
  padding: 20px;
}

.stats-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-item {
    text-align: center;
    padding: 12px 0;

    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 6px;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      line-height: 1.2;
    }

    .stat-value.stat-primary {
      color: #409eff;
    }

    .stat-value.stat-success {
      color: #67c23a;
    }

    .stat-value.stat-warning {
      color: #e6a23c;
    }

    .stat-value.stat-danger {
      color: #f56c6c;
    }
  }
}

.table-card {
  .search-form {
    margin-bottom: 20px;
  }

  .text-secondary {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .image-preview-group {
    display: flex;
    gap: 8px;

    .id-card-image {
      width: 60px;
      height: 40px;
      border-radius: 4px;
      cursor: pointer;
    }
  }

  .student-card-image {
    width: 80px;
    height: 60px;
    border-radius: 4px;
    cursor: pointer;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.auth-detail {
  .el-descriptions {
    margin-bottom: 20px;
  }
}
</style>
