/**
 * TabBar 工具函数
 * 用于统一管理底部导航栏的徽章显示
 */

function updateCustomTabBarBadge(index: number, count: number): void {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1] as any
    const tabBar = currentPage?.$scope?.getTabBar?.()

    if (!tabBar) {
      return
    }

    const setBadge = tabBar.setBadge || tabBar.$setBadge
    if (typeof setBadge === 'function') {
      setBadge(index, count > 0 ? (count > 99 ? '99+' : String(count)) : 0)
    }
  } catch (_error) {
    // 忽略自定义 TabBar 的同步错误
  }
}

/**
 * 更新消息 Tab (index: 3) 的徽章
 * @param count 未读消息数
 */
export function updateMessageBadge(count: number): void {
  if (count > 0) {
    uni.setTabBarBadge({
      index: 3,
      text: count > 99 ? '99+' : String(count)
    }).catch(() => {
      // 忽略非 TabBar 页面的错误
    })
  } else {
    uni.removeTabBarBadge({ index: 3 }).catch(() => {
      // 忽略非 TabBar 页面的错误
    })
  }

  updateCustomTabBarBadge(3, count)
}

/**
 * 清除所有 TabBar 徽章
 */
export function clearAllBadges(): void {
  const tabList = [0, 1, 2, 3, 4]
  tabList.forEach(index => {
    uni.removeTabBarBadge({ index }).catch(() => {
      // 忽略非 TabBar 页面的错误
    })

    updateCustomTabBarBadge(index, 0)
  })
}

/**
 * 设置指定 Tab 的徽章
 * @param index Tab 索引
 * @param count 未读数
 */
export function setTabBadge(index: number, count: number): void {
  if (count > 0) {
    uni.setTabBarBadge({
      index,
      text: count > 99 ? '99+' : String(count)
    }).catch(() => {
      // 忽略非 TabBar 页面的错误
    })
  } else {
    uni.removeTabBarBadge({ index }).catch(() => {
      // 忽略非 TabBar 页面的错误
    })
  }

  updateCustomTabBarBadge(index, count)
}

/**
 * 显示红点徽章
 * @param index Tab 索引
 * @param show 是否显示
 */
export function showTabBarRedDot(index: number, show: boolean): void {
  if (show) {
    uni.showTabBarRedDot({ index }).catch(() => {
      // 忽略非 TabBar 页面的错误
    })
  } else {
    uni.hideTabBarRedDot({ index }).catch(() => {
      // 忽略非 TabBar 页面的错误
    })
  }
}
