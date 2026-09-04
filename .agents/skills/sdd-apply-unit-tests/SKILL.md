---
name: sdd-apply-unit-tests
description: "Trigger: sdd-apply-unit-tests, unit test creation, RED phase TDD. Create or update unit test files under **/*.test.ts and **/*.spec.ts only. Never write product code. Authorized by WorkflowRuntimeContextV1."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a bounded executor for **unit-test file creation and updates** only. You receive one or more explicit apply work units with `apply_lane: unit-tests` (decomposed by `sdd-tasks` against the binding-declared lane registry) and write or modify only the unit test files in the assigned scope. You do not execute test suites, write product code, or touch documentation.

You are the only SDD lane authorized to create RED-phase test files when `tdd_mode: strict` is set on the assigned work unit.

## Required Inputs

Universal executor inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `apply_work_unit_refs` | The assigned work-unit row(s) (must include `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) | Yes |
| `tdd_mode` | `strict` (drives RED-only behaviour) or default | Optional |

See `sdd-phase-common.md` §F.1 (refuse-to-invent) and §F.2 (raw-input prohibition).

## Authorization Gate

Before any test write:

- See `apply-lane-common.md` §Apply Authorization Gate and `sdd-phase-common.md §F` for the universal checks and the ownership + contract-field delta.

## Execution and Persistence Contract

Persistence: see `sdd-phase-common.md` §F.4.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/sd-protocol/sdd-phase-common.md`.

### Step 2: Read Context

Before writing any test file:

1. Read the specs and design for the change.
2. Read existing test patterns in the affected surface.
3. Read the assigned work unit(s) — confirm `apply_lane: unit-tests` is set.
4. Confirm the test files you intend to create or edit are within the unit's `Archivos owned`.
5. If `tdd_mode: strict` is set, load `.agents/skills/sd-protocol/strict-tdd.md` for the RED-phase workflow.

### Step 3: Implement Assigned Work Units

For each assigned unit:

- Read the unit description and acceptance criteria.
- Identify the behaviour the test should describe (expected failures, expected outputs, boundary conditions).
- Match existing repo test style (`__tests__/` near the code under test, `bun test`, naming conventions).
- Write the smallest focused test file that covers the assigned scope.
- Use RED-phase conventions when `tdd_mode: strict` is active: the test must fail against current product code.
- Record the implementation evidence for the assigned unit (see Step 4).

If the prompt asks to write test files outside the assigned `Archivos owned`, STOP and return `blocked` with the exact mismatch.

### Step 4: Persist Evidence and Return Unit Status

Under the index-primary overlay (`WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`), write your test-creation evidence for the assigned unit to its resolved phase artifact `apply-<unit_id>` (`artifact_context.phase_artifacts.path_pattern`) and return, through the envelope, the unit's `summary` + `artifact_ref` + status (`pending|in_progress|done|blocked|failed`). The coordinator is the single writer of the index work-unit status table; this lane does NOT write the index. Do not consolidate aggregate progress fields unless the coordinator explicitly assigned a full unsegmented apply scope.

Under the current overlay evidence lives in the phase artifact; no mirror is configured.

### Step 5: Return Summary

Return the completed unit ID(s), test files created or modified, deviations from design, issues found, remaining units, per-unit `summary` + `artifact_ref` + status, and delivery risks.

## Segmented Apply Contract

See `apply-lane-common.md` §Segmented Apply Contract.

Unit evidence must include:

- assigned unit ID(s)
- unit status: `pending`, `in_progress`, `done`, `blocked`, or `failed`
- test files created or modified
- test framework: `bun test`
- test file conventions: `__tests__/` near the code under test
- `summary` + `artifact_ref` to the `apply-<unit_id>` phase artifact

## Command Authority

**Unit-test file creation boundary.** Tool permission is not command authorization.

### Allowed by Default

- Read assigned SDD context (proposal, spec, design, tasks, canonical primary).
- Read existing product code in the affected surface to understand expected behaviour.
- Write or update unit test files under `**/*.test.ts` and `**/*.spec.ts` within assigned scope.
- Create `__tests__/` directories when they do not exist and are within the unit's `Archivos owned`.
- Write test-creation evidence to the `apply-<unit_id>` phase artifact and return `summary` + `artifact_ref` + status through the envelope (index overlay); under a ledger overlay, update the owned breakdown row and mirror via the lane's mirror key.

### Forbidden

- Product code (`*.ts`, `*.js` source not in `__tests__/` or `*.test.*`, `*.spec.*`).
- PW-AUTO Playwright specs (`playwright/tests/`, `playwright/TEST_PLAN.md`).
- Documentation files (`docs/`, `quality/*.md`).
- Running test suites (`bun test`, `bunx playwright test`).
- Git/GitHub commands (`git`, `gh`).
- Docker/runtime/projectctl commands.
- Browser tooling (`playwright-cli`, persistent Playwright runners).
- Supabase/data operations.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

### Escalate Instead

Report the needed coordinator action, verification lane, runtime preflight, or data owner in the task evidence and return envelope.

## Owned Artifacts

- Unit test files under `**/*.test.ts`.
- Unit test files under `**/*.spec.ts`.
- `__tests__/` directories created within assigned scope.

## Owned artifact / owned section

See `apply-lane-common.md` §"Owned artifact / owned section" and `apply-work-unit-schema.md §7`. Under the index overlay this lane writes its evidence to the `apply-<unit_id>` phase artifact and returns status/ref; under a ledger overlay it owns only the implementation-breakdown rows where `apply_lane: unit-tests`.

## Rules

- ALWAYS read specs before writing a test.
- ALWAYS follow existing repo test conventions (`__tests__/` layout, `bun test`).
- If `tdd_mode: strict` is active, write only the failing RED test; do not attempt to make it pass while in this lane.
- Do not execute test suites — that belongs exclusively to `sdd-verify-units`.
- Do not create tautological or snapshot-only tests that provide no meaningful assertion.
- If the unit scope is ambiguous, STOP and return `blocked` with the ambiguity.
- Never use `npm`, `npx`, or package managers other than Bun.
- Respect repo-local project rules injected by the orchestrator.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.
