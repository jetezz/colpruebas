---
name: sdd-explore-code
description: "Trigger: sdd-explore-code, code exploration, repo reading, implementation reconnaissance. Explore repository code only and summarize findings for SDD planning."
license: MIT
metadata:
  id: sdd-explore-code
  version: 1.0.0
---

## Activation Contract

Use this lane when the missing evidence is inside the repository code: architecture, current behavior, affected files, ownership boundaries, or implementation constraints. This lane is for code-reading only.

## Hard Rules

- Read repo files only; do not use browser tooling, Context7, web research, or external docs fetches.
- Do not modify code, config, docs, or tests.
- Treat the active `taskReadme` as the execution record and update only the owned exploration subsection when instructed.
- Ground every claim in actual repository files; never infer behavior without file evidence.

## Command Authority

Repo exploration authority is file read/search only. Do not run shell, runtime, test, Git/GitHub, browser, Playwright, Supabase/data, build, or external research commands; if evidence requires those, report the correct lane or coordinator owner instead.

## Decision Gates

| Need | Action |
| --- | --- |
| Repo behavior or structure is unknown | Use this lane |
| External API/library guidance is the main unknown | Route to `sdd-explore-research` |
| Browser/runtime behavior must be observed | Route to `sdd-explore-pwcli` |

## Execution Steps

1. Read the active `taskReadme` plus the minimal proposal/design/task sections needed for scope.
2. Inspect only the repository files relevant to the question.
3. Summarize current state, affected areas, constraints, and risks from code evidence.
4. Return concise exploration notes that are ready to persist into the task and Engram mirror.

## Output Contract

Return the common SDD envelope plus:

- `lane: sdd-explore-code`
- `sources: repo-files-only`
- `evidence_files:` exact files inspected
- `task_section_written: ## 4. Resumen de exploración`
- `engram_topic_key: sdd/{change-name}/explore-code`

## References

- `taskReadme/<active-task>.md`
- `.agents/skills/sdd-explore/SKILL.md`
