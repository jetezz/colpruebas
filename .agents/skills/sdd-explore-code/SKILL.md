---
name: sdd-explore-code
description: "Trigger: sdd-explore-code, code exploration, repo reading, implementation reconnaissance. Explore repository code only and summarize findings for SDD planning. Authorized by WorkflowRuntimeContextV1; never assume project defaults."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a repo-local SDD lane responsible for **code-only exploration**. You take an exploration question and produce summary evidence that informs proposal, spec, design, or task planning. You read repository files only and never modify them.

## Required Inputs

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | Coordinator injection (resolves the active binding + primary path) | Yes |
| `artifact_refs` | Primary path resolved by context; relevant source files proposed by coordinator | Yes |
| `workflow_context_ref.lane_context` | Coordinator confirms this lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and `WorkflowRuntimeContextV1.lane_context.allowed_lanes` for the active phase | Yes |
| `exploration_target` | Coordinator-delegated question: which files / functions / ownership boundaries to characterize | Yes |
| `output_artifact` | Phase-artifact key resolved from `WorkflowRuntimeContextV1.artifact_context.phase_artifacts` that this lane writes: `explore-code` | Yes |

Universal Required Inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F.1`; the rows above declare only the lane-specific additions. The lane MUST refuse to invent path, branch, status, phase, mirror, or topic values. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`.

## Authorization Gate

The universal authorization steps (validated resolver context; this lane id present in `lane_context.registry` + `allowed_lanes`; the `explore-code` key present in `artifact_context.phase_artifacts.artifact_keys`) are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F`. If any check fails, return `blocked` preserving `phase`/`state`/`status` from the active primary frontmatter (the coordinator handles the failure-mode identifier; see `workflow-runtime-context.md` §5).

## Hard Rules

See `.agents/skills/sd-protocol/explorer-rules.md` §Common Hard Rules and §Lane-specific decision gates. Lane-specific rules for this lane: `explorer-rules.md` §Lane-specific Hard Rules > sdd-explore-code.

Retired aliases are governed by `sdd-phase-common.md §F.3`; this lane never re-enumerates the retired-alias set. Consumers route only by addressing split lanes present in `WorkflowRuntimeContextV1.lane_context.registry`.

## Command Authority

Repo exploration authority is file read/search only. Write `explore-code`, return `summary` + `artifact_ref`, and never write the primary index.

## Decision Gates

See `.agents/skills/sd-protocol/explorer-rules.md` §Lane-specific decision gates. Routing references address the split lanes (`sdd-explore-code`, `sdd-explore-research`, `sdd-explore-pwcli`) by their exact identifiers as declared in `WorkflowRuntimeContextV1.lane_context.registry`.

## Execution Steps

1. Read the active primary artefact (`WorkflowRuntimeContextV1.task_ref.path`) plus the minimal proposal/design/task sections needed for scope.
2. Confirm this lane is in `WorkflowRuntimeContextV1.lane_context.allowed_lanes`; if not, return `blocked`.
3. Inspect only the repository files relevant to the question.
4. Summarize current state, affected areas, constraints, and risks from code evidence.
5. Write full detail to `explore-code` and return `summary` + `artifact_ref`; the coordinator writes the index.
6. Return concise exploration notes ready for the coordinator to summarise into the index.

## Output Contract

Return the common SDD envelope plus:

- `lane: sdd-explore-code`
- `sources: repo-files-only`
- `evidence_files:` exact files inspected
- `artifact_ref: <path to the explore-code phase artifact written>`
- `summary: <bounded coordination summary for the index per-phase table>`

Envelope summary/artifact_ref semantics come from `WorkflowRuntimeContextV1.envelope_context`.

## References

- `.agents/skills/sd-protocol/sdd-phase-common.md`
- `.agents/skills/sd-protocol/workflow-runtime-context.md` (§2 invariants, §3 binding keys, §4 shape, §5 closed failure modes)
- `.agents/skills/sd-protocol/explorer-rules.md`
- The active binding block in `references/tareas.md` §`task-flow-binding` (for concrete values this lane never asserts as universal)
