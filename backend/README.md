# XianQi 后端

校园二手交易与物品共享平台的后端服务，基于 Spring Boot 构建，提供商品交易、物品共享、用户认证、订单、即时通讯和 AI 辅助等能力。

## 技术栈

- Java 17
- Spring Boot 3.2.5
- Maven Wrapper
- MySQL 8
- Redis
- MyBatis-Plus
- Spring Security + JWT
- WebSocket
- Knife4j / SpringDoc
- LangChain4j（智谱 AI）

## 本地开发

### 1. 环境要求

- JDK 17+
- MySQL 8+
- Redis 6+

### 2. 初始化数据库

使用项目根目录 `sql/` 下的数据库脚本初始化 `Xianqi` 数据库。

### 3. 启动

```bash
./mvnw spring-boot:run
```

默认访问地址：

- API：`http://localhost:8080/api`
- API 文档：`http://localhost:8080/api/doc.html`

### 4. 打包

```bash
./mvnw clean package -DskipTests
```

## 环境变量

以下变量均可省略并使用默认值；生产环境应显式配置敏感信息。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | HTTP 服务端口 |
| `MYSQL_URL` | `jdbc:mysql://localhost:3306/Xianqi?...` | MySQL JDBC URL |
| `MYSQL_USER` | `root` | MySQL 用户名 |
| `MYSQL_PASSWORD` | `123456` | MySQL 密码 |
| `REDIS_HOST` | `localhost` | Redis 地址 |
| `REDIS_PORT` | `6379` | Redis 端口 |
| `REDIS_PASSWORD` | 空 | Redis 密码 |
| `JWT_SECRET` | `XianQiJavaSecretKey2026` | JWT 签名密钥 |
| `UPLOAD_PATH` | `./uploads` | 本地文件上传目录 |
| `ZHIPUAI_API_KEY` | 空 | 智谱 AI API Key |
| `ZHIPUAI_ENABLED` | `false` | 是否启用 AI 功能 |
| `OSS_ENABLED` | `false` | 是否启用阿里云 OSS |
| `OSS_ENDPOINT` | 空 | OSS Endpoint |
| `OSS_ACCESS_KEY_ID` | 空 | OSS AccessKey ID |
| `OSS_ACCESS_KEY_SECRET` | 空 | OSS AccessKey Secret |
| `OSS_BUCKET_NAME` | 空 | OSS Bucket 名称 |
| `OSS_BASE_URL` | 空 | OSS 访问基础 URL |
| `SMS_ENABLED` | `false` | 是否启用短信服务 |
| `ALIPAY_MOCK` | `true` | 是否启用支付宝模拟支付 |
| `AMAP_ENABLED` | `false` | 是否启用高德地图服务 |
