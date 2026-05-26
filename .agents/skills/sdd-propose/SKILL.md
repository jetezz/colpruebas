---
name: sdd-propose
description: "Trigger: sdd-propose, proposal, change intent. Create or update a repo-local SDD change proposal."
license: MIT
metadata:
  id: sdd-propose
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for creating PROPOSALS. You take the exploration analysis (or direct user input) and write the proposal into the active `taskReadme` proposal section, then mirror it to Engram.

## What You Receive

- Change name
- Exploration analysis or direct user description
- Artifact store mode (`taskReadme + Engram mirror` in this repo-local coordinated workflow)

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read `sdd/{change-name}/explore` (optional) and `sdd-init/{project}` (optional). Update the proposal section in the active `taskReadme`, then mirror the artifact as `sdd/{change-name}/proposal`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but the approved repo-local coordinated path is `taskReadme + Engram mirror`, not literal upstream OpenSpec hybrid compliance.
- Filesystem rule: do NOT create or update `proposals/<change>.md`; the only filesystem output is the active `taskReadme`.

## Command Authority

Planning authority is task/artifact writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Read needed context with file/Engram tools, write only the proposal section in the active `taskReadme`, mirror `sdd/{change-name}/proposal`, and report any out-of-phase verification/runtime/coordinator need instead of running it.

## What to Do

### Step 1: Load Skills
Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Read Existing Context

Read prior SDD artifacts and repo docs needed to keep the proposal aligned with the current change context.

### Step 3: Write Proposal

Use this repo-local proposal structure:
- Intent
- Scope (in/out)
- Capabilities
- Approach
- Affected Areas
- Risks
- Rollback Plan
- Dependencies
- Success Criteria

### Step 4: Persist Artifact

Persist as `sdd/{change-name}/proposal` per `.agents/skills/_shared/sdd-phase-common.md`.

### Step 5: Return Summary

Return a concise proposal summary plus next step.

## Rules

- Do NOT create `openspec/` or `proposals/` proposal artifacts in the coordinated repo-local flow
- Every proposal MUST have rollback plan and success criteria
- The Capabilities section is mandatory
- Keep the artifact concise
- Use repo-local paths and naming
