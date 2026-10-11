---
name: projectctl2-sdd-spec
description: Draft behavior specifications for an SDD v2 task during p2_planning from the accepted proposal and current Task data. Use when sdd-orchestrator delegates spec definition.
---

# SDD v2 — sdd-spec

## Purpose

Turn the approved scope of a task and its current requirements into clear, verifiable specifications that support breaking the work into tasks. This skill performs planning work in `fase_2_implementacion / p2_planning`; it does not implement code or decide on its own that the state is complete.

The canonical record and artifact locations are defined in [`sdd/task/SKILL.md`](../../task/SKILL.md). The proposal provides the approved scope; current Task values remain the canonical source for `app_map`, `expected`, and `criteria`.

## Expected input

The orchestrator provides:

- The task identity and confirmation that the work belongs to `p2_planning`.
- The Task index path and the relevant current values: `app_map`, `expected`, and `criteria`.
- The exact path of the task's `proposal.md`.
- The assigned output path for the specifications. The conventional location is `taskReadme/<task_id>-<task_slug>/spec.md`, next to `proposal.md` in the task artifact folder.
- Constraints, confirmed decisions, questions to resolve, and any project-specific format requirements.

When a required input is missing, the path does not belong to the task, or the task is not in the stated planning context, inform the orchestrator and do not invent data or substitute paths.

## Method

### 1. Read and contrast the sources

Read the accepted proposal and compare its scope with the `expected`, `app_map`, and current `criteria` operations provided by the orchestrator. Use the proposal to understand intent and accepted decisions; do not treat it as an automatic Task update.

Keep traceability between each specification and the relevant criteria explicit. For `new` and `edit` operations, keep the current IDs and descriptions received. For `delete`, specify only the behavior or requirement whose removal the recorded decision supports; do not invent historical requirements. Do not claim a proposed criterion is already written to Task or materialized in Navigation.

When sources contradict each other, a product decision is missing, or the expected behavior cannot be determined, document the discrepancy or pending question for the orchestrator. Do not resolve the contradiction on your own or expand the scope.

### 2. Define verifiable specifications

Organize the document by functional areas consistent with the scope. For each requirement, describe:

- **Identifier:** stable and unique within the document, for example `SPEC-001`.
- **Title and related criterion:** reference one or more criterion IDs when applicable; state explicitly when no criterion applies.
- **Required behavior:** observable outcome from the perspective of the relevant user, system, or consumer.
- **Conditions and limits:** preconditions, rules, permissions, states, validations, or relevant restrictions.
- **Verification scenarios:** concrete examples that determine whether the requirement holds. Use Given/When/Then when it clarifies precondition, action, and outcome.

Include the main flows and the relevant edge or error cases for the specified behavior. Each requirement needs at least one verifiable scenario. Avoid vague or duplicated scenarios.

Specify **what** behavior must hold, not implementation details. When a technical decision is necessary but not yet fixed, record it as a question for `sdd-design` or as a pending decision instead of presenting a technical solution as an approved requirement.

Task `new`, `edit`, and `delete` operations describe criterion changes; do not convert those values automatically into an ADDED/MODIFIED/REMOVED/RENAMED section taxonomy. Use this document's format unless the orchestrator provided an explicit project contract.

### 3. Persist the artifact

Write the full document as a persistent artifact to the assigned output path, inside the task artifact folder, just as `sdd-propose` persists `proposal.md`. The conventional path is `taskReadme/<task_id>-<task_slug>/spec.md`. When the file already exists as part of an assigned revision, read it and update that same file; do not create copies under alternative names.

Do not write to `docs/app-map/` or update the Task index. Engram may serve as auxiliary memory per the next section, but never as the store or mirror of the spec.

Write the artifact in English unless the orchestrator gives an explicit instruction to the contrary.

## Engram as auxiliary memory

Engram is best-effort and parallel, never a gate; see [engram-policy](../../references/engram-policy.md). Task/canonical first, Engram second. Reads: `mem_context` on resume, narrow `mem_search` + full `mem_get_observation(id)`; treat results as historical and confirm them. Selective post-result saves with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying.

Flow and guards: see [phases](../../phases/SKILL.md) and [flow-guards](../../references/flow-guards.md).

## Artifact format

```markdown
# Specifications: {task_id} — {task_name}

## Context and scope
{Brief summary based on the accepted proposal and current Task values.}

## Traceability
| Criterion | Operation | Related requirements |
|---|---|---|
| {criterion-id} | {new/edit/delete} | {SPEC-001; state when not applicable} |

## Requirements

### SPEC-001 — {Title}
- Related criteria: {IDs or "None"}
- Required behavior: {observable outcome}
- Conditions and limits: {relevant rules}

#### Scenario: {main outcome}
- GIVEN {precondition}
- WHEN {action}
- THEN {observable outcome}

#### Scenario: {relevant edge case}
- GIVEN {precondition}
- WHEN {action}
- THEN {observable outcome}

## Pending decisions
- {Decisions blocking a specification, or "None".}

## Out of scope
- {Explicit limits supported by the sources, or "None stated".}
```

Adapt or remove rows/sections that do not apply, without filling them with assumptions. When a pending decision is required to specify a behavior correctly, state clearly which requirement is affected.

## Responsibility boundaries

- Do not modify code, tests, existing documentation outside the assigned artifact, or Task frontmatter.
- Do not run `sdd/task` scripts or change `phase`, `state`, `proposal_state`, or `functional_state`.
- Do not accept the proposal, change the approved scope, or decide whether the functionality is validated.
- Do not delegate internally or coordinate other skills; return the result to the orchestrator.
- Do not claim `p2_planning` finished. The orchestrator evaluates the artifact and coordinates the next skills.

## Response to the orchestrator

Return a concise summary. Respond in English, using:

```markdown
## Specs prepared
- **Task:** {task_id} — {task_name}
- **Artifact:** {exact path}
- **Coverage:** {areas, requirements, and linked criteria}
- **Verifiability:** {main scenarios and edge cases covered}
- **Pending items or discrepancies:** {concrete list or "None"}
```

Report separately what the proposal/Task supports and what needs resolution. Do not duplicate the full spec in the response.
