# Verify Lane Common Rules

> **Single source of truth** for the rules shared by the four `sdd-verify-*` lanes (`sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwauto`, `sdd-verify-pwcli`) that are **specific to the verify family**. Universal executor boilerplate lives in `sdd-phase-common.md §F`; verify lanes reference §F and do not restate it.

Every verify lane is **run/review/report-only**. It executes and reviews evidence, writes its lane-owned verification subsection, and routes missing/incorrect coverage back to the owning apply lane. It never creates or modifies test files, Playwright specs, product code, or docs.

## Verify Authorization Gate (delta)

Beyond the universal authorization checks (validated `workflow_context_ref`; lane id present in `lane_context.registry` and `lane_context.allowed_lanes`), every verify lane adds:

1. Confirm the assigned work unit carries the four mandatory contract fields (`Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`); missing fields route to `tasks_contract_missing`.
2. This lane MAY write only its lane-owned verification subsection. It MUST NOT create/update test files, Playwright specs, product code, or documentation.

## Verification section ownership (parametric)

- **Index-primary variant (`WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`):** write verification detail to the resolved phase artifact and return `summary` + `artifact_ref` + verdict. The coordinator consolidates the verdict into the index. Optional support-tool output is not SDD evidence.
- **Ledger variant (`primary.role` ledger/absent):** write only your lane-owned subsection under the **verification-summary** heading, and — when you are the evidence source — under the **execution-result** heading. Both headings are resolved from `WorkflowRuntimeContextV1.task_ref.heading_owners`; never write a section number literally.

- The apply-progress heading/artifact is owned by the apply lanes; a verify lane never writes it.
- Subsection labels (`### Code review`, `### Unit tests`, `### PW-AUTO`, `### PW-CLI`) are lane-role sub-labels within the owned heading/artifact, not headings themselves.

## Routing contract (no artefact creation)

When verification finds missing or incorrect coverage, the verify lane does not fix it. It records the gap and routes to the owning apply lane by role:

- **Missing** coverage → `blocked`, route to the apply lane whose role produces that artefact class (resolved from `lane_context.registry`), with `routing_tag` from the unit.
- **Incorrect** coverage → `failed`, route to the same owning apply lane with the concrete defect evidence.

The verify lane never becomes the fixer; it reports and routes.

## Browser lane preconditions

Applies to browser-facing verify lanes (`sdd-verify-pwauto`, `sdd-verify-pwcli`; the same contract is consumed by `sdd-explore-pwcli` via `explorer-rules.md`).

Before any browser action, confirm the browser preconditions the coordinator resolved and declared in the delegation prompt and in the active primary artefact's validation-requirements section (resolved from `heading_owners`, including any `### Browser target` sub-section):

- **target environment** — the resolved base URL / target, supplied by the coordinator; never invented.
- **credentials contract** — declared by the binding; the lane consumes the resolved reference, it does not hardcode a credentials file path or overlay name.
- **runtime kind** — the resolved `runtime_kind`.

If any precondition is missing, stop and return `blocked` with the named failure mode: `browser-target-missing`, `browser-credentials-missing`, or `runtime-kind-unknown`. Do not invent `BASE_URL`, commands, credentials, or runtime ownership.

## Sources

- `.agents/skills/sd-protocol/sdd-phase-common.md` §F — universal executor boilerplate.
- `.agents/skills/sd-protocol/apply-work-unit-schema.md` §6 — verification mapping by lane.
- Each `sdd-verify-*/SKILL.md` — lane purpose, command authority, execution command, and lane-specific delta.

If any of those sources disagree with this file, this file wins for the verify-family delta; `sdd-phase-common.md §F` wins for universal boilerplate.
