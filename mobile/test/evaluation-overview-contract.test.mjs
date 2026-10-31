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

test('evaluation list type declares only fields the backend page envelope has', () => {
  const api = source('src/api/evaluation.ts')
  const listCall = api.slice(api.indexOf('getProductEvaluations'))

  assert.match(listCall, /list: Evaluation\[\]/)
  assert.match(listCall, /total: number/)
  // 后端 IPage<EvaluationVO> 不返回这两个字段，声明它们等于必然静默为 0。
  assert.doesNotMatch(listCall, /averageRating:\s*number/)
  assert.doesNotMatch(listCall, /totalCount:\s*number/)
})

test('product evaluation overview reads total from the page and fetches the rating separately', () => {
  const page = source('src/pages/market/evaluation-list.vue')

  assert.match(page, /totalCount:\s*data\.total \|\| 0/)
  assert.match(page, /getProductAverageRating\(productId\.value\)/)
  assert.doesNotMatch(page, /data\.totalCount/)
  assert.doesNotMatch(page, /data\.averageRating/)
})

test('product average rating is served by a dedicated backend endpoint', () => {
  const controller = backendSource(
    'backend/src/main/java/com/xx/xianqijava/controller/EvaluationController.java'
  )
  const service = backendSource(
    'backend/src/main/java/com/xx/xianqijava/service/EvaluationService.java'
  )

  assert.match(controller, /@GetMapping\("\/product\/\{productId\}\/average-rating"\)/)
  assert.match(controller, /public Result<Double> getProductAverageRating\(/)
  assert.match(service, /Double getProductAverageRating\(Long productId\);/)
})
