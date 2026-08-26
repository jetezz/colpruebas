# colpruebas

Proyecto gestionado compatible con `/projectctl` (`colpruebas`). Repositorio de prueba/managed
del estándar de compatibilidad: entornos prod y dev levantables, documentación funcional
consumida por UI, sistema de testing canónico y flujo de tareas binding v9.0.0.

## Descripción

`colpruebas` es un proyecto que ejecuta la **stack de compatibilidad `/projectctl`**: una
landing (`/`), un workspace de proyecto gestionado y la vista `/projectctl` que expone las
cinco tabs (`cli | doc | test | entorno | tareas`), respaldada por una API Express + Bun y un
entorno de sandbox gestionado. La operación del repo sigue el estándar canónico
`projectctl-requirements`.

## Entry points

| Recurso | Ruta / comando | Qué es |
| --- | --- | --- |
| Runtime gestionado | `projectctl` (`status`, `start`, `stop`, `restart`, `rebuild`, `env validate`, `doctor`, `logs`, `tunnel *`, `test *`) | Control de entornos prod/dev (sandbox no expone docker). |
| UI `/projectctl` | `docs/app-map/views/projectctl/index.md` | Documentación funcional de la vista (5 secciones MUST). |
| Docs funcionales | `docs/app-map/**` + `docs/app-map/navigation.yaml` | Única SoT documental consumida por UI. |
| Registro de skills | `.atl/skill-registry.md` + `docs/00-context/agents_skills.md` | Skills instaladas en el repo. |
| Guía del flujo de tareas | `docs/04-process/task.md` | Cómo operar tareas (cita el binding v9.0.0). |
| Coordinación de tarea | `taskReadme/<task_id>-<task_slug>.md` | Índice de coordinación de cada tarea. |

## Cómo correr los tests

El sistema de testing es canónico (Bun):

```bash
bun run test:check          # gate de cobertura contractual
bun run scripts/test-runner.ts run --method=unit --target=<view>[:<feature>] [--persist]
bun test <path/to/test>     # tests puntuales
```

- Todo archivo de test declara `// @ac <ID>` en las primeras 10 líneas (el runner rechaza los
  que no lo lleven).
- El runner mapea 1:1 con `projectctl test *`.
- La persistencia atómica vive en `.runtime/test-results/<projectId>/<run-id>/`.
- La cobertura se escribe en `criteria[].coverage` de los bundles `docs/app-map/**`.

## Entornos

- Overlays canónicos: `compose.yml` (prod) y `compose.dev.yml` (dev), con el servicio `frontend`
  en `build.target: prod|dev` y puerto mapeado `"${FRONTEND_PORT}:4321"`.
- `.env` / `.env.dev` son locales (excluidos del commit); la referencia commitada es
  `.env.example`.

## Recursos normativos

- Standard de compatibilidad `/projectctl`: `.agents/skills/projectctl-requirements/`.
- Flujo de tareas (binding): `.agents/skills/projectctl-requirements/references/tareas.md`
  (bloque `task-flow-binding` v9.0.0) — única SoT normativa de fases/estados/lanes/gates.
- Reglas de operación de agentes: `AGENTS.md`.
