import { readFileSync } from 'node:fs'
import path from 'node:path'

const file = process.argv[2]
if (!file) {
  console.error('usage: check-ci-order.mjs <ci.yml>')
  process.exit(2)
}

const text = readFileSync(path.resolve(file), 'utf8')

function jobBlock(name) {
  const pattern = new RegExp(`^  ${name}:[\\s\\S]*`, 'm')
  const match = text.match(pattern)
  return match ? match[0] : null
}

function stepPosition(job, label) {
  return job.search(new RegExp(`^\\s*- name: ${label}\\s*$`, 'm'))
}

const jobs = [
  { name: 'admin-build', lintStep: 'Lint', buildStep: 'Build' },
  { name: 'mobile-build', lintStep: 'Lint', buildStep: 'Build H5' }
]

let failed = false
for (const job of jobs) {
  const block = jobBlock(job.name)
  if (!block) {
    console.error(`CI job not found: ${job.name}`)
    failed = true
    continue
  }
  const lint = stepPosition(block, job.lintStep)
  const build = stepPosition(block, job.buildStep)
  if (lint === -1) {
    console.error(`CI job ${job.name} is missing step: ${job.lintStep}`)
    failed = true
    continue
  }
  if (build === -1) {
    console.error(`CI job ${job.name} is missing step: ${job.buildStep}`)
    failed = true
    continue
  }
  if (!(lint < build)) {
    console.error(`CI job ${job.name}: ${job.lintStep} must run before ${job.buildStep}`)
    failed = true
    continue
  }
  const lintBlock = block.slice(lint, build)
  if (!/npm run lint(?!:fix)/.test(lintBlock)) {
    console.error(`CI job ${job.name}: lint step must call read-only npm run lint`)
    failed = true
  }
  if (/--fix|lint:fix/.test(lintBlock)) {
    console.error(`CI job ${job.name}: lint step must not use --fix`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log('CI lint order OK')
