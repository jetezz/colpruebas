---
title: "<Nombre claro de la tarea>"
task_id: "<YYYYMMDD-shortid>"
task_slug: "<kebab-case-slug>"
sdd_change_id: "<YYYYMMDD-shortid-slug o vacío>"
sdd_persistence: "taskReadme + Engram mirror"
engram_status: unknown
engram_last_check: ""
engram_blocker: ""
status: pending
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

## 1. Objetivo

Describir en 2-4 líneas qué problema se resuelve, por qué importa y cuál es el resultado esperado.

## 2. Contexto operativo

- **Origen del pedido**: <bug / feature / mejora / deuda técnica>
- **Motivación**: <por qué se hace ahora>
- **Restricciones**:
  - Usar SDD cuando aplique.
  - La task es la única fuente operativa de verdad y el único artefacto filesystem canónico del overlay SDD local.
  - Engram es espejo obligatorio para recovery/search.
  - No crear ni actualizar artifacts SDD paralelos en `proposals/`, `specs/`, `designs/` o `tasks/`.
  - Este contrato es repo-local, inspirado por OpenSpec/OpenCode, y NO equivale a compliance literal de OpenSpec.
  - Cierre exitoso siempre en `done`.
  - Estados escribibles soportados: `pending`, `planning`, `ready_for_branch`, `branching`, `implementing`, `pushing`, `testing`, `documenting`, `done`, `blocked`, `failed`.
  - Estados legacy como `verified` solo se aceptan en lectura y se normalizan a `done`.

## 3. Vinculación SDD del cambio

| Campo | Valor |
| --- | --- |
| Overlay repo-local | `taskReadme + Engram mirror` |
| `sdd_change_id` | `<change-id o N/A>` |
| Estado del cambio SDD | `<pending / planning / ready_for_branch / branching / implementing / pushing / testing / documenting / done / blocked / failed>` |
| Task canónica | `taskReadme/<YYYYMMDD-shortid>-<slug>.md` |
| Mirror Engram | `sdd/<change-name>/<artifact>` |
| Engram status | `available / unavailable / unknown` |
| Engram last check | `<ISO timestamp / N/A>` |
| Engram blocker | `<error exacto o vacío>` |
| Nota de compliance | `Overlay repo-local; no es OpenSpec filesystem compliance literal; no usar artifacts paralelos en proposals/specs/designs/tasks.` |

## 4. Resumen de exploración

- **Estado**: `pending / drafted / approved / not_required`
- **Hallazgos clave**:
  - `<hallazgo 1>`
  - `<hallazgo 2>`
- **Alternativas consideradas**:
  - `<alternativa + tradeoff>`
- **Referencia Engram**: `<topic_key / observation id / N/A>`

## 5. Proposal

- **Estado**: `pending / drafted / approved / superseded / not_required`
- **Intent**: `<qué se quiere lograr>`
- **Scope**: `<in / out>`
- **Approach**: `<resumen corto>`
- **Success criteria**: `<criterios>`
- **Rollback**: `<plan o N/A>`
- **Referencia Engram**: `<topic_key / observation id / N/A>`

## 6. Specs / delta requirements

- **Estado**: `pending / drafted / approved / not_required`
- **Dominios afectados**: `<lista>`
- **Delta principal**:
  - `ADDED`: `<resumen>`
  - `MODIFIED`: `<resumen>`
  - `REMOVED`: `<resumen o N/A>`
- **Escenarios clave**:
  - `<Given/When/Then resumido>`
- **Referencia Engram**: `<topic_key / observation id / N/A>`

## 7. Design decisions

- **Estado**: `pending / drafted / approved / not_required`
- **Decisiones**:
  - `<decisión>` — `<rationale>`
  - `<decisión>` — `<rationale>`
- **Impacto técnico**: `<archivos / contratos / migración>`
- **Testing strategy**: `<resumen>`
- **Open questions**: `<lista o ninguna>`
- **Referencia Engram**: `<topic_key / observation id / N/A>`

## 8. Alcance y superficies afectadas

### Ruta / pantalla / entrypoint

- Frontend: `<ruta o pantalla>`
- API / backend: `<endpoint, servicio o job>`
- Infra / runtime: `<si aplica>`

### Componentes afectados

| Área | Componente | Impacto |
| --- | --- | --- |
| Frontend | `<componente o view>` | `<nuevo / cambio / refactor>` |
| Backend | `<handler / service / job>` | `<nuevo / cambio / refactor>` |
| Shared | `<schema / types / contracts>` | `<nuevo / cambio / refactor>` |

## 9. Criterios de aceptación

- [ ] El comportamiento principal funciona de punta a punta.
- [ ] Los estados UI/API esperados quedan cubiertos.
- [ ] No se rompe funcionalidad existente relacionada.
- [ ] La evidencia de validación queda registrada en esta task.

## 10. Desglose de implementación / progreso SDD

- **Estado del breakdown**: `pending / drafted / in_progress / complete`
- **Resumen**: `<cómo se dividió el trabajo>`
- **Progreso actual**: `<n/N tareas completadas>`
- **Último apply summary**: `<qué quedó hecho en la última ejecución>`
- **Modo apply recomendado**: `single / serial-batches / parallel-where-safe`
- **Batches seriales**: `<orden de batches o N/A>`
- **Candidatos paralelos**: `<units que pueden correr juntas o none>`
- **No paralelizar**: `<units + razón o none>`
- **Referencia Engram**:
  - Tasks: `<topic_key / observation id / N/A>`
  - Apply progress: `<topic_key / observation id / N/A>`

### Apply work units

| Unit | Estado | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Engram topic |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | pending | `<objetivo concreto>` | `<paths exactos o glob estrecho>` | none | `<grupo o none>` | `serial / parallel-safe / coordinator-only` | `sdd/<change-name>/apply-A` |
| B | pending | `<objetivo concreto>` | `<paths exactos o glob estrecho>` | A | `<grupo o none>` | `serial / parallel-safe / coordinator-only` | `sdd/<change-name>/apply-B` |
| C | pending | `<objetivo concreto>` | `<paths exactos o glob estrecho>` | none | `<grupo o none>` | `serial / parallel-safe / coordinator-only` | `sdd/<change-name>/apply-C` |

### Tareas de verificación planificadas

| ID | Estado | Tarea | Responsable |
| --- | --- | --- | --- |
| V1 | pending | `<verificación concreta>` | `<sdd-verify-code / sdd-verify-units / sdd-verify-pwauto / sdd-verify-pwcli>` |

## 11. Archivos previstos / modificados

| Archivo | Tipo | Motivo |
| --- | --- | --- |
| `frontend/...` | modificar | `<motivo>` |
| `backend/...` | crear/modificar | `<motivo>` |
| `docs/...` | modificar | `<motivo>` |

## 12. Impacto backend

- **Afecta backend**: sí / no
- **Servicios / endpoints**: `<lista o N/A>`
- **Cambios de contrato**: `<sí/no + detalle>`
- **DB / migraciones**: `<sí/no + detalle>`

## 13. Validación requerida

### Browser / Playwright CLI

- **Requerida**: `required | not_required`
- **Motivo**: `<por qué corresponde o no>`
- **Ruta validada**: `<URL o flujo>`

### Docker / runtime

- **Requerida**: `required | not_required`
- **Stack esperado**: `compose.yml | compose.dev.yml`
- **Objetivo**: `<qué se valida del runtime>`

## 14. Resultado de ejecución

### Playwright CLI

| Campo | Valor |
| --- | --- |
| Resultado | `pending / passed / failed / not_required` |
| Flujo validado | `<flujo>` |
| Evidencia | `<snapshot / notas / archivo>` |
| Observaciones | `<errores JS / comportamiento / N/A>` |

### Tests persistentes / verificación SDD

| Campo | Valor |
| --- | --- |
| Resultado | `pending / passed / failed / not_applicable` |
| Suite / comando | `<comando>` |
| Evidencia | `<archivo o resumen>` |

### Docker / runtime

| Campo | Valor |
| --- | --- |
| Resultado | `pending / passed / failed / not_required` |
| Comando | `<docker compose ...>` |
| Observaciones | `<estado de servicios / errores / N/A>` |

## 15. Resumen de verificación SDD

### Estado consolidado

- **Estado**: `pending / passed / failed / blocked / partial / not_required`
- **Lanes requeridos**: `<code / units / pwauto / pwcli>`
- **Lanes ejecutados**: `<lista>`
- **Cobertura contra specs**: `<resumen>`
- **Evidencia principal**: `<code review / Unit / PW-AUTO / PW-CLI / runtime>`
- **Desvíos detectados**: `<lista o ninguno>`
- **Referencia Engram consolidada**: `sdd/<change-name>/verify-report`

### Code review

- **Estado**: `pending / passed / failed / blocked / not_required`
- **Agente**: `sdd-verify-code`
- **Evidencia**: `<resumen>`
- **Hallazgos**: `<lista o ninguno>`
- **Referencia Engram**: `sdd/<change-name>/verify-code`

### Unit tests

- **Estado**: `pending / passed / failed / blocked / not_required`
- **Agente**: `sdd-verify-units`
- **Comando**: `<bun test ... / N/A>`
- **Evidencia**: `<resumen>`
- **Referencia Engram**: `sdd/<change-name>/verify-units`

### PW-AUTO

- **Estado**: `pending / passed / failed / blocked / not_required`
- **Agente**: `sdd-verify-pwauto`
- **Comando**: `<bun run test:e2e:... / N/A>`
- **Evidencia**: `<resumen>`
- **Referencia Engram**: `sdd/<change-name>/verify-pwauto`

### PW-CLI

- **Estado**: `pending / passed / failed / blocked / not_required`
- **Agente**: `sdd-verify-pwcli`
- **Flujo validado**: `<ruta / flujo / N/A>`
- **Evidencia**: `<snapshot / screenshot / notas / N/A>`
- **Referencia Engram**: `sdd/<change-name>/verify-pwcli`

## 16. Archive / cierre SDD

- **Estado**: `pending / archived / not_applicable`
- **Cierre del cambio**: `<resumen de cierre>`
- **Lineage**: `<secciones taskReadme + topic_keys Engram>`
- **Pendientes remanentes**: `<lista o ninguno>`
- **Referencia Engram**: `<topic_key / observation id / N/A>`

## 17. Problemas encontrados

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| `<critical / warning / info>` | `<descripción>` | `<qué se hizo o qué falta>` |

## 18. Git y PR

- **Rama actual**: `feature/<YYYYMMDD-shortid>-<slug>`
- **PR URL**: `<url o vacío>`
- **Base target**: `develop`
- **Estado de PR**: `not_created / open / merged / blocked`

## 19. Documentación actualizada

| Documento | Estado | Detalle |
| --- | --- | --- |
| `docs/...` | `pending / updated / not_required` | `<detalle>` |

## 20. Resumen de ejecución

- **Estado actual**: `<pending / planning / ready_for_branch / branching / implementing / pushing / testing / documenting / done / blocked / failed>`
- **Siguiente paso esperado**: `<siguiente paso concreto>`
- **Bloqueadores activos**: `<ninguno o detalle>`
- **Resumen corto**: <2-5 líneas de handoff para continuar sin releer toda la task>

## 21. Historial de cambios de la task

| Fecha | Actor | Cambio |
| --- | --- | --- |
| `2026-04-17T00:00:00Z` | `<orchestrator / sub-agent>` | `Task creada` |
