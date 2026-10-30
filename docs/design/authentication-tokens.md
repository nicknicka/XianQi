# 认证设计 Token 规格

## 范围

本规格约束移动端身份认证相关页面的状态语义、颜色、尺寸、圆角和动效。实名认证页是第一个消费方；后续身份认证中心和学生认证页必须复用同一组 token，避免页面各自定义视觉参数。

## 认证状态模型

后端实名认证和学生认证共用同一状态码契约：

| 后端状态 | 页面状态 | 展示文案 | 可编辑 |
| --- | --- | --- | --- |
| `0` | `unverified` | 未认证 | 是 |
| `1` | `pending` | 审核中 | 否 |
| `2` | `verified` | 已认证 | 否 |
| `3` | `rejected` | 认证失败 | 是 |

状态转换必须通过纯状态解析函数完成，不允许可编辑页面直接比较后端状态码。失败原因优先展示后端 `rejectReason`；为空时使用共享默认文案。

## 状态语义颜色

状态色只使用主题系统已有的语义 CSS 变量：

| 页面状态 | CSS token | 主题 hook 语义色 |
| --- | --- | --- |
| `unverified` | `var(--info-color)` | `infoColor` |
| `pending` | `var(--primary-color)` | `primaryColor` |
| `verified` | `var(--success-color)` | `successColor` |
| `rejected` | `var(--danger-color)` | `dangerColor` |

文本、卡片背景、边框等普通界面颜色继续使用项目文本、背景和边框 token。`uni-icons` 等只接受运行时字符串的组件属性必须从主题 hook 取语义色；认证模板与样式内禁止新增裸色值。

## 组件尺寸 token

| Token | 值 | 使用场景 |
| --- | --- | --- |
| `--auth-page-padding` | `24rpx` | 认证页面外边距 |
| `--auth-card-padding` | `32rpx` | 表单卡、信息卡内边距 |
| `--auth-card-padding-lg` | `48rpx` | 状态卡内边距 |
| `--auth-card-radius` | `16rpx` | 认证卡片圆角 |
| `--auth-control-radius` | `12rpx` | 输入框和提交按钮圆角 |
| `--auth-control-height` | `88rpx` | 输入框和提交按钮高度 |
| `--auth-control-padding-x` | `24rpx` | 输入框横向内边距 |
| `--auth-section-gap` | `24rpx` | 表单项、说明和安全提示之间的主间距 |
| `--auth-label-gap` | `12rpx` | 标签到控件、状态标题到副文案的间距 |
| `--auth-tip-gap` | `8rpx` | 图标和提示文字、提示组内间距 |
| `--auth-upload-height` | `400rpx` | 学生证上传区和已认证证件图高度 |

字号统一使用主题字体 token：`--font-size-sm`、`--font-size-base`、`--font-size-lg`、`--font-size-xl`。卡片阴影只在确实需要突出卡片时使用主题阴影 token；认证表单默认不额外添加阴影。

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

认证页面不得新增一次性 duration、easing 或位移值。新增组件尺寸前，先判断是否可复用上表；确需新增时必须先更新本规格并说明场景。

## 使用限制

1. 认证状态码只由状态解析函数解释。
2. CSS 使用上表语义 token；运行时组件属性使用主题 hook 对应语义色。
3. 审核中和已认证状态只读，未认证和失败状态可提交。
4. 本规格是认证 token 的真源；修改值时必须同步更新消费页面和主题静态变量。
