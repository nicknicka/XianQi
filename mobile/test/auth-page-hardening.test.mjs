import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const mobileDir = path.resolve(testDir, '..')
const repoDir = path.resolve(mobileDir, '..')

function source(relativePath) {
  return readFileSync(path.join(mobileDir, relativePath), 'utf8')
}

test('real-name page uses the shared bottom safe-area pattern', () => {
  const page = source('src/pages/mine/real-name-auth.vue')

  assert.match(
    page,
    /padding-bottom:\s*calc\(var\(--auth-page-padding\)\s*\+\s*env\(safe-area-inset-bottom\)\);/
  )
})

test('student upload callbacks are invalidated by remove and replace', () => {
  const page = source('src/pages/mine/student-auth.vue')

  for (const symbol of [
    'beginStudentCardUpload',
    'cancelStudentCardUpload',
    'isCurrentStudentCardUpload',
    '{ replace: true }'
  ]) {
    assert.match(page, new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('auth inputs keep focus and submit above the keyboard', () => {
  const field = source('src/components/auth/AuthFormField.vue')

  assert.match(field, /:adjust-position="true"/)
  assert.match(field, /:cursor-spacing="AUTH_INPUT_CURSOR_SPACING_PX"/)
  assert.match(field, /AUTH_INPUT_CURSOR_SPACING_PX/)
  assert.match(source('src/utils/auth/auth-tokens.ts'), /AUTH_INPUT_CURSOR_SPACING_PX/)
  assert.match(
    readFileSync(path.join(repoDir, 'docs/design/authentication-tokens.md'), 'utf8'),
    /AUTH_INPUT_CURSOR_SPACING_PX/
  )
})
