# ==========================================
# 构建阶段：Maven 编译打包
# ==========================================
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# 先拷贝 pom.xml，利用 Docker 缓存依赖
COPY pom.xml ./

# 使用基础镜像自带的 Maven，避免 Wrapper 额外下载 Maven 发行包
RUN mvn -B dependency:go-offline

# 再拷贝源码进行编译
COPY src ./src

RUN mvn -B clean package -DskipTests

# ==========================================
# 运行阶段：JRE 运行 jar
# ==========================================
# 注意：使用 -jre（Debian/Ubuntu 版本）而非 -jre-alpine
# 因为 alpine 版本在 arm64 架构下没有官方镜像
FROM eclipse-temurin:17-jre

WORKDIR /app

# 安装必要工具（curl 用于健康检查）
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# 从构建阶段拷贝 jar
COPY --from=builder /app/target/XianQiJava-0.0.1-SNAPSHOT.jar app.jar

# 创建上传文件目录
RUN mkdir -p /app/uploads /app/logs

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8080/api/public/health || exit 1

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"]
