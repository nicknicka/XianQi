# 认证设计 Token 规格

## 范围

本规格约束移动端身份认证相关页面的状态语义、颜色、字体、间距、圆角、阴影、尺寸和动效。身份认证中心、实名认证页和学生认证页是当前消费方；后续认证组件必须复用同一组 token，避免页面各自定义视觉参数。

## 认证状态模型

后端实名认证和学生认证共用同一状态码契约：

| 后端状态 | 页面状态 | 展示文案 | 可编辑 |
| --- | --- | --- | --- |
| `0` | `unverified` | 未认证 | 是 |
| `1` | `pending` | 审核中 | 否 |
| `2` | `verified` | 已认证 | 否 |
| `3` | `rejected` | 认证失败 | 是 |

状态转换必须通过纯状态解析函数完成，不允许可编辑页面直接比较后端状态码。失败原因优先展示后端 `rejectReason`；为空时使用共享默认文案。

## 颜色 token

### 页面与内容色

| Token | 语义 | 使用场景 |
| --- | --- | --- |
| `--bg-color-page` | 页面背景 | 认证页面、输入框和上传区背景 |
| `--bg-color-card` | 卡片背景 | 状态卡、表单卡、信息卡；也作为主色按钮文字的对比色 |
| `--bg-color-warm` | 次级页面背景 | 学生认证锁定卡背景 |
| `--text-color-primary` | 主文本 | 标题、输入内容、信息值 |
| `--text-color-secondary` | 次文本 | 认证权益说明 |
| `--text-color-tertiary` | 辅助文本 | 说明、提示、锁定状态和禁用语义图标 |
| `--border-color-light` | 轻分隔边框 | 信息项分隔线 |
| `--box-shadow-xs` | 轻阴影 | 可点击状态卡的按压反馈 |

### 状态语义色

状态色只使用主题系统已有的语义 CSS 变量：

| 页面状态 | CSS token | 主题 hook 语义色 |
| --- | --- | --- |
| `unverified` | `var(--info-color)` | `infoColor` |
| `pending` | `var(--primary-color)` | `primaryColor` |
| `verified` | `var(--success-color)` | `successColor` |
| `rejected` | `var(--danger-color)` | `dangerColor` |

`uni-icons` 等只接受运行时字符串的组件属性必须从 `useThemeColors()` 取语义色；CSS 样式必须使用语义 CSS 变量。认证模板与样式内禁止新增裸颜色值、`rgb()`/`rgba()` 或未登记命名色。

## 字体 token

| Token | 语义 | 使用场景 |
| --- | --- | --- |
| `--font-size-sm` | 小字号 | 辅助说明、状态徽标、上传文案 |
| `--font-size-base` | 基础字号 | 正文、表单、信息行 |
| `--font-size-lg` | 大字号 | 卡片标题、表单标题、提交按钮 |
| `--font-size-xl` | 特大字号 | 状态标题 |
| `--auth-font-weight-semibold` | 强调字重 `600` | 页面标题、卡片标题和状态标题 |

认证页面不得新增数字字重。

## 尺寸与圆角 token

| Token | 值 | 使用场景 |
| --- | --- | --- |
| `--auth-page-min-height` | `100vh` | 认证页面最小高度 |
| `--auth-page-padding` | `24rpx` | 认证页面外边距 |
| `--auth-card-padding` | `32rpx` | 表单卡、信息卡、权益区、页面头部内边距 |
| `--auth-card-padding-lg` | `48rpx` | 状态卡内边距 |
| `--auth-card-radius` | `16rpx` | 认证卡片圆角 |
| `--auth-control-radius` | `12rpx` | 输入框、按钮、上传区圆角 |
| `--auth-control-height` | `88rpx` | 输入框、提交按钮和操作按钮高度 |
| `--auth-control-padding-x` | `24rpx` | 输入框横向内边距 |
| `--auth-section-gap` | `24rpx` | 卡片、表单项、说明和安全提示之间的主间距 |
| `--auth-label-gap` | `12rpx` | 标签到控件、状态标题到副文案的间距 |
| `--auth-tip-gap` | `8rpx` | 图标和提示文字、提示组内间距 |
| `--auth-upload-height` | `400rpx` | 学生证上传区和已认证证件图高度 |
| `--auth-divider-width` | `1px` | 信息项分隔线宽度 |

安全区继续使用平台提供的 `env(safe-area-inset-bottom)`，不复制具体机型数值。

## 运行时组件 token

`uni-icons` 的 `size` 属性和其他运行时 JS 参数不能可靠消费 CSS 变量，因此集中在共享认证 token 模块：

| Token | 值 | 使用场景 |
| --- | --- | --- |
| `AUTH_ICON_SIZES.status` | `48` | 页面状态主图标 |
| `AUTH_ICON_SIZES.card` | `24` | 认证任务卡主图标 |
| `AUTH_ICON_SIZES.section` | `20` | 区块标题图标 |
| `AUTH_ICON_SIZES.benefit` | `18` | 权益列表图标 |
| `AUTH_ICON_SIZES.inline` | `16` | 徽标、提示和跳转小图标 |
| `AUTH_ICON_SIZES.upload` | `40` | 上传占位图标 |
| `AUTH_PAGE_ANIMATION_DELAY_MS` | `50` | 页面进入动画的 JS 启动延迟 |
| `AUTH_INPUT_CURSOR_SPACING_PX` | `16` | 输入框与键盘保持的安全距离 |

新增运行时尺寸前，先判断是否可复用上表；确需新增时必须先更新本规格和 token 模块。

## 动效 token

| Token | 值 | 使用场景 |
| --- | --- | --- |
| `--motion-duration-fast` | `200ms` | 轻量反馈 |
| `--motion-duration-base` | `400ms` | 页面进入 |
| `--motion-duration-slow` | `500ms` | 主内容进入 |
| `--motion-delay-fast` | `50ms` | 主内容进入延迟 |
| `--motion-delay-base` | `100ms` | 次级内容进入延迟 |
| `--motion-distance-page` | `40rpx` | 页面进入位移 |
| `--motion-ease-standard` | `cubic-bezier(0.16, 1, 0.3, 1)` | 认证页面标准缓动 |

认证页面不得新增一次性 duration、delay、easing 或位移值。

## 平台页面配置色

| Token | 值 | 使用场景 |
| --- | --- | --- |
| `AUTH_NAVIGATION_BAR_BACKGROUND` | `#8EC5E8` | 三张认证页在 `pages.json` 中的导航栏背景 |

该值属于 UniApp 页面配置的原生静态值，不能使用 CSS 变量；token 守卫只允许认证页使用这个已登记值，其他导航栏色值会判定为 drift。

## Token 守卫

在 `mobile/` 下执行：

```bash
npm run check:auth-tokens
```

守卫覆盖三张认证页面、共享认证组件、认证状态/主题/校验模块、认证运行时 token 模块和认证页 `pages.json` 导航配置，检查裸颜色值、数字字重、硬编码图标尺寸、一次性绝对尺寸和一次性动效延迟。新增 token 必须先登记到本规格，再更新消费方；不允许使用 `@ts-ignore` 或宽泛 `any` 绕过。

## 使用限制

1. 认证状态码只由状态解析函数解释。
2. CSS 使用上表语义 token；运行时组件颜色属性使用主题 hook 对应语义色。
3. 审核中和已认证状态只读，未认证和失败状态可提交。
4. 本规格是认证 token 的真源；修改值时必须同步更新消费页面、主题静态变量或认证运行时 token 模块。
