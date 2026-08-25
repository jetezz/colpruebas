---
title: "Remediación compatibilidad /projectctl: entornos, docs, tests"
task_id: "20260825-bhbr8k"
task_slug: "remediacion-compatibilidad-projectctl-entornos-docs-tests"
sdd_change_id: ""
status: "pending"
source_branch: "develop"
target_branch: "develop"
branch_name: "feature/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests"
app_map: "docs/app-map/views/projectctl/index.md"
task_type: "Runtime/config"
pw_enabled: false
browser_validation: "optional"
pr_url: ""
created_at: "2026-08-25T07:55:05.107Z"
updated_at: "2026-08-25T07:55:05.107Z"
---
# Remediación compatibilidad /projectctl: entornos, docs, tests

## 1. Objetivo

1) projectctl env validate reporta ok (existen .env y .env.dev). 2) projectctl status levanta prod y dev con overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev y FRONTEND_PORT canonico. 3) bun run test:check pasa con runner unificado scripts/test-runner.ts, playwright/TEST_PLAN.md y persistencia atomica completa. 4) El bundle views/projectctl existe con las 5 secciones MUST y navigation.yaml lo registra; la superficie quality/ legacy eliminada. 5) .agents/sdd-workflow.json pinnea binding v9 con projections presentes. 6) projectctl doctor no reporta drifts criticos.

## 2. Estado actual / problema actual

El proyecto colpruebas no cumple el estándar de compatibilidad /projectctl (projectctl-requirements). Incumplimientos: (1) ENTORNO: .env y .env.dev ausentes (env validate falla), overlays docker-compose.yml/.docker-compose.dev.yml no canonicos vs compose.yml/compose.dev.yml, servicios frontend-prod/api-prod/frontend-dev/api-dev vs frontend/api, FRONTEND_PORT 4323/4324 vs canonico 4321, faltan docs/00-context y docs/02-features (entornos.md, architecture.md, tunnel.md), skill sandbox-runtime-policy sin instalar. (2) DOCS: falta bundle views/projectctl completo (5 secciones MUST, criteria[], navigation.yaml), superficies legacy docs/01-product/quality-plan.md y quality-status.md presentes cuando deben eliminarse per TST-03/TST-12. (3) TEST: falta scripts/test-runner.ts, gate bun run test:check inexistente, falta playwright/TEST_PLAN.md, layout specs no canonico, persistencia .runtime/test-results sin junit.xml ni carpeta unit, faltan projectctl-*-bundle.test.ts y sot-coherence.test.ts. (4) TAREAS: locator .agents/sdd-workflow.json stale v8.0.0 vs binding v9.0.0, projections tareas-tab.view-model.ts y task-flow.generated.ts inexistentes, estados retirados (branching, pushing, ready_for_branch, verified) en taskReadme. (5) CROSS: faltan AGENTS.md, README.md, docs/00-context/agents_skills.md, docs/04-process/task.md, .atl/skill-registry.md, symlink playwright.config.ts roto. Objetivo: levantar entornos prod y dev via projectctl, que la documentacion se lea correctamente y que todos los tests pasen con projectctl.

## 3. Resultado esperado

1) projectctl env validate reporta ok (existen .env y .env.dev). 2) projectctl status levanta prod y dev con overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev y FRONTEND_PORT canonico. 3) bun run test:check pasa con runner unificado scripts/test-runner.ts, playwright/TEST_PLAN.md y persistencia atomica completa. 4) El bundle views/projectctl existe con las 5 secciones MUST y navigation.yaml lo registra; la superficie quality/ legacy eliminada. 5) .agents/sdd-workflow.json pinnea binding v9 con projections presentes. 6) projectctl doctor no reporta drifts criticos.

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
| AC-001 | Entornos prod y dev levantables via projectctl: .env y .env.dev presentes, overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev, FRONTEND_PORT canonico. | Añadido en tarea | `añadir` | Entornos prod y dev levantables via projectctl: .env y .env.dev presentes, overlays compose.yml/compose.dev.yml canonicos, servicio frontend target prod/dev, FRONTEND_PORT canonico. |
| AC-002 | Bundle views/projectctl con 5 secciones MUST y navigation.yaml lo registra; superficie legacy docs/01-product/quality/* eliminada. | Añadido en tarea | `añadir` | Bundle views/projectctl con 5 secciones MUST y navigation.yaml lo registra; superficie legacy docs/01-product/quality/* eliminada. |
| AC-003 | Sistema de testing canónico: scripts/test-runner.ts, gate bun run test:check, playwright/TEST_PLAN.md, persistencia atómica con junit.xml, specs bajo layout canónico. | Añadido en tarea | `añadir` | Sistema de testing canónico: scripts/test-runner.ts, gate bun run test:check, playwright/TEST_PLAN.md, persistencia atómica con junit.xml, specs bajo layout canónico. |
| AC-004 | Locator .agents/sdd-workflow.json pinnea binding v9.0.0 con projections presentes; estados retirados (branching, pushing, ready_for_branch, verified) fuera de taskReadme. | Añadido en tarea | `añadir` | Locator .agents/sdd-workflow.json pinnea binding v9.0.0 con projections presentes; estados retirados (branching, pushing, ready_for_branch, verified) fuera de taskReadme. |
| AC-005 | Prerrequisitos cross: AGENTS.md, README.md, docs/00-context/agents_skills.md, docs/04-process/task.md, .atl/skill-registry.md, symlink playwright.config.ts válido. | Añadido en tarea | `añadir` | Prerrequisitos cross: AGENTS.md, README.md, docs/00-context/agents_skills.md, docs/04-process/task.md, .atl/skill-registry.md, symlink playwright.config.ts válido. |


## 9. Alcance / fuera de alcance

Pendiente.

## 10. Desglose de implementación / progreso SDD

Pendiente.

## 11. Ubicación app-map / entrada afectada

- Ubicación principal: `docs/app-map/views/projectctl/index.md`

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
  "skills": []
}
```
