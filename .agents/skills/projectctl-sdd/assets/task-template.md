---
title: "<Nombre claro de la tarea>"
task_id: "<YYYYMMDD-shortid>"
task_slug: "<kebab-case-slug>"
sdd_change_id: "<YYYYMMDD-shortid-slug o vacío>"
binding_id: "projectctl-requirements.task-flow"
binding_version: "15.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/<task_id>-<task_slug>/"
status: planning
phase: fase_1_propuesta
state: p1_started
priority: medium
type: feature
area: fullstack
created: 2026-04-17T00:00:00Z
updated: 2026-04-17T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/<YYYYMMDD-shortid>-<slug>"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: ""
---

# Task: <Nombre claro de la tarea>

> **Origen de los valores**: este template es un **asset del binding `projectctl-requirements.task-flow` v15.0.0**. Todo valor escribible se valida contra el binding canónico `TaskFlowBindingV2` (model `2`).
>
> **Modelo de persistencia v11.** Este archivo es el índice compacto de coordinación y el detalle completo vive en los phase artifacts referenciados. Ambos son la fuente canónica y suficiente de persistencia y recuperación. El binding configura `mirrors: []`; herramientas opcionales de soporte no son evidencia ni fuente de verdad SDD.

## 1. Objetivo

Describir en 2-4 líneas qué problema se resuelve, por qué importa y cuál es el resultado esperado.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: <bug / feature / mejora / deuda técnica>
- **Motivación**: <por qué se hace ahora>
- **Restricciones** (2-4 líneas máximo; el detalle va a los phase artifacts):
  - El índice es la única fuente operativa de coordinación (`binding.artifact_store.primary.path_pattern = taskReadme/<task_id>-<task_slug>.md`, `role: "index"`); el detalle de cada fase vive en `binding.artifact_store.phase_artifacts` (`taskReadme/<task_id>-<task_slug>/<artifact>.md`).
  - `binding.artifact_store.mirrors` está vacío; ninguna herramienta opcional participa en recovery, evidencia o cierre.
  - Cierre exitoso siempre en `status.terminal` (`done`, forma única `{ phase: null, state: "done", status: "done" }`).
  - `phase`/`state` se resuelven desde `binding.phases[]` y `binding.controls[]`; los `retired_aliases` **no** son escribibles.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Solo IDs canónicos + veredicto + método. La definición vigente vive en el bundle App Map propietario; proposal contiene su delta aprobado y spec desarrolla escenarios. No crear AC locales ni otro catálogo.

| Criterion-ID | Veredicto | Método |
| --- | --- | --- |
| `<ID canónico del bundle>` | `pending / passed / failed / not_applicable` | `Unit / PW-CLI / PW-AUTO / Manual / not_required` |

- `criteria_covered` enumera los mismos IDs canónicos aprobados, sin renumeración. `AC-006.criteria_covered` es un control del workflow, no el catálogo del cambio.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

Una fila por fase ejecutada. `summary` ≤ `index_budget.max_phase_summary_lines` (10). `artefacto` apunta al phase artifact con el detalle full. sdd-orchestrator copia aquí el `summary` + `artifact_ref` que devuelve cada lane; nunca inlina el detalle.

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Exploración | `pending / done / not_required` | `<resumen>` | `taskReadme/<task_id>-<task_slug>/explore-{code,research,pwcli}.md` |
| Propuesta | `pending / drafted / approved` | `<resumen>` | `taskReadme/<task_id>-<task_slug>/proposal.md` |
| Specs | `pending / drafted / approved` | `<resumen>` | `taskReadme/<task_id>-<task_slug>/spec.md` |
| Design | `pending / drafted / approved` | `<resumen>` | `taskReadme/<task_id>-<task_slug>/design.md` |
| Tasks | `pending / drafted / complete` | `<resumen>` | `taskReadme/<task_id>-<task_slug>/tasks.md` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["4_fases"]`). Las lanes escriben su phase artifact y devuelven `summary`+`artifact_ref`; sdd-orchestrator (single writer) rellena esta tabla.

## 5. Work units

El desglose full (13 columnas + 4 campos contractuales, complejidad, parallel-safety) vive en el phase artifact `tasks` (`taskReadme/<task_id>-<task_slug>/tasks.md`) — schema en `.agents/skills/projectctl-sdd/modules/sd-protocol/apply-work-unit-schema.md`. Aquí solo la tabla de estado que mantiene sdd-orchestrator:

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `WU-A` | `<canonical lane ID: sdd-apply-code-* / sdd-apply-doc / sdd-verify-*>` | `<code-low / code-medium / code-high / doc / none>` | `pending / in_progress / done / blocked / failed` | `taskReadme/<task_id>-<task_slug>/apply-WU-A.md` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["5_work_units"]`). Cada apply lane escribe su evidencia en `apply-<unit_id>.md` y devuelve estado + `artifact_ref`; sdd-orchestrator actualiza esta tabla.

## 6. Verificación

Veredicto consolidado + refs a los phase artifacts `verify-*`. El detalle de cada lane vive en su artefacto; sdd-orchestrator consolida aquí.

- **Estado consolidado**: `pending / passed / failed / blocked / partial / not_required`
- **Lanes requeridos / ejecutados**: `<code / units / pwauto / pwcli>`
- **Cobertura contra specs**: `<resumen breve>`
- **Refs**:
  - Code review → `taskReadme/<task_id>-<task_slug>/verify-code.md`
  - Unit tests → `taskReadme/<task_id>-<task_slug>/verify-units.md`
  - PW-AUTO → `taskReadme/<task_id>-<task_slug>/verify-pwauto.md`
  - PW-CLI → `taskReadme/<task_id>-<task_slug>/verify-pwcli.md`
  - Requirements → artifacts del perfil y targets resueltos de `binding.requirements_verification`; índice operativo `requirements` conserva refs y huellas scope/global.
  - Consolidado → `taskReadme/<task_id>-<task_slug>/verify-report.md`
- **Validación browser/runtime**: contrato (target_environment, runtime_kind, credentials) en el phase artifact `tasks`; gate **Browser lane preconditions** en `.agents/skills/projectctl-sdd/modules/sdd/sdd-orchestrator/module.md`.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["6_verificacion"]`). Las verify lanes escriben su `verify-<kind>.md` y devuelven veredicto + `artifact_ref`.

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `<uno de binding.status.writable = {pending, planning, implementing, testing, documenting, done, blocked, failed}>`
- **Fase / State**: `<binding.phases[].id o null>` / `<binding.phases[phase].states[] o binding.controls[].value.state>`
- **Siguiente paso**: `<siguiente lane concreta de binding.phases[phase].allowed_lanes[]>`
- **Handoff para resume**: `<2-5 líneas para continuar en una sesión nueva sin releer los phase artifacts>`
- **Resume checkpoint**: `<checkpoint granular de recuperación tras compactación de contexto: lane en curso (o null), unit/ronda in-flight, última acción confirmada, siguiente acción atómica pendiente, y el phase artifact a releer con full-retrieval antes de continuar>`

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

Solo blockers activos. Registrar aquí `browser-target-missing` / `browser-credentials-missing` / `runtime-kind-unknown` / `index_budget_exceeded` u otros modos de fallo antes de bloquear.

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `<critical / warning / info>` | `<descripción>` | `<qué se hizo o qué falta>` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/<task_id>-<task_slug>` (per `binding.delivery.branch_pattern`)
- **PR URL**: `<url o vacío>`
- **Base target**: `develop` (per `binding.delivery.target_branch`)
- **Estado de PR**: `not_created / open / merged / blocked`

### Checklist de cierre (gate antes de pasar a `done`)

- [ ] Todas las unidades `apply_lane: code-*` en `done` o `blocked` (tabla §5)
- [ ] Las lanes de verificación requeridas en `passed` o `not_required` (mapping en `apply-work-unit-schema.md`)
- [ ] Branch + PR registrados arriba
- [ ] Documentación actualizada registrada en el phase artifact `apply-<unit>` de doc y reflejada en §4/§5
- [ ] Gate `AC-009.app_map_close` verificado si hay criterios `modificar`/`eliminar`/`añadir` en §3 (ver `acceptance-criteria-gates.md`)
- [ ] Receipts técnicos y documentales vigentes para todos los targets; pending_environment resuelto (per `binding.gates["documentation_gate_passed"]`).
- [ ] Forma terminal única: `status: done`, `phase: null`, `state: "done"` (per `binding.controls["done"].value`)

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["9_git_y_pr"]`).
