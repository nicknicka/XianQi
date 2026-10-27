#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT_DIR/scripts/net-doctor.sh"
TESTS_FAILED=0
TEST_DIR=""

fail() {
  echo "FAIL: $*" >&2
  TESTS_FAILED=1
}

assert_contains() {
  local file="$1"
  local expected="$2"
  if ! grep -F -q -- "$expected" "$file"; then
    fail "expected $(basename "$file") to contain: $expected"
  fi
}

assert_not_contains() {
  local file="$1"
  local unexpected="$2"
  if grep -F -q -- "$unexpected" "$file"; then
    fail "expected $(basename "$file") not to contain: $unexpected"
  fi
}

setup_fake_curl() {
  TEST_DIR="$(mktemp -d)"
  mkdir "$TEST_DIR/bin"
  cat > "$TEST_DIR/bin/curl" <<'FAKE'
#!/usr/bin/env bash
set -u

mode=proxy
previous=""
for arg in "$@"; do
  if [[ "$previous" == "--noproxy" && "$arg" == "*" ]]; then
    mode=direct
  fi
  previous="$arg"
done

log="$FAKE_CURL_LOG.$mode"
{
  echo "BEGIN"
  for arg in "$@"; do
    printf 'ARG:%s\n' "$arg"
  done
  for name in http_proxy HTTP_PROXY https_proxy HTTPS_PROXY ALL_PROXY all_proxy no_proxy NO_PROXY; do
    if [[ "${!name+x}" == "x" ]]; then
      printf 'ENV:%s=%s\n' "$name" "${!name}"
    else
      printf 'ENV:%s=<UNSET>\n' "$name"
    fi
  done
  echo "END"
} >> "$log"

if [[ "$mode" == "direct" && "${FAKE_CURL_FAIL_DIRECT:-0}" == "1" ]]; then
  exit 7
fi
if [[ "$mode" == "proxy" && "${FAKE_CURL_FAIL_PROXY:-0}" == "1" ]]; then
  exit 5
fi
exit 0
FAKE
  chmod +x "$TEST_DIR/bin/curl"
  export FAKE_CURL_LOG="$TEST_DIR/curl-log"
  : > "$TEST_DIR/output"
}

cleanup() {
  if [[ -n "$TEST_DIR" && -d "$TEST_DIR" ]]; then
    rm -rf "$TEST_DIR"
  fi
}
trap cleanup EXIT

if [[ ! -x "$SCRIPT" ]]; then
  fail "scripts/net-doctor.sh must exist and be executable"
  exit 1
fi

if grep -E '(^|[[:space:]])timeout([[:space:]]|$)' "$SCRIPT" >/dev/null; then
  fail "net-doctor must not depend on the external timeout command"
fi

# Slice 1: configured proxy: each service is checked through inherited proxy env
# and separately through a direct curl with proxy variables removed.
setup_fake_curl
env \
  -u http_proxy -u HTTP_PROXY -u all_proxy -u no_proxy -u NO_PROXY \
  https_proxy=http://127.0.0.1:3128 \
  HTTPS_PROXY=http://127.0.0.1:3129 \
  ALL_PROXY=socks5://127.0.0.1:1080 \
  bash -c 'PATH="$1:$PATH" "$2"' bash "$TEST_DIR/bin" "$SCRIPT" > "$TEST_DIR/output" 2>&1
status=$?
if [[ $status -ne 0 ]]; then
  fail "successful checks should exit 0, got $status"
fi

assert_contains "$TEST_DIR/output" "代理环境变量"
assert_contains "$TEST_DIR/output" "https_proxy=http://127.0.0.1:3128"
assert_contains "$TEST_DIR/output" "HTTPS_PROXY=http://127.0.0.1:3129"
assert_contains "$TEST_DIR/output" "ALL_PROXY=socks5://127.0.0.1:1080"
assert_contains "$TEST_DIR/output" "GitHub API"
assert_contains "$TEST_DIR/output" "Maven Central"
assert_contains "$TEST_DIR/output" "Docker Hub"
assert_contains "$TEST_DIR/output" "[代理]"
assert_contains "$TEST_DIR/output" "[直连]"
assert_contains "$TEST_DIR/output" "PASS"

for url in \
  https://api.github.com \
  https://repo1.maven.org/maven2/ \
  https://hub.docker.com/v2/repositories/library/alpine/
do
  assert_contains "$FAKE_CURL_LOG.proxy" "ARG:$url"
  assert_contains "$FAKE_CURL_LOG.direct" "ARG:$url"
done
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:--proxy"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:http://127.0.0.1:3128"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:--noproxy"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:"
assert_contains "$FAKE_CURL_LOG.direct" "ARG:--noproxy"
assert_contains "$FAKE_CURL_LOG.direct" "ARG:*"
assert_contains "$FAKE_CURL_LOG.proxy" "ENV:https_proxy=http://127.0.0.1:3128"
for name in http_proxy HTTP_PROXY https_proxy HTTPS_PROXY ALL_PROXY all_proxy no_proxy NO_PROXY; do
  assert_contains "$FAKE_CURL_LOG.direct" "ENV:$name=<UNSET>"
done

# Slice 2: failed critical checks produce readable FAIL lines and nonzero status.
setup_fake_curl
env \
  -u http_proxy -u HTTP_PROXY -u all_proxy -u no_proxy -u NO_PROXY \
  https_proxy=http://127.0.0.1:3128 \
  HTTPS_PROXY=http://127.0.0.1:3129 \
  ALL_PROXY=socks5://127.0.0.1:1080 \
  FAKE_CURL_FAIL_DIRECT=1 \
  FAKE_CURL_FAIL_PROXY=1 \
  bash -c 'PATH="$1:$PATH" "$2"' bash "$TEST_DIR/bin" "$SCRIPT" > "$TEST_DIR/output" 2>&1
status=$?
if [[ $status -eq 0 ]]; then
  fail "failed direct checks should exit nonzero"
fi
assert_contains "$TEST_DIR/output" "[代理] FAIL"
assert_contains "$TEST_DIR/output" "[直连] FAIL"
assert_contains "$TEST_DIR/output" "失败"

# Slice 3: without configured proxy, direct checks still run and proxy rows skip.
setup_fake_curl
env \
  -u http_proxy -u HTTP_PROXY -u https_proxy -u HTTPS_PROXY \
  -u ALL_PROXY -u all_proxy -u no_proxy -u NO_PROXY \
  bash -c 'PATH="$1:$PATH" "$2"' bash "$TEST_DIR/bin" "$SCRIPT" > "$TEST_DIR/output" 2>&1
status=$?
if [[ $status -ne 0 ]]; then
  fail "direct-only success should exit 0 when no proxy is configured, got $status"
fi
assert_contains "$TEST_DIR/output" "SKIP"
assert_contains "$TEST_DIR/output" "未配置代理"
assert_contains "$FAKE_CURL_LOG.direct" "ARG:https://api.github.com"

# Slice 4: no_proxy must not prevent the diagnostic from forcing a proxy check.
setup_fake_curl
env \
  -u http_proxy -u HTTP_PROXY -u all_proxy \
  https_proxy=http://127.0.0.1:3128 \
  HTTPS_PROXY=http://127.0.0.1:3129 \
  ALL_PROXY=socks5://127.0.0.1:1080 \
  no_proxy=api.github.com \
  NO_PROXY=api.github.com \
  bash -c 'PATH="$1:$PATH" "$2"' bash "$TEST_DIR/bin" "$SCRIPT" > "$TEST_DIR/output" 2>&1
status=$?
if [[ $status -ne 0 ]]; then
  fail "forced proxy and direct checks should exit 0 with no_proxy set, got $status"
fi
assert_contains "$FAKE_CURL_LOG.direct" "ARG:https://api.github.com"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:https://api.github.com"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:--proxy"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:http://127.0.0.1:3128"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:--noproxy"
assert_contains "$FAKE_CURL_LOG.proxy" "ARG:"

if [[ $TESTS_FAILED -ne 0 ]]; then
  echo "net-doctor tests: FAILED"
  exit 1
fi
echo "net-doctor tests: PASSED"
