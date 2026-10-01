# Integrated Standard — Docs, Testing and Projectctl Operation

> **last-verified**: 2026-09-28. Este contrato pertenece al core de criterios y evidencia; runtime gestionado y SDD se versionan en sus satélites.

Este archivo indexa documentación, testing, estructura, trazabilidad de código y operación del CLI. El runtime gestionado vive en `projectcl-enviorement` y el flujo de tareas, cuando se instala, en `projectctl-sdd`.

> **Rol de este archivo**: contrato del core. No declara fases, gates ni valores del workflow SDD.

## 1. Documentación y app-map

### Fuentes a revisar primero

1. `docs/app-map/navigation.yaml` y sus bundles listados.
2. `docs/app-map/views/**` cuando el destino usa esa jerarquía.
3. `AGENTS.md` y la documentación local del proyecto para reglas de superficie.
4. `README.md` para instrucciones de instalación y uso del destino.

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
- `root_id` debe apuntar a un `navigation[]` no vacío; cada nodo declara `id`, `title`, `kind: view|feature`, `bundle` relativo sin extensión, y `children` (lista explícita). `id` y `bundle` son únicos en el árbol; el orden del manifest determina el sidebar. Un `.md` fuera del árbol no aparece en Doc.
- Cada bundle listado lleva frontmatter `id`/`title`/`kind` idénticos al nodo, `summary` no vacío y `source_of_truth: app-map`; `## 1. URL` aporta ruta canónica o URL HTTP(S) real. El `.mmd` sibling debe contener un diagrama Mermaid válido para el lector.
- Cada bundle declara editorialmente 6 secciones: URL, Tab, Objetivo, Criterios, Diagrama Mermaid, Sources. No son seis gates de parseo del lector; detalles y estados `missing`/`invalid`/`valid` en `references/docs/reglas.md`.
- Cada bundle incluye frontmatter `criteria[]` con IDs inline para trazabilidad doc <-> tests <-> producto.
 - La cadena criterios→docs→test→estructura→code exige `evidence_paths` en cada `criteria[]` activo y locators distintos por superficie (`@ac` en tests, `@criterion`/`@trace`/`@contract` en código; ningún marker equivale a cobertura): ver `references/estructura/reglas.md` (autoridad `evidence_paths` + mapping type→carpeta), `references/code/reglas.md` (convención completa de markers) y `references/test/reglas.md` (contrato `@ac` operativo).
- El doctor local `bun .agents/skills/projectctl-requirements/scripts/project/doctor-docs.ts --root . --json` no puede certificar la aceptación del parser estricto: sin CLI autenticado informa `unverified` si la estructura local pasa. `--managed` usa `projectctl docs lint --json` y devuelve el veredicto del lector real; `projectctl docs check` es el gate del generador de `/projectctl`, no del bundle del proyecto.
- Los tres doctors del checkout admiten `--target=<view>[:<feature>]` como diagnóstico acotado. La jerarquía la define únicamente `navigation.yaml`; los criterios pertenecen al frontmatter del bundle listado. El índice derivado común `scripts/project/app-map-inventory.ts` resuelve el target e IDs para Docs, Test y Estructura. Sin `--target` permanece el diagnóstico global; los checks comunes y los veredictos managed no se convierten en evidencia de una feature.
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

Identidad única y ciclo de vida: `references/criterios/identity.md` y
`scripts/project/criterion-contract.ts`. Todos los consumidores, incluidos
proposal/spec/tasks de SDD, usan el mismo ID del bundle owner; no hay aliases
operativos ni renumeración por tarea. Un alta propuesta lleva ID definitivo y
una retirada conserva tombstone. Las revisiones de aceptación excluyen los
resultados de ejecución; una definición modificada requiere evidencia vigente.

La dirección doc→código es normativa (no un hard gate de lint). En el cierre de un cambio, verificar por bundle que cada criterio declarado tenga al menos una referencia en código o tests, o una nota de excepción (not-applicable / Manual / documental). Es un procedimiento normativo en close; NO es un hard gate de lint.

La mitad mecánica del contrato vive en los checks 1-5 puros del contrato portable `.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts` (`checkProductCode`, `checkUnitTests` y `checkPlaywrightSpecs`, dirección código⇒criterio, inversa a la auditoría doc⇒código), instanciados por el wrapper local `<repo>/scripts/...` (proveído por el destino, parser real + globs del repo; evidencia aportada por el wrapper local de la instancia). Esta sección solo declara la dirección doc⇒código como procedimiento de auditoría; no introduce un lint inverso.

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

> **last-verified**: 2026-09-28 — regenerar ante cualquier cambio en el contrato de tipos del app-map, en el piloto T-6 del bundle de la instancia destino (no portable), en la taxonomía del spec (T-1/T-5) o en el contrato bidireccional doc⇒código (R-B; mitad mecánica en `.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts` checks 1-5 + wrapper local `<repo>/scripts/...` proveído por el destino).

### Diagramas

- Las vistas UI, tabs y subsuperficies documentadas deben tener diagrama Mermaid cuando formen parte de documentación funcional.
- El formato canónico es Mermaid y debe validarse antes de cerrar el cambio.
- Para `/projectctl`, los diagramas funcionales viven junto al bundle (`docs/app-map/views/<view>/**/*.mmd`; patrón portable, instancia destino, no portable).

## 2. Testing, evidencia y coverage

### Decisión de alcance

- `not_required`: task solo toca skills, docs, proceso o cambios no browser-facing.
- `Unit`: lógica interna donde navegador no agrega evidencia relevante.
- `PW-CLI`: comportamiento browser-facing que puede validarse exploratoriamente.
- `PW-AUTO`: regresión persistente requerida o criterio de `docs/app-map/**` lo exige.
- Si cambia runtime root, WebSocket real, proxy, Compose o startup ordering, exige validación de runtime aunque no haya cambio visual.
- Si cambia contrato browser-facing visible, `PW-CLI` es el mínimo.

### Reglas Playwright y Bun

- Usar Bun para los comandos gestionados: `bun test`, `bunx playwright test` y lockfile Bun versionado; no aceptar un gate que no ejecute tests o que use `--passWithNoTests`.
- Usar `BASE_URL` o URL explícita; no hardcodear dominios legacy.
- Preferir roles, labels y selectores estables; evitar sleeps fijos.
- Si nace o cambia cobertura `PW-AUTO`, actualizar `playwright/TEST_PLAN.md`.
- `playwright/TEST_PLAN.md` solo cambia cuando nace o cambia cobertura Playwright persistente.
- `docs/app-map/views/**` solo cambia cuando cambia contrato o cobertura canónica, no por cada corrida aislada.

### Contrato AC y runner

- Tests Bun y specs Playwright deben declarar `// @ac <ID>` en las primeras 10 líneas.
- Specs Playwright deben añadir `test.info().annotations.push({ type: 'ac', description: '<ID>' })`.
- TST-40/TST-41/TST-42 (descubrimiento gestionado): cada spec declara el owner `// @<view-id>` (ID de `docs/app-map/navigation.yaml`) en las primeras 10 líneas, vive en `tests/e2e/<view>/` (unit del proyecto en `tests/unit/<view>/`) y sus títulos `test('...')` contienen sus IDs `// @ac` (el runner filtra con `--grep` sobre el título).
- TST-39 (copia única): el proyecto NO declara `@playwright/test` (ni `playwright`) en `package.json`; specs y config resuelven a la copia única de plataforma. Browsers de la versión canónica vía `PLAYWRIGHT_BROWSERS_PATH` (default `/opt/pw-browsers` en sandbox).
- El proyecto genérico PW-AUTO `pwauto-<view>` lo deriva el runner del `navigation.yaml` del proyecto (root canónico project-first); el checkout no inventa proyectos Playwright paralelos.
- El runner unificado lo aporta el wrapper local de la instancia destino (proveído por el destino): `bun run <repo>/scripts/<runner>.ts run --method=<unit|pwauto|all> --target=<view>[:<feature>] [--persist]` sobre el contrato portable `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts`.
- `projectctl test *` delega en el runner del operador; en proyectos gestionados, comprobar que el target `view[:feature]`, los tests y el app-map efectivos pertenecen al checkout correcto (source root y project root pueden diferir).
 - La persistencia canónica vive en `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/{junit.xml,results.json,summary.json}` (concepto ledger en `references/criterios/reglas.md` PCT-172; operativa en `references/test/reglas.md` PCT-92).
 - Con `--persist`, un run exitoso con tests ejecutados > 0 puede hacer write-back V2 de Unit/PW-AUTO; `coverageAccepted: true` solo tras patch atómico confirmado (operativa en `references/test/reglas.md` PCT-92; el ledger nunca inventa filas, ver PCT-172). Fallo, 0 tests o patch no confirmado dejan cobertura `pending`/no aceptada; `AUTO_WRITEBACK_DEFERRED_V1` se conserva como fallback.
- `test:check` debe comprobar en el app-map del proyecto gestionado que cada criterio `functional: implemented` tenga tanto Unit como PW-AUTO en `covered`, salvo `skip_quality_gate: true` justificado. `vitest run && tsc --noEmit` por sí solos no son ese gate.
- Leer `references/test/reglas.md` para distinguir requisitos del checkout frente a la tab 5.1/5.2 y el runner/DB del operador. Correr el doctor read-only `bun .agents/skills/projectctl-requirements/scripts/project/doctor-test.ts --root . --json`; el exit 1 expone incumplimientos y el exit 3 no certifica el runtime.
- `bun run test:check` es el gate de cobertura contractual.
- TST-38: `docs:lint` valida la trazabilidad código⇒criterio contra la SoT `docs/app-map/**` (checks 1-5 puros en `.agents/skills/projectctl-requirements/scripts/project/docs-lint-core.ts`, instanciados por el wrapper local `<repo>/scripts/...` proveído por el destino; evidencia aportada por el wrapper local de la instancia).
- Contrato portable del runner: tipos + validadores puros (`validateAcHeader`/`validateLayout`/`validateResultsEnvelope`, mapping 1:1, persistencia y `AUTO_WRITEBACK_DEFERRED_V1`) en `.agents/skills/projectctl-requirements/scripts/project/test-runner-contract.ts`; el wrapper local `<repo>/scripts/...` (proveído por el destino) es la instancia runtime que lo importa (SoT CLI = contrato portable vs Runtime = wrapper local de la instancia).

## 3. Superficies satélite

El contrato gestionado de Compose, configuración y publicación (PCT-95..PCT-100) vive en `.agents/skills/projectcl-enviorement/references/managed-environments.md`. Usar su doctor estático y `projectctl doctor` para verificar el runtime; este estándar no replica reglas de operación. La tab CLI vive en la instancia destino (su App Map + catálogo publicado), fuera del ecosistema portable. Para Tareas, consultar `.agents/skills/projectctl-sdd/references/tasks/binding.md` solo cuando se instala SDD.

## 4. Frontera operativa

La operación autenticada de `projectctl` y el wrapper root pertenecen a la instancia destino (no portable); la seguridad de `start dev/prod` y `deploy prod` a `projectcl-enviorement`. Los tests y su cobertura siguen en `references/test/reglas.md`. No tratar la presencia o ausencia de un satélite como evidencia de cobertura del core.

## 5. Resultado esperado de un agente que usa este estándar

- Identifica qué eslabón core toca o si la tarea pertenece a CLI, Tareas o Entorno en sus satélites.
- Aplica las reglas de la cadena y carga el satélite propietario cuando la tarea sale del core.
- Si la tarea exige coordinación SDD, carga por separado `projectctl-sdd`; los criterios y evidencias de esta cadena siguen siendo autoridad del core.
- Solo carga skills externas cuando el cambio toca su superficie.
- Reporta criterios afectados (`PCT-*`, `TST-*`, `AC-*`, etc.).
- Reporta validación ejecutada: `Unit`, `PW-CLI`, `PW-AUTO`, `Manual` o `not_required`.
- Mantiene `docs/app-map/**`, `playwright/TEST_PLAN.md` y las referencias canónicas alineados cuando cambian contratos de criterios y cobertura.
