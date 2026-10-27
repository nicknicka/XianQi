import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-ci-order.mjs')

function run(contents) {
  const dir = mkdtempSync(path.join(tmpdir(), 'ci-order-'))
  const file = path.join(dir, 'ci.yml')
  writeFileSync(file, contents)
  const result = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' })
  rmSync(dir, { recursive: true, force: true })
  return result
}

const good = `
jobs:
  admin-build:
    steps:
      - name: Lint
        run: npm run lint
      - name: Build
        run: npm run build
  mobile-build:
    steps:
      - name: Lint
        run: npm run lint
      - name: Build H5
        run: npm run build:h5
`

const wrongOrder = good.replace(
  `      - name: Lint\n        run: npm run lint\n      - name: Build`,
  `      - name: Build\n        run: npm run build\n      - name: Lint\n        run: npm run lint\n      - name: Build`
)

const missingStep = good.replace(`      - name: Build H5\n        run: npm run build:h5\n`, '')

const withFix = good.replace('npm run lint', 'npm run lint --fix')

test('accepts correctly ordered lint gates', () => {
  const output = execFileSync(process.execPath, [checker, path.join(repoRoot, '.github', 'workflows', 'ci.yml')], { encoding: 'utf8' })
  assert.match(output, /CI lint order OK/)
})

test('rejects lint after build', () => {
  const result = run(wrongOrder)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /before/)
})

test('rejects missing build step', () => {
  const result = run(missingStep)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /missing step/)
})

test('rejects --fix in CI lint', () => {
  const result = run(withFix)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /--fix/)
})

test('rejects unknown job names instead of passing silently', () => {
  const result = run(good.replace('admin-build', 'renamed-admin-build'))
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /not found/)
})
