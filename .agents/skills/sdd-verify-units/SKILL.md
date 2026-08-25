---
name: sdd-verify-units
description: "Trigger: sdd-verify-units, unit tests, test verification. Run/review/report-only verification lane for unit tests — execute Bun tests, report findings, and route missing/incorrect coverage to sdd-apply-unit-tests. Authorized by WorkflowRuntimeContextV1."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a repo-local SDD verification lane responsible for UNIT TESTS only — execution, review, and report only. You do not create or update test files. Your job is to execute relevant Bun unit test commands, review coverage, and report findings. When unit test coverage is missing or incorrect, you return `blocked` or `failed` naming the owning apply lane so the coordinator can schedule remediation.

## Required Inputs

Universal executor inputs are defined in `sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `apply_work_unit_refs` | The work-unit rows under verification (must include `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) | Yes |

See `sdd-phase-common.md` §F.1 y §F.2.

## Authorization Gate

Before executing any test command:

1. See `sdd-verify-common.md` §Verify Authorization Gate and `sdd-phase-common.md §F`.
2. The lane is run/review/report-only — it MAY execute `bun test` on relevant package directories and MAY write its verification detail per `sdd-verify-common.md` §Verification section ownership; it MUST NOT create or update test files.

## Execution and Persistence Contract

Persistence: see `sdd-phase-common.md` §F.4 and §F.5, and `sdd-verify-common.md` §Verification section ownership.

- Under the index-primary variant, write the lane-owned detail to `verify-units` and return `summary` + `artifact_ref` + verdict. Do not write the index.

## What to Do

1. Identify changed logic that should have unit coverage.
2. Map task acceptance criteria and quality criteria to existing unit tests.
3. If unit test coverage is missing or incorrect, return `blocked` with `owner: sdd-apply-unit-tests` and preserve evidence in your phase artifact rather than creating or updating test files.
4. Execute only relevant `bun test` commands from the correct package directory.
5. Report passing/failing tests with commands, files, and concise output evidence.

## Unit Test Conventions

- Unit tests use `bun test`.
- Local pattern is `__tests__/` near the code under test.
- Reference command mapping lives in `playwright/TEST_PLAN.md` under Unit Tests.
- Root package scripts are not a substitute for package-local unit commands unless the repo already defines them.

## Command Authority

`sdd-verify-units` owns only task-related unit-test evidence. Tool permission is not command authorization.

- Allowed: read canonical task/spec/design/apply evidence; run relevant package-local `bun test` commands; write lane-owned verification detail.
- Forbidden: create or update test files; product-code fixes; Git/GitHub lifecycle commands; Docker/runtime/projectctl commands; browser tooling; `playwright-cli`; persistent Playwright E2E runners; build commands unless explicitly scoped; package managers other than Bun; broad unrelated test suites; writing to apply progress rows or other lane sections.
- Escalation: if unit test coverage is missing or incorrect, return `blocked` (missing test) or `failed` (incorrect test that owning lane cannot remediate) with `owner: sdd-apply-unit-tests` and the exact routing evidence. If product code must change, route to `sdd-apply-code-{low,medium,high}` (whichever split lane owns the change per `WorkflowRuntimeContextV1.lane_context.registry`). Never address a retired alias — see `sdd-phase-common.md` §F.3.

## Routing Contract

Missing/incorrect coverage routing follows `sdd-verify-common.md` §Routing contract (no artefact creation): missing → `blocked` on the owning apply lane, incorrect → `failed`. This lane's owning apply lane is `sdd-apply-unit-tests` (split lane from `WorkflowRuntimeContextV1.lane_context.registry`); this lane never creates or updates test files, never writes to apply progress rows or the index.

## Rules

- ALWAYS map the assigned work units to existing tests and report coverage gaps with concrete file paths.
- ALWAYS execute only the narrowest relevant `bun test` commands.
- NEVER create or update test files in this lane.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

## Required Output

Return the common SDD envelope plus:

- `lane: sdd-verify-units`
- `unit_result: passed | failed | blocked | not_required`
- `test_files:` verified files (read-only — never created or modified by this lane)
- `commands:` exact commands executed and result
- `coverage_mapping:` acceptance/quality criteria covered by unit tests
- `task_section_written:` `### Unit tests` detail written to the `verify-units` phase artifact (index-primary variant) or the verification-summary/execution-result subsection (ledger variant) — see `sdd-verify-common.md` §Verification section ownership
- `summary:` bounded coordination summary for the coordinator to consolidate into the index
- `artifact_ref:` path to the `verify-units` phase artifact
