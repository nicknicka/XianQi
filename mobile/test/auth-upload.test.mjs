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

test('rejects missing or unreadable student card image metadata', () => {
  assert.equal(
    validateStudentCardImage({ name: 'student-card.jpg' }),
    '图片信息不可读，请重新选择'
  )
  assert.equal(
    validateStudentCardImage({ name: 'student-card.jpg', size: Number.NaN }),
    '图片信息不可读，请重新选择'
  )
  assert.equal(
    validateStudentCardImage({ name: 'student-card.jpg', size: 1024 }),
    '图片信息不可读，请重新选择'
  )
})

test('rejects unsupported student card images before upload', () => {
  assert.equal(
    validateStudentCardImage({ name: 'student-card.gif', type: 'image/gif', size: 1024 }),
    '仅支持 JPG、JPEG、PNG 或 WEBP 格式图片'
  )
})

test('rejects oversized student card images before upload', () => {
  assert.equal(
    validateStudentCardImage({ name: 'student-card.jpg', type: 'image/jpeg', size: STUDENT_CARD_IMAGE_MAX_SIZE + 1 }),
    '图片大小不能超过 5MB'
  )
})

test('accepts supported student card images within the backend limit', () => {
  assert.equal(validateStudentCardImage({ name: 'student-card.webp', type: 'image/webp', size: 5 * 1024 * 1024 }), null)
})

test('cancels a pending student card upload so its callback cannot write', () => {
  const state = createStudentCardUploadState()
  const request = beginStudentCardUpload(state, 'frontImage')

  assert.equal(isCurrentStudentCardUpload(state, request), true)

  cancelStudentCardUpload(state, request.side)

  assert.equal(isCurrentStudentCardUpload(state, request), false)
})

test('replacing a pending student card upload invalidates only that side', () => {
  const state = createStudentCardUploadState()
  const frontRequest = beginStudentCardUpload(state, 'frontImage')
  const backRequest = beginStudentCardUpload(state, 'backImage')
  const replacementRequest = beginStudentCardUpload(state, 'frontImage', { replace: true })

  assert.equal(isCurrentStudentCardUpload(state, frontRequest), false)
  assert.equal(isCurrentStudentCardUpload(state, replacementRequest), true)
  assert.equal(isCurrentStudentCardUpload(state, backRequest), true)
})

test('does not treat normal upload failures as cancelled selection', () => {
  assert.equal(isImageSelectionCancelled(new Error('upload failed')), false)
  assert.equal(isImageSelectionCancelled({ errMsg: 'chooseImage:fail cancel' }), true)
})
