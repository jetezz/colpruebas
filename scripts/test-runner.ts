#!/usr/bin/env bun
// Unified test runner (AC-003 / PCT-89..PCT-94).
//
// Canonical CLI (design §5.1, PCT-91):
//   bun run scripts/test-runner.ts run --method=<unit|pwauto|all> --target=<view>[:<feature>] [--persist]
//   bun run scripts/test-runner.ts check            # gate TST-13 (AD-08 / PCT-93)
//
// Exit codes: 0 ok; 1 test/gate failure; 2 rejection (missing @ac header or
// coverage without an AC mapping — REQ-TST-001 / PCT-90).
//
// This runner is a thin orchestrator: it REUSES the backend primitives instead of
// duplicating them (AD-06). Header discovery / summary.json shape mirror the
// existing implementations and run-dirs (46 legacy runs preserved — REQ-TST-005).

import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  existsSync,
} from 'node:fs';

import { extractAcTokensFromBun, extractAcTokensFromPlaywright } from '../backend/src/ac-header.ts';
import { buildInventory } from '../backend/src/test-inventory.ts';
import type { AppMapCoverageState } from '../backend/src/coverage-writer.ts';

// NOTE: `patchBundleCoverage` (backend/src/coverage-writer.ts) pulls the
// `gray-matter` dependency transitively. It is-imported lazily inside the
// `--persist` write-back path (AD-06 reuse, no duplication) so that the `check`
// gate and header/rejection discovery boot WITHOUT backend deps installed.
// Persist requires backend deps (`bun install` in backend/) as the real backend
// runtime does.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

// ---- Identity / path resolution ----

// projectId mirrors the runtime layout already present under .runtime/test-results/
// (a single dir, the managed-project id). Fallback to env PROJECT_ID.
function resolveProjectId(): string {
  if (process.env.PROJECT_ID && process.env.PROJECT_ID.length) return process.env.PROJECT_ID;
  const resultsRoot = join(repoRoot, '.runtime', 'test-results');
  try {
    const dirs = readdirSync(resultsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    if (dirs.length === 1) return dirs[0];
  } catch {
    // fall through
  }
  return process.env.PROJECT_ID ?? 'local';
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Resolve view[:feature] -> bundle .md path, preferring PWAUTO_VIEWS bundle_path
// from frontend/playwright.config.ts (design §5.6 / PCT-93).
function resolveBundlePath(target: { view: string; feature: string | null }): string {
  let bundleRel: string | null = null;
  try {
    const cfg = readFileSync(join(repoRoot, 'frontend', 'playwright.config.ts'), 'utf8');
    const key = target.feature ? `${target.view}:${target.feature}` : target.view;
    const re = new RegExp(
      `['"\`]${escapeRegExp(key)}['"\`][^}]*?bundle_path:\\s*['"\`]([^'"\`]+)['"\`]`,
      's',
    );
    const m = cfg.match(re);
    if (m) bundleRel = m[1];
  } catch {
    bundleRel = null;
  }
  const rel = bundleRel ?? `views/${target.view}/index`;
  return join(repoRoot, 'docs', 'app-map', `${rel}.md`);
}

function existsBundle(p: string): boolean {
  try {
    readFileSync(p, 'utf8');
    return true;
  } catch {
    return false;
  }
}

// ---- Header / AC validation (PCT-90 / TST-03 / TST-04 / TST-10) ----

function readHeader(filePath: string): string[] {
  const source = readFileSync(filePath, 'utf8');
  const lines = source.split('\n').slice(0, 12).join('\n');
  return extractAcTokensFromBun(lines);
}

class AcRejectionError extends Error {}

function assertAcHeader(filePath: string): string[] {
  const header = readHeader(filePath);
  if (header.length === 0) {
    throw new AcRejectionError(
      `rejected: ${relative(repoRoot, filePath)} has no '// @ac <ID>' header in the first lines (PCT-90)`,
    );
  }
  return header;
}

function assertAcHeaderSpec(filePath: string): string[] {
  const header = readHeader(filePath);
  const annotations = extractAcTokensFromPlaywright(readFileSync(filePath, 'utf8'));
  if (header.length === 0) {
    throw new AcRejectionError(
      `rejected: ${relative(repoRoot, filePath)} has no '// @ac <ID>' header in the first lines (PCT-90)`,
    );
  }
  if (annotations.length > 0 && !header.some((t) => annotations.includes(t))) {
    throw new AcRejectionError(
      `rejected: ${relative(repoRoot, filePath)} annotation @ac=${annotations.join(',')} does not match header @ac=${header.join(',')} (PCT-90)`,
    );
  }
  return header;
}

// ---- Directory walker / discovery ----

function walk(dir: string, cb: (file: string) => void, depth = 0): void {
  if (depth > 5) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (
      entry === 'node_modules' ||
      entry === '.git' ||
      entry === 'dist' ||
      entry === '.astro' ||
      entry === '.bun' ||
      entry === '.cache' ||
      entry === 'test-results'
    )
      continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, cb, depth + 1);
    else if (st.isFile()) cb(full);
  }
}

function discoverUnitFiles(): string[] {
  // Mirrors buildInventory's unit roots (backend/src/test-inventory.ts):
  // `tests/back`, `backend/src` and `frontend/__tests__` (design §8 — AD-06, same
  // discovery as the gate/backend so no test is silently unreachable).
  const roots = [
    join(repoRoot, 'tests', 'back'),
    join(repoRoot, 'backend', 'src'),
    join(repoRoot, 'frontend', '__tests__'),
  ];
  const files: string[] = [];
  const seen = new Set<string>();
  for (const root of roots) {
    walk(root, (p) => {
      if (!/\.(test|spec)\.ts$/.test(p)) return;
      if (seen.has(p)) return;
      seen.add(p);
      files.push(p);
    });
  }
  return files;
}

function discoverPwautoSpecs(): string[] {
  const root = join(repoRoot, 'tests', 'front', 'tests');
  const files: string[] = [];
  const seen = new Set<string>();
  walk(root, (p) => {
    if (!/\.spec\.ts$/.test(p)) return;
    if (seen.has(p)) return;
    seen.add(p);
    files.push(p);
  });
  return files;
}

// ---- summary.json canonical shape (design §5.3 / PCT-92 / TST-08) ----

interface CriterionResult {
  id: string;
  status: AppMapCoverageState;
}
interface MethodResult {
  method: string;
  passed: number;
  failed: number;
  skipped: number;
  startedAt: string;
  finishedAt: string;
  exitCode: number | null;
  junitPath: string | null;
  results: unknown[];
}
interface SummaryShape {
  run_id: string;
  started_at: string;
  finished_at: string;
  target: { view: string; feature: string | null; method: string };
  passed: number;
  failed: number;
  skipped: number;
  criteria: CriterionResult[];
  methods: MethodResult[];
}

// ---- Real execution (W1 — design §5.1 / PCT-91) ----
//
// `run` MUST actually execute the tests for the target and derive results from
// real command output (design §5.1 "run: ejecuta tests del target con filtro
// @ac" and the PCT-91 1:1 mapping with `projectctl test *`). The previous
// implementation only validated headers and fabricated `covered`/placeholder
// junit without executing — a code-review warning (W1). Here:
//   - unit:   `bun test <scoped files> --reporter=junit --reporter-outfile=<path>`
//   - pwauto: `bunx playwright test --project=<pwa>` (per `PWAUTO_VIEWS` contract)
//   - criteria[]/junit/results are derived from the ACTUAL run output.
//   - a criterion with no executed test is recorded `missing` (NOT `covered`).

interface ExecOutcome {
  ran: boolean;
  passed: number;
  failed: number;
  skipped: number;
  exitCode: number | null;
  junitPath: string | null;
  perCriterion: Map<string, AppMapCoverageState>;
}

const execTmpDir = join(tmpdir(), 'colpruebas-runner');

function parseJunitTotals(xml: string): { tests: number; failures: number; skipped: number } {
  const root = /<testsuites\b[^>]*/i.exec(xml)?.[0] ?? '';
  const attr = (name: string): number => {
    const m = new RegExp(`\\b${name}="(\\d+)"`, 'i').exec(root);
    return m ? Number(m[1]) : 0;
  };
  return { tests: attr('tests'), failures: attr('failures'), skipped: attr('skipped') };
}

// Per-file stats from Playwright/Bun JUnit XML: the file-level <testsuite>
// carries `name` as the relative file (Bun) or the basename (Playwright).
function fileJunitStats(
  xml: string,
  relFile: string,
): { tests: number; failures: number; skipped: number } | null {
  const names = [relFile, basename(relFile)];
  for (const n of names) {
    const re = new RegExp(
      `<testsuite\\b[^>]*name=["']${escapeRegExp(n)}["'][^>]*tests=["'](\\d+)["'][^>]*failures=["'](\\d+)["'][^>]*skipped=["'](\\d+)["']`,
      'i',
    );
    const m = re.exec(xml);
    if (m) return { tests: Number(m[1]), failures: Number(m[2]), skipped: Number(m[3]) };
  }
  return null;
}

// Derive criterion coverage from the REAL junit output (W1): no test executed for
// a criterion → `missing` (never a fabricated `covered`).
function deriveCriterionCoverage(
  scoped: Map<string, Set<string>>,
  xml: string,
): Map<string, AppMapCoverageState> {
  const out = new Map<string, AppMapCoverageState>();
  for (const [criterion, files] of scoped) {
    if (files.size === 0) {
      out.set(criterion, 'missing');
      continue;
    }
    const executed: Array<{ failures: number }> = [];
    for (const f of files) {
      const stats = fileJunitStats(xml, relative(repoRoot, f));
      if (stats && stats.tests > 0) executed.push(stats);
    }
    if (executed.length === 0) out.set(criterion, 'missing');
    else if (executed.some((s) => s.failures > 0) || executed.length < files.size)
      out.set(criterion, 'partial');
    else out.set(criterion, 'covered');
  }
  return out;
}

function runUnitExecution(files: string[], junitOut: string): ExecOutcome {
  if (files.length === 0) {
    return {
      ran: false,
      passed: 0,
      failed: 0,
      skipped: 0,
      exitCode: 0,
      junitPath: null,
      perCriterion: new Map(),
    };
  }
  const args = [
    'test',
    ...files,
    '--reporter=junit',
    `--reporter-outfile=${junitOut}`,
  ];
  const res = spawnSync('bun', args, { cwd: repoRoot, encoding: 'utf8' });
  let xml = '';
  try {
    xml = readFileSync(junitOut, 'utf8');
  } catch {
    xml = '';
  }
  const t = parseJunitTotals(xml);
  return {
    ran: true,
    passed: t.tests - t.failures - t.skipped,
    failed: t.failures,
    skipped: t.skipped,
    exitCode: res.status ?? (res.error ? 1 : 0),
    junitPath: junitOut,
    perCriterion: new Map(),
  };
}

function resolvePwautoProject(view: string, feature: string | null): string | null {
  try {
    const cfg = readFileSync(join(repoRoot, 'frontend', 'playwright.config.ts'), 'utf8');
    const key = feature ? `${view}:${feature}` : view;
    const re = new RegExp(
      `['"\`]${escapeRegExp(key)}['"\`][^}]*?project:\\s*['"\`]([^'"\`]+)['"\`]`,
      's',
    );
    const m = cfg.match(re);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function runPwautoExecution(view: string, feature: string | null): ExecOutcome {
  const project = resolvePwautoProject(view, feature);
  if (!project) {
    return {
      ran: false,
      passed: 0,
      failed: 0,
      skipped: 0,
      exitCode: 0,
      junitPath: null,
      perCriterion: new Map(),
    };
  }
  const args = [
    'playwright',
    'test',
    `--project=${project}`,
  ];
  const res = spawnSync('bunx', args, { cwd: repoRoot, encoding: 'utf8' });
  // The canonical frontend/playwright.config.ts writes the JUnit report to
  // frontend/playwright/test-results/.last-run.junit.xml (relative to the
  // config file); read that file for real per-file/criterion results.
  const junitPath = join(repoRoot, 'frontend', 'playwright', 'test-results', '.last-run.junit.xml');
  let xml = '';
  try {
    xml = readFileSync(junitPath, 'utf8');
  } catch {
    xml = '';
  }
  const t = parseJunitTotals(xml);
  return {
    ran: true,
    passed: t.tests - t.failures - t.skipped,
    failed: t.failures,
    skipped: t.skipped,
    exitCode: res.status ?? (res.error ? 1 : 0),
    junitPath,
    perCriterion: new Map(),
  };
}

function writeJunit(junitPath: string, xml: string): void {
  if (xml && xml.trim().length > 0) {
    writeFileSync(junitPath, xml, 'utf8');
  } else {
    const placeholder =
      '<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="unit" tests="0" failures="0" errors="0" skipped="0" time="0"></testsuite>\n';
    writeFileSync(junitPath, placeholder, 'utf8');
  }
}

// Materializes the canonical artifacts for --persist without deleting any existing
// run-dir (46 legacy runs preserved — REQ-TST-005). Results are passed in from the
// REAL execution performed in `runCommand` (W1).
async function writeRunArtifacts(opts: {
  projectId: string;
  runId: string;
  target: { view: string; feature: string | null; method: 'unit' | 'pwauto' | 'all' };
  bundlePath: string;
  rejected: string[];
  criteria: CriterionResult[];
  methodResults: MethodResult[];
}): Promise<{ runDir: string; summary: SummaryShape }> {
  const { projectId, runId, target, bundlePath, rejected, criteria, methodResults } = opts;
  const runDir = join(repoRoot, '.runtime', 'test-results', projectId, runId);
  mkdirSync(join(runDir, 'unit'), { recursive: true });
  mkdirSync(join(runDir, 'pwauto'), { recursive: true });

  const startedAt = new Date().toISOString();
  const finishedAt = new Date().toISOString();

  const buildSummary = (method: 'unit' | 'pwauto' | 'all'): SummaryShape => ({
    run_id: runId,
    started_at: startedAt,
    finished_at: finishedAt,
    target: { view: target.view, feature: target.feature, method },
    passed: methodResults.reduce((a, m) => a + m.passed, 0),
    failed: methodResults.reduce((a, m) => a + m.failed, 0),
    skipped: methodResults.reduce((a, m) => a + m.skipped, 0),
    criteria,
    methods:
      method === 'all'
        ? methodResults
        : methodResults.filter((m) => m.method === method),
  });

  const summary = buildSummary(target.method);

  writeFileSync(join(runDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');

  // Canonical layout {unit,pwauto}/{junit.xml,results.json,summary.json}: both
  // method dirs always materialized; each carries a method-scoped summary. The
  // junit.xml is the REAL per-method JUnit captured during execution (W1).
  for (const method of ['unit', 'pwauto'] as const) {
    const methodDir = join(runDir, method);
    const mRes = methodResults.find((m) => m.method === method);
    writeFileSync(
      join(methodDir, 'results.json'),
      JSON.stringify(mRes?.results ?? [], null, 2) + '\n',
      'utf8',
    );
    if (mRes?.junitPath && existsSync(mRes.junitPath)) {
      copyFileSync(mRes.junitPath, join(methodDir, 'junit.xml'));
    } else {
      writeJunit(join(methodDir, 'junit.xml'), '');
    }
    writeFileSync(
      join(methodDir, 'summary.json'),
      JSON.stringify(buildSummary(method), null, 2) + '\n',
      'utf8',
    );
  }

  // Write-back coverage for criteria with REAL execution coverage (TST-11/PCT-92),
  // explicit bundle_path. Only `covered`/`partial` reflect real results; `missing`
  // is never written as covered (W1). patchBundleCoverage is lazy (gray-matter dep).
  if (rejected.length === 0) {
    let patchBundleCoverage: typeof import('../backend/src/coverage-writer.ts')['patchBundleCoverage'];
    try {
      const mod = await import('../backend/src/coverage-writer.ts');
      patchBundleCoverage = mod.patchBundleCoverage;
    } catch (err) {
      const detail = err instanceof Error ? `: ${err.message}` : '';
      throw new Error(
        `write-back requires backend deps (gray-matter); run 'bun install' in backend/ first${detail}`,
      );
    }
    const method = target.method === 'pwauto' ? 'PW-AUTO' : 'Unit';
    for (const c of criteria) {
      if (c.status !== 'covered' && c.status !== 'partial') continue;
      const w = patchBundleCoverage(bundlePath, method, c.status, { criterionId: c.id });
      if (!w.ok && !String(w.error ?? '').includes('not found')) {
        console.error(`write-back warning: ${c.id} @ ${bundlePath}: ${w.error}`);
      }
    }
  }

  return { runDir, summary };
}

async function runCommand(args: string[]): Promise<number> {
  let method: 'unit' | 'pwauto' | 'all' = 'unit';
  let targetSpec = 'projectctl';
  let persist = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--method') {
      const v = args[++i];
      if (v === 'unit' || v === 'pwauto' || v === 'all') method = v;
      else {
        console.error(`invalid --method=${v}`);
        return 2;
      }
    } else if (a?.startsWith('--method=')) {
      const v = a.slice('--method='.length);
      if (v === 'unit' || v === 'pwauto' || v === 'all') method = v;
      else {
        console.error(`invalid --method=${v}`);
        return 2;
      }
    } else if (a === '--target') {
      targetSpec = args[++i] ?? targetSpec;
    } else if (a?.startsWith('--target=')) {
      targetSpec = a.slice('--target='.length);
    } else if (a === '--persist') {
      persist = true;
    }
  }

  const colon = targetSpec.indexOf(':');
  const target = {
    view: colon >= 0 ? targetSpec.slice(0, colon) : targetSpec,
    feature: colon >= 0 ? targetSpec.slice(colon + 1) : null,
    method,
  };
  const bundlePath = resolveBundlePath(target);
  const wantsUnit = method === 'unit' || method === 'all';
  const wantsPwauto = method === 'pwauto' || method === 'all';

  // Header/AC rejection across discovered files for the selected method (PCT-90).
  // Rejection is fatal: exit 2, nothing executed/persisted (unchanged contract).
  const rejected: string[] = [];
  const unitAcTokens = new Map<string, Set<string>>();
  const pwautoAcTokens = new Map<string, Set<string>>();
  if (wantsUnit) {
    for (const f of discoverUnitFiles()) {
      try {
        const acs = assertAcHeader(f);
        for (const ac of acs) {
          if (!unitAcTokens.has(ac)) unitAcTokens.set(ac, new Set());
          unitAcTokens.get(ac)?.add(f);
        }
      } catch (err) {
        if (err instanceof AcRejectionError) rejected.push(err.message);
      }
    }
  }
  if (wantsPwauto) {
    for (const f of discoverPwautoSpecs()) {
      try {
        const acs = assertAcHeaderSpec(f);
        for (const ac of acs) {
          if (!pwautoAcTokens.has(ac)) pwautoAcTokens.set(ac, new Set());
          pwautoAcTokens.get(ac)?.add(f);
        }
      } catch (err) {
        if (err instanceof AcRejectionError) rejected.push(err.message);
      }
    }
  }

  if (rejected.length > 0) {
    for (const r of rejected) console.error(r);
    return 2;
  }

  // Scope discovered ACs to the target bundle's own criteria (only criteria that
  // belong to the target are executed / written — no spurious writes to others).
  const bundleCriteriaIds = new Set(
    existsBundle(bundlePath)
      ? extractCriteria(readFileSync(bundlePath, 'utf8'))
          .map((c) => c.id)
          .filter((id): id is string => !!id)
      : [],
  );
  const scopeToBundle = (m: Map<string, Set<string>>): Map<string, Set<string>> => {
    const scoped = new Map<string, Set<string>>();
    for (const [ac, files] of m) {
      if (!bundleCriteriaIds.has(ac)) continue;
      scoped.set(ac, files);
    }
    return scoped;
  };
  const scopedUnit = scopeToBundle(unitAcTokens);
  const scopedPwauto = scopeToBundle(pwautoAcTokens);

  mkdirSync(execTmpDir, { recursive: true });
  const startedAt = new Date().toISOString();

  // Real execution per method (W1). Results (junit / pass-fail / criteria) are
  // derived from the ACTUAL test command output.
  const methodResults: MethodResult[] = [];
  const executedCriteria = new Map<string, AppMapCoverageState>();
  let anyMethodFailed = false;
  // merge: a later method may add coverage but must not downgrade an existing
  // covered/partial result for a criterion it did not run.
  const mergeCoverage = (m: Map<string, AppMapCoverageState>): void => {
    for (const [c, st] of m) {
      const existing = executedCriteria.get(c);
      if (!existing || existing === 'missing') executedCriteria.set(c, st);
    }
  };

  if (wantsUnit) {
    const unitFiles: string[] = Array.from(scopedUnit.values())
      .reduce((acc, s) => acc.concat([...s]), [] as string[]);
    const junitOut = join(execTmpDir, `unit-${target.view}-${Date.now()}.junit.xml`);
    const outcome = runUnitExecution(unitFiles, junitOut);
    const coverage = deriveCriterionCoverage(
      scopedUnit,
      existsSync(junitOut) ? readFileSync(junitOut, 'utf8') : '',
    );
    mergeCoverage(coverage);
    // Only a run that actually executed tests contributes a test-failure exit.
    anyMethodFailed = anyMethodFailed || (outcome.ran && (outcome.failed > 0 || (outcome.exitCode ?? 0) > 0));
    methodResults.push({
      method: 'unit',
      passed: outcome.passed,
      failed: outcome.failed,
      skipped: outcome.skipped,
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: outcome.exitCode,
      junitPath: outcome.junitPath,
      results: [],
    });
  }

  if (wantsPwauto && scopedPwauto.size > 0) {
    const outcome = runPwautoExecution(target.view, target.feature);
    const pwautoXmlPath = outcome.junitPath && existsSync(outcome.junitPath)
      ? outcome.junitPath
      : '';
    const coverage = deriveCriterionCoverage(
      scopedPwauto,
      pwautoXmlPath ? readFileSync(pwautoXmlPath, 'utf8') : '',
    );
    mergeCoverage(coverage);
    anyMethodFailed = anyMethodFailed || (outcome.ran && (outcome.failed > 0 || (outcome.exitCode ?? 0) > 0));
    methodResults.push({
      method: 'pwauto',
      passed: outcome.passed,
      failed: outcome.failed,
      skipped: outcome.skipped,
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: outcome.exitCode,
      junitPath: outcome.junitPath,
      results: [],
    });
  } else if (wantsPwauto) {
    // No scoped pwauto spec for this target: record a no-test method result
    // (ran=false, exitCode 0) — criteria[] stays `missing`, nothing fabricated.
    methodResults.push({
      method: 'pwauto',
      passed: 0,
      failed: 0,
      skipped: 0,
      startedAt,
      finishedAt: new Date().toISOString(),
      exitCode: 0,
      junitPath: null,
      results: [],
    });
  }

  // criteria[] reflects REAL results and the target bundle's declared state:
  //   - scoped criteria that executed → covered/partial from real junit output;
  //   - target criteria declared `not-applicable` → not-applicable;
  //   - any other target criterion with no executed test → missing (never a
  //     fabricated `covered` — W1).
  const criteria: CriterionResult[] = [];
  const bundleCriteria = existsBundle(bundlePath)
    ? extractCriteria(readFileSync(bundlePath, 'utf8'))
    : [];
  for (const bc of bundleCriteria) {
    const id = bc.id;
    if (!id) continue;
    if (bc.functional === 'not-applicable') {
      criteria.push({ id, status: 'not-applicable' });
      continue;
    }
    criteria.push({ id, status: executedCriteria.get(id) ?? 'missing' });
  }
  const scopedAll = new Map([...scopedUnit, ...scopedPwauto]);
  for (const id of scopedAll.keys()) {
    if (bundleCriteria.some((bc) => bc.id === id)) continue;
    criteria.push({ id, status: executedCriteria.get(id) ?? 'missing' });
  }

  if (persist) {
    const runId = randomUUID();
    const projectId = resolveProjectId();
    try {
      const { runDir } = await writeRunArtifacts({
        projectId,
        runId,
        target,
        bundlePath,
        rejected,
        criteria,
        methodResults,
      });
      console.log(`run ${runId} persisted: ${relative(repoRoot, runDir)}`);
    } catch (err) {
      console.error(`persist failed: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
  }

  return anyMethodFailed ? 1 : 0;
}

// ---- Gate: check (TST-13 / PCT-93 / AD-08) ----

function runCheck(): number {
  // AD-08: `check` recorre el inventory (buildInventory + discovery del repo).
  const inventory = buildInventory(repoRoot);
  const violations: string[] = [];
  walkNavBundles((bundleAbs, criteria) => {
    for (const c of criteria) {
      if (c.functional !== 'implemented') continue;
      const cov = c.coverage ?? {};
      const unit = cov.Unit;
      const pwauto = cov['PW-AUTO'];
      const unitOk = unit === 'covered' || unit === 'partial';
      const pwautoOk = pwauto === 'covered' || pwauto === 'partial';
      if (!unitOk && !pwautoOk) {
        const inv = c.id ? inventory.criteria[c.id] : undefined;
        const candidate = inv
          ? `(candidate Unit=${inv.hasUnitTest}, PW-AUTO=${inv.hasPwautoSpec})`
          : '(no inventory entry)';
        violations.push(
          `${relative(repoRoot, bundleAbs)} :: ${c.id} (Unit=${unit ?? 'missing'}, PW-AUTO=${pwauto ?? 'missing'}) ${candidate}`,
        );
      }
    }
  });

  if (violations.length === 0) {
    console.log('test:check OK: no implemented criterion missing Unit+PW-AUTO coverage');
    return 0;
  }
  for (const v of violations) console.error(`test:check FAIL: ${v}`);
  return 1;
}

function walkNavBundles(
  cb: (bundleAbs: string, criteria: Array<{ id?: string; functional?: string; coverage?: Record<string, AppMapCoverageState> }>) => void,
): void {
  const navPath = join(repoRoot, 'docs', 'app-map', 'navigation.yaml');
  let navRaw: string;
  try {
    navRaw = readFileSync(navPath, 'utf8');
  } catch {
    return;
  }
  const bundleRelRe = /bundle:\s*['"]?([^'"\n]+)['"]?/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = bundleRelRe.exec(navRaw))) {
    const rel = (m[1] ?? '').trim();
    if (!rel) continue;
    const abs = join(repoRoot, 'docs', 'app-map', `${rel}.md`);
    if (seen.has(abs)) continue;
    seen.add(abs);
    try {
      const criteria = extractCriteria(readFileSync(abs, 'utf8'));
      if (criteria.length === 0) continue;
      cb(abs, criteria);
    } catch {
      // skip unreadable/missing bundle
    }
  }
}

// Minimal YAML frontmatter extractor used ONLY by the gate. The authoritative
// parse lives in backend/src/coverage-writer.ts (dumpBundleAtomic / gray-matter);
// this defensive parse reads id / functional / coverage.<METHOD> per criterion.
function extractCriteria(src: string): Array<{
  id?: string;
  functional?: string;
  coverage?: Record<string, AppMapCoverageState>;
}> {
  const match = /^---\n([\s\S]*?)\n---/.exec(src);
  if (!match) return [];
  const body = match[1];
  const out: Array<{ id?: string; functional?: string; coverage?: Record<string, AppMapCoverageState> }> = [];
  const blocks = body.split(/(?=^\s*- id:)/gm);
  for (const block of blocks) {
    if (!/^\s*- id:/m.test(block)) continue;
    const entry: { id?: string; functional?: string; coverage?: Record<string, AppMapCoverageState> } = {};
    const id = /^\s*- id:\s*(.+)$/m.exec(block);
    if (id) entry.id = id[1].trim();
    const functional = /^\s*functional:\s*(.+)$/m.exec(block);
    if (functional) entry.functional = functional[1].trim();
    const coverage: Record<string, AppMapCoverageState> = {};
    const covRe = /^\s*(Unit|PW-CLI|PW-AUTO|Manual):\s*(.+)$/gm;
    let cm: RegExpExecArray | null;
    while ((cm = covRe.exec(block))) {
      coverage[cm[1]] = cm[2].trim() as AppMapCoverageState;
    }
    if (Object.keys(coverage).length > 0) entry.coverage = coverage;
    out.push(entry);
  }
  return out;
}

// ---- Entry ----

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const [cmd] = args;
  if (cmd === 'check') return runCheck();
  if (cmd === 'run') return runCommand(args.slice(1));
  console.error(
    'usage: bun run scripts/test-runner.ts run --method=<unit|pwauto|all> --target=<view>[:<feature>] [--persist]\n' +
      '       bun run scripts/test-runner.ts check',
  );
  return 2;
}

main().then((code) => {
  process.exitCode = code;
});
