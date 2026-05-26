---
name: sdd-tasks
description: "Trigger: sdd-tasks, task breakdown, implementation checklist. Create actionable SDD implementation tasks."
license: MIT
metadata:
  id: sdd-tasks
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for creating the TASK BREAKDOWN. You take the proposal, specs, and design, then produce the implementation breakdown artifact with concrete actionable apply work units organized by dependency and execution safety. In this repo-local overlay, the canonical filesystem artifact is the active `taskReadme` implementation/progress section, mirrored to Engram.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read proposal, spec, and design; update the implementation breakdown / progress section in the active `taskReadme`; mirror the artifact as `sdd/{change-name}/tasks`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but the approved coordinated repo-local path is `taskReadme + Engram mirror`.
- Filesystem rule: do NOT create or update `tasks/<change>.md`; the only filesystem output is the active `taskReadme`.

## Command Authority

Task-planning authority is breakdown writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Use file/Engram reads to understand proposal/spec/design context, write only the implementation breakdown / progress section in the active `taskReadme`, mirror `sdd/{change-name}/tasks`, and mark out-of-phase command needs as owner/risk notes.

## What to Do

### Step 1: Load Skills
Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Analyze the Design

Identify file changes, dependencies, and testing requirements.

### Step 3: Write the task breakdown artifact

Use this repo-local checklist structure with apply work units. The goal is not just a checklist; it must let the coordinator decide which explicit `sdd-apply-*` lane should run, whether execution stays serial, and where parallel batches are safe.

For each implementation unit, include:

- `Unit`: stable short ID, e.g. `A`, `B`, `api-1`, `docs-1`.
- `Estado`: initial unit status, normally `pending`.
- `Objetivo`: concrete implementation goal.
- `Archivos owned`: exact files or narrow globs the unit may modify.
- `Depende de`: prerequisite unit IDs or `none`.
- `Conflict group`: shared resource label such as `api-routes`, `db-migration`, `frontend-store`, `docs`, or `none`.
- `Modo`: `serial`, `parallel-safe`, or `coordinator-only`.
- `Engram topic`: unit-specific topic, normally `sdd/{change-name}/apply-{unit-id}`.
- `apply_lane` (required): which canonical apply lane owns execution of this unit. Values:
  - `code` — implementation by `sdd-apply-code` (general code, config, runtime, structure)
  - `doc` — documentation by `sdd-apply-doc` (docs, READMEs, guides)
  - `unit-tests` — unit test creation by `sdd-apply-unit-tests`
  - `pwauto-tests` — Playwright automated E2E test creation by `sdd-apply-pwauto-tests`
  - `none` — coordinator-owned mechanical work (no apply lane)

Also include a short `### Apply scheduling recommendation` subsection with:

- `Recommended mode`: `single`, `serial-batches`, or `parallel-where-safe`.
- `Serial batches`: ordered groups when dependencies require sequencing.
- `Parallel candidates`: units that can run together safely, or `none`.
- `Do not parallelize`: explicit units/reasons when file ownership, migrations, shared contracts, or conflict groups overlap.

### Apply scheduling recommendation

The SDD apply layer has 4 canonical lanes:

| Lane | Skill | Notes |
|---|---|---|
| `code` | `sdd-apply-code` | General implementation; may touch owned source/runtime/config files |
| `doc` | `sdd-apply-doc` | Docs, guides, READMEs; normally independent |
| `unit-tests` | `sdd-apply-unit-tests` | Unit test file creation; parallel-safe when test files are disjoint |
| `pwauto-tests` | `sdd-apply-pwauto-tests` | Playwright E2E spec creation; parallel-safe when projects and browsers are disjoint |

**Parallel-safe conditions by lane:**
- `code`: parallel-safe only when owned files, conflict groups, and Engram topics are fully disjoint across units. Most code units share `api-routes`, `frontend-store`, or generated types — default to `serial`.
- `doc`: often parallel-safe; conflict group is `docs` and owned files rarely overlap unless multiple units update the same doc.
- `unit-tests`: parallel-safe when test files target different modules and no shared mocking/fixture dependencies exist.
- `pwauto-tests`: parallel-safe when projects (`/workspace/projects/<id>`) and browser contexts are disjoint across units.

**Do not parallelize** any unit that:
- Modifies the same file or narrow glob
- Belongs to the same `Conflict group`
- Has a dependency relationship (directly or transitively)

Units with `apply_lane: none` are coordinator-owned and do not consume an apply lane.

### Step 4: Persist Artifact

Persist as `sdd/{change-name}/tasks`.

### Step 5: Return Summary

Return phase/task counts, recommended order, and next step.

## Rules

- ALWAYS reference concrete file paths
- Order tasks by dependency
- Prefer coherent work units that can fit in one bounded apply context
- Mark units `parallel-safe` only when owned files, taskReadme rows/subsections, dependencies, and conflict groups are disjoint
- Mark units `serial` when they touch shared contracts, database migrations, runtime topology, generated types, shared stores, or the same files
- Mark orchestrator-only mechanical work as `coordinator-only`; do not assign it to any `sdd-apply-*` lane
- Testing tasks should reference specific scenarios
- Keep each task small enough for one session
- Use repo-local paths and conventions
- If segmentation cannot be made safe from the available specs/design, say exactly what information is missing instead of guessing

### Routing when verification finds missing coverage

When a `sdd-verify-*` lane executes and detects that a required artifact (doc, unit test, E2E test) is missing for a unit that had no explicit lane assignment or was marked `apply_lane: none`, it will:

1. Update the taskReadme unit row status to `blocked`.
2. Record a note indicating which `sdd-apply-*` lane must be scheduled to cover the gap.
3. Return result `blocked` to the coordinator.

The coordinator then re-invokes the appropriate lane (`sdd-apply-doc`, `sdd-apply-unit-tests`, `sdd-apply-pwauto-tests`) for the affected unit before continuing verification.

This ensures every implementation unit has explicit lane ownership from tasks through to verification, with no silent gaps, and keeps verification lanes in run/review/report-only scope.
