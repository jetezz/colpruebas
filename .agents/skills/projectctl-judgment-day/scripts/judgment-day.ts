#!/usr/bin/env bun
/** Standalone Judgment Day. No SDD binding, task index, phase or review mode is read here. */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export interface Target {
  identity: string;
  revision: string;
  kind: string;
  scope: string[];
  criteria: string[];
  evidence_refs: string[];
  snapshot: string;
}
export interface Finding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  claim: string;
  proof_refs: string[];
}
export interface JudgeResult {
  target_identity: string;
  target_revision: string;
  agent_id: string;
  inspected_scope: string[];
  evidence_refs: string[];
  findings: Finding[];
}
export type Verdict = 'reviewed_no_findings' | 'findings_confirmed' | 'escalate';
export interface ReviewResult {
  schema: 'judgment-day-result/v1';
  target: Target;
  verdict: Verdict;
  judges: JudgeResult[];
  confirmed: Finding[];
  disputed: Finding[];
  correction: 'manual_revision' | 'explicit_scoped_fix_possible' | 'none';
}

const skillDir = resolve(import.meta.dir, '..');
const fail = (reason: string): never => { throw new Error(`judgment_day_invalid: ${reason}`); };
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const stringList = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(nonempty) && new Set(v).size === v.length;
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every(item => b.includes(item));

/** No fallback to the core resolver, registry or a replacement skill. */
export function loadStandaloneContract(directory = skillDir): { target: { required: string[]; kinds: string[] }; judges: { minimum: number; max_rounds: number } } {
  if (!existsSync(resolve(directory, 'SKILL.md')) || !existsSync(resolve(directory, 'modules/judgment-day/module.md'))
    || !existsSync(resolve(directory, 'workflow-extension.json'))) fail('skill missing');
  let contract: any;
  try { contract = JSON.parse(readFileSync(resolve(directory, 'workflow-extension.json'), 'utf8')); }
  catch { fail('skill contract unreadable'); }
  if (contract.schema !== 'task-flow-extension/v1' || contract.id !== 'judgment-day'
    || contract.target?.phase !== 'any' || contract.target?.immutable !== true
    || !stringList(contract.target?.required) || !stringList(contract.target?.kinds)
    || !['identity', 'revision', 'kind', 'scope', 'criteria', 'evidence_refs', 'snapshot'].every(k => contract.target.required.includes(k))
    || !Number.isInteger(contract.judges?.minimum) || contract.judges.minimum < 2
    || !Number.isInteger(contract.judges?.max_rounds) || contract.judges.max_rounds < 1
    || contract.judges.independent !== true || contract.judges.same_target_and_scope !== true
    || contract.judges.explicit_evidence !== true) fail('skill contract inconsistent');
  return contract;
}

export function validateTarget(input: unknown, contract = loadStandaloneContract()): Target {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('target missing');
  const target = input as Record<string, unknown>;
  if (!nonempty(target.identity) || !nonempty(target.snapshot)
    || target.revision !== `sha256:${createHash('sha256').update(target.snapshot).digest('hex')}`
    || !contract.target.kinds.includes(target.kind as string)
    || !stringList(target.scope) || !stringList(target.criteria) || !stringList(target.evidence_refs)) fail('target incomplete');
  if (Object.keys(target).some(key => !contract.target.required.includes(key))) fail('target has unknown fields');
  return structuredClone(target) as unknown as Target;
}

function validateJudge(raw: unknown, target: Target, id: string): JudgeResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(`judge ${id} response missing`);
  const result = raw as JudgeResult;
  if (Object.keys(result).some(key => !['target_identity', 'target_revision', 'agent_id', 'inspected_scope', 'evidence_refs', 'findings'].includes(key))) fail(`judge ${id} unknown claim`);
  if (result.agent_id !== id || result.target_identity !== target.identity || result.target_revision !== target.revision
    || !Array.isArray(result.inspected_scope) || !sameSet(result.inspected_scope, target.scope)
    || !stringList(result.evidence_refs) || !result.evidence_refs.every(ref => target.evidence_refs.includes(ref))
    || !Array.isArray(result.findings)) fail(`judge ${id} target/scope/evidence mismatch`);
  for (const finding of result.findings) {
    if (!finding || typeof finding !== 'object' || Object.keys(finding).some(key => !['id', 'severity', 'location', 'claim', 'proof_refs'].includes(key))
      || !nonempty(finding.id) || !nonempty(finding.claim) || !target.scope.includes(finding.location)
      || !['low', 'medium', 'high', 'critical'].includes(finding.severity)
      || !stringList(finding.proof_refs) || !finding.proof_refs.every(ref => result.evidence_refs.includes(ref))) fail(`judge ${id} finding invalid`);
  }
  if (new Set(result.findings.map(f => f.id)).size !== result.findings.length) fail(`judge ${id} duplicate finding`);
  return result;
}

/** Caller supplies two or more independent agent launches; all receive the same frozen target. */
export async function reviewStandalone(input: unknown, launch: (id: string, frozen: Readonly<Target>) => Promise<unknown>,
  options: { directory?: string; judgeIds?: string[] } = {}): Promise<ReviewResult> {
  const contract = loadStandaloneContract(options.directory);
  const target = validateTarget(input, contract);
  const judgeIds = options.judgeIds ?? ['judge-1', 'judge-2'];
  if (judgeIds.length < contract.judges.minimum || new Set(judgeIds).size !== judgeIds.length || !judgeIds.every(nonempty)) fail('independent judges missing');
  const frozen = Object.freeze({ ...target, scope: Object.freeze(target.scope), criteria: Object.freeze(target.criteria), evidence_refs: Object.freeze(target.evidence_refs) }) as Readonly<Target>;
  // Promise.all launches independent agents before reading any result; errors block the entire review.
  const raw = await Promise.all(judgeIds.map(id => launch(id, frozen)));
  const judges = raw.map((result, i) => validateJudge(result, target, judgeIds[i]));
  const groups = new Map<string, { finding: Finding; ids: Set<string> }>();
  for (const judge of judges) for (const finding of judge.findings) {
    const key = JSON.stringify([finding.id, finding.location, finding.severity, finding.claim]);
    const group = groups.get(key) ?? { finding, ids: new Set<string>() };
    group.ids.add(judge.agent_id);
    groups.set(key, group);
  }
  const confirmed = [...groups.values()].filter(g => g.ids.size === judges.length).map(g => g.finding);
  const disputed = [...groups.values()].filter(g => g.ids.size !== judges.length).map(g => g.finding);
  const verdict: Verdict = disputed.length ? 'escalate' : confirmed.length ? 'findings_confirmed' : 'reviewed_no_findings';
  return { schema: 'judgment-day-result/v1', target, verdict, judges, confirmed, disputed,
    correction: verdict === 'escalate' || !confirmed.some(f => f.severity === 'high' || f.severity === 'critical') ? 'none'
      : ['research', 'proposal', 'other'].includes(target.kind) ? 'manual_revision' : 'explicit_scoped_fix_possible' };
}

function runAgent(id: string, target: Readonly<Target>): Promise<unknown> {
  return new Promise((done, reject) => {
    const prompt = `Load ${resolve(skillDir, 'SKILL.md')} and ${resolve(skillDir, 'modules/judgment-day/module.md')}. You are ${id}. Inspect only this frozen target and return exactly one JSON JudgeResult object, no prose: ${JSON.stringify(target)}`;
    const child = spawn('opencode', ['run', '--agent', 'judgment-day-judge', prompt], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    const timeout = setTimeout(() => child.kill(), 120_000);
    child.stdout.on('data', chunk => stdout += chunk);
    child.stderr.on('data', chunk => stderr += chunk);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error(`judge ${id} failed: ${stderr || code}`));
      try { done(JSON.parse(stdout.trim())); } catch { reject(new Error(`judge ${id} returned non-JSON evidence`)); }
    });
  });
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const targetPath = args[0];
  const outFlag = args.indexOf('--out');
  try {
    if (!targetPath || (outFlag !== -1 && !args[outFlag + 1])) fail('usage: bun scripts/judgment-day.ts <target.json> [--out <result.json>]');
    const result = await reviewStandalone(JSON.parse(readFileSync(resolve(targetPath), 'utf8')), runAgent);
    const output = JSON.stringify(result, null, 2) + '\n';
    if (outFlag !== -1) {
      const destination = args[outFlag + 1];
      if (!isAbsolute(destination) && destination.split(/[\\/]/).includes('..')) fail('invalid output path');
      writeFileSync(resolve(destination), output, { flag: 'wx' });
    }
    process.stdout.write(output);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
