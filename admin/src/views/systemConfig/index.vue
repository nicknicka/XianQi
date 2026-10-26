<template>
  <div class="system-config-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统配置管理</span>
          <div>
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新增配置
            </el-button>
            <el-button type="success" @click="handleSaveAll">
              <el-icon><Select /></el-icon>
              保存所有更改
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索配置键或说明"
          clearable
          style="width: 300px; margin-right: 10px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filterGroupName"
          placeholder="选择分组"
          clearable
          style="width: 200px; margin-right: 10px"
          @change="loadConfigs"
        >
          <el-option label="全部" value="" />
          <el-option label="基础配置" value="basic" />
          <el-option label="上传配置" value="upload" />
          <el-option label="支付配置" value="payment" />
          <el-option label="邮件配置" value="email" />
          <el-option label="短信配置" value="sms" />
          <el-option label="安全配置" value="security" />
          <el-option label="业务配置" value="business" />
          <el-option label="内容审核" value="content" />
          <el-option label="其他配置" value="other" />
        </el-select>
        <el-select
          v-model="filterConfigType"
          placeholder="配置类型"
          clearable
          style="width: 150px"
          @change="loadConfigs"
        >
          <el-option label="全部" value="" />
          <el-option label="字符串" value="string" />
          <el-option label="数字" value="number" />
          <el-option label="布尔" value="boolean" />
          <el-option label="JSON" value="json" />
        </el-select>
      </div>

      <!-- 配置列表表格 -->
      <el-table
        :data="filteredConfigs"
        border
        stripe
        style="margin-top: 20px"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="configKey" label="配置键" width="200" fixed="left" />
        <el-table-column prop="description" label="说明" width="200" />
        <el-table-column prop="groupName" label="分组" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getGroupNameLabel(row.groupName) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="configType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.configType)" size="small">
              {{ row.configType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="configValue" label="配置值" min-width="200">
          <template #default="{ row }">
            <div v-if="row.isEditing">
              <!-- 根据类型显示不同的编辑控件 -->
              <el-input-number
                v-if="row.configType === 'number'"
                v-model="row.tempValue"
                :min="getMinValue(row)"
                :max="getMaxValue(row)"
                style="width: 100%"
              />
              <el-switch
                v-else-if="row.configType === 'boolean'"
                v-model="row.tempValue"
                active-text="是"
                inactive-text="否"
              />
              <el-input
                v-else-if="row.configType === 'json'"
                v-model="row.tempValue"
                type="textarea"
                :rows="3"
                placeholder="请输入JSON格式数据"
              />
              <el-input
                v-else
                v-model="row.tempValue"
                placeholder="请输入配置值"
              />
            </div>
            <div v-else class="config-value">
              <span v-if="row.configType === 'boolean'" class="value-badge">
                <el-tag :type="row.configValue === 'true' ? 'success' : 'info'" size="small">
                  {{ row.configValue === 'true' ? '是' : '否' }}
                </el-tag>
              </span>
              <span v-else class="value-text">{{ row.configValue }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="isPublic" label="公开" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isPublic ? 'success' : 'info'" size="small">
              {{ row.isPublic ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isSystem" label="系统" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isSystem ? 'warning' : 'info'" size="small">
              {{ row.isSystem ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div v-if="row.isEditing">
              <el-button type="success" size="small" @click="handleConfirmEdit(row)">
                确认
              </el-button>
              <el-button size="small" @click="handleCancelEdit(row)">
                取消
              </el-button>
            </div>
            <div v-else>
              <el-button type="primary" size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                :disabled="!!row.isSystem"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑配置' : '新增配置'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="配置键" prop="configKey">
          <el-input
            v-model="formData.configKey"
            placeholder="请输入配置键（英文，如：appVersion）"
            :disabled="isEditMode"
          />
        </el-form-item>
        <el-form-item label="配置值" prop="configValue">
          <el-input
            v-if="formData.configType === 'string'"
            v-model="formData.configValue"
            placeholder="请输入配置值"
          />
          <el-input-number
            v-else-if="formData.configType === 'number'"
            v-model="formData.configValue"
            :min="1"
            :max="999999"
            style="width: 100%"
          />
          <el-switch
            v-else-if="formData.configType === 'boolean'"
            v-model="formData.configValue"
            active-text="是"
            inactive-text="否"
          />
          <el-input
            v-else-if="formData.configType === 'json'"
            v-model="formData.configValue"
            type="textarea"
            :rows="4"
            placeholder="请输入JSON格式数据"
          />
          <el-input
            v-else
            v-model="formData.configValue"
            placeholder="请先选择配置类型"
          />
        </el-form-item>
        <el-form-item label="配置类型" prop="configType">
          <el-select v-model="formData.configType" placeholder="请选择配置类型" style="width: 100%">
            <el-option label="字符串 (string)" value="string" />
            <el-option label="数字 (number)" value="number" />
            <el-option label="布尔 (boolean)" value="boolean" />
            <el-option label="JSON (json)" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="分组名称" prop="groupName">
          <el-select v-model="formData.groupName" placeholder="请选择分组" style="width: 100%">
            <el-option label="基础配置" value="basic" />
            <el-option label="上传配置" value="upload" />
            <el-option label="支付配置" value="payment" />
            <el-option label="邮件配置" value="email" />
            <el-option label="短信配置" value="sms" />
            <el-option label="安全配置" value="security" />
            <el-option label="业务配置" value="business" />
            <el-option label="内容审核" value="content" />
            <el-option label="其他配置" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入配置说明"
          />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="formData.isPublic" active-text="是" inactive-text="否" />
          <span class="form-tip">公开的配置可以被前端访问</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Select, Search } from '@element-plus/icons-vue'
import {
  getConfigList,
  batchUpdateConfig,
  type SystemConfig,
  type SystemConfigWithEdit,
} from '@/api/systemConfig'
import request from '@/utils/request'

const searchKeyword = ref('')
const filterGroupName = ref('')
const filterConfigType = ref('')
const configs = ref<SystemConfigWithEdit[]>([])
const dialogVisible = ref(false)
const isEditMode = ref(false)
const formRef = ref<FormInstance>()

const formData = ref({
  configId: 0,
  configKey: '',
  configValue: '',
  configType: 'string',
  groupName: 'basic',
  description: '',
  isPublic: false,
  sortOrder: 0,
})

const formRules: FormRules = {
  configKey: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  configType: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
  groupName: [{ required: true, message: '请选择分组', trigger: 'change' }],
  description: [{ required: true, message: '请输入配置说明', trigger: 'blur' }],
}

// 过滤后的配置列表
const filteredConfigs = computed(() => {
  let result = configs.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (config) =>
        config.configKey.toLowerCase().includes(keyword) ||
        (config.description && config.description.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 加载配置列表
const loadConfigs = async () => {
  try {
    const data = await getConfigList(filterGroupName.value)
    configs.value = data.map((config) => ({
      ...config,
      isEditing: false,
      tempValue: convertValue(config.configValue, config.configType),
    }))

    // 如果有类型筛选，在前端进行过滤
    if (filterConfigType.value) {
      configs.value = configs.value.filter(
        (config) => config.configType === filterConfigType.value
      )
    }
  } catch (error) {
    ElMessage.error('加载配置失败')
    console.error(error)
  }
}

// 根据配置类型转换值
const convertValue = (value: string, type: string): any => {
  if (type === 'number') {
    return Number(value)
  } else if (type === 'boolean') {
    return value === 'true'
  } else if (type === 'json') {
    return value
  }
  return value
}

// 获取分组名称标签
const getGroupNameLabel = (groupName: string): string => {
  const labels: Record<string, string> = {
    basic: '基础配置',
    upload: '上传配置',
    payment: '支付配置',
    email: '邮件配置',
    sms: '短信配置',
    security: '安全配置',
    business: '业务配置',
    content: '内容审核',
    other: '其他配置',
  }
  return labels[groupName] || groupName
}

const matchesConfigKey = (rowKey: string, ...keys: string[]): boolean => {
  return keys.includes(rowKey)
}

// 获取类型标签颜色
const getTypeTagType = (type: string): string | undefined => {
  const types: Record<string, string> = {
    string: 'info',
    number: 'success',
    boolean: 'warning',
    json: 'danger',
  }
  return types[type]
}

// 获取最小值
const getMinValue = (row: SystemConfigWithEdit): number => {
  if (matchesConfigKey(row.configKey, 'passwordMinLength', 'password_min_length')) return 6
  if (matchesConfigKey(row.configKey, 'productMaxImages', 'product_max_images')) return 1
  if (matchesConfigKey(row.configKey, 'maxUploadSize', 'upload_max_size')) return 1
  return 0
}

// 获取最大值
const getMaxValue = (row: SystemConfigWithEdit): number => {
  if (matchesConfigKey(row.configKey, 'passwordMinLength', 'password_min_length')) return 20
  if (matchesConfigKey(row.configKey, 'productMaxImages', 'product_max_images')) return 20
  if (matchesConfigKey(row.configKey, 'maxUploadSize', 'upload_max_size')) return 100
  return 999999
}

// 搜索
const handleSearch = () => {
  // 搜索逻辑在computed中实现
}

// 行样式
const getRowClassName = ({ row }: { row: SystemConfigWithEdit }) => {
  return row.isEditing ? 'editing-row' : ''
}

// 新增配置
const handleCreate = () => {
  isEditMode.value = false
  formData.value = {
    configId: 0,
    configKey: '',
    configValue: '',
    configType: 'string',
    groupName: filterGroupName.value || 'basic',
    description: '',
    isPublic: false,
    sortOrder: 0,
  }
  dialogVisible.value = true
}

// 编辑配置
const handleEdit = (row: SystemConfigWithEdit) => {
  row.isEditing = true
  row.tempValue = convertValue(row.configValue, row.configType)
}

// 确认编辑
const handleConfirmEdit = (row: SystemConfigWithEdit) => {
  // 根据类型转换回字符串
  if (row.configType === 'boolean') {
    row.configValue = row.tempValue ? 'true' : 'false'
  } else if (row.configType === 'number') {
    row.configValue = String(row.tempValue)
  } else {
    row.configValue = String(row.tempValue)
  }
  row.isEditing = false
  ElMessage.success('配置已修改，请点击"保存所有更改"保存')
}

// 取消编辑
const handleCancelEdit = (row: SystemConfigWithEdit) => {
  row.isEditing = false
  row.tempValue = convertValue(row.configValue, row.configType)
}

// 删除配置
const handleDelete = (row: SystemConfig) => {
  if (row.isSystem) {
    ElMessage.warning('系统配置不允许删除')
    return
  }

  ElMessageBox.confirm('确定要删除该配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request({
          url: `/config/${row.configId}`,
          method: 'delete',
        })
        ElMessage.success('删除成功')
        loadConfigs()
      } catch (error) {
        ElMessage.error('删除失败')
        console.error(error)
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 保存所有更改
const handleSaveAll = async () => {
  try {
    const configsToUpdate = configs.value.map((config) => ({
      configKey: config.configKey,
      configValue: config.configValue,
    }))

    await batchUpdateConfig(configsToUpdate)
    ElMessage.success('保存成功')
    loadConfigs()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

// 提交表单
const handleSubmitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const submitData = {
      ...formData.value,
      configValue:
        formData.value.configType === 'boolean'
          ? String(formData.value.configValue)
          : String(formData.value.configValue),
      isPublic: formData.value.isPublic ? 1 : 0,
    }

    if (isEditMode.value) {
      await request({
        url: `/config/${formData.value.configId}`,
        method: 'put',
        data: submitData,
      })
      ElMessage.success('更新成功')
    } else {
      await request({
        url: '/config',
        method: 'post',
        data: submitData,
      })
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    loadConfigs()
  } catch (error) {
    ElMessage.error(isEditMode.value ? '更新失败' : '创建失败')
    console.error(error)
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped lang="scss">
.system-config-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-section {
    display: flex;
    align-items: center;
    padding: 10px 0;
  }

  .config-value {
    .value-badge {
      display: inline-block;
    }

    .value-text {
      word-break: break-all;
    }
  }

  .form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #999;
  }
}

// 修复Element Plus表格编辑行样式
:deep(.editing-row) {
  background-color: #f0f9ff;
}
</style>
