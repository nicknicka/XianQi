import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const mobileDir = path.resolve(testDir, '..')
const AUTH_PAGES = [
  'src/pages/mine/auth-center.vue',
  'src/pages/mine/real-name-auth.vue',
  'src/pages/mine/student-auth.vue'
]
const SHARED_COMPONENTS = [
  'AuthStatusPanel',
  'AuthFormField',
  'AuthStudentCardUpload'
]

function compileSharedComponents() {
  return SHARED_COMPONENTS.map(name => {
    const filePath = path.join(mobileDir, 'src', 'components', 'auth', `${name}.vue`)
    const { descriptor, errors } = parse(readFileSync(filePath, 'utf8'), { filename: filePath })
    assert.deepEqual(errors, [])
    compileScript(descriptor, { id: `auth-${name}` })
    return name
  })
}

test('compiles the shared authentication components', () => {
  assert.deepEqual(compileSharedComponents(), SHARED_COMPONENTS)
})

test('auth pages consume the shared status and form seams', () => {
  compileSharedComponents()

  const sources = Object.fromEntries(
    AUTH_PAGES.map(page => [page, readFileSync(path.join(mobileDir, page), 'utf8')])
  )

  for (const page of ['src/pages/mine/real-name-auth.vue', 'src/pages/mine/student-auth.vue']) {
    assert.match(sources[page], /import AuthStatusPanel from '@\/components\/auth\/AuthStatusPanel\.vue'/)
    assert.match(sources[page], /import AuthFormField from '@\/components\/auth\/AuthFormField\.vue'/)
    assert.match(sources[page], /<AuthStatusPanel\b/)
    assert.match(sources[page], /<AuthFormField\b/)
  }

  assert.match(
    sources['src/pages/mine/student-auth.vue'],
    /import AuthStudentCardUpload from '@\/components\/auth\/AuthStudentCardUpload\.vue'/
  )
  assert.match(sources['src/pages/mine/student-auth.vue'], /<AuthStudentCardUpload\b/)

  assert.match(
    sources['src/pages/mine/auth-center.vue'],
    /useAuthSemanticColors/
  )
})
