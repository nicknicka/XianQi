import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const source = readFileSync(path.join(testDir, '..', 'src', 'utils', 'websocket-url.ts'), 'utf8')

function loadWebSocketUrlModule() {
  const executable = source
    .replaceAll('import.meta.env.VITE_API_BASE_URL', "''")
    .replaceAll('import.meta.env.VITE_WS_BASE_URL', "''")
    .replaceAll('export function', 'function')
    .concat('\nthis.__webSocketUrlModule = { buildH5WebSocketUrl, normalizeConfiguredWebSocketUrl }\n')
  const context = vm.createContext({ console, Error, URL })
  vm.runInContext(
    ts.transpile(executable, { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.None }),
    context
  )
  return context.__webSocketUrlModule
}

const { buildH5WebSocketUrl, normalizeConfiguredWebSocketUrl } = loadWebSocketUrlModule()

test('builds the H5 WebSocket URL from the current page host and port', () => {
  const url = buildH5WebSocketUrl('http://localhost:8088/api', {
    protocol: 'http:',
    host: 'localhost:8088',
    origin: 'http://localhost:8088'
  })

  assert.equal(url, 'ws://localhost:8088/api/ws')
})

test('uses wss for HTTPS pages', () => {
  const url = buildH5WebSocketUrl('/api', {
    protocol: 'https:',
    host: 'xianqi.example.com',
    origin: 'https://xianqi.example.com'
  })

  assert.equal(url, 'wss://xianqi.example.com/api/ws')
})

test('preserves a configured API subpath', () => {
  const url = buildH5WebSocketUrl('https://example.com/gateway/api/', {
    protocol: 'https:',
    host: 'example.com',
    origin: 'https://example.com'
  })

  assert.equal(url, 'wss://example.com/gateway/api/ws')
})

test('keeps local mini-program development URLs on ws', () => {
  assert.equal(
    normalizeConfiguredWebSocketUrl('ws://127.0.0.1:8088/api/ws'),
    'ws://127.0.0.1:8088/api/ws'
  )
})

test('upgrades external mini-program URLs to wss', () => {
  assert.equal(
    normalizeConfiguredWebSocketUrl('http://api.example.com/api/ws'),
    'wss://api.example.com/api/ws'
  )
})

test('rejects missing or malformed WebSocket configuration', () => {
  assert.throws(() => normalizeConfiguredWebSocketUrl(''), /未配置/)
  assert.throws(() => normalizeConfiguredWebSocketUrl('/api/ws'), /必须是/)
})
