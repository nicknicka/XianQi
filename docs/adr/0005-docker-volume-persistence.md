# ADR-0005: Docker Volume 数据持久化

## 状态
已采纳

## 背景
Docker 容器中的数据在容器删除后会丢失，需要通过持久化机制保存：
1. **Bind mount**：挂载宿主机目录
2. **Docker volume**：Docker 管理的卷
3. **tmpfs mount**：内存文件系统（临时）

## 决策
使用 Docker Volume 进行数据持久化，定义三个命名卷：

| Volume 名 | 用途 | 挂载点 |
|-----------|------|--------|
| `xianqi_mysql_data` | MySQL 数据文件 | MySQL 容器 /var/lib/mysql |
| `xianqi_redis_data` | Redis 持久化数据 | Redis 容器 /data |
| `xianqi_uploads` | 用户上传的文件 | 后端容器 /app/uploads + Nginx 容器 /usr/share/nginx/uploads |

日志文件使用 bind mount 到宿主机 `./logs/` 目录，方便直接查看。

## 理由
1. **Docker Volume 是推荐做法**：官方推荐使用 volume 而非 bind mount 持久化数据
2. **更好的隔离性**：volume 由 Docker 管理，不依赖宿主机目录结构
3. **更好的性能**：在 macOS/Windows 上，volume 比 bind mount 性能更好
4. **便于备份迁移**：`docker volume` 命令可以方便地备份和恢复
5. **跨平台一致**：Linux/macOS/Windows 行为一致

上传文件同时挂载到后端（写入）和 Nginx（读取），利用 Nginx 高性能提供静态文件服务，减轻后端压力。

## 后果
### 正面
- 数据安全，容器删除不丢失
- 性能好，隔离性强
- 上传文件由 Nginx 直接提供，性能最优
- 备份迁移方便

### 负面
- volume 存储在 Docker 内部，直接查看文件不如 bind mount 方便
- 需要用 `docker volume inspect` 才能找到实际路径

## 备选方案
- **Bind mount**：直接挂载宿主机目录，查看方便。但依赖宿主机路径，跨平台可能有权限问题。
- **全部用 OSS**：上传文件存阿里云 OSS，本地不存。但需要付费，开发环境不方便。
