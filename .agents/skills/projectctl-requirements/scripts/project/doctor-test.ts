/**
 * Read-only, project-scoped Test readiness doctor. Never executes tests,
 * rewrites coverage, connects to the API, or prints credentials.
 * Usage: bun .agents/skills/projectctl-requirements/scripts/project/doctor-test.ts --root . --json
 */
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { resolve, relative, join, isAbsolute } from 'node:path';
import { loadAppMap, selectAppScope, targetArg } from './app-map-inventory.ts';
import { collectCriterionIds, criterionIdExpression, CRITERION_ID_PATTERN } from './criterion-contract.ts';

type Status = 'pass' | 'fail' | 'unverified';
type Check = { id: string; status: Status; path: string; message: string; remedy?: string };
const argv = process.argv.slice(2);
let target: string | undefined;
try { target = targetArg(argv); } catch (error) { console.error(String(error)); process.exit(2); }
let root = '.';
let json = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root' && argv[i + 1]) root = argv[++i];
  else if (argv[i] === '--json') json = true;
  else if (argv[i].startsWith('--target=')) continue;
  else {
    console.error('Usage: bun .agents/skills/projectctl-requirements/scripts/project/doctor-test.ts [--root PROJECT] [--target=<view>[:<feature>]] [--json]');
    process.exit(2);
  }
}
root = resolve(root);
const inventory = loadAppMap(root);
let scope;
try { scope = selectAppScope(inventory, target); } catch (error) { console.error(String(error)); process.exit(2); }
const selectedIds = new Set(scope!.criteria.map(item => item.id));
const allIds = new Set(inventory.criteria.map(item => item.id));
const checks: Check[] = [];
const report = (id: string, status: Status, path: string, message: string, remedy?: string) =>
  checks.push({ id, status, path, message, ...(remedy ? { remedy } : {}) });
function isWithin(path: string): boolean {
  const rel = relative(root, path);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith('../');
}
function source(file: string): string | null {
  const full = resolve(root, file);
  try {
    if (!isWithin(full) || !existsSync(full) || !isWithin(realpathSync(full))) return null;
    return readFileSync(full, 'utf8');
  } catch { return null; }
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const pkgRaw = source('package.json');
let pkg: Record<string, unknown> | null = null;
try { pkg = pkgRaw ? JSON.parse(pkgRaw) as Record<string, unknown> : null; } catch { /* reported below */ }
report('TST-RUNNER-PACKAGE', pkg && object(pkg.scripts) ? 'pass' : 'fail', 'package.json', pkg ? 'Package scripts are readable.' : 'No parseable package.json found.', 'Declare Bun scripts with an enforcing test:check gate.');
const scripts = pkg && object(pkg.scripts) ? pkg.scripts : {};
const gate = typeof scripts['test:check'] === 'string' ? scripts['test:check'] : '';
const hasGate = /(?:test-runner(?:\.ts)?[^\n]*\bcheck\b|(?:test:coverage|coverage:check|quality:check)\b)/.test(gate);
report('TST-13-COVERAGE-GATE', hasGate ? 'unverified' : 'fail', 'package.json#scripts.test:check', hasGate ? 'A coverage-gate command is wired; runtime semantics need verification.' : 'test:check does not invoke an app-map coverage gate (passing unit tests and typecheck is insufficient).', 'For each implemented criterion require coverage.Unit AND coverage.PW-AUTO = covered unless skip_quality_gate: true; scan the managed project app-map, not only the platform source root.');
const hasUnit = typeof scripts['test:unit'] === 'string' && scripts['test:unit'].trim().length > 0;
report('TST-02-UNIT-COMMAND', hasUnit ? 'pass' : 'fail', 'package.json#scripts.test:unit', hasUnit ? 'Unit command exists.' : 'Unit command is missing.', 'Provide an executable unit runner selected by the project.');
const hasE2e = typeof scripts['test:pwauto'] === 'string' && scripts['test:pwauto'].trim().length > 0;
report('TST-02-PWAUTO-COMMAND', hasE2e ? 'pass' : 'fail', 'package.json#scripts.test:pwauto', hasE2e ? 'PW-AUTO command exists.' : 'PW-AUTO command is missing.', 'Expose the project Playwright suite through a Bun script or a verified projectctl runner target.');
const hasAll = typeof scripts['test:all'] === 'string' && scripts['test:all'].trim().length > 0;
report('TST-02-ALL-COMMAND', hasAll ? 'pass' : 'fail', 'package.json#scripts.test:all', hasAll ? 'All-method command exists.' : 'All-method command is missing.', 'Provide a canonical unit + PW-AUTO entry point.');
const allowsEmpty = Object.values(scripts).filter((value): value is string => typeof value === 'string').some(value => /--passWithNoTests\b/.test(value));
report('TST-NONEMPTY', allowsEmpty ? 'fail' : 'pass', 'package.json#scripts', allowsEmpty ? 'A test command allows zero executed tests to succeed.' : 'Scripts do not opt into --passWithNoTests.', 'Remove --passWithNoTests from the verification gate; distinguish missing tests from passing tests.');
const npmCommands = Object.values(scripts).filter((value): value is string => typeof value === 'string').some(value => /\b(?:npm|npx)\s+(?:run|test|exec|install|vitest|playwright)\b/.test(value));
report('TST-BUN-COMMANDS', npmCommands ? 'fail' : 'pass', 'package.json#scripts', npmCommands ? 'Package scripts invoke npm/npx instead of Bun.' : 'Package scripts use no npm/npx test commands.', 'Use bun, bunx or Bun-compatible projectctl commands.');
const deps = { ...(object(pkg?.dependencies) ? pkg.dependencies : {}), ...(object(pkg?.devDependencies) ? pkg.devDependencies : {}) };
const range = ['@playwright/test', 'playwright'].filter(name => typeof deps[name] === 'string' && /[~^*xX]|latest/.test(deps[name] as string));
if (range.length) report('TST-09-PW-PINS', 'fail', 'package.json', `${range.join(', ')} uses a floating version range.`, 'Pin browser runner dependencies to reproducible versions.');
report('TST-09-LOCKFILE', existsSync(join(root, 'bun.lock')) || existsSync(join(root, 'bun.lockb')) ? 'pass' : 'fail', 'bun.lock', 'Reproducible Bun dependency lockfile ' + (existsSync(join(root, 'bun.lock')) || existsSync(join(root, 'bun.lockb')) ? 'exists.' : 'is missing.'), 'Commit bun.lock and use frozen installs.');
const declaresPw = typeof deps['@playwright/test'] === 'string' || typeof deps['playwright'] === 'string';
report('TST-39-SINGLE-COPY', declaresPw ? 'unverified' : 'pass', 'package.json', declaresPw ? 'A local @playwright/test copy is declared; single-instance resolution needs a managed run.' : 'No local @playwright/test copy; specs resolve to the single platform copy.', 'Remove @playwright/test from project dependencies so managed and local runs share one instance; a local copy crashes the managed runner with a dual-copy require error.');

const plan = source('playwright/TEST_PLAN.md');
report('PCT-94-TEST-PLAN', plan && plan.trim() ? 'pass' : 'fail', 'playwright/TEST_PLAN.md', plan && plan.trim() ? 'Persistent browser test plan exists.' : 'No persistent browser test plan found.', 'Map each persistent spec to the documented acceptance criteria.');
if (plan && /\b(?:npm|npx)\s+(?:run|test|exec|vitest|playwright)\b/.test(plan)) report('PCT-94-PLAN-COMMANDS', 'fail', 'playwright/TEST_PLAN.md', 'The plan instructs npm/npx commands that diverge from the Bun workflow.', 'Update the plan alongside the real Bun commands when adopting the projectctl testing contract.');
const docsLint = typeof scripts['docs:lint'] === 'string' ? scripts['docs:lint'] : '';
report('TST-38-DOCS-LINT', docsLint || source('scripts/docs-lint.ts') ? 'unverified' : 'fail', 'scripts/docs-lint.ts', docsLint || source('scripts/docs-lint.ts') ? 'Docs lint is present but traceability checks need verification.' : 'No project-scoped code⇒criterion docs lint is wired.', 'Integrate the 5-check docs lint against this project; the platform source root is not the project app-map.');
const playwright = source('playwright.config.ts') ?? source('playwright.config.js') ?? '';
report('TST-09-BASE-URL', /\b(?:process\.env\.BASE_URL|BASE_URL\s*\?\?|BASE_URL\s*\|\||BASE_URL\s*\?)/.test(playwright) ? 'unverified' : 'fail', 'playwright.config.ts', /\b(?:process\.env\.BASE_URL|BASE_URL\s*\?\?|BASE_URL\s*\|\||BASE_URL\s*\?)/.test(playwright) ? 'BASE_URL is configurable; runtime resolution still needs verification.' : 'Playwright target is not derived from BASE_URL.', 'Accept an explicit resolved BASE_URL; do not pin prod/dev to a single localhost URL.');
report('TST-09-WEBSERVER', /\bnpm\s+run\b|\bnpx\b/.test(playwright) ? 'fail' : 'pass', 'playwright.config.ts', /\bnpm\s+run\b|\bnpx\b/.test(playwright) ? 'Playwright webServer uses npm/npx.' : 'Playwright webServer does not invoke npm/npx.', 'Use Bun or a managed runtime target; preserve project-scoped startup.');

const ignored = (source('.gitignore') ?? '').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
const ignoresRuntime = ignored.some(line => ['.runtime/', '.runtime', '.runtime/test-results/', '.runtime/test-results'].includes(line));
report('TST-08-RUNTIME-ARTIFACTS', ignoresRuntime ? 'pass' : 'fail', '.gitignore', ignoresRuntime ? 'Runtime test results are ignored by Git.' : 'Runtime test results are not ignored.', 'Ignore .runtime/; persistence belongs to the project runtime, never the repository.');

type Criterion = { id: string; functional?: string; coverage?: Record<string, string>; skip_quality_gate?: boolean; bundle: string };
const declared: Criterion[] = [];
const viewIds = inventory.nodes.filter(node => node.kind === 'view').map(node => node.id.toLowerCase());
report('TST-06-NAVIGATION', inventory.issues.length ? 'fail' : 'pass', 'docs/app-map/navigation.yaml',
  inventory.issues.length ? `Navigation cannot be resolved: ${inventory.issues.join(', ')}.` : 'Quick-run view/feature targets can be enumerated.',
  'Correct the app-map manifest before using quick-run.');
function walkFiles(dir: string, predicate: (file: string) => boolean, output: string[], remaining = { count: 5000 }) {
  if (!isWithin(dir) || !existsSync(dir) || remaining.count <= 0) return;
  let entries: Dirent[];
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { report('TST-INVENTORY-UNREADABLE', 'unverified', relative(root, dir), 'Cannot read part of the test inventory.'); return; }
  for (const entry of entries) {
    if (--remaining.count < 0) return;
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'coverage', 'test-results'].includes(entry.name)) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(file, predicate, output, remaining);
    else if (entry.isFile() && predicate(file)) output.push(relative(root, file));
  }
}
const bundles = scope!.bundles.map(entry => entry.file);
if (bundles.length === 0) report('TST-13-CRITERIA', 'fail', 'docs/app-map/', 'No criterion bundles found for the coverage gate.', 'Declare criteria[] in app-map bundles before reporting coverage.');
else for (const file of bundles) {
  const entry = scope!.bundles.find(item => item.file === file)!;
  if (!entry.listed) { report('TST-13-BUNDLE-UNLISTED', 'unverified', file, 'Unlisted bundle is not a criterion identity authority; add it to navigation if it belongs to this project.'); continue; }
  if (entry.error && entry.error !== 'criteria-missing') report('TST-13-BUNDLE', 'fail', file, `Bundle cannot be read: ${entry.error}.`, 'Correct frontmatter before accepting coverage.');
  for (const { data: item, id } of entry.criteria) declared.push({ id, functional: typeof item.functional === 'string' ? item.functional : undefined, coverage: object(item.coverage) ? item.coverage as Record<string, string> : undefined, skip_quality_gate: item.skip_quality_gate === true, bundle: file });
}
if (target) {
  const counts = new Map<string, number>();
  for (const item of inventory.criteria) counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  for (const id of selectedIds) if ((counts.get(id) ?? 0) > 1) report('TST-CRITERIA-DUPLICATE', 'fail', 'docs/app-map/', `${id} is declared more than once in the project.`);
}
if (bundles.length && declared.length === 0) report('TST-13-CRITERIA', 'fail', 'docs/app-map/', 'No declared criteria[] found; an empty coverage gate is not proof of readiness.', 'Declare actual project criteria in the owning bundles.');
const seenCriteria = new Set<string>();
for (const item of declared) {
  if (seenCriteria.has(item.id)) report('TST-CRITERIA-DUPLICATE', 'fail', item.bundle, `${item.id} is declared more than once.`, 'Keep one authoritative criterion definition.');
  seenCriteria.add(item.id);
}
for (const item of declared) {
  if (item.functional !== 'implemented' || item.skip_quality_gate) continue;
  if (item.coverage?.Unit !== 'covered' || item.coverage?.['PW-AUTO'] !== 'covered') report('TST-13-COVERAGE', 'fail', item.bundle, `${item.id}: implemented requires Unit=covered AND PW-AUTO=covered.`, 'Add real evidence, correct stale status, or justify skip_quality_gate: true; do not fabricate coverage.');
}
if (declared.length > 0 && checks.every(check => check.id !== 'TST-13-COVERAGE')) report('TST-13-COVERAGE', 'pass', 'docs/app-map/', 'Declared implemented criteria meet the static coverage gate; evidence still needs runtime verification.');

const unitFiles: string[] = [];
const e2eFiles: string[] = [];
for (const dir of ['tests', 'frontend', 'api', 'sandbox', 'shared', 'scripts']) {
  walkFiles(resolve(root, dir), file => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file), unitFiles);
}
for (const file of unitFiles.splice(0)) {
  if (/\.spec\.[cm]?[jt]sx?$/.test(file)) e2eFiles.push(file);
  else unitFiles.push(file);
}
if (target) {
  const selectedFile = (file: string) => {
    const content = source(file) ?? '';
    const headers = content.split(/\r?\n/).slice(0, 10).filter(line => /^\s*\/\/\s*@ac\b/.test(line)).join('\n');
    const matches = collectCriterionIds(headers).some(id => selectedIds.has(id));
    return matches || (scope!.kind === 'view' && /^(?:tests\/(?:unit|e2e)\/)/.test(file) && file.split('/')[2] === scope!.nodes[0]?.id);
  };
  unitFiles.splice(0, unitFiles.length, ...unitFiles.filter(selectedFile));
  e2eFiles.splice(0, e2eFiles.length, ...e2eFiles.filter(selectedFile));
}
report('TST-36-UNIT-INVENTORY', unitFiles.length ? 'pass' : 'fail', 'tests/unit/', unitFiles.length ? `${unitFiles.length} unit files found.` : 'No unit tests found.', 'Create meaningful project-owned unit tests under tests/unit/.');
report('TST-36-PWAUTO-INVENTORY', e2eFiles.length ? 'pass' : 'fail', 'tests/e2e/', e2eFiles.length ? `${e2eFiles.length} browser specs found.` : 'No browser specs found.', 'Create persistent Playwright specs under tests/e2e/.');
const declaredByMethod = new Map<string, { unit: Set<string>; pwauto: Set<string> }>();
const annotation = new RegExp(`(?:test\\.info\\(\\)|testInfo)\\.annotations\\.push\\s*\\(\\s*\\{\\s*type\\s*:\\s*['"]ac['"]\\s*,\\s*description\\s*:\\s*['"](${CRITERION_ID_PATTERN.slice(1, -1)})['"]`, 'gi');
for (const [method, files] of [['unit', unitFiles], ['pwauto', e2eFiles]] as const) for (const file of files) {
  const text = source(file) ?? '';
  const header = text.split(/\r?\n/).slice(0, 10).flatMap(line => collectCriterionIds(/^\s*\/\/\s*@ac\b(.*)$/.exec(line)?.[1] ?? ''));
  if (!header.length) report('TST-10-AC-HEADER', 'fail', file, 'No // @ac <ID> header in the first 10 lines.', 'Declare the actual criterion ID(s) exercised by this file.');
  for (const id of header) {
    if (!allIds.has(id)) report('TST-38-UNKNOWN-AC', 'fail', file, `${id} is not declared in project docs/app-map.`, 'Declare the criterion in the owning bundle or correct the test header.');
    const inventory = declaredByMethod.get(id) ?? { unit: new Set<string>(), pwauto: new Set<string>() };
    inventory[method].add(file);
    declaredByMethod.set(id, inventory);
  }
  if (method === 'pwauto') {
    const annotations = [...text.matchAll(annotation)].map(match => match[1].toUpperCase());
    if (!annotations.length) report('TST-10-AC-ANNOTATION', 'fail', file, 'No Playwright ac annotation found.', 'Annotate each test with its actual criterion via test.info()/testInfo.annotations.push.');
    else for (const id of annotations) if (!header.includes(id)) report('TST-10-ANNOTATION-MISMATCH', 'fail', file, `${id} annotation is absent from its file header.`, 'Align annotation and @ac header.');
  }
}
for (const item of declared) for (const [method, coverageKey] of [['unit', 'Unit'], ['pwauto', 'PW-AUTO']] as const) {
  if (item.coverage?.[coverageKey] === 'covered' && !declaredByMethod.get(item.id)?.[method].size) {
    report('TST-COVERAGE-WITHOUT-TEST', 'fail', item.bundle, `${item.id} claims ${coverageKey}=covered but no indexed ${method} file declares its @ac ID.`, 'Add genuine criterion evidence or correct the coverage claim; a passing suite does not prove coverage.');
  }
}
const vitestOnly = unitFiles.filter(file => /from\s+['"]vitest['"]|require\(['"]vitest['"]\)/.test(source(file) ?? ''));
if (vitestOnly.length && !source('scripts/test-runner.ts')) report('TST-RUNNER-COMPAT', 'unverified', 'tests/unit/', 'Unit files import Vitest while the platform canonical runner invokes bun test; project-specific execution compatibility is unproven.', 'Run a bounded projectctl test run --method=unit --target=<view> from the sandbox and confirm testsExecuted > 0; adapt project runner wiring if necessary.');
const managedUnit = unitFiles.filter(file => file.startsWith('tests/'));
const managedSpecs = e2eFiles.filter(file => file.startsWith('tests/'));
if ((managedUnit.length || managedSpecs.length) && !viewIds.length) {
  for (const [id, path] of [
    ['TST-40-OWNER', 'tests/e2e/'],
    ['TST-41-BOUNDED-LOCATION', 'tests/'],
    ['TST-42-SPEC-TITLE', 'tests/e2e/'],
  ] as const) report(id, 'unverified', path, 'View owner targets cannot be enumerated from the navigation tree.', 'Correct docs/app-map/navigation.yaml before checking managed discovery metadata.');
}
if (viewIds.length) {
  const views = new Set(viewIds);
  const ownerRe = /\/\/\s*@([A-Za-z][A-Za-z0-9_-]*)(?![A-Za-z0-9_:-])/;
  const headerRe = /^\s*\/\/\s*@ac\b(.*)$/;
  const idRe = criterionIdExpression();
  const titleRe = /(?:^|[^\w$.])test(?:\.\w+)?\s*\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g;
  for (const file of managedSpecs) {
    const text = source(file) ?? '';
    const first10 = text.split(/\r?\n/).slice(0, 10);
    const owners = first10.flatMap(line => {
      const match = ownerRe.exec(line);
      if (!match || !match[1] || match[1].toLowerCase() === 'ac') return [];
      return [match[1].toLowerCase()];
    });
    if (!owners.some(owner => views.has(owner))) report('TST-40-OWNER', 'fail', file, 'No // @<view> owner annotation naming a navigation view in the first 10 lines.', 'Add the target view owner (e.g. // @<view-id>) next to the // @ac header.');
    const parts = file.split('/');
    if (!(parts.length > 3 && parts[0] === 'tests' && parts[1] === 'e2e' && views.has(parts[2].toLowerCase()))) report('TST-41-BOUNDED-LOCATION', 'fail', file, 'Spec is outside the canonical per-view root tests/e2e/<view>/.', 'Move the spec under tests/e2e/<view>/ for its target view; the managed runner treats other locations as external.');
    const headerIds = new Set(first10.flatMap(line => (headerRe.exec(line)?.[1]?.match(idRe) ?? []).map(id => id.toUpperCase())));
    for (const call of text.matchAll(titleRe)) {
      const titleIds = call[2].match(idRe) ?? [];
      if (!titleIds.length) report('TST-42-SPEC-TITLE', 'fail', file, `Test title carries no criterion ID: ${call[2].slice(0, 60)}.`, 'Prefix the title with its @ac ID(s); the managed runner filters with --grep over titles.');
      else for (const id of titleIds) if (!headerIds.has(id.toUpperCase())) report('TST-42-SPEC-TITLE', 'fail', file, `${id} in title is absent from its file @ac header.`, 'Align title IDs with the // @ac header.');
    }
  }
  for (const file of managedUnit) {
    const parts = file.split('/');
    if (!(parts.length > 3 && parts[0] === 'tests' && parts[1] === 'unit' && views.has(parts[2].toLowerCase()))) report('TST-41-BOUNDED-LOCATION', 'fail', file, 'Unit file is outside the canonical per-view root tests/unit/<view>/.', 'Move the file under tests/unit/<view>/ for its target view; other unit roots belong to the platform, not the managed project.');
  }
  if (managedSpecs.length && checks.every(check => check.id !== 'TST-40-OWNER')) report('TST-40-OWNER', 'pass', 'tests/e2e/', 'Specs carry a navigation view owner annotation.');
  if ((managedSpecs.length || managedUnit.length) && checks.every(check => check.id !== 'TST-41-BOUNDED-LOCATION')) report('TST-41-BOUNDED-LOCATION', 'pass', 'tests/', 'Test files live under canonical per-view roots.');
  if (managedSpecs.length && checks.every(check => check.id !== 'TST-42-SPEC-TITLE')) report('TST-42-SPEC-TITLE', 'pass', 'tests/e2e/', 'Spec titles carry header-traced criterion IDs.');
}
if (plan) for (const file of e2eFiles) if (!plan.includes(file)) report('PCT-94-PLAN-MAPPING', 'fail', 'playwright/TEST_PLAN.md', `${file} is missing from the persistent test plan.`, 'Record the real spec ↔ criterion mapping.');

for (const [id, path, message, remedy] of [
  ['TST-05-CONFIG', 'project_test_config', 'Saved target, selected user and credentials cannot be inspected from filesystem.', 'Use authenticated projectctl test config and check authorization/redaction.'],
  ['TST-21-27-TARGETS', 'runtime/available_targets', 'The four prod/dev × domain/localhost candidates and runtime/hostname precedence need API evidence.', 'Use the Test tab and the authenticated precheck; disabled candidates must explain why.'],
  ['TST-08-RESULTS', '.runtime/test-results/', 'Persistence and result envelope cannot be certified before a real run.', 'Inspect list-runs/results after an authorized --persist run.'],
  ['TST-04-WRITEBACK', 'docs/app-map/', 'Atomic Unit/PW-AUTO write-back cannot be certified statically.', 'Only a passing run with >0 executed tests and successful patch may claim coverageAccepted=true.'],
  ['TST-01-QUICKRUN-UI', '/project/[id]?tab=test', 'UI layout, badges, no-runtime notice and server-side auth require browser/API evidence.', 'Verify TST-01/05/06/14..19/21/26/28..35 in the actual app.'],
] as const) report(id, 'unverified', path, message, remedy);

const summary = { passed: checks.filter(c => c.status === 'pass').length, failed: checks.filter(c => c.status === 'fail').length, unverified: checks.filter(c => c.status === 'unverified').length };
const state = summary.failed ? 'red' : summary.unverified ? 'unverified' : 'green';
const output = { schemaVersion: 'projectctl.test-doctor.v1', state, root, readOnly: true, ...(target ? { scope: { kind: scope!.kind, target, nodes: scope!.nodes.length, criteria: scope!.criteria.length }, limitations: ['Project configuration checks remain global; a scoped result does not certify the whole project.'] } : {}), summary, checks };
if (json) console.log(JSON.stringify(output, null, 2));
else {
  console.log(`Test doctor: ${state} (${summary.passed} pass, ${summary.failed} fail, ${summary.unverified} unverified)`);
  for (const check of checks.filter(c => c.status !== 'pass')) console.log(`[${check.status}] ${check.id} ${check.path}: ${check.message}${check.remedy ? ` Fix: ${check.remedy}` : ''}`);
}
process.exitCode = state === 'red' ? 1 : state === 'unverified' ? 3 : 0;
