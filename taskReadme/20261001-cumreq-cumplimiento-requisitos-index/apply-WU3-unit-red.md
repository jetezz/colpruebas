# Apply evidence — WU3-unit-red (unit-tests, serial tras WU1→WU2)

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Unidad: `WU3-unit-red` · `apply_lane: unit-tests` · estado: **done** (creación de test; verificación de suite escalada).
- Rama: `feature/20261001-cumreq-cumplimiento-requisitos-index` (source/target `develop`). Sin commit (delivery = orchestrator).
- Spec: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/spec.md` (SC-S4-rama-real, SC-S4-rama-fallback, SC-S4-cero-main, SC-S4-timestamp-ssr). Tasks: `.../tasks.md` §5 (WU3-unit-red, grupo `rama-main-cleanup`, serial tras WU1→WU2). Proposal: `.../proposal.md` (HRM-01 modify AFTER).
- Predecesoras: `WU1-code-rama` done + `WU2-doc-rama` done.
- `tdd_mode: strict` (triangulación post-hoc per `tasks.md` §5: WU1 GREEN aterrizó primero; este RED triangula post-hoc).

## Gate pre-escritura (unit-tests)

| Gate | Evidencia | Veredicto |
|---|---|---|
| Scope | WU3-unit-red, `apply_lane: unit-tests`; edit solo en owned `tests/unit/home/runtime-metadata.test.ts` | pass |
| Spec linkage | SC-S4-rama-real, SC-S4-rama-fallback, SC-S4-cero-main, SC-S4-timestamp-ssr | pass |
| Implementation target | `// @ac HRM-01, HRM-02, HSS-04` en línea 1 (≤10); aserciones rama real + fallback `develop` + negación `MAIN` + timestamp ISO | pass |
| Verification target | `sdd-verify-units`: `bun run scripts/test-runner.ts run --method=unit --target=home` en verde para el fichero | pendiente (escalado, no ejecutado en este lane) |
| Failure routing | `unit_test_issue` | pass |

## Ficheros creados/modificados (1 owned, 0 fuera de scope)

1. `tests/unit/home/runtime-metadata.test.ts` —
   - Cabecera `// @ac HRM-01, HRM-02, HSS-04` en línea 1 (≤10 primeras líneas).
   - Eliminada aserción fosilizada `const gitBranch = 'MAIN'` (línea 18 anterior).
   - Nuevas aserciones: `PUBLIC_GIT_BRANCH` + fallback `'develop'` + `gitBranch={gitBranch}` + `Rama Git:` en `InfoCard.astro` (rama real/fallback); `not.toContain('MAIN')` en `index.astro` e `InfoCard.astro` (cero `MAIN`); `PUBLIC_ENVIRONMENT` presente + `not.toContain('console.error')` (env alineado, consola limpia); timestamp `new Date().toISOString()` + `toMatch(/\d{4}-\d{2}-\d{2}T/)` (HRM-02).
   - Framework: `bun test`. Convención: test unitario junto a la superficie `home`, naming `*.test.ts`.

NO tocados (límite unit-tests-only): `frontend/**` (WU1 code), `docs/**` (WU2 doc), `tests/e2e/**` (WU4 pwauto).

## Verificación por lectura del contrato WU1 (sin ejecutar suites)

- `frontend/src/pages/index.astro:45`: `const gitBranch = import.meta.env.PUBLIC_GIT_BRANCH || 'develop'` OK (rama real/fallback `develop`).
- `frontend/src/pages/index.astro:8`: `PUBLIC_ENVIRONMENT || 'test'` OK (env alineado `production`/`development`, fallback `test`).
- `frontend/src/pages/index.astro`: cero `console.error` OK (path `catch` silencioso, protege HOME-05).
- `InfoCard.astro:31-32`: fila `Rama Git:` recibe `{gitBranch}` OK (HSS-04 intacto).

## TDD Cycle Evidence (strict, triangulación post-hoc)

| Fase | Evidencia |
|---|---|
| RED | El test nuevo MUST fallar contra código pre-GREEN (`const gitBranch = 'MAIN'`): `toContain('PUBLIC_GIT_BRANCH')` falla + `not.toContain('MAIN')` falla. No re-ejecutado aquí (GREEN ya aterrizó; el RED se triangula por lectura del diff pre/post). |
| GREEN | WU1 (`apply-WU1-code-rama.md`): `PUBLIC_GIT_BRANCH \|\| 'develop'`, cero `MAIN`; este test pasa contra ese estado (verificación por lectura arriba). |
| TRIANGULATE | 4 casos: rama-real/fallback, cero-MAIN (doble superficie index+InfoCard), env+consola, timestamp ISO con regex sobre valor generado además de presencia de fuente. |
| REFACTOR | N/A en este lane. |

## Desviaciones

- Ninguna respecto a spec/tasks. Nota: se añade lectura de `InfoCard.astro` + aserciones `PUBLIC_ENVIRONMENT`/`console.error` dentro del mismo fichero owned para triangular HSS-04/HOME-05 sin expandir scope (pedido WU3 del orchestrator: "env alineado, sin console.error").

## Escalado a sdd-orchestrator / verify lanes (no ejecutado en este lane por límite de autoridad)

- `sdd-verify-units`: correr `bun run scripts/test-runner.ts run --method=unit --target=home` sobre este fichero y confirmar verde (RED→GREEN tras WU1).
- Gate transversal TST-13: `bun run test:check` (orchestrator / verify lanes).
- Si el RED pasara antes de GREEN (violación de contrato), retorno a `sdd-apply-unit-tests` per `strict-tdd.md`.

## Follow-up / next

- WU4-pwauto-home (mismo conflicto `rama-main-cleanup`, serial tras WU3): limpiar `MAIN` en `tests/e2e/home/index.spec.ts:35`.
- Verify: `verify-units.md`, `verify-pwauto.md`, `verify-code.md`, doctors target `home` + `verify-report.md`.

## Delivery risks

- Riesgo bajo. Un solo fichero `*.test.ts` modificado; sin cambios runtime; sin migraciones; sin ficheros gitignored. Riesgo residual: la ejecución real de la suite queda pendiente en `sdd-verify-units`.
