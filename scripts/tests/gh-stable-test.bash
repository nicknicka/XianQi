#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT/scripts/gh-stable.sh"
FAILED=0
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

pass() { printf 'ok - %s\n' "$1"; }
fail_case() { printf 'not ok - %s\n' "$1"; FAILED=1; }

make_fakes() {
  local bin="$1"
  mkdir -p "$bin"
  cat > "$bin/gh" <<'FAKE'
#!/usr/bin/env bash
set -Eeuo pipefail
printf 'gh' >> "${FAKE_LOG:?}"
for arg in "$@"; do printf '\t%s' "$arg" >> "${FAKE_LOG:?}"; done
printf '\n' >> "${FAKE_LOG:?}"
if [[ "${FAKE_GH_FAIL:-0}" == 1 ]]; then
  echo "gh: ${FAKE_GH_ERROR:-server error}" >&2
  exit 1
fi
printf '{"ok":true}\n'
FAKE
  cat > "$bin/curl" <<'FAKE'
#!/usr/bin/env bash
set -Eeuo pipefail
printf 'curl' >> "${FAKE_LOG:?}"
for arg in "$@"; do printf '\t%s' "$arg" >> "${FAKE_LOG:?}"; done
printf '\n' >> "${FAKE_LOG:?}"
exit "${FAKE_CURL_EXIT:-0}"
FAKE
  chmod +x "$bin/gh" "$bin/curl"
}

# Usage: run_case <gh_fail> <curl_exit> <gh_error> -- <script args...>
run_case() {
  local gh_fail="$1" curl_exit="$2" gh_error="$3"
  shift 3
  [[ "$1" == "--" ]] && shift
  local tmp; tmp="$(mktemp -d "$TMP_ROOT/case.XXXXXX")"
  make_fakes "$tmp/bin"
  : > "$tmp/log"
  set +e
  PATH="$tmp/bin:$PATH" FAKE_LOG="$tmp/log" \
    FAKE_GH_FAIL="$gh_fail" FAKE_CURL_EXIT="$curl_exit" FAKE_GH_ERROR="$gh_error" \
    https_proxy=http://127.0.0.1:7897 \
    "$SCRIPT" "$@" >"$tmp/out" 2>&1
  local rc=$?
  set -e
  printf '%s\n' "$rc" > "$tmp/rc"
  printf '%s\n' "$tmp"
}

expect_rc() {
  local tmp="$1" expected="$2" label="$3"
  local actual; actual="$(cat "$tmp/rc")"
  if [[ "$actual" == "$expected" ]]; then pass "$label"; else
    printf 'expected rc %s got %s\n' "$expected" "$actual" >&2
    cat "$tmp/out" >&2
    fail_case "$label"
  fi
}

assert_contains() {
  local tmp="$1" needle="$2" label="$3"
  if grep -Fq "$needle" "$tmp/out"; then pass "$label"; else
    printf 'missing %q\n' "$needle" >&2; cat "$tmp/out" >&2; fail_case "$label"
  fi
}

# doctor: direct connectivity fails (curl exit 7)
tmp="$(run_case 0 7 '' -- doctor)"
expect_rc "$tmp" 1 "doctor fails when direct connectivity fails"
assert_contains "$tmp" "直连" "doctor reports direct result"
assert_contains "$tmp" "https_proxy=" "doctor reports proxy env"
assert_contains "$tmp" "net-doctor" "doctor reuses net-doctor"

# doctor: everything reachable
tmp="$(run_case 0 0 '' -- doctor)"
expect_rc "$tmp" 0 "doctor succeeds when API is reachable"
assert_contains "$tmp" "认证" "doctor reports authentication status"
assert_contains "$tmp" "API" "doctor reports API status"

# api read: must call REST, never graphql
tmp="$(run_case 0 0 '' -- api repos/o/r/issues/1)"
expect_rc "$tmp" 0 "REST read succeeds"
if grep -Fq $'\tgraphql' "$tmp/log"; then fail_case "read does not use GraphQL"; else pass "read does not use GraphQL"; fi
if grep -Fq $'\tapi' "$tmp/log"; then pass "read uses gh api (REST)"; else fail_case "read uses gh api (REST)"; fi

# api write timeout: nonzero + guidance to read state first
tmp="$(run_case 1 0 'context deadline exceeded (Client.Timeout exceeded while awaiting headers)' -- api --method POST repos/o/r/issues/1/comments -f body=hi)"
expect_rc "$tmp" 1 "write timeout exits nonzero"
assert_contains "$tmp" "先读取" "write timeout instructs reading state before retrying"

# api server error: nonzero + reported
tmp="$(run_case 1 0 'API failure (500)' -- api --method GET repos/o/r/issues/1)"
expect_rc "$tmp" 1 "server error exits nonzero"
assert_contains "$tmp" "500" "server error is reported"

# auth failure: nonzero + guidance
tmp="$(run_case 1 0 'HTTP 401: Bad credentials' -- api user)"
expect_rc "$tmp" 1 "auth failure exits nonzero"
assert_contains "$tmp" "GH_TOKEN" "auth failure mentions token"

if [[ "$FAILED" -ne 0 ]]; then
  echo 'gh-stable tests: FAILED'
  exit 1
fi
echo 'gh-stable tests: PASSED'
