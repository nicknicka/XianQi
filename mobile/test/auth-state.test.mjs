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
    .concat('\nthis.__authStateModule = { resolveAuthState, resolveStudentAuthAccessState }')
  const context = vm.createContext({ console })
  vm.runInContext(
    ts.transpile(source, { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.None }),
    context
  )
  return context.__authStateModule
}

const { resolveAuthState, resolveStudentAuthAccessState } = loadAuthStateModule()

test('maps every real-name backend status to the page-facing state', () => {
  assert.equal(resolveAuthState('real-name', 0).pageStatus, 'unverified')
  assert.equal(resolveAuthState('real-name', 1).pageStatus, 'pending')
  assert.equal(resolveAuthState('real-name', 2).pageStatus, 'verified')
  assert.equal(resolveAuthState('real-name', 3).pageStatus, 'rejected')
})

test('makes only unverified and rejected real-name records editable', () => {
  assert.deepEqual(
    [0, 1, 2, 3].map(status => resolveAuthState('real-name', status).editable),
    [true, false, false, true]
  )
})

test('describes a rejected record with the backend reason', () => {
  const rejected = resolveAuthState('real-name', 3, { rejectReason: '身份证照片不清晰' })
  assert.equal(rejected.pageStatus, 'rejected')
  assert.equal(rejected.description, '身份证照片不清晰')
})

test('falls back to the shared rejected description without a reason', () => {
  const rejected = resolveAuthState('real-name', 3, { rejectReason: '' })
  assert.equal(rejected.pageStatus, 'rejected')
  assert.equal(rejected.description, '认证失败，请重新提交')
})

test('treats a missing record as unverified', () => {
  assert.equal(resolveAuthState('student').pageStatus, 'unverified')
  assert.equal(resolveAuthState('student', null).pageStatus, 'unverified')
  assert.equal(resolveAuthState('student').editable, true)
})

test('uses distinct real-name and student status descriptions', () => {
  const statuses = [0, 1, 2, 3].map(status => resolveAuthState('student', status).description)

  assert.equal(statuses[0], '完成学生认证，解锁学生权益')
  assert.equal(statuses[1], '您的学生认证信息正在审核中')
  assert.equal(statuses[2], '学生认证已完成')
  assert.equal(statuses[3], '认证失败，请重新提交')
  assert.equal(resolveAuthState('real-name', 2).description, '实名认证已完成')
})

test('locks student authentication unless real-name verification is verified', () => {
  const student = resolveAuthState('student', 0)
  const results = [0, 1, 2, 3].map(status =>
    resolveStudentAuthAccessState(student, resolveAuthState('real-name', status))
  )

  assert.deepEqual(
    results.map(result => result.locked),
    [true, true, false, true]
  )
  assert.deepEqual(
    results.map(result => result.target),
    ['real-name', 'real-name', 'student', 'real-name']
  )
})

test('keeps the shared student status model on the center card', () => {
  const student = resolveAuthState('student', 3, { rejectReason: '学生证照片不清晰' })
  const result = resolveStudentAuthAccessState(student, resolveAuthState('real-name', 2))

  assert.equal(result.locked, false)
  assert.equal(result.target, 'student')
  assert.equal(result.status.pageStatus, 'rejected')
  assert.equal(result.status.description, '学生证照片不清晰')
})

test('expresses a locked student card without changing its underlying state', () => {
  const result = resolveStudentAuthAccessState(resolveAuthState('student', 1), resolveAuthState('real-name', 0))

  assert.equal(result.locked, true)
  assert.equal(result.label, '未解锁')
  assert.equal(result.actionLabel, '去实名认证')
  assert.equal(result.description, '实名认证通过后才能进行学生认证')
  assert.equal(result.icon, 'locked')
  assert.equal(result.colorToken, '--text-color-tertiary')
  assert.equal(result.semanticColor, 'neutral')
  assert.equal(result.status.pageStatus, 'pending')
})

test('expresses an unlocked student card with the shared status fields', () => {
  const result = resolveStudentAuthAccessState(resolveAuthState('student', 0), resolveAuthState('real-name', 2))

  assert.equal(result.locked, false)
  assert.equal(result.label, '未认证')
  assert.equal(result.actionLabel, '去认证')
  assert.equal(result.icon, 'info')
  assert.equal(result.colorToken, '--info-color')
  assert.equal(result.semanticColor, 'info')
})
