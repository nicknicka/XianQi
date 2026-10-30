import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(testDir, '..', 'src', 'utils', 'auth', 'student-card-image.ts')
const source = readFileSync(sourcePath, 'utf8')
  .replaceAll('export const', 'const')
  .replaceAll('export function', 'function')
  .replaceAll('export interface', 'interface')
  .replaceAll('export type', 'type')
  .concat('\nthis.__studentCardImage = {\n  STUDENT_CARD_IMAGE_MAX_SIZE,\n  createStudentCardUploadState,\n  beginStudentCardUpload,\n  cancelStudentCardUpload,\n  isCurrentStudentCardUpload,\n  isImageSelectionCancelled,\n  validateStudentCardImage\n}')

function loadModule() {
  const context = vm.createContext({ console })
  vm.runInContext(ts.transpile(source, { target: ts.ScriptTarget.ES2021 }), context)
  return context.__studentCardImage
}

const {
  STUDENT_CARD_IMAGE_MAX_SIZE,
  beginStudentCardUpload,
  cancelStudentCardUpload,
  createStudentCardUploadState,
  isCurrentStudentCardUpload,
  isImageSelectionCancelled,
  validateStudentCardImage
} = loadModule()

test('rejects unsupported student card images before upload', () => {
  assert.equal(
    validateStudentCardImage({ name: 'student-card.gif', size: 1024 }),
    '仅支持 JPG、JPEG、PNG 或 WEBP 格式图片'
  )
})

test('rejects oversized student card images before upload', () => {
  assert.equal(
    validateStudentCardImage({ name: 'student-card.jpg', size: STUDENT_CARD_IMAGE_MAX_SIZE + 1 }),
    '图片大小不能超过 5MB'
  )
})

test('accepts supported student card images within the backend limit', () => {
  assert.equal(validateStudentCardImage({ name: 'student-card.webp', size: 5 * 1024 * 1024 }), null)
})

test('cancels a pending student card upload so its callback cannot write', () => {
  const state = createStudentCardUploadState()
  const requestToken = beginStudentCardUpload(state, 'frontImage')

  assert.equal(isCurrentStudentCardUpload(state, 'frontImage', requestToken), true)

  cancelStudentCardUpload(state, 'frontImage')

  assert.equal(isCurrentStudentCardUpload(state, 'frontImage', requestToken), false)
})

test('replacing a pending student card upload invalidates only that side', () => {
  const state = createStudentCardUploadState()
  const frontRequestToken = beginStudentCardUpload(state, 'frontImage')
  const backRequestToken = beginStudentCardUpload(state, 'backImage')
  const replacementToken = beginStudentCardUpload(state, 'frontImage', { replace: true })

  assert.equal(isCurrentStudentCardUpload(state, 'frontImage', frontRequestToken), false)
  assert.equal(isCurrentStudentCardUpload(state, 'frontImage', replacementToken), true)
  assert.equal(isCurrentStudentCardUpload(state, 'backImage', backRequestToken), true)
})

test('does not treat normal upload failures as cancelled selection', () => {
  assert.equal(isImageSelectionCancelled(new Error('upload failed')), false)
  assert.equal(isImageSelectionCancelled({ errMsg: 'chooseImage:fail cancel' }), true)
})
