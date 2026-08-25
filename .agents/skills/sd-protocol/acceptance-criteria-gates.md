# Acceptance Criteria Gates — Mechanism Contract

> **Single source of truth** for the universal mechanisms used to enforce acceptance-criteria gates across the SDD lifecycle. The mechanism definitions live here; concrete gate IDs, headings, paths, reason codes and recording locations are supplied by `WorkflowRuntimeContext` (configured from the active project binding). No skill or coordinator hardcodes these values; no value is treated as universal across projects.

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

**Mechanism**: every phase return envelope MUST declare a non-empty `criteria_covered` field whose values are a subset of the approved AC IDs configured for the active change.

**Context inputs** (from `WorkflowRuntimeContext`):

- `gate_context.gates[<envelope_gate>].configuration.ac_codes_set` — authoritative list of approved AC IDs for the active change.
- `gate_context.gates[<envelope_gate>].configuration.allowed_exception_value` — special token (typically `"none"`) that marks non-AC phases.
- `gate_context.<envelope_gate>.recording_section` — heading where the rejection is recorded.
- `gate_context.<envelope_gate>.reason_codes.missing_or_invalid` — text used when the envelope is rejected.

**Rule**:

1. The evaluator MUST reject any phase return whose `criteria_covered` is missing, empty, or references AC IDs not present in `ac_codes_set`.
2. On rejection, the evaluator MUST NOT advance task state.
3. The evaluator MUST record the rejection in `recording_section` with the configured reason code and the offending phase identifier.

**Exception — `criteria_covered: <allowed_exception_value>`**:

- The evaluator MAY admit this only when the active binding marks the phase as a non-AC concern (e.g., infra-only bootstrap, pre-SDD cleanup).
- The exception MUST be recorded with full justification and the coordinator/agent identity.

## 1b. Self-report verification evaluator (trust-but-verify)

**Mechanism**: a lane return envelope is a **self-report**. Before accepting a lane's `success` and advancing task state, the coordinator MUST independently verify that the concrete claims in the envelope actually happened. Declared work that cannot be verified is treated as not done.

**Applies to**: every `sdd-apply-*` lane return, every `sdd-verify-*` lane return, the `judgment-day` fix-actor return, and any control action that claims a filesystem/runtime/VCS effect. It runs in addition to §1 (the envelope evaluator); §1 checks the envelope is well-formed, §1b checks its claims are real.

**Verification obligations** (only those the envelope actually claims):

1. **File writes** — for each file the envelope says it created or modified (including the lane's own phase artifact `artifact_ref`), the coordinator MUST confirm the file exists and contains the claimed change (e.g. read it, or diff/stat it). A claimed write that is absent is a verification failure.
2. **Test / command results** — for any pass/fail, coverage number, or command output the envelope reports, the coordinator MUST have real evidence: the command, its exit status, and its output. A reported green with no reproducible evidence is treated as unverified. The coordinator MUST NOT re-run heavy commands itself beyond its command authority; instead, if evidence is missing, it routes back to the owning lane or the appropriate `sdd-verify-*` lane.
3. **External identifiers** — any URL, PR link, issue ID, commit SHA, or resource ID reported MUST be confirmed to exist / resolve before it is recorded as fact in the index.
4. **Scope honesty** — the set of changed files MUST be within the unit's `Archivos owned`; out-of-scope edits are a verification failure even when otherwise correct.

**Rule**:

1. If any claimed effect fails verification, the coordinator MUST NOT accept `success`, MUST NOT advance task state, and MUST NOT write the claim into the index as fact.
2. It records a `self_report_unverified` failure under the configured problems section, naming the specific unverifiable claim, and either routes back to the owning lane for correction or moves to `blocked` preserving the interrupted `phase`/`state`.
3. Verification is bounded by the coordinator's own command authority; when confirming a claim would exceed that authority (e.g. running a heavy test suite), the coordinator routes the evidence need to the owning `sdd-verify-*` lane instead of trusting the report or overstepping.

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

1. If ALL AC states are `mantener` → pass automatically; no docs update is required.
2. If ANY AC state is `modificar`, `eliminar` or `añadir` → the evaluator MUST verify that the configured `docs_surface` bundles include the matching AC IDs in `bundle_criteria_field`.
3. On mismatch, the evaluator MUST block the transition to the terminal state, record the blocker with the configured reason code (naming the offending AC IDs), and queue the configured docs-apply lane to resolve the gap.

The task stays in the configured pre-terminal state until the docs update is complete.

## 4. Source resolution

The `WorkflowRuntimeContext` that supplies all configured values is owned by the binding/context layer, not by this protocol file. The formal contract schema — the only authoritative shape of `WorkflowRuntimeContextV1` — lives in `.agents/skills/sd-protocol/workflow-runtime-context.md`. If a project binding does not configure a value, the corresponding gate cannot run and the caller MUST return `blocked` — the gate MUST NOT invent a default.

Coordinator-level enforcement summaries live in `coordinador/SKILL.md`; this file remains the mechanism-level source of truth.

## 5. Hook registration

Every configured evaluator in `WorkflowRuntimeContextV1.gate_context.gates` corresponds to one of these kinds. The binding authors choose the kind and the kind-to-gate-id mapping; the mechanism only fixes the following kind taxonomy:

- `envelope_gate` — see §1.
- `transition_gate` — see §2.
- `app_map_close_gate` — see §3 (close gate).
- `revision_gate` — evidence that one configured revision counter exceeds another (for example `documentation_revision >= verification_revision`); the configured identifiers of the counters come from the binding.
- `evidence` — a guard whose `required_evidence[]` is the closed set of evidence ids the binding declares; the gate passes only when every id has a matching `gate_context.evidence_refs[]` entry.
- `hard_gate` — a composite that combines one or more evidence gates plus any project-defined structural check; the binding declares which checks compose the gate.

A binding that registers a gate with an unknown kind is `binding_required_input_invalid_format` and blocks. The protocol never invents new kinds.