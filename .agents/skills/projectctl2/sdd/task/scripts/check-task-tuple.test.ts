import { afterEach, expect, test } from 'bun:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { TEST_RUNNING_REPORT_EXAMPLE } from './check-task-tuple.ts';

const temporaryDirectories: string[] = [];
const repositoryRoot = resolve(import.meta.dir, '../../../../../../');
const taskScripts = join(repositoryRoot, '.agents/skills/projectctl2/sdd/task/scripts');
const CHECK_SCRIPT = join(taskScripts, 'check-task-tuple.ts');

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function makeRepo(): string {
  const cwd = mkdtempSync(join(tmpdir(), 'projectctl2-check-tuple-'));
  temporaryDirectories.push(cwd);
  execFileSync('git', ['init', '-q'], { cwd });
  return cwd;
}

function makeTask(cwd: string): { index: string; dir: string } {
  const relative = execFileSync('bun', [join(taskScripts, 'init.ts'), 'Tuple test', 'Verify tuple contract'], { cwd, encoding: 'utf8' }).trim();
  const index = join(cwd, relative);
  return { index, dir: index.replace(/\.md$/, '') };
}

function setFields(index: string, patch: Record<string, unknown>): void {
  let raw = readFileSync(index, 'utf8');
  for (const [key, value] of Object.entries(patch)) {
    const next = raw.replace(new RegExp(`^${key}:.*$`, 'm'), `${key}: ${JSON.stringify(value)}`);
    if (next === raw) throw new Error(`field not found in fixture: ${key}`);
    raw = next;
  }
  writeFileSync(index, raw, 'utf8');
}

function writeJson(dir: string, file: string, value: unknown): void {
  writeFileSync(join(dir, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runCheck(cwd: string, ...args: string[]) {
  return spawnSync('bun', [CHECK_SCRIPT, ...args], { cwd, encoding: 'utf8' });
}

function checkJson(cwd: string, index: string, phase: string, state: string) {
  const result = runCheck(cwd, '--task', index, '--target-phase', phase, '--target-state', state, '--json');
  return { result, body: JSON.parse(result.stdout || 'null') as { ok: boolean; rule?: string; expected?: string; actual?: string } };
}

const SCOPED_APP_MAP = { view: { id: 'home', name: 'Home' }, feature: { name: 'Nav' } };
const F1_CONTENT = {
  app_map: SCOPED_APP_MAP,
  expected: 'docs updated',
  criteria: [{ operation: 'new', criterion: { id: 'c1', description: 'First criterion', type: 'frontend' } }],
  branch: 'feature/20261010-abc123-tuple-test',
};
// Fixture example from the checker: a green test-running report.
const GREEN_TEST_RUNNING = TEST_RUNNING_REPORT_EXAMPLE;
function greenReqReport(view: string, feature: string) {
  return { status: 'green', scope: { view, feature }, validators: { criterios: 'pass', estructura: 'pass', code: 'pass', test: 'pass' } };
}

test('blocks a state jump within F1 (p1_started -> p1_awaiting_acceptance)', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  const { result, body } = checkJson(cwd, index, 'fase_1_propuesta', 'p1_awaiting_acceptance');
  expect(result.status).toBe(1);
  expect(body.ok).toBe(false);
  expect(body.rule).toBe('state-skip');
  expect(typeof body.expected).toBe('string');
  expect(typeof body.actual).toBe('string');
});

test('blocks F1->F2 when app_map is missing', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  setFields(index, {
    expected: 'docs updated',
    criteria: F1_CONTENT.criteria,
    branch: F1_CONTENT.branch,
    proposal_state: 'approve',
    state: 'p1_awaiting_acceptance',
  });
  const { result, body } = checkJson(cwd, index, 'fase_2_implementacion', 'p2_planning');
  expect(result.status).toBe(1);
  expect(body.ok).toBe(false);
  expect(body.rule).toBe('f1-content');
  expect(body.actual).toContain('app_map');
});

test('allows F1->F2 when content and proposal approval are present', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  setFields(index, { ...F1_CONTENT, proposal_state: 'approve', state: 'p1_awaiting_acceptance' });
  const { result, body } = checkJson(cwd, index, 'fase_2_implementacion', 'p2_planning');
  expect(result.status).toBe(0);
  expect(body).toEqual({ ok: true });
});

test('blocks F2->F3 without functional approval', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  setFields(index, { phase: 'fase_2_implementacion', state: 'p2_awaiting_acceptance' });
  const { result, body } = checkJson(cwd, index, 'fase_3_verificacion', 'p3_test_preparing');
  expect(result.status).toBe(1);
  expect(body.ok).toBe(false);
  expect(body.rule).toBe('f2-approval');
});

test('blocks p4_done without a pr link', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  setFields(index, { phase: 'fase_4_documentacion', state: 'p4_requirements_docs' });
  const { result, body } = checkJson(cwd, index, 'fase_4_documentacion', 'p4_done');
  expect(result.status).toBe(1);
  expect(body.ok).toBe(false);
  expect(body.rule).toBe('p4-done');
});

test('allows a single forward step within F1', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  const { result, body } = checkJson(cwd, index, 'fase_1_propuesta', 'p1_exploring');
  expect(result.status).toBe(0);
  expect(body).toEqual({ ok: true });
});

test('allows a single forward step within F2', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  setFields(index, { phase: 'fase_2_implementacion', state: 'p2_planning' });
  const { result, body } = checkJson(cwd, index, 'fase_2_implementacion', 'p2_implementing');
  expect(result.status).toBe(0);
  expect(body).toEqual({ ok: true });
});

test('allows F3->F4 with requirements_fix==true when tests and the F3 report are green in scope', () => {
  const cwd = makeRepo();
  const { index, dir } = makeTask(cwd);
  setFields(index, { ...F1_CONTENT, phase: 'fase_3_verificacion', state: 'p3_requirements', requirements_fix: true });
  writeJson(dir, 'p3_test_running.report.json', GREEN_TEST_RUNNING);
  writeJson(dir, 'p3_requirements.report.json', greenReqReport('home', 'Nav'));
  const { result, body } = checkJson(cwd, index, 'fase_4_documentacion', 'p4_documenting');
  expect(result.status).toBe(0);
  expect(body).toEqual({ ok: true });
});

test('allows p4_done with requirements_fix==true when the F4 report is green in scope and pr is set', () => {
  const cwd = makeRepo();
  const { index, dir } = makeTask(cwd);
  setFields(index, {
    ...F1_CONTENT,
    phase: 'fase_4_documentacion',
    state: 'p4_requirements_docs',
    requirements_fix: true,
    pr: 'https://example.test/pull/7',
  });
  writeJson(dir, 'p4_requirements_docs.report.json', greenReqReport('home', 'Nav'));
  const { result, body } = checkJson(cwd, index, 'fase_4_documentacion', 'p4_done');
  expect(result.status).toBe(0);
  expect(body).toEqual({ ok: true });
});

test('requires skip of p3_requirements with requirements_fix==false but allows F3->F4 with green tests and no F3 report', () => {
  const cwd = makeRepo();
  const { index, dir } = makeTask(cwd);
  setFields(index, { phase: 'fase_3_verificacion', state: 'p3_test_running' });
  const skipped = checkJson(cwd, index, 'fase_3_verificacion', 'p3_requirements');
  expect(skipped.result.status).toBe(1);
  expect(skipped.body.ok).toBe(false);
  expect(skipped.body.rule).toBe('requirements-skip');

  writeJson(dir, 'p3_test_running.report.json', GREEN_TEST_RUNNING);
  const advanced = checkJson(cwd, index, 'fase_4_documentacion', 'p4_documenting');
  expect(advanced.result.status).toBe(0);
  expect(advanced.body).toEqual({ ok: true });
});

test('blocks F3->F4 on scope mismatch between the F3 report and Task.app_map', () => {
  const cwd = makeRepo();
  const { index, dir } = makeTask(cwd);
  setFields(index, { ...F1_CONTENT, phase: 'fase_3_verificacion', state: 'p3_requirements', requirements_fix: true });
  writeJson(dir, 'p3_test_running.report.json', GREEN_TEST_RUNNING);
  writeJson(dir, 'p3_requirements.report.json', greenReqReport('other', 'Nav'));
  const { result, body } = checkJson(cwd, index, 'fase_4_documentacion', 'p4_documenting');
  expect(result.status).toBe(1);
  expect(body.ok).toBe(false);
  expect(body.rule).toBe('scope');
});

test('blocks F3->F4 when the F3 report file is missing', () => {
  const cwd = makeRepo();
  const { index, dir } = makeTask(cwd);
  setFields(index, { ...F1_CONTENT, phase: 'fase_3_verificacion', state: 'p3_requirements', requirements_fix: true });
  writeJson(dir, 'p3_test_running.report.json', GREEN_TEST_RUNNING);
  const { result, body } = checkJson(cwd, index, 'fase_4_documentacion', 'p4_documenting');
  expect(result.status).toBe(1);
  expect(body.ok).toBe(false);
  expect(body.rule).toBe('f3-gate');
  expect(body.actual).toContain('missing');
});

test('blocks a phase skip from F1 to F3', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  const { result, body } = checkJson(cwd, index, 'fase_3_verificacion', 'p3_test_preparing');
  expect(result.status).toBe(1);
  expect(body.ok).toBe(false);
  expect(body.rule).toBe('phase-skip');
});

test('rejects an unknown target state and exits 2 on usage errors', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  const unknown = checkJson(cwd, index, 'fase_1_propuesta', 'p9_unknown');
  expect(unknown.result.status).toBe(1);
  expect(unknown.body.ok).toBe(false);
  expect(unknown.body.rule).toBe('catalog');

  const usage = runCheck(cwd);
  expect(usage.status).toBe(2);
});

test('never mutates the task index', () => {
  const cwd = makeRepo();
  const { index } = makeTask(cwd);
  const before = readFileSync(index, 'utf8');
  const ok = runCheck(cwd, '--task', index, '--target-phase', 'fase_1_propuesta', '--target-state', 'p1_exploring');
  expect(ok.status).toBe(0);
  const blocked = runCheck(cwd, '--task', index, '--target-phase', 'fase_3_verificacion', '--target-state', 'p3_test_preparing');
  expect(blocked.status).toBe(1);
  expect(readFileSync(index, 'utf8')).toBe(before);
});
