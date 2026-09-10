# Integrated Standard — Docs, Testing, Runtime and Projectctl Operation

Este archivo absorbe las reglas de valor que antes estaban repartidas en `docs-governance`, `testing-policy`, `ops-runtime-policy` y `projectctl-operator`. `projectctl-requirements` package v11 publica el binding operativo único en `references/tareas.md`; esta skill es el estándar integrado para compatibilidad `/projectctl`.

> **Rol de este archivo**: integrado de reglas operativas. Los valores del workflow viven únicamente en el bloque `task-flow-binding` (`TaskFlowBindingV2`, v10.0.0, model 2).

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
- Todo criterio declarado en `docs/app-map/**` debe tener evidencia en código o tests, **o** una justificación explícita (not-applicable / Manual / documental).
- Estados funcionales permitidos: `implemented | partial | missing | not-applicable`.
- Estados de cobertura permitidos: `covered | partial | missing | not-applicable`.
- Métodos permitidos: `Unit | PW-CLI | PW-AUTO | Manual`.
- Tipo de criterio obligatorio (campo `type`, item-level): `ui | functionality | a11y | backend | data | integration | security | performance | tooling` — enum cerrado de 9 (T-1).

### Clasificación del criterio — enum cerrado `type` (T-1)

Cada criterio `criteria[]` declara `type` (obligatorio, item-level, indent 4, lowercase). Valores canónicos y su **verificación por defecto** (guía documental, NUNCA una restricción de lint — T-7):

| Value | Definición (una línea) | Verificación por defecto |
|---|---|---|
| `ui` | Cómo se ve/interactúa/percibe la vista renderizada (layout, estilos, affordances, contenido presentado) | PW-CLI / PW-AUTO |
| `functionality` | Comportamiento e2e visible cuyo resultado correcto cruza el stack | PW-AUTO |
| `a11y` | Criterio WCAG citable o comportamiento teclado/screen-reader/contraste | PW + auditoría manual |
| `backend` | Lógica de servidor/API sin UI necesaria (reglas, validaciones, autorización) | Unit / API |
| `data` | Estado/estructura de DB: schema, migraciones, RLS/grants, seed | Unit / SQL |
| `integration` | Contrato entre sistemas: APIs externas, webhooks, eventos, auth providers | Contract / API |
| `security` | Control contra amenaza (authn/authz, cifrado, sesiones), nivel ASVS | Unit/API + revisión |
| `performance` | Atributo con umbral numérico bajo condiciones | Suite perf / Manual |
| `tooling` | CLIs, scripts, infra/ops internos sin UI de usuario final | Unit + corrida manual |

### Auditoría de criterios

La dirección doc→código es normativa (no un hard gate de lint). En el cierre de un cambio, verificar por bundle que cada criterio declarado tenga al menos una referencia en código o tests, o una nota de excepción (not-applicable / Manual / documental). Es un procedimiento normativo en close; NO es un hard gate de lint.

La mitad mecánica del contrato vive en los checks de `scripts/docs-lint.ts`: `checkProductCode`, `checkUnitTests` y `checkPlaywrightSpecs` (código⇒criterio, dirección inversa a la auditoría doc⇒código). Esta sección solo declara la dirección doc⇒código como procedimiento de auditoría; no introduce un lint inverso.

### Árbol de clasificación del criterio (T-5 — normativo)

Asignar el tipo de un criterio por la primera regla que coincida, en orden:

1. Impone un **umbral numérico** de tiempo/capacidad/recursos → `performance`. (Si además expresa una amenaza, la regla 2 gana.)
2. Expresa protección contra una **amenaza** / control de seguridad → `security`.
3. Es un **criterio de éxito WCAG** o comportamiento teclado/screen-reader/contraste → `a11y`.
4. Requiere una **vista renderizada en browser** para verificar → si la preocupación es *cómo se ve/interactúa* → `ui`; si es *corrección del resultado del flujo* → `functionality`.
5. La evidencia es un **contrato entre sistemas** (API externa/webhook/evento/provider) → `integration`.
6. La evidencia es **estado/schema/RLS de DB** sin API → `data`.
7. La evidencia es una **respuesta de API/servicio** o efecto de servidor, sin UI → `backend`.
8. El sujeto es una **herramienta interna / CLI / script / infra / env** sin UI de usuario final → `tooling`.

Desempates: **un criterio = una preocupación** (preocupaciones mixtas MUST dividirse en dos criterios tipados, nunca multi-tipo); UI+backend mismo comportamiento → tipar por donde vive la evidencia directa más barata (regla de la pirámide; preocupación enforced en servidor → `backend` aunque tenga UI); a11y vs ui → el SC WCAG citado gana; tooling con UI de admin → mirar el consumidor del criterio (usuario final vs operador).

> **last-verified**: 2026-09-07 — regenerar ante cualquier cambio en `shared/contracts/app-map.ts` (`APP_MAP_CRITERION_TYPES`), en `docs/app-map/views/project-workspace/features/doc-tab.md` (piloto T-6), en la taxonomía del spec (T-1/T-5) o en el contrato bidireccional doc⇒código (R-B; mitad mecánica en `scripts/docs-lint.ts` `checkProductCode`/`checkUnitTests`/`checkPlaywrightSpecs`).

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
- `.env` debe declarar `FRONTEND_PORT` y `.env.dev` debe declarar `FRONTEND_DEV_PORT`; ambos archivos son configuración local explícita y no aceptan aliases entre overlays.
- El frontend debe unirse a `mis-proyectos-edge` con alias esperado por entorno.
- Prod usa alias `<app>-origin`; dev usa `test-<app>-origin`.
- No usar `host.docker.internal:<FRONTEND_PORT>` como camino estándar cuando existe alias edge gestionado; queda como compat/legacy.
- `projectctl env validate` debe detectar las claves de puerto faltantes o inválidas según el overlay: `FRONTEND_PORT`/`API_PORT` en `.env` y `FRONTEND_DEV_PORT`/`API_DEV_PORT` en `.env.dev`.
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

El contrato ejecutable completo vive únicamente en el bloque delimitado `task-flow-binding` (`TaskFlowBindingV2`, v10.0.0) dentro de `.agents/skills/projectctl-requirements/references/tareas.md`.

Este archivo respeta el contrato integral del bloque sin replicar valores:

- **Rol**: solo cita `task-flow-binding` (block id, binding_id, binding_version, path) para que el lector sepa dónde está el binding; nunca publica un catálogo paralelo de estados, lanes o gates.
- **Runtime projection**: la resolución de lane skill, policies de superficie, paths ordenados, fallo `skill_resolution_missing`, ownership de lanzamiento y snapshot inmutable de modos se rigen por D-20. Los contratos exactos viven en `.agents/skills/sd-protocol/workflow-runtime-context.md` y `.agents/skills/sd-protocol/skill-resolver.md`; no se duplican aquí ni se añaden al binding.
- **Helpers opcionales**: la política `/task_skill_selection` declara `task-skills/v1`, identidad `metadata.id`, resolución project-installed, relectura por ejecución y orden lane → surfaces → helpers con dedupe exact-path first-wins. Vacío, missing o conflictivo nunca debilita paths obligatorios, modes ni gates.
- **Tasks CLI profesional**: `/task_skill_selection/cli` es el contrato portable de PCT-53/PCT-54. Create usa el template profesional; `--skills`, `--no-skills` y `--interactive` son mutuamente excluyentes; sin modo, create usa defaults y update preserva.
- El primary `taskReadme/<task_id>-<task_slug>.md` es un índice de coordinación escrito por el coordinador y el detalle full-artifact vive en `taskReadme/<task_id>-<task_slug>/<artifact>.md` (escrito por la lane owner), según `artifact_store.primary`/`artifact_store.phase_artifacts` del bloque; ninguna referencia introduce una segunda fuente de verdad.
- La fase documental tiene un único owner por binding (`sdd-apply-doc`); los demás lanes deben consumir el bloque por contexto, no duplicar su rol.
- Los criterios nuevos se trazan como `PCT-106..PCT-121` en `.agents/skills/projectctl-requirements/references/sources.md`; este `standard.md` solo los cita cuando corresponde al flujo integrado.
- La persistencia SDD (primary index, phase artifacts, mirrors y write order) es parte del bloque. Este overlay configura cero mirrors; índice y phase artifacts son suficientes para recovery y cierre.
- RDD, su modo opt-in, fase, lanes, guards, gates y entrega condicional se consumen desde el bloque. Este archivo no reproduce sus catálogos. Tareas V1/v8 se leen solo como RDD disabled; valores desconocidos o instalaciones V1/V2 y v8/v9 mezcladas bloquean sin fallback.
- El paquete se instala por reemplazo completo `copy-tree-no-mods`; una instalación híbrida debe fail closed antes de routing o delivery.
 - Toda proposal MUST declarar el delta de criterios (añadir/eliminar/modificar con IDs) antes de Fase 2.
 - El binding único también define `environment_verification_deferred` y `pending_environment_close_block`; esta referencia los consume sin duplicar sus machine values.

## 6. Resultado esperado de un agente que usa este estándar

- Identifica qué área de `/projectctl` toca: `cli | doc | test | entorno | tareas`.
- Aplica las reglas integradas de este archivo antes de buscar otra skill.
- Si necesita valores normativos del flujo SDD, extrae el bloque `task-flow-binding` delimitado en `.agents/skills/projectctl-requirements/references/tareas.md` v9.0.0.
- Solo carga skills externas cuando el cambio toca una superficie no absorbida aquí.
- Reporta criterios afectados (`PCT-*`, `TST-*`, `AC-*`, etc.).
- Reporta validación ejecutada: `Unit`, `PW-CLI`, `PW-AUTO`, `Manual` o `not_required`.
- Mantiene `docs/app-map/**`, `playwright/TEST_PLAN.md` y `references/*.md` alineados cuando cambian contratos, sin reintroducir catálogos paralelos al bloque.
