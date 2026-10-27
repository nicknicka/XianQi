import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())
const scriptsDir = path.join(root, 'scripts')
let failures = 0

function fail(message) {
  console.error(`unsafe inline GitHub body: ${message}`)
  failures += 1
}

function files(directory) {
  const result = []
  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry)
    if (statSync(absolute).isDirectory()) result.push(...files(absolute))
    else result.push(absolute)
  }
  return result
}

for (const file of files(scriptsDir)) {
  if (!file.endsWith('.sh') && !file.endsWith('.bash')) continue
  if (path.basename(file).startsWith('check-safe-gh-body')) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    if (/\bgh\b[^\n]*--(body|comment)\s+"/.test(line)) {
      fail(`${path.relative(root, file)}:${index + 1}`)
    }
  })
}

if (failures) process.exit(1)
console.log('safe body contract OK')
