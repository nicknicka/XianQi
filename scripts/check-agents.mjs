import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())
const agentsFile = path.join(root, 'AGENTS.md')

function fail(message) {
  console.error(`AGENTS contract failed: ${message}`)
  process.exitCode = 1
}

const content = readFileSync(agentsFile, 'utf8')
const targets = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
  .map(match => match[1])
  .filter(target => !target.startsWith('#') && !/^[a-z][a-z0-9+.-]*:/i.test(target))

for (const target of targets) {
  const relative = target.split('#', 1)[0]
  const absolute = path.resolve(path.dirname(agentsFile), relative)
  try {
    statSync(absolute)
  } catch {
    fail(`missing pointer target ${target} registered in AGENTS.md`)
  }
}

if (!process.exitCode) {
  console.log(`AGENTS contract OK (${targets.length} paths)`)
}
