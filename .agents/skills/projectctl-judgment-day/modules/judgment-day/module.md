---
name: judgment-day
description: "Portable shape for the optional Judgment Day review mechanism; operational actors, rounds and persistence are resolved by the repo-local satellite."
license: MIT
metadata:
  id: judgment-day
  version: 2.0.0
  contract_ref: judgment-day-result/v1
---

## Purpose

Judgment Day is an optional review mechanism selected explicitly for an immutable target. A target may be code, research, implementation, proposal, documentation or another declared artifact; its phase does not determine eligibility. For a code target already assigned a reviewer, the selected mechanism replaces that reviewer for the same target and revision.

## Portable contract

- Standalone launches resolve this satellite directly; SDD may optionally select it through its workflow context. Neither path may silently fall back to another mechanism.
- Missing, inconsistent or unavailable resolution MUST fail closed and preserve the active position; it MUST NOT silently fall back to normal review.
- Target kinds, judge count and round budget are owned by this satellite's `workflow-extension.json`; the standalone launcher uses only that file and the local skill/module files.
- The operator (`sdd-orchestrator` in SDD) may launch multiple independent judges only with an explicit shared target identity, bounded scope, criteria and evidence references. Missing inputs block before launch; results never authorize a scope expansion.

## Judge Prompt

The caller supplies `{identity, revision, kind, scope, criteria, evidence_refs, snapshot}`; `snapshot` contains the complete review subject and `revision` MUST be its SHA-256 (`sha256:<64 hex>`). The launcher validates and freezes it before launch. Each of at least two independent judges receives exactly the same immutable snapshot and a distinct agent identity. No judge reads the other judge's result. A judge returns exactly one JSON object `{target_identity, target_revision, agent_id, inspected_scope, evidence_refs, findings}`. Each finding contains `id`, `severity`, `location`, `claim` and `proof_refs`. Empty findings require evidence of complete inspection. A missing scope item, changed revision, uninspected scope or unsupported claim blocks the round; no verdict is inferred.

The launcher waits for all judges, cross-checks target identity and revision, scope and proof references against the frozen target, and emits `judgment-day-result/v1`. Only identically corroborated findings are confirmed; differences escalate. `reviewed_no_findings` is a review observation, never acceptance. Standalone results are written only when an explicit `--out` destination is provided; SDD may persist them through `sdd-orchestrator`. A changed target requires a new revision and fresh round; exhaustion escalates.

## Fix Actor Prompt

The standalone launcher never starts a fix actor. Research/proposal findings require an explicit revised artifact and a fresh review, never automatic worktree edits. For code/implementation/documentation an operator may separately authorize a bounded fix actor with confirmed severe IDs, authorized paths and rollback boundary. The operator (`sdd-orchestrator` in SDD) verifies its edits, increments target revision and launches fresh independent judges. A fix self-report is not approval.

## References

- `.agents/skills/projectctl-judgment-day/SKILL.md`
- `.agents/skills/projectctl-judgment-day/scripts/judgment-day.ts`
