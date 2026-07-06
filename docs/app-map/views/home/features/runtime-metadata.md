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
    title: >-
      La referencia visible de la rama git coincide con el branch resuelto en
      tiempo de render del servidor (no se muestra un placeholder generico si el
      dato esta disponible).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Renderizado por InfoCard.astro (`Rama Git:` + `gitBranch`). El dato puede
      ser estatico en este proyecto de ejemplo (placeholder `MAIN`) pero el
      label y la presencia son contractuales. Anota `@ac HRM-01` en
      tests/front/tests/index.spec.ts.
  - id: HRM-02
    title: >-
      El timestamp visible en el pie de la landing esta en formato ISO 8601 y
      refleja el momento del render SSR, no del cliente.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Footer.astro consume `new Date().toISOString()` en el servidor. Garantia
      de formato enforced por serializacion automatica de Date.
---

# Metadatos de ejecución

## Qué cubre

- Referencia visible de rama git en la tarjeta principal.
- Timestamp visible en el pie de la pagina.
- Contexto minimo para interpretar el momento de la validacion manual.

## Valor para el usuario

Ayuda a distinguir rapidamente el contexto operativo sin tener que inspeccionar configuracion interna ni salir de la landing.

## Trazabilidad

| ID | Nivel | Cubre |
|---|---|---|
| HRM-01 | esperado | Rama git visible en la tarjeta principal |
| HRM-02 | deseado | Timestamp ISO 8601 visible en el pie |

## Estados principales

- rama visible
- timestamp visible
- referencia operativa lista para consulta rápida

## Notas del diagrama

- La rama actual es un dato de referencia visible y no implica sincronización dinámica con Git real.
- El timestamp aporta contexto temporal de render y no reemplaza monitoreo del sistema.
