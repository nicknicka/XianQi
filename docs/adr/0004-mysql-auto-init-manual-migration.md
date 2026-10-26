# ADR-0004: MySQL 容器自动初始化 + 手动迁移脚本

## 状态
已采纳

## 背景
数据库初始化和版本迁移有多种方案：
1. 完全手动执行 SQL
2. MySQL 容器自动执行 initdb 脚本（首次启动）
3. Flyway/Liquibase 等数据库迁移工具（应用启动时自动迁移）
4. 独立的迁移服务/Job

## 决策
采用 **MySQL 容器自动初始化 + 手动迁移脚本** 的方案：

### 首次启动
- `sql/schema.sql`：建表脚本（50 张表），挂载到 MySQL 容器的 `/docker-entrypoint-initdb.d/01_schema.sql`
- `sql/data.sql`：基础数据 + 测试数据，挂载到 `/docker-entrypoint-initdb.d/02_data.sql`
- MySQL 容器首次启动时自动按文件名顺序执行

### 后续迁移
- 迁移脚本放在 `sql/migrations/` 目录
- 命名格式：`YYYYMMDD_description.sql`（如 `20260516_add_condition_level_to_share_item.sql`）
- 由开发者/运维手动执行，或在部署脚本中顺序执行

## 理由
1. **简单直接**：对于校园/毕设项目，不需要复杂的迁移工具
2. **零侵入**：不需要修改后端代码引入 Flyway 等依赖
3. **MySQL 原生支持**：docker-entrypoint-initdb.d 是官方机制，稳定可靠
4. **可见可控**：每个迁移脚本都是独立文件，可以 review 和回滚
5. **迁移频率低**：项目功能已基本稳定，后续变更不会太频繁

## 后果
### 正面
- 实现简单，零额外依赖
- 首次部署一键初始化，不需要手动导数据
- 迁移脚本清晰可见，便于 review

### 负面
- 没有自动迁移，部署新版本时需要手动执行迁移脚本
- 没有版本追踪表，不知道当前数据库处于哪个版本
- 回滚需要手动写反向脚本

## 备选方案
- **Flyway**：Spring Boot 集成方便，自动迁移，有版本追踪。但需要改代码，对于功能已稳定的项目收益不大。
- **Liquibase**：功能更强大，支持多种格式。但学习成本高，过于重量级。
