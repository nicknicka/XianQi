#!/usr/bin/env python3
"""Fail when handwritten SQL references a table or column that schema.sql lacks.

Three surfaces are covered (issue #49 / ticket #52):

1. annotation SQL   - @Select / @Update / @Insert / @Delete in Mapper interfaces
2. Mapper XML       - <select> / <insert> / <update> / <delete> bodies
3. string columns   - MyBatis-Plus wrapper calls such as orderByAsc("create_time")

The schema in ``sql/schema.sql`` is the single source of truth. This check never
touches a database; it is deterministic and runs in CI.
"""
import glob
import os
import re
import sys

SQL_KEYWORDS = {
    'select', 'from', 'where', 'and', 'or', 'not', 'order', 'by', 'group', 'having',
    'limit', 'offset', 'insert', 'into', 'values', 'update', 'set', 'delete', 'join',
    'left', 'right', 'inner', 'outer', 'full', 'cross', 'on', 'as', 'desc', 'asc',
    'is', 'null', 'between', 'case', 'when', 'then', 'else', 'end', 'exists', 'distinct',
    'union', 'all', 'in', 'like', 'ignore', 'member', 'of', 'for', 'with', 'duplicate',
    'key', 'interval', 'using', 'natural', 'straight_join',
}
SQL_FUNCTIONS = {
    'count', 'sum', 'coalesce', 'concat', 'date', 'now', 'ifnull', 'avg', 'min', 'max',
    'length', 'substr', 'substring', 'cast', 'round', 'floor', 'ceil', 'abs', 'lower',
    'upper', 'trim', 'year', 'month', 'day', 'date_add', 'date_sub', 'timestampdiff',
    'if', 'nullif', 'greatest', 'least', 'group_concat', 'char_length',
}

# MyBatis-Plus wrapper calls whose first string argument is a raw column name.
STRING_COLUMN_CALLS = (
    'eq', 'ne', 'gt', 'ge', 'lt', 'le', 'in', 'notin', 'isnull', 'isnotnull',
    'like', 'notlike', 'orderbyasc', 'orderbydesc', 'groupby', 'having',
    'select', 'apply', 'set', 'orderby',
)


def fail(message):
    print(f'SQL column guard failed: {message}', file=sys.stderr)
    global failed
    failed = True


failed = False


def parse_schema(root):
    path = os.path.join(root, 'sql', 'schema.sql')
    with open(path, encoding='utf-8') as handle:
        sql = handle.read()
    tables = {}
    for match in re.finditer(r'CREATE TABLE `([^`]+)` \((.*?)\n\) ENGINE', sql, re.DOTALL):
        columns = set()
        for raw_line in match.group(2).split('\n'):
            line = raw_line.strip()
            if re.match(r'(?i)^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN)\b', line):
                continue
            for column in re.finditer(r'`([^`]+)`\s+[A-Za-z]', line):
                columns.add(column.group(1))
        tables[match.group(1)] = columns
    if not tables:
        fail(f'no table definitions parsed from {path}')
    return tables


def normalize_sql(text):
    text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    text = re.sub(r'<[^>]+>', ' ', text)              # XML tags / mybatis placeholders
    text = re.sub(r'#\{[^}]*\}', ' ', text)           # #{param}
    text = re.sub(r'\$\{[^}]*\}', ' ', text)          # ${param}
    text = re.sub(r"'[^']*'", ' ', text)              # string literals
    return text


def referenced_tables(sql):
    """table -> set(aliases). An alias is also recorded under the table name."""
    refs = {}
    for match in re.finditer(
        r'(?i)\b(from|join|update|into)\s+(`?)([a-z_][a-z0-9_]*)\2'
        r'(?:\s+(?:as\s+)?`?([a-z_][a-z0-9_]*)`?)?',
        sql,
    ):
        quoted = match.group(2) == '`'
        table = match.group(3)
        alias = match.group(4)
        # A backtick-quoted identifier is never a keyword (e.g. `` `order` ``).
        if not quoted and table.lower() in SQL_KEYWORDS:
            continue
        aliases = refs.setdefault(table, set())
        aliases.add(table)
        if alias and alias.lower() not in SQL_KEYWORDS:
            aliases.add(alias)
    return refs


def output_aliases(sql):
    names = set()
    for match in re.finditer(r'(?i)\bas\s+([a-z_][a-z0-9_]*)', sql):
        names.add(match.group(1))
    return names


def check_sql_statement(sql, origin, tables):
    normalized = normalize_sql(sql)
    refs = referenced_tables(normalized)
    aliases_out = output_aliases(normalized)

    for table in refs:
        if table not in tables:
            fail(f'{origin} -> 表 `{table}` 在 schema.sql 中不存在')

    alias_to_table = {}
    for table, aliases in refs.items():
        for alias in aliases:
            alias_to_table.setdefault(alias, table)

    candidates = set()
    for match in re.finditer(r'\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b', normalized):
        alias, column = match.group(1), match.group(2)
        table = alias_to_table.get(alias)
        if table and table in tables and column not in tables[table]:
            fail(f'{origin} -> 表 `{table}`（别名 {alias}）不存在列 `{column}`')

    # unqualified identifiers: only attribute them when a single table is involved
    single = None
    if len(refs) == 1:
        single = next(iter(refs))
    for match in re.finditer(r'(?<![\w.])([a-z_][a-z0-9_]*)(?![\w.])', normalized):
        token = match.group(1)
        if token in SQL_KEYWORDS or token in SQL_FUNCTIONS:
            continue
        if token in aliases_out or token in alias_to_table:
            continue
        if token in tables:  # a table name
            continue
        candidates.add(token)

    if single and single in tables:
        known = tables[single]
        # identifiers used as output aliases (e.g. `fsp.stock_count AS foo`) are not columns
        for token in candidates:
            if token in aliases_out:
                continue
            if token not in known:
                fail(f'{origin} -> 表 `{single}` 不存在列 `{token}`')


def collect_java_annotation_sql(root):
    pattern = re.compile(
        r'@(Select|Update|Insert|Delete)\(\s*(?:"""(.*?)"""|((?:"[^"]*"\s*\+?\s*)+))',
        re.DOTALL,
    )
    for path in glob.glob(os.path.join(root, 'backend', 'src', 'main', 'java', '**', '*.java'),
                          recursive=True):
        with open(path, encoding='utf-8') as handle:
            source = handle.read()
        rel = os.path.relpath(path, root)
        for match in pattern.finditer(source):
            block = match.group(2)
            if block is None:
                block = ' '.join(re.findall(r'"([^"]*)"', match.group(3) or ''))
            line = source[:match.start()].count('\n') + 1
            yield f'{rel}:{line} ({match.group(1)})', block


def collect_xml_sql(root):
    pattern = re.compile(r'<(select|insert|update|delete)\b[^>]*>(.*?)</\1>', re.DOTALL | re.I)
    for path in glob.glob(os.path.join(root, 'backend', 'src', 'main', 'resources', 'mapper', '*.xml')):
        with open(path, encoding='utf-8') as handle:
            source = handle.read()
        rel = os.path.relpath(path, root)
        for match in pattern.finditer(source):
            line = source[:match.start()].count('\n') + 1
            yield f'{rel}:{line} (<{match.group(1)}>)', match.group(2)


def collect_java_string_columns(root, tables):
    """Wrapper calls with a raw string column, attributed to the nearest QueryWrapper<E>."""
    decl = re.compile(r'QueryWrapper<([A-Za-z0-9_]+)>')
    call = re.compile(
        r'\.(' + '|'.join(STRING_COLUMN_CALLS) + r')\(\s*"([a-z_][a-z0-9_]*)"',
        re.I,
    )
    suffix_to_table = {}
    for entity_file in glob.glob(os.path.join(root, 'backend', 'src', 'main', 'java',
                                             '**', 'entity', '*.java'), recursive=True):
        with open(entity_file, encoding='utf-8') as handle:
            source = handle.read()
        class_match = re.search(r'class\s+([A-Za-z0-9_]+)', source)
        table_match = re.search(r'@TableName\("`?([^"`]+)`?"\)', source)
        if class_match and table_match:
            suffix_to_table[class_match.group(1)] = table_match.group(1)

    for path in glob.glob(os.path.join(root, 'backend', 'src', 'main', 'java', '**', '*.java'),
                          recursive=True):
        if os.sep + 'entity' + os.sep in path:
            continue
        with open(path, encoding='utf-8') as handle:
            lines = handle.readlines()
        rel = os.path.relpath(path, root)
        entity = None
        for number, line in enumerate(lines, start=1):
            decl_match = decl.search(line)
            if decl_match:
                entity = decl_match.group(1)
            for call_match in call.finditer(line):
                if entity is None:
                    continue
                table = suffix_to_table.get(entity)
                if table is None or table not in tables:
                    continue
                column = call_match.group(2)
                if column not in tables[table]:
                    fail(f'{rel}:{number} (.{call_match.group(1)}) -> '
                         f'表 `{table}` 不存在列 `{column}`')


def main(argv):
    root = os.path.abspath(argv[1]) if len(argv) > 1 else os.path.abspath(os.getcwd())
    tables = parse_schema(root)

    for origin, sql in collect_java_annotation_sql(root):
        check_sql_statement(sql, origin, tables)
    for origin, sql in collect_xml_sql(root):
        check_sql_statement(sql, origin, tables)
    collect_java_string_columns(root, tables)

    if failed:
        return 1
    print(f'SQL column guard OK ({len(tables)} tables)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
