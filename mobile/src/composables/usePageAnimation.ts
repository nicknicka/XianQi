/**
 * 页面入场动画 Composable
 * 为子页面提供统一的入场动画效果
 */
import { ref, onMounted } from 'vue'

export interface PageAnimationOptions {
  // 动画延迟时间（毫秒）
  delay?: number
  // 动画持续时间（毫秒）
  duration?: number
  // 是否启用交错动画
  stagger?: boolean
  // 交错延迟间隔（毫秒）
  staggerDelay?: number
  // 列表项每批显示的数量
  batchSize?: number
}

export function usePageAnimation(options: PageAnimationOptions = {}) {
  const {
    delay = 50,
    duration = 400,
    stagger = true,
    staggerDelay = 50,
    batchSize = 6
  } = options

  // 页面可见性
  const pageVisible = ref(false)
  const contentOpacity = ref(0)
  const contentTransform = ref(20)

  // 列表项可见性（用于交错动画）
  const itemVisibleMap = ref<Record<number, boolean>>({})
  const loadedBatchCount = ref(0)

  /**
   * 启动页面入场动画
   */
  function startPageAnimation() {
    setTimeout(() => {
      pageVisible.value = true
      contentOpacity.value = 1
      contentTransform.value = 0
    }, delay)
  }

  /**
   * 启动列表项交错动画
   * @param totalCount 总项数
   * @param startId 起始ID（默认为0）
   */
  function startListAnimation(totalCount: number, startId = 0) {
    if (!stagger) {
      // 不使用交错动画，全部同时显示
      for (let i = startId; i < startId + totalCount; i++) {
        itemVisibleMap.value[i] = true
      }
      return
    }

    // 使用交错动画，分批显示
    const batches = Math.ceil(totalCount / batchSize)

    for (let batch = 0; batch < batches; batch++) {
      const batchDelay = delay + batch * (batchSize * staggerDelay + 100)

      setTimeout(() => {
        const start = startId + batch * batchSize
        const end = Math.min(start + batchSize, startId + totalCount)

        for (let i = start; i < end; i++) {
          itemVisibleMap.value[i] = true
        }

        loadedBatchCount.value = batch + 1
      }, batchDelay)
    }
  }

  /**
   * 重置动画状态
   */
  function resetAnimation() {
    pageVisible.value = false
    contentOpacity.value = 0
    contentTransform.value = 20
    itemVisibleMap.value = {}
    loadedBatchCount.value = 0
  }

  /**
   * 检查列表项是否可见
   */
  function isItemVisible(index: number): boolean {
    return itemVisibleMap.value[index] || false
  }

  /**
   * 获取动画样式
   */
  const pageStyle = {
    opacity: contentOpacity,
    transform: contentTransform,
    transition: pageVisible.value
      ? `opacity ${duration}ms ease-out, transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
      : 'none'
  }

  /**
   * 获取列表项样式
   */
  function getItemStyle(index: number) {
    const visible = isItemVisible(index)
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(20rpx) scale(0.98)',
      transition: `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
      transitionDelay: visible ? `${index * staggerDelay}ms` : '0ms'
    }
  }

  /**
   * 组件挂载时自动启动动画
   */
  onMounted(() => {
    startPageAnimation()
  })

  return {
    // 状态
    pageVisible,
    contentOpacity,
    contentTransform,
    itemVisibleMap,
    loadedBatchCount,

    // 方法
    startPageAnimation,
    startListAnimation,
    resetAnimation,
    isItemVisible,

    // 样式
    pageStyle,
    getItemStyle
  }
}

/**
 * 列表项动画 Composable
 * 用于列表项的独立动画控制
 */
export function useListItemAnimation(initialCount = 0) {
  const visibleItems = ref<Set<number>>(new Set())

  /**
   * 显示列表项
   */
  function showItem(index: number, delay = 0) {
    setTimeout(() => {
      visibleItems.value.add(index)
    }, delay)
  }

  /**
   * 批量显示列表项
   */
  function showItems(startIndex: number, count: number, staggerDelay = 50) {
    for (let i = 0; i < count; i++) {
      showItem(startIndex + i, i * staggerDelay)
    }
  }

  /**
   * 重置所有项
   */
  function reset() {
    visibleItems.value.clear()
  }

  /**
   * 检查项是否可见
   */
  function isVisible(index: number): boolean {
    return visibleItems.value.has(index)
  }

  /**
   * 获取项样式
   */
  function getItemStyle(index: number) {
    const visible = isVisible(index)
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16rpx) scale(0.98)',
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
  }

  return {
    visibleItems,
    showItem,
    showItems,
    reset,
    isVisible,
    getItemStyle
  }
}

/**
 * 卡片动画 Composable
 * 用于卡片式布局的动画
 */
export function useCardAnimation(cardCount: number) {
  const cardStates = ref<boolean[]>(new Array(cardCount).fill(false))

  function startAnimation() {
    cardStates.value.forEach((_, index) => {
      setTimeout(() => {
        cardStates.value[index] = true
      }, 100 + index * 80)
    })
  }

  function reset() {
    cardStates.value = new Array(cardCount).fill(false)
  }

  function getCardStyle(index: number) {
    const visible = cardStates.value[index]
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(30rpx) scale(0.95)',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
  }

  return {
    cardStates,
    startAnimation,
    reset,
    getCardStyle
  }
}
