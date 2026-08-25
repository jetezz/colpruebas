---
name: sdd-tasks
description: "Trigger: sdd-tasks, task breakdown, implementation checklist. Create actionable SDD implementation tasks with explicit apply_lane, scenarios, contract and routing tag. Authorized by WorkflowRuntimeContextV1."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a sub-agent responsible for creating the TASK BREAKDOWN. Write all breakdown detail into the `tasks` phase artifact and return a bounded summary + artifact_ref. The coordinator reflects only the summary and work-unit status into the index.

## Required Inputs

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | Coordinator injection; complete bounded snapshot | Yes |
| `artifact_refs` | Primary path resolved by `WorkflowRuntimeContextV1.task_ref.path`; target section identifier from `WorkflowRuntimeContextV1.task_ref.heading_owners` (the implementation-breakdown section) | Yes |
| `workflow_context_ref.lane_context` | Coordinator confirms this lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and `WorkflowRuntimeContextV1.lane_context.allowed_lanes` for the active phase | Yes |
| `proposal_ref` + `spec_ref` + `design_ref` | Foundational artefacts in canonical primary or mirror | Yes |
| `lane_registry` | `WorkflowRuntimeContextV1.lane_context.registry` | Yes — already resolved; never recovered from binding/projection |
| `output_artifact` | Phase-artifact key resolved from `WorkflowRuntimeContextV1.artifact_context.phase_artifacts` this lane writes: `tasks` | Yes |

Universal Required Inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F.1`; the rows above declare only the planning-specific additions. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`. Retired aliases are governed by `sdd-phase-common.md §F.3`; this lane never re-enumerates the retired-alias set.

## Authorization Gate

The universal authorization steps (validated resolver context; this lane id present in `lane_context.registry` + `allowed_lanes`; the `tasks` key present in `artifact_context.phase_artifacts.artifact_keys`) are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F` and enforced by the resolver. Planning-specific addition:

- Each emitted unit MUST verify its own lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and that the lane's `owner_phase` includes the proposed phase for the unit. Units that fail this check MUST NOT be emitted.
- A planning lane MUST NOT schedule a unit for an apply lane whose `owner_phase` lies outside the active binding phase. Such units are out-of-phase and MUST be recorded as deferred: they MUST NOT be marked dependency-ready, MUST NOT participate in the active-phase serial ordering, and MUST NOT be emitted as active work units.
- Only a binding transition into the owning phase authorizes scheduling the deferred unit. Until that transition occurs, the unit stays deferred and MUST NOT be advanced.
- Example: `sdd-apply-unit-tests` is owned by Phase 3; it MUST NOT be planned as RED/GREEN work in Phase 2. It becomes schedulable only after the binding transitions to Phase 3.

## Execution and Persistence Contract

> Execution and persistence follow `.agents/skills/sd-protocol/sdd-phase-common.md §F.4` and, under the index-primary variant, `§F.5`. The apply work-unit schema (13 columns, 4 contract fields, complexity evaluation, parallel-safety, pre-implementation gate, verification mapping) is defined in `.agents/skills/sd-protocol/apply-work-unit-schema.md`. This lane populates rows conforming to that schema.

- Read proposal/spec/design through the resolved phase artifacts / configured mirror; write all breakdown detail — scope, prose acceptance criteria, owned files, and validation (formerly §8/§9/§11/§13) as subsections — plus the work-unit table into the single resolved `tasks` phase artifact, and return a bounded `summary` + `artifact_ref` through the envelope (§D); NOT the primary index. The coordinator is the single writer of the index and maintains there only the phase summary plus the work-unit status table.
- Routing decisions use only `WorkflowRuntimeContextV1.lane_context.registry`.

## Command Authority

Task-planning authority is breakdown writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Read canonical phase artifacts with file tools, write only `tasks`, return `summary` + `artifact_ref`, and mark out-of-phase needs.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/sd-protocol/sdd-phase-common.md`.

### Step 2: Analyze the Design

Identify file changes, dependencies, and testing requirements. Lane roles and allow-lists come from `WorkflowRuntimeContextV1.lane_context.registry` and `lane_context.allowed_lanes`.

### Step 3: Write the task breakdown artefact

The structural shape is universal; lane allow-lists for `apply_lane` are read from the binding-declared registry:

- `code-low` / `code-medium` / `code-high` — implementation by the matching split apply lane (declared in `WorkflowRuntimeContextV1.lane_context.registry`)
- `doc` — documentation by `sdd-apply-doc` (declared in `WorkflowRuntimeContextV1.lane_context.registry`)
- `unit-tests` — unit test creation by `sdd-apply-unit-tests` (declared in `WorkflowRuntimeContextV1.lane_context.registry`)
- `pwauto-tests` — Playwright E2E spec creation by `sdd-apply-pwauto-tests` (declared in `WorkflowRuntimeContextV1.lane_context.registry`)
- `none` — coordinator-owned mechanical work (no apply lane)

For each implementation unit, populate the columns of the apply work-unit schema defined in `.agents/skills/sd-protocol/apply-work-unit-schema.md` (13 columns, including `Unit`, `Estado`, `apply_lane`, `Objetivo`, `Archivos owned`, `Depende de`, `Conflict group`, `Modo`, `Mirror topic`, `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`). This lane's job is to DERIVE those rows from proposal/spec/design:

- Derive `apply_lane` by mapping each unit to an entry in `WorkflowRuntimeContextV1.lane_context.registry` (`code-low`/`code-medium`/`code-high`/`doc`/`unit-tests`/`pwauto-tests`/`none`), using the complexity evaluation in apply-work-unit-schema.md §3.
- Link `Spec scenarios linked` to concrete scenario IDs/names from the specs; block and request enrichment if the spec lacks scenarios for a behaviour.
- Name the smallest knowable `Implementation contract` target and concrete `Verify expects` observable criteria per apply-work-unit-schema.md §2.
- Assign parallel-safety (`Modo`) and `Routing tag on failure` per apply-work-unit-schema.md §4 and §2; every routing/`apply_lane` value MUST be a split-lane identifier resolved from `WorkflowRuntimeContextV1.lane_context.registry`.

The row shape (column headers are universal):

| Unit | Estado | apply_lane | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Mirror topic | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

### Step 4: Persist Artefact

Write all breakdown detail (scope, prose acceptance criteria, owned files, validation subsections, and the work-unit table) to the resolved `tasks` phase artifact per `sdd-phase-common.md §F.5`; do not write the primary index (the coordinator maintains there only the phase summary and the work-unit status table).

### Step 4b: Review Workload Forecast

Estimate the delivery workload so the coordinator can choose a delivery strategy:

- Estimate authored changed lines (additions + deletions) across the planned work units; exclude generated goldens from the authored count but keep them in the change.
- Report `400-line budget risk: Low | Medium | High` (High when the estimate exceeds 400 authored lines).
- Report `Chained PRs recommended: Yes | No`.
- This forecast is advisory input for `binding.modes.delivery_mode`: under the default `single-pr` the coordinator keeps one PR; under opt-in `work-unit-commits` a High risk drives the `chained-pr` slicing. Write the forecast into the `tasks` phase artifact.

### Step 5: Return Summary

Return phase/task counts, recommended order, `artifact_ref`, and next step.

## Rules

- ALWAYS reference concrete file paths.
- Order tasks by dependency.
- Prefer coherent work units that can fit in one bounded apply context.
- Mark units `parallel-safe` only when owned files, phase-artifact subsections, dependencies, and conflict groups are disjoint.
- Mark units `serial` when they touch shared contracts, database migrations, runtime topology, generated types, shared stores, or the same files.
- Mark orchestrator-only mechanical work as `coordinator-only`; do not assign it to any apply lane.
- Testing tasks should reference specific scenarios.
- Keep each task small enough for one session.
- Use repo-local paths and conventions.
- If segmentation cannot be made safe from the available specs/design, say exactly what information is missing instead of guessing.
- NEVER emit a non-`none` unit without `Spec scenarios linked`, `Implementation contract`, `Verify expects`, and `Routing tag on failure`.
- NEVER use vague `Verify expects` such as "verify implementation", "run code review", or only the lane name.
- If a unit cannot include a concrete implementation contract, block planning and ask for design/spec clarification instead of producing ambiguous tasks.
- NEVER emit a unit whose `apply_lane` value is a retired alias (see `sdd-phase-common.md §F.3`); if no split lane in `WorkflowRuntimeContextV1.lane_context.registry` matches, the lane is missing from the binding and the unit must be blocked with `tasks_contract_missing`.

Routing when a verification lane finds missing coverage is defined in `.agents/skills/sd-protocol/apply-work-unit-schema.md §6` (verification mapping); it is verification-lane behaviour, not a planning responsibility.
