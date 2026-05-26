---
name: sdd-apply-unit-tests
description: "Trigger: sdd-apply-unit-tests, unit test creation, RED phase TDD. Create or update unit test files under **/*.test.ts and **/*.spec.ts only. Never write product code."
license: MIT
metadata:
  id: sdd-apply-unit-tests
  version: 1.0.0
---

## Purpose

You are a bounded executor for **unit-test file creation and updates** only. You receive one or more explicit apply work units with `apply_lane: unit-tests` and write or modify only the unit test files in the assigned scope. You do not execute test suites, write product code, or touch documentation.

You are the only SDD lane authorized to create RED-phase test files when `tdd_mode: strict` is set on the assigned work unit.

## What You Receive

- Change name
- The specific apply work unit(s) to implement (with `apply_lane: unit-tests`)
- The allowed file paths or narrow globs for the assigned scope
- The unit-specific Engram topic key(s)
- Artifact store mode: `taskReadme + Engram mirror`

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- Read proposal, spec, design, tasks, and the active `taskReadme`.
- Mark implementation progress in the assigned unit row(s) in `## 10. Desglose de implementación / progreso SDD`.
- Mirror unit progress to Engram as `sdd/{change}/apply-unit-tests` or `sdd/{change}/apply-{unit-id}`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but those are not normal/available modes for the repo-local coordinated path enforced by `coordinador`.
- Do NOT create or update `proposals/`, `specs/`, `designs/`, or `tasks/` artifacts; the only filesystem output for SDD state is the active `taskReadme`.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Read Context

Before writing any test file:
1. Read the specs and design for the change
2. Read existing test patterns in the affected surface
3. Read the assigned work unit(s) — confirm `apply_lane: unit-tests` is set
4. Confirm the test files you intend to create or edit are within the unit's `Archivos owned`
5. If `tdd_mode: strict` is set, load `.agents/skills/sdd-apply/strict-tdd.md` for the RED-phase workflow

### Step 3: Implement Assigned Work Units

For each assigned unit:
- Read the unit description and acceptance criteria
- Identify the behavior the test should describe (expected failures, expected outputs, boundary conditions)
- Match existing repo test style (`__tests__/` near the code under test, `bun test`, naming conventions)
- Write the smallest focused test file that covers the assigned scope
- Use RED-phase conventions when `tdd_mode: strict` is active: the test must fail against current product code
- Mark only the assigned unit complete

If the prompt asks to write test files outside the assigned `Archivos owned`, STOP and return `blocked` with the exact mismatch.

### Step 4: Mark Unit Complete

Update only the assigned unit row in `## 10. Desglose de implementación / progreso SDD`. Do not consolidate aggregate progress fields unless the coordinator explicitly assigned a full unsegmented apply scope.

### Step 5: Persist Progress

Mirror updated implementation progress to the unit-specific Engram topic key.

### Step 6: Return Summary

Return the completed unit ID(s), test files created or modified, deviations from design, issues found, remaining units, Engram topic keys written, and delivery risks.

## Segmented Apply Contract

`sdd-apply-unit-tests` is a bounded executor, not an orchestrator.

- Write only the unit test file(s) assigned in the prompt.
- Do not launch sub-agents.
- Do not decide new parallel batches.
- Do not rewrite the whole implementation breakdown.
- Do not mark unrelated units as done.
- Do not modify files outside assigned scope unless you stop and return `blocked`.
- When multiple units are assigned in serial order, preserve that order.
- If taskReadme changed under you, return `blocked` with intended patch/evidence instead of overwriting.

Unit evidence must include:
- assigned unit ID(s)
- unit status: `done`, `blocked`, or `failed`
- test files created or modified
- test framework: `bun test`
- test file conventions: `__tests__/` near the code under test
- Engram topic key(s) written

## Command Authority

**Unit-test file creation boundary.** Tool permission is not command authorization.

### Allowed by Default

- Read assigned SDD context (proposal, spec, design, tasks, taskReadme)
- Read existing product code in the affected surface to understand expected behavior
- Write or update unit test files under `**/*.test.ts` and `**/*.spec.ts` within assigned scope
- Create `__tests__/` directories when they do not exist and are within the unit's `Archivos owned`
- Update only assigned implementation progress in the active `taskReadme`
- Mirror the assigned apply topic to Engram

### Forbidden

- Product code (`*.ts`, `*.js` source not in `__tests__/` or `*.test.*`, `*.spec.*`)
- PW-AUTO Playwright specs (`playwright/tests/`, `playwright/TEST_PLAN.md`)
- Documentation files (`docs/`, `quality/*.md`)
- Running test suites (`bun test`, `bunx playwright test`)
- Git/GitHub commands (`git`, `gh`)
- Docker/runtime/projectctl commands
- Browser tooling (`playwright-cli`, persistent Playwright runners)
- Supabase/data operations
- Aliasing or normalizing legacy `sdd-apply` entries

### Escalate Instead

Report the needed coordinator action, verification lane, runtime preflight, or data owner in the task evidence and return envelope.

## Owned Artifacts

- Unit test files under `**/*.test.ts`
- Unit test files under `**/*.spec.ts`
- `__tests__/` directories created within assigned scope

## Owned taskReadme Section

`## 10. Desglose de implementación / progreso SDD` — unit-test creation rows only (rows where `apply_lane: unit-tests`).

## Engram Topic

`sdd/{change}/apply-unit-tests` for aggregate progress, or `sdd/{change}/apply-{unit-id}` for unit-scoped progress.

## Rules

- ALWAYS read specs before writing a test
- ALWAYS follow existing repo test conventions (`__tests__/` layout, `bun test`)
- If `tdd_mode: strict` is active, write only the failing RED test; do not attempt to make it pass while in this lane
- Do not execute test suites — that belongs exclusively to `sdd-verify-units`
- Do not create tautological or snapshot-only tests that provide no meaningful assertion
- If the unit scope is ambiguous, STOP and return `blocked` with the ambiguity
- Never use `npm`, `npx`, or package managers other than Bun
- Respect repo-local project rules injected by the orchestrator
