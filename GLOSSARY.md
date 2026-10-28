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

## 数据库与 ID 契约

| 术语 | 英文 | 定义 |
|------|------|------|
| 业务主键 | Business Primary Key | 领域聚合根的唯一标识，如 user_id、product_id、order_id。数据库类型为 signed BIGINT，Java 类型为 Long，使用雪花算法（ASSIGN_ID）生成。不是自增 ID，也不是业务编号。 |
| 业务编号 | Business Number | 面向用户或外部系统的可读编号，如订单号 order_no、退款号 refund_no、支付流水号 payment_no。通常为字符串，有业务含义和格式要求，与业务主键完全分离。 |
| ID 对外契约 | ID External Contract | 所有通过 HTTP、WebSocket 等对外接口传递的业务主键一律序列化为字符串。前端 TypeScript 中 ID 一律使用 string 类型。禁止使用 parseInt、Number() 或数值运算处理 ID。 |
| 时间字段契约 | Time Field Contract | 所有创建时间与更新时间，无论数据库列、Java 字段还是对外接口，一律使用 createdAt / updatedAt（数据库列 created_at / updated_at）。已废弃的 createTime / updateTime 仅允许存在于纯前端的本地草稿存储中，不得用于任何后端字段、接口字段或排序参数。 |
| 数据库基线 | Database Baseline | `sql/schema.sql` 是数据库结构的真源（source of truth）。空数据库执行 schema.sql + 基础 data.sql 必须一次成功，作为每次重建的基准。后续结构变更通过 `sql/migrations/` 下的手动迁移脚本演进。 |
| 初始化数据 | Initialization Data | `sql/data.sql` 中系统运行所必需的基础数据，如管理员账号、系统配置、默认分类、校园位置等。不含任何测试用户、测试商品或演示场景数据。 |
| 演示数据 | Demo Data | 仅用于开发、演示和本地调试的样本数据，如测试用户、测试商品、测试订单、测试聊天记录等。不进入 data.sql，单独存放在开发 seed 中，生产环境不加载。 |
| 软删除 | Soft Delete | 通过 deleted 标记列实现的逻辑删除，仅用于确实需要保留删除记录的聚合根。不是所有表都需要软删除，关联表、日志表、统计表等通常使用物理删除。 |
| 手动迁移 | Manual Migration | 结构变更通过 `sql/migrations/` 下按时间命名的 SQL 脚本手动执行，不使用 Flyway/Liquibase 等自动迁移工具。版本追踪靠脚本命名和部署记录。 |
| Fresh-init 验证 | Fresh-init Verification | 在空 MySQL volume 上执行完整 schema + 基础 data.sql，验证退出码、表清单、外键约束和必要基础数据的自动化测试。纳入 CI，确保数据库基线始终可从零重建。 |
