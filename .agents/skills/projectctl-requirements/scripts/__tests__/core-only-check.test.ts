import { afterAll, describe, expect, it } from 'bun:test';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkRequirements } from '../skill/requirements-check.ts';
import { parseProjectctlMap } from '../skill/projectctl-map.ts';
import { checkProjectctlCriteriaQuality } from '../skill/projectctl-criteria-integrity.ts';

const root = mkdtempSync(join(tmpdir(), 'projectctl-core-only-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('copy-tree-no-mods core-only installation', () => {
  it('validates a copy of the complete core with no satellite or instance scripts', () => {
    const isolated = join(root, 'core-only');
    cpSync(resolve(import.meta.dir, '../../'), join(isolated, '.agents/skills/projectctl-requirements'), { recursive: true });
    for (const satellite of ['projectctl-cli', 'projectcl-enviorement', 'projectctl-sdd']) {
      expect(existsSync(join(isolated, '.agents/skills', satellite))).toBe(false);
    }
    for (const module of ['projectctl-docs-core.ts', 'projectctl-manifest.ts']) {
      expect(existsSync(join(isolated, '.agents/skills/projectctl-requirements/scripts/skill', module))).toBe(false);
    }
    expect(checkRequirements(isolated).failures).toEqual([]);
    expect(checkProjectctlCriteriaQuality(isolated).diagnostics).toEqual([]);
  });

  it('rejects an invalid MAP rather than inferring a satellite implementation', () => {
    const result = parseProjectctlMap('schema: projectctl-map/v1\nsource_revision: ' + '0'.repeat(64), root);
    expect(result.ok).toBe(false);
    expect(result.issues.some(issue => issue.key === 'table')).toBe(true);
  });

  it('imports every portable library from the isolated installation', () => {
    const skill = join(root, 'core-only/.agents/skills/projectctl-requirements');
    for (const module of [
      'scripts/skill/requirements-check.ts', 'scripts/skill/projectctl-map.ts', 'scripts/skill/projectctl-criteria-integrity.ts',
      'scripts/project/app-map-format.ts', 'scripts/project/docs-lint-core.ts',
      'scripts/project/test-runner-contract.ts', 'scripts/project/code-traceability-contract.ts',
      'scripts/project/criterion-contract.ts', 'scripts/project/app-map-inventory.ts',
      'scripts/project/criterion-references.ts',
    ]) {
      const result = spawnSync(process.execPath, ['-e', `await import(${JSON.stringify(join(skill, module))})`], { encoding: 'utf8' });
      expect(result.status, `${module}: ${result.stderr}`).toBe(0);
    }
  });
});
