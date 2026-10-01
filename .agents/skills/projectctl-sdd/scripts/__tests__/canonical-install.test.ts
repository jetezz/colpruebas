// @ac AC-VIEWS-08 — portable installation of the documented SDD integration.
import { afterAll, describe, expect, it } from 'bun:test';
import { cpSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = mkdtempSync(join(tmpdir(), 'sdd-canonical-install-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
describe('copy-tree canonical criteria integration', () => {
  it('runs package checks and imports the motor without instance scripts or optional satellites', () => {
    const source = resolve(import.meta.dir, '../../../../..');
    mkdirSync(join(root, '.agents/skills'), { recursive: true });
    for (const skill of ['projectctl-requirements', 'projectctl-sdd']) cpSync(join(source, '.agents/skills', skill), join(root, '.agents/skills', skill), { recursive: true });
    cpSync(join(source, '.agents/sdd-workflow.json'), join(root, '.agents/sdd-workflow.json'));
    mkdirSync(join(root, '.opencode'), { recursive: true });
    cpSync(join(source, '.agents/skills/projectctl-sdd/assets/opencode-phase-execution.example.json'), join(root, '.opencode/opencode.json'));
    for (const script of ['projectctl-requirements/scripts/skill/requirements-check.ts', 'projectctl-sdd/scripts/skill/sdd-check.ts']) {
      const result = spawnSync(process.execPath, [join(root, '.agents/skills', script), '--check'], { cwd: root, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(0);
    }
    const imported = spawnSync(process.execPath, ['-e', `await import(${JSON.stringify(join(root, '.agents/skills/projectctl-sdd/scripts/project/task-engine.ts'))})`], { cwd: root, encoding: 'utf8' });
    expect(imported.status, imported.stderr).toBe(0);
  });
});
