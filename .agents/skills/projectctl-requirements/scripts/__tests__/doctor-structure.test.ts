import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve(import.meta.dir, '../project/doctor-structure.ts');
// Canonical mapping authority.
const realEstructura = readFileSync(
  resolve(import.meta.dir, '../../references/estructura/reglas.md'),
  'utf8',
);

function run(files: Record<string, string>, args: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), 'doctor-structure-'));
  try {
    for (const [path, contents] of Object.entries(files)) {
      const target = join(root, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, contents);
    }
    const proc = spawnSync(process.execPath, [script, '--root', root, '--json', ...args], {
      encoding: 'utf8',
    });
    return { code: proc.status, report: JSON.parse(proc.stdout) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const navigation =
  'root_id: sample\nnavigation:\n  - id: sample\n    title: Sample\n    kind: view\n    bundle: sample\n    children: []\n';

function bundle(criteria: string) {
  return `---
id: sample
title: Sample
kind: view
summary: Sample purpose
source_of_truth: app-map
criteria:
${criteria}
---
## 1. URL

/sample
`;
}

const withMapping = (extra: Record<string, string>) => ({
  '.agents/skills/projectctl-requirements/references/estructura/reglas.md': realEstructura,
  ...extra,
});

test('active criterion without frontmatter evidence_paths is red PATH_REQUIRED', () => {
  const md = bundle(`  - id: SMP-01
    title: Example
    type: ui
    functional: partial
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
`);
  const result = run(
    withMapping({
      'docs/app-map/navigation.yaml': navigation,
      'docs/app-map/sample.md': md,
      'docs/app-map/sample.mmd': 'flowchart LR\n A --> B\n',
      'frontend/src/views/Sample.tsx': 'export const x = 1;\n',
      'frontend/.gitkeep': '',
      'shared/.gitkeep': '',
      'docs/.gitkeep': '',
      'tests/.gitkeep': '',
      'scripts/.gitkeep': '',
      'deploy/.gitkeep': '',
    }),
  );
  expect(result.code).toBe(1);
  expect(result.report.state).toBe('red');
  expect(
    result.report.findings.some(
      (item: { code: string; criterion_id?: string }) =>
        item.code === 'PATH_REQUIRED' && item.criterion_id === 'SMP-01',
    ),
  ).toBe(true);
});

test('prose table does not satisfy the structure reader', () => {
  const md =
    bundle(`  - id: SMP-02
    title: Example
    type: tooling
    functional: partial
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
`) +
    '\n| ID | evidence_paths |\n| --- | --- |\n| SMP-02 | scripts/example.ts |\n';
  const result = run(
    withMapping({
      'docs/app-map/navigation.yaml': navigation,
      'docs/app-map/sample.md': md,
      'docs/app-map/sample.mmd': 'flowchart LR\n A --> B\n',
      'scripts/example.ts': 'export const x = 1;\n',
      'frontend/.gitkeep': '',
      'shared/.gitkeep': '',
      'docs/.gitkeep': '',
      'tests/.gitkeep': '',
      'deploy/.gitkeep': '',
    }),
  );
  expect(
    result.report.findings.some(
      (item: { code: string; criterion_id?: string }) =>
        item.code === 'PATH_REQUIRED' && item.criterion_id === 'SMP-02',
    ),
  ).toBe(true);
});

test('trailing-prose @criterion comment is not a canonical code claim', () => {
  const md = bundle(`  - id: SMP-03
    title: Example
    type: ui
    functional: partial
    evidence_paths:
      - frontend/src/views/Sample.tsx
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
`);
  const result = run(
    withMapping({
      'docs/app-map/navigation.yaml': navigation,
      'docs/app-map/sample.md': md,
      'docs/app-map/sample.mmd': 'flowchart LR\n A --> B\n',
      'frontend/src/views/Sample.tsx': '// @criterion SMP-03 — trailing prose\n\nexport const Sample = 1;\n',
      'shared/.gitkeep': '',
      'docs/.gitkeep': '',
      'tests/.gitkeep': '',
      'scripts/.gitkeep': '',
      'deploy/.gitkeep': '',
    }),
  );
  expect(
    result.report.findings.some((item: { code: string }) => item.code === 'TRACE_FORMAT_INVALID'),
  ).toBe(true);
  expect(
    result.report.findings.some(
      (item: { code: string }) => item.code === 'CODE_CLAIMS' && item.status === 'unverified',
    ),
  ).toBe(true);
});

test('unsupported mapping version fails closed', () => {
  const md = bundle(`  - id: SMP-04
    title: Example
    type: ui
    functional: partial
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
`);
  const result = run(
    withMapping({
      'docs/app-map/navigation.yaml': navigation,
      'docs/app-map/sample.md': md,
      'docs/app-map/sample.mmd': 'flowchart LR\n A --> B\n',
    }),
    ['--mapping', '9.9.9'],
  );
  expect(result.code).toBe(2);
  expect(
    result.report.findings.some((item: { code: string }) => item.code === 'MAPPING_VERSION_UNSUPPORTED'),
  ).toBe(true);
});
