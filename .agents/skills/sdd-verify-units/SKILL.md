---
name: sdd-verify-units
description: "Trigger: sdd-verify-units, unit tests, test verification. Run/review/report-only verification lane for unit tests — execute Bun tests, report findings, and route missing/incorrect coverage to sdd-apply-unit-tests."
license: MIT
metadata:
  id: sdd-verify-units
  version: 1.0.0
---

## Purpose

You are a repo-local SDD verification lane responsible for UNIT TESTS only — execution, review, and report only. You do not create or update test files. Your job is to execute relevant Bun unit test commands, review coverage, and report findings. When unit test coverage is missing or incorrect, you return `blocked` or `failed` naming the owning apply lane so the coordinator can schedule remediation.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- Read the active `taskReadme` first.
- Read specs, design, implementation progress, changed files, and validation requirements from `taskReadme + Engram mirror`.
- Write only the `### Unit tests` subsection under `## 15. Resumen de verificación SDD`.
- Update `## 14. Resultado de ejecución > ### Tests persistentes / verificación SDD` only when the unit lane is the source of that evidence and no other lane owns the same row.
- Mirror the full lane report to Engram as `sdd/{change-name}/verify-units`.
- Do not update the consolidated verification result; that belongs to the coordinator.
- Do not create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`.

## What to Do

1. Identify changed logic that should have unit coverage.
2. Map task acceptance criteria and quality criteria to existing unit tests.
3. If unit test coverage is missing or incorrect, return `blocked` with owner `sdd-apply-unit-tests` and preserve evidence in taskReadme rather than creating or updating test files.
4. Execute only relevant `bun test` commands from the correct package directory.
5. Report passing/failing tests with commands, files, and concise output evidence.

## Unit Test Conventions

- Unit tests use `bun test`.
- Local pattern is `__tests__/` near the code under test.
- Reference command mapping lives in `playwright/TEST_PLAN.md` under Unit Tests.
- Root package scripts are not a substitute for package-local unit commands unless the repo already defines them.

## Command Authority

`sdd-verify-units` owns only task-related unit-test evidence. Tool permission is not command authorization.

- Allowed: read task/spec/design/apply evidence; run only relevant package-local `bun test` commands from the correct package directory; write lane-owned verification subsection to taskReadme and Engram mirror.
- Forbidden: create or update test files; product-code fixes; Git/GitHub lifecycle commands; Docker/runtime/projectctl commands; browser tooling; `playwright-cli`; persistent Playwright E2E runners; build commands unless explicitly scoped; package managers other than Bun; broad unrelated test suites; writing to apply progress rows or other lane sections.
- Escalation: if unit test coverage is missing or incorrect, return `blocked` (missing test) or `failed` (incorrect test that owning lane cannot remediate) with `owner: sdd-apply-unit-tests` and the exact routing evidence. If product code must change, route to `sdd-apply-code`.

## Routing Contract

When unit test coverage is missing or incorrect, this lane does **not** create or update test files. Instead it returns a structured blocker and lets the coordinator schedule remediation.

| Finding | Lane returns | `owner` | Coordinator action |
|---------|-------------|---------|-------------------|
| Unit test coverage completely absent | `blocked` | `sdd-apply-unit-tests` | Coordinator launches `sdd-apply-unit-tests` to create test |
| Unit test exists but is incorrect (fails in a way owning lane can fix) | `failed` | `sdd-apply-unit-tests` | Coordinator launches `sdd-apply-unit-tests` to correct test |

Lane never writes to `## 10` apply progress rows, never writes to apply-lane Engram topics, and never creates test files.

## Required Output

Return the common SDD envelope plus:

- `lane: sdd-verify-units`
- `unit_result: passed | failed | blocked | not_required`
- `test_files:` created, modified, or verified files
- `commands:` exact commands executed and result
- `coverage_mapping:` acceptance/quality criteria covered by unit tests
- `task_section_written: ## 15. Resumen de verificación SDD > ### Unit tests`
- `engram_topic_key: sdd/{change-name}/verify-units`
