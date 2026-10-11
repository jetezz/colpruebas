---
name: projectctl2-sdd-design
description: Document technical design decisions for an SDD v2 task during p2_planning using the accepted proposal, spec.md, and the real project code. Use when sdd-orchestrator delegates design.
---

# SDD v2 — sdd-design

## Purpose

Produce a technical design that explains how to carry the behaviors defined in the specifications into an implementable solution. Base the design on the real architecture and patterns of the project, make the relevant decisions and alternatives explicit, and provide enough context for `sdd-tasks` to break down the work.

This skill works during `fase_2_implementacion / p2_planning`. Specs define which behavior must hold; this design documents how to structure the proposed solution. `sdd-tasks` splits the work into concrete tasks; the orchestrator evaluates and assigns the complexity of each TASK-ID.

The Task structure and its artifact folder are defined in [`sdd/task/SKILL.md`](../../task/SKILL.md).

## Expected input

The orchestrator provides:

- The task identity and confirmation that the work belongs to `p2_planning`.
- The Task index path and its relevant current data, including `app_map`, `expected`, and `criteria`.
- The path of the accepted proposal.
- The path of `spec.md`.
- The exact output path for `design.md`. The conventional location is `taskReadme/<task_id>-<task_slug>/design.md`, next to `proposal.md` and `spec.md`.
- Constraints, confirmed decisions, relevant code areas, or other explicit instructions.

When a required document is missing, a path does not belong to the task, or a contradiction prevents designing correctly, inform the orchestrator. Do not invent a substitute path or resolve product decisions on your own.

## Method

### 1. Read and contrast the scope

Read the accepted proposal, `spec.md`, and the current Task data. Use the proposal for context and approved decisions, `spec.md` for the behaviors to satisfy, and Task as the canonical source for its current values.

Verify the design stays within the approved scope. Keep traceability to the `SPEC-*` identifiers and the relevant criterion IDs. Do not rewrite requirements or assume the proposal or spec already materialized changes in `docs/app-map/navigation.yaml`.

### 2. Inspect the real project

Before proposing a solution, read the relevant source code and, when it informs the design, the project tests and documentation. Verify:

- Current entry points, modules, and responsibilities.
- Existing patterns, interfaces, dependencies, and conventions.
- Data flows and boundaries between components affecting the specs.
- Tests or documentation revealing relevant contracts or behaviors.

Cite concrete paths and symbols in `design.md`. Separate directly observed facts from inferences. Do not state that a file will change as a confirmed fact when the analysis only supports proposing it.

### 3. Evaluate and record decisions

Describe a technical direction consistent with the specs and the existing project. For each material decision, record the choice, its rationale, the relevant evidence, the viable alternatives considered, and the relevant consequences or trade-offs. Compare alternatives only when more than one reasonable option exists; do not fabricate options to complete a section.

Explain the components and their responsibilities, the relevant flows or interactions, and the contracts/interfaces that need to be clear for implementation. Include a map of affected files only when justified by the current code and scope; mark each path as a proposed creation, modification, or deletion.

Include technical risks, dependencies, compatibility, migration, or deployment when relevant. When no migration or rollout work applies, state that briefly. The test strategy guides which behavior or integration to verify and may reference the specs; do not create tests or replace the work of the testing skills.

When evidence is missing or a technical decision blocks a reliable proposal, record the question and the affected requirement. Do not present a guess as an approved decision.

### 4. Persist the design

Write the full document as a persistent artifact to the exact assigned path, inside the Task artifact folder. The conventional path is `taskReadme/<task_id>-<task_slug>/design.md`, next to `proposal.md` and `spec.md`.

When `design.md` already exists and the orchestrator assigned a revision, read it and update that same file; do not create duplicates or alternative paths. Do not write to `docs/app-map/`, do not update the Task index, and do not modify implementation files.

Write the artifact in English unless the orchestrator gives an explicit instruction to the contrary.

## Artifact format

Full template: see [design-template](../../references/design-template.md). Adapt or remove sections without filling them with assumptions.

## Engram as auxiliary memory

Engram is best-effort and parallel, never a gate; see [engram-policy](../../references/engram-policy.md). Task/canonical first, Engram second. Reads: `mem_context` on resume, narrow `mem_search` + full `mem_get_observation(id)`; treat results as historical and confirm them. Selective post-result saves with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying.

Flow and guards: see [phases](../../phases/SKILL.md) and [flow-guards](../../references/flow-guards.md).

## Responsibility boundaries

- Do not modify code, tests, existing documentation outside the assigned artifact, or Task frontmatter.
- Do not run `sdd/task` scripts or change `phase`, `state`, `proposal_state`, or `functional_state`.
- Do not alter requirements, accept the proposal, or make unauthorized product decisions.
- Do not split the work into tasks or assign complexity; that responsibility belongs to `sdd-tasks` and the orchestrator-coordinated flow.
- Do not delegate internally or coordinate other skills. Return the result to the orchestrator, which evaluates the artifact and decides the next steps.
- Do not claim `p2_planning` finished or that implementation is authorized.

## Response to the orchestrator

Return a concise summary. Respond in English, using:

```markdown
## Design prepared
- **Task:** {task_id} — {task_name}
- **Artifact:** {exact path}
- **Approach:** {one- or two-sentence summary}
- **Decisions:** {main decisions and related specs}
- **Evidence:** {inspected areas/paths}
- **Pending items or discrepancies:** {concrete list or "None"}
- **Contribution to sdd-tasks:** {which decisions/structure enable breakdown, or what is missing}
```

Separate observed facts, recommended decisions, and questions requiring resolution. Do not duplicate the full design content in the response.
