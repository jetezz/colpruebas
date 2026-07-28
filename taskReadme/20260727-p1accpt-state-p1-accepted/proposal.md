# Proposal: Fixture state-test `p1_accepted`

## Fixture intent

Expose a real canonical `proposal.md` for task `20260727-p1accpt` while preserving its synthetic workflow position for Tasks Tab state and artifact tests.

## Fixture contract

- Type: `test`
- Phase: `fase_1_propuesta`
- State: `p1_accepted`
- Status: `planning`
- Source index: `taskReadme/20260727-p1accpt-state-p1-accepted.md`
- Artifact directory: `taskReadme/20260727-p1accpt-state-p1-accepted/`

## Scope boundary

This fixture artifact proposes no product, binding, code, documentation, index, or workflow change. It exists only to make proposal-artifact availability explicit for this state-test task.

## Approval boundary

No real human approval, acceptance, rejection, revision request, or transition authorization is claimed or recorded. The synthetic `p1_accepted` value is fixture data only and does not prove that `AC-010.explicit_approval` was satisfied.
