#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GH_STABLE="$ROOT/scripts/gh-stable.sh"
TMP_DIR=""
cleanup() { [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]] && rm -rf "$TMP_DIR"; }
trap cleanup EXIT

usage() {
  cat >&2 <<'USAGE'
Usage:
  gh-write.sh issue-comment OWNER/REPO ISSUE BODY_FILE
  gh-write.sh issue-close OWNER/REPO ISSUE BODY_FILE
  gh-write.sh pr-edit OWNER/REPO PR BODY_FILE
USAGE
}

json_body_file() {
  local body_file="$1" json_file="$2"
  [[ -f "$body_file" ]] || { echo "Body file not found: $body_file" >&2; exit 2; }
  python3 - "$body_file" "$json_file" <<'PY'
import json, pathlib, sys
body = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
pathlib.Path(sys.argv[2]).write_text(json.dumps({'body': body}, ensure_ascii=False), encoding='utf-8')
PY
}

main() {
  [[ $# -eq 4 ]] || { usage; exit 2; }
  local command="$1" repo="$2" number="$3" body_file="$4"
  local json
  TMP_DIR="$(mktemp -d)"
  json="$TMP_DIR/body.json"
  json_body_file "$body_file" "$json"

  case "$command" in
    issue-comment)
      "$GH_STABLE" api --method POST "repos/$repo/issues/$number/comments" --input "$json" >/dev/null
      ;;
    issue-close)
      "$GH_STABLE" api --method POST "repos/$repo/issues/$number/comments" --input "$json" >/dev/null
      "$GH_STABLE" api --method PATCH "repos/$repo/issues/$number" -f state=closed >/dev/null
      ;;
    pr-edit)
      "$GH_STABLE" api --method PATCH "repos/$repo/pulls/$number" --input "$json" >/dev/null
      ;;
    *)
      usage
      exit 2
      ;;
  esac
}

main "$@"
