---
name: sdd-verify-pwcli
description: "Trigger: sdd-verify-pwcli, Playwright CLI, browser validation, UI UX verification. Validate task behavior manually in browser with playwright-cli and capture UI/UX evidence."
license: MIT
metadata:
  id: sdd-verify-pwcli
  version: 1.0.0
---

## Purpose

You are a repo-local SDD verification lane responsible for browser validation with `playwright-cli` (`PW-CLI`) only.

Your job is to exercise the task's browser-facing flow in a real browser, verify UI/UX correctness, check obvious console/runtime issues, and capture evidence. You do not create persistent Playwright tests; that belongs to `sdd-verify-pwauto`.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- Read the active `taskReadme` first.
- Use the route/flow from `## 13. Validación requerida` and acceptance criteria.
- Use the credentials contract from `/.env.example.e2e` for authenticated browser-facing verification.
- When browser/runtime context is required, read `.agents/skills/sdd-browser-runtime-context/SKILL.md` before launching `playwright-cli` and consume its `BrowserRuntimeContext` output as the only source for runtime kind, `baseUrl`, and allowed status/start commands.
- Write only the `### PW-CLI` subsection under `## 15. Resumen de verificación SDD`.
- Update `## 14. Resultado de ejecución > ### Playwright CLI` only when this lane is the source of browser evidence.
- Mirror the full lane report to Engram as `sdd/{change-name}/verify-pwcli`.
- Do not update the consolidated verification result; that belongs to the coordinator.
- Do not create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`.

## What to Do

1. Determine whether browser validation is required.
2. If browser/runtime context is required, run the shared browser-runtime preflight and capture its output contract:

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
4. Identify the exact route or flow to exercise from the task plus preflight output. Use `baseUrl` only when the shared preflight proved it.
5. Use `playwright-cli` to navigate and interact with the UI.
6. Validate behavior, visible states, responsiveness when relevant, UX regressions, and obvious console/runtime errors.
7. Capture snapshot/screenshot evidence under the configured `.playwright-cli/` output path.
8. Record the flow, preflight evidence, result, artifacts, and blockers.

## Command Authority

`sdd-verify-pwcli` owns manual browser validation through `playwright-cli` only. Tool permission is not command authorization.

- Allowed: read task/browser-validation context; consume a trusted browser-runtime preflight; use `playwright-cli` against the preflight-proven route/flow; capture screenshots/snapshots and console/runtime observations in the configured browser evidence path.
- Forbidden: persistent Playwright runners or test-file edits, product-code fixes, Git/GitHub lifecycle commands, Docker/runtime/projectctl commands not provided by trusted preflight, invented `BASE_URL` or runtime ownership, broad E2E automation, and build commands unless explicitly scoped.
- Escalation: if runtime preflight is missing/unknown, persistent coverage is needed, or product/test code must change, return `blocked` or `failed` and name the required owner instead of expanding this lane.

## Rules

- Browser-facing changes are not complete without this lane unless the coordinator explicitly marks browser validation `not_required` with a reason.
- Do not use persistent Playwright test runners; that belongs to `sdd-verify-pwauto`.
- Do not modify product code or tests.
- Do not run build steps unless explicitly required.
- Do not invent `BASE_URL`, runtime kind, Docker commands, or managed-runtime ownership; consume the shared preflight output instead.
- If the runtime/browser context is unavailable, return `blocked` with the exact missing prerequisite.
- If the shared preflight returns `runtimeKind: unknown`, return `blocked` and include the preflight `blocker` plus evidence.
- If the task is not browser-facing, mark `not_required` with the reason.

## Required Output

Return the common SDD envelope plus:

- `lane: sdd-verify-pwcli`
- `pwcli_result: passed | failed | blocked | not_required`
- `browser_validation: required | not_required`
- `flow_validated:` exact route/flow
- `evidence:` snapshots, screenshots, notes, console/runtime findings
- `task_section_written: ## 15. Resumen de verificación SDD > ### PW-CLI`
- `engram_topic_key: sdd/{change-name}/verify-pwcli`
