<template>
  <view class="custom-tab-bar" :style="{ background: tabBarBg, borderTopColor: borderColor }">
    <view
      v-for="(item, index) in tabList"
      :key="index"
      class="tab-item"
      :class="{ active: currentIndex === index }"
      @click="switchTab(index, item.pagePath)"
    >
      <view class="icon-wrapper">
        <!-- SVG 图标 - 完美支持颜色切换 -->
        <view class="svg-icon" :style="{ color: currentIndex === index ? activeColor : inactiveColor }">
          <rich-text :nodes="item.svgIcon"></rich-text>
        </view>
        <!-- 红点提示 -->
        <view v-if="item.badge && item.badge !== '0'" class="badge" :class="{ dot: item.badge === 'dot' }">
          {{ item.badge === 'dot' ? '' : item.badge }}
        </view>
      </view>
      <text class="tab-text" :style="{ color: currentIndex === index ? activeColor : inactiveColor, fontSize: textSize }">
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { themeManager } from '@/utils/theme'
const { theme } = useTheme()

// 当前选中的索引
const currentIndex = ref(0)

// TabBar 配置 - 使用内联 SVG 图标
const tabList = ref([
  {
    text: '首页',
    pagePath: '/pages/index/index',
    svgIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    badge: ''
  },
  {
    text: '交易',
    pagePath: '/pages/market/list',
    svgIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    badge: ''
  },
  {
    text: '共享',
    pagePath: '/pages/share/index',
    svgIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
    badge: ''
  },
  {
    text: '消息',
    pagePath: '/pages/message/index',
    svgIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    badge: '0' // 可以设置未读消息数
  },
  {
    text: '我的',
    pagePath: '/pages/mine/index',
    svgIcon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    badge: ''
  }
])

// 根据主题获取颜色
const activeColor = computed(() => themeManager.getCurrentPreset().colors.primaryColor)
const inactiveColor = computed(() => '#AAAAAA')
const tabBarBg = computed(() => theme.value.isDark ? '#1a1a1a' : '#ffffff')
const borderColor = computed(() => '#F0F0F0')
const textSize = computed(() => {
  const scale = theme.value.fontSizeScale
  return `${10 * scale}px`
})

// 切换 Tab
function switchTab(index: number, path: string) {
  if (currentIndex.value === index) return

  currentIndex.value = index

  uni.switchTab({
    url: path,
    fail: () => {
      // 如果不是 tabBar 页面，使用 navigateTo
      uni.navigateTo({ url: path })
    }
  })
}

// 获取当前页面路径，设置高亮
onMounted(() => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route

    const index = tabList.value.findIndex(item => item.pagePath === currentPath)
    if (index !== -1) {
      currentIndex.value = index
    }
  }
})

// 暴露方法给外部调用
defineExpose({
  setBadge: (index: number, badge: string | number) => {
    if (tabList.value[index]) {
      tabList.value[index].badge = String(badge)
    }
  },
  setCurrentIndex: (index: number) => {
    currentIndex.value = index
  }
})
</script>

<style lang="scss" scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid;
  background: var(--bg-color-card);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
  box-shadow: var(--box-shadow-card);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50px;
  position: relative;
  padding: 6px 0;
  transition: all 0.3s;
}

.icon-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.tab-text {
  font-size: 10px;
  line-height: 1;
  transition: color 0.3s;
}

.badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
  background: var(--danger-color, #ff4d4f);
  color: var(--text-color-inverse, #ffffff);
  font-size: 10px;
  text-align: center;
  border-radius: 50%;
  border: 2px solid var(--bg-color-card);
  transform: scale(1);
  transition: transform 0.2s;
  box-shadow: 0 2px 6px var(--danger-color-alpha-30, rgba(255, 77, 79, 0.4));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.badge.dot {
  min-width: 8px;
  width: 8px;
  height: 8px;
  padding: 0;
  right: -4px;
  border-radius: 50%;
}

.tab-item.active .badge {
  transform: scale(1.1);
}

/* SVG 样式 */
:deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

:deep(svg path),
:deep(svg circle),
:deep(svg line),
:deep(svg polyline),
:deep(svg rect) {
  transition: stroke 0.3s;
}
</style>
