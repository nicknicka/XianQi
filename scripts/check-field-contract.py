#!/usr/bin/env python3
"""Fail when a frontend response type declares a field the backend never returns.

The backend's view objects (VO) are the source of truth for response field names
(see ADR-0012). This guard compares, for each API call whose URL maps to a known
backend endpoint, the fields declared by the frontend response type against the
fields the backend actually returns.

Scope — deliberately narrow:

* Only API modules **without a field-mapping layer** are checked. A mapping layer
  (a ``normalize*`` / ``transform*`` function applied to the response) means the
  frontend type describes a *reshaped* object, not the backend payload, so a
  direct comparison would be meaningless.

  This is a principled boundary, not a TODO. Comparing the fields a normalizer
  *reads* against the backend schema was evaluated and rejected: expressions like
  ``data?.ownerId || data?.userId`` mix the backend name with the name the
  adapter produces, so a script cannot tell them apart without flagging ordinary
  adapter code. See ADR-0012 for the full reasoning.
* Fields named in ``ALLOWED_EXTRA`` are tolerated (pagination envelopes, and
  fields the frontend computes rather than receives).

Known limitation: a field declared only in a *page-local* interface (not in an
API module) is invisible to this guard.

No database and no network access; deterministic.
"""
import glob
import os
import re
import sys

failed = False

# 分页壳字段：后端返回 MyBatis-Plus 的 records/current/size/total/pages，
# 前端类型常直接声明成 list/total 等包装形状。
ALLOWED_EXTRA = {
    'list', 'records', 'current', 'size', 'total', 'pages',
}

# (module, interface, field) triples explicitly tolerated.
# 每条都必须给出理由；白名单只用于「确属防御性兜底」的场景，不能用来掩盖缺陷。
ALLOWED_PAIRS = {
    # 分类列表：页面用 `categoryId || id` 兜底（category.id 仅为防御性别名，
    # 后端 CategoryVO 只提供 categoryId）。
    ('mobile/src/api/category.ts', 'Category', 'id'),
}

ADMIN_PREFIX = '/admin'


def fail(message):
    print(f'Field contract guard failed: {message}', file=sys.stderr)
    global failed
    failed = True


def strip_comments(text):
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    text = re.sub(r'//[^\n]*', '', text)
    return text


def backend_endpoints(root):
    """(VERB, /url) -> list of declared return types."""
    endpoints = {}
    pattern = re.compile(
        r'@(Get|Post|Put|Delete)Mapping'
        r'(?:\(\s*["\']([^"\']*)["\'])?[^)]*\)\s*'
        r'(?:@[\w.]+(?:\([^)]*\))?\s*)*'
        r'public\s+([\w<>\[\],.\s]+?)\s+(\w+)\s*\(',
        re.S,
    )
    for path in glob.glob(os.path.join(root, 'backend', 'src', 'main', 'java',
                                       'com', 'xx', 'xianqijava', 'controller', '**', '*.java'),
                          recursive=True):
        source = strip_comments(open(path, encoding='utf-8').read())
        base = re.search(r'@RequestMapping\("([^"]+)"\)', source)
        if not base:
            continue
        for match in pattern.finditer(source):
            verb, sub, ret = match.group(1).upper(), match.group(2) or '', match.group(3).strip()
            url = base.group(1) + ('/' + sub if sub and not sub.startswith('/') else sub)
            url = re.sub(r'\{[^}]+\}', '{}', url).rstrip('/')
            endpoints.setdefault((verb, url), []).append(ret)
    return endpoints


def backend_type_fields(root):
    """Java type name -> set of JSON field names (own fields + inherited + getter aliases)."""
    own = {}
    parents = {}
    java_roots = [
        os.path.join(root, 'backend', 'src', 'main', 'java', 'com', 'xx', 'xianqijava', 'entity'),
        os.path.join(root, 'backend', 'src', 'main', 'java', 'com', 'xx', 'xianqijava', 'vo'),
    ]
    for java_root in java_roots:
        for path in glob.glob(os.path.join(java_root, '**', '*.java'), recursive=True):
            source = strip_comments(open(path, encoding='utf-8').read())
            name = os.path.basename(path)[:-5]
            fields = set(re.findall(
                r'private\s+(?:static\s+final\s+)?[\w<>\[\],.\s]+?\s+(\w+)\s*[;=]', source))
            for match in re.finditer(r'public\s+[\w<>\[\],.\s]+?\s+(?:get|is)([A-Z]\w*)\s*\(\s*\)', source):
                n = match.group(1)
                fields.add(n[0].lower() + n[1:])
            own[name] = fields
            parent = re.search(r'class\s+\w+\s+extends\s+([\w.]+)', source)
            if parent:
                parents[name] = parent.group(1).split('.')[-1]

    # 展开继承链：实体的 createdAt/updatedAt 来自 BaseEntity，必须计入
    resolved = {}

    def resolve(name, seen=None):
        seen = seen or set()
        if name in resolved:
            return resolved[name]
        if name in seen:
            return set()
        seen.add(name)
        fields = set(own.get(name, set()))
        parent = parents.get(name)
        if parent:
            fields |= resolve(parent, seen)
        resolved[name] = fields
        return fields

    for name in own:
        resolve(name)
    return resolved


def unwrap(java_type):
    """Result<IPage<ProductVO>> -> ProductVO"""
    text = java_type.strip()
    for _ in range(4):
        m = re.match(r'^(?:Result|IPage|Page|List|Set|Collection)<(.+)>$', text.strip())
        if not m:
            break
        text = m.group(1).strip()
    return text.strip('`')


def api_modules_with_mapping(root):
    """API module paths that apply a normalization/transform step."""
    with_mapping = set()
    for side in ('admin', 'mobile'):
        for path in glob.glob(os.path.join(root, side, 'src', 'api', '*.ts')):
            source = open(path, encoding='utf-8').read()
            if re.search(r'function\s+(?:normalize|transform|adapt)[A-Z]', source) \
                    or re.search(r'\.then\(\s*(?:normalize|transform|adapt)', source):
                with_mapping.add(os.path.relpath(path, root))
    return with_mapping


def top_level_fields(body):
    """Declared field names at brace depth 0 only (skip nested object shapes)."""
    fields = set()
    depth = 0
    for line in body.split('\n'):
        stripped = line.strip()
        if depth == 0:
            match = re.match(r'^(?:readonly\s+)?(\w+)\s*[?:]', stripped)
            if match:
                fields.add(match.group(1))
        depth += stripped.count('{') + stripped.count('(') - stripped.count('}') - stripped.count(')')
        if depth < 0:
            depth = 0
    return fields


def interface_fields(root):
    """(file, interface name) -> declared top-level field set."""
    out = {}
    for side in ('admin', 'mobile'):
        for path in glob.glob(os.path.join(root, side, 'src', 'api', '*.ts')) + \
                     glob.glob(os.path.join(root, side, 'src', 'types', '*.ts')):
            source = strip_comments(open(path, encoding='utf-8').read())
            for match in re.finditer(r'(?:export\s+)?interface\s+(\w+)[^{]*\{(.*?)\n\}', source, re.S):
                out.setdefault((os.path.relpath(path, root), match.group(1)), set()).update(
                    top_level_fields(match.group(2)))
    return out


def frontend_calls(root, mapped):
    """Calls whose module has no mapping layer: (side, verb, url, type, file)."""
    calls = []
    for side in ('admin', 'mobile'):
        for path in glob.glob(os.path.join(root, side, 'src', 'api', '*.ts')):
            rel = os.path.relpath(path, root)
            if rel in mapped:
                continue
            source = strip_comments(open(path, encoding='utf-8').read())
            # http.get<Type>('url' ...)
            for match in re.finditer(
                    r'http\.(get|post|put|delete)\s*<\s*([^>(]+?)\s*>\s*\(\s*[`\'"]([^`\'"]+)', source, re.S):
                calls.append((side, match.group(1).upper(), match.group(3), match.group(2).strip(), rel))
            # request<Type>({ url: '...', method: '...' })
            for match in re.finditer(r'request\s*<\s*([^>]+?)\s*>\s*\(\s*\{(.*?)\}', source, re.S):
                body = match.group(2)
                url = re.search(r"url:\s*[`'\"]([^`'\"$]+)", body)
                verb = re.search(r"method:\s*['\"](\w+)", body)
                if url:
                    calls.append((side, (verb.group(1).upper() if verb else 'GET'),
                                  url.group(1), match.group(1).strip(), rel))
    return calls


def normalize_url(url, side):
    url = url.split('?')[0]
    url = re.sub(r'\$\{[^}]*\}', '{}', url)
    url = re.sub(r'/\d+(?=/|$)', '/{}', url)
    url = url.rstrip('/')
    if side == 'admin' and not url.startswith(ADMIN_PREFIX):
        url = ADMIN_PREFIX + url
    return url


def main(argv):
    root = os.path.abspath(argv[1]) if len(argv) > 1 else os.path.abspath(os.getcwd())
    endpoints = backend_endpoints(root)
    if not endpoints:
        fail('no backend endpoints parsed; guard would be vacuous')
        return 1
    types = backend_type_fields(root)
    mapped = api_modules_with_mapping(root)
    ifaces = interface_fields(root)
    calls = frontend_calls(root, mapped)

    checked = 0
    for side, verb, url, ts_type, module in calls:
        target = normalize_url(url, side)
        hit = endpoints.get((verb, target))
        if hit is None:
            continue
        # 前端泛型可能是内联对象字面量，跳过
        base = re.sub(r'\s+', '', ts_type)
        want = None
        for (file, name), fields in ifaces.items():
            if name == base:
                want = fields
                break
        if want is None:
            continue
        have = set()
        for ret in hit:
            java_type = unwrap(ret)
            if java_type in types:
                have |= types[java_type]
        if not have:
            continue
        checked += 1
        allowed = {field for (mod, iface, field) in ALLOWED_PAIRS
                   if mod == module and iface == base}
        missing = sorted(want - have - ALLOWED_EXTRA - allowed)
        if missing:
            fail(f'{module} -> {verb} {target} ({side}): 前端类型 {base} 声明了后端未返回的字段 {missing}')

    if failed:
        return 1
    print(f'Field contract guard OK ({checked} calls checked, {len(mapped)} modules skipped for mapping layers)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
