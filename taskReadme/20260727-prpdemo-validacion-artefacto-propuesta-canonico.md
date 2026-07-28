---
title: "Validación de visibilidad del artifact proposal.md"
task_id: "20260727-prpdemo"
task_slug: "validacion-artefacto-propuesta-canonico"
sdd_change_id: "20260727-prpdemo-validacion-artefacto-propuesta-canonico"
binding_id: "projectctl-requirements.task-flow"
binding_version: "8.0.0"
binding_path: ".agents/skills/projectctl-requirements/references/tareas.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20260727-prpdemo-validacion-artefacto-propuesta-canonico/"
status: planning
phase: fase_1_propuesta
state: p1_awaiting_acceptance
priority: medium
type: documentation
area: task-flow
created: "2026-07-27T00:00:00Z"
updated: "2026-07-27T00:00:00Z"
source_branch: develop
target_branch: develop
branch_name: null
pr_url: null
browser_validation: required
docker_validation: not_required
docs_impact: required
blocked_reason: null
error_message: null
---

# Task: Validación de visibilidad del artifact proposal.md

## 1. Objetivo

Demostrar operativamente que una tarea de cambio genuina puede publicar su `proposal.md` canónico y hacerlo visible en el Tasks Tab. La tarea es deliberadamente `type: documentation` y no modifica fixtures `type: test` ni código del proyecto.

## 2. Contexto operativo

- **Origen del pedido**: validación operativa de documentación SDD.
- **Persistencia**: el índice compacto y el phase artifact `proposal.md` son las únicas fuentes canónicas.
- **Restricción**: la aprobación humana explícita es obligatoria antes de cualquier fase posterior; esta tarea queda en `p1_awaiting_acceptance`.

## 3. Criterios de aceptación

| AC-ID | Veredicto | Método |
| --- | --- | --- |
| `AC-001` | pending | Manual |
| `AC-010` | pending | Manual |

## 4. Fases

| Fase | Estado | Resumen | Artefacto |
| --- | --- | --- | --- |
| Exploración | not_required | No se requiere exploración previa para crear este artifact demostrativo. | — |
| Propuesta | drafted | Proposal canónico creado; requiere aprobación humana explícita. | `taskReadme/20260727-prpdemo-validacion-artefacto-propuesta-canonico/proposal.md` |
| Specs | pending | Bloqueada hasta aprobación humana. | — |
| Design | pending | Bloqueada hasta aprobación humana. | — |
| Tasks | pending | Bloqueada hasta aprobación humana. | — |

## 5. Work units

No hay work units asignadas en esta fase.

## 6. Verificación

- **Estado consolidado**: pending
- **Lanes requeridos / ejecutados**: Manual / pendiente
- **Cobertura contra specs**: pendiente de aprobación y validación del Tasks Tab.

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: planning
- **Fase / State**: fase_1_propuesta / p1_awaiting_acceptance
- **Siguiente paso**: aprobación humana explícita; no iniciar specs, design, tasks ni implementación antes de ella.
- **Handoff**: releer este índice y `proposal.md`; registrar actor, literal, timestamp UTC, revisión e IDs aprobados para satisfacer AC-010.

## 8. Problemas / Blockers

No hay blockers de identidad: `20260727-prpdemo` cumple el patrón v8.0.0 `^\\d{8}-[a-z0-9]{4,8}$`.

## 9. Git y PR

- **Rama actual**: no creada; la tarea permanece en aceptación de propuesta.
- **PR URL**: null
- **Base target**: develop
- **Estado de PR**: not_created
