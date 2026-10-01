# Acceptance Criteria Gates — Mechanism Contract

> **Single source of truth** for the universal mechanisms used to enforce acceptance-criteria gates across the SDD lifecycle. The mechanism definitions live here; concrete gate IDs, headings, paths, reason codes and recording locations are supplied by `WorkflowRuntimeContext` (configured from the active project binding). No skill or sdd-orchestrator hardcodes these values; no value is treated as universal across projects.

These mechanisms implement the parametric equivalents of the historical envelope validator (the `criteria_covered`-style requirement), hard phase/branch gate (the historical "Fase 1 → Fase 2" boundary) and close gate (the historical APP-MAP consistency check). The historical names referenced here are illustrative; each project's binding configures its own set of evaluators with their own IDs, headings, paths, reason codes and recording sections.

## 0. Mechanism contract

A "gate" is a configured evaluator that:

1. Receives a `gate_request` (a phase return envelope, a transition request, or a close candidate) and the active `WorkflowRuntimeContext` snapshot (binding identity + artifact context + phase context + close rules).
2. Resolves its **identity**, **headings**, **paths**, **reason codes** and **recording location** from `WorkflowRuntimeContextV1.gate_context.gates[gate_id]` and its optional `configuration`.
3. Evaluates the structural rule described in the corresponding section below.
4. Returns `pass`, `block` (with reason code) or `degrade` (only when configured to allow a non-closing degraded step).
5. On block, records the failure in the configured `recording_location` using the configured reason code; the caller MUST NOT advance state until the record is durable.

A gate never decides ID formats, headings, paths, phase/state names or close rules by itself — it always asks the context. A gate is therefore portable: changing the binding/context changes the gate's concrete behaviour without editing this file.

## 1. Envelope evaluator (`criteria_covered`-style)

**Mechanism**: every criteria-bearing phase return declares `criteria_covered` as a subset of canonical IDs for the active change, identical to core App Map identities. There is no task-local AC catalog. Before approval, planning uses the resolved baseline and proposed definitive IDs; afterwards use the exact approved delta. A non-criteria concern may use an empty set only with the explicit justified exception and no fabricated IDs.

**Context inputs** (from `WorkflowRuntimeContext`):

- `gate_context.criteria_context` — frozen baseline/proposal references and canonical approved IDs; before approval use baseline and validated proposed definitive IDs. Legacy `ac_codes_set`, when configured, must project that same set, never another catalog.
- `gate_context.gates[<envelope_gate>].configuration.allowed_exception_value` — special token (typically `"none"`) that marks non-AC phases.
- `gate_context.<envelope_gate>.recording_section` — heading where the rejection is recorded.
- `gate_context.<envelope_gate>.reason_codes.missing_or_invalid` — text used when the envelope is rejected.

**Rule**:

1. Reject missing `criteria_covered` or IDs outside the resolved canonical set. An empty set is rejected for criteria-bearing work; admit it only for a validated non-criteria proposal/assignment with explicit justification. Never invent IDs to satisfy non-emptiness.
2. On rejection, the evaluator MUST NOT advance task state.
3. The evaluator MUST record the rejection in `recording_section` with the configured reason code and the offending phase identifier.

**Exception — `criteria_covered: <allowed_exception_value>`**:

- Admit this only when the resolved assignment/proposal is a justified non-criteria concern (e.g., infra-only bootstrap, mechanical cleanup); it cannot cover a criterion or substitute another ID.
- The exception MUST be recorded with full justification and the sdd-orchestrator identity.

## 1b. Self-report verification evaluator (trust-but-verify)

**Mechanism**: a lane return envelope is a **self-report**. Before accepting a lane's `success` and advancing task state, `sdd-orchestrator` MUST independently verify that the concrete claims in the envelope actually happened. Declared work that cannot be verified is treated as not done.

**Applies to**: every `sdd-apply-*` lane return, every `sdd-verify-*` lane return, any selected review mechanism return, and any control action that claims a filesystem/runtime/VCS effect. It runs in addition to §1 (the envelope evaluator); §1 checks the envelope is well-formed, §1b checks its claims are real.

**Verification obligations** (only those the envelope actually claims):

1. **File writes** — for each file the envelope says it created or modified (including the lane's own phase artifact `artifact_ref`), `sdd-orchestrator` MUST confirm the file exists and contains the claimed change (e.g. read it, or diff/stat it). A claimed write that is absent is a verification failure.
2. **Test / command results** — for any pass/fail, coverage number, or command output the envelope reports, `sdd-orchestrator` MUST have real evidence: the command, its exit status, and its output. A reported green with no reproducible evidence is treated as unverified. `sdd-orchestrator` MUST NOT re-run heavy commands itself beyond its command authority; instead, if evidence is missing, it routes back to the owning lane or the appropriate `sdd-verify-*` lane.
3. **External identifiers** — any URL, PR link, issue ID, commit SHA, or resource ID reported MUST be confirmed to exist / resolve before it is recorded as fact in the index.
4. **Scope honesty** — the set of changed files MUST be within the unit's `Archivos owned`; out-of-scope edits are a verification failure even when otherwise correct.

**Rule**:

1. If any claimed effect fails verification, `sdd-orchestrator` MUST NOT accept `success`, MUST NOT advance task state, and MUST NOT write the claim into the index as fact.
2. It records a `self_report_unverified` failure under the configured problems section, naming the specific unverifiable claim, and either routes back to the owning lane for correction or moves to `blocked` preserving the interrupted `phase`/`state`.
3. Verification is bounded by sdd-orchestrator's own command authority; when confirming a claim would exceed that authority (e.g. running a heavy test suite), `sdd-orchestrator` routes the evidence need to the owning `sdd-verify-*` lane instead of trusting the report or overstepping.

**Context inputs** (from `WorkflowRuntimeContext`):

- `envelope_context` — the declared envelope fields (`summary`, `artifact_ref`, `criteria_covered`, and any lane-specific claim fields).
- `artifact_context.phase_artifacts` — resolves the phase artifact path that the lane claims to have written.
- `lane_context.registry` — the owning lane to route back to on an unverifiable claim.

## 2. Transition evaluator (hard phase/branch gate)

**Mechanism**: before executing a configured branch-creation or entry-into-implementation action, the evaluator MUST verify that all configured preconditions hold; if any fails, the action is blocked.

**Context inputs**:

- `gate_context.<transition_gate>.criteria_heading` — heading under which the approved AC list and approval evidence are owned.
- `gate_context.<transition_gate>.phase_model_ref` — current phase and state, read from `state_model_ref`.
- `gate_context.<transition_gate>.branch_action` — identifier of the branch-creation control action.
- `gate_context.<transition_gate>.hold_guard` — boolean guard that must be released to allow entry into the next phase.
- `gate_context.<transition_gate>.recording_section` and `reason_codes.<transition_blocked>`.

**Rule**:

1. The evaluator MUST verify all configured preconditions (criteria evidence, approval evidence, schema phase position, released hold) before allowing the branch action.
2. On failure of any precondition, the evaluator MUST NOT execute the branch action, MUST NOT enter the next phase, and MUST NOT launch any implementation-phase lane.
3. The evaluator MUST preserve the current `phase` and `state` and record the blocker in `recording_section` with the configured reason code.

**Pass path**:

1. All preconditions pass → evaluator records explicit approval as authority for the configured "next-phase accepted" position.
2. Evaluator executes the branch action exactly once or idempotently reuses the already-available canonical branch.
3. Only after successful branch evidence may it write the configured "next-phase" frontmatter values.

A branch-creation failure leaves the task blocked at the preserved pre-transition position and MUST NOT be converted into a new phase or implicit implementation start.

## 3. Close evaluator (docs / App-Map consistency)

**Mechanism**: before transitioning a task to its configured terminal state, the evaluator MUST verify that any non-`mantener` AC state has its declared documentation counterpart in the configured close-evidence surface; otherwise it blocks the transition.

**Context inputs**:

- `gate_context.<close_gate>.ac_states_map` — mapping from AC ID to its declared state (`mantener` / `modificar` / `eliminar` / `añadir` or project-defined equivalents).
- `gate_context.<close_gate>.docs_surface` — base path of the configured documentation surface.
- `gate_context.<close_gate>.bundle_criteria_field` — frontmatter or structured field where AC IDs are declared inside a docs bundle.
- `gate_context.<close_gate>.recording_section` and `reason_codes.<close_blocked>`.

**Rule**:

1. Resolve the approved canonical delta and verify its proposal revision. The executable evaluator is `scripts/project/criteria-change.ts`, consumed by the motor. A bare evidence reference cannot satisfy its current result.
2. For maintained criteria verify unchanged definition/owner; for additions/modifications compare the materialized definition to `after`; for removals verify the retained owner tombstone with the previous definition and core retirement semantics. Reconcile operative code/test references separately. Verify unaffected baseline entries and reject unapproved scope changes. Simple ID presence is insufficient.
3. On mismatch, the evaluator MUST block the transition to the terminal state, record the blocker with the configured reason code (naming the offending AC IDs), and queue the configured docs-apply lane to resolve the gap.

The task stays in the configured pre-terminal state until the docs update is complete.

## 4. Source resolution

The `WorkflowRuntimeContext` that supplies all configured values is owned by the binding/context layer, not by this protocol file. The formal V1/V2 contract union lives only in `.agents/skills/projectctl-sdd/modules/sd-protocol/workflow-runtime-context.md`. If a project binding does not configure a value, the corresponding gate cannot run and the caller MUST return `blocked` — the gate MUST NOT invent a default.

Orchestration-level enforcement summaries live in `modules/sdd/sdd-orchestrator/module.md`; this file remains the mechanism-level source of truth.

### 4.1 Extension evaluators

An explicitly selected satellite may register additional evaluator kinds with a versioned contract. The resolver validates the selected satellite and evaluator before admitting its gates; missing, unknown or incompatible evaluators block without fallback. Unselected satellites are not consulted.

## 5. Hook registration

Every configured evaluator in `WorkflowRuntimeContext.gate_context.gates` corresponds to one of these kinds. The binding authors choose the kind and the kind-to-gate-id mapping; the mechanism only fixes the following kind taxonomy:

- `envelope_gate` — see §1.
- `transition_gate` — see §2.
- `app_map_close_gate` — see §3 (close gate).
- `revision_gate` — evaluate the binding's configured freshness predicate. Scoped requirements uses current canonical input fingerprints, not whole-Markdown revision ordering; environmental candidates retain their independent mandatory-return contract. Never infer invalidation from an editorial write alone. Use `requirements status` for per-doctor/target stale evidence and return only when the configured technical-invalid predicate holds (or the environmental return explicitly applies).
- `evidence` — a guard whose `required_evidence[]` is the closed set of evidence ids the binding declares; the gate passes only when every id has a matching `gate_context.evidence_refs[]` entry.
- `hard_gate` — a composite that combines one or more evidence gates plus any project-defined structural check; the binding declares which checks compose the gate.

A binding that registers a gate with an unknown kind is `binding_required_input_invalid_format` and blocks. The protocol never invents new kinds.

## 6. sdd-orchestrator-owned environmental-deferral evaluators (V2)

When V2 publishes `gate_context.environment_deferral`, only `sdd-orchestrator` evaluates or mutates its canonical index record. A lane envelope, receipt, report projection, UI intent, human approval or process exit status is never record evidence and cannot create, clear, revoke or satisfy it.

### Admission evaluator

The configured admission gate passes only when the canonical record and complete audit are structurally valid, the record verification revision exactly equals the current canonical verification revision, active methods form a non-empty subset of the configured allowed set after the exact initial set has been audited, and no ordinary code/coverage/test/review/evidence pending item exists. Absent records use the configured legacy path; empty, unknown, duplicated, stale, partial-initial, uncertain or inconsistent records block and are preserved. A pass authorizes only the exact binding-declared document-candidate transition and no implementation, verification, RDD, delivery, completion or alternative transition.

### Per-method evidence and revocation

`sdd-orchestrator` re-reads under safe-write/CAS before changing a record. Verified evidence must identify exactly one currently pending method and bind to the record's exact verification revision. Only that method is removed and one immutable audit event is appended. Missing, mismatched, self-reported or uncertain evidence performs no mutation. Revocation appends its configured audit event, preserves pending methods, and routes only to the binding-declared preparation position; it is not completion. When the last method has real evidence, `sdd-orchestrator` preserves audit history, removes only the active record, and re-evaluates ordinary guards without jumping phase or delivery.

### Document write and close/delivery

After admission, `sdd-orchestrator` verifies the Phase-4 document-candidate write and atomically selects the exact configured return transition while preserving pending methods. Failure or uncertainty preserves position and does not claim documentation completion. The configured close-block gate fails for every non-empty method subset and for every invalid/uncertain record at Phase-4 completion, delivery controls and terminal closure. Other successful gates—including optional RDD gates—are conjunctive and cannot override this block.
