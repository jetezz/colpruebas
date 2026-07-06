---
id: project-workspace-test-tab
title: Tab Test
kind: feature
summary: >-
  Tab test funcional del proyecto colpruebas: criterios PWT-01..PWT-12, chip
  rendering dual (disponibilidad × resultado), botones per-criterio (PW-CLI
  simulado y Manual) con escritura atómica de coverage, reset coverage, leyenda
  8 estados visible, e inventario `@ac` server-side.
source_of_truth: app-map
criteria:
  - id: PWT-01
    title: >-
      Existe la ruta /project/[id] con layout de tabs (commands, skills, agents,
      scheduled, environments, preview, test) sin crear ruta Astro paralela
      fuera del workspace
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Implementado via frontend/src/pages/project/[id].astro y
      frontend/src/components/ProjectTabs.astro. La URL canónica es
      /project/{id}?tab=test. data-testid del shell: project-shell-tabs.
  - id: PWT-02
    title: >-
      La tab test renderiza secciones 5.1 Configuración, 5.2 Sistema de testeo
      rápido y 5.3 Tareas programadas con semántica mínima
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Cada sección se renderiza con data-testid (test-tab-section-config,
      test-tab-section-quickrun, test-tab-section-scheduled). 5.2 expone el
      acordeón de cards y los criterios del proyecto. 5.3 muestra un panel
      placeholder (no es objetivo del scope).
  - id: PWT-03
    title: >-
      El resolver visual de cobertura combina disponibilidad × resultado y emite
      uno de los 8 estados derivados sin colapsar `missing`
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Helper puro frontend/src/lib/test-status.ts#resolveStatus(). Cobertura
      unitaria en tests/back/test-status.test.ts (Bun) que cubre los 8 estados y
      casos borde. Sin acceso a filesystem ni DOM. Chip renderiza {state, color,
      label}.
  - id: PWT-04
    title: >-
      Backend expone GET /api/projects/[id]/docs/app-map que retorna el bundle
      test-tab.md parseado con criterios y coverage
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Lee docs/app-map/views/project-workspace/features/test-tab.md con
      gray-matter, valida shape, retorna JSON {criteria, navigation}. Auth no
      requerida en este managed project (sin login). Test Bun en
      tests/back/coverage-endpoints.test.ts.
  - id: PWT-05
    title: >-
      Backend expone POST /api/projects/[id]/docs/app-map/coverage/manual que
      actualiza exactamente UN criterio via writer atómico
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      backend/src/coverage-writer.ts#manualMark(): gray-matter parse → SHA-256
      pre → patch criteria[].coverage.Manual=covered → stringify body verbatim →
      tmp + fs.renameSync + SHA-256 post. 1 acción = 1 criterio. Shape response
      {ok, criterionId, sha256}. body byte region preservada.
  - id: PWT-06
    title: >-
      Backend expone POST /api/projects/[id]/docs/app-map/coverage/reset que
      respeta disponibilidad: con test → Pendiente (missing), sin test → no-test
      (gris)
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      backend/src/coverage-writer.ts#resetCoverage(): por cada criterio y método
      (Unit|PW-CLI|PW-AUTO|Manual), consulta el inventario @ac (Unit/PW-AUTO) y
      la cobertura actual (PW-CLI/Manual). Si el método tiene test/evidencia →
      missing; si no → not-applicable (que el resolver mapeará a no-test gris si
      Unit/PW-AUTO sin @ac). Response shape {ok, bundlesTouched, criteriaReset,
      failed}.
  - id: PWT-07
    title: >-
      Backend expone POST /api/projects/[id]/test-pwcli/run que simula un agente
      OpenCode y escribe coverage.PW-CLI=covered para el criterio solicitado
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Mock determinístico: read criteria current state, decide covered vs
      missing (criterios home-* ya cubiertos → covered; criterios sin inventario
      → covered con justificación). Reusa coverage-writer patchBundleCoverage
      atomically. En producción real abriría spawn contra sdd-verify-pwcli; aquí
      es simulado. Response {ok, criterionId, verdict, agent: 'mock-pwcli'}.
  - id: PWT-08
    title: >-
      Frontend renderiza leyenda visible con data-testid
      test-tab-quickrun-legend que documenta los 8 estados derivados
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      Renderizada entre summaryChips y la lista de criterios. 8 celdas con su
      data-state, data-color y texto: passed/green Cubierto, partial/amber
      Parcial, not-run/red Pendiente, failed/red Falló, no-test/gray Sin test,
      not-applicable/gray No aplica, manual-evidence/blue Evidencia,
      manual-missing/gray Sin evidencia.
  - id: PWT-09
    title: >-
      Frontend expone botones per-criterio Validar con PW-CLI y Manual con modal
      de afirmación que dispara los endpoints correctos y actualiza el chip
      resultante
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      data-testid test-tab-validate-pwcli-<criterionId> → POST /test-pwcli/run.
      data-testid test-tab-criterion-<criterionId>-manual-mark → abre modal con
      test-tab-criterion-manual-affirm-<criterionId> (Cancelar default,
      Confirmar primary) → POST .../coverage/manual. Tras éxito refetch
      /docs/app-map y re-render de chips. PW-CLI fallback clipboard cuando el
      endpoint retorne 503 (test-tab-pwcli-fallback).
  - id: PWT-10
    title: >-
      Frontend expone botón Reset coverage global en 5.2 con modal de
      confirmación con texto "vuelve a Pendiente o Sin test según corresponda"
      diferenciando con test vs sin test
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      data-testid test-tab-quickrun-reset-coverage → modal con
      test-tab-quickrun-reset-coverage-modal, texto verbatim "Esto pondrá TODOS
      los criterios como Pendiente o Sin test según corresponda (los métodos con
      test definido vuelven a Pendiente y los métodos sin test definido vuelven
      a Sin test)". Confirmar → POST .../coverage/reset.
  - id: PWT-11
    title: >-
      Test unitario Bun del resolver cubre los 8 estados derivados (no-test,
      not-applicable, not-run, passed, failed, partial, manual-evidence,
      manual-missing) y casos borde
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      tests/back/test-status.test.ts. Cada estado tiene al menos 1 assertion.
      Casos borde: manualMandatory true/false, coverage not-applicable, lastRun
      undefined.
  - id: PWT-12
    title: >-
      Test E2E Playwright del test tab UI contra localhost:4323 verifica que la
      pestaña carga, la leyenda muestra los 8 estados, los chips resuelven
      visualmente y los botones no rompen
    functional: implemented
    coverage:
      Unit: covered
      PW-CLI: missing
      PW-AUTO: covered
      Manual: missing
    notes: >-
      tests/front/tests/test-tab.spec.ts usa test.info().annotations con
      {type:'ac', description:'PWT-12'}. Verifica data-testid test-tab-root y
      legend visible con 8 estados.
---

# Tab Test — Sistema de testing funcional del proyecto colpruebas

## 1. URL

`/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test`

## 2. Tab

`test` — tab nueva del workspace de proyecto junto a las tabs estándar del layout Astro.

Tres sub-secciones:

- **5.1 Dashboard de configuración** — formulario persistido por proyecto (placeholder mínimo).
- **5.2 Sistema de testeo rápido** — tabla de criterios del bundle `test-tab.md` con chips por método, botones per-criterio y reset.
- **5.3 Tareas programadas de test** — placeholder (sin scheduler real en este managed project).

## 3. Norma visual de estado (PWT-03 / PWT-08)

| Estado derivado | Disponibilidad | Resultado | Color | Texto |
| --- | --- | --- | --- | --- |
| `no-test` | `no-test` | — | gris muted | `Sin test` / `Sin PW-AUTO` |
| `not-applicable` | `not-applicable` | `not-applicable` | gris muted | `No aplica` |
| `not-run` | `exists` | sin corrida post-reset | rojo | `Pendiente` |
| `failed` | `exists` | última corrida falló | rojo | `Falló` |
| `passed` | `exists` | última corrida pasó | verde | `Cubierto` |
| `partial` | `exists` | corrida parcial | ámbar | `Parcial` |
| `manual-evidence` | con cobertura | `covered` (Manual OK) | verde/azul | `Evidencia` |
| `manual-missing` | sin cobertura | — | gris (ámbar si obligatorio) | `Sin evidencia` |

## 4. Endpoints backend (PWT-04..PWT-07)

| Método | URL | Body | Response |
| --- | --- | --- | --- |
| GET | `/api/projects/[id]/docs/app-map` | — | `{ criteria, navigation }` |
| GET | `/api/projects/[id]/test-inventory` | query `?bundle=<rel>` | `{ criteria: { [id]: { hasUnitTest, hasPwautoSpec } } }` |
| POST | `/api/projects/[id]/docs/app-map/coverage/manual` | `{ criterionId, bundlePath }` | `{ ok, criterionId, sha256 }` |
| POST | `/api/projects/[id]/docs/app-map/coverage/reset` | `{ bundlePath }` | `{ ok, bundlesTouched, criteriaReset, failed }` |
| POST | `/api/projects/[id]/test-pwcli/run` | `{ criterionId, bundlePath }` | `{ ok, criterionId, verdict, agent: 'mock-pwcli' }` |

Writer atómico: `gray-matter` parse → SHA-256 pre → patch `criteria[].coverage.<method>` → stringify body verbatim → tmp → `fs.renameSync` → SHA-256 post.

## 5. Diagrama

```mermaid
flowchart LR
  route["/project/[id]?tab=test"] --> tabs[ProjectTabs.astro]
  tabs --> test[Tab test]
  test --> panel[TestTabPanel.astro]
  panel --> legend["Leyenda 8 estados<br/>test-tab-quickrun-legend"]
  panel --> rows["Lista de criterios<br/>test-tab-quickrun-criterion-<id>"]
  rows --> chips["Chip por método<br/>data-state data-color"]
  rows --> pwcliBtn["PW-CLI per-criterio"]
  rows --> manualBtn["Manual per-criterio"]
  pwcliBtn --> pwapi[POST /test-pwcli/run]
  manualBtn --> manualModal[Modal afirmación]
  manualModal --> manualapi[POST /coverage/manual]
  panel --> resetBtn["Reset coverage"]
  resetBtn --> resetModal[Modal con matiz disponibilidad]
  resetModal --> resetapi[POST /coverage/reset]
  pwapi --> writer[coverage-writer patchBundleCoverage]
  manualapi --> writer
  resetapi --> writer
  writer --> bundle[docs/app-map/views/project-workspace/features/test-tab.md]
  invapi[GET /test-inventory] --> writer
  bundle --> api[GET /docs/app-map]
  api --> panel
```
