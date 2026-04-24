---
id: home-status-summary
title: Resumen de estado
kind: feature
summary: Tarjeta principal que comunica nombre de la aplicacion y estado visible de frontend, API y rama.
source_of_truth: quality-plan
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
| home-01 | obligatorio | Nombre de la aplicacion visible |
| home-02 | obligatorio | Estado visible del frontend y de la API |
| home-03 | esperado | Referencia operativa de rama visible |

## Estados principales

- tarjeta visible al cargar la landing
- estados de frontend y API diferenciados por entorno
- rama visible para inspeccion manual

## Notas del diagrama

- El resumen se presenta como una tarjeta unica con filas de informacion.
- Los textos exactos pueden variar segun el entorno, pero la documentacion usa labels estables y orientados al usuario.
