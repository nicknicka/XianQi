import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const mobileDir = path.resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(readFileSync(path.join(mobileDir, 'package.json'), 'utf8'))
const ci = readFileSync(path.join(mobileDir, '..', '.github/workflows/ci.yml'), 'utf8')

test('runs the full mobile test suite from package and CI', () => {
  assert.equal(packageJson.scripts.test, 'node --test test/*.test.mjs')
  assert.match(ci, /- name: Mobile tests\n\s+run: \|\n\s+cd mobile\n\s+npm test/)

  for (const selectedStep of [
    'Mobile ID contract tests',
    'Mobile auth state tests',
    'Mobile auth routes tests',
    'Mobile auth token guard'
  ]) {
    assert.doesNotMatch(ci, new RegExp(`- name: ${selectedStep}`))
  }
})
