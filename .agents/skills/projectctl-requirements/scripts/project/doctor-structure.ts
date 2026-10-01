/** Read-only project structure / criteria→docs→test→structure→code doctor. */
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { resolve, relative, join, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isAdjacent, isMarkerLike, parseMarkerLine } from './code-traceability-contract.ts';
import { loadAppMap, selectAppScope, targetArg } from './app-map-inventory.ts';
import { collectCriterionIds } from './criterion-contract.ts';

type Status = 'pass' | 'fail' | 'unverified';
type Stage = 'criteria' | 'docs' | 'test' | 'structure' | 'code';
type Finding = { stage: Stage; code: string; status: Status; path: string; criterion_id?: string; reason: string; remedy?: string };
const argv = process.argv.slice(2);
let target: string | undefined;
try { target = targetArg(argv); } catch (error) { console.error(String(error)); process.exit(2); }
let root = '.';
let mapping = '1.0.0';
let json = false;
let managed = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root' && argv[i + 1]) root = argv[++i];
  else if (argv[i] === '--mapping' && argv[i + 1]) mapping = argv[++i];
  else if (argv[i] === '--json') json = true;
  else if (argv[i] === '--managed') managed = true;
  else if (argv[i].startsWith('--target=')) continue;
  else { console.error('Usage: bun .agents/skills/projectctl-requirements/scripts/project/doctor-structure.ts [--root PROJECT] [--target=<view>[:<feature>]] [--mapping 1.0.0] [--managed] [--json]'); process.exit(2); }
}
root = resolve(root);
const inventory = loadAppMap(root);
let scope;
try { scope = selectAppScope(inventory, target); } catch (error) { console.error(String(error)); process.exit(2); }
const selectedIds = new Set(scope!.criteria.map(item => item.id));
const allIds = new Set(inventory.criteria.map(item => item.id));
const results: Finding[] = [];
function result(stage: Stage, code: string, status: Status, path: string, reason: string, remedy?: string, criterion_id?: string) {
  results.push({ stage, code, status, path, ...(criterion_id ? { criterion_id } : {}), reason, ...(remedy ? { remedy } : {}) });
}
function within(file: string): boolean {
  const rel = relative(root, file);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith('../');
}
function safe(file: string): string | null {
  try {
    const full = resolve(root, file);
    return within(full) && within(realpathSync(full)) ? readFileSync(full, 'utf8') : null;
  } catch { return null; }
}
function pathState(file: string): 'valid' | 'missing' | 'escape' {
  try {
    const full = resolve(root, file);
    if (!within(full)) return 'escape';
    if (!existsSync(full)) return 'missing';
    return within(realpathSync(full)) ? 'valid' : 'escape';
  } catch { return 'missing'; }
}
function filesUnder(directory: string, select: (file: string) => boolean, files: string[], budget = { left: 3000 }) {
  const base = resolve(root, directory);
  if (!within(base) || !existsSync(base)) return;
  try {
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (--budget.left < 0) { result('structure', 'INVENTORY_TRUNCATED', 'unverified', directory, 'Inventory bound exceeded; no complete green claim.'); break; }
      if (['node_modules', 'dist', 'coverage', '.git', '.runtime'].includes(entry.name)) continue;
      const file = join(base, entry.name);
      if (entry.isDirectory()) filesUnder(relative(root, file), select, files, budget);
      else if (entry.isFile() && select(file)) files.push(relative(root, file).replaceAll('\\', '/'));
    }
  } catch { result('structure', 'INVENTORY_UNREADABLE', 'unverified', directory, 'Cannot inspect this directory.'); }
}
const standardPath = '.agents/skills/projectctl-requirements/references/estructura/reglas.md';
const standard = safe(standardPath);
const knownTypes = ['ui', 'functionality', 'a11y', 'backend', 'data', 'integration', 'security', 'performance', 'tooling'];
const map = new Map<string, { primary: string[]; evidence: string[] }>();
if (!standard) result('structure', 'MAPPING_UNREADABLE', 'fail', standardPath, 'The canonical structure reference is not readable.');
else {
  for (const line of standard.split(/\r?\n/)) {
    const cells = line.split('|').map(cell => cell.trim());
    const type = cells[1]?.replaceAll('`', '');
    if (!knownTypes.includes(type)) continue;
    const quoted = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map(match => match[1]);
    map.set(type, { primary: quoted(cells[2] ?? ''), evidence: quoted(cells[3] ?? '') });
  }
  const actual = standard.match(/mapping[_ ]version:\s*([\d.]+)/i)?.[1] ?? standard.match(/mapping v([\d.]+)/i)?.[1];
  if (mapping !== '1.0.0' || actual !== mapping || map.size !== knownTypes.length || knownTypes.some(type => !map.get(type)?.primary.length)) {
    result('structure', 'MAPPING_VERSION_UNSUPPORTED', 'fail', standardPath, 'Expected mapping v1.0.0 with all nine type→path rows.', 'Use the published v1.0.0 mapping; do not infer or silently replace a missing row.');
  } else result('structure', 'MAPPING', 'pass', standardPath, 'Version and nine type rows match the published contract.');
}

const capabilities = { frontend: pathState('frontend') === 'valid', backend: pathState('backend') === 'valid' };
result('structure', 'CAPABILITIES', 'unverified', root, `Observed directories indicate ${capabilities.backend ? 'frontend+backend' : 'frontend-only'}; directory presence does not prove declared project capability.`, 'Reconcile the project capability declaration and operator structure snapshot.');
for (const folder of ['frontend', 'backend', 'shared', 'docs', 'tests', 'scripts', 'deploy']) {
  if ((folder === 'frontend' && !capabilities.frontend) || (folder === 'backend' && !capabilities.backend)) {
    if (folder === 'frontend') result('structure', 'CORE_MISSING', 'fail', folder, 'Frontend capability has no directory.');
    continue;
  }
  const state = pathState(folder);
  if (state !== 'valid') { result('structure', state === 'escape' ? 'PATH_TRAVERSAL' : 'CORE_MISSING', 'fail', folder, 'Required core folder is missing or escapes the checkout.'); continue; }
  const entries = readdirSync(resolve(root, folder)).filter(name => name !== '.gitkeep');
  if (!entries.length) result('structure', 'EMPTY_CORE', 'fail', folder, 'Core directory contains no owned artifact.', 'Add a real owned artifact when its capability exists; avoid placeholder-only trees.');
}
for (const folder of ['api', 'backend', 'supabase', 'compose', '.agents']) {
  if (folder === 'backend' || pathState(folder) !== 'valid') continue;
  if (folder === 'api' && !capabilities.backend && !readdirSync(resolve(root, folder)).some(name => name !== 'src' && name !== '.gitkeep')) {
    const src = resolve(root, 'api/src');
    if (!existsSync(src) || readdirSync(src).length === 0) result('structure', 'EMPTY_LEGACY_ALIAS', 'fail', folder, 'api/ is an empty legacy alias in a frontend-only project.', 'Remove the placeholder when separately authorized; never infer backend capability from an empty folder.');
  }
}
if (pathState('compose') !== 'valid' && ['compose.yml', 'compose.dev.yml', 'compose.prod.yml'].some(file => pathState(file) === 'valid')) {
  result('structure', 'COMPOSE_ROOT_OVERLAY', 'pass', 'compose.yml', 'Root Compose files are an operator-supported alternative; do not create an empty compose/ folder.');
}

type Criterion = { id: string; type: string; status: string; coverage: Record<string, unknown>; paths: unknown; exception?: unknown; bundle: string };
const criteria: Criterion[] = [];
const bundles = scope!.bundles.map(entry => entry.file);
const listed = new Set(inventory.nodes.map(node => node.bundle));
if (inventory.issues.length) result('docs', inventory.issues.includes('navigation-missing') ? 'NAVIGATION_MISSING' : 'NAVIGATION_INVALID', 'fail', 'docs/app-map/navigation.yaml', `Manifest cannot be resolved: ${inventory.issues.join(', ')}.`);
else result('docs', 'NAVIGATION', 'pass', 'docs/app-map/navigation.yaml', 'Navigation tree is present; strict runtime validation remains separate.');
for (const bundle of bundles) {
  const entry = scope!.bundles.find(item => item.file === bundle)!;
  if (entry.error && entry.error !== 'criteria-missing') result('criteria', entry.error === 'criterion-id-missing' ? 'CRITERION_ID_MISSING' : 'BUNDLE_INVALID', 'fail', bundle, `Bundle cannot be parsed: ${entry.error}.`);
    const bundleName = relative(resolve(root, 'docs/app-map'), resolve(root, bundle)).replace(/\.md$/, '').replaceAll('\\', '/');
    if (!listed.has(bundleName)) result('docs', 'BUNDLE_UNLISTED', 'unverified', bundle, 'Bundle criteria exist but are not reachable from navigation.', 'Add the node to navigation only if it belongs in the Doc sidebar.');
    if (!entry.listed) continue;
    for (const { id, data: item } of entry.criteria) {
      criteria.push({ id, type: String(item.type ?? ''), status: String(item.functional ?? ''), coverage: (item.coverage && typeof item.coverage === 'object' ? item.coverage : {}) as Record<string, unknown>, paths: item.evidence_paths, exception: item.exception_reason, bundle });
    }
}
if (target) {
  const counts = new Map<string, number>();
  for (const item of inventory.criteria) counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  for (const id of selectedIds) if ((counts.get(id) ?? 0) > 1) result('criteria', 'CRITERION_DUPLICATE', 'fail', 'docs/app-map/', 'Criterion ID is declared more than once in the project.', undefined, id);
}
if (criteria.length === 0) result('criteria', 'CRITERIA_MISSING', 'fail', 'docs/app-map/', 'No criteria[] are available as identity authority.');
else result('criteria', 'CRITERIA_INVENTORY', 'pass', 'docs/app-map/', `${criteria.length} criterion identities read from bundle frontmatter.`);
const ids = new Set<string>();
const allowedTypes = new Set(knownTypes);
const prefix = (path: string, rootPath: string) => rootPath.endsWith('/') ? path.startsWith(rootPath) : path === rootPath || path.startsWith(rootPath + '/');
const candidateRoots = (type: string) => map.get(type) ?? { primary: [], evidence: [] };
for (const item of criteria) {
  if (ids.has(item.id)) result('criteria', 'CRITERION_DUPLICATE', 'fail', item.bundle, 'Criterion ID is declared more than once.', 'Keep a single authoritative definition.', item.id);
  ids.add(item.id);
  if (!allowedTypes.has(item.type)) { result('criteria', 'TYPE_UNKNOWN', 'fail', item.bundle, `Type ${item.type || '(missing)'} is outside the nine-value enum.`, 'Choose the canonical type before selecting evidence paths.', item.id); continue; }
  const needsFrontend = ['ui', 'a11y'].includes(item.type);
  const needsBackend = ['backend', 'data', 'integration', 'security'].includes(item.type);
  if ((needsFrontend && !capabilities.frontend) || (needsBackend && !capabilities.backend)) {
    const validException = item.status === 'not-applicable' && item.exception === 'capability_absent';
    result('structure', 'CAPABILITY_ABSENT', validException ? 'pass' : 'fail', item.bundle, validException ? 'Absent capability is explicitly scoped as not-applicable.' : 'Criterion requires an absent capability without a justified not-applicable exception.', 'Set not-applicable + exception_reason: capability_absent only if the product does not require this capability.', item.id);
    if (validException) continue;
  }
  const paths = Array.isArray(item.paths) ? item.paths : [];
  if (['implemented', 'partial'].includes(item.status) && paths.length === 0) {
    result('structure', 'PATH_REQUIRED', 'fail', item.bundle, 'Active criterion has no frontmatter evidence_paths; prose tables do not satisfy the structure reader.', 'Add real POSIX paths in this criterion frontmatter; do not invent paths or treat a narrative table as authority.', item.id);
  }
  for (const rawPath of paths) {
    if (typeof rawPath !== 'string' || !rawPath || rawPath.startsWith('/') || rawPath.includes('\\') || rawPath.split('/').includes('..') || /[*?{}]/.test(rawPath)) {
      result('structure', 'PATH_TRAVERSAL', 'fail', item.bundle, 'Evidence path is not a safe relative POSIX file path.', 'Declare a concrete in-checkout relative path.', item.id); continue;
    }
    const state = pathState(rawPath);
    if (state !== 'valid') { result('structure', state === 'escape' ? 'PATH_TRAVERSAL' : 'PATH_MISSING', 'fail', rawPath, 'Evidence path escapes the checkout or does not exist.', 'Point to an actual file within the project checkout.', item.id); continue; }
    const roots = candidateRoots(item.type);
    const permitted = [...roots.primary, ...roots.evidence].some(base => !base.includes('*') && prefix(rawPath, base))
      || (['functionality', 'backend'].includes(item.type) && rawPath.startsWith('backend/') && rawPath.split('/').includes('__tests__'))
      || (item.type === 'tooling' && rawPath.startsWith('scripts/') && /\.test\.[^/]+$/.test(rawPath));
    const legacy = ['apps/web/src/views/', 'src/views/', 'apps/api-bun/src/', 'api/src/'].some(base => prefix(rawPath, base));
    if (!permitted && !legacy) result('structure', 'PATH_OUTSIDE_TYPE_ROOT', 'fail', rawPath, 'Evidence path is outside primary/evidence roots allowed for this type.', 'Align criterion type and owning code/test surface; do not create folders solely to silence the doctor.', item.id);
    if (legacy) result('structure', 'DEPRECATED_PATH', 'unverified', rawPath, 'Legacy alias requires migration review.', 'Prefer canonical mapping when moving code; do not sweep unrelated files.', item.id);
    if (permitted) result('structure', 'PATH_MAPPED', 'pass', rawPath, 'Existing path matches the type mapping.', undefined, item.id);
  }
}

const testFiles: string[] = [];
filesUnder('tests', file => /\.(?:test|spec)\.[jt]sx?$/.test(file), testFiles);
filesUnder('frontend', file => /\.(?:test|spec)\.[jt]sx?$/.test(file), testFiles);
const testIds = new Set<string>();
for (const file of testFiles) for (const line of (safe(file) ?? '').split(/\r?\n/).slice(0, 10)) {
  if (!/^\s*\/\/\s*@ac\b/.test(line)) continue;
  for (const id of collectCriterionIds(line)) testIds.add(id);
}
if (!target) for (const id of testIds) if (!ids.has(id)) result('test', 'UNKNOWN_AC', 'fail', 'tests/', 'A test references an ID absent from the app-map.', 'Align the @ac header with the declared criterion.', id);
if (testIds.size) result('test', 'AC_INVENTORY', 'pass', 'tests/', `${testIds.size} distinct @ac IDs found in project test headers.`);
else result('test', 'AC_INVENTORY', 'unverified', 'tests/', 'No project test header IDs were found.');
for (const item of criteria) {
  if (['covered', 'partial'].includes(String(item.coverage.Unit)) || ['covered', 'partial'].includes(String(item.coverage['PW-AUTO']))) {
    if (!testIds.has(item.id)) result('test', 'TEST_EVIDENCE_MISSING', 'fail', item.bundle, 'Coverage is claimed but no indexed test header references this criterion.', 'Provide actual @ac evidence; a claimed coverage status alone is not proof.', item.id);
  } else if (item.coverage.Manual === 'covered') {
    result('test', 'MANUAL_EVIDENCE', 'unverified', item.bundle, 'Manual coverage cannot be certified from a status field.', 'Inspect bounded evidence paths, owner and review date before accepting.', item.id);
  }
}

const codeFiles: string[] = [];
for (const directory of ['frontend/src', 'backend/src', 'api/src', 'shared', 'scripts']) filesUnder(directory, file => /\.(?:ts|tsx|js|jsx|astro|sql)$/.test(file) && !/\.(?:test|spec)\./.test(file), codeFiles);
const codeClaims = new Map<string, Set<string>>();
for (const file of codeFiles) {
  const lines = (safe(file) ?? '').split(/\r?\n/);
  const malformed = new Set<string>();
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!isMarkerLike(line)) continue;
    const marker = parseMarkerLine(line, index + 1);
    if (target && (!marker?.criterionId || !selectedIds.has(marker.criterionId))) continue;
    if (!marker) { if (/^\s*\/\/\s*@(?:criterion|trace|contract)\b/.test(line)) malformed.add(line.match(/@\w+/)?.[0] ?? '@marker'); continue; }
    if (marker.kind === 'criterion' && marker.criterionId) {
      const matches = codeClaims.get(marker.criterionId) ?? new Set<string>();
      matches.add(file);
      codeClaims.set(marker.criterionId, matches);
      if (!(target ? allIds : ids).has(marker.criterionId)) result('code', 'ORPHAN_CODE_BLOCK', 'fail', file, 'Code claims a criterion absent from the app-map.', 'Declare the criterion in its owner bundle or remove the incorrect claim.', marker.criterionId);
      let last = index;
      let linked = false;
      while (last + 1 < lines.length && isMarkerLike(lines[last + 1])) {
        const next = parseMarkerLine(lines[last + 1], last + 2);
        if (!next || next.kind === 'ac-evidence') break;
        if (next.kind === 'trace' && next.criterionId === marker.criterionId && /\breq=REQ-[A-Z0-9-]+\b/.test(lines[last + 1])) linked = true;
        last++;
      }
      if (!linked) result('code', 'TRACE_RELATION_MISSING', 'unverified', file, '@criterion has no adjacent @trace with the same ac and a req locator.', 'Link the real requirement and block when adopting code-traceability; a marker alone is not evidence.', marker.criterionId);
      if (!isAdjacent(lines, last + 1)) result('code', 'TRACE_NOT_ADJACENT', 'fail', file, 'The marker group is not adjacent to its eligible code block.', 'Place the marker group immediately before the actual symbol, not before imports or a different declaration.', marker.criterionId);
    }
  }
  if (malformed.size) result('code', 'TRACE_FORMAT_INVALID', 'fail', file, `${[...malformed].join(', ')} is not in the canonical marker grammar (comments with trailing prose do not count).`, 'Put one marker per adjacent comment line; move human explanation to a separate comment.');
}
for (const item of criteria) {
  const paths = Array.isArray(item.paths) ? item.paths : [];
  const codePaths = paths.filter((path): path is string => typeof path === 'string' && /^(frontend|backend|api|shared|scripts)\//.test(path) && !/\.(?:test|spec)\./.test(path));
  if (codePaths.length && !codeClaims.get(item.id)?.size) result('code', 'CODE_CLAIM_MISSING', 'fail', item.bundle, 'No canonical @criterion claim links the declared implementation path.', 'Add a valid adjacent marker for an eligible block; comments are locators, not proof of behavior.', item.id);
}
if (codeClaims.size) result('code', 'CODE_CLAIMS', 'pass', 'frontend/src/', `${codeClaims.size} canonical @criterion IDs found; markers still do not prove behavior.`);
else result('code', 'CODE_CLAIMS', 'unverified', 'frontend/src/', 'No valid @criterion locators were found.');
const copiedManifest = '.agents/skills/projectctl-requirements/references/app-map/code-traceability.yaml';
const oldDoctor = safe('.agents/skills/projectctl-requirements/scripts/sdd-doctor.ts');
if (oldDoctor?.includes("from '../../../../sandbox/src/") && pathState('sandbox/src/lib/projectctl-local-static.ts') !== 'valid') {
  result('structure', 'DOCTOR_INSTANCE_IMPORTS', 'fail', '.agents/skills/projectctl-requirements/scripts/sdd-doctor.ts', 'The copied SDD doctor imports platform sandbox modules absent from this checkout.', 'Use this standalone structure doctor; adapt the SDD doctor through an owned instance overlay before claiming it passes.');
}
const manifestText = safe(copiedManifest);
if (manifestText) try {
  const manifest = Bun.YAML.parse(manifestText) as { roots?: Record<string, string[]>; targets?: Array<{ criterion_id?: string }> };
  const roots = Object.values(manifest.roots ?? {}).flat();
  const absent = roots.filter(path => pathState(path) === 'missing');
  const foreign = (manifest.targets ?? []).filter(entry => entry.criterion_id && !(target ? allIds : ids).has(entry.criterion_id)).length;
  if (absent.length || foreign) result('code', 'CODE_MANIFEST_INSTANCE_DRIFT', 'fail', copiedManifest, `The first manifest considered by the operator contains ${absent.length} absent roots and ${foreign} foreign criterion targets.`, 'Do not treat the copied platform example as project evidence; resolve manifest selection at the operator boundary before claiming code check passed.');
  else result('code', 'CODE_MANIFEST_ROOTS', 'unverified', copiedManifest, 'Manifest roots exist, but targets/owner and runtime selection still need verification.');
} catch { result('code', 'CODE_MANIFEST_INVALID', 'fail', copiedManifest, 'The copied traceability manifest cannot be parsed.'); }
result('docs', 'STRICT_READER', 'unverified', 'docs/app-map/', 'Local Bun.YAML parsing is not the sandbox strict Doc reader.', 'Run the Doc doctor with --managed to prove renderability.');
result('structure', 'OPERATOR_CHECK', 'unverified', 'projectctl structure check', 'The operator mapping and filesystem snapshot must be checked separately; warn-first can exit 0 despite PATH_REQUIRED.', 'Run projectctl structure check --mapping 1.0.0 --json and review findings, not only exit code.');

let operator: unknown = null;
if (managed) {
  const execution = spawnSync('projectctl', ['structure', 'check', '--mapping', mapping, '--json'], { cwd: root, encoding: 'utf8', timeout: 30000, shell: false });
  try {
    const payload = JSON.parse(execution.stdout) as { schemaVersion?: string; remoteState?: string; findings?: unknown[]; exitCode?: number };
    if (payload.schemaVersion !== 'projectctl.structure-check.v1' || payload.remoteState !== 'evaluated' || !Array.isArray(payload.findings)) throw new Error('unavailable');
    operator = { remoteState: payload.remoteState, exitCode: payload.exitCode, findings: payload.findings };
    result('structure', 'OPERATOR_CHECK_MANAGED', payload.findings.length || payload.exitCode ? 'fail' : 'pass', 'projectctl structure check', `Operator returned ${payload.findings.length} findings; warning findings also require review.`);
  } catch { result('structure', 'OPERATOR_CHECK_MANAGED', 'unverified', 'projectctl structure check', 'Authenticated managed structure check is unavailable or did not return an evaluated envelope.'); }
}
const summary = { pass: results.filter(item => item.status === 'pass').length, fail: results.filter(item => item.status === 'fail').length, unverified: results.filter(item => item.status === 'unverified').length };
const state = summary.fail ? 'red' : summary.unverified ? 'unverified' : 'green';
const stages = Object.fromEntries((['criteria', 'docs', 'test', 'structure', 'code'] as const).map(stage => {
  const entries = results.filter(item => item.stage === stage);
  return [stage, entries.some(item => item.status === 'fail') ? 'red' : entries.some(item => item.status === 'unverified') ? 'unverified' : entries.length ? 'green' : 'unverified'];
}));
const output = { schemaVersion: 'projectctl.structure-chain-doctor.v1', state, stages, mappingVersion: mapping, root, readOnly: true, ...(target ? { scope: { kind: scope!.kind, target, nodes: scope!.nodes.length, criteria: scope!.criteria.length }, limitations: ['Core folders and mapping checks are global; managed operator checks cover the whole project.'] } : {}), capabilities, summary, findings: results, operator };
if (json) console.log(JSON.stringify(output, null, 2));
else {
  console.log(`Structure chain doctor: ${state} (${summary.pass} pass, ${summary.fail} fail, ${summary.unverified} unverified)`);
  for (const item of results.filter(item => item.status !== 'pass')) console.log(`[${item.status}] ${item.stage}/${item.code} ${item.criterion_id ?? ''} ${item.path}: ${item.reason}${item.remedy ? ` Fix: ${item.remedy}` : ''}`);
}
process.exitCode = mapping !== '1.0.0' ? 2 : state === 'red' ? 1 : state === 'unverified' ? 3 : 0;
