---
name: sdd-design
description: "Trigger: sdd-design, technical design, architecture. Write or update design decisions for an SDD change. Authorized by WorkflowRuntimeContextV1; phase-gated by binding."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a sub-agent responsible for TECHNICAL DESIGN. You write all design detail into the `design` phase artifact and return a bounded summary + artifact_ref through the envelope.

## Required Inputs

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | Coordinator injection | Yes |
| `artifact_refs` | Primary path resolved by `WorkflowRuntimeContextV1.task_ref.path`; target section identifier from `WorkflowRuntimeContextV1.task_ref.heading_owners` | Yes |
| `workflow_context_ref.lane_context` | Coordinator confirms this lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and `WorkflowRuntimeContextV1.lane_context.allowed_lanes` for the active phase | Yes |
| `proposal_ref` + `spec_ref` | Foundational artefacts in canonical primary or configured mirror | Yes |
| `output_artifact` | Phase-artifact key resolved from `WorkflowRuntimeContextV1.artifact_context.phase_artifacts` this lane writes: `design` | Yes |

Universal Required Inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F.1`; the rows above declare only the lane-specific additions. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`.

## Authorization Gate

The universal authorization steps (validated resolver context; this lane id present in `lane_context.registry` + `allowed_lanes`; the `design` key present in `artifact_context.phase_artifacts.artifact_keys`) are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F`.

## Execution and Persistence Contract

> Execution and persistence follow `.agents/skills/sd-protocol/sdd-phase-common.md §F.4` and, under the index-primary variant, `§F.5`.

- Read proposal and spec artefacts through the resolved phase artifacts / configured mirror; write ALL design detail — including the backend-impact analysis that previously went to §12 — as subsections inside the single resolved `design` phase artifact, and return a bounded `summary` + `artifact_ref` through the envelope (§D); NOT the primary index — the coordinator is the single writer of the index.

## Command Authority

Design authority is analysis and design writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Inspect relevant repo files, write only the `design` phase artifact, return `summary` + `artifact_ref`, and record out-of-phase actions.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/sd-protocol/sdd-phase-common.md`.

### Step 2: Read the Codebase

Inspect the actual code that will be affected. Use only paths and identifiers from `WorkflowRuntimeContextV1`.

### Step 3: Write the design artefact

Use this structural shape (only structure is universal):

- Technical Approach
- Architecture Decisions
- Data Flow
- File Changes
- Interfaces / Contracts
- Testing Strategy
- Migration / Rollout
- Backend impact analysis (as a subsection of this same `design` phase artifact — this replaces the former separate §12)
- Open Questions

### Step 4: Persist Artefact

Write all design detail (including the backend-impact subsection) to the resolved `design` phase artifact per `sdd-phase-common.md §F.5`; do not write the primary index (the coordinator owns it).

### Step 5: Return Summary

Return key decisions, affected files, testing strategy, open questions, and `artifact_ref`.

## Rules

- ALWAYS read the actual codebase before designing.
- Every decision MUST have rationale.
- Include concrete file paths.
- Follow repo patterns over generic preferences.
- Use repo-local paths and conventions.
- Do NOT invent a routing target, fallback, or operational default from a retired alias (see `sdd-phase-common.md §F.3`). Routing references in this file MUST address split lanes declared in `WorkflowRuntimeContextV1.lane_context.registry` by their exact identifiers.
