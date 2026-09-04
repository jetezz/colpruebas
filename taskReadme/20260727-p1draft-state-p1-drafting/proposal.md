# Proposal: State test `p1_drafting`

> Faithful transposition: the proposal body below is copied from the inline proposal evidence in `taskReadme/20260727-p1draft-state-p1-drafting.md`. The source index remains unchanged. Statements about inline persistence and command scope describe the original proposal-authoring context; they do not negate this canonical phase artifact or the outer apply iteration's user-required production rebuild.

## Proposal (sdd-propose lane evidence)

> Owned by `sdd-propose` lane. Inline in the canonical `taskReadme` per repo-local contract; no `proposals/`, `specs/`, `designs/` or `tasks/` filesystem artifact is created.

### Intent

Produce the canonical proposal-owned evidence for the `p1_drafting` workflow state. The fixture is a `type: test` task whose sole purpose is to display one task in `state: p1_drafting` so the Tasks Tab can resolve and render the state without depending on `proposals/`, `specs/`, `designs/` or `tasks/` directories.

### Scope (in/out)

In
- Canonical frontmatter identifiers preserved verbatim (`task_id`, `task_slug`, `sdd_change_id`, `binding_id`, `binding_version`, `binding_path`, `phase`, `state`, `status`).
- Inline proposal evidence (this section) inside the canonical `taskReadme`.
- Engram mirror under topic key `sdd/20260727-p1draft/proposal`.

Out
- No new `proposal.md` file under `proposals/` or any parallel SDD filesystem artifact.
- No `spec.md`, `design.md`, `tasks.md` files; phases 2/3/4 remain blocked by binding.
- No git/gh, builds, tests, browser, Docker or `projectctl` runtime; no product code edits.

### Capabilities

None at spec level. This is a state-visibility fixture (`type: test`), not a capability-introducing change. Per `sdd-propose` §Capabilities rule, both New and Modified sub-sections are intentionally empty.

### Approach

1. Re-read the canonical `taskReadme` immediately before writing; patch only proposal-owned sections.
2. Record proposal metadata in frontmatter (`proposal_authored_at`, `proposal_lane`, `proposal_topic_key`, `proposal_state`).
3. Author this inline Proposal section matching `sdd-propose` SKILL.md fields (Intent, Scope, Capabilities, Approach, Affected Areas, Risks, Rollback, Dependencies, Success Criteria).
4. Mirror the exact evidence to Engram with `topic_key: sdd/20260727-p1draft/proposal`.
5. Leave `state: p1_drafting` untouched; the next legal transition is `p1_awaiting_acceptance` per `references/tareas.md` phases[id=fase_1_propuesta].transitions.

### Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `taskReadme/20260727-p1draft-state-p1-drafting.md` | Modified | Inline Proposal section + proposal frontmatter keys. |

### Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Identifier drift (`state`, `phase`, `status`, binding) | Low | Preserve verbatim; record evidence rather than normalizing. |
| Engram mirror unavailable | Low | Evidence lives in `taskReadme`; mirror is a recovery backend, not the SoT. |
| Confused with a real SDD change | Low | `type: test`, `sdd_change_id: ""`, no spec-level capability changes. |

### Rollback Plan

Revert only this `taskReadme` file (frontmatter `proposal_*` keys and this Proposal section). Do not touch other state fixtures, binding sources or `phase_artifacts_dir`.

### Dependencies

- Binding `projectctl-requirements.task-flow` v8.0.0 at `.agents/skills/projectctl-requirements/references/tareas.md`.
- Repo-local persistence: `taskReadme` index + Engram mirror (per `engram-policy`).
- No external services, no product code, no fixtures outside this file.

### Success Criteria

- Frontmatter keeps `state: p1_drafting`, `phase: fase_1_propuesta`, `status: planning` and binding identifiers unchanged.
- This Proposal section is present and follows `sdd-propose` SKILL.md fields.
- No new filesystem artifacts under `proposals/`, `specs/`, `designs/` or `tasks/`.
- Engram observation saved under `sdd/20260727-p1draft/proposal` mirrors this evidence verbatim.

## Next step

Await coordinator transition to `p1_awaiting_acceptance` (requires human explicit approval per `AC-010`). No spec, design, tasks or implementation work starts before that guard.
