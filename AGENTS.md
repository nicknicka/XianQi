# AGENTS.md

## Maintenance contract

- 本文件只放导航指针；指针可以是动词式触发短语，但详细规则写在被指向的文档里。
- 被指向文件重命名、删除或职责变化时，必须同步更新对应指针行。
- 新增 agent 必需文档时，必须在此登记。
- 登记指针时使用仓库相对 Markdown 链接；CI 只校验这些链接的目标路径存在。
- CI 只校验仓库级 `AGENTS.md` 登记的指针路径存在；指针内容是否过时属判断问题，无法完全机械化。父级 `/Users/nickxiao/11project` 不是 Git 仓库，不在本仓库 CI 的校验范围内。

## Navigation

- **Track issues and operate on them:** [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md) — GitHub 读写一律走 `scripts/gh-stable.sh`；裸 `gh` 会因代理超时失败。
- **Apply triage labels by role:** [docs/agents/triage-labels.md](docs/agents/triage-labels.md).
- **Run or add backend tests (unit vs real-DB naming, guards):** [docs/agents/backend-testing.md](docs/agents/backend-testing.md).
- **Read domain vocabulary and decisions before exploring:** [GLOSSARY.md](GLOSSARY.md), [docs/adr/](docs/adr/), and [docs/agents/domain.md](docs/agents/domain.md).
