#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="xianqi-backend-test-$$"
MYSQL_CONTAINER="${PROJECT_NAME}-mysql"
REDIS_CONTAINER="${PROJECT_NAME}-redis"
MYSQL_IMAGE="${XIANQI_TEST_MYSQL_IMAGE:-mysql:8.0}"
REDIS_IMAGE="${XIANQI_TEST_REDIS_IMAGE:-redis:7-alpine}"
MYSQL_DATABASE="${XIANQI_TEST_MYSQL_DATABASE:-xianqi_test}"
MYSQL_USER="${XIANQI_TEST_MYSQL_USER:-xianqi}"
MYSQL_PASSWORD="${XIANQI_TEST_MYSQL_PASSWORD:-testpass}"
STARTED=0
EXIT_CODE=0

cleanup() {
  local status=$?
  if [[ "$STARTED" == 1 ]]; then
    docker rm -f "$MYSQL_CONTAINER" "$REDIS_CONTAINER" >/dev/null 2>&1 || true
  fi
  exit "$status"
}
trap cleanup EXIT

free_port() {
  python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()'
}

wait_healthy() {
  local container="$1" label="$2"
  for _ in $(seq 1 60); do
    if [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container" 2>/dev/null || true)" == "healthy" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for ${label} (${container}) to become healthy." >&2
  docker logs "$container" >&2 || true
  return 1
}

MYSQL_PORT="$(free_port)"
REDIS_PORT="$(free_port)"

echo "Starting isolated MySQL ${MYSQL_IMAGE} on 127.0.0.1:${MYSQL_PORT}..."
docker run -d --name "$MYSQL_CONTAINER" \
  -e MYSQL_ROOT_PASSWORD=root-test-password \
  -e "MYSQL_DATABASE=${MYSQL_DATABASE}" \
  -e "MYSQL_USER=${MYSQL_USER}" \
  -e "MYSQL_PASSWORD=${MYSQL_PASSWORD}" \
  -p "127.0.0.1:${MYSQL_PORT}:3306" \
  --health-cmd="mysqladmin ping -h 127.0.0.1 -u${MYSQL_USER} -p${MYSQL_PASSWORD} --silent" \
  --health-interval=2s --health-timeout=5s --health-retries=30 \
  "$MYSQL_IMAGE" >/dev/null
STARTED=1

echo "Starting isolated Redis ${REDIS_IMAGE} on 127.0.0.1:${REDIS_PORT}..."
docker run -d --name "$REDIS_CONTAINER" \
  -p "127.0.0.1:${REDIS_PORT}:6379" \
  --health-cmd="redis-cli ping" \
  --health-interval=2s --health-timeout=5s --health-retries=30 \
  "$REDIS_IMAGE" >/dev/null

wait_healthy "$MYSQL_CONTAINER" MySQL
wait_healthy "$REDIS_CONTAINER" Redis

export MYSQL_URL="jdbc:mysql://127.0.0.1:${MYSQL_PORT}/${MYSQL_DATABASE}?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&connectionCollation=utf8mb4_unicode_ci"
export MYSQL_USER MYSQL_PASSWORD
export REDIS_HOST=127.0.0.1
export REDIS_PORT

MAVEN_WRAPPER="${XIANQI_BACKEND_MVN:-$ROOT/backend/mvnw}"
echo "Running backend verification: ${MAVEN_WRAPPER} --batch-mode verify"
set +e
(cd "$ROOT/backend" && "$MAVEN_WRAPPER" --batch-mode verify)
EXIT_CODE=$?
set -e
exit "$EXIT_CODE"
