import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const source = readFileSync(path.join(testDir, '..', 'src', 'api', 'ai.ts'), 'utf8')

function loadAiApi(chunks) {
  const executable = source
    .replace("import { http } from '@/utils/request'", 'const http = { post: () => Promise.reject(new Error("unused")) }')
    .replace("import { wsClient } from '@/utils/websocket'", 'const wsClient = { isConnected: () => false, send: () => false }')
    .replace("import { normalizeId } from '@/utils/id'", 'const normalizeId = value => value')
    .replace('export const aiApi = {', 'const aiApi = {')
    .replace('import.meta.env.VITE_API_BASE_URL', "''")
    .replace(/\/\/ #ifndef H5[\s\S]*?\/\/ #endif/g, '')
    .concat('\nthis.__aiModule = { aiApi }\n')

  const encoder = new TextEncoder()
  let index = 0
  const reader = {
    read: async () => {
      if (index >= chunks.length) return { done: true, value: undefined }
      return { done: false, value: encoder.encode(chunks[index++]) }
    }
  }
  const context = vm.createContext({
    console,
    Error,
    exports: {},
    JSON,
    Promise,
    TextEncoder,
    TextDecoder,
    uni: { getStorageSync: () => 'test-token' },
    fetch: async () => ({ ok: true, body: { getReader: () => reader } }),
    setTimeout
  })

  vm.runInContext(
    ts.transpile(executable, { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.None }),
    context
  )
  return context.__aiModule.aiApi
}

async function waitForCallbacks() {
  await new Promise(resolve => setTimeout(resolve, 10))
}

test('SSE error events invoke onError and never onMessage', async () => {
  const aiApi = loadAiApi([
    'event: error\n',
    'data: {"type":"AI_DISABLED","code":503,"message":"AI 功能未启用","retryable":false}\n\n'
  ])
  const messages = []
  const errors = []
  let completed = 0

  aiApi.chatStream(
    { userId: '1', message: '你好' },
    chunk => messages.push(chunk),
    error => errors.push(error),
    () => { completed++ }
  )
  await waitForCallbacks()

  assert.deepEqual(messages, [])
  assert.equal(errors.length, 1)
  assert.equal(errors[0].type, 'AI_DISABLED')
  assert.equal(errors[0].code, 503)
  assert.equal(completed, 0)
})

test('normal SSE data remains a message and completes', async () => {
  const aiApi = loadAiApi([
    'data: 你好\n\n',
    'data: [DONE]\n\n'
  ])
  const messages = []
  const errors = []
  let completed = 0

  aiApi.chatStream(
    { userId: '1', message: '你好' },
    chunk => messages.push(chunk),
    error => errors.push(error),
    () => { completed++ }
  )
  await waitForCallbacks()

  assert.deepEqual(messages, ['你好'])
  assert.deepEqual(errors, [])
  assert.equal(completed, 1)
})
