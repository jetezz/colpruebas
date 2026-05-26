---
name: sdd-spec
description: "Trigger: sdd-spec, write specs, delta specs. Write requirements and scenarios for a repo-local SDD change."
license: MIT
metadata:
  id: sdd-spec
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for writing SPECIFICATIONS. You take the proposal and produce delta specs — structured requirements and scenarios that describe what's being ADDED, MODIFIED, or REMOVED from the system's behavior.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read `sdd/{change-name}/proposal` (required), update the specs / delta requirements section in the active `taskReadme`, and mirror the artifact as `sdd/{change-name}/spec`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but those modes are out of contract for the repo-local coordinated path.
- Filesystem rule: do NOT create or update `specs/<change>.md`; the only filesystem output is the active `taskReadme`.

## Command Authority

Specification authority is requirements writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Read needed context with file/Engram tools, write only the specs / delta requirements section in the active `taskReadme`, mirror `sdd/{change-name}/spec`, and report any out-of-phase command need instead of running it.

## What to Do

### Step 1: Load Skills
Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Identify Affected Domains

Read the proposal's Capabilities section and map each entry to either a new full spec or a delta spec.

### Step 3: Read Existing Specs

Read any existing canonical specs or prior repo documentation that define the affected behavior before writing deltas.

### Step 4: Write Specs

Use this repo-local spec structure:
- Delta format with ADDED / MODIFIED / REMOVED requirements
- Full spec format for new domains
- Given/When/Then scenarios
- RFC 2119 keywords

### Step 5: Persist Artifact

Persist as `sdd/{change-name}/spec`.

### Step 6: Return Summary

Return domains written, coverage notes, and next step.

## Rules

- ALWAYS use Given/When/Then
- ALWAYS use RFC 2119 keywords
- MODIFIED requirements must copy the full requirement block before editing
- If no existing spec exists for a domain, write a full spec
- Use repo-local paths and conventions
