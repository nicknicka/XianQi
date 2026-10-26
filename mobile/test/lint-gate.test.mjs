import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const mobileRoot = path.resolve(import.meta.dirname, '..')
const repoRoot = path.resolve(mobileRoot, '..')
const eslint = path.join(mobileRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'eslint.cmd' : 'eslint')

async function runEslint(files, expectFailure = false) {
  try {
    const result = await execFileAsync(eslint, ['--format=json', ...files], {
      cwd: mobileRoot,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    })
    if (expectFailure) assert.fail('Expected lint to fail, but it succeeded')
    return result
  } catch (error) {
    if (!expectFailure) throw error
    return error
  }
}

test('lint commands are separate read-only and fix entry points', async () => {
  const packageJson = JSON.parse(await readFile(path.join(mobileRoot, 'package.json'), 'utf8'))

  assert.equal(packageJson.scripts.lint, 'eslint .')
  assert.equal(packageJson.scripts['lint:fix'], 'eslint . --fix')
})

test('ESLint 9 flat config replaces the legacy config', async () => {
  const packageJson = JSON.parse(await readFile(path.join(mobileRoot, 'package.json'), 'utf8'))
  const eslintVersion = packageJson.devDependencies.eslint

  assert.match(eslintVersion, /^(\^|~|)?9\./)
  await assert.rejects(readFile(path.join(mobileRoot, '.eslintrc.js'), 'utf8'))
  const flatConfig = await readFile(path.join(mobileRoot, 'eslint.config.mjs'), 'utf8')
  assert.match(flatConfig, /ignores/)
})

test('read-only lint covers JavaScript, TypeScript, and Vue files', async () => {
  const probeDir = await mkdtemp(path.join(mobileRoot, '.lint-gate-'))
  try {
    const files = {
      'probe.js': 'export const probeValue = 1\n',
      'probe.ts': 'export const probeValue: number = 1\n',
      'probe.vue':
        '<template><div>{{ probeValue }}</div></template>\n<script setup lang="ts">const probeValue = 1</script>\n'
    }

    for (const [file, content] of Object.entries(files)) {
      await writeFile(path.join(probeDir, file), content)
    }

    const relativeFiles = Object.keys(files).map(file => path.join(probeDir, file))
    const { stdout } = await runEslint(relativeFiles)
    const results = JSON.parse(stdout)

    assert.equal(results.length, 3)
    assert.deepEqual(
      results.map(result => path.basename(result.filePath)).sort(),
      ['probe.js', 'probe.ts', 'probe.vue']
    )
    assert.equal(results.every(result => result.errorCount === 0 && result.warningCount === 0), true)
  } finally {
    await rm(probeDir, { recursive: true, force: true })
  }
})

test('read-only lint fails on real violations in each supported file type', async () => {
  const probeDir = await mkdtemp(path.join(mobileRoot, '.lint-gate-invalid-'))
  try {
    const files = {
      'probe.js': 'function probe() { debugger }\n',
      'probe.ts': 'function probe() { debugger }\n',
      'probe.vue':
        '<template><div>probe</div></template>\n<script setup lang="ts">function probe() { debugger }</script>\n'
    }

    for (const [file, content] of Object.entries(files)) {
      await writeFile(path.join(probeDir, file), content)
    }

    const relativeFiles = Object.keys(files).map(file => path.join(probeDir, file))
    const error = await runEslint(relativeFiles, true)
    assert.notEqual(error.code, 0)

    const results = JSON.parse(error.stdout)
    assert.equal(results.length, 3)
    for (const result of results) {
      assert.equal(result.errorCount > 0, true, `${result.filePath} should report an error`)
    }
  } finally {
    await rm(probeDir, { recursive: true, force: true })
  }
})

test('mobile CI runs read-only lint before building H5', async () => {
  const ci = await readFile(path.join(repoRoot, '.github', 'workflows', 'ci.yml'), 'utf8')
  const jobStart = ci.indexOf('mobile-build:')
  const nextJob = ci.indexOf('\n  # ----------', jobStart + 1)
  const mobileJob = ci.slice(jobStart, nextJob === -1 ? undefined : nextJob)

  const lintPosition = mobileJob.indexOf('npm run lint')
  const buildPosition = mobileJob.indexOf('npm run build:h5')

  assert.notEqual(lintPosition, -1)
  assert.ok(lintPosition < buildPosition)
  assert.doesNotMatch(mobileJob.slice(lintPosition, buildPosition), /--fix|lint:fix/)
})
