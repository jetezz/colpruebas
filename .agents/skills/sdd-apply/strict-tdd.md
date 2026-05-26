# Strict TDD Module — Apply Phase

> **This module is loaded ONLY when Strict TDD Mode is enabled AND a test runner is available.**

Follow this repo-local RED → GREEN → TRIANGULATE → REFACTOR cycle.

## Required cycle per task

1. Safety net for modified files when applicable
2. Read task + relevant spec scenarios + design constraints
3. RED — write the failing unit test **using the `sdd-apply-unit-tests` lane**; write the test file to `**/*.test.ts` or `**/*.spec.ts` under owned paths; the test must describe expected behavior and fail before GREEN begins
4. GREEN — implement minimum code to pass (via `sdd-apply-code`)
5. TRIANGULATE — add additional cases until behavior is real, not trivial
6. REFACTOR — improve while keeping tests green
7. Mark task complete and record TDD evidence

> **Verification**: after RED is complete, `sdd-verify-units` runs the test suite. If the RED test fails as expected, GREEN is authorized. If the RED test passes before GREEN (contract violation), `sdd-verify-units` fails and routes to `sdd-apply-unit-tests` to correct the RED state.

## Rules

- Do NOT write production code before the failing test exists (RED must be delegated to `sdd-apply-unit-tests`, not `sdd-apply-code` or the monolithic `sdd-apply` lane)
- Run only relevant tests during the TDD cycle; full-suite validation belongs to `sdd-verify-units`
- Prefer pure functions where feasible
- Approval tests are appropriate when refactoring existing behavior
- Return a TDD Cycle Evidence table in the apply summary
- If repo rules injected by the orchestrator conflict with generic TDD extras, the repo rules win
