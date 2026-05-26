---
title: "Validar renombrado de proyecto desde dashboard"
task_id: "20260417-a1b2c3"
task_slug: "rename-project"
sdd_change_id: "20260417-a1b2c3-rename-project"
sdd_persistence: "taskReadme + Engram mirror"
engram_status: available
engram_last_check: "2026-04-17T11:40:00Z"
engram_blocker: ""
status: testing
priority: high
type: feature
area: fullstack
created: 2026-04-17T09:00:00Z
updated: 2026-04-17T11:40:00Z
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

## 1. Objetivo

Permitir renombrar un proyecto desde el dashboard sin perder sincronía entre UI, backend y shell del proyecto. El usuario debe ver el nuevo nombre inmediatamente y la API debe persistir el cambio sin romper las vistas relacionadas.

## 2. Contexto operativo

- **Origen del pedido**: mejora funcional
- **Motivación**: hoy el usuario puede crear y borrar proyectos, pero no renombrarlos desde la UI principal.
- **Restricciones**:
  - Usar SDD para implementación y verificación.
  - La task es la única fuente operativa de verdad y el único artefacto filesystem canónico del overlay SDD local.
  - Engram es espejo obligatorio para recovery/search.
  - No crear ni actualizar artifacts SDD paralelos en `proposals/`, `specs/`, `designs/` o `tasks/`.
  - Este contrato es repo-local, inspirado por OpenSpec/OpenCode, y NO equivale a compliance literal de OpenSpec.
  - Cierre exitoso siempre en `done`.
  - `verified` no es un estado target; si aparece como legado se lee como `done`.

## 3. Vinculación SDD del cambio

| Campo | Valor |
| --- | --- |
| Overlay repo-local | `taskReadme + Engram mirror` |
| `sdd_change_id` | `20260417-a1b2c3-rename-project` |
| Estado del cambio SDD | `testing` |
| Task canónica | `taskReadme/20260417-a1b2c3-rename-project.md` |
| Mirror Engram | `sdd/20260417-a1b2c3-rename-project/<artifact>` |
| Engram status | `available` |
| Engram last check | `2026-04-17T11:40:00Z` |
| Engram blocker | `` |
| Nota de compliance | `Overlay repo-local; no es OpenSpec filesystem compliance literal; no usar artifacts paralelos en proposals/specs/designs/tasks.` |

## 4. Resumen de exploración

- **Estado**: `approved`
- **Hallazgos clave**:
  - El rename tocaba frontend, endpoint PATCH y refresh de store.
  - La validación browser era obligatoria por feedback visual inmediato.
- **Alternativas consideradas**:
  - Recargar toda la vista tras PATCH: descartado por peor UX.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/explore`

## 5. Proposal

- **Estado**: `approved`
- **Intent**: agregar rename end-to-end desde dashboard.
- **Scope**: `in`: modal, PATCH, refresh; `out`: cambios de permisos o navegación.
- **Approach**: actualizar el modal y refrescar el store tras persistir.
- **Success criteria**: rename visible sin reload y con evidencia browser.
- **Rollback**: revertir modal + PATCH y volver al flujo previo.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/proposal`

## 6. Specs / delta requirements

- **Estado**: `approved`
- **Dominios afectados**: dashboard, API projects, validación de payload.
- **Delta principal**:
  - `ADDED`: edición de nombre desde dashboard.
  - `MODIFIED`: refresh visual tras PATCH.
  - `REMOVED`: N/A.
- **Escenarios clave**:
  - `Given` un proyecto existente, `When` se guarda un nuevo nombre, `Then` la UI y la API quedan sincronizadas.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/spec`

## 7. Design decisions

- **Estado**: `approved`
- **Decisiones**:
  - invalidar el store tras PATCH — evita drift visual.
  - mantener el endpoint existente — evita abrir otro contrato API.
- **Impacto técnico**: dashboard, route PATCH y schema compartido.
- **Testing strategy**: browser validation + smoke persistente.
- **Open questions**: ninguna.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/design`

## 8. Alcance y superficies afectadas

### Ruta / pantalla / entrypoint

- Frontend: `/dashboard`
- API / backend: `PATCH /api/projects/:projectId`
- Infra / runtime: no aplica

### Componentes afectados

| Área | Componente | Impacto |
| --- | --- | --- |
| Frontend | `DashboardTaskList`, modal de edición de proyecto | cambio |
| Backend | handler de actualización de proyecto | cambio |
| Shared | schema de validación de nombre | cambio |

## 9. Criterios de aceptación

- [x] El usuario puede abrir el modal y editar el nombre.
- [x] El nuevo nombre se persiste en backend.
- [x] El dashboard refleja el cambio sin recargar manualmente.
- [x] La evidencia de validación queda registrada en esta task.

## 10. Desglose de implementación / progreso SDD

- **Estado del breakdown**: `complete`
- **Resumen**: implementación + verify sobre una sola unidad browser-facing.
- **Progreso actual**: `3/3 tareas completadas`
- **Último apply summary**: `Modal, PATCH y refresh implementados; evidencia registrada.`
- **Modo apply recomendado**: `serial-batches`
- **Batches seriales**: `A -> B`; primero UI/form, luego integración PATCH/refresh.
- **Candidatos paralelos**: `none`
- **No paralelizar**: `A y B comparten estado UI/store del dashboard.`
- **Referencia Engram**:
  - Tasks: `sdd/20260417-a1b2c3-rename-project/tasks`
  - Apply progress: `sdd/20260417-a1b2c3-rename-project/apply-progress`

### Apply work units

| Unit | Estado | Objetivo | Archivos owned | Depende de | Conflict group | Modo | Engram topic |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | done | Ajustar formulario y validación del modal | `frontend/src/views/dashboard/...` | none | frontend-dashboard | serial | `sdd/20260417-a1b2c3-rename-project/apply-A` |
| B | done | Conectar PATCH de renombrado y refresco de estado | `frontend/src/views/dashboard/...`, `backend/src/routes/projects.ts`, `shared/src/projects/schema.ts` | A | rename-contract | serial | `sdd/20260417-a1b2c3-rename-project/apply-B` |
| C | done | Actualizar documentación del flujo | `docs/02-features/frontend.md` | B | docs | serial | `sdd/20260417-a1b2c3-rename-project/apply-C` |

### Tareas de verificación planificadas

| ID | Estado | Tarea | Responsable |
| --- | --- | --- | --- |
| V1 | done | Revisar código del flujo implementado | sdd-verify-code |
| V2 | done | Verificar tests unitarios relacionados | sdd-verify-units |
| V3 | done | Verificar suite Playwright persistente | sdd-verify-pwauto |
| V4 | done | Validar flujo browser y UX | sdd-verify-pwcli |

## 11. Archivos previstos / modificados

| Archivo | Tipo | Motivo |
| --- | --- | --- |
| `frontend/src/views/dashboard/...` | modificar | agregar acción de renombrado |
| `backend/src/routes/projects.ts` | modificar | persistir renombrado |
| `shared/src/projects/schema.ts` | modificar | validar payload |
| `docs/02-features/frontend.md` | modificar | documentar flujo actualizado |

## 12. Impacto backend

- **Afecta backend**: sí
- **Servicios / endpoints**: `PATCH /api/projects/:projectId`
- **Cambios de contrato**: no, se extiende contrato existente
- **DB / migraciones**: no

## 13. Validación requerida

### Browser / Playwright CLI

- **Requerida**: `required`
- **Motivo**: el cambio afecta flujo visible del dashboard
- **Ruta validada**: `/dashboard -> abrir modal -> renombrar -> confirmar`

### Docker / runtime

- **Requerida**: `required`
- **Stack esperado**: `compose.yml`
- **Objetivo**: confirmar que frontend y API levantan correctamente con el cambio

## 14. Resultado de ejecución

### Playwright CLI

| Campo | Valor |
| --- | --- |
| Resultado | `passed` |
| Flujo validado | login -> dashboard -> renombrar proyecto -> ver nuevo nombre |
| Evidencia | `.playwright-cli/page-2026-04-17T11-20-00.yml` |
| Observaciones | sin errores JS; refresco visual correcto |

### Tests persistentes / verificación SDD

| Campo | Valor |
| --- | --- |
| Resultado | `passed` |
| Suite / comando | `bun run test:e2e:smoke-ui` |
| Evidencia | `playwright/tests/dashboard/rename-project.spec.ts` |

### Docker / runtime

| Campo | Valor |
| --- | --- |
| Resultado | `passed` |
| Comando | `docker compose -f compose.yml up -d --build` |
| Observaciones | frontend y api healthy; sin restart loops |

## 15. Resumen de verificación SDD

### Estado consolidado

- **Estado**: `passed`
- **Lanes requeridos**: `code, units, pwauto, pwcli`
- **Lanes ejecutados**: `code, units, pwauto, pwcli`
- **Cobertura contra specs**: rename end-to-end validado.
- **Evidencia principal**: `code review + Unit + PW-AUTO + PW-CLI`.
- **Desvíos detectados**: ninguno.
- **Referencia Engram consolidada**: `sdd/20260417-a1b2c3-rename-project/verify-report`

### Code review

- **Estado**: `passed`
- **Agente**: `sdd-verify-code`
- **Evidencia**: implementación alineada con diseño, sin duplicación ni contratos rotos.
- **Hallazgos**: ninguno.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/verify-code`

### Unit tests

- **Estado**: `passed`
- **Agente**: `sdd-verify-units`
- **Comando**: `bun test`
- **Evidencia**: unit tests relacionados pasaron.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/verify-units`

### PW-AUTO

- **Estado**: `passed`
- **Agente**: `sdd-verify-pwauto`
- **Comando**: `bun run test:e2e:smoke-ui`
- **Evidencia**: `playwright/tests/dashboard/rename-project.spec.ts`.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/verify-pwauto`

### PW-CLI

- **Estado**: `passed`
- **Agente**: `sdd-verify-pwcli`
- **Flujo validado**: login -> dashboard -> renombrar proyecto -> ver nuevo nombre
- **Evidencia**: `.playwright-cli/page-2026-04-17T11-20-00.yml`
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/verify-pwcli`

## 16. Archive / cierre SDD

- **Estado**: `pending`
- **Cierre del cambio**: pendiente de merge/archivo formal.
- **Lineage**: `explore -> proposal -> spec -> design -> tasks -> apply -> verify`
- **Pendientes remanentes**: archive final.
- **Referencia Engram**: `sdd/20260417-a1b2c3-rename-project/archive`

## 17. Problemas encontrados

| Severidad | Problema | Resolución / siguiente paso |
| --- | --- | --- |
| warning | el modal no refrescaba el card activo | se invalidó el store tras PATCH |

## 18. Git y PR

- **Rama actual**: `feature/20260417-a1b2c3-rename-project`
- **PR URL**: `https://github.com/jetezz/colpruebas/pull/321`
- **Base target**: `develop`
- **Estado de PR**: `open`

## 19. Documentación actualizada

| Documento | Estado | Detalle |
| --- | --- | --- |
| `docs/02-features/frontend.md` | `updated` | se agregó el flujo de renombrado en dashboard |

## 20. Resumen de ejecución

- **Estado actual**: `testing`
- **Siguiente paso esperado**: mover a `documenting` o cerrar si no quedan cambios documentales
- **Bloqueadores activos**: ninguno
- **Resumen corto**: implementación terminada, browser validation y suite smoke pasaron, docker en prod levantó bien, PR abierto contra develop.

## 21. Historial de cambios de la task

| Fecha | Actor | Cambio |
| --- | --- | --- |
| `2026-04-17T09:00:00Z` | orchestrator | task creada |
| `2026-04-17T10:25:00Z` | sdd-apply | implementación y archivos actualizados |
| `2026-04-17T11:40:00Z` | verification lanes | code review, unit tests, PW-AUTO y PW-CLI registrados |
