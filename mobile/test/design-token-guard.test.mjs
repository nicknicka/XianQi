import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  COMPATIBLE_TOKEN_ALIASES,
  DESIGN_TOKEN_PAGE_PATHS,
  REQUIRED_TOKEN_CATEGORIES,
  findCriticalFallbackGaps,
  findFixedScssDefaults,
  findFixedTokenDefaults,
  findUnmigratedPageStyles,
  findRuntimeAliasGaps,
  parseThemeTokens,
  scanDesignTokens
} from '../scripts/check-design-tokens.mjs'

const mobileDir = path.resolve(import.meta.dirname, '..')
const deriveSource = readFileSync(
  path.join(mobileDir, 'src/utils/theme/theme-derive.ts'),
  'utf8'
)

test('rejects undeclared variables and unregistered compatible aliases', () => {
  const findings = scanDesignTokens({
    'src/example.vue': [
      '.example {',
      '  color: var(--undeclared-color);',
      '  background: var(--error-color-alpha-15);',
      '}'
    ].join('\n')
  }, { globalTokens: parseThemeTokens(deriveSource) })

  assert.deepEqual(findings.map(finding => finding.rule).sort(), [
    'undeclared-css-variable',
    'unregistered-compatible-alias'
  ])
  assert.deepEqual(findings.map(finding => finding.line).sort(), [2, 3])
})

test('accepts registered aliases, generated tokens, and component-local variables', () => {
  const globalTokens = parseThemeTokens(deriveSource)
  const findings = scanDesignTokens({
    'src/example.vue': [
      '.example {',
      '  color: var(--error-color);',
      '  background: var(--primary-color-alpha-10);',
      '  --local-accent: var(--text-color-secondary);',
      '  border-color: var(--local-accent);',
      '}'
    ].join('\n')
  }, { globalTokens })

  assert.deepEqual(findings, [])
})

test('rejects fixed SCSS defaults in the scoped market and publish pages', () => {
  const findings = findFixedScssDefaults({
    'src/pages/market/edit.vue': [
      '<style lang="scss" scoped>',
      '.example {',
      '  color: $text-color-primary;',
      '  padding: $spacing-md;',
      '  font-size: $font-size-base;',
      '  border-radius: $border-radius-sm;',
      '}',
      '</style>'
    ].join('\n'),
    'src/pages/publish/index.vue': [
      '<style lang="scss" scoped>',
      '.example { color: #333; }'
    ].join('\n')
  })

  assert.deepEqual(findings.map(finding => [finding.file, finding.rule, finding.token]), [
    ['src/pages/market/edit.vue', 'fixed-scss-default', '$text-color-primary'],
    ['src/pages/market/edit.vue', 'fixed-scss-default', '$spacing-md'],
    ['src/pages/market/edit.vue', 'fixed-scss-default', '$font-size-base'],
    ['src/pages/market/edit.vue', 'fixed-scss-default', '$border-radius-sm'],
  ])
})

test('does not reject scoped page content outside its style block', () => {
  const findings = findFixedScssDefaults({
    'src/pages/market/list.vue': [
      '<script setup lang="ts">',
      'const $spacing-md = "not scss"',
      '</script>',
      '<style lang="scss" scoped>',
      '.example { gap: var(--spacing-md); }',
      '</style>'
    ].join('\n')
  })

  assert.deepEqual(findings, [])
})

test('publish center avoids fixed critical style defaults', () => {
  const source = readFileSync(path.join(mobileDir, 'src/pages/publish/index.vue'), 'utf8')

  for (const pattern of [
    /#(?:333333|AAAAAA|4CAF50|66BB6A|f8f8f8)/i,
    /(?:font-size|padding|border-radius|box-shadow|transition):(?!\s*var\()/,
  ]) {
    assert.doesNotMatch(source, pattern)
  }
})

test('keeps market and publish pages on canonical design tokens', () => {
  assert.deepEqual(DESIGN_TOKEN_PAGE_PATHS, [
    'src/pages/market/list.vue',
    'src/pages/market/publish.vue',
    'src/pages/market/edit.vue',
    'src/pages/publish/index.vue'
  ])

  const sources = Object.fromEntries(
    DESIGN_TOKEN_PAGE_PATHS.map(page => [
      page,
      readFileSync(path.join(mobileDir, page), 'utf8')
    ])
  )

  assert.deepEqual(findFixedScssDefaults(sources), [])
})

test('keeps every registered compatible alias mapped by the runtime source', () => {
  assert.equal(Object.keys(COMPATIBLE_TOKEN_ALIASES).length > 0, true)
  assert.deepEqual(findRuntimeAliasGaps(deriveSource), [])
})

test('covers every required global design token category', () => {
  const tokens = parseThemeTokens(deriveSource)

  for (const [category, expectedTokens] of Object.entries(REQUIRED_TOKEN_CATEGORIES)) {
    assert.equal(expectedTokens.length > 0, true, `${category} must be specified`)
    for (const token of expectedTokens) {
      assert.equal(tokens.has(token), true, `${category} is missing ${token}`)
    }
  }
})

test('requires static fallbacks for critical root tokens', () => {
  const gaps = findCriticalFallbackGaps(
    'page { background: var(--bg-color-page); color: var(--text-color-primary, #2D2D2D); font-size: var(--font-base, 14px); }'
  )

  assert.deepEqual(gaps, [{ line: 1, token: '--bg-color-page' }])
})

test('remaining business pages reject direct SCSS style defaults', () => {
  const findings = findUnmigratedPageStyles({
    'src/pages/mine/index.vue': [
      '<template><text class="instance">$vm</text></template>',
      '<style lang="scss" scoped>',
      '.mine-page {',
      '  color: $text-color-primary;',
      '}',
      '</style>'
    ].join('\n')
  })

  assert.deepEqual(findings, [{
    file: 'src/pages/mine/index.vue',
    line: 4,
    rule: 'unmigrated-page-style',
    message: 'Use a registered global token instead of a direct SCSS default'
  }])
})

test('page style guard ignores non-style SCSS usage and excluded pages', () => {
  const findings = findUnmigratedPageStyles({
    'src/pages/market/list.vue': '<style lang="scss">.market { color: $primary-color; }</style>',
    'src/pages/mine/auth-center.vue': '<style lang="scss">.auth { color: $primary-color; }</style>',
    'src/pages/message/chat.vue': 'const page = event.$vm',
    'src/pages/user/home.vue': [
      '<style lang="scss" scoped>',
      '@for $i from 1 through 20 {',
      '  &:nth-child(#{$i}) { animation-delay: 0.05s; }',
      '}'
    ].join('\n')
  })

  assert.deepEqual(findings, [])
})

test('mobile lint runs the design token guard before the existing lint', () => {
  const packageJson = JSON.parse(readFileSync(path.join(mobileDir, 'package.json'), 'utf8'))
  assert.equal(packageJson.scripts.prelint, 'node scripts/check-design-tokens.mjs')

  const ci = readFileSync(path.join(mobileDir, '..', '.github/workflows/ci.yml'), 'utf8')
  assert.match(ci, /- name: Lint\n\s+run: \|\n\s+cd mobile\n\s+npm run lint/)
})

test('rejects fixed SCSS token defaults in global and shared styles', () => {
  const findings = findFixedTokenDefaults({
    'src/styles/variables.scss': '$primary-color: #8EC5E8;',
    'src/styles/common.scss': '.example { color: var(--primary-color, $primary-color); }',
    'src/components/example/example.vue': [
      '<style lang="scss">',
      '.example {',
      '  color: $primary-color;',
      '}',
      '</style>'
    ].join('\n')
  })

  assert.deepEqual(findings.map(({ file, line, token }) => ({ file, line, token })), [
    { file: 'src/styles/common.scss', line: 1, token: '--primary-color' },
    { file: 'src/components/example/example.vue', line: 3, token: '--primary-color' }
  ])
  assert.deepEqual(findings.map(({ rule }) => rule), [
    'fixed-scss-token-default',
    'fixed-scss-token-default'
  ])
})
