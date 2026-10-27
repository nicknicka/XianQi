# ADR-0010: 订单操作日志与管理员审计日志分表

## 状态
已采纳（2026-10-27）

## 背景
`operation_log` 表被设计为管理员审计日志：`admin_id` 有外键指向 `admin`（`fk_operation_log_admin`），记录后台人员对系统的操作。

但该表同时被用户侧业务复用。`OrderServiceImpl` 在创建/确认/取消/完成订单、申请/同意/拒绝退款等 7 个环节调用 `operationLogService.recordLog(...)`，记录的是买家/卖家的订单操作：

- 表内没有 `user_id` 列，用户身份只能以 `username` 字符串保存，无法按用户 ID 检索或关联。
- `#29` 修正实体列名（`userId` → `adminId`，因 `user_id` 列不存在）后，这些用户操作只能传 `adminId = null`，用户身份彻底退化为字符串。
- 若把 `admin_id` 写成用户 ID，会直接违反指向 `admin` 的外键。

也就是说，同一张表要同时承载“管理员审计”和“用户订单操作”两种语义，而外键只允许前者。

## 决策
**订单操作日志独立成表 `order_log`，`operation_log` 回归纯管理员审计。**

1. 新增 `order_log` 表：`order_log_id`（雪花主键）、`order_id`（FK → `order`）、`operator_id`（nullable，FK → `user`）、`operator_name`（冗余昵称，便于展示）、`action`（英文 code）、`detail`、`created_at`。
2. 新增 `OrderLog` 实体 / `OrderLogMapper` / `OrderLogService`（+`Impl`）/ `OrderLogVO`。
3. `OrderServiceImpl` 的 7 处订单日志改写入 `order_log`，并写入真实 `operator_id`。
4. 订单日志读取从 `OperationLogService.getOrderLogs`（按 `biz_id`/`biz_type='order'` 过滤）迁到 `OrderLogService.getOrderLogs`（按 `order_id`）。
5. `operation_log` 的 `biz_id` / `biz_type` 列保留（无破坏性变更），但不再承载订单日志。
6. `action` 统一存英文 code（`create`/`confirm`/`cancel`/`complete`/`refund_request`/`refund_approve`/`refund_reject`），展示文案由后端翻译。历史上订单日志的 `action` 存的是中文（如“创建订单”），迁移脚本做一次中文 → code 映射。
7. 迁移脚本：`sql/migrations/20261027_add_order_log_table.sql`，建表并搬移既有 `operation_log` 中的订单日志行；历史行无法还原 `operator_id`，留空。

## 理由
1. **语义清晰**：管理员审计（谁动了后台）与用户业务操作（谁动了订单）是两类不同主体、不同生命周期、不同保留策略的数据。
2. **外键正确**：`operation_log.admin_id → admin`、`order_log.operator_id → user` 各自成立，不再需要“传 null 绕过外键”。
3. **可检索**：订单日志可按用户 ID 关联，弥补纯字符串身份的缺口。
4. **展示稳定**：`OrderLogVO` 字段与旧订单视图保持一致（`logId`/`username`/`actionText`/`createTime`），移动端订单详情页无需改动。
5. **保留期差异**：管理员审计日志有 `cleanExpiredLogs` 的保留策略；订单日志属于订单档案，不应随管理员日志一起被清理。

## 后果
### 正面
- 两种日志各自拥有正确的外键与查询路径。
- 订单日志可按用户 ID 检索、可随订单长期保留。
- `operation_log` 不再接收用户操作，`admin_id` 语义纯净。

### 负面
- 新增一张表与一套实体/服务/VO，代码量增加。
- 需要迁移脚本搬移既有订单日志；历史 `operator_id` 无法还原。
- `operation_log.biz_id` / `biz_type` 成为遗留列（保留但不再由订单日志使用）。

## 备选方案
- **给 `operation_log` 增加 nullable `user_id` 列**：改动更小，但让一张表同时服务两类主体，外键与语义仍然混杂，且管理员日志清理策略会波及订单日志。
- **维持现状（仅存 username）**：零改动，但订单日志永久失去用户 ID，无法按用户检索。
