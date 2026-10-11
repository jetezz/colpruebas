# Validators reference — req-fixer

Lookup table for the six validator scripts owned by the five requirements
points. Read this file when you need an exact command, flag matrix, preflight
chain, or JSON shape. The execution order lives in `SKILL.md` §1; this file
only details each command.

Base: paths relative to the skill package root `.agents/skills/projectctl2/`.

## Commands

```sh
# 1. criterios
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts [--root DIR] [--view ID] [--feature NAME] [--json]

# 2. docs (preflight: criterios)
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts [--root DIR] [--view ID] [--feature NAME] [--json]

# 3a. estructura projection (preflight: criterios)
bun .agents/skills/projectctl2/requirements/estructura/scripts/validate-structure.ts [--root DIR] [--json]

# 3b. estructura paths (preflight: validate-structure)
bun .agents/skills/projectctl2/requirements/estructura/scripts/check-paths.ts [--root DIR] [--json]

# 4. code (preflight: check-paths → validate-structure)
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts [--root DIR] [--view ID] [--feature NAME] [--json]

# 5. test (preflight: docs → criterios)
bun .agents/skills/projectctl2/requirements/test/scripts/validate-tests.ts [--root DIR] [--view ID] [--json]

# status writer (only way to change test.status)
bun .agents/skills/projectctl2/requirements/test/scripts/update-test-status.ts --ids=ID1,ID2 --status=sin-test|rojo|verde [--root DIR] [--json]
```

Notes:

- `validate-structure.ts` accepts no `--view`/`--feature`: it always checks
  the five area folders and five `criteria-map.yaml` files project-wide.
  Scope it by interpreting its JSON issues for your view, not by flags.
- `validate-tests.ts` accepts `--view` but no `--feature`: scope test fixes by
  view, then filter criteria inside the view's YAML.
- `--feature` without `--view` is ambiguous when two views share a feature
  name (`validate-criteria.ts`, `validate-code.ts`, docs validator). Pass both
  flags in that case.
- Every validator supports `--help`/`-h`. Unknown flags exit 2 (usage error),
  validation failures exit 1, success exits 0.
- A filtered run never certifies global uniqueness or full structure; only a
  flag-less run does.
- In SDD-orchestrated mode, `validate-structure.ts`/`check-paths.ts` always
  scan the whole project (no scope flags): filter their JSON to the Task scope;
  `validate-tests.ts` accepts no `--feature`: filter criteria inside the view.

## Preflight chain (why order matters)

- `docs` runs `validate-criteria.ts --json` first; on failure it stops with a
  `docs prerequisite` issue. Fix criterios, ignore the rest of docs output.
- `estructura` runs `validate-criteria.ts --json` first; same rule.
- `check-paths.ts` runs `validate-structure.ts` first; fix the projection
  before trusting path-existence errors.
- `code` runs `check-paths.ts --json` first; fix maps/paths before markers.
- `test` runs `validate-app-map-docs.ts --json` first (which itself preflights
  criterios); fix docs/criterios before test correspondence errors.

When a preflight fails, the downstream JSON is noise: report the preflight
owner as the real failure and skip classifying the rest.

## JSON output shapes

Validators print one JSON object with `--json`:

```json
{ "valid": false, "scope": "view:dashboard", "issues": [{ "path": "...", "message": "..." }] }
```

- `validate-criteria.ts` adds `globalUniquenessChecked: true|false`
  (false on filtered runs).
- `validate-tests.ts` adds `globalStructureChecked: true|false`.
- `validate-code.ts` issues may carry `criterionId`.
- `update-test-status.ts --json` reports per-file atomic writes; block scalars
  (`|`/`>`) are rejected before any write, and an already-correct `status`
  is left untouched.

## Error → bucket hints

- `unknown view ID` / `ambiguous` → wrong scope, re-resolve §0, do not edit.
- `slug collides` → two names map to one path; rename in `navigation.yaml`,
  never pick silently.
- `missing` file/dir under `docs/app-map/` → `missing-file`; derive the path
  with the slug function (NFKD → lowercase → `[^a-z0-9]`→`-`, trim `-`).
- `heading` / `canonical description` absent → `mismatch` in Markdown.
- `type`/`status` allowed-values → `mismatch` in test YAML or navigation.
- `extra`/`missing` criterion in test YAML or map → `mismatch`, fix toward
  navigation (navigation wins).
- path `absolute`, `..`, `backslash`, `glob`, `symlink`, `not found` →
  `paths` bucket in `criteria-map.yaml`.
- `marker` absent / `in string` / `extension without parser` → `markers`
  bucket. Supported parsers: `.ts .tsx .js .jsx .mts .cts .mjs .cjs` only.
  Other extensions fail explicitly and need a code-side decision, not a
  marker hack.
- `block scalar` from the status writer → file needs manual YAML reformat to
  single-line scalar before retry.
