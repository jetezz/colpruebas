---
name: projectctl2-test
description: Use this skill when defining, organizing, checking, or updating test records for criteria in projectctl2. Follow the per-view YAML contract, criterion correspondence rules, status/type enums, and status update scripts.
---

# Test — projectctl2

## 3.1 Dependencies

1. The test point depends on criterios and docs. Preflight: see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption); it requires no separate manual run.
2. Navigation in `docs/app-map/navigation.yaml` is the authority for views, features, and criteria. Test YAML only adds test information; it does not create or remove elements of that hierarchy.

## 3.2 Location and structure

Each view has a test file next to its view Markdown, inside its App Map folder:

```text
docs/app-map/<view-id-slug>/
├── <view-id-slug>.md
├── <view-id-slug>.yaml
└── <feature-name-slug>/
    └── <criterion-id-slug>.md
```

The YAML file follows the feature and criterion hierarchy of `navigation.yaml`. Represent each criterion exactly once and add a `test` record:

```yaml
schema_version: 1
features:
  - name: Dashboard
    criteria:
      - id: DASH-001
        test:
          type: UNIT
          status: sin-test
```

1. `features[].name` exactly matches the name of each navigation feature of that view.
2. Each feature contains exactly the same criterion IDs as `navigation.yaml`; there must be no missing, extra, or duplicated criteria.
3. Every criterion has a single `test`, with mandatory `type` and `status`.
4. `test.type` accepts `PW-AUTO` or `UNIT`.
5. `test.status` accepts `sin-test`, `rojo`, or `verde`. `type` remains mandatory even with `sin-test`.
6. Use YAML block style and one `status` field per line, as in the example, so the updater can modify only the scalar and preserve the rest of the file.

Owned contract: `TestViewDocumentSchema` in `test-view.ts` → `test-view.schema.json`, validated with `validateDocument('test-view', data)`. Navigation contract: see [contracts-navigation](../references/contracts-navigation.md). Owned semantics: feature and ID equality and textual update. Consumption: direct + transitive preflight docs → criterios, see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption).

## 3.3 Scripts

### Validate the test records

[`scripts/validate-tests.ts`](scripts/validate-tests.ts) checks that the YAML of each view exists and that its features, criteria, types, and states exactly match navigation.

```sh
bun .agents/skills/projectctl2/requirements/test/scripts/validate-tests.ts
```

Supports `--view`, `--json`, and `--help`; the dual navigation + test-view consumption is detailed in the canonical contract.

### Update states for several criteria

[`scripts/update-test-status.ts`](scripts/update-test-status.ts) takes a comma-separated list and a new status:

```sh
bun .agents/skills/projectctl2/requirements/test/scripts/update-test-status.ts --ids=DASH-001,SET-002 --status=verde
```

Validate all target IDs and files before writing. Change only simple or quoted `status` scalars on their own line, preserve the remaining bytes, comments, and formatting, and do not rewrite a file whose state already matches. Reject block scalars (`|`/`>`, with their optional indicators) as non-updatable before writing. Do not change `type` or other fields. If an ID is missing, ambiguous, or a file does not meet the updatable format, do not start writes.

Supports `--root DIR` for another project root, `--json` for structured output, and `--help` for help. Save changes atomically per file.
