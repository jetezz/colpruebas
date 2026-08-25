# Apply Lane Common Rules

> **Single source of truth** for the rules shared by the six `sdd-apply-*` lanes (`sdd-apply-code-low`, `sdd-apply-code-medium`, `sdd-apply-code-high`, `sdd-apply-doc`, `sdd-apply-unit-tests`, `sdd-apply-pwauto-tests`) that are **specific to the apply family** — i.e. not universal to every executor lane (those live in `sdd-phase-common.md §F`) and not part of the work-unit row schema (that lives in `apply-work-unit-schema.md`).

Universal executor boilerplate — Required Inputs, raw-input prohibition, retired-alias rule, persistence pointer — is defined once in `sdd-phase-common.md §F`. Apply lanes reference §F; they do not restate it. The work-unit row shape (13 columns, contract fields, complexity, parallel-safety, pre-implementation gate, verification mapping, section ownership) is defined once in `apply-work-unit-schema.md`. Apply lanes reference that file; they do not restate it.

## Apply Authorization Gate (delta)

Beyond the universal authorization checks (validated `workflow_context_ref`; lane id present in `lane_context.registry` and `lane_context.allowed_lanes`, else `lane_unknown` / `lane_not_allowed_in_phase`), every apply lane adds:

1. The intended files MUST match the assigned `Archivos owned` for the unit; out-of-ownership writes return `blocked`.
2. The four mandatory contract fields (`Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) MUST be present on the assigned work unit; missing fields route to `tasks_contract_missing`, never silently relaxed. (`sdd-apply-code-low` runs the scope-only variant — see its SKILL.md; `code-medium`/`code-high` add the full pre-implementation gate and, for `code-high`, the cross-cutting safety gate, both defined in `apply-work-unit-schema.md §5`.)

## Segmented Apply Contract

- Implement only the unit(s) assigned in the prompt.
- Do not launch sub-agents, decide batches, or modify files outside ownership.
- Safe-write protocol: re-read the canonical primary before writing; if it changed under you, return `blocked` with the intended patch and the conflicting section.

## Owned artifact / owned section

- **Index-primary variant (`WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`):** an apply lane writes implementation evidence to its resolved phase artifact and returns `summary` + `artifact_ref` + status. The coordinator updates the index. Optional support-tool output is not SDD evidence.
- **Ledger variant (`primary.role` ledger/absent):** write only owned rows. Mirror unit completion only when `artifact_context.mirrors` is non-empty; then use the injected `mirror_key`. With no mirrors, that input and write are absent.

See `sdd-phase-common.md` §F.5 for the index/phase-artifact mechanism.

## Sources

- `.agents/skills/sd-protocol/sdd-phase-common.md` §F — universal executor boilerplate (Required Inputs, raw-input prohibition, retired-alias rule, persistence pointer).
- `.agents/skills/sd-protocol/apply-work-unit-schema.md` — work-unit row schema, complexity, parallel-safety, pre-implementation gate, verification mapping, section ownership.
- Each `sdd-apply-*/SKILL.md` — lane purpose, command authority, and lane-specific delta.

If any of those sources disagree with this file, this file wins for the apply-family delta; `sdd-phase-common.md §F` wins for universal boilerplate; `apply-work-unit-schema.md` wins for the row schema.
