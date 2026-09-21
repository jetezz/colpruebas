# Requirements — Tab Criterios

Índice derivado y portable de los criterios del apartado `criterios`. La autoridad permanece inline en `docs/app-map/views/projectctl/features/criterios.md`; este archivo cita, resume en 1–2 líneas y no define criterios, enums, mapping, coverage ni machine values.

Cada entry usa el contrato de citación de la skill: `SoT original`, `Cumple` y `last-verified`. La referencia no sustituye el bundle, el manifest, el ledger ni los checks que los validan.

## Requisito: Tab criterios y routing

> **SoT original**: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/index.md` + `frontend/src/views/projectctl/lib/resolve-tab.ts` + `tests/e2e/projectctl/tabs.spec.ts`.
> **Cumple**: PCT-169.
> **last-verified**: 2026-09-20.

La referencia traza la tab `criterios`, su posición y el comportamiento fail-closed del resolver; la definición autoritativa y sus escenarios viven en el bundle inline y las fuentes citadas.

## Requisito: Autoridad inline e índice derivado

> **SoT original**: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/index.md` + `.agents/skills/projectctl-requirements/references/decisions.md` D-3/D-5 + `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`.
> **Cumple**: PCT-170.
> **last-verified**: 2026-09-20.

El bundle inline es la fuente de los criterios; esta entrada solo mantiene trazabilidad cita-no-copia y no crea una segunda autoridad.

## Requisito: Enums y mapping preservados

> **SoT original**: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/index.md` + `.agents/skills/projectctl-requirements/references/estructura.md` + `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`.
> **Cumple**: PCT-171.
> **last-verified**: 2026-09-20.

La entrada apunta a la explicación separada de las taxonomías y al mapping vigente; no republica sus catálogos ni modifica enums.

## Requisito: Ledger de coverage separado

> **SoT original**: `docs/app-map/views/projectctl/features/criterios.md` + `.agents/skills/projectctl-requirements/references/app-map/coverage-ledger.yaml` + `.agents/skills/projectctl-requirements/references/standard.md` §2 + `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`.
> **Cumple**: PCT-172.
> **last-verified**: 2026-09-20.

La referencia distingue evidencia de definición de criterio y remite al ledger separado, sin convertirlo en fuente de `criteria[]`.

## Requisito: Sources de la tab

> **SoT original**: `docs/app-map/views/projectctl/features/criterios.md` + `frontend/src/views/projectctl/ui/TabSources.tsx` + `frontend/src/views/projectctl/ui/CriteriaTabPanel.tsx` + `tests/e2e/projectctl/tabs.spec.ts`.
> **Cumple**: PCT-173.
> **last-verified**: 2026-09-20.

La entrada traza el aside de sources y sus referencias navegables; no copia tablas, binding, enums ni contenido del ledger.

## Requisito: Generación y coherencia del bundle

> **SoT original**: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/features/criterios.mmd` + `scripts/projectctl-docs.ts` + `frontend/__tests__/projectctl-doc-bundle.test.ts`.
> **Cumple**: PCT-174.
> **last-verified**: 2026-09-20.

La referencia señala el par generado, el contrato documental y la coherencia de navegación/proyecciones; el generador y sus checks son la autoridad operativa.

## Requisito: Check semántico de calidad de criterios

> **SoT original**: `docs/app-map/views/projectctl/index.md` + `.agents/skills/projectctl-requirements/references/app-map/criteria.yaml` + `scripts/projectctl-criteria-integrity.ts` + `scripts/projectctl-criteria-integrity.test.ts`.
> **Cumple**: PCT-175.
> **last-verified**: 2026-09-21.

La entrada traza el comando `projectctl criteria check` y su mapping `REQ-CRITQA-001 ↔ PCT-175`; la definición normativa permanece inline en el bundle owner.

---

**Criterios cubiertos por este archivo**: `PCT-169..PCT-175`.

**Regla de mantenimiento**: si cambia una SoT citada, actualizar solo las entries afectadas y su `last-verified`; no convertir esta referencia derivada en fuente normativa.
