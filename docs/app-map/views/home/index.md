---
id: home
title: Inicio
kind: view
summary: >-
  Vista raiz de la landing con identidad del producto, tarjeta de estado y
  contexto temporal visible.
source_of_truth: app-map
criteria:
  - id: HOME-01
    type: functionality
    title: >-
      La aplicacion se identifica visiblemente apenas carga la landing con su
      nombre en el titulo del documento y en la tarjeta principal.
    functional: implemented
    evidence_paths:
      - frontend/src/pages/index.astro
      - tests/e2e/home/index.spec.ts
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Implementado en frontend/src/pages/index.astro (titulo + Header +
      InfoCard). Test PW-AUTO del titulo + tarjeta en
      tests/e2e/home/index.spec.ts con `@ac HOME-01`.
  - id: HOME-05
    type: functionality
    title: >-
      La carga inicial de la landing no produce errores de consola (browser
      console clean).
    functional: implemented
    evidence_paths:
      - frontend/src/pages/index.astro
      - tests/e2e/home/index.spec.ts
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Test PW-AUTO cubre `console.error` debe ser 0 al cargar / via networkidle
      en tests/e2e/home/index.spec.ts con `@ac HOME-05`.
---

## 1. URL

/

## 2. Tab

Landing principal (`/`).

## 3. Objetivo

Permite verificar en segundos que colpruebas esta arriba, que el entorno visible es el esperado y que la lectura tiene contexto operativo minimo.

## 4. Criterios de calidad

Este bundle conserva solo los criterios propios de la landing. `home-status-summary` es la autoridad única para `HSS-01..HSS-04`, y `home-runtime-metadata` para `HRM-01..HRM-02`; esos comportamientos no se duplican aquí.

| ID | Nivel | Cubre |
|---|---|---|
| HOME-01 | obligatorio | Identidad visible de la aplicacion en la portada |
| HOME-05 | obligatorio | Carga principal sin errores visibles |

## 5. Diagrama Mermaid

El sibling `index.mmd` separa visualmente la identidad, el resumen de estado y los metadatos que conviven en la misma pantalla.
