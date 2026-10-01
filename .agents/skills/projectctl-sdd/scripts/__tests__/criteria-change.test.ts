// @ac AC-VIEWS-08 — canonical criteria integration of the documented SDD satellite.
import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireAppMap } from '../../../projectctl-requirements/scripts/project/app-map-inventory.ts';
import { criteriaBaseline, parseCriteriaChange, validateCriteriaChange, validateCriteriaLinks, type CriteriaChange } from '../project/criteria-change.ts';

const roots: string[] = [];
const existing = { id: 'AC-VIEWS-08', title: 'Existing behavior', type: 'tooling' };
const added = { id: 'PCT-155', title: 'New behavior', type: 'tooling' };
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'canonical-criteria-')); roots.push(root);
  mkdirSync(join(root, 'docs/app-map'), { recursive: true });
  writeFileSync(join(root, 'docs/app-map/navigation.yaml'), 'root_id: app\nnavigation:\n  - id: app\n    title: App\n    kind: view\n    bundle: app\n    children: []\n');
  bundle(root, [existing]);
  return root;
}
function bundle(root: string, criteria: unknown[]) {
  writeFileSync(join(root, 'docs/app-map/app.md'), `---\n${Bun.YAML.stringify({ criteria })}\n---\n`);
}
const fence = (name: string, value: unknown) => `\`\`\`${name}\n${JSON.stringify(value)}\n\`\`\`\n`;
function change(root: string): CriteriaChange {
  return parseCriteriaChange(fence('criteria-change', { schema: 'criteria-change/v1', targets: ['app'], baseline: criteriaBaseline(root, ['app']), changes: [{ id: existing.id, bundle: 'docs/app-map/app.md', operation: 'modify', before: existing, after: { ...existing, title: 'Improved behavior' }, reason: 'Correct observable behavior' }, { id: added.id, bundle: 'docs/app-map/app.md', operation: 'add', before: null, after: added, reason: 'Support new capability' }] }));
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('canonical SDD criteria change requests', () => {
  it('validates baseline and materialization of the exact same compound/simple IDs', () => {
    const root = fixture(), delta = change(root);
    expect(() => validateCriteriaChange(root, delta, 'baseline')).not.toThrow();
    expect(() => validateCriteriaChange(root, delta, 'applied')).toThrow('materialized');
    bundle(root, [{ ...existing, title: 'Improved behavior' }, added]);
    expect(() => validateCriteriaChange(root, delta, 'applied')).not.toThrow();
    expect(() => validateCriteriaChange(root, delta, 'baseline')).toThrow('stale');
  });
  it('rejects stale, incomplete and duplicated baselines, out-of-scope IDs and collisions', () => {
    const root = fixture(), delta = change(root);
    expect(() => validateCriteriaChange(root, { ...delta, baseline: [] }, 'baseline')).toThrow('incomplete');
    expect(() => parseCriteriaChange(fence('criteria-change', { ...delta, baseline: [...delta.baseline, delta.baseline[0]] }))).toThrow('duplicate');
    const foreign = structuredClone(delta); foreign.changes[0]!.bundle = 'docs/app-map/foreign.md';
    expect(() => validateCriteriaChange(root, foreign, 'baseline')).toThrow('baseline');
    const collision = structuredClone(delta); collision.changes = [{ ...collision.changes[1]!, id: existing.id, after: existing }];
    expect(() => validateCriteriaChange(root, collision, 'baseline')).toThrow('reserved');
    bundle(root, [{ ...existing, title: 'Concurrent change' }]);
    expect(() => validateCriteriaChange(root, delta, 'baseline')).toThrow('stale');
  });
  it('rejects contradictory operations, unknown fields and identity changes', () => {
    const root = fixture(), delta = change(root);
    expect(() => parseCriteriaChange(fence('criteria-change', { ...delta, changes: [...delta.changes, delta.changes[0]] }))).toThrow('contradictory');
    expect(() => parseCriteriaChange(fence('criteria-change', { ...delta, task_ac_map: {} }))).toThrow('unknown');
    delta.changes[0]!.after!.id = 'AC-001';
    expect(() => parseCriteriaChange(fence('criteria-change', delta))).toThrow('identity changed');
  });
  it('requires justified non-criteria changes and explicit maintained criteria', () => {
    const root = fixture(), delta = change(root);
    expect(() => parseCriteriaChange(fence('criteria-change', { ...delta, changes: [] }))).toThrow('justification');
    const empty = parseCriteriaChange(fence('criteria-change', { ...delta, changes: [], no_criteria_reason: 'Mechanical cleanup only' }));
    expect(() => validateCriteriaChange(root, empty, 'baseline')).not.toThrow();
    const maintained = { ...delta, changes: [{ ...delta.changes[0]!, operation: 'maintain', after: existing }] };
    expect(() => validateCriteriaChange(root, parseCriteriaChange(fence('criteria-change', maintained)), 'applied')).not.toThrow();
  });
  it('retires with a retained tombstone, never reuses an ID or mistakes absence for retirement', () => {
    const root = fixture(), delta = change(root);
    delta.changes = [{ ...delta.changes[0]!, operation: 'remove', after: null }];
    expect(() => validateCriteriaChange(root, delta, 'baseline')).not.toThrow();
    bundle(root, []);
    expect(() => validateCriteriaChange(root, delta, 'applied')).toThrow('owner missing');
    bundle(root, [{ ...existing, functional: 'not-applicable', exception_reason: 'criterion_retired' }]);
    expect(() => validateCriteriaChange(root, delta, 'applied')).not.toThrow();
    const reuse = change(root); reuse.changes = [{ ...reuse.changes[1]!, id: existing.id, after: existing }];
    expect(() => validateCriteriaChange(root, reuse, 'baseline')).toThrow('reserved');
  });
  it('rejects duplicate canonical owners rather than selecting one silently', () => {
    const root = fixture(); bundle(root, [existing, existing]);
    expect(() => requireAppMap(root)).toThrow('duplicate criterion');
  });
  it('rejects unapproved changes in criteria left outside the declared operations', () => {
    const root = fixture(); bundle(root, [existing, added]);
    const delta = change(root); delta.changes = [delta.changes[0]!];
    bundle(root, [{ ...existing, title: 'Improved behavior' }, { ...added, title: 'Unapproved change' }]);
    expect(() => validateCriteriaChange(root, delta, 'applied')).toThrow('unapproved');
    bundle(root, [{ ...existing, title: 'Improved behavior' }, { ...added, functional: 'not-applicable', exception_reason: 'criterion_retired' }]);
    expect(() => validateCriteriaChange(root, delta, 'applied')).toThrow('unapproved');
  });
  it('carries canonical IDs through spec scenarios and work units without a task mapping', () => {
    const ids = [existing.id, added.id];
    const spec = validateCriteriaLinks(fence('criteria-links', { schema: 'criteria-links/v1', criteria: ids, scenarios: [{ id: 'S1', criterion_ids: [ids[0]] }, { id: 'S2', criterion_ids: [ids[1]] }] }), ids, 'spec');
    const units = { schema: 'criteria-links/v1', criteria: ids, units: [{ id: 'WU-A', criterion_ids: ids, scenario_ids: ['S1', 'S2'] }] };
    expect(() => validateCriteriaLinks(fence('criteria-links', units), ids, 'tasks', spec)).not.toThrow();
    units.units[0]!.scenario_ids = ['unknown'];
    expect(() => validateCriteriaLinks(fence('criteria-links', units), ids, 'tasks', spec)).toThrow('mismatch');
    expect(() => validateCriteriaLinks(fence('criteria-links', { schema: 'criteria-links/v1', criteria: ['AC-001'], scenarios: [] }), ids, 'spec')).toThrow('approved');
  });
  it('allows mechanical units without fabricated IDs, but never lets them cover a criterion', () => {
    const spec = validateCriteriaLinks(fence('criteria-links', { schema: 'criteria-links/v1', criteria: [], scenarios: [] }), [], 'spec');
    expect(() => validateCriteriaLinks(fence('criteria-links', { schema: 'criteria-links/v1', criteria: [], units: [{ id: 'delivery', criterion_ids: [], scenario_ids: [], mechanical: true }] }), [], 'tasks', spec)).not.toThrow();
    expect(() => validateCriteriaLinks(fence('criteria-links', { schema: 'criteria-links/v1', criteria: [existing.id], units: [{ id: 'delivery', criterion_ids: [], scenario_ids: [], mechanical: true }] }), [existing.id], 'tasks', spec)).toThrow('coverage');
  });
  it('adds a new feature bundle under its explicitly assigned existing parent target', () => {
    const root = fixture(), delta = change(root);
    delta.changes = [{ ...delta.changes[1]!, bundle: 'docs/app-map/new.md' }];
    delta.new_bundles = [{ bundle: 'docs/app-map/new.md', parent_target: 'app' }];
    expect(() => validateCriteriaChange(root, delta, 'baseline')).not.toThrow();
    writeFileSync(join(root, 'docs/app-map/new.md'), `---\n${Bun.YAML.stringify({ criteria: [added] })}\n---\n`);
    expect(() => validateCriteriaChange(root, delta, 'baseline')).toThrow('already exists');
    writeFileSync(join(root, 'docs/app-map/navigation.yaml'), 'root_id: app\nnavigation:\n  - id: app\n    title: App\n    kind: view\n    bundle: app\n    children:\n      - id: new\n        title: New\n        kind: feature\n        bundle: new\n        children: []\n');
    expect(() => validateCriteriaChange(root, delta, 'applied')).not.toThrow();
  });
});
