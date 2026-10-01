# Apply evidence — WU2-doc-rama (doc, serial tras WU1)

- Tarea: `20261001-cumreq-cumplimiento-requisitos-index` · binding `projectctl-requirements.task-flow` v15.0.0 (`TaskFlowBindingV2`).
- Unidad: `WU2-doc-rama` · `apply_lane: doc` · estado: **done** (documentación).
- Rama: `feature/20261001-cumreq-cumplimiento-requisitos-index` (source/target `develop`). Sin commit (delivery = orchestrator).
- Spec: `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/spec.md` (SC-S4-rama-fallback, SC-S4-cero-main, SC-S2-frontend-env-fallback; HRM-01 AFTER). Tasks: `.../tasks.md` §4 (WU2-doc-rama, grupo `rama-main-cleanup`, serial tras WU1). Proposal: `.../proposal.md` (HRM-01 modify, AFTER aprobado).
- Predecesora: `WU1-code-rama` done (evidencia en `apply-WU1-code-rama.md`: `PUBLIC_GIT_BRANCH` fallback `develop`, env alineado, fetch SSR `/health`).

## Gate pre-implementación (doc)

| Gate | Evidencia | Veredicto |
|---|---|---|
| Scope | WU2-doc-rama, `apply_lane: doc`, serial tras WU1; edita solo `docs/app-map/views/home/features/runtime-metadata.md` (owned primario); resto de docs home evaluados por lectura, sin cita `MAIN` → no tocados per contrato condicional | pass |
| Spec linkage | SC-S4-rama-fallback, SC-S4-cero-main, SC-S2-frontend-env-fallback | pass |
| Implementation target | `runtime-metadata.md`: secciones `PUBLIC_GIT_BRANCH`→`develop` y `PUBLIC_ENVIRONMENT`→`test` + contrato HRM-01 AFTER; `coverage.evidence_paths` actualizado al estado post-cambio | pass |
| Verification target | Revisión doc/policy read-only (`sdd-verify-code`): doc reproduce AFTER sin redefinir bundle; `MAIN` cero hits operativos en `docs/app-map/views/home/` | pass |
| Failure routing | `doc_issue` | pass |

## Ficheros modificados (1 owned, 0 fuera de scope)

1. `docs/app-map/views/home/features/runtime-metadata.md` —
   - Frontmatter HRM-01 `title` → AFTER aprobado (proposal/spec): "La tarjeta muestra la rama git real de la ejecucion (resuelta por entorno/rama via PUBLIC_GIT_BRANCH con fallback documentado a develop) para contextualizar la ejecucion observada." (IDs `HRM-01`/`HRM-02` intactos, sin renumeración).
   - `evidence_paths` HRM-01 → estado post-cambio: `frontend/src/pages/index.astro` + `frontend/src/components/InfoCard.astro` + `tests/e2e/home/index.spec.ts` (antes `Footer.astro`, inexacto para rama; `Footer.astro` queda como evidencia de HRM-02 timestamp, intacto).
   - `notes` HRM-01 (líneas 25-28): eliminada fosilización `MAIN` ("valor constante `MAIN`... no la resolucion dinamica"); documentada resolución real SSR (`import.meta.env.PUBLIC_GIT_BRANCH || "develop"`, inyección compose dev/prod + `Dockerfile.prod` ARG/ENV, firma `.env.example`) + contrato HRM-01 AFTER + fallback `PUBLIC_ENVIRONMENT`→`test` como contexto.
   - §3 Objetivo: párrafo de resolución/fallbacks (rama `develop`, entorno `test`, inyección compose/Dockerfile, firma `.env.example`, tipado `env.d.ts`).
   - §6 Sources: implementación rama (`index.astro` + `InfoCard.astro`) vs timestamp (`Footer.astro`); línea de firma env (`.env.example` + `env.d.ts`).
   - `coverage` y resto del bundle intactos (criterios → docs trazabilidad preservada).

## NO tocados (verificación por lectura, coherencia sin duplicar)

- `docs/app-map/views/home/index.md`, `docs/app-map/views/home/features/status-summary.md`: grep `MAIN` → cero hits; no citan `MAIN`, no se tocan (per tasks.md §3 condicional).
- `docs/app-map/runtime-metadata.md` (alias citado en spec como "si existe"): no existe en el repo (solo `views/home/features/runtime-metadata.md` + `.mmd`); nada que tocar.
- `.env.example`: firma ya tocada por WU1, verificada coherente por lectura (`PUBLIC_ENVIRONMENT=production`, `PUBLIC_GIT_BRANCH=develop` + comentario fallbacks `test`/`develop`); WU2 no lo edita (ownership disjunto, evita colisión `rama-main-cleanup`).
- Código y tests: NO tocados (límite docs-only). Restos `MAIN` conocidos fuera de este lane: `tests/e2e/home/index.spec.ts:35` + `tests/unit/home/runtime-metadata.test.ts:18` (WU3/WU4 fase 3).

## Coherencia App Map (Mandatory Coherence Gate)

- `navigation.yaml` nodo `home-runtime-metadata` (`id`/`title`/`kind`/`bundle`) ↔ frontmatter (`id: home-runtime-metadata`, `title: Metadatos de ejecución`, `kind: feature`, bundle `views/home/features/runtime-metadata`) — intactos, match.
- Sibling `runtime-metadata.mmd` — genérico (rama + timestamp), sin `MAIN`, sin cambio necesario; par bundle↔mermaid resuelve.
- IDs canónicos preservados (`HRM-01` modify con AFTER exacto; `HRM-02` maintain intacto); sin renumeración ni expansión silenciosa; tombstones n/a (sin eliminaciones).

## Evidencia SC-S4-cero-main (docs home)

- Grep `MAIN` sobre `docs/app-map/views/home/` (herramienta de lectura, sin shell): **cero hits** (antes 1 hit en `runtime-metadata.md:26`, eliminado).
- Evidencia común pendiente de su lane: tests fase 3 (WU3/WU4) + código ya limpio por WU1.

## Documentación actualizada (para reflejo del orchestrator en el índice)

- `runtime-metadata.md` refleja contrato nuevo HRM-01 AFTER, cero `MAIN` fosilizado, fallbacks `develop`/`test` documentados, trazabilidad criteria→docs intacta.

## Desviaciones

- Ninguna respecto a spec/tasks/proposal. Nota: `evidence_paths` HRM-01 corrige `Footer.astro`→`index.astro`+`InfoCard.astro` por exactitud post-cambio (trazabilidad spec §HRM-01); `Footer.astro` se conserva como evidencia de HRM-02.

## Follow-up / next

- Fase 3 tests (mismo conflicto `rama-main-cleanup`, serial): WU3-unit-red + WU4-pwauto-home (limpiar `MAIN` en `runtime-metadata.test.ts:18` e `index.spec.ts:35`, triangulación post-hoc strict-TDD).
- Verify: `sdd-verify-code` (revisión doc/policy read-only) sobre este WU; luego doctors/gate transversales (§6 tasks.md) vía verify lanes / orchestrator.

## Delivery risks (doc)

- Riesgo bajo. Sin cambios de código/runtime; sin migraciones; sin nuevos ficheros gitignored. Riesgo residual: si `sdd-orchestrator` interpreta estricta la tensión `owner_phase` fase 4 vs `allowed_lanes` fase 2 (tasks.md §8), mover este mismo contrato a fase 4 sin cambios.
