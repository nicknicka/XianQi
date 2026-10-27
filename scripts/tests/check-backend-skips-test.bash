#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECK="$ROOT/scripts/check-backend-skips.py"
FAILED=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

make_report() {
  local dir="$1" skipped="$2"
  mkdir -p "$dir/backend/target/failsafe-reports"
  cat > "$dir/backend/target/failsafe-reports/TEST-sample.xml" <<XML
<testsuite name="s" tests="1" skipped="$skipped">
  <testcase name="a" classname="C">$([ "$skipped" = 1 ] && echo '<skipped/>')</testcase>
</testsuite>
XML
}

make_report "$TMP/clean" 0
if (cd "$TMP/clean" && python3 "$CHECK" >/dev/null 2>&1); then
  echo 'ok - passes when nothing is skipped'
else
  echo 'not ok - passes when nothing is skipped'; FAILED=1
fi

make_report "$TMP/skipped" 1
if (cd "$TMP/skipped" && python3 "$CHECK" >/dev/null 2>&1); then
  echo 'not ok - fails when a test is skipped'; FAILED=1
else
  echo 'ok - fails when a test is skipped'
fi

make_report "$TMP/skipped" 1
(cd "$TMP/skipped" && python3 "$CHECK" >"$TMP/out" 2>&1) || true
if grep -q 'C\.a' "$TMP/out"; then
  echo 'ok - names the skipped test'
else
  echo 'not ok - names the skipped test'; cat "$TMP/out" >&2; FAILED=1
fi

[[ "$FAILED" -eq 0 ]] || { echo 'skip guard tests: FAILED'; exit 1; }
echo 'skip guard tests: PASSED'
