---
name: sdd-spec
description: "Trigger: sdd-spec, write specs, delta specs. Write requirements and scenarios for an SDD change. Authorized by WorkflowRuntimeContextV1; phase-gated by binding."
license: MIT
metadata:
  id: sdd-spec
   version: 3.0.0
  contract_ref: WorkflowRuntimeContextV1
---

## Purpose

You are a sub-agent responsible for writing SPECIFICATIONS. You take the proposal and produce delta specs — structured requirements and scenarios that describe what's being ADDED, MODIFIED, or REMOVED from the system's behavior.

## Required Inputs

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | sdd-orchestrator injection | Yes |
| `artifact_refs` | Primary path resolved by `WorkflowRuntimeContextV1.task_ref.path`; target section identifier from `WorkflowRuntimeContextV1.task_ref.heading_owners` | Yes |
| `workflow_context_ref.lane_context` | sdd-orchestrator confirms this lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and `WorkflowRuntimeContextV1.lane_context.allowed_lanes` for the active phase | Yes |
| `proposal_ref` | Proposed change summary (in canonical primary artefact or mirror) | Yes |
| `output_artifact` | Phase-artifact key resolved from `WorkflowRuntimeContextV1.artifact_context.phase_artifacts` this lane writes: `spec` | Yes |

Universal Required Inputs are defined in `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md §F.1`; the rows above declare only the lane-specific additions. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`.

## Authorization Gate

The universal authorization steps (validated resolver context; this lane id present in `lane_context.registry` + `allowed_lanes`; the `spec` key present in `artifact_context.phase_artifacts.artifact_keys`) are defined in `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md §F`.

## Execution and Persistence Contract

> Execution and persistence follow `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md §F.4` and, under the index-primary variant, `§F.5`.

- Read the proposal from the resolved phase artifacts / configured mirror; write the specs/delta-requirements detail into the resolved `spec` phase artifact and return a bounded `summary` + `artifact_ref` through the envelope (§D); NOT the primary index — `sdd-orchestrator` is the single writer of the index.

## Command Authority

Specification authority is requirements writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Read canonical artifacts with file tools, write only the `spec` phase artifact, return `summary` + `artifact_ref`, and report out-of-phase needs.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md`.

### Step 2: Identify Affected Domains

Read the approved canonical criteria delta first and map its IDs/owners to domains and scenarios; then use Capabilities for supporting context. Follow `.agents/skills/projectctl-sdd/references/criteria-integration.md`. Never assign task-local AC IDs. Additional acceptance changes require proposal revision, not silent spec expansion.

### Step 3: Read Existing Specs

Read any existing canonical specs (in the configured primary or mirror) before writing deltas.

### Step 4: Write Specs

Use this structural shape:

- Delta format with ADDED / MODIFIED / REMOVED requirements
- Full spec format for new domains
- Given/When/Then scenarios
- RFC 2119 keywords

The structure is universal; concrete coverage is read from proposal/spec inputs and bounded context.

Include exactly one `criteria-links` fence (`criteria-links/v1`) with the exact approved canonical `criteria` set and `scenarios: [{id, criterion_ids}]`. Cover every affected/maintained ID, including retirement, with concrete Given/When/Then scenarios. Scenario IDs identify scenarios, never substitute criterion IDs. Cite the approved delta/bundle definition rather than declaring another current product catalog.

### Step 5: Persist Artefact

Write the specs detail to the resolved `spec` phase artifact per `sdd-phase-common.md §F.5`; do not write the primary index (`sdd-orchestrator` owns it).

### Step 6: Return Summary

Return domains written, coverage notes, `artifact_ref`, and next step.

## Rules

- ALWAYS use Given/When/Then.
- ALWAYS use RFC 2119 keywords.
- MODIFIED requirements must copy the full requirement block before editing.
- If no existing spec exists for a domain, write a full spec.
- Use repo-local paths and conventions.
- Do NOT invent a routing target, fallback, or operational default from a retired alias (see `sdd-phase-common.md §F.3`).
