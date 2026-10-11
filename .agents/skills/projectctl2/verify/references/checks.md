# Checks reference — verify-all

Exact commands for the five health blocks. Read this file when you need a
path, an expected output, or an exit-code meaning. Block order lives in
`SKILL.md` §1; this file only details each command. All paths relative to
the project root; run everything with `bun`.

## Block 1 — generated coherence

```sh
bun .agents/skills/projectctl2/types/scripts/check-generated.ts
# PASS: exit 0, prints "Generated Draft 2020-12 JSON Schemas are up to date."

bun .agents/skills/projectctl2/scripts/skill-version.ts check
# PASS: exit 0, prints "Valid projectctl2@<semver>: sha256:<...>"
# FAIL "Skill tree is dirty ... Run bump patch|minor|major." → owner types.
```

## Block 2 — contracts

```sh
bun .agents/skills/projectctl2/types/scripts/verify-contracts.ts
# PASS: exit 0, ends with "... are consistent." and 0 FAIL lines.
# Internally runs contracts.test.ts + tsc -p types/tsconfig.verify.json +
# CLI fixtures + phases/SKILL.md-vs-catalog coherence.
# Any "FAIL ..." line → owner types (finding path tells which SKILL drifts).
```

## Block 3 — requirements validators (project scope, --json, no filters)

```sh
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts --json
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts --json
bun .agents/skills/projectctl2/requirements/estructura/scripts/validate-structure.ts --json
bun .agents/skills/projectctl2/requirements/estructura/scripts/check-paths.ts --json
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts --json
bun .agents/skills/projectctl2/requirements/test/scripts/validate-tests.ts --json
# PASS each: exit 0 and "valid": true with issues [].
# Cross-chain join check (outside the 6-validator gate): requirements/scripts/check-traceability.ts.
# Exit 2 = usage error (wrong flags, your mistake, re-run correctly).
# Exit 1 + issues = real red → paste issues verbatim, owner requirements.
```

Writers you must NOT execute here (only `--help` smoke if ever needed):
`test/scripts/update-test-status.ts`, `sdd/task/*` (init, update-task,
set-phase, set-state, create-branch), `types/scripts/generate-*.ts`.
`requirements/fixer/scripts/run-req-fixer-loop.ts` belongs to req-fixer (F3/F4 gates), not to verify-all.

## Block 4 — unit tests (whole tree, one command)

```sh
bun test ./.agents/skills/projectctl2/
# PASS: every file "X pass, 0 fail". Covers the 10 suites:
# types/.../contracts.test.ts, types/.../verify-contracts.test.ts,
# sdd/task/scripts/task-pr.test.ts,
# requirements/test/scripts/update-test-status.test.ts,
# scripts/__tests__/skill-version.test.ts,
# types/scripts/__tests__/slugify.test.ts, sdd/task/scripts/check-task-tuple.test.ts,
# requirements/scripts/check-traceability.test.ts, requirements/fixer/scripts/run-req-fixer-loop.test.ts,
# verify/scripts/run-verify-all.test.ts
# Any fail → owner of the failing file; paste the failing assertion verbatim.
```

## Block 5 — agent discovery

```sh
opencode agent list 2>&1 | grep -E "^(req-fixer|verify-all|sdd-orchestrator|sdd-)"
# PASS: req-fixer (all), verify-all (all), sdd-orchestrator (primary),
# and the sdd-* subagents all listed. Missing entry → owner opencode config
# (agent file absent/invalid, opencode.json entry, or TUI needs restart —
# the CLI reads fresh config, the TUI loads at startup).
```
