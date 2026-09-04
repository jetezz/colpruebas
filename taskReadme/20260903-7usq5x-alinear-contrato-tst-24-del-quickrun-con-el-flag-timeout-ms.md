---
title: "Alinear contrato TST-24 del quickrun con el flag --timeout-ms"
task_id: "20260903-7usq5x"
task_slug: "alinear-contrato-tst-24-del-quickrun-con-el-flag-timeout-ms"
sdd_change_id: ""
status: "pending"
source_branch: "develop"
target_branch: "develop"
branch_name: "feature/20260903-7usq5x-alinear-contrato-tst-24-del-quickrun-con-el-flag-timeout-ms"
app_map: "docs/app-map/views/project-workspace/features/test-tab.md"
task_type: "Bugfix"
pw_enabled: false
browser_validation: "optional"
pr_url: ""
created_at: "2026-09-03T17:13:13.803Z"
updated_at: "2026-09-03T17:13:13.803Z"
---
# Alinear contrato TST-24 del quickrun con el flag --timeout-ms

## 1. Objetivo

Contrato unico reconciliado: el comando canonico generado y el pin del test coinciden (con o sin --timeout-ms segun decida el spec), y los 3 tests de TST-24/TST-06 pasan sin debilitar la asercion de secret-free.

## 2. Estado actual / problema actual

El test frontend/__tests__/services/test-runs-quickrun-command.test.ts (TST-24/TST-06) pinnea el comando canonico sin --timeout-ms, pero buildProjectctlTestCommand en frontend/src/views/project/services/test-runs.service.ts:542 emite --timeout-ms=900000 desde el commit a4520b03 (fix(pwauto): complete project workspace inventory). 3 tests rojos: PW-AUTO command, All command y secret-free.

## 3. Resultado esperado

Contrato unico reconciliado: el comando canonico generado y el pin del test coinciden (con o sin --timeout-ms segun decida el spec), y los 3 tests de TST-24/TST-06 pasan sin debilitar la asercion de secret-free.

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
| TST-24 | PW-AUTO quick-run lleva BASE_URL=<resolved> automático | APP-MAP test-tab | `mantener` | — |
| TST-06 | Sistema de testeo rápido con botones que invocan executeInTerminal (sub-sección 5.2) | APP-MAP test-tab | `mantener` | — |


## 9. Alcance / fuera de alcance

Pendiente.

## 10. Desglose de implementación / progreso SDD

Pendiente.

## 11. Ubicación app-map / entrada afectada

- Ubicación principal: `docs/app-map/views/project-workspace/features/test-tab.md`

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
