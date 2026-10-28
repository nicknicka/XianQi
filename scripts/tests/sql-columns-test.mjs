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

CREATE TABLE \`refund_record\` (
  \`refund_id\` BIGINT NOT NULL,
  \`order_id\` BIGINT NOT NULL,
  \`status\` TINYINT NOT NULL,
  \`created_at\` DATETIME NOT NULL,
  PRIMARY KEY (\`refund_id\`)
) ENGINE=InnoDB;

CREATE TABLE \`flash_sale_order_ext\` (
  \`ext_id\` BIGINT NOT NULL,
  \`order_id\` BIGINT NOT NULL,
  \`user_id\` BIGINT NOT NULL,
  \`product_id\` BIGINT NOT NULL,
  \`created_at\` DATETIME NOT NULL,
  PRIMARY KEY (\`ext_id\`)
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

test('catches an unqualified column missing from every table in a JOIN', () => {
  withFixture({
    mapper: annotation(
      'SELECT r.refund_id FROM refund_record r JOIN `order` o ON r.order_id = o.order_id WHERE create_time > NOW()'
    )
  }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /create_time/)
  })
})

test('catches a string column reference broken across lines', () => {
  const service = [
    'package com.x.service;',
    'import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;',
    'import com.x.entity.User;',
    'public class SampleService {',
    '  public void go() {',
    '    LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();',
    '    wrapper',
    '        .eq("user_id", 1L)',
    '        .orderByAsc(',
    '            "create_time");',
    '  }',
    '}',
    ''
  ].join('\n')
  withFixture({ service }, (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /create_time/)
  })
})

// Ticket #52 acceptance evidence: replay the exact drifts that were found and fixed.
const ticketCases = [
  ['OrderMapper create_time', 'SELECT COALESCE(SUM(amount), 0) FROM `order` WHERE create_time >= #{t}', /create_time/],
  ['RefundRecordMapper r.create_time', 'SELECT r.* FROM refund_record r ORDER BY r.create_time DESC', /create_time/],
  ['FlashSaleOrderExtMapper create_time', 'SELECT * FROM flash_sale_order_ext WHERE user_id = #{u} ORDER BY create_time DESC', /create_time/],
  ['ProductMapper.xml missing tables', 'SELECT fsp.flash_price FROM flash_sale_activity fa JOIN flash_sale_product fsp ON fa.activity_id = fsp.activity_id LEFT JOIN flash_sale_product_ext fspe ON fsp.product_id = fspe.product_id', /flash_sale_activity/],
]

for (const [label, sql, expected] of ticketCases) {
  test(`ticket #52 case: ${label}`, () => {
    withFixture({ mapper: annotation(sql) }, (result) => {
      assert.notEqual(result.status, 0, `${label} must be reported`)
      assert.match(result.stderr, expected)
    })
  })
}

test('ticket #52 case: string wrapper column create_time (AIChatHistoryService shape)', () => {
  const service = [
    'package com.x.service;',
    'import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;',
    'import com.x.entity.User;',
    'public class SampleService {',
    '  public void go() {',
    '    QueryWrapper<User> wrapper = new QueryWrapper<>();',
    '    wrapper.eq("user_id", 1L);',
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
