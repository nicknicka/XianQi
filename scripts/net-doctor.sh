#!/usr/bin/env bash
set -u

PROXY_VARS=(http_proxy HTTP_PROXY https_proxy HTTPS_PROXY all_proxy ALL_PROXY no_proxy NO_PROXY)
SERVICES=(
  'GitHub API|https://api.github.com'
  'Maven Central|https://repo1.maven.org/maven2/'
  'Docker Hub|https://hub.docker.com/v2/repositories/library/alpine/'
)

failures=0

print_value() {
  local name="$1"
  if [[ "${!name+x}" != "x" ]]; then
    echo "  $name=<未设置>"
  elif [[ -z "${!name}" ]]; then
    echo "  $name=<空>"
  else
    echo "  $name=${!name}"
  fi
}

effective_https_proxy() {
  local name
  for name in https_proxy HTTPS_PROXY all_proxy ALL_PROXY; do
    if [[ "${!name+x}" == "x" && -n "${!name}" ]]; then
      printf '%s\n' "${!name}"
      return 0
    fi
  done
  return 1
}

run_curl() {
  local mode="$1"
  local url="$2"

  if [[ "$mode" == direct ]]; then
    env -u http_proxy -u HTTP_PROXY -u https_proxy -u HTTPS_PROXY \
      -u all_proxy -u ALL_PROXY -u no_proxy -u NO_PROXY \
      curl --silent --show-error --fail --location --output /dev/null \
        --connect-timeout 5 --max-time 15 --noproxy '*' "$url"
  else
    curl --silent --show-error --fail --location --output /dev/null \
      --connect-timeout 5 --max-time 15 \
      --proxy "$proxy_value" --noproxy '' "$url"
  fi
}

run_check() {
  local mode="$1"
  local url="$2"

  local label
  if [[ "$mode" == "direct" ]]; then
    label=直连
  else
    label=代理
  fi

  if run_curl "$mode" "$url"; then
    echo "  [$label] PASS"
  else
    local rc=$?
    echo "  [$label] FAIL (curl exit $rc) 失败"
    failures=$((failures + 1))
  fi
}

echo '跨服务网络诊断'
echo '=============='
echo
echo '代理环境变量:'
for name in "${PROXY_VARS[@]}"; do
  print_value "$name"
done

proxy_value="$(effective_https_proxy || true)"
if [[ -n "$proxy_value" ]]; then
  echo "代理生效状态: 已配置 HTTPS 代理 $proxy_value"
else
  echo '代理生效状态: 未配置当前检查可用的 HTTPS 代理，代理检查将跳过'
fi
echo

for service in "${SERVICES[@]}"; do
  name="${service%%|*}"
  url="${service#*|}"
  echo "[$name] $url"

  if [[ -n "$proxy_value" ]]; then
    run_check proxy "$url"
  else
    echo '  [代理] SKIP: 未配置代理'
  fi

  run_check direct "$url"
  echo
done

if [[ "$failures" -gt 0 ]]; then
  echo "结果: FAIL，$failures 项关键检查失败"
  exit 1
fi

echo '结果: PASS，所有关键检查通过'
