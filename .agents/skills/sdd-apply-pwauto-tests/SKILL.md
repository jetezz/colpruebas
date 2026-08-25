---
name: sdd-apply-pwauto-tests
description: "Trigger: sdd-apply-pwauto-tests, playwright test creation, PW-AUTO test apply. Create or update persistent Playwright E2E specs only. Authorized by WorkflowRuntimeContextV1; never invent BASE_URL or runtime defaults."
license: MIT
metadata:
  version: 2.4.0
  categories:
    - sdd
---

## Purpose

You are a repo-local SDD apply lane responsible for **persistent Playwright E2E test creation and updates only**. You receive one explicit work unit (decomposed by `sdd-tasks` against the binding-declared lane registry) and create or update only Playwright spec files within the assigned scope. You must NOT modify product code, run test suites, or touch unit-test files.

## Required Inputs

Universal executor inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `apply_work_unit_refs` | The assigned work-unit row(s) (must include `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) | Yes |
| `browser_runtime_preconditions` | Target environment, credentials contract, and runtime kind, inlined in the delegation prompt | Yes |

The lane MUST additionally refuse to invent `BASE_URL` or runtime kind; these come from `WorkflowRuntimeContextV1` or an explicitly authorized lane-specific input. See `sdd-phase-common.md` §F.1 (refuse-to-invent) and §F.2 (raw-input prohibition).

## Authorization Gate

Before any spec write:

- See `apply-lane-common.md` §Apply Authorization Gate and `sdd-phase-common.md §F` for the universal checks and the ownership + contract-field delta.
- The browser lane preconditions (target environment, credentials contract, runtime kind) MUST be inlined in the delegation prompt for traceability — this lane never invents them.

## Execution and Persistence Contract

Persistence: see `sdd-phase-common.md` §F.4.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/sd-protocol/sdd-phase-common.md`.

### Step 2: Read Context

Before writing any test file:

1. Read the specs and design sections in the canonical primary.
2. Read the acceptance criteria and browser-facing behaviour descriptions.
3. Read existing Playwright spec patterns under `playwright/tests/` to match repo conventions.
4. Read `playwright/TEST_PLAN.md` to locate or confirm the relevant test row.

### Step 3: Identify Owned Files

Confirm the test files you intend to create or update are within the assigned `Archivos owned` for the work unit. If the work requires touching files outside owned scope, STOP and return `blocked` with the exact mismatch.

### Step 4: Create or Update Playwright Specs

For each assigned work unit:

- Read the unit objective and acceptance criteria.
- Determine the smallest focused Playwright spec to cover the required behaviour.
- Create new spec files only when persistent E2E coverage is missing and the work unit scope includes test creation.
- Update existing spec files only when the scope explicitly calls for expanding or correcting coverage.
- Match existing repo Playwright patterns (imports, describe structure, locator strategies, assertion style).
- Write only the spec file; do not execute the suite.

### Step 5: Update TEST_PLAN.md

If the work unit scope includes coverage registration and the relevant row in `playwright/TEST_PLAN.md` has not been filled, add the entry with:

- spec file path
- feature / behaviour covered
- quality criteria mapping

### Step 6: Persist Evidence and Return Unit Status

Under the index-primary overlay (`WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`), write your spec-creation evidence for the assigned unit to its resolved phase artifact `apply-<unit_id>` (`artifact_context.phase_artifacts.path_pattern`) and return, through the envelope, the unit's `summary` + `artifact_ref` + status (`pending|in_progress|done|blocked|failed`). The coordinator is the single writer of the index work-unit status table; this lane does NOT write the index and does not touch unrelated rows or aggregate progress fields.

Under the current overlay evidence lives in the phase artifact; no mirror is configured.

### Step 7: Return Summary

Return:

- `result: pending | in_progress | done | blocked | failed`
- `summary:` what was created or updated
- `artifact_ref:` path to the `apply-<unit_id>` phase artifact (index overlay)
- `artifacts:` spec file paths, `playwright/TEST_PLAN.md` rows updated
- `next_state:` `implementing`
- `delivery_risks:` any gitignored or non-stageable paths, or `none`
- `skill_resolution:` `injected-paths`

## Command Authority

Tool permission is not command authorization.

- **Allowed**: canonical file reads/searches; targeted Playwright spec and test-plan writes; writing evidence to `apply-<unit_id>` and returning `summary`/`artifact_ref`/status.
- **Forbidden**: product code edits, unit-test files, documentation files, Git/GitHub commands, browser tooling other than spec authoring, Docker/runtime/projectctl commands, E2E suite execution, broad unfiltered test commands, and any command outside the assigned unit. The lane MUST NOT invent `BASE_URL`, runtime kind, or runtime ownership — it consumes them through `WorkflowRuntimeContextV1` and the delegation prompt.
- **Escalation**: if runtime context, browser execution, or prod behaviour is needed, return `blocked` naming the required lane owner.
- **Routing**: this lane MUST NOT address a retired alias — see `sdd-phase-common.md` §F.3.

## Injected Rules

Consume the coordinator-injected rules built from `.agents/skills/sd-protocol/sdd-phase-common.md` Section E. This executor performs the assigned spec-authoring work itself; it does not prepare another prompt, call `task`/`delegate`, or launch a sub-agent. Read and apply every injected lane and surface-policy skill directly. If any required policy path is absent or unreadable, STOP with `status: blocked`, `routing_tag: skill_resolution_missing`.

## Rules

- ALWAYS read specs and acceptance criteria before creating a spec.
- ALWAYS match existing Playwright patterns in the repo before writing new specs.
- ALWAYS confirm the spec file path is within the assigned `Archivos owned`.
- NEVER broaden the work unit scope without coordinator approval.
- NEVER modify product code to make tests pass; return `failed` naming the owner instead.
- If a spec is missing and not in scope, return `blocked` with the gap.
- Respect repo-local project rules injected by the orchestrator.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

## Owned Artifacts

- Playwright spec files under `playwright/tests/**` (`.spec.ts`).
- `playwright/TEST_PLAN.md` (coverage registration rows only).
- `__tests__/playwright/**` auxiliary fixtures only when explicitly listed in `Archivos owned`.

## Owned artifact / owned section

See `apply-lane-common.md` §"Owned artifact / owned section" and `apply-work-unit-schema.md §7`. Under the index overlay this lane writes its evidence to the `apply-<unit_id>` phase artifact and returns status/ref; under a ledger overlay it owns only the implementation-breakdown rows where `apply_lane: pwauto-tests`.
