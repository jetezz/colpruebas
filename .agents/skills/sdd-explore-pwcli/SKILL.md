---
name: sdd-explore-pwcli
description: "Trigger: sdd-explore-pwcli, browser exploration, Playwright CLI investigation, runtime preflight. Explore browser behavior with PW-CLI after resolving browser runtime context. Authorized by WorkflowRuntimeContextV1; never invent runtime defaults."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a repo-local SDD lane responsible for **exploratory browser investigation only**. You observe real browser behaviour, UI state, or runtime symptoms through `playwright-cli`. You do not create persistent tests and you do not claim verification closure.

## Required Inputs

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | Coordinator injection; complete bounded snapshot | Yes |
| `artifact_refs` | Primary artefact resolved by context; route under investigation provided by coordinator | Yes |
| `workflow_context_ref.lane_context` | Coordinator confirms this lane id is in `WorkflowRuntimeContextV1.lane_context.registry` and `WorkflowRuntimeContextV1.lane_context.allowed_lanes` | Yes |
| `browser_runtime_preconditions` | Resolved target environment + credentials contract + runtime kind (`root-docker` / `managed-project`) inlined by the coordinator; never invented | Yes |
| `output_artifact` | Phase-artifact key resolved from `WorkflowRuntimeContextV1.artifact_context.phase_artifacts` this lane writes: `explore-pwcli` | Yes |

Universal Required Inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F.1`; the rows above declare only the lane-specific additions (including `browser_runtime_preconditions`). The lane MUST refuse to invent `BASE_URL`, commands, credentials, runtime ownership, branch, status, phase, mirror, or topic values. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`.

## Authorization Gate

The universal authorization steps (validated resolver context; this lane id present in `lane_context.registry` + `allowed_lanes`; the `explore-pwcli` key present in `artifact_context.phase_artifacts.artifact_keys`) are defined in `.agents/skills/sd-protocol/sdd-phase-common.md §F`. Lane-specific addition:

- Browser lane preconditions (target environment + credentials contract + runtime kind) MUST be present in the delegation prompt; missing any precondition produces the named failure mode (`browser-target-missing`, `browser-credentials-missing`, `runtime-kind-unknown`) and the lane returns `blocked`.

There is no fallback lane, no implicit `BASE_URL`, and no recovery command invented from local defaults.

## Hard Rules

See `.agents/skills/sd-protocol/explorer-rules.md` §Common Hard Rules and §Lane-specific decision gates. Lane-specific rules for this lane (browser preconditions, exploration-only `playwright-cli`, no verification closure, no code/research broadening): `explorer-rules.md` §Lane-specific Hard Rules > sdd-explore-pwcli.

Retired aliases are governed by `sdd-phase-common.md §F.3`; route only by addressing split lanes present in `WorkflowRuntimeContextV1.lane_context.registry`.

## Command Authority

Browser exploration is limited to `playwright-cli` after trusted preflight. Write `explore-pwcli`, return `summary` + `artifact_ref`, and never write the primary index.

## Decision Gates

See `.agents/skills/sd-protocol/explorer-rules.md` §Lane-specific decision gates. Routing references address the split exploration lanes by their exact identifiers as declared in `WorkflowRuntimeContextV1.lane_context.registry`.

## Execution Steps

1. Read the canonical primary artefact (`WorkflowRuntimeContextV1.task_ref.path`) and identify the route, flow, or UI question.
2. Confirm this lane is in `WorkflowRuntimeContextV1.lane_context.allowed_lanes`; if not, return `blocked`.
3. Verify Browser lane preconditions from the delegation prompt + the artefact's exploration/validation section; if any is missing, stop with the named blocker (`browser-target-missing` / `browser-credentials-missing` / `runtime-kind-unknown`).
4. If all preconditions pass, use `playwright-cli` to inspect the target flow.
5. Record exploratory findings, visible states, console/runtime issues, and blockers without converting them into final verification claims.
6. Write full detail to `explore-pwcli` and return `summary` + `artifact_ref`; the coordinator writes the index.

## Output Contract

Return the common SDD envelope plus:

- `lane: sdd-explore-pwcli`
- `browser_preconditions:` resolved target environment, runtime kind, `baseUrl`, allowed commands, credentials source, and evidence (or the named blocker)
- `pwcli_exploration_result: passed | failed | blocked | not_required`
- `flow_explored:` exact route/flow
- `artifact_ref: <path to the explore-pwcli phase artifact written>`
- `summary: <bounded coordination summary for the index per-phase table>`

Envelope summary/artifact_ref semantics come from `WorkflowRuntimeContextV1.envelope_context`.

## References

- `.agents/skills/sd-protocol/sdd-phase-common.md`
- `.agents/skills/sd-protocol/workflow-runtime-context.md`
- `.agents/skills/sd-protocol/explorer-rules.md`
- The active binding block in `references/tareas.md` §`task-flow-binding`
- Resolved preconditions inlined in the delegation prompt (project target env file + credentials contract)
