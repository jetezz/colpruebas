# Apply Work Unit Schema (canonical)

> **Single source of truth** for the apply work unit contract used by every `sdd-apply-*` lane. The coordinator and any skill that writes apply units MUST reference this file instead of restating the schema.

This schema is the **shape of the row** inside the active apply breakdown. When `WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`, the full breakdown lives in the `tasks` phase artifact (`artifact_context.phase_artifacts` with key `tasks`) and the primary index keeps only a compact work-unit **status** table (`WU-id | lane | status | artifact_ref`); when `primary.role` is ledger/absent, the breakdown lives in the primary section owned via `WorkflowRuntimeContextV1.task_ref.heading_owners`. The exact artefact path comes from the resolved `WorkflowRuntimeContextV1` (see `.agents/skills/sd-protocol/workflow-runtime-context.md`); no value in this file is binding to a specific project locator.

## 0. Where the breakdown lives

The breakdown section lives in the active primary artefact (resolved via `WorkflowRuntimeContextV1.task_ref.path`) under a section identifier resolved from:

- `WorkflowRuntimeContextV1.task_ref.heading_owners[<normalized_heading>]` → lane role.

For the `mis-proyectos` overlay the configured owner of the breakdown section is one of the apply lanes (`sdd-apply-code-{low,medium,high}` or `sdd-apply-doc` or `sdd-apply-unit-tests` or `sdd-apply-pwauto-tests`); the exact section identifier and its slot number are owned by the binding and may differ in another overlay. The schema in this file applies regardless of the concrete section identifier.

The numeric labels in the breakdown section are navigation aids only. The configured normalised heading from the binding's `task.heading_owners` is the authoritative identifier for ownership; numeric labels never determine ownership.

## 1. The 13 required columns

| # | Column | Allowed values | Notes |
|---|--------|----------------|-------|
| 1 | `Unit` | stable short ID (`A`, `B`, `api-1`, `docs-1`) | Required. Format is the project's `Unit ID` convention; the protocol does not lock a specific format. |
| 2 | `Estado` | `pending`, `in_progress`, `done`, `blocked`, `failed` | Unit-level only. NEVER used as global task state. The unit-level set is fixed by the protocol; the task-level writable set is resolver-validated before hand-off. |
| 3 | `apply_lane` | `code-low`, `code-medium`, `code-high`, `doc`, `unit-tests`, `pwauto-tests`, `none` | `none` is reserved for coordinator-owned mechanical work (branch creation, force-add, PR bookkeeping). Legacy `code` (no suffix) normalizes to `code-medium` in memory; never write `code` without suffix. The lane-id values are the configured split lanes from `WorkflowRuntimeContextV1.lane_context.registry` mapped into one of these bucket names. |
| 4 | `Objetivo` | concrete implementation goal | Required. |
| 5 | `Archivos owned` | exact files or narrow globs | Required. The protocol requires paths outside `WorkflowRuntimeContextV1.artifact_context.forbidden_paths` and within the assigned owned-file refs; escaping either is blocked. |
| 6 | `Depende de` | unit IDs or `none` | Required. |
| 7 | `Conflict group` | `api-routes`, `db-migration`, `frontend-store`, `docs`, etc., or `none` | Required. Values come from the binding's lane declaration; the project may add new conflict groups. |
| 8 | `Modo` | `serial`, `parallel-safe`, `coordinator-only` | Required. |
| 9 | `Mirror topic` | `apply-{lane}-{unit-id}` (overlay-illustrative; `none` when the overlay's mirror is `role: "knowledge"` only) | Optional. When the binding declares a per-phase ledger mirror, the key comes from `WorkflowRuntimeContextV1.artifact_context.mirrors[i].key_pattern` plus the configured `<unit-id>` slot. When the overlay ships only a `role: "knowledge"` mirror (no per-phase ledger), units carry no per-phase mirror topic and evidence lives in the `apply-<unit_id>` phase artifact instead. |
| 10 | `Spec scenarios linked` | scenario IDs/names or `none` | See contract rules below. |
| 11 | `Implementation contract` | concrete files, symbols, routes, SQL objects, config keys, or behavior | See contract rules below. |
| 12 | `Verify expects` | lane-specific concrete pass/fail expectations | See contract rules below. |
| 13 | `Routing tag on failure` | `code_issue`, `doc_issue`, `unit_test_issue`, `pwauto_issue`, `tasks_contract_missing` | Required. |

The columns above are the protocol contract. A row whose columns fall outside these buckets is blocked by the pre-implementation gate with `routing_tag: tasks_contract_missing`. Additional columns are permitted (e.g. `complexity_signals`, `sdd_change_id`, `criteria_covered`, `evidence_refs`) but MUST NOT displace any of the 13 above.

## 2. The 4 mandatory contract fields (columns 10-13)

Every non-`none` unit MUST declare all four. If any is missing or vague, the coordinator MUST block before launching any `sdd-apply-*` lane and route back to the planning lane with `routing_tag: tasks_contract_missing`.

### Spec scenarios linked (column 10)

- Must reference concrete spec scenario IDs/names from the active primary's `## 6` delta-requirements section (or whatever section the binding assigns to specs).
- `none` is permitted only when the unit is purely mechanical and has no behaviour contract (e.g. coordinator-only force-add of gitignored files).
- If the spec lacks scenarios for the behaviour, the planning lane MUST block and request spec enrichment before producing the apply unit.

The exact spec-section location is supplied in `WorkflowRuntimeContextV1.task_ref.heading_owners`; no lane reads the raw binding to resolve it.

### Implementation contract (column 11)

- Must name the smallest knowable target: file + exported symbol, route, component, SQL object, config key, or behaviour.
- If the target cannot be named from spec/design, return `blocked` and state the missing decision.
- A unit that needs more than one unrelated `Implementation contract` is too broad; split it unless the design explicitly requires an atomic change.

### Verify expects (column 12)

- Must describe observable criteria for the relevant verification lane.
- NEVER use vague phrasings such as "verify implementation", "run code review", or only the lane name.
- Must be concrete: file paths to inspect, scenario IDs to assert, expected log/response, etc.
- The verification lane to use is determined by the rule in §5 below.

### Routing tag on failure (column 13)

- Tells the coordinator where to send rework when verification fails.
- Missing or unclear contracts route to `tasks_contract_missing`, not to any `sdd-apply-*` lane.

## 3. Complexity evaluation (signal → apply_lane)

When the planning lane assigns `apply_lane` for code work units, evaluate using these three signals and apply `MAX(signal_1, signal_2, signal_3)`:

**Signal 1 — Owned files count:**

- ≤2 → LOW
- 3-8 → MEDIUM
- ≥9 → HIGH

**Signal 2 — Surface count:**

- 1 → LOW
- 2 → MEDIUM
- ≥3 → HIGH

**Signal 3 — Nature of change:**

- `migration` (schema SQL, RLS, grants) → force HIGH
- `security` (auth, authorization, credentials, tunnels) → force HIGH
- `cross_surface` (more than one surface) → at least MEDIUM
- `new_business_logic` → at least MEDIUM
- `cosmetic` (CSS, padding, colours, typos, strings, simple config) → LOW

Surface classification uses the resolved lane metadata in `WorkflowRuntimeContextV1.lane_context.registry`; new surfaces require coordinator-supplied lane metadata.

## 4. Parallel-safety conditions per lane

| Lane | Parallel-safe when |
|------|---------------------|
| `code-low` | owned files, conflict groups, and configured mirror topic keys are fully disjoint across units |
| `code-medium` | explicitly confirmed by coordinator AND fully disjoint ownership; default to serial |
| `code-high` | NEVER — always serial due to cross-cutting risk |
| `doc` | owned files rarely overlap unless multiple units update the same doc |
| `unit-tests` | test files target different modules and no shared mocking/fixture dependencies |
| `pwauto-tests` | projects and browser contexts are disjoint |

Never parallelize units that:

- modify the same file or narrow glob;
- belong to the same `Conflict group`;
- have a dependency relationship (direct or transitive).

Units with `apply_lane: none` are coordinator-owned and do NOT consume any `sdd-apply-*` lane.

## 5. Pre-Implementation Gate (apply-lane enforcement)

Each apply lane enforces its own gate before writing code:

| Lane | Required gate(s) | Block action |
|------|------------------|--------------|
| `sdd-apply-code-low` | Scope (unit ID, `apply_lane: code-low`, owned files) | `blocked`, `routing_tag: tasks_contract_missing` |
| `sdd-apply-code-medium` | Scope + Spec linkage + Implementation target + Verification target + Failure routing | `blocked`, `routing_tag: tasks_contract_missing` |
| `sdd-apply-code-high` | Same 5 as medium + Cross-cutting safety gate (migration safety, security contracts, cross-surface consistency, runtime contracts) | `blocked`, `routing_tag: code_issue` (cross-cutting) or `tasks_contract_missing` (contract) |

The coordinator enforces the gate when **assigning** units. The apply lane re-verifies the gate before writing code. Both gates must pass; either may block.

The cross-cutting safety gate requires the apply executor to read and apply each coordinator-injected surface-policy skill itself. Policy skills are documents, not agents or delegation targets. A missing or unreadable required policy blocks before work with `skill_resolution_missing`.

## 6. Verification mapping by lane

The verification lanes are derived from `apply_lane` plus the binding's verification-lanes list. The split-lane verification values come from `WorkflowRuntimeContextV1.lane_context.registry` (entries with `role: "verification"`):

| `apply_lane` | Required verification lane |
|--------------|-----------------------------|
| `code-low`, `code-medium`, `code-high` | role `verification` + `artifact_class: "code_review"` (always); role `verification` + `artifact_class: "unit_test_review"` if new testable logic |
| `doc` | role `verification` + `artifact_class: "code_review"` (read-only doc/policy review) |
| `unit-tests` | role `verification` + `artifact_class: "unit_test_review"` |
| `pwauto-tests` | role `verification` + `artifact_class: "pwauto_test_review"` |
| `none` | none (coordinator-owned mechanical work) |

The exact lane names listed in the verify lane column are binding-driven (configured under `WorkflowRuntimeContextV1.lane_context.registry`), not protocol-locked. For the `mis-proyectos` overlay the configured names are `sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwauto`, `sdd-verify-pwcli` (lane roles with the matching `artifact_class` values). Another overlay may declare different lane names; the protocol requires only that the binding declares one of each `artifact_class`.

## 7. Mirror topic, primary heading, and section ownership

**Index-primary variant:** each unit writes implementation evidence to the `apply-<unit_id>` phase artifact and returns status + `artifact_ref`. The coordinator maintains the compact work-unit status table.

**Ledger variant (`primary.role` ledger/absent):** for each unit, any configured generic mirror key comes from `WorkflowRuntimeContextV1.artifact_context.mirrors[]`. The unit writes to its owned primary section; parallel writes to the same section are serialised.

The artefact that hosts the breakdown row is resolved from the active `WorkflowRuntimeContextV1` (the `tasks` phase artifact under index mode, or the owned primary section under ledger mode). Mirror topic keys, when present, travel in the lane envelope's `artifacts` field; the lane does not need to remember them between calls.

## 8. Sources

- `.agents/skills/sd-protocol/workflow-runtime-context.md` — the formal context contract that supplies column-shape values (`source`, `artifact_context`, `phase_context`, `gate_context`, `delivery_context`).
- `.agents/skills/sd-protocol/sdd-phase-common.md` §C/§D — universal persistence, envelope base and gate hooks.
- `.agents/skills/sd-protocol/persistence-contract.md` — universal primary-before-mirror and three-value availability rules.
- `.agents/skills/sd-protocol/acceptance-criteria-gates.md` — parametric gate evaluators.
- The binding the locator points at (e.g. `projectctl-requirements/references/tareas.md` for the `mis-proyectos` overlay) — supplies configured values (column 9's key pattern, active section identifier, lane names).

If any of those sources disagree with this file, this file wins for the **schema** (columns 1-13, complexity evaluation, parallel-safety rules, gate, verification mapping); the binding wins for the **concrete values** (which section identifier hosts the breakdown, which mirror key template applies, which lane names route to a role).
