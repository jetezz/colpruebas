---
file: references/tareas.md
parent_skill: projectctl-requirements
owner: coordinator + SDD lanes
purpose: binding operational contract for task creation, four-phase execution, evidence, and delivery
sot_policy: canonical-standard
version: 9.0.0
last_full_regen: 2026-07-31
binding_id: projectctl-requirements.task-flow
model_version: 1
---

# Task flow binding — `projectctl-requirements` v9.0.0

## Purpose

This file is the **single operational binding** for agents that create, implement, verify, document, and deliver SDD tasks on the `mis-proyectos` overlay. Its sole purpose is to host the machine-consumable binding contract that `coordinador`, `sd-protocol` and the binding-declared workflow lanes read through a `WorkflowRuntimeContextV1` resolved from this file.

The binding resolves the entire local task workflow — identity, persistence, the four-phase state machine, action controls, lane matrix, gates, delivery, and active-source allow-list — without requiring a second normative catalog. The prose before and after the delimited block is **context only**.

> **v9.0.0 optional-helper contract (breaking).** The binding now declares `task_skill_selection`: task snapshots select project-installed helper skills by stable `metadata.id`, while every execution preserves the mandatory lane → configured surfaces → optional helpers order. The professional Tasks CLI inputs and explicit selection modes are part of the same portable contract. The v8 filesystem-only persistence model remains unchanged.

## Machine block identity

Project locators resolve this canonical binding through the delimited `task-flow-binding` block below. The block belongs to this file; the locator at `.agents/sdd-workflow.json`, the projection at `.agents/skills/projectctl-requirements/generated/phase-state-schema.json`, the task template at `.agents/skills/projectctl-requirements/assets/task-template.md`, and the client view-model at `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` only reference or derive from it — they are **not independent authorities**.

The block delimiter contract is intentionally minimal and machine-grepeable:

- **Open marker**: `<!-- task-flow-binding:start -->` on its own line.
- **Close marker**: `<!-- task-flow-binding:end -->` on its own line.
- **Body**: a single fenced `json` code block delimited by ```` ```json ```` and ```` ``` ```` on their own lines.
- **Extraction rule**: a deterministic consumer MUST locate the open marker, locate the matching close marker, read every line strictly between them, parse the unique fenced JSON block, and validate it against the `TaskFlowBindingV1` shape declared in `references/decisions.md` §D-15. Any other parsing strategy is forbidden by the binding consumer contract.

The block is the only normative machine artifact of this binding. Prose outside the block is **contextual and may not redeclare machine values**; a divergence between prose and block is treated as drift and rejected by the binding consumer.

## How to read this binding

A reader (human or agent) navigating this file MUST follow three rules:

1. **Locate the machine block** by the markers above. Treat the JSON between the markers as the only authoritative shape of the local task workflow — phases, statuses, controls, lanes, transitions, gates, delivery, active sources and retired aliases are read from there and only from there.
2. **Never edit prose to declare additional machine values.** Need to add a phase, state, control, lane, transition, gate, or delivery rule? Edit the JSON inside the markers and, if the change is breaking, bump `metadata.version` per `references/maintenance.md`. The remainder of this file will not absorb the change.
3. **Cite the binding**, do not summarise it. Process docs (`docs/00-context/coordinator-flow.md`, `docs/04-process/task.md`), App Map views (`docs/app-map/views/projectctl/features/tareas.{md,mmd}`, `docs/app-map/views/project-workspace/features/tasks-tab.md`), AGENTS docs and shared skills (`docs/00-context/agents_skills.md`) link to this file and explain **how** to use the binding. They MUST NOT publish their own phase lists, state diagrams, lane tables, gate inventories or delivery catalogs; any such duplication is rejected by the anti-drift gate.

## Navigation

| Need | Look here |
|---|---|
| Identity, naming, file pattern, heading owners | JSON `task` block. |
| Persistence, primary, mirrors, safe-write, failure handling | JSON `artifact_store` block. |
| Statuses, phases, controls, transitions, gates, delivery | JSON `status`, `phases`, `controls`, `gates`, `delivery` blocks. |
| Lane registry and roles | JSON `lanes` block. |
| Allow-list and exclusion list of sources that may carry machine values | JSON `active_sources` block. |
| Retired identifiers preserved only as non-operative inventory | JSON `retired_aliases` block. |
| Repository-level shape decisions and their rationale | `references/decisions.md` §D-1..D-15 and §D'1..D'10. |
| Integrated standard, runtime, doc/test/CLI rules that cite (do not redefine) this binding | `references/standard.md`. |
| Cross-repo versioning, anti-drift, semantic-version contract | `references/maintenance.md`. |
| SoT table and path-coherence checks | `references/sources.md`. |
| Skill entry point and high-level purpose | `../SKILL.md`. |
| Persisted state projection (derived, not authoritative) | `../generated/phase-state-schema.json` (`artifact_role: "generated"`). |
| Locator that points to this file and to its projections | `.agents/sdd-workflow.json`. |
| Templated example of a task whose frontmatter is valid against this binding | `../assets/task-template.md`. |

## Source identity

| Property | Value |
|---|---|
| `binding_id` | `projectctl-requirements.task-flow` |
| `binding_version` | `9.0.0` |
| `model_version` | `1` |
| Marker opening | `<!-- task-flow-binding:start -->` |
| Marker closing | `<!-- task-flow-binding:end -->` |
| Path (repo-relative) | `.agents/skills/projectctl-requirements/references/tareas.md` |
| Locator | `.agents/sdd-workflow.json` |
| Generated state projection | `.agents/skills/projectctl-requirements/generated/phase-state-schema.json` |
| Skill version policy | bump MAJOR on contract change per `references/maintenance.md` R-006 |
| Active-source allow-list | declared in JSON `active_sources.include` |
| Excluded legacy paths | declared in JSON `active_sources.exclude` |

## What this file is **not**

This file is only the binding host; tutorials, UI mirrors, workspace contracts, skill/agent registries, anti-drift policy and pre-v5 history live in the files mapped under `## Navigation` and `## Operational references`, never here.

## Operational references

These files cite this binding via the resolved `WorkflowRuntimeContext`; none of them is a source of machine values (state machine, lane matrix, gates):

- Skill entry point: `.agents/skills/projectctl-requirements/SKILL.md` — index + cross-tab purpose only.
- Integrated requirements and cross-surface rules: `.agents/skills/projectctl-requirements/references/standard.md`.
- Anti-drift and cross-repo versioning: `.agents/skills/projectctl-requirements/references/maintenance.md` — anti-drift and versioned install contract.
- SoT table and path coherence: `.agents/skills/projectctl-requirements/references/sources.md` — machine-grepeable SoT table that trazes the block markers.
- Binding decisions: `.agents/skills/projectctl-requirements/references/decisions.md` — binding decisions D-1..D-15 and D'1..D'10.
- Persistence implementation: `.agents/skills/sd-protocol/persistence-contract.md` and `.agents/skills/sd-protocol/sdd-phase-common.md` — universal protocol mechanisms.
- Generated state projection: `.agents/skills/projectctl-requirements/generated/phase-state-schema.json` — derived projection with `artifact_role: "generated"`; regenerated by `taskflow:generate`; **not** normative until the next apply of `sdd-apply-code-high-WU-11` on a fresh binding digest.

## Recovery guidance (operative, non-machine)

Before resuming a task, query the tracking row in `public.tasks` (via the
tracking endpoint or `projectctl tasks-status get <task_id>`) and check out
its `branch_name`; the `taskReadme` in that branch remains the real source of
truth for `phase`/`state`/`status`. See
`docs/04-process/task.md` ("Recovery: consultar la fila de seguimiento
primero") for the full operator-facing wording.

The tracking row is a board-convenience mirror, not a second source of
truth: the global `/tasks` board performs DB-first CRUD (create/edit/move/
delete) on that single row (`title`, `body`, `phase`, `state`, `status`,
`branch_name`, `pr_url`) via the tracking endpoints, without touching
taskReadme files, branches, sandbox or git. `title`/`body` are board-level
convenience metadata and `pr_url` is a server-validated projection of the
taskReadme frontmatter. The listado del workspace (`/project/[id]` tab
Tareas) falls back to the row when `task_id` matches and preserves the
taskReadme-derived behavior when no row exists. See
`docs/app-map/views/project-workspace/features/tasks-tab.md` for the
observable criteria.

The authenticated dashboard exposes a canonical entry to the board: the
`dashboard-tasks-shortcut` infra-shortcut card with an exact native
`<a href="/tasks">` link (keyboard-reachable, deep-link respects the
existing auth guard, single `tasks.astro` shell). Inside the board, a
client-side project filter (`tasks-board__project-filter`, `Todos` default
plus owned projects only) derives the visible rows from the already loaded
rows with zero new HTTP requests on filter change, renders a distinct
filtered-empty state with a `Mostrar Todas` reset CTA, keeps the selection
across refetch/drag, resets to `Todos` on ownership removal or reload, and
adds no endpoint, query parameter, or server-side filter. This delta is
documentation-level product behavior (spec rev 11 / design rev 12 of the
board task); it does not change this binding's machine values.

## How to extend this binding

- Add or modify a phase, state, lane, transition, gate or delivery rule: edit the JSON inside the markers, run `bun run taskflow:generate` and rerun `bun run taskflow:check`.
- Bump `metadata.version` per `references/maintenance.md` for every change that adds, removes or renames any machine key.
- Document a usage of the binding in any other file (process doc, AGENTS, App Map view, generated UI mirror): link to this file and explain how to use it. Do not embed a local copy of the JSON, a state list or a lane table.

## How to audit alignment

- `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` checks that every path cited in this binding and in `references/sources.md` still exists in the filesystem.
- `frontend/__tests__/coordinator-state-machine.test.ts` and `frontend/__tests__/projectctl-tareas-bundle.test.ts` validate that the binding shape and the published criteria remain coherent.
- The textual checks described under `references/standard.md` and `references/maintenance.md` reject any duplicate catalog of phases, states, lanes, gates or delivery actions that appears in an active source other than the delimited block in this file.

The remainder of this file is the delimited binding block. Do not add prose commentary between the markers or after the close marker that mirrors the machine content.

<!-- NORMATIVE MACHINE BLOCK — edit by changing the binding contract, not the prose; regenerate taskflow:generate after edits -->
<!-- task-flow-binding:start -->
```json
{
  "binding_id": "projectctl-requirements.task-flow",
  "binding_version": "9.0.0",
  "model_version": 1,
  "task": {
    "required_inputs": [
      "task_name",
      "current_problem",
      "app_map_location"
    ],
    "id_pattern": "^\\d{8}-[a-z0-9]{4,8}$",
    "slug_pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    "file_pattern": "taskReadme/<task_id>-<task_slug>.md",
    "heading_owners": {
      "1_objetivo": "coordinator",
      "2_contexto_operativo": "coordinator",
      "3_criterios_de_aceptacion": "coordinator",
      "4_fases": "coordinator",
      "5_work_units": "coordinator",
      "6_verificacion": "coordinator",
      "7_estado_actual_siguiente_paso_handoff": "coordinator",
      "8_problemas_blockers": "coordinator",
      "9_git_y_pr": "coordinator"
    }
  },
  "task_skill_selection": {
    "optional": true,
    "schema": "task-skills/v1",
    "identity": "metadata.id",
    "inventory": {
      "scope": "project-installed",
      "entry_pattern": ".agents/skills/*/SKILL.md",
      "immediate_entries_only": true,
      "follow_symlinks": false,
      "missing_or_conflicted": "warn-and-omit"
    },
    "snapshot": {
      "source": "taskReadme/<task_id>-<task_slug>.md#Task skill snapshot",
      "reread_at_execution_start": true,
      "active_capture": "immutable",
      "empty_selection": "valid"
    },
    "resolution": {
      "order": [
        "lane_skill_path",
        "surface_skill_paths",
        "task_selected_skill_paths"
      ],
      "dedupe": "exact-path-first-wins",
      "mandatory_paths_preserved": true,
      "executor_resolution": "injected-paths-only",
      "fallback": "forbidden",
      "truncation": "forbidden"
    },
    "cli": {
      "create_command": "projectctl tasks create",
      "update_command": "projectctl tasks update <file>",
      "create_endpoint": "/projects/:id/tasks/template",
      "professional_create_inputs": [
        "title",
        "problem",
        "expected",
        "app-map",
        "change-type",
        "criteria-json"
      ],
      "optional_create_inputs": [
        "context",
        "related-task"
      ],
      "selection_modes": [
        "skills",
        "no-skills",
        "interactive"
      ],
      "selection_modes_mutually_exclusive": true,
      "interactive_requires_tty": true,
      "interactive_forbidden_with_json": true,
      "create_without_selection_mode": "defaults",
      "update_without_selection_mode": "preserve"
    }
  },
  "artifact_store": {
    "primary": {
      "adapter": "filesystem",
      "path_pattern": "taskReadme/<task_id>-<task_slug>.md",
      "owner": "taskReadme <task_id>-<task_slug>.md",
      "role": "index",
      "index_budget": {
        "max_lines": 400,
        "max_phase_summary_lines": 10
      }
    },
    "phase_artifacts": {
      "path_pattern": "taskReadme/<task_id>-<task_slug>/<artifact>.md",
      "artifact_keys": [
        "explore-code",
        "explore-research",
        "explore-pwcli",
        "proposal",
        "spec",
        "design",
        "tasks",
        "apply-<unit_id>",
        "verify-code",
        "verify-units",
        "verify-pwauto",
        "verify-pwcli",
        "verify-report",
        "archive"
      ]
    },
    "mirrors": [],
    "write_order": [
      "primary"
    ]
  },
  "status": {
    "writable": [
      "pending",
      "planning",
      "implementing",
      "testing",
      "documenting",
      "done",
      "blocked",
      "failed"
    ],
    "pre_bootstrap": "pending",
    "terminal": "done"
  },
  "modes": {
    "review_mode": {
      "default": "sdd-verify-code",
      "allowed": ["sdd-verify-code", "judgment-day"],
      "description": "Selecciona el mecanismo de revisión de código. Default: revisor único sdd-verify-code. Opt-in judgment-day: doble juez ciego adversarial para tareas de mayor ROI. Se activa por frontmatter de la task."
    },
    "delivery_mode": {
      "default": "single-pr",
      "allowed": ["single-pr", "work-unit-commits"],
      "description": "Selecciona la estrategia de entrega. Default single-pr: un único PR. Opt-in work-unit-commits: commits/PRs por unidad de trabajo con encadenamiento (chained-pr) y guard de tamaño de PR. Se activa por frontmatter de la task."
    }
  },
  "phases": [
    {
      "id": "fase_1_propuesta",
      "status": "planning",
      "states": [
        "p1_started",
        "p1_exploring",
        "p1_drafting",
        "p1_awaiting_acceptance",
        "p1_revision_requested",
        "p1_accepted"
      ],
      "allowed_lanes": [
        "sdd-init",
        "sdd-explore-code",
        "sdd-explore-research",
        "sdd-explore-pwcli",
        "sdd-propose"
      ],
      "transitions": [
        {"from": "p1_started", "to": "p1_exploring"},
        {"from": "p1_exploring", "to": "p1_drafting"},
        {"from": "p1_drafting", "to": "p1_awaiting_acceptance"},
        {"from": "p1_awaiting_acceptance", "to": "p1_revision_requested", "guard": "proposal_feedback_or_rejection"},
        {"from": "p1_revision_requested", "to": "p1_drafting"},
        {"from": "p1_awaiting_acceptance", "to": "p1_accepted", "guard": "AC-010.explicit_approval"},
        {"from": "p1_accepted", "to": "branch_creation_pending", "guard": "AC-010.passed"}
      ]
    },
    {
      "id": "fase_2_implementacion",
      "status": "implementing",
      "states": [
        "p2_planning",
        "p2_implementing",
        "p2_code_review",
        "p2_awaiting_acceptance",
        "p2_revision_requested",
        "p2_accepted"
      ],
      "allowed_lanes": [
        "sdd-spec",
        "sdd-design",
        "sdd-tasks",
        "sdd-apply-code-low",
        "sdd-apply-code-medium",
        "sdd-apply-code-high",
        "sdd-verify-code",
        "judgment-day"
      ],
      "transitions": [
        {"from": "p2_planning", "to": "p2_implementing", "guard": "planning_artifacts_complete"},
        {"from": "p2_implementing", "to": "p2_code_review", "guard": "code_apply_evidence_complete"},
        {"from": "p2_code_review", "to": "p2_revision_requested", "guard": "code_review_failed"},
        {"from": "p2_revision_requested", "to": "p2_implementing"},
        {"from": "p2_code_review", "to": "p2_awaiting_acceptance", "guard": "code_review_passed"},
        {"from": "p2_awaiting_acceptance", "to": "p2_revision_requested", "guard": "functional_acceptance_rejected"},
        {"from": "p2_awaiting_acceptance", "to": "p2_accepted", "guard": "functional_acceptance_explicit"},
        {"from": "p2_accepted", "to": "p3_test_preparing", "guard": "functional_acceptance_recorded"}
      ]
    },
    {
      "id": "fase_3_verificacion",
      "status": "testing",
      "states": [
        "p3_test_preparing",
        "p3_test_running",
        "p3_test_fixing",
        "p3_coverage_pending",
        "p3_complete"
      ],
      "allowed_lanes": [
        "sdd-apply-unit-tests",
        "sdd-apply-pwauto-tests",
        "sdd-verify-units",
        "sdd-verify-pwauto",
        "sdd-verify-pwcli"
      ],
      "transitions": [
        {"from": "p3_test_preparing", "to": "p3_test_running", "guard": "coverage_matrix_ready"},
        {"from": "p3_test_running", "to": "p3_test_fixing", "guard": "test_failure_or_missing_test"},
        {"from": "p3_test_fixing", "to": "p3_test_running"},
        {"from": "p3_test_running", "to": "p3_coverage_pending", "guard": "coverage_incomplete"},
        {"from": "p3_coverage_pending", "to": "p3_test_preparing"},
        {"from": "p3_coverage_pending", "to": "p4_started", "guard": "phase4_owned_dependencies_only"},
        {"from": "p3_test_running", "to": "p2_revision_requested", "guard": "functional_defect_found"},
        {"from": "p3_test_running", "to": "p3_complete", "guard": "coverage_gate_passed"},
        {"from": "p3_complete", "to": "p4_started", "guard": "coverage_gate_passed"}
      ]
    },
    {
      "id": "fase_4_documentacion",
      "status": "documenting",
      "states": [
        "p4_started",
        "p4_documenting",
        "p4_reviewing",
        "p4_revision_requested",
        "p4_complete"
      ],
      "allowed_lanes": [
        "sdd-apply-doc"
      ],
      "transitions": [
        {"from": "p4_started", "to": "p4_documenting"},
        {"from": "p4_documenting", "to": "p4_reviewing", "guard": "documentation_apply_evidence_complete"},
        {"from": "p4_reviewing", "to": "p4_revision_requested", "guard": "documentation_gate_failed"},
        {"from": "p4_revision_requested", "to": "p4_documenting"},
        {"from": "p4_reviewing", "to": "p3_test_preparing", "guard": "documentation_changed_requires_reverification"},
        {"from": "p4_reviewing", "to": "p4_complete", "guard": "documentation_gate_passed"},
        {"from": "p4_complete", "to": "final_commit_pending"}
      ]
    }
  ],
  "controls": [
    {
      "id": "branch_creation_pending",
      "kind": "action",
      "writes_state": true,
      "value": {"phase": "fase_1_propuesta", "state": "branch_creation_pending", "status": "planning"},
      "owner": "coordinator",
      "transitions": [
        {
          "id": "branch_creation_pending_to_p2_planning",
          "from": "branch_creation_pending",
          "to": "p2_planning",
          "guard": "AC-010.passed_and_branch_available"
        }
      ]
    },
    {
      "id": "final_commit_pending",
      "kind": "action",
      "writes_state": true,
      "value": {"phase": "fase_4_documentacion", "state": "final_commit_pending", "status": "documenting"},
      "owner": "coordinator",
      "transitions": [
        {
          "id": "final_commit_pending_to_final_push_pending",
          "from": "final_commit_pending",
          "to": "final_push_pending",
          "guard": "commit_recorded"
        },
        {
          "id": "final_commit_pending_code_review_reentry",
          "from": "final_commit_pending",
          "to": "p2_revision_requested",
          "guard": "code_review_failed"
        }
      ]
    },
    {
      "id": "final_push_pending",
      "kind": "action",
      "writes_state": true,
      "value": {"phase": "fase_4_documentacion", "state": "final_push_pending", "status": "documenting"},
      "owner": "coordinator",
      "transitions": [
        {
          "id": "final_push_pending_to_final_pr_pending",
          "from": "final_push_pending",
          "to": "final_pr_pending",
          "guard": "push_recorded"
        }
      ]
    },
    {
      "id": "final_pr_pending",
      "kind": "action",
      "writes_state": true,
      "value": {"phase": "fase_4_documentacion", "state": "final_pr_pending", "status": "documenting"},
      "owner": "coordinator",
      "transitions": [
        {
          "id": "final_pr_pending_to_done",
          "from": "final_pr_pending",
          "to": "done",
          "guard": "pr_url_recorded"
        }
      ]
    },
    {
      "id": "done",
      "kind": "terminal",
      "writes_state": true,
      "value": {"phase": null, "state": "done", "status": "done"},
      "owner": "coordinator",
      "transitions": []
    },
    {
      "id": "blocked",
      "kind": "outcome",
      "writes_state": false,
      "status": "blocked",
      "preserves": ["phase", "state"],
      "owner": "coordinator",
      "transitions": []
    },
    {
      "id": "failed",
      "kind": "outcome",
      "writes_state": false,
      "status": "failed",
      "preserves": ["phase", "state"],
      "owner": "coordinator",
      "transitions": []
    }
  ],
  "lanes": {
    "sdd-init": {
      "skill": "sdd-init",
      "role": "bootstrap",
      "artifact_class": "taskReadme",
      "owner_phase": "fase_1_propuesta"
    },
    "sdd-explore-code": {
      "skill": "sdd-explore-code",
      "role": "exploration",
      "artifact_class": "exploration_summary",
      "owner_phase": "fase_1_propuesta"
    },
    "sdd-explore-research": {
      "skill": "sdd-explore-research",
      "role": "exploration",
      "artifact_class": "exploration_summary",
      "owner_phase": "fase_1_propuesta"
    },
    "sdd-explore-pwcli": {
      "skill": "sdd-explore-pwcli",
      "role": "exploration",
      "artifact_class": "exploration_summary",
      "owner_phase": "fase_1_propuesta"
    },
    "sdd-propose": {
      "skill": "sdd-propose",
      "role": "planning",
      "artifact_class": "proposal",
      "owner_phase": "fase_1_propuesta"
    },
    "sdd-spec": {
      "skill": "sdd-spec",
      "role": "planning",
      "artifact_class": "specs_delta",
      "owner_phase": "fase_2_implementacion"
    },
    "sdd-design": {
      "skill": "sdd-design",
      "role": "planning",
      "artifact_class": "design_decisions",
      "owner_phase": "fase_2_implementacion"
    },
    "sdd-tasks": {
      "skill": "sdd-tasks",
      "role": "planning",
      "artifact_class": "implementation_breakdown",
      "owner_phase": "fase_2_implementacion"
    },
    "sdd-apply-code-low": {
      "skill": "sdd-apply-code",
      "apply_lane": "code-low",
      "role": "apply",
      "artifact_class": "code_evidence",
      "owner_phase": "fase_2_implementacion"
    },
    "sdd-apply-code-medium": {
      "skill": "sdd-apply-code",
      "apply_lane": "code-medium",
      "role": "apply",
      "artifact_class": "code_evidence",
      "owner_phase": "fase_2_implementacion"
    },
    "sdd-apply-code-high": {
      "skill": "sdd-apply-code",
      "apply_lane": "code-high",
      "role": "apply",
      "artifact_class": "code_evidence",
      "owner_phase": "fase_2_implementacion"
    },
    "sdd-verify-code": {
      "skill": "sdd-verify-code",
      "role": "verification",
      "artifact_class": "code_review",
      "owner_phase": "fase_2_implementacion"
    },
    "judgment-day": {
      "skill": "judgment-day",
      "role": "verification",
      "artifact_class": "code_review",
      "owner_phase": "fase_2_implementacion"
    },
    "sdd-apply-unit-tests": {
      "skill": "sdd-apply-unit-tests",
      "role": "apply",
      "artifact_class": "test_evidence",
      "owner_phase": "fase_3_verificacion"
    },
    "sdd-apply-pwauto-tests": {
      "skill": "sdd-apply-pwauto-tests",
      "role": "apply",
      "artifact_class": "test_evidence",
      "owner_phase": "fase_3_verificacion"
    },
    "sdd-verify-units": {
      "skill": "sdd-verify-units",
      "role": "verification",
      "artifact_class": "unit_test_review",
      "owner_phase": "fase_3_verificacion"
    },
    "sdd-verify-pwauto": {
      "skill": "sdd-verify-pwauto",
      "role": "verification",
      "artifact_class": "pwauto_test_review",
      "owner_phase": "fase_3_verificacion"
    },
    "sdd-verify-pwcli": {
      "skill": "sdd-verify-pwcli",
      "role": "verification",
      "artifact_class": "browser_review",
      "owner_phase": "fase_3_verificacion"
    },
    "sdd-apply-doc": {
      "skill": "sdd-apply-doc",
      "role": "apply",
      "artifact_class": "documentation_evidence",
      "owner_phase": "fase_4_documentacion"
    }
  },
  "gates": {
    "proposal_feedback_or_rejection": {
      "evaluator": "evidence",
      "required_evidence": ["proposal_feedback_or_rejection_recorded"],
      "failure": "retain_phase_and_state"
    },
    "AC-006.criteria_covered": {
      "evaluator": "envelope_gate",
      "required_evidence": ["criteria_covered_non_empty_approved_ac_ids"],
      "failure": "reject_phase_envelope"
    },
    "AC-009.app_map_close": {
      "evaluator": "app_map_close_gate",
      "required_evidence": [
        "app_map_criteria_synced_for_all_approved_acs",
        "no_documentation_debt"
      ],
      "failure": "block_transition_to_done"
    },
    "AC-010.explicit_approval": {
      "evaluator": "transition_gate",
      "required_evidence": [
        "approval_actor",
        "approval_literal_message",
        "approval_utc_timestamp",
        "approved_revision",
        "approved_criteria_ids"
      ],
      "failure": "retain_phase_and_state"
    },
    "AC-010.passed": {
      "evaluator": "transition_gate",
      "required_evidence": [
        "canonical_task_exists",
        "required_inputs_valid",
        "proposal_complete",
        "explicit_user_approval_recorded",
        "p1_accepted",
        "phase_2_hold_released"
      ],
      "failure": "retain_phase_and_state_and_do_not_enter_phase_2"
    },
    "AC-010.passed_and_branch_available": {
      "evaluator": "transition_gate",
      "required_evidence": [
        "AC-010.passed",
        "branch_created_from_source_branch",
        "canonical_branch_active"
      ],
      "failure": "retain_phase_and_state_and_do_not_enter_phase_2"
    },
    "planning_artifacts_complete": {
      "evaluator": "evidence",
      "required_evidence": ["spec_complete", "design_complete", "tasks_complete"],
      "failure": "retain_phase_and_state"
    },
    "code_apply_evidence_complete": {
      "evaluator": "evidence",
      "required_evidence": ["assigned_code_work_units_complete"],
      "failure": "retain_phase_and_state"
    },
    "code_review_failed": {
      "evaluator": "evidence",
      "required_evidence": [
        "code_review_defect_recorded",
        "code_or_contract_defect_recorded",
        "final_commit_not_recorded"
      ],
      "failure": "retain_phase_and_state"
    },
    "code_review_passed": {
      "evaluator": "hard_gate",
      "required_evidence": [
        "sdd_verify_code_green",
        "no_known_functional_or_code_quality_defect",
        "functional_summary_complete"
      ],
      "failure": "retain_phase_and_state"
    },
    "functional_acceptance_rejected": {
      "evaluator": "evidence",
      "required_evidence": ["functional_rejection_recorded"],
      "failure": "retain_phase_and_state"
    },
    "functional_acceptance_explicit": {
      "evaluator": "hard_gate",
      "required_evidence": ["explicit_user_functional_acceptance_recorded"],
      "failure": "retain_phase_and_state"
    },
    "functional_acceptance_recorded": {
      "evaluator": "hard_gate",
      "required_evidence": [
        "p2_accepted",
        "functional_implementation_accepted",
        "canonical_branch_active",
        "acceptance_criteria_to_coverage_matrix"
      ],
      "failure": "retain_phase_and_state_and_do_not_enter_phase_3"
    },
    "coverage_matrix_ready": {
      "evaluator": "evidence",
      "required_evidence": ["acceptance_criteria_to_coverage_matrix"],
      "failure": "retain_phase_and_state"
    },
    "test_failure_or_missing_test": {
      "evaluator": "evidence",
      "required_evidence": ["test_failure_or_missing_test_recorded"],
      "failure": "retain_phase_and_state"
    },
    "coverage_incomplete": {
      "evaluator": "evidence",
      "required_evidence": ["partial_coverage_mapping_recorded"],
      "failure": "retain_phase_and_state"
    },
    "functional_defect_found": {
      "evaluator": "evidence",
      "required_evidence": ["functional_defect_recorded"],
      "failure": "retain_phase_and_state"
    },
    "coverage_gate_passed": {
      "evaluator": "hard_gate",
      "required_evidence": [
        "required_unit_or_pwauto_coverage_green",
        "coverage_file_test_command_and_result_recorded"
      ],
      "failure": "retain_phase_and_state"
    },
    "phase4_owned_dependencies_only": {
      "evaluator": "hard_gate",
      "required_evidence": [
        "pending_work_units_are_phase_4_doc_only",
        "no_functional_defect",
        "code_review_green",
        "core_verification_green",
        "deferred_documentation_checks_recorded",
        "deferred_checks_owner_command_and_dependent_work_units_recorded",
        "verification_revision_recorded",
        "documentation_revision_recorded",
        "return_to_p3_test_preparing_required_after_documentation_write"
      ],
      "failure": "retain_phase_and_state"
    },
    "documentation_apply_evidence_complete": {
      "evaluator": "evidence",
      "required_evidence": ["sdd_apply_doc_evidence_recorded"],
      "failure": "retain_phase_and_state"
    },
    "documentation_gate_failed": {
      "evaluator": "evidence",
      "required_evidence": ["documentation_gap_recorded"],
      "failure": "retain_phase_and_state"
    },
    "documentation_changed_requires_reverification": {
      "evaluator": "revision_gate",
      "required_evidence": ["documentation_revision_gt_verification_revision"],
      "failure": "retain_phase_and_state"
    },
    "documentation_gate_passed": {
      "evaluator": "hard_gate",
      "required_evidence": [
        "agent_binding_client_surface_app_map_criteria_sources_and_mirrors_coherent",
        "replaced_normative_material_and_duplicated_catalogs_removed",
        "no_documentation_debt",
        "verification_revision_gte_documentation_revision",
        "deferred_documentation_checks_empty",
        "full_verification_green"
      ],
      "failure": "retain_phase_and_state_and_do_not_complete_phase_4"
    },
    "commit_recorded": {
      "evaluator": "evidence",
      "required_evidence": ["final_commit_recorded"],
      "failure": "retain_phase_and_state"
    },
    "push_recorded": {
      "evaluator": "evidence",
      "required_evidence": ["final_push_recorded"],
      "failure": "retain_phase_and_state"
    },
    "pr_url_recorded": {
      "evaluator": "hard_gate",
      "required_evidence": [
        "pr_url",
        "branch_name",
        "final_evidence_recorded"
      ],
      "failure": "retain_phase_and_state_and_do_not_enter_done"
    }
  },
  "delivery": {
    "source_branch": "develop",
    "target_branch": "develop",
    "branch_pattern": "feature/<task_id>-<task_slug>",
    "action_order": [
      "final_commit_pending",
      "final_push_pending",
      "final_pr_pending",
      "done"
    ],
    "required_evidence_at_close": [
      "branch_name",
      "pr_url",
      "verification_revision",
      "documentation_revision",
      "criteria_covered_complete",
      "all_work_units_terminal"
    ],
    "delivery_modes": {
      "single-pr": {
        "default": true,
        "description": "One branch and one PR per task, using action_order above. This is the default when modes.delivery_mode is single-pr or unset."
      },
      "work-unit-commits": {
        "default": false,
        "skills": ["work-unit-commits", "chained-pr"],
        "pr_line_budget": 400,
        "description": "Opt-in multi-PR delivery selected by modes.delivery_mode = work-unit-commits. The coordinator loads the work-unit-commits and chained-pr skills, commits by work unit, and when the change forecast exceeds pr_line_budget authored lines splits into chained PRs (unless a maintainer records a size exception). Branch/PR base values still come from source_branch/target_branch/branch_pattern."
      }
    }
  },
  "active_sources": {
    "include": [
      ".agents/skills/projectctl-requirements/SKILL.md",
      ".agents/skills/projectctl-requirements/references/tareas.md",
      ".agents/skills/projectctl-requirements/references/standard.md",
      ".agents/skills/projectctl-requirements/references/sources.md",
      ".agents/skills/projectctl-requirements/references/maintenance.md",
      ".agents/skills/projectctl-requirements/references/decisions.md",
      ".agents/skills/projectctl-requirements/generated/phase-state-schema.json",
      ".agents/sdd-workflow.json"
    ],
    "exclude": [
      "taskReadme/<task_id>-<task_slug>.md#historical_other_than_active",
      ".agents/skills/sdd-tasks/tasks.md",
      ".agents/skills/coordinador/assets/phase-state-schema.json",
      ".agents/skills/coordinador/assets/task-template.md",
      ".agents/skills/coordinador/examples/**",
      "openspec/**",
      "proposals/**",
      "specs/**",
      "designs/**",
      "tasks/**"
    ]
  },
  "retired_aliases": [
    "ready_for_branch",
    "branching",
    "pushing",
    "verified",
    "phase1_generating",
    "phase2_branching",
    "phase3_implementing",
    "phase4_pushing",
    "completed",
    "paused",
    "sdd-apply",
    "sdd-apply-code",
    "sdd-explore",
    "sdd-verify",
    "sdd-browser-runtime-context",
    "sdd/<sdd_change_id>/<artifact>",
    "3_vinculacion_sdd_del_cambio",
    "4_resumen_de_exploracion",
    "5_proposal",
    "6_specs_delta_requirements",
    "7_design_decisions",
    "8_alcance_y_superficies_afectadas",
    "10_desglose_de_implementacion_progreso_sdd",
    "11_archivos_previstos_modificados",
    "12_impacto_backend",
    "13_validacion_requerida",
    "14_resultado_de_ejecucion",
    "15_resumen_de_verificacion_sdd",
    "16_archive_cierre_sdd",
    "17_problemas_encontrados",
    "18_git_y_pr",
    "19_documentacion_actualizada",
    "20_resumen_de_ejecucion",
    "21_historial_de_cambios_de_la_task"
  ]
}
```
<!-- task-flow-binding:end -->
