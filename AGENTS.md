# AGENTS.md — Directrices de operación de agentes (repo colpruebas)

Este archivo es la **fuente de revisión de agentes** del repo `colpruebas`: cómo operar un
agente (humano o IA) que trabaja sobre este repositorio. Es coherente con
`docs/00-context/agents_skills.md` (registro de skills) y con la policy documental de
`projectctl-requirements`.

> **SoT normativa del flujo de tareas**: el flujo SDD de este repo NO se define aquí. Vive en el
> bloque delimitado `task-flow-binding` (`TaskFlowBindingV1`, v9.0.0) dentro de
> `.agents/skills/projectctl-requirements/references/tareas.md`. Cualquier valor de
> fase/estado/lane/gate se lee de ese bloque, nunca de este archivo (anti-drift).

## 1. Propósito del repo

`colpruebas` es un proyecto gestionado compatible con `/projectctl`. La operación esperada
quedó remediada para cumplir el estándar de compatibilidad: entornos prod/dev levantables,
documentación funcional en `docs/app-map/**`, sistema de testing canónico y flujo de tareas
binding v9.0.0.

## 2. Convenciones

- **Documentación funcional (SoT)**: `docs/app-map/**` + `docs/app-map/navigation.yaml` es la
  única superficie funcional consumida por UI. La cobertura de criterios vive en
  `criteria[].coverage` de los bundles, nunca en archivos paralelos.
- **Skills (SoT del registro)**: `.atl/skill-registry.md` + `docs/00-context/agents_skills.md`.
- **Testing**: Bun (`bun test`, `bun run test:check`); un runner unificado y el gate de
  cobertura contractual son los mecanismos estándar. Todo archivo de test declara
  `// @ac <ID>` en las primeras 10 líneas.
- **Estados de task**: solo los del `status.writable` del binding v9.0.0. No reintroducir
  aliases retirados (`branching`, `pushing`, `ready_for_branch`, `verified`, etc.).

## 3. Comandos permitidos

- **Tests**: `bun run test:check` (gate de cobertura), `bun test` sobre archivos de test,
  `bun run scripts/test-runner.ts ...` (runner unificado, mapeo 1:1 con `projectctl test *`).
- **Runtime gestionado**: usar `projectctl` (`status`, `env validate`, `doctor`, `start`,
  `stop`, `restart`, `rebuild`, `promote`, `deploy`, `logs`, `tunnel *`, `test *`).
- El **sandbox NO expone docker** CLI ni `docker.sock`; el control de runtime es exclusivo vía
  `projectctl` (ver skill `sandbox-runtime-policy`).
- **No** usar `npm install` / `npx` como primarios: el runtime de scripts del repo es Bun.

## 4. Contrato de entrega

- Un cambio se entrega como **rama feature** desde la base vigente y **PR único**.
- Los archivos env (`.env`, `.env.dev`) y artefactos runtime (`.runtime/`, `frontend/test-results/`)
  están **excluidos del commit**; la firma commitada de configuración ambiente es `.env.example`.
- No commitar secretos ni tokens. No restaurar superficies legacy prohibidas
  (`docs/01-product/quality/**`).

## 5. Flujo SDD

El flujo completo (fases, estados, lanes, gates, delivery, active sources) se resuelve desde el
binding `task-flow-binding` v9.0.0. Guía operativa: `docs/04-process/task.md`. Índice de
coordinación de cada tarea: `taskReadme/<task_id>-<task_slug>.md` (detalle full en
`taskReadme/<task_id>-<task_slug>/<artifact>.md`).

Para operar como agente en una tarea: consultar el `taskReadme` activo, cargar las skills del
registro, leer el artifact de la fase en curso y respetar el contrato del binding.
