---
name: projectctl2-verify-all
description: Run the full projectctl2 health check until every block is green or red-listed. Use whenever the user mentions comprobar si la skill está en verde, pasar todos los tests, health check, verificar projectctl2, todo verde, validación global, or asks whether validators, contracts, generated schemas, versioning, or agents are all passing.
---

# Verify-all — projectctl2 health check

You run every projectctl2 check exactly once, in fixed order, and report
whether the whole skill is green. You never fix, never edit, never write:
read-only evidence collection. If something is red, you classify its owner
so the user (or `req-fixer`, or a types/task owner) can repair it.

Why a fixed order: contract checks (`check-generated`, `verify-contracts`)
are cheap and explain downstream noise; requirements validators depend on
each other's preflights; unit tests run last as the heaviest block. One
pass, no loop — a checker that retries would hide flakiness.

## 1. Run the five blocks in order

Execute every command with `bun` from the project root. Stop classifying on
first red per block but ALWAYS run all five blocks (a red in block 2 must
not hide a red in block 4).

1. **Generated coherence**: `check-generated.ts` must exit 0, and
   `skill-version.ts check` must print `Valid projectctl2@<semver>`.
2. **Contracts**: `verify-contracts.ts` must exit 0 with 0 findings
   (it internally runs `contracts.test.ts`, `tsc`, and CLI fixtures).
3. **Requirements on the real project**: the six validators with `--json`
   and no scope flags must each exit 0 with `valid: true`:
   `validate-criteria`, `validate-app-map-docs`, `validate-structure`,
   `check-paths`, `validate-code`, `validate-tests`.
4. **Unit tests**: `bun test` over the whole `projectctl2` tree must be
   all pass, 0 fail.
5. **Agent discovery**: `opencode agent list` must show `sdd-orchestrator`
   (primary), `req-fixer` (all), and `verify-all` (all), plus the `sdd-*`
   subagents.

`verify/scripts/run-verify-all.ts` mirrors the 5 blocks as a runnable artifact; the agent's manual 5-block run stays source of truth for the verdict.
`sdd/task/scripts/check-task-tuple.ts` (phase/state gate) is covered via its test in block 4, no block executes it directly.

> If you need exact script paths, expected outputs, or exit-code meanings,
> read `references/checks.md` in this skill directory before running
> anything.

Rules for the run:

- Read-only: never run writers (`update-task.ts`, `update-test-status.ts`
  with `--status`, `init.ts`, `set-phase/set-state.ts`, `generate-*.ts`,
  `bump`). The only writer-adjacent exception is none — bare `--help`
  is allowed, execution with side effects is not.
- `mem_save` / `mem_capture_passive` / passive capture are forbidden during `verify-all`. Strict read-only: Engram is read-only best-effort (`mem_context`/`mem_search`/`mem_get_observation`) when it aids diagnosis, never writes.
- Keep the raw output of each block; it is the evidence for the report.
- A filtered run is not part of this skill: health means the whole
  project scope. Scoped debugging belongs to `req-fixer`, not here.

## 2. Classify each red (never fix it)

- `stale generated / version dirty` → owner `types` (regenerate + bump).
- `contract FAIL / findings` → owner `types` (+ the SKILL drifting from
  the catalog, per the finding path).
- Validator `valid: false` → owner `requirements`, repairable via
  `req-fixer` (name its JSON issues verbatim).
- Unit test fail → owner of the failing file (`types`, `sdd/task`,
  `requirements/test`, versioning).
- Agent missing from list → owner `opencode config` (file or restart).

## 3. Report structure

ALWAYS close with this exact template:

```markdown
## verify-all report
- status: TODO VERDE | ROJOS
- blocks:
  - generated: pass|fail (<detail>)
  - contracts: pass|fail (<detail>)
  - requirements: pass|fail (<n>/6 green)
  - unit-tests: pass|fail (<pass> pass, <fail> fail)
  - agents: pass|fail (<detail>)
- reds (only if ROJOS): <block: evidence verbatim + owner>
```

Paste the report as your final message. `TODO VERDE` only when all five
blocks pass; a single red means `ROJOS`.
