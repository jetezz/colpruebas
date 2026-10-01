import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseBindingFile, resolveLaneSkillContext } from '../skill/task-flow-normalizer.ts';
import { composeSelectedExtensions } from '../skill/task-flow-extension.ts';
import { TaskEngine } from '../project/task-engine.ts';
import { authorizeMachinePreparation, authorizeRequirements, buildRequirementsLaunch, evaluateRequirements, fileDigest, requirementsContract, requirementsSnapshot, validateMachinePreparationChanges, validateRequirementsLaunch, type RequirementsReceipt } from '../project/requirements-evidence.ts';

const repo = resolve(import.meta.dir, '../../../../..');
const binding = parseBindingFile(repo).binding;
const contract = requirementsContract(binding);
const roots: string[] = [];
const put = (root: string, path: string, text: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text); };
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'sdd-requirements-')); roots.push(root);
  for (const file of ['.agents/sdd-workflow.json', '.agents/skills/projectctl-sdd/references/tasks/binding.md']) put(root, file, readFileSync(join(repo, file), 'utf8'));
  put(root, 'docs/app-map/navigation.yaml', 'root_id: app\nnavigation:\n  - id: app\n    title: App\n    kind: view\n    bundle: views/app\n    children:\n      - id: feature\n        title: Feature\n        kind: feature\n        bundle: views/feature\n        children: []\n');
  for (const [name, id] of [['app', 'AC-001'], ['feature', 'AC-002']]) {
    put(root, `docs/app-map/views/${name}.md`, `---\nid: ${name}\nkind: ${name === 'app' ? 'view' : 'feature'}\ntitle: Example\ncriteria:\n  - id: ${id}\n    title: Example\n    type: functionality\n    functional: implemented\n    coverage: {Unit: covered, PW-CLI: missing, PW-AUTO: covered, Manual: missing}\n    evidence_paths: [frontend/src/${name}.ts]\n---\n# Editorial\n`);
    put(root, `docs/app-map/views/${name}.mmd`, 'flowchart TD\nA --> B\n');
    put(root, `frontend/src/${name}.ts`, `// @criterion ${id}\n// @trace ac=${id} req=REQ-APP-001\nexport const result = 1;\n`);
    put(root, `tests/unit/app/${name}.test.ts`, `// @ac ${id}\nexport const unit = true;\n`);
    put(root, `tests/e2e/app/${name}.spec.ts`, `// @ac ${id}\n// @app\n// Persistent scenario: ${id}\nexport const scenario = true;\n`);
  }
  put(root, 'playwright/TEST_PLAN.md', 'Persistent plan: tests/e2e/app/app.spec.ts; tests/e2e/app/feature.spec.ts');
  put(root, 'package.json', '{"scripts":{"test:unit":"bun test"}}');
  const engine = new TaskEngine(root);
  const file = engine.init({ id: '20260930-abcd', slug: 'scope', title: 'Scope', problem: 'Verify', appMap: 'app:feature' });
  engine.requirementsTargets(file, ['app:feature']);
  return { root, engine, file };
}
afterEach(() => { roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function at(root: string, file: string, phase: string, state: string, status: string) {
  const raw = readFileSync(join(root, file), 'utf8');
  writeFileSync(join(root, file), raw.replace(/^phase:.*$/m, `phase: "${phase}"`).replace(/^state:.*$/m, `state: "${state}"`).replace(/^status:.*$/m, `status: "${status}"`));
}
function receipt(root: string, profile: 'technical' | 'documentary' = 'technical'): RequirementsReceipt {
  const snapshot = requirementsSnapshot(root, binding, 'app:feature');
  return { schema: 'requirements-evidence/v1', profile, target: 'app:feature', checks: contract.profiles[profile].doctors.map(doctor => {
    const ref = `reports/${doctor}.json`;
    const fields = contract.required_report_checks[doctor].map(id => ({ id, code: id, status: 'pass', path: 'global' }));
    const output = doctor === 'docs'
      ? { schemaVersion: 1, root, scope: { target: 'app:feature' }, state: 'unverified', findings: [], policyFindings: [] }
      : { schemaVersion: doctor === 'test' ? 'projectctl.test-doctor.v1' : 'projectctl.structure-chain-doctor.v1', root, scope: { target: 'app:feature' }, readOnly: true, [doctor === 'test' ? 'checks' : 'findings']: fields };
    put(root, ref, JSON.stringify(output));
    const inputs = snapshot.doctors[doctor];
    const supplements = profile === 'technical' ? contract.runtime_checks[doctor].filter(id => !contract.documentary_checks[doctor]?.includes(id)).map(check => {
      const scope = contract.target_checks[doctor].includes(check) ? 'target' as const : 'global' as const;
      const bound = scope === 'target' ? inputs.scope : inputs.global;
      const proof = `reports/${doctor}-${check}.json`;
      const source = check === 'OPERATOR_CHECK' ? 'projectctl' : 'runtime';
      const command = check === 'OPERATOR_CHECK' ? 'projectctl structure check --json' : 'verified fixture observation';
      const evidence = check === 'OPERATOR_CHECK'
        ? { schemaVersion: 'projectctl.structure-check.v1', remoteState: 'evaluated', exitCode: 0, findings: [] }
        : { schema: 'requirements-runtime-evidence/v1', verified_by: 'sdd-orchestrator', check, path: 'global', scope, inputs: bound, source, command, verdict: 'pass', target: 'app:feature', observations: ['Independently reconciled fixture effect'] };
      put(root, proof, JSON.stringify(evidence));
      return { check, path: 'global', scope, inputs: bound, source, command, verdict: 'pass' as const, ref: proof, sha256: fileDigest(root, proof) };
    }) : [];
    return { doctor, inputs, report: { ref, sha256: fileDigest(root, ref) }, supplements };
  }) };
}
function artifact(root: string, file: string, r: RequirementsReceipt) {
  const ref = file.replace(/\.md$/, `/${contract.profiles[r.profile].artifact}.md`);
  put(root, ref, `# Evidence\n\n\`\`\`requirements-evidence\n${JSON.stringify(r)}\n\`\`\`\n`);
  return ref;
}

describe('scoped requirements routing and freshness', () => {
  it('resolves the new lane with mandatory core policy and composes pinned satellites', () => {
    const result = resolveLaneSkillContext(repo, binding, contract.lane);
    expect(result.lane_skill_path).toEndWith('/sdd-verify-requirements/module.md');
    expect(result.surface_skill_paths).toEqual(contract.surface_skill_paths);
    expect(composeSelectedExtensions(binding, repo, { rdd_mode: 'receipt-driven' }).binding_version).toBe(binding.binding_version);
    expect(composeSelectedExtensions(binding, repo, { review_mode: 'judgment-day' }).binding_version).toBe(binding.binding_version);
  });
  it('authorizes exact profiles/states and bounded pre-P3 preparation', () => {
    expect(authorizeRequirements(binding, 'fase_3_verificacion', 'p3_test_running', 'technical').doctors).toEqual(['test', 'structure']);
    expect(() => authorizeRequirements(binding, 'fase_4_documentacion', 'p4_documenting', 'documentary')).toThrow('not authorized');
    expect(() => authorizeRequirements(binding, 'fase_4_documentacion', 'p4_reviewing', 'technical')).toThrow('not authorized');
    expect(() => authorizeMachinePreparation(binding, 'fase_2_implementacion', 'p2_implementing', 'machine-preparation', ['docs/app-map/navigation.yaml'])).not.toThrow();
    expect(() => authorizeMachinePreparation(binding, 'fase_2_implementacion', 'p2_implementing', 'machine-preparation', ['tests/unit/app/foo.test.ts'])).toThrow();
    expect(() => authorizeMachinePreparation(binding, 'fase_1_propuesta', 'p1_drafting', 'machine-preparation', ['docs/app-map/navigation.yaml'])).toThrow();
  });
  it('freezes exact local commands and rejects drift/managed injection before launch', () => {
    const { root } = setup();
    const packet = buildRequirementsLaunch(root, binding, 'fase_3_verificacion', 'p3_test_running', 'technical', 'app:feature');
    expect(() => validateRequirementsLaunch(root, binding, packet.phase, packet.state, packet)).not.toThrow();
    const managed = structuredClone(packet); managed.commands[0].push('--managed');
    expect(() => validateRequirementsLaunch(root, binding, packet.phase, packet.state, managed)).toThrow('launch_packet_invalid');
    put(root, 'tests/unit/app/feature.test.ts', '// @ac AC-002\nexport const unit = false;');
    expect(() => validateRequirementsLaunch(root, binding, packet.phase, packet.state, packet)).toThrow('launch_packet_invalid');
    expect(() => buildRequirementsLaunch(root, binding, packet.phase, packet.state, 'technical', 'unknown')).toThrow('Unknown view');
  });
  it('validates pre-P3 doc deltas and fails closed on partial fingerprint contracts', () => {
    const { root } = setup();
    const before = readFileSync(join(root, 'docs/app-map/views/feature.md'), 'utf8');
    const check = (after: string) => validateMachinePreparationChanges(binding, 'fase_2_implementacion', 'p2_implementing', 'machine-preparation', [{ file: 'docs/app-map/views/feature.md', before, after }]);
    expect(() => check(before.replace('functional: implemented', 'functional: partial'))).not.toThrow();
    expect(() => check(before.replace('# Editorial', '# More content'))).toThrow('editorial body');
    expect(() => check(before.replace('title: Example', 'title: Rewritten'))).toThrow('unowned frontmatter');
    expect(() => check(before.replace('    title: Example', '    title: Approved acceptance text'))).not.toThrow();
    const partial = structuredClone(binding);
    (partial.requirements_verification as typeof contract).fingerprints.criterion_fields = ['id'];
    expect(() => requirementsContract(partial)).toThrow('technical field omitted');
  });
  it('canonicalizes YAML fields and preserves technique across editorial writes', () => {
    const { root } = setup();
    const before = requirementsSnapshot(root, binding, 'app:feature');
    const path = 'docs/app-map/views/feature.md';
    put(root, path, readFileSync(join(root, path), 'utf8').replace('title: Example', 'title: Edited').replace('# Editorial', '# New prose')
      .replace('coverage: {Unit: covered, PW-CLI: missing, PW-AUTO: covered, Manual: missing}', 'coverage: {Manual: missing, PW-AUTO: covered, Unit: covered, PW-CLI: missing}'));
    put(root, 'docs/app-map/views/feature.mmd', 'flowchart TD\nB --> C\n');
    const after = requirementsSnapshot(root, binding, 'app:feature');
    expect(after.doctors.test).toEqual(before.doctors.test);
    expect(after.doctors.structure).toEqual(before.doctors.structure);
    expect(after.doctors.docs).not.toEqual(before.doctors.docs);
    put(root, path, readFileSync(join(root, path), 'utf8').replace('    title: Example', '    title: Changed acceptance'));
    expect(requirementsSnapshot(root, binding, 'app:feature').doctors.test.scope).not.toBe(before.doctors.test.scope);
    put(root, path, readFileSync(join(root, path), 'utf8').replace('functional: implemented', 'functional: partial'));
    expect(requirementsSnapshot(root, binding, 'app:feature').doctors.test.scope).not.toBe(before.doctors.test.scope);
  });
  it('isolates unrelated scope and tracks technical code, test and common inputs', () => {
    const { root } = setup();
    const a = requirementsSnapshot(root, binding, 'app:feature');
    put(root, 'frontend/src/app.ts', '// @criterion AC-001\nexport const result = 2;');
    expect(requirementsSnapshot(root, binding, 'app:feature').doctors.test).toEqual(a.doctors.test);
    put(root, 'frontend/src/feature.ts', '// @criterion AC-002\nexport const result = 2;');
    const b = requirementsSnapshot(root, binding, 'app:feature');
    expect(b.doctors.test.scope).not.toBe(a.doctors.test.scope);
    expect(b.doctors.structure.scope).not.toBe(a.doctors.structure.scope);
    expect(b.doctors.test.global).toBe(a.doctors.test.global);
    put(root, 'package.json', '{"scripts":{"test:unit":"bun test --bail"}}');
    expect(requirementsSnapshot(root, binding, 'app:feature').doctors.test.global).not.toBe(a.doctors.test.global);
  });
  it('refuses incomplete machine inputs, missing plan and symlink inputs', () => {
    const { root } = setup();
    rmSync(join(root, 'playwright/TEST_PLAN.md'));
    expect(requirementsSnapshot(root, binding, 'app:feature').ready).toBe(false);
    expect(() => buildRequirementsLaunch(root, binding, 'fase_3_verificacion', 'p3_test_running', 'technical', 'app:feature')).toThrow('not ready');
    symlinkSync('/tmp', join(root, 'scripts'));
    expect(() => requirementsSnapshot(root, binding, 'app:feature')).toThrow('symlink');
  });
  it('invalidates a mapping change only for its structure consumer', () => {
    const { root } = setup();
    const before = requirementsSnapshot(root, binding, 'app:feature');
    put(root, '.agents/skills/projectctl-requirements/references/estructura/reglas.md', 'Changed mapping');
    const after = requirementsSnapshot(root, binding, 'app:feature');
    expect(after.doctors.test).toEqual(before.doctors.test);
    expect(after.doctors.structure.global).not.toBe(before.doctors.structure.global);
    expect(after.doctors.docs).toEqual(before.doctors.docs);
  });
  it('requires covered test metadata and persistent-plan mapping before technical launch', () => {
    const { root } = setup();
    put(root, 'tests/unit/app/feature.test.ts', '// Missing @ac metadata\nexport const unit = true;');
    expect(requirementsSnapshot(root, binding, 'app:feature').ready).toBe(false);
    put(root, 'tests/unit/app/feature.test.ts', '// @ac AC-002\nexport const unit = true;');
    put(root, 'playwright/TEST_PLAN.md', 'Unmapped plan');
    expect(requirementsSnapshot(root, binding, 'app:feature').ready).toBe(false);
  });
  it('blocks empty reports, fails and unresolved checks independently of exit status', () => {
    const { root } = setup(); const r = receipt(root);
    expect(evaluateRequirements(root, binding, r)).toEqual([]);
    const test = r.checks[0];
    const report = JSON.parse(readFileSync(join(root, test.report.ref), 'utf8'));
    report.checks[0].status = 'unverified'; put(root, test.report.ref, JSON.stringify(report)); test.report.sha256 = fileDigest(root, test.report.ref);
    expect(evaluateRequirements(root, binding, r).join()).toContain('unverified');
    report.checks[0].status = 'fail'; put(root, test.report.ref, JSON.stringify(report)); test.report.sha256 = fileDigest(root, test.report.ref);
    expect(evaluateRequirements(root, binding, r).join()).toContain('failed');
    report.checks = []; put(root, test.report.ref, JSON.stringify(report)); test.report.sha256 = fileDigest(root, test.report.ref);
    expect(evaluateRequirements(root, binding, r).join()).toContain('report invalid');
    expect(evaluateRequirements(root, binding, { ...r, checks: [] }).join()).toContain('incomplete');
  });
  it('defers only documentary structure checks and requires strict reader in P4', () => {
    const { root } = setup(); const technical = receipt(root);
    const structure = technical.checks[1];
    const report = JSON.parse(readFileSync(join(root, structure.report.ref), 'utf8'));
    report.findings.find((f: { code: string }) => f.code === 'STRICT_READER').status = 'unverified';
    put(root, structure.report.ref, JSON.stringify(report)); structure.report.sha256 = fileDigest(root, structure.report.ref);
    expect(evaluateRequirements(root, binding, technical)).toEqual([]);
    const docs = receipt(root, 'documentary');
    expect(evaluateRequirements(root, binding, docs).join()).toContain('STRICT_READER: unverified (global)');
    put(root, 'reports/reader.json', '{"state":"valid","errors":[],"checkedMarkdown":2}');
    const d = docs.checks[0];
    d.supplements.push({ check: 'STRICT_READER', scope: 'global', inputs: d.inputs.global, source: 'projectctl', command: 'projectctl docs lint --json', verdict: 'pass', ref: 'reports/reader.json', sha256: fileDigest(root, 'reports/reader.json') });
    expect(evaluateRequirements(root, binding, docs)).toEqual([]);
    d.supplements[0].inputs = 'stale'; expect(evaluateRequirements(root, binding, docs).join()).toContain('unverified');
  });
  it('rejects warning-only managed evidence despite exit zero and binds target runtime observations', () => {
    const { root } = setup(); const r = receipt(root); const s = r.checks[1];
    s.supplements = s.supplements.filter(s => s.check !== 'OPERATOR_CHECK');
    const report = JSON.parse(readFileSync(join(root, s.report.ref), 'utf8'));
    report.findings.find((f: { code: string }) => f.code === 'OPERATOR_CHECK').status = 'unverified';
    put(root, s.report.ref, JSON.stringify(report)); s.report.sha256 = fileDigest(root, s.report.ref);
    const ref = 'reports/managed.json';
    put(root, ref, '{"schemaVersion":"projectctl.structure-check.v1","remoteState":"evaluated","exitCode":0,"findings":[{"code":"PATH_REQUIRED"}]}');
    s.supplements.push({ check: 'OPERATOR_CHECK', path: 'global', scope: 'global', inputs: s.inputs.global, source: 'projectctl', command: 'projectctl structure check --json', verdict: 'pass', ref, sha256: fileDigest(root, ref) });
    expect(evaluateRequirements(root, binding, r).join()).toContain('OPERATOR_CHECK: unverified');
    put(root, ref, '{"schemaVersion":"projectctl.structure-check.v1","remoteState":"evaluated","exitCode":0,"findings":[]}');
    s.supplements.find(s => s.check === 'OPERATOR_CHECK')!.sha256 = fileDigest(root, ref);
    expect(evaluateRequirements(root, binding, r)).toEqual([]);
    const test = r.checks[0]; const testReport = JSON.parse(readFileSync(join(root, test.report.ref), 'utf8'));
    test.supplements = test.supplements.filter(s => s.check !== 'TST-04-WRITEBACK');
    testReport.checks.find((f: { id: string }) => f.id === 'TST-04-WRITEBACK').status = 'unverified';
    put(root, test.report.ref, JSON.stringify(testReport)); test.report.sha256 = fileDigest(root, test.report.ref);
    const runtimeRef = 'reports/runtime.json';
    const runtime = { schema: 'requirements-runtime-evidence/v1', verified_by: 'sdd-orchestrator', check: 'TST-04-WRITEBACK', path: 'global', scope: 'target', inputs: test.inputs.scope, source: 'runtime', command: 'projectctl test run --method=unit --target=app:feature', verdict: 'pass', target: 'app:feature', observations: ['testsExecuted=2; coverageAccepted=true; writeback checked'] };
    put(root, runtimeRef, JSON.stringify(runtime));
    test.supplements.push({ check: runtime.check, path: runtime.path, scope: 'target', inputs: test.inputs.scope, source: runtime.source, command: runtime.command, verdict: 'pass', ref: runtimeRef, sha256: fileDigest(root, runtimeRef) });
    expect(evaluateRequirements(root, binding, r)).toEqual([]);
    put(root, runtimeRef, JSON.stringify({ ...runtime, target: 'app' })); test.supplements.find(s => s.check === 'TST-04-WRITEBACK')!.sha256 = fileDigest(root, runtimeRef);
    expect(evaluateRequirements(root, binding, r).join()).toContain('unverified (target)');
  });
  it('never promotes permanent runtime checks from a local green status', () => {
    const { root } = setup(); const r = receipt(root);
    r.checks.forEach(check => { check.supplements = []; });
    const failures = evaluateRequirements(root, binding, r).join();
    expect(failures).toContain('TST-04-WRITEBACK: unverified (target)');
    expect(failures).toContain('OPERATOR_CHECK: unverified (global)');
  });
  it('recomputes gates from stored receipts and returns P3 only after technical invalidation', () => {
    const { root, engine, file } = setup();
    at(root, file, 'fase_3_verificacion', 'p3_test_running', 'testing');
    const r = receipt(root); const ref = artifact(root, file, r);
    engine.requirementsRecord(file, 'technical', 'app:feature', ref);
    engine.requirementsTargets(file, ['app:feature']);
    expect(engine.requirementsStatus(file).technical).toEqual([]);
    expect(() => engine.evidence(file, contract.gate_evidence.technical, ref)).toThrow('computed');
    expect(() => engine.verification(file, contract.lane, 'passed', ref)).toThrow('explicit profile');
    at(root, file, 'fase_4_documentacion', 'p4_reviewing', 'documenting');
    expect(engine.inspect(file).transitions.find(t => t.guard === 'documentation_changed_requires_reverification')?.missing.length).toBeGreaterThan(0);
    put(root, 'docs/app-map/views/feature.mmd', 'flowchart TD\nC --> D\n');
    expect(engine.requirementsStatus(file).technical).toEqual([]);
    expect(() => engine.transition(file, 'p3_test_preparing')).toThrow('guards unsatisfied');
    put(root, 'frontend/src/feature.ts', '// @criterion AC-002\nexport const result = 3;');
    expect(engine.requirementsStatus(file).technical.join()).toContain('inputs stale');
    expect(engine.transition(file, 'p3_test_preparing').state).toBe('p3_test_preparing');
    expect(() => engine.requirementsRecord(file, 'technical', 'app:feature', ref)).toThrow('not authorized');
  });
  it('keeps environmental candidates on their mandatory return even after methods complete', () => {
    const { root, engine, file } = setup();
    at(root, file, 'fase_3_verificacion', 'p3_coverage_pending', 'testing');
    engine.environmentDefer(file, 'operator', 'runtime unavailable', 'rev-1');
    const gate = (binding.gates as Record<string, { required_evidence: string[] }>).environment_verification_deferred;
    for (const id of gate.required_evidence) engine.evidence(file, id, file);
    engine.transition(file, 'p4_started');
    engine.transition(file, 'p4_documenting');
    for (const method of ['Go', 'Docker', 'PW', 'Git-real']) engine.environmentComplete(file, method, 'rev-1', file);
    engine.evidence(file, 'sdd_apply_doc_evidence_recorded', file);
    engine.transition(file, 'p4_reviewing');
    expect(engine.inspect(file).transitions.find(t => t.to === 'p4_complete')?.missing).toContain('environment_document_candidate_return_required');
    const returning = (binding.gates as Record<string, { required_evidence: string[] }>).p4_document_candidate_written;
    for (const id of returning.required_evidence) engine.evidence(file, id, file);
    expect(engine.transition(file, 'p3_test_preparing').state).toBe('p3_test_preparing');
    expect(readFileSync(join(root, file), 'utf8')).toContain('written_returned_to_p3');
  });
});
