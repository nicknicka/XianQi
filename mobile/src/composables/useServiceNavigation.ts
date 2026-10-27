/**
 * 服务页面导航 Composable
 * 用于处理从"我的服务"页面进入的子页面的返回逻辑
 */
import { ref } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'

/**
 * 从服务页面进入的导航标记
 */
const FROM_SERVICES_QUERY = 'from'
const FROM_SERVICES_VALUE = 'services'

/**
 * 服务页面导航 Composable
 * 确保从"我的服务"页面进入的子页面返回时固定返回到服务页面
 */
export function useServiceNavigation() {
  // 是否从服务页面进入
  const isFromServices = ref(false)
  // 是否已处理返回
  const isBackHandled = ref(false)

  // 检查页面参数是否来自服务页面
  const checkNavigationSource = () => {
    const pages = getCurrentPages()
    if (pages.length === 0) {
      // console.warn('[ServiceNavigation] 页面栈为空')
      return
    }

    const currentPage = pages[pages.length - 1] as any
    const options = currentPage.options || {}

    isFromServices.value = options[FROM_SERVICES_QUERY] === FROM_SERVICES_VALUE

    // console.log('[ServiceNavigation] ========== 页面来源检查 ==========')
    // console.log('[ServiceNavigation] 当前页面:', currentPage.route)
    // console.log('[ServiceNavigation] 页面参数:', options)
    // console.log('[ServiceNavigation] 查询参数:', FROM_SERVICES_QUERY, '=', options[FROM_SERVICES_QUERY])
    // console.log('[ServiceNavigation] 是否来自服务页面:', isFromServices.value)
    // console.log('[ServiceNavigation] 页面栈信息:', pages.map((p: any) => p.route))
    // console.log('[ServiceNavigation] 页面栈长度:', pages.length)
    // console.log('[ServiceNavigation] ======================================')
  }

  // 处理返回到服务页面
  const handleBackToServices = () => {
    if (isBackHandled.value) {
      // console.log('[ServiceNavigation] 返回已处理，跳过')
      return false
    }

    isBackHandled.value = true

    // console.log('[ServiceNavigation] ========== 开始返回到服务页面 ==========')

    // 检查页面栈中是否存在服务页面
    const pages = getCurrentPages()
    // console.log('[ServiceNavigation] 当前页面栈:', pages.map((p: any) => p.route))

    const servicesPageIndex = pages.findIndex((page: any) => {
      return page.route && (
        page.route === 'pages/mine/services' ||
        page.route === '/pages/mine/services'
      )
    })

    // console.log('[ServiceNavigation] 服务页面索引:', servicesPageIndex)

    if (servicesPageIndex !== -1) {
      // 如果服务页面在页面栈中，使用 navigateBack 返回
      const delta = pages.length - servicesPageIndex - 1
      // console.log('[ServiceNavigation] 使用 navigateBack，delta:', delta)
      // console.log('[ServiceNavigation] 将返回到页面:', pages[servicesPageIndex].route)

      uni.navigateBack({
        delta,
        success: () => {
          // console.log('[ServiceNavigation] navigateBack 成功')
        },
        fail: (err) => {
          // console.error('[ServiceNavigation] navigateBack 失败:', err)
        }
      })
    } else {
      // console.log('[ServiceNavigation] 服务页面不在页面栈中')
      // 如果服务页面不在页面栈中，使用 redirectTo 定位到服务页面
      uni.redirectTo({
        url: '/pages/mine/services',
        success: () => {
          // console.log('[ServiceNavigation] redirectTo 成功')
        },
        fail: (err) => {
          // console.error('[ServiceNavigation] redirectTo 失败:', err)
        }
      })
    }

    // console.log('[ServiceNavigation] ======================================')

    // 返回 true 阻止默认的返回行为
    return true
  }

  // 页面加载时检查来源
  onLoad(checkNavigationSource)

  // 监听返回按钮，如果来自服务页面则拦截并返回到服务页面
  onBackPress(() => {
    // console.log('[ServiceNavigation] ========== onBackPress 触发 ==========')
    // console.log('[ServiceNavigation] isFromServices:', isFromServices.value)
    // console.log('[ServiceNavigation] isBackHandled:', isBackHandled.value)

    if (!isFromServices.value) {
      // console.log('[ServiceNavigation] 不是从服务页面进入，使用默认返回')
      return false // 使用默认返回行为
    }

    if (isBackHandled.value) {
      // console.log('[ServiceNavigation] 返回已处理，使用默认返回')
      return false // 使用默认返回行为
    }

    // console.log('[ServiceNavigation] 拦截返回，返回到服务页面')
    // 处理返回到服务页面，并阻止默认返回行为
    return handleBackToServices()
  })

  return {
    isFromServices,
    checkNavigationSource: () => checkNavigationSource(),
    handleBackToServices: () => handleBackToServices()
  }
}

/**
 * 从服务页面导航到子页面的辅助函数
 * 自动添加服务页面来源标记
 *
 * @param route 目标页面路径
 * @param params 其他查询参数
 */
export function navigateFromService(route: string, params: Record<string, string> = {}) {
  const queryString = Object.entries({
    [FROM_SERVICES_QUERY]: FROM_SERVICES_VALUE,
    ...params
  })
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  const url = queryString ? `${route}?${queryString}` : route

  // console.log('[ServiceNavigation] 从服务页面导航到:', url)

  uni.navigateTo({
    url,
    fail: (err) => {
      // console.error('[ServiceNavigation] 导航失败:', err)
      // 如果 navigateTo 失败，尝试使用 switchTab
      uni.switchTab({
        url: route
      })
    }
  })
}

/**
 * 为服务页面提供的导航辅助类型
 */
export interface ServiceNavigationOptions {
  route: string
  params?: Record<string, string>
}

/**
 * 批量导航配置
 * 用于在服务页面配置多个子页面的导航
 */
export function useServiceNavigationConfig() {
  /**
   * 配置服务页面的导航
   * 自动添加来源标记
   */
  function navigateToServicePage(service: ServiceNavigationOptions) {
    navigateFromService(service.route, service.params)
  }

  return {
    navigateToServicePage,
    navigateFromService
  }
}
