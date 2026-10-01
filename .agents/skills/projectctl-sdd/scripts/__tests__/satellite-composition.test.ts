import { expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildModeContext, composeSelectedExtensions, parseBindingFile, resolveLaneSkillContext } from '../skill/task-flow-normalizer.ts';

const root = process.cwd();
const base = parseBindingFile(root).binding;

test('core resolves without reading either optional satellite', () => {
  const result = composeSelectedExtensions({ ...base, extensions: {
    rdd: { selector: 'rdd_mode', selected: 'receipt-driven', inactive: 'disabled', path: 'missing.json', skill: 'missing.md' },
    'judgment-day': { selector: 'review_mode', selected: 'judgment-day', path: 'missing.json', skill: 'missing.md' },
  } }, root, {});
  expect((result.phases as any[]).map(p => p.id)).not.toContain('fase_5_rdd');
  expect(result.active_extensions).toBeUndefined();
});

test('selected RDD composes phase, lanes, gates and delivery only from satellite', () => {
  const result = parseBindingFile(root, undefined, { rdd_mode: 'receipt-driven' }).binding;
  expect((result.phases as any[]).find(p => p.id === 'fase_5_rdd').allowed_lanes).toContain('rdd-validate');
  expect((result.gates as any)['pre-commit'].evaluator).toBe('rdd_delivery_gate');
  expect((result.status as any).writable).toContain('reviewing');
  expect((result.delivery as any).rdd.required_gates).toContain('release');
  expect((result.active_sources as any).include).toContain('.agents/skills/projectctl-rdd/modules/rdd-phase/module.md');
  expect(resolveLaneSkillContext(root, result, 'rdd-review-risk').lane_skill_path).toBe('.agents/skills/projectctl-rdd/modules/rdd-review/module.md');
});

test('selected satellites fail closed on missing file or mismatched identity', () => {
  expect(() => composeSelectedExtensions({ ...base, extensions: {
    rdd: { selector: 'rdd_mode', selected: 'receipt-driven', inactive: 'disabled', path: 'missing.json', skill: 'missing.md' },
  } }, root, { rdd_mode: 'receipt-driven' })).toThrow('mode_config_invalid');
  expect(() => composeSelectedExtensions({ ...base, binding_version: 'other' }, root, { review_mode: 'judgment-day' })).toThrow('identity/operations mismatch');
});

test('JD is target-oriented and phase-agnostic', () => {
  const result = parseBindingFile(root, undefined, { review_mode: 'judgment-day' }).binding;
  expect((result as any).review_mechanisms['judgment-day'].target.phase).toBe('any');
  expect((result as any).review_mechanisms['judgment-day'].judges.minimum).toBeGreaterThanOrEqual(2);
  expect(buildModeContext(root, base, { review: 'judgment-day' }).resolved_mechanism_skill_paths.review).toEqual(['.agents/skills/projectctl-judgment-day/SKILL.md']);
});

test('generic extension refuses hidden transition replacement, collisions and unknown operations', () => {
  const isolated = mkdtempSync(resolve(import.meta.dir, 'isolated-extension-'));
  try {
    const folder = '.agents/skills/example';
    mkdirSync(resolve(isolated, folder), { recursive: true });
    writeFileSync(resolve(isolated, folder, 'SKILL.md'), '# Example\n');
    const fixture = { ...base, extensions: { example: { selector: 'review_mode', selected: 'example',
      path: `${folder}/workflow-extension.json`, skill: `${folder}/SKILL.md` } } };
    const extension: any = { schema: 'task-flow-extension/v1', id: 'example', selector: 'review_mode', selected: 'example',
      base_binding_id: base.binding_id, base_binding_version: base.binding_version,
      entry: { from: 'p4_complete', to: 'p5_started' }, operations: [
        { op: 'replace_transition', phase: 'fase_4_documentacion', expected: { from: 'p4_complete', to: 'final_commit_pending' }, value_ref: '/entry' },
      ] };
    const save = () => writeFileSync(resolve(isolated, folder, 'workflow-extension.json'), JSON.stringify(extension));
    save();
    expect(() => composeSelectedExtensions(fixture, isolated, {})).not.toThrow(); // no satellite read
    expect(() => composeSelectedExtensions(fixture, isolated, { review_mode: 'example' })).toThrow('precondition failed');
    extension.operations = [{ op: 'add_phase', value_ref: '/entry' } as any];
    extension.entry = (base.phases as any[])[0];
    save();
    expect(() => composeSelectedExtensions(fixture, isolated, { review_mode: 'example' })).toThrow('phase collision');
    extension.operations = [{ op: 'unknown', value_ref: '/entry' }];
    save();
    expect(() => composeSelectedExtensions(fixture, isolated, { review_mode: 'example' })).toThrow('unknown extension operation');
    extension.gates = { commit_recorded: { evaluator: 'hard_gate', required_evidence: ['evidence-1'] } };
    extension.operations = [{ op: 'register_gates', value_ref: '/gates' }];
    save();
    expect(() => composeSelectedExtensions(fixture, isolated, { review_mode: 'example' })).toThrow('gate collision');
  } finally { rmSync(isolated, { recursive: true, force: true }); }
});

test('selected extension requires canonical path and readable skill, without fallback', () => {
  const fixture = { ...base, extensions: { example: { selector: 'review_mode', selected: 'example',
    path: '.agents/skills/../secret/workflow-extension.json', skill: '.agents/skills/projectctl-judgment-day/SKILL.md' } } };
  expect(() => composeSelectedExtensions(fixture, root, { review_mode: 'example' })).toThrow('unsafe extension path');
  expect(() => composeSelectedExtensions({ ...fixture, extensions: { example: { ...fixture.extensions.example,
    path: '.agents/skills/absent/workflow-extension.json' } } }, root, { review_mode: 'example' })).toThrow('selected extension file missing');
});

test('an unrelated satellite composes through the same typed review operation', () => {
  const isolated = mkdtempSync(resolve(import.meta.dir, 'isolated-extension-'));
  try {
    const folder = '.agents/skills/independent';
    mkdirSync(resolve(isolated, folder, 'modules/reviewer'), { recursive: true });
    writeFileSync(resolve(isolated, folder, 'SKILL.md'), '# Independent\n');
    writeFileSync(resolve(isolated, folder, 'modules/reviewer/module.md'), '# Reviewer\n');
    writeFileSync(resolve(isolated, folder, 'workflow-extension.json'), JSON.stringify({
      schema: 'task-flow-extension/v1', id: 'independent', selector: 'review_mode', selected: 'independent',
      base_binding_id: base.binding_id, base_binding_version: base.binding_version,
      module_paths: { reviewer: 'modules/reviewer/module.md' },
      target: { phase: 'any', immutable: true, required: ['identity'], kinds: ['generic'] },
      judges: { minimum: 2, max_rounds: 1, independent: true, same_target_and_scope: true, explicit_evidence: true },
      lane: { skill: 'reviewer', role: 'verification' },
      operations: [{ op: 'register_review_mechanism', target_ref: '/target', judges_ref: '/judges', lane_ref: '/lane' }],
    }));
    const fixture = { ...base, extensions: { independent: { selector: 'review_mode', selected: 'independent',
      path: `${folder}/workflow-extension.json`, skill: `${folder}/SKILL.md` } } };
    const composed = composeSelectedExtensions(fixture, isolated, { review_mode: 'independent' });
    expect((composed.review_mechanisms as any).independent.module_path).toBe(`${folder}/modules/reviewer/module.md`);
    expect(composed.active_extensions).toEqual(['independent']);
  } finally { rmSync(isolated, { recursive: true, force: true }); }
});
