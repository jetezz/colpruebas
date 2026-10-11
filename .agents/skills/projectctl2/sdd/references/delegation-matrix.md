# SDD v2 delegation matrix

State → skill → agent → result detail. The orchestrator router shows only state → skill → agent; here the full expected result.

| State | SDD skill | OpenCode agent | Expected result |
|---|---|---|---|
| `p1_started` | None | Orchestrator | Initializes the task with `init.ts`; does not delegate index creation. |
| `p1_exploring` | `sdd-explore` | `sdd-explore` | Investigates code and external evidence; UI only when the problem requires it. Returns findings, sources, risks, and questions without modifying the project or drafting a proposal. Receives the current `Task.ui_url` (even `""`); opens no browser unless needed. Parallel instances allowed. |
| `p1_exploring` | `sdd-propose` | `sdd-propose` | Synthesizes problem, context, and exploration into `proposal.md`; returns `app_map`/`expected`/`criteria` suggestions without writing Task or recording acceptance. |
| `p1_awaiting_acceptance` | None | Human decision | The orchestrator presents the Spanish user-level summary from proposal operations only (`Problema encontrado` / `Solución propuesta` / `Criterios a añadir` / `Criterios a eliminar` / `Criterios a editar` / `¿Aceptas la propuesta?` closing line), then STOPs without invoking the question tool and waits for the free-text user reply; records `proposal_state: approve` with `update-task.ts` only after explicit user acceptance. Zero operations is a blocker with no advancement to Phase 2. |
| `p2_planning` | `sdd-spec` | `sdd-spec` | Persists verifiable specs in `spec.md` alongside `proposal.md`; reports discrepancies without modifying Task. |
| `p2_planning` | `sdd-design` | `sdd-design` | Documents technical decisions in `design.md` with evidence; reports pending items without modifying Task. |
| `p2_planning` | `sdd-tasks` | `sdd-tasks` | Persists the traceable breakdown in `tasks.md`; leaves complexity pending for the orchestrator; modifies no Task and implements nothing. |
| `p2_implementing` | `sdd-apply` | `sdd-apply-low` / `sdd-apply-medium` / `sdd-apply-high` by complexity | One delegation per TASK-ID in waves from pre-analysis; each agent implements only that task within the authorized scope and artifact paths. |
| `p2_code_review` | `sdd-verify` | `sdd-verify` | With `verification_type: code_review`; compares changes against proposal/specs/design/tasks and returns an explicit verdict. |
| `p2_awaiting_acceptance` | None | Human decision | The orchestrator presents the test route from the canonical Task (`ui_url` plus the `app_map` view/feature path) with no criteria structure, then STOPs without invoking the question tool and waits for the free-text user reply; records `functional_state: approve` only after explicit user validation. A missing route is reported as info/blocker context with the same STOP. |
| `p3_test_preparing` | `sdd-apply` | `sdd-apply-low` / `sdd-apply-medium` / `sdd-apply-high` by profile | With `apply_type: unit_tests` or `pwauto_tests`; creates or updates only assigned tests. |
| `p3_test_running` | `sdd-verify` | `sdd-verify` | With a single `verification_type` (`unit_tests`, `pwauto`, or `pwcli`); explicit scope per invocation; the orchestrator chooses parallel or serial. |
| `p3_requirements` | `requirements/fixer` | `req-fixer` | One delegation per state with `Task.app_map` scope and `only=criterios,estructura,code,test` (FORBIDDEN to touch `docs/app-map/**` in F3). 5-iteration budget internal to the fixer. A `green` report in scope allows advancing to Phase 4; `blocked` declares an SDD block. Touches no `sdd/task` (changes no `phase`/`state`); when `navigation.yaml`/slugs/IDs changed, only the orchestrator reconciles Task via `update-task.ts`. |
| `p4_documenting` | `sdd-apply` | `sdd-apply-low` / `sdd-apply-medium` / `sdd-apply-high` by profile | With `apply_type: documentation`; updates only assigned documentation. |
| `p4_requirements_docs` | `requirements/fixer` | `req-fixer` | One delegation per state with `Task.app_map` scope and `only=docs` + `test` re-check. 5-iteration budget internal to the fixer (independent of F3). A `green` report (`docs: pass + test: pass` in scope) allows delivery; `blocked` declares an SDD block. Touches no `sdd/task`; when `navigation.yaml`/slugs/IDs changed, only the orchestrator reconciles Task via `update-task.ts`. |
| `p4_done` | None | Orchestrator | Confirms closure after delivery; the PR is already recorded in Task. |

With `requirements_fix==false` (default), `p3_requirements` and `p4_requirements_docs` are skipped with no delegation; the flow is the legacy one.

By default, when a skill has a single intelligence level, the agent uses the same name as the skill. The three `sdd-apply-*` agents load the same skill; profile choice belongs to the orchestrator. `sdd-verify` covers `code_review`, `unit_tests`, `pwauto`, and `pwcli` with a single `verification_type` per delegation. When the required skill or agent is unavailable, claim no execution and substitute nothing silently.

## Engram — parallel non-gating step

- Engram is not a delegation and is not part of the expected result. It is a best-effort parallel post-result step, outside Task.
- `sdd-*` subagents write no Task and decide no phase/state; Engram likewise decides no phase/state/acceptance.
- Allowlist: reusable decision/convention/gotcha/bugfix. Denylist: do not mirror `taskReadme`/`proposal`/`spec`/`design`/`tasks.md` or routine results. In SDD artifacts always use `capture_prompt: false`, `scope: project`, `What/Why/Where/Learned`.
