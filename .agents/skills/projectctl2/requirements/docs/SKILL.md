---
name: projectctl2-docs
description: Use this skill when creating, reviewing, organizing, or validating project documentation under docs/app-map for projectctl2. Follow its navigation-dependent directory layout, slug rules, Markdown responsibilities, and docs validation command.
---

# Docs — projectctl2

## 2.1 Criteria dependency

1. Documentation under `docs/app-map/` depends on the criteria structure defined in `docs/app-map/navigation.yaml` by the [criterios skill](../criterios/SKILL.md).
2. Do not create or validate view, feature, or criterion documents before valid navigation exists. Navigation determines which folders and documents must exist.
3. `navigation.yaml` remains the sole source of truth for the hierarchy and criterion definitions. Markdown files explain the view and expand the criteria; they do not create new nodes or criteria.

### Shared navigation contract

Navigation contract: see [contracts-navigation](../references/contracts-navigation.md). Owned semantics: headings, content, slugs, and filesystem. Consumption: transitive via criterios preflight, see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption).

## 2.2 Document structure

For each navigation element, derive paths from its IDs and names; do not add manual paths in `navigation.yaml`.

```text
docs/app-map/
├── navigation.yaml
└── <view-id-slug>/
    ├── <view-id-slug>.md
    ├── <view-id-slug>.yaml  # optional; belongs to point 3 (test)
    └── <feature-name-slug>/
        └── <criterion-id-slug>.md
```

1. Provide one folder per view, named from the view ID, and a view Markdown inside it with the same base name.
2. Each view contains one folder per feature, named from the feature name. There is no dedicated Markdown for the feature.
3. Each criterion has a Markdown file inside its feature folder; the base name derives from the criterion ID.
4. Keep the folder of a feature even when its `criteria` list is empty.
5. The `<view-id-slug>.yaml` file is an optional extension of point 3 (test). Docs tolerates its presence but neither requires nor validates it.
6. Do not allow additional files or folders inside `docs/app-map/` outside the described structure, except `navigation.yaml` and the optional test manifest.

### 2.2.1 Slug derivation

Derive each path segment with the same deterministic function:

1. Normalize Unicode with NFKD and strip diacritic marks.
2. Convert to lowercase.
3. Replace each run of characters outside `[a-z0-9]` with a hyphen `-` and strip leading/trailing hyphens.
4. If the result is empty, the navigation cannot map to a path and must be reported as invalid.
5. If two different names produce the same path, validation fails on collision. Never overwrite or silently pick a path.

## 2.3 Markdown content

1. Start the view Markdown with `# <view name>` and explain the purpose and general behavior of the view.
2. Start the criterion Markdown with `# <criterion ID>` and include the canonical criterion description as it appears in `navigation.yaml`, plus a detailed explanation.
3. Define `type` only in `navigation.yaml`; do not replicate it as a source of truth in Markdown files.
4. Keep documents with non-empty explanatory content. Review explanation quality editorially; the validator checks shape, correspondence, and minimum verifiable content.

## 2.4 Documentation validator

The [`scripts/validate-app-map-docs.ts`](scripts/validate-app-map-docs.ts) script first runs the criterios preflight (see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption)); if criterios fails, docs stops. Then compare navigation against folders and files. Check derived names, existence, unexpected items, required headings, and the presence of the canonical description in the criterion Markdown. Tolerate the optional test manifest, but do not depend on it. Do not repair or write files.

```sh
bun .agents/skills/projectctl2/requirements/docs/scripts/validate-app-map-docs.ts
```

Supports `--view`, `--feature`, `--json`, and `--help`; a filtered run does not certify the full structure.
