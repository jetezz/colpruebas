---
name: projectctl2-requirements
description: Use this skill when defining, reviewing, or validating project requirements and criteria under projectctl2. It is the requirements core; load the specific numbered rule module relevant to the user's request and follow only rules that have been defined there.
---

# projectctl2 Requirements — core

Shared navigation contract: see [contracts-navigation](references/contracts-navigation.md).

## Points

- Point 1 — Criterios: load [`criterios/SKILL.md`](criterios/SKILL.md) when the work concerns criteria or `docs/app-map/navigation.yaml`.
- Point 2 — Docs: load [`docs/SKILL.md`](docs/SKILL.md) when it concerns documentation under `docs/app-map/`.
- Point 3 — Test: load [`test/SKILL.md`](test/SKILL.md) when it concerns per-criterion test records.
- Point 4 — Estructura: load [`estructura/SKILL.md`](estructura/SKILL.md) when it concerns area folders or path maps.
- Point 5 — Code: load [`code/SKILL.md`](code/SKILL.md) when it concerns criterion markers in code.

## Working method

1. Identify which numbered requirements area the request concerns.
2. Read that area's module before proposing or changing project artifacts.
3. Apply only rules currently recorded in this skill. Do not import rules from `projectctl-requirements` or the SDD satellite unless the user explicitly adopts them for projectctl2.
4. Keep each requirements area in its own folder, with that area's rules in its own `SKILL.md`, and link it from this entry point.
5. If a rule is ambiguous or conflicts with another rule, ask for clarification before treating an interpretation as normative.

Other core areas will be added as separate modules as they are defined.
