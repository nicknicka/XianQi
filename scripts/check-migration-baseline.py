#!/usr/bin/env python3
"""Fail when sql/migrations/*.sql describe structure that schema.sql does not.

The schema in ``sql/schema.sql`` is the database baseline and single source of
truth. This static guard never touches a database; it is deterministic.

Covered drift classes:

1. ``UNSIGNED`` anywhere in a migration (ADR-0008 requires signed keys).
2. Legacy time column names ``create_time`` / ``update_time``; the baseline uses
   ``created_at`` / ``updated_at``.
3. A ``CREATE TABLE`` whose primary key differs from the baseline, or that
   declares a column the baseline does not have.
4. An ``ALTER TABLE ... ADD COLUMN`` for a column the baseline does not have.
5. Column type / length / nullability drift, for both ``CREATE TABLE`` and
   ``ALTER TABLE ... ADD|MODIFY COLUMN``.

The baseline packs several column definitions per physical line, so parsing is
comma-segmented rather than line-based.
"""
import glob
import os
import re
import sys

failed = False

RESERVED = r'(?i)^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN)\b'
STRING_LITERAL = re.compile(r"'(?:[^'\\]|\\.|'')*'")
TYPE_PATTERN = re.compile(r'(?i)^([A-Za-z]+)\s*(\([^)]*\))?')

# ``ADD <keyword>`` clauses that are not column definitions.
ALTER_NON_COLUMN_KEYWORDS = {
    'KEY', 'INDEX', 'UNIQUE', 'PRIMARY', 'FOREIGN', 'CONSTRAINT', 'FULLTEXT', 'SPATIAL',
}


def fail(message):
    print(f'Migration baseline guard failed: {message}', file=sys.stderr)
    global failed
    failed = True


def line_at(source, offset):
    return source[:offset].count('\n') + 1


def strip_string_literals(text):
    return STRING_LITERAL.sub("''", text)


def split_top_level(segment_text, start_offset):
    """Split on commas at parenthesis depth 0, ignoring commas inside quotes.

    Yields ``(offset_within_text, part)`` pairs.
    """
    parts = []
    depth = 0
    in_quote = False
    part_start = 0
    i = 0
    while i < len(segment_text):
        ch = segment_text[i]
        if in_quote:
            if ch == '\\':
                i += 2
                continue
            if ch == "'":
                if i + 1 < len(segment_text) and segment_text[i + 1] == "'":
                    i += 2
                    continue
                in_quote = False
        else:
            if ch == "'":
                in_quote = True
            elif ch == '(':
                depth += 1
            elif ch == ')':
                depth -= 1
            elif ch == ',' and depth == 0:
                parts.append((start_offset + part_start, segment_text[part_start:i]))
                part_start = i + 1
        i += 1
    parts.append((start_offset + part_start, segment_text[part_start:]))
    return parts


def parse_column_definition(definition):
    """Return (normalized_type, nullable) or (None, None) when unparseable."""
    cleaned = strip_string_literals(definition).strip()
    match = TYPE_PATTERN.match(cleaned)
    if not match:
        return None, None
    type_name = match.group(1).upper()
    if match.group(2):
        type_name += re.sub(r'\s+', '', match.group(2))
    nullable = not re.search(r'(?i)\bNOT\s+NULL\b', cleaned)
    return type_name, nullable


def iter_create_columns(body, base_line):
    """Yield (column, line, type, nullable, is_primary_key) from a CREATE body."""
    for offset, part in split_top_level(body, 0):
        text = part.strip()
        if not text:
            continue
        if re.match(RESERVED, text):
            pk = re.match(r'(?i)PRIMARY\s+KEY\s*\(([^)]+)\)', text)
            if pk:
                for column in re.findall(r'`([^`]+)`', pk.group(1)):
                    yield column, base_line + body[:offset].count('\n') + 1, None, None, True
            continue
        match = re.match(r'`([^`]+)`\s+([\s\S]+)$', text)
        if not match:
            continue
        column, definition = match.group(1), match.group(2)
        type_name, nullable = parse_column_definition(definition)
        yield column, base_line + body[:offset].count('\n') + 1, type_name, nullable, False


def parse_create_body(body, base_line=0):
    """Return (columns, primary_keys) where columns maps name -> (line, type, nullable)."""
    columns = {}
    primary_keys = []
    for column, line, type_name, nullable, is_pk in iter_create_columns(body, base_line):
        if is_pk:
            primary_keys.append(column)
        else:
            columns[column] = (line, type_name, nullable)
    return columns, primary_keys


def parse_schema(root):
    path = os.path.join(root, 'sql', 'schema.sql')
    with open(path, encoding='utf-8') as handle:
        sql = handle.read()
    tables = {}
    pattern = re.compile(r'CREATE TABLE (?:IF NOT EXISTS )?`([^`]+)` \((.*?)\n\) ENGINE', re.DOTALL | re.I)
    for match in pattern.finditer(sql):
        columns, primary_keys = parse_create_body(match.group(2), sql[:match.start()].count('\n') + 1)
        tables[match.group(1)] = {
            'columns': {name: {'type': t, 'nullable': n} for name, (_, t, n) in columns.items()},
            'primary_key': primary_keys[0] if primary_keys else None,
        }
    if not tables:
        fail(f'no table definitions parsed from {path}')
    apply_schema_alter_tables(sql, tables)
    return tables


def apply_schema_alter_tables(sql, tables):
    """Apply the baseline's trailing ALTER TABLE pass (ADD/MODIFY/CHANGE/DROP)."""
    block = re.compile(r'ALTER TABLE `([^`]+)`(.*?);', re.DOTALL | re.I)
    for match in block.finditer(sql):
        table = match.group(1)
        if table not in tables:
            continue
        columns = tables[table]['columns']
        for _, statement in split_top_level(match.group(2), 0):
            text = statement.strip()
            change = re.match(r'(?i)CHANGE\s+(?:COLUMN\s+)?`([^`]+)`\s+`([^`]+)`\s+([\s\S]+)$', text)
            add = re.match(r'(?i)ADD\s+(?:COLUMN\s+)?`?([A-Za-z_][A-Za-z0-9_]*)`?\s+([\s\S]+)$', text)
            modify = re.match(r'(?i)MODIFY\s+(?:COLUMN\s+)?`?([A-Za-z_][A-Za-z0-9_]*)`?\s+([\s\S]+)$', text)
            drop = re.match(r'(?i)DROP\s+(?:COLUMN\s+)?`([^`]+)`', text)
            if change:
                columns.pop(change.group(1), None)
                type_name, nullable = parse_column_definition(change.group(3))
                columns[change.group(2)] = {'type': type_name, 'nullable': nullable}
            elif add:
                type_name, nullable = parse_column_definition(add.group(2))
                columns[add.group(1)] = {'type': type_name, 'nullable': nullable}
            elif modify:
                type_name, nullable = parse_column_definition(modify.group(2))
                columns[modify.group(1)] = {'type': type_name, 'nullable': nullable}
            elif drop:
                columns.pop(drop.group(1), None)


def check_unsigned(rel, source):
    for match in re.finditer(r'(?i)\bUNSIGNED\b', source):
        fail(f'{rel}:{line_at(source, match.start())} -> 禁止 UNSIGNED（ADR-0008 要求业务主键/键列均使用有符号整数）')


def check_legacy_time_names(rel, source):
    for match in re.finditer(r'(?i)`\s*(create_time|update_time)\s*`', source):
        column = match.group(1).lower()
        fail(f'{rel}:{line_at(source, match.start())} -> 旧时间列名 `{column}`；基线统一使用 created_at/updated_at')


def compare_column(rel, line, table, column, type_name, nullable, baseline_column):
    if baseline_column is None:
        fail(f'{rel}:{line} -> 列 `{table}.{column}` 不在数据库基线中')
        return
    if type_name and baseline_column['type'] and type_name != baseline_column['type']:
        fail(f'{rel}:{line} -> 列 `{table}.{column}` 类型为 {type_name}，基线为 {baseline_column["type"]}')
    if nullable is not None and baseline_column['nullable'] is not None \
            and nullable != baseline_column['nullable']:
        expected = '可空' if baseline_column['nullable'] else '非空(NOT NULL)'
        fail(f'{rel}:{line} -> 列 `{table}.{column}` 可空性与基线不一致，基线为 {expected}')


def check_create_table(rel, source, tables):
    pattern = re.compile(r'CREATE TABLE (?:IF NOT EXISTS )?`([^`]+)` \((.*?)\n\) ENGINE', re.DOTALL | re.I)
    for match in pattern.finditer(source):
        table, body = match.group(1), match.group(2)
        base_line = source[:match.start()].count('\n') + 1
        if table not in tables:
            fail(f'{rel}:{base_line} -> 迁移创建的表 `{table}` 不在数据库基线中')
            continue
        baseline = tables[table]
        columns, primary_keys = parse_create_body(body, base_line)
        if len(primary_keys) != 1:
            fail(f'{rel}:{base_line} -> CREATE TABLE `{table}` 必须声明且只声明一个主键')
        elif primary_keys[0] != baseline['primary_key']:
            fail(f'{rel}:{base_line} -> CREATE TABLE `{table}` 主键为 '
                 f'`{primary_keys[0]}`，基线为 `{baseline["primary_key"]}`')
        for column, (line, type_name, nullable) in columns.items():
            compare_column(rel, line, table, column, type_name, nullable,
                           baseline['columns'].get(column))


def check_alter_table(rel, source, tables):
    pattern = re.compile(r'ALTER TABLE (`?)([A-Za-z_][A-Za-z0-9_]*)\1(?P<body>.*?);', re.DOTALL | re.I)
    for match in pattern.finditer(source):
        table = match.group(2)
        body = match.group('body')
        body_start = match.start('body')
        if table not in tables:
            fail(f'{rel}:{line_at(source, match.start())} -> ALTER TABLE 引用的表 `{table}` 不在数据库基线中')
            continue
        for offset, statement in split_top_level(body, body_start):
            text = statement.strip()
            add = re.match(r'(?i)ADD\s+(?:COLUMN\s+)?`?([A-Za-z_][A-Za-z0-9_]*)`?\s+([\s\S]+)$', text)
            modify = re.match(r'(?i)MODIFY\s+(?:COLUMN\s+)?`?([A-Za-z_][A-Za-z0-9_]*)`?\s+([\s\S]+)$', text)
            target = add or modify
            if not target:
                continue
            column = target.group(1)
            if add and column.upper() in ALTER_NON_COLUMN_KEYWORDS:
                continue
            # Point at the clause itself, not the leading whitespace of the part.
            leading = len(statement) - len(statement.lstrip())
            line = line_at(source, offset + leading)
            type_name, nullable = parse_column_definition(target.group(2))
            compare_column(rel, line, table, column, type_name, nullable,
                           tables[table]['columns'].get(column))


def check_migration(path, root, tables):
    with open(path, encoding='utf-8') as handle:
        source = handle.read()
    rel = os.path.relpath(path, root)
    check_unsigned(rel, source)
    check_legacy_time_names(rel, source)
    check_create_table(rel, source, tables)
    check_alter_table(rel, source, tables)


def main(argv):
    root = os.path.abspath(argv[1]) if len(argv) > 1 else os.path.abspath(os.getcwd())
    tables = parse_schema(root)
    migrations = sorted(glob.glob(os.path.join(root, 'sql', 'migrations', '*.sql')))
    for path in migrations:
        check_migration(path, root, tables)
    if failed:
        return 1
    print(f'Migration baseline guard OK ({len(migrations)} migrations, {len(tables)} tables)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
