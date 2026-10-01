import { expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const skill = resolve(import.meta.dir, '../..');
const read = (path: string): string => readFileSync(resolve(skill, path), 'utf8');

test('core SoT covers criteria, docs, test and structure without workflow artifacts', () => {
  const sources = read('references/sources.md');
  for (const id of ['PCT-89', 'PCT-90', 'PCT-91', 'PCT-92', 'PCT-93', 'PCT-94', 'PCT-169', 'PCT-170', 'PCT-171', 'PCT-172']) {
    expect(sources).toContain(`\`${id}\``);
  }
  expect(sources).toContain('projectctl-sdd/references/sources.md');
  expect(existsSync(resolve(skill, 'references/tasks/binding.md'))).toBe(false);
  expect(existsSync(resolve(skill, 'modules/sdd'))).toBe(false);
  expect(existsSync(resolve(skill, 'modules/sd-protocol'))).toBe(false);
});

test('core citations resolve to local acceptance criteria and evidence contracts', () => {
  for (const path of [
    'references/standard.md',
    // One normative reference per core function.
    'references/criterios/reglas.md', 'references/docs/reglas.md',
    'references/test/reglas.md', 'references/estructura/reglas.md',
    'references/code/reglas.md',
    'references/app-map/criteria.yaml', 'references/app-map/coverage-ledger.yaml',
    'scripts/project/doctor-docs.ts', 'scripts/project/doctor-test.ts',
    'scripts/project/doctor-structure.ts', 'scripts/project/test-runner-contract.ts',
  ]) {
    expect(existsSync(resolve(skill, path)), path).toBe(true);
  }
});
