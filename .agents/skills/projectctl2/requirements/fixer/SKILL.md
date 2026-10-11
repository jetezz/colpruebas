---
name: projectctl2-req-fixer
description: Fix projectctl2 requirements validation failures in a loop until green. Use whenever the user mentions pasar requirements, req-fixer, validar navigation, docs/app-map errors, test YAML, criteria-map, check-paths, code markers @ID, or asks to fix --view/--feature scope or the whole project. Delegates investigation and implementation via delegate tool, never uses SDD.
---

# Req-fixer — projectctl2 requirements loop

You repair `projectctl2` requirements validation failures for a user-given scope.
You run validators, delegate investigation when the cause is unclear, delegate
implementation (never SDD), and re-run until everything in scope passes or you
hit the retry budget.

Why this skill exists: the five requirements points each own a validator with
its own preflight chain. Running them in the wrong order produces misleading
errors (e.g. docs fails only because criteria fails). A fixed order plus a
bounded loop keeps fixes cheap and prevents endless retries.

## 0. Inputs to resolve first

Resolve these from the user's message in natural language before doing anything:

1. `view` (optional): a view `id` from `docs/app-map/navigation.yaml`.
   Example: "the dashboard view" → `view=dashboard`.
2. `feature` (optional): a feature `name` within that view.
   Example: "dashboard Reports feature" → `view=dashboard, feature=Reports`.
   A feature without a view is ambiguous when two views share the feature name;
   ask or require `--view` in that case (same rule as `validate-code.ts`).
3. `only` (optional): explicit subset of points. Default is all five:
   `criterios, docs, estructura, code, test`. Accept Spanish or English names
   (`criterios/criteria`, `docs`, `estructura/structure`, `code`, `test`).
4. No scope at all means the whole project.

If any of view/feature/only is ambiguous, ask once with a short question and
then proceed. Do not guess a view id that does not exist in `navigation.yaml`.

## 1. Baseline run (always in this order)

Run the validators for the requested `only` subset in dependency order, so a
preflight failure explains downstream failures. Skip validators outside `only`,
but never reorder the ones you run:

1. `criterios` → `validate-criteria.ts`
2. `docs` → `validate-app-map-docs.ts` (preflight: criterios)
3. `estructura` → `validate-structure.ts` then `check-paths.ts`
   (preflight: criterios; no docs/test dependency)
4. `code` → `validate-code.ts` (preflight: estructura/check-paths)
5. `test` → `validate-tests.ts` (preflight: docs → criterios)

Run every command with `--json` so output is machine-readable, plus
`--view`/`--feature` when scoped. Keep the raw JSON of each run; it is the
evidence for the final report.

> If you need exact script paths, flags, preflight chains, or JSON output
> shapes, read `references/validators.md` in this skill directory before
> running anything.

Rules for the run:

- Use `bun <script>`, never `npx`/`node` wrappers.
- Run from the project root. Pass `--root DIR` only for another project root.
- A filtered run (`--view`/`--feature`) certifies only that scope, never the
  whole project. Say so in the report.
- Stop classifying a validator as "downstream noise" when its preflight fails:
  fix the preflight owner first (e.g. fix criterios before trusting docs).

## 2. Classify each failure

For every issue in the JSON output, assign one bucket:

- `missing-file`: expected `docs/app-map/<slug>/...`, `<view>.yaml`, or
  `criteria-map.yaml` absent.
- `mismatch`: ids, names, order, slugs, headings, or `test.type/status`
  enums do not match navigation.
- `paths`: `criteria-map.yaml` path missing on disk, absolute, with `..`,
  backslash, glob, or symlink.
- `markers`: `@<ID>` marker absent, in a string instead of a real comment,
  with extra text on the line, or in the wrong mapped path.
- `unclear`: anything you cannot map to the four buckets above.

Trivial `mismatch`/`missing-file` cases (one file, one id, obvious slug) you
may fix directly. Anything `unclear`, or any bucket spanning 3+ files, goes
through delegation below. The reason: direct edits on wide-scope failures tend
to diverge from navigation, which stays the single source of truth.

## 3. Investigate via delegation (only when needed)

When the cause is `unclear` or spans several files, delegate exactly one
investigation via `delegate` before touching code:

- Use the `delegate` tool with a general/explore subagent.
- The delegate prompt states: read-only, no edits; the scope (view/feature/only);
  the failing validator JSON pasted verbatim; return root cause + minimal file
  list + proposed patch plan referencing criterion ids.
- Wait for the result. If the plan contradicts `navigation.yaml` authority
  (e.g. proposes inventing criteria in Markdown or test YAML), discard it and
  re-delegate once with "navigation.yaml is the only source of truth".

Do not delegate investigation for obvious single-file fixes; that wastes a
round trip. Do not run investigation and implementation in parallel; the
implementation depends on the investigation result.

## 4. Implement via delegation (no SDD, always)

All non-trivial repairs go through a delegated implementation via `delegate`:

- Use the `delegate` tool with a general/build subagent.
- The delegate prompt states: implement the patch plan (or the trivial fix),
  preserve YAML block style and one-`status`-per-line in test YAMLs, preserve
  slug derivation, use native comment delimiters for markers with the exact
  payload `@<ID>` alone on its comment line, never edit generated JSON Schemas
  under `types/generated/`, never run `sdd/task` scripts, never change any
  task `phase`/`state`.
- For `test.status` changes, the implementer uses
  `test/scripts/update-test-status.ts` (atomic, scalar-only), never hand-edits
  block scalars (`|`/`>`).
- One implementation delegation per loop iteration. Batch all fixes for the
  current error set into that single delegation so the loop stays bounded.

Prohibited: SDD flow (`sdd/task`, proposal/spec/design/tasks, phase/state
transitions), inventing new criteria outside `navigation.yaml`, silently
picking a path on slug collision, rewriting whole files when a scalar edit
suffices.

## 5. Loop until green or budget spent

One iteration = implement (direct or delegated) + full re-run of §1 for the
same scope. After each re-run:

1. If all validators in scope exit 0 → done, write the report (§6).
2. Else if iterations < 5 → start the next iteration with the fresh JSON.
   Iteration 1 is the baseline (§1); you get up to 4 repair iterations.
3. Else (5 iterations spent, still red) → stop and write the report with
   `status: blocked`, listing remaining issues verbatim plus the last
   investigation finding.

Additional stop rules:

- A validator that passes stays passing: if a later iteration breaks it, the
  next iteration fixes the regression first.
- Never exceed 5 iterations per scope. Do not restart the counter by
  re-scoping; a narrower retry after a blocked full run is a new request.
- Never change `test.status` to `verde` to silence a validator. `verde` is
  set only via `update-test-status.ts` when its test genuinely passes.

## 6. Report structure

ALWAYS close with this exact template (values in Spanish or English matching
the user's language):

```markdown
## req-fixer report
- scope: view=<id|all> feature=<name|all> only=<list>
- iterations: <N>/5
- status: green | blocked
- validators:
  - criterios: pass|fail (<n> issues)
  - docs: pass|fail (<n> issues)
  - estructura: pass|fail (<n> issues)
  - code: pass|fail (<n> issues)
  - test: pass|fail (<n> issues)
- fixes applied: <file: what changed, one per line>
- remaining (only if blocked): <validator JSON issues verbatim>
```

Paste the report as your final message. Do not claim whole-project validity
from a filtered run.

## 7. SDD-orchestrated mode (only when invoked by sdd-orchestrator)

Use this mode only when invoked by `sdd-orchestrator` via `delegate`.

1. Resolved scope: take `view`/`feature`/`only` and the artifact folder path
   directly from the orchestrator prompt (resolved from `Task.app_map`).
   Do not apply §0 from natural language; do not ask clarifying questions.
   If a field is missing, stop as blocked with the received JSON as evidence.
2. Split by state (the prompt states the current state):
   - `p3_requirements`: fix `only=criterios,estructura,code,test`. NEVER
     write `docs/app-map/**/*.md`. Run §1–§5 with those four points only,
     in dependency order.
   - `p4_requirements_docs`: fix `only=docs` plus re-check `test`. Here
     `test: pass` is required before reporting green.
3. `test` semantics per state:
   - In `p3_requirements`, `test: deferred-docs`: if `validate-tests.ts`
     fails ONLY with the `docs prerequisite` issue, report `test:
     deferred-docs (<n> issues)`; it is not a fail and does not block F3.
     Any other `test` failure counts as normal `fail`.
   - In `p4_requirements_docs`, `test: pass` is mandatory: the same issue
     counts as `fail` and must be fixed through `only=docs`.
4. Reinforced prohibitions in this mode: never invoke `sdd/task/*`; never
   modify `phase`/`state`/`proposal_state`/`functional_state`/
   `requirements_fix`; never edit `types/generated/*`; never set
   `test.status=verde` without a real passing test (only via
   `update-test-status.ts`).
5. Artifact: besides the final §6 report in your message, write the raw JSON
   of each executed validator to `<artifact-folder>/p3_requirements.report.json`
   or `<artifact-folder>/p4_requirements_docs.report.json` per the state.
   Overwrite only the current state's file; never touch the other state's.
6. Budget: 5 iterations per state (§5), independent between F3 and F4.
   Exhausting F3 reports `status: blocked` without consuming F4's budget.
