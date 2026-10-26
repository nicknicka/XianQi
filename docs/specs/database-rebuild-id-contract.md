# 数据库重建与 ID 契约 Spec（草稿）

> **状态**：草稿，待确认
> **创建日期**：2026-10-27
> **对应 ADR**：ADR-0004（修订）、ADR-0008（新增）

## 一、背景与目标

当前数据库存在以下问题：

1. `schema.sql` 定义了 50 张表，但首次 MySQL 初始化在 `product` 表创建外键时失败（ERROR 3780：seller_id BIGINT UNSIGNED 与 user.user_id signed BIGINT 不兼容），实际只有 14 张表创建成功。
2. 主键/外键类型混用：signed BIGINT、BIGINT UNSIGNED、INT UNSIGNED 同时存在。
3. 时间字段命名不统一：`created_at` / `updated_at` 与 `create_time` / `update_time` 两套并存。
4. schema、实体、业务代码存在大量字段级不一致。
5. `data.sql` 混入备份表（user_backup_20260302、system_notification_backup、operation_log_backup）、历史 dump 和未定义视图（v_user_credit_info）。
6. 5 个实体引用了 schema 未定义的表：credit_alert、credit_daily_stat、credit_record、deposit_record、user_coupon。
7. BaseEntity 无条件携带 `@TableLogic`，导致软删除泛滥。
8. DTO/VO 中 categoryId 等 ID 字段定义为 Integer，与雪花 Long 主键不匹配。
9. 前端多处 ID 使用 number 或 `string | number`，存在精度丢失风险。

**目标**：重写 schema.sql 建立新的数据库基线，统一 ID 契约（signed BIGINT + Long + 字符串对外），清理无用对象，补全缺失表，使数据库从零初始化一次成功，全链路 ID 无精度丢失。

---

## 二、表清单总览

### 2.1 分类规则

按以下状态分类：
- **保留**：schema 已有、业务需要、字段基本一致的表
- **合并**：1:1 扩展表合并到主表（user_profile、user_preference、user_credit_ext → user）
- **新增**：实体已存在但 schema 缺失的表
- **删除**：备份表、历史 dump、空壳表、未定义视图

### 2.2 完整分类表

#### 保留（38 张）

| # | 表名 | 功能域 | 备注 |
|---|------|--------|------|
| 1 | user | 用户与认证 | 合并扩展字段后字段增多 |
| 2 | user_real_name_auth | 用户与认证 | 独立审核生命周期，保留 |
| 3 | user_student_auth | 用户与认证 | 独立审核生命周期，保留 |
| 4 | login_device | 用户与认证 | 保留 |
| 5 | user_address | 用户与认证 | 保留 |
| 6 | user_follow | 用户与认证 | 保留 |
| 7 | blacklist | 用户与认证 | 保留 |
| 8 | admin | 用户与认证 | 保留 |
| 9 | admin_login_log | 用户与认证 | 保留 |
| 10 | admin_session | 用户与认证 | 保留 |
| 11 | product | 商品 | 保留，修复外键类型 |
| 12 | product_image | 商品 | 保留 |
| 13 | product_favorite | 商品 | 保留 |
| 14 | product_view_history | 商品 | 保留 |
| 15 | product_statistics | 商品 | 保留 |
| 16 | share_item | 共享 | 保留 |
| 17 | share_item_image | 共享 | 保留 |
| 18 | share_item_booking | 共享 | 保留 |
| 19 | category | 商品/共享 | 保留，INT → BIGINT |
| 20 | order | 订单与退款 | 保留 |
| 21 | evaluation | 评价与信用 | 保留 |
| 22 | refund_record | 订单与退款 | 保留 |
| 23 | transfer_record | 订单与退款 | 保留 |
| 24 | conversation | 聊天 | 保留 |
| 25 | conversation_member | 聊天 | 保留 |
| 26 | message | 聊天 | 保留 |
| 27 | quick_reply | 聊天 | 保留 |
| 28 | banner | 配置与审计 | 保留 |
| 29 | coupon | 优惠券 | 保留 |
| 30 | flash_sale_product | 秒杀 | 保留 |
| 31 | flash_sale_session | 秒杀 | 保留 |
| 32 | flash_sale_session_template | 秒杀 | 保留 |
| 33 | flash_sale_order_ext | 秒杀 | 保留 |
| 34 | hot_tag | 配置与审计 | 保留 |
| 35 | system_config | 配置与审计 | 保留 |
| 36 | system_notification | 通知 | 保留 |
| 37 | notification_read_records | 通知 | 保留 |
| 38 | operation_log | 配置与审计 | 保留 |
| 39 | report | 举报与反馈 | 保留 |
| 40 | user_feedback | 举报与反馈 | 保留 |
| 41 | sensitive_word | 配置与审计 | 保留 |
| 42 | campus_location | 配置与审计 | 保留 |
| 43 | ai_chat_history | AI 聊天 | 保留 |

> 注：原统计为 38 张保留，实际逐一清点为 43 张（含合并前的 user）。合并 3 张扩展表到 user 后净减 2 张，加上 5 张新增，最终约 46 张业务表。最终数量以实际建模为准，不以数量为验收目标。

#### 合并（3 张 → 并入 user）

| 表名 | 合并去向 | 理由 |
|------|----------|------|
| user_profile | user | 1:1 用户资料扩展，无独立生命周期 |
| user_preference | user | 1:1 用户偏好设置，无独立生命周期 |
| user_credit_ext | user | 1:1 信用扩展，无独立审核流程 |

> 实名认证（user_real_name_auth）、学生认证（user_student_auth）有独立审核生命周期，继续独立保留。

#### 新增（5 张）

| 表名 | 功能域 | 对应实体 |
|------|--------|----------|
| credit_alert | 评价与信用 | CreditAlert |
| credit_daily_stat | 评价与信用 | CreditDailyStat |
| credit_record | 评价与信用 | CreditRecord |
| deposit_record | 共享 | DepositRecord |
| user_coupon | 优惠券 | UserCoupon |

#### 删除（7 个对象）

| 对象名 | 类型 | 理由 |
|--------|------|------|
| user_backup_20260302 | 表 | 历史备份，仅出现在 data.sql |
| system_notification_backup | 表 | 历史备份，仅出现在 data.sql |
| operation_log_backup | 表 | 历史备份，仅出现在 data.sql |
| user_privacy | 表 | 未在 schema 定义，无对应实体，仅 data.sql 空引用 |
| user_security | 表 | 未在 schema 定义，无对应实体，仅 data.sql 空引用 |
| v_user_credit_info | 视图 | 历史 dump 遗留，无业务调用链 |
| worker_node | 表 | 空壳表，无实际业务调用链 |
| statistics_cache | 表 | 空壳表，无实际业务调用链 |
| error_log | 表 | 空壳表，无实际业务调用链 |
| export_log | 表 | 空壳表，无实际业务调用链 |

> **注意**：worker_node、statistics_cache、error_log、export_log 当前存在对应 Mapper 和实体，但未发现运行时业务调用。如果实现阶段发现确有调用，停止并报告冲突，不静默保留。


---

## 三、保留/新增表详细定义

以下列出每张保留和新增表的核心结构信息。**所有主键和外键均为 signed BIGINT**，时间字段统一为 created_at / updated_at。软删除仅标注为"有"的表才存在 deleted 列。

### 3.1 用户与认证域

#### user（合并后）

- **领域主键**：user_id (signed BIGINT, ASSIGN_ID)
- **合并来源**：user + user_profile + user_preference + user_credit_ext
- **外键**：无
- **时间字段**：created_at, updated_at, last_login_time
- **软删除**：有（deleted）
- **唯一索引**：uk_username (username), uk_phone (phone)
- **查询索引**：idx_status (status), idx_wechat_openid (wechat_openid), idx_created_at (created_at)
- **字段合并明细**：
  - 来自 user_profile：real_name, gender, birthday, bio, location, homepage, tags, followers_count, following_count, products_count, favorites_count
  - 来自 user_preference：theme, auto_dark_mode, font_size, device_type, language, notification_enabled, sound_enabled, vibration_enabled
  - 来自 user_credit_ext：credit_level, last_active_time, last_credit_decay_time, total_positive_evaluations, total_neutral_evaluations, total_negative_evaluations, zhima_credit_score, zhima_auth_time
  - 原 user 已有：credit_score（保留，作为当前信用分主字段）
- **注意**：user 实体已有 student_id、real_name、college、major、is_verified、phone_search_enabled、location_enabled 等字段，需与 user_profile 的 real_name、location 等去重，保留语义明确的版本。冲突字段在实现阶段逐一确认。

#### user_real_name_auth

- **领域主键**：id (signed BIGINT, AUTO_INCREMENT) — 保留自增，因为是审核流水
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at
- **软删除**：无
- **唯一索引**：uk_user_id (user_id) — 一人一条实名认证
- **查询索引**：idx_status (status)

#### user_student_auth

- **领域主键**：id (signed BIGINT, AUTO_INCREMENT)
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at
- **软删除**：无
- **唯一索引**：uk_user_id (user_id), uk_student_id (student_id)
- **查询索引**：idx_status (status)

#### login_device

- **领域主键**：device_id (signed BIGINT, ASSIGN_ID) — 原 AUTO，改为雪花
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at, last_login_time
- **软删除**：无（用 status 标记移除）
- **查询索引**：idx_user_id (user_id), idx_device_identifier (device_identifier), idx_status (status)
- **实体不一致修复**：BaseEntity 中的 createTime/updateTime → createdAt/updatedAt

#### user_address

- **领域主键**：address_id (signed BIGINT, ASSIGN_ID) — 原 AUTO，改为雪花
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at
- **软删除**：无（用 status 标记删除）
- **查询索引**：idx_user_id (user_id), idx_is_default (is_default)

#### user_follow

- **领域主键**：follow_id (signed BIGINT, ASSIGN_ID) — 原 AUTO，改为雪花
- **外键**：follower_id → user.user_id, following_id → user.user_id
- **时间字段**：created_at
- **软删除**：无（物理删除）
- **唯一索引**：uk_follower_following (follower_id, following_id)
- **查询索引**：idx_following (following_id)
- **实体不一致修复**：无 BaseEntity，仅有 create_time，统一为 created_at

#### blacklist

- **领域主键**：blacklist_id (signed BIGINT, ASSIGN_ID) — 原 AUTO，改为雪花
- **外键**：user_id → user.user_id, blocked_user_id → user.user_id
- **时间字段**：created_at
- **软删除**：无（物理删除）
- **唯一索引**：uk_user_blocked (user_id, blocked_user_id)
- **实体不一致修复**：无 BaseEntity，createTime → created_at；主键类型 AUTO → ASSIGN_ID

#### admin

- **领域主键**：admin_id (signed BIGINT, AUTO_INCREMENT) — 保留自增，管理员数量少
- **外键**：无
- **时间字段**：created_at, updated_at
- **软删除**：无
- **唯一索引**：uk_username (username)

#### admin_login_log

- **领域主键**：log_id (signed BIGINT, AUTO_INCREMENT)
- **外键**：admin_id → admin.admin_id
- **时间字段**：created_at（login_time）
- **软删除**：无
- **查询索引**：idx_admin_id (admin_id), idx_login_time (login_time)

#### admin_session

- **领域主键**：session_id (signed BIGINT, AUTO_INCREMENT)
- **外键**：admin_id → admin.admin_id
- **时间字段**：created_at, updated_at
- **软删除**：无
- **查询索引**：idx_admin_id (admin_id), idx_token (token)

### 3.2 商品域

#### product

- **领域主键**：product_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO，修复
- **外键**：seller_id → user.user_id, category_id → category.category_id, auditor_id → admin.admin_id
- **时间字段**：created_at, updated_at, audit_time
- **软删除**：有（deleted）
- **查询索引**：idx_seller_id (seller_id), idx_category_id (category_id), idx_status (status), idx_price (price), idx_created_at (created_at), idx_location (location(50))
- **全文索引**：ft_title_desc (title, description)
- **字段不一致修复**：category_id 从 INT UNSIGNED → signed BIGINT

#### product_image

- **领域主键**：image_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：product_id → product.product_id
- **时间字段**：created_at
- **软删除**：无（用 status 标记）
- **查询索引**：idx_product_id (product_id)

#### product_favorite

- **领域主键**：favorite_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：user_id → user.user_id, product_id → product.product_id
- **时间字段**：created_at
- **软删除**：无（物理删除）
- **唯一索引**：uk_user_product (user_id, product_id)
- **查询索引**：idx_product_id (product_id)

#### product_view_history

- **领域主键**：view_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：user_id → user.user_id, product_id → product.product_id
- **时间字段**：created_at (view_time)
- **软删除**：无（物理删除）
- **查询索引**：idx_user_id (user_id), idx_product_id (product_id), idx_view_time (view_time)

#### product_statistics

- **领域主键**：stat_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：product_id → product.product_id
- **时间字段**：created_at, updated_at
- **软删除**：无
- **唯一索引**：uk_product_id (product_id)

### 3.3 共享域

#### share_item

- **领域主键**：share_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：owner_id → user.user_id, category_id → category.category_id
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **查询索引**：idx_owner_id (owner_id), idx_category_id (category_id), idx_status (status)

#### share_item_image

- **领域主键**：image_id (signed BIGINT, ASSIGN_ID)
- **外键**：share_id → share_item.share_id
- **时间字段**：created_at
- **软删除**：无
- **查询索引**：idx_share_id (share_id)

#### share_item_booking

- **领域主键**：booking_id (signed BIGINT, ASSIGN_ID)
- **外键**：share_id → share_item.share_id, owner_id → user.user_id, borrower_id → user.user_id
- **时间字段**：created_at, updated_at, start_time, approve_time, return_time, deposit_paid_time, pay_time, deposit_return_time
- **软删除**：无
- **查询索引**：idx_share_id (share_id), idx_owner_id (owner_id), idx_borrower_id (borrower_id), idx_status (status), idx_payment_order_no (payment_order_no)
- **实体不一致修复**：BaseEntity 的 createTime/updateTime → createdAt/updatedAt

### 3.4 商品/共享公共

#### category

- **领域主键**：category_id (signed BIGINT, ASSIGN_ID) — 原 INT UNSIGNED AUTO，核心修复
- **外键**：parent_id → category.category_id（自引用）
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **唯一索引**：uk_code (code)
- **查询索引**：idx_parent_id (parent_id), idx_status (status), idx_sort_order (sort_order)


### 3.5 订单与退款域

#### order

- **领域主键**：order_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **业务编号**：order_no (VARCHAR(50), 唯一)
- **外键**：buyer_id → user.user_id, seller_id → user.user_id, product_id → product.product_id, coupon_id → coupon.coupon_id (可空), address_id → user_address.address_id (可空)
- **时间字段**：created_at, updated_at, pay_time, ship_time, confirm_time, complete_time, cancel_time
- **软删除**：有（deleted）
- **唯一索引**：uk_order_no (order_no)
- **查询索引**：idx_buyer_id (buyer_id), idx_seller_id (seller_id), idx_product_id (product_id), idx_status (status), idx_created_at (created_at)

#### refund_record

- **领域主键**：refund_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **业务编号**：refund_no (VARCHAR(50), 唯一)
- **外键**：order_id → order.order_id, user_id → user.user_id
- **时间字段**：created_at, updated_at, process_time
- **软删除**：无
- **唯一索引**：uk_refund_no (refund_no)
- **查询索引**：idx_order_id (order_id), idx_user_id (user_id), idx_status (status)

#### transfer_record

- **领域主键**：transfer_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：order_id → order.order_id, from_user_id → user.user_id, to_user_id → user.user_id
- **时间字段**：created_at, updated_at
- **软删除**：无
- **查询索引**：idx_order_id (order_id), idx_from_user (from_user_id), idx_to_user (to_user_id), idx_status (status)

### 3.6 聊天域

#### conversation

- **领域主键**：conversation_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：product_id → product.product_id (可空), share_id → share_item.share_id (可空)
- **时间字段**：created_at, updated_at, last_message_time
- **软删除**：无（双方独立删除标记）
- **查询索引**：idx_product_id (product_id), idx_share_id (share_id), idx_created_at (created_at)
- **注**：会话成员关系在 conversation_member 表中

#### conversation_member

- **领域主键**：member_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：conversation_id → conversation.conversation_id, user_id → user.user_id
- **时间字段**：created_at, updated_at, last_read_time
- **软删除**：无（用 deleted_by_user 标记）
- **唯一索引**：uk_conversation_user (conversation_id, user_id)
- **查询索引**：idx_user_id (user_id)

#### message

- **领域主键**：message_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：conversation_id → conversation.conversation_id, sender_id → user.user_id
- **时间字段**：created_at (send_time)
- **软删除**：无（双方独立删除标记）
- **查询索引**：idx_conversation_id (conversation_id), idx_sender_id (sender_id), idx_created_at (created_at)

#### quick_reply

- **领域主键**：reply_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at
- **软删除**：无
- **查询索引**：idx_user_id (user_id)

### 3.7 评价与信用域

#### evaluation

- **领域主键**：evaluation_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：order_id → order.order_id, product_id → product.product_id, evaluator_id → user.user_id, target_user_id → user.user_id
- **时间字段**：created_at, updated_at, append_time
- **软删除**：有（deleted）
- **唯一索引**：uk_order_evaluator (order_id, evaluator_id)
- **查询索引**：idx_product_id (product_id), idx_target_user (target_user_id), idx_rating (rating), idx_created_at (created_at)

#### credit_record（新增，正式建模）

- **领域主键**：record_id (signed BIGINT, ASSIGN_ID)
- **外键**：user_id → user.user_id
- **时间字段**：created_at
- **软删除**：无
- **字段列表**：
  - record_id BIGINT PRIMARY KEY COMMENT '记录ID'
  - user_id BIGINT NOT NULL COMMENT '用户ID'
  - score_before INT NOT NULL COMMENT '变化前分数'
  - score_change DECIMAL(5,2) NOT NULL COMMENT '变化分数（正加负减）'
  - score_after INT NOT NULL COMMENT '变化后分数'
  - reason VARCHAR(50) NOT NULL COMMENT '变化原因编码'
  - reason_detail VARCHAR(500) NULL COMMENT '原因详情'
  - related_type VARCHAR(32) NULL COMMENT '关联类型：order/evaluation/product/auth/user/report'
  - related_id BIGINT NULL COMMENT '关联业务ID'
  - operator_id BIGINT NULL COMMENT '操作人ID（系统操作为NULL）'
  - created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
- **查询索引**：idx_user_id (user_id), idx_user_created (user_id, created_at), idx_reason (reason), idx_related (related_type, related_id)
- **实体不一致修复**：当前实体 id/user_id 为 String 类型，需改为 Long；字段名 id → record_id

#### credit_daily_stat（新增，正式建模）

- **领域主键**：stat_id (signed BIGINT, ASSIGN_ID)
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at
- **软删除**：无
- **字段列表**：
  - stat_id BIGINT PRIMARY KEY COMMENT '统计ID'
  - user_id BIGINT NOT NULL COMMENT '用户ID'
  - stat_date DATE NOT NULL COMMENT '统计日期'
  - transaction_gain DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '交易加分'
  - transaction_count INT NOT NULL DEFAULT 0 COMMENT '交易次数'
  - evaluation_gain DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '评价加分'
  - evaluation_count INT NOT NULL DEFAULT 0 COMMENT '评价次数'
  - other_gain DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '其他加分'
  - total_gain DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '总加分'
  - created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
  - updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
- **唯一索引**：uk_user_date (user_id, stat_date)
- **查询索引**：idx_stat_date (stat_date)
- **实体不一致修复**：当前实体 id/user_id 为 String 类型，需改为 Long；字段名 id → stat_id

#### credit_alert（新增，正式建模）

- **领域主键**：alert_id (signed BIGINT, ASSIGN_ID)
- **外键**：user_id → user.user_id, handled_by → admin.admin_id (可空)
- **时间字段**：created_at, handled_at
- **软删除**：无
- **字段列表**：
  - alert_id BIGINT PRIMARY KEY COMMENT '预警ID'
  - user_id BIGINT NOT NULL COMMENT '用户ID'
  - alert_type VARCHAR(32) NOT NULL COMMENT '预警类型：rapid_growth/frequent_trading/mutual_evaluation/abnormal_decay'
  - alert_level VARCHAR(16) NOT NULL COMMENT '预警级别：low/medium/high/critical'
  - alert_data JSON NULL COMMENT '预警数据（JSON）'
  - status VARCHAR(16) NOT NULL DEFAULT 'pending' COMMENT '处理状态：pending/reviewing/processed/ignored'
  - handled_by BIGINT NULL COMMENT '处理人ID（管理员）'
  - handle_result VARCHAR(500) NULL COMMENT '处理结果'
  - handled_at DATETIME NULL COMMENT '处理时间'
  - created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
- **查询索引**：idx_user_id (user_id), idx_status (status), idx_alert_type (alert_type), idx_alert_level (alert_level), idx_created_at (created_at)
- **实体不一致修复**：当前实体 id/user_id/handledBy 为 String 类型，需改为 Long；字段名 id → alert_id


### 3.8 优惠券域

#### coupon

- **领域主键**：coupon_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：无
- **时间字段**：created_at, updated_at, valid_start_time, valid_end_time
- **软删除**：有（deleted）
- **查询索引**：idx_status (status), idx_valid_time (valid_start_time, valid_end_time)

#### user_coupon（新增，正式建模）

- **领域主键**：user_coupon_id (signed BIGINT, ASSIGN_ID) — 原实体 AUTO
- **外键**：user_id → user.user_id, coupon_id → coupon.coupon_id, order_id → order.order_id (可空)
- **时间字段**：created_at, updated_at, used_time, expire_time
- **软删除**：无
- **字段列表**（基于实体，补充索引）：
  - user_coupon_id BIGINT PRIMARY KEY COMMENT '用户优惠券ID'
  - user_id BIGINT NOT NULL COMMENT '用户ID'
  - coupon_id BIGINT NOT NULL COMMENT '优惠券ID'
  - status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-未使用，2-已使用，3-已过期'
  - used_time DATETIME NULL COMMENT '使用时间'
  - order_id BIGINT NULL COMMENT '关联订单ID'
  - expire_time DATETIME NOT NULL COMMENT '过期时间'
  - created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
  - updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
- **查询索引**：idx_user_id (user_id), idx_user_status (user_id, status), idx_coupon_id (coupon_id), idx_order_id (order_id), idx_expire_time (expire_time)
- **实体不一致修复**：主键生成策略从 AUTO → ASSIGN_ID

### 3.9 秒杀域

#### flash_sale_product

- **领域主键**：flash_sale_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：product_id → product.product_id, session_id → flash_sale_session.session_id
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **查询索引**：idx_product_id (product_id), idx_session_id (session_id), idx_status (status)

#### flash_sale_session

- **领域主键**：session_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：无
- **时间字段**：created_at, updated_at, start_time, end_time
- **软删除**：有（deleted）
- **查询索引**：idx_status (status), idx_start_time (start_time)

#### flash_sale_session_template

- **领域主键**：template_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：无
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **查询索引**：idx_status (status)

#### flash_sale_order_ext

- **领域主键**：ext_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：order_id → order.order_id, flash_sale_id → flash_sale_product.flash_sale_id
- **时间字段**：created_at
- **软删除**：无
- **唯一索引**：uk_order_id (order_id)
- **查询索引**：idx_flash_sale_id (flash_sale_id)

### 3.10 通知域

#### system_notification

- **领域主键**：notification_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：sender_id → admin.admin_id (可空)
- **时间字段**：created_at, updated_at, publish_time
- **软删除**：有（deleted）
- **查询索引**：idx_status (status), idx_publish_time (publish_time), idx_type (type)

#### notification_read_records

- **领域主键**：record_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：notification_id → system_notification.notification_id, user_id → user.user_id
- **时间字段**：created_at (read_time)
- **软删除**：无
- **唯一索引**：uk_notification_user (notification_id, user_id)
- **查询索引**：idx_user_id (user_id)

### 3.11 举报与反馈域

#### report

- **领域主键**：report_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：reporter_id → user.user_id, target_id (业务ID，按 type 区分), handler_id → admin.admin_id (可空)
- **时间字段**：created_at, updated_at, handle_time
- **软删除**：无
- **查询索引**：idx_reporter_id (reporter_id), idx_target (target_type, target_id), idx_status (status), idx_type (type)

#### user_feedback

- **领域主键**：feedback_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at, reply_time
- **软删除**：无
- **查询索引**：idx_user_id (user_id), idx_status (status), idx_type (type)

### 3.12 配置与审计域

#### banner

- **领域主键**：banner_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：link_product_id → product.product_id (可空)
- **时间字段**：created_at, updated_at, start_time, end_time
- **软删除**：有（deleted）
- **查询索引**：idx_status (status), idx_position (position), idx_sort_order (sort_order)

#### hot_tag

- **领域主键**：tag_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT UNSIGNED AUTO
- **外键**：无
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **唯一索引**：uk_name (name)
- **查询索引**：idx_status (status), idx_heat (heat DESC)

#### system_config

- **领域主键**：config_id (signed BIGINT, AUTO_INCREMENT)
- **外键**：无
- **时间字段**：created_at, updated_at
- **软删除**：无
- **唯一索引**：uk_config_key (config_key)

#### operation_log

- **领域主键**：log_id (signed BIGINT, AUTO_INCREMENT)
- **外键**：admin_id → admin.admin_id (可空)
- **时间字段**：created_at (oper_time)
- **软删除**：无
- **查询索引**：idx_admin_id (admin_id), idx_oper_time (oper_time), idx_module (module)

#### sensitive_word

- **领域主键**：word_id (signed BIGINT, AUTO_INCREMENT) — 原 BIGINT UNSIGNED AUTO
- **外键**：无
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **唯一索引**：uk_word (word)
- **查询索引**：idx_type (type), idx_status (status)

#### campus_location

- **领域主键**：location_id (signed BIGINT, AUTO_INCREMENT) — 原 BIGINT AUTO
- **外键**：无
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **唯一索引**：uk_code (code)
- **查询索引**：idx_status (status), idx_sort_order (sort_order)

### 3.13 AI 聊天域

#### ai_chat_history

- **领域主键**：id → chat_id (signed BIGINT, ASSIGN_ID) — 原 BIGINT AUTO
- **外键**：user_id → user.user_id
- **时间字段**：created_at, updated_at
- **软删除**：有（deleted）
- **查询索引**：idx_user_id (user_id), idx_session_id (session_id), idx_created_at (created_at)
- **实体不一致修复**：主键 id → chat_id；AUTO → ASSIGN_ID；create_time/update_time → created_at/updated_at


---

## 四、已知实体/schema 字段不一致修复清单

以下为需逐一修复的不一致项，按实体分组。

### 4.1 BaseEntity

| 项 | 现状 | 修复后 |
|----|------|--------|
| 时间字段名 | createTime / updateTime | createdAt / updatedAt（映射到 created_at / updated_at） |
| 软删除 | `@TableLogic` 无条件携带 | 移除 `@TableLogic`；需要软删除的实体各自声明 deleted 字段 |

### 4.2 User

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | userId Long + ASSIGN_ID ✓ | 不变 |
| 时间字段 | 继承 BaseEntity createTime/updateTime | 继承 BaseEntity createdAt/updatedAt |
| student_id | 实体有，schema 无 | 合并后保留在 user 表 |
| real_name | 实体有，schema user 表无（在 user_profile） | 合并后保留在 user 表 |
| college | 实体有，schema 无 | 合并后保留在 user 表 |
| major | 实体有，schema 无 | 合并后保留在 user 表 |
| is_verified | 实体有，schema 无 | 合并后保留在 user 表（实名认证状态冗余） |
| credit_score | 实体有，schema user 表有 ✓ | 不变 |
| phone_search_enabled | 实体有，schema 无 | 合并后保留在 user 表（原 user_preference 隐私设置） |
| location_enabled | 实体有，schema 无 | 合并后保留在 user 表 |
| last_login_time | 实体有，schema 无 | 合并后保留在 user 表 |

### 4.3 Blacklist

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | blacklistId Long + AUTO | blacklistId Long + ASSIGN_ID |
| 时间字段 | createTime（无 BaseEntity） | createdAt（无 BaseEntity） |
| 软删除 | 无 | 不变（物理删除） |

### 4.4 UserCreditExt（合并入 user）

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | id Long + AUTO | 表删除，字段合并到 user |
| 时间字段 | createdAt / updatedAt（自定义命名） | 合并后使用 user 表的 createdAt/updatedAt |
| 主键名 | id（不规范） | 不复存在 |

### 4.5 UserPreference（合并入 user）

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | preferenceId Long + AUTO | 表删除，字段合并到 user |
| 时间字段 | createTime / updateTime | 不复存在 |

### 4.6 LoginDevice

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | deviceId Long + AUTO | deviceId Long + ASSIGN_ID |
| 时间字段 | 继承 BaseEntity createTime/updateTime | 继承 BaseEntity createdAt/updatedAt |
| 软删除 | 继承 BaseEntity @TableLogic | 移除 BaseEntity 软删除，改用 status 字段 |

### 4.7 ShareItemBooking

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | bookingId Long + ASSIGN_ID ✓ | 不变 |
| 时间字段 | 继承 BaseEntity createTime/updateTime | 继承 BaseEntity createdAt/updatedAt |
| 软删除 | 继承 BaseEntity @TableLogic | 移除，booking 无软删除需求 |
| shareId 字段 | 实体字段名为 shareId | 与 schema 字段 share_id 对应，不变 |

### 4.8 UserAddress

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | addressId Long + AUTO | addressId Long + ASSIGN_ID |
| 时间字段 | 继承 BaseEntity createTime/updateTime | 继承 BaseEntity createdAt/updatedAt |
| 软删除 | 继承 BaseEntity @TableLogic | 移除，用 status 字段标记删除 |

### 4.9 UserFollow

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键 | followId Long + AUTO | followId Long + ASSIGN_ID |
| 时间字段 | createTime（无 BaseEntity） | createdAt（无 BaseEntity） |
| 软删除 | 无 | 不变（物理删除） |

### 4.10 Category

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键类型 | schema: INT UNSIGNED AUTO；实体: Long + ASSIGN_ID | schema: signed BIGINT + ASSIGN_ID |
| 时间字段 | schema: create_time/update_time；实体: BaseEntity | 统一为 created_at/updated_at |
| parent_id | schema: INT UNSIGNED | signed BIGINT |

### 4.11 Product

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键类型 | schema: BIGINT UNSIGNED AUTO；实体: Long + ASSIGN_ID | schema: signed BIGINT + ASSIGN_ID |
| seller_id | schema: BIGINT UNSIGNED | signed BIGINT（与 user.user_id 兼容） |
| category_id | schema: INT UNSIGNED | signed BIGINT |
| cover_image_id | schema: BIGINT UNSIGNED | signed BIGINT |
| auditor_id | schema: BIGINT UNSIGNED | signed BIGINT |
| 时间字段 | schema: create_time/update_time；实体: BaseEntity | 统一为 created_at/updated_at |

### 4.12 CreditAlert / CreditDailyStat / CreditRecord

| 项 | 现状 | 修复后 |
|----|------|--------|
| id 类型 | String（错误） | Long |
| user_id 类型 | String（错误） | Long |
| 主键名 | id（不规范） | alert_id / stat_id / record_id |
| 时间字段 | createdAt 自定义命名 | createdAt 保留，但与 schema 列名 created_at 对应 |
| related_id | String | Long（关联业务主键） |
| handled_by | String | Long（关联管理员 ID） |

### 4.13 AIChatHistory

| 项 | 现状 | 修复后 |
|----|------|--------|
| 主键名 | id（不规范） | chat_id |
| 主键策略 | AUTO | ASSIGN_ID |
| 时间字段 | create_time/update_time | created_at/updated_at |


---

## 五、需改为字符串 ID 的接口与前端类型

### 5.1 DTO/VO 中 Integer ID 修复

以下 DTO/VO 中的 ID 字段当前为 Integer，需改为 Long（后端内部 Long，JSON 序列化后为字符串）：

| 文件 | 字段 | 当前类型 | 修复后类型 |
|------|------|----------|------------|
| dto/ProductCreateDTO.java | categoryId | Integer | Long |
| dto/ProductDraftSaveDTO.java | categoryId | Integer | Long |
| vo/ProductVO.java | categoryId | Integer | Long |
| vo/ProductDraftVO.java | categoryId | Integer | Long |
| vo/FlashSaleProductVO.java | categoryId | Integer | Long |

> 以上为 grep 确认的 5 处。实现阶段需全局扫描所有 DTO/VO，确保无遗漏。

### 5.2 后端全局 ID 序列化

- 方案 A（推荐）：在 Jackson 全局配置中注册 `Long` → `String` 序列化器，使所有 Long 字段自动序列化为字符串。
  - 风险：如果存在本应是数值的 Long 字段（如 view_count 等），需评估是否影响前端。
  - 对策：业务主键和外键用 Long + 全局字符串化；统计计数等数值字段用 Integer。
- 方案 B：保持现有 `@JsonSerialize(using = ToStringSerializer.class)` 逐个注解的方式，但需确保无遗漏。
- **决策**：先采用方案 B 保持谨慎，逐个确认所有 ID 字段都有注解；后续可评估方案 A。

### 5.3 前端类型修复（mobile H5）

以下为已确认的 number / `string | number` 类型 ID，需统一为 string：

**类型定义（mobile/src/types/index.ts）：**

| 行 | 字段 | 当前类型 | 修复后 |
|----|------|----------|--------|
| 49 | categoryId (Product 接口) | number | string |
| 148 | categoryId? | number | string |
| 168 | id (某接口) | string \| number | string |
| 201 | userId? | string \| number | string |
| 277 | categoryId (Category 接口) | string \| number | string |
| 282 | parentId? | string \| number | string |
| 286 | id? | string \| number | string |
| 482 | categoryId (ShareItem 接口) | number | string |

**API 定义（mobile/src/api/）：**

- `api/product.ts`：categoryId 多处使用 number → 全部改为 string
- `api/share.ts`：categoryId 多处使用 number → 全部改为 string
- `api/category.ts`：categoryId string | number → string
- `api/activity.ts`：categoryId number → string
- `api/evaluation.ts`：如有 number 类型 ID → 改为 string

**路由与工具：**

- `utils/router.ts`：toUserHome / toOrder 等参数从 `string | number` → string
- `utils/analytics.ts`：categoryId number → string
- `components/product-list-item/`：productId number | string → string
- `components/evaluation-list-item/`：productId number | string → string

### 5.4 前端类型修复（admin 管理后台）

admin 端 ID 类型问题更集中，需全面扫描：

**API 类型（admin/src/api/）：**

- `api/category.ts`：categoryId number → string；parentId number | null → string | null
- `api/banner.ts`：bannerId number → string；linkProductId number → string
- `api/report.ts`：reportId number → string；reporterId number → string
- `api/product.ts`：如有 number 类型 ID → 改为 string
- `api/order.ts`：如有 number 类型 ID → 改为 string
- `api/user.ts`：如有 number 类型 ID → 改为 string
- `api/flashSale.ts`：如有 number 类型 ID → 改为 string
- `api/evaluation.ts`：如有 number 类型 ID → 改为 string
- `api/notification.ts`：如有 number 类型 ID → 改为 string
- `api/blacklist.ts`：如有 number 类型 ID → 改为 string
- `api/sensitiveWord.ts`：如有 number 类型 ID → 改为 string
- `api/systemConfig.ts`：如有 number 类型 ID → 改为 string
- `api/operationLog.ts`：如有 number 类型 ID → 改为 string
- `api/feedback.ts`：如有 number 类型 ID → 改为 string
- `api/shareItem.ts`：如有 number 类型 ID → 改为 string
- `api/authManage.ts`：如有 number 类型 ID → 改为 string
- `api/statistics.ts`：如有 number 类型 ID → 改为 string

**request 工具：**
- `admin/src/utils/request.ts` 第 148 行已有 `key.endsWith('Id')` 的 number → string 转换逻辑。需确认该逻辑是否覆盖所有情况，以及是否影响非 ID 数值字段。

### 5.5 前端禁止操作

- 禁止对 ID 使用 `parseInt()`
- 禁止对 ID 使用 `Number()`
- 禁止对 ID 进行数值运算（比较、加减等）
- ID 比较使用字符串比较
- ID 从 URL 参数获取时，直接作为字符串使用，不做数值转换


---

## 六、测试 seam 定义

只定义三层测试，不做每张表的脆弱测试。测试只验证外部行为，不测试 Mapper 拼接 SQL 等实现细节。

### 6.1 Fresh-init seam

**目标**：验证空数据库可从零完整初始化，schema 和基础数据一致。

**执行方式**：
- CI 中启动临时 MySQL 容器（空 volume）
- 挂载 `sql/schema.sql` 和 `sql/data.sql` 到 initdb.d
- 等待容器启动完成，检查退出码

**验证内容**：
1. MySQL 容器健康检查通过（退出码 0）
2. 表数量与预期一致（可接受 ±0，即完全匹配）
3. 所有外键约束正常存在（查询 INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS）
4. 基础数据存在：
   - admin 表有 1 条超级管理员记录
   - category 表有默认分类
   - campus_location 表有校园位置
   - system_config 表有系统配置
   - 无演示/测试数据（如测试用户、测试商品等）
5. 无备份表、无用视图等残留对象

**测试位置**：GitHub Actions CI 新增 `fresh-init` job

### 6.2 HTTP 契约 seam

**目标**：验证创建/查询响应中的 ID 是字符串，并验证字符串 ID 能正确往返。

**执行方式**：
- Spring Boot 集成测试（Testcontainers 启动 MySQL）
- 调用创建接口 → 验证响应中 ID 字段为 JSON string 类型
- 使用返回的字符串 ID 调用查询接口 → 验证能正确找到记录，且 ID 一致
- 使用数值型 ID 调用查询 → 验证也能正常工作（后端 Long 可接收字符串参数），但返回仍为字符串

**验证内容**：
1. 创建分类：`POST /api/categories` → 响应中 `categoryId` 为字符串
2. 查询分类：`GET /api/categories/{id}` → ID 与创建时一致，且为字符串
3. 创建商品：`POST /api/products` → 响应中 `productId`、`sellerId`、`categoryId` 均为字符串
4. 查询商品：`GET /api/products/{id}` → ID 一致为字符串
5. 创建订单：`POST /api/orders` → 响应中 `orderId` 为字符串
6. 前端类型检查：TypeScript 编译通过，无 `any` 类型的 ID 字段

**测试位置**：后端集成测试（Spring Boot Test + Testcontainers）

### 6.3 关键业务流 seam

**目标**：验证分类创建 → 商品发布 → 订单创建全链路雪花 ID 不溢出、不丢精度。

**执行方式**：
- 端到端集成测试（Testcontainers + MockMvc）
- 模拟完整业务流，验证每个环节的 ID 正确性

**验证内容**：
1. 创建分类 → 获取分类 ID（字符串）
2. 发布商品（使用该分类 ID）→ 获取商品 ID（字符串）
3. 创建订单（购买该商品）→ 获取订单 ID（字符串）
4. 查询订单详情 → 验证：
   - orderId 为字符串
   - productId 为字符串且与第 2 步一致
   - buyerId、sellerId 为字符串
   - categoryId 为字符串且与第 1 步一致
5. 订单 ID 数值大小 > 2^53（证明雪花 ID 确实超过 JS 安全整数范围，必须用字符串传输）
6. 前端加载该订单页面，ID 不出现精度丢失（可选，端到端测试）

**测试位置**：后端集成测试 + 可选的 Playwright E2E

---

## 七、验收标准

### 7.1 Schema 与实体一致性检查

- 所有实体类对应的表在 schema.sql 中有定义（无缺失表）
- schema.sql 中定义的所有表有对应实体类（无孤立表，删除的表除外）
- 实体字段与数据库列名一一对应（通过 MyBatis-Plus 自动映射或 `@TableField` 显式映射）
- 字段类型匹配：
  - 主键/外键：Java Long ↔ SQL BIGINT (signed)
  - 状态/类型字段：Java Integer ↔ SQL TINYINT / INT
  - 金额：Java BigDecimal ↔ SQL DECIMAL
  - 时间：Java LocalDateTime ↔ SQL DATETIME

### 7.2 外键类型检查

- 所有外键列与引用列类型完全一致（均为 signed BIGINT）
- 所有外键约束创建成功（无 ERROR 3780 类错误）
- 外键命名规范：`fk_<表名>_<引用表名>` 或 `fk_<表名>_<列名>`

### 7.3 ID 精度检查

- 所有雪花生成的 ID 均 > 2^53（证明有溢出风险，验证字符串序列化的必要性）
- HTTP 响应中所有 ID 字段为 JSON string 类型（非 number）
- 前端 TypeScript 中所有 ID 字段类型为 string（无 number、无 `string | number`）
- 前端代码中无 `parseInt(id)`、`Number(id)` 等对 ID 的数值转换
- WebSocket 消息中的 ID 为字符串

### 7.4 Fresh-init 通过

- 空 MySQL volume 执行 schema.sql + data.sql 退出码为 0
- 表数量与预期一致
- 所有外键约束存在
- 基础数据完整且无演示数据

### 7.5 CI 全绿

- 后端构建通过
- 前端构建通过
- fresh-init 测试通过
- HTTP 契约测试通过
- 关键业务流测试通过


---

## 八、开发数据库重建与部署文档

### 8.1 当前状态

- 开发环境的 MySQL volume（xianqi_mysql_data）当前只有 14 张表成功创建，处于残缺状态。
- 本次重建不迁移这 14 张表的数据，直接从新基线从零初始化。

### 8.2 安全重建步骤（开发环境）

```bash
# 1. 停止所有容器
docker compose down

# 2. 删除 MySQL 数据卷（⚠️ 会丢失所有开发数据）
docker volume rm xianqi_mysql_data

# 3. 重新启动（MySQL 首次启动会自动执行 schema.sql 和 data.sql）
docker compose up -d

# 4. 验证初始化成功
docker exec xianqi-mysql mysql -u xianqi -pxianqi123 Xianqi -e "SHOW TABLES;"
```

### 8.3 警告

- ⚠️ **删除 volume 前确认不需要保留现有数据**
- ⚠️ **生产环境严禁使用此步骤**。生产环境的结构变更通过 `sql/migrations/` 下的迁移脚本逐步演进。
- ⚠️ 重建后需要重新加载演示数据（开发 seed）。

### 8.4 演示数据加载

- 演示数据单独存放在 `sql/seed/` 目录下（待创建）
- 开发环境可手动执行 `sql/seed/dev_demo_data.sql` 加载测试用户、测试商品等
- 生产环境不加载演示数据

---

## 九、Out of Scope

- 不重写全部业务功能
- 不重新设计前端 UI
- 不做全量 E2E 测试
- 不引入 Flyway，除非另行确认
- 不处理生产 SSL、域名和小程序 Docker 构建
- 不追求固定表数量（表数量由聚合边界决定）
- 不迁移当前 14 张表的数据（开发环境直接重建）
- 不修改生产数据库结构（生产环境通过迁移脚本演进）

---

## 十、未决问题

以下问题需在实现前确认：

### 10.1 user 表合并字段冲突

user 实体中已有 `real_name`、`location_enabled` 等字段，user_profile 也有 `real_name`、`location` 等字段。合并时需确认：

- user.real_name（实体有，schema 无）与 user_profile.real_name 是否重复？
  - **推荐答案**：保留一个 real_name 字段。user 实体的 real_name 可能是早期冗余字段，user_profile 的 real_name 是"用于展示的真实姓名"，与实名认证的真实姓名（user_real_name_auth.real_name）不同。合并后统一为 `real_name`（展示用），认证用的真实姓名仍在 user_real_name_auth 表中。
- user.location_enabled（实体有）与 user_preference 的隐私设置是否重复？
  - **推荐答案**：合并后统一管理位置相关设置，保留 `location_enabled` 命名。
- user_profile.followers_count / following_count / products_count / favorites_count 等统计冗余字段是否仍需维护？
  - **推荐答案**：保留，作为查询优化的冗余字段，但需确认业务代码是否实际更新这些字段。如果没有更新机制，应移除或标注为待实现。

### 10.2 BaseEntity 重构范围

BaseEntity 当前被 30+ 实体继承。移除 `@TableLogic` 后，需要软删除的实体各自声明 deleted 字段。需确认：

- 哪些表确实需要软删除？（本 spec 第三节已标注"有"的表）
- 有没有遗漏的表需要软删除？
  - **推荐答案**：按本 spec 第三节的标注执行。如果有不确定的，偏向物理删除，后续需要再加。

### 10.3 admin 主键策略

admin / admin_login_log / admin_session / system_config / operation_log 等管理后台表当前使用 AUTO_INCREMENT。是否统一改为 ASSIGN_ID？

- **推荐答案**：管理后台表（admin、operation_log、system_config、sensitive_word、campus_location）保留 AUTO_INCREMENT。这些表数据量小、不对外暴露 ID、且敏感词等配置表常用固定 ID 查找。统一改为雪花收益不大，反而增加迁移成本。但外键引用这些表的列仍需是 signed BIGINT（AUTO_INCREMENT 的 BIGINT 也是 signed）。

### 10.4 全局 Long → String 序列化 vs 逐个注解

后端 ID 序列化为字符串有两种方式：

- 方案 A：全局 Jackson 配置，所有 Long 序列化为 String
- 方案 B：每个 ID 字段加 `@JsonSerialize(using = ToStringSerializer.class)`

- **推荐答案**：采用方案 B（逐个注解），因为项目中存在一些 Long 类型的非 ID 字段（如 view_count 等统计字段），全局序列化可能导致意外的类型变更。但需确保所有 ID 字段都有注解，无遗漏。

### 10.5 5 个空壳表的最终处置

worker_node、statistics_cache、error_log、export_log 当前有实体和 Mapper，但未发现业务调用链。是否确认删除？

- **推荐答案**：删除。如果实现阶段发现确实有运行时调用，停止并报告冲突，不静默保留。

### 10.6 软删除清单是否完整

本 spec 标注了有软删除的表，但可能存在遗漏。需在实现阶段逐一核对：

- 当前标注为"有软删除"的表：user、product、share_item、category、order、evaluation、coupon、flash_sale_product、flash_sale_session、flash_sale_session_template、system_notification、banner、hot_tag、sensitive_word、campus_location、ai_chat_history
- **推荐答案**：按此清单执行，实现阶段发现遗漏再补充。

---

## 十一、实施顺序建议（非承诺，仅参考）

1. 重写 schema.sql，建立新基线（所有表 signed BIGINT、统一时间字段、补全缺失表、删除无用对象）
2. 重写 data.sql，仅保留基础数据（清理备份表数据、演示数据、视图）
3. fresh-init 测试接入 CI
4. BaseEntity 重构（时间字段重命名、移除 @TableLogic）
5. 实体字段逐一修复（类型、命名、主键策略）
6. DTO/VO 中 Integer ID 改为 Long
7. Mapper / Service 层适配
8. HTTP 契约测试编写与通过
9. 前端类型全部改为 string
10. 关键业务流测试编写与通过
11. 部署文档更新
12. 开发环境数据库 volume 重建

> 以上为建议顺序，具体实施由 ticket 拆分决定。
