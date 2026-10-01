# Verify PW-AUTO — 20261001-cumreq-cumplimiento-requisitos-index

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Lane: `sdd-verify-pwauto` · veredicto: **blocked** (`environment_stale`; previo `browser-target-missing` ya resuelto por `sdd-orchestrator`, ver §Reintento).
- Unidad bajo verificación: `WU4-pwauto-home` (contrato en `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/tasks.md` §5; evidencia de autoría en `.../apply-WU4-pwauto-home.md`, estado `done`, ejecución escalada).
- Índice: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index.md` (§3 criterios, §6 verificación). Spec: `.../spec.md` (SC-S1–S5). Proposal: `.../proposal.md`.
- Rama: `feature/20261001-cumreq-cumplimiento-requisitos-index` (source/target `develop`).

## Gate de autorización

- Work unit con los 4 campos contractuales (`Spec scenarios linked`, `Implementation contract`, `Verify expects`, `Routing tag on failure`): **presentes** en `tasks.md` §5 fila WU4-pwauto-home (`pwauto_issue`; defecto funcional → `functional_defect_found` → `p2_revision_requested`). Gate contractual OK.
- Escritura limitada al detalle `### PW-AUTO` de este artefacto; sin crear/editar specs ni `playwright/TEST_PLAN.md`. OK.

## Precondiciones browser (sdd-verify-common §Browser lane preconditions)

| Precondición | Fuente consultada | Estado |
|---|---|---|
| target environment / `baseUrl` | prompt de delegación (sin `BASE_URL` ni target) · `tasks.md` §6 (solo comandos doctors/gate, sin contrato target) · índice §6 (remite al phase artifact `tasks`, que no lo declara) · `frontend/playwright.config.ts:11` (`process.env.BASE_URL?.trim()`, env **vacío** verificado `BASE_URL=[]`) | **missing** |
| credentials contract | prompt de delegación + binding: sin referencia resuelta consumible (la home no requiere auth, pero el contrato no está declarado) | **missing** |
| runtime kind | sin `runtime_kind` resuelto por `sdd-orchestrator` en ninguna fuente canónica | **missing** |

- Modo de fallo nombrado: **`browser-target-missing`** (primario; secundarios `browser-credentials-missing`, `runtime-kind-unknown`).
- Sin precondiciones resueltas NO se ejecuta ninguna acción de navegador ni se inventa `BASE_URL`, ownership de runtime o comandos fallback ad hoc. La suite PW-AUTO **no se ejecutó** en este lane.

## Mapeo de cobertura (revisión estática, sin ejecución browser)

- Spec existente: `tests/e2e/home/index.spec.ts` (78 líneas; cabecera `// @ac HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02` en línea 1, ≤10 OK).
  - Test 1 (identidad + filas): `<title>`/`heading` `colpruebas`, tarjeta `.info-card` con `Aplicación:`/`Frontend:`/`API:`/`Rama Git:`; fila `Frontend:` regex `/PRODUCCI.N|DESARROLLO|TEST/` (SC-S2 ×3); fila `API:` regex salud real o fallback por entorno (SC-S3-api-salud-ok/degradado); fila `Rama Git:` valor no vacío + `not.toContain('MAIN')` + acepta `develop`/rama real (SC-S4-rama-real/fallback/cero-main).
  - Test 2 (HOME-05): `console.error` longitud 0 tras `networkidle` (SC-S3-api-degradado + SC-S4-consola-limpia).
  - Test 3 (HRM-02): `footer` visible + `/\d{4}-\d{2}-\d{2}T/` (SC-S4-timestamp-ssr).
- Criterios cubiertos por el spec (estático): `HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02` — los 8 del `criteria-links/v1` de spec/tasks.
- `playwright/TEST_PLAN.md`: inexistente en el repo (constatado por WU4); cobertura registrada vía cabecera `// @ac` + artefactos. Sin alta de fila por este lane (prohibido).
- Coherencia con contrato WU1 verificada por lectura (apply-WU4 §verificación): `index.astro:45` fallback `develop`, fetch SSR con `AbortSignal.timeout(2000)` + `catch` silencioso, `InfoCard.astro` filas `.value` — alineados con los locators del spec.

## Evidencia ejecutada en este lane (solo no-browser, autoridad permitida)

1. `bun run scripts/test-runner.ts check` (gate TST-13) → `test:check OK: no implemented criterion missing Unit+PW-AUTO coverage`, exit 0. **Verde.**
2. `rg -n "MAIN" frontend/src/pages/index.astro frontend/src/components/InfoCard.astro docs/app-map/views/home/ tests/e2e/home/index.spec.ts tests/unit/home/runtime-metadata.test.ts` → hits solo en aserciones de negación (`runtime-metadata.test.ts:27-29` `not.toContain('MAIN')`, `index.spec.ts:46` `not.toContain('MAIN')`) + comentario de trazabilidad (`index.spec.ts:40`); **cero `MAIN` operativo** (SC-S4-cero-main OK en estático).
3. `BASE_URL` env → vacío; `frontend/playwright.config.ts` sin `baseURL` efectiva → `page.goto('/')` sin base es inejecutable sin invención. Confirma el bloqueo.
4. **No ejecutado** (bloqueado por precondiciones): `bun run scripts/test-runner.ts run --method=pwauto --target=home` ni `bunx playwright test --config=frontend/playwright.config.ts`. Ejecutarlos sin target/runtime resuelto violaría `sdd-verify-common` §Browser lane preconditions.

## Quality mapping

| Criterio | Spec | Estado PW-AUTO |
|---|---|---|
| HOME-01, HSS-01 (identidad) | test 1 | spec presente, **ejecución pendiente** (bloqueada) |
| HSS-02 (Frontend por entorno) | test 1 regex 3 entornos | spec presente, **ejecución pendiente** |
| HSS-03 (API salud real + degradado) | test 1 + test 2 | spec presente, **ejecución pendiente** |
| HSS-04, HRM-01 (rama real/fallback, cero MAIN) | test 1 branch asserts | spec presente, **ejecución pendiente** |
| HRM-02 (timestamp SSR) | test 3 | spec presente, **ejecución pendiente** |
| HOME-05 (consola limpia) | test 2 | spec presente, **ejecución pendiente** |

## Veredicto y routing

- `pwauto_result: blocked` · `blocker: browser-target-missing` (target environment sin resolver; secundarios: `browser-credentials-missing`, `runtime-kind-unknown`).
- Cobertura **presente pero no ejecutada**: el spec existe y es correcto en estático; NO aplica routing a `sdd-apply-pwauto-tests` (no hay `missing` ni `incorrect`, solo falta el runtime resuelto). El desbloqueo lo posee **`sdd-orchestrator`** (debe inlinear `browser_runtime_preconditions`: target environment + `baseUrl`, credentials contract, `runtime_kind`) y re-invocar este lane para ejecutar `bun run scripts/test-runner.ts run --method=pwauto --target=home` + `bun run test:check`.
- Riesgos: ninguno de superficie de entrega (este lane no tocó ficheros; solo crea este artefacto `verify-pwauto.md`, excluido del commit si el flujo lo considera transitorio — lo posee el índice §6 como ref canónica).

## Reintento 2026-10-01 (precondiciones resueltas por `sdd-orchestrator`)

- Precondiciones consumidas (sin invención): target/`baseUrl` `http://localhost:4321` · `runtime_kind: managed-prod` (compose prod `colpruebas-0fbb20ebc4-prod`, verificado vía `projectctl status` por orchestrator; dev `:4324` stopped, no usado) · credentials-contract `none-public-landing` (home pública, sin auth/setup) · `BASE_URL=http://localhost:4321` exportada al invocar el runner canónico. Gate de autorización: WU1/WU4 con los 4 campos contractuales presentes en `tasks.md` §§4–5; escritura limitada a este artefacto. OK.
- Comandos ejecutados (con `BASE_URL=http://localhost:4321`):
  1. `bun run scripts/test-runner.ts run --method=pwauto --target=home` → exit 1 sin salida (el runner delega a `bunx playwright test`, que requiere `node`: `/usr/bin/env: 'node': No such file or directory`).
  2. `bun frontend/node_modules/playwright/cli.js test --config=frontend/playwright.config.ts --project=pwauto-home` y variante `/opt/playwright-runtime` (1.63.0) → `Error: Requiring @playwright/test second time … Error: No tests found`, exit 1. Playwright bajo Bun dispara su guarda de doble carga; sin binario `node` en el sandbox no hay ejecución browser real posible en este lane. **No se inventó ejecución alternativa con `playwright-cli` (prohibido; pertenece a `sdd-verify-pwcli`) ni se crearon/editó specs.**
  3. `fetch http://localhost:4321/` y `http://127.0.0.1:4321/`/` :4324` desde el sandbox → `ConnectionRefused` (el compose prod no expone esos puertos en el netns del sandbox; puertos locales observados: `4000`, `7437`). El target `localhost:4321` es **inalcanzable desde este entorno**.
  4. `bun run scripts/test-runner.ts check` (gate TST-13) → `test:check OK: no implemented criterion missing Unit+PW-AUTO coverage`, exit 0. **Verde (gate contractual mantenido).**
- Evidencia del bundle servido por prod (observable vía `https://colpruebas.online/`, espejo del compose prod, `STATUS:200 LEN:3076`): `Rama Git:</span><span …>MAIN` (`BRANCH_VALUE:MAIN`, `HAS_MAIN:yes`), timestamp `2026-10-01T13:25:03.557Z`. El WU1 local (`frontend/src/pages/index.astro` +40, fallback `develop`, presente solo en el working tree de `feature/20261001-cumreq-cumplimiento-requisitos-index`, `git diff --stat` 18 ficheros) **NO está desplegado a prod**: prod sirve el bundle anterior con `MAIN` operativo.
- Mapeo de cobertura (sin cambios): `tests/e2e/home/index.spec.ts` existe y es correcto en estático (`// @ac` en línea 1; test 1 fallaría contra prod actual solo por `not.toContain('MAIN')`); `playwright/TEST_PLAN.md` inexistente (constatado, sin alta por este lane).

## Veredicto del reintento y routing

- `pwauto_result: blocked` · `blocker: environment_stale` (prod sirve bundle anterior con `MAIN` residual; WU1 no desplegado; más `localhost:4321` inalcanzable desde el sandbox y runner canónico roto sin `node`). **NO es defecto funcional del cambio** ni `missing`/`incorrect` de cobertura → **sin routing a `sdd-apply-pwauto-tests`** y sin ruta `functional_defect_found → p2_revision_requested`.
- Owner del desbloqueo: **`sdd-orchestrator`** (redesplegar prod con WU1 o exponer un target alcanzable con el bundle WU1, y proveer runtime con `node` para el runner canónico), y re-invocar este lane para ejecutar `BASE_URL=<target> bun run scripts/test-runner.ts run --method=pwauto --target=home` + `bun run test:check`.
- `test_files: tests/e2e/home/index.spec.ts` (no ejecutado; 0 passed / 0 failed por bloqueo de entorno).
- `task_section_written:` este artefacto `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/verify-pwauto.md` (§Reintento + §Veredicto del reintento).
