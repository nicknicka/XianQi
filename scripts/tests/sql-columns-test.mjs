import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-sql-columns.py')

const SCHEMA = `CREATE TABLE \`user\` (
  \`user_id\` BIGINT NOT NULL,
  \`username\` VARCHAR(50) NOT NULL,
  \`created_at\` DATETIME NOT NULL,
  PRIMARY KEY (\`user_id\`)
) ENGINE=InnoDB;

CREATE TABLE \`order\` (
  \`order_id\` BIGINT NOT NULL,
  \`user_id\` BIGINT NOT NULL,
  \`amount\` DECIMAL(10,2) NOT NULL,
  \`created_at\` DATETIME NOT NULL,
  PRIMARY KEY (\`order_id\`)
) ENGINE=InnoDB;
`

function fixture({ mapper, xml, service, entity }) {
  const root = mkdtempSync(path.join(tmpdir(), 'sql-columns-'))
  mkdirSync(path.join(root, 'sql'), { recursive: true })
  writeFileSync(path.join(root, 'sql', 'schema.sql'), SCHEMA)

  const mapperDir = path.join(root, 'backend', 'src', 'main', 'java', 'com', 'x', 'mapper')
  mkdirSync(mapperDir, { recursive: true })
  if (mapper) writeFileSync(path.join(mapperDir, 'SampleMapper.java'), mapper)

  const entityDir = path.join(root, 'backend', 'src', 'main', 'java', 'com', 'x', 'entity')
  mkdirSync(entityDir, { recursive: true })
  writeFileSync(path.join(entityDir, 'User.java'), entity || [
    'package com.x.entity;',
    'import com.baomidou.mybatisplus.annotation.TableName;',
    '@TableName("user")',
    'public class User {}',
    ''
  ].join('\n'))

  const serviceDir = path.join(root, 'backend', 'src', 'main', 'java', 'com', 'x', 'service')
  mkdirSync(serviceDir, { recursive: true })
  if (service) writeFileSync(path.join(serviceDir, 'SampleService.java'), service)

  const mapperXmlDir = path.join(root, 'backend', 'src', 'main', 'resources', 'mapper')
  mkdirSync(mapperXmlDir, { recursive: true })
  if (xml) writeFileSync(path.join(mapperXmlDir, 'SampleMapper.xml'), xml)

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

const annotation = (sql) => [
  'package com.x.mapper;',
  'import org.apache.ibatis.annotations.Select;',
  'import org.apache.ibatis.annotations.Update;',
  'public interface SampleMapper {',
  `  @Select("${sql}")`,
  '  Object select();',
  '}',
  ''
].join('\n')

test('passes for annotation SQL that matches the schema', () => {
  withFixture({ mapper: annotation('SELECT user_id FROM user WHERE created_at IS NOT NULL') }, (result) => {
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /SQL column guard OK/)
  })
})

test('fails when annotation SQL references a missing column', () => {
  withFixture({ mapper: annotation('SELECT user_id FROM user WHERE create_time >= NOW()') }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /user/)
    assert.match(result.stderr, /create_time/)
  })
})

test('fails when annotation SQL references a missing table', () => {
  withFixture({ mapper: annotation('SELECT * FROM ghost_table') }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /ghost_table/)
  })
})

test('attributes qualified columns through table aliases', () => {
  withFixture({
    mapper: annotation(
      'SELECT o.order_id FROM `order` o JOIN user u ON o.user_id = u.user_id ORDER BY o.amount'
    )
  }, (result) => {
    assert.equal(result.status, 0, result.stderr)
  })
})

test('fails for an aliased column that does not exist', () => {
  withFixture({
    mapper: annotation('SELECT o.order_id FROM `order` o ORDER BY o.create_time DESC')
  }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /create_time/)
  })
})

test('passes for Mapper XML that matches the schema', () => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mapper namespace="com.x.mapper.SampleMapper">',
    '  <select id="a">SELECT user_id FROM user ORDER BY created_at DESC</select>',
    '</mapper>',
    ''
  ].join('\n')
  withFixture({ xml }, (result) => {
    assert.equal(result.status, 0, result.stderr)
  })
})

test('fails for Mapper XML referencing a missing table', () => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mapper namespace="com.x.mapper.SampleMapper">',
    '  <select id="a">',
    '    SELECT fa.id',
    '    FROM flash_sale_activity fa',
    '  </select>',
    '</mapper>',
    ''
  ].join('\n')
  withFixture({ xml }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /flash_sale_activity/)
  })
})

test('fails for a MyBatis-Plus string column reference', () => {
  const service = [
    'package com.x.service;',
    'import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;',
    'import com.x.entity.User;',
    'public class SampleService {',
    '  public void go() {',
    '    QueryWrapper<User> wrapper = new QueryWrapper<>();',
    '    wrapper.orderByAsc("create_time");',
    '  }',
    '}',
    ''
  ].join('\n')
  withFixture({ service }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /create_time/)
  })
})

test('repository handwritten SQL satisfies the contract', () => {
  const output = execFileSync('python3', [checker, repoRoot], { encoding: 'utf8' })
  assert.match(output, /SQL column guard OK/)
})
