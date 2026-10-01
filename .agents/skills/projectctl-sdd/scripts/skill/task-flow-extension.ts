/** Generic, fail-closed composition of explicitly selected workflow extensions. */
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';

type Entry = Record<string, unknown>;
interface Declaration { selector: string; selected: string; inactive?: string; path: string; skill: string }
interface Extension extends Entry {
  schema: string; id: string; selector: string; selected: string;
  base_binding_id: string; base_binding_version: string;
  module_paths?: Record<string, string>; evaluator_contracts?: Record<string, string>;
  operations: Operation[];
}
type Operation = { op: 'replace_transition' | 'add_phase' | 'add_statuses' | 'register_lanes' | 'register_gates'
  | 'add_blocking_gates' | 'add_close_gate' | 'set_mode' | 'add_artifact_keys' | 'set_delivery'
  | 'register_review_mechanism'; value_ref?: string; key?: string; phase?: string; expected?: Entry;
  control?: string; to?: string; target_ref?: string; judges_ref?: string; lane_ref?: string };
interface ModuleEntry { path: string; authority: string; revision: string }

const invalid = (message: string): never => { throw new Error(`mode_config_invalid: ${message}`); };
const record = (value: unknown): value is Entry => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const uniqueStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text) && new Set(value).size === value.length;
const keys = (value: Entry) => Object.keys(value);
const stable = (value: unknown): string => JSON.stringify(value, (_key, part) => record(part)
  ? Object.fromEntries(Object.entries(part).sort(([a], [b]) => a.localeCompare(b))) : part);
const own = (object: Entry, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);

function canonicalFile(root: string, path: string, parent?: string): string {
  if (!text(path) || isAbsolute(path) || path.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) invalid(`unsafe extension path ${String(path)}`);
  const absolute = resolve(root, path);
  const allowed = resolve(root, parent ?? '.agents/skills');
  if (!absolute.startsWith(allowed + '/') || !existsSync(absolute)) invalid(`selected extension file missing: ${path}`);
  if (realpathSync(absolute) !== absolute || lstatSync(absolute).isSymbolicLink()) invalid(`extension symlink forbidden: ${path}`);
  return absolute;
}

function valueAt(ext: Extension, pointer?: string): unknown {
  if (!text(pointer) || !/^\/(?:[a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_-]+)*$/.test(pointer)) invalid('invalid extension value reference');
  let value: unknown = ext;
  for (const segment of pointer.slice(1).split('/')) {
    if (!record(value) || !own(value, segment)) invalid(`extension value missing: ${pointer}`);
    value = value[segment];
  }
  return structuredClone(value);
}

function targetTransition(result: Entry, from: string, to: string): Entry {
  const entries = [...(result.phases as Entry[]), ...(result.controls as Entry[])];
  const found = entries.flatMap(item => item.transitions as Entry[]).filter(t => t.from === from && t.to === to);
  if (found.length !== 1) invalid(`transition ${from}:${to} missing or ambiguous`);
  return found[0];
}

function assertGraph(result: Entry): void {
  const phases = result.phases as Entry[];
  const lanes = result.lanes as Entry;
  const gates = result.gates as Entry;
  const statuses = (result.status as { writable: string[] }).writable;
  const targets = new Set<string>((result.controls as Entry[]).map(control => control.id as string));
  for (const phase of phases) for (const state of phase.states as string[]) {
    if (targets.has(state)) invalid(`duplicate state ${state}`);
    targets.add(state);
  }
  if (new Set(phases.map(p => p.id)).size !== phases.length || !uniqueStrings(statuses)) invalid('duplicate phase/status');
  for (const phase of phases) {
    if (!statuses.includes(phase.status as string) || !uniqueStrings(phase.allowed_lanes)
      || (phase.allowed_lanes as string[]).some(lane => !own(lanes, lane))) invalid('phase refers to unknown status/lane');
  }
  for (const [laneId, raw] of Object.entries(lanes)) {
    if (!record(raw) || !text(raw.owner_phase) || !phases.some(p => p.id === raw.owner_phase && (p.allowed_lanes as string[]).includes(laneId)))
      invalid(`lane ${laneId} has no owning phase`);
  }
  for (const entry of [...phases, ...(result.controls as Entry[])]) for (const t of entry.transitions as Entry[]) {
    if (!text(t.from) || !text(t.to) || !targets.has(t.to)
      || (own(entry, 'states') ? !(entry.states as string[]).includes(t.from) : t.from !== entry.id)
      || (t.guard !== undefined && !own(gates, t.guard as string))
      || (t.blocking_gates !== undefined && (!uniqueStrings(t.blocking_gates) || (t.blocking_gates as string[]).some(gate => !own(gates, gate))))) invalid('transition has unresolved target/gate');
  }
  for (const entry of [...phases, ...(result.controls as Entry[])]) {
    const transitions = entry.transitions as Entry[];
    if (new Set(transitions.map(t => stable([t.from, t.to, t.guard ?? null]))).size !== transitions.length)
      invalid('duplicate transition');
  }
}

/** Selected extension modules are exact files relative to their satellite root. */
function modulePath(root: string, directory: string, ext: Extension, skill: string): string {
  const relativePath = ext.module_paths?.[skill];
  if (!text(relativePath) || !relativePath.startsWith('modules/')) invalid(`module for ${skill} missing`);
  const absolute = canonicalFile(root, `${directory}/${relativePath}`, directory);
  if (basename(absolute) !== 'module.md') invalid('module must end in module.md');
  return relative(root, absolute).split('\\').join('/');
}

export function composeSelectedExtensions(base: Entry, root: string, selections: Readonly<Record<string, string>>): Entry {
  const declarations = base.extensions;
  if (!record(declarations)) invalid('extension declarations missing');
  const result = structuredClone(base);
  const active: string[] = [];
  const laneModules: Record<string, ModuleEntry> = {};
  const mechanisms: Record<string, Entry> = {};
  for (const [id, raw] of Object.entries(declarations)) {
    if (!record(raw) || !text(raw.selector) || !text(raw.selected) || !text(raw.path) || !text(raw.skill)) invalid(`invalid extension declaration ${id}`);
    const declaration = raw as unknown as Declaration;
    const definition = (base.modes as Entry)?.[declaration.selector];
    const defaultValue = record(definition) ? definition.default : declaration.inactive;
    const selected = selections[declaration.selector] ?? defaultValue;
    if (selected !== declaration.selected) {
      if (selected !== declaration.inactive && !(record(definition) && Array.isArray(definition.allowed) && definition.allowed.includes(selected)))
        throw new Error(`mode_selection_invalid: ${declaration.selector}`);
      continue;
    }
    const skill = canonicalFile(root, declaration.skill);
    const file = canonicalFile(root, declaration.path);
    if (basename(skill) !== 'SKILL.md' || basename(file) !== 'workflow-extension.json' || dirname(file) !== dirname(skill)) invalid('extension path/skill mismatch');
    const directory = relative(root, dirname(skill)).split('\\').join('/');
    let ext: Extension;
    try { ext = JSON.parse(readFileSync(file, 'utf8')); } catch { invalid(`extension ${id} unreadable`); }
    if (!record(ext) || ext.schema !== 'task-flow-extension/v1' || ext.id !== id || ext.selector !== declaration.selector
      || ext.selected !== selected || ext.base_binding_id !== base.binding_id || ext.base_binding_version !== base.binding_version
      || !Array.isArray(ext.operations) || !ext.operations.length) invalid(`extension ${id} identity/operations mismatch`);
    for (const path of Object.values(ext.module_paths ?? {})) canonicalFile(root, `${directory}/${path}`, directory);
    for (const path of Object.values(ext.evaluator_contracts ?? {})) canonicalFile(root, `${directory}/${path}`, directory);
    const addedGates = new Set<string>();
    for (const op of ext.operations) {
      if (!record(op)) invalid('invalid extension operation');
      const value = op.value_ref ? valueAt(ext, op.value_ref) : undefined;
      switch (op.op) {
        case 'replace_transition': {
          if (!text(op.phase) || !record(op.expected) || !record(value)) invalid('invalid transition replacement');
          const next = value as Entry;
          const phase = (result.phases as Entry[]).find(item => item.id === op.phase);
          const matches = (phase?.transitions as Entry[] | undefined)?.filter(t => stable(t) === stable(op.expected)) ?? [];
          if (matches.length !== 1 || next.from !== op.expected.from || !text(next.to)) invalid('transition replacement precondition failed');
          const transitions = phase!.transitions as Entry[];
          transitions[transitions.indexOf(matches[0])] = next;
          break;
        }
        case 'add_phase': {
          if (!record(value) || !text(value.id) || !uniqueStrings(value.states) || !uniqueStrings(value.allowed_lanes)
            || !Array.isArray(value.transitions) || (result.phases as Entry[]).some(p => p.id === value.id)) invalid('phase collision/shape');
          (result.phases as Entry[]).push(value as Entry);
          break;
        }
        case 'add_statuses': {
          if (!uniqueStrings(value) || (value as string[]).some(s => (result.status as { writable: string[] }).writable.includes(s))) invalid('status collision/shape');
          (result.status as { writable: string[] }).writable.push(...value as string[]);
          break;
        }
        case 'register_lanes': {
          if (!record(value) || !keys(value).length) invalid('lane registry missing');
          for (const [laneId, lane] of Object.entries(value)) {
            if (own(result.lanes as Entry, laneId) || !record(lane) || !text(lane.skill) || !text(lane.owner_phase)) invalid('lane collision/shape');
            const path = modulePath(root, directory, ext, lane.skill);
            (result.lanes as Entry)[laneId] = lane;
            laneModules[laneId] = { path, authority: text(ext.authority) ? ext.authority : id, revision: ext.schema };
          }
          break;
        }
        case 'register_gates': {
          if (!record(value) || !keys(value).length) invalid('gate registry missing');
          for (const [gateId, gate] of Object.entries(value)) {
            if (own(result.gates as Entry, gateId) || !record(gate) || !text(gate.evaluator) || !uniqueStrings(gate.required_evidence)
              || !(gate.required_evidence as string[]).length) invalid('gate collision/shape');
            if (!['hard_gate', 'evidence', 'transition_gate', 'revision_gate', 'envelope_gate', 'app_map_close_gate'].includes(gate.evaluator)) {
              const path = ext.evaluator_contracts?.[gate.evaluator];
              if (!text(path) || !path.startsWith('modules/')) invalid(`unknown evaluator ${gate.evaluator}`);
              canonicalFile(root, `${directory}/${path}`, directory);
            }
            (result.gates as Entry)[gateId] = gate;
            addedGates.add(gateId);
          }
          break;
        }
        case 'add_blocking_gates': {
          if (!record(value) || !keys(value).length) invalid('blocking gate edges missing');
          for (const [edge, gate] of Object.entries(value)) {
            const parts = edge.split(':');
            if (parts.length !== 2 || !text(gate) || !addedGates.has(gate)) invalid('blocking gate edge inconsistent');
            const transition = targetTransition(result, parts[0], parts[1]);
            transition.blocking_gates = [...new Set([...(transition.blocking_gates as string[] ?? []), gate])];
          }
          break;
        }
        case 'add_close_gate': {
          if (!text(op.control) || !text(op.to) || !text(value) || !addedGates.has(value)) invalid('close gate inconsistent');
          if (!(result.controls as Entry[]).some(c => c.id === op.control)) invalid('close control missing');
          const transition = targetTransition(result, op.control, op.to);
          transition.blocking_gates = [...new Set([...(transition.blocking_gates as string[] ?? []), value])];
          break;
        }
        case 'set_mode': {
          if (op.key !== declaration.selector || !record(value) || !uniqueStrings(value.allowed) || !value.allowed.includes(selected)
            || !text(value.default) || !value.allowed.includes(value.default)
            || (value.skills !== undefined && (!uniqueStrings(value.skills)
              || (value.skills as string[]).some(skillId => !ext.module_paths?.[skillId])))
            || own(result.modes as Entry, op.key)) invalid('mode collision/shape');
          (result.modes as Entry)[op.key] = value;
          break;
        }
        case 'add_artifact_keys': {
          const artifacts = ((result.artifact_store as Entry).phase_artifacts as Entry).artifact_keys as string[];
          if (!uniqueStrings(value) || (value as string[]).some(key => artifacts.includes(key))) invalid('artifact key collision/shape');
          artifacts.push(...value as string[]);
          break;
        }
        case 'set_delivery': {
          if (!text(op.key) || !record(value) || own(result.delivery as Entry, op.key)) invalid('delivery collision/shape');
          const delivery = value as Entry;
          if (delivery.required_gates !== undefined && (!uniqueStrings(delivery.required_gates)
            || (delivery.required_gates as string[]).some(gate => !addedGates.has(gate)))) invalid('delivery refers to unknown gate');
          if (delivery.required_gates !== undefined) {
            const transitions = [...result.phases as Entry[], ...result.controls as Entry[]].flatMap(entry => entry.transitions as Entry[]);
            if ((delivery.required_gates as string[]).some(gate => !transitions.some(t => (t.blocking_gates as string[] | undefined)?.includes(gate))))
              invalid('delivery gate not attached to transition');
          }
          if (delivery.close_gate !== undefined && (!text(delivery.close_gate) || !addedGates.has(delivery.close_gate))) invalid('delivery close gate unknown');
          (result.delivery as Entry)[op.key] = delivery;
          break;
        }
        case 'register_review_mechanism': {
          const target = valueAt(ext, op.target_ref);
          const judges = valueAt(ext, op.judges_ref);
          const lane = valueAt(ext, op.lane_ref);
          if (!record(target) || !record(judges) || !record(lane) || !text(lane.skill)
            || !uniqueStrings(target.required) || !(target.required as string[]).length || !uniqueStrings(target.kinds)
            || target.phase !== 'any' || target.immutable !== true || !Number.isInteger(judges.minimum)
            || (judges.minimum as number) < 2 || !Number.isInteger(judges.max_rounds) || (judges.max_rounds as number) < 1
            || judges.independent !== true || judges.same_target_and_scope !== true || judges.explicit_evidence !== true
            || own(mechanisms, selected)) invalid('review mechanism shape/collision');
          const path = modulePath(root, directory, ext, (lane as Entry).skill as string);
          mechanisms[selected] = { target, judges, lane, skill_path: declaration.skill, module_path: path };
          break;
        }
        default: invalid(`unknown extension operation ${String((op as { op: unknown }).op)}`);
      }
    }
    const include = (result.active_sources as { include: string[] }).include;
    for (const source of [declaration.path, declaration.skill,
      ...Object.values(ext.module_paths ?? {}).map(path => `${directory}/${path}`),
      ...Object.values(ext.evaluator_contracts ?? {}).map(path => `${directory}/${path}`)]) {
      if (!include.includes(source)) include.push(source);
    }
    active.push(id);
  }
  if (active.length) {
    assertGraph(result);
    result.active_extensions = active;
    if (keys(laneModules).length) result.extension_lane_modules = laneModules;
    if (keys(mechanisms).length) result.review_mechanisms = mechanisms;
  }
  return result;
}
