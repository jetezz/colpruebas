---
name: projectctl2-sdd-verify
description: Run the SDD v2 verification the orchestrator requests: code review, unit tests, automated Playwright, or interactive UI validation. Use when sdd-orchestrator delegates code_review, unit_tests, pwauto, or pwcli.
---

# SDD v2 — sdd-verify

## Purpose

Perform a single verification activity assigned by `sdd-orchestrator`. This skill covers four verification types under one identity:

- `code_review`: review whether the implementation matches the proposal, specs, design, and tasks.
- `unit_tests`: run and analyze the stated or applicable unit tests.
- `pwauto`: run and analyze the assigned automated Playwright verification.
- `pwcli`: observe and validate the stated behavior interactively in a browser.

The orchestrator selects the verification type and delivers the matching context. Do not infer the type or run other types in the same invocation. The type determines the procedure, but the skill is always `sdd-verify`.

The skill reports evidence and results to the orchestrator. It does not change phases/states, does not accept functionality, and does not declare a phase complete on its own.

## Expected input

The orchestrator provides:

- SDD task identity and the phase/state from which verification is requested.
- `verification_type`: exactly one of `code_review`, `unit_tests`, `pwauto`, or `pwcli`.
- The concrete TASK-IDs, criteria, or scenarios this invocation must cover; the orchestrator defines the scope and may assign one or several related tasks.
- The Task index path and its current values; `Task.ui_url` is the mandatory target for the `pwauto` and `pwcli` types.
- Task criteria and the applicable `SPEC-*` IDs.
- Relevant paths for the proposal, spec, design, tasks, and code/changes.
- The concrete verification scope and, depending on the type, the commands, suite, or scenario to review.
- Available execution preconditions, such as a ready runtime/browser, when verification depends on them.

When the type is missing or invalid, or essential information for that verification is missing, inform the orchestrator without substituting the type or inventing commands, URLs, credentials, or results. For `pwauto` and `pwcli`, read `Task.ui_url` from the current index; do not use another target as a substitute.

## Common procedure

1. Read the exact assigned type and scope.
2. Read the relevant artifacts and criteria before concluding.
3. Distinguish direct observations, inferences, and unverified aspects.
4. Run only the read/verify actions belonging to the requested type.
5. Return the observed results, reproducible evidence, limitations, and problems to the orchestrator.

Do not create or modify code, tests, documentation, Task, or planning artifacts during verification. When you find a defect, describe it with location and effect; the orchestrator determines the fix or next step.

## Procedures by type

Detail per type: see [verify-modes](../../references/verify-modes.md).

- `code_review` (Phase 2): compare changes against proposal/specs/design/tasks; verdict `pass`, `findings`, or `inconclusive` per that reference; does not fix.
- `unit_tests` (Phase 3): run applicable tests and report command, outcome, and failures; does not write tests.
- `pwauto` (Phase 3): use `Task.ui_url` as the target; when missing or empty, report incomplete without substituting; run the assigned suite.
- `pwcli` (Phase 3): use `Task.ui_url` as the target to validate in a browser; without runtime/browser, report the limitation.

## Failed or incomplete results

- Do not hide errors, test failures, missing preconditions, or environment limitations.
- Do not turn a suite that could not run into a passing result.
- For Phase 3 `unit_tests`, `pwauto`, and `pwcli`, report whether the assigned check passed, failed, or could not complete. The orchestrator must confirm all applicable tests and checks ran green before moving to Phase 4. A failure or an incomplete required check blocks that move; per [`sdd/phases/SKILL.md`](../../phases/SKILL.md), the orchestrator records a block, stops execution, and waits for user guidance.
- When `pwauto` or `pwcli` cannot run for lack of `Task.ui_url`, report the missing requirement as an incomplete check. Do not edit Task to supply it; the orchestrator determines the resolution, and an incomplete required check blocks the move to Phase 4.
- Do not recommend advancing phase when results do not satisfy the `sdd/phases/SKILL.md` conditions.
- The orchestrator owns declaring blocks, coordinating fixes, and changing `phase` or `state`.

## Engram as auxiliary memory

Engram is best-effort and parallel, never a gate; see [engram-policy](../../references/engram-policy.md). Task/canonical first, Engram second. Reads: `mem_context` on resume, narrow `mem_search` + full `mem_get_observation(id)`; treat results as historical and confirm them. Selective post-result saves with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying. `mem_save`/passive is forbidden during `verify-all`.

Flow and guards: see [phases](../../phases/SKILL.md) and [flow-guards](../../references/flow-guards.md).

## Response to the orchestrator

Return a concise summary. Respond in English, using:

```markdown
## Verification: {verification_type}
- **SDD task:** {task_id} — {task_name}
- **Target tasks/criteria:** {assigned TASK-IDs, criteria, or scenarios}
- **Scope:** {verified criteria, SPEC-*, or scenario}
- **Actions:** {actually performed review, command/suite, or UI steps}
- **Result:** {explicit verdict and observed evidence}
- **Failures, limitations, or pending items:** {concrete detail or "None"}
```

Do not present running an isolated verification as functional acceptance or as a completed transition.
