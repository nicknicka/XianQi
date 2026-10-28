# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

**GitHub 读写一律走 `scripts/gh-stable.sh`；裸 `gh` 会因代理超时失败。** 先运行 `scripts/gh-stable.sh doctor` 确认代理、连通性、认证与 API 状态，再执行任何 GitHub 操作。

Prefer `scripts/gh-stable.sh api ...` for GitHub reads and writes. It calls the REST API through `gh api`, clears inherited proxy variables for the call, and never silently retries write operations on timeout; `scripts/gh-stable.sh doctor` reports proxy, direct connectivity, authentication and API status. Use raw `gh` / GraphQL only when an operation has no REST equivalent.

For multi-line issue comments, closing comments and PR descriptions, use `scripts/gh-write.sh` with a body file. Never inline multi-line Markdown in a double-quoted `--body` or `--comment`; `scripts/check-safe-gh-body.mjs` rejects that pattern. `scripts/gh-write.sh issue-comment|issue-close|pr-edit OWNER/REPO NUMBER BODY_FILE` builds the JSON payload from the file so backticks, `$()`, wildcards, backslashes and code fences stay byte-for-byte.

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies, or `scripts/gh-stable.sh api --method POST repos/<owner>/<repo>/issues -f title=... -f body=...` for REST.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`
- **Create and verify native blocked-by dependencies**: `scripts/issue-dependency.sh create OWNER/REPO CHILD BLOCKER...` creates dependencies one at a time, checks each response, and reads the final `blocked_by` list before returning success.
- **Verify native blocked-by dependencies without writing**: `scripts/issue-dependency.sh verify OWNER/REPO CHILD BLOCKER...`.

The dependency helper uses `gh api` only; it is not a general GitHub API client. If a create request times out, it first GETs the child's current `dependencies/blocked_by` list and retries only when the edge is absent. If the final verification cannot read every requested edge, the command exits nonzero.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Offline scratch drafts

`.scratch/` is ignored by Git and is only a temporary fallback for local drafts when the network is unavailable. Do not treat it as a task system or publish it in commits. When network access returns, create or update the GitHub Issue and verify it with `gh`; GitHub Issues remain the source of truth.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
