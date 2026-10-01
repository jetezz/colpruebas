import { afterEach, describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { TaskEngine } from '../project/task-engine.ts';
import { run } from '../project/tasks.ts';
import { criterionRevision } from '../../../projectctl-requirements/scripts/project/criterion-contract.ts';
import { parseCriteriaChange } from '../project/criteria-change.ts';

const source = resolve(import.meta.dir, '../../../../..');
const fixtures: string[] = [];
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'sdd-task-engine-'));
  fixtures.push(root);
  for (const file of ['.agents/sdd-workflow.json', '.agents/skills/projectctl-sdd/references/tasks/binding.md']) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), readFileSync(join(source, file)));
  }
  mkdirSync(join(root, 'docs/app-map'), { recursive: true });
  writeFileSync(join(root, 'docs/app-map/navigation.yaml'), 'root_id: app\nnavigation:\n  - id: app\n    title: App\n    kind: view\n    bundle: app\n    children: []\n');
  writeFileSync(join(root, 'docs/app-map/app.md'), '---\ncriteria:\n  - id: PCT-155\n    title: Stable acceptance\n    type: tooling\n---\n');
  const engine = new TaskEngine(root);
  const file = engine.init({ id: '20260929-abcd', slug: 'test-task', title: 'Test', problem: 'Solve a problem', appMap: 'docs/app-map/navigation.yaml' });
  return { root, engine, file };
}
function proposalText(_engine: TaskEngine) {
  const definition = { id: 'PCT-155', title: 'Stable acceptance', type: 'tooling' };
  return `Proposal v1\n\n\`\`\`criteria-change\n${JSON.stringify({ schema: 'criteria-change/v1', targets: ['app'], baseline: [{ id: definition.id, bundle: 'docs/app-map/app.md', revision: criterionRevision(definition), retired: false }], changes: [{ id: definition.id, bundle: 'docs/app-map/app.md', operation: 'maintain', before: definition, after: definition, reason: 'Preserve the observable contract' }] })}\n\`\`\`\n`;
}
function approveFixture(root: string, engine: TaskEngine, file: string) {
  engine.transition(file, 'p1_exploring'); engine.transition(file, 'p1_drafting'); engine.transition(file, 'p1_awaiting_acceptance');
  const raw = proposalText(engine);
  writeFileSync(join(root, file.replace(/\.md$/, '/proposal.md')), raw);
  engine.accept(file, 'proposal', 'user', 'Acepto', createHash('sha256').update(raw).digest('hex'), ['PCT-155']);
  const fence = (data: unknown) => `\`\`\`criteria-links\n${JSON.stringify(data)}\n\`\`\`\n`;
  writeFileSync(join(root, file.replace(/\.md$/, '/spec.md')), fence({ schema: 'criteria-links/v1', criteria: ['PCT-155'], scenarios: [{ id: 'S1', criterion_ids: ['PCT-155'] }] }));
  writeFileSync(join(root, file.replace(/\.md$/, '/tasks.md')), fence({ schema: 'criteria-links/v1', criteria: ['PCT-155'], units: [{ id: 'WU-A', criterion_ids: ['PCT-155'], scenario_ids: ['S1'] }] }));
}
function git(root: string, ...args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || String(result.error));
  return result.stdout.trim();
}
function operations(root: string, file: string) {
  return JSON.parse(readFileSync(join(root, file), 'utf8').match(/<!-- task-operations:start -->\s*```json\s*([\s\S]*?)\s*```/)![1]!);
}
function prepareBranch() {
  const fixture = setup();
  const { root, engine, file } = fixture;
  git(root, 'init', '-b', engine.binding.delivery.source_branch);
  approveFixture(root, engine, file);
  engine.artifact(file, 'proposal', file.replace(/\.md$/, '/proposal.md'), 'Reviewed');
  engine.evidence(file, 'phase_2_hold_released', file.replace(/\.md$/, '/proposal.md'));
  engine.transition(file, 'branch_creation_pending');
  return fixture;
}
afterEach(() => { for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('portable SDD task engine', () => {
  it('produces the branch evidence consumed by the delivery gate using real Git', () => {
    const { root, engine, file } = prepareBranch();
    const position = engine.inspect(file).position;
    const branch = engine.branch(file);
    expect(git(root, 'branch', '--show-current')).toBe(branch);
    expect(operations(root, file)).toMatchObject({
      delivery: { branch_verified: true, branch_name: branch },
      evidence: { branch_name: `git:${branch}`, canonical_branch_active: `git:${branch}`, branch_created_from_source_branch: `git:${branch}` },
    });
    expect(engine.inspect(file).position).toEqual(position);
    expect(engine.validate(file)).toEqual([]);
    expect(engine.inspect(file).transitions.find(t => t.to === 'p2_planning')!.missing).toEqual([]);
  });
  it('recovers late missing branch evidence via the CLI without claiming creation', () => {
    const { root, engine, file } = setup();
    const branch = engine.binding.delivery.branch_pattern.replace('<task_id>', '20260929-abcd').replace('<task_slug>', 'test-task');
    git(root, 'init', '-b', branch);
    const path = join(root, file);
    // Model a legacy advanced index; production writes must use transition.
    writeFileSync(path, readFileSync(path, 'utf8').replace('phase: "fase_1_propuesta"', 'phase: "fase_4_documentacion"')
      .replace('state: "p1_started"', 'state: "final_pr_pending"').replace('status: "planning"', 'status: "documenting"'));
    const position = engine.inspect(file).position;
    expect(engine.inspect(file).transitions.find(t => t.to === 'done')!.missing).toContain('pr_url_recorded: branch_name');
    expect(run(['--root', root, 'branch', 'verify', file])).toEqual({ branch });
    expect(engine.inspect(file).transitions.find(t => t.to === 'done')!.missing).not.toContain('pr_url_recorded: branch_name');
    expect(operations(root, file).evidence.branch_created_from_source_branch).toBeUndefined();
    expect(operations(root, file).delivery).toMatchObject({ branch_verified: true, branch_name: branch });
    expect(engine.inspect(file).position).toEqual(position);
    expect(engine.validate(file)).toEqual([]);
    expect(() => engine.branch(file)).toThrow('branch_creation_pending');
  });
  it('refreshes branch evidence idempotently and preserves verified delivery fields', () => {
    const { root, engine, file } = prepareBranch();
    const branch = engine.branch(file);
    const record = operations(root, file);
    record.delivery.audit_note = 'preserve';
    delete record.evidence.branch_name;
    const path = join(root, file);
    writeFileSync(path, readFileSync(path, 'utf8').replace(/(<!-- task-operations:start -->\s*```json\s*)[\s\S]*?(\s*```\s*<!-- task-operations:end -->)/, `$1${JSON.stringify(record)}$2`));
    engine.branchVerify(file);
    engine.branchVerify(file);
    expect(operations(root, file)).toMatchObject({ delivery: { audit_note: 'preserve' }, evidence: { branch_name: `git:${branch}`, branch_created_from_source_branch: `git:${branch}` } });
  });
  it('rejects wrong or detached branches and Git failures without writing the index', () => {
    const { root, engine, file } = setup();
    const path = join(root, file);
    const before = readFileSync(path, 'utf8');
    expect(() => engine.branchVerify(file)).toThrow('failed');
    expect(readFileSync(path, 'utf8')).toBe(before);
    git(root, 'init', '-b', 'other');
    expect(() => engine.branchVerify(file)).toThrow('canonical branch is not active');
    expect(readFileSync(path, 'utf8')).toBe(before);
    // A real detached HEAD pointing at an empty tree commit in this fixture only.
    const tree = git(root, 'mktree');
    const commit = git(root, '-c', 'user.name=SDD fixture', '-c', 'user.email=sdd@example.invalid', 'commit-tree', tree, '-m', 'Fixture');
    git(root, 'checkout', '--detach', commit);
    expect(() => engine.branchVerify(file)).toThrow('canonical branch is not active');
    expect(readFileSync(path, 'utf8')).toBe(before);
    expect(operations(root, file).evidence.branch_name).toBeUndefined();
  });
  it('keeps branch evidence owned by Git commands', () => {
    const { engine, file } = setup();
    expect(() => engine.evidence(file, 'branch_name', file)).toThrow('owning approval/Git command');
  });
  it('initializes a valid canonical index and rejects undeclared jumps', () => {
    const { engine, file } = setup();
    expect(run(['--root', engine.root, 'validate', file])).toEqual({ ok: true, issues: [] });
    expect(engine.validate(file)).toEqual([]);
    expect(engine.inspect(file).position).toEqual({ phase: 'fase_1_propuesta', state: 'p1_started', status: 'planning' });
    expect(() => engine.transition(file, 'p2_planning')).toThrow('not declared');
    expect(engine.transition(file, 'p1_exploring').state).toBe('p1_exploring');
    expect(engine.validate(file)).toEqual([]);
  });
  it('uses the current sdd-orchestrator binding for an existing task index', () => {
    const { root, engine, file } = setup();
    const raw = readFileSync(join(root, file), 'utf8');
    expect(raw).toContain('binding_version: "15.0.0"');
    expect(engine.validate(file)).toEqual([]);
    expect(engine.inspect(file).transitions[0]?.to).toBe('p1_exploring');
  });
  it('requires approval at the exact proposal revision and records both views', () => {
    const { root, engine, file } = setup();
    engine.transition(file, 'p1_exploring'); engine.transition(file, 'p1_drafting'); engine.transition(file, 'p1_awaiting_acceptance');
    expect(() => engine.transition(file, 'p1_accepted')).toThrow('guards unsatisfied');
    const proposal = join(root, file.replace(/\.md$/, ''), 'proposal.md');
    const raw = proposalText(engine);
    writeFileSync(proposal, raw);
    expect(() => engine.accept(file, 'proposal', 'user', 'Acepto', 'stale', ['PCT-155'])).toThrow('revision');
    const revision = createHash('sha256').update(raw).digest('hex');
    engine.accept(file, 'proposal', 'user', 'Acepto', revision, ['PCT-155']);
    expect(engine.inspect(file).position.state).toBe('p1_accepted');
    expect(engine.inspect(file).transitions[0]?.missing).toContain('AC-010.passed: phase_2_hold_released');
    expect(() => engine.evidence(file, 'approved_revision', file.replace(/\.md$/, '/proposal.md'))).toThrow('owning approval');
    expect(engine.validate(file)).toEqual([]);
  });
  it('preserves the interrupted position, rejects traversal and rejects stale writes', () => {
    const { root, engine, file } = setup();
    engine.checkpoint(file, 'Init done', 'Draft proposal');
    expect(readFileSync(join(root, file), 'utf8')).toContain('- **Siguiente paso**: Draft proposal');
    engine.outcome(file, 'blocked', 'waiting');
    expect(readFileSync(join(root, file), 'utf8')).toContain('- **Bloqueo activo**: waiting');
    expect(engine.inspect(file).position).toEqual({ phase: 'fase_1_propuesta', state: 'p1_started', status: 'blocked' });
    expect(() => engine.transition(file, 'p1_exploring')).toThrow('resume');
    engine.outcome(file, 'resume');
    expect(readFileSync(join(root, file), 'utf8')).not.toContain('- **Bloqueo activo**: waiting');
    expect(() => engine.validate('../elsewhere.md')).toThrow('outside project');
    const existing = join(root, file);
    const raw = readFileSync(existing, 'utf8');
    writeFileSync(existing, raw.replace('state: "p1_started"', 'state: "done"'));
    expect(engine.validate(file)).toContain('invalid phase/state/status tuple');
  });
  it('updates coordinated tables without replacing the rest of the index', () => {
    const { root, engine, file } = setup();
    const artifact = file.replace(/\.md$/, '/proposal.md');
    approveFixture(root, engine, file);
    engine.artifact(file, 'proposal', artifact, 'Proposal ready');
    engine.criterion(file, 'PCT-155', 'passed', 'Manual', artifact);
    const apply = file.replace(/\.md$/, '/apply-WU-A.md');
    writeFileSync(join(root, apply), 'verified work unit evidence');
    engine.workUnit(file, 'WU-A', 'sdd-apply-code-low', 'code-low', 'done', apply);
    engine.verification(file, 'sdd-verify-code', 'passed', artifact);
    const raw = readFileSync(join(root, file), 'utf8');
    expect(raw).toContain('| proposal | `done` | Proposal ready |');
    expect(raw).toContain('| `PCT-155` | `passed` | `Manual` |');
    expect(raw).toContain('| WU-A | sdd-apply-code-low | code-low | `done` |');
    expect(engine.validate(file)).toEqual([]);
    expect(() => engine.workUnit(file, 'WU-A', 'sdd-apply-code-low', 'code-medium', 'done', artifact)).toThrow('lane mismatch');
  });
  it('updates translated phase and existing work-unit/criterion rows without duplicating them', () => {
    const { root, engine, file } = setup();
    approveFixture(root, engine, file);
    const path = join(root, file);
    const artifact = file.replace(/\.md$/, '/proposal.md');
    const unitRef = file.replace(/\.md$/, '/apply-WU-A.md');
    writeFileSync(join(root, unitRef), 'implementation');
    const raw = readFileSync(path, 'utf8');
    writeFileSync(path, raw.replace('| Fase | Estado | Resumen | Artefacto |',
      `| Fase | Estado | Resumen | Artefacto |\n| Propuesta | \`pending\` | | \`${artifact}\` |`)
      .replace('| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |',
        '| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |\n| `WU-A` | `TBD` | `TBD` | `pending` | `TBD` |')
      .replace('| AC-ID | Veredicto | Método |',
         '| AC-ID | Veredicto | Método |\n| PCT-155 | `pending` | `Manual` |'));
    engine.artifact(file, 'proposal', artifact, 'Ready');
    engine.workUnit(file, 'WU-A', 'sdd-apply-code-low', 'code-low', 'done', unitRef);
    engine.criterion(file, 'PCT-155', 'passed', 'Manual', artifact);
    const updated = readFileSync(path, 'utf8');
    expect(updated.match(/\| proposal \|/g)?.length).toBe(1);
    expect(updated).not.toContain('| Propuesta |');
    expect(updated.match(/\| WU-A \|/g)?.length).toBe(1);
    expect(updated).not.toContain('| `WU-A` |');
    expect(updated.match(/\| `PCT-155` \|/g)?.length).toBe(1);
    expect(updated).not.toContain('| PCT-155 |');
    expect(engine.validate(file)).toEqual([]);
  });
  it('fails closed for missing evidence and unverified browser credentials', () => {
    const { engine, file } = setup();
    expect(() => engine.evidence(file, 'unknown', 'no.md')).toThrow('unknown evidence');
    expect(() => engine.browser(file, { environment: 'dev', baseUrl: 'https://example.org', runtimeKind: 'managed-project', credentialsRef: '.env.missing' })).toThrow('reference missing');
    expect(engine.inspect(file).position.state).toBe('p1_started');
  });
  it('preserves a delivery control when interrupted and resumes its declared tuple', () => {
    const { root, engine, file } = setup();
    const ref = file.replace(/\.md$/, '/proposal.md');
    approveFixture(root, engine, file);
    engine.artifact(file, 'proposal', ref, 'Reviewed');
    engine.evidence(file, 'phase_2_hold_released', ref);
    engine.transition(file, 'branch_creation_pending');
    engine.outcome(file, 'blocked', 'cannot create branch');
    expect(engine.validate(file)).toEqual([]);
    expect(engine.inspect(file).position).toEqual({ phase: 'fase_1_propuesta', state: 'branch_creation_pending', status: 'blocked' });
    engine.outcome(file, 'resume');
    expect(engine.inspect(file).position.status).toBe('planning');
  });
  it('rejects task-local IDs and stale approval without changing the active position', () => {
    const { root, engine, file } = setup();
    engine.transition(file, 'p1_exploring'); engine.transition(file, 'p1_drafting'); engine.transition(file, 'p1_awaiting_acceptance');
    const raw = proposalText(engine), ref = file.replace(/\.md$/, '/proposal.md');
    writeFileSync(join(root, ref), raw);
    const revision = createHash('sha256').update(raw).digest('hex');
    expect(() => engine.accept(file, 'proposal', 'user', 'Acepto', revision, ['AC-001'])).toThrow('canonical');
    expect(engine.inspect(file).position.state).toBe('p1_awaiting_acceptance');
    engine.accept(file, 'proposal', 'user', 'Acepto', revision, ['PCT-155']);
    engine.evidence(file, 'phase_2_hold_released', ref);
    writeFileSync(join(root, ref), raw + '\nUnapproved edit');
    expect(engine.inspect(file).transitions[0]!.missing).toContain('AC-010.passed: canonical_criteria_approval_current');
    expect(() => engine.transition(file, 'branch_creation_pending')).toThrow('unsatisfied');
  });
  it('computes canonical gates and returns a complete decision summary', () => {
    const { root, engine, file } = setup(); approveFixture(root, engine, file);
    const ref = file.replace(/\.md$/, '/proposal.md');
    expect(() => engine.evidence(file, 'canonical_criteria_links_current', ref)).toThrow('computed');
    expect(() => engine.evidence(file, 'canonical_criteria_delta_materialized', ref)).toThrow('computed');
    expect(engine.proposalCheck(file)).toMatchObject({ added: [], modified: [], removed: [], maintained: [{ id: 'PCT-155', reason: 'Preserve the observable contract' }] });
    expect(run(['--root', root, 'proposal', 'check', file, '--stage', 'applied'])).toMatchObject({ ok: true });
    expect(() => engine.criterion(file, 'AC-001', 'pending', 'Manual')).toThrow('not approved');
  });
  it('rejects renumbered or unknown spec/tasks links before scheduling work', () => {
    const { root, engine, file } = setup(); approveFixture(root, engine, file);
    const ref = file.replace(/\.md$/, '/spec.md');
    writeFileSync(join(root, ref), '```criteria-links\n{"schema":"criteria-links/v1","criteria":["AC-001"],"scenarios":[]}\n```\n');
    expect(() => engine.artifact(file, 'spec', ref, 'Renumbered')).toThrow('canonical IDs');
    expect(() => engine.workUnit(file, 'WU-A', 'sdd-apply-code-low', 'code-low', 'in_progress', '')).toThrow('canonical IDs');
  });
  it('preserves an old binding index as invalid instead of silently migrating its approvals', () => {
    const { root, engine, file } = setup();
    const path = join(root, file);
    writeFileSync(path, readFileSync(path, 'utf8').replace('binding_version: "15.0.0"', 'binding_version: "13.0.0"'));
    expect(engine.validate(file)).toContain('binding identity mismatch');
    expect(() => engine.transition(file, 'p1_exploring')).toThrow('binding identity');
    expect(readFileSync(path, 'utf8')).toContain('binding_version: "13.0.0"');
  });
  it('requires both the owner tombstone and cleanup of operative test/code references on retirement', () => {
    const { root, engine, file } = setup();
    const delta = parseCriteriaChange(proposalText(engine));
    delta.changes[0]!.operation = 'remove'; delta.changes[0]!.after = null;
    const raw = `\`\`\`criteria-change\n${JSON.stringify(delta)}\n\`\`\`\n`;
    engine.transition(file, 'p1_exploring'); engine.transition(file, 'p1_drafting'); engine.transition(file, 'p1_awaiting_acceptance');
    writeFileSync(join(root, file.replace(/\.md$/, '/proposal.md')), raw);
    engine.accept(file, 'proposal', 'user', 'Retirar el criterio', createHash('sha256').update(raw).digest('hex'), ['PCT-155']);
    writeFileSync(join(root, 'docs/app-map/app.md'), '---\ncriteria:\n  - id: PCT-155\n    title: Stable acceptance\n    type: tooling\n    functional: not-applicable\n    exception_reason: criterion_retired\n    coverage: {Unit: not-applicable, PW-CLI: not-applicable, PW-AUTO: not-applicable, Manual: not-applicable}\n---\n');
    mkdirSync(join(root, 'tests/unit/app'), { recursive: true });
    writeFileSync(join(root, 'tests/unit/app/old.test.ts'), '// @ac PCT-155\nexport const obsolete = true;');
    expect(() => engine.proposalCheck(file, 'applied')).toThrow('operative references');
    writeFileSync(join(root, 'tests/unit/app/old.test.ts'), '// No operative criterion reference\nexport const archived = true;');
    expect(engine.proposalCheck(file, 'applied').ok).toBe(true);
  });
});
