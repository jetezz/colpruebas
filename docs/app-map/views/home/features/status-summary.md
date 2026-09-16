---
id: home-status-summary
title: Resumen de estado
kind: feature
summary: >-
  Tarjeta principal que comunica nombre de la aplicacion y estado visible de
  frontend, API y referencia de rama.
source_of_truth: app-map
criteria:
  - id: HSS-01
    type: ui
    title: >-
      El nombre de la aplicacion es visible dentro de la tarjeta central
      `Resumen de estado` con la etiqueta `Aplicacion:`.
    functional: implemented
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
    notes: Cubierto por tests/e2e/home/index.spec.ts con `@ac HSS-01`.
  - id: HSS-02
    type: ui
    title: >-
      El estado del frontend se muestra dentro de la misma tarjeta, alineado a
      la derecha del label `Frontend:` y diferenciado por entorno.
    functional: implemented
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
    notes: >-
      Cubierto por tests/e2e/home/index.spec.ts con `@ac HSS-02`; el estilo de
      color por entorno vive en InfoCard.astro.
  - id: HSS-03
    type: ui
    title: >-
      El estado de la API se muestra dentro de la tarjeta con la etiqueta `API:`
      y replica el patron de color por entorno.
    functional: implemented
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
    notes: Cubierto por tests/e2e/home/index.spec.ts con `@ac HSS-03`.
  - id: HSS-04
    type: ui
    title: >-
      Una referencia de rama git se renderiza con la etiqueta `Rama Git:` en la
      misma tarjeta.
    functional: implemented
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
    notes: >-
      Cubierto por tests/e2e/home/index.spec.ts con `@ac HSS-04`. Este bundle es
      autoridad para el rendering de la fila; el valor se documenta en
      home-runtime-metadata.
---

## 1. URL

/

## 2. Tab

Landing principal (`/`).

## 3. Objetivo

Reduce la incertidumbre inicial y ayuda a validar si esta viendo el entorno correcto antes de seguir con una prueba o una revision manual.

## 4. Criterios de calidad

| ID | Nivel | Cubre |
|---|---|---|
| HSS-01 | obligatorio | Aplicacion visible con label `Aplicacion:` y valor correcto |
| HSS-02 | obligatorio | Frontend visible con label `Frontend:` y color por entorno |
| HSS-03 | obligatorio | API visible con label `API:` y color por entorno |
| HSS-04 | esperado | Referencia de rama git visible con label `Rama Git:` |

## 5. Diagrama Mermaid

El sibling `status-summary.mmd` representa la tarjeta y sus filas de información.
