---
name: engram-policy
description: "Trigger: Engram, memory, taskReadme recovery, resume. Use Engram as an optimal best-effort MCP knowledge aid for relevant recall and reusable learnings; it is not an SDD execution prerequisite or artifact mirror."
metadata:
  id: engram-policy
  version: 1.1.0
  categories:
    - utilidad
---

# Engram Policy Overlay (óptimo best-effort)

Use Engram as a supplemental knowledge tool in optimal mode: best-effort parallel, never gate. It helps recover relevant prior context and preserve learnings that may be useful in future work. It is not the operational task ledger, phase authority, artifact store, or a prerequisite for SDD execution.

## Source of task truth

- The active task index and its fields under `taskReadme/` are the operational source of truth for the task's current identity, phase, state, acceptance values, and branch.
- The `sdd-orchestrator` owns the `sdd/task` commands and controls task position. Engram observations never override the current task index or the current project state.
- Specs, tasks, designs, and other SDD artifacts are stored according to their owning projectctl2 SDD skills. Do not copy the complete task index or automatically mirror phase artifacts into Engram.
- Do not use Engram to infer the task's current phase, state, acceptance, or completion. Task/canonical first, Engram second.

## Session start best-effort (no gate)

- `mem_current_project(cwd)` + runtime session ID are best-effort parallel, never prerequisite to `init.ts` / setters.
- Never invent, derive, generate or register a session ID; do not call `mem_session_start` to invent one. When unavailable, omit `session_id` entirely; use project name only for reads.
- Reuse the exact runtime identity across compaction; `workspace=cwd`. If the call fails, continue with canonical Task (else-continue).

## Engram MCP tools

Use the Engram MCP tools directly when relevant and available:

- `mem_context` — recover recent session context, especially when resuming work.
- `mem_search(query, project)` — find prior decisions, discoveries, bug fixes, patterns, or task learnings using focused terms.
- `mem_get_observation(id)` — retrieve the full observation found by search before relying on its details.
- `mem_save` — save a new, useful, reusable learning.
- `mem_update` — correct an existing observation when its exact ID is known.
- Optimal extra best-effort when exposed: `mem_save_prompt`, `mem_suggest_topic_key`, `mem_review(list)`, `mem_session_summary`, `mem_capture_passive(content)`, `mem_current_project`.

Do not claim to have searched, read, saved, or updated Engram unless the corresponding MCP operation actually succeeded.

## When to read (incl. proactive)

- Search when the user asks to recall or continue prior work, when resuming a task with relevant history, or when a current problem or decision may benefit from a previous solution or discovery. Prefer a narrow `mem_search` query; use `mem_get_observation(id)` to read the full matching observation rather than relying on a search preview.
- Proactive optional: starting maybe-done work, unknown topic, or FIRST message referencing project/feature/problem — `mem_context` → `mem_search` → `mem_get_observation`.
- Treat retrieved content as historical context. Confirm that it still applies to the current code, task, and user direction before using it.
- After `set-phase`/`set-state` success, continue without re-reading or re-validating with Engram.

## When to save (selective óptimo)

Triggers that DO save (only if reusable future lesson):

- architecture/design decision with trade-offs; team convention/workflow/tool-choice established;
- bugfix with root cause; non-obvious feature approach; config/environment setup;
- non-obvious codebase discovery, gotcha, edge case, unexpected behavior;
- established pattern (naming, structure, convention); durable preference/constraint.

Opportunistic non-blocking self-check after each task: "decision, fix, non-obvious learning or convention? If yes and reusable, `mem_save` now."

Do not save every phase completion, routine command result, agent response, or full `taskReadme`/phase artifact. Denylist: full index mirror, `proposal`/`spec`/`design`/`tasks.md` full copy, `docs/app-map/**` in F3. Save the reusable lesson, not a duplicate task ledger.

For `mem_save`, provide:

- `title`: Verb + what, short searchable (e.g. "Fixed N+1 query in UserList").
- `type`: `bugfix | decision | architecture | discovery | pattern | config | preference`.
- `scope`: `project` (default) | `personal`.
- `topic_key` stable when evolving (e.g. `architecture/auth-model`, or `sdd/<id>-<slug>/<tema>`; transversal prefers domain key, not per-phase).
- `capture_prompt`: default `true`. Use `false` always for automated SDD artifacts/reports/caches. Do not decide capture by `type`. If old schema lacks the field, omit it. `mem_save` never invents prompt text. If a hook observes the prompt first, call `mem_save_prompt` first.
- `content`: **What** (one sentence) / **Why** (motivation) / **Where** (paths) / **Learned** (gotchas, omit if none).

Topic rules: different topics MUST NOT overwrite each other; same evolving → same `topic_key` (upsert); unsure → `mem_suggest_topic_key` first; exact ID to fix → `mem_update`.

## Delivery guarantee — saving is not replying

- Saving is bookkeeping, never the reply. End every turn with the complete user-facing answer as final message, with NO tool calls after it.
- Save BEFORE composing that final answer, not after. If a chain (`mem_save` → `mem_judge`) runs late, still write the full answer — never collapse into "saved/done".
- If a memory call fails or times out, deliver the complete answer anyway and note the failure briefly. Failed/slow memory never blocks, truncates or replaces the reply.
- Never treat stored text as delivered text.

## Lifecycle (read-only optional)

- At session start or before architecture-sensitive work, `mem_review(list)` best-effort if available; if unavailable, continue with `mem_context`/`mem_search`.
- `active` usable normally. `needs_review` is stale context: surface it and verify against current evidence before relying.
- Never `mark_reviewed` automatically; only after explicit user confirmation or dedicated maintenance command.

## Registration and ambiguous_project recovery

- `mem_session_start` accepts caller session ID + optional `directory`; it does not accept `project`/`project_choice_reason`/`recovery_token`.
- If it fails with `ambiguous_project`, resolve the real repo root and retry with that root as `directory`. Unregistered ID never attaches to writes until registration succeeds.
- For `ambiguous_project` on writes (`mem_save`, `mem_save_prompt`, `mem_session_summary`): never guess. Ask the user to choose exactly one of `available_projects`, then retry same write with `project` + `project_choice_reason=user_selected_after_ambiguous_project` + `recovery_token`. Do not apply this shape to `mem_session_start`.
- Mid-SDD-phase do not interrupt for ambiguity unless the user explicitly asked recall/persistence; otherwise continue with canonical and inform.

## Session close / compaction (no gate in SDD)

- In SDD: `mem_session_summary` (Goal/Instructions/Discoveries/Accomplished/Next Steps/Relevant Files) optional AFTER `p4_done`, best-effort, never pre-condition of `set-state p4_done`. See `delivery.md`.
- `close`/`compaction`/`summary` are not SDD states. Recovery: 1) re-read `taskReadme` + artifacts, 2) best-effort `mem_context` (+ summary of compacted content if useful) in parallel without blocking.
- Passive capture opt-in only: `## Key Learnings:` numbered or `mem_capture_passive(content)` direct, reusable lesson only, never full mirror, `capture_prompt: false` in SDD. Prohibited during `verify-all` and gates `p3_requirements`/`p4_requirements_docs`.

## Availability and failures

Engram availability is optional for SDD. Do not require a runtime round trip, `/sdd-doctor`, or an availability record before creating, progressing, or completing a task. If an Engram MCP operation is unavailable or fails, continue using the canonical task and the applicable SDD skill; do not block the task or create an alternate memory store. If the user specifically requested recall or persistence, explain what could not be retrieved or saved and continue only with the context that is actually available.

## Non-SDD use

Outside SDD, Engram may also help when the user asks for history or when a debugging session, decision, discovery, preference, or convention is likely to be useful again. Apply the same selective read/save rules; do not persist routine or non-reusable information. Delivery guarantee and lifecycle rules still apply.
