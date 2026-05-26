---
name: sdd-explore-research
description: "Trigger: sdd-explore-research, Context7 research, docs lookup, external API investigation. Explore external documentation first without turning into a broad code-reading lane."
license: MIT
metadata:
  id: sdd-explore-research
  version: 1.0.0
---

## Activation Contract

Use this lane when the missing evidence lives outside the repo: library behavior, framework contracts, external API docs, or best-current guidance. Start with Context7/docs-style research.

## Hard Rules

- External research first: prefer Context7 or authoritative docs before anything else.
- Do not turn this lane into broad repository exploration; read local files only when the task path or a small config snippet is needed to frame the research question.
- Do not use browser tooling.
- Do not modify code, docs, config, or tests.
- Separate sourced facts from repo-specific recommendations.

## Command Authority

Research authority is external documentation lookup only, primarily Context7 or authoritative docs. Do not run shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, build, or broad repo-exploration commands; if local/runtime evidence is needed, report the appropriate SDD lane instead.

## Decision Gates

| Need | Action |
| --- | --- |
| Library/framework/documentation behavior is unknown | Use this lane |
| The answer depends mainly on local implementation | Route to `sdd-explore-code` |
| The answer requires observing the running browser flow | Route to `sdd-explore-pwcli` |

## Execution Steps

1. Read the active `taskReadme` to frame the question precisely.
2. Query Context7 or authoritative external docs for the narrow topic.
3. Read only minimal local context required to apply the research safely.
4. Return sourced findings, tradeoffs, and a repo-specific recommendation.

## Output Contract

Return the common SDD envelope plus:

- `lane: sdd-explore-research`
- `sources: context7-or-authoritative-docs`
- `research_links:` docs or library sources used
- `task_section_written: ## 4. Resumen de exploración`
- `engram_topic_key: sdd/{change-name}/explore-research`

## References

- `taskReadme/<active-task>.md`
- `.agents/skills/sdd-explore/SKILL.md`
