---
name: sdd-apply-pwauto-tests
description: "Trigger: sdd-apply-pwauto-tests, playwright test creation, PW-AUTO test apply. Create or update persistent Playwright E2E specs only."
license: MIT
metadata:
  id: sdd-apply-pwauto-tests
  version: 1.0.0
---

## Purpose

You are a repo-local SDD apply lane responsible for **persistent Playwright E2E test creation and updates only**. You receive one explicit work unit from the active `taskReadme` (mirrored to Engram) and create or update only Playwright spec files within the assigned scope. You must NOT modify product code, run test suites, or touch unit-test files.

## What You Receive

- Change name and `task_id`
- The specific apply work unit(s) to implement (from `## 10. Desglose de implementación / progreso SDD`)
- The allowed file paths or narrow globs (`Archivos owned`)
- Unit-specific Engram topic key (e.g. `sdd/{change}/apply-pwauto-tests-{unit-id}`)
- Artifact store mode: `taskReadme + Engram mirror`

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read proposal, spec, design, tasks, and the active `taskReadme`. Mark implementation progress in the `## 10. Desglose de implementación / progreso SDD` row, mirror unit completion in Engram under `sdd/{change}/apply-pwauto-tests-{unit-id}`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but those are not normal modes for the repo-local coordinated path.
- Filesystem rule: do NOT create or update `proposals/`, `specs/`, `designs/`, or `tasks/` artifacts; the only filesystem output for SDD state is the active `taskReadme`.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Read Context

Before writing any test file:
1. Read the specs and design sections in the active `taskReadme`
2. Read the acceptance criteria and browser-facing behavior descriptions
3. Read existing Playwright spec patterns under `playwright/tests/` to match repo conventions
4. Read `playwright/TEST_PLAN.md` to locate or confirm the relevant test row

### Step 3: Identify Owned Files

Confirm the test files you intend to create or update are within the assigned `Archivos owned` for the work unit. If the work requires touching files outside owned scope, STOP and return `blocked` with the exact mismatch.

### Step 4: Create or Update Playwright Specs

For each assigned work unit:
- Read the unit objective and acceptance criteria
- Determine the smallest focused Playwright spec to cover the required behavior
- Create new spec files only when persistent E2E coverage is missing and the work unit scope includes test creation
- Update existing spec files only when the scope explicitly calls for expanding or correcting coverage
- Match existing repo Playwright patterns (imports, describe structure, locator strategies, assertion style)
- Write only the spec file; do not execute the suite

### Step 5: Update TEST_PLAN.md

If the work unit scope includes coverage registration and the relevant row in `playwright/TEST_PLAN.md` has not been filled, add the entry with:
- spec file path
- feature / behavior covered
- quality criteria mapping

### Step 6: Mark Unit Complete

Update only the assigned unit row in `## 10. Desglose de implementación / progreso SDD`:
- Set `Estado` to `done`
- Record the created or modified spec file paths

Do not update unrelated rows or aggregate progress fields.

### Step 7: Mirror to Engram

Persist the unit result to Engram under the unit-specific topic key.
Do not write to aggregate `apply-progress` topics.

### Step 8: Return Summary

Return:
- `result: done | blocked | failed`
- `summary:` what was created or updated
- `artifacts:` spec file paths, taskReadme section updated
- `next_state:` `implementing`
- `delivery_risks:` any gitignored or non-stageable paths, or `none`
- `skill_resolution:` `paths-injected`

## Command Authority

Tool permission is not command authorization.

- **Allowed**: file reads/searches for SDD context; targeted writes/creates of Playwright spec files under `playwright/tests/`; targeted writes to `playwright/TEST_PLAN.md`; Engram read/write mirror; narrow spec-preview checks when explicitly authorized by work unit.
- **Forbidden**: product code edits, unit-test files (`**/*.test.ts`, `**/*.spec.ts`), documentation files, Git/GitHub commands, browser tooling other than spec authoring, Docker/runtime/projectctl commands, E2E suite execution, broad unfiltered test commands, and any command outside the assigned unit.
- **Escalation**: if runtime context, browser execution, or prod behavior is needed, return `blocked` naming the required lane owner.

## Injected Block Template

```md
## Skills to load before work
- Read these exact skill files before reading, writing, reviewing, testing, or creating artifacts:
  - `.agents/skills/_shared/sdd-phase-common.md`
  - `.agents/skills/sdd-apply-pwauto-tests/SKILL.md`

## Command Authority
- Allowed command categories: file reads/searches, Playwright spec writes/creates, TEST_PLAN.md updates, Engram mirror.
- Forbidden command categories: product code changes, unit-test files, docs, Git/GitHub, Docker/runtime commands, E2E suite execution, browser tooling outside spec authoring.
- Escalate/block instead of running out-of-authority commands: report needed coordinator action or lane owner.
- Owned taskReadme section(s): `## 10. Desglose de implementación / progreso SDD` — pwauto-test creation rows; Engram topic(s): `sdd/{change}/apply-pwauto-tests-{unit-id}`.

## Project Rules (mandatory)
- SDD execution mode is `auto`.
- Repo-local persistence contract is `taskReadme + Engram mirror`.
- The active `taskReadme` is the ONLY canonical operational + filesystem source of truth.
- Do NOT create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`.
- Use Engram as the mandatory mirror/recovery/search backend.
- If Engram is unavailable, preserve the artifact in taskReadme, record the exact mirror failure, and return `blocked`.
- Never modify product code. If product behavior issues are discovered, return `blocked` naming `sdd-apply-code`.
- Never run test suites. Executing E2E suites belongs to `sdd-verify-pwauto` only.
```

## Rules

- ALWAYS read specs and acceptance criteria before creating a spec
- ALWAYS match existing Playwright patterns in the repo before writing new specs
- ALWAYS confirm the spec file path is within the assigned `Archivos owned`
- NEVER broaden the work unit scope without coordinator approval
- NEVER modify product code to make tests pass; return `failed` naming the owner instead
- If a spec is missing and not in scope, return `blocked` with the gap
- Respect repo-local project rules injected by the orchestrator
