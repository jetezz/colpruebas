# `sdd/task` script manual

Operational invocation detail for the four Task scripts. Mechanical validations and delivery live in their canonical sources; this file covers only syntax, arguments, and outputs.

## Contents

- [`init.ts`](#initts)
- [`set-phase.ts` and `set-state.ts`](#set-phasets-and-set-statets)
- [`update-task.ts`](#update-taskts)
- [`create-branch.ts`](#create-branchts)
- [`check-task-tuple.ts`](#check-task-tuplets)

## `init.ts`

Generate a new task index with minimal interaction and without reading previous tasks:

```sh
bun .agents/skills/projectctl2/sdd/task/scripts/init.ts <task_name> <current_problem> [source_branch] [--skills <path> ...] [--requirements-fix[=true|false]]
```

Examples:

```sh
bun .agents/skills/projectctl2/sdd/task/scripts/init.ts "Name" "Problem" --skills .agents/skills/skill-a/SKILL.md .agents/skills/skill-b/SKILL.md
bun .agents/skills/projectctl2/sdd/task/scripts/init.ts "Name" "Problem" release/dev --skills .agents/skills/skill-a/SKILL.md
bun .agents/skills/projectctl2/sdd/task/scripts/init.ts "Name" "Problem" --requirements-fix
```

- `task_name` and `current_problem` are the only required arguments. `source_branch` is optional and defaults to `develop`; `--skills` accepts one or more non-empty, duplicate-free paths.
- Store paths as received, without checking that they exist.
- Generate `task_id`, `task_slug`, initial fields, and the index location; create `taskReadme/` and the artifact folder when missing.
- On success print only the created index path.
- `ui_url` is always created as `""`. It stays optional for the whole flow: empty never blocks phases, tests, delivery, or close. Do not validate it as a strict URL; accept `http://localhost:3000` and `https://example.com` as text.
- `requirements_fix` defaults to `false` (`boolean default false`): with `false` skip `p3_requirements` and `p4_requirements_docs`; with `true` enable both gates. At creation, `--requirements-fix` (or `--requirements-fix=true`) sets it to `true`; change it later with `update-task.ts`.

## `set-phase.ts` and `set-state.ts`

Update only the stated field in the index frontmatter, preserving the rest. On success print only the new value; on error, only the message:

```sh
bun .agents/skills/projectctl2/sdd/task/scripts/set-phase.ts <task-index> <phase>
bun .agents/skills/projectctl2/sdd/task/scripts/set-state.ts <task-index> <state>
```

- `set-phase.ts` modifies only `phase`; `set-state.ts` modifies only `state` in a separate call.
- The rules for when to update `proposal_state` / `functional_state` by phase are defined outside Task.

## `update-task.ts`

Update one or more allowed fields (`skills`, `app_map`, `expected`, `criteria`, `proposal_state`, `functional_state`, `requirements_fix`, `pr`, `ui_url`) in a single write. Return a JSON array with the updated names, in patch order; for example `["expected","criteria"]`:

```sh
bun .agents/skills/projectctl2/sdd/task/scripts/update-task.ts <task-index> '<patch-json>'
bun .agents/skills/projectctl2/sdd/task/scripts/update-task.ts <task-index> '{"requirements_fix":true}'
```

- `skills`: array of paths; may be `[]`. No extra whitespace or duplicates.
- `app_map`: `""` while undefined, or `{ "view": { "id": "...", "name": "..." }, "feature": { "name": "..." } }`.
- `expected`: free text.
- `criteria`: array of operations. `new` and `edit` carry `criterion: { "id": "...", "description": "...", "type": "frontend|backend|data|tooling|utils" }`; `delete` carries the `id`.
- `proposal_state` and `functional_state`: `not-init`, `rejected`, or `approve`; independent, both start as `not-init`.
- `requirements_fix`: `boolean` (`true`/`false`), starts as `false`; updatable in any phase before F3 via this script.
- `pr`: string with the PR link; may be `""` before creating it. Write the URL before requesting `p4_done`.
- `ui_url`: free string; accepts `""`, `http://localhost:3000`, or `https://example.com`, without strict validation.
- Check types, shape, and local duplicates within the patch. The write replaces the file at once; one writer per task, no locks.

## `create-branch.ts`

Switch to `source_branch` without saving or discarding local changes, resolve its remote, and run `git pull <remote> refs/heads/<source_branch>`; then create `feature/<task_id>-<task_slug>`:

```sh
bun .agents/skills/projectctl2/sdd/task/scripts/create-branch.ts <task-index>
```

- After creating the branch, record its name in `branch`; then return only that name. When the write fails, return a block.
- On retry, when the branch already exists and is active, record the name and return success without repeating checkout or pull. When it exists but is not active, return a block.
- Other Git blocks do not restore the previous checkout; later resolution belongs to another actor outside Task.

## `check-task-tuple.ts`

Validate a destination tuple (`phase`/`state`) without mutating the index. Read-only: check the Task frontmatter plus the reports resolved by convention:

```sh
bun .agents/skills/projectctl2/sdd/task/scripts/check-task-tuple.ts --task <index> --target-phase <phase> --target-state <state> [--report-dir <dir>] [--json]
```

- `--task`, `--target-phase`, and `--target-state` are required. `--report-dir` overrides convention resolution; `--json` emits `{ok:true}` or `{ok:false, rule, expected, actual}` (without `--json`, human text: `ok: ...` or `BLOCKED [rule]: ...`).
- Exit 0 when the tuple is valid, 1 when blocked or invalid, 2 on usage errors.
- Report convention: beside the index `taskReadme/<id>-<slug>.md` lives the folder `taskReadme/<id>-<slug>/` with `p3_test_running.report.json`, `p3_requirements.report.json`, and `p4_requirements_docs.report.json`. This script never writes them; the orchestrator (MVP-4 fixer-loop) does.
- Minimum `p3_test_running.report.json`: `{ "status": "green|blocked|skip", "suites": [{ "name": "...", "status": "pass|fail|skip", "tests": 6 }] }`. `green` applies, or `skip` with `suites: []` when no tests apply.
- Rules: per-phase catalog, no phase jumps (>1) or rollbacks between phases, internal state order per the graph (forward jumps block; backward only documented rejection loops), F1 gates (content + `proposal_state: approve`) and F2 (`functional_state: approve`), green test evidence to enter `p3_requirements` or F4, req-fixer `green` reports in scope (`Task.app_map`; `""` = whole project, requires absent scope or `all`/`all`) for F3→F4 and `p4_done`, and non-empty `pr` for `p4_done`.
- With `requirements_fix==false`, require skipping `p3_requirements` and `p4_requirements_docs` (a destination to those states blocks) and do not require req-fixer reports; test evidence to enter F4 is still required.
