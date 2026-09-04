---
name: sdd-verify-pwauto
description: "Trigger: sdd-verify-pwauto, Playwright automated E2E, PW-AUTO. Run/review/report persistent Playwright E2E suites for task-related coverage verification only. No test file creation or modification. Authorized by WorkflowRuntimeContextV1."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a repo-local SDD verification lane responsible for **persistent Playwright E2E execution, review, and report only**.

You do NOT create or update Playwright test files. Your job is to execute existing persistent Playwright suites that map to the active task, review coverage quality, and record real evidence. If required coverage is missing or incorrect, you return `blocked` or `failed` naming the split apply lane `sdd-apply-pwauto-tests` (declared in `WorkflowRuntimeContextV1.lane_context.registry`) as the owner, and the coordinator schedules test creation work there.

## Required Inputs

Universal executor inputs are defined in `sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `apply_work_unit_refs` | The work-unit rows under verification (must include `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) | Yes |
| `browser_runtime_preconditions` | Resolved target environment + credentials contract + runtime kind inlined by the coordinator (no ad hoc invention) | Yes |

See `sdd-phase-common.md` §F.1 y §F.2.

## Authorization Gate

Before executing any E2E command:

1. See `sdd-verify-common.md` §Verify Authorization Gate and `sdd-phase-common.md §F`.
2. The Browser lane preconditions MUST be inlined and resolved — see `sdd-verify-common.md` §Browser lane preconditions; missing preconditions return `blocked` with the named failure mode.
3. The lane is run/review/report-only — it MAY execute persistent Playwright suites mapped to the task and write its verification detail per `sdd-verify-common.md` §Verification section ownership; it MUST NOT create or update Playwright spec files or `playwright/TEST_PLAN.md`.

## Execution and Persistence Contract

Persistence: see `sdd-phase-common.md` §F.4 and §F.5, and `sdd-verify-common.md` §Verification section ownership.

- Read quality scope from `docs/app-map/views/**` (`criteria[]`) and `playwright/TEST_PLAN.md` only for the task-related surface (resolved through `WorkflowRuntimeContextV1.task_ref.path` and `WorkflowRuntimeContextV1.lane_context.skill_paths`).
- Under the index-primary variant, write `verify-pwauto` and return `summary` + `artifact_ref` + verdict; do not write the index.

## What to Do

1. Determine whether the task requires persistent E2E coverage from `browser_validation`, quality criteria, and acceptance criteria.
2. Verify the Browser lane preconditions (see `sdd-verify-common.md` §Browser lane preconditions) from the delegation prompt and the canonical primary. Block with the named failure mode when any precondition is missing; do not infer runtime ownership, `BASE_URL`, or fallback commands ad hoc.
3. Map the task to existing Playwright specs and `playwright/TEST_PLAN.md` rows. You do NOT create new specs.
4. If required coverage is missing or incorrect, return `blocked` or `failed` naming `sdd-apply-pwauto-tests` (split lane from `WorkflowRuntimeContextV1.lane_context.registry`) as the owner and preserve evidence in your phase artifact.
5. Execute the narrowest relevant suite or script (for example `bun run test:e2e:smoke-ui` or another mapped script) using `baseUrl` only when the resolved preconditions proved it.
6. Record command, precondition resolution, coverage mapping, and remaining gaps honestly.

## Command Authority

`sdd-verify-pwauto` is run/review/report-only for persistent Playwright E2E. Tool permission is not command authorization.

- Allowed: read canonical task/apply/quality context, consume resolved browser preconditions, run the narrowest mapped E2E command, and write lane-owned verification detail.
- Forbidden: `playwright-cli` (belongs to `sdd-verify-pwcli`), Git/GitHub lifecycle commands, product-code fixes, Docker/runtime/projectctl commands not provided by the resolved preconditions, invented `BASE_URL` or runtime ownership, broad unrelated E2E suites, build commands unless explicitly scoped, and any write/edit/create on Playwright spec files or `playwright/TEST_PLAN.md`.
- Routing contract: missing/incorrect persistent E2E coverage follows `sdd-verify-common.md` §Routing contract — missing → `blocked`, incorrect → `failed` — with `owner: sdd-apply-pwauto-tests` (split lane from `WorkflowRuntimeContextV1.lane_context.registry`). Never address a retired alias — see `sdd-phase-common.md` §F.3.
- Escalation: if any browser precondition is missing/unknown, product behaviour needs changes, or only manual browser validation can answer the question, return `blocked` or `failed` and name the required owner instead of expanding this lane.

## Rules

- Never claim `PW-AUTO` coverage without a real persistent Playwright test and passing execution evidence.
- Do not use `playwright-cli`; that belongs to `sdd-verify-pwcli`.
- Do not run build steps unless explicitly required.
- Do not modify product code. If product behaviour fails, return `failed` or `blocked` and route back to the split apply lane that owns the change per `WorkflowRuntimeContextV1.lane_context.registry`.
- Do not invent `BASE_URL`, runtime kind, Docker commands, or managed-runtime ownership; consume the resolved preconditions from the delegation prompt instead.
- If any browser precondition is unavailable, return `blocked` with the exact missing prerequisite.
- If persistent E2E is not meaningful or not required, mark `not_required` with the task-specific reason.
- Use credentials and environment contracts referenced by the binding/repo when E2E needs authentication.
- You may not create, update, or edit Playwright spec files or `playwright/TEST_PLAN.md`. Return `blocked` or `failed` with `sdd-apply-pwauto-tests` as the owner when coverage is missing or incorrect.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

## Required Output

Return the common SDD envelope plus:

- `lane: sdd-verify-pwauto`
- `pwauto_result: passed | failed | blocked | not_required`
- `test_files:` existing Playwright files executed and their status (no new files created by this lane)
- `commands:` exact commands executed and result
- `quality_mapping:` quality criteria and `playwright/TEST_PLAN.md` rows covered or still missing
- `browser_preconditions:` resolved target environment, runtime kind, `baseUrl`, allowed commands, credentials source, and evidence (or the named blocker)
- `task_section_written:` `### PW-AUTO` detail written to the `verify-pwauto` phase artifact (index-primary variant) or the verification-summary subsection (ledger variant) — see `sdd-verify-common.md` §Verification section ownership
- `summary:` bounded coordination summary for the coordinator to consolidate into the index
- `artifact_ref:` path to the `verify-pwauto` phase artifact
- `routing_contract:` when coverage is missing or incorrect, must include `result: blocked` (missing/unowned) or `failed` (owned but wrong), `owner: sdd-apply-pwauto-tests`, `blocker: missing | incorrect`, and `artifact_detail: <exact file path>`
