# Backend testing

XianQi 后端有两层测试，按**文件名**区分，并由不同 Maven 插件执行：

| 层 | 命名 | 插件 | 能否连库 |
|----|------|------|----------|
| 单元测试 | `*Test.java` | surefire（`mvn test`） | 否——不得连真实 MySQL/Redis |
| 集成测试 | `*IT.java` | failsafe（`mvn verify`） | 是——复用测试环境的 `MYSQL_URL` / `REDIS_*` |

## 命名规则

- **连真实库的测试必须以 `IT` 结尾。** surefire 默认包含 `Test*` 和 `*Test`，failsafe 默认包含 `*IT`；像 `TestFooIT` 这样的名字会**同时命中两个插件**，被当成单元测试跑一遍并失败。`backend/pom.xml` 已给 surefire 加 `**/*IT.java` 排除，作为机械化兜底（见 issue #56）。
- `*Test.java` 保持无外部依赖（纯逻辑 / Mockito），这样 `mvn test` 在无 Docker 时也能通过。

## 跑测试

- 全套（自带隔离 MySQL + Redis 容器、并检查无静默跳过）：`./scripts/test-backend.sh`
- 单独跑一条集成测试（对着已有的库，快得多）：先导出 `MYSQL_URL` / `MYSQL_USER` / `MYSQL_PASSWORD` / `REDIS_HOST` / `REDIS_PORT`，再
  `cd backend && ./mvnw verify -Dit.test=SomeIT -Dfailsafe.failIfNoSpecifiedTests=false`

## 列映射守卫

实体↔schema 与手写 SQL 的列一致性由两个契约守卫保障，随 CI 运行、不可静默跳过：

- `EntitySchemaColumnGuardIT`（failsafe）——枚举全部 `@TableName` 实体，逐列对照 `sql/schema.sql`（结构真源）。
- `scripts/check-sql-columns.py`——扫描注解 SQL / Mapper XML / 字符串列引用，对照同一真源。

`sql/schema.sql` 是 CREATE pass + ALTER pass 两段；两个守卫都会应用 `ALTER TABLE`，因此新增列请写进真源，守卫会自动跟上。
