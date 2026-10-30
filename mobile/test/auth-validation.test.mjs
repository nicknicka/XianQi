import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(testDir, '..', 'src', 'utils', 'auth', 'real-name-validation.ts')
const source = readFileSync(sourcePath, 'utf8')
  .replaceAll('export const', 'const')
  .replaceAll('export function', 'function')
  .replaceAll('export type', 'type')
  .concat('\nthis.__realNameValidation = { getRealNameFieldError }')
  .replace("import validator from '@/utils/validator'", 'const validator = __validator')

function loadModule() {
  const context = vm.createContext({
    console,
    __validator: {
      isRealName: value => /^[\u4e00-\u9fa5]{2,10}$/.test(value),
      isIdCard: value => /(^^\d{15}$)|(^^\d{18}$)|(^^\d{17}(\d|X|x)$)/.test(value)
    }
  })
  vm.runInContext(ts.transpile(source, { target: ts.ScriptTarget.ES2021 }), context)
  return context.__realNameValidation
}

const { getRealNameFieldError } = loadModule()

test('gives field-near real-name validation messages', () => {
  assert.equal(getRealNameFieldError('realName', ''), '请输入真实姓名')
  assert.equal(getRealNameFieldError('realName', 'A'), '姓名格式不正确')
  assert.equal(getRealNameFieldError('realName', '张三'), null)
})

test('gives field-near ID card validation messages', () => {
  assert.equal(getRealNameFieldError('idCard', ''), '请输入身份证号')
  assert.equal(getRealNameFieldError('idCard', '123'), '身份证号格式不正确')
  assert.equal(getRealNameFieldError('idCard', '110101199003078515'), null)
})
