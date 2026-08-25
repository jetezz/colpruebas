# SDD Phase — Common Protocol (Universal Mechanism)

Boilerplate identical across all repo-local SDD phase skills. Sub-agents MUST load this alongside their phase-specific SKILL.md.

The protocol defines **universal mechanisms** — skill loading, full-content retrieval, safe-write, primary-before-mirror ordering, mirror-failure handling, return envelope base, gate hooks — and delegates concrete values (paths, headings, store identifiers, topic patterns, lane lists, reason codes, recording sections) to `WorkflowRuntimeContext`. The `WorkflowRuntimeContext` is configured from the active project binding; its formal schema is `.agents/skills/sd-protocol/workflow-runtime-context.md` (the only authoritative shape of `WorkflowRuntimeContextV1`).

Repo-local coordinated policy in any project is one configured overlay. The `mis-proyectos` overlay uses a compact filesystem index plus phase artifacts and configures no mirrors.

Executor boundary: every SDD phase agent is an EXECUTOR, not an orchestrator. The coordinator launches the lane and injects exact lane and surface-policy skill paths; the executor reads and applies those documents itself. Policy skills are never agents or delegation targets. Do NOT launch sub-agents, do NOT call `delegate`/`task`, and do NOT bounce work back unless the phase skill explicitly says to stop and report a blocker. A lane may report the required owning lane to the coordinator but may not launch it. Explicit orchestration mechanisms such as `judgment-day` may launch only the internal actors their own skill declares.

## A. Skill Loading

1. Read only the exact repo-local paths published in the resolved `WorkflowRuntimeContextV1`: mandatory `lane_context.lane_skill_path`, every required path in `lane_context.surface_skill_paths`, optional `lane_context.task_selected_skill_paths`, and the complete ordered aggregate in `lane_context.skill_paths`. Read every aggregate entry before reading, writing, reviewing, testing, or creating artifacts. The aggregate is already frozen for this execution in lane → configured surfaces → optional helpers order with exact-path first-wins deduplication; the executor MUST NOT re-open the task snapshot, rescan installed skills, truncate the list, substitute a fallback, or let empty/warning state alter mandatory entries. The sub-agent, not the coordinator, loads these files.
2. Treat those full repo-local `SKILL.md` files as the canonical policy source. If compact reminders conflict with a loaded `SKILL.md`, the full `SKILL.md` wins.
3. If the orchestrator also injected a `## Project Standards (auto-resolved)` block, use it only as a compact reminder/index after loading the exact skill files. It does not replace the full skill files.
4. If `lane_skill_path`, any required `surface_skill_paths` entry, any injected `task_selected_skill_paths` entry, or any ordered `skill_paths` entry is missing, unreadable, unresolvable, or omitted from the aggregate, stop before work and return `blocked` with `skill_resolution_missing`. Do not consult the canonical task file, installed inventory, a registry, raw binding/locator, memory search, session-known paths, guessed paths, or compact reminders to recover it.

For coordinated SDD lanes, exact injected paths are the only mechanism. Compact rules are optional reminders after successful path loading and never a recovery mechanism.

## B. Artifact Retrieval

Read the active canonical artifact first. Only when `artifact_context.mirrors.length > 0`, retrieve configured mirrors using their resolved accessors. With `mirrors: []`, mirror retrieval is inert and no mirror accessor may be requested or invented.

**Index-primary variant (`WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`):** the primary holds only coordination summaries, not full phase detail. Read the compact index for state/handoff, then read prior **phase artifacts** you depend on by their referenced paths (`artifact_context.phase_artifacts.path_pattern` parameterised with `task_id` + the dependency's `artifact_keys[]`), which the index lists in its per-phase table. Do not expect full upstream detail inline in the index.

For configured mirrors only, search previews are not source material; call the configured full-retrieval primitive.

**Run independent retrievals in parallel.** Use only each resolved mirror's optional `query_pattern`; never reconstruct a pattern from a binding path or local convention.

Do NOT use search previews as source material.

## C. Artifact Persistence

Every phase that produces an artifact MUST persist it. Skipping this BREAKS the pipeline — downstream phases will not find your output.

Persistence branches on `artifact_context.mirrors.length`:

1. `WorkflowRuntimeContextV1.artifact_context.primary` — adapter and path/pattern for the primary reference artifact, resolved from the active binding.
2. With zero mirrors, `write_order` MUST equal `["primary"]`; mirror policy, availability, preflight and failure-record accessors are absent.
3. With mirrors present, `write_order` lists primary then every mirror exactly once; `on_required_mirror_failure`, `availability_values`, failure record and adapter read/write contracts are mandatory.
- `WorkflowRuntimeContextV1.artifact_context.forbidden_paths` — paths excluded by the active overlay.

Static repo portability is independent of mirrors. Runtime mirror availability exists only in the non-empty mirror branch; static checks cannot assert runtime availability.

### Canonical primary update

Update the matching section in the primary reference artifact whenever the phase produces or changes an artifact, using the section ownership resolved from the unique normalized heading supplied by `WorkflowRuntimeContextV1.artifact_context.primary.heading_map`.

- The mapping from phase kind to its owned primary heading is **configured**, not hardcoded. Skill-phase kinds include but are not limited to: `init`, explicit explore lanes (`explore-code`, `explore-research`, `explore-pwcli`), `propose`, `spec`, `design`, `tasks`, apply lanes (`apply-code-low`, `apply-code-medium`, `apply-code-high`, `apply-doc`, `apply-unit-tests`, `apply-pwauto-tests`), verification lanes (`verify-code`, `verify-units`, `verify-pwauto`, `verify-pwcli`) and the closure summary lane.
- The primary artifact should remain resumable by a human without querying any configured mirror first.

**Index-primary variant (`artifact_context.primary.role == "index"`):** a phase lane does NOT write the primary index. It writes its full detail to its resolved phase-artifact path and returns a bounded `summary` plus `artifact_ref`. The coordinator is the single writer of the index.

Do NOT create or update parallel filesystem artifacts under the configured `forbidden_paths` (typical default: `proposals/`, `specs/`, `designs/`, `tasks/`) unless the active binding explicitly declares those paths as part of the configured primary or mirror. If such legacy files exist, they are contextual history only and must not be used as examples or as current truth.

### Configured mirror writes (conditional)

This section is inert when `mirrors: []`. Otherwise write each configured mirror after canonical persistence using its configured adapter contract.

```
<configured-mirror-write>(
  title: "{title-template from WorkflowRuntimeContext}",
  topic_key: "{topic_key-pattern from WorkflowRuntimeContext}",
  type: "{configured-type from WorkflowRuntimeContext}",
  project: "{project}",
  content: "{artifact content}"
)
```

`topic_key` enables upserts when the adapter supports them — saving again updates, not duplicates. The exact upsert semantics are adapter-defined; consult `WorkflowRuntimeContextV1.artifact_context.mirrors[].adapter_contract`.

If a configured required mirror read/write is unavailable:

- The phase MUST preserve the full artifact in the primary reference.
- The phase MUST record the exact mirror failure in the configured blocker section using the configured generic failure key.
- The phase MUST return `blocked` unless the orchestrator explicitly allowed a non-closing degraded planning step.
- Degraded work cannot close a task: implementation, verification closure, the configured terminal state, and archive stay blocked until required mirrors are restored or an explicit coordinator exception is recorded.

## Active execution contract

The coordinated SDD workflow uses the lane split published by `WorkflowRuntimeContextV1.lane_context.registry`. The `auto` mode and primary-before-mirror ordering are mechanism-level invariants. Phase ownership uses only lane identifiers supplied by that bounded registry; no alternate alias participates in the active contract.

## D. Return Envelope

Every phase MUST return a structured envelope to the orchestrator. The base fields are universal; the project-specific fields are configured.

Base fields (universal):

- `status`: `success`, `partial`, or `blocked`
- `executive_summary`: 1-3 sentence summary of what was done
- `detailed_report`: (optional) full phase output, or omit if already inline
- `artifacts`: canonical artifact references plus configured mirror keys only when mirrors exist
- `next_recommended`: the next SDD phase to run, or "none"
- `risks`: risks discovered, or "None"
- `skill_resolution`: `injected-paths`, the only successful value for a coordinated SDD lane. A missing or unreadable injected path returns `blocked` with routing reason `skill_resolution_missing` rather than another resolution value.

Project-specific fields are configured by `WorkflowRuntimeContextV1.envelope_template.additional_fields` (e.g. `criteria_covered`, `phase`, `state`, mirror evidence, sections touched, revision counters). They MUST be filled by the phase if configured.

**Index-primary envelope fields (when configured):** when the binding declares `envelope_context.summary_field` / `artifact_ref_field`, the lane MUST also return:

- `summary` — bounded (≤ `index_budget.max_phase_summary_lines`) coordination summary the coordinator copies into the index per-phase table.
- `artifact_ref` — path to the phase artifact the lane wrote.

### Mandatory final file-surface check

Before returning from any phase that edited files, perform a delivery-surface risk check on the touched paths within that phase's command authority.

- This check is a reporting obligation, not Git/GitHub authority.
- Use the touched path list, allowed scope, loaded policy, and known generated/local-only conventions to identify risks.
- If any touched file is known or suspected to be gitignored, not stageable by normal commit flow, generated/local-only, or otherwise outside the intended commit surface, report it explicitly as a risk.
- Name every affected path and classify it for the orchestrator as one of:
  - `force-add required`
  - `exclude from commit`
  - `policy review required`
- If proving stageability would require a forbidden command, broad branch inspection, staging, commit, push, or PR operation, do **not** run it. Report the ambiguity and ask the coordinator to perform the mechanical delivery check.
- Do **not** stage files, commit, push, inspect broad branch state, or manage PRs from a phase agent unless that exact phase policy explicitly owns the command.
- Do **not** imply the work is ready for commit/PR while delivery-surface risks or ambiguities remain unresolved.
- If no such paths are known from the phase's allowed evidence, say so explicitly.

Example base envelope (universal fields):

```markdown
**Status**: success
**Summary**: <what was done in 1-3 sentences>
**Artifacts**: <list of primary sections and configured mirror keys>
**Next**: <next SDD phase or "none">
**Risks**: None
**Skill Resolution**: injected-paths — N repo-local skill files loaded
```

Project-specific fields are appended by the phase from the configured `envelope_template.additional_fields` (e.g. `criteria_covered: [AC-XXX]`).

## E. Coordinator-injected Project Rules block (parametric template)

This section defines the **structure** of the rules block that the coordinator injects when it launches an SDD executor lane. The **concrete values** inside the block come from `WorkflowRuntimeContext`; this file only fixes the shape and the mandatory invariant rules. The single source of truth for the structure is this section — do NOT duplicate the block inline in coordinator or executor lanes; reference this section. Executor lanes consume this block and perform their own work; they never use it to prepare a further delegation.

```md
## Skills to load before work
- Read these exact skill files before reading, writing, reviewing, testing, or creating artifacts:
  - `.agents/skills/<skill-name>/SKILL.md` (paths supplied by `WorkflowRuntimeContextV1.skill_paths[]`)

## Command Authority
- Tool permission is not command authorization: run only commands allowed by the coordinator command-authority matrix for this phase.
- Allowed command categories: <phase-local categories from `WorkflowRuntimeContextV1.command_authority.<phase>.allowed`>.
- Forbidden command categories: <out-of-phase examples from `WorkflowRuntimeContextV1.command_authority.<phase>.forbidden`>.
- Escalate/block instead of running out-of-authority commands: <owner from `WorkflowRuntimeContextV1.command_authority.<phase>.escalation_owner`>.
- Owned canonical artifact(s): <from `artifact_context.primary` / `phase_artifacts`>. Add configured mirror topics only when `mirrors` is non-empty.

## Project Rules (mandatory — values supplied by `WorkflowRuntimeContext`)
- SDD execution mode is `<configured mode>`.
- Repo-local persistence contract is `<configured persistence overlay>`.
- Treat the active `<configured primary artifact>` as the ONLY canonical operational + filesystem source of truth for execution, evidence, and next state. This is mandatory and non-negotiable for this overlay.
- Do NOT create or update parallel filesystem SDD artifacts under `<configured forbidden_paths>`.
- If `mirrors: []`, require `write_order: [primary]` and omit all mirror instructions.
- If mirrors are configured, inject their keys, adapter contracts, availability/failure fields and required-mirror close behavior from the bounded context.
- If this is new work, the first action is creating/bootstrapping the active primary artifact; minimal identity fields are enough at bootstrap.
- Use the next strictly necessary SDD phase from the active primary artifact state; simple changes normally go straight to the appropriate apply lane selected from `WorkflowRuntimeContextV1.lane_context.registry` and then the necessary verification lane(s).
- Only use task states from `<configured status_writable_set>`; legacy retired values MUST NOT be re-introduced as writable or as aliases.
- Never invent non-supported states beyond the configured `status_writable_set`.
- Successful execution must end in the configured terminal state.
- Use `<configured task_id_pattern>` and `<configured slug_pattern>` to derive the canonical primary path.
- Use one branch per task with the exact naming convention `<configured branch_pattern>`.
- Final PR target is always `<configured target_branch>`.
- Prefer tests and browser validation when configured; do not add build steps by default for this project unless the configured contract requires them.
- If the task affects browser-facing functionality, validation must include `<configured browser-lane>` and the configured credentials contract.
- If legacy SDD artifacts contradict the active primary artifact, never let them override the primary; stop and report `blocked` only when reconciliation is required before safe execution.
- Safe-write the primary artifact: re-read before writing, patch only owned sections, never whole-file rewrite unless exclusive ownership is declared, serialize same-section writes, and return intended patch/evidence on conflict.
- Treat `lane_context.task_skill_snapshot` and `task_selected_skill_paths` as immutable execution-cut evidence. Load the full injected `skill_paths` aggregate without re-resolution, truncation, fallback, or any change to mandatory lane/surface/mode/gate contracts.
- Every SDD phase output MUST declare `<configured criteria_covered_field>` populated with values from `<configured criteria_covered_source>` — see "Acceptance Criteria Gates" in the protocol library for the exact gate mechanism (parametric envelope evaluator).
```

The coordinator MUST reference this section rather than inline the block. Executor lanes may reference it as the rules they consume, but MUST NOT reuse it to launch or prepare prompts for another agent. If a future rule is added, update only this template.

## F. Lane boilerplate (parametric)

This section is the **single source of truth** for the boilerplate that is identical across every executor lane (apply, verify, tasks). A lane MUST reference this section instead of restating any of these blocks inline. Concrete values are always resolved from `WorkflowRuntimeContextV1`; nothing here is bound to a specific project overlay.

### F.1 Required Inputs (universal rows)

Every executor lane receives at least these bounded inputs from the coordinator. A lane declares only the *additional* rows specific to its family (e.g. `apply_work_unit_refs` for apply lanes, `browser_runtime_preconditions` for browser lanes); it does not re-describe the universal rows.

| Input | Source | Required? |
|---|---|---|
| `workflow_context_ref` | Coordinator injection (validated `WorkflowRuntimeContextV1`) | Yes |
| `artifact_refs` | Lane-owned file(s)/content resolved from `WorkflowRuntimeContextV1.task_ref` and the assigned unit | Yes |
| `workflow_context_ref.lane_context` | Coordinator confirms this lane id is in `lane_context.registry` and `lane_context.allowed_lanes` for the active phase | Yes |
| `mirror_key` | Configured mirror key; present only when `artifact_context.mirrors` is non-empty | Conditional; otherwise absent/inert |

A lane MUST refuse to invent path, branch, status, phase, mirror adapter, mirror key, close rule, or topic-pattern value. Every concrete value comes from `WorkflowRuntimeContextV1` and from the binding's `lanes`.

### F.2 Raw-input prohibition (universal)

A lane MUST NOT read `source.config_path`, `source.binding_path`, or `state_model_ref.path`. All workflow policy is consumed through the bounded context accessors of `WorkflowRuntimeContextV1`; the lane never opens the raw binding or locator.

### F.3 Retired-alias rule (parametric)

Never address any identifier in the binding's retired-alias set as a routing target, fallback, `owner` field, writable `status`, or operational value. `WorkflowRuntimeContextV1` surfaces retirement through the `lane_alias_retired` / `taskref_retired_alias_active` failure modes; route only to lane ids present in `WorkflowRuntimeContextV1.lane_context.registry`. The coordinator already validated membership. **A lane never re-enumerates the retired names** — it defers to the binding's single retired-alias set.

### F.4 Execution and Persistence pointer (universal)

> A lane always reads/writes its canonical target. With `mirrors: []`, it requires only `write_order: [primary]` and performs no mirror work. With mirrors present, it consumes the complete configured mirror branch without inventing accessors.

A lane references §F.4 instead of restating the persistence pointer inline.

### F.5 Index-primary and phase-artifact pointer (universal, conditional)

> When the resolved `WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`, a lane does NOT write the primary index. It writes its full detail to its resolved phase-artifact path and returns a bounded `summary` + `artifact_ref` through the envelope (§D). The coordinator is the single writer of the index.

A lane references §F.5 instead of restating the index/phase-artifact split inline. When `primary.role` is `"ledger"` or absent, §F.5 is inert and the lane uses the canonical primary update of §C.
