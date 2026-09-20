# TEST_PLAN.md — Mapping Playwright de Home

> Este archivo registra la cobertura persistente del spec Home. La fuente
> funcional sigue siendo `docs/app-map/**`; la cobertura canónica vive en
> `criteria[].coverage` de cada bundle.

## Tiers de validación

| Tier | Cuándo se usa | Evidencia |
| --- | --- | --- |
| **PW-AUTO** | Regresión persistente de criterios funcionales. El spec lleva header `// @ac <ID>` y anotaciones `test.info().annotations`. | Runner persistente con `--method=pwauto --target=home --persist` |
| **PW-CLI** | Comportamiento browser-facing validable exploratoriamente y no persistente. | Validación manual; no añade filas de cobertura persistente |

## Reglas del spec

- `// @ac <ID>` aparece en las primeras 10 líneas.
- Cada criterio anotado en el header también aparece en
  `test.info().annotations.push({ type: 'ac', description: '<ID>' })`.
- La navegación usa `/` y la URL base proviene de la configuración de ejecución.
- El archivo pertenece al layout persistente `tests/e2e/home/index.spec.ts`.

## Cobertura persistente vigente

| Spec (archivo) | Criterios cubiertos (`@ac`) | Proyecto PW | Bundles de write-back | Tier |
| --- | --- | --- | --- | --- |
| `tests/e2e/home/index.spec.ts` | `HOME-01`, `HOME-05`, `HSS-01`, `HSS-02`, `HSS-03`, `HSS-04`, `HRM-01`, `HRM-02` | `pwauto-home` | `views/home/index`, `views/home/features/status-summary`, `views/home/features/runtime-metadata` | PW-AUTO |

## Matriz test → AC

| Criterio | Evidencia del spec |
| --- | --- |
| HOME-01 | Título, heading, tarjeta visible y nombre de la aplicación |
| HOME-05 | Carga sin errores de consola tras `networkidle` |
| HSS-01 | Label `Aplicación:` y valor `colpruebas` |
| HSS-02 | Label `Frontend:` dentro de la tarjeta |
| HSS-03 | Label `API:` dentro de la tarjeta |
| HSS-04 | Label `Rama Git:` dentro de la tarjeta |
| HRM-01 | Anotación de rama visible en la tarjeta |
| HRM-02 | Timestamp del footer con patrón ISO 8601 |

## Regla de actualización

1. Si nace cobertura persistente, crear o actualizar el spec con header y
   anotaciones y registrar aquí todos sus IDs.
2. Si cambia el conjunto de criterios cubiertos por el spec, actualizar la fila
   y la matriz en el mismo cambio documental.
3. Una corrida aislada no cambia este archivo.

## Contrato Bun (unit)

- Layout autoritativo: `tests/unit/home/*.test.ts` (1 archivo por grupo de
  criterios, header `// @ac <ID>` en las primeras líneas).
- `tests/unit/home/index.test.ts` → `HOME-01`, `HOME-05`.
- `tests/unit/home/status-summary.test.ts` → `HSS-01..HSS-04`.
- `tests/unit/home/runtime-metadata.test.ts` → `HRM-01`, `HRM-02`.
- Comandos: `bun run test:unit:home` (runner, target home),
  `bun test tests/unit/home/` (directo).
- Coherencia App Map / SoT (TST-36/TST-38, binding v10, layout, scripts):
  `bun test frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`.

---
**Fuente relacionada**: bundles Home bajo `docs/app-map/views/home/` y
`tests/e2e/home/index.spec.ts`.
