# Integrated Standard — Docs, Testing, Runtime and Projectctl Operation

Este archivo absorbe las reglas de valor que antes estaban repartidas en `docs-governance`, `testing-policy`, `ops-runtime-policy` y `projectctl-operator`. Desde `projectctl-requirements` v10, esta skill también publica el binding operativo único de tareas en `references/tareas.md`; esta skill es el estándar integrado para que un proyecto sea compatible con `/projectctl`.

> **Rol de este archivo**: integrado de reglas operativas. Los valores del workflow viven únicamente en el bloque `task-flow-binding` v9.0.0.

## 1. Documentación y app-map

### Fuentes a revisar primero

1. `taskReadme/<task_id>-<task_slug>.md` (índice de coordinación) y su detalle full-artifact en `taskReadme/<task_id>-<task_slug>/<artifact>.md`, según `artifact_store.primary`/`artifact_store.phase_artifacts` del bloque `task-flow-binding`.
2. `docs/04-process/task.md`.
3. `docs/04-process/development.md`.
4. `docs/app-map/navigation.yaml`.
5. `docs/app-map/views/**`.
6. `docs/00-context/agents_skills.md`.
7. `AGENTS.md`.
8. `README.md`.

### Reglas obligatorias

- Buscar primero la fuente normativa más cercana y después contexto secundario.
- Actualizar documentación dentro del scope real del cambio; no crear un workflow paralelo que compita con implementación.
- Reorganizar `/docs` solo ante un problema estructural real.
- Si el cambio toca comportamiento, proceso, arquitectura o instrucciones operativas, revisar los bundles relevantes en `docs/app-map/views/**` antes de cerrar.
- `docs/app-map/**` es la única superficie funcional de documentación + calidad consumida por UI.
- No restaurar superficies legacy `docs/01-product/quality/**`, `quality-plan.md` ni `quality-status.md` como SoT paralela.
- `playwright/TEST_PLAN.md` mapea cobertura Playwright persistente; no reemplaza `docs/app-map/**`.

### Contrato app-map

- Root fijo: `docs/app-map/`.
- Manifest obligatorio: `docs/app-map/navigation.yaml`.
- Bundle exacto por nodo: `${bundle}.md` + `${bundle}.mmd`.
- Cada bundle declara 5 secciones: URL, Tab, Objetivo, Criterios de calidad, Diagrama Mermaid.
- Cada bundle incluye frontmatter `criteria[]` con IDs inline para trazabilidad doc <-> tests <-> producto.
- El ID del criterio es vinculante; no debe existir criterio en código o tests que no esté documentado en `docs/app-map/**`.
- Estados funcionales permitidos: `implemented | partial | missing | not-applicable`.
- Estados de cobertura permitidos: `covered | partial | missing | not-applicable`.
- Métodos permitidos: `Unit | PW-CLI | PW-AUTO | Manual`.

### Diagramas

- Las vistas UI, tabs y subsuperficies documentadas deben tener diagrama Mermaid cuando formen parte de documentación funcional.
- El formato canónico es Mermaid y debe validarse antes de cerrar el cambio.
- Para `/projectctl`, los diagramas funcionales viven junto al bundle (`docs/app-map/views/projectctl/**/*.mmd`).

## 2. Testing, evidencia y coverage

### Decisión de alcance

- `not_required`: task solo toca skills, docs, proceso o cambios no browser-facing.
- `Unit`: lógica interna donde navegador no agrega evidencia relevante.
- `PW-CLI`: comportamiento browser-facing que puede validarse exploratoriamente.
- `PW-AUTO`: regresión persistente requerida o criterio de `docs/app-map/**` lo exige.
- Si cambia runtime root, WebSocket real, proxy, Compose o startup ordering, exige validación de runtime aunque no haya cambio visual.
- Si cambia contrato browser-facing visible, `PW-CLI` es el mínimo.

### Reglas Playwright y Bun

- Usar Bun: `bun test` y `bunx playwright test`; nunca `npm install` ni `npx`.
- Usar `BASE_URL` o URL explícita; no hardcodear dominios legacy.
- Preferir roles, labels y selectores estables; evitar sleeps fijos.
- Si nace o cambia cobertura `PW-AUTO`, actualizar `playwright/TEST_PLAN.md`.
- `playwright/TEST_PLAN.md` solo cambia cuando nace o cambia cobertura Playwright persistente.
- `docs/app-map/views/**` solo cambia cuando cambia contrato o cobertura canónica, no por cada corrida aislada.

### Contrato AC y runner

- Tests Bun y specs Playwright deben declarar `// @ac <ID>` en las primeras 10 líneas.
- Specs Playwright deben añadir `test.info().annotations.push({ type: 'ac', description: '<ID>' })`.
- El runner unificado es `bun run scripts/test-runner.ts run --method=<unit|pwauto|all> --target=<view>[:<feature>] [--persist]`.
- `projectctl test *` mapea 1:1 al runner unificado.
- La persistencia canónica vive en `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/{junit.xml,results.json,summary.json}`.
- El write-back de coverage se realiza vía `patchBundleCoverage` contra `criteria[].coverage`.
- `bun run test:check` es el gate de cobertura contractual.

## 3. Runtime, compose/env y tunnel

### Reglas duras

- Layout canónico: `compose.yml` para prod y `compose.dev.yml` para dev.
- Nombres de servicio estables por rol: `frontend`, `api`, `sandbox`, `webhook-listener`, `tunnel`.
- `compose.yml` sirve servidor/prod con `frontend` en `target: prod`.
- `compose.dev.yml` sirve iteración local/dev con HMR/watch y `frontend` en `target: dev`.
- `webhook-listener` es el ejecutor operativo; API y sandbox no ejecutan Docker ni `cloudflared` directamente.
- El tunnel compartido es global y centralizado mediante `CENTRAL_TUNNEL_WEBHOOK_URL` + `DEPLOY_JWT_SECRET`.
- El estado canónico de configuración `prod/dev` de proyectos gestionados vive cifrado en Supabase; runtime solo consume inyección efímera.
- `sandbox` y `api` no se exponen libremente al host en producción salvo la excepción explícita vigente del `compose.yml` raíz.
- `HOST_PROJECT_DIR/workspace/users` debe seguir montado en `/workspace/users` para persistir `HOME` y caches del sandbox.
- El servicio `tunnel` queda solo como fallback legacy opt-in vía profile explícito.

### Publicabilidad de proyectos gestionados

- Los proyectos gestionados deben cumplir `references/entorno.md`.
- Frontend debe exponer `4321` dentro del contenedor.
- `FRONTEND_PORT` es obligatorio en `.env` y `.env.dev`.
- El frontend debe unirse a `mis-proyectos-edge` con alias esperado por entorno.
- Prod usa alias `<app>-origin`; dev usa `test-<app>-origin`.
- No usar `host.docker.internal:<FRONTEND_PORT>` como camino estándar cuando existe alias edge gestionado; queda como compat/legacy.
- `projectctl env validate` debe detectar `FRONTEND_PORT` faltante o inválido.
- `projectctl tunnel status` debe exponer `TUNNEL_NOT_PUBLISHABLE` con acciones cuando falte red/alias/hostname.

### Cambios operativos

- Si se toca Compose, preservar el modelo de overlays existente antes de introducir servicios, perfiles o puertos nuevos.
- Si se toca compose/env de un proyecto gestionado, identificar archivos owned por la tarea, aplicar cambio mínimo y reportar qué requisito de `references/entorno.md` quedó satisfecho.
- Si se toca startup ordering, dependencias o readiness, no cambiar rol de servicios ni mover fuente de verdad fuera del contrato documentado.
- Si una decisión operativa impacta API, sandbox o tunnel, actualizar el contrato de esa superficie sin duplicar policy.

## 4. Operación segura de `projectctl`

### Boundary

```text
terminal -> projectctl -> API -> webhook-listener -> Docker host
```

- `projectctl` corre dentro de la PTY del proyecto.
- Habla con backend autenticado y project-scoped.
- API valida auth + ownership.
- `webhook-listener` es la única superficie privilegiada que ejecuta Docker Compose.
- `sandbox` no expone Docker CLI ni `docker.sock`.
- Si necesitás runtime desde la terminal, la vía soportada es `projectctl`.

### Uso permitido

- Inspeccionar estado prod/dev: `projectctl status`, `projectctl ps`, `projectctl doctor`.
- Leer logs: `projectctl logs dev|prod [service] --tail N --since DURATION`.
- Operar dev: `start`, `stop`, `restart`, `rebuild`.
- Promover/deploy prod con confirmación: `projectctl promote prod`, `projectctl deploy prod`.
- Gestionar env: `projectctl env status|get|set|unset|edit|validate|pull|run`.
- Gestionar tunnel: `projectctl tunnel status|tokens|routes|set-domain|set|clear`.
- Ejecutar tests: `projectctl test run|list-runs|results|schedule-add`.
- Consultar actividad, docs, storage, releases, metrics y comandos cuando aplique.

### Prohibiciones y seguridad

- No usar Docker raw en sandbox (`docker ps`, `docker compose ...` deben fallar o no existir).
- No operar otros proyectos desde la PTY actual.
- No administrar imágenes/redes/volúmenes arbitrarios del host.
- `run dev` solo admite comandos allowlisted y usa `spawn(cmd, args, { shell: false })`.
- `run prod` no está soportado.
- Operaciones sensibles de prod requieren confirmación o `--yes` en modo no interactivo.
- `rollback prod` requiere `--yes` y debe dejar auditoría o fallar con error accionable.
- Outputs nunca deben imprimir tokens o secretos (`OPENCODE_API_TOKEN`, `API_TOKEN`, `token`, `apiToken`).

## 5. Flujo operativo de tareas

El contrato ejecutable completo vive únicamente en el bloque delimitado `task-flow-binding` (`TaskFlowBindingV1`, v9.0.0) dentro de `.agents/skills/projectctl-requirements/references/tareas.md`.

Este archivo respeta el contrato integral del bloque sin replicar valores:

- **Rol**: solo cita `task-flow-binding` (block id, binding_id, binding_version, path) para que el lector sepa dónde está el binding; nunca publica un catálogo paralelo de estados, lanes o gates.
- **Runtime projection**: la resolución de lane skill, policies de superficie, paths ordenados, fallo `skill_resolution_missing`, ownership de lanzamiento y snapshot inmutable de modos se rigen por D-20. Los contratos exactos viven en `.agents/skills/sd-protocol/workflow-runtime-context.md` y `.agents/skills/sd-protocol/skill-resolver.md`; no se duplican aquí ni se añaden al binding.
- **Helpers opcionales**: la política `/task_skill_selection` declara `task-skills/v1`, identidad `metadata.id`, resolución project-installed, relectura por ejecución y orden lane → surfaces → helpers con dedupe exact-path first-wins. Vacío, missing o conflictivo nunca debilita paths obligatorios, modes ni gates.
- **Tasks CLI profesional**: `/task_skill_selection/cli` es el contrato portable de PCT-53/PCT-54. Create usa el template profesional; `--skills`, `--no-skills` y `--interactive` son mutuamente excluyentes; sin modo, create usa defaults y update preserva.
- El primary `taskReadme/<task_id>-<task_slug>.md` es un índice de coordinación escrito por el coordinador y el detalle full-artifact vive en `taskReadme/<task_id>-<task_slug>/<artifact>.md` (escrito por la lane owner), según `artifact_store.primary`/`artifact_store.phase_artifacts` del bloque; ninguna referencia introduce una segunda fuente de verdad.
- La fase documental tiene un único owner por binding (`sdd-apply-doc`); los demás lanes deben consumir el bloque por contexto, no duplicar su rol.
- Los criterios nuevos se trazan como `PCT-106..PCT-121` en `.agents/skills/projectctl-requirements/references/sources.md`; este `standard.md` solo los cita cuando corresponde al flujo integrado.
- La persistencia SDD (primary index, phase artifacts, mirrors y write order) es parte del bloque. Este overlay configura cero mirrors; índice y phase artifacts son suficientes para recovery y cierre.

## 6. Resultado esperado de un agente que usa este estándar

- Identifica qué área de `/projectctl` toca: `cli | doc | test | entorno | tareas`.
- Aplica las reglas integradas de este archivo antes de buscar otra skill.
- Si necesita valores normativos del flujo SDD, extrae el bloque `task-flow-binding` delimitado en `.agents/skills/projectctl-requirements/references/tareas.md` v9.0.0.
- Solo carga skills externas cuando el cambio toca una superficie no absorbida aquí.
- Reporta criterios afectados (`PCT-*`, `TST-*`, `AC-*`, etc.).
- Reporta validación ejecutada: `Unit`, `PW-CLI`, `PW-AUTO`, `Manual` o `not_required`.
- Mantiene `docs/app-map/**`, `playwright/TEST_PLAN.md` y `references/*.md` alineados cuando cambian contratos, sin reintroducir catálogos paralelos al bloque.
