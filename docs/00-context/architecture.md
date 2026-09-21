# Arquitectura del repo colpruebas

> Vista de **contexto** de la arquitectura del repo `colpruebas`. Describe los componentes
> reales del repositorio y cómo se relacionan. No sustituye a la documentación funcional
> (`docs/app-map/**`), a las políticas de frontend/backend ni al estándar de compatibilidad
> `/projectctl`; los referencias cuando corresponde.

## 1. Panorama

`colpruebas` es un proyecto gestionado con una landing servida por Astro (modo `server`/SSR),
una API Express + Bun, un runtime gestionado vía overlays Compose y un sistema de documentación
funcional y de testing canónico. La operación sigue el estándar `projectctl-requirements`.

## 2. Frontend (Astro)

- Ruta: `frontend/`.
- **Stack**: Astro `^4` + adapter `@astrojs/node` (output `server`, `mode: standalone`).
- **Servidor**: puerto `4321` (interno), `host: true`, `allowedHosts` para
  `colpruebas.online` / `test.colpruebas.online` / `localhost` / `127.0.0.1`.
- **Páginas**: `frontend/src/pages/index.astro` — landing SSR del proyecto.
- **Proyección disponible**: `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` es un
  artefacto de tareas; no implica que este checkout contenga la UI completa `/projectctl`.
- **Dockerfiles**: `frontend/Dockerfile.prod` (stage `AS prod`) y `frontend/Dockerfile.dev`
  (stage `AS dev`, HMR/watch) — seleccionados por `build.target` de los overlays.

## 3. Backend (API Express + Bun)

- Ruta: `backend/` (servicio `api` en los overlays).
- **Stack**: Express + Bun (`express`, `cors`, `gray-matter`).
- **Endpoints**: informativos `(/)`, `(/health)`, `(/api/status)` + endpoints de coverage e
  inventario de la tab test (`/api/projects/[id]/docs/app-map/**`, `/test-inventory`,
  `/test-pwcli/run`).
- **Primitivos reutilizados por el runner de tests**: `backend/src/ac-header.ts` (regex de
  header `@ac`), `backend/src/coverage-writer.ts` (`patchBundleCoverage`), 
  `backend/src/test-inventory.ts` (`buildInventory`).
- **Puerto**: `3000` interno (mapeado por `API_PORT`).

## 4. Documentación funcional (`docs/app-map`)

- `docs/app-map/**` + `docs/app-map/navigation.yaml` es la **única superficie funcional**
  consumida por UI (SoT documental).
- Los bundles disponibles en este checkout son los de `docs/app-map/views/home/`; cada bundle
  mantiene sus criterios inline y su cobertura en `criteria[].coverage`.
- Documentos de contexto/proceso: `docs/00-context/**` (incluidos este archivo,
  `entornos.md`, `agents_skills.md`) y `docs/04-process/task.md`.

## 5. Sistema de testing (canónico, Bun)

- Runner unificado: `scripts/test-runner.ts` (importa los primitivos existentes de `backend/src`).
- Gate de cobertura contractual: `bun run test:check`.
- Persistencia atómica: `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/` con
  `{junit.xml,results.json,summary.json}`.
- Todo archivo de test declara `// @ac <ID>` en las primeras 10 líneas.
- Mapping 1:1 con `projectctl test *`.

## 6. Runtime / entornos

- Overlays canónicos `compose/compose.yml` (base), `compose/compose.prod.yml` (prod) y
  `compose/compose.dev.yml` (dev), documentados en `docs/00-context/entornos.md`.
- Contrato edge `mis-proyectos-edge` con alias por entorno; runtime exclusivo vía `projectctl`.
- Detalle: `docs/00-context/entornos.md` y `docs/02-features/tunnel.md`.

## 7. Coordinación de tareas

- Índice de coordinación por tarea: `taskReadme/<task_id>-<task_slug>.md` con artifacts por
  fase en `taskReadme/<task_id>-<task_slug>/<artifact>.md`.
- SoT normativa del flujo: bloque `task-flow-binding` v9.0.0 en
  `.agents/skills/projectctl-requirements/references/tareas.md`.

## 8. Referencias

- Estándar de compatibilidad `/projectctl`: `.agents/skills/projectctl-requirements/`.
- Operación de agentes: `AGENTS.md`; entry points: `README.md`.
