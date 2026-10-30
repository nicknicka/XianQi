/**
 * 页面动画组合式函数
 * 用于统一管理页面入场动画和加载状态
 */
import { ref, onMounted, nextTick, type Ref } from 'vue'

export interface PageAnimationOptions {
  // 入场动画类型
  entranceType?: 'fade' | 'slide-up' | 'slide-down' | 'zoom' | 'bounce'
  // 入场动画时长
  entranceDuration?: number
  // 入场动画延迟
  entranceDelay?: number
  // 是否显示骨架屏
  showSkeleton?: boolean
  // 是否自动执行入场动画
  autoPlay?: boolean
}

export function usePageAnimation(options: PageAnimationOptions = {}) {
  const {
    entranceType = 'fade',
    entranceDuration = 400,
    entranceDelay = 0,
    showSkeleton = false,
    autoPlay = true
  } = options

  // 加载状态
  const isLoading = ref(showSkeleton)
  const isAnimating = ref(false)
  const isReady = ref(false)

  /**
   * 执行入场动画
   */
  async function playEntranceAnimation() {
    isAnimating.value = true

    // 等待 DOM 更新
    await nextTick()

    // 延迟执行动画
    setTimeout(() => {
      isAnimating.value = false
      isReady.value = true
    }, entranceDelay + entranceDuration)
  }

  /**
   * 完成加载
   */
  async function finishLoading() {
    isLoading.value = false
    await playEntranceAnimation()
  }

  /**
   * 开始加载
   */
  function startLoading() {
    isLoading.value = true
    isReady.value = false
  }

  /**
   * 重置状态
   */
  function reset() {
    isLoading.value = showSkeleton
    isAnimating.value = false
    isReady.value = false
  }

  onMounted(() => {
    if (autoPlay && !showSkeleton) {
      playEntranceAnimation()
    }
  })

  return {
    isLoading,
    isAnimating,
    isReady,
    finishLoading,
    startLoading,
    reset,
    playEntranceAnimation
  }
}

/**
 * 页面数据加载组合式函数
 * 封装数据加载和骨架屏切换逻辑
 */
export function usePageData<T>(
  fetchFn: () => Promise<T>,
  options: PageAnimationOptions = {}
) {
  const pageAnimation = usePageAnimation(options)
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)

  /**
   * 加载数据
   */
  async function loadData(showLoadingToast = false) {
    try {
      if (showLoadingToast) {
        uni.showLoading({ title: '加载中...', mask: true })
      }

      const result = await fetchFn()
      data.value = result

      await pageAnimation.finishLoading()

      return result
    } catch (err) {
      error.value = err as Error
      pageAnimation.finishLoading()

      if (showLoadingToast) {
        uni.hideLoading()
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }

      throw err
    } finally {
      if (showLoadingToast) {
        uni.hideLoading()
      }
    }
  }

  /**
   * 刷新数据
   */
  async function refresh() {
    pageAnimation.startLoading()
    return loadData()
  }

  return {
    ...pageAnimation,
    data,
    error,
    loadData,
    refresh
  }
}

/**
 * 列表页面组合式函数
 * 用于分页列表数据加载
 */
export interface ListDataOptions<T> extends PageAnimationOptions {
  // 每页数量
  pageSize?: number
  // 初始页码
  initialPage?: number
}

export function useListData<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ list: T[]; total?: number }>,
  options: ListDataOptions<T> = {}
) {
  const {
    pageSize = 20,
    initialPage = 1,
    ...animationOptions
  } = options

  const pageAnimation = usePageAnimation(animationOptions)

  const list = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const currentPage = ref(initialPage)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 加载列表数据
   */
  async function loadPage(page: number, append = false) {
    if (isLoading.value || (append && isLoadingMore.value)) {
      return
    }

    const isLoadMore = append && page > currentPage.value
    if (isLoadMore) {
      isLoadingMore.value = true
    } else {
      isLoading.value = true
      pageAnimation.startLoading()
    }

    try {
      const result = await fetchFn(page, pageSize)

      if (append) {
        list.value = [...list.value, ...result.list]
      } else {
        list.value = result.list
      }

      total.value = result.total || result.list.length
      currentPage.value = page
      hasMore.value = result.list.length >= pageSize

      if (!isLoadMore) {
        await pageAnimation.finishLoading()
      }

      return result
    } catch (err) {
      error.value = err as Error

      if (!isLoadMore) {
        pageAnimation.finishLoading()
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }

      throw err
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  /**
   * 加载第一页
   */
  async function loadFirstPage() {
    return loadPage(initialPage, false)
  }

  /**
   * 加载更多
   */
  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value) {
      return
    }
    return loadPage(currentPage.value + 1, true)
  }

  /**
   * 刷新列表
   */
  async function refresh() {
    return loadPage(initialPage, false)
  }

  return {
    ...pageAnimation,
    list,
    total,
    currentPage,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadPage,
    loadFirstPage,
    loadMore,
    refresh
  }
}
