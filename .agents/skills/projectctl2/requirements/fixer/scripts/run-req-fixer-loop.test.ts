import { afterEach, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(import.meta.dir, 'run-req-fixer-loop.ts');
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

// Minimal green fixture: 1 view / 1 feature / 1 criterion (mirrors check-traceability).
const NAVIGATION = `schema_version: 1
views:
  - id: home
    name: Home
    features:
      - name: Home
        criteria:
          - id: HOME-001
            description: Home shows a clear summary.
            type: frontend
`;

const VIEW_MD = '# Home\n';
const CRITERION_MD = '# HOME-001\n\nHome shows a clear summary.\n';
const CODE_GREEN = '// @HOME-001\nexport const home = 1;\n';
const TEST_GREEN = `schema_version: 1
features:
  - name: Home
    criteria:
      - id: HOME-001
        test:
          type: PW-AUTO
          status: verde
`;

function mapYaml(type: string, criteriaYaml: string): string {
  return `schema_version: 1
type: ${type}
views:
  - id: home
    features:
      - name: Home
        criteria:
${criteriaYaml}`;
}

const FRONT_MAP = mapYaml('frontend', `          - id: HOME-001
            paths:
              - frontend/src/home.ts
`);
const EMPTY_MAP = (type: string) => `schema_version: 1
type: ${type}
views:
  - id: home
    features:
      - name: Home
        criteria: []
`;

function makeGreenRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'projectctl2-fixer-'));
  temporaryDirectories.push(root);
  mkdirSync(join(root, 'docs', 'app-map', 'home', 'home'), { recursive: true });
  mkdirSync(join(root, 'frontend', 'src'), { recursive: true });
  for (const area of ['backend', 'data', 'tooling', 'utils']) mkdirSync(join(root, area), { recursive: true });
  writeFileSync(join(root, 'docs', 'app-map', 'navigation.yaml'), NAVIGATION, 'utf8');
  writeFileSync(join(root, 'docs', 'app-map', 'home', 'home.md'), VIEW_MD, 'utf8');
  writeFileSync(join(root, 'docs', 'app-map', 'home', 'home.yaml'), TEST_GREEN, 'utf8');
  writeFileSync(join(root, 'docs', 'app-map', 'home', 'home', 'home-001.md'), CRITERION_MD, 'utf8');
  writeFileSync(join(root, 'frontend', 'criteria-map.yaml'), FRONT_MAP, 'utf8');
  writeFileSync(join(root, 'backend', 'criteria-map.yaml'), EMPTY_MAP('backend'), 'utf8');
  writeFileSync(join(root, 'data', 'criteria-map.yaml'), EMPTY_MAP('data'), 'utf8');
  writeFileSync(join(root, 'tooling', 'criteria-map.yaml'), EMPTY_MAP('tooling'), 'utf8');
  writeFileSync(join(root, 'utils', 'criteria-map.yaml'), EMPTY_MAP('utils'), 'utf8');
  writeFileSync(join(root, 'frontend', 'src', 'home.ts'), CODE_GREEN, 'utf8');
  return root;
}

function runLoop(root: string, ...args: string[]) {
  return spawnSync('bun', [SCRIPT, '--root', root, ...args], { encoding: 'utf8' });
}

function runJson(root: string, ...args: string[]) {
  const result = runLoop(root, '--json', ...args);
  let body: any = null;
  try { body = JSON.parse(result.stdout || 'null'); } catch { body = null; }
  return { result, body };
}

test('validators run in dependency order criterios,docs,estructura,code,test', () => {
  const root = makeGreenRoot();
  const { result, body } = runJson(root, '--state', 'p3_requirements', '--report-dir', join(root, 'artifacts'));
  expect(result.status).toBe(0);
  expect(Object.keys(body.validators)).toEqual(['criterios', 'docs', 'estructura', 'code', 'test']);
});

test('budget caps at 5 iterations', () => {
  const root = makeGreenRoot();
  const over = runLoop(root, '--state', 'p3_requirements', '--iteration', '6');
  expect(over.status).toBe(1);
  expect(`${over.stdout}${over.stderr}`).toMatch(/budget-exhausted/i);
});

test('same scope is enforced with --prior-report (no re-scope reset)', () => {
  const root = makeGreenRoot();
  const reportDir = join(root, 'artifacts');
  const first = runLoop(root, '--state', 'p3_requirements', '--report-dir', reportDir, '--view', 'home');
  expect(first.status).toBe(0);
  const prior = join(reportDir, 'p3_requirements.report.json');
  const rescope = runLoop(root, '--state', 'p3_requirements', '--report-dir', reportDir, '--view', 'other', '--iteration', '2', '--prior-report', prior);
  expect(rescope.status).toBe(1);
  expect(`${rescope.stdout}${rescope.stderr}`).toMatch(/scope-mismatch/i);
});

test('template byte-check on green F3 fixture', () => {
  const root = makeGreenRoot();
  const result = runLoop(root, '--state', 'p3_requirements');
  expect(result.status).toBe(0);
  const expected = [
    '## req-fixer report',
    '- scope: view=all feature=all only=criterios,estructura,code,test',
    '- iterations: 1/5',
    '- status: green',
    '- validators:',
    '  - criterios: pass (0 issues)',
    '  - docs: skip (0 issues)',
    '  - estructura: pass (0 issues)',
    '  - code: pass (0 issues)',
    '  - test: pass (0 issues)',
    '- fixes applied: none (single-pass orchestrator; agent applies fixes then re-invokes with --iteration/--prior-report)',
  ].join('\n');
  expect(result.stdout.trim()).toBe(expected);
});

test('F3 refuses docs-only (exit 2)', () => {
  const root = makeGreenRoot();
  const result = runLoop(root, '--state', 'p3_requirements', '--only', 'docs');
  expect(result.status).toBe(2);
  expect(`${result.stdout}${result.stderr}`).toMatch(/F3 forbids docs/i);
});

test('F4 requires test recheck even with only=docs', () => {
  const root = makeGreenRoot();
  // Break tests only (extra criterion): docs still green, tests red.
  const broken = `schema_version: 1
features:
  - name: Home
    criteria:
      - id: HOME-001
        test:
          type: PW-AUTO
          status: verde
      - id: HOME-999
        test:
          type: PW-AUTO
          status: verde
`;
  writeFileSync(join(root, 'docs', 'app-map', 'home', 'home.yaml'), broken, 'utf8');
  const { result, body } = runJson(root, '--state', 'p4_requirements_docs', '--only', 'docs');
  expect(result.status).toBe(1);
  expect(body.status).toBe('blocked');
  // Test was not skipped: mandatory recheck ran and failed.
  expect(body.validators.test.status).not.toBe('skip');
  expect(body.validators.test.status).toBe('fail');
  expect(body.validators.docs).toBeDefined();
});

test('report shape carries scope and status for the MVP-2 gate', () => {
  const root = makeGreenRoot();
  const reportDir = join(root, 'artifacts');
  const { result, body } = runJson(root, '--state', 'p3_requirements', '--report-dir', reportDir);
  expect(result.status).toBe(0);
  expect(body.status).toBe('green');
  expect(body.scope).toEqual({ view: 'all', feature: 'all' });
  expect(typeof body.iterations).toBe('number');
  expect(Array.isArray(body.only)).toBe(true);
  expect(Array.isArray(body.remaining)).toBe(true);
  // Artifact uses the fixed filename per state.
  const raw = readFileSync(join(reportDir, 'p3_requirements.report.json'), 'utf8');
  const fileBody = JSON.parse(raw) as { status: string; scope: unknown };
  expect(fileBody.status).toBe('green');
  expect(fileBody.scope).toEqual({ view: 'all', feature: 'all' });
});
