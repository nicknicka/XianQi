<template>
  <div class="flash-sale-manage-container">
    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 模板管理 -->
      <el-tab-pane label="场次模板" name="template">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>场次模板管理</span>
              <el-button type="primary" @click="openTemplateDialog()">新建模板</el-button>
            </div>
          </template>

          <el-table :data="templates" style="width: 100%" v-loading="templateLoading">
            <el-table-column prop="name" label="模板名称" width="180" />
            <el-table-column prop="sessionTime" label="时间点" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.sessionTime }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="durationHours" label="持续小时数" width="120" />
            <el-table-column prop="sortOrder" label="排序" width="80" />
            <el-table-column prop="isEnabled" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isEnabled === 1 ? 'success' : 'info'">
                  {{ row.isEnabled === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="200">
              <template #default="{ row }">
                <el-button link type="primary" @click="openTemplateDialog(row)">编辑</el-button>
                <el-button
                  link
                  :type="row.isEnabled === 1 ? 'warning' : 'success'"
                  @click="toggleTemplate(row.templateId)"
                >
                  {{ row.isEnabled === 1 ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 固定场次 -->
      <el-tab-pane label="固定场次" name="fixed">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>今日固定场次</span>
              <div>
                <el-button type="success" @click="batchToggleSessionsAction(1)">批量启用</el-button>
                <el-button type="warning" @click="batchToggleSessionsAction(0)">批量禁用</el-button>
                <el-button type="primary" @click="generateToday">刷新今日场次</el-button>
              </div>
            </div>
          </template>

          <el-table :data="fixedSessions" style="width: 100%" v-loading="fixedLoading">
            <el-table-column prop="name" label="场次名称" width="200" />
            <el-table-column prop="sessionTime" label="时间点" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.sessionTime }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="开始时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column label="结束时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.endTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled === 1 ? 'success' : 'info'">
                  {{ row.enabled === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="150">
              <template #default="{ row }">
                <el-button
                  link
                  :type="row.enabled === 1 ? 'warning' : 'success'"
                  @click="toggleSession(row.sessionId)"
                >
                  {{ row.enabled === 1 ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 临时场次 -->
      <el-tab-pane label="临时场次" name="temporary">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>临时场次管理</span>
              <el-button type="primary" @click="openSessionDialog()">新建临时场次</el-button>
            </div>
          </template>

          <el-table :data="temporarySessions" style="width: 100%" v-loading="temporaryLoading">
            <el-table-column prop="name" label="场次名称" width="200" />
            <el-table-column prop="description" label="描述" width="250" show-overflow-tooltip />
            <el-table-column label="时间点" width="120">
              <template #default="{ row }">
                <el-tag>{{ extractTime(row.startTime) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="开始时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.startTime) }}
              </template>
            </el-table-column>
            <el-table-column label="结束时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.endTime) }}
              </template>
            </el-table-column>
            <el-table-column label="持续时间" width="120">
              <template #default="{ row }">
                {{ calculateDuration(row.startTime, row.endTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="200">
              <template #default="{ row }">
                <el-button link type="primary" @click="openSessionDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteSession(row.sessionId)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 模板编辑弹窗 -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="templateForm.templateId ? '编辑模板' : '新建模板'"
      width="600px"
    >
      <el-form :model="templateForm" label-width="120px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="如：上午场、下午场" />
        </el-form-item>
        <el-form-item label="时间点" required>
          <el-time-picker
            v-model="templateTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间点"
          />
        </el-form-item>
        <el-form-item label="持续小时数" required>
          <el-input-number v-model="templateForm.durationHours" :min="1" :max="24" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="templateForm.sortOrder" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="templateForm.isEnabled">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 临时场次编辑弹窗 -->
    <el-dialog
      v-model="sessionDialogVisible"
      :title="sessionForm.sessionId ? '编辑临时场次' : '新建临时场次'"
      width="600px"
    >
      <el-form :model="sessionForm" label-width="120px">
        <el-form-item label="场次名称" required>
          <el-input v-model="sessionForm.name" placeholder="如：周末特惠场" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="sessionForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="sessionStartTime"
            type="datetime"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            @change="handleStartTimeChange"
          />
        </el-form-item>
        <el-form-item label="结束设置" required>
          <el-radio-group v-model="endTimeMode" @change="handleEndTimeModeChange">
            <el-radio value="duration">指定持续时间</el-radio>
            <el-radio value="datetime">指定结束时间</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="endTimeMode === 'duration'" label="持续时间" required>
          <el-input-number v-model="durationHours" :min="1" :max="maxDurationHours" placeholder="小时" @change="calculateEndTime" />
          <span style="margin: 0 8px">小时</span>
          <el-input-number v-model="durationMinutes" :min="0" :max="59" placeholder="分钟" @change="calculateEndTime" />
          <span style="margin-left: 8px">分钟</span>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            提示：持续时间不能超过当天剩余时间（最多 {{ maxDurationHours }} 小时）
          </div>
        </el-form-item>
        <el-form-item v-else label="结束时间" required>
          <el-time-picker
            v-model="sessionEndTimeOnly"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            placeholder="选择结束时间"
            @change="handleEndTimeOnlyChange"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="sessionForm.sortOrder" :min="1" :max="99" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sessionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSession">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getFlashSaleTemplates,
  saveFlashSaleTemplate,
  toggleFlashSaleTemplate,
  getFixedSessions,
  toggleFlashSaleSession,
  batchToggleSessions,
  generateTodaySessions,
  getTemporarySessions,
  createTemporarySession,
  updateTemporarySession,
  deleteTemporarySession,
  type FlashSaleSessionTemplate,
  type FlashSaleSession,
  type FlashSaleTemplateParams,
  type FlashSaleSessionParams,
} from '@/api/flashSale'

// 当前激活的标签页
const activeTab = ref('template')

// 模板管理
const templates = ref<FlashSaleSessionTemplate[]>([])
const templateLoading = ref(false)
const templateDialogVisible = ref(false)
const templateForm = ref<FlashSaleTemplateParams>({
  name: '',
  sessionTime: '',
  durationHours: 2,
  sortOrder: 1,
  isEnabled: 1,
})
const templateTime = ref('')

// 固定场次
const fixedSessions = ref<FlashSaleSession[]>([])
const fixedLoading = ref(false)

// 临时场次
const temporarySessions = ref<FlashSaleSession[]>([])
const temporaryLoading = ref(false)
const sessionDialogVisible = ref(false)
const sessionForm = ref<FlashSaleSessionParams>({
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  sortOrder: 99,
})
const sessionStartTime = ref('')
const sessionEndTime = ref('')
const sessionEndTimeOnly = ref('') // 仅时间的结束时间
const endTimeMode = ref<'duration' | 'datetime'>('duration') // 默认使用持续时间
const durationHours = ref(2) // 默认2小时
const durationMinutes = ref(0) // 默认0分钟
const maxDurationHours = ref(24) // 持续时间最大小时数

// 标签页切换
const handleTabChange = (tabName: string) => {
  if (tabName === 'template') {
    loadTemplates()
  } else if (tabName === 'fixed') {
    loadFixedSessions()
  } else if (tabName === 'temporary') {
    loadTemporarySessions()
  }
}

// 加载模板列表
const loadTemplates = async () => {
  templateLoading.value = true
  try {
    templates.value = await getFlashSaleTemplates()
  } catch (error) {
    ElMessage.error('加载模板列表失败')
  } finally {
    templateLoading.value = false
  }
}

// 打开模板编辑弹窗
const openTemplateDialog = (row?: FlashSaleSessionTemplate) => {
  if (row) {
    templateForm.value = {
      templateId: row.templateId,
      name: row.name,
      sessionTime: row.sessionTime,
      durationHours: row.durationHours,
      sortOrder: row.sortOrder,
      isEnabled: row.isEnabled,
    }
    templateTime.value = row.sessionTime
  } else {
    templateForm.value = {
      name: '',
      sessionTime: '',
      durationHours: 2,
      sortOrder: 1,
      isEnabled: 1,
    }
    templateTime.value = ''
  }
  templateDialogVisible.value = true
}

// 保存模板
const handleSaveTemplate = async () => {
  if (!templateForm.value.name || !templateTime.value) {
    ElMessage.warning('请填写完整信息')
    return
  }

  templateForm.value.sessionTime = templateTime.value

  try {
    await saveFlashSaleTemplate(templateForm.value)
    ElMessage.success('保存成功')
    templateDialogVisible.value = false
    loadTemplates()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 切换模板状态
const toggleTemplate = async (templateId: number) => {
  try {
    await toggleFlashSaleTemplate(templateId)
    ElMessage.success('操作成功')
    loadTemplates()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 加载固定场次列表
const loadFixedSessions = async () => {
  fixedLoading.value = true
  try {
    fixedSessions.value = await getFixedSessions()
  } catch (error) {
    ElMessage.error('加载固定场次列表失败')
  } finally {
    fixedLoading.value = false
  }
}

// 切换场次状态
const toggleSession = async (sessionId: string) => {
  try {
    await toggleFlashSaleSession(sessionId)
    ElMessage.success('操作成功')
    loadFixedSessions()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 批量切换场次状态
const batchToggleSessionsAction = async (enabled: number) => {
  try {
    await batchToggleSessions(enabled)
    ElMessage.success(enabled === 1 ? '已批量启用' : '已批量禁用')
    loadFixedSessions()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 刷新今日场次
const generateToday = async () => {
  try {
    await generateTodaySessions()
    ElMessage.success('刷新成功')
    loadFixedSessions()
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

// 加载临时场次列表
const loadTemporarySessions = async () => {
  temporaryLoading.value = true
  try {
    const data = await getTemporarySessions()
    console.log('🔄 [Loaded Sessions]', data)
    temporarySessions.value = data
  } catch (error) {
    console.error('❌ [Load Error]', error)
    ElMessage.error('加载临时场次列表失败')
  } finally {
    temporaryLoading.value = false
  }
}

// 打开临时场次编辑弹窗
const openSessionDialog = (row?: FlashSaleSession) => {
  console.log('📝 [Open Dialog]', {
    hasRow: !!row,
    row: row ? {
      sessionId: row.sessionId,
      sessionIdType: typeof row.sessionId,
      name: row.name,
      startTime: row.startTime,
      endTime: row.endTime
    } : null
  })

  if (row) {
    sessionForm.value = {
      sessionId: row.sessionId,
      name: row.name,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
      sortOrder: row.sortOrder,
    }
    sessionStartTime.value = row.startTime
    sessionEndTime.value = row.endTime

    // 提取结束时间的时间部分
    if (row.endTime) {
      const endDate = new Date(row.endTime)
      sessionEndTimeOnly.value = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:${String(endDate.getSeconds()).padStart(2, '0')}`
    }

    // 计算持续时间
    if (row.startTime && row.endTime) {
      const start = new Date(row.startTime)
      const end = new Date(row.endTime)
      const diff = end.getTime() - start.getTime()
      durationHours.value = Math.floor(diff / (1000 * 60 * 60))
      durationMinutes.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    }

    // 计算最大持续时间
    calculateMaxDuration()
  } else {
    sessionForm.value = {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      sortOrder: 99,
    }
    sessionStartTime.value = ''
    sessionEndTime.value = ''
    sessionEndTimeOnly.value = ''
    durationHours.value = 2
    durationMinutes.value = 0
    maxDurationHours.value = 24
  }
  // 默认使用持续时间模式
  endTimeMode.value = 'duration'
  sessionDialogVisible.value = true
}

// 计算当天最大持续时间（不跨天）
const calculateMaxDuration = () => {
  if (!sessionStartTime.value) {
    maxDurationHours.value = 24
    return
  }

  const start = new Date(sessionStartTime.value)
  // 计算到当天24:00:00（即第二天00:00:00）的时间差
  const endOfDay = new Date(start)
  endOfDay.setHours(24, 0, 0, 0)  // 设置为当天的24:00:00，即下一天的开始

  const diffMs = endOfDay.getTime() - start.getTime()
  const maxHours = diffMs / (1000 * 60 * 60)

  // 向下取整，确保不会跨天
  // 例如：20:00 开始，到 24:00:00 正好 4 小时，允许 4 小时持续时间
  //      20:01 开始，到 24:00:00 约 3.98 小时，向下取整后只允许 3 小时
  maxDurationHours.value = Math.max(1, Math.floor(maxHours))

  // 如果当前持续时间超过最大值，则调整
  if (durationHours.value > maxDurationHours.value) {
    durationHours.value = maxDurationHours.value
    durationMinutes.value = 0
    calculateEndTime()
  }
}

// 开始时间改变时的处理
const handleStartTimeChange = () => {
  if (endTimeMode.value === 'duration' && sessionStartTime.value) {
    calculateMaxDuration()
    calculateEndTime()
  } else if (endTimeMode.value === 'datetime' && sessionStartTime.value) {
    calculateMaxDuration()
  }
}

// 结束时间（仅时间）改变时的处理
const handleEndTimeOnlyChange = () => {
  if (!sessionStartTime.value || !sessionEndTimeOnly.value) return

  const startDate = new Date(sessionStartTime.value)
  const [hours, minutes, seconds = 0] = sessionEndTimeOnly.value.split(':').map(Number)

  const endDate = new Date(startDate)
  endDate.setHours(hours, minutes, seconds, 0)

  // 如果结束时间早于开始时间，说明是第二天
  if (endDate <= startDate) {
    ElMessage.warning('结束时间必须在开始时间之后，且不能跨天')
    sessionEndTimeOnly.value = ''
    sessionEndTime.value = ''
    return
  }

  sessionEndTime.value = endDate.toISOString().slice(0, 19).replace('T', ' ')
}

// 结束时间模式切换
const handleEndTimeModeChange = (mode: string | number | boolean | undefined) => {
  if (mode === 'duration' && sessionStartTime.value) {
    calculateEndTime()
  }
}

// 根据持续时间计算结束时间
const calculateEndTime = () => {
  // 1. 如果没有开始时间，直接返回
  if (!sessionStartTime.value) {
    return
  }

  // 2. 解析开始时间（使用本地时间，避免时区转换问题）
  const startDate = new Date(sessionStartTime.value)

  // 3. 使用时间戳方式计算结束时间（避免setHours的时区问题）
  const durationMs = (durationHours.value * 60 * 60 * 1000) + (durationMinutes.value * 60 * 1000)
  const endDate = new Date(startDate.getTime() + durationMs)

  // 4. 检查是否同一天（使用本地时间的年月日比较）
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()
  const startDay = startDate.getDate()

  const endYear = endDate.getFullYear()
  const endMonth = endDate.getMonth()
  const endDay = endDate.getDate()

  const isSameDay = (startYear === endYear && startMonth === endMonth && startDay === endDay)

  // 5. 如果跨天，发出警告并清空结束时间
  if (!isSameDay) {
    ElMessage.warning('警告：持续时间会导致跨天，请减少持续时间或调整开始时间')
    sessionEndTime.value = ''
    return
  }

  // 6. 额外验证：确保结束时间确实晚于开始时间
  if (endDate <= startDate) {
    ElMessage.warning('结束时间必须晚于开始时间')
    sessionEndTime.value = ''
    return
  }

  // 7. 格式化为本地时间字符串 YYYY-MM-DD HH:mm:ss
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const day = String(endDate.getDate()).padStart(2, '0')
  const hours = String(endDate.getHours()).padStart(2, '0')
  const minutes = String(endDate.getMinutes()).padStart(2, '0')
  const seconds = String(endDate.getSeconds()).padStart(2, '0')

  sessionEndTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 保存临时场次
const handleSaveSession = async () => {
  console.log('💾 [Save Session] Start', {
    name: sessionForm.value.name,
    endTimeMode: endTimeMode.value,
    sessionStartTime: sessionStartTime.value,
    sessionEndTime: sessionEndTime.value,
    durationHours: durationHours.value,
    durationMinutes: durationMinutes.value,
    maxDurationHours: maxDurationHours.value
  })

  if (!sessionForm.value.name || !sessionStartTime.value) {
    console.log('❌ [Validation Failed] Missing required fields')
    ElMessage.warning('请填写完整信息')
    return
  }

  // 如果是持续时间模式，先计算结束时间
  if (endTimeMode.value === 'duration') {
    console.log('⏱️ [Duration Mode] Processing')

    if (!sessionEndTime.value) {
      console.log('🔄 [Recalculate End Time] End time is empty, calculating...')
      calculateEndTime()
    }

    // 再次验证持续时间（防止用户绕过输入框限制）
    const totalMinutes = durationHours.value * 60 + durationMinutes.value
    const maxTotalMinutes = maxDurationHours.value * 60

    console.log('🔍 [Duration Validation]', {
      totalMinutes,
      maxTotalMinutes,
      durationHours: durationHours.value,
      durationMinutes: durationMinutes.value
    })

    if (totalMinutes > maxTotalMinutes) {
      console.log('❌ [Validation Failed] Duration exceeds maximum', {
        totalMinutes,
        maxTotalMinutes
      })
      ElMessage.warning(`持续时间不能超过当天剩余时间（${maxDurationHours.value}小时）`)
      return
    }

    console.log('✅ [Duration Validation Passed]')
  } else if (endTimeMode.value === 'datetime') {
    console.log('📅 [DateTime Mode] Processing')

    // 如果是指定结束时间模式，确保已处理时间部分
    if (!sessionEndTimeOnly.value) {
      console.log('❌ [Validation Failed] End time only is empty')
      ElMessage.warning('请选择结束时间')
      return
    }
    // handleEndTimeOnlyChange 已经设置了 sessionEndTime
    console.log('✅ [DateTime Mode Validated]')
  }

  // 验证结束时间
  if (!sessionEndTime.value) {
    console.log('❌ [Validation Failed] End time is empty')
    ElMessage.warning('请设置结束时间')
    return
  }

  // 验证开始时间和结束时间必须在同一天
  const startDate = new Date(sessionStartTime.value)
  const endDate = new Date(sessionEndTime.value)

  console.log('📆 [Date Comparison]', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDay: `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`,
    endDay: `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`
  })

  // 检查跨天：比较年月日
  if (startDate.getDate() !== endDate.getDate() ||
      startDate.getMonth() !== endDate.getMonth() ||
      startDate.getFullYear() !== endDate.getFullYear()) {
    console.log('❌ [Validation Failed] Cross day detected', {
      startDay: `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`,
      endDay: `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`
    })
    ElMessage.warning('临时场次的开始时间和结束时间必须在同一天')
    return
  }

  console.log('✅ [Same Day Validation Passed]')

  // 持续时间模式的额外验证（双重保障）
  if (endTimeMode.value === 'duration') {
    const totalMinutes = durationHours.value * 60 + durationMinutes.value
    const maxTotalMinutes = maxDurationHours.value * 60

    console.log('🛡️ [Double Check Duration]', {
      totalMinutes,
      maxTotalMinutes
    })

    if (totalMinutes > maxTotalMinutes) {
      console.log('❌ [Double Check Failed] Duration still exceeds maximum')
      ElMessage.warning(`持续时间不能超过当天剩余时间（${maxDurationHours.value}小时）`)
      return
    }

    // 三重保障：计算实际时间差，确保真的没有跨天
    const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

    console.log('🔬 [Triple Check Time Diff]', {
      diffHours,
      maxAllowed: 24,
      isCrossDay: startDate.getDate() !== endDate.getDate()
    })

    if (diffHours > 24 || (startDate.getDate() !== endDate.getDate())) {
      console.log('❌ [Triple Check Failed] Time difference too large or cross day')
      ElMessage.warning('活动持续时间不能跨天，请调整持续时间')
      return
    }

    console.log('✅ [Triple Check Passed]')
  }

  // 验证时间顺序
  if (startDate >= endDate) {
    console.log('❌ [Validation Failed] End time is not after start time', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })
    ElMessage.warning('结束时间必须晚于开始时间')
    return
  }

  console.log('✅ [Time Order Validation Passed]', {
    duration: `${(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)}h`
  })

  sessionForm.value.startTime = sessionStartTime.value
  sessionForm.value.endTime = sessionEndTime.value

  console.log('📝 [Final Form Data]', {
    sessionId: sessionForm.value.sessionId,
    name: sessionForm.value.name,
    startTime: sessionForm.value.startTime,
    endTime: sessionForm.value.endTime
  })

  console.log('💾 [Save Session]', {
    sessionId: sessionForm.value.sessionId,
    sessionIdType: typeof sessionForm.value.sessionId,
    formData: sessionForm.value
  })

  try {
    if (sessionForm.value.sessionId) {
      // 更新时，从请求体中移除sessionId（URL中已经包含）
      const { sessionId: _sessionId, ...updateData } = sessionForm.value
      console.log('📤 [Update Request]', {
        sessionId: sessionForm.value.sessionId,
        updateData: {
          ...updateData,
          startTime: updateData.startTime,
          endTime: updateData.endTime
        }
      })
      await updateTemporarySession(sessionForm.value.sessionId, updateData)
    } else {
      console.log('📤 [Create Request]', sessionForm.value)
      await createTemporarySession(sessionForm.value)
    }
    ElMessage.success('保存成功')
    sessionDialogVisible.value = false

    // 等待一小段时间确保后端处理完成，然后重新加载
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('🔄 [Reloading sessions after save...]')
    await loadTemporarySessions()
  } catch (error) {
    console.error('❌ [Save Error]', error)
    ElMessage.error('保存失败')
  }
}

// 删除临时场次
const handleDeleteSession = async (sessionId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个临时场次吗？', '提示', {
      type: 'warning',
    })
    await deleteTemporarySession(sessionId)
    ElMessage.success('删除成功')
    loadTemporarySessions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 页面加载
onMounted(() => {
  loadTemplates()
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 从开始时间提取时间点
const extractTime = (startTime: string) => {
  if (!startTime) return '-'
  const date = new Date(startTime)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 计算持续时间
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-'

  const start = new Date(startTime)
  const end = new Date(endTime)
  const diff = end.getTime() - start.getTime()

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? minutes + '分' : ''}`
  } else {
    return `${minutes}分钟`
  }
}
</script>

<style scoped lang="scss">
.flash-sale-manage-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .box-card {
    margin-bottom: 20px;
  }
}
</style>
