import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const checker = path.join(repoRoot, 'scripts', 'check-migration-baseline.py')

const SCHEMA = `CREATE TABLE \`widget\` (
  \`widget_id\` BIGINT NOT NULL,
  \`label\` VARCHAR(20) NOT NULL,
  \`score\` BIGINT NULL,
  \`created_at\` DATETIME NOT NULL,
  \`updated_at\` DATETIME NOT NULL,
  PRIMARY KEY (\`widget_id\`)
) ENGINE=InnoDB;

CREATE TABLE \`gadget\` (
  \`gadget_id\` BIGINT NOT NULL,
  \`widget_id\` BIGINT NOT NULL,
  \`color\` VARCHAR(10) NULL,
  \`created_at\` DATETIME NOT NULL,
  PRIMARY KEY (\`gadget_id\`)
) ENGINE=InnoDB;
`

function fixture(migrations) {
  const root = mkdtempSync(path.join(tmpdir(), 'migration-baseline-'))
  mkdirSync(path.join(root, 'sql', 'migrations'), { recursive: true })
  writeFileSync(path.join(root, 'sql', 'schema.sql'), SCHEMA)
  for (const [name, sql] of migrations) {
    writeFileSync(path.join(root, 'sql', 'migrations', name), sql)
  }
  return root
}

function run(root) {
  return spawnSync('python3', [checker, root], { encoding: 'utf8' })
}

function withFixture(migrations, assertions) {
  const root = fixture(migrations)
  try {
    assertions(run(root), root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('passes when migration structure matches the baseline', () => {
  const create = [
    '-- normal create migration',
    'CREATE TABLE IF NOT EXISTS `widget` (',
    '  `widget_id` BIGINT NOT NULL,',
    '  `label` VARCHAR(20) NOT NULL,',
    '  `score` BIGINT NULL,',
    '  `created_at` DATETIME NOT NULL,',
    '  `updated_at` DATETIME NOT NULL,',
    '  PRIMARY KEY (`widget_id`)',
    ') ENGINE=InnoDB;',
    ''
  ].join('\n')
  const alter = [
    'ALTER TABLE gadget',
    '  ADD COLUMN color VARCHAR(10) NULL;',
    ''
  ].join('\n')
  withFixture([['001_create.sql', create], ['002_alter.sql', alter]], (result) => {
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Migration baseline guard OK/)
  })
})

test('fails for UNSIGNED in a migration', () => {
  const migration = [
    'ALTER TABLE `gadget`',
    '  ADD COLUMN `color` VARCHAR(10) NULL;',
    '',
    'CREATE TABLE IF NOT EXISTS `widget` (',
    '  `widget_id` BIGINT UNSIGNED NOT NULL,',
    '  `label` VARCHAR(20) NOT NULL,',
    '  `score` BIGINT NULL,',
    '  `created_at` DATETIME NOT NULL,',
    '  `updated_at` DATETIME NOT NULL,',
    '  PRIMARY KEY (`widget_id`)',
    ') ENGINE=InnoDB;',
    ''
  ].join('\n')
  withFixture([['001_unsigned.sql', migration]], (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /001_unsigned\.sql:5/)
    assert.match(result.stderr, /UNSIGNED/)
  })
})

test('fails for legacy time column names', () => {
  const migration = [
    'CREATE TABLE IF NOT EXISTS `widget` (',
    '  `widget_id` BIGINT NOT NULL,',
    '  `label` VARCHAR(20) NOT NULL,',
    '  `score` BIGINT NULL,',
    '  `create_time` DATETIME NOT NULL,',
    '  `update_time` DATETIME NOT NULL,',
    '  PRIMARY KEY (`widget_id`)',
    ') ENGINE=InnoDB;',
    ''
  ].join('\n')
  withFixture([['001_legacy_time.sql', migration]], (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /001_legacy_time\.sql:5/)
    assert.match(result.stderr, /create_time/)
    assert.match(result.stderr, /001_legacy_time\.sql:6/)
    assert.match(result.stderr, /update_time/)
  })
})

test('fails when a created primary key differs from the baseline', () => {
  const migration = [
    'CREATE TABLE IF NOT EXISTS `widget` (',
    '  `id` BIGINT NOT NULL,',
    '  `label` VARCHAR(20) NOT NULL,',
    '  `score` BIGINT NULL,',
    '  `created_at` DATETIME NOT NULL,',
    '  `updated_at` DATETIME NOT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB;',
    ''
  ].join('\n')
  withFixture([['001_primary_key.sql', migration]], (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /001_primary_key\.sql/)
    assert.match(result.stderr, /`widget`.*`id`.*`widget_id`/)
  })
})

test('fails for an ALTER-added column absent from the baseline', () => {
  const migration = [
    'ALTER TABLE gadget',
    '  ADD COLUMN ghost_column VARCHAR(10) NULL;',
    ''
  ].join('\n')
  withFixture([['001_missing_alter_column.sql', migration]], (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /001_missing_alter_column\.sql:2/)
    assert.match(result.stderr, /gadget\.ghost_column/)
  })
})

test('fails for a CREATE-declared column absent from the baseline', () => {
  const migration = [
    'CREATE TABLE IF NOT EXISTS `widget` (',
    '  `widget_id` BIGINT NOT NULL,',
    '  `label` VARCHAR(20) NOT NULL,',
    '  `external_ref` BIGINT NULL,',
    '  `score` BIGINT NULL,',
    '  `created_at` DATETIME NOT NULL,',
    '  `updated_at` DATETIME NOT NULL,',
    '  PRIMARY KEY (`widget_id`)',
    ') ENGINE=InnoDB;',
    ''
  ].join('\n')
  withFixture([['001_missing_create_column.sql', migration]], (result) => {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /001_missing_create_column\.sql:4/)
    assert.match(result.stderr, /widget\.external_ref/)
  })
})

// ---- Regression: the baseline packs several columns per physical line, so a
// line-based parser under-reports columns and produces false positives. ----
test('regression: parses every column when the baseline packs several per line', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'migration-baseline-'))
  try {
    const schema = [
      'CREATE TABLE `packed` (',
      '  `packed_id` BIGINT NOT NULL, `alpha` TINYINT NOT NULL DEFAULT 0,',
      '  `beta` VARCHAR(50) NULL, `gamma` DECIMAL(10,2) NULL,',
      '  `created_at` DATETIME NOT NULL,',
      '  PRIMARY KEY (`packed_id`)',
      ') ENGINE=InnoDB;',
      ''
    ].join('\n')
    mkdirSync(path.join(root, 'sql', 'migrations'), { recursive: true })
    writeFileSync(path.join(root, 'sql', 'schema.sql'), schema)
    // migration that adds a column which IS present on a packed baseline line
    writeFileSync(
      path.join(root, 'sql', 'migrations', '001_ok.sql'),
      ['ALTER TABLE packed', '  ADD COLUMN beta VARCHAR(50) NULL;', ''].join('\n')
    )
    const result = run(root)
    assert.equal(result.status, 0,
      'beta exists on a packed baseline line; must not be reported as missing:\n' + result.stderr)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// ---- Regression: type/length/nullability drift must be detected, otherwise
// the fixable drifts (VARCHAR(64) vs (50), varchar(500) vs TEXT) stay unverified. ----
test('regression: fails when an ALTER column length drifts from the baseline', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'migration-baseline-'))
  try {
    const schema = [
      'CREATE TABLE `thing` (',
      '  `thing_id` BIGINT NOT NULL,',
      '  `code` VARCHAR(50) NULL,',
      '  `created_at` DATETIME NOT NULL,',
      '  PRIMARY KEY (`thing_id`)',
      ') ENGINE=InnoDB;',
      ''
    ].join('\n')
    mkdirSync(path.join(root, 'sql', 'migrations'), { recursive: true })
    writeFileSync(path.join(root, 'sql', 'schema.sql'), schema)
    writeFileSync(
      path.join(root, 'sql', 'migrations', '001_len.sql'),
      ['ALTER TABLE thing', '  ADD COLUMN code VARCHAR(64) NULL;', ''].join('\n')
    )
    const result = run(root)
    assert.notEqual(result.status, 0, 'length drift must be reported')
    assert.match(result.stderr, /VARCHAR\(64\)/)
    assert.match(result.stderr, /VARCHAR\(50\)/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('regression: fails when a CREATE column type drifts from the baseline', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'migration-baseline-'))
  try {
    const schema = [
      'CREATE TABLE `note` (',
      '  `note_id` BIGINT NOT NULL,',
      '  `body` TEXT NULL,',
      '  `created_at` DATETIME NOT NULL,',
      '  PRIMARY KEY (`note_id`)',
      ') ENGINE=InnoDB;',
      ''
    ].join('\n')
    mkdirSync(path.join(root, 'sql', 'migrations'), { recursive: true })
    writeFileSync(path.join(root, 'sql', 'schema.sql'), schema)
    writeFileSync(
      path.join(root, 'sql', 'migrations', '001_type.sql'),
      [
        'CREATE TABLE IF NOT EXISTS `note` (',
        '  `note_id` BIGINT NOT NULL,',
        '  `body` VARCHAR(500) NULL,',
        '  `created_at` DATETIME NOT NULL,',
        '  PRIMARY KEY (`note_id`)',
        ') ENGINE=InnoDB;',
        ''
      ].join('\n')
    )
    const result = run(root)
    assert.notEqual(result.status, 0, 'type drift must be reported')
    assert.match(result.stderr, /VARCHAR\(500\)/)
    assert.match(result.stderr, /TEXT/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('regression: fails when nullability drifts from the baseline', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'migration-baseline-'))
  try {
    const schema = [
      'CREATE TABLE `flag` (',
      '  `flag_id` BIGINT NOT NULL,',
      '  `state` TINYINT NOT NULL DEFAULT 0,',
      '  `created_at` DATETIME NOT NULL,',
      '  PRIMARY KEY (`flag_id`)',
      ') ENGINE=InnoDB;',
      ''
    ].join('\n')
    mkdirSync(path.join(root, 'sql', 'migrations'), { recursive: true })
    writeFileSync(path.join(root, 'sql', 'schema.sql'), schema)
    writeFileSync(
      path.join(root, 'sql', 'migrations', '001_nullable.sql'),
      ['ALTER TABLE flag', '  ADD COLUMN state TINYINT NULL;', ''].join('\n')
    )
    const result = run(root)
    assert.notEqual(result.status, 0, 'nullability drift must be reported')
    assert.match(result.stderr, /state/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// ---- Regression: ADD KEY / ADD CONSTRAINT clauses are not column definitions. ----
test('regression: ADD KEY and ADD CONSTRAINT are not mistaken for columns', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'migration-baseline-'))
  try {
    const schema = [
      'CREATE TABLE `link` (',
      '  `link_id` BIGINT NOT NULL,',
      '  `other_id` BIGINT NULL,',
      '  `created_at` DATETIME NOT NULL,',
      '  PRIMARY KEY (`link_id`)',
      ') ENGINE=InnoDB;',
      ''
    ].join('\n')
    mkdirSync(path.join(root, 'sql', 'migrations'), { recursive: true })
    writeFileSync(path.join(root, 'sql', 'schema.sql'), schema)
    writeFileSync(
      path.join(root, 'sql', 'migrations', '001_key.sql'),
      [
        'ALTER TABLE `link`',
        '  ADD COLUMN `other_id` BIGINT NULL,',
        '  ADD KEY `idx_other_id` (`other_id`),',
        '  ADD CONSTRAINT `fk_link_other` FOREIGN KEY (`other_id`) REFERENCES `link` (`link_id`);',
        ''
      ].join('\n')
    )
    const result = run(root)
    assert.equal(result.status, 0,
      'ADD KEY / ADD CONSTRAINT must not be read as column definitions:\n' + result.stderr)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
