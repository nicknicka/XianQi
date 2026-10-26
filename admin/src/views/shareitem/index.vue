<template>
  <div class="shareitem-manage-container">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.title"
            placeholder="物品标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="可借用" :value="1" />
            <el-option label="借用中" :value="2" />
            <el-option label="下架" :value="0" />
            <el-option label="草稿" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-card class="stats-card" v-loading="statsLoading">
      <template #header>
        <div class="card-header">
          <span>统计信息</span>
          <el-button :icon="Refresh" @click="loadStatistics" :loading="statsRefreshing">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalItems || 0 }}</div>
            <div class="stat-label">总物品数</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value stat-success">{{ statistics.availableItems || 0 }}</div>
            <div class="stat-label">可借用</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value stat-warning">{{ statistics.borrowedItems || 0 }}</div>
            <div class="stat-label">借用中</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-value stat-danger">{{ statistics.offlineItems || 0 }}</div>
            <div class="stat-label">已下架</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 共享物品列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="shareItemList" stripe>
        <el-table-column label="物品信息" width="320">
          <template #default="{ row }">
            <div class="item-cell">
              <el-image
                :src="row.coverImageUrl || '/placeholder.png'"
                fit="cover"
                class="item-image"
                :preview-src-list="[row.coverImageUrl]"
              />
              <div class="item-info">
                <div class="item-title">{{ row.title }}</div>
                <div class="item-meta">
                  <span class="price">¥{{ row.dailyRent }}/天</span>
                  <span class="deposit">押金¥{{ row.deposit }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="categoryName" label="分类" width="120" />

        <el-table-column label="所有者" width="150">
          <template #default="{ row }">
            <div>{{ row.ownerNickname || '未知' }}</div>
            <div class="text-secondary">{{ row.ownerPhone || '暂无电话' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="借用统计" width="120">
          <template #default="{ row }">
            <div class="borrow-stats">
              <span>总: {{ row.borrowCount || 0 }}</span>
              <span class="text-secondary">当前: {{ row.currentBorrowCount || 0 }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="info">下架</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">可借用</el-tag>
            <el-tag v-else-if="row.status === 2" type="warning">借用中</el-tag>
            <el-tag v-else-if="row.status === 4" type="info">草稿</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">查看</el-button>
            <el-button
              v-if="row.status === 0 || row.status === 4"
              type="success"
              size="small"
              @click="handleStatusChange(row, 1)"
            >
              上架
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              size="small"
              @click="handleStatusChange(row, 0)"
            >
              下架
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

    <!-- 物品详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="共享物品详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentItem" class="item-detail">
        <!-- 物品图片 -->
        <div class="detail-section">
          <div class="section-title">物品图片</div>
          <el-image
            :src="currentItem.coverImageUrl || '/placeholder.png'"
            fit="contain"
            class="detail-image"
            :preview-src-list="[currentItem.coverImageUrl]"
          />
        </div>

        <!-- 物品信息 -->
        <div class="detail-section">
          <div class="section-title">物品信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物品名称" :span="2">{{ currentItem.title }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ currentItem.categoryName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag v-if="currentItem.status === 0" type="info">下架</el-tag>
              <el-tag v-else-if="currentItem.status === 1" type="success">可借用</el-tag>
              <el-tag v-else-if="currentItem.status === 2" type="warning">借用中</el-tag>
              <el-tag v-else-if="currentItem.status === 4" type="info">草稿</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="日租金">
              <span class="price-highlight">¥{{ currentItem.dailyRent }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="押金">
              <span class="price-highlight">¥{{ currentItem.deposit }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="借用次数" :span="2">{{ currentItem.borrowCount || 0 }}次</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 物品描述 -->
        <div v-if="currentItem.description" class="detail-section">
          <div class="section-title">物品描述</div>
          <div class="description">{{ currentItem.description }}</div>
        </div>

        <!-- 所有者信息 -->
        <div class="detail-section">
          <div class="section-title">所有者信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="昵称">{{ currentItem.ownerNickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentItem.ownerPhone || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 时间信息 -->
        <div class="detail-section">
          <div class="section-title">时间信息</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="创建时间">{{ currentItem.createTime }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ currentItem.updateTime }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <!-- 状态修改弹窗 -->
    <el-dialog v-model="statusDialogVisible" :title="statusDialogTitle" width="500px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="操作">
          <el-tag v-if="statusForm.status === 1" type="success">上架</el-tag>
          <el-tag v-else-if="statusForm.status === 0" type="info">下架</el-tag>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="statusForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStatusChange">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getShareItemList,
  getShareItemStatistics,
  updateShareItemStatus,
  type ShareItemManageVO,
  type ShareItemManageQueryParams,
  type ShareItemManageStatistics,
} from '@/api/shareItem'

// 搜索表单
const searchForm = ref({
  title: '',
  status: undefined as number | undefined,
})

// 数据状态
const loading = ref(false)
const shareItemList = ref<ShareItemManageVO[]>([])

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 统计信息
const statsLoading = ref(false)
const statsRefreshing = ref(false)
const statistics = ref<ShareItemManageStatistics>({
  totalItems: 0,
  availableItems: 0,
  borrowedItems: 0,
  offlineItems: 0,
  todayNewItems: 0,
  weekNewItems: 0,
  monthNewItems: 0,
  totalBorrows: 0,
  totalDepositAmount: 0,
  totalRentIncome: 0,
})

// 详情弹窗
const detailVisible = ref(false)
const currentItem = ref<ShareItemManageVO | null>(null)

// 状态修改
const statusDialogVisible = ref(false)
const statusForm = ref({
  shareId: '',
  status: 0,
  remark: '',
})
const statusDialogTitle = computed(() => {
  return statusForm.value.status === 1 ? '上架物品' : '下架物品'
})

// 页面加载
onMounted(() => {
  loadStatistics()
  loadShareItemList()
})

// 加载统计信息
const loadStatistics = async () => {
  if (statsRefreshing.value) {
    statsRefreshing.value = true
  } else {
    statsLoading.value = true
  }
  try {
    const res = await getShareItemStatistics()
    statistics.value = res
  } catch (error) {
    console.error('加载统计信息失败:', error)
  } finally {
    statsLoading.value = false
    statsRefreshing.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  loadShareItemList()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    title: '',
    status: undefined,
  }
  pageNum.value = 1
  loadShareItemList()
}

// 加载共享物品列表
const loadShareItemList = async () => {
  loading.value = true
  try {
    const params: ShareItemManageQueryParams = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      title: searchForm.value.title || undefined,
      status: searchForm.value.status,
    }

    const res = await getShareItemList(params)
    shareItemList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('加载共享物品列表失败:', error)
    ElMessage.error('加载共享物品列表失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pageNum.value = page
  loadShareItemList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadShareItemList()
}

// 查看详情
const viewDetail = (item: ShareItemManageVO) => {
  currentItem.value = item
  detailVisible.value = true
}

// 状态修改
const handleStatusChange = (item: ShareItemManageVO, status: number) => {
  statusForm.value = {
    shareId: item.shareId,
    status,
    remark: '',
  }
  statusDialogVisible.value = true
}

// 确认状态修改
const confirmStatusChange = async () => {
  try {
    await updateShareItemStatus({
      shareId: statusForm.value.shareId,
      status: statusForm.value.status,
      remark: statusForm.value.remark || undefined,
    })

    ElMessage.success(statusForm.value.status === 1 ? '已上架' : '已下架')

    statusDialogVisible.value = false

    // 刷新列表和统计
    loadShareItemList()
    loadStatistics()
  } catch (error) {
    console.error('修改状态失败:', error)
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
.shareitem-manage-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
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
    padding: 20px 0;

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
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
  .item-cell {
    display: flex;
    gap: 12px;

    .item-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .item-title {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.4;
      }

      .item-meta {
        .price {
          font-size: 16px;
          font-weight: bold;
          color: #f56c6c;
        }

        .deposit {
          font-size: 12px;
          color: #909399;
          margin-left: 8px;
        }
      }
    }
  }

  .text-secondary {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .borrow-stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: #606266;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

// 物品详情
.item-detail {
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

  .detail-image {
    width: 100%;
    max-height: 400px;
    border-radius: 8px;
  }

  .price-highlight {
    font-size: 18px;
    font-weight: bold;
    color: #f56c6c;
  }

  .description {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 14px;
    color: #303133;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}
</style>
