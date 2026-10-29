<template>
  <view class="markdown-render">
    <!-- H5 平台使用 v-html 渲染 -->
    <!-- #ifdef H5 -->
    <view class="markdown-content markdown-h5" v-html="renderedHtml"></view>
    <!-- #endif -->

    <!-- 小程序平台使用富文本组件 -->
    <!-- #ifndef H5 -->
    <view class="markdown-content markdown-mp">
      <rich-text :nodes="renderedNodes"></rich-text>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content: string
  options?: {
    breaks?: boolean
    gfm?: boolean
    sanitize?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  options: () => ({
    breaks: true,
    gfm: true,
    sanitize: false // 简化版不使用 sanitize
  })
})

// 渲染 Markdown 为 HTML
const renderedHtml = computed(() => {
  if (!props.content) return ''

  // #ifdef H5
  try {
    // H5 平台：动态导入 marked 和 DOMPurify
    return renderMarkdownH5(props.content, props.options)
  } catch (error) {
    console.error('[Markdown Render] H5 渲染失败:', error)
    return simpleRenderMarkdown(props.content)
  }
  // #endif

  // #ifndef H5
  // 小程序平台：使用纯 JavaScript 实现
  // eslint-disable-next-line no-unreachable -- UniApp 条件编译在 lint 阶段不会剔除 H5 分支
  return simpleRenderMarkdown(props.content)
  // #endif
})

// 小程序平台的节点数组
const renderedNodes = computed(() => {
  if (!props.content) return []

  const html = simpleRenderMarkdown(props.content)
  return html
})

// #ifdef H5
// H5 平台渲染函数
async function renderMarkdownH5(content: string, options: any) {
  try {
    // 动态导入（只在 H5 环境）
    const { marked } = await import('marked')
    const DOMPurify = await import('dompurify')

    // 配置 marked
    marked.setOptions({
      breaks: options.breaks,
      gfm: options.gfm
    })

    // marked.parse 的返回类型是 string | Promise<string>（配置异步扩展时会返回
    // Promise）。此处未启用异步扩展，运行时必为 string，故显式收窄。
    let html = marked.parse(content) as string

    // 清理 HTML
    if (options.sanitize) {
      try {
        html = DOMPurify.default.sanitize(html, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr',
            'strong', 'b', 'em', 'i', 'u', 's', 'del',
            'a', 'img',
            'ul', 'ol', 'li',
            'blockquote',
            'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td'
          ],
          ALLOWED_ATTR: [
            'href', 'title', 'target',
            'src', 'alt', 'width', 'height',
            'class'
          ]
        })
      } catch (e) {
        console.warn('[Markdown Render] DOMPurify 失败，跳过清理')
      }
    }

    return addMarkdownClasses(html)
  } catch (e) {
    console.warn('[Markdown Render] 动态导入失败，使用简化版')
    throw e
  }
}
// #endif

// 纯 JavaScript 实现的简化 Markdown 解析器（所有平台通用）
function simpleRenderMarkdown(text: string): string {
  if (!text) return ''

  let html = text
    // 转义 HTML 特殊字符
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 1. 代码块（优先处理，避免内部被处理）
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
  })

  // 2. 行内代码
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')

  // 3. 标题（h1-h6）
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

  // 4. 引用块
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="markdown-blockquote">$1</blockquote>')

  // 5. 水平线
  html = html.replace(/^---$/gm, '<hr class="markdown-hr">')
  html = html.replace(/^\*\*\*$/gm, '<hr class="markdown-hr">')

  // 6. 粗体和斜体（从长到短匹配）
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 7. 无序列表
  html = html.replace(/^[*-]\s+(.+)$/gm, '<li>$1</li>')

  // 8. 有序列表
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')

  // 9. 处理连续的列表项
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (/^\d+\./.test(match.replace(/<li>/g, ''))) {
      return `<ol>${match}</ol>`
    }
    return `<ul>${match}</ul>`
  })

  // 10. 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

  // 11. 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // 12. 段落
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br>')

  // 13. 删除线
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // 14. 包装段落
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`
  }

  return addMarkdownClasses(html)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function addMarkdownClasses(html: string): string {
  return [
    ['h1', 'markdown-h1'],
    ['h2', 'markdown-h2'],
    ['h3', 'markdown-h3'],
    ['h4', 'markdown-h4'],
    ['h5', 'markdown-h5-heading'],
    ['h6', 'markdown-h6-heading'],
    ['p', 'markdown-paragraph'],
    ['ul', 'markdown-list markdown-list-unordered'],
    ['ol', 'markdown-list markdown-list-ordered'],
    ['li', 'markdown-list-item'],
    ['code', 'markdown-code'],
    ['pre', 'markdown-pre'],
    ['table', 'markdown-table'],
    ['tr', 'markdown-table-row'],
    ['th', 'markdown-table-header'],
    ['td', 'markdown-table-cell'],
    ['a', 'markdown-link'],
    ['img', 'markdown-image'],
    ['strong', 'markdown-strong'],
    ['b', 'markdown-strong'],
    ['em', 'markdown-emphasis'],
    ['i', 'markdown-emphasis'],
    ['del', 'markdown-delete']
  ].reduce((result, [tagName, className]) => addClassToTag(result, tagName, className), html)
}

function addClassToTag(html: string, tagName: string, className: string): string {
  const tagPattern = new RegExp(`<${tagName}(\\s[^>]*?)?(\\s*\\/?)>`, 'g')

  return html.replace(tagPattern, (match, attrs = '', selfClosing = '') => {
    if (!attrs) {
      return `<${tagName} class="${className}"${selfClosing}>`
    }

    if (/class\s*=/.test(attrs)) {
      return match.replace(/class\s*=\s*"([^"]*)"/, (classMatch, existingClasses) => {
        const classes = existingClasses.split(/\s+/).filter(Boolean)
        if (!classes.includes(className)) {
          classes.push(className)
        }
        return `class="${classes.join(' ')}"`
      })
    }

    return `<${tagName}${attrs} class="${className}"${selfClosing}>`
  })
}
</script>

<style lang="scss" scoped>
.markdown-render {
  width: 100%;
  word-wrap: break-word;
  word-break: break-word;
}

.markdown-content {
  // 基础样式
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color-primary);

  // 标题样式
  :deep(.markdown-h1),
  :deep(.markdown-h2),
  :deep(.markdown-h3),
  :deep(.markdown-h4),
  :deep(.markdown-h5-heading),
  :deep(.markdown-h6-heading) {
    margin-top: 24rpx;
    margin-bottom: 16rpx;
    font-weight: 600;
    line-height: 1.25;
  }

  :deep(.markdown-h1) {
    font-size: 32rpx;
    border-bottom: 1px solid var(--border-color-base);
    padding-bottom: 8rpx;
  }

  :deep(.markdown-h2) {
    font-size: 28rpx;
    border-bottom: 1px solid var(--border-color-base);
    padding-bottom: 8rpx;
  }

  :deep(.markdown-h3) {
    font-size: 24rpx;
  }

  :deep(.markdown-h4) {
    font-size: 20rpx;
  }

  // 段落样式
  :deep(.markdown-paragraph) {
    margin-top: 0;
    margin-bottom: 16rpx;
  }

  // 列表样式
  :deep(.markdown-list) {
    margin-top: 0;
    margin-bottom: 16rpx;
    padding-left: 32rpx;
  }

  :deep(.markdown-list-item) {
    margin-bottom: 4rpx;
  }

  // 引用样式
  :deep(.markdown-blockquote) {
    margin: 16rpx 0;
    padding: 8rpx 16rpx;
    border-left: 4rpx solid var(--primary-color);
    color: var(--text-color-secondary);
    background-color: rgba(255, 107, 0, 0.03);
    border-radius: 4rpx;
  }

  // 代码样式
  :deep(.markdown-code) {
    padding: 2rpx 6rpx;
    margin: 0 2rpx;
    font-size: 85%;
    background-color: rgba(255, 107, 0, 0.08);
    border-radius: 3rpx;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    color: var(--danger-color);
  }

  :deep(.markdown-pre) {
    padding: 16rpx;
    overflow: auto;
    font-size: 13px;
    line-height: 1.45;
    background-color: var(--bg-color-disabled);
    border: 1px solid var(--border-color-light);
    border-radius: 6rpx;
    margin-bottom: 16rpx;
  }

  :deep(.markdown-pre .markdown-code) {
    padding: 0;
    margin: 0;
    font-size: 100%;
    background-color: transparent;
    color: inherit;
    white-space: pre;
  }

  // 表格样式
  :deep(.markdown-table) {
    border-spacing: 0;
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 16rpx;
    overflow: hidden;
    border-radius: 8rpx;
  }

  :deep(.markdown-table-header), :deep(.markdown-table-cell) {
    padding: 6rpx 13rpx;
    border: 1px solid var(--border-color-light);
  }

  :deep(.markdown-table-header) {
    font-weight: 600;
    background-color: rgba(255, 107, 0, 0.05);
  }

  :deep(.markdown-table-row) {
    background-color: var(--bg-color-card);
    border-top: 1px solid var(--border-color-base);
  }

  :deep(.markdown-table-row:nth-child(2n)) {
    background-color: rgba(246, 248, 250, 0.5);
  }

  // 分隔线
  :deep(.markdown-hr) {
    height: 2rpx;
    padding: 0;
    margin: 24rpx 0;
    background-color: var(--border-color-base);
    border: 0;
  }

  // 链接样式
  :deep(.markdown-link) {
    color: var(--primary-color);
    text-decoration: none;
  }

  :deep(.markdown-link:hover) {
    text-decoration: underline;
  }

  // 图片样式
  :deep(.markdown-image) {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 16rpx 0;
    border-radius: 4rpx;
  }

  // 强调样式
  :deep(.markdown-strong) {
    font-weight: 600;
  }

  :deep(.markdown-emphasis) {
    font-style: italic;
  }

  :deep(.markdown-delete) {
    text-decoration: line-through;
  }
}

// H5 平台特殊样式
.markdown-h5 {
  :deep(.markdown-pre) {
    white-space: pre;
  }
}

// 小程序平台样式
.markdown-mp {
  // 小程序 rich-text 组件的特殊处理
  :deep(.markdown-code) {
    font-family: monospace;
  }
}
</style>
