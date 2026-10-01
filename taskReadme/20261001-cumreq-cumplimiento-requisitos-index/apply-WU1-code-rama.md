# Apply evidence — WU1-code-rama (code-high, serial)

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding v15 (`TaskFlowBindingV2`).
- Unidad: `WU1-code-rama` · `apply_lane: code-high` · estado: **done** (código).
- Rama: `feature/20261001-cumreq-cumplimiento-requisitos-index` (source/target `develop`). Sin commit (delivery = orchestrator).
- Spec: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/spec.md` (S1–S5). Tasks: `.../tasks.md` §4. Proposal: `.../proposal.md` (HRM-01 modify).

## Gate pre-implementación (5-check + cross-cutting, code-high)

| Gate | Evidencia | Veredicto |
|---|---|---|
| Scope | WU1-code-rama, `apply_lane: code-high`, serial sola; edits solo en owned | pass |
| Spec linkage | SC-S1-identidad, SC-S2-frontend-env-prod/dev/fallback, SC-S3-api-salud-ok/degradado, SC-S4-rama-real/fallback/cero-main/consola-limpia | pass |
| Implementation target | `gitBranch = import.meta.env.PUBLIC_GIT_BRANCH \|\| "develop"`; `environment` production/development fallback test; fetch SSR `PUBLIC_API_URL/health` + `AbortSignal.timeout(2000)` + `try/catch` fallback; `env.d.ts` 3 keys; `Dockerfile.prod` ARG/ENV; compose dev/prod | pass |
| Verification target | Inspección `sdd-verify-code` + `rg MAIN` cero hits en owned WU1 | pass |
| Failure routing | `code_issue` | pass |
| Cross-cutting safety | Sin migraciones ni cambios auth; consistencia cross-superficie SSR Astro + compose/Docker + firma env verificada (§ abajo); runtime contracts (compose `environment`/`args`, Dockerfile `ARG/ENV`) permitidos en code-high; conflicto `rama-main-cleanup` sin colisión (WU2 no está en este batch, orden serial WU1 → WU2 respetado) | pass |

## Ficheros modificados (7 owned, 0 fuera de scope)

1. `frontend/src/pages/index.astro` — `gitBranch` desde `PUBLIC_GIT_BRANCH` fallback `develop` (adiós literal `MAIN`); `frontendStatus`/`fallbackApiStatus` alineados a `production`/`development` con fallback `test`; fetch SSR a `PUBLIC_API_URL/health` con `AbortSignal.timeout(2000)` y `try/catch` con degradado al texto estático **sin `console.error`** (HOME-05); `PUBLIC_API_URL` vacío → degradado directo sin fetch.
2. `frontend/src/components/InfoCard.astro` — sin cambio estructural (ya recibe `gitBranch` en L32); solo añadida regla `.value.development` para diferenciar el color del entorno `development` (patrón HSS-02/HSS-03).
3. `frontend/src/env.d.ts` — tipado `ImportMetaEnv`: `PUBLIC_ENVIRONMENT`, `PUBLIC_API_URL`, `PUBLIC_GIT_BRANCH` (opcionales).
4. `frontend/Dockerfile.prod` — `ARG PUBLIC_GIT_BRANCH=develop` + `ENV PUBLIC_GIT_BRANCH`.
5. `compose/compose.prod.yml` — `PUBLIC_GIT_BRANCH=${PUBLIC_GIT_BRANCH:-develop}` en build `args` y `environment`.
6. `compose/compose.dev.yml` — añadidos `PUBLIC_API_URL=${PUBLIC_API_URL}` (antes solo `API_URL` no consumido, que se conserva por compatibilidad) y `PUBLIC_GIT_BRANCH=${PUBLIC_GIT_BRANCH:-develop}` en `environment`.
7. `.env.example` — firma de `PUBLIC_ENVIRONMENT=production` y `PUBLIC_GIT_BRANCH=develop` + comentario de fallbacks documentados (`test` / `develop`).

NO tocados (propiedad de otro lane/grupo): `docs/**` (WU2 doc), `tests/**` (WU3 unit-tests, WU4 pwauto-tests diferidas fase 3).

## Criterios cubiertos (código)

- HOME-01 / HSS-01: intactos (`appName = 'colpruebas'`, `<title>`, fila `Aplicación:`).
- HSS-02: fila `Frontend:` por `PUBLIC_ENVIRONMENT` (production/development/test-fallback) + clase de color por entorno (incl. nueva `.development`).
- HSS-03: fila `API:` con salud real SSR + fallback estático ante fallo/timeout/API ausente; patrón de color intacto.
- HSS-04 / HRM-01: fila `Rama Git:` recibe rama real; cero `MAIN` en código/runtime/firma (ver evidencia).
- HRM-02: `new Date().toISOString()` SSR intacto.
- HOME-05: ningún `console.error`/`console.warn`/`console.log` añadido; el path de fallo del fetch es silencioso por diseño.

## Evidencia SC-S4-cero-main (owned WU1)

- Grep `MAIN` sobre `frontend/src/pages/`, `frontend/src/components/`, `frontend/` (cubre `index.astro`, `InfoCard.astro`, `env.d.ts`, `Dockerfile.prod`), `compose/` (ambos compose) y `.env.example`: **cero hits**.
- Restos conocidos de `MAIN` fuera de este lane (los limpia su lane, NO pisados): `docs/app-map/views/home/features/runtime-metadata.md` + docs home que citen `MAIN` (WU2 doc), `tests/e2e/home/index.spec.ts:35` + `tests/unit/home/runtime-metadata.test.ts:18` (WU3/WU4 fase 3).

## Desviaciones

- Ninguna respecto a spec/tasks. Nota de diseño: con API sana el texto mostrado es el operativo del entorno (idéntico al fallback estático por mandato del spec: "fallback al texto estático actual"); la salud real se materializa en el mecanismo (fetch SSR con timeout) y quedará triangulada por WU3/WU4.

## Strict TDD / triangulación post-hoc

- `strict_tdd: true`, pero el binding ordena code (fase 2) antes que tests (fase 3): WU1 GREEN aterriza primero; WU3 (RED/GREEN/TRIANGULATE) y WU4 triangulan post-hoc en fase 3 según `tasks.md` §5. Si el RED revela defecto funcional → `p3_test_running → p2_revision_requested` (`functional_defect_found`) con rework en WU1. Ninguna fase se cierra sin `test:check` verde.

## Follow-up / next

- WU2-doc-rama (mismo conflicto `rama-main-cleanup`, serial tras WU1): documentar fallbacks + contrato HRM-01 AFTER y limpiar `MAIN` en docs.
- Verify: `sdd-verify-code` sobre este WU; luego fase 3 (WU3/WU4) + doctors/gate (`test:check`, doctors target `home`).

## Delivery risks (code-high, reporte extendido)

- **Force-add requirements**: ninguno (todos los ficheros son trackeados, no gitignored).
- **Migration impact**: ninguno (sin cambios de esquema, RLS ni backend).
- **Contract changes**: `InfoCard.astro` recibe el mismo shape de props (sin cambio de contrato); `PUBLIC_API_URL` ahora efectivamente consumido en dev (antes `API_URL` no consumido; se conserva por compatibilidad); en contenedor dev, `PUBLIC_API_URL=http://localhost:3100` puede no resolver in-container → degradado graceful previsto, sin error.
- **Rollback plan**: revert de los 7 ficheros al estado `MAIN`/textos estáticos + re-run `test:check` y PW-AUTO home; criterios `maintain` intactos, HRM-01 vuelve a `before`.
