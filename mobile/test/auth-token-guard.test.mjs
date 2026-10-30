import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  AUTH_SOURCE_FILES,
  findMissingTokenDocumentation,
  scanAuthTokens
} from '../scripts/check-auth-tokens.mjs'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const repoDir = path.resolve(testDir, '..', '..')
const mobileDir = path.resolve(testDir, '..')

test('reports raw colors and undocumented one-off parameters', () => {
  const findings = scanAuthTokens('src/pages/mine/example.vue', [
    ':color="#123456"',
    'font-weight: 600;',
    'margin-bottom: 8rpx;',
    'animation-delay: 50ms;'
  ])

  assert.deepEqual(
    findings.map(finding => finding.rule),
    ['raw-color', 'one-off-typography', 'one-off-size', 'one-off-motion']
  )
  assert.deepEqual(findings.map(finding => finding.line), [1, 2, 3, 4])
})

test('keeps authentication sources on documented tokens', () => {
  const findings = AUTH_SOURCE_FILES.flatMap(relativePath =>
    scanAuthTokens(
      relativePath,
      readFileSync(path.join(mobileDir, relativePath), 'utf8').split(/\r?\n/)
    )
  )

  assert.deepEqual(findings, [])
})

test('requires the token document to list every guarded auth token', () => {
  const doc = readFileSync(path.join(repoDir, 'docs/design/authentication-tokens.md'), 'utf8')

  assert.deepEqual(findMissingTokenDocumentation(doc), [])
})

test('guards auth navigation entries and shared auth component sources', async () => {
  const tokenScript = await import('../scripts/check-auth-tokens.mjs')

  for (const relativePath of [
    'src/components/auth/AuthStatusPanel.vue',
    'src/components/auth/AuthFormField.vue',
    'src/components/auth/AuthStudentCardUpload.vue'
  ]) {
    assert.equal(AUTH_SOURCE_FILES.includes(relativePath), true)
  }

  const pagesJson = JSON.parse(readFileSync(path.join(mobileDir, 'src/pages.json'), 'utf8'))
  assert.deepEqual(tokenScript.findAuthPageStyleFindings(pagesJson), [])
})

test('rejects an undocumented auth navigation color drift', async () => {
  const tokenScript = await import('../scripts/check-auth-tokens.mjs')
  const findings = tokenScript.findAuthPageStyleFindings({
    pages: [
      {
        path: 'pages/mine/auth-center',
        style: { navigationBarBackgroundColor: '#123456', navigationBarTextStyle: 'white' }
      }
    ]
  })

  assert.deepEqual(
    findings.filter(finding => finding.rule === 'raw-color'),
    [{ file: 'src/pages.json', rule: 'raw-color', message: 'Use documented #8EC5E8', line: 0 }]
  )
})
