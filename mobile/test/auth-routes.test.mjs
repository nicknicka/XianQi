import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const OLD_AUTH_PATH = 'pages/mine/verification'
const AUTH_ROUTES = [
  'pages/mine/auth-center',
  'pages/mine/real-name-auth',
  'pages/mine/student-auth'
]
const ENTRY_PAGE_NAMES = ['profile.vue', 'security.vue', 'services.vue']

const testDir = path.dirname(fileURLToPath(import.meta.url))
const mobileDir = path.resolve(testDir, '..')
const srcDir = path.join(mobileDir, 'src')

function* walkSources(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      yield* walkSources(filePath)
    } else if (/\.(json|ts|vue)$/.test(entry.name)) {
      yield filePath
    }
  }
}

function readRequireLoginPages() {
  const source = readFileSync(path.join(srcDir, 'utils', 'auth.ts'), 'utf8')
  const list = source.match(/export const REQUIRE_LOGIN_PAGES = \[([\s\S]*?)\]/)
  assert.ok(list, 'REQUIRE_LOGIN_PAGES should remain a declared list')
  return [...list[1].matchAll(`'(/[^']+)'`)].map(match => match[1])
}

test('registers the three-page authentication flow without the old mixed page', () => {
  const pagesJson = JSON.parse(readFileSync(path.join(srcDir, 'pages.json'), 'utf8'))
  const pagePaths = pagesJson.pages.map(page => page.path)

  assert.equal(pagePaths.includes(OLD_AUTH_PATH), false)
  for (const route of AUTH_ROUTES) {
    assert.equal(pagePaths.includes(route), true)
  }
})

test('requires login for the three-page authentication flow without the old page', () => {
  const pages = readRequireLoginPages()

  assert.equal(pages.includes(`/${OLD_AUTH_PATH}`), false)
  for (const route of AUTH_ROUTES) {
    assert.equal(pages.includes(`/${route}`), true)
  }
})

test('keeps profile and service authentication entries on the center page', () => {
  for (const pageName of ENTRY_PAGE_NAMES) {
    const source = readFileSync(path.join(srcDir, 'pages', 'mine', pageName), 'utf8')

    assert.equal(source.includes('/pages/mine/real-name-auth'), false, pageName)
    assert.equal(source.includes('/pages/mine/student-auth'), false, pageName)
  }
})

test('removes every valid old mixed authentication route reference from mobile sources', () => {
  const staleFiles = []
  for (const filePath of walkSources(srcDir)) {
    if (readFileSync(filePath, 'utf8').includes(OLD_AUTH_PATH)) {
      staleFiles.push(path.relative(mobileDir, filePath))
    }
  }

  assert.deepEqual(staleFiles, [])
})
