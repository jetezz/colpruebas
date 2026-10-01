import { afterEach, describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { TaskEngine } from '../project/task-engine.ts';
import { run } from '../project/tasks.ts';
import { phaseExecutionPolicy } from '../project/phase-execution.ts';
import { criterionRevision } from '../../../projectctl-requirements/scripts/project/criterion-contract.ts';
import { parseBindingFile } from '../skill/task-flow-normalizer.ts';
import { composeSelectedExtensions } from '../skill/task-flow-extension.ts';

const repo = resolve(import.meta.dir, '../../../../..');
const binding = parseBindingFile(repo).binding;
const roots: string[] = [];
const put = (root: string, path: string, contents: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), contents);
};
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'sdd-phase-execution-')); roots.push(root);
  for (const path of ['.agents/sdd-workflow.json', '.agents/skills/projectctl-sdd/references/tasks/binding.md', ...phaseExecutionPolicy(binding).startup_paths]) {
    put(root, path, readFileSync(join(repo, path), 'utf8'));
  }
  put(root, 'docs/app-map/navigation.yaml', 'root_id: app\nnavigation:\n  - id: app\n    title: App\n    kind: view\n    bundle: app\n    children: []\n');
  put(root, 'docs/app-map/app.md', '---\ncriteria:\n  - id: PCT-155\n    title: Stable acceptance\n    type: tooling\n---\n');
  const engine = new TaskEngine(root);
  const file = engine.init({ id: '20261001-phase01', slug: 'phase-contract', title: 'Phase contract', problem: 'Respect boundaries', appMap: 'app' });
  return { root, engine, file };
}
function at(root: string, file: string, phase: string, state: string, status: string) {
  // Isolate guard/admission tests at a declared position, without claiming production progress.
  put(root, file, readFileSync(join(root, file), 'utf8').replace(/^phase:.*$/m, `phase: "${phase}"`)
    .replace(/^state:.*$/m, `state: "${state}"`).replace(/^status:.*$/m, `status: "${status}"`));
}
function prepareBranch() {
  const f = setup(); const { root, engine, file } = f;
  const git = (args: string[]) => {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim();
  };
  git(['init', '-b', 'develop']);
  const def = { id: 'PCT-155', title: 'Stable acceptance', type: 'tooling' };
  const proposal = `Proposal\n\n\`\`\`criteria-change\n${JSON.stringify({ schema: 'criteria-change/v1', targets: ['app'], baseline: [{ id: def.id, bundle: 'docs/app-map/app.md', revision: criterionRevision(def), retired: false }], changes: [{ id: def.id, bundle: 'docs/app-map/app.md', operation: 'maintain', before: def, after: def, reason: 'Preserve behavior' }] })}\n\`\`\`\n`;
  const proposalRef = file.replace(/\.md$/, '/proposal.md');
  put(root, proposalRef, proposal);
  engine.phaseStart(file, 'user', 'Realiza fase 1');
  engine.transition(file, 'p1_exploring'); engine.transition(file, 'p1_drafting'); engine.transition(file, 'p1_awaiting_acceptance');
  engine.artifact(file, 'proposal', proposalRef, 'Ready for decision');
  engine.accept(file, 'proposal', 'user', 'Acepto la propuesta, realiza fase 2', createHash('sha256').update(proposal).digest('hex'), [def.id]);
  engine.evidence(file, 'phase_2_hold_released', proposalRef);
  engine.transition(file, 'branch_creation_pending'); engine.branch(file);
  return f;
}
function enterPhase2() {
  const f = prepareBranch();
  f.engine.phaseRequest(f.file, 'p2_planning', '¿Autorizas cambiar a fase 2 y ejecutarla completa?');
  f.engine.phaseConfirm(f.file, 'user', 'Sí, ejecuta fase 2');
  f.engine.transition(f.file, 'p2_planning');
  f.engine.phaseStart(f.file, 'user', 'Sí, ejecuta fase 2');
  return f;
}
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

describe('explicit phase execution contract', () => {
  it('blocks launch without execution permission and admits only the current lane/state', () => {
    const { root, engine, file } = setup();
    expect(() => engine.phaseLaunch(file, 'sdd-init')).toThrow('not_authorized');
    engine.phaseStart(file, 'user', 'Realiza fase 1');
    expect(engine.phaseLaunch(file, 'sdd-init')).toMatchObject({ schema: 'phase-launch/v1', lane_id: 'sdd-init', position: { state: 'p1_started' } });
    expect(() => engine.phaseLaunch(file, 'sdd-spec')).toThrow('lane_not_allowed_in_phase');
    expect(() => engine.phaseLaunch(file, 'sdd-propose')).toThrow('lane_not_allowed_in_state');
    expect(new TaskEngine(root).phaseLaunch(file, 'sdd-init').authorization?.literal_message).toBe('Realiza fase 1');
  });
  it('an approval and request for the next phase still cannot bypass the question', () => {
    const { root, engine, file } = prepareBranch();
    const before = readFileSync(join(root, file), 'utf8');
    expect(() => engine.transition(file, 'p2_planning')).toThrow('phase_change_confirmation_required');
    expect(readFileSync(join(root, file), 'utf8')).toBe(before);
    expect(engine.inspect(file).transitions[0]?.missing).toEqual(['phase_change_confirmation_required']);
    expect(engine.phaseStatus(file).authorization?.phase).toBe('fase_1_propuesta');
  });
  it('requires an answer after a question and consumes exactly one cross-phase permission', () => {
    const { root, engine, file } = prepareBranch();
    expect(() => engine.phaseConfirm(file, 'user', 'Sí')).toThrow('question_missing');
    engine.phaseRequest(file, 'p2_planning', '¿Autorizas fase 2?');
    expect(() => engine.transition(file, 'p2_planning')).toThrow('confirmation_required');
    engine.phaseConfirm(file, 'user', 'Sí');
    expect(engine.transition(file, 'p2_planning').phase).toBe('fase_2_implementacion');
    expect(engine.phaseStatus(file).authorized).toBe(false);
    expect(engine.phaseStatus(file).question).toBeNull();
    expect(() => engine.phaseLaunch(file, 'sdd-spec')).toThrow('not_authorized');
    expect(new TaskEngine(root).phaseStatus(file).authorized).toBe(false);
    expect(() => engine.phaseConfirm(file, 'user', 'Sí otra vez')).toThrow('question_missing');
  });
  it('invalidates an answer after a task change and requires a fresh question', () => {
    const { engine, file } = prepareBranch();
    engine.phaseRequest(file, 'p2_planning', '¿Autorizas fase 2?'); engine.phaseConfirm(file, 'user', 'Sí');
    engine.checkpoint(file, 'New evidence', 'Reconcile changes');
    expect(() => engine.transition(file, 'p2_planning')).toThrow('confirmation_required');
    engine.phaseRequest(file, 'p2_planning', 'Cambió el índice. ¿Autorizas fase 2?'); engine.phaseConfirm(file, 'user', 'Sí');
    expect(engine.transition(file, 'p2_planning').state).toBe('p2_planning');
  });
  it('keeps literal messages and invalidates consent when the execution request changes', () => {
    const { engine, file } = prepareBranch();
    engine.phaseRequest(file, 'p2_planning', '¿Autorizas fase 2?'); engine.phaseConfirm(file, 'user', '  Sí  ');
    expect(engine.phaseStatus(file).question?.confirmation?.literal_message).toBe('  Sí  ');
    engine.phaseStart(file, 'user', 'Cambió el alcance; continúa solo en la fase actual');
    expect(() => engine.transition(file, 'p2_planning')).toThrow('confirmation_required');
  });
  it('runs planning, implementation and review within the phase without asking between lanes', () => {
    const { root, engine, file } = enterPhase2();
    const dir = file.replace(/\.md$/, '/');
    expect(engine.phaseLaunch(file, 'sdd-spec').position.state).toBe('p2_planning');
    put(root, `${dir}spec.md`, '```criteria-links\n{"schema":"criteria-links/v1","criteria":["PCT-155"],"scenarios":[{"id":"S1","criterion_ids":["PCT-155"]}]}\n```');
    engine.artifact(file, 'spec', `${dir}spec.md`, 'Scenarios ready');
    expect(engine.phaseStatus(file).at_phase_boundary).toBe(false);
    expect(() => engine.phaseLaunch(file, 'sdd-apply-code-low')).toThrow('lane_not_allowed_in_state');
    expect(() => engine.transition(file, 'p2_implementing')).toThrow('guards unsatisfied');
    expect(engine.phaseLaunch(file, 'sdd-design').position.state).toBe('p2_planning');
    put(root, `${dir}design.md`, '# Design\nExplicit contracts and dependency order');
    expect(engine.phaseLaunch(file, 'sdd-tasks').position.state).toBe('p2_planning');
    put(root, `${dir}tasks.md`, '```criteria-links\n{"schema":"criteria-links/v1","criteria":["PCT-155"],"units":[{"id":"WU-A","criterion_ids":["PCT-155"],"scenario_ids":["S1"]}]}\n```');
    for (const kind of ['spec', 'design', 'tasks']) engine.evidence(file, `${kind}_complete`, `${dir}${kind}.md`);
    expect(engine.transition(file, 'p2_implementing').state).toBe('p2_implementing');
    expect(engine.phaseLaunch(file, 'sdd-apply-code-low').position.state).toBe('p2_implementing');
    put(root, `${dir}apply-WU-A.md`, '# Apply\nVerified fixture implementation');
    engine.workUnit(file, 'WU-A', 'sdd-apply-code-low', 'code-low', 'done', `${dir}apply-WU-A.md`);
    engine.evidence(file, 'assigned_code_work_units_complete', `${dir}apply-WU-A.md`);
    engine.transition(file, 'p2_code_review');
    expect(engine.phaseLaunch(file, 'sdd-verify-code').position.state).toBe('p2_code_review');
    put(root, `${dir}verify-code.md`, '# Review\nNo defects; functional summary verified');
    for (const id of ['selected_review_mechanism_green', 'no_known_functional_or_code_quality_defect', 'functional_summary_complete']) engine.evidence(file, id, `${dir}verify-code.md`);
    engine.transition(file, 'p2_awaiting_acceptance');
    expect(engine.phaseStatus(file).at_phase_boundary).toBe(true);
    expect(() => engine.phaseLaunch(file, 'sdd-spec')).toThrow('boundary_reached');
    engine.accept(file, 'functionality', 'user', 'Acepto la implementación', 'fixture-code-revision', []);
    expect(() => engine.transition(file, 'p3_test_preparing')).toThrow('confirmation_required');
    expect(engine.phaseStatus(file).position.state).toBe('p2_accepted');
  });
  it('does not accept a proposal file as evidence for missing planning artifacts', () => {
    const { engine, file } = enterPhase2();
    const ref = file.replace(/\.md$/, '/proposal.md');
    for (const id of ['spec_complete', 'design_complete', 'tasks_complete']) engine.evidence(file, id, ref);
    expect(() => engine.transition(file, 'p2_implementing')).toThrow('guards unsatisfied');
  });
  it('requires a question for backward verification and does not remove technical guards', () => {
    const { root, engine, file } = setup();
    at(root, file, 'fase_4_documentacion', 'p4_reviewing', 'documenting');
    expect(() => engine.transition(file, 'p3_test_preparing')).toThrow('confirmation_required');
    engine.phaseRequest(file, 'p3_test_preparing', '¿Autorizas volver a verificar?'); engine.phaseConfirm(file, 'user', 'Sí');
    expect(engine.transition(file, 'p3_test_preparing').phase).toBe('fase_3_verificacion');
    expect(() => engine.phaseLaunch(file, 'sdd-apply-unit-tests')).toThrow('not_authorized');
  });
  it('P3 completion cannot start P4 silently, and confirmation never makes a missing technical gate green', () => {
    const { root, engine, file } = setup();
    at(root, file, 'fase_3_verificacion', 'p3_complete', 'testing');
    expect(() => engine.transition(file, 'p4_started')).toThrow('confirmation_required');
    engine.phaseRequest(file, 'p4_started', '¿Autorizas fase 4?'); engine.phaseConfirm(file, 'user', 'Sí');
    expect(() => engine.transition(file, 'p4_started')).toThrow('guards unsatisfied');
    expect(engine.inspect(file).position.state).toBe('p3_complete');
  });
  it('terminal closure also requires a question', () => {
    const { root, engine, file } = setup();
    at(root, file, 'fase_4_documentacion', 'final_pr_pending', 'documenting');
    expect(() => engine.transition(file, 'done')).toThrow('confirmation_required');
    expect(() => engine.phaseRequest(file, 'p4_documenting', '¿Continuar?')).toThrow('cross_phase');
    engine.phaseRequest(file, 'done', '¿Autorizas cerrar la tarea?');
    expect(() => engine.transition(file, 'done')).toThrow('confirmation_required');
  });
  it('fails closed on missing/stale source files and reloads the live contract', () => {
    const { root, engine, file } = setup(); engine.phaseStart(file, 'user', 'Realiza fase 1');
    const path = phaseExecutionPolicy(binding).startup_paths[0]!;
    put(root, path, readFileSync(join(root, path), 'utf8') + '\nUpdated rule\n');
    expect(() => engine.phaseLaunch(file, 'sdd-init')).toThrow('not_authorized');
    engine.phaseStart(file, 'user', 'Reanuda fase 1 con las reglas actualizadas');
    expect(engine.phaseLaunch(file, 'sdd-init').sources[path]).toHaveLength(64);
    unlinkSync(join(root, path));
    expect(() => engine.phaseLaunch(file, 'sdd-init')).toThrow();
  });
  it('does not let interrupted work continue until resumed', () => {
    const { engine, file } = setup(); engine.phaseStart(file, 'user', 'Realiza fase 1');
    engine.outcome(file, 'blocked', 'Need clarification');
    expect(() => engine.phaseLaunch(file, 'sdd-init')).toThrow('interrupted');
    engine.outcome(file, 'resume'); expect(engine.phaseLaunch(file, 'sdd-init').lane_id).toBe('sdd-init');
  });
  it('validates frozen packet admission and rejects stale indexes, mismatched lanes and missing admission', () => {
    const { root, engine, file } = setup(); engine.phaseStart(file, 'user', 'Realiza fase 1');
    const packet = { schema: 'launch-packet/v1', routing: { lane_id: 'sdd-init' }, execution_context: engine.phaseLaunch(file, 'sdd-init') };
    expect(() => engine.phaseValidateLaunch(file, packet)).not.toThrow();
    put(root, 'launch-packet.json', JSON.stringify(packet));
    expect(run(['--root', root, 'phase', 'validate-launch', file, '--ref', 'launch-packet.json'])).toEqual({ ok: true });
    expect(() => engine.phaseValidateLaunch(file, { ...packet, routing: { lane_id: 'sdd-spec' } })).toThrow('invalid');
    expect(() => engine.phaseValidateLaunch(file, { schema: 'launch-packet/v1' })).toThrow('invalid');
    engine.checkpoint(file, 'Changed after packet freeze', 'Reload');
    expect(() => engine.phaseValidateLaunch(file, packet)).toThrow('stale_or_inconsistent');
  });
  it('migrates only explicit v15 indexes without importing execution permission', () => {
    const { root, engine, file } = setup(); engine.phaseStart(file, 'user', 'Realiza fase 1');
    at(root, file, 'fase_2_implementacion', 'p2_implementing', 'implementing');
    put(root, file, readFileSync(join(root, file), 'utf8').replace('binding_version: "16.0.0"', 'binding_version: "15.0.0"'));
    expect(() => engine.phaseStatus(file)).toThrow('binding identity');
    expect(() => engine.phaseMigrate(file, '', 'Migra')).toThrow('actor');
    engine.phaseMigrate(file, 'user', 'Autorizo migrar al contrato faseado');
    expect(engine.phaseStatus(file)).toMatchObject({ authorized: false, position: { phase: 'fase_2_implementacion', state: 'p2_implementing' } });
    expect(() => engine.phaseMigrate(file, 'user', 'Otra vez')).toThrow('requires_v15');
  });
  it('exposes CLI admission and preserves question state across a new engine', () => {
    const { root, engine, file } = prepareBranch();
    expect(run(['--root', root, 'phase', 'status', file])).toMatchObject({ schema: 'phase-status/v1' });
    run(['--root', root, 'phase', 'request', file, '--to', 'p2_planning', '--question', '¿Autorizas fase 2?']);
    new TaskEngine(root).phaseConfirm(file, 'user', 'Sí');
    expect(engine.transition(file, 'p2_planning').state).toBe('p2_planning');
  });
  it('rejects malformed policy and carries selected extension boundaries without fallback', () => {
    const broken = structuredClone(binding);
    delete (broken.phase_execution as Record<string, unknown>).lane_states;
    expect(() => phaseExecutionPolicy(broken)).toThrow('config_invalid');
    const composed = composeSelectedExtensions(binding, repo, { rdd_mode: 'receipt-driven' });
    expect(phaseExecutionPolicy(composed).stop_states.fase_5_rdd).toContain('p5_complete');
    expect(phaseExecutionPolicy(composed).lane_states['rdd-correct']).toEqual(['p5_correction_required']);
  });
  it('applies the same admission and confirmation contract to a selected extension through the CLI', () => {
    const { root, file } = setup();
    cpSync(join(repo, '.agents/skills/projectctl-rdd'), join(root, '.agents/skills/projectctl-rdd'), { recursive: true });
    at(root, file, 'fase_5_rdd', 'p5_reviewing', 'reviewing');
    put(root, file, readFileSync(join(root, file), 'utf8').replace(/^title:/m, 'rdd_mode: "receipt-driven"\ntitle:'));
    run(['--root', root, 'phase', 'start', file, '--actor', 'user', '--message', 'Realiza la fase RDD']);
    expect(run(['--root', root, 'phase', 'launch', file, '--lane', 'rdd-review-risk'])).toMatchObject({ position: { phase: 'fase_5_rdd' } });
    at(root, file, 'fase_5_rdd', 'p5_complete', 'reviewing');
    expect(() => run(['--root', root, 'transition', file, '--to', 'final_commit_pending'])).toThrow('confirmation_required');
  });
  it('injects full bootstrap, module, policy and binding into the actual startup prompt', () => {
    const config = JSON.parse(readFileSync(join(repo, '.opencode/opencode.json'), 'utf8'));
    const example = JSON.parse(readFileSync(join(repo, '.agents/skills/projectctl-sdd/assets/opencode-phase-execution.example.json'), 'utf8'));
    const prompt: string = config.agent['sdd-orchestrator'].prompt;
    expect(prompt).toBe(example.agent['sdd-orchestrator'].prompt);
    const expanded = prompt.replace(/\{file:([^}]+)\}/g, (_match, path) => readFileSync(resolve(repo, '.opencode', path), 'utf8'));
    expect(expanded).toContain('ask-then-confirm-every-transition');
    expect(expanded).toContain('Schedule **all** dependency-ready required work');
    expect(expanded).toContain('Mostrar esa pregunta al usuario y finalizar el turno');
    expect(expanded).toContain('SIEMPRE pregunta al usuario');
    expect(expanded).not.toContain('{file:../');
  });
});
