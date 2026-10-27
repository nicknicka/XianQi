#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXY_VARS=(http_proxy HTTP_PROXY https_proxy HTTPS_PROXY all_proxy ALL_PROXY no_proxy NO_PROXY)

without_proxy() {
  env -u http_proxy -u HTTP_PROXY -u https_proxy -u HTTPS_PROXY \
      -u all_proxy -u ALL_PROXY -u no_proxy -u NO_PROXY "$@"
}

print_proxy_state() {
  echo '代理环境变量:'
  local name
  for name in "${PROXY_VARS[@]}"; do
    if [[ "${!name+x}" != "x" ]]; then
      echo "  $name=<未设置>"
    elif [[ -z "${!name}" ]]; then
      echo "  $name=<空>"
    else
      echo "  $name=${!name}"
    fi
  done
}

is_write_method() {
  local previous=''
  local arg
  for arg in "$@"; do
    if [[ "$previous" == "--method" || "$previous" == "-X" ]]; then
      case "$arg" in
        POST|POST|PUT|PATCH|DELETE|post|put|patch|delete|Post|Put|Patch|Delete) return 0 ;;
      esac
    fi
    previous="$arg"
  done
  return 1
}

is_timeout_error() {
  grep -Eqi 'context deadline exceeded|Client[.]Timeout|i/o timeout|TLS handshake timeout|EOF|broken pipe|connection reset' <<< "$1"
}

doctor() {
  local rc=0
  print_proxy_state
  echo
  echo '网络诊断（复用 scripts/net-doctor.sh）:'
  if ! "$ROOT/scripts/net-doctor.sh"; then
    rc=1
  fi

  echo
  echo 'GitHub 认证状态:'
  if without_proxy gh api user >/dev/null 2>&1; then
    echo '  [认证] PASS'
  else
    echo '  [认证] FAIL (检查 GH_TOKEN / gh auth status)'
    rc=1
  fi

  echo
  echo 'GitHub API 响应状态:'
  if without_proxy gh api rate_limit >/dev/null 2>&1; then
    echo '  [API] PASS'
  else
    echo '  [API] FAIL (REST API 不可达或令牌无权限)'
    rc=1
  fi

  return "$rc"
}

api() {
  local output status
  set +e
  output="$(without_proxy gh api "$@" 2>&1)"
  status=$?
  set -e

  if [[ "$status" -eq 0 ]]; then
    printf '%s\n' "$output"
    return 0
  fi

  printf '%s\n' "$output" >&2
  if is_write_method "$@" && is_timeout_error "$output"; then
    echo '写操作超时：不要立即重试。先读取当前状态确认是否已写入，再决定是否重试。' >&2
  else
    echo 'GitHub REST API 调用失败。检查代理环境变量、GH_TOKEN 与 API 响应状态。' >&2
  fi
  return "$status"
}

usage() {
  cat >&2 <<'USAGE'
Usage:
  gh-stable.sh doctor
  gh-stable.sh api [gh api arguments...]
USAGE
}

case "${1:-}" in
  doctor)
    shift
    doctor
    ;;
  api)
    shift
    api "$@"
    ;;
  *)
    usage
    exit 2
    ;;
esac
