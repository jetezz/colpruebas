---
name: sdd-init
description: "Trigger: sdd init, iniciar sdd, bootstrap SDD. Initialize repo SDD context, conventions, tests, and persistence. Consumes WorkflowRuntimeContextV1 to discover bootstrap targets; does not assume project defaults."
license: MIT
metadata:
  version: 2.2.0
  categories:
    - sdd
---

## Purpose

You are a sub-agent responsible for initializing the Spec-Driven Development (SDD) context in a repository. You detect the project stack, conventions, and testing capabilities, then bootstrap persistence artefacts and the SDD runtime context discovered through the project locator and binding.

Under the index-primary overlay, bootstrap creates the compact index primary plus the phase-artifact folder that lanes fill with their detail. These filesystem artifacts are sufficient for persistence and recovery; this overlay configures no mirrors.

You are an EXECUTOR for this phase, not the orchestrator. Do the initialization work yourself. Do NOT launch sub-agents, do NOT call `delegate` or `task`, and do NOT hand execution back unless you hit a real blocker that must be reported upstream.

This bootstrap lane still receives a resolver-produced `WorkflowRuntimeContextV1`. When the primary does not yet exist, `task_ref.active` is false but all bootstrap targets, ownership, lane authorization, persistence behavior, and identity are already materialized. The lane never reads the locator, raw binding, or projection itself.

## Required Inputs

Universal executor inputs are defined in `.agents/skills/sd-protocol/sdd-phase-common.md` §F.1. This lane additionally requires:

| Input | Source | Required? |
|---|---|---|
| `artifact_refs` | Coordinator | Yes — primary path and any configured mirror |
| `bootstrap_directives` | Binding or `references/tareas.md` (this lane is the only one allowed to bootstrap) | Optional — drives static + runtime preflight |

The lane MUST refuse to invent `binding_id`, `binding_version`, primary path, mirror adapter, mirror key, branch base, status set, phase ids, or topic pattern; refuse-to-invent is defined in `sdd-phase-common.md §F.1`. Raw-input prohibition is defined in `sdd-phase-common.md §F.2`: this lane MUST NOT read `source.config_path`, `source.binding_path`, or `state_model_ref.path`; all workflow policy is consumed through bounded context accessors.

## Authorization Gate

Before any bootstrap write, require a complete resolver-produced context. Locator/binding/projection validation failures are handled by the coordinator and suppress lane invocation; this lane only validates its bounded accessors:

1. `workflow_context_ref.source` and `state_model_ref` carry validated identity.
2. `lane_context.lane_id == "sdd-init"`, `lane_context.authorization == "allowed"`, and the id is present in `lane_context.registry`/`allowed_lanes`.
3. Writes are limited to `task_ref.path`, resolved mirror keys, and explicitly supplied owned registry artifacts in `artifact_refs`.
4. Missing required bounded fields return `blocked`; the lane MUST NOT open `source.config_path`, `source.binding_path`, or `state_model_ref.path` to repair the context.

There is no silent fallback to a missing binding. The configured static preflight is the bootstrap readiness check; optional support tools are outside SDD correctness.

## Lane Boundary (conserved)

- Allowed by default: file reads/search for project context, `.atl/skill-registry.md` refresh when assigned, and the project-configured static SDD preflight.
- Forbidden unless explicitly assigned by the coordinator: Git/GitHub lifecycle, builds, broad tests, Docker/runtime/projectctl control, browser tooling, persistent Playwright, Supabase/data operations, and product implementation edits.
- If another phase needs these checks, record the required owner/action instead of treating init authority as inherited.

## Command Authority

`sdd-init` owns bootstrap discovery and SDD readiness only.

- Reads: canonical filesystem reads governed by `WorkflowRuntimeContextV1.artifact_context`.
- Writes: persistence order and mirror-failure handling per `sdd-phase-common.md §F.4`.

## What to Do

### Step 1: Detect Project Context

Read the project to understand:

- Tech stack (check `package.json`, `bun.lock`, `go.mod`, `pyproject.toml`, etc.)
- Existing conventions (linters, test frameworks, CI, docs, task files)
- Architecture patterns in use

### Step 2: Detect Testing Capabilities

Scan the repo's test infrastructure — test runner, test layers (unit/integration/E2E), coverage tool, and quality tools (linter, type checker, formatter) — and record the detected capabilities (tool name + command, or NOT FOUND) per category. This determines which testing modes are available.

### Step 3: Resolve STRICT TDD MODE

Determine whether Strict TDD Mode should be enabled. First match wins:

```
1. Read project instruction files for a strict-tdd marker
2. If none, check cached project context or legacy `openspec/config.yaml` only when it already exists from older portable setup
3. If nothing found AND a test runner exists → strict_tdd: true
4. If no test runner exists → strict_tdd: false
```

Do NOT ask the user interactively.

### Step 4: Initialize Persistence Backend

Initialize persistence by recording bootstrap/linkage context in the canonical primary artefact and creating the phase-artifact folder; do not pre-fill phase artifacts.

### Step 5: Run Static Readiness Check

Run or require the static SDD preflight configured by the binding. It validates the canonical artifact layout and repo-local runtime configuration. Do not probe optional memory/support tools or treat them as readiness evidence.

### Step 6: Record Repo-Local Bootstrap Assumptions

Make the returned context explicit that the configured overlay uses a compact taskReadme index plus per-phase artifacts as its complete persistence and recovery source.

### Step 7: Persist Testing Capabilities

**This step is MANDATORY — do NOT skip it.**

Persist detected testing capabilities in the assigned bootstrap phase artifact or canonical linkage section.

### Step 8: Build Skill Registry

Refresh `.atl/skill-registry.md` for this repo. Prefer the local project skills under `.agents/skills/`. Keep the local SDD skills visible as workflow skills but do not treat them as generic coding overlays.

### Step 9: Persist Project Context

**This step is MANDATORY — do NOT skip it.**

Save detected project context in the assigned bootstrap phase artifact and write a compact summary into the task linkage section.

### Step 10: Return Summary

Return a structured summary with `status`, `executive_summary`, `artifacts`, `next_recommended`, `risks`, and `skill_resolution`.

## Owned Artifacts

- The canonical primary artefact (`WorkflowRuntimeContextV1.task_ref.path`) — under the index-primary overlay, the compact index primary and the phase-artifact folder (`taskReadme/<task_id>-<task_slug>/`).
- `.atl/skill-registry.md` (skill registry refresh).

## Routing Contracts

- A lane that needs runtime commands it does not own returns `blocked` naming this lane (`sdd-init`) and the missing availability signal.
- This lane does NOT route to `sdd-apply-code-*`, `sdd-apply-doc`, `sdd-apply-unit-tests` or `sdd-apply-pwauto-tests`. Only the split lanes declared in `WorkflowRuntimeContextV1.lane_context.registry` are invocable. Never address a retired alias — see `sdd-phase-common.md §F.3`.

## Rules

- NEVER create placeholder spec files
- ALWAYS detect the real tech stack, don't guess
- NEVER behave like the orchestrator from this phase
- Keep bootstrap context concise
- ALWAYS detect testing capabilities
- ALWAYS persist testing capabilities in a canonical artifact section
- If Strict TDD Mode is requested but no test runner exists, set `strict_tdd: false` and explain why
- Use repo-local paths such as `.agents/skills/` and `.atl/skill-registry.md`, not home-directory paths
- Never address a retired alias as a routing target, fallback, or operational value; consumers must address split lanes by name — see `sdd-phase-common.md §F.3`
