---
title: "Ejemplo canónico — p1_accepted"
task_id: "20261001-sdd1406"
task_slug: "ex-p1-accepted"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "14.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20261001-sdd1406-ex-p1-accepted/"
status: planning
phase: fase_1_propuesta
state: p1_accepted
priority: medium
type: feature
area: fullstack
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20261001-sdd1406-ex-p1-accepted"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: ""
---

# Task: Ejemplo canónico — p1_accepted

> **Origen de los valores**: este ejemplo es un **asset derivado del binding `projectctl-requirements.task-flow` v14.0.0**. Todo valor escribible se valida contra el binding canónico `TaskFlowBindingV2` (model `2`).
>
> **Modelo de persistencia v11.** Este archivo es el índice compacto de coordinación y el detalle completo vive en los phase artifacts referenciados. Ambos son la fuente canónica y suficiente de persistencia y recuperación. El binding configura `mirrors: []`; herramientas opcionales de soporte no son evidencia ni fuente de verdad SDD.
>
> **Nota didáctica**: ejemplo canónico del state `p1_accepted` (`binding.phases[]`, fase `fase_1_propuesta`). `kind: "phase-state"`, `writes_state: true`, `owner: "sdd-orchestrator"`. El `status` es exactamente el status de su fase (`planning`).

## 1. Objetivo

Mostrar la forma canónica de un taskReadme en `phase: fase_1_propuesta` / `state: p1_accepted` / `status: planning` según plantilla v14.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: ejemplo didáctico (cobertura total del binding v14).
- **Motivación**: referencia auditable del state `p1_accepted`, sin colisión con la serie `20260727-p*` (prefijo `ex-` disjunto de `state-`).
- **Restricciones** (el detalle va a los phase artifacts):
  - Persistencia única: índice + phase artifacts; `mirrors: []`.
  - Cierre solo en forma terminal única `{ phase: null, state: "done", status: "done" }`.
  - `phase`/`state` se resuelven desde `binding.phases[]` y `binding.controls[]`; los `retired_aliases` **no** son escribibles.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Solo IDs canónicos + veredicto + método. Este ejemplo no aporta cobertura (los ejemplos no son evidencia).

| Criterion-ID | Veredicto | Método |
| --- | --- | --- |
| `— (ejemplo didáctico, sin cobertura)` | `not_applicable` | `not_required` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Propuesta | `p1_accepted` | Ejemplo canónico del state de aceptación de la fase 1. | `taskReadme/20261001-sdd1406-ex-p1-accepted/proposal.md` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["4_fases"]`).

## 5. Work units

Sin work units (ejemplo didáctico, no una tarea ejecutable).

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `—` | `—` | `—` | `—` | `—` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["5_work_units"]`).

## 6. Verificación

- **Estado consolidado**: `not_required` (ejemplo didáctico)
- **Lanes requeridos / ejecutados**: `ninguno`
- **Cobertura contra specs**: `n/a`
- **Refs**: `—`

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["6_verificacion"]`).

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `planning`
- **Fase / State**: `fase_1_propuesta` / `p1_accepted`
- **Siguiente paso**: `branch_creation_pending` (transición didáctica hacia fase 2).
- **Handoff para resume**: ejemplo estático; sin resume operativo.
- **Resume checkpoint**: `null`.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

Sin blockers (ejemplo didáctico).

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `—` | `—` | `—` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20261001-sdd1406-ex-p1-accepted` (per `binding.delivery.branch_pattern`; no creada — ejemplo didáctico)
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
