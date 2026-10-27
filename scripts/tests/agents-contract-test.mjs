import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-agents.mjs')

function fixture(agentsContent, files = []) {
  const root = mkdtempSync(path.join(tmpdir(), 'agents-contract-'))
  writeFileSync(path.join(root, 'AGENTS.md'), agentsContent)
  for (const file of files) {
    const absolute = path.join(root, file)
    mkdirSync(path.dirname(absolute), { recursive: true })
    writeFileSync(absolute, '# Registered doc\n')
  }
  return root
}

function run(root) {
  return spawnSync(process.execPath, [checker, root], { encoding: 'utf8' })
}

test('accepts registered paths that exist', () => {
  const root = fixture('See [docs/guide.md](docs/guide.md).\n', ['docs/guide.md'])
  try {
    const result = run(root)
    assert.equal(result.status, 0, result.stderr)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('rejects a registered path that is missing', () => {
  const root = fixture('See [docs/missing.md](docs/missing.md).\n')
  try {
    const result = run(root)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /missing/i)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('repository AGENTS pointers satisfy the contract', () => {
  const output = execFileSync(process.execPath, [checker, repoRoot], { encoding: 'utf8' })
  assert.match(output, /AGENTS contract OK/)
})
