<template>
  <div class="category-manage-container">
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建分类</el-button>
      <el-button :icon="Refresh" @click="loadCategoryTree">刷新</el-button>
    </el-card>

    <!-- 分类树表格 -->
    <el-card class="table-card" v-loading="loading">
      <el-table
        :data="categoryTree"
        row-key="categoryId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        border
      >
        <el-table-column prop="name" label="分类名称" width="250">
          <template #default="{ row }">
            <div class="category-name">
              <span v-if="row.icon" class="category-icon">{{ row.icon }}</span>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="分类代码" width="150" />

        <el-table-column prop="sortOrder" label="排序" width="100" />

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="productCount" label="商品数量" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.productCount || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180" />

        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAddChildDialog(row)">
              添加子分类
            </el-button>
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
    </el-card>

    <!-- 创建/编辑分类弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>

        <el-form-item label="分类代码" prop="code">
          <el-input v-model="formData.code" placeholder="如：digital、books" />
          <div class="form-tip">用于前端显示，建议使用英文标识</div>
        </el-form-item>

        <el-form-item label="父级分类" prop="parentId">
          <el-cascader
            v-model="parentIdValue"
            :options="categoryTreeForSelect"
            :props="{
              value: 'categoryId',
              label: 'name',
              children: 'children',
              checkStrictly: true,
              emitPath: false,
            }"
            placeholder="选择父级分类（不选则为顶级分类）"
            clearable
          />
        </el-form-item>

        <el-form-item label="图标（Emoji）" prop="icon">
          <el-input v-model="formData.icon" placeholder="如：💻、📚、👕" />
          <div class="form-tip">支持 Emoji 表情符号</div>
        </el-form-item>

        <el-form-item label="渐变色背景" prop="gradient">
          <el-input
            v-model="formData.gradient"
            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <div class="form-tip">CSS 渐变色代码，用于分类卡片背景</div>
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="1" :max="999" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  type CategoryVO,
  type CategoryCreateParams,
  type CategoryUpdateParams,
} from '@/api/category'

// 数据状态
const categoryTree = ref<CategoryVO[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'addChild'>('create')
const formRef = ref()

// 表单数据
const formData = ref<CategoryCreateParams & { categoryId?: string }>({
  name: '',
  code: '',
  parentId: undefined,
  icon: '',
  gradient: '',
  sortOrder: 1,
  status: 1,
})

const parentIdValue = ref<string>()

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

// 对话框标题
const dialogTitle = computed(() => {
  if (dialogMode.value === 'create') return '新建分类'
  if (dialogMode.value === 'addChild') return '添加子分类'
  return '编辑分类'
})

// 用于选择的分类树（排除自己和子分类）
const categoryTreeForSelect = computed(() => {
  const buildTree = (categories: CategoryVO[], excludeId?: string): CategoryVO[] => {
    return categories
      .filter((cat) => cat.categoryId !== excludeId)
      .map((cat) => ({
        ...cat,
        children: cat.children ? buildTree(cat.children, excludeId) : [],
      }))
  }
  return buildTree(categoryTree.value, formData.value.categoryId)
})

// 加载分类树
const loadCategoryTree = async () => {
  loading.value = true
  try {
    categoryTree.value = await getCategoryTree()
  } catch (error) {
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

// 打开创建对话框
const openCreateDialog = () => {
  dialogMode.value = 'create'
  formData.value = {
    name: '',
    code: '',
    parentId: undefined,
    icon: '',
    gradient: '',
    sortOrder: categoryTree.value.length + 1,
    status: 1,
  }
  parentIdValue.value = undefined
  dialogVisible.value = true
}

// 打开添加子分类对话框
const openAddChildDialog = (row: CategoryVO) => {
  dialogMode.value = 'addChild'
  formData.value = {
    name: '',
    code: '',
    parentId: row.categoryId,
    icon: '',
    gradient: '',
    sortOrder: (row.children?.length || 0) + 1,
    status: 1,
  }
  parentIdValue.value = row.categoryId
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (row: CategoryVO) => {
  dialogMode.value = 'edit'
  formData.value = {
    categoryId: row.categoryId,
    name: row.name,
    code: row.code || '',
    parentId: row.parentId,
    icon: row.icon || '',
    gradient: row.gradient || '',
    sortOrder: row.sortOrder,
    status: row.status,
  }
  // 如果 parentId 是 null/undefined，则表示顶级分类，不显示父级
  parentIdValue.value = row.parentId || undefined
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    // 设置 parentId - 处理清空的情况
    // 如果值被清空（null、undefined、空数组），则设为 0（表示顶级分类）
    const value = parentIdValue.value
    if (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    ) {
      formData.value.parentId = null  // null 表示顶级分类
    } else {
      formData.value.parentId = value
    }

    // 调试日志
    console.log('提交的 parentId:', formData.value.parentId, '类型:', typeof formData.value.parentId)
    console.log('完整的表单数据:', JSON.stringify(formData.value, null, 2))

    if (dialogMode.value === 'edit') {
      await updateCategory(formData.value as CategoryUpdateParams)
      ElMessage.success('更新成功')
    } else {
      await createCategory(formData.value)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    loadCategoryTree()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('操作失败')
    }
  }
}

// 切换状态
const toggleStatus = async (row: CategoryVO) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await updateCategoryStatus(row.categoryId, newStatus)
    ElMessage.success(newStatus === 1 ? '已启用' : '已禁用')
    loadCategoryTree()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除分类
const handleDelete = async (row: CategoryVO) => {
  // 检查是否有子分类
  if (row.children && row.children.length > 0) {
    ElMessage.warning('该分类下还有子分类，无法删除')
    return
  }

  // 检查是否有商品
  if (row.productCount && row.productCount > 0) {
    ElMessage.warning('该分类下还有商品，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    await deleteCategory(row.categoryId)
    ElMessage.success('删除成功')
    loadCategoryTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 页面加载
onMounted(() => {
  loadCategoryTree()
})
</script>

<style scoped lang="scss">
.category-manage-container {
  padding: 20px;

  .toolbar-card {
    margin-bottom: 20px;
  }

  .category-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .category-icon {
      font-size: 20px;
    }
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
}
</style>
