---
id: home-runtime-metadata
title: Metadatos de ejecución
kind: feature
summary: Referencias visibles de rama git y timestamp para contextualizar la ejecución mostrada en la landing.
source_of_truth: quality-plan
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
| home-03 | esperado | Referencia visible de rama git |
| home-04 | deseado | Timestamp visible en el pie |

## Estados principales

- rama visible
- timestamp visible
- referencia operativa lista para consulta rápida

## Notas del diagrama

- La rama actual es un dato de referencia visible y no implica sincronización dinámica con Git real.
- El timestamp aporta contexto temporal de render y no reemplaza monitoreo del sistema.
