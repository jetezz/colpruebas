---
name: sdd-init
description: "Trigger: sdd init, iniciar sdd, bootstrap SDD. Initialize repo SDD context, conventions, tests, and persistence."
license: MIT
metadata:
  id: sdd-init
  version: 1.0.0
---

## Purpose

You are a sub-agent responsible for initializing the Spec-Driven Development (SDD) context in this repo. You detect the project stack, conventions, and testing capabilities, then bootstrap the repo-local coordinated backend: **`taskReadme` + Engram mirror**, with `taskReadme` as the only canonical operational/filesystem artifact under `coordinador`.

You are an EXECUTOR for this phase, not the orchestrator. Do the initialization work yourself. Do NOT launch sub-agents, do NOT call `delegate` or `task`, and do NOT hand execution back unless you hit a real blocker that must be reported upstream.

## Execution and Persistence Contract

For the coordinated repo-local workflow, the effective mode is `taskReadme + Engram mirror`.

- Do NOT create `openspec/` directory.
- Do NOT bootstrap `openspec/config.yaml` as part of the normal repo-local coordinated path.
- Do NOT create or update parallel SDD artifact folders/files under `proposals/`, `specs/`, `designs/`, or `tasks/`.
- Treat any older local references to `openspec`, `hybrid`, or `none` as compatibility vocabulary, not an available coordinated mode.

## Command Authority

`sdd-init` owns bootstrap discovery and SDD readiness only. Its existing `bun run sdd:doctor` static preflight and Engram write/search/retrieve round trip are init-owned exceptions for bootstrap context; they do not authorize other phases to run Bun commands or memory probes by default.

- Allowed by default: file reads/search for project context, `.atl/skill-registry.md` refresh when assigned, `bun run sdd:doctor` for static SDD preflight, and Engram bootstrap/testing-capability mirrors.
- Forbidden unless explicitly assigned by the coordinator: Git/GitHub lifecycle, builds, broad tests, Docker/runtime/projectctl control, browser tooling, persistent Playwright, Supabase/data operations, and product implementation edits.
- If another phase needs these checks, record the required owner/action instead of treating init authority as inherited.

**Save project context**:
  ```
  mem_save(
    title: "sdd-init/{project-name}",
    topic_key: "sdd-init/{project-name}",
    type: "architecture",
    project: "{project-name}",
    content: "{detected project context markdown}"
  )
  ```
`topic_key` enables upserts — re-running init updates the existing context, not duplicates.

(See `.agents/skills/_shared/engram-convention.md` for full naming conventions.)

## What to Do

### Step 1: Detect Project Context

Read the project to understand:
- Tech stack (check package.json, bun.lock, go.mod, pyproject.toml, etc.)
- Existing conventions (linters, test frameworks, CI, docs, task files)
- Architecture patterns in use

### Step 2: Detect Testing Capabilities

Scan the project for ALL testing infrastructure. This determines what testing modes are available.

```
Detect testing capabilities:
├── Test Runner
│   ├── package.json / bun lock / scripts → bun test, vitest, jest, mocha, ava
│   ├── pyproject.toml / pytest.ini / setup.cfg → pytest
│   ├── go.mod → go test
│   ├── Cargo.toml → cargo test
│   ├── Makefile → make test
│   └── Result: {framework name, command} or NOT FOUND
│
├── Test Layers
│   ├── Unit: test runner exists → AVAILABLE
│   ├── Integration: detect testing-library, httptest, equivalent helpers
│   ├── E2E: detect playwright, cypress, selenium, chromedp
│   └── Each layer → record tool name
│
├── Coverage Tool
│   ├── vitest/jest/c8/nyc, pytest-cov, go test -cover, etc.
│   └── Result: {command} or NOT AVAILABLE
│
└── Quality Tools
    ├── Linter: eslint, biome, ruff, golangci-lint, etc.
    ├── Type checker: tsc --noEmit, mypy, pyright, go vet, etc.
    └── Formatter: prettier, biome, black, gofmt, rustfmt
```

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

Initialize the repo-local coordinated backend by recording bootstrap/linkage context in the active `taskReadme` when available and mirroring project context to Engram. Do not create `openspec/` filesystem artifacts as part of this phase.

### Step 5: Check Engram Availability

First run or require the static SDD preflight `bun run sdd:doctor` when the repo-local setup has not been checked in the current session. This proves only filesystem/runtime portability; it does not prove Engram availability.

Check whether Engram read/write is available by performing the required runtime round trip: write a mirror observation, search for it by stable topic key, and retrieve the full observation. Record the result in the active `taskReadme` when present:

- `engram_status: available | unavailable | unknown`
- `engram_last_check: <ISO timestamp>`
- `engram_blocker: <exact error or empty>`

If Engram is unavailable, preserve the bootstrap context in `taskReadme`, report the exact failure, and return `blocked` unless the orchestrator explicitly allowed a non-closing degraded bootstrap. Degraded bootstrap/exploration/planning may continue only when recorded explicitly; implementation, verification closure, `done`, and archive remain blocked until required mirrors are restored or an explicit coordinator exception is recorded. Do not create filesystem mirror artifacts as a substitute.

### Step 6: Record Repo-Local Bootstrap Assumptions

Make the returned/project context explicit that this repo uses `taskReadme` as canonical file persistence plus Engram mirror/recovery, and that this is a repo-local overlay rather than literal upstream OpenSpec compliance.

### Step 7: Persist Testing Capabilities

**This step is MANDATORY — do NOT skip it.**

```
mem_save(
  title: "sdd/{project-name}/testing-capabilities",
  topic_key: "sdd/{project-name}/testing-capabilities",
  type: "config",
  project: "{project-name}",
  content: "{testing capabilities markdown}"
)
```

### Step 8: Build Skill Registry

Refresh `.atl/skill-registry.md` for this repo. Prefer the local project skills under `.agents/skills/`. Keep the local SDD skills visible as workflow skills but do not treat them as generic coding overlays.

### Step 9: Persist Project Context

**This step is MANDATORY — do NOT skip it.**

Save the detected project context under `sdd-init/{project-name}` and, if a task file exists, write a compact bootstrap summary into its SDD linkage section.

### Step 10: Return Summary

Return a structured summary with status, executive_summary, artifacts, next_recommended, risks, skill_resolution, and `engram_status`.

## Rules

- NEVER create placeholder spec files
- ALWAYS detect the real tech stack, don't guess
- NEVER behave like the orchestrator from this phase
- Keep bootstrap context concise
- ALWAYS detect testing capabilities
- ALWAYS persist testing capabilities as a separate observation/section
- ALWAYS report Engram availability as `available`, `unavailable`, or `unknown`
- ALWAYS distinguish static SDD portability (`bun run sdd:doctor`) from Engram runtime availability (`/sdd-doctor` memory round trip)
- NEVER close SDD bootstrap as successful when required Engram mirrors failed; preserve `taskReadme` context and return `blocked`
- If Strict TDD Mode is requested but no test runner exists, set `strict_tdd: false` and explain why
- Use repo-local paths such as `.agents/skills/` and `.atl/skill-registry.md`, not home-directory paths
