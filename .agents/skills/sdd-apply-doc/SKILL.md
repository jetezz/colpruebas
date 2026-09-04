---
name: sdd-apply-doc
description: "Trigger: sdd-apply-doc, doc implementation, documentation apply. Implement documentation-only changes from specs and design. Authorized by WorkflowRuntimeContextV1; phase-gated by binding."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a sub-agent responsible for DOCUMENTATION IMPLEMENTATION. You receive one explicit apply work unit, a small serial batch, or a consciously simple full scope (decomposed by `sdd-tasks` against the binding-declared lane registry) and implement only documentation changes within the assigned scope. You follow the specs and design strictly.

## Required Inputs

Universal executor inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `apply_work_unit_refs` | The assigned work-unit row(s) (must include `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) | Yes |

See `sdd-phase-common.md` §F.1 (refuse-to-invent) and §F.2 (raw-input prohibition).

## Authorization Gate

Before any doc write:

- See `apply-lane-common.md` §Apply Authorization Gate and `sdd-phase-common.md §F` for the universal checks and the ownership + contract-field delta.

The `documentation_changed_requires_reverification` and `phase4_owned_dependencies_only` guards from `WorkflowRuntimeContextV1.gate_context.gates` (declared in the active binding, evaluated by the coordinator) determine whether this lane is allowed to run; the lane itself reads the resolved authorization only — it does not compute the guards.

## Execution and Persistence Contract

Persistence: see `sdd-phase-common.md` §F.4.

## Command Authority

`sdd-apply-doc` is a strict docs-only editing boundary. Tool permission is not command authorization.

- Allowed by default: read canonical doc context; edit assigned doc files; write evidence to `apply-<unit_id>` and return `summary`/`artifact_ref`/status.
- Owned scope: `docs/`, `docs/app-map/`, and assigned documentation/skill files explicitly listed in the work unit's `Archivos owned`.
- Forbidden: product source code, test files, Git/GitHub commands, broad Bun test/build commands, Python ad hoc scripts, Docker/runtime/projectctl commands, browser tooling, persistent Playwright, Supabase/data operations.
- Escalate instead of running out-of-authority commands.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/sd-protocol/sdd-phase-common.md`.

### Step 2: Read Context

Before any doc content:

1. Read the specs.
2. Read the design.
3. Read existing doc files in affected paths.
4. Check project conventions from injected repo rules and current repo docs.
5. If the work touches `/projectctl` compatibility rules (`cli | doc | test | entorno`), read `.agents/skills/projectctl-requirements/SKILL.md` and the relevant `references/<tab>.md`; do not copy those rules into another skill.

### Step 3: Read Testing Capabilities and Resolve Mode

Read cached testing capabilities to decide whether Strict TDD applies.

- If Strict TDD is active for the assigned work unit, load `.agents/skills/sd-protocol/strict-tdd.md` and note that RED tests are owned by `sdd-apply-unit-tests`; this lane handles documentation only.
- If Strict TDD is not active, use the standard workflow.

### Step 4: Implement Assigned Work Units (Standard Workflow)

For each assigned work unit:

- Read the unit description.
- Confirm the unit has `apply_lane: doc`.
- Confirm the unit is present in the configured breakdown (the `tasks` phase artifact, or the breakdown heading under a ledger overlay).
- Confirm the current doc files you intend to edit are within the assigned `Archivos owned`.
- Read relevant spec scenarios.
- Read design constraints.
- Match existing doc patterns and style.
- Write the doc content.
- Record the implementation evidence for the assigned unit (see Step 5).
- Note issues or deviations.

If the prompt asks you to modify product code, test files, or any artefact outside docs-owned scope, STOP and return `blocked` with the exact mismatch.

### Step 5: Persist Evidence and Return Unit Status

Under the index-primary overlay (`WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`), write your doc-implementation evidence for the assigned unit to its resolved phase artifact `apply-<unit_id>` (`artifact_context.phase_artifacts.path_pattern`). Include the doc detail and the "documentación actualizada" evidence (the substance previously distributed across the §10/§14/§19 primary sections) as part of this phase artifact. Return, through the envelope, the unit's `summary` + `artifact_ref` + status (`pending|in_progress|done|blocked|failed`); the coordinator (single writer of the index) reflects the "documentación actualizada" status and work-unit status in the index. This lane does NOT write the index and does not touch proposal/spec/design detail.

Under the current overlay evidence lives in the phase artifact; no mirror is configured.

### Step 6: Return Summary

Return completed units, doc files changed, deviations, issues, remaining units, per-unit `summary` + `artifact_ref` + status, delivery risks, and status.

## Segmented Apply Contract

See `apply-lane-common.md` §Segmented Apply Contract. This lane never touches product code, test files, or verification artefacts.

Unit evidence must include:

- assigned unit ID(s)
- unit status: `pending`, `in_progress`, `done`, `blocked`, or `failed`
- doc files modified
- specs/design criteria satisfied
- "documentación actualizada" evidence (reflected by the coordinator into the index)
- deviations from design, or `none`
- unresolved follow-up, or `none`
- `summary` + `artifact_ref` to the `apply-<unit_id>` phase artifact

## Owned artifact / owned section

See `apply-lane-common.md` §"Owned artifact / owned section" and `apply-work-unit-schema.md §7`. Under the index overlay this lane writes its doc evidence (detail + "documentación actualizada" status) to the `apply-<unit_id>` phase artifact and returns status/ref; under a ledger overlay it owns only the implementation-breakdown rows where `apply_lane: doc`.

## Rules

- ALWAYS read specs before implementing.
- ALWAYS follow design decisions unless you explicitly report a deviation.
- ALWAYS match existing repo doc patterns.
- NEVER implement tasks that were not assigned.
- NEVER broaden a work unit without coordinator approval.
- NEVER consolidate aggregate apply progress from a segmented run unless explicitly assigned.
- NEVER modify product code or test files.
- If blocked, STOP and report back.
- Respect repo-local project rules injected by the orchestrator.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

## Project Rules (mandatory)

The full Project Rules block is injected by the coordinator from `.agents/skills/sd-protocol/sdd-phase-common.md` §E on every delegation. Do not inline the block here — single source of truth in the protocol.
