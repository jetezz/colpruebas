#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { slugify } from '../../../types/scripts/slugify.ts';

// Single-pass req-fixer orchestrator (ODD determinism MVP-4).
// Runs the five requirements validators in dependency order, applies scope
// filters where scripts lack flags, enforces F3/F4 only-sets, counts the
// iteration budget, writes an MVP-2-compatible report JSON, and prints the
// exact req-fixer template. It never implements fixes: the agent repairs,
// then re-invokes with --iteration/--prior-report.

type Issue = { path: string; message: string; [key: string]: unknown };
type ValidatorKey = 'criterios' | 'docs' | 'estructura' | 'code' | 'test';
type ValidatorStatus = 'pass' | 'fail' | 'skip' | 'deferred-docs';

// Dependency order from fixer/SKILL.md section 1. Never reorder.
const ORDER: ValidatorKey[] = ['criterios', 'docs', 'estructura', 'code', 'test'];
const F3_SET: ValidatorKey[] = ['criterios', 'estructura', 'code', 'test'];
const F4_ALLOWED: ValidatorKey[] = ['docs', 'test'];
const MAX_ITERATIONS = 5;

interface Options {
  root: string;
  view?: string;
  feature?: string;
  onlyRaw: string[];
  state?: string;
  reportDir?: string;
  iterationRaw?: string;
  priorReport?: string;
  json: boolean;
  help: boolean;
}

function help(): string {
  return `Single-pass req-fixer orchestrator (no fixes, only validation + report).

Usage: bun run-req-fixer-loop.ts --state <p3_requirements|p4_requirements_docs> [--root DIR] [--view ID] [--feature NAME] [--only LIST] [--report-dir DIR] [--iteration N] [--prior-report FILE] [--json]

  --root DIR        Project root (default: current directory)
  --view ID         Limit to one navigation view id
  --feature NAME    Limit to one feature name; requires --view when ambiguous
  --only LIST       Comma-separated subset of criterios,docs,estructura,code,test (ES/EN aliases); repeatable
  --state STATE     p3_requirements (F3: criterios,estructura,code,test; docs forbidden) or p4_requirements_docs (F4: docs + mandatory test recheck)
  --report-dir DIR  Artifact folder; requires --state (writes p3_requirements.report.json or p4_requirements_docs.report.json)
  --iteration N     Iteration number 1..5 (default 1; 1 is the baseline)
  --prior-report F  Previous report JSON; enforces same scope and N = prior + 1
  --json            Print machine-readable report JSON instead of the human template
  --help, -h        Show this help

Order: criterios -> docs -> estructura (structure+paths) -> code -> test.
Structure validators accept no scope flags (filtered here); tests accept no
--feature (filtered in-YAML here); --feature without --view that matches more
than one view exits 2. Budget: iteration 1 is the baseline, at most 5 total.

Exits: 0 green, 1 blocked (validation red, budget exhausted, scope mismatch), 2 usage error.`;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { root: process.cwd(), onlyRaw: [], json: false, help: false };
  const seenSingle = new Set<string>();
  const takeValue = (flag: string, attached: string | undefined, i: { pos: number }): string => {
    if (attached !== undefined && attached !== '') return attached;
    const next = argv[i.pos + 1];
    if (next === undefined || next.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    i.pos += 1;
    return next;
  };
  const cursor = { pos: 0 };
  while (cursor.pos < argv.length) {
    const arg = argv[cursor.pos]!;
    if (arg === '--help' || arg === '-h') { opts.help = true; cursor.pos += 1; continue; }
    if (arg === '--json') { opts.json = true; cursor.pos += 1; continue; }
    const eq = arg.indexOf('=');
    const flag = eq >= 0 ? arg.slice(0, eq) : arg;
    const attached = eq >= 0 ? arg.slice(eq + 1) : undefined;
    if (flag === '--root' || flag === '--view' || flag === '--feature' || flag === '--state' || flag === '--report-dir' || flag === '--iteration' || flag === '--prior-report') {
      if (seenSingle.has(flag)) throw new Error(`Option supplied more than once: ${flag}`);
      seenSingle.add(flag);
      const value = takeValue(flag, attached, cursor);
      if (!value.trim() || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      if (flag === '--root') opts.root = resolve(value);
      else if (flag === '--view') opts.view = value;
      else if (flag === '--feature') opts.feature = value;
      else if (flag === '--state') opts.state = value;
      else if (flag === '--report-dir') opts.reportDir = resolve(value);
      else if (flag === '--iteration') opts.iterationRaw = value;
      else opts.priorReport = resolve(value);
      cursor.pos += 1;
      continue;
    }
    if (flag === '--only') {
      const value = takeValue(flag, attached, cursor);
      if (!value.trim() || value.startsWith('--')) throw new Error(`Missing value for --only`);
      opts.onlyRaw.push(value);
      cursor.pos += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return opts;
}

// Normalize ES/EN aliases to canonical keys. Throws on unknown names.
function normalizeOnly(raw: string[]): ValidatorKey[] | undefined {
  if (raw.length === 0) return undefined;
  const out: ValidatorKey[] = [];
  const alias = (name: string): ValidatorKey => {
    const lower = name.trim().toLowerCase();
    if (lower === 'criterios' || lower === 'criteria' || lower === 'criterion' || lower === 'criterio') return 'criterios';
    if (lower === 'docs' || lower === 'doc' || lower === 'documentation' || lower === 'documentacion' || lower === 'documentación') return 'docs';
    if (lower === 'estructura' || lower === 'structure' || lower === 'estructuras') return 'estructura';
    if (lower === 'code' || lower === 'codigo' || lower === 'código') return 'code';
    if (lower === 'test' || lower === 'tests' || lower === 'prueba' || lower === 'pruebas') return 'test';
    throw new Error(`Unknown --only entry: ${name}`);
  };
  for (const chunk of raw) {
    for (const part of chunk.split(',')) {
      if (!part.trim()) throw new Error('Empty --only entry');
      const key = alias(part);
      if (!out.includes(key)) out.push(key);
    }
  }
  // Keep dependency order regardless of input order.
  return ORDER.filter(k => out.includes(k));
}

interface NavCriterion { id: string; viewId: string; featureName: string; type: string }
interface NavData { views: { id: string; features: { name: string; criteria: { id: string; type: string }[] }[] }[] }

// Best-effort navigation load for scope filtering and ambiguity checks.
function loadNav(root: string): NavData | null {
  try {
    const raw = readFileSync(join(root, 'docs', 'app-map', 'navigation.yaml'), 'utf8');
    const parsed = Bun.YAML.parse(raw) as { views?: { id?: unknown; features?: { name?: unknown; criteria?: { id?: unknown; type?: unknown }[] }[] }[] };
    if (!parsed || !Array.isArray(parsed.views)) return null;
    const views = parsed.views
      .filter(v => typeof v?.id === 'string')
      .map(v => ({
        id: v.id as string,
        features: (Array.isArray(v.features) ? v.features : [])
          .filter(f => typeof f?.name === 'string')
          .map(f => ({
            name: f.name as string,
            criteria: (Array.isArray(f.criteria) ? f.criteria : [])
              .filter(c => typeof c?.id === 'string')
              .map(c => ({ id: c.id as string, type: typeof c.type === 'string' ? (c.type as string) : '' })),
          })),
      }));
    return { views };
  } catch {
    return null;
  }
}

function scopedCriteria(nav: NavData | null, view: string | undefined, feature: string | undefined): NavCriterion[] {
  if (!nav) return [];
  const out: NavCriterion[] = [];
  for (const v of nav.views) {
    if (view !== undefined && v.id !== view) continue;
    for (const f of v.features) {
      if (feature !== undefined && f.name !== feature) continue;
      for (const c of f.criteria) out.push({ id: c.id, viewId: v.id, featureName: f.name, type: c.type });
    }
  }
  return out;
}

function needlesFor(view: string | undefined, feature: string | undefined, criteria: NavCriterion[]): string[] {
  const set = new Set<string>();
  if (view) { set.add(view); set.add(slugify(view)); }
  if (feature) { set.add(feature); set.add(slugify(feature)); }
  for (const c of criteria) {
    set.add(c.id);
    set.add(slugify(c.id));
    set.add(c.viewId);
    set.add(slugify(c.viewId));
    set.add(c.featureName);
    set.add(slugify(c.featureName));
    if (c.type) set.add(c.type);
  }
  return [...set].filter(s => s.length > 0);
}

function mentionsScope(issue: Issue, needles: string[]): boolean {
  const hay = `${String(issue.path ?? '')} ${String(issue.message ?? '')}`;
  return needles.some(n => n.length > 0 && hay.includes(n));
}

function runValidator(script: string, root: string, extra: string[]): { valid: boolean; issues: Issue[]; exitCode: number } {
  const proc = Bun.spawnSync(['bun', script, '--root', root, '--json', ...extra], { stdout: 'pipe', stderr: 'pipe' });
  const out = proc.stdout.toString();
  try {
    const parsed = JSON.parse(out || 'null') as { valid?: boolean; issues?: Issue[] };
    const issues = Array.isArray(parsed?.issues) ? (parsed.issues as Issue[]) : [];
    const valid = parsed?.valid === true && issues.length === 0;
    return { valid, issues, exitCode: proc.exitCode ?? 1 };
  } catch {
    const err = (proc.stderr.toString() || out || 'validator produced no JSON').trim();
    return { valid: false, issues: [{ path: 'validator', message: err }], exitCode: proc.exitCode ?? 1 };
  }
}

interface PerValidator { status: ValidatorStatus; issues: Issue[] }

function templateOf(params: { view: string; feature: string; only: ValidatorKey[]; iteration: number; status: string; results: Record<ValidatorKey, PerValidator> }): string {
  const lines: string[] = [];
  lines.push('## req-fixer report');
  lines.push(`- scope: view=${params.view} feature=${params.feature} only=${params.only.join(',')}`);
  lines.push(`- iterations: ${params.iteration}/5`);
  lines.push(`- status: ${params.status}`);
  lines.push('- validators:');
  for (const key of ORDER) {
    const r = params.results[key];
    lines.push(`  - ${key}: ${r.status} (${r.issues.length} issues)`);
  }
  lines.push('- fixes applied: none (single-pass orchestrator; agent applies fixes then re-invokes with --iteration/--prior-report)');
  const remaining = ORDER.flatMap(k => params.results[k].issues);
  if (params.status === 'blocked') {
    lines.push(`- remaining: ${JSON.stringify(remaining)}`);
  }
  return lines.join('\n');
}

function failUsage(message: string): never {
  console.error(`${message}\n\n${help()}`);
  process.exit(2);
}

function failBlocked(message: string, json: boolean, partial?: unknown): never {
  if (json) console.log(JSON.stringify({ valid: false, error: message, ...(typeof partial === 'object' && partial !== null ? partial as Record<string, unknown> : {}) }, null, 2));
  else console.error(message);
  process.exit(1);
}

function main(argv: string[]): void {
  let opts: Options;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    failUsage(error instanceof Error ? error.message : String(error));
  }
  if (opts.help) { console.log(help()); return; }

  // Validate --state early (usage error on unknown values).
  if (opts.state !== undefined && opts.state !== 'p3_requirements' && opts.state !== 'p4_requirements_docs') {
    failUsage(`Unknown --state: ${opts.state} (expected p3_requirements or p4_requirements_docs)`);
  }
  if (opts.reportDir !== undefined && opts.state === undefined) {
    failUsage('--report-dir requires --state to select the artifact filename');
  }

  // Normalize --only (usage error on unknown entries).
  let onlyRequested: ValidatorKey[] | undefined;
  try {
    onlyRequested = normalizeOnly(opts.onlyRaw);
  } catch (error) {
    failUsage(error instanceof Error ? error.message : String(error));
  }

  // Enforce F3/F4 only-sets before running anything (usage errors).
  let effectiveOnly: ValidatorKey[];
  if (opts.state === 'p3_requirements') {
    if (onlyRequested !== undefined && onlyRequested.includes('docs')) {
      failUsage('F3 forbids docs: p3_requirements only=criterios,estructura,code,test (never write docs/app-map/**/*.md)');
    }
    effectiveOnly = onlyRequested ?? [...F3_SET];
    if (effectiveOnly.some(k => k === 'docs')) failUsage('F3 forbids docs');
  } else if (opts.state === 'p4_requirements_docs') {
    if (onlyRequested !== undefined && onlyRequested.some(k => k !== 'docs' && k !== 'test')) {
      failUsage('F4 only=docs (+ mandatory test recheck): refusing non-docs entries');
    }
    if (onlyRequested !== undefined && !onlyRequested.includes('docs')) {
      failUsage('F4 requires docs: p4_requirements_docs only=docs (+ mandatory test recheck)');
    }
    // Test recheck is mandatory even when the caller passes only=docs.
    effectiveOnly = ['docs', 'test'];
  } else {
    effectiveOnly = onlyRequested ?? [...ORDER];
  }

  // Parse --iteration (usage error on malformed, blocked on budget overflow).
  let iteration = 1;
  if (opts.iterationRaw !== undefined) {
    const parsed = Number(opts.iterationRaw);
    if (!Number.isInteger(parsed) || parsed < 1) failUsage(`Invalid --iteration: ${opts.iterationRaw} (expected integer 1..5)`);
    iteration = parsed;
  }
  if (iteration > MAX_ITERATIONS) {
    failBlocked(`budget-exhausted: iteration ${iteration} exceeds ${MAX_ITERATIONS}`, opts.json, { iterations: iteration });
  }

  const root = resolve(opts.root);

  // Ambiguity gate: --feature without --view that matches several views exits 2.
  let nav = loadNav(root);
  let resolvedViewForTests: string | undefined = opts.view;
  let resolvedViewForScope: string | undefined = opts.view;
  if (opts.feature !== undefined && opts.view === undefined && nav !== null) {
    const owners = nav.views.filter(v => v.features.some(f => f.name === opts.feature));
    if (owners.length > 1) {
      failUsage(`ambiguous feature; specify --view: ${opts.feature}`);
    }
    if (owners.length === 1) {
      resolvedViewForTests = owners[0]!.id;
      resolvedViewForScope = owners[0]!.id;
    }
  }

  // Prior-report continuity: same scope and N = prior + 1, budget capped.
  if (opts.priorReport !== undefined) {
    let prior: unknown;
    try {
      prior = JSON.parse(readFileSync(opts.priorReport, 'utf8'));
    } catch (error) {
      failBlocked(`cannot read --prior-report: ${error instanceof Error ? error.message : String(error)}`, opts.json);
    }
    const record = prior as { iterations?: unknown; scope?: unknown; only?: unknown; state?: unknown };
    const priorIterations = typeof record.iterations === 'number' && Number.isInteger(record.iterations) ? record.iterations : undefined;
    if (priorIterations === undefined) failBlocked('invalid --prior-report: expected {iterations, scope}', opts.json);
    const priorScope = (record.scope ?? {}) as { view?: unknown; feature?: unknown };
    const priorView = typeof priorScope.view === 'string' ? priorScope.view : 'all';
    const priorFeature = typeof priorScope.feature === 'string' ? priorScope.feature : 'all';
    const currentView = resolvedViewForScope ?? 'all';
    const currentFeature = opts.feature ?? 'all';
    const priorOnly = Array.isArray(record.only) ? [...(record.only as unknown[])].map(String).sort().join(',') : '';
    const currentOnly = [...effectiveOnly].sort().join(',');
    const priorState = typeof record.state === 'string' ? record.state : undefined;
    const currentState = opts.state;
    if (priorView !== currentView || priorFeature !== currentFeature || priorOnly !== currentOnly || priorState !== currentState) {
      failBlocked(`scope-mismatch: prior scope view=${priorView} feature=${priorFeature} only=${priorOnly} state=${priorState ?? '-'} != current view=${currentView} feature=${currentFeature} only=${currentOnly} state=${currentState ?? '-'} (no re-scope reset)`, opts.json, { iterations: iteration });
    }
    const expected = (priorIterations as number) + 1;
    if (opts.iterationRaw === undefined) {
      iteration = expected;
    } else if (iteration !== expected) {
      failBlocked(`scope-mismatch: expected --iteration ${expected} after prior ${priorIterations} (got ${iteration})`, opts.json, { iterations: iteration });
    }
    if (iteration > MAX_ITERATIONS) {
      failBlocked(`budget-exhausted: iteration ${iteration} exceeds ${MAX_ITERATIONS}`, opts.json, { iterations: iteration });
    }
  }

  // Resolve validator script paths relative to this file (never CWD).
  const dir = import.meta.dir;
  const criteriaScript = resolve(dir, '../../criterios/scripts/validate-criteria.ts');
  const docsScript = resolve(dir, '../../docs/scripts/validate-app-map-docs.ts');
  const structureScript = resolve(dir, '../../estructura/scripts/validate-structure.ts');
  const pathsScript = resolve(dir, '../../estructura/scripts/check-paths.ts');
  const codeScript = resolve(dir, '../../code/scripts/validate-code.ts');
  const testsScript = resolve(dir, '../../test/scripts/validate-tests.ts');

  const viewFeatureArgs: string[] = [];
  if (opts.view) viewFeatureArgs.push('--view', opts.view);
  if (opts.feature) viewFeatureArgs.push('--feature', opts.feature);
  const testsArgs: string[] = [];
  if (resolvedViewForTests) testsArgs.push('--view', resolvedViewForTests);

  // Reload navigation after potential prior checks (same object is fine).
  if (nav === null) nav = loadNav(root);
  const criteriaForFilter = scopedCriteria(nav, resolvedViewForScope, opts.feature);
  const needles = needlesFor(resolvedViewForScope, opts.feature, criteriaForFilter);
  const scoped = resolvedViewForScope !== undefined || opts.feature !== undefined;

  const results = {} as Record<ValidatorKey, PerValidator>;
  const shouldRun = (key: ValidatorKey): boolean => effectiveOnly.includes(key);

  // 1. criterios (supports --view/--feature directly).
  if (!shouldRun('criterios')) {
    results.criterios = { status: 'skip', issues: [] };
  } else {
    const run = runValidator(criteriaScript, root, viewFeatureArgs);
    results.criterios = { status: run.issues.length === 0 ? 'pass' : 'fail', issues: run.issues };
  }

  // 2. docs (preflight criterios internally; same scope flags).
  if (!shouldRun('docs')) {
    results.docs = { status: 'skip', issues: [] };
  } else {
    const run = runValidator(docsScript, root, viewFeatureArgs);
    results.docs = { status: run.issues.length === 0 ? 'pass' : 'fail', issues: run.issues };
  }

  // 3. estructura: both scripts run project-wide, then filtered to scope.
  if (!shouldRun('estructura')) {
    results.estructura = { status: 'skip', issues: [] };
  } else {
    const structure = runValidator(structureScript, root, []);
    const paths = runValidator(pathsScript, root, []);
    const combined = [...structure.issues, ...paths.issues];
    const filtered = scoped ? combined.filter(i => mentionsScope(i, needles)) : combined;
    results.estructura = { status: filtered.length === 0 ? 'pass' : 'fail', issues: filtered };
  }

  // 4. code (supports --view/--feature directly).
  if (!shouldRun('code')) {
    results.code = { status: 'skip', issues: [] };
  } else {
    const run = runValidator(codeScript, root, viewFeatureArgs);
    results.code = { status: run.issues.length === 0 ? 'pass' : 'fail', issues: run.issues };
  }

  // 5. test (supports --view only; --feature filtered in-YAML here).
  if (!shouldRun('test')) {
    results.test = { status: 'skip', issues: [] };
  } else {
    const run = runValidator(testsScript, root, testsArgs);
    let issues = run.issues;
    if (scoped && opts.feature !== undefined && issues.length > 0) {
      // In-YAML feature filtering: keep issues mentioning the feature slice.
      const featureNeedles = needlesFor(resolvedViewForScope, opts.feature, criteriaForFilter);
      const kept = issues.filter(i => mentionsScope(i, featureNeedles));
      // Fail closed: if the validator reports global/YAML issues without a
      // scope needle, keep them rather than certifying a slice as green.
      issues = kept.length > 0 || issues.length === 0 ? kept : issues;
      // Reconsider: when filtering removes everything, the slice is green.
      // When nothing matches the slice but issues remain, keep them (fail closed).
      if (kept.length === 0) {
        const anyNeedle = issues.some(i => mentionsScope(i, featureNeedles));
        issues = anyNeedle ? kept : issues;
      } else {
        issues = kept;
      }
    }
    if (issues.length === 0) {
      results.test = { status: 'pass', issues: [] };
    } else if (opts.state === 'p3_requirements' && issues.every(i => String(i.path) === 'docs prerequisite')) {
      // F3 deferred-docs: docs are out of scope, so a docs-only test red waits for F4.
      results.test = { status: 'deferred-docs', issues };
    } else {
      results.test = { status: 'fail', issues };
    }
  }

  // Overall status: skipped validators never block; deferred-docs never blocks F3.
  let status: 'green' | 'blocked' = 'green';
  for (const key of ORDER) {
    if (!shouldRun(key)) continue;
    const entry = results[key];
    if (entry.status === 'fail') { status = 'blocked'; break; }
    if (entry.status === 'deferred-docs') continue;
    if (entry.status !== 'pass') { status = 'blocked'; break; }
  }

  const scopeView = resolvedViewForScope ?? 'all';
  const scopeFeature = opts.feature ?? 'all';
  const report = {
    status,
    scope: { view: scopeView, feature: scopeFeature },
    iterations: iteration,
    maxIterations: MAX_ITERATIONS,
    only: [...effectiveOnly],
    state: opts.state ?? null,
    validators: {
      criterios: { status: results.criterios.status, count: results.criterios.issues.length, issues: results.criterios.issues },
      docs: { status: results.docs.status, count: results.docs.issues.length, issues: results.docs.issues },
      estructura: { status: results.estructura.status, count: results.estructura.issues.length, issues: results.estructura.issues },
      code: { status: results.code.status, count: results.code.issues.length, issues: results.code.issues },
      test: { status: results.test.status, count: results.test.issues.length, issues: results.test.issues },
    },
    fixes: [] as string[],
    remaining: ORDER.flatMap(k => results[k].issues),
  };

  // Artifact write (only side effect allowed): fixed filename per --state.
  if (opts.reportDir !== undefined && opts.state !== undefined) {
    const file = opts.state === 'p3_requirements' ? 'p3_requirements.report.json' : 'p4_requirements_docs.report.json';
    mkdirSync(opts.reportDir, { recursive: true });
    writeFileSync(join(opts.reportDir, file), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(templateOf({ view: scopeView, feature: scopeFeature, only: [...effectiveOnly], iteration, status, results }));
  }
  process.exit(status === 'green' ? 0 : 1);
}

if (import.meta.main) main(process.argv.slice(2));
