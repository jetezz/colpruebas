---
title: "Cumplimiento de requisitos y corrección del index colpruebas"
task_id: "20261001-cumreq"
task_slug: "cumplimiento-requisitos-index"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "15.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20261001-cumreq-cumplimiento-requisitos-index/"
status: planning
phase: fase_1_propuesta
state: p1_started
priority: high
type: feature
area: fullstack
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20261001-cumreq-cumplimiento-requisitos-index"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: ""
---

# Task: Cumplimiento de requisitos y corrección del index colpruebas

> **Origen de los valores**: este índice es un **asset del binding `projectctl-requirements.task-flow` v15.0.0**. Todo valor escribible se valida contra el binding canónico `TaskFlowBindingV2` (model `2`).
>
> **Modelo de persistencia v11.** Este archivo es el índice compacto de coordinación y el detalle completo vive en los phase artifacts referenciados. Ambos son la fuente canónica y suficiente de persistencia y recuperación. El binding configura `mirrors: []`; herramientas opcionales de soporte no son evidencia ni fuente de verdad SDD.

## 1. Objetivo

Pasar los doctors canónicos del core (`doctor-test`, `doctor-structure`, `doctor-docs`, `app-map-inventory`, `criterion-contract`) más los scripts de la skill, comprobar requisitos, arreglar incumplimientos y dejar una vista index con 4 puntos: 1 app colpruebas, 2 frontend env prod/dev por variables de entorno, 3 API prod/dev + salud, 4 rama Git visible en frontend (corregir main→develop).

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: mejora / deuda técnica (reintento bootstrap tras corrección quirúrgica del locator por sdd-orchestrator).
- **Motivación**: el locator quedó en `expected_binding_version` 15.0.0 con proyecciones cliente preservadas; hay que verificar identidad, validar y abrir índice canónico sin implementar fixes aún.
- **Restricciones** (el detalle va a los phase artifacts):
  - El índice es la única fuente operativa de coordinación (`binding.artifact_store.primary.path_pattern = taskReadme/<task_id>-<task_slug>.md`, `role: "index"`); el detalle de cada fase vive en `binding.artifact_store.phase_artifacts` (`taskReadme/<task_id>-<task_slug>/<artifact>.md`).
  - `binding.artifact_store.mirrors` está vacío; ninguna herramienta opcional participa en recovery, evidencia o cierre.
  - Cierre exitoso siempre en `status.terminal` (`done`, forma única `{ phase: null, state: "done", status: "done" }`).
  - `phase`/`state` se resuelven desde `binding.phases[]` y `binding.controls[]`; los `retired_aliases` **no** son escribibles.
- **Bootstrap sdd-init (registro lane, no phase artifact)**:
  - Locator `.agents/sdd-workflow.json`: `binding_id` `projectctl-requirements.task-flow` + `expected_binding_version` `15.0.0` OK; proyecciones cliente preservadas (`frontend/src/views/projectctl/data/tareas-tab.view-model.ts`, `frontend/src/shared/sdd/task-flow.generated.ts`).
  - Binding autoridad `.agents/skills/projectctl-sdd/references/tasks/binding.md` v15.0.0, bloque `task-flow-binding` OK; `generated/phase-state-schema.json` ya deriva de v15 (`source.binding_version 15.0.0`) → sin mismatch, sin regeneración (verificado vía `bun scripts/taskflow.ts --check` OK).
  - Mecanismo canónico de creación remota (`projectctl tasks create`) no registrado en este entorno (`UNREGISTERED_COMMAND`); índice creado localmente desde `assets/task-template.md` (equivalente canónico; `scripts/project/tasks.ts` no existe en el repo).
  - App-map objetivo `docs/app-map/views/home/index.md` EXISTE (bundle `home`, criterios HOME-01/HOME-05) → se usa como `app_map_location`, no se inventa nada.
  - Rama actual `develop` coincide con `binding.delivery.source_branch/target_branch`; locator corregido aún sin commitear (`M .agents/sdd-workflow.json`, registrado como hallazgo, no tocado por esta lane).
- **Project context (sdd-init §9)**: stack Bun + Astro frontend (`frontend/src/pages/index.astro`), `package.json` scripts (`test:*`, `docs:*`, `taskflow:*`, `sdd:doctor`); convenciones: Bun como runtime primario (no npm/npx), tests con `@ac` en 10 primeras líneas, coverage contractual vía `test:check`, registry `.atl/skill-registry.md`, App Map SoT en `docs/app-map/**`.
- **Testing capabilities (sdd-init §7)**: unit → `bun run scripts/test-runner.ts run --method=unit --target=home` (FOUND); pwauto → `... --method=pwauto --target=home` (FOUND); all → `... --method=all` (FOUND); check/coverage-gate → `bun run scripts/test-runner.ts check` (FOUND, OK); docs-lint → `bun scripts/projectctl-docs.ts lint` (FOUND); sdd static → `bun scripts/sdd-doctor.ts` (FOUND, OK). Strict TDD: test runner existe → `strict_tdd: true`.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Solo IDs canónicos + veredicto + método. La definición vigente vive en el bundle App Map propietario; proposal contiene su delta aprobado y spec desarrolla escenarios. No crear AC locales ni otro catálogo.

| Criterion-ID | Veredicto | Método |
| --- | --- | --- |
| `HOME-01` | `pending` | `PW-AUTO` |
| `HOME-05` | `pending` | `PW-AUTO` |

- `criteria_covered` enumera los mismos IDs canónicos aprobados, sin renumeración. `AC-006.criteria_covered` es un control del workflow, no el catálogo del cambio.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

Una fila por fase ejecutada. `summary` ≤ `index_budget.max_phase_summary_lines` (10). `artefacto` apunta al phase artifact con el detalle full. sdd-orchestrator copia aquí el `summary` + `artifact_ref` que devuelve cada lane; nunca inlina el detalle.

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Bootstrap init | `done` | Locator/binding v15 OK; checks verdes; índice creado en `p1_started`. | `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/` (registro §2, sin phase artifact pre-rellenado) |
| Exploración | `pending` | Pendiente: doctors + inventario app-map + skill scripts. | `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/explore-code.md` |
| Propuesta | `pending` | Pendiente tras exploración. | `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/proposal.md` |
| Specs | `pending` | Pendiente. | `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/spec.md` |
| Design | `pending` | Pendiente. | `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/design.md` |
| Tasks | `pending` | Pendiente. | `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/tasks.md` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["4_fases"]`). Las lanes escriben su phase artifact y devuelven `summary`+`artifact_ref`; sdd-orchestrator (single writer) rellena esta tabla.

## 5. Work units

El desglose full (13 columnas + 4 campos contractuales, complejidad, parallel-safety) vive en el phase artifact `tasks` (`taskReadme/20261001-cumreq-cumplimiento-requisitos-index/tasks.md`) — schema en `.agents/skills/projectctl-sdd/modules/sd-protocol/apply-work-unit-schema.md`. Aquí solo la tabla de estado que mantiene sdd-orchestrator:

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| _(sin desglose; lo define `sdd-tasks` en fase_2)_ | — | — | `pending` | — |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["5_work_units"]`). Cada apply lane escribe su evidencia en `apply-<unit_id>.md` y devuelve estado + `artifact_ref`; sdd-orchestrator actualiza esta tabla.

## 6. Verificación

Veredicto consolidado + refs a los phase artifacts `verify-*`. El detalle de cada lane vive en su artefacto; sdd-orchestrator consolida aquí.

- **Estado consolidado**: `pending`
- **Lanes requeridos / ejecutados**: bootstrap `sdd-init` done; resto pendiente
- **Cobertura contra specs**: sin specs aún
- **Readiness bootstrap (evidencia, no cobertura de cambio)**:
  - `sdd-check --check` → ok (binding + canonical criteria policy + active_sources + templates)
  - `requirements-check --check` → ok (criterion identity + schemas + MAP + criteria/ledger integrity)
  - `taskflow:check` (`bun scripts/taskflow.ts --check`) → passed, proyecciones intactas
  - `task-flow-normalizer --check-baseline` → ok (package 25.0.0, binding 15.0.0, contract TaskFlowBindingV2, model 2)
  - `sdd-doctor` → passed (home-only profile)
  - `test:check` (`test-runner check`) → OK (sin criterio implementado sin cobertura Unit+PW-AUTO)
- **Refs**:
  - Code review → `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/verify-code.md`
  - Unit tests → `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/verify-units.md`
  - PW-AUTO → `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/verify-pwauto.md`
  - PW-CLI → `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/verify-pwcli.md`
  - Requirements → artifacts del perfil y targets resueltos de `binding.requirements_verification`; índice operativo `requirements` conserva refs y huellas scope/global.
  - Consolidado → `taskReadme/20261001-cumreq-cumplimiento-requisitos-index/verify-report.md`
- **Validación browser/runtime**: contrato (target_environment, runtime_kind, credentials) en el phase artifact `tasks`; gate **Browser lane preconditions** en `.agents/skills/projectctl-sdd/modules/sdd/sdd-orchestrator/module.md.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["6_verificacion"]`). Las verify lanes escriben su `verify-<kind>.md` y devuelven veredicto + `artifact_ref`.

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `planning`
- **Fase / State**: `fase_1_propuesta` / `p1_started`
- **Siguiente paso**: `sdd-explore-code` (allowed en `fase_1_propuesta`: sdd-init, sdd-explore-code, sdd-explore-research, sdd-explore-pwcli, sdd-propose; el alcance pide pasar doctors + comprobar requisitos antes de proponer, por eso exploración-código primero; `sdd-propose` redacta tras exploración)
- **Handoff para resume**: índice válido creado en v15 (`p1_started`). Todo check bootstrap en verde. Alcance y app-map fijados en §1–§3. Siguiente: explorar código/doctors y luego propuesta. No hay fixes implementados.
- **Resume checkpoint**: lane en curso: null (init done); unit/ronda in-flight: none; última acción confirmada: índice `taskReadme/20261001-cumreq-cumplimiento-requisitos-index.md` escrito + carpeta phase-artifacts creada + checks §6 verdes; siguiente acción atómica: invocar `sdd-explore-code` con alcance §1 y app-map `docs/app-map/views/home/index.md`; releer antes de continuar: este índice (full-retrieval) + binding `task-flow-binding` block v15.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

Solo blockers activos. Registrar aquí `browser-target-missing` / `browser-credentials-missing` / `runtime-kind-unknown` / `index_budget_exceeded` u otros modos de fallo antes de bloquear.

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `info` | `scripts/project/tasks.ts` inexistente; `projectctl tasks create` no registrado (`UNREGISTERED_COMMAND`) en este entorno | Índice creado localmente desde `assets/task-template.md`; reconciliar con `projectctl` remoto al hacer push/PR |
| `info` | Locator corregido por orchestrator sin commitear (`M .agents/sdd-workflow.json`) | Hallazgo registrado; commit/PR lo hace el flujo de delivery, no esta lane |
| `warning` | Alcance incluye fixes + vista index 4 puntos pero esta lane NO implementa ni corrige | Deferido a lanes apply tras propuesta/spec/tasks aprobados |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20261001-cumreq-cumplimiento-requisitos-index` (per `binding.delivery.branch_pattern`)
- **PR URL**: ``
- **Base target**: `develop` (per `binding.delivery.target_branch`)
- **Estado de PR**: `not_created`

### Checklist de cierre (gate antes de pasar a `done`)

- [ ] Todas las unidades `apply_lane: code-*` en `done` o `blocked` (tabla §5)
- [ ] Las lanes de verificación requeridas en `passed` o `not_required` (mapping en `apply-work-unit-schema.md`)
- [ ] Branch + PR registrados arriba
- [ ] Documentación actualizada registrada en el phase artifact `apply-<unit>` de doc y reflejada en §4/§5
- [ ] Gate `AC-009.app_map_close` verificado si hay criterios `modificar`/`eliminar`/`añadir` en §3 (ver `acceptance-criteria-gates.md`)
- [ ] Receipts técnicos y documentales vigentes para todos los targets; pending_environment resuelto (per `binding.gates["documentation_gate_passed"]`).
- [ ] Forma terminal única: `status: done`, `phase: null`, `state: "done"` (per `binding.controls["done"].value`)

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["9_git_y_pr"]`).
