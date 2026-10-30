import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const mobileDir = path.resolve(import.meta.dirname, '..')
const derivePath = path.join(mobileDir, 'src/utils/theme/theme-derive.ts')
const SOURCE_EXTENSIONS = /\.(?:vue|scss|css|ts|js)$/

/** Required canonical token coverage, grouped by the design contract. */
export const REQUIRED_TOKEN_CATEGORIES = {
  color: [
    '--primary-color',
    '--primary-color-light',
    '--primary-color-dark',
    '--secondary-color',
    '--accent-color',
    '--success-color',
    '--warning-color',
    '--danger-color',
    '--info-color'
  ],
  text: [
    '--text-color-primary',
    '--text-color-secondary',
    '--text-color-tertiary',
    '--text-color-disabled',
    '--text-color-inverse'
  ],
  background: [
    '--bg-color-page',
    '--bg-color-card',
    '--bg-color-warm',
    '--bg-color-disabled',
    '--bg-color-overlay'
  ],
  'font-size': [
    '--font-base',
    '--font-size-xs',
    '--font-size-sm',
    '--font-size-base',
    '--font-size-lg',
    '--font-size-xl',
    '--font-size-xxl'
  ],
  spacing: [
    '--spacing-xs',
    '--spacing-sm',
    '--spacing-md',
    '--spacing-lg',
    '--spacing-xl'
  ],
  border: [
    '--border-color-base',
    '--border-color-light',
    '--border-color-lighter',
    '--border-color-dark'
  ],
  radius: [
    '--border-radius-sm',
    '--border-radius-base',
    '--border-radius-lg',
    '--border-radius-xl',
    '--border-radius-pill'
  ],
  shadow: [
    '--box-shadow-xs',
    '--box-shadow-sm',
    '--box-shadow-base',
    '--box-shadow-primary',
    '--box-shadow-card'
  ],
  motion: [
    '--motion-duration-fast',
    '--motion-duration-medium',
    '--motion-duration-base',
    '--motion-duration-slow',
    '--motion-ease-standard'
  ]
}

const CRITICAL_ROOT_FALLBACKS = ['--bg-color-page', '--text-color-primary', '--font-base']
const THEME_SOURCE_RELATIVE_PATH = 'src/utils/theme/theme-derive.ts'
const GLOBAL_SHARED_STYLE_PATTERN = /^(?:src\/styles|src\/components)\//
const LEGACY_SCSS_DECLARATIONS_PATH = 'src/styles/variables.scss'
const RAW_SCSS_TOKEN_PATTERN = /(?<![\w-])\$[a-z][a-z0-9-]{2,}(?![\w-])/g
const PAGE_STATIC_FALLBACK_PATTERN = /var\(\s*(--[a-zA-Z][a-zA-Z0-9-]*)\s*,\s*([^)]+)\s*\)/g

const EXCLUDED_PAGE_STYLE_PATHS = [
  'src/pages/market/',
  'src/pages/publish/',
  'src/pages/mine/auth-center.vue',
  'src/pages/mine/real-name-auth.vue',
  'src/pages/mine/student-auth.vue'
]
const PAGE_STYLE_SCSS_DECLARATION_PATTERN = /\b[a-z][a-z0-9-]*(?:\s+[a-z0-9-]+)*\s*:\s*[^;{}]*\$[a-zA-Z][a-zA-Z0-9-]*/

/** Market, product publishing, and product editing pages covered by issue #108. */
export const DESIGN_TOKEN_PAGE_PATHS = [
  'src/pages/market/detail.vue',
  'src/pages/market/edit.vue',
  'src/pages/market/evaluation-list.vue',
  'src/pages/market/list.vue',
  'src/pages/market/publish-with-sidebar.vue',
  'src/pages/market/publish.vue',
  'src/pages/publish/index.vue',
]

const FIXED_SCSS_DEFAULT_PATTERNS = [
  /\$(?:bg|text|border)-color-[a-z0-9-]+/g,
  /\$(?:primary|secondary|accent|success|warning|error|danger|info)-color(?:-[a-z0-9-]+)?/g,
  /\$font-size-[a-z0-9-]+/g,
  /\$spacing-[a-z0-9-]+/g,
  /\$(?:border-radius|radius)-[a-z0-9-]+/g,
  /\$(?:box|clay)-shadow-[a-z0-9-]+/g,
  /\$transition-[a-z0-9-]+/g,
]

function* extractStyleBlocks(source) {
  for (const match of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    const offset = match.index + match[0].indexOf(match[1])
    yield { source: match[1], offset }
  }
}

function collectSourceFiles(directory, relativeDirectory = '') {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relativePath = relativeDirectory ? path.join(relativeDirectory, entry.name) : entry.name
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(path.join(directory, entry.name), relativePath))
    } else if (entry.isFile() && SOURCE_EXTENSIONS.test(entry.name)) {
      files.push(relativePath)
    }
  }
  return files.sort()
}

function loadProjectSources() {
  const sourceDir = path.join(mobileDir, 'src')
  return Object.fromEntries(
    collectSourceFiles(sourceDir).map(relativeSourcePath => [
      `src/${relativeSourcePath}`,
      readFileSync(path.join(sourceDir, relativeSourcePath), 'utf8')
    ])
  )
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Extract the complete runtime token dictionary without importing TypeScript. */
export function parseThemeTokens(source) {
  const tokens = new Set()

  const staticVars = source.match(/export const STATIC_VARS[^{]+\{([\s\S]*?)\n\}/)?.[1] ?? ''
  for (const match of staticVars.matchAll(/'(--[a-zA-Z][a-zA-Z0-9-]*)'/g)) {
    tokens.add(match[1])
  }

  for (const match of source.matchAll(/vars\['(--[a-zA-Z][a-zA-Z0-9-]*)'\]/g)) {
    tokens.add(match[1])
  }

  const alphaSpecs = source.matchAll(
    /\{\s*from:\s*'([^']+)'(?:,\s*prefix:\s*'([^']+)')?,\s*alphas:\s*\[([^\]]+)\]/g
  )
  for (const [, sourceName, customPrefix, alphaList] of alphaSpecs) {
    const camelToKebab = sourceName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    const prefix = customPrefix ?? camelToKebab
    for (const alphaText of alphaList.split(',')) {
      const alpha = Number(alphaText.trim())
      if (Number.isFinite(alpha)) tokens.add(`--${prefix}-alpha-${Math.round(alpha * 100)}`)
    }
  }

  return tokens
}

function findLocalTokenDefinitions(source) {
  const definitions = new Set()
  const definitionPatterns = [
    /(?<![\w-])(--[a-zA-Z][a-zA-Z0-9-]*)\s*:/g,
    /['"](--[a-zA-Z][a-zA-Z0-9-]*)['"]\s*:/g
  ]

  for (const pattern of definitionPatterns) {
    for (const match of source.matchAll(pattern)) definitions.add(match[1])
  }
  return definitions
}

function* findFixedScssTokenUses(relativeFile, source) {
  if (!GLOBAL_SHARED_STYLE_PATTERN.test(relativeFile)) return
  if (relativeFile === LEGACY_SCSS_DECLARATIONS_PATH) return

  const styleBlocks = relativeFile.endsWith('.vue')
    ? [...extractStyleBlocks(source)]
    : [{ source, offset: 0 }]

  for (const { source: styleSource, offset } of styleBlocks) {
    for (const match of styleSource.matchAll(RAW_SCSS_TOKEN_PATTERN)) {
      yield {
        token: match[0],
        scssToken: match[0],
        line: lineAt(source, offset + match.index)
      }
    }
  }
}

export function findFixedTokenDefaults(sources) {
  return Object.entries(sources).flatMap(([relativeFile, source]) =>
    [...findFixedScssTokenUses(relativeFile, source)].map(use => ({
      file: relativeFile,
      line: use.line,
      token: use.token,
      variable: use.scssToken,
      rule: 'fixed-scss-token-default',
      message: 'Replace the fixed SCSS default with a canonical CSS design token'
    }))
  )
}

export function findPageStaticFallbacks(sources) {
  return Object.entries(sources).flatMap(([relativeFile, source]) => {
    if (!relativeFile.startsWith('src/pages/') || relativeFile === 'src/App.vue') return []
    return [...source.matchAll(PAGE_STATIC_FALLBACK_PATTERN)].map(match => ({
      file: relativeFile,
      line: lineAt(source, match.index),
      token: match[1],
      rule: 'page-static-fallback',
      message: 'Remove the page-level fallback and consume the canonical token directly'
    }))
  })
}

function lineAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length
}

function* findTokenUses(source) {
  for (const match of source.matchAll(/var\(\s*(--[a-zA-Z][a-zA-Z0-9-]*)/g)) {
    yield { token: match[1], index: match.index }
  }
}

function isRemainingPagePath(relativeFile) {
  const sourcePath = relativeFile.startsWith('src/') ? relativeFile : `src/${relativeFile}`

  return sourcePath.startsWith('src/pages/') &&
    !EXCLUDED_PAGE_STYLE_PATHS.some(excluded => sourcePath.startsWith(excluded) || sourcePath === excluded)
}

/** Detect page-scoped style declarations that still compile directly from SCSS defaults. */
export function findUnmigratedPageStyles(sources) {
  return Object.entries(sources).flatMap(([relativeFile, source]) => {
    if (!isRemainingPagePath(relativeFile)) return []

    const findings = []
    for (const style of extractStyleBlocks(source)) {
      const startLine = lineAt(source, style.offset)

      for (const [blockIndex, sourceLine] of style.source.split(/\r?\n/).entries()) {
        const declaration = sourceLine.replace(/#\{[^}]*\}/g, '')

        if (PAGE_STYLE_SCSS_DECLARATION_PATTERN.test(declaration)) {
          findings.push({
            file: relativeFile,
            line: startLine + blockIndex,
            rule: 'unmigrated-page-style',
            message: 'Use a registered global token instead of a direct SCSS default'
          })
        }
      }
    }
    return findings
  })
}

export function scanDesignTokens(
  sources,
  { globalTokens = new Set(), derivedSource = '' } = {}
) {
  const tokens = globalTokens.size ? globalTokens : parseThemeTokens(derivedSource)
  const findings = []

  for (const [relativeFile, source] of Object.entries(sources)) {
    const localTokens = findLocalTokenDefinitions(source)
    for (const use of findTokenUses(source)) {
      if (tokens.has(use.token) || localTokens.has(use.token)) continue
      findings.push({
        file: relativeFile,
        line: lineAt(source, use.index),
        token: use.token,
        rule: 'undeclared-css-variable',
        message: `Use canonical ${use.token} or register it in theme-derive.ts`
      })
    }
  }

  return findings
}

export function findFixedScssDefaults(sources) {
  const findings = []

  for (const [relativeFile, source] of Object.entries(sources)) {
    if (!DESIGN_TOKEN_PAGE_PATHS.includes(relativeFile)) continue

    for (const style of extractStyleBlocks(source)) {
      const seen = new Set()
      for (const pattern of FIXED_SCSS_DEFAULT_PATTERNS) {
        const scopedPattern = new RegExp(pattern.source, pattern.flags)
        for (const match of style.source.matchAll(scopedPattern)) {
          const index = style.offset + match.index
          const key = `${match[0]}:${index}`
          if (seen.has(key)) continue
          seen.add(key)
          findings.push({
            file: relativeFile,
            line: lineAt(source, index),
            token: match[0],
            rule: 'fixed-scss-default',
            message: `Replace ${match[0]} with a canonical CSS design token`,
          })
        }
      }
    }
  }

  return findings.sort((left, right) =>
    left.file.localeCompare(right.file) || left.line - right.line || left.token.localeCompare(right.token)
  )
}

export function findCriticalFallbackGaps(source) {
  const findings = []

  for (const token of CRITICAL_ROOT_FALLBACKS) {
    for (const match of source.matchAll(
      new RegExp(`var\\(\\s*${escapeRegExp(token)}\\s*\\)`, 'g')
    )) {
      findings.push({ line: lineAt(source, match.index), token })
    }
  }
  return findings
}

function findCategoryGaps(tokens) {
  return Object.entries(REQUIRED_TOKEN_CATEGORIES).flatMap(([category, expectedTokens]) =>
    expectedTokens
      .filter(token => !tokens.has(token))
      .map(token => ({
        file: THEME_SOURCE_RELATIVE_PATH,
        line: 0,
        token,
        rule: 'missing-required-token',
        message: `Add ${token} to the ${category} token category`
      }))
  )
}

function runCheck() {
  const sources = loadProjectSources()
  const tokens = parseThemeTokens(readFileSync(derivePath, 'utf8'))
  const findings = [
    ...findCategoryGaps(tokens),
    ...scanDesignTokens(sources, { globalTokens: tokens }),
    ...findFixedScssDefaults(sources),
    ...findUnmigratedPageStyles(sources),
    ...findFixedTokenDefaults(sources),
    ...findPageStaticFallbacks(sources),
    ...Object.entries(sources)
      .filter(([relativeFile]) => relativeFile === 'src/App.vue')
      .flatMap(([relativeFile, source]) =>
        findCriticalFallbackGaps(source).map(gap => ({
          file: relativeFile,
          ...gap,
          rule: 'missing-critical-fallback',
          message: `Add a static fallback for ${gap.token}`
        }))
      )
  ]

  for (const finding of findings) {
    const line = finding.line ? `:${finding.line}` : ''
    console.error(`${finding.file}${line}: ${finding.rule} — ${finding.message}`)
  }
  return findings.length
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  process.exitCode = runCheck() === 0 ? 0 : 1
}
