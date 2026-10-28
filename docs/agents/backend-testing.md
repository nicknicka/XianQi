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

- **全套（默认）**：`./scripts/test-backend.sh` —— 起一套隔离的 MySQL + Redis 容器，跑完清理，并检查无静默跳过。默认行为不变。
- **单条迭代（快路径）**：设 `XIANQI_TEST_REUSE_DB=1` 并导出你要用的库，脚本会跳过容器生命周期、直接复用：

  ```bash
  XIANQI_TEST_REUSE_DB=1 \
    MYSQL_URL="jdbc:mysql://127.0.0.1:3306/xianqi_test?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true" \
    MYSQL_USER=xianqi MYSQL_PASSWORD=testpass \
    REDIS_HOST=127.0.0.1 REDIS_PORT=6379 \
    ./scripts/test-backend.sh -Dsurefire.failIfNoSpecifiedTests=false -Dtest=NoUnit \
      -Dit.test=EntitySchemaColumnGuardIT -Dfailsafe.failIfNoSpecifiedTests=false
  ```

  额外参数会原样转交给 Maven，所以 `-Dit.test=…` 可以把范围缩到一条集成测试。忘了导出 `MYSQL_URL` 时脚本会**立即以退出码 2 失败**，不会静默退回起容器。
  > 复用模式下数据库不会重置。`sql/schema.sql` 是为空库一次性初始化设计的（无 `IF NOT EXISTS`），重复跑会因 `Table 'user' already exists` 失败——换个空库，或删库重建。

## 列映射守卫

实体↔schema 与手写 SQL 的列一致性由两个契约守卫保障，随 CI 运行、不可静默跳过：

- `EntitySchemaColumnGuardIT`（failsafe）——枚举全部 `@TableName` 实体，逐列对照 `sql/schema.sql`（结构真源）。
- `scripts/check-sql-columns.py`——扫描注解 SQL / Mapper XML / 字符串列引用，对照同一真源。

`sql/schema.sql` 是 CREATE pass + ALTER pass 两段；两个守卫都会应用 `ALTER TABLE`，因此新增列请写进真源，守卫会自动跟上。
