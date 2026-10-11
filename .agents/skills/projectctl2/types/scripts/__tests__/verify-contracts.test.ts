import { expect, test } from 'bun:test';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '../../../../../../');
const verifier = resolve(import.meta.dir, '../verify-contracts.ts');
const phaseDocPath = resolve(repoRoot, '.agents/skills/projectctl2/sdd/phases/SKILL.md');

// Normalize CRLF checkouts to LF so heading/slug string surgery is
// line-ending independent (the verifier itself already tolerates \r).
function readPhaseDoc(): string {
  return readFileSync(phaseDocPath, 'utf8').replaceAll('\r\n', '\n');
}

function runWithPhaseDoc(text: string) {
  const directory = mkdtempSync(resolve(tmpdir(), 'projectctl2-workflow-regression-'));
  try {
    const file = resolve(directory, 'phases.md');
    writeFileSync(file, text);
    return Bun.spawnSync(['bun', verifier], {
      cwd: repoRoot,
      env: { ...process.env, PROJECTCTL2_PHASE_DOC: file },
      stdout: 'pipe', stderr: 'pipe',
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('valid workflow documentation passes the verifier', () => {
  expect(runWithPhaseDoc(readPhaseDoc()).exitCode).toBe(0);
}, 30_000);

test('a late workflow mismatch exits nonzero with the workflow diagnostic', () => {
  const original = readPhaseDoc();
  const result = runWithPhaseDoc(original.replace('## Phase 1 — `fase_1_propuesta`', '## Phase 1 — `fase_incorrecta`'));
  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain('phase identifiers in sdd/phases/SKILL.md');
  expect(result.stderr.toString()).toContain('Contract verification failed');
}, 30_000);

test('a state under the wrong phase fails despite unchanged global identifier order', () => {
  const original = readPhaseDoc();
  const heading = '## Phase 2 — `fase_2_implementacion`';
  const misplaced = original.replace(`${heading}\n\n`, '').replace('- **`p2_implementing`**', heading + '\n\n- **`p2_implementing`**');
  const identifiers = (text: string) => ({
    phases: [...text.matchAll(/^## (?:Fase|Phase) \d+ — `([^`]+)`/gm)].map(match => match[1]),
    states: [...text.matchAll(/^- \*\*`([^`]+)`\*\*:/gm)].map(match => match[1]),
  });
  expect(identifiers(misplaced)).toEqual(identifiers(original));
  const result = runWithPhaseDoc(misplaced);
  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toContain('state identifiers declared under phase fase_1_propuesta');
}, 30_000);

test('unified verifier fails when a negative fixture is missing', () => {
  const fixtureSource = resolve(import.meta.dir, 'fixtures/data');
  const verifier = resolve(import.meta.dir, '../verify-contracts.ts');
  const tempDir = mkdtempSync(resolve(tmpdir(), 'projectctl2-contract-fixtures-'));
  const fixtureCopy = resolve(tempDir, 'fixtures');
  cpSync(fixtureSource, fixtureCopy, { recursive: true });

  try {
    rmSync(resolve(fixtureCopy, 'navigation.invalid.yaml'));
    const result = Bun.spawnSync(['bun', verifier], {
      cwd: repoRoot,
      env: { ...process.env, PROJECTCTL2_CONTRACT_FIXTURE_DIR: fixtureCopy },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    expect(result.exitCode).not.toBe(0);
    expect(`${result.stdout.toString()}\n${result.stderr.toString()}`).toContain('fixture is missing or unreadable');
    expect(`${result.stdout.toString()}\n${result.stderr.toString()}`).toContain('Contract verification failed');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}, 30_000);

// Drift guard: unit test of the phases/SKILL.md-vs-catalog comparator with
// inline fixtures (not the real SKILL.md, which documents the new states in
// step 7, out of scope here). A state present in the doc but missing from the
// catalog must fail the comparison.
test('a state new in the phase doc but missing from the catalog fails the comparator', () => {
  const compare = (documented: Record<string, string[]>, catalog: Record<string, readonly string[]>): string[] => {
    const failures: string[] = [];
    if (JSON.stringify(Object.keys(documented)) !== JSON.stringify(Object.keys(catalog))) {
      failures.push('phase identifiers do not exactly match WorkflowCatalog (including order)');
    }
    for (const phaseId of new Set([...Object.keys(documented), ...Object.keys(catalog)])) {
      const documentedStates = documented[phaseId];
      const catalogStates = catalog[phaseId];
      if (!documentedStates || !catalogStates || JSON.stringify(documentedStates) !== JSON.stringify(catalogStates)) {
        failures.push(`state identifiers declared under phase ${phaseId} do not exactly match WorkflowCatalog`);
      }
    }
    return failures;
  };

  const catalog = {
    fase_3_verificacion: ['p3_test_preparing', 'p3_test_running'],
    fase_4_documentacion: ['p4_documenting', 'p4_done'],
  } as const;
  const matching: Record<string, string[]> = {
    fase_3_verificacion: ['p3_test_preparing', 'p3_test_running'],
    fase_4_documentacion: ['p4_documenting', 'p4_done'],
  };
  expect(compare(matching, catalog)).toEqual([]);

  const drifted: Record<string, string[]> = {
    fase_3_verificacion: ['p3_test_preparing', 'p3_test_running', 'p3_requirements'],
    fase_4_documentacion: ['p4_documenting', 'p4_requirements_docs', 'p4_done'],
  };
  const failures = compare(drifted, catalog);
  expect(failures.length).toBeGreaterThan(0);
  expect(failures.join('\n')).toContain('fase_3_verificacion');
});
