---
id: home
title: Inicio
kind: view
summary: Vista raiz de la landing con identidad del producto, tarjeta de estado y contexto temporal visible.
source_of_truth: quality-plan
---

# Inicio

## Qué cubre

- Landing real accesible desde la raiz `/`.
- Identidad visible de colpruebas apenas carga la pagina.
- Tarjeta central con aplicacion, frontend, API y rama visibles.
- Footer con timestamp visible para dar contexto temporal.

## Valor para el usuario

Permite verificar en segundos que colpruebas esta arriba, que el entorno visible es el esperado y que la lectura tiene contexto operativo minimo.

## Trazabilidad

| ID | Nivel | Cubre |
|---|---|---|
| home-01 | obligatorio | Identidad visible de la aplicacion en la portada |
| home-02 | obligatorio | Estado visible del frontend y de la API |
| home-03 | esperado | Referencia operativa de rama o version visible |
| home-04 | deseado | Marca temporal visible para dar contexto |
| home-05 | obligatorio | Carga principal sin errores visibles |

## Estados principales

- landing renderizada
- tarjeta de estado visible
- metadatos operativos visibles

## Notas del diagrama

- La vista real corresponde a la raiz `/` del frontend.
- El diagrama separa tarjeta de estado y metadatos de ejecucion aunque ambos conviven en la misma pantalla.
