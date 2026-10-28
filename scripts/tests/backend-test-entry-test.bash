#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT/scripts/test-backend.sh"
FAILED=0
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

pass() { printf 'ok - %s\n' "$1"; }
fail_case() { printf 'not ok - %s\n' "$1"; FAILED=1; }

make_fakes() {
  local bin="$1"
  mkdir -p "$bin"
  cat > "$bin/docker" <<'FAKE'
#!/usr/bin/env bash
set -Eeuo pipefail
printf 'docker %s\n' "$*" >> "${FAKE_LOG:?}"
case "$1" in
  run)
    if [[ "${FAKE_RUN_FAIL:-0}" == 1 ]]; then exit 1; fi
    printf 'fake-container-id\n'
    ;;
  inspect)
    echo "${FAKE_INSPECT_STATUS:-healthy}"
    ;;
  rm|stop)
    ;;
  *)
    ;;
esac
FAKE
  cat > "$bin/mvnw" <<'FAKE'
#!/usr/bin/env bash
set -Eeuo pipefail
printf 'mvnw %s\n' "$*" >> "${FAKE_LOG:?}"
printf 'MYSQL_URL=%s\n' "${MYSQL_URL:-}" >> "${FAKE_ENV_LOG:?}"
exit "${FAKE_MVN_EXIT:-0}"
FAKE
  chmod +x "$bin/docker" "$bin/mvnw"
}

run_case() {
  local name="$1" run_fail="$2" inspect="$3" mvn_exit="$4"
  local tmp; tmp="$(mktemp -d "$TMP_ROOT/case.XXXXXX")"
  make_fakes "$tmp/bin"
  : > "$tmp/log"; : > "$tmp/env"
  set +e
  PATH="$tmp/bin:$PATH" FAKE_LOG="$tmp/log" FAKE_ENV_LOG="$tmp/env" \
    FAKE_RUN_FAIL="$run_fail" FAKE_INSPECT_STATUS="$inspect" FAKE_MVN_EXIT="$mvn_exit" \
    XIANQI_BACKEND_MVN="$tmp/bin/mvnw" \
    "$SCRIPT" >"$tmp/out" 2>&1
  local rc=$?
  set -e
  printf '%s\n' "$rc" > "$tmp/rc"
  printf '%s\n' "$tmp"
}

expect_rc() {
  local tmp="$1" expected="$2" label="$3"
  local actual; actual="$(cat "$tmp/rc")"
  if [[ "$actual" == "$expected" ]]; then pass "$label"; else
    printf 'expected rc %s got %s\n' "$expected" "$actual" >&2; cat "$tmp/out" >&2; fail_case "$label"
  fi
}

assert_log_contains() {
  local tmp="$1" needle="$2" label="$3"
  if grep -Fq "$needle" "$tmp/log"; then pass "$label"; else
    printf 'missing %q\n' "$needle" >&2; cat "$tmp/log" >&2; fail_case "$label"
  fi
}

# reuse mode: no containers are started, the provided MYSQL_URL is used, and extra
# args are forwarded to Maven.
tmp="$(mktemp -d "$TMP_ROOT/case.XXXXXX")"
make_fakes "$tmp/bin"
: > "$tmp/log"; : > "$tmp/env"
set +e
PATH="$tmp/bin:$PATH" FAKE_LOG="$tmp/log" FAKE_ENV_LOG="$tmp/env" \
  XIANQI_BACKEND_MVN="$tmp/bin/mvnw" \
  XIANQI_TEST_REUSE_DB=1 \
  MYSQL_URL="jdbc:mysql://127.0.0.1:9/reuse_db" \
  "$SCRIPT" -Dit.test=SomeIT -Dfailsafe.failIfNoSpecifiedTests=false >"$tmp/out" 2>&1
reuse_rc=$?
set -e
printf '%s\n' "$reuse_rc" > "$tmp/rc"
expect_rc "$tmp" 0 "reuse mode runs the suite and exits 0"
if grep -Fq "docker run" "$tmp/log"; then fail_case "reuse mode does not start containers"; else pass "reuse mode does not start containers"; fi
if grep -Fq "docker rm" "$tmp/log"; then fail_case "reuse mode does not clean up containers it never started"; else pass "reuse mode does not clean up containers it never started"; fi
assert_log_contains "$tmp" "mvnw --batch-mode verify -Dit.test=SomeIT -Dfailsafe.failIfNoSpecifiedTests=false" "forwards extra args to Maven"
assert_contains() { grep -Fq "$1" "$tmp/env" && pass "$2" || fail_case "$2"; }
assert_contains "MYSQL_URL=jdbc:mysql://127.0.0.1:9/reuse_db" "reuse mode passes the caller MYSQL_URL to Maven"

# reuse mode without MYSQL_URL: must fail fast with rc=2 and never touch docker or Maven
tmp="$(mktemp -d "$TMP_ROOT/case.XXXXXX")"
make_fakes "$tmp/bin"
: > "$tmp/log"; : > "$tmp/env"
set +e
PATH="$tmp/bin:$PATH" FAKE_LOG="$tmp/log" FAKE_ENV_LOG="$tmp/env" \
  XIANQI_BACKEND_MVN="$tmp/bin/mvnw" XIANQI_TEST_REUSE_DB=1 env -u MYSQL_URL \
  "$SCRIPT" >"$tmp/out" 2>&1
nourl_rc=$?
set -e
printf '%s\n' "$nourl_rc" > "$tmp/rc"
expect_rc "$tmp" 2 "reuse mode without MYSQL_URL fails fast"
if grep -Eq "docker run|mvnw" "$tmp/log"; then fail_case "reuse without MYSQL_URL touches docker/Maven"; else pass "reuse without MYSQL_URL touches nothing"; fi

# happy path: dependencies start, mvn verify runs and everything is cleaned up
tmp="$(run_case happy 0 healthy 0)"
expect_rc "$tmp" 0 "successful verification exits 0"
assert_log_contains "$tmp" "docker run" "starts MySQL/Redis containers"
assert_log_contains "$tmp" "mvnw --batch-mode verify" "runs the shared Maven verify target"
assert_log_contains "$tmp" "docker rm" "cleans up containers on success"
assert_contains() { grep -Fq "$1" "$tmp/env" && pass "$2" || fail_case "$2"; }
assert_contains "MYSQL_URL=" "exports MYSQL_URL to Maven"

# dependency never healthy: must fail fast and still clean up
tmp="$(run_case unhealthy 0 starting 0)"
expect_rc "$tmp" 1 "unhealthy dependency exits nonzero"
assert_log_contains "$tmp" "docker rm" "cleans up when dependency is not ready"

# mvn failure: nonzero status must propagate and cleanup must still happen
tmp="$(run_case mvnfail 0 healthy 17)"
expect_rc "$tmp" 17 "Maven failure status is propagated"
assert_log_contains "$tmp" "docker rm" "cleans up when Maven fails"

# docker run failure: no Maven invocation
tmp="$(run_case runfail 1 healthy 0)"
expect_rc "$tmp" 1 "container startup failure exits nonzero"
if grep -Fq "mvnw" "$tmp/log"; then fail_case "does not run Maven when containers fail"; else pass "does not run Maven when containers fail"; fi

if [[ "$FAILED" -ne 0 ]]; then
  echo 'backend test entry tests: FAILED'
  exit 1
fi
echo 'backend test entry tests: PASSED'
