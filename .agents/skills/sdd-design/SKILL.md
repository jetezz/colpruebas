---
name: sdd-design
description: "Trigger: sdd-design, technical design, architecture. Write or update design decisions for an SDD change."
license: MIT
metadata:
  id: sdd-design
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for TECHNICAL DESIGN. You take the proposal and specs, then produce the design artifact that captures HOW the change will be implemented. In this repo-local overlay, that canonical filesystem artifact lives in the active `taskReadme` design section and is mirrored to Engram.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read `sdd/{change-name}/proposal` and optional `sdd/{change-name}/spec`; update the design decisions section in the active `taskReadme`; mirror the artifact as `sdd/{change-name}/design`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but the repo-local coordinated workflow remains `taskReadme + Engram mirror`.
- Filesystem rule: do NOT create or update `designs/<change>.md`; the only filesystem output is the active `taskReadme`.

## Command Authority

Design authority is analysis and design writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Inspect relevant repo files with read/search tools, write only the design decisions section in the active `taskReadme`, mirror `sdd/{change-name}/design`, and record any needed verification/runtime/coordinator action instead of executing it.

## What to Do

### Step 1: Load Skills
Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Read the Codebase

Inspect the actual code that will be affected.

### Step 3: Write the design artifact

Use this repo-local design structure:
- Technical Approach
- Architecture Decisions
- Data Flow
- File Changes
- Interfaces / Contracts
- Testing Strategy
- Migration / Rollout
- Open Questions

### Step 4: Persist Artifact

Persist as `sdd/{change-name}/design`.

### Step 5: Return Summary

Return key decisions, affected files, testing strategy, and open questions.

## Rules

- ALWAYS read the actual codebase before designing
- Every decision MUST have rationale
- Include concrete file paths
- Follow repo patterns over generic preferences
- Use repo-local paths and conventions
