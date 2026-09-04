---
name: sdd-verify-code
description: "Trigger: sdd-verify-code, code review, technical debt verification. Review implementation quality against specs, design, repo skills, hierarchy, duplication, deprecated APIs, and maintainability. Authorized by WorkflowRuntimeContextV1; never assume project defaults."
license: MIT
metadata:
  version: 2.3.0
  categories:
    - sdd
---

## Purpose

You are a repo-local SDD verification lane responsible for CODE REVIEW only.

Your job is to verify that the implementation is technically coherent, maintainable, and aligned with the active task, specs, design decisions, and applicable repo-local skills. You are not a test runner lane and you are not a browser validation lane.

## Required Inputs

Universal executor inputs are defined in `sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `apply_work_unit_refs` | The work-unit rows under review (must include `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) | Yes |
| `lane_skill_path` | Mandatory verification skill at `WorkflowRuntimeContextV1.lane_context.lane_skill_path`; it MUST identify this lane skill | Yes |
| `surface_skill_paths` | Exact surface-policy paths from `WorkflowRuntimeContextV1.lane_context.surface_skill_paths` | Yes |

See `sdd-phase-common.md` §F.1 y §F.2.

## Authorization Gate

Before reading or judging code:

1. See `sdd-verify-common.md` §Verify Authorization Gate and `sdd-phase-common.md §F`.
2. The unit being reviewed MUST have all four mandatory contract fields present and concrete; missing or vague fields return `code_review_result: blocked` and route to the planning lane with `routing_tag: tasks_contract_missing`.
3. The lane is review-only. It writes its `verify-code` phase artifact and returns `summary` + `artifact_ref` + verdict; the coordinator consolidates the verdict.

## Execution and Persistence Contract

Persistence: see `sdd-phase-common.md` §F.4 and §F.5, and `sdd-verify-common.md` §Verification section ownership.

- Under the index-primary variant, write the lane-owned detail to `verify-code` and return `summary` + `artifact_ref` + verdict. Do not write the index.

## What to Verify

0. Task contract completeness: the scoped unit has `Spec scenarios linked`, `Implementation contract`, `Verify expects`, and `Routing tag on failure`.
1. Scope coherence: changed files match the task, specs, design, and implementation plan.
2. Implementation contract satisfaction: changed code fulfills the unit's declared `Implementation contract` without relying on hidden assumptions.
3. Verification expectation satisfaction: each concrete `Verify expects` item is checked or explicitly marked as outside this lane.
4. Architecture coherence: implementation follows the applicable repo-local skills and hierarchy rules.
5. Maintainability: no avoidable duplication, over-abstraction, dead code, or unnecessary compatibility layer.
6. API and contract safety: no broken ownership/auth/runtime/data contracts for the touched surface.
7. Deprecated or risky usage: flag deprecated APIs, unsafe process execution, wrong auth helpers, or known repo anti-patterns.
8. Documentation/code drift: if docs or task claim behaviour not present in code, report it.

## Task Contract Gate

Before reviewing source code, inspect the assigned unit row/subsection in the canonical primary's implementation-breakdown section.

If any of these fields are missing or vague, return `code_review_result: blocked` and route to the planning lane with `routing_tag: tasks_contract_missing`:

- `Spec scenarios linked`: must name concrete spec scenario IDs/names, except explicit mechanical/non-behavioural units.
- `Implementation contract`: must name the concrete target files/symbols/routes/SQL/config/behaviour expected from apply.
- `Verify expects`: must contain concrete pass/fail checks. A lane name alone is not enough.
- `Routing tag on failure`: must identify the owning rework lane/tag.

Do not compensate for a missing task contract by reverse-engineering intent from the implementation. That recreates the apply/verify loop this contract is designed to prevent.

When the task contract is complete, use `Verify expects` as the review checklist. If a `Verify expects` item belongs to another lane, report it as `info` and route that evidence need to the appropriate verification lane instead of failing code review.

## Command Authority

`sdd-verify-code` is a review-only lane. Tool permission is not command authorization.

- Allowed: read the canonical primary, scoped mirror observations, changed files, and applicable repo-local skills/docs needed to judge hierarchy, maintainability, and policy compliance.
- Narrow exception: a tiny static command may be used only when the coordinator explicitly scopes it for this lane and it is necessary for code-review evidence.
- Forbidden by default: unit/E2E/browser test commands, build commands, Docker/runtime/projectctl commands, `playwright-cli`, persistent Playwright runners, Supabase/data operations, Git/GitHub lifecycle commands, and product/test/documentation fixes.
- Escalation: if verification needs executable evidence or a fix, return `blocked` or `failed` and route explicitly to the owning split apply lane (declared in `WorkflowRuntimeContextV1.lane_context.registry`) instead of running or editing out of authority. Never address a retired alias — see `sdd-phase-common.md` §F.3.

## Rules

- ALWAYS inspect actual changed source files relevant to the task.
- ALWAYS verify against the unit's `Implementation contract` and `Verify expects`.
- Do not execute unit, E2E, browser, build, or runtime commands unless the coordinator explicitly scopes this lane to a tiny static command.
- Do not modify product code. If you find implementation defects, report them as blockers for the owning split apply lane.
- Do not create tests; that belongs to `sdd-verify-units` or `sdd-verify-pwauto`.
- Classify findings by severity: `critical`, `warning`, `info`.
- Missing or vague task contract fields are `blocked`, not `failed`; route to the planning lane (`sdd-tasks`) with `routing_tag: tasks_contract_missing`.
- A passing code lane means no critical/warning issue blocks delivery for the scoped implementation.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

## Required Output

Return the common SDD envelope plus:

- `lane: sdd-verify-code`
- `code_review_result: passed | failed | blocked | not_required`
- `findings:` ordered by severity with file/line references when possible
- `contract_review:` list each task contract field and whether it was usable
- `verify_expectations_checked:` list each `Verify expects` item checked by this lane, with result
- `routing_tag:` `code_issue`, `tasks_contract_missing`, or another explicit coordinator route when blocked/failed
- `task_section_written:` `### Code review` detail written to the `verify-code` phase artifact (index-primary variant) or the verification-summary subsection (ledger variant) — see `sdd-verify-common.md` §Verification section ownership
- `summary:` bounded coordination summary for the coordinator to consolidate into the index
- `artifact_ref:` path to the `verify-code` phase artifact
