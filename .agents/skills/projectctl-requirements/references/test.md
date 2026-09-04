---
file: references/test.md
parent_skill: projectctl-requirements
owner: WU-SKILL-2 (apply-doc)
tab: test
criteria_covered: [PCT-89, PCT-90, PCT-91, PCT-92, PCT-93, PCT-94]
last_bundle_sync: 2026-07-24
generated_by: sdd-apply-doc (WU-SKILL-2) — sdd/completar-projectctl/apply-doc-WU-SKILL-2
---

# `.agents/skills/projectctl-requirements/references/test.md` — Requisitos de la tab Test (PCT-89..PCT-94)

> **Archivo referente**: documento de la skill `projectctl-requirements` que operacionaliza, para repos destino, los **requisitos del sistema de testing** que cualquier proyecto debe cumplir para que `/projectctl?tab=test` muestre su panel Test correctamente.
>
> Esta referencia es parte del **estándar canónico de compatibilidad `/projectctl`**. Sus fuentes de trazabilidad son `.agents/skills/projectctl-requirements/references/standard.md` §2 + `playwright/TEST_PLAN.md` + `docs/app-map/views/project-workspace/features/test-tab.md` + `scripts/test-runner.ts` + `sandbox/src/services/test-results-writer.ts`. El bloque `SoT original` conserva esa etiqueta en formato machine-grepeable (backticks) para que `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` valide las rutas contra el repo destino.

## Cómo leer este archivo

Para cada requisito:

- **Requisito** (qué debe ser cierto).
- **SoT original** (etiqueta de compatibilidad con el test; paths inline-code que `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` valida como existentes en el repo destino).
- **Cumple** (IDs PCT-89..PCT-94 que este requisito operacionaliza).
- **last-verified** (fecha YYYY-MM-DD de la última regeneración por el agente; bumpear ante cualquier cambio en cualquier path del bloque `SoT original`).

> Si el repo destino no tiene una de las skills externas relacionadas, el agente debe mostrar un aviso `"skill no encontrada en este repo; verifique localmente"` y **NO** fallar (ADDED-SKILL-005 / Maintenance contract). Las reglas de testing base ya viven dentro de este estándar.

---

## PCT-89 — Panel Test existe y lista reglas del sistema de testing

### Requisito

`/projectctl?tab=test` MUST renderizar el panel Test listando las reglas del sistema de testing aplicables a cualquier proyecto del repo: contrato AC mandatorio, runner unificado, persistencia atómica + write-back a `criteria[].coverage`, gate `test:check` y layout canónico.

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §2 + `playwright/TEST_PLAN.md` + `docs/app-map/views/project-workspace/features/test-tab.md` + `scripts/test-runner.ts`.
> **Cumple**: PCT-89.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `.agents/skills/projectctl-requirements/references/standard.md` §2, `playwright/TEST_PLAN.md`, `docs/app-map/views/project-workspace/features/test-tab.md` o `scripts/test-runner.ts`.

---

## PCT-90 — Contrato AC mandatorio (`// @ac <ID>` + `test.info().annotations.push`)

### Requisito

El panel Test MUST explicar el contrato **AC mandatorio** del repo, exigible para cualquier archivo Bun-test (sufijo estándar de Bun) y Playwright-spec (sufijo estándar de Playwright):

1. Header `// @ac <ID>` en las primeras 10 líneas de los archivos Bun-test (sufijo estándar `.test.ts` para Bun) y Playwright-spec (sufijo estándar `.spec.ts` para Playwright). El runner (`scripts/test-runner.ts` con helpers `assertAcHeader` / `assertAcHeaderSpec`) rechaza el archivo sin header (TST-03, TST-04).
2. En specs Playwright: `test.info().annotations.push({type: 'ac', description: '<ID>'})`. El runner lee la anotación y la cruza con el header.
3. **Rechazo**: el archivo `results.json` (del runner) sin AC mapeado se rechaza (TST-10 / AC-007). No se acepta cobertura de un criterio que no esté mapeado a un AC.

### Ejemplos canónicos

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

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §2 + `scripts/test-runner.ts` + `docs/app-map/views/project-workspace/features/test-tab.md` + `frontend/__tests__/projectctl-commands-mapping.test.ts`.
> **Cumple**: PCT-90.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en el contrato AC (helpers `assertAcHeader` / `assertAcHeaderSpec`), TST-10/AC-007, o el formato de anotación en Playwright.

---

## PCT-91 — Runner unificado + mapping 1:1 con `projectctl test *` (PCT-75..78)

### Requisito

El panel Test MUST explicar el **runner unificado** y el mapping 1:1 entre los comandos CLI `projectctl test *` y las invocaciones internas del runner (`scripts/test-runner.ts`):

| CLI (`projectctl test *`) | Runner interno | Equivalencia |
| --- | --- | --- |
| `projectctl test run --method=unit --target=<view>[:<feature>]` | `bun run scripts/test-runner.ts run --method=unit --target=<view>[:<feature>]` | Ejecuta unit tests `@ac` filtered |
| `projectctl test run --method=pwauto --target=<view>[:<feature>] --persist` | `bun run scripts/test-runner.ts run --method=pwauto --target=<view>[:<feature>] --persist` | Ejecuta specs Playwright + escribe coverage |
| `projectctl test run --method=all --target=<view>[:<feature>]` | `bun run scripts/test-runner.ts run --method=all --target=<view>[:<feature>]` | Unit + PW-AUTO |
| `projectctl test list-runs [--limit=N]` | n/a (lectura de `.runtime/test-results/<projectId>/`) | Lista runs previos |
| `projectctl test results <run-id>` | n/a (lee el archivo `summary.json` del run id) | Devuelve `criteria[]` con status |
| `projectctl test schedule-add ...` | API `project_scheduled_tasks mode='test'` | Schedule vía API |

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §4 + `scripts/test-runner.ts` + `docs/app-map/views/projectctl/index.md` + `docs/app-map/views/project-workspace/features/test-tab.md`.
> **Cumple**: PCT-91.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `.agents/skills/projectctl-requirements/references/standard.md` §4 familia `projectctl test *`, en `scripts/test-runner.ts`, o en los entry points del mapping CLI ↔ runner.

---

## PCT-92 — Persistencia `.runtime/test-results/...` + write-back atómico a `criteria[].coverage`

### Requisito

El panel Test MUST explicar:

1. **Estructura de persistencia** (TST-08): cada ejecución de `--persist` escribe en `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/` los archivos `junit.xml`, `results.json`, `summary.json`. El archivo `summary.json` contiene el `criteria[]` con status por criterio (`covered` | `partial` | `missing` | `not-applicable`).
2. **Write-back atómico** (TST-04, TST-11): tras la corrida, `patchBundleCoverage` (en `sandbox/src/services/test-results-writer.ts`) actualiza `criteria[].coverage[Unit | PW-AUTO]` del bundle documental impactado (sea el bundle features por tab del view o el `index.md` raíz del view; los nombres concretos de view/feature siguen las convenciones del workspace).

> **SoT original**: `sandbox/src/services/test-results-writer.ts` + `sandbox/src/services/test-results-writer.test.ts` + `.agents/skills/projectctl-requirements/references/standard.md` §2 + `docs/app-map/views/project-workspace/features/test-tab.md` + `playwright/TEST_PLAN.md`.
> **Cumple**: PCT-92.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `sandbox/src/services/test-results-writer.ts` (especialmente `patchBundleCoverage`), TST-04/TST-08/TST-11, o el formato del archivo `summary.json` (que reside bajo la ruta runtime documentada en `.runtime/test-results/`).

---

## PCT-93 — Gate `bun run test:check` (TST-13) + layout/discovery canónicos (TST-36)

### Requisito

El panel Test MUST explicar:

1. **Gate** `bun run test:check` (TST-13): falla si hay algún bundle con `functional: implemented` y `Unit + PW-AUTO` ambos en `missing` (no ambos `covered`). La salida muestra qué bundle y qué criterio no satisface la cobertura mínima.
2. **Layout y discovery canónicos** (TST-36):
   - Unit tests: 1 archivo por criterio, ubicado bajo el path frontend-side o sandbox-side, siguiendo la convención de 2 segmentos view/feature que el workspace aplica (los placeholders `<view>` y `<feature>` se sustituyen por el view real y el feature real al materializar el archivo). Ejemplo real: `frontend/__tests__/projectctl-tabs.test.ts`.
   - Specs PW-AUTO: 1 spec por criterio, ubicado bajo el path en el workspace Playwright (en repo raíz), misma convención view/feature con placeholders sustituidos.
   - Cada archivo MUST llevar el header `// @ac <ID>` en las primeras 10 líneas (TST-03).
   - Coverage matrix: `criteria[].coverage` en cada bundle (frontmatter), sincronizada via `patchBundleCoverage`.

> **SoT original**: `.agents/skills/projectctl-requirements/references/standard.md` §2 + `playwright/TEST_PLAN.md` + `playwright.config.ts` + `docs/app-map/views/project-workspace/features/test-tab.md` + `scripts/test-runner.ts`.
> **Cumple**: PCT-93.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en TST-13, TST-36, `playwright.config.ts` `PWAUTO_VIEWS`, o el contrato del gate `test:check`.

---

## PCT-94 — References testing: `playwright/TEST_PLAN.md` mapping + estándar integrado

### Requisito

El panel Test MUST declarar sus dos references obligatorias:

1. `playwright/TEST_PLAN.md` — mapping persistente archivo↔criterio (qué spec cubre qué PCT/AC), incluyendo tier PW-AUTO y tier PW-CLI.
2. `.agents/skills/projectctl-requirements/references/standard.md` §2 — policy integrada del repo para decidir alcance de validación (`Unit | PW-CLI | PW-AUTO | Manual`). Es el archivo que cualquier agente o humano consulta ANTES de crear un nuevo test, para no inventar tier ni método nuevo.

> **SoT original**: `playwright/TEST_PLAN.md` + `.agents/skills/projectctl-requirements/references/standard.md`.
> **Cumple**: PCT-94.
> **last-verified**: 2026-07-24 — regenerar ante cualquier cambio en `playwright/TEST_PLAN.md` (especialmente tiers y mapping) o en `.agents/skills/projectctl-requirements/references/standard.md` §2 (especialmente el contrato de decisión de alcance).

---

## Resumen de la tab Test

| ID | Requisito (resumen) |
| --- | --- |
| PCT-89 | Panel Test existe y lista las reglas del sistema de testing del repo |
| PCT-90 | Contrato AC mandatorio: `// @ac <ID>` header + `test.info().annotations.push` + rechazo sin mapeo |
| PCT-91 | Runner unificado + mapping 1:1 con `projectctl test *` (PCT-75..78) |
| PCT-92 | Persistencia `.runtime/test-results/<projectId>/<run-id>/` + write-back atómico a `criteria[].coverage` |
| PCT-93 | Gate `bun run test:check` (TST-13) + layout/discovery canónicos (TST-36) |
| PCT-94 | References testing: `playwright/TEST_PLAN.md` mapping + estándar integrado en `.agents/skills/projectctl-requirements/references/standard.md` |

## Criterios cubiertos por este archivo

`PCT-89`, `PCT-90`, `PCT-91`, `PCT-92`, `PCT-93`, `PCT-94`.

(Véase `.agents/skills/projectctl-requirements/references/sources.md` para la tabla SoT machine-grepeable completa, y `.agents/skills/projectctl-requirements/references/maintenance.md` para el contrato anti-drift que rige la regeneración de este archivo.)
