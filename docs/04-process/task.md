# Flujo de tareas — Guía operativa (repo colpruebas)

> Guía de **cómo operar** el flujo de tareas del repo. Los **valores normativos**
> (fases, estados, lanes, gates, delivery, active sources, aliases retirados) NO se duplican
> aquí: viven en el bloque delimitado `task-flow-binding` (`TaskFlowBindingV1`, v9.0.0) dentro
> de `.agents/skills/projectctl-requirements/references/tareas.md`, que es la **única SoT
> normativa** del flujo (anti-drift). Este documento solo enlaza y explica cómo consumirlo.

## 1. Dónde está la SoT normativa

El contrato ejecutable del flujo de tareas se resuelve desde el bloque `task-flow-binding`
v9.0.0 en `.agents/skills/projectctl-requirements/references/tareas.md` (identificado por los
marcadores `<!-- task-flow-binding:start -->` / `<!-- task-flow-binding:end -->` y un único
fenced `json`). El locator `.agents/sdd-workflow.json` pinnea ese binding y sus proyecciones.

> **Anti-drift**: cualquier valor de fase/estado/lane/gate/delivery de este repo se lee del
> bloque del binding, nunca de esta guía ni de otras superficies. Las representaciones
> informativas (UI, docs, view-models) solo referencian el bloque; no publican catálogos
> paralelos.

## 2. Índice de coordinación de una tarea

Cada tarea tiene un índice de coordinación en `taskReadme/<task_id>-<task_slug>.md` con los
artifacts de cada fase en `taskReadme/<task_id>-<task_slug>/<artifact>.md` (spec, design,
tasks, apply-*, verify-*, archive). El índice es la puerta de entrada para saber la fase/estado
actual y el artefacto de la unidad en curso.

## 3. Cómo operar en una tarea

1. **Leer el `taskReadme` activo** de la tarea (índice + fase en curso + `task skill snapshot`).
2. **Cargar las skills del registro** (`.atl/skill-registry.md` y
   `docs/00-context/agents_skills.md`) según la fase/lane asignada.
3. **Comprobar el binding** en `.agents/skills/projectctl-requirements/references/tareas.md`
   para fases, estados permitidos (`status.writable`), lanes, gates, delivery y active sources.
4. **Respetar el contrato de entrega**: rama feature + PR único, estados solo del binding,
   no commitar `.env`/`.env.dev`/`.runtime/`.

## 4. Fases y estados

El repo usa el ciclo de fases del binding v9.0.0 (propuesta → implementación → verificación →
documentación, más los controles de delivery). Los nombres exactos de fases, sus estados
válidos y las transiciones se leen **solo del bloque `task-flow-binding`**. No se usa ningún
alias retirado (`branching`, `pushing`, `ready_for_branch`, `verified`, etc.) como estado
operativo.

## 5. Lanes de ejecución

La selección de lane (explore, propose, spec, design, tasks, apply, verify) se resuelve según
la fase activa y la naturaleza del cambio. Las lanes y su owner-phase se declaran en el bloque
del binding; las workflow skills `sdd-*` son lanes, no skills del registro delegator.

## 6. Cierre y entrega

La entrega (commit → push → PR) es mecánica del coordinador; los gates y la evidencia de
cierre (branch/PR, revisiones de verificación y documentación, criterios cubiertos, work units
terminales) se rigen por el binding y se consolidan en el índice.

## Referencias

- Binding canónico (única SoT): `.agents/skills/projectctl-requirements/references/tareas.md`.
- Estándar integrado (docs/testing/runtime/operación): `.agents/skills/projectctl-requirements/references/standard.md`.
- Operación de agentes: `AGENTS.md`.
- Descripción y entry points: `README.md`.
