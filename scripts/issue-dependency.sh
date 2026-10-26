#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage:
  issue-dependency.sh create OWNER/REPO CHILD BLOCKER...
  issue-dependency.sh verify OWNER/REPO CHILD BLOCKER...
USAGE
}

is_issue_number() {
  [[ $1 =~ ^[1-9][0-9]*$ ]]
}

issue_database_id() {
  local repository=$1 issue_number=$2
  gh api "repos/$repository/issues/$issue_number" --jq .id
}

read_dependency_numbers() {
  local repository=$1 child=$2
  gh api --paginate \
    "repos/$repository/issues/$child/dependencies/blocked_by" \
    --jq '.[].number'
}

dependency_list_has_number() {
  local dependency_numbers=$1 blocker=$2 dependency_number
  while IFS= read -r dependency_number; do
    [[ $dependency_number == "$blocker" ]] && return 0
  done <<< "$dependency_numbers"
  return 1
}

verify_dependencies() {
  local repository=$1 child=$2
  shift 2
  local dependency_numbers blocker
  dependency_numbers=$(read_dependency_numbers "$repository" "$child")

  local status=0
  for blocker in "$@"; do
    if ! dependency_list_has_number "$dependency_numbers" "$blocker"; then
      echo "missing blocked-by dependency: child #$child blocker #$blocker" >&2
      status=1
    fi
  done
  return "$status"
}

is_timeout_error() {
  local error_output=$1
  grep -Eqi 'context deadline exceeded|Client[.]Timeout|i/o timeout|TLS handshake timeout' <<< "$error_output"
}

post_dependency_once() {
  local repository=$1 child=$2 blocker_id=$3
  gh api --silent --method POST \
    "repos/$repository/issues/$child/dependencies/blocked_by" \
    -F issue_id="$blocker_id" 2>&1
}

post_dependency() {
  local repository=$1 child=$2 blocker=$3 blocker_id=$4
  local status=0 post_output current_numbers retry_status=0

  post_output=$(post_dependency_once "$repository" "$child" "$blocker_id") || status=$?
  [[ -n $post_output ]] && printf '%s\n' "$post_output" >&2
  if [[ $status -eq 0 ]]; then
    return 0
  fi

  if ! is_timeout_error "$post_output"; then
    return "$status"
  fi

  if ! current_numbers=$(read_dependency_numbers "$repository" "$child"); then
    echo 'timed out creating dependency, then failed to read current dependencies' >&2
    return 1
  fi

  if dependency_list_has_number "$current_numbers" "$blocker"; then
    return 0
  fi

  post_output=$(post_dependency_once "$repository" "$child" "$blocker_id") || retry_status=$?
  [[ -n $post_output ]] && printf '%s\n' "$post_output" >&2
  if [[ $retry_status -ne 0 ]] && is_timeout_error "$post_output"; then
    if current_numbers=$(read_dependency_numbers "$repository" "$child") \
        && dependency_list_has_number "$current_numbers" "$blocker"; then
      return 0
    fi
  fi
  return "$retry_status"
}

create_dependency() {
  local repository=$1 child=$2 blocker=$3
  local blocker_id
  blocker_id=$(issue_database_id "$repository" "$blocker")
  post_dependency "$repository" "$child" "$blocker" "$blocker_id"
}

run_create() {
  local repository=$1 child=$2
  shift 2
  local blocker
  for blocker in "$@"; do
    create_dependency "$repository" "$child" "$blocker"
  done
  verify_dependencies "$repository" "$child" "$@"
}

main() {
  if [[ $# -lt 3 ]]; then
    usage
    return 2
  fi

  local command=$1
  local repository=$2
  local child=$3
  shift 3

  case "$command" in
    create|verify) ;;
    *)
      usage
      return 2
      ;;
  esac

  if [[ ! $repository =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]] \
      || ! is_issue_number "$child" || [[ $# -eq 0 ]]; then
    usage
    return 2
  fi

  local blocker
  for blocker in "$@"; do
    if ! is_issue_number "$blocker"; then
      echo "invalid issue number: $blocker" >&2
      usage
      return 2
    fi
  done

  case "$command" in
    create) run_create "$repository" "$child" "$@" ;;
    verify) verify_dependencies "$repository" "$child" "$@" ;;
  esac
}

main "$@"
