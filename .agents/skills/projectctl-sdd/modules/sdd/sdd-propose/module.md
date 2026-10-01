---
name: sdd-propose
description: "Trigger: sdd-propose, proposal, change intent. Create or update an SDD change proposal. Authorized by WorkflowRuntimeContextV1; phase-gated by binding."
license: MIT
metadata:
  id: sdd-propose
   version: 3.0.0
  contract_ref: WorkflowRuntimeContextV1
---

## Purpose

You are a sub-agent responsible for creating PROPOSALS. You write the proposal into its phase artifact (`proposal`) and return a bounded summary + artifact_ref through the envelope.

## Required Inputs

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | sdd-orchestrator injection | Yes |
| `artifact_refs` | Primary path resolved by `WorkflowRuntimeContextV1.task_ref.path`; target section identifier from `WorkflowRuntimeContextV1.task_ref.heading_owners` | Yes |
| `workflow_context_ref.lane_context` | sdd-orchestrator confirms this lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and `WorkflowRuntimeContextV1.lane_context.allowed_lanes` for the active phase | Yes |
| `proposal_inputs` | Exploration summary and/or direct user description | Yes |
| `output_artifact` | Phase-artifact key resolved from `WorkflowRuntimeContextV1.artifact_context.phase_artifacts` this lane writes: `proposal` | Yes |

Universal Required Inputs are defined in `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md §F.1`; the rows above declare only the lane-specific additions. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`.

## Authorization Gate

The universal authorization steps (validated resolver context; this lane id present in `lane_context.registry` + `allowed_lanes`; the `proposal` key present in `artifact_context.phase_artifacts.artifact_keys`) are defined in `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md §F`. Lane-specific addition:

- Before launching this lane, the approval gate resolved from `WorkflowRuntimeContextV1.gate_context` (see `.agents/skills/projectctl-sdd/modules/sd-protocol/acceptance-criteria-gates.md`) MUST have been validated by `sdd-orchestrator`; otherwise `sdd-orchestrator` records the resolved gate id in the problems section and this lane does not run.

## Execution and Persistence Contract

> Execution and persistence follow `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md §F.4` and, under the index-primary variant, `§F.5`.

- Write the proposal detail into the resolved `proposal` phase artifact and return a bounded `summary` + `artifact_ref` through the envelope (§D); NOT the primary index — `sdd-orchestrator` is the single writer of the index.

## Command Authority

Planning authority is task/artefact writing only: no shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, or build commands by default. Read canonical artifacts with file tools, write only the `proposal` phase artifact, return `summary` + `artifact_ref`, and report out-of-phase needs.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md` (skill loading resolves through `WorkflowRuntimeContextV1.lane_context.skill_paths`; this lane MUST NOT open `source.config_path`, `source.binding_path`, or `state_model_ref.path` to recover skill paths or registry data).

### Step 2: Read Existing Context

Read prior SDD artefacts (from the configured mirror or the canonical primary artefact) needed to keep the proposal aligned with the current change context.

Read the assigned navigation targets and their canonical App Map bundles through the injected core policy. Consume the orchestrator-provided baseline; compare actual definitions and owners. Missing/ambiguous targets or unreadable/duplicate criteria block proposal completion. Never mint task-local AC IDs or resolve criteria from the sample manifest.

### Step 3: Write Proposal

Use this proposal structure (the only structural constant for this lane):

- Intent
- Assigned view/feature, canonical bundles and baseline revision
- Canonical acceptance-criteria delta (primary decision section)
- Relevant maintained criteria
- Scope (in/out)
- Capabilities
- Approach
- Affected Areas
- Risks
- Rollback Plan
- Dependencies
- Success Criteria

The acceptance delta is mandatory. Its single structured authority is the `criteria-change/v1` fence defined in `.agents/skills/projectctl-sdd/references/criteria-integration.md` and validated by `scripts/project/criteria-change.ts`. Start from `assets/proposal-template.md`. Render one row per affected canonical ID:

```markdown
## Criterios delta (app-map)

| Operación | ID canónico | Bundle owner | Antes | Después | Justificación |
| --- | --- | --- | --- | --- | --- |
| añadir/modificar/eliminar/mantener | `<ID>` | `<bundle>` | `<before>` | `<after>` | `<reason>` |
```

Use identical IDs in fence, table and return. Existing IDs require the complete before definition. New IDs are definitive, not temporary aliases, and must not collide globally. Refactors preserving acceptance reference maintained IDs. A genuinely non-criteria task may have empty changes with `no_criteria_reason` and a resolved target. The proposal is a pending change request, not a replacement for canonical bundles; this lane does not edit them.

Concrete values (branch base, store adapter, status set, topic pattern, mirror adapter, phase id, close rule) come from `WorkflowRuntimeContextV1`; none is asserted as a local default in this file.

### Step 4: Persist Artefact

Write the proposal detail to the resolved `proposal` phase artifact per `sdd-phase-common.md §F.5`; do not write the primary index (`sdd-orchestrator` owns it).

### Step 5: Return Summary

Return a concise proposal `summary` plus `artifact_ref` and next step.

Also return the complete delta (added/modified/removed/maintained, before/after, owner and reason), or its exact fence reference for full retrieval. Never truncate decision content to the index summary budget. The orchestrator verifies and presents every change before approval.

## Rules

- Do NOT create `openspec/` or `proposals/` proposal artefacts in the coordinated flow.
- Every proposal MUST have rollback plan and success criteria.
- The Capabilities section is mandatory.
- Toda proposal MUST declarar su delta de criterios (añadir/eliminar/modificar con IDs) antes de Fase 2.
- Empty delta requires the structured justification above; no fabricated criteria.
- Keep the artefact concise.
- Use repo-local paths and naming.
- Do NOT invent a routing target, fallback, or operational default from a retired alias (see `sdd-phase-common.md §F.3`). Routing references in this file MUST address split lanes by their exact identifiers as declared in `WorkflowRuntimeContextV1.lane_context.registry`.
