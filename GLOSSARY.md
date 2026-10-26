# XianQi 平台术语表

本文件定义 XianQi（闲七校园）平台的核心领域术语，用于统一团队沟通和代码命名。

## 用户与身份

| 术语 | 英文 | 定义 |
|------|------|------|
| 用户 | User | 注册并使用平台的普通用户（学生） |
| 管理员 | Admin | 平台后台管理人员，负责审核、配置等 |
| 卖家 | Seller | 发布二手商品或共享物品的用户 |
| 买家 | Buyer | 购买二手商品或预约共享物品的用户 |
| 实名认证 | Real Name Auth | 用户提交身份证信息进行的身份认证 |
| 学生认证 | Student Auth | 用户提交学生证信息进行的学生身份认证 |
| 信用分 | Credit Score | 衡量用户交易信用的积分系统，初始 100 分 |

## 商品与交易

| 术语 | 英文 | 定义 |
|------|------|------|
| 商品 | Product | 二手交易模块中用户发布的待售物品 |
| 共享物品 | Share Item | 物品共享模块中用户发布的可租借物品 |
| 分类 | Category | 商品/共享物品的类别，如数码电子、书籍教材等 |
| 订单 | Order | 二手交易的交易凭证，记录买卖双方、商品、金额等 |
| 预约 | Booking | 共享物品的租借预约记录 |
| 押金 | Deposit | 共享物品租借时支付的保证金，归还后退还 |
| 评价 | Evaluation | 交易完成后买卖双方的互评，含星级和文字 |
| 追评 | Additional Review | 评价后追加的评论 |
| 退款 | Refund | 交易纠纷中申请的退款操作 |
| 秒杀 | Flash Sale | 限时低价促销活动 |
| 优惠券 | Coupon | 可用于抵扣订单金额的优惠凭证 |

## 即时通讯

| 术语 | 英文 | 定义 |
|------|------|------|
| 会话 | Conversation | 两个用户之间的聊天会话 |
| 消息 | Message | 会话中的单条聊天内容 |
| 快捷回复 | Quick Reply | 用户可预设的常用回复短语 |
| AI 聊天 | AI Chat | 用户与 AI 智能助手的对话 |

## 系统与配置

| 术语 | 英文 | 定义 |
|------|------|------|
| 轮播图 | Banner | 首页顶部轮播展示的图片广告 |
| 热门标签 | Hot Tag | 搜索热度较高的关键词标签 |
| 敏感词 | Sensitive Word | 需要过滤的违规词汇 |
| 举报 | Report | 用户对违规内容的举报 |
| 系统配置 | System Config | 平台级别的可配置参数 |
| 操作日志 | Operation Log | 管理员操作的审计日志 |
| 黑名单 | Blacklist | 用户屏蔽的对象列表 |
| 收藏 | Favorite | 用户收藏的商品/共享物品 |
| 浏览历史 | View History | 用户浏览过的商品记录 |

## AI 智能体

| 术语 | 英文 | 定义 |
|------|------|------|
| 智能体 | Agent | 基于大语言模型的 AI 角色，具备特定能力 |
| AI 服务商 | AI Provider | 为平台提供模型推理能力的外部服务方，例如智谱 |
| AI 模型 | AI Model | AI 服务商提供的具体推理模型，例如 `glm-4-flash` |
| AI 适配器 | AI Adapter | 平台内部隔离 AI 服务商实现细节的边界 |
| AI 能力开关 | AI Feature Flag | 控制平台 AI 能力是否可用的部署级开关 |
| 客服智能体 | Customer Service Agent | 自动回复用户常见问题的 AI |
| 定价顾问 | Pricing Advisor | 帮助卖家估算商品合理价格的 AI |
| 商品描述生成 | Product Description Agent | 自动生成商品文案的 AI |
| 商品推荐 | Product Recommendation Agent | 个性化推荐商品的 AI |
| 交易安全 | Trade Safety Agent | 识别交易风险并预警的 AI |

## 技术术语

| 术语 | 英文 | 定义 |
|------|------|------|
| Monorepo | Monorepo | 单一代码仓库，包含多个子项目 |
| H5 | H5 | 基于 HTML5 的移动端网页应用 |
| 小程序 | Mini Program | 微信等平台的轻量级应用 |
| WebSocket | WebSocket | 全双工实时通信协议，用于即时通讯 |
| OSS | OSS | 对象存储服务（阿里云 OSS） |
| Knife4j | Knife4j | 基于 Swagger 的 API 文档工具 |
