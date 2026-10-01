import { afterAll, expect, test } from 'bun:test';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { reviewStandalone, validateTarget, loadStandaloneContract, type JudgeResult, type Target } from '../judgment-day.ts';

const source = resolve(import.meta.dir, '../..');
const standalone = mkdtempSync(resolve(import.meta.dir, 'isolated-'));
mkdirSync(resolve(standalone, 'modules/judgment-day'), { recursive: true });
for (const file of ['SKILL.md', 'workflow-extension.json', 'modules/judgment-day/module.md'])
  copyFileSync(resolve(source, file), resolve(standalone, file));
afterAll(() => rmSync(standalone, { recursive: true, force: true }));

const snapshot = 'Complete research subject: claim A cites primary source evidence-1.';
const target: Target = { identity: 'research-question-7', revision: `sha256:${createHash('sha256').update(snapshot).digest('hex')}`, kind: 'research',
  scope: ['notes/research.md'], criteria: ['Cite primary evidence'], evidence_refs: ['evidence-1'], snapshot };
const reply = (id: string, t: Readonly<Target>, findings: JudgeResult['findings'] = []): JudgeResult => ({
  agent_id: id, target_identity: t.identity, target_revision: t.revision,
  inspected_scope: [...t.scope], evidence_refs: [...t.evidence_refs], findings,
});

test('autonomous review runs with only satellite files: parallel blind judges, no SDD inputs or approval', async () => {
  expect(loadStandaloneContract(standalone).judges.minimum).toBe(2);
  const launched: string[] = [];
  const result = await reviewStandalone(target, async (id, frozen) => {
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.scope)).toBe(true);
    launched.push(id);
    await Promise.resolve();
    expect(launched).toEqual(['judge-1', 'judge-2']); // both launched before either answer
    return reply(id, frozen);
  }, { directory: standalone });
  expect(result.verdict).toBe('reviewed_no_findings');
  expect(result).not.toHaveProperty('approved');
  expect(result.judges.map(j => j.agent_id)).toEqual(['judge-1', 'judge-2']);
});

test('no target or missing/inconsistent skill blocks before launching any agent', async () => {
  let calls = 0;
  const launch = async () => { calls++; return {}; };
  await expect(reviewStandalone(undefined, launch, { directory: standalone })).rejects.toThrow('target missing');
  await expect(reviewStandalone(target, launch, { directory: resolve(standalone, 'missing') })).rejects.toThrow('skill missing');
  expect(() => validateTarget({ ...target, scope: [] }, loadStandaloneContract(standalone))).toThrow('target incomplete');
  expect(() => validateTarget({ ...target, snapshot: 'changed without revision' }, loadStandaloneContract(standalone))).toThrow('target incomplete');
  expect(calls).toBe(0);
});

test('disagreements escalate; research findings never authorize automatic worktree fix', async () => {
  const finding = { id: 'F-1', severity: 'high' as const, location: 'notes/research.md', claim: 'Missing primary citation', proof_refs: ['evidence-1'] };
  const confirmed = await reviewStandalone(target, async (id, t) => reply(id, t, [finding]), { directory: standalone });
  expect(confirmed.verdict).toBe('findings_confirmed');
  expect(confirmed.correction).toBe('manual_revision');
  const disputed = await reviewStandalone(target, async (id, t) => reply(id, t, id === 'judge-1' ? [finding] : []), { directory: standalone });
  expect(disputed.verdict).toBe('escalate');
  expect(disputed.confirmed).toEqual([]);
  expect(disputed.correction).toBe('none');
  const code = await reviewStandalone({ ...target, kind: 'code' }, async (id, t) => reply(id, t, [finding]), { directory: standalone });
  expect(code.correction).toBe('explicit_scoped_fix_possible');
});

test('mismatched revision, scope or evidence never produces a verdict', async () => {
  await expect(reviewStandalone(target, async (id, t) => ({ ...reply(id, t), target_revision: 'other' }), { directory: standalone })).rejects.toThrow('mismatch');
  await expect(reviewStandalone(target, async (id, t) => ({ ...reply(id, t), inspected_scope: [] }), { directory: standalone })).rejects.toThrow('mismatch');
  await expect(reviewStandalone(target, async (id, t) => reply(id, t, [{ id: 'F', severity: 'high', location: t.scope[0], claim: 'bad', proof_refs: ['not-provided'] }]), { directory: standalone })).rejects.toThrow('finding invalid');
  await expect(reviewStandalone(target, async (id, t) => ({ ...reply(id, t), approved: true }), { directory: standalone })).rejects.toThrow('unknown claim');
});
