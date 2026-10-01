import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve(import.meta.dir, '../project/doctor-docs.ts');

function run(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'doctor-docs-'));
  try {
    for (const [path, contents] of Object.entries(files)) {
      const target = join(root, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, contents);
    }
    const proc = spawnSync(process.execPath, [script, '--root', root, '--json'], { encoding: 'utf8' });
    return { code: proc.status, report: JSON.parse(proc.stdout) };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

const navigation = 'root_id: sample\nnavigation:\n  - id: sample\n    title: Sample\n    kind: view\n    bundle: views/sample/index\n    children: []\n';
const markdown = `---
id: sample
title: Sample
kind: view
summary: Sample purpose
source_of_truth: app-map
criteria:
  - id: SMP-01
    title: Example
    type: ui
    functional: partial
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
---
## 1. URL

/sample

## 2. Tab

Sample

## 3. Objetivo

Sample

## 4. Criterios

Sample

## 5. Diagrama Mermaid

See sibling.

## 6. Sources

Sample
`;
const siblings = { 'docs/app-map/navigation.yaml': navigation, 'docs/app-map/views/sample/index.md': markdown, 'docs/app-map/views/sample/index.mmd': 'flowchart LR\n A --> B\n' };

test('isolated Markdown without navigation is missing, never valid', () => {
  const result = run({ 'docs/app-map/example.md': markdown });
  expect(result.code).toBe(1);
  expect(result.report.state).toBe('missing');
  expect(result.report.findings[0].code).toBe('navigation-missing');
});

test('manifest identity mismatch is invalid without rendering partial docs', () => {
  const result = run({ ...siblings, 'docs/app-map/views/sample/index.md': markdown.replace('id: sample', 'id: other') });
  expect(result.code).toBe(1);
  expect(result.report.state).toBe('invalid');
  expect(result.report.findings.some((item: { code: string }) => item.code === 'frontmatter-identity')).toBe(true);
});

test('local structural pass is unverified until the strict reader checks it', () => {
  const result = run(siblings);
  expect(result.code).toBe(3);
  expect(result.report.state).toBe('unverified');
  expect(result.report.findings).toEqual([]);
  expect(result.report.policyFindings).toEqual([]);
});

test('editorial section gap does not claim runtime invalidity', () => {
  const result = run({ ...siblings, 'docs/app-map/views/sample/index.md': markdown.replace('## 6. Sources', '## 6. References') });
  expect(result.report.state).toBe('unverified');
  expect(result.report.policyFindings.some((item: { code: string }) => item.code === 'section')).toBe(true);
});
