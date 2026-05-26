---
name: sdd-explore-pwcli
description: "Trigger: sdd-explore-pwcli, browser exploration, Playwright CLI investigation, runtime preflight. Explore browser behavior with PW-CLI after resolving browser runtime context."
license: MIT
metadata:
  id: sdd-explore-pwcli
  version: 1.0.0
---

## Activation Contract

Use this lane when exploration requires observing real browser behavior, UI state, or runtime symptoms. This is exploratory browser investigation only, not final verification.

## Hard Rules

- Resolve browser/runtime context through `.agents/skills/sdd-browser-runtime-context/SKILL.md` before any browser action when a runnable context is required.
- If the preflight returns `required: true` with `runtimeKind: unknown` or a blocker, stop and return `blocked`.
- Use `playwright-cli` for exploration only; do not create persistent tests and do not claim verification closure.
- Do not broaden into general code-reading or external research beyond the minimal task/route context needed to drive the browser.
- Do not invent `BASE_URL`, commands, credentials, or runtime ownership.

## Command Authority

Browser exploration authority is limited to `playwright-cli` after trusted browser-runtime preflight and only for the assigned exploratory flow. Do not run Git/GitHub, Bun tests/builds, Docker/projectctl commands outside the persisted preflight result, persistent Playwright suites, Supabase/data operations, product/test edits, or broad code/research work; report the required owner if those are needed.

## Decision Gates

| Need | Action |
| --- | --- |
| UI/runtime behavior must be observed in a browser | Use this lane |
| Browser context is not actually required | Return `not_required` |
| The question is about code structure, not runtime behavior | Route to `sdd-explore-code` |
| The question is about external docs or APIs | Route to `sdd-explore-research` |

## Execution Steps

1. Read the active `taskReadme` and identify the route, flow, or UI question.
2. Run the browser-runtime preflight and capture its evidence.
3. If context is available, use `playwright-cli` to inspect the target flow.
4. Record exploratory findings, visible states, console/runtime issues, and blockers without converting them into final verification claims.

## Output Contract

Return the common SDD envelope plus:

- `lane: sdd-explore-pwcli`
- `browser_runtime_context:` resolved preflight artifact or blocker
- `pwcli_exploration_result: passed | failed | blocked | not_required`
- `flow_explored:` exact route/flow
- `task_section_written: ## 4. Resumen de exploración`
- `engram_topic_key: sdd/{change-name}/explore-pwcli`

## References

- `taskReadme/<active-task>.md`
- `.agents/skills/sdd-explore/SKILL.md`
- `.agents/skills/sdd-browser-runtime-context/SKILL.md`
- `.agents/skills/testing-policy/SKILL.md`
