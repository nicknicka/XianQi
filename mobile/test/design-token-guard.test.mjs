import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  DESIGN_TOKEN_PAGE_PATHS,
  REQUIRED_TOKEN_CATEGORIES,
  findCriticalFallbackGaps,
  findFixedScssDefaults,
  findFixedTokenDefaults,
  findPageStaticFallbacks,
  findUnmigratedPageStyles,
  parseThemeTokens,
  scanDesignTokens
} from '../scripts/check-design-tokens.mjs'

const mobileDir = path.resolve(import.meta.dirname, '..')
const deriveSource = readFileSync(
  path.join(mobileDir, 'src/utils/theme/theme-derive.ts'),
  'utf8'
)

test('rejects undeclared variables and compatibility aliases', () => {
  const findings = scanDesignTokens({
    'src/example.vue': [
      '.example {',
      '  color: var(--undeclared-color);',
      '  background: var(--error-color-alpha-10);',
      '  border-radius: var(--radius-lg);',
      '  border-color: var(--success-color-faded);',
      '}'
    ].join('\n')
  }, { globalTokens: parseThemeTokens(deriveSource) })

  assert.deepEqual(findings.map(finding => finding.rule), Array(4).fill('undeclared-css-variable'))
  assert.deepEqual(findings.map(finding => finding.line).sort(), [2, 3, 4, 5])
})

test('accepts canonical generated tokens and component-local variables', () => {
  const globalTokens = parseThemeTokens(deriveSource)
  const findings = scanDesignTokens({
    'src/example.vue': [
      '.example {',
      '  color: var(--danger-color);',
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
    'src/pages/market/detail.vue',
    'src/pages/market/edit.vue',
    'src/pages/market/evaluation-list.vue',
    'src/pages/market/list.vue',
    'src/pages/market/publish-with-sidebar.vue',
    'src/pages/market/publish.vue',
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

test('documents canonical names and extension rules without compatibility aliases', () => {
  const contractSource = readFileSync(
    path.join(mobileDir, '..', 'docs/design/global-design-tokens.md'),
    'utf8'
  )

  for (const alias of [
    '--error-color',
    '--primary-alpha-10',
    '--radius-lg',
    '--radius-xl',
    '--radius-pill',
    '--success-color-faded',
    '--warning-color-faded',
    '--danger-color-faded',
  ]) {
    assert.doesNotMatch(contractSource, new RegExp(alias.replaceAll('-', '\\-')))
  }
  assert.match(contractSource, /## 扩展规则/)
  for (const token of ['--danger-color', '--primary-color-alpha-10', '--border-radius-lg', '--success-color-bg']) {
    assert.match(contractSource, new RegExp(token.replaceAll('-', '\\-')))
  }
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

test('rejects page-level static fallbacks without rejecting critical App fallbacks', () => {
  const findings = findPageStaticFallbacks({
    'src/App.vue': 'page { background: var(--bg-color-page, #F0F8FF); }',
    'src/pages/example.vue': 'page { color: var(--text-color-primary, #2D2D2D); }'
  })

  assert.deepEqual(findings, [{
    file: 'src/pages/example.vue',
    line: 1,
    token: '--text-color-primary',
    rule: 'page-static-fallback',
    message: 'Remove the page-level fallback and consume the canonical token directly'
  }])
})

test('market token coverage includes every market source page', () => {
  const sources = Object.fromEntries(
    DESIGN_TOKEN_PAGE_PATHS
      .filter(file => file.startsWith('src/pages/market/'))
      .map(page => [page, readFileSync(path.join(mobileDir, page), 'utf8')])
  )

  assert.equal(Object.keys(sources).length, 6)
  assert.deepEqual(findFixedScssDefaults(sources), [])
})

test('removes the review-listed page one-off values', () => {
  const cases = [
    ['src/pages/user/home.vue', [/#333/, /var\(--box-shadow-base,/, /var\(--font-size-sm,/, /var\(--text-color-primary,/, /transition:\s*all\s*0\.25s/]],
    ['src/pages/index/index.vue', [/#ff7875/i]],
    ['src/pages/mine/change-password.vue', [/#FF5722/]],
    ['src/pages/mine/credit-detail.vue', [/var\(--border-color-light,/]],
    ['src/pages/mine/history.vue', [/rgba\(255,\s*138,\s*138/]],
    ['src/pages/mine/index.vue', [/#ff6b7a/i]],
    ['src/pages/login/index.vue', [/#d1d5db/, /#e8e8e8/, /#07c160/, /#06ae56/, /#12b7f5/, /#0099ff/]],
    ['src/components/chat-input/chat-input.vue', [/transition:\s*background\s*0\.2s/, /transition:\s*all\s*0\.2s/]]
  ]

  const violations = cases.flatMap(([file, patterns]) =>
    patterns
      .filter(pattern => pattern.test(readFileSync(path.join(mobileDir, file), 'utf8')))
      .map(pattern => `${file}: ${pattern}`)
  )
  assert.deepEqual(violations, [])
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
    { file: 'src/styles/common.scss', line: 1, token: '$primary-color' },
    { file: 'src/components/example/example.vue', line: 3, token: '$primary-color' }
  ])
  assert.deepEqual(findings.map(({ rule }) => rule), [
    'fixed-scss-token-default',
    'fixed-scss-token-default'
  ])
})
