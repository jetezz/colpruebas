---
name: projectctl2-code
description: Use this skill when adding or validating criterion-ID markers in implementation code under projectctl2. It verifies markers in source comments at code paths mapped by the structure point and supports view/feature-scoped checks.
---

# Code — projectctl2

## 5.1 Dependency

1. Code depends on point 4: `criteria-map.yaml` assigns criteria to implementation paths.
2. Paths/estructura preflight (see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption)). It does not depend on docs or test.
3. `navigation.yaml` is the source of truth for IDs and hierarchy; the per-type map determines where to search. Code does not create criteria or paths.

### Shared contracts consumed by code

Navigation and per-type map contract: see [contracts-navigation](../references/contracts-navigation.md). Owned semantics: scope, ID resolution, and marker presence. Consumption: transitive via `validate-code.ts` → paths/estructura preflight, see [direct and transitive consumption](../references/contracts-navigation.md#direct-and-transitive-consumption).

## 5.2 Criterion marker

This point requires each criterion to carry its ID as a comment inside the corresponding code. The marker content is the exact ID, prefixed with `@`:

```ts
// @DASH-001
export function renderActivitySummary() {
  // implementation
}
```

Use the native comment delimiter of each language and keep the same `@<ID>` payload:

```python
# @DASH-001
def render_activity_summary():
    ...
```

```sql
-- @SET-002
CREATE FUNCTION update_preferences() ...
```

1. The ID must exist exactly in `navigation.yaml`; the comparison is case-sensitive.
2. Keep the marker as the full content of a comment line, with no added description, for example `// @DASH-001`.
3. Do not place the marker in a string, documentation string, or any non-code-comment text.
4. Keep the marker in the code under the path assigned to the criterion in `criteria-map.yaml`. Repeat the marker when the same criterion has several implementation points requiring traceability.
5. The marker is a code locator, not by itself evidence of correct behavior or a passing test.

## 5.3 Checker

[`scripts/validate-code.ts`](scripts/validate-code.ts) reads navigation and the structure maps, resolves the scope, and checks that each criterion path contains its marker inside a real comment. It accepts file or directory paths; for a directory at least one source file must carry the marker. If the criterion has no paths, it fails because there is no code to check.

The currently enabled parsers are TypeScript, TSX, JavaScript, and JSX (`.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.mjs`, `.cjs`). Use the TypeScript scanner to distinguish real comments from string content. Fail explicitly on an extension without a configured parser; do not accept it as verified.

```sh
bun .agents/skills/projectctl2/requirements/code/scripts/validate-code.ts
```

Supports `--view`, `--feature`, `--root`, `--json`, and `--help`; specifying `--view` disambiguates repeated features.
