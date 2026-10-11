# Engram policy for SDD v2

Canonical source of Engram use as auxiliary memory. No `SKILL.md` duplicates it; all link here.

Engram is best-effort parallel support: it retrieves prior knowledge and preserves reusable learnings. It is never required to run SDD, never an artifact backend, never a substitute for the canonical task in `taskReadme/`, and never decides the current `phase`, `state`, acceptance, or progress. `taskReadme` is the source of truth; the orchestrator is the sole `sdd/task` writer. Saving ≠ replying: saving never counts as replying.

## Session start best-effort (no gate)

- `mem_current_project(cwd)` and the runtime session ID are best-effort parallel to `init.ts`. When they fail or no ID exists, continue with canonical Task (else-continue).
- Never invent, derive, generate, or register a session ID. When missing, omit `session_id` and use the project name for reads only.
- Setters (`set-phase`/`set-state`) never require memory. See [flow-guards](flow-guards.md#engram-best-effort-no-gate).

## When to read

- Use `mem_context` when resuming a conversation or task to retrieve recent context.
- When the problem, a pending decision, or a defect may have precedents, search with `mem_search(query, project)` using concrete project and topic terms.
- Use `mem_get_observation(id)` to retrieve the full content before basing decisions on a search fragment.
- Consult when the user asks to recall or continue prior work, or when resolution depends on previous decisions, findings, or fixes. Never run mechanical searches at every step without relevant contribution.
- Optional proactive search: when starting work that may have been done before, facing an unknown topic, or when the first message references a project/feature/problem — `mem_context` → `mem_search` → `mem_get_observation`.
- Order: Task/canonical first, Engram second. Contrast precedents against the canonical task and current code; Engram contributes memory, not verdicts. Never infer `phase`/`state`/`acceptance`/`completion` from Engram.
- After setter success, continue without re-reading or re-validating with Engram.

## When to save (optimal selective)

Triggers that DO save (only when they contribute a future reusable lesson):

- architecture/design decision with trade-offs;
- established team convention/workflow/tool choice;
- bugfix with a useful root cause;
- feature with a non-obvious approach;
- non-trivial config/environment setup;
- non-obvious codebase discovery, gotcha, edge case, unexpected behavior;
- established pattern (naming, structure, convention);
- lasting user/project preference or constraint.

Opportunistic non-blocking self-check after each task: "decision, fix, non-obvious learning, or convention? When yes and reusable, `mem_save` now".

Denylist (never save):

- full `taskReadme`, full `proposal`/`spec`/`design`/`tasks.md`, or automatic artifact mirroring;
- every phase completion, routine result, command, agent reply, or phase step;
- `docs/app-map/**` in F3 (never touch docs in F3).

`mem_save` format:

- `title`: Verb + what, short and searchable (e.g. "Fixed N+1 query in UserList").
- `type`: `bugfix | decision | architecture | discovery | pattern | config | preference`.
- `scope`: `project` (default) | `personal`.
- Stable `topic_key` when the learning evolves (e.g. `architecture/auth-model`, or `sdd/<id>-<slug>/<topic>` for a task; prefer a domain key over a per-phase key for cross-cutting learnings).
- `capture_prompt`: default `true`. Always use `false` in automated SDD artifacts (proposal/spec/design/tasks/apply/verify/reports/caches). Never decide capture by `type`. When the old schema does not expose the field, omit it. `mem_save` never invents a prompt; without context it still saves without capture. When a hook observes the prompt first, call `mem_save_prompt` first.
- `content`: **What** (one sentence of what was done) / **Why** (motivation) / **Where** (affected paths) / **Learned** (gotchas, omit when none).

Topic rules:

- Distinct topics are never overwritten.
- Evolving same topic → same `topic_key` (upsert).
- Key in doubt → `mem_suggest_topic_key` first.
- Exact ID to fix → `mem_update`.

## MCP tools

- Invoke `mem_context`, `mem_search`, `mem_get_observation`, `mem_save` directly and, with a known ID, `mem_update`.
- Additional best-effort optimum when the server exposes it: `mem_save_prompt`, `mem_suggest_topic_key`, `mem_review(list)`, `mem_session_summary`, `mem_capture_passive(content)`, `mem_current_project`.
- Never substitute a real call with an inferred reply, nor claim an observation was read or saved without running the operation.

## Lifecycle (read-only optional)

- When `mem_review(list)` exists, call it best-effort at start or before architecture-sensitive work; when missing, continue with `mem_context`/`mem_search`.
- `active` is usable normally. `needs_review` is stale context, not fact: surface it to the user and verify against current evidence before use.
- Never automatic `mark_reviewed`; only after explicit user confirmation or a dedicated maintenance command.

## Registration and `ambiguous_project` recovery

- `mem_session_start` accepts a supplied session ID plus optional `directory`; it never accepts `project`/`project_choice_reason`/`recovery_token`.
- When it fails with `ambiguous_project`, resolve the real root and retry with that root as `directory`. Never attach an unregistered ID to writes until registration succeeds.
- On writes (`mem_save`, `mem_save_prompt`, `mem_session_summary`) with `ambiguous_project`: never guess. Ask the user to choose exactly one of `available_projects`, then retry the same write with `project` + `project_choice_reason=user_selected_after_ambiguous_project` + `recovery_token`. Never apply that shape to `mem_session_start`.
- In the middle of an SDD phase, do not interrupt for ambiguity unless the user requested explicit recall/persistence; otherwise continue with the canonical source and report.

## Optional session close (no gate)

- Optional `mem_session_summary` AFTER `p4_done`, best-effort, never blocking delivery. Never require it for `set-state p4_done`. See [delivery](delivery.md#engram--note-outside-the-sequence).
- Suggested format only when it contributes something reusable: Goal / Instructions / Discoveries / Accomplished / Next Steps / Relevant Files.

## After compaction (no-state)

- `close`/`compaction`/`summary` are not SDD states. Recovery: 1) re-read `taskReadme` + artifacts, 2) best-effort `mem_context` (plus the compacted summary's `mem_session_summary` when it contributes) in parallel without blocking.
- Preserve `workspace=cwd` and the exact session ID when present; never invent one.

## Passive capture opt-in

- Forbidden in `verify-all` and in `p3_requirements`/`p4_requirements_docs` gates (read-only / `only`).
- Elsewhere, best-effort opt-in: numbered `## Key Learnings:` or direct `mem_capture_passive(content)`, reusable lesson only, never a full mirror, `capture_prompt: false` in SDD.

## Delivery guarantee

- Saving is internal bookkeeping, never the reply. End every turn with the complete user reply as the final message, with no tool calls after it. Save BEFORE composing it, not after.
- When the chain (`mem_save` → `mem_judge`) arrives late, still write the complete reply; never collapse it into "saved/done".
- When a memory call fails or times out, still deliver the complete reply and note the failure briefly. Slow failure never blocks, truncates, or replaces.
- When reporting that a learning was saved, check MCP success. When it fails or is unavailable, continue the normal flow and report; never block on Engram alone.
