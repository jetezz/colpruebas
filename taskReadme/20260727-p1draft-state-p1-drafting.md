---
title: "State test: p1_drafting"
task_id: "20260727-p1draft"
task_slug: "state-p1-drafting"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "14.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20260727-p1draft-state-p1-drafting/"
status: planning
phase: fase_1_propuesta
state: p1_drafting
priority: medium
type: test
area: task-flow
created: "2026-07-27T09:30:00Z"
updated: "2026-07-27T09:35:00Z"
source_branch: develop
target_branch: develop
branch_name: "feature/20260727-p1draft-state-p1-drafting"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: not_required
blocked_reason: ""
---

# State test: p1_drafting

> **Origen de los valores**: este fixture es un **asset derivado del binding `projectctl-requirements.task-flow` v14.0.0**. Todo valor escribible se valida contra el binding canónico `TaskFlowBindingV2` (model `2`).
>
> **Modelo de persistencia v11.** Este archivo es el índice compacto de coordinación y el detalle completo vive en los phase artifacts referenciados. Ambos son la fuente canónica y suficiente de persistencia y recuperación. El binding configura `mirrors: []`; herramientas opcionales de soporte no son evidencia ni fuente de verdad SDD.
>
> **Nota**: fixture histórico de visibilidad del state `p1_drafting` (`binding.phases[]`, fase `fase_1_propuesta`). `kind: "phase-state"`, `writes_state: true`, `owner: "sdd-orchestrator"`. El `status` es exactamente el status de su fase (`planning`). Cuerpo normalizado a plantilla v14 por fix F-01 de verify-code (valores `phase`/`state`/`status` preservados).

## 1. Objetivo

Mostrar la forma canónica de un taskReadme en `phase: fase_1_propuesta` / `state: p1_drafting` / `status: planning` según plantilla v14 (fixture `type: test` para resolución del Tasks Tab sin artefactos paralelos).

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: fixture de visibilidad de estado (serie histórica `20260727-p*`, recabecerada a v14).
- **Motivación**: referencia auditable del state `p1_drafting` con frontmatter de plantilla v14 y valores `phase`/`state`/`status` preservados.
- **Restricciones** (el detalle va a los phase artifacts):
  - Persistencia única: índice + phase artifacts; `mirrors: []`.
  - Cierre solo en forma terminal única `{ phase: null, state: "done", status: "done" }`.
  - `phase`/`state` se resuelven desde `binding.phases[]` y `binding.controls[]`; los `retired_aliases` **no** son escribibles.
  - Sin artefactos filesystem bajo `proposals/`, `specs/`, `designs/` ni `tasks/`; sin git/gh, builds, tests, browser, Docker ni runtime `projectctl`; sin ediciones de código de producto.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Solo IDs canónicos + veredicto + método. Este fixture no aporta cobertura (los fixtures de estado no son evidencia).

| Criterion-ID | Veredicto | Método |
| --- | --- | --- |
| `— (fixture de estado, sin cobertura)` | `not_applicable` | `not_required` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Propuesta | `p1_drafting` | Fixture del state de redacción de la fase 1; evidencia inline en este fichero. | `taskReadme/20260727-p1draft-state-p1-drafting/` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["4_fases"]`).

## 5. Work units

Sin work units (fixture de estado, no una tarea ejecutable).

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `—` | `—` | `—` | `—` | `—` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["5_work_units"]`).

## 6. Verificación

- **Estado consolidado**: `not_required` (fixture de estado)
- **Lanes requeridos / ejecutados**: `ninguno`
- **Cobertura contra specs**: `n/a`
- **Refs**: `—`

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["6_verificacion"]`).

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `planning`
- **Fase / State**: `fase_1_propuesta` / `p1_drafting`
- **Siguiente paso**: transición del coordinador hacia `p1_awaiting_acceptance` (requiere aprobación humana explícita per `AC-010`). No inicia trabajo de spec, design, tasks ni implementación antes de ese guard.
- **Handoff para resume**: fixture estático; sin resume operativo.
- **Resume checkpoint**: `null`.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

Sin blockers.

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `—` | `—` | `—` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20260727-p1draft-state-p1-drafting` (per `binding.delivery.branch_pattern`)
- **PR URL**: `` (vacío)
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
