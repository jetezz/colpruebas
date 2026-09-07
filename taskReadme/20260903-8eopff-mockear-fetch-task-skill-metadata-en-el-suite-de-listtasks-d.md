---
title: "Mockear fetch task-skill-metadata en el suite de listTasks del API"
task_id: "20260903-8eopff"
task_slug: "mockear-fetch-task-skill-metadata-en-el-suite-de-listtasks-d"
sdd_change_id: ""
status: "pending"
source_branch: "develop"
target_branch: "develop"
branch_name: "feature/20260903-8eopff-mockear-fetch-task-skill-metadata-en-el-suite-de-listtasks-d"
app_map: "docs/app-map/views/project-workspace/features/tasks-tab.md"
task_type: "Bugfix"
pw_enabled: false
browser_validation: "optional"
pr_url: ""
created_at: "2026-09-03T17:13:32.344Z"
updated_at: "2026-09-03T17:13:32.344Z"
---
# Mockear fetch task-skill-metadata en el suite de listTasks del API

## 1. Objetivo

bun test ./src/routes/__tests__/tasks.test.ts en verde: fetch de skill metadata mockeado y expectativas actualizadas al contrato actual de la respuesta, sin debilitar REQ-308/REQ-309 (overlay de tracking row y fallback sin row siguen cubiertos).

## 2. Estado actual / problema actual

api/src/routes/__tests__/tasks.test.ts falla 7 tests standalone (REQ-308 overlay + REQ-309 fallback + campos no posicionales): el fetch guard del entorno de test rechaza con 502 la llamada nueva a /opencode-files/task-skill-metadata que listTasks ahora hace contra el sandbox (integracion skills-por-tarea, merge c8d76f5a). La respuesta ademas incorpora campos nuevos que las expectativas TASKREADME_TASKS no modelan.

## 3. Resultado esperado

bun test ./src/routes/__tests__/tasks.test.ts en verde: fetch de skill metadata mockeado y expectativas actualizadas al contrato actual de la respuesta, sin debilitar REQ-308/REQ-309 (overlay de tracking row y fallback sin row siguen cubiertos).

## 4. Resumen de exploración / Fase 1

### Resultado de Fase 1

Pendiente de ejecución.

## 5. Propuesta SDD

Pendiente de Fase 1.

## 6. Specs / requisitos delta

Pendiente de Fase 2.

## 7. Diseño técnico

Pendiente de Fase 2.

## 8. Criterios de aceptación

| Código | Criterio | Fuente | Estado propuesto | Texto actual / propuesto |
| --- | --- | --- | --- | --- |
| PRJ-07 | Listado de tareas del proyecto | APP-MAP tasks-tab | `mantener` | — |


## 9. Alcance / fuera de alcance

Pendiente.

## 10. Desglose de implementación / progreso SDD

Pendiente.

## 11. Ubicación app-map / entrada afectada

- Ubicación principal: `docs/app-map/views/project-workspace/features/tasks-tab.md`

## 12. Componentes afectados

Pendiente.

## 13. Impacto backend

Pendiente.

## 14. Selección SDD / fases

Pendiente.

## 15. Resumen de verificación SDD

Pendiente.

## 16. Adjuntos / referencias

No hay adjuntos iniciales.

## 17. Documentación impactada

Pendiente.

## 18. Problemas encontrados / riesgos

Ninguno aún.

## 19. Git / PR

Pendiente.

## 20. Estado actual y siguiente paso

Estado: `planning` — Fase 1 pendiente.
Siguiente paso: Ejecutar Fase 1.

## Task skill snapshot

Schema: `task-skills/v1`

```json
{
  "skills": [
    {
      "id": "coordinador",
      "label": "coordinador"
    }
  ]
}
```
