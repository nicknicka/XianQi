# ADR-0011: Message 实体不补 updated_at

## 状态
已采纳（2026-10-28）

## 背景
`message` 表保存即时通讯消息，是当前写入最频繁的表。数据库基线中，该表有 `created_at`、`read_time`、`delivered_time`，没有 `updated_at`。

`Message` 实体继承 `BaseEntity`，而 `BaseEntity` 统一声明 `createdAt` 和 `updatedAt`。为了让 MyBatis-Plus 不把继承来的 `updatedAt` 映射到不存在的列，`Message` 当前覆盖该字段并标注 `@TableField(exist = false)`；注释说明“该表没有 updated_at 列”。

调查确认：
- 覆盖后的 `updatedAt` 没有业务消费方：后端不读取，`MessageVO` 不暴露，前端不使用。
- 消息已经有更精确的业务时间：`created_at` 表示创建时间，`read_time` 表示阅读时间，`delivered_time` 表示送达时间。
- 在 27 个继承 `BaseEntity` 的实体中，只有 `Message` 对应的表缺少 `updated_at`。

这个特例容易被误认为遗漏；在 `ADR-0008` 统一 `created_at` / `updated_at` 命名后，更需要把边界记录清楚。

## 决策
**保持现状：不给 `message` 表新增 `updated_at`，继续保留 `Message` 对 `BaseEntity.updatedAt` 的 `@TableField(exist = false)` 覆盖。**

如果后续只执行时间字段命名迁移，`Message` 相关内部调用按仓库统一约定使用 `createdAt` 等新名；该调整不改变本决策，也不构成补列的理由。

## 理由
1. **没有功能收益**：该字段当前没有任何读取方，也不进入消息对外视图；补列只是增加一个无人使用的值。
2. **写入成本不成比例**：`message` 是写入最频繁的表。新增 `updated_at` 需要迁移表结构，并让后续写入持续承担额外存储和更新成本。
3. **业务时间已经足够精确**：创建、阅读、送达分别有独立时间列，通用的“最后更新时间”不能提供额外信息。
4. **保持较小改动面**：继续继承 `BaseEntity` 可避免为单个实体改写继承关系、时间字段填充和映射逻辑；用显式覆盖表达这一例外。

## 后果
### 正面
- 避免对高频写入的消息表做无收益的 schema 变更。
- 避免每条消息持续携带和更新无消费方的 `updated_at`。
- 现有 `created_at`、`read_time`、`delivered_time` 继续作为更精确的业务时间来源。
- 实体上的显式覆盖和注释让 MyBatis-Plus 不会映射不存在的列，也让特例可见。

### 负面
- `Message` 成为继承 `BaseEntity` 的实体中唯一的结构性例外，阅读实体时需要理解覆盖标记。
- 只要 `BaseEntity` 保留 `updatedAt`，`Message` 就需要继续维护这个“字段不存在”的覆盖。
- 如果未来确实需要“最后修改时间”，必须重新评估决策并通过迁移补列，不能临时写入继承字段。

## 备选方案
- **给 `message` 表增加 `updated_at` 列**：可以消除实体继承上的特例，但当前没有读取方，却要为写入最频繁的表支付迁移、存储和持续更新成本。收益为零，否决。
- **让 `Message` 不再继承 `BaseEntity`**：可以移除对 `updatedAt` 的覆盖，但会扩大改动面，需要另行处理 `createdAt` 的声明、填充和映射，并可能影响序列化与调用方。它不能凭空提供 `updated_at`，收益与现状相同，否决。
