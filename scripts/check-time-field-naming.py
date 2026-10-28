#!/usr/bin/env python3
"""Fail when the retired time-field names reappear in code.

The project unified its time-field contract on ``createdAt`` / ``updatedAt``
(matching the database columns ``created_at`` / ``updated_at``). See
``GLOSSARY.md`` → 「时间字段契约」.

This static guard bans the retired names ``createTime`` / ``updateTime`` from
backend and frontend sources. It never touches a database or the network.

Allowlist — the only places the retired spelling may still appear:

* Pure frontend local-draft timestamps. These are stored in device storage with
  ``uni.setStorageSync`` and never reach the backend (see the allowance table
  below). They are deliberately NOT part of the backend contract.
"""
import os
import re
import sys

failed = False

RETIRED = re.compile(r'\b(createTime|updateTime)\b')

# Files permitted to keep local-only draft timestamps, with the reason.
ALLOWED_FILES = {
    'mobile/src/components/publish-sidebar/publish-sidebar.vue':
        '本地草稿时间：来自设备存储，不经后端',
    'mobile/src/pages/market/publish-with-sidebar.vue':
        '本地草稿时间：来自设备存储，不经后端',
    'mobile/src/pages/mine/drafts.vue':
        '本地草稿时间：从设备存储读取，键名沿用本地存储格式',
    'mobile/src/pages/share/publish.vue':
        '本地草稿时间：写入设备存储',
}

SCAN_ROOTS = (
    ('backend/src/main/java', ('.java',)),
    ('admin/src', ('.ts', '.tsx', '.vue')),
    ('mobile/src', ('.ts', '.tsx', '.vue')),
)


def fail(message):
    print(f'Time field naming guard failed: {message}', file=sys.stderr)
    global failed
    failed = True


def scan(root, rel_root, extensions):
    base = os.path.join(root, rel_root)
    if not os.path.isdir(base):
        return 0
    hits = 0
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in {'node_modules', 'dist', 'target', '.git'}]
        for filename in filenames:
            if not filename.endswith(extensions):
                continue
            path = os.path.join(dirpath, filename)
            rel = os.path.relpath(path, root)
            if rel in ALLOWED_FILES:
                continue
            with open(path, encoding='utf-8') as handle:
                for number, line in enumerate(handle, 1):
                    if RETIRED.search(line):
                        fail(f'{rel}:{number} -> 已废弃的时间字段名：{line.strip()}')
                        hits += 1
    return hits


def main(argv):
    root = os.path.abspath(argv[1]) if len(argv) > 1 else os.path.abspath(os.getcwd())
    total = 0
    for rel_root, exts in SCAN_ROOTS:
        total += scan(root, rel_root, exts)
    if failed:
        return 1
    print(f'Time field naming guard OK (retired names absent; {len(ALLOWED_FILES)} local-draft allowlisted files)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
