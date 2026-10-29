/**
 * 通知提醒工具类
 * 支持全局通知和局部通知
 */

type NoticeType = 'success' | 'warning' | 'error' | 'info'

interface NoticeOptions {
  /** 提示内容 */
  title: string
  /** 类型 */
  type?: NoticeType
  /** 持续时间（毫秒） */
  duration?: number
  /** 是否显示图标 */
  showIcon?: boolean
  /** 自定义图标 */
  icon?: string
  /** 是否可关闭 */
  closable?: boolean
  /** 回调函数 */
  onClick?: () => void
  onClose?: () => void
}

export interface NoticeItem extends NoticeOptions {
  id: string
  timestamp: number
}

/**
 * 通知管理类
 */
class NotificationManager {
  private notices: NoticeItem[] = []
  private listeners: Set<(notices: NoticeItem[]) => void> = new Set()

  /**
   * 添加通知
   */
  add(options: NoticeOptions | string): string {
    const id = `notice_${Date.now()}_${Math.random()}`

    const notice: NoticeItem = typeof options === 'string'
      ? {
          id,
          title: options,
          type: 'info',
          timestamp: Date.now(),
          duration: 3000
        }
      : {
          id,
          title: options.title,
          type: options.type || 'info',
          duration: options.duration ?? 3000,
          showIcon: options.showIcon ?? true,
          icon: options.icon,
          closable: options.closable ?? false,
          onClick: options.onClick,
          onClose: options.onClose,
          timestamp: Date.now()
        }

    this.notices.push(notice)
    this.notify()

    // 自动移除
    if (notice.duration && notice.duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, notice.duration)
    }

    return id
  }

  /**
   * 移除通知
   */
  remove(id: string): void {
    const index = this.notices.findIndex(n => n.id === id)
    if (index > -1) {
      const notice = this.notices[index]
      this.notices.splice(index, 1)
      notice.onClose?.()
      this.notify()
    }
  }

  /**
   * 清空所有通知
   */
  clear(): void {
    this.notices.forEach(notice => notice.onClose?.())
    this.notices = []
    this.notify()
  }

  /**
   * 获取所有通知
   */
  getAll(): NoticeItem[] {
    return this.notices
  }

  /**
   * 订阅通知变化
   */
  subscribe(listener: (notices: NoticeItem[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 通知订阅者
   */
  private notify(): void {
    this.listeners.forEach(listener => listener([...this.notices]))
  }

  /**
   * 成功通知
   */
  success(title: string, options?: Partial<NoticeOptions>): string {
    return this.add({ ...options, title, type: 'success' })
  }

  /**
   * 警告通知
   */
  warning(title: string, options?: Partial<NoticeOptions>): string {
    return this.add({ ...options, title, type: 'warning' })
  }

  /**
   * 错误通知
   */
  error(title: string, options?: Partial<NoticeOptions>): string {
    return this.add({ ...options, title, type: 'error' })
  }

  /**
   * 信息通知
   */
  info(title: string, options?: Partial<NoticeOptions>): string {
    return this.add({ ...options, title, type: 'info' })
  }
}

// 创建全局实例
export const notification = new NotificationManager()

// 图标映射
export const typeIcons: Record<NoticeType, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ'
}

/**
 * 快捷方法
 */
export const notify = {
  success: (title: string, options?: Partial<NoticeOptions>) => notification.success(title, options),
  warning: (title: string, options?: Partial<NoticeOptions>) => notification.warning(title, options),
  error: (title: string, options?: Partial<NoticeOptions>) => notification.error(title, options),
  info: (title: string, options?: Partial<NoticeOptions>) => notification.info(title, options)
}

export default {
  NotificationManager,
  notification,
  notify,
  typeIcons
}
