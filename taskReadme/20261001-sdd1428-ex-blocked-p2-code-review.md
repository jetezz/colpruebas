---
title: "Ejemplo blocked en p2_code_review"
task_id: "20261001-sdd1428"
task_slug: "ex-blocked-p2-code-review"
sdd_change_id: ""
binding_id: "projectctl-requirements.task-flow"
binding_version: "14.0.0"
binding_path: ".agents/skills/projectctl-sdd/references/tasks/binding.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20261001-sdd1428-ex-blocked-p2-code-review/"
status: blocked
phase: fase_2_implementacion
state: p2_code_review
priority: medium
type: feature
area: fullstack
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T00:00:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20261001-sdd1428-ex-blocked-p2-code-review"
pr_url: ""
browser_validation: required
docker_validation: required
docs_impact: pending
blocked_reason: "Ejemplo didactico: interrupcion preservando phase/state."
---

# Task: Ejemplo blocked en p2_code_review

> **Origen de los valores**: este ejemplo es un **asset derivado del binding `projectctl-requirements.task-flow` v14.0.0**. Todo valor escribible se valida contra el binding canónico `TaskFlowBindingV2` (model `2`).
>
> **Modelo de persistencia v11.** Este archivo es el índice compacto de coordinación y el detalle completo vive en los phase artifacts referenciados. Ambos son la fuente canónica y suficiente de persistencia y recuperación. El binding configura `mirrors: []`; herramientas opcionales de soporte no son evidencia ni fuente de verdad SDD.
>
> **Nota didáctica**: ejemplo canónico del outcome `blocked` (`binding.controls[]`, `kind: "outcome"`). El `status` es el outcome (`blocked`, valor de `status.writable`); `phase`/`state` conservan el state de fase interrumpido (`fase_2_implementacion` / `p2_code_review`). `writes_state: false`, `owner: "sdd-orchestrator"`, `preserves: ["phase", "state"]`.

## 1. Objetivo

Mostrar la forma canónica de un taskReadme interrumpido por el outcome `blocked` preservando `phase`/`state` según plantilla v14.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: ejemplo didáctico (cobertura total del binding v14, slot 28a del par blocked/failed).
- **Motivación**: referencia auditable de cómo un outcome preserva el estado de fase interrumpido sin reescribirlo.
- **Restricciones** (el detalle va a los phase artifacts):
  - Persistencia única: índice + phase artifacts; `mirrors: []`.
  - `blocked`/`failed` son `kind: "outcome"` con `writes_state: false`; nunca cambian `phase`/`state`.
  - Los `retired_aliases` **no** son escribibles.

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
| Implementación | `p2_code_review` (interrumpido por `blocked`) | Ejemplo canónico del outcome `blocked` con `phase`/`state` preservados. | `taskReadme/20261001-sdd1428-ex-blocked-p2-code-review/verify-code.md` |

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

- **Estado actual**: `blocked`
- **Fase / State**: `fase_2_implementacion` / `p2_code_review` (preservados)
- **Siguiente paso**: desbloqueo por `sdd-orchestrator` (retoma `p2_code_review` con `status: implementing`).
- **Handoff para resume**: ejemplo estático; sin resume operativo.
- **Resume checkpoint**: `null`.

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

Bloqueo didáctico registrado en `blocked_reason`; el `phase`/`state` quedan intactos.

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `info` | `Ejemplo didáctico de interrupción (outcome blocked).` | `Desbloqueo didáctico por sdd-orchestrator; retoma p2_code_review.` |

> **Ownership**: `sdd-orchestrator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20261001-sdd1428-ex-blocked-p2-code-review` (per `binding.delivery.branch_pattern`; no creada — ejemplo didáctico)
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
