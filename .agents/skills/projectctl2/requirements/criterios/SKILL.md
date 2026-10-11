---
name: projectctl2-criterios
description: Use this skill when defining, reviewing, organizing, or validating project criteria in docs/app-map/navigation.yaml under projectctl2. Follow its rules for the view-feature-criteria hierarchy, criterion fields, and criteria validation.
---

# Criterios — projectctl2

## 1.1 Source of truth and structure

1. `docs/app-map/navigation.yaml` is the project's sole source of truth for views, their features, and the associated criteria.
2. The document represents a hierarchy of exactly three levels: **view → feature → criterion**. Do not add intermediate levels or store criteria outside a feature.
3. Each view has a unique `id` and a readable name (`name`). View IDs and criterion IDs share the same global uniqueness space.
4. Each view has a `features` list. Include at least one feature whose `name` exactly equals the view's `name`; that feature represents the view's own criteria.
5. Each feature belongs to a single view and contains a `criteria` list, which may be empty. Each criterion belongs to a single feature; there are no dangling criterion references and no features without a view.
6. Features have no global ID: identify them by their `name` within the owning view. The feature name must be unique within a single view; the same name may appear in different views.
7. View and criterion IDs are stable identifiers for referencing from the rest of the project. The numbers in the initial example were illustrative, not a required format.

### 1.1.1 YAML format

Prefer explicit lists and nested objects, using YAML 1.2.2 as the serialization format. The example fixes the data shape, not mandatory IDs:

```yaml
schema_version: 1
views:
  - id: dashboard
    name: Dashboard
    features:
      - name: Dashboard
        criteria:
          - id: DASH-001
            description: The view shows the activity summary.
            type: frontend
      - name: Reports
        criteria:
          - id: DASH-002
            description: The user can consult a report.
            type: frontend
```

The shape uses mappings for objects and sequences for ordered collections, native YAML primitives. The order of `views`, `features`, and `criteria` preserves the desired presentation order; it does not determine identity.

### 1.1.2 Format validation contract

Navigation contract: see [contracts-navigation](../references/contracts-navigation.md). Owned semantics: global uniqueness, homonymous feature, and membership. Consumption: direct, see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption).

## 1.2 Criterion fields

Each criterion has these three parameters:

1. **ID:** non-empty text, unique within the navigation and without collision with view IDs.
2. **Description:** description of the criterion.
3. **Type:** one of the allowed types: `frontend`, `backend`, `data`, `tooling`, or `utils`.

## 1.3 Criteria validation

Provide a simple script that reads `docs/app-map/navigation.yaml` and checks that:

1. View IDs are unique among themselves.
2. Criterion IDs are unique among themselves and do not collide with any view ID.
3. Criterion types belong to the allowed list in section 1.2.
4. The mandatory view → feature → criterion structure holds, including the feature whose name matches each view and the membership of each feature/criterion in its parent.
5. Validation can be limited to a view or a feature via script options. Full validation still checks global uniqueness; a scoped run must not assert project-wide uniqueness if it has not checked it.

Available implementation: [`scripts/validate-criteria.ts`](scripts/validate-criteria.ts).

```sh
bun .agents/skills/projectctl2/requirements/criterios/scripts/validate-criteria.ts
```

Supports `--view` and `--feature` (see `--help`).

The YAML syntax and the JSON Schema used are based on published standards: YAML 1.2.2 defines mappings, sequences, and scalars; JSON Schema Draft 2020-12 describes and validates the structure of the parsed data. Sources: [YAML 1.2.2, chapters 2–3](https://yaml.org/spec/1.2.2/) and [JSON Schema: Creating your first schema](https://json-schema.org/learn/getting-started-step-by-step).
