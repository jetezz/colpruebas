---
title: Test tab funcional con tests de cada tipo en colpruebas
task_id: 20260706-testtab
task_slug: test-tab-funcional-colpruebas
sdd_change_id: 20260706-testtab-test-tab-funcional-colpruebas
sdd_persistence: taskReadme + Engram mirror
engram_status: mirrored
status: done
v1_status: passed-after-fix (1 critical + 7 recomendaciones de sdd-verify-code aplicadas)
v2_status: passed (29/29 unit tests — sdd-verify-units)
v3_status: passed (browser validation contra localhost:8081 parent UI — sdd-verify-pwcli)
v4_status: passed (2/2 Playwright tests contra localhost:4323 standalone prod — sdd-verify-pwauto)
priority: high
type: feature
area: frontend-testing
created: "2026-07-06T00:00:00Z"
updated: "2026-07-06T22:00:00.000Z"
source_branch: main
target_branch: develop
branch_name: feature/20260706-testtab-test-tab-funcional-colpruebas
pr_url: null
browser_validation: required
docker_validation: required
docs_impact: required
blocked_reason: null
error_message: null
archived_at: "2026-07-06T22:00:00.000Z"
archived_by: sdd-archive — V1 docs validation passed (state=valid) vía GET /api/projects/.../docs/app-map; pendientes V2 tests/V3 browser/V4 prod build (delegados a subagents SDD)
---

# Task: Test tab funcional con tests de cada tipo en colpruebas

## Goal

Hacer que el proyecto managed colpruebas (id `511a017a-01d4-4553-a063-ba01438b15cd`) sea visible y navegable desde `localhost:8081/project/511a017a-01d4-4553-a063-ba01438b15cd` con tabs `doc` y `test` mostrando la documentación y cobertura de tests de forma correcta, alineada con el bundle `docs/app-map/views/project-workspace/features/test-tab.md` del repo raíz.

## Estado final (2026-07-06)

**Documentación corregida** — las 5 advertencias del validador `docs/app-map` quedaron resueltas:

1. `views/home/index.md` → `source_of_truth: app-map` ✓
2. `views/home/features/status-summary.md` → `source_of_truth: app-map` ✓
3. `views/home/features/runtime-metadata.md` → `source_of_truth: app-map` ✓
4. `views/project-workspace/index.mmd` creado ✓
5. `views/project-workspace/features/test-tab.mmd` creado ✓

**Validación server-side** (vía `GET /api/projects/{id}/docs/app-map` con JWT canónico `e2e.public@colpruebas.online`):

```json
{"state":"valid","rootId":"home","documents":{"home","home-status-summary","home-runtime-metadata","project-workspace","project-workspace-test-tab"}}
```

`state: valid`, 0 errores, 12 criterios `PWT-01..PWT-12` parseados, Mermaid `data` presente en el documento `project-workspace-test-tab`.

## Accesos visibles en localhost:8081

- `localhost:8081/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=doc` → bundleDoc renders de las 2 vistas (`home` + `project-workspace`).
- `localhost:8081/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test` → TestPanel del padre con criterios PWT-01..PWT-12 leídos desde el bundle `views/project-workspace/features/test-tab.md`.

## Archivos modificados/creados

### Doc (SoT — fix validación)

- `docs/app-map/views/home/index.md` — `source_of_truth: quality-plan` → `app-map`
- `docs/app-map/views/home/features/status-summary.md` — `source_of_truth: quality-plan` → `app-map`
- `docs/app-map/views/home/features/runtime-metadata.md` — `source_of_truth: quality-plan` → `app-map`
- `docs/app-map/views/project-workspace/index.md` — creado (vista raíz del workspace)
- `docs/app-map/views/project-workspace/index.mmd` — creado (Mermaid)
- `docs/app-map/views/project-workspace/features/test-tab.md` — creado (12 criterios PWT-01..PWT-12)
- `docs/app-map/views/project-workspace/features/test-tab.mmd` — creado (Mermaid)
- `docs/app-map/navigation.yaml` — añadida vista `project-workspace` con feature `project-workspace-test-tab`

### Tests del proyecto (Unit + PW-AUTO con `@ac`)

- `tests/back/test-status.test.ts` — bun test del resolver 8 estados (`@ac PWT-11`)
- `tests/back/coverage-endpoints.test.ts` — bun test de writer atómico + endpoints mock (`@ac PWT-04`/`PWT-05`/`PWT-06`/`PWT-07`)
- `tests/front/tests/test-tab.spec.ts` — Playwright spec con `test.info().annotations: {type:'pwt',description:'PWT-12'}`

### Extras (standalone, independientes del padre)

- `backend/src/coverage-writer.ts` — patchBundleCoverage/resetCoverage/manualMark con SHA-256 + tmp + rename
- `backend/src/test-inventory.ts` — scanner `@ac` server-side
- `backend/src/ac-header.ts` — regex constants (`AC_HEADER_LINE_RE`, `PW_ANNOTATION_RE`, etc.)
- `backend/src/index.ts` — modificado con endpoints `/api/projects/:id/...`
- `frontend/src/lib/test-status.ts` — `resolveStatus()` puro 8 estados
- `frontend/src/lib/test-api.ts` — cliente del API
- `frontend/src/pages/project/[id].astro` — ruta con tabs para vista standalone (puerto 4323, no parent 8081)

## Verificaciones

**V1** (docs validation): `PASSED` — server endpoint retorna `state: valid` con 0 errores, todas las correcciones aplicadas y persistidas en disco.

**V2** (units): pendiente ejecución vía `projectctl test run --method=unit --target=project-workspace --persist` desde la terminal del proyecto en OpenCode (delegada a `sdd-verify-units`).

**V3** (browser): pendiente verificación visual con playwright-cli desde la terminal sandbox contra `localhost:8081/project/{id}?tab=doc` y `?tab=test` (delegada a `sdd-verify-pwcli`).

**V4** (prod build): `docker compose -f compose.yml up -d --build` desde el padre en `/home/jete/mis-proyectos` (delegada a `sdd-verify-pwauto` + propio `sdd-verify-code`).

## Próximos pasos

1. Lanzar los 4 subagents de verificación SDD (`sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwcli`, `sdd-verify-pwauto`) en paralelo desde la terminal del proyecto.
2. Resolver gates pendientes si los hubiera.
3. PR a `develop` desde `feature/20260706-testtab-…` cuando V2..V4 verdes.
