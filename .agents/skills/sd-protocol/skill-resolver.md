# Skill Resolver — Universal Protocol

Any agent that **delegates work to sub-agents** MUST follow this protocol to resolve and inject relevant skills. This applies to the repo-local SDD orchestrator and any future workflow that launches sub-agents.

The mechanism in this file is universal. The coordinator publishes the selected implementation skill in `lane_context.lane_skill_path`, surface policies in `lane_context.surface_skill_paths`, the frozen per-execution optional capture in `lane_context.task_skill_snapshot` / `lane_context.task_selected_skill_paths`, and their ordered aggregate in `lane_context.skill_paths`; lanes MUST NOT inspect the locator, raw binding, canonical task file, inventory, or registry to rediscover any path.

For coordinated SDD, role ownership is strict: the coordinator launches executor lanes and injects exact skill paths; each executor reads and applies its injected lane and surface-policy skills itself. Policy skills are documents, never agents or delegation targets. An executor may route a blocker or required owner back to the coordinator, but it never launches another lane. Only an explicit orchestration mechanism may launch the internal actors its own skill declares.

## Why this exists

Sub-agents are born with NO context about what skills exist. Without skill injection, an executor touching any surface will miss the configured conventions. The resolver provides a single mechanism — independent of project — that ensures every delegated sub-agent reads the **full** `SKILL.md` files for the surfaces it touches, with configured paths only.

## When to apply

Before EVERY sub-agent launch that involves **reading, writing, or reviewing code**. Skip only for purely mechanical delegations (for example, a trivial one-shot command).

## The protocol

### Step 1: Consume resolved skill paths

For SDD lanes, the coordinator reads the selected `lane_context.registry[lane_id].skill` logical identity and resolves it through the project registry to exactly one readable repo-relative `SKILL.md`. It publishes that mandatory path as `lane_context.lane_skill_path` and required applicable surface policy paths as `lane_context.surface_skill_paths`.

Before context materialization for each new execution, the coordinator re-opens the canonical task file and resolves the persisted optional selection only against immediate, non-symlink `.agents/skills/*/SKILL.md` entries with a valid explicit `metadata.id`. It freezes the audit capture in `task_skill_snapshot` and the installed subset, sorted by logical ID, in `task_selected_skill_paths`. Missing and conflicting IDs produce non-blocking warnings and no path; names, labels, filenames, directories, paths, symlinks, registries, and previous execution captures are never fallback identity sources.

The duplicate-free aggregate `lane_context.skill_paths` has strict order: selected lane skill, surface policies in configured order, then optional helpers. Exact-path deduplication is first-wins: an optional helper that duplicates a mandatory path remains at its mandatory position. Empty/invalid/missing/conflicted task selections add zero helpers and never remove or reorder lane/surface entries or alter modes, gates, guardrails, or authorization. Before launch, the coordinator validates every published path as exact and readable. A lane id is not a skill name and MUST NOT be converted into a path. The sub-agent reads only the published full files in its own context and MUST NOT open `source.config_path`, `source.binding_path`, a projection, the canonical task file, an inventory, a registry, memory search results, session-known paths, guessed paths, or compact reminders to supplement the list.

If the lane skill identity, registry entry, exact path, readable file, or any required applicable surface policy is missing/unreadable/unresolvable, the coordinator returns `blocked` with `skill_resolution_missing` and does not launch the sub-agent. No fallback may replace any part of a coordinated SDD skill context.

**Non-SDD delegations only:** existing callers outside a coordinated SDD envelope may use their established explicit-path, registry, compact-reminder, or no-skill behavior. Their statuses do not authorize those mechanisms for an SDD lane.

### Step 2: Match relevant skills

Match skills on TWO dimensions:

**A. Surface / file context** — what files will the sub-agent touch or review?

Map file patterns to skills from the registry and prefer the registry's `trigger` field as source of truth for which files a skill governs.

**B. Task context** — what ACTIONS will the sub-agent perform?

| Sub-agent action | Match skills with triggers mentioning... |
|------------------|------------------------------------------|
| Write/review code | the configured framework/language for the surface |
| Run tests | configured test framework/runner for the surface |
| Update docs | docs, quality, app-map |
| Operate runtime | docker, compose, tunnel, sandbox, projectctl |

The exact skill names in the registry are binding-driven. The protocol only fixes the matching strategy and the surfaced count limit (next step).

### Step 3: Inject into sub-agent prompt

Inject the exact repo-local `SKILL.md` paths first, before task-specific instructions:

```
## Skills to load before work

Read these exact repo-local skill files before reading, writing, reviewing, testing, or creating artifacts:

- `.agents/skills/<skill-name>/SKILL.md`
- ... (one bullet per matched skill)
```

The skill paths come from the registry resolved in Step 1 and filtered in Step 2. The protocol does not invent paths.

If compact reminders are useful, add them after the paths:

```
## Project Standards (compact reminders)

{paste compact rules blocks for each matching skill, when the binding explicitly configures reminder mode}
```

The full `SKILL.md` files are authoritative. If compact reminders conflict with the loaded skill files, the skill files win.

### Step 4: Include configured project conventions (when present)

Some bindings ship a configured **project conventions** registry surface that lists project-pattern files (style guides, repo-local conventions, language idioms). When the resolved binding declares one, and the sub-agent will work on the project's code, append:

```
## Project Conventions

Read these files for project-specific patterns (paths are explicit lane-specific inputs authorized by the coordinator):

- {path1} — {notes}
- {path2} — {notes}
```

If the binding does not declare a project-conventions registry, skip this step. Do not invent project conventions.

### Step 5: Include WorkflowRuntimeContext summary (when the sub-agent is an SDD lane)

SDD lanes consume `WorkflowRuntimeContextV1` as the universal context shape (see `.agents/skills/sd-protocol/workflow-runtime-context.md`). The orchestrator that delegates work MUST pass a compact, lane-safe summary of the resolved context **only when** the binding has declared the lane to be SDD. The summary MUST be expressed in the bounded shape's field names; no project literal is allowed here.

```
## Workflow Context Summary (compact — full shape in WorkflowRuntimeContextV1)

- source: {binding_id} @ {binding_version} ({binding_path})
- task_ref.path: {primary path}
- phase_context: phase={phase}, state={state}, status={status}
- lane_context.allowed_lanes: {list}
- gate_context.active_gate_ids: {list}
- delivery_context.branches: source={source_branch} target={target_branch} active={branch_name}
- artifact_context.mirrors: {configured adapter + key + required flag for each}
```

The lane is the only consumer that expands this summary back into the full context; no extra fields are passed to non-SDD delegations.

## Token budget

A configured cap may apply only to optional non-SDD skills or compact reminder blocks. For coordinated SDD lanes, never drop or truncate `lane_skill_path`, required `surface_skill_paths`, `task_selected_skill_paths`, or any authorized helper included in ordered `skill_paths`. There is no fallback aggregate. If a configured hard budget cannot carry the full aggregate, return `blocked` with `skill_resolution_missing` before launch rather than silently truncating the list.

## Feedback loop

Sub-agents MUST report their skill resolution status in their return envelope's `skill_resolution` field (declared in `sdd-phase-common.md` §D). For coordinated SDD lanes, `injected-paths` is the only successful value: every exact repo-local `SKILL.md` path was received from the orchestrator and read by the lane.

Any other value in a coordinated SDD envelope is invalid and the orchestrator records `blocked` with `routing_tag: skill_resolution_missing`. Non-SDD delegations may retain their existing resolution statuses under the explicit boundary above.

## Sources

- `.agents/skills/sd-protocol/workflow-runtime-context.md` §4 — the bounded `WorkflowRuntimeContextV1` shape lanes must read.
- `.agents/skills/sd-protocol/sdd-phase-common.md` §A — skill loading (the universal mechanism this resolver implements).
- `.agents/skills/sd-protocol/workflow-runtime-context.md` §4 — bounded context including already-resolved `lane_context.skill_paths`.
- Lane-specific `artifact_refs` or browser/work-unit inputs — supply any additional project conventions explicitly authorized for the task.

If any of those sources disagree with this file, this file wins for the mechanism; the binding wins for the concrete registry location and skill triggers.
