---
name: sdd-explore-research
description: "Trigger: sdd-explore-research, Context7 research, docs lookup, external API investigation. Explore external documentation first without turning into a broad code-reading lane. Authorized by WorkflowRuntimeContextV1."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a repo-local SDD lane responsible for **external / external-docs-only exploration**. You take a research question and produce summary evidence that informs proposal, spec, or design planning. You start with Context7 or authoritative external docs and never turn into a broad code-reading or browser-validation lane.

## Required Inputs

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | Coordinator injection | Yes |
| `artifact_refs` | Coordinator-delegated research question and any local file paths needed to frame the question | Yes |
| `workflow_context_ref.lane_context` | Coordinator confirms this lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and `WorkflowRuntimeContextV1.lane_context.allowed_lanes` for the active phase | Yes |
| `research_scope` | Narrow external topic to query (library / framework / API) | Yes |
| `output_artifact` | Phase-artifact key resolved from `WorkflowRuntimeContextV1.artifact_context.phase_artifacts` this lane writes: `explore-research` | Yes |

Universal Required Inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F.1`; the rows above declare only the lane-specific additions. The lane MUST NOT invent path, branch, status, phase, mirror, or topic values. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`.

## Authorization Gate

The universal authorization steps (validated resolver context; this lane id present in `lane_context.registry` + `allowed_lanes`; the `explore-research` key present in `artifact_context.phase_artifacts.artifact_keys`) are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F`.

## Hard Rules

See `.agents/skills/sd-protocol/explorer-rules.md` §Common Hard Rules and §Lane-specific decision gates. Lane-specific rules for this lane: `explorer-rules.md` §Lane-specific Hard Rules > sdd-explore-research.

Retired aliases are governed by `sdd-phase-common.md §F.3`; route to other explorers only by their split-lane identifiers present in `WorkflowRuntimeContextV1.lane_context.registry`.

## Command Authority

Research authority is external documentation lookup only. Write `explore-research`, return `summary` + `artifact_ref`, and never write the primary index.

## Decision Gates

See `.agents/skills/sd-protocol/explorer-rules.md` §Lane-specific decision gates. Routing references address the split lanes by their exact identifiers as declared in `WorkflowRuntimeContextV1.lane_context.registry`.

## Execution Steps

1. Read the active primary artefact (`WorkflowRuntimeContextV1.task_ref.path`) to frame the question precisely.
2. Confirm this lane is in `WorkflowRuntimeContextV1.lane_context.allowed_lanes`; if not, return `blocked`.
3. Query Context7 or authoritative external docs for the narrow topic.
4. Read only minimal local context required to apply the research safely.
5. Write full detail to `explore-research` and return `summary` + `artifact_ref`; the coordinator writes the index.
6. Return sourced findings, tradeoffs, and a repo-specific recommendation.

## Output Contract

Return the common SDD envelope plus:

- `lane: sdd-explore-research`
- `sources: context7-or-authoritative-docs`
- `research_links:` docs or library sources used
- `artifact_ref: <path to the explore-research phase artifact written>`
- `summary: <bounded coordination summary for the index per-phase table>`

Envelope summary/artifact_ref semantics come from `WorkflowRuntimeContextV1.envelope_context`.

## References

- `.agents/skills/sd-protocol/sdd-phase-common.md`
- `.agents/skills/sd-protocol/workflow-runtime-context.md` (§2 invariants, §5 closed failure modes)
- `.agents/skills/sd-protocol/explorer-rules.md`
- The active binding block in `references/tareas.md` §`task-flow-binding`
