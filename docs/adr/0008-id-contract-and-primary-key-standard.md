# ADR-0008: 业务主键与 ID 对外契约统一

## 状态
已采纳

## 背景
当前项目在 ID 和主键方面存在多处不一致：

1. **数据库类型混用**：`user.user_id` 是 signed BIGINT，而 `product.seller_id`、`product.product_id` 等多个外键和主键使用 BIGINT UNSIGNED；`category.category_id` 使用 INT UNSIGNED，但 Java 实体使用 Long + 雪花 ASSIGN_ID。signed/unsigned 混用导致外键约束创建失败。
2. **时间字段命名不统一**：部分表使用 `created_at` / `updated_at`，部分表使用 `create_time` / `update_time`，BaseEntity 也使用 `createTime` / `updateTime`，命名不统一增加了映射和理解成本。
3. **软删除泛滥**：BaseEntity 无条件携带 `@TableLogic`，导致所有继承 BaseEntity 的表都隐含软删除，但许多关联表、日志表、统计表不需要软删除。
4. **DTO/VO 中 ID 类型错误**：`categoryId` 等字段在 DTO/VO 中定义为 Integer，但实际雪花 ID 是 Long，存在精度丢失风险。
5. **前端 ID 类型混乱**：前端 TypeScript 中部分 ID 使用 number（如 `categoryId: number`），部分使用 `string | number` 的兼容写法，存在精度丢失和类型不一致问题。
6. **业务编号与业务主键混称**：订单号、退款号、支付流水号等业务编号与雪花生成的业务主键概念混淆。

## 决策

### 1. 业务主键类型统一
- 所有业务主键和外键统一使用 **signed BIGINT**。
- 禁止使用 INT、BIGINT UNSIGNED 和 signed/unsigned 混用。
- 每张表使用领域主键名（user_id、product_id、order_id、share_id 等），不为了统一而把所有主键改成 id。

### 2. Java 内部 ID
- Java 实体中 ID 使用 **Long** 类型。
- 主键生成使用 **IdType.ASSIGN_ID**，继续使用现有的雪花生成器。
- 修正所有把 ID 定义为 Integer 的 DTO/VO，包括但不限于 categoryId。

### 3. ID 对外契约
- HTTP 和 WebSocket 对外接口中，所有业务主键一律**序列化为字符串**。
- 前端 TypeScript 中 ID 一律使用 **string** 类型。
- 禁止对 ID 使用 parseInt、Number() 或数值运算。
- 后端使用 `@JsonSerialize(using = ToStringSerializer.class)` 或全局 Jackson 配置保证 Long 型 ID 序列化为字符串。

### 4. 业务编号与业务主键分离
- 订单号、退款号、支付流水号等是**业务编号**，有独立的格式和生成规则，存储为字符串。
- 业务主键是雪花生成的 Long / BIGINT，仅用于内部关联和系统标识。
- 两者概念和用途完全不同，不能混称。

### 5. 时间字段命名统一
- 所有表时间字段统一使用 **created_at / updated_at**。
- 只有创建时间的表只保留 created_at。
- 彻底移除 create_time / update_time 两套命名。
- BaseEntity 字段同步调整为 createdAt / updatedAt。

### 6. 软删除按需使用
- 软删除只用于确实需要软删除的聚合根（用户、商品、订单、共享物品等）。
- BaseEntity 不再无条件携带 `@TableLogic`。
- 需要软删除的实体各自声明 deleted 字段和 `@TableLogic`。
- 关联表、日志表、统计表等使用物理删除。

## 理由
1. **外键兼容**：signed BIGINT 统一消除了 signed/unsigned 混用导致的外键创建失败问题。
2. **雪花兼容**：雪花算法生成的 ID 是 64 位有符号长整型，signed BIGINT 是天然匹配。
3. **前端安全**：JavaScript Number 的安全整数范围是 2^53，无法精确表示 64 位雪花 ID。字符串传输避免精度丢失。
4. **命名一致**：领域主键名 + 统一时间字段命名，降低跨层映射的心智负担。
5. **边界清晰**：业务主键与业务编号分离，避免概念混淆。
6. **软删除克制**：只在需要的地方使用软删除，减少不必要的查询复杂度和数据膨胀。

## 后果
### 正面
- 外键约束可正常创建，schema 可一次初始化成功
- 全链路 ID 无精度丢失
- 命名统一，减少映射错误
- 前端类型一致，消除 `string | number` 兼容写法

### 负面
- 需要批量修改 schema、实体、DTO、VO、前端类型和 API 调用
- 现有开发数据库需要重建 volume，14 张表的数据不迁移
- 所有 categoryId 等 Integer ID 的 DTO 需要改为 Long

## 备选方案
- **使用 UUID 作为主键**：完全避免数值精度问题，但雪花 ID 在排序、局部有序性和性能上更有优势，且项目已使用雪花。
- **前端使用 bigint 类型**：可以保留数值语义，但 JSON 不支持 bigint，序列化仍需转字符串，且生态兼容性不如 string 广泛。
- **引入 Flyway 管理迁移**：可追踪版本和自动迁移，但改造成本高，当前项目迁移频率低，手动迁移足够。
