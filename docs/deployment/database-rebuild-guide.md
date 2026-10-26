# 开发数据库重建指南

> ⚠️ **警告：此操作会删除所有开发数据。生产环境严禁使用。**

## 背景

项目数据库基线（schema.sql）已经重写，新基线可以从零一次初始化成功。
如果你本地的 MySQL volume 还是旧的残缺数据库（只有 14 张表），需要删除 volume 后重新初始化。

## 安全重建步骤（开发环境）

### 1. 停止所有容器

```bash
docker compose down
```

### 2. 删除 MySQL 数据卷

```bash
# ⚠️ 会丢失所有开发数据（用户、商品、订单、聊天记录等）
docker volume rm xianqi_mysql_data
```

### 3. 重新启动

```bash
docker compose up -d
```

MySQL 首次启动时会自动执行：
1. `/docker-entrypoint-initdb.d/01_schema.sql` — 建表（完整 schema）
2. `/docker-entrypoint-initdb.d/02_data.sql` — 基础数据（管理员、分类、校园位置等）

### 4. 验证初始化成功

```bash
# 查看表数量（应该是 48 张业务表）
docker exec xianqi-mysql mysql -u xianqi -pxianqi123 Xianqi -e "SHOW TABLES;" | wc -l

# 查看外键数量（应该有 69 条）
docker exec xianqi-mysql mysql -u xianqi -pxianqi123 Xianqi -e "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'Xianqi';"
```

## 演示数据

`data.sql` 只包含系统运行必需的基础数据，不含测试用户、测试商品等演示数据。

演示数据目录：`sql/seed/`（待创建）

开发环境需要演示数据时，手动执行对应 SQL：

```bash
docker exec -i xianqi-mysql mysql -u xianqi -pxianqi123 Xianqi < sql/seed/dev_demo_data.sql
```

## CI 验证

每次代码提交，CI 都会自动运行 fresh-init 验证：
- 空 MySQL volume 执行 schema + data.sql
- 验证表数、外键数、基础数据
- 验证无备份表、视图等残留对象
- 验证无 INT / BIGINT UNSIGNED 混用

## 生产环境注意事项

🚨 **生产环境绝对不能删除 volume 重建。**

生产环境的结构变更通过 `sql/migrations/` 下的手动迁移脚本逐步演进。
每次部署时按顺序执行尚未执行的迁移脚本。

迁移脚本命名格式：`YYYYMMDD_description.sql`
