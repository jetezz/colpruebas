---
id: home-runtime-metadata
title: Metadatos de ejecución
kind: feature
summary: >-
  Referencias visibles de rama git y timestamp para contextualizar la ejecución
  mostrada en la landing.
source_of_truth: app-map
criteria:
  - id: HRM-01
    type: ui
    title: >-
      La tarjeta muestra una referencia visible de la rama git para
      contextualizar la ejecucion observada.
    functional: implemented
    evidence_paths:
      - frontend/src/components/Footer.astro
      - tests/e2e/home/index.spec.ts
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Renderizado por InfoCard.astro (`Rama Git:` + `gitBranch`). En este
      proyecto de ejemplo el valor es constante (`MAIN`); el contrato
      documentado es la presencia de la referencia, no la resolucion dinamica
      del branch. Cubierto por tests/e2e/home/index.spec.ts con `@ac HRM-01`.
  - id: HRM-02
    type: ui
    title: >-
      El timestamp visible en el pie de la landing esta en formato ISO 8601 y
      refleja el momento del render SSR, no del cliente.
    functional: implemented
    evidence_paths:
      - frontend/src/components/Footer.astro
      - tests/e2e/home/index.spec.ts
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Footer.astro consume `new Date().toISOString()` en el servidor. El spec
      persistente verifica el formato ISO 8601 con `@ac HRM-02`.
---

## 1. URL

/

## 2. Tab

Landing principal (`/`).

## 3. Objetivo

Ayuda a distinguir rapidamente el contexto operativo sin tener que inspeccionar configuracion interna ni salir de la landing.

## 4. Criterios de calidad

| ID | Nivel | Cubre |
|---|---|---|
| HRM-01 | esperado | Referencia de rama git visible en la tarjeta principal |
| HRM-02 | deseado | Timestamp ISO 8601 visible en el pie |

## 5. Diagrama Mermaid

El sibling `runtime-metadata.mmd` representa la referencia de rama y el timestamp visibles.

## 6. Sources

- Implementación: `frontend/src/pages/index.astro` y `frontend/src/components/Footer.astro`
- Cobertura: `tests/e2e/home/index.spec.ts`
- Navegación: `docs/app-map/navigation.yaml`
