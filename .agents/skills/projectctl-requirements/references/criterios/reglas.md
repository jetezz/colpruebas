---
file: references/criterios/reglas.md
parent_skill: projectctl-requirements
owner: documentation maintenance
tab: criterios
criteria_covered: [PCT-169, PCT-170, PCT-171, PCT-172, PCT-173, PCT-174, PCT-175]
last-verified: 2026-09-28
---

# Criterios — reglas (tab Criterios, PCT-169..PCT-175)

Autoridad normativa de la tab Criterios tras el split por secciones. La
autoridad de identidad, título, tipo y estado de cada criterio permanece
inline en el bundle de la instancia destino (instancia origen:
`docs/app-map/views/projectctl/features/criterios.md`, no portable); este
archivo cita, resume en 1–2 líneas y no define criterios, enums, mapping,
coverage ni machine values.

> **Contratos machine residentes**: `references/app-map/criteria.yaml`
> (manifiesto de criterios) y `references/app-map/coverage-ledger.yaml`
> (ledger de evidencia) NO se mueven: son contratos machine residentes en
> `references/app-map/` y aquí solo se citan. Igual para
> `references/schemas/`. La referencia nunca sustituye el bundle, el
> manifest, el ledger ni los checks que los validan. Convención vigente:
> cita-no-copia con `SoT original` + `Cumple` + `last-verified` por entry.

## Requisito: Tab criterios y routing

> **SoT original**: bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/index.md`, no portable) + contrato de tabs local `integration-tests/projectctl/bundle-contracts.test.ts`.
> **Cumple**: PCT-169.
> **last-verified**: 2026-09-27.

La referencia traza la tab `criterios`, su posición y el comportamiento
fail-closed del resolver; la definición autoritativa y sus escenarios viven
en el bundle inline y las fuentes citadas.

## Requisito: Autoridad inline e índice derivado

> **SoT original**: bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/index.md`, no portable) + `.agents/skills/projectctl-requirements/references/standard.md` + Contrato portable: `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-criteria-integrity.test.ts`.
> **Cumple**: PCT-170.
> **last-verified**: 2026-09-27.

El bundle inline es la fuente de los criterios; esta entrada solo mantiene
trazabilidad cita-no-copia y no crea una segunda autoridad.

## Requisito: Enums y mapping preservados

> **SoT original**: bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/index.md`, no portable) + `.agents/skills/projectctl-requirements/references/estructura/reglas.md` + schema portable `.agents/skills/projectctl-requirements/references/schemas/criteria.schema.json` (tipos cerrados).
> **Cumple**: PCT-171.
> **last-verified**: 2026-09-28.

La entrada traza el enum vigente de 9 valores (T-1, autoridad
`references/standard.md` §1 con árbol T-5 y verificación por defecto) y
remite los siete valores PCT históricos a su mapping de migración en
`references/estructura/reglas.md`; no republica catálogos ni redefine
enums.

## Requisito: Ledger de coverage separado (concepto)

> **SoT original**: bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/features/criterios.md`, no portable) + `.agents/skills/projectctl-requirements/references/app-map/coverage-ledger.yaml` + `.agents/skills/projectctl-requirements/references/standard.md` §2 + Contrato portable: `.agents/skills/projectctl-requirements/scripts/__tests__/projectctl-criteria-integrity.test.ts`.
> **Cumple**: PCT-172.
> **last-verified**: 2026-09-27.

La referencia distingue evidencia de definición de criterio y remite al
ledger separado residente en `references/app-map/coverage-ledger.yaml`, sin
convertirlo en fuente de `criteria[]`. `entries: []` sigue siendo un estado
válido para este ledger de evidencia: el write-back V2 del runner
gestionado, cuando se acepta, actualiza `criteria[].coverage` del bundle, NO
inventa filas en el ledger de la skill. La ausencia de writer para el ledger
no implica ausencia del writer de resultados del sandbox. El estado de la
entrada del ledger (`recorded` | `incomplete` | `overridden` | `rejected`) y
su resultado (`pass` | `fail` | `incomplete` | `not-run`) son el eje del
evento de evidencia; el estado de cobertura del criterio (`covered` |
`partial` | `missing` | `not-applicable`) es el eje de la definición y vive
solo en `criteria[]`. Un valor del primer eje nunca se escribe en el
segundo. `docs-check` es un quinto método válido solo dentro del ledger para
evidencia documental; no forma parte del cuarteto canónico de métodos de
cobertura (`Unit` | `PW-CLI` | `PW-AUTO` | `Manual`) y su proyección
equivale a `Unit`.

## Requisito: Sources de la tab

> **SoT original**: bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/features/criterios.md`, no portable) + contrato de tabs local `integration-tests/projectctl/bundle-contracts.test.ts` + template e2e local `tests/e2e/demo-projectctl/tabs-contract.template.ts`.
> **Cumple**: PCT-173.
> **last-verified**: 2026-09-27.

La entrada traza el aside de sources y sus referencias navegables; no copia
tablas, binding, enums ni contenido del ledger.

## Requisito: Generación y coherencia del bundle

> **SoT original**: bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/features/criterios.md` + `docs/app-map/views/projectctl/features/criterios.mmd`, no portable) + integración local de proyecciones `scripts/projectctl-docs-core.ts` (instancia, no portable) + `.agents/skills/projectctl-requirements/scripts/__tests__/doctor-docs.test.ts` (contrato de bundles del core).
> **Cumple**: PCT-174.
> **last-verified**: 2026-09-27.

La referencia señala el par generado, el contrato documental y la coherencia
de navegación/proyecciones; el generador y sus checks son la autoridad
operativa.

## Requisito: Check semántico de calidad de criterios

> **SoT original**: bundle de la instancia destino (instancia origen: `docs/app-map/views/projectctl/index.md`, no portable) + `.agents/skills/projectctl-requirements/references/app-map/criteria.yaml` + Contrato portable: `.agents/skills/projectctl-requirements/scripts/skill/projectctl-criteria-integrity.ts` + wrapper local `<repo>/scripts/...` (proveído por el destino, evidencia de la instancia).
> **Cumple**: PCT-175.
> **last-verified**: 2026-09-27.

La entrada traza el comando `projectctl criteria check` y su mapping
`REQ-CRITQA-001 ↔ PCT-175`; la definición normativa permanece inline en el
bundle owner.

---

**Criterios cubiertos por este archivo**: `PCT-169..PCT-175`.

**Regla de mantenimiento**: si cambia una SoT citada, actualizar solo las
entries afectadas y su `last-verified`; no convertir esta referencia derivada
en fuente normativa. La convención de markers de código (`@criterion`,
`@trace`, `@contract`, `@ac`) vive en `references/code/reglas.md`, no aquí.
