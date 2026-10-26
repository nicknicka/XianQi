# XianQi（闲七校园）

[![CI](https://github.com/nicknicka/XianQi/actions/workflows/ci.yml/badge.svg)](https://github.com/nicknicka/XianQi/actions/workflows/ci.yml)

校园二手交易与共享平台 —— 一个功能完整的校园生活服务平台。

## ✨ 项目特性

- 🛒 **二手交易**：发布、浏览、搜索、收藏、下单、评价完整流程
- 🔄 **物品共享**：闲置物品租借，押金管理，预约借用
- 💬 **即时通讯**：WebSocket 实时聊天，AI 智能客服
- 🤖 **AI 智能体**：5 个 AI Agent（客服、推荐、描述生成、定价顾问、交易安全）
- ⭐ **信用系统**：完整的信用分体系，防刷机制
- ⚡ **秒杀活动**：限时秒杀促销
- 🎨 **多主题**：6 套可爱风格主题自由切换
- 📱 **多端支持**：H5 + 微信小程序 + 管理后台

## 🏗️ 技术架构

### 后端
- **框架**：Spring Boot 3.2 + MyBatis-Plus 3.5
- **数据库**：MySQL 8.0（49 张表）
- **缓存**：Redis 7
- **安全**：Spring Security + JWT
- **AI**：LangChain4j + 智谱 AI
- **文档**：Knife4j（Swagger）

### 管理后台
- **框架**：Vue 3 + TypeScript + Vite
- **UI**：Element Plus
- **状态管理**：Pinia
- **图表**：ECharts

### 用户端
- **框架**：UniApp + Vue 3 + TypeScript
- **UI**：uni-ui
- **状态管理**：Pinia
- **支持平台**：H5、微信小程序、支付宝小程序等

## 📁 仓库结构

```
XianQi/
├── backend/          # Spring Boot 后端
├── admin/            # Vue3 管理后台
├── mobile/           # UniApp 用户端（H5 + 小程序）
├── docker/           # Docker 相关配置
│   └── nginx/        # Nginx 网关配置
├── sql/              # 数据库脚本
│   ├── schema.sql    # 建表脚本
│   ├── data.sql      # 初始化数据
│   └── migrations/   # 迁移脚本
├── docs/             # 文档
│   ├── adr/          # 架构决策记录
│   └── deployment.md # 部署指南
├── .github/
│   └── workflows/    # GitHub Actions CI
├── docker-compose.yml
├── .env.example
├── GLOSSARY.md       # 术语表
└── README.md
```

## 🚀 快速开始

### 前置要求
- Docker 20.10+
- Docker Compose v2+

### 一键启动

```bash
# 1. 克隆仓库
git clone https://github.com/nicknicka/XianQi.git
cd XianQi

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 修改配置（默认可直接启动）

# 3. 启动
docker compose up -d

# 4. 等待启动完成（首次约 3-5 分钟）
docker compose logs -f backend
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 用户端 H5 | http://localhost/h5/ |
| 管理后台 | http://localhost/admin/ |
| API 文档 | http://localhost/api/doc.html |
| 健康检查 | http://localhost/health |

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |

更多部署细节请参考 [部署指南](docs/deployment.md)。

## 📖 文档

- [部署指南](docs/deployment.md) — Docker 部署、运维、故障排查
- [术语表](GLOSSARY.md) — 项目核心领域术语定义
- [架构决策记录](docs/adr/) — 重要技术决策的背景和理由
- 后端开发指南 — 见 `backend/README.md`
- 管理后台开发指南 — 见 `admin/README.md`
- 用户端开发指南 — 见 `mobile/README.md`

## 🛠️ 开发

### 本地开发（不用 Docker）

三个项目都可以独立本地开发：

```bash
# 后端
cd backend
./mvnw spring-boot:run

# 管理后台
cd admin
npm install
npm run dev

# 用户端（H5）
cd mobile
npm install
npm run dev:h5
```

### 本地开发（用 Docker 跑中间件）

如果只想用 Docker 跑 MySQL 和 Redis，本地跑代码：

```bash
docker compose up -d mysql redis
# 然后分别启动各服务
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📮 联系

如有问题，请提交 Issue 或联系项目维护者。
