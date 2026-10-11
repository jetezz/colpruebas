import { afterEach, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(import.meta.dir, 'check-traceability.ts');
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

// Minimal green fixture: 1 view / 1 feature / 1 criterion.
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
const CODE_STRING_ONLY = 'export const markerText = \'// @HOME-001\';\n';
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
  const root = mkdtempSync(join(tmpdir(), 'projectctl2-trace-'));
  temporaryDirectories.push(root);
  writeFileSync(join(root, 'navigation-tmp.txt'), 'unused', 'utf8');
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

function runTrace(root: string, ...args: string[]) {
  const result = spawnSync('bun', [SCRIPT, '--root', root, ...args], { encoding: 'utf8' });
  let body: any = null;
  try { body = JSON.parse(result.stdout || 'null'); } catch { body = null; }
  return { result, body };
}

function runTraceJson(root: string, ...args: string[]) {
  return runTrace(root, '--json', ...args);
}

test('green fixture reports valid true', () => {
  const root = makeGreenRoot();
  const { result, body } = runTraceJson(root);
  expect(result.status).toBe(0);
  expect(body.valid).toBe(true);
  expect(body.scopedVerdict).toBe(true);
  expect(body.issues).toEqual([]);
  expect(body.coverage.criteria).toBe(1);
  expect(body.coverage.tests.total).toBe(1);
});

test('docs-missing reports the docs link', () => {
  const root = makeGreenRoot();
  rmSync(join(root, 'docs', 'app-map', 'home', 'home', 'home-001.md'));
  const { result, body } = runTraceJson(root);
  expect(result.status).toBe(1);
  expect(body.valid).toBe(false);
  const text = JSON.stringify(body.issues);
  expect(text).toMatch(/docs|join/i);
});

test('path-missing reports the paths link', () => {
  const root = makeGreenRoot();
  rmSync(join(root, 'frontend', 'src', 'home.ts'));
  const { result, body } = runTraceJson(root);
  expect(result.status).toBe(1);
  expect(body.valid).toBe(false);
  const text = JSON.stringify(body.issues);
  expect(text).toMatch(/path|marker|join|code/i);
});

test('marker-in-string counts as no marker', () => {
  const root = makeGreenRoot();
  writeFileSync(join(root, 'frontend', 'src', 'home.ts'), CODE_STRING_ONLY, 'utf8');
  const { result, body } = runTraceJson(root);
  expect(result.status).toBe(1);
  expect(body.valid).toBe(false);
  const text = JSON.stringify(body.issues);
  expect(text).toMatch(/marker/i);
});

test('test-ID-extra reports the tests link', () => {
  const root = makeGreenRoot();
  const extra = `schema_version: 1
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
  writeFileSync(join(root, 'docs', 'app-map', 'home', 'home.yaml'), extra, 'utf8');
  const { result, body } = runTraceJson(root);
  expect(result.status).toBe(1);
  expect(body.valid).toBe(false);
  const text = JSON.stringify(body.issues);
  expect(text).toMatch(/test|HOME-999|join/i);
});

test('scoped run uses scoped verdict plus global hint and never claims global valid', () => {
  const root = makeGreenRoot();
  const { result, body } = runTraceJson(root, '--view', 'home');
  expect(result.status).toBe(0);
  expect(body.scope.mode).toBe('scoped');
  expect(body.scope.view).toBe('home');
  expect(typeof body.scopedVerdict).toBe('boolean');
  expect(typeof body.globalHint).toBe('string');
  expect(body.globalHint.length).toBeGreaterThan(0);
  // Filtered runs never certify global uniqueness: hint must say so.
  expect(body.globalHint).toMatch(/does not certify|scoped/i);
  expect(JSON.stringify(body)).not.toMatch(/global.*valid.*true/i);
});

test('ambiguous --feature without --view exits 2', () => {
  const root = makeGreenRoot();
  // Add a second view sharing the feature name Home to force ambiguity.
  const ambiguousNav = `schema_version: 1
views:
  - id: home
    name: Home
    features:
      - name: Home
        criteria:
          - id: HOME-001
            description: Home shows a clear summary.
            type: frontend
  - id: other
    name: Other
    features:
      - name: Home
        criteria:
          - id: OTHER-001
            description: Other reuses the feature name.
            type: frontend
`;
  writeFileSync(join(root, 'docs', 'app-map', 'navigation.yaml'), ambiguousNav, 'utf8');
  const { result } = runTraceJson(root, '--feature', 'Home');
  expect(result.status).toBe(2);
});
