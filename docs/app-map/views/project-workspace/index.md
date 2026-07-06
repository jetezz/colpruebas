---
id: project-workspace
title: Project Workspace
kind: view
summary: >-
  Vista raíz del workspace de proyecto; agrupa las tabs (commands, skills,
  agents, scheduled, environments, preview, test). La tab test (característica
  principal de este bundle) está documentada en
  views/project-workspace/features/test-tab.md.
source_of_truth: app-map
---

# Project Workspace

## Qué cubre

- Punto de entrada `/project/[id]` con layout de tabs.
- Tabla de tabs activas: `commands`, `skills`, `agents`, `scheduled`,
  `environments`, `preview`, `test`. Tabla estable ampliable.

## Sub-vistas (características hijas)

- `project-workspace-test-tab` (`bundle: views/project-workspace/features/test-tab`)
  — sistema de testing funcional con criterios PWT-01..PWT-12.

## Acceso

- URL canónica: `/project/{id}` (con tabs por querystring `?tab=<name>`).
- Deep link a test tab: `/project/{id}?tab=test`.

## Trazabilidad

| ID | Nivel | Cubre |
|---|---|---|
| PWT-01 | obligatorio | Ruta /project/[id] con layout de tabs |
| PWT-02 | obligatorio | Tab test con 5.1/5.2/5.3 |
