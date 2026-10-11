---
name: projectctl2-sdd-propose
description: Synthesize the problem, known decisions, and sdd-explore findings into a complete SDD v2 proposal; save it as proposal.md inside the task artifact folder and return it to the orchestrator for acceptance. Use when sdd-orchestrator delegates proposal drafting during p1_exploring.
---

# SDD v2 — sdd-propose

## Purpose

Prepare the proposal for a task during `p1_exploring`. The proposal explains the problem, the desired outcome, the scope, and a reasoned approach, using the Task context and the evidence returned by `sdd-explore`. Save the full document as `proposal.md` inside the task artifact folder and return a concise summary to the orchestrator with Task suggestions and any pending decisions.

Return the proposal to `sdd-orchestrator` for review and presentation. This skill does not accept the proposal, does not change the phase or state, and does not modify the task record.

## Expected input

The orchestrator provides, as available:

- task identity and goal, including `current_problem`;
- the exact path of the assigned `proposal.md`, under that task's artifact folder;
- current Task values when relevant, such as `app_map`, `expected`, `criteria`, `source_branch`, and `ui_url`;
- `sdd-explore` findings and sources;
- already confirmed product decisions, constraints, and pending questions;
- any explicit scope or limit requested by the user.

When missing information prevents proposing precisely, return the gap as a question or pending decision to the orchestrator. Do not interview the user directly or infer their answer.

## Proposal file

- Write the full proposal to `taskReadme/<task_id>-<task_slug>/proposal.md`, using the exact path delivered by the orchestrator. That artifact folder is part of the Task location defined in [`sdd/task/SKILL.md`](../../task/SKILL.md). Flow and guards: see [phases](../../phases/SKILL.md) and [flow-guards](../../references/flow-guards.md).
- When the file already exists because the proposal was rejected or needs revision, read it and update that same file with the proposed version; do not create alternative or duplicate files.
- When the assigned path does not exist or does not belong to the received task, do not create an approximate path. Inform the orchestrator so it can resolve the assignment.
- The file holds the full proposal; the response to the orchestrator is a concise summary, the written path, Task value suggestions, and pending decisions.

## Prepare the proposal

1. **Synthesize the problem and intent.** Explain which need is addressed and why, without adding goals unsupported by the user or the evidence.
2. **Define the scope.** Separate what the proposal includes from what stays explicitly out or belongs to a future task.
3. **Describe the expected outcome.** State the observable effect that would resolve the problem. When applicable, express the proposed value for `Task.expected`; do not confuse it with `Task.criteria`.
4. **Propose the App Map destination.** State the relevant view and feature for `Task.app_map`. Use available canonical data; when no evidence identifies an existing destination or supports proposing a new one, flag it as pending.
5. **Propose criterion operations.** Return suggestions for `Task.criteria` using only the admitted forms:
   - `new` and `edit` carry `criterion` with `id`, `description`, and `type` (`frontend`, `backend`, `data`, `tooling`, or `utils`), per [`sdd/task/SKILL.md`](../../task/SKILL.md);
   - `delete` carries `id`.

   Do not invent existing IDs or present these suggestions as materialized in Navigation. Flag IDs or types requiring orchestrator verification or decision.
6. **Describe the approach.** Summarize a high-level technical direction supported by the exploration findings. Compare alternatives only when more than one viable option exists; keep assumptions and open decisions visible.
7. **Identify impact and risks.** Cite observed code paths or areas when possible; distinguish proven impact from expected impact. Include dependencies, risks, and mitigations only with sufficient basis.
8. **State success and reversibility conditions when relevant.** Describe verifiable outcomes. Add rollback considerations when the change carries reversion risks; do not invent a universal rollback obligation or use it as a substitute for `Task.criteria`.

Do not perform or attempt operations that modify the task record; you do not need to know the commands that manage it. The orchestrator owns that record. Do not modify code, tests, or Task frontmatter. The only file you may create or update is the assigned task's `proposal.md`; do not change any other project file.

## Engram as auxiliary memory

Engram is best-effort and parallel, never a gate; see [engram-policy](../../references/engram-policy.md). Task/canonical first, Engram second. Reads: `mem_context` on resume, narrow `mem_search` + full `mem_get_observation(id)`; treat results as historical and confirm them. Selective post-result saves with `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`; do not mirror artifacts; on failure, continue and report. Saving ≠ replying.

## Response format

Write a complete proposal and save all content to `proposal.md`. Respond in English, using this template for the file:

```markdown
## Proposal: {short title}

### Problem and intent
{Need addressed and why}

### Expected outcome
{Proposed observable change}

### Scope
- Includes: {concrete deliverables}
- Excludes: {limits or deferred work}

### App Map destination
- View: {suggestion or pending, with evidence}
- Feature: {suggestion or pending, with evidence}

### Suggested criterion operations
- {new/edit/delete in Task form, or "None" when not applicable}

### Approach and affected areas
{High-level approach; verified paths/areas when possible}

### Risks, dependencies, and reversibility
{Risks and dependencies with basis; rollback plan when relevant}

### Pending decisions
- {Question or decision for the user/orchestrator to resolve, or "None"}

### Notes for the orchestrator
- {Recommended Task values and any pending validation}
```

Do not claim suggested values are already written to Task or materialized in the App Map. The proposal does not equal acceptance: the flow moves to `p1_awaiting_acceptance` and the orchestrator waits for the user decision.

After saving `proposal.md`, return a concise summary to the orchestrator with the file path, intent, scope, approach, main risks, suggestions for `app_map`/`expected`/`criteria`, and pending decisions. Do not duplicate the full file content in the response.
