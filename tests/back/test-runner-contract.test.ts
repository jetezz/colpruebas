// @ac PCT-91 PCT-92 PCT-94
//
// Unit test for the unified test-runner contract (AC-003 / REQ-TST-001/003/005).
// Closes the F5 coverage-mapping gap for the test family criteria that had no unit
// file declaring their tokens:
//   - PCT-91 — runner CLI (`run`/`check`) with 1:1 mapping to `projectctl test *`
//     (references/test.md §PCT-91; design §3.1 / AD-06 / AD-08).
//   - PCT-92 — canonical atomic persistence layout under
//     `.runtime/test-results/<projectId>/<run-id>/` with `summary.json` (`criteria[]`
//     + `methods[]`) and `unit/junit.xml` (references/test.md §PCT-92, TST-08).
//   - PCT-94 — `playwright/TEST_PLAN.md` file↔criterion mapping + PW-AUTO/PW-CLI tiers
//     (references/test.md §PCT-94 / REQ-TST-003).
//
// The first 10 lines are reserved for the `@ac` header because the runner
// (`scripts/test-runner.ts` assertAcHeader) only scans that range and rejects the file
// with exit 2 when the header is missing (PCT-90 / TST-03/04).

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';
const REPO_ROOT = `/workspace/projects/${PROJECT_ID}`;

const RUNNER_PATH = `${REPO_ROOT}/scripts/test-runner.ts`;
const PACKAGE_JSON_PATH = `${REPO_ROOT}/package.json`;
const RUNS_ROOT = `${REPO_ROOT}/.runtime/test-results/${PROJECT_ID}`;
const TEST_PLAN_PATH = `${REPO_ROOT}/playwright/TEST_PLAN.md`;

function readFile(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Scans the persisted run-dirs under `.runtime/test-results/<projectId>/` and returns
 * the run ids whose layout matches the canonical atomic persistence shape (TST-08 /
 * references/test.md §PCT-92): a root `summary.json` declaring `criteria[]` and
 * `methods[]`, plus a `unit/` directory containing `junit.xml`. Read-only assertion.
 */
function findCanonicalRunDirs(): string[] {
  let dirs: string[] = [];
  try {
    dirs = fs
      .readdirSync(RUNS_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }

  const canonical: string[] = [];
  for (const runId of dirs) {
    const runDir = path.join(RUNS_ROOT, runId);
    const summaryRaw = readFile(path.join(runDir, 'summary.json'));
    const junitPath = path.join(runDir, 'unit', 'junit.xml');
    if (summaryRaw === null || !fs.existsSync(junitPath)) continue;
    try {
      const summary = JSON.parse(summaryRaw) as {
        criteria?: unknown;
        methods?: unknown;
      };
      if (Array.isArray(summary.criteria) && Array.isArray(summary.methods)) {
        canonical.push(runId);
      }
    } catch {
      // malformed summary.json in a legacy run dir is not canonical evidence
    }
  }
  return canonical;
}

describe('colpruebas managed project · unified test-runner contract (AC-003 / REQ-TST-001/003/005)', () => {
  const runnerRaw = readFile(RUNNER_PATH);
  const packageJsonRaw = readFile(PACKAGE_JSON_PATH);
  const testPlanRaw = readFile(TEST_PLAN_PATH);

  it('PCT-91: unified runner file exists at scripts/test-runner.ts', () => {
    expect(runnerRaw).not.toBeNull();
  });

  it('PCT-91: runner CLI accepts the run subcommand (mapping 1:1 with `projectctl test *`)', () => {
    expect(runnerRaw).toMatch(/cmd === 'run'/);
    expect(runnerRaw).toContain('function runCommand');
  });

  it('PCT-91: runner CLI accepts the check subcommand (gate TST-13)', () => {
    expect(runnerRaw).toMatch(/cmd === 'check'/);
    expect(runnerRaw).toContain('function runCheck');
  });

  it('PCT-91: run subcommand exposes the canonical method/target flags of `projectctl test *`', () => {
    expect(runnerRaw).toContain('--method=');
    expect(runnerRaw).toContain('--target=');
  });

  it('PCT-91: package.json wires the gate `test:check` to the runner check subcommand (AD-08)', () => {
    expect(packageJsonRaw).not.toBeNull();
    const pkg = JSON.parse(packageJsonRaw ?? '{}') as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['test:check']).toBe('bun run scripts/test-runner.ts check');
  });

  it('PCT-92: canonical persistence root exists under .runtime/test-results/<projectId>/', () => {
    expect(fs.existsSync(RUNS_ROOT)).toBe(true);
  });

  it('PCT-92: at least one persisted run dir has the canonical atomic layout (summary.json criteria[]/methods[] + unit/junit.xml)', () => {
    const canonical = findCanonicalRunDirs();
    expect(canonical.length).toBeGreaterThan(0);
  });

  it('PCT-92: the canonical layout shape is verified against a real run dir', () => {
    const canonical = findCanonicalRunDirs();
    const runId = canonical[0];
    expect(runId).toBeDefined();
    const summary = JSON.parse(readFile(path.join(RUNS_ROOT, runId, 'summary.json')) ?? '{}') as {
      run_id?: unknown;
      criteria?: unknown;
      methods?: unknown;
    };
    expect(typeof summary.run_id).toBe('string');
    expect(summary.run_id).toBe(runId);
    expect(Array.isArray(summary.criteria)).toBe(true);
    expect(Array.isArray(summary.methods)).toBe(true);
    expect(fs.existsSync(path.join(RUNS_ROOT, runId, 'unit', 'junit.xml'))).toBe(true);
  });

  it('PCT-94: playwright/TEST_PLAN.md exists', () => {
    expect(testPlanRaw).not.toBeNull();
  });

  it('PCT-94: TEST_PLAN.md declares the validation tier references PW-AUTO and PW-CLI', () => {
    expect(testPlanRaw).toMatch(/## Tiers de validación Playwright/);
    expect(testPlanRaw).toContain('PW-AUTO');
    expect(testPlanRaw).toContain('PW-CLI');
  });

  it('PCT-94: TEST_PLAN.md keeps a persistent file↔criterion mapping section', () => {
    expect(testPlanRaw).toContain('Cobertura persistente vigente');
    expect(testPlanRaw).toMatch(/tests\/front\/tests\/index\.spec\.ts/);
    expect(testPlanRaw).toMatch(/tests\/front\/tests\/test-tab\.spec\.ts/);
  });
});