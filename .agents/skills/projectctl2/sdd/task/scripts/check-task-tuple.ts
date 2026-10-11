#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { projectRoot, readTaskDocument } from './task-file.ts';
import { WorkflowCatalog, WorkflowPhaseIds, type WorkflowPhaseId } from '../../../types/contracts/workflow.ts';
import type { TaskDocument } from '../../../types/contracts/index.ts';

// Minimal p3_test_running.report.json shape (reader contract, MVP-2).
// The orchestrator writes this file; this checker only reads it.
export type TestRunningSuiteStatus = 'pass' | 'fail' | 'skip';
export interface TestRunningSuite {
  name: string;
  status: TestRunningSuiteStatus;
  tests?: number;
}
export type TestRunningStatus = 'green' | 'blocked' | 'skip';
export interface TestRunningReport {
  status: TestRunningStatus;
  suites: TestRunningSuite[];
}
// Fixture example of a green test-running report, reused by the test suite.
export const TEST_RUNNING_REPORT_EXAMPLE: TestRunningReport = {
  status: 'green',
  suites: [{ name: 'bun test .agents/skills/projectctl2/sdd/task/scripts/', status: 'pass', tests: 6 }],
};

// Minimal req-fixer report shape read by this checker: only status and scope
// matter here; any extra validator detail is ignored.
export type ReqFixerStatus = 'green' | 'blocked';
export interface ReqFixerScope {
  view?: string;
  feature?: string;
}
export interface ReqFixerReport {
  status: ReqFixerStatus;
  scope?: ReqFixerScope;
  [key: string]: unknown;
}

const TEST_RUNNING_FILE = 'p3_test_running.report.json';
const F3_FILE = 'p3_requirements.report.json';
const F4_FILE = 'p4_requirements_docs.report.json';

const phaseOrder = WorkflowPhaseIds;
const phases: ReadonlySet<WorkflowPhaseId> = new Set(phaseOrder);

// Canonical literals typed against the workflow catalog (types/contracts/workflow.ts).
const FASE_1_PROPUESTA: WorkflowPhaseId = 'fase_1_propuesta';
const FASE_2_IMPLEMENTACION: WorkflowPhaseId = 'fase_2_implementacion';
const FASE_3_VERIFICACION: WorkflowPhaseId = 'fase_3_verificacion';
const P3_REQUIREMENTS = 'p3_requirements';
const P4_REQUIREMENTS_DOCS = 'p4_requirements_docs';
const P4_DONE = 'p4_done';

// Documented backward edges from sdd/phases/SKILL.md (rejected proposal,
// failed code review, rejected functionality). Any other backward move is blocked.
const BACK_EDGES: Record<string, string[]> = {
  p1_awaiting_acceptance: ['p1_exploring'],
  p2_code_review: ['p2_implementing'],
  p2_awaiting_acceptance: ['p2_implementing'],
};

export type TupleCheck = { ok: true } | { ok: false; rule: string; expected: string; actual: string };

export interface ReportSet {
  testRunning: ReportRead;
  f3: ReportRead;
  f4: ReportRead;
  dir: string;
}

export type ReportRead = { found: true; data: unknown } | { found: false; reason: string };

function blocked(rule: string, expected: string, actual: string): TupleCheck {
  return { ok: false, rule, expected, actual };
}

function isPhase(value: string): value is WorkflowPhaseId {
  return phases.has(value as WorkflowPhaseId);
}

// Same non-empty semantics as set-phase.ts: strings need visible content,
// arrays/objects need at least one entry.
function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function scopeDesc(appMap: TaskDocument['app_map']): string {
  if (appMap === '') return 'view=all feature=all';
  return `view=${appMap.view.id} feature=${appMap.feature.name}`;
}

// A whole-project task ('') matches an absent or all/all report scope.
// A scoped task matches only the exact view id (or name) and feature name.
function scopeMatches(appMap: TaskDocument['app_map'], scope: unknown): boolean {
  const text = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;
  if (appMap === '') {
    if (scope === undefined || scope === null) return true;
    if (typeof scope !== 'object' || Array.isArray(scope)) return false;
    const view = text((scope as ReqFixerScope).view);
    const feature = text((scope as ReqFixerScope).feature);
    return (!view || view === 'all') && (!feature || feature === 'all');
  }
  if (scope === null || typeof scope !== 'object' || Array.isArray(scope)) return false;
  const view = text((scope as ReqFixerScope).view);
  const feature = text((scope as ReqFixerScope).feature);
  return (view === appMap.view.id || view === appMap.view.name) && feature === appMap.feature.name;
}

export function readReport(dir: string, file: string): ReportRead {
  let raw: string;
  try {
    raw = readFileSync(join(dir, file), 'utf8');
  } catch {
    return { found: false, reason: `missing ${file}` };
  }
  try {
    return { found: true, data: JSON.parse(raw) };
  } catch {
    return { found: false, reason: `invalid JSON in ${file}` };
  }
}

// Tests evidence is green, or an empty skip when no test applies.
// Anything else (missing, blocked, non-empty skip, malformed) fails the gate.
function testsEvidence(report: ReportRead): { ok: true } | { ok: false; actual: string } {
  if (!report.found) return { ok: false, actual: report.reason };
  const data = report.data as Partial<TestRunningReport> | null;
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.suites)) {
    return { ok: false, actual: `invalid ${TEST_RUNNING_FILE}: expected {status, suites: [...]}` };
  }
  if (data.status === 'green') return { ok: true };
  if (data.status === 'skip' && data.suites.length === 0) return { ok: true };
  return { ok: false, actual: `${TEST_RUNNING_FILE} status: ${String(data.status)}` };
}

function gateReport(report: ReportRead, file: string, appMap: TaskDocument['app_map']): TupleCheck {
  const rule = file === F3_FILE ? 'f3-gate' : 'f4-gate';
  const expected = `green ${file} in scope (${scopeDesc(appMap)})`;
  if (!report.found) return blocked(rule, expected, report.reason);
  const data = report.data as Partial<ReqFixerReport> | null;
  if (!data || typeof data !== 'object' || Array.isArray(data) || (data.status !== 'green' && data.status !== 'blocked')) {
    return blocked(rule, expected, `invalid ${file}: expected {status: green|blocked, scope: {...}}`);
  }
  if (data.status !== 'green') return blocked(rule, expected, `${file} status: blocked`);
  if (!scopeMatches(appMap, data.scope)) {
    return blocked('scope', `scope ${scopeDesc(appMap)}`, `scope ${JSON.stringify(data.scope ?? null)} in ${file}`);
  }
  return { ok: true };
}

// Exit state required before leaving a phase. With requirements_fix==false the
// requirements states are skipped, so F3 is left from p3_test_running.
function exitState(phase: WorkflowPhaseId, requirementsFix: boolean): string {
  const order = WorkflowCatalog[phase];
  if (phase === FASE_3_VERIFICACION && !requirementsFix) return 'p3_test_running';
  return order[order.length - 1]!;
}

function checkPhaseEntry(task: TaskDocument, from: WorkflowPhaseId, to: WorkflowPhaseId, reports: ReportSet): TupleCheck {
  if (from === FASE_1_PROPUESTA) {
    const missing = ['app_map', 'expected', 'criteria', 'branch'].filter(
      field => !hasContent((task as unknown as Record<string, unknown>)[field]),
    );
    if (missing.length) {
      return blocked('f1-content', 'non-empty app_map, expected, criteria, branch', `missing: ${missing.join(', ')}`);
    }
    if (task.proposal_state !== 'approve') {
      return blocked('f1-approval', 'proposal_state: approve', `proposal_state: ${task.proposal_state}`);
    }
    return { ok: true };
  }
  if (from === FASE_2_IMPLEMENTACION) {
    if (task.functional_state !== 'approve') {
      return blocked('f2-approval', 'functional_state: approve', `functional_state: ${task.functional_state}`);
    }
    return { ok: true };
  }
  // F3 -> F4 always needs tests evidence; the F3 req-fixer report only with requirements_fix==true.
  const evidence = testsEvidence(reports.testRunning);
  if (!evidence.ok) return blocked('tests-evidence', `green ${TEST_RUNNING_FILE}`, evidence.actual);
  if (task.requirements_fix === true) {
    const gate = gateReport(reports.f3, F3_FILE, task.app_map);
    if (!gate.ok) return gate;
  }
  void to;
  return { ok: true };
}

function checkStateEntry(task: TaskDocument, targetState: string, reports: ReportSet): TupleCheck {
  if (targetState === P3_REQUIREMENTS) {
    if (task.requirements_fix !== true) {
      return blocked('requirements-skip', 'requirements_fix==false skips p3_requirements', 'target state: p3_requirements');
    }
    const evidence = testsEvidence(reports.testRunning);
    if (!evidence.ok) return blocked('tests-evidence', `green ${TEST_RUNNING_FILE}`, evidence.actual);
    return { ok: true };
  }
  if (targetState === P4_REQUIREMENTS_DOCS) {
    if (task.requirements_fix !== true) {
      return blocked('requirements-skip', 'requirements_fix==false skips p4_requirements_docs', 'target state: p4_requirements_docs');
    }
    return { ok: true };
  }
  if (targetState === P4_DONE) {
    if (typeof task.pr !== 'string' || !task.pr.trim()) {
      return blocked('p4-done', 'non-empty pr link', `pr: ${JSON.stringify(task.pr)}`);
    }
    if (task.requirements_fix === true) {
      const gate = gateReport(reports.f4, F4_FILE, task.app_map);
      if (!gate.ok) return gate;
    }
    return { ok: true };
  }
  return { ok: true };
}

export function checkTuple(task: TaskDocument, targetPhase: string, targetState: string, reports: ReportSet): TupleCheck {
  if (!isPhase(targetPhase)) {
    return blocked('catalog', `target-phase one of: ${phaseOrder.join(', ')}`, `unknown phase: ${targetPhase}`);
  }
  const targetStates = WorkflowCatalog[targetPhase] as readonly string[];
  if (!targetStates.includes(targetState)) {
    return blocked('catalog', `target-state one of: ${targetStates.join(', ')}`, `unknown state: ${targetState} for ${targetPhase}`);
  }

  const currentPhase = task.phase;
  const currentState = task.state;
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const targetIndex = phaseOrder.indexOf(targetPhase);
  if (targetIndex > currentIndex + 1) {
    return blocked('phase-skip', `at most one phase forward from ${currentPhase}`, `${currentPhase} -> ${targetPhase}`);
  }
  if (targetIndex < currentIndex) {
    return blocked(
      'phase-back',
      'no automatic backward move between phases; record a block and wait',
      `${currentPhase} -> ${targetPhase}`,
    );
  }
  if (targetIndex === currentIndex + 1) {
    const initial = (WorkflowCatalog[targetPhase] as readonly string[])[0];
    if (targetState !== initial) {
      return blocked('phase-entry', `enter ${targetPhase} at ${initial}`, `target state: ${targetState}`);
    }
    const exit = exitState(currentPhase, task.requirements_fix);
    if (currentState !== exit) {
      return blocked('phase-exit', `leave ${currentPhase} from ${exit}`, `current state: ${currentState}`);
    }
    return checkPhaseEntry(task, currentPhase, targetPhase, reports);
  }

  // Same phase: order the states per the graph.
  const order = WorkflowCatalog[currentPhase] as readonly string[];
  const currentStateIndex = order.indexOf(currentState);
  if (currentStateIndex < 0) {
    return blocked('state-order', `current state one of: ${order.join(', ')}`, `current state: ${currentState}`);
  }
  const targetStateIndex = order.indexOf(targetState);
  if (targetStateIndex === currentStateIndex) return { ok: true };
  if (targetStateIndex > currentStateIndex) {
    // With requirements_fix==false, F4 skips p4_requirements_docs on delivery.
    const skipsDocsGate =
      task.requirements_fix === false &&
      currentPhase === 'fase_4_documentacion' &&
      currentState === 'p4_documenting' &&
      targetState === P4_DONE;
    if (targetStateIndex > currentStateIndex + 1 && !skipsDocsGate) {
      return blocked(
        'state-skip',
        `next state after ${currentState}: ${order[currentStateIndex + 1]}`,
        `${currentState} -> ${targetState}`,
      );
    }
    return checkStateEntry(task, targetState, reports);
  }
  const allowed = BACK_EDGES[currentState] ?? [];
  if (allowed.includes(targetState)) return { ok: true };
  return blocked(
    'state-back',
    'backward move allowed only on rejection loops (p1_awaiting_acceptance->p1_exploring, p2_code_review->p2_implementing, p2_awaiting_acceptance->p2_implementing)',
    `${currentState} -> ${targetState}`,
  );
}

const usage = [
  'usage: bun check-task-tuple.ts --task <index> --target-phase <phase> --target-state <state> [--report-dir <dir>] [--json]',
  '',
  'Read-only tuple check: validates a target phase/state against the task frontmatter',
  'and convention reports in taskReadme/<id>-<slug>/ without mutating the task.',
  'Reports: p3_test_running.report.json, p3_requirements.report.json, p4_requirements_docs.report.json.',
  'Exits 0 when the tuple is allowed, 1 when blocked or invalid, 2 on usage errors.',
].join('\n');

interface CheckOptions {
  task: string;
  targetPhase: string;
  targetState: string;
  reportDir: string | undefined;
  json: boolean;
}

function parseArgs(argv: string[]): CheckOptions {
  const values: Record<string, string> = {};
  let json = false;
  let i = 0;
  const takeValue = (flag: string): string => {
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`option ${flag} requires a value`);
    i += 2;
    return value;
  };
  while (i < argv.length) {
    const arg = argv[i]!;
    if (arg === '--json') {
      json = true;
      i += 1;
    } else if (arg === '--task' || arg === '--target-phase' || arg === '--target-state' || arg === '--report-dir') {
      if (values[arg] !== undefined) throw new Error(`option supplied more than once: ${arg}`);
      values[arg] = takeValue(arg);
    } else {
      throw new Error(`unknown option: ${arg}`);
    }
  }
  for (const flag of ['--task', '--target-phase', '--target-state'] as const) {
    if (!values[flag]) throw new Error(`missing required option: ${flag}`);
  }
  return {
    task: values['--task']!,
    targetPhase: values['--target-phase']!,
    targetState: values['--target-state']!,
    reportDir: values['--report-dir'],
    json,
  };
}

function emit(result: TupleCheck, options: CheckOptions, task: TaskDocument): void {
  if (result.ok) {
    process.exitCode = 0;
    if (options.json) process.stdout.write(`${JSON.stringify({ ok: true })}\n`);
    else process.stdout.write(`ok: ${task.phase}/${task.state} -> ${options.targetPhase}/${options.targetState}\n`);
    return;
  }
  process.exitCode = 1;
  if (options.json) process.stdout.write(`${JSON.stringify(result)}\n`);
  else process.stderr.write(`BLOCKED [${result.rule}]: expected ${result.expected}; actual ${result.actual}\n`);
}

function main(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage}\n`);
    return;
  }
  let options: CheckOptions;
  try {
    options = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n${usage}\n`);
    process.exitCode = 2;
    return;
  }
  let task: TaskDocument;
  try {
    task = readTaskDocument(options.task);
  } catch (error) {
    process.exitCode = 1;
    const result: TupleCheck = blocked(
      'task-read',
      'readable task index with valid frontmatter',
      error instanceof Error ? error.message : String(error),
    );
    if (options.json) process.stdout.write(`${JSON.stringify(result)}\n`);
    else process.stderr.write(`BLOCKED [task-read]: ${result.actual}\n`);
    return;
  }
  // Convention: reports live next to the index in taskReadme/<id>-<slug>/.
  const dir = options.reportDir
    ? resolve(options.reportDir)
    : join(dirname(resolve(projectRoot(), options.task)), basename(options.task).replace(/\.md$/, ''));
  const reports: ReportSet = {
    testRunning: readReport(dir, TEST_RUNNING_FILE),
    f3: readReport(dir, F3_FILE),
    f4: readReport(dir, F4_FILE),
    dir,
  };
  emit(checkTuple(task, options.targetPhase, options.targetState, reports), options, task);
}

if (import.meta.main) main(process.argv.slice(2));
