#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT/scripts/issue-dependency.sh"
FAILED=0
TEST_TMP_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_TMP_ROOT"' EXIT

pass() { printf 'ok - %s\n' "$1"; }
fail_case() {
  printf 'not ok - %s\n' "$1"
  FAILED=1
}

assert_contains() {
  local file=$1 needle=$2 label=$3
  if grep -Fq "$needle" "$file"; then
    pass "$label"
  else
    printf 'missing %q in:\n' "$needle" >&2
    cat "$file" >&2
    fail_case "$label"
  fi
}

make_fake_gh() {
  local bin=$1 state=$2
  mkdir -p "$bin"
  cat > "$bin/gh" <<'FAKE'
#!/usr/bin/env bash
set -Eeuo pipefail

CALLS=${GH_CALLS:?GH_CALLS is required}
STATE=${GH_STATE:?GH_STATE is required}
printf 'gh' >> "$CALLS"
for arg in "$@"; do
  printf '\t%s' "$arg" >> "$CALLS"
done
printf '\n' >> "$CALLS"

method=GET
endpoint=
issue_id=
jq_filter=
args=("$@")
for i in "${!args[@]}"; do
  arg=${args[$i]}
  case "$arg" in
    --method|-X) method=${args[$((i + 1))]} ;;
    --jq|-q) jq_filter=${args[$((i + 1))]} ;;
    repos/*) endpoint=$arg ;;
    issue_id=*) issue_id=${arg#issue_id=} ;;
  esac
done

case "$endpoint" in
  */dependencies/blocked_by)
    if [[ $method == POST ]]; then
      case "${GH_POST_RESULT:-success}" in
        http-*)
          echo "gh: API failure (${GH_POST_RESULT#http-})" >&2
          exit 1
          ;;
        timeout-server-written)
          echo "$issue_id" >> "$STATE"
          echo 'gh: context deadline exceeded (Client.Timeout exceeded while awaiting headers)' >&2
          exit 1
          ;;
        timeout-retry-fails)
          attempt_file="$STATE.attempt.$issue_id"
          if [[ ! -f $attempt_file ]]; then
            echo 1 > "$attempt_file"
            echo 'gh: context deadline exceeded (Client.Timeout exceeded while awaiting headers)' >&2
            exit 1
          fi
          echo 'gh: API failure (500)' >&2
          exit 1
          ;;
        timeout-retry-server-written)
          attempt_file="$STATE.attempt.$issue_id"
          if [[ ! -f $attempt_file ]]; then
            echo 1 > "$attempt_file"
            echo 'gh: context deadline exceeded (Client.Timeout exceeded while awaiting headers)' >&2
            exit 1
          fi
          echo "$issue_id" >> "$STATE"
          echo 'gh: context deadline exceeded (Client.Timeout exceeded while awaiting headers)' >&2
          exit 1
          ;;
        timeout-retry-succeeds)
          attempt_file="$STATE.attempt.$issue_id"
          if [[ ! -f $attempt_file ]]; then
            echo 1 > "$attempt_file"
            echo 'gh: context deadline exceeded (Client.Timeout exceeded while awaiting headers)' >&2
            exit 1
          fi
          ;;
        no-write-success)
          printf '{}\n'
          exit 0
          ;;
      esac
      echo "$issue_id" >> "$STATE"
      printf '{}\n'
      exit 0
    fi

    if [[ ${GH_GET_DEPENDENCIES_RESULT:-success} != success ]]; then
      echo "gh: API failure ($GH_GET_DEPENDENCIES_RESULT)" >&2
      exit 1
    fi

    if [[ -s $STATE ]]; then
      while IFS= read -r id; do
        [[ $id == "${GH_MISSING_DEPENDENCY_ID:-}" ]] && continue
        if [[ $jq_filter == '.[].number' ]]; then
          printf '%s\n' "$((id / 100))"
        else
          printf '{"id":%s,"number":%s}\n' "$id" "$((id / 100))"
        fi
      done < <(sort -u "$STATE")
    fi
    exit 0
    ;;

  repos/*/issues/*)
    blocker=${endpoint##*/}
    printf '%s\n' "$((blocker * 100))"
    exit 0
    ;;
esac

echo "unexpected gh invocation: $*" >&2
exit 99
FAKE
  chmod +x "$bin/gh"
  : > "$state"
  if [[ -n ${GH_EXISTING_IDS:-} ]]; then
    printf '%s' "$GH_EXISTING_IDS" >> "$state"
  fi
}

run_case() {
  local name=$1 post_result=$2 get_result=$3 missing_id=$4
  shift 4
  local tmp output calls state status
  tmp=$(mktemp -d "$TEST_TMP_ROOT/case.XXXXXX")
  calls="$tmp/calls"
  state="$tmp/state"
  output="$tmp/output"
  : > "$calls"
  make_fake_gh "$tmp/bin" "$state"
  if GH_CALLS="$calls" GH_STATE="$state" \
      GH_POST_RESULT="$post_result" \
      GH_GET_DEPENDENCIES_RESULT="$get_result" \
      GH_MISSING_DEPENDENCY_ID="$missing_id" \
      PATH="$tmp/bin:$PATH" "$SCRIPT" "$@" >"$output" 2>&1; then
    status=0
  else
    status=$?
  fi
  printf '%s\n' "$status" > "$tmp/status"
  printf '%s\n' "$tmp"
}

expect_status() {
  local tmp=$1 expected=$2 label=$3
  local actual
  actual=$(cat "$tmp/status")
  if [[ $actual == "$expected" ]]; then
    pass "$label"
  else
    printf 'expected status %s, got %s\n' "$expected" "$actual" >&2
    cat "$tmp/output" >&2
    fail_case "$label"
  fi
}

count_matching_calls() {
  local tmp=$1 pattern=$2
  grep -Fc "$pattern" "$tmp/calls" || true
}

post_call_count() {
  local tmp=$1
  grep -Fc $'\t--silent\t--method\tPOST\t' "$tmp/calls" || true
}

# Invalid arguments are rejected without making a network call.
tmp=$(run_case invalid-arguments success success '' create nicknicka/XianQi 12 not-a-number)
expect_status "$tmp" 2 'invalid blocker number exits with usage error'
if [[ ! -s $tmp/calls ]]; then
  pass 'invalid arguments do not invoke gh'
else
  cat "$tmp/calls" >&2
  fail_case 'invalid arguments do not invoke gh'
fi
assert_contains "$tmp/output" 'invalid issue number' 'invalid argument error is visible'

tmp=$(run_case bad-repository success success '' create bad-repo 12 11)
expect_status "$tmp" 2 'invalid repository exits with usage error'
if [[ ! -s $tmp/calls ]]; then
  pass 'invalid repository does not invoke gh'
else
  cat "$tmp/calls" >&2
  fail_case 'invalid repository does not invoke gh'
fi
assert_contains "$tmp/output" 'Usage:' 'repository usage error is visible'

tmp=$(run_case bad-command success success '' not-a-command nicknicka/XianQi 12 11)
expect_status "$tmp" 2 'unknown command exits with usage error'
if [[ ! -s $tmp/calls ]]; then
  pass 'unknown command does not invoke gh'
else
  cat "$tmp/calls" >&2
  fail_case 'unknown command does not invoke gh'
fi

# A non-2xx response on one edge is fatal and prevents later edges.
tmp=$(run_case http-error http-500 success '' create nicknicka/XianQi 12 11 10)
expect_status "$tmp" 1 'HTTP non-2xx exits nonzero'
assert_contains "$tmp/output" 'API failure (500)' 'HTTP failure is surfaced'
if [[ $(count_matching_calls "$tmp" $'\tissue_id=1100') -eq 1 ]] \
    && [[ $(count_matching_calls "$tmp" $'/issues/10\t') -eq 0 ]]; then
  pass 'failed edge stops before later dependency'
else
  cat "$tmp/calls" >&2
  fail_case 'failed edge stops before later dependency'
fi


# Non-2xx responses are not treated as ambiguous timeouts even if the body mentions timeout.
tmp=$(run_case http-timeout-body http-timeout success '' create nicknicka/XianQi 12 11)
expect_status "$tmp" 1 'HTTP response mentioning timeout exits without retry'
if [[ $(post_call_count "$tmp") -eq 1 ]]     && [[ $(grep -Fc $'/issues/12/dependencies/blocked_by\t--jq' "$tmp/calls") -eq 0 ]]; then
  pass 'non-timeout HTTP failure is not recovered as a timeout'
else
  cat "$tmp/calls" >&2
  fail_case 'non-timeout HTTP failure is not recovered as a timeout'
fi

# After a timeout, read server state first; an edge already written is not retried.
tmp=$(run_case timeout-written timeout-server-written success '' create nicknicka/XianQi 12 11)
expect_status "$tmp" 0 'timeout with server-written dependency succeeds'
if [[ $(post_call_count "$tmp") -eq 1 ]]     && [[ $(count_matching_calls "$tmp" $'/issues/12/dependencies/blocked_by') -ge 1 ]]; then
  pass 'timeout reads existing dependency before deciding not to retry'
else
  cat "$tmp/calls" >&2
  fail_case 'timeout reads existing dependency before deciding not to retry'
fi

# After a timeout, a missing edge is created once; GET happens before the retry.
tmp=$(run_case timeout-missing timeout-retry-succeeds success '' create nicknicka/XianQi 12 11)
expect_status "$tmp" 0 'timeout with missing dependency succeeds after one retry'
first_post=$(grep -n -F $'\t--silent\t--method\tPOST\t' "$tmp/calls" | head -1 | cut -d: -f1 || true)
get_line=$(grep -n -F $'\t--jq\t.[].number' "$tmp/calls" | head -1 | cut -d: -f1 || true)
second_post=$(grep -n -F $'\t--silent\t--method\tPOST\t' "$tmp/calls" | sed -n '2p' | cut -d: -f1 || true)
if [[ $(post_call_count "$tmp") -eq 2 ]]     && [[ -n $first_post && -n $get_line && -n $second_post ]]     && [[ $first_post -lt $get_line && $get_line -lt $second_post ]]; then
  pass 'missing dependency is retried once after a GET'
else
  cat "$tmp/calls" >&2
  fail_case 'missing dependency is retried once after a GET'
fi


# A timed-out retry is also reconciled by GET before the command can accept or reject it.
tmp=$(run_case timeout-retry-written timeout-retry-server-written success '' create nicknicka/XianQi 12 11)
expect_status "$tmp" 0 'server-written dependency after retry timeout succeeds'
dependency_get_count=$(grep -Fc $'/issues/12/dependencies/blocked_by\t--jq' "$tmp/calls")
if [[ $(post_call_count "$tmp") -eq 2 ]] && [[ $dependency_get_count -ge 2 ]]; then
  pass 'retry timeout reads server state and does not issue a third POST'
else
  printf 'posts=%s gets=%s
' "$(post_call_count "$tmp")" "$dependency_get_count" >&2
  cat "$tmp/calls" >&2
  fail_case 'retry timeout reads server state and does not issue a third POST'
fi

# If the post-timeout GET says the edge is absent but the retry fails, the command remains failed.
tmp=$(run_case timeout-retry-fails timeout-retry-fails success '' create nicknicka/XianQi 12 11)
expect_status "$tmp" 1 'failed retry after timeout exits nonzero'
assert_contains "$tmp/output" 'API failure (500)' 'retry failure is surfaced'
if [[ $(post_call_count "$tmp") -eq 2 ]]; then
  pass 'retry is attempted exactly once after timeout'
else
  cat "$tmp/calls" >&2
  fail_case 'retry is attempted exactly once after timeout'
fi

# A successful-looking POST is not accepted until the final dependency read proves the edge exists.
tmp=$(run_case final-missing no-write-success success '' create nicknicka/XianQi 12 11)
expect_status "$tmp" 1 'missing final dependency verification exits nonzero'
assert_contains "$tmp/output" 'missing blocked-by dependency' 'final verification failure names the missing blocker'

# Verify is a reusable read-only command for the required native edges.
tmp=$(GH_EXISTING_IDS=$'1100\n1000\n' run_case verify-success success success '' verify nicknicka/XianQi 12 11 10)
expect_status "$tmp" 0 'verify succeeds when all required dependencies exist'
if [[ $(post_call_count "$tmp") -eq 0 ]]; then
  pass 'verify does not create dependencies'
else
  cat "$tmp/calls" >&2
  fail_case 'verify does not create dependencies'
fi

get_dependency_calls=$(grep -F $'/issues/12/dependencies/blocked_by\t' "$tmp/calls" | grep -F $'\t--jq\t.[].number' || true)
if [[ -n $get_dependency_calls ]]     && grep -qF $'\t--paginate\t' <<< "$get_dependency_calls"     && ! grep -qF $'\t--slurp\t' <<< "$get_dependency_calls"; then
  pass 'dependency verification paginates without unsupported slurp+jq'
else
  printf '%s
' "$get_dependency_calls" >&2
  fail_case 'dependency verification paginates without unsupported slurp+jq'
fi

tmp=$(run_case verify-missing success success 1100 verify nicknicka/XianQi 12 11 10)
expect_status "$tmp" 1 'verify exits nonzero when a required dependency is missing'
assert_contains "$tmp/output" 'missing blocked-by dependency' 'verify reports the failed edge'

# Local scratch drafts are explicitly non-versioned and bounded in tracker documentation.
if git -C "$ROOT" check-ignore -q .scratch/example.md; then
  pass '.scratch/ is git-ignored'
else
  git -C "$ROOT" check-ignore .scratch/example.md >&2 || true
  fail_case '.scratch/ is git-ignored'
fi

if grep -Fq '.scratch/' "$ROOT/docs/agents/issue-tracker.md"     && grep -Fq 'network is unavailable' "$ROOT/docs/agents/issue-tracker.md"     && grep -Fq 'GitHub Issues remain the source of truth' "$ROOT/docs/agents/issue-tracker.md"; then
  pass 'issue tracker documents .scratch/ as a temporary offline fallback'
else
  fail_case 'issue tracker documents .scratch/ as a temporary offline fallback'
fi

exit "$FAILED"
