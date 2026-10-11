---
name: projectctl2-structure
description: Use this skill when defining, reviewing, or validating the required project structure in projectctl2. The structure consists of the required area directories and per-type YAML maps that project navigation criteria to code paths.
---

# Estructura — projectctl2

## 4.1 Dependency

1. This point depends on criterios and `docs/app-map/navigation.yaml`; it does not depend on docs or test.
2. Preflight via criterios (see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption)). A project with criteria and structure is usable even without App Map documents or test manifests.
3. `navigation.yaml` is the source of truth for views, features, IDs, and types. Structure maps are projections of that hierarchy plus a code-path assignment.

## 4.2 Mandatory folders

Keep these five folders at the project root:

| Folder | Represented type |
|---|---|
| `frontend/` | `frontend` |
| `backend/` | `backend` |
| `data/` | `data` |
| `tooling/` | `tooling` |
| `utils/` | `utils` |

## 4.3 Per-type YAML maps

Each folder contains `criteria-map.yaml`. The file preserves the full view and feature hierarchy, but each feature lists only the criteria whose `type` matches that folder. Keep views and features without criteria of that type with `criteria: []`.

```yaml
# frontend/criteria-map.yaml
schema_version: 1
type: frontend
views:
  - id: dashboard
    features:
      - name: Dashboard
        criteria:
          - id: DASH-001
            paths:
              - frontend/src/dashboard/activity-summary.tsx
      - name: Reports
        criteria: []
```

1. Keep `view.id`, `feature.name`, and `criterion.id` nodes exactly matching `navigation.yaml` and preserve navigation order.
2. List each criterion in exactly one map: the one matching its `type`. Do not copy descriptions or types per criterion; the ID is the reference and `navigation.yaml` keeps authority over both.
3. Keep `paths` in each criterion record, a list of POSIX relative paths from the project root. It may include several paths; `paths: []` means no location has been assigned yet.
4. Paths must not be absolute, contain `..`, backslashes, globs, or escape the project root.
5. This structure is a traceability map; it does not require reproducing the `view/feature/criterion` folders inside the code. Code may follow its framework and architecture conventions.
6. The presence of a path does not prove that the behavior is implemented or covered by tests.

Owned contract: `CriteriaMapDocumentSchema` in `criteria-map.ts` → `criteria-map.schema.json`, validated with `validateDocument('criteria-map', data)`. Navigation contract: see [contracts-navigation](../references/contracts-navigation.md). Owned semantics: correspondence, order, filtering by `type`, and path safety. Consumption: direct + preflight via criterios, see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption).

## 4.4 Scripts

### Validate the criteria projection and folders

[`scripts/validate-structure.ts`](scripts/validate-structure.ts) verifies the five folders, the five YAML maps, and their exact correspondence with `navigation.yaml`. It does not query docs or test and does not write files.

```sh
bun .agents/skills/projectctl2/requirements/estructura/scripts/validate-structure.ts
```

### Check that the paths exist

[`scripts/check-paths.ts`](scripts/check-paths.ts) first validates the projection and then checks that each non-empty `paths` entry exists inside the project. Reject symlinks in the inspected paths and do not modify files.

```sh
bun .agents/skills/projectctl2/requirements/estructura/scripts/check-paths.ts
```

Supports `--json`; `--root DIR` and `--help` per the footer.

`--root DIR` points at another project; `--help` shows the options. The first script supports planning not-yet-existing locations with `paths: []`; the second validates the paths once assigned.
