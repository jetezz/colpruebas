// @ac AC-VIEWS-02 — core canonical identity contract documented in its App Map bundle.
import { describe, expect, it } from 'bun:test';
import { collectCriterionIds, criterionRevision, isCriterionId, isRetiredCriterion } from '../project/criterion-contract.ts';
import { collectCriterionIds as lintIds } from '../project/docs-lint-core.ts';
import { validateAcHeader, validateSpecTitleIds } from '../project/test-runner-contract.ts';
import { parseMarkerLine } from '../project/code-traceability-contract.ts';

describe('canonical identity across core consumers', () => {
  it('keeps simple, compound and suffix IDs byte-identical through headers, titles and markers', () => {
    for (const id of ['PCT-155', 'TST-40', 'AC-VIEWS-08', 'AC-IDX-01', 'PRJ-35', 'AC-123A', 'REQ-APP-001']) {
      expect(isCriterionId(id)).toBe(true);
      expect(collectCriterionIds(`// @ac ${id}`)).toEqual([id]);
      expect(validateAcHeader(`// @ac ${id}`).ids).toEqual([id]);
      expect(validateSpecTitleIds(`test('${id} behavior', () => {})`, [id]).ok).toBe(true);
      expect(parseMarkerLine(`// @criterion ${id}`, 1)?.criterionId).toBe(id);
    }
  });
  it('never translates legacy aliases or strips meaningful zero padding', () => {
    expect(lintIds('// @ac AC-035 PRJ-35', new Set(['AC', 'PRJ']))).toEqual(['AC-035', 'PRJ-35']);
    expect(collectCriterionIds('PCT-01 PCT-1')).toEqual(['PCT-01', 'PCT-1']);
    expect(isCriterionId('PCT-CAND-20260908-PCTMAP-A01')).toBe(false);
  });
  it('revises acceptance definitions, independently of run status and coverage', () => {
    const criterion = { id: 'PCT-155', title: 'Acceptance', type: 'tooling' };
    expect(criterionRevision({ ...criterion, coverage: { Unit: 'covered' }, functional: 'implemented' })).toBe(criterionRevision(criterion));
    expect(criterionRevision({ ...criterion, title: 'Changed acceptance' })).not.toBe(criterionRevision(criterion));
    expect(criterionRevision({ ...criterion, requirement: 'A precise observable result' })).not.toBe(criterionRevision(criterion));
    expect(isRetiredCriterion({ functional: 'not-applicable', exception_reason: 'criterion_retired' })).toBe(true);
    expect(isRetiredCriterion({ functional: 'not-applicable', exception_reason: 'capability_absent' })).toBe(false);
  });
});
