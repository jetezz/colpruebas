/** Read-only evidence mechanics. All routing and fingerprint field selection comes from the binding. */
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { canonicalJsonStringify, sha256OfString } from '../skill/task-flow-normalizer.ts';
import { loadAppMap, selectAppScope } from '../../../projectctl-requirements/scripts/project/app-map-inventory.ts';
import { collectCriterionIds, CRITERION_ID_PATTERN } from '../../../projectctl-requirements/scripts/project/criterion-contract.ts';

export type Doctor = 'test' | 'structure' | 'docs';
export type Profile = 'technical' | 'documentary';
type Row = Record<string, unknown>;
export interface RequirementsContract {
  schema: string; lane: string; surface_skill_paths: string[]; receipt_marker: string;
  profiles: Record<Profile, { phase: string; states: string[]; artifact: string; doctors: Doctor[] }>;
  machine_preparation: { lane: string; profile: string; phase: string; states: string[]; fields: string[] };
  fingerprints: { criterion_fields: string[]; navigation_fields: string[]; test_roots: string[]; code_roots: string[]; core_roots: string[]; doctor_contract_files: Record<Doctor, string[]>; doctor_global_files: Record<'test' | 'structure', string[]> };
  documentary_checks: Partial<Record<Doctor, string[]>>;
  target_checks: Record<Doctor, string[]>;
  runtime_checks: Record<Doctor, string[]>;
  required_report_checks: Record<Doctor, string[]>;
  supplement_sources: string[];
  gate_evidence: { ready: string; technical: string; documentary: string; invalid: string };
}
export interface Inputs { scope: string; global: string }
export interface Supplement {
  check: string; path?: string; scope: 'target' | 'global'; inputs: string; source: string;
  command: string; verdict: 'pass'; ref: string; sha256: string;
}
export interface DoctorReceipt {
  doctor: Doctor; inputs: Inputs; report: { ref: string; sha256: string };
  supplements: Supplement[];
}
export interface RequirementsReceipt {
  schema: 'requirements-evidence/v1'; profile: Profile; target: string;
  checks: DoctorReceipt[];
}
const object = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);
const digest = (v: unknown) => sha256OfString(canonicalJsonStringify(v));
export function requirementsContract(binding: Row): RequirementsContract {
  const c = binding.requirements_verification;
  if (!object(c) || c.schema !== 'requirements-verification/v1' || !object(c.profiles) || !object(c.fingerprints)
      || !object(c.gate_evidence) || !object(c.machine_preparation) || !object(c.documentary_checks) || !object(c.required_report_checks) || !object(c.target_checks) || !object(c.runtime_checks)
      || !Array.isArray(c.supplement_sources) || !Array.isArray(c.surface_skill_paths) || typeof c.lane !== 'string'
      || typeof c.receipt_marker !== 'string') throw new Error('requirements contract invalid');
  for (const p of ['technical', 'documentary']) {
    const v = c.profiles[p];
    if (!object(v) || typeof v.phase !== 'string' || typeof v.artifact !== 'string' || !Array.isArray(v.states) || !v.states.length
        || !Array.isArray(v.doctors) || !v.doctors.length || v.doctors.some(d => !['test', 'structure', 'docs'].includes(String(d)))
        || new Set(v.doctors).size !== v.doctors.length) throw new Error(`requirements profile invalid: ${p}`);
    const phase = (binding.phases as Row[]).find(phase => phase.id === v.phase);
    if (!phase || !(phase.allowed_lanes as string[]).includes(c.lane) || v.states.some(s => !(phase.states as string[]).includes(String(s)))) throw new Error(`requirements routing invalid: ${p}`);
  }
  for (const key of ['criterion_fields', 'navigation_fields', 'test_roots', 'code_roots', 'core_roots']) {
    const v = c.fingerprints[key];
    if (!Array.isArray(v) || !v.length || v.some(x => typeof x !== 'string' || !x) || new Set(v).size !== v.length) throw new Error(`requirements fingerprint fields invalid: ${key}`);
  }
  for (const doctor of ['test', 'structure', 'docs']) for (const key of ['required_report_checks', 'target_checks', 'runtime_checks']) {
    const values = (c[key] as Row)[doctor];
    if (!Array.isArray(values) || values.some(v => typeof v !== 'string' || !v) || new Set(values).size !== values.length
        || key === 'required_report_checks' && !values.length) throw new Error(`requirements ${key} invalid: ${doctor}`);
  }
  for (const field of ['id', 'title', 'requirement', 'type', 'functional', 'coverage', 'evidence_paths', 'exception_reason', 'skip_quality_gate']) {
    if (!(c.fingerprints.criterion_fields as string[]).includes(field)) throw new Error(`requirements technical field omitted: ${field}`);
  }
  if (c.surface_skill_paths.some(v => typeof v !== 'string' || !v.endsWith('/SKILL.md')) || !c.surface_skill_paths.length
      || c.supplement_sources.some(v => typeof v !== 'string' || !v) || !c.supplement_sources.length) throw new Error('requirements surface/evidence sources invalid');
  for (const key of ['doctor_contract_files', 'doctor_global_files']) {
    if (!object(c.fingerprints[key])) throw new Error(`requirements ${key} invalid`);
    for (const doctor of key === 'doctor_contract_files' ? ['test', 'structure', 'docs'] : ['test', 'structure']) {
      const paths = (c.fingerprints[key] as Row)[doctor];
      if (!Array.isArray(paths) || !paths.length || paths.some(p => typeof p !== 'string' || !p)) throw new Error(`requirements ${key}.${doctor} invalid`);
    }
  }
  const prep = c.machine_preparation;
  const prepPhase = (binding.phases as Row[]).find(phase => phase.id === prep.phase);
  if (!prepPhase || !Array.isArray(prep.states) || !prep.states.length || !(prepPhase.allowed_lanes as string[]).includes(String(prep.lane))
      || prep.states.some(s => !(prepPhase.states as string[]).includes(String(s))) || typeof prep.profile !== 'string'
      || !Array.isArray(prep.fields) || !prep.fields.length || prep.fields.some(f => typeof f !== 'string')) throw new Error('requirements preparation routing invalid');
  for (const v of Object.values(c.gate_evidence)) if (typeof v !== 'string' || !Object.values(binding.gates as Row).some(g => (g as { required_evidence: string[] }).required_evidence.includes(v))) throw new Error('requirements gate evidence invalid');
  return c as unknown as RequirementsContract;
}

/** Reject escapes and symlinks, including parent symlinks. Missing files remain explicit inputs. */
function safePath(root: string, file: string): string {
  if (!file || isAbsolute(file) || file.includes('\\') || file.split('/').some(p => p === '..' || p === '.')) throw new Error(`unsafe requirements input: ${file}`);
  const abs = resolve(root, file);
  if (relative(root, abs).startsWith('..')) throw new Error(`unsafe requirements input: ${file}`);
  let part = resolve(root);
  for (const segment of file.split('/')) {
    part = resolve(part, segment);
    if (existsSync(part) && lstatSync(part).isSymbolicLink()) throw new Error(`symlink requirements input: ${file}`);
  }
  if (existsSync(abs) && realpathSync(abs) !== abs) throw new Error(`symlink requirements input: ${file}`);
  return abs;
}
export function fileDigest(root: string, file: string): string {
  const abs = safePath(root, file);
  if (!existsSync(abs) || !lstatSync(abs).isFile()) throw new Error(`requirements evidence missing: ${file}`);
  return sha256OfString(readFileSync(abs, 'utf8').replace(/\r\n?/g, '\n'));
}
function content(root: string, file: string): string | null {
  const abs = safePath(root, file);
  return existsSync(abs) && lstatSync(abs).isFile() ? readFileSync(abs, 'utf8').replace(/\r\n?/g, '\n') : null;
}
function scan(root: string, directories: string[], predicate: (file: string) => boolean): string[] {
  const out = new Set<string>();
  let budget = 50000;
  const visit = (file: string) => {
    const abs = safePath(root, file);
    if (!existsSync(abs)) return;
    if (--budget < 0) throw new Error('requirements inventory truncated');
    if (lstatSync(abs).isDirectory()) {
      for (const name of readdirSync(abs).sort()) if (!['node_modules', 'dist', 'coverage', '.git', '.runtime', 'test-results'].includes(name) && !name.startsWith('.')) visit(`${file}/${name}`);
    } else if (predicate(file)) out.add(file);
  };
  directories.forEach(visit);
  return [...out].sort();
}
function pick(value: Row, fields: string[]): Row {
  return Object.fromEntries(fields.map(k => [k, value[k] ?? null]));
}

export function requirementsSnapshot(root: string, binding: Row, target: string): { ready: boolean; doctors: Record<Doctor, Inputs> } {
  const contract = requirementsContract(binding);
  if (!target) throw new Error('explicit requirements target required');
  const inventory = loadAppMap(root);
  const scope = selectAppScope(inventory, target);
  const ids = new Set(scope.criteria.map(c => c.id));
  const counts = new Map<string, number>();
  inventory.criteria.forEach(c => counts.set(c.id, (counts.get(c.id) ?? 0) + 1));
  const machine = scope.criteria.map(c => ({ bundle: c.bundle, ...pick({ ...c.data, id: c.id }, contract.fingerprints.criterion_fields) })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const nav = scope.nodes.map(n => pick({ ...n, children: n.children.map(c => c.id) }, contract.fingerprints.navigation_fields));
  let ready = !!content(root, 'playwright/TEST_PLAN.md')?.trim() && !inventory.issues.length && scope.bundles.every(b => !b.error && b.listed) && !!machine.length
    && scope.nodes.every(n => {
      const raw = content(root, `docs/app-map/${n.bundle}.md`);
      const fm = raw?.match(/^---\n([\s\S]*?)\n---/);
      const value = fm ? Bun.YAML.parse(fm[1]) : null;
      return object(value) && value.id === n.id && value.kind === n.kind;
    })
    && scope.criteria.every(c => counts.get(c.id) === 1 && typeof c.data.type === 'string' && typeof c.data.functional === 'string'
      && object(c.data.coverage) && ['Unit', 'PW-CLI', 'PW-AUTO', 'Manual'].every(m => typeof (c.data.coverage as Row)[m] === 'string')
      && (Array.isArray(c.data.evidence_paths) || c.data.functional === 'not-applicable' && typeof c.data.exception_reason === 'string'));
  const testFiles = scan(root, contract.fingerprints.test_roots, f => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(f));
  const selectedTests = testFiles.filter(f => {
    const first = (content(root, f) ?? '').split('\n').slice(0, 10).filter(l => /^\s*\/\/\s*@ac\b/.test(l)).join('\n');
    return collectCriterionIds(first).some(id => ids.has(id))
      || scope.kind === 'view' && /^(?:tests\/(?:unit|e2e)\/)/.test(f) && f.split('/')[2] === scope.nodes[0].id;
  });
  const plan = content(root, 'playwright/TEST_PLAN.md') ?? '';
  const hasHeader = (file: string, id: string) => (content(root, file) ?? '').split('\n').slice(0, 10)
    .some(line => /^\s*\/\/\s*@ac\b/.test(line) && collectCriterionIds(line).includes(id));
  ready = ready && scope.criteria.every(c => {
    const coverage = c.data.coverage as Row;
    if (!coverage) return false;
    return (coverage.Unit !== 'covered' || selectedTests.some(f => /\.test\./.test(f) && hasHeader(f, c.id)))
      && (coverage['PW-AUTO'] !== 'covered' || selectedTests.some(f => /\.spec\./.test(f) && hasHeader(f, c.id) && plan.includes(f)));
  });
  const codeFiles = scan(root, contract.fingerprints.code_roots, f => /\.(?:ts|tsx|js|jsx|sql)$/.test(f) && !/\.(?:test|spec)\./.test(f));
  const selectedCode = codeFiles.filter(f => [...(content(root, f) ?? '').matchAll(new RegExp(`@criterion\\s+(${CRITERION_ID_PATTERN.slice(1, -1)})`, 'gi'))].some(m => ids.has(m[1].toUpperCase()))
    || scope.criteria.some(c => Array.isArray(c.data.evidence_paths) && c.data.evidence_paths.some(p => typeof p === 'string' && (p === f || f.startsWith(`${p}/`)))));
  const files = (names: string[]) => names.map(f => [f, content(root, f)]);
  const roots = contract.fingerprints.core_roots.map(f => {
    const abs = safePath(root, f);
    return [f, existsSync(abs) && lstatSync(abs).isDirectory() ? readdirSync(abs).filter(n => n !== '.gitkeep').length > 0 : null];
  });
  const shared = { contract, ids: [...counts].sort(([a], [b]) => a.localeCompare(b)) };
  const common = { target, ready, machine, nav };
  const evidencePaths = [...new Set(scope.criteria.flatMap(c => Array.isArray(c.data.evidence_paths) ? c.data.evidence_paths as string[] : []))].sort();
  const evidence = evidencePaths.map(f => {
    if (typeof f !== 'string') throw new Error('invalid evidence path');
    const abs = safePath(root, f);
    return [f, existsSync(abs) && lstatSync(abs).isDirectory() ? files(scan(root, [f], () => true)) : content(root, f)];
  });
  const docs = files(scope.nodes.flatMap(n => [`docs/app-map/${n.bundle}.md`, `docs/app-map/${n.bundle}.mmd`]));
  return { ready, doctors: {
    test: { scope: digest({ ...common, tests: files(selectedTests), code: files(selectedCode) }), global: digest({ ...shared, globalFiles: files(contract.fingerprints.doctor_global_files.test), contractFiles: files(contract.fingerprints.doctor_contract_files.test) }) },
    structure: { scope: digest({ ...common, tests: files(selectedTests), code: files(selectedCode), evidence }), global: digest({ ...shared, roots, topology: [...testFiles, ...codeFiles].sort(), globalFiles: files(contract.fingerprints.doctor_global_files.structure), contractFiles: files(contract.fingerprints.doctor_contract_files.structure) }) },
    docs: { scope: digest({ target, docs, navigation: scope.nodes }), global: digest({ contract, contractFiles: files(contract.fingerprints.doctor_contract_files.docs), navigation: inventory.navigation, issues: inventory.issues, ids: [...counts].sort(), docs: files(inventory.nodes.flatMap(n => [`docs/app-map/${n.bundle}.md`, `docs/app-map/${n.bundle}.mmd`])) }) },
  } };
}

export function authorizeRequirements(binding: Row, phase: string | null, state: string, profile: Profile): RequirementsContract['profiles'][Profile] {
  const config = requirementsContract(binding).profiles[profile];
  if (!config || config.phase !== phase || !config.states.includes(state)) throw new Error('requirements profile not authorized at current position');
  return config;
}

export interface RequirementsLaunchContext {
  schema: 'requirements-launch/v1'; profile: Profile; target: string;
  phase: string; state: string; artifact: string;
  inputs: Partial<Record<Doctor, Inputs>>;
  commands: string[][];
  managed_owner: 'sdd-orchestrator';
}
/** Materialize before freezing LaunchPacketV1; validate again immediately before launch. */
export function buildRequirementsLaunch(root: string, binding: Row, phase: string, state: string, profile: Profile, target: string): RequirementsLaunchContext {
  const config = authorizeRequirements(binding, phase, state, profile);
  const snapshot = requirementsSnapshot(root, binding, target);
  if (!snapshot.ready) throw new Error('requirements machine inputs not ready');
  return {
    schema: 'requirements-launch/v1', profile, target, phase, state, artifact: config.artifact,
    inputs: Object.fromEntries(config.doctors.map(d => [d, snapshot.doctors[d]])),
    commands: config.doctors.map(d => ['bun', `.agents/skills/projectctl-requirements/scripts/project/doctor-${d}.ts`, '--root', root, '--json', `--target=${target}`]),
    managed_owner: 'sdd-orchestrator',
  };
}
export function validateRequirementsLaunch(root: string, binding: Row, phase: string, state: string, packet: RequirementsLaunchContext): void {
  const expected = buildRequirementsLaunch(root, binding, phase, state, packet.profile, packet.target);
  if (canonicalJsonStringify(packet) !== canonicalJsonStringify(expected)) throw new Error('launch_packet_invalid: requirements context stale or inconsistent');
}

export function authorizeMachinePreparation(binding: Row, phase: string, state: string, profile: string, owned: string[]): void {
  const c = requirementsContract(binding).machine_preparation;
  if (c.phase !== phase || !c.states.includes(state) || c.profile !== profile || !owned.length
      || owned.some(f => f !== 'playwright/TEST_PLAN.md' && !/^docs\/app-map\/(?!.*(?:^|\/)\.\.\/)[\w./-]+\.(?:md|mmd|yaml)$/.test(f))) throw new Error('machine preparation not authorized');
}

/** Validate existing bundles' actual delta, not only a docs-owned pathname. */
export function validateMachinePreparationChanges(binding: Row, phase: string, state: string, profile: string, changes: Array<{ file: string; before: string | null; after: string }>): void {
  authorizeMachinePreparation(binding, phase, state, profile, changes.map(c => c.file));
  const allowed = new Set(requirementsContract(binding).machine_preparation.fields);
  const front = (raw: string) => {
    const m = raw.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---\n?/);
    const fm = m ? Bun.YAML.parse(m[1]) : null;
    if (!m || !object(fm)) throw new Error('machine preparation frontmatter invalid');
    return { fm, body: raw.replace(/\r\n?/g, '\n').slice(m[0].length) };
  };
  for (const change of changes) {
    if (change.file === 'docs/app-map/navigation.yaml' || change.file === 'playwright/TEST_PLAN.md') continue;
    if (!change.before) {
      // New bundle pairs may be scaffolded, but not filled with an editorial review.
      const body = change.file.endsWith('.md') ? front(change.after).body : change.after;
      if (body.split('\n').filter(l => l.trim()).length > 10) throw new Error('machine preparation scaffold exceeds bounded scope');
      continue;
    }
    if (change.file.endsWith('.mmd')) {
      if (change.before !== change.after) throw new Error('machine preparation cannot edit existing Mermaid');
      continue;
    }
    if (!change.file.endsWith('.md')) throw new Error('machine preparation file outside field contract');
    const before = front(change.before); const after = front(change.after);
    if (before.body !== after.body) throw new Error('machine preparation cannot edit editorial body');
    const editorial = (fm: Row) => Object.fromEntries(Object.entries(fm).filter(([key]) => !allowed.has(key) && key !== 'criteria'));
    if (digest(editorial(before.fm)) !== digest(editorial(after.fm))) throw new Error('machine preparation changed unowned frontmatter');
    const previous = Array.isArray(before.fm.criteria) ? before.fm.criteria : [];
    const next = Array.isArray(after.fm.criteria) ? after.fm.criteria : [];
    const criterionEditorial = (c: Row) => Object.fromEntries(Object.entries(c).filter(([key]) => !allowed.has(key) && !allowed.has(`criteria.${key}`)));
    for (const criterion of previous) {
      if (!object(criterion)) throw new Error('machine preparation criterion invalid');
      const current = next.find(v => object(v) && v.id === criterion.id);
      if (current && digest(criterionEditorial(criterion)) !== digest(criterionEditorial(current))) throw new Error('machine preparation changed criterion editorial fields');
    }
  }
}

export function readRequirementsReceipt(root: string, ref: string, binding: Row): RequirementsReceipt {
  const raw = content(root, ref);
  const marker = requirementsContract(binding).receipt_marker;
  const matches = [...(raw ?? '').matchAll(new RegExp('```' + marker + '\\s*\\n([\\s\\S]*?)\\n```', 'g'))];
  if (matches.length !== 1) throw new Error('exactly one requirements receipt required');
  const receipt = JSON.parse(matches[0][1]);
  if (!object(receipt) || receipt.schema !== 'requirements-evidence/v1' || !['technical', 'documentary'].includes(String(receipt.profile))
      || typeof receipt.target !== 'string' || !Array.isArray(receipt.checks)) throw new Error('requirements receipt invalid');
  return receipt as unknown as RequirementsReceipt;
}

function supplementProves(root: string, s: Supplement, doctor: Doctor, target: string): boolean {
  if (fileDigest(root, s.ref) !== s.sha256) return false;
  const raw = content(root, s.ref);
  if (!raw) return false;
  let evidence: Row;
  try { evidence = JSON.parse(raw); } catch { return false; }
  if (!object(evidence)) return false;
  if (doctor === 'docs' && s.check === 'STRICT_READER') {
    return s.source === 'projectctl' && /^projectctl docs lint(?:\s|$)/.test(s.command)
      && evidence.state === 'valid' && Array.isArray(evidence.errors) && !evidence.errors.length
      && typeof evidence.checkedMarkdown === 'number' && evidence.checkedMarkdown > 0;
  }
  if (doctor === 'structure' && s.check === 'OPERATOR_CHECK') {
    return s.source === 'projectctl' && /^projectctl structure check(?:\s|$)/.test(s.command)
      && evidence.schemaVersion === 'projectctl.structure-check.v1' && evidence.remoteState === 'evaluated'
      && evidence.exitCode === 0 && Array.isArray(evidence.findings) && !evidence.findings.length;
  }
  // Generic runtime/browser/manual observations are reconciled by the sole index writer.
  // This envelope binds checked effects, not a process exit code or a lane's assertion.
  return evidence.schema === 'requirements-runtime-evidence/v1' && evidence.verified_by === 'sdd-orchestrator'
    && evidence.check === s.check && evidence.path === s.path && evidence.scope === s.scope && evidence.inputs === s.inputs
    && evidence.source === s.source && evidence.command === s.command && evidence.verdict === 'pass'
    && (s.scope === 'global' || evidence.target === target)
    && Array.isArray(evidence.observations) && evidence.observations.length > 0
    && evidence.observations.every(v => typeof v === 'string' && !!v.trim());
}

/** A reference or exit-zero is never a pass. Validate report shape, current inputs and every unresolved check. */
export function evaluateRequirements(root: string, binding: Row, receipt: RequirementsReceipt): string[] {
  const c = requirementsContract(binding);
  const profile = c.profiles[receipt.profile];
  if (!profile) return ['requirements profile invalid'];
  const snapshot = requirementsSnapshot(root, binding, receipt.target);
  const errors: string[] = snapshot.ready ? [] : ['requirements machine inputs not ready'];
  if (receipt.checks.length !== profile.doctors.length || new Set(receipt.checks.map(r => r.doctor)).size !== receipt.checks.length
      || profile.doctors.some(d => !receipt.checks.some(r => r.doctor === d))) return [...errors, 'requirements doctor set incomplete'];
  for (const r of receipt.checks) {
    try {
      const live = snapshot.doctors[r.doctor];
      if (!r.inputs || r.inputs.scope !== live.scope || r.inputs.global !== live.global) { errors.push(`${r.doctor}: inputs stale`); continue; }
      if (fileDigest(root, r.report.ref) !== r.report.sha256) throw new Error('report changed');
      const report = JSON.parse(content(root, r.report.ref)!);
      if (!object(report) || !object(report.scope) || report.scope.target !== receipt.target || resolve(String(report.root)) !== resolve(root)) throw new Error('report scope mismatch');
      let findings: Array<{ id: string; status: string; path?: string; criterion_id?: string }>;
      if (r.doctor === 'docs') {
        if (report.schemaVersion !== 1 || !Array.isArray(report.findings) || !Array.isArray(report.policyFindings) || !['unverified', 'valid'].includes(String(report.state))) throw new Error('docs report invalid or failed');
        findings = [...report.findings, ...report.policyFindings].map((v: Row) => ({ id: String(v.code), status: 'fail' }));
        // The local reader is advisory even if a fabricated state says valid.
        findings.push({ id: 'STRICT_READER', status: 'unverified' });
      } else {
        const schema = r.doctor === 'test' ? 'projectctl.test-doctor.v1' : 'projectctl.structure-chain-doctor.v1';
        const rows = r.doctor === 'test' ? report.checks : report.findings;
        if (report.schemaVersion !== schema || report.readOnly !== true || !Array.isArray(rows) || !rows.length || report.managed || report.operator) throw new Error('local doctor report invalid');
        findings = rows.map((v: Row) => ({ id: String(v.id ?? v.code), status: String(v.status), path: String(v.path), criterion_id: typeof v.criterion_id === 'string' ? v.criterion_id : undefined }));
      }
      if (!Array.isArray(r.supplements)) throw new Error('supplements missing');
      if (c.required_report_checks[r.doctor].some(id => !findings.some(f => f.id === id))) throw new Error('required report checks missing');
      for (const f of findings) {
        if (!['pass', 'fail', 'unverified'].includes(f.status)) throw new Error('unknown check status');
        if (f.status === 'fail') { errors.push(`${r.doctor}:${f.id}: failed`); continue; }
        if (c.documentary_checks[r.doctor]?.includes(f.id) || f.status === 'pass' && !c.runtime_checks[r.doctor].includes(f.id)) continue;
        const scope = f.criterion_id || c.target_checks[r.doctor].includes(f.id) ? 'target' : 'global';
        const bound = scope === 'target' ? live.scope : live.global;
        const s = r.supplements.filter(s => s.check === f.id && s.path === f.path);
        if (s.length !== 1 || s[0].scope !== scope || s[0].inputs !== bound || s[0].verdict !== 'pass'
            || !c.supplement_sources.includes(s[0].source) || !s[0].command?.trim() || !supplementProves(root, s[0], r.doctor, receipt.target)) errors.push(`${r.doctor}:${f.id}: unverified (${scope})`);
      }
    } catch (error) { errors.push(`${r.doctor}: ${(error as Error).message}`); }
  }
  return errors;
}
