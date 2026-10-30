import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const stateSource = readFileSync(
  path.join(testDir, '..', 'src', 'utils', 'auth', 'auth-state.ts'),
  'utf8'
)

function loadAuthStateModule() {
  const source = stateSource
    .replaceAll('export const', 'const')
    .replaceAll('export function', 'function')
    .replaceAll('export type', 'type')
    .replaceAll('export interface', 'interface')
    .concat('\nthis.__authStateModule = { resolveAuthState }')
  const context = vm.createContext({ console })
  vm.runInContext(
    ts.transpile(source, { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.None }),
    context
  )
  return context.__authStateModule
}

const { resolveAuthState } = loadAuthStateModule()

test('maps every real-name backend status to the page-facing state', () => {
  assert.equal(resolveAuthState(0).pageStatus, 'unverified')
  assert.equal(resolveAuthState(1).pageStatus, 'pending')
  assert.equal(resolveAuthState(2).pageStatus, 'verified')
  assert.equal(resolveAuthState(3).pageStatus, 'rejected')
})

test('makes only unverified and rejected real-name records editable', () => {
  assert.deepEqual(
    [0, 1, 2, 3].map(status => resolveAuthState(status).editable),
    [true, false, false, true]
  )
})

test('describes a rejected record with the backend reason', () => {
  const rejected = resolveAuthState(3, { rejectReason: '身份证照片不清晰' })
  assert.equal(rejected.pageStatus, 'rejected')
  assert.equal(rejected.description, '身份证照片不清晰')
})

test('falls back to the shared rejected description without a reason', () => {
  const rejected = resolveAuthState(3, { rejectReason: '' })
  assert.equal(rejected.pageStatus, 'rejected')
  assert.equal(rejected.description, '认证失败，请重新提交')
})

test('treats a missing record as unverified', () => {
  assert.equal(resolveAuthState().pageStatus, 'unverified')
  assert.equal(resolveAuthState(null).pageStatus, 'unverified')
  assert.equal(resolveAuthState(undefined).editable, true)
})
