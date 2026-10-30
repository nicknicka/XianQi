import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { compileStyle } from '@vue/compiler-sfc'

const mobileDir = path.resolve(import.meta.dirname, '..')

function compileStyleFile(relativeFile) {
  const source = readFileSync(path.join(mobileDir, relativeFile), 'utf8')
  const result = compileStyle({
    filename: path.join(mobileDir, relativeFile),
    id: 'shared-tokens',
    preprocessLang: relativeFile.endsWith('.scss') ? 'scss' : undefined,
    source,
  })

  assert.deepEqual(result.errors, [], `${relativeFile} must compile`)
  return result.code
}

test('global text and spacing utilities consume runtime tokens', () => {
  const css = compileStyleFile('src/styles/common.scss')

  assert.match(css, /\.text-xs\s*\{[^}]*font-size:\s*var\(--font-size-xs\);/)
  assert.match(css, /\.text-sm\s*\{[^}]*font-size:\s*var\(--font-size-sm\);/)
  assert.match(css, /\.p-md\s*\{[^}]*padding:\s*var\(--spacing-md\);/)
  assert.match(css, /\.mt-lg\s*\{[^}]*margin-top:\s*var\(--spacing-lg\);/)
  assert.match(css, /\.text-primary\s*\{[^}]*color:\s*var\(--primary-color\);/)
  assert.match(css, /\.text-secondary-color\s*\{[^}]*color:\s*var\(--text-color-secondary\);/)
  assert.doesNotMatch(css, /#8EC5E8|#7A7A7A|14px|16px/)
})

test('shared tabs expose active states through runtime primary token', () => {
  const source = readFileSync(path.join(mobileDir, 'src/components/tabs/tabs.vue'), 'utf8')
  const styleSource = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1]
  assert.ok(styleSource)
  const compiled = compileStyle({
    filename: path.join(mobileDir, 'src/components/tabs/tabs.vue'),
    id: 'shared-tokens',
    scoped: true,
    preprocessLang: 'scss',
    source: styleSource.replace(/^@use '@\/styles\/variables\.scss' as \*;\s*/m, ''),
  })
  assert.deepEqual(compiled.errors, [], 'shared tabs style must compile')
  const css = compiled.code

  assert.match(css, /\.is-active[^{]*\{[^}]*color:\s*var\(--primary-color\);/)
  assert.match(css, /\.is-active[^{]*\{[^}]*background:\s*var\(--primary-color\);/)
  assert.doesNotMatch(css, /\$primary-color|#8EC5E8/)
})
