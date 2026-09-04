# apply-doc — lane evidence

## Run metadata

- lane: `sdd-apply-doc`
- apply_lane: `doc`
- skill: `sdd-apply-doc`
- artifact_class: `documentation_evidence`
- owner_phase: `fase_4_documentacion`
- task_id: `20260727-p4review`
- task_slug: `state-p4-reviewing`
- task_file: `taskReadme/20260727-p4review-state-p4-reviewing.md`
- task_type: `test`
- task_title: `State test: p4_reviewing`
- binding_id: `projectctl-requirements.task-flow`
- binding_version: `8.0.0`
- binding_path: `.agents/skills/projectctl-requirements/references/tareas.md`
- phase_artifacts_dir: `taskReadme/20260727-p4review-state-p4-reviewing/`
- engram_topic_key: `sdd/20260727-p4review/apply-doc`
- run_utc: `2026-07-27T18:09:19Z`
- previous_run_utc: `2026-07-27T09:35:00Z`

## State verification (binding contract)

Values read from the taskReadme frontmatter and reconciled against the binding
block `.agents/skills/projectctl-requirements/references/tareas.md`:

| Field | Task value | Binding expectation | OK |
|---|---|---|---|
| `phase` | `fase_4_documentacion` | `fase_4_documentacion` (lane `owner_phase`) | yes |
| `state` | `p4_reviewing` | declared in `phases[fase_4_documentacion].states` | yes |
| `status` | `documenting` | declared in `phases[fase_4_documentacion].status` | yes |
| `binding_id` | `projectctl-requirements.task-flow` | matches binding | yes |
| `binding_version` | `8.0.0` | matches binding `metadata.version` | yes |
| `binding_path` | `.agents/skills/projectctl-requirements/references/tareas.md` | matches binding host path | yes |
| `phase_artifacts_dir` | `taskReadme/20260727-p4review-state-p4-reviewing/` | matches `artifact_store.phase_artifacts.path_pattern` | yes |

The lane is registered in `lanes` block as:

```json
"sdd-apply-doc": {
  "skill": "sdd-apply-doc",
  "role": "apply",
  "artifact_class": "documentation_evidence",
  "owner_phase": "fase_4_documentacion"
}
```

State `p4_reviewing` belongs to `fase_4_documentacion`, which lists
`sdd-apply-doc` in its `allowed_lanes`. The lane is therefore valid for the
current state. Semantically, `sdd-apply-doc` performs the documentation write
action that *consumes* `p4_documenting` and produces the `documentation_apply_evidence_complete`
evidence that releases `p4_documenting → p4_reviewing`; the lane is still
allowed to execute in `p4_reviewing` (it is the only allowed lane in the phase),
but no write-envelope transition is available from `p4_reviewing` itself — the
post-apply review state only offers `p4_revision_requested`, `p3_test_preparing`,
or `p4_complete` per the binding's transitions block.

The phase artifact filename `apply-doc.md` is preserved verbatim across runs;
the binding's `artifact_store.phase_artifacts.artifact_keys` only declares
`apply-<unit_id>` (no unit token exists in this fixture), so the literal
filename is an unsupported identifier kept verbatim per the run-time "do not
normalize unsupported identifiers" rule.

## Assigned work units

- assigned unit IDs: **none**
- detected `## 5_work_units` section: **absent**
- detected `## 10. Desglose de implementación / progreso SDD` section: **absent**
- units with `apply_lane: doc`: **none**
- `sdd_change_id`: **empty** (no SDD change bound to this fixture)

The task purpose states: *"Display one task in the canonical workflow state
`p4_reviewing`."* The task is a static fixture: it ships the canonical
frontmatter and the canonical `## Purpose` / `## Expected` body, and it omits
the work-units breakdown because no implementation is intended for this
fixture. Under the segmented apply contract this is a **bounded run with zero
units** — the lane is allowed to execute, but it must not invent work, broaden
the scope, or touch doc files outside of owned scope.

## Lane decision

- unit status: **none** (no units assigned)
- `documentation_apply_evidence_complete`: **not satisfiable** for this taskReadme
  - `required_evidence: ["sdd_apply_doc_evidence_recorded"]` is unmet because no
    work units are assigned and the fixture exposes no doc-owned scope.
- routing: **stay in `p4_reviewing`**, do not advance to `p4_complete`,
  `p4_revision_requested`, or `p3_test_preparing`
- blocking reason: none (the task is a test fixture by design; the lane is
  blocked from advancing the state machine, not from executing the lane run).
- state semantics preserved: the fixture's stated purpose is to display
  `p4_reviewing`; advancing the state would defeat the test.

## Files modified

- refreshed: `taskReadme/20260727-p4review-state-p4-reviewing/apply-doc.md`
  (this evidence file — a phase artifact, not a doc product file; previous run
  was at `2026-07-27T09:35:00Z`)
- taskReadme index: **unchanged** (frontmatter already canonical; the fixture
  body `## Purpose` / `## Expected` is preserved verbatim, and the task
  `updated` field keeps the original `2026-07-27T09:30:00Z` fixture timestamp
  to preserve the test fixture's temporal seam)
- product doc files: **none** (no work units, no owned scope)
- forbidden surfaces: **none touched** (no product code, no tests, no
  `docs/**`, no `quality-status.md`, no `quality-plan.md`, no `docs/app-map/`,
  no git, no runtime)

## Specs / design criteria satisfied

- not applicable (no work units, no spec/design pair for this fixture)

## Deviations from design

- none

## Unresolved follow-up

- none for this lane run. The fixture is intentionally at `p4_reviewing` with
  no work units; the lane executed, the state was verified against the
  binding, and evidence is persisted as a phase artifact. Advancing the state
  machine from `p4_reviewing` requires either `documentation_gate_passed` (which
  demands `full_verification_green` and `agent_binding_client_surface_app_map_criteria_sources_and_mirrors_coherent`)
  — both unobtainable for this fixture — or `documentation_gate_failed` (which
  demands `documentation_gap_recorded` — also not produced here). The fixture
  correctly holds at `p4_reviewing`.

## Engram topic

- key: `sdd/20260727-p4review/apply-doc`
- written: yes (mirrored from the lane evidence; not a source of truth, not a
  recovery backend — supporting memory only per binding v8.0.0 persistence
  model)

## Return envelope

```json
{
  "lane": "sdd-apply-doc",
  "apply_lane": "doc",
  "task_id": "20260727-p4review",
  "task_slug": "state-p4-reviewing",
  "phase": "fase_4_documentacion",
  "state": "p4_reviewing",
  "status": "documenting",
  "assigned_unit_ids": [],
  "completed_unit_ids": [],
  "blocked_unit_ids": [],
  "files_modified": [
    "taskReadme/20260727-p4review-state-p4-reviewing/apply-doc.md"
  ],
  "specs_design_satisfied": [],
  "deviations": [],
  "follow_up": [],
  "gate_documentation_apply_evidence_complete": "not_satisfiable_no_units_assigned",
  "next_state_recommendation": "p4_reviewing",
  "engram_topic_key": "sdd/20260727-p4review/apply-doc",
  "binding_id": "projectctl-requirements.task-flow",
  "binding_version": "8.0.0",
  "run_utc": "2026-07-27T18:09:19Z",
  "previous_run_utc": "2026-07-27T09:35:00Z"
}
```
