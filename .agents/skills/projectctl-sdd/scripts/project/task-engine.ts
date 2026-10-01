/** sdd-orchestrator-owned task index operations. All paths and state values come from the resolved binding. */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseBindingFile } from '../skill/task-flow-normalizer.ts';
import { authorizeRequirements, evaluateRequirements, fileDigest, readRequirementsReceipt, requirementsContract, requirementsSnapshot, type Profile } from './requirements-evidence.ts';
import { criteriaBaseline, criteriaIdentityContract, parseCriteriaChange, validateCriteriaChange, validateCriteriaLinks, type CriteriaChange } from './criteria-change.ts';
import { requireAppMap } from '../../../projectctl-requirements/scripts/project/app-map-inventory.ts';
import { isCriterionId, isRetiredCriterion } from '../../../projectctl-requirements/scripts/project/criterion-contract.ts';
import { criterionReferences } from '../../../projectctl-requirements/scripts/project/criterion-references.ts';
import { executionDigest, phaseExecutionPolicy, type PhaseExecutionRecord } from './phase-execution.ts';
import { composeSelectedExtensions } from '../skill/task-flow-extension.ts';

type Entry = Record<string, unknown>;
type Transition = { from: string; to: string; guard?: string; blocking_gates?: string[]; id?: string };
type Phase = { id: string; status: string; states: string[]; allowed_lanes: string[]; transitions: Transition[] };
type Control = { id: string; writes_state: boolean; value?: Position; transitions: Transition[] };
export type Position = { phase: string | null; state: string; status: string };
type Binding = {
  binding_id: string; binding_version: string;
  task: { id_pattern: string; slug_pattern: string; file_pattern: string };
  artifact_store: { primary: { path_pattern: string; index_budget?: { max_lines: number } }; phase_artifacts: { path_pattern: string; artifact_keys: string[] } };
  status: { writable: string[]; pre_bootstrap: string };
  phases: Phase[]; controls: Control[];
  gates: Record<string, { required_evidence: string[] }>;
  delivery: { branch_pattern: string; source_branch: string; target_branch: string; required_evidence_at_close: string[] };
  retired_aliases: string[];
  modes: Record<string, { allowed: string[]; default: string }>;
};
type RecordData = { schema: 'task-operations/v1'; evidence: Record<string, string>; approvals: Record<string, Entry>; execution?: PhaseExecutionRecord; browser?: Entry; blockers?: Entry[]; checkpoint?: Entry; delivery?: Entry; environment?: Entry; verification?: Record<string, Entry>; requirements?: { targets: string[]; receipts: Partial<Record<Profile, Record<string, { ref: string; sha256: string }>>> } };
type Task = { file: string; raw: string; front: Record<string, string>; body: string; record: RecordData };
const START = '<!-- task-operations:start -->';
const END = '<!-- task-operations:end -->';
const NOW = () => new Date().toISOString();
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const scalar = (value: string) => JSON.stringify(value);
function requireValue(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}
function within(root: string, file: string): string {
  const absolute = resolve(root, file);
  const rel = relative(root, absolute);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`path outside project: ${file}`);
  let part = root;
  for (const component of rel.split(sep)) {
    part = resolve(part, component);
    if (existsSync(part) && lstatSync(part).isSymbolicLink()) throw new Error(`symlink forbidden: ${part}`);
  }
  return absolute;
}
function readLocator(root: string): { binding: Binding; path: string } {
  try {
    const locator = JSON.parse(readFileSync(within(root, '.agents/sdd-workflow.json'), 'utf8')) as Entry;
    if (locator.contract_version !== 2 || locator.machine_block_id !== 'task-flow-binding' || typeof locator.binding_path !== 'string') throw new Error('invalid workflow locator');
    const path = locator.binding_path;
    within(root, path);
    const { binding } = parseBindingFile(root, path);
    if (binding.binding_id !== locator.expected_binding_id || binding.binding_version !== locator.expected_binding_version) throw new Error('locator/binding identity mismatch');
    return { binding: binding as unknown as Binding, path };
  } catch (error) {
    const message = (error as Error).message ?? String(error);
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    const isMissing = code === 'ENOENT' || message.includes('ENOENT') || message.includes('no such file');
    const isBadJson = error instanceof SyntaxError || message.includes('is not valid JSON') || message.includes('Unexpected token');
    if (message.includes('invalid workflow locator') || message.includes('locator/binding identity mismatch') || isMissing || isBadJson) {
      if (message.includes(' — fix: cp .agents/skills/projectctl-sdd/assets/sdd-workflow.example.json .agents/sdd-workflow.json')) throw error;
      throw new Error(`${message} — fix: cp .agents/skills/projectctl-sdd/assets/sdd-workflow.example.json .agents/sdd-workflow.json`);
    }
    throw error;
  }
}
function target(binding: Binding, id: string, slug: string): string {
  if (!new RegExp(binding.task.id_pattern).test(id) || !new RegExp(binding.task.slug_pattern).test(slug)) throw new Error('invalid task id or slug');
  return binding.task.file_pattern.replace('<task_id>', id).replace('<task_slug>', slug);
}
function parseTask(file: string, raw: string): Task {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(raw);
  if (!match) throw new Error('invalid task frontmatter');
  const front: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const field = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (!field || Object.hasOwn(front, field[1]!)) throw new Error(`unsupported or duplicate frontmatter field: ${line}`);
    const value = field[2]!.trim();
    if (value.startsWith('"')) {
      try { front[field[1]!] = JSON.parse(value); } catch { throw new Error(`invalid frontmatter value: ${line}`); }
    } else front[field[1]!] = value;
  }
  const body = raw.slice(match[0].length);
  const blocks = [...body.matchAll(/<!-- task-operations:start -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- task-operations:end -->/g)];
  if (blocks.length > 1 || (body.includes(START) && blocks.length !== 1) || (body.includes(END) && blocks.length !== 1)) throw new Error('invalid task operations block');
  let record: RecordData = { schema: 'task-operations/v1', evidence: {}, approvals: {} };
  if (blocks.length) {
    record = JSON.parse(blocks[0]![1]!) as RecordData;
    if (record.schema !== 'task-operations/v1' || !record.evidence || !record.approvals || Array.isArray(record.evidence)) throw new Error('invalid task operations schema');
  }
  return { file, raw, front, body, record };
}
function render(task: Task): string {
  const fm = Object.entries(task.front).map(([key, value]) => `${key}: ${key === 'phase' && value === 'null' ? 'null' : scalar(value)}`).join('\n');
  const block = `${START}\n\`\`\`json\n${JSON.stringify(task.record, null, 2)}\n\`\`\`\n${END}`;
  const body = task.body.includes(START)
    ? task.body.replace(/<!-- task-operations:start -->\s*```json\s*[\s\S]*?\s*```\s*<!-- task-operations:end -->/, block)
    : `${task.body.trimEnd()}\n\n### Task operations\n\n${block}\n`;
  return `---\n${fm}\n---\n${body}`;
}
function position(task: Task): Position {
  return { phase: task.front.phase === 'null' || !task.front.phase ? null : task.front.phase!, state: task.front.state ?? '', status: task.front.status ?? '' };
}
function validPosition(binding: Binding, current: Position): boolean {
  if (current.status === binding.status.pre_bootstrap && !current.phase && !current.state) return true;
  if (binding.phases.some(p => p.id === current.phase && p.status === current.status && p.states.includes(current.state))) return true;
  return binding.controls.some(c => c.writes_state && c.value?.phase === current.phase && c.value?.state === current.state && c.value?.status === current.status)
    || (['blocked', 'failed'].includes(current.status) && binding.controls.some(c => c.writes_state && c.value?.phase === current.phase && c.value?.state === current.state))
    || binding.controls.some(c => !c.writes_state && c.id === current.status && current.phase !== null && binding.phases.some(p => p.id === current.phase && p.states.includes(current.state)));
}
function issues(root: string, binding: Binding, task: Task): string[] {
  const errors: string[] = [];
  try {
    const expected = target(binding, task.front.task_id!, task.front.task_slug!);
    if (task.file !== expected) errors.push(`task filename must be ${expected}`);
  } catch (e) { errors.push((e as Error).message); }
  if (task.front.binding_id !== binding.binding_id || task.front.binding_version !== binding.binding_version) errors.push('binding identity mismatch');
  if (!validPosition(binding, position(task))) errors.push('invalid phase/state/status tuple');
  if (binding.retired_aliases.some(alias => Object.values(position(task)).includes(alias))) errors.push('retired alias active');
  if (task.front.phase_artifacts_dir !== task.file.replace(/\.md$/, '/')) errors.push('phase artifacts directory mismatch');
  if (task.front.source_branch !== binding.delivery.source_branch || task.front.target_branch !== binding.delivery.target_branch) errors.push('delivery branch mismatch');
  const branch = binding.delivery.branch_pattern.replace('<task_id>', task.front.task_id!).replace('<task_slug>', task.front.task_slug!);
  if (task.front.branch_name !== branch) errors.push('canonical branch name mismatch');
  for (const [key, data] of Object.entries(task.record.evidence)) {
    if (!binding.gates || typeof data !== 'string' || !data) errors.push(`invalid evidence: ${key}`);
  }
  if (task.record.delivery?.pr_url && task.front.pr_url !== task.record.delivery.pr_url) errors.push('PR URL differs from operations record');
  if (task.record.browser?.credentials_ref && typeof task.record.browser.credentials_ref !== 'string') errors.push('invalid credentials reference');
  if (task.record.execution) {
    const e = task.record.execution;
    if (typeof e !== 'object' || Array.isArray(e)) errors.push('invalid phase execution record');
    const a = e.authorization;
    if (a && (a.schema !== 'phase-authorization/v1' || !binding.phases.some(p => p.id === a.phase)
        || !a.actor || !a.literal_message || !a.recorded_at || !/^[a-f0-9]{64}$/.test(a.contract_digest))) errors.push('invalid phase authorization');
    for (const q of [e.question, e.last_transition]) if (q && (q.schema !== 'phase-question/v1' || !q.from || !q.to
        || !q.question || !q.asked_at || !/^[a-f0-9]{64}$/.test(q.revision)
        || (q.confirmation && (!q.confirmation.actor || !q.confirmation.literal_message || !q.confirmation.recorded_at)))) errors.push('invalid phase question');
  }
  if (task.record.environment) {
    const record = task.record.environment;
    const allowed = (binding as Binding & { modes: { environment_deferral?: { allowed_methods: string[] } } }).modes.environment_deferral?.allowed_methods ?? [];
    if (!['pending_environment', 'completed'].includes(String(record.status)) || !Array.isArray(record.methods) || !Array.isArray(record.audit)
        || !record.actor || !record.reason || !record.verification_revision
        || record.methods.some((m: unknown) => !allowed.includes(String(m))) || new Set(record.methods).size !== record.methods.length
        || (record.status === 'pending_environment' && !record.methods.length) || (record.status === 'completed' && record.methods.length)) errors.push('invalid pending environment record');
  }
  if (task.record.requirements) {
    const r = task.record.requirements;
    if (!Array.isArray(r.targets) || !r.targets.length || r.targets.some(t => typeof t !== 'string' || !t)
        || new Set(r.targets).size !== r.targets.length || !r.receipts || typeof r.receipts !== 'object' || Array.isArray(r.receipts)) errors.push('invalid requirements record');
    else for (const [profile, receipts] of Object.entries(r.receipts)) {
      if (!['technical', 'documentary'].includes(profile) || !receipts || typeof receipts !== 'object' || Array.isArray(receipts)) { errors.push('invalid requirements profile record'); continue; }
      for (const [target, stored] of Object.entries(receipts)) if (!r.targets.includes(target) || !stored || typeof stored.ref !== 'string' || !/^[a-f0-9]{64}$/.test(stored.sha256)) errors.push('invalid requirements receipt reference');
    }
  }
  if (task.front.pr_url && task.body.includes('- **PR URL**:') && !task.body.includes(`- **PR URL**: \`${task.front.pr_url}\``)) errors.push('PR URL differs between frontmatter and section 9');
  if (task.front.status === 'done' && (!task.front.pr_url || !task.record.delivery?.pr_url)) errors.push('terminal task requires verified PR');
  if (task.raw.split('\n').length > (binding.artifact_store.primary.index_budget?.max_lines ?? Infinity)) errors.push('index line budget exceeded');
  return errors;
}
function load(root: string, binding: Binding, file: string): Task {
  const absolute = within(root, file);
  const task = parseTask(relative(root, absolute).split(sep).join('/'), readFileSync(absolute, 'utf8'));
  const errors = issues(root, binding, task);
  if (errors.length) throw new Error(errors.join('; '));
  return task;
}
function save(root: string, binding: Binding, task: Task): void {
  task.front.updated = NOW();
  const contents = render(task);
  const candidate = parseTask(task.file, contents);
  const errors = issues(root, binding, candidate);
  if (errors.length) throw new Error(errors.join('; '));
  const absolute = within(root, task.file);
  const lock = `${absolute}.lock`;
  mkdirSync(lock); // exclusive, fail closed if another writer is active
  let tmp = '';
  try {
    if (readFileSync(absolute, 'utf8') !== task.raw) throw new Error('task changed concurrently; retry after rereading');
    tmp = `${absolute}.${process.pid}.${Date.now()}.tmp`;
    const fd = openSync(tmp, 'wx', 0o600);
    try { writeFileSync(fd, contents); } finally { closeSync(fd); }
    renameSync(tmp, absolute);
  } finally {
    if (tmp && existsSync(tmp)) unlinkSync(tmp);
    rmdirSync(lock);
  }
}
function command(root: string, executable: string, args: string[]): string {
  const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`${executable} ${args.join(' ')} failed: ${(result.stderr || result.error?.message || '').trim()}`);
  return result.stdout.trim();
}
export class TaskEngine {
  readonly root: string;
  readonly binding: Binding;
  readonly bindingPath: string;
  private readonly baseBinding: Binding;
  private readonly taskFile?: string;
  private selections(front: Record<string, string>): Record<string, string> {
    const declarations = (this.baseBinding as unknown as Entry).extensions as Record<string, { selector: string }>;
    return Object.fromEntries(Object.values(declarations).filter(d => front[d.selector]).map(d => [d.selector, front[d.selector]!]));
  }
  constructor(root: string, file?: string) {
    this.root = resolve(root);
    const context = readLocator(this.root);
    this.baseBinding = context.binding;
    this.taskFile = file;
    const selected = file ? this.selections(parseTask(file, readFileSync(within(this.root, file), 'utf8')).front) : {};
    this.binding = composeSelectedExtensions(context.binding as unknown as Entry, this.root, selected) as unknown as Binding;
    this.bindingPath = context.path;
  }
  /** Re-resolve live sources on every admission; cached/session rules cannot authorize work. */
  private executionContract() {
    const live = readLocator(this.root);
    const selected = this.taskFile ? this.selections(parseTask(this.taskFile, readFileSync(within(this.root, this.taskFile), 'utf8')).front) : {};
    const composed = composeSelectedExtensions(live.binding as unknown as Entry, this.root, selected);
    if (executionDigest(composed) !== executionDigest(this.binding) || live.path !== this.bindingPath) throw new Error('phase_contract_stale');
    const policy = phaseExecutionPolicy(this.binding as unknown as Entry);
    const baseSources = (this.baseBinding as unknown as { active_sources: { include: string[] } }).active_sources.include;
    const extensionSources = (this.binding as unknown as { active_sources: { include: string[] } }).active_sources.include.filter(path => !baseSources.includes(path));
    const paths = ['.agents/sdd-workflow.json', this.bindingPath, ...policy.startup_paths, ...extensionSources];
    const sources = Object.fromEntries(paths.map(path => [path, hash(readFileSync(within(this.root, path), 'utf8'))]));
    return { policy, sources, digest: executionDigest(sources) };
  }
  private targetPosition(to: string): Position {
    const phase = this.binding.phases.find(p => p.states.includes(to));
    const control = this.binding.controls.find(c => c.id === to && c.writes_state);
    if (!phase && !control?.value) throw new Error(`unknown target: ${to}`);
    return phase ? { phase: phase.id, state: to, status: phase.status } : control!.value!;
  }
  private executionRevision(task: Task): string {
    const { updated: _updated, ...front } = task.front;
    const { execution, ...record } = task.record;
    const { question: _question, last_transition: _last, ...executionInputs } = execution ?? {};
    // Only question bookkeeping is excluded; changing execution scope invalidates consent too.
    const body = task.body.replace(/<!-- task-operations:start -->[\s\S]*?<!-- task-operations:end -->/, '');
    return executionDigest({ front, body, record, execution: executionInputs, contract: this.executionContract().digest });
  }
  phaseMigrate(file: string, actor: string, message: string): void {
    const absolute = within(this.root, file);
    const task = parseTask(relative(this.root, absolute).split(sep).join('/'), readFileSync(absolute, 'utf8'));
    if (task.front.binding_id !== this.binding.binding_id || task.front.binding_version !== '15.0.0') throw new Error('phase_migration_requires_v15_index');
    requireValue(actor, 'actor'); requireValue(message, 'literal message');
    this.executionContract();
    task.front.binding_version = this.binding.binding_version;
    task.front.binding_path = this.bindingPath;
    task.record.execution = {};
    task.record.checkpoint = { last_action: 'Explicit phase-execution contract migration', actor, literal_message: message,
      recorded_at: NOW(), next_action: 'Ask for current-phase execution authorization' };
    save(this.root, this.binding, task);
  }
  phaseStart(file: string, actor: string, message: string): void {
    const task = load(this.root, this.binding, file);
    const current = position(task);
    if (!current.phase || ['blocked', 'failed'].includes(current.status)) throw new Error('phase_start_requires_active_position');
    const { digest } = this.executionContract();
    requireValue(actor, 'actor'); requireValue(message, 'literal message');
    task.record.execution ??= {};
    task.record.execution.authorization = { schema: 'phase-authorization/v1', phase: current.phase,
      actor, literal_message: message, recorded_at: NOW(), contract_digest: digest };
    save(this.root, this.binding, task);
  }
  phaseRequest(file: string, to: string, question: string): void {
    const task = load(this.root, this.binding, file);
    const current = position(task);
    const next = this.targetPosition(to);
    if (current.phase === next.phase) throw new Error('phase_question_requires_cross_phase_transition');
    if (!this.inspect(file).transitions.some(t => t.to === to)) throw new Error('phase_question_transition_not_declared');
    requireValue(question, 'question');
    task.record.execution ??= {};
    task.record.execution.question = { schema: 'phase-question/v1', from: current.state, to,
      from_phase: current.phase, to_phase: next.phase, question,
      asked_at: NOW(), revision: this.executionRevision(task) };
    save(this.root, this.binding, task);
  }
  phaseConfirm(file: string, actor: string, message: string): void {
    const task = load(this.root, this.binding, file);
    const q = task.record.execution?.question;
    if (!q || q.confirmation || q.from !== task.front.state || q.revision !== this.executionRevision(task)) throw new Error('phase_question_missing_or_stale');
    requireValue(actor, 'actor'); requireValue(message, 'literal message');
    q.confirmation = { actor, literal_message: message, recorded_at: NOW() };
    save(this.root, this.binding, task);
  }
  phaseStatus(file: string) {
    const task = load(this.root, this.binding, file);
    const current = position(task);
    const contract = this.executionContract();
    const authorization = task.record.execution?.authorization;
    return { schema: 'phase-status/v1', position: current, contract_digest: contract.digest, sources: contract.sources,
      authorized: !!authorization && authorization.phase === current.phase && authorization.contract_digest === contract.digest,
      at_phase_boundary: !!current.phase && contract.policy.stop_states[current.phase]?.includes(current.state) === true,
      authorization: authorization ?? null, question: task.record.execution?.question ?? null };
  }
  phaseLaunch(file: string, lane: string) {
    const status = this.phaseStatus(file);
    if (['blocked', 'failed'].includes(status.position.status)) throw new Error('phase_execution_interrupted');
    if (!status.authorized) throw new Error('phase_execution_not_authorized');
    if (status.at_phase_boundary) throw new Error('phase_execution_boundary_reached');
    const phase = this.binding.phases.find(p => p.id === status.position.phase);
    if (!phase?.states.includes(status.position.state) || !phase.allowed_lanes.includes(lane)) throw new Error('lane_not_allowed_in_phase');
    const policy = phaseExecutionPolicy(this.binding as unknown as Entry);
    if (!policy.lane_states[lane]?.includes(status.position.state)) throw new Error('lane_not_allowed_in_state');
    const task = load(this.root, this.binding, file);
    return { schema: 'phase-launch/v1', lane_id: lane, position: status.position, authorization: status.authorization,
      contract_digest: status.contract_digest, task_revision: hash(task.raw), sources: status.sources };
  }
  phaseValidateLaunch(file: string, packet: unknown): void {
    if (!packet || typeof packet !== 'object' || Array.isArray(packet)) throw new Error('phase_launch_packet_invalid');
    const supplied = packet as Entry;
    const admission = supplied.execution_context as Entry | undefined;
    const routing = supplied.routing as Entry | undefined;
    if (supplied.schema !== 'launch-packet/v1' || !admission || typeof admission.lane_id !== 'string'
        || routing?.lane_id !== admission.lane_id) throw new Error('phase_launch_packet_invalid');
    const expected = this.phaseLaunch(file, admission.lane_id);
    if (executionDigest(admission) !== executionDigest(expected)) throw new Error('phase_launch_packet_stale_or_inconsistent');
  }
  phaseValidateLaunchFile(file: string, ref: string): void {
    this.phaseValidateLaunch(file, JSON.parse(readFileSync(within(this.root, ref), 'utf8')));
  }
  init(input: { id: string; slug: string; title: string; problem: string; appMap: string }): string {
    const file = target(this.binding, input.id, input.slug);
    const abs = within(this.root, file);
    const folder = within(this.root, file.replace(/\.md$/, ''));
    if (existsSync(abs) || existsSync(folder)) throw new Error('task already exists');
    requireValue(input.title, 'title'); requireValue(input.problem, 'problem'); requireValue(input.appMap, 'app-map');
    const phase = this.binding.phases[0]!;
    const front: Record<string, string> = {
      title: input.title, task_id: input.id, task_slug: input.slug, sdd_change_id: '',
      binding_id: this.binding.binding_id, binding_version: this.binding.binding_version, binding_path: this.bindingPath,
      sdd_persistence: 'taskReadme index + phase artifacts', phase_artifacts_dir: `${file.slice(0, -3)}/`,
      status: phase.status, phase: phase.id, state: phase.states[0]!, created: NOW(), updated: NOW(),
      source_branch: this.binding.delivery.source_branch, target_branch: this.binding.delivery.target_branch,
      branch_name: this.binding.delivery.branch_pattern.replace('<task_id>', input.id).replace('<task_slug>', input.slug), pr_url: '', blocked_reason: '',
    };
    const body = `# Task: ${input.title}\n\n## 1. Objetivo\n\n${input.problem}\n\n## 2. Contexto operativo\n\n- **App Map**: ${input.appMap}\n\n## 3. Criterios de aceptación\n\n| AC-ID | Veredicto | Método |\n| --- | --- | --- |\n\n## 4. Fases\n\n| Fase | Estado | Resumen | Artefacto |\n| --- | --- | --- | --- |\n\n## 5. Work units\n\n| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |\n| --- | --- | --- | --- | --- |\n\n## 6. Verificación\n\n- **Estado consolidado**: \`pending\`\n\n## 7. Estado actual / Siguiente paso / Handoff\n\n- **Estado actual**: \`${phase.status}\`\n- **Fase / State**: \`${phase.id}\` / \`${phase.states[0]}\`\n- **Siguiente paso**: \`sdd-init\`\n\n## 8. Problemas / Blockers\n\n## 9. Git y PR\n\n- **Rama actual**: \`${front.branch_name}\`\n- **PR URL**: \`\`\n- **Base target**: \`${front.target_branch}\`\n- **Estado de PR**: \`not_created\`\n\n## Task skill snapshot\n\n\`\`\`json\n{"schema":"task-skills/v1","skills":[]}\n\`\`\`\n`;
    const task: Task = { file, raw: '', front, body, record: { schema: 'task-operations/v1', evidence: { canonical_task_exists: file, required_inputs_valid: file }, approvals: {} } };
    const output = render(task);
    const errors = issues(this.root, this.binding, parseTask(file, output));
    if (errors.length) throw new Error(errors.join('; '));
    mkdirSync(dirname(abs), { recursive: true });
    mkdirSync(folder);
    try { const fd = openSync(abs, 'wx', 0o600); try { writeFileSync(fd, output); } finally { closeSync(fd); } }
    catch (error) { rmdirSync(folder); throw error; }
    return file;
  }
  validate(file: string): string[] {
    const absolute = within(this.root, file);
    return issues(this.root, this.binding, parseTask(relative(this.root, absolute).split(sep).join('/'), readFileSync(absolute, 'utf8')));
  }
  inspect(file: string): { position: Position; transitions: Array<{ to: string; guard?: string; missing: string[] }> } {
    const task = load(this.root, this.binding, file);
    const current = position(task);
    const transitions = [...this.binding.phases.flatMap(p => p.transitions), ...this.binding.controls.flatMap(c => c.transitions)].filter(t => t.from === current.state);
    return { position: current, transitions: transitions.map(t => ({ to: t.to, guard: t.guard, missing: [...this.missing(task, t), ...this.phaseTransitionMissing(task, t.to)] })) };
  }
  private phaseTransitionMissing(task: Task, to: string): string[] {
    if (position(task).phase === this.targetPosition(to).phase) return [];
    const q = task.record.execution?.question;
    if (!q || q.schema !== 'phase-question/v1' || q.from !== task.front.state || q.to !== to
        || q.from_phase !== position(task).phase || q.to_phase !== this.targetPosition(to).phase
        || !q.confirmation?.actor || !q.confirmation.literal_message || q.revision !== this.executionRevision(task)) return ['phase_change_confirmation_required'];
    return [];
  }
  private missing(task: Task, transition: Transition): string[] {
    const contract = requirementsContract(this.binding as unknown as Entry);
    const identity = criteriaIdentityContract(this.binding as unknown as Entry);
    const computedCache = new Map<string, boolean>();
    const compute = (id: string): boolean | undefined => {
      if (['spec_complete', 'design_complete', 'tasks_complete'].includes(id)) {
        const kind = id.replace('_complete', '');
        const ref = `${task.front.phase_artifacts_dir}${kind}.md`;
        if (task.record.evidence[id] !== ref) return false;
        try {
          const content = readFileSync(within(this.root, ref), 'utf8').trim();
          if (!content) return false;
          if (kind !== 'design') this.planningLinks(task, this.approvedChange(task));
          return true;
        } catch { return false; }
      }
      if ([identity.approval_evidence, identity.planning_evidence, identity.close_evidence].includes(id)) {
        try {
          const change = this.approvedChange(task);
          if (id === identity.approval_evidence) validateCriteriaChange(this.root, change, 'baseline');
          if (id === identity.planning_evidence) {
            try { validateCriteriaChange(this.root, change, 'baseline'); }
            catch { validateCriteriaChange(this.root, change, 'applied'); }
            this.planningLinks(task, change);
          }
          if (id === identity.close_evidence) this.materializedChange(change);
          return true;
        } catch { return false; }
      }
      if (id === 'pending_environment_active_methods_empty_or_record_absent') return !task.record.environment || task.record.environment.status === 'completed' && Array.isArray(task.record.environment.methods) && !task.record.environment.methods.length;
      if (id === 'environment_verification_deferred_entry_recorded') return task.record.environment?.documentation_candidate === 'allowed';
      if (id === contract.gate_evidence.ready) {
        return !!task.record.requirements?.targets.length && task.record.requirements.targets.every(target => {
          try { return requirementsSnapshot(this.root, this.binding as unknown as Entry, target).ready; } catch { return false; }
        });
      }
      if (id === contract.gate_evidence.technical) return this.requirementsProblems(task, 'technical').length === 0;
      if (id === contract.gate_evidence.documentary) return this.requirementsProblems(task, 'documentary').length === 0;
      if (id === contract.gate_evidence.invalid) return this.requirementsProblems(task, 'technical').length > 0;
      return undefined;
    };
    const computed = (id: string): boolean | undefined => {
      if (computedCache.has(id)) return computedCache.get(id);
      const result = compute(id);
      if (result !== undefined) computedCache.set(id, result);
      return result;
    };
    const gates = [transition.guard, ...(transition.blocking_gates ?? [])].filter((g): g is string => !!g);
    const evaluate = (g: string, visited: Set<string>): string[] => {
      if (visited.has(g)) throw new Error(`cyclic guard: ${g}`);
      const gate = this.binding.gates[g];
      if (!gate) throw new Error(`unknown guard ${g}`);
      const next = new Set([...visited, g]);
      return gate.required_evidence.flatMap(id => computed(id) !== undefined ? computed(id) ? [] : [`${g}: ${id}`]
        : this.binding.gates[id] ? evaluate(id, next)
        : task.record.evidence[id] ? [] : [`${g}: ${id}`]);
    };
    const missing = gates.flatMap(g => evaluate(g, new Set()));
    if (['p4_complete', 'final_commit_pending', 'final_push_pending', 'final_pr_pending', 'done'].includes(transition.to)
        && !computed(identity.close_evidence)) missing.push(identity.close_evidence);
    if (['p4_complete', 'final_commit_pending', 'final_push_pending', 'final_pr_pending', 'done'].includes(transition.to)
        && task.record.environment && Array.isArray(task.record.environment.methods) && task.record.environment.methods.length) missing.push('pending_environment_close_block');
    if (['p4_complete', 'final_commit_pending', 'final_push_pending', 'final_pr_pending', 'done'].includes(transition.to)
        && task.record.environment?.documentation_candidate === 'allowed') missing.push('environment_document_candidate_return_required');
    return missing;
  }
  transition(file: string, to: string): Position {
    const task = load(this.root, this.binding, file);
    const current = position(task);
    if (current.status === 'blocked' || current.status === 'failed') throw new Error('resume interrupted position first');
    this.executionContract();
    const candidates = [...this.binding.phases.flatMap(p => p.transitions), ...this.binding.controls.flatMap(c => c.transitions)]
      .filter(t => t.from === current.state && t.to === to);
    if (!candidates.length) throw new Error(`transition not declared: ${current.state} -> ${to}`);
    if (this.phaseTransitionMissing(task, to).length) throw new Error('phase_change_confirmation_required: ask the user and record a fresh answer before changing phase');
    // Environmental candidates retain their own audited return even when the
    // ordinary technical-invalid predicate also allows the same target.
    const environmentalReturn = task.record.environment?.documentation_candidate === 'allowed'
      ? candidates.find(t => t.guard === 'p4_document_candidate_written' && this.missing(task, t).length === 0) : undefined;
    const eligible = environmentalReturn ?? candidates.find(t => this.missing(task, t).length === 0);
    if (!eligible) throw new Error(`transition guards unsatisfied: ${candidates.map(t => this.missing(task, t).join(', ')).join(' OR ')}`);
    if (to === 'p2_planning' || to === 'p3_test_preparing' && current.state === 'p2_accepted') {
      const branch = command(this.root, 'git', ['branch', '--show-current']);
      if (branch !== task.front.branch_name) throw new Error('canonical branch is not active');
    }
    if (to === 'done') {
      const absent = this.binding.delivery.required_evidence_at_close.filter(key => !task.record.evidence[key] && !(key === 'branch_name' && task.record.delivery?.branch_verified) && !(key === 'pr_url' && task.record.delivery?.pr_url));
      if (absent.length) throw new Error(`close evidence missing: ${absent.join(', ')}`);
    }
    const phase = this.binding.phases.find(p => p.states.includes(to));
    const control = this.binding.controls.find(c => c.id === to && c.writes_state);
    if (!phase && !control?.value) throw new Error(`unknown target: ${to}`);
    const next = phase ? { phase: phase.id, state: to, status: phase.status } : control!.value!;
    if (next.phase !== current.phase) {
      const execution = task.record.execution!;
      execution.last_transition = execution.question;
      delete execution.question;
      delete execution.authorization;
    }
    if (eligible.guard === 'environment_verification_deferred' && task.record.environment) task.record.environment.documentation_candidate = 'allowed';
    if (eligible.guard === 'p4_document_candidate_written' && task.record.environment) task.record.environment.documentation_candidate = 'written_returned_to_p3';
    task.front.phase = next.phase ?? 'null'; task.front.state = next.state; task.front.status = next.status;
    if (to === 'p1_accepted' && task.record.approvals.proposal) task.record.evidence.p1_accepted = `approval:proposal:${task.record.approvals.proposal.revision}`;
    if (to === 'p2_accepted' && task.record.approvals.functionality) task.record.evidence.p2_accepted = `approval:functionality:${task.record.approvals.functionality.revision}`;
    this.syncPosition(task);
    task.record.checkpoint = { last_action: `transition ${current.state} -> ${to}`, recorded_at: NOW() };
    save(this.root, this.binding, task);
    return next;
  }
  private syncPosition(task: Task): void {
    task.body = task.body.replace(/^- \*\*Estado actual\*\*:.*$/m, `- **Estado actual**: \`${task.front.status}\``)
      .replace(/^- \*\*Fase \/ State\*\*:.*$/m, `- **Fase / State**: \`${task.front.phase}\` / \`${task.front.state}\``);
  }
  evidence(file: string, id: string, ref: string): void {
    const task = load(this.root, this.binding, file);
    const authorityOnly = new Set(['approval_actor', 'approval_literal_message', 'approval_utc_timestamp', 'approved_revision', 'approved_criteria_ids',
      'explicit_user_approval_recorded', 'explicit_user_functional_acceptance_recorded', 'p1_accepted', 'p2_accepted', 'branch_created_from_source_branch', 'canonical_branch_active', 'branch_name', 'pr_url']);
    if (authorityOnly.has(id)) throw new Error(`evidence ${id} must be recorded through the owning approval/Git command`);
    const identity = criteriaIdentityContract(this.binding as unknown as Entry);
    if ([identity.approval_evidence, identity.planning_evidence, identity.close_evidence].includes(id)) throw new Error('canonical criteria evidence is computed, never recorded by reference');
    if (Object.values(requirementsContract(this.binding as unknown as Entry).gate_evidence).includes(id)) throw new Error('requirements evidence must be computed from current scoped receipts');
    if (!Object.values(this.binding.gates).some(g => g.required_evidence.includes(id)) && !this.binding.delivery.required_evidence_at_close.includes(id)) throw new Error(`unknown evidence id: ${id}`);
    const full = within(this.root, ref);
    if (!existsSync(full) || !lstatSync(full).isFile()) throw new Error(`evidence artifact missing: ${ref}`);
    task.record.evidence[id] = relative(this.root, full).split(sep).join('/');
    save(this.root, this.binding, task);
  }
  artifact(file: string, kind: string, ref: string, summary: string): void {
    const task = load(this.root, this.binding, file);
    const allowed = this.binding.artifact_store.phase_artifacts.artifact_keys;
    if (!allowed.includes(kind) && !(kind.startsWith('apply-') && allowed.includes('apply-<unit_id>'))) throw new Error(`unknown artifact kind: ${kind}`);
    const expected = this.binding.artifact_store.phase_artifacts.path_pattern
      .replace('<task_id>', task.front.task_id!).replace('<task_slug>', task.front.task_slug!).replace('<artifact>', kind);
    if (ref !== expected || !existsSync(within(this.root, ref))) throw new Error(`artifact must exist at ${expected}`);
    requireValue(summary, 'summary');
    if (kind === 'proposal') validateCriteriaChange(this.root, parseCriteriaChange(readFileSync(within(this.root, ref), 'utf8')), 'baseline');
    if (kind === 'spec' || kind === 'tasks') {
      const change = this.approvedChange(task);
      const spec = kind === 'tasks' ? validateCriteriaLinks(readFileSync(within(this.root, `${task.front.phase_artifacts_dir}spec.md`), 'utf8'), change.changes.map(c => c.id), 'spec') : undefined;
      validateCriteriaLinks(readFileSync(within(this.root, ref), 'utf8'), change.changes.map(c => c.id), kind, spec);
    }
    if (summary.split('\n').length > 10 || summary.includes('|')) throw new Error('summary too long or contains table delimiter');
    const section = /^## 4\. Fases\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m;
    if (!section.test(task.body)) throw new Error('phase table section missing');
    const row = `| ${kind} | \`done\` | ${summary} | \`${ref}\` |`;
    task.body = task.body.replace(section, (whole) => {
      // Older indices use translated phase labels; identify the row by its
      // canonical artifact reference as well as by the current kind label.
      const lines = whole.split('\n').filter(l => !l.startsWith(`| ${kind} |`) && !(l.startsWith('| ') && l.includes(`\`${ref}\``)));
      const insert = lines.findIndex(l => l.startsWith('| ---'));
      if (insert < 0) throw new Error('phase table missing');
      lines.splice(insert + 1, 0, row);
      return lines.join('\n');
    });
    if (kind === 'proposal') task.record.evidence.proposal_complete = ref;
    save(this.root, this.binding, task);
  }
  workUnit(file: string, id: string, lane: string, applyLane: string, status: string, ref: string): void {
    const task = load(this.root, this.binding, file);
    if (!/^[A-Za-z0-9-]+$/.test(id) || !['pending', 'in_progress', 'done', 'blocked', 'failed'].includes(status)) throw new Error('invalid work unit id or status');
    const registry = (this.binding as Binding & { lanes: Record<string, { apply_lane?: string; role: string }> }).lanes;
    if (!registry[lane] || (registry[lane].apply_lane && registry[lane].apply_lane !== applyLane)) throw new Error('work unit lane mismatch');
    const links = this.planningLinks(task, this.approvedChange(task));
    const unit = links.units?.find(u => u.id === id);
    if (!unit || (applyLane !== 'none' && (!unit.criterion_ids.length || unit.mechanical))) throw new Error('work unit canonical criterion links missing');
    if (status === 'done' && (!ref || !existsSync(within(this.root, ref)))) throw new Error('completed work unit requires existing evidence artifact');
    if (ref && !ref.startsWith(task.front.phase_artifacts_dir!)) throw new Error('work unit evidence outside task artifacts');
    if (status === 'done' && ref !== `${task.front.phase_artifacts_dir}apply-${id}.md` && !registry[lane]?.role?.startsWith('verification')) throw new Error('work unit evidence path mismatch');
    if (status === 'done') {
      const breakdown = within(this.root, `${task.front.phase_artifacts_dir}tasks.md`);
      if (!existsSync(breakdown) || !readFileSync(breakdown, 'utf8').includes(id)) throw new Error(`completed work unit ${id} missing from canonical tasks breakdown`);
    }
    const section = /^## 5\. Work units\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m;
    if (!section.test(task.body)) throw new Error('work unit table section missing');
    task.body = task.body.replace(section, whole => {
      const lines = whole.split('\n').filter(l => l.split('|')[1]?.trim().replaceAll('`', '') !== id);
      const insert = lines.findIndex(l => l.startsWith('| ---'));
      if (insert < 0) throw new Error('work unit table missing');
      lines.splice(insert + 1, 0, `| ${id} | ${lane} | ${applyLane} | \`${status}\` | \`${ref}\` |`);
      return lines.join('\n');
    });
    save(this.root, this.binding, task);
  }
  criterion(file: string, id: string, verdict: string, method: string, ref?: string): void {
    const task = load(this.root, this.binding, file);
    const methods = method.split('+');
    if (!isCriterionId(id) || !['pending', 'passed', 'failed', 'not_applicable'].includes(verdict)
        || new Set(methods).size !== methods.length || methods.some(m => !['Unit', 'PW-CLI', 'PW-AUTO', 'Manual', 'not_required'].includes(m))
        || (methods.includes('not_required') && methods.length !== 1)) throw new Error('invalid acceptance criterion');
    const change = this.approvedChange(task);
    const approved = change.changes.find(c => c.id === id);
    if (!approved) throw new Error(`criterion not approved: ${id}`);
    if (verdict !== 'pending') {
      const current = requireAppMap(this.root).criteria.find(c => c.id === id);
      if (!current || current.bundle !== approved.bundle || (isRetiredCriterion(current.data) && approved.operation !== 'remove')) throw new Error('criterion canonical owner missing or retired');
    }
    if (verdict === 'passed' && (!ref || !existsSync(within(this.root, ref)))) throw new Error('passed criterion requires existing evidence');
    const section = /^## 3\. Criterios de aceptación\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m;
    if (!section.test(task.body)) throw new Error('criteria section missing');
    task.body = task.body.replace(section, whole => {
      const lines = whole.split('\n').filter(l => l.split('|')[1]?.trim().replaceAll('`', '') !== id);
      const insert = lines.findIndex(l => l.startsWith('| ---'));
      if (insert < 0) throw new Error('criteria table missing');
      lines.splice(insert + 1, 0, `| \`${id}\` | \`${verdict}\` | \`${method}\` |`);
      return lines.join('\n');
    });
    if (ref) task.record.evidence[`criterion:${id}`] = ref;
    save(this.root, this.binding, task);
  }
  verification(file: string, lane: string, verdict: string, ref: string): void {
    const task = load(this.root, this.binding, file);
    if (!['pending', 'passed', 'failed', 'blocked', 'partial', 'not_required'].includes(verdict)) throw new Error('invalid verification verdict');
    const registry = (this.binding as Binding & { lanes: Record<string, { role: string }> }).lanes;
    if (registry[lane]?.role !== 'verification') throw new Error('unknown verification lane');
    if (lane === requirementsContract(this.binding as unknown as Entry).lane) throw new Error('use requirements record with explicit profile and target');
    if (verdict !== 'not_required' && (!ref || !existsSync(within(this.root, ref)))) throw new Error('verification artifact missing');
    task.record.verification = { ...task.record.verification, [lane]: { verdict, artifact_ref: ref, recorded_at: NOW() } };
    save(this.root, this.binding, task);
  }
  requirementsTargets(file: string, targets: string[]): void {
    const task = load(this.root, this.binding, file);
    if (!targets.length || new Set(targets).size !== targets.length) throw new Error('non-empty unique requirements targets required');
    targets.forEach(target => requirementsSnapshot(this.root, this.binding as unknown as Entry, target));
    const canonicalTargets = [...targets].sort();
    if (JSON.stringify(task.record.requirements?.targets) === JSON.stringify(canonicalTargets)) return;
    // A scope change cannot reuse the previous task-wide certification.
    task.record.requirements = { targets: canonicalTargets, receipts: {} };
    save(this.root, this.binding, task);
  }
  requirementsInputs(file: string, target: string): ReturnType<typeof requirementsSnapshot> {
    const task = load(this.root, this.binding, file);
    if (!task.record.requirements?.targets.includes(target)) throw new Error('requirements target not assigned to task');
    return requirementsSnapshot(this.root, this.binding as unknown as Entry, target);
  }
  private requirementsProblems(task: Task, profile: Profile): string[] {
    const record = task.record.requirements;
    if (!record?.targets.length) return ['requirements targets missing'];
    return record.targets.flatMap(target => {
      try {
        const stored = record.receipts[profile]?.[target];
        if (!stored || fileDigest(this.root, stored.ref) !== stored.sha256) return [`${profile}:${target}: receipt missing or changed`];
        const receipt = readRequirementsReceipt(this.root, stored.ref, this.binding as unknown as Entry);
        if (receipt.profile !== profile || receipt.target !== target) return [`${profile}:${target}: receipt scope mismatch`];
        return evaluateRequirements(this.root, this.binding as unknown as Entry, receipt).map(error => `${profile}:${target}: ${error}`);
      } catch (error) { return [`${profile}:${target}: ${(error as Error).message}`]; }
    });
  }
  requirementsStatus(file: string): Record<Profile, string[]> {
    const task = load(this.root, this.binding, file);
    return { technical: this.requirementsProblems(task, 'technical'), documentary: this.requirementsProblems(task, 'documentary') };
  }
  requirementsRecord(file: string, profile: Profile, target: string, ref: string): void {
    const task = load(this.root, this.binding, file);
    const config = authorizeRequirements(this.binding as unknown as Entry, position(task).phase, position(task).state, profile);
    if (!task.record.requirements?.targets.includes(target)) throw new Error('requirements target not assigned to task');
    const expected = `${task.front.phase_artifacts_dir}${config.artifact}.md`;
    // Multiple scopes use an explicitly numbered sibling, not an inferred view filename.
    const index = task.record.requirements.targets.indexOf(target);
    const numbered = expected.replace(/\.md$/, `-${index + 1}.md`);
    if (ref !== (task.record.requirements.targets.length === 1 ? expected : numbered)) throw new Error(`requirements artifact mismatch: ${ref}`);
    const receipt = readRequirementsReceipt(this.root, ref, this.binding as unknown as Entry);
    if (receipt.profile !== profile || receipt.target !== target) throw new Error('requirements receipt scope mismatch');
    const errors = evaluateRequirements(this.root, this.binding as unknown as Entry, receipt);
    if (errors.length) throw new Error(`requirements unverified: ${errors.join('; ')}`);
    const records = task.record.requirements.receipts;
    records[profile] = { ...records[profile], [target]: { ref, sha256: fileDigest(this.root, ref) } };
    save(this.root, this.binding, task);
  }
  environmentDefer(file: string, actor: string, reason: string, revision: string): void {
    const task = load(this.root, this.binding, file);
    if (task.front.state !== 'p3_coverage_pending' || task.record.environment?.status === 'pending_environment') throw new Error('environment deferral requires phase 3 coverage pending and no active record');
    const config = (this.binding as Binding & { modes: { environment_deferral: { allowed_methods: string[] } } }).modes.environment_deferral;
    if (!Array.isArray(config?.allowed_methods) || !config.allowed_methods.length) throw new Error('environment deferral not configured');
    task.record.environment = { status: 'pending_environment', actor: requireValue(actor, 'actor'), reason: requireValue(reason, 'reason'),
      recorded_at: NOW(), verification_revision: requireValue(revision, 'verification-revision'), methods: [...config.allowed_methods], documentation_candidate: 'not_started',
      audit: [...(Array.isArray(task.record.environment?.audit) ? task.record.environment.audit : []), { action: 'deferred', actor, recorded_at: NOW(), methods: [...config.allowed_methods] }] };
    save(this.root, this.binding, task);
  }
  environmentComplete(file: string, method: string, revision: string, ref: string): void {
    const task = load(this.root, this.binding, file);
    const entry = task.record.environment;
    if (!entry || entry.status !== 'pending_environment' || !Array.isArray(entry.methods) || !entry.methods.includes(method) || entry.verification_revision !== revision) throw new Error('method not pending at this verification revision');
    if (!ref || !existsSync(within(this.root, ref))) throw new Error('method completion requires existing evidence artifact');
    const audit = entry.audit;
    if (!Array.isArray(audit)) throw new Error('invalid environment audit');
    audit.push({ action: 'method_completed', method, revision, ref, recorded_at: NOW() });
    entry.methods = entry.methods.filter(value => value !== method);
    if (!entry.methods.length) {
      task.record.evidence.pending_environment_active_methods_empty_or_record_absent = ref;
      entry.status = 'completed'; entry.completed_at = NOW();
    }
    save(this.root, this.binding, task);
  }
  skills(file: string, ids: string[]): void {
    const task = load(this.root, this.binding, file);
    if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-z0-9][a-z0-9-]*$/.test(id))) throw new Error('invalid or duplicate skill ids');
    for (const id of ids) {
      const base = within(this.root, '.agents/skills');
      const entries = readdirSync(base, { withFileTypes: true });
      const matches = entries.filter(entry => entry.isDirectory() && existsSync(resolve(base, entry.name, 'SKILL.md'))
        && lstatSync(resolve(base, entry.name, 'SKILL.md')).isFile()
        && new RegExp(`^\\s*id:\\s*["']?${id}["']?\\s*$`, 'm').test(readFileSync(resolve(base, entry.name, 'SKILL.md'), 'utf8')));
      if (matches.length !== 1) throw new Error(`skill id missing or ambiguous: ${id}`);
    }
    const block = `\`\`\`json\n${JSON.stringify({ schema: 'task-skills/v1', skills: ids.map(id => ({ id })) }, null, 2)}\n\`\`\``;
    const re = /(## Task skill snapshot\s*\n)[\s\S]*?(?=^## |$(?![\s\S]))/m;
    if (!re.test(task.body)) throw new Error('task skill snapshot section missing');
    task.body = task.body.replace(re, `$1\n${block}\n\n`);
    save(this.root, this.binding, task);
  }
  accept(file: string, kind: 'proposal' | 'functionality', actor: string, message: string, revision: string, criteria: string[]): void {
    const task = load(this.root, this.binding, file);
    const state = kind === 'proposal' ? 'p1_awaiting_acceptance' : 'p2_awaiting_acceptance';
    if (task.front.state !== state) throw new Error(`acceptance requires ${state}`);
    requireValue(actor, 'actor'); requireValue(message, 'literal message');
    if (kind === 'proposal') {
      const proposal = within(this.root, `${task.front.phase_artifacts_dir}proposal.md`);
      if (!existsSync(proposal) || hash(readFileSync(proposal, 'utf8')) !== revision) throw new Error('proposal revision must be the sha256 of the canonical proposal artifact');
      const change = parseCriteriaChange(readFileSync(proposal, 'utf8'));
      validateCriteriaChange(this.root, change, 'baseline');
      const expected = change.changes.map(c => c.id).sort();
      if (criteria.some(c => !isCriterionId(c)) || new Set(criteria).size !== criteria.length
          || JSON.stringify([...criteria].sort()) !== JSON.stringify(expected)) throw new Error('approved criteria must exactly match canonical proposal IDs');
    } else if (!revision) throw new Error('functional revision required');
    task.record.approvals[kind] = { actor, literal_message: message, revision, criteria, recorded_at: NOW() };
    const keys = kind === 'proposal'
      ? ['approval_actor', 'approval_literal_message', 'approval_utc_timestamp', 'approved_revision', 'approved_criteria_ids', 'explicit_user_approval_recorded']
      : ['explicit_user_functional_acceptance_recorded'];
    for (const key of keys) task.record.evidence[key] = `approval:${kind}:${revision}`;
    save(this.root, this.binding, task);
    this.transition(file, kind === 'proposal' ? 'p1_accepted' : 'p2_accepted');
  }
  private approvedChange(task: Task): CriteriaChange {
    const approval = task.record.approvals.proposal;
    const raw = readFileSync(within(this.root, `${task.front.phase_artifacts_dir}proposal.md`), 'utf8');
    if (!approval || approval.revision !== hash(raw)) throw new Error('canonical proposal approval missing or stale');
    const change = parseCriteriaChange(raw);
    if (JSON.stringify([...(approval.criteria as string[])].sort()) !== JSON.stringify(change.changes.map(c => c.id).sort())) throw new Error('approved criterion identity mismatch');
    return change;
  }
  private planningLinks(task: Task, change: CriteriaChange) {
    const ids = change.changes.map(c => c.id);
    const spec = validateCriteriaLinks(readFileSync(within(this.root, `${task.front.phase_artifacts_dir}spec.md`), 'utf8'), ids, 'spec');
    return validateCriteriaLinks(readFileSync(within(this.root, `${task.front.phase_artifacts_dir}tasks.md`), 'utf8'), ids, 'tasks', spec);
  }
  private materializedChange(change: CriteriaChange): void {
    validateCriteriaChange(this.root, change, 'applied');
    const contract = requirementsContract(this.binding as unknown as Entry);
    const removed = change.changes.filter(c => c.operation === 'remove').map(c => c.id);
    const refs = criterionReferences(this.root, [...new Set([...contract.fingerprints.test_roots, ...contract.fingerprints.code_roots])], removed);
    if (refs.length) throw new Error(`retired criteria still have operative references: ${refs.map(r => `${r.id}@${r.path}:${r.line}`).join(', ')}`);
  }
  criteriaBaseline(targets: string[]) { return criteriaBaseline(this.root, targets); }
  proposalCheck(file: string, stage: 'baseline' | 'applied' = 'baseline') {
    const task = load(this.root, this.binding, file);
    const change = stage === 'applied' ? this.approvedChange(task) : parseCriteriaChange(readFileSync(within(this.root, `${task.front.phase_artifacts_dir}proposal.md`), 'utf8'));
    if (stage === 'applied') this.materializedChange(change);
    else validateCriteriaChange(this.root, change, stage);
    return { ok: true, targets: change.targets, added: change.changes.filter(c => c.operation === 'add'), modified: change.changes.filter(c => c.operation === 'modify'), removed: change.changes.filter(c => c.operation === 'remove'), maintained: change.changes.filter(c => c.operation === 'maintain'), no_criteria_reason: change.no_criteria_reason };
  }
  branch(file: string): string {
    const task = load(this.root, this.binding, file);
    if (task.front.state !== 'branch_creation_pending') throw new Error('branch creation requires branch_creation_pending');
    if (!task.record.approvals.proposal) throw new Error('proposal acceptance missing');
    validateCriteriaChange(this.root, this.approvedChange(task), 'baseline');
    const expected = task.front.branch_name!;
    const current = command(this.root, 'git', ['branch', '--show-current']);
    if (current !== expected) {
      if (current !== this.binding.delivery.source_branch) throw new Error(`expected source branch ${this.binding.delivery.source_branch}, got ${current}`);
      const existing = spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${expected}`], { cwd: this.root });
      if (existing.status === 0) command(this.root, 'git', ['switch', expected]);
      else if (existing.status === 1) command(this.root, 'git', ['switch', '-c', expected]);
      else throw new Error('cannot inspect branch');
    }
    this.recordVerifiedBranch(task);
    task.record.evidence.branch_created_from_source_branch = `git:${expected}`;
    save(this.root, this.binding, task);
    return expected;
  }
  branchVerify(file: string): string {
    const task = load(this.root, this.binding, file);
    this.recordVerifiedBranch(task);
    save(this.root, this.binding, task);
    return task.front.branch_name!;
  }
  private recordVerifiedBranch(task: Task): void {
    const expected = task.front.branch_name!;
    if (command(this.root, 'git', ['branch', '--show-current']) !== expected) throw new Error('branch verification failed: canonical branch is not active');
    task.record.delivery = { ...task.record.delivery, branch_verified: true, branch_name: expected };
    task.record.evidence.canonical_branch_active = `git:${expected}`;
    task.record.evidence.branch_name = `git:${expected}`;
  }
  pr(file: string, url: string): void {
    const task = load(this.root, this.binding, file);
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || !/^\/[^/]+\/[^/]+\/pull\/\d+$/.test(parsed.pathname)) throw new Error('invalid GitHub PR URL');
    const repository = JSON.parse(command(this.root, 'gh', ['repo', 'view', '--json', 'nameWithOwner'])) as Entry;
    if (repository.nameWithOwner !== parsed.pathname.split('/').slice(1, 3).join('/')) throw new Error('PR belongs to another repository');
    const view = JSON.parse(command(this.root, 'gh', ['pr', 'view', url, '--json', 'url,headRefName,baseRefName,state'])) as Entry;
    if (view.url !== url || view.headRefName !== task.front.branch_name || view.baseRefName !== task.front.target_branch || view.state !== 'OPEN') throw new Error('PR does not match task branch, base or open state');
    task.front.pr_url = url;
    task.body = task.body.replace(/^- \*\*PR URL\*\*:.*$/m, `- **PR URL**: \`${url}\``).replace(/^- \*\*Estado de PR\*\*:.*$/m, '- **Estado de PR**: `open`');
    task.record.delivery = { ...task.record.delivery, pr_url: url };
    task.record.evidence.pr_url = `gh:${url}`;
    save(this.root, this.binding, task);
  }
  browser(file: string, input: { environment: string; baseUrl: string; runtimeKind: string; credentialsRef: string }): void {
    const task = load(this.root, this.binding, file);
    const url = new URL(requireValue(input.baseUrl, 'base-url'));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid browser base URL');
    const credentials = requireValue(input.credentialsRef, 'credentials-ref');
    if (!/^[a-z][a-z0-9+.-]*:\/\//.test(credentials)) {
      const path = within(this.root, credentials);
      if (!existsSync(path)) throw new Error('credentials contract reference missing');
    }
    if (/password|token|secret/i.test(credentials) && !credentials.includes('://')) throw new Error('credentials-ref must be a contract reference, never a secret');
    task.record.browser = { environment: requireValue(input.environment, 'environment'), base_url: url.toString(), runtime_kind: requireValue(input.runtimeKind, 'runtime-kind'), credentials_ref: credentials };
    save(this.root, this.binding, task);
  }
  mode(file: string, name: 'review_mode' | 'delivery_mode', value: string): void {
    const task = load(this.root, this.binding, file);
    if (!this.binding.modes[name]?.allowed.includes(value)) throw new Error(`invalid ${name}: ${value}`);
    task.front[name] = value;
    save(this.root, this.binding, task);
  }
  checkpoint(file: string, action: string, next: string, artifact?: string): void {
    const task = load(this.root, this.binding, file);
    task.record.checkpoint = { last_action: requireValue(action, 'last-action'), next_action: requireValue(next, 'next-action'), artifact_ref: artifact ?? null, recorded_at: NOW() };
    task.body = task.body.replace(/^- \*\*Siguiente paso\*\*:.*$/m, `- **Siguiente paso**: ${task.record.checkpoint.next_action}`);
    save(this.root, this.binding, task);
  }
  outcome(file: string, status: 'blocked' | 'failed' | 'resume', reason?: string): void {
    const task = load(this.root, this.binding, file);
    if (status === 'resume') {
      if (!['blocked', 'failed'].includes(task.front.status!)) throw new Error('task is not interrupted');
      const phase = this.binding.phases.find(p => p.id === task.front.phase);
      if (!phase) throw new Error('invalid interrupted phase');
      task.front.status = phase.status; task.front.blocked_reason = '';
      task.body = task.body.replace(/^- \*\*Bloqueo activo\*\*:.*\n?/m, '');
    } else {
      task.front.status = status; task.front.blocked_reason = requireValue(reason, 'reason');
      task.record.blockers = [...(task.record.blockers ?? []), { status, reason, recorded_at: NOW() }];
      const active = `- **Bloqueo activo**: ${task.front.blocked_reason.replace(/[\r\n]/g, ' ')}`;
      task.body = task.body.replace(/(## 8\. Problemas \/ Blockers\n)(?:\n- \*\*Bloqueo activo\*\*:.*\n)?/, `$1\n${active}\n`);
    }
    this.syncPosition(task); save(this.root, this.binding, task);
  }
}
