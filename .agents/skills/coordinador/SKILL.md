---
name: coordinador
description: "Trigger: coordinator, orchestrator, SDD task flow. Track task state and route work through repo-local SDD agents."
metadata:
  id: coordinador
  version: 1.0.0
---

## Core role

- Read only the minimum task context needed.
- Keep the orchestrator context as small as possible: do not use the initial orchestrator for information discovery, task discovery, broad searches, or exploratory reading.
- Keep the active session/context optimized aggressively: the orchestrator should consume only the minimum task/artifact context needed to choose the next safe action and preserve the conversation thread.
- Use the repo-local SDD flow for execution work; the coordinator routes, it does not become the executor.
- Apply the **Normative repo-local SDD contract** below for persistence, bootstrap, skill resolution, state, simple-work routing, and write ownership.
- Legacy parallel SDD files may be read only as stale/contextual history. If they contradict the active `taskReadme`, `taskReadme` wins for current state and the task must move to `blocked` only when reconciliation is required before safe execution.
- Decide the next execution state from the evidence in the task file.
- Use only SDD sub-agents for delegated execution work.
- Let the orchestrator handle trivial inline `gh` / `git` work directly.
- When independent work items exist and safety permits, launch multiple SDD sub-agents in parallel instead of serializing unrelated discovery/implementation/verification/doc work.
- Keep task summaries short enough for easy resume.
- When additional context is needed, obtain it through sub-agents so the orchestrator stays thin and the conversation thread avoids context saturation/compression.

## Normative repo-local SDD contract

This is the single normative block for where SDD coordination data belongs. Other sections in this policy should reference it instead of restating it.

### Persistence and artifact ownership

- SDD execution mode is always `auto`.
- Persistence is mandatory **`taskReadme + Engram mirror`**.
- `taskReadme/<task_id>-<slug>.md` is the ONLY canonical operational + filesystem source of truth for execution status, phase content, evidence, branch/PR traceability, blockers, next step, handoff, and closure.
- Engram is the mandatory mirror/recovery/search backend for phase artifacts and cross-session recovery.
- Engram availability is a required SDD runtime prerequisite. `taskReadme` remains canonical if Engram is unavailable, but the workflow must record the mirror failure and must not close the task as `done` while required Engram mirrors are missing.
- Do not create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`; those paths are legacy/context only and never override the active `taskReadme`.
- This is a **repo-local SDD overlay inspired by OpenSpec/OpenCode**, not literal upstream OpenSpec filesystem compliance.

### Engram availability and degraded mode

- `sdd-init` must check and record Engram availability for the active task when bootstrapping or refreshing SDD context.
- The repo-local static preflight is `bun run sdd:doctor`; it validates portable SDD files, registry paths, local OpenCode runtime, and the static persistence contract.
- The Engram runtime preflight is `/sdd-doctor`; it must perform an actual memory write, search, and full retrieval. Static checks cannot prove Engram availability.
- Every SDD phase must update the active `taskReadme` first, then mirror the produced artifact to Engram with stable topic keys.
- If an Engram read/write fails, the phase must preserve the full artifact in `taskReadme`, record the exact mirror failure in the task, and return `blocked` unless the coordinator explicitly allows a non-closing degraded planning step.
- When Engram is unavailable, the task may continue only as far as its next safe non-closing degraded step: bootstrap, exploration, and planning may proceed only if the coordinator records the degradation explicitly; implementation, verification closure, `done`, and archive remain blocked until mirrors are restored or an explicit coordinator exception is recorded.
- A task must not advance to `done` or be archived until required mirrors are available or the coordinator records an explicit policy exception in the active `taskReadme`.
- Any explicit Engram exception must be written in the active `taskReadme` before continuing and include: timestamp, coordinator/agent identity, affected phase/artifact/topic, exact failure, allowed next non-closing step, risk accepted, and restoration condition. Exceptions are not blanket waivers and must not authorize `done` or archive unless they explicitly say so.
- Do not compensate for missing Engram by creating filesystem mirrors under `proposals/`, `specs/`, `designs/`, `tasks/`, or `openspec/`.

### First action and bootstrap

- The first coordinator action for new work is to create/bootstrap the canonical `taskReadme` if it is missing.
- A bootstrap `taskReadme` may start with only minimal identity fields: `title`, `task_id`, `task_slug`, `branch_name`, `status`, objective/summary, and next step.
- Missing proposal/spec/design/task breakdown details in that initial bootstrap is not a problem by itself; later SDD phases progressively complete the relevant sections before execution/verification depends on them.
- The minimal bootstrap write is an explicit inline coordinator exception to the normal no-execution rule. It is limited to creating the canonical task shell; discovery, planning content, implementation, verification, and documentation still belong to SDD sub-agents.

### Skill boundary and path resolution

- Treat `.atl/skill-registry.md` as the source for skill boundary and path resolution before delegation.
- Prefer passing exact `SKILL.md` paths from `.atl/skill-registry.md` under `## Skills to load before work`.
- Do not inject generated summaries as the primary mechanism for project policy. The coordinator may include minimal reminders, but the canonical mechanism is passing exact paths for the sub-agent to read.
- If `.atl/skill-registry.md` is missing or stale, use the installed skill paths already known in the session and surface the registry issue as a follow-up or blocker when it affects safe routing.

### Safe-write protocol for the active taskReadme

- Before any write, the writer re-reads the active `taskReadme` and verifies the current state/section still matches its assumptions.
- Patch only the section(s) the agent owns for that phase; do not rewrite the whole file unless exclusive ownership for the full file is explicitly declared by the coordinator.
- Serialize writes to the same section. Parallel agents may run only when they own disjoint sections or one returns an intended patch/evidence for the coordinator to apply.
- If a section changed unexpectedly, stop and return `blocked` with the intended patch, evidence, and the conflicting section/state.
- Every phase returns the exact taskReadme section(s) touched, evidence added, Engram mirror key(s), and any unresolved conflict/blocker.

### Simple work routing

- If a change is too simple for the full planning pipeline, still use SDD sub-agents and only the strictly necessary ones.
- Most simple changes should go directly to the appropriate `sdd-apply-*` lane (determined by `apply_lane` in the work unit) and then the strictly necessary verification lane(s) after the minimal taskReadme bootstrap.
- Treat work as simple only when the coordinator can state all of these from the user request plus existing task context: one bounded objective, no unresolved product/architecture decision, no DB or security contract change, no multi-surface dependency ordering, no broad codebase discovery needed, and a verification path that is obvious from the touched surface. If any criterion is unclear, route to the next planning phase instead of skipping.
- Never route execution to non-SDD agents. If no allowed SDD sub-agent can own the work safely, mark the task `blocked` with the concrete reason.

### Command authority matrix

Tool permission is not command authorization. Every SDD delegation must state the phase-local command authority, forbidden categories, escalation owner, owned `taskReadme` section, and Engram topic. If a needed command is not clearly phase-authorized, the phase must not run it; it reports the required owner or blocker instead.

| Command category | Owner | Allowed phase(s) | Forbidden / escalation |
| --- | --- | --- | --- |
| File reads/search and file edits | Assigned SDD phase | Only for files/sections explicitly needed by the phase and allowed scope | Outside ownership blocks or returns an intended patch/evidence |
| `sdd-apply-code` — product source/runtime/config | `sdd-apply-code` lane | Edits to owned product source, runtime, config, schema migrations; reads for SDD context | Docs, test files, Git/GitHub, broad test suites, browser, Docker/runtime ops |
| `sdd-apply-doc` — documentation only | `sdd-apply-doc` lane | Edits to owned docs, quality views, `quality-status.md`, `quality-plan.md`; reads for SDD context | Product code, test files, any test execution, Git/GitHub, browser, Docker/runtime ops |
| `sdd-apply-unit-tests` — unit-test file creation | `sdd-apply-unit-tests` lane | Writes/creates unit-test files under `**/*.test.ts`, `**/*.spec.ts`; reads for SDD context | Product code, PW-AUTO specs, docs, Git/GitHub, browser runtime ops, broad test execution |
| `sdd-apply-pwauto-tests` — Playwright spec creation | `sdd-apply-pwauto-tests` lane | Writes/creates Playwright specs under `playwright/tests/`, `playwright/TEST_PLAN.md`; reads for SDD context | Product code, unit-test files, docs, Git/GitHub, browser runtime ops, E2E execution |
| Engram read/write mirror | Assigned SDD phase | Required for owned phase artifact/topic after updating `taskReadme` | Missing mirror blocks closing work; never create filesystem mirror substitutes |
| Git/GitHub lifecycle (`git`, `gh`) | Coordinator inline only when mechanical | `ready_for_branch`, `branching`, `pushing` lifecycle steps | SDD phase agents report needed coordinator action; non-mechanical repo state blocks |
| Package manager/tests (`bun`, `bun test`) | Verification/init by explicit scope | `sdd-init` static preflight exception; `sdd-verify-units` relevant package-local unit tests | Apply/planning/archive report verification needed; broad suites/builds require explicit owner/scope |
| Builds | Explicit coordinator-approved verification only | Only when the task requires build evidence | Do not add build steps by default; other phases report risk/need |
| Python/ad hoc scripts | No default SDD phase owner | Only if explicitly authorized by task + phase policy | Otherwise forbidden; use file tools or report blocker |
| Docker/runtime/projectctl | Runtime owner or coordinator-approved ops lane | Browser runtime preflight may resolve trusted context; ops work follows runtime policy | Other phases do not invent or run runtime control commands |
| Browser manual validation (`playwright-cli`) | `sdd-explore-pwcli` / `sdd-verify-pwcli` | Only after trusted browser runtime preflight when browser work is assigned | Other phases report needed browser lane |
| Persistent Playwright | `sdd-verify-pwauto` | Mapped persistent E2E coverage/suites after trusted runtime preflight | Other phases do not run persistent browser suites |
| External docs / Context7 | `sdd-explore-research` or phase with explicit research need | Research-only evidence for the assigned phase | Do not turn implementation/verification into broad research |
| Supabase/database operations | Supabase/data owner under `supabase-data-policy` | Only when the assigned phase owns SQL/data persistence work | Unowned DB changes or prod operations block |
| Delivery-surface risk reporting | Any editing phase | Report known touched-path risks from allowed context; classify as `force-add required`, `exclude from commit`, or `policy review required` | Do not stage, commit, push, inspect broad branch state, or manage PRs; if stageability requires Git, ask coordinator for mechanical check |

## Normative sources to inject or consult

- `.atl/skill-registry.md` — primary skill boundary/path index for delegation
- `docs/04-process/task.md` — task lifecycle and structure
- `docs/04-process/development.md` — branch naming, validation defaults, local conventions
- `docs/01-product/quality-plan.md` — canonical testing vocabulary and criteria
- `docs/01-product/quality-status.md` — quality summary only
- `docs/01-product/quality/views/**` — quality detail canon
- `docs/00-context/agents_skills.md` — current skill boundaries and layering
- `.agents/skills/engram-policy/SKILL.md` — local memory/persistence overlay

## Never do directly

- Do not invent requirements, task steps, or hidden subtasks.
- Do not implement product code.
- Do not write or debug tests yourself.
- Do not write or restructure docs yourself.
- Do not perform inline search, codebase exploration, task discovery, or broad context gathering in the orchestrator.
- Do not perform inline code reading for understanding beyond minimal task/artifact existence checks and the smallest targeted resume reads needed to route the next step.
- Do not run non-trivial execution, validation, or documentation work inline when an allowed SDD sub-agent can do it instead.
- Do not bypass the task file as the execution record.
- Do not reference removed project-specific sub-agents in the workflow.

## Allowed delegated sub-agents

Use only these SDD sub-agents from this skill:

- `sdd-init`
- `sdd-explore`
- `sdd-explore-code`
- `sdd-explore-research`
- `sdd-explore-pwcli`
- `sdd-browser-runtime-context`
- `sdd-propose`
- `sdd-spec`
- `sdd-design`
- `sdd-tasks`
- `sdd-apply-code`
- `sdd-apply-doc`
- `sdd-apply-unit-tests`
- `sdd-apply-pwauto-tests`
- `sdd-verify-code`
- `sdd-verify-units`
- `sdd-verify-pwauto`
- `sdd-verify-pwcli`
- `sdd-archive`
- `sdd-onboard`

Rules:

- Do not delegate to `implement-task`, `testing-policy`, `docs-governance`, `gh-specialist`, or other non-SDD execution agents from this coordinator policy.
- The orchestrator may stay inline only for trivial, mechanical `gh` / `git` actions; it must never stay inline for search, discovery, analysis, or context gathering.
- The orchestrator may stay inline only for trivial synthesis, minimal task/artifact existence reads, and safe/mechanical `git` / `gh` state work.
- Searches, exploration, code reading for understanding, implementation, non-trivial commands, validation, and documentation must be delegated to allowed SDD sub-agents whenever possible.
- If search/discovery/context/execution work cannot be expressed through the allowed SDD sub-agents, move the task to `blocked` with a concrete reason instead of inflating the orchestrator context or routing to non-SDD agents.
- Before delegating, check whether independent subtasks can be launched in parallel safely; if yes, prefer parallel launches with clearly bounded scopes and merge their results inline only at synthesis time.
- Use `sdd-init` only when the SDD context is genuinely missing or not bootstrapped for the active task. Do not launch `sdd-init` when an executable change already exists.
- For brand-new work, first derive the canonical task name from `task_id = YYYYMMDD-<shortid>` plus a kebab-case `<slug>`, then create/bootstrap `taskReadme/<task_id>-<slug>.md` under the Normative repo-local SDD contract before launching any SDD sub-agent.
- Use `sdd-explore-code`, `sdd-explore-research`, or `sdd-explore-pwcli` whenever the task is still in planning and the next required evidence is exploration; keep `sdd-explore` only as a legacy compatibility wrapper/router, and use `sdd-propose`, `sdd-spec`, `sdd-design`, and `sdd-tasks` when their sections are missing, stale, or unapproved.
- Use `sdd-onboard` only for explicit onboarding or guided SDD walkthrough requests; it is not a normal task state.
- When launching any SDD phase, pass the exact resolved skill path(s) from `.atl/skill-registry.md` and include only compact reminders from the Normative repo-local SDD contract.

`docs-governance` and `testing-policy` may still exist as helper skills in the repo, but they are **not** part of the coordinator delegation map.

## Mandatory project-rule injection

- The generic SDD skills remain portable. This coordinator hardens every SDD delegation with repo-local paths and compact reminders from the Normative repo-local SDD contract.
- Resolve skill boundaries from `.atl/skill-registry.md` first and pass exact matching `SKILL.md` path(s) to the sub-agent.
- Keep injected prompts compact: include task path, current state, goal, allowed scope, done condition, exact skill path(s), and only the repo rules needed for that surface.
- Do not use generated registry summaries as the primary policy mechanism; paths are primary, reminders are secondary.
- Every launch of `sdd-init`, `sdd-explore`, `sdd-explore-code`, `sdd-explore-research`, `sdd-explore-pwcli`, `sdd-browser-runtime-context`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply-code`, `sdd-apply-doc`, `sdd-apply-unit-tests`, `sdd-apply-pwauto-tests`, `sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwauto`, `sdd-verify-pwcli`, `sdd-archive`, or `sdd-onboard` must include the safe-write expectations for the active taskReadme.

### Required injected block template

Use a block equivalent to this in every SDD execution delegation:

```md
## Skills to load before work
- Read these exact skill files before reading, writing, reviewing, testing, or creating artifacts:
  - `.agents/skills/<skill-name>/SKILL.md`

## Command Authority
- Tool permission is not command authorization: run only commands allowed by the coordinator command-authority matrix for this phase.
- Allowed command categories: `<phase-local categories>`.
- Forbidden command categories: `<out-of-phase examples>`.
- Escalate/block instead of running out-of-authority commands: `<coordinator/lane owner>`.
- Owned taskReadme section(s): `<section>`; Engram topic(s): `<topic>`.

## Project Rules (mandatory)
- SDD execution mode is `auto`.
- Repo-local persistence contract is `taskReadme + Engram mirror`.
- Treat the active `taskReadme` as the ONLY canonical operational + filesystem source of truth for execution, evidence, and next state. This is mandatory and non-negotiable.
- Do NOT create or update parallel filesystem SDD artifacts under `proposals/`, `specs/`, `designs/`, or `tasks/`; write phase content into the active `taskReadme` and mirror to Engram.
- Use Engram as a mandatory mirror/recovery/search backend throughout the workflow.
- If Engram is unavailable or a mirror write fails, preserve the artifact in `taskReadme`, record the exact mirror failure, and return `blocked` unless this is an explicitly allowed non-closing degraded planning step.
- Static SDD portability is checked with `bun run sdd:doctor`; Engram runtime availability is checked with `/sdd-doctor` and requires memory write, search, and full retrieval.
- Do not move a task to `done` while required Engram mirrors are missing, unless the coordinator records an explicit policy exception.
- This is a repo-local SDD overlay inspired by OpenSpec/OpenCode, NOT literal upstream OpenSpec filesystem compliance.
- If this is new work, the first action is creating/bootstrapping the active `taskReadme`; minimal identity fields are enough at bootstrap.
- Use the next strictly necessary SDD phase from the active `taskReadme` state; simple changes normally go straight to the appropriate `sdd-apply-*` lane (determined by `apply_lane` in the work unit) and then the strictly necessary verification lane(s).
- Only use these task states: pending, planning, ready_for_branch, branching, implementing, pushing, testing, documenting, done, blocked, failed. Read `verified` only as legacy input and normalize it to `done`.
- Never invent non-supported states such as `tdd_writing`, `db_migrating`, `pushing_docs`, or `pr`.
- Successful execution must end in `done`.
- Use `task_id = YYYYMMDD-<shortid>` and a kebab-case `<slug>` to derive the canonical task path `taskReadme/<task_id>-<slug>.md`.
- Use one branch per task with the exact naming convention `feature/<task_id>-<slug>`.
- Final PR target is always `develop`.
- Prefer tests and browser validation; do not add build steps by default for this project.
- If the task affects browser-facing functionality, validation must include `playwright-cli` and the credentials contract from `/.env.example.e2e`.
- If legacy SDD artifacts contradict `taskReadme`, never let them override `taskReadme`; stop and report `blocked` only when reconciliation is required before safe execution.
- Safe-write the taskReadme: re-read before writing, patch only owned sections, never whole-file rewrite unless exclusive ownership is declared, serialize same-section writes, and return intended patch/evidence on conflict.
```

## Execution mode: SDD-only routing

- Prefer the next strictly necessary SDD phase whenever execution can continue from the active `taskReadme` plus Engram mirror.
- When the task is in planning and planning is actually needed, use the next missing SDD phase instead of skipping ahead.
- When development is very simple and does not need full planning, still launch SDD sub-agents and only the necessary ones; most simple changes go directly to the appropriate `sdd-apply-*` lane and the strictly necessary verification lane(s).
- Treat the orchestrator as a router, not an executor. Execution, validation, and documentation work stay inside allowed SDD phases.
- There is no non-SDD execution fallback. If no allowed SDD sub-agent can own the needed work safely, move the task to `blocked` with a concrete reason.
- SDD-only routing does **not** remove the need for a task file; the task remains the operational source of truth from the first bootstrap action.

## Task truth policy

- The active `taskReadme` file is the only execution artifact and canonical repo-local filesystem bundle for coordinated SDD work.
- Read the frontmatter first, then the execution sections (`TDD Tests`, validation notes, branch info, docs impact, blockers).
- Read only the smallest subset of task/body sections needed to choose or resume the next step; deeper understanding work belongs to sub-agents.
- Trust the `taskReadme` before chat history.
- The coordinator may only use states allowed by the current product/frontend/backend contract.

### Required task structure for this project

- The task must be detailed enough to resume work without depending on chat history.
- Exception: a just-created bootstrap taskReadme may contain only the minimal identity fields from the Normative repo-local SDD contract. Treat missing planning details as normal until a later phase needs them for safe execution.
- Use the template in `assets/task-template.md` as the canonical task structure.
- Use the examples in `examples/task-browser-feature.md` and `examples/task-non-browser-change.md` as reference implementations.
- The task must include, at minimum:
  - SDD change linkage when applicable (`task_slug`, `sdd_change_id`, Engram mirror topic keys, and taskReadme section references)
  - exploration summary
  - proposal summary
  - specs / delta requirements summary
  - design decisions summary
  - implementation task breakdown / progress
  - verification summary
  - archive / closure summary when applicable
  - objective
  - operational context
  - affected route / entrypoint
  - affected components
  - backend impact
  - acceptance criteria
  - tasks to perform
  - planned/modified files
  - Playwright CLI result
  - persistent verification result
  - Docker/runtime result
  - problems found
  - git branch
  - PR URL
  - documentation updated
  - current status, next step, and short handoff summary
- The frontmatter is the coordinator-facing index; the body is the human + execution evidence record.
- If any of these sections are missing for a task that needs them beyond initial bootstrap, the coordinator should launch the next necessary SDD phase or block/request enrichment before continuing.

### Mandatory task naming convention

- `task_id` must be a date plus short identifier: `YYYYMMDD-<shortid>`.
- `YYYYMMDD` is the task creation date in local repo time.
- `<shortid>` must be lowercase alphanumeric, 4-8 characters, and unique enough to avoid same-day collisions.
- `<slug>` must be kebab-case, derived from the task title or objective, and must not repeat the date/id.
- The canonical operational name is `<task_id>-<slug>`.
- The canonical task file must be `taskReadme/<task_id>-<slug>.md`.
- `branch_name` must be `feature/<task_id>-<slug>`.
- Example: `task_id: "20260515-a7f3c2"`, file `taskReadme/20260515-a7f3c2-normalize-task-readme-naming.md`, branch `feature/20260515-a7f3c2-normalize-task-readme-naming`.
- Do not create new tasks with descriptive-only IDs such as `task-rename-project`; those are legacy inputs only and should be normalized when a task is recreated or renamed intentionally.

### Task validation checklist

Before continuing execution, validate the task against this checklist:

#### 1. Identity & traceability

- [ ] `title` clearly describes the change
- [ ] `task_id` exists and follows `YYYYMMDD-<shortid>`
- [ ] `task_slug` exists or the slug is derivable from the canonical task filename
- [ ] canonical task file follows `taskReadme/<task_id>-<slug>.md`
- [ ] `status` is one of the supported states
- [ ] `branch_name` follows `feature/<task_id>-<slug>`
- [ ] `source_branch` and `target_branch` are defined

#### 2. Execution readiness

- [ ] objective explains the expected result
- [ ] operational context explains why the task exists now
- [ ] when SDD applies, the task identifies the active change and references the canonical `taskReadme` sections plus Engram mirror topic keys
- [ ] affected route / entrypoint is present when relevant
- [ ] affected components are named explicitly
- [ ] acceptance criteria are concrete and testable
- [ ] tasks to perform are broken into actionable units
- [ ] planned/modified files are listed

#### 3. Validation readiness

- [ ] backend impact is documented
- [ ] browser validation is explicitly marked as `required` or `not_required`
- [ ] docker/runtime validation is explicitly marked as `required` or `not_required`
- [ ] browser-facing tasks define the route or flow to validate
- [ ] browser-facing tasks leave room for Playwright CLI evidence

#### 4. Delivery readiness

- [ ] git branch is recorded or derivable
- [ ] PR URL field exists even if still empty
- [ ] documentation impact is recorded
- [ ] current status, next step, and short handoff summary exist
- [ ] problems found section exists, even if it says none

#### Blocking rule

- If identity or execution-readiness items are missing, block the task before delegating.
- Bootstrap exception: if the canonical taskReadme has just been created with minimal identity fields, missing readiness details should route to the next necessary SDD phase, not be treated as a contradiction.
- If validation-readiness items are missing for a browser-facing change, block before `sdd-verify-pwcli` or `sdd-verify-pwauto`.
- If delivery-readiness items are missing near the end of the flow, request enrichment before closing in `done`.
- If the task cannot be resumed from `taskReadme` sections + Engram mirror without relying on chat history, block it for enrichment before continuing.

## State model

Allowed task states for this project:

- `pending`
- `planning`
- `ready_for_branch`
- `branching`
- `implementing`
- `pushing`
- `testing`
- `documenting`
- `done`
- `blocked`
- `failed`

Legacy read aliases only:

- `phase1_generating` -> `planning`
- `phase2_branching` -> `branching`
- `phase3_implementing` -> `implementing`
- `phase4_pushing` -> `pushing`
- `completed` -> `done`
- `paused` -> `blocked`
- `verified` -> `done`

Canonical execution flow:

```text
pending -> planning -> ready_for_branch -> branching -> implementing -> pushing -> testing -> documenting -> done
```

Interruptions:

- `blocked`
- `failed`

State rules:

- Do not introduce non-supported states such as `tdd_writing`, `db_migrating`, `pushing_docs`, or `pr` into task files.
- `verified` may be read if it already exists, but the coordinator should normalize it to `done` and never target `verified` as the next state.
- If a task is still in `pending` or `planning`, only continue when the task already contains enough execution detail. Otherwise block and send it back for planning/orchestration.
- The coordinator must always finish successful execution in `done`.

## Delegation map

### Compact phase control model

| Normalized state | Preconditions to continue | Action | Advance / skip rule | Blocked condition |
| --- | --- | --- | --- | --- |
| `pending`, `planning` | task exists and can be resumed from `taskReadme + Engram mirror` | choose the next necessary SDD phase section, or the appropriate `sdd-apply-*` lane for very simple executable work | only advance to `ready_for_branch` when needed planning sections are consistent; simple work may skip unused planning phases and go to apply/verify | phase gap unclear, missing resume context, or unresolved contradiction with legacy artifacts |
| `ready_for_branch`, `branching` | executable task exists and branch metadata is present or derivable | do inline mechanical `git` / `gh` work only | if branch/PR is already ready, move to `implementing` without replaying planning | repo/remote ambiguity or missing branch traceability |
| `implementing` | code work unit with `apply_lane: code` is ready | launch `sdd-apply-code` for the assigned unit(s) | skip to next unfinished work unit; never restart completed units; consolidate progress after results return | task contradicts approved SDD sections, implementation scope is incomplete, or work-unit boundaries/dependencies are unsafe |
| `implementing` | doc work unit with `apply_lane: doc` is ready | launch `sdd-apply-doc` for the assigned unit(s) | skip to next unfinished work unit; consolidate progress after results return | docs scope unclear, quality/app-map governance impact unresolved, or documentation would require broad inline research |
| `implementing` | unit-test work unit with `apply_lane: unit-tests` is ready | launch `sdd-apply-unit-tests` for the assigned unit(s) | skip to next unfinished work unit; consolidate progress after results return | test file scope is ambiguous or dependencies are unsafe |
| `implementing` | pwauto-test work unit with `apply_lane: pwauto-tests` is ready | launch `sdd-apply-pwauto-tests` for the assigned unit(s) | skip to next unfinished work unit; consolidate progress after results return | spec file scope is ambiguous or dependencies are unsafe |
| `pushing` | implementation evidence is complete and branch metadata is present or derivable | do inline mechanical `git` / `gh` push or PR bookkeeping only | after push/PR traceability is recorded, advance to `testing` unless the task has documented docs work that must run first | repo/remote ambiguity, unreviewed delivery risks, missing branch traceability, or non-mechanical git decision needed |
| `documenting` | docs impact is explicit and the concrete docs work is part of implementation scope | launch `sdd-apply-doc` only for the bounded docs update work unit(s), or skip when docs impact is `not_required` | after docs evidence is recorded, advance to the next allowed delivery state, normally `testing` or `done` after verification consolidation | docs scope unclear, quality/app-map governance impact unresolved, or documentation would require broad inline research |
| `testing` | apply evidence exists and validation scope is clear | launch required verification lanes: `sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwauto`, `sdd-verify-pwcli` | after all required lanes pass, consolidate and continue with the next allowed delivery state instead of inventing `verified` | missing validation contract, missing required lane evidence, browser evidence when required, or failing checks |
| `done` | task is already successfully closed | optionally launch `sdd-archive` for formal closure | skip archive when closure is not explicitly requested | closure summary or lineage cannot be reconciled |
| `blocked`, `failed` | blocker/failure evidence exists | re-evaluate the concrete blocker and relaunch only the needed phase | never rewind unrelated completed phases | blocker reason is missing or evidence is inconsistent |

- `pending` / `planning` -> choose the next necessary SDD phase from the dependency chain recorded in `taskReadme`: `sdd-init` when bootstrap/testing context is missing; `sdd-explore-code`, `sdd-explore-research`, or `sdd-explore-pwcli` when the change is still being investigated; keep `sdd-explore` only as a legacy compatibility wrapper/router; use `sdd-propose` when no approved proposal section exists and proposal is needed; `sdd-spec` and/or `sdd-design` when requirements/approach sections are needed; `sdd-tasks` when executable work breakdown is needed. For very simple executable changes, use the appropriate `sdd-apply-*` lane directly after minimal bootstrap (determined by `apply_lane` in the work unit) and then the strictly necessary verification lane(s).
- For independent planning gaps, the coordinator may launch compatible planning phases in parallel only when prerequisites are already satisfied and outputs do not race on the same `taskReadme` section.
- `ready_for_branch` / `branching` -> orchestrator inline `gh` / `git` only
- `implementing` -> select the next safe apply work unit/batch from `## 10. Desglose de implementación / progreso SDD`, read the unit's `apply_lane` field, then launch the matching `sdd-apply-code`, `sdd-apply-doc`, `sdd-apply-unit-tests`, or `sdd-apply-pwauto-tests` with only that assigned scope
- `pushing` -> orchestrator inline mechanical `git` / `gh` push or PR bookkeeping only; if non-mechanical, block instead of delegating to a removed git specialist
- `documenting` -> bounded documentation work goes through `sdd-apply-doc` only when docs impact is real and explicit; otherwise record `not_required` and skip
- `testing` -> required verification lane(s): `sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwauto`, `sdd-verify-pwcli`
- `done` -> `sdd-archive` only when the orchestrator is explicitly closing the SDD change
- `blocked` / `failed` -> return control to the orchestrator; relaunch the appropriate SDD phase only after the blocker is understood

### Non-state delegation

- explicit onboarding / guided walkthrough request -> `sdd-onboard`
- browser runtime/base URL resolution for browser exploration or browser verification lanes -> `sdd-browser-runtime-context`

## Phase-specific hardening rules

### `sdd-explore` lanes / `sdd-propose` / `sdd-spec` / `sdd-design` / `sdd-tasks`

The coordinator must inject these instructions when launching any planning-phase SDD agent:

- Sequence strictly from `taskReadme` state plus SDD section dependency gaps; do not skip missing prerequisites.
- Route exploration by evidence needed: `sdd-explore-code` for repo/code understanding, `sdd-explore-research` for external/Context7 research, and `sdd-explore-pwcli` for browser exploration with `playwright-cli`.
- Treat `sdd-explore` as a compatibility wrapper only; do not use it as the preferred lane when one of the explicit explore lanes matches the need.
- Do not introduce new global task states for explore lanes; lane choice is internal routing only and the task state stays within the supported model.
- `sdd-explore-pwcli` must resolve browser runtime context through `sdd-browser-runtime-context` before any browser work; if runtime kind/base URL cannot be resolved, stop with `blocked` instead of inventing commands or URLs.
- If the change is new and no canonical `taskReadme/<task_id>-<slug>.md` exists yet, the coordinator must bootstrap it first with minimal identity fields; do not launch any SDD phase into a missing first artifact path.
- Keep `taskReadme` as the only canonical operational + filesystem record for the phase output.
- Update the corresponding `taskReadme` SDD section for every planning phase output, then mirror the same content to Engram.
- Follow the safe-write protocol from the Normative repo-local SDD contract.
- Do not create or update `proposals/`, `specs/`, `designs/`, or `tasks/` files as SDD phase outputs.
- Do not create `openspec` artifacts as part of the coordinated path, and do not call this repo-local contract literal upstream OpenSpec compliance.
- If legacy context contradicts the active task and blocks safe execution, stop and report `blocked` for reconciliation instead of papering over it.

### `sdd-browser-runtime-context`

The coordinator must inject these instructions when launching `sdd-browser-runtime-context`:

- Use it only as a preflight for browser exploration (`sdd-explore-pwcli`) or browser verification lanes (`sdd-verify-pwcli`, `sdd-verify-pwauto`) when runtime/browser context is required.
- Do not run it as a universal prerequisite for non-browser planning, apply, or verification work.
- Pass the caller lane identity explicitly so the preflight can keep lane-scoped ownership and persistence.
- Resolve and return `required`, `runtimeKind`, `resolutionSource`, `baseUrl`, allowed runtime commands, evidence, and blocker state for the current task/runtime.
- For managed projects, the supported runtime path is `projectctl`; never authorize Docker raw inside sandbox.
- If runtime resolution is `unknown`, return `blocked` and preserve the evidence instead of guessing a `BASE_URL`, compose command, or ownership model.
- Write only the caller-scoped preflight subsection and its matching Engram mirror, using these lane-specific ownership pairs:
  - `sdd-explore-pwcli` → `## 4. Resumen de exploración > ### Browser runtime preflight (PW-CLI)` + `sdd/{change-name}/browser-runtime-context-explore-pwcli`
  - `sdd-verify-pwcli` → `## 15. Resumen de verificación SDD > ### Browser runtime preflight (PW-CLI)` + `sdd/{change-name}/browser-runtime-context-verify-pwcli`
  - `sdd-verify-pwauto` → `## 15. Resumen de verificación SDD > ### Browser runtime preflight (PW-AUTO)` + `sdd/{change-name}/browser-runtime-context-verify-pwauto`
- Require the requesting browser lane to consume that persisted preflight artifact as its runtime source of truth and then write its own lane result separately, so runtime evidence is not lost if the browser lane blocks or fails later.

### `sdd-apply-code`

The coordinator must inject these instructions when launching `sdd-apply-code`:

- Respect the task as the execution record and update evidence back into the task-facing workflow.
- Treat `sdd-apply-code` as a bounded executor for product source, runtime, config, and schema migrations only; it does not handle docs, unit tests, or PW-AUTO specs.
- Assign either one explicit code work unit, a small serial batch, or a consciously simple full scope.
- Do not launch monolithic apply for large changes when `## 10. Desglose de implementación / progreso SDD` can be segmented into coherent work units.
- If the implementation breakdown is too broad, missing owned files, missing dependencies, or missing parallel-safety data, route back to `sdd-tasks` for enrichment before apply.
- Apply work units are internal implementation units, not global task states. They may use unit statuses such as `pending`, `in_progress`, `done`, `blocked`, and `failed` inside `## 10`, but the task frontmatter must keep only supported project states.
- The coordinator owns apply scheduling: it selects eligible units from `## 10`, decides serial vs parallel execution, and passes only the assigned unit IDs and allowed file/section scope to each `sdd-apply-code` launch.
- Safe parallel apply requires all of these to be true: no dependency between the units, disjoint owned files, disjoint taskReadme subsections/rows, distinct Engram topic keys, no shared migration/order-sensitive runtime contract, and no expected conflict group overlap.
- If any safety condition is unclear, serialize the units or block for breakdown enrichment; never parallelize by optimism.
- Each apply launch must write only its owned unit row/subsection plus its unit evidence and mirror to a unit-specific Engram topic such as `sdd/{change-name}/apply-code-{unit-id}`.
- Only the coordinator consolidates aggregate apply progress after reading unit results: `Progreso actual`, `Último apply summary`, and aggregate `sdd/{change-name}/apply-progress`.
- Do not introduce unsupported task states.
- Do not add build commands just because the generic SDD skill can detect them.
- Update the implementation breakdown / progress section in `taskReadme` and mirror apply/task progress to Engram.
- Follow the safe-write protocol from the Normative repo-local SDD contract.
- Preserve branch/PR metadata needed by the orchestrator to continue the task lifecycle.
- Require the sub-agent to surface any gitignored, non-stageable, or otherwise out-of-commit-surface file impacts as delivery risk, with exact paths and whether each one needs force-add, commit exclusion, or policy review.

### `sdd-apply-doc`

The coordinator must inject these instructions when launching `sdd-apply-doc`:

- Execute documentation-only implementation scoped to `docs/`, quality views, `quality-status.md`, and `quality-plan.md`.
- `sdd-apply-doc` does not modify product code, test files, or runtime configurations.
- Assign either one explicit doc work unit or a small serial batch; do not mix doc and code ownership in the same launch.
- Write only to the doc-owned row in `## 10. Desglose de implementación / progreso SDD` and mirror to `sdd/{change-name}/apply-doc-{unit-id}`.

### `sdd-apply-unit-tests`

The coordinator must inject these instructions when launching `sdd-apply-unit-tests`:

- Create or update unit-test files under `**/*.test.ts` and `**/*.spec.ts` only; do not modify product code, PW-AUTO specs, or docs.
- In Strict TDD mode (`tdd_mode: strict` on the work unit), write RED failing tests before `sdd-apply-code` runs GREEN on the same unit.
- Write only to the unit-test-owned row in `## 10. Desglose de implementación / progreso SDD` and mirror to `sdd/{change-name}/apply-unit-tests-{unit-id}`.
- Do not run broad test suites; narrow unit-test re-use during TRIANGULATE is permitted within this lane.

### `sdd-apply-pwauto-tests`

The coordinator must inject these instructions when launching `sdd-apply-pwauto-tests`:

- Create or update Playwright E2E specs under `playwright/tests/` and `playwright/TEST_PLAN.md` only; do not modify product code, unit-test files, or docs.
- Write only to the pwauto-test-owned row in `## 10. Desglose de implementación / progreso SDD` and mirror to `sdd/{change-name}/apply-pwauto-tests-{unit-id}`.
- Do not run E2E execution; full suite execution belongs exclusively to `sdd-verify-pwauto`.

#### Apply work-unit scheduling model

The coordinator should treat `## 10. Desglose de implementación / progreso SDD` as the apply scheduling table. A task may stay simple, but large changes must be divided into bounded work units before apply.

Required fields for each apply work unit when segmentation is needed:

- `Unit`: stable short ID, e.g. `A`, `B`, `api-1`, `docs-1`.
- `Estado`: `pending`, `in_progress`, `done`, `blocked`, or `failed` for that unit only.
- `Objetivo`: concrete implementation goal.
- `Archivos owned`: exact files or narrow globs the unit may modify.
- `Depende de`: other unit IDs or `none`.
- `Conflict group`: shared resource label such as `api-routes`, `db-migration`, `frontend-store`, `docs`, or `none`.
- `Modo`: `serial`, `parallel-safe`, or `coordinator-only`.
- `Engram topic`: unit-specific topic, normally `sdd/{change-name}/apply-{lane}-{unit-id}`.

Scheduling rules:

- Launch a single unit when only one unit is ready, when dependency order matters, or when files/conflict groups overlap.
- Launch a small serial batch when adjacent units are tightly related and fit in one bounded context without crossing ownership boundaries.
- Launch parallel `sdd-apply-code`, `sdd-apply-doc`, `sdd-apply-unit-tests`, or `sdd-apply-pwauto-tests` agents only for ready units marked `parallel-safe` whose owned files and conflict groups are disjoint.
- Do not assign tests-only verification work to apply lanes; verification lanes own verification. `sdd-apply-code` may run narrow implementation-local checks (type-check, lint on owned files only) when explicitly authorized; `sdd-apply-doc` handles docs scope only.
- After parallel apply returns, the coordinator must reconcile results before launching verification or the next apply batch. If two agents report conflicting edits or taskReadme conflicts, move to `blocked` with the evidence.

### `sdd-init`

The coordinator must inject these instructions when launching `sdd-init`:

- Use `sdd-init` only to bootstrap missing SDD context for the active task, never to rediscover an already active executable change.
- Respect the active `taskReadme` as the only operational source of truth from the first step.
- Use SDD mode `auto`, repo-local persistence `taskReadme + Engram mirror`, and Engram for persistent memory capture.
- Seed or refresh the `taskReadme` SDD linkage / bootstrap sections when a task file exists.
- Follow the safe-write protocol from the Normative repo-local SDD contract.
- Return enough bootstrap detail for later phases to resume from the `taskReadme` without depending on chat history.

### Verification lanes

The monolithic `sdd-verify` phase is removed from the normal workflow. The coordinator must launch one or more specialized verification lanes and then consolidate their results inline from the lane envelopes and task evidence.

Allowed verification lanes:

- `sdd-verify-code` — code review, technical debt, duplication, deprecated APIs, hierarchy/design/skill compliance.
- `sdd-verify-units` — task-related unit test verification (execute `bun test`); run/review/report-only; routes missing coverage to `sdd-apply-unit-tests`.
- `sdd-verify-pwauto` — task-related persistent Playwright E2E verification (execute `bunx playwright test`); run/review/report-only; routes missing coverage to `sdd-apply-pwauto-tests`.
- `sdd-verify-pwcli` — browser validation with `playwright-cli`, UI/UX behavior, screenshots/snapshots, and visible runtime issues.

Lane selection rules:

- Launch `sdd-verify-code` for any task that changes product code, runtime code, policy-bearing skills, or architecture-sensitive docs.
- Launch `sdd-verify-units` when changed behavior has meaningful unit-testable logic or when `TDD Tests` / acceptance criteria identify unit coverage.
- Launch `sdd-verify-pwauto` when the task maps to persistent Playwright coverage in `playwright/TEST_PLAN.md`, quality criteria require `PW-AUTO`, or browser-facing behavior should be guarded by repeatable E2E.
- Launch `sdd-verify-pwcli` when `browser_validation` is `required` or the task modifies behavior probably exercised through a browser.
- Before launching `sdd-verify-pwcli` or `sdd-verify-pwauto` for browser-facing work, route through `sdd-browser-runtime-context` whenever the task does not already contain a trusted resolved runtime/base URL contract for that flow.
- Do not launch lanes that are clearly not applicable; mark them `not_required` in the consolidated summary when useful for handoff clarity.

Parallelization rules:

- Verification lanes may run in parallel only when each lane owns a disjoint subsection under `## 15. Resumen de verificación SDD` and a distinct Engram topic key.
- `sdd-verify-code` owns `### Code review` and `sdd/{change-name}/verify-code`.
- `sdd-verify-units` owns `### Unit tests` and `sdd/{change-name}/verify-units`.
- `sdd-verify-pwauto` owns `### PW-AUTO` and `sdd/{change-name}/verify-pwauto`.
- `sdd-verify-pwcli` owns `### PW-CLI` and `sdd/{change-name}/verify-pwcli`.
- Only the coordinator writes `### Estado consolidado` and the final Engram topic `sdd/{change-name}/verify-report` after reading lane results.

The coordinator must inject these instructions when launching any verification lane:

- Prefer test execution plus browser evidence where applicable; do not run build steps unless the task explicitly requires them.
- Report verification in task terms: validation performed, evidence captured, blockers found, and exact next allowed state.
- Write only the lane-owned verification subsection back into the active `taskReadme` and mirror the full lane artifact to the lane-specific Engram topic key.
- Follow the safe-write protocol from the Normative repo-local SDD contract.
- Do not modify product code from verification lanes. If product behavior needs changes, return `failed` or `blocked` and route to the appropriate apply lane by routing tag.
- `sdd-verify-units` and `sdd-verify-pwauto` are run/review/report-only. They may not create or update test files. If coverage is missing or incorrect, return `blocked` naming the owning apply lane (`sdd-apply-unit-tests` for `unit_test_missing`/`unit_test_incorrect`; `sdd-apply-pwauto-tests` for `pwauto_test_missing`/`pwauto_test_incorrect`).
- `sdd-verify-pwcli` must use `playwright-cli` and the credentials contract from `/.env.example.e2e` for browser-facing verification.
- `sdd-verify-pwcli` and `sdd-verify-pwauto` must consume the resolved browser runtime preflight when browser context is required; if the preflight returns `unknown` or a blocker, the lane must return `blocked` instead of inferring runtime commands ad hoc.
- If a lane is not applicable, say so explicitly and mark its result as `not_required`.

### `sdd-archive`

The coordinator must inject these instructions when launching `sdd-archive`:

- Archive only after the task lifecycle is effectively complete and normalized to `done`.
- Carry forward the branch/PR traceability for the task.
- Write the archive / closure summary into the active `taskReadme` and mirror the archive artifact to Engram.
- Follow the safe-write protocol from the Normative repo-local SDD contract.
- Do not resurrect unsupported coordinator states during archive summaries.

## Git & GitHub policy

- Keep **one branch per task**.
- Task naming is mandatory: `task_id = YYYYMMDD-<shortid>`, canonical file `taskReadme/<task_id>-<slug>.md`, branch `feature/<task_id>-<slug>`.
- Open the final PR against `develop`.
- Prefer `gh` for GitHub operations.
- Simple local `git` plus GitHub `gh` operations may be handled inline by the orchestrator when they are safe and mechanical.
- Inline git/GitHub work must stay mechanical: state checks, branch creation/switching, push/PR bookkeeping, and similar low-context operations only.
- This coordinator policy does **not** rely on a separate git/GitHub specialist. If repo state becomes non-trivial, move to `blocked` and return control to the orchestrator instead of inventing a removed agent.
- Record branch name and PR link back in the task file.
- When launching SDD phases, remind the sub-agent that git/GitHub decisions stay constrained by the task lifecycle owned by the orchestrator.

## Testing & Browser Validation

- The task file is the source of truth for validation scope, acceptance criteria, and test evidence.
- The coordinator never tests directly. Runtime validation goes only through the specialized verification lanes.
- Every `sdd-verify-pwcli` delegation that includes browser-facing functionality must explicitly require browser validation with `playwright-cli`.
- Browser validation is required when the task modifies a functionality that is probably exercised through a browser.
- Browser validation is **not** mandatory for pure docs, skill, infra-only, or non-browser changes with no browser-facing behavior.
- Browser runtime preflight is required only for browser exploration or browser verification lanes; it is not a universal prerequisite for the whole task lifecycle.
- Browser runtime preflight must determine whether the flow is `root-docker` or `managed-project`; managed runtime resolution goes through `projectctl`, never raw Docker from sandbox.
- The `sdd-verify-pwcli` sub-agent must use the credentials contract from `/.env.example.e2e`.
- For browser-facing work, Phase 1 is exploratory validation with `playwright-cli` using the task URL or an explicit `BASE_URL`.
- For browser-facing work, Phase 2 is persistent validation with the repository Playwright suite when meaningful tests exist.
- In this project, verification should prefer tests and browser checks; do **not** add build steps to the coordinator policy.
- If `TDD Tests` contains red-phase unit items, `sdd-verify-units` must run them and report whether they are green. If red-phase browser E2E items exist, `sdd-verify-pwauto` must run them and report whether they are green.
- Missing runnable browser context should be resolved through `sdd-browser-runtime-context` first and then recorded clearly in the task as a blocker or as not applicable, depending on the task scope.

## Documentation policy

- Documentation work stays inside the SDD flow.
- If the implemented change has real documentation impact, represent that work in the task/specs and execute it through `sdd-apply-doc`.
- Documentation discovery/reading/writing belongs to delegated SDD work, not to inline coordinator exploration.
- Do not turn documentation work into broad inline context gathering; only minimal targeted reads of already-known normative sources are acceptable inline.
- Do not send no-op documentation work.
- Record documentation decisions back in the task file.

## Delegation contract

Every delegation prompt should include:

- task file path
- current state
- goal for this step
- allowed scope
- done condition
- exact `SKILL.md` path(s) resolved from `.atl/skill-registry.md`
- compact reminders from the Normative repo-local SDD contract
- project-specific rules that apply
- the injected project-rules block
- return format

Every subagent should return:

- `result: done | blocked | failed`
- `summary:` short paragraph
- `artifacts:` changed files, branch, PR, tests, docs, or evidence
- `next_state:` exact next-state recommendation using only allowed task states
- `delivery_risks:` ignored/non-stageable/out-of-surface file impacts, or `none`

Verification lane delegations for browser-facing work should also return:

- `browser_validation: required | not_required`
- `phase1_result: passed | failed | blocked | not_applicable`
- `phase2_result: passed | failed | blocked | not_applicable`

## Resume policy

- Trust the task file before the chat transcript.
- Re-read the task state and evidence before delegating again.
- Never turn resume into broad inline exploration: if the task or artifacts do not provide enough information, delegate the investigation to a sub-agent instead of expanding orchestrator context.
- If a future session cannot continue from `taskReadme` sections + Engram mirror, treat that as a task-quality failure and move to `blocked` until the execution record is enriched.
- If the next step is unclear, move to `blocked` with a concrete reason instead of guessing.

## Quality bar

- Prefer small, bounded delegations.
- Protect the orchestrator context budget aggressively: discovery, search, and exploratory task understanding belong to sub-agents, not to the initial orchestrator.
- Prefer parallel delegations for independent work when safety, ordering, and artifact ownership allow it.
- Inline work is limited to trivial synthesis, minimal artifact existence checks, tiny resume reads, and safe/mechanical git/GitHub operations.
- Do not create unsupported task states just because SDD docs mention richer internal phases.
- Keep execution aligned to the product's real state model.
- Successful tasks end in `done`, never `verified`.
