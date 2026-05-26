---
title: "Endurecer skill coordinador con contrato de task profesional"
task_id: "20260417-b4d8e2"
task_slug: "coordinator-task-contract"
sdd_change_id: "20260417-b4d8e2-coordinator-task-contract"
sdd_persistence: "taskReadme + Engram mirror"
engram_status: available
engram_last_check: "2026-04-17T13:15:00Z"
engram_blocker: ""
status: documenting
priority: high
type: skill
area: agents
created: 2026-04-17T12:00:00Z
updated: 2026-04-17T13:15:00Z
source_branch: develop
target_branch: develop
branch_name: "feature/20260417-b4d8e2-coordinator-task-contract"
pr_url: ""
browser_validation: not_required
docker_validation: not_required
docs_impact: updated
blocked_reason: ""
---

# Task: Endurecer skill coordinador con contrato de task profesional

## 1. Objetivo

Definir una estructura de task profesional para que funcione como fuente de verdad operativa del coordinador, con evidencia clara de ejecución, testing, git, docker y documentación.

## 2. Contexto operativo

- **Origen del pedido**: mejora de proceso
- **Motivación**: la task actual no expresa de forma uniforme todo lo necesario para reanudar trabajo sin ambigüedad.
- **Restricciones**:
  - Mantener las skills SDD genéricas.
  - Endurecer solo la skill del coordinador y sus assets.
  - La task es la única fuente operativa de verdad y el único artefacto filesystem canónico del overlay SDD local.
  - No crear ni actualizar artifacts SDD paralelos en `proposals/`, `specs/`, `designs/` o `tasks/`.
  - No exigir browser validation cuando no hay funcionalidad browser-facing.
  - Estados escribibles soportados: `pending`, `planning`, `ready_for_branch`, `branching`, `implementing`, `pushing`, `testing`, `documenting`, `done`, `blocked`, `failed`.
  - `verified` solo puede leerse como alias legacy normalizado a `done`.

## 3. Vinculación SDD del cambio

| Campo | Valor |
| --- | --- |
| Overlay repo-local | `taskReadme + Engram mirror` |
| `sdd_change_id` | `20260417-b4d8e2-coordinator-task-contract` |
| Estado del cambio SDD | `documenting` |
| Task canónica | `taskReadme/20260417-b4d8e2-coordinator-task-contract.md` |
| Mirror Engram | `sdd/20260417-b4d8e2-coordinator-task-contract/<artifact>` |
| Engram status | `available` |
| Engram last check | `2026-04-17T13:15:00Z` |
| Engram blocker | `` |
| Nota de compliance | `Overlay repo-local; no es OpenSpec filesystem compliance literal; no usar artifacts paralelos en proposals/specs/designs/tasks.` |

## 4. Resumen de exploración

- **Estado**: `approved`
- **Hallazgos clave**:
  - faltaba un template reanudable con trazabilidad real.
  - los ejemplos no cubrían browser y non-browser con el mismo contrato.
- **Alternativas consideradas**:
  - dejar la task como nota libre: descartado porque rompe resume.
- **Referencia Engram**: `sdd/20260417-b4d8e2-coordinator-task-contract/explore`

## 5. Proposal

- **Estado**: `approved`
- **Intent**: endurecer la task como ledger operativo del coordinador.
- **Scope**: skill coordinador, template y ejemplos.
- **Approach**: formalizar frontmatter, secciones mínimas y evidencia de entrega.
- **Success criteria**: task resumible sin depender del chat.
- **Rollback**: volver a la skill previa y retirar los assets nuevos.
- **Referencia Engram**: `sdd/20260417-b4d8e2-coordinator-task-contract/proposal`

## 6. Specs / delta requirements

- **Estado**: `approved`
- **Dominios afectados**: skill coordinador, task template, ejemplos.
- **Delta principal**:
  - `ADDED`: contrato profesional de task.
  - `MODIFIED`: estructura requerida para resume y handoff.
  - `REMOVED`: dependencia en agentes legacy y secciones ambiguas.
- **Escenarios clave**:
  - `Given` una task existente, `When` el coordinador reanuda trabajo, `Then` puede decidir el siguiente paso leyendo task + Engram.
- **Referencia Engram**: `sdd/20260417-b4d8e2-coordinator-task-contract/spec`

## 7. Design decisions

- **Estado**: `approved`
- **Decisiones**:
  - un template canónico con 21 secciones — garantiza resume consistente.
  - ejemplos browser/non-browser completos — enseñan el contrato correcto.
- **Impacto técnico**: `.agents/skills/coordinador/**`.
- **Testing strategy**: revisión documental y consistencia de archivos.
- **Open questions**: ninguna.
- **Referencia Engram**: `sdd/20260417-b4d8e2-coordinator-task-contract/design`

## 8. Alcance y superficies afectadas

### Ruta / pantalla / entrypoint

- Frontend: N/A
- API / backend: N/A
- Infra / runtime: skill `coordinador`

### Componentes afectados

| Área | Componente | Impacto |
| --- | --- | --- |
| Agents | `/.agents/skills/coordinador/SKILL.md` | cambio |
| Agents | `/.agents/skills/coordinador/assets/task-template.md` | nuevo |
| Agents | `/.agents/skills/coordinador/examples/*.md` | nuevo |

## 9. Criterios de aceptación

- [x] Existe un template reusable de task.
- [x] Existen ejemplos completos para cambios browser-facing y non-browser.
- [x] La skill referencia explícitamente el contrato de task.
- [x] La task puede usarse como fuente de verdad sin depender del chat.

## 10. Desglose de implementación / progreso SDD

- **Estado del breakdown**: `complete`
- **Resumen**: contrato documental aplicado sobre skill + assets.
- **Progreso actual**: `3/3 tareas completadas`
- **Último apply summary**: `Template y ejemplos alineados al contrato repo-local.`
- **Modo apply recomendado**: `parallel-where-safe`
- **Batches seriales**: `A` primero para fijar contrato; `B` y `C` pueden correr después en paralelo.
- **Candidatos paralelos**: `B + C` porque tocan assets/docs distintos después de aprobado el contrato base.
- **No paralelizar**: `A` con otras unidades porque define la política que las demás consumen.
- **Referencia Engram**:
  - Tasks: `sdd/20260417-b4d8e2-coordinator-task-contract/tasks`
  - Apply progress: `sdd/20260417-b4d8e2-coordinator-task-contract/apply-progress`

### Apply work units

| Unit | Estado | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Engram topic |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | done | Definir contrato de task en la skill coordinador | `.agents/skills/coordinador/SKILL.md` | none | coordinator-policy | serial | `sdd/20260417-b4d8e2-coordinator-task-contract/apply-A` |
| B | done | Crear template y ejemplos | `.agents/skills/coordinador/assets/task-template.md`, `.agents/skills/coordinador/examples/*.md` | A | coordinator-assets | parallel-safe | `sdd/20260417-b4d8e2-coordinator-task-contract/apply-B` |
| C | done | Ajustar documentación del flujo | `docs/04-process/task.md`, `docs/00-context/coordinator-flow.md` | A | docs | parallel-safe | `sdd/20260417-b4d8e2-coordinator-task-contract/apply-C` |

### Tareas de verificación planificadas

| ID | Estado | Tarea | Responsable |
| --- | --- | --- | --- |
| V1 | done | Revisar consistencia del cambio documental/política | sdd-verify-code |

## 11. Archivos previstos / modificados

| Archivo | Tipo | Motivo |
| --- | --- | --- |
| `.agents/skills/coordinador/SKILL.md` | modificar | formalizar el contrato de task |
| `.agents/skills/coordinador/assets/task-template.md` | crear | template base |
| `.agents/skills/coordinador/examples/task-browser-feature.md` | crear | ejemplo browser-facing |
| `.agents/skills/coordinador/examples/task-non-browser-change.md` | crear | ejemplo non-browser |

## 12. Impacto backend

- **Afecta backend**: no
- **Servicios / endpoints**: N/A
- **Cambios de contrato**: no
- **DB / migraciones**: no

## 13. Validación requerida

### Browser / Playwright CLI

- **Requerida**: `not_required`
- **Motivo**: no cambia comportamiento browser-facing del producto
- **Ruta validada**: N/A

### Docker / runtime

- **Requerida**: `not_required`
- **Stack esperado**: `N/A`
- **Objetivo**: N/A

## 14. Resultado de ejecución

### Playwright CLI

| Campo | Valor |
| --- | --- |
| Resultado | `not_required` |
| Flujo validado | `N/A` |
| Evidencia | `N/A` |
| Observaciones | `cambio de skill/documentación únicamente` |

### Tests persistentes / verificación SDD

| Campo | Valor |
| --- | --- |
| Resultado | `not_applicable` |
| Suite / comando | `N/A` |
| Evidencia | `N/A` |

### Docker / runtime

| Campo | Valor |
| --- | --- |
| Resultado | `not_required` |
| Comando | `N/A` |
| Observaciones | `no corresponde para este tipo de cambio` |

## 15. Resumen de verificación SDD

### Estado consolidado

- **Estado**: `passed`
- **Lanes requeridos**: `code`
- **Lanes ejecutados**: `code`
- **Cobertura contra specs**: revisión documental suficiente.
- **Evidencia principal**: `code/policy review`.
- **Desvíos detectados**: ninguno.
- **Referencia Engram consolidada**: `sdd/20260417-b4d8e2-coordinator-task-contract/verify-report`

### Code review

- **Estado**: `passed`
- **Agente**: `sdd-verify-code`
- **Evidencia**: consistencia de archivos y contrato de task revisados.
- **Hallazgos**: ninguno.
- **Referencia Engram**: `sdd/20260417-b4d8e2-coordinator-task-contract/verify-code`

### Unit tests

- **Estado**: `not_required`
- **Agente**: `sdd-verify-units`
- **Comando**: `N/A`
- **Evidencia**: cambio documental/política sin lógica unit-testable.
- **Referencia Engram**: `N/A`

### PW-AUTO

- **Estado**: `not_required`
- **Agente**: `sdd-verify-pwauto`
- **Comando**: `N/A`
- **Evidencia**: no hay comportamiento browser persistente que validar.
- **Referencia Engram**: `N/A`

### PW-CLI

- **Estado**: `not_required`
- **Agente**: `sdd-verify-pwcli`
- **Flujo validado**: `N/A`
- **Evidencia**: cambio no browser-facing.
- **Referencia Engram**: `N/A`

## 16. Archive / cierre SDD

- **Estado**: `pending`
- **Cierre del cambio**: pendiente de archive final.
- **Lineage**: `explore -> proposal -> spec -> design -> tasks -> apply`
- **Pendientes remanentes**: archive.
- **Referencia Engram**: `sdd/20260417-b4d8e2-coordinator-task-contract/archive`

## 17. Problemas encontrados

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| info | desalineación previa entre states SDD y states soportados por frontend | la skill normaliza estados y evita inventar agentes removidos |

## 18. Git y PR

- **Rama actual**: `feature/20260417-b4d8e2-coordinator-task-contract`
- **PR URL**: ``
- **Base target**: `develop`
- **Estado de PR**: `not_created`

## 19. Documentación actualizada

| Documento | Estado | Detalle |
| --- | --- | --- |
| `.agents/skills/coordinador/assets/task-template.md` | `updated` | nuevo contrato profesional de task |
| `.agents/skills/coordinador/examples/` | `updated` | ejemplos de uso |

## 20. Resumen de ejecución

- **Estado actual**: `documenting`
- **Siguiente paso esperado**: revisar consistencia y cerrar en `done`
- **Bloqueadores activos**: ninguno
- **Resumen corto**: se definió una task profesional con frontmatter estable, secciones obligatorias, evidencia de validación y trazabilidad de git/PR/documentación.

## 21. Historial de cambios de la task

| Fecha | Actor | Cambio |
| --- | --- | --- |
| `2026-04-17T12:00:00Z` | orchestrator | task creada |
| `2026-04-17T12:45:00Z` | sdd-apply | template y ejemplos creados |
| `2026-04-17T13:15:00Z` | orchestrator | task enriquecida con contrato final |
