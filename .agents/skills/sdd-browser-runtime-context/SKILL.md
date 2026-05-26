---
name: sdd-browser-runtime-context
description: "Trigger: browser runtime preflight, PW-CLI runtime, PW-AUTO runtime, BASE_URL resolution. Resolve browser-only runtime context for root-docker or managed-project lanes."
license: MIT
metadata:
  id: sdd-browser-runtime-context
  version: 1.0.0
---

## Activation Contract

Use this skill only before browser exploration or browser verification lanes that need a runnable URL/runtime context. If the task is planning-only or browser validation is `not_required`, return `required: false` and stop.

## Execution and Persistence Contract

> Follow **Section B** and **Section C** from `.agents/skills/_shared/sdd-phase-common.md`.

- Read the active `taskReadme` first and treat it as the canonical file artifact.
- This preflight owns a caller-scoped task subsection, not a global SDD phase section:
  - `sdd-explore-pwcli` → `## 4. Resumen de exploración > ### Browser runtime preflight (PW-CLI)`
  - `sdd-verify-pwcli` → `## 15. Resumen de verificación SDD > ### Browser runtime preflight (PW-CLI)`
  - `sdd-verify-pwauto` → `## 15. Resumen de verificación SDD > ### Browser runtime preflight (PW-AUTO)`
- Mirror the full preflight artifact to a stable lane-scoped Engram topic key:
  - `sdd/{change-name}/browser-runtime-context-explore-pwcli`
  - `sdd/{change-name}/browser-runtime-context-verify-pwcli`
  - `sdd/{change-name}/browser-runtime-context-verify-pwauto`
- Update only the caller-scoped preflight subsection you own; do not rewrite the caller lane summary or consolidated verification result.
- Browser lanes must consume this persisted preflight result as their runtime source of truth and then record their own lane artifact separately (`.../explore-pwcli`, `.../verify-pwcli`, `.../verify-pwauto`) so the preflight evidence remains resumable even if the browser lane later blocks or fails.
- Do not create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`.

## Hard Rules

- Treat the active `taskReadme` as the primary source for whether browser/runtime context is required.
- Resolve exactly one `runtimeKind`: `root-docker` | `managed-project` | `unknown`.
- `managed-project` MUST use `projectctl`; never propose raw Docker from `sandbox`.
- `unknown` MUST return a blocker for browser lanes that need a runnable context.
- Do not invent `BASE_URL`, commands, or runtime ownership.
- Always return evidence lines showing how the decision was made.

## Command Authority

Browser-runtime authority is preflight resolution only for a requesting browser lane. It may return proven status/start commands as lane evidence, but must not run runtime control for planning-only or non-browser tasks. Do not run Git/GitHub, tests/builds, browser actions, persistent Playwright, Supabase/data operations, or invented Docker/projectctl commands; return `required: false` or `blocked` when the task does not prove browser-runtime ownership.

## Decision Gates

| Condition | Action |
| --- | --- |
| Browser context not required | Return `required: false`, `runtimeKind: unknown`, evidence explaining why no preflight ran |
| Repo/root runtime is explicitly indicated by task or repo docs | Return `runtimeKind: root-docker` with repo-supported status/start commands and resolved `baseUrl` when evidence exists |
| Managed project/runtime is indicated by task, terminal context, or project workflow | Return `runtimeKind: managed-project` and only `projectctl` commands |
| Runtime kind cannot be proven | Return `runtimeKind: unknown` with `blocker` |

## Execution Steps

1. Read the active `taskReadme` and confirm whether the caller is a browser lane.
2. Collect evidence from the task, injected route/URL hints, and repo-local runtime docs.
3. Classify the runtime:
   - `root-docker`: use canonical repo commands only, such as `docker compose -f compose.yml up -d --build` or `docker compose -f compose.dev.yml up -d --build`, and only when the task/docs prove that runtime kind.
   - `managed-project`: use `projectctl` only. Preferred commands are `projectctl status`, `projectctl start dev`, and `projectctl open dev --print` or `projectctl open prod --print` when those targets are supported by the task.
   - `unknown`: do not guess; block the caller.
4. Resolve `baseUrl` only from explicit evidence (task, runtime output, or repo config). If no trustworthy URL exists, keep it unset and explain why.
5. Persist the result into the caller-owned task subsection first, then mirror the same artifact to the lane-scoped Engram topic key.
6. Return this contract:

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

## Output Contract

- `required`: whether the caller actually needs browser/runtime context.
- `runtimeKind`: `root-docker` | `managed-project` | `unknown`.
- `resolutionSource`: where the winning evidence came from.
- `baseUrl`, `statusCommand`, `startCommand`: only when proven.
- `evidence`: short factual bullets.
- `blocker`: mandatory when `runtimeKind: unknown` blocks a browser lane.
- `task_section_written`: exact caller-scoped subsection updated in `taskReadme`.
- `engram_topic_key`: exact lane-scoped preflight mirror key written.

## References

- `taskReadme/<active-task>.md`
- `.agents/skills/projectctl-operator/SKILL.md`
- `docs/00-context/architecture.md`
- `docs/00-context/entornos.md`
- `docs/04-process/development.md`
