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

function backendSource(relativePath) {
  return readFileSync(path.join(repoDir, relativePath), 'utf8')
}

test('browse-history deletion addresses the history record, not the product', () => {
  const page = source('src/pages/mine/history.vue')

  assert.match(page, /@click\.stop="deleteItem\(product\.historyId\)"/)
  assert.match(page, /\.deleteViewHistory\(historyId\)/)
  // 供删除使用的 `historyId` 来自浏览记录主键；商品主键只用于跳详情。
  assert.doesNotMatch(page, /\.id\b/)
  assert.match(page, /goDetail\(product\.productId\)/)
})

test('browse-history page keeps no response-shell casts or field aliases', () => {
  const page = source('src/pages/mine/history.vue')

  assert.doesNotMatch(page, /:\s*any\b/)
  assert.doesNotMatch(page, /res\.data \|\| res/)
  assert.doesNotMatch(page, /data\.list \|\| data\.records/)
})

test('history endpoint returns historyId alongside the product fields', () => {
  const vo = backendSource('backend/src/main/java/com/xx/xianqijava/vo/ProductVO.java')
  const impl = backendSource(
    'backend/src/main/java/com/xx/xianqijava/service/impl/ProductViewHistoryServiceImpl.java'
  )

  assert.match(vo, /private String historyId;/)
  assert.match(impl, /productVO\.setHistoryId\(String\.valueOf\(history\.getHistoryId\(\)\)\)/)
  assert.match(source('src/api/product.ts'), /list: ProductViewHistoryItem\[\]/)
  assert.match(source('src/api/product.ts'), /export interface ProductViewHistoryItem\b/)
})
