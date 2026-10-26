<template>
  <div class="product-audit-container">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-radio-group v-model="activeTab" @change="handleTabChange">
        <el-radio-button value="all">
          全部
          <el-badge v-if="statistics.totalCount > 0" :value="statistics.totalCount" class="badge" />
        </el-radio-button>
        <el-radio-button value="pending">
          待审核
          <el-badge v-if="statistics.pendingCount > 0" :value="statistics.pendingCount" class="badge" type="warning" />
        </el-radio-button>
        <el-radio-button value="approved">
          已通过
          <el-badge v-if="statistics.approvedCount > 0" :value="statistics.approvedCount" class="badge" type="success" />
        </el-radio-button>
        <el-radio-button value="rejected">
          已拒绝
          <el-badge v-if="statistics.rejectedCount > 0" :value="statistics.rejectedCount" class="badge" type="danger" />
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="productList" stripe>
        <el-table-column label="商品" width="300">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                :src="row.coverImage || '/placeholder.png'"
                fit="cover"
                class="product-image"
                :preview-src-list="row.images ? [row.coverImage, ...row.images] : [row.coverImage]"
                :initial-index="0"
              />
              <div class="product-info">
                <div class="product-title">{{ row.title || '未命名商品' }}</div>
                <div class="product-meta">
                  <span class="price">¥{{ row.price || '0' }}</span>
                  <span v-if="row.originalPrice" class="original-price">¥{{ row.originalPrice }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ row.categoryName || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="卖家" width="150">
          <template #default="{ row }">
            <div>{{ row.sellerNickname || '未知' }}</div>
            <div class="text-secondary">{{ row.sellerPhone || '暂无电话' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.auditStatus === 0" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.auditStatus === 1" type="success">已通过</el-tag>
            <el-tag v-else-if="row.auditStatus === 2" type="danger">已拒绝</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">查看</el-button>
            <el-button
              v-if="row.auditStatus === 0"
              type="success"
              size="small"
              @click="handleAudit(row, 1)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.auditStatus === 0"
              type="danger"
              size="small"
              @click="handleAudit(row, 2)"
            >
              拒绝
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

    <!-- 商品详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="商品详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="currentProduct" class="product-detail">
        <!-- 商品图片 -->
        <el-carousel :interval="4000" type="card" height="300px" class="image-carousel">
          <el-carousel-item v-for="(image, index) in getAllImages()" :key="index">
            <el-image :src="image" fit="cover" class="carousel-image" />
          </el-carousel-item>
        </el-carousel>

        <!-- 商品信息 -->
        <div class="detail-section">
          <h3>{{ currentProduct.title }}</h3>
          <div class="detail-price">
            <span class="current-price">¥{{ currentProduct.price }}</span>
            <span v-if="currentProduct.originalPrice" class="original-price">
              原价：¥{{ currentProduct.originalPrice }}
            </span>
          </div>
        </div>

        <!-- 商品描述 -->
        <div v-if="currentProduct.description" class="detail-section">
          <div class="section-title">商品描述</div>
          <div class="description">{{ currentProduct.description }}</div>
        </div>

        <!-- 商品属性 -->
        <div class="detail-section">
          <div class="section-title">商品信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="成色">{{ currentProduct.condition || '-' }}/10</el-descriptions-item>
            <el-descriptions-item label="分类">{{ currentProduct.categoryName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="卖家">{{ currentProduct.sellerNickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentProduct.sellerPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="位置" :span="2">{{ currentProduct.location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发布时间" :span="2">{{ formatTime(currentProduct.createTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 审核信息 -->
        <div v-if="currentProduct.auditStatus !== 0" class="detail-section">
          <div class="section-title">审核信息</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="审核状态">
              <el-tag v-if="currentProduct.auditStatus === 1" type="success">已通过</el-tag>
              <el-tag v-else-if="currentProduct.auditStatus === 2" type="danger">已拒绝</el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentProduct.auditRemark" label="拒绝原因">
              {{ currentProduct.auditRemark }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentProduct.auditTime" label="审核时间">
              {{ currentProduct.auditTime }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <template #footer v-if="currentProduct && currentProduct.auditStatus === 0">
        <el-button @click="detailVisible = false">取消</el-button>
        <el-button type="danger" @click="handleAuditFromDialog(2)">拒绝</el-button>
        <el-button type="success" @click="handleAuditFromDialog(1)">通过</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝原因输入框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="500px">
      <el-input
        v-model="auditRemark"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因"
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getProductAuditList,
  getPendingProductList,
  getProductAuditStatistics,
  auditProduct,
  type ProductAuditVO,
  type ProductAuditQueryParams,
} from '@/api/product'

// 数据状态
const loading = ref(false)
const activeTab = ref('pending')
const productList = ref<ProductAuditVO[]>([])

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 统计数据
const statistics = ref({
  totalCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  todayAuditCount: 0,
})

// 详情弹窗
const detailVisible = ref(false)
const currentProduct = ref<ProductAuditVO | null>(null)

// 拒绝原因
const rejectDialogVisible = ref(false)
const auditRemark = ref('')
const pendingAction = ref<{ product: ProductAuditVO; auditStatus: number } | null>(null)

// 页面加载
onMounted(() => {
  loadStatistics()
  loadProductList()
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    const res = await getProductAuditStatistics()
    statistics.value = res
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载商品列表
const loadProductList = async () => {
  loading.value = true
  try {
    const params: ProductAuditQueryParams = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    }

    // 根据标签设置状态
    if (activeTab.value !== 'all') {
      const statusMap: Record<string, number> = {
        pending: 0,
        approved: 1,
        rejected: 2,
      }
      params.auditStatus = statusMap[activeTab.value]
    }

    const res =
      activeTab.value === 'pending'
        ? await getPendingProductList(params)
        : await getProductAuditList(params)

    productList.value = res?.records || []
    total.value = res?.total || 0
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 切换标签
const handleTabChange = () => {
  pageNum.value = 1
  loadProductList()
}

// 分页变化
const handlePageChange = (page: number) => {
  pageNum.value = page
  loadProductList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadProductList()
}

// 查看详情
const viewDetail = (product: ProductAuditVO) => {
  currentProduct.value = product
  detailVisible.value = true
}

// 获取所有图片
const getAllImages = () => {
  if (!currentProduct.value) return []
  const images = currentProduct.value.images || []
  if (currentProduct.value.coverImage && !images.includes(currentProduct.value.coverImage)) {
    return [currentProduct.value.coverImage, ...images]
  }
  return images.length > 0 ? images : [currentProduct.value.coverImage || '/placeholder.png']
}

// 审核商品
const handleAudit = async (product: ProductAuditVO, auditStatus: number) => {
  if (auditStatus === 2) {
    // 拒绝，需要输入原因
    pendingAction.value = { product, auditStatus }
    auditRemark.value = ''
    rejectDialogVisible.value = true
  } else {
    // 通过
    try {
      await ElMessageBox.confirm('确定要通过该商品的审核吗？', '确认通过', {
        type: 'success',
      })
      await doAudit(product, auditStatus, '')
    } catch {
      // 用户取消
    }
  }
}

// 从详情弹窗审核
const handleAuditFromDialog = (auditStatus: number) => {
  if (!currentProduct.value) return
  detailVisible.value = false

  if (auditStatus === 2) {
    pendingAction.value = { product: currentProduct.value, auditStatus }
    auditRemark.value = ''
    rejectDialogVisible.value = true
  } else {
    handleAudit(currentProduct.value, auditStatus)
  }
}

// 确认拒绝
const confirmReject = async () => {
  if (!auditRemark.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  if (pendingAction.value) {
    await doAudit(pendingAction.value.product, pendingAction.value.auditStatus, auditRemark.value.trim())
    rejectDialogVisible.value = false
    pendingAction.value = null
  }
}

// 执行审核
const doAudit = async (product: ProductAuditVO, auditStatus: number, auditRemark: string) => {
  try {
    await auditProduct({
      productId: product.productId,
      auditStatus,
      auditRemark,
    })

    ElMessage.success(auditStatus === 1 ? '审核通过' : '已拒绝')

    // 刷新列表和统计
    loadProductList()
    loadStatistics()
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核失败')
  }
}

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.product-audit-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;

  :deep(.el-radio-group) {
    width: 100%;
    display: flex;
    gap: 12px;

    .el-radio-button {
      flex: 1;

      :deep(.el-radio-button__inner) {
        width: 100%;
      }
    }

    .badge {
      margin-left: 8px;
    }
  }
}

.table-card {
  .product-cell {
    display: flex;
    gap: 12px;

    .product-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .product-title {
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

      .product-meta {
        .price {
          font-size: 18px;
          font-weight: bold;
          color: #f56c6c;
        }

        .original-price {
          font-size: 12px;
          color: #909399;
          text-decoration: line-through;
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

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

// 商品详情
.product-detail {
  .image-carousel {
    margin-bottom: 20px;

    .carousel-image {
      width: 100%;
      height: 100%;
    }
  }

  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    h3 {
      font-size: 20px;
      font-weight: bold;
      color: #303133;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .detail-price {
      .current-price {
        font-size: 28px;
        font-weight: bold;
        color: #f56c6c;
      }

      .original-price {
        font-size: 14px;
        color: #909399;
        margin-left: 12px;
      }
    }

    .description {
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
      white-space: pre-wrap;
    }
  }
}
</style>
