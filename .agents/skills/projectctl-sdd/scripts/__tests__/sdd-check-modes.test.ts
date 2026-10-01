// Paso 3 — package vs installed: locator ausente/corrupto → package OK, installed FAIL.
import { describe, expect, it, afterAll } from 'bun:test';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkMachineBaseline } from '../skill/task-flow-normalizer.ts';
import { checkSdd } from '../skill/sdd-check.ts';

const source = resolve(import.meta.dir, '../../../../..');
const scratch = join(tmpdir(), `sdd-check-modes-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
mkdirSync(scratch, { recursive: true });
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function makePortableTree(name: string): string {
  const root = join(scratch, name);
  mkdirSync(join(root, '.agents/skills'), { recursive: true });
  for (const skill of ['projectctl-requirements', 'projectctl-sdd']) {
    cpSync(join(source, '.agents/skills', skill), join(root, '.agents/skills', skill), { recursive: true });
  }
  return root;
}

describe('sdd-check package vs installed (Paso 3)', () => {
  it('locator ausente → package OK, installed FAIL locator missing', () => {
    const root = makePortableTree('absent');
    const pkg = checkSdd(root, { mode: 'package' });
    expect(pkg.ok).toBe(true);
    const inst = checkSdd(root, { mode: 'installed' });
    expect(inst.ok).toBe(false);
    expect(inst.failures.join('\n')).toMatch(/sdd-workflow|locator|missing/i);
    const baselineSkipped = checkMachineBaseline(root, { skipLocator: true });
    expect(baselineSkipped.ok).toBe(true);
    expect(baselineSkipped.digest.locatorSha256).toBeNull();
    const baselineFull = checkMachineBaseline(root);
    expect(baselineFull.ok).toBe(false);
  });

  it('locator corrupto → package OK, installed FAIL locator mismatch', () => {
    const root = makePortableTree('corrupt');
    writeFileSync(join(root, '.agents/sdd-workflow.json'), '{ invalid json', 'utf8');
    const pkg = checkSdd(root, { mode: 'package' });
    expect(pkg.ok).toBe(true);
    const inst = checkSdd(root, { mode: 'installed' });
    expect(inst.ok).toBe(false);
    expect(inst.failures.join('\n')).toMatch(/locator|sdd-workflow|json|drift|baseline/i);
  });

  it('default es installed (compat fail-closed sin locator)', () => {
    const root = makePortableTree('default');
    const result = checkSdd(root);
    expect(result.ok).toBe(false);
  });

  it('installed blocks a missing or link-only startup prompt and accepts full injection', () => {
    const root = makePortableTree('startup');
    cpSync(join(source, '.agents/sdd-workflow.json'), join(root, '.agents/sdd-workflow.json'));
    expect(checkSdd(root).failures.join()).toContain('phase startup invalid');
    mkdirSync(join(root, '.opencode'));
    writeFileSync(join(root, '.opencode/opencode.json'), JSON.stringify({ agent: { 'sdd-orchestrator': { prompt: 'Read module.md when necessary' } } }));
    expect(checkSdd(root).failures.join()).toContain('must inject');
    cpSync(join(root, '.agents/skills/projectctl-sdd/assets/opencode-phase-execution.example.json'), join(root, '.opencode/opencode.json'));
    expect(checkSdd(root).ok).toBe(true);
  });
});
