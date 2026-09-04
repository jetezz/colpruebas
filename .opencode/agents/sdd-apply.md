---
description: "DEPRECATED ALIAS ONLY. Hidden legacy `sdd-apply` catalog entry retained for read-time normalization; never a canonical executor. Bare legacy input defaults to `sdd-apply-code`; explicit lane metadata still overrides."
disable: true
mode: subagent
hidden: true
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

This agent entry is a passive migration-only alias.

- Status: deprecated, hidden, and disabled on purpose.
- Canonical executors are `sdd-apply-code`, `sdd-apply-doc`, `sdd-apply-unit-tests`, and `sdd-apply-pwauto-tests`.
- Bare legacy `sdd-apply` should normalize to `sdd-apply-code` as explicit migration behavior, never as revived monolithic apply execution.
- If work-unit metadata includes explicit `apply_lane`, that explicit split lane overrides the bare default.
- Block for enrichment only when the legacy metadata conflicts or still cannot be reconciled safely.
- `.agents/skills/sdd-apply/SKILL.md` exists only to document this migration contract.
