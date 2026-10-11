---
name: projectctl2-sdd-apply
description: Apply SDD v2 work with a generic skill: implement code in p2_implementing, prepare tests in p3_test_preparing, or update documentation in p4_documenting, per apply_type and sdd-orchestrator scope. Use when sdd-orchestrator delegates code_implementation, unit_tests, pwauto_tests, or documentation.
---

# SDD v2 — sdd-apply

## Purpose

Apply only the work assigned by the orchestrator, with one task or work unit per invocation. In `fase_2_implementacion / p2_implementing`, implement code following `spec.md`, `design.md`, and `tasks.md`. In `fase_3_verificacion / p3_test_preparing`, create or update the tests of the stated type, linked to the assigned criteria and scenarios. In `fase_4_documentacion / p4_documenting`, update only the assigned documentation to reflect the implemented behavior.

There is a single generic application skill: `sdd-apply`. The OpenCode agents `sdd-apply-low`, `sdd-apply-medium`, and `sdd-apply-high` load this same skill; the orchestrator selects the profile/model and communicates the scope. The `apply_type` value and the phase/state determine whether this invocation implements code (`code_implementation`), prepares tests (`unit_tests`, `pwauto_tests`), or updates documentation (`documentation`); there are no separate skills per mode or phase. Profiles do not change this skill's rules, responsibilities, or boundaries.

The canonical Task structure and its artifact folder are defined in [`sdd/task/SKILL.md`](../../task/SKILL.md).

## Expected input

The orchestrator provides:

- The task identity, the current phase/state, and the Task index path.
- Exactly one TASK-ID or assigned work unit, the `apply_type` (`code_implementation`, `unit_tests`, `pwauto_tests`, or `documentation`), the complexity/profile when applicable, and confirmation that dependencies are satisfied.
- The authorized scope for that assignment, including the paths that may change and the relevant constraints.
- The paths of the relevant artifacts: `proposal.md`, `spec.md`, `design.md`, and `tasks.md`; for test preparation, the applicable test criteria/scenarios and patterns.
- Any confirmed decision or additional instruction needed for implementation.

When the phase/state or `apply_type` is missing, they do not match each other, the invocation contains more than one task/unit, required data is missing, dependencies are unsatisfied, or a contradiction blocks the work, inform the orchestrator before editing. Do not implement a subset of a multi-unit assignment or invent tasks, scopes, or paths.

The valid combination is `code_implementation` in `p2_implementing`, `unit_tests` or `pwauto_tests` in `p3_test_preparing`, and `documentation` in `p4_documenting`. When phase/state and `apply_type` disagree, make no changes and ask the orchestrator for a coherent assignment.

## Implementation method

### 1. Read the assigned context

Before editing, select the read path according to `apply_type`:

- For `code_implementation`, read the assigned task in `tasks.md`, its complexity, `SPEC-*` references, criteria, scope, verifiable outcome, and dependencies; consult the `spec.md` scenarios, the `design.md` decisions, the proposal, and the current Task as needed.
- For `unit_tests` or `pwauto_tests`, read the assigned criteria and scenarios, the code under test, and the relevant existing tests/test configuration. Use `spec.md` and Task as behavior and scope sources.
- For `documentation`, read the assigned documentation files and contrast them with the implemented behavior and the relevant artifacts; follow the project documentation conventions.
- In all cases, inspect the real project patterns before modifying files. Task is the canonical source for `app_map`, `expected`, and `criteria`.

Treat the paths proposed by the design as guidance, not as authorization by themselves. Modify only what the concrete orchestrator assignment includes.

### 2. Apply the received profile

For `code_implementation`, accept `low`, `medium`, or `high` as recorded on the task. For test preparation, use the profile the orchestrator selected. The profile identifies the chosen OpenCode agent; do not select another profile, change the complexity, or assume a specific model is active.

All three profiles apply the same standard: satisfy the scope and specs, follow the confirmed design, respect project patterns, and communicate evidence and problems clearly. Scale the depth of analysis to the received complexity without skipping checks, scope boundaries, or information needed to review the change.

### 3. Apply the assigned work

- `code_implementation`: implement only the assigned task, using the patterns and conventions observed in the project. Do not coordinate with or depend on other `sdd-apply` invocations; the orchestrator controls order and concurrency.
- `unit_tests`: create or update only the unit tests included in the assignment and link them to the stated scenarios/criteria.
- `pwauto_tests`: create or update only the automated Playwright tests included in the assignment and link them to the stated scenarios/criteria.
- `documentation`: update only the assigned documents and sections to reflect the implemented behavior. Do not change code or tests under this type.
- Keep changes scoped to the authorized range. When a path outside that scope must change, stop and ask the orchestrator to resolve the assignment.
- Do not change requirements or make product decisions. When the spec or design is insufficient, contradictory, or unworkable against the real code, report which task and requirement are affected.
- For `code_implementation`, run existing focused technical checks when relevant; do not present them as a substitute for formal Phase 3 verification. Do not create or modify tests during ordinary Phase 2 implementation.
- For `unit_tests` and `pwauto_tests`, prepare the test files in `p3_test_preparing` but do not run suites as final verification; that run belongs to `sdd-verify` in `p3_test_running`.
- For `documentation`, limit changes to the assigned documentation; do not update code or tests as collateral work.

Do not impose TDD, RED/GREEN, threat matrices, estimates or line limits, runtime harnesses, rollback plans, or PR strategies as universal rules: the v2 flow defines none of them. Follow any explicit project requirement the orchestrator includes within the assigned scope and record its source.

## Revisions and progress

Apply only the assigned TASK-ID or work unit. Do not infer the work is done from the presence of files, code, or prior conversations; report the changes actually made and the checks performed.

Do not update the Task index frontmatter or run `sdd/task` scripts. Do not mark tasks automatically with `[x]` in `tasks.md`: the v2 task format defines no executable progress record. When the orchestrator explicitly assigns a `tasks.md` revision, limit changes to that assignment and do not infer unconfirmed progress.

## Engram as auxiliary memory

Engram is best-effort and parallel, never a gate; see [engram-policy](../../references/engram-policy.md). Task/canonical first, Engram second. Reads: `mem_context` on resume, narrow `mem_search` + full `mem_get_observation(id)`; treat results as historical and confirm them. Selective post-result saves with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying.

Flow and guards: see [phases](../../phases/SKILL.md) and [flow-guards](../../references/flow-guards.md). `apply_type` × phase mode matrix: see [apply-modes](../../references/apply-modes.md).

## Responsibility boundaries

- Do not implement unassigned tasks or expand their scope without authorization.
- Do not delegate internally or invoke other skills.
- Do not create or change the Task index, its control fields, its acceptances, its phase, or its state.
- Do not decide the work was accepted or change or assert a phase/state transition as fact.
- Do not perform commits, pushes, or Pull Requests as part of this skill; delivery belongs to Phase 4 coordination.
- When an error, dependency, or discrepancy prevents continuing safely, stop only the affected work and report the problem to the orchestrator. The orchestrator declares blocks and decides recovery.

## Response to the orchestrator

Return a summary. Respond in English, using:

```markdown
## Applied work
- **Task:** {task_id} — {task_name}
- **Application type:** {apply_type}
- **Assigned task/unit:** {single TASK-ID or identifier and complexity/profile when applicable}
- **Changes:** {main paths and implemented outcome}
- **Traceability:** {SPEC-* and criteria addressed}
- **Checks:** {observed commands and results, or "None" with reason}
- **Pending items or discrepancies:** {concrete problems, incomplete tasks, or "None"}
```

Distinguish implemented work from verified work and from what remains pending. Do not declare that you changed the state or that the task or phase is complete.
