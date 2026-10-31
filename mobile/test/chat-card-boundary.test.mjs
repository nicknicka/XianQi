import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const mobileDir = path.resolve(testDir, '..')

function source(relativePath) {
  return readFileSync(path.join(mobileDir, relativePath), 'utf8')
}

const chat = source('src/pages/message/chat.vue')

test('card payload parsing is typed at the external boundary', () => {
  assert.match(chat, /interface ProductCard \{/)
  assert.match(chat, /interface OrderCard \{/)
  assert.match(chat, /interface PickerItem \{/)
  assert.match(chat, /function firstDefined\(\.\.\.values: unknown\[\]\): unknown/)
  assert.match(chat, /function normalizeProductCard\(card: unknown\): ProductCard \{/)
  assert.match(chat, /function normalizeOrderCard\(card: unknown\): OrderCard \{/)
  assert.match(chat, /function parseCardPayload\(message: \{ content\?: unknown; extraData\?: unknown \}\): ProductCard \{/)
})

test('chat message content is typed instead of any', () => {
  assert.match(chat, /type MessageContent = string \| ProductCard \| OrderCard/)
  assert.match(chat, /content: MessageContent/)
  assert.doesNotMatch(chat, /content: any\b/)
})

test('product picker view model replaces the page-layer aliases', () => {
  assert.match(chat, /const myProducts = ref<PickerItem\[\]>\(\[\]\)/)
  assert.match(chat, /async function fetchAllSellerProducts\(userId: string\): Promise<Product\[\]>/)
  assert.match(chat, /async function fetchAllUserShareItems\(userId: string\): Promise<ShareItem\[\]>/)
  assert.match(chat, /function sendProductCard\(product: PickerItem\)/)
  assert.match(chat, /async function sendProductMessage\(productCard: ProductCard\)/)

  // 选择器条目来自已契约化的 API 结果，不应再出现快捷别名兜底。
  assert.doesNotMatch(chat, /const \[productResult, shareResult\]: any\[\]/)
  assert.doesNotMatch(chat, /item\.shareId \|\| item\.shareItemId/)
  assert.doesNotMatch(chat, /p\.id \|\| p\.productId/)
  assert.doesNotMatch(chat, /item\.dailyRental/)
})
