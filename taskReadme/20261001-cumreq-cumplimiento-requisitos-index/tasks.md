# Tasks — Cumplimiento de requisitos y corrección del index colpruebas

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Fase: fase 2 (`fase_2_implementacion`, estado `p2_planning`). Propuesta aprobada 2026-10-01 + spec en `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/spec.md` (13 escenarios S1–S5, 8 IDs: HRM-01 modify + 7 maintain).
- Índice: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index.md`. Propuesta: `.../proposal.md`. Spec: `.../spec.md`.
- Este artefacto NO implementa; solo desglosa work-units accionables según `apply-work-unit-schema` (13 columnas + 4 campos contractuales) + `strict-tdd` (RED vía `sdd-apply-unit-tests`, GREEN vía `sdd-apply-code`).
- `strict_tdd: true` (runner `scripts/test-runner.ts` existe; verificado en bootstrap sdd-init §7 del índice).

## 1. Alcance (in/out)

In (fase 2, activo):

- `frontend/src/pages/index.astro`: `PUBLIC_GIT_BRANCH` con fallback `develop`, `PUBLIC_ENVIRONMENT` alineado (`production`/`development`, fallback `test`), fetch SSR `/health` con timeout corto + fallback estático, cero `MAIN`.
- `frontend/src/components/InfoCard.astro`: fila `Rama Git:` recibe valor real (sin cambio estructural).
- `frontend/src/env.d.ts`: tipado `PUBLIC_ENVIRONMENT`, `PUBLIC_API_URL`, `PUBLIC_GIT_BRANCH`.
- `frontend/Dockerfile.prod`: `ARG/ENV PUBLIC_GIT_BRANCH` (+ `Dockerfile.dev` si aplica).
- `compose/compose.prod.yml` + `compose/compose.dev.yml`: inyección `PUBLIC_GIT_BRANCH` (+ `PUBLIC_API_URL` en dev, hoy ausente: dev inyecta `API_URL` no consumido).
- `.env.example`: firma de las tres `PUBLIC_*` + fallbacks documentados.
- Docs App Map (unidad docs separada, docs-owned pathnames).

Out (no es work-unit; es verificación transversal §6):

- Doctors canónicos + `requirements-check` + `test:check`: los ejecutan `sdd-verify-requirements` / `sdd-orchestrator` y las verify lanes (`sdd-verify-code`, `sdd-verify-units`, `sdd-verify-pwauto`), NO se emiten como work-units apply. Comandos exactos en §6.
- Endpoints backend nuevos (se reutilizan `/health`, `/api/status`). Cambios visuales fuera de la tarjeta. Otros targets fuera de `home`. Rama/PR (delivery v15: `sdd-orchestrator`, `source_branch=develop`, `target=develop`, patrón `feature/<task_id>-<slug>`).

## 2. Criterios de aceptación en prosa (referencia al bundle, no redefinición)

La definición vigente de cada criterio vive en su bundle App Map propietario; aquí solo el comportamiento verificable aprobado en proposal/spec:

- HRM-01 (modify, bundle `views/home/features/runtime-metadata`): la tarjeta MUST mostrar la rama git real resuelta en build-time SSR desde `PUBLIC_GIT_BRANCH` con fallback documentado `develop`; MUST NOT renderizar `MAIN` en ningún entorno (cero `MAIN` operativo).
- HOME-01 / HSS-01: identidad `colpruebas` intacta (`<title>`, heading, tarjeta `Aplicación:`).
- HOME-05: consola limpia (cero `console.error` incl. path fetch SSR degradado).
- HSS-02: fila `Frontend:` por `PUBLIC_ENVIRONMENT` (`production`/`development`, fallback `test`).
- HSS-03: fila `API:` con salud real SSR + fallback estático ante fallo/timeout, patrón de color por entorno intacto.
- HSS-04: fila `Rama Git:` renderizada (solo cambia el valor recibido).
- HRM-02: timestamp ISO 8601 SSR intacto.

## 3. Archivos owned por unidad (resumen)

- WU1 (code-high): `frontend/src/pages/index.astro`, `frontend/src/components/InfoCard.astro`, `frontend/src/env.d.ts`, `frontend/Dockerfile.prod` (+ `frontend/Dockerfile.dev` si aplica), `compose/compose.prod.yml`, `compose/compose.dev.yml`, `.env.example`. NO toca `tests/**` ni `docs/**` (prohibido para apply-code: test creation / doc writing).
- WU2 (doc): `docs/app-map/views/home/features/runtime-metadata.md` (+ `docs/app-map/views/home/index.md`, `docs/app-map/views/home/features/status-summary.md` y `docs/app-map/runtime-metadata.md` solo si citan `MAIN`; si no citan, no se tocan), `.env.example` solo como referencia de firma (owned por WU1; WU2 no lo edita para evitar colisión).
- WU3 (unit-tests, diferida fase 3): `tests/unit/home/runtime-metadata.test.ts` (cabecera `// @ac` en las 10 primeras líneas).
- WU4 (pwauto-tests, diferida fase 3): `tests/e2e/home/index.spec.ts` (cabecera `// @ac` en las 10 primeras líneas).

Reconciliación E5 ("misma unidad"): el protocolo de lanes prohíbe que code escriba tests/docs, por lo que la atomicidad "una sola unidad rama" se implementa como **grupo de conflicto único `rama-main-cleanup` + orden serial estricto WU1 → WU2 → WU3 → WU4** con evidencia común (grep cero `MAIN`). Ninguna unidad se cierra sin el grep del §5.

## 4. Desglose activo fase 2 (únicas unidades schedulables en `fase_2_implementacion`)

Complejidad WU1 (MAX de 3 señales): ficheros owned 7 (señal 1 → MEDIUM) · superficies ≥3 (SSR Astro + runtime compose/Docker + config env → señal 2 HIGH) · naturaleza `cross_surface` + topología runtime (señal 3 ≥ MEDIUM) ⇒ **code-high ⇒ serial siempre, solo**.

| Unit | Estado | apply_lane | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Mirror topic | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WU1-code-rama | pending | code-high | Resolver rama real build-time SSR (`PUBLIC_GIT_BRANCH` fallback `develop`), alinear `PUBLIC_ENVIRONMENT`, fetch SSR `/health` con timeout+fallback, tipar `env.d.ts`, inyectar compose dev/prod + `Dockerfile.prod` ARG/ENV, firmar `.env.example`; cero `MAIN` en código/runtime/firma | `frontend/src/pages/index.astro`, `frontend/src/components/InfoCard.astro`, `frontend/src/env.d.ts`, `frontend/Dockerfile.prod`, `compose/compose.prod.yml`, `compose/compose.dev.yml`, `.env.example` | none | `rama-main-cleanup` | serial | none | SC-S1-identidad, SC-S2-frontend-env-prod, SC-S2-frontend-env-dev, SC-S2-frontend-env-fallback, SC-S3-api-salud-ok, SC-S3-api-degradado, SC-S4-rama-real, SC-S4-rama-fallback, SC-S4-cero-main, SC-S4-consola-limpia | `frontend/src/pages/index.astro`: `gitBranch = import.meta.env.PUBLIC_GIT_BRANCH \|\| "develop"`, `environment` alineado `production/development` fallback `test`, `apiStatus` vía fetch SSR a `PUBLIC_API_URL/health` con `AbortSignal.timeout(<corto>)` + `try/catch` fallback estático sin `console.error`; `InfoCard.astro:32` recibe `gitBranch`; `env.d.ts` declara las 3 `PUBLIC_*`; `Dockerfile.prod` `ARG PUBLIC_GIT_BRANCH` + `ENV`; compose dev/prod `PUBLIC_GIT_BRANCH` (+ `PUBLIC_API_URL` en dev) | `sdd-verify-code` inspecciona: `index.astro` sin literal `MAIN`, fallback `develop` presente, `PUBLIC_ENVIRONMENT` distingue `production`/`development` con fallback `test`, fetch SSR con timeout y `catch` que devuelve texto estático sin `console.error`, `env.d.ts` con las 3 keys, `Dockerfile.prod` con `ARG/ENV`, ambos compose con `PUBLIC_GIT_BRANCH` (dev además `PUBLIC_API_URL`); `rg -n "MAIN" <archivos owned WU1>` con cero hits operativos | code_issue |
| WU2-doc-rama | pending | doc | Documentar fallback `develop`/`test`, rama real vía `PUBLIC_GIT_BRANCH` y firma env en `runtime-metadata.md` (+ docs home que citen `MAIN`); eliminar `MAIN` fosilizado en docs | `docs/app-map/views/home/features/runtime-metadata.md` (+ `docs/app-map/views/home/index.md`, `docs/app-map/views/home/features/status-summary.md`, `docs/app-map/runtime-metadata.md` solo si citan `MAIN`) | WU1-code-rama | `rama-main-cleanup` | serial | none | SC-S4-rama-fallback, SC-S4-cero-main, SC-S2-frontend-env-fallback | `docs/app-map/views/home/features/runtime-metadata.md`: secciones de `PUBLIC_GIT_BRANCH` (fallback `develop`) y `PUBLIC_ENVIRONMENT` (fallback `test`) + contrato HRM-01 AFTER; criterio `coverage.evidence_paths` actualizado al estado post-cambio | `sdd-verify-code` (revisión doc/policy read-only): el doc describe `PUBLIC_GIT_BRANCH`→`develop` y `PUBLIC_ENVIRONMENT`→`test`, reproduce el bloque AFTER de HRM-01 sin redefinir el bundle, y `rg -n "MAIN" docs/app-map/views/home/` da cero hits operativos (solo historia/spec permitidos) | doc_issue |

Notas de autorización:

- WU1: lane `sdd-apply-code-high` en `binding.lanes` (`owner_phase: fase_2_implementacion`) y en `allowed_lanes` de `fase_2_implementacion`. OK activo.
- WU2: lane `sdd-apply-doc` en `binding.lanes` con `owner_phase` primario `fase_4_documentacion`, pero **explícitamente listado en `allowed_lanes` de `fase_2_implementacion`**; se emite como activo fase 2 por esa autorización expresa. Tensión registrada en §8 (si `sdd-orchestrator` la interpreta estricta por `owner_phase`, mover WU2 a diferida fase 4 con el mismo contrato y orden).
- `sdd-apply-doc` NO edita `.env.example` (owned WU1) para mantener ownership disjunto; verifica la firma por lectura.

## 5. Unidades diferidas (NO activas en fase 2; pre-contrato para su fase propietaria)

Per `sdd-tasks` gate: lanes cuyo `owner_phase` está fuera de `fase_2_implementacion` NO se schedulean como trabajo activo, NO se marcan dependency-ready y NO participan del orden serial activo. Se pre-definen aquí con contrato completo para que `sdd-orchestrator` las active tras la transición de binding a su fase. Orden previsto tras activación: WU1 → WU2 → WU3 → WU4 (mismo `rama-main-cleanup`, serial).

| Unit | Estado | apply_lane | Objetivo | Archivos owned | Depende de (al activar) | Conflict group | Modo | Mirror topic | Spec scenarios linked | Implementation contract | Verify expects | Routing tag on failure |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WU3-unit-red | pending (diferida → fase_3 `p3_test_preparing`) | unit-tests | RED strict-tdd: actualizar `runtime-metadata.test.ts` (`MAIN` → rama real/fallback `develop` + timestamp SSR), cabecera `// @ac` | `tests/unit/home/runtime-metadata.test.ts` | WU1-code-rama, WU2-doc-rama | `rama-main-cleanup` | serial | none | SC-S4-rama-real, SC-S4-rama-fallback, SC-S4-cero-main, SC-S4-timestamp-ssr | `tests/unit/home/runtime-metadata.test.ts`: `// @ac HRM-01, HRM-02, HSS-04` en las 10 primeras líneas; aserciones: rama resuelta `=== PUBLIC_GIT_BRANCH` o fallback `develop`, negación de `MAIN`, timestamp matchea `/\d{4}-\d{2}-\d{2}T/`; el test MUST fallar en RED contra el código pre-GREEN y pasar tras WU1 | `sdd-verify-units`: `bun run scripts/test-runner.ts run --method=unit --target=home` en verde para el fichero; si el RED pasa antes de GREEN (violación de contrato) ruta a `sdd-apply-unit-tests` a corregir el RED | unit_test_issue |
| WU4-pwauto-home | pending (diferida → fase_3 `p3_test_preparing`) | pwauto-tests | Actualizar `index.spec.ts` (`MAIN` → rama real/fallback, salud real, consola limpia), cabecera `// @ac` | `tests/e2e/home/index.spec.ts` | WU1-code-rama, WU2-doc-rama, WU3-unit-red | `rama-main-cleanup` | serial | none | SC-S1-identidad, SC-S2-frontend-env-prod, SC-S2-frontend-env-dev, SC-S2-frontend-env-fallback, SC-S3-api-salud-ok, SC-S3-api-degradado, SC-S4-rama-real, SC-S4-rama-fallback, SC-S4-cero-main, SC-S4-timestamp-ssr, SC-S4-consola-limpia | `tests/e2e/home/index.spec.ts`: `// @ac HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02` en las 10 primeras líneas; specs: título+heading+`Aplicación:`, filas `Frontend:`/`API:`/`Rama Git:` por entorno, degradado API sin `console.error` (assert `errors` longitud 0 tras `networkidle`), `footer` ISO 8601 | `sdd-verify-pwauto`: `bun run scripts/test-runner.ts run --method=pwauto --target=home` en verde; contextos de navegador disjuntos; si falla por defecto funcional (no por spec), ruta `functional_defect_found` → `p2_revision_requested` | pwauto_issue |

Tensión strict-tdd registrada: el ciclo canónico exige RED (WU3) antes de GREEN (WU1), pero el binding ordena code en fase 2 y tests en fase 3. Secuencia efectiva: WU1 GREEN aterriza primero; WU3/WU4 triangulan post-hoc en fase 3; si el RED revela defecto funcional, transición `p3_test_running → p2_revision_requested` (`functional_defect_found`) y rework en WU1. Ninguna fase se cierra sin `test:check` verde (§6).

## 6. Verificación transversal (NO son work-units; mapping §6 de `apply-work-unit-schema`)

| apply_lane | Verificación requerida (lane `role: verification`) |
|---|---|
| code-high (WU1) | `sdd-verify-code` (`artifact_class: code_review`) siempre; `sdd-verify-units` (`unit_test_review`) si hay lógica testeable nueva |
| doc (WU2) | `sdd-verify-code` (revisión doc/policy read-only) |
| unit-tests (WU3) | `sdd-verify-units` (`unit_test_review`) |
| pwauto-tests (WU4) | `sdd-verify-pwauto` (`pwauto_test_review`) |

Comandos doctors/gate (los ejecuta `sdd-verify-requirements` / `sdd-orchestrator`, cubren SC-S5-doctors-target-home y SC-S5-gate-test-check para los 8 IDs):

- `bun .agents/skills/projectctl-requirements/scripts/project/doctor-test.ts --root . --target=home --json`
- `bun .agents/skills/projectctl-requirements/scripts/project/doctor-structure.ts --root . --target=home --json`
- `bun .agents/skills/projectctl-requirements/scripts/project/doctor-docs.ts --root . --target=home --json`
- `bun .agents/skills/projectctl-requirements/scripts/project/app-map-inventory.ts --root . --target=home --json` (inventario app-map; nombre según perfil `app-map-inventory`)
- `bun .agents/skills/projectctl-requirements/scripts/project/criterion-contract.ts --root . --target=home --json` (contrato de criterio; nombre según perfil `criterion-contract`)
- `bun scripts/skill/requirements-check.ts --root . --check` (y variante `--target=home` donde el perfil lo soporte)
- `bun run test:check` (gate TST-13; runner unificado `bun run scripts/test-runner.ts check` + `run --method=unit|pwauto --target=home`)
- Evidencia común rama: `rg -n "MAIN" frontend/src/pages/index.astro frontend/src/components/InfoCard.astro docs/app-map/views/home/ tests/e2e/home/index.spec.ts tests/unit/home/runtime-metadata.test.ts` → cero hits operativos (SC-S4-cero-main). Done condition global: doctors verdes target `home` + `test:check` verde + grep cero `MAIN`.

## 7. Orden recomendado y artefactos de evidencia

1. WU1-code-rama (activo fase 2, serial solo) → evidencia en `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/apply-WU1-code-rama.md`.
2. WU2-doc-rama (activo fase 2, serial tras WU1, mismo conflicto) → evidencia en `.../apply-WU2-doc-rama.md`.
3. Transición binding → fase 3 → WU3-unit-red (RED/GREEN/TRIANGULATE) → evidencia en `.../apply-WU3-unit-red.md`.
4. WU4-pwauto-home (serial tras WU3) → evidencia en `.../apply-WU4-pwauto-home.md`.
5. Verify lanes + doctors/gate §6 → `verify-code.md`, `verify-units.md`, `verify-pwauto.md`, `verify-requirements-technical.md`, `verify-report.md`.

## 8. Riesgos y bloqueos conocidos

- Tensión E5 vs separación de lanes: resuelta con conflicto compartido + orden serial + grep común (ver §3). Cambio parcial (solo código sin docs/tests) prohibido: `sdd-orchestrator` no cierra sin las 4 evidencias.
- Tensión strict-tdd RED-antes-de-GREEN vs fases code-antes-de-tests: resuelta con triangulación post-hoc + ruta `functional_defect_found` (ver §5).
- Tensión `sdd-apply-doc` (`owner_phase` fase 4 vs `allowed_lanes` fase 2): WU2 emitido activo por autorización expresa en `allowed_lanes`; si el resolver lo rechaza, diferir a fase 4 sin cambiar contrato ni orden.
- `STRICT_READER` sin verificar bajo reader gestionado; latencia fetch SSR (mitigación: timeout corto + fallback, protege HOME-05); desalineación `API_URL` vs `PUBLIC_API_URL` en dev (mitigación: WU1 inyecta `PUBLIC_API_URL` en compose dev).
- Superficie de entrega: ningún fichero touched es generado/gitignored (`frontend/test-results/`, `.runtime/`, `.env`, `.env.dev` excluidos del commit; firma commitada solo `.env.example`).

## 9. Previsión de carga (workload forecast, advisory para `binding.modes.delivery_mode`)

- Líneas autoradas estimadas (adds+dels, sin goldens generados): WU1 ~90–130 (index.astro ~40–60, InfoCard ~5, env.d.ts ~10, Dockerfile.prod ~5, compose ×2 ~15, `.env.example` ~10) · WU2 ~30–50 · WU3 ~30–50 · WU4 ~50–80. Total ~200–310.
- `400-line budget risk: Low`.
- `Chained PRs recommended: No` (default `single-pr`; un único PR `feature/20261001-cumreq-cumplimiento-requisitos-index` → `develop`).

```criteria-links/v1
{
  "schema": "criteria-links/v1",
  "criteria": ["HOME-01", "HOME-05", "HSS-01", "HSS-02", "HSS-03", "HSS-04", "HRM-01", "HRM-02"],
  "units": [
    {"id": "WU1-code-rama", "criterion_ids": ["HOME-01", "HOME-05", "HSS-01", "HSS-02", "HSS-03", "HSS-04", "HRM-01"], "scenario_ids": ["SC-S1-identidad", "SC-S2-frontend-env-prod", "SC-S2-frontend-env-dev", "SC-S2-frontend-env-fallback", "SC-S3-api-salud-ok", "SC-S3-api-degradado", "SC-S4-rama-real", "SC-S4-rama-fallback", "SC-S4-cero-main", "SC-S4-consola-limpia"]},
    {"id": "WU2-doc-rama", "criterion_ids": ["HSS-02", "HRM-01"], "scenario_ids": ["SC-S2-frontend-env-fallback", "SC-S4-rama-fallback", "SC-S4-cero-main"]},
    {"id": "WU3-unit-red", "criterion_ids": ["HSS-04", "HRM-01", "HRM-02"], "scenario_ids": ["SC-S4-rama-real", "SC-S4-rama-fallback", "SC-S4-cero-main", "SC-S4-timestamp-ssr"]},
    {"id": "WU4-pwauto-home", "criterion_ids": ["HOME-01", "HOME-05", "HSS-01", "HSS-02", "HSS-03", "HSS-04", "HRM-01", "HRM-02"], "scenario_ids": ["SC-S1-identidad", "SC-S2-frontend-env-prod", "SC-S2-frontend-env-dev", "SC-S2-frontend-env-fallback", "SC-S3-api-salud-ok", "SC-S3-api-degradado", "SC-S4-rama-real", "SC-S4-rama-fallback", "SC-S4-cero-main", "SC-S4-timestamp-ssr", "SC-S4-consola-limpia"]}
  ]
}
```
