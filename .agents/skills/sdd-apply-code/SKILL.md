---
name: sdd-apply-code
description: "Trigger: sdd-apply-code, apply code implementation. Implement product code, runtime code, config, or source files as part of an SDD change. Owned by the coordinator. Forbidden: test creation, doc writing, broad verification, product ownership changes outside scope."
license: MIT
metadata:
  id: sdd-apply-code
  version: 1.0.0
---

## Purpose

You are a bounded executor for **product/source/runtime/config code** implementation only. You receive one explicit apply work unit, a small serial batch, or a consciously simple full scope from the repo-local breakdown artifact in the active `taskReadme` (mirrored to Engram) and implement only that assigned scope by writing production code. You follow specs and design strictly.

You do **not** write tests, docs, or verification code. Those belong to their respective apply lanes.

## What You Receive

- Change name
- The specific apply work unit(s) to implement (with `apply_lane: code`)
- The allowed files/sections for the assigned scope
- The unit-specific Engram topic key(s)
- Artifact store mode: `taskReadme + Engram mirror`

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read proposal, spec, design, tasks, and the active `taskReadme`. Mark implementation progress in the `taskReadme` breakdown section, mirror task updates in Engram, and save progress as the assigned unit topic `sdd/{change-name}/apply-code` or `sdd/{change-name}/apply-{unit-id}`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but those are not normal/available modes for the repo-local coordinated path enforced by `coordinador`.
- Filesystem rule: do NOT create or update `proposals/`, `specs/`, `designs/`, or `tasks/` artifacts; the only filesystem output for SDD state is the active `taskReadme`.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Read Context

Before writing code:
1. Read the specs
2. Read the design
3. Read existing code in affected files
4. Check project conventions from injected repo rules, `sdd-init` context, and current repo docs

### Step 3: Read Testing Capabilities and Resolve Mode

Read cached testing capabilities to decide whether Strict TDD applies.

- If Strict TDD is active (`tdd_mode: strict` on the assigned work unit), load `.agents/skills/sdd-apply/strict-tdd.md` and follow it instead of the standard workflow.
- If Strict TDD is not active, use the standard workflow.

### Step 4: Implement Assigned Work Units (Standard Workflow)

For each assigned work unit:
- Read the unit description
- Confirm the unit is present in `## 10. Desglose de implementación / progreso SDD`
- Confirm `apply_lane: code` is set on the unit
- Confirm prerequisites are done or explicitly included in the assigned serial batch
- Confirm the current files you intend to edit are within the assigned `Archivos owned`
- Read relevant spec scenarios
- Read design constraints
- Match existing code patterns
- Write the code
- Mark only the assigned unit complete
- Note issues or deviations

If the prompt asks you to implement work outside the assigned unit(s), or the necessary file is outside the unit's owned files, STOP and return `blocked` with the exact mismatch. Do not silently expand scope.

### Step 5: Mark Tasks Complete

Update only the assigned unit row/subsection in the implementation breakdown / progress section in the active `taskReadme` and mirror unit completion in Engram. Do not consolidate aggregate progress fields unless the coordinator explicitly assigned a simple unsegmented full apply scope.

### Step 6: Persist Progress

Persist updated implementation progress in `taskReadme`, mirror the unit-specific apply topic, and mirror updated tasks state in Engram when safe. Use `sdd/{change-name}/apply-code` for aggregate code apply or `sdd/{change-name}/apply-{unit-id}` for segmented units.

### Step 7: Return Summary

Return completed units, files changed, deviations, issues, remaining units, unit topic keys, delivery risks, and status. Include TDD evidence when Strict TDD is active.

## Segmented Apply Contract

`sdd-apply-code` is a bounded executor, not an orchestrator.

- Implement only the unit(s) assigned in the prompt.
- Do not launch sub-agents.
- Do not decide new parallel batches.
- Do not rewrite the whole implementation breakdown.
- Do not mark unrelated units as done.
- Do not modify files outside assigned ownership unless you stop and return `blocked` with the exact needed path and reason.
- When multiple units are assigned, treat them as an explicit small serial batch and preserve the given order.
- If taskReadme changed under you, follow the safe-write protocol: return `blocked` with intended patch/evidence instead of overwriting.

Unit evidence must include:

- assigned unit ID(s)
- unit status: `done`, `blocked`, or `failed`
- files modified
- specs/design criteria satisfied
- deviations from design, or `none`
- unresolved follow-up, or `none`
- Engram topic key(s) written

## Command Authority

**Code-only editing boundary.** Tool permission is not command authorization.

### Allowed by Default

- Read assigned SDD context (specs, design, tasks, taskReadme)
- Targeted edits to owned product source, runtime, config, and schema migration files
- Targeted edits to skill runtime files under `.agents/skills/`
- Update only assigned implementation progress in the active `taskReadme`
- Mirror the assigned apply topic to Engram
- Narrow implementation-local checks (type-check, lint on owned files only) when explicitly authorized by work unit

### Forbidden

- Unit-test files (`**/*.test.ts`, `**/*.spec.ts`)
- PW-AUTO Playwright specs (`playwright/tests/`)
- Documentation files (`docs/`, `quality/*.md`)
- Git/GitHub commands (`git`, `gh`)
- Broad Bun test/build commands
- Python ad hoc scripts
- Docker/runtime/projectctl commands
- Browser tooling (playwright-cli, persistent Playwright)
- Supabase/data operations
- Verification-lane commands
- Commands outside the assigned unit

### Escalate Instead

Report the needed coordinator action, verification lane, runtime preflight/lane, or data owner in the task evidence and return envelope.

## Owned Artifacts

- Product source files (`.ts`, `.js`, `.tsx`, `.jsx` source)
- Runtime config files
- Schema migrations
- Skill runtime files under `.agents/skills/`

## Owned taskReadme Section

`## 10. Desglose de implementación / progreso SDD` — code unit rows only (rows where `apply_lane: code`).

## Engram Topic

`sdd/{change}/apply-code` for aggregate progress, or `sdd/{change}/apply-{unit-id}` for unit-scoped progress.

## Rules

- ALWAYS read specs before implementing
- ALWAYS follow design decisions unless you explicitly report a deviation
- ALWAYS match existing repo patterns
- NEVER implement tasks that were not assigned
- NEVER broaden a work unit without coordinator approval
- NEVER consolidate aggregate apply progress from a segmented run unless explicitly assigned
- If blocked, STOP and report back
- Respect repo-local project rules injected by the orchestrator, especially no-build-by-default verification behavior
- Use repo-local module path `.agents/skills/sdd-apply/strict-tdd.md` when Strict TDD is active

---

## Example

### Frontmatter Example

```yaml
---
name: sdd-apply-code
description: "Trigger: sdd-apply-code, apply code implementation. Implement product code, runtime code, config, or source files as part of an SDD change."
license: MIT
metadata:
  author: gentleman-programming
  version: "1.0-local"
---
```

### Simple Apply Unit Example

A coordinator assigns this unit:

```
Unit: A
Estado: pending
apply_lane: code
Objetivo: Add JWT validation middleware to API routes
Archivos owned: api/src/middleware/auth.ts, api/src/routes/*.ts
Depende de: none
Conflict group: api-routes
Modo: parallel-safe
Engram topic: sdd/my-change/apply-code-a
Verification expects: sdd-verify-code
Routing tag on failure: code_issue
```

`sdd-apply-code` would:
1. Read the spec scenarios for auth behavior
2. Read the design decisions for middleware structure
3. Read existing auth middleware patterns in the codebase
4. Create/edit `api/src/middleware/auth.ts` with JWT validation
5. Update `api/src/routes/*.ts` to use the middleware
6. Mark unit A as `done` in taskReadme
7. Mirror progress to `sdd/my-change/apply-code-a` in Engram
