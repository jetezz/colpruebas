# TEST_PLAN.md — Mapping Playwright de cobertura persistente

> **Rol**: `playwright/TEST_PLAN.md` es el mapping persistente archivo↔criterio de la cobertura
> Playwright del repo (PCT-94 / `references/test.md`). **NO reemplaza `docs/app-map/**` como SoT**:
> la SoT de cobertura canónica es `criteria[].coverage` en los bundles (`patchBundleCoverage`,
> TST-11). Este archivo SOLO cambia cuando nace o cambia cobertura Playwright **persistente**
> (standard §2) — nunca por una corrida aislada.
>
> **Referencia de discovery**: los proyectos/greps/bundles se resuelven desde `PWAUTO_VIEWS`
> de `frontend/playwright.config.ts` (contract design §5.6 / PCT-93). El workspace de specs es
> `tests/front/tests/` (root de discovery del runner y de `buildInventory`).

## Tiers de validación Playwright (PCT-94 / standard §2)

| Tier | Cuándo se usa | Evidencia |
| --- | --- | --- |
| **PW-AUTO** | Regresión persistente requerida o criterio de `docs/app-map/**` lo exige. Spec persistente con `// @ac <ID>` header + `test.info().annotations.push({ type: 'ac', description: '<ID>' })`. | corrida canónica `bun run scripts/test-runner.ts run --method=pwauto --target=<view>[:<feature>] --persist` |
| **PW-CLI** | Comportamiento browser-facing validable exploratoriamente (no persistente). | validación manual vía `sdd-verify-pwcli` / playwright-cli; sin spec en el repo |

Reglas aplicables a todo spec (contract AC mandatorio PCT-90):

- Header `// @ac <ID>` en las primeras 10 líneas + anotación `test.info().annotations.push`
  con el mismo `<ID>` (el runner cruza header ↔ anotación y rechaza discrepancias, exit 2).
- `BASE_URL` explícito (no hardcodear dominios legacy); preferir roles/labels/selectores
  estables; evitar sleeps fijos.
- Un spec por criterio, convención de 2 segmentos `<view>/<feature>` (REQ-TST-006 / TST-36).

## Cobertura persistente vigente

Estado actual de specs **trackeados en el repo** (sin cambios por WU-TST-1; no hay spec
`projectctl` aún — previsto en fase 3).

| Spec (archivo) | Criterios cubiertos (`@ac`) | Proyecto PW (PWAUTO_VIEWS) | Bundle de write-back | Tier |
| --- | --- | --- | --- | --- |
| `tests/front/tests/index.spec.ts` | `HOME-01`, `HSS-01`, `HSS-02` | `pwauto-home` | `views/home/index` | PW-AUTO |
| `tests/front/tests/test-tab.spec.ts` | `PWT-01`, `PWT-02`, `PWT-08` | `pwauto-test-tab` | `views/project-workspace/features/test-tab` | PW-AUTO |

## Cobertura PW-AUTO prevista (fase 3)

Cuando WU-TST-2 (fase 3) cree specs persistentes, cada spec nuevo debe registrarse aquí. Pending:

| Spec previsto | Criterios objetivo | Proyecto PW (PWAUTO_VIEWS) | Bundle de write-back | Tier |
| --- | --- | --- | --- | --- |
| `tests/front/tests/projectctl.spec.ts` | `PCT-*` del bundle `views/projectctl/index` (test system, runner/gate/TEST_PLAN/persistencia) | `pwauto-projectctl` (grep `@projectctl\b`) | `views/projectctl/index` | PW-AUTO |

> Nota de coherencia (fase 3): el `testDir` de la config canónica `frontend/playwright.config.ts`
> es `./tests` (resuelto desde `frontend/` → `frontend/tests`), mientras que los specs actuales y
> el discovery del runner viven en `tests/front/tests/`. Antes de crear specs nuevos hay que
> reconciliar ese path (coordinador / `sdd-apply-pwauto-tests`), sin duplicar specs.

## Regla de actualización (PCT-94 / standard §2)

1. **Nace cobertura PW-AUTO nueva** → crear spec con header `@ac` + anotación, ejecutar
   `--persist`, y añadir la fila a la tabla "Cobertura persistente vigente" de este archivo.
2. **Cambia cobertura existente** (criterio distinto / spec renombrado) → actualizar la fila.
3. **Corrida aislada sin cambio de cobertura** → NO tocar este archivo.
4. Cambios de contrato (tiers, projects, grep) al actualizar `frontend/playwright.config.ts`
   → sincronizar `PWAUTO_VIEWS` aquí y en la tabla.

---
**Criterios**: PCT-94 (mapping + tiers PW-AUTO/PW-CLI); PCT-90 (header/annotación AC).
**SoT relacionada**: `docs/app-map/views/projectctl/index.md` (`criteria[]`), `frontend/playwright.config.ts` (`PWAUTO_VIEWS`).