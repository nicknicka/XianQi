import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-adr.mjs')

function adr(number, title = `Decision ${number}`) {
  return `# ADR-${number}: ${title}\n\n## 状态\n已采纳\n`
}

function fixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'adr-contract-'))
  mkdirSync(path.join(root, 'docs', 'adr'), { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(root, 'docs', 'adr', name), content)
  }
  return root
}

function run(root) {
  return spawnSync(process.execPath, [checker, root], { encoding: 'utf8' })
}

test('accepts unique, well-formed ADRs', () => {
  const root = fixture({
    '0001-first.md': adr('0001'),
    '0002-second.md': adr('0002')
  })
  try {
    const result = run(root)
    assert.equal(result.status, 0, result.stderr)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('rejects duplicate ADR numbers', () => {
  const root = fixture({
    '0001-first.md': adr('0001'),
    '0001-duplicate.md': adr('0001')
  })
  try {
    const result = run(root)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /duplicate/i)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('rejects titles that do not match filenames', () => {
  const root = fixture({ '0001-first.md': adr('0002') })
  try {
    const result = run(root)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /title/i)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('rejects references to missing ADRs', () => {
  const root = fixture({
    '0001-first.md': `${adr('0001')}\nSee ADR-0099.\n`
  })
  try {
    const result = run(root)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /missing/i)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('repository ADRs satisfy the contract', () => {
  const output = execFileSync(process.execPath, [checker, repoRoot], { encoding: 'utf8' })
  assert.match(output, /ADR contract OK/)
})
