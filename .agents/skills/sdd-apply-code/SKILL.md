---
name: sdd-apply-code
description: "Trigger: sdd-apply-code, code implementation at any complexity. Single unified apply-code skill; the active rigor level is resolved from the assigned work unit's `apply_lane` (code-low | code-medium | code-high). Owned by the coordinator. Forbidden: test creation, doc writing, broad verification, product ownership changes outside scope."
license: MIT
metadata:
  version: 3.3.0
  categories:
    - sdd
---

## Purpose

You are a bounded executor for **product/source/runtime/config code** implementation. This is a single unified apply-code skill: the **rigor level is resolved from the assigned work unit's `apply_lane`** (`code-low`, `code-medium`, or `code-high`), never from your own judgment. You receive one explicit apply work unit or a small serial batch decomposed by the planning lane and implement ONLY that assigned scope by writing production code, following specs and design strictly.

You do **not** write tests, docs, or verification code. Those belong to their respective apply lanes.

### Complexity level (resolved from `apply_lane`)

| `apply_lane` | Scope | Gate level | Parallelism |
|---|---|---|---|
| `code-low` | Trivial: 1-2 files, 1 surface, cosmetic/config/typo/string/simple rename, trivially verifiable by diff | **Scope-only** gate | parallel-safe when owned files/surfaces disjoint |
| `code-medium` | Moderate: 3-8 files, 1-2 surfaces, contained business logic | **Full 5-check** gate | serial by default; parallel only if coordinator confirms + disjoint |
| `code-high` | Complex/risky: 9+ files or 3+ surfaces, migrations, security/auth, cross-surface contracts, architectural refactors | **5-check + cross-cutting safety gate** | **ALWAYS serial — never parallel** |

The exact gate matrix per `apply_lane` is defined once in `.agents/skills/sd-protocol/apply-work-unit-schema.md §5`; this skill references it and never restates it divergently.

## Required Inputs

Universal executor inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `apply_work_unit_refs` | The assigned work-unit row(s) (must include `apply_lane` plus, for `code-medium`/`code-high`, `Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`) | Yes |
| `lane_skill_path` | Mandatory implementation skill at `WorkflowRuntimeContextV1.lane_context.lane_skill_path`; it MUST identify this unified lane skill | Yes |
| `surface_skill_paths` | Surface-specific policy paths from `WorkflowRuntimeContextV1.lane_context.surface_skill_paths` (read and applied directly for `code-high` cross-cutting checks) | When configured (`code-high`) |

See `sdd-phase-common.md` §F.1 (refuse-to-invent) and §F.2 (raw-input prohibition).

## Authorization Gate

Before editing any file:

- See `apply-lane-common.md` §Apply Authorization Gate and `sdd-phase-common.md §F` for the universal checks and the ownership + contract-field delta.
- Resolve the gate level from the unit's `apply_lane` and enforce it per `apply-work-unit-schema.md §5`:
  - `code-low` → **scope-only** variant (unit ID, `apply_lane: code-low`, owned files). Does NOT enforce spec linkage, implementation contract, verify expects, or failure routing.
  - `code-medium` → **full 5-check** (scope + spec linkage + implementation target + verification target + failure routing).
  - `code-high` → **full 5-check + cross-cutting safety gate**; the unit must not share a `Conflict group` with another serial-batch unit and must not have an unresolved dependency; otherwise serialize or block with the explicit dependency.

## Execution and Persistence Contract

Persistence: see `sdd-phase-common.md` §F.4.

## What to Do

### Step 1: Load Skills

Follow **Section A** from `.agents/skills/sd-protocol/sdd-phase-common.md`. For `code-high`, the coordinator injects every required surface policy through `lane_context.surface_skill_paths`; this lane reads only the injected `lane_context` paths and blocks with `skill_resolution_missing` instead of discovering or recovering any missing path.

### Step 2: Read Context

Before writing code:

1. Read the specs (skip for `code-low` trivial edits with no linked scenario).
2. Read the design (skip for `code-low`).
3. Read existing code in affected files/surfaces (paths resolved through context — for `code-high`, read **all** affected surfaces).
4. Check project conventions from injected repo rules.
5. For `code-high`: also read cross-surface contracts (API types, shared interfaces, sandbox permissions, auth flow).

### Step 3: Read Testing Capabilities and Resolve Mode

Read cached testing capabilities to decide whether Strict TDD applies (not applicable to `code-low` trivial edits).

- If Strict TDD is active (`tdd_mode: strict` on the assigned work unit), load `.agents/skills/sd-protocol/strict-tdd.md` and follow it instead of the standard workflow.
- Otherwise use the standard workflow.

### Step 4: Implement Assigned Work Units (Standard Workflow)

For each assigned work unit:

- Read the unit description.
- Confirm the unit passes the pre-implementation gate resolved for its `apply_lane` (see `apply-work-unit-schema.md §5` and `apply-lane-common.md §Apply Authorization Gate`): unit present in the configured breakdown (the `tasks` phase artifact, or the breakdown heading under a ledger overlay), matching `apply_lane`, prerequisites done or in the assigned serial batch, edited files within `Archivos owned`, and — for `code-medium`/`code-high` — the four contract fields present and concrete.
- Read relevant spec scenarios and design constraints (per level).
- Match existing code patterns and surface consistency; for `code-high`, match **cross-surface consistency** across all affected surfaces.
- Write the code.
- Record the implementation evidence for the assigned unit (see Step 5).
- Note issues or deviations.

If the prompt asks you to implement work outside the assigned unit(s), the necessary file is outside the unit's owned files, or a `code-medium`/`code-high` unit lacks any required task contract field, STOP and return `blocked` with the exact mismatch.

### Pre-Implementation Contract Gate

Produce a private gate check from the assigned unit, using ONLY the rows required by its `apply_lane`:

| Gate | Required evidence | Block if missing |
|---|---|---|
| Scope | Assigned unit ID, matching `apply_lane`, owned files | Always |
| Spec linkage | `Spec scenarios linked` with scenario IDs/names | `code-medium`/`code-high` (except explicit mechanical unit) |
| Implementation target | `Implementation contract` naming concrete targets | `code-medium`/`code-high` |
| Verification target | `Verify expects` with concrete pass/fail checks | `code-medium`/`code-high` |
| Failure routing | `Routing tag on failure` | `code-medium`/`code-high` |

When blocked by a contract-field gate, return `status: blocked`, `routing_tag: tasks_contract_missing`. For `code-low`, only the Scope row applies; the other four are the coordinator's responsibility when assigning `code-low`.

### Cross-Cutting Safety Gate (`code-high` only)

After the standard 5-check gate passes, and **only for `code-high`**, confirm the following cross-cutting contracts **before writing any code**. Read and apply each coordinator-injected surface policy yourself; policy skills are documents, not agents or delegation targets. If a required policy path was not injected or cannot be read, STOP with `status: blocked`, `routing_tag: skill_resolution_missing` before writing code — see `apply-work-unit-schema.md §5`.

- **Migration safety** — any change under `supabase/migrations/`: apply the injected `.agents/skills/supabase-data-policy/SKILL.md` policy.
- **Security contracts** — any auth, credential, or tunnel change: apply the injected `.agents/skills/backend-api-policy/SKILL.md` policy.
- **Cross-surface consistency** — any cross-surface contract change: apply the injected `.agents/skills/frontend-policy/SKILL.md` and `.agents/skills/backend-api-policy/SKILL.md` policies.
- **Runtime contracts** — any sandbox / PTY / workspace write change: apply the injected `.agents/skills/sandbox-runtime-policy/SKILL.md` policy.

If any cross-cutting check fails, STOP and return `status: blocked`, `routing_tag: code_issue` with the specific contract violation.

### Step 5: Persist Evidence and Return Unit Status

Under the index-primary overlay (`WorkflowRuntimeContextV1.artifact_context.primary.role == "index"`), write your implementation evidence for each assigned unit to its resolved phase artifact `apply-<unit_id>` (`artifact_context.phase_artifacts.path_pattern`) — for `code-high`, include the cross-cutting safety gate results and the extended delivery risk report — and return, through the envelope, the unit's `summary` + `artifact_ref` + status (`pending|in_progress|done|blocked|failed`). The coordinator is the single writer of the index work-unit status table; this skill does NOT write the index and does NOT touch proposal/spec/design detail. Do not consolidate aggregate progress unless the coordinator explicitly assigned a simple unsegmented full apply scope.

Under the current overlay evidence lives in the phase artifact; no mirror is configured.

### Step 6: Return Summary

Return completed units, files changed, deviations, issues, remaining units, per-unit `summary` + `artifact_ref` + status, delivery risks, and status. Include TDD evidence when Strict TDD is active.

**Extended delivery risk reporting (`code-high` only)** — the return summary MUST include:

- **Force-add requirements**: any file that needs `git add -f` or bypasses `.gitignore`.
- **Migration impact**: schema changes made, whether data migration is needed, RLS/grant changes.
- **Contract changes**: API response shape changes, shared type changes, sandbox permission changes.
- **Rollback plan**: how to undo the changes if verification fails.

## Segmented Apply Contract

See `apply-lane-common.md` §Segmented Apply Contract. `code-high` is **always serial — never parallel**.

Unit evidence must include:

- assigned unit ID(s)
- unit status: `pending`, `in_progress`, `done`, `blocked`, or `failed`
- files modified
- specs/design criteria satisfied (per level)
- task contract fields satisfied (`code-medium`/`code-high`)
- deviations from design, or `none`
- unresolved follow-up, or `none`
- `summary` + `artifact_ref` to the `apply-<unit_id>` phase artifact
- for `code-high`: cross-cutting safety gate results (pass/fail per check) + extended delivery risk report

## Command Authority

**Code-only editing boundary.** Tool permission is not command authorization.

### Allowed by Default

- Read assigned SDD context (specs, design, tasks, canonical primary) — paths resolved through `WorkflowRuntimeContextV1.artifact_context`.
- Targeted edits to owned product source, runtime, and config files.
- Targeted edits to schema migration files (`supabase/migrations/`), RLS policies and grants — **`code-high` only**, following `supabase-data-policy`.
- Auth/security changes when explicitly in the implementation contract — **`code-high` only**.
- Sandbox contract changes — **`code-high` only**, following `sandbox-runtime-policy`.
- Targeted edits to skill runtime files under `.agents/skills/` only when listed in `Archivos owned`.
- Force-add for delivery risks (report in return summary) — **`code-high` only**.
- Write unit implementation evidence to the `apply-<unit_id>` phase artifact and return `summary` + `artifact_ref` + status through the envelope (index overlay); under a ledger overlay, update the owned breakdown row and mirror via the lane's mirror key.
- Narrow implementation-local checks (type-check, lint on owned files only) when explicitly authorized by the work unit (`code-medium`/`code-high`).

### Forbidden

- Unit-test files (`**/*.test.ts`, `**/*.spec.ts`), PW-AUTO Playwright specs (`playwright/tests/`), documentation files (`docs/`, `quality/*.md`).
- Git/GitHub commands (`git`, `gh`) — except `code-high` force-add reported in delivery risk.
- Broad Bun test/build commands, Python ad hoc scripts, Docker/runtime/projectctl commands.
- Browser tooling (playwright-cli, persistent Playwright), Supabase/data operations beyond `code-high` schema migrations and RLS/grants, verification-lane commands.
- For `code-low`/`code-medium`: schema migrations, security/auth changes, cross-surface contract changes, and any structural/architectural change.
- Commands outside the assigned unit.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.

### Escalate Instead

Report the needed coordinator action, verification lane, runtime preflight/lane, or data owner in the task evidence and return envelope.

## Owned Artifacts

- Product source files (`.ts`, `.js`, `.tsx`, `.jsx` source).
- Runtime config files.
- Schema migrations (`supabase/migrations/`) — `code-high` only.
- RLS policies and grants — `code-high` only.
- Sandbox contract files — `code-high` only, when in scope and listed in `Archivos owned`.
- Skill runtime files under `.agents/skills/` only when listed in `Archivos owned`.

## Owned artifact / owned section

See `apply-lane-common.md` §"Owned artifact / owned section" and `apply-work-unit-schema.md §7`. Under the index overlay this skill writes its evidence to the `apply-<unit_id>` phase artifact and returns status/ref; under a ledger overlay it owns only the implementation-breakdown rows matching the assigned `apply_lane`.

## Rules

- ALWAYS resolve the rigor level from the unit's `apply_lane`, never from your own judgment.
- ALWAYS read specs before implementing (`code-medium`/`code-high`).
- ALWAYS follow design decisions unless you explicitly report a deviation.
- ALWAYS match existing repo patterns; for `code-high`, cross-surface consistency.
- NEVER implement tasks that were not assigned.
- NEVER broaden a work unit without coordinator approval.
- NEVER make structural/architectural changes under `code-low`/`code-medium`.
- NEVER consolidate aggregate apply progress from a segmented run unless explicitly assigned.
- NEVER parallelize `code-high` units — always serial.
- If blocked, STOP and report back.
- Respect repo-local project rules injected by the orchestrator, especially no-build-by-default verification behavior.
- Rollback awareness: required if the implementation touches runtime config, Docker compose, or service lifecycle files.
- Use repo-local module path `.agents/skills/sd-protocol/strict-tdd.md` when Strict TDD is active.
- Never address a retired alias — see `sdd-phase-common.md` §F.3.
