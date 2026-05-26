---
name: sdd-verify-code
description: "Trigger: sdd-verify-code, code review, technical debt verification. Review implementation quality against specs, design, repo skills, hierarchy, duplication, deprecated APIs, and maintainability."
license: MIT
metadata:
  id: sdd-verify-code
  version: 1.0.0
---

## Purpose

You are a repo-local SDD verification lane responsible for CODE REVIEW only.

Your job is to verify that the implementation is technically coherent, maintainable, and aligned with the active task, specs, design decisions, and applicable repo-local skills. You are not a test runner lane and you are not a browser validation lane.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- Read the active `taskReadme` first.
- Read proposal/spec/design/tasks/apply evidence from the active `taskReadme` and Engram mirror when available.
- Load exact repo-local skill paths injected by the coordinator before reading or judging code.
- Write only the `### Code review` subsection under `## 15. Resumen de verificación SDD`.
- Mirror the full lane report to Engram as `sdd/{change-name}/verify-code`.
- Do not update the consolidated verification result; that belongs to the coordinator.
- Do not create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`.

## What to Verify

1. Scope coherence: changed files match the task, specs, design, and implementation plan.
2. Architecture coherence: implementation follows the applicable repo-local skills and hierarchy rules.
3. Maintainability: no avoidable duplication, over-abstraction, dead code, or unnecessary compatibility layer.
4. API and contract safety: no broken ownership/auth/runtime/data contracts for the touched surface.
5. Deprecated or risky usage: flag deprecated APIs, unsafe process execution, wrong auth helpers, or known repo anti-patterns.
6. Documentation/code drift: if docs or task claim behavior not present in code, report it.

## Command Authority

`sdd-verify-code` is a review-only lane. Tool permission is not command authorization.

- Allowed: read the active task, task-scoped Engram mirrors, changed files, and applicable repo-local skills/docs needed to judge hierarchy, maintainability, and policy compliance.
- Narrow exception: a tiny static command may be used only when the coordinator explicitly scopes it for this lane and it is necessary for code-review evidence.
- Forbidden by default: unit/E2E/browser test commands, build commands, Docker/runtime/projectctl commands, `playwright-cli`, persistent Playwright runners, Supabase/data operations, Git/GitHub lifecycle commands, and product/test/documentation fixes.
- Escalation: if verification needs executable evidence or a fix, return `blocked` or `failed` and route explicitly to the owning apply lane (`sdd-apply-code`, `sdd-apply-doc`, `sdd-apply-unit-tests`, or `sdd-apply-pwauto-tests`) instead of running or editing out of authority.

## Rules

- ALWAYS inspect actual changed source files relevant to the task.
- Do not execute unit, E2E, browser, build, or runtime commands unless the coordinator explicitly scopes this lane to a tiny static command.
- Do not modify product code. If you find implementation defects, report them as blockers for the owning split apply lane, normally `sdd-apply-code` for source/runtime/config/skill-surface fixes.
- Do not create tests; that belongs to `sdd-verify-units` or `sdd-verify-pwauto`.
- Classify findings by severity: `critical`, `warning`, `info`.
- A passing code lane means no critical/warning issue blocks delivery for the scoped implementation.

## Required Output

Return the common SDD envelope plus:

- `lane: sdd-verify-code`
- `code_review_result: passed | failed | blocked | not_required`
- `findings:` ordered by severity with file/line references when possible
- `task_section_written: ## 15. Resumen de verificación SDD > ### Code review`
- `engram_topic_key: sdd/{change-name}/verify-code`
