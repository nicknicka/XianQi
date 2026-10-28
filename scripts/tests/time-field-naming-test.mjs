import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-time-field-naming.py')

function fixture({ backend = {}, admin = {}, mobile = {} }) {
  const root = mkdtempSync(path.join(tmpdir(), 'time-field-naming-'))
  for (const [dir, files] of [
    ['backend/src/main/java', backend],
    ['admin/src', admin],
    ['mobile/src', mobile]
  ]) {
    mkdirSync(path.join(root, dir), { recursive: true })
    for (const [name, contents] of Object.entries(files)) {
      const filePath = path.join(root, dir, name)
      mkdirSync(path.dirname(filePath), { recursive: true })
      writeFileSync(filePath, contents)
    }
  }
  return root
}

function run(root) {
  return spawnSync('python3', [checker, root], { encoding: 'utf8' })
}

function withFixture(options, assertions) {
  const root = fixture(options)
  try {
    assertions(run(root))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('passes when only the canonical names are used', () => {
  withFixture({
    backend: { 'Sample.java': 'private String createdAt;\nprivate String updatedAt;\n' },
    admin: { 'api.ts': 'export interface X { createdAt: string; updatedAt: string }\n' },
    mobile: { 'page.vue': '<text>{{ item.createdAt }}</text>\n' }
  }, (result) => {
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Time field naming guard OK/)
  })
})

test('fails when the retired name appears in backend source', () => {
  withFixture({
    backend: { 'Sample.java': 'private String createTime;\n' }
  }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Sample\.java:1/)
    assert.match(result.stderr, /createTime/)
  })
})

test('fails when the retired name appears in admin source', () => {
  withFixture({
    admin: { 'api.ts': 'export interface X { createTime: string }\n' }
  }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /createTime/)
  })
})

test('fails when the retired name appears in mobile source outside the allowlist', () => {
  withFixture({
    mobile: { 'pages/somewhere.vue': '<text>{{ row.updateTime }}</text>\n' }
  }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /updateTime/)
  })
})

test('allows local draft storage files on the allowlist', () => {
  withFixture({
    mobile: {
      'pages/share/publish.vue': 'const draftData = { updateTime: new Date().getTime() }\n',
      'pages/mine/drafts.vue': 'const t = draft.updateTime\n'
    }
  }, (result) => {
    assert.equal(result.status, 0, result.stderr)
  })
})

test('ignores node_modules, dist and target directories', () => {
  withFixture({
    backend: { 'target/generated/Sample.java': 'private String createTime;\n' },
    admin: { 'node_modules/pkg/index.ts': 'export const createTime = 1\n' },
    mobile: { 'dist/build.js': 'var updateTime = 2\n' }
  }, (result) => {
    assert.equal(result.status, 0, result.stderr)
  })
})

test('repository sources satisfy the contract', () => {
  const result = spawnSync('python3', [checker, repoRoot], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Time field naming guard OK/)
})
