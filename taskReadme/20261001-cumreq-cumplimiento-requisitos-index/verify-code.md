# Verify-code — 20261001-cumreq-cumplimiento-requisitos-index (WU1 + WU2)

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Lane: `sdd-verify-code` (review-only, sin ejecución de suites; solo lectura de código, docs, spec, proposal, tasks y evidencias apply).
- Alcance: WU1-code-rama (code-high) + WU2-doc-rama (doc) contra spec (13 escenarios S1–S5) y proposal (HRM-01 modify).
- Artefactos insumo: `spec.md`, `proposal.md`, `tasks.md` §4, `apply-WU1-code-rama.md`, `apply-WU2-doc-rama.md` (+ lectura de `apply-WU3-unit-red.md` / `apply-WU4-pwauto-home.md` solo como contexto de restos `MAIN`).
- Fecha: 2026-10-01. Veredicto lane: **passed** (0 critical bloqueantes; 2 warning no bloqueantes diferidos a sus lanes; 5 info).

## Contract review (Task Contract Gate, tasks.md §4)

| Campo | WU1-code-rama | WU2-doc-rama | Usable |
|---|---|---|---|
| Spec scenarios linked | SC-S1-identidad, SC-S2-prod/dev/fallback, SC-S3-ok/degradado, SC-S4-rama-real/fallback/cero-main/consola-limpia (10 IDs) | SC-S4-rama-fallback, SC-S4-cero-main, SC-S2-frontend-env-fallback | Sí, concretos |
| Implementation contract | `index.astro` gitBranch/env/fetch+timeout+catch, `InfoCard:32`, `env.d.ts` 3 keys, `Dockerfile.prod` ARG/ENV, compose dev/prod, `.env.example` | `runtime-metadata.md`: secciones PUBLIC_GIT_BRANCH→develop + PUBLIC_ENVIRONMENT→test + HRM-01 AFTER; `coverage.evidence_paths` post-cambio | Sí, concretos |
| Verify expects | Inspección `index.astro` sin MAIN, fallback develop, env production/development+test, fetch timeout+catch sin console.error, env.d.ts 3 keys, Dockerfile ARG/ENV, ambos compose + PUBLIC_API_URL en dev; `rg MAIN` cero hits en owned | Doc describe develop/test, reproduce AFTER sin redefinir bundle; `rg MAIN docs/app-map/views/home/` cero hits operativos | Sí, checklist verificable |
| Routing tag on failure | `code_issue` | `doc_issue` | Sí |

Ningún campo falta ni es vago → no aplica `blocked` / `tasks_contract_missing`. Se usa `Verify expects` como checklist (ítems de otra lane se marcan `info` y se derivan).

## Verificación por lectura (evidencia)

- `frontend/src/pages/index.astro:45` → `const gitBranch = import.meta.env.PUBLIC_GIT_BRANCH || 'develop'` OK (SC-S4-rama-real/fallback, HRM-01).
- `index.astro:8` → `PUBLIC_ENVIRONMENT || 'test'` + `RuntimeEnvironment` (`development|test|production` en `shared/contracts/runtime.ts`) OK (SC-S2-*).
- `index.astro:11-23` → `frontendStatus`/`fallbackApiStatus` distinguen `production`/`development`/`test` OK (HSS-02/HSS-03 patrón).
- `index.astro:27-42` → `apiBaseUrl` trim + guard vacío + `fetch(.../health, { signal: AbortSignal.timeout(2000) })` + `try/catch` con fallback silencioso, cero `console.*` OK (SC-S3-degradado, HOME-05).
- `index.astro:7,53,81-88` → `appName='colpruebas'`, `<title>`, `Header`+`InfoCard`+`Footer(timestamp=ISO)` OK (SC-S1, HRM-02).
- `frontend/src/components/InfoCard.astro:16-33` → filas `Aplicación:/Frontend:/API:/Rama Git:` con `.value ${environment}` OK (HSS-01..04); nueva regla `.value.development` (#63-65) coherente con patrón, sin cambio estructural.
- `frontend/src/env.d.ts:3-7` → las 3 `PUBLIC_*` opcionales OK.
- `frontend/Dockerfile.prod:13-18` → `ARG PUBLIC_ENVIRONMENT/API_URL/GIT_BRANCH` + `ENV` OK; `Dockerfile.dev` sin ARG es correcto (usa `astro dev` + `environment` compose, contrato "si aplica").
- `compose/compose.prod.yml:7-21` → `args` + `environment` con `PUBLIC_GIT_BRANCH=${...:-develop}` OK.
- `compose/compose.dev.yml:15-18` → añade `PUBLIC_API_URL` (corrige desalineación `API_URL` no consumido, que se conserva L18 por compat) + `PUBLIC_GIT_BRANCH:-develop` OK (E4).
- `.env.example:7-12` → firma `PUBLIC_API_URL`, `PUBLIC_ENVIRONMENT=production`, `PUBLIC_GIT_BRANCH=develop` + comentario fallbacks `test`/`develop` OK.
- `docs/app-map/views/home/features/runtime-metadata.md` → título HRM-01 = AFTER proposal/spec palabra por palabra (L12-15) OK; `notes` L26-35 documenta resolución SSR + inyección + fallbacks OK; §3 L67-71 y §6 L86-87 trazabilidad OK; `index.md` y `status-summary.md` sin `MAIN` (verificado por grep) → correctamente no tocados per contrato condicional; alias `docs/app-map/runtime-metadata.md` inexistente → nada que tocar OK.
- Grep `MAIN`: cero hits en todos los owned WU1 (pages, components, env.d.ts, Dockerfile.prod, ambos compose, `.env.example`) y en `docs/app-map/views/home/` OK. Restos `MAIN` solo en: tests como argumento de negación (`not.toContain('MAIN')`, `not.toContainText` eliminado), spec/proposal/tasks/applys como historia — permitido por spec ("solo historia/este spec").

## ### Code review

### Hallazgos

1. [warning, no bloqueante — WU1, `frontend/src/pages/index.astro:33-38`] `apiStatus` es no-op observable: `if (healthRes.ok) { apiStatus = fallbackApiStatus; }` asigna el mismo texto que el fallback. Cumple literalmente el `Implementation contract` (fetch + `AbortSignal.timeout(2000)` + `catch` silencioso) y protege HOME-05, pero SC-S3-api-salud-ok ("MUST reflejar salud real") no es observable en el texto. La evidencia apply lo declara ("idéntico al fallback por mandato del spec"). Se difiere a `sdd-verify-pwauto` / `functional_defect_found`: si el PW-AUTO exige diferenciación visible sano vs degradado, rework en WU1 (texto operativo distinto en `ok`). No bloquea code-review.
2. [warning, no bloqueante — WU2, `docs/app-map/views/home/features/runtime-metadata.md:21-24`] `coverage: Unit/PW-AUTO: covered` se afirma antes de que `sdd-verify-units` / `sdd-verify-pwauto` / `test:check` pasen (WU3/WU4 declaran suites pendientes). Trazabilidad correcta, pero la afirmación de cobertura es prematura; el cierre real lo da el gate transversal (tasks.md §6, SC-S5). Derivar a verify-units/pwauto + `verify-report.md`. No bloquea doc-review.
3. [info — contrato] SC-S4-cero-main "cero hits" no puede ser literal mientras los tests triangulan con `not.toContain('MAIN')` (la cadena `MAIN` permanece como argumento de negación en `index.spec.ts:40,46` y `runtime-metadata.test.ts:27-29`). Los owned WU1/WU2 están limpios de `MAIN` operativo; el grep global siempre tendrá hits de negación + historia. Aclarar en `verify-report.md` que "cero MAIN operativo" = cero render/valor, no cero cadena en aserciones negativas.
4. [info — WU1, `frontend/src/pages/index.astro:93`] Restos `<!-- HMR TEST -->` al final del fichero: comentario muerto, sin efecto funcional ni riesgo. Limpieza oportunista en próximo touch, no rework.
5. [info — WU1/WU2, `evidence_paths`] WU2 corrige `evidence_paths` HRM-01 (`Footer.astro` → `index.astro`+`InfoCard.astro`, `Footer` queda en HRM-02): exacto post-cambio y alineado con spec §HRM-01; `status-summary.md` mantiene autoridad de render de filas con remisión del valor a `home-runtime-metadata` — coherente, sin duplicación.
6. [info — fuera de lane] SC-S5-doctors-target-home y SC-S5-gate-test-check (`doctor-*`, `requirements-check`, `test:check`, ejecución unit/pwauto) pertenecen a `sdd-verify-units` / `sdd-verify-pwauto` / `sdd-verify-requirements` / orchestrator. No ejecutados aquí por autoridad (review-only). WU3/WU4 ya escalan su ejecución pendiente.
7. [info — jerarquía] Sin duplicación evitable, sin over-abstracción, sin dead code (salvo #4), sin APIs deprecadas, sin cambios auth/ownership/data contracts (`InfoCard` mismo shape de props; `API_URL` conservado por compat). Skills repo (Bun primario, `@ac` en tests, App Map SoT) respetados; `docs/**` y `tests/**` no pisados por WU1, `.env.example` no pisado por WU2 (ownership disjunto, grupo `rama-main-cleanup` serial respetado).

### verify_expectations_checked

- WU1: sin literal `MAIN` en owned → pass. Fallback `develop` presente → pass. Env `production`/`development`+`test` → pass. Fetch SSR timeout+`catch` estático sin `console.error` → pass (con warning #1 sobre observabilidad). `env.d.ts` 3 keys → pass. `Dockerfile.prod` ARG/ENV → pass. Ambos compose con `PUBLIC_GIT_BRANCH`, dev además `PUBLIC_API_URL` → pass. `rg MAIN` owned cero → pass.
- WU2: doc describe `PUBLIC_GIT_BRANCH`→`develop` y `PUBLIC_ENVIRONMENT`→`test` → pass. Reproduce AFTER sin redefinir bundle (IDs intactos, sin renumeración) → pass. `rg MAIN docs/app-map/views/home/` cero operativo → pass (con info #3).

### Veredicto

- `code_review_result: passed` (WU1 + WU2). Sin `critical`. Warnings #1–#2 no bloquean delivery de este lane y se rutean a sus lanes.
- `routing_tag:` ninguno (solo aplicaría en blocked/failed; se dejan notas de derivación a `sdd-verify-pwauto` / `sdd-verify-units` en hallazgos).
- Deuda conocida fuera de este lane: WU3/WU4 ya materializados en repo pero con suites sin ejecutar (escalado declarado en sus evidencias); doctors/gate transversales pendientes.
