---
title: "Reparar tooling del repo: skills registry (engram-policy) y typecheck scripts"
task_id: "20260903-64osjc"
task_slug: "reparar-tooling-del-repo-skills-registry-engram-policy-y-typ"
sdd_change_id: ""
status: "pending"
source_branch: "develop"
target_branch: "develop"
branch_name: "feature/20260903-64osjc-reparar-tooling-del-repo-skills-registry-engram-policy-y-typ"
app_map: "docs/app-map/views/projectctl/features/doc.md"
task_type: "Runtime/config"
pw_enabled: false
browser_validation: "optional"
pr_url: ""
created_at: "2026-09-03T17:13:43.970Z"
updated_at: "2026-09-03T17:13:43.970Z"
---
# Reparar tooling del repo: skills registry (engram-policy) y typecheck scripts

## 1. Objetivo

bun run skills:registry genera el registry (40/40 skills) y bun run typecheck:scripts pasa con 0 errores, sin cambiar el comportamiento de validacion para las 38 skills que hoy pasan.

## 2. Estado actual / problema actual

Dos fallas de tooling detectadas en la auditoria del 2026-09-03: (1) bun run skills:registry aborta porque validate-skills (scripts/validate-skills.ts) rechaza el frontmatter de .agents/skills/engram-policy/SKILL.md que usa sintaxis de lista YAML (categories: - sdd): Unparseable metadata line: - sdd; (2) bun run typecheck:scripts reporta 7 errores TS en scripts/test-runner.ts (spawnError possibly undefined x3), scripts/test-runner.contract.test.ts (x2) y playwright/helpers/assertions.helper.ts (x2).

## 3. Resultado esperado

bun run skills:registry genera el registry (40/40 skills) y bun run typecheck:scripts pasa con 0 errores, sin cambiar el comportamiento de validacion para las 38 skills que hoy pasan.

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

**no_aplica** — Cambio de tooling repo-local (validador de skills + typecheck de scripts) sin criterios observables en docs/app-map: ningún bundle declara criterios para skills:registry ni typecheck:scripts.


## 9. Alcance / fuera de alcance

Pendiente.

## 10. Desglose de implementación / progreso SDD

Pendiente.

## 11. Ubicación app-map / entrada afectada

- Ubicación principal: `docs/app-map/views/projectctl/features/doc.md`

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
