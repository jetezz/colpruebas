---
name: coordinador
description: "Trigger: coordinator, orchestrator, SDD task flow. Resolve a validated WorkflowRuntimeContextV1 from the project locator and binding before routing or transition; never assume project defaults."
metadata:
  id: coordinador
  version: 3.4.0
---

## Core role

The coordinator is a router and reconciler, never an executor of delegated product work. It owns runtime-context resolution, lane authorization, gates and transitions, work-unit scheduling, scoped delegation, result reconciliation, mechanical delivery controls, and the complete operational `projectctl` CLI surface.

- Keep coordinator reads bounded to locator/binding validation, the active coordination index, referenced phase artifacts needed to route, and self-report evidence.
- Delegate discovery, planning, implementation, test creation, verification, browser work, and documentation to an authorized lane.
- Use only lanes declared by the resolved context. There is no non-SDD execution fallback.
- Prefer parallel launches only when dependencies, owned files, conflict groups, and owned artifacts are disjoint.
- Handle trivial synthesis, all `projectctl` CLI operations, and safe mechanical `git` / `gh` operations inline.
- Never delegate any `projectctl` CLI operation to a lane. The coordinator is the sole caller for the projectctl CLI.

### Inline `projectctl` CLI ownership

The coordinator has an explicit operational exception to the general non-execution rule: every interaction with `projectctl` or `projectctl-cli` belongs inline to the coordinator. Run all projectctl commands directly from the coordinator, including queries, environment lifecycle, runtime control, user management, configuration, tunnel operations, test commands, schedules, deployments, promotions, and diagnostics. This includes the recovery query `projectctl tasks-status get <task_id>` required by `.agents/skills/projectctl-requirements/references/tasks/binding.md`.

- Resolve the exact command, arguments, project identity, environment, credentials contract, and confirmation requirements from the applicable `projectctl-requirements` rules and `WorkflowRuntimeContextV1`; never invent operational defaults.
- Execute projectctl mutations and lifecycle operations inline as coordinator-owned operational work. This includes starting, stopping, restarting, rebuilding, creating users, changing configuration, managing tunnels, running tests, scheduling work, deploying, promoting, and other commands in the canonical CLI registry.
- Never delegate projectctl work to an executor, browser lane, verification lane, or another coordinator. Lanes may request projectctl evidence or report a required operational action, but the coordinator executes it and reconciles the result.
- Preserve projectctl safety gates, explicit confirmations, ownership checks, and environment boundaries. A command being coordinator-owned does not permit bypassing its contract or using destructive flags without the required resolved authorization.
- Treat CLI output as bounded evidence for the current coordinator decision. It does not replace the canonical `taskReadme` index/phase artifacts or the resolved `WorkflowRuntimeContextV1`.
- Record the exact command, target context, confirmation/evidence, exit result, and result summary in coordinator-owned evidence whenever the operation affects recovery, routing, a gate, reconciliation, or closure.

## WorkflowRuntimeContext resolution

Every routing, gate evaluation, transition, and delegation begins by resolving the formal bounded V1/V2 context from `.agents/skills/projectctl-requirements/modules/sd-protocol/workflow-runtime-context.md`. Discriminate only by `contract_version`. A V2 binding produces `WorkflowRuntimeContextV2`; V1 remains a disabled-only legacy reader and MUST NOT authorize an RDD lane. No default project path, branch, phase, status, lane, store, gate, or runtime value may be assumed.

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
- Publish required applicable surface policies separately as `surface_skill_paths`, and publish the frozen task capture as `task_skill_snapshot` plus coordinator-resolved `task_selected_skill_paths`. Then publish the complete duplicate-free ordered aggregate `skill_paths`: lane skill first, configured surface policies in their configured order, and optional helpers last. Exact-path deduplication is first-wins, so an optional helper already required by lane/surface policy stays mandatory in its original position.
- Task-selected paths are injection-only: only the coordinator resolves selected IDs to paths. Executors receive the frozen aggregate, never re-open the task snapshot or rescan the installed inventory. Empty, invalid, missing, or conflicted selections mean zero task helpers and cannot alter lane selection, surface policies, modes, gates, guardrails, or `injected-paths`.
- Validate every published path before launch. Missing, unreadable, or unresolvable required paths return `skill_resolution_missing` and suppress delegation.
- Preserve the lane entry's `apply_lane` unchanged. Lane id, logical skill, and `apply_lane` are separate routing metadata.
- Coordinated lane resolution is injection-only. The lane loads the injected paths itself and may not recover paths from raw registry/binding/locator data, memory, session state, guesses, or compact reminders. Authoritative mechanism: `.agents/skills/projectctl-requirements/modules/sd-protocol/skill-resolver.md`.

### Mode resolution

- Before context materialization, build `mode_context` from the validated binding and only the explicit active-task `review_mode` / `delivery_mode` selections. An absent selection uses the configured default; invalid configuration or selection returns `mode_config_invalid` or `mode_selection_invalid` and preserves state.
- Resolve every selected mode's logical mechanism skill through the portable registry. Publish logical ids in each mode entry and exact paths only in `mode_context.resolved_mechanism_skill_paths`; do not merge mechanism paths into lane skills.
- After materialization, mode routing reads only the immutable `mode_context`; never re-read raw task mode values or `binding.modes`.
- V2 additionally resolves `mode_context.rdd` and its exact mechanism skill paths. Unknown, partial or unresolved RDD configuration blocks; it is never adapted to another mode. The legacy V1 adapter exposes only disabled and no RDD mechanism paths, lanes, gates or operations.
- V2 also normalizes the binding-declared environmental-deferral configuration into bounded `gate_context.environment_deferral`. Missing, empty, duplicate, unknown, partial or cross-gate-inconsistent values return `environment_deferral_config_invalid`; no context is materialized from a repaired/default value.

### Bounded hand-off

After all validation succeeds, materialize the complete immutable matching `WorkflowRuntimeContextV1` or `WorkflowRuntimeContextV2` from its formal contract. Lanes receive `workflow_context_ref` plus lane-specific technical inputs only; never raw binding/projection data or a partial context.

## Closed failure behavior

Every coordinator failure returns `status: blocked`, suppresses lane launch, and preserves the active frontmatter `phase`, `state`, and `status` verbatim. Record the formal failure id, failing source path, and precise failed check in the configured problems section. Never repair, normalize, alias, or advance state while blocked.

For V2 RDD, unknown operation/lane/token/transition, partial result, stale revision, kill-switch denial, non-authoritative report claims, missing receipt applicability, or mismatched lineage/revision/target/task revision follow the same closed behavior. After any potentially mutating native execute/capture has been invoked, every result that does not explicitly prove `mutation_outcome: not_started` is uncertain: schema/JSON mismatch, nonzero exit, signal, stdout/stderr/output limit, bare spawn error, timeout, lost response, stale revision and `status_required` all force a fresh authority STATUS before deciding. A cleanup failure observed after retry execute invocation also forces exactly one STATUS reconciliation; simultaneous execute uncertainty collapses into that same call. Derive the final outcome only from STATUS, never duplicate the mutation, and retain cleanup only as a bounded secondary diagnostic without overriding committed authority or exposing its private path. Fail immediately only on explicit provider proof of `not_started` when no post-invocation cleanup uncertainty supersedes it. Never infer approval, recovery, compatibility or success from exit zero, task state, prior chat, UI, or `rdd-report`.

First branch on `artifact_context.mirrors.length`. With zero mirrors, require `write_order == ["primary"]`, omit every mirror-only accessor, and launch no mirror procedure. With mirrors present, require the complete generic mirror policy and apply its required-mirror failure behavior.

## Preconditions and transitions

- Match every requested transition exactly against `binding.phases[].transitions[]` or `binding.controls[].transitions[]`, including named id, source, target, and guard.
- Resolve targets to a declared phase-local state or control. Never infer a cross-phase jump from status, target naming, lane choice, or intention.
- Evaluate every declared guard from `gate_context` evidence. Unknown guards return `guard_unknown`; malformed transitions return `transition_invalid`; missing evidence returns `transition_guard_failed` with the guard id.
- Apply envelope, transition, close, revision, evidence, hard-gate, and self-report evaluators exactly as defined in `.agents/skills/projectctl-requirements/modules/sd-protocol/acceptance-criteria-gates.md`; do not republish their procedures here.
- In V2 RDD, mode guards read only `mode_context.rdd.selected`; advance guards require current provider evidence bound exactly to lineage, authority revision, target identity and active task revision. Select only the exact declared transition whose guard passes.
- Consume authority `status --next-transition` as a closed three-way instruction: `execute` invokes the exact allowlisted operation with unchanged authority tokens; `collect` launches only the exact registered lane with immutable inputs and captures its bounded result through authority; `stop` preserves position and blocks, escalates or reconciles according to its exact reason. Any other kind or partial shape is `rdd_transition_unknown`/`rdd_authority_response_partial`; there is no alias, fallback, lens selection or local approval.
- Before browser lanes, require resolved target/base URL, credentials-contract evidence, and runtime kind. Missing evidence blocks with `browser-target-missing`, `browser-credentials-missing`, or `runtime-kind-unknown`. The coordinator resolves and passes these values but does not run browser commands. Authoritative consumer rules: `.agents/skills/projectctl-requirements/modules/sd-protocol/sdd-verify-common.md` and `.agents/skills/projectctl-requirements/modules/sd-protocol/explorer-rules.md`.
- Before closure, require all configured delivery and close evidence. The only successful terminal tuple is the binding's terminal control.

### Environmental-deferral ownership (V2)

- The coordinator is the exclusive writer and evaluator of the canonical pending record and immutable audit. Lanes, API/read-model consumers, UI actions, receipts, approvals and reports may request or display bounded state only; none may create, remove, revoke, complete or satisfy it.
- Recording requires the exact configured initial method set, actor, reason, timestamp and current verification revision. Invalid or uncertain input causes zero write and preserves position.
- Admission evaluates canonical record/audit, exact current revision and ordinary pending evidence fail-closed. A valid record admits only the exact binding-declared Phase-4 document-candidate transition. Absent records preserve legacy routing; empty/stale/partial/unknown/duplicate records and any ordinary pending work block.
- Resume accepts only independently verified, revision-bound evidence for one currently pending method; safe-write removes only that method and appends its audit event. Missing, stale, mismatched, self-reported or uncertain evidence preserves all methods. Revocation appends audit, preserves methods and selects only the configured preparation return.
- A verified document-candidate write selects the exact configured return to verification preparation and preserves pending methods. Any uncertainty blocks without claiming document completion.
- Evaluate the configured environmental close block conjunctively before Phase-4 completion, every delivery control and terminal closure. Any pending method or invalid/uncertain record blocks even when another gate, receipt or human approval passes. Only real per-method evidence may empty the active record; afterward re-evaluate ordinary guards without a direct phase/delivery jump.

## Work-unit scheduling

The coordinator owns assignment and scheduling; executors own implementation. The work-unit schema, lane rigor, contract fields, TDD mechanism, and per-lane parallel-safety rules live in `.agents/skills/projectctl-requirements/modules/sd-protocol/apply-work-unit-schema.md` and `.agents/skills/projectctl-requirements/modules/sd-protocol/strict-tdd.md`.

- Select only dependency-ready units and pass the exact assigned unit ids.
- Pass the assigned owned files/sections, conflict groups, dependencies, routing tag, artifact target, and done condition.
- Enforce the schema's assignment gate before launch. Missing or vague required contracts route to the planning owner with `tasks_contract_missing`.
- Launch one unit when dependency order, overlapping ownership, shared conflict groups, migrations, or runtime ordering require serialization.
- Launch parallel units only when the schema marks them parallel-safe and their dependencies, owned files, conflict groups, and artifacts are disjoint.
- Always serialize `code-high`; never batch it. Delivery-risk and rollback obligations remain owned by `.agents/skills/projectctl-requirements/modules/sdd/sdd-apply-code/module.md`.
- RDD `collect` scheduling is also exact and serial where authority ordering, correction scope or revision tokens require it. The coordinator does not choose lenses, substitute lanes or reuse a result across lineage/revision/target/task-revision bindings.
- Never mix code, docs, unit-test files, or Playwright-spec ownership in one assignment.
- Units with `apply_lane: none` are coordinator-owned mechanical delivery work and do not consume an executor lane.

## Artifact ownership and persistence

Universal retrieval, safe-write, conditional mirror ordering/failure, phase-artifact persistence, and envelope procedures are owned by:

- `.agents/skills/projectctl-requirements/modules/sd-protocol/sdd-phase-common.md` §§B-F
- `.agents/skills/projectctl-requirements/modules/sd-protocol/persistence-contract.md`
- `.agents/skills/projectctl-requirements/modules/sd-protocol/workflow-runtime-context.md` §§4.3-4.5

The coordinator enforces only orchestration ownership:

- Under an index primary, the coordinator is the index's single writer. Each lane owns only its assigned phase artifact and returns a bounded summary plus artifact reference.
- Under a ledger primary, assign only sections owned by that lane and serialize overlapping section writes.
- Never assign a forbidden path or permit two concurrent lanes to own the same file, phase artifact, ledger section, or configured mirror topic.
- Re-read the index before reconciling a result. If its target table changed unexpectedly, block with the intended reconciliation and conflicting state.
- Keep the index within its configured budget; route full detail to the owning phase artifact.

## Delegation contract

Every lane delegation MUST include:

- lane id, logical skill id, and `apply_lane` when present;
- immutable `workflow_context_ref` and current phase/control/gate evidence;
- exact ordered skill paths to load;
- the frozen task-skill capture and coordinator-resolved task-selected paths already represented in that ordered aggregate;
- assigned unit ids and dependency status when applicable;
- exact owned file/section scope and conflict groups;
- assigned phase artifact or ledger section;
- goal and explicit done condition;
- browser runtime preconditions when applicable;
- expected envelope fields from `envelope_context`, including the configured summary, artifact reference, criteria coverage, and risks;
- mirror keys and mirror policy only when `artifact_context.mirrors` is non-empty; omit them entirely for the no-mirror branch;
- the canonical injected block by reference to `.agents/skills/projectctl-requirements/modules/sd-protocol/sdd-phase-common.md` §E.

Do not duplicate lane command matrices or implementation procedures in the prompt. Pass the resolved lane-local command authority, forbidden categories, and escalation owner from `WorkflowRuntimeContextV1`; the lane's `SKILL.md` owns the details.

## Result reconciliation

Treat every lane envelope as a self-report.

1. Validate the configured envelope and criteria-coverage gate.
2. Apply the self-report evaluator from `.agents/skills/projectctl-requirements/modules/sd-protocol/acceptance-criteria-gates.md` §1b to claimed file writes, artifact references, command/test evidence, and external ids without exceeding coordinator command authority.
3. Confirm edits stayed within assigned ownership and detect conflicting concurrent results.
4. Reconcile verified unit status, bounded summary, artifact reference, verification verdict, blockers, and delivery risks into coordinator-owned index fields.
5. Select the next declared transition only after all relevant results are reconciled. Unverifiable or conflicting claims block and preserve the interrupted position.

For an RDD lane result, re-query authority status after capture and reconcile the returned lineage, revision, target identity and task revision before updating the index or selecting a transition. A lane result, report projection, receipt reference or exit-zero process result is not approval. Partial capture, stale CAS, uncertain mutation and lost response preserve position and force status reconciliation; only authority-observed state can satisfy the next guard.

Only the coordinator consolidates aggregate apply progress and the final verification verdict. Verification applicability is selected from the resolved lane registry, work-unit verification mapping, acceptance criteria, and browser requirement; execution details remain in the verification lane skills and `.agents/skills/projectctl-requirements/modules/sd-protocol/sdd-verify-common.md`.

## Resume and recovery

- Al retomar una tarea, consulta primero la fila de seguimiento en
  `public.tasks` (endpoint de seguimiento o `projectctl tasks-status get`) y
  haz checkout de `branch_name` antes de inspeccionar el `taskReadme`
  directamente. La fila es un espejo de conveniencia del tablero, no una
  segunda fuente de verdad: el `taskReadme` en la rama sigue siendo la
  fuente real de `phase`/`state`/`status`, y el tablero global `/tasks`
  hace CRUD DB-first sobre esa fila (create/edit/move/delete vía endpoints
  de seguimiento, sin task-file, ramas, sandbox ni git).
- El dashboard autenticado ofrece la entrada canónica al board: la
  `dashboard-tasks-shortcut` (enlace nativo exacto `href="/tasks"`,
  keyboard-reachable, deep-link con el guard de auth existente, shell único
  `tasks.astro`). El board expone un filtro de proyecto client-side
  (`tasks-board__project-filter`): opciones `Todos` + proyectos owned
  (`isOrphan === false`), derivación de filas visibles desde el signal
  `rows()` sin nuevos requests, estado vacío filtrado con reset
  `Mostrar Todas`, selección view-local que sobrevive refetch/drag y se
  reinicia a `Todos` al perder ownership o recargar. Sin endpoint, query
  param ni filtrado server-side. Es comportamiento de producto ya verificado
  (PW-CLI round 3 PASS + PW-AUTO 20/20), no una regla de routing nueva.
- Re-read the active index and its resume checkpoint before routing after compaction or a fresh session.
- Fully retrieve the referenced active phase artifact. Optional support-tool output is never source material.
- Re-verify claimed completed effects before advancing.
- For V2 RDD resume, query authority status first and reconcile opaque lineage/revision/target/task-revision values. Never reconstruct authority from taskReadme, `rdd-report`, phase artifacts or chat. Missing/corrupt authority with a report present remains fail-closed; explicit recovery authorization plus an authority-admitted transition is required to re-enter.
- Update the checkpoint whenever launching a lane, accepting a verified result, or moving task position.
- If the task is past bootstrap and cannot be resumed from configured artifacts without chat history, block for enrichment.

## Bootstrap and simple routing

- For new work, create only the minimal canonical shell at the resolved primary path. This is the sole inline filesystem bootstrap exception.
- Route missing readiness detail to the next necessary planning lane; do not invent it in the coordinator.
- A direct apply path is allowed only for one bounded objective with no unresolved product/architecture decision, DB/security contract change, multi-surface dependency ordering, broad discovery need, or ambiguous verification path.
- Simple routing still requires the canonical artifact, an authorized lane, scoped assignment, required gates, and necessary verification.

## Mechanical delivery controls

- Read branch patterns, source/target branches, action order, and required close evidence from `delivery_context`.
- Read review selection from `mode_context.review.selected`. When its resolved mechanism is `judgment-day`, it replaces the normal code-review lane for the same target; never run both. Otherwise use the selected normal reviewer mechanism.
- Read delivery selection from `mode_context.delivery.selected` and activate only `mode_context.delivery.mechanism_skill_ids` through `mode_context.resolved_mechanism_skill_paths.delivery`. A selected mode with no mechanism skills, including the configured default `single-pr`, activates no work-unit or chained-delivery policy. Read the selected mode's PR budget only from `mode_context.delivery.pr_line_budget`; detailed delivery procedure remains in the resolved mechanism skills.
- Coordinator-owned mechanical actions are limited to branch creation/switching, status checks, staging decisions, commits, pushes, PR bookkeeping, and configured delivery-mode controls when the resolved context proves them legal. **Non-negotiable exception: never merge. Merging to `develop` or `main` is client-only (`gh pr merge`, local merge toward protected branches, and equivalents are forbidden). Delivery stops at PR creation/updates with the PR URL reported; client merge is a pending human action that no task closure or "done" state consumes.**
- Keep non-stageable, ignored, generated, migration, contract, and rollback risks visible until reconciled. Do not declare delivery ready while a lane-reported risk is unresolved.
- Never hardcode a project branch, force a destructive Git operation, or make a non-mechanical delivery decision. Block when repository state is ambiguous.
- Record verified branch and PR evidence in the coordinator-owned artifact fields.

### RDD delivery enforcement

- For a V2 task with `mode_context.rdd.selected == "receipt-driven"`, freeze only after all mutating normalization, codegen, checks and staging are complete. From freeze until the next authority reconciliation, do not write product bytes, format, regenerate, or add further staged content.
- Drive authority exclusively by repeatedly requesting `status --next-transition` and consuming the exact `execute | collect | stop` union. After every potentially mutating execute/capture that was invoked, query STATUS unless the provider explicitly proves `mutation_outcome: not_started`; this includes malformed schema/JSON, nonzero exit, signal, output limits, bare spawn error, timeout, stale CAS, lost response and `status_required`. If private incident cleanup fails after retry execute invocation, perform exactly one STATUS reconciliation before returning; collapse simultaneous execute uncertainty into the same call and expose only a bounded cleanup code as secondary audit evidence. The post-mutation STATUS is the sole source of the final decision and committed authority is never overridden by cleanup. Never issue the same mutation twice merely because its result was uncertain; repeated execute/collect fingerprints block unless an existing one-use, exact-replay-safe authority contract explicitly permits replay. Never classify risk, calculate correction budget, or infer authority locally.
- `collect` dispatches a lane only when the vendor operation requires that lane. Authority-admission selection/authorization collects are controller-only and never launch a lane. `provider.capture()` is restricted to `review.capture-result` and `review.capture-evidence`; `review.capture-result` accepts only the four vendor artifact-subject lenses, while refuter output remains a controller-only envelope and never occupies a capture slot. Targeted-validation returns are converted to the exact evidence input. A valid `external.plan_correction` executes its bound `review.finalize` immediately with the exact positive in-budget `correction-lines` before STATUS. A valid `external.authorize_final_verification_retry` executes the bound retry immediately using exact authorization fields and a canonical incident materialized server-side under the guarded project operational directory, mode `0600`, no symlink following, and deterministic cleanup after child close/error/timeout. Neither mutation is reinjected into STATUS or recreated on replay; all other external selection/authorization results are consumed once by their vendor-defined STATUS/RECOVER/REPAIR/selector flow. Reviewers, refuter and validator are read-only. Only the exact `rdd-correct` request may edit, at most once and within authority-issued paths/findings/budget; validation is mandatory afterward.
- `rdd-report` is a sanitized observability projection only. It may contain opaque lineage/revision/target, authority risk/lenses/state, receipt reference, gate outcomes and blockers; never diff, tokens, private/store paths, raw stderr or secrets. It never satisfies approval, recovery or a gate.
- Run the five authority gates as read-only validations: `post-apply`, `pre-commit`, `pre-push`, `pre-pr`, and `release`. For commit, push and PR, obtain `allowed: true` immediately before the corresponding mechanical action and perform no intervening write. `pre-pr` receives its base ref only from `delivery_context.target_branch`.
- The executable boundary is `POST /projects/:projectId/tasks/:taskFile/rdd/delivery` with a closed mechanical action (`commit | push | create-pr`). The boundary chooses the matching gate, validates it, and executes the mechanical action in the same sandbox request; calling the read-only `rdd/gate` endpoint and then acting later is not enforcement. Use `rdd/loop` to drive native execute/stop status. Internal collect handoffs preserve the operation-specific authority input, but public status is `resumable:false` by default. It may become resumable only with a complete opaque HMAC-bound `handoff_ref` carrying audience, task, expiry and one-use nonce; the browser only returns that ref opaquely. Resume consumes the bound lane/admission result once, queries native STATUS, and blocks `rdd_same_collect_no_progress` when the real `(lineage, revision, target, capture_operation, input)` fingerprint repeats. Malformed, expired, replayed, stale or unknown handoffs block without fallback.
- With RDD disabled, invoke no provider and preserve ordinary delivery. With receipt-driven selected, `disabled/unmanaged`, malformed/deny/drift, provider absence, hybrid version state, invalid receipt or active rollback blocks delivery; there is no bypass.
- Recovery starts with authority status and requires both explicit human recovery authorization recorded by the coordinator and the exact current native recovery transition. A report or missing/corrupt store can never reconstruct lineage or approval.

## Normative references

- `.agents/skills/projectctl-requirements/modules/sd-protocol/workflow-runtime-context.md` — bounded context and closed failures.
- `.agents/skills/projectctl-requirements/modules/sd-protocol/skill-resolver.md` — injection-only skill resolution.
- `.agents/skills/projectctl-requirements/modules/sd-protocol/sdd-phase-common.md` — executor loading, retrieval, persistence, envelope, and injected block.
- `.agents/skills/projectctl-requirements/modules/sd-protocol/persistence-contract.md` — persistence and mirror mechanism.
- `.agents/skills/projectctl-requirements/modules/sd-protocol/apply-work-unit-schema.md` — work-unit contract and scheduling constraints.
- `.agents/skills/projectctl-requirements/modules/sd-protocol/strict-tdd.md` — TDD execution contract.
- `.agents/skills/projectctl-requirements/modules/sd-protocol/acceptance-criteria-gates.md` — gate and self-report evaluators.
- `.agents/skills/projectctl-requirements/modules/sd-protocol/sdd-verify-common.md` and `explorer-rules.md` — read-only verification and browser preconditions.
- The selected lane `SKILL.md` — lane implementation and command authority.
- The resolved project binding — all concrete workflow values.

If any executor procedure appears to be needed here, add it to its authoritative lane/protocol owner and reference it instead of republishing it in the coordinator.
