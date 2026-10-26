/**
 * 导航栏 Composable
 * 提供统一的导航栏逻辑和样式计算
 */
import { ref, computed, type Ref } from 'vue'
import { getNavBarInfo, isNotchScreen, type NavBarInfo } from '@/utils/system-info'

export interface UseNavBarOptions {
  /** 是否显示返回按钮 */
  showBack?: boolean
  /** 是否显示首页按钮 */
  showHome?: boolean
  /** 自定义背景色 */
  backgroundColor?: string
  /** 自定义文字颜色 */
  textColor?: string
}

export function useNavBar(options: UseNavBarOptions = {}) {
  // 导航栏信息
  const navBarInfo: Ref<NavBarInfo> = ref(getNavBarInfo())

  // 是否为刘海屏
  const isNotch = ref(false)

  // 初始化时检测是否为刘海屏
  isNotch.value = isNotchScreen()

  // 计算属性：导航栏样式
  const navBarStyle = computed(() => ({
    height: `${navBarInfo.value.totalHeight}px`,
    backgroundColor: options.backgroundColor || '#8EC5E8',
    color: options.textColor || '#fff'
  }))

  // 计算属性：导航栏内边距（仅状态栏高度）
  const statusBarStyle = computed(() => ({
    height: `${navBarInfo.value.statusBarHeight}px`
  }))

  // 计算属性：内容区域样式（避开导航栏）
  const contentStyle = computed(() => ({
    marginTop: `${navBarInfo.value.totalHeight}px`
  }))

  // 方法：返回上一页
  const goBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    } else {
      // 如果没有上一页，返回首页
      uni.switchTab({
        url: '/pages/index/index'
      })
    }
  }

  // 方法：返回首页
  const goHome = () => {
    uni.switchTab({
      url: '/pages/index/index'
    })
  }

  return {
    /** 导航栏信息 */
    navBarInfo,
    /** 是否为刘海屏 */
    isNotch,
    /** 导航栏样式 */
    navBarStyle,
    /** 状态栏占位样式 */
    statusBarStyle,
    /** 内容区域样式 */
    contentStyle,
    /** 返回上一页 */
    goBack,
    /** 返回首页 */
    goHome
  }
}

export default useNavBar
