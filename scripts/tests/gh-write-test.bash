#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$ROOT/scripts/gh-write.sh"
FAILED=0
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

pass() { printf 'ok - %s\n' "$1"; }
fail_case() { printf 'not ok - %s\n' "$1"; FAILED=1; }

make_fake_gh() {
  local bin="$1"
  mkdir -p "$bin"
  cat > "$bin/gh" <<'FAKE'
#!/usr/bin/env bash
set -Eeuo pipefail
capture_dir="${FAKE_CAPTURE_DIR:?}"
call_file="$capture_dir/call-$(( $(ls -1 "$capture_dir" 2>/dev/null | wc -l | tr -d ' ') + 1 ))"
input_file=""
prev=""
for arg in "$@"; do
  if [[ "$prev" == "--input" || "$prev" == "-F" ]]; then input_file="$arg"; fi
  prev="$arg"
done
if [[ -n "$input_file" ]]; then cp "$input_file" "${call_file}.json"; else : > "${call_file}.json"; fi
printf '%s\n' "$*" > "${call_file}.args"
printf '{}\n'
FAKE
  chmod +x "$bin/gh"
}

run_write() {
  local tmp="$1"; shift
  mkdir -p "$tmp/bin" "$tmp/capture"
  make_fake_gh "$tmp/bin"
  set +e
  PATH="$tmp/bin:$PATH" FAKE_CAPTURE_DIR="$tmp/capture" "$SCRIPT" "$@" >"$tmp/out" 2>&1
  local rc=$?
  set -e
  printf '%s' "$rc" > "$tmp/rc"
}

assert_body() {
  local file="$1" label="$2"
  if python3 - "$file" "$BODY_FILE" <<'PY'
import json,sys
actual=json.load(open(sys.argv[1], encoding='utf-8'))['body']
expected=open(sys.argv[2], encoding='utf-8').read()
assert actual == expected, (actual, expected)
PY
  then pass "$label"; else fail_case "$label"; fi
}

BODY_FILE="$TMP_ROOT/body.md"
python3 - "$BODY_FILE" <<'PY'
from pathlib import Path
import json, sys
body = "\n".join([
    "# 标题",
    "",
    "反引号: `code`",
    "命令替换字面量: $(touch /tmp/issue21-pwned)",
    "通配符: * ? [abc]",
    "反斜杠: C:\\temp\\file",
    "中文与 emoji: 你好 ✅",
    "",
    "```bash",
    "echo \"$HOME\"",
    "```",
    "",
    "长正文: " + "x" * 5000,
])
Path(sys.argv[1]).write_text(body, encoding='utf-8')
Path(sys.argv[1] + '.expected').write_text(json.dumps({'body': body}, ensure_ascii=False), encoding='utf-8')
PY

# issue comment preserves body exactly
tmp="$TMP_ROOT/comment"; run_write "$tmp" issue-comment nicknicka/XianQi 21 "$BODY_FILE"
[[ "$(cat "$tmp/rc")" == 0 ]] && pass "issue comment exits 0" || fail_case "issue comment exits 0"
assert_body "$tmp/capture/call-1.json" "issue comment preserves special characters"

# pr edit preserves body exactly
tmp="$TMP_ROOT/pr"; run_write "$tmp" pr-edit nicknicka/XianQi 99 "$BODY_FILE"
[[ "$(cat "$tmp/rc")" == 0 ]] && pass "pr edit exits 0" || fail_case "pr edit exits 0"
assert_body "$tmp/capture/call-1.json" "pr edit preserves special characters"

# close comment preserves body, then closes
tmp="$TMP_ROOT/close"; run_write "$tmp" issue-close nicknicka/XianQi 21 "$BODY_FILE"
[[ "$(cat "$tmp/rc")" == 0 ]] && pass "issue close exits 0" || fail_case "issue close exits 0"
assert_body "$tmp/capture/call-1.json" "issue close comment preserves special characters"
if grep -RhFq "state=closed" "$tmp/capture"; then pass "issue close marks issue closed"; else fail_case "issue close marks issue closed"; fi

if [[ "$FAILED" -ne 0 ]]; then echo 'gh-write tests: FAILED'; exit 1; fi
echo 'gh-write tests: PASSED'
