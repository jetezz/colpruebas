---
id: home-status-summary
title: Resumen de estado
kind: feature
summary: >-
  Tarjeta principal que comunica nombre de la aplicacion y estado visible de
  frontend, API y rama.
source_of_truth: app-map
criteria:
  - id: HSS-01
    title: >-
      El nombre de la aplicacion es visible dentro de la tarjeta central
      `Resumen de estado` con la etiqueta `Aplicacion:`.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Cubierto por tests/front/tests/index.spec.ts caso `info-card contiene
      Aplicacion:` + `info-card contiene colpruebas`. Anota `@ac HSS-01` en el
      primer test del archivo.
  - id: HSS-02
    title: >-
      El estado del frontend se muestra dentro de la misma tarjeta, alineado a
      la derecha del label `Frontend:`, diferenciado por entorno (production
      verde / test amarillo).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Cubierto por tests/front/tests/index.spec.ts caso `info-card contiene
      Frontend:`. Estilo de color vive en InfoCard.astro `.value.production` /
      `.value.test`.
  - id: HSS-03
    title: >-
      El estado de la API se muestra dentro de la tarjeta con la etiqueta `API:`
      y replica el patron de color por entorno.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Cubierto por tests/front/tests/index.spec.ts caso `info-card contiene
      API:`.
  - id: HSS-04
    title: >-
      La rama git operativa se renderiza con la etiqueta `Rama Git:` en la misma
      tarjeta y respeta el color del entorno actual.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Cubierto por tests/front/tests/index.spec.ts caso `info-card contiene Rama
      Git:`. El dato dinamico proviene de runtime-metadata; esta feature expone
      solo el rendering.
---

# Resumen de estado

## Qué cubre

- Nombre visible de la aplicacion en la tarjeta principal.
- Estado actual del frontend segun el entorno activo.
- Estado actual de la API dentro del mismo bloque.
- Referencia visible de rama para validar rapidamente el despliegue.

## Valor para el usuario

Reduce la incertidumbre inicial y ayuda a validar si esta viendo el entorno correcto antes de seguir con una prueba o una revision manual.

## Trazabilidad

| ID | Nivel | Cubre |
|---|---|---|
| HSS-01 | obligatorio | Aplicacion visible con label `Aplicacion:` y valor correcto |
| HSS-02 | obligatorio | Frontend visible con label `Frontend:` y color por entorno |
| HSS-03 | obligatorio | API visible con label `API:` y color por entorno |
| HSS-04 | esperado | Rama git visible con label `Rama Git:` y color por entorno |

## Estados principales

- tarjeta visible al cargar la landing
- estados de frontend y API diferenciados por entorno
- rama visible para inspeccion manual

## Notas del diagrama

- El resumen se presenta como una tarjeta unica con filas de informacion.
- Los textos exactos pueden variar segun el entorno, pero la documentacion usa labels estables y orientados al usuario.
