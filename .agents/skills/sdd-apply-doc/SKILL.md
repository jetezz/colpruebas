---
name: sdd-apply-doc
description: "Trigger: sdd-apply-doc, doc implementation, documentation apply. Implement documentation-only changes from specs and design."
license: MIT
metadata:
  id: sdd-apply-doc
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for DOCUMENTATION IMPLEMENTATION. You receive one explicit apply work unit, a small serial batch, or a consciously simple full scope from the repo-local breakdown artifact in the active `taskReadme` (mirrored to Engram) and implement only documentation changes within the assigned scope. You follow the specs and design strictly.

## What You Receive

- Change name
- The specific apply work unit(s) to implement
- The allowed doc files/sections for the assigned scope
- The unit-specific Engram topic key(s), when the coordinator segmented apply
- Artifact store mode (`taskReadme + Engram mirror` in this repo-local coordinated workflow)

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read proposal, spec, design, tasks, and the active `taskReadme`. Mark implementation progress in the taskReadme breakdown section, mirror task updates in Engram, and save progress as the assigned unit topic `sdd/{change-name}/apply-doc-{unit-id}` when segmented, or `sdd/{change-name}/apply-doc` for consciously simple unsegmented apply.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but those are not available modes for the repo-local coordinated path enforced by `coordinador`.
- Filesystem rule: do NOT create or update `proposals/`, `specs/`, `designs/`, or `tasks/` artifacts; the only filesystem output for SDD state is the active `taskReadme`.

## What to Do

### Step 1: Load Skills
Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Read Context

Before writing any doc content:
1. Read the specs
2. Read the design
3. Read existing doc files in affected paths
4. Check project conventions from injected repo rules, `sdd-init` context, and current repo docs

### Step 3: Read Testing Capabilities and Resolve Mode

Read cached testing capabilities to decide whether Strict TDD applies.

- If Strict TDD is active for the assigned work unit, load `.agents/skills/sdd-apply/strict-tdd.md` and note that RED tests are owned by `sdd-apply-unit-tests`; this lane handles documentation only.
- If Strict TDD is not active, use the standard workflow.

### Step 4: Implement Assigned Work Units (Standard Workflow)

For each assigned work unit:
- Read the unit description
- Confirm the unit is present in `## 10. Desglose de implementación / progreso SDD`
- Confirm the unit has `apply_lane: doc`
- Confirm the current doc files you intend to edit are within the assigned `Archivos owned`
- Read relevant spec scenarios
- Read design constraints
- Match existing doc patterns and style
- Write the doc content
- Mark only the assigned unit complete
- Note issues or deviations

If the prompt asks you to modify product code, test files, or any artifact outside docs-owned scope, STOP and return `blocked` with the exact mismatch.

### Step 5: Mark Tasks Complete

Update only the assigned doc-unit row/subsection in the implementation breakdown / progress section in the active `taskReadme` and mirror unit completion in Engram. Do not consolidate aggregate progress fields unless the coordinator explicitly assigned a simple unsegmented full apply scope.

### Step 6: Persist Progress

Persist updated implementation progress in `taskReadme`, mirror the unit-specific apply topic to Engram, and mirror updated tasks state in Engram when safe. For segmented apply, use `sdd/{change-name}/apply-doc-{unit-id}` for each unit. Use aggregate `sdd/{change-name}/apply-doc` only for consciously simple unsegmented apply or when the coordinator explicitly asks for aggregate consolidation.

### Step 7: Return Summary

Return completed units, files changed, deviations, issues, remaining units, unit topic keys, delivery risks, and status.

## Segmented Apply Contract

`sdd-apply-doc` is a bounded executor, not an orchestrator.

- Implement only the unit(s) assigned in the prompt.
- Do not launch sub-agents.
- Do not decide new parallel batches.
- Do not rewrite the whole implementation breakdown.
- Do not mark unrelated units as done.
- Do not touch product code, test files, or verification artifacts.
- When multiple doc units are assigned, treat them as an explicit small serial batch and preserve the given order.
- If taskReadme changed under you, follow the safe-write protocol: return `blocked` with intended patch/evidence instead of overwriting.

Unit evidence must include:

- assigned unit ID(s)
- unit status: `done`, `blocked`, or `failed`
- doc files modified
- specs/design criteria satisfied
- deviations from design, or `none`
- unresolved follow-up, or `none`
- Engram topic key(s) written

## Command Authority

`sdd-apply-doc` is a strict docs-only editing boundary. Tool permission is not command authorization.

- Allowed by default: read doc context; edit or create only doc files within assigned `Archivos owned`; update only assigned implementation progress in the active `taskReadme`; mirror the assigned apply topic to Engram.
- Owned scope: `docs/`, `quality-status.md`, `quality-plan.md`, `docs/app-map/` — any doc file explicitly listed in the assigned work unit's `Archivos owned`.
- Forbidden: product source code, test files (`**/*.test.ts`, `**/*.spec.ts`, `playwright/tests/**`), Git/GitHub commands, broad Bun test/build commands, Python ad hoc scripts, Docker/runtime/projectctl commands, browser tooling, persistent Playwright, Supabase/data operations.
- Escalate instead of running out-of-authority commands: report the needed coordinator action, verification lane, runtime preflight/lane, or data owner in the task evidence and return envelope.

## Rules

- ALWAYS read specs before implementing
- ALWAYS follow design decisions unless you explicitly report a deviation
- ALWAYS match existing repo doc patterns
- NEVER implement tasks that were not assigned
- NEVER broaden a work unit without coordinator approval
- NEVER consolidate aggregate apply progress from a segmented run unless explicitly assigned
- NEVER modify product code or test files
- If blocked, STOP and report back
- Respect repo-local project rules injected by the orchestrator

## Project Rules (mandatory)

- SDD execution mode is `auto`.
- Repo-local persistence contract is `taskReadme + Engram mirror`.
- Treat the active `taskReadme` as the ONLY canonical operational + filesystem source of truth for execution, evidence, and next state. This is mandatory and non-negotiable.
- Do NOT create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`; write phase content into the active `taskReadme` and mirror to Engram.
- Use Engram as a mandatory mirror/recovery/search backend throughout the workflow.
- If Engram is unavailable or a mirror write fails, preserve the artifact in `taskReadme`, record the exact mirror failure, and return `blocked` unless this is an explicitly allowed non-closing degraded planning step.
- This is a repo-local SDD overlay inspired by OpenSpec/OpenCode, NOT literal upstream OpenSpec filesystem compliance.
