import { afterEach, expect, test } from 'bun:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const temporaryDirectories: string[] = [];
const repositoryRoot = resolve(import.meta.dir, '../../../../../../');
const taskScripts = join(repositoryRoot, '.agents/skills/projectctl2/sdd/task/scripts');

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function createTask(): { cwd: string; taskIndex: string } {
  const cwd = mkdtempSync(join(tmpdir(), 'projectctl2-task-pr-'));
  temporaryDirectories.push(cwd);
  execFileSync('git', ['init', '-q'], { cwd });
  const initialized = execFileSync('bun', [join(taskScripts, 'init.ts'), 'PR guard test', 'Verify task PR contract'], { cwd, encoding: 'utf8' }).trim();
  return { cwd, taskIndex: join(cwd, initialized) };
}

function run(cwd: string, script: string, ...args: string[]) {
  return spawnSync('bun', [join(taskScripts, script), ...args], { cwd, encoding: 'utf8' });
}

function setPhaseFour(taskIndex: string): void {
  const source = readFileSync(taskIndex, 'utf8');
  writeFileSync(taskIndex, source.replace('phase: "fase_1_propuesta"', 'phase: "fase_4_documentacion"'));
}

test('init creates pr as an empty required field and update-task can register the URL', () => {
  const { cwd, taskIndex } = createTask();
  expect(readFileSync(taskIndex, 'utf8')).toContain('pr: ""');

  const result = run(cwd, 'update-task.ts', taskIndex, JSON.stringify({ pr: 'https://example.test/pull/42' }));
  expect(result.status).toBe(0);
  expect(readFileSync(taskIndex, 'utf8')).toContain('pr: "https://example.test/pull/42"');
});

test('init creates ui_url empty and update-task accepts empty, localhost, and domain text values', () => {
  const { cwd, taskIndex } = createTask();
  expect(readFileSync(taskIndex, 'utf8')).toContain('ui_url: ""');

  for (const ui_url of ['', 'http://localhost:3000', 'https://example.com']) {
    const result = run(cwd, 'update-task.ts', taskIndex, JSON.stringify({ ui_url }));
    expect(result.status).toBe(0);
    expect(readFileSync(taskIndex, 'utf8')).toContain(`ui_url: ${JSON.stringify(ui_url)}`);
  }

  const invalid = run(cwd, 'update-task.ts', taskIndex, JSON.stringify({ ui_url: 42 }));
  expect(invalid.status).not.toBe(0);
});

test('set-state rejects p4_done unless phase is F4 and pr has non-whitespace content', () => {
  const { cwd, taskIndex } = createTask();
  let result = run(cwd, 'set-state.ts', taskIndex, 'p4_done');
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('requires phase fase_4_documentacion');

  setPhaseFour(taskIndex);
  result = run(cwd, 'set-state.ts', taskIndex, 'p4_done');
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('requires a non-empty pr link');

  run(cwd, 'update-task.ts', taskIndex, JSON.stringify({ pr: '   ' }));
  result = run(cwd, 'set-state.ts', taskIndex, 'p4_done');
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('requires a non-empty pr link');

  run(cwd, 'update-task.ts', taskIndex, JSON.stringify({ pr: 'https://example.test/pull/42' }));
  result = run(cwd, 'set-state.ts', taskIndex, 'p4_done');
  expect(result.status).toBe(0);
  expect(readFileSync(taskIndex, 'utf8')).toContain('state: "p4_done"');
});

test('init emits requirements_fix false and update-task accepts booleans but rejects non-booleans', () => {
  const { cwd, taskIndex } = createTask();
  expect(readFileSync(taskIndex, 'utf8')).toContain('requirements_fix: false');

  for (const requirements_fix of [true, false]) {
    const result = run(cwd, 'update-task.ts', taskIndex, JSON.stringify({ requirements_fix }));
    expect(result.status).toBe(0);
    expect(readFileSync(taskIndex, 'utf8')).toContain(`requirements_fix: ${JSON.stringify(requirements_fix)}`);
  }

  for (const requirements_fix of [42, 'true']) {
    const invalid = run(cwd, 'update-task.ts', taskIndex, JSON.stringify({ requirements_fix }));
    expect(invalid.status).not.toBe(0);
  }
});

test('init accepts optional --requirements-fix flag defaulting to false', () => {
  const plain = mkdtempSync(join(tmpdir(), 'projectctl2-task-init-'));
  temporaryDirectories.push(plain);
  execFileSync('git', ['init', '-q'], { cwd: plain });
  const plainIndex = join(plain, execFileSync('bun', [join(taskScripts, 'init.ts'), 'Flag default', 'Verify default'], { cwd: plain, encoding: 'utf8' }).trim());
  expect(readFileSync(plainIndex, 'utf8')).toContain('requirements_fix: false');

  for (const args of [['--requirements-fix'], ['--requirements-fix=true']]) {
    const cwd = mkdtempSync(join(tmpdir(), 'projectctl2-task-init-'));
    temporaryDirectories.push(cwd);
    execFileSync('git', ['init', '-q'], { cwd });
    const taskIndex = join(cwd, execFileSync('bun', [join(taskScripts, 'init.ts'), 'Flag true', 'Verify true', ...args], { cwd, encoding: 'utf8' }).trim());
    expect(readFileSync(taskIndex, 'utf8')).toContain('requirements_fix: true');
  }

  const cwd = mkdtempSync(join(tmpdir(), 'projectctl2-task-init-'));
  temporaryDirectories.push(cwd);
  execFileSync('git', ['init', '-q'], { cwd });
  const explicitFalse = join(cwd, execFileSync('bun', [join(taskScripts, 'init.ts'), 'Flag false', 'Verify false', '--requirements-fix=false'], { cwd, encoding: 'utf8' }).trim());
  expect(readFileSync(explicitFalse, 'utf8')).toContain('requirements_fix: false');

  for (const args of [['--requirements-fix=maybe'], ['--requirements-fix', '--requirements-fix']]) {
    const invalid = spawnSync('bun', [join(taskScripts, 'init.ts'), 'Flag invalid', 'Verify invalid', ...args], { cwd, encoding: 'utf8' });
    expect(invalid.status).not.toBe(0);
  }
});

test('set-state accepts p3_requirements and p4_requirements_docs', () => {
  const { cwd, taskIndex } = createTask();
  for (const state of ['p3_requirements', 'p4_requirements_docs']) {
    const result = run(cwd, 'set-state.ts', taskIndex, state);
    expect(result.status).toBe(0);
    expect(readFileSync(taskIndex, 'utf8')).toContain(`state: ${JSON.stringify(state)}`);
  }
});
