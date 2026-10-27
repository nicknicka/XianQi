import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const idSource = readFileSync(path.join(testDir, '..', 'src', 'utils', 'id.ts'), 'utf8')

function loadIdModule(globals) {
  const source = idSource
    .replaceAll('export function', 'function')
    .concat('\nthis.__idModule = { normalizeId, extractUserIdFromToken }\n')
  const context = vm.createContext({ console, ...globals })
  vm.runInContext(ts.transpile(source, { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.None }), context)
  return context.__idModule
}

function tokenWithPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `header.${body}.signature`
}

const snowflake = '373392214539245298'
const otherSnowflake = '373392214539245299'

test('extracts string IDs in a mini-program runtime without atob', () => {
  const { extractUserIdFromToken } = loadIdModule({})
  assert.equal(extractUserIdFromToken(tokenWithPayload({ userId: snowflake })), snowflake)
})

test('does not round snowflake IDs through JavaScript numbers', () => {
  const { normalizeId } = loadIdModule({})
  assert.equal(normalizeId(snowflake), snowflake)
  assert.notEqual(normalizeId(snowflake), String(Number(snowflake)))
})

test('preserves a list of snowflake IDs as strings', () => {
  const ids = [snowflake, otherSnowflake]
  assert.deepEqual(ids.map(value => String(value)), [snowflake, otherSnowflake])
  assert.equal(new Set(ids).size, 2)
})
