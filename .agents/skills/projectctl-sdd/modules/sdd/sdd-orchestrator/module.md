---
name: sdd-orchestrator
description: "Trigger: sdd-orchestrator, SDD task flow. Resolve a validated WorkflowRuntimeContextV1 from the project locator and binding before routing or transition; never assume project defaults."
metadata:
  id: sdd-orchestrator
   version: 7.0.0
  contract_ref: WorkflowRuntimeContextV1
---

## Core role

`sdd-orchestrator` is a router and reconciler, never an executor of delegated product work. It owns runtime-context resolution, lane authorization, gates and transitions, work-unit scheduling, scoped delegation, result reconciliation, mechanical delivery controls, and the complete operational `projectctl` CLI surface.

### Canonical index operations

`sdd-orchestrator` is the sole operator and writer of the coordination index. After resolving the locator and binding, use `scripts/project/tasks.ts init` for a new index when its inputs are available. For an existing index, run `validate` and `check` before operating; independently verify the actual evidence; invoke the corresponding `artifact record`, `work-unit set`, `criteria set`, `verification record`, `evidence add`, `proposal accept`, `functionality accept`, `branch create`, `pr record`, `checkpoint set`, `outcome`, `environment` or `transition` command; then run `validate` and `check` again. See `references/task-engine.md` for command contracts. The motor is an implementation of this actor's writes, not an alternate actor or authority. A recorded reference alone does not prove a gate: apply the evaluators in `acceptance-criteria-gates.md` before supplying evidence or changing state. Never edit `phase`, `state`, or `status` directly when a declared transition or outcome command exists.

If a required field has no motor operation, `sdd-orchestrator` may perform a bounded read-before-write edit of that field only, checking the resolved binding and validating the index afterward. On failure preserve the previous position and record the intended correction; never claim a successful transition. No lane writes the index.

- Keep sdd-orchestrator reads bounded to locator/binding validation, the active coordination index, referenced phase artifacts needed to route, and self-report evidence.
- Delegate discovery, planning, implementation, test creation, verification, browser work, and documentation to an authorized lane.
- Use only lanes declared by the resolved context. There is no non-SDD execution fallback.
- Prefer parallel launches only when dependencies, owned files, conflict groups, and owned artifacts are disjoint.
- Handle trivial synthesis, all `projectctl` CLI operations, and safe mechanical `git` / `gh` operations inline.
- Never delegate any `projectctl` CLI operation to a lane. `sdd-orchestrator` is the sole caller for the projectctl CLI.

### Inline `projectctl` CLI ownership

`sdd-orchestrator` has an explicit operational exception to the general non-execution rule: every interaction with `projectctl` or `projectctl-cli` belongs inline to sdd-orchestrator. Run all projectctl commands directly from sdd-orchestrator, including queries, environment lifecycle, runtime control, user management, configuration, tunnel operations, test commands, schedules, deployments, promotions, and diagnostics. This includes the recovery query `projectctl tasks-status get <task_id>` required by `.agents/skills/projectctl-sdd/references/tasks/binding.md`.

- Resolve the exact command, arguments, project identity, environment, credentials contract, and confirmation requirements from the applicable `projectctl-requirements` rules and `WorkflowRuntimeContextV1`; never invent operational defaults.
- Execute projectctl mutations and lifecycle operations inline as sdd-orchestrator-owned operational work. This includes starting, stopping, restarting, rebuilding, creating users, changing configuration, managing tunnels, running tests, scheduling work, deploying, promoting, and other commands in the canonical CLI registry.
- Never delegate projectctl work to an executor, browser lane, or verification lane. Lanes may request projectctl evidence or report a required operational action, but sdd-orchestrator executes it and reconciles the result.
- Preserve projectctl safety gates, explicit confirmations, ownership checks, and environment boundaries. A command being sdd-orchestrator-owned does not permit bypassing its contract or using destructive flags without the required resolved authorization.
- Treat CLI output as bounded evidence for the current sdd-orchestrator decision. It does not replace the canonical `taskReadme` index/phase artifacts or the resolved `WorkflowRuntimeContextV1`.
- Record the exact command, target context, confirmation/evidence, exit result, and result summary in sdd-orchestrator-owned evidence whenever the operation affects recovery, routing, a gate, reconciliation, or closure.

## WorkflowRuntimeContext resolution

Every routing, gate evaluation, transition, and delegation begins by resolving the formal bounded V1/V2 context from `.agents/skills/projectctl-sdd/modules/sd-protocol/workflow-runtime-context.md`. Discriminate only by `contract_version`. A V2 binding produces `WorkflowRuntimeContextV2`; V1 remains a disabled-only legacy reader and MUST NOT authorize an RDD lane. No default project path, branch, phase, status, lane, store, gate, or runtime value may be assumed.

### Invocation preflight and launch packet

Every coordinated SDD entry, including `sdd-init`, MUST follow this state
machine without shortcuts:

```text
entry
  -> invocation preflight
  -> exactly one locator
  -> existing locator-to-binding resolver
  -> context/skills
  -> LaunchPacketV1
  -> immediate packet validation
  -> authorized lane launch
```

For prompt-only entry, invocation preflight MUST consume candidates only from
the configured, versioned and auditable bootstrap accessor declared by the
active binding/overlay (or from an invocation packet that explicitly supplies
that accessor's result). `sdd-orchestrator` MUST NOT use prompt text, chat
history, current working directory, guessed paths, legacy artifacts, or an
installed-skill scan as a locator source. The accessor result MUST contain
exactly one locator candidate: zero candidates return `status: blocked` with
`locator_missing`, and multiple candidates return `status: blocked` with
`locator_duplicated`. Neither failure selects a candidate, resolves a fallback,
or launches a lane; both preserve the active `phase`, `state`, and `status`
verbatim.

After the exact-one check succeeds, `sdd-orchestrator` MUST re-enter the existing
locator-to-binding resolver without changing its authority rules. The only
bootstrap shell exception is sdd-orchestrator-owned creation of a minimal canonical
artifact shell after locator and binding identity have already resolved; it
MUST NOT bootstrap identity, configuration, or locator discovery. Prefer
`tasks.ts init` when the resolved task inputs are complete; the shell exception
exists only for an incomplete bootstrap that cannot use `init`.

`sdd-orchestrator` is the sole producer and validator of an immutable
`LaunchPacketV1`. It MUST construct the packet only after canonical task
reconciliation, context/gate materialization, exact skill-path resolution, and
assignment are frozen. The packet is the sole input to every coordinated SDD
launch and MUST be validated immediately before launch against that frozen
context, including positional ordering of skill paths, evidence, routing,
scope, dependencies, artifact target, done condition, and configured envelope
fields. A missing, incomplete, stale, reordered, inconsistent, or locally
reconstructed packet returns `status: blocked` with `launch_packet_invalid`,
preserves the active position, and suppresses launch. `sdd-orchestrator` MUST NOT
silently rebuild or reorder it, and an executor MUST NOT recover it from raw
binding, locator, task, registry, memory, session, or reminder data.

Non-SDD delegation remains outside this packet gate.

### Locator and binding

- Receive exactly one `WorkflowBindingLocatorV1` path/document from the invocation environment. Missing or duplicate candidates return `locator_missing` or `locator_duplicated`.
- Require the locator contract version supported by the selected context generation (V1 for a V1 binding, V2 for a V2 binding); any other value returns `locator_contract_version_mismatch`. Never downgrade or reinterpret one generation as the other.
- Read `binding_path` and extract exactly one fenced JSON block between `<!-- task-flow-binding:start -->` and `<!-- task-flow-binding:end -->`.
- Validate the parsed binding's declared versioned shape (`TaskFlowBindingV1` or `TaskFlowBindingV2`), `expected_binding_id`, optional pinned `binding_version`, and the `task-flow-binding` machine block id. A mixed locator/binding generation is `binding_shape_invalid` or `binding_version_mismatch`, never a compatibility fallback.
- Use the closed failures `binding_unreadable`, `binding_block_missing`, `binding_block_duplicated`, `binding_parse_failed`, `binding_shape_invalid`, `binding_id_mismatch`, `binding_version_mismatch`, and `machine_block_id_mismatch` as applicable.
- Generated projections are non-authoritative. Never resolve state from them or block on their digest, identity, version, presence, or readability.

### Active task reconciliation

- Resolve the active primary path from `artifact_store.primary.path_pattern` using the validated task identity; never hardcode a local task path.
- At the start of every new execution, before materializing `WorkflowRuntimeContextV1`, re-open that canonical task file and capture its `Task skill snapshot`; never trust a browser/list/prompt copy. Resolve its logical IDs only through immediate, non-symlink `.agents/skills/*/SKILL.md` entries whose explicit `metadata.id` is valid. Missing IDs and duplicate installed IDs produce non-blocking warnings and are omitted; no filename, directory, label, path, registry, or symlink fallback is allowed.
- Freeze that reconciliation for the execution. A later task edit is visible only to a subsequent execution and cannot mutate the active context.
- Validate `task_id`, `task_slug`, writable `status`, and the frontmatter `(phase, state, status)` tuple against the binding.
- `status == binding.status.pre_bootstrap` is valid only while `phase` and `state` are empty.
- Phase-local states must belong to the resolved phase. Controls must match their declared tuple and semantics; outcome controls preserve the interrupted phase/state, and terminal controls use their declared terminal tuple.
- Reject unreadable/invalid frontmatter, unknown or mismatched controls, invalid task identity, and active retired aliases with the formal `taskref_*` failure from `workflow-runtime-context.md`.
- The active primary wins over chat history and legacy parallel artifacts. A contradiction blocks only when reconciliation is required for safe routing.

### Lane authorization and skill resolution

- Require the selected lane id in both `binding.lanes` and the current phase/control's allowed lanes; otherwise return `lane_unknown` or `lane_not_allowed_in_phase`.
- Require the lane entry's logical `skill`. Resolve it through the configured registry to one exact readable `lane_context.lane_skill_path`; never derive a path from the lane id or skill string.
- Publish required applicable surface policies separately as `surface_skill_paths`, and publish the frozen task capture as `task_skill_snapshot` plus sdd-orchestrator-resolved `task_selected_skill_paths`. Then publish the complete duplicate-free ordered aggregate `skill_paths`: lane skill first, configured surface policies in their configured order, and optional helpers last. Exact-path deduplication is first-wins, so an optional helper already required by lane/surface policy stays mandatory in its original position.
- Task-selected paths are injection-only: only `sdd-orchestrator` resolves selected IDs to paths. Executors receive the frozen aggregate, never re-open the task snapshot or rescan the installed inventory. Empty, invalid, missing, or conflicted selections mean zero task helpers and cannot alter lane selection, surface policies, modes, gates, guardrails, or `injected-paths`.
- Validate every published path before launch. Missing, unreadable, or unresolvable required paths return `skill_resolution_missing` and suppress delegation.
- Preserve the lane entry's `apply_lane` unchanged. Lane id, logical skill, and `apply_lane` are separate routing metadata.
- Coordinated lane resolution is injection-only. The lane loads the injected paths itself and may not recover paths from raw registry/binding/locator data, memory, session state, guesses, or compact reminders. Authoritative mechanism: `.agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md`.

### Mode resolution

- Before context materialization, build `mode_context` from the validated binding and only the explicit active-task `review_mode` / `delivery_mode` selections. An absent selection uses the configured default; invalid configuration or selection returns `mode_config_invalid` or `mode_selection_invalid` and preserves state.
- Resolve every selected mode's logical mechanism skill through the portable registry. Publish logical ids in each mode entry and exact paths only in `mode_context.resolved_mechanism_skill_paths`; do not merge mechanism paths into lane skills.
- After materialization, mode routing reads only the immutable `mode_context`; never re-read raw task mode values or `binding.modes`.
- V2 may resolve an explicitly selected task-scoped satellite. Unselected satellites are not loaded; an unknown selection or partial selected satellite blocks without adaptation. Operational RDD resolution belongs to `.agents/skills/projectctl-rdd/SKILL.md`; V1 does not authorize satellite lanes.
- V2 also normalizes the binding-declared environmental-deferral configuration into bounded `gate_context.environment_deferral`. Missing, empty, duplicate, unknown, partial or cross-gate-inconsistent values return `environment_deferral_config_invalid`; no context is materialized from a repaired/default value.

### Bounded hand-off

After all validation succeeds, materialize the complete immutable matching `WorkflowRuntimeContextV1` or `WorkflowRuntimeContextV2` from its formal contract. Lanes receive `workflow_context_ref` plus lane-specific technical inputs only; never raw binding/projection data or a partial context.

## Closed failure behavior

Every sdd-orchestrator failure returns `status: blocked`, suppresses lane launch, and preserves the active frontmatter `phase`, `state`, and `status` verbatim. Record the formal failure id, failing source path, and precise failed check in the configured problems section. Never repair, normalize, alias, or advance state while blocked.

RDD/Judgment Day failures remain closed: an unavailable, inconsistent, non-authoritative or unresolved selected mechanism returns `blocked`, preserves position, and never infers approval from exit status, task state, chat, UI or `rdd-report`. Detailed adapter, actor and reconciliation behavior is owned by the selected satellite skill.

First branch on `artifact_context.mirrors.length`. With zero mirrors, require `write_order == ["primary"]`, omit every mirror-only accessor, and launch no mirror procedure. With mirrors present, require the complete generic mirror policy and apply its required-mirror failure behavior.

## Preconditions and transitions

- Match every requested transition exactly against `binding.phases[].transitions[]` or `binding.controls[].transitions[]`, including named id, source, target, and guard.
- Resolve targets to a declared phase-local state or control. Never infer a cross-phase jump from status, target naming, lane choice, or intention.
- Evaluate every declared guard from `gate_context` evidence. Unknown guards return `guard_unknown`; malformed transitions return `transition_invalid`; missing evidence returns `transition_guard_failed` with the guard id.
- Apply envelope, transition, close, revision, evidence, hard-gate, and self-report evaluators exactly as defined in `.agents/skills/projectctl-sdd/modules/sd-protocol/acceptance-criteria-gates.md`; do not republish their procedures here.
- For an explicitly selected RDD or Judgment Day mode, guards consume only the resolved immutable mode context and current configured evidence. Detailed transition and routing semantics are resolved by the corresponding satellite; no local alias, fallback or approval is permitted.
- Before browser lanes, require resolved target/base URL, credentials-contract evidence, and runtime kind. Missing evidence blocks with `browser-target-missing`, `browser-credentials-missing`, or `runtime-kind-unknown`. `sdd-orchestrator` resolves and passes these values but does not run browser commands. Authoritative consumer rules: `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-verify-common.md` and `.agents/skills/projectctl-sdd/modules/sd-protocol/explorer-rules.md`.
- Before closure, require all configured delivery and close evidence. The only successful terminal tuple is the binding's terminal control.

### Environmental-deferral ownership (V2)

- `sdd-orchestrator` is the exclusive writer and evaluator of the canonical pending record and immutable audit. Lanes, API/read-model consumers, UI actions, receipts, approvals and reports may request or display bounded state only; none may create, remove, revoke, complete or satisfy it.
- Recording requires the exact configured initial method set, actor, reason, timestamp and current verification revision. Invalid or uncertain input causes zero write and preserves position.
- Admission evaluates canonical record/audit, exact current revision and ordinary pending evidence fail-closed. A valid record admits only the exact binding-declared Phase-4 document-candidate transition. Absent records preserve legacy routing; empty/stale/partial/unknown/duplicate records and any ordinary pending work block.
- Resume accepts only independently verified, revision-bound evidence for one currently pending method; safe-write removes only that method and appends its audit event. Missing, stale, mismatched, self-reported or uncertain evidence preserves all methods. Revocation appends audit, preserves methods and selects only the configured preparation return.
- A verified document-candidate write selects the exact configured return to verification preparation and preserves pending methods. Any uncertainty blocks without claiming document completion.
- Evaluate the configured environmental close block conjunctively before Phase-4 completion, every delivery control and terminal closure. Any pending method or invalid/uncertain record blocks even when another gate, receipt or human approval passes. Only real per-method evidence may empty the active record; afterward re-evaluate ordinary guards without a direct phase/delivery jump.

## Work-unit scheduling

### Scoped requirements ownership (V2)

Resolve `requirements_verification` solely from the binding. Plan explicit
navigation targets and dependency-ready machine-preparation doc work units before
technical launch. Use `authorizeMachinePreparation` for the bounded pre-verification
exception; a phase's allowed lane list alone cannot authorize broad doc writes.
Inject its fields/sections, target, dependencies and explicit profile into the packet.
Reconcile the actual file delta with `validateMachinePreparationChanges`; a
docs-owned pathname alone does not authorize editorial changes during preparation.

For the requirements lane, materialize `buildRequirementsLaunch` as immutable
`requirements_context` in runtime context and LaunchPacketV1; run
`validateRequirementsLaunch` immediately before execution. Require the core
surface policy and the exact profile/state/doctor/artifact assignment. A profile
cannot be inferred from lane owner_phase, which describes its primary owner only.

Use `requirements targets`, `snapshot`, `record` and `status` motor operations.
Verify all report and complementary evidence effects before recording. Execute
all `--managed` wrappers inline: they invoke projectctl. Inspect structured
findings and runtime results; exit zero and warn-first do not constitute approval.
Preserve unverified global checks separately from selected-scope checks. Do not
run suites to resolve filesystem-only findings.

Recompute scope/global input fingerprints after writes and before each gate.
Reuse valid per-doctor receipts; re-execute only stale checks in their authorized
position. Editorial writes do not force technical reentry. Technical changes do;
the motor's current/invalid evidence is computed, never added by reference or
revision counter. Environmental candidate writes retain their mandatory return
even when technical fingerprints are unchanged. Never use the normal documentary
bridge to override that return or pending_environment close blocks.

`sdd-orchestrator` owns assignment and scheduling; executors own implementation. The work-unit schema, lane rigor, contract fields, TDD mechanism, and per-lane parallel-safety rules live in `.agents/skills/projectctl-sdd/modules/sd-protocol/apply-work-unit-schema.md` and `.agents/skills/projectctl-sdd/modules/sd-protocol/strict-tdd.md`.

- Select only dependency-ready units and pass the exact assigned unit ids.
- Pass the assigned owned files/sections, conflict groups, dependencies, routing tag, artifact target, and done condition.
- Enforce the schema's assignment gate before launch. Missing or vague required contracts route to the planning owner with `tasks_contract_missing`.
- Launch one unit when dependency order, overlapping ownership, shared conflict groups, migrations, or runtime ordering require serialization.
- Launch parallel units only when the schema marks them parallel-safe and their dependencies, owned files, conflict groups, and artifacts are disjoint.
- Always serialize `code-high`; never batch it. Delivery-risk and rollback obligations remain owned by `.agents/skills/projectctl-sdd/modules/sdd/sdd-apply-code/module.md`.
- Optional RDD/Judgment Day scheduling is delegated to the selected satellite; `sdd-orchestrator` only schedules the bounded work-unit and reconciles its returned evidence.
- Never mix code, docs, unit-test files, or Playwright-spec ownership in one assignment.
- Units with `apply_lane: none` are sdd-orchestrator-owned mechanical delivery work and do not consume an executor lane.

## Artifact ownership and persistence

Universal retrieval, safe-write, conditional mirror ordering/failure, phase-artifact persistence, and envelope procedures are owned by:

- `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md` §§B-F
- `.agents/skills/projectctl-sdd/modules/sd-protocol/persistence-contract.md`
- `.agents/skills/projectctl-sdd/modules/sd-protocol/workflow-runtime-context.md` §§4.3-4.5

`sdd-orchestrator` enforces only orchestration ownership:

- Under an index primary, `sdd-orchestrator` is the index's single writer. Each lane owns only its assigned phase artifact and returns a bounded summary plus artifact reference.
- Under a ledger primary, assign only sections owned by that lane and serialize overlapping section writes.
- Never assign a forbidden path or permit two concurrent lanes to own the same file, phase artifact, ledger section, or configured mirror topic.
- Re-read the index before reconciling a result. If its target table changed unexpectedly, block with the intended reconciliation and conflicting state.
- Keep the index within its configured budget; route full detail to the owning phase artifact.

## Delegation contract

Every lane delegation MUST include:

- lane id, logical skill id, and `apply_lane` when present;
- immutable `workflow_context_ref` and current phase/control/gate evidence;
- exact ordered skill paths to load;
- the frozen task-skill capture and sdd-orchestrator-resolved task-selected paths already represented in that ordered aggregate;
- assigned unit ids and dependency status when applicable;
- exact owned file/section scope and conflict groups;
- assigned phase artifact or ledger section;
- goal and explicit done condition;
- browser runtime preconditions when applicable;
- expected envelope fields from `envelope_context`, including the configured summary, artifact reference, criteria coverage, and risks;
- mirror keys and mirror policy only when `artifact_context.mirrors` is non-empty; omit them entirely for the no-mirror branch;
- the canonical injected block by reference to `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md` §E.

For every coordinated SDD delegation, those fields MUST be carried as one
frozen `LaunchPacketV1`, not as improvised prompt instructions or duplicated
lane-local routing metadata. `sdd-orchestrator` MUST perform the immediate
pre-launch validation described above after the packet is assembled and before
launching the authorized lane. Packet absence or any packet mismatch blocks
with `launch_packet_invalid`; no executor launch, local reconstruction, or
fallback is permitted. This gate also applies to `sdd-init`.

Do not duplicate lane command matrices or implementation procedures in the prompt. Pass the resolved lane-local command authority, forbidden categories, and escalation owner from `WorkflowRuntimeContextV1`; the lane's `SKILL.md` owns the details.

## Result reconciliation

### Proposal decision presentation and canonical criteria

Consume the injected core identity policy and `.agents/skills/projectctl-sdd/references/criteria-integration.md`. Resolve explicit navigation targets and supply `criteria baseline` output and canonical bundle references in the frozen packet. Baseline/owners and proposal revision participate in packet freshness; executors cannot reconstruct IDs from a local AC counter or sample manifest. Before approval use `proposal check`; after application use `--stage applied`. The three binding-declared `criteria_identity` evidence values are computed, never satisfied by `evidence add`.

On every new or revised proposal, fully read and verify its artifact, fence and rendered table. Present goal/target and **all added, modified and removed canonical IDs with justification**; modifications include before/after and additions their proposed acceptance text. Include owners and relevant maintained IDs. Explicitly state `Ninguno` in empty categories and the no-criteria reason. This user-facing decision summary is mandatory before approval and is not limited by the compact index's ten-line budget. An artifact link never replaces the content; no entries may be silently omitted.

Accept exactly the validated delta's canonical IDs and proposal SHA256. Re-present revisions for approval. Serialize requests sharing IDs/owners and revalidate collisions before canonical doc writes. New criteria keep their definitive ID at materialization; retired criteria retain their owner tombstone. Use spec/tasks machine links for scheduling; reject unknown, renumbered or unapproved criteria. Acceptance changes outside the approved delta return to proposal revision instead of being absorbed into spec/tasks.

Treat every lane envelope as a self-report.

1. Validate the configured envelope and criteria-coverage gate.
2. Apply the self-report evaluator from `.agents/skills/projectctl-sdd/modules/sd-protocol/acceptance-criteria-gates.md` §1b to claimed file writes, artifact references, command/test evidence, and external ids without exceeding sdd-orchestrator command authority.
3. Confirm edits stayed within assigned ownership and detect conflicting concurrent results.
4. Reconcile verified unit status, bounded summary, artifact reference, verification verdict, blockers, and delivery risks into sdd-orchestrator-owned index fields.
5. Select the next declared transition only after all relevant results are reconciled. Unverifiable or conflicting claims block and preserve the interrupted position.

For an RDD or Judgment Day result, reconcile the selected satellite's bounded evidence before updating the index or selecting a transition. A lane result, report projection, receipt reference or exit-zero process result is not approval; partial or uncertain evidence preserves position.

Only `sdd-orchestrator` consolidates aggregate apply progress and the final verification verdict. Verification applicability is selected from the resolved lane registry, work-unit verification mapping, acceptance criteria, and browser requirement; execution details remain in the verification lane skills and `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-verify-common.md`.

## Resume and recovery

- Concrete recovery topology lives in the mis-proyectos overlay profile:
  `docs/00-context/sdd-recovery-mis-proyectos.md`
  (Overlay example: mis-proyectos only — not portable).
- Re-read the active index and its resume checkpoint before routing after compaction or a fresh session.
- Fully retrieve the referenced active phase artifact. Optional support-tool output is never source material.
- Re-verify claimed completed effects before advancing.
- For selected RDD resume, follow the satellite's authority status/reconciliation contract. Never reconstruct authority from taskReadme, projections, phase artifacts or chat.
- Update the checkpoint whenever launching a lane, accepting a verified result, or moving task position.
- If the task is past bootstrap and cannot be resumed from configured artifacts without chat history, block for enrichment.

## Bootstrap and simple routing

- For new work, create the canonical shell at the resolved primary path through `tasks.ts init` when its inputs are available. Only an incomplete bootstrap may use the minimal inline filesystem shell exception.
- Route missing readiness detail to the next necessary planning lane; do not invent it in sdd-orchestrator.
- A direct apply path is allowed only for one bounded objective with no unresolved product/architecture decision, DB/security contract change, multi-surface dependency ordering, broad discovery need, or ambiguous verification path.
- Simple routing still requires the canonical artifact, an authorized lane, scoped assignment, required gates, and necessary verification.

## Mechanical delivery controls

- Read branch patterns, source/target branches, action order, and required close evidence from `delivery_context`.
- Read review selection from `mode_context.review.selected`. When its resolved mechanism is `judgment-day`, it replaces the normal code-review lane for the same target; never run both. Otherwise use the selected normal reviewer mechanism.
- Read delivery selection from `mode_context.delivery.selected` and activate only `mode_context.delivery.mechanism_skill_ids` through `mode_context.resolved_mechanism_skill_paths.delivery`. A selected mode with no mechanism skills, including the configured default `single-pr`, activates no work-unit or chained-delivery policy. Read the selected mode's PR budget only from `mode_context.delivery.pr_line_budget`; detailed delivery procedure remains in the resolved mechanism skills.
- sdd-orchestrator-owned mechanical actions are limited to branch creation/switching, status checks, staging decisions, commits, pushes, PR bookkeeping, and configured delivery-mode controls when the resolved context proves them legal. **Non-negotiable exception: never merge. Merging to `develop` or `main` is client-only (`gh pr merge`, local merge toward protected branches, and equivalents are forbidden). Delivery stops at PR creation/updates with the PR URL reported; client merge is a pending human action that no task closure or "done" state consumes.**
- Keep non-stageable, ignored, generated, migration, contract, and rollback risks visible until reconciled. Do not declare delivery ready while a lane-reported risk is unresolved.
- Never hardcode a project branch, force a destructive Git operation, or make a non-mechanical delivery decision. Block when repository state is ambiguous.
- Record verified branch and PR evidence in the sdd-orchestrator-owned artifact fields.
- Use `branch create` for the declared creation control; use `branch verify` to recover missing branch evidence in an advanced index. Verification records the active canonical branch, not historical creation/provenance. These fields have motor operations and do not qualify for the bounded manual-edit exception.

### Optional review and delivery modes

- Normal code review remains the default. An explicitly selected Judgment Day mechanism reviews an immutable, evidence-bound target of any declared kind in any phase; for the same code target it replaces the assigned reviewer. Resolve actors, rounds, envelopes and persistence through `.agents/skills/projectctl-judgment-day/SKILL.md`.
- For the code-review acceptance gate, `selected_review_mechanism_green` is satisfied only by verified evidence from the actually selected mechanism for the exact code target and revision. A result for another kind, target or revision never satisfies the code gate.
- Without RDD selection ordinary delivery is preserved; selected receipt-driven behavior, authority evidence and recovery are resolved through `.agents/skills/projectctl-rdd/SKILL.md` and its extension catalog, with failures closed and no fallback.
- `rdd-report` is only a derived, non-authoritative projection and never satisfies approval, recovery or a gate.

## Normative references

- `.agents/skills/projectctl-sdd/modules/sd-protocol/workflow-runtime-context.md` — bounded context and closed failures.
- `.agents/skills/projectctl-sdd/modules/sd-protocol/skill-resolver.md` — injection-only skill resolution.
- `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-phase-common.md` — executor loading, retrieval, persistence, envelope, and injected block.
- `.agents/skills/projectctl-sdd/modules/sd-protocol/persistence-contract.md` — persistence and mirror mechanism.
- `.agents/skills/projectctl-sdd/modules/sd-protocol/apply-work-unit-schema.md` — work-unit contract and scheduling constraints.
- `.agents/skills/projectctl-sdd/modules/sd-protocol/strict-tdd.md` — TDD execution contract.
- `.agents/skills/projectctl-sdd/modules/sd-protocol/acceptance-criteria-gates.md` — gate and self-report evaluators.
- `.agents/skills/projectctl-sdd/modules/sd-protocol/sdd-verify-common.md` and `explorer-rules.md` — read-only verification and browser preconditions.
- The selected lane `SKILL.md` — lane implementation and command authority.
- The resolved project binding — all concrete workflow values.

If any executor procedure appears to be needed here, add it to its authoritative lane/protocol owner and reference it instead of republishing it in sdd-orchestrator.
