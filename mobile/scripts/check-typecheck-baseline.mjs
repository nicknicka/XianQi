#!/usr/bin/env node
/**
 * 类型检查基线守卫。
 *
 * 用 vue-tsc（而非 tsc）：tsc 不解析 .vue 单文件组件，会漏掉业务页面的
 * 全部类型问题。vue-tsc 覆盖 .ts 与 .vue。
 *
 * mobile 存在一批既存类型错误，本守卫不负责修完它们，只要求：**不新增**。
 *
 * 基线已去除行号，因此代码挪动不会造成噪声；消息变化会被识别为新增。
 *
 * 用法：
 *   node scripts/check-typecheck-baseline.mjs            # 校验
 *   node scripts/check-typecheck-baseline.mjs --update   # 重建基线（需人工确认）
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const baselinePath = path.join(here, 'typecheck-baseline.txt')

function currentErrors() {
  let output = ''
  try {
    output = execFileSync(path.join(root, 'node_modules/.bin/vue-tsc'),
      ['--noEmit', '-p', 'tsconfig.json'], { cwd: root, encoding: 'utf8' })
  } catch (error) {
    // tsc 有错误时以非零码退出，错误内容在 stdout
    output = error.stdout || ''
  }
  const entries = []
  for (const line of output.split('\n')) {
    const match = line.match(/^([^(]+)\(\d+,\d+\): (error TS\d+: .*)$/)
    if (match) entries.push(normalizeEntry(`${match[1]}: ${match[2]}`))
  }
  return new Set(entries)
}

/**
 * 规范化一条错误记录的文本。
 *
 * 关键：vue-tsc 的某些消息里**嵌了绝对路径**，例如
 *   Argument of type 'Product' is not assignable to parameter of type
 *   'import("/home/runner/work/XianQi/XianQi/mobile/src/types/index").Product'
 * 若原样写进基线，则基线只在本机成立、在 CI 上必然被判定为「新增」。
 * 这里把所有工作区绝对路径统一压成 <repo>。
 */
function normalizeEntry(entry) {
  return entry
    .replaceAll(root + path.sep, '<repo>/')
    .replaceAll(root, '<repo>')
    .replace(/\/(?:Users|home)\/[^"'\s]*?\/mobile\//g, '<repo>/mobile/')
}

function readBaseline() {
  return new Set(
    readFileSync(baselinePath, 'utf8')
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.trim())
  )
}

const current = currentErrors()
const baseline = readBaseline()

if (process.argv.includes('--update')) {
  const sorted = [...current].sort()
  const header = '# mobile 既存 TypeScript 错误基线（行号已去除，避免代码挪动造成噪声）。\n' +
    '# 每行格式：<文件>: error TSxxxx: <消息>\n' +
    '# 重构期间要求：不得新增此清单之外的错误。'
  const entries = sorted.length ? `\n\n${sorted.join('\n')}` : ''
  writeFileSync(baselinePath, `${header}${entries}\n`)
  console.log(`基线已更新：${sorted.length} 条`)
  process.exit(0)
}

const added = [...current].filter(e => !baseline.has(e)).sort()
const fixed = [...baseline].filter(e => !current.has(e)).sort()

if (fixed.length) {
  console.log(`类型检查基线守卫：有 ${fixed.length} 条既存错误已修复（很好，请用 --update 收紧基线）`)
  for (const e of fixed.slice(0, 5)) console.log(`  - ${e}`)
}

if (added.length) {
  console.error(`类型检查基线守卫失败：新增 ${added.length} 条类型错误`)
  for (const e of added) console.error(`  + ${e}`)
  process.exit(1)
}

console.log(`类型检查基线守卫 OK（基线 ${baseline.size} 条，无新增）`)
