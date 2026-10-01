import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const base = resolve(import.meta.dir, '../project');
const mapping = readFileSync(resolve(import.meta.dir, '../../references/estructura/reglas.md'), 'utf8');
const navigation = `root_id: alpha
navigation:
  - id: alpha
    title: Alpha
    kind: view
    bundle: views/alpha/index
    children:
      - id: first
        title: First
        kind: feature
        bundle: views/alpha/first
        children: []
      - id: second
        title: Second
        kind: feature
        bundle: views/alpha/second
        children: []
  - id: beta
    title: Beta
    kind: view
    bundle: views/beta/index
    children: []
`;
function bundle(id: string, kind: string, criterion: string) {
  return `---
id: ${id}
title: ${id === 'alpha' ? 'Alpha' : id === 'beta' ? 'Beta' : id === 'first' ? 'First' : 'Second'}
kind: ${kind}
summary: Description
source_of_truth: app-map
criteria:
  - id: ${criterion}
    title: Criterion
    type: tooling
    functional: partial
    evidence_paths:
      - scripts/${id}.ts
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
---
## 1. URL

/${id}

## 2. Tab

Tab

## 3. Objetivo

Goal

## 4. Criterios

Criteria

## 5. Diagrama Mermaid

Diagram

## 6. Sources

Sources
`;
}
const files: Record<string, string> = {
  'docs/app-map/navigation.yaml': navigation,
  'docs/app-map/views/alpha/index.md': bundle('alpha', 'view', 'SMP-01'),
  'docs/app-map/views/alpha/first.md': bundle('first', 'feature', 'SMP-02'),
  'docs/app-map/views/alpha/second.md': bundle('second', 'feature', 'SMP-03'),
  'docs/app-map/views/beta/index.md': bundle('beta', 'view', 'SMP-04'),
  '.agents/skills/projectctl-requirements/references/estructura/reglas.md': mapping,
  'scripts/alpha.ts': 'export const alpha = 1;',
  'scripts/first.ts': 'export const first = 1;',
  'scripts/second.ts': 'export const second = 1;',
  'scripts/beta.ts': 'export const beta = 1;',
};
for (const path of ['views/alpha/index', 'views/alpha/first', 'views/alpha/second', 'views/beta/index']) files[`docs/app-map/${path}.mmd`] = 'flowchart LR\n A --> B\n';

function run(name: string, target?: string, overlay: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'doctor-target-'));
  try {
    for (const [path, content] of Object.entries({ ...files, ...overlay })) {
      const full = join(root, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    const proc = spawnSync(process.execPath, [resolve(base, name), '--root', root, '--json', ...(target ? [`--target=${target}`] : [])], { encoding: 'utf8' });
    return { code: proc.status, report: proc.stdout ? JSON.parse(proc.stdout) : null, stderr: proc.stderr };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

for (const doctor of ['doctor-docs.ts', 'doctor-test.ts', 'doctor-structure.ts']) {
  test(`${doctor}: view includes descendants and feature is isolated`, () => {
    const view = run(doctor, 'alpha');
    const feature = run(doctor, 'alpha:first');
    expect(view.report?.scope).toMatchObject({ kind: 'view', nodes: 3, criteria: 3 });
    expect(feature.report?.scope).toMatchObject({ kind: 'feature', nodes: 1, criteria: 1 });
    expect(run(doctor, 'beta:first').code).toBe(2);
  });
}

test('Docs does not report an unrelated broken bundle as a feature failure', () => {
  const overlay = { 'docs/app-map/views/alpha/second.mmd': 'not-mermaid\n' };
  expect(run('doctor-docs.ts', 'alpha:first', overlay).report.findings).toEqual([]);
  expect(run('doctor-docs.ts', 'alpha', overlay).report.findings.some((f: { code: string }) => f.code === 'mermaid-header')).toBe(true);
  expect(run('doctor-docs.ts', undefined, overlay).report.state).toBe('invalid');
});

test('Structure diagnoses only selected criterion paths while retaining global checks', () => {
  const overlay = { 'docs/app-map/views/alpha/second.md': bundle('second', 'feature', 'SMP-03').replace('scripts/second.ts', 'scripts/nonexistent.ts') };
  const feature = run('doctor-structure.ts', 'alpha:first', overlay).report;
  const view = run('doctor-structure.ts', 'alpha', overlay).report;
  expect(feature.findings.some((f: { code: string; criterion_id?: string }) => f.code === 'PATH_MISSING' && f.criterion_id === 'SMP-03')).toBe(false);
  expect(view.findings.some((f: { code: string; criterion_id?: string }) => f.code === 'PATH_MISSING' && f.criterion_id === 'SMP-03')).toBe(true);
});

test('Test matches shared evidence by selected criterion ID, not filename', () => {
  const overlay = { 'tests/unit/beta/shared.test.ts': '// @ac SMP-02 SMP-04\nimport { test } from "bun:test";\ntest("shared", () => {});\n' };
  const feature = run('doctor-test.ts', 'alpha:first', overlay).report;
  expect(feature.checks.some((c: { id: string; message: string }) => c.id === 'TST-36-UNIT-INVENTORY' && c.message.includes('1 unit'))).toBe(true);
});

test('Scoped doctors reject duplicate criterion IDs across features', () => {
  const overlay = { 'docs/app-map/views/alpha/second.md': bundle('second', 'feature', 'SMP-02') };
  expect(run('doctor-test.ts', 'alpha:first', overlay).report.checks.some((c: { id: string }) => c.id === 'TST-CRITERIA-DUPLICATE')).toBe(true);
  expect(run('doctor-structure.ts', 'alpha:first', overlay).report.findings.some((f: { code: string }) => f.code === 'CRITERION_DUPLICATE')).toBe(true);
  expect(run('doctor-docs.ts', 'alpha:first', overlay).report.findings.some((f: { code: string }) => f.code === 'duplicate-criterion')).toBe(true);
});

test('An orphan Markdown bundle cannot define an authoritative criterion', () => {
  const overlay = { 'docs/app-map/orphan.md': bundle('orphan', 'feature', 'SMP-02') };
  const docs = run('doctor-docs.ts', 'alpha:first', overlay).report;
  const tests = run('doctor-test.ts', undefined, overlay).report;
  const structure = run('doctor-structure.ts', undefined, overlay).report;
  expect(docs.findings.some((f: { code: string }) => f.code === 'duplicate-criterion')).toBe(false);
  expect(tests.checks.some((c: { id: string }) => c.id === 'TST-13-BUNDLE-UNLISTED')).toBe(true);
  expect(structure.findings.some((f: { code: string }) => f.code === 'BUNDLE_UNLISTED')).toBe(true);
  expect(structure.findings.some((f: { code: string }) => f.code === 'CRITERION_DUPLICATE')).toBe(false);
});
