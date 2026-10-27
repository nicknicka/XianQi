<template>
  <view class="quick-reply-page page-animate service-redesign-page" :class="{ 'animate-in': isAnimated }" :style="themeStyle">
    <!-- 页面头部 -->
    <view class="page-header">
      <text class="title">快捷回复</text>
      <view>
        <button class="add-btn" @click="showAddModal">
          <uni-icons type="plus" size="16" color="#fff" />
          <text>添加</text>
        </button>
      </view>
      
    </view>

    <!-- 快捷回复列表 -->
    <scroll-view class="scroll-view" scroll-y>
      <!-- 系统预设 -->
      <view class="section">
        <text class="section-title">系统预设</text>
        <view class="reply-list">
          <view
            v-for="reply in systemReplies"
            :key="reply.id"
            class="reply-item system"
            @click="useReply(reply.content)"
          >
            <text class="reply-content">{{ reply.content }}</text>
            <view class="reply-action">
              <text class="use-text">使用</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 我的回复 -->
      <view class="section">
        <text class="section-title">我的回复</text>
        <view class="reply-list">
          <view v-if="myReplies.length === 0 && !loading" class="empty-state">
            <text class="empty-text">暂无自定义回复</text>
          </view>
          <view v-else>
            <view v-for="reply in myReplies" :key="reply.id" class="reply-item">
              <text class="reply-content" @click="useReply(reply.content)">{{ reply.content }}</text>
              <view class="reply-actions">
                <text class="use-text" @click="useReply(reply.content)">使用</text>
                <view class="action-divider"></view>
                <view class="action-btn" @click.stop="editReply(reply)">
                  <uni-icons type="compose" size="18" :color="primaryColor" />
                </view>
                <view class="action-btn" @click.stop="deleteReply(reply.id)">
                  <uni-icons type="trash" size="18" :color="dangerColor" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <uni-icons type="spinner-cycle" size="20" color="#AAAAAA" />
        <text class="loading-text">加载中...</text>
      </view>
    </scroll-view>

    <!-- 添加/编辑弹窗 -->
    <uni-popup ref="replyPopup" type="center" :safe-area="false">
      <view class="reply-modal" @click.stop>
        <!-- 顶部装饰条 -->
        <view class="modal-indicator"></view>

        <!-- 图标区域 -->
        <view class="modal-icon">
          <view class="icon-bg">
            <uni-icons type="chat" size="32" :color="primaryColor" />
          </view>
        </view>

        <!-- 标题 -->
        <view class="modal-header">
          <text class="modal-title">{{ editingReply ? '编辑' : '添加' }}快捷回复</text>
          <text class="modal-subtitle">创建您常用的回复内容</text>
        </view>

        <!-- 输入区域 -->
        <view class="modal-body">
          <!-- 内容输入 -->
          <view class="form-item">
            <view class="form-label">
              <text class="label-text">回复内容</text>
              <text class="label-required">*</text>
            </view>
            <view class="textarea-wrapper" :class="{ 'focused': contentFocused }">
              <textarea
                class="textarea"
                v-model="replyForm.content"
                placeholder="请输入快捷回复内容，例如：好的，请问还在吗？"
                maxlength="100"
                placeholder-style="color: var(--text-color-tertiary)"
                @focus="contentFocused = true"
                @blur="contentFocused = false"
              />
              <view class="textarea-footer">
                <text class="count" :class="{ 'warning': replyForm.content.length >= 90, 'error': replyForm.content.length >= 100 }">
                  {{ replyForm.content.length }}/100
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 按钮区域 -->
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">
            <text>取消</text>
          </button>
          <button
            class="confirm-btn"
            :class="{ 'disabled': !replyForm.content.trim() }"
            :disabled="!replyForm.content.trim()"
            @click="handleSave"
          >
            <view class="btn-content">
              <uni-icons type="checkmarkempty" size="16" color="#fff" />
              <text>保存</text>
            </view>
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { messageApi } from '@/api/message'
import { http } from '@/utils/request'
import { checkSensitiveWord, SensitiveCheckType } from '@/utils/sensitive-word'
import {useThemeStyle, useThemeColors, useThemePage} from '@/utils/theme'
import { onShow } from '@dcloudio/uni-app'

const { themeStyle } = useThemeStyle()
const { primaryColor, dangerColor } = useThemeColors()

interface QuickReply {
  id: string
  content: string
  category?: string
  isSystem: boolean
}

// 页面进入动画状态
const isAnimated = ref(false)

const systemReplies = ref<QuickReply[]>([
  { id: 1, content: '好的，请问还在吗？', isSystem: true },
  { id: 2, content: '感兴趣，可以详细介绍一下吗？', isSystem: true },
  { id: 3, content: '价格可以商量吗？', isSystem: true },
  { id: 4, content: '可以便宜点吗？', isSystem: true },
  { id: 5, content: '我可能需要一些时间考虑', isSystem: true },
  { id: 6, content: '好的，我想要了', isSystem: true },
  { id: 7, content: '不好意思，不需要了', isSystem: true },
  { id: 8, content: '可以见面交易吗？', isSystem: true }
])

const myReplies = ref<QuickReply[]>([])
const loading = ref(false)
const editingReply = ref<QuickReply | null>(null)
const replyPopup = ref()
const contentFocused = ref(false)

const replyForm = ref({
  content: ''
})

onShow(() => {
  useThemePage()
})


onMounted(() => {
  console.log('[快捷回复] 页面挂载，开始初始化')
  loadMyReplies()

  // 触发页面进入动画
  setTimeout(() => {
    isAnimated.value = true
  }, 50)
})

function loadMyReplies() {
  console.log('[快捷回复] 开始加载我的快捷回复列表')
  loading.value = true

  messageApi
    .getQuickReplies()
    .then((res) => {
      console.log('[快捷回复] 接口返回数据:', res)

      // 后端返回的是分页对象 IPage，需要从 records 获取数据
      const pageData = res.data as any
      const list = pageData?.records || pageData?.list || []

      console.log('[快捷回复] 原始数据列表长度:', list.length)

      const customReplies = list
        .filter((r: any) => !r.category || r.category === 'custom')
        .map((r: any) => ({
          id: r.replyId || r.id,
          content: r.content,
          category: r.category,
          isSystem: false
        }))

      console.log('[快捷回复] 过滤后自定义回复数量:', customReplies.length)
      console.log('[快捷回复] 自定义回复列表:', customReplies)

      myReplies.value = customReplies
    })
    .catch((err) => {
      console.error('[快捷回复] 加载失败:', err)
    })
    .finally(() => {
      console.log('[快捷回复] 加载完成，loading状态设为false')
      loading.value = false
    })
}

function showAddModal() {
  console.log('[快捷回复] 打开添加弹窗')
  editingReply.value = null
  replyForm.value.content = ''
  contentFocused.value = false
  replyPopup.value?.open()
}

function editReply(reply: any) {
  console.log('[快捷回复] 打开编辑弹窗，编辑项:', reply)
  editingReply.value = reply
  replyForm.value.content = reply.content || ''
  replyPopup.value?.open()
}

function closeModal() {
  console.log('[快捷回复] 关闭弹窗')
  replyPopup.value?.close()
}

async function handleSave() {
  console.log('[快捷回复] 保存快捷回复，表单数据:', replyForm.value)
  if (!replyForm.value.content.trim()) {
    console.warn('[快捷回复] 内容为空，阻止保存')
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }

  // 检查敏感词
  const checkResult = await checkSensitiveWord(replyForm.value.content, SensitiveCheckType.MESSAGE)
  if (checkResult && !checkResult.passed) {
    return
  }

  // 使用过滤后的内容
  const filteredContent = checkResult?.filteredContent || replyForm.value.content

  // 如果有敏感词被过滤，显示提示
  if (checkResult?.hasSensitiveWord) {
    uni.showToast({
      title: '已自动过滤敏感词',
      icon: 'none',
      duration: 1500
    })
  }

  if (editingReply.value) {
    // 编辑 - 使用 PUT 请求到后端
    console.log('[快捷回复] 执行编辑操作，ID:', editingReply.value.id)
    http
      .put(`/quick-reply/${editingReply.value.id}`, {
        content: filteredContent
      }, { showLoading: true })
      .then((res) => {
        console.log('[快捷回复] 编辑成功:', res)
        uni.showToast({ title: '修改成功', icon: 'success' })
        loadMyReplies()
        closeModal()
      })
      .catch((err) => {
        console.error('[快捷回复] 编辑失败:', err)
      })
  } else {
    // 新增 - 使用 messageApi 的 addQuickReply 方法
    console.log('[快捷回复] 执行新增操作')
    messageApi
      .addQuickReply({
        content: filteredContent,
        category: 'custom'
      })
      .then((res) => {
        console.log('[快捷回复] 新增成功:', res)
        uni.showToast({ title: '添加成功', icon: 'success' })
        loadMyReplies()
        closeModal()
      })
      .catch((err) => {
        console.error('[快捷回复] 新增失败:', err)
      })
  }
}

function deleteReply(id: string) {
  console.log('[快捷回复] 请求删除快捷回复，ID:', id)
  uni.showModal({
    title: '提示',
    content: '确定要删除这条快捷回复吗？',
    success: (res) => {
      if (res.confirm) {
        console.log('[快捷回复] 用户确认删除，ID:', id)
        messageApi
          .deleteQuickReply(id)
          .then((res) => {
            console.log('[快捷回复] 删除成功:', res)
            uni.showToast({ title: '删除成功', icon: 'success' })
            loadMyReplies()
          })
          .catch((err) => {
            console.error('[快捷回复] 删除失败:', err)
          })
      } else {
        console.log('[快捷回复] 用户取消删除')
      }
    }
  })
}

function useReply(content: string) {
  console.log('[快捷回复] 使用快捷回复，内容:', content)
  // 返回上一页并传递内容
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - 2] as any

  console.log('[快捷回复] 当前页面栈长度:', pages.length)
  if (prevPage) {
    console.log('[快捷回复] 上一页路由:', prevPage.route)
  }

  // 判断上一页是否是聊天页面
  const isFromChat = prevPage && prevPage.route && prevPage.route.includes('message/chat')
  console.log('[快捷回复] 是否来自聊天页面:', isFromChat)

  if (isFromChat && prevPage.$vm) {
    console.log('[快捷回复] 调用聊天页面的 selectQuickReply 方法')
    // 如果上一页是聊天页面，可以直接设置输入框内容
    if (prevPage.$vm.selectQuickReply) {
      prevPage.$vm.selectQuickReply(content)
      uni.navigateBack()
    } else if (prevPage.$vm.setInputText) {
      // 备用方法：直接设置输入框内容
      console.log('[快捷回复] 使用备用方法 setInputText')
      prevPage.$vm.setInputText(content)
      uni.navigateBack()
    }
  } else {
    console.log('[快捷回复] 不是从聊天页面打开，复制到剪贴板')
    // 如果不是从聊天页面打开的，提示用户复制内容
    uni.setClipboardData({
      data: content,
      success: () => {
        console.log('[快捷回复] 复制成功')
        uni.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('[快捷回复] 复制失败:', err)
      }
    })
  }
}
</script>

<style lang="scss" scoped>
// 页面进入动画关键帧
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 页面动画样式
.page-animate {
  opacity: 0;
  transform: translateY(30rpx);

  &.animate-in {
    animation: pageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}

.quick-reply-page {
  min-height: 100vh;
  background: var(--bg-color-page);
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  background: var(--bg-color-card);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 10;

  .title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-color-primary);
    letter-spacing: 0.5rpx;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    border-radius: 48rpx;
    border: none;
    box-shadow: 0 4rpx 16rpx var(--primary-color-alpha-25);
    transition: all 0.3s;

    &:active {
      transform: scale(0.96);
      box-shadow: 0 2rpx 8rpx var(--primary-color-alpha-20);
    }
  }
}

.scroll-view {
  flex: 1;
  height: 0;
}

.section {
  margin-bottom: 20rpx;

  .section-title {
    padding: 24rpx 32rpx 16rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: var(--text-color-tertiary);
    letter-spacing: 0.5rpx;
  }
}

.reply-list {
  background: var(--bg-color-card);
  margin: 0 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .reply-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 32rpx;
    border-bottom: 1px solid var(--border-color-light);
    transition: background-color 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background-color: #fafafa;
    }

    &.system {
      background: linear-gradient(to right, #fafafa, #fff);

      .reply-content {
        color: var(--text-color-secondary);
      }
    }

    .reply-content {
      flex: 1;
      font-size: 30rpx;
      color: var(--text-color-primary);
      line-height: 1.6;
      padding-right: 16rpx;
      word-break: break-all;
    }

    .reply-action {
      .use-text {
        font-size: 24rpx;
        color: var(--primary-color);
        font-weight: 500;
      }
    }

    .reply-actions {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-left: auto;

      .use-text {
        font-size: 24rpx;
        color: var(--primary-color);
        font-weight: 500;
        white-space: nowrap;
      }

      .action-divider {
        width: 1rpx;
        height: 24rpx;
        background: var(--border-color-light);
      }

      .action-btn {
        padding: 12rpx;
        border-radius: 8rpx;
        transition: background-color 0.2s;

        &:active {
          background-color: rgba(0, 0, 0, 0.05);
        }
      }
    }
  }
}

.empty-state {
  padding: 160rpx 32rpx;
  text-align: center;

  .empty-text {
    font-size: 28rpx;
    color: var(--text-color-tertiary);
  }
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;

  .loading-text {
    margin-left: 20rpx;
    font-size: 26rpx;
    color: var(--text-color-tertiary);
  }
}

.reply-modal {
  width: 600rpx;
  max-height: 80vh;
  background: var(--bg-color-card);
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  // 顶部装饰条
  .modal-indicator {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80rpx;
    height: 6rpx;
    background: linear-gradient(90deg, var(--primary-color) 0%, #FF8F00 100%);
    border-radius: 0 0 6rpx 6rpx;
  }

  // 图标区域
  .modal-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 24rpx;

    .icon-bg {
      width: 96rpx;
      height: 96rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #FFF8F0 0%, #FFF0E0 100%);
      border-radius: 50%;
      box-shadow: 0 8rpx 24rpx var(--primary-color-alpha-15);
      animation: iconFloat 3s ease-in-out infinite;
    }
  }

  // 标题区域
  .modal-header {
    text-align: center;
    margin-bottom: 32rpx;

    .modal-title {
      display: block;
      font-size: 36rpx;
      font-weight: 700;
      color: var(--text-color-primary);
      margin-bottom: 8rpx;
    }

    .modal-subtitle {
      display: block;
      font-size: 24rpx;
      color: var(--text-color-tertiary);
    }
  }

  // 输入区域
  .modal-body {
    margin-bottom: 32rpx;
    flex: 1;
    overflow-y: auto;
    max-height: 50vh;

    .form-item {
      &:not(:last-child) {
        margin-bottom: 24rpx;
      }
      .form-label {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;

        .label-text {
          font-size: 28rpx;
          font-weight: 600;
          color: var(--text-color-primary);
        }

        .label-required {
          font-size: 28rpx;
          color: var(--danger-color);
          margin-left: 4rpx;
        }
      }

      .textarea-wrapper {
        background: var(--bg-color-page);
        border-radius: 16rpx;
        border: 2rpx solid transparent;
        transition: all 0.3s ease;

        &.focused {
          background: var(--bg-color-card);
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4rpx var(--primary-color-alpha-10);
        }

        .textarea {
          width: 100%;
          min-height: 180rpx;
          max-height: 300rpx;
          padding: 20rpx;
          font-size: 28rpx;
          line-height: 1.6;
          color: var(--text-color-primary);
          background: transparent;
        }

        .textarea-footer {
          display: flex;
          justify-content: flex-end;
          padding: 0 20rpx 16rpx;

          .count {
            font-size: 22rpx;
            color: var(--text-color-tertiary);
            transition: color 0.3s ease;

            &.warning {
              color: var(--warning-color);
            }

            &.error {
              color: var(--danger-color);
            }
          }
        }
      }
    }
  }

  // 按钮区域
  .modal-footer {
    display: flex;
    gap: 16rpx;

    .cancel-btn,
    .confirm-btn {
      flex: 1;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16rpx;
      font-size: 30rpx;
      font-weight: 600;
      border: none;
      transition: all 0.3s ease;
    }

    .cancel-btn {
      background: var(--bg-color-page);
      color: var(--text-color-secondary);

      &:active {
        background: #ebebeb;
        transform: scale(0.98);
      }
    }

    .confirm-btn {
      background: linear-gradient(135deg, var(--primary-color) 0%, #FF8F00 100%);
      color: #fff;
      box-shadow: 0 6rpx 20rpx var(--primary-color-alpha-30);

      &:active {
        transform: scale(0.98);
        box-shadow: 0 4rpx 12rpx var(--primary-color-alpha-30);
      }

      &.disabled {
        opacity: 0.5;
        box-shadow: none;
      }

      .btn-content {
        display: flex;
        align-items: center;
        gap: 8rpx;
      }
    }
  }
}

// 图标浮动动画
@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8rpx);
  }
}
</style>
