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
      La tarjeta muestra la rama git real de la ejecucion (resuelta por
      entorno/rama via PUBLIC_GIT_BRANCH con fallback documentado a develop)
      para contextualizar la ejecucion observada.
    functional: implemented
    evidence_paths:
      - frontend/src/pages/index.astro
      - frontend/src/components/InfoCard.astro
      - tests/e2e/home/index.spec.ts
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Renderizado por InfoCard.astro (`Rama Git:` + `gitBranch`) con valor
      resuelto en SSR por frontend/src/pages/index.astro desde
      `PUBLIC_GIT_BRANCH` con fallback documentado a `develop`
      (`import.meta.env.PUBLIC_GIT_BRANCH || "develop"`; inyeccion via
      compose dev/prod + `Dockerfile.prod` ARG/ENV, firma en `.env.example`).
      Contrato HRM-01 AFTER: la tarjeta muestra la rama git real de la
      ejecucion para contextualizar la ejecucion observada. Fallback
      `PUBLIC_ENVIRONMENT` ausente/vacio → `test` documentado como contexto de
      entorno. Cubierto por tests/e2e/home/index.spec.ts con `@ac HRM-01`.
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

La rama se resuelve en SSR desde `PUBLIC_GIT_BRANCH` con fallback `develop`
(ausente/vacio → `develop`); el entorno se resuelve desde
`PUBLIC_ENVIRONMENT` con fallback `test`. Inyeccion: `compose/compose.prod.yml`
y `compose/compose.dev.yml` + `frontend/Dockerfile.prod` (`ARG/ENV`); firma en
`.env.example`; tipado en `frontend/src/env.d.ts`.

## 4. Criterios

| ID | Nivel | Título (AFTER aprobado) |
|---|---|---|
| HRM-01 | esperado | La tarjeta muestra la rama git real de la ejecucion (resuelta por entorno/rama via PUBLIC_GIT_BRANCH con fallback documentado a develop) para contextualizar la ejecucion observada. |
| HRM-02 | deseado | El timestamp visible en el pie de la landing esta en formato ISO 8601 y refleja el momento del render SSR, no del cliente. |

## 5. Diagrama Mermaid

El sibling `runtime-metadata.mmd` representa la referencia de rama y el timestamp visibles.

## 6. Sources

- Implementación: `frontend/src/pages/index.astro` y `frontend/src/components/InfoCard.astro` (rama) + `frontend/src/components/Footer.astro` (timestamp)
- Firma env: `.env.example` (`PUBLIC_ENVIRONMENT`, `PUBLIC_GIT_BRANCH` + fallbacks `test`/`develop`); tipado `frontend/src/env.d.ts`
- Cobertura: `tests/e2e/home/index.spec.ts`
- Navegación: `docs/app-map/navigation.yaml`
