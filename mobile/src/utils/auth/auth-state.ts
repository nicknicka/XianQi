/**
 * 认证状态解析的单一来源。
 * 前端页面状态只消费这里的语义结果，避免各页面重复解释后端状态码。
 */

export type AuthenticationBackendStatus = 0 | 1 | 2 | 3

export type AuthenticationPageStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

/** 状态色仅使用主题系统已有的语义 CSS 变量。 */
export type AuthenticationColorToken =
  | '--info-color'
  | '--primary-color'
  | '--success-color'
  | '--danger-color'

/** uni-icons 的 color 属性无法使用 CSS 变量，页面需用同一语义映射主题 hook。 */
export type AuthenticationSemanticColor = 'info' | 'primary' | 'success' | 'danger'

export interface AuthenticationState {
  pageStatus: AuthenticationPageStatus
  label: string
  actionLabel: string
  description: string
  icon: 'info' | 'clock' | 'checkmarkempty' | 'closeempty'
  colorToken: AuthenticationColorToken
  semanticColor: AuthenticationSemanticColor
  editable: boolean
}

export interface ResolveAuthStateOptions {
  rejectReason?: string | null
}

const AUTH_STATUS_META: Record<
  AuthenticationPageStatus,
  Omit<AuthenticationState, 'description'>
> = {
  unverified: {
    pageStatus: 'unverified',
    label: '未认证',
    actionLabel: '去认证',
    icon: 'info',
    colorToken: '--info-color',
    semanticColor: 'info',
    editable: true
  },
  pending: {
    pageStatus: 'pending',
    label: '审核中',
    actionLabel: '审核中',
    icon: 'clock',
    colorToken: '--primary-color',
    semanticColor: 'primary',
    editable: false
  },
  verified: {
    pageStatus: 'verified',
    label: '已认证',
    actionLabel: '已认证',
    icon: 'checkmarkempty',
    colorToken: '--success-color',
    semanticColor: 'success',
    editable: false
  },
  rejected: {
    pageStatus: 'rejected',
    label: '认证失败',
    actionLabel: '重新认证',
    icon: 'closeempty',
    colorToken: '--danger-color',
    semanticColor: 'danger',
    editable: true
  }
}

const DEFAULT_DESCRIPTIONS: Record<AuthenticationPageStatus, string> = {
  unverified: '完成实名认证，提高账户安全性',
  pending: '您的认证信息正在审核中',
  verified: '实名认证已完成',
  rejected: '认证失败，请重新提交'
}

export function resolveAuthState(
  status?: number | null,
  options: ResolveAuthStateOptions = {}
): AuthenticationState {
  const pageStatus: AuthenticationPageStatus =
    status === 0
      ? 'unverified'
      : status === 1
        ? 'pending'
        : status === 2
          ? 'verified'
          : status === 3
            ? 'rejected'
            : 'unverified'

  return {
    ...AUTH_STATUS_META[pageStatus],
    description:
      pageStatus === 'rejected' && options.rejectReason
        ? options.rejectReason
        : DEFAULT_DESCRIPTIONS[pageStatus]
  }
}
