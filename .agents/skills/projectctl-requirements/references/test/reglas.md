---
file: references/test/reglas.md
parent_skill: projectctl-requirements
owner: documentation maintenance
tab: test
criteria_covered: [PCT-89, PCT-90, PCT-91, PCT-92, PCT-93, PCT-94, TST-38, TST-39, TST-40, TST-41, TST-42]
last_bundle_sync: 2026-09-10
generated_by: split por secciones del contrato de testing
---

# Test — reglas (tab Test, PCT-89..PCT-94 + TST-38..TST-42)

Autoridad normativa del sistema de testing tras el split por secciones: la
tab `/projectctl?tab=test` explica las reglas; la tab del proyecto y el
runner del operador ejecutan el contrato. Contrato portable:
`.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts`
+ `.agents/skills/projectctl-requirements/scripts/project/doctor-test.ts`;
wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la
instancia).

> **Contratos machine residentes**: `references/app-map/` y
> `references/schemas/` NO se mueven: son contratos machine residentes y aquí
> solo se citan. Si el repo destino no tiene una de las skills externas
> relacionadas, el agente debe mostrar un aviso `"skill no encontrada en este
> repo; verifique localmente"` y **NO** fallar. Las reglas de testing base ya
> viven dentro de este estándar.

## PCT-89 — Panel Test existe y lista reglas del sistema de testing

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §2 + `playwright/TEST_PLAN.md` (proveído por el destino) + Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia).
> **Cumple**: PCT-89.
> **last-verified**: 2026-09-27 — regenerar ante cambios en el contrato de tab Test, el runner o el doctor.

`/projectctl?tab=test` MUST renderizar el panel Test listando las reglas
aplicables: IDs `@ac` rastreables, inventario Unit/PW-AUTO, runner unificado,
runs persistidos, write-back **condicional** sobre `--persist` y un gate que
comprueba los criterios del app-map. La tab de proyecto implementa además
configuración, quick-run y estados de disponibilidad; su implementación es
responsabilidad del operador, no del checkout gestionado.

## PCT-90 — Contrato AC mandatorio (`// @ac <ID>` + `test.info().annotations.push`)

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §2 + Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia).
> **Cumple**: PCT-90.
> **last-verified**: 2026-09-27 — regenerar ante cambios de header AC, inventario o anotación Playwright.

El panel Test MUST explicar el contrato **AC mandatorio** del repo, exigible
para cualquier archivo Bun-test (sufijo estándar de Bun) y Playwright-spec
(sufijo estándar de Playwright):

1. Header `// @ac <ID>` en las primeras 10 líneas de los archivos Bun-test
   (sufijo estándar `.test.ts` para Bun) y Playwright-spec (sufijo estándar
   `.spec.ts` para Playwright). El wrapper local de la instancia (proveído
   por el destino, runtime sobre el contrato portable con helpers
   `assertAcHeader` / `assertAcHeaderSpec`) rechaza el archivo sin header
   (TST-03, TST-04).
2. En specs Playwright:
   `test.info().annotations.push({type: 'ac', description: '<ID>'})` o
   `testInfo.annotations.push(...)` por test. El ID anotado debe coincidir
   con un ID del header y con el `criteria[].id` declarado; tener una
   anotación en algún lugar del archivo no demuestra por sí solo que cada
   test esté trazado.
3. **Rechazo**: el archivo `results.json` (del runner) sin AC mapeado se
   rechaza (TST-10 / AC-007). No se acepta cobertura de un criterio que no
   esté mapeado a un AC.

Ejemplo breve junto a la regla (no supera ~30 líneas; sin `ejemplos.md`):

```ts
// @ac PCT-89
import { describe, expect, it } from 'bun:test';
// ... resto del archivo
```

```ts
test('panel Test carga', async ({}, testInfo) => {
  testInfo.annotations.push({ type: 'ac', description: 'PCT-89' });
  // ... resto del test
});
```

## PCT-91 — Runner unificado + mapping 1:1 con `projectctl test *`

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §4 + Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia).
> **Cumple**: PCT-91.
> **last-verified**: 2026-09-27 — regenerar ante cambios en CLI, precheck o runner del operador.

El panel Test MUST explicar el **runner unificado** y el mapping 1:1 entre
los comandos CLI `projectctl test *` y las invocaciones internas del wrapper
local de la instancia (proveído por el destino, runtime sobre el contrato
portable):

| CLI (`projectctl test *`) | Wrapper local de la instancia | Equivalencia |
| --- | --- | --- |
| `projectctl test run --method=unit --target=<view>[:<feature>]` | `bun run <repo>/scripts/<runner>.ts run --method=unit --target=<view>[:<feature>]` | Ejecuta unit tests `@ac` filtered |
| `projectctl test run --method=pwauto --target=<view>[:<feature>] --persist` | `bun run <repo>/scripts/<runner>.ts run --method=pwauto --target=<view>[:<feature>] --persist` | Ejecuta specs Playwright + escribe coverage |
| `projectctl test run --method=all --target=<view>[:<feature>]` | `bun run <repo>/scripts/<runner>.ts run --method=all --target=<view>[:<feature>]` | Unit + PW-AUTO |
| `projectctl test list-runs [--limit=N]` | n/a (lectura de `.runtime/test-results/<projectId>/`) | Lista runs previos |
| `projectctl test results <run-id>` | n/a (lee el archivo `summary.json` del run id) | Devuelve `criteria[]` con status |
| `projectctl test schedule-add ...` | API `project_scheduled_tasks mode='test'` | Schedule vía API |

## PCT-92 — Persistencia `.runtime/test-results/...` + write-back V2 condicional

> **SoT original**: Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` + `.agents/skills/projectctl-requirements/references/standard.md` §2 + wrapper local `<repo>/scripts/...` (proveído por el destino, writer de resultados de la instancia) + `playwright/TEST_PLAN.md` (proveído por el destino).
> **Cumple**: PCT-92.
> **last-verified**: 2026-09-28 — regenerar ante cambios en el contrato portable, TST-04/TST-08/TST-11 o el envelope del run.

El panel Test MUST explicar:

1. **Estructura de persistencia** (TST-08): las ejecuciones persistidas
   escriben artefactos de cada método (`junit.xml`, `results.json`,
   `summary.json`) bajo
   `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/`; `.runtime/`
   debe quedar fuera de Git. El summary contiene criterios, resultados y
   estado de write-back. La existencia de un archivo no prueba que se hayan
   ejecutado tests.
2. **Write-back vigente** (TST-04/TST-11, V2): con `--persist`, exit 0, tests
   ejecutados > 0 y patch exitoso, el sandbox actualiza atómicamente
   `criteria[].coverage[Unit|PW-AUTO]` con verificación SHA-256, temp/rename
   y preservación del body. Solo entonces `coverageAccepted: true`; sin
   criterios, con 0 tests, fallo del método/patch o servicio inaccesible,
    mantener cobertura pendiente/no aceptada
    (`AUTO_WRITEBACK_DEFERRED_V1` o `WRITEBACK_FAILED_V2`). No registrar
    `covered` solo porque `bun test` devolvió 0.
3. **Ledger**: el write-back actualiza `criteria[].coverage` del bundle,
    nunca inventa filas en `references/app-map/coverage-ledger.yaml`;
    `docs-check` es quinto método solo del ledger y equivale a `Unit`
    (ver `references/criterios/reglas.md` PCT-172).

## PCT-93 — Gate `bun run test:check` (TST-13) + layout/discovery canónicos (TST-36)

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §2 + `playwright/TEST_PLAN.md` (proveído por el destino) + `playwright.config.ts` (proveído por el destino) + Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia).
> **Cumple**: PCT-93.
> **last-verified**: 2026-09-28 — regenerar ante cambios en TST-13/TST-36 o en los roots/discovery del runner.

El panel Test MUST explicar:

1. **Gate** `bun run test:check` (TST-13): falla si cualquier criterio
   `functional: implemented` carece de `coverage.Unit = covered` **O**
   `coverage.PW-AUTO = covered`, salvo `skip_quality_gate: true`
   justificado. Unit y PW-AUTO son ambos obligatorios en este gate;
   PW-CLI/Manual son exentos. El gate debe leer el `docs/app-map/**` del
   proyecto gestionado, no solo el source root montado del operador. Un
   script que solo ejecuta Vitest/TypeScript o permite `--passWithNoTests`
   NO cumple aunque salga 0.
2. **Layout y discovery canónicos** (TST-36):
   - Unit tests: `tests/unit/**/*.test.{ts,tsx}`; pueden existir paths del
     owner local si el runner los descubre y enlaza al target del manifest.
     Los archivos deben tener IDs `@ac` correspondientes al criterio real;
     no imponer un archivo por criterio cuando una suite cubre varios IDs.
   - Specs PW-AUTO: `tests/e2e/**/*.spec.ts`, enlazadas a vistas/features de
     `docs/app-map/navigation.yaml` y registradas en
     `playwright/TEST_PLAN.md`.
   - Cada archivo MUST llevar el header `// @ac <ID>` en las primeras 10
     líneas (TST-03).
    - Coverage matrix: `criteria[].coverage` en el frontmatter es la
      autoridad; los value-sets son los de
      `references/standard.md` §1 y el eje ledger vs criterio el de
      `references/criterios/reglas.md` PCT-172. Ausencia
      de test → `no-test` gris, no rojo/fallo automático. El reset conserva
      esa distinción; nunca escribir cobertura sin evidencia.

## PCT-94 — References testing: `playwright/TEST_PLAN.md` mapping + estándar integrado

> **SoT original**: `playwright/TEST_PLAN.md` + `.agents/skills/projectctl-requirements/references/standard.md`.
> **Cumple**: PCT-94.
> **last-verified**: 2026-09-27 — regenerar ante cambios en `playwright/TEST_PLAN.md` o en el contrato de alcance por método.

El panel Test MUST declarar sus dos references obligatorias:

1. `playwright/TEST_PLAN.md` — mapping persistente archivo↔criterio (qué
   spec cubre qué PCT/AC), incluyendo tier PW-AUTO y tier PW-CLI.
2. `.agents/skills/projectctl-requirements/references/standard.md` §2 —
   policy integrada del repo para decidir alcance de validación (`Unit |
   PW-CLI | PW-AUTO | Manual`). Es el archivo que cualquier agente o humano
   consulta ANTES de crear un nuevo test, para no inventar tier ni método
   nuevo.

## TST-38 — `docs-lint` valida trazabilidad código⇒criterio (checks 1-5)

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §1 + `.agents/skills/projectctl-requirements/references/standard.md` §2 + `.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts` + wrapper local `<repo>/scripts/...` (proveído por el destino, lint de la instancia).
> **Cumple**: TST-38.
> **last-verified**: 2026-09-27 — regenerar ante cualquier cambio en los checks 1-5 del core portable o el wrapper local.

El repo MUST validar que todo código de criterio usado en specs PW-AUTO, unit
tests y código producto esté declarado en la SoT `docs/app-map/**`: bundles
autoconsistentes (check 1), contrato strict idéntico al runtime (check 2),
specs PW-AUTO contra la SoT (check 3), unit tests y producto contra la SoT
(check 4) y gate `test:check` visible no bloqueante (check 5). La lógica pura
de los 5 checks vive en el contrato portable
`.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts`;
el wrapper local `<repo>/scripts/...` (proveído por el destino) inyecta el
parser real + globs del repo y la evidencia la aporta el wrapper local de la
instancia. Esta referencia cita el contrato sin copiarlo; la dirección
doc⇒código como procedimiento de auditoría vive en
`.agents/skills/projectctl-requirements/references/standard.md` §1.

## TST-39..TST-42 — Descubrimiento gestionado

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §2 + `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` (`validateOwnerAnnotation`/`validateSpecTitleIds`) + `.agents/skills/projectctl-requirements/scripts/project/doctor-test.ts` (checks `TST-39-SINGLE-COPY`, `TST-40-OWNER`, `TST-41-BOUNDED-LOCATION`, `TST-42-SPEC-TITLE`) + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia).
> **Cumple**: PCT-90, PCT-91, PCT-93.
> **last-verified**: 2026-09-29 — regenerar ante cambios en el descubrimiento gestionado, el owner o el filtrado por título.

El checkout del proyecto MUST cumplir el contrato de descubrimiento del
runner gestionado, verificado estáticamente por
`scripts/project/doctor-test.ts` y ejecutado por
`projectctl test run --target=<view>`.

El diagnóstico local acepta `--target=<view>[:<feature>]`: selecciona criterios
por el subárbol del App Map y localiza archivos de evidencia por sus `@ac`,
incluidos archivos compartidos. El inventario y la resolución son los mismos
que utilizan los doctors Doc y Estructura; comandos, dependencias y runtime
siguen siendo comprobaciones globales, no certificados de una feature.

Reglas del descubrimiento gestionado:

1. **TST-39 — Copia única `@playwright/test`**: el `package.json` del
   proyecto NO declara `@playwright/test` (ni `playwright`); specs y config
   resuelven a la copia única de plataforma. Una copia local produce dos
   instancias y el runner gestionado aborta (`Requiring @playwright/test
   second time`) tras un inventario válido. El doctor informa `unverified`
   si la dependencia existe (solo un run gestionado certifica la resolución
   única) y `pass` si no existe.
2. **TST-40 — Owner `// @<view>`**: cada spec Playwright declara en las
   primeras 10 líneas el owner del view target (`// @<view-id>`, ID presente
   en `docs/app-map/navigation.yaml`) junto al header `// @ac`. Sin owner el
   spec cae en inventario `external`/gap.
3. **TST-41 — Ubicaciones acotadas por view**: specs en `tests/e2e/<view>/`
   y unit tests del proyecto en `tests/unit/<view>/`, donde `<view>` es un
   `id` del manifest. Otras ubicaciones las trata el runner como externas
   (specs) o no las descubre (unit, `discoveryRoots`).
4. **TST-42 — Títulos con ID**: cada título `test('...')` contiene al menos
   un ID presente en el header `// @ac` del archivo. El runner filtra con
   `--grep` sobre el título; un título sin ID nunca ejecuta en el run
   gestionado aunque el inventario lo liste.

## Contrato portable vs instancia runtime

La lógica pura del sistema de testing (tipos +
`validateAcHeader`/`validateLayout`/`validateResultsEnvelope`, mapping CLI,
persistencia y fallback `AUTO_WRITEBACK_DEFERRED_V1`) vive en
`.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts`;
el wrapper local `<repo>/scripts/...` (proveído por el destino) es el runtime
de la instancia y aporta ejecución/write-back V2. En un proyecto gestionado,
el runner puede estar montado fuera del checkout: no exige crear un wrapper
ficticio. Antes de enlazar un `test:check` comprobar qué root usa el runner
para leer el app-map; `TEST_RUNNER_SOURCE_ROOT` puede ser el repositorio de
la plataforma y `TEST_RUNNER_REPO_ROOT` el checkout gestionado.

> **SoT original**: Contrato portable: `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts` + wrapper local `<repo>/scripts/...` (proveído por el destino, runtime de la instancia).
> **Cumple**: PCT-89..PCT-94.
> **last-verified**: 2026-09-27 — regenerar ante cambios en el contrato portable, roots del runner o aceptación del write-back.

---

**Criterios cubiertos por este archivo**: `PCT-89`, `PCT-90`, `PCT-91`,
`PCT-92`, `PCT-93`, `PCT-94`, `TST-38`, `TST-39`, `TST-40`, `TST-41`,
`TST-42`.
