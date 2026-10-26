# ==========================================
# 构建阶段：Node 构建 H5 版本
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 先拷贝依赖文件，利用 Docker 缓存
COPY package.json package-lock.json ./
RUN npm ci

# 拷贝源码
COPY . .

# 构建 H5 版本
RUN npm run build:h5

# ==========================================
# 运行阶段：Nginx 提供静态文件
# ==========================================
FROM nginx:alpine

# H5 静态文件部署到 /h5/ 子路径
COPY --from=builder /app/dist/build/h5 /usr/share/nginx/html/h5

EXPOSE 80
