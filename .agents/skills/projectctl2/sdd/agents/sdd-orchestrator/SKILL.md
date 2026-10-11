---
name: projectctl2-sdd-orchestrator
description: Coordinate projectctl2 SDD tasks, resolve their position, and run sdd/task commands. Load when coordinating a Task phase/state and delegating to SDD skills.
---

# SDD v2 — sdd-orchestrator

## Purpose

Coordinate SDD work from its canonical record: resolve the task position, organize the work for its phase and state, delegate to specialized skills, and consolidate progress. Act as the sole invoker of `sdd/task` commands and the sole writer of task control; specialized agents return results without changing `phase`, `state`, `proposal_state`, or `functional_state`.

Treat Engram as parallel best-effort, never as a gate; see [engram-policy](../../references/engram-policy.md). Read the canonical Task first, Engram second. On resume, read with `mem_context`; search narrowly with `mem_search` and read the full record with `mem_get_observation(id)`; treat results as historical and confirm them. Save selectively after results with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying.

## Task input and reading

1. Determine whether you start a new task or continue an existing one (`taskReadme/<task_id>-<task_slug>.md`); read its fields before deciding.
2. Validate the frontmatter against the Task contract when needed; if identification, reading, or validation data is missing, stop and report the missing input.
3. Interpret `phase` and `state` with [phases](../../phases/SKILL.md). Let the state objective guide; it alone does not prove completion. Do not assume a default route, phase, or state.

## Commands and guards

- For `sdd/task` command purpose and syntax, see [scripts manual](../../task/references/scripts-manual.md). Execute from the root against the identified index; do not substitute manual writes or claim unimplemented validations. On error, report it and do not launch dependent work.
- For advancement guards, the `phase`/`state` tuple, and setter semantics, see [flow-guards](../../references/flow-guards.md). Do not infer transitions from acceptances or skill completions.

## Minimum state → skill → agent matrix

For detail with results, see [delegation-matrix](../../references/delegation-matrix.md).

| State | Skill SDD | Agente |
|---|---|---|
| `p1_started` | Ninguna | Orquestador |
| `p1_exploring` | `sdd-explore`, `sdd-propose` | `sdd-explore`, `sdd-propose` |
| `p1_awaiting_acceptance` | None (human decision) | User |
| `p2_planning` | `sdd-spec`, `sdd-design`, `sdd-tasks` | `sdd-spec`, `sdd-design`, `sdd-tasks` |
| `p2_implementing` | `sdd-apply` | `sdd-apply-low`, `sdd-apply-medium`, `sdd-apply-high` |
| `p2_code_review` | `sdd-verify` (`code_review`) | `sdd-verify` |
| `p2_awaiting_acceptance` | None (human decision) | User |
| `p3_test_preparing` | `sdd-apply` (`unit_tests`, `pwauto_tests`) | `sdd-apply-low`, `sdd-apply-medium`, `sdd-apply-high` |
| `p3_test_running` | `sdd-verify` (`unit_tests`, `pwauto`, `pwcli`) | `sdd-verify` |
| `p3_requirements` | `requirements/fixer` | `req-fixer` |
| `p4_documenting` | `sdd-apply` (`documentation`) | `sdd-apply-low`, `sdd-apply-medium`, `sdd-apply-high` |
| `p4_requirements_docs` | `requirements/fixer` | `req-fixer` |
| `p4_done` | Ninguna | Orquestador |

For `sdd-apply` modes, see [apply-modes](../../references/apply-modes.md). For per-TASK-ID concurrency and complexity, see [apply-concurrency](../../references/apply-concurrency.md). For `sdd-verify` modes, see [verify-modes](../../references/verify-modes.md).

## User-facing language boundary

- Speak Spanish with the human user ONLY in: proposal acceptance (`p1_awaiting_acceptance` / `proposal_state: approve`), functional validation (`p2_awaiting_acceptance` / `functional_state: approve`), SDD blockers, and the delivery report.
- Keep everything else in English: delegation prompts to `sdd-*` subagents, `apply_type` / `verification_type` values, Task `phase` / `state` mechanics, JSON reports, and script commands.
- Require subagents to respond in English at all times; translate to Spanish only at the human boundary listed above.
- At `p1_awaiting_acceptance` with a ready `proposal.md`, present a Spanish user-level summary with no technical jargon, built ONLY from the proposal `Suggested criterion operations`; never compare against `Task.criteria` or navigation and never add an unchanged/`mantienen` section. Keep `proposal.md` itself English technical. Use this shape with Spanish headings and a text-only closing line:
  - `Problema encontrado`: plain-language problem from the proposal.
  - `Solución propuesta`: plain-language outcome from the proposal.
  - `Criterios a añadir`: one entry per `new` operation with id plus `descripción nueva` plus `justificación`.
  - `Criterios a eliminar`: one entry per `delete` operation with id plus `descripción inicial` plus `justificación`.
  - `Criterios a editar`: one entry per `edit` operation with id plus `descripción inicial` plus `descripción nueva` plus `justificación`.
  - Closing line text only: `¿Aceptas la propuesta?` Do NOT invoke the question tool for acceptance; after the summary STOP and wait for the user free-text reply in chat (accept, reject, change, or question). Record `proposal_state` only after explicit user text; never infer acceptance from silence or technical results.
- At `p2_awaiting_acceptance`, apply the same stop-without-question behavior with different content: present the test route resolved from the canonical Task (`ui_url` plus the `app_map` view/feature path) and no criteria diff structure. Never invent a URL; when the route is missing, report that as info/blocker context and still STOP and wait for the user free-text reply in chat. Record `functional_state` only after explicit user text; never infer validation from silence or technical results.

## Blockers and stops

- Declare a blocker and halt execution without sufficient information, results, or authorization; report the problem, the `phase` / `state`, the halted work, and what is needed. Do not launch dependent work while the blocker persists; do not persist the blocker in the Task; do not invent a `blocked` value for `phase` or `state`, and do not add blocker fields.
- Enforce the `sdd-apply` golden rules: produce the wave plan from the apply-concurrency gate before the first `p2_implementing` delegation; keep sole `sdd/task` writer, sole complexity assigner, and one delegation per TASK-ID; delegate in parallel only with satisfied dependencies and independent writes; reconcile before continuing; after three invalid results for one objective, declare a blocker.
- Handle the new requirements states: `p3_requirements` (F3 gate: scope `Task.app_map`, `only=criterios,estructura,code,test`, FORBIDDEN `docs/app-map/**`) and `p4_requirements_docs` (F4 gate: `only=docs` plus a `test` re-check). Run one req-fixer delegation per state; keep the fixer-internal budget at 5 iterations per state (independent); do not re-delegate after `blocked`. Treat a `blocked` report in either state as an SDD blocker (halt, wait for the user; no routine question, no automatic rollback across phases, no advancement). When the fixer modified `navigation.yaml` / slugs / IDs, reconcile `Task.criteria` / `app_map` via `update-task.ts` as the orchestrator ONLY (direction navigation → Task). With `requirements_fix==false` (default), skip both states with no delegation (skip).
- Honor human stops: only `p1_awaiting_acceptance` (`proposal_state: approve`) and `p2_awaiting_acceptance` (`functional_state: approve`); keep everything else automatic per the graph. Do not infer acceptance from silence or technical results.
- Treat a ready proposal with zero criterion operations (no `new`, `edit`, or `delete`) as a blocker at `p1_awaiting_acceptance`: halt, report the `phase` / `state`, state the missing-criteria problem and what is needed to continue, and do not advance to Phase 2.
- Before `p4_done`, deliver per [delivery](../../references/delivery.md). After closure, report the task, the `phase` / `state`, the confirmed work, pending items, and required decisions.
