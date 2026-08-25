# Persistence Contract — Universal Mechanism

The persistence contract defines the universal mechanism for coordinating primary reference artifacts and configured mirrors. The mechanism applies to any project overlay; concrete values (primary adapter/path, mirror adapters/keys/required flags, close rules, reason codes) come from `WorkflowRuntimeContext`. The formal contract schema for `WorkflowRuntimeContextV1` is in `.agents/skills/sd-protocol/workflow-runtime-context.md`.

## Repo-local policy resolution (mechanism + configured overlay)

For any coordinated SDD workflow, the configured primary and phase artifacts are canonical. If a binding configures mirrors, writes remain primary-before-mirror, but mirrors never become canonical merely by being configured.

- `coordinador` is responsible for enforcing the configured overlay.
- The active primary artifact path (supplied by `WorkflowRuntimeContextV1.artifact_context.primary`) is the only canonical operational + filesystem persistence artifact.
- With `mirrors: []`, `write_order` is exactly `["primary"]`; mirror failure, availability, failure-record, runtime-preflight and adapter accessors are absent and all mirror procedures are inert.
- With mirrors present, the bounded context requires complete failure/availability fields and each adapter's read/write contract. A configured required mirror is mandatory only for that branch.
- This is mandatory and non-negotiable: SDD phase outputs MUST NOT be written to parallel filesystem artifacts under `WorkflowRuntimeContextV1.artifact_context.forbidden_paths` (typical default: `proposals/`, `specs/`, `designs/`, `tasks/`).

The `mis-proyectos` overlay configures a compact taskReadme index plus phase artifacts and no mirrors. Other projects may configure generic mirrors; no adapter is a universal SDD dependency.

## Optional mirrors

Mirrors are binding-driven secondary stores. They may add search or redundancy, but the canonical primary and phase artifacts must remain sufficient for recovery.

## Contract split: canonical primary artifact vs mirror memory

- **Primary artifact** (adapter + path supplied by `WorkflowRuntimeContextV1.artifact_context.primary`) = only canonical repo-local artifact for current state, next step, branch/PR traceability, validation scope, evidence, blockers, handoff, and SDD phase sections.
- **Configured mirrors** = optional secondary copies governed by each binding.

## Primary as compact index vs accreting ledger (optional mechanism)

A binding MAY declare `artifact_context.primary.role == "index"` (see `workflow-runtime-context.md` §4.3). When it does, the persistence rule changes from "each phase appends its full artifact into a primary section" to a three-target split:

- **Primary index ← summary.** The coordinator (single writer of the index) records only coordination state: identity, per-phase summary (bounded by `index_budget.max_phase_summary_lines`), acceptance-criteria ids + verdicts, work-unit status table, consolidated verification verdict, resume/handoff, blockers, delivery bookkeeping. The index is bounded by `index_budget.max_lines`.
- **Phase artifact ← full detail.** Each lane writes its full artifact to the path produced by `artifact_context.phase_artifacts.path_pattern` (parameterised with `task_id` + its `artifact_keys[]` value) and returns a bounded `summary` + `artifact_ref` through the envelope. Lanes never write index sections; the coordinator copies the summary into the index.

Primary-before-mirror (§ ordering) still holds: the index summary and the phase artifact are the primary-side writes and precede any mirror write. When `primary.role` is `"ledger"` or absent, the historical accreting-primary behavior below applies unchanged.

## Mirror adapter limitations (per-adapter, not universal)

A mirror adapter is not a full revisioned audit system:

- It MAY support `topic_key`-style upserts that overwrite prior phase revisions.
- It is not the main human-facing execution ledger.
- It is not a git-reviewed artifact history.

The primary artifact stays mandatory even when mirrors are still required.

## Mirror availability and mirror failures (non-empty mirror branch only)

This section is inert when `mirrors: []`. For a non-empty mirror tuple, adapters are infrastructure/runtime and availability is explicit.

- The configured `init` lane checks and records mirror availability when bootstrapping SDD context.
- Every phase writes the configured primary section first, then mirrors the same artifact to each configured mirror with stable key patterns.
- If a configured required mirror read/write is unavailable, preserve the full artifact in the canonical store, record the configured generic failure field, and follow the binding's failure policy.
- A task MUST NOT transition to the configured terminal state or archive while required mirrors are missing, unless the coordinator records an explicit policy exception in the primary.
- Do NOT compensate for missing required mirrors by creating parallel filesystem mirrors under `WorkflowRuntimeContextV1.artifact_context.forbidden_paths`.

## Availability values (non-empty mirror branch only)

When mirrors exist, the configured availability field uses exactly `available`, `unavailable`, `unknown`:

- `available` — the mirror adapter is reachable and the configured preflight succeeded.
- `unavailable` — the mirror adapter is unreachable or refused reads/writes.
- `unknown` — the adapter has not been probed in the active session, or its preflight cannot prove reachability from static checks alone.

The three values MUST be preserved as distinct; collapsing them (e.g. treating `unknown` as `unavailable`) is forbidden. Static preflight MUST NOT be used to assert `available`; only the runtime preflight can transition `unknown` to `available` or `unavailable`.

## Supported mode for repo-local SDD (parametric table)

The shared protocol supports a primary with zero or more configured mirrors. The table is a template, not an allow-list:

| Mode | Primary reads/writes | Mirror adapter | Project files |
|------|-----------|----------|---------------|
| `<configured-overlay>` | `<primary.adapter>` at `<primary.path_pattern>` | `<mirror.adapter>` with key pattern `<mirror.key_pattern>` | `<primary.path_pattern>` only |

Compatibility note:

- Only the overlay declared by `WorkflowRuntimeContext` is approved; older upstream-style terms (`openspec`, `hybrid`, `none`) are historical context only.
- Legacy folders named `proposals/`, `specs/`, `designs/`, `tasks/` MUST be treated as legacy unless `WorkflowRuntimeContextV1.artifact_context.forbidden_paths` lists them differently. They are never approved SDD output targets.

## State persistence (orchestrator)

The orchestrator persists recoverable SDD state canonically and optionally writes configured mirrors:

- Persist canonically in the active primary artifact (sections supplied by `WorkflowRuntimeContextV1.artifact_context.primary.heading_map`).
- Write configured mirrors only after canonical persistence. Recovery must remain possible from canonical artifacts alone.

## Recommended primary section mapping

Section ownership is resolved by the unique normalized heading, not by a numeric slot. The active primary artifact may preserve a custom layout; custom numbering MUST NOT change artifact ownership. The mapping from artifact kind to its owned normalized heading is **configured** in `WorkflowRuntimeContextV1.artifact_context.primary.heading_map`. Examples of the kinds that the library anticipates include bootstrap/init context, exploration, proposal, spec, design, tasks, apply work unit, consolidated verification, code verification, unit verification, PW-AUTO verification, PW-CLI verification, and archive report — but the actual keys and headings are configured per project.

The numeric labels in templates and existing primary artifacts are navigation aids only. For any given change, the configured authoritative headings win even when their canonical template numbers are occupied by other content.

## Common rules (universal)

- Always persist into the canonical target. Zero mirrors ends there. Non-empty mirrors continue in configured order.
- Apply required-mirror failure and closure rules only in the non-empty branch.
- Do NOT create or update parallel filesystem SDD artifacts under `WorkflowRuntimeContextV1.artifact_context.forbidden_paths`.
- If legacy parallel artifacts exist, read them only as contextual history and never let them override the active primary.
- Retrieve full artifacts with the configured full-retrieval primitive; never rely on search previews.
- Keep the primary artifact updated as the operational ledger whenever phase work changes state, evidence, next-step clarity, or SDD artifact content.
- Resolve every owned primary artifact by its unique normalized heading; numeric section labels are never sufficient evidence of ownership.
- Be precise in docs/prompts that this is a repo-local overlay mechanism, not a literal claim about any specific upstream filesystem standard.

## Sub-Agent Context Rules

Sub-agents launch with a fresh context and NO access to the orchestrator's instructions or memory protocol.

Who reads, who writes:
- Non-SDD optional support-tool use is outside this SDD persistence contract and never constitutes SDD evidence.
- SDD phases read canonical artifacts directly and write their owned canonical target before any configured mirror.

**Index-primary variant:** the sub-agent writes its phase artifact and returns `summary` + `artifact_ref`; the coordinator updates the index. Dependent phases read referenced phase artifacts.

Why this split:
- Orchestrator reads for non-SDD: it knows what context is relevant; sub-agents doing their own searches waste tokens on irrelevant results.
- Sub-agents read for SDD: SDD artifacts can be large; inlining them in the orchestrator prompt would consume the entire context window.
- Sub-agents always write: they have the complete detail on what happened; nuance is lost by the time results flow back to the orchestrator.

## Orchestrator Prompt Instructions for Sub-Agents

- **No-mirror branch:** inject only canonical artifact references and `write_order: [primary]`. Do not inject mirror keys, primitives, availability, preflight or failure behavior.
- **Mirrored branch:** inject every configured mirror key and required adapter accessor; require canonical persistence first, then mirror operations in `write_order`.
- Non-SDD optional support-tool usage is outside this contract and never SDD evidence.

## Skill Injection

For coordinated SDD, the coordinator resolves and validates the exact repo-local lane and surface-policy `SKILL.md` paths, then injects them under `## Skills to load before work`. Executor lanes read and apply those full files themselves before phase work. Policy skills are documents, not agents or delegation targets. Compact project standards may also be injected, but they are reminders only and never replace the full skill files.

To generate/update: run the local skill-registry workflow, or run the configured `init` lane when present.

SDD executor skill loading has no fallback: read only the injected `lane_context.lane_skill_path`, required `surface_skill_paths`, and ordered `skill_paths`. If any required path is absent or unreadable, stop before work and return `blocked` with `skill_resolution_missing`. Registry fallback and no-skill execution remain non-SDD behavior only.

## Detail Level

The orchestrator may pass `detail_level`: `concise | standard | deep`. This controls output verbosity but does NOT affect what gets persisted — always persist the full artifact.
