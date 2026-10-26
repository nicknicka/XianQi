<template>
  <div class="order-manage-container">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.orderNo"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品标题">
          <el-input
            v-model="searchForm.productTitle"
            placeholder="请输入商品标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待支付" :value="0" />
            <el-option label="待确认" :value="1" />
            <el-option label="已支付" :value="2" />
            <el-option label="已发货" :value="3" />
            <el-option label="已送达" :value="4" />
            <el-option label="进行中" :value="5" />
            <el-option label="已完成" :value="6" />
            <el-option label="已取消" :value="7" />
            <el-option label="退款中" :value="8" />
            <el-option label="已退款" :value="9" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="orderList" stripe>
        <el-table-column label="商品信息" width="280">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                :src="row.productImage || '/placeholder.png'"
                fit="cover"
                class="product-image"
                :preview-src-list="[row.productImage]"
              />
              <div class="product-info">
                <div class="product-title">{{ row.productTitle || '未知商品' }}</div>
                <div class="product-meta">
                  <span class="price">¥{{ row.productPrice || '0' }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="订单金额" width="120">
          <template #default="{ row }">
            <span class="total-amount">¥{{ row.totalAmount || '0' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="买家" width="150">
          <template #default="{ row }">
            <div>{{ row.buyerNickname || '未知' }}</div>
            <div class="text-secondary">{{ row.buyerPhone || '暂无电话' }}</div>
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
            <el-tag v-if="row.status === 0" type="warning">待支付</el-tag>
            <el-tag v-else-if="row.status === 1" type="primary">待确认</el-tag>
            <el-tag v-else-if="row.status === 2" type="success">已支付</el-tag>
            <el-tag v-else-if="row.status === 3" type="info">已发货</el-tag>
            <el-tag v-else-if="row.status === 4" type="info">已送达</el-tag>
            <el-tag v-else-if="row.status === 5" type="primary">进行中</el-tag>
            <el-tag v-else-if="row.status === 6" type="success">已完成</el-tag>
            <el-tag v-else-if="row.status === 7" type="info">已取消</el-tag>
            <el-tag v-else-if="row.status === 8" type="danger">退款中</el-tag>
            <el-tag v-else-if="row.status === 9" type="success">已退款</el-tag>
            <el-tag v-else type="info">{{ row.statusDesc || '未知状态' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">查看</el-button>
            <el-button
              v-if="row.status === 8"
              type="warning"
              size="small"
              @click="processRefund(row)"
            >
              处理退款
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

    <!-- 订单详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentOrder" class="order-detail">
        <!-- 订单信息 -->
        <div class="detail-section">
          <div class="section-title">订单信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号" :span="2">{{ currentOrder.orderNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag v-if="currentOrder.status === 0" type="warning">待支付</el-tag>
              <el-tag v-else-if="currentOrder.status === 1" type="primary">待确认</el-tag>
              <el-tag v-else-if="currentOrder.status === 2" type="success">已支付</el-tag>
              <el-tag v-else-if="currentOrder.status === 3" type="info">已发货</el-tag>
              <el-tag v-else-if="currentOrder.status === 4" type="info">已送达</el-tag>
              <el-tag v-else-if="currentOrder.status === 5" type="primary">进行中</el-tag>
              <el-tag v-else-if="currentOrder.status === 6" type="success">已完成</el-tag>
              <el-tag v-else-if="currentOrder.status === 7" type="info">已取消</el-tag>
              <el-tag v-else-if="currentOrder.status === 8" type="danger">退款中</el-tag>
              <el-tag v-else-if="currentOrder.status === 9" type="success">已退款</el-tag>
              <el-tag v-else type="info">{{ currentOrder.statusDesc || '未知状态' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="商品名称" :span="2">{{ currentOrder.productTitle || '未知商品' }}</el-descriptions-item>
            <el-descriptions-item label="商品价格" :span="2">¥{{ currentOrder.productPrice || '0' }}</el-descriptions-item>
            <el-descriptions-item label="订单总额" :span="2">
              <span class="total-amount-highlight">¥{{ currentOrder.totalAmount || '0' }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 交易双方 -->
        <div class="detail-section">
          <div class="section-title">交易双方</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="party-info">
                <div class="party-label">买家信息</div>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="昵称">{{ currentOrder.buyerNickname || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="联系电话">{{ currentOrder.buyerPhone || '-' }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="party-info">
                <div class="party-label">卖家信息</div>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="昵称">{{ currentOrder.sellerNickname || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="联系电话">{{ currentOrder.sellerPhone || '-' }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 订单备注 -->
        <div v-if="currentOrder.remark" class="detail-section">
          <div class="section-title">订单备注</div>
          <div class="remark-info">{{ currentOrder.remark || '-' }}</div>
        </div>

        <!-- 时间信息 -->
        <div class="detail-section">
          <div class="section-title">时间信息</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="下单时间">{{ formatTime(currentOrder.createTime) }}</el-descriptions-item>
            <el-descriptions-item v-if="currentOrder.updateTime" label="更新时间">{{ formatTime(currentOrder.updateTime) }}</el-descriptions-item>
            <el-descriptions-item v-if="currentOrder.finishTime" label="完成时间">{{ formatTime(currentOrder.finishTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <!-- 退款处理弹窗 -->
    <el-dialog v-model="refundDialogVisible" title="处理退款申请" width="600px">
      <el-alert
        title="退款处理"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <div v-if="pendingRefundOrder">
          <p>订单号：{{ pendingRefundOrder.orderNo || '-' }}</p>
          <p>订单金额：¥{{ pendingRefundOrder.totalAmount || '0' }}</p>
        </div>
      </el-alert>

      <el-form :model="refundForm" label-width="100px">
        <el-form-item label="处理操作">
          <el-radio-group v-model="refundForm.action">
            <el-radio value="approve">同意退款</el-radio>
            <el-radio value="reject">拒绝退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="refundForm.action === 'reject'" label="拒绝原因">
          <el-input
            v-model="refundForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRefund">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getOrderList,
  processRefund as processRefundApi,
  type OrderManageVO,
  type OrderManageQueryParams,
} from '@/api/order'

// 搜索表单
const searchForm = ref({
  orderNo: '',
  productTitle: '',
  status: undefined as number | undefined,
})

// 数据状态
const loading = ref(false)
const orderList = ref<OrderManageVO[]>([])

// 分页
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 详情弹窗
const detailVisible = ref(false)
const currentOrder = ref<OrderManageVO | null>(null)

// 退款处理
const refundDialogVisible = ref(false)
const refundForm = ref({
  action: 'approve' as 'approve' | 'reject',
  reason: '',
})
const pendingRefundOrder = ref<OrderManageVO | null>(null)

// 页面加载
onMounted(() => {
  loadOrderList()
})

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  loadOrderList()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    orderNo: '',
    productTitle: '',
    status: undefined,
  }
  pageNum.value = 1
  loadOrderList()
}

// 加载订单列表
const loadOrderList = async () => {
  loading.value = true
  try {
    const params: OrderManageQueryParams = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderNo: searchForm.value.orderNo || undefined,
      productTitle: searchForm.value.productTitle || undefined,
      status: searchForm.value.status,
      sortBy: 'createTime',
      sortOrder: 'desc',
    }

    const res = await getOrderList(params)

    console.log('✅ [Order List] 加载成功：', {
      records: res.records,
      total: res.total,
      firstOrder: res.records?.[0],
    })

    orderList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('加载订单列表失败:', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pageNum.value = page
  loadOrderList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadOrderList()
}

// 查看详情
const viewDetail = (order: OrderManageVO) => {
  currentOrder.value = order
  detailVisible.value = true
}

// 处理退款
const processRefund = (order: OrderManageVO) => {
  pendingRefundOrder.value = order
  refundForm.value = {
    action: 'approve',
    reason: '',
  }
  refundDialogVisible.value = true
}

// 确认退款处理
const confirmRefund = async () => {
  if (!pendingRefundOrder.value) return

  if (refundForm.value.action === 'reject' && !refundForm.value.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  try {
    await processRefundApi({
      orderId: pendingRefundOrder.value.orderId,
      action: refundForm.value.action,
      reason: refundForm.value.action === 'reject' ? refundForm.value.reason.trim() : undefined,
    })

    ElMessage.success(refundForm.value.action === 'approve' ? '已同意退款' : '已拒绝退款')

    refundDialogVisible.value = false
    pendingRefundOrder.value = null

    // 刷新列表
    loadOrderList()
  } catch (error) {
    console.error('处理退款失败:', error)
    ElMessage.error('处理退款失败')
  }
}

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.order-manage-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
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

        .quantity {
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

  .total-amount {
    font-size: 18px;
    font-weight: bold;
    color: #f56c6c;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

// 订单详情
.order-detail {
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

  .total-amount-highlight {
    font-size: 24px;
    font-weight: bold;
    color: #f56c6c;
  }

  .party-info {
    .party-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 12px;
      font-weight: 500;
    }
  }

  .address-info,
  .remark-info {
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
