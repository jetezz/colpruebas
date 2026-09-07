---
title: "Reconciliar pins de tests del catalogo projectctl con el registry (90 a 92)"
task_id: "20260903-cach9j"
task_slug: "reconciliar-pins-de-tests-del-catalogo-projectctl-con-el-reg"
sdd_change_id: ""
status: "pending"
source_branch: "develop"
target_branch: "develop"
branch_name: "feature/20260903-cach9j-reconciliar-pins-de-tests-del-catalogo-projectctl-con-el-reg"
app_map: "docs/app-map/views/projectctl/features/cli.md"
task_type: "Bugfix"
pw_enabled: false
browser_validation: "optional"
pr_url: ""
created_at: "2026-09-03T17:13:00.109Z"
updated_at: "2026-09-03T17:13:00.109Z"
---
# Reconciliar pins de tests del catalogo projectctl con el registry (90 a 92)

## 1. Objetivo

Todos los tests de catalogo en verde: pins actualizados a suma=92 y conteos por familia alineados al registry backend (fuente unica), drift guards pasando sin debilitar aserciones (los conteos siguen pinneados, no relajados a mayor-o-igual).

## 2. Estado actual / problema actual

Los drift guards del catalogo estan en rojo: projectctl-commands.helpers.test.ts (PCT-05/06) y projectctl-tabs.test.ts (PCT-79/80/81) pinnean suma=90 y familia docs=3, pero data/projectctl-commands.ts y sandbox/src/lib/projectctl-registry.ts ya tienen 92 comandos y docs=5 desde el commit 96ef6321 (docs lint/format cross-project CLI commands). El bundle docs/app-map/views/projectctl/features/cli.md ya esta sincronizado a 92 (last_bundle_sync 2026-09-03), por lo que los pins de tests son los stale. Fallo observado: Expected length: 90 / Received length: 92 (7 tests rojos en bun test frontend/__tests__/).

## 3. Resultado esperado

Todos los tests de catalogo en verde: pins actualizados a suma=92 y conteos por familia alineados al registry backend (fuente unica), drift guards pasando sin debilitar aserciones (los conteos siguen pinneados, no relajados a mayor-o-igual).

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
| PCT-80 | El panel CLI reusa 1:1 frontend/src/views/projectctl/data/projectctl-commands.ts como única fuente de metadata; cero duplicación | APP-MAP cli | `mantener` | — |
| PCT-81 | Cada familia MUST exponer <span data-testid="projectctl-cli-family-summary-{family}">{N} comandos</span> con conteos pinneados al registry backend | APP-MAP cli | `mantener` | — |
| PCT-05 | Comandos agrupados visualmente por family | APP-MAP cli | `mantener` | — |
| PCT-06 | Filtro <input> solo por name (case-insensitive, substring) | APP-MAP cli | `mantener` | — |


## 9. Alcance / fuera de alcance

Pendiente.

## 10. Desglose de implementación / progreso SDD

Pendiente.

## 11. Ubicación app-map / entrada afectada

- Ubicación principal: `docs/app-map/views/projectctl/features/cli.md`

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
