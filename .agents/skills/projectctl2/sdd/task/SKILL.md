---
name: projectctl2-sdd-task
description: Define the SDD v2 Task index structure and its scripts; load when creating, validating, or updating the taskReadme frontmatter or its branches.
---

# Task creation — evolving definition

This document records the requirements agreed so far for the structure and population of an SDD v2 task. Every section in the table is required and must be present when the task is created; some may start without content and must be completed in the stated phase. This contract is still evolving and does not imply that the package versioning is closed.

## Shared structural contract

The Zod contract for the complete frontmatter of the index is [`TaskDocumentSchema`](../../types/contracts/task.ts), which infers `TaskDocument` and generates the JSON Schema [`task.schema.json`](../../types/generated/task.schema.json). Scripts validate with `validateDocument('task', data)` from [`schema-validator.ts`](../../types/scripts/schema-validator.ts); `validate-data.ts --schema task --file <task-index.md>` offers the same check from the CLI. TS types alone do not validate YAML; do not hand-edit the generated JSON. Correspondence with the App Map and phase rules are semantics external to the schema.

The `criteria` field is a list of Task operations (`new`, `edit`, `delete`). For `new` and `edit`, `criterion` references `NavigationCriterion` from [`shared.ts`](../../types/contracts/shared.ts); `delete` keeps the operation shape with an ID. `app_map` is a Task-specific destination, not a `NavigationDocument`: it may start empty or state `{ view: { id, name }, feature: { name } }`.

## Sections and requirements

| Required section since creation | Must it have content at creation? | Initial content / deadline phase | May it stay empty for the whole flow? |
|---|---|---|---|
| `task_id` | Yes | Assigned when the task is created and stays stable. Forms part of the `taskReadme/<task_id>-<task_slug>.md` path. | No |
| `task_slug` | Yes | Generated at creation and forms part of the index path, artifact folder, and branch name. | No |
| `task_name` | Yes | Descriptive name since creation. | No |
| `current_problem` | Yes | Problem motivating the task, described since creation. | No |
| `ui_url` | Yes | Initialized as `""`; optional target updatable in any phase. | Yes |
| `skills` | No | May start as an empty list; at creation a list of paths may be provided. | Yes |
| `app_map` | No | May start empty; must be defined in Phase 1 stating view and feature. | No |
| `expected` | No | May start empty; must be defined in Phase 1 as free text. | No |
| `criteria` | No | Starts empty; in Phase 1 the list is defined with a `new`, `edit`, or `delete` operation. | No |
| `source_branch` (source branch) | Yes | Defaults to `develop`; when another branch is chosen in Phase 1, switch before creating the branch. | No |
| `branch` (new development branch) | No | May start empty. Must be defined and created in Phase 1 as `feature/<task_id>-<task_slug>`. | No |
| `pr` (Pull Request link) | Yes | Initialized as `""`; registered with `update-task.ts` during delivery, before `p4_done`. | No |
| `phase` | Yes | The task is created in Phase 1 — Proposal. | No |
| `state` | Yes | The task is created in `p1_started`. | No |
| `proposal_state` | Yes | Starts as `not-init`. Values: `not-init`, `rejected`, `approve`. | No |
| `functional_state` | Yes | Starts as `not-init`. Values: `not-init`, `rejected`, `approve`. | No |
| `requirements_fix` | Yes | Starts as `false` (at creation, `--requirements-fix` sets it to `true`). `boolean default false`: `false` skips `p3_requirements` and `p4_requirements_docs`; `true` enables both gates. Updatable in any phase before F3 via `update-task.ts`. | No |

The index is stored at `taskReadme/<task_id>-<task_slug>.md`; its artifact folder at `taskReadme/<task_id>-<task_slug>/` (same identifier and slug, without `.md`).

## Agreed branch rules

- `source_branch` is the source branch (defaults to `develop`); when it does not exist or has no remote, the agent stays blocked and does not create the branch.
- `branch` is the new development branch; create it in Phase 1 from `source_branch` as `feature/<task_id>-<task_slug>`.

## Scripts

For invocation detail and examples: see [script manual](references/scripts-manual.md).

- `init.ts`: generates a new index with minimal interaction and without reading previous tasks.
- `set-phase.ts` / `set-state.ts`: update only `phase` / `state`, preserving the rest.
- `update-task.ts`: updates the allowed fields in one write (`skills`, `app_map`, `expected`, `criteria`, `proposal_state`, `functional_state`, `requirements_fix`, `pr`, `ui_url`).
- `create-branch.ts`: creates `feature/<task_id>-<task_slug>` from `source_branch` and records `branch`.

## Validation and delivery

- Mechanical advance guards, `phase`/`state` tuple, and setter semantics: see [flow-guards](../references/flow-guards.md).
- Delivery sequence before `p4_done`: see [delivery](../references/delivery.md).
