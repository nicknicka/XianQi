#!/usr/bin/env bash
#
# lint 门禁的结构性自测（issue #9）。
# 验证公共 seam：package.json 的 lint / lint:fix 脚本、ESLint v9 flat config、
# 只读 lint 的红绿行为（覆盖 .vue/.ts/.js），以及 CI 在 build 前运行只读 lint。
set -u

ADMIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${ADMIN_DIR}/.." && pwd)"
CI_FILE="${REPO_ROOT}/.github/workflows/ci.yml"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

# 对 lint 输入工作区做校验和清单（排除 node_modules 与构建产物）。
# 用于与提交状态无关地证明只读 lint 不会改写任何文件。
snapshot() {
  ( cd "${ADMIN_DIR}" && \
    find . -type f \
      -not -path './node_modules/*' \
      -not -path './dist/*' \
      -not -name '.DS_Store' \
      -print0 | sort -z | xargs -0 shasum -a 256 ) | shasum -a 256 | awk '{print $1}'
}

[ -f "${ADMIN_DIR}/node_modules/.bin/eslint" ] || fail "eslint 未作为本地依赖安装（node_modules/.bin/eslint 不存在）"
[ -f "${ADMIN_DIR}/eslint.config.mjs" ] || fail "缺少 ESLint v9 flat config：admin/eslint.config.mjs"
pass "存在本地 eslint 可执行文件与 flat config"

# ESLint 主版本必须是 9（不接受已淘汰的 eslintrc 生态）。
ESLINT_VERSION="$(node -p "require('${ADMIN_DIR}/node_modules/eslint/package.json').version")"
case "${ESLINT_VERSION}" in
  9.*) pass "eslint 版本为 v9 (${ESLINT_VERSION})" ;;
  *) fail "eslint 必须为 v9，实际为 ${ESLINT_VERSION}" ;;
esac

LINT_SCRIPT="$(node -p "require('${ADMIN_DIR}/package.json').scripts.lint")"
LINT_FIX_SCRIPT="$(node -p "require('${ADMIN_DIR}/package.json').scripts['lint:fix']")"
case "${LINT_SCRIPT}" in
  *--fix*) fail "lint 必须是只读命令，但包含 --fix：${LINT_SCRIPT}" ;;
  eslint*) pass "lint 为只读 eslint 命令：${LINT_SCRIPT}" ;;
  *) fail "lint 脚本未调用 eslint：${LINT_SCRIPT}" ;;
esac
case "${LINT_FIX_SCRIPT}" in
  *--fix*) pass "lint:fix 为自动修复命令：${LINT_FIX_SCRIPT}" ;;
  *) fail "lint:fix 必须包含 --fix：${LINT_FIX_SCRIPT}" ;;
esac

# 不允许回退到已淘汰的 .eslintrc 体系。
if ls "${ADMIN_DIR}"/.eslintrc* >/dev/null 2>&1; then
  fail "不应存在 .eslintrc*（要求 flat config）"
fi
pass "不存在 .eslintrc*"

# 绿：当前代码库只读 lint 必须通过（warning 允许，error 必须为 0）。
( cd "${ADMIN_DIR}" && npm run lint >/tmp/lint-gate-green.log 2>&1 ) \
  || { cat /tmp/lint-gate-green.log >&2; fail "基线 npm run lint 未通过"; }
pass "基线 npm run lint 通过（绿，rc=0）"

# 元数据稳定性：macOS 在 lint 期间生成或改写 .DS_Store 不应造成假失败。
# 使用独立临时目录，不触碰用户真实元数据文件。
metadata_probe() {
  local probe_dir before after
  probe_dir="$(mktemp -d "${ADMIN_DIR}/.lint-gate-meta.XXXXXX")"
  printf 'probe-a\n' > "${probe_dir}/.DS_Store"
  before="$(snapshot)"
  printf 'probe-b\n' > "${probe_dir}/.DS_Store"
  after="$(snapshot)"
  find "${probe_dir}" -type f -delete
  rmdir "${probe_dir}"
  [ "${before}" = "${after}" ] || fail "snapshot 受 .DS_Store 等操作系统元数据影响"
  pass "snapshot 忽略 macOS 元数据（含元数据时稳定）"
}
metadata_probe

# 只读保证：lint 前后输入工作区校验和必须一致。
BEFORE="$(snapshot)"
( cd "${ADMIN_DIR}" && npm run lint >/tmp/lint-gate-readonly.log 2>&1 ) || fail "只读校验时 lint 失败"
AFTER="$(snapshot)"
[ "${BEFORE}" = "${AFTER}" ] || fail "只读 lint 修改了工作区文件（before=${BEFORE} after=${AFTER}）"
pass "只读 lint 未改写任何文件（工作区校验和一致）"

# 覆盖范围 + 红：分别在 .ts / .vue / .js 中注入真实违规，lint 都必须非零。
probe_lint_fails() {
  local rel="$1" needle="$2"
  local abs="${ADMIN_DIR}/${rel}"
  mkdir -p "$(dirname "$abs")"
  printf '%s\n' "$needle" > "$abs"
  ( cd "${ADMIN_DIR}" && npm run lint >/tmp/lint-gate-ext.log 2>&1 )
  local rc=$?
  rm -f "$abs"
  rmdir "$(dirname "$abs")" 2>/dev/null || true
  [ "${rc}" -ne 0 ] || fail ".${rel##*.} 文件的违规未被 lint 捕获（${rel}），覆盖缺失"
  grep -q 'no-unused-vars\|no-debugger\|is defined but never used\|is assigned a value but never used\|Unexpected debugger' /tmp/lint-gate-ext.log \
    || fail ".${rel##*.} 违规未体现在 lint 输出中（${rel}）"
  pass "lint 覆盖 .${rel##*.}（${rel} 注入违规 -> rc=${rc}，红）"
}
probe_lint_fails "src/__lint_probe__.ts" 'const gateTsProbe = 1'
probe_lint_fails "src/__lint_probe__.vue" '<script setup lang="ts">
const gateVueProbe = 1
</script>'
probe_lint_fails "__lint_probe__.js" 'function gateJsProbe() { debugger }'

# 所有探针移除后，工作区必须恢复到只读快照。
FINAL="$(snapshot)"
[ "${BEFORE}" = "${FINAL}" ] || fail "红绿探针测试后工作区未恢复（before=${BEFORE} final=${FINAL}）"
pass "探针全部清理，工作区校验和恢复一致"

# CI：admin-build job 必须在 Build 之前运行只读 lint（共享检查器）。
[ -f "${CI_FILE}" ] || fail "缺少 CI 文件 ${CI_FILE}"
node "${REPO_ROOT}/scripts/check-ci-order.mjs" "${CI_FILE}" || fail "CI 未在 build 前运行只读 lint"
pass "CI admin-build 在 Build 前运行只读 npm run lint"

echo "ALL LINT GATE CHECKS PASSED"
