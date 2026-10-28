import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-field-contract.py')

const JAVA_VO = `package com.xx.xianqijava.vo;

import lombok.Data;

@Data
public class WidgetVO {
    private String widgetId;
    private String title;
    private String createdAt;
}
`

const CONTROLLER = `package com.xx.xianqijava.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/widget")
public class WidgetController {
    @GetMapping("/{}")
    public Result<WidgetVO> detail(Long id) {
        return null;
    }
}
`

function fixture({ apiTs, vo = JAVA_VO, controller = CONTROLLER }) {
  const root = mkdtempSync(path.join(tmpdir(), 'field-contract-'))
  const javaDir = path.join(root, 'backend/src/main/java/com/xx/xianqijava')
  mkdirSync(path.join(javaDir, 'vo'), { recursive: true })
  mkdirSync(path.join(javaDir, 'controller'), { recursive: true })
  writeFileSync(path.join(javaDir, 'vo', 'WidgetVO.java'), vo)
  writeFileSync(path.join(javaDir, 'controller', 'WidgetController.java'), controller)
  const apiDir = path.join(root, 'mobile/src/api')
  mkdirSync(apiDir, { recursive: true })
  writeFileSync(path.join(apiDir, 'widget.ts'), apiTs)
  return root
}

function run(root) {
  return spawnSync('python3', [checker, root], { encoding: 'utf8' })
}

function withFixture(options, assertions) {
  const root = fixture(options)
  try {
    assertions(run(root), root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('passes when frontend fields all exist on the backend view object', () => {
  const apiTs = [
    "import { http } from '@/utils/request'",
    'export interface Widget {',
    '  widgetId: string',
    '  title: string',
    '}',
    'export function getWidget(id: string) {',
    "  return http.get<Widget>(`/widget/${id}`)",
    '}',
    ''
  ].join('\n')
  withFixture({ apiTs }, (result) => {
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Field contract guard OK/)
  })
})

test('fails when the frontend declares a field the backend never returns', () => {
  const apiTs = [
    "import { http } from '@/utils/request'",
    'export interface Widget {',
    '  widgetId: string',
    '  phantomField: string',
    '}',
    'export function getWidget(id: string) {',
    "  return http.get<Widget>(`/widget/${id}`)",
    '}',
    ''
  ].join('\n')
  withFixture({ apiTs }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /phantomField/)
  })
})

test('tolerates pagination envelope fields', () => {
  const apiTs = [
    "import { http } from '@/utils/request'",
    'export interface Widget {',
    '  widgetId: string',
    '  list: unknown[]',
    '  total: number',
    '}',
    'export function getWidget(id: string) {',
    "  return http.get<Widget>(`/widget/${id}`)",
    '}',
    ''
  ].join('\n')
  withFixture({ apiTs }, (result) => {
    assert.equal(result.status, 0, result.stderr)
  })
})

test('counts inherited fields (BaseEntity) as present', () => {
  const vo = `package com.xx.xianqijava.vo;

import lombok.Data;

@Data
public class WidgetVO extends BaseWidget {
    private String widgetId;
}
`
  const base = `package com.xx.xianqijava.vo;

import lombok.Data;

@Data
public class BaseWidget {
    private String createdAt;
}
`
  const root = mkdtempSync(path.join(tmpdir(), 'field-contract-'))
  try {
    const javaDir = path.join(root, 'backend/src/main/java/com/xx/xianqijava')
    mkdirSync(path.join(javaDir, 'vo'), { recursive: true })
    mkdirSync(path.join(javaDir, 'controller'), { recursive: true })
    writeFileSync(path.join(javaDir, 'vo', 'WidgetVO.java'), vo)
    writeFileSync(path.join(javaDir, 'vo', 'BaseWidget.java'), base)
    writeFileSync(path.join(javaDir, 'controller', 'WidgetController.java'), CONTROLLER)
    const apiDir = path.join(root, 'mobile/src/api')
    mkdirSync(apiDir, { recursive: true })
    writeFileSync(path.join(apiDir, 'widget.ts'), [
      "import { http } from '@/utils/request'",
      'export interface Widget {',
      '  widgetId: string',
      '  createdAt: string',
      '}',
      'export function getWidget(id: string) {',
      "  return http.get<Widget>(`/widget/${id}`)",
      '}',
      ''
    ].join('\n'))
    const result = run(root)
    assert.equal(result.status, 0,
      'createdAt comes from the base class and must not be reported:\n' + result.stderr)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('skips API modules that apply a field-mapping layer', () => {
  const apiTs = [
    "import { http } from '@/utils/request'",
    'export interface Widget {',
    '  widgetId: string',
    '  reshapedField: string',
    '}',
    'function normalizeWidget(data: any): Widget {',
    '  return { ...data, reshapedField: data.title }',
    '}',
    'export function getWidget(id: string) {',
    "  return http.get<Widget>(`/widget/${id}`).then(normalizeWidget)",
    '}',
    ''
  ].join('\n')
  withFixture({ apiTs }, (result) => {
    assert.equal(result.status, 0,
      'a module with a mapping layer describes a reshaped object and must be skipped:\n' + result.stderr)
  })
})

test('repository sources satisfy the contract', () => {
  const result = spawnSync('python3', [checker, repoRoot], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Field contract guard OK/)
})
