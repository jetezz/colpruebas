/** Binding-owned phase execution policy; no project phases or lanes are inferred. */
import { createHash } from 'node:crypto';

type Row = Record<string, unknown>;
export interface PhaseExecutionPolicy {
  schema: 'phase-execution/v1';
  execution: 'complete-requested-phase';
  cross_phase: 'ask-then-confirm-every-transition';
  approval_is_execution_permission: false;
  missing_authorization: 'ask-preserve-position';
  resume: 'reload-contract-preserve-scope';
  startup_paths: string[];
  stop_states: Record<string, string[]>;
  lane_states: Record<string, string[]>;
}
const object = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0
  && v.every(s => typeof s === 'string' && !!s.trim()) && new Set(v).size === v.length;
export function phaseExecutionPolicy(binding: Row): PhaseExecutionPolicy {
  const p = binding.phase_execution;
  const fail = (): never => { throw new Error('phase_execution_config_invalid'); };
  if (!object(p) || p.schema !== 'phase-execution/v1' || p.execution !== 'complete-requested-phase'
      || p.cross_phase !== 'ask-then-confirm-every-transition' || p.approval_is_execution_permission !== false
      || p.missing_authorization !== 'ask-preserve-position' || p.resume !== 'reload-contract-preserve-scope'
      || !strings(p.startup_paths) || !object(p.stop_states) || !object(p.lane_states)
      || !object(binding.lanes) || !Array.isArray(binding.phases)) return fail();
  const phases = binding.phases as Array<{ id: string; states: string[]; allowed_lanes: string[] }>;
  if (Object.keys(p.stop_states as Row).length !== phases.length || phases.some(phase => {
    const states = (p.stop_states as Row)[phase.id];
    return !strings(states) || states.some(s => !phase.states.includes(s));
  })) fail();
  if ((p.startup_paths as string[]).some(path => path.startsWith('/') || path.split(/[\\/]/).some(part => !part || part === '.' || part === '..'))) fail();
  if (Object.keys(p.lane_states as Row).length !== Object.keys(binding.lanes as Row).length
      || Object.keys(binding.lanes as Row).some(lane => {
        const states = (p.lane_states as Row)[lane];
        return !strings(states) || states.some(state => !phases.some(phase => phase.states.includes(state) && phase.allowed_lanes.includes(lane)));
      })) fail();
  return p as unknown as PhaseExecutionPolicy;
}
export function executionDigest(value: unknown): string {
  const stable = JSON.stringify(value, (_key, part) => object(part)
    ? Object.fromEntries(Object.entries(part).sort(([a], [b]) => a.localeCompare(b))) : part);
  return createHash('sha256').update(stable).digest('hex');
}
export interface PhaseAuthorization {
  schema: 'phase-authorization/v1'; phase: string; actor: string; literal_message: string;
  recorded_at: string; contract_digest: string;
}
export interface PhaseQuestion {
  schema: 'phase-question/v1'; from: string; to: string; from_phase: string | null;
  to_phase: string | null; question: string; asked_at: string; revision: string;
  confirmation?: { actor: string; literal_message: string; recorded_at: string };
}
export interface PhaseExecutionRecord {
  authorization?: PhaseAuthorization;
  question?: PhaseQuestion;
  last_transition?: PhaseQuestion;
}
