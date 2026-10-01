# Apply evidence — WU4-pwauto-home (pwauto-tests, serial tras WU1→WU2→WU3)

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Unidad: `WU4-pwauto-home` · `apply_lane: pwauto-tests` · estado: **done** (autoría de spec; ejecución de suite escalada).
- Rama: `feature/20261001-cumreq-cumplimiento-requisitos-index` (source/target `develop`). Sin commit (delivery = orchestrator).
- Spec: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/spec.md` (SC-S1-identidad, SC-S2-frontend-env-*, SC-S3-api-salud-ok/degradado, SC-S4-rama-real/fallback/cero-main/timestamp-ssr/consola-limpia). Tasks: `.../tasks.md` §5 (WU4-pwauto-home, grupo `rama-main-cleanup`, serial tras WU3). Proposal: `.../proposal.md` (HRM-01 modify AFTER).
- Predecesoras: `WU1-code-rama` done + `WU2-doc-rama` done + `WU3-unit-red` done.
- Precondiciones browser/runtime: no inlinadas en el prompt de delegación (target environment, credentials contract, runtime kind no provistos a este lane); este lane no inventa `BASE_URL` ni runtime kind — la ejecución queda escalada a `sdd-verify-pwauto`.

## Gate pre-escritura (pwauto-tests)

| Gate | Evidencia | Veredicto |
|---|---|---|
| Scope | WU4-pwauto-home, `apply_lane: pwauto-tests`; edit solo en owned `tests/e2e/home/index.spec.ts` | pass |
| Spec linkage | SC-S1-identidad, SC-S2-frontend-env-prod/dev/fallback, SC-S3-api-salud-ok/degradado, SC-S4-rama-real/fallback/cero-main/timestamp-ssr/consola-limpia | pass |
| Implementation target | `// @ac HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02` en línea 1 (≤10); rama real/fallback `develop` + negación `MAIN`; filas Aplicación/Frontend/API/Rama Git; consola limpia tras `networkidle`; footer ISO 8601 | pass |
| Verification target | `sdd-verify-pwauto`: `bun run scripts/test-runner.ts run --method=pwauto --target=home` en verde | pendiente (escalado, no ejecutado en este lane) |
| Failure routing | `pwauto_issue`; defecto funcional → `functional_defect_found` → `p2_revision_requested` | pass |

## Ficheros creados/modificados (1 owned, 0 fuera de scope)

1. `tests/e2e/home/index.spec.ts` —
   - Cabecera unificada `// @ac HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02` en línea 1 (≤10 primeras líneas; antes 8 líneas separadas sin `HOME-05` explícito en cabecera).
   - Eliminada aserción fosilizada `toContainText('MAIN')` (línea 35 anterior).
   - Nuevas aserciones SC-S4-rama-real/fallback/cero-main: localiza fila `.info-row` con `Rama Git:`, lee `.value`, exige no vacía + `not.toContain('MAIN')` + `develop`/rama real no vacía (fallback documentado `develop` compatible con `index.astro:45`).
   - Cobertura entorno/salud: fila `Frontend:` con `/PRODUCCI.N|DESARROLLO|TEST/` (HSS-02 prod/dev/fallback); fila `API:` con `/API de (producci.n|desarrollo|test) funcionando/` (HSS-03 salud real o fallback estático por entorno).
   - Identidad intacta: `<title>` + heading `colpruebas`, tarjeta `.info-card` con `Aplicación:` + `colpruebas` (SC-S1-identidad, HOME-01/HSS-01).
   - Degradado + consola limpia: test HOME-05 conserva `errors` longitud 0 tras `networkidle` + comentario de trazabilidad SC-S3-api-degradado/SC-S4-consola-limpia (sin `console.error` en path SSR degradado, protege HSS-03).
   - Timestamp SSR: footer visible + `/\d{4}-\d{2}-\d{2}T/` intacto (HRM-02, SC-S4-timestamp-ssr).
   - Patrón repo preservado: `test.describe`, `testInfo.annotations`, `page.goto('/')`, locators `.info-card`/`.info-row`, estilo de aserción existente.

NO tocados (límite pwauto-only): `frontend/**` (WU1 code), `docs/**` (WU2 doc), `tests/unit/**` (WU3 unit-tests).

## Verificación por lectura del contrato WU1 (sin ejecutar suites)

- `frontend/src/pages/index.astro:45`: `gitBranch = import.meta.env.PUBLIC_GIT_BRANCH || 'develop'` OK (el spec acepta `develop` o rama real, niega `MAIN`).
- `frontend/src/pages/index.astro:11-23`: `frontendStatus`/`fallbackApiStatus` por `production`/`development`/`test` OK (regex del spec cubren los tres textos operativos).
- `frontend/src/pages/index.astro:27-42`: fetch SSR `PUBLIC_API_URL/health` + `AbortSignal.timeout(2000)` + `catch` silencioso OK (test consola `errors` 0 coherente).
- `frontend/src/components/InfoCard.astro:16-33`: filas `Aplicación:`/`Frontend:`/`API:`/`Rama Git:` con `.value` OK (locators `.info-row` + `.value` del spec alineados).

## TEST_PLAN.md

- Sin actualización: no existe `playwright/TEST_PLAN.md` en el repo y el alcance WU4 no incluye alta de fila; cobertura registrada vía cabecera `// @ac` + este artefacto.

## Escalado a sdd-orchestrator / verify lanes (no ejecutado en este lane por límite de autoridad)

- `sdd-verify-pwauto`: correr `bun run scripts/test-runner.ts run --method=pwauto --target=home` sobre este spec y confirmar verde en contextos de navegador disjuntos.
- Gate transversal TST-13: `bun run test:check` (orchestrator / verify lanes).
- Si el spec falla por defecto funcional (no por spec), ruta `functional_defect_found` → `p2_revision_requested` con rework en WU1.

## Desviaciones

- Ninguna respecto a spec/tasks. Nota: el spec no conmuta `PUBLIC_ENVIRONMENT`/`PUBLIC_GIT_BRANCH` en runtime (build-time SSR); cubre prod/dev/fallback por regex inclusiva + fallback `develop` aceptado, coherente con el contrato WU4 ("filas por entorno").

## Follow-up / next

- Verify: `verify-pwauto.md` (ejecución), `verify-report.md` consolidado, doctors target `home`.
- Cierre de grupo `rama-main-cleanup`: grep cero `MAIN` operativo en código+docs+tests (WU1/WU2/WU3/WU4).

## Delivery risks

- Riesgo bajo. Un solo spec `*.spec.ts` modificado; sin cambios runtime; sin migraciones; sin ficheros gitignored. Riesgo residual: la ejecución real PW-AUTO queda pendiente en `sdd-verify-pwauto` (target environment / BASE_URL no provistos a este lane).
