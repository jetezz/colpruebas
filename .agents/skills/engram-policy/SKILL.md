---
name: engram-policy
description: "Trigger: Engram, memory, taskReadme recovery, resume. Apply repo-local persistence and recall rules."
metadata:
  id: engram-policy
  version: 1.0.0
---

# Engram Policy Overlay

This skill is a **repo-local overlay**, not a replacement for shared Engram conventions.

Use it when work touches:

- repo-local SDD persistence policy
- `taskReadme/` lifecycle or resume quality
- recall/resume questions (`remember`, `qué hicimos`, `continue`, handoffs)
- project policy/docs about agents, skills, or workflow persistence
- any task where cross-session recovery quality matters

## Repo contract: `taskReadme` + Engram mirror

In `mis-proyectos`, the persistence contract is intentionally split as a **repo-local SDD overlay inspired by OpenSpec/OpenCode**:

- **`taskReadme` under `coordinador` policy** = the **only canonical operational + filesystem persistence artifact**
  - current status
  - next step
  - branch / PR traceability
  - validation scope and evidence
  - blockers and handoff context
- **Engram** = the **mandatory mirror / recovery / search backend**
  - mirrored phase artifacts (`sdd/{change}/...`)
  - project/testing context
  - cross-session recovery
  - decisions, discoveries, bugfixes, and workflow knowledge

Neither replaces the other.

- `taskReadme` is the human-operational ledger and the single source of truth in repo files.
- Engram is the cross-session memory and artifact mirror.
- Parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/` are forbidden in coordinated SDD work. Old files in those folders are legacy/contextual only and must never override or be used as examples instead of `taskReadme`.

That pairing is the repo contract.

## Engram availability contract

Engram is a required runtime prerequisite for fully compliant coordinated SDD, but it never replaces `taskReadme` as the canonical filesystem ledger.

- `bun run sdd:doctor` is the repo-local static preflight. It validates portable SDD files, registry paths, local OpenCode runtime, and the static persistence contract.
- `/sdd-doctor` is the Engram runtime preflight. It must perform an actual `mem_save`, `mem_search`, and `mem_get_observation` round trip before reporting Engram as available.
- Static checks cannot prove Engram availability because Engram lives in the agent runtime, not in a normal Bun process.
- `sdd-init` must check and record Engram availability for active SDD work.
- Every SDD phase must write/update `taskReadme` first, then mirror the artifact to Engram.
- If Engram is unavailable or a mirror write fails, preserve the full artifact in `taskReadme`, record the exact mirror failure, and return `blocked` unless the coordinator explicitly allowed a non-closing degraded planning step.
- When Engram is unavailable, bootstrap, exploration, and planning may continue only as explicit degraded non-closing work. Implementation, verification closure, `done`, and archive remain blocked until mirrors are restored or an explicit coordinator exception is recorded in `taskReadme`.
- A task must not move to `done` or archive while required Engram mirrors are missing, unless the coordinator records an explicit policy exception in `taskReadme`.
- Never compensate for missing Engram by creating filesystem mirrors under `proposals/`, `specs/`, `designs/`, `tasks/`, or `openspec/`.

## When to search memory

Search Engram before acting when any of these is true:

1. The user asks to recall prior work (`recordá`, `remember`, `what did we do`, `continue`).
2. A session resumes an existing task or change.
3. The first user message references a feature, bug, workflow, or repo area that may have prior history.
4. A task depends on prior SDD artifacts or prior verification results.
5. You are reconciling `taskReadme` state with SDD artifact state.
6. You suspect the same bug/decision/pattern was already handled before.

Search order:

1. `mem_context` for recent session context.
2. `mem_search` with focused repo terms.
3. `mem_get_observation` for full artifacts or decisions.

## When to save memory

Save to Engram immediately after any of these:

- completing an SDD phase artifact
- making or changing an architecture / workflow / policy decision
- fixing a bug and identifying root cause
- discovering a non-obvious repo constraint or gotcha
- changing config or persistence behavior
- learning a user preference or project constraint
- finishing validation with meaningful evidence or blocker context
- updating docs that change process, policy, architecture, or execution expectations

Use structured content with **What / Why / Where / Learned**.

## SDD phase expectations

For this repo-local SDD pipeline, persistence is **always `taskReadme`-first with Engram mirror**. `taskReadme` is the only filesystem source of truth; Engram mirrors it for recovery/search.

- `sdd-init`
  - seed or refresh SDD linkage/bootstrap context in the active `taskReadme` when present
  - persist project context and testing capabilities to Engram
- `sdd-explore`
  - search relevant prior context when the topic may already exist
  - write/update the exploration summary section in `taskReadme`
  - mirror the exploration artifact to Engram
- `sdd-propose`
  - read prior exploration/init context as needed
  - write/update the proposal section in `taskReadme`
  - mirror the proposal artifact to Engram
- `sdd-spec`
  - read proposal first
  - write/update the specs / delta requirements section in `taskReadme`
  - mirror the spec artifact to Engram
- `sdd-design`
  - read proposal/spec first
  - write/update the design decisions section in `taskReadme`
  - mirror the design artifact to Engram
- `sdd-tasks`
  - read proposal/spec/design first
  - write/update the implementation breakdown / progress section in `taskReadme`
  - mirror the tasks artifact to Engram
- split apply lanes
  - `sdd-apply-code`, `sdd-apply-doc`, `sdd-apply-unit-tests`, and `sdd-apply-pwauto-tests` read proposal/spec/design/tasks first
  - update only their owned implementation progress rows in `taskReadme`
  - mirror lane-specific apply progress to Engram
- verification lanes
  - `sdd-verify-code` reads proposal/spec/design/tasks/apply context first, writes `Code review`, and mirrors `sdd/{change-name}/verify-code`
  - `sdd-verify-units` reads proposal/spec/design/tasks/apply context first, writes `Unit tests`, and mirrors `sdd/{change-name}/verify-units`
  - `sdd-verify-pwauto` reads proposal/spec/design/tasks/apply plus quality context first, writes `PW-AUTO`, and mirrors `sdd/{change-name}/verify-pwauto`
  - `sdd-verify-pwcli` reads proposal/spec/design/tasks/apply plus browser validation context first, writes `PW-CLI`, and mirrors `sdd/{change-name}/verify-pwcli`
  - coordinator consolidates lane outputs into `Estado consolidado` and mirrors `sdd/{change-name}/verify-report`
- `sdd-archive`
  - read prior artifacts first
  - write/update the archive / closure summary section in `taskReadme`
  - mirror the archive report / closure summary to Engram
- `sdd-onboard`
  - teach the same contract, not a parallel persistence model

Across all phases:

- use stable `topic_key` values (`sdd/{change-name}/{artifact}`)
- treat monolithic `sdd-apply` wording as deprecated migration vocabulary only; active implementation ownership belongs to the explicit split apply lanes
- run or require `/sdd-doctor` when Engram availability is unknown, stale, or disputed
- retrieve full observations, not search previews
- record `engram_status`, `engram_last_check`, and `engram_blocker` in the active task when mirror availability affects execution
- do not treat chat history as the durable artifact source
- do not create or update `proposals/`, `specs/`, `designs/`, or `tasks/` files as SDD artifacts
- do not use legacy files from those folders as examples for new work
- do not describe this repo-local contract as literal upstream OpenSpec hybrid compliance
- do not switch repo-local coordinated SDD work to `openspec` artifacts

## Non-SDD triggers

Even outside formal SDD phases, Engram should be used when:

- the user asks for memory or history
- a debugging session reveals a reusable root cause
- a new repo convention or workflow rule is established
- docs/skills/agents policy is updated
- a handoff summary is needed for future sessions
- a significant validation or runtime finding should survive compaction

## Why this repo chooses `taskReadme` + Engram mirror

This repo wants:

- cross-session recovery without depending on chat history
- persistence that survives compaction
- deterministic retrieval of SDD artifacts by `topic_key`
- repo-specific workflow policy in local skills, not in portable orchestrator runtime config

That is why repo-local SDD persistence uses `taskReadme` as canon and Engram as mirror.

## When Engram is insufficient

Engram is **not** sufficient as the only operational system because:

- it is not the human-facing execution ledger
- upserts overwrite prior phase revisions
- it is not a git-reviewed audit trail
- it should not be the only place for branch / PR / validation handoff details

This repo still keeps Engram mandatory because the missing piece is covered by `taskReadme`.

- `taskReadme` handles canonical filesystem persistence, operational truth, and resumption.
- Engram handles durable artifact mirroring, recovery, and search.

That tradeoff is deliberate.
