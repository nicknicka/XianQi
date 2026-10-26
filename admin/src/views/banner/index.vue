<template>
  <div class="banner-manage-container">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="标题">
          <el-input
            v-model="searchForm.title"
            placeholder="轮播图标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="链接类型">
          <el-select v-model="searchForm.linkType" placeholder="全部" clearable style="width: 150px">
            <el-option label="无" :value="1" />
            <el-option label="外链" :value="2" />
            <el-option label="商品详情" :value="3" />
            <el-option label="功能页面" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Plus" @click="handleCreate">新建轮播图</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 轮播图列表 -->
    <el-card class="table-card" v-loading="loading">
      <el-table :data="bannerList" stripe>
        <el-table-column label="排序" width="80">
          <template #default="{ row }">
            {{ row.sortOrder }}
          </template>
        </el-table-column>

        <el-table-column label="图片" width="200">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl || '/placeholder.png'"
              fit="contain"
              class="banner-image"
              :preview-src-list="[row.imageUrl]"
            />
          </template>
        </el-table-column>

        <el-table-column prop="title" label="标题" width="200" />

        <el-table-column label="链接类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.linkType === 1" type="info">无</el-tag>
            <el-tag v-else-if="row.linkType === 2" type="primary">外链</el-tag>
            <el-tag v-else-if="row.linkType === 3" type="success">商品详情</el-tag>
            <el-tag v-else-if="row.linkType === 4" type="warning">功能页面</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="链接信息" width="200">
          <template #default="{ row }">
            <div v-if="row.linkType === 2" class="link-info">{{ row.linkUrl || '-' }}</div>
            <div v-else-if="row.linkType === 3" class="link-info">商品ID: {{ row.linkProductId || '-' }}</div>
            <div v-else-if="row.linkType === 4" class="link-info">{{ row.linkPagePath || '-' }}</div>
            <div v-else class="link-info">-</div>
          </template>
        </el-table-column>

        <el-table-column label="展示时间" width="180">
          <template #default="{ row }">
            <div class="time-info">
              <div>{{ formatTime(row.startTime, '开始') }}</div>
              <div>{{ formatTime(row.endTime, '结束') }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">启用</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="点击率" width="100">
          <template #default="{ row }">
            <div class="click-rate">
              <div>{{ row.clickCount || 0 }}次</div>
              <div class="text-secondary">{{ getClickRate(row) }}%</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
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
      :title="isEditMode ? '编辑轮播图' : '新建轮播图'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="bannerForm" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="轮播图标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入轮播图标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="轮播图图片" prop="imageUrl">
          <ImageUpload
            v-model="bannerForm.imageUrl"
            :drag="true"
            :max-size="5"
            @change="handleImageChange"
          />
          <div class="image-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>建议尺寸：1920×600 像素，支持 JPG、PNG、WebP 格式，最大 5MB</span>
          </div>
        </el-form-item>

        <el-form-item label="链接类型" prop="linkType">
          <el-select v-model="bannerForm.linkType" placeholder="请选择链接类型" style="width: 100%">
            <el-option label="无" :value="1" />
            <el-option label="外链" :value="2" />
            <el-option label="商品详情" :value="3" />
            <el-option label="功能页面" :value="4" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="bannerForm.linkType === 2" label="跳转URL" prop="linkUrl">
          <el-input v-model="bannerForm.linkUrl" placeholder="请输入跳转URL" />
        </el-form-item>

        <el-form-item v-if="bannerForm.linkType === 3" label="关联商品ID" prop="linkProductId">
          <el-input-number v-model="bannerForm.linkProductId" :min="1" placeholder="请输入商品ID" style="width: 100%" />
        </el-form-item>

        <el-form-item v-if="bannerForm.linkType === 4" label="功能页面路径" prop="linkPagePath">
          <el-input v-model="bannerForm.linkPagePath" placeholder="请输入功能页面路径，如：pages/product/detail" />
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="bannerForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="bannerForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="开始时间">
          <el-date-picker
            v-model="bannerForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束时间">
          <el-date-picker
            v-model="bannerForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit" :loading="formSubmitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, InfoFilled } from '@element-plus/icons-vue'
import {
  getBannerList,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  type BannerManageVO,
  type BannerManageQueryParams,
  type BannerCreateParams,
  type BannerUpdateParams,
} from '@/api/banner'
import ImageUpload from '@/components/ImageUpload.vue'
import { getThumbnailUrl } from '@/api/upload'

// 搜索表单
const searchForm = ref({
  title: '',
  linkType: undefined as number | undefined,
  status: undefined as number | undefined,
})

// 数据状态
const loading = ref(false)
const bannerList = ref<BannerManageVO[]>([])

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
const bannerForm = reactive<BannerCreateParams & { bannerId?: number }>({
  title: '',
  imageUrl: '',
  imageThumbnailUrl: '',
  linkType: 1,
  linkUrl: '',
  linkProductId: undefined,
  linkPagePath: '',
  sortOrder: 0,
  status: 1,
  startTime: '',
  endTime: '',
})

// 表单验证规则
const formRules: FormRules = {
  title: [{ required: true, message: '请输入轮播图标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请输入图片URL', trigger: 'blur' }],
  linkType: [{ required: true, message: '请选择链接类型', trigger: 'change' }],
  linkUrl: [{ required: true, message: '请输入跳转URL', trigger: 'blur' }],
  linkProductId: [{ required: true, message: '请输入关联商品ID', trigger: 'blur' }],
  linkPagePath: [{ required: true, message: '请输入功能页面路径', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

// 页面加载
onMounted(() => {
  loadBannerList()
})

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  loadBannerList()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    title: '',
    linkType: undefined,
    status: undefined,
  }
  pageNum.value = 1
  loadBannerList()
}

// 加载轮播图列表
const loadBannerList = async () => {
  loading.value = true
  try {
    const params: BannerManageQueryParams = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      title: searchForm.value.title || undefined,
      linkType: searchForm.value.linkType,
      status: searchForm.value.status,
    }

    const res = await getBannerList(params)
    bannerList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('加载轮播图列表失败:', error)
    ElMessage.error('加载轮播图列表失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pageNum.value = page
  loadBannerList()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  loadBannerList()
}

// 创建轮播图
const handleCreate = () => {
  isEditMode.value = false
  resetForm()
  formDialogVisible.value = true
}

// 编辑轮播图
const handleEdit = (banner: BannerManageVO) => {
  isEditMode.value = true
  Object.assign(bannerForm, {
    bannerId: banner.bannerId,
    title: banner.title,
    imageUrl: banner.imageUrl,
    imageThumbnailUrl: banner.imageThumbnailUrl,
    linkType: banner.linkType,
    linkUrl: banner.linkUrl,
    linkProductId: banner.linkProductId,
    linkPagePath: banner.linkPagePath,
    sortOrder: banner.sortOrder,
    status: banner.status,
    startTime: banner.startTime || '',
    endTime: banner.endTime || '',
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
      const updateData: BannerUpdateParams = {
        bannerId: bannerForm.bannerId!,
        title: bannerForm.title,
        imageUrl: bannerForm.imageUrl,
        imageThumbnailUrl: bannerForm.imageThumbnailUrl,
        linkType: bannerForm.linkType,
        linkUrl: bannerForm.linkUrl,
        linkProductId: bannerForm.linkProductId,
        linkPagePath: bannerForm.linkPagePath,
        sortOrder: bannerForm.sortOrder,
        status: bannerForm.status,
        startTime: bannerForm.startTime || undefined,
        endTime: bannerForm.endTime || undefined,
      }
      await updateBanner(updateData)
      ElMessage.success('更新成功')
    } else {
      // 创建
      const createData: BannerCreateParams = {
        title: bannerForm.title,
        imageUrl: bannerForm.imageUrl,
        imageThumbnailUrl: bannerForm.imageThumbnailUrl,
        linkType: bannerForm.linkType,
        linkUrl: bannerForm.linkUrl,
        linkProductId: bannerForm.linkProductId,
        linkPagePath: bannerForm.linkPagePath,
        sortOrder: bannerForm.sortOrder,
        status: bannerForm.status,
        startTime: bannerForm.startTime || undefined,
        endTime: bannerForm.endTime || undefined,
      }
      await createBanner(createData)
      ElMessage.success('创建成功')
    }

    formDialogVisible.value = false
    loadBannerList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    formSubmitting.value = false
  }
}

// 删除轮播图
const handleDelete = async (banner: BannerManageVO) => {
  try {
    await ElMessageBox.confirm(`确定要删除轮播图"${banner.title}"吗？`, '确认删除', {
      type: 'warning',
    })

    await deleteBanner(banner.bannerId)
    ElMessage.success('删除成功')
    loadBannerList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 切换状态
const handleToggleStatus = async (banner: BannerManageVO) => {
  const newStatus = banner.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}轮播图"${banner.title}"吗？`, `确认${action}`, {
      type: newStatus === 1 ? 'success' : 'warning',
    })

    await updateBannerStatus(banner.bannerId, newStatus)
    ElMessage.success(`${action}成功`)
    loadBannerList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(bannerForm, {
    bannerId: undefined,
    title: '',
    imageUrl: '',
    imageThumbnailUrl: '',
    linkType: 1,
    linkUrl: '',
    linkProductId: undefined,
    linkPagePath: '',
    sortOrder: 0,
    status: 1,
    startTime: '',
    endTime: '',
  })
  formRef.value?.resetFields()
}

// 格式化时间
const formatTime = (time: string | null | undefined, label: string) => {
  if (!time) return `${label}: -`
  const date = new Date(time)
  return `${label}: ${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 计算点击率
const getClickRate = (banner: BannerManageVO) => {
  if (!banner.exposureCount || banner.exposureCount === 0) return '0.00'
  return ((banner.clickCount || 0) / banner.exposureCount * 100).toFixed(2)
}

// 图片变化处理（自动生成缩略图）
const handleImageChange = (imageUrl: string) => {
  if (imageUrl) {
    // 使用OSS参数自动生成缩略图
    bannerForm.imageThumbnailUrl = getThumbnailUrl(imageUrl, 400, 400)
  } else {
    bannerForm.imageThumbnailUrl = ''
  }
}
</script>

<style scoped lang="scss">
.banner-manage-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  .banner-image {
    width: 180px;
    height: 80px;
    border-radius: 4px;
    background: #f5f5f5;
  }

  .link-info {
    font-size: 12px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .time-info {
    font-size: 12px;
    color: #606266;

    div {
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .click-rate {
    text-align: center;

    div:first-child {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }

  .text-secondary {
    font-size: 12px;
    color: #909399;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.image-preview {
  margin-top: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.image-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--el-color-info-light-9);
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;

  .el-icon {
    color: var(--el-color-info);
  }
}
</style>
