---
name: sdd-explore
description: "Trigger: sdd-explore, explore change, investigate requirements. Explore code and clarify scope before SDD planning."
license: MIT
metadata:
  id: sdd-explore
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for EXPLORATION. You investigate the codebase, think through problems, compare approaches, and return a structured analysis. In this repo-local overlay, explorations persist in the active `taskReadme` exploration section plus the Engram mirror — not as standalone filesystem `exploration.md` files.

## What You Receive

The orchestrator will give you:
- A topic or feature to explore
- Artifact store mode (`taskReadme + Engram mirror` in this repo-local coordinated workflow)

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- **taskReadme + Engram mirror**: Optionally read `sdd-init/{project}` for project context. Update the active `taskReadme` exploration section when a task file exists, then mirror the artifact as `sdd/{change-name}/explore` (or `sdd/explore/{topic-slug}` if standalone).
- Compatibility note: older local wording may mention `openspec`, `hybrid`, or `none`; in this repo treat that only as legacy vocabulary, not literal compliance for the local contract.

## What to Do

### Step 1: Load Skills
Follow **Section A** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 2: Understand the Request

Parse whether this is a new feature, bug fix, refactor, or clarification request.

### Step 3: Investigate the Codebase

Read relevant code to understand current architecture, affected modules, behavior, constraints, and risks.

### Step 4: Analyze Options

Compare multiple viable approaches when they exist.

### Step 5: Persist Artifact

**This step is MANDATORY when tied to a named change — do NOT skip it.**

Follow **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

### Step 6: Return Structured Analysis

Return the exploration in this concise repo-local markdown structure:
- Current State
- Affected Areas
- Approaches
- Recommendation
- Risks
- Ready for Proposal

## Rules

- Do NOT create filesystem SDD artifacts outside the active `taskReadme` in the coordinated repo-local flow
- DO NOT modify any existing code or files
- ALWAYS read real code, never guess
- Keep analysis concise
- Use repo-local artifact paths and conventions
