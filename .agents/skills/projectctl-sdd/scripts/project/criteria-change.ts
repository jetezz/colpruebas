/** SDD change requests reference core IDs directly; they never create a task-local catalog. */
import { requireAppMap, selectAppScope } from '../../../projectctl-requirements/scripts/project/app-map-inventory.ts';
import { canonicalJson, criterionDefinition, criterionRevision, isCriterionId, isRetiredCriterion, type CriterionDefinition } from '../../../projectctl-requirements/scripts/project/criterion-contract.ts';

export type BaselineEntry = { id: string; bundle: string; revision: string; retired: boolean };
export type CriterionChange = { id: string; bundle: string; operation: 'add' | 'modify' | 'remove' | 'maintain'; before: CriterionDefinition | null; after: CriterionDefinition | null; reason: string };
export type CriteriaChange = { schema: 'criteria-change/v1'; targets: string[]; baseline: BaselineEntry[]; changes: CriterionChange[]; no_criteria_reason?: string; new_bundles?: Array<{ bundle: string; parent_target: string }> };
type Row = Record<string, unknown>;
export type CriteriaIdentityContract = { schema: 'canonical-criteria/v1'; surface_skill_paths: string[]; approval_evidence: string; planning_evidence: string; close_evidence: string };
export function criteriaIdentityContract(binding: Row): CriteriaIdentityContract {
  const value = binding.criteria_identity;
  if (!object(value)) throw new Error('criteria_identity contract missing');
  exactKeys(value, ['schema', 'surface_skill_paths', 'approval_evidence', 'planning_evidence', 'close_evidence']);
  if (value.schema !== 'canonical-criteria/v1' || !strings(value.surface_skill_paths) || !value.surface_skill_paths.length
      || ['approval_evidence', 'planning_evidence', 'close_evidence'].some(k => typeof value[k] !== 'string' || !value[k])) throw new Error('criteria_identity contract invalid');
  return value as CriteriaIdentityContract;
}
function object(value: unknown): value is Row { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exactKeys(value: Row, keys: string[]): void {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new Error('unknown criteria contract field');
}
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.every(v => typeof v === 'string' && v.length > 0) && new Set(value).size === value.length; }
function bundlePath(value: unknown): value is string {
  return typeof value === 'string' && /^docs\/app-map\/[\w./-]+\.md$/.test(value) && !value.split('/').includes('..') && !value.includes('//');
}
function definition(value: unknown, id: string): CriterionDefinition | null {
  if (value === null) return null;
  if (!object(value)) throw new Error(`invalid definition: ${id}`);
  exactKeys(value, ['id', 'title', 'type', 'requirement']);
  const result = criterionDefinition(value);
  if (result.id !== id) throw new Error(`criterion identity changed: ${id}`);
  return result;
}

export function readCriteriaFence<T>(markdown: string, name: string): T {
  const blocks = [...markdown.matchAll(new RegExp('^```' + name + '\\s*\\n([\\s\\S]*?)^```\\s*$', 'gm'))];
  if (blocks.length !== 1) throw new Error(`exactly one ${name} block required`);
  return JSON.parse(blocks[0]![1]!) as T;
}

export function criteriaBaseline(root: string, targets: string[], inventory = requireAppMap(root)): BaselineEntry[] {
  if (!strings(targets) || !targets.length) throw new Error('explicit navigation targets required');
  const selected = new Map<string, BaselineEntry>();
  for (const target of targets) for (const c of selectAppScope(inventory, target).criteria) {
    selected.set(c.id, { id: c.id, bundle: c.bundle, revision: criterionRevision({ ...c.data, id: c.id }), retired: isRetiredCriterion(c.data) });
  }
  return [...selected.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function parseCriteriaChange(markdown: string): CriteriaChange {
  const raw = readCriteriaFence<unknown>(markdown, 'criteria-change');
  if (!object(raw)) throw new Error('invalid criteria change');
  exactKeys(raw, ['schema', 'targets', 'baseline', 'changes', 'no_criteria_reason', 'new_bundles']);
  if (raw.schema !== 'criteria-change/v1' || !strings(raw.targets) || !raw.targets.length || !Array.isArray(raw.baseline) || !Array.isArray(raw.changes)) throw new Error('invalid criteria change schema');
  const baseline = raw.baseline.map((v: unknown) => {
    if (!object(v)) throw new Error('invalid baseline');
    exactKeys(v, ['id', 'bundle', 'revision', 'retired']);
    if (!isCriterionId(v.id) || !bundlePath(v.bundle) || typeof v.revision !== 'string' || !/^[a-f0-9]{64}$/.test(v.revision) || typeof v.retired !== 'boolean') throw new Error('invalid baseline reference');
    return v as BaselineEntry;
  });
  if (new Set(baseline.map(b => b.id)).size !== baseline.length) throw new Error('duplicate baseline ID');
  const changes = raw.changes.map((v: unknown) => {
    if (!object(v)) throw new Error('invalid criterion change row');
    exactKeys(v, ['id', 'bundle', 'operation', 'before', 'after', 'reason']);
    if (!isCriterionId(v.id) || !bundlePath(v.bundle) || !['add', 'modify', 'remove', 'maintain'].includes(String(v.operation)) || typeof v.reason !== 'string' || !v.reason.trim()) throw new Error('invalid criterion operation or justification');
    const before = definition(v.before, v.id), after = definition(v.after, v.id);
    if (v.operation === 'add' ? before !== null || !after : v.operation === 'remove' ? !before || after !== null : !before || !after) throw new Error(`invalid before/after: ${v.id}`);
    if (v.operation === 'maintain' && canonicalJson(before) !== canonicalJson(after) || v.operation === 'modify' && canonicalJson(before) === canonicalJson(after)) throw new Error(`operation does not match definition delta: ${v.id}`);
    return { ...v, before, after } as CriterionChange;
  });
  if (new Set(changes.map(c => c.id)).size !== changes.length) throw new Error('duplicate or contradictory criterion operation');
  if (raw.no_criteria_reason !== undefined && (typeof raw.no_criteria_reason !== 'string' || !raw.no_criteria_reason.trim())) throw new Error('invalid no-criteria justification');
  if (!changes.length && !raw.no_criteria_reason) throw new Error('empty delta requires no_criteria_reason justification');
  if (raw.new_bundles !== undefined && (!Array.isArray(raw.new_bundles) || raw.new_bundles.some((v: unknown) => !object(v) || Object.keys(v).some(k => !['bundle', 'parent_target'].includes(k)) || !bundlePath(v.bundle) || !raw.targets.includes(v.parent_target)))) throw new Error('invalid new bundle ownership');
  const newBundles = raw.new_bundles as CriteriaChange['new_bundles'];
  if (newBundles && new Set(newBundles.map(b => b.bundle)).size !== newBundles.length) throw new Error('duplicate new bundle');
  return { schema: 'criteria-change/v1', targets: raw.targets, baseline, changes, ...(raw.no_criteria_reason ? { no_criteria_reason: String(raw.no_criteria_reason) } : {}), ...(newBundles ? { new_bundles: newBundles } : {}) };
}

/** Baseline is checked before approval; applied checks definitions and tombstones, not just IDs. */
export function validateCriteriaChange(root: string, change: CriteriaChange, stage: 'baseline' | 'applied'): void {
  const inventory = requireAppMap(root);
  const actual = criteriaBaseline(root, change.targets, inventory);
  const sort = (rows: BaselineEntry[]) => [...rows].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (stage === 'baseline' && canonicalJson(actual) !== canonicalJson(sort(change.baseline))) throw new Error('criteria baseline stale or incomplete');
  const global = new Map(inventory.criteria.map(c => [c.id, c]));
  const base = new Map(change.baseline.map(c => [c.id, c]));
  const scopedBundles = new Set(change.targets.flatMap(t => selectAppScope(inventory, t).bundles.map(b => b.file)));
  for (const row of change.changes) {
    const old = base.get(row.id), current = global.get(row.id);
    if (row.operation === 'add') {
      if (old || stage === 'baseline' && current) throw new Error(`criterion ID already reserved: ${row.id}`);
      const newBundle = change.new_bundles?.find(b => b.bundle === row.bundle);
      if (!scopedBundles.has(row.bundle) && (!newBundle || stage === 'applied')) throw new Error(`criterion owner outside target: ${row.id}`);
      if (newBundle && stage === 'baseline' && inventory.bundles.some(b => b.file === row.bundle)) throw new Error('new bundle already exists');
    } else {
      if (!old || old.bundle !== row.bundle || criterionRevision(row.before!) !== old.revision) throw new Error(`criterion not in approved baseline: ${row.id}`);
      if (stage === 'baseline' && current && isRetiredCriterion(current.data)) throw new Error(`criterion retired: ${row.id}`);
    }
    if (stage === 'applied') {
      if (!current || current.bundle !== row.bundle) throw new Error(`canonical criterion owner missing: ${row.id}`);
      if (row.operation === 'remove') {
        if (!isRetiredCriterion(current.data) || criterionRevision({ ...current.data, id: current.id }) !== old!.revision) throw new Error(`criterion retirement not materialized: ${row.id}`);
        const coverage = current.data.coverage;
        if (coverage !== undefined && (!object(coverage) || ['Unit', 'PW-CLI', 'PW-AUTO', 'Manual'].some(method => coverage[method] !== 'not-applicable'))) throw new Error(`retired criterion still claims applicable coverage: ${row.id}`);
      } else if (isRetiredCriterion(current.data) || canonicalJson(criterionDefinition({ ...current.data, id: current.id })) !== canonicalJson(row.after)) throw new Error(`criterion definition not materialized: ${row.id}`);
    }
  }
  if (stage === 'applied') {
    const changed = new Set(change.changes.map(c => c.id));
    for (const old of change.baseline) if (!changed.has(old.id) && canonicalJson(actual.find(c => c.id === old.id)) !== canonicalJson(old)) throw new Error(`unapproved criterion change: ${old.id}`);
    const expected = new Set([...base.keys(), ...change.changes.filter(c => c.operation === 'add').map(c => c.id)]);
    if (actual.some(c => !expected.has(c.id)) || actual.length !== expected.size) throw new Error('unapproved criteria scope delta');
  }
}

export type CriteriaLinks = { schema: 'criteria-links/v1'; criteria: string[]; scenarios?: Array<{ id: string; criterion_ids: string[] }>; units?: Array<{ id: string; criterion_ids: string[]; scenario_ids: string[]; mechanical?: boolean }> };
export function validateCriteriaLinks(markdown: string, ids: string[], kind: 'spec' | 'tasks', spec?: CriteriaLinks): CriteriaLinks {
  const links = readCriteriaFence<CriteriaLinks>(markdown, 'criteria-links');
  if (!object(links)) throw new Error('invalid criteria links');
  exactKeys(links, kind === 'spec' ? ['schema', 'criteria', 'scenarios'] : ['schema', 'criteria', 'units']);
  if (links.schema !== 'criteria-links/v1' || !strings(links.criteria) || canonicalJson([...links.criteria].sort()) !== canonicalJson([...ids].sort())) throw new Error('criteria links differ from approved canonical IDs');
  const entries = kind === 'spec' ? links.scenarios : links.units;
  if (!Array.isArray(entries) || new Set(entries.map(e => e?.id)).size !== entries.length) throw new Error(`invalid ${kind} links`);
  for (const entry of entries) {
    if (!object(entry)) throw new Error('invalid linked entry');
    exactKeys(entry, kind === 'spec' ? ['id', 'criterion_ids'] : ['id', 'criterion_ids', 'scenario_ids', 'mechanical']);
    if (typeof entry.id !== 'string' || !entry.id.trim() || !strings(entry.criterion_ids) || entry.criterion_ids.some(id => !ids.includes(id))
        || !entry.criterion_ids.length && (kind === 'spec' || entry.mechanical !== true)) throw new Error('unknown or missing canonical criterion link');
    if (kind === 'tasks') {
      if (entry.mechanical !== undefined && typeof entry.mechanical !== 'boolean') throw new Error('invalid mechanical unit flag');
      if (entry.mechanical === true && entry.criterion_ids.length) throw new Error('mechanical units cannot cover acceptance criteria');
      if (!strings(entry.scenario_ids) || !entry.scenario_ids.length && entry.mechanical !== true) throw new Error('unit scenario links required');
      if (entry.mechanical === true && entry.scenario_ids.length) throw new Error('mechanical units cannot claim spec scenarios');
      for (const scenarioId of entry.scenario_ids) {
        const scenario = spec?.scenarios?.find(s => s.id === scenarioId);
        if (!scenario || scenario.criterion_ids.some(id => !entry.criterion_ids.includes(id))) throw new Error('unit scenario/criterion mismatch');
      }
      if (entry.criterion_ids.some(id => !entry.scenario_ids.some(s => spec?.scenarios?.find(v => v.id === s)?.criterion_ids.includes(id)))) throw new Error('unit criterion lacks scenario');
    }
  }
  if (ids.some(id => !entries.some(e => e.criterion_ids.includes(id)))) throw new Error(`approved criterion lacks ${kind} coverage`);
  return links;
}
