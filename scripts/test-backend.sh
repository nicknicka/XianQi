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

# Opt-in reuse mode: run against a caller-provided database instead of starting
# fresh containers. Set XIANQI_TEST_REUSE_DB=1 and export MYSQL_URL (plus REDIS_*).
# This is the fast path for iterating on a single integration test, e.g.
#   XIANQI_TEST_REUSE_DB=1 MYSQL_URL=... ./scripts/test-backend.sh -Dit.test=SomeIT
REUSE_DB="${XIANQI_TEST_REUSE_DB:-0}"

MAVEN_ARGS=("$@")

cleanup() {
  local status=$?
  if [[ "$STARTED" == 1 ]]; then
    docker rm -f "$MYSQL_CONTAINER" "$REDIS_CONTAINER" >/dev/null 2>&1 || true
  fi
  exit "$status"
}
trap cleanup EXIT

if [[ "$REUSE_DB" != "0" ]]; then
  if [[ -z "${MYSQL_URL:-}" ]]; then
    echo "XIANQI_TEST_REUSE_DB is set but MYSQL_URL is empty." >&2
    echo "Export MYSQL_URL (and REDIS_HOST/REDIS_PORT) of a database you control, or unset XIANQI_TEST_REUSE_DB to start fresh containers." >&2
    exit 2
  fi
fi

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

# Start an isolated MySQL + Redis pair and export the JDBC/Redis connection
# settings application.yml reads. Default path; skipped entirely in reuse mode.
start_containers() {
  local mysql_port redis_port
  mysql_port="$(free_port)"
  redis_port="$(free_port)"

  echo "Starting isolated MySQL ${MYSQL_IMAGE} on 127.0.0.1:${mysql_port}..."
  docker run -d --name "$MYSQL_CONTAINER" \
    -e MYSQL_ROOT_PASSWORD=root-test-password \
    -e "MYSQL_DATABASE=${MYSQL_DATABASE}" \
    -e "MYSQL_USER=${MYSQL_USER}" \
    -e "MYSQL_PASSWORD=${MYSQL_PASSWORD}" \
    -p "127.0.0.1:${mysql_port}:3306" \
    --health-cmd="mysqladmin ping -h 127.0.0.1 -u${MYSQL_USER} -p${MYSQL_PASSWORD} --silent" \
    --health-interval=2s --health-timeout=5s --health-retries=30 \
    "$MYSQL_IMAGE" >/dev/null
  STARTED=1

  echo "Starting isolated Redis ${REDIS_IMAGE} on 127.0.0.1:${redis_port}..."
  docker run -d --name "$REDIS_CONTAINER" \
    -p "127.0.0.1:${redis_port}:6379" \
    --health-cmd="redis-cli ping" \
    --health-interval=2s --health-timeout=5s --health-retries=30 \
    "$REDIS_IMAGE" >/dev/null

  wait_healthy "$MYSQL_CONTAINER" MySQL
  wait_healthy "$REDIS_CONTAINER" Redis

  export MYSQL_URL="jdbc:mysql://127.0.0.1:${mysql_port}/${MYSQL_DATABASE}?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&connectionCollation=utf8mb4_unicode_ci"
  export MYSQL_USER MYSQL_PASSWORD
  export REDIS_HOST=127.0.0.1
  export REDIS_PORT="$redis_port"
}

if [[ "$REUSE_DB" != "0" ]]; then
  echo "Reusing caller-provided database: ${MYSQL_URL}"
else
  start_containers
fi

MAVEN_WRAPPER="${XIANQI_BACKEND_MVN:-$ROOT/backend/mvnw}"
echo "Running backend verification: ${MAVEN_WRAPPER} --batch-mode verify ${MAVEN_ARGS[*]+"${MAVEN_ARGS[*]}"}"
set +e
# "${arr[@]+...}" keeps `set -u` happy on bash 3.2 (macOS) when the array is empty.
(cd "$ROOT/backend" && "$MAVEN_WRAPPER" --batch-mode verify "${MAVEN_ARGS[@]+"${MAVEN_ARGS[@]}"}")
EXIT_CODE=$?
set -e

if [[ "$EXIT_CODE" -eq 0 ]]; then
  # 被静默跳过的集成测试曾掩盖真实缺陷（见 issue #40）。
  python3 "$ROOT/scripts/check-backend-skips.py" || EXIT_CODE=$?
fi

exit "$EXIT_CODE"
