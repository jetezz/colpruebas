---
title: "Remediación compatibilidad /projectctl: entornos, docs, tests"
task_id: "20260825-bhbr8k"
task_slug: "remediacion-compatibilidad-projectctl-entornos-docs-tests"
sdd_change_id: ""
status: "documenting"
phase: "fase_4_documentacion"
state: "p4_started"
source_branch: "develop"
target_branch: "develop"
branch_name: "feature/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests"
app_map: "docs/app-map/views/projectctl/index.md"
task_type: "Runtime/config"
pw_enabled: false
browser_validation: "optional"
pr_url: ""
created_at: "2026-08-25T07:55:05.107Z"
updated_at: "2026-08-25T07:55:05.107Z"
---
# Remediación compatibilidad /projectctl: entornos, docs, tests

## 1. Objetivo

1) projectctl env validate reporta ok (existen .env y .env.dev). 2) projectctl status levanta prod y dev con overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev y FRONTEND_PORT canonico. 3) bun run test:check pasa con runner unificado scripts/test-runner.ts, playwright/TEST_PLAN.md y persistencia atomica completa. 4) El bundle views/projectctl existe con las 5 secciones MUST y navigation.yaml lo registra; la superficie quality/ legacy eliminada. 5) .agents/sdd-workflow.json pinnea binding v9 con projections presentes. 6) projectctl doctor no reporta drifts criticos.

## 2. Estado actual / problema actual

El proyecto colpruebas no cumple el estándar de compatibilidad /projectctl (projectctl-requirements). Incumplimientos: (1) ENTORNO: .env y .env.dev ausentes (env validate falla), overlays docker-compose.yml/.docker-compose.dev.yml no canonicos vs compose.yml/compose.dev.yml, servicios frontend-prod/api-prod/frontend-dev/api-dev vs frontend/api, FRONTEND_PORT 4323/4324 vs canonico 4321, faltan docs/00-context y docs/02-features (entornos.md, architecture.md, tunnel.md), skill sandbox-runtime-policy sin instalar. (2) DOCS: falta bundle views/projectctl completo (5 secciones MUST, criteria[], navigation.yaml), superficies legacy docs/01-product/quality-plan.md y quality-status.md presentes cuando deben eliminarse per TST-03/TST-12. (3) TEST: falta scripts/test-runner.ts, gate bun run test:check inexistente, falta playwright/TEST_PLAN.md, layout specs no canonico, persistencia .runtime/test-results sin junit.xml ni carpeta unit, faltan projectctl-*-bundle.test.ts y sot-coherence.test.ts. (4) TAREAS: locator .agents/sdd-workflow.json stale v8.0.0 vs binding v9.0.0, projections tareas-tab.view-model.ts y task-flow.generated.ts inexistentes, estados retirados (branching, pushing, ready_for_branch, verified) en taskReadme. (5) CROSS: faltan AGENTS.md, README.md, docs/00-context/agents_skills.md, docs/04-process/task.md, .atl/skill-registry.md, symlink playwright.config.ts roto. Objetivo: levantar entornos prod y dev via projectctl, que la documentacion se lea correctamente y que todos los tests pasen con projectctl.

## 3. Resultado esperado

1) projectctl env validate reporta ok (existen .env y .env.dev). 2) projectctl status levanta prod y dev con overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev y FRONTEND_PORT canonico. 3) bun run test:check pasa con runner unificado scripts/test-runner.ts, playwright/TEST_PLAN.md y persistencia atomica completa. 4) El bundle views/projectctl existe con las 5 secciones MUST y navigation.yaml lo registra; la superficie quality/ legacy eliminada. 5) .agents/sdd-workflow.json pinnea binding v9 con projections presentes. 6) projectctl doctor no reporta drifts criticos.

## 4. Resumen de exploración / Fase 1

### Resultado de Fase 1

**Resultado**: `done` — lane `sdd-explore-code` (EXPLORE-1) completada con evidencia de archivo. Detalle full: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/explore-code.md`.

Resumen acotado (evidencia del artifact):
- **ENTORNO**: `.env` ausente; `.env.dev` presente pero `FRONTEND_PORT=4324` (canónico 4321); `compose.yml`/`compose.dev.yml` ausentes (solo legacy `docker-compose*.yml`); servicios `frontend-prod/api-prod/frontend-dev/api-dev` (no canónicos, sin `target: prod/dev`); `docs/00-context` y `docs/02-features` ausentes; skill `sandbox-runtime-policy` no instalada.
- **DOCS**: bundle `docs/app-map/views/projectctl/` ausente; `navigation.yaml` no lo registra; legacy `docs/01-product/quality-plan.md` + `quality-status.md` presentes.
- **TEST**: sin `scripts/test-runner.ts`; sin `test:check` en root `package.json` (solo test/test:back/test:front); sin `playwright/TEST_PLAN.md`; symlink `playwright.config.ts` roto; sin `projectctl-*-bundle.test.ts` ni `sot-coherence.test.ts`. **Matiz**: `.runtime/test-results/<projectId>/` sí existe (46 runs, 29 con `unit/junit.xml`) — completar pipeline canónico, no crear de cero.
- **TAREAS**: locator pin `8.0.0` vs binding `9.0.0` (drift AC-004); projections client `tareas-tab.view-model.ts` + `task-flow.generated.ts` ausentes; 4 taskReadme con estados retirados (`branching`, `pushing`, `ready_for_branch`, `verified`).
- **CROSS**: `AGENTS.md`, `README.md`, `docs/00-context/agents_skills.md`, `docs/04-process/task.md`, `.atl/skill-registry.md` ausentes; symlink roto.

Riesgos clave para la propuesta: env files gitignored (entrega requiere force-add/policy review); `.runtime/`/`test-results/` no gitignored; symlink a target inexistente; persistencia test parcial; rama local `main` con working tree sucio (reconciliar en branch_creation_pending).

## 5. Propuesta SDD

### Resultado de Propuesta

**Resultado**: `drafted` → `approved` (flujo automático) — lane `sdd-propose` (PROPOSE-1) completada. Detalle full: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/proposal.md`.

Resumen acotado (evidence del artifact):
- **Intent**: remediar incompatibilidad `/projectctl` en ENTORNO/DOCS/TEST/TAREAS/CROSS (AC-001..AC-005) → `projectctl env validate` ok, `projectctl status` levanta prod/dev, `bun run test:check` verde, bundle `views/projectctl` renderizable, locator v9 con projections, `projectctl doctor` sin drifts.
- **Scope in**: AC-001 (`.env` + `.env.dev` FRONTEND_PORT=4321, `compose.yml`/`compose.dev.yml` canónicos con `frontend` target prod/dev, docs 00-context/02-features, skill sandbox-runtime-policy), AC-002 (bundle + navigation.yaml + eliminar quality legacy), AC-003 (test-runner.ts + test:check + TEST_PLAN.md + completar persistencia + tests bundle/sot-coherence), AC-004 (locator 9.0.0 + projections + retiro estados), AC-005 (prereqs cross + symlink). **Out**: UI SolidJS /projectctl, features nuevas, tunnel/red.
- **Capabilities**: C1-C7 mapeadas a PCT-95..99 / PCT-83..88 / PCT-89..94 / PCT-106..121 / standard.
- **Approach**: AC-004 primero (base workflow), AC-002/AC-005 con sdd-apply-doc, AC-001/AC-003 con sdd-apply-code-medium, projections con code-high; delivery single-pr desde `develop`; validación CLI projectctl + test:check (sin browser).
- **Riesgos top**: env gitignored (policy review/force-add), `.runtime` no gitignored, persistencia parcial (46 runs/29 junit), symlink roto, working tree `main` sucio, estados retirados = historial.
- **Rollback**: revert de PR único a `develop`; por-AC detallado en artifact §7.

### Evidencia de aprobación AC-010 (flujo automático)

| Campo gate | Valor registrado |
| --- | --- |
| `approval_actor` | Plataforma/instrucción de invocación del usuario (task `20260825-bhbr8k`, `projectId 511a017a-01d4-4553-a063-ba01438b15cd`) |
| `approval_literal_message` | "Ejecuta la tarea ... Remediación compatibilidad ...: entornos, docs, tests. Estado actual: pending. Genera o repara el plan y continúa el flujo desde el principio." + "Automatic SDD phase selection requested." |
| `approval_utc_timestamp` | 2026-08-25T08:0x UTC (inicio de esta ejecución) |
| `approved_revision` | proposal rev 1 (`proposal.md`) |
| `approved_criteria_ids` | [AC-001, AC-002, AC-003, AC-004, AC-005] |
| `phase_2_hold_released` | Sí — la instrucción de ejecución automática libera el hold de fase 2 |

> Criterios creados con `Estado propuesto: añadir` en la tarea (§8); la ejecución automática instruida aproxime el consentimiento del creador de la tarea. Si se requiere aprobación humana explícita en firma, el `p1_awaiting_acceptance` queda registrado como punto de revisión (ver §18).

## 6. Specs / requisitos delta

**Resultado**: `done` — lane `sdd-spec` (SPEC-1). Detalle full: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/spec.md`.

Resumen: 30 REQs (ADDED/MODIFIED/REMOVED, Given/When/Then, RFC 2119) en 5 dominios: ENTORNO (REQ-ENT-001..008), DOCS (REQ-DOC-001..005), TEST (REQ-TST-001..008), TAREAS (REQ-TSK-001..004), CROSS (REQ-CRS-001..006). Trazabilidad REQ→AC-001..005→PCT. 5 decisiones abiertas delegadas a diseño (§8 del spec). Matices de exploración codificados como constraints (persistencia parcial, env gitignored, symlink roto, estados retirados = historial).

## 7. Diseño técnico

**Resultado**: `done` — lane `sdd-design` (DESIGN-1). Detalle full: `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/design.md`.

Resumen: 10 ADs resolviendo las 5 decisiones §8: AD-01 recrear compose canónico + `git rm` legacy; AD-02 `.runtime/`+`frontend/test-results/` a `.gitignore`; AD-03 env excluidos del commit (`.env.example` = firma commitada); AD-04 fixtures taskReadme retirados → `status: done`; AD-05 symlink reparado creando `frontend/playwright.config.ts`. Runner reutiliza primitivos backend (`ac-header`/`coverage-writer`/`test-inventory`); persistencia `.runtime` completada (46 runs preservados); bundle 5 secciones + `criteria[]` PCT-*; locator v9 + projections via `taskflow:generate`; overlays con `target: prod/dev` (stage `AS prod`/`AS dev`); rollout AC-004→AC-005→AC-002→AC-001→AC-003 (test:check nace verde).

> **Nota ACs**: los AC-001..AC-005 están definidos en la tabla de §8 (abajo). Estado: `approved` (AC-010 aprobado en §5). Verificación de cobertura se consolida en §15/fase 3.

## 8. Criterios de aceptación

| Código | Criterio | Fuente | Estado propuesto | Texto actual / propuesto |
| --- | --- | --- | --- | --- |
| AC-001 | Entornos prod y dev levantables via projectctl: .env y .env.dev presentes, overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev, FRONTEND_PORT canonico. | Añadido en tarea | `añadir` | Entornos prod y dev levantables via projectctl: .env y .env.dev presentes, overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev, FRONTEND_PORT canonico. |
| AC-002 | Bundle views/projectctl con 5 secciones MUST y navigation.yaml lo registra; superficie legacy docs/01-product/quality/* eliminada. | Añadido en tarea | `añadir` | Bundle views/projectctl con 5 secciones MUST y navigation.yaml lo registra; superficie legacy docs/01-product/quality/* eliminada. |
| AC-003 | Sistema de testing canónico: scripts/test-runner.ts, gate bun run test:check, playwright/TEST_PLAN.md, persistencia atómica con junit.xml, specs bajo layout canónico. | Añadido en tarea | `añadir` | Sistema de testing canónico: scripts/test-runner.ts, gate bun run test:check, playwright/TEST_PLAN.md, persistencia atómica con junit.xml, specs bajo layout canónico. |
| AC-004 | Locator .agents/sdd-workflow.json pinnea binding v9.0.0 con projections presentes; estados retirados (branching, pushing, ready_for_branch, verified) fuera de taskReadme. | Añadido en tarea | `añadir` | Locator .agents/sdd-workflow.json pinnea binding v9.0.0 con projections presentes; estados retirados (branching, pushing, ready_for_branch, verified) fuera de taskReadme. |
| AC-005 | Prerrequisitos cross: AGENTS.md, README.md, docs/00-context/agents_skills.md, docs/04-process/task.md, .atl/skill-registry.md, symlink playwright.config.ts válido. | Añadido en tarea | `añadir` | Prerrequisitos cross: AGENTS.md, README.md, docs/00-context/agents_skills.md, docs/04-process/task.md, .atl/skill-registry.md, symlink playwright.config.ts válido. |


## 9. Alcance / fuera de alcance

Pendiente.

## 10. Desglose de implementación / progreso SDD

### Work units (fase 2 activas + diferidas fase 3 + coordinator-only)

Detalle full (13 columnas del schema): `taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/tasks.md`.

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `WU-TSK-1` | `sdd-apply-code-high` | code-high | `done` | `taskReadme/20260825-bhbr8k-.../apply-WU-TSK-1.md` |
| `WU-TSK-2` | `sdd-apply-code-low` | code-low | `done` | `apply-WU-TSK-2.md` |
| `WU-CRS-1` | `sdd-apply-code-medium` | code-medium | `done` | `apply-WU-CRS-1.md` |
| `WU-CRS-2` | `sdd-apply-doc` | doc | `done` | `apply-WU-CRS-2.md` |
| `WU-DOC-1` | `sdd-apply-doc` | doc | `done` | `apply-WU-DOC-1.md` |
| `WU-ENT-1` | `sdd-apply-code-medium` | code-medium | `done` | `apply-WU-ENT-1.md` |
| `WU-ENT-2` | `sdd-apply-doc` | doc | `done` | `apply-WU-ENT-2.md` |
| `WU-ENT-3` | `sdd-apply-code-low` | code-low | `done` | `apply-WU-ENT-3.md` |
| `WU-TST-1` | `sdd-apply-code-medium` | code-medium | `done` | `apply-WU-TST-1.md` |
| `WU-TST-2` | `sdd-apply-unit-tests` | unit-tests | `done` (rev 2+3) | `apply-WU-TST-2.md` |
| `WU-VER-UNITS` | `sdd-verify-units` | none | `done` (rev 1→3, passed) | `verify-units.md` |
| `WU-VER-PWCLI` | `sdd-verify-pwcli` | none | `no_required` (pw_enabled: false) | §15 |
| `WU-VER-PWAUTO` | `sdd-verify-pwauto` | none | `no_required` (pw_enabled: false) | §15 |
| `WU-REG` | coordinator | none | `pending` (fase 4) | §4/§5 índice |
| `WU-CLI-VAL` | coordinator | none | `done` (env validate ok; start bloqueado plataforma) | §15 |
| `WU-DELIVERY` | coordinator | none | `pending` (delivery) | §19 índice |

**Orden de ejecución (AD-10)**: WU-TSK-1 → WU-TSK-2 → WU-CRS-1 → WU-CRS-2 (+WU-DOC-1 parallel-safe) → WU-ENT-1 → WU-ENT-2/WU-ENT-3 → WU-TST-1 (serial, último, para que `test:check` nazca verde).

**Workload forecast**: ≈1.743 líneas autoredas · `400-line budget risk`: High · `Chained PRs recommended`: Yes (advisory — default `single-pr` retenido).

## 11. Ubicación app-map / entrada afectada

- Ubicación principal: `docs/app-map/views/projectctl/index.md`

## 12. Componentes afectados

Pendiente.

## 13. Impacto backend

Pendiente.

## 14. Selección SDD / fases

### Plan de fases predicho/efectivo (evidencia de coordinador — selección automática, no manual)

> **Método**: predicción automática basada en el contenido de la tarea (AC-001..AC-005), el binding canónico `projectctl-requirements.task-flow` v9.0.0 (`.agents/skills/projectctl-requirements/references/tareas.md` §`task-flow-binding`) y los guardrails obligatorios. No existe selección manual de fases por el usuario; estas filas son evidencia de coordinación (`Automatic SDD phase selection`).

| Fase (binding) | Status | Estados | Lanes predichas | Justificación / evidencia |
| --- | --- | --- | --- | --- |
| `fase_1_propuesta` | planning | `p1_started` → `p1_exploring` → `p1_drafting` → `p1_awaiting_acceptance` → `p1_accepted` → `branch_creation_pending` (control) | `sdd-explore-code` (obligatoria); `sdd-propose` (obligatoria); `sdd-explore-research` (no_required: estándar ya instalado); `sdd-explore-pwcli` (no_required: `pw_enabled: false`, `browser_validation: optional`) | AC-001..AC-005 = remediación multi-superficie contra el estándar instalado; requiere relevamiento de código con evidencia de archivos y propuesta formal. |
| `fase_2_implementacion` | implementing | `p2_planning` → `p2_implementing` → `p2_code_review` → `p2_awaiting_acceptance` → `p2_accepted` | `sdd-spec`, `sdd-design`, `sdd-tasks` (obligatorias: plan v9 exige artifacts de planificación); `sdd-apply-code-low/medium/high` (según WUs: runtime/config/scripts/runner → medium; generación projections + contrato binding → high); `sdd-verify-code` (obligatoria: guardrail security/quality; `code_review_passed` hard_gate) | AC-001 (entorno), AC-002 (bundle + eliminación legacy), AC-003 (runner/persistencia), AC-004 (locator pin + projections), AC-005 (cross prereqs). |
| `fase_3_verificacion` | testing | `p3_test_preparing` → `p3_test_running` → `p3_test_fixing` → `p3_coverage_pending` → `p3_complete` | `sdd-apply-unit-tests` (obligatoria: AC-003 tests faltantes + layout canónico); `sdd-verify-units` (obligatoria: `bun run test:check`, `coverage_gate_passed`); `sdd-verify-pwauto` (no_required: `pw_enabled: false`); `sdd-verify-pwcli` (no_required: `browser_validation: optional`) + validaciones CLI `projectctl` inline (coordinator-owned): `env validate`, `status`, `doctor` | AC-001/AC-003/AC-006; evidencia de entorno runtime vía CLI projectctl (ownership del coordinador), no browser. |
| `fase_4_documentacion` | documenting | `p4_started` → `p4_documenting` → `p4_reviewing` → `p4_complete` | `sdd-apply-doc` (obligatoria: AC-002 bundle 5 secciones MUST + navigation.yaml + AC-005 prereqs cross + eliminación superficie quality legacy); regen `.atl/skill-registry.md` coordinator-only (`apply_lane: none`, WU-REG per `maintenance.md` §10) | AC-002/AC-005; gate `AC-009.app_map_close` en cierre (`app_map` = `docs/app-map/views/projectctl/index.md`). |
| Controles delivery (single-pr) | — | `branch_creation_pending` → `final_commit_pending` → `final_push_pending` → `final_pr_pending` → `done` | coordinator (mecánico; sin lane ejecutora) | `delivery_context`: `feature/<task_id>-<task_slug>` desde `develop` → `develop`; PR único; close evidence: branch_name, pr_url, verification_revision, documentation_revision, criteria_covered_complete, all_work_units_terminal. |

### Guardrails aplicados (obligatorios, no negociables)

- **Ownership**: coordinador único escritor del índice; cada lane escribe solo su phase artifact (`taskReadme/<task_id>-<task_slug>/<artifact>.md`); sin paths prohibidos (`proposals/`, `specs/`, `designs/`, `tasks/`, `openspec/`).
- **Persistencia canónica**: `mirrors: []` → `write_order: ["primary"]`; taskReadme = única fuente de verdad en filesystem; Engram solo recovery best-effort (no gate).
- **Branch/PR traceability**: branch feature obligatoria desde `develop`; PR único target `develop`; nunca `main`. Close evidence obligatoria.
- **Security review**: `sdd-verify-code` obligatoria en fase 2 (cambios config/runtime: env, compose, runner, locator).
- **Browser validation**: NO requerida (`browser_validation: optional`, `pw_enabled: false`) → pwcli/pwauto opcionales; la validación de entorno es CLI `projectctl` (coordinator-owned).
- **Docs/quality**: `sdd-apply-doc` obligatoria; regen skill-registry coordinator-only; gate `AC-009.app_map_close`.
- **Estados soportados**: solo `binding.status.writable` = `{pending, planning, implementing, testing, documenting, done, blocked, failed}`; sin aliases retirados (`branching`, `pushing`, `ready_for_branch`, `verified`, etc.).

### Evidencia de estado verificada en bootstrap (coordinator)

- Locator `.agents/sdd-workflow.json`: `contract_version: 1` ✓, `binding_path` ✓, `machine_block_id: task-flow-binding` ✓, `expected_binding_id` ✓ — pero `binding_version` pinnea **8.0.0** vs binding canónico **9.0.0** → drift conocido que AC-004 repara (ítem #1 en §18). El coordinador resuelve el contexto desde el binding v9.0.0 (autoritativo, válido).
- Projections: `generated/phase-state-schema.json` ✓ presente; `assets/task-template.md` ✓ presente; `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` ✗ AUSENTE; `frontend/src/shared/sdd/task-flow.generated.ts` ✗ AUSENTE → deliverable AC-004 (ítem #2 en §18). No bloquean la resolución (proyección derivada no autoritativa, contrato §3).
- Rama declarada: `feature/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests` (frontmatter, coincide con `binding.delivery.branch_pattern`). Repo local actualmente en `main` (working tree con cambios preexistentes fuera de scope) — se reconciliará en `branch_creation_pending`.

## 15. Resumen de verificación SDD

### Code review (fase 2, sdd-verify-code) — veredicto rev 2: `passed` ✅

- **Veredicto rev 2**: `passed` — W1 resuelto (runner `run` ejecuta tests reales: `bun test --reporter=junit` / `bunx playwright test --project=<pwa>`; criterios derivados del junit real; `missing` nunca `covered` fabricado; write-back solo cobertura real; exit 0/1/2 conservado) y W2 resuelto (`frontend/__tests__` en `unitRoots` de `backend/src/test-inventory.ts` + `discoverUnitFiles`). Verify-expects 5/5 estructurales; ítems de ejecución diferidos a fase 3.
- **Gate `code_review_passed`**: SATISFECHO (sdd_verify_code_green ✓; no_known_functional_or_code_quality_defect ✓; functional_summary_complete ✓).
- **Evidencia**: `taskReadme/20260825-bhbr8k-.../verify-code.md` (§9 rev 2).

### Aceptación funcional (fase 2) — `p2_awaiting_acceptance` → `p2_accepted`

| Campo gate `functional_acceptance_explicit` | Valor registrado |
| --- | --- |
| `explicit_user_functional_acceptance_recorded` | Sí — instrucción explícita del usuario: "realiza toda la fase 2 completa y dime cuando termine el resumen y resultado" (flujo automático; registrada con provenance) |
| `p2_accepted` | Sí — estado alcanzado `fase_2_implementacion / p2_accepted / implementing` |
| `functional_implementation_accepted` | Sí — 9/9 WUs apply `done` + code review rev 2 `passed` |
| `canonical_branch_active` | Sí — `feature/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests` |
| `acceptance_criteria_to_coverage_matrix` | Sí — cobertura declarada en `criteria[].coverage` del bundle (AC-002) + verify-expects mapeados (ac_003); validación runtime diferida a fase 3 (WU-CLI-VAL/WU-VER-UNITS) |

> **FASE 2 COMPLETA**: planificación (spec/design/tasks) + implementación (9 WUs) + code review (2 revisiones) + aceptación funcional = `p2_accepted`. Siguiente: entrada a fase 3 (`p3_test_preparing`, gate `functional_acceptance_recorded`).

### Resumen de verificación fase 2 (consolidado)

- Lanes de fase 2 ejecutadas: `sdd-spec` ✅, `sdd-design` ✅, `sdd-tasks` ✅, `sdd-apply-code-high` (WU-TSK-1) ✅, `sdd-apply-code-low` (WU-TSK-2, WU-ENT-3) ✅, `sdd-apply-code-medium` (WU-CRS-1, WU-ENT-1, WU-TST-1 rev1+rev2) ✅, `sdd-apply-doc` (WU-CRS-2, WU-DOC-1, WU-ENT-2) ✅, `sdd-verify-code` (rev1 fail → rework → rev2 passed) ✅.
- AC cubiertos estáticamente: AC-001..AC-005. Validación runtime/cobertura: fase 3.

### Resumen de verificación fase 3 (consolidado)

**FASE 3 COMPLETA** — estado `fase_3_verificacion / p3_complete` (gate `coverage_gate_passed` certificado ✅, rev 3 FINAL).

- **Unit/runner (WU-VER-UNITS rev 3)**: `bun test` 4 archivos target = 49 pass/0 fail; suites `frontend/__tests__/` (42) + `tests/back/` (43) = 85 pass/0 fail sin regresiones; `bun run test:check` EXIT 0; `run --method=unit --target=projectctl --persist` EXIT 0 → run `3a6a5483-bcb4-4394-8ee1-3eb91e004a3c`, criteria[] **23/23 `implemented` covered**, run-dirs 47→48 (legacy preservados). Write-back sin flips (declaraciones ya alineadas). Detalle: `verify-units.md` (§17-23).
- **Cobertura final (23 implemented ↔ archivo real)**: PCT-83..88 → `projectctl-bundle.test.ts`; PCT-90/93 → `tests/back/endpoints.test.ts`; PCT-91/92/94 → `tests/back/test-runner-contract.test.ts`; PCT-95..100 → `frontend/__tests__/projectctl-entorno.test.ts`; PCT-106/107/109/110/112/121 → `sot-coherence.test.ts`. PCT-79..82/89 → `not-applicable` (superficie plataforma).
- **PW-CLI / PW-AUTO**: `no_required` (binding `pw_enabled: false`, `browser_validation: optional`) — WU-VER-PWCLI/WU-VER-PWAUTO registrados sin ejecución.
- **WU-CLI-VAL (coordinator-owned)**: `projectctl env validate` **Passed** (prod ✓, dev ✓); **env set sincronizado**: plataforma (fuente Supabase) `FRONTEND_PORT` 4323/4324 → **4321** en prod y dev (repo ya tenía 4321); `projectctl status` lista PROD+DEV con compose `colpruebas-...-prod/-dev` (stopped — sandbox); `projectctl doctor`: compose canónicos ✓, configured ports **4321/4321** ✓, tunnel `test.colpruebas.online` ✓, reachable yes, last error none; preflight/plan/start dev → **`model_unavailable`** (runtime managed-dev de plataforma no disponible en sandbox — limitación de plataforma, ver §18).
- **Residual conocido**: dev Effective Port 4324 stale → DRIFT frontend dev flaggeado por el modelo de plataforma hasta que la plataforma re-registre el runtime (start bloqueado `model_unavailable`). No es defecto del repo (config canónica validada).

## 16. Adjuntos / referencias

No hay adjuntos iniciales.

## 17. Documentación impactada

Pendiente.

## 18. Problemas encontrados / riesgos

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| info | Locator `.agents/sdd-workflow.json` pinnea `binding_version: 8.0.0`; binding canónico declara `binding_version: 9.0.0` (drift). El coordinador resuelve el contexto desde el binding v9.0.0 (autoritativo, readable/parseable/shape válido); no bloquea bootstrap porque es el objetivo declarado de AC-004. | WU de AC-004 en fase 2 (`sdd-apply-code`): actualizar pin a `9.0.0` y verificar con `sot-coherence.test.ts`. |
| info | Projections `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` y `frontend/src/shared/sdd/task-flow.generated.ts` ausentes (AC-004 exige "projections presentes"). | WU de AC-004 en fase 2: regenerar proyecciones (`taskflow:generate`, owner `sdd-apply-code-high` per `maintenance.md` §8). |
| warning | Repo local en rama `main` (working tree con cambios preexistentes fuera de scope: `.agents/skills/coordinador/SKILL.md`, `.opencode/*`, fixtures taskReadme borrados). `delivery_context` exige branch feature desde `develop`. | No tocar working tree durante fase 1; reconciliar en `branch_creation_pending` (crear branch desde `develop`). |
| info | `frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (gate R-007) y runner `bun run test:check` posiblemente inexistentes (AC-003/AC-004) — se confirmará en exploración. | WU de AC-003/AC-004 en fase 2/3. |
| `warning` (desviación delivery) | **`source_branch: develop` NO es viable en este ambiente**: `develop` (21c3eb4, 2026-04-17) es línea legacy stale que NO contiene el ambiente de la plataforma (`.agents/`, `.opencode/`, sd-protocol, task file) — todo vive en `main` (8805218, commiteado hoy). Crear la rama desde `develop` destruiría el entorno y produciría un PR gigante roto. | **Excepción documentada (coordinator)**: rama feature creada desde `main`/HEAD (8805218) preservando traceabilidad; PR target a resolver en `final_pr_pending` (binding dice `develop`; realidad del board apunta `main` — registrar para el board). Ver §19. |
| warning | **Artefactos runtime trackeados en git**: `.runtime/test-results/**` (149 archivos) y `frontend/test-results/.last-run.json` están trackeados → el PR colaría ~150 artefactos si no se destrackean. | `git rm -r --cached .runtime/ frontend/test-results/` en `WU-DELIVERY` (coordinator), después de AD-02 (ignorados ya añadidos por WU-TST-1). |
| info | **Dependencia runtime fase 3**: write-back `--persist` del runner requiere `gray-matter` (vía `coverage-writer.ts`) no instalado en `backend/`. | En `WU-VER-UNITS` (fase 3): `bun install` en `backend/` si aplica (verificar package de backend). |
| info | `tests/back/endpoints.test.ts` sin header `// @ac` → `run --method=unit` retorna exit 2 hasta que fase 3 lo sane (WU-TST-2). No afecta `check`. | WU-TST-2 (fase 3) + WU-VER-UNITS verifican el gate completo. |
| info | `frontend/playwright.config.ts` `testDir: './tests'` (→ `frontend/tests`) vs specs actuales en `tests/front/tests/` — discrepancia reportada por WU-CRS-1/WU-TST-1. | Reconciliar en fase 3 (WU-VER-PWAUTO/WU-CLI-VAL no_required; WU-VER-UNITS valida gate). |
| warning | **Code review rev 1 FAILED (W1)**: `scripts/test-runner.ts` `run` no ejecuta tests reales — fabrica `criteria[]`/`covered` sin ejecución (design §5.1, PCT-91). | Rework `WU-TST-1` rev 2 (sdd-apply-code-medium): `run` debe ejecutar y derivar resultados reales. | 
| warning | **Code review rev 1 FAILED (W2)**: `frontend/__tests__` ausente de `unitRoots` (`backend/src/test-inventory.ts`) y `discoverUnitFiles` — design §8 no implementado. | Rework `WU-TST-1` rev 2 con scope extendido (coordinator) para tocar `backend/src/test-inventory.ts`. |
| info | **Resueltos en fase 3**: F1 (regex sot-coherence), F2 (header endpoints), F3 (headers individuales), I5 (multi-token AC cableado en extractores vivos), I6 (deps root express/cors), F5 (cobertura real 23/23), PCT-89 reclass not-applicable. Ver §15. | — |
| warning | **Residual plataforma (WU-CLI-VAL)**: runtime managed-dev de la plataforma `model_unavailable` en sandbox — `preflight`/`plan`/`start dev` bloqueados. Dev Effective Port stale 4324 → DRIFT frontend dev hasta re-registro por la plataforma (repo OK: config 4321 + compose canónicos reconocidos). | Escalar a plataforma para re-registrar runtime model / levantar dev. No bloquea cierre de fase 3 (env validate passed + doctor sin errores críticos de repo). |

## 19. Git / PR

- **Rama actual**: `feature/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests` (activa, verificada `git branch --show-current`)
- **Base de la rama**: `main`/HEAD `8805218` — **desviación documentada** (ver §18 ítem delivery): `develop` es legacy stale sin ambiente; se preserva traceabilidad sobre la rama viva de la plataforma.
- **PR URL**: _(vacío — se creará en `final_pr_pending`)_
- **Base target declarada (binding)**: `develop` — pero el board/repo vivo opera en `main` (único PR existente es fixture). A resolver en `final_pr_pending` con evidencia del board.
- **Estado de PR**: `not_created`
- **Working tree**: cambios preexistentes fuera de scope sin tocar (`.agents/skills/coordinador/SKILL.md`, `.opencode/*`, 2 fixtures taskReadme borrados); se excluirán del staging del commit de cierre salvo decisión explícita.
- **Cierre (gate)**: commit → push → PR único; close evidence: `branch_name`, `pr_url`, `verification_revision`, `documentation_revision`, `criteria_covered_complete`, `all_work_units_terminal`.

## 20. Estado actual y siguiente paso

- **Estado actual**: `testing`
- **Fase / State**: `fase_3_verificacion` / `p3_complete` — **FASE 3 COMPLETA** ✅ (gate `coverage_gate_passed` certificado)
- **Siguiente paso**: Entrada a fase 4 (`p4_started`): `sdd-apply-doc` para documentación restante (ver §17) + WU-REG (regen `.atl/skill-registry.md` coordinator-only) → delivery (`final_commit_pending` → `final_push_pending` → `final_pr_pending` → `done`).
- **Handoff para resume**: Fase 1 ✓ (§4/§5), Fase 2 ✓ (§6/§7/§10/§15 — 9 WUs + code review passed), Fase 3 ✓ (§15 — 134 tests verdes, gate certificado, env validate passed, env set 4321 sindicado, WU-CLI-VAL done con residual plataforma). Riesgos/limitaciones en §18 (runtime trackeado → git rm --cached; residual platform model_unavailable; envío del PR). Retomar: leer §10 + §15 + §17 + §18/§19 + §20 antes de routing.
- **Resume checkpoint**: fase en curso: `fase_4_documentacion` → `p4_started` (gate `functional_acceptance_recorded`/`coverage_gate_passed` satisfechos → `phase4_owned_dependencies_only` a evaluar); última acción confirmada: `p3_complete` + verificación consolidada en §15; siguiente acción atómica: transicionar frontmatter a `documenting`/`fase_4_documentacion`/`p4_started` y lanzar `sdd-apply-doc` (doc restante) + WU-REG.

## Task skill snapshot

Schema: `task-skills/v1`

```json
{
  "skills": []
}
```
