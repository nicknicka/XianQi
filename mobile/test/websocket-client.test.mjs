import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const source = readFileSync(path.join(testDir, '..', 'src', 'utils', 'websocket.ts'), 'utf8')

class FakeSocketTask {
  constructor() {
    this.readyState = 0
    this.sent = []
    this.handlers = {}
  }

  onOpen(callback) {
    this.handlers.open = callback
  }

  onMessage(callback) {
    this.handlers.message = callback
  }

  onError(callback) {
    this.handlers.error = callback
  }

  onClose(callback) {
    this.handlers.close = callback
  }

  send(options) {
    if (this.readyState !== 1) {
      options.fail?.({ errMsg: 'SocketTask.readyState is not OPEN' })
      return
    }

    this.sent.push(options.data)
    options.success?.()
  }

  close() {
    if (this.readyState === 3) return
    this.readyState = 3
    this.handlers.close?.()
  }

  open() {
    this.readyState = 1
    this.handlers.open?.()
  }

  receive(payload) {
    this.handlers.message?.({ data: JSON.stringify(payload) })
  }

  fail(error = new Error('socket error')) {
    this.handlers.error?.(error)
  }

  closeFromRemote() {
    this.close()
  }
}

function loadClientModule() {
  const executable = source
    .replace('export const wsClient = new WebSocketClient()', 'const wsClient = new WebSocketClient()')
    .replace('export default wsClient', '')
    .concat('\nthis.__webSocketClientModule = { WebSocketClient }\n')

  const tasks = []
  const timers = []
  const intervals = []
  const context = vm.createContext({
    console,
    Error,
    JSON,
    uni: {
      getStorageSync: () => 'test-token',
      connectSocket: () => {
        const task = new FakeSocketTask()
        tasks.push(task)
        return task
      }
    },
    setTimeout: callback => {
      timers.push(callback)
      return timers.length
    },
    clearTimeout: () => {},
    setInterval: callback => {
      intervals.push(callback)
      return intervals.length
    },
    clearInterval: () => {}
  })

  vm.runInContext(
    ts.transpile(executable, { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.None }),
    context
  )

  return { ...context.__webSocketClientModule, tasks, timers, intervals }
}

test('supports multiple message subscribers and removes only the unsubscribed callback', () => {
  const { WebSocketClient, tasks } = loadClientModule()
  const client = new WebSocketClient()
  const first = []
  const second = []

  const unsubscribeFirst = client.on('message', message => first.push(message.type))
  client.on('message', message => second.push(message.type))

  client.connect('ws://localhost/ws')
  tasks[0].open()
  tasks[0].receive({ type: 'before-unsubscribe' })
  unsubscribeFirst()
  tasks[0].receive({ type: 'after-unsubscribe' })

  assert.deepEqual(first, ['before-unsubscribe'])
  assert.deepEqual(second, ['before-unsubscribe', 'after-unsubscribe'])
})

test('does not create duplicate sockets for the same endpoint', () => {
  const { WebSocketClient, tasks } = loadClientModule()
  const client = new WebSocketClient()

  client.connect('ws://localhost/ws')
  client.connect('ws://localhost/ws')
  tasks[0].open()
  client.connect('ws://localhost/ws')

  assert.equal(tasks.length, 1)
})

test('send fails immediately unless the socket is open', () => {
  const { WebSocketClient, tasks } = loadClientModule()
  const client = new WebSocketClient()

  client.connect('ws://localhost/ws')
  assert.equal(client.send({ type: 'ping' }), false)

  tasks[0].open()
  assert.equal(client.send({ type: 'ping' }), true)
  assert.deepEqual(tasks[0].sent, [JSON.stringify({ type: 'ping' })])
})

test('schedules only one reconnect when both error and close are emitted', () => {
  const { WebSocketClient, tasks, timers } = loadClientModule()
  const client = new WebSocketClient()

  client.connect('ws://localhost/ws')
  tasks[0].fail()
  tasks[0].closeFromRemote()

  assert.equal(timers.length, 1)
})

test('stale socket events do not affect a replacement connection', () => {
  const { WebSocketClient, tasks } = loadClientModule()
  const client = new WebSocketClient()
  const closed = []

  client.on('close', () => closed.push('closed'))
  client.connect('ws://localhost/ws')
  tasks[0].open()

  client.connect('ws://localhost:8081/ws')
  tasks[1].open()
  tasks[0].closeFromRemote()

  assert.deepEqual(closed, [])
  assert.equal(client.isConnected(), true)
})
