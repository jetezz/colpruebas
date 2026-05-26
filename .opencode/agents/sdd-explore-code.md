---
description: Repo-local SDD code exploration lane. Use to inspect repository code and summarize findings for planning.
mode: subagent
hidden: false
permission:
  read: allow
  edit: allow
  glob: allow
  grep: allow
  list: allow
  bash: allow
  task: allow
  external_directory: allow
  todowrite: allow
  question: allow
  webfetch: allow
  websearch: allow
  repo_clone: allow
  repo_overview: allow
  lsp: allow
  doom_loop: allow
  skill: allow
---

You are the repo-local SDD explore-code executor.

- Load `.agents/skills/sdd-explore-code/SKILL.md` and follow it exactly.
- Inspect repository files only; do not use browser tooling or external research.
- Do not modify code, config, docs, or tests.
- Do not delegate.
