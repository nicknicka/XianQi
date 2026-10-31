<template>
  <view class="comment-list" :class="[customClass]" :style="customStyle">
    <!-- 评论列表 -->
    <view v-if="comments.length > 0" class="comment-items">
      <view
        v-for="(comment, index) in comments"
        :key="comment.id || index"
        class="comment-item"
      >
        <!-- 用户头像和昵称 -->
        <view class="comment-user" @click="handleUserClick(comment)">
          <UserAvatar class="user-avatar" :src="comment.userAvatar" size="xs" shape="circle" />
          <text class="user-name">{{ comment.userName }}</text>
          <text v-if="comment.userTag" class="user-tag">{{ comment.userTag }}</text>
        </view>

        <!-- 评论内容 -->
        <view class="comment-content">
          <!-- 星级评分 -->
          <view v-if="showRating && comment.rating" class="comment-rating">
            <text
              v-for="i in 5"
              :key="i"
              class="star-icon"
              :class="{ 'is-active': i <= comment.rating }"
            >★</text>
          </view>

          <!-- 评论文字 -->
          <text v-if="comment.content" class="comment-text">{{ comment.content }}</text>

          <!-- 评论图片 -->
          <view v-if="comment.images && comment.images.length > 0" class="comment-images">
            <image
              v-for="(image, imgIndex) in comment.images"
              :key="imgIndex"
              class="comment-image"
              :src="image"
              mode="aspectFill"
              @click="handleImagePreview(comment.images, imgIndex)"
            />
          </view>

          <!-- 回复引用 -->
          <view v-if="comment.replyTo" class="comment-reply">
            <text class="reply-text">回复 @{{ comment.replyTo }}：</text>
            <text class="reply-content">{{ comment.replyContent }}</text>
          </view>
        </view>

        <!-- 评论信息 -->
        <view class="comment-meta">
          <text class="meta-time">{{ formatTime(comment.createdAt) }}</text>
          <view v-if="!comment.replyCount && comment.replyCount !== 0" class="meta-divider">·</view>
          <view class="meta-actions">
            <view
              v-if="showLike && !hideLike"
              class="action-btn like-btn"
              :class="{ 'is-active': comment.isLiked }"
              @click="handleLike(comment, index)"
            >
              <text class="btn-icon">{{ comment.isLiked ? '♥' : '♡' }}</text>
              <text class="btn-text">{{ comment.likeCount || '点赞' }}</text>
            </view>
            <view
              v-if="showReply && !hideReply"
              class="action-btn reply-btn"
              @click="handleReply(comment, index)"
            >
              <text class="btn-icon">💬</text>
              <text class="btn-text">{{ comment.replyCount || '回复' }}</text>
            </view>
          </view>
        </view>

        <!-- 回复列表 -->
        <view v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
          <view
            v-for="(reply, replyIndex) in comment.replies"
            :key="reply.id || replyIndex"
            class="reply-item"
          >
            <UserAvatar class="reply-avatar" :src="reply.userAvatar" size="xs" shape="circle" />
            <view class="reply-content">
              <text class="reply-name">{{ reply.userName }}</text>
              <text class="reply-text">{{ reply.content }}</text>
            </view>
          </view>

          <!-- 查看更多回复 -->
          <view
            v-if="(comment.replyCount || 0) > (comment.replies?.length || 0)"
            class="view-more-replies"
            @click="handleViewMoreReplies(comment, index)"
          >
            <text class="more-text">查看全部 {{ comment.replyCount }} 条回复 ›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <slot name="empty">
        <view class="empty-content">
          <text class="empty-icon">💬</text>
          <text class="empty-text">暂无评论</text>
          <text class="empty-tip">快来抢沙发吧~</text>
        </view>
      </slot>
    </view>

    <!-- 评论输入框 -->
    <view v-if="showInput" class="comment-input-wrapper">
      <slot name="input">
        <view class="comment-input">
          <textarea
            class="input-field"
            :placeholder="replyTo ? `回复 ${replyTo}：` : placeholder"
            :value="inputValue"
            :maxlength="maxLength"
            @input="handleInput"
            :focus="handleFocus"
            @blur="handleBlur"
          />
          <view class="input-actions">
            <view class="action-btn cancel-btn" @click="handleCancelInput">
              <text class="btn-text">取消</text>
            </view>
            <view
              class="action-btn send-btn"
              :class="{ 'is-disabled': !inputValue.trim() }"
              @click="handleSend"
            >
              <text class="btn-text">发送</text>
            </view>
          </view>
          <view class="input-limit">{{ inputValue.length }}/{{ maxLength }}</view>
        </view>
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatTime } from '@/utils/common'
import UserAvatar from '@/components/user-avatar/user-avatar.vue'
import { useThemeStyle, useThemeColors } from '@/utils/theme'

const { themeStyle } = useThemeStyle()
const { primaryColor, warningColor } = useThemeColors()

interface CommentItem {
  id?: string
  userAvatar: string
  userName: string
  userTag?: string
  rating?: number
  content: string
  images?: string[]
  replyTo?: string
  replyContent?: string
  createdAt: string | number
  isLiked?: boolean
  likeCount?: number
  replyCount?: number
  replies?: CommentItem[]
  [key: string]: any
}

interface Props {
  /** 评论列表 */
  comments?: CommentItem[]
  /** 是否显示评分 */
  showRating?: boolean
  /** 是否显示点赞 */
  showLike?: boolean
  /** 是否显示回复 */
  showReply?: boolean
  /** 是否隐藏点赞数 */
  hideLike?: boolean
  /** 是否隐藏回复数 */
  hideReply?: boolean
  /** 是否显示输入框 */
  showInput?: boolean
  /** 回复对象 */
  replyTo?: string
  /** 占位文本 */
  placeholder?: string
  /** 最大长度 */
  maxLength?: number
  /** 容器类名 */
  customClass?: string
  /** 容器样式 */
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  comments: () => [],
  showRating: false,
  showLike: true,
  showReply: true,
  hideLike: false,
  hideReply: false,
  showInput: false,
  placeholder: '说点什么吧...',
  maxLength: 500
})

const emit = defineEmits<{
  'like': [comment: CommentItem, index: number]
  'reply': [comment: CommentItem, index: number]
  'send': [content: string]
  'user-click': [user: CommentItem]
  'image-preview': [images: string[], index: number]
}>()

const inputValue = ref('')

// 输入事件
function handleInput(e: any) {
  inputValue.value = e.detail.value
}

// 获得焦点
function handleFocus() {
  // 可以处理自动滚动等
}

// 失去焦点
function handleBlur() {
  // 可以处理自动保存草稿等
}

// 点赞
function handleLike(comment: CommentItem, index: number) {
  emit('like', comment, index)
}

// 回复
function handleReply(comment: CommentItem, index: number) {
  emit('reply', comment, index)
}

// 点击用户
function handleUserClick(comment: CommentItem) {
  emit('user-click', comment)
}

// 预览图片
function handleImagePreview(images: string[], index: number) {
  uni.previewImage({
    urls: images,
    current: index
  })
  emit('image-preview', images, index)
}

// 查看更多回复
function handleViewMoreReplies(comment: CommentItem, index: number) {
  // 可以触发加载更多回复
  console.log('查看更多回复', comment)
}

// 取消输入
function handleCancelInput() {
  inputValue.value = ''
}

// 发送
function handleSend() {
  const content = inputValue.value.trim()
  if (!content) return

  emit('send', content)
  inputValue.value = ''
}
</script>

<script lang="ts">
export default {
  name: 'CommentList',
  options: {
    styleIsolation: 'shared'
  }
}
</script>

<style lang="scss" scoped>
.comment-list {
  width: 100%;

  .comment-items {
    .comment-item {
      padding: 24rpx 0;
      border-bottom: 1rpx solid var(--border-color-light);

      &:last-child {
        border-bottom: none;
      }

      .comment-user {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 16rpx;

        .user-avatar {
          width: 64rpx;
          height: 64rpx;
          border-radius: 50%;
        }

        .user-name {
          font-size: 28rpx;
          color: var(--text-color-primary);
          font-weight: 500;
        }

        .user-tag {
          margin-left: 8rpx;
          padding: 4rpx 12rpx;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
          border-radius: 8rpx;
          font-size: 20rpx;
          color: var(--bg-color-card);
        }
      }

      .comment-content {
        margin-left: 76rpx;

        .comment-rating {
          display: flex;
          gap: 4rpx;
          margin-bottom: 12rpx;

          .star-icon {
            font-size: 24rpx;
            color: var(--border-color-base);

            &.is-active {
              color: var(--warning-color);
            }
          }
        }

        .comment-text {
          display: block;
          font-size: 28rpx;
          color: var(--text-color-primary);
          line-height: 1.6;
          margin-bottom: 16rpx;
        }

        .comment-images {
          display: flex;
          gap: 8rpx;
          margin-bottom: 12rpx;

          .comment-image {
            width: 160rpx;
            height: 160rpx;
            border-radius: 8rpx;
          }
        }

        .comment-reply {
          padding: 12rpx 16rpx;
          background: var(--bg-color-disabled);
          border-radius: 8rpx;
          margin-bottom: 12rpx;

          .reply-text {
            font-size: 24rpx;
            color: var(--text-color-tertiary);
          }

          .reply-content {
            font-size: 26rpx;
            color: var(--text-color-secondary);
          }
        }
      }

      .comment-meta {
        display: flex;
        align-items: center;
        margin-left: 76rpx;
        font-size: 24rpx;

        .meta-time {
          color: var(--text-color-tertiary);
        }

        .meta-divider {
          margin: 0 12rpx;
          color: #e5e5e5;
        }

        .meta-actions {
          display: flex;
          gap: 24rpx;

          .action-btn {
            display: flex;
            align-items: center;
            gap: 4rpx;

            .btn-icon {
              font-size: 28rpx;
              color: var(--text-color-tertiary);
            }

            .btn-text {
              font-size: 24rpx;
              color: var(--text-color-tertiary);
            }

            &.is-active {
              .btn-icon {
                color: var(--danger-color);
              }

              .btn-text {
                color: var(--danger-color);
              }
            }
          }
        }
      }

      .comment-replies {
        margin-top: 16rpx;
        margin-left: 76rpx;
        padding: 16rpx;
        background: var(--bg-color-page);
        border-radius: 12rpx;

        .reply-item {
          display: flex;
          gap: 12rpx;
          padding: 12rpx 0;

          &:not(:last-child) {
            border-bottom: 1rpx solid var(--border-color-light);
          }

          &:last-child {
            padding-bottom: 0;
            border-bottom: none;
          }

          .reply-avatar {
            width: 48rpx;
            height: 48rpx;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .reply-content {
            flex: 1;

            .reply-name {
              font-size: 26rpx;
              color: var(--text-color-primary);
              font-weight: 500;
              margin-bottom: 4rpx;
            }

            .reply-text {
              font-size: 26rpx;
              color: var(--text-color-secondary);
              line-height: 1.4;
            }
          }
        }

        .view-more-replies {
          padding: 12rpx 0;
          margin-top: 8rpx;

          .more-text {
            font-size: 24rpx;
            color: var(--primary-color);
          }
        }
      }
    }
  }

  .empty-state {
    padding: 80rpx 0;
    text-align: center;

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24rpx;

      .empty-icon {
        font-size: 96rpx;
        opacity: 0.5;
      }

      .empty-text {
        font-size: 28rpx;
        color: var(--text-color-tertiary);
      }

      .empty-tip {
        font-size: 24rpx;
        color: var(--text-color-placeholder);
      }
    }
  }

  .comment-input-wrapper {
    margin-top: 24rpx;

    .comment-input {
      background: var(--bg-color-disabled);
      border-radius: 16rpx;
      padding: 16rpx;

      .input-field {
        width: 100%;
        min-height: 120rpx;
        font-size: 28rpx;
        color: var(--text-color-primary);
        line-height: 1.5;
        padding-bottom: 60rpx;
      }

      .input-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 16rpx;
        margin-top: 12rpx;

        .action-btn {
          padding: 8rpx 24rpx;
          border-radius: 24rpx;
          font-size: 26rpx;

          &.cancel-btn {
            background: var(--bg-color-card);

            .btn-text {
              color: var(--text-color-secondary);
            }
          }

          &.send-btn {
            background: var(--primary-color);

            .btn-text {
              color: var(--bg-color-card);
            }
          }

          &.is-disabled {
            opacity: 0.5;
          }
        }

        .input-limit {
          font-size: 22rpx;
          color: var(--text-color-tertiary);
        }
      }
    }
  }
}
</style>
