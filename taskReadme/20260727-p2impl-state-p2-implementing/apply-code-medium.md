# apply-code-medium — lane evidence

## Run metadata

- lane: `sdd-apply-code-medium`
- apply_lane: `code-medium`
- skill: `sdd-apply-code`
- artifact_class: `code_evidence`
- owner_phase: `fase_2_implementacion`
- task_id: `20260727-p2impl`
- task_slug: `state-p2-implementing`
- task_file: `taskReadme/20260727-p2impl-state-p2-implementing.md`
- task_type: `test`
- task_title: `State test: p2_implementing`
- binding_id: `projectctl-requirements.task-flow`
- binding_version: `8.0.0`
- binding_path: `.agents/skills/projectctl-requirements/references/tareas.md`
- phase_artifacts_dir: `taskReadme/20260727-p2impl-state-p2-implementing/`
- engram_topic_key: `sdd/20260727-p2impl/apply-code-medium`
- run_utc: `2026-07-27T09:40:00Z`

## State verification (binding contract)

Values read from the taskReadme frontmatter and reconciled against the binding
block `.agents/skills/projectctl-requirements/references/tareas.md`:

| Field | Task value | Binding expectation | OK |
|---|---|---|---|
| `phase` | `fase_2_implementacion` | `fase_2_implementacion` (lane `owner_phase`) | yes |
| `state` | `p2_implementing` | declared in `phases[fase_2_implementacion].states` | yes |
| `status` | `implementing` | declared in `phases[fase_2_implementacion].status` | yes |
| `binding_id` | `projectctl-requirements.task-flow` | matches binding | yes |
| `binding_version` | `8.0.0` | matches binding `metadata.version` | yes |
| `binding_path` | `.agents/skills/projectctl-requirements/references/tareas.md` | matches binding host path | yes |
| `phase_artifacts_dir` | `taskReadme/20260727-p2impl-state-p2-implementing/` | matches `artifact_store.phase_artifacts.path_pattern` | yes |

The lane is registered in `lanes` block as:

```json
"sdd-apply-code-medium": {
  "skill": "sdd-apply-code",
  "apply_lane": "code-medium",
  "role": "apply",
  "artifact_class": "code_evidence",
  "owner_phase": "fase_2_implementacion"
}
```

State `p2_implementing` belongs to `fase_2_implementacion`, which lists
`sdd-apply-code-medium` in its `allowed_lanes`. The lane is therefore valid for
the current state and the transition guard `code_apply_evidence_complete` is the
relevant gate to release for moving to `p2_code_review`. The artifact filename
`apply-code-medium.md` is preserved as the canonical lane evidence file for
this run; under binding v8.0.0 the expected `artifact_keys` include
`apply-<unit_id>` only, but the fixture's unsupported identifier is kept
verbatim per the run-time "do not normalize unsupported identifiers" rule.

## Assigned work units

- assigned unit IDs: **none**
- detected `## 5_work_units` section: **absent**
- detected `## 10. Desglose de implementación / progreso SDD` section: **absent**
- units with `apply_lane: code-medium`: **none**
- `sdd_change_id`: **empty** (no SDD change bound to this fixture)

The task purpose states: *"Display one task in the canonical workflow state
`p2_implementing`."* The task is a static fixture: it ships the canonical
frontmatter and the canonical `## Purpose` / `## Expected` body, and it omits
the work-units breakdown because no implementation is intended for this
fixture. Under the segmented apply contract this is a **bounded run with zero
units** — the lane is allowed to execute, but it must not invent work, broaden
the scope, or touch product files outside of owned scope.

## Lane decision

- unit status: **none** (no units assigned)
- `code_apply_evidence_complete` (`required_evidence: ["assigned_code_work_units_complete"]`):
  **not satisfiable** for this taskReadme — no work units are assigned.
- routing: **stay in `p2_implementing`**, do not advance to `p2_code_review`
- blocking reason: none (the task is a test fixture by design; the lane is
  blocked from advancing the state machine, not from executing the lane run).
- state semantics preserved: the fixture's stated purpose is to display
  `p2_implementing`; advancing the state would defeat the test.

## Files modified

- refreshed: `taskReadme/20260727-p2impl-state-p2-implementing/apply-code-medium.md`
  (this evidence file — a phase artifact, not a product file)
- taskReadme index: **unchanged** (frontmatter already canonical; the fixture
  body `## Purpose` / `## Expected` is preserved verbatim)
- product source files: **none** (no work units, no owned scope)
- forbidden surfaces: **none touched** (no tests, no docs, no git, no runtime,
  no `proposals/`, no `specs/`, no `designs/`, no `tasks/`)

## Specs / design criteria satisfied

- not applicable (no work units, no spec/design pair for this fixture)

## Deviations from design

- none

## Unresolved follow-up

- none for this lane run. The fixture is intentionally at `p2_implementing`
  with no work units; the lane executed, the state was verified against the
  binding, and evidence is persisted as a phase artifact. Advancing the state
  machine to `p2_code_review` requires `assigned_code_work_units_complete`
  which the fixture does not (and is not intended to) provide.

## Engram topic

- key: `sdd/20260727-p2impl/apply-code-medium`
- written: yes (mirrored from the lane evidence; not a source of truth, not a
  recovery backend — supporting memory only per binding v8.0.0 persistence
  model)

## Return envelope

```json
{
  "lane": "sdd-apply-code-medium",
  "apply_lane": "code-medium",
  "task_id": "20260727-p2impl",
  "task_slug": "state-p2-implementing",
  "phase": "fase_2_implementacion",
  "state": "p2_implementing",
  "status": "implementing",
  "assigned_unit_ids": [],
  "completed_unit_ids": [],
  "blocked_unit_ids": [],
  "files_modified": [
    "taskReadme/20260727-p2impl-state-p2-implementing/apply-code-medium.md"
  ],
  "specs_design_satisfied": [],
  "deviations": [],
  "follow_up": [],
  "gate_code_apply_evidence_complete": "not_satisfiable_no_units_assigned",
  "next_state_recommendation": "p2_implementing",
  "engram_topic_key": "sdd/20260727-p2impl/apply-code-medium",
  "binding_id": "projectctl-requirements.task-flow",
  "binding_version": "8.0.0"
}
```
