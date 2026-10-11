import { afterEach, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(import.meta.dir, 'run-verify-all.ts');
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function makeEmptyRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'projectctl2-verify-'));
  temporaryDirectories.push(root);
  return root;
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  const visit = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) out.push(full);
    }
  };
  visit(dir);
  return out.sort();
}

function runVerify(root: string, ...args: string[]) {
  return spawnSync('bun', [SCRIPT, '--root', root, ...args], { encoding: 'utf8' });
}

test('blocks run in fixed order generated,contracts,requirements,unit-tests,agents', () => {
  const root = makeEmptyRoot();
  const result = runVerify(root);
  const text = `${result.stdout}\n${result.stderr}`;
  const order = ['generated:', 'contracts:', 'requirements:', 'unit-tests:', 'agents:'];
  let last = -1;
  for (const needle of order) {
    const pos = text.indexOf(needle);
    expect(pos).toBeGreaterThan(last);
    last = pos;
  }
}, 90000);

test('a red block does not stop later blocks', () => {
  const root = makeEmptyRoot();
  // Empty root guarantees requirements/unit-tests reds, but all blocks still report.
  const result = runVerify(root);
  expect(`${result.stdout}\n${result.stderr}`).toMatch(/generated:/);
  expect(`${result.stdout}\n${result.stderr}`).toMatch(/contracts:/);
  expect(`${result.stdout}\n${result.stderr}`).toMatch(/requirements:/);
  expect(`${result.stdout}\n${result.stderr}`).toMatch(/unit-tests:/);
  expect(`${result.stdout}\n${result.stderr}`).toMatch(/agents:/);
}, 90000);

test('report uses TODO VERDE or ROJOS status', () => {
  const root = makeEmptyRoot();
  const result = runVerify(root);
  expect(result.stdout).toMatch(/- status: (TODO VERDE|ROJOS)/);
  // Empty root must be ROJOS (exit 1), never TODO VERDE.
  expect(result.stdout).toMatch(/- status: ROJOS/);
  expect(result.status).toBe(1);
  expect(result.stdout).toMatch(/## verify-all report/);
}, 90000);

test('runner is side-effect-free: creates no files and imports no mem', () => {
  const root = makeEmptyRoot();
  const before = listFilesRecursive(root);
  const beforeMtime = new Map(before.map(f => [f, statSync(f).mtimeMs]));
  runVerify(root);
  runVerify(root, '--json');
  const after = listFilesRecursive(root);
  expect(after).toEqual(before);
  for (const file of after) expect(statSync(file).mtimeMs).toBe(beforeMtime.get(file)!);
  const source = readFileSync(SCRIPT, 'utf8');
  // No memory imports/calls and no file writers (comment mentions are allowed,
  // so match import/call shapes only).
  expect(source).not.toMatch(/import.*\bmem_\w*|from\s+['"].*engram|mem_save\s*\(|mem_capture_passive|mem_session/i);
  expect(source).not.toMatch(/writeFileSync|writeFile\(|mkdirSync|update-test-status|update-task|generate-/);
}, 120000);
