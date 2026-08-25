# WorkflowRuntimeContext — Portable Contract

> **Single source of truth** for the formal shape of `WorkflowRuntimeContextV1` and the rules the coordinator MUST follow to resolve, validate, and inject it. Consumers (`coordinador`, every `sdd-*` lane, `sd-protocol`) read this file to learn the contract; no other file restates the schema. This contract is binding-mechanism-level: concrete values are never hardcoded here and always arrive through the binding the locator points to.

The formal contract in this file is referenced by:

- The consumer-side resolver in `coordinador/SKILL.md` `## WorkflowRuntimeContextV1 resolution`.
- The parametric gate mechanism in `acceptance-criteria-gates.md` §4.
- The parametric envelope and persistence in `sdd-phase-common.md` §C/§D and `persistence-contract.md`.

## 1. Why this file exists

A coordinator that consumes a binding (`TaskFlowBindingV1` or any binding shape satisfying §3) needs an injectable runtime context whose fields are bounded, strict-optional, and free of any local literal; whose source identity is traceable from the locator and binding; and whose failure handling is **closed** (missing/mismatched/ambiguous inputs return `blocked` and preserve state). Any lane that depends on its shape MUST reference this file — never restate it.

## 2. Cross-cutting invariants (universal — never overridden)

These invariants are part of the mechanism. A binding or a project overlay can configure **values**, never these **rules**:

1. **Locator + binding are the only sources.** The coordinator MUST NOT invent phase/state names, lane ids, gate ids, branch names, store adapters, mirror keys, topic patterns or close rules; every such value is read from the locator-resolved binding.
2. **Closed failures preserve state.** Any failure mode below returns `status: blocked` with no advance; the current `phase`, `state`, `status` from the active frontmatter are preserved verbatim. The coordinator MUST NOT alias, normalize, repair, or rewrite them.
3. **Single source of authority.** At most one locator and one binding are valid for a single resolution; multiple candidates collapse to `blocked`. There is no fallback to hidden defaults.
4. **Primary-before-mirror is conditional.** With no mirrors, `write_order` is exactly `["primary"]` and mirror procedures are inert. With mirrors, canonical writes occur first, followed by every mirror exactly once in configured order.
5. **Mirror availability is conditional.** When mirrors exist, availability uses exactly `available | unavailable | unknown`; static checks cannot assert `available`. With no mirrors, availability accessors are absent.
6. **Mirror-failure handling is conditional.** `on_required_mirror_failure` is required when mirrors exist and absent when none exist.
7. **Full retrieval applies only to configured mirrors.** Any configured mirror read uses its full-retrieval primitive; with no mirrors there is no mirror retrieval step.
8. **Read-before-write / safe-write.** Before any write to the primary, the writer re-reads the active primary section it owns; if the section changed under the writer, the writer returns the intended patch/evidence and the coordinator returns `blocked`. Section ownership is resolved by the configured unique heading identifier, not by numeric slot.
9. **Conflicts are detected, not silenced.** When two writes contest the same owned section, mirror, or topic key, the coordinator returns `blocked` with both candidates and never auto-merges.
10. **Persistence ordering is exhaustive.** `write_order` is `["primary"]` for zero mirrors, otherwise `primary` followed by each configured mirror exactly once.
11. **Envelope base fields are universal.** Every phase return envelope MUST declare `status`, `executive_summary`, `artifacts`, `next_recommended`, `risks`, and `skill_resolution`. A binding that configures mirrors MAY add a generic availability field through `envelope_template.additional_fields`.
12. **Hooks are universal.** Gate hooks (`envelope_gate`, `transition_gate`, `app_map_close_gate`, `revision_gate`, `evidence`, `hard_gate`) are configurable evaluators declared by the binding; their identifiers are read from the binding's `gates` registry, never invented.
13. **Universal vs overlay is explicit.** Whenever a value is a concrete local default of one project overlay, the contract names it as "configured overlay", never as a universal value.
14. **Coordinated SDD skill resolution is injection-only.** The coordinator resolves and validates every exact path in `lane_context` before launch. Lanes consume only those accessors; they never recover missing skill paths from registries, raw source files, memory, session state, guesses, or reminders. `injected-paths` is the only successful SDD envelope value.
15. **Task-selected helpers are per-execution captures.** Before materializing the context, the coordinator re-reads the canonical task file, reconciles selected logical IDs against immediate non-symlink installed skill entries, and freezes the result. Missing/conflicting selections warn and omit without weakening mandatory lane/surface skills; an active context is never hot-reloaded.

## 3. Resolver input requirement

The coordinator is the only consumer allowed to read the locator, raw binding, and generated projection. It validates whichever project binding the locator selects, then publishes the bounded context in §4. Lanes and protocol helpers MUST NOT read raw binding or projection data to complete missing context fields.

The resolver MUST obtain enough source data to construct every required field in §4. Binding fields that map to optional context fields (for example a mirror `query_pattern`, adapter primitive, preflight command, or command-authority entry) remain optional; absence MUST NOT invalidate a binding unless an active lane actually requires that capability. Required identity/state fields remain fail-closed.

The generated state projection is a derived, non-authoritative view for tooling/UI only. The resolver MUST NOT validate it against the binding: no SHA-256 digest comparison, no source identity check, and no version check. A missing, stale, or unreadable projection never invalidates the binding or blocks resolution.

## 4. The bounded shape — TypeScript

This is the **only** contract shape the coordinator hands to an SDD lane. The field names are stable accessors: consumers read them directly and never fall back to raw binding/projection reads.

```ts
type WorkflowControlKindV1 = "action" | "outcome" | "terminal";
type MirrorAvailabilityV1 = "available" | "unavailable" | "unknown";
type ApplyLaneV1 = "code-low" | "code-medium" | "code-high";

interface TaskSkillSnapshotCaptureV1 {
  readonly schema: "task-skills/v1";
  readonly selected_ids: readonly string[];
  readonly warnings: ReadonlyArray<{
    readonly id?: string;
    readonly code: "snapshot_parse_error" | "duplicate_id" | "missing_skill" | "skill_id_conflict";
  }>;
}

interface WorkflowControlTransitionV1 {
  id: string;
  from: string;
  to: string;
  guard?: string;
}

interface ArtifactMirrorV1 {
  adapter: string;
  required: boolean;
  owner: string;
  key: string;
  key_pattern?: string;
  query_pattern?: string;
  availability: MirrorAvailabilityV1;
  role?: "ledger" | "knowledge";
  knowledge_types?: string[];
  write_primitive: string;
  read_primitive: string;
  search_primitive?: string;
  update_primitive?: string;
  adapter_contract: string;
}

interface ArtifactContextBaseV1 {
  primary: {
    adapter: string;
    path: string;
    owner: string;
    heading_map: Record<string, string>;
    role?: "index" | "ledger";
    index_budget?: {
      max_lines: number;
      max_phase_summary_lines: number;
    };
  };
  phase_artifacts?: {
    path_pattern: string;
    artifact_keys: string[];
  };
  forbidden_paths: string[];
  static_preflight?: string;
}

type ArtifactContextV1 = ArtifactContextBaseV1 & (
  | {
      mirrors: [];
      write_order: ["primary"];
      on_required_mirror_failure?: never;
      availability_values?: never;
      runtime_preflight?: never;
      failure_record?: never;
    }
  | {
      mirrors: [ArtifactMirrorV1, ...ArtifactMirrorV1[]];
      write_order: ["primary", ...string[]];
      on_required_mirror_failure: "block" | "degrade";
      availability_values: ["available", "unavailable", "unknown"];
      runtime_preflight?: string;
      failure_record: {
        section: string;
        status_field: string;
        last_check_field?: string;
        blocker_field: string;
      };
    }
);

interface WorkflowRuntimeContextV1 {
  source: {
    config_path: string;
    binding_path: string;
    binding_id: string;
    binding_version: string;
  };

  task_ref: {
    path: string;
    active: boolean;
    task_id: string;
    task_slug: string;
    change_id?: string;
    id_pattern: string;
    slug_pattern: string;
    heading_owners: Record<string, string>;
  };

  state_model_ref: {
    path: string;
    artifact_role: "generated";
    model_version: number;
  };

  artifact_context: ArtifactContextV1;

  phase_context: {
    phase: string | null;
    state: string;
    status: string;
    position_kind: "phase_state" | "control";
    allowed_lanes: string[];
  };

  control_context: {
    active: {
      id: string;
      kind: WorkflowControlKindV1;
      writes_state: boolean;
      phase: string | null;
      state: string;
      status: string;
      preserves: string[];
    } | null;
    controls: Record<string, {
      kind: WorkflowControlKindV1;
      writes_state: boolean;
      phase: string | null;
      state: string;
      status: string;
      preserves: string[];
      transitions: Array<WorkflowControlTransitionV1>;
    }>;
  };

  lane_context: {
    lane_id: string;
    authorization: "allowed";
    allowed_lanes: string[];
    registry: Record<string, {
      skill: string;
      apply_lane?: ApplyLaneV1;
      role: string;
      artifact_class: string;
      owner_phase?: string;
    }>;
    lane_skill_path: string;
    surface_skill_paths: readonly string[];
    task_skill_snapshot: TaskSkillSnapshotCaptureV1;
    task_selected_skill_paths: readonly string[];
    skill_paths: readonly string[];
    command_authority?: {
      allowed: string[];
      forbidden: string[];
      escalation_owner: string;
    };
  };

  gate_context: {
    active_gate_ids: string[];
    gates: Record<string, {
      evaluator: string;
      required_evidence: string[];
      failure?: string;
      configuration?: Record<string, unknown>;
    }>;
    evidence_refs: string[];
  };

  envelope_context: {
    additional_fields: string[];
    criteria_covered_field?: string;
    mirror_availability_field?: string;
    summary_field?: string;
    artifact_ref_field?: string;
  };

  mode_context: {
    review: {
      selected: string;
      default: string;
      allowed: readonly string[];
      mechanism_skill_ids: readonly string[];
    };
    delivery: {
      selected: string;
      default: string;
      allowed: readonly string[];
      mechanism_skill_ids: readonly string[];
      pr_line_budget?: number;
    };
    resolved_mechanism_skill_paths: {
      review: readonly string[];
      delivery: readonly string[];
    };
  };

  delivery_context: {
    source_branch: string;
    target_branch: string;
    branch_pattern: string;
    branch_name: string;
    action_order: string[];
    required_evidence_at_close: string[];
  };
}
```

### 4.1 Position semantics

A frontmatter position is valid when exactly one of these rules matches:

1. **Phase-local state** — `phase_context.position_kind == "phase_state"`; `phase` identifies a configured phase and `state` is one of that phase's states.
2. **Control state** — `phase_context.position_kind == "control"`; `state` identifies `control_context.active.id` and the active control's resolved `phase/state/status` tuple matches frontmatter. Action controls may retain a non-null phase without becoming members of that phase's `states[]`.
3. **Outcome control** — `blocked`/`failed`-style controls have `writes_state: false`; their status changes while the preserved phase/state identify the interrupted position.
4. **Terminal control** — a terminal control may resolve `phase: null`; its state/status tuple comes from the control definition.

Therefore action/terminal/outcome controls are never appended to `phases[].states`. `final_commit_pending`, `final_push_pending`, `final_pr_pending`, `done`, `blocked`, and `failed`-style values are valid only when supplied through `control_context`; their concrete identifiers remain binding-driven.

### 4.1.1 Named control-transition semantics

A control transition is resolvable only when its `id`, `from`, `to`, and optional `guard` are materialized in the bounded context. The transition `from` value MUST equal the containing control id, the `to` value MUST resolve to a declared phase-local state or control, and a named `guard` MUST resolve through `gate_context.gates`. A control-to-phase re-entry is legal only when that explicit transition is selected and every required guard evidence item is present; the coordinator MUST NOT infer a cross-phase jump from the target state, status, or lane alone. Malformed or unnamed control-transition metadata returns `transition_invalid` and preserves the current position.

### 4.2 Bounded accessor rule

- `workflow_context_ref` in every lane means an immutable reference to one fully materialized `WorkflowRuntimeContextV1` snapshot.
- `artifact_refs` contains only lane-specific content references or owned files not already represented by `task_ref`/`artifact_context`; it never contains the raw binding or projection.
- Lane authorization is `lane_context.authorization == "allowed"` plus membership in `lane_context.allowed_lanes`. A lane never repeats the resolver's membership check against raw phase or lane catalogs.
- First branch on `artifact_context.mirrors.length`. Zero mirrors requires exactly `["primary"]`; mirror-only fields MUST be absent and consumers perform no mirror work. A non-empty tuple requires failure/availability/failure-record fields plus each adapter's write/read contract; missing required adapter capability returns `blocked` rather than inventing it.
- Routing/ownership reads `lane_context.registry`. Each entry's `skill` is the logical implementation identity; it is resolved through the configured skill registry and is not assumed to equal the lane id. Optional `apply_lane` selects the unified code skill's rigor and is limited to `code-low | code-medium | code-high`. Section ownership reads `task_ref.heading_owners` or `artifact_context.primary.heading_map`; gate execution reads `gate_context.gates`; delivery/closure reads `delivery_context`.
- Skill loading reads `lane_context.lane_skill_path` as the mandatory implementation skill for the selected lane and `lane_context.surface_skill_paths` as the required applicable surface policies. `task_skill_snapshot` is the immutable audit capture made from a canonical re-read at execution start; `task_selected_skill_paths` is its installed, non-conflicted subset resolved only by the coordinator and sorted by logical ID. `lane_context.skill_paths` is the complete ordered aggregate: lane skill first, configured surface policies next, then optional helpers, with exact-path first-wins deduplication. No cap, truncation, fallback, empty selection, or warning may remove/reorder mandatory entries or change modes/gates. The coordinator resolves and validates all paths as readable before delegation; the lane loads only those exact files and never reopens the task, scans inventory, or performs recovery discovery.
- Mode selection reads only the immutable `mode_context` after materialization. For each mode, `selected` is the explicit active-task frontmatter value when present and otherwise `default`; both MUST belong to `allowed`. `mechanism_skill_ids` contains only logical ids from the selected binding configuration. Exact registry-validated physical paths are isolated in `resolved_mechanism_skill_paths` and are orchestration mechanisms, never lane skills or additions to `lane_context.skill_paths`.

This shape MUST NOT be extended ad hoc per lane. A genuinely new cross-project fact requires a versioned context-contract change.

### 4.3 Primary-index vs phase-artifact split (optional mechanism)

A binding MAY declare the primary as a **compact coordination index** rather than an accreting ledger. When `artifact_context.primary.role == "index"`:

- The primary at `task_ref.path` holds only coordination state: identity/frontmatter, objective, acceptance-criteria **ids and verdicts** (not their prose), a per-phase summary table (each summary bounded by `index_budget.max_phase_summary_lines`), a work-unit status table, a consolidated verification verdict, the resume/handoff block, active blockers, and delivery bookkeeping.
- Full phase detail (exploration analysis, proposal, delta specs, design, work-unit contracts, verification evidence, archive report) lives in **phase artifacts** whose paths are produced by `artifact_context.phase_artifacts.path_pattern` parameterised with the active `task_id` and one `artifact_keys[]` value. The index references each phase artifact by path and never inlines its content.
- `index_budget` bounds the index. A coordinator that finds the primary exceeds `index_budget.max_lines`, or a phase summary exceeds `index_budget.max_phase_summary_lines`, returns `index_budget_exceeded` and preserves state; the overflow belongs in the phase artifact, never in the index.
- When `primary.role` is absent or `"ledger"`, the historical accreting-primary behavior applies unchanged; the split is opt-in per binding.

A lane that owns a phase artifact writes its full detail to the resolved `phase_artifacts` path and returns a bounded summary plus that artifact reference through the envelope (see §4.4). It does not write coordination sections of the index; the coordinator is the single writer of the index. This removes multi-lane contention over shared index sections: lanes serialize only within their own phase artifact.

### 4.4 Envelope summary + artifact reference (optional mechanism)

When the binding declares `envelope_context.summary_field` and `envelope_context.artifact_ref_field`, every lane return envelope MUST additionally carry:

- a bounded `summary` (under the configured `summary_field`) that the coordinator copies verbatim into the index's per-phase table;
- an `artifact_ref` (under the configured `artifact_ref_field`) pointing at the phase artifact the lane wrote;

These fields are additive to the universal envelope base (§2 #11); a binding that omits them keeps the historical single-artifact envelope.

## 5. Closed failure modes

Each failure mode below produces `status: blocked` from the coordinator envelope and preserves `phase`/`state`/`status` from the active frontmatter verbatim. The coordinator MUST NOT advance, repair, normalize, alias, or rewrite any of them. The failure mode identifier is the single source of truth for the reason recorded in the configured blocker section of the primary.

### 5.1 Locator layer

- `locator_missing` — no `WorkflowBindingLocatorV1` reachable from the configured `config_path`.
- `locator_duplicated` — two or more distinct locator candidates resolve; ambiguity is fatal.
- `locator_contract_version_mismatch` — `locator.contract_version` differs from the version this contract declares.
- `machine_block_id_mismatch` — the locator's `machine_block_id` differs from what the binding consumer contract demands (e.g. not `task-flow-binding` when the consumer expects that id).

### 5.2 Binding layer

- `binding_unreadable` — `locator.binding_path` cannot be read at all.
- `binding_block_missing` — neither `<!-- task-flow-binding:start -->` nor its counterpart close marker is present.
- `binding_block_duplicated` — the markers appear more than once.
- `binding_block_delimiter_invalid` — markers are not on their own line, the body is not a unique fenced `json` block, or the body is not strictly between the markers.
- `binding_parse_failed` — the unique fenced JSON is not parseable.
- `binding_shape_invalid` — the parsed object cannot supply one or more required fields of the bounded shape in §4.
- `binding_id_mismatch` — `binding.binding_id` differs from `locator.expected_binding_id`.
- `binding_version_mismatch` — when the locator pins a version, `binding.binding_version` differs.

### 5.3 Projection layer

- The projection is a derived, non-authoritative view (§3); it is never validated against the binding and produces no closed failure mode.

### 5.4 Frontmatter layer

- `taskref_unreadable` — the active primary path produced from the binding is not readable.
- `taskref_frontmatter_invalid` — frontmatter does not parse, or is missing required identity fields.
- `taskref_status_not_writable` — `status` is not a member of `binding.status.writable`.
- `taskref_pre_bootstrap_inconsistent` — `status` equals `binding.status.pre_bootstrap` while `phase` or `state` is non-empty.
- `taskref_unknown_phase` — `phase` does not identify any `binding.phases[].id`.
- `taskref_unknown_phase_state` — `position_kind` is `phase_state` and `state` does not appear in the resolved phase-state set.
- `taskref_unknown_control` — `position_kind` is `control` and `state` does not identify a resolved control.
- `taskref_control_value_mismatch` — the active control's resolved phase/state/status semantics do not match frontmatter.
- `taskref_id_pattern_mismatch` — `task_id` does not match `binding.task.id_pattern`.
- `taskref_slug_pattern_mismatch` — `task_slug` does not match `binding.task.slug_pattern`.
- `taskref_retired_alias_active` — a value declared in the binding's retired-alias list (or equivalent) is present as a writable `status` or a routable lane id.
- `index_budget_exceeded` — `artifact_context.primary.role == "index"` and the primary exceeds `index_budget.max_lines`, or a per-phase summary exceeds `index_budget.max_phase_summary_lines`; the overflow belongs in the phase artifact, not the index.

### 5.5 Lane / transition layer

- `lane_unknown` — requested lane id does not appear in `binding.lanes`.
- `lane_not_allowed_in_phase` — requested lane id does not appear in `binding.phases[phase].allowed_lanes` (or in `binding.controls[]` for action/terminal controls).
- `lane_alias_retired` — requested lane id is one of the binding's retired aliases.
- `skill_resolution_missing` — the selected lane's logical `skill` is absent, cannot be resolved through the configured registry to one exact repo-relative `SKILL.md`, the resolved lane file is unreadable, or a required surface policy/injected helper is missing, unreadable, unresolvable, truncated, or replaced by a fallback. Missing/conflicted task-selected IDs are instead captured as non-blocking warnings and omitted. The coordinator does not launch a lane with an incomplete aggregate; a lane that somehow receives one stops before work with the same routing reason.
- `transition_invalid` — requested `(phase, state, status) → (phase', state', status')` does not match any entry in `binding.controls[]` or `binding.phases[].transitions[]`.
- `transition_guard_failed` — every named guard on the chosen transition evaluates false under the resolved context evidence; the failing guard id is recorded.
- `guard_unknown` — a named guard is not declared in `binding.gates`.
- `mode_config_invalid` — required review/delivery mode configuration is missing or malformed; default/allowed membership is invalid; the selected mode configuration is absent; a logical mechanism skill is missing, duplicated, or cannot resolve through the portable skill registry; or a configured PR line budget is not a positive integer.
- `mode_selection_invalid` — an explicit active-task review or delivery selection is not a string member of the corresponding configured `allowed` set.

### 5.6 Required-input or shape-mismatch layer

- `binding_required_input_absent` — a value required by §3 is not present; the missing key is recorded.
- `binding_required_input_invalid_format` — a value format is malformed (e.g. `task_id_pattern` is not a valid regex when the binding treats it as one).

### 5.7 Mirror-failure layer

- `mirror_unavailable_runtime` — a configured `required` mirror is unreachable; preserved primary; full artefact stays in the primary.
- `mirror_write_failed_runtime` — a configured `required` mirror refused a write; preserved primary.
- `mirror_digest_mismatch_runtime` — a full-retrieval read produced content whose digest differs from the binding identity; preserved primary.

The projection (§5.3) is derived and non-authoritative: it produces no closed failure mode and never blocks resolution. Mirror-failure failures block during the lane's artefact persistence (after context is valid but before the lane can return success) and preserve state.

## 6. Bounded context hand-off

The coordinator injects the bounded shape of §4 into every SDD lane invocation. The lane receives exactly:

1. The bounded `WorkflowRuntimeContextV1` snapshot/reference (no less, no more).
2. The Injected Project Rules block from `sdd-phase-common.md` §E, filled only from bounded context accessors.
3. The lane's technical inputs (for example work-unit rows, owned source files, or browser preconditions). These inputs MUST NOT contain raw binding/projection data or duplicate fields already published by the context.

The coordinator may read `source.config_path` internally during resolution, but a lane MUST NOT open that locator, `source.binding_path`, or `state_model_ref.path` to recover omitted policy. The interpretation of position, lane authorization, gates, ownership, mirror behavior, modes, and delivery MUST use `phase_context`, `control_context`, `lane_context`, `gate_context`, `task_ref`, `artifact_context`, `mode_context`, and `delivery_context`.

## 7. Verifying the contract without a specific project

A consumer of `sd-protocol` can prove the contract is portable by running the universal checks below against an alternative binding fixture:

- An alternative binding using foreign values throughout (different `task.file_pattern`, different `delivery.source_branch` base, a `filesystem` primary over a different path, a `mirrors[]` adapter from a different family/`key_pattern`, foreign `phases[]` ids/states, foreign `gates{}` evaluator ids) MUST still produce a valid `WorkflowRuntimeContextV1` whose accessors resolve to the fixture values and which contains zero concrete literal from any specific project overlay.
- A scan of `sd-protocol/` reports zero local literals outside this file's references to the mis-proyectos overlay as a configured overlay example; any literal usage outside this file is routed to `code_issue` in `sdd-verify-code`.
- The contract's §4 shape is delivered as TypeScript and as a JSON schema reference (when one is published); consumers importing both see the same field set.

## 8. Relation to overlay-specific files

Three categories of file live alongside this contract:

- **Universal mechanism files** in `sd-protocol/`: skill loading (`sdd-phase-common.md` §A), full retrieval (`sdd-phase-common.md` §B), primary-before-mirror (here §2 #4 and §2 #10), safe-write/ownership (`sdd-phase-common.md` §C and `apply-work-unit-schema.md`), envelope base (`sdd-phase-common.md` §D), gate hooks (`acceptance-criteria-gates.md`), work-unit schema (`apply-work-unit-schema.md`), skill registry (`skill-resolver.md`).
- **Project binding files** outside `sd-protocol/`: a project's binding (e.g. `projectctl-requirements/references/tareas.md`) declares the concrete values this contract keeps parametric.

Consumers MUST NOT read adapter-specific support-tool documentation to learn universal rules. They read this file for the shape and `apply-work-unit-schema.md` only for the work-unit row schema.

## 9. Versioning

This contract's shape is currently `WorkflowRuntimeContextV1`. Compatible additive accessors remain V1 and bump the implementation contract skill's MINOR version; incompatible field removal or type narrowing requires a new numbered context contract and a MAJOR skill bump. Adding a closed fail-safe reason for a new accessor is compatible when existing successful inputs retain their behavior. The implementation contract skill's `metadata.version` is authoritative. The binding's `binding_id` / `binding_version` are independent of this contract's version and do not change when their machine shape is unchanged.

The primary-index/phase-artifact split (§4.3), the envelope summary+ref fields (§4.4), the knowledge-role mirror (§4.5), and the binding-backed `mode_context` accessor are compatible additions to `WorkflowRuntimeContextV1`. The binding overlay bumps independently only when its own machine shape changes; materializing existing v7 mode values into `mode_context` does not change binding v7.
