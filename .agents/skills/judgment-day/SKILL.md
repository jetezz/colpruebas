---
name: judgment-day
description: "Trigger: judgment-day, dual review, adversarial review. Opt-in code-review mechanism selected by `review_mode: judgment-day`. Runs a blind dual-judge review with at most two scoped fix/re-judgment rounds. Replaces sdd-verify-code for the reviewed target; never run both on the same target. Orchestrated by the coordinator."
license: MIT
metadata:
  version: 1.1.0
  categories:
    - sdd
---

## Purpose

Judgment Day is the **opt-in** code-review mechanism for the SDD `verify-code` step. It runs only when `WorkflowRuntimeContextV1.mode_context.review.selected` selects it and its logical id/path is resolved there. It NEVER runs together with the normal reviewer on the same target.

It exists to raise review ROI on high-value changes: instead of one reviewer, **two blind read-only judges** review an immutable target in parallel, and only findings **confirmed by both judges** are fixed, within **at most two scoped fix/re-judgment rounds**. The terminal verdict is only `approved` or `escalated`.

## Orchestrator Contract

The **coordinator** is the parent orchestrator. It loads this skill inline (it does not delegate Judgment Day to a separate wrapper subagent). The coordinator:

- Builds one complete immutable target (the exact changed files/paths under review, resolved from `WorkflowRuntimeContextV1.artifact_context` and the assigned work units).
- Resolves matching surface skills once and passes the same `SKILL.md` paths to both judges and the fix actor.
- Launches the two blind judges (`judgment-day-judge` subagent) in parallel with identical scope and criteria.
- Merges/persists findings into the frozen ledger inside the `verify-code` phase artifact.
- Launches the bounded fix actor (`judgment-day-fix` subagent) only for confirmed severe findings, after asking for approval on round one.
- Launches scoped re-judgment and updates the round counter.
- The judges and the fix actor are ephemeral subagents; they never orchestrate.

## Hard Rules

- Build one complete immutable target, then launch two blind read-only judges in parallel with identical scope and criteria.
- Each judge returns one neutral findings result (JSON) and terminates. Wait for BOTH; never accept a partial judgment.
- Two-judge agreement is the corroboration mechanism. Never launch a separate "refuter".
- Fix ONLY severe findings (`CRITICAL`/`HIGH`) confirmed by BOTH judges. WARNING/SUGGESTION rows remain `info`.
- Permit at most **two** fix rounds and **two** scoped re-judgments. Re-judgment sees ONLY the frozen ledger plus the immutable fix delta, and may record fix-caused defects.
- Terminal transaction states are ONLY `approved | escalated`; never reset or extend an exhausted lineage.
- The reviewed target is immutable during a round: no judge edits, delegates, refutes, or inspects unrelated scope.
- Only the coordinator merges/persists findings, launches the fix actor and re-judgment, and writes the verdict into the index.

## Decision Gates

| Condition | Action |
|---|---|
| Target unclear | Ask one scope question and stop. |
| Both judges confirm a severe finding | Ask before round-one correction; then use the bounded fix actor. |
| Only one judge reports it | Record as `suspect`; do NOT auto-fix. |
| Judges contradict each other | Escalate for explicit human decision. |
| Scoped re-judgment fails before round two | Coordinator may launch the final bounded fix round. |
| Any severe issue remains after round two | Escalate and stop. |

## Execution Steps

1. **Start**: record a Judgment Day transaction in the `verify-code` phase artifact (`target_identity`, `mode: judgment_day`, `round: 1`) and persist it.
2. **Dual judgment**: launch both `judgment-day-judge` subagents (A and B) against the same immutable target with identical criteria and injected skill paths.
3. **Merge**: wait for both JSON results; merge findings into the frozen ledger inside the `verify-code` phase artifact. Classify each finding as `confirmed` (both judges), `suspect` (one judge), or `contradiction`.
4. **Fix (round 1)**: ask before round-one correction; run the `judgment-day-fix` actor only for confirmed severe IDs.
5. **Scoped re-judgment**: run both judges again over ONLY the frozen ledger plus the immutable fix delta.
6. **Round 2 at most**: repeat the fix + scoped re-judgment once at most, then emit the terminal verdict.

## Persistence Contract

- The frozen ledger, transaction, round counter, and verdict live as the `## Judgment Day` section inside the resolved `verify-code` phase artifact (`WorkflowRuntimeContextV1.artifact_context.phase_artifacts.path_pattern`, artifact key `verify-code`).
- The coordinator is the single writer of the index; it consolidates the verdict into the index work-unit / verification tables. Judges and the fix actor never write the index.
- Optional support-tool output is not review evidence or a source of truth.

## Gate Mapping

- Terminal `approved` satisfies the existing `code_review_passed` gate (equivalent to `sdd-verify-code` returning `passed`); the flow proceeds exactly as with the default reviewer.
- Terminal `escalated` is treated as a review block: the coordinator records it and preserves the interrupted `phase`/`state` (equivalent to `code_review_failed` routing), awaiting explicit human decision.

## Output Contract

Return: target identity, current round, confirmed/suspect/contradiction/INFO counts, correction work units, scoped re-judgment result, artifact references (`verify-code` phase artifact), skill resolution, and exactly one final line `JUDGMENT: APPROVED ✅` or `JUDGMENT: ESCALATED ⚠️`.

## Judge Prompt (used by the coordinator when launching each judge)

```markdown
You are blind Judge {A|B} in explicit Judgment Day mode.

Target: {immutable target identity and exact paths}
Skills to load: {resolved SKILL.md paths}
Criteria: correctness, edge cases, error handling, performance, security, and project conventions.

Run one exhaustive read-only sweep. Do not edit, delegate, refute, or inspect unrelated scope. If scoped re-judging, read ONLY the frozen ledger and immutable fix delta; record any fix-caused defect with proof.

Return one JSON object and no prose, using exactly this shape:

{"findings":[{"location":"path:line","severity":"CRITICAL","claim":"observable incorrect behavior","evidence_class":"deterministic","causal_disposition":"introduced","proof_refs":["concrete proof"]}],"evidence":["what was inspected"]}

The only allowed top-level fields are `findings` and `evidence`; the only allowed finding fields are `location`, `severity`, `claim`, `evidence_class`, `causal_disposition`, and `proof_refs`. Never emit `summary` or any other unknown field. Return `{"findings":[],"evidence":["what was inspected"]}` when clean, then terminate.
```

## Fix Actor Prompt (used by the coordinator when launching the fix actor)

```markdown
You are the bounded Judgment Day fix actor.

Confirmed severe ledger IDs: {table}
Skills to load: {resolved SKILL.md paths}

Apply only confirmed fixes as atomic work units. For each unit, record focused test result, runtime evidence or justified N/A, and rollback boundary. Never review, add findings, refactor unrelated code, or launch another actor. Mark addressed IDs fixed and return control to the coordinator for scoped re-judgment.

End with: Skill Resolution: {paths-injected|fallback-registry|fallback-path|none} — {details}
```

## Rules

- Judgment Day is opt-in via `mode_context.review.selected`; the coordinator uses the context's selected normal reviewer otherwise.
- Never run Judgment Day and `sdd-verify-code` on the same target.
- Never exceed two fix rounds / two scoped re-judgments.
- Never let a judge or the fix actor orchestrate, or write the index.
- Never address a retired alias — see `.agents/skills/sd-protocol/sdd-phase-common.md` §F.3.
