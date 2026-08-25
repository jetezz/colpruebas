# SPEC-1 — Specs delta (fase 2) — Remediación compatibilidad /projectctl (entornos, docs, tests)

> Lane: `sdd-spec` (fase 2, unit `SPEC-1`). Basada en la propuesta aprobada
> (`proposal.md`, PROPOSE-1, §3 Capabilities C1..C7, §5 Scope, §9 Success Criteria), la
> exploración reconciliada (`explore-code.md`, estado actual con matices) y el índice
> primario (`AC-001..AC-005`, §8). Estandar inyectado: `projectctl-requirements`
> (`references/{standard,entorno,test,doc}.md`, PCT-83..PCT-100, PCT-106..PCT-121).
> Write autorizado: únicamente este artifact (`spec`). No modifica código, docs, config
> ni tests.

---

## 1. Convenciones del spec

- **Formato delta**: requisitos clasificados como `ADDED` / `MODIFIED` / `REMOVED` sobre el
  estado actual documentado en `explore-code.md`. No existe spec previo para estos dominios;
  los `MODIFIED` describen el estado actual (evidencia) → estado objetivo.
- **Keywords RFC 2119**: `MUST` (obligatorio), `SHOULD` (recomendado), `MAY` (opcional).
- **Trazabilidad**: cada REQ declara `AC-XXX` (criterios del índice §8) y criterios `PCT-*`
  del estándar inyectado. La matriz completa está en §7.
- **Paths**: rutas repo-local absolutas desde la raíz del proyecto `colpruebas`. Ningún valor
  de routing, fallback o default operativo se deriva de aliases retirados del binding.
- **Delivery notes**: los archivos env (`.env`, `.env.dev`) están gitignored → riesgo de
  entrega (policy review / force-add); `.runtime/` y `test-results/` NO están gitignored →
  decidir política en diseño.

---

## 2. Dominio ENTORNO — AC-001 (Capabilities C1, C2)

### 2.1 ADDED

#### REQ-ENT-001 — `.env` y `.env.dev` con `FRONTEND_PORT=4321` (ADDED)

- **AC**: AC-001 · **Criterio estándar**: PCT-95, PCT-97 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: El proyecto MUST disponer de `.env` en la raíz (ausente hoy) y MUST corregir
`.env.dev` (hoy `FRONTEND_PORT=4324`) para que ambos declaren `FRONTEND_PORT=4321`
(puerto canónico de contenedor expuesto por el servicio `frontend`). `.env.example` SHOULD
quedar alineado a `FRONTEND_PORT=4321` como referencia canónica instalable. El valor
`FRONTEND_PORT` MUST ser numérico y válido para `projectctl env validate` (PCT-97/PCT-35).

**Escenarios**:
- Given un checkout del proyecto sin `.env` y con `.env.dev` en `FRONTEND_PORT=4324`,
  When se ejecuta `projectctl env validate`,
  Then MUST reportar ok solo si `.env` existe y ambos archivos declaran `FRONTEND_PORT=4321`.
- Given `.env` y `.env.dev` presentes con `FRONTEND_PORT=4321`,
  When se inspecciona la configuración del servicio `frontend` en los overlays,
  Then el mapeo de puerto MUST ser `"${FRONTEND_PORT}:4321"` (host `4321` → contenedor `4321`).
- Given `.env.dev` con `FRONTEND_PORT` ausente o inválido,
  When `projectctl env validate` corre,
  Then MUST reportar `missing/invalid FRONTEND_PORT` y el campo `configExists` (PCT-97).

#### REQ-ENT-002 — `compose.yml` canónico prod con `frontend` `target: prod` (ADDED)

- **AC**: AC-001 · **Criterio estándar**: PCT-96, PCT-98 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: El proyecto MUST disponer de `compose.yml` (raíz) como overlay de producción.
Debe declarar servicios con nombres canónicos por rol: `frontend` y `api`. El servicio
`frontend` MUST usar `build.target: prod` (no `Dockerfile.prod` como arg). MUST preservar el
contrato edge existente: red `mis-proyectos-edge` declarada `external: true` y alias edge
`colpruebas-origin` en `services.frontend.networks.edge.aliases` (prod). `sandbox` y `api`
MUST NOT exponerse libremente al host en producción salvo la excepción operativa documentada
del overlay (standard §3).

**Escenarios**:
- Given el estado actual con `docker-compose.yml` usando servicios `frontend-prod`/`api-prod`
  y `Dockerfile.prod` como build arg,
  When se materializa `compose.yml` canónico,
  Then los servicios MUST llamarse `frontend`/`api` y `frontend` MUST usar `target: prod`.
- Given `compose.yml` válido,
  When se valida la red del overlay,
  Then `mis-proyectos-edge` MUST existir como `external: true` y el alias `colpruebas-origin`
  MUST estar declarado sin cambios respecto del legacy (preservación, PCT-98).
- Given `compose.yml` en modo prod,
  When se inspecciona el mapeo de puertos del servicio `frontend`,
  Then MUST exponer `"${FRONTEND_PORT}:4321"`.

#### REQ-ENT-003 — `compose.dev.yml` canónico dev con `frontend` `target: dev` (ADDED)

- **AC**: AC-001 · **Criterio estándar**: PCT-96, PCT-98 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: El proyecto MUST disponer de `compose.dev.yml` (raíz) como overlay de
desarrollo. Debe declarar servicios canónicos `frontend` y `api`; el servicio `frontend`
MUST usar `build.target: dev` (HMR / `bun --watch`). MUST preservar la red
`mis-proyectos-edge` `external: true` y el alias edge `test-colpruebas-origin`
(dev). El servicio `tunnel` MAY quedar únicamente como fallback legacy opt-in vía
`profiles: [...]` explícito; NO es el camino principal (el camino principal es el tunnel
gestionado central vía `CENTRAL_TUNNEL_WEBHOOK_URL` + `DEPLOY_JWT_SECRET`, PCT-96/98).

**Escenarios**:
- Given el estado actual con `docker-compose.dev.yml` usando servicios `frontend-dev`/`api-dev`
  y `Dockerfile.dev`,
  When se materializa `compose.dev.yml` canónico,
  Then los servicios MUST llamarse `frontend`/`api` y `frontend` MUST usar `target: dev`.
- Given `compose.dev.yml` válido,
  When se valida la red edge,
  Then `mis-proyectos-edge` MUST ser `external: true` y el alias `test-colpruebas-origin`
  MUST estar declarado sin cambios (PCT-98).
- Given un overlay dev,
  When `projectctl start dev` o `projectctl status` corre,
  Then el servicio `frontend` MUST arrancar en modo dev con HMR/watch y puerto
  `"${FRONTEND_PORT}:4321"`.

#### REQ-ENT-005 — Documentación de entorno y arquitectura (ADDED)

- **AC**: AC-001 · **Criterio estándar**: PCT-95, PCT-96, PCT-98 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `docs/00-context/entornos.md` documentando overlays canónicos,
`FRONTEND_PORT` obligatorio, contrato edge y runtime vía `projectctl`; MUST existir
`docs/00-context/architecture.md` (arquitectura del repo); MUST existir
`docs/02-features/tunnel.md` documentando el tunnel gestionado central, alias edge por
entorno (`<app>-origin` / `test-<app>-origin`) y el guardrail `TUNNEL_NOT_PUBLISHABLE`
(PCT-98). Los directorios `docs/00-context/` y `docs/02-features/` no existen hoy (evidencia
explore §1.3).

**Escenarios**:
- Given el estado actual con `docs/00-context/` y `docs/02-features/` ausentes,
  When se completa AC-001,
  Then `docs/00-context/entornos.md`, `docs/00-context/architecture.md` y
  `docs/02-features/tunnel.md` MUST existir y ser referenciables desde
  `references/entorno.md` (PCT-95/96/98).
- Given `docs/02-features/tunnel.md` presente,
  When un agente consulta la regla de alias por entorno,
  Then el doc MUST declarar prod `colpruebas-origin` y dev `test-colpruebas-origin` y el
  guardrail `TUNNEL_NOT_PUBLISHABLE` con accionables.

#### REQ-ENT-006 — Instalación de skill `sandbox-runtime-policy` (ADDED)

- **AC**: AC-001 · **Criterio estándar**: PCT-99 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `.agents/skills/sandbox-runtime-policy/SKILL.md` (skill citada
por `references/entorno.md` PCT-99; ausente hoy, evidencia explore §1.4). La skill MUST
declarar que el sandbox NO expone `docker` CLI ni `docker.sock` y que el control de runtime es
exclusivo vía `projectctl` (`env *`, `tunnel *`, `start|stop|restart|rebuild|promote|deploy|doctor`).

**Escenarios**:
- Given `.agents/skills/sandbox-runtime-policy/` ausente,
  When se instala la skill (AC-001),
  Then `.agents/skills/sandbox-runtime-policy/SKILL.md` MUST existir y el
  test `projectctl-requirements.sot-coherence.test.ts` (REQ-TST-007) MUST poder resolverla.
- Given sandbox con la policy instalada,
  When un agente intenta `docker compose ...` dentro del sandbox,
  Then MUST fallar (`docker: command not found` es comportamiento correcto, no bug, PCT-99).

### 2.2 MODIFIED

#### REQ-ENT-004 — Overlays legacy `docker-compose*.yml` fuera del uso canónico (MODIFIED)

- **AC**: AC-001 · **Criterio estándar**: PCT-96 · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: El estado actual usa `docker-compose.yml` + `docker-compose.dev.yml` con
servicios `*-prod`/`*-dev` (no canónicos). El estado objetivo MUST NO depender de esos
archivos como overlays operativos: `docker-compose*.yml` MUST ser removidos o renombrados a
los nombres canónicos `compose.yml`/`compose.dev.yml` (decisión de granularidad en diseño),
y ninguna ruta operativa (projectctl, runner, docs, tests) MUST referenciar los nombres
legacy. Los alias edge y la red `mis-proyectos-edge` preservados (REQ-ENT-002/003) MUST
mantener los mismos valores que el legacy para no romper el contrato edge existente.

**Escenarios**:
- Given overlays legacy presentes y usados por `projectctl`,
  When se aplica AC-001,
  Then `projectctl status` MUST resolver overlays canónicos `compose.yml`/`compose.dev.yml`
  y MUST NO requerir `docker-compose*.yml` para levantar prod/dev.
- Given un grep sobre config/docs/scripts del repo,
  When se buscan referencias a `docker-compose.yml` / `docker-compose.dev.yml` como overlays
  operativos,
  Then no debe existir dependencia canónica sobre ellos (solo contexto histórico permitido).

#### REQ-ENT-007 — `projectctl env validate` reporta ok (MODIFIED)

- **AC**: AC-001 (C2) · **Criterio estándar**: PCT-97, PCT-38 · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: Tras AC-001, `projectctl env validate` MUST reportar `ok` (estado objetivo:
`.env` y `.env.dev` presentes con `FRONTEND_PORT=4321`). Hoy falla por `.env` ausente y
puertos no canónicos (evidencia explore §1.1). El comando MUST seguir detectando
`missing/invalid FRONTEND_PORT` cuando un archivo env se desvíe (regresión no permitida).

**Escenarios**:
- Given `.env` y `.env.dev` presentes con `FRONTEND_PORT=4321`,
  When se ejecuta `projectctl env validate`,
  Then MUST reportar ok sin errores críticos.
- Given `.env` eliminado después de la remediación,
  When se ejecuta `projectctl env validate`,
  Then MUST reportar fallo (regresión: `missing .env`), preservando el comportamiento de
  PCT-97.

#### REQ-ENT-008 — Runtime prod/dev vía `projectctl` y `doctor` sin drifts críticos (MODIFIED)

- **AC**: AC-001 (C2) + cierre (C6) · **Criterio estándar**: PCT-96, PCT-99 · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: `projectctl status` MUST levantar ambos modos (prod y dev) con los overlays
canónicos (REQ-ENT-002/003). El control de runtime MUST ser exclusivo vía `projectctl`
(PTY → API → webhook-listener → Docker host; sandbox sin Docker, PCT-99). `projectctl doctor`
MUST NO reportar drifts críticos al cierre (C6/close, criterio de éxito del índice §1/§3 ítem 6).

**Escenarios**:
- Given overlays canónicos y env correctos,
  When se ejecuta `projectctl status`,
  Then MUST listar prod y dev levantables con el servicio `frontend` en `target: prod/dev`
  respectivamente.
- Given el runtime operando,
  When se ejecuta `projectctl doctor`,
  Then MUST NO reportar drifts críticos (solo advertencias no bloqueantes permitidas).
- Given un sandbox,
  When se inspecciona su superficie de runtime,
  Then MUST NO exponer docker CLI/socket; el único control es `projectctl` (PCT-99).

---

## 3. Dominio DOCS — AC-002 (Capability C3)

### 3.1 ADDED

#### REQ-DOC-001 — Bundle `docs/app-map/views/projectctl/index.md` con 5 secciones MUST (ADDED)

- **AC**: AC-002 · **Criterio estándar**: PCT-83, PCT-84, PCT-85, PCT-88 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `docs/app-map/views/projectctl/index.md` (ausente hoy, evidencia
explore §2.1) como bundle declarativo de la vista `/projectctl`. El bundle MUST declarar las
5 secciones canónicas MUST: `URL`, `Tab`, `Objetivo`, `Criterios de calidad` y `Diagrama
Mermaid` (PCT-84). Debe incluir frontmatter YAML con `criteria[]` inline de estructura
`{id, title, functional, coverage}` con IDs prefijados `PCT-*` (prefix discipline para
`views/projectctl/`, PCT-85/PCT-88). Estados funcionales permitidos:
`implemented | partial | missing | not-applicable`; cobertura:
`covered | partial | missing | not-applicable`; métodos: `Unit | PW-CLI | PW-AUTO | Manual`.

**Escenarios**:
- Given el estado actual sin `docs/app-map/views/projectctl/`,
  When se crea el bundle (AC-002),
  Then `docs/app-map/views/projectctl/index.md` MUST existir con las 5 secciones MUST.
- Given el frontmatter del bundle,
  When se parsea `criteria[]`,
  Then cada entry MUST tener `{id, title, functional, coverage}` con id prefijado `PCT-*`.
- Given un criterio `PCT-*` en código o tests,
  When se busca su documentación,
  Then MUST estar documentado en el bundle (no debe existir criterio sin doc, PCT-85/88).

#### REQ-DOC-002 — Diagrama Mermaid `index.mmd` sibling (ADDED)

- **AC**: AC-002 · **Criterio estándar**: PCT-84 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `docs/app-map/views/projectctl/index.mmd` (sibling del bundle)
con el diagrama Mermaid canónico de la vista, acorde al contrato "bundle exacto por nodo:
`${bundle}.md` + `${bundle}.mmd`" (standard §1) y a la regla de diagramas funcionales en
`docs/app-map/views/projectctl/**/*.mmd`.

**Escenarios**:
- Given `docs/app-map/views/projectctl/index.md` creado,
  When se valida el nodo del bundle,
  Then `docs/app-map/views/projectctl/index.mmd` MUST existir y ser Mermaid válido.

#### REQ-DOC-005 — Frontmatter de criterios con `PCT-*` reservados (ADDED)

- **AC**: AC-002 · **Criterio estándar**: PCT-88 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: El bundle MUST declarar la lista de IDs reservados por bundle/prefix
(`PCT-*`, `PRJ-*`, `TST-*`, `AC-*`, `DSH-*`, `TNL-*`, `LGN-*`, `MDL-*`) y MUST NO inventar
prefijo nuevo para la vista `projectctl` (regla pineseada en el bundle; cualquier desviación
exige spec delta + decisión explícita en `sdd-spec` per `references/doc.md` PCT-88).

**Escenarios**:
- Given el bundle `views/projectctl/index.md`,
  When se emite un criterio nuevo para la vista,
  Then MUST usar prefijo `PCT-*` (prohibido inventar prefijo).
- Given un AC cross-cutting vigente,
  When se documenta en el bundle,
  Then SHOULD referenciarse como `AC-*` sin reasignar IDs.

### 3.2 MODIFIED

#### REQ-DOC-003 — `docs/app-map/navigation.yaml` registra la vista `projectctl` (MODIFIED)

- **AC**: AC-002 · **Criterio estándar**: PCT-86, PCT-87 · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: `docs/app-map/navigation.yaml` MUST registrar la vista `projectctl` con
`id: projectctl`, `kind: view` y `bundle: views/projectctl/index` (hoy solo registra `home`
y `project-workspace`; evidencia explore §2.2). `docs/app-map/**` + `navigation.yaml` +
`${bundle}.md` + `${bundle}.mmd` MUST ser la única SoT de documentación funcional consumida
por UI (PCT-86); el bundle creado en REQ-DOC-001/002 MUST ser el destino de esa entrada.

**Escenarios**:
- Given `docs/app-map/navigation.yaml` sin la vista projectctl,
  When se aplica AC-002,
  Then `navigation.yaml` MUST contener el nodo `projectctl` con `bundle: views/projectctl/index`.
- Given la UI `/projectctl`,
  When se resuelve la documentación de la vista,
  Then MUST resolverse vía `navigation.yaml` → `views/projectctl/index` (única SoT, PCT-86).

### 3.3 REMOVED

#### REQ-DOC-004 — Superficie legacy `docs/01-product/quality-*.md` eliminada (REMOVED)

- **AC**: AC-002 · **Criterio estándar**: PCT-86 (TST-03, TST-12) · **Tipo**: REMOVED · **Prioridad**: MUST

**Requisito**: `docs/01-product/quality-plan.md` y `docs/01-product/quality-status.md`
(ambos presentes hoy, evidencia explore §2.3) MUST ser eliminados. La superficie
`docs/01-product/quality/**` MUST NO ser reescrita ni restaurada como SoT paralela; la
cobertura se escribe directamente en `criteria[].coverage` de los bundles
(`docs/app-map/**`), nunca en archivos paralelos (PCT-86, standard §1). Cualquier agente que
intente restaurar esa superficie está creando una SoT prohibida y MUST ser bloqueado por
`projectctl-requirements` §standard.

**Escenarios**:
- Given `docs/01-product/quality-plan.md` y `quality-status.md` presentes,
  When se aplica AC-002,
  Then ambos archivos MUST ser eliminados del árbol de docs.
- Given un agente que intenta reescribir/restaurar `docs/01-product/quality/**`,
  When se evalúa la acción contra la policy documental,
  Then MUST ser bloqueado (restauración prohibida; la cobertura vive en `criteria[].coverage`).
- Given la doc funcional de `/projectctl`,
  When se consulta la cobertura de criterios,
  Then MUST leerse de `docs/app-map/views/projectctl/index.md` (frontmatter `criteria[]`),
  no de `quality-status.md`.

---

## 4. Dominio TEST — AC-003 (Capability C4)

### 4.1 ADDED

#### REQ-TST-001 — Runner unificado `scripts/test-runner.ts` (ADDED)

- **AC**: AC-003 · **Criterio estándar**: PCT-89, PCT-90, PCT-91 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `scripts/test-runner.ts` (hoy `scripts/` ausente, evidencia
explore §3.1). El runner MUST soportar la invocación canónica
`bun run scripts/test-runner.ts run --method=<unit|pwauto|all> --target=<view>[:<feature>] [--persist]`
y MUST mapear 1:1 con los comandos `projectctl test *` (PCT-91). MUST incluir los helpers
`assertAcHeader` (Bun tests) y `assertAcHeaderSpec` (Playwright specs) que rechacen archivos
sin header AC (PCT-90/TST-03/TST-04). MUST rechazar en `results.json` cobertura de un
criterio sin AC mapeado (TST-10/AC-007).

**Escenarios**:
- Given el estado actual sin `scripts/`,
  When se aplica AC-003,
  Then `scripts/test-runner.ts` MUST existir y ser invocable vía Bun.
- Given `bun run scripts/test-runner.ts run --method=unit --target=projectctl`,
  When el runner descubre un archivo Bun-test sin header `// @ac`,
  Then MUST rechazar el archivo con error accionable (assertAcHeader).
- Given una corrida `--persist` con un criterio sin AC mapeado,
  When el runner genera `results.json`,
  Then MUST rechazar la cobertura de ese criterio (sin mapeo AC no se acepta, PCT-90).

#### REQ-TST-003 — `playwright/TEST_PLAN.md` (ADDED)

- **AC**: AC-003 · **Criterio estándar**: PCT-94 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `playwright/TEST_PLAN.md` (hoy `playwright/` ausente, evidencia
explore §3.1) con el mapping persistente archivo↔criterio (qué spec cubre qué PCT/AC),
incluyendo tier PW-AUTO y tier PW-CLI (PCT-94). El archivo SOLO cambia cuando nace o cambia
cobertura Playwright persistente (standard §2). No reemplaza `docs/app-map/**` como SoT.

**Escenarios**:
- Given el estado actual sin `playwright/`,
  When se aplica AC-003,
  Then `playwright/TEST_PLAN.md` MUST existir con mapping archivo↔criterio y tiers.
- Given una spec Playwright nueva con `@ac`,
  When se registra la cobertura,
  Then `playwright/TEST_PLAN.md` MUST actualizarse (si la cobertura es persistente).
- Given un cambio de cobertura documental,
  When se decide si tocar `playwright/TEST_PLAN.md`,
  Then MUST solo cambiar si nace/cambia cobertura Playwright persistente (no por corrida aislada).

#### REQ-TST-004 — Contrato AC mandatorio `// @ac <ID>` + annotations (ADDED)

- **AC**: AC-003 · **Criterio estándar**: PCT-90 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: Todo archivo Bun-test (`.test.ts`) y Playwright-spec (`.spec.ts`) MUST
declarar `// @ac <ID>` en las primeras 10 líneas. Toda spec Playwright MUST añadir
`test.info().annotations.push({ type: 'ac', description: '<ID>' })` (el runner cruza la
anotación con el header). El runner MUST rechazar archivos sin header (REQ-TST-001) y
`results.json` sin AC mapeado (PCT-90/TST-03/TST-04/TST-10).

**Escenarios**:
- Given un archivo Bun-test bajo `frontend/__tests__/**`,
  When el runner lo procesa,
  Then el header `// @ac <ID>` MUST estar en las primeras 10 líneas (si no, rechazo).
- Given una spec Playwright,
  When el runner la procesa,
  Then la anotación `test.info().annotations.push` MUST existir y coincidir con el header.
- Given un criterio cubierto por un test,
  When se valida la cobertura,
  Then MUST estar mapeado a un AC (no se acepta cobertura sin AC, TST-10/AC-007).

#### REQ-TST-006 — Layout canónico de tests/specs (ADDED)

- **AC**: AC-003 · **Criterio estándar**: PCT-93 (TST-36) · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: Los unit tests MUST seguir el layout canónico: 1 archivo por criterio, bajo
path frontend-side (`frontend/__tests__/`) o sandbox-side, con convención de 2 segmentos
`view/feature` (ej. `frontend/__tests__/projectctl-tabs.test.ts`). Las specs PW-AUTO MUST
seguir la misma convención bajo el workspace Playwright (repo raíz). Cada archivo MUST llevar
header `// @ac <ID>` (REQ-TST-004). La coverage matrix MUST sincronizarse vía
`patchBundleCoverage` contra `criteria[].coverage` (PCT-92/93).

**Escenarios**:
- Given un criterio PCT-* del bundle projectctl,
  When se crea su unit test,
  Then MUST existir 1 archivo bajo `frontend/__tests__/` con convención `view/feature` y
  header `// @ac PCT-*`.
- Given una spec PW-AUTO,
  When se ubica en el workspace Playwright,
  Then MUST seguir la convención de 2 segmentos view/feature y llevar header AC.

#### REQ-TST-007 — Tests `projectctl-*-bundle.test.ts` + `sot-coherence.test.ts` (ADDED)

- **AC**: AC-003 (AC-004 vía R-007) · **Criterio estándar**: PCT-89, PCT-90, PCT-106..121 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `frontend/__tests__/projectctl-*-bundle.test.ts` (validación de
bundle projectctl: 5 secciones MUST + `criteria[]` + `navigation.yaml`) y
`frontend/__tests__/projectctl-requirements.sot-coherence.test.ts` (gate R-007: paths
canónicos requeridos, locator/binding/projections, fuentes activas/excluidas y catálogos
duplicados; evidencia explore §3.4, ambos ausentes hoy). Ambos MUST llevar header AC
(REQ-TST-004).

**Escenarios**:
- Given el bundle `views/projectctl` creado (REQ-DOC-001),
  When corre `projectctl-*-bundle.test.ts`,
  Then MUST validar las 5 secciones MUST y el frontmatter `criteria[]`.
- Given `.agents/sdd-workflow.json` actualizado a v9.0.0 (REQ-TSK-001),
  When corre `projectctl-requirements.sot-coherence.test.ts`,
  Then MUST pasar validando locator/binding v9 y projections (gate R-007).
- Given una nueva afirmación anti-drift requerida,
  When se agrega al test,
  Then MUST añadirse explícitamente al `sot-coherence.test.ts` (no scanner genérico).

### 4.2 MODIFIED

#### REQ-TST-002 — Gate `bun run test:check` en `package.json` raíz (MODIFIED)

- **AC**: AC-003 · **Criterio estándar**: PCT-93 (TST-13) · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: El `package.json` raíz (hoy solo `test`, `test:back`, `test:front`) MUST
declarar el script `test:check` como gate de cobertura contractual. El gate MUST fallar si
existe un bundle con `functional: implemented` y `Unit + PW-AUTO` ambos en `missing`
(no ambos `covered`), mostrando qué bundle y criterio no satisfacen la cobertura mínima
(TST-13/PCT-93). El runner unificado (REQ-TST-001) MUST ser el mecanismo detrás del gate.

**Escenarios**:
- Given `package.json` raíz sin `test:check`,
  When se aplica AC-003,
  Then `bun run test:check` MUST existir como script y ser el gate contractual.
- Given un bundle con `functional: implemented` y cobertura `Unit: missing`, `PW-AUTO: missing`,
  When corre `bun run test:check`,
  Then MUST fallar e identificar bundle + criterio (TST-13).
- Given todos los bundles implementados con `Unit` o `PW-AUTO` en `covered`,
  When corre `bun run test:check`,
  Then MUST pasar.

#### REQ-TST-005 — Persistencia atómica `.runtime/test-results/` completada (MODIFIED)

- **AC**: AC-003 · **Criterio estándar**: PCT-92 (TST-04, TST-08, TST-11) · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: La persistencia canónica `.runtime/test-results/<projectId>/<run-id>/{unit,pwauto}/{junit.xml,results.json,summary.json}`
MUST completarse según el layout canónico. **Matiz de exploración**: el directorio NO está
vacío — ya existen 46 run-dirs con `summary.json`, 29 con `unit/junit.xml` + `unit/results.json`
+ `pwauto/results.json`; AC-003 MUST **completar/validar** el pipeline canónico (runner +
gate + TEST_PLAN + write-back `patchBundleCoverage`), NO recrear la persistencia desde cero.
El write-back MUST actualizar `criteria[].coverage[Unit | PW-AUTO]` del bundle impactado vía
`patchBundleCoverage` (`sandbox/src/services/test-results-writer.ts`, TST-04/TST-11). La
política de ignorado de `.runtime/`/`test-results/` (hoy no gitignored) SHOULD decidirse en
diseño (riesgo de colar artefactos runtime en el commit).

**Escenarios**:
- Given la persistencia parcial existente (46 runs, 29 con `unit/junit.xml`),
  When se aplica AC-003,
  Then el pipeline canónico MUST completarse preservando los runs existentes (no borrar/recrear).
- Given una corrida `--persist`,
  When el runner termina,
  Then MUST escribir `{unit,pwauto}/{junit.xml,results.json,summary.json}` bajo
  `.runtime/test-results/<projectId>/<run-id>/` (TST-08).
- Given un `summary.json` con status por criterio,
  When se ejecuta el write-back,
  Then `patchBundleCoverage` MUST actualizar `criteria[].coverage` del bundle impactado
  (cobertura `covered | partial | missing | not-applicable`, TST-11).

#### REQ-TST-008 — Config Playwright resoluble (`playwright.config.ts`) (MODIFIED)

- **AC**: AC-003 (AC-005) · **Criterio estándar**: PCT-93 · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: El symlink raíz `playwright.config.ts` está roto (apunta a
`frontend/playwright.config.ts` inexistente; evidencia explore §3.2). El estado objetivo MUST
tener una config Playwright resoluble por el runner y por `bunx playwright test`: se crea
`frontend/playwright.config.ts` (destino del symlink) o se repunta el symlink a un archivo
existente (decisión de diseño, scope AC-005). La config MUST declarar `PWAUTO_VIEWS` y el
contrato de discovery canónico que el gate y el runner consumen (PCT-93/TST-36). Los
fallbacks `playwright.config.cjs` / `playwright.config.js` MAY permanecer como contexto, pero
el runner MUST usar la config canónica.

**Escenarios**:
- Given `playwright.config.ts` como symlink roto,
  When se aplica AC-003/AC-005,
  Then la config MUST resolverse (target creado o symlink repunteado).
- Given `bunx playwright test` invocado por el runner,
  When se carga la config,
  Then MUST no fallar por target inexistente y MUST declarar `PWAUTO_VIEWS`.

---

## 5. Dominio TAREAS — AC-004 (Capabilities C5, C6)

### 5.1 MODIFIED

#### REQ-TSK-001 — Locator `.agents/sdd-workflow.json` pinnea binding v9.0.0 (MODIFIED)

- **AC**: AC-004 · **Criterio estándar**: PCT-106..121 (binding v9.0.0) · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: `.agents/sdd-workflow.json` (hoy pinnea `binding_version: 8.0.0`; evidencia
explore §4.1) MUST declarar `binding_version: 9.0.0` acorde al bloque `task-flow-binding`
(`projectctl-requirements` v10.0.0 / binding `projectctl-requirements.task-flow` v9.0.0).
El resto de campos del locator (`contract_version`, `binding_path`, `machine_block_id`,
`expected_binding_id`) MUST preservarse sin cambios. Solo se usan estados del
`status.writable` del binding (C6); los aliases retirados MUST NO re-introducirse como
writables ni como rutas de routing.

**Escenarios**:
- Given `.agents/sdd-workflow.json` con `binding_version: 8.0.0`,
  When se aplica AC-004,
  Then `binding_version` MUST ser `9.0.0` y el resto de campos MUST preservarse.
- Given la resolución de contexto del coordinador,
  When se valida contra el binding v9.0.0,
  Then MUST ser coherente (sin `binding_version_mismatch`).
- Given un estado retirado (`branching`, `pushing`, `ready_for_branch`, `verified`),
  When un agente intenta usarlo como status writable,
  Then MUST ser rechazado (solo `status.writable` del binding, C6).

#### REQ-TSK-003 — Estados retirados fuera de `taskReadme/*.md` (MODIFIED)

- **AC**: AC-004 · **Criterio estándar**: binding v9.0.0 (guardrail estados) · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: Los 4 archivos `taskReadme/*.md` que hoy contienen estados retirados
(`2026-04-17-test-task-for-state-{branching,pushing,ready-for-branch,verified}.md`; evidencia
explore §4.3) MUST quedar fuera del set de estados activos del taskReadme: el frontmatter
MUST NO declarar como `status` los valores retirados `branching`, `pushing`,
`ready_for_branch`, `verified`. La remoción MUST NO destruir historial: los archivos
permanecen como registro histórico (decisión de granularidad en diseño: actualizar frontmatter
a un estado válido del binding o mover a carpeta histórica; el trabajo contenido no se borra).

**Escenarios**:
- Given `taskReadme/2026-04-17-test-task-for-state-branching.md` con status `branching`,
  When se aplica AC-004,
  Then el frontmatter MUST usar un estado del `status.writable` del binding y el archivo
  MUST conservarse como historial (sin borrar trabajo).
- Given un escaneo de `taskReadme/*.md`,
  When se buscan los valores retirados como `status`,
  Then MUST NO existir ninguno (`branching`, `pushing`, `ready_for_branch`, `verified`).
- Given un estado retirado en contenido histórico,
  When un agente lo lee,
  Then MUST tratarlo como historial, no como estado operativo (prohibido re-introducir como
  writable o alias).

#### REQ-TSK-004 — Verificación `sot-coherence.test.ts` (gate R-007) (MODIFIED)

- **AC**: AC-004 · **Criterio estándar**: PCT-106..121, gate R-007 · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: El gate R-007 (`frontend/__tests__/projectctl-requirements.sot-coherence.test.ts`,
REQ-TST-007) MUST pasar tras AC-004, validando: locator pinnea v9.0.0, projections presentes,
fuentes activas/excluidas coherentes y ausencia de catálogos duplicados (maintenance §4).
Hoy el gate no existe (evidencia explore §3.4); AC-003 lo crea y AC-004 lo hace pasar.

**Escenarios**:
- Given locator actualizado a v9.0.0 y projections regeneradas (REQ-TSK-002),
  When corre `sot-coherence.test.ts`,
  Then MUST pasar sin fallos (gate R-007).
- Given una proyección ausente,
  When corre el gate,
  Then MUST fallar identificando el path ausente (R-007).

### 5.2 ADDED

#### REQ-TSK-002 — Projections client regeneradas (ADDED)

- **AC**: AC-004 · **Criterio estándar**: PCT-106..121 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` y
`frontend/src/shared/sdd/task-flow.generated.ts` (ambas ausentes hoy; evidencia explore §4.2),
regeneradas vía `taskflow:generate` (owner `sdd-apply-code-high` per `maintenance.md` §8).
Ambas MUST ser coherentes con el binding v9.0.0 (proyección derivada, no autoritativa) y
resolubles por `sot-coherence.test.ts` (REQ-TST-007).

**Escenarios**:
- Given el binding v9.0.0 y el locator actualizado,
  When se ejecuta `taskflow:generate`,
  Then MUST producir `frontend/src/views/projectctl/data/tareas-tab.view-model.ts` y
  `frontend/src/shared/sdd/task-flow.generated.ts`.
- Given las projections regeneradas,
  When corre `sot-coherence.test.ts`,
  Then MUST validar su presencia y coherencia (R-007).
- Given una projection desactualizada vs binding v9,
  When se compara contra el binding,
  Then MUST marcarse como drift (proyección derivada no autoritativa; se regenera, no se
  edita a mano).

---

## 6. Dominio CROSS — AC-005 (Capability C7)

### 6.1 ADDED

#### REQ-CRS-001 — `AGENTS.md` presente (ADDED)

- **AC**: AC-005 · **Criterio estándar**: standard §1 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `AGENTS.md` en la raíz (ausente hoy, evidencia explore §5) como
fuente de revisión de agentes (directrices de persona/operación del repo), coherente con
`docs/00-context/agents_skills.md` (REQ-CRS-003) y `projectctl-requirements` §standard 1.

**Escenarios**:
- Given el estado actual sin `AGENTS.md` en raíz,
  When se aplica AC-005,
  Then `AGENTS.md` MUST existir en la raíz del repo.
- Given un agente nuevo,
  When consulta las reglas de operación del repo,
  Then MUST poder leerlas desde `AGENTS.md`.

#### REQ-CRS-002 — `README.md` presente (ADDED)

- **AC**: AC-005 · **Criterio estándar**: standard §1 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `README.md` en la raíz (ausente hoy, evidencia explore §5) con la
descripción del proyecto y puntos de entrada (ruta `/projectctl`, docs, tests), sin duplicar
policy de skills.

**Escenarios**:
- Given el estado actual sin `README.md` en raíz,
  When se aplica AC-005,
  Then `README.md` MUST existir en la raíz.

#### REQ-CRS-003 — `docs/00-context/agents_skills.md` presente (ADDED)

- **AC**: AC-005 · **Criterio estándar**: standard §1, doc.md PCT-88 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `docs/00-context/agents_skills.md` (ausente hoy — no existe
`docs/00-context/`; evidencia explore §5) documentando el registro de skills del repo
(§6 en doc.md referencia), coherente con `.atl/skill-registry.md` (REQ-CRS-005) y con
`projectctl-requirements`.

**Escenarios**:
- Given el estado actual sin `docs/00-context/`,
  When se aplica AC-005,
  Then `docs/00-context/agents_skills.md` MUST existir documentando skills del repo.

#### REQ-CRS-004 — `docs/04-process/task.md` presente (ADDED)

- **AC**: AC-005 · **Criterio estándar**: standard §1, doc.md PCT-87 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `docs/04-process/task.md` (ausente hoy — no existe
`docs/04-process/`; evidencia explore §5) como guía del flujo de tareas del repo
(referenciada por standard §1 y por PCT-87), alineada con el binding v9.0.0 (SIN publicar un
catálogo paralelo de estados/lanes/gates — solo referencia el bloque `task-flow-binding`).

**Escenarios**:
- Given el estado actual sin `docs/04-process/`,
  When se aplica AC-005,
  Then `docs/04-process/task.md` MUST existir y referenciar el flujo de tareas.
- Given el documento del flujo,
  When un agente busca valores normativos (estados, lanes, gates),
  Then el doc MUST citar el bloque `task-flow-binding` v9.0.0 como única SoT, sin duplicar
  catálogos (standard §5).

#### REQ-CRS-005 — `.atl/skill-registry.md` presente (ADDED)

- **AC**: AC-005 · **Criterio estándar**: standard §1 · **Tipo**: ADDED · **Prioridad**: MUST

**Requisito**: MUST existir `.atl/skill-registry.md` (ausente hoy — no existe `.atl/`;
evidencia explore §5) con el registro de skills instaladas (incluida `sandbox-runtime-policy`
de REQ-ENT-006 y `projectctl-requirements`), generado/actualizado per `maintenance.md` §10
(coordinator-only para regeneración). Debe ser coherente con `docs/00-context/agents_skills.md`.

**Escenarios**:
- Given el estado actual sin `.atl/`,
  When se aplica AC-005,
  Then `.atl/skill-registry.md` MUST existir con el registro de skills del repo.
- Given una skill instalada nueva (p.ej. `sandbox-runtime-policy`),
  When se regenera el registro,
  Then MUST quedar registrada en `.atl/skill-registry.md`.

### 6.2 MODIFIED

#### REQ-CRS-006 — Symlink `playwright.config.ts` reparado (MODIFIED)

- **AC**: AC-005 (AC-003) · **Criterio estándar**: PCT-93 · **Tipo**: MODIFIED · **Prioridad**: MUST

**Requisito**: El symlink raíz `playwright.config.ts` (roto: apunta a
`frontend/playwright.config.ts` inexistente) MUST quedar válido: se crea
`frontend/playwright.config.ts` como destino o se repunta el symlink a un archivo existente
(REQ-TST-008 comparte la misma decisión; scope coordinado AC-003/AC-005). El estado objetivo
MUST permitir que `bunx playwright test` y el runner resuelvan la config sin fallos.

**Escenarios**:
- Given `playwright.config.ts` como symlink roto,
  When se aplica AC-005,
  Then el symlink MUST apuntar a un target existente y resolverse.
- Given el runner (`scripts/test-runner.ts`) invocando Playwright,
  When carga `playwright.config.ts`,
  Then MUST resolver la config canónica (sin fallback implícito requerido).

---

## 7. Matriz de trazabilidad REQ → AC → PCT

| REQ | Dominio | AC | Criterio estándar (PCT) | Tipo |
|---|---|---|---|---|
| REQ-ENT-001 | ENTORNO | AC-001 (C1, C2) | PCT-95, PCT-97 | ADDED |
| REQ-ENT-002 | ENTORNO | AC-001 (C1) | PCT-96, PCT-98 | ADDED |
| REQ-ENT-003 | ENTORNO | AC-001 (C1) | PCT-96, PCT-98 | ADDED |
| REQ-ENT-004 | ENTORNO | AC-001 (C1) | PCT-96 | MODIFIED |
| REQ-ENT-005 | ENTORNO | AC-001 (C1) | PCT-95, PCT-96, PCT-98 | ADDED |
| REQ-ENT-006 | ENTORNO | AC-001 (C1) | PCT-99 | ADDED |
| REQ-ENT-007 | ENTORNO | AC-001 (C2) | PCT-97, PCT-38 | MODIFIED |
| REQ-ENT-008 | ENTORNO | AC-001 (C2), cierre (C6) | PCT-96, PCT-99 | MODIFIED |
| REQ-DOC-001 | DOCS | AC-002 (C3) | PCT-83, PCT-84, PCT-85, PCT-88 | ADDED |
| REQ-DOC-002 | DOCS | AC-002 (C3) | PCT-84 | ADDED |
| REQ-DOC-003 | DOCS | AC-002 (C3) | PCT-86, PCT-87 | MODIFIED |
| REQ-DOC-004 | DOCS | AC-002 (C3) | PCT-86 (TST-03, TST-12) | REMOVED |
| REQ-DOC-005 | DOCS | AC-002 (C3) | PCT-88 | ADDED |
| REQ-TST-001 | TEST | AC-003 (C4) | PCT-89, PCT-90, PCT-91 | ADDED |
| REQ-TST-002 | TEST | AC-003 (C4) | PCT-93 (TST-13) | MODIFIED |
| REQ-TST-003 | TEST | AC-003 (C4) | PCT-94 | ADDED |
| REQ-TST-004 | TEST | AC-003 (C4) | PCT-90 | ADDED |
| REQ-TST-005 | TEST | AC-003 (C4) | PCT-92 (TST-04, TST-08, TST-11) | MODIFIED |
| REQ-TST-006 | TEST | AC-003 (C4) | PCT-93 (TST-36) | ADDED |
| REQ-TST-007 | TEST | AC-003 (C4), AC-004 (R-007) | PCT-89, PCT-90, PCT-106..121 | ADDED |
| REQ-TST-008 | TEST | AC-003 (C4), AC-005 | PCT-93 | MODIFIED |
| REQ-TSK-001 | TAREAS | AC-004 (C6) | PCT-106..121 | MODIFIED |
| REQ-TSK-002 | TAREAS | AC-004 (C5) | PCT-106..121 | ADDED |
| REQ-TSK-003 | TAREAS | AC-004 (C6) | binding v9.0.0 guardrail estados | MODIFIED |
| REQ-TSK-004 | TAREAS | AC-004 (C5) | PCT-106..121, gate R-007 | MODIFIED |
| REQ-CRS-001 | CROSS | AC-005 (C7) | standard §1 | ADDED |
| REQ-CRS-002 | CROSS | AC-005 (C7) | standard §1 | ADDED |
| REQ-CRS-003 | CROSS | AC-005 (C7) | standard §1, PCT-88 | ADDED |
| REQ-CRS-004 | CROSS | AC-005 (C7) | standard §1, PCT-87 | ADDED |
| REQ-CRS-005 | CROSS | AC-005 (C7) | standard §1 | ADDED |
| REQ-CRS-006 | CROSS | AC-005 (C7), AC-003 | PCT-93 | MODIFIED |

Cobertura: **AC-001..AC-005** (íntegros); Capabilities **C1..C7**; criterios estándar
**PCT-38, PCT-83..PCT-100, PCT-106..PCT-121** + gates R-007 / TST-03 / TST-04 / TST-08 /
TST-10 / TST-11 / TST-12 / TST-13 / TST-36 citados como evidencia contractual.

---

## 8. Done condition y notas de diseño (para `sdd-design`)

- **Done de esta lane**: spec delta completo con estructura ADDED/MODIFIED/REMOVED, escenarios
  Given/When/Then y keywords RFC 2119 en todos los REQ; trazabilidad REQ → AC → PCT; nada más
  modificado (único write: este artifact).
- **Decisiones abiertas para diseño** (no son requisitos; el spec las deja explícitas):
  1. `docker-compose*.yml` → `compose.yml`/`compose.dev.yml`: ¿renombrar (git mv) o recrear? (REQ-ENT-004).
  2. Política de `.gitignore` para `.runtime/` y `test-results/` (hoy no ignorados; REQ-TST-005).
  3. Entrega de `.env`/`.env.dev` gitignored: `force-add required` vs `policy review required` (REQ-ENT-001; riesgo §9).
  4. Granularidad del retiro de estados en taskReadme: ¿frontmatter a estado válido o carpeta histórica? (REQ-TSK-003).
  5. Symlink `playwright.config.ts`: ¿crear `frontend/playwright.config.ts` o repuntar? (REQ-CRS-006/REQ-TST-008).

---

## 9. Riesgos (para el índice)

| Riesgo | Clasificación de entrega | REQ afectado |
|---|---|---|
| `.env` / `.env.dev` gitignored → no stageables por flujo normal | `policy review required` (posible `force-add required`) | REQ-ENT-001 |
| `.runtime/` / `test-results/` no gitignored → artefactos runtime en commit | `policy review required` (decidir en diseño) | REQ-TST-005 |
| Persistencia test parcial (46 runs, 29 con junit.xml) — completar, no recrear | Normal (fase artifact de runtime, no commit) | REQ-TST-005 |
| Symlink `playwright.config.ts` roto (target inexistente) | Normal (se repara en AC-005) | REQ-CRS-006, REQ-TST-008 |
| Estados retirados en taskReadme = historial; retirar sin borrar | Normal (archivos de taskReadme en repo) | REQ-TSK-003 |

**File-surface check (obligatorio §D)**: el único archivo tocado por esta lane es
`taskReadme/20260825-bhbr8k-remediacion-compatibilidad-projectctl-entornos-docs-tests/spec.md`
(phase artifact canónico bajo `taskReadme/`, dentro de la superficie de commit normal del
repo). Sin riesgo de delivery-surface conocido para este write; los riesgos de archivos
gitignored/runtime listados arriba corresponden a entregas de fases posteriores (apply),
no a este artifact.

---

**criteria_covered**: AC-001..AC-005
**next_recommended**: `sdd-design` (design técnico; resuelve las 5 decisiones abiertas §8) → luego `sdd-tasks` (gate `planning_artifacts_complete`).
