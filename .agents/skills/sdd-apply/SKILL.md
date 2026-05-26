---
name: sdd-apply
description: "Deprecated migration alias for legacy `sdd-apply`. Normalize to explicit split apply lanes; do not execute monolithic apply from this skill."
license: MIT
metadata:
  id: sdd-apply
  version: 1.0.0
---

## Status

`sdd-apply` is a **deprecated migration alias**, not a canonical executor.

- Hidden/disabled runtime surfaces may keep this id temporarily for backward compatibility.
- New coordinated SDD work in `mis-proyectos` MUST use explicit split apply lanes.
- This file exists to document how legacy prompts, task state, or runtime catalog entries should normalize.

## Canonical Replacement Lanes

Use one of these active executors instead of `sdd-apply`:

- `sdd-apply-code` — product/source/runtime/config/skill-surface implementation
- `sdd-apply-doc` — documentation-only implementation
- `sdd-apply-unit-tests` — unit-test file creation/update
- `sdd-apply-pwauto-tests` — persistent Playwright spec creation/update

## Legacy Normalization Contract

When old task state, prompts, or runtime aliases still mention `sdd-apply`, normalize it before execution:

| Legacy input | Normalize to | Rule |
| --- | --- | --- |
| `sdd-apply` with no `apply_lane` metadata | `sdd-apply-code` | explicit bare-legacy migration default; not monolithic execution |
| `sdd-apply` + `apply_lane: code` | `sdd-apply-code` | canonical code lane |
| `sdd-apply` + `apply_lane: doc` | `sdd-apply-doc` | canonical docs lane |
| `sdd-apply` + `apply_lane: unit-tests` | `sdd-apply-unit-tests` | canonical unit-test lane |
| `sdd-apply` + `apply_lane: pwauto-tests` | `sdd-apply-pwauto-tests` | canonical PW-AUTO lane |
| `apply` (short legacy form) with no `apply_lane` metadata | `sdd-apply-code` | same migration default as bare legacy `sdd-apply` |
| legacy metadata conflicts or cannot be reconciled safely | `blocked` | coordinator/task metadata must be enriched before execution |

Normalization should be performed by the coordinator, task parser, or legacy runtime compatibility layer. The bare legacy default exists only to migrate old inputs onto `sdd-apply-code`; this alias must not execute monolithic implementation work on its own.

## Command Authority

This alias is passive.

- Allowed: read migration context, document normalization rules, and point callers to the explicit lane ids.
- Forbidden: implementing code, docs, or tests; updating task progress as an executor; launching sub-agents; acting as a fallback apply lane.

## Strict TDD Note

`.agents/skills/sdd-apply/strict-tdd.md` remains a shared module path for split apply-lane workflows during the migration window. Its presence does **not** make `sdd-apply` an active executor.

## Required Outcome

If a caller reaches this alias:

1. Apply the bare-legacy migration default: `sdd-apply` / `apply` with no `apply_lane` metadata becomes `sdd-apply-code`.
2. If explicit `apply_lane` metadata exists, hand execution to that canonical split lane instead.
3. If the metadata conflicts or still cannot be reconciled safely, return `blocked` and request enrichment instead of executing.
