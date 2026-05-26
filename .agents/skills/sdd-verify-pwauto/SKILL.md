---
name: sdd-verify-pwauto
description: "Trigger: sdd-verify-pwauto, Playwright automated E2E, PW-AUTO. Run/review/report persistent Playwright E2E suites for task-related coverage verification only. No test file creation or modification."
license: MIT
metadata:
  id: sdd-verify-pwauto
  version: 1.0.0
---

## Purpose

You are a repo-local SDD verification lane responsible for **persistent Playwright E2E execution, review, and report only**.

You do NOT create or update Playwright test files. Your job is to execute existing persistent Playwright suites that map to the active task, review coverage quality, and record real evidence. If required coverage is missing or incorrect, you return `blocked` or `failed` naming `sdd-apply-pwauto-tests` as the owner and the coordinator schedules test creation work there.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- Read the active `taskReadme` first.
- Read quality scope from `docs/01-product/quality-plan.md`, `docs/01-product/quality/views/**`, and `playwright/TEST_PLAN.md` only for the task-related surface.
- When persistent E2E execution needs browser/runtime context, read `.agents/skills/sdd-browser-runtime-context/SKILL.md` before running Playwright and consume its `BrowserRuntimeContext` output as the only source for runtime kind, `baseUrl`, and allowed status/start commands.
- Write only the `### PW-AUTO` subsection under `## 15. Resumen de verificación SDD`.
- Update `## 14. Resultado de ejecución > ### Tests persistentes / verificación SDD` only when this lane is the source of persistent E2E evidence and no other lane owns the same row.
- Mirror the full lane report to Engram as `sdd/{change-name}/verify-pwauto`.
- Do not update the consolidated verification result; that belongs to the coordinator.
- Do not create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`.

## What to Do

1. Determine whether the task requires persistent E2E coverage from `browser_validation`, quality criteria, and acceptance criteria.
2. When that coverage requires a runnable browser/runtime context, run the shared browser-runtime preflight and capture its output contract:

   ```ts
   type BrowserRuntimeContext = {
     required: boolean
     runtimeKind: 'root-docker' | 'managed-project' | 'unknown'
     resolutionSource: 'task' | 'projectctl' | 'repo-config'
     baseUrl?: string
     statusCommand?: string
     startCommand?: string
     evidence: string[]
     blocker?: string
   }
   ```

3. Block immediately when the preflight returns `runtimeKind: unknown`; do not infer runtime ownership, `BASE_URL`, or fallback commands ad hoc.
4. Map the task to existing Playwright specs and `playwright/TEST_PLAN.md` rows. You do NOT create new specs.
5. If required coverage is missing or incorrect, return `blocked` or `failed` naming `sdd-apply-pwauto-tests` as the owner and preserve evidence in taskReadme.
6. Execute the narrowest relevant suite or script, for example `bun run test:e2e:smoke-ui` or another mapped script, using `baseUrl` only when the shared preflight proved it.
7. Record command, preflight result, coverage mapping, and remaining gaps honestly.

## Command Authority

`sdd-verify-pwauto` is run/review/report-only for persistent Playwright E2E. Tool permission is not command authorization.

- Allowed: read task/apply/quality context; consume a trusted browser-runtime preflight; run the narrowest mapped persistent Playwright/Bun E2E command after runtime context is proven; write lane-owned verification subsection and mirror to Engram.
- Forbidden: `playwright-cli` (belongs to `sdd-verify-pwcli`), Git/GitHub lifecycle commands, product-code fixes, Docker/runtime/projectctl commands not provided by trusted preflight, invented `BASE_URL` or runtime ownership, broad unrelated E2E suites, build commands unless explicitly scoped, and any write/edit/create on Playwright spec files or `playwright/TEST_PLAN.md`.
- Routing contract: if required persistent E2E coverage is missing or incorrect, return `blocked` (when missing/unowned) or `failed` (when owned but wrong) with `owner: sdd-apply-pwauto-tests` and the coordinator schedules `sdd-apply-pwauto-tests` for the missing or incorrect spec.
- Escalation: if runtime preflight is missing/unknown, product behavior needs changes, or only manual browser validation can answer the question, return `blocked` or `failed` and name the required owner instead of expanding this lane.

## Rules

- Never claim `PW-AUTO` coverage without a real persistent Playwright test and passing execution evidence.
- Do not use `playwright-cli`; that belongs to `sdd-verify-pwcli`.
- Do not run build steps unless explicitly required.
- Do not modify product code. If product behavior fails, return `failed` or `blocked` and route back to `sdd-apply-code`.
- Do not invent `BASE_URL`, runtime kind, Docker commands, or managed-runtime ownership; consume the shared preflight output instead.
- If the shared preflight returns `runtimeKind: unknown`, return `blocked` and include the preflight `blocker` plus evidence.
- If persistent E2E is not meaningful or not required, mark `not_required` with the task-specific reason.
- Use credentials and environment contracts referenced by the repo when E2E needs authentication.
- You may not create, update, or edit Playwright spec files or `playwright/TEST_PLAN.md`. Return `blocked` or `failed` with `sdd-apply-pwauto-tests` as the owner when coverage is missing or incorrect.

## Required Output

Return the common SDD envelope plus:

- `lane: sdd-verify-pwauto`
- `pwauto_result: passed | failed | blocked | not_required`
- `test_files:` existing Playwright files executed and their status (no new files created by this lane)
- `commands:` exact commands executed and result
- `quality_mapping:` quality criteria and `playwright/TEST_PLAN.md` rows covered or still missing
- `task_section_written: ## 15. Resumen de verificación SDD > ### PW-AUTO`
- `engram_topic_key: sdd/{change-name}/verify-pwauto`
- `routing_contract:` when coverage is missing or incorrect, must include `result: blocked` (missing/unowned) or `failed` (owned but wrong), `owner: sdd-apply-pwauto-tests`, `blocker: missing | incorrect`, and `artifact_detail: <exact file path>`
