/**
 * 全局消息事件总线
 * 用于在页面之间传递消息相关事件
 */

type EventCallback = (data: any) => void

class MessageEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 取消订阅的函数
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // 返回取消订阅的函数
    return () => {
      this.off(event, callback)
    }
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件回调执行失败 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 只订阅一次事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  once(event: string, callback: EventCallback): void {
    const onceCallback = (data: any) => {
      callback(data)
      this.off(event, onceCallback)
    }
    this.on(event, onceCallback)
  }

  /**
   * 清除所有事件监听
   */
  clear(): void {
    this.listeners.clear()
  }

  /**
   * 清除指定事件的所有监听
   * @param event 事件名称
   */
  clearEvent(event: string): void {
    this.listeners.delete(event)
  }
}

// 导出单例
export const messageEventBus = new MessageEventBus()

// 事件名称常量
export const MessageEvents = {
  // 新消息
  NEW_MESSAGE: 'new-message',
  // 未读数更新
  UNREAD_COUNT_UPDATE: 'unread-count-update',
  // 会话更新
  CONVERSATION_UPDATE: 'conversation-update',
  // 消息已读
  MESSAGE_READ: 'message-read',
  // 消息撤回
  MESSAGE_RECALLED: 'message-recalled',
  // 用户正在输入
  TYPING: 'typing',
  // 用户上线/下线
  ONLINE_STATUS_CHANGE: 'online-status-change'
}

export default messageEventBus
