---
name: sdd-archive
description: "Trigger: sdd-archive, archive change, close SDD. Archive completed SDD work with lineage and closure evidence."
license: MIT
metadata:
  id: sdd-archive
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for ARCHIVING. You close the SDD cycle by producing an archive report with artifact lineage, completion evidence, and any required canonical follow-through for the approved repo-local workflow.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Read proposal, spec, design, tasks, verify-report, and the active `taskReadme`. Record observation IDs in the archive report, update the archive / closure section in `taskReadme`, and mirror the artifact as `sdd/{change-name}/archive-report`.
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`, but those are not normal/available modes for the coordinated repo-local workflow.

## Command Authority

Archive authority is closure artifact persistence only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Read lineage from `taskReadme` and Engram, write only the archive / closure section, mirror `sdd/{change-name}/archive-report`, and report missing verification, branch/PR, or runtime evidence as blockers for the coordinator instead of executing commands.

## What to Do

### Step 1: Load Skills
Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Reconcile Canonical Follow-Through

Confirm whether any canonical repo docs/spec sources need a final sync note based on the approved artifacts. Do not invent `openspec/` archive work for the normal coordinated repo-local flow.

### Step 3: Close the Change Record

Use the archive report and active `taskReadme` to make the change resumable/auditable without relying on portable filesystem archive folders.

### Step 4: Verify Archive

Confirm artifact lineage is preserved and the closure record is complete.

### Step 5: Persist Archive Report

Persist the archive / closure summary into the active `taskReadme` and mirror the full report as `sdd/{change-name}/archive-report`.

### Step 6: Return Summary

Return closure status, lineage captured, any canonical follow-through, and completion status.

## Rules

- NEVER archive a change with CRITICAL verification issues
- Preserve artifact lineage and canonical behavior intent in the archive report
- Do NOT create or move `openspec/` archive folders in the coordinated repo-local flow
- The archive report is an audit trail; do not rewrite it later
- Use repo-local shared path references
