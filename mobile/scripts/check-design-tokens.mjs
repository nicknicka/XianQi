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

/** Legacy names kept working through canonical runtime tokens. */
export const COMPATIBLE_TOKEN_ALIASES = {
  '--error-color': '--danger-color',
  '--error-color-alpha-10': '--danger-color-alpha-10',
  '--primary-alpha-10': '--primary-color-alpha-10',
  '--radius-lg': '--border-radius-lg',
  '--radius-xl': '--border-radius-xl',
  '--radius-pill': '--border-radius-pill',
  '--success-color-faded': '--success-color-bg',
  '--warning-color-faded': '--warning-color-bg',
  '--danger-color-faded': '--danger-color-bg'
}

const UNREGISTERED_ALIAS_PATTERNS = [
  /^--error-color(?:-alpha-\d+)?$/,
  /^--primary-alpha-\d+$/,
  /^--radius-(?:sm|base|md|lg|xl|round|pill)$/,
  /^--(?:success|warning|danger)-color-faded$/
]

const CRITICAL_ROOT_FALLBACKS = ['--bg-color-page', '--text-color-primary', '--font-base']
const THEME_SOURCE_RELATIVE_PATH = 'src/utils/theme/theme-derive.ts'
const GLOBAL_SHARED_STYLE_PATTERN = /^(?:src\/styles|src\/components)\//
const LEGACY_SCSS_DECLARATIONS_PATH = 'src/styles/variables.scss'

/** SCSS defaults whose behavior is owned by a runtime global token. */
export const FIXED_SCSS_TOKEN_ALIASES = {
  '$primary-color': '--primary-color',
  '$primary-color-light': '--primary-color-light',
  '$primary-color-dark': '--primary-color-dark',
  '$secondary-color': '--secondary-color',
  '$accent-color': '--accent-color',
  '$success-color': '--success-color',
  '$warning-color': '--warning-color',
  '$error-color': '--danger-color',
  '$info-color': '--info-color',
  '$text-color-primary': '--text-color-primary',
  '$text-color-secondary': '--text-color-secondary',
  '$text-color-tertiary': '--text-color-tertiary',
  '$text-color-placeholder': '--text-color-placeholder',
  '$text-color-white': '--text-color-inverse',
  '$bg-color-page': '--bg-color-page',
  '$bg-color-card': '--bg-color-card',
  '$bg-color-warm': '--bg-color-warm',
  '$bg-color-disabled': '--bg-color-disabled',
  '$border-color-light': '--border-color-light',
  '$border-color-base': '--border-color-base',
  '$border-color-dark': '--border-color-dark',
  '$spacing-xs': '--spacing-xs',
  '$spacing-sm': '--spacing-sm',
  '$spacing-md': '--spacing-md',
  '$spacing-lg': '--spacing-lg',
  '$spacing-xl': '--spacing-xl',
  '$font-size-xs': '--font-size-xs',
  '$font-size-sm': '--font-size-sm',
  '$font-size-base': '--font-size-base',
  '$font-size-lg': '--font-size-lg',
  '$font-size-xl': '--font-size-xl',
  '$font-size-xxl': '--font-size-xxl',
  '$border-radius-sm': '--border-radius-sm',
  '$border-radius-base': '--border-radius-base',
  '$border-radius-md': '--border-radius-base',
  '$border-radius-lg': '--border-radius-lg',
  '$border-radius-xl': '--border-radius-xl',
  '$border-radius-round': '--border-radius-round',
  '$border-radius-pill': '--border-radius-pill',
  '$box-shadow-light': '--box-shadow-xs',
  '$box-shadow-base': '--box-shadow-base',
  '$box-shadow-dark': '--box-shadow-primary',
  '$box-shadow-primary': '--box-shadow-primary',
  '$box-shadow-card': '--box-shadow-card',
  '$clay-shadow-card': '--clay-shadow-card',
  '$clay-shadow-card-pressed': '--clay-shadow-card-pressed',
  '$clay-shadow-btn': '--clay-shadow-btn',
  '$clay-shadow-input': '--clay-shadow-input',
  '$clay-shadow-tag': '--clay-shadow-tag',
  '$transition-base': '--motion-duration-base',
  '$transition-fast': '--motion-duration-fast',
  '$transition-bounce': '--motion-duration-base',
  '$z-index-dropdown': '--z-dropdown',
  '$z-index-sticky': '--z-sticky',
  '$z-index-fixed': '--z-fixed',
  '$z-index-modal-backdrop': '--z-modal-backdrop',
  '$z-index-modal': '--z-modal',
  '$z-index-popover': '--z-popover',
  '$z-index-tooltip': '--z-tooltip'
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

function* extractVueStyleBlocks(source) {
  const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/g
  for (const match of source.matchAll(stylePattern)) {
    const beforeStyle = source.slice(0, match.index)
    yield {
      source: match[1],
      lineOffset: beforeStyle.split(/\r?\n/).length - 1
    }
  }
}

function* findFixedScssTokenUses(relativeFile, source) {
  if (!GLOBAL_SHARED_STYLE_PATTERN.test(relativeFile)) return
  if (relativeFile === LEGACY_SCSS_DECLARATIONS_PATH) return

  const styleBlocks = relativeFile.endsWith('.vue')
    ? [...extractVueStyleBlocks(source)]
    : [{ source, lineOffset: 0 }]

  for (const { source: styleSource, lineOffset } of styleBlocks) {
    for (const [scssToken, cssToken] of Object.entries(FIXED_SCSS_TOKEN_ALIASES)) {
      for (const match of styleSource.matchAll(
        new RegExp(`(?<![\\w-])${escapeRegExp(scssToken)}(?![\\w-])`, 'g')
      )) {
        yield {
          token: cssToken,
          scssToken,
          line: lineOffset + lineAt(styleSource, match.index)
        }
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
      message: `Use ${use.token} instead of the fixed ${use.scssToken} default`
    }))
  )
}

function lineAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length
}

function* findTokenUses(source) {
  for (const match of source.matchAll(/var\(\s*(--[a-zA-Z][a-zA-Z0-9-]*)/g)) {
    yield { token: match[1], index: match.index }
  }
}

function classifyUndeclaredToken(token) {
  if (UNREGISTERED_ALIAS_PATTERNS.some(pattern => pattern.test(token))) {
    return 'unregistered-compatible-alias'
  }
  return 'undeclared-css-variable'
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
        rule: classifyUndeclaredToken(use.token),
        message: `Register ${use.token} or map it to a canonical design token`
      })
    }
  }

  return findings
}

export function findRuntimeAliasGaps(deriveSource) {
  return Object.entries(COMPATIBLE_TOKEN_ALIASES)
    .filter(([alias, canonical]) => {
      const aliasPattern = new RegExp(
        `vars\\['${escapeRegExp(alias)}'\\]\\s*=\\s*vars\\['${escapeRegExp(canonical)}'\\]`
      )
      return !aliasPattern.test(deriveSource)
    })
    .map(([alias, canonical]) => ({
      file: THEME_SOURCE_RELATIVE_PATH,
      line: 0,
      token: alias,
      rule: 'missing-runtime-alias',
      message: `Map ${alias} to ${canonical} in theme-derive.ts`
    }))
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
  const deriveSource = readFileSync(derivePath, 'utf8')
  const tokens = parseThemeTokens(deriveSource)
  const findings = [
    ...findCategoryGaps(tokens),
    ...findRuntimeAliasGaps(deriveSource),
    ...scanDesignTokens(sources, { globalTokens: tokens }),
    ...findFixedTokenDefaults(sources),
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
