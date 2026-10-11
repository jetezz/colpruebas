# Shared navigation contract

Canonical source of the navigation contract for the 5 requirements points. No `SKILL.md` duplicates it; all link here.

## Contents

- [Canonical contract](#canonical-contract)
- [What each layer validates](#what-each-layer-validates)
- [Direct and transitive consumption](#direct-and-transitive-consumption)

## Canonical contract

- Canonical Zod: `NavigationDocumentSchema` in `types/contracts/navigation.ts`; it infers the `NavigationDocument` type in that same module.
- Derived JSON Schema Draft 2020-12: `types/generated/navigation.schema.json`. Do not hand-edit the generated JSON.
- Runtime: parse `docs/app-map/navigation.yaml` and validate with `validateDocument('navigation', data)` from `types/scripts/schema-validator.ts`.
- Generated human reference: `requirements/contracts.md` (via `types/scripts/generate-contract-docs.ts`); it lists fields, types, and constraints.
- TypeScript types alone do not validate YAML. The parser must reject syntactically invalid YAML.

## What each layer validates

- JSON Schema covers structure, fields, and local constraints.
- Semantic rules stay in their owning validators: global uniqueness of view and criterion IDs, no view↔criterion collision, view → feature → criterion hierarchy, homonymous feature per view, membership and order, slugs and paths, document and test correspondence, filtering by `type`, path safety and existence, marker presence.
- When a point consumes a shared contract, its skill names the canonical schema, inferred type, and module, the validation path (direct or transitive), and its own semantic checks. The shared catalog is `types/`.

## Direct and transitive consumption

- `criterios`: direct consumption of `navigation.schema.json` / `NavigationDocument` via `validate-criteria.ts` → `schema-validator.ts`.
- `docs`: transitive consumption via preflight `validate-app-map-docs.ts` → `validate-criteria.ts`; it rereads navigation for slugs and filesystem. The schema does not validate Markdown body.
- `test`: direct consumption of `test-view.schema.json` / `TestViewDocument` plus navigation authority; transitive preflight docs → criterios.
- `estructura`: direct consumption of `criteria-map.schema.json` / `CriteriaMapDocument` plus navigation authority; preflight via criterios. It does not depend on docs or test.
- `code`: transitive consumption via `validate-code.ts` → paths/estructura preflight → `structure-contract.ts`; own scope and marker rules.
