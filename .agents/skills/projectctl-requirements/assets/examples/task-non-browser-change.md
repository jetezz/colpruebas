---
title: "Endurecer skill coordinador con contrato de task profesional"
task_id: "20260417-b4d8e2"
task_slug: "coordinator-task-contract"
sdd_change_id: "20260417-b4d8e2-coordinator-task-contract"
binding_id: "projectctl-requirements.task-flow"
binding_version: "8.0.0"
binding_path: ".agents/skills/projectctl-requirements/references/tareas.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20260417-b4d8e2-coordinator-task-contract/"
status: done
phase: null
state: done
priority: high
type: skill
area: agents
created: 2026-04-17T12:00:00Z
updated: 2026-04-17T14:05:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20260417-b4d8e2-coordinator-task-contract"
pr_url: "https://github.com/jetezz/colpruebas/pull/322"
browser_validation: not_required
docker_validation: not_required
docs_impact: updated
blocked_reason: ""
---

# Task: Endurecer skill coordinador con contrato de task profesional

> **Origen de los valores**: este ejemplo es un asset del binding `projectctl-requirements.task-flow` v8.0.0. El índice y sus phase artifacts son las fuentes canónicas.

## 1. Objetivo

Definir una estructura de task profesional (índice compacto v6) para que funcione como fuente de verdad operativa del coordinador, con evidencia clara de ejecución, verificación, git y documentación, resumible sin depender del chat.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: mejora de proceso (deuda técnica de coordinación)
- **Motivación**: la task previa no expresaba de forma uniforme lo necesario para reanudar trabajo sin ambigüedad.
- **Restricciones**:
  - El índice es la única fuente operativa de coordinación (`binding.artifact_store.primary.path_pattern = taskReadme/<task_id>-<task_slug>.md`); el detalle full vive en `binding.artifact_store.phase_artifacts` bajo `phase_artifacts_dir`.
  - El binding configura `mirrors: []`; recovery y evidencia viven en el índice y sus phase artifacts.
  - Cierre exitoso en `status.terminal` (`{ phase: null, state: "done", status: "done" }`); `retired_aliases` no escribibles.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Prosa completa en `taskReadme/20260417-b4d8e2-coordinator-task-contract/spec.md`.

| AC-ID | Veredicto | Método |
| --- | --- | --- |
| `AC-001` | `passed` | `Unit` |
| `AC-002` | `passed` | `Manual` |
| `AC-003` | `passed` | `Manual` |
| `AC-004` | `passed` | `not_required` |

- `criteria_covered`: `AC-001, AC-002, AC-003, AC-004` (per `binding.gates["AC-006.criteria_covered"]`).

> **Ownership**: `coordinator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Exploración | `done` | Faltaba template reanudable con trazabilidad real; ejemplos no cubrían browser y non-browser con el mismo contrato. Descartado dejar la task como nota libre. | `taskReadme/20260417-b4d8e2-coordinator-task-contract/explore-code.md` |
| Propuesta | `approved` | Endurecer la task como ledger operativo: formalizar frontmatter, secciones mínimas y evidencia de entrega. | `taskReadme/20260417-b4d8e2-coordinator-task-contract/proposal.md` |
| Specs | `approved` | `SC-TASK-CONTRACT-001` reanudación desde el ledger sin depender del chat. | `taskReadme/20260417-b4d8e2-coordinator-task-contract/spec.md` |
| Design | `approved` | Índice compacto de 9 secciones + phase artifacts por fase; ejemplos browser/non-browser completos. | `taskReadme/20260417-b4d8e2-coordinator-task-contract/design.md` |
| Tasks | `complete` | 3 work units: A serial (contrato), B+C parallel-safe (assets/docs). | `taskReadme/20260417-b4d8e2-coordinator-task-contract/tasks.md` |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["4_fases"]`).

## 5. Work units

Desglose full (13 columnas + campos contractuales) en `taskReadme/20260417-b4d8e2-coordinator-task-contract/tasks.md`; schema en `.agents/skills/sd-protocol/apply-work-unit-schema.md`.

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `WU-A` | `sdd-apply-code-medium` | `code-medium` | `done` | `taskReadme/20260417-b4d8e2-coordinator-task-contract/apply-WU-A.md` |
| `WU-B` | `sdd-apply-code-medium` | `code-medium` | `done` | `taskReadme/20260417-b4d8e2-coordinator-task-contract/apply-WU-B.md` |
| `WU-C` | `sdd-apply-doc` | `doc` | `done` | `taskReadme/20260417-b4d8e2-coordinator-task-contract/apply-WU-C.md` |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["5_work_units"]`).

## 6. Verificación

- **Estado consolidado**: `passed`
- **Lanes requeridos / ejecutados**: `code` / `code`
- **Cobertura contra specs**: `SC-TASK-CONTRACT-001` verificado por revisión de código/política; sin desvíos.
- **Refs**:
  - Code review → `taskReadme/20260417-b4d8e2-coordinator-task-contract/verify-code.md` (`passed`, método principal)
  - Unit tests → `taskReadme/20260417-b4d8e2-coordinator-task-contract/verify-units.md` (`not_required`: cambio documental/política sin lógica unit-testable)
  - PW-AUTO → `taskReadme/20260417-b4d8e2-coordinator-task-contract/verify-pwauto.md` (`not_required`: sin comportamiento browser persistente)
  - PW-CLI → `taskReadme/20260417-b4d8e2-coordinator-task-contract/verify-pwcli.md` (`not_required`: cambio no browser-facing)
  - Consolidado → `taskReadme/20260417-b4d8e2-coordinator-task-contract/verify-report.md`
- **Validación browser/runtime**: `browser_validation: not_required`; el gate **Browser lane preconditions** (`.agents/skills/coordinador/SKILL.md`) no aplica.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["6_verificacion"]`).

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `done`
- **Fase / State**: `null` / `done`
- **Siguiente paso**: ninguno; task cerrada en forma terminal.
- **Handoff para resume**: contrato de task v6 (índice compacto) aplicado sobre skill coordinador + template + ejemplos; code/policy review passed; PW-CLI/PW-AUTO/units not_required por naturaleza no browser; docs actualizadas; PR #322 merged. Nada pendiente.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `info` | Desalineación previa entre states SDD y states soportados por el frontend | Resuelto: la skill normaliza estados desde el binding y evita inventar agentes retirados. |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20260417-b4d8e2-coordinator-task-contract` (per `binding.delivery.branch_pattern`)
- **PR URL**: `https://github.com/jetezz/colpruebas/pull/322`
- **Base target**: `develop` (per `binding.delivery.target_branch`)
- **Estado de PR**: `merged`

### Checklist de cierre (gate antes de pasar a `done`)

- [x] Todas las unidades `apply_lane: code-*` en `done` o `blocked` (tabla §5)
- [x] Las lanes de verificación requeridas en `passed` o `not_required` (mapping en `apply-work-unit-schema.md`)
- [x] Branch + PR registrados arriba
- [x] Documentación actualizada registrada en el phase artifact `apply-WU-C.md` de doc y reflejada en §4/§5
- [x] Gate `AC-009.app_map_close` verificado si hay criterios `modificar`/`eliminar`/`añadir` en §3
- [x] `verification_revision >= documentation_revision` (per `binding.gates["documentation_gate_passed"]`)
- [x] Forma terminal única: `status: done`, `phase: null`, `state: "done"` (per `binding.controls["done"].value`)

> **Ownership**: `coordinator` (per `binding.task.heading_owners["9_git_y_pr"]`).
