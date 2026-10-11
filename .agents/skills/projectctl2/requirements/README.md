# projectctl2 — Requirements

This directory contains the `projectctl2-requirements` core skill. Each core point lives in its own folder with its own `SKILL.md`; the root skill routes to the matching point. Only the rules agreed and documented in those skills are normative for `projectctl2`.

## Current structure

- [`SKILL.md`](SKILL.md) — core entry point and usage rules.
- [`criterios/SKILL.md`](criterios/SKILL.md) — point 1: criteria.
- [`criterios/scripts/validate-criteria.ts`](criterios/scripts/validate-criteria.ts) — criteria validator.
- [`docs/SKILL.md`](docs/SKILL.md) — point 2: App Map documentation.
- [`docs/scripts/validate-app-map-docs.ts`](docs/scripts/validate-app-map-docs.ts) — documentation validator.
- [`test/SKILL.md`](test/SKILL.md) — point 3: test type and status per criterion.
- [`test/scripts/validate-tests.ts`](test/scripts/validate-tests.ts) — test manifest validator.
- [`test/scripts/update-test-status.ts`](test/scripts/update-test-status.ts) — selective status update.
- [`estructura/SKILL.md`](estructura/SKILL.md) — point 4: mandatory folders and per-type criteria maps.
- [`estructura/scripts/validate-structure.ts`](estructura/scripts/validate-structure.ts) — validates folders and YAML projections.
- [`estructura/scripts/check-paths.ts`](estructura/scripts/check-paths.ts) — checks that mapped paths exist.
- [`code/SKILL.md`](code/SKILL.md) — point 5: `@<ID>` markers in code comments.
- [`code/scripts/validate-code.ts`](code/scripts/validate-code.ts) — checks markers inside paths by view/feature.
- [`../sdd/`](../sdd/) — `projectctl2` SDD satellite folder, under separate development.

## Criteria validator

Run the commands from the project root containing `docs/app-map/navigation.yaml`:

```sh
# Validate the full project
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts

# Limit to one view
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts --view=dashboard

# Limit to one feature inside a view
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts --view=dashboard --feature=Reports

# Limit by feature name when it is unique in the project
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts --feature=Reports

# Use another project root and emit JSON
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts --root=/path/to/project --json

# Show the options
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts --help
```

The feature name may repeat across views; in that case use `--view` to disambiguate. A filtered validation reports that it has not checked the project's global ID uniqueness.

## Documentation validator

The docs validator first runs the criteria validator and stops on errors. Docs does not require the point-3 test YAML files. Run from the project root containing `docs/app-map/navigation.yaml`:

```sh
# Validate all App Map documents
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts

# Limit to one view or feature
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts --view=dashboard
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts --view=dashboard --feature=Reports

# Use another project root, JSON output, or help
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts --root=/path/to/project --json
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts --help
```

Filters accept repeated feature names only when their view is also specified. A filtered validation does not certify the full document structure.

## Dependent skills: test

The scripts reinforce the chain automatically: the docs validator calls criterios and the test validator calls docs. The status updater also requires valid docs/criteria before writing. The full contract is in [`test/SKILL.md`](test/SKILL.md).

```sh
# Validate all test YAML files
bun .agents/skills/projectctl2/requirements/test/scripts/validate-tests.ts

# Validate one view
bun .agents/skills/projectctl2/requirements/test/scripts/validate-tests.ts --view=dashboard

# Change the state of several criteria (values: sin-test, rojo, verde)
bun .agents/skills/projectctl2/requirements/test/scripts/update-test-status.ts --ids=DASH-001,SET-002 --status=verde

# Show help
bun .agents/skills/projectctl2/requirements/test/scripts/update-test-status.ts --help
```

## Per-type structure

Structure depends on criteria but does not require docs or test. The five example maps live in `frontend/`, `backend/`, `data/`, `tooling/`, and `utils/`.

```sh
# Validate folders and map correspondence with navigation.yaml
bun .agents/skills/projectctl2/requirements/estructura/scripts/validate-structure.ts

# Also check that non-empty paths are present in the project
bun .agents/skills/projectctl2/requirements/estructura/scripts/check-paths.ts

# Show options
bun .agents/skills/projectctl2/requirements/estructura/scripts/validate-structure.ts --help
bun .agents/skills/projectctl2/requirements/estructura/scripts/check-paths.ts --help
```

Criteria without an assigned implementation location keep `paths: []`. The `frontend/` and `backend/` maps show paths to the marker examples; `check-paths.ts` verifies that the paths exist.

## Code traceability

Point 5 first validates structure/paths and then checks the `@<ID>` marker in real comments of the mapped files. It supports view and feature filters:

```sh
# Validate all criteria with assigned paths
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts

# Limit to one view or feature
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts --view=dashboard
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts --view=dashboard --feature=Reports

# JSON or help
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts --json
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts --help
```

The example includes markers in `frontend/examples/criterion-markers.tsx` and `backend/examples/criterion-markers.ts`; marker-shaped text inside a string does not count.
