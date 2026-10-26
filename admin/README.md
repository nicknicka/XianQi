# XianQi Admin

校园二手交易平台的管理后台前端，用于管理员管理商品、用户、订单等平台数据。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios

## 本地开发

```bash
npm install
npm run dev
```

开发环境默认访问 `http://localhost:3000`，API 请求代理到 `http://localhost:8080`。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`。生产环境部署在 `/admin/` 子路径下，可通过 Dockerfile 构建镜像：

```bash
docker build -t xianqi-admin .
```
