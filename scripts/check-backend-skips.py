#!/usr/bin/env python3
"""Fail when backend test reports contain skipped tests.

A silently skipped integration test can hide a real defect (see issue #40).
"""
import glob
import sys
import xml.etree.ElementTree as ET

patterns = (
    'backend/target/surefire-reports/TEST-*.xml',
    'backend/target/failsafe-reports/TEST-*.xml',
)

skipped = []
for pattern in patterns:
    for path in glob.glob(pattern):
        try:
            root = ET.parse(path).getroot()
        except ET.ParseError as exc:
            print(f'cannot parse {path}: {exc}', file=sys.stderr)
            sys.exit(2)
        for case in root.iter('testcase'):
            if case.find('skipped') is not None:
                skipped.append(f"{case.get('classname')}.{case.get('name')}")

if skipped:
    print('Backend tests were skipped unexpectedly:', file=sys.stderr)
    for name in skipped:
        print(f'  - {name}', file=sys.stderr)
    print('Fix the cause instead of letting the test be skipped.', file=sys.stderr)
    sys.exit(1)

print('backend skip guard: no skipped tests')
