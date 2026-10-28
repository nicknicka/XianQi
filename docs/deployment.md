# 部署指南

## 快速开始

### 前置要求
- Docker 20.10+
- Docker Compose v2+
- 至少 2GB 可用内存

### 一键启动

```bash
# 1. 克隆仓库
git clone https://github.com/nicknicka/XianQi.git
cd XianQi

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，根据需要修改配置（默认配置可直接启动）

# 3. 配置本地域名（可选，推荐）
# macOS / Linux:
echo "127.0.0.1 xianqi.local" | sudo tee -a /etc/hosts
# Windows: 以管理员身份运行 cmd，执行：
# echo 127.0.0.1 xianqi.local >> C:\Windows\System32\drivers\etc\hosts

# 4. 启动所有服务
docker compose up -d

# 5. 等待启动完成（首次启动需要构建镜像和初始化数据库，约 3-5 分钟）
docker compose logs -f backend

# 6. 访问
# 用户端 H5: http://xianqi.local/h5/ （或 http://localhost/h5/）
# 管理后台: http://xianqi.local/admin/ （或 http://localhost/admin/）
# API 文档: http://xianqi.local/api/doc.html
# 健康检查: http://xianqi.local/health
```

### 默认账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 测试用户1 | test1 | 123456 |
| 测试用户2 | test2 | 123456 |

---

## 常用命令

```bash
# 启动服务
docker compose up -d

# 启动服务（含开发工具：phpMyAdmin, Redis Commander）
docker compose --profile dev up -d

# 停止服务
docker compose down

# 停止并删除数据卷（⚠️ 会丢失所有数据！）
docker compose down -v

# 查看日志
docker compose logs -f          # 所有服务
docker compose logs -f backend  # 指定服务

# 重启某个服务
docker compose restart backend

# 重新构建并启动
docker compose up -d --build backend
```

---

## 开发工具（dev profile）

启动时加上 `--profile dev` 可以启用额外的开发工具：

```bash
docker compose --profile dev up -d
```

| 工具 | 地址 | 默认账号 |
|------|------|---------|
| phpMyAdmin | http://xianqi.local:8081 | xianqi / xianqi123 |
| Redis Commander | http://xianqi.local:8082 | admin / admin123 |

---

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Nginx 网关 | 80 | 统一入口 |
| 后端 API | 8080 | Spring Boot（也可通过 Nginx 访问 /api/） |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| phpMyAdmin | 8081 | dev profile |
| Redis Commander | 8082 | dev profile |

---

## 数据库迁移

当需要升级数据库 schema 时：

1. 将迁移 SQL 文件放到 `sql/migrations/` 目录
2. 命名格式：`YYYYMMDD_description.sql`
3. **提交前必须通过迁移守卫**：`python3 scripts/check-migration-baseline.py`
   —— 迁移脚本描述的结构必须与 `sql/schema.sql`（数据库基线）一致：键列用有符号整数、时间列用 `created_at`/`updated_at`、主键名与列类型/长度/可空性都与基线相同。CI 会强制校验。
4. 手动执行迁移：

```bash
# 方式一：用 phpMyAdmin 导入
# 方式二：命令行执行
docker exec -i xianqi-mysql mysql -u xianqi -pxianqi123 Xianqi < sql/migrations/20260516_add_condition_level_to_share_item.sql
```

---

## 生产部署注意事项

1. **修改默认密码**：务必修改 .env 中的所有默认密码
2. **JWT 密钥**：生成一个强随机的 JWT_SECRET
3. **配置 SSL**：使用 Nginx 配置 HTTPS（Let's Encrypt）
4. **关闭开发端口**：生产环境不要暴露 MySQL、Redis、后端的直接端口
5. **备份数据**：定期备份 MySQL 和上传文件
6. **启用 OSS**：生产环境建议使用阿里云 OSS 存储上传文件
7. **启用真实短信/支付**：将 mock 模式改为真实配置

---

## 故障排查

### GitHub、Maven Central 或 Docker Hub 网络异常
```bash
# 显示当前代理环境变量，并分别验证代理访问和清除代理变量后的真实直连
./scripts/net-doctor.sh
```

脚本会检查 GitHub API、Maven Central 和 Docker Hub。若代理或直连的关键检查失败，命令返回非零退出码，并在输出中标注失败的服务与访问方式，可据此区分代理配置问题、环境变量劫持、目标服务故障或真实直连故障。

### 后端启动失败
```bash
# 查看后端日志
docker compose logs backend

# 常见原因：
# 1. MySQL 还没准备好 → 等待健康检查通过后会自动重启
# 2. 数据库连接配置错误 → 检查 .env 中的 MYSQL_* 配置
# 3. 端口被占用 → 修改 .env 中的 SERVER_PORT
```

### 页面 404
- 确认 Nginx 容器在运行：`docker compose ps nginx`
- 检查路径是否正确（注意末尾的 /，如 /admin/ 和 /h5/）
- 查看 Nginx 日志：`docker compose logs nginx`

### 无法连接数据库
- 确认 MySQL 容器健康：`docker compose ps mysql`
- 检查端口是否被占用：`lsof -i :3306`
- 查看 MySQL 日志：`docker compose logs mysql`
