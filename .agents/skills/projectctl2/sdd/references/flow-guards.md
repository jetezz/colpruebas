# SDD v2 flow guards

Canonical source of mechanical phase/state validations and `sdd/task` script semantics.
The graph (the what) lives in `sdd/phases/SKILL.md`; this file covers only the mechanical how.

## Contents

- [Valid destinations and rollbacks](#valid-destinations-and-rollbacks)
- [Phase/state tuple](#phasestate-tuple)
- [`set-phase.ts`](#set-phasets)
- [`set-state.ts`](#set-statets)
- [`update-task.ts`](#update-taskts)
- [Setter failure](#setter-failure)

## Valid destinations and rollbacks

- Valid destinations: `fase_1_propuesta` → `fase_2_implementacion` → `fase_3_verificacion` → `fase_4_documentacion`. Do not skip phases.
- Each `set-phase.ts` call advances at most one phase; it rejects repeating the current phase.
- Mechanically `set-phase.ts` allows rolling back to any earlier phase; that defines no flow transition. Never roll back automatically because of a defect.
- Internal state transitions only per the graph in `sdd/phases/SKILL.md`.

## Phase/state tuple

- Before calling the setters, decide the full destination tuple (`fase_2_implementacion / p2_planning`, `fase_3_verificacion / p3_test_preparing`, `fase_4_documentacion / p4_documenting` when entering each phase).
- Invoke `set-phase.ts` for the phase, then `set-state.ts` for the initial state.
- After both succeed, treat the tuple as established and continue without re-reading or re-validating.
- Scripts update fields separately and never validate the graph jointly; coherence belongs to the orchestrator.
- Prior mechanical check (read-only, never mutates Task): `sdd/task/scripts/check-task-tuple.ts --task <index> --target-phase <phase> --target-state <state> [--report-dir DIR] [--json]` validates the destination tuple against this graph and the convention reports (detail in `sdd/task/references/scripts-manual.md`).

## `set-phase.ts`

- Accept the four phases; reject the current phase and jumps of more than one phase.
- `fase_1_propuesta` → `fase_2_implementacion` requires non-empty `app_map`, `expected`, `criteria`, and `branch`, plus `proposal_state: approve`. It checks content only, not semantics or `navigation.yaml`.
- `fase_2_implementacion` → `fase_3_verificacion` requires `functional_state: approve`.
- `fase_3_verificacion` → `fase_4_documentacion` requires applicable tests run and green (the orchestrator confirms this with verification results; the script only checks order). ADDITIONALLY, only when `requirements_fix==true`, it requires F3 (`p3_requirements`) and F4 (`p4_requirements_docs`) req-fixer reports with `status: green` in scope (`Task.app_map`); with `requirements_fix==false` nothing else is required. The script does not check these reports mechanically; they are an orchestrator gate.
- Modify `phase` exclusively; never touch `state`, `proposal_state`, or `functional_state`.

## `set-state.ts`

- Modify `state` exclusively through a separate call.
- Check the `^[a-z][a-z0-9_]*$` pattern; do not check catalog, phase membership, order, or evidence.
- Reject `p4_done` unless `phase` is `fase_4_documentacion` and `pr.trim()` is non-empty.

## `update-task.ts`

- Allowed fields: `skills`, `app_map`, `expected`, `criteria`, `proposal_state`, `functional_state`, `requirements_fix`, `pr`, `ui_url`. Never update `phase` or `state`.
- Check types, shape, and local duplicates within the patch; may compare patch IDs against the stored `app_map.view.id`. Never read `docs/app-map/navigation.yaml`, never check global uniqueness, and never materialize the App Map.
- `proposal_state` and `functional_state` accept `not-init`, `rejected`, `approve`; both start as `not-init`.
- The write replaces the file at once; one writer per task, no locks.

## Setter failure

- When a setter returns an error, do not launch destination work; declare a block and wait for instructions.
- Never assume the destination tuple was established. Never re-read routinely after successes; never continue with dependent operations after failures.

## Engram best-effort (no gate)

- Setters never require memory. Order: decide tuple → `set-phase.ts` → `set-state.ts` → continue without re-reading or re-validating with Engram.
- `mem_current_project(cwd)` / runtime session ID is best-effort parallel to `init.ts`. When missing or when no ID is registered, continue with canonical Task (else-continue). Never invent, derive, generate, or register a session ID; when missing, omit `session_id` and use the project name for reads only.
- After setter success, do not re-validate with Engram. Engram is parallel help, never an advance pre-condition. Recovery order: `taskReadme` first, Engram second best-effort.
