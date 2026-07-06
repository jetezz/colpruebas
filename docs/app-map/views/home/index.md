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
    title: >-
      La aplicacion se identifica visiblemente apenas carga la landing con su
      nombre en el titulo del documento y en la tarjeta principal.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Implementado en frontend/src/pages/index.astro (titulo + Header +
      InfoCard). data-testid del nombre: .info-card .label=Aplicacion. Test
      PW-AUTO del titulo + tarjeta en tests/front/tests/index.spec.ts con `@ac
      home-01`.
  - id: HOME-02
    title: >-
      El estado visible del frontend y de la API se muestra simultaneamente y se
      diferencia por entorno (production = verde, test = amarillo).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Implementado en InfoCard.astro via `.value.production` / `.value.test`
      (colores verde `#28a745` y amarillo `#ffc107`). Cobertura delegada al
      feature home-status-summary.
  - id: HOME-03
    title: >-
      La rama git activa es visible en la tarjeta principal para contextualizar
      el despliegue observado.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      `Rama Git:` label en InfoCard.astro. Cobertura delegada a
      home-runtime-metadata para el dato dinamico.
  - id: HOME-04
    title: >-
      La marca temporal (timestamp ISO 8601) es visible en el pie de la landing
      para dar contexto del momento de carga.
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Implementado via Footer.astro que renderiza `new Date().toISOString()`.
      Cobertura delegada al feature home-runtime-metadata.
  - id: HOME-05
    title: >-
      La carga inicial de la landing no produce errores de consola (browser
      console clean).
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Test PW-AUTO cubre `console.error` debe ser 0 al cargar / via networkidle
      en tests/front/tests/index.spec.ts con `@ac home-05`.
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
