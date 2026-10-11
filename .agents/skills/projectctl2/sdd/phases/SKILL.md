---
name: projectctl2-sdd-phases
description: Define the SDD v2 phases, states, and the objective of each state. Load when interpreting or updating a task's phase/state.
---

# SDD v2 — phases and states

This document defines the SDD v2 phases, the objective of each state, and the allowed flow between them. It assigns no executor skills. The identifiers and their phase/state relations must match the canonical Zod contracts [`PhaseDefinitionSchema`](../../types/contracts/phase-definition.ts) and [`StateDefinitionSchema`](../../types/contracts/state-definition.ts); the `PhaseDefinition` and `StateDefinition` types are inferred in those same modules and their JSON Schemas are generated under `types/generated/`.

This file is the source of the *what* (graph, objectives, and human acceptances). The *mechanical how* (what each setter checks, the `phase`/`state` tuple, delivery) lives in its canonical sources linked below.

## Phase 1 — `fase_1_propuesta`

- **`p1_started`**: initialize the task using the Task initialization script.
- **`p1_exploring`**: understand the problem and explore both the code and external sources —including Context7 and Internet searches— to define a complete and precise proposal.
- **`p1_awaiting_acceptance`**: wait for the proposal to be accepted. Once accepted, record `proposal_state: approve` on the task.

## Phase 2 — `fase_2_implementacion`

- **`p2_planning`**: split the task into specs and tasks, and state the complexity level of each part.
- **`p2_implementing`**: complete each spec and task at the intelligence level set for that part.
- **`p2_code_review`**: check that the implementation matches what was agreed and detect issues to fix.
- **`p2_awaiting_acceptance`**: wait for functional validation. Once accepted, record `functional_state: approve` on the task.

## Phase 3 — `fase_3_verificacion`

- **`p3_test_preparing`**: create the tests needed to verify the change.
- **`p3_test_running`**: run the tests and collect their results.
- **`p3_requirements`**: pass the requirements F3 gate with req-fixer when `requirements_fix==true`; with `false` skip it (skip) and follow the legacy flow.

## Phase 4 — `fase_4_documentacion`

- **`p4_documenting`**: update the documentation needed to reflect the change.
- **`p4_requirements_docs`**: pass the requirements F4 gate (docs + test re-check) with req-fixer when `requirements_fix==true`; with `false` skip it (skip).
- **`p4_done`**: close the orchestrator work per [delivery](../references/delivery.md).

## Acceptance record

The waiting states represent that a human decision is needed. Record acceptance in the matching task field: `proposal_state: approve` for the proposal and `functional_state: approve` for functional validation. The state alone neither records nor replaces those values.

## Allowed transitions

The orchestrator follows this flow and never infers jumps from a state name, the isolated success of a skill, or the text of an artifact.

### Proposal — Phase 1

```text
p1_started -> p1_exploring -> p1_awaiting_acceptance
                                   | acceptance: proposal_state=approve
                                   v
                          Phase 2 / p2_planning
```

- After initialization completes, move from `p1_started` to `p1_exploring`.
- Move to `p1_awaiting_acceptance` when the proposal is ready and the data required to continue is defined.
- Advance to `fase_2_implementacion / p2_planning` only from `p1_awaiting_acceptance`, after the user accepts and the orchestrator records `proposal_state: approve`.
- Before advancing to Phase 2, `app_map`, `expected`, `criteria`, and `branch` must have content. Mechanical validations: see [flow-guards](../references/flow-guards.md).
- If the proposal is rejected, return to `p1_exploring` and revise it per the guidance received; do not advance to Phase 2.

### Implementation — Phase 2

```text
p2_planning -> p2_implementing -> p2_code_review
                        ^                | pass
                        | errors         v
                        +--------- p2_awaiting_acceptance
                                            | acceptance: functional_state=approve
                                            v
                                   Phase 3 / p3_test_preparing
```

- Move from `p2_planning` to `p2_implementing` when the specs and tasks are ready, including the complexity level of each task.
- Move from `p2_implementing` to `p2_code_review` when the planned implementation work is done.
- Review verdict per [verify-modes](../references/verify-modes.md): pass continues to `p2_awaiting_acceptance`; errors return to `p2_implementing` with findings and repeat review.
- Move to `fase_3_verificacion / p3_test_preparing` only from `p2_awaiting_acceptance`, after the user validates the functionality and the orchestrator records `functional_state: approve`.
- If the user rejects the functionality, return to `p2_implementing` with their guidance; do not advance to Phase 3.

### Verification — Phase 3

```text
p3_test_preparing -> p3_test_running (all applicable tests pass)
                            |
                            +-- requirements_fix==false --> Phase 4 / p4_documenting (skip p3_requirements)
                            |
                            +-- requirements_fix==true --> p3_requirements --> green report --> Phase 4 / p4_documenting
                                                                           --> blocked report --> SDD block
```

- Move from `p3_test_preparing` to `p3_test_running` when the applicable tests are ready.
- Entry to `p3_requirements`: only when `requirements_fix==true` and all applicable `p3_test_running` tests are green. With `requirements_fix==false` (default) skip this state: direct exit `p3_test_running → fase_4_documentacion / p4_documenting`, identical to the legacy graph.
- Exits from `p3_requirements`: req-fixer report `status: green` in scope (`Task.app_map`) allows advancing to `fase_4_documentacion / p4_documenting`; a `blocked` report declares an SDD block.
- F3 gate (`only=criterios,estructura,code,test`; FORBIDDEN to touch `docs/app-map/**` in F3): green = criteria/structure/paths/code exit 0 + `validate-tests.ts` exit 0 OR exit 1 with the SINGLE issue `docs prerequisite` (record `test: deferred-docs`, neither pass nor fail). Fix any other test issue in F3. Scope: `Task.app_map` (empty = whole project; otherwise `--view/--feature` where the script supports it; `validate-structure/check-paths` always global: filter their JSON to the scope, out-of-scope issues = observation). One req-fixer delegation per state; 5-iteration budget internal to the fixer; the orchestrator does not re-delegate after `blocked`. If the fixer modified `navigation.yaml`/slugs/IDs, ONLY the orchestrator reconciles `Task.criteria/app_map` via `update-task.ts` (direction navigation→Task). Delegation detail: see [delegation-matrix](../references/delegation-matrix.md).
- If any test fails or a required check cannot complete, the orchestrator records a block, stops execution, and waits for user guidance. Do not advance to Phase 4 or invent a repair route in another phase. A `blocked` report in `p3_requirements` = same SDD block (stop, wait for user; no routine question, no automatic fallback between phases, no advance).

### Documentation — Phase 4

```text
p4_documenting (documentation ready)
       |
       +-- requirements_fix==false --> delivery --> p4_done (skip p4_requirements_docs)
       |
       +-- requirements_fix==true --> p4_requirements_docs --> green report --> delivery --> p4_done
                                                              --> blocked report --> SDD block
```

- After completing the documentation, deliver per the canonical sequence: see [delivery](../references/delivery.md).
- Entry to `p4_requirements_docs`: only when `requirements_fix==true` and `p4_documenting` is complete. With `requirements_fix==false` skip it: direct exit `p4_documenting → delivery → p4_done`, identical to the legacy graph.
- Exits from `p4_requirements_docs`: req-fixer report `status: green` in scope allows delivery (commit→push→PR→register pr→`p4_done`); a `blocked` report declares an SDD block (stop, wait for user; no routine question, no automatic fallback between phases, no advance).
- F4 gate (`only=docs` + `test` re-check): green = `docs: pass + test: pass` in scope (`Task.app_map`; empty = whole project; otherwise `--view/--feature` where the script supports it). The docs preflight already passes; the deferred correspondence (`test: deferred-docs` from F3) resolves here. One req-fixer delegation per state; 5-iteration budget internal to the fixer (independent of F3); the orchestrator does not re-delegate after `blocked`. If the fixer modified `navigation.yaml`/slugs/IDs, ONLY the orchestrator reconciles `Task.criteria/app_map` via `update-task.ts` (direction navigation→Task).
- `p4_done` closes per [delivery](../references/delivery.md); see there for sequence, rules, and post-close effect.

## Applying phase/state changes

- Do not skip phases. The only advance between phases is Phase 1 → Phase 2 → Phase 3 → Phase 4. Internal transitions must match the state flow described above. With `requirements_fix==false` (default) the legacy graph applies without `p3_requirements` or `p4_requirements_docs` (`p3_test_running → Phase4/p4_documenting`; `p4_documenting → delivery → p4_done`).
- Do not roll back between phases automatically; if a defect appears that requires returning to an earlier phase, record the block and wait for user instructions. A req-fixer `blocked` report in `p3_requirements` or `p4_requirements_docs` neither rolls back nor advances: it blocks and waits for the user.
- For an internal state change or entry to another phase, decide the full destination tuple and respect the graph. Setter mechanics and tuple coherence: see [flow-guards](../references/flow-guards.md).

## Recovery after close/compaction (no-states)

- `close`, `compaction`, and `summary` are not SDD states or transitions. Recovery: 1) re-read the current `taskReadme` phase/state/branch (source of truth) + artifacts in `taskReadme/<id>-<slug>/`, 2) best-effort `mem_context` / `mem_session_summary` in parallel without blocking.
- Do not require memory to continue. Reuse the runtime session ID when present; never invent one; `workspace=cwd`. Engram contributes historical memory, not verdicts.
