import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const mobileDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const AUTH_SOURCE_FILES = [
  'src/pages/mine/auth-center.vue',
  'src/pages/mine/real-name-auth.vue',
  'src/pages/mine/student-auth.vue',
  'src/utils/auth/auth-state.ts',
  'src/utils/auth/auth-tokens.ts'
]

const TOKEN_DOC_PATH = '../docs/design/authentication-tokens.md'
const GUARDED_AUTH_TOKENS = [
  '--auth-divider-width',
  '--auth-font-weight-semibold',
  'AUTH_ICON_SIZES.benefit',
  'AUTH_ICON_SIZES.card',
  'AUTH_ICON_SIZES.inline',
  'AUTH_ICON_SIZES.section',
  'AUTH_ICON_SIZES.status',
  'AUTH_ICON_SIZES.upload',
  'AUTH_PAGE_ANIMATION_DELAY_MS',
  '--auth-page-min-height'
]

const RAW_COLOR_PATTERNS = [
  /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i,
  /\brgba?\(/i,
  /\bhsla?\(/i,
  /(?:\b(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*|:color=")(?:[^;'"{}]*(?:\b(?:black|white|red|green|blue|gray|grey|orange|purple|yellow|pink|brown|transparent|currentColor)\b))/i
]
const RAW_SIZE_PATTERN = /\b\d+(?:\.\d+)?(?:rpx|px|em|rem|vh|vw)\b/
const RAW_MOTION_PATTERNS = [
  /\b\d+(?:\.\d+)?m?s\b/,
  /setTimeout\s*\(\s*[\s\S]*?,\s*\d+\s*\)/,
  /^\s*\},\s*\d+\s*\)\s*$/
]

function makeFinding(file, rule, message, line) {
  return { file, rule, message, line }
}

export function scanAuthTokens(relativeFile, lines) {
  return lines.flatMap((sourceLine, index) => {
    const line = index + 1
    const findings = []

    for (const pattern of RAW_COLOR_PATTERNS) {
      if (pattern.test(sourceLine)) {
        findings.push(
          makeFinding(relativeFile, 'raw-color', 'Use semantic CSS variables or theme hook colors', line)
        )
        break
      }
    }

    const fontWeight = sourceLine.match(/font-weight\s*:\s*([^;\n]+)/)
    if (fontWeight && !fontWeight[1].includes('var(')) {
      findings.push(
        makeFinding(relativeFile, 'one-off-typography', 'Use --auth-font-weight-semibold', line)
      )
    }

    if (/\b(?:size)\s*=\s*['"]?\d+['"]?/.test(sourceLine)) {
      findings.push(
        makeFinding(relativeFile, 'one-off-size', 'Use AUTH_ICON_SIZES', line)
      )
    } else if (RAW_SIZE_PATTERN.test(sourceLine)) {
      findings.push(
        makeFinding(relativeFile, 'one-off-size', 'Use documented auth CSS token', line)
      )
    }

    if (RAW_MOTION_PATTERNS.some(pattern => pattern.test(sourceLine))) {
      findings.push(
        makeFinding(relativeFile, 'one-off-motion', 'Use documented motion token', line)
      )
    }

    return findings
  })
}

export function findMissingTokenDocumentation(documentation) {
  return GUARDED_AUTH_TOKENS.filter(token => !documentation.includes(token))
}

function checkAuthTokens() {
  const findings = AUTH_SOURCE_FILES.flatMap(relativeFile =>
    scanAuthTokens(relativeFile, readFileSync(path.join(mobileDir, relativeFile), 'utf8').split(/\r?\n/))
  )
  const doc = readFileSync(path.join(mobileDir, TOKEN_DOC_PATH), 'utf8')
  findings.push(
    ...findMissingTokenDocumentation(doc).map(token =>
      makeFinding(TOKEN_DOC_PATH, 'missing-token-doc', `Document ${token}`, 0)
    )
  )

  for (const finding of findings) {
    const line = finding.line ? `:${finding.line}` : ''
    console.error(`${finding.file}${line}: ${finding.rule} — ${finding.message}`)
  }

  return findings.length
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  process.exitCode = checkAuthTokens() === 0 ? 0 : 1
}
