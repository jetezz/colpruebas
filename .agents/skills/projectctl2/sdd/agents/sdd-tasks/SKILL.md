---
name: projectctl2-sdd-tasks
description: Create the implementable work breakdown for an SDD v2 task during p2_planning from the accepted proposal, spec.md, and design.md. Use when sdd-orchestrator delegates task planning.
---

# SDD v2 — sdd-tasks

## Purpose

Break the approved scope and design decisions into concrete, dependency-ordered implementation tasks. `sdd-tasks` does not evaluate or assign task complexity: after receiving the plan, the orchestrator analyzes each TASK-ID and records its level before delegating implementation. All code tasks use the single `sdd-apply` skill; OpenCode profiles are selected later based on that evaluation.

This skill works during `fase_2_implementacion / p2_planning`. It does not implement the changes, does not create or run the Phase 3 test suites, does not perform the Phase 4 documentation, and does not decide on its own that `p2_planning` is complete.

The Task structure and artifact folder are defined in [`sdd/task/SKILL.md`](../../task/SKILL.md).

## Expected input

The orchestrator provides:

- The task identity and confirmation that the work belongs to `p2_planning`.
- The Task index path and the relevant current data, especially `app_map`, `expected`, and `criteria`.
- The path of the accepted proposal.
- The path of `spec.md`.
- The path of `design.md`.
- The exact output path. The conventional location is `taskReadme/<task_id>-<task_slug>/tasks.md`, next to the other planning artifacts.
- Constraints, confirmed decisions, and any specific planning instructions.
- For a revision, the existing `tasks.md` and the instruction describing what to update, plus any progress information the orchestrator confirms as current.

When a required document is missing, a path does not belong to the task, or contradictions prevent a reliable breakdown, inform the orchestrator. Do not invent artifacts, decisions, or alternative paths.

## Method

### 1. Contrast the sources

Read the accepted proposal, `spec.md`, `design.md`, and the current Task data. Use the proposal for the approved scope, `spec.md` for the verifiable behaviors, and `design.md` for decisions, components, dependencies, and proposed paths.

Keep traceability between each task, the relevant `SPEC-*` IDs, and the current Task criteria. Keep IDs, descriptions, and criterion operations exactly as provided. Do not invent or renumber criteria or claim they materialized in Navigation. When a requirement implies no implementation work, state that under coverage instead of creating an artificial task.

Do not treat the paths proposed by `design.md` as authorization to edit them; they are references for scoping the work the orchestrator may assign to executors.

### 2. Define implementable tasks

Split the work into concrete units ordered by real dependencies. Each task declares:

- **Stable ID:** unique within the document, for example `TASK-001`.
- **Goal:** concrete outcome expected from implementation.
- **References:** covered `SPEC-*` criteria and requirements.
- **Technical scope:** relevant files or areas, based on the design and marked as proposed scope.
- **Work and verification:** concrete steps, verifiable outcome condition, and available command/check when known.
- **Dependencies:** IDs of tasks to complete first, or "None".

Order tasks so dependencies precede consumers. Do not impose a universal layer sequence or parallelism: reflect only dependencies and conflicts demonstrable in the sources.

`p2_planning` requires each task to carry a complexity level before moving to implementation. This skill leaves that assignment to the orchestrator; do not determine or recommend the level. The orchestrator completes `Complexity` in `tasks.md` after analyzing each TASK-ID. Do not add fields to Task frontmatter or change its schemas.

### 3. Respect phase boundaries

Plan the Phase 2 implementation tasks. They may state how to check the technical outcome, but do not assign them the creation or execution of persistent tests that belongs to the Phase 3 skills, nor the documentation updates that belong to Phase 4.

Do not impose TDD, RED/GREEN, threat matrices, line estimates, size limits, PR chaining, delivery strategies, or additional human decisions: SDD v2 defines none of these as rules. When such a need is explicitly approved for the project, reflect it only within that scope and cite its source to the orchestrator.

When a pending proposal/spec/design decision prevents assigning precise tasks, document which task or requirement is affected and return it to the orchestrator. Do not turn uncertainty into invented work.

### 4. Revise an existing plan

When the orchestrator assigns a revision:

1. Read `tasks.md` before modifying it.
2. Keep a task ID while it represents the same work; do not renumber remaining tasks only because of insertions or order changes.
3. Assign a new ID to new work. Do not reuse a previous ID for a different goal.
4. Keep progress information only when the orchestrator delivers it as current. Do not infer that a task completed because code, a file, or an artifact exists.
5. Explain tasks affected or retired by changes in the proposal, spec, or design; do not silently delete history or progress.

IDs are plan identifiers, not Task states or execution proof.

### 5. Persist the artifact

Write the full document to the exact assigned path inside the Task artifact folder. The conventional path is `taskReadme/<task_id>-<task_slug>/tasks.md`.

When the file already exists and a revision was assigned, update that same file; do not create copies under alternative names. Do not write to `docs/app-map/`, do not update the Task index, and do not modify code, tests, or documentation outside the assigned artifact.

Write the artifact in English unless the orchestrator gives an explicit instruction to the contrary.

## Artifact format

```markdown
# Tasks: {task_id} — {task_name}

## Scope and sources
- Proposal: {path}
- Spec: {path}
- Design: {path}
- Task criteria considered: {relevant IDs}

## Coverage
| Requirement | Criteria | Related tasks | Note |
|---|---|---|---|
| SPEC-001 | {IDs or "None"} | TASK-001 | {coverage or reason for no task} |

## Tasks

### TASK-001 — {Concrete goal}
- Complexity: pending evaluation by `sdd-orchestrator`
- Requirements/criteria: {SPEC-* and criterion IDs}
- Proposed scope: `{path}` — {relation to the design}
- Dependencies: {TASK-IDs or "None"}
- Work:
  - {specific action}
- Verifiable outcome: {observable condition and available check}

### TASK-002 — {Concrete goal}
...

## Pending decisions or discrepancies
- {Question, impact, and affected task/requirement; or "None".}
```

Adapt or remove rows and sections that do not apply without filling them with assumptions. Deliver the breakdown with complexity pending so the orchestrator analyzes and completes each task level before selecting the OpenCode agent profile that will load the single `sdd-apply` skill.

## Engram as auxiliary memory

Engram is best-effort and parallel, never a gate; see [engram-policy](../../references/engram-policy.md). Task/canonical first, Engram second. Reads: `mem_context` on resume, narrow `mem_search` + full `mem_get_observation(id)`; treat results as historical and confirm them. Selective post-result saves with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying.

Flow and guards: see [phases](../../phases/SKILL.md) and [flow-guards](../../references/flow-guards.md).

## Responsibility boundaries

- Do not modify code, tests, existing documentation outside the assigned artifact, or Task frontmatter.
- Do not run `sdd/task` scripts or change `phase`, `state`, `proposal_state`, or `functional_state`.
- Do not accept the proposal, change the approved scope, or resolve product decisions on your own.
- Do not implement the tasks, launch executors, or declare that the plan finished the phase; those decisions belong to the orchestrator.
- Do not delegate internally or coordinate other skills.

## Response to the orchestrator

Return a concise summary. Respond in English, using:

```markdown
## Tasks prepared
- **Task:** {task_id} — {task_name}
- **Artifact:** {exact path}
- **Coverage:** {covered SPEC-* and criteria; justified gaps}
- **Breakdown:** {task count and main dependencies}
- **Complexity:** pending evaluation by the orchestrator
- **Pending items or discrepancies:** {concrete list or "None"}
```

Separate supported coverage from pending decisions. Do not duplicate the document or claim `p2_planning` finished.
