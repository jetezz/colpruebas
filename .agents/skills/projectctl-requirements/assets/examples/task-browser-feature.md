---
title: "Validar renombrado de proyecto desde dashboard"
task_id: "20260417-a1b2c3"
task_slug: "rename-project"
sdd_change_id: "20260417-a1b2c3-rename-project"
binding_id: "projectctl-requirements.task-flow"
binding_version: "9.0.0"
binding_path: ".agents/skills/projectctl-requirements/references/tareas.md"
sdd_persistence: "taskReadme index + phase artifacts"
phase_artifacts_dir: "taskReadme/20260417-a1b2c3-rename-project/"
status: done
phase: null
state: done
priority: high
type: feature
area: fullstack
created: 2026-04-17T09:00:00Z
updated: 2026-04-17T12:30:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20260417-a1b2c3-rename-project"
pr_url: "https://github.com/jetezz/colpruebas/pull/321"
browser_validation: required
docker_validation: required
docs_impact: updated
blocked_reason: ""
---

# Task: Validar renombrado de proyecto desde dashboard

> **Origen de los valores**: este ejemplo es un asset del binding `projectctl-requirements.task-flow` v9.0.0. El índice y sus phase artifacts son las fuentes canónicas.

## 1. Objetivo

Permitir renombrar un proyecto desde el dashboard sin perder sincronía entre UI, backend y shell del proyecto. El usuario ve el nuevo nombre inmediatamente y la API persiste el cambio sin romper las vistas relacionadas.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["1_objetivo"]`).

## 2. Contexto operativo

- **Origen del pedido**: mejora funcional (feature)
- **Motivación**: hoy el usuario puede crear y borrar proyectos, pero no renombrarlos desde la UI principal.
- **Restricciones**:
  - El índice es la única fuente operativa de coordinación (`binding.artifact_store.primary.path_pattern = taskReadme/<task_id>-<task_slug>.md`); el detalle full de cada fase vive en `binding.artifact_store.phase_artifacts` bajo `phase_artifacts_dir`.
  - El binding configura `mirrors: []`; recovery y evidencia viven en el índice y sus phase artifacts.
  - Cierre exitoso en `status.terminal` (`{ phase: null, state: "done", status: "done" }`); `retired_aliases` no escribibles.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["2_contexto_operativo"]`).

## 3. Criterios de aceptación

Prosa completa en `taskReadme/20260417-a1b2c3-rename-project/spec.md`.

| AC-ID | Veredicto | Método |
| --- | --- | --- |
| `AC-001` | `passed` | `PW-CLI` |
| `AC-002` | `passed` | `Unit` |
| `AC-003` | `passed` | `PW-AUTO` |
| `AC-004` | `passed` | `Manual` |

- `criteria_covered`: `AC-001, AC-002, AC-003, AC-004` (per `binding.gates["AC-006.criteria_covered"]`).

> **Ownership**: `coordinator` (per `binding.task.heading_owners["3_criterios_de_aceptacion"]`).

## 4. Fases

| Fase | Estado | Resumen (≤10 líneas) | Artefacto |
| --- | --- | --- | --- |
| Exploración | `done` | Rename toca frontend, PATCH y refresh de store; browser validation obligatoria por feedback visual. Descartado recargar vista completa. | `taskReadme/20260417-a1b2c3-rename-project/explore-code.md` |
| Propuesta | `approved` | Rename end-to-end desde dashboard: modal + PATCH + refresh; out: permisos y navegación. | `taskReadme/20260417-a1b2c3-rename-project/proposal.md` |
| Specs | `approved` | `SC-RENAME-001` renombrado persistido y reflejado sin recarga manual. | `taskReadme/20260417-a1b2c3-rename-project/spec.md` |
| Design | `approved` | Invalidar store tras PATCH exitoso; reutilizar endpoint existente sin abrir contrato nuevo. | `taskReadme/20260417-a1b2c3-rename-project/design.md` |
| Tasks | `complete` | 3 work units seriales A→B→C; contrato browser en `dev`/`managed-project`. | `taskReadme/20260417-a1b2c3-rename-project/tasks.md` |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["4_fases"]`).

## 5. Work units

Desglose full (13 columnas + campos contractuales) en `taskReadme/20260417-a1b2c3-rename-project/tasks.md`; schema en `.agents/skills/sd-protocol/apply-work-unit-schema.md`.

| WU-id | Lane | apply_lane | Estado | Artefacto de evidencia |
| --- | --- | --- | --- | --- |
| `WU-A` | `sdd-apply-code-medium` | `code-medium` | `done` | `taskReadme/20260417-a1b2c3-rename-project/apply-WU-A.md` |
| `WU-B` | `sdd-apply-code-high` | `code-high` | `done` | `taskReadme/20260417-a1b2c3-rename-project/apply-WU-B.md` |
| `WU-C` | `sdd-apply-doc` | `doc` | `done` | `taskReadme/20260417-a1b2c3-rename-project/apply-WU-C.md` |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["5_work_units"]`).

## 6. Verificación

- **Estado consolidado**: `passed`
- **Lanes requeridos / ejecutados**: `code, units, pwauto, pwcli` / `code, units, pwauto, pwcli`
- **Cobertura contra specs**: `SC-RENAME-001` cubierto end-to-end; sin desvíos.
- **Refs**:
  - Code review → `taskReadme/20260417-a1b2c3-rename-project/verify-code.md` (`passed`)
  - Unit tests → `taskReadme/20260417-a1b2c3-rename-project/verify-units.md` (`passed`, `bun test`)
  - PW-AUTO → `taskReadme/20260417-a1b2c3-rename-project/verify-pwauto.md` (`passed`, `bun run test:e2e:smoke-ui`)
  - PW-CLI → `taskReadme/20260417-a1b2c3-rename-project/verify-pwcli.md` (`passed`, flujo `login → dashboard → renombrar → ver nuevo nombre`)
  - Consolidado → `taskReadme/20260417-a1b2c3-rename-project/verify-report.md`
- **Validación browser/runtime**: contrato (`target_environment: dev`, `runtime_kind: managed-project`, credentials `.env.example.e2e`) en el phase artifact `tasks`; gate **Browser lane preconditions** en `.agents/skills/coordinador/SKILL.md`.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["6_verificacion"]`).

## 7. Estado actual / Siguiente paso / Handoff

- **Estado actual**: `done`
- **Fase / State**: `null` / `done`
- **Siguiente paso**: ninguno; task cerrada en forma terminal.
- **Handoff para resume**: rename implementado y verificado (code + Unit + PW-AUTO + PW-CLI passed), docker prod healthy, docs actualizadas, PR #321 merged contra develop. Nada pendiente.

> **Ownership**: `coordinator` (per `binding.task.heading_owners["7_estado_actual_siguiente_paso_handoff"]`).

## 8. Problemas / Blockers

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `warning` | El modal no refrescaba el card activo tras PATCH | Resuelto: se invalidó el store tras respuesta exitosa (WU-B). |

> **Ownership**: `coordinator` (per `binding.task.heading_owners["8_problemas_blockers"]`).

## 9. Git y PR

- **Rama actual**: `feature/20260417-a1b2c3-rename-project` (per `binding.delivery.branch_pattern`)
- **PR URL**: `https://github.com/jetezz/colpruebas/pull/321`
- **Base target**: `develop` (per `binding.delivery.target_branch`)
- **Estado de PR**: `merged`

### Checklist de cierre (gate antes de pasar a `done`)

- [x] Todas las unidades `apply_lane: code-*` en `done` o `blocked` (tabla §5)
- [x] Las lanes de verificación requeridas en `passed` o `not_required` (mapping en `apply-work-unit-schema.md`)
- [x] Branch + PR registrados arriba
- [x] Documentación actualizada registrada en el phase artifact `apply-WU-C.md` de doc y reflejada en §4/§5
- [x] Gate `AC-009.app_map_close` verificado (criterios `añadir` en §3)
- [x] `verification_revision >= documentation_revision` (per `binding.gates["documentation_gate_passed"]`)
- [x] Forma terminal única: `status: done`, `phase: null`, `state: "done"` (per `binding.controls["done"].value`)

> **Ownership**: `coordinator` (per `binding.task.heading_owners["9_git_y_pr"]`).
