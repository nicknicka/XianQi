import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())
const adrDir = path.join(root, 'docs', 'adr')

function fail(message) {
  console.error(`ADR contract failed: ${message}`)
  process.exitCode = 1
}

function markdownFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry)
    if (statSync(absolute).isDirectory()) {
      files.push(...markdownFiles(absolute))
    } else if (entry.endsWith('.md')) {
      files.push(absolute)
    }
  }
  return files
}

const entries = readdirSync(adrDir)
  .filter(name => name.endsWith('.md'))
  .map(name => {
    const match = name.match(/^(\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/)
    if (!match) {
      fail(`invalid ADR filename: ${name}`)
      return null
    }

    const content = readFileSync(path.join(adrDir, name), 'utf8')
    const title = content.match(/^# ADR-(\d{4}):\s+\S/m)
    if (!title) {
      fail(`missing ADR title: ${name}`)
      return null
    }
    if (title[1] !== match[1]) {
      fail(`title number ${title[1]} does not match filename ${name}`)
      return null
    }

    return { number: match[1], name, content }
  })
  .filter(Boolean)

const numbers = new Set()
for (const entry of entries) {
  if (numbers.has(entry.number)) {
    fail(`duplicate ADR number ${entry.number}`)
  }
  numbers.add(entry.number)
}

const markdownRoots = ['README.md', 'GLOSSARY.md', 'docs'].map(name => path.join(root, name))
for (const absolute of markdownRoots.flatMap(candidate => {
  try {
    return statSync(candidate).isDirectory() ? markdownFiles(candidate) : [candidate]
  } catch {
    return []
  }
})) {
  const content = readFileSync(absolute, 'utf8')
  for (const reference of content.matchAll(/ADR-(\d{4})/g)) {
    if (!numbers.has(reference[1])) {
      fail(`missing ADR-${reference[1]} referenced by ${path.relative(root, absolute)}`)
    }
  }
}

if (!process.exitCode) {
  console.log(`ADR contract OK (${entries.length} ADRs)`)
}
