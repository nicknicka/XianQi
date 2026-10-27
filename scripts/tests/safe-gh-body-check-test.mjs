import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-safe-gh-body.mjs')

test('repository scripts use safe body passing', () => {
  const output = execFileSync(process.execPath, [checker, repoRoot], { encoding: 'utf8' })
  assert.match(output, /safe body contract OK/i)
})

test('rejects inline quoted --body and --comment', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'safe-body-check-'))
  try {
    mkdirSync(path.join(root, 'scripts'), { recursive: true })
    writeFileSync(path.join(root, 'scripts', 'bad.sh'), '#!/usr/bin/env bash\ngh issue comment 1 --body "hello"\n')
    const result = spawnSync(process.execPath, [checker, root], { encoding: 'utf8' })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /unsafe inline/i)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
